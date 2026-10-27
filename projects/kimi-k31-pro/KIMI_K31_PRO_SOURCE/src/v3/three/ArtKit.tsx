// Shared kit for the v3art shots (ArtWebsite, StoryWeb, InteractiveArt): a pixel camera (z = 0 plane maps 1:1 to the
// canvas pixels), sRGB colour helpers for raw shader output, a generic browser window (no real browser's branding)
// and a deterministic pointer. Everything is a pure function of the props the scenes derive from the frame.
import React from 'react';
import { CamRig, fitDistance } from '../../three/stage';
import { F } from '../../styles/typography';

/** '#RRGGBB' -> [r, g, b] in 0..1, kept in sRGB (raw ShaderMaterials write straight to the canvas) */
export const rgb = (hex: string): [number, number, number] => {
  const n = parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};
export const mixRgb = (a: string, b: string, t: number): [number, number, number] => {
  const A = rgb(a), B = rgb(b);
  return [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t];
};

/** camera for a canvas of w x h px so world units at z = 0 are pixels (origin at the centre, y up) */
export const PxCam: React.FC<{ h: number; fov?: number }> = ({ h, fov = 35 }) => (
  <CamRig pos={[0, 0, fitDistance(h, fov)]} target={[0, 0, 0]} fov={fov} />
);
/** DOM (top-left origin, y down) -> pixel-world (centre origin, y up) */
export const toWorld = (x: number, y: number, w: number, h: number): [number, number] => [x - w / 2, h / 2 - y];

/** small GLSL helpers shared by the shaders */
export const GLSL_COMMON = /* glsl */ `
float hash12(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p), u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash12(i), hash12(i + vec2(1, 0)), u.x), mix(hash12(i + vec2(0, 1)), hash12(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) { float a = 0.5, s = 0.0; for (int i = 0; i < 5; i++) { s += a * vnoise(p); p = mat2(1.6, 1.2, -1.2, 1.6) * p; a *= 0.5; } return s; }
float sdRoundBox(vec2 p, vec2 b, float r) { vec2 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }
`;

// ------------------------------------------------------------------------------------------------ browser window
const Icon: React.FC<{ d: string; color: string }> = ({ d, color }) => (
  <svg width={26} height={26} viewBox="0 0 24 24"><path d={d} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></svg>
);

export const CHROME_H = 56;

/** generic browser window: back / forward / reload, an address pill, a close glyph. `children` fill the content area. */
export const BrowserWindow: React.FC<{
  x: number; y: number; w: number; h: number; url: string; dark?: number; radius?: number;
  transform?: string; children?: React.ReactNode; shadow?: string; chromeOpacity?: number;
}> = ({ x, y, w, h, url, dark = 0, radius = 18, transform, children, shadow, chromeOpacity = 1 }) => {
  const bar = dark > 0.5 ? '#121225' : '#FBF8F4';
  const ink = dark > 0.5 ? '#B9B6CC' : '#6E6880';
  const pill = dark > 0.5 ? '#1E1D36' : '#EFEAE4';
  const text = dark > 0.5 ? '#E7E4F2' : '#3A3448';
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: w, height: h, borderRadius: radius, overflow: 'hidden', transform, transformOrigin: '50% 50%',
      boxShadow: shadow ?? '0 50px 90px rgba(40,28,70,0.28), 0 10px 26px rgba(40,28,70,0.18)', background: bar }}>
      <div style={{ position: 'absolute', left: 0, top: CHROME_H, width: w, height: h - CHROME_H, overflow: 'hidden' }}>{children}</div>
      <div style={{ position: 'absolute', left: 0, top: 0, width: w, height: CHROME_H, background: bar, opacity: chromeOpacity,
        borderBottom: `1px solid ${dark > 0.5 ? 'rgba(255,255,255,0.08)' : 'rgba(40,30,60,0.09)'}`, display: 'flex', alignItems: 'center', gap: 10, padding: '0 18px', boxSizing: 'border-box' }}>
        <Icon d="M15 5 L8 12 L15 19" color={ink} />
        <Icon d="M9 5 L16 12 L9 19" color={dark > 0.5 ? '#5B5873' : '#BDB6C6'} />
        <Icon d="M19 12 A7 7 0 1 1 16.5 6.6 M19 4.5 V9 H14.5" color={ink} />
        <div style={{ marginLeft: 10, height: 36, width: Math.min(560, w * 0.42), borderRadius: 18, background: pill, display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px', boxSizing: 'border-box' }}>
          <svg width={16} height={18} viewBox="0 0 16 18"><rect x={2} y={8} width={12} height={9} rx={2} fill={ink} /><path d="M4.5 8 V5.5 A3.5 3.5 0 0 1 11.5 5.5 V8" fill="none" stroke={ink} strokeWidth={2} /></svg>
          <span style={{ fontFamily: F.text, fontWeight: 500, fontSize: 21, color: text, letterSpacing: '0.01em', whiteSpace: 'nowrap' }}>{url}</span>
        </div>
        <div style={{ flex: 1 }} />
        <Icon d="M6 6 L18 18 M18 6 L6 18" color={ink} />
      </div>
    </div>
  );
};

/** a plain arrow pointer (tip at x, y); `press` 0..1 squashes it for a click */
export const Pointer: React.FC<{ x: number; y: number; press?: number; scale?: number; dark?: boolean }> = ({ x, y, press = 0, scale = 1, dark }) => (
  <svg width={40} height={48} viewBox="0 0 20 24" style={{ position: 'absolute', left: x - 3 * scale, top: y - 2 * scale, transform: `scale(${scale * (1 - 0.14 * press)})`, transformOrigin: '3px 2px', zIndex: 50, overflow: 'visible',
    filter: 'drop-shadow(0 3px 5px rgba(0,0,0,0.35))' }}>
    <path d="M1.5 1 L1.5 18.5 L6 14.4 L9.2 21.6 L12.2 20.3 L9 13.2 L15.2 13.2 Z" fill={dark ? '#141026' : '#FFFFFF'} stroke={dark ? '#FFFFFF' : '#141026'} strokeWidth={1.4} strokeLinejoin="round" />
  </svg>
);
