// Cover (1080x1920): the hero bottle under a frozen petal burst, one red trail behind it, the gold name above and the
// official wordmark below. Maison Milan branding only. Everything sits inside the 3:4 grid crop (y 240..1680).
import React from 'react';
import { AbsoluteFill, Img, staticFile } from 'remotion';
import { Bottle, burst, Grain, Petals, StageFloor, Velvet, goldText } from '../components/world';
import { C, FONT } from '../themes/tokens';

export const Cover: React.FC = () => {
  const pet = burst(40, 7, 8.42, 8.0, { x: 540, y: 820 }, 0.75);
  return (
    <AbsoluteFill style={{ background: C.base }}>
      <Velvet t={0} cx={540} cy={1000} power={1.25} />
      <StageFloor y={1490} />
      <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
        <defs>
          <linearGradient id="cv" x1="1" x2="0"><stop offset="0" stopColor="#FFE3D6" /><stop offset="0.07" stopColor={C.ember} /><stop offset="1" stopColor={C.rouge} stopOpacity="0" /></linearGradient>
          <filter id="cvG" x="-20%" y="-300%" width="140%" height="700%"><feGaussianBlur stdDeviation="18" /></filter>
        </defs>
        <g transform="rotate(-8 540 1000)">
          <rect x={-200} y={975} width={1500} height={50} rx={25} fill={C.ember} opacity={0.55} filter="url(#cvG)" />
          <rect x={-200} y={988} width={1500} height={24} rx={12} fill="url(#cv)" />
        </g>
      </svg>
      <Petals list={pet.filter((q) => q.z < 0)} seed={7} />
      <Bottle x={540} base={1490} h={900} rim={0.75} reflect={0.3}
        sweeps={[{ p: 0.42, a: 0.85, angle: 105, width: 10 }]} />
      <Petals list={pet.filter((q) => q.z >= 0)} seed={8} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: 280, textAlign: 'center', fontFamily: FONT.display, fontWeight: 600, fontSize: 112,
        letterSpacing: 6, lineHeight: 1.05, backgroundImage: goldText, WebkitBackgroundClip: 'text', color: 'transparent', filter: 'drop-shadow(0 6px 24px rgba(0,0,0,0.7))' }}>
        REDEMPTION<br />ROUGE
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 530, textAlign: 'center', fontFamily: FONT.serif, fontStyle: 'italic', fontSize: 52, color: C.ivory }}>Eau de Parfum</div>
      <Img src={staticFile('img/wordmark.png')} style={{ position: 'absolute', left: 540 - 140, top: 1525, width: 280 }} />
      <Grain frame={0} amount={0.06} />
    </AbsoluteFill>
  );
};
