// Visual QA stills: open the running app in Chrome, apply a preset / world / dancer count, pin the clock (engine.manual)
// at given song times and save screenshots.   bun scripts/shot.ts <out-dir> <json spec>
// spec: { preset?: number, world?: string, n?: number, times: number[], ui?: boolean, w?: number, h?: number, face?: string }
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const [out, specJson] = process.argv.slice(2);
const spec = JSON.parse(specJson ?? '{}');
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true,
  args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage({ viewport: { width: spec.w ?? 1600, height: spec.h ?? 900 }, deviceScaleFactor: 1 });
page.on('pageerror', (e) => console.log('PAGEERROR', e.message));
page.on('console', (m) => { if (m.type() === 'error') console.log('CONSOLE', m.text()); });
await page.goto(`http://localhost:${spec.port ?? 54210}/`, { waitUntil: 'networkidle' });
await page.waitForFunction(() => (window as any).__ac && (window as any).__ac.engine.analysis, null, { timeout: 120000 });
await page.evaluate(async (s) => {
  const ac = (window as any).__ac;
  if (s.preset !== undefined) { const id = ac.applyPreset(s.preset); if (id && id !== ac.engine.trackId) await ac.loadTrack(id); }
  if (s.world) ac.setState({ world: s.world });
  if (s.camera) ac.setState({ camera: s.camera });
  if (s.styles) { const mk = ac.getState().performers[0]; ac.setState({ performers: s.styles.map((st: string, i: number) => ({ ...mk, id: 'g' + i, style: st, look: { ...mk.look, outfit: ['street', 'hoodie', 'office', 'neon', 'chrome', 'festival'][i % 6] } })), crewMode: 'own', formation: 'line' }); }
  if (s.faces) for (const [i, url] of s.faces.entries()) console.log('faces found', await ac.addFace(url, i));
  if (s.ui === false) document.querySelector('.app')!.classList.add('reel');
}, spec);
await page.waitForTimeout(2500);
for (const t of spec.times ?? [10]) {
  await page.evaluate((tt) => { (window as any).__ac.engine.manual = tt; }, t);
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${out}/t${String(t).padStart(6, '0')}.png` });
  console.log('shot', t);
}
await browser.close();
