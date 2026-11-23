// S1 THE PROBLEM: Bro's PG desk at night. HR notification, head on the keyboard, then Bhai's scale flies in and slams
// across the desk at the exact spot the game uses (handoff to S2).
import React from 'react';
import { C, FONT } from '../themes/tokens';
import { ev } from '../tl';
import { clamp, easeInCubic, easeOutCubic, easeOutQuint, lerp } from '../animation/anim';
import { Plank } from './ScaleBar';

export const PY = 720;

export const Fan: React.FC<{ t: number; x: number; y: number; s?: number }> = ({ t, x, y, s = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-6} y={-90} width={12} height={70} fill="#2A2E66" />
    <g transform={`rotate(${(t * 520) % 360})`}>
      {[0, 120, 240].map((a) => <ellipse key={a} cx={0} cy={-150} rx={34} ry={150} fill="#30357A" transform={`rotate(${a})`} opacity={0.9} />)}
    </g>
    <circle r={30} fill="#3B4090" /><circle r={12} fill="#5A60B8" />
  </g>
);

export const Problem: React.FC<{ t: number; at?: { notif: number; headDrop: number; whack: number }; view?: { lo: number; hi: number } }> = ({ t, at, view = { lo: 1, hi: 100 } }) => {
  const A = at ?? { notif: ev('notif'), headDrop: ev('headDrop'), whack: ev('scaleWhack') };
  const notif = easeOutQuint(clamp((t - A.notif) / 0.4));
  const drop = clamp((t - A.headDrop) / 0.3);
  const w = A.whack;
  const fly = clamp((t - (w - 0.5)) / 0.5);           // the scale flies in from the right (Bhai's side) over 0.5 s
  const slam = t >= w ? clamp((t - w) / 0.25) : 0;
  const fx = lerp(1500, 0, easeOutCubic(fly)), fy = lerp(-260, 0, easeInCubic(fly)), fr = lerp(-160, 0, easeOutCubic(fly));
  const shake = slam > 0 && slam < 1 ? Math.sin(slam * 40) * (1 - slam) * 10 : 0;
  return (
    <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
      <g transform={`translate(0 ${shake})`}>
        {/* window with the city at night */}
        <rect x={110} y={300} width={300} height={300} rx={16} fill="#0B0D2A" stroke="#2B2F6E" strokeWidth={10} />
        {Array.from({ length: 26 }, (_, i) => <rect key={i} x={125 + ((i * 53) % 270)} y={470 + ((i * 37) % 110)} width={14} height={(i % 4) * 10 + 20} fill={i % 3 ? '#2E3380' : '#FFD27A'} opacity={0.75} />)}
        <circle cx={340} cy={360} r={26} fill="#FFF1C9" opacity={0.85} />
        <line x1={260} y1={300} x2={260} y2={600} stroke="#2B2F6E" strokeWidth={8} />
        <Fan t={t} x={760} y={330} s={0.8} />
        {/* lamp cone */}
        <path d="M 300 640 L 120 1100 L 980 1100 L 560 640 Z" fill={C.lamp} opacity={0.07} />
        {/* desk */}
        <rect x={0} y={900} width={1080} height={240} fill="#4A2F22" />
        <rect x={0} y={890} width={1080} height={22} fill="#6A4330" />
        {/* laptop */}
        <g transform={`translate(0 ${drop * 6})`}>
          <path d="M 330 600 L 750 600 L 750 860 L 330 860 Z" fill="#1A1C3C" stroke="#3A3E7A" strokeWidth={8} />
          {[0, 1, 2, 3, 4, 5].map((i) => <rect key={i} x={360 + (i % 2) * 30} y={630 + i * 34} width={[220, 160, 260, 120, 200, 90][i]} height={14} rx={7} fill={i === 2 ? C.na : '#4D53A8'} opacity={0.8} />)}
          <path d="M 290 860 L 790 860 L 830 900 L 250 900 Z" fill="#2A2D5C" />
        </g>
        {/* letters spraying off the keyboard when Bro's head drops */}
        {drop > 0 && t - A.headDrop < 1 && 'asdfghjkl;'.split('').map((ch, i) => {
          const u = t - A.headDrop, a = -Math.PI / 2 + (i - 4.5) * 0.22;
          return <text key={i} x={540 + Math.cos(a) * 520 * u} y={880 + Math.sin(a) * 520 * u + 700 * u * u} fontFamily={FONT.mono} fontWeight={800}
            fontSize={46} fill="#fff" opacity={clamp(1 - u)} textAnchor="middle">{ch}</text>;
        })}
        {/* cutting chai */}
        <g transform="translate(880 820)">
          <path d="M -34 0 L 34 0 L 26 80 L -26 80 Z" fill="#FFFFFF" opacity={0.35} />
          <path d="M -30 22 L 30 22 L 25 78 L -25 78 Z" fill="#B5652C" />
          {[0, 1, 2].map((i) => <path key={i} d={`M ${-12 + i * 12} -10 q 12 -24 0 -48 q -12 -24 0 -48`} stroke="#fff" strokeWidth={4} fill="none"
            opacity={0.25 + 0.15 * Math.sin(t * 2 + i)} transform={`translate(${Math.sin(t * 1.5 + i) * 6} ${-((t * 30 + i * 20) % 30)})`} />)}
        </g>
        {/* phone + notification */}
        <rect x={150} y={920} width={150} height={70} rx={14} fill="#111" stroke="#333" strokeWidth={4} transform="rotate(-8 225 955)" />
        {notif > 0 && (
          <g transform={`translate(0 ${lerp(-60, 0, notif)})`} opacity={notif}>
            <rect x={110} y={300} width={860} height={150} rx={30} fill="#FFFFFF" opacity={0.96} />
            <rect x={140} y={330} width={90} height={90} rx={22} fill={C.bro} />
            <text x={185} y={392} textAnchor="middle" fontFamily={FONT.display} fontWeight={900} fontSize={44} fill="#fff">HR</text>
            <text x={256} y={366} fontFamily={FONT.ui} fontWeight={800} fontSize={36} fill={C.ink}>Interview confirmed ✅</text>
            <text x={256} y={414} fontFamily={FONT.ui} fontWeight={600} fontSize={34} fill="#55586F">Kal, 10:00 AM · DSA round</text>
          </g>
        )}
        {/* the scale flies in and slams */}
        {fly > 0 && (
          <g transform={`translate(${fx} ${fy}) rotate(${fr} 540 ${PY})`}>
            <Plank x0={90} x1={990} y={PY} view={view} />
          </g>
        )}
        {slam > 0 && slam < 1 && [0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <circle key={i} cx={120 + i * 120} cy={PY + 80 + slam * 30} r={20 + slam * 40} fill="#fff" opacity={(1 - slam) * 0.25} />
        ))}
      </g>
    </svg>
  );
};
