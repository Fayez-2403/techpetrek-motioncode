#!/usr/bin/env bun
// The cover's background plate: a real frame of the live lab, not a painting. In free play at high quality it fires a
// Cosmic Fracture arrow into the mountain, lets the broken pieces float, grabs the string again and draws it to full,
// then pauses the simulation, hides the UI and renders that frozen state from one or more camera poses.
// --aim yaw,pitch turns the drawn bow (the drag-to-aim control does the same in the app).
//   bun scripts/poster.ts [--aim -1.57,0.35] --cams '[{"pos":[1,3,3],"look":[0,10,-118],"fov":50}]' [--scale 2] [--hold 1.2] [--out ../out/poster]
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const argv = process.argv.slice(2);
const opt = (k: string, d: string) => { const i = argv.indexOf(`--${k}`); return i >= 0 ? argv[i + 1]! : d; };
const scale = +opt('scale', '1'), hold = +opt('hold', '1.2'), out = path.resolve(opt('out', '../out/poster')); mkdirSync(out, { recursive: true });
const aim = opt('aim', '').split(',').filter(Boolean).map(Number);
const cams = JSON.parse(opt('cams', '[{"pos":[0.9,3.0,3.2],"look":[0,11,-118],"fov":50}]')) as { pos: number[]; look: number[]; fov: number; name?: string }[];

const browser = await chromium.launch({ channel: 'chrome', args: ['--enable-gpu-rasterization', '--ignore-gpu-blocklist', '--disable-background-timer-throttling', '--disable-renderer-backgrounding'] });
try {
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: scale });
  const errors: string[] = []; page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`${opt('url', 'http://localhost:54200')}/?q=high&pdb=1`);
  await page.waitForFunction(() => (window as any).astra?.ui?.get().loaded, null, { timeout: 180000 });
  await page.waitForTimeout(1500);
  // the shot: Cosmic Fracture from the default aim, no automatic camera cuts or aim preview
  await page.evaluate(() => {
    const A = (window as any).astra, s = A.stage;
    A.ui.set({ ui: false });
    s.applyLive({ mode: 'cosmic', autoCut: false, trajectory: false });
    A.hit = null; s.listeners.push((e: any) => { if (e.type === 'impact' && !A.hit) A.hit = { t: e.t, broken: e.info?.broken }; });
    s.fire();
  });
  await page.waitForFunction(() => (window as any).astra.hit, null, { timeout: 120000, polling: 200 });
  const hit = await page.evaluate(() => (window as any).astra.hit);
  console.log(`impact at sim ${hit.t.toFixed(2)} s, ${hit.broken} pieces broke`);
  // grab the string again at the impact and draw it to full (the auto-fire has already released), then let the pieces float
  await page.evaluate((aim) => { const s = (window as any).astra.stage; s.grab(); s.pull(0.72); if (aim.length === 2) s.aim(aim[0], aim[1]); }, aim);
  await page.waitForFunction((h) => { const r = (window as any).astra.stage.sim.rig; return (window as any).astra.stage.sim.t > h && r.draw > 0.7 && Math.abs(r.yaw - r.aimYaw) < 0.01 && Math.abs(r.pitch - r.aimPitch) < 0.01; }, hit.t + hold, { timeout: 120000, polling: 50 });
  const st = await page.evaluate(() => {
    const s = (window as any).astra.stage; s.applyLive({ paused: true });
    if (!s._uv) { s._uv = s.updateViews.bind(s); s.updateViews = (dt: number, o: any = {}) => s._uv(dt, { ...o, camera: false }); }
    return { t: s.sim.t, draw: s.sim.rig.draw, loose: s.telemetry.loose };
  });
  console.log(`frozen at sim ${st.t.toFixed(2)} s: draw ${(st.draw / 0.72 * 100).toFixed(0)}%, ${st.loose} loose rigid bodies`);
  for (const [i, c] of cams.entries()) {
    await page.evaluate(({ c, scale }) => {
      const s = (window as any).astra.stage, cam = s.camRig.cam;
      if (s.renderer.getPixelRatio() !== scale) { s.renderer.setPixelRatio(scale); s.setSize(1080, 1920); }
      cam.clearViewOffset(); cam.aspect = 1080 / 1920; cam.fov = c.fov;
      cam.position.set(c.pos[0], c.pos[1], c.pos[2]); cam.up.set(0, 1, 0); cam.lookAt(c.look[0], c.look[1], c.look[2]); cam.updateProjectionMatrix();
    }, { c, scale });
    await page.waitForTimeout(900);
    const f = path.join(out, `plate_${c.name ?? i}.png`);
    await page.screenshot({ path: f, type: 'png' });
    console.log(f, JSON.stringify(c));
  }
  if (errors.length) console.log('page errors:', errors.slice(0, 5).join(' | '));
} finally { await browser.close(); }
