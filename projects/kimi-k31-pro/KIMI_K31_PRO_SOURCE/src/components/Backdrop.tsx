// Shared finishing layers: a radial backdrop, deterministic film grain and a vignette.
import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { C } from '../styles/theme';

export const Backdrop: React.FC<{ from?: string; to?: string; at?: string }> = ({ from = C.navy, to = C.void, at = '50% 45%' }) => (
  <AbsoluteFill style={{ background: `radial-gradient(120% 90% at ${at}, ${from} 0%, ${to} 70%)` }} />
);

/** fine grain that changes every frame but deterministically (seed = frame) */
export const Grain: React.FC<{ opacity?: number }> = ({ opacity = 0.06 }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: 'none', mixBlendMode: 'overlay', opacity, zIndex: 90 }}>
      <svg width="100%" height="100%">
        <filter id={`g${f % 7}`}><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={f % 97} stitchTiles="stitch" /><feColorMatrix type="saturate" values="0" /></filter>
        <rect width="100%" height="100%" filter={`url(#g${f % 7})`} />
      </svg>
    </AbsoluteFill>
  );
};

export const Vignette: React.FC<{ strength?: number }> = ({ strength = 0.55 }) => (
  <AbsoluteFill style={{ pointerEvents: 'none', zIndex: 85, background: `radial-gradient(120% 100% at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,6,${strength}) 100%)` }} />
);
