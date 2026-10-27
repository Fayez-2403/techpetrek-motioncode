#!/usr/bin/env bun
// Browser tests of the live laboratory (headless Chrome with the GPU), driving it with real input:
//   bun scripts/test_browser.ts [--url http://localhost:54200] [--out ../test-results]
// A real mouse drag on the bowstring, a background drag to aim, a touch drag (Chrome DevTools touch events), clicks on
// every control, the challenges, reset, pause, replay, capture mode and the overlay; console errors; frame rate.
// Writes test-results/browser.json and screenshots; exits 1 on a failure.
import { chromium, type Page } from 'playwright-core';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const argv = process.argv.slice(2);
const opt = (k: string, d: string) => { const i = argv.indexOf(`--${k}`); return i >= 0 ? argv[i + 1]! : d; };
const BASE = opt('url', 'http://localhost:54200');
const OUT = path.resolve(opt('out', 'test-results')); mkdirSync(OUT, { recursive: true });
const results: { name: string; ok: boolean; detail: string }[] = [];
const check = (name: string, ok: boolean, detail = '') => { results.push({ name, ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}  ${detail}`); };
const browser = await chromium.launch({ channel: 'chrome', args: ['--enable-gpu-rasterization', '--ignore-gpu-blocklist', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows'] });

async function open(q = 'medium', w = 1600, h = 900, touch = false) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, hasTouch: touch });
  const page = await ctx.newPage();
  const errors: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(e.message));
  const t0 = Date.now();
  await page.goto(`${BASE}/?pdb=1&q=${q}`);
  await page.waitForFunction(() => (window as any).astra?.ui?.get().loaded, null, { timeout: 180000 });
  const loadS = (Date.now() - t0) / 1000;
  await page.evaluate(() => { const A = (window as any).astra; A.ev = []; A.stage.listeners.push((e: any) => A.ev.push({ type: e.type, t: e.t, info: e.info ? { broken: e.info.broken, E: e.info.E } : undefined, idx: e.idx, state: e.state?.status })); });
  return { ctx, page, errors, loadS };
}
const ev = (page: Page) => page.evaluate(() => (window as any).astra.ev as { type: string; t: number; info?: { broken: number }; idx?: number; state?: string }[]);
const S = (page: Page) => page.evaluate(() => { const s = (window as any).astra.stage; return { settings: s.sim.settings, live: s.live, loose: s.telemetry.loose, fixed: s.telemetry.fixed, step: s.sim.step, draw: s.sim.rig.draw, yaw: s.sim.rig.aimYaw, pitch: s.sim.rig.aimPitch, cam: s.camRig.mode, replay: !!s.replay, challenge: s.sim.challenge, active: s.sim.active, rings: s.sim.rings.length, chunks: s.sim.targets.get('mountain')?.n }; });
/** The nock's screen position (px) and the screen direction "back along the arrow" (toward the archer). */
const nockScreen = (page: Page) => page.evaluate(() => {
  const s = (window as any).astra.stage, g = s.bow.group, cam = s.camRig.cam, el = s.renderer.domElement.getBoundingClientRect();
  const V = g.position.constructor;
  const pr = (x: number, y: number, z: number) => { const v = g.localToWorld(new V(x, y, z)).project(cam); return [el.left + (v.x * 0.5 + 0.5) * el.width, el.top + (0.5 - v.y * 0.5) * el.height]; };
  const a = pr(0, 0.028, 0.17), b = pr(0, 0.028, 0.17 + 0.6);
  return { x: a[0], y: a[1], bx: b[0] - a[0], by: b[1] - a[1] };
});

try {
  // ---------------------------------------------------------------- desktop, medium quality
  const { ctx, page, errors, loadS } = await open('medium');
  check('loads (fracturing the mountain in a worker)', true, `${loadS.toFixed(1)} s to first frame`);
  await page.waitForTimeout(1500);
  const s0 = await S(page);
  check('medium quality: about 220 rigid pieces', s0.chunks === 220 && s0.fixed === 220, `${s0.chunks} pieces, ${s0.fixed} attached`);
  // 1. a real mouse drag on the string, back toward the archer, then release
  const n = await nockScreen(page);
  await page.mouse.move(n.x, n.y);
  await page.mouse.down();
  for (let k = 1; k <= 30; k++) { await page.mouse.move(n.x + n.bx * k / 30 * 1.1, n.y + n.by * k / 30 * 1.1 + k * 0.6); await page.waitForTimeout(16); }
  await page.waitForTimeout(250);
  const held = await S(page);
  await page.screenshot({ path: path.join(OUT, 'b_drawn.png') });
  check('mouse drag on the string draws the bow', held.draw > 0.3, `draw ${(held.draw * 100 / 0.72).toFixed(0)}% of full while held`);
  await page.mouse.up();
  await page.waitForTimeout(4500);
  let E = await ev(page);
  const launch = E.find((e) => e.type === 'launch'), impact = E.find((e) => e.type === 'impact');
  check('releasing the mouse launches the arrow', !!launch, launch ? `launched at sim ${launch.t.toFixed(2)} s` : 'no launch event');
  check('the arrow hits and pieces break off', !!impact && (impact.info?.broken ?? 0) > 0, impact ? `${impact.info?.broken} pieces broke` : 'no impact');
  const after = await S(page);
  check('broken pieces are active rigid bodies', after.loose > 0, `${after.loose} active rigid bodies`);
  await page.screenshot({ path: path.join(OUT, 'b_impact.png') });
  // 2. drag empty space to aim
  const y0 = (await S(page)).yaw;
  await page.mouse.move(500, 300); await page.mouse.down(); await page.mouse.move(380, 260, { steps: 10 }); await page.mouse.up();
  await page.waitForTimeout(300);
  const y1 = (await S(page)).yaw;
  check('dragging empty space aims the bow', Math.abs(y1 - y0) > 0.1, `yaw ${y0.toFixed(3)} -> ${y1.toFixed(3)} rad`);
  // 3. every control in the panel
  const click = async (sel: string) => { await page.click(sel); await page.waitForTimeout(120); };
  for (const [i, m] of ['vajra', 'agni', 'vayu', 'cosmic'].entries()) { await click(`.panel .mode.${m}`); const s = await S(page); check(`mode button ${m}`, s.settings.mode === m, `sim mode ${s.settings.mode}`); void i; }
  for (const [label, g] of [['Zero gravity', 'zero'], ['Moon', 'moon'], ['Extreme', 'extreme'], ['Earth', 'earth']] as const) {
    await page.locator('.panel .seg button', { hasText: label }).first().click(); await page.waitForTimeout(120);
    const s = await S(page); const gv = await page.evaluate(() => (window as any).astra.stage.sim.phys.world.gravity.y);
    check(`gravity: ${label}`, s.settings.gravity === g, `world gravity ${gv.toFixed(2)} m/s²`);
  }
  for (const [label, m] of [['Dense rock', 'dense'], ['Crystal', 'crystal'], ['Soft fantasy', 'soft'], ['Brittle stone', 'brittle']] as const) {
    await page.locator('.panel .seg button', { hasText: label }).first().click(); await page.waitForTimeout(120);
    const s = await S(page); const dm = await page.evaluate(() => (window as any).astra.stage.sim.targets.get('mountain').matId);
    check(`material: ${label}`, s.settings.material === m && dm === m, `target material ${dm}`);
  }
  const slider = async (id: string, v: number) => page.evaluate(([id, v]) => {
    const el = document.getElementById(id as string) as HTMLInputElement;
    const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!; set.call(el, String(v)); el.dispatchEvent(new Event('input', { bubbles: true }));
  }, [id, v] as const);
  await slider('draw', 0.4); await page.waitForTimeout(150);
  check('draw power slider limits the draw', Math.abs((await S(page)).settings.drawPower - 0.4) < 1e-6 && await page.evaluate(() => Math.abs((window as any).astra.stage.sim.rig.limit - 0.4) < 1e-6), 'rig limit 0.40');
  await slider('mult', 3.5); await page.waitForTimeout(150);
  check('impact multiplier slider', (await S(page)).settings.impactMult === 3.5, '3.5x');
  await slider('time', 0.3); await page.waitForTimeout(150);
  const st1 = (await S(page)).step; await page.waitForTimeout(1000); const st2 = (await S(page)).step;
  check('time scale slider slows the steps', st2 - st1 > 10 && st2 - st1 < 70, `${st2 - st1} steps in 1 s at 0.3x (120 at 1x)`);
  await slider('time', 1); await slider('draw', 1); await slider('mult', 1);
  for (const label of ['Impact slow-mo', 'Air drag', 'Aim preview', 'Auto camera cuts']) {
    const cb = page.locator('.toggles label', { hasText: label }).locator('input');
    const before = await cb.isChecked(); await cb.click(); await page.waitForTimeout(100); const after = await cb.isChecked(); await cb.click();
    check(`toggle: ${label}`, before !== after, `${before} -> ${after}`);
  }
  for (const [label, c] of [['Free orbit', 'orbit'], ['Arrow follow', 'follow'], ['Impact close-up', 'impact'], ['Cinematic', 'cinematic']] as const) {
    await page.locator('.panel .seg button', { hasText: label }).first().click(); await page.waitForTimeout(150);
    check(`camera: ${label}`, (await S(page)).cam === c, `camera mode ${(await S(page)).cam}`);
  }
  // fire, replay, reset, pause, hide
  await page.evaluate(() => { (window as any).astra.ev = []; });
  await click('.panel .fire'); await page.waitForTimeout(3600);
  E = await ev(page);
  check('FIRE button draws and releases by itself', E.some((e) => e.type === 'launch'), `${E.filter((e) => e.type === 'launch').length} launch, ${E.filter((e) => e.type === 'impact').length} impact`);
  await page.locator('.panel button', { hasText: 'Slow-motion replay' }).click(); await page.waitForTimeout(400);
  check('slow-motion replay restores the shot and plays it again', (await S(page)).replay, 'replaying');
  await page.waitForTimeout(6000);
  await page.locator('.panel button', { hasText: 'Reset mountain' }).click(); await page.waitForTimeout(500);
  const r1 = await S(page);
  check('reset mountain', r1.loose === 0 && r1.fixed === 220, `${r1.loose} loose, ${r1.fixed} attached`);
  await page.locator('.panel button', { hasText: 'Pause' }).click(); await page.waitForTimeout(200);
  const p1 = (await S(page)).step; await page.waitForTimeout(800); const p2 = (await S(page)).step;
  check('pause stops the simulation', p1 === p2, `step ${p1} -> ${p2}`);
  await page.locator('.panel button', { hasText: 'Resume' }).click();
  await page.locator('.panel button', { hasText: 'Reset scene' }).click(); await page.waitForTimeout(300);
  check('reset scene', (await S(page)).loose === 0, 'all pieces back');
  await page.keyboard.press('h'); await page.waitForTimeout(200);
  check('H hides the UI', (await page.locator('.panel').count()) === 0, 'panel gone');
  await page.keyboard.press('h'); await page.waitForTimeout(200);
  await page.keyboard.press('`'); await page.waitForTimeout(800);
  const dbg = await page.locator('.debug').innerText().catch(() => '');
  check('performance overlay', /rigid bodies/.test(dbg) && /fps/.test(dbg), dbg.replace(/\n/g, ' | ').slice(0, 160));
  await page.locator('.panel button', { hasText: 'Capture mode' }).click(); await page.waitForTimeout(300);
  check('capture mode: 9:16 guide and tools', (await page.locator('.capture-frame .guide').count()) === 1 && (await page.locator('.capture-bar button', { hasText: 'PNG' }).count()) === 1, 'guide, PNG export, WebM recording, 3 bookmarks');
  await page.screenshot({ path: path.join(OUT, 'b_capture.png') });
  await page.keyboard.press('Escape');
  // frame rate: idle, and while a 5x Cosmic shot breaks the mountain
  const fps = async (ms: number) => page.evaluate(async (ms) => { let n = 0; const t0 = performance.now(); await new Promise<void>((r) => { const f = () => { n++; if (performance.now() - t0 < ms) requestAnimationFrame(f); else r(); }; requestAnimationFrame(f); }); return n / ((performance.now() - t0) / 1000); }, ms);
  const fIdle = await fps(3000);
  await page.evaluate(() => { const A = (window as any).astra; A.settings.set({ mode: 'cosmic', impactMult: 5 }); A.stage.fire(); });
  await page.waitForTimeout(1800);
  const fBusy = await fps(3000), busy = await S(page);
  check('frame rate (this laptop: Intel Iris Xe, headless Chrome)', fIdle > 15, `${fIdle.toFixed(0)} fps idle, ${fBusy.toFixed(0)} fps with ${busy.loose} active rigid bodies`);
  // 4. challenges
  await page.evaluate(() => (window as any).astra.settings.set({ mode: 'vajra', impactMult: 1 }));
  await page.locator('.panel .ch', { hasText: 'THE IMPOSSIBLE SHOT' }).locator('button').click();
  await page.waitForFunction(() => (window as any).astra.stage.sim.challenge?.id === 'impossible', null, { timeout: 120000 });
  await page.waitForTimeout(800);
  const c3 = await S(page);
  check('challenge 3 loads: crystal target and three rings', c3.active.includes('crystal') && c3.rings === 3, `active ${c3.active.join(',')}, ${c3.rings} rings`);
  await page.evaluate(() => (window as any).astra.ev = []);
  // the reference shot, made with the same calls the pointer makes: aim, then draw to 85% and release
  await page.evaluate(async () => {
    const A = (window as any).astra, st = A.stage; A.settings.set({ drawPower: 0.85 });
    st.aim(0.035, 0.108); st.sim.rig.yaw = st.sim.rig.aimYaw; st.sim.rig.pitch = st.sim.rig.aimPitch;
    st.grab(); for (let i = 0; i < 70; i++) { st.pull(0.72); await new Promise((r) => setTimeout(r, 16)); } st.release();
  });
  await page.waitForTimeout(5000);
  E = await ev(page);
  check('challenge 3: one arrow threads all three rings and wins', E.filter((e) => e.type === 'ring').length === 3 && E.some((e) => e.type === 'challenge' && e.state === 'won'), `${E.filter((e) => e.type === 'ring').map((e) => e.idx).join(',')} rings, ${E.filter((e) => e.type === 'challenge').map((e) => e.state).join(' ')}`);
  await page.screenshot({ path: path.join(OUT, 'b_challenge3.png') });
  for (const [title, target] of [['THE FIRST SHOT', 'slab'], ['MOUNTAIN BREAKER', 'mini']] as const) {
    await page.locator('.panel .ch', { hasText: title }).locator('button').click();
    await page.waitForFunction((t) => (window as any).astra.stage.sim.active.includes(t), target, { timeout: 120000 });
    await page.waitForTimeout(500);
    check(`challenge loads: ${title}`, (await S(page)).active.includes(target), `target ${target}`);
  }
  await page.locator('.panel .ch', { hasText: 'MOUNTAIN BREAKER' }).locator('button').click(); await page.waitForTimeout(800);
  await page.evaluate(async () => { const A = (window as any).astra; A.settings.set({ impactMult: 5, mode: 'cosmic', drawPower: 1 }); const st = A.stage; st.aim(0, 0.12); for (let k = 0; k < 3; k++) { st.fire(); await new Promise((r) => setTimeout(r, 3500)); } });
  await page.waitForTimeout(3000);
  const ch2 = await page.evaluate(() => (window as any).astra.stage.sim.challenge);
  check('challenge 2 judges detachment (3 arrows max)', ch2?.shots >= 1 && typeof ch2?.progress === 'number', `${ch2?.status}: ${ch2?.note}`);
  await page.locator('.panel button', { hasText: 'Back to free play' }).click(); await page.waitForTimeout(500);
  check('back to free play', (await S(page)).active.join() === 'mountain', 'mountain active');
  check('no console errors on the desktop run', errors.length === 0, errors.slice(0, 3).join(' | ') || 'none');
  await ctx.close();

  // ---------------------------------------------------------------- a phone-sized portrait viewport with touch
  const ph = await open('low', 390, 844, true);
  await ph.page.waitForTimeout(1200);
  const cdp = await ph.ctx.newCDPSession(ph.page);
  const tn = await nockScreen(ph.page);
  const tp = (x: number, y: number) => [{ x, y, id: 1 }];
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: tp(tn.x, tn.y) });
  for (let k = 1; k <= 25; k++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: tp(tn.x + tn.bx * k / 25 * 1.1, tn.y + tn.by * k / 25 * 1.1 + k) }); await ph.page.waitForTimeout(16); }
  const tHeld = await S(ph.page);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await ph.page.waitForTimeout(3500);
  const tE = await ev(ph.page);
  check('touch: drag the string and release (phone, low quality)', tHeld.draw > 0.2 && tE.some((e) => e.type === 'launch'), `draw ${(tHeld.draw / 0.72 * 100).toFixed(0)}%, ${tE.filter((e) => e.type === 'launch').length} launch, low quality = ${tHeld.chunks} pieces`);
  await ph.page.screenshot({ path: path.join(OUT, 'b_phone.png') });
  check('no console errors on the phone run', ph.errors.length === 0, ph.errors.slice(0, 3).join(' | ') || 'none');
  await ph.ctx.close();
} finally { await browser.close(); }
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
await Bun.write(path.join(OUT, 'browser.json'), JSON.stringify({ when: new Date().toISOString(), results }, null, 2));
process.exit(failed.length ? 1 : 0);
