// The arrow in flight: a point mass with gravity and optional game-style drag, integrated at the physics step
// (semi-implicit Euler). Every step sweeps a ray from the tip along the step's motion (continuous collision: a
// 90 m/s arrow moves 0.75 m per step and cannot tunnel through a piece), and tests the challenge rings.
import { BOW, GROUP } from './config';
import type { Physics } from './physics';
import type { V3 } from './destructible';

export interface Ring { c: V3; n: V3; rIn: number; rOut: number; passed: boolean }

export interface Hit { t: number; p: V3; n: V3; dir: V3; speed: number; collider: number; ke: number }

export class Projectile {
  p: V3; v: V3; prevP: V3;
  t0: number; alive = true;
  /** Recent tip positions (for the trail), newest last. */
  trail: number[] = [];
  /** After a hit: the piece it is lodged in, its offset in that piece's frame, and when. */
  stuck: { target: string; chunk: number; local: V3; dir: V3; t: number } | null = null;
  rings: number[] = [];
  clanged = false;
  speed0: number; power: number;
  constructor(public id: number, p: V3, v: V3, t: number, public mode: string, power: number) {
    this.p = [...p]; this.v = [...v]; this.prevP = [...p]; this.t0 = t; this.speed0 = Math.hypot(...v); this.power = power;
    this.trail.push(...p);
  }

  get dir(): V3 { const s = Math.hypot(...this.v) || 1; return [this.v[0] / s, this.v[1] / s, this.v[2] / s]; }

  /** Integrate one step; returns a hit, or null. */
  step(t: number, dt: number, g: number, drag: boolean, phys: Physics, rings: Ring[]): Hit | null {
    if (!this.alive || this.stuck) return null;
    this.prevP = [...this.p];
    const v = this.v, s = Math.hypot(v[0], v[1], v[2]);
    const k = drag ? BOW.DRAG * s : 0;
    v[0] -= k * v[0] * dt; v[1] -= (g + k * v[1]) * dt; v[2] -= k * v[2] * dt;
    const dx = v[0] * dt, dy = v[1] * dt, dz = v[2] * dt, len = Math.hypot(dx, dy, dz);
    if (len > 0) {
      const ux = dx / len, uy = dy / len, uz = dz / len;
      const h = phys.ray(this.p[0], this.p[1], this.p[2], ux, uy, uz, len, GROUP.RAY);
      // rings: does this step's segment cross a ring's plane inside it (pass) or on its rim (clang)?
      for (let r = 0; r < rings.length; r++) {
        const R = rings[r]!;
        const s0 = (this.p[0] - R.c[0]) * R.n[0] + (this.p[1] - R.c[1]) * R.n[1] + (this.p[2] - R.c[2]) * R.n[2];
        const s1 = s0 + dx * R.n[0] + dy * R.n[1] + dz * R.n[2];
        if ((s0 > 0) === (s1 > 0) || (h && h.t < len * (s0 / (s0 - s1)))) continue;
        const u = s0 / (s0 - s1);
        const X = [this.p[0] + dx * u - R.c[0], this.p[1] + dy * u - R.c[1], this.p[2] + dz * u - R.c[2]];
        const along = X[0]! * R.n[0] + X[1]! * R.n[1] + X[2]! * R.n[2];
        const rr = Math.hypot(X[0]! - along * R.n[0], X[1]! - along * R.n[1], X[2]! - along * R.n[2]);
        if (rr < R.rIn) { if (!this.rings.includes(r)) this.rings.push(r); }
        else if (rr < R.rOut) {
          // struck the rim: bounce off with most of the speed lost
          this.clanged = true;
          const vn = v[0] * R.n[0] + v[1] * R.n[1] + v[2] * R.n[2];
          v[0] = (v[0] - 2 * vn * R.n[0]) * 0.25; v[1] = (v[1] - 2 * vn * R.n[1]) * 0.25; v[2] = (v[2] - 2 * vn * R.n[2]) * 0.25;
          this.trail.push(...this.p);
          return null;
        }
      }
      if (h) {
        this.p = h.p;
        const sp = Math.hypot(v[0], v[1], v[2]);
        this.trail.push(...this.p);
        return { t, p: h.p, n: h.n, dir: [ux, uy, uz], speed: sp, collider: h.collider, ke: 0.5 * BOW.ARROW_MASS * sp * sp };
      }
      this.p = [this.p[0] + dx, this.p[1] + dy, this.p[2] + dz];
    }
    this.trail.push(...this.p);
    if (this.trail.length > 3 * 90) this.trail.splice(0, this.trail.length - 3 * 90);
    if (this.p[1] < -260 || t - this.t0 > 14) this.alive = false;
    return null;
  }
}

/** The ballistic path from p with velocity v, until it falls below yMin or `steps` run out (aim preview, ring solver). */
export function ballistic(p: V3, v: V3, g: number, drag: boolean, dt: number, steps: number, yMin = -200): number[] {
  const out: number[] = [p[0], p[1], p[2]];
  const P = [...p], U = [...v];
  for (let i = 0; i < steps; i++) {
    const s = Math.hypot(U[0]!, U[1]!, U[2]!), k = drag ? BOW.DRAG * s : 0;
    U[0]! -= k * U[0]! * dt; U[1]! -= (g + k * U[1]!) * dt; U[2]! -= k * U[2]! * dt;
    P[0]! += U[0]! * dt; P[1]! += U[1]! * dt; P[2]! += U[2]! * dt;
    out.push(P[0]!, P[1]!, P[2]!);
    if (P[1]! < yMin) break;
  }
  return out;
}
