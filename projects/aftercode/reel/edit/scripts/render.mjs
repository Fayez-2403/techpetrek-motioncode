// Resumable render: bundle once, render AfterReel in chunks (<= 240 frames, split on segment boundaries) as muted H.264,
// concat losslessly, mux the -14 LUFS mix as AAC.   node scripts/render.mjs  -> ../output/aftercode_reel_1080x1920_60fps.mp4
import { execFileSync, execSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// the version the Remotion project renders (src/data/version.ts); v1 keeps its original timings file and chunk folder
const VER = /export const VERSION = '(v\d+)'/.exec(readFileSync(path.join(ROOT, 'src/data/version.ts'), 'utf8'))[1];
const tm = JSON.parse(readFileSync(path.join(ROOT, VER === 'v1' ? 'SCENE_TIMINGS.json' : `SCENE_TIMINGS.${VER}.json`), 'utf8')).variants.reel;
const audio = JSON.parse(readFileSync(path.join(ROOT, 'src/data/audioManifest.json'), 'utf8')).reel;
const seg = path.join(ROOT, 'out', 'segments', VER === 'v1' ? 'reel' : `reel_${VER}`); mkdirSync(seg, { recursive: true });
const outDir = path.resolve(ROOT, '..', 'output'); mkdirSync(outDir, { recursive: true });
const out = path.join(outDir, `aftercode_reel_1080x1920_60fps.mp4`);
const run = (cmd) => { console.log('>', cmd); execSync(cmd, { cwd: ROOT, stdio: 'inherit' }); };
const chunks = [];
for (const s of tm.scenes) for (let a = s.from; a < s.from + s.durationInFrames; a += 240) chunks.push([a, Math.min(s.from + s.durationInFrames, a + 240) - 1]);
const bundle = path.join(ROOT, 'out', 'bundle-render');
run(`npx remotion bundle src/index.ts --out-dir "${bundle}"`);
const t0 = Date.now();
chunks.forEach(([a, b], i) => {
  const f = path.join(seg, `c${String(i).padStart(3, '0')}_${a}-${b}.mp4`);
  if (existsSync(f) && statSync(f).size > 10000) return;
  run(`npx remotion render "${bundle}" AfterReel "${f}" --frames=${a}-${b} --muted --codec=h264 --crf=17 --pixel-format=yuv420p --color-space=bt709 --concurrency=3 --gl=angle --log=error`);
  console.log(`chunk ${i + 1}/${chunks.length} done, ${((Date.now() - t0) / 1000).toFixed(0)} s elapsed`);
});
writeFileSync(path.join(seg, 'list.txt'), chunks.map(([a, b], i) => `file '${path.join(seg, `c${String(i).padStart(3, '0')}_${a}-${b}.mp4`).replaceAll(path.sep, '/')}'`).join('\n'));
const video = path.join(seg, 'video.mp4');
execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', path.join(seg, 'list.txt'), '-c', 'copy', video], { stdio: 'inherit' });
execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', video, '-i', path.join(ROOT, 'public', audio), '-map', '0:v', '-map', '1:a',
  '-c:v', 'copy', '-c:a', 'aac', '-b:a', '320k', '-ar', '48000', '-movflags', '+faststart', '-shortest', out], { stdio: 'inherit' });
console.log(`wrote ${out} in ${((Date.now() - t0) / 60000).toFixed(1)} min`);
