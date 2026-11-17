// Look-dev stills of the live app: drives the real store (the same actions the UI buttons call) and screenshots.
//   bun scripts/shots.ts [--w 1600 --h 900] [--only name1,name2] [--out ../out/wip]
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
const arg = (k: string, d: string) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const W = +arg('--w', '1600'), H = +arg('--h', '900'), OUT = arg('--out', '../out/wip'), only = arg('--only', '');
import { existsSync } from 'node:fs'; if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true,
  args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: W, height: H } });
const errs: string[] = [];
page.on('pageerror', (e) => errs.push(e.message)); page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
await page.goto(process.env.URL ?? 'http://localhost:54250/', { waitUntil: 'networkidle' });
await page.waitForTimeout(3500);
const act = (code: string) => page.evaluate(`(async () => { const S = window.__bx.useStore; const s = () => S.getState(); ${code} })()`);
const SHOTS: [string, string, number?][] = [
  ['01_hero', `s().set({ tutorial: true })`],
  ['02_run_axial', `s().set({ tutorial: false }); s().run(); s().set({ lens: 'axial' })`, 1500],
  ['03_deform', `s().set({ lens: 'deform' })`, 1500],
  ['04_util', `s().set({ lens: 'util' })`],
  ['05_elev', `s().set({ cam: 'xray', camNonce: s().camNonce + 1, lens: 'axial' })`, 2000],
  ['06_under', `s().set({ cam: 'under', camNonce: s().camNonce + 1, lens: 'path' })`, 2000],
  ['07_macro', `s().set({ cam: 'macro', camNonce: s().camNonce + 1, lens: 'real' })`, 2000],
  ['08_sunset', `s().set({ cam: 'sunset', camNonce: s().camNonce + 1 })`, 2000],
  ['09_gorge', `s().set({ cam: 'gorge', camNonce: s().camNonce + 1 })`, 2000],
  ['10_dirty', `s().set({ cam: 'hero', camNonce: s().camNonce + 1, lens: 'axial' }); s().edit((d) => ({ ...d, params: { ...d.params, height: 8 } }), 'test')`, 2000],
  ['11_city', `s().set({ env: 'city', cam: 'hero', camNonce: s().camNonce + 1 }); s().runBeam(); s().set({ lens: 'axial' })`, 2500],
  ['12_skyline', `s().set({ env: 'skyline', cam: 'sunset', camNonce: s().camNonce + 1 })`, 2500],
  ['13_night', `s().set({ env: 'gorge', night: true, cam: 'hero', camNonce: s().camNonce + 1, lens: 'real' })`, 2500],
  ['14_arcade', `s().set({ night: false, mode: 'arcade', cam: 'hero', camNonce: s().camNonce + 1 }); s().set({ arcade: { armed: true, t0: window.__bx.vclock.t + 0.3, nonce: 1 } })`, 2600],
];
for (const [name, code, wait] of SHOTS) {
  if (only && !only.split(',').includes(name)) { await act(code); continue; }
  await act(code); await page.waitForTimeout(wait ?? 1200);
  await page.screenshot({ path: `${OUT}/${name}.png` });
  console.log('shot', name);
}
console.log(errs.length ? 'ERRORS:\n' + [...new Set(errs)].slice(0, 10).join('\n') : 'no page errors');
await browser.close();
