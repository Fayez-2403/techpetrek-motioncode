// The laboratory's simulation, independent of rendering: one fixed step at a time (PHYS_DT), the bow, the arrows,
// the targets, the force fields and the challenge rules. It emits events (release, impact, break, contact, ring)
// that the view, the audio and the reel read. Same inputs at the same steps give the same result, which is what
// makes replays and the reel's seek(t) exact.
import { RAPIER, Physics } from './physics';
import { GRAVITY, MODES, PHYS_DT, type GravityPreset, type MaterialId, type ModeId } from './config';
import { Destructible, PieceState, type Placement, type V3 } from './destructible';
import type { Fracture } from './fracture';
import { BowRig, ARROW_LEN } from './bowrig';
import { Projectile, type Ring, type Hit } from './projectile';
import { impact, applyVortex, type Vortex, type ImpactInfo } from './modes';
import { CHALLENGES, PLACEMENTS, impossibleGeometry, isMarkedCrystal, type ChallengeId, type ChallengeState, type TargetId } from './challenges';

export interface SimSettings {
  mode: ModeId; drawPower: number; gravity: GravityPreset; material: MaterialId; impactMult: number; drag: boolean;
}
export const DEFAULT_SETTINGS: SimSettings = { mode: 'vajra', drawPower: 1, gravity: 'earth', material: 'brittle', impactMult: 1, drag: true };

export type SimEvent =
  | { type: 'grab'; t: number }
  | { type: 'launch'; t: number; id: number; p: V3; v: V3; speed: number; power: number; mode: ModeId }
  | { type: 'impact'; t: number; id: number; target: string; chunk: number; p: V3; n: V3; dir: V3; ke: number; mode: ModeId; info: ImpactInfo }
  | { type: 'break'; t: number; target: string; i: number; p: V3; cause: string }
  | { type: 'contact'; t: number; target: string; i: number; p: V3; force: number }
  | { type: 'ring'; t: number; idx: number; p: V3 }
  | { type: 'clang'; t: number; p: V3 }
  | { type: 'miss'; t: number; id: number }
  | { type: 'challenge'; t: number; state: ChallengeState }
  | { type: 'reset'; t: number; what: 'target' | 'scene' };

export class SimCore {
  phys = new Physics();
  rig = new BowRig();
  arrows: Projectile[] = [];
  nextId = 1;
  targets = new Map<string, Destructible>();
  active: TargetId[] = ['mountain'];
  rings: Ring[] = [];
  vortices: Vortex[] = [];
  step = 0;
  settings: SimSettings = { ...DEFAULT_SETTINGS };
  events: SimEvent[] = [];
  /** Visual time-slow requests (for the live clock; the physics never changes its step). */
  slows: { t: number; depth: number; hold: number; ease: number }[] = [];
  challenge: ChallengeState | null = null;
  lastImpact: (ImpactInfo & { t: number; p: V3; mode: ModeId; target: string }) | null = null;
  /** Power (share of full draw) of the last launched arrow. */
  lastPower = 0;
  private contactBudget = 0;

  get t() { return this.step * PHYS_DT; }

  addTarget(id: TargetId, fr: Fracture, place: Placement = PLACEMENTS[id], mat: MaterialId = 'brittle') {
    const d = new Destructible(id, fr, this.phys, place, mat);
    this.targets.set(id, d);
    this.syncActive();
    return d;
  }

  /** Only active targets take part in the simulation (the others are disabled and hidden). */
  setActive(ids: TargetId[]) { this.active = ids; this.syncActive(); }
  private syncActive() {
    for (const [id, d] of this.targets) {
      const on = this.active.includes(id as TargetId);
      for (let i = 0; i < d.n; i++) d.body(i).setEnabled(on && d.state[i] !== PieceState.Gone);
    }
  }

  apply(s: Partial<SimSettings>) {
    const prev = this.settings;
    this.settings = { ...prev, ...s };
    if (s.gravity && s.gravity !== prev.gravity) this.phys.setGravity(GRAVITY[s.gravity].g);
    if (s.drawPower !== undefined) this.rig.limit = Math.max(0.02, s.drawPower);
    if (s.material && !this.challenge) for (const id of this.active) this.targets.get(id)?.setMaterial(s.material);
  }

  // ------------------------------------------------------------------ input
  grab() { if (this.rig.grab()) this.events.push({ type: 'grab', t: this.t }); }
  pull(d: number) { this.rig.pull(d); }
  aim(yaw: number, pitch: number) { this.rig.setAim(yaw, pitch); }
  release() { const v = this.rig.release(this.t); if (v > 0) this.launch(v); }
  fire() { this.rig.startAuto(this.t); this.events.push({ type: 'grab', t: this.t }); }

  private launch(speed: number) {
    const t = this.t, f = this.rig.aim(), nk = this.rig.nock(t);
    const p: V3 = [nk[0] + f[0] * ARROW_LEN, nk[1] + f[1] * ARROW_LEN, nk[2] + f[2] * ARROW_LEN];
    const v: V3 = [f[0] * speed, f[1] * speed, f[2] * speed];
    const a = new Projectile(this.nextId++, p, v, t, this.settings.mode, this.rig.power);
    this.lastPower = a.power;
    this.arrows.push(a);
    if (this.arrows.length > 6) this.arrows.splice(0, this.arrows.length - 6);
    if (this.challenge) { this.challenge.shots++; this.challenge.rings = []; for (const r of this.rings) r.passed = false; }
    this.events.push({ type: 'launch', t, id: a.id, p, v, speed, power: a.power, mode: a.mode as ModeId });
  }

  // ------------------------------------------------------------------ stepping
  fixedStep() {
    const t = (this.step + 1) * PHYS_DT, dt = PHYS_DT, s = this.settings;
    this.contactBudget = 4;
    const auto = this.rig.step(t, dt);
    this.step++;
    if (auto > 0) this.launch(auto);
    // arrows
    for (const a of this.arrows) {
      if (a.stuck) { this.followStuck(a); continue; }
      if (!a.alive) continue;
      const before = a.rings.length;
      const hit = a.step(t, dt, GRAVITY[s.gravity].g, s.drag, this.phys, this.rings);
      for (let k = before; k < a.rings.length; k++) {
        const r = this.rings[a.rings[k]!]!; r.passed = true;
        this.events.push({ type: 'ring', t, idx: a.rings[k]!, p: r.c });
        if (this.challenge) this.challenge.rings = [...a.rings];
      }
      if (a.clanged && !hit) { this.events.push({ type: 'clang', t, p: [...a.p] }); a.clanged = false; a.alive = false; this.judgeMiss(); }
      if (hit) this.resolveHit(a, hit);
      else if (!a.alive) { this.events.push({ type: 'miss', t, id: a.id }); this.judgeMiss(); }
    }
    // fields and scheduled breaks, then the physics step
    for (const id of this.active) {
      const d = this.targets.get(id);
      if (!d) continue;
      d.preStep(t);
      for (const v of this.vortices) applyVortex(d, v, t, dt);
    }
    this.vortices = this.vortices.filter((v) => t - v.t0 < v.dur);
    this.phys.step();
    this.phys.events.drainContactForceEvents((e) => {
      if (this.contactBudget <= 0) return;
      const o = this.phys.owners.get(e.collider1()) ?? this.phys.owners.get(e.collider2());
      if (!o) return;
      const d = this.targets.get(o.target)!;
      if (d.state[o.chunk] !== PieceState.Loose) return;
      this.contactBudget--;
      this.events.push({ type: 'contact', t, target: o.target, i: o.chunk, p: d.centre(o.chunk), force: e.totalForceMagnitude() / Math.max(1, d.mass[o.chunk]!) });
    });
    for (const id of this.active) {
      const d = this.targets.get(id);
      if (!d) continue;
      d.postStep(t);
      for (const b of d.broke) this.events.push({ type: 'break', t, target: id, i: b.i, p: d.centre(b.i), cause: b.cause });
      d.broke = [];
    }
    this.judgeProgress();
  }

  private resolveHit(a: Projectile, h: Hit) {
    const t = this.t, o = this.phys.owners.get(h.collider);
    a.alive = false;
    if (!o) { this.events.push({ type: 'miss', t, id: a.id }); return; }
    const d = this.targets.get(o.target)!;
    // lodge the arrow 35 cm deep in the piece it struck (it then moves with that piece)
    const tip: V3 = [h.p[0] + h.dir[0] * 0.35, h.p[1] + h.dir[1] * 0.35, h.p[2] + h.dir[2] * 0.35];
    a.stuck = { target: o.target, chunk: o.chunk, local: this.toLocal(d, o.chunk, tip), dir: this.toLocalDir(d, o.chunk, h.dir), t };
    a.p = tip;
    const info = impact(d, a.mode as ModeId, o.chunk, h.p, h.n, h.dir, h.ke, {
      t, mult: this.settings.impactMult,
      slow: (depth, hold, ease) => this.slows.push({ t, depth, hold, ease }),
      addVortex: (v) => this.vortices.push(v),
    });
    this.lastImpact = { ...info, t, p: h.p, mode: a.mode as ModeId, target: o.target };
    this.events.push({ type: 'impact', t, id: a.id, target: o.target, chunk: o.chunk, p: h.p, n: h.n, dir: h.dir, ke: h.ke, mode: a.mode as ModeId, info });
    this.judgeHit(a, d, o.chunk);
  }

  /** World -> a piece's body frame (for a lodged arrow). */
  private toLocal(d: Destructible, i: number, p: V3): V3 {
    const c = d.centre(i), q = d.state[i] === PieceState.Attached ? d.restQ : (Array.from(d.curQ.subarray(4 * i, 4 * i + 4)) as [number, number, number, number]);
    return qrot([-q[0], -q[1], -q[2], q[3]], [p[0] - c[0], p[1] - c[1], p[2] - c[2]]);
  }
  private toLocalDir(d: Destructible, i: number, v: V3): V3 {
    const q = d.state[i] === PieceState.Attached ? d.restQ : (Array.from(d.curQ.subarray(4 * i, 4 * i + 4)) as [number, number, number, number]);
    return qrot([-q[0], -q[1], -q[2], q[3]], v);
  }
  private followStuck(a: Projectile) {
    const st = a.stuck!, d = this.targets.get(st.target)!;
    const i = st.chunk;
    if (d.state[i] === PieceState.Attached) return;
    const q = Array.from(d.curQ.subarray(4 * i, 4 * i + 4)) as [number, number, number, number];
    const c = d.centre(i), w = qrot(q, st.local);
    a.p = [c[0] + w[0], c[1] + w[1], c[2] + w[2]];
  }

  // ------------------------------------------------------------------ reset
  resetTarget() {
    for (const id of this.active) this.targets.get(id)?.reset();
    this.syncActive();
    this.arrows = []; this.vortices = []; this.lastImpact = null;
    for (const r of this.rings) r.passed = false;
    this.events.push({ type: 'reset', t: this.t, what: 'target' });
  }
  resetScene() {
    for (const d of this.targets.values()) d.reset();
    this.syncActive();
    this.arrows = []; this.vortices = []; this.slows = []; this.lastImpact = null;
    this.rig = Object.assign(new BowRig(), { limit: this.rig.limit });
    if (this.challenge) this.startChallenge(this.challenge.id);
    this.events.push({ type: 'reset', t: this.t, what: 'scene' });
  }

  // ------------------------------------------------------------------ challenges
  startChallenge(id: ChallengeId | null) {
    for (const d of this.targets.values()) d.reset();
    this.arrows = []; this.vortices = []; this.rings = []; this.lastImpact = null;
    if (!id) { this.challenge = null; this.setActive(['mountain']); this.targets.get('mountain')?.setMaterial(this.settings.material); return; }
    const spec = CHALLENGES[id];
    if (id === 'impossible') this.rings = impossibleGeometry().rings.map((r) => ({ ...r, passed: false }));
    this.challenge = { id, shots: 0, status: 'active', progress: 0, note: spec.goal, rings: [] };
    this.setActive([spec.target]);
    if (spec.material) this.targets.get(spec.target)?.setMaterial(spec.material);
    this.events.push({ type: 'challenge', t: this.t, state: { ...this.challenge } });
  }

  private emitChallenge() { if (this.challenge) this.events.push({ type: 'challenge', t: this.t, state: { ...this.challenge, rings: [...this.challenge.rings] } }); }

  private judgeHit(a: Projectile, d: Destructible, chunk: number) {
    const c = this.challenge;
    if (!c || c.status !== 'active') return;
    if (c.id === 'impossible') {
      const ok = a.rings.length === 3 && a.rings.every((r, k) => r === k);
      const local = d.fr.chunks[chunk]!.c;
      if (ok && isMarkedCrystal(local)) { c.status = 'won'; c.progress = 1; c.note = 'PERFECT SHOT: three rings, one arrow, target hit.'; }
      else c.note = `${a.rings.length}/3 rings${isMarkedCrystal(local) ? '' : ', missed the marked crystal'}. Try again.`;
      this.emitChallenge();
    } else if (c.id === 'first') {
      c.note = a.power > 0.455 ? `Too strong: ${Math.round(a.power * 100)}% draw. Break it with 45% or less.` : 'Good power. Did it break?';
      this.emitChallenge();
    }
  }
  private judgeMiss() {
    const c = this.challenge;
    if (!c || c.status !== 'active') return;
    if (c.id === 'impossible') c.note = `${c.rings.length}/3 rings, no target hit. Try again.`;
    else if (c.id === 'first') c.note = 'Missed: gravity pulls a slow arrow down. Aim higher.';
    if (c.id === 'breaker' && c.shots >= CHALLENGES.breaker.maxShots) { c.status = 'lost'; c.note = 'Out of arrows. Reset the challenge and try a new plan.'; }
    this.emitChallenge();
  }
  private judgeProgress() {
    const c = this.challenge;
    if (!c || c.status !== 'active' || this.step % 12) return;
    const d = this.targets.get(CHALLENGES[c.id].target);
    if (!d) return;
    const frac = d.looseFraction;
    if (c.id === 'first') {
      c.progress = Math.min(1, frac / 0.3);
      if (frac >= 0.3 && this.lastPower <= 0.455 && this.lastPower > 0) { c.status = 'won'; c.note = `Slab broken with ${Math.round(this.lastPower * 100)}% draw.`; this.emitChallenge(); }
    } else if (c.id === 'breaker') {
      const p = Math.min(1, frac / 0.4);
      if (Math.abs(p - c.progress) > 0.01) { c.progress = p; c.note = `${Math.round(frac * 100)}% detached (goal 40%), arrow ${c.shots}/3.`; this.emitChallenge(); }
      if (frac >= 0.4) { c.status = 'won'; c.note = `${Math.round(frac * 100)}% of the mountain detached in ${c.shots} arrow${c.shots === 1 ? '' : 's'}.`; this.emitChallenge(); }
      else if (c.shots >= 3 && this.arrows.every((a) => !a.alive) && !d.pend.length && this.t - (this.lastImpact?.t ?? 0) > 4) {
        c.status = 'lost'; c.note = `${Math.round(frac * 100)}% detached. Out of arrows: reset and try again.`; this.emitChallenge();
      }
    }
  }

  // ------------------------------------------------------------------ snapshots (slow-motion replay)
  snapshot() {
    const ts: Record<string, unknown> = {};
    for (const [id, d] of this.targets) ts[id] = {
      state: d.state.slice(), damage: d.damage.slice(), glowT0: d.glowT0.slice(), glowAmp: d.glowAmp.slice(), heatT0: d.heatT0.slice(), heatDur: d.heatDur.slice(),
      heatPeak: d.heatPeak.slice(), coolT0: d.coolT0.slice(), detachT: d.detachT.slice(), freshUntil: d.freshUntil.slice(), floatUntil: d.floatUntil.slice(), gscale: d.gscale.slice(),
      prevP: d.prevP.slice(), curP: d.curP.slice(), prevQ: d.prevQ.slice(), curQ: d.curQ.slice(), scheduled: d.scheduled.slice(), pend: structuredClone(d.pend),
      looseVol: d.looseVol, supportDirty: d.supportDirty, supportHold: d.supportHold, matId: d.matId,
    };
    return {
      world: this.phys.world.takeSnapshot(), step: this.step, settings: { ...this.settings }, targets: ts,
      rig: { ...this.rig, auto: this.rig.auto ? { ...this.rig.auto } : null },
      arrows: this.arrows.map((a) => structuredClone({ ...a })), nextId: this.nextId, vortices: structuredClone(this.vortices),
      rings: structuredClone(this.rings), challenge: this.challenge ? structuredClone(this.challenge) : null, active: [...this.active], lastPower: this.lastPower,
    };
  }
  restore(s: ReturnType<SimCore['snapshot']>) {
    this.phys.world.free();
    this.phys.world = RAPIER.World.restoreSnapshot(s.world);
    this.step = s.step; this.settings = { ...s.settings };
    for (const [id, d] of this.targets) {
      const o = s.targets[id] as Record<string, any>;
      for (const k of ['state', 'damage', 'glowT0', 'glowAmp', 'heatT0', 'heatDur', 'heatPeak', 'coolT0', 'detachT', 'freshUntil', 'floatUntil', 'gscale', 'prevP', 'curP', 'prevQ', 'curQ', 'scheduled'] as const)
        (d[k] as Float32Array).set(o[k]);
      d.pend = structuredClone(o.pend); d.looseVol = o.looseVol; d.supportDirty = o.supportDirty; d.supportHold = o.supportHold;
      d.setMaterial(o.matId);
    }
    this.rig = Object.assign(new BowRig(), s.rig);
    this.arrows = s.arrows.map((a) => Object.assign(Object.create(Projectile.prototype), structuredClone(a)));
    this.nextId = s.nextId; this.vortices = structuredClone(s.vortices); this.rings = structuredClone(s.rings);
    this.challenge = s.challenge ? structuredClone(s.challenge) : null; this.active = [...s.active] as TargetId[]; this.lastPower = s.lastPower;
    this.events = []; this.slows = [];
  }

  dispose() { this.phys.dispose(); }
}

export function qrot(q: [number, number, number, number], v: V3): V3 {
  const [qx, qy, qz, qw] = q, [x, y, z] = v;
  const tx = 2 * (qy * z - qz * y), ty = 2 * (qz * x - qx * z), tz = 2 * (qx * y - qy * x);
  return [x + qw * tx + (qy * tz - qz * ty), y + qw * ty + (qz * tx - qx * tz), z + qw * tz + (qx * ty - qy * tx)];
}

export { MODES };
