// SIMPLE (~20 s): 8 overs (4 9 2 7 12 3 8 6). "Lagatar 3 overs" -> brute force re-adds every group (6 x 3 = 18 jod)
// -> the local-train khidki arrives -> naya jodo, purana ghatao -> one slide per spoken sum 15 18 21 22 23 -> best 23
// -> +1/-1 chip -> ASLI GAME: PEHCHAAN. All numbers from src/config/demo.json.
import React from 'react';
import { C, FONT } from '../themes/tokens';
import { ev } from '../tl';
import { clamp, easeInOutCubic, easeOutCubic, easeOutQuint, lerp } from '../animation/anim';
import { Khidki, Tiles } from './Khidki';
import { land } from './ScaleBar';
import DEMO from '../config/demo.json';

const O = DEMO.overs, RUNS = O.runs, SUMS = O.sums, W = DEMO.work;
const TW = 104, GAP = 8, X0 = (1080 - (8 * TW + 7 * GAP)) / 2, TY = 800, TH = 150;
const tx = (i: number) => X0 + i * (TW + GAP);
const AW = 3 * TW + 2 * GAP + 16, AH = 176;
const ax = (pos: number) => tx(pos) - 8;
const SLIDES = ['s1', 's2', 's3', 's4'];
const inr = (n: number) => n.toLocaleString('en-IN');

export const Simple: React.FC<{ t: number }> = ({ t }) => {
  const kh = ev('khidki');
  // window position (continuous)
  const posAt = () => {
    let p = 0;
    SLIDES.forEach((k, i) => { p = lerp(p, i + 1, easeInOutCubic(clamp((t - ev(k)) / 0.3))); });
    return p;
  };
  const arrive = easeOutQuint(clamp((t - kh) / 0.85));
  const pos = posAt();
  const wx = lerp(1500, ax(0), arrive) + (ax(1) - ax(0)) * pos;
  const moving = t >= kh && t < kh + 0.9 ? 1 - arrive : 0;
  const done = SLIDES.filter((k) => t >= ev(k)).length;
  const total = t < kh + 0.5 ? null : SUMS[done];
  const best = t >= ev('best');
  const away = easeOutQuint(clamp((t - ev('asli') + 0.1) / 0.35));
  // brute force ghost: hops over the 6 windows between "brute" and "khidki"
  const bA = ev('brute') + 0.3, bB = kh - 0.2, bN = Math.min(6, Math.floor(clamp((t - bA) / (bB - bA)) * 6.999) + 1);
  const brute = t >= bA && t < kh;
  const fill = (i: number) => {
    if (best && i >= 4 && i <= 6) return C.gold;
    if (t >= ev('naya') && t < ev('s0') && i === 3) return '#B8F5D8';
    if (t >= ev('purana') && t < ev('s0') && i === 0) return '#FFC2C8';
    return C.scale;
  };
  return (
    <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
      <g transform={`translate(540 300) scale(${1 - 0.55 * away}) translate(-540 -300)`} opacity={1 - 0.35 * away}>
        <g transform={`translate(540 ${330}) scale(${land(t, ev('oversIn'), 0.22)})`}>
          <text x={0} y={0} textAnchor="middle" fontFamily={FONT.display} fontWeight={900} fontSize={60} fill="#fff">8 overs ke runs 🏏</text>
        </g>
        {/* the scoreboard */}
        {total !== null && (
          <g transform={`translate(540 520) scale(${land(t, kh + 0.5, 0.22)})`}>
            <rect x={-250} y={-82} width={500} height={150} rx={26} fill="#0B0D2A" stroke={best ? C.gold : '#3A3F86'} strokeWidth={6} />
            <text x={0} y={-36} textAnchor="middle" fontFamily={FONT.ui} fontWeight={800} fontSize={26} fill={C.dim}>{best ? 'BEST · overs 5-7' : 'khidki ka total'}</text>
            <text x={0} y={46} textAnchor="middle" fontFamily={FONT.display} fontWeight={900} fontSize={96} fill={best ? C.gold : '#fff'} style={{ fontVariantNumeric: 'tabular-nums' }}>{total}</text>
          </g>
        )}
        <Tiles x0={X0} y={TY} w={TW} gap={GAP} h={TH} vals={RUNS} label={(i) => `over ${i + 1}`} fill={fill}
          drop={(i) => easeOutCubic(clamp((t - ev('oversIn') - 0.1 - i * 0.07) / 0.3))} />
        {/* "lagatar 3" bracket */}
        {t >= ev('lagatar') && t < ev('brute') && (
          <g opacity={easeOutCubic(clamp((t - ev('lagatar')) / 0.25))}>
            <path d={`M ${tx(0)} ${TY + 96} v 22 H ${tx(2) + TW} v -22`} stroke={C.scale} strokeWidth={6} fill="none" />
            <text x={(tx(0) + tx(2) + TW) / 2} y={TY + 160} textAnchor="middle" fontFamily={FONT.display} fontWeight={900} fontSize={44} fill={C.scale}>lagatar 3</text>
          </g>
        )}
        {/* brute force: re-add every group */}
        {brute && (
          <g>
            <rect x={tx(bN - 1) - 6} y={TY - TH / 2 - 6} width={3 * TW + 2 * GAP + 12} height={TH + 12} rx={18} fill="none" stroke={C.na} strokeWidth={6} strokeDasharray="14 10" />
            <text x={tx(bN - 1) + (3 * TW + 2 * GAP) / 2} y={TY - TH / 2 - 20} textAnchor="middle" fontFamily={FONT.display} fontWeight={900} fontSize={40} fill={C.na}>
              {`${RUNS[bN - 1]}+${RUNS[bN]}+${RUNS[bN + 1]}`}
            </text>
            <text x={540} y={TY + 170} textAnchor="middle" fontFamily={FONT.display} fontWeight={900} fontSize={46} fill={C.na}>{`har baar dobara: ${bN} × 3 = ${bN * 3} jod 😩`}</text>
          </g>
        )}
        {/* the train window */}
        {t >= kh && <Khidki x={wx} y={TY - AH / 2} aw={AW} ah={AH} t={t} moving={moving} glow={best ? C.gold : undefined} />}
        {/* the rule preview */}
        {t >= ev('aage') && t < ev('s0') && (
          <text x={ax(0) + AW + 90} y={TY - 140} fontFamily={FONT.display} fontWeight={900} fontSize={60} fill="#fff"
            transform={`translate(${Math.sin(t * 8) * 6} 0)`}>→</text>
        )}
        {t >= ev('naya') && t < ev('s0') && (
          <g transform={`translate(${tx(3) + TW / 2} ${TY + 160}) scale(${land(t, ev('naya'), 0.2)})`}>
            <text x={0} y={0} textAnchor="middle" fontFamily={FONT.display} fontWeight={900} fontSize={46} fill={C.haan}>+ naya</text>
          </g>
        )}
        {t >= ev('purana') && t < ev('s0') && (
          <g transform={`translate(${tx(0) + TW / 2} ${TY + 160}) scale(${land(t, ev('purana'), 0.2)})`}>
            <text x={0} y={0} textAnchor="middle" fontFamily={FONT.display} fontWeight={900} fontSize={46} fill={C.na}>− purana</text>
          </g>
        )}
        {/* +new / -old chips flying into the scoreboard on every slide */}
        {SLIDES.map((k, i) => {
          const u = (t - ev(k)) / 0.55; if (u < 0 || u > 1) return null;
          const e = easeInOutCubic(u), inI = i + 3, outI = i;
          return (
            <g key={k} opacity={1 - clamp((u - 0.75) / 0.25)}>
              <text x={lerp(tx(inI) + TW / 2, 600, e)} y={lerp(TY - 100, 560, e)} textAnchor="middle" fontFamily={FONT.display} fontWeight={900} fontSize={58} fill={C.haan}>+{RUNS[inI]}</text>
              <text x={lerp(tx(outI) + TW / 2, 470, e)} y={lerp(TY - 100, 560, e)} textAnchor="middle" fontFamily={FONT.display} fontWeight={900} fontSize={58} fill={C.na}>−{RUNS[outI]}</text>
            </g>
          );
        })}
        {t >= ev('plusMinus') && (
          <g transform={`translate(540 ${TY + 206}) scale(${land(t, ev('plusMinus'), 0.22)})`}>
            <rect x={-450} y={-44} width={900} height={136} rx={26} fill={C.paper} stroke={C.ink} strokeWidth={5} />
            <text x={0} y={2} textAnchor="middle" fontFamily={FONT.display} fontWeight={900} fontSize={42} fill={C.ink}>har step: +1 naya, −1 purana</text>
            <text x={0} y={54} textAnchor="middle" fontFamily={FONT.ui} fontWeight={800} fontSize={24} fill="#5A5D78">
              {`1 lakh overs, khidki 1000: dobara ${inr(W.brute)} jod vs khidki ${inr(W.slide)}`}
            </text>
          </g>
        )}
      </g>
      {t >= ev('asli') && (
        <g transform={`translate(540 ${760}) scale(${land(t, ev('asli'), 0.24)})`}>
          <text x={0} y={0} textAnchor="middle" fontFamily={FONT.display} fontWeight={900} fontSize={88} fill="#fff" style={{ fontStretch: '80%' }}>ASLI GAME:</text>
          <text x={0} y={110} textAnchor="middle" fontFamily={FONT.display} fontWeight={900} fontSize={120} fill={C.gold} style={{ fontStretch: '80%' }}>PEHCHAAN</text>
          <text x={0} y={176} textAnchor="middle" fontFamily={FONT.ui} fontWeight={750} fontSize={40} fill={C.scale}>sawaal mein sliding window kaise dikhe?</text>
        </g>
      )}
    </svg>
  );
};
