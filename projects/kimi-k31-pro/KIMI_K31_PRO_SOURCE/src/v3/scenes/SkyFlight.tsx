// V3 · GAME · SKY FLIGHT (4 bars = 240 frames at 120 BPM). Third-person flight-game footage, built from scratch:
// an original jet-glider dives out of a sunlit cloud layer on the drop, banks through a canyon of floating islands with
// waterfalls rolling on the beats, threads a floating stone ring on bar 3 (bullet-time orbit = the wow), then climbs
// through a gap in the clouds into the sun on bar 4. Everything is a pure function of the frame: the flight path is a
// spline in "game time" tau (slowed around the ring), the camera is a lagged chase cam blended with an orbit.
import React, { useMemo } from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import * as THREE from 'three';
import TL from '../timeline.json';
import { CamRig, project, ThreeStage } from '../../three/stage';
import { useLayout } from '../../lib/layout';
import { clamp, easeInOutCubic, easeOutCubic, invLerp, lerp, smoothStep, spline } from '../../lib/anim';
import { mulberry32 } from '../../lib/rng';
import { beatAt, V3Tag, type V3Props } from '../lib';
import {
  add, CloudPuffs, cross, dot, frameQuat, madd, makeIsland, mul, norm, placeLocal, Ribbons, rotAxis, SkyDome, SkyEnv, SunFlare, sub, Trees, vlen, vlerp, Waterfall,
  type Island, type P3, type Puff, type SkyLook, type Strip, type TreeInst,
} from '../three/SkyKit';
import { Glow, GLIDER, SkyGlider } from '../three/SkyGlider';

const LABEL = TL.shots.find((s) => s.id === 'skyFlight')!.label;
const Y: P3 = [0, 1, 0];
const TAU2 = Math.PI * 2;

// ------------------------------------------------------------------------------------------------ game time
// bullet time around the ring: the game clock runs at 25 % between frames 142 and 154
const rate = (f: number) => {
  if (f < 136 || f > 160) return 1;
  if (f < 142) return lerp(1, 0.25, smoothStep((f - 136) / 6));
  if (f < 154) return 0.25;
  return lerp(0.25, 1, smoothStep((f - 154) / 6));
};
const TT = (() => { const n = 260 * 4; const t = new Float64Array(n + 1); for (let i = 1; i <= n; i++) t[i] = t[i - 1] + 0.125 * (rate((i - 1) / 4) + rate(i / 4)); return t; })();
/** game time at real frame f (frames before 0 run at full speed) */
export const tauOf = (f: number) => {
  if (f <= 0) return f;
  const x = Math.min(f, 259) * 4, i = Math.floor(x), fr = x - i;
  return (TT[i] * (1 - fr) + TT[i + 1] * fr);
};
const fOfTau = (t: number) => {
  if (t <= 0) return t;
  let lo = 0, hi = 259;
  for (let k = 0; k < 30; k++) { const m = (lo + hi) / 2; if (tauOf(m) < t) lo = m; else hi = m; }
  return (lo + hi) / 2;
};

// ------------------------------------------------------------------------------------------------ flight path
// keyframes every 15 tau-frames from tau = -30 (shaped by hand: dive, pull-out, weave, ring, climb into the sun)
const K0: P3[] = [[-4, 96, 104], [-2, 77, 72], [0, 58, 40], [3, 40, 6], [6, 24, -30], [4, 11, -68], [-4, 5, -108], [-16, 2, -154], [-19, 0, -200],
  [-5, -2, -244], [10, 0, -286], [13, 2, -332], [7, 4, -376], [0, 9, -418], [8, 24, -448], [24, 46, -470], [44, 72, -486], [66, 100, -500], [90, 128, -512], [114, 156, -522]];
const KEYS: P3[] = K0.map(([x, y, z]) => [x * 0.85, 58 + (y - 58) * 0.85, 40 + (z - 40) * 0.76]);
const T0 = -30, DT = 15;
const pathAt = (t: number): P3 => spline(KEYS, (t - T0) / (DT * (KEYS.length - 1))) as P3;
const fwdAt = (t: number): P3 => norm(sub(pathAt(t + 0.5), pathAt(t - 0.5)));
const upOrtho = (F: P3): P3 => norm(madd(Y, F, -dot(Y, F)));
const rightOf = (F: P3): P3 => norm(cross(F, Y));
const bankRaw = (t: number) => {
  const a = mul(add(sub(pathAt(t + 3), mul(pathAt(t), 2)), pathAt(t - 3)), 1 / 9);
  return dot(a, rightOf(fwdAt(t))) * 13;
};
const bankAt = (t: number) => { let s = 0; for (let k = -3; k <= 3; k++) s += bankRaw(t + k * 2); return clamp(s / 7, -1.25, 1.25); };

/** rolls on the beats (radians, + = right wing down): dive roll on beat 3, barrel roll on bar 2, knife-edge through the ring, two climb rolls */
const rollKey = (f: number) =>
  TAU2 * easeInOutCubic(invLerp(30, 42, f)) +
  TAU2 * easeInOutCubic(invLerp(60, 74, f)) +
  (Math.PI / 2) * easeInOutCubic(invLerp(132, 146, f)) + ((3 * Math.PI) / 2) * easeInOutCubic(invLerp(156, 170, f)) +
  TAU2 * easeInOutCubic(invLerp(181, 195, f)) -
  TAU2 * easeInOutCubic(invLerp(210, 224, f));
const knifeW = (f: number) => smoothStep(invLerp(128, 140, f)) * (1 - smoothStep(invLerp(160, 172, f)));

function craftAt(t: number, f: number) {
  const P = pathAt(t), F = fwdAt(t);
  const roll = bankAt(t) * (1 - knifeW(f)) + rollKey(f);
  const U = rotAxis(upOrtho(F), F, roll);
  const R = norm(cross(F, U));
  return { P, F, U, R, q: frameQuat(F, U) };
}
const toWorld = (c: ReturnType<typeof craftAt>, l: P3): P3 => add(add(add(c.P, mul(c.R, l[0])), mul(c.U, l[1])), mul(c.F, -l[2]));

// ------------------------------------------------------------------------------------------------ look
// the sun sits on the bar-4 climb line, so the craft climbs straight into it
const SUN: P3 = norm(add(norm(sub(pathAt(232), pathAt(214))), [0, 0.05, 0]));
const HOLE_T = 214;
const HOLE = pathAt(HOLE_T);
const LOOK: SkyLook = {
  sun: SUN, zenith: '#1258D6', horizon: '#9CCBFF', low: '#D4E6FA', sunColor: '#FFE2B4', sunI: 1.0, haze: '#BFDCF7', hazeDist: 900,
  slabs: [
    { y0: 68, y1: 104, cov: 0.45, scale: 1 / 560, off: [0.13, 0.41], density: 0.12, lit: '#FFF1DA', litK: 1.6, shade: '#C2BCD6', hole: [HOLE[0], HOLE[2], 115] },
    { y0: -160, y1: -118, cov: 0.3, scale: 1 / 760, off: [0.6, 0.2], density: 0.1, lit: '#FFFFFF', litK: 1.45, shade: '#86A0CC' },
  ],
};
const PUFF = { sun: SUN, lit: '#FFF6EA', litK: 1.45, shade: '#A3B4D2', haze: '#BFDCF7', hazeDist: 900, near: [2, 9] as [number, number] };

// ------------------------------------------------------------------------------------------------ the ring arch
const RING_T = tauOf(150); // the craft threads the ring on beat 3 of bar 3
function ringGeo(seed: number, R: number, r: number) {
  const rnd = mulberry32(seed);
  const ph = Array.from({ length: 8 }, () => rnd() * TAU2);
  const NU = 60, NV = 11, pos: number[] = [], idx: number[] = [];
  for (let i = 0; i < NU; i++) for (let j = 0; j < NV; j++) {
    const u = (i / NU) * TAU2, v = (j / NV) * TAU2;
    const Ru = R * (1 + 0.06 * Math.sin(2 * u + ph[5]) + 0.04 * Math.sin(3 * u + ph[6]));
    const bump = (1 + 0.16 * Math.sin(3 * u + ph[0]) + 0.12 * Math.sin(7 * u + 2 * v + ph[1]) + 0.08 * Math.sin(11 * u - 3 * v + ph[2]) + 0.06 * Math.sin(4 * v + ph[3])) * (1 + (rnd() - 0.5) * 0.16);
    const rr = r * bump * (1 + 0.45 * Math.max(0, -Math.sin(u)) ** 2);
    const n1: P3 = [Math.cos(u), Math.sin(u), 0];
    pos.push(n1[0] * Ru + n1[0] * Math.cos(v) * rr, n1[1] * Ru + n1[1] * Math.cos(v) * rr, Math.sin(v) * rr * 1.25);
  }
  for (let i = 0; i < NU; i++) for (let j = 0; j < NV; j++) {
    const a = i * NV + j, b = ((i + 1) % NU) * NV + j, c = i * NV + ((j + 1) % NV), d = ((i + 1) % NU) * NV + ((j + 1) % NV);
    idx.push(a, b, c, b, d, c);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  const nrm = g.attributes.normal as THREE.BufferAttribute, col: number[] = [];
  const rockA = new THREE.Color('#D2A679'), rockB = new THREE.Color('#9C7253'), grass = new THREE.Color('#5FAE3C'), moss = new THREE.Color('#4B8F37');
  for (let i = 0; i < nrm.count; i++) {
    const y = pos[i * 3 + 1], ny = nrm.getY(i);
    const c = rockA.clone().lerp(rockB, 0.5 + 0.5 * Math.sin(y * 0.9 + 0.7 * Math.sin(pos[i * 3] * 0.3)));
    if (ny > 0.5 && y > 0) c.lerp(grass, smoothStep(invLerp(0.5, 0.75, ny)));
    else if (ny > 0.3) c.lerp(moss, 0.4 * smoothStep(invLerp(0.3, 0.5, ny)));
    if (ny < -0.5) c.multiplyScalar(0.85);
    col.push(c.r, c.g, c.b);
  }
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  return g;
}
const RING_R = 9.6, RING_r = 2.7;

/** the ring's own waterfall spills off its upper-right shoulder */
const RING_FALL = (() => {
  const c = pathAt(RING_T), q = frameQuat(fwdAt(RING_T), Y), Q = new THREE.Quaternion(q[0], q[1], q[2], q[3]);
  const a = 0.95, l = new THREE.Vector3(Math.cos(a) * (RING_R + RING_r * 0.9), Math.sin(a) * (RING_R + RING_r * 0.9), 0).applyQuaternion(Q);
  const top: P3 = [c[0] + l.x, c[1] + l.y, c[2] + l.z];
  return { top, out: norm([l.x, 0, l.z]) };
})();

// ------------------------------------------------------------------------------------------------ world (built once)
interface Placed { isl: Island; at: P3; yaw: number }
interface Fall { top: P3; out: P3; width: number; drop: number }
function buildWorld() {
  const rnd = mulberry32(31337);
  const islands: Placed[] = [], falls: Fall[] = [], trees: TreeInst[] = [], puffs: Puff[] = [];
  const samples: P3[] = [];
  for (let t = -24; t <= 252; t += 1.5) samples.push(pathAt(t));
  const ringC = pathAt(RING_T);
  const clear = (c: P3, r: number, depth: number, m: number) => {
    if (vlen(sub(c, ringC)) < r + 24) return false;
    return samples.every((S) => {
      if (S[1] > c[1] + 0.16 * r + m || S[1] < c[1] - depth - m) return true;
      const v = clamp((c[1] - S[1]) / depth, 0, 1), rr = r * 1.18 * (1 - v) ** 1.45;
      return Math.hypot(S[0] - c[0], S[2] - c[2]) > rr + m;
    });
  };
  const apart = (c: P3, r: number) => islands.every((o) => Math.hypot(o.at[0] - c[0], o.at[2] - c[2]) > (o.isl.r + r) * 1.05 || Math.abs(o.at[1] - c[1]) > Math.max(o.isl.depth, r * 2));
  const put = (c: P3, r: number, depth: number, seed: number, nFall: number, faceT?: number) => {
    const isl = makeIsland({ seed, r, depth, hill: 0.8 + rnd() * 0.6 });
    const yaw = rnd() * TAU2;
    islands.push({ isl, at: c, yaw });
    isl.trees.forEach((tr) => trees.push({ ...tr, p: placeLocal(tr.p, c, yaw) }));
    for (let k = 0; k < nFall; k++) {
      let thw = rnd() * TAU2;
      if (faceT !== undefined && k === 0) { const P = pathAt(faceT); thw = Math.atan2(P[2] - c[2], P[0] - c[0]) + (rnd() - 0.5) * 0.6; }
      const dx = Math.cos(thw), dz = Math.sin(thw), c0 = Math.cos(yaw), s0 = Math.sin(yaw);
      const thl = Math.atan2(dx * s0 + dz * c0, dx * c0 - dz * s0);
      const top = placeLocal(isl.rim(thl), c, yaw);
      const out = norm(sub([top[0], c[1], top[2]], c));
      const width = r * (0.1 + rnd() * 0.06), drop = depth * (1.2 + rnd() * 0.6);
      falls.push({ top: madd(top, out, -0.4), out, width, drop });
      for (let m = 0; m < 3; m++) {
        const d = drop * (0.55 + 0.18 * m);
        puffs.push({ p: add(madd(top, out, 1.2 * Math.sqrt(d) + 1), [0, -d, 0]), s: width * (1.4 + m * 0.7), seed: rnd(), a: 0.32 - m * 0.07 });
      }
      puffs.push({ p: madd(add(top, [0, -1.5, 0]), out, 1.5), s: width * 1.3, seed: rnd(), a: 0.45 });
    }
  };
  // hero islands: the waterfall giant of the dive, the near-miss on bar 2
  {
    const P = pathAt(28), R = rightOf(fwdAt(28));
    put(add(madd(P, R, -42), [0, -20, -8]), 30, 52, 101, 2, 26);
    const P2 = pathAt(38), R2 = rightOf(fwdAt(38));
    put(add(madd(P2, R2, 40), [0, -6, -14]), 22, 40, 102, 1, 40);
    const P3_ = pathAt(96), R3 = rightOf(fwdAt(96));
    put(add(madd(P3_, R3, -24), [0, 5, 0]), 15, 34, 103, 1, 96);
    const P4 = pathAt(118), R4 = rightOf(fwdAt(118));
    put(add(madd(P4, R4, 30), [0, -10, 0]), 20, 42, 104, 1, 120);
  }
  // the canyon
  for (let t = -8; t < 238; t += 6.5) {
    for (const side of [-1, 1]) {
      if (rnd() < 0.38) continue;
      const P = pathAt(t), F = fwdAt(t), R = rightOf(F);
      const r = 8 + rnd() * 20, lat = r + 16 + rnd() * 40, depth = r * (1.3 + rnd() * 1.0);
      const c = add(madd(madd(P, R, side * lat), F, (rnd() - 0.5) * 12), [0, -14 + (rnd() - 0.55) * 44, 0]);
      if (!clear(c, r, depth, 11) || !apart(c, r)) continue;
      put(c, r, depth, 200 + islands.length, r > 15 && rnd() < 0.45 ? 1 : 0);
    }
  }
  // giants far out for scale
  for (let k = 0; k < 12; k++) {
    const t = -10 + k * 21 + rnd() * 10, P = pathAt(t), R = rightOf(fwdAt(t)), side = k % 2 ? 1 : -1;
    const r = 45 + rnd() * 55, c = add(madd(P, R, side * (140 + rnd() * 170)), [0, -30 + rnd() * 50, 0]);
    if (!apart(c, r)) continue;
    put(c, r, r * (1.3 + rnd() * 0.6), 400 + k, rnd() < 0.5 ? 1 : 0);
  }
  // small cumulus clusters drifting in the canyon
  for (let k = 0; k < 30; k++) {
    const t = rnd() * 236, P = pathAt(t), R = rightOf(fwdAt(t)), side = rnd() < 0.5 ? -1 : 1;
    const c = add(madd(P, R, side * (30 + rnd() * 80)), [0, -30 + rnd() * 40, 0]);
    const n = 3 + Math.floor(rnd() * 3), sz = 5 + rnd() * 7;
    for (let m = 0; m < n; m++) puffs.push({ p: add(c, [(rnd() - 0.5) * sz * 2.2, (rnd() - 0.3) * sz * 0.7, (rnd() - 0.5) * sz * 2.2]), s: sz * (0.7 + rnd() * 0.6), seed: rnd(), a: 0.85 });
  }
  // the cloud base the craft bursts out of, and the walls of the gap it climbs through
  for (let k = 0; k < 26; k++) {
    const t = -16 + rnd() * 22, P = pathAt(t), R = rightOf(fwdAt(t)), side = rnd() < 0.5 ? -1 : 1;
    const p = add(madd(P, R, side * (6 + rnd() * 16)), [0, 7 + rnd() * 9, 0]);
    puffs.push({ p, s: 5 + rnd() * 7, seed: rnd(), a: 0.55 });
  }
  for (let k = 0; k < 40; k++) {
    const t = 196 + rnd() * 40, P = pathAt(t), F = fwdAt(t), R = rightOf(F), U = upOrtho(F), a = rnd() * TAU2, rad = 9 + rnd() * 18;
    puffs.push({ p: madd(madd(P, R, Math.cos(a) * rad), U, Math.sin(a) * rad), s: 7 + rnd() * 10, seed: rnd(), a: 0.7 });
  }
  // speed streaks tied to the path
  const streaks = Array.from({ length: 240 }, () => ({ t: -8 + rnd() * 252, a: rnd() * TAU2, rad: 2.2 + rnd() * 9, len: 0.7 + rnd() * 0.7, w: 0.02 + rnd() * 0.03 }));
  // a few pines on the ring's crown
  {
    const c = pathAt(RING_T), q = frameQuat(fwdAt(RING_T), Y), Q = new THREE.Quaternion(q[0], q[1], q[2], q[3]);
    [1.25, 1.42, 1.6, 1.78, 1.95].forEach((u, k) => {
      const l = new THREE.Vector3(Math.cos(u) * (RING_R + RING_r * 0.95), Math.sin(u) * (RING_R + RING_r * 0.95) - 0.3, (k % 2 ? 0.8 : -0.9)).applyQuaternion(Q);
      trees.push({ p: [c[0] + l.x, c[1] + l.y, c[2] + l.z], s: 1.0 + 0.3 * (k % 3), kind: k % 2 ? 1 : 0, tint: 0.2 * k });
    });
  }
  return { islands, falls, trees, puffs, streaks, ring: ringGeo(77, RING_R, RING_r) };
}

// ------------------------------------------------------------------------------------------------ camera
const kick = (f: number, at: number, amt: number) => (f < at ? 0 : amt * Math.exp(-(f - at) / 10) * (1 - Math.exp(-(f - at) / 1.6)));
function cameraAt(f: number) {
  const t = tauOf(f);
  const P = pathAt(t), F = fwdAt(t), Fl = fwdAt(t - 6);
  const climb = smoothStep(invLerp(166, 192, f));
  const open = 1 - easeOutCubic(invLerp(0, 22, f));
  const camRoll = 0.5 * bankAt(t - 4) * (1 - knifeW(f) * 0.85);
  const Uc = rotAxis(upOrtho(Fl), Fl, camRoll);
  // the thread: on the bar-3 burst the camera drops back and out to a 3/4-rear view so the whole ring hole frames the
  // knife-edge craft in bullet time; it then passes through the ring itself as the speed comes back
  const ring = smoothStep(invLerp(122, 140, f)) * (1 - smoothStep(invLerp(158, 172, f)));
  const back = lerp(9.6, 11.5, climb) - open * 1.5 + 8.5 * ring;
  const side = 3.4 * ring, upOff = lerp(2.3, -0.2, climb) + open * 0.6 - 1.2 * ring;
  const R = rightOf(Fl);
  const pos = madd(madd(madd(P, Fl, -back), Uc, upOff), R, -side);
  // bar 1 looks a little above the dive line so the horizon and sky stay in frame
  const target = add(madd(madd(P, F, lerp(14, 6, ring)), Uc, lerp(0.9, 0.2, climb)), [0, 5 * (1 - smoothStep(invLerp(26, 56, f))), 0]);
  const up = Uc;
  const fov = 60 + 12 * open + kick(f, 60, 13) + kick(f, 120, 10) + kick(f, 160, 12) + kick(f, 181, 8) - 5 * ring;
  return { pos, target, up, fov, t, w: ring };
}

// ------------------------------------------------------------------------------------------------ scene
const Flight: React.FC<{ f: number }> = ({ f }) => {
  const W = useMemo(buildWorld, []);
  const islandMat = useMemo(() => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, metalness: 0, envMapIntensity: 0.55, flatShading: true }), []);
  const cam = cameraAt(f);
  const t = cam.t;
  const craft = craftAt(t, f);
  const b = beatAt(f);
  const boost = clamp(0.35 + 0.5 * (1 - invLerp(0, 30, f)) + kick(f, 60, 1.3) + kick(f, 120, 1.4) + kick(f, 158, 1.1) + 0.35 * smoothStep(invLerp(170, 190, f)), 0, 1.6);
  const speed = vlen(sub(pathAt(t + 0.5), pathAt(t - 0.5))) * (tauOf(f + 0.5) - tauOf(f - 0.5)); // units per real frame

  // contrails: wingtip vapour (thick in hard turns and the climb) + cyan engine heat
  const strips: Strip[] = [], heat: Strip[] = [];
  {
    const NT = 46, dtk = 0.55;
    const tips: P3[][] = [[], []], noz: P3[][] = [[], []], wa: number[] = [], aa: number[] = [], wh: number[] = [], ah: number[] = [];
    for (let k = 0; k < NT; k++) {
      const tk = t - k * dtk, c = craftAt(tk, fOfTau(tk));
      tips[0].push(toWorld(c, GLIDER.tipR)); tips[1].push(toWorld(c, GLIDER.tipL));
      const g = clamp(Math.abs(bankRaw(tk)) * 0.9, 0, 1);
      const vapor = 0.22 + 0.55 * g + 0.4 * smoothStep(invLerp(170, 190, fOfTau(tk)));
      const u = k / (NT - 1);
      wa.push(0.04 + 0.36 * u); aa.push(clamp(vapor, 0, 0.8) * (1 - u) ** 1.8 * smoothStep(invLerp(0, 3, k)));
      if (k < 14) {
        noz[0].push(toWorld(c, GLIDER.nozR)); noz[1].push(toWorld(c, GLIDER.nozL));
        wh.push(0.2 + 0.5 * u); ah.push((0.14 + 0.2 * boost) * (1 - k / 13) ** 1.6);
      }
    }
    for (const s of tips) strips.push({ pts: s, w: wa, a: aa, col: [0.96, 0.98, 1.0] });
    for (const s of noz) heat.push({ pts: s, w: wh, a: ah, col: [0.45, 0.9, 1.0] });
  }
  // speed streaks near the camera
  const camF = norm(sub(cam.target, cam.pos));
  const streaks: Strip[] = [];
  const sk = clamp(0.45 + 0.6 * boost, 0, 1.3) * (1 - 0.5 * cam.w);
  for (const s of W.streaks) {
    if (s.t < t - 8 || s.t > t + 26) continue;
    const P = pathAt(s.t), F = fwdAt(s.t), R = rightOf(F), U = upOrtho(F);
    const p = madd(madd(P, R, Math.cos(s.a) * s.rad), U, Math.sin(s.a) * s.rad);
    const d = dot(sub(p, cam.pos), camF);
    if (d < 0.6 || d > 48) continue;
    const a = 0.42 * sk * smoothStep(invLerp(0.6, 5, d)) * (1 - smoothStep(invLerp(26, 48, d)));
    streaks.push({ pts: [p, madd(p, F, -speed * 3.2 * s.len)], w: s.w, a, col: [1, 1, 1] });
  }
  // ring + checkpoint hologram
  const rc = pathAt(RING_T), rF = fwdAt(RING_T);
  const ringQ = frameQuat(rF, Y);
  const passed = invLerp(150, 166, f);
  const holo = (1 - passed) * (0.55 + 0.45 * b.pulse);
  return (
    <>
      <CamRig pos={cam.pos} target={cam.target} fov={cam.fov} up={cam.up} />
      <SkyEnv look={LOOK} intensity={0.6} />
      <fogExp2 attach="fog" args={['#BFDCF7', 0.0014]} />
      <SkyDome look={LOOK} cam={cam.pos} />
      <hemisphereLight args={['#A9D2FF', '#D9C9B0', 0.42]} />
      <directionalLight position={mul(SUN, 200)} intensity={3.7} color="#FFEBD0" />
      {W.islands.map((o, i) => <mesh key={i} geometry={o.isl.geo} material={islandMat} position={o.at} rotation={[0, o.yaw, 0]} />)}
      <Trees items={W.trees} />
      {W.falls.map((w, i) => <Waterfall key={i} top={w.top} out={w.out} width={w.width} drop={w.drop} time={t / 30} haze="#BFDCF7" hazeDist={900} />)}
      <group position={rc} quaternion={ringQ}>
        <mesh geometry={W.ring} material={islandMat} />
        {holo > 0.01 && (
          <>
            <mesh scale={1 + 0.7 * easeOutCubic(passed)}>
              <torusGeometry args={[5.4, 0.06, 8, 96]} />
              <meshBasicMaterial color="#9FF4FF" transparent opacity={holo} toneMapped={false} blending={THREE.AdditiveBlending} depthWrite={false} />
            </mesh>
            <mesh scale={1 + 0.7 * easeOutCubic(passed)}>
              <torusGeometry args={[5.4, 0.4, 8, 96]} />
              <meshBasicMaterial color="#3FD8FF" transparent opacity={holo * 0.22} toneMapped={false} blending={THREE.AdditiveBlending} depthWrite={false} />
            </mesh>
          </>
        )}
      </group>
      <Waterfall top={RING_FALL.top} out={RING_FALL.out} width={1.7} drop={64} time={t / 30} haze="#BFDCF7" hazeDist={900} />
      <CloudPuffs puffs={W.puffs} cam={cam.pos} look={PUFF} />
      <group position={craft.P} quaternion={craft.q}>
        <SkyGlider boost={boost} strobe={b.pulse} />
      </group>
      <Ribbons strips={strips} cam={cam.pos} mode="alpha" soft={2.4} renderOrder={18} nearFade={[3, 9]} />
      <Ribbons strips={[...heat, ...streaks]} cam={cam.pos} mode="add" soft={2.0} renderOrder={22} nearFade={[1, 4]} />
      <Glow p={madd(cam.pos, SUN, 900)} s={420} color="#FFE9C8" a={0.35} />
    </>
  );
};

export const SkyFlight: React.FC<V3Props> = ({ dur }) => {
  const f = useCurrentFrame();
  const { w, h } = useLayout();
  const cam = cameraAt(f);
  const camF = norm(sub(cam.target, cam.pos));
  const facing = dot(camF, SUN);
  const [sx, sy, vis] = project(madd(cam.pos, SUN, 1000), { pos: cam.pos, target: cam.target, fov: cam.fov, up: cam.up }, w, h);
  const inCloud = 1 - smoothStep(invLerp(2, 12, f));
  const flareK = vis ? smoothStep(invLerp(0.55, 0.95, facing)) * (0.55 + 0.6 * smoothStep(invLerp(196, 236, f))) * (1 - inCloud) : 0;
  const white = 0.16 * inCloud;
  const flash = 0.2 * Math.exp(-Math.max(0, f - 60) / 3) * (f >= 60 ? 1 : 0) + 0.2 * Math.exp(-Math.max(0, f - 120) / 3) * (f >= 120 ? 1 : 0) + 0.28 * Math.exp(-Math.max(0, f - 160) / 4) * (f >= 160 ? 1 : 0);
  const outro = 0.6 * smoothStep(invLerp(dur - 10, dur - 1, f));
  // god rays from the sun while the craft climbs into it (bar 4)
  const rays = vis ? 0.55 * smoothStep(invLerp(186, 214, f)) * smoothStep(invLerp(0.6, 0.95, facing)) : 0;
  return (
    <AbsoluteFill style={{ background: '#9CC8F0', overflow: 'hidden' }}>
      <ThreeStage exposure={1.05}>
        <Flight f={f} />
      </ThreeStage>
      <SunFlare x={sx} y={sy} k={flareK * 1.1} w={w} h={h} />
      {rays > 0.01 && (
        <AbsoluteFill style={{ pointerEvents: 'none', mixBlendMode: 'screen', opacity: rays,
          background: `repeating-conic-gradient(from ${f * 0.35}deg at ${sx}px ${sy}px, rgba(255,236,196,0.55) 0deg 1.6deg, rgba(255,236,196,0) 3.4deg 7.5deg)`,
          WebkitMaskImage: `radial-gradient(circle at ${sx}px ${sy}px, rgba(0,0,0,1) 0px, rgba(0,0,0,0.5) 420px, rgba(0,0,0,0) 1100px)`,
          maskImage: `radial-gradient(circle at ${sx}px ${sy}px, rgba(0,0,0,1) 0px, rgba(0,0,0,0.5) 420px, rgba(0,0,0,0) 1100px)` }} />
      )}
      <AbsoluteFill style={{ pointerEvents: 'none', background: `radial-gradient(70% 70% at 50% 40%, rgba(255,250,240,${white}) 0%, rgba(240,246,255,${white * 0.8}) 100%)` }} />
      <AbsoluteFill style={{ pointerEvents: 'none', background: `rgba(255,252,244,${flash})` }} />
      <AbsoluteFill style={{ pointerEvents: 'none', background: `radial-gradient(60% 60% at ${(sx / w) * 100}% ${(sy / h) * 100}%, rgba(255,246,226,${0.95 * outro}) 0%, rgba(255,236,206,${0.75 * outro}) 60%, rgba(255,230,200,${0.55 * outro}) 100%)` }} />
      <AbsoluteFill style={{ pointerEvents: 'none', background: 'radial-gradient(120% 95% at 50% 50%, rgba(0,0,0,0) 62%, rgba(10,24,52,0.28) 100%)' }} />
      <V3Tag label={LABEL} />
    </AbsoluteFill>
  );
};
