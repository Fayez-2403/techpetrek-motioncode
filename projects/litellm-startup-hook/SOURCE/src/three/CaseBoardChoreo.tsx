// CASE BOARD choreography (board builder): boardAt(filmFrame) -> everything the board scene needs for that frame
// (camera, card poses, pins, strings, lamp, stamp, focus). A pure function of the frame and the timeline, so every
// move stretches with SCENE_TIMINGS.json. Beats: BEAT = 30 frames.
//   hook      close-up on the Railway card -> stamp slams on beat 2 (f30) -> whip pull-back (f60-104) -> the hub strings
//             snap taut from the Railway card one per beat -> hold on the whole board, lamp swinging
//   card k    [0, IN): previous card flies back to its place (0-17), camera rides low along the red string to card k
//             (10-34, light pulse running ahead), card k's pin pops, it lifts, flips up and fills the frame (30-48)
//   cta       checklist card flies back, the camera rises and pulls back over the whole web, strings glow in sequence
import * as THREE from 'three';
import { CARD_SEGS, IN, SEGS, segAt } from '../lib/timeline';
import { clamp, dampedSpring, easeInCubic, easeInOutCubic, easeInOutQuint, easeInOutSine, easeOutCubic, invLerp, lerp, spline } from '../lib/anim';
import { fitDistance, type V3 } from './stage';
import { BOARD_CARDS, BOARD_STRINGS, CH, CT, FLAT_DZ, NCARDS, STAMP, TACK_Z, Z_CARD, onCard, px2local, travelString } from './CaseBoardLayout';

// ---------------------------------------------------------------- vectors
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a: V3, s: number): V3 => [a[0] * s, a[1] * s, a[2] * s];
const len = (a: V3) => Math.hypot(a[0], a[1], a[2]);
const nrm = (a: V3): V3 => mul(a, 1 / (len(a) || 1));
const mix = (a: V3, b: V3, t: number): V3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

export interface CamPose { pos: V3; q: THREE.Quaternion; fov: number }
export interface Pose { p: V3; q: THREE.Quaternion }
const _m = new THREE.Matrix4(), _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3();
function look(pos: V3, target: V3, up: V3, fov: number): CamPose {
  _m.lookAt(_a.set(...pos), _b.set(...target), _c.set(...up));
  return { pos, q: new THREE.Quaternion().setFromRotationMatrix(_m), fov };
}
const rotV = (q: THREE.Quaternion, v: V3): V3 => { _a.set(...v).applyQuaternion(q); return [_a.x, _a.y, _a.z]; };
const fwdOf = (q: THREE.Quaternion) => rotV(q, [0, 0, -1]);
const upOf = (q: THREE.Quaternion) => rotV(q, [0, 1, 0]);
const quatZ = (a: number) => new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), a);

/** Catmull-Rom through camera keys (position + fov) and their orientations (normalised quaternion spline), u in [0,1] */
function camPath(keys: CamPose[], u: number): CamPose {
  const v = spline(keys.map((k) => [...k.pos, k.fov]), u);
  const qs: number[][] = [];
  let prev: THREE.Quaternion | null = null;
  for (const k of keys) {
    const q = k.q.clone();
    if (prev && prev.dot(q) < 0) q.set(-q.x, -q.y, -q.z, -q.w);
    qs.push([q.x, q.y, q.z, q.w]); prev = q;
  }
  const w = spline(qs, u);
  return { pos: [v[0], v[1], v[2]], q: new THREE.Quaternion(w[0], w[1], w[2], w[3]).normalize(), fov: v[3] };
}

// ---------------------------------------------------------------- key poses
const N: V3 = [0, 0, 1];
export const boardPose = (k: number): Pose => ({ p: [BOARD_CARDS[k].x, BOARD_CARDS[k].y, Z_CARD], q: quatZ(BOARD_CARDS[k].rot) });
/** card pose that exactly fills the frame of camera `c` (the unlit overlay plane at fitDistance) */
export function fillPose(c: CamPose): Pose {
  const D = fitDistance(CH, c.fov) + CT / 2 + FLAT_DZ;
  return { p: add(c.pos, mul(fwdOf(c.q), D)), q: c.q.clone() };
}

const FOV0 = 35, FOVF = 46, FOVR = 44, LIFT0 = 0.55;
/** the string the camera rides into card k: its two ends (k >= 1) */
const railEnds = (k: number): [V3, V3] => { const s = BOARD_STRINGS[travelString(k)]; return [s.pa, s.pb]; };
const dirInto = (k: number): V3 => { const [a, b] = railEnds(k); return nrm([b[0] - a[0], b[1] - a[1], 0]); };
/** camera at the hand-off of card k (constant while the 2D card is up) */
const FILLCAM: CamPose[] = BOARD_CARDS.map((c, k) => {
  if (k === 0) {
    const D = fitDistance(CH, FOV0) + CT / 2 + FLAT_DZ;   // straight-on lift for the first card (from the wide board)
    return look([c.x, c.y, LIFT0 + D], [c.x, c.y, LIFT0], [0, 1, 0], FOV0);
  }
  const b = railEnds(k)[1], d = dirInto(k), tl = -0.61;     // pitch: 35 deg down at the board
  const f: V3 = [d[0] * Math.cos(tl), d[1] * Math.cos(tl), Math.sin(tl)];
  const up: V3 = [-d[0] * Math.sin(tl), -d[1] * Math.sin(tl), Math.cos(tl)];
  const C: V3 = [b[0] + d[0] * 0.55 + (c.x - b[0]) * 0.4, b[1] + d[1] * 0.55 + (c.y - b[1]) * 0.4, (CH / 2) * Math.cos(tl) + 0.07];
  const D = fitDistance(CH, FOVF) + CT / 2 + FLAT_DZ;
  return look(sub(C, mul(f, D)), C, up, FOVF);
});

/** low camera riding along the string into card k, u = 0 at the previous tack, 1 at card k's tack */
function railCam(k: number, u: number): CamPose {
  const [a, b] = railEnds(k), ab = sub(b, a), d = dirInto(k), s: V3 = [-d[1], d[0], 0];
  const P = add(a, mul(ab, u));
  const pos = add(add(add(P, [0, 0, 0.22]), mul(s, -0.1)), mul(d, -0.3));
  // pitched ~27 deg down at the board so the frame is all board (no horizon), the string a glowing rail ahead;
  // over the second half of the ride the gaze swings toward the card waiting at the end of the string
  const pitch = 0.47, fr = nrm(add(mul(d, Math.cos(pitch)), mul(N, -Math.sin(pitch))));
  const B = BOARD_CARDS[k], fc = nrm(sub([B.x, B.y, 0], pos));
  const w = 0.55 * easeInOutCubic(invLerp(0.45, 1, u)), fm = nrm(mix(fr, fc, w));
  const zMax = -Math.sin(0.44), h = Math.hypot(fm[0], fm[1]) || 1;          // never lift the gaze above ~25 deg down (no horizon)
  const f: V3 = fm[2] <= zMax ? fm : [(fm[0] / h) * Math.cos(0.44), (fm[1] / h) * Math.cos(0.44), zMax];
  const up = nrm(add(add(mul(d, Math.sin(pitch)), mul(N, Math.cos(pitch))), mul(s, 0.1)));
  return look(pos, add(pos, f), up, FOVR);
}

// hook framing
const HOOK = SEGS.find((s) => s.id === 'hook') ?? SEGS[0];
const CTA = SEGS.find((s) => s.id === 'cta') ?? SEGS[SEGS.length - 1];
const R0 = BOARD_CARDS[0];
const [hx, hy] = px2local(600, 470);
const HEAD_PT = onCard(R0, hx, hy);                         // the headline, in focus at frame 0
const [ax, ay] = px2local(560, 560);
const AIM_CU = onCard(R0, ax, ay);
/** frame 0: macro on the Railway card under the lamp, card top edge + pin on the dark board above, headline mid-frame */
function closeCam(f: number): CamPose {
  const p = easeOutCubic(invLerp(0, 70, f));
  const yaw = 0.34 - 0.05 * p, pitch = -0.2 + 0.03 * p, dist = lerp(2.3, 2.16, p);
  const pos: V3 = [AIM_CU[0] + Math.sin(yaw) * Math.cos(pitch) * dist, AIM_CU[1] + Math.sin(pitch) * dist, AIM_CU[2] + Math.cos(yaw) * Math.cos(pitch) * dist];
  const roll = -0.075;
  return look(pos, AIM_CU, [Math.sin(roll), Math.cos(roll), 0], 38);
}
const WIDE_T: V3 = [0, 0.18, 0];
function wideCam(f: number): CamPose {
  const p = easeInOutSine(invLerp(104, HOOK.durationInFrames + IN * 0.5, f));
  return look([0.06 - 0.06 * p, 0.14 - 0.04 * p, 13.15 - 0.35 * p], [0.02, 0.12 - 0.03 * p, 0], [0, 1, 0], 35);
}
const PULL = [60, 104] as const;
function hookCam(f: number): CamPose {
  if (f <= PULL[0]) return closeCam(f);
  const A = closeCam(PULL[0]), B = wideCam(f);
  const w = easeInOutQuint(invLerp(PULL[0], PULL[1], f));
  // dolly: interpolate target, view direction and log-distance (feels like a real track back)
  const tA = AIM_CU, tB = WIDE_T, dA = sub(A.pos, tA), dB = sub(B.pos, tB);
  const tgt = mix(tA, tB, w), dir = nrm(mix(nrm(dA), nrm(dB), w)), dist = Math.exp(lerp(Math.log(len(dA)), Math.log(len(dB)), w));
  const q = A.q.clone().slerp(B.q, w);
  return { pos: add(tgt, mul(dir, dist)), q, fov: lerp(A.fov, B.fov, w) };
}
const HOOK_END = wideCam(HOOK.durationInFrames);
const APPROACH0 = look([R0.x + 0.18, R0.y - 0.35, 5.0], [R0.x, R0.y, 0.2], [0, 1, 0], 36);

function transCam(k: number, t: number): CamPose {
  const u = easeInOutSine(clamp(t / IN));
  if (k === 0) return camPath([HOOK_END, APPROACH0, FILLCAM[0]], u);
  return camPath([FILLCAM[k - 1], railCam(k, 0), railCam(k, 0.5), railCam(k, 0.86), FILLCAM[k]], u);
}

// CTA: rise off the board, frontal reveal of the whole web, then a slow grand pull-back (web settles in the top third)
const LAST = NCARDS - 1;
const CTA_KEYS = (() => {
  const c = BOARD_CARDS[LAST];
  return [
    FILLCAM[LAST],
    look([c.x + 0.5, c.y - 1.5, 3.0], [c.x - 0.4, c.y + 1.2, 0], [0, 1, 0], 40),
    look([0.05, -2.6, 19], [0.02, -2.3, 0], [0, 1, 0], 35),
    look([0, -9.0, 41], [0, -8.6, 0], [0, 1, 0], 35),
  ];
})();
function ctaCam(t: number): CamPose {
  const L = CTA.durationInFrames;
  const a = invLerp(0, 100, t);                               // rise + reveal
  if (t < 100) return camPath(CTA_KEYS.slice(0, 3), easeInOutSine(a));
  const b = easeInOutSine(invLerp(100, Math.max(160, L - 20), t));   // slow grand pull-back
  return camPath([CTA_KEYS[2], CTA_KEYS[3]], b);
}

// ---------------------------------------------------------------- strings
export interface StringState { draw: number; sag: number; vib: number; glow: number; pulse: number; pulseAmp: number }
const HUBS = BOARD_STRINGS.map((s, i) => ({ s, i })).filter((x) => x.s.kind === 'hub');
/** hub snap frames in the hook: one per beat from frame 120 (half beats if they don't fit) */
const SNAP: number[] = (() => {
  const n = HUBS.length, first = 120, last = Math.max(first, HOOK.durationInFrames - 75);
  const step = n <= 1 ? 30 : (last - first) / (n - 1) >= 30 ? 30 : 15;
  return HUBS.map((_, j) => first + j * step);
})();

// ---------------------------------------------------------------- per-frame state
export interface CardState { p: V3; q: THREE.Quaternion; flat: number; detail: number; lift: number; glow: number }
export interface PinState { p: V3; q: THREE.Quaternion; visible: boolean; s: number }
export interface Flash { p: V3; a: number; s: number }
export interface BoardState {
  frame: number; t: number;
  cam: { pos: V3; target: V3; up: V3; fov: number }; near: number;
  focus: number; dofK: number;
  cards: CardState[]; pins: PinState[]; strings: StringState[];
  lamp: { theta: number; sway: number };
  light: { wide: number; hot: number; amb: number };   // multipliers: the hook macro is lit by the hard hot spot only
  stamp: { ink: number; slam: number; shadow: number }; puff: number;   // puff = frames since the stamp hit (-1 = none)
  flashes: Flash[]; vignette: number; dust: number; beam: number;
}

const STAMP_F = 30;
/** pin pop path: tau 0 = pressed in, 1 = gone; pops out along the board normal and tumbles off sideways */
function pinPose(k: number, tau: number, side: V3): PinState {
  const c = BOARD_CARDS[k];
  const base: V3 = c.pin;
  const pop = Math.min(1, tau * 6);
  const p = add(add(base, [0, 0, 0.05 * pop + 1.4 * tau * tau]), mul(side, 0.9 * tau));
  const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(side[0], side[1], 0.3).normalize(), 5.5 * tau);
  return { p, q, visible: tau < 0.92, s: 1 };
}
const restPin = (k: number): PinState => ({ p: BOARD_CARDS[k].pin, q: new THREE.Quaternion(), visible: true, s: 1 });
/** a returning pin pops back in place (scale-in with a small press) instead of flying through the camera's path */
function pinIn(k: number, t: number, at: number): PinState {
  const e = (t - at) / 60;
  if (e <= 0) return { ...restPin(k), visible: false, s: 0 };
  const sc = dampedSpring(e, 24, 0.42);
  return { p: add(BOARD_CARDS[k].pin, [0, 0, 0.03 * Math.max(0, 1 - e * 8)]), q: new THREE.Quaternion(), visible: true, s: Math.max(0.001, sc) };
}

export function boardAt(frame: number): BoardState {
  const { seg, local } = segAt(frame);
  const kSeg = CARD_SEGS.indexOf(seg);
  const cards: CardState[] = BOARD_CARDS.map((_, k) => ({ ...boardPose(k), flat: 0, detail: 1, lift: 0, glow: 0 }));
  const pins: PinState[] = BOARD_CARDS.map((_, k) => restPin(k));
  const strings: StringState[] = BOARD_STRINGS.map(() => ({ draw: 0, sag: 0, vib: 0, glow: 0.16, pulse: -1, pulseAmp: 0 }));
  const flashes: Flash[] = [];
  let cam: CamPose, focus: number, dofK: number, near = 0.03;
  let stamp = { ink: 1, slam: 0, shadow: 0 }, puff = -1, vignette = 1, beam = 1;
  let light = { wide: 1, hot: 0.85, amb: 1 };

  // strings already established by this frame
  const segIndex = SEGS.indexOf(seg);
  BOARD_STRINGS.forEach((s, i) => {
    if (s.kind === 'hub') strings[i].draw = seg.id === 'hook' ? 0 : 1;
    else {
      const into = CARD_SEGS[s.b];                         // drawn during the transition into card b
      const fromIdx = into ? SEGS.indexOf(into) : 1e9;
      strings[i].draw = segIndex > fromIdx ? 1 : 0;
    }
  });

  if (seg.id === 'hook') {
    const f = local;
    cam = hookCam(f);
    // stamp: shadow of the stamp block closes in, ink on impact, tiny jolt
    stamp = { ink: f >= STAMP_F ? 1 : 0, slam: f >= STAMP_F ? Math.exp(-(f - STAMP_F) / 2.2) : 0, shadow: f < STAMP_F ? easeInCubic(invLerp(STAMP_F - 13, STAMP_F, f)) : 0 };
    puff = f >= STAMP_F ? f - STAMP_F : -1;
    if (f >= STAMP_F && f < STAMP_F + 16) {
      const j = 0.006 * Math.exp(-(f - STAMP_F) / 3) * Math.cos((f - STAMP_F) * 1.9);
      const up = upOf(cam.q), fw = fwdOf(cam.q);
      cam = { ...cam, pos: add(add(cam.pos, mul(up, j)), mul(fw, j * 0.8)) };
    }
    // hub strings: drawn slack from the Railway tack, snap taut on their beat
    HUBS.forEach(({ i }, j) => {
      const S = SNAP[j], st = strings[i];
      const dr = easeOutCubic(invLerp(S - 14, S - 2, f));
      st.draw = dr;
      if (f < S) { st.sag = 0.34 * dr; st.pulse = dr; st.pulseAmp = dr > 0 && dr < 1 ? 0.8 : 0; st.glow = 0.16 + 0.3 * dr; }
      else {
        const t = (f - S) / 60;
        st.sag = 0.34 * (1 - dampedSpring(t, 38, 0.18));
        st.vib = 0.022 * Math.exp(-t * 5) * Math.sin(t * 95);
        st.glow = 0.16 + 0.9 * Math.exp(-(f - S) / 9);
        if (f - S < 14) flashes.push({ p: add(HUBS[j].s.pb, [0, 0, 0.01]), a: Math.exp(-(f - S) / 4), s: 0.32 });
      }
    });
    // focus: headline, then a lagging rack to the whole board
    const wf = easeInOutCubic(invLerp(PULL[0] + 4, PULL[1] + 10, f));
    const camDist = len(sub(cam.pos, mix(HEAD_PT, WIDE_T, easeInOutCubic(invLerp(PULL[0], PULL[1], f)))));
    focus = lerp(len(sub(closeCam(Math.min(f, PULL[0])).pos, HEAD_PT)), camDist, wf);
    dofK = lerp(6.5, 0.12, easeInOutCubic(invLerp(PULL[0], PULL[1] + 8, f)));
    near = f < PULL[0] + 10 ? 0.05 : lerp(0.05, 1.0, invLerp(PULL[0] + 10, PULL[1], f));
    const lw = easeInOutCubic(invLerp(PULL[0], PULL[1], f));
    light = { wide: lerp(0.2, 1, lw), hot: lerp(1.1, 0.85, lw), amb: lerp(0.35, 1, lw) };
  } else if (kSeg >= 0) {
    const k = kSeg, t = Math.min(local, IN);
    cam = transCam(k, t);
    // previous card flies back to the board, its pin presses back in
    if (k > 0) {
      const F = fillPose(t < 1 ? FILLCAM[k - 1] : cam), B = boardPose(k - 1);
      const x = invLerp(5, 21, t), ep = easeInOutCubic(x), er = easeInOutCubic(invLerp(0.05, 1, x));
      const settle = t > 21 ? 0.004 * Math.exp(-(t - 21) / 2) * Math.sin((t - 21) * 1.6) : 0;
      cards[k - 1] = { p: add(add(mix(F.p, B.p, ep), mul(N, 0.24 * Math.sin(Math.PI * x) ** 2)), [0, 0, settle]), q: F.q.clone().slerp(B.q, er),
        flat: 1 - easeInOutCubic(invLerp(1, 8, t)), detail: easeInOutCubic(invLerp(4, 12, t)), lift: 1 - ep, glow: 1 - easeInOutCubic(invLerp(2, 15, t)) };
      pins[k - 1] = pinIn(k - 1, t, 19);
    }
    // card k: pin pops, card lifts, flips up and fills the frame
    {
      const F = fillPose(t >= IN ? FILLCAM[k] : cam), B = boardPose(k);
      const x = invLerp(30, 45.5, t);
      const ep = easeOutCubic(invLerp(0.05, 1, x)), er = easeInOutCubic(invLerp(0, 0.78, x));
      cards[k] = { p: add(mix(B.p, F.p, ep), mul(N, 0.3 * Math.sin(Math.PI * clamp(x * 1.3)))), q: B.q.clone().slerp(F.q, er),
        flat: easeInOutCubic(invLerp(39, 46.5, t)), detail: 1 - easeInOutCubic(invLerp(33, 43, t)), lift: ep, glow: easeInOutCubic(invLerp(30, 43, t)) };
      const side = k > 0 ? nrm([dirInto(k)[1], -dirInto(k)[0], 0]) : ([1, 0, 0] as V3);
      pins[k] = pinPose(k, easeInCubic(invLerp(29, 42, t)) * 0.96 + (t >= 42 ? 0.04 : 0), side);
      if (t >= 29 && t < 40) flashes.push({ p: [BOARD_CARDS[k].tack[0], BOARD_CARDS[k].tack[1], TACK_Z + 0.01], a: Math.exp(-(t - 29) / 4) * 0.9, s: 0.26 });
    }
    // the string we ride: drawn by a running light (chain) or pulsed (existing hub)
    if (k > 0) {
      const si = travelString(k);
      if (si >= 0) {
        const st = strings[si], p = easeInOutSine(invLerp(8, 33, t));
        if (BOARD_STRINGS[si].kind === 'chain') {
          st.draw = Math.max(0.0001, p);
          if (p > 0 && p < 1) flashes.push({ p: add(mix(BOARD_STRINGS[si].pa, BOARD_STRINGS[si].pb, p), [0, 0, 0.004]), a: 0.9, s: 0.09 });
        }
        st.pulse = p; st.pulseAmp = p > 0 && p < 1 ? 1 : 0;
        st.glow = 0.16 + 0.85 * Math.min(easeOutCubic(invLerp(4, 12, t)), 1 - easeInOutCubic(invLerp(32, 46, t)));
      }
    }
    const tg = add(cam.pos, mul(fwdOf(cam.q), 1));
    if (k === 0) {
      focus = len(sub(cam.pos, cards[0].p));
      dofK = lerp(0.12, 0.45, easeInOutCubic(invLerp(0, 30, t))) * (1 - easeInOutCubic(invLerp(34, 44, t)));
    } else {
      focus = t < 14 || t > 34 ? fitDistance(CH, cam.fov) : len(sub(cam.pos, tg)) * 1.1;
      dofK = 1.1 * Math.min(easeInOutCubic(invLerp(6, 16, t)), 1 - easeInOutCubic(invLerp(34, 44, t)));
    }
    near = k === 0 ? lerp(1.0, 0.05, invLerp(0, 30, t)) : 0.02;
    vignette = 1 - Math.max(cards[k].flat, k > 0 ? cards[k - 1].flat : 0);
  } else {
    // CTA
    const t = local;
    cam = ctaCam(t);
    const F = fillPose(t < 1 ? FILLCAM[LAST] : cam), B = boardPose(LAST);
    const x = invLerp(5, 24, t), ep = easeInOutCubic(x);
    cards[LAST] = { p: add(mix(F.p, B.p, ep), mul(N, 0.25 * Math.sin(Math.PI * x) ** 2)), q: F.q.clone().slerp(B.q, easeInOutCubic(invLerp(0.05, 1, x))),
      flat: 1 - easeInOutCubic(invLerp(1, 8, t)), detail: easeInOutCubic(invLerp(4, 12, t)), lift: 1 - ep, glow: 1 - easeInOutCubic(invLerp(2, 15, t)) };
    pins[LAST] = pinIn(LAST, t, 22);
    // strings glow one after another on the beats once the web is in view
    // one string per beat if they fit, else pairs on each beat (glints stay <= 2 per second)
    const n = BOARD_STRINGS.length, first = 60, span = Math.max(30, CTA.durationInFrames - 110 - first);
    const per = n <= 1 || span / (n - 1) >= 30 ? 1 : 2;
    BOARD_STRINGS.forEach((s, i) => {
      const G = first + Math.floor(i / per) * 30, st = strings[i];
      if (t >= G) {
        st.glow = 0.16 + 0.95 * Math.exp(-(t - G) / 14);
        const pp = invLerp(G, G + 18, t);
        if (pp < 1) { st.pulse = easeOutCubic(pp); st.pulseAmp = 1.2; }
        if (t - G < 10) flashes.push({ p: add(s.pb, [0, 0, 0.01]), a: 0.8 * Math.exp(-(t - G) / 4), s: 0.4 + 0.3 * invLerp(60, 200, t) });
      }
    });
    focus = len(sub(cam.pos, [0, -0.7, 0]));
    dofK = t < 30 ? lerp(0.9, 0.1, invLerp(0, 30, t)) : 0.06;
    near = lerp(0.03, 1.5, invLerp(0, 80, t));
    vignette = 1 - cards[LAST].flat;
  }

  // lamp: still until the stamp thump sets it swinging; settles through the CTA
  const settle = seg.id === 'cta' ? 1 - 0.85 * easeInOutSine(invLerp(0, CTA.durationInFrames, local)) : 1;
  const ff = frame - STAMP_F;
  const amp = ff < 0 ? 0 : (0.022 + 0.045 * Math.exp(-ff / 700)) * settle * (1 - Math.exp(-ff / 6));
  const theta = ff < 0 ? 0 : amp * Math.sin((2 * Math.PI * ff) / 150);
  const sway = ff < 0 ? 0 : amp * 0.35 * Math.sin((2 * Math.PI * ff) / 190 + 1.2);

  const fl = Math.max(...cards.map((c) => c.flat));
  const fw = fwdOf(cam.q);
  return {
    frame, t: frame / 60,
    cam: { pos: cam.pos, target: add(cam.pos, fw), up: upOf(cam.q), fov: cam.fov }, near,
    focus, dofK, cards, pins, strings, lamp: { theta, sway }, light, stamp, puff, flashes,
    vignette, dust: 1 - fl, beam,
  };
}

export const STAMP_HIT = STAMP_F;
export { STAMP };
