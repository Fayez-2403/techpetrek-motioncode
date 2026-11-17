// Look-dev stills of the final reel: seek to each reel time, wait for the world to build, save the canvas (1080x1920 JPEG).
//   bun scripts/stills_final.ts <out dir> <t1> <t2> ...      (needs the dev server: REEL_URL, default :54221/?reel=final)
import { chromium } from 'playwright-core';
import { mkdirSync, writeFileSync } from 'node:fs';
const [out, ...ts] = process.argv.slice(2); mkdirSync(out, { recursive: true });
const b = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
p.on('pageerror', (e) => console.log('PAGEERROR', e.message));
await p.goto(process.env.REEL_URL ?? 'http://localhost:54221/?reel=final', { waitUntil: 'networkidle' });
await p.waitForFunction(() => (window as any).__ac?.engine.analysis && (window as any).__reel, null, { timeout: 120000 });
await p.evaluate(() => (window as any).__reel.prepare());
const raf = () => p.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(0)))));
for (const arg of ts) {   // "12.5" = the main picture at 12.5 s; "0.9B" = layer B (the hook's lower split-screen half)
  const t = parseFloat(arg), layer = arg.endsWith('B') ? 'B' : '';
  await p.evaluate(([r, l]) => (window as any).__reel.seek(r, l), [t - 0.25, layer] as const); await p.waitForTimeout(1500);   // build the shot's world
  let id = '';
  for (let k = 15; k >= 0; k--) { id = await p.evaluate(([r, l]) => (window as any).__reel.seek(r, l), [t - k / 60, layer] as const); await raf(); }   // settle the frames before t
  const b64: string = await p.evaluate(() => (document.querySelector('canvas') as HTMLCanvasElement).toDataURL('image/jpeg', 0.9).slice(23));
  writeFileSync(`${out}/t${t.toFixed(2)}${layer}_${id}.jpg`, Buffer.from(b64, 'base64'));
  console.log(t, id);
}
await b.close();
