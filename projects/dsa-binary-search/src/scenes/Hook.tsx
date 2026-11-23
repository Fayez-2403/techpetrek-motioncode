// S0 HOOK: 140 crore names as a glowing crowd -> they sort into one long scale -> a linear scan is hopeless ->
// "Sirf 31": the scale snaps 31 times (slow, blur, slow) and one gold name is left.
import React from 'react';
import { C, FONT } from '../themes/tokens';
import { ev } from '../tl';
import { clamp, easeInOutCubic, easeOutCubic, easeOutQuint, lerp } from '../animation/anim';
import { Piece, Plank, Splinters, land } from './ScaleBar';

const N = 1110, COLS = 37, ROWS = 30;
const R = { x0: 80, x1: 1000, y0: 330, y1: 1060 };
const hash = (i: number) => { let x = Math.imul(i ^ 0x9e3779b9, 0x85ebca6b); x ^= x >>> 13; x = Math.imul(x, 0xc2b2ae35); x ^= x >>> 16; return (x >>> 0) / 4294967296; };
const PAL = ['#7C83FF', '#FF8FB1', '#5ED3C8', '#FFB866', '#B89CFF', '#9BE07A', '#FF7A7A', '#7FC8FF'];
const RANK = Array.from({ length: N }, (_, i) => i).sort((a, b) => hash(a * 7 + 1) - hash(b * 7 + 1));
const RANK_OF: number[] = []; RANK.forEach((d, r) => { RANK_OF[d] = r; });
const GOLD = 611;
const STEPS = 31;
const PX0 = 90, PX1 = 990, PY = 720;

/** Indian digit grouping: 1,40,00,00,000 */
export const inr = (n: number) => {
  const s = String(Math.max(0, Math.round(n)));
  if (s.length <= 3) return s;
  const last = s.slice(-3); let rest = s.slice(0, -3); const parts: string[] = [];
  while (rest.length > 2) { parts.unshift(rest.slice(-2)); rest = rest.slice(0, -2); }
  if (rest) parts.unshift(rest);
  return parts.join(',') + ',' + last;
};

export const Hook: React.FC<{ t: number }> = ({ t }) => {
  const A = ev('halveA'), B = ev('halveB'), S = ev('sortedW'), sA = ev('scanA'), sB = ev('scanB');
  // snap j (1..31) starts at stepT(j): three readable snaps, a blur of 25, then three slow ones into the answer
  const head = [0.26, 0.2, 0.15], tail = [0.12, 0.17, 0.24];
  const midD = Math.max(0.02, (B - A - head.reduce((a, b) => a + b) - tail.reduce((a, b) => a + b)) / 25);
  const D = [...head, ...Array(25).fill(midD), ...tail];
  const stepT = (j: number) => { let s = A; for (let i = 0; i < j - 1; i++) s += D[i]; return s; };
  // completed snaps
  let k = 0; while (k < STEPS && t >= stepT(k + 1)) k++;
  const sortP = easeInOutCubic(clamp((t - S) / 0.85));
  const plankIn = clamp((t - S - 0.45) / 0.3);
  // view windows: window_k = [a_k, a_k + 2^-k]; the dead side is hashed per step
  const side = (j: number): -1 | 1 => (hash(j * 31 + 5) < 0.5 ? -1 : 1);
  const win = (j: number) => { let a = 0; for (let i = 1; i <= j; i++) if (side(i) < 0) a += 2 ** -i; return { lo: a, hi: a + 2 ** -j }; };
  const next = Math.min(STEPS, k + 1);
  const dur = Math.min(0.34, (stepT(next) - stepT(k)) * 0.95 || 0.3);
  const p = k >= 1 ? easeOutQuint(clamp((t - stepT(k)) / dur)) : 1;
  // alive half stretching from half-width to full width
  const sdk = side(k);
  const ax0 = k >= 1 ? lerp(sdk < 0 ? 540 : PX0, PX0, p) : PX0, ax1 = k >= 1 ? lerp(sdk < 0 ? PX1 : 540, PX1, p) : PX1;
  const remaining = k === 0 ? 1.4e9 : Math.max(1, Math.ceil(1.4e9 / 2 ** k));
  const done = t >= B;
  const scan = t >= sA && t < A ? clamp((t - sA) / (sB - sA)) : -1;
  const counter = scan >= 0 ? Math.floor(1.4e9 * easeInOutCubic(scan) ** 3) : remaining;
  const big = land(t, B + 0.05, 0.26);
  return (
    <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
      <defs>
        <radialGradient id="spot" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor={C.gold} stopOpacity={0.6} /><stop offset="100%" stopColor={C.gold} stopOpacity={0} /></radialGradient>
      </defs>
      {/* counter */}
      <g transform={`translate(540 ${300})`}>
        <text x={0} y={0} textAnchor="middle" fontFamily={FONT.display} fontWeight={900} fontSize={108} fill={done ? C.gold : '#fff'} style={{ fontVariantNumeric: 'tabular-nums' }}>
          {inr(done ? 1 : counter)}
        </text>
        <text x={0} y={58} textAnchor="middle" fontFamily={FONT.ui} fontWeight={700} fontSize={36} fill={C.dim}>
          {scan >= 0 ? 'ek-ek karke dekha…' : k >= 1 ? `naam bache · sawaal #${k}` : 'naam'}
        </text>
      </g>
      {/* the crowd -> sorts into the scale */}
      {sortP < 1 && Array.from({ length: N }, (_, i) => {
        const c = i % COLS, r = Math.floor(i / COLS);
        const gx = R.x0 + (c + 0.5) * ((R.x1 - R.x0) / COLS) + Math.sin(t * 1.3 + i) * 2.5;
        const gy = R.y0 + (r + 0.5) * ((R.y1 - R.y0) / ROWS) + Math.cos(t * 1.1 + i * 0.7) * 2.5;
        const d = clamp(sortP * 1.25 - hash(i * 3) * 0.25);
        const tx = PX0 + 20 + (RANK_OF[i] / (N - 1)) * (PX1 - PX0 - 40), ty = PY - 30 + (hash(i * 11) - 0.5) * 30;
        const e = easeInOutCubic(d);
        const x = lerp(gx, tx, e), y = lerp(gy, ty, e);
        const gold = i === GOLD;
        return <circle key={i} cx={x} cy={y} r={lerp(gold ? 10 : 8, 3, e)} fill={gold ? C.gold : PAL[i % PAL.length]} opacity={(gold ? 1 : 0.85) * (1 - clamp((sortP - 0.85) / 0.15))} />;
      })}
      {/* the scale */}
      {plankIn > 0 && (
        <g opacity={plankIn}>
          {k >= 1 && !done && (
            <Piece t={t} at={stepT(k)} side={sdk} x0={sdk < 0 ? PX0 : 540} x1={sdk < 0 ? 540 : PX1} y={PY}
              view={sdk < 0 ? { lo: win(k - 1).lo, hi: win(k - 1).lo + 2 ** -k } : { lo: win(k - 1).lo + 2 ** -k, hi: win(k - 1).hi }} cont labels={false} seed={k} />
          )}
          {k >= 2 && !done && t - stepT(k - 1) < 1.2 && (() => {
            const s2 = side(k - 1);
            return <Piece t={t} at={stepT(k - 1)} side={s2} x0={s2 < 0 ? PX0 : 540} x1={s2 < 0 ? 540 : PX1} y={PY}
              view={s2 < 0 ? { lo: win(k - 2).lo, hi: win(k - 2).lo + 2 ** -(k - 1) } : { lo: win(k - 2).lo + 2 ** -(k - 1), hi: win(k - 2).hi }} cont labels={false} seed={k + 7} />;
          })()}
          {!done && <Plank x0={ax0} x1={ax1} y={PY} view={win(k)} cont labels={false} />}
          {k >= 1 && !done && <Splinters t={t} at={stepT(k)} x={540} y={PY} seed={k} />}
          {/* linear scan cursor */}
          {scan >= 0 && <rect x={lerp(PX0, PX1, (scan * 6) % 1) - 4} y={PY - 100} width={8} height={200} rx={4} fill="#fff" opacity={0.9} />}
        </g>
      )}
      {/* the one name left */}
      {done && (
        <g>
          <circle cx={540} cy={PY} r={260} fill="url(#spot)" opacity={easeOutCubic(clamp((t - B) / 0.3))} />
          <g transform={`translate(540 ${PY}) scale(${big})`}>
            <rect x={-170} y={-70} width={340} height={140} rx={22} fill={C.gold} stroke={C.ink} strokeWidth={6} />
            <text x={0} y={18} textAnchor="middle" fontFamily={FONT.display} fontWeight={900} fontSize={60} fill={C.ink}>1 naam ✓</text>
          </g>
          <g transform={`translate(540 ${980}) scale(${land(t, B + 0.25, 0.26)})`}>
            <text x={0} y={0} textAnchor="middle" fontFamily={FONT.display} fontWeight={900} fontSize={190} fill={C.gold}>31</text>
            <text x={0} y={64} textAnchor="middle" fontFamily={FONT.ui} fontWeight={800} fontSize={44} fill="#fff">sawaal. bas.</text>
          </g>
        </g>
      )}
    </svg>
  );
};
