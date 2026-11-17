// Where everything sits on the circuit board (world units, y up), the colour code, and pure helpers the districts share.
// The request path runs left to right: clients -> Edge Gateway -> (Cache Vault) -> Load Balancer -> App District ->
// Database Core, with the Job Conveyor branching off the app district.
import * as THREE from 'three';
import type { Inst, Sim } from '../simulation/engine';

export const BOARD = { w: 84, d: 52 };
export const POS = {
  client: new THREE.Vector3(-46, 1.4, 0),
  gateway: new THREE.Vector3(-27, 0, 0),
  cache: new THREE.Vector3(-19, 0, -11),
  lb: new THREE.Vector3(-11, 0, 0),
  district: new THREE.Vector3(4, 0, 0),
  db: new THREE.Vector3(24, 0, -3),
  jobsIn: new THREE.Vector3(10, 0, 13),
  jobsOut: new THREE.Vector3(26, 0, 13),
  workers: new THREE.Vector3(30, 0, 14),
};

export const COLOR = {
  base: '#070d1c', metal: '#16213d', metalDark: '#0c1428', trace: '#0f3b5c',
  cyan: '#2ee6ff', amber: '#ffb020', coral: '#ff4d5e', grey: '#5d6780', emerald: '#2bff9a', violet: '#a98bff', orange: '#ff7a1a',
};

/** a 4 x 4 grid of tower slots in the App District */
export const SLOTS = 16, SLOT_GAP = 4.4;
export function slotPos(k: number): THREE.Vector3 {
  const c = k % 4, r = Math.floor(k / 4);
  return new THREE.Vector3(POS.district.x + (c - 1.5) * SLOT_GAP, 0, POS.district.z + (r - 1.5) * SLOT_GAP);
}

/** how long a decommissioned tower takes to sink before its slot is free */
export const SINK_MS = 1500;

/**
 * Tower slots as a pure function of the instance list: in launch order, each instance takes the lowest slot that is free
 * at its launch time (a slot frees SINK_MS after its tower is switched off). No frame history, so the reel can seek.
 */
export function slotsOf(insts: Inst[]): Map<number, number> {
  const out = new Map<number, number>(), freeAt = new Array(SLOTS).fill(-Infinity);
  for (const i of insts) {
    let k = 0;
    while (k < SLOTS && freeAt[k] > i.launchedAt) k++;
    if (k >= SLOTS) continue;
    out.set(i.id, k);
    freeAt[k] = i.state === 'off' ? i.offAt + SINK_MS : Infinity;
  }
  return out;
}

/** health colour of an instance */
export function instColor(i: Inst): string {
  if (i.state === 'off' || i.state === 'drain') return COLOR.grey;
  if (i.state === 'boot') return COLOR.cyan;
  if (i.degraded || i.util >= 0.95 || i.q.size > i.q.cap * 0.5) return COLOR.coral;
  if (i.util >= 0.7) return COLOR.amber;
  return COLOR.cyan;
}

/** colour for a utilization level */
export const utilColor = (u: number) => (u >= 0.95 ? COLOR.coral : u >= 0.7 ? COLOR.amber : COLOR.cyan);

/** average of the last n samples of a field (smooths the 10 Hz sample steps without any frame history) */
export function recent(sim: Sim, f: (s: NonNullable<ReturnType<Sim['last']>>) => number, n = 3): number {
  const xs = sim.samples, k = Math.min(n, xs.length);
  if (!k) return 0;
  let a = 0;
  for (let j = xs.length - k; j < xs.length; j++) a += f(xs[j]);
  return a / k;
}

/** integer hash -> [0, 1) */
export function hash(a: number, b = 0): number {
  let h = Math.imul(a ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(b + 0x632be5ab, 0xc2b2ae35);
  h ^= h >>> 16; h = Math.imul(h, 0x7feb352d); h ^= h >>> 15; h = Math.imul(h, 0x846ca68b); h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const easeOutBack = (x: number) => { const c = 1.6; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
export const smooth = (x: number) => { const t = clamp01(x); return t * t * (3 - 2 * t); };
