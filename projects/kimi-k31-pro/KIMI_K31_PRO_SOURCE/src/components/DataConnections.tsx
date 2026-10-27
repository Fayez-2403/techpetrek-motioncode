// Connector and citation lines for analytical scenes (finance, agent graphs): a line draws on from a source (a cell, a
// figure on a page) to a target (a formula cell, a chart mark, a node), lands with a small pulse, then data points travel
// along it. Pure function of the frame `f` passed in (no hooks), so it can live inside a CSS 3D desk or a thumbnail.
import React from 'react';
import { clamp, easeInOutCubic, easeOutCubic, invLerp, lerp } from '../lib/anim';

export type Pt = readonly [number, number];

export interface Link {
  from: Pt;
  to: Pt;
  /** frame the line starts drawing */
  at: number;
  /** frames to draw from source to target (default 14) */
  dur?: number;
  color?: string;
  width?: number;
  /** arc: bowed curve (bend = signed bulge, fraction of chord); flow: horizontal S (node-graph); vflow: vertical S */
  route?: 'arc' | 'flow' | 'vflow' | 'straight';
  bend?: number;
  /** waypoints: the line runs smoothly through them (overrides route/bend), e.g. along the gutters between panels */
  via?: Pt[];
  /** travelling data points (0 = none) */
  dots?: number;
  dotR?: number;
  /** data-point speed, px per frame */
  speed?: number;
  /** data points run target -> source (e.g. a citation tracing back to its page) */
  reverse?: boolean;
  /** static dash pattern (citation trails); `march` px/frame animates it */
  dash?: number[];
  march?: number;
  arrow?: boolean;
  origin?: boolean;
  pulse?: boolean;
  glow?: boolean;
  opacity?: number;
  /** frame the line starts fading to `rest` opacity (over `outDur` frames) */
  out?: number;
  outDur?: number;
  rest?: number;
}

const N = 56;

function viaSamples(l: Link): { pts: [number, number][]; len: number[] } {
  const P = [l.from, ...(l.via ?? []), l.to];
  const seg = P.length - 1, per = Math.max(8, Math.ceil(N / seg) + 4);
  const pts: [number, number][] = [], len: number[] = [];
  let acc = 0;
  for (let i = 0; i < seg; i++) {
    const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(seg, i + 2)];
    for (let k = i ? 1 : 0; k <= per; k++) {
      const t = k / per, t2 = t * t, t3 = t2 * t;
      const x = 0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3);
      const y = 0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3);
      if (pts.length) acc += Math.hypot(x - pts[pts.length - 1][0], y - pts[pts.length - 1][1]);
      pts.push([x, y]); len.push(acc);
    }
  }
  return { pts, len };
}

function samples(l: Link): { pts: [number, number][]; len: number[] } {
  if (l.via && l.via.length) return viaSamples(l);
  const [x0, y0] = l.from, [x3, y3] = l.to;
  const dx = x3 - x0, dy = y3 - y0, d = Math.hypot(dx, dy) || 1;
  const route = l.route ?? 'arc';
  let c1: [number, number], c2: [number, number];
  if (route === 'flow') {
    const k = Math.max(Math.abs(dx) * 0.5, 24);
    c1 = [x0 + k * Math.sign(dx || 1), y0]; c2 = [x3 - k * Math.sign(dx || 1), y3];
  } else if (route === 'vflow') {
    const k = Math.max(Math.abs(dy) * 0.5, 24);
    c1 = [x0, y0 + k * Math.sign(dy || 1)]; c2 = [x3, y3 - k * Math.sign(dy || 1)];
  } else {
    const b = route === 'straight' ? 0 : (l.bend ?? 0.18) * d, nx = -dy / d, ny = dx / d;
    c1 = [x0 + dx * 0.3 + nx * b, y0 + dy * 0.3 + ny * b];
    c2 = [x0 + dx * 0.7 + nx * b, y0 + dy * 0.7 + ny * b];
  }
  const pts: [number, number][] = [], len: number[] = [];
  let acc = 0;
  for (let i = 0; i <= N; i++) {
    const t = i / N, u = 1 - t;
    const x = u * u * u * x0 + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * x3;
    const y = u * u * u * y0 + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * y3;
    if (i) acc += Math.hypot(x - pts[i - 1][0], y - pts[i - 1][1]);
    pts.push([x, y]); len.push(acc);
  }
  return { pts, len };
}

/** point and tangent angle at arc length s */
function at(pts: [number, number][], len: number[], s: number): [number, number, number] {
  const L = len[len.length - 1];
  s = clamp(s, 0, L);
  let i = 1;
  while (i < len.length - 1 && len[i] < s) i++;
  const a = pts[i - 1], b = pts[i], seg = len[i] - len[i - 1] || 1, t = (s - len[i - 1]) / seg;
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), Math.atan2(b[1] - a[1], b[0] - a[0])];
}

function partialPath(pts: [number, number][], len: number[], s: number) {
  if (s <= 0) return '';
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    if (len[i] >= s) {
      const [x, y] = at(pts, len, s);
      d += ` L${x.toFixed(1)},${y.toFixed(1)}`;
      break;
    }
    d += ` L${pts[i][0].toFixed(1)},${pts[i][1].toFixed(1)}`;
  }
  return d;
}

export const ConnectorLine: React.FC<{ f: number; l: Link }> = ({ f, l }) => {
  const dur = l.dur ?? 14;
  const p = easeInOutCubic(invLerp(l.at, l.at + dur, f));
  if (p <= 0) return null;
  const { pts, len } = samples(l);
  const L = len[len.length - 1];
  const s = p * L;
  const col = l.color ?? '#1F6FE0';
  const w = l.width ?? 2;
  const fade = l.out !== undefined ? lerp(1, l.rest ?? 0, easeInOutCubic(invLerp(l.out, l.out + (l.outDur ?? 12), f))) : 1;
  const op = (l.opacity ?? 1) * fade;
  if (op <= 0.001) return null;
  const d = partialPath(pts, len, s);
  const [tx, ty, ta] = at(pts, len, s);
  const landed = f - (l.at + dur);
  const pulse = l.pulse !== false && landed >= 0 && landed < 18 ? landed / 18 : -1;
  const nd = l.dots ?? 0, speed = l.speed ?? 9, dr = l.dotR ?? w * 1.9;
  const dotT0 = l.at + dur * 0.55;
  const ah = w * 4.2;
  return (
    <g opacity={op}>
      {l.glow !== false && <path d={d} fill="none" stroke={col} strokeWidth={w * 4} strokeLinecap="round" opacity={0.14} />}
      <path d={d} fill="none" stroke={col} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round"
        strokeDasharray={l.dash ? l.dash.join(' ') : undefined} strokeDashoffset={l.dash ? -(f * (l.march ?? 0)) : undefined} />
      {l.origin !== false && <circle cx={l.from[0]} cy={l.from[1]} r={w * 2.1} fill={col} opacity={easeOutCubic(invLerp(l.at, l.at + 5, f))} />}
      {l.arrow !== false && (
        <path d={`M${ah},0 L${-ah * 0.55},${ah * 0.62} L${-ah * 0.25},0 L${-ah * 0.55},${-ah * 0.62} Z`} fill={col}
          transform={`translate(${tx.toFixed(1)},${ty.toFixed(1)}) rotate(${((ta * 180) / Math.PI).toFixed(2)})`} />
      )}
      {pulse >= 0 && <circle cx={l.to[0]} cy={l.to[1]} r={lerp(w * 2, w * 9, easeOutCubic(pulse))} fill="none" stroke={col}
        strokeWidth={Math.max(1, w * 0.8)} opacity={(1 - pulse) * 0.8} />}
      {nd > 0 && f > dotT0 && Array.from({ length: nd }, (_, k) => {
        const run = (f - dotT0) * speed + (k * L) / nd;
        const sk0 = ((run % L) + L) % L;
        const sk = l.reverse ? L - sk0 : sk0;
        if (sk > s) return null;
        const [x, y] = at(pts, len, sk);
        const edge = Math.sin(Math.PI * clamp(sk / L)) ** 0.6;
        const birth = clamp((f - dotT0) / 8);
        return <circle key={k} cx={x} cy={y} r={dr} fill={col} opacity={edge * birth} />;
      })}
    </g>
  );
};

/** A layer of connectors in one coordinate space (width x height px). */
export const DataConnections: React.FC<{ f: number; links: Link[]; width: number; height: number; style?: React.CSSProperties }> = ({ f, links, width, height, style }) => (
  <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}
    style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none', ...style }}>
    {links.map((l, i) => <ConnectorLine key={i} f={f} l={l} />)}
  </svg>
);

/** Position along a link's path at progress u (0..1), for things that ride a connector (flying figures, data points). */
export function pointOn(l: Pick<Link, 'from' | 'to' | 'route' | 'bend' | 'via'>, u: number): [number, number] {
  const { pts, len } = samples(l as Link);
  const [x, y] = at(pts, len, clamp(u) * len[len.length - 1]);
  return [x, y];
}
