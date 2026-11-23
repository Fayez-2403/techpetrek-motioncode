// S4 REAL USE: 1000 commits stand up like the scale; git bisect halves them 10 times and catches commit #613.
// The bisect steps are the real arithmetic (good = 0, bad = 1000, first bad = 613); terminal text uses git's own format.
import React from 'react';
import { C, FONT } from '../themes/tokens';
import { ev } from '../tl';
import { clamp, easeOutCubic, easeOutQuint, lerp } from '../animation/anim';
import { land } from './ScaleBar';

const STEPS = (() => {
  let g = 0, b = 1000; const s: { g: number; b: number; m: number; bad: boolean; left: number }[] = [];
  while (b - g > 1) { const m = Math.floor((g + b) / 2); s.push({ g, b, m, bad: m >= 613, left: Math.floor((b - g - 1) / 2) }); if (m >= 613) b = m; else g = m; }
  return s;
})();
const BX = 110, BW = 150, BY0 = 330, BY1 = 1060;   // the commit column (commit 0 at the bottom)

export const Office: React.FC<{ t: number }> = ({ t }) => {
  const A = ev('bisectA'), B = ev('bisectB');
  const dt = (B - A) / STEPS.length;
  const k = clamp(Math.floor((t - A) / dt) + 1, 0, STEPS.length);   // steps done
  const st = k > 0 ? STEPS[k - 1] : null;
  const win = st ? (st.bad ? { g: st.g, b: st.m } : { g: st.m, b: st.b }) : { g: 0, b: 1000 };
  const prev = k > 1 ? (STEPS[k - 2].bad ? { g: STEPS[k - 2].g, b: STEPS[k - 2].m } : { g: STEPS[k - 2].m, b: STEPS[k - 2].b }) : { g: 0, b: 1000 };
  const p = k > 0 ? easeOutQuint(clamp((t - (A + (k - 1) * dt)) / Math.min(0.16, dt))) : 1;
  const lo = lerp(prev.g, win.g, p), hi = lerp(prev.b, win.b, p);
  const y = (c: number) => BY1 - ((c - lo) / (hi - lo)) * (BY1 - BY0);
  const fill = easeOutCubic(clamp((t - ev('office') - 0.1) / 1.1));
  const done = t >= B;
  const term: { at: number; s: string; col?: string }[] = [
    { at: ev('office') + 0.2, s: '$ git bisect start' },
    { at: ev('broken') + 0.1, s: '$ git bisect bad HEAD', col: C.na },
    { at: ev('commits') + 0.1, s: '$ git bisect good v2.3', col: C.haan },
    ...STEPS.map((s, i) => ({ at: A + i * dt, s: `Bisecting: ${s.left} revisions left (~${Math.max(0, 9 - i)} steps)`, col: C.dim })),
    { at: B + 0.05, s: 'c0ffee6 is the first bad commit', col: C.gold },
  ].filter((l) => t >= l.at);
  const shown = term.slice(-11);
  return (
    <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
      {/* the commit column */}
      <rect x={BX - 10} y={BY0 - 10} width={BW + 20} height={BY1 - BY0 + 20} rx={18} fill="#0B0D2A" />
      <clipPath id="col"><rect x={BX} y={BY0} width={BW} height={BY1 - BY0} rx={12} /></clipPath>
      <g clipPath="url(#col)">
        <rect x={BX} y={BY0} width={BW} height={BY1 - BY0} fill={C.scale} />
        {Array.from({ length: 101 }, (_, i) => {
          const c = i * 10; if (c < lo - 10 || c > hi + 10) return null;
          const yy = y(c); if (yy > BY1 - (BY1 - BY0) * fill) { /* not filled yet */ }
          return <line key={i} x1={BX} x2={BX + (i % 10 === 0 ? BW * 0.55 : BW * 0.3)} y1={yy} y2={yy} stroke={C.tick} strokeWidth={i % 10 === 0 ? 4 : 2} />;
        })}
        {/* fill mask before the commits land */}
        <rect x={BX} y={BY0} width={BW} height={(BY1 - BY0) * (1 - fill)} fill="#0B0D2A" />
        {/* tested commit marker */}
        {st && !done && <rect x={BX} y={y(st.m) - 7} width={BW} height={14} fill={st.bad ? C.na : C.haan} />}
        {done && <rect x={BX} y={BY0 + (BY1 - BY0) / 2 - 40} width={BW} height={80} fill={C.na} />}
      </g>
      {/* ends */}
      {t >= ev('broken') && (
        <g transform={`translate(${BX + BW / 2} ${BY0 - 40}) scale(${land(t, ev('broken'), 0.2)})`}>
          <rect x={-90} y={-36} width={180} height={60} rx={30} fill={C.na} />
          <text x={0} y={6} textAnchor="middle" fontFamily={FONT.display} fontWeight={900} fontSize={32} fill="#fff">HEAD ✗</text>
        </g>
      )}
      {t >= ev('commits') && (
        <g transform={`translate(${BX + BW / 2} ${BY1 + 46}) scale(${land(t, ev('commits'), 0.2)})`}>
          <rect x={-90} y={-30} width={180} height={60} rx={30} fill={C.haan} />
          <text x={0} y={12} textAnchor="middle" fontFamily={FONT.display} fontWeight={900} fontSize={32} fill="#fff">v2.3 ✓</text>
        </g>
      )}
      {/* range labels */}
      {fill > 0.5 && (
        <g fontFamily={FONT.mono} fontWeight={800} fontSize={24} fill="#fff">
          <text x={BX + BW + 18} y={BY0 + 22}>#{Math.round(hi)}</text>
          <text x={BX + BW + 18} y={BY1}>#{Math.round(lo)}</text>
        </g>
      )}
      {/* terminal */}
      <rect x={370} y={330} width={650} height={560} rx={22} fill={C.code} stroke="#2E3378" strokeWidth={4} />
      {shown.map((l, i) => (
        <text key={i} x={392} y={380 + i * 46} fontFamily={FONT.mono} fontWeight={700} fontSize={l.s.length > 34 ? 23 : 27} fill={l.col ?? '#EDEFFF'}>{l.s}</text>
      ))}
      {/* build counter + result */}
      {k > 0 && (
        <g transform={`translate(695 960)`}>
          <rect x={-320} y={-52} width={640} height={92} rx={46} fill={done ? C.gold : '#262A6A'} />
          <text x={0} y={10} textAnchor="middle" fontFamily={FONT.display} fontWeight={900} fontSize={done ? 38 : 46} fill={done ? C.ink : '#fff'}>
            {done ? 'commit #613 ✗ · 10 builds' : `build ${k} / 10`}
          </text>
        </g>
      )}
    </svg>
  );
};
