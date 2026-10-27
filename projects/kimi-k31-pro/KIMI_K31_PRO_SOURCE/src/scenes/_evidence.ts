// Helpers shared by 09 BenchmarkReveal, 10 Highspeed and 11 OpenWeight (owner: the "evidence" builder).
//   voFrame   the local frame of a spoken word in this scene (from SCENE_TIMINGS.json captions), with a fallback
//   CHART     the bar-chart geometry of 09 (master / reel)
//   RAILS     the two horizontal tracks 09 ends on and 10 starts on
//   FOLD      the square the merged line of 10 folds into: the cube's front face in 11's first frame
import timings from '../../SCENE_TIMINGS.json';
import { C } from '../styles/theme';
import type { SceneId, Variant } from './types';

const FPS = 30;

interface Word { w: string; t0: number; t1: number }
interface Cap { words: Word[] }
interface Sc { id: string; start: number; end: number }

/** Local frame (inside `scene`) of the `nth` spoken word matching `re`; `fallback` when the narration has no such word.
 *  Lets beats land on the word that says them and still follow a re-voiced narration. */
export function voFrame(variant: Variant, scene: SceneId, re: RegExp, fallback: number, nth = 0, edge: 't0' | 't1' = 't0'): number {
  const v = (timings as unknown as { variants: Record<string, { scenes: Sc[]; captions: Cap[] }> }).variants[variant];
  const s = v?.scenes.find((x) => x.id === scene);
  if (!s) return Math.round(fallback);
  let k = 0;
  for (const c of v.captions) {
    for (const w of c.words) {
      if (w.t0 >= s.start - 0.05 && w.t0 < s.end && re.test(w.w)) {
        if (k++ === nth) return Math.max(0, Math.round((w[edge] - s.start) * FPS));
      }
    }
  }
  return Math.round(fallback);
}

export interface ChartGeom {
  /** x of the 0 baseline and the plotted width (0 → axisMax) */
  x0: number; plotW: number;
  /** centre y of each bar, bar thickness */
  rowY: number[]; barH: number;
  /** names: right-aligned in a column left of the baseline (master) or above each bar (reel) */
  names: 'column' | 'above'; nameSize: number; valueSize: number; tickSize: number;
  plotTop: number; axisY: number;
}

export const CHART: Record<Variant, ChartGeom> = {
  master: { x0: 470, plotW: 1250, rowY: [432, 550, 668], barH: 58, names: 'column', nameSize: 32, valueSize: 38, tickSize: 20, plotTop: 368, axisY: 742 },
  reel: { x0: 64, plotW: 952, rowY: [664, 828, 992], barH: 64, names: 'above', nameSize: 34, valueSize: 40, tickSize: 24, plotTop: 572, axisY: 1066 },
};

/** the mint bar that 08 ends on (centred, across the middle of the frame) */
export const ENTRY_BAR: Record<Variant, { cx: number; cy: number; w: number; h: number }> = {
  master: { cx: 960, cy: 540, w: 960, h: 8 },
  reel: { cx: 540, cy: 960, w: 760, h: 8 },
};

/** 09's last frame = 10's first frame: two cyan rails (x0 → x1, centre y, thickness h) */
export const RAILS: Record<Variant, { x0: number; x1: number; y: [number, number]; h: number }> = {
  master: { x0: CHART.master.x0, x1: CHART.master.x0 + CHART.master.plotW, y: [462, 638], h: 4 },
  reel: { x0: CHART.reel.x0, x1: CHART.reel.x0 + CHART.reel.plotW, y: [722, 958], h: 4 },
};

/** 10's last frame = 11's first frame: a luminous square outline (the cube seen face-on) */
export const FOLD: Record<Variant, { cx: number; cy: number; side: number }> = {
  master: { cx: 960, cy: 540, side: 300 },
  reel: { cx: 540, cy: 640, side: 380 },
};

/** the backdrop 09 and 10 share (11 starts on it and drifts to its own framing) */
export const BG = { core: '#0A1230', at: [46, 45] as [number, number] };

/** the line colour the rails, the fold and the cube edges share */
export const EDGE: string = C.cyan;
