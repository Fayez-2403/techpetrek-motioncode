// The world behind the storytelling site (StoryWeb): a lighthouse on a rock, an open sea, a small sailboat and a sky that
// turns from dusk to a starry night. All procedural. The sky and the sea share one sky function (so reflections match),
// waves are a fixed sum of deep-water sines (JS mirror in waveAt() for the boat), and every input is a prop derived from
// the frame (time = frame / 30). No textures, no post-processing: glow is additive billboards and beam cones.
import React, { useMemo } from 'react';
import * as THREE from 'three';
import { mulberry32 } from '../../lib/rng';
import { GLSL_COMMON } from './ArtKit';

export type Vec3 = [number, number, number];
export const LIGHTHOUSE: Vec3 = [-6, 0, -40];
export const LAMP_Y = 16.1;
export const LAMP: Vec3 = [LIGHTHOUSE[0], LAMP_Y, LIGHTHOUSE[2]];

// ------------------------------------------------------------------------------------------------ waves (GLSL + JS)
const WAVES: [number, number, number, number][] = (() => {
  // [dirX, dirZ, wavelength, amplitude]
  const r = mulberry32(404);
  return Array.from({ length: 5 }, (_, i) => {
    const a = -0.4 + (r() - 0.5) * 1.4 + i * 0.25;
    return [Math.cos(a), Math.sin(a), 30 / (1 + i * 0.7), 0.3 / (1 + i * 0.9)] as [number, number, number, number];
  });
})();
const omega = (L: number) => Math.sqrt((9.81 * 2 * Math.PI) / L);
export function waveAt(x: number, z: number, t: number) {
  let h = 0, dx = 0, dz = 0;
  for (const [ax, az, L, A] of WAVES) {
    const k = (2 * Math.PI) / L, ph = k * (ax * x + az * z) - omega(L) * t;
    h += A * Math.sin(ph); dx += A * k * ax * Math.cos(ph); dz += A * k * az * Math.cos(ph);
  }
  return { h, dx, dz };
}
const GLSL_WAVES = /* glsl */ `
const int NW = ${WAVES.length};
vec4 W[NW];
void initW() {
${WAVES.map(([ax, az, L, A], i) => `  W[${i}] = vec4(${ax.toFixed(5)}, ${az.toFixed(5)}, ${((2 * Math.PI) / L).toFixed(5)}, ${A.toFixed(5)});`).join('\n')}
}
float om(float k) { return sqrt(9.81 * k); }
vec3 waveH(vec2 p, float t) {
  vec3 r = vec3(0.0);
  for (int i = 0; i < NW; i++) { float ph = W[i].z * dot(W[i].xy, p) - om(W[i].z) * t; r.x += W[i].w * sin(ph); r.yz += W[i].w * W[i].z * W[i].xy * cos(ph); }
  return r;
}`;

// ------------------------------------------------------------------------------------------------ sky
const GLSL_SKY = /* glsl */ `
uniform vec3 uSunDir; uniform float uNight, uTime, uStars, uStarWave; uniform vec3 uWaveDir, uBandN;
vec3 skyCol(vec3 d, float withStars) {
  float el = d.y;
  vec3 hor = vec3(1.0, 0.70, 0.52), mid = vec3(0.95, 0.50, 0.55), zen = vec3(0.24, 0.25, 0.55);
  vec3 dusk = mix(hor, mid, smoothstep(0.0, 0.10, el));
  dusk = mix(dusk, zen, smoothstep(0.07, 0.55, el));
  float sd = max(dot(d, uSunDir), 0.0);
  dusk += vec3(1.0, 0.58, 0.28) * pow(sd, 5.0) * 0.55 + vec3(1.0, 0.86, 0.62) * pow(sd, 90.0) * 1.3 + vec3(1.0, 0.95, 0.85) * smoothstep(0.9993, 0.9997, sd) * 2.0;
  // thin lit cloud streaks above the horizon
  vec2 cp = d.xz / (max(el, 0.0) + 0.06);
  float cl = smoothstep(0.52, 0.78, fbm(vec2(cp.x * 0.9, cp.y * 0.22) + vec2(uTime * 0.01, 0.0))) * smoothstep(0.0, 0.05, el) * (1.0 - smoothstep(0.18, 0.4, el));
  dusk = mix(dusk, mix(vec3(1.0, 0.62, 0.55), vec3(0.62, 0.34, 0.52), smoothstep(0.02, 0.25, el)) * (0.8 + 0.6 * pow(sd, 3.0)), cl * 0.7);
  // night
  vec3 nh = vec3(0.10, 0.15, 0.33), nz = vec3(0.012, 0.018, 0.065);
  vec3 nc = mix(nh, nz, smoothstep(-0.02, 0.45, el));
  float bd = dot(d, uBandN);
  float band = exp(-bd * bd / 0.045);
  vec2 mp = vec2(atan(d.x, -d.z), asin(clamp(el, -1.0, 1.0)));
  float dust = fbm(mp * 7.0 + 3.1), dark = fbm(mp * 15.0 + 9.7);
  vec3 mw = mix(vec3(0.36, 0.30, 0.62), vec3(0.95, 0.72, 0.52), smoothstep(0.45, 0.8, dust)) * band * (0.25 + 0.9 * dust) * (1.0 - 0.75 * smoothstep(0.45, 0.7, dark) * band);
  nc += mw * 0.55 * smoothstep(-0.02, 0.12, el);
  // stars: one candidate per angular cell
  float stars = 0.0; vec3 sc = vec3(0.0);
  if (withStars > 0.5 && el > -0.02) {
    vec2 g = mp / 0.0042;
    vec2 id = floor(g), fr = fract(g) - 0.5;
    float h = hash12(id), h2 = hash12(id + 17.3), h3 = hash12(id + 41.9);
    float p = 0.925 - 0.05 * band;
    if (h > p) {
      float b = (h - p) / (1.0 - p);
      vec2 o = (vec2(h2, h3) - 0.5) * 0.55;
      float r = length(fr - o);
      float tw = 0.75 + 0.25 * sin(uTime * (2.0 + 5.0 * h2) + h3 * 40.0);
      stars = exp(-r * r / (0.008 + 0.03 * b * b)) * (0.25 + 1.6 * b * b) * tw;
      sc = mix(vec3(0.75, 0.85, 1.0), vec3(1.0, 0.86, 0.66), h3);
    }
    float wave = smoothstep(uStarWave - 0.25, uStarWave, acos(clamp(dot(d, uWaveDir), -1.0, 1.0)));
    stars *= (1.0 - wave) * uStars * smoothstep(0.0, 0.06, el);
  }
  nc += sc * stars;
  return mix(dusk, nc, uNight);
}`;

const SKY_VERT = /* glsl */ `varying vec3 vDir; void main() { vDir = normalize(position); vec4 p = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * p; }`;
const SKY_FRAG = /* glsl */ `${GLSL_COMMON}${GLSL_SKY}
varying vec3 vDir;
void main() { gl_FragColor = vec4(skyCol(normalize(vDir), 1.0), 1.0); }`;

// ------------------------------------------------------------------------------------------------ sea
const SEA_VERT = /* glsl */ `${GLSL_WAVES}
uniform float uTime; varying vec3 vW;
void main() {
  initW();
  vec4 w = modelMatrix * vec4(position, 1.0);
  vec3 h = waveH(w.xz, uTime);
  w.y += h.x;
  vW = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
const SEA_FRAG = /* glsl */ `${GLSL_COMMON}${GLSL_SKY}${GLSL_WAVES}
uniform vec3 uCam, uDeep, uDeepN, uLamp, uBoatLamp; uniform float uLampI, uBoatI, uFogFar; varying vec3 vW;
void main() {
  initW();
  vec3 h = waveH(vW.xz, uTime);
  vec2 g = h.yz;
  // fine ripples
  for (int i = 0; i < 6; i++) {
    float fi = float(i);
    vec2 dir = vec2(cos(fi * 2.4 + 0.3), sin(fi * 2.4 + 0.3));
    float k = 0.9 + fi * 0.75;
    float ph = k * dot(dir, vW.xz) - sqrt(9.81 * k) * uTime + fi * 1.7;
    g += 0.028 / (1.0 + fi * 0.5) * k * dir * cos(ph);
  }
  vec3 dist3 = vW - uCam; float dist = length(dist3);
  g *= 1.0 / (1.0 + dist * 0.004);
  vec3 N = normalize(vec3(-g.x, 1.0, -g.y));
  vec3 V = normalize(uCam - vW);
  float F = 0.02 + 0.6 * pow(1.0 - max(dot(N, V), 0.0), 4.0);
  vec3 R = reflect(-V, N); R.y = abs(R.y);
  vec3 refl = skyCol(normalize(R), 0.0) * mix(0.85, 1.0, uNight);
  vec3 deep = mix(uDeep, uDeepN, uNight);
  vec3 col = mix(deep, refl, F);
  float sunSpec = pow(max(dot(R, uSunDir), 0.0), 260.0) * 5.0 * (1.0 - uNight);
  col += vec3(1.0, 0.75, 0.48) * sunSpec;
  vec3 L1 = normalize(uLamp - vW), L2 = normalize(uBoatLamp - vW);
  col += vec3(1.0, 0.82, 0.5) * pow(max(dot(R, L1), 0.0), 320.0) * uLampI * 1.6;
  col += vec3(1.0, 0.78, 0.45) * pow(max(dot(R, L2), 0.0), 120.0) * uBoatI * 3.5;
  vec3 fogc = skyCol(normalize(vec3(dist3.x, 0.012, dist3.z)), 0.0);
  col = mix(col, fogc, smoothstep(uFogFar * 0.25, uFogFar, dist));
  gl_FragColor = vec4(col, 1.0);
}`;

// ------------------------------------------------------------------------------------------------ glow + beam
const GLOW_VERT = /* glsl */ `uniform float uSize; varying vec2 vUv; void main() { vUv = uv - 0.5; vec4 mv = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0); mv.xy += position.xy * uSize; gl_Position = projectionMatrix * mv; }`;
const GLOW_FRAG = /* glsl */ `uniform vec3 uColor; uniform float uI, uCore; varying vec2 vUv;
void main() { float r = length(vUv) * 2.0; float a = exp(-r * r * 5.0) * 0.6 + exp(-r * r * 60.0) * uCore + 0.15 * exp(-r * 3.5); a *= smoothstep(1.0, 0.7, r); gl_FragColor = vec4(uColor * a * uI, 1.0); }`;

export const Glow: React.FC<{ pos: Vec3; size: number; color: string; intensity: number; core?: number; depthTest?: boolean }> = ({ pos, size, color, intensity, core = 1, depthTest = true }) => {
  const mat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: GLOW_VERT, fragmentShader: GLOW_FRAG, transparent: true, depthWrite: false, depthTest, blending: THREE.AdditiveBlending,
    uniforms: { uSize: { value: 1 }, uColor: { value: new THREE.Color() }, uI: { value: 1 }, uCore: { value: 1 } },
  }), [depthTest]);
  mat.uniforms.uSize.value = size; (mat.uniforms.uColor.value as THREE.Color).set(color).convertLinearToSRGB(); mat.uniforms.uI.value = intensity; mat.uniforms.uCore.value = core;
  return intensity > 0.001 ? <mesh position={pos} material={mat} renderOrder={20} frustumCulled={false}><planeGeometry args={[1, 1]} /></mesh> : null;
};

const BEAM_VERT = /* glsl */ `varying float vV; varying vec3 vN; varying vec3 vP; void main() { vV = uv.y; vN = normalize(normalMatrix * normal); vec4 mv = modelViewMatrix * vec4(position, 1.0); vP = mv.xyz; gl_Position = projectionMatrix * mv; }`;
const BEAM_FRAG = /* glsl */ `uniform vec3 uColor; uniform float uI; varying float vV; varying vec3 vN; varying vec3 vP;
void main() { float along = pow(vV, 0.9) * (0.35 + 0.65 * pow(vV, 6.0)); float edge = pow(abs(dot(normalize(vN), normalize(-vP))), 1.6); gl_FragColor = vec4(uColor * along * edge * uI, 1.0); }`;

function beamGeo(len: number, r: number) {
  const g = new THREE.ConeGeometry(r, len, 40, 1, true);   // apex at +len/2, uv.y = 1 at the apex
  g.translate(0, -len / 2, 0);                              // apex at the origin, opening along -Y
  g.rotateZ(Math.PI / 2);                                   // -Y -> +X
  return g;
}

// ------------------------------------------------------------------------------------------------ lighthouse + boat
function rockGeo(seed: number, r: number) {
  const g = new THREE.IcosahedronGeometry(r, 3);
  const p = g.attributes.position, v = new THREE.Vector3(), rnd = mulberry32(seed);
  const o = [rnd() * 10, rnd() * 10, rnd() * 10];
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const n = Math.sin(v.x * 1.7 + o[0]) * Math.sin(v.y * 2.3 + o[1]) * Math.sin(v.z * 1.9 + o[2]);
    const n2 = Math.sin(v.x * 4.1 + o[1]) * Math.sin(v.z * 3.7 + o[2]);
    v.multiplyScalar(1 + 0.22 * n + 0.08 * n2);
    v.y *= 0.62;
    p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
}
const towerR = (y: number) => 1.95 + (1.25 - 1.95) * ((y - 1.4) / 13.6);
function towerSeg(y0: number, y1: number) {
  const pts = [new THREE.Vector2(towerR(y0), y0), new THREE.Vector2(towerR(y1), y1)];
  return new THREE.LatheGeometry(pts, 48);
}

export const Lighthouse: React.FC<{ beam: number; beamI: number; lampI: number; night: number }> = ({ beam, beamI, lampI, night }) => {
  const geo = useMemo(() => ({
    rocks: [[0, 0.2, 0, 4.2, 1], [3.6, -0.2, 1.8, 3.0, 2], [-3.4, -0.3, 1.2, 2.8, 3], [1.5, -0.4, 4.0, 2.2, 4], [-1.8, -0.5, -3.2, 3.2, 5], [6.2, -0.6, 3.4, 1.6, 6]].map(([x, y, z, r, s]) => ({ g: rockGeo(s, r), p: [x, y, z] as Vec3 })),
    white: [towerSeg(1.4, 4.2), towerSeg(6.6, 9.4), towerSeg(11.8, 15.0)],
    red: [towerSeg(4.2, 6.6), towerSeg(9.4, 11.8)],
    beam: beamGeo(170, 10),
  }), []);
  const mats = useMemo(() => ({
    rock: new THREE.MeshStandardMaterial({ color: '#3B3532', roughness: 0.95, flatShading: true }),
    white: new THREE.MeshStandardMaterial({ color: '#EFE8DC', roughness: 0.55 }),
    red: new THREE.MeshStandardMaterial({ color: '#B3302C', roughness: 0.5 }),
    dark: new THREE.MeshStandardMaterial({ color: '#1E2026', roughness: 0.4, metalness: 0.6 }),
    glass: new THREE.MeshStandardMaterial({ color: '#2A2010', emissive: new THREE.Color('#FFC977'), emissiveIntensity: 2, roughness: 0.2 }),
    window: new THREE.MeshStandardMaterial({ color: '#201A12', emissive: new THREE.Color('#FFB35C'), emissiveIntensity: 1.2 }),
    beam: new THREE.ShaderMaterial({ vertexShader: BEAM_VERT, fragmentShader: BEAM_FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
      uniforms: { uColor: { value: new THREE.Vector3(1.0, 0.88, 0.62) }, uI: { value: 0.5 } } }),
  }), []);
  mats.glass.emissiveIntensity = 1.2 + 2.2 * lampI;
  mats.window.emissiveIntensity = 0.4 + 1.4 * night;
  mats.beam.uniforms.uI.value = beamI;
  return (
    <group position={LIGHTHOUSE}>
      {geo.rocks.map((r, i) => <mesh key={i} geometry={r.g} material={mats.rock} position={r.p} />)}
      {geo.white.map((g, i) => <mesh key={`w${i}`} geometry={g} material={mats.white} />)}
      {geo.red.map((g, i) => <mesh key={`r${i}`} geometry={g} material={mats.red} />)}
      {[3.2, 8.0, 12.6].map((y, i) => <mesh key={`win${i}`} position={[Math.sin(0.6 + i) * towerR(y) * 0.98, y, Math.cos(0.6 + i) * towerR(y) * 0.98]} rotation={[0, 0.6 + i, 0]} material={mats.window}><boxGeometry args={[0.42, 0.75, 0.08]} /></mesh>)}
      <mesh position={[0, 15.12, 0]} material={mats.dark}><cylinderGeometry args={[2.05, 2.05, 0.24, 48]} /></mesh>
      <mesh position={[0, 15.85, 0]} rotation={[Math.PI / 2, 0, 0]} material={mats.dark}><torusGeometry args={[1.95, 0.045, 8, 64]} /></mesh>
      <mesh position={[0, 16.1, 0]} material={mats.glass}><cylinderGeometry args={[1.05, 1.05, 1.7, 32]} /></mesh>
      {Array.from({ length: 8 }, (_, i) => <mesh key={`m${i}`} position={[Math.sin((i / 8) * Math.PI * 2) * 1.07, 16.1, Math.cos((i / 8) * Math.PI * 2) * 1.07]} material={mats.dark}><boxGeometry args={[0.07, 1.7, 0.07]} /></mesh>)}
      <mesh position={[0, 17.45, 0]} material={mats.red}><coneGeometry args={[1.3, 1.0, 32]} /></mesh>
      <mesh position={[0, 18.05, 0]} material={mats.dark}><sphereGeometry args={[0.16, 12, 8]} /></mesh>
      {/* keeper's cottage */}
      <group position={[3.4, 1.6, 2.6]} rotation={[0, -0.5, 0]}>
        <mesh position={[0, 1.2, 0]} material={mats.white}><boxGeometry args={[4.2, 2.4, 3.0]} /></mesh>
        <mesh position={[0, 3.27, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 2]} material={mats.red}><cylinderGeometry args={[1.75, 1.75, 4.6, 3]} /></mesh>
        <mesh position={[0.9, 1.25, 1.52]} material={mats.window}><boxGeometry args={[0.7, 0.8, 0.06]} /></mesh>
        <mesh position={[-0.9, 1.25, 1.52]} material={mats.window}><boxGeometry args={[0.7, 0.8, 0.06]} /></mesh>
      </group>
      {/* beams */}
      <group position={[0, LAMP_Y, 0]} rotation={[0, beam, 0]}>
        <mesh geometry={geo.beam} material={mats.beam} />
        <mesh geometry={geo.beam} material={mats.beam} rotation={[0, Math.PI, 0]} />
      </group>
    </group>
  );
};

function hullGeo() {
  // side profile (x along the boat, y up), extruded across, then the bow pinched in
  const s = new THREE.Shape();
  s.moveTo(-2.9, 0.95); s.lineTo(3.2, 1.05); s.quadraticCurveTo(2.6, -0.1, 1.2, -0.45); s.lineTo(-2.4, -0.4); s.quadraticCurveTo(-3.0, 0.1, -2.9, 0.95);
  const g = new THREE.ExtrudeGeometry(s, { depth: 1.9, bevelEnabled: true, bevelSize: 0.06, bevelThickness: 0.06, bevelSegments: 2, steps: 1, curveSegments: 10 });
  g.translate(0, 0, -0.95);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const pinch = Math.max(0, (x - 0.4) / 2.8);
    const keel = Math.max(0, -y) * 0.9;
    p.setZ(i, z * (1 - 0.92 * pinch * pinch) * (1 - 0.55 * keel));
  }
  g.computeVertexNormals();
  return g;
}
export const Boat: React.FC<{ pos: Vec3; yaw: number; t: number; lamp: number; night: number }> = ({ pos, yaw, t, lamp, night }) => {
  const geo = useMemo(() => {
    const sail = new THREE.Shape(); sail.moveTo(0, 0); sail.lineTo(0, 6.2); sail.quadraticCurveTo(-1.6, 2.6, -2.8, 0.15); sail.lineTo(0, 0);
    const jib = new THREE.Shape(); jib.moveTo(0, 0.4); jib.lineTo(0, 5.6); jib.lineTo(2.3, 0.4); jib.lineTo(0, 0.4);
    return { hull: hullGeo(), sail: new THREE.ShapeGeometry(sail, 12), jib: new THREE.ShapeGeometry(jib) };
  }, []);
  const mats = useMemo(() => ({
    hull: new THREE.MeshStandardMaterial({ color: '#23324A', roughness: 0.5 }),
    trim: new THREE.MeshStandardMaterial({ color: '#E9E1D2', roughness: 0.6 }),
    sail: new THREE.MeshStandardMaterial({ color: '#F4EBDD', roughness: 0.8, side: THREE.DoubleSide }),
    mast: new THREE.MeshStandardMaterial({ color: '#2A2420', roughness: 0.6 }),
  }), []);
  const w = waveAt(pos[0], pos[2], t);
  void night;
  return (
    <group position={[pos[0], w.h + 0.05, pos[2]]} rotation={[Math.atan(w.dz) * 0.8, yaw, -Math.atan(w.dx) * 0.8]}>
      <mesh geometry={geo.hull} material={mats.hull} />
      <mesh position={[-0.6, 1.25, 0]} material={mats.trim}><boxGeometry args={[1.6, 0.5, 1.1]} /></mesh>
      <mesh position={[0.3, 4.2, 0]} material={mats.mast}><cylinderGeometry args={[0.06, 0.08, 6.6, 8]} /></mesh>
      <mesh geometry={geo.sail} material={mats.sail} position={[0.36, 1.2, 0.02]} />
      <mesh geometry={geo.jib} material={mats.sail} position={[0.24, 1.2, -0.02]} />
      <Glow pos={[-1.3, 1.9, 0.7]} size={2.6 + 4 * lamp} color="#FFC46B" intensity={0.25 + 1.6 * lamp} core={1.2} depthTest={false} />
    </group>
  );
};

// ------------------------------------------------------------------------------------------------ sky + sea components
export const SkyAndSea: React.FC<{ t: number; night: number; cam: Vec3; sunDir: Vec3; stars: number; starWave: number; waveDir: Vec3; bandN: Vec3; lampI: number; boatLamp: Vec3; boatI: number }> = (p) => {
  const mats = useMemo(() => {
    const common = () => ({ uSunDir: { value: new THREE.Vector3() }, uNight: { value: 0 }, uTime: { value: 0 }, uStars: { value: 0 }, uStarWave: { value: 0 }, uWaveDir: { value: new THREE.Vector3(0, 0, -1) }, uBandN: { value: new THREE.Vector3(0, 1, 0) } });
    return {
      sky: new THREE.ShaderMaterial({ vertexShader: SKY_VERT, fragmentShader: SKY_FRAG, side: THREE.BackSide, depthWrite: false, uniforms: common() }),
      sea: new THREE.ShaderMaterial({ vertexShader: SEA_VERT, fragmentShader: SEA_FRAG, uniforms: { ...common(),
        uCam: { value: new THREE.Vector3() }, uDeep: { value: new THREE.Vector3(0.13, 0.13, 0.27) }, uDeepN: { value: new THREE.Vector3(0.01, 0.03, 0.07) },
        uLamp: { value: new THREE.Vector3(...LAMP) }, uBoatLamp: { value: new THREE.Vector3() }, uLampI: { value: 0 }, uBoatI: { value: 0 }, uFogFar: { value: 700 } } }),
    };
  }, []);
  for (const m of [mats.sky, mats.sea]) {
    const u = m.uniforms;
    (u.uSunDir.value as THREE.Vector3).set(...p.sunDir).normalize(); u.uNight.value = p.night; u.uTime.value = p.t; u.uStars.value = p.stars; u.uStarWave.value = p.starWave;
    (u.uWaveDir.value as THREE.Vector3).set(...p.waveDir).normalize(); (u.uBandN.value as THREE.Vector3).set(...p.bandN).normalize();
  }
  (mats.sea.uniforms.uCam.value as THREE.Vector3).set(...p.cam);
  (mats.sea.uniforms.uBoatLamp.value as THREE.Vector3).set(...p.boatLamp);
  mats.sea.uniforms.uLampI.value = p.lampI; mats.sea.uniforms.uBoatI.value = p.boatI;
  return (
    <>
      <mesh position={p.cam} material={mats.sky} renderOrder={-10} frustumCulled={false}><sphereGeometry args={[1500, 64, 32]} /></mesh>
      <mesh position={[0, 0, -420]} rotation={[-Math.PI / 2, 0, 0]} material={mats.sea} frustumCulled={false}><planeGeometry args={[1500, 1500, 240, 240]} /></mesh>
    </>
  );
};
