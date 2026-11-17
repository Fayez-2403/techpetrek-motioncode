// Ep 01 timeline data: the script (src/config/voScript.json), the voiced lines (audio/out/lines_duo.json: per-word times)
// and the beat map (audio/out/beats_ep01.json: where each line was placed in the mix). Everything below is pure.
import script from '../config/voScript.json';
import duo from '../../audio/out/lines_duo.json';
import beats from '../../audio/out/beats_ep01.json';

export type Who = 'bro' | 'bhai' | 'hook';
export interface Word { w: string; t0: number; t1: number }
export interface Line { k: number; id: string; who: Who; type: string; cap: string; at: number; dur: number; words: Word[] }

export const SLOT = script.slot;
/** v5: the intro hook (slot 0) has its own length (the intro line + a beat), every later line a fixed 3 s slot */
export const HOOK_S = (beats as { hook?: number }).hook ?? SLOT;
export const slotStart = (k: number) => (k === 0 ? 0 : HOOK_S + (k - 1) * SLOT);
export const slotLen = (k: number) => (k === 0 ? HOOK_S : SLOT);
export const TOTAL_S = HOOK_S + SLOT * (script.reel.length - 1);
export const BPM = beats.bpm;
const AT = beats.voice_at as Record<string, number>;
const META = Object.fromEntries((duo.lines as { id: string; dur: number; words: Word[] }[]).map((m) => [m.id, m]));

export const LINES: Line[] = script.reel.map((l, k) => ({
  k, id: l.id, who: l.who as Who, type: l.type, cap: l.cap, at: AT[l.id], dur: META[l.id].dur,
  // absolute word times (the voice's own alignment, shifted to where the line sits in the mix)
  words: META[l.id].words.map((w) => ({ w: w.w, t0: AT[l.id] + w.t0, t1: AT[l.id] + w.t1 })),
}));

/** the slot (0..17) at time t, and the local time inside it */
export const slotAt = (t: number) => { const k = t < HOOK_S ? 0 : Math.min(LINES.length - 1, 1 + Math.floor((t - HOOK_S) / SLOT)); return { k, u: t - slotStart(k), line: LINES[k] }; };
/** is this host speaking at t (inside a word, with a short hold across the gaps between words) */
export const speaking = (who: Who, t: number) => LINES.some((l) => l.who === who && l.words.some((w) => t >= w.t0 - 0.03 && t <= w.t1 + 0.08));
/** the word being spoken right now (for the caption's live highlight) */
export const wordAt = (l: Line, t: number) => l.words.findIndex((w) => t >= w.t0 && t < w.t1 + 0.05);
