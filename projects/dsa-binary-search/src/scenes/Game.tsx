// S2 ZERO: the 1-100 game on the scale. Linear crawl (1, 2, 3...), Bhai's chop, then every "upar / neeche" snaps the
// dead half off and the live half zooms to fill the scale. 50, 75, 62, 68, 71 -> found in 5.
import React from 'react';
import { C, FONT } from '../themes/tokens';
import { ev } from '../tl';
import { clamp, easeOutCubic, easeOutQuint, lerp } from '../animation/anim';
import { Piece, Plank, Splinters, View, land, mapX } from './ScaleBar';
import { PY } from './Problem';

const X0 = 90, X1 = 990;
const SNAPS: { at: string; dead: [number, number]; side: -1 | 1; before: View; after: View }[] = [
  { at: 'snap1', dead: [1, 50], side: -1, before: { lo: 1, hi: 100 }, after: { lo: 51, hi: 100 } },
  { at: 'snap2', dead: [75, 100], side: 1, before: { lo: 51, hi: 100 }, after: { lo: 51, hi: 74 } },
  { at: 'snap3', dead: [51, 62], side: -1, before: { lo: 51, hi: 74 }, after: { lo: 63, hi: 74 } },
  { at: 'snap4', dead: [63, 68], side: -1, before: { lo: 63, hi: 74 }, after: { lo: 69, hi: 74 } },
];
const GUESSES: [string, number][] = [['g50', 50], ['g75', 75], ['g62', 62], ['g68', 68], ['g71', 71]];

export const Game: React.FC<{ t: number }> = ({ t }) => {
  // the live half keeps its screen position at the snap, then stretches to fill X0..X1
  const last = [...SNAPS].reverse().find((s) => t >= ev(s.at));
  const sp = last ? easeOutQuint(clamp((t - ev(last.at)) / 0.42)) : 1;
  const view: View = last ? last.after : { lo: 1, hi: 100 };
  const ax0 = last ? lerp(mapX(last.after.lo - 0.5, last.before, X0, X1), X0, sp) : X0;
  const ax1 = last ? lerp(mapX(last.after.hi + 0.5, last.before, X0, X1), X1, sp) : X1;
  const mx = (v: number) => mapX(v, view, ax0, ax1);
  const crawl = ['crawl1', 'crawl2', 'crawl3'].filter((k) => t >= ev(k)).length;
  const gi = GUESSES.filter(([k]) => t >= ev(k)).length;   // binary guesses made
  const cur = gi > 0 ? GUESSES[gi - 1][1] : 0;
  const found = t >= ev('found');
  const title = t >= ev('bsTitle');
  const chop = t - ev('chop');
  const tile = (v: number) => (found && v === 71 ? C.gold : (gi > 0 && v === cur) || (gi === 0 && crawl > 0 && v === crawl) ? '#FFFFFF' : null);
  // the plank's on-screen span stays X0..X1; the live view zooms
  const guessX = cur ? mx(cur) : crawl ? mx(crawl) : 0;
  const pinEnd = gi > 0 ? ev(['snap1', 'snap2', 'snap3', 'snap4', 'found'][gi - 1]) : ev('chop');
  const counterN = gi > 0 ? gi : crawl;
  const counterLbl = gi > 0 ? `guess #${gi}` : crawl > 0 ? `guess #${crawl} / 100` : '';
  const pinP = land(t, gi > 0 ? ev(GUESSES[gi - 1][0]) : crawl > 0 ? ev(`crawl${crawl}`) : 1e9, 0.18);
  return (
    <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
      <defs>
        <radialGradient id="burst" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor={C.gold} stopOpacity={0.7} /><stop offset="100%" stopColor={C.gold} stopOpacity={0} /></radialGradient>
      </defs>
      {/* Bhai's secret number */}
      <g transform="translate(860 330)" opacity={1 - clamp((t - ev('bsTitle')) / 0.15)}>
        {[[-60, 20, 44], [-10, -10, 58], [50, 14, 46], [0, 40, 40]].map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} fill="#FFFFFF" opacity={0.93} />)}
        <circle cx={40} cy={120} r={14} fill="#fff" opacity={0.9} /><circle cx={62} cy={156} r={9} fill="#fff" opacity={0.9} />
        <text x={-4} y={34} textAnchor="middle" fontFamily={FONT.display} fontWeight={900} fontSize={64} fill={found ? C.ink : '#B9BCD9'}
          style={{ filter: found ? 'none' : 'blur(6px)' }}>{found ? '71' : '??'}</text>
      </g>
      {/* guess counter */}
      {counterN > 0 && !title && (
        <g transform="translate(96 330)">
          <rect x={0} y={-50} width={gi > 0 ? 260 : 340} height={74} rx={37} fill={gi > 0 ? C.haan : '#3A3F86'} />
          <text x={(gi > 0 ? 260 : 340) / 2} y={0} textAnchor="middle" fontFamily={FONT.display} fontWeight={850} fontSize={40} fill="#fff">{counterLbl}</text>
        </g>
      )}
      {/* falling pieces */}
      {SNAPS.map((s, i) => (
        <g key={i}>
          <Piece t={t} at={ev(s.at)} side={s.side} y={PY} x0={mapX(s.dead[0] - 0.5, s.before, X0, X1)} x1={mapX(s.dead[1] + 0.5, s.before, X0, X1)}
            view={{ lo: s.dead[0], hi: s.dead[1] }} seed={i + 2} />
        </g>
      ))}
      <Plank x0={ax0} x1={ax1} y={PY} view={view} tile={tile} />
      {SNAPS.map((s, i) => {
        const x = s.side < 0 ? mapX(s.dead[1] + 0.5, s.before, X0, X1) : mapX(s.dead[0] - 0.5, s.before, X0, X1);
        return <Splinters key={i} t={t} at={ev(s.at)} x={x} y={PY} seed={i + 1} />;
      })}
      {/* Bhai's chop: a white slash through the middle */}
      {chop > 0 && chop < 0.5 && (
        <path d={`M ${560 + 120} ${PY - 220} L ${520 - 120} ${PY + 220}`} stroke="#fff" strokeWidth={14 * (1 - chop / 0.5) + 2} strokeLinecap="round"
          strokeDasharray={600} strokeDashoffset={600 * (1 - easeOutQuint(clamp(chop / 0.12)))} opacity={1 - chop / 0.5} />
      )}
      {/* the guess pin */}
      {guessX > 0 && !found && t < pinEnd && (
        <g transform={`translate(${guessX} ${PY - 96}) scale(${pinP})`}>
          <path d="M -16 0 L 16 0 L 0 26 Z" fill="#fff" />
          <rect x={-74} y={-92} width={148} height={84} rx={20} fill="#fff" />
          <text x={0} y={-34} textAnchor="middle" fontFamily={FONT.display} fontWeight={900} fontSize={54} fill={C.ink}>{gi > 0 ? `${cur}?` : crawl}</text>
        </g>
      )}
      {/* found */}
      {found && (() => {
        const x = mx(71), u = t - ev('found');
        return (
          <g>
            <circle cx={x} cy={PY} r={140 + 260 * easeOutCubic(clamp(u / 0.6))} fill="url(#burst)" opacity={clamp(1.4 - u)} />
            {Array.from({ length: 12 }, (_, i) => {
              const a = (i / 12) * Math.PI * 2, r0 = 110 + 160 * easeOutCubic(clamp(u / 0.4)), r1 = r0 + 60;
              return <line key={i} x1={x + Math.cos(a) * r0} y1={PY + Math.sin(a) * r0} x2={x + Math.cos(a) * r1} y2={PY + Math.sin(a) * r1}
                stroke={C.gold} strokeWidth={8} strokeLinecap="round" opacity={clamp(1 - u / 0.7)} />;
            })}
            <g transform={`translate(${x} ${PY - 150}) scale(${land(t, ev('found'), 0.24) * (1 - clamp((t - ev('bsTitle')) / 0.12))})`}>
              <text x={0} y={0} textAnchor="middle" fontFamily={FONT.display} fontWeight={900} fontSize={120} fill={C.gold}>71</text>
            </g>
            <g transform={`translate(540 ${PY + 190}) scale(${land(t, ev('found') + 0.3, 0.2)})`}>
              <rect x={-250} y={-50} width={500} height={84} rx={42} fill={C.haan} />
              <text x={0} y={6} textAnchor="middle" fontFamily={FONT.display} fontWeight={850} fontSize={42} fill="#fff">5 guess · max 7 for 1–100</text>
            </g>
          </g>
        );
      })()}
      {title && (
        <g transform={`translate(540 470) scale(${land(t, ev('bsTitle'), 0.24)})`}>
          <text x={0} y={0} textAnchor="middle" fontFamily={FONT.display} fontWeight={900} fontSize={124} fill="#fff" style={{ fontStretch: '82%' }}>BINARY SEARCH</text>
          <text x={0} y={70} textAnchor="middle" fontFamily={FONT.ui} fontWeight={750} fontSize={42} fill={C.scale}>har jawab = aadha khatam</text>
        </g>
      )}
    </svg>
  );
};
