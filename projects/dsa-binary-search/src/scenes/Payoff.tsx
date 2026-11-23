// S6 PAYOFF: next morning, the interview call. The problem types in; Bro recognises the pattern (a small scale snaps)
// and his note turns green. CTA: a comment box types BINARY.
import React from 'react';
import { C, FONT } from '../themes/tokens';
import { ev } from '../tl';
import { clamp, easeOutQuint, lerp } from '../animation/anim';
import { Plank, Splinters, land } from './ScaleBar';

const Q = 'Find the minimum ship capacity to deliver all packages within D days.';

export const Payoff: React.FC<{ t: number }> = ({ t }) => {
  const typed = Q.slice(0, Math.round(Q.length * clamp((t - ev('problemType')) / 1.6)));
  const snap = ev('snapHand');
  const smile = clamp((t - snap - 0.3) / 0.3);
  const blink = ((t * 1000) % 3700) < 120 ? 0.1 : 1;
  return (
    <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
      <rect x={80} y={290} width={920} height={780} rx={30} fill="#0D0F2C" stroke="#30357A" strokeWidth={5} />
      {/* interviewer tile (fictional) */}
      <rect x={110} y={320} width={860} height={420} rx={22} fill="#2C3474" />
      <g transform="translate(540 540)">
        <path d="M -190 200 C -180 90 -110 60 -40 54 L 40 54 C 110 60 180 90 190 200 Z" fill="#33415F" />
        <path d="M -40 56 L 0 120 L 40 56 Z" fill="#E9ECF5" />
        <rect x={-26} y={10} width={52} height={56} rx={16} fill="#B37A55" />
        <circle cx={0} cy={-96} r={54} fill="#26201E" />
        <ellipse cx={0} cy={-40} rx={80} ry={92} fill="#C78B62" />
        <path d="M -82 -60 Q -70 -146 0 -140 Q 70 -146 82 -60 Q 60 -110 0 -108 Q -60 -110 -82 -60 Z" fill="#26201E" />
        {[-30, 30].map((x) => <g key={x}><circle cx={x} cy={-46} r={22} fill="none" stroke="#1E1A22" strokeWidth={5} /><ellipse cx={x} cy={-46} rx={7} ry={7 * blink} fill="#1A1210" /></g>)}
        <line x1={-8} y1={-46} x2={8} y2={-46} stroke="#1E1A22" strokeWidth={5} />
        <path d={`M -24 ${-2} Q 0 ${-2 + lerp(4, 16, smile)} 24 ${-2}`} stroke="#5A1B2A" strokeWidth={6} fill="none" strokeLinecap="round" />
      </g>
      <text x={130} y={712} fontFamily={FONT.ui} fontWeight={700} fontSize={28} fill="#C8CCF0">Interviewer</text>
      {/* the question */}
      <rect x={110} y={762} width={860} height={150} rx={20} fill="#181B46" />
      <text x={136} y={810} fontFamily={FONT.ui} fontWeight={800} fontSize={30} fill={C.dim}>Q.</text>
      <foreignObject x={180} y={782} width={770} height={120}>
        <div style={{ fontFamily: FONT.ui, fontWeight: 750, fontSize: 34, lineHeight: 1.3, color: '#fff' }}>{typed}<span style={{ opacity: (t * 2) % 1 < 0.5 ? 1 : 0 }}>|</span></div>
      </foreignObject>
      {/* recognition */}
      {t >= snap - 0.05 && (
        <g>
          <g transform={`translate(0 ${lerp(30, 0, easeOutQuint(clamp((t - snap + 0.05) / 0.25)))})`} opacity={clamp((t - snap + 0.05) / 0.15) * (1 - clamp((t - snap - 0.2) / 0.3))}>
            <Plank x0={300} x1={780} y={990} h={80} view={{ lo: 1, hi: 20 }} labels={false} />
          </g>
          <Splinters t={t} at={snap + 0.12} x={540} y={990} h={80} seed={5} />
          <g transform={`translate(540 990) scale(${land(t, snap + 0.3, 0.22)})`}>
            <rect x={-330} y={-46} width={660} height={86} rx={43} fill={C.haan} />
            <text x={0} y={12} textAnchor="middle" fontFamily={FONT.display} fontWeight={900} fontSize={44} fill="#fff">answer pe binary search ✓</text>
          </g>
        </g>
      )}
      {smile > 0.5 && (
        <g transform={`translate(860 380) scale(${land(t, snap + 0.6, 0.2)})`}>
          <rect x={-90} y={-38} width={180} height={64} rx={32} fill="#fff" />
          <text x={0} y={6} textAnchor="middle" fontFamily={FONT.ui} fontWeight={850} fontSize={34} fill={C.ink}>Nice.</text>
        </g>
      )}
    </svg>
  );
};

export const Cta: React.FC<{ t: number }> = ({ t }) => {
  const word = 'BINARY';
  const n = Math.round(word.length * clamp((t - ev('typeBinary')) / 0.45));
  const sent = clamp((t - ev('typeBinary') - 0.7) / 0.2);
  const pulse = 1 + 0.06 * Math.sin(t * 8);
  return (
    <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
      <g transform={`translate(540 520) scale(${land(t, ev('cta'), 0.24)})`}>
        <text x={0} y={0} textAnchor="middle" fontFamily={FONT.display} fontWeight={900} fontSize={96} fill="#fff" style={{ fontStretch: '82%' }}>10 SAWAAL</text>
        <text x={0} y={70} textAnchor="middle" fontFamily={FONT.ui} fontWeight={750} fontSize={40} fill={C.scale}>answer pe binary search · practice list</text>
      </g>
      <Plank x0={140} x1={940} y={700} h={90} view={{ lo: 1, hi: 10 }} />
      <g transform="translate(110 860)">
        <rect x={0} y={0} width={860} height={120} rx={60} fill="#fff" />
        <text x={50} y={78} fontFamily={FONT.ui} fontWeight={n ? 900 : 600} fontSize={n ? 52 : 40} fill={n ? C.ink : '#9A9DB5'}>
          {n ? word.slice(0, n) : 'Add a comment…'}{n > 0 && n < word.length + 1 && (t * 2) % 1 < 0.5 ? '|' : ''}
        </text>
        <g transform={`translate(790 60) scale(${n === word.length ? pulse : 1})`}>
          <circle r={44} fill={n === word.length ? C.bro : '#C9CBE0'} />
          <path d="M -16 -18 L 22 0 L -16 18 L -8 0 Z" fill="#fff" />
        </g>
      </g>
      {sent > 0 && (
        <g transform={`translate(540 1040) scale(${land(t, ev('typeBinary') + 0.7, 0.2)})`}>
          <text x={0} y={0} textAnchor="middle" fontFamily={FONT.ui} fontWeight={800} fontSize={38} fill={C.haan}>list DM mein aa jaayegi ✓</text>
        </g>
      )}
    </svg>
  );
};
