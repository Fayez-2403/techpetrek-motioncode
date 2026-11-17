// The ep 01 kit: acrylic panels, 3D kinetic type, chips, stamps, source and "illustrative" labels, the two host seats.
// Every component is a pure function of its props (t / u in seconds); nothing reads the clock.
import React from 'react';
import { Img, staticFile } from 'remotion';
import { C, FONT, depth } from '../themes/tokens';
import { clamp, dampedSpring, easeOutCubic, invLerp } from '../animation/anim';
import type { Who } from './data';

/** spring 0 -> 1 starting at `at` seconds (slight overshoot, no excessive bounce) */
export const sp = (u: number, at = 0, w = 13, z = 0.62) => dampedSpring(u - at, w, z);
export const fade = (u: number, at = 0, d = 0.18) => easeOutCubic(invLerp(at, at + d, u));

export const Panel: React.FC<{ x: number; y: number; w: number; h: number; style?: React.CSSProperties; children?: React.ReactNode }> = ({ x, y, w, h, style, children }) => (
  <div style={{ position: 'absolute', left: x, top: y, width: w, height: h, borderRadius: 34, background: C.panel, backdropFilter: 'blur(18px)',
    border: `1.5px solid rgba(255,255,255,0.9)`, boxShadow: depth(1), overflow: 'hidden', ...style }}>{children}</div>
);

/** the prompt's on-screen TYPE: big 3D type (stacked extrusion), springs in tilted, settles flat */
export const Type3D: React.FC<{ text: string; u: number; y?: number; size?: number; col?: string }> = ({ text, u, y = 262, size = 112, col = C.navy }) => {
  const s = sp(u, 0.02, 14, 0.6), rot = (1 - s) * 38, depthPx = 7;
  const ext = Array.from({ length: depthPx }, (_, i) => `0 ${i + 1}px 0 ${i === depthPx - 1 ? 'rgba(10,140,196,0.55)' : C.cyan}`).join(', ');
  return (
    <div style={{ position: 'absolute', left: 50, right: 50, top: y, textAlign: 'center', perspective: 900 }}>
      <div style={{ display: 'inline-block', fontFamily: FONT.display, fontWeight: 900, fontStretch: '78%', fontSize: size, lineHeight: 0.95, color: col,
        textShadow: `${ext}, 0 ${depthPx + 10}px 26px rgba(18,184,245,0.35)`, transform: `rotateX(${rot}deg) scale(${0.7 + 0.3 * s})`, opacity: clamp(s * 3), letterSpacing: '-0.01em' }}>
        {text}
      </div>
    </div>
  );
};

export const Chip: React.FC<{ children: React.ReactNode; col?: string; style?: React.CSSProperties; mono?: boolean }> = ({ children, col = C.cyan, style, mono }) => (
  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 14, background: '#fff', border: `2px solid ${col}`,
    color: C.navy, fontFamily: mono ? FONT.mono : FONT.ui, fontWeight: 700, fontSize: 24, boxShadow: depth(0.5), whiteSpace: 'nowrap', ...style }}>{children}</div>
);

/** a rubber stamp that slams on (scale 1.8 -> 1 with a hit), rotated */
export const Stamp: React.FC<{ text: string; u: number; at: number; col?: string; x: number; y: number; rot?: number; size?: number }> = ({ text, u, at, col = C.bad, x, y, rot = -12, size = 120 }) => {
  if (u < at) return null;
  const s = sp(u, at, 18, 0.5);
  return (
    <div style={{ position: 'absolute', left: x, top: y, transform: `translate(-50%,-50%) rotate(${rot}deg) scale(${1.8 - 0.8 * s})`, opacity: clamp((u - at) / 0.06),
      border: `10px solid ${col}`, borderRadius: 22, padding: '6px 34px', color: col, fontFamily: FONT.display, fontWeight: 900, fontSize: size, letterSpacing: '0.06em',
      background: 'rgba(255,255,255,0.55)', mixBlendMode: 'multiply' }}>{text}</div>
  );
};

/** source lower-third on factual reveals (the prompt: visible, dated) */
export const Source: React.FC<{ u: number; text?: string }> = ({ u, text = 'SOURCE · github.com/Donchitos/Claude-Code-Game-Studios · README · 1 Nov 2026' }) => (
  <div style={{ position: 'absolute', left: 70, right: 70, top: 1150, textAlign: 'center', opacity: fade(u, 0.35, 0.3) }}>
    <span style={{ fontFamily: FONT.mono, fontSize: 18, whiteSpace: 'nowrap', color: C.navy2, background: 'rgba(255,255,255,0.8)', padding: '6px 14px', borderRadius: 10, border: `1px solid ${C.line}` }}>{text}</span>
  </div>
);

export const Illustrative: React.FC<{ x: number; y: number; text?: string }> = ({ x, y, text = 'ILLUSTRATIVE · not official output' }) => (
  <div style={{ position: 'absolute', left: x, top: y, padding: '6px 14px', borderRadius: 10, background: C.magenta, color: '#fff', fontFamily: FONT.mono, fontWeight: 700, fontSize: 20, letterSpacing: '0.04em' }}>{text}</div>
);

/** a host seat (Bro bottom-left, Bhai bottom-right). `src` = the approved pose image; until then a clean placeholder bust */
export const Host: React.FC<{ who: Who; talk: boolean; listen: boolean; t: number; u?: number; src?: string }> = ({ who, talk, listen, t, u = 9, src }) => {
  const left = who === 'bro', col = left ? C.bro : C.bhai;
  const beat = Math.exp(-(((t % 0.5) + 0.5) % 0.5) * 9);         // 120 BPM: a hop on every beat while talking
  const bob = talk ? -beat * 16 + Math.sin(t * 2 * Math.PI * 4.2) * 4 : Math.sin(t * 2 * Math.PI * 0.5 + (left ? 0 : 1)) * 2;
  const pop = 1 + 0.06 * (1 - sp(u, 0, 16, 0.5));               // a new pose lands with a small pop on the cut
  const s = (talk ? 1.04 : 0.97) * pop, dim = talk ? 1 : listen ? 0.86 : 0.92;
  return (
    <div style={{ position: 'absolute', left: left ? 10 : 550, top: 1290, width: 520, height: 630, transformOrigin: '50% 100%',
      transform: `translateY(${bob}px) scale(${s})`, filter: `saturate(${dim}) brightness(${0.92 + 0.08 * dim})` }}>
      <div style={{ position: 'absolute', left: 60, right: 60, bottom: 0, height: 420, borderRadius: '50% 50% 0 0', background: `radial-gradient(60% 70% at 50% 100%, ${col}55, transparent 70%)` }} />
      {src ? <Img src={staticFile(src)} style={{ position: 'absolute', left: -60, bottom: 0, width: 640, height: 555, objectFit: 'contain', objectPosition: '50% 100%' }} />
        : <svg viewBox="0 0 520 600" style={{ position: 'absolute', left: 0, bottom: 0, width: 520, height: 600 }}>
            <path d="M60 600 C60 470 150 420 260 420 C370 420 460 470 460 600 Z" fill={left ? '#2b3c66' : '#7a2440'} />
            <circle cx="260" cy="300" r="118" fill="#e8b48f" />
            <path d="M146 280 C150 190 210 160 262 160 C330 160 378 200 376 280 C352 230 300 214 262 216 C222 214 176 232 146 280 Z" fill="#1d1712" />
            <rect x="196" y="282" width="56" height="40" rx="12" fill="none" stroke="#cfd6e4" strokeWidth="6" /><rect x="268" y="282" width="56" height="40" rx="12" fill="none" stroke="#cfd6e4" strokeWidth="6" />
            <circle cx="224" cy="302" r="7" fill="#1d1712" /><circle cx="296" cy="302" r="7" fill="#1d1712" />
            <path d={talk && Math.sin(t * 40) > 0 ? 'M232 360 Q260 388 288 360 Q260 372 232 360' : 'M236 362 Q260 376 284 362'} fill="#7a3328" stroke="#7a3328" strokeWidth="4" />
          </svg>}
    </div>
  );
};
