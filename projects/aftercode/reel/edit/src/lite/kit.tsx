// LiteLLM reel kit: scene lookup, word cues in scene-local frames, the hazard palette and the shared type / chip / stamp
// pieces. Everything is a pure function of the frame.
import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { TIMINGS } from '../data/version';
import { wf } from '../lib/words';
import { clamp, dampedSpring, easeOutCubic, invLerp } from '../lib/anim';
import { F } from '../styles/typography';
import { C } from '../styles/theme';

export const FPS = 60;
export const K = {
  navy: '#070B14', navy2: '#101A2E', red: '#FF3B2F', redDeep: '#B3160E', orange: C.alert, mint: '#2EE59D', mintDeep: '#0E7A52',
  lunar: C.lunar, steel: C.steel, yellow: '#FFD23F',
} as const;
/** brief safe zones: 120 px sides, 220 px top, 320 px bottom */
export const SAFE = { top: 220, bottom: 1600, side: 120 } as const;

interface Seg { id: string; from: number; durationInFrames: number }
export const SEGS: Seg[] = (TIMINGS as unknown as { variants: { reel: { scenes: Seg[] } } }).variants.reel.scenes;
export const TOTAL: number = (TIMINGS as unknown as { variants: { reel: { durationInFrames: number } } }).variants.reel.durationInFrames;
export const seg = (id: string) => SEGS.find((s) => s.id === id)!;

/** the scene-local frame and a word-cue helper (local frame of a spoken word) */
export function useScene(id: string) {
  const f = useCurrentFrame();
  const s = seg(id);
  return { f, l: f - s.from, dur: s.durationInFrames, at: (line: string, word: string, nth = 0) => wf(line, word, nth) - s.from };
}

/** spring 0 -> 1 (with overshoot) starting at local frame `at` */
export const pop = (l: number, at: number, w = 16, z = 0.45) => (l < at ? 0 : dampedSpring((l - at) / FPS, w, z));
/** decaying 1 -> 0 hit at `at` */
export const hit = (l: number, at: number, len = 14) => (l < at ? 0 : Math.exp(-((l - at) / len) * 3));
/** deterministic camera shake (px) after hits */
export const shake = (l: number, hits: number[], amp = 14) => {
  let x = 0, y = 0;
  for (const h of hits) { const e = hit(l, h, 10); x += Math.sin(l * 2.7 + h) * amp * e; y += Math.cos(l * 3.3 + h * 1.7) * amp * e; }
  return { x, y };
};
export const fadeIn = (l: number, at: number, d = 10) => easeOutCubic(invLerp(at, at + d, l));

/** dark backdrop with a faint grid and a coloured glow (danger red .. safe mint) */
export const Bg: React.FC<{ glow?: string; amount?: number; at?: string }> = ({ glow = K.red, amount = 0.35, at = '50% 42%' }) => (
  <AbsoluteFill style={{ background: K.navy }}>
    <AbsoluteFill style={{ background: `radial-gradient(90% 60% at ${at}, ${glow}${Math.round(clamp(amount) * 255).toString(16).padStart(2, '0')} 0%, rgba(0,0,0,0) 70%)` }} />
    <AbsoluteFill style={{ backgroundImage: 'linear-gradient(rgba(236,239,244,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(236,239,244,0.045) 1px, transparent 1px)',
      backgroundSize: '60px 60px', maskImage: 'radial-gradient(80% 70% at 50% 45%, black 30%, transparent 100%)' }} />
  </AbsoluteFill>
);

/** scene entrance (whip settle + blur) so every cut has a pattern interrupt */
export const Enter: React.FC<{ l: number; dir?: 1 | -1; children: React.ReactNode; sx?: number; sy?: number }> = ({ l, dir = 1, children, sx = 0, sy = 0 }) => {
  const p = easeOutCubic(invLerp(0, 9, l));
  return (
    <AbsoluteFill style={{ transform: `translate(${sx}px, ${(1 - p) * 140 * dir + sy}px) scale(${1 + 0.06 * (1 - p)})`, filter: p < 1 ? `blur(${(1 - p) * 12}px)` : undefined }}>
      {children}
    </AbsoluteFill>
  );
};
export const Flash: React.FC<{ l: number; at: number; color?: string; max?: number; len?: number }> = ({ l, at, color = K.lunar, max = 0.45, len = 5 }) =>
  l >= at && l < at + len ? <AbsoluteFill style={{ background: color, opacity: max * (1 - (l - at) / len), pointerEvents: 'none' }} /> : null;

export const Kicker: React.FC<{ text: string; p: number; color?: string; y?: number }> = ({ text, p, color = K.orange, y = 250 }) => (
  <div style={{ position: 'absolute', left: SAFE.side, right: SAFE.side, top: y, display: 'flex', justifyContent: 'center', opacity: clamp(p * 1.5), transform: `translateY(${(1 - p) * 16}px)` }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 20px', borderRadius: 10, border: `2px solid ${color}`, background: 'rgba(7,11,20,0.75)' }}>
      <span style={{ width: 14, height: 14, borderRadius: 7, background: color, boxShadow: `0 0 12px ${color}` }} />
      <span style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 26, letterSpacing: '0.12em', color: K.lunar, whiteSpace: 'nowrap' }}>{text}</span>
    </div>
  </div>
);

/** a headline word that slams in on its own cue (spring scale + fade) */
export const Slam: React.FC<{ l: number; at: number; children: React.ReactNode; size?: number; color?: string; style?: React.CSSProperties; from?: number }> = ({ l, at, children, size = 120, color = K.lunar, style, from = 1.6 }) => {
  if (l < at - 1) return <span style={{ display: 'inline-block', opacity: 0, fontSize: size, ...style }}>{children}</span>;
  const p = pop(l, at, 18, 0.5);
  return (
    <span style={{ display: 'inline-block', fontFamily: F.head, fontWeight: 900, fontSize: size, lineHeight: 1, letterSpacing: '-0.02em', color,
      transform: `scale(${from + (1 - from) * p})`, opacity: clamp((l - at + 1) / 3), textShadow: '0 8px 40px rgba(0,0,0,0.6)', whiteSpace: 'nowrap', ...style }}>{children}</span>
  );
};

export const Chip: React.FC<{ p: number; text: string; color?: string; size?: number; style?: React.CSSProperties; sub?: string }> = ({ p, text, color = K.red, size = 30, style, sub }) => (
  <div style={{ display: 'inline-flex', flexDirection: 'column', gap: 4, padding: `${size * 0.4}px ${size * 0.7}px`, borderRadius: 12, background: 'rgba(7,11,20,0.88)',
    border: `2px solid ${color}`, boxShadow: `0 10px 30px rgba(0,0,0,0.5), 0 0 22px ${color}44`, opacity: clamp(p * 1.4), transform: `scale(${0.85 + 0.15 * p})`, ...style }}>
    <span style={{ fontFamily: F.head, fontWeight: 800, fontSize: size, color: K.lunar, whiteSpace: 'nowrap', lineHeight: 1.1 }}>{text}</span>
    {sub ? <span style={{ fontFamily: F.mono, fontWeight: 600, fontSize: size * 0.62, color: K.steel, whiteSpace: 'nowrap' }}>{sub}</span> : null}
  </div>
);

/** rubber stamp: lands big and rotates into place */
export const Stamp: React.FC<{ l: number; at: number; text: string; color?: string; size?: number; rot?: number; style?: React.CSSProperties }> = ({ l, at, text, color = K.red, size = 110, rot = -7, style }) => {
  if (l < at) return null;
  const p = pop(l, at, 20, 0.42);
  return (
    <div style={{ position: 'absolute', left: '50%', top: '50%', transform: `translate(-50%, -50%) rotate(${rot}deg) scale(${2.2 - 1.2 * p})`, opacity: clamp((l - at) / 3), ...style }}>
      <div style={{ padding: `${size * 0.12}px ${size * 0.3}px`, border: `${Math.max(6, size * 0.08)}px solid ${color}`, borderRadius: size * 0.16, color,
        fontFamily: F.head, fontWeight: 900, fontSize: size, lineHeight: 1, letterSpacing: '0.01em', whiteSpace: 'nowrap', background: 'rgba(7,11,20,0.55)',
        boxShadow: `0 0 50px ${color}55`, textShadow: `0 0 30px ${color}66` }}>{text}</div>
    </div>
  );
};

export const Tag: React.FC<{ text?: string; x?: number; y: number; anchor?: 'left' | 'right' }> = ({ text = 'ILLUSTRATION', x = SAFE.side, y, anchor = 'right' }) => (
  <div style={{ position: 'absolute', top: y, ...(anchor === 'right' ? { right: x } : { left: x }), fontFamily: F.mono, fontWeight: 700, fontSize: 18, letterSpacing: '0.16em',
    color: 'rgba(236,239,244,0.7)', padding: '6px 10px', borderRadius: 6, background: 'rgba(7,11,20,0.7)', border: '1px solid rgba(236,239,244,0.25)' }}>{text}</div>
);
