// Cover (1080x1920): three battles as three face-off rows, each a real frame from the reel's own captures (public/cover/,
// out/clips_raw at the times in FRAMES). Fictional cast with AI-generated photo faces; no real person's face or name.
// Instagram's grid crops to the centre 3:4 (y 240..1680): title and all three rows sit inside it.
import React from 'react';
import { AbsoluteFill, Img, staticFile } from 'remotion';
import { C, FONT, ink } from '../themes/tokens';

/** one character: its frame, and where its face sits in that 1080x1920 frame (x, y) */
type Pic = { file: string; name: string; x: number; y: number };
const ROWS: { label: string; a: Pic; b: Pic }[] = [
  { label: 'CEO vs CEO', a: { file: 'founder', name: 'Hoodie Founder', x: 580, y: 1080 }, b: { file: 'boss', name: 'Boardroom Boss', x: 520, y: 1060 } },     // hookA 0.75 s, hookB 1.65 s
  { label: 'LEADER vs LEADER', a: { file: 'president', name: 'The President', x: 500, y: 1080 }, b: { file: 'chancellor', name: 'The Chancellor', x: 560, y: 1020 } },   // lead3 1.05 s, lead2 1.35 s
  { label: 'NETA vs NETA', a: { file: 'neta1', name: 'Neta No. 1', x: 450, y: 1200 }, b: { file: 'neta2', name: 'Neta No. 2', x: 620, y: 940 } },   // neta3 1.75 s, neta2 1.35 s
];
const CW = 430, CH = 330, Z = 0.46;   // cell size, frame zoom (head + shoulders: the 3D dancer reads, not just the photo)

const Cell: React.FC<{ p: Pic; col: string }> = ({ p, col }) => (
  <div style={{ position: 'relative', width: CW, height: CH + 40 }}>
    <div style={{ position: 'relative', width: CW, height: CH, borderRadius: 28, overflow: 'hidden', border: `5px solid ${col}`, boxShadow: ink(10), background: C.base }}>
      <Img src={staticFile(`cover/${p.file}.png`)} style={{ position: 'absolute', width: 1080 * Z, height: 1920 * Z, left: CW / 2 - p.x * Z, top: CH * 0.42 - p.y * Z }} />
    </div>
    <div style={{ position: 'absolute', left: '50%', bottom: 0, transform: 'translateX(-50%)', whiteSpace: 'nowrap', padding: '6px 16px', borderRadius: 10,
      background: col, color: C.base, fontFamily: FONT.display, fontWeight: 900, fontStretch: '80%', fontSize: 30, textTransform: 'uppercase' }}>{p.name}</div>
  </div>
);

export const Cover: React.FC = () => (
  <AbsoluteFill style={{ background: `radial-gradient(120% 70% at 50% 45%, #1a1030 0%, ${C.base} 70%)` }}>
    <div style={{ position: 'absolute', left: 0, right: 0, top: 250, textAlign: 'center' }}>
      <div style={{ fontFamily: FONT.mono, fontWeight: 700, fontSize: 36, letterSpacing: '0.3em', color: C.lime }}>3 BATTLES · 1 APP</div>
      <div style={{ fontFamily: FONT.display, fontWeight: 900, fontStretch: '72%', fontSize: 150, lineHeight: 0.9, color: C.ink, textShadow: `8px 8px 0 ${C.accent2}`, marginTop: 6 }}>DISS BATTLE</div>
    </div>
    <div style={{ position: 'absolute', left: 0, right: 0, top: 470, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22 }}>
      {ROWS.map((r) => (
        <div key={r.label} style={{ position: 'relative', display: 'flex', gap: 40 }}>
          <Cell p={r.a} col={C.accent} />
          <Cell p={r.b} col={C.accent2} />
          <div style={{ position: 'absolute', left: '50%', top: CH / 2, transform: 'translate(-50%, -50%) rotate(-8deg)', width: 112, height: 112, borderRadius: '50%',
            background: C.lime, border: `6px solid ${C.base}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: FONT.display, fontWeight: 900, fontSize: 56, color: C.base }}>VS</div>
        </div>
      ))}
    </div>
    <div style={{ position: 'absolute', left: 0, right: 0, top: 1690, textAlign: 'center', fontFamily: FONT.display, fontWeight: 900, fontSize: 64, letterSpacing: '0.12em', color: C.ink }}>
      AFTER<span style={{ color: C.accent }}>CODE</span>
    </div>
    <div style={{ position: 'absolute', left: 0, right: 0, top: 1772, textAlign: 'center', fontFamily: FONT.ui, fontSize: 22, color: C.ink2 }}>fictional characters · AI-generated faces</div>
  </AbsoluteFill>
);
