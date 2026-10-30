// Cover (1080x1920): 2-6 word headline, the official PaperPilot icon over a paper stack as the subject, one honest badge,
// Tech Pe Trek logo bottom-right at ~75 %. Everything important sits inside the 3:4 grid crop (y 240..1680).
import React from 'react';
import { AbsoluteFill, Img, staticFile } from 'remotion';
import { Logo, Sheet, Stage } from '../components/kit';
import { C, FONT, glow } from '../themes/tokens';

export const Cover: React.FC = () => (
  <AbsoluteFill style={{ background: C.base }}>
    <Stage g={0} pool={C.cyan} pool2={C.rust}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 290, textAlign: 'center', fontFamily: FONT.display, fontWeight: 700, lineHeight: 0.92, letterSpacing: -4 }}>
        <div style={{ fontSize: 250, color: C.coral, textShadow: `${glow(0.8, C.coral, 60)}, 0 14px 0 #7A1E2A` }}>RUKO!</div>
        <div style={{ fontSize: 108, color: C.ink, marginTop: 30 }}>PDF UPLOAD</div>
        <div style={{ fontSize: 108, color: C.mint, textShadow: glow(0.6, C.mint, 40) }}>MAT KARO</div>
      </div>
      <div style={{ position: 'absolute', left: 300, top: 900, width: 360, height: 480, perspective: 1400 }}>
        <div style={{ position: 'absolute', inset: 0, transformStyle: 'preserve-3d', transform: 'rotateX(14deg) rotateY(-24deg)' }}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} style={{ position: 'absolute', inset: 0, transform: `translateZ(${i * 34}px) translateX(${(i - 1.5) * 60}px) rotate(${(i - 1.5) * 5}deg)` }}>
              <Sheet title={['INVOICE', 'REPORT', 'NOTES', 'PRIVATE'][i]} tint={[C.cyan, C.rust, C.mint, C.coral][i]} seed={i + 1} pages={1} tag={false} />
            </div>
          ))}
        </div>
      </div>
      <Logo size={230} style={{ left: 620, top: 1190, boxShadow: `0 0 70px ${C.rust}99`, transform: 'rotate(6deg)' }} />
      <div style={{ position: 'absolute', left: 120, top: 1440, padding: '14px 24px', borderRadius: 18, background: C.rust, color: C.base, fontFamily: FONT.mono, fontWeight: 700, fontSize: 34, letterSpacing: 2,
        transform: 'rotate(-3deg)', boxShadow: glow(0.6, C.rust, 40) }}>OPEN SOURCE · LOCAL · MCP</div>
      <div style={{ position: 'absolute', left: 120, top: 1560, fontFamily: FONT.mono, fontSize: 24, color: C.ink2 }}>by Krushna Vardhan Reddy · Apache-2.0</div>
      <Img src={staticFile('brand/techpe-trek.jpg')} style={{ position: 'absolute', right: 90, top: 1540, width: 110, height: 110, borderRadius: 22, opacity: 0.75 }} />
    </Stage>
  </AbsoluteFill>
);
