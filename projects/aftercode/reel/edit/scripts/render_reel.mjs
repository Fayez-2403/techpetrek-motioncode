// Resumable render of the AFTERCODE reel: bundle once, render 240-frame chunks (muted H.264), concat, mux the -14 LUFS mix.
//   node scripts/render_reel.mjs [--scale 0.3333333333333333 --out preview.mp4]
import { execFileSync, execSync } from 'node:child_process';
import { existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = (n, d) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : d; };
const scale = arg('--scale', '1'), name = arg('--out', 'aftercode_reel_1080x1920_60fps.mp4');
const seg = path.join(ROOT, 'out', scale === '1' ? 'seg' : 'seg_preview'); mkdirSync(seg, { recursive: true });
const outDir = path.resolve(ROOT, '..', '..', 'output'); mkdirSync(outDir, { recursive: true });
const run = (c) => { console.log('>', c.slice(0, 160)); execSync(c, { cwd: ROOT, stdio: 'inherit' }); };
const bundle = path.join(ROOT, 'out', 'bundle-render');
run(`npx remotion bundle src/index.ts --out-dir "${bundle}"`);
const chunks = []; for (let a = 0; a < 4200; a += 240) chunks.push([a, Math.min(4199, a + 239)]);
for (const [i, [a, b]] of chunks.entries()) {
  const f = path.join(seg, `c${String(i).padStart(2, '0')}.mp4`);
  if (existsSync(f) && statSync(f).size > 10000) continue;
  // one worker + a fixed frame cache: on low RAM the compositor otherwise drops frames ("No frame found at position")
  const cmd = `npx remotion render "${bundle}" AfterReel "${f}" --frames=${a}-${b} --muted --codec=h264 --crf=16 --pixel-format=yuv420p --color-space=bt709 --concurrency=1 --offthreadvideo-cache-size-in-bytes=800000000 --scale=${scale} --log=error`;
  try { run(cmd); } catch { console.log('retrying chunk', i); run(cmd); }
}
writeFileSync(path.join(seg, 'list.txt'), chunks.map((_, i) => `file '${path.join(seg, `c${String(i).padStart(2, '0')}.mp4`).replaceAll(path.sep, '/')}'`).join('\n'));
const video = path.join(seg, 'video.mp4'), out = path.join(outDir, name);
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', path.join(seg, 'list.txt'), '-c', 'copy', video], { stdio: 'inherit' });
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', video, '-i', path.join(ROOT, 'public', 'audio', 'mix_reel.wav'), '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '320k', '-ar', '48000', '-movflags', '+faststart', '-shortest', out], { stdio: 'inherit' });
console.log('wrote', out);
