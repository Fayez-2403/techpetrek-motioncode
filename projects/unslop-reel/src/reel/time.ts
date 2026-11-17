// One timeline: SCENE_TIMINGS.json (Liam's word times on the 120 BPM quarter-beat grid). Picture and sound both read it.
import TM from '../../SCENE_TIMINGS.json';

export type Word = { w: string; t0: number; t1: number };
export const T = TM as { duration: number; sections: { id: string; line: string; t0: number; t1: number }[]; lines: { id: string; start: number; end: number; cap: string; words: Word[] }[] };
export const sec = (id: string) => T.sections.find((s) => s.id === id)!;
export const secAt = (t: number) => T.sections.find((s) => t >= s.t0 && t < s.t1) ?? T.sections[T.sections.length - 1];
export const wordT = (line: string, re: RegExp, fb: number) => T.lines.find((l) => l.id === line)?.words.find((w) => re.test(w.w))?.t0 ?? fb;
export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lin = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
// land decelerates (quint out), leave accelerates (cubic in); one curve family for the whole reel
export const E = { out: (x: number) => 1 - (1 - clamp(x)) ** 5, in: (x: number) => clamp(x) ** 3, inout: (x: number) => { x = clamp(x); return x < 0.5 ? 16 * x ** 5 : 1 - (-2 * x + 2) ** 5 / 2; } };
