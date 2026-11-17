// Resumable render of UnslopReel: bundle once, render 240-frame chunks (split on section boundaries) as muted H.264
// with ANGLE GL (same as stills.mjs), concat losslessly, mux public/audio/mix_unslop.wav as AAC 48 kHz 320k.
// ASK THE USER before a full 1080x1920 render; the motion check is --scale 0.5.
//   node scripts/render_heist.mjs --scale 0.5   -> out/preview/unslop_v2_preview_540x960.mp4
//   node scripts/render_heist.mjs               -> out/unslop_v1_reel_1080x1920_60fps.mp4   (after OK)
import { execFileSync, execSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const scale = Number(arg('--scale', '1')), conc = arg('--concurrency', '3'), FPS = 60;
const tm = JSON.parse(readFileSync(path.join(ROOT, 'SCENE_TIMINGS.json'), 'utf8'));
const total = Math.round(tm.duration * FPS);
const seg = path.join(ROOT, 'out', 'segments', `unslop_v2_x${scale}`); mkdirSync(seg, { recursive: true });
const out = path.join(ROOT, 'out', scale === 1 ? 'unslop_v1_reel_1080x1920_60fps.mp4' : `preview/unslop_v2_preview_${1080 * scale}x${1920 * scale}.mp4`);
mkdirSync(path.dirname(out), { recursive: true });
const run = (cmd) => { console.log('>', cmd); execSync(cmd, { cwd: ROOT, stdio: 'inherit' }); };
const cuts = [...new Set([0, ...tm.sections.map((s) => Math.round(s.t0 * FPS)), total])].sort((a, b) => a - b);
const chunks = [];
for (let i = 0; i < cuts.length - 1; i++) for (let a = cuts[i]; a < cuts[i + 1]; a += 240) chunks.push([a, Math.min(cuts[i + 1], a + 240) - 1]);
const bundle = path.join(ROOT, 'out', 'bundle-render');
run(`npx remotion bundle src/index.ts --out-dir "${bundle}"`);
const t0 = Date.now();
chunks.forEach(([a, b], i) => {
  const f = path.join(seg, `c${String(i).padStart(3, '0')}_${a}-${b}.mp4`);
  if (existsSync(f) && statSync(f).size > 10000) return;
  const cmd = `npx remotion render "${bundle}" UnslopReel "${f}" --frames=${a}-${b} --muted --codec=h264 --crf=17 --pixel-format=yuv420p --color-space=bt709 --scale=${scale} --gl=angle --concurrency=${conc} --log=error`;
  try { run(cmd); } catch { console.log('retrying chunk', i); run(cmd); }
  console.log(`chunk ${i + 1}/${chunks.length} done, ${((Date.now() - t0) / 1000).toFixed(0)} s elapsed`);
});
writeFileSync(path.join(seg, 'list.txt'), chunks.map(([a, b], i) => `file '${path.join(seg, `c${String(i).padStart(3, '0')}_${a}-${b}.mp4`).replaceAll(path.sep, '/')}'`).join('\n'));
const video = path.join(seg, 'video.mp4');
execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', path.join(seg, 'list.txt'), '-c', 'copy', video], { stdio: 'inherit' });
execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', video, '-i', path.join(ROOT, 'public/audio/mix_unslop.wav'), '-map', '0:v', '-map', '1:a',
  '-c:v', 'copy', '-c:a', 'aac', '-b:a', '320k', '-ar', '48000', '-shortest', '-movflags', '+faststart', out], { stdio: 'inherit' });
console.log(`wrote ${out} in ${((Date.now() - t0) / 60000).toFixed(1)} min`);
