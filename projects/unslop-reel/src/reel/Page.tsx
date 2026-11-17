// A real captured page in a quiet window, viewed through a moving camera (css point at the window centre, z = screen
// px per css px), with a magnifier that shows the same image at z x mag centred on an exact sentence box from
// src/config/pages.json. White box = "this is the source"; red is reserved for slop.
import React from 'react';
import { Img, staticFile } from 'remotion';
import { C, F } from './style';

export type Box = { x: number; y: number; w: number; h: number };
export type View = { cx: number; cy: number; z: number };
export type LensSpec = { at: Box; mag: number; r: number; k: number; dx?: number; dy?: number };

export const PageWin: React.FC<{ img: string; cssW: number; cssH: number; win: Box; view: View; url: string; lens?: LensSpec; marks?: { b: Box; k: number }[]; k?: number; drift?: number; children?: React.ReactNode }> = ({ img, cssW, cssH, win, view: v0, url, lens, marks = [], k = 1, drift = 0, children }) => {
  // a slow creep (5 css px/s down, +1.2 %/s zoom) so a held page is never a dead frame; the lens rides with it
  const view = { cx: v0.cx, cy: v0.cy + drift * 5, z: v0.z * (1 + drift * 0.012) };
  const bar = 56, iw = win.w, ih = win.h - bar;
  const left = iw / 2 - view.cx * view.z, top = ih / 2 - view.cy * view.z;
  const L = lens && lens.k > 0 ? (() => {
    const lx = lens.at.x + lens.at.w / 2, ly = lens.at.y + lens.at.h / 2, r = lens.r * lens.k, m = view.z * lens.mag;
    const sx = left + lx * view.z + (lens.dx ?? 0), sy = bar + top + ly * view.z + (lens.dy ?? 0);
    return (
      <div style={{ position: 'absolute', left: sx - r, top: sy - r, width: 2 * r, height: 2 * r, borderRadius: '50%', overflow: 'hidden', boxShadow: `0 0 0 4px ${C.ivory}, 0 24px 60px rgba(0,0,0,.55)`, background: '#0d1117' }}>
        <Img src={staticFile(img)} style={{ position: 'absolute', left: r - lx * m, top: r - ly * m, width: cssW * m, height: cssH * m, maxWidth: 'none' }} />
        <div style={{ position: 'absolute', left: r - (lens.at.w / 2 + 6) * m, top: r - (lens.at.h / 2 + 4) * m, width: (lens.at.w + 12) * m, height: (lens.at.h + 8) * m, border: `${2 / Math.max(0.6, lens.k)}px solid ${C.ivory}`, borderRadius: 6, opacity: lens.k }} />
      </div>
    );
  })() : null;
  return (
    <div style={{ position: 'absolute', left: win.x, top: win.y, width: win.w, height: win.h, opacity: Math.min(1, 0.25 + k * 1.5), transform: `translateY(${(1 - k) * 90}px)` }}>
      <div style={{ position: 'absolute', inset: 0, borderRadius: 18, overflow: 'hidden', background: C.raised, boxShadow: `0 0 0 1px ${C.hair}, 0 30px 70px rgba(0,0,0,.45)` }}>
        <div style={{ height: bar, display: 'flex', alignItems: 'center', padding: '0 24px', gap: 10, borderBottom: `1px solid ${C.hair}` }}>
          <span style={{ fontFamily: F.mono, fontSize: 22, color: C.muted }}>{url}</span>
        </div>
        <div style={{ position: 'absolute', left: 0, top: bar, width: iw, height: ih, overflow: 'hidden' }}>
          <Img src={staticFile(img)} style={{ position: 'absolute', left, top, width: cssW * view.z, height: cssH * view.z, maxWidth: 'none' }} />
          {marks.map((m, i) => m.k > 0 ? <div key={i} style={{ position: 'absolute', left: left + (m.b.x - 6) * view.z, top: top + (m.b.y - 4) * view.z, width: (m.b.w + 12) * view.z * m.k, height: (m.b.h + 8) * view.z, border: `2px solid ${C.ivory}`, borderRadius: 6 }} /> : null)}
        </div>
      </div>
      {L}
      {children}
    </div>
  );
};
