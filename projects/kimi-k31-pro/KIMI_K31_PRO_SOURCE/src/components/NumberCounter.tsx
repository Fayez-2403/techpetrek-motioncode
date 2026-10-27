// A number that counts up to a verified value (pass values from verifiedClaims.N only).
import React from 'react';
import { useCurrentFrame } from 'remotion';
import { countUp, fmt, reveal } from '../lib/anim';
import { C } from '../styles/theme';
import { F } from '../styles/typography';

export const NumberCounter: React.FC<{ value: number; decimals?: number; at?: number; dur?: number; size: number; suffix?: string; prefix?: string;
  color?: string; font?: string; weight?: number; style?: React.CSSProperties }> = ({ value, decimals = 1, at = 0, dur = 36, size, suffix = '', prefix = '', color = C.amber, font = F.display, weight = 700, style }) => {
  const f = useCurrentFrame();
  const v = countUp(f, at, dur, value);
  return (
    <span style={{ fontFamily: font, fontSize: size, fontWeight: weight, color, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em', lineHeight: 1,
      opacity: reveal(f, at - 4, 8), whiteSpace: 'nowrap', ...style }}>{prefix}{fmt(v, decimals)}{suffix}</span>
  );
};
