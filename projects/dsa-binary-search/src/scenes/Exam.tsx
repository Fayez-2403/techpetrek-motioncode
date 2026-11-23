// S5b/S5c THE HERO MOVE (exam + border search, one continuous scene).
// 5 chapters (30, 11, 23, 4, 20 pages), 6 days, one chapter per day. 10/day -> 11 days, fail. Each speed asks one
// question: done in 6 days? NA..NA HAAN..HAAN is sorted, so binary search the border: 15 x, 23 ok, 19 x, 21 x, 22 x -> 23.
import React from 'react';
import { C, FONT } from '../themes/tokens';
import { ev } from '../tl';
import { clamp, easeInCubic, easeInOutCubic, easeOutCubic, easeOutQuint, lerp } from '../animation/anim';
import { Piece, Plank, Splinters, View, land, mapX } from './ScaleBar';

const P = [30, 11, 23, 4, 20];
const days = (k: number) => P.reduce((s, p) => s + Math.ceil(p / k), 0);
const BOOK_COL = ['#E8574F', '#4F8DE8', '#9B5DE5', '#F28C28', '#2BB673'];
const BX = (i: number) => 110 + i * 175, BW = 150, BY = 300, BH = 240;
const SY = 960, X0 = 90, X1 = 990;   // the answer scale
const CHECKS: { at: string; k: number; dead: [number, number]; side: -1 | 1; before: View; after: View }[] = [
  { at: 'f15', k: 15, dead: [1, 15], side: -1, before: { lo: 1, hi: 30 }, after: { lo: 16, hi: 30 } },
  { at: 'f23', k: 23, dead: [24, 30], side: 1, before: { lo: 16, hi: 30 }, after: { lo: 16, hi: 23 } },
  { at: 'f19', k: 19, dead: [16, 19], side: -1, before: { lo: 16, hi: 23 }, after: { lo: 20, hi: 23 } },
  { at: 'f21', k: 21, dead: [20, 21], side: -1, before: { lo: 20, hi: 23 }, after: { lo: 22, hi: 23 } },
  { at: 'f22', k: 22, dead: [22, 22], side: -1, before: { lo: 22, hi: 23 }, after: { lo: 23, hi: 23 } },
];
const SNAP_DELAY = 0.16;

const Banana: React.FC<{ x: number; y: number; s: number }> = ({ x, y, s }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {[-26, 0, 26].map((dx, i) => (
      <g key={i} transform={`rotate(${(i - 1) * 16})`}>
        <path d={`M ${dx - 8} -70 Q ${dx + 50} -10 ${dx + 6} 80 Q ${dx + 20} -6 ${dx - 8} -70 Z`} fill="#FFE135" stroke="#C9A100" strokeWidth={4} />
        <circle cx={dx - 6} cy={-70} r={7} fill="#6B4F1D" />
      </g>
    ))}
  </g>
);

export const Exam: React.FC<{ t: number }> = ({ t }) => {
  const exam = ev('exam'), books = ev('books'), sim = ev('sim10'), fail = ev('fail'), sIn = ev('scaleIn'), tiles = ev('tiles'), bx = ev('bExact');
  // calendar: 6 slots, then 11 during the 10/day simulation
  const calIn = easeOutQuint(clamp((t - exam - 0.1) / 0.4));
  const calOut = easeInCubic(clamp((t - sIn + 0.1) / 0.35));
  const grow = easeInOutCubic(clamp((t - sim) / 0.3));
  const nSlots = 11;
  const slotW = lerp(140, 74, grow), slotG = lerp(12, 8, grow);
  const slotX = (j: number) => 90 + j * (slotW + slotG);
  const blocks: { book: number; pages: number; j: number }[] = [];
  { let j = 0; P.forEach((p, b) => { for (let r = p; r > 0; r -= 10) blocks.push({ book: b, pages: Math.min(10, r), j: j++ }); }); }
  const bananaP = clamp((t - ev('bananas')) / 0.18) * (1 - clamp((t - ev('bananas') - 0.95) / 0.18));
  // the answer scale + border search
  const last = [...CHECKS].reverse().find((c) => t >= ev(c.at) + SNAP_DELAY);
  const zp = last ? easeOutQuint(clamp((t - ev(last.at) - SNAP_DELAY) / 0.3)) : 1;
  const view: View = last ? last.after : { lo: 1, hi: 30 };
  const ax0 = last ? lerp(mapX(last.after.lo - 0.5, last.before, X0, X1), X0, zp) : X0;
  const ax1 = last ? lerp(mapX(last.after.hi + 0.5, last.before, X0, X1), X1, zp) : X1;
  const mx = (v: number) => mapX(v, view, ax0, ax1);
  const searching = t >= bx;
  const sweep = (v: number) => clamp((t - tiles - (v / 30) * 0.8) / 0.12);
  const checked = (v: number) => CHECKS.find((c) => c.k === v && t >= ev(c.at));
  const tile = (v: number): string | null => {
    if (t >= ev('gold23') && v === 23) return C.gold;
    if (searching) { const c = checked(v); return c ? (days(v) <= 6 ? C.haan : C.na) : '#E8DFA8'; }
    if (sweep(v) <= 0) return null;
    return days(v) <= 6 ? C.haan : C.na;
  };
  const scaleShow = easeOutQuint(clamp((t - sIn) / 0.45));
  const curCheck = [...CHECKS].reverse().find((c) => t >= ev(c.at));
  const showBooks = 1;  // books stay (they become bananas for one beat)
  return (
    <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
      {/* books */}
      {P.map((p, i) => {
        const d = easeOutCubic(clamp((t - books - i * 0.09) / 0.35)), y = lerp(-400, BY, d);
        const bounce = d >= 1 ? Math.max(0, Math.sin((t - books - i * 0.09 - 0.35) * 18) * 10 * Math.exp(-(t - books - i * 0.09 - 0.35) * 8)) : 0;
        const split = t >= sim - 0.05 && t < sIn ? 1 : 0;
        return (
          <g key={i} opacity={showBooks * (1 - bananaP)}>
            <g transform={`translate(0 ${y - BY - bounce})`}>
              <rect x={BX(i)} y={BY + 10} width={BW} height={BH} rx={12} fill={C.deep} opacity={0.4} />
              <rect x={BX(i)} y={BY} width={BW} height={BH} rx={12} fill={BOOK_COL[i]} />
              <rect x={BX(i) + 14} y={BY + 22} width={BW - 28} height={10} rx={5} fill="#fff" opacity={0.45} />
              <rect x={BX(i) + 14} y={BY + BH - 34} width={BW - 28} height={10} rx={5} fill="#fff" opacity={0.45} />
              <text x={BX(i) + BW / 2} y={BY + 134} textAnchor="middle" fontFamily={FONT.display} fontWeight={900} fontSize={70} fill="#fff">{p}</text>
              <text x={BX(i) + BW / 2} y={BY + 178} textAnchor="middle" fontFamily={FONT.ui} fontWeight={800} fontSize={28} fill="#fff" opacity={0.85}>pages</text>
              {split > 0 && <rect x={BX(i)} y={BY} width={BW} height={BH} rx={12} fill="#000" opacity={0.25} />}
            </g>
          </g>
        );
      })}
      {bananaP > 0 && P.map((_, i) => <Banana key={i} x={BX(i) + BW / 2} y={BY + BH / 2} s={bananaP * 1.15} />)}
      {/* calendar */}
      {calIn > 0 && calOut < 1 && (
        <g opacity={1 - calOut} transform={`translate(0 ${calOut * 300})`}>
          {Array.from({ length: nSlots }, (_, j) => {
            const extra = j >= 6;
            if (extra && grow <= 0) return null;
            const s = extra ? easeOutCubic(clamp((t - sim - 0.1 - (j - 6) * 0.08) / 0.2)) : calIn;
            const over = extra && t >= sim;
            return (
              <g key={j} opacity={s}>
                <rect x={slotX(j)} y={590} width={slotW} height={110} rx={14} fill={over ? '#4A1830' : '#262A6A'} stroke={over ? C.na : '#3D4290'} strokeWidth={4} />
                <text x={slotX(j) + slotW / 2} y={620} textAnchor="middle" fontFamily={FONT.ui} fontWeight={800} fontSize={grow > 0.5 ? 20 : 26} fill={over ? C.na : C.dim}>
                  {grow > 0.5 ? `D${j + 1}` : `Din ${j + 1}`}
                </text>
              </g>
            );
          })}
          {blocks.map((b) => {
            const at = sim + 0.15 + b.j * 0.1, u = easeOutCubic(clamp((t - at) / 0.25));
            if (u <= 0) return null;
            const fx = BX(b.book) + BW / 2, fy = BY + BH, tx = slotX(b.j) + slotW / 2, ty = 664;
            const x = lerp(fx, tx, u), y = lerp(fy, ty, u) - Math.sin(u * Math.PI) * 120;
            return (
              <g key={b.j}>
                <rect x={x - slotW / 2 + 6} y={y - 22} width={slotW - 12} height={44} rx={8} fill={BOOK_COL[b.book]} />
                <text x={x} y={y + 10} textAnchor="middle" fontFamily={FONT.display} fontWeight={900} fontSize={26} fill="#fff">{b.pages}</text>
              </g>
            );
          })}
          {t >= fail && (
            <g transform={`translate(540 650) scale(${land(t, fail, 0.16)}) rotate(-6)`}>
              <rect x={-230} y={-70} width={460} height={130} rx={20} fill="#1A0A14" opacity={0.85} stroke={C.na} strokeWidth={12} />
              <text x={0} y={22} textAnchor="middle" fontFamily={FONT.display} fontWeight={900} fontSize={74} fill={C.na}>11 din ✗</text>
            </g>
          )}
        </g>
      )}
      {/* rule + question */}
      {t >= ev('oneChapter') && t < sIn && (
        <g transform={`translate(540 770) scale(${land(t, ev('oneChapter'), 0.2)})`}>
          <rect x={-300} y={-40} width={600} height={70} rx={35} fill="#262A6A" />
          <text x={0} y={8} textAnchor="middle" fontFamily={FONT.ui} fontWeight={800} fontSize={34} fill="#fff">1 din → sirf 1 chapter</text>
        </g>
      )}
      {t >= ev('question') && t < sIn && (
        <g transform={`translate(540 900) scale(${land(t, ev('question'), 0.22)})`}>
          <text x={0} y={0} textAnchor="middle" fontFamily={FONT.display} fontWeight={900} fontSize={96} fill={C.scale}>
            {t >= ev('sim10') - 0.6 ? '10 pages / din?' : '? pages / din'}
          </text>
        </g>
      )}
      {/* the answer scale */}
      {scaleShow > 0 && (
        <g transform={`translate(${lerp(1000, 0, scaleShow)} 0)`}>
          {!searching && <text x={X0} y={SY - 110} fontFamily={FONT.ui} fontWeight={800} fontSize={32} fill={C.dim}>pages / din →</text>}
          {CHECKS.map((c, i) => (
            <Piece key={i} t={t} at={ev(c.at) + SNAP_DELAY} side={c.side} y={SY} x0={mapX(c.dead[0] - 0.5, c.before, X0, X1)} x1={mapX(c.dead[1] + 0.5, c.before, X0, X1)}
              view={{ lo: c.dead[0], hi: c.dead[1] }} tile={(v) => (days(v) <= 6 ? C.haan : C.na)} seed={i + 4} />
          ))}
          <Plank x0={ax0} x1={ax1} y={SY} view={view} tile={tile} minLabelPx={30} />
          {CHECKS.map((c, i) => {
            const x = c.side < 0 ? mapX(c.dead[1] + 0.5, c.before, X0, X1) : mapX(c.dead[0] - 0.5, c.before, X0, X1);
            return <Splinters key={i} t={t} at={ev(c.at) + SNAP_DELAY} x={x} y={SY} seed={i + 9} />;
          })}
          {/* NA / HAAN brackets before the search */}
          {!searching && t >= ev('naGlow') && (
            <g>
              <rect x={mapX(0.5, view, X0, X1)} y={SY + 92} width={mapX(22.5, view, X0, X1) - mapX(0.5, view, X0, X1)} height={10} rx={5} fill={C.na} />
              <text x={(mapX(0.5, view, X0, X1) + mapX(22.5, view, X0, X1)) / 2} y={SY + 150} textAnchor="middle" fontFamily={FONT.display} fontWeight={900} fontSize={48} fill={C.na}>NA NA NA…</text>
            </g>
          )}
          {!searching && t >= ev('haanGlow') && (
            <g>
              <rect x={mapX(22.5, view, X0, X1)} y={SY + 92} width={mapX(30.5, view, X0, X1) - mapX(22.5, view, X0, X1)} height={10} rx={5} fill={C.haan} />
              <text x={(mapX(22.5, view, X0, X1) + mapX(30.5, view, X0, X1)) / 2} y={SY + 150} textAnchor="middle" fontFamily={FONT.display} fontWeight={900} fontSize={44} fill={C.haan}>HAAN</text>
            </g>
          )}
          {!searching && t >= ev('sorted') && (
            <g opacity={0.6 + 0.4 * Math.sin((t - ev('sorted')) * 9)}>
              <line x1={mapX(22.5, view, X0, X1)} x2={mapX(22.5, view, X0, X1)} y1={SY - 120} y2={SY + 90} stroke={C.gold} strokeWidth={8} strokeDasharray="14 10" />
              <text x={mapX(22.5, view, X0, X1)} y={SY - 130} textAnchor="middle" fontFamily={FONT.display} fontWeight={900} fontSize={44} fill={C.gold}>border</text>
            </g>
          )}
          {/* the check bubble */}
          {curCheck && t < ev('gold23') && (() => {
            const x = mx(curCheck.k), ok = days(curCheck.k) <= 6;
            return (
              <g transform={`translate(${clamp(x, 200, 880)} ${SY - 150}) scale(${land(t, ev(curCheck.at), 0.16)})`}>
                <rect x={-170} y={-56} width={340} height={92} rx={24} fill={ok ? C.haan : C.na} />
                <text x={0} y={4} textAnchor="middle" fontFamily={FONT.display} fontWeight={900} fontSize={44} fill="#fff">{`${curCheck.k}/din → ${days(curCheck.k)} din ${ok ? '✓' : '✗'}`}</text>
                <path d="M -14 36 L 14 36 L 0 58 Z" fill={ok ? C.haan : C.na} transform={`translate(${x - clamp(x, 200, 880)} 0)`} />
              </g>
            );
          })()}
          {t >= ev('gold23') && t < ev('cardFlip') && (
            <g>
              <g transform={`translate(540 ${SY - 170}) scale(${land(t, ev('gold23'), 0.24)})`}>
                <text x={0} y={0} textAnchor="middle" fontFamily={FONT.display} fontWeight={900} fontSize={110} fill={C.gold}>23 / din</text>
              </g>
              {t >= ev('tally') && (
                <g transform={`translate(540 ${SY + 150}) scale(${land(t, ev('tally'), 0.2)})`}>
                  <rect x={-300} y={-48} width={600} height={84} rx={42} fill={C.haan} />
                  <text x={0} y={8} textAnchor="middle" fontFamily={FONT.display} fontWeight={850} fontSize={42} fill="#fff">30 options → sirf 5 checks</text>
                </g>
              )}
            </g>
          )}
        </g>
      )}
      {/* the reveal card */}
      {t >= ev('cardFlip') && (() => {
        const f = easeOutQuint(clamp((t - ev('cardFlip')) / 0.35));
        return (
          <g transform={`translate(540 640) scale(1 ${f})`}>
            <rect x={-440} y={-110} width={880} height={200} rx={28} fill={C.paper} stroke={C.ink} strokeWidth={6} />
            <text x={0} y={-40} textAnchor="middle" fontFamily={FONT.ui} fontWeight={800} fontSize={34} fill="#6A6D88">LeetCode 875</text>
            <text x={0} y={40} textAnchor="middle" fontFamily={FONT.display} fontWeight={900} fontSize={62} fill={C.ink}>Koko Eating Bananas</text>
          </g>
        );
      })()}
      {t >= ev('cardFlip') + 0.55 && ['1011 · Ship Packages Within D Days', '410 · Split Array Largest Sum'].map((s, i) => (
        <g key={i} transform={`translate(540 ${784 + i * 66}) scale(${land(t, ev('cardFlip') + 0.55 + i * 0.14, 0.2)})`}>
          <rect x={-420} y={-30} width={840} height={60} rx={30} fill="#262A6A" stroke="#4A50A8" strokeWidth={3} />
          <text x={0} y={11} textAnchor="middle" fontFamily={FONT.ui} fontWeight={800} fontSize={31} fill="#fff">{`same pattern → ${s}`}</text>
        </g>
      ))}
    </svg>
  );
};
