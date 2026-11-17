// Builds the carousel page and renders the 4 looping video slides: 1080 x 1350 (4:5), 60 fps, 6 s each, H.264
// yuv420p BT.709 with a silent AAC track (add music in Instagram). Also writes a poster PNG of each slide's frame 0.
//   node carousel/render.mjs [--dpr 2] [--fps 60] [--only 1,4] [--preview]   (--preview: dpr 1, 30 fps)
import {spawn, execFileSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath, pathToFileURL} from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const SKILL = process.env.TEARDOWN_SKILL || path.join(os.homedir(), '.claude', 'skills', 'teardown');
const OUT = path.join(HERE, 'out');
const arg = (k, d) => (process.argv.includes(k) ? process.argv[process.argv.indexOf(k) + 1] : d);
const preview = process.argv.includes('--preview');
const dpr = Number(arg('--dpr', preview ? 1 : 2));
const fps = Number(arg('--fps', preview ? 30 : 60));
const only = arg('--only', '1,2,3,4').split(',').map(Number);
execFileSync(process.execPath, [path.join(SKILL, 'sims', 'build.mjs'), path.join(HERE, 'engine-carousel')], {cwd: ROOT, stdio: 'inherit', env: {...process.env, TEARDOWN_OUT: OUT}});
const {chromium} = createRequire(path.join(SKILL, 'x.js'))('playwright');
const browser = await chromium.launch({args: [...(process.platform === 'win32' ? ['--use-angle=d3d11'] : []), '--force_high_performance_gpu', '--ignore-gpu-blocklist', '--hide-scrollbars']});
const page = await browser.newPage({viewport: {width: 540, height: 675}, deviceScaleFactor: dpr});
page.on('pageerror', (e) => console.error('[page]', e.message));
await page.goto(pathToFileURL(path.join(OUT, 'dist', 'engine-carousel.html')).href);
await page.waitForFunction(() => window.READY, null, {timeout: 120000});
const dur = await page.evaluate(() => window.DURATION);
const tag = preview ? `preview_${540 * dpr}x${675 * dpr}` : `${540 * dpr}x${675 * dpr}`;
for (const n of only) {
  await page.evaluate((n) => window.SETUP(n), n);
  const file = path.join(OUT, `engine_carousel_${n}_${tag}.mp4`);
  const ff = spawn('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'image2pipe', '-framerate', String(fps), '-i', '-', '-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=stereo',
    '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2:in_range=full:out_range=tv,format=yuv420p', '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv',
    '-c:a', 'aac', '-b:a', '128k', '-shortest', '-movflags', '+faststart', file], {stdio: ['pipe', 'inherit', 'inherit']});
  let dead = false;
  ff.on('close', () => (dead = true));
  const frames = Number(arg('--frames', Math.round(dur * fps)));
  const t0 = Date.now();
  for (let i = 0; i < frames; i++) {
    if (dead) throw new Error(`ffmpeg exited early on slide ${n}`);
    await page.evaluate((t) => window.SEEK(t), i / fps);
    const buf = await page.screenshot({type: 'jpeg', quality: 96, timeout: 120000});
    if (i === 0) await page.screenshot({path: path.join(OUT, `engine_carousel_${n}_poster.png`), timeout: 120000});
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    if (i % 30 === 0) console.log(`  slide ${n} frame ${i}/${frames} ${((Date.now() - t0) / 1000).toFixed(1)} s`);
  }
  ff.stdin.end();
  if (!dead) await new Promise((r) => ff.on('close', r));
  console.log(`→ ${file}  (${frames} frames, ${((Date.now() - t0) / 1000).toFixed(0)} s)`);
}
await browser.close();
fs.rmSync(path.join(OUT, 'dist'), {recursive: true, force: true});
