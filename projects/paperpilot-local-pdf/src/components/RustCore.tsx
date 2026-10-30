// The Rust engine as a computational object: concentric rings, counter-rotating tick bands, traces and a lit centre.
// No humanoid, no brain, no Rust trademark: just "RUST CORE" set in mono.
import React from 'react';
import { C, FONT, glow } from '../themes/tokens';

export const RustCore: React.FC<{ g: number; size: number; x: number; y: number; power?: number; label?: string; style?: React.CSSProperties }> =
  ({ g, size, x, y, power = 1, label = 'RUST CORE', style }) => {
    const r = size / 2, rot = g * 0.6, pulse = 0.75 + 0.25 * Math.sin(g / 9);
    return (
      <div style={{ position: 'absolute', left: x - r, top: y - r, width: size, height: size, ...style }}>
        <div style={{ position: 'absolute', inset: -size * 0.35, borderRadius: '50%', background: `radial-gradient(closest-side, ${C.rust}${Math.round(60 * power).toString(16).padStart(2, '0')}, transparent)` }} />
        <svg width={size} height={size} viewBox="-100 -100 200 200" style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
          <circle r={96} fill="none" stroke={C.rust} strokeOpacity={0.35} strokeWidth={1.2} strokeDasharray="2 5" transform={`rotate(${rot})`} />
          <circle r={86} fill="none" stroke={C.rust} strokeWidth={2.5} strokeDasharray="60 18 8 18" transform={`rotate(${-rot * 1.4})`} style={{ filter: `drop-shadow(0 0 4px ${C.rust})` }} />
          {Array.from({ length: 48 }, (_, i) => (
            <line key={i} x1={0} y1={-74} x2={0} y2={i % 4 ? -69 : -64} stroke={C.ink} strokeOpacity={0.45} strokeWidth={1.2} transform={`rotate(${i * 7.5 + rot * 0.8})`} />
          ))}
          <circle r={58} fill="#160E0A" stroke={C.rust} strokeOpacity={0.8} strokeWidth={1.5} />
          {[0, 1, 2].map((i) => (
            <circle key={i} r={44 - i * 10} fill="none" stroke={i === 1 ? C.cyan : C.rust} strokeOpacity={0.7} strokeWidth={1.4}
              strokeDasharray={`${18 + i * 8} ${10 + i * 6}`} strokeDashoffset={-g * (1.5 + i)} />
          ))}
          <polygon points="0,-20 17,-10 17,10 0,20 -17,10 -17,-10" fill={C.rust} fillOpacity={0.25 + 0.35 * pulse * power} stroke={C.rust} strokeWidth={1.5} />
        </svg>
        <div style={{ position: 'absolute', left: 0, right: 0, top: size + 14, textAlign: 'center', fontFamily: FONT.mono, fontWeight: 700, fontSize: Math.max(18, size * 0.075),
          letterSpacing: 4, color: C.rust, textShadow: glow(0.6 * power, C.rust, 20) }}>{label}</div>
      </div>
    );
  };
