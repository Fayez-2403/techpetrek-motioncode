// The Rapier world: a fixed 1/120 s step, gravity from the preset, and a map from collider handles to the
// piece they belong to (so a ray hit or a contact can be traced back to a target and a chunk).
import RAPIER from '@dimforge/rapier3d-compat';
import { PHYS_DT } from './config';

export type R = typeof RAPIER;
let ready: Promise<void> | null = null;
export function initRapier() { return (ready ??= RAPIER.init()); }
export { RAPIER };

export interface Owner { target: string; chunk: number }

export class Physics {
  world: RAPIER.World;
  events: RAPIER.EventQueue;
  owners = new Map<number, Owner>();
  gravity = 9.81;
  constructor() {
    this.world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
    this.world.timestep = PHYS_DT;
    this.world.numSolverIterations = 4;
    this.events = new RAPIER.EventQueue(true);
  }
  setGravity(g: number) { this.gravity = g; this.world.gravity = { x: 0, y: -g, z: 0 }; }
  step() { this.world.step(this.events); }
  /** One step with nothing able to move (every body fixed): builds the broad phase, so ray casts work before the first real step. */
  prime() { this.world.step(this.events); this.events.drainContactForceEvents(() => {}); }
  /** First collider hit along the segment from (x, y, z) in direction d (unit) within len. */
  ray(x: number, y: number, z: number, dx: number, dy: number, dz: number, len: number, groups: number) {
    const ray = new RAPIER.Ray({ x, y, z }, { x: dx, y: dy, z: dz });
    const hit = this.world.castRayAndGetNormal(ray, len, true, undefined, groups);
    if (!hit) return null;
    const t = hit.timeOfImpact;
    return { t, p: [x + dx * t, y + dy * t, z + dz * t] as [number, number, number], n: [hit.normal.x, hit.normal.y, hit.normal.z] as [number, number, number], collider: hit.collider.handle };
  }
  dispose() { this.events.free(); this.world.free(); }
}
