// The reel's one timeline (SCENE_TIMINGS.json, written from the measured takes) + small math helpers.
import TIMING from '../../SCENE_TIMINGS.json';
import REPOS from '../../docs/repos.json';
import BOX from '../config/repoBoxes.json';

export const T = TIMING;
export const sec = (id: string) => T.sections.find((s) => s.id === id)!;
export type Beat = { slug: string; section: string; t0: number; t1: number };
export const BEATS = T.beats as Beat[];
export const beatAt = (t: number) => BEATS.find((b) => t >= b.t0 && t < b.t1) ?? null;
export const wordT = (line: string, re: RegExp, fb: number) => T.lines.find((l) => l.id === line)?.words.find((w) => re.test(w.w))?.t0 ?? fb;

export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lin = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const E = {
  out: (x: number) => 1 - (1 - clamp(x)) ** 4,
  out5: (x: number) => 1 - (1 - clamp(x)) ** 5,
  in: (x: number) => clamp(x) ** 3,
  inout: (x: number) => { x = clamp(x); return x < 0.5 ? 16 * x ** 5 : 1 - (-2 * x + 2) ** 5 / 2; },
  back: (x: number) => { x = clamp(x); const c = 1.9; return 1 + (c + 1) * (x - 1) ** 3 + c * (x - 1) ** 2; },
};
export const spring = (t: number, w = 16, z = 0.35) => (t <= 0 ? 0 : 1 - Math.exp(-z * w * t) * Math.cos(w * Math.sqrt(1 - z * z) * t));
export const V3 = (a: number[], b: number[], u: number) => a.map((x, i) => lerp(x, b[i], u)) as [number, number, number];

/** the repo facts on screen come only from docs/repos.json (GitHub API, 2026-11-03) and the page boxes */
type Repo = { repo: string; stars: number; desc: string; url: string };
export const REPO = (slug: string): Repo => {
  const r = (REPOS.repos as Repo[]).find((x) => x.repo.split('/')[1].toLowerCase().replace(/\W/g, '') === slug);
  return r ?? { repo: 'reportlab', stars: 0, desc: 'ReportLab PDF Toolkit (open source)', url: 'https://www.reportlab.com/opensource/' };
};
export const STAR_BOX = (slug: string) => (BOX as Record<string, { starsAbout?: { u: number; v: number; text: string } | null }>)[slug]?.starsAbout ?? null;
export const TOTAL_STARS = (REPOS.repos as Repo[]).filter((r) => !r.repo.includes('reportlab')).reduce((s, r) => s + r.stars, 0);
export const NAME: Record<string, string> = {
  blender: 'BLENDER', threejs: 'THREE.JS', numpy: 'NUMPY', numba: 'NUMBA', scipy: 'SCIPY', gsap: 'GSAP', remotion: 'REMOTION', puppeteer: 'PUPPETEER',
  tonejs: 'TONE.JS', pedalboard: 'PEDALBOARD', pyloudnorm: 'PYLOUDNORM', opencv: 'OPENCV', pillow: 'PILLOW', fasterwhisper: 'FASTER-WHISPER', ffmpeg: 'FFMPEG', reportlab: 'REPORTLAB',
};
export const JOB: Record<string, string> = {
  blender: '3D · rigs · renders', threejs: '3D in the browser', numpy: 'every frame as numbers', numba: 'heavy sims, fast', scipy: 'filters + reverb',
  gsap: 'UI motion + timelines', remotion: 'video in React', puppeteer: 'renders UI frame by frame', tonejs: 'synths + SFX', pedalboard: 'compressor + limiter',
  pyloudnorm: '−14 LUFS, platform-safe', opencv: 'catches broken frames', pillow: 'contact sheets + colour checks', fasterwhisper: 'captions from the voice',
  ffmpeg: 'encode + ship', reportlab: 'the prompt-pack PDF',
};
