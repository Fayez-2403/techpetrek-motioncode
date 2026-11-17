// The bot's moves as pure functions of time. Each returns a Pose; a performance is a list of clips blended with a short
// crossfade. Timing follows the motion laws: anticipation (squash) before a jump, ease-out in the air, a hard squash on
// landing that springs back with a little overshoot. Units: seconds, bot units (1 = one arm block), radians.
import { REST, type Pose, type Eyes, type Mouth, type Limb } from './Bot';

const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const spring = (t: number, w = 18, z = 0.32) => (t <= 0 ? 0 : 1 - Math.exp(-z * w * t) * Math.cos(w * Math.sqrt(1 - z * z) * t));
const L = (raise = 0, swing = 0, stretch = 1): Limb => ({ raise, swing, stretch });

/** blink about every 2.6 s (seeded by an offset), 0.12 s long */
export function blink(t: number, base: Eyes = 'open', off = 0): Eyes {
  if (base !== 'open' && base !== 'wide') return base;
  const ph = (t + off) % 2.6;
  return ph > 2.48 ? 'blink' : base;
}

export function idle(t: number, o: Partial<Pose> = {}): Pose {
  const b = Math.sin(t * 2.4) * 0.02;
  return { ...REST, squash: 1 + b, armL: L(0.12 + Math.sin(t * 2.4) * 0.05), armR: L(0.12 + Math.sin(t * 2.4 + 0.5) * 0.05), eyes: blink(t), ...o };
}

/** hop / jump / stomp: anticipation 0.12 s, air `air` s with apex h, landing squash that springs back */
export function jump(t: number, t0: number, h: number, air: number, from: [number, number, number], to: [number, number, number], heavy = false): Pose {
  const a = t - t0, pre = 0.12;
  let squash = 1, y = 0, u = 0, arms = 0.15, legs: Pose['legs'] = [0, 0, 0, 0], eyes: Eyes = 'open', mouth: Mouth = 'none', glow = 0;
  if (a < 0) { u = 0; }
  else if (a < pre) { const k = a / pre; squash = 1 - (heavy ? 0.3 : 0.2) * Math.sin(k * Math.PI / 2); arms = -0.4 * k; eyes = 'squint'; }
  else if (a < pre + air) {
    u = (a - pre) / air; y = 4 * h * u * (1 - u); squash = 1 + 0.18 * Math.sin(u * Math.PI) * (1 - u * 0.6);
    arms = 0.9 * Math.sin(u * Math.PI); legs = [0.25, 0.15, 0.25, 0.15].map((v) => v * Math.sin(u * Math.PI)) as Pose['legs'];
    eyes = u < 0.5 ? 'wide' : 'open'; mouth = heavy ? 'o' : 'none';
  } else {
    u = 1; const k = a - pre - air;
    squash = 1 - (heavy ? 0.36 : 0.22) * (1 - spring(k, 20, 0.35)); arms = 0.15 + (heavy ? -0.5 : -0.25) * Math.exp(-k * 8);
    eyes = heavy && k < 0.25 ? 'squint' : 'open'; glow = heavy ? Math.max(0, 1 - k / 0.25) : 0;
  }
  const pos: [number, number, number] = [lerp(from[0], to[0], u), lerp(from[1], to[1], u) + y, lerp(from[2], to[2], u)];
  return { ...REST, pos, squash, armL: L(arms), armR: L(arms), legs, eyes, mouth, glow };
}

/** walk / run along a straight line; phase from distance so feet don't slide */
export function walk(t: number, t0: number, from: [number, number, number], to: [number, number, number], dur: number, run = false): Pose {
  const u = clamp((t - t0) / dur), e = u * u * (3 - 2 * u);
  const dx = to[0] - from[0], dz = to[2] - from[2], dist = Math.hypot(dx, dz);
  const ph = (e * dist) / (run ? 1.6 : 1.1) * Math.PI * 2;
  const lift = run ? 0.45 : 0.28;
  const legs = [0, 1, 2, 3].map((i) => Math.max(0, Math.sin(ph + (i % 2) * Math.PI + (i > 1 ? Math.PI : 0))) * lift) as Pose['legs'];
  const legSwing = [0, 1, 2, 3].map((i) => Math.sin(ph + (i % 2) * Math.PI + (i > 1 ? Math.PI : 0)) * (run ? 0.5 : 0.3)) as Pose['legSwing'];
  const bob = Math.abs(Math.sin(ph)) * (run ? 0.25 : 0.1);
  return {
    ...REST, pos: [lerp(from[0], to[0], e), from[1] + bob, lerp(from[2], to[2], e)], rotY: Math.atan2(dx, dz), rotZ: Math.sin(ph) * 0.04,
    squash: 1 - bob * 0.15, legs, legSwing, armL: L(0.2, Math.sin(ph) * 0.6), armR: L(0.2, -Math.sin(ph) * 0.6),
    eyes: blink(t, run ? 'squint' : 'open'), mouth: run ? 'grin' : 'none', rotX: run ? 0.08 : 0,
  };
}

export const wave = (t: number, o: Partial<Pose> = {}): Pose => ({ ...idle(t), armR: L(1.9 + Math.sin(t * 14) * 0.35, 0, 1.1), eyes: 'happy', mouth: 'smile', ...o });
export const point = (t: number, side: 1 | -1 = 1, o: Partial<Pose> = {}): Pose => {  // arm out toward ±x
  const p = idle(t), arm = L(0.35, 0, 1.6 + Math.sin(t * 6) * 0.04);
  return { ...p, ...(side === 1 ? { armR: arm } : { armL: arm }), eyes: 'wide', mouth: 'o', ...o };
};
export const magnify = (t: number, o: Partial<Pose> = {}): Pose => ({ ...idle(t), armR: L(0.55 + Math.sin(t * 3) * 0.04, 0, 1.2), prop: 'magnifier', eyes: 'wide', look: [0.6, 0.4], ...o });
export const cheer = (t: number, o: Partial<Pose> = {}): Pose => {
  const k = Math.abs(Math.sin(t * 9));
  return { ...REST, pos: [0, k * 0.6, 0], squash: 1 + k * 0.08, armL: L(2.2 + k * 0.3), armR: L(2.2 + k * 0.3), eyes: 'happy', mouth: 'grin', ...o };
};
export const shocked = (t: number, o: Partial<Pose> = {}): Pose => ({ ...idle(t), squash: 1.12, armL: L(1.3), armR: L(1.3), eyes: 'wide', mouth: 'o', ...o });
export const angryStomp = (t: number, o: Partial<Pose> = {}): Pose => {
  const k = Math.max(0, Math.sin(t * 12));
  return { ...idle(t), legs: [k * 0.5, 0, 0, k * 0.5], squash: 1 - k * 0.06, armL: L(-0.3), armR: L(-0.3), eyes: 'angry', mouth: 'flat', ...o };
};

/** blend two poses (numeric parts lerp, discrete parts switch at the midpoint) */
export function mix(a: Pose, b: Pose, k: number): Pose {
  const n = (x: number, y: number) => lerp(x, y, k);
  const v = (x: number[], y: number[]) => x.map((xi, i) => n(xi, y[i]));
  const limb = (x: Limb, y: Limb): Limb => ({ raise: n(x.raise, y.raise), swing: n(x.swing, y.swing), stretch: n(x.stretch, y.stretch) });
  const d = k < 0.5 ? a : b;
  return {
    pos: v(a.pos, b.pos) as Pose['pos'], rotY: n(a.rotY, b.rotY), rotZ: n(a.rotZ, b.rotZ), rotX: n(a.rotX, b.rotX), squash: n(a.squash, b.squash),
    armL: limb(a.armL, b.armL), armR: limb(a.armR, b.armR), legs: v(a.legs, b.legs) as Pose['legs'], legSwing: v(a.legSwing, b.legSwing) as Pose['legSwing'],
    eyes: d.eyes, look: v(a.look, b.look) as Pose['look'], mouth: d.mouth, goggles: n(a.goggles, b.goggles), prop: d.prop, glow: n(a.glow, b.glow),
  };
}
export const offset = (p: Pose, d: [number, number, number], rotY = 0): Pose => ({ ...p, pos: [p.pos[0] + d[0], p.pos[1] + d[1], p.pos[2] + d[2]], rotY: p.rotY + rotY });
