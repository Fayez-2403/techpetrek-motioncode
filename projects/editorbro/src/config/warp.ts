// Time map between the v1 timeline (the scenes were authored against its word timings) and the active voice (v3).
// Anchors: every scene start, the end, and every word (same script, so the words pair one to one); piecewise linear
// between them. With v1 active it is the identity. Scenes keep their v1 literals and run on toOld(now).
import { TIMINGS, TIMINGS_V1, VERSION } from './version';

interface R { scenes: { start: number }[]; seconds: number; captions: { words: { t0: number }[] }[] }
const anchors = (t: unknown) => {
  const r = (t as { variants: { reel: R } }).variants.reel;
  return [0, ...r.scenes.map((s) => s.start), r.seconds, ...r.captions.flatMap((c) => c.words.map((w) => w.t0))];
};
const A = anchors(TIMINGS_V1), B = anchors(TIMINGS);
const PAIRS = A.map((a, i) => [a, B[i]] as const).sort((p, q) => p[0] - q[0]);
const interp = (x: number, from: number, to: number) => {
  for (let i = 0; i < PAIRS.length - 1; i++) {
    const a = PAIRS[i][from], b = PAIRS[i + 1][from];
    if (x <= b && b > a) return PAIRS[i][to] + ((x - a) / (b - a)) * (PAIRS[i + 1][to] - PAIRS[i][to]);
  }
  const last = PAIRS[PAIRS.length - 1];
  return last[to] + (x - last[from]);
};
/** v1 seconds -> active-voice seconds */
export const toNew = (t: number) => (VERSION === 'v1' ? t : interp(t, 0, 1));
/** active-voice seconds -> v1 seconds */
export const toOld = (t: number) => (VERSION === 'v1' ? t : interp(t, 1, 0));
