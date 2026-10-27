// The case's attack-type tag: one small, persistent, colour-coded chip in the card's top bar, so a breach is never confused
// with research. Solid fill = confirmed / official; dashed outline = reported (not confirmed); thin outline = internal test.
// Decodes in (mono scramble settling left to right) while the pill wipes open.
import React from 'react';
import { easeOutCubic, easeOutExpo, invLerp } from '../lib/anim';
import { hash } from '../lib/rng';
import { C } from '../styles/theme';
import { F } from '../styles/typography';

export type Variant = 'paper' | 'dark';
interface TagLook { fill: string; ink: string; border?: string; dashed?: boolean; dot: 'solid' | 'half' | 'ring' | 'diamond' | 'tri' | 'check' }

const COBALT = '#2D4BB8', AMBER = '#E9B949';
/** colour code per tag (paper card, dark card) */
const LOOKS: Record<string, [TagLook, TagLook]> = {
  'CONFIRMED BREACH': [{ fill: C.alert, ink: C.ink, dot: 'solid' }, { fill: C.alert, ink: C.ink, dot: 'solid' }],
  'AI-ASSISTED INTRUSION': [{ fill: 'rgba(198,47,42,0.07)', ink: C.string, border: C.string, dashed: true, dot: 'half' },
    { fill: 'rgba(255,122,92,0.08)', ink: '#FF8A6E', border: '#FF8A6E', dashed: true, dot: 'half' }],
  'GOVERNMENT ADVISORY': [{ fill: COBALT, ink: '#FFFFFF', dot: 'tri' }, { fill: '#3D5FD6', ink: '#FFFFFF', dot: 'tri' }],
  'SECURITY RESEARCH': [{ fill: AMBER, ink: C.ink, dot: 'diamond' }, { fill: AMBER, ink: C.ink, dot: 'diamond' }],
  'INTERNAL TEST': [{ fill: 'transparent', ink: C.ink2, border: C.ink2, dot: 'ring' }, { fill: 'transparent', ink: C.steel, border: C.steel, dot: 'ring' }],
  ACTION: [{ fill: C.mint, ink: '#FFFFFF', dot: 'check' }, { fill: 'rgba(126,227,182,0.10)', ink: C.mintSoft, border: C.mintSoft, dot: 'check' }],
  NEUTRAL: [{ fill: C.ink, ink: C.paper, dot: 'solid' }, { fill: C.lunar, ink: C.graphite, dot: 'solid' }],
};
export function tagLook(tag: string, variant: Variant): TagLook {
  const key = Object.keys(LOOKS).find((k) => tag.toUpperCase().startsWith(k)) ?? 'NEUTRAL';
  return LOOKS[key][variant === 'dark' ? 1 : 0];
}

const SCR = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789/#';
const Dot: React.FC<{ kind: TagLook['dot']; s: number; color: string }> = ({ kind, s, color }) => (
  <svg width={s} height={s} viewBox="0 0 10 10" style={{ flex: 'none' }}>
    {kind === 'solid' && <circle cx={5} cy={5} r={4} fill={color} />}
    {kind === 'half' && <><circle cx={5} cy={5} r={3.6} fill="none" stroke={color} strokeWidth={1.4} /><path d="M5 1.4 A3.6 3.6 0 0 1 5 8.6 Z" fill={color} /></>}
    {kind === 'ring' && <circle cx={5} cy={5} r={3.5} fill="none" stroke={color} strokeWidth={1.5} />}
    {kind === 'diamond' && <path d="M5 0.8 L9.2 5 L5 9.2 L0.8 5 Z" fill={color} />}
    {kind === 'tri' && <path d="M5 1 L9.3 8.8 H0.7 Z" fill={color} />}
    {kind === 'check' && <path d="M1.4 5.4 L4 7.9 L8.8 2.4" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />}
  </svg>
);

interface Props { tag: string; f: number; at?: number; variant?: Variant; size?: number; style?: React.CSSProperties; still?: boolean }

/** `f` = frame, `at` = decode start; `size` = mono font size (chip height = 1.65 x size) */
export const TypeTag: React.FC<Props> = ({ tag, f, at = 0, variant = 'paper', size = 19, style, still }) => {
  const look = tagLook(tag, variant);
  const t = still ? 999 : f - at;
  const open = easeOutExpo(invLerp(0, 16, t));
  const h = Math.round(size * 1.65);
  // split "(reported)"-style caveats so they read as a caveat (lighter, lowercase as written)
  const m = tag.match(/^(.*?)(\s*\(.*\))?$/);
  const main = (m?.[1] ?? tag).trim(), caveat = (m?.[2] ?? '').trim();
  const chars = [...main];
  const n = chars.length;
  const decoded = chars.map((ch, i) => {
    const settleAt = 6 + i * 0.9;
    if (ch === ' ' || ch === '-' || t >= settleAt) return ch;
    if (t < 2 + i * 0.45) return ' ';
    return SCR[Math.floor(hash(i, Math.floor(t / 2), n) * SCR.length)];
  }).join('');
  const capP = easeOutCubic(invLerp(6 + n * 0.9 - 4, 6 + n * 0.9 + 8, t));
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: size * 0.5, height: h, padding: `0 ${size * 0.72}px 0 ${size * 0.6}px`,
      borderRadius: h / 2, background: look.fill, color: look.ink, boxSizing: 'border-box',
      border: look.border ? `${Math.max(1.5, size * 0.09)}px ${look.dashed ? 'dashed' : 'solid'} ${look.border}` : undefined,
      clipPath: `inset(0 ${(1 - open) * 100}% 0 0 round ${h / 2}px)`, opacity: t < 0 ? 0 : 1,
      fontFamily: F.mono, fontSize: size, fontWeight: 700, letterSpacing: '0.07em', whiteSpace: 'pre', lineHeight: 1, ...style }}>
      <Dot kind={look.dot} s={size * 0.62} color={look.ink} />
      <span>{decoded}</span>
      {caveat && <span style={{ fontWeight: 400, letterSpacing: '0.02em', opacity: 0.85 * capP, marginLeft: -size * 0.15 }}>{caveat}</span>}
    </div>
  );
};
