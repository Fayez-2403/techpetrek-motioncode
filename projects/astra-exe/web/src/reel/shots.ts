// The 65-second reel as data: eight sequences, each a real simulation run in a fresh physics world with scripted
// input on the live controls (the same calls the pointer and the panel make), a reel-time -> sim-time map (slow
// motion, freezes), a camera that is a pure function of time, and its titles. Impact and ring times come from a
// dry run of the same simulation, so the cuts land on what the physics actually does.
import * as THREE from 'three';
import type { Stage, LiveSettings } from '../view/stage';
import type { CamPose } from '../view/camera';
import { BOW, MODES, PHYS_DT, type ModeId } from '../core/config';
import { BOW_HOME, BRACE } from '../core/bowrig';
import { IMPOSSIBLE_SHOT, impossibleGeometry, PLACEMENTS } from '../core/challenges';
import { settings } from '../ui/store';
import type { ReelUI } from './ReelLayer';
import type { Overlay, VOLine } from './overlay';
import { type V3, sat, lerp, smooth, smoother, outCubic, outExpo, inOutCubic, span, v3, pw, rateMap, solveAim, surfacePoint } from './util';

export interface Dry { impact: { t: number; p: V3; n: V3; r: number } | null; rings: number[]; launch: number | null; breaks: number }
export interface Pose extends CamPose { shift?: number }
export interface Ctx {
  stage: Stage; t: number; simT: number; dry: Dry; o: Overlay; vo: VO;
  /** World -> screen px (1080x1920) with the current camera; [x, y, in front]. */
  project: (p: V3 | THREE.Vector3) => [number, number, boolean];
  /** Centre of a DOM element (by selector) in screen px, or null. */
  rect: (sel: string) => DOMRect | null;
  ui: Partial<ReelUI>;
  cursor: { x: number; y: number; a: number; press: number; hold: boolean };
}
export interface Shot {
  id: string; t0: number; t1: number;
  /** Sim seconds to dry-run (to find the impact, the rings). */
  dryFor: number;
  setup(stage: Stage): void;
  drive?(s: number, stage: Stage): void;
  build(dry: Dry): void;
  map: (t: number) => number;
  camera(c: Ctx): Pose;
  /** Per frame, before the camera: the UI state. */
  ui?(c: Ctx): void;
  /** Per frame, after rendering: overlay drawing (titles, cursor, labels). */
  frame?(c: Ctx): void;
  /** Sound cues in reel time that are not simulation events (cuts, UI clicks, titles), for the mix. */
  audio?: [number, string][];
}
const ticks = (a: number, b: number, dt = 0.07): [number, string][] => { const o: [number, string][] = []; for (let t = a; t < b; t += dt) o.push([t, 'tick']); return o; };

export class VO {
  constructor(public lines: VOLine[]) {}
  word(chapter: string, w: string, k = 1): { start: number; end: number } {
    let n = 0;
    for (const l of this.lines) if (l.chapter === chapter) for (const x of l.words) {
      if (x.w === w || x.w.replace(/[,.!?…।—]+$/, '') === w) { if (++n === k) return x; }
    }
    throw new Error(`vo word not found: ${chapter}/${w}`);
  }
  line(chapter: string, k = 0) { return this.lines.filter((l) => l.chapter === chapter)[k]!; }
}

// ------------------------------------------------------------------ helpers
const B = v3(BOW_HOME);
const DEFAULTS: Partial<LiveSettings> = { mode: 'vajra', drawPower: 1, gravity: 'earth', material: 'brittle', impactMult: 1, drag: true, timeScale: 1, paused: false, slowmo: false, trajectory: false, autoCut: false };
function live(p: Partial<LiveSettings>) {
  const s = settings.get() as unknown as Record<string, unknown>;
  for (const [k, v] of Object.entries(p)) if (s[k] !== v) { settings.set(p); return; }
}
function aimBow(stage: Stage, yaw: number, pitch: number, drawFrac = 0) {
  const r = stage.sim.rig;
  r.yaw = r.prevYaw = r.aimYaw = yaw; r.pitch = r.prevPitch = r.aimPitch = pitch;
  if (drawFrac > 0) { r.held = true; r.draw = r.prevDraw = r.target = BOW.MAX_DRAW * drawFrac; r.drawVel = 0; }
}
/** A point on the mountain's surface, found by a ray from the bow toward `toward`. */
function onMountain(stage: Stage, toward: V3): V3 {
  return surfacePoint(stage.sim, [BOW_HOME[0], BOW_HOME[1] + 0.03, BOW_HOME[2] - 1], toward) ?? toward;
}
const hdir = (p: V3) => { const d = new THREE.Vector3(p[0] - BOW_HOME[0], 0, p[2] - BOW_HOME[2]).normalize(); return { d, perp: new THREE.Vector3(-d.z, 0, d.x) }; };
const pose = (pos: THREE.Vector3, look: THREE.Vector3, fov = 60, shift = 0, roll = 0): Pose => ({ pos, look, fov, shift, roll });
const mix = (a: Pose, b: Pose, k: number): Pose => ({ pos: a.pos.clone().lerp(b.pos, k), look: a.look.clone().lerp(b.look, k), fov: lerp(a.fov, b.fov, k), shift: lerp(a.shift ?? 0, b.shift ?? 0, k), roll: lerp(a.roll ?? 0, b.roll ?? 0, k) });
/** The bow's own frame (its aim) at the current sim state. */
function bowFrame(stage: Stage) { const r = stage.sim.rig; return r.frame(r.aimYaw, r.aimPitch); }
function bowLocal(stage: Stage, x: number, y: number, z: number) {
  const F = bowFrame(stage), p = stage.sim.rig.pos(stage.tSim);
  return new THREE.Vector3(p[0] + F.x[0] * x + F.y[0] * y + F.z[0] * z, p[1] + F.x[1] * x + F.y[1] * y + F.z[1] * z, p[2] + F.x[2] * x + F.y[2] * y + F.z[2] * z);
}
/** The behind-the-shoulder game view (portrait), its subject raised above the panel by `shift`. */
function gameView(stage: Stage, shift = 0.0, back = 4.4, side = 0.62, up = 0.9, fov = 62, ahead = 22): Pose {
  const r = stage.sim.rig, F = r.frame(r.aimYaw, r.aimPitch), f = [-F.z[0], -F.z[1], -F.z[2]];
  const p = bowLocal(stage, side, up, back), look = B.clone().add(new THREE.Vector3(f[0]! * ahead, f[1]! * ahead + 0.4, f[2]! * ahead));
  return pose(p, look, fov, shift);
}
/** The game view for shots with the panel up: well back, the frame's centre raised so the bow sits above the panel. */
const panelView = (st: Stage) => gameView(st, 0.36, 7.6, 0.8, 0.55, 56, 60);
/** The cursor over a DOM control (its centre) or a world point. */
function domCenter(c: Ctx, sel: string): [number, number] | null { const r = c.rect(sel); return r ? [r.left + r.width / 2, r.top + r.height / 2] : null; }
function sliderThumb(c: Ctx, id: string, v: number): [number, number] | null {
  const r = c.rect(`[data-slider="${id}"] input`); if (!r) return null;
  const el = document.querySelector(`[data-slider="${id}"] input`) as HTMLInputElement, min = +el.dataset.min!, max = +el.dataset.max!;
  const k = (v - min) / (max - min); return [r.left + 20 + (r.width - 40) * k, r.top + r.height / 2];
}
/** Cursor keyframes: [time, position or null (hidden), pressed?]; positions ease between keys. */
type Key = [number, (() => [number, number] | null) | [number, number] | null, boolean?];
function cursorAt(c: Ctx, keys: Key[], hold = false) {
  const t = c.t;
  let i = keys.findIndex((k) => k[0] > t); if (i < 0) i = keys.length;
  const a = keys[Math.max(0, i - 1)], b = keys[Math.min(keys.length - 1, i)];
  if (!a) return;
  const pa = typeof a[1] === 'function' ? a[1]() : a[1], pb = b ? (typeof b[1] === 'function' ? b[1]() : b[1]) : pa;
  if (!pa) { c.cursor.a = 0; return; }
  const k = b && b !== a && pb ? smoother((t - a[0]) / Math.max(0.001, b[0] - a[0])) : 0;
  const p = pb ? [lerp(pa[0], pb[0], k), lerp(pa[1], pb[1], k)] : pa;
  c.cursor.x = p[0]!; c.cursor.y = p[1]!; c.cursor.a = Math.min(1, c.cursor.a || 1); c.cursor.hold = hold;
  // a press ripple after each pressed key
  for (const kk of keys) if (kk[2] && t >= kk[0] && t < kk[0] + 0.45) c.cursor.press = (t - kk[0]) / 0.45;
}
const nockScreen = (c: Ctx) => () => { const r = c.stage.sim.rig; const p = bowLocal(c.stage, 0, 0.028, BRACE + r.draw); const [x, y] = c.project(p); return [x, y] as [number, number]; };

/** The readout's numbers, counted from the simulation now (not last frame's telemetry). */
function liveStats(st: Stage): ReelUI['stats'] {
  let loose = 0, fixed = 0;
  for (const id of st.sim.active) { const d = st.sim.targets.get(id); if (!d) continue; for (let i = 0; i < d.n; i++) { if (d.state[i] === 1) loose++; else if (d.state[i] === 0) fixed++; } }
  const r = st.sim.rig, g = { earth: 9.81, moon: 1.62, extreme: 29.4, zero: 0 }[st.sim.settings.gravity];
  const sp = r.draw > 0.01 ? Math.sqrt((2 * 0.8 * 0.5 * BOW.K * r.draw * r.draw) / BOW.ARROW_MASS) : 0;
  return { loose, fixed, rubble: 0, stepMs: st.telemetry.stepMs, g, scale: settings.get().timeScale, draw: Math.max(0, r.draw / BOW.MAX_DRAW), speed: sp };
}

// ------------------------------------------------------------------ the shots
export function buildShots(vo: VO): Shot[] {
  const shots: Shot[] = [];

  // ================= 1. HOOK (0 - 4.65): the arrow strikes, the mountain bursts, time freezes, pull back to the bow
  {
    let P: V3 = [0, 0, 0], aim = { yaw: 0, pitch: 0, flight: 1, speed: 80 }, I = 1.6, N = new THREE.Vector3(0, 0, 1);
    const sh: Shot = {
      id: 'hook', t0: 0, t1: 4.65, dryFor: 3.2,
      setup(st) {
        live({ ...DEFAULTS, mode: 'vajra', impactMult: 4.2, material: 'brittle' });
        P = onMountain(st, [7, 15, -90]);
        aim = solveAim(P, 1, 'earth');
        aimBow(st, aim.yaw, aim.pitch, 1);
      },
      drive(s, st) { if (s >= 0.05 && st.sim.rig.held) st.release(); },
      build(d) { if (d.impact) { I = d.impact.t; P = d.impact.p; N = v3(d.impact.n); } this.map = rateMap(0, I - 0.5, [[0, 1], [1.0, 0.33], [2.0, 0.1], [3.0, 0]]); },
      map: (t) => t,
      camera(c) {
        const { d, perp } = hdir(P), Pv = v3(P), t = c.t;
        // the whole mountain from its side, the arrow crossing the frame from the left into it
        const M = v3(PLACEMENTS.mountain.p);
        const A = pose(M.clone().addScaledVector(perp, 128).addScaledVector(d, -34).add(new THREE.Vector3(0, -2, 0)), M.clone().addScaledVector(d, -14).add(new THREE.Vector3(0, 4, 0)), 64);
        const A2 = pose(M.clone().addScaledVector(perp, 118).addScaledVector(d, -36).add(new THREE.Vector3(0, -1, 0)), M.clone().addScaledVector(d, -14).add(new THREE.Vector3(0, 4, 0)), 63);
        // then in among the boulders flying at the camera
        const Bp = pose(Pv.clone().addScaledVector(perp, 62).addScaledVector(d, -44).add(new THREE.Vector3(0, 5, 0)), Pv.clone().addScaledVector(N, 10).add(new THREE.Vector3(0, 2, 0)), 64);
        const C = pose(Pv.clone().addScaledVector(perp, 34).addScaledVector(d, -52).add(new THREE.Vector3(0, 4, 0)), Pv.clone().addScaledVector(N, 18), 68, 0, -0.05);
        // pulled all the way back: the bow in front, the frozen burst beyond it
        const toP = Pv.clone().sub(B).normalize();
        const D = pose(B.clone().add(new THREE.Vector3(1.05, 0.42, 3.3)), B.clone().addScaledVector(toP, 26).add(new THREE.Vector3(-5.2, 1.4, 0)), 58);
        let p: Pose;
        if (t < 0.5) p = mix(A, A2, t / 0.5);
        else if (t < 3.0) p = mix(mix(A2, Bp, smooth(span(t, 0.5, 1.8))), C, smooth(span(t, 1.8, 3.0)));
        else p = mix(C, D, outExpo(span(t, 3.0, 3.85)));
        return p;
      },
      frame(c) {
        const o = c.o, t = c.t;
        o.flash(Math.max(0, 0.35 * (1 - (t - 0.5) / 0.12)) * (t >= 0.5 ? 1 : 0));
        o.title('LEGENDARY WEAPONS', 330, t, 0.55, 2.85, { size: 96 });
        o.title('× REAL-TIME PHYSICS 😳', 440, t, 0.7, 2.85, { size: 80, color: 'white' });
        o.title('WHAT IF LEGENDARY', 330, t, 3.05, 4.55, { size: 88, slam: false });
        o.title('WEAPONS HAD PHYSICS?', 430, t, 3.15, 4.55, { size: 88, slam: false });
        o.title('I MADE THEM INTERACTIVE.', 540, t, 3.75, 4.55, { size: 70, color: 'sky', glow: 'rgba(110,190,255,0.8)' });
      },
    };
    sh.audio = [[0.53, 'slam'], [0.7, 'slam-soft'], [3.0, 'freeze'], [3.0, 'whoosh-back'], [3.05, 'slam-soft'], [3.75, 'slam-soft']];
    shots.push(sh);
  }

  // ================= 2. THE BOW (4.65 - 21.0): reveal, macro, the cursor pulls the string; the panel: Vajra, power 20 -> 100%; aim; release; impact
  {
    const T0 = 4.65;
    let P: V3 = [0, 0, 0], aim = { yaw: 0, pitch: 0.06, flight: 1.4, speed: 83 }, I = 12, N = new THREE.Vector3(0, 0, 1);
    const tGrab1 = 8.05, tLet = 11.35, tPanel = 11.95, tVajra = 12.12, tPow0 = 12.32, tPow1 = 13.3, tGrab2 = 13.6, tFull = 14.45, tRel = 15.0;
    const s = (t: number) => t - T0;
    const sh: Shot = {
      id: 'bow', t0: T0, t1: 21.0, dryFor: 14,
      setup(st) {
        live({ ...DEFAULTS, mode: 'cosmic', drawPower: 1, impactMult: 1.8, trajectory: true });
        P = onMountain(st, [-4, 9, -95]);
        aim = solveAim(P, 1, 'earth');
        aimBow(st, aim.yaw * 0.4, aim.pitch - 0.05, 0);
      },
      drive(si, st) {
        const t = si + T0, r = st.sim.rig;
        // first draw: the cursor grabs the string and pulls it back, then eases it home (no shot)
        if (t >= tGrab1 && t < tLet + 0.4) { if (!r.held) st.grab(); st.pull(BOW.MAX_DRAW * (smooth(span(t, tGrab1, 10.3)) * 0.92 - 0.92 * smooth(span(t, tLet - 0.15, tLet + 0.3)))); }
        if (t >= tLet + 0.4 && t < tGrab2 && r.held) st.release();
        // the panel: Vajra, then the power slider 20 -> 100%
        live({ mode: t >= tVajra ? 'vajra' : 'cosmic', drawPower: t < tPanel ? 1 : Math.round((0.2 + 0.8 * smooth(span(t, tPow0, tPow1))) * 100) / 100 });
        // second draw: grab, pull to full while nudging the aim (nock low: arrow up), release
        if (t >= tGrab2 && t < tRel) { if (!r.held) st.grab(); st.pull(BOW.MAX_DRAW * smooth(span(t, tGrab2, tFull))); const k = smooth(span(t, 13.75, 14.7)); st.aim(lerp(aim.yaw * 0.4, aim.yaw, k), lerp(aim.pitch - 0.05, aim.pitch, k)); }
        if (t >= tRel && r.held) st.release();
      },
      build(d) {
        if (d.impact) { I = d.impact.t; P = d.impact.p; N = v3(d.impact.n); }
        const tImp = I + T0;
        this.map = rateMap(T0, 0, [[T0, 1], [tImp + 0.06, 0.26], [19.7, 0.55], [20.35, 1]]);
        (this as Shot & { tImp: number }).tImp = tImp;
      },
      map: (t) => t - T0,
      camera(c) {
        const t = c.t, st = c.stage, tImp = (this as Shot & { tImp?: number }).tImp ?? 16.5;
        const Pv = v3(P), { d, perp } = hdir(P);
        if (t < 6.55) { // SHOT A: weapon reveal, a slow orbit
          const u = smoother(span(t, T0, 6.55)), th = lerp(-1.25, 0.95, u), R = lerp(2.3, 1.55, u);
          return pose(B.clone().add(new THREE.Vector3(Math.sin(th) * R, 0.35 - 0.2 * u, Math.cos(th) * R)), B.clone().add(new THREE.Vector3(0, 0.12, 0)), 46);
        }
        if (t < 7.5) { // the carvings: along the upper limb
          const u = smooth(span(t, 6.55, 7.5));
          return pose(bowLocal(st, 0.55, 0.45 + 0.3 * u, 0.42), bowLocal(st, 0, 0.62 + 0.3 * u, 0.1), 40);
        }
        if (t < tPanel) { // SHOT B: string macro from the side, easing back with the draw
          const r = st.sim.rig, u = smooth(span(t, 7.5, 10.4));
          return pose(bowLocal(st, 1.1 + 0.25 * u, 0.12, 0.5 + r.draw * 0.6), bowLocal(st, 0, 0.03, 0.3 + r.draw * 0.6), 44 + 6 * u);
        }
        if (t < 14.75) { // the panel is up: the game view, its subject above the panel
          return panelView(st);
        }
        if (t < tRel + 0.05) { // SHOT C: along the glowing arrow
          const u = smooth(span(t, 14.75, tRel));
          return pose(bowLocal(st, 0.12, 0.09, 0.95 - 0.5 * u), bowLocal(st, 0, 0.03, -3), 52);
        }
        const ar = st.sim.arrows.find((a) => a.alive) ?? st.sim.arrows[st.sim.arrows.length - 1];
        if (t < tImp - 0.02 && ar) { // SHOT D: follow the arrow
          const p = v3(ar.p), dd = v3(ar.dir);
          return pose(p.clone().addScaledVector(dd, -4.8).add(new THREE.Vector3(0.9, 1.0, 0)), p.clone().addScaledVector(dd, 30), 62);
        }
        if (t < tImp + 1.0) { // SHOT E: the impact, wide
          const u = outCubic(span(t, tImp, tImp + 1.0));
          return pose(Pv.clone().addScaledVector(perp, 58 - 8 * u).addScaledVector(d, -50).add(new THREE.Vector3(0, 10, 0)), Pv.clone().addScaledVector(N, 8), 62);
        }
        // SHOT F: slow motion among the tumbling pieces
        const u = smooth(span(t, tImp + 1.0, 21.0));
        return pose(Pv.clone().addScaledVector(N, 36 - 14 * u).addScaledVector(perp, 18 - 30 * u).add(new THREE.Vector3(0, 3 + 4 * u, 0)), Pv.clone().addScaledVector(N, 6), 66, 0, 0.04 * Math.sin(u * 2));
      },
      ui(c) {
        const t = c.t;
        c.ui.sections = ['mode', 'power'];
        c.ui.slide = smooth(span(t, tPanel - 0.35, tPanel + 0.15)) * (1 - smooth(span(t, 14.55, 14.85)));
        c.ui.title = t >= tPow1 ? 'POWER 100%' : '';
        c.ui.pressed = t >= tVajra - 0.02 && t < tVajra + 0.2 ? 'mode:vajra' : '';
      },
      frame(c) {
        const o = c.o, t = c.t, tImp = (this as Shot & { tImp?: number }).tImp ?? 16.5;
        cursorAt(c, [
          [7.6, null], [7.62, [1010, 1320]], [tGrab1, nockScreen(c), true], [tLet + 0.3, nockScreen(c)], [tLet + 0.55, [900, 1200]],
          [tVajra - 0.25, () => domCenter(c, '[data-key="mode:vajra"]')], [tVajra, () => domCenter(c, '[data-key="mode:vajra"]'), true],
          [tPow0 - 0.05, () => sliderThumb(c, 'draw', 0.2), true], [tPow1, () => sliderThumb(c, 'draw', settings.get().drawPower)],
          [tGrab2 - 0.1, nockScreen(c)], [tGrab2, nockScreen(c), true], [tRel, nockScreen(c)], [tRel + 0.25, null],
        ], (t >= tGrab1 && t < tLet + 0.35) || (t >= tGrab2 && t < tRel));
        if (t >= tPow0 && t <= tPow1 + 0.05) c.cursor.x = sliderThumb(c, 'draw', settings.get().drawPower)?.[0] ?? c.cursor.x;
        o.sequence([['GRAB', tGrab1], ['PULL', 8.55], ['AIM', 9.35], ['RELEASE', 10.15]], 330, t, 11.5, 70);
        o.title('POWER: 100%', 330, t, tPow1, 14.7, { size: 96 });
        o.tag('IN-ENGINE · REAL PHYSICS', 540, 250, sat((t - 5.0) / 0.3) * (1 - sat((t - 11.6) / 0.3)), { size: 24, col: '#9fd8ff' });
        o.flash(t >= tImp ? Math.max(0, 0.45 * (1 - (t - tImp) / 0.16)) : 0);
        o.tag('VAJRA PULSE · impact multiplier 1.8× (fantasy)', 540, 250, sat((t - tImp - 0.2) / 0.3) * (1 - sat((t - 20.6) / 0.3)), { size: 24 });
      },
    };
    sh.audio = [[T0, 'cut'], [tPanel - 0.3, 'panel-in'], [tVajra, 'click'], ...ticks(tPow0, tPow1), [tPow1, 'slam'], [14.55, 'panel-out'], [8.55, 'slam-soft'], [9.35, 'slam-soft'], [10.15, 'slam-soft']];
    shots.push(sh);
  }

  // ================= 3. FOUR MODES (21.0 - 31.0)
  {
    const modeShot = (mode: ModeId, id: string, t0: number, t1: number, word: { start: number }, toward: V3, mult: number, after: (tImp: number) => [number, number][],
      cam: (c: Ctx, P: THREE.Vector3, N: THREE.Vector3, d: THREE.Vector3, perp: THREE.Vector3, u: number, tImp: number) => Pose, badge: string, note: string) => {
      let P: V3 = [0, 0, 0], I = 1.5, N = new THREE.Vector3(0, 0, 1);
      const tImp = word.start + 0.04;
      const sh: Shot = {
        id, t0, t1, dryFor: 3,
        setup(st) {
          live({ ...DEFAULTS, mode, impactMult: mult });
          P = onMountain(st, toward);
          const a = solveAim(P, 1, 'earth'); aimBow(st, a.yaw, a.pitch, 1);
        },
        drive(s, st) { if (s >= 0.05 && st.sim.rig.held) st.release(); },
        build(d) { if (d.impact) { I = d.impact.t; P = d.impact.p; N = v3(d.impact.n); } this.map = rateMap(t0, I - (tImp - t0), [[t0, 1], ...after(tImp)]); },
        map: (t) => t,
        camera(c) { const { d, perp } = hdir(P); return cam(c, v3(P), N, d, perp, span(c.t, t0, t1), tImp); },
        frame(c) {
          const o = c.o, t = c.t, M = MODES[mode];
          o.flash(t >= tImp ? Math.max(0, 0.22 * (1 - (t - tImp) / 0.12)) : 0, mode === 'cosmic' ? '200,180,255' : mode === 'vayu' ? '200,240,255' : mode === 'agni' ? '255,200,150' : '255,246,220');
          o.title(`${M.emoji} ${badge}`, 330, t, tImp, t1 - 0.05, { size: 84, color: mode === 'vayu' ? 'sky' : mode === 'cosmic' ? 'violet' : 'gold', glow: mode === 'vayu' ? 'rgba(110,210,255,0.8)' : mode === 'cosmic' ? 'rgba(160,120,255,0.8)' : undefined, out: 0.1 });
          o.tag(note, 540, 430, sat((t - tImp - 0.15) / 0.25) * (1 - sat((t - t1 + 0.15) / 0.12)), { size: 26 });
          if (mode === 'vajra') o.title('4 CELESTIAL MODES ⚡🔥🌪️🌌', 1250, t, t0 + 0.05, 22.75, { size: 58, color: 'white', out: 0.12 });
        },
      };
      sh.audio = [[t0, 'cut'], [tImp + 0.02, 'slam']];
      return sh;
    };
    const w = (x: string) => vo.word('modes', x);
    shots.push(modeShot('vajra', 'm-vajra', 21.0, 22.85, w('Lightning'), [-15, 17, -92], 2.2, (ti) => [[ti + 0.05, 0.45], [ti + 0.9, 0.8]],
      (c, P, N, d, perp, u) => pose(P.clone().addScaledVector(N, 34).addScaledVector(perp, -22 + 6 * u).add(new THREE.Vector3(0, -12, 0)), P.clone().add(new THREE.Vector3(0, 4, 0)), 62),
      'VAJRA PULSE', 'impulse + shockwave + lightning'));
    shots.push(modeShot('agni', 'm-agni', 22.85, 24.65, w('fire'), [12, 6, -95], 1.7, (ti) => [[ti + 0.05, 1.35]],
      (c, P, N, d, perp, u) => pose(P.clone().addScaledVector(N, 30 - 4 * u).addScaledVector(perp, 20).add(new THREE.Vector3(0, 5, 0)), P.clone().addScaledVector(perp, -2), 60),
      'AGNI WAVE', 'heat front (shader), pieces crack loose'));
    shots.push(modeShot('vayu', 'm-vayu', 24.65, 26.45, w('storm'), [-3, -6, -100], 1.7, (ti) => [[ti + 0.05, 1.1]],
      (c, P, N, d, perp, u) => pose(P.clone().addScaledVector(N, 62 - 8 * u).addScaledVector(perp, -26).add(new THREE.Vector3(0, 10, 0)), P.clone().addScaledVector(N, 12).add(new THREE.Vector3(0, 6, 0)), 64),
      'VAYU STORM', 'wind field: lift + swirl'));
    const tg = vo.word('modes', 'gravity').start;
    shots.push(modeShot('cosmic', 'm-cosmic', 26.45, 31.0, vo.word('modes', 'cosmic'), [2, 10, -94], 2.4, (ti) => [[ti + 0.05, 0.18], [tg, 0.55], [tg + 0.5, 1.45]],
      (c, P, N, d, perp, u) => { const a = lerp(-0.25, 0.35, smooth(u)); const off = N.clone().multiplyScalar(Math.cos(a) * 78).addScaledVector(perp, Math.sin(a) * 78); return pose(P.clone().add(off).add(new THREE.Vector3(0, 14, 0)), P.clone().add(new THREE.Vector3(0, -2, 0)), 64); },
      'COSMIC FRACTURE', 'time slows, gravity suspended (fiction)'));
  }

  // ================= 4. THE LAB (31.0 - 42.0): the real controls change gravity, power, material, time scale
  {
    const T0 = 31.0;
    const tg = vo.word('lab', 'Gravity').start, tp = vo.word('lab', 'arrow').start, tm = vo.word('lab', 'material').start;
    const tFire = 35.69, tSlow = 39.2, tExt = 40.1, tFast = 41.15;   // (the impact lands on the 96 BPM grid, 38.625 s)
    let P: V3 = [0, 0, 0], aEarth = { yaw: 0, pitch: 0.06, flight: 1.4, speed: 60 }, aMoon = { yaw: 0, pitch: 0.06, flight: 2, speed: 50 }, I = 7, N = new THREE.Vector3(0, 0, 1);
    const sh: Shot = {
      id: 'lab', t0: T0, t1: 42.0, dryFor: 9.5,
      setup(st) {
        live({ ...DEFAULTS, mode: 'vajra', drawPower: 0.7, impactMult: 1.6, trajectory: true });
        P = onMountain(st, [0, 8, -95]);
        aEarth = solveAim(P, 0.7, 'earth'); aMoon = solveAim(P, 0.55, 'moon');
        aimBow(st, aEarth.yaw, aEarth.pitch, 0);
      },
      drive(s, st) {
        const t = s + T0;
        const scale = t < tSlow ? 1 : t < tFast ? 0.25 : 1;
        live({
          gravity: t >= tExt ? 'extreme' : t >= tg ? 'moon' : 'earth',
          drawPower: Math.round(lerp(lerp(0.7, 0.4, smooth(span(t, tp, tp + 0.55))), 0.55, smooth(span(t, tp + 0.6, tp + 1.0))) * 100) / 100,
          material: t >= tm + 0.45 ? 'crystal' : 'brittle', timeScale: scale,
        });
        if (t >= tm + 0.75 && t < tFire) { const k = smooth(span(t, tm + 0.75, tFire - 0.1)); st.aim(lerp(aEarth.yaw, aMoon.yaw, k), lerp(aEarth.pitch, aMoon.pitch, k)); }
        if (t >= tFire && !st.sim.rig.held && st.sim.arrows.length === 0) st.fire();
      },
      build(d) {
        if (d.impact) { I = d.impact.t; P = d.impact.p; N = v3(d.impact.n); }
        // the time-scale slider is what slows the reel here (0.25x between its two moves)
        this.map = rateMap(T0, 0, [[T0, 1], [tSlow + 0.25, 0.25], [tFast + 0.25, 1]]);
        (this as Shot & { tImp: number }).tImp = I + T0;
      },
      map: (t) => t - T0,
      camera(c) {
        const t = c.t, st = c.stage, tImp = (this as Shot & { tImp?: number }).tImp ?? 38;
        const Pv = v3(P), { d, perp } = hdir(P);
        const game = panelView(st);
        if (t < 32.0) { const u = outCubic(span(t, T0, 32.0)); return mix(pose(bowLocal(st, 0.5, 0.25, 1.1), bowLocal(st, 0, 0.1, -2), 50, 0.36), game, u); }
        if (t < tFire + 0.95) return game;
        if (t < tImp - 0.1) { // from behind and above the bow: the tall moon-gravity arc fills the portrait frame
          const ar = st.sim.arrows[0], u = smooth(span(t, tFire + 0.95, tImp - 0.1));
          const apex = B.clone().lerp(Pv, 0.5).add(new THREE.Vector3(0, 14, 0)), look = ar ? apex.clone().lerp(v3(ar.p), 0.35) : apex;
          return pose(B.clone().addScaledVector(d, -16 - 4 * u).addScaledVector(perp, 3).add(new THREE.Vector3(0, 5, 0)), look, 62, 0);
        }
        const u = smooth(span(t, tImp, 42.0));
        return pose(Pv.clone().addScaledVector(N, 74 - 12 * u).addScaledVector(perp, 26).add(new THREE.Vector3(0, 8, 0)), Pv.clone().addScaledVector(N, 4).add(new THREE.Vector3(0, -4 * u, 0)), 60, 0.3);
      },
      ui(c) {
        const t = c.t, st = c.stage, T = st.telemetry;
        c.ui.sections = t < tFire + 0.95 ? ['gravity', 'power', 'material'] : ['time', 'gravity'];
        // the panel steps aside while the arrow flies, and comes back for the time-scale and gravity moves
        c.ui.slide = smooth(span(t, 31.25, 31.85)) * (1 - smooth(span(t, tFire + 0.6, tFire + 0.95))) + smooth(span(t, tSlow - 0.45, tSlow - 0.15));
        c.ui.title = 'LIVE';
        const pr = (k: string, at: number) => (t >= at - 0.02 && t < at + 0.22 ? k : '');
        c.ui.pressed = pr('gravity:moon', tg) || pr('material:crystal', tm + 0.45) || pr('gravity:extreme', tExt) || '';
        c.ui.statsK = smooth(span(t, 31.7, 32.1));
        c.ui.stats = liveStats(st); void T;
      },
      frame(c) {
        const o = c.o, t = c.t;
        cursorAt(c, [
          [31.9, null], [31.92, [700, 1180]],
          [tg - 0.3, () => domCenter(c, '[data-key="gravity:moon"]')], [tg, () => domCenter(c, '[data-key="gravity:moon"]'), true],
          [tp - 0.08, () => sliderThumb(c, 'draw', 0.7), true], [tp + 1.0, () => sliderThumb(c, 'draw', settings.get().drawPower)],
          [tm + 0.2, () => domCenter(c, '[data-key="material:crystal"]')], [tm + 0.45, () => domCenter(c, '[data-key="material:crystal"]'), true],
          [tm + 0.75, [560, 640], true], [tFire - 0.3, [560, 560]], [tFire - 0.05, [560, 560], true],
          [tSlow - 0.35, () => sliderThumb(c, 'time', 1)], [tSlow, () => sliderThumb(c, 'time', 1), true], [tSlow + 0.25, () => sliderThumb(c, 'time', 0.25)],
          [tExt - 0.3, () => domCenter(c, '[data-key="gravity:extreme"]')], [tExt, () => domCenter(c, '[data-key="gravity:extreme"]'), true],
          [tFast - 0.3, () => sliderThumb(c, 'time', 0.25)], [tFast, () => sliderThumb(c, 'time', 0.25), true], [tFast + 0.25, () => sliderThumb(c, 'time', 1)], [41.8, () => sliderThumb(c, 'time', 1)],
        ]);
        if (t >= tp - 0.08 && t <= tp + 1.0) c.cursor.x = sliderThumb(c, 'draw', settings.get().drawPower)?.[0] ?? c.cursor.x;
        o.title('INTERACTIVE 3D PHYSICS LAB', 300, t, 31.55, 35.2, { size: 66 });
        o.tag(`FIRE  (Space)`, 560, 470, t >= tFire - 0.5 && t < tFire + 0.5 ? 1 - Math.abs(t - tFire) * 2 : 0, { size: 28 });
      },
    };
    sh.audio = [[T0, 'cut'], [31.3, 'panel-in'], [31.55, 'slam-soft'], [tg, 'click'], ...ticks(tp, tp + 1.0), [tm + 0.45, 'click'], [tFire, 'click'], [tFire + 0.6, 'panel-out'], [tSlow - 0.45, 'panel-in'], [tSlow, 'click'], [tSlow + 0.25, 'tape-stop'], [tExt, 'click'], [tFast, 'click'], [tFast + 0.25, 'tape-start']];
    shots.push(sh);
  }

  // ================= 5. THE IMPOSSIBLE SHOT (42.0 - 53.0): three rings, one arrow, the marked crystal
  {
    const T0 = 42.0;
    const tR1 = vo.word('impossible', 'teen').start, tTarget = vo.word('impossible', 'final').start;
    const tBack = 47.2, tGrab = 47.42, tRel = 49.1;   // (the crystal impact lands on the grid, 51.125 s)
    let rel = 0, I = 9, ringT: number[] = [], P: V3 = PLACEMENTS.crystal.p;
    const geo = impossibleGeometry();
    const sh: Shot = {
      id: 'impossible', t0: T0, t1: 53.0, dryFor: 10.5,
      setup(st) {
        st.sim.startChallenge('impossible'); st.syncChallengeView();
        live({ ...DEFAULTS, mode: 'vajra', drawPower: IMPOSSIBLE_SHOT.drawFrac, impactMult: 1.5, material: 'crystal', trajectory: true });
        aimBow(st, IMPOSSIBLE_SHOT.yaw - 0.04, IMPOSSIBLE_SHOT.pitch - 0.035, 0);
      },
      drive(s, st) {
        const t = s + T0, r = st.sim.rig;
        if (t >= tGrab && t < tRel) {
          if (!r.held) st.grab();
          st.pull(BOW.MAX_DRAW * smooth(span(t, tGrab, 48.45)));
          const k = smooth(span(t, 47.95, 48.85)); st.aim(lerp(IMPOSSIBLE_SHOT.yaw - 0.04, IMPOSSIBLE_SHOT.yaw, k), lerp(IMPOSSIBLE_SHOT.pitch - 0.035, IMPOSSIBLE_SHOT.pitch, k));
        }
        if (t >= tRel && r.held) st.release();
      },
      build(d) {
        rel = tRel; if (d.impact) { I = d.impact.t; P = d.impact.p; } ringT = d.rings;
        this.map = rateMap(T0, 0, [[T0, 1], [I + T0 + 0.05, 0.3]]);
        (this as Shot & { tImp: number }).tImp = I + T0;
      },
      map: (t) => t - T0,
      camera(c) {
        const t = c.t, st = c.stage, tImp = (this as Shot & { tImp?: number }).tImp ?? 51.3;
        const path = geo.path, at = (k: number) => { const i = Math.min(path.length / 3 - 1, Math.max(0, Math.floor(k))) * 3; return new THREE.Vector3(path[i]!, path[i + 1]!, path[i + 2]!); };
        const nPath = path.length / 3, hitIdx = Math.round((ringT.length ? (tImp - rel) : 1.9) / PHYS_DT);
        if (t < 43.9) { // establishing: high and to the side, the three rings strung along the arc to the crystal
          const u = smooth(span(t, T0, 43.9));
          return pose(B.clone().add(new THREE.Vector3(13 - 3 * u, 9.5 - 2 * u, 17 - 3 * u)), at(hitIdx * 0.62).add(new THREE.Vector3(0, -2, 0)), 54);
        }
        if (t < tBack) { // fly the course: ring 1, 2, 3 on "teen rings", the target on "final target", then hold on it
          // path index of each ring: (its sim time - the release's sim time) / step
          const iR = (r: number) => Math.round(((ringT[r] ?? rel - T0 + 0.5 * (r + 1)) - (rel - T0)) / PHYS_DT);
          const k = pw([[43.9, 0], [tR1, iR(0) - 6], [tR1 + 0.42, iR(1) - 6], [tR1 + 0.84, iR(2) - 6], [tTarget + 0.15, hitIdx * 0.8], [tBack, hitIdx * 0.83]])(t);
          const p = at(k), q = at(k + 40);
          return pose(p.clone().add(new THREE.Vector3(5.5, 3.2, 0)), q.add(new THREE.Vector3(0, 0.5, 0)), 62);
        }
        if (t < tRel + 0.04) return gameView(st, 0.08, 4.2, 0.6, 0.8, 58);
        const ar = st.sim.arrows.find((a) => a.alive);
        if (ar && t < tImp - 0.03) { const p = v3(ar.p), dd = v3(ar.dir); return pose(p.clone().addScaledVector(dd, -5.2).add(new THREE.Vector3(1.1, 1.2, 0)), p.clone().addScaledVector(dd, 30), 64); }
        const Pv = v3(P), u = smooth(span(t, tImp, 53.0));
        return pose(Pv.clone().add(new THREE.Vector3(26 - 10 * u, 6 + 3 * u, 30 + 6 * u)), Pv.clone().add(new THREE.Vector3(0, 1, 0)), 60);
      },
      frame(c) {
        const o = c.o, t = c.t, tImp = (this as Shot & { tImp?: number }).tImp ?? 51.3;
        o.title('CHALLENGE:', 300, t, 42.25, 44.4, { size: 64, color: 'white' });
        o.title('THE IMPOSSIBLE SHOT', 390, t, 42.35, 44.4, { size: 86 });
        // callouts while flying the course
        geo.rings.forEach((r, i) => {
          const [x, y, ok] = c.project(r.c), at = tR1 + i * 0.42;
          if (ok && t < tBack) o.tag(`RING ${i + 1}`, x, y - 120, sat((t - at) / 0.2) * (1 - sat((t - tBack + 0.2) / 0.2)), { size: 30, col: '#9fd8ff' });
        });
        { const [x, y, ok] = c.project(v3(PLACEMENTS.crystal.p).add(new THREE.Vector3(0, 13, 0))); if (ok && t < tBack) o.tag('FINAL TARGET', x, y - 40, sat((t - tTarget) / 0.2) * (1 - sat((t - tBack + 0.2) / 0.2)), { size: 32 }); }
        cursorAt(c, [[tBack + 0.1, null], [tBack + 0.12, [820, 1250]], [tGrab, nockScreen(c), true], [tRel, nockScreen(c)], [tRel + 0.25, null]], t >= tGrab && t < tRel);
        // ring hits as they happen
        ringT.forEach((rt, i) => { const tt = rt + T0; o.tag(`RING ${i + 1} ✓`, 540, 470 + i * 0, t >= tt && t < tt + 0.42 ? 1 : 0, { size: 34, col: '#9fd8ff' }); });
        o.flash(t >= tImp ? Math.max(0, 0.5 * (1 - (t - tImp) / 0.18)) : 0, '200,235,255');
        o.title('PERFECT SHOT ✓', 330, t, tImp + 0.15, 52.95, { size: 96, color: 'sky', glow: 'rgba(110,210,255,0.85)' });
        o.tag('3 / 3 rings · target hit · challenge complete', 540, 440, sat((t - tImp - 0.4) / 0.3) * (1 - sat((t - 52.85) / 0.12)), { size: 26 });
      },
    };
    sh.audio = [[T0, 'cut'], [42.25, 'slam-soft'], [42.35, 'slam'], [tR1, 'tick'], [tR1 + 0.42, 'tick'], [tR1 + 0.84, 'tick'], [tTarget, 'slam-soft'], [tBack, 'cut']];
    shots.push(sh);
  }

  // ================= 6. THE CODE (53.0 - 61.0): the real source, the live app in a browser frame, CODE -> PHYSICS -> MAGIC
  {
    const T0 = 53.0, tGrab = 56.0, tRel = 56.95, tMagic = vo.word('code', 'experience').start;
    let I = 5.4, P: V3 = [0, 0, 0];
    const sh: Shot = {
      id: 'code', t0: T0, t1: 61.0, dryFor: 7.5,
      setup(st) { live({ ...DEFAULTS, mode: 'vajra', impactMult: 2.4, trajectory: true }); P = onMountain(st, [3, 10, -95]); const a = solveAim(P, 1, 'earth'); aimBow(st, a.yaw, a.pitch, 0); },
      drive(s, st) {
        const t = s + T0, r = st.sim.rig;
        if (t >= tGrab && t < tRel) { if (!r.held) st.grab(); st.pull(BOW.MAX_DRAW * smooth(span(t, tGrab, 56.7))); }
        if (t >= tRel && r.held) st.release();
      },
      build(d) { if (d.impact) { I = d.impact.t; P = d.impact.p; } this.map = rateMap(T0, 0, [[T0, 1], [I + T0 + 0.05, 0.45], [tMagic, 0.8]]); (this as Shot & { tImp: number }).tImp = I + T0; },
      map: (t) => t - T0,
      camera(c) {
        const t = c.t, st = c.stage, tImp = (this as Shot & { tImp?: number }).tImp ?? 58.3;
        const Pv = v3(P), { d, perp } = hdir(P);
        const inBrowser = gameView(st, 0.27, 9.5, 0.9, 1.4, 56, 60);
        if (t < tImp - 0.05) return inBrowser;
        // the impact inside the browser frame, then MAGIC: out of the frame, full screen, closer
        const back = d.clone().multiplyScalar(-1);
        const A = pose(Pv.clone().addScaledVector(back, 70).addScaledVector(perp, 30).add(new THREE.Vector3(0, 8, 0)), Pv, 56, 0.27);
        const Bp = pose(Pv.clone().addScaledVector(back, 46).addScaledVector(perp, 12).add(new THREE.Vector3(0, 4, 0)), Pv.clone().add(new THREE.Vector3(0, 2, 0)), 64, 0);
        return mix(A, Bp, smooth(span(t, tMagic - 0.1, 61.0)));
      },
      ui(c) {
        const t = c.t, st = c.stage, T = st.telemetry;
        c.ui.slide = 0; c.ui.sections = [];
        c.ui.statsK = smooth(span(t, 56.9, 57.3)) * (1 - smooth(span(t, tMagic - 0.2, tMagic + 0.2)));
        c.ui.stats = liveStats(st); void T;
      },
      frame(c) { /* drawn by the director's code reveal (it needs the source files) */ void c; },
    };
    sh.audio = [[T0, 'cut-digital'], [53.05, 'key'], [54.35, 'key'], [55.65, 'key'], [56.95, 'key'], [58.25, 'key'], [55.62, 'slam-soft'], [57.35, 'slam-soft'], [tMagic, 'slam'], [tMagic - 0.1, 'whoosh-out']];
    shots.push(sh);
  }

  // ================= 7. CTA (61.0 - 65.0): the bow above the clouds, the broken mountain behind
  {
    const T0 = 61.0;
    let P: V3 = [0, 0, 0];
    const sh: Shot = {
      id: 'cta', t0: T0, t1: 65.0, dryFor: 1,
      setup(st) { live({ ...DEFAULTS, mode: 'cosmic', impactMult: 3.2 }); P = onMountain(st, [-2, 8, -95]); const a = solveAim(P, 1, 'earth'); aimBow(st, a.yaw, a.pitch, 1); },
      drive(s, st) {
        const r = st.sim.rig;
        if (s >= 0.05 && s < 5 && r.held && st.sim.arrows.length === 0) st.release();
        // the next arrow nocked and drawn a little: the string glows
        if (s >= 6.2) { if (!r.held) st.grab(); st.pull(BOW.MAX_DRAW * 0.3 * smooth((s - 6.2) / 1.2)); st.aim(r.aimYaw * 0.4, 0.05); }
      },
      build() { this.map = rateMap(T0, 7.6, [[T0, 1]]); },
      map: (t) => t,
      camera(c) {
        const u = smooth(span(c.t, T0, 65.0)), st = c.stage;
        return pose(B.clone().add(new THREE.Vector3(lerp(1.05, 2.0, u), lerp(0.55, 1.15, u), lerp(3.4, 6.6, u))), B.clone().add(new THREE.Vector3(lerp(-0.35, -0.45, u), lerp(0.9, 1.4, u), -10)), lerp(54, 56, u), 0.06);
      },
      frame(c) {
        const o = c.o, t = c.t;
        o.title('WHAT SHOULD I', 300, t, 61.2, 65.2, { size: 92 });
        o.title('SIMULATE NEXT?', 400, t, 61.35, 65.2, { size: 92 });
        o.cta('COMMENT  ASTRA', 540, 1235, smooth(span(t, 62.3, 62.6)), t);
        o.tag('ASTRA.EXE · Ancient Legends, Modern Physics', 540, 520, smooth(span(t, 62.8, 63.2)), { size: 26, col: '#cfe0ff' });
      },
    };
    sh.audio = [[T0, 'cut'], [61.2, 'slam'], [61.35, 'slam-soft'], [62.3, 'cta'], [64.1, 'chime']];
    shots.push(sh);
  }
  return shots;
}

export { smooth, sat };
