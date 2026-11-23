// Shared pieces: the SOURCE strip (a crop of the real captured page, scrolled to the proof line, highlighted) and the
// real terminal (our run's verbatim output from docs/receipts.json).
import React from 'react';
import { Img, staticFile } from 'remotion';
import { C, FONT } from '../themes/tokens';
import { clamp, easeOutCubic, easeOutQuint, lerp } from '../animation/anim';
import SRC from '../config/sources.json';

type Src = { host: string; title: string; box: { x: number; y: number; width: number; height: number } | null };
const SOURCES = SRC as unknown as Record<string, Src>;

/** a strip of the real source page (900 CSS px wide capture @2x), centred on the proof line, which gets highlighted */
export const Receipt: React.FC<{ id: string; t: number; at: number; y?: number; h?: number }> = ({ id, t, at, y = 250, h = 170 }) => {
  const s = SOURCES[id];
  if (!s || !s.box || t < at) return null;
  const inP = easeOutQuint(clamp((t - at) / 0.4)), hl = easeOutCubic(clamp((t - at - 0.35) / 0.35));
  const W = 920, k = W / 900, b = s.box;
  const cropTop = Math.max(0, b.y + b.height / 2 - (h - 44) / (2 * k));
  return (
    <div style={{ position: 'absolute', left: 80, top: y, width: W, height: h, transform: `translateY(${lerp(-60, 0, inP)}px)`, opacity: inP,
      borderRadius: 18, overflow: 'hidden', background: '#fff', boxShadow: `0 10px 0 ${C.deep}`, border: `4px solid ${C.ink}` }}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 40, background: '#EEF0F7', display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px', zIndex: 2,
        fontFamily: FONT.ui, fontWeight: 800, fontSize: 22, color: '#3A3D5C' }}>
        <span style={{ background: C.ink, color: C.scale, borderRadius: 8, padding: '2px 10px', fontSize: 18 }}>SOURCE</span>
        <span>{s.host}</span>
      </div>
      <div style={{ position: 'absolute', left: 0, top: 40, width: W, height: h - 40, overflow: 'hidden' }}>
        <Img src={staticFile(`receipts/${id}.png`)} style={{ position: 'absolute', left: 0, top: -cropTop * k, width: W }} />
        <div style={{ position: 'absolute', left: (b.x - 6) * k, top: (b.y - cropTop - 4) * k, width: (b.width + 12) * k * hl, height: (b.height + 8) * k,
          background: 'rgba(255,210,63,0.45)', mixBlendMode: 'multiply', borderRadius: 4 }} />
      </div>
    </div>
  );
};

export type TLine = { at: number; s: string; kind?: 'in' | 'out' | 'bad' | 'ok'; d?: number };
/** a terminal window; input lines type in, output lines appear whole */
export const Terminal: React.FC<{ t: number; x: number; y: number; w: number; lines: TLine[]; size?: number; title?: string; inAt: number }> = ({ t, x, y, w, lines, size = 40, title = 'python · hamare laptop pe run', inAt }) => {
  const inP = easeOutQuint(clamp((t - inAt) / 0.35));
  const shown = lines.filter((l) => t >= l.at);
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: w, transform: `scale(${lerp(0.92, 1, inP)})`, opacity: inP, transformOrigin: 'center top',
      background: C.code, borderRadius: 24, border: '4px solid #2E3378', boxShadow: `0 12px 0 ${C.deep}`, padding: '58px 30px 26px' }}>
      <div style={{ position: 'absolute', left: 20, top: 18, display: 'flex', gap: 10 }}>
        {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => <div key={c} style={{ width: 18, height: 18, borderRadius: 9, background: c }} />)}
      </div>
      <div style={{ position: 'absolute', right: 22, top: 14, fontFamily: FONT.mono, fontSize: 20, color: C.dim }}>{title}</div>
      {shown.map((l, i) => {
        const typed = l.kind === 'in' || !l.kind ? l.s.slice(0, Math.round(l.s.length * clamp((t - l.at) / (l.d ?? 0.5)))) : l.s;
        const col = l.kind === 'bad' ? C.na : l.kind === 'ok' ? C.haan : l.kind === 'out' ? '#FFFFFF' : '#C9D2FF';
        return (
          <div key={i} style={{ fontFamily: FONT.mono, fontWeight: 700, fontSize: size, lineHeight: 1.35, color: col, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {(l.kind === 'in' || !l.kind) && <span style={{ color: C.scale }}>{'>>> '}</span>}{typed}
          </div>
        );
      })}
    </div>
  );
};

/** a word that lands from oversize (decelerate in) */
export const land = (t: number, at: number, d = 0.22) => {
  const p = clamp((t - at) / d);
  return p <= 0 ? 0 : 1 + (1 - easeOutCubic(p)) * 0.6;
};

/** a big centred title with an optional sub line */
export const Big: React.FC<{ t: number; at: number; y: number; text: string; sub?: string; color?: string; size?: number }> = ({ t, at, y, text, sub, color = '#fff', size = 96 }) => {
  if (t < at) return null;
  return (
    <div style={{ position: 'absolute', left: 40, right: 40, top: y, textAlign: 'center', transform: `scale(${land(t, at)})` }}>
      <div style={{ fontFamily: FONT.display, fontWeight: 900, fontSize: size, lineHeight: 1, color, fontStretch: '82%' }}>{text}</div>
      {sub && <div style={{ marginTop: 14, fontFamily: FONT.ui, fontWeight: 750, fontSize: 40, color: C.scale }}>{sub}</div>}
    </div>
  );
};
