// Shared kit for the V3 sky shots (SkyFlight, BoardRider, SkyDuel): a seeded tileable noise texture, a sky dome that
// raymarches up to two cloud slabs (heightfield cumulus lit by the sun), sunlit billboard cloud puffs, camera-facing
// ribbons (contrails, speed streaks, glows), floating sky islands with trees and waterfalls, a sky-coloured
// environment map and a 2D sun flare. Every component is a pure function of its props (no clocks, no useFrame).
import React, { useLayoutEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { mulberry32 } from '../../lib/rng';

// ------------------------------------------------------------------------------------------------ vector helpers
export type P3 = [number, number, number];
export const add = (a: P3, b: P3): P3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const sub = (a: P3, b: P3): P3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const mul = (a: P3, s: number): P3 => [a[0] * s, a[1] * s, a[2] * s];
export const madd = (a: P3, b: P3, s: number): P3 => [a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s];
export const dot = (a: P3, b: P3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross = (a: P3, b: P3): P3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const vlen = (a: P3) => Math.hypot(a[0], a[1], a[2]);
export const norm = (a: P3): P3 => { const l = vlen(a) || 1e-9; return [a[0] / l, a[1] / l, a[2] / l]; };
export const vlerp = (a: P3, b: P3, t: number): P3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
/** rotate v around unit axis k by angle a (Rodrigues) */
export const rotAxis = (v: P3, k: P3, a: number): P3 => {
  const c = Math.cos(a), s = Math.sin(a), kv = cross(k, v), d = dot(k, v);
  return [v[0] * c + kv[0] * s + k[0] * d * (1 - c), v[1] * c + kv[1] * s + k[1] * d * (1 - c), v[2] * c + kv[2] * s + k[2] * d * (1 - c)];
};
/** quaternion of the basis (x = right, y = up, z = back) built from a forward (-z) and an up hint */
export function frameQuat(fwd: P3, upHint: P3): [number, number, number, number] {
  const z = norm(mul(fwd, -1));
  const x = norm(cross(upHint, z));
  const y = cross(z, x);
  const m = new THREE.Matrix4().makeBasis(new THREE.Vector3(...x), new THREE.Vector3(...y), new THREE.Vector3(...z));
  const q = new THREE.Quaternion().setFromRotationMatrix(m);
  return [q.x, q.y, q.z, q.w];
}
export const lin = (hex: string) => new THREE.Color(hex);

// ------------------------------------------------------------------------------------------------ noise texture
// R: value fbm (period 4, 5 octaves), G: value fbm (period 8), B: billowy worley fbm (period 4), A: worley (period 10).
let NOISE: THREE.DataTexture | null = null;
export function noiseTex(): THREE.DataTexture {
  if (NOISE) return NOISE;
  const N = 256;
  const chans = [valueFbm(N, 4, 5, 11), valueFbm(N, 8, 4, 23), worleyFbm(N, 4, 3, 37), worleyFbm(N, 10, 2, 51)];
  const data = new Uint8Array(N * N * 4);
  chans.forEach((c, k) => {
    let lo = Infinity, hi = -Infinity;
    for (let i = 0; i < c.length; i++) { if (c[i] < lo) lo = c[i]; if (c[i] > hi) hi = c[i]; }
    for (let i = 0; i < N * N; i++) data[i * 4 + k] = Math.round(((c[i] - lo) / (hi - lo)) * 255);
  });
  const t = new THREE.DataTexture(data, N, N, THREE.RGBAFormat, THREE.UnsignedByteType);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.magFilter = THREE.LinearFilter;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.generateMipmaps = true;
  t.needsUpdate = true;
  NOISE = t;
  return t;
}
function valueFbm(N: number, P0: number, oct: number, seed: number) {
  const out = new Float32Array(N * N);
  let amp = 1;
  for (let o = 0; o < oct; o++) {
    const P = P0 << o, r = mulberry32(seed + o * 101), lat = new Float32Array(P * P);
    for (let i = 0; i < P * P; i++) lat[i] = r();
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const fx = (x / N) * P, fy = (y / N) * P, ix = Math.floor(fx), iy = Math.floor(fy);
      let ux = fx - ix, uy = fy - iy;
      ux = ux * ux * (3 - 2 * ux); uy = uy * uy * (3 - 2 * uy);
      const x0 = ix % P, x1 = (ix + 1) % P, y0 = iy % P, y1 = (iy + 1) % P;
      const a = lat[y0 * P + x0], b = lat[y0 * P + x1], c = lat[y1 * P + x0], d = lat[y1 * P + x1];
      out[y * N + x] += amp * ((a * (1 - ux) + b * ux) * (1 - uy) + (c * (1 - ux) + d * ux) * uy);
    }
    amp *= 0.5;
  }
  return out;
}
function worleyFbm(N: number, P0: number, oct: number, seed: number) {
  const out = new Float32Array(N * N);
  let amp = 1;
  for (let o = 0; o < oct; o++) {
    const P = P0 << o, r = mulberry32(seed + o * 131), jx = new Float32Array(P * P), jy = new Float32Array(P * P);
    for (let i = 0; i < P * P; i++) { jx[i] = r(); jy[i] = r(); }
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const gx = (x / N) * P, gy = (y / N) * P, cx = Math.floor(gx), cy = Math.floor(gy);
      let m = 9;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const ccx = cx + dx, ccy = cy + dy, wx = ((ccx % P) + P) % P, wy = ((ccy % P) + P) % P;
        const px = ccx + jx[wy * P + wx], py = ccy + jy[wy * P + wx];
        const d = (px - gx) ** 2 + (py - gy) ** 2;
        if (d < m) m = d;
      }
      out[y * N + x] += amp * (1 - Math.min(1, Math.sqrt(m)));
    }
    amp *= 0.55;
  }
  return out;
}

// ------------------------------------------------------------------------------------------------ sky dome + clouds
export interface SlabSpec {
  y0: number; y1: number;
  /** coverage threshold: lower = more cloud (0.25 dense .. 0.6 sparse) */
  cov: number;
  /** world -> noise uv scale (1 / tile size) */
  scale: number;
  off?: [number, number];
  density?: number;
  lit: string; shade: string;
  /** multiplier on the lit colour (values above 1 survive the tone curve as bright white) */
  litK?: number;
  /** a clearing: [x, z, radius] */
  hole?: [number, number, number];
}
export interface SkyLook {
  sun: P3; zenith: string; horizon: string; low: string; sunColor: string;
  sunI?: number; sunSize?: number; haze: string; hazeDist: number; maxT?: number;
  /** upper slab first (A above B); the camera must never be below slab B */
  slabs?: SlabSpec[];
}

const skyVert = /* glsl */ `
varying vec3 vW;
void main() { vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;

const skyFrag = /* glsl */ `
uniform vec3 uSun; uniform vec3 uZen; uniform vec3 uHor; uniform vec3 uLow; uniform vec3 uSunC; uniform vec3 uHaze;
uniform float uSunI; uniform float uSunSize; uniform float uHazeDist; uniform float uMaxT;
uniform sampler2D uNoise;
uniform vec4 uA; uniform vec4 uAb; uniform vec3 uAlit; uniform vec3 uAshade; uniform vec3 uAhole;
uniform vec4 uB; uniform vec4 uBb; uniform vec3 uBlit; uniform vec3 uBshade; uniform vec3 uBhole;
varying vec3 vW;

float h12(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float gEdge = 0.06;

vec3 skyCol(vec3 d) {
  float h = d.y;
  vec3 c = mix(uHor, uZen, pow(clamp(h, 0.0, 1.0), 0.6));
  c = mix(c, uLow, smoothstep(0.0, -0.3, h));
  float s = max(dot(d, uSun), 0.0);
  c += uSunC * uSunI * (0.12 * pow(s, 3.0) + 0.35 * pow(s, 24.0) + 1.3 * pow(s, 320.0));
  c += uSunC * uSunI * 22.0 * smoothstep(uSunSize, uSunSize + 0.0003, s);
  return c;
}

float dens(vec3 p, vec4 S, vec4 Sb, vec3 hole) {
  float hn = (p.y - S.x) / (S.y - S.x);
  if (hn < 0.0 || hn > 1.0) return 0.0;
  vec2 xz = p.xz + vec2(p.y * 0.55, p.y * 0.3);
  vec2 q = xz * S.w + Sb.xy;
  float c = texture2D(uNoise, q).b * 0.62 + texture2D(uNoise, q * 2.63 + vec2(0.31, 0.17)).r * 0.38;
  c += (texture2D(uNoise, q * 8.1 + vec2(0.53, 0.29)).g - 0.5) * 0.12;
  if (hole.z > 0.0) { float hd = length(p.xz - hole.xy) / hole.z; c -= 0.7 * (1.0 - smoothstep(0.5, 1.0, hd)); }
  float th = S.z + 0.5 * hn * hn;
  return smoothstep(th, th + gEdge, c) * smoothstep(0.0, 0.15, hn);
}

vec3 march(vec3 ro, vec3 rd, vec4 S, vec4 Sb, vec3 lit, vec3 shade, vec3 hole, inout float T) {
  if (Sb.w < 0.5 || T < 0.02) return vec3(0.0);
  float ry = abs(rd.y) < 1e-4 ? 1e-4 : rd.y;
  float tA = (S.x - ro.y) / ry, tB = (S.y - ro.y) / ry;
  float t0 = max(min(tA, tB), 0.0), t1 = max(tA, tB);
  bool clipped = t1 > uMaxT;
  t1 = min(t1, uMaxT);
  if (t1 <= t0) return vec3(0.0);
  float dt = max((t1 - t0) / 56.0, 0.25);
  float t = t0 + dt * h12(gl_FragCoord.xy + S.x);
  float thick = S.y - S.x;
  float mu = dot(rd, uSun);
  float phase = 0.6 + 1.5 * pow(max(mu, 0.0), 8.0);
  vec3 acc = vec3(0.0);
  for (int i = 0; i < 56; i++) {
    if (t > t1 || T < 0.02) break;
    vec3 p = ro + rd * t;
    gEdge = 0.06 + t * 0.00035;
    float d = dens(p, S, Sb, hole);
    if (d > 0.003) {
      float hn = clamp((p.y - S.x) / thick, 0.0, 1.0);
      float l = dens(p + uSun * thick * 0.12, S, Sb, hole) + dens(p + uSun * thick * 0.4, S, Sb, hole);
      float sunT = exp(-l * 1.6);
      vec3 col = shade * (0.55 + 0.45 * hn) + lit * sunT * phase;
      col = mix(col, uHaze, 1.0 - exp(-t / uHazeDist));
      float a = 1.0 - exp(-d * dt * Sb.z);
      acc += T * a * col;
      T *= 1.0 - a;
    }
    t += dt;
  }
  if (clipped && T > 0.02) { acc += T * 0.92 * uHaze; T *= 0.08; }
  return acc;
}

void main() {
  vec3 ro = cameraPosition;
  vec3 rd = normalize(vW - cameraPosition);
  float T = 1.0;
  vec3 col = march(ro, rd, uA, uAb, uAlit, uAshade, uAhole, T);
  col += march(ro, rd, uB, uBb, uBlit, uBshade, uBhole, T);
  col += T * skyCol(rd);
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

function makeSkyMaterial() {
  const u = {
    uSun: { value: new THREE.Vector3(0, 1, 0) }, uZen: { value: new THREE.Color() }, uHor: { value: new THREE.Color() }, uLow: { value: new THREE.Color() },
    uSunC: { value: new THREE.Color() }, uHaze: { value: new THREE.Color() }, uSunI: { value: 1 }, uSunSize: { value: 0.99955 }, uHazeDist: { value: 900 },
    uMaxT: { value: 3000 }, uNoise: { value: noiseTex() },
    uA: { value: new THREE.Vector4() }, uAb: { value: new THREE.Vector4() }, uAlit: { value: new THREE.Color() }, uAshade: { value: new THREE.Color() }, uAhole: { value: new THREE.Vector3() },
    uB: { value: new THREE.Vector4() }, uBb: { value: new THREE.Vector4() }, uBlit: { value: new THREE.Color() }, uBshade: { value: new THREE.Color() }, uBhole: { value: new THREE.Vector3() },
  };
  return new THREE.ShaderMaterial({ uniforms: u, vertexShader: skyVert, fragmentShader: skyFrag, side: THREE.BackSide, depthWrite: false, depthTest: false, fog: false });
}
function setSky(m: THREE.ShaderMaterial, L: SkyLook, noClouds = false) {
  const u = m.uniforms;
  const s = norm(L.sun);
  u.uSun.value.set(s[0], s[1], s[2]);
  u.uZen.value.set(L.zenith); u.uHor.value.set(L.horizon); u.uLow.value.set(L.low); u.uSunC.value.set(L.sunColor); u.uHaze.value.set(L.haze);
  u.uSunI.value = L.sunI ?? 1; u.uSunSize.value = L.sunSize ?? 0.99955; u.uHazeDist.value = L.hazeDist; u.uMaxT.value = L.maxT ?? 3000;
  const slabs = noClouds ? [] : L.slabs ?? [];
  (['A', 'B'] as const).forEach((k, i) => {
    const S = slabs[i];
    if (!S) { u[`u${k}b`].value.set(0, 0, 0, 0); u[`u${k}`].value.set(0, 1, 1, 1); return; }
    u[`u${k}`].value.set(S.y0, S.y1, S.cov, S.scale);
    u[`u${k}b`].value.set(S.off?.[0] ?? 0, S.off?.[1] ?? 0, S.density ?? 0.09, 1);
    u[`u${k}lit`].value.set(S.lit).multiplyScalar(S.litK ?? 1); u[`u${k}shade`].value.set(S.shade);
    u[`u${k}hole`].value.set(S.hole?.[0] ?? 0, S.hole?.[1] ?? 0, S.hole?.[2] ?? 0);
  });
}

/** the sky + clouds, drawn first behind everything, centred on the camera */
export const SkyDome: React.FC<{ look: SkyLook; cam: P3; radius?: number }> = ({ look, cam, radius = 1500 }) => {
  const mat = useMemo(makeSkyMaterial, []);
  const geo = useMemo(() => new THREE.SphereGeometry(1, 48, 24), []);
  setSky(mat, look);
  return <mesh geometry={geo} material={mat} position={cam} scale={radius} renderOrder={-100} frustumCulled={false} />;
};

/** environment map rendered from the sky gradient (no clouds) so chrome and paint reflect this sky, not a studio */
export const SkyEnv: React.FC<{ look: SkyLook; intensity?: number }> = ({ look, intensity = 1 }) => {
  const { gl, scene } = useThree();
  const key = JSON.stringify([look.sun, look.zenith, look.horizon, look.low, look.sunColor, look.sunI]);
  const tex = useMemo(() => {
    const s = new THREE.Scene();
    const m = makeSkyMaterial();
    setSky(m, { ...look, sunI: (look.sunI ?? 1) * 0.6 }, true);
    s.add(new THREE.Mesh(new THREE.SphereGeometry(100, 32, 16), m));
    const pm = new THREE.PMREMGenerator(gl);
    const t = pm.fromScene(s, 0.035, 0.1, 1000).texture;
    pm.dispose();
    return t;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gl, key]);
  useLayoutEffect(() => {
    scene.environment = tex;
    scene.environmentIntensity = intensity;
  }, [scene, tex, intensity]);
  return null;
};

// ------------------------------------------------------------------------------------------------ billboard puffs
export interface Puff { p: P3; s: number; seed: number; a: number; rot?: number }
export interface PuffLook { sun: P3; lit: string; shade: string; haze: string; hazeDist: number; near?: [number, number]; litK?: number }

const puffVert = /* glsl */ `
attribute vec3 iPos; attribute vec4 iD;
varying vec2 vUv; varying vec2 vQ; varying float vSeed; varying float vA; varying float vDepth; varying vec3 vR; varying vec3 vU; varying vec3 vF;
void main() {
  vec3 R = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]);
  vec3 U = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
  vec3 F = vec3(viewMatrix[0][2], viewMatrix[1][2], viewMatrix[2][2]);
  float c = cos(iD.w), s = sin(iD.w);
  vec2 q = vec2(c * position.x - s * position.y, s * position.x + c * position.y);
  vec3 w = iPos + (R * q.x + U * q.y) * iD.x;
  vec4 mv = viewMatrix * vec4(w, 1.0);
  vUv = position.xy; vQ = q; vSeed = iD.y; vA = iD.z; vDepth = -mv.z; vR = R; vU = U; vF = F;
  gl_Position = projectionMatrix * mv;
}`;
const puffFrag = /* glsl */ `
uniform sampler2D uNoise; uniform vec3 uSun; uniform vec3 uLit; uniform vec3 uShade; uniform vec3 uHaze; uniform float uHazeDist; uniform vec2 uNear;
varying vec2 vUv; varying vec2 vQ; varying float vSeed; varying float vA; varying float vDepth; varying vec3 vR; varying vec3 vU; varying vec3 vF;
void main() {
  float r2 = dot(vUv, vUv);
  if (r2 >= 1.0) discard;
  vec2 nq = vUv * 0.21 + vec2(vSeed, vSeed * 1.37);
  float n1 = texture2D(uNoise, nq).b, n2 = texture2D(uNoise, nq * 2.9 + 0.5).r;
  float r = sqrt(r2);
  float shape = smoothstep(0.0, 0.5, (1.0 - r) + (n1 - 0.55) * 0.75 + (n2 - 0.5) * 0.3) * smoothstep(1.0, 0.7, r);
  float z = sqrt(max(1.0 - r2, 0.0));
  vec3 N = normalize(vR * vQ.x + vU * vQ.y + vF * z * 0.8);
  float lam = clamp(dot(N, uSun) * 0.5 + 0.5, 0.0, 1.0) * mix(0.72, 1.08, n1);
  vec3 col = mix(uShade, uLit, smoothstep(0.08, 0.95, lam));
  float back = pow(max(dot(-vF, uSun), 0.0), 5.0);
  col += uLit * back * (1.0 - z) * 1.1;
  col = mix(col, uHaze, 1.0 - exp(-vDepth / uHazeDist));
  float a = shape * vA * smoothstep(uNear.x, uNear.y, vDepth);
  if (a < 0.003) discard;
  gl_FragColor = vec4(col, a);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  gl_FragColor.rgb *= gl_FragColor.a;
}`;

export const CloudPuffs: React.FC<{ puffs: Puff[]; cam: P3; look: PuffLook; renderOrder?: number }> = ({ puffs, cam, look, renderOrder = 5 }) => {
  const cap = Math.max(16, puffs.length);
  const { geo, mat, iPos, iD } = useMemo(() => {
    const g = new THREE.InstancedBufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3));
    g.setIndex([0, 1, 2, 0, 2, 3]);
    const ip = new THREE.InstancedBufferAttribute(new Float32Array(cap * 3), 3);
    const id = new THREE.InstancedBufferAttribute(new Float32Array(cap * 4), 4);
    g.setAttribute('iPos', ip); g.setAttribute('iD', id);
    const m = new THREE.ShaderMaterial({
      uniforms: { uNoise: { value: noiseTex() }, uSun: { value: new THREE.Vector3() }, uLit: { value: new THREE.Color() }, uShade: { value: new THREE.Color() },
        uHaze: { value: new THREE.Color() }, uHazeDist: { value: 900 }, uNear: { value: new THREE.Vector2(0.5, 3) } },
      vertexShader: puffVert, fragmentShader: puffFrag, transparent: true, depthWrite: false,
      blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
      blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
    });
    return { geo: g, mat: m, iPos: ip, iD: id };
  }, [cap]);
  const s = norm(look.sun);
  mat.uniforms.uSun.value.set(s[0], s[1], s[2]);
  mat.uniforms.uLit.value.set(look.lit).multiplyScalar(look.litK ?? 1); mat.uniforms.uShade.value.set(look.shade); mat.uniforms.uHaze.value.set(look.haze);
  mat.uniforms.uHazeDist.value = look.hazeDist;
  mat.uniforms.uNear.value.set(look.near?.[0] ?? 0.5, look.near?.[1] ?? 3);
  // back-to-front
  const order = puffs.map((p, i) => [i, (p.p[0] - cam[0]) ** 2 + (p.p[1] - cam[1]) ** 2 + (p.p[2] - cam[2]) ** 2] as [number, number]).sort((a, b) => b[1] - a[1]);
  const P = iPos.array as Float32Array, D = iD.array as Float32Array;
  let n = 0;
  for (const [i] of order) {
    const q = puffs[i];
    if (q.a <= 0.002) continue;
    P[n * 3] = q.p[0]; P[n * 3 + 1] = q.p[1]; P[n * 3 + 2] = q.p[2];
    D[n * 4] = q.s; D[n * 4 + 1] = q.seed; D[n * 4 + 2] = q.a; D[n * 4 + 3] = q.rot ?? q.seed * 6.283;
    n++;
  }
  iPos.needsUpdate = true; iD.needsUpdate = true;
  geo.instanceCount = n;
  return <mesh geometry={geo} material={mat} frustumCulled={false} renderOrder={renderOrder} />;
};

// ------------------------------------------------------------------------------------------------ ribbons
/** a camera-facing strip through points; colour is display RGB (0..1+, not tone mapped), a = opacity per point */
export interface Strip { pts: P3[]; w: number | number[]; a: number | number[]; col: [number, number, number] }

const ribVert = /* glsl */ `
attribute vec4 aCol; attribute float aV; varying vec4 vCol; varying float vV;
void main() { vCol = aCol; vV = aV; gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0); }`;
const ribFrag = /* glsl */ `
uniform float uSoft; varying vec4 vCol; varying float vV;
void main() { float k = exp(-vV * vV * uSoft); float a = vCol.a * k; if (a < 0.002) discard; gl_FragColor = vec4(vCol.rgb * a, a); }`;

/** nearFade [a, b]: points closer to the camera than a vanish, fading in by b (a ribbon through the lens would fill the frame) */
export const Ribbons: React.FC<{ strips: Strip[]; cam: P3; cap?: number; mode?: 'add' | 'alpha'; soft?: number; renderOrder?: number; depthTest?: boolean; nearFade?: [number, number] }> = ({ strips, cam, cap = 3000, mode = 'add', soft = 2.2, renderOrder = 20, depthTest = true, nearFade = [0.6, 3] }) => {
  const { geo, mat, pos, col, vv } = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const p = new THREE.BufferAttribute(new Float32Array(cap * 18), 3);
    const c = new THREE.BufferAttribute(new Float32Array(cap * 24), 4);
    const v = new THREE.BufferAttribute(new Float32Array(cap * 6), 1);
    g.setAttribute('position', p); g.setAttribute('aCol', c); g.setAttribute('aV', v);
    const m = new THREE.ShaderMaterial({
      uniforms: { uSoft: { value: 2.2 } }, vertexShader: ribVert, fragmentShader: ribFrag, transparent: true, depthWrite: false, side: THREE.DoubleSide,
      blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: mode === 'add' ? THREE.OneFactor : THREE.OneMinusSrcAlphaFactor,
      blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor,
    });
    return { geo: g, mat: m, pos: p, col: c, vv: v };
  }, [cap, mode]);
  mat.uniforms.uSoft.value = soft;
  mat.depthTest = depthTest;
  const P = pos.array as Float32Array, C = col.array as Float32Array, V = vv.array as Float32Array;
  let seg = 0;
  const L: P3[] = [], R: P3[] = [];
  for (const s of strips) {
    const n = s.pts.length;
    if (n < 2) continue;
    L.length = 0; R.length = 0;
    for (let i = 0; i < n; i++) {
      const t = sub(s.pts[Math.min(n - 1, i + 1)], s.pts[Math.max(0, i - 1)]);
      const side = norm(cross(t, sub(cam, s.pts[i])));
      const hw = (Array.isArray(s.w) ? s.w[i] : s.w) / 2;
      L.push(madd(s.pts[i], side, hw)); R.push(madd(s.pts[i], side, -hw));
    }
    for (let i = 0; i < n - 1 && seg < cap; i++, seg++) {
      const nf = (q: P3) => { const d = vlen(sub(q, cam)); return Math.min(1, Math.max(0, (d - nearFade[0]) / (nearFade[1] - nearFade[0]))); };
      const a0 = (Array.isArray(s.a) ? s.a[i] : s.a) * nf(s.pts[i]), a1 = (Array.isArray(s.a) ? s.a[i + 1] : s.a) * nf(s.pts[i + 1]);
      const verts: [P3, number, number][] = [[L[i], a0, 1], [R[i], a0, -1], [L[i + 1], a1, 1], [R[i], a0, -1], [R[i + 1], a1, -1], [L[i + 1], a1, 1]];
      verts.forEach(([p, a, v], k) => {
        const o = seg * 6 + k;
        P[o * 3] = p[0]; P[o * 3 + 1] = p[1]; P[o * 3 + 2] = p[2];
        C[o * 4] = s.col[0]; C[o * 4 + 1] = s.col[1]; C[o * 4 + 2] = s.col[2]; C[o * 4 + 3] = a;
        V[o] = v;
      });
    }
  }
  pos.needsUpdate = true; col.needsUpdate = true; vv.needsUpdate = true;
  geo.setDrawRange(0, seg * 6);
  return <mesh geometry={geo} material={mat} frustumCulled={false} renderOrder={renderOrder} />;
};

// ------------------------------------------------------------------------------------------------ floating islands
export interface IslandOpts {
  seed: number; r: number; depth: number; hill?: number; trees?: number;
  grass?: [string, string, string]; rock?: [string, string, string];
}
export interface TreeInst { p: P3; s: number; kind: 0 | 1; tint: number }
export interface Island { geo: THREE.BufferGeometry; top: (x: number, z: number) => number; rim: (th: number) => P3; trees: TreeInst[]; r: number; depth: number }

const GRASS: [string, string, string] = ['#5DAA3C', '#86C44C', '#3F8A34'];
const ROCK: [string, string, string] = ['#C9A27A', '#9C7656', '#5E4B42'];

export function makeIsland(o: IslandOpts): Island {
  const rnd = mulberry32(o.seed * 7919 + 13);
  const R = o.r, D = o.depth, hill = o.hill ?? 1;
  const amps = [0.05, 0.075, 0.05, 0.03, 0.02].map((a) => a * (0.6 + 0.8 * rnd()));
  const ks = [1, 2, 3, 5, 8], ph = ks.map(() => rnd() * 6.283);
  const J = (th: number) => 1 + ks.reduce((s, k, i) => s + amps[i] * Math.sin(k * th + ph[i]), 0);
  const hp = [rnd() * 6.28, rnd() * 6.28, rnd() * 6.28, rnd() * 6.28];
  const top = (x: number, z: number) => {
    const u = x / R, v = z / R, rr = Math.min(1, Math.hypot(u, v));
    return hill * R * (0.05 * Math.sin(u * 3.1 + hp[0]) * Math.sin(v * 2.7 + hp[1]) + 0.035 * Math.sin(u * 6.3 + v * 4.1 + hp[2]) + 0.07 * (1 - rr * rr));
  };
  const ridge = [rnd() * 6.28, rnd() * 6.28, rnd() * 6.28, rnd() * 6.28];
  const NT = 56, NTOP = 8, NUND = 16;
  const rows: { p: P3; c: THREE.Color }[][] = [];
  const g = o.grass ?? GRASS, rk = o.rock ?? ROCK;
  const cg = g.map((h) => new THREE.Color(h)), cr = rk.map((h) => new THREE.Color(h));
  const dirt = new THREE.Color('#7A5A3C');
  const jit = () => 1 + (rnd() - 0.5) * 0.07;
  const grassAt = (x: number, z: number) => {
    const n = 0.5 + 0.5 * Math.sin(x * 0.31 + hp[3]) * Math.sin(z * 0.27 + hp[0]) + 0.25 * Math.sin(x * 0.9 + z * 0.7);
    return cg[0].clone().lerp(n > 0.6 ? cg[1] : cg[2], Math.min(1, Math.abs(n - 0.6) * 1.2));
  };
  for (let i = 0; i <= NTOP; i++) {
    const s = i / NTOP, row: { p: P3; c: THREE.Color }[] = [];
    for (let j = 0; j < NT; j++) {
      const th = (j / NT) * Math.PI * 2, rr = R * J(th) * s * 0.985 * (i > 0 && i < NTOP ? jit() : 1);
      const x = rr * Math.cos(th), z = rr * Math.sin(th);
      row.push({ p: [x, top(x, z) - 0.02 * R * s ** 8, z], c: grassAt(x, z) });
    }
    rows.push(row);
  }
  // lip: grass edge rolling over into a dirt band
  for (const [k, dy, col] of [[1.0, -0.02, 'edge'], [1.01, -0.07, 'dirt']] as const) {
    const row: { p: P3; c: THREE.Color }[] = [];
    for (let j = 0; j < NT; j++) {
      const th = (j / NT) * Math.PI * 2, rr = R * J(th) * k;
      const x = rr * Math.cos(th), z = rr * Math.sin(th);
      row.push({ p: [x, (col === 'edge' ? top(x, z) : 0) + dy * R, z], c: col === 'edge' ? cg[2].clone().multiplyScalar(0.85) : dirt.clone() });
    }
    rows.push(row);
  }
  for (let i = 1; i <= NUND; i++) {
    const v = i / NUND, row: { p: P3; c: THREE.Color }[] = [];
    for (let j = 0; j < NT; j++) {
      const th = (j / NT) * Math.PI * 2;
      const m = (1 + 0.12 * Math.sin(5 * th + 3 * v + ridge[0]) + 0.07 * Math.sin(9 * th - 4 * v + ridge[1]) + 0.18 * Math.sin(3 * th + ridge[2]) * v)
        * (1 + 0.06 * Math.sin(v * 17 + th * 2 + ridge[3])) * (i < NUND ? jit() : 1);
      const taper = (1 - v) ** 1.25 * (1 + 0.38 * Math.sin(Math.PI * v) * (1 - v));
      const rr = R * J(th) * 1.01 * taper * m;
      const y = -0.07 * R - D * v ** 0.95 * (1 + 0.26 * Math.sin(3 * th + ridge[3]) * v);
      const x = rr * Math.cos(th), z = rr * Math.sin(th);
      const band = 0.5 + 0.5 * Math.sin(y * (9 / Math.max(6, R * 0.25)) + 0.8 * Math.sin(th * 3 + ridge[0]));
      const c = cr[0].clone().lerp(cr[1], band).lerp(cr[2], Math.min(1, v * 0.85));
      if (v < 0.14) c.lerp(cg[2], (0.14 - v) * 3.5);
      row.push({ p: [x, y, z], c });
    }
    rows.push(row);
  }
  const pos: number[] = [], col: number[] = [], idx: number[] = [];
  rows.forEach((row) => row.forEach((q) => { pos.push(...q.p); col.push(q.c.r, q.c.g, q.c.b); }));
  for (let i = 0; i < rows.length - 1; i++) for (let j = 0; j < NT; j++) {
    const a = i * NT + j, b = i * NT + ((j + 1) % NT), c = (i + 1) * NT + j, d = (i + 1) * NT + ((j + 1) % NT);
    idx.push(a, c, b, b, c, d);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  geo.computeBoundingSphere();
  const trees: TreeInst[] = [];
  const nT = o.trees ?? Math.round(R * 0.7);
  for (let k = 0; k < nT; k++) {
    const th = rnd() * Math.PI * 2, rr = R * 0.78 * Math.sqrt(rnd());
    const x = rr * Math.cos(th), z = rr * Math.sin(th);
    trees.push({ p: [x, top(x, z), z], s: R * (0.07 + 0.06 * rnd()), kind: rnd() < 0.55 ? 0 : 1, tint: rnd() });
  }
  const rim = (th: number): P3 => { const rr = R * J(th); const x = rr * Math.cos(th), z = rr * Math.sin(th); return [x, top(x, z) - 0.02 * R, z]; };
  return { geo, top, rim, trees, r: R, depth: D };
}

/** place a local point of an island transform (position + yaw + uniform scale) */
export const placeLocal = (p: P3, at: P3, yaw: number, sc = 1): P3 => {
  const c = Math.cos(yaw), s = Math.sin(yaw);
  return [at[0] + (p[0] * c + p[2] * s) * sc, at[1] + p[1] * sc, at[2] + (-p[0] * s + p[2] * c) * sc];
};

/** all trees of a scene in three instanced meshes (pine crowns, round crowns, trunks) */
export const Trees: React.FC<{ items: TreeInst[] }> = ({ items }) => {
  const built = useMemo(() => {
    const pine = new THREE.ConeGeometry(0.42, 1.0, 7, 1); pine.translate(0, 0.75, 0);
    const pine2 = new THREE.ConeGeometry(0.3, 0.7, 7, 1); pine2.translate(0, 1.15, 0);
    const pineG = mergeSimple([pine, pine2]);
    const round = new THREE.IcosahedronGeometry(0.42, 1); round.translate(0, 0.8, 0);
    const trunk = new THREE.CylinderGeometry(0.05, 0.08, 0.5, 5); trunk.translate(0, 0.25, 0);
    const mats = [0, 1, 2].map(() => new THREE.MeshStandardMaterial({ roughness: 0.85, flatShading: true }));
    mats[2].color.set('#6B4A33');
    const pines = items.filter((t) => t.kind === 0), rounds = items.filter((t) => t.kind === 1);
    const mk = (geo: THREE.BufferGeometry, list: TreeInst[], mat: THREE.Material, cols?: [string, string]) => {
      const im = new THREE.InstancedMesh(geo, mat, Math.max(1, list.length));
      const m4 = new THREE.Matrix4(), q = new THREE.Quaternion();
      list.forEach((t, i) => {
        q.setFromEuler(new THREE.Euler(0, t.tint * 6.28, 0));
        m4.compose(new THREE.Vector3(...t.p), q, new THREE.Vector3(t.s, t.s * (0.85 + 0.3 * t.tint), t.s));
        im.setMatrixAt(i, m4);
        if (cols) im.setColorAt(i, new THREE.Color(cols[0]).lerp(new THREE.Color(cols[1]), t.tint));
      });
      im.count = list.length;
      im.instanceMatrix.needsUpdate = true;
      if (im.instanceColor) im.instanceColor.needsUpdate = true;
      im.frustumCulled = false;
      return im;
    };
    return [
      mk(pineG, pines, mats[0], ['#2E7A3A', '#4A9A45']),
      mk(round, rounds, mats[1], ['#5FAE3E', '#9CCB4E']),
      mk(trunk, items, mats[2]),
    ];
  }, [items]);
  return <>{built.map((m, i) => <primitive key={i} object={m} />)}</>;
};

export function mergeSimple(gs: THREE.BufferGeometry[]) {
  const pos: number[] = [], nor: number[] = [], idx: number[] = [];
  let nv = 0;
  for (const g0 of gs) {
    const g = g0.index ? g0 : g0;
    const p = g.attributes.position.array, n = g.attributes.normal.array;
    for (let i = 0; i < p.length; i++) { pos.push(p[i]); nor.push(n[i]); }
    if (g.index) { const ix = g.index.array; for (let i = 0; i < ix.length; i++) idx.push(ix[i] + nv); }
    else for (let i = 0; i < p.length / 3; i++) idx.push(i + nv);
    nv += p.length / 3;
  }
  const m = new THREE.BufferGeometry();
  m.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  m.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  m.setIndex(idx);
  return m;
}

// ------------------------------------------------------------------------------------------------ waterfall
const fallVert = /* glsl */ `
varying vec2 vUv; varying float vDepth;
void main() { vUv = uv; vec4 mv = modelViewMatrix * vec4(position, 1.0); vDepth = -mv.z; gl_Position = projectionMatrix * mv; }`;
const fallFrag = /* glsl */ `
uniform sampler2D uNoise; uniform float uTime; uniform float uLen; uniform vec3 uCol; uniform vec3 uHaze; uniform float uHazeDist; uniform float uOpacity;
varying vec2 vUv; varying float vDepth;
void main() {
  float x = vUv.x, y = vUv.y;
  float s1 = texture2D(uNoise, vec2(x * 1.6, y * uLen * 0.018 - uTime * 1.3)).g;
  float s2 = texture2D(uNoise, vec2(x * 3.7 + 0.3, y * uLen * 0.035 - uTime * 2.1)).r;
  float streak = smoothstep(0.3, 0.75, s1 * 0.6 + s2 * 0.55);
  float edge = smoothstep(0.0, 0.18, x) * smoothstep(1.0, 0.82, x);
  float fade = 1.0 - smoothstep(0.55, 1.0, y);
  float a = (0.35 + 0.65 * streak) * edge * fade * uOpacity;
  vec3 c = mix(uCol * 0.78, uCol * 1.25, streak);
  c = mix(c, uHaze, 1.0 - exp(-vDepth / uHazeDist));
  gl_FragColor = vec4(c, a);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  gl_FragColor.rgb *= gl_FragColor.a;
}`;

/** a curtain of water spilling over an edge at `top`, leaving along `out` (horizontal), falling `drop` units */
export const Waterfall: React.FC<{ top: P3; out: P3; width: number; drop: number; time: number; haze: string; hazeDist: number; color?: string; opacity?: number }> = ({ top, out, width, drop, time, haze, hazeDist, color = '#EAF6FF', opacity = 0.95 }) => {
  const geo = useMemo(() => {
    const o = norm([out[0], 0, out[2]]), side = norm(cross([0, 1, 0], o));
    const NY = 28, NX = 4, pos: number[] = [], uv: number[] = [], idx: number[] = [];
    for (let i = 0; i <= NY; i++) {
      const v = i / NY, d = drop * v;
      const outD = 1.2 * Math.sqrt(d) + 0.6 * v * width * 0.1;
      const w = width * (1 + 0.6 * v);
      for (let j = 0; j <= NX; j++) {
        const u = j / NX;
        const p = madd(madd(madd(top, o, outD), side, (u - 0.5) * w), [0, 1, 0], -d);
        pos.push(...p); uv.push(u, v);
      }
    }
    for (let i = 0; i < NY; i++) for (let j = 0; j < NX; j++) {
      const a = i * (NX + 1) + j, b = a + 1, c = a + NX + 1, d = c + 1;
      idx.push(a, c, b, b, c, d);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    return g;
  }, [top[0], top[1], top[2], out[0], out[2], width, drop]);
  const mat = useMemo(() => new THREE.ShaderMaterial({
    uniforms: { uNoise: { value: noiseTex() }, uTime: { value: 0 }, uLen: { value: 1 }, uCol: { value: new THREE.Color() }, uHaze: { value: new THREE.Color() }, uHazeDist: { value: 900 }, uOpacity: { value: 1 } },
    vertexShader: fallVert, fragmentShader: fallFrag, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
  }), []);
  mat.uniforms.uTime.value = time; mat.uniforms.uLen.value = drop; mat.uniforms.uCol.value.set(color);
  mat.uniforms.uHaze.value.set(haze); mat.uniforms.uHazeDist.value = hazeDist; mat.uniforms.uOpacity.value = opacity;
  return <mesh geometry={geo} material={mat} renderOrder={4} />;
};

// ------------------------------------------------------------------------------------------------ 2D sun flare
/** screen-space sun bloom, anamorphic streak and lens ghosts (mix-blend screen), at the projected sun position */
export const SunFlare: React.FC<{ x: number; y: number; k: number; w?: number; h?: number; color?: string; ghost?: string }> = ({ x, y, k, w = 1920, h = 1080, color = '255,236,200', ghost = '160,220,255' }) => {
  if (k <= 0.005) return null;
  const cx = w / 2, cy = h / 2, dx = cx - x, dy = cy - y;
  const ghosts = [[0.35, 50, 0.1], [0.62, 22, 0.14], [0.9, 80, 0.05], [1.25, 36, 0.09], [1.6, 120, 0.035]];
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', mixBlendMode: 'screen', overflow: 'hidden', zIndex: 30 }}>
      <div style={{ position: 'absolute', left: x - 900, top: y - 900, width: 1800, height: 1800, borderRadius: '50%', opacity: Math.min(1, k),
        background: `radial-gradient(circle, rgba(${color},0.95) 0%, rgba(${color},0.45) 7%, rgba(${color},0.16) 22%, rgba(${color},0.05) 45%, rgba(${color},0) 70%)` }} />
      <div style={{ position: 'absolute', left: x - 1300, top: y - 5, width: 2600, height: 10, opacity: 0.55 * Math.min(1, k),
        background: `radial-gradient(50% 50% at 50% 50%, rgba(${color},0.9) 0%, rgba(${color},0.25) 30%, rgba(${color},0) 100%)` }} />
      {ghosts.map(([t, r, a], i) => (
        <div key={i} style={{ position: 'absolute', left: x + dx * t * 1.6 - r, top: y + dy * t * 1.6 - r, width: r * 2, height: r * 2, borderRadius: '50%', opacity: a * k,
          background: i % 2 ? `radial-gradient(circle, rgba(${ghost},0.0) 55%, rgba(${ghost},0.8) 70%, rgba(${ghost},0) 78%)` : `radial-gradient(circle, rgba(${ghost},0.6) 0%, rgba(${ghost},0.15) 60%, rgba(${ghost},0) 72%)` }} />
      ))}
    </div>
  );
};
