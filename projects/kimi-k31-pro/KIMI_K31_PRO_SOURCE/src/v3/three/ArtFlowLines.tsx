// Flow-field ribbons for the art-site shot. Each line is a streamline of a divergence-free field (a sum of drifting
// sine waves, i.e. the curl of a spectral stream function) blended with three "modes" (tide, vortex, bloom). The cursor
// is an obstacle in the flow: the field around it is the textbook potential flow past a cylinder (u - conj(u R^2 / z^2)),
// so the lines part around it like water around a stone. Streamlines are integrated in the vertex shader (RK2) from
// fixed seeds every frame, so the picture is a pure function of the uniforms (time = frame / 30).
// Ink mode uses normal alpha; inside the "flood" circle the same lines become additive light (premultiplied blend with
// alpha -> 0), which is the page transition.
import React, { useMemo } from 'react';
import * as THREE from 'three';
import { mulberry32 } from '../../lib/rng';
import { GLSL_COMMON, rgb } from './ArtKit';

const MAXN = 24;

function buildGeo(count: number, K: number, aspMax: number, seed: number) {
  const r = mulberry32(seed);
  const nx = Math.max(1, Math.round(Math.sqrt((count * (aspMax + 0.15)) / 1.15))), ny = Math.ceil(count / nx);
  const n = nx * ny;
  const vPer = K * 2;
  const aSeed = new Float32Array(n * vPer * 4), aK = new Float32Array(n * vPer * 3), pos = new Float32Array(n * vPer * 3);
  const idx = new Uint32Array(n * (K - 1) * 6);
  let v = 0, ii = 0;
  for (let gy = 0; gy < ny; gy++) for (let gx = 0; gx < nx; gx++) {
    const sx = -(aspMax + 0.15) + ((gx + r()) / nx) * 2 * (aspMax + 0.15);
    const sy = -1.15 + ((gy + r()) / ny) * 2.3;
    const c = r(), wv = r();
    const base = v;
    for (let k = 0; k < K; k++) for (let s = 0; s < 2; s++) {
      aSeed.set([sx, sy, c, wv], v * 4);
      aK.set([k - (K - 1) / 2, s ? 1 : -1, k / (K - 1)], v * 3);
      v++;
    }
    for (let k = 0; k < K - 1; k++) {
      const a = base + k * 2, b = a + 1, c2 = a + 2, d = a + 3;
      idx.set([a, b, c2, b, d, c2], ii); ii += 6;
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aSeed', new THREE.BufferAttribute(aSeed, 4));
  g.setAttribute('aK', new THREE.BufferAttribute(aK, 3));
  g.setIndex(new THREE.BufferAttribute(idx, 1));
  return g;
}

const VERT = /* glsl */ `
attribute vec4 aSeed; attribute vec3 aK;
uniform float uTime, uStep, uWidth, uPulse, uCurOn, uFeather, uPalMix, uTurb, uLight, uRim;
uniform vec4 uW[6]; uniform vec3 uMode; uniform vec2 uCenter; uniform vec3 uCur; uniform vec3 uRect; uniform vec3 uFlood;
uniform vec3 uPA[4]; uniform vec3 uPB[4]; uniform vec3 uPN[4];
varying vec3 vDay; varying vec3 vNightC; varying float vA; varying float vSide; varying vec2 vWorld; varying float vNight;
vec2 perp(vec2 v) { return vec2(-v.y, v.x); }
vec2 turb(vec2 p) {
  vec2 v = vec2(0.0);
  for (int i = 0; i < 6; i++) { vec4 w = uW[i]; float L = length(w.xy); v += cos(dot(w.xy, p) + w.z + w.w * uTime) * vec2(w.y, -w.x) / (L * sqrt(L)); }
  return v * uTurb;
}
vec2 baseF(vec2 p) {
  vec2 T = turb(p);
  vec2 d = p - uCenter; float r = length(d) + 1e-4;
  vec2 vw = vec2(1.0, 0.18 * sin(p.x * 1.7 + uTime * 0.5)) + 0.95 * T;
  vec2 vv = perp(d) / (r + 0.1) * 0.9 - d / (r + 0.3) * 0.3 + 0.6 * T;
  float th = atan(d.y, d.x);
  vec2 vb = d / r * (0.75 + 0.4 * sin(5.0 * th + uTime * 0.6)) + perp(d) / (r + 0.35) * 0.3 + 0.7 * T;
  return uMode.x * vw + uMode.y * vv + uMode.z * vb;
}
vec2 F(vec2 p) {
  vec2 u = baseF(p); u /= (length(u) + 1e-4);
  vec2 z = p - uCur.xy; float R = uCur.z; float zz = dot(z, z) + 1e-5;
  vec2 z2 = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y);
  vec2 q = R * R * vec2(u.x * z2.x + u.y * z2.y, u.y * z2.x - u.x * z2.y) / (zz * zz);
  vec2 vc = u - vec2(q.x, -q.y);
  float dz = sqrt(zz);
  vc += z / dz * (1.0 - smoothstep(R * 0.55, R * 1.08, dz)) * 2.5;
  vec2 v = mix(u, vc, uCurOn);
  return v / (length(v) + 1e-4);
}
vec3 pick(vec3 P[4], float c) { return c < 0.34 ? P[0] : c < 0.62 ? P[1] : c < 0.84 ? P[2] : P[3]; }
void main() {
  float ks = aK.x; float dir = ks < 0.0 ? -1.0 : 1.0; int n = int(abs(ks) + 0.5);
  vec2 p = aSeed.xy;
  for (int j = 0; j < ${MAXN}; j++) { if (j >= n) break; vec2 v1 = F(p); vec2 v2 = F(p + 0.5 * uStep * dir * v1); p += uStep * dir * v2; }
  vec2 tg = F(p);
  float u = aK.z;
  float taper = max(0.0, sin(3.14159 * u));
  vec2 wp = uRect.xy + p * uRect.z;
  float bold = step(0.93, aSeed.w);
  float w = uWidth * (0.45 + 0.8 * aSeed.w + 2.0 * bold) * (0.3 + 0.7 * sqrt(taper)) * (1.0 + 0.45 * uPulse);
  wp += perp(tg) * aK.y * w * 0.5;
  vWorld = wp; vSide = aK.y;
  float s = fract(u * 1.3 - uTime * 0.55 + aSeed.z * 7.13);
  float head = pow(s, 7.0);
  float hole = mix(1.0, smoothstep(uCur.z * 0.92, uCur.z * 1.3, distance(p, uCur.xy)), uCurOn);
  vA = taper * (0.6 + 0.7 * head + 0.25 * uPulse) * hole;
  float cz = bold > 0.5 ? 0.9 : aSeed.z;
  vDay = mix(pick(uPA, cz), pick(uPB, cz), uPalMix);
  float dist = distance(wp, uFlood.xy);
  float front = exp(-abs(dist - uFlood.z) / 70.0) * uRim * step(0.0, uFlood.z);
  float edgeGlow = exp(-max(0.0, distance(p, uCur.xy) - uCur.z * 1.2) / (uCur.z * 0.45)) * uCurOn;
  vNightC = pick(uPN, fract(aSeed.z + 0.37)) * (0.65 + 1.1 * head + 0.5 * uPulse) * uLight * (1.0 + 2.6 * front + 1.1 * edgeGlow);
  vNight = 1.0 - smoothstep(uFlood.z - uFeather, uFlood.z, dist);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(wp, 0.0, 1.0);
}`;

const FRAG = /* glsl */ `
${GLSL_COMMON}
uniform vec4 uClip; uniform float uClipR, uAlpha, uNightAlpha;
varying vec3 vDay; varying vec3 vNightC; varying float vA; varying float vSide; varying vec2 vWorld; varying float vNight;
void main() {
  if (sdRoundBox(vWorld - uClip.xy, uClip.zw * 0.5, uClipR) > 0.0) discard;
  float edge = 1.0 - pow(abs(vSide), 3.0);
  float a = clamp(vA * edge, 0.0, 1.0);
  float ad = a * uAlpha, an = a * uNightAlpha;
  vec3 col = mix(vDay * ad, vNightC * an, vNight);
  float alpha = mix(ad, 0.0, vNight);
  gl_FragColor = vec4(col, alpha);
}`;

export interface FlowLinesProps {
  t: number; count: number; K?: number; step?: number; seed?: number; aspMax?: number;
  /** field mapping: centre in world px and px per field unit (field y spans -1..1) */
  rect: [number, number, number];
  /** clip box in world px: cx, cy, w, h, corner radius */
  clip: [number, number, number, number, number];
  mode: [number, number, number]; center?: [number, number];
  cursor: [number, number]; cursorR: number; cursorOn: number;
  palA: string[]; palB?: string[]; palMix?: number; palNight: string[];
  /** flood circle in world px (x, y, radius) and its soft edge */
  flood?: [number, number, number]; feather?: number;
  width?: number; alpha?: number; nightAlpha?: number; pulse?: number; turb?: number; light?: number; rim?: number; renderOrder?: number;
}

export const FlowLines: React.FC<FlowLinesProps> = (p) => {
  const { count, K = 41, seed = 7, aspMax = 1.9 } = p;
  const geo = useMemo(() => buildGeo(count, K, aspMax, seed), [count, K, aspMax, seed]);
  const mat = useMemo(() => {
    const r = mulberry32(seed * 13 + 1);
    const W = Array.from({ length: 6 }, (_, i) => {
      const a = r() * Math.PI * 2, k = 1.1 + 2.6 * (i / 5) + 0.4 * r();
      return new THREE.Vector4(Math.cos(a) * k, Math.sin(a) * k, r() * 6.283, (r() - 0.5) * 0.9);
    });
    const v3 = () => Array.from({ length: 4 }, () => new THREE.Vector3());
    return new THREE.ShaderMaterial({
      vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthTest: false, depthWrite: false, side: THREE.DoubleSide,
      blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
      blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
      uniforms: {
        uTime: { value: 0 }, uStep: { value: 0.02 }, uWidth: { value: 2 }, uPulse: { value: 0 }, uCurOn: { value: 0 }, uFeather: { value: 60 },
        uPalMix: { value: 0 }, uTurb: { value: 1 }, uLight: { value: 1 }, uRim: { value: 0 }, uW: { value: W }, uMode: { value: new THREE.Vector3(1, 0, 0) },
        uCenter: { value: new THREE.Vector2() }, uCur: { value: new THREE.Vector3(9, 9, 0.1) }, uRect: { value: new THREE.Vector3(0, 0, 100) },
        uFlood: { value: new THREE.Vector3(0, 0, -1) }, uPA: { value: v3() }, uPB: { value: v3() }, uPN: { value: v3() },
        uClip: { value: new THREE.Vector4() }, uClipR: { value: 0 }, uAlpha: { value: 0.85 }, uNightAlpha: { value: 0.6 },
      },
    });
  }, [seed]);
  const u = mat.uniforms;
  u.uTime.value = p.t; u.uStep.value = p.step ?? 0.02; u.uWidth.value = p.width ?? 2; u.uPulse.value = p.pulse ?? 0;
  u.uCurOn.value = p.cursorOn; u.uFeather.value = p.feather ?? 60; u.uPalMix.value = p.palMix ?? 0; u.uTurb.value = p.turb ?? 1; u.uLight.value = p.light ?? 1; u.uRim.value = p.rim ?? 0;
  (u.uMode.value as THREE.Vector3).set(...p.mode);
  (u.uCenter.value as THREE.Vector2).set(...(p.center ?? [0, 0]));
  (u.uCur.value as THREE.Vector3).set(p.cursor[0], p.cursor[1], p.cursorR);
  (u.uRect.value as THREE.Vector3).set(...p.rect);
  (u.uFlood.value as THREE.Vector3).set(...(p.flood ?? [0, 0, -1]));
  const setPal = (arr: THREE.Vector3[], pal: string[]) => pal.forEach((h, i) => arr[i].set(...rgb(h)));
  setPal(u.uPA.value, p.palA); setPal(u.uPB.value, p.palB ?? p.palA); setPal(u.uPN.value, p.palNight);
  (u.uClip.value as THREE.Vector4).set(p.clip[0], p.clip[1], p.clip[2], p.clip[3]); u.uClipR.value = p.clip[4];
  u.uAlpha.value = p.alpha ?? 0.85; u.uNightAlpha.value = p.nightAlpha ?? 0.6;
  return <mesh geometry={geo} material={mat} frustumCulled={false} renderOrder={p.renderOrder ?? 1} />;
};

// ------------------------------------------------------------------------------------------------ backdrop
const BG_VERT = /* glsl */ `varying vec2 vWorld; void main() { vec4 w = modelMatrix * vec4(position, 1.0); vWorld = w.xy; gl_Position = projectionMatrix * viewMatrix * w; }`;
const BG_FRAG = /* glsl */ `
${GLSL_COMMON}
uniform vec4 uClip; uniform float uClipR, uFeather, uTime, uRim; uniform vec3 uFlood, uPaper, uPaper2, uNight0, uNight1, uRimC;
varying vec2 vWorld;
void main() {
  vec2 q = vWorld - uClip.xy;
  float d = sdRoundBox(q, uClip.zw * 0.5, uClipR);
  if (d > 0.0) discard;
  vec2 uv = q / uClip.zw;
  float g = fbm(vWorld * 0.012) * 0.6 + vnoise(vWorld * 0.35) * 0.4;
  vec3 paper = mix(uPaper, uPaper2, smoothstep(-0.6, 0.7, uv.x + uv.y * 0.4)) * (0.975 + 0.05 * g);
  paper *= 1.0 - 0.06 * smoothstep(0.25, 0.75, length(uv));
  float dist = distance(vWorld, uFlood.xy);
  float n = 1.0 - smoothstep(uFlood.z - uFeather, uFlood.z, dist);
  vec3 night = mix(uNight0, uNight1, smoothstep(0.0, 0.85, length(uv * vec2(1.0, 1.3)))) * (0.94 + 0.12 * fbm(vWorld * 0.004 + uTime * 0.05));
  vec3 col = mix(paper, night, n);
  float rim = exp(-abs(dist - uFlood.z) / 26.0) * uRim * step(0.0, uFlood.z);
  col += uRimC * rim;
  gl_FragColor = vec4(col, 1.0);
}`;

export const FlowBackdrop: React.FC<{
  clip: [number, number, number, number, number]; flood?: [number, number, number]; feather?: number; t: number; rim?: number;
  paper?: [string, string]; night?: [string, string]; rimColor?: string; renderOrder?: number;
}> = ({ clip, flood = [0, 0, -1], feather = 60, t, rim = 0, paper = ['#F6F1E8', '#EFE6DA'], night = ['#1C1446', '#07071A'], rimColor = '#FFB36B', renderOrder = 0 }) => {
  const mat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: BG_VERT, fragmentShader: BG_FRAG, depthTest: false, depthWrite: false,
    uniforms: {
      uClip: { value: new THREE.Vector4() }, uClipR: { value: 0 }, uFeather: { value: 60 }, uTime: { value: 0 }, uRim: { value: 0 },
      uFlood: { value: new THREE.Vector3() }, uPaper: { value: new THREE.Vector3() }, uPaper2: { value: new THREE.Vector3() },
      uNight0: { value: new THREE.Vector3() }, uNight1: { value: new THREE.Vector3() }, uRimC: { value: new THREE.Vector3() },
    },
  }), []);
  const u = mat.uniforms;
  (u.uClip.value as THREE.Vector4).set(clip[0], clip[1], clip[2], clip[3]); u.uClipR.value = clip[4];
  u.uFeather.value = feather; u.uTime.value = t; u.uRim.value = rim;
  (u.uFlood.value as THREE.Vector3).set(...flood);
  (u.uPaper.value as THREE.Vector3).set(...rgb(paper[0])); (u.uPaper2.value as THREE.Vector3).set(...rgb(paper[1]));
  (u.uNight0.value as THREE.Vector3).set(...rgb(night[0])); (u.uNight1.value as THREE.Vector3).set(...rgb(night[1]));
  (u.uRimC.value as THREE.Vector3).set(...rgb(rimColor));
  return (
    <mesh position={[clip[0], clip[1], 0]} scale={[clip[2] + 4, clip[3] + 4, 1]} material={mat} renderOrder={renderOrder} frustumCulled={false}>
      <planeGeometry args={[1, 1]} />
    </mesh>
  );
};
