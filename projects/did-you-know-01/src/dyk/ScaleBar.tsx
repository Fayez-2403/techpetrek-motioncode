// The hero object: a yellow school scale (the search space). Ticks and numbers are placed in WORLD units, so a view
// change zooms the ruler. A snap breaks the dead half off: it cracks, spins and falls with splinters.
import React from 'react';
import { C, FONT } from '../themes/tokens';
import { clamp, easeInOutCubic, easeOutCubic, lerp } from '../animation/anim';

export type View = { lo: number; hi: number };
/** world -> screen x for a plank spanning x0..x1 showing world lo-0.5 .. hi+0.5 (integers) or lo..hi (continuous) */
export const mapX = (v: number, view: View, x0: number, x1: number, cont = false) => {
  const a = cont ? view.lo : view.lo - 0.5, b = cont ? view.hi : view.hi + 0.5;
  return x0 + ((v - a) / (b - a)) * (x1 - x0);
};

const niceStep = (span: number, px: number) => {
  const raw = span / (px / 14);
  const p = 10 ** Math.floor(Math.log10(Math.max(raw, 1e-9)));
  for (const m of [1, 2, 5, 10]) if (m * p >= raw) return m * p;
  return 10 * p;
};

export const Plank: React.FC<{
  x0: number; x1: number; y: number; h?: number; view: View; cont?: boolean; labels?: boolean; fmt?: (v: number) => string;
  tile?: (v: number) => string | null; minLabelPx?: number; opacity?: number;
}> = ({ x0, x1, y, h = 150, view, cont = false, labels = true, fmt = (v) => String(v), tile, minLabelPx = 34, opacity = 1 }) => {
  const span = cont ? view.hi - view.lo : view.hi - view.lo + 1;
  const px = x1 - x0;
  const step = cont ? niceStep(span, px) : Math.max(1, niceStep(span, px));
  const ticks: React.ReactNode[] = [];
  const first = Math.ceil((cont ? view.lo : view.lo) / step) * step;
  const perPx = px / span;
  for (let v = first, k = 0; v <= view.hi + 1e-9 && k < 400; v += step, k++) {
    const x = mapX(v, view, x0, x1, cont);
    const big = Math.round(v / step) % 10 === 0, mid = Math.round(v / step) % 5 === 0;
    const len = big ? h * 0.42 : mid ? h * 0.3 : h * 0.18;
    ticks.push(<line key={`t${k}`} x1={x} x2={x} y1={y - h / 2 + 8} y2={y - h / 2 + 8 + len} stroke={C.tick} strokeWidth={big ? 4 : 2.6} strokeLinecap="round" />);
  }
  // integer tiles (for small integer ranges): coloured cells + numbers
  const cells: React.ReactNode[] = [];
  if (!cont && tile && span <= 60) {
    for (let v = view.lo; v <= view.hi; v++) {
      const col = tile(v); if (!col) continue;
      const a = mapX(v - 0.5, view, x0, x1), b = mapX(v + 0.5, view, x0, x1);
      cells.push(<rect key={`c${v}`} x={a + 2} y={y - h / 2 + 6} width={Math.max(0, b - a - 4)} height={h - 12} rx={6} fill={col} />);
    }
  }
  const nums: React.ReactNode[] = [];
  if (labels && !cont) {
    const digits = String(Math.round(view.hi)).length, need = Math.max(minLabelPx, digits * 22 + 18);
    const every = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500].find((e) => e * perPx >= need) ?? 500;
    for (let v = Math.ceil(view.lo / every) * every; v <= view.hi; v += every) {
      if (v < 1) continue;
      const x = mapX(v, view, x0, x1);
      const fs = clamp(Math.min(perPx * every * 0.62, (perPx * every - 10) / (digits * 0.62)), 20, 54);
      const hw = String(v).length * fs * 0.31;
      if (x + hw > x1 - 4 || x - hw < x0 + 4) continue;   // never hang a number off the end of the scale
      nums.push(<text key={`n${v}`} x={x} y={y + h / 2 - 22} textAnchor="middle" fontFamily={FONT.display} fontWeight={800}
        fontSize={fs} fill={C.ink}>{fmt(v)}</text>);
    }
  }
  return (
    <g opacity={opacity}>
      <rect x={x0} y={y - h / 2 + 10} width={px} height={h} rx={14} fill={C.deep} opacity={0.45} />
      <rect x={x0} y={y - h / 2} width={px} height={h} rx={14} fill={C.scale} />
      <rect x={x0} y={y + h / 2 - 16} width={px} height={16} rx={8} fill={C.scaleEdge} />
      <rect x={x0 + 10} y={y - h / 2 + 4} width={px - 20} height={5} rx={2.5} fill="#FFF3B0" opacity={0.8} />
      {cells}
      {ticks}
      {nums}
    </g>
  );
};

/** a broken-off piece: drawn where it was at the snap, then cracks away, spins and falls */
export const Piece: React.FC<{ t: number; at: number; side: -1 | 1; x0: number; x1: number; y: number; h?: number; view: View; cont?: boolean;
  labels?: boolean; tile?: (v: number) => string | null; seed?: number }> = ({ t, at, side, x0, x1, y, h = 150, view, cont, labels, tile, seed = 1 }) => {
  const u = t - at;
  if (u < 0 || u > 1.6) return null;
  const dx = side * (40 * u + 160 * u * u), dy = -60 * u + 1500 * u * u, rot = side * (-6 * u + 70 * u * u) * (0.8 + (seed % 5) * 0.08);
  const cx = side < 0 ? x1 : x0;
  return (
    <g transform={`translate(${dx} ${dy}) rotate(${rot} ${cx} ${y})`} opacity={clamp(1 - u / 0.85)}>
      <Plank x0={x0} x1={x1} y={y} h={h} view={view} cont={cont} labels={labels} tile={tile} />
    </g>
  );
};

/** the crack flash + splinters at a snap point */
export const Splinters: React.FC<{ t: number; at: number; x: number; y: number; h?: number; seed?: number }> = ({ t, at, x, y, h = 150, seed = 3 }) => {
  const u = t - at;
  if (u < 0 || u > 0.7) return null;
  const parts = Array.from({ length: 12 }, (_, i) => {
    const a = ((i * 137.5 + seed * 53) % 360) * (Math.PI / 180), sp = 260 + ((i * 71 + seed * 13) % 9) * 60;
    const px = x + Math.cos(a) * sp * u, py = y + Math.sin(a) * sp * u + 900 * u * u;
    const s = 9 + (i % 3) * 5;
    return <rect key={i} x={px - s / 2} y={py - s / 4} width={s} height={s / 2.2} rx={1.5} fill={i % 3 ? C.scale : C.scaleEdge}
      transform={`rotate(${(i * 47 + u * 720) % 360} ${px} ${py})`} opacity={clamp(1 - u / 0.7)} />;
  });
  const flash = clamp(1 - u / 0.12);
  return (
    <g>
      {flash > 0 && <path d={`M ${x} ${y - h / 2 - 40} L ${x - 14} ${y - 10} L ${x + 12} ${y + 6} L ${x - 6} ${y + h / 2 + 40}`} stroke="#fff" strokeWidth={8 * flash + 2} fill="none" strokeLinejoin="round" opacity={flash} />}
      {flash > 0 && <circle cx={x} cy={y} r={60 + 120 * (1 - flash)} fill="#fff" opacity={0.25 * flash} />}
      {parts}
    </g>
  );
};

/** view eased from a to b over [t0, t0+d] */
export const viewAt = (t: number, k: { at: number; v: View }[], d = 0.42): View => {
  let v = k[0].v;
  for (let i = 1; i < k.length; i++) {
    const p = easeInOutCubic(clamp((t - k[i].at) / d));
    if (p <= 0) break;
    v = { lo: lerp(v.lo, k[i].v.lo, p), hi: lerp(v.hi, k[i].v.hi, p) };
    if (p < 1) break;
  }
  return v;
};

/** a pop-in scale for labels that land (decelerate from oversize) */
export const land = (t: number, at: number, d = 0.22) => {
  const p = clamp((t - at) / d);
  return p <= 0 ? 0 : 1 + (1 - easeOutCubic(p)) * 0.6;
};
