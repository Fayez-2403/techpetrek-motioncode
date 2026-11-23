// S3 HOW IT WORKS: the scale breaks into 11 sorted cards; L, H, M flags plant on the words; real Java types in.
// Shuffle -> X. Then the 2006 overflow bug: (low + high) passes INT_MAX and flips negative, the glass cracks, the fix.
import React from 'react';
import { C, FONT } from '../themes/tokens';
import { ev } from '../tl';
import { clamp, easeInOutCubic, easeOutCubic, easeOutQuint, lerp } from '../animation/anim';
import { Plank, land } from './ScaleBar';
import { PY } from './Problem';

const V = [3, 8, 12, 19, 24, 31, 37, 45, 52, 60, 71];
const SHUF = [8, 0, 10, 3, 7, 1, 9, 5, 2, 6, 4];   // card i goes to slot SHUF[i] when shuffled
const CW = 78, GAP = 8, CX0 = 71, CY = 392, CH = 120;
const slotX = (s: number) => CX0 + s * (CW + GAP);

type Tok = [string, string];
const KW = '#FF7AC6', NUM = '#FFB866', ID = '#EDEFFF', PUN = '#8E93C9', OK = '#2BCB8D', BAD = '#FF5A6A';
const tokens = (s: string, base = ID): Tok[] => s.split(/(\s+|[(){};=<>+\-/[\]!,])/).filter(Boolean).map((w) => [w,
  /^(int|while|if|else|return)$/.test(w) ? KW : /^\d+$/.test(w) ? NUM : /^[(){};=<>+\-/[\]!,]$/.test(w) ? PUN : base]);

export const Code: React.FC<{ t: number }> = ({ t }) => {
  const cards = ev('cards');
  const rise = (i: number) => easeOutQuint(clamp((t - cards - i * 0.035) / 0.5));
  // shuffle state
  const shufP = easeInOutCubic(clamp((t - ev('shuffle')) / 0.45)) * (1 - easeInOutCubic(clamp((t - ev('unshuffle')) / 0.45)));
  const cardX = (i: number) => lerp(slotX(i), slotX(SHUF[i]), shufP);
  // flags
  const hopL = ev('hopL'), hopH = ev('hopH');
  const Lidx = t < hopL ? 0 : 6, Hidx = t < hopH ? 10 : 7;
  const Midx = t < hopL + 0.45 ? 5 : t < hopH + 0.45 ? 8 : 6;
  const foundM = t >= hopH + 0.6 && shufP < 0.01 ? clamp((t - hopH - 0.6) / 0.3) : 0;
  const hop = (at: number) => { const u = clamp((t - at) / 0.42); return { p: easeInOutCubic(u), y: -Math.sin(Math.PI * u) * 120 }; };
  const flagXY = (which: 'L' | 'H' | 'M') => {
    if (which === 'L') { const h = hop(hopL); return { x: lerp(slotX(0), slotX(6), h.p) + CW / 2, y: h.y }; }
    if (which === 'H') { const h = hop(hopH); return { x: lerp(slotX(10), slotX(7), h.p) + CW / 2, y: h.y }; }
    const m1 = hop(hopL + 0.45), m2 = hop(hopH + 0.45);
    const x = t < hopH + 0.45 ? lerp(slotX(5), slotX(8), m1.p) : lerp(slotX(8), slotX(6), m2.p);
    return { x: x + CW / 2, y: t < hopH + 0.45 ? m1.y : m2.y };
  };
  const alive = (i: number) => i >= Lidx && i <= Hidx;
  // code lines
  const typed = (s: string, at: number, d = 0.35) => s.slice(0, Math.round(s.length * clamp((t - at) / d)));
  const bad = '(low + high) / 2;', good = 'low + (high - low) / 2;';
  const tb = ev('typeBad'), fx = ev('fix'), cr = ev('crack');
  const midTxt = t < tb ? '?;' : t < fx ? typed(bad, tb, 1.1) : typed(good, fx, 1.0);
  const midCol = t < tb ? PUN : t < fx ? (t >= cr ? BAD : ID) : OK;
  const L: { at: number; s: string; ind: number }[] = [
    { at: ev('flagL'), s: 'int low = 0, high = n - 1;', ind: 0 },
    { at: ev('flagM') - 0.3, s: 'while (low <= high) {', ind: 0 },
    { at: ev('flagM'), s: 'int mid = ', ind: 1 },
    { at: ev('flagM') + 0.45, s: 'if (a[mid] == x) return mid;', ind: 1 },
    { at: hopL - 0.25, s: 'if (a[mid] < x) low = mid + 1;', ind: 1 },
    { at: hopH - 0.25, s: 'else high = mid - 1;', ind: 1 },
    { at: hopH + 0.1, s: '}', ind: 0 },
  ];
  const active = t >= hopH + 0.6 && t < ev('shuffle') ? 3 : t >= hopH - 0.25 && t < hopH + 0.6 ? 5 : t >= hopL - 0.25 && t < hopH - 0.25 ? 4 : t >= tb && t < ev('fixed') + 0.4 ? 2 : -1;
  const crackU = t - cr;
  const shake = crackU > 0 && crackU < 0.35 ? Math.sin(crackU * 70) * (1 - crackU / 0.35) * 12 : 0;
  // overflow meter
  const ov = ev('overflow');
  const meterIn = easeOutQuint(clamp((t - ov + 0.15) / 0.35)) * (1 - easeOutCubic(clamp((t - ev('fixed') - 0.5) / 0.3)));
  const sumP = easeInOutCubic(clamp((t - ov) / 0.7));
  const INTMAX = 2147483647, sumV = 3.5e9 * sumP, over = sumV > INTMAX;
  const fixedP = t >= fx + 0.9;
  const plankFade = 1 - clamp((t - cards) / 0.25);
  return (
    <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
      {/* the scale from the game, breaking into cards */}
      {plankFade > 0 && <Plank x0={90} x1={990} y={PY} view={{ lo: 69, hi: 74 }} opacity={plankFade} />}
      {/* target */}
      {t >= cards + 0.3 && meterIn < 0.5 && (
        <g transform={`translate(96 ${318}) scale(${land(t, cards + 0.3, 0.2)})`}>
          <rect x={0} y={-44} width={200} height={66} rx={33} fill="#fff" />
          <text x={100} y={2} textAnchor="middle" fontFamily={FONT.mono} fontWeight={800} fontSize={36} fill={C.ink}>x = 37</text>
        </g>
      )}
      {/* cards */}
      <g opacity={1 - meterIn}>
        {V.map((v, i) => {
          const r = rise(i), x = cardX(i), y = lerp(PY - 60, CY, r);
          const dead = !alive(i) && t >= hopL + 0.1 && shufP < 0.5;
          const isFound = i === 6 && foundM > 0;
          return (
            <g key={i} opacity={r > 0 ? 1 : 0}>
              <rect x={x} y={y + 8} width={CW} height={CH} rx={12} fill={C.deep} opacity={0.5} />
              <rect x={x} y={y} width={CW} height={CH} rx={12} fill={isFound ? C.gold : dead ? '#5A3550' : C.scale} stroke={isFound ? '#fff' : 'none'} strokeWidth={5} />
              <text x={x + CW / 2} y={y + 76} textAnchor="middle" fontFamily={FONT.display} fontWeight={900} fontSize={44} fill={dead ? '#B98AA6' : C.ink}>{v}</text>
            </g>
          );
        })}
        {(['L', 'H', 'M'] as const).map((f) => {
          const at = f === 'L' ? ev('flagL') : f === 'H' ? ev('flagH') : ev('flagM');
          if (t < at) return null;
          const { x, y } = flagXY(f);
          const s = land(t, at, 0.2);
          const col = f === 'M' ? C.scale : '#FFFFFF';
          const wrong = f === 'M' && shufP > 0.5;
          return (
            <g key={f} transform={`translate(${x} ${CY - 18 + y}) scale(${s})`}>
              <line x1={0} y1={0} x2={0} y2={-92} stroke="#fff" strokeWidth={6} />
              <path d="M 0 -92 L 64 -76 L 0 -60 Z" fill={wrong ? C.na : col} />
              <text x={22} y={-68} fontFamily={FONT.display} fontWeight={900} fontSize={28} fill={C.ink}>{f}</text>
            </g>
          );
        })}
        {t >= ev('xStamp') && t < ev('unshuffle') + 0.3 && (
          <g transform={`translate(540 ${CY + 60}) scale(${land(t, ev('xStamp'), 0.16)}) rotate(-8)`}>
            <rect x={-220} y={-74} width={440} height={140} rx={20} fill="none" stroke={C.na} strokeWidth={12} />
            <text x={0} y={22} textAnchor="middle" fontFamily={FONT.display} fontWeight={900} fontSize={74} fill={C.na}>✗ UNSORTED</text>
          </g>
        )}
      </g>
      {/* overflow meter (over the cards) */}
      {meterIn > 0.01 && (
        <g opacity={meterIn} transform={`translate(0 ${lerp(-40, 0, meterIn)})`}>
          <text x={80} y={318} fontFamily={FONT.mono} fontWeight={800} fontSize={30} fill="#fff"><tspan fill={C.dim}>low = </tspan>1,500,000,000</text>
          <text x={1000} y={318} textAnchor="end" fontFamily={FONT.mono} fontWeight={800} fontSize={30} fill="#fff"><tspan fill={C.dim}>high = </tspan>2,000,000,000</text>
          <rect x={80} y={420} width={920} height={58} rx={14} fill="#262A6A" />
          <rect x={80} y={420} width={Math.min(920, 920 * (lerp(sumV, 5e8, easeOutQuint(clamp((t - fx - 0.9) / 0.4))) / 3.6e9))} height={58} rx={14} fill={over && !fixedP ? C.na : fixedP ? OK : C.scale} />
          <line x1={80 + 920 * (INTMAX / 3.6e9)} x2={80 + 920 * (INTMAX / 3.6e9)} y1={404} y2={496} stroke="#fff" strokeWidth={5} strokeDasharray="10 8" />
          <text x={80 + 920 * (INTMAX / 3.6e9) - 10} y={530} textAnchor="end" fontFamily={FONT.mono} fontWeight={700} fontSize={26} fill="#fff">INT_MAX 2,147,483,647</text>
          <text x={540} y={392} textAnchor="middle" fontFamily={FONT.mono} fontWeight={900} fontSize={40} fill={fixedP ? OK : over ? BAD : '#fff'}>
            {fixedP ? 'high - low = 500,000,000 ✓' : over ? 'low + high = -794,967,296 ⚠' : `low + high = ${Math.round(sumV).toLocaleString('en-US')}`}
          </text>
        </g>
      )}
      {/* editor */}
      <g transform={`translate(${shake} 0)`}>
        <rect x={60} y={560} width={960} height={530} rx={26} fill={C.code} stroke="#2E3378" strokeWidth={4} />
        {[0, 1, 2].map((i) => <circle key={i} cx={100 + i * 34} cy={598} r={10} fill={['#FF5F57', '#FEBC2E', '#28C840'][i]} />)}
        <text x={980} y={606} textAnchor="end" fontFamily={FONT.mono} fontSize={26} fill={C.dim}>BinarySearch.java</text>
        {active >= 0 && <rect x={70} y={640 + active * 56 - 2} width={940} height={52} rx={10} fill={active === 2 && t >= cr && t < fx ? '#4A1830' : '#24296A'} />}
        {L.map((l, i) => {
          if (t < l.at) return null;
          const shown = i === 2 ? l.s : typed(l.s, l.at);
          const toks = tokens(shown);
          return (
            <text key={i} x={96 + l.ind * 40} y={680 + i * 56} fontFamily={FONT.mono} fontWeight={700} fontSize={31} xmlSpace="preserve">
              <tspan fill={PUN}>{String(i + 1).padStart(2, ' ')}  </tspan>
              {toks.map(([w, c], k) => <tspan key={k} fill={c}>{w}</tspan>)}
              {i === 2 && tokens(midTxt, midCol).map(([w, c], k) => <tspan key={`m${k}`} fill={t >= tb ? midCol : c}>{w}</tspan>)}
            </text>
          );
        })}
        {/* glass crack */}
        {crackU > 0 && t < fx + 0.2 && (
          <g stroke="#fff" strokeWidth={4} fill="none" opacity={clamp(1 - (t - fx) / 0.2)} strokeLinecap="round">
            {[[0, -1], [0.7, -0.6], [1, 0.2], [0.5, 0.9], [-0.3, 1], [-0.9, 0.4], [-1, -0.4], [-0.5, -0.9]].map(([dx, dy], i) => {
              const L0 = 260 * easeOutQuint(clamp(crackU / 0.12)), cx = 640, cy = 770;
              return <path key={i} d={`M ${cx} ${cy} L ${cx + dx * L0 * 0.45 + (i % 2 ? 18 : -14)} ${cy + dy * L0 * 0.45} L ${cx + dx * L0} ${cy + dy * L0}`} />;
            })}
          </g>
        )}
        {t >= ev('fixed') && (
          <g transform={`translate(540 1052) scale(${land(t, ev('fixed'), 0.2)})`}>
            <text x={0} y={0} textAnchor="middle" fontFamily={FONT.ui} fontWeight={700} fontSize={26} fill={C.dim}>bug noted by Joshua Bloch · Google Research blog · 2006</text>
          </g>
        )}
      </g>
    </svg>
  );
};
