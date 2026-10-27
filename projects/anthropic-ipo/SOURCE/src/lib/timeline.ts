// Film timeline from SCENE_TIMINGS.json (60 fps, 120 BPM: beat = 30 frames, bar = 120). Segments in order:
// [intro1..3 (v2 kinetic intro)], hook, <one per case in cases.json order>, checklist, cta. Case and checklist segments share one choreography:
//   [0, IN)       the board: return the previous card, travel along the red string, the next card flies to camera
//   [IN-6, IN)    cross-fade 3D card -> 2D CASE FILE card
//   [IN, dur)     the 2D card (CardLayer), media windows animating
//   next seg [0, 6)  cross-fade 2D card -> 3D card again
import { TIMINGS as timings } from '../data/version';
import cases from '../data/cases.json';

export const FPS = 60, BEAT = 30, BAR = 120;
export const IN = 48;            // frames of board transition at the start of a case segment
export const XF = 6;             // cross-fade frames
export interface Seg { id: string; start: number; end: number; from: number; durationInFrames: number }
export const SEGS: Seg[] = (timings as { variants: { reel: { scenes: Seg[] } } }).variants.reel.scenes;
export const TOTAL = (timings as { variants: { reel: { durationInFrames: number } } }).variants.reel.durationInFrames;
export type Case = (typeof cases)[number];
export const CASES: Case[] = cases;
/** v2's kinetic intro segments (IntroLayer); no board, no card */
export const isIntro = (id: string) => id.startsWith('intro');
export const CARD_SEGS = SEGS.filter((s) => s.id !== 'hook' && s.id !== 'cta' && !isIntro(s.id));   // cases + checklist
export const segById = (id: string) => SEGS.find((s) => s.id === id);
/** "Number one..five": the five cases (railway2 continues case 1); the checklist card counts as all five done */
export const CASE_TOTAL = 5;
export const caseNo = (segId: string) => (CASES.find((c) => c.id === segId)?.n as number | undefined) ?? CASE_TOTAL;
/** segment at a film frame, with the local frame */
export function segAt(frame: number) {
  const s = SEGS.find((x) => frame >= x.from && frame < x.from + x.durationInFrames) ?? SEGS[SEGS.length - 1];
  return { seg: s, local: frame - s.from, index: SEGS.indexOf(s) };
}
/** is the 2D card fully covering the frame at this film frame (the 3D board can skip rendering) */
export function cardCovers(frame: number) {
  const { seg, local } = segAt(frame);
  if (seg.id === 'hook' || seg.id === 'cta' || isIntro(seg.id)) return false;
  return local >= IN;
}
