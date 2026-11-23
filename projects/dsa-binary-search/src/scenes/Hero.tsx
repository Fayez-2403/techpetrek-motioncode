// S5a THE TURN: "array sorted hota hi nahi!" (cards jumble and shake) -> "answer pe binary search": the cards blow
// away and a glowing scale of ANSWERS slides in. The screenshot frame of the film.
import React from 'react';
import { C, FONT } from '../themes/tokens';
import { ev } from '../tl';
import { clamp, easeInCubic, easeOutQuint, lerp } from '../animation/anim';
import { Plank, land } from './ScaleBar';

const J = [19, 4, 52, 8, 31, 45, 3, 60, 12, 37];

export const Hero: React.FC<{ t: number }> = ({ t }) => {
  const h = ev('heroTitle');
  const blow = easeInCubic(clamp((t - h) / 0.45));
  const scaleIn = easeOutQuint(clamp((t - h - 0.15) / 0.5));
  return (
    <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
      <defs>
        <radialGradient id="heroGlow" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor={C.gold} stopOpacity={0.45} /><stop offset="100%" stopColor={C.gold} stopOpacity={0} /></radialGradient>
      </defs>
      {blow < 1 && J.map((v, i) => {
        const bx = 80 + (i % 5) * 186, by = 420 + Math.floor(i / 5) * 190;
        const jit = Math.sin(t * 31 + i * 2.1) * 6, rot = Math.sin(t * 17 + i) * 7 + (i % 2 ? 8 : -8);
        const dx = (i % 2 ? 1 : -1) * 1400 * blow, dy = -300 * blow + (i - 5) * 40 * blow;
        return (
          <g key={i} transform={`translate(${bx + jit + dx} ${by + dy}) rotate(${rot + blow * 160 * (i % 2 ? 1 : -1)} 70 60)`}>
            <rect x={0} y={8} width={140} height={130} rx={16} fill={C.deep} opacity={0.5} />
            <rect x={0} y={0} width={140} height={130} rx={16} fill="#6A6FB0" />
            <text x={70} y={86} textAnchor="middle" fontFamily={FONT.display} fontWeight={900} fontSize={62} fill="#fff">{v}</text>
          </g>
        );
      })}
      {t < h && (
        <g transform={`translate(540 ${360}) scale(${land(t, ev('frustrate') + 0.3, 0.2)})`}>
          <text x={0} y={0} textAnchor="middle" fontFamily={FONT.display} fontWeight={900} fontSize={64} fill={C.na}>sorted? nahi.</text>
        </g>
      )}
      {scaleIn > 0 && (
        <g>
          <ellipse cx={540} cy={760} rx={560} ry={300} fill="url(#heroGlow)" opacity={scaleIn} />
          <g transform={`translate(${lerp(900, 0, scaleIn)} 0)`}>
            <Plank x0={90} x1={990} y={760} view={{ lo: 1, hi: 30 }} />
          </g>
          <g transform={`translate(540 520) scale(${land(t, h + 0.2, 0.26)})`}>
            <text x={0} y={0} textAnchor="middle" fontFamily={FONT.display} fontWeight={900} fontSize={98} fill="#fff" style={{ fontStretch: '80%' }}>ANSWER PE</text>
            <text x={0} y={100} textAnchor="middle" fontFamily={FONT.display} fontWeight={900} fontSize={98} fill={C.gold} style={{ fontStretch: '80%' }}>BINARY SEARCH</text>
          </g>
          <g transform={`translate(540 920) scale(${land(t, h + 0.6, 0.2)})`}>
            <text x={0} y={0} textAnchor="middle" fontFamily={FONT.ui} fontWeight={750} fontSize={40} fill={C.scale}>array nahi, answer ki range ko kaato</text>
          </g>
        </g>
      )}
    </svg>
  );
};
