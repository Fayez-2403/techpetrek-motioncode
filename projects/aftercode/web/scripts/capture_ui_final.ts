// The final reel's builder shot: the real app UI in its phone layout (540x960 CSS px at 2x = 1080x1920), driven frame by
// frame by src/reel/final.ts seekUI(r) (one builder change per beat, a cursor that taps on the beat), screenshotted in time
// order and piped to ffmpeg.   bun scripts/capture_ui_final.ts [out.mp4]   (dev server on :54221, or UI_URL)
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
const out = process.argv[2] ?? '../aftercode-final/public/clips/ui_builder.mp4';
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true,
  args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-background-timer-throttling', '--disable-renderer-backgrounding'] });
const page = await browser.newPage({ viewport: { width: 540, height: 960 }, deviceScaleFactor: 2 });
page.on('pageerror', (e) => console.log('PAGEERROR', e.message));
await page.goto(process.env.UI_URL ?? 'http://localhost:54221/?uireel=final', { waitUntil: 'networkidle' });
await page.waitForFunction(() => (window as any).__ac?.engine.analysis && (window as any).__reel, null, { timeout: 120000 });
await page.evaluate(() => (window as any).__reel.prepare());
const { r0, r1 } = await page.evaluate(() => (window as any).__reel.uiShot());
const raf = () => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(0)))));
const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', '60', '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '15', '-pix_fmt', 'yuv420p', '-r', '60', out], { stdio: ['pipe', 'inherit', 'inherit'] });
const f0 = Math.round(r0 * 60), f1 = Math.round(r1 * 60), t0 = Date.now();
await page.evaluate((r) => (window as any).__reel.seekUI(r), r0); await page.waitForTimeout(2000); await raf();   // dancer + panel settle
for (let f = f0; f < f1; f++) {
  await page.evaluate((r) => (window as any).__reel.seekUI(r), f / 60);
  await raf();
  const buf = await page.screenshot({ type: 'jpeg', quality: 92 });
  if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
}
ff.stdin.end(); await new Promise((r) => ff.on('close', r));
console.log(`ui_builder: ${f1 - f0} frames (${r0.toFixed(2)}-${r1.toFixed(2)} s) in ${((Date.now() - t0) / 1000).toFixed(0)} s -> ${out}`);
await browser.close();
