// Reel capture: frame-exact and offline. Seeks the app's ?reel=1 mode to every frame time (window.seek is pure in t),
// screenshots the page and pipes JPEGs to ffmpeg -> ../public/clips/<name>.mp4 (60 fps container, no audio).
//   bun scripts/capture.ts [--scale 0.5] [--every 2] [--from 0] [--to 70] [--name bridge_capture]
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';

const arg = (k: string, d: string) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const scale = +arg('--scale', '1'), every = +arg('--every', '1'), from = +arg('--from', '0'), to = +arg('--to', '70'), name = arg('--name', 'bridge_capture');
const OUT = '../public/clips'; if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true,
  args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-background-timer-throttling', '--disable-renderer-backgrounding'] });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: scale });
page.on('pageerror', (e) => console.log('PAGEERROR', e.message));
await page.goto((process.env.URL ?? 'http://localhost:54250/') + '?reel=1', { waitUntil: 'networkidle' });
await page.waitForFunction(() => (window as any).__ready, null, { timeout: 120000 });
await page.evaluate(() => (window as any).seek(0)); await page.waitForTimeout(2500);
const file = `${OUT}/${name}.mp4`;
const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(60 / every), '-c:v', 'mjpeg', '-i', '-',
  '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '14', '-pix_fmt', 'yuv420p', '-r', '60', file], { stdio: ['pipe', 'inherit', 'inherit'] });
const f0 = Math.round(from * 60), f1 = Math.round(to * 60), t0 = Date.now();
for (let f = f0; f < f1; f += every) {
  await page.evaluate((t) => (window as any).seek(t), f / 60);
  const jpg = await page.screenshot({ type: 'jpeg', quality: 92 });
  if (!ff.stdin.write(jpg)) await new Promise((r) => ff.stdin.once('drain', r));
  if ((f - f0) % 600 === 0) console.log(`frame ${f}/${f1}  ${((Date.now() - t0) / 1000).toFixed(0)} s`);
}
ff.stdin.end(); await new Promise((r) => ff.on('close', r));
console.log(`-> ${file}  ${((f1 - f0) / every)} frames in ${((Date.now() - t0) / 1000).toFixed(0)} s`);
await browser.close();
