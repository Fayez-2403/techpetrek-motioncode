// The hero object: a slice of a Mumbai local coach (maroon + cream) with its barred window. The window frames exactly
// k tiles; the coach slices on either side hide a little of the platform, the roof and wheels say "train".
import React from 'react';
import { C, FONT } from '../themes/tokens';

export const MAROON = '#7A1F2B', CREAM = '#F1E3C2', STEEL = '#C9CFD6';

/** a strip of value tiles (overs / array cells / letters) */
export const Tiles: React.FC<{ x0: number; y: number; w: number; gap: number; h: number; vals: (number | string)[]; label?: (i: number) => string;
  fill?: (i: number) => string; textCol?: (i: number) => string; drop?: (i: number) => number; size?: number }> = ({ x0, y, w, gap, h, vals, label, fill, textCol, drop, size = 64 }) => (
  <g>
    {vals.map((v, i) => {
      const x = x0 + i * (w + gap), d = drop ? drop(i) : 1;
      if (d <= 0) return null;
      const dy = (1 - d) * -260;
      return (
        <g key={i} transform={`translate(0 ${dy})`} opacity={Math.min(1, d * 1.5)}>
          <rect x={x} y={y - h / 2 + 8} width={w} height={h} rx={14} fill={C.deep} opacity={0.45} />
          <rect x={x} y={y - h / 2} width={w} height={h} rx={14} fill={fill ? fill(i) : C.scale} />
          {label && <text x={x + w / 2} y={y - h / 2 + 30} textAnchor="middle" fontFamily={FONT.ui} fontWeight={800} fontSize={20} fill={C.ink} opacity={0.7}>{label(i)}</text>}
          <text x={x + w / 2} y={y + (label ? 30 : size * 0.36)} textAnchor="middle" fontFamily={FONT.display} fontWeight={900} fontSize={size} fill={textCol ? textCol(i) : C.ink}>{v}</text>
        </g>
      );
    })}
  </g>
);

/** the coach slice with its window. (x, y) = window aperture top-left; aw x ah = aperture. */
export const Khidki: React.FC<{ x: number; y: number; aw: number; ah: number; t: number; glow?: string; moving?: number; mini?: boolean }> = ({ x, y, aw, ah, t, glow, moving = 0, mini = false }) => {
  const side = mini ? 14 : 70, top = mini ? 12 : 54, bot = mini ? 12 : 64, fw = mini ? 8 : 16;
  const X0 = x - side, X1 = x + aw + side, Y0 = y - top, Y1 = y + ah + bot;
  const id = `kh${Math.round(x)}_${Math.round(y)}_${mini ? 'm' : 'b'}`;
  const shake = moving > 0 ? Math.sin(t * 60) * 2 * moving : 0;
  return (
    <g transform={`translate(0 ${shake})`}>
      <defs>
        <mask id={id}>
          <rect x={X0 - 10} y={Y0 - 60} width={X1 - X0 + 20} height={Y1 - Y0 + 140} fill="#fff" />
          <rect x={x} y={y} width={aw} height={ah} rx={mini ? 8 : 18} fill="#000" />
        </mask>
      </defs>
      <g mask={`url(#${id})`}>
        {!mini && <path d={`M ${X0} ${Y0} Q ${(X0 + X1) / 2} ${Y0 - 46} ${X1} ${Y0} Z`} fill="#5E6A78" />}
        <rect x={X0} y={Y0} width={X1 - X0} height={Y1 - Y0} rx={mini ? 10 : 20} fill={CREAM} />
        <rect x={X0} y={y + ah * 0.62} width={X1 - X0} height={Y1 - (y + ah * 0.62)} rx={mini ? 10 : 20} fill={MAROON} />
        <rect x={X0} y={y + ah * 0.62} width={X1 - X0} height={mini ? 4 : 10} fill="#F2C14E" />
        {/* the window frame */}
        <rect x={x - fw} y={y - fw} width={aw + 2 * fw} height={ah + 2 * fw} rx={mini ? 12 : 24} fill="#3B3F4A" />
      </g>
      {/* bars (top and bottom thirds, so the numbers stay readable) */}
      {[0.16, 0.84].map((f) => <rect key={f} x={x} y={y + ah * f - (mini ? 2 : 4)} width={aw} height={mini ? 4 : 8} rx={4} fill={STEEL} opacity={0.95} />)}
      {glow && <rect x={x - 4} y={y - 4} width={aw + 8} height={ah + 8} rx={mini ? 10 : 20} fill="none" stroke={glow} strokeWidth={mini ? 5 : 9} />}
      {!mini && (
        <g>
          {[X0 + 40, X1 - 40].map((wx) => (
            <g key={wx} transform={`translate(${wx} ${Y1 + 18}) rotate(${(t * 900 * moving) % 360})`}>
              <circle r={26} fill="#22252E" /><circle r={10} fill="#8A93A3" />
              <rect x={-2} y={-24} width={4} height={48} fill="#8A93A3" />
            </g>
          ))}
          <text x={(X0 + X1) / 2} y={Y1 - 18} textAnchor="middle" fontFamily={FONT.ui} fontWeight={900} fontSize={24} fill={CREAM} opacity={0.85}>KHIDKI · k = 3</text>
        </g>
      )}
    </g>
  );
};
