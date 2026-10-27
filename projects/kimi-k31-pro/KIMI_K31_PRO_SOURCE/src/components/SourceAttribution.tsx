// The small attribution line under any number: the claim's qualifier plus the source, read straight from verifiedClaims.
import React from 'react';
import { useCurrentFrame } from 'remotion';
import { CLAIMS, LABELS, type ClaimId } from '../data/verifiedClaims';
import { reveal } from '../lib/anim';
import { useLayout } from '../lib/layout';
import { C } from '../styles/theme';
import { F } from '../styles/typography';

export const attributionText = (id: ClaimId) => {
  const c = CLAIMS[id];
  const src = c.source === 'article' ? LABELS.source : 'Source: Kimi Code docs (What\'s New)';
  return c.qualifier ? `${c.qualifier} · ${src}` : src;
};

export const SourceAttribution: React.FC<{ id?: ClaimId; text?: string; at?: number; style?: React.CSSProperties; light?: boolean; size?: number }> = ({ id, text, at = 0, style, light, size }) => {
  const f = useCurrentFrame();
  const L = useLayout();
  const s = text ?? (id ? attributionText(id) : '');
  return (
    <div style={{ fontFamily: F.mono, fontSize: size ?? L.t.attribution, color: light ? C.steel : C.silver, letterSpacing: '0.02em', lineHeight: 1.35,
      opacity: 0.92 * reveal(f, at, 12), ...style }}>{s}</div>
  );
};
