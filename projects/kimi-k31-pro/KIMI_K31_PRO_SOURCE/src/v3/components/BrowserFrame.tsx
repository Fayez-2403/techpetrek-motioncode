// V3 web-shot helpers (v3studio): a soft drifting cloud plate, one generic browser window (our own chrome: no real
// browser branding, fictional *.example URLs) and a deterministic cursor. Everything is a pure function of the frame.
import React from 'react';
import { clamp, easeInOutCubic, easeOutCubic, invLerp, lerp } from '../../lib/anim';
import { mulberry32 } from '../../lib/rng';
import { F } from '../../styles/typography';

// ------------------------------------------------------------------------------------------------ cloud plate
export type PlateTone = 'morning' | 'golden';
const TONE: Record<PlateTone, { sky: string; sun: [number, number, string]; lit: string; shade: string }> = {
  morning: { sky: 'linear-gradient(180deg, #86A6E6 0%, #AFC2F0 30%, #DCCFEE 62%, #F7DCD8 84%, #FCE8DA 100%)', sun: [0.72, 0.18, 'rgba(255,246,232,0.9)'], lit: '255,255,255', shade: '176,170,222' },
  golden: { sky: 'linear-gradient(180deg, #9C8FE0 0%, #C9A2D4 30%, #EDB3B4 58%, #F8C9A4 82%, #FDE3C4 100%)', sun: [0.28, 0.2, 'rgba(255,236,204,0.95)'], lit: '255,249,242', shade: '196,146,188' },
};

interface Cloud { x: number; y: number; s: number; d: number; puffs: [number, number, number][] }
const CLOUDS = (seed: number): Cloud[] => {
  const r = mulberry32(seed);
  return Array.from({ length: 16 }, (_, i) => {
    const d = i / 15;                     // 0 far .. 1 near
    const n = 5 + Math.floor(r() * 4);
    const puffs: [number, number, number][] = Array.from({ length: n }, (_, k) => {
      const u = (k / (n - 1)) * 2 - 1;
      return [u * 1.05 + (r() - 0.5) * 0.3, -(1 - u * u) * 0.42 - r() * 0.18, 0.34 + (1 - Math.abs(u)) * 0.36 + r() * 0.14];
    });
    return { x: r() * 2500 - 300, y: 120 + d * 860 + (r() - 0.5) * 170, s: 60 + d * 200 + r() * 50, d, puffs };
  });
};
const CLOUD_SETS: Record<number, Cloud[]> = {};

/** sky gradient + sun glow + layered clouds that drift with parallax (near clouds bigger, faster, softer) */
export const CloudPlate: React.FC<{ f: number; tone?: PlateTone; seed?: number; drift?: number; front?: boolean }> = ({ f, tone = 'morning', seed = 7, drift = 1, front }) => {
  const T = TONE[tone];
  const set = (CLOUD_SETS[seed] ??= CLOUDS(seed));
  const list = front ? set.filter((c) => c.d > 0.86) : set.filter((c) => c.d <= 0.86);
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: front ? 40 : 0 }}>
      {!front && <div style={{ position: 'absolute', inset: 0, background: T.sky }} />}
      {!front && <div style={{ position: 'absolute', left: `${T.sun[0] * 100}%`, top: `${T.sun[1] * 100}%`, width: 1400, height: 1400, marginLeft: -700, marginTop: -700,
        background: `radial-gradient(closest-side, ${T.sun[2]} 0%, rgba(255,240,225,0.35) 35%, rgba(255,240,225,0) 100%)` }} />}
      {list.map((c, i) => {
        const x = ((c.x - f * drift * (0.25 + c.d * 1.6)) % 2700 + 2700) % 2700 - 380;
        const blur = front ? 10 : c.d > 0.7 ? 3 : c.d < 0.25 ? 1.5 : 0;
        return (
          <div key={i} style={{ position: 'absolute', left: x, top: c.y, width: 0, height: 0, opacity: front ? 0.9 : 0.5 + 0.45 * c.d, filter: blur ? `blur(${blur}px)` : undefined }}>
            <div style={{ position: 'absolute', left: -1.35 * c.s, top: -0.18 * c.s, width: 2.7 * c.s, height: 0.5 * c.s, borderRadius: '50%',
              background: `radial-gradient(closest-side, rgba(${T.shade},0.75), rgba(${T.shade},0))` }} />
            {c.puffs.map(([px, py, pr], k) => (
              <div key={k} style={{ position: 'absolute', left: (px - pr) * c.s, top: (py - pr) * c.s, width: 2 * pr * c.s, height: 2 * pr * c.s, borderRadius: '50%',
                background: `radial-gradient(circle at 42% 34%, rgba(${T.lit},1) 0%, rgba(${T.lit},0.92) 34%, rgba(${T.shade},0.6) 60%, rgba(${T.shade},0) 71%)` }} />
            ))}
          </div>
        );
      })}
    </div>
  );
};

// ------------------------------------------------------------------------------------------------ browser window
export const BAR_H = 56;

const Ico: React.FC<{ d: string; c: string; s?: number; w?: number }> = ({ d, c, s = 22, w = 2 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
);

/** a generic floating browser window; children are the page (absolutely positioned inside w × (h - BAR_H)) */
export const BrowserFrame: React.FC<{
  x: number; y: number; w: number; h: number; url: string; path?: string; theme?: 'light' | 'dark'; transform?: string;
  children?: React.ReactNode; load?: number;
}> = ({ x, y, w, h, url, path = '', theme = 'light', transform, children, load = 1 }) => {
  const dark = theme === 'dark';
  const ink = dark ? '#C9CBD6' : '#4A4F5C', mute = dark ? '#6E7180' : '#9AA0AE';
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: w, height: h, borderRadius: 22, overflow: 'hidden', transform, transformOrigin: '50% 60%',
      background: dark ? '#0E0E12' : '#FBFBFC',
      boxShadow: dark
        ? '0 50px 110px -30px rgba(30,12,40,0.55), 0 18px 40px -18px rgba(20,10,30,0.5), 0 0 0 1px rgba(255,255,255,0.08)'
        : '0 50px 110px -30px rgba(60,50,120,0.42), 0 18px 40px -18px rgba(60,50,120,0.3), 0 0 0 1px rgba(255,255,255,0.7)' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: w, height: BAR_H, display: 'flex', alignItems: 'center', padding: '0 22px', gap: 16, boxSizing: 'border-box',
        background: dark ? 'linear-gradient(180deg, #23232B 0%, #1B1B22 100%)' : 'linear-gradient(180deg, #F6F6F9 0%, #ECEDF2 100%)',
        borderBottom: `1px solid ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(20,24,40,0.08)'}` }}>
        <div style={{ display: 'flex', gap: 9 }}>
          {[0, 1, 2].map((i) => <div key={i} style={{ width: 13, height: 13, borderRadius: 7, background: dark ? '#3D3D48' : '#D3D6DE' }} />)}
        </div>
        <div style={{ display: 'flex', gap: 8, marginLeft: 10 }}>
          <Ico d="M15 5 L8 12 L15 19" c={ink} />
          <Ico d="M9 5 L16 12 L9 19" c={mute} />
          <Ico d="M19 12 A7 7 0 1 1 16.5 6.6 M19 4 V8.5 H14.5" c={ink} />
        </div>
        {/* URL pill sits left (not centred): in the rotated reel the top band right of x 880 is under the like/comment UI */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start', marginLeft: 8 }}>
          <div style={{ width: Math.min(480, w * 0.36), height: 36, borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'flex-start', padding: '0 16px', boxSizing: 'border-box', gap: 10, position: 'relative', overflow: 'hidden',
            background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(20,24,40,0.05)' }}>
            <Ico d="M7 11 V8 A5 5 0 0 1 17 8 V11 M5.5 11 H18.5 V20 H5.5 Z" c={mute} s={17} />
            <span style={{ fontFamily: F.text, fontSize: 19, fontWeight: 500, color: ink, letterSpacing: '0.01em' }}>{url}<span style={{ color: mute }}>{path}</span></span>
            {load < 1 && <div style={{ position: 'absolute', left: 0, bottom: 0, height: 3, width: `${load * 100}%`, background: dark ? '#FF9A5A' : '#6C7BFF' }} />}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 14 }}>
          <Ico d="M12 4 V15 M7.5 8.5 L12 4 L16.5 8.5 M6 13 V20 H18 V13" c={ink} />
          <Ico d="M5 5 H19 V19 H5 Z M5 9 H19" c={ink} />
        </div>
      </div>
      <div style={{ position: 'absolute', left: 0, top: BAR_H, width: w, height: h - BAR_H, overflow: 'hidden' }}>{children}</div>
    </div>
  );
};

// ------------------------------------------------------------------------------------------------ cursor
export type CursorKey = [frame: number, x: number, y: number];
/** cursor position along keyframes (ease in-out between keys; holds before/after) */
export function cursorAt(f: number, k: CursorKey[]): [number, number] {
  if (f <= k[0][0]) return [k[0][1], k[0][2]];
  for (let i = 0; i < k.length - 1; i++) {
    const [f0, x0, y0] = k[i], [f1, x1, y1] = k[i + 1];
    if (f <= f1) { const t = easeInOutCubic(invLerp(f0, f1, f)); return [lerp(x0, x1, t), lerp(y0, y1, t)]; }
  }
  const l = k[k.length - 1];
  return [l[1], l[2]];
}

/** exponentially lagged follow of a keyed path (a pure function of f: weighted average of past positions) */
export function cursorFollow(f: number, k: CursorKey[], lag = 6, taps = 24): [number, number] {
  let sx = 0, sy = 0, sw = 0;
  for (let i = 0; i < taps; i++) { const w = Math.exp(-i / lag), [x, y] = cursorAt(f - i, k); sx += w * x; sy += w * y; sw += w; }
  return [sx / sw, sy / sw];
}

/** press: 0..1 (button down); clickAge: frames since the last click (ripple), negative = none */
export const Cursor: React.FC<{ x: number; y: number; press?: number; clickAge?: number; dark?: boolean; scale?: number; grab?: boolean; opacity?: number }> = ({ x, y, press = 0, clickAge = -1, dark, scale = 1, grab, opacity = 1 }) => {
  const rip = clickAge >= 0 && clickAge < 16 ? easeOutCubic(clickAge / 16) : -1;
  const s = scale * (1 - 0.12 * clamp(press));
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: 0, height: 0, zIndex: 80, opacity, pointerEvents: 'none' }}>
      {rip >= 0 && <div style={{ position: 'absolute', left: -38 * rip - 4, top: -38 * rip - 4, width: 76 * rip + 8, height: 76 * rip + 8, borderRadius: '50%',
        border: `3px solid ${dark ? 'rgba(255,255,255,0.85)' : 'rgba(40,46,70,0.7)'}`, opacity: 1 - rip }} />}
      <svg width={40} height={46} viewBox="-2 -2 26 30" style={{ position: 'absolute', left: -3, top: -3, transform: `scale(${s})`, transformOrigin: '3px 3px', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.35))' }}>
        {grab
          ? <path d="M6 12 V5.5 a1.6 1.6 0 0 1 3.2 0 V11 V3.8 a1.6 1.6 0 0 1 3.2 0 V11 V4.6 a1.6 1.6 0 0 1 3.2 0 V11.5 V7 a1.6 1.6 0 0 1 3.2 0 V15 c0 5 -3 8 -7 8 h-1 c-3 0 -5 -2 -6.5 -4.5 L1.2 13.6 a1.7 1.7 0 0 1 2.8 -1.9 Z"
              fill={dark ? '#111' : '#fff'} stroke={dark ? '#fff' : '#15171F'} strokeWidth={1.5} strokeLinejoin="round" />
          : <path d="M0 0 L0 20.5 L5.2 15.8 L8.6 23.6 L12 22.1 L8.7 14.5 L15.6 14.5 Z" fill={dark ? '#111' : '#fff'} stroke={dark ? '#fff' : '#15171F'} strokeWidth={1.6} strokeLinejoin="round" />}
      </svg>
    </div>
  );
};
