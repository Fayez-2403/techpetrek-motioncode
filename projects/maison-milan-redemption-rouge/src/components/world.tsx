// The Redemption Rouge world kit. Every component is a pure function of the frame / time it is given.
//   Bottle   the official product photo (cut out), with light sweeps clipped to the glass and a wet-floor reflection
//   Streaks  red light trails at speed (front: in perspective from a vanishing point; side: horizontal)
//   Petals   3D rose petals: an explosion, an orbit, or a slow fall
//   Words    a line that lands word by word (from slight oversize, decelerating) and leaves accelerating
//   Grain    film grain + vignette over everything
import React from 'react';
import { AbsoluteFill, Img, staticFile } from 'remotion';
import { clamp, easeInCubic, easeOutCubic, easeOutQuint, invLerp, lerp } from '../animation/anim';
import { hash, noise1 } from '../animation/rng';
import { C, FONT } from '../themes/tokens';

// ---------------------------------------------------------------- bottle
export const SRC = {
  front: { file: 'img/bottle_front.png', w: 588, h: 1562 },
  side: { file: 'img/bottle_side.png', w: 396, h: 1556 },
  box: { file: 'img/bottle_box.png', w: 1059, h: 1296 },
} as const;
export type BottleKind = keyof typeof SRC;

/** a light band sweeping across the glass: p 0..1 across, a = strength, angle in deg, width in % */
export interface Sweep { p: number; a: number; angle?: number; width?: number; col?: string }

export const Bottle: React.FC<{
  kind?: BottleKind; x: number; base: number; h: number; tilt?: number; sx?: number; opacity?: number;
  sweeps?: Sweep[]; rim?: number; reflect?: number; blur?: number; floorBlur?: number;
}> = ({ kind = 'front', x, base, h, tilt = 0, sx = 1, opacity = 1, sweeps = [], rim = 0, reflect = 0.32, blur = 0, floorBlur = 5 }) => {
  const s = SRC[kind], w = (h * s.w) / s.h, url = staticFile(s.file);
  const mask: React.CSSProperties = { WebkitMaskImage: `url(${url})`, WebkitMaskSize: '100% 100%', maskImage: `url(${url})`, maskSize: '100% 100%' };
  const body = (
    <>
      <Img
        src={url}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          translate: '2.4px 6.5px'
        }}
      />
      {rim > 0 && <div style={{ position: 'absolute', inset: 0, ...mask, mixBlendMode: 'screen', opacity: rim,
        background: `radial-gradient(60% 45% at 50% 62%, ${C.ember}55, transparent 70%), linear-gradient(90deg, ${C.ember}66, transparent 18%, transparent 82%, ${C.ember}66)` }} />}
      {sweeps.map((sw, i) => {
        const p = sw.p * 140 - 20, wd = sw.width ?? 9;
        return <div key={i} style={{ position: 'absolute', inset: 0, ...mask, mixBlendMode: 'screen', opacity: clamp(sw.a),
          background: `linear-gradient(${sw.angle ?? 105}deg, transparent ${p - wd}%, ${sw.col ?? 'rgba(255,214,200,0.85)'} ${p}%, transparent ${p + wd}%)` }} />;
      })}
    </>
  );
  return (
    <div style={{ position: 'absolute', left: x - w / 2, top: base - h, width: w, height: h, opacity }}>
      {reflect > 0 && (
        <div style={{ position: 'absolute', left: 0, top: h, width: w, height: h * 0.55, overflow: 'hidden', opacity: reflect,
          WebkitMaskImage: 'linear-gradient(180deg, rgba(0,0,0,0.9), transparent 85%)', maskImage: 'linear-gradient(180deg, rgba(0,0,0,0.9), transparent 85%)',
          filter: `blur(${floorBlur}px)`, transform: `skewX(${-tilt * 0.6}deg)` }}>
          <div style={{ position: 'absolute', left: 0, top: 0, width: w, height: h, transform: `scale(${sx}, -1)`, transformOrigin: '50% 0%' }}>{body}</div>
        </div>
      )}
      <div style={{ position: 'absolute', inset: 0, transform: `rotate(${tilt}deg) scaleX(${sx})`, transformOrigin: '50% 100%', filter: blur ? `blur(${blur}px)` : undefined }}>{body}</div>
    </div>
  );
};

// ---------------------------------------------------------------- streaks
const FOC = 900;
export interface Trail { x: number; y: number; zHead: number; len: number; w: number; a: number; col: string }
/** project a trail in camera space (x right, y up from the floor, z ahead) through a camera at height camH */
function proj(vp: { x: number; y: number }, camH: number, x: number, y: number, z: number) {
  return { X: vp.x + (FOC * x) / z, Y: vp.y + (FOC * (camH - y)) / z };
}
function trailPoly(vp: { x: number; y: number }, camH: number, t: Trail, mirror = false) {
  const z1 = Math.max(0.35, t.zHead), z0 = Math.max(0.35, t.zHead + t.len);
  if (z0 - z1 < 0.02) return null;
  const y = mirror ? -t.y : t.y;
  const a = proj(vp, camH, t.x, y, z1), b = proj(vp, camH, t.x, y, z0);
  const wa = (t.w * FOC) / z1 / 2, wb = (t.w * FOC) / z0 / 2;
  const dx = a.X - b.X, dy = a.Y - b.Y, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
  return { pts: `${a.X + nx * wa},${a.Y + ny * wa} ${a.X - nx * wa},${a.Y - ny * wa} ${b.X - nx * wb},${b.Y - ny * wb} ${b.X + nx * wb},${b.Y + ny * wb}`, a, b };
}

/** front view: trails rushing out of the vanishing point toward the camera, mirrored in the wet floor */
export const FrontStreaks: React.FC<{ trails: Trail[]; vp: { x: number; y: number }; camH?: number; reflect?: number }> = ({ trails, vp, camH = 1.2, reflect = 0.45 }) => {
  const polys = trails.map((t, i) => ({ t, i, p: trailPoly(vp, camH, t), m: trailPoly(vp, camH, t, true) }));
  return (
    <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
      <defs>
        <filter id="glowA" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="14" /></filter>
        <filter id="glowB" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3" /></filter>
        {polys.map(({ p, i, t }) => p && (
          <linearGradient key={i} id={`tg${i}`} gradientUnits="userSpaceOnUse" x1={p.b.X} y1={p.b.Y} x2={p.a.X} y2={p.a.Y}>
            <stop offset="0" stopColor={t.col} stopOpacity="0" /><stop offset="0.75" stopColor={t.col} stopOpacity="0.8" /><stop offset="1" stopColor="#FFE3D6" stopOpacity="1" />
          </linearGradient>
        ))}
      </defs>
      <g opacity={reflect} filter="url(#glowB)">
        {polys.map(({ m, i, t }) => m && <polygon key={i} points={m.pts} fill={`url(#tg${i})`} opacity={t.a * 0.7} />)}
      </g>
      <g filter="url(#glowA)">{polys.map(({ p, i, t }) => p && <polygon key={i} points={p.pts} fill={t.col} opacity={t.a * 0.55} />)}</g>
      <g>{polys.map(({ p, i, t }) => p && <polygon key={i} points={p.pts} fill={`url(#tg${i})`} opacity={t.a} />)}</g>
    </svg>
  );
};

/** side view: horizontal trails moving right to left; depth d (0 far .. 1 near) sets size, speed and blur */
export interface HTrail { x: number; y: number; len: number; th: number; a: number; d: number }
export const SideStreaks: React.FC<{ trails: HTrail[] }> = ({ trails }) => (
  <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
    <defs>
      <linearGradient id="hs" x1="0" x2="1" y1="0" y2="0">
        <stop offset="0" stopColor="#FFE3D6" /><stop offset="0.08" stopColor={C.ember} /><stop offset="1" stopColor={C.rouge} stopOpacity="0" />
      </linearGradient>
      <filter id="hsG" x="-20%" y="-200%" width="140%" height="500%"><feGaussianBlur stdDeviation="10" /></filter>
    </defs>
    <g filter="url(#hsG)">{trails.map((t, i) => <rect key={i} x={t.x} y={t.y - t.th * 1.5} width={t.len} height={t.th * 3} rx={t.th * 1.5} fill={C.ember} opacity={t.a * 0.5} />)}</g>
    <g>{trails.map((t, i) => <rect key={i} x={t.x} y={t.y - t.th / 2} width={t.len} height={t.th} rx={t.th / 2} fill="url(#hs)" opacity={t.a} />)}</g>
  </svg>
);

// ---------------------------------------------------------------- floor
/** wet asphalt in perspective: a dark gradient floor below the horizon with dashed lane lines that rush toward camera */
export const TrackFloor: React.FC<{ vp: { x: number; y: number }; camH?: number; travel: number; glow?: number }> = ({ vp, camH = 1.2, travel, glow = 1 }) => {
  const lanes = [-2.6, 2.6], dashL = 1.4, gap = 2.6, per = dashL + gap;
  const dashes: string[] = [];
  for (const lx of lanes) for (let k = 0; k < 14; k++) {
    const z0 = 0.5 + ((k * per - travel) % (14 * per) + 14 * per) % (14 * per), z1 = z0 + dashL;
    if (z0 > 40) continue;
    const a = proj(vp, camH, lx, 0, z0), b = proj(vp, camH, lx, 0, z1);
    const wa = (0.09 * FOC) / z0, wb = (0.09 * FOC) / z1;
    dashes.push(`${a.X - wa},${a.Y} ${a.X + wa},${a.Y} ${b.X + wb},${b.Y} ${b.X - wb},${b.Y}`);
  }
  return (
    <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
      <defs>
        <linearGradient id="fl" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#2A0609" /><stop offset="0.35" stopColor="#12030A" /><stop offset="1" stopColor="#050104" /></linearGradient>
        <radialGradient id="hz" gradientUnits="userSpaceOnUse" cx={vp.x} cy={vp.y} r={760} gradientTransform={`translate(${vp.x} ${vp.y}) scale(1.25 0.6) translate(${-vp.x} ${-vp.y})`}>
          <stop offset="0" stopColor={C.rouge} stopOpacity={0.6 * glow} /><stop offset="0.55" stopColor={C.rouge} stopOpacity={0.18 * glow} /><stop offset="1" stopColor={C.rouge} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x={0} y={vp.y} width={1080} height={1920 - vp.y} fill="url(#fl)" />
      <rect x={0} y={0} width={1080} height={1920} fill="url(#hz)" />
      <g fill="#E9D8CF" opacity={0.22}>{dashes.map((d, i) => <polygon key={i} points={d} />)}</g>
    </svg>
  );
};

// ---------------------------------------------------------------- petals
const PETAL = 'M50 2 C 84 12, 99 52, 82 92 C 72 114, 28 114, 18 92 C 1 52, 16 12, 50 2 Z';
export interface PetalState { x: number; y: number; z: number; rx: number; ry: number; rz: number; s: number; a: number; tone: number }
export const Petal: React.FC<{ p: PetalState; id: number }> = ({ p, id }) => {
  const persp = 1100 / (1100 - p.z);
  const light = 0.55 + 0.45 * Math.abs(Math.cos((p.rx * Math.PI) / 180) * Math.cos((p.ry * Math.PI) / 180));   // facing the light = brighter
  const c1 = p.tone > 0.5 ? '#E2333C' : '#C21A27', c2 = p.tone > 0.5 ? '#6B0912' : '#4E050C';
  return (
    <div style={{ position: 'absolute', left: 540 + (p.x - 540) * persp - 40, top: 960 + (p.y - 960) * persp - 48, width: 80, height: 96, opacity: p.a,
      transform: `scale(${p.s * persp}) rotateZ(${p.rz}deg) rotateX(${p.rx}deg) rotateY(${p.ry}deg)`, filter: `brightness(${light}) ${p.z < -400 ? `blur(${Math.min(6, (-p.z - 400) / 120)}px)` : p.z > 500 ? `blur(${Math.min(8, (p.z - 500) / 60)}px)` : ''}` }}>
      <svg viewBox="0 0 100 116" width={80} height={96}>
        <defs>
          <radialGradient id={`pg${id}`} cx="0.45" cy="0.35" r="0.75"><stop offset="0" stopColor={c1} /><stop offset="0.7" stopColor={c2} /><stop offset="1" stopColor="#2A0207" /></radialGradient>
        </defs>
        <path d={PETAL} fill={`url(#pg${id})`} />
        <path d="M50 10 C 47 45, 49 80, 50 104" stroke="#FF8A86" strokeOpacity="0.18" strokeWidth="1.6" fill="none" />
      </svg>
    </div>
  );
};

/** petals bursting out of a point at time t0 (seconds), then drifting down with flutter */
export function burst(n: number, seed: number, t: number, t0: number, origin: { x: number; y: number }, power = 1): PetalState[] {
  const out: PetalState[] = [];
  const dt = t - t0;
  if (dt < 0) return out;
  for (let i = 0; i < n; i++) {
    const r1 = hash(i, seed), r2 = hash(i, seed + 1), r3 = hash(i, seed + 2), r4 = hash(i, seed + 3);
    const ang = r1 * Math.PI * 2, sp = (900 + 1500 * r2) * power, vz = (r3 - 0.45) * 1800 * power;
    const k = 2.2;                                                     // drag
    const travel = (1 - Math.exp(-k * dt)) / k;
    const fall = 140 * dt * dt + 60 * dt;
    out.push({
      x: origin.x + Math.cos(ang) * sp * travel + 40 * noise1(dt * 0.9 + i, seed + 5),
      y: origin.y + Math.sin(ang) * sp * travel * 0.8 + fall,
      z: clamp(vz * travel, -900, 900),
      rx: 360 * r4 * 2 + dt * (140 + 160 * r1), ry: 120 * r2 + dt * (90 + 120 * r3), rz: 360 * r3 + dt * 40,
      s: 0.7 + 0.9 * r4, a: clamp(dt / 0.06) * (1 - clamp((dt - 3.2) / 0.8)), tone: r2,
    });
  }
  return out;
}

/** petals circling a centre (the heart notes), rising slowly */
export function orbit(n: number, seed: number, t: number, c: { x: number; y: number }, a = 1): PetalState[] {
  const out: PetalState[] = [];
  for (let i = 0; i < n; i++) {
    const r1 = hash(i, seed), r2 = hash(i, seed + 1), r3 = hash(i, seed + 2);
    const th = r1 * Math.PI * 2 + t * (0.9 + 0.5 * r2), R = 330 + 220 * r3;
    out.push({ x: c.x + Math.cos(th) * R, y: c.y + Math.sin(th * 0.5 + r2 * 6) * 520 - 60 * t * r3, z: Math.sin(th) * 600,
      rx: 200 * t + 360 * r2, ry: 150 * t * (r1 - 0.5) + 90, rz: (th * 180) / Math.PI, s: 0.75 + 0.6 * r2, a, tone: r3 });
  }
  return out;
}

/** a slow fall of petals across the frame (ambient), seeded and looping */
export function fall(n: number, seed: number, t: number, a = 1, speed = 1): PetalState[] {
  const out: PetalState[] = [];
  for (let i = 0; i < n; i++) {
    const r1 = hash(i, seed), r2 = hash(i, seed + 1), r3 = hash(i, seed + 2), r4 = hash(i, seed + 3);
    const per = 9 + 5 * r2, ph = ((t * speed) / per + r1) % 1;
    out.push({ x: 60 + 960 * r3 + 90 * Math.sin(t * (0.8 + r1) + i), y: -200 + 2300 * ph, z: (r4 - 0.5) * 900,
      rx: 120 * t * (0.6 + r2) + 300 * r1, ry: 80 * t + 200 * r4, rz: 40 * Math.sin(t + i) + 360 * r2, s: 0.55 + 0.6 * r4, a: a * clamp(Math.sin(ph * Math.PI) * 3), tone: r1 });
  }
  return out;
}

export const Petals: React.FC<{ list: PetalState[]; seed?: number }> = ({ list, seed = 0 }) => (
  <AbsoluteFill style={{ perspective: 1100, perspectiveOrigin: '50% 50%', pointerEvents: 'none' }}>
    {list.map((p, i) => <Petal key={i} p={p} id={seed * 1000 + i} />)}
  </AbsoluteFill>
);

// ---------------------------------------------------------------- type
/** a line that lands word by word: each word decelerates in from 1.18x and 18 px low, then the line leaves upward */
export const Words: React.FC<{
  text: string; t: number; at: number; out?: number; gap?: number; size?: number; y: number; font?: string; italic?: boolean;
  color?: string; weight?: number; spacing?: number; maxW?: number; align?: 'center' | 'left'; x?: number; lineH?: number; gradient?: string;
}> = ({ text, t, at, out = 1e9, gap = 0.1, size = 72, y, font = FONT.serif, italic = true, color = C.ivory, weight = 500, spacing = 0, maxW = 900, align = 'center', x = 90, lineH = 1.12, gradient }) => {
  const words = text.split(' ');
  const leave = easeInCubic(invLerp(out, out + 0.3, t));
  return (
    <div style={{ position: 'absolute', top: y - 26 * leave, left: align === 'center' ? 540 - maxW / 2 : x, width: maxW, textAlign: align, fontFamily: font,
      fontStyle: italic ? 'italic' : 'normal', fontWeight: weight, fontSize: size, lineHeight: lineH, letterSpacing: spacing, color,
      opacity: 1 - leave, filter: leave > 0 ? `blur(${leave * 8}px)` : undefined, textShadow: '0 4px 30px rgba(0,0,0,0.65)' }}>
      {words.map((w, i) => {
        const p = easeOutQuint(invLerp(at + i * gap, at + i * gap + 0.42, t));
        const g = gradient ? { backgroundImage: gradient, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' } : {};
        return (
          <span key={i} style={{ display: 'inline-block', marginRight: i < words.length - 1 ? '0.26em' : 0, opacity: p, ...g,
            transform: `translateY(${(1 - p) * 18}px) scale(${lerp(1.18, 1, p)})`, filter: p < 1 ? `blur(${(1 - p) * 7}px)` : undefined }}>{w}</span>
        );
      })}
    </div>
  );
};

export const goldText = `linear-gradient(180deg, ${C.gold2} 0%, ${C.gold} 45%, #9C7432 70%, ${C.gold2} 100%)`;

// ---------------------------------------------------------------- finish
export const Grain: React.FC<{ frame: number; amount?: number }> = ({ frame, amount = 0.07 }) => (
  <AbsoluteFill style={{ pointerEvents: 'none', zIndex: 80 }}>
    <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0, opacity: amount, mixBlendMode: 'overlay' }}>
      <filter id="gr"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={frame % 97} /><feColorMatrix type="saturate" values="0" /></filter>
      <rect width={1080} height={1920} filter="url(#gr)" />
    </svg>
    <AbsoluteFill style={{ background: 'radial-gradient(120% 80% at 50% 48%, transparent 50%, rgba(0,0,0,0.55) 100%)' }} />
  </AbsoluteFill>
);

/** a velvet rouge backdrop: a warm pool of light behind the hero, slowly breathing */
export const Velvet: React.FC<{ t: number; cx?: number; cy?: number; power?: number }> = ({ t, cx = 540, cy = 900, power = 1 }) => (
  <AbsoluteFill style={{ background: `radial-gradient(70% 45% at ${cx}px ${cy}px, rgba(150,14,24,${0.55 * power * (0.92 + 0.08 * Math.sin(t * 1.3))}), transparent 70%), `
    + `radial-gradient(40% 25% at ${cx}px ${cy + 120}px, rgba(255,70,50,${0.18 * power}), transparent 70%), ${C.base}` }} />
);

/** a glossy floor line with the warm horizon glow (box and finale) */
export const StageFloor: React.FC<{ y: number; glow?: number }> = ({ y, glow = 1 }) => (
  <AbsoluteFill>
    <div style={{ position: 'absolute', left: 0, right: 0, top: y, bottom: 0, background: `linear-gradient(180deg, rgba(60,6,12,${0.9 * glow}), #080205 45%, #040103)` }} />
    <div style={{ position: 'absolute', left: -100, right: -100, top: y - 2, height: 4, background: `linear-gradient(90deg, transparent, rgba(255,120,100,${0.35 * glow}), transparent)`, filter: 'blur(2px)' }} />
  </AbsoluteFill>
);

export const speedEase = { easeOutCubic, easeInCubic };
