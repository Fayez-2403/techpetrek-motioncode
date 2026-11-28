// The one timeline: SCENE_TIMINGS.json (written by scripts/audio/timing_duo.py from the real voice takes).
import T from '../SCENE_TIMINGS.json';
import MOUTH from './config/mouth.json';
import { FPS } from './themes/tokens';

export type Word = { w: string; t0: number; t1: number };
export type Phrase = { cap: string; t0: number; t1: number; words: Word[] };
export type Line = { id: string; who: 'bro' | 'bhai'; scene: string; start: number; end: number; dur: number; phrases: Phrase[] };
export type Scene = { id: string; start: number; end: number };
export const TL = T as unknown as { fps: number; total: number; frames: number; scenes: Scene[]; ev: Record<string, number>; lines: Line[] };
export const TOTAL = TL.frames;
/** a named beat, in seconds (tied to a word by timing_duo.py) */
export const ev = (k: string): number => {
  const v = TL.ev[k];
  if (v === undefined) throw new Error(`unknown event ${k}`);
  return v;
};
export const scene = (id: string) => TL.scenes.find((s) => s.id === id)!;
export const line = (id: string) => TL.lines.find((l) => l.id === id)!;
export const lineAt = (t: number) => TL.lines.find((l) => t >= l.start - 0.02 && t < l.end + 0.08);
const M = MOUTH as unknown as Record<'bro' | 'bhai', number[]>;
/** mouth openness 0..1 for a speaker at time t (smoothed over 2 frames) */
export const mouth = (who: 'bro' | 'bhai', t: number) => {
  const f = Math.round(t * FPS), a = M[who];
  const g = (i: number) => a[Math.max(0, Math.min(a.length - 1, i))] ?? 0;
  return (g(f) * 2 + g(f - 1) + g(f + 1)) / 4;
};
/** seconds since an event (negative before it) */
export const since = (t: number, k: string) => t - ev(k);
