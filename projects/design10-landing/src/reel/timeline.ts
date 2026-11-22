// The reel's one timeline (SCENE_TIMINGS.json, written from the measured takes by scripts/audio/timing_reel.py) and
// small pure math helpers. Every scene starts on its line; key moments are found by the spoken word (wordT).
import TIMING from '../../SCENE_TIMINGS.json';

export const T = TIMING as {
  fps: number; duration: number; voice: string;
  sections: { id: string; line: string; t0: number; t1: number }[];
  lines: { id: string; scene: string; start: number; end: number; cap: string; words: { w: string; t0: number; t1: number }[] }[];
};
export const sec = (id: string) => T.sections.find((s) => s.id === id)!;
export const sceneAt = (t: number) => T.sections.find((s) => t >= s.t0 && t < s.t1) ?? T.sections[T.sections.length - 1];
export const lineOf = (scene: string) => T.lines.find((l) => l.scene === scene)!;
/** time (absolute) of the first word in a scene's line matching re; fallback = line start + fb */
export const wordT = (scene: string, re: RegExp, fb = 0, end = false) => {
  const l = lineOf(scene), w = l.words.find((x) => re.test(x.w));
  return w ? (end ? w.t1 : w.t0) : l.start + fb;
};

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
export type V = [number, number, number];
export const V3 = (a: number[], b: number[], u: number) => a.map((x, i) => lerp(x, b[i], u)) as V;
