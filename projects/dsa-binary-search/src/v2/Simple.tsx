// v2 "20 second" binary search: one scale 1..1000, target 737. Look at the middle; target bigger -> throw the left
// half; smaller -> throw the right half. Every step halves it: 10 steps (500 750 625 687 718 734 742 738 736 737).
import React from 'react';
import { C, FONT } from '../themes/tokens';
import { ev } from './tl';
import { clamp, easeOutCubic, easeOutQuint, lerp } from '../animation/anim';
import { Piece, Plank, Splinters, View, land, mapX } from '../scenes/ScaleBar';

const PY = 720, X0 = 90, X1 = 990, T = 737;
const STEPS = (() => {
  let lo = 1, hi = 1000; const s: { mid: number; dead: [number, number]; side: -1 | 1; before: View; after: View }[] = [];
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2), before = { lo, hi };
    if (mid === T) { s.push({ mid, dead: [mid, mid], side: 1, before, after: { lo: mid, hi: mid } }); break; }
    if (mid < T) { s.push({ mid, dead: [lo, mid], side: -1, before, after: { lo: mid + 1, hi } }); lo = mid + 1; }
    else { s.push({ mid, dead: [mid, hi], side: 1, before, after: { lo, hi: mid - 1 } }); hi = mid - 1; }
  }
  return s;
})();
/** time each step's snap happens (the last one is the find) */
const stepAt = (i: number) => {
  if (i === 0) return ev('snap1');
  if (i === 1) return ev('snap2');
  if (i === STEPS.length - 1) return ev('found');
  const a = ev('rapidA'), b = ev('rapidB');
  return a + ((i - 2) / (STEPS.length - 3)) * (b - a);
};
const pinAt = (i: number) => (i === 0 ? ev('mid500') : i === 1 ? ev('mid750') : stepAt(i) - 0.12);

export const Simple: React.FC<{ t: number }> = ({ t }) => {
  const done = STEPS.filter((_, i) => i < STEPS.length - 1 && t >= stepAt(i)).length;   // snaps done
  const last = done > 0 ? STEPS[done - 1] : null;
  const zd = done <= 2 ? 0.42 : 0.2;
  const sp = last ? easeOutQuint(clamp((t - stepAt(done - 1)) / zd)) : 1;
  const view: View = last ? last.after : { lo: 1, hi: 1000 };
  const ax0 = last ? lerp(mapX(last.after.lo - 0.5, last.before, X0, X1), X0, sp) : X0;
  const ax1 = last ? lerp(mapX(last.after.hi + 0.5, last.before, X0, X1), X1, sp) : X1;
  const mx = (v: number) => mapX(v, view, ax0, ax1);
  const found = t >= ev('found');
  const cur = STEPS.findIndex((_, i) => t >= pinAt(i) && (i === STEPS.length - 1 || t < stepAt(i)));
  const tile = (v: number) => (found && v === T ? C.gold : cur >= 0 && STEPS[cur].mid === v ? '#FFFFFF' : null);
  const sortedIn = easeOutCubic(clamp((t - ev('sorted')) / 0.4)) * (1 - easeOutCubic(clamp((t - ev('found') + 0.25) / 0.2)));
  const stepN = found ? 10 : done;
  const away = easeOutQuint(clamp((t - ev('asli') + 0.1) / 0.35));
  return (
    <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
      <defs><radialGradient id="b2" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor={C.gold} stopOpacity={0.7} /><stop offset="100%" stopColor={C.gold} stopOpacity={0} /></radialGradient></defs>
      <g transform={`translate(540 300) scale(${1 - 0.55 * away}) translate(-540 -300)`} opacity={1 - 0.35 * away}>
      {/* "sorted" tag over the scale */}
      <g opacity={sortedIn} transform={`translate(540 ${PY - 250})`}>
        <text x={0} y={0} textAnchor="middle" fontFamily={FONT.display} fontWeight={900} fontSize={64} fill="#fff">1 → 1000 <tspan fill={C.scale}>sorted</tspan></text>
      </g>
      {t >= ev('target') && (
        <g transform={`translate(96 ${330}) scale(${land(t, ev('target'), 0.2)})`}>
          <rect x={0} y={-44} width={260} height={66} rx={33} fill={C.gold} />
          <text x={130} y={2} textAnchor="middle" fontFamily={FONT.display} fontWeight={900} fontSize={38} fill={C.ink}>target 737</text>
        </g>
      )}
      {stepN > 0 && (
        <g transform={`translate(984 ${330})`}>
          <rect x={-250} y={-44} width={250} height={66} rx={33} fill={found ? C.haan : '#3A3F86'} />
          <text x={-125} y={2} textAnchor="middle" fontFamily={FONT.display} fontWeight={900} fontSize={38} fill="#fff">{found ? '10 step ✓' : `step ${stepN}`}</text>
        </g>
      )}
      {STEPS.slice(0, -1).map((s, i) => (
        <Piece key={i} t={t} at={stepAt(i)} side={s.side} y={PY} x0={mapX(s.dead[0] - 0.5, s.before, X0, X1)} x1={mapX(s.dead[1] + 0.5, s.before, X0, X1)}
          view={{ lo: s.dead[0], hi: s.dead[1] }} seed={i + 3} />
      ))}
      <Plank x0={ax0} x1={ax1} y={PY} view={view} tile={tile} />
      {STEPS.slice(0, -1).map((s, i) => {
        const x = s.side < 0 ? mapX(s.dead[1] + 0.5, s.before, X0, X1) : mapX(s.dead[0] - 0.5, s.before, X0, X1);
        return <Splinters key={i} t={t} at={stepAt(i)} x={x} y={PY} seed={i + 2} />;
      })}
      {/* "phek" arrows on the two explained steps */}
      {[0, 1].map((i) => {
        const u = t - stepAt(i); if (u < 0 || u > 0.9) return null;
        const left = STEPS[i].side < 0;
        return <text key={i} x={left ? 250 : 830} y={PY + 170} textAnchor="middle" fontFamily={FONT.display} fontWeight={900} fontSize={56} fill={C.na}
          opacity={clamp(1.3 - u * 1.4)}>{left ? '← phek' : 'phek →'}</text>;
      })}
      {/* the middle pin */}
      {cur >= 0 && !found && (
        <g transform={`translate(${mx(STEPS[cur].mid)} ${PY - 96}) scale(${land(t, pinAt(cur), 0.16)})`}>
          <path d="M -16 0 L 16 0 L 0 26 Z" fill="#fff" />
          <rect x={-90} y={-92} width={180} height={84} rx={20} fill="#fff" />
          <text x={0} y={-34} textAnchor="middle" fontFamily={FONT.display} fontWeight={900} fontSize={52} fill={C.ink}>{STEPS[cur].mid}</text>
        </g>
      )}
      {cur === 0 && t >= ev('target') && t < stepAt(0) && (
        <text x={540} y={PY + 180} textAnchor="middle" fontFamily={FONT.display} fontWeight={900} fontSize={50} fill={C.gold}>737 &gt; 500</text>
      )}
      {cur === 1 && t < stepAt(1) && (
        <text x={540} y={PY + 180} textAnchor="middle" fontFamily={FONT.display} fontWeight={900} fontSize={50} fill={C.gold}>737 &lt; 750</text>
      )}
      {found && (() => {
        const u = t - ev('found'), x = mx(T);
        return (
          <g>
            <circle cx={x} cy={PY} r={140 + 260 * easeOutCubic(clamp(u / 0.6))} fill="url(#b2)" opacity={clamp(1.4 - u)} />
            <g transform={`translate(${x} ${PY - 150}) scale(${land(t, ev('found'), 0.24)})`}>
              <text x={0} y={0} textAnchor="middle" fontFamily={FONT.display} fontWeight={900} fontSize={120} fill={C.gold}>737</text>
            </g>
            <g transform={`translate(540 ${PY + 200}) scale(${land(t, ev('ten'), 0.22)})`}>
              <text x={0} y={0} textAnchor="middle" fontFamily={FONT.display} fontWeight={900} fontSize={64} fill="#fff">1000 → sirf <tspan fill={C.gold}>10 step</tspan></text>
            </g>
          </g>
        );
      })()}
      </g>
      {t >= ev('asli') && (
        <g transform={`translate(540 ${PY + 60}) scale(${land(t, ev('asli'), 0.24)})`}>
          <text x={0} y={0} textAnchor="middle" fontFamily={FONT.display} fontWeight={900} fontSize={88} fill="#fff" style={{ fontStretch: '80%' }}>ASLI GAME:</text>
          <text x={0} y={110} textAnchor="middle" fontFamily={FONT.display} fontWeight={900} fontSize={120} fill={C.gold} style={{ fontStretch: '80%' }}>PEHCHAAN</text>
          <text x={0} y={176} textAnchor="middle" fontFamily={FONT.ui} fontWeight={750} fontSize={40} fill={C.scale}>sawaal mein binary search kaise dikhe?</text>
        </g>
      )}
    </svg>
  );
};
