// The camera director, kept apart from the physics. Live play: five modes with spring smoothing and cinematic
// cuts. The reel: shot functions that are pure functions of time (see reel/shots.ts). Shake only around impacts,
// from a deterministic noise, so a replay or a seek shakes the same way.
import * as THREE from 'three';
import type { CameraMode } from '../core/config';
import { BowRig } from '../core/bowrig';
import type { Projectile } from '../core/projectile';
import { hashi } from '../core/noise';

export interface CamPose { pos: THREE.Vector3; look: THREE.Vector3; fov: number; roll?: number }
type V3 = [number, number, number];

/** Smooth 1D noise in [-1, 1] (for shake). */
export function noise1(x: number, seed: number) {
  const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
  return (hashi(i, seed) * (1 - u) + hashi(i + 1, seed) * u) * 2 - 1;
}

export interface Shake { t0: number; amp: number; p: V3 }

/** Camera shake offset at time t for the camera at `cam` (amplitude falls off with distance to each impact). */
export function shakeAt(list: Shake[], t: number, cam: THREE.Vector3): THREE.Vector3 {
  const o = new THREE.Vector3();
  for (const s of list) {
    const age = t - s.t0;
    if (age < 0 || age > 2.2) continue;
    const d = cam.distanceTo(new THREE.Vector3(...s.p));
    const k = s.amp * Math.exp(-age / 0.38) * (1 / (1 + d / 70)) * Math.min(1, age / 0.02);
    o.x += noise1(t * 26, 11) * k; o.y += noise1(t * 24, 12) * k; o.z += noise1(t * 22, 13) * k * 0.5;
  }
  return o;
}

/** The game camera over the bow's right shoulder, pushed in as the string is drawn. */
export function bowPose(rig: BowRig, t: number, portrait: boolean, pull = 0): CamPose {
  const p = rig.pos(t), F = rig.frame(rig.aimYaw, rig.aimPitch), aim = BowRig.dir(rig.aimYaw, rig.aimPitch);
  // three-quarter view from behind and to the right: the recurve silhouette reads, the target stays in view
  // (a portrait frame is only about 31 degrees wide: from 1.35 m to the side the bow fell outside it, so phones come in behind)
  const back = (portrait ? 3.9 : 2.9) - 0.5 * pull, side = portrait ? 0.45 : 2.05, up = portrait ? 0.85 : 0.62;
  const pos = new THREE.Vector3(p[0] + F.x[0] * side + F.y[0] * up + F.z[0] * back, p[1] + F.x[1] * side + F.y[1] * up + F.z[1] * back, p[2] + F.x[2] * side + F.y[2] * up + F.z[2] * back);
  const look = new THREE.Vector3(p[0] + aim[0] * 20, p[1] + aim[1] * 20 + 0.5, p[2] + aim[2] * 20);
  return { pos, look, fov: portrait ? 62 : 48 };
}

/** A wide shot of an impact, from the side the arrow came from, a little to the right and above. */
export function impactPose(p: V3, n: V3, r: number, portrait: boolean): CamPose {
  const N = new THREE.Vector3(...n); if (N.z < 0.2) N.z = 0.2; N.normalize();
  const side = new THREE.Vector3().crossVectors(N, new THREE.Vector3(0, 1, 0)).normalize();
  const d = 44 + r * 2.0;
  const pos = new THREE.Vector3(...p).addScaledVector(N, d).addScaledVector(side, d * 0.7).add(new THREE.Vector3(0, d * 0.18, 0));
  return { pos, look: new THREE.Vector3(...p).addScaledVector(N, r * 0.6).add(new THREE.Vector3(0, -3, 0)), fov: portrait ? 62 : 48 };
}

export class CameraRig {
  cam: THREE.PerspectiveCamera;
  mode: CameraMode = 'cinematic';
  pos = new THREE.Vector3(1.4, 4, 3.4); look = new THREE.Vector3(0, 4, -20); fov = 48;
  private vPos = new THREE.Vector3(); private vLook = new THREE.Vector3();
  cut: { until: number; pose: CamPose } | null = null;
  shakes: Shake[] = [];
  autoCut = true;

  constructor(aspect: number) {
    this.cam = new THREE.PerspectiveCamera(48, aspect, 0.03, 4000);
  }

  /** Critically damped spring towards a pose (w: stiffness, rad/s). */
  private spring(target: CamPose, dt: number, w = 6) {
    dt = Math.min(dt, 0.1);
    const n = Math.max(1, Math.ceil(dt / (1 / 120))), h = dt / n;
    const step = (x: THREE.Vector3, v: THREE.Vector3, to: THREE.Vector3) => {
      const a = new THREE.Vector3().subVectors(to, x).multiplyScalar(w * w).addScaledVector(v, -2 * w);
      v.addScaledVector(a, h); x.addScaledVector(v, h);
    };
    for (let i = 0; i < n; i++) { step(this.pos, this.vPos, target.pos); step(this.look, this.vLook, target.look); }
    this.fov += (target.fov - this.fov) * (1 - Math.exp(-dt * 4));
  }

  snap(p: CamPose) { this.pos.copy(p.pos); this.look.copy(p.look); this.fov = p.fov; this.vPos.set(0, 0, 0); this.vLook.set(0, 0, 0); }

  /** Live update. Returns false in free-orbit mode (OrbitControls owns the camera then). */
  update(dt: number, t: number, ctx: { rig: BowRig; tSim: number; arrow: Projectile | null; portrait: boolean; impact: { p: V3; n: V3; r: number; t: number } | null; replayOrbit?: { c: V3; a: number } }) {
    if (this.mode === 'orbit') return false;
    const { rig, arrow, portrait, impact } = ctx;
    let target: CamPose;
    let w = 6;
    if (ctx.replayOrbit) {
      const c = new THREE.Vector3(...ctx.replayOrbit.c), a = ctx.replayOrbit.a;
      target = { pos: c.clone().add(new THREE.Vector3(Math.sin(a) * 42, 12, Math.cos(a) * 42)), look: c, fov: portrait ? 58 : 44 };
      w = 3;
    } else if (this.cut && t < this.cut.until) { target = this.cut.pose; w = 30; }
    else {
      this.cut = null;
      const pull = rig.power;
      target = bowPose(rig, ctx.tSim, portrait, pull);
      if (this.mode === 'follow' && arrow && arrow.alive) {
        const d = arrow.dir, p = arrow.p;
        let sx = -d[2], sz = d[0]; const l = Math.hypot(sx, sz) || 1; sx /= l; sz /= l;
        target = { pos: new THREE.Vector3(p[0] - d[0] * 4.6 + sx * 0.9, p[1] - d[1] * 4.6 + 0.95, p[2] - d[2] * 4.6 + sz * 0.9), look: new THREE.Vector3(p[0] + d[0] * 30, p[1] + d[1] * 30, p[2] + d[2] * 30), fov: portrait ? 66 : 54 };
        w = 26;
      } else if ((this.mode === 'impact' || this.mode === 'follow') && impact && ctx.tSim - impact.t < 3.2) {
        target = impactPose(impact.p, impact.n, impact.r, portrait); w = this.mode === 'follow' ? 5 : 8;
      } else if (this.mode === 'impact') {
        target = impactPose([0, 12, -96], [0, 0, 1], 12, portrait);
      } else if (this.mode === 'cinematic' && arrow && arrow.alive) {
        // follow the flight with the eyes, drifting forward a little
        const p = arrow.p;
        target = { pos: target.pos.clone().lerp(new THREE.Vector3(p[0], p[1], p[2]), 0.04), look: target.look.clone().lerp(new THREE.Vector3(p[0], p[1], p[2]), 0.55), fov: target.fov - 4 };
        w = 5;
      }
    }
    this.spring(target, dt, w);
    const sh = shakeAt(this.shakes, ctx.tSim, this.pos);
    this.apply(this.pos.clone().add(sh), this.look.clone().add(sh.clone().multiplyScalar(0.6)), this.fov, 0);
    return true;
  }

  /** Cinematic cut to an impact (cinematic mode, when auto cuts are on). */
  cutTo(pose: CamPose, until: number) { if (this.autoCut && this.mode === 'cinematic') { this.cut = { until, pose }; this.snap(pose); } }

  apply(pos: THREE.Vector3, look: THREE.Vector3, fov: number, roll = 0) {
    this.cam.position.copy(pos);
    this.cam.up.set(Math.sin(roll), Math.cos(roll), 0);
    this.cam.lookAt(look);
    if (Math.abs(this.cam.fov - fov) > 1e-3) { this.cam.fov = fov; this.cam.updateProjectionMatrix(); }
  }
}
