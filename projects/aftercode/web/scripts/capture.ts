// Reel capture: frame-exact, offline. For each 3D shot, seek the app to every frame time (pure seek), wait for the frame to
// render, screenshot the canvas and pipe JPEGs to ffmpeg -> ../reel/clips/<shot>.mp4 (1080x1920, 60 fps, no audio).
//   bun scripts/capture.ts [shotId ...] [--every N] (default: all 3D shots)
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { mkdirSync, existsSync, statSync } from 'node:fs';

const args = process.argv.slice(2), every = +(args[args.indexOf('--every') + 1] || 1) || 1;
const want = args.filter((a, i) => !a.startsWith('--') && args[i - 1] !== '--every');
const OUT = process.env.OUT ?? '../reel/clips'; if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true,
  args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-background-timer-throttling', '--disable-renderer-backgrounding'] });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
page.on('pageerror', (e) => console.log('PAGEERROR', e.message));
await page.goto('http://localhost:54210/?reel=1', { waitUntil: 'networkidle' });
await page.waitForFunction(() => (window as any).__ac?.engine.analysis && (window as any).__reel, null, { timeout: 120000 });
console.log('songs', await page.evaluate(() => (window as any).__reel.prepare()));
const shots: { id: string; r0: number; r1: number }[] = await page.evaluate(() => (window as any).__reel.shots);
const raf = () => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(0)))));
for (const s of shots) {
  if (want.length && !want.includes(s.id)) continue;
  const file = `${OUT}/${s.id}.mp4`;
  if (!want.length && existsSync(file) && statSync(file).size > 50000) { console.log('skip', s.id); continue; }
  const f0 = Math.round(s.r0 * 60), f1 = Math.round(s.r1 * 60);
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(60 / every), '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'veryfast', '-threads', '2', '-crf', '15', '-pix_fmt', 'yuv420p', '-r', '60', file], { stdio: ['pipe', 'inherit', 'inherit'] });
  const t0 = Date.now();
  await page.evaluate((r) => (window as any).__reel.seek(r), s.r0); await page.waitForTimeout(1800); await raf();   // world / dancers build
  for (let f = f0; f < f1; f += every) {
    await page.evaluate((r) => (window as any).__reel.seek(r), f / 60);
    await raf();
    const b64: string = await page.evaluate(() => (document.querySelector('canvas') as HTMLCanvasElement).toDataURL('image/jpeg', 0.93).slice(23));
    const buf = Buffer.from(b64, 'base64');
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
  }
  ff.stdin.end(); await new Promise((r) => ff.on('close', r));
  console.log(`${s.id}: ${f1 - f0} frames in ${((Date.now() - t0) / 1000).toFixed(0)} s`);
}
await browser.close();
