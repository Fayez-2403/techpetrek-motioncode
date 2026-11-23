// v2 RULE: the three clues land one by one as Bhai says them, then Bro's "phod dunga" confetti. CTA: BINARY.
import React from 'react';
import { C, FONT } from '../themes/tokens';
import { ev } from '../tl';
import { clamp, easeOutCubic } from '../animation/anim';
import { Plank, land } from './ScaleBar';

const CLUES: [string, string, string][] = [['c1', 'SUBARRAY / SUBSTRING', 'lagatar, bina gap'], ['c2', 'FIXED SIZE', 'size k ki khidki'], ['c3', 'LONGEST / SHORTEST', 'shart ke saath: badhao, ghatao']];

export const Rule: React.FC<{ t: number }> = ({ t }) => {
  const ph = t - ev('phod');
  return (
    <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
      <g transform={`translate(540 340) scale(${1 + 0.15 * (1 - easeOutCubic(clamp((t - ev('tieOff') - 0.1) / 0.25)))})`} opacity={clamp((t - ev('tieOff') - 0.1) / 0.06)}>
        <text x={0} y={0} textAnchor="middle" fontFamily={FONT.display} fontWeight={900} fontSize={62} fill="#fff" style={{ fontStretch: '78%' }}>3 ISHAARE = SLIDING WINDOW</text>
      </g>
      {CLUES.map(([k, big, small], i) => {
        if (t < ev(k)) return null;
        const y = 470 + i * 190;
        return (
          <g key={k} transform={`translate(540 ${y}) scale(${land(t, ev(k), 0.2)})`}>
            <rect x={-430} y={0} width={860} height={160} rx={30} fill={C.paper} stroke={C.ink} strokeWidth={6} />
            <circle cx={-350} cy={80} r={46} fill={C.scale} stroke={C.ink} strokeWidth={5} />
            <text x={-350} y={98} textAnchor="middle" fontFamily={FONT.display} fontWeight={900} fontSize={52} fill={C.ink}>{i + 1}</text>
            <text x={-270} y={82} fontFamily={FONT.display} fontWeight={900} fontSize={big.length > 12 ? 52 : 66} fill={C.ink}>{big}</text>
            <text x={-270} y={128} fontFamily={FONT.ui} fontWeight={750} fontSize={32} fill="#5A5D78">{small}</text>
          </g>
        );
      })}
      {ph > 0 && ph < 1.6 && Array.from({ length: 46 }, (_, i) => {
        const a = (i * 137.5) * (Math.PI / 180), sp = 500 + (i % 7) * 90;
        const x = 540 + Math.cos(a) * sp * ph, y = 760 + Math.sin(a) * sp * ph * 0.7 + 900 * ph * ph;
        return <rect key={i} x={x} y={y} width={18} height={10} rx={3} fill={[C.scale, C.gold, C.haan, '#FF8FB1', '#7FC8FF'][i % 5]}
          transform={`rotate(${(i * 53 + ph * 600) % 360} ${x} ${y})`} opacity={clamp(1.6 - ph)} />;
      })}
    </svg>
  );
};

export const CtaV2: React.FC<{ t: number }> = ({ t }) => {
  const word = 'WINDOW';
  const n = Math.round(word.length * clamp((t - ev('typeKey')) / 0.5));
  const sent = clamp((t - ev('typeKey') - 0.8) / 0.2);
  const pulse = 1 + 0.06 * Math.sin(t * 8);
  const P = [['LeetCode', '5'], ['GeeksforGeeks', '3'], ['Codeforces', '2']];
  return (
    <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
      <g transform={`translate(540 420) scale(${land(t, ev('cta'), 0.24)})`}>
        <text x={0} y={0} textAnchor="middle" fontFamily={FONT.display} fontWeight={900} fontSize={104} fill="#fff" style={{ fontStretch: '82%' }}>10 SAWAAL</text>
        <text x={0} y={70} textAnchor="middle" fontFamily={FONT.ui} fontWeight={750} fontSize={42} fill={C.scale}>sliding window · interview favourites</text>
      </g>
      {P.map(([name, c], i) => (
        <g key={name} transform={`translate(${200 + i * 340} 600) scale(${land(t, ev('platforms') + i * 0.14, 0.2)})`}>
          <rect x={-150} y={-46} width={300} height={92} rx={24} fill={C.paper} stroke={C.ink} strokeWidth={5} />
          <text x={0} y={-4} textAnchor="middle" fontFamily={FONT.display} fontWeight={900} fontSize={name.length > 10 ? 30 : 38} fill={C.ink}>{name}</text>
          <text x={0} y={30} textAnchor="middle" fontFamily={FONT.ui} fontWeight={800} fontSize={24} fill="#5A5D78">{c} sawaal</text>
        </g>
      ))}
      <g transform="translate(110 760)">
        <rect x={0} y={0} width={860} height={120} rx={60} fill="#fff" />
        <text x={50} y={78} fontFamily={FONT.ui} fontWeight={n ? 900 : 600} fontSize={n ? 52 : 40} fill={n ? C.ink : '#9A9DB5'}>
          {n ? word.slice(0, n) : 'Add a comment…'}{n > 0 && (t * 2) % 1 < 0.5 ? '|' : ''}
        </text>
        <g transform={`translate(790 60) scale(${n === word.length ? pulse : 1})`}>
          <circle r={44} fill={n === word.length ? C.bro : '#C9CBE0'} />
          <path d="M -16 -18 L 22 0 L -16 18 L -8 0 Z" fill="#fff" />
        </g>
      </g>
      {sent > 0 && (
        <g transform={`translate(540 960) scale(${land(t, ev('typeKey') + 0.8, 0.2)})`}>
          <text x={0} y={0} textAnchor="middle" fontFamily={FONT.ui} fontWeight={800} fontSize={38} fill={C.haan}>list + template DM mein ✓</text>
        </g>
      )}
    </svg>
  );
};
