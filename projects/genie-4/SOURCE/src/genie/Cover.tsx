// Cover (cover.png): a filmi poster. Headline "MERE PAAS PROMPT HAI!", a real frame of Google DeepMind's Genie 4 dragon
// demo in the gold marquee (credited; its WASD UI shows it is interactive), a small TRUSTED TESTERS badge, the TechpeTrek logo.
// Critical text inside x 110..970, y 220..1550.
import React from 'react';
import { AbsoluteFill, Img, staticFile } from 'remotion';
import { FONT, Filmi, P, ink } from './kit';
import { Ground } from './World';

export const Cover: React.FC = () => {
  const w = 900, h = (w * 9) / 16, n = 34;
  return (
    <AbsoluteFill style={{ background: P.paper }}>
      <Ground cy={44} heat={1.15} />
      <div style={{ position: 'absolute', left: 60, right: 60, top: 220, textAlign: 'center' }}>
        <div><Filmi text="Mere paas" size={150} face={P.card} /></div>
        <div style={{ marginTop: 8, whiteSpace: "nowrap" }}><Filmi text="Prompt hai!" size={150} face={P.magenta} /></div>
      </div>
      <div style={{ position: 'absolute', left: 90 - 24, top: 700 - 24, width: w + 48, height: h + 48, borderRadius: 18, transform: 'rotate(-2deg)',
        background: `linear-gradient(145deg, ${P.goldLite} 0%, ${P.gold} 35%, ${P.goldDeep} 100%)`, boxShadow: `12px 14px 0 ${P.ink}` }}>
        {Array.from({ length: n }, (_, i) => {
          const per = 2 * (w + h), d = (i / n) * per;
          const [bx, by] = d < w ? [d, 0] : d < w + h ? [w, d - w] : d < 2 * w + h ? [w - (d - w - h), h] : [0, h - (d - 2 * w - h)];
          const on = i % 3 === 0;
          return <div key={i} style={{ position: 'absolute', left: bx + 24 - 8, top: by + 24 - 8, width: 16, height: 16, borderRadius: 8, background: on ? '#FFF6C9' : '#D49A1A', boxShadow: on ? '0 0 14px 4px rgba(255,214,90,0.85)' : undefined }} />;
        })}
        <Img src={staticFile('frames/cover_dragon.jpg')} style={{ position: 'absolute', left: 24, top: 24, width: w, height: h, objectFit: 'cover', borderRadius: 6 }} />
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 1250, textAlign: 'center' }}>
        <Filmi text="Genie 4: AI world mein ghuso" size={70} face={P.saffron} stretch={70} />
      </div>
      <div style={{ position: 'absolute', left: 110, top: 1380, padding: '10px 20px', borderRadius: 14, background: P.ink, color: P.goldLite, boxShadow: ink(6, P.magenta),
        fontFamily: FONT.poster, fontStretch: '80%', fontWeight: 900, fontSize: 40, textTransform: 'uppercase' }}>Trusted testers only</div>
      <div style={{ position: 'absolute', left: 110, top: 1470, fontFamily: FONT.ui, fontWeight: 600, fontSize: 22, color: P.ink2 }}>Frame: Google DeepMind Genie 4 demo · deepmind.google</div>
      <Img src={staticFile('brand/techpe-trek.jpg')} style={{ position: 'absolute', right: 110, top: 1370, width: 140, height: 140, borderRadius: 26, border: `4px solid ${P.ink}`, boxShadow: ink(6) }} />
    </AbsoluteFill>
  );
};
