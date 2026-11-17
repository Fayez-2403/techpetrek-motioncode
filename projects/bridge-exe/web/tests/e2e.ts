// Interaction tests on the running app (Playwright + the real mouse), the prompt's test matrix §21 "Interaction".
//   bun tests/e2e.ts            (needs the dev server on :54250)
import { chromium } from 'playwright-core';

const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
const errs: string[] = []; page.on('pageerror', (e) => errs.push(e.message));
await page.goto('http://localhost:54250/', { waitUntil: 'networkidle' }); await page.waitForTimeout(3500);
const S = <T,>(code: string) => page.evaluate(`(() => { const s = window.__bx.useStore.getState(); return ${code}; })()`) as Promise<T>;
let pass = 0, fail = 0;
const ok = (name: string, cond: boolean, info = '') => { cond ? pass++ : fail++; console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${info ? '   ' + info : ''}`); };
await page.click('text=GOT IT');

// 1. drag a top joint with the real mouse: geometry changes (snapped), member IDs stay
const before = await S<{ y: number; ids: string }>(`({ y: s.model.nodes.find(n => n.id === 'T4').y, ids: s.model.members.map(m => m.id).join() })`);
const [x, y] = await S<[number, number]>(`window.__bx.probe.T4`);
await page.mouse.move(x, y); await page.mouse.down(); await page.waitForTimeout(120);
for (let k = 1; k <= 14; k++) { await page.mouse.move(x, y - k * 6); await page.waitForTimeout(30); }
await page.mouse.up(); await page.waitForTimeout(300);
const after = await S<{ y: number; ids: string; dy: number; hist: number }>(`({ y: s.model.nodes.find(n => n.id === 'T4').y, ids: s.model.members.map(m => m.id).join(), dy: s.design.params.offsets.T4?.dy ?? 0, hist: s.history.length })`);
ok('mouse drag moves T4 up, snapped to 0.25 m', after.y > before.y && Math.abs(after.dy / 0.25 - Math.round(after.dy / 0.25)) < 1e-9, `y ${before.y} → ${after.y} m`);
ok('member IDs unchanged by the drag', after.ids === before.ids);
ok('one drag = one undo step', after.hist === 1, `history ${after.hist}`);

// 2. RUN produces one current run; an edit makes it stale
await page.click('text=RUN ANALYSIS'); await page.waitForTimeout(300);
const r1 = await S<{ run: string; fresh: boolean; status: string }>(`({ run: s.result.runId, fresh: s.result.inputsHash === s.modelHash, status: s.result.status })`);
ok('RUN solves the current input', r1.status === 'solved' && r1.fresh, r1.run);
ok('status reads SOLVED · RESULTS CURRENT', await page.isVisible('text=SOLVED · RESULTS CURRENT'));
await S(`s.edit(d => ({ ...d, params: { ...d.params, height: 7 } }), 'test')`); await page.waitForTimeout(200);
ok('an edit marks the result stale (DIRTY — RERUN REQUIRED)', (await page.isVisible('.status.dirty')) && !(await S<boolean>(`s.result.inputsHash === s.modelHash`)));

// 3. UI numbers match the solver
await page.click('text=RUN ANALYSIS'); await page.waitForTimeout(300);
const mm = await S<number>(`s.result.metrics.maxAbsDisplacement_m * 1000`);
const shown = await page.textContent('.rail.right');
ok('panel shows the solver max deflection', !!shown && shown.includes(mm.toFixed(1) + ' mm'), mm.toFixed(1) + ' mm');

// 4. moving load: one static solve per position, results vary
await page.click('text=MOVING-LOAD SWEEP');
await page.waitForFunction(() => (window as any).__bx.useStore.getState().sweep?.done, null, { timeout: 20000 });
const sw = await S<{ n: number; min: number; max: number }>(`({ n: s.sweep.positions.length, min: Math.min(...s.sweep.maxDisp), max: Math.max(...s.sweep.maxDisp) })`);
ok('moving-load sweep varies with position', sw.n >= 17 && sw.max > sw.min * 1.05, `${sw.n} solves, ${(sw.min * 1000).toFixed(1)}–${(sw.max * 1000).toFixed(1)} mm`);

// 5. undo / redo / reset
const h0 = await S<number>(`s.design.params.height`);
await S(`s.edit(d => ({ ...d, params: { ...d.params, height: 9 } }), 'test')`); await page.keyboard.press('Control+z'); await page.waitForTimeout(100);
ok('undo restores the previous design', (await S<number>(`s.design.params.height`)) === h0);
await page.keyboard.press('Control+y'); await page.waitForTimeout(100);
ok('redo re-applies it', (await S<number>(`s.design.params.height`)) === 9);
await page.click('.hist >> text=RESET'); await page.waitForTimeout(200);
ok('reset returns the exact initial state', await S<boolean>(`s.design.params.height === 6 && Object.keys(s.design.params.offsets).length === 0 && s.result === null`));

// 6. inspector: correct member, units
await S(`(s.run(), s.set({ selected: 'BC4' }))`); await page.waitForTimeout(400);
const tag = await page.textContent('.tag-sel');
const n4 = await S<number>(`s.result.members.find(m => m.id === 'BC4').axial_N / 1000`);
ok('inspector shows the selected member in kN and MPa', !!tag && tag.includes('BC4') && tag.includes(`${n4.toFixed(0)} kN`) && tag.includes('MPa'), tag?.replace(/\s+/g, ' ').slice(0, 70));

// 7. unstable model: readable error, no numbers
await S(`s.edit(d => ({ ...d, params: { ...d.params, removed: ['D2'] } }), 'test')`); await page.click('text=RUN ANALYSIS'); await page.waitForTimeout(200);
ok('missing member → MODEL UNSTABLE with a reason', (await page.isVisible('.status.bad')) && ((await page.textContent('.reasons')) ?? '').includes('Counting rule'));

// 8. a challenge completes only on a real result
await page.click('text=CHALLENGES'); await page.click('text=2. THE MISSING MEMBER'); await page.waitForTimeout(300);
await page.click('text=RUN ANALYSIS'); await page.waitForTimeout(600);
ok('challenge 2 not complete while unstable', !(await page.isVisible('text=THE MISSING MEMBER — COMPLETE')));
await S(`s.edit(d => ({ ...d, params: { ...d.params, added: [{ id: 'X1', a: 'T2', b: 'B3' }] } }), 'test')`); await page.click('text=RUN ANALYSIS'); await page.waitForTimeout(800);
ok('challenge 2 completes after a stabilising member + solve', await page.isVisible('text=THE MISSING MEMBER — COMPLETE'));
await page.click('.ch-card >> text=CLOSE');

// 9. arcade: prominent disclaimer; reset clears it
await S(`s.reset()`);
await page.click('text=ENTER ARCADE MODE'); await page.waitForTimeout(200);
ok('arcade shows STYLIZED FAILURE — NOT AN ENGINEERING PREDICTION', await page.isVisible('text=STYLIZED FAILURE — NOT AN ENGINEERING PREDICTION'));
await page.click('text=TRIGGER');
await page.waitForFunction(() => !!(window as any).__bx.useStore.getState().arcadeInfo, null, { timeout: 30000 }); await page.waitForTimeout(1500);
ok('arcade runs with counted rigid bodies', (await S<number>(`s.arcadeInfo.bodies`)) > 20, `${await S<number>(`s.arcadeInfo.bodies`)} bodies`);
await page.click('text=RESET BRIDGE'); await page.waitForTimeout(500);
ok('arcade reset disarms the rig and shows the bridge again', await S<boolean>(`!s.arcade.armed`));

console.log(`\n${pass} passed, ${fail} failed${errs.length ? '\npage errors: ' + [...new Set(errs)].join(' | ') : ''}`);
await browser.close();
process.exit(fail ? 1 : 0);
