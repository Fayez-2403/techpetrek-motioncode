// Media-window kit (owned by the media builder): the placeholder stub plus the small shared toolkit every media animation
// uses: font-ready gate for canvas textures, camera fit by aspect, studio backdrop, glow sprites, rounded slabs, beat
// helpers and the on-graphic label. Everything is a pure function of the props (f, dur, w, h).
import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { continueRender, delayRender } from 'remotion';
import * as THREE from 'three';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { MediaProps } from './types';
import { C } from '../styles/theme';
import { F } from '../styles/typography';
import { clamp, easeOutCubic, invLerp } from '../lib/anim';

export const stubMedia = (label: string) => {
  const S: React.FC<MediaProps> = ({ w, h, f }) => (
    <div style={{ width: w, height: h, background: '#202227', color: '#ECEFF4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'JetBrains Mono', fontSize: 28 }}>
      {label} · {f}
    </div>
  );
  return S;
};

// ---------- timing ----------
export const BEAT = 30;
/** decaying pulse after beat k (frames): 0 before the beat, 1 on it, falling over ~`len` frames */
export const hit = (f: number, at: number, len = 16) => (f < at ? 0 : Math.exp(-((f - at) / len) * 3));
/** decaying pulse on every beat (local frames) */
export const everyBeat = (f: number, len = 14) => { const ph = ((f % BEAT) + BEAT) % BEAT; return Math.exp(-(ph / len) * 3); };
/** 0 -> 1 between frames a and b with ease-out (clamped) */
export const ramp = (f: number, a: number, b: number, e: (t: number) => number = easeOutCubic) => e(invLerp(a, b, f));

// ---------- fonts ----------
const FONT_SPECS = ['600 32px "JetBrains Mono"', '800 32px "JetBrains Mono"', '800 32px Archivo', '400 32px "Instrument Serif"'];
const fontsLoaded = () => typeof document !== 'undefined' && FONT_SPECS.every((s) => document.fonts.check(s));
/** true once the film fonts are loaded; holds the render (delayRender) until then, released after children mounted */
export function useFontsReady() {
  const [ready, setReady] = useState(fontsLoaded);
  const hold = useRef<number | null>(null);
  useLayoutEffect(() => {
    if (ready) return;
    hold.current = delayRender('media: fonts for canvas textures');
    Promise.all(FONT_SPECS.map((s) => document.fonts.load(s))).then(() => setReady(true), () => setReady(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useLayoutEffect(() => {
    if (ready && hold.current !== null) { continueRender(hold.current); hold.current = null; }
  }, [ready]);
  return ready;
}

// ---------- camera ----------
export const REEL_ASPECT = 952 / 488;
/** vertical fov that keeps the reel window's horizontal extent at any aspect (4:5 window gets extra height, same width) */
export const fovFor = (w: number, h: number, base = 30) => {
  if (w / h >= REEL_ASPECT) return base;   // wider than the reel window: keep the vertical framing (never crop top/bottom)
  const t = Math.tan((base * Math.PI) / 360) * REEL_ASPECT;
  return (2 * Math.atan(t / (w / h)) * 180) / Math.PI;
};
/** 0 at the reel window, 1 at the 4:5 window (for composing extra height) */
export const tallness = (w: number, h: number) => clamp((h / w - 488 / 952) / (590 / 952 - 488 / 952));

// ---------- textures ----------
export function canvasTex(w: number, h: number, draw: (g: CanvasRenderingContext2D, w: number, h: number) => void, srgb = true) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d')!;
  draw(g, w, h);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  t.generateMipmaps = true;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  return t;
}
/** soft round glow (additive sprites, light pools) */
let GLOW: THREE.Texture | null = null;
export const glowTex = () => GLOW ?? (GLOW = canvasTex(128, 128, (g, s) => {
  const gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.16, 'rgba(255,255,255,0.75)');
  gr.addColorStop(0.42, 'rgba(255,255,255,0.22)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, s, s);
}));
/** soft dark blob (fake contact shadow) */
let SHADOW: THREE.Texture | null = null;
export const shadowTex = () => SHADOW ?? (SHADOW = canvasTex(128, 128, (g, s) => {
  const gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  gr.addColorStop(0, 'rgba(0,0,0,0.85)'); gr.addColorStop(0.5, 'rgba(0,0,0,0.35)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr; g.fillRect(0, 0, s, s);
}, false));

/** rounded-rect path on a 2D canvas */
export function rr(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}

// ---------- geometry ----------
/** rounded slab centred on the origin (w x h, depth d along z) with a smooth bevel */
export function roundedSlab(w: number, h: number, d: number, r: number, bevel = Math.min(r * 0.6, d * 0.45), seg = 4) {
  const s = new THREE.Shape();
  const iw = w / 2 - bevel, ih = h / 2 - bevel, ir = Math.max(0.0005, r - bevel);
  s.moveTo(-iw + ir, -ih); s.lineTo(iw - ir, -ih); s.absarc(iw - ir, -ih + ir, ir, -Math.PI / 2, 0, false);
  s.lineTo(iw, ih - ir); s.absarc(iw - ir, ih - ir, ir, 0, Math.PI / 2, false);
  s.lineTo(-iw + ir, ih); s.absarc(-iw + ir, ih - ir, ir, Math.PI / 2, Math.PI, false);
  s.lineTo(-iw, -ih + ir); s.absarc(-iw + ir, -ih + ir, ir, Math.PI, Math.PI * 1.5, false);
  const depth = Math.max(0.0001, d - 2 * bevel);
  let g: THREE.BufferGeometry = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: seg, curveSegments: 10 });
  g.translate(0, 0, -depth / 2);
  g.deleteAttribute('normal'); g.deleteAttribute('uv');
  g = mergeVertices(g, 1e-5);
  g.computeVertexNormals();
  return g;
}

// ---------- 3D pieces ----------
/** opaque studio backdrop sphere (vertical gradient + two soft glow lobes); opaque so glass transmission sees it */
export const Backdrop3D: React.FC<{ top?: string; bottom?: string; glowA?: string; dirA?: [number, number, number]; powA?: number; glowB?: string; dirB?: [number, number, number]; powB?: number; radius?: number }> = ({
  top = '#1C1E24', bottom = '#0C0D10', glowA = '#3A2418', dirA = [0.4, 0.2, -1], powA = 3, glowB = '#18202C', dirB = [-0.6, 0.3, -1], powB = 3, radius = 80,
}) => {
  const mat = useMemo(() => new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { uT: { value: new THREE.Color() }, uB: { value: new THREE.Color() }, uA: { value: new THREE.Color() }, uGb: { value: new THREE.Color() },
      uDa: { value: new THREE.Vector3() }, uDb: { value: new THREE.Vector3() }, uPa: { value: 3 }, uPb: { value: 3 } },
    vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform vec3 uT, uB, uA, uGb, uDa, uDb; uniform float uPa, uPb; varying vec3 vD;
      float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
      void main(){ vec3 d = normalize(vD); vec3 c = mix(uB, uT, smoothstep(-0.35, 0.55, d.y));
        c += uA * pow(max(dot(d, normalize(uDa)), 0.0), uPa) + uGb * pow(max(dot(d, normalize(uDb)), 0.0), uPb);
        c += (h21(gl_FragCoord.xy) - 0.5) / 255.0;
        gl_FragColor = vec4(c, 1.0);
        #include <colorspace_fragment>
      }`,
  }), []);
  mat.uniforms.uT.value.set(top); mat.uniforms.uB.value.set(bottom); mat.uniforms.uA.value.set(glowA); mat.uniforms.uGb.value.set(glowB);
  mat.uniforms.uDa.value.set(...dirA); mat.uniforms.uDb.value.set(...dirB); mat.uniforms.uPa.value = powA; mat.uniforms.uPb.value = powB;
  return <mesh material={mat} renderOrder={-10}><sphereGeometry args={[radius, 48, 24]} /></mesh>;
};

/** additive glow sprite (camera facing) */
export const Glow: React.FC<{ pos: [number, number, number]; size: number; color: string; opacity?: number; depthTest?: boolean; renderOrder?: number }> = ({ pos, size, color, opacity = 1, depthTest = true, renderOrder = 0 }) => {
  const tex = glowTex();
  if (opacity <= 0.002) return null;
  return (
    <sprite position={pos} scale={[size, size, size]} renderOrder={renderOrder}>
      <spriteMaterial map={tex} color={color} transparent opacity={opacity} blending={THREE.AdditiveBlending} depthWrite={false} depthTest={depthTest} toneMapped={false} />
    </sprite>
  );
};

/** flat soft shadow on a horizontal floor */
export const ContactShadow: React.FC<{ pos: [number, number, number]; sx: number; sz: number; opacity?: number }> = ({ pos, sx, sz, opacity = 0.6 }) => (
  <mesh position={pos} rotation={[-Math.PI / 2, 0, 0]} renderOrder={1}>
    <planeGeometry args={[sx, sz]} />
    <meshBasicMaterial map={shadowTex()} transparent opacity={opacity} depthWrite={false} toneMapped={false} />
  </mesh>
);

// ---------- 2D overlay ----------
/** the window shell: fixed size, clipped, dark base */
export const Win: React.FC<{ w: number; h: number; bg?: string; children: React.ReactNode }> = ({ w, h, bg = C.graphite, children }) => (
  <div style={{ position: 'relative', width: w, height: h, overflow: 'hidden', background: bg }}>{children}</div>
);

/** on-graphic label chip: mono caps, optional small second line; slides up + fades in at `p` (0..1) */
export const Label: React.FC<{ x: number; y: number; text: string; sub?: string; color?: string; p?: number; size?: number; anchor?: 'left' | 'center' | 'right'; dot?: boolean; dark?: boolean; style?: React.CSSProperties }> = ({
  x, y, text, sub, color = C.alert, p = 1, size = 24, anchor = 'left', dot = true, dark = true, style,
}) => {
  const tx = anchor === 'center' ? '-50%' : anchor === 'right' ? '-100%' : '0%';
  return (
    <div style={{ position: 'absolute', left: x, top: y, transform: `translate(${tx}, ${(1 - p) * 14}px)`, opacity: clamp(p * 1.4), zIndex: 5,
      display: 'flex', flexDirection: 'column', alignItems: anchor === 'right' ? 'flex-end' : anchor === 'center' ? 'center' : 'flex-start', gap: 4, ...style }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: size * 0.45, padding: `${size * 0.3}px ${size * 0.55}px`, borderRadius: size * 0.28,
        background: dark ? 'rgba(12,13,16,0.72)' : 'rgba(243,238,228,0.92)', border: `1.5px solid ${color}`, backdropFilter: 'blur(6px)',
        boxShadow: `0 6px 22px rgba(0,0,0,0.35), 0 0 18px ${color}33` }}>
        {dot ? <span style={{ width: size * 0.42, height: size * 0.42, borderRadius: '50%', background: color, boxShadow: `0 0 10px ${color}` }} /> : null}
        <span style={{ fontFamily: F.mono, fontWeight: 800, fontSize: size, letterSpacing: '0.06em', color: dark ? C.lunar : C.ink, whiteSpace: 'nowrap', lineHeight: 1 }}>{text}</span>
      </div>
      {sub ? <span style={{ fontFamily: F.mono, fontWeight: 600, fontSize: size * 0.72, letterSpacing: '0.03em', color: dark ? 'rgba(236,239,244,0.82)' : C.ink2, whiteSpace: 'nowrap', paddingLeft: 2 }}>{sub}</span> : null}
    </div>
  );
};

/** subtle frame finish over a media window: vignette (keeps edges calm where the card frame sits) */
export const WinVignette: React.FC<{ strength?: number }> = ({ strength = 0.5 }) => (
  <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 4, background: `radial-gradient(115% 120% at 50% 45%, rgba(0,0,0,0) 58%, rgba(0,0,0,${strength}) 100%)` }} />
);

// ---------- instancing ----------
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _p = new THREE.Vector3(), _s = new THREE.Vector3(), _e = new THREE.Euler();
export function setInst(mesh: THREE.InstancedMesh, i: number, p: [number, number, number], s: [number, number, number], rx = 0, ry = 0, rz = 0) {
  _e.set(rx, ry, rz, 'YXZ'); _q.setFromEuler(_e);
  _m.compose(_p.set(p[0], p[1], p[2]), _q, _s.set(s[0], s[1], s[2]));
  mesh.setMatrixAt(i, _m);
}
export function setInstQ(mesh: THREE.InstancedMesh, i: number, p: THREE.Vector3, q: THREE.Quaternion, s: THREE.Vector3) { _m.compose(p, q, s); mesh.setMatrixAt(i, _m); }

/** checklist label: a pill with a check disc that fills mint when `done` reaches 1 (enter at `p`) */
export const DoneLabel: React.FC<{ x: number; y: number; text: string; p: number; done: number; size?: number; anchor?: 'left' | 'center' }> = ({ x, y, text, p, done, size = 30, anchor = 'left' }) => {
  const d = clamp(done);
  const pop = d > 0 && d < 1 ? 1 + Math.sin(d * Math.PI) * 0.12 : 1;
  return (
    <div style={{ position: 'absolute', left: x, top: y, transform: `translate(${anchor === 'center' ? '-50%' : '0%'}, ${(1 - p) * 16}px)`, opacity: clamp(p * 1.4), zIndex: 5,
      display: 'flex', alignItems: 'center', gap: size * 0.5, padding: `${size * 0.32}px ${size * 0.7}px ${size * 0.32}px ${size * 0.38}px`, borderRadius: size,
      background: 'rgba(10,12,14,0.78)', border: `2px solid ${d > 0.5 ? C.mintSoft : 'rgba(236,239,244,0.28)'}`, backdropFilter: 'blur(6px)',
      boxShadow: `0 8px 26px rgba(0,0,0,0.4)${d > 0.5 ? `, 0 0 24px ${C.mint}55` : ''}` }}>
      <div style={{ width: size * 1.15, height: size * 1.15, borderRadius: '50%', border: `2.5px solid ${d > 0.5 ? C.mintSoft : 'rgba(236,239,244,0.4)'}`,
        background: d > 0 ? `rgba(31,158,110,${d})` : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${pop})` }}>
        <svg width={size * 0.7} height={size * 0.7} viewBox="0 0 24 24" style={{ opacity: d }}>
          <path d="M4 12.5 L9.5 18 L20 6.5" fill="none" stroke="#F2FFF9" strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={26} strokeDashoffset={26 * (1 - d)} />
        </svg>
      </div>
      <span style={{ fontFamily: F.mono, fontWeight: 800, fontSize: size, letterSpacing: '0.05em', color: C.lunar, whiteSpace: 'nowrap', lineHeight: 1 }}>{text}</span>
    </div>
  );
};

/** checklist hit frame: beat 1 for very short items (< 75 frames), beat 2 normally, beat 3 for long ones */
export const doneAt = (dur: number) => (dur < 75 ? 1 : dur >= 180 ? 3 : 2) * BEAT;
