// The reel's single timeline: reel time -> sim time, the recorded control actions the reel run replays (a fixed seed,
// a real sim), and the camera shots. Sections sit on the 120 BPM bar grid (bar 1 at 3.0 s, 2 s per bar).
import * as THREE from 'three';
import type { Action } from '../simulation/engine';

export const REEL_SECONDS = 68;
export const reelClock = { t: 0 };

/** the control actions of the reel run (sim ms). The console shows each one; the sim decides what happens. */
export const REEL_ACTIONS: Action[] = [
  { at: 14000, set: { appReplicas: 5 }, label: 'Console: app replicas 2 → 5' },
  { at: 30000, set: { cacheOn: true, cacheSize: 20000 }, label: 'Console: edge cache ON (20k entries)' },
  { at: 38000, set: { autoscale: true, asMin: 2, asMax: 12, asTarget: 0.55, asCooldown: 3000 }, label: 'Console: autoscaling ON' },
  { at: 46000, set: { workers: 10 }, label: 'Console: workers 6 → 10' },
  { at: 55000, set: { cacheSize: 40000 }, label: 'Console: cache size 20k → 40k' },
];

/** reel second -> sim ms. The hook (0-3 s) is a flash-forward to the meltdown (sim 22-25 s); 3-63 s plays sim 0-60 s live. */
export function simTimeAt(t: number): number {
  if (t < 3) return Math.round((22 + t) * 100) * 10;
  return Math.round(Math.min(60, Math.max(0, t - 3)) * 100) * 10;
}

interface Key { pos: [number, number, number]; look: [number, number, number]; fov: number }
type LabelKey = 'gateway' | 'cache' | 'lb' | 'app' | 'db' | 'jobs';
interface Shot { t0: number; t1: number; a: Key; b: Key; ease?: 'inout' | 'out' | 'in' | 'lin'; labels?: LabelKey[] }
const K = (pos: Key['pos'], look: Key['look'], fov = 50): Key => ({ pos, look, fov });

/**
 * The shots; a new shot is a hard cut (cut on motion), inside a shot the camera eases from a to b. Portrait framing
 * looks down the request path so the city recedes in depth; the frame centre sits 12 % above the middle (view offset)
 * because the bottom third belongs to the host and the captions.
 */
export const SHOTS: Shot[] = [
  { t0: 0, t1: 1.6, a: K([-70, 3.5, 5], [-30, 5, 0], 60), b: K([-46, 5, 4], [-14, 6, 0], 56), ease: 'lin', labels: [] },                          // riding the wave
  { t0: 1.6, t1: 3, a: K([-44, 14, 20], [16, 4, -3], 52), b: K([-36, 22, 26], [18, 4, -3], 50), ease: 'out', labels: ['db'] },                   // the city drowns, DB red
  { t0: 3, t1: 9, a: K([-40, 96, 8], [8, 0, 0], 48), b: K([-68, 34, 24], [6, 2, -1], 50), ease: 'inout', labels: ['gateway', 'cache', 'lb', 'app', 'db', 'jobs'] },   // the reveal crane
  { t0: 9, t1: 17, a: K([-50, 30, 16], [-6, 2, 0], 50), b: K([-42, 28, 15], [0, 2, 0], 50), ease: 'inout', labels: ['gateway', 'lb', 'app'] },  // traffic up, queues form
  { t0: 17, t1: 25, a: K([-17, 21, 25], [5, 4, 0], 52), b: K([-9, 19, 23], [6, 4, 0], 52), ease: 'inout', labels: ['lb', 'app'] },               // replicas rise
  { t0: 25, t1: 29, a: K([-4, 4.5, 11], [24, 6, -3], 56), b: K([7, 5, 6], [24, 6, -3], 52), ease: 'in', labels: [] },                            // the dive under the towers
  { t0: 29, t1: 33, a: K([4, 15, 22], [24, 6, -3], 50), b: K([7, 13, 19], [24, 7, -3], 48), ease: 'out', labels: ['db'] },                      // DB meltdown
  { t0: 33, t1: 37, a: K([-3, 15, 7], [-19, 5, -11], 50), b: K([-7, 12, 3], [-19, 6, -11], 48), ease: 'out', labels: ['cache'] },            // the cache vault fills
  { t0: 37, t1: 41, a: K([-44, 31, 19], [16, 3, -3], 50), b: K([-34, 30, 21], [17, 3, -3], 50), ease: 'inout', labels: ['cache', 'db'] },        // DB cools
  { t0: 41, t1: 49, a: K([-18, 25, 27], [5, 3, 0], 52), b: K([-10, 25, 29], [6, 3, 0], 52), ease: 'inout', labels: ['app'] },                    // autoscaling
  { t0: 49, t1: 57, a: K([-70, 44, 26], [6, 0, -1], 50), b: K([-60, 46, 32], [6, 0, -1], 50), ease: 'inout', labels: ['cache', 'app', 'db', 'jobs'] },   // recovery
  { t0: 57, t1: 63, a: K([-60, 30, 30], [6, 2, 0], 50), b: K([-64, 30, 22], [6, 2, 0], 50), ease: 'lin', labels: [] },                          // the console
  { t0: 63, t1: 68, a: K([24, 46, 50], [-2, 0, -2], 50), b: K([4, 54, 56], [-2, 0, -2], 48), ease: 'out', labels: [] },                          // hero
];

export const reelLabels = (t: number): string[] => (SHOTS.find((x) => t >= x.t0 && t < x.t1) ?? SHOTS[SHOTS.length - 1]).labels ?? [];
export const VIEW_SHIFT = 0.12;

const easeF = { inout: (x: number) => (x < 0.5 ? 16 * x ** 5 : 1 - (-2 * x + 2) ** 5 / 2), out: (x: number) => 1 - (1 - x) ** 4, in: (x: number) => x ** 3, lin: (x: number) => x };
const va = new THREE.Vector3(), vb = new THREE.Vector3(), la = new THREE.Vector3(), lb = new THREE.Vector3();
export function reelCamera(t: number) {
  const s = SHOTS.find((x) => t >= x.t0 && t < x.t1) ?? SHOTS[SHOTS.length - 1];
  const u = easeF[s.ease ?? 'inout'](Math.min(1, Math.max(0, (t - s.t0) / (s.t1 - s.t0))));
  va.set(...s.a.pos); vb.set(...s.b.pos); la.set(...s.a.look); lb.set(...s.b.look);
  return { pos: va.clone().lerp(vb, u), look: la.clone().lerp(lb, u), fov: s.a.fov + (s.b.fov - s.a.fov) * u };
}
