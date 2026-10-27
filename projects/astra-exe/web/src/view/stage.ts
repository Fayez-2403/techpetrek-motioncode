// The Stage: everything on screen, driven by the simulation core. Live play advances the sim with a clock
// (time scale x impact slow-motion, fixed steps, interpolation); the reel steps it to exact steps instead.
// Simulation events become effects, camera shake, cuts and sounds here.
import * as THREE from 'three';
import { SimCore, type SimEvent, type SimSettings } from '../core/simcore';
import { MODES, PHYS_DT, QUALITY, GRAVITY, type QualityId, type CameraMode, type ModeId, launchSpeed, BOW } from '../core/config';
import { PieceState } from '../core/destructible';
import { ballistic } from '../core/projectile';
import { ARROW_LEN, BowRig } from '../core/bowrig';
import { CHALLENGES, PLACEMENTS, isMarkedCrystal, impossibleGeometry, type ChallengeId, type TargetId } from '../core/challenges';
import { hashi, mulberry32 } from '../core/noise';
import type { Fracture } from '../core/fracture';
import { Arena } from './arena';
import { BowView } from './bowView';
import { FlightView } from './arrowView';
import { TargetView, type ImpactGlow } from './targetView';
import { Particles, Swirl, Rubble, Bursts, Bolts, Flashes } from './fx';
import { CameraRig, impactPose } from './camera';
import { Pipeline } from './pipeline';

type V3 = [number, number, number];

export interface LiveSettings extends SimSettings { timeScale: number; paused: boolean; slowmo: boolean; camera: CameraMode; quality: QualityId; trajectory: boolean; autoCut: boolean }

export interface Telemetry {
  fps: number; loose: number; fixed: number; rubble: number; draw: number; speed: number; ke: number; fantasy: number; timeScale: number;
  stepMs: number; quality: QualityId; detached: number; lastImpact: string; challenge: string;
}

interface InputRec { step: number; kind: 'grab' | 'pull' | 'aim' | 'release' | 'fire'; a?: number; b?: number }

export class Stage {
  scene = new THREE.Scene();
  sim = new SimCore();
  camRig: CameraRig;
  pipe: Pipeline;
  arena: Arena;
  bow = new BowView();
  flights: FlightView[] = [];
  views = new Map<string, TargetView>();
  sparks: Particles; embers: Particles; dust: Particles; swirl: Swirl; rubble: Rubble;
  bursts = new Bursts(); bolts = new Bolts(); flashes: Flashes;
  impacts: ImpactGlow[] = [];
  traj: THREE.Points; trajPos: Float32Array;
  ringMeshes: THREE.Mesh[] = []; marker = new THREE.Group();
  listeners: ((e: SimEvent) => void)[] = [];
  clock = 0; alpha = 1; simAcc = 0;
  slowWins: { start: number; depth: number; hold: number; ease: number }[] = [];
  live: LiveSettings;
  portrait = false;
  telemetry: Telemetry = { fps: 0, loose: 0, fixed: 0, rubble: 0, draw: 0, speed: 0, ke: 0, fantasy: 0, timeScale: 1, stepMs: 0, quality: 'medium', detached: 0, lastImpact: '', challenge: '' };
  lastLaunchT = -1e9;
  /** Replay: the snapshot at the last grab and the inputs since. */
  private shot: { snap: ReturnType<SimCore['snapshot']>; log: InputRec[] } | null = null;
  replay: { log: InputRec[]; k: number; c: V3; start: number; end: number } | null = null;
  private fractures = new Map<string, Fracture>();
  private rubbleMat: THREE.MeshStandardMaterial;
  private stepMsAvg = 0;
  /** Reel mode: the camera and time come from the director. */
  reel = false;

  constructor(public renderer: THREE.WebGLRenderer, w: number, h: number, quality: QualityId, opts: { reel?: boolean } = {}) {
    this.reel = !!opts.reel;
    this.portrait = h > w;
    const Q = QUALITY[quality];
    this.arena = new Arena(Q);
    this.live ={ mode: 'vajra', drawPower: 1, gravity: 'earth', material: 'brittle', impactMult: 1, drag: true, timeScale: 1, paused: false, slowmo: true, camera: 'cinematic', quality, trajectory: true, autoCut: true };
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.setClearColor(0x000000, 1);
    this.camRig = new CameraRig(w / h);
    this.scene.add(this.arena.group, this.bow.group, this.bursts.group, this.bolts.group);
    this.scene.environment = this.arena.buildEnv(renderer); this.scene.environmentIntensity = 0.7;
    this.scene.fog = new THREE.FogExp2(0x0b1030, 0.0024);
    this.sparks = new Particles(Q.sparks); this.embers = new Particles(Math.round(Q.sparks / 2)); this.dust = new Particles(Math.round(Q.sparks / 6), true);
    this.swirl = new Swirl(4000);
    this.rubbleMat = new THREE.MeshStandardMaterial({ color: 0x8a7a68, roughness: 0.9, flatShading: true });
    this.rubble = new Rubble(Q.debris, this.rubbleMat);
    this.scene.add(this.sparks.points, this.embers.points, this.dust.points, this.swirl.points, this.rubble.mesh);
    this.flashes = new Flashes(this.scene);
    for (let i = 0; i < 6; i++) { const f = new FlightView(); this.flights.push(f); this.scene.add(f.group); }
    // aim preview: dots along the predicted path
    this.trajPos = new Float32Array(160 * 3);
    const tg = new THREE.BufferGeometry(); tg.setAttribute('position', new THREE.BufferAttribute(this.trajPos, 3).setUsage(THREE.DynamicDrawUsage));
    this.traj = new THREE.Points(tg, new THREE.ShaderMaterial({
      uniforms: { uScale: { value: 600 }, uA: { value: 0.8 } },
      vertexShader: `uniform float uScale; varying float vK; void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv; gl_PointSize = clamp(0.12 * uScale / max(0.1, -mv.z), 2.0, 9.0); vK = 1.0; }`,
      fragmentShader: `uniform float uA; void main(){ float d = length(gl_PointCoord - 0.5) * 2.0; if (d > 1.0) discard; float a = (1.0 - d * d) * uA; gl_FragColor = vec4(vec3(2.2, 1.7, 0.8) * a, a); }`,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    }));
    this.traj.frustumCulled = false; this.scene.add(this.traj);
    this.scene.add(this.marker);
    this.pipe = new Pipeline(renderer, this.scene, this.camRig.cam, w, h, Q.msaa, Q.bloomDiv);
    this.camRig.snap({ pos: new THREE.Vector3(1.35, 3.95, 3.3), look: new THREE.Vector3(0, 4.6, -20), fov: this.portrait ? 62 : 48 });
  }

  // ------------------------------------------------------------------ targets
  addTarget(id: TargetId, fr: Fracture) {
    this.fractures.set(id, fr);
    const d = this.sim.addTarget(id, fr, PLACEMENTS[id], this.live.material);
    if (!this.sim.arrows.length) this.sim.phys.prime();
    const v = new TargetView(d, QUALITY[this.live.quality].rockOct);
    if (id === 'crystal') fr.chunks.forEach((c, i) => { if (isMarkedCrystal(c.c)) v.marked[i] = 1; });
    this.views.set(id, v); this.scene.add(v.mesh);
    this.syncVisible();
    return d;
  }
  hasTarget(id: TargetId) { return this.views.has(id); }

  /**
   * A brand-new physics world with the same targets, all intact (the reel starts every shot this way, so a shot's
   * physics never depends on what ran before it: seek order cannot change a frame).
   */
  freshSim() {
    this.sim.dispose();
    this.sim = new SimCore();
    for (const [id, fr] of this.fractures) {
      const d = this.sim.addTarget(id as TargetId, fr, PLACEMENTS[id as TargetId], this.live.material);
      this.views.get(id)!.d = d;
    }
    this.sim.apply({ ...this.live });
    this.sim.phys.prime();
    this.clearFx(); this.slowWins = []; this.lastLaunchT = -1e9; this.simAcc = 0; this.alpha = 1; this.shot = null; this.replay = null;
    this.syncVisible();
    return this.sim;
  }
  /** Show the active targets, the rings and the marker (after a challenge starts in a fresh sim). */
  syncChallengeView() { this.syncVisible(); }
  private syncVisible() {
    for (const [id, v] of this.views) v.setVisible(this.sim.active.includes(id as TargetId));
    const rings = this.sim.rings;
    while (this.ringMeshes.length < rings.length) {
      const m = new THREE.Mesh(new THREE.TorusGeometry(2.4, 0.16, 16, 96), new THREE.MeshPhysicalMaterial({ color: 0x9fd8ff, emissive: new THREE.Color(0.4, 0.9, 1.6), emissiveIntensity: 1, metalness: 0.3, roughness: 0.1, transmission: 0, clearcoat: 1 }));
      this.ringMeshes.push(m); this.scene.add(m);
    }
    this.ringMeshes.forEach((m, i) => {
      const r = rings[i]; m.visible = !!r;
      if (r) { m.position.set(...r.c); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(...r.n)); }
    });
    // the marker over the impossible shot's crystal
    this.marker.clear();
    if (this.sim.active.includes('crystal')) {
      const p = PLACEMENTS.crystal.p;
      const ring = new THREE.Mesh(new THREE.TorusGeometry(3.4, 0.07, 8, 96), new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 2.2, 0.8), toneMapped: false }));
      ring.position.set(p[0], p[1] + 5.5, p[2] + 2.6);
      const cone = new THREE.Mesh(new THREE.ConeGeometry(0.7, 1.6, 4), new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 2.2, 0.8), toneMapped: false }));
      cone.rotation.x = Math.PI; cone.position.set(p[0], p[1] + 17.5, p[2]);
      this.marker.add(ring, cone);
    }
  }

  async startChallenge(id: ChallengeId | null, load: (k: TargetId) => Promise<Fracture>) {
    if (id) {
      const t = CHALLENGES[id].target;
      if (!this.hasTarget(t)) this.addTarget(t, await load(t));
      if (id === 'impossible') impossibleGeometry();
    }
    this.sim.startChallenge(id);
    if (!id) this.sim.apply({ material: this.live.material });
    this.clearFx(); this.shot = null; this.replay = null;
    this.syncVisible();
  }

  // ------------------------------------------------------------------ input (logged for the replay)
  private rec(kind: InputRec['kind'], a?: number, b?: number) { if (this.shot && !this.replay) this.shot.log.push({ step: this.sim.step, kind, a, b }); }
  grab() {
    if (this.replay) return;
    if (!this.reel) this.shot = { snap: this.sim.snapshot(), log: [] };   // (the reel replays from its own shot start instead)
    this.sim.grab(); this.rec('grab');
  }
  pull(d: number) { if (this.replay) return; this.sim.pull(d); this.rec('pull', d); }
  aim(yaw: number, pitch: number) { if (this.replay) return; this.sim.aim(yaw, pitch); this.rec('aim', yaw, pitch); }
  release() { if (this.replay) return; this.sim.release(); this.rec('release'); }
  fire() {
    if (this.replay || this.sim.rig.held) return;
    if (!this.reel) this.shot = { snap: this.sim.snapshot(), log: [] };
    this.sim.fire(); this.rec('fire');
  }

  /** Slow-motion replay of the last shot: restore its snapshot and run its inputs again (deterministic). */
  startReplay() {
    if (!this.shot || this.replay) return false;
    // the last impact only belongs to this shot if it came after the shot's snapshot (a missed shot has none)
    const last = this.sim.lastImpact, imp = last && last.t >= this.shot.snap.step * PHYS_DT ? last : null;
    this.sim.restore(this.shot.snap);
    this.clearFx();
    const c: V3 = imp ? [...imp.p] : [0, 12, -110];
    this.replay = { log: [...this.shot.log], k: 0, c, start: this.clock, end: this.sim.t + (imp ? imp.t - this.shot.snap.step * PHYS_DT : 3) + 4 };
    return true;
  }
  private applyReplayInputs() {
    const r = this.replay!;
    while (r.k < r.log.length && r.log[r.k]!.step <= this.sim.step) {
      const e = r.log[r.k++]!;
      if (e.kind === 'grab') this.sim.grab(); else if (e.kind === 'pull') this.sim.pull(e.a!); else if (e.kind === 'aim') this.sim.aim(e.a!, e.b!);
      else if (e.kind === 'release') this.sim.release(); else this.sim.fire();
    }
  }

  // ------------------------------------------------------------------ settings
  applyLive(s: Partial<LiveSettings>) {
    const prev = this.live;
    this.live = { ...prev, ...s };
    const simKeys: (keyof SimSettings)[] = ['mode', 'drawPower', 'gravity', 'material', 'impactMult', 'drag'];
    const patch: Partial<SimSettings> = {};
    for (const k of simKeys) if (s[k] !== undefined && s[k] !== this.sim.settings[k]) (patch as Record<string, unknown>)[k] = s[k];
    if (Object.keys(patch).length) this.sim.apply(patch);
    this.camRig.mode = this.live.camera; this.camRig.autoCut = this.live.autoCut;
    for (const v of this.views.values()) v.setModeColor(new THREE.Color(...MODES[this.live.mode].core));
  }

  // ------------------------------------------------------------------ time
  private slowFactor() {
    let f = 1;
    for (const w of this.slowWins) {
      const a = this.clock - w.start;
      const k = a < 0.04 ? 1 - (1 - w.depth) * (a / 0.04) : a < w.hold ? w.depth : a < w.hold + w.ease ? w.depth + (1 - w.depth) * smooth((a - w.hold) / w.ease) : 1;
      f = Math.min(f, k);
    }
    this.slowWins = this.slowWins.filter((w) => this.clock - w.start < w.hold + w.ease);
    return f;
  }

  /** Live: advance the clock by dt real seconds. */
  advance(dt: number) {
    dt = Math.min(dt, 0.1);
    this.clock += dt;
    const replaying = !!this.replay;
    const scale = this.live.paused ? 0 : replaying ? 0.3 : this.live.timeScale * this.slowFactor();
    this.telemetry.timeScale = scale;
    this.simAcc += dt * scale;
    let n = 0;
    const t0 = performance.now();
    while (this.simAcc >= PHYS_DT && n < 8) {
      if (this.replay) this.applyReplayInputs();
      this.sim.fixedStep(); this.simAcc -= PHYS_DT; n++;
      this.consume();
    }
    if (n === 8) this.simAcc = Math.min(this.simAcc, PHYS_DT);
    if (n) { const ms = (performance.now() - t0) / n; this.stepMsAvg += (ms - this.stepMsAvg) * 0.1; }
    this.alpha = this.simAcc / PHYS_DT;
    if (this.replay && this.sim.t > this.replay.end) this.replay = null;
  }

  /** Reel: run the sim forward to `step` (the caller resets it for a backward seek) and set the interpolation. */
  stepTo(step: number, alpha: number) {
    while (this.sim.step < step) { this.sim.fixedStep(); this.consume(); }
    this.alpha = alpha;
  }

  /** Render time of the simulation's interpolated state. */
  get tSim() { return (this.sim.step - 1 + this.alpha) * PHYS_DT; }

  // ------------------------------------------------------------------ events -> effects
  consume() {
    const evs = this.sim.events; this.sim.events = [];
    for (const s of this.sim.slows) {
      const cosmic = s.depth < 0.15;
      if (this.live.slowmo || cosmic) this.slowWins.push({ start: this.clock, depth: s.depth, hold: s.hold, ease: s.ease });
    }
    this.sim.slows = [];
    for (const e of evs) { this.onEvent(e); for (const l of this.listeners) l(e); }
  }

  private onEvent(e: SimEvent) {
    const g = GRAVITY[this.sim.settings.gravity].g, Qf = QUALITY[this.live.quality].sparks / 14000;
    if (e.type === 'launch') {
      this.lastLaunchT = e.t;
      const M = MODES[e.mode], col = new THREE.Color(...M.trail), nk = this.sim.rig.nock(e.t);
      const r = mulberry32(e.id * 17);
      for (let i = 0; i < 70 * Qf; i++) {
        const a = r() * Math.PI * 2, s = 2 + r() * 9;
        this.sparks.spawn(nk, [Math.cos(a) * s * 0.6 + e.v[0] * 0.05, Math.sin(a) * s * 0.6 + 1, e.v[2] * 0.05 + (r() - 0.5) * s], e.t, 0.3 + r() * 0.5, 0.05 + r() * 0.06, [col.r * 3, col.g * 3, col.b * 3], 2.5, 0.2);
      }
      this.flashes.add({ t0: e.t, p: nk, col: col.clone(), peak: 6, tau: 0.1 });
      this.camRig.shakes.push({ t0: e.t, amp: 0.02, p: nk });
    } else if (e.type === 'impact') {
      const M = MODES[e.mode], core = new THREE.Color(...M.core), trail = new THREE.Color(...M.trail);
      const r = mulberry32(e.id * 31 + 7), R = e.info.fx.radius, E = e.info.E;
      const N = new THREE.Vector3(...e.n), D = new THREE.Vector3(...e.dir);
      const refl = D.clone().reflect(N);
      this.impacts.push({ p: e.p, t0: e.t, col: core.clone().multiplyScalar(0.25), r: R });
      if (this.impacts.length > 8) this.impacts.shift();
      this.flashes.add({ t0: e.t, p: [e.p[0] + e.n[0] * 6, e.p[1] + e.n[1] * 6, e.p[2] + e.n[2] * 6], col: trail.clone(), peak: 160, tau: 0.25 });
      this.bursts.add({ t0: e.t, dur: 0.95, p: [e.p[0] + e.n[0] * 0.5, e.p[1] + e.n[1] * 0.5, e.p[2] + e.n[2] * 0.5], n: e.n, r0: 0.5, r1: R * 1.9 + 6, col: core.clone().multiplyScalar(0.3), kind: 'ring', seed: e.id });
      this.bursts.add({ t0: e.t, dur: 0.45, p: e.p, n: e.n, r0: 0.4, r1: Math.min(24, R * 0.9 + 3), col: trail.clone().multiplyScalar(0.12), kind: 'sphere', seed: e.id });
      const kSp = Math.min(1.6, 0.5 + E / 2e9) * Qf;
      for (let i = 0; i < 650 * kSp; i++) {
        const u = new THREE.Vector3(r() - 0.5, r() - 0.5, r() - 0.5).normalize();
        const dir = u.multiplyScalar(0.7).add(N.clone().multiplyScalar(0.9)).add(refl.clone().multiplyScalar(0.4)).normalize();
        const s = 8 + r() * r() * 70, c = r() < 0.5 ? core : trail;
        this.sparks.spawn(e.p, [dir.x * s, dir.y * s, dir.z * s], e.t, 0.5 + r() * 1.8, 0.12 + r() * 0.3, [c.r * 0.9, c.g * 0.9, c.b * 0.9], 0.9, 0.6);
      }
      for (let i = 0; i < 110 * kSp; i++) {
        const u = new THREE.Vector3(r() - 0.5, (r() - 0.3) * 0.8, r() - 0.5).normalize().add(N.clone().multiplyScalar(0.6)).normalize(), s = 3 + r() * 14;
        const lit = 0.09 + r() * 0.1;
        this.dust.spawn([e.p[0] + u.x * 2, e.p[1] + u.y * 2, e.p[2] + u.z * 2], [u.x * s, u.y * s, u.z * s], e.t + r() * 0.15, 2.5 + r() * 3.5, 6 + r() * 8, [lit * 1.25, lit, lit * 0.85], 1.1, 0.04);
      }
      for (let i = 0; i < 260 * kSp; i++) {
        const u = new THREE.Vector3(r() - 0.5, r() - 0.5, r() - 0.5).normalize().add(N.clone().multiplyScalar(0.8)).normalize(), s = 6 + r() * 38;
        this.rubble.spawn([e.p[0] + u.x, e.p[1] + u.y, e.p[2] + u.z], [u.x * s, u.y * s, u.z * s], e.t, 3 + r() * 4, 0.18 + r() * r() * 1.3, e.id * 1000 + i);
      }
      if (e.mode === 'vajra') {
        const t1 = new THREE.Vector3().crossVectors(N, new THREE.Vector3(0, 1, 0)).normalize(), t2 = new THREE.Vector3().crossVectors(N, t1);
        for (let k = 0; k < 7; k++) {
          const a = (k / 7) * Math.PI * 2 + r(), d = t1.clone().multiplyScalar(Math.cos(a)).add(t2.clone().multiplyScalar(Math.sin(a))).add(N.clone().multiplyScalar(0.25)).normalize();
          this.bolts.add({ t0: e.t + k * 0.03, dur: 0.45 + r() * 0.3, p: e.p, dir: [d.x, d.y, d.z], len: R * (0.8 + r() * 0.9) + 4, seed: e.id * 10 + k, col: core.clone().multiplyScalar(0.4), width: 0.35 });
        }
      } else if (e.mode === 'vayu') {
        const c = e.info.fx.centre;
        for (let i = 0; i < 1400 * Qf; i++) this.swirl.spawn(c, 3 + r() * 22, (r() - 0.6) * 10, e.t + r() * 1.2, 2.4 + r() * 2.4, (2.5 + r() * 3) * (r() < 0.9 ? 1 : -1), 2 + r() * 6, r() * Math.PI * 2, 0.35 + r() * 0.8, r());
        for (let k = 0; k < 3; k++) this.bursts.add({ t0: e.t + k * 0.35, dur: 1.4, p: [c[0], c[1] - 4 + k * 4, c[2]], n: [0, 1, 0], r0: 2, r1: 26 + k * 6, col: core.clone().multiplyScalar(0.25), kind: 'ring', seed: k });
      } else if (e.mode === 'cosmic') {
        this.bursts.add({ t0: e.t, dur: 3.2, p: e.p, n: e.n, r0: 4, r1: R * 1.6 + 8, col: core, kind: 'shard', seed: e.id });
        this.bursts.add({ t0: e.t + 0.05, dur: 2.4, p: e.p, n: e.n, r0: 1, r1: Math.min(30, R * 1.2 + 8), col: new THREE.Color(0.5, 0.4, 1.1), kind: 'sphere', seed: e.id });
      } else if (e.mode === 'agni') {
        for (let i = 0; i < 500 * Qf; i++) {
          const u = new THREE.Vector3(r() - 0.5, r() - 0.5, r() - 0.5).normalize(), rr = r() * R;
          const p: V3 = [e.p[0] + u.x * rr, e.p[1] + u.y * rr * 0.6, e.p[2] + u.z * rr];
          this.embers.spawn(p, [(r() - 0.5) * 3, 2 + r() * 7, (r() - 0.5) * 3], e.t + r() * 2.2, 1.2 + r() * 2.2, 0.1 + r() * 0.18, [4 * (0.8 + r() * 0.2), 1.4 * (0.5 + r() * 0.5), 0.3], 0.4, -0.25);
        }
      }
      this.camRig.shakes.push({ t0: e.t, amp: Math.min(2.8, 0.5 + E / 1.2e9), p: e.p });
      if (this.camRig.shakes.length > 10) this.camRig.shakes.shift();
      if (!this.reel && !this.replay) this.camRig.cutTo(impactPose(e.p, e.n, R, this.portrait), this.clock + 2.9);
    } else if (e.type === 'break') {
      const d = this.sim.targets.get(e.target)!, ch = d.fr.chunks[e.i]!, r = mulberry32(e.i * 7 + Math.round(e.t * 120));
      const mat = d.mat, n = Math.min(6, Math.round(1 + ch.vol / 120 * mat.shatter));
      for (let k = 0; k < n; k++) {
        const s = 2 + r() * 8;
        this.rubble.spawn([e.p[0] + (r() - 0.5) * ch.rad, e.p[1] + (r() - 0.5) * ch.rad, e.p[2] + (r() - 0.5) * ch.rad], [(r() - 0.5) * s, (r() - 0.2) * s, (r() - 0.5) * s], e.t, 2.5 + r() * 3, 0.15 + r() * 0.6 * mat.shatter * 0.5, e.i * 13 + k);
      }
      const lit = mat.glassy ? [0.3, 0.45, 0.6] : [0.14, 0.12, 0.1];
      this.dust.spawn(e.p, [(r() - 0.5) * 3, r() * 2, (r() - 0.5) * 3], e.t, 2 + r() * 2.5, 4 + ch.rad * 0.9, lit as V3, 1.3, 0.03);
      if (mat.glassy) for (let k = 0; k < 14 * Qf; k++) { const s = 3 + r() * 12; this.sparks.spawn(e.p, [(r() - 0.5) * s, (r() - 0.3) * s, (r() - 0.5) * s], e.t, 0.4 + r() * 0.8, 0.12, [1.2, 2.2, 3.2], 1, 0.5); }
      if (e.cause === 'agni') for (let k = 0; k < 10 * Qf; k++) this.embers.spawn(e.p, [(r() - 0.5) * 4, 2 + r() * 5, (r() - 0.5) * 4], e.t, 1 + r() * 2, 0.14, [4, 1.3, 0.25], 0.5, -0.2);
    } else if (e.type === 'contact') {
      const r = mulberry32(e.i * 101 + Math.round(e.t * 1000));
      if (r() < 0.5) this.dust.spawn(e.p, [(r() - 0.5) * 2, r() * 1.5, (r() - 0.5) * 2], e.t, 1.8 + r() * 1.5, 3 + r() * 4, [0.3, 0.27, 0.24], 1.4, 0.02);
    } else if (e.type === 'ring') {
      this.bursts.add({ t0: e.t, dur: 0.7, p: e.p, n: this.sim.rings[e.idx]!.n, r0: 2.4, r1: 7, col: new THREE.Color(1.2, 2.4, 3.2), kind: 'ring', seed: e.idx });
      const r = mulberry32(e.idx + 5);
      for (let i = 0; i < 90 * Qf; i++) { const a = r() * Math.PI * 2; const R = this.sim.rings[e.idx]!; const u = new THREE.Vector3(Math.cos(a), Math.sin(a), 0).applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(...R.n))); this.sparks.spawn([R.c[0] + u.x * 2.4, R.c[1] + u.y * 2.4, R.c[2] + u.z * 2.4], [u.x * 6, u.y * 6, u.z * 6], e.t, 0.6, 0.14, [1.4, 2.6, 3.4], 1.5, 0.2); }
    } else if (e.type === 'clang') {
      const r = mulberry32(Math.round(e.t * 1000));
      for (let i = 0; i < 60; i++) { const s = 4 + r() * 10; this.sparks.spawn(e.p, [(r() - 0.5) * s, (r() - 0.5) * s, (r() - 0.5) * s], e.t, 0.4 + r() * 0.4, 0.1, [3, 2.6, 1.6], 2, 0.6); }
    } else if (e.type === 'reset') {
      if (e.what === 'scene' || e.what === 'target') this.clearFx();
    }
    void g;
  }

  clearFx() {
    this.sparks.clear(); this.embers.clear(); this.dust.clear(); this.swirl.clear(); this.rubble.clear();
    this.bursts.clear(); this.bolts.clear(); this.flashes.clear(); this.impacts = []; this.camRig.shakes = []; this.camRig.cut = null;
  }

  // ------------------------------------------------------------------ per-frame view update and render
  /** Update every view for the current sim state. `camera` false: the caller has placed the camera (reel, orbit). */
  updateViews(dtReal: number, opts: { camera?: boolean; clock?: number } = {}) {
    if (opts.clock !== undefined) this.clock = opts.clock;
    const t = this.tSim, a = this.alpha, rig = this.sim.rig, cam = this.camRig.cam;
    const modeCore = new THREE.Color(...MODES[this.sim.settings.mode].core);
    const flying = this.sim.arrows.find((x) => x.alive && !x.stuck) ?? null;
    if (opts.camera !== false) {
      const imp = this.sim.lastImpact;
      this.camRig.update(dtReal, this.clock, {
        rig, tSim: t, arrow: flying, portrait: this.portrait,
        impact: imp ? { p: imp.p, n: [0, 0, 1], r: imp.fx.radius, t: imp.t } : null,
        replayOrbit: this.replay ? { c: this.replay.c, a: (this.clock - this.replay.start) * 0.22 } : undefined,
      });
    }
    this.arena.update(this.clock, cam);
    const since = t - this.lastLaunchT;
    this.bow.update(rig, a, t, this.clock, modeCore, rig.held || since > 0.35 || since < 0);
    // flights
    const arrows = this.sim.arrows;
    this.flights.forEach((f, i) => { const ar = arrows[i]; if (ar) { f.group.visible = true; f.update(ar, a, t, cam.position); } else f.hide(); });
    for (const v of this.views.values()) if (v.mesh.visible) v.update(a, t, this.impacts);
    const scale = this.renderer.domElement.height / (2 * Math.tan(THREE.MathUtils.degToRad(cam.fov) / 2));
    const g = GRAVITY[this.sim.settings.gravity].g;
    this.sparks.update(t, g, scale); this.embers.update(t, g, scale); this.dust.update(t, g, scale); this.swirl.update(t, scale);
    this.arena.mist.uniforms.uScale!.value = scale;
    const liveRubble = this.rubble.update(t, g);
    this.rubbleMat.color.set(this.sim.targets.get(this.sim.active[0]!)?.mat.glassy ? 0x7ab4dc : 0x8a7a68);
    this.bursts.update(t); this.bolts.update(t, cam.position); this.flashes.update(t);
    this.ringMeshes.forEach((m, i) => { const r = this.sim.rings[i]; if (r) { const mm = m.material as THREE.MeshPhysicalMaterial; mm.emissiveIntensity = r.passed ? 4 : 1 + 0.4 * Math.sin(this.clock * 3 + i); m.rotation.z += 0; } });
    this.marker.children.forEach((c, i) => { c.rotation.y = this.clock * (i ? 1.5 : 0.6); if (i) c.position.y = PLACEMENTS.crystal.p[1] + 17.5 + Math.sin(this.clock * 2.5) * 0.6; });
    // the aim preview from the current draw (dimmed while an arrow flies; in THE IMPOSSIBLE SHOT only the first quarter)
    this.updateTrajectory(rig, t);
    // shadows: tight on the bow in close-ups, otherwise over the whole active target
    this.focusShadows();
    // post: the Cosmic ripple, flashes
    this.updatePost(t);
    this.updateTelemetry(liveRubble);
  }

  /** One shadow map, aimed where it matters: the bow when the camera is close to it, else the target. */
  focusShadows() {
    const cam = this.camRig.cam, bp = this.bow.group.position;
    const toBow = bp.clone().sub(cam.position), fwd = new THREE.Vector3(); cam.getWorldDirection(fwd);
    const near = toBow.length() < 9 && toBow.normalize().dot(fwd) > 0.55;
    const tid = this.sim.active[0] ?? 'mountain', P = PLACEMENTS[tid as TargetId];
    const R = tid === 'mountain' ? 72 : tid === 'mini' ? 40 : 22;
    if (near) this.arena.focusShadow(bp.clone(), 4.5, QUALITY[this.live.quality].shadow);
    else this.arena.focusShadow(new THREE.Vector3(...P.p), R, QUALITY[this.live.quality].shadow);
  }

  private updateTrajectory(rig: BowRig, t: number) {
    // while drawing: the path from the current draw; idle (no arrow in flight): the path a full draw would take
    // at the current power limit, dimmer, so changing gravity or power visibly bends it
    const idle = !rig.held && this.sim.arrows.every((x) => !x.alive) && !this.replay && t - this.lastLaunchT > 1.2;
    const show = this.live.trajectory && ((rig.held && rig.draw > 0.04) || idle);
    this.traj.visible = show;
    if (!show) return;
    const d = rig.held ? rig.draw : rig.maxDraw;
    const f = rig.aim(), nk = rig.nock(t, d), sp = launchSpeed(d);
    const tip: V3 = [nk[0] + f[0] * ARROW_LEN, nk[1] + f[1] * ARROW_LEN, nk[2] + f[2] * ARROW_LEN];
    const path = ballistic(tip, [f[0] * sp, f[1] * sp, f[2] * sp], GRAVITY[this.sim.settings.gravity].g, this.sim.settings.drag, 0.03, 159);
    const frac = this.sim.challenge?.id === 'impossible' ? 0.25 : 1;
    const n = Math.floor((path.length / 3) * frac);
    this.trajPos.fill(0);
    for (let i = 1; i < n; i++) this.trajPos.set(path.slice(3 * i, 3 * i + 3), 3 * i);
    (this.traj.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    this.traj.geometry.setDrawRange(1, Math.max(0, n - 1));
    const tm = this.traj.material as THREE.ShaderMaterial;
    tm.uniforms.uA!.value = rig.held ? 0.35 + 0.5 * rig.power : 0.3;
    tm.uniforms.uScale!.value = this.renderer.domElement.height / (2 * Math.tan(THREE.MathUtils.degToRad(this.camRig.cam.fov) / 2));
  }

  private updatePost(t: number) {
    const gr = this.pipe.grade.uniforms;
    gr.uTime!.value = this.clock;
    const flash = new THREE.Color(0, 0, 0);
    let ripple = 0, rx = 0.5, ry = 0.5, rr = 0;
    const imp = this.sim.lastImpact;
    if (imp) {
      const age = t - imp.t;
      if (age >= 0 && age < 0.25) flash.copy(new THREE.Color(...MODES[imp.mode].trail)).multiplyScalar(0.18 * (1 - age / 0.25));
      if (imp.mode === 'cosmic' && age >= 0 && age < 2.4) {
        const p = new THREE.Vector3(...imp.p).project(this.camRig.cam);
        if (p.z < 1) { rx = p.x * 0.5 + 0.5; ry = p.y * 0.5 + 0.5; rr = 0.04 + age * 0.32; ripple = (1 - age / 2.4) * 1.2; }
      }
    }
    gr.uFlash!.value.copy(flash);
    (gr.uRipple!.value as THREE.Vector4).set(rx, ry, rr, ripple);
    gr.uAberr!.value = 0.006 + (imp && t - imp.t < 0.6 && t >= imp.t ? 0.03 * (1 - (t - imp.t) / 0.6) : 0);
  }

  private updateTelemetry(rubble: number) {
    let loose = 0, fixed = 0, vol = 0, tot = 0;
    for (const id of this.sim.active) {
      const d = this.sim.targets.get(id); if (!d) continue;
      for (let i = 0; i < d.n; i++) { if (d.state[i] === PieceState.Loose) loose++; else if (d.state[i] === PieceState.Attached) fixed++; }
      vol += d.looseVol; tot += d.totalVol;
    }
    const rig = this.sim.rig, imp = this.sim.lastImpact;
    const T = this.telemetry;
    T.loose = loose; T.fixed = fixed; T.rubble = rubble; T.draw = rig.power; T.speed = launchSpeed(rig.draw); T.ke = 0.5 * BOW.ARROW_MASS * T.speed * T.speed;
    T.detached = tot ? vol / tot : 0; T.stepMs = this.stepMsAvg; T.quality = this.live.quality;
    T.fantasy = imp ? imp.E : 0;
    T.lastImpact = imp ? `${MODES[imp.mode].label}: ${(imp.E / 1e9).toFixed(2)} GJ fantasy, r* ${imp.rStar.toFixed(1)} m, ${imp.broken} broke${imp.heated ? `, ${imp.heated} heating` : ''}` : '';
    T.challenge = this.sim.challenge ? `${CHALLENGES[this.sim.challenge.id].title}: ${this.sim.challenge.note}` : '';
  }

  render() { this.pipe.draw(); }

  setSize(w: number, h: number) {
    this.portrait = h > w;
    this.camRig.cam.aspect = w / h; this.camRig.cam.updateProjectionMatrix();
    this.pipe.setSize(w, h);
  }
}

const smooth = (x: number) => { const t = Math.max(0, Math.min(1, x)); return t * t * (3 - 2 * t); };
export { hashi, BowRig };
export type { ModeId };
