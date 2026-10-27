// Kinetic type that acts out its word. Each effect is a pure function of the frame.
//   build   letters assemble from geometric modules (BUILD)
//   depth   a flat plane rotates into extruded depth (3D)
//   faster  letters accelerate in from the left and lock (FASTER)
//   reason  letters light up along linked logic paths (REASON)
//   rise    masked per-letter rise (default hero entrance)
//   decode  scramble and settle (technical labels)
import React from 'react';
import { useCurrentFrame } from 'remotion';
import { clamp, dampedSpring, easeInExpo, easeInOutCubic, easeOutCubic, easeOutExpo, invLerp, lerp, reveal } from '../lib/anim';
import { hash } from '../lib/rng';
import { C } from '../styles/theme';
import { F } from '../styles/typography';

export type Fx = 'build' | 'depth' | 'faster' | 'reason' | 'rise' | 'decode';

interface P { text: string; fx?: Fx; at?: number; size: number; color?: string; font?: string; weight?: number; tracking?: number; out?: number; style?: React.CSSProperties; accent?: string }

const SCR = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#/<>{}';

export const KineticTitle: React.FC<P> = ({ text, fx = 'rise', at = 0, size, color = C.lunar, font = F.head, weight = 700, tracking = -0.01, out, style, accent = C.alert }) => {
  const f = useCurrentFrame() - at;
  const chars = text.split('');
  const n = chars.length;
  const outP = out !== undefined ? easeInOutCubic(invLerp(out - at, out - at + 12, f)) : 0;
  const base: React.CSSProperties = { fontFamily: font, fontSize: size, fontWeight: weight, letterSpacing: `${tracking}em`, color, lineHeight: 1, whiteSpace: 'pre',
    display: 'inline-flex', position: 'relative', opacity: 1 - outP, ...style };

  if (fx === 'depth') {
    const p = easeOutExpo(invLerp(0, 34, f));
    const ry = lerp(88, -18, p), rx = lerp(0, 8, p), layers = 14, depth = lerp(0, size * 0.32, easeOutCubic(invLerp(8, 40, f)));
    return (
      <div style={{ ...base, perspective: size * 9, display: 'inline-block' }}>
        <div style={{ position: 'relative', transformStyle: 'preserve-3d', transform: `rotateY(${ry}deg) rotateX(${rx}deg)` }}>
          {Array.from({ length: layers }, (_, i) => (
            <div key={i} style={{ position: i ? 'absolute' : 'relative', inset: 0, transform: `translateZ(${-(i / (layers - 1)) * depth}px)`,
              color: i === 0 ? color : `rgba(92,225,255,${0.5 - (i / layers) * 0.42})`, WebkitTextStroke: i === 0 ? undefined : `1px rgba(92,225,255,${0.55 - (i / layers) * 0.4})` }}>{text}</div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={base}>
      {fx === 'reason' && <ReasonPaths n={n} f={f} size={size} accent={accent} />}
      {chars.map((ch, i) => {
        const r = hash(i, n, 7);
        if (fx === 'build') {
          const t0 = i * Math.min(3, 30 / n), p = easeInOutCubic(invLerp(t0 + 8, t0 + 20, f));
          return (
            <span key={i} style={{ position: 'relative', display: 'inline-block' }}>
              <span style={{ opacity: p, filter: `blur(${(1 - p) * 6}px)` }}>{ch}</span>
              {ch !== ' ' && Array.from({ length: 6 }, (_, k) => {
                const q = easeOutCubic(invLerp(t0 + k, t0 + 14 + k, f)), a = hash(i, k, 3) * Math.PI * 2, d = size * (0.9 + hash(k, i) * 1.3);
                const x = Math.cos(a) * d * (1 - q), y = Math.sin(a) * d * (1 - q), s = size * (0.16 + 0.1 * hash(i + k, 9));
                return <span key={k} style={{ position: 'absolute', left: `${20 + (k % 3) * 25}%`, top: `${20 + Math.floor(k / 3) * 45}%`, width: s, height: s,
                  transform: `translate(${x}px,${y}px) rotate(${(1 - q) * 180 + k * 45}deg)`, border: `${Math.max(1.5, size * 0.018)}px solid ${accent}`,
                  borderRadius: k % 3 === 0 ? '50%' : 2, opacity: q * (1 - p) * 0.95, boxShadow: `0 0 ${size * 0.08}px ${accent}` }} />;
              })}
            </span>
          );
        }
        if (fx === 'faster') {
          const t0 = i * 1.6, u = invLerp(t0, t0 + 13, f);
          const x = u < 1 ? -size * 7 * (1 - easeInExpo(u) ** 0.35) : (1 - dampedSpring((f - t0 - 13) / 30, 26, 0.38)) * size * 0.12;
          const smear = u < 1 ? clamp(1 - u) : 0;
          return <span key={i} style={{ display: 'inline-block', transform: `translateX(${x}px) skewX(${-smear * 18}deg)`, opacity: clamp(u * 3),
            textShadow: smear > 0.05 ? `${-size * 0.4 * smear}px 0 ${size * 0.12}px ${accent}, ${-size * 0.9 * smear}px 0 ${size * 0.2}px rgba(92,225,255,0.35)` : 'none' }}>{ch}</span>;
        }
        if (fx === 'decode') {
          const t0 = i * 1.2, settle = f > t0 + 8;
          const c = ch === ' ' ? ' ' : settle ? ch : SCR[Math.floor(hash(i, Math.floor(f / 2)) * SCR.length)];
          return <span key={i} style={{ opacity: f > t0 ? 1 : 0, color: settle ? undefined : accent }}>{c}</span>;
        }
        if (fx === 'reason') {
          const p = easeOutCubic(invLerp(4 + i * 4, 14 + i * 4, f));
          return <span key={i} style={{ display: 'inline-block', opacity: f < 0 ? 0 : 0.15 + 0.85 * p, color: p < 0.99 ? accent : color, transform: `translateY(${(1 - p) * size * 0.08}px)`, position: 'relative', zIndex: 1 }}>{ch}</span>;
        }
        // rise
        const t0 = i * 1.4 + r * 2, p = easeOutExpo(invLerp(t0, t0 + 18, f));
        return (
          <span key={i} style={{ display: 'inline-block', overflow: 'hidden', paddingBottom: '0.08em', marginBottom: '-0.08em' }}>
            <span style={{ display: 'inline-block', transform: `translateY(${(1 - p) * 105}%)` }}>{ch}</span>
          </span>
        );
      })}
    </div>
  );
};

/** nodes under each letter joined by orthogonal "logic" paths that draw left to right */
const ReasonPaths: React.FC<{ n: number; f: number; size: number; accent: string }> = ({ n, f, size, accent }) => {
  const w = n * size * 0.86, hgt = size * 1.6;
  const pts = Array.from({ length: n }, (_, i) => [((i + 0.5) / n) * w, size * (0.5 + (hash(i, 2) - 0.5) * 1.1) + size * 0.3] as const);
  return (
    <svg width={w} height={hgt} style={{ position: 'absolute', left: 0, top: -size * 0.3, overflow: 'visible' }}>
      {pts.slice(1).map((p, i) => {
        const a = pts[i], q = reveal(f, i * 4, 8), mx = (a[0] + p[0]) / 2;
        const d = `M${a[0]},${a[1]} H${mx} V${p[1]} H${p[0]}`;
        return <path key={i} d={d} fill="none" stroke={accent} strokeWidth={Math.max(1.5, size * 0.02)} strokeDasharray={size * 3} strokeDashoffset={size * 3 * (1 - q)} opacity={0.55} />;
      })}
      {pts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r={size * 0.045} fill={accent} opacity={reveal(f, i * 4, 6) * 0.9} />)}
    </svg>
  );
};
