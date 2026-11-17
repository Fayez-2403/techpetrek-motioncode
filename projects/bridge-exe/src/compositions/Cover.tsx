// Cover (1080x1920), from two real plates of the app (web/scripts/cover_shots.ts): the same bridge, camera and run,
// left as the cyan CAD x-ray, right as the solver's load-path lens (deflection ×40). Headline variants for A/B:
// main "AI BUILT THIS BRIDGE?!", exe "BRIDGE.EXE", survive "CAN IT SURVIVE?". Text stays out of the top 240 and
// bottom 300 px. No vendor logos; the TechpeTrek mark bottom-right at 75 %.
import React from 'react';
import { AbsoluteFill, Img, staticFile } from 'remotion';
import { C, FONT } from '../themes/tokens';

const HEAD = {
  main: ['AI BUILT', 'THIS BRIDGE?!'],
  exe: ['BRIDGE', '.EXE'],
  survive: ['CAN IT', 'SURVIVE?'],
} as const;

export const Cover: React.FC<{ variant: keyof typeof HEAD }> = ({ variant }) => {
  const [l1, l2] = HEAD[variant];
  const split = 'polygon(0 0, 62% 0, 38% 100%, 0 100%)';
  return (
    <AbsoluteFill style={{ background: C.base }}>
      <Img src={staticFile('cover/force.png')} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', filter: 'saturate(1.15) contrast(1.06)' }} />
      <Img src={staticFile('cover/cad.png')} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', clipPath: split, filter: 'saturate(1.2) brightness(0.92) hue-rotate(-6deg)' }} />
      <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}><line x1={1080 * 0.62} y1={0} x2={1080 * 0.38} y2={1920} stroke={C.accent} strokeWidth={5} opacity={0.85} /></svg>
      <AbsoluteFill style={{ background: 'linear-gradient(180deg, rgba(3,9,16,0.82) 0%, rgba(3,9,16,0.55) 30%, transparent 46%, transparent 70%, rgba(3,9,16,0.6) 86%)' }} />
      <div style={{ position: 'absolute', left: 50, right: 50, top: 270, textAlign: 'center' }}>
        <div style={{ fontFamily: FONT.display, fontWeight: 900, fontStretch: '70%', fontSize: variant === 'exe' ? 230 : 172, lineHeight: 0.88, color: '#fff', textShadow: '0 10px 0 #020a12, 0 0 60px rgba(99,229,250,0.5)' }}>
          {l1}<br /><span style={{ color: variant === 'exe' ? C.accent : C.amber }}>{l2}</span></div>
        <div style={{ marginTop: 26, fontFamily: FONT.display, fontWeight: 800, fontStretch: '82%', fontSize: 46, letterSpacing: '0.1em', color: C.ink }}>CLAUDE × STRUCTURAL ENGINEERING</div>
        <div style={{ display: 'inline-block', marginTop: 22, padding: '10px 24px', borderRadius: 14, background: 'rgba(7,21,34,0.86)', border: `2px solid ${C.accent}88`,
          fontFamily: FONT.mono, fontWeight: 700, fontSize: 30, color: C.accent, letterSpacing: '0.08em' }}>DESIGN • LOAD • ANALYZE</div>
      </div>
      <div style={{ position: 'absolute', left: 60, top: 1380, fontFamily: FONT.mono, fontSize: 26, color: C.accent, padding: '6px 14px', borderRadius: 10, background: 'rgba(7,21,34,0.8)' }}>CAD MODEL</div>
      <div style={{ position: 'absolute', right: 60, top: 1380, fontFamily: FONT.mono, fontSize: 26, color: C.amber, padding: '6px 14px', borderRadius: 10, background: 'rgba(7,21,34,0.8)' }}>SOLVER FORCES · ×40</div>
      <div style={{ position: 'absolute', left: 60, top: 1560, fontFamily: FONT.mono, fontSize: 22, color: C.ink2 }}>educational simulation · not construction approval</div>
      <Img src={staticFile('brand/techpe-trek.jpg')} style={{ position: 'absolute', right: 60, top: 1470, width: 120, height: 120, borderRadius: 20, opacity: 0.75 }} />
    </AbsoluteFill>
  );
};
