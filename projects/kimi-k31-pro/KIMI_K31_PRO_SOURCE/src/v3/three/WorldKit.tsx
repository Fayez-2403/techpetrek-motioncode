// Small shared kit for the V3 "3D worlds" shots (architecture sim, future city, town diorama): shadow-map switch, a
// gradient sky dome, soft textures for fake AO / glow, instancing helpers and a world-position shader hook. Everything
// is deterministic: geometry is built once, per-frame values come in as props.
import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { ThreeCanvas } from '@remotion/three';
import { useFrameSize } from '../../lib/layout';

export type Vec3 = [number, number, number];

/**
 * ThreeStage with shadow maps: same canvas, camera defaults, tone mapping and FrameOverride handling as
 * src/three/stage.tsx (which has no `shadows` input; R3F resets gl.shadowMap from that prop), plus PCF shadows.
 */
export const WorldStage: React.FC<{ children: React.ReactNode; exposure?: number; style?: React.CSSProperties; shadows?: boolean; near?: number; far?: number }> = ({ children, exposure = 1, style, shadows = true, near = 0.05, far = 2000 }) => {
  const cfg = useFrameSize();
  return (
    <ThreeCanvas width={cfg.width} height={cfg.height} style={{ position: 'absolute', inset: 0, ...style }} shadows={shadows ? 'percentage' : false}
      gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' }}
      camera={{ fov: 35, near, far, position: [0, 0, 10] }}
      onCreated={({ gl }) => { gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = exposure; gl.setClearColor(0x000000, 0); }}>
      <Exposure value={exposure} />
      {children}
    </ThreeCanvas>
  );
};
/** keeps the tone-mapping exposure in step with a per-frame value */
const Exposure: React.FC<{ value: number }> = ({ value }) => {
  const { gl } = useThree();
  gl.toneMappingExposure = value;
  return null;
};

/** a shadow-casting directional light built once (ortho shadow box of half-size `ext` around the origin) */
export const ShadowSun: React.FC<{ pos: Vec3; intensity: number; color: string; ext?: number; far?: number; map?: number; radius?: number; bias?: number; normalBias?: number; shadow?: number; target?: Vec3 }> = ({ pos, intensity, color, ext = 60, far = 400, map = 2048, radius = 3, bias = -0.0004, normalBias = 0.03, shadow = 1, target = [0, 0, 0] }) => {
  const light = useMemo(() => {
    const l = new THREE.DirectionalLight('#ffffff', 1);
    l.castShadow = true;
    l.shadow.mapSize.set(map, map);
    const c = l.shadow.camera as THREE.OrthographicCamera;
    c.left = -ext; c.right = ext; c.top = ext; c.bottom = -ext; c.near = 0.5; c.far = far; c.updateProjectionMatrix();
    return l;
  }, [ext, far, map]);
  light.position.set(...pos);
  light.target.position.set(...target);
  light.target.updateMatrixWorld();
  light.intensity = intensity;
  light.color.set(color);
  light.castShadow = intensity > 0.005;

  light.shadow.radius = radius; light.shadow.bias = bias; light.shadow.normalBias = normalBias; light.shadow.intensity = shadow;
  return <primitive object={light} />;
};

/** canvas texture helper (runs once per useMemo) */
function canvasTex(size: number, draw: (g: CanvasRenderingContext2D, s: number) => void, srgb = true) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d')!;
  draw(g, size);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/** soft round dot (glow sprites, light pools) */
export const useGlowTex = () => useMemo(() => canvasTex(128, (g, s) => {
  const gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.18, 'rgba(255,255,255,0.72)');
  gr.addColorStop(0.45, 'rgba(255,255,255,0.2)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, s, s);
}), []);

/** soft rounded rectangle (contact shadow under a box; texture fills the quad, the box covers the inner ~60%) */
export const useSoftRectTex = () => useMemo(() => canvasTex(128, (g, s) => {
  g.clearRect(0, 0, s, s);
  g.filter = `blur(${s * 0.09}px)`;
  g.fillStyle = 'rgba(255,255,255,1)';
  const m = s * 0.2;
  g.fillRect(m, m, s - 2 * m, s - 2 * m);
}, false), []);

/** set every instance's matrix from (position, rotationY, scale) tuples; hidden instances get scale 0 */
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _p = new THREE.Vector3(), _s = new THREE.Vector3(), _e = new THREE.Euler();
export function setInst(mesh: THREE.InstancedMesh, i: number, p: Vec3, s: Vec3, ry = 0, rx = 0, rz = 0) {
  _e.set(rx, ry, rz, 'YXZ'); _q.setFromEuler(_e);
  _m.compose(_p.set(p[0], p[1], p[2]), _q, _s.set(s[0], s[1], s[2]));
  mesh.setMatrixAt(i, _m);
}
export function setInstQ(mesh: THREE.InstancedMesh, i: number, p: THREE.Vector3, q: THREE.Quaternion, s: THREE.Vector3) {
  _m.compose(p, q, s); mesh.setMatrixAt(i, _m);
}
export function doneInst(mesh: THREE.InstancedMesh, colors = false) {
  mesh.instanceMatrix.needsUpdate = true;
  if (colors && mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  mesh.computeBoundingSphere();
}

/** an InstancedMesh built once (count fixed) */
export function useInstanced(geo: THREE.BufferGeometry, mat: THREE.Material, count: number, opts: { cast?: boolean; receive?: boolean; colors?: boolean } = {}) {
  return useMemo(() => {
    const m = new THREE.InstancedMesh(geo, mat, count);
    m.castShadow = !!opts.cast; m.receiveShadow = !!opts.receive;
    m.frustumCulled = false;
    if (opts.colors) m.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(count * 3).fill(1), 3);
    return m;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geo, mat, count]);
}

/** GLSL: world position + world normal varyings for any built-in material (instancing aware) */
export const WORLD_VARYINGS = 'varying vec3 vWp; varying vec3 vWn; varying vec3 vLp; varying vec3 vIo; varying vec3 vIs;';
export const WORLD_VERTEX = `
  vec4 wq = vec4(transformed, 1.0);
  vec3 wn = objectNormal;
  vLp = transformed; vIo = vec3(0.0); vIs = vec3(1.0);
  #ifdef USE_INSTANCING
    wq = instanceMatrix * wq;
    wn = mat3(instanceMatrix) * wn;
    vIo = instanceMatrix[3].xyz;
    vIs = vec3(length(instanceMatrix[0].xyz), length(instanceMatrix[1].xyz), length(instanceMatrix[2].xyz));
  #endif
  vWp = (modelMatrix * wq).xyz;
  vWn = normalize(mat3(modelMatrix) * wn);
`;
/** patch a built-in material's shaders: adds the world varyings, then lets the caller splice its own fragment code */
export function worldHook(m: THREE.Material, key: string, uniforms: Record<string, THREE.IUniform>, frag: (src: string) => string, vert?: (src: string) => string) {
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, uniforms);
    let v = sh.vertexShader
      .replace('#include <common>', `#include <common>\n${WORLD_VARYINGS}`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>\n${WORLD_VERTEX}`);
    if (vert) v = vert(v);
    sh.vertexShader = v;
    sh.fragmentShader = frag(sh.fragmentShader.replace('#include <common>', `#include <common>\n${WORLD_VARYINGS}\nfloat wh21(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }`));
  };
  m.customProgramCacheKey = () => key;
  return m;
}

/** gradient sky dome that rides with the camera: zenith / mid / horizon colours, a glow lobe toward `glowDir`, a ground tint */
export const SkyDome: React.FC<{ at: Vec3; zenith: string; mid: string; horizon: string; ground: string; glowDir?: Vec3; glow?: string; glowPow?: number; glowAmt?: number; radius?: number; horizonY?: number }> = ({ at, zenith, mid, horizon, ground, glowDir = [0, 0.1, -1], glow = '#FFB27A', glowPow = 6, glowAmt = 0.6, radius = 1800, horizonY = 0 }) => {
  const mat = useMemo(() => new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { uZ: { value: new THREE.Color() }, uM: { value: new THREE.Color() }, uH: { value: new THREE.Color() }, uG: { value: new THREE.Color() },
      uGl: { value: new THREE.Color() }, uGd: { value: new THREE.Vector3() }, uGp: { value: 6 }, uGa: { value: 0.6 }, uHy: { value: 0 } },
    vertexShader: `varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position.z = gl_Position.w * 0.99999; }`,
    fragmentShader: `uniform vec3 uZ, uM, uH, uG, uGl, uGd; uniform float uGp, uGa, uHy; varying vec3 vD;
      void main(){
        vec3 d = normalize(vD); float y = d.y - uHy;
        vec3 c = mix(uH, uM, smoothstep(0.0, 0.16, y));
        c = mix(c, uZ, smoothstep(0.12, 0.75, y));
        float g = pow(max(dot(d, normalize(uGd)), 0.0), uGp);
        c += uGl * g * uGa * (0.35 + 0.65 * (1.0 - smoothstep(0.0, 0.5, y)));
        c = mix(c, uG, smoothstep(0.0, -0.06, y));
        gl_FragColor = vec4(c, 1.0);
        #include <colorspace_fragment>
      }`,
  }), []);
  const geo = useMemo(() => new THREE.SphereGeometry(1, 48, 24), []);
  const u = mat.uniforms;
  u.uZ.value.set(zenith); u.uM.value.set(mid); u.uH.value.set(horizon); u.uG.value.set(ground); u.uGl.value.set(glow);
  u.uGd.value.set(...glowDir); u.uGp.value = glowPow; u.uGa.value = glowAmt; u.uHy.value = horizonY;
  return <mesh geometry={geo} material={mat} position={at} scale={radius} renderOrder={-10} frustumCulled={false} />;
};

/** colour lerp through stops (t in 0..1 spread evenly over the stops) */
const _c1 = new THREE.Color(), _c2 = new THREE.Color();
export function ramp(stops: string[], t: number) {
  const x = Math.min(0.99999, Math.max(0, t)) * (stops.length - 1), i = Math.floor(x);
  _c1.set(stops[i]); _c2.set(stops[Math.min(stops.length - 1, i + 1)]);
  return '#' + _c1.lerp(_c2, x - i).getHexString();
}
/** colour lerp through positioned stops [[t, hex], ...] (t ascending) */
export function rampAt(stops: [number, string][], t: number) {
  if (t <= stops[0][0]) return stops[0][1];
  for (let i = 0; i < stops.length - 1; i++) if (t <= stops[i + 1][0]) return mixHex(stops[i][1], stops[i + 1][1], (t - stops[i][0]) / (stops[i + 1][0] - stops[i][0] || 1));
  return stops[stops.length - 1][1];
}
export const mixHex = (a: string, b: string, t: number) => '#' + _c1.set(a).lerp(_c2.set(b), Math.min(1, Math.max(0, t))).getHexString();

/** merge non-indexed or indexed geometries (position + normal (+ uv when all have it)) into one non-indexed geometry */
export function mergeFlat(list: THREE.BufferGeometry[]) {
  const src = list.map((g) => (g.index ? g.toNonIndexed() : g));
  src.forEach((g) => { if (!g.attributes.normal) g.computeVertexNormals(); });
  const names = ['position', 'normal', ...(src.every((g) => g.attributes.uv) ? ['uv'] : []), ...(src.every((g) => g.attributes.color) ? ['color'] : [])];
  const out = new THREE.BufferGeometry();
  names.forEach((nm) => {
    const size = src[0].attributes[nm].itemSize;
    let n = 0; src.forEach((g) => { n += g.attributes[nm].count; });
    const arr = new Float32Array(n * size);
    let o = 0; src.forEach((g) => { arr.set(g.attributes[nm].array as Float32Array, o); o += g.attributes[nm].count * size; });
    out.setAttribute(nm, new THREE.BufferAttribute(arr, size));
  });
  return out;
}

/** paint a whole geometry one vertex colour (for merged multi-colour low-poly props) */
export function tint(g: THREE.BufferGeometry, hex: string) {
  const h = g.index ? g.toNonIndexed() : g;
  const c = new THREE.Color(hex), n = h.attributes.position.count, a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b; }
  h.setAttribute('color', new THREE.BufferAttribute(a, 3));
  if (!h.attributes.normal) h.computeVertexNormals();
  return h;
}
