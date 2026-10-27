// The on-screen provenance tag every demo shot carries (see LABELS / sceneManifest PROVENANCE).
// B = "Illustrative reconstruction", C = "Concept visualization". It decodes in over ~0.4 s and then stays.
import React from 'react';
import { useCurrentFrame } from 'remotion';
import { LABELS } from '../data/verifiedClaims';
import { reveal } from '../lib/anim';
import { useLayout } from '../lib/layout';
import { C } from '../styles/theme';
import { F } from '../styles/typography';

const GLYPHS = '▚▞▖▗▘▝░▒';

export const ProvenanceLabel: React.FC<{ kind: 'B' | 'C'; note?: string; at?: number; light?: boolean; align?: 'left' | 'right' }> = ({ kind, note, at = 6, light, align = 'left' }) => {
  const f = useCurrentFrame();
  const L = useLayout();
  const text = (kind === 'B' ? LABELS.B : LABELS.C).toUpperCase();
  const p = reveal(f, at, 12);
  const shown = Math.round(p * text.length);
  const s = text.split('').map((ch, i) => (i < shown ? ch : i < shown + 3 && p > 0 ? GLYPHS[(i + f) % GLYPHS.length] : ' ')).join('');
  const fs = L.t.label;
  const col = light ? C.ink : C.lunar;
  return (
    <div style={{ position: 'absolute', top: L.safe.top + (L.tall ? 8 : 0), [align]: L.safe.side, display: 'flex', flexDirection: 'column',
      alignItems: align === 'left' ? 'flex-start' : 'flex-end', gap: 6, opacity: p > 0 ? 1 : 0, zIndex: 50 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: `${fs * 0.42}px ${fs * 0.75}px`, borderRadius: 4,
        background: light ? 'rgba(255,255,255,0.78)' : 'rgba(6,10,24,0.62)', border: `1px solid ${light ? 'rgba(14,21,38,0.25)' : 'rgba(232,237,246,0.28)'}`,
        backdropFilter: 'blur(6px)' }}>
        <span style={{ width: fs * 0.5, height: fs * 0.5, borderRadius: '50%', background: kind === 'B' ? C.amber : C.violet, boxShadow: `0 0 ${fs * 0.5}px ${kind === 'B' ? C.amber : C.violet}` }} />
        <span style={{ fontFamily: F.mono, fontSize: fs, letterSpacing: '0.08em', color: col, whiteSpace: 'pre', fontWeight: 600 }}>{s}</span>
      </div>
      {note ? <div style={{ fontFamily: F.mono, fontSize: fs * 0.86, color: light ? C.steel : C.silver, opacity: reveal(f, at + 10, 10), maxWidth: L.tall ? L.w - 2 * L.safe.side : 760, textAlign: align }}>{note}</div> : null}
    </div>
  );
};
