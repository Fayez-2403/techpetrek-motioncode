// Reel look-dev: seek ?reel=1 to chosen seconds and save portrait PNGs (+ a contact sheet via sheet.py).
//   bun scripts/reel_stills.ts --t 0.5,2,5 [--out ../out/wip_reel] [--scale 0.5]
import { chromium } from 'playwright-core';
import { existsSync, mkdirSync } from 'node:fs';
const arg = (k: string, d: string) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const times = arg('--t', '1,6,13,16,23.5,25,27,29.5,33,38,46,52,55,59,66').split(',').map(Number), OUT = arg('--out', '../out/wip_reel'), scale = +arg('--scale', '0.5');
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: scale });
const errs: string[] = []; page.on('pageerror', (e) => errs.push(e.message));
await page.goto('http://localhost:54250/?reel=1', { waitUntil: 'networkidle' });
await page.waitForFunction(() => (window as any).__ready, null, { timeout: 120000 });
await page.evaluate(() => (window as any).seek(0)); await page.waitForTimeout(2500);
for (const t of times) {
  await page.evaluate((x) => (window as any).seek(x), t); await page.waitForTimeout(250);
  await page.screenshot({ path: `${OUT}/t${t.toFixed(2).padStart(6, '0')}.png` });
}
console.log(JSON.stringify(await page.evaluate(() => (window as any).__reelInfo())));
console.log(errs.length ? 'ERRORS ' + [...new Set(errs)].join(' | ') : 'no page errors');
await browser.close();
