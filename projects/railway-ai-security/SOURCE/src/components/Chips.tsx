// Two stat chips (mono label over a bold value), equal tiles across the card width; each pops on its beat.
import React from 'react';
import { clamp, dampedSpring, easeOutCubic, invLerp } from '../lib/anim';
import { C } from '../styles/theme';
import { F } from '../styles/typography';
import { TYPE, fitSize, trackingCss } from './cardText';
import type { Variant } from './TypeTag';

export interface Chip { label: string; value: string }
interface Geo { x: number; y: number; h: number; gap: number; label: number; value: number }
interface Props { chips: Chip[]; geo: Geo; width: number; f: number; at: number[]; variant?: Variant; still?: boolean; fps?: number }

export const Chips: React.FC<Props> = ({ chips, geo, width, f, at, variant = 'paper', still, fps = 60 }) => {
  const dark = variant === 'dark';
  const list = chips.slice(0, 2);
  const n = Math.max(1, list.length);
  const tileW = (width - geo.gap * (n - 1)) / n;
  const padX = Math.round(geo.h * 0.3);
  return (
    <div style={{ position: 'absolute', left: geo.x, top: geo.y, width, height: geo.h, display: 'flex', gap: geo.gap }}>
      {list.map((c, i) => {
        const t = still ? 99 : (f - (at[i] ?? at[0] ?? 0)) / fps;
        const s = dampedSpring(t, 15, 0.52);
        const o = easeOutCubic(clamp(t * 6));
        const bar = easeOutCubic(invLerp(0.05, 0.45, t));
        const vSize = fitSize(c.value, tileW - padX * 2 - 6, geo.value, TYPE.value, geo.value * 0.62);
        const lSize = Math.min(geo.label * 0.9, fitSize(c.label.toUpperCase(), tileW - padX * 2 - 6, geo.label * 0.9, { family: F.mono, weight: 600, tracking: 0.12 }, geo.label * 0.7));
        return (
          <div key={i} style={{ position: 'relative', width: tileW, height: geo.h, borderRadius: 14, boxSizing: 'border-box',
            background: dark ? 'rgba(236,239,244,0.055)' : 'rgba(255,253,247,0.62)',
            border: `1px solid ${dark ? 'rgba(236,239,244,0.12)' : 'rgba(18,18,18,0.12)'}`,
            boxShadow: dark ? 'none' : '0 1px 0 rgba(255,255,255,0.7) inset, 0 6px 16px -10px rgba(60,40,10,0.35)',
            opacity: t <= 0 ? 0 : o, transform: `translateY(${(1 - s) * 14}px) scale(${0.9 + 0.1 * s})`, transformOrigin: '20% 60%',
            overflow: 'hidden' }}>
            {/* accent rule drawing down the left edge */}
            <div style={{ position: 'absolute', left: 0, top: 0, width: 4, height: `${bar * 100}%`, background: C.alert }} />
            <div style={{ position: 'absolute', left: padX, top: Math.round(geo.h * 0.15), fontFamily: F.mono, fontSize: lSize, fontWeight: 600,
              letterSpacing: '0.12em', color: dark ? '#FF7B47' : C.alertDeep, lineHeight: 1, whiteSpace: 'nowrap', textTransform: 'uppercase' }}>{c.label}</div>
            <div style={{ position: 'absolute', left: padX, top: Math.round(geo.h * 0.15 + lSize + geo.h * 0.1), fontFamily: F.head, fontSize: vSize, fontWeight: TYPE.value.weight,
              letterSpacing: trackingCss(TYPE.value), color: dark ? C.lunar : C.ink, lineHeight: 1, whiteSpace: 'nowrap' }}>{c.value}</div>
          </div>
        );
      })}
    </div>
  );
};
