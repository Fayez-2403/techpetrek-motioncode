// Animatic placeholder: the scene's name and plan, so the film plays end to end before a scene is built.
import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { reveal } from '../lib/anim';
import { useLayout } from '../lib/layout';
import { C } from '../styles/theme';
import { F } from '../styles/typography';

export const stub = (title: string, plan: string) => {
  const S: React.FC<{ dur: number }> = ({ dur }) => {
    const f = useCurrentFrame();
    const L = useLayout();
    return (
      <AbsoluteFill style={{ background: C.night, alignItems: 'center', justifyContent: 'center', padding: L.safe.side, textAlign: 'center' }}>
        <div style={{ fontFamily: F.display, fontSize: L.t.title * 0.8, color: C.lunar, opacity: reveal(f, 0, 10) }}>{title}</div>
        <div style={{ fontFamily: F.mono, fontSize: L.t.body, color: C.silver, marginTop: 24, maxWidth: 1200 }}>{plan}</div>
        <div style={{ position: 'absolute', bottom: L.tall ? 700 : 160, width: '60%', height: 4, background: C.dim }}>
          <div style={{ width: `${(f / dur) * 100}%`, height: 4, background: C.cyan }} />
        </div>
      </AbsoluteFill>
    );
  };
  return S;
};
