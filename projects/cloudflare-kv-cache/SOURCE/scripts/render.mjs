// Resumable render: bundle once, render the Reel composition in chunks (<= 240 frames, split on scene boundaries) as
// muted H.264, concat losslessly, mux the -14 LUFS mix as AAC 48 kHz. Low-RAM safe: concurrency 1, one retry per chunk.
//   node scripts/render.mjs                         -> ../output/cloudflare_kv_cache_reel_1080x1920_60fps.mp4
//   node scripts/render.mjs --scale 0.5 --out preview.mp4   (540x960 preview)
import { execFileSync, execSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const scale = Number(arg('--scale', '1'));
const VER = /export const VERSION = '(v\d+)'/.exec(readFileSync(path.join(ROOT, 'src/data/version.ts'), 'utf8'))[1];
const tm = JSON.parse(readFileSync(path.join(ROOT, VER === 'v1' ? 'SCENE_TIMINGS.json' : `SCENE_TIMINGS.${VER}.json`), 'utf8')).variants.reel;
const audio = JSON.parse(readFileSync(path.join(ROOT, 'src/data/audioManifest.json'), 'utf8')).reel;
const seg = path.join(ROOT, 'out', 'segments', `reel_${VER}_x${scale}`); mkdirSync(seg, { recursive: true });
const outDir = path.resolve(ROOT, '..', 'output'); mkdirSync(outDir, { recursive: true });
const out = path.join(outDir, arg('--out', `cloudflare_kv_cache_${VER}_reel_1080x1920_60fps.mp4`));
const run = (cmd) => { console.log('>', cmd); execSync(cmd, { cwd: ROOT, stdio: 'inherit' }); };
const chunks = [];
for (const s of tm.scenes) for (let a = s.from; a < s.from + s.durationInFrames; a += 240) chunks.push([a, Math.min(s.from + s.durationInFrames, a + 240) - 1]);
const bundle = path.join(ROOT, 'out', 'bundle-render');
run(`npx remotion bundle src/index.ts --out-dir "${bundle}"`);
const t0 = Date.now();
chunks.forEach(([a, b], i) => {
  const f = path.join(seg, `c${String(i).padStart(3, '0')}_${a}-${b}.mp4`);
  if (existsSync(f) && statSync(f).size > 10000) return;
  const cmd = `npx remotion render "${bundle}" Reel "${f}" --frames=${a}-${b} --muted --codec=h264 --crf=17 --pixel-format=yuv420p --color-space=bt709 --scale=${scale} --concurrency=1 --log=error`;
  try { run(cmd); } catch { console.log('retrying chunk', i); run(cmd); }
  console.log(`chunk ${i + 1}/${chunks.length} done, ${((Date.now() - t0) / 1000).toFixed(0)} s elapsed`);
});
writeFileSync(path.join(seg, 'list.txt'), chunks.map(([a, b], i) => `file '${path.join(seg, `c${String(i).padStart(3, '0')}_${a}-${b}.mp4`).replaceAll(path.sep, '/')}'`).join('\n'));
const video = path.join(seg, 'video.mp4');
execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', path.join(seg, 'list.txt'), '-c', 'copy', video], { stdio: 'inherit' });
execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', video, '-i', path.join(ROOT, 'public', audio), '-map', '0:v', '-map', '1:a',
  '-c:v', 'copy', '-c:a', 'aac', '-b:a', '320k', '-ar', '48000', '-movflags', '+faststart', '-shortest', out], { stdio: 'inherit' });
console.log(`wrote ${out} in ${((Date.now() - t0) / 60000).toFixed(1)} min`);
