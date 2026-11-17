// The one timeline (seconds). Picture (src/world/Scene.tsx) and sound (scripts/audio/mix_diwali.py via
// src/data/plan.json written by scripts/dump_plan.ts) both read it.
import type { Bomb, Fountain, Ladi, Shell, Wheel, RGB } from './fx';

export const DURATION = 16.0;
export type BotKey = 'grok' | 'claude' | 'muse' | 'dots';
export const LINEUP: BotKey[] = ['grok', 'claude', 'muse', 'dots'];             // left -> right
export const XPOS: Record<BotKey, number> = { grok: -0.86, claude: -0.27, muse: 0.32, dots: 0.84 };
export const COLOR: Record<BotKey, RGB> = { grok: [1.5, 1.5, 1.55], claude: [1.6, 0.62, 0.38], muse: [0.2, 0.62, 1.8], dots: [0.45, 0.75, 1.7] };
export const IGNITE: Record<BotKey, number> = { claude: 0.12, muse: 0.42, grok: 0.72, dots: 1.0 };
export const WALK0 = 1.25, STOP = 8.15, Z0 = -5.0, Z1 = -0.55;
export const SAY: Record<BotKey, number> = { claude: 8.5, muse: 9.35, grok: 10.15, dots: 10.95 };   // each "Happy Diwali!"
export const CHORUS = 12.35, WRITE0 = 12.0, WRITE1 = 14.2;

const gold: RGB = [1.5, 0.9, 0.35], magenta: RGB = [1.6, 0.35, 1.2], cyan: RGB = [0.3, 1.3, 1.7], green: RGB = [0.5, 1.6, 0.5], red: RGB = [1.7, 0.35, 0.3], violet: RGB = [0.9, 0.5, 1.8];
export const SHELLS: Shell[] = [
  // during the walk: one rocket on every other beat, from behind the houses at the end of the street
  { t: 1.5, x: -2.2, z: -16, apex: 6.5, kind: 'peony', color: gold, n: 140 },
  { t: 2.35, x: 2.6, z: -18, apex: 7.6, kind: 'peony', color: magenta, n: 140 },
  { t: 3.2, x: 0.4, z: -20, apex: 7.9, kind: 'ring', color: cyan, n: 90 },
  { t: 4.05, x: -3.0, z: -17, apex: 6.8, kind: 'willow', color: gold, n: 120 },
  { t: 4.9, x: 3.0, z: -19, apex: 7.2, kind: 'peony', color: green, n: 140 },
  { t: 5.75, x: -1.0, z: -21, apex: 8.6, kind: 'crackle', color: red, n: 130 },
  { t: 6.6, x: 2.2, z: -17, apex: 6.5, kind: 'peony', color: violet, n: 140 },
  { t: 7.45, x: -2.6, z: -19, apex: 7.6, kind: 'ring', color: gold, n: 90 },
  // each bot's wish gets a burst in its own colour right behind it
  { t: 8.5 - 1.05, x: -1.6, z: -10, apex: 5.5, kind: 'peony', color: [1.6, 0.62, 0.38], n: 150 },
  { t: 9.35 - 1.05, x: 1.2, z: -10, apex: 5.5, kind: 'peony', color: [0.2, 0.62, 1.8], n: 150 },
  { t: 10.15 - 1.05, x: -2.4, z: -11, apex: 5.5, kind: 'crackle', color: [1.5, 1.5, 1.55], n: 140 },
  { t: 10.95 - 1.05, x: 2.0, z: -10, apex: 5.5, kind: 'ring', color: [0.45, 0.75, 1.7], n: 100 },
  // the finale: everything at once
  { t: 11.6, x: -2.8, z: -14, apex: 6.5, kind: 'willow', color: gold, n: 130 },
  { t: 11.8, x: 2.9, z: -14, apex: 6.8, kind: 'willow', color: gold, n: 130 },
  { t: 12.05, x: 0, z: -16, apex: 7.9, kind: 'peony', color: magenta, n: 160 },
  { t: 12.4, x: -1.6, z: -18, apex: 8.6, kind: 'crackle', color: cyan, n: 140 },
  { t: 12.7, x: 1.8, z: -15, apex: 7.2, kind: 'peony', color: green, n: 150 },
  { t: 13.0, x: -3.2, z: -16, apex: 7.9, kind: 'ring', color: violet, n: 100 },
  { t: 13.3, x: 3.1, z: -17, apex: 8.6, kind: 'peony', color: red, n: 150 },
  { t: 13.6, x: 0.2, z: -19, apex: 9.4, kind: 'willow', color: gold, n: 150 },
  { t: 13.95, x: -2.0, z: -15, apex: 7.2, kind: 'crackle', color: gold, n: 140 },
  { t: 14.25, x: 2.2, z: -16, apex: 7.9, kind: 'peony', color: cyan, n: 150 },
];
export const FOUNTAINS: Fountain[] = [
  { t0: 2.0, t1: 5.2, x: -2.2, z: -5.5, color: gold },
  { t0: 3.0, t1: 6.4, x: 2.3, z: -6.5, color: [1.4, 1.0, 0.6] },
  { t0: 11.3, t1: 16.5, x: -1.9, z: -1.2, color: gold },
  { t0: 11.5, t1: 16.5, x: 1.95, z: -1.2, color: [1.4, 1.0, 0.6] },
];
export const WHEELS: Wheel[] = [
  { t0: 4.8, t1: 7.9, x: -1.7, z: -2.6, color: green },
  { t0: 5.4, t1: 8.3, x: 1.75, z: -2.0, color: [1.6, 0.4, 0.9] },
  { t0: 12.2, t1: 16.5, x: -1.25, z: 0.9, color: gold },
  { t0: 12.5, t1: 16.5, x: 1.3, z: 0.9, color: cyan },
];
export const LADIS: Ladi[] = [{ t0: 5.3, t1: 6.8, a: [-3.2, 0.3, -12], b: [3.2, 0.3, -12], n: 42 }];
export const BOMBS: Bomb[] = [{ t: 7.3, x: 2.7, z: -8.5 }, { t: 12.35, x: -3.0, z: -7 }];
