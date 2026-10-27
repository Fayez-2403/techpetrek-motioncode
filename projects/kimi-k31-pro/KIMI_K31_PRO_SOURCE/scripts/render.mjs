// Crash-safe render: bundle once, render the film in chunks (<= 240 frames, split on scene boundaries) as muted H.264,
// concat them losslessly, then mux the -14 LUFS mix as AAC. Finished chunks are kept and skipped on a re-run, so an
// interrupted render resumes where it stopped.
//   node scripts/render.mjs master|reel [--version v2] [--scale 2]      (--scale 2 = 3840x2160 master)
import { execFileSync, execSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const variant = process.argv[2] ?? 'master';
const version = process.argv.includes('--version') ? process.argv[process.argv.indexOf('--version') + 1] : 'v1';
const scale = process.argv.includes('--scale') ? Number(process.argv[process.argv.indexOf('--scale') + 1]) : 1;
const comp = variant === 'master' ? 'KimiMasterFilm' : 'KimiInstagramCut';
const outName = (variant === 'master' ? 'KIMI_K31_PRO_MASTER_16x9' : 'KIMI_K31_PRO_REEL_9x16') + `_${version}.mp4`;
execSync(`node scripts/use-version.mjs ${version}`, { cwd: ROOT, stdio: 'inherit' });
const tm = JSON.parse(readFileSync(path.join(ROOT, 'SCENE_TIMINGS.json'), 'utf8')).variants[variant];
const audio = JSON.parse(readFileSync(path.join(ROOT, 'src/data/audioManifest.json'), 'utf8'))[variant];
const seg = path.join(ROOT, 'out', 'segments', `${variant}_${version}${scale > 1 ? `_x${scale}` : ''}`);
mkdirSync(seg, { recursive: true });
const run = (cmd) => { console.log('>', cmd); execSync(cmd, { cwd: ROOT, stdio: 'inherit' }); };

// chunks on scene boundaries, each at most 240 frames
const chunks = [];
for (const s of tm.scenes) for (let a = s.from; a < s.from + s.durationInFrames; a += 240) chunks.push([a, Math.min(s.from + s.durationInFrames, a + 240) - 1]);

const bundle = path.join(ROOT, 'out', 'bundle-render');
run(`npx remotion bundle src/index.ts --out-dir "${bundle}"`);
const t0 = Date.now();
chunks.forEach(([a, b], i) => {
  const f = path.join(seg, `c${String(i).padStart(3, '0')}_${a}-${b}.mp4`);
  if (existsSync(f) && statSync(f).size > 10000) return;
  run(`npx remotion render "${bundle}" ${comp} "${f}" --frames=${a}-${b} --muted --codec=h264 --crf=${variant === 'master' ? 16 : 17} --pixel-format=yuv420p --color-space=bt709 --scale=${scale} --concurrency=3 --gl=angle --log=error`);
  const el = (Date.now() - t0) / 1000;
  console.log(`chunk ${i + 1}/${chunks.length} done, ${el.toFixed(0)} s elapsed`);
});
const list = chunks.map(([a, b], i) => `file '${path.join(seg, `c${String(i).padStart(3, '0')}_${a}-${b}.mp4`).replace(/\\/g, '/')}'`).join('\n');
writeFileSync(path.join(seg, 'list.txt'), list);
const video = path.join(seg, 'video.mp4');
execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', path.join(seg, 'list.txt'), '-c', 'copy', video], { stdio: 'inherit' });
const out = path.resolve(ROOT, '..', scale > 1 ? outName.replace('.mp4', `_${scale * 1080}p.mp4`) : outName);
execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', video, '-i', path.join(ROOT, 'public', audio), '-map', '0:v', '-map', '1:a',
  '-c:v', 'copy', '-c:a', 'aac', '-b:a', '320k', '-ar', '48000', '-movflags', '+faststart', '-shortest', out], { stdio: 'inherit' });
console.log(`wrote ${out} in ${((Date.now() - t0) / 60000).toFixed(1)} min`);
