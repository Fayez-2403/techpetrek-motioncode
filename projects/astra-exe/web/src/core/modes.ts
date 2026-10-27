// What an arrow does when it lands. One energy model for all four modes:
//   E (fantasy J) = arrow kinetic energy at impact x CELESTIAL_GAIN x mode gain x impact multiplier
//   flux at a piece r away = E / (4 pi r^2); a piece breaks off where flux x radius^2 > its material's toughness
//   (r* = sqrt(E / (4 pi T)) is the break radius), and gets kinetic energy eta x flux x its cross-section.
// The modes then differ in timing and in the force fields they leave behind. The rigid-body motion that follows
// is Rapier's; glow, heat colour, lightning and the "time slow" are visual (see the view and the live clock).
import { CELESTIAL_GAIN, MODES, type ModeId } from './config';
import { PieceState, type Destructible, type V3 } from './destructible';
import { hashi, clamp } from './noise';

export interface ImpactInfo {
  E: number; rStar: number; broken: number; heated: number; cracked: number;
  /** For the view: shockwave radius, field centre and duration. */
  fx: { radius: number; centre: V3; until: number };
}

export interface Vortex { c: V3; R: number; t0: number; dur: number; strength: number }

export interface ModeContext {
  t: number; mult: number;
  /** Request a visual time slow on the live clock (depth = speed factor, hold and ease in seconds). */
  slow: (depth: number, hold: number, ease: number) => void;
  addVortex: (v: Vortex) => void;
}

const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const len = (a: V3) => Math.hypot(a[0], a[1], a[2]);
const norm = (a: V3): V3 => { const l = len(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };

/** Spin for a piece pushed at speed v: about a hashed axis, faster for small pieces. */
function spin(i: number, salt: number, v: number, rad: number): V3 {
  const ax = norm([hashi(i, salt, 1) - 0.5, hashi(i, salt, 2) - 0.5, hashi(i, salt, 3) - 0.5]);
  const w = clamp((v / Math.max(1, rad)) * (0.25 + 0.5 * hashi(i, salt, 4)), 0, 6);
  return [ax[0] * w, ax[1] * w, ax[2] * w];
}

export function impact(d: Destructible, modeId: ModeId, hitChunk: number, p: V3, n: V3, dir: V3, ke: number, ctx: ModeContext): ImpactInfo {
  const M = MODES[modeId], mat = d.mat, t = ctx.t;
  const E = ke * CELESTIAL_GAIN * M.gain * ctx.mult;
  const rStar = Math.sqrt(E / (4 * Math.PI * mat.toughness));
  const ch = d.fr.chunks;
  let broken = 0, heated = 0, cracked = 0;
  const out = (i: number, scale: number, follow: number, lift = 0): V3 => {
    const c = d.centre(i), rel = sub(c, p), r = Math.max(len(rel) - 0.35 * ch[i]!.rad, 0.8);
    const flux = E / (4 * Math.PI * r * r);
    const A = 1.2 * Math.pow(ch[i]!.vol, 2 / 3);
    const v = clamp(Math.sqrt((2 * mat.eta * flux * A * scale) / d.mass[i]!), 0, 55);
    const u = norm([rel[0] / (len(rel) || 1) + dir[0] * follow + n[0] * 0.25, rel[1] / (len(rel) || 1) + dir[1] * follow + n[1] * 0.25 + lift, rel[2] / (len(rel) || 1) + dir[2] * follow + n[2] * 0.25]);
    return [u[0] * v, u[1] * v, u[2] * v];
  };
  /** Distance from the hit to a piece's nearest side (about), and whether flux x k^2 beats toughness. */
  const reach = (i: number) => Math.max(len(sub(d.centre(i), p)) - 0.35 * ch[i]!.rad, 0.8);
  const breaks = (i: number, k: number) => reach(i) < rStar * k || i === hitChunk && rStar > 0.6;

  // every mode lights the crack network out to about twice the break radius, the front running at 60 m/s
  const glowR = Math.min(28, rStar * M.radius * 1.5 + 3);
  for (let i = 0; i < d.n; i++) {
    if (d.state[i] !== PieceState.Attached) continue;
    const r = reach(i);
    if (r < glowR) { d.crack(i, t + r / 60, clamp(1.1 - r / glowR, 0.05, 1) * 0.8); cracked++; }
  }

  const loosePush = (radius: number, scale: number) => {
    for (let i = 0; i < d.n; i++) {
      if (d.state[i] !== PieceState.Loose) continue;
      if (reach(i) > radius) continue;
      const v = out(i, scale, M.follow), b = d.body(i);
      const lv = b.linvel();
      b.setLinvel({ x: lv.x + v[0] * 0.6, y: lv.y + v[1] * 0.6, z: lv.z + v[2] * 0.6 }, true);
    }
  };

  let until = t + 1.2, centre: V3 = [...p];
  switch (modeId) {
    case 'vajra': {
      for (let i = 0; i < d.n; i++) {
        if (d.state[i] !== PieceState.Attached || !breaks(i, M.radius)) continue;
        const v = out(i, M.push, M.follow);
        if (d.breakOff(i, t, v, spin(i, 11, len(v), ch[i]!.rad), 'vajra')) broken++;
        d.damage[i] = 1;
      }
      // pieces just outside the break are weakened: a second hit nearby breaks them sooner
      for (let i = 0; i < d.n; i++) if (d.state[i] === PieceState.Attached) { const r = reach(i); if (r < rStar * 1.6) d.damage[i]! += clamp(1 - r / (rStar * 1.6), 0, 1) * 0.5; }
      loosePush(rStar * 1.8, M.push);
      ctx.slow(0.22, 0.45, 0.9);
      break;
    }
    case 'agni': {
      const k = M.radius;
      for (let i = 0; i < d.n; i++) {
        if (d.state[i] !== PieceState.Attached) continue;
        const r = reach(i);
        if (breaks(i, 0.42 * k)) {
          const v = out(i, M.push, M.follow, 0.2);
          if (d.breakOff(i, t, v, spin(i, 13, len(v), ch[i]!.rad), 'agni')) broken++;
          d.heatT0[i] = t; d.heatDur[i] = 0.05; d.heatPeak[i] = 1; d.coolT0[i] = t + 0.3;
        } else if (r < rStar * k) {
          // the heat front reaches the piece, it glows, cracks and pops loose
          const at = t + r / 7 + hashi(i, 21, 0) * 0.3, dur = 0.45 + hashi(i, 22, 0) * 0.4;
          d.heatT0[i] = at; d.heatDur[i] = dur; d.heatPeak[i] = 1; d.coolT0[i] = at + dur + 0.25;
          const v = out(i, M.push * 0.6, M.follow, 0.5);
          d.schedule(at + dur, i, [v[0] * 0.7, v[1] * 0.7 + 2.5, v[2] * 0.7], spin(i, 23, 4, ch[i]!.rad), 'agni');
          heated++;
        } else if (r < rStar * k * 1.5) {
          const at = t + r / 7;
          d.heatT0[i] = at; d.heatDur[i] = 0.6; d.heatPeak[i] = 0.55 * (1.5 - r / (rStar * k)); d.coolT0[i] = at + 1.8;
          heated++;
        }
      }
      loosePush(rStar * 1.2, M.push);
      until = t + rStar * k / 7 + 1.4;
      ctx.slow(0.3, 0.35, 1.0);
      break;
    }
    case 'vayu': {
      for (let i = 0; i < d.n; i++) {
        if (d.state[i] !== PieceState.Attached) continue;
        const r = reach(i);
        if (breaks(i, 0.7 * M.radius)) {
          const v = out(i, M.push, M.follow);
          if (d.breakOff(i, t, v, spin(i, 17, len(v), ch[i]!.rad), 'vayu')) broken++;
        } else if (r < rStar * 1.35 && ch[i]!.depth < 9) {
          // loose surface rock is torn off by the wind over the next seconds
          const at = t + 0.25 + hashi(i, 31, 0) * 2.6;
          const v = out(i, 0.2, 0, 0.8);
          d.schedule(at, i, v, spin(i, 33, 3, ch[i]!.rad), 'vayu');
        }
      }
      const R = clamp(rStar * 1.9, 12, 34);
      centre = [p[0] + n[0] * 8, p[1] + n[1] * 8 + 3, p[2] + n[2] * 8];
      ctx.addVortex({ c: centre, R, t0: t, dur: 4.8, strength: 1 });
      until = t + 4.8;
      ctx.slow(0.35, 0.3, 0.8);
      break;
    }
    case 'cosmic': {
      const floatEnd = t + 2.3;
      for (let i = 0; i < d.n; i++) {
        if (d.state[i] !== PieceState.Attached || !breaks(i, M.radius)) continue;
        const v = out(i, M.push, M.follow);
        if (d.breakOff(i, t, [v[0] * 0.5, v[1] * 0.5 + 0.6, v[2] * 0.5], spin(i, 19, 3 + len(v), ch[i]!.rad), 'cosmic')) broken++;
        d.float(i, floatEnd + hashi(i, 41, 0) * 0.5);
      }
      for (let i = 0; i < d.n; i++) if (d.state[i] === PieceState.Loose && reach(i) < rStar * 2.2) d.float(i, floatEnd);
      // the rest of the structure holds until gravity returns, then whatever lost support collapses
      d.supportHold = floatEnd + 0.4;
      until = floatEnd + 1.6;
      ctx.slow(0.1, 1.5, 1.2);
      break;
    }
  }
  return { E, rStar, broken, heated, cracked, fx: { radius: rStar * M.radius, centre, until } };
}

/** One step of a vortex on the loose pieces of a target: swirl, pull in, lift; lighter pieces fly more. */
export function applyVortex(d: Destructible, v: Vortex, t: number, dt: number) {
  const age = t - v.t0;
  if (age < 0 || age > v.dur) return;
  const decay = Math.exp(-age / 2.2) * clamp((v.dur - age) / 0.8, 0, 1) * clamp(age / 0.25, 0, 1);
  for (let i = 0; i < d.n; i++) {
    if (d.state[i] !== PieceState.Loose) continue;
    const x = d.curP[3 * i]! - v.c[0], y = d.curP[3 * i + 1]! - v.c[1], z = d.curP[3 * i + 2]! - v.c[2];
    const rh = Math.hypot(x, z);
    if (rh > v.R || Math.abs(y) > v.R * 1.4) continue;
    const f = (1 - rh / v.R) * decay * v.strength;
    const ux = rh > 0.01 ? x / rh : 0, uz = rh > 0.01 ? z / rh : 0;
    const m = d.mass[i]!, scale = 1 / (1 + Math.sqrt(m / 4e5));
    const ax = (-uz * 17 - ux * 7) * f * scale, ay = (11 - y * 0.25) * f * scale, az = (ux * 17 - uz * 7) * f * scale;
    d.body(i).applyImpulse({ x: m * ax * dt, y: m * ay * dt, z: m * az * dt }, true);
  }
}
