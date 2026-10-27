// V3 showcase render (resumable chunks on shot boundaries, lossless concat, then the 90 s music track as AAC).
//   node scripts/render_v3.mjs [reel|landscape]   -> ../KIMI_K31_PRO_SHOWCASE_ROTATE_9x16_v3.mp4 | ../KIMI_K31_PRO_SHOWCASE_16x9_v3.mp4
import { execFileSync, execSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const mode = process.argv[2] ?? 'reel';
const comp = mode === 'reel' ? 'KimiShowcaseV3' : 'KimiShowcaseV3Landscape';
const out = path.resolve(ROOT, '..', mode === 'reel' ? 'KIMI_K31_PRO_SHOWCASE_ROTATE_9x16_v3.mp4' : 'KIMI_K31_PRO_SHOWCASE_16x9_v3.mp4');
const tl = JSON.parse(readFileSync(path.join(ROOT, 'src/v3/timeline.json'), 'utf8'));
const seg = path.join(ROOT, 'out', 'segments', `v3_${mode}`);
mkdirSync(seg, { recursive: true });
const run = (cmd) => { console.log('>', cmd); execSync(cmd, { cwd: ROOT, stdio: 'inherit' }); };

const chunks = [];
let f0 = 0;
for (const s of tl.shots) { const n = s.bars * tl.barFrames; for (let a = f0; a < f0 + n; a += 240) chunks.push([a, Math.min(f0 + n, a + 240) - 1]); f0 += n; }
const bundle = path.join(ROOT, 'out', 'bundle-render-v3');
run(`npx remotion bundle src/index.ts --out-dir "${bundle}"`);
const t0 = Date.now();
chunks.forEach(([a, b], i) => {
  const f = path.join(seg, `c${String(i).padStart(3, '0')}_${a}-${b}.mp4`);
  if (existsSync(f) && statSync(f).size > 10000) return;
  run(`npx remotion render "${bundle}" ${comp} "${f}" --frames=${a}-${b} --muted --codec=h264 --crf=17 --pixel-format=yuv420p --color-space=bt709 --concurrency=3 --gl=angle --log=error`);
  console.log(`chunk ${i + 1}/${chunks.length} done, ${((Date.now() - t0) / 1000).toFixed(0)} s elapsed`);
});
writeFileSync(path.join(seg, 'list.txt'), chunks.map(([a, b], i) => `file '${path.join(seg, `c${String(i).padStart(3, '0')}_${a}-${b}.mp4`).replace(/\\/g, '/')}'`).join('\n'));
const video = path.join(seg, 'video.mp4');
execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', path.join(seg, 'list.txt'), '-c', 'copy', video], { stdio: 'inherit' });
execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', video, '-i', path.join(ROOT, 'public/audio/music_v3.wav'), '-map', '0:v', '-map', '1:a',
  '-c:v', 'copy', '-c:a', 'aac', '-b:a', '320k', '-ar', '48000', '-movflags', '+faststart', '-shortest', out], { stdio: 'inherit' });
console.log(`wrote ${out} in ${((Date.now() - t0) / 60000).toFixed(1)} min`);
