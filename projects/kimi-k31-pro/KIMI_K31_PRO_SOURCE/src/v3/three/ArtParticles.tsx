// GPU particle bloom + fluid backdrop for the InteractiveArt shot. Every particle's position is a closed-form function of
// its random attributes and a few uniforms the scene derives from the frame (time integrals such as the vortex phase and
// the bloom spin are integrated in JS from frame 0, so any frame can be rendered alone):
//   pre-burst  a three-armed vortex disc around the pointer; outer particles follow the pointer's PAST positions
//              (lag grows with radius), which turns a moving pointer into a fluid comet; "charge" pulls it in and spins it up
//   burst      from where each particle sat at release it flies out along a petal-shaped direction with drag
//   bloom      the flower spins (speed ramps up), breathes on the beats, parts around the pointer, and finally contracts
// Streaks are the same function evaluated at the current and a slightly earlier state (motion trails).
import React, { useMemo } from 'react';
import * as THREE from 'three';
import { mulberry32 } from '../../lib/rng';
import { GLSL_COMMON } from './ArtKit';

export const PATH_N = 96, PATH_START = -24, PATH_STEP = 2;

export interface ParticleState {
  frame: number; phase: number; charge: number; burstT: number;   // burstT seconds since release (< 0 before)
  spin: number; pulse: number; squeeze: number; heat: number;
}

const GLSL_PARTICLE = /* glsl */ `
uniform vec2 uPath[${PATH_N}];
uniform vec3 uBurstC; uniform float uPhaseB, uChargeB; uniform vec2 uCur; uniform float uCurOn;
vec2 pathAt(float fr) {
  float x = (fr - ${PATH_START.toFixed(1)}) / ${PATH_STEP.toFixed(1)};
  float fi = clamp(floor(x), 0.0, ${(PATH_N - 2).toFixed(1)});
  int i = int(fi);
  return mix(uPath[i], uPath[i + 1], clamp(x - fi, 0.0, 1.0));
}
mat2 rot(float a) { float c = cos(a), s = sin(a); return mat2(c, s, -s, c); }
// vortex disc offset (relative to its centre)
vec3 disc(vec4 a, float phase, float charge, out float r0) {
  r0 = 0.1 + 3.4 * pow(a.x, 0.8);
  float rr = r0 * (1.0 - 0.62 * charge);
  float arm = floor(a.y * 3.0);
  float th = arm * 2.0944 + r0 * 1.9 + (a.z - 0.5) * (0.5 + 0.25 * r0) + 1.25 / pow(0.35 + r0, 1.1) * phase;
  float z = (a.w - 0.5) * (0.25 + 0.35 * r0) * (1.0 - 0.5 * charge);
  return vec3(cos(th) * rr, sin(th) * rr, z);
}
vec3 particlePos(vec4 a, vec4 b, vec4 S0, vec4 S1, out float r0, out float energy, out float hue) {
  float fr = S0.x, phase = S0.y, charge = S0.z, burstT = S0.w;
  float spin = S1.x, pulse = S1.y, squeeze = S1.z;
  vec3 p;
  if (burstT < 0.0) {
    vec3 d = disc(a, phase, charge, r0);
    float lag = (1.5 + 9.0 * r0) * (1.0 - 0.75 * charge);
    vec2 c = pathAt(fr - lag);
    p = vec3(c, 0.0) + d * (1.0 + 0.05 * pulse);
    float sw = sin(d.y * 1.6 + fr * 0.05 + b.x * 6.0), sw2 = sin(d.x * 1.7 - fr * 0.045 + b.y * 6.0);
    p.xy += vec2(sw, sw2) * (0.08 + 0.05 * r0) * (1.0 - 0.6 * charge);
    energy = 1.0 + 1.1 * charge;
    hue = floor(a.y * 3.0) / 3.0 + (a.z - 0.5) * 0.12;
  } else {
    float rB;
    vec3 d0 = disc(a, uPhaseB, uChargeB, rB); r0 = rB;
    float phi = atan(d0.y, d0.x) + (b.x - 0.5) * 0.9;
    phi -= sin(7.0 * phi) * 0.06;
    hue = mod(floor(phi / 0.8976 + 0.5), 7.0) / 7.0 + (b.x - 0.5) * 0.05;
    float petal = 0.3 + 0.7 * pow(abs(cos(3.5 * phi)), 1.4);
    float D = (0.65 + 3.5 * pow(b.y, 0.75)) * petal + 0.22 * b.z;
    vec3 dir = normalize(vec3(cos(phi), sin(phi), (b.z - 0.5) * 0.55));
    float k = 2.4 + 3.6 * b.w;
    float s = 1.0 - exp(-burstT * k);
    vec3 bl = d0 * (1.0 - s) + dir * D * s;
    bl.xy = rot(spin * (0.55 + 0.9 / (0.7 + D * 0.3))) * bl.xy;
    bl *= (1.0 + 0.085 * pulse) * (1.0 - 0.78 * squeeze);
    p = uBurstC + bl;
    float tw = fr * 0.06;
    p.xy += vec2(sin(p.y * 1.3 + tw + b.x * 6.0), sin(p.x * 1.2 - tw + b.y * 6.0)) * 0.07 * s;
    // the pointer parts the bloom
    vec2 dc = p.xy - uCur; float dl = length(dc) + 1e-3;
    p.xy += dc / dl * 0.55 * exp(-dl * dl / 0.45) * uCurOn * s;
    energy = 1.5 + 2.5 * exp(-burstT * 2.2) + 1.0 * squeeze + 0.3 * pulse;
  }
  return p;
}
vec3 cool(float x) { return x < 0.33 ? mix(vec3(0.36, 0.88, 1.0), vec3(0.55, 0.49, 1.0), x * 3.0) : x < 0.66 ? mix(vec3(0.55, 0.49, 1.0), vec3(1.0, 0.31, 0.85), (x - 0.33) * 3.0) : mix(vec3(1.0, 0.31, 0.85), vec3(0.36, 0.88, 1.0), (x - 0.66) * 3.0); }
vec3 rainbow(float x) { return clamp(0.56 + 0.5 * cos(6.2832 * (x + vec3(0.0, 0.33, 0.67))), 0.0, 1.0); }
vec3 hot(float x) { return x < 0.33 ? mix(vec3(1.0, 0.78, 0.35), vec3(1.0, 0.43, 0.35), x * 3.0) : x < 0.66 ? mix(vec3(1.0, 0.43, 0.35), vec3(1.0, 0.31, 0.85), (x - 0.33) * 3.0) : mix(vec3(1.0, 0.31, 0.85), vec3(0.45, 0.85, 1.0), (x - 0.66) * 3.0); }
`;

const PT_VERT = /* glsl */ `
attribute vec4 aA; attribute vec4 aB;
uniform vec4 uS0, uS1; uniform float uPx, uHeat, uGain, uHue;
varying vec3 vCol; varying float vI;
${GLSL_PARTICLE}
void main() {
  float r0, energy, hue;
  vec3 p = particlePos(aA, aB, uS0, uS1, r0, energy, hue);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  float big = step(0.955, aB.w);
  float size = mix(1.5 + 2.4 * aB.y * aB.y, 9.0 + 9.0 * aB.x, big);
  gl_PointSize = size * uPx / -mv.z;
  vec3 c = mix(cool(fract(hue)), rainbow(fract(hue + uHue)), uHeat);
  c = mix(c, vec3(1.0, 0.96, 0.9), (1.0 - smoothstep(0.1, 1.2, r0)) * 0.55);
  vCol = c;
  vI = (0.1 + 0.16 * aB.x) * energy * uGain * mix(1.0, 0.18, big);
}`;
const PT_FRAG = /* glsl */ `
varying vec3 vCol; varying float vI;
void main() { vec2 q = gl_PointCoord - 0.5; float r2 = dot(q, q) * 4.0; float a = exp(-r2 * 3.2) * (1.0 - smoothstep(0.7, 1.0, r2)); gl_FragColor = vec4(vCol * a * vI, 1.0); }`;

const LN_VERT = /* glsl */ `
attribute vec4 aA; attribute vec4 aB; attribute float aEnd;
uniform vec4 uS0, uS1, uP0, uP1; uniform float uHeat, uGain, uStreak, uHue;
varying vec3 vCol; varying float vI;
${GLSL_PARTICLE}
void main() {
  float r0, energy, hue, r1, e1, h1;
  vec3 pc = particlePos(aA, aB, uS0, uS1, r0, energy, hue);
  vec3 pp = particlePos(aA, aB, uP0, uP1, r1, e1, h1);
  vec3 d = pp - pc; float L = length(d);
  vec3 p = aEnd > 0.5 ? pc : pc + d * min(1.0, 0.7 / (L + 1e-4));
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  vCol = mix(cool(fract(hue)), rainbow(fract(hue + uHue)), uHeat);
  vI = (0.04 + 0.26 * aEnd) * energy * uGain * uStreak;
}`;
const LN_FRAG = /* glsl */ `varying vec3 vCol; varying float vI; void main() { gl_FragColor = vec4(vCol * vI, 1.0); }`;

function attrs(n: number, seed: number, perVertex = 1) {
  const r = mulberry32(seed);
  const A = new Float32Array(n * perVertex * 4), B = new Float32Array(n * perVertex * 4), E = new Float32Array(n * perVertex);
  for (let i = 0; i < n; i++) {
    const a = [r(), r(), r(), r()], b = [r(), r(), r(), r()];
    for (let k = 0; k < perVertex; k++) { A.set(a, (i * perVertex + k) * 4); B.set(b, (i * perVertex + k) * 4); E[i * perVertex + k] = k; }
  }
  return { A, B, E };
}

export const ParticleBloom: React.FC<{
  count: number; streaks: number; cur: ParticleState; prev: ParticleState; path: [number, number][];
  burstC: [number, number, number]; phaseB: number; chargeB: number; pointer: [number, number]; pointerOn: number; px: number; gain?: number; streak?: number; hueShift?: number;
}> = (p) => {
  const geo = useMemo(() => {
    const a = attrs(p.count, 91);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(p.count * 3), 3));
    g.setAttribute('aA', new THREE.BufferAttribute(a.A, 4)); g.setAttribute('aB', new THREE.BufferAttribute(a.B, 4));
    const l = attrs(p.streaks, 92, 2);
    const gl = new THREE.BufferGeometry();
    gl.setAttribute('position', new THREE.BufferAttribute(new Float32Array(p.streaks * 2 * 3), 3));
    gl.setAttribute('aA', new THREE.BufferAttribute(l.A, 4)); gl.setAttribute('aB', new THREE.BufferAttribute(l.B, 4)); gl.setAttribute('aEnd', new THREE.BufferAttribute(l.E, 1));
    return { pts: g, lines: gl };
  }, [p.count, p.streaks]);
  const mats = useMemo(() => {
    const uni = () => ({
      uPath: { value: Array.from({ length: PATH_N }, () => new THREE.Vector2()) }, uBurstC: { value: new THREE.Vector3() }, uPhaseB: { value: 0 }, uChargeB: { value: 0 },
      uCur: { value: new THREE.Vector2() }, uCurOn: { value: 0 }, uS0: { value: new THREE.Vector4() }, uS1: { value: new THREE.Vector4() },
      uP0: { value: new THREE.Vector4() }, uP1: { value: new THREE.Vector4() }, uPx: { value: 1 }, uHeat: { value: 0 }, uGain: { value: 1 }, uStreak: { value: 1 }, uHue: { value: 0 },
    });
    const base = { transparent: true, depthWrite: false, depthTest: false, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor, blendEquation: THREE.AddEquation };
    return {
      pts: new THREE.ShaderMaterial({ ...base, vertexShader: PT_VERT, fragmentShader: PT_FRAG, uniforms: uni() }),
      lines: new THREE.ShaderMaterial({ ...base, vertexShader: LN_VERT, fragmentShader: LN_FRAG, uniforms: uni() }),
    };
  }, []);
  for (const m of [mats.pts, mats.lines]) {
    const u = m.uniforms;
    p.path.forEach(([x, y], i) => (u.uPath.value as THREE.Vector2[])[i].set(x, y));
    (u.uBurstC.value as THREE.Vector3).set(...p.burstC); u.uPhaseB.value = p.phaseB; u.uChargeB.value = p.chargeB;
    (u.uCur.value as THREE.Vector2).set(...p.pointer); u.uCurOn.value = p.pointerOn;
    (u.uS0.value as THREE.Vector4).set(p.cur.frame, p.cur.phase, p.cur.charge, p.cur.burstT);
    (u.uS1.value as THREE.Vector4).set(p.cur.spin, p.cur.pulse, p.cur.squeeze, 0);
    (u.uP0.value as THREE.Vector4).set(p.prev.frame, p.prev.phase, p.prev.charge, p.prev.burstT);
    (u.uP1.value as THREE.Vector4).set(p.prev.spin, p.prev.pulse, p.prev.squeeze, 0);
    u.uPx.value = p.px; u.uHeat.value = p.cur.heat; u.uGain.value = p.gain ?? 1; u.uStreak.value = p.streak ?? 1; u.uHue.value = p.hueShift ?? 0;
  }
  return (
    <>
      <lineSegments geometry={geo.lines} material={mats.lines} frustumCulled={false} renderOrder={2} />
      <points geometry={geo.pts} material={mats.pts} frustumCulled={false} renderOrder={3} />
    </>
  );
};

// ------------------------------------------------------------------------------------------------ fluid backdrop
const BG_VERT = /* glsl */ `void main() { gl_Position = vec4(position.xy * 2.0, 0.0, 1.0); }`;
const BG_FRAG = /* glsl */ `${GLSL_COMMON}
uniform vec2 uRes, uCur, uCore; uniform float uTime, uSwirl, uBurstT, uPulse, uHeat, uCharge, uFlash, uCoreI;
mat2 rot2(float a) { float c = cos(a), s = sin(a); return mat2(c, s, -s, c); }
void main() {
  float asp = uRes.x / uRes.y;
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 p = (uv - 0.5) * vec2(asp, 1.0) * 2.0;
  vec2 c = (uCur - 0.5) * vec2(asp, 1.0) * 2.0;
  vec2 d = p - c; float r = length(d);
  p = c + rot2(uSwirl * exp(-r * r * 1.4)) * d;
  float ring = 0.0;
  if (uBurstT > 0.0) {
    float R = uBurstT * 4.2;
    ring = exp(-pow((r - R) * 5.0, 2.0)) * exp(-uBurstT * 3.0);
    p += d / (r + 1e-3) * ring * 0.22;
  }
  float t = uTime;
  vec2 q = vec2(fbm(p * 1.15 + vec2(0.0, t * 0.06)), fbm(p * 1.15 + vec2(5.2, 1.3) - t * 0.05));
  vec2 w = vec2(fbm(p * 1.15 + 3.6 * q + vec2(1.7, 9.2) + t * 0.08), fbm(p * 1.15 + 3.6 * q + vec2(8.3, 2.8) - t * 0.06));
  float v = fbm(p * 1.15 + 3.2 * w);
  vec3 deep = vec3(0.006, 0.008, 0.03);
  vec3 ind = mix(vec3(0.09, 0.05, 0.27), vec3(0.02, 0.10, 0.20), uHeat);
  vec3 mag = mix(vec3(0.50, 0.07, 0.40), vec3(0.06, 0.30, 0.42), uHeat);
  vec3 cy = mix(vec3(0.05, 0.36, 0.55), vec3(0.30, 0.10, 0.40), uHeat);
  vec3 col = mix(deep, ind, smoothstep(0.25, 0.8, v));
  col = mix(col, mag, smoothstep(0.6, 1.0, length(q)) * 0.55);
  col = mix(col, cy, smoothstep(0.58, 0.92, w.y) * 0.45);
  col += vec3(0.9, 0.5, 0.2) * pow(smoothstep(0.66, 0.98, v), 2.0) * 0.18;
  col *= 0.4 + 0.2 * uPulse + 0.3 * uCharge;
  col += vec3(1.0, 0.55, 0.85) * ring * 0.9 + vec3(1.0, 0.9, 0.95) * uFlash * 0.75 * exp(-r * r * 0.6);
  col += vec3(0.5, 0.45, 1.0) * exp(-r * r * 3.0) * (0.12 + 0.35 * uCharge);
  vec2 cc = (uCore - 0.5) * vec2(asp, 1.0) * 2.0; float rc = length((uv - 0.5) * vec2(asp, 1.0) * 2.0 - cc);
  col += (vec3(1.0, 0.85, 0.95) * exp(-rc * rc * 9.0) + vec3(0.7, 0.4, 1.0) * exp(-rc * rc * 1.6) * 0.35) * uCoreI;
  col *= 1.0 - 0.35 * smoothstep(0.6, 1.5, length((uv - 0.5) * vec2(asp, 1.0)));
  gl_FragColor = vec4(col, 1.0);
}`;

export const FluidBackdrop: React.FC<{ w: number; h: number; t: number; cur: [number, number]; swirl: number; burstT: number; pulse: number; heat: number; charge: number; flash: number; core?: [number, number]; coreI?: number }> = (p) => {
  const mat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: BG_VERT, fragmentShader: BG_FRAG, depthTest: false, depthWrite: false,
    uniforms: { uRes: { value: new THREE.Vector2() }, uCur: { value: new THREE.Vector2() }, uTime: { value: 0 }, uSwirl: { value: 0 }, uBurstT: { value: -1 }, uPulse: { value: 0 }, uHeat: { value: 0 }, uCharge: { value: 0 }, uFlash: { value: 0 }, uCore: { value: new THREE.Vector2(0.5, 0.5) }, uCoreI: { value: 0 } },
  }), []);
  const u = mat.uniforms;
  (u.uRes.value as THREE.Vector2).set(p.w, p.h); (u.uCur.value as THREE.Vector2).set(...p.cur);
  u.uTime.value = p.t; u.uSwirl.value = p.swirl; u.uBurstT.value = p.burstT; u.uPulse.value = p.pulse; u.uHeat.value = p.heat; u.uCharge.value = p.charge; u.uFlash.value = p.flash; (u.uCore.value as THREE.Vector2).set(...(p.core ?? [0.5, 0.5])); u.uCoreI.value = p.coreI ?? 0;
  return <mesh material={mat} frustumCulled={false} renderOrder={-1}><planeGeometry args={[1, 1]} /></mesh>;
};
