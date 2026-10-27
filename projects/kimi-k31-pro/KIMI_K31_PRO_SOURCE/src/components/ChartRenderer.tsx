// An honest horizontal bar chart for reported benchmark numbers (values only from src/data/benchmarkData.ts).
//   * the value axis runs from chart.axisMin (0) to chart.axisMax (100), so bar length is proportional to the value
//   * each bar and its count-up label are driven by the SAME eased number: the label always reads the bar's length
//   * the hero bar (Kimi) is the only coloured mark; text stays in text colours (no series colour on type)
//   * recessive hairline grid, solid axis, ticks every 10 with labels every 20
// The component is controlled: the scene passes progress values (0..1) per element, so it stays a pure function of the frame.
import React from 'react';
import type { BenchChart } from '../data/benchmarkData';
import { clamp, easeOutCubic, fmt, invLerp } from '../lib/anim';
import type { ChartGeom } from '../scenes/_evidence';
import { C } from '../styles/theme';
import { F } from '../styles/typography';

export const BAR_EASE = easeOutCubic;
export const HERO = C.cyan;
export const NEUTRAL = '#5F6B86';

/** the value shown (and plotted) for a bar at growth progress g (0..1) */
export const shownValue = (chart: BenchChart, i: number, g: number) => chart.bars[i].value * BAR_EASE(clamp(g));

/** x of a value on the axis */
export const xOf = (chart: BenchChart, g: ChartGeom, v: number) => g.x0 + ((v - chart.axisMin) / (chart.axisMax - chart.axisMin)) * g.plotW;

/** screen rectangle of bar i at value v */
export const barRect = (chart: BenchChart, g: ChartGeom, i: number, v: number) => ({ x: g.x0, y: g.rowY[i] - g.barH / 2, w: xOf(chart, g, v) - g.x0, h: g.barH });

/** a bar: square at the baseline, small rounded data-end */
export const barPath = (x: number, y: number, w: number, h: number, r = 6) => {
  if (w <= 0.01) return '';
  const rr = Math.min(r, w, h / 2);
  return `M${x},${y} H${x + w - rr} Q${x + w},${y} ${x + w},${y + rr} V${y + h - rr} Q${x + w},${y + h} ${x + w - rr},${y + h} H${x} Z`;
};

export interface ChartProps {
  chart: BenchChart;
  g: ChartGeom;
  w: number; h: number;
  /** bar growth progress per bar, 0..1 (eased inside) */
  grow: number[];
  /** axis line, grid and tick reveal 0..1 */
  axis: number;
  /** names reveal 0..1 */
  names: number;
  /** emphasis per row (1 = full, lower = recessive) */
  focus?: number[];
  /** overall opacity of text and axis (exit) */
  textOpacity?: number;
  /** per-bar opacity (exit) */
  barOpacity?: number[];
  /** scale about (ox, oy): the near-still camera push */
  scale?: number; ox?: number; oy?: number;
}

export const ChartRenderer: React.FC<ChartProps> = ({ chart, g, w, h, grow, axis, names, focus, textOpacity = 1, barOpacity, scale = 1, ox = 0, oy = 0 }) => {
  const span = chart.axisMax - chart.axisMin;
  const ticks: number[] = [];
  for (let v = chart.axisMin; v <= chart.axisMax + 1e-6; v += span / 10) ticks.push(Math.round(v * 1000) / 1000);
  const axisW = g.plotW * easeOutCubic(invLerp(0, 0.6, axis));
  const tickOn = (k: number) => easeOutCubic(invLerp(0.2 + (k / ticks.length) * 0.5, 0.45 + (k / ticks.length) * 0.5, axis));
  const tickLabelY = g.axisY + g.tickSize * 1.55;

  return (
    <svg width={w} height={h} role="img" aria-label={chart.title} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
      <g transform={`translate(${ox},${oy}) scale(${scale}) translate(${-ox},${-oy})`}>
        {/* grid + ticks */}
        <g opacity={textOpacity}>
          {ticks.map((v, k) => {
            const x = xOf(chart, g, v), major = k % 2 === 0, on = tickOn(k);
            return (
              <g key={k} opacity={on}>
                {major && k > 0 && <line x1={x} x2={x} y1={g.axisY - (g.axisY - g.plotTop) * on} y2={g.axisY} stroke="rgba(232,237,246,0.075)" strokeWidth={1} />}
                <line x1={x} x2={x} y1={g.axisY} y2={g.axisY + (major ? 12 : 7)} stroke="rgba(232,237,246,0.45)" strokeWidth={1.5} />
                {major && (
                  <text x={x} y={tickLabelY} textAnchor="middle" fontFamily={F.mono} fontSize={g.tickSize} fill={C.silver} style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {`${fmt(v, 0)}${v === chart.axisMax ? chart.unit : ''}`}
                  </text>
                )}
              </g>
            );
          })}
          {/* axis line and the zero baseline the bars grow from */}
          <rect x={g.x0} y={g.axisY - 1} width={axisW} height={2} fill="rgba(232,237,246,0.55)" />
          <rect x={g.x0 - 1} y={g.axisY - (g.axisY - g.plotTop) * easeOutCubic(invLerp(0.35, 0.9, axis))} width={2}
            height={(g.axisY - g.plotTop) * easeOutCubic(invLerp(0.35, 0.9, axis))} fill="rgba(232,237,246,0.55)" />
        </g>

        {chart.bars.map((b, i) => {
          const v = shownValue(chart, i, grow[i]);
          const r = barRect(chart, g, i, v);
          const fo = focus?.[i] ?? 1;
          const bo = barOpacity?.[i] ?? 1;
          const shown = grow[i] > 0;
          const nameY = g.names === 'column' ? g.rowY[i] : g.rowY[i] - g.barH / 2 - g.nameSize * 0.95;
          const nameX = g.names === 'column' ? g.x0 - 28 : g.x0 + 18;
          const nameOn = clamp(names * 3 - i * 0.6);
          const fill = b.hero ? HERO : NEUTRAL;
          return (
            <g key={b.model}>
              <text x={nameX} y={nameY} dominantBaseline="central" textAnchor={g.names === 'column' ? 'end' : 'start'} fontFamily={F.text}
                fontWeight={b.hero ? 650 : 550} fontSize={g.nameSize} fill={C.lunar} opacity={nameOn * textOpacity * (0.35 + 0.65 * fo)}
                style={{ letterSpacing: '0.005em', wordSpacing: '0.08em' }}>
                {b.model}
              </text>
              {shown && (
                <g opacity={bo * (0.4 + 0.6 * fo)}>
                  <path d={barPath(r.x, r.y, r.w, r.h)} fill={fill} />
                  {/* a hairline highlight on the top edge: material, not glow */}
                  <rect x={r.x} y={r.y} width={Math.max(0, r.w - 6)} height={1.5} fill="rgba(255,255,255,0.22)" />
                  {/* leading-edge tick while the bar is still growing (fades as it reaches its value) */}
                  <rect x={r.x + r.w - 2} y={r.y - 6} width={2} height={r.h + 12} fill={C.lunar} opacity={clamp(grow[i] * 10) * (1 - BAR_EASE(clamp(grow[i]))) * 0.9} />
                </g>
              )}
              {shown && (
                <text x={r.x + r.w + g.valueSize * 0.45} y={g.rowY[i]} dominantBaseline="central" fontFamily={F.text} fontWeight={650}
                  fontSize={g.valueSize} fill={C.lunar} opacity={clamp(grow[i] * 6) * textOpacity * (0.35 + 0.65 * fo)}
                  style={{ fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em' }}>
                  {`${fmt(v, 1)}${chart.unit}`}
                </text>
              )}
            </g>
          );
        })}
      </g>
    </svg>
  );
};
