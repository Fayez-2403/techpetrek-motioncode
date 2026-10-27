// A destructible target in the physics world. Every piece is a Rapier rigid body with a convex-hull collider;
// it starts fixed (the intact target) and becomes dynamic when it breaks off, gets pushed, collapses or is
// lifted. Support: pieces cut off from the target's anchored core lose support and fall, staggered, as a chain.
// State is plain typed arrays (no DOM, no WebGL): the view reads it, the tests read it.
import { RAPIER, type Physics } from './physics';
import { GROUP, MATERIALS, type MaterialId, type MaterialPreset } from './config';
import type { Fracture } from './fracture';
import { hashi } from './noise';

export type V3 = [number, number, number];
export type Q4 = [number, number, number, number];

export const enum PieceState { Attached = 0, Loose = 1, Gone = 2 }

export interface Placement { p: V3; q: Q4 }

const rot = (q: Q4, x: number, y: number, z: number): V3 => {
  // v' = q v q*
  const [qx, qy, qz, qw] = q;
  const tx = 2 * (qy * z - qz * y), ty = 2 * (qz * x - qx * z), tz = 2 * (qx * y - qy * x);
  return [x + qw * tx + (qy * tz - qz * ty), y + qw * ty + (qz * tx - qx * tz), z + qw * tz + (qx * ty - qy * tx)];
};

/**
 * A convex-hull collider for a piece. Rapier's hull can reject a near-degenerate point set (about 1 piece in 200),
 * so on failure retry with a tiny deterministic jitter, then fall back to the points' bounding box.
 */
function hullCollider(w: RAPIER.World, pts: Float32Array, salt: number, dress: (d: RAPIER.ColliderDesc) => RAPIER.ColliderDesc, body: RAPIER.RigidBody) {
  try { return w.createCollider(dress(RAPIER.ColliderDesc.convexHull(pts)!), body); } catch { /* retry */ }
  const j = pts.map((v, k) => v + (hashi(salt, k, 0, 77) - 0.5) * 2e-3);
  try { return w.createCollider(dress(RAPIER.ColliderDesc.convexHull(j)!), body); } catch { /* box */ }
  let x0 = Infinity, y0 = Infinity, z0 = Infinity, x1 = -Infinity, y1 = -Infinity, z1 = -Infinity;
  for (let k = 0; k < pts.length; k += 3) {
    x0 = Math.min(x0, pts[k]!); x1 = Math.max(x1, pts[k]!); y0 = Math.min(y0, pts[k + 1]!); y1 = Math.max(y1, pts[k + 1]!); z0 = Math.min(z0, pts[k + 2]!); z1 = Math.max(z1, pts[k + 2]!);
  }
  const d = RAPIER.ColliderDesc.cuboid(Math.max(0.1, (x1 - x0) / 2), Math.max(0.1, (y1 - y0) / 2), Math.max(0.1, (z1 - z0) / 2)).setTranslation((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  return w.createCollider(dress(d), body);
}

export class Destructible {
  readonly n: number;
  mat: MaterialPreset;
  matId: MaterialId;
  /** Rest pose of every piece in world space: centroid (3n) and the placement rotation. */
  rest: Float32Array;
  readonly restQ: Q4;
  state: Uint8Array;
  damage: Float32Array;
  mass: Float32Array;
  /** Visual-only histories (read by the view as functions of time): crack glow, heat, detach time. */
  glowT0: Float64Array; glowAmp: Float32Array;
  heatT0: Float64Array; heatDur: Float32Array; heatPeak: Float32Array; coolT0: Float64Array;
  detachT: Float64Array;
  freshUntil: Float64Array; floatUntil: Float64Array; gscale: Float32Array;
  /** Interpolation: previous and current pose of every piece (3n positions, 4n quaternions). */
  prevP: Float32Array; curP: Float32Array; prevQ: Float32Array; curQ: Float32Array;
  bodies: number[] = []; colliders: number[] = [];
  /** Scheduled breaks (collapse, heat): time, piece, velocity, spin. Kept sorted by time. */
  pend: { at: number; i: number; v: V3; w: V3; cause: string }[] = [];
  scheduled: Uint8Array;
  totalVol: number; looseVol = 0;
  supportDirty = false; supportHold = 0;
  /** Pieces broken this step (the sim turns them into events). */
  broke: { i: number; cause: string }[] = [];

  constructor(public id: string, public fr: Fracture, public phys: Physics, public place: Placement, matId: MaterialId) {
    this.n = fr.chunks.length;
    this.matId = matId; this.mat = MATERIALS[matId];
    const n = this.n;
    this.rest = new Float32Array(3 * n); this.restQ = place.q;
    this.state = new Uint8Array(n); this.damage = new Float32Array(n); this.mass = new Float32Array(n);
    this.glowT0 = new Float64Array(n).fill(-1e9); this.glowAmp = new Float32Array(n);
    this.heatT0 = new Float64Array(n).fill(1e9); this.heatDur = new Float32Array(n).fill(1); this.heatPeak = new Float32Array(n); this.coolT0 = new Float64Array(n).fill(1e9);
    this.detachT = new Float64Array(n).fill(1e9);
    this.freshUntil = new Float64Array(n); this.floatUntil = new Float64Array(n); this.gscale = new Float32Array(n).fill(1);
    this.prevP = new Float32Array(3 * n); this.curP = new Float32Array(3 * n); this.prevQ = new Float32Array(4 * n); this.curQ = new Float32Array(4 * n);
    this.scheduled = new Uint8Array(n);
    this.totalVol = 0;
    const w = phys.world;
    for (let i = 0; i < n; i++) {
      const ch = fr.chunks[i]!;
      const c = rot(place.q, ch.c[0], ch.c[1], ch.c[2]);
      const px = place.p[0] + c[0], py = place.p[1] + c[1], pz = place.p[2] + c[2];
      this.rest.set([px, py, pz], 3 * i);
      const body = w.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(px, py, pz)
        .setRotation({ x: place.q[0], y: place.q[1], z: place.q[2], w: place.q[3] }).setLinearDamping(0.02).setAngularDamping(0.06));
      const col = hullCollider(w, ch.hull, i, (desc) => desc.setDensity(this.mat.density).setRestitution(this.mat.restitution).setFriction(this.mat.friction)
        .setCollisionGroups(GROUP.STATIC).setActiveEvents(RAPIER.ActiveEvents.CONTACT_FORCE_EVENTS)
        .setContactForceEventThreshold(ch.vol * this.mat.density * 90), body);
      this.bodies.push(body.handle); this.colliders.push(col.handle);
      phys.owners.set(col.handle, { target: id, chunk: i });
      this.mass[i] = ch.vol * this.mat.density;
      this.totalVol += ch.vol;
    }
    this.resetPoses();
  }

  body(i: number) { return this.phys.world.getRigidBody(this.bodies[i]!); }
  collider(i: number) { return this.phys.world.getCollider(this.colliders[i]!); }
  /** Current world centroid of a piece (rest pose while attached). */
  centre(i: number): V3 { const a = this.state[i] === PieceState.Attached ? this.rest : this.curP; return [a[3 * i]!, a[3 * i + 1]!, a[3 * i + 2]!]; }
  get looseFraction() { return this.looseVol / this.totalVol; }

  private resetPoses() {
    const [qx, qy, qz, qw] = this.restQ;
    for (let i = 0; i < this.n; i++) {
      for (const a of [this.prevP, this.curP]) a.set(this.rest.subarray(3 * i, 3 * i + 3), 3 * i);
      for (const a of [this.prevQ, this.curQ]) a.set([qx, qy, qz, qw], 4 * i);
    }
  }

  /** Put every piece back (no re-creation: bodies are switched back to fixed at their rest pose). */
  reset() {
    for (let i = 0; i < this.n; i++) {
      const b = this.body(i), c = this.collider(i);
      b.setEnabled(true);
      b.setBodyType(RAPIER.RigidBodyType.Fixed, false);
      b.setTranslation({ x: this.rest[3 * i]!, y: this.rest[3 * i + 1]!, z: this.rest[3 * i + 2]! }, false);
      b.setRotation({ x: this.restQ[0], y: this.restQ[1], z: this.restQ[2], w: this.restQ[3] }, false);
      b.setLinvel({ x: 0, y: 0, z: 0 }, false); b.setAngvel({ x: 0, y: 0, z: 0 }, false);
      b.setGravityScale(1, false); b.setLinearDamping(0.02);
      c.setCollisionGroups(GROUP.STATIC);
    }
    this.state.fill(0); this.damage.fill(0); this.glowT0.fill(-1e9); this.glowAmp.fill(0);
    this.heatT0.fill(1e9); this.heatPeak.fill(0); this.coolT0.fill(1e9); this.detachT.fill(1e9);
    this.freshUntil.fill(0); this.floatUntil.fill(0); this.gscale.fill(1); this.scheduled.fill(0);
    this.pend = []; this.looseVol = 0; this.supportDirty = false; this.supportHold = 0; this.broke = [];
    this.resetPoses();
  }

  setMaterial(id: MaterialId) {
    this.matId = id; this.mat = MATERIALS[id];
    for (let i = 0; i < this.n; i++) {
      const c = this.collider(i);
      c.setDensity(this.mat.density); c.setRestitution(this.mat.restitution); c.setFriction(this.mat.friction);
      c.setContactForceEventThreshold(this.fr.chunks[i]!.vol * this.mat.density * 90);
      this.mass[i] = this.fr.chunks[i]!.vol * this.mat.density;
    }
  }

  /** Break a piece off now with velocity v and spin w. */
  breakOff(i: number, t: number, v: V3, w: V3, cause: string) {
    if (this.state[i] !== PieceState.Attached) return false;
    const b = this.body(i);
    b.setBodyType(RAPIER.RigidBodyType.Dynamic, true);
    b.setLinvel({ x: v[0], y: v[1], z: v[2] }, true);
    b.setAngvel({ x: w[0], y: w[1], z: w[2] }, true);
    this.collider(i).setCollisionGroups(GROUP.FRESH);
    this.state[i] = PieceState.Loose;
    this.detachT[i] = t; this.freshUntil[i] = t + 0.22;
    this.looseVol += this.fr.chunks[i]!.vol;
    this.supportDirty = true;
    this.broke.push({ i, cause });
    return true;
  }

  /** Schedule a break (heat, collapse); the earliest one wins. */
  schedule(at: number, i: number, v: V3, w: V3, cause: string) {
    if (this.state[i] !== PieceState.Attached || this.scheduled[i]) return;
    this.scheduled[i] = 1;
    const e = { at, i, v, w, cause };
    let k = this.pend.length;
    while (k > 0 && this.pend[k - 1]!.at > at) k--;
    this.pend.splice(k, 0, e);
  }

  crack(i: number, t: number, amp: number) {
    if (amp > this.glowAmp[i]! * Math.exp(-(t - this.glowT0[i]!) / 1.2)) { this.glowT0[i] = t; this.glowAmp[i] = Math.min(1, amp); }
  }

  /** Lift a loose piece out of gravity until `until`; gravity then returns over 1.2 s. */
  float(i: number, until: number) {
    if (this.state[i] !== PieceState.Loose) return;
    this.floatUntil[i] = until; this.gscale[i] = 0;
    const b = this.body(i); b.setGravityScale(0, true); b.setLinearDamping(0.9);
  }

  /** Before each physics step: due breaks, fresh pieces joining the debris group, gravity returning. */
  preStep(t: number) {
    while (this.pend.length && this.pend[0]!.at <= t) {
      const e = this.pend.shift()!;
      this.scheduled[e.i] = 0;
      this.breakOff(e.i, t, e.v, e.w, e.cause);
    }
    for (let i = 0; i < this.n; i++) {
      if (this.state[i] !== PieceState.Loose) continue;
      if (this.freshUntil[i]! > 0 && t >= this.freshUntil[i]!) { this.collider(i).setCollisionGroups(GROUP.DEBRIS); this.freshUntil[i] = 0; }
      if (this.gscale[i]! < 1 && t >= this.floatUntil[i]!) {
        const g = Math.min(1, (t - this.floatUntil[i]!) / 1.2);
        this.gscale[i] = g;
        const b = this.body(i); b.setGravityScale(g, true);
        if (g >= 1) b.setLinearDamping(0.02);
      }
    }
  }

  /** After each physics step: poses for interpolation, pieces that have fallen away, support. */
  postStep(t: number) {
    for (let i = 0; i < this.n; i++) {
      if (this.state[i] !== PieceState.Loose) continue;
      const b = this.body(i), p = b.translation(), q = b.rotation();
      // a piece that broke this step starts its interpolation from rest
      if (this.detachT[i] === t) { this.prevP.set(this.rest.subarray(3 * i, 3 * i + 3), 3 * i); this.prevQ.set(this.restQ, 4 * i); }
      else { this.prevP.set(this.curP.subarray(3 * i, 3 * i + 3), 3 * i); this.prevQ.set(this.curQ.subarray(4 * i, 4 * i + 4), 4 * i); }
      this.curP[3 * i] = p.x; this.curP[3 * i + 1] = p.y; this.curP[3 * i + 2] = p.z;
      this.curQ[4 * i] = q.x; this.curQ[4 * i + 1] = q.y; this.curQ[4 * i + 2] = q.z; this.curQ[4 * i + 3] = q.w;
      if (p.y < -230 || t - this.detachT[i]! > 40) { this.state[i] = PieceState.Gone; b.setEnabled(false); }
    }
    if (this.supportDirty && t >= this.supportHold) { this.supportDirty = false; this.checkSupport(t); }
  }

  /** Attached pieces no longer connected to the anchored core (or, with no anchors, to the largest piece group) collapse. */
  checkSupport(t: number) {
    const ch = this.fr.chunks, n = this.n, seen = new Uint8Array(n);
    const attached = (i: number) => this.state[i] === PieceState.Attached && !this.scheduled[i];
    const flood = (starts: number[]) => {
      const comp: number[] = [], q = starts.filter((s) => attached(s) && !seen[s]);
      for (const s of q) seen[s] = 1;
      while (q.length) {
        const i = q.pop()!; comp.push(i);
        const c = ch[i]!;
        for (let k = 0; k < c.nb.length; k++) {
          const j = c.nb[k]!;
          if (!seen[j] && attached(j) && c.area[k]! > 0.6) { seen[j] = 1; q.push(j); }
        }
      }
      return comp;
    };
    // pieces held by the anchored core; once every anchor is gone, the largest remaining group keeps floating
    const held = this.fr.anchors.length ? flood(this.fr.anchors) : [];
    if (!held.length) {
      // no anchors: keep the largest connected group by volume
      let best: number[] = [], bestV = 0;
      const tmp = new Uint8Array(n);
      for (let i = 0; i < n; i++) {
        if (!attached(i) || tmp[i]) continue;
        seen.fill(0);
        const comp = flood([i]);
        let v = 0; for (const j of comp) { tmp[j] = 1; v += ch[j]!.vol; }
        if (v > bestV) { bestV = v; best = comp; }
      }
      seen.fill(0); for (const j of best) seen[j] = 1;
    }
    // everything attached and not reached collapses, the nearest to a broken piece first
    let any = false;
    for (let i = 0; i < n; i++) {
      if (!attached(i) || seen[i]) continue;
      any = true;
      const c = ch[i]!;
      let looseNb = 0;
      for (const j of c.nb) if (this.state[j] !== PieceState.Attached) looseNb++;
      const delay = 0.05 + (looseNb ? 0 : 0.25) + hashi(i, 3, 0, 91) * 0.35 + Math.max(0, 9 - c.depth) * 0.012;
      const s = 0.6 + hashi(i, 5, 0, 91) * 0.8;
      this.schedule(t + delay, i, [(hashi(i, 1, 0, 7) - 0.5) * s, -0.4 * s, (hashi(i, 2, 0, 7) - 0.5) * s],
        [(hashi(i, 4, 1) - 0.5) * 0.5, (hashi(i, 4, 2) - 0.5) * 0.5, (hashi(i, 4, 3) - 0.5) * 0.5], 'collapse');
    }
    return any;
  }
}
