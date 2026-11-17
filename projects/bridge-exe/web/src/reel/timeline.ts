// The reel's single timeline (portrait 1080×1920, 60 fps). Section windows and word times come from
// SCENE_TIMINGS.json (written from the measured voice takes); the mixer and the Remotion overlay read the same file.
// This file only decides WHAT the app shows at time t: which design, which solver run, which lens, which camera.
// The numbers themselves come from the runs computed in ReelMode.installReel (real solves of the exact designs).
import TIMING from '../../../SCENE_TIMINGS.json';
import { DEFAULT_PARAMS, type TrussParams } from '../geometry/trussPresets';
import { DEFAULT_LOADS } from '../engineering/model';
import { MATERIALS } from '../engineering/materials';
import type { Design, Lens } from '../store';
import { canyonCenter } from '../world/terrain';

export const T = TIMING;
export const sec = (id: string) => T.sections.find((s) => s.id === id)!;
/** time a word of a line is spoken (first match of the word's start) */
export const wordAt = (line: string, w: string, fallback: number) => {
  const l = T.lines.find((x) => x.id === line);
  return l?.words.find((x) => x.w.toLowerCase().replace(/[^a-z0-9.]/g, '').startsWith(w.toLowerCase()))?.t0 ?? fallback;
};

export const REEL = {
  mag: 40,                                   // visual deflection magnification shown on screen as ×40
  truckX: 28, truckP: 300e3,                 // per truss plane; the truck drawn is 2 × P
  spanFrom: 48, spanTo: 56, dragNode: 'T4', dragTo: 1.75,
  heightB: 8,
  breakPanel: 4,
};

const steel = MATERIALS[0];
const params = (p: Partial<TrussParams>): TrussParams => ({ ...DEFAULT_PARAMS, ...p });
/** design A: the 56 m Pratt after the reel's span change and T4 drag, deck load + truck parked at midspan */
export const DESIGN_A: Design = { params: params({ span: REEL.spanTo, offsets: { T4: { dx: 0, dy: REEL.dragTo } } }), material: steel, loads: { ...DEFAULT_LOADS, vehicle: { on: true, x: REEL.truckX, P: REEL.truckP } } };
/** design B: the same bridge with a deeper truss (height 6 -> 8 m) */
export const DESIGN_B: Design = { ...DESIGN_A, params: { ...DESIGN_A.params, height: REEL.heightB } };
/** the opening state of the reveal: the default 48 m Pratt, deck load only */
export const DESIGN_0: Design = { params: params({}), material: steel, loads: { ...DEFAULT_LOADS, vehicle: { on: false, x: -30, P: REEL.truckP } } };

const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lin = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
export const E = {
  inout: (x: number) => (x < 0.5 ? 16 * x ** 5 : 1 - (-2 * x + 2) ** 5 / 2),
  out: (x: number) => 1 - (1 - x) ** 4,
  out5: (x: number) => 1 - (1 - x) ** 5,
  in: (x: number) => x ** 3,
  lin: (x: number) => x,
};

export interface ReelState {
  section: string;
  design: Design;
  run: 'A' | 'B' | null;
  lens: Lens; k: number; pulse: number;
  mode: 'lab' | 'arcade'; arcadeT: number | null;
  compare: boolean; labels: boolean; reactions: boolean; handles: boolean; dragging: string | null; ghost: boolean;
  tags: string[]; showIds: boolean; night: boolean; loads: boolean;
}

/** the design on screen at t (span slider steps, drag snaps, truck drive) */
function designAt(t: number): Design {
  const g = sec('geometry'), ld = sec('load');
  if (t < g.t0) return DESIGN_0;
  // span slider: 48 -> 56 in 2 m steps
  const spanSteps = Math.min(4, Math.floor(lin(t, g.t0 + 0.5, g.t0 + 2.5) * 4 + 1e-9));   // one 2 m step per beat
  const span = REEL.spanFrom + spanSteps * 2;
  // T4 drag in 0.25 m snaps
  const dragSteps = Math.min(7, Math.floor(lin(t, g.t0 + 3.5, g.t0 + 5.25) * 7 + 1e-9));   // one 0.25 m snap per eighth note
  const offsets: Record<string, { dx: number; dy: number }> = dragSteps ? { T4: { dx: 0, dy: dragSteps * 0.25 } } : {};
  const base: Design = { ...DESIGN_0, params: params({ span, offsets }) };
  if (t < ld.t0 + 0.3) return span === REEL.spanTo && dragSteps * 0.25 === REEL.dragTo ? { ...base, params: DESIGN_A.params } : base;
  // the truck drives in from the approach road and parks at midspan (exactly design A from then on)
  const u = E.out(lin(t, ld.t0 + 0.3, ld.t0 + 3.9));
  if (u >= 1) return DESIGN_A;
  return { ...DESIGN_A, loads: { ...DESIGN_A.loads, vehicle: { ...DESIGN_A.loads.vehicle, x: -34 + (REEL.truckX + 34) * u } } };
}
export const RUN_AT = () => sec('load').t0 + 4.9;   // the RUN ANALYSIS press

export function reelState(t: number): ReelState {
  const id = (T.sections.find((s) => t >= s.t0 && t < s.t1) ?? T.sections[T.sections.length - 1]).id;
  const base: ReelState = { section: id, design: DESIGN_A, run: 'A', lens: 'real', k: 0, pulse: -1, mode: 'lab', arcadeT: null, compare: false,
    labels: true, reactions: true, handles: false, dragging: null, ghost: false, tags: [], showIds: false, night: false, loads: false };
  switch (id) {
    case 'hook': {
      // flash-forward: run A under axial colours, the deflection eases in (static result × visual magnification)
      return { ...base, lens: 'path', k: 0.25 + 0.75 * E.out5(lin(t, 0.1, 1.5)), labels: false, reactions: false, tags: [] };
    }
    case 'reveal': return { ...base, design: DESIGN_0, run: null, labels: t > sec('reveal').t0 + 3.5, reactions: false };
    case 'geometry': {
      const g = sec('geometry');
      const dragging = t >= g.t0 + 2.9 && t < g.t0 + 5.9 ? REEL.dragNode : null;
      return { ...base, design: designAt(t), run: null, handles: t >= g.t0 + 2.5, dragging, reactions: false };
    }
    case 'load': {
      const run = t >= RUN_AT() + 0.12;
      return { ...base, design: designAt(t), run: run ? 'A' : null, pulse: run ? clamp((t - RUN_AT() - 0.12) / 0.9, 0, 1.2) : -1, reactions: run, lens: 'real', loads: true };
    }
    case 'lenses': {
      const tDef = wordAt('v05', 'deflection', 26.4) - 0.1, tAx = wordAt('v05', 'forces', 27.3), tRe = wordAt('v05', 'reactions', 28.8);
      const lens: Lens = t < tAx ? 'deform' : t < tRe ? 'axial' : t < sec('lenses').t0 + 6.4 ? 'path' : 'axial';
      const k = lens === 'deform' ? E.out5(lin(t, tDef, tDef + 0.7)) : lens === 'path' ? 1 : 0;
      return { ...base, lens, k, tags: t >= tAx + 0.3 ? ['TC3', 'BC4', 'D1'] : [], reactions: t >= tRe - 0.2, loads: true };
    }
    case 'compare': return { ...base, compare: true, lens: 'deform', k: E.out5(lin(t, sec('compare').t0 + 0.6, sec('compare').t0 + 1.6)), labels: false, reactions: false };
    case 'cad': return { ...base, lens: 'real', labels: false, reactions: false, showIds: true };
    case 'arcade': return { ...base, mode: 'arcade', arcadeT: t - (sec('arcade').t0 + 1.0), labels: false, reactions: false };
    case 'evidence': return { ...base, lens: 'axial', reactions: true, labels: true, tags: ['TC3', 'BC4'], loads: true };
    default: return { ...base, lens: 'real', labels: false, reactions: false };
  }
}

type Pose = { pos: [number, number, number]; look: [number, number, number]; fov: number };
interface Shot { t0: number; t1: number; a: Pose; b: Pose; ease?: keyof typeof E }
const K = (pos: Pose['pos'], look: Pose['look'], fov = 50): Pose => ({ pos, look, fov });

/** camera shots: a new shot is a hard cut (cut on motion); inside a shot the camera eases from a to b */
export function shots(): Shot[] {
  const S = (id: string) => sec(id), g = S('geometry'), ld = S('load'), ln = S('lenses'), ar = S('arcade');
  const cx = canyonCenter(80);
  return [
    { t0: 0, t1: 2.7, a: K([-36, 15, 36], [4, -1.5, 0], 50), b: K([-26, 11.5, 27], [4, -0.5, 0], 50), ease: 'out' },
    { t0: 2.7, t1: S('hook').t1, a: K([-25.6, 11.3, 26.6], [4, -0.5, 0], 50), b: K([-25.3, 11.2, 26.3], [4, -0.5, 0], 50), ease: 'lin' },
    { t0: S('reveal').t0, t1: S('reveal').t1, a: K([cx, -46, 80], [0, -12, 0], 52), b: K([-22, 13, 50], [0, 2.5, 0], 46), ease: 'inout' },
    { t0: g.t0, t1: g.t0 + 2.6, a: K([-30, 11, 52], [0, 3, 0], 44), b: K([-28, 10.5, 50], [0, 3, 0], 44), ease: 'lin' },
    { t0: g.t0 + 2.6, t1: g.t1, a: K([-11, 8.5, 25], [0, 5.5, 3], 46), b: K([-8, 8.8, 23], [0, 5.8, 3], 46), ease: 'inout' },
    { t0: ld.t0, t1: ld.t0 + 4.2, a: K([-62, 3.2, 8.5], [-38, 2.4, 0], 50), b: K([-16, 4.2, 9.5], [10, 2.5, 0], 50), ease: 'inout' },
    { t0: ld.t0 + 4.2, t1: ld.t1, a: K([-30, 7, 34], [2, 3, 0], 46), b: K([-27, 7.5, 33], [2, 3, 0], 46), ease: 'out' },
    { t0: ln.t0, t1: ln.t0 + 4.2, a: K([-26, 3.5, 25], [2, 3.2, 0], 48), b: K([-17, 2.6, 28], [3, 3.2, 0], 48), ease: 'inout' },
    { t0: ln.t0 + 4.2, t1: ln.t1, a: K([-38, -4, 36], [0, 2, 0], 46), b: K([-33, -2, 39], [1, 2.4, 0], 46), ease: 'inout' },
    { t0: S('compare').t0, t1: S('compare').t1, a: K([-38, 7, 44], [0, 3.2, 0], 40), b: K([-33, 8, 47], [0, 3.2, 0], 40), ease: 'inout' },
    { t0: S('cad').t0, t1: S('cad').t1, a: K([-24, 5, 34], [0, 3.5, 0], 44), b: K([-20, 5.5, 35], [1, 3.5, 0], 44), ease: 'inout' },
    { t0: ar.t0, t1: ar.t0 + 2.2, a: K([-36, 4, 30], [0, 2, 0], 50), b: K([-33, 3.5, 31], [0, 1.5, 0], 50), ease: 'lin' },
    // follow: filled in by ReelMode from the precomputed fragment path
    { t0: ar.t0 + 2.2, t1: ar.t1, a: K([0, 0, 0], [0, 0, 0], 52), b: K([0, 0, 0], [0, 0, 0], 52), ease: 'lin' },
    { t0: S('evidence').t0, t1: S('evidence').t1, a: K([-31, 6.5, 36], [2, 3, 0], 44), b: K([-30, 6.7, 35], [2, 3, 0], 44), ease: 'lin' },
    { t0: S('cta').t0, t1: T.duration + 1, a: K([34, 4.5, 40], [-6, 4.5, -2], 48), b: K([44, 6.5, 26], [-8, 5, -3], 48), ease: 'inout' },
  ];
}
export const FOLLOW_FROM = () => sec('arcade').t0 + 2.2;

export function cameraAt(t: number, list = shots()): Pose {
  const s = list.find((x) => t >= x.t0 && t < x.t1) ?? list[list.length - 1];
  const u = E[s.ease ?? 'inout'](clamp((t - s.t0) / (s.t1 - s.t0)));
  const L = (a: number[], b: number[]) => a.map((v, i) => v + (b[i] - v) * u) as [number, number, number];
  return { pos: L(s.a.pos, s.b.pos), look: L(s.a.look, s.b.look), fov: s.a.fov + (s.b.fov - s.a.fov) * u };
}
