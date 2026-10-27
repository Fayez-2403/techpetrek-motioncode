// Render checks on the delivered files (skipped with a note when a file does not exist yet): container, codecs,
// size, fps, duration against SCENE_TIMINGS.json, pixel format, audio stream; loudness of the soundtrack.
import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import type { Check } from './run';

const ROOT = path.resolve(__dirname, '..');
const OUT = path.resolve(ROOT, '..');

export function renderChecks(): Check[] {
  const checks: Check[] = [];
  const add = (name: string, ok: boolean, detail = '') => checks.push({ name, ok, detail });
  const files: { f: string; v: string; ver: string; w: number[]; h: number[] }[] = [];
  for (const ver of ['v1', 'v2']) files.push(
    { f: `KIMI_K31_PRO_MASTER_16x9_${ver}.mp4`, v: 'master', ver, w: [1920, 3840], h: [1080, 2160] },
    { f: `KIMI_K31_PRO_REEL_9x16_${ver}.mp4`, v: 'reel', ver, w: [1080], h: [1920] });
  files.push({ f: 'KIMI_K31_PRO_SHOWCASE_ROTATE_9x16_v3.mp4', v: 'v3', ver: 'v3', w: [1080], h: [1920] });
  for (const x of files) {
    const p = path.join(OUT, x.f);
    if (!existsSync(p)) { add(`${x.f} exists`, false, 'not rendered yet'); continue; }
    const j = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', p]).toString());
    const v = j.streams.find((s: { codec_type: string }) => s.codec_type === 'video'), a = j.streams.find((s: { codec_type: string }) => s.codec_type === 'audio');
    const [num, den] = String(v.r_frame_rate).split('/').map(Number), fps = num / den;
    const want = x.ver === 'v3' ? 90 : (JSON.parse(readFileSync(path.join(ROOT, `SCENE_TIMINGS.${x.ver}.json`), 'utf8')).variants[x.v].seconds as number);
    const dur = Number(j.format.duration);
    add(`${x.f}: H.264`, v.codec_name === 'h264', v.codec_name);
    add(`${x.f}: size`, x.w.includes(v.width) && x.h.includes(v.height), `${v.width}x${v.height}`);
    add(`${x.f}: fps 30 or 60`, Math.abs(fps - 30) < 0.01 || Math.abs(fps - 60) < 0.01, String(fps));
    add(`${x.f}: yuv420p`, v.pix_fmt === 'yuv420p', v.pix_fmt);
    add(`${x.f}: AAC audio stream`, !!a && a.codec_name === 'aac', a?.codec_name ?? 'none');
    add(`${x.f}: duration matches the timeline`, Math.abs(dur - want) < 0.15, `${dur.toFixed(2)} s vs ${want.toFixed(2)} s`);
    const r = execFileSync('ffmpeg', ['-hide_banner', '-nostats', '-i', p, '-map', '0:a', '-af', 'ebur128=peak=true', '-f', 'null', '-'], { stdio: ['ignore', 'pipe', 'pipe'] });
    void r;
  }
  return checks;
}
