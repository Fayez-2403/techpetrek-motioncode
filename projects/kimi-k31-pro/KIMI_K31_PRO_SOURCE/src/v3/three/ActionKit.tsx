// Shared kit for the V3 action shots (racing, zombie survival, rooftop parkour): a procedural sky dome and an
// environment map rendered from the same sky (so paint and glass reflect the shot's own sunset), soft sprite textures,
// additive glows, volumetric light cones, a world-space window shader for instanced buildings, a 2D lens flare and a
// directional "whip" blur. Everything is a pure function of its props; textures are generated from seeded noise.
import React, { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { mulberry32 } from '../../lib/rng';

export type P3 = [number, number, number];
export const TAU = Math.PI * 2;

// ================================================================================================ textures
const texCache = new Map<string, THREE.Texture>();

function canvasTex(key: string, size: number, draw: (ctx: CanvasRenderingContext2D, img: ImageData | null) => ImageData | void, srgb = true) {
  const hit = texCache.get(key);
  if (hit) return hit;
  const cv = document.createElement('canvas');
  cv.width = size; cv.height = size;
  const ctx = cv.getContext('2d')!;
  const out = draw(ctx, ctx.createImageData(size, size));
  if (out) ctx.putImageData(out, 0, 0);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.needsUpdate = true;
  texCache.set(key, t);
  return t;
}

/** soft round falloff (white), for glows and sprites */
export function glowTex() {
  return canvasTex('glow', 128, (ctx) => {
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.18, 'rgba(255,255,255,0.55)');
    g.addColorStop(0.45, 'rgba(255,255,255,0.16)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128);
  });
}

/** smooth value noise on a periodic grid (for the puff texture) */
function periodicNoise(rnd: () => number, n: number) {
  const g = Array.from({ length: n * n }, () => rnd());
  return (x: number, y: number) => {
    const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi;
    const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    const at = (i: number, j: number) => g[(((j % n) + n) % n) * n + (((i % n) + n) % n)];
    return (at(xi, yi) * (1 - u) + at(xi + 1, yi) * u) * (1 - v) + (at(xi, yi + 1) * (1 - u) + at(xi + 1, yi + 1) * u) * v;
  };
}

/** a soft, lumpy smoke puff (white with alpha) */
export function puffTex(seed = 5) {
  return canvasTex(`puff${seed}`, 128, (_ctx, img) => {
    const rnd = mulberry32(seed), nA = periodicNoise(rnd, 8), nB = periodicNoise(rnd, 16);
    for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) {
      const dx = (x - 63.5) / 64, dy = (y - 63.5) / 64, r = Math.sqrt(dx * dx + dy * dy);
      const n = 0.6 * nA(x / 16, y / 16) + 0.4 * nB(x / 8, y / 8);
      const fall = Math.max(0, 1 - r) ** 1.4;
      const a = Math.max(0, Math.min(1, fall * (0.55 + 0.9 * n) - 0.08));
      const i = (y * 128 + x) * 4;
      img!.data[i] = img!.data[i + 1] = img!.data[i + 2] = 255;
      img!.data[i + 3] = Math.round(a * 255);
    }
    return img!;
  });
}

/** a horizontal streak (bright core along x, fading at both ends) for speed lines and sparks */
export function streakTex() {
  return canvasTex('streak', 128, (ctx) => {
    for (let x = 0; x < 128; x++) {
      const u = x / 127, a = Math.sin(Math.PI * u) ** 0.8 * (0.25 + 0.75 * u);
      const g = ctx.createLinearGradient(0, 0, 0, 128);
      g.addColorStop(0, 'rgba(255,255,255,0)');
      g.addColorStop(0.5, `rgba(255,255,255,${a})`);
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g; ctx.fillRect(x, 0, 1, 128);
    }
  });
}

// ================================================================================================ sky
export interface SkyLook {
  sunDir: P3;            // unit vector toward the sun
  zenith: string; horizon: string; glow: string; ground: string;
  sun?: string; sunPower?: number; sunSize?: number; glowPow?: number;
  cloud?: number; cloudScale?: number; cloudLit?: string; cloudDark?: string; cloudSeed?: number; drift?: number;
  stars?: number;
}

const skyVert = /* glsl */ `
varying vec3 vDir;
void main() { vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

const skyFrag = /* glsl */ `
uniform vec3 uSunDir, uZenith, uHorizon, uGlow, uGround, uSun, uCloudLit, uCloudDark;
uniform float uSunSize, uGlowPow, uCloud, uCloudScale, uSeed, uDrift, uStars;
varying vec3 vDir;
float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vnoise(vec2 p) { vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y); }
float fbm(vec2 p) { float a = 0.5, s = 0.0; for (int i = 0; i < 5; i++) { s += a * vnoise(p); p = p * 2.03 + 17.1; a *= 0.5; } return s; }
void main() {
  vec3 d = normalize(vDir);
  float el = d.y, e = clamp(el, 0.0, 1.0);
  float sd = dot(d, uSunDir), sp = max(sd, 0.0);
  vec3 col = mix(uHorizon, uZenith, pow(e, 0.42));
  col = mix(col, uGlow, pow(sp, uGlowPow) * (1.0 - smoothstep(0.0, 0.55, e)));
  col += uGlow * pow(sp, 60.0) * 0.9;
  if (uStars > 0.0 && el > 0.05) {
    vec2 sg = d.xz / (el + 0.3) * 260.0;
    float s = hash(floor(sg));
    col += vec3(0.8, 0.85, 1.0) * step(0.9975, s) * uStars * smoothstep(0.05, 0.3, el);
  }
  if (uCloud > 0.0 && el > -0.02) {
    vec2 uv = d.xz / (max(el, 0.0) + 0.1) * uCloudScale;
    uv.x += uDrift;
    float n = fbm(uv * vec2(0.55, 2.4) + uSeed);
    float m = smoothstep(0.52, 0.78, n) * uCloud * smoothstep(-0.01, 0.06, el) * (1.0 - smoothstep(0.3, 0.75, el));
    float lit = clamp(pow(sp, 4.0) * 1.2 + 0.35 * (n - 0.5) + 0.15, 0.0, 1.0);
    vec3 cc = mix(uCloudDark, uCloudLit, lit);
    col = mix(col, cc, m);
  }
  float disc = smoothstep(cos(uSunSize), cos(uSunSize * 0.82), sd);
  col += uSun * disc;
  col = mix(col, uGround, smoothstep(0.0, -0.05, el));
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

const col3 = (c: string, k = 1) => new THREE.Color(c).multiplyScalar(k);

export function makeSkyMaterial(look: SkyLook) {
  return new THREE.ShaderMaterial({
    vertexShader: skyVert, fragmentShader: skyFrag, side: THREE.BackSide, depthWrite: false, depthTest: false, fog: false,
    uniforms: {
      uSunDir: { value: new THREE.Vector3(...look.sunDir).normalize() },
      uZenith: { value: col3(look.zenith) }, uHorizon: { value: col3(look.horizon) }, uGlow: { value: col3(look.glow) },
      uGround: { value: col3(look.ground) }, uSun: { value: col3(look.sun ?? '#fff3d6', look.sunPower ?? 6) },
      uCloudLit: { value: col3(look.cloudLit ?? '#ffd2a6') }, uCloudDark: { value: col3(look.cloudDark ?? '#5a4a6e') },
      uSunSize: { value: look.sunSize ?? 0.03 }, uGlowPow: { value: look.glowPow ?? 4 }, uCloud: { value: look.cloud ?? 0 },
      uCloudScale: { value: look.cloudScale ?? 1.2 }, uSeed: { value: look.cloudSeed ?? 3 }, uDrift: { value: look.drift ?? 0 },
      uStars: { value: look.stars ?? 0 },
    },
  });
}

/** the sky, drawn first, centred on the camera so it never parallaxes */
export const SkyDome: React.FC<{ look: SkyLook; at: P3; drift?: number }> = ({ look, at, drift = 0 }) => {
  const mat = useMemo(() => makeSkyMaterial(look), [look]);
  mat.uniforms.uDrift.value = (look.drift ?? 0) + drift;
  return (
    <mesh position={at} renderOrder={-1000} frustumCulled={false} material={mat}>
      <sphereGeometry args={[1500, 48, 24]} />
    </mesh>
  );
};

/** environment reflections rendered from the same sky (plus an optional dark ground), set on the scene */
export const SkyEnv: React.FC<{ look: SkyLook; intensity?: number; extra?: (s: THREE.Scene) => void }> = ({ look, intensity = 1, extra }) => {
  const { gl, scene } = useThree();
  const tex = useMemo(() => {
    const s = new THREE.Scene();
    const m = makeSkyMaterial(look);
    m.depthTest = true;
    s.add(new THREE.Mesh(new THREE.SphereGeometry(100, 64, 32), m));
    extra?.(s);
    const pm = new THREE.PMREMGenerator(gl);
    const t = pm.fromScene(s, 0.0, 0.1, 1000).texture;
    pm.dispose();
    return t;
  }, [gl, look, extra]);
  useLayoutEffect(() => {
    scene.environment = tex;
    scene.environmentIntensity = intensity;
    return () => { scene.environment = null; };
  }, [scene, tex, intensity]);
  return null;
};

// ================================================================================================ glow + cones
/** additive glow sprite (no fog; pass `opacity` already attenuated if it sits deep in fog) */
export const Glow: React.FC<{ pos: P3; size: number; color: string; opacity?: number; stretch?: [number, number]; rot?: number }> = ({ pos, size, color, opacity = 1, stretch = [1, 1], rot = 0 }) => {
  if (opacity <= 0.003) return null;
  return (
    <sprite position={pos} scale={[size * stretch[0], size * stretch[1], 1]} renderOrder={20}>
      <spriteMaterial map={glowTex()} color={color} transparent opacity={opacity} blending={THREE.AdditiveBlending} depthWrite={false} fog={false} toneMapped={false} rotation={rot} />
    </sprite>
  );
};

const coneVert = /* glsl */ `
varying vec3 vL; varying vec3 vN; varying vec3 vV; varying vec3 vW;
void main() {
  vL = position;
  vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz;
  vN = normalize(mat3(modelMatrix) * normal);
  vV = normalize(cameraPosition - w.xyz);
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
const coneFrag = /* glsl */ `
uniform vec3 uColor; uniform float uLen, uI, uPow, uDust, uT, uFloor;
varying vec3 vL; varying vec3 vN; varying vec3 vV; varying vec3 vW;
float hash3(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float n3(vec3 x) { vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash3(i), hash3(i + vec3(1,0,0)), f.x), mix(hash3(i + vec3(0,1,0)), hash3(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(hash3(i + vec3(0,0,1)), hash3(i + vec3(1,0,1)), f.x), mix(hash3(i + vec3(0,1,1)), hash3(i + vec3(1,1,1)), f.x), f.y), f.z); }
void main() {
  float a = clamp(vL.z, 0.0, 1.0);   // the cone geometry is unit length (scaled by the mesh)
  float fall = pow(1.0 - a, uPow) * smoothstep(0.0, 0.04, a);
  float thick = pow(abs(dot(normalize(vN), normalize(vV))), 1.6);
  float dust = mix(1.0, 0.55 + 0.9 * n3(vW * 1.3 + vec3(0.0, -uT * 0.35, uT * 0.2)), uDust);
  float below = smoothstep(uFloor - 0.05, uFloor + 0.35, vW.y);
  float v = fall * thick * dust * uI * below;
  gl_FragColor = vec4(uColor * v, 1.0);
}`;

/** a volumetric light cone from `from` toward `to` (tip at `from`), additive, with drifting dust; floor = ground y */
export const LightCone: React.FC<{ from: P3; to: P3; radius: number; color: string; intensity: number; t?: number; pow?: number; dust?: number; floor?: number; layers?: number }> = ({ from, to, radius, color, intensity, t = 0, pow = 1.4, dust = 0.6, floor = -1e3, layers = 1 }) => {
  const dir = new THREE.Vector3(to[0] - from[0], to[1] - from[1], to[2] - from[2]);
  const len = dir.length();
  const geo = useMemo(() => {
    const g = new THREE.ConeGeometry(1, 1, 40, 12, true);
    g.translate(0, -0.5, 0); g.rotateX(-Math.PI / 2);
    return g;
  }, []);
  const mat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: coneVert, fragmentShader: coneFrag, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { uColor: { value: new THREE.Color() }, uLen: { value: 1 }, uI: { value: 1 }, uPow: { value: 1.4 }, uDust: { value: 0.6 }, uT: { value: 0 }, uFloor: { value: -1e3 } },
  }), []);
  if (intensity <= 0.002 || len < 1e-3) return null;
  mat.uniforms.uColor.value.set(color);
  mat.uniforms.uLen.value = len; mat.uniforms.uI.value = intensity / layers; mat.uniforms.uPow.value = pow;
  mat.uniforms.uDust.value = dust; mat.uniforms.uT.value = t; mat.uniforms.uFloor.value = floor;
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir.clone().normalize());
  // nested cones soften the outer edge (a single cone seen from behind its apex shows a hard rim)
  return <>{Array.from({ length: layers }, (_, i) => { const k = layers === 1 ? 1 : 0.3 + (0.7 * i) / (layers - 1); return <mesh key={i} geometry={geo} material={mat} position={from} quaternion={q} scale={[radius * k, radius * k, len]} renderOrder={30} frustumCulled={false} />; })}</>;
};

// ================================================================================================ buildings
export interface WindowOpts {
  glass: string; lit: string; litFrac: number; litPower?: number;
  floorH?: number; winW?: number; sill?: number; frame?: string;
  glassRough?: number; glassMetal?: number; seed?: number; bandEvery?: number; roofLip?: number; ground?: number; shopFrac?: number;
}

/** MeshStandardMaterial with world-space windows on vertical faces (works with InstancedMesh + instance colours) */
export function windowMaterial(base: THREE.MeshStandardMaterialParameters, o: WindowOpts) {
  const m = new THREE.MeshStandardMaterial(base);
  const u = {
    uGlass: { value: new THREE.Color(o.glass) }, uLit: { value: new THREE.Color(o.lit).multiplyScalar(o.litPower ?? 1.6) },
    uLitFrac: { value: o.litFrac }, uFloorH: { value: o.floorH ?? 3.4 }, uWinW: { value: o.winW ?? 2.6 }, uSill: { value: o.sill ?? 0.32 },
    uGR: { value: o.glassRough ?? 0.16 }, uGM: { value: o.glassMetal ?? 0.65 }, uSeed: { value: o.seed ?? 1 }, uGround: { value: o.ground ?? 0 }, uShop: { value: o.shopFrac ?? 0.55 },
  };
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, u);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWP; varying vec3 vWN;')
      .replace('#include <project_vertex>', `#include <project_vertex>
        vec4 _wp = vec4(transformed, 1.0);
        vec3 _wn = objectNormal;
        #ifdef USE_INSTANCING
          _wp = instanceMatrix * _wp; _wn = mat3(instanceMatrix) * _wn;
        #endif
        vWP = (modelMatrix * _wp).xyz; vWN = normalize(mat3(modelMatrix) * _wn);`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
        varying vec3 vWP; varying vec3 vWN;
        uniform vec3 uGlass, uLit; uniform float uLitFrac, uFloorH, uWinW, uSill, uGR, uGM, uSeed, uGround, uShop;
        float wHash(vec2 p) { p = fract(p * vec2(0.1031, 0.1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y) * p.x); }
        float gWin = 0.0; float gLit = 0.0;`)
      .replace('#include <color_fragment>', `#include <color_fragment>
        {
          float vert = smoothstep(0.6, 0.85, 1.0 - abs(vWN.y));
          float hy = vWP.y - uGround;
          vec2 q = abs(vWN.x) > abs(vWN.z) ? vec2(vWP.z, hy) : vec2(vWP.x, hy);
          vec2 cell = q / vec2(uWinW, uFloorH);
          vec2 id = floor(cell), fr = fract(cell);
          vec2 fw = fwidth(cell);
          float aa = max(fw.x, fw.y);
          vec2 edge = vec2(0.14, uSill);
          vec2 lo = smoothstep(edge - fw, edge + fw, fr);
          vec2 hi = 1.0 - smoothstep(vec2(0.86, 0.9) - fw, vec2(0.86, 0.9) + fw, fr);
          float w = lo.x * lo.y * hi.x * hi.y;
          w = mix(w, 0.42, smoothstep(0.25, 0.6, aa));
          float h = wHash(id + floor(vWP.xz / 37.0) * 13.0 + uSeed);
          gLit = step(1.0 - uLitFrac, h) * (0.55 + 0.45 * fract(h * 7.31));
          // ground floor: wide shopfronts, half of them lit warm
          float shop = 1.0 - step(uFloorH * 1.15, hy);
          float sx = fract(q.x / (uWinW * 2.6));
          float sw = smoothstep(0.06, 0.08, sx) * (1.0 - smoothstep(0.92, 0.94, sx)) * smoothstep(0.25, 0.45, hy) * (1.0 - smoothstep(uFloorH * 0.86, uFloorH * 0.9, hy));
          float shopLit = step(1.0 - uShop, wHash(vec2(floor(q.x / (uWinW * 2.6)), 7.0) + uSeed));
          gWin = mix(w * step(uFloorH * 1.15, hy), sw, shop) * vert;
          gLit = mix(gLit, shopLit * 1.4, shop);
          // a band between floors every few storeys
          float band = (1.0 - smoothstep(0.0, 0.06, fract(hy / (uFloorH * 4.0)))) * vert * (1.0 - shop);
          diffuseColor.rgb = mix(diffuseColor.rgb, uGlass, gWin);
          diffuseColor.rgb *= 1.0 - 0.35 * band;
          // street level sits in shade; mullions split the panes
          diffuseColor.rgb *= mix(0.55, 1.0, smoothstep(0.0, 22.0, hy));
          float mull = (1.0 - smoothstep(0.0, 0.035, abs(fr.x - 0.5))) * gWin * (1.0 - shop);
          diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * 0.4 + 0.02, mull);
          gLit *= 1.0 - mull;
        }`)
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = mix(roughnessFactor, uGR, gWin);')
      .replace('#include <metalnessmap_fragment>', '#include <metalnessmap_fragment>\nmetalnessFactor = mix(metalnessFactor, uGM, gWin);')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += uLit * gWin * gLit;');
  };
  m.customProgramCacheKey = () => `win-${o.seed ?? 1}-${o.litFrac}-${o.ground ?? 0}-${o.shopFrac ?? 0.55}`;
  return m;
}

/** one InstancedMesh of boxes (unit cube scaled per instance), base at y = 0 of each box */
export interface Box { p: P3; s: P3; rotY?: number; color?: string }
export const BoxField: React.FC<{ boxes: Box[]; material: THREE.Material; geometry?: THREE.BufferGeometry }> = ({ boxes, material, geometry }) => {
  const mesh = useMemo(() => {
    const g = geometry ?? new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0);
    const im = new THREE.InstancedMesh(g, material, boxes.length);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), c = new THREE.Color();
    boxes.forEach((b, i) => {
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), b.rotY ?? 0);
      m4.compose(new THREE.Vector3(...b.p), q, new THREE.Vector3(...b.s));
      im.setMatrixAt(i, m4);
      im.setColorAt(i, c.set(b.color ?? '#ffffff'));
    });
    im.instanceMatrix.needsUpdate = true;
    if (im.instanceColor) im.instanceColor.needsUpdate = true;
    im.frustumCulled = false;
    return im;
  }, [boxes, material, geometry]);
  return <primitive object={mesh} />;
};

// ================================================================================================ 2D overlays
/** lens flare: glow, anamorphic streak, starburst and ghosts mirrored through the frame centre */
export const LensFlare: React.FC<{ x: number; y: number; w: number; h: number; k: number; warm?: string; cool?: string; size?: number }> = ({ x, y, w, h, k, warm = '255,196,128', cool = '140,200,255', size = 1 }) => {
  if (k <= 0.01) return null;
  const cx = w / 2, cy = h / 2, dx = cx - x, dy = cy - y;
  const ghosts: [number, number, string, number][] = [[0.42, 60, warm, 0.18], [0.78, 26, cool, 0.22], [1.15, 120, '255,150,190', 0.08], [1.42, 44, cool, 0.16], [1.78, 180, warm, 0.06], [2.05, 18, '255,255,255', 0.2]];
  const s = size;
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', mixBlendMode: 'screen', zIndex: 40, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: x - 520 * s, top: y - 520 * s, width: 1040 * s, height: 1040 * s, borderRadius: '50%', opacity: 0.55 * k,
        background: `radial-gradient(circle, rgba(${warm},0.9) 0%, rgba(${warm},0.35) 12%, rgba(${warm},0.1) 35%, rgba(${warm},0) 70%)` }} />
      <div style={{ position: 'absolute', left: x - 1300 * s, top: y - 9 * s, width: 2600 * s, height: 18 * s, opacity: 0.75 * k,
        background: `radial-gradient(50% 50% at 50% 50%, rgba(255,255,255,0.95) 0%, rgba(${cool},0.55) 18%, rgba(${cool},0.12) 55%, rgba(${cool},0) 100%)` }} />
      <svg width={w} height={h} style={{ position: 'absolute', inset: 0, opacity: 0.5 * k }}>
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i / 12) * Math.PI * 2 + 0.2, L = (i % 2 ? 70 : 150) * s;
          return <line key={i} x1={x} y1={y} x2={x + Math.cos(a) * L} y2={y + Math.sin(a) * L} stroke="rgba(255,240,220,0.32)" strokeWidth={1.2} strokeLinecap="round" />;
        })}
      </svg>
      {ghosts.map(([t, r, c, a], i) => (
        <div key={i} style={{ position: 'absolute', left: x + dx * t - r * s, top: y + dy * t - r * s, width: 2 * r * s, height: 2 * r * s, borderRadius: '50%', opacity: a * k,
          background: `radial-gradient(circle, rgba(${c},0.0) 40%, rgba(${c},0.9) 78%, rgba(${c},0) 100%)` }} />
      ))}
    </div>
  );
};

/** wraps a 3D layer in a directional gaussian blur (camera whip); `bx`/`by` in px */
export const WhipBlur: React.FC<{ id: string; bx: number; by?: number; children: React.ReactNode }> = ({ id, bx, by = 0, children }) => {
  const on = bx > 0.4 || by > 0.4;
  return (
    <>
      <svg width={0} height={0} style={{ position: 'absolute' }}>
        <filter id={id} x="-5%" y="-5%" width="110%" height="110%" colorInterpolationFilters="sRGB">
          <feGaussianBlur stdDeviation={`${Math.max(0, bx)} ${Math.max(0, by)}`} edgeMode="duplicate" />
        </filter>
      </svg>
      <div style={{ position: 'absolute', inset: 0, filter: on ? `url(#${id})` : undefined }}>{children}</div>
    </>
  );
};

/** soft vignette + warm/cool grade overlay */
export const Grade: React.FC<{ vignette?: number; tint?: string; tintOpacity?: number; blend?: React.CSSProperties['mixBlendMode'] }> = ({ vignette = 0.5, tint, tintOpacity = 0, blend = 'soft-light' }) => (
  <>
    {tint && tintOpacity > 0 ? <div style={{ position: 'absolute', inset: 0, background: tint, opacity: tintOpacity, mixBlendMode: blend, pointerEvents: 'none', zIndex: 41 }} /> : null}
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 42, background: `radial-gradient(115% 95% at 50% 50%, rgba(0,0,0,0) 52%, rgba(0,0,0,${vignette}) 100%)` }} />
  </>
);

// ================================================================================================ math
export const v3add = (a: P3, b: P3): P3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const v3sub = (a: P3, b: P3): P3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const v3scale = (a: P3, k: number): P3 => [a[0] * k, a[1] * k, a[2] * k];
export const v3lerp = (a: P3, b: P3, t: number): P3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
export const v3len = (a: P3) => Math.hypot(a[0], a[1], a[2]);
export const v3norm = (a: P3): P3 => { const l = v3len(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };

/** ray (origin, unit dir) vs axis-aligned box: true if hit at t > 0 */
export function rayHitsBox(o: P3, d: P3, min: P3, max: P3) {
  let t0 = 0, t1 = 1e9;
  for (let i = 0; i < 3; i++) {
    if (Math.abs(d[i]) < 1e-9) { if (o[i] < min[i] || o[i] > max[i]) return false; continue; }
    let a = (min[i] - o[i]) / d[i], b = (max[i] - o[i]) / d[i];
    if (a > b) [a, b] = [b, a];
    t0 = Math.max(t0, a); t1 = Math.min(t1, b);
    if (t0 > t1) return false;
  }
  return true;
}

// ================================================================================================ particles
/** one particle: world position, size (m), colour (linear rgb, already multiplied by brightness), alpha, spin,
 *  and an optional world velocity: if set the quad is stretched along its projected direction (sparks, streaks) */
export interface Particle { p: P3; size: number; c: [number, number, number]; a: number; rot?: number; v?: P3; stretch?: number }

const partVert = /* glsl */ `
attribute vec4 aP; attribute vec4 aC; attribute vec4 aV; attribute float aR;
varying vec2 vUv; varying vec4 vC; varying float vD;
void main() {
  vUv = uv; vC = aC;
  vec4 mv = viewMatrix * vec4(aP.xyz, 1.0);
  vD = -mv.z;
  vec2 q;
  if (aV.w > 0.0) {
    vec3 vv = (viewMatrix * vec4(aV.xyz, 0.0)).xyz;
    vec4 a = projectionMatrix * mv, b = projectionMatrix * (mv + vec4(vv * 0.03, 0.0));
    vec2 sd = b.xy / max(b.w, 1e-3) - a.xy / max(a.w, 1e-3);
    vec2 dir = length(sd) > 1e-6 ? normalize(sd) : vec2(1.0, 0.0);
    vec2 nrm = vec2(-dir.y, dir.x);
    q = (dir * position.x * aV.w + nrm * position.y) * aP.w;
  } else {
    float c = cos(aR), s = sin(aR);
    q = vec2(position.x * c - position.y * s, position.x * s + position.y * c) * aP.w;
  }
  mv.xy += q;
  gl_Position = projectionMatrix * mv;
}`;
const partFrag = /* glsl */ `
uniform sampler2D uMap; uniform vec3 uFog; uniform float uFogNear, uFogFar, uAdd;
varying vec2 vUv; varying vec4 vC; varying float vD;
void main() {
  vec4 t = texture2D(uMap, vUv);
  float f = smoothstep(uFogNear, uFogFar, vD);
  float a = t.a * vC.a;
  vec3 col = vC.rgb * t.rgb;
  if (uAdd > 0.5) { gl_FragColor = vec4(col * a * (1.0 - f), 1.0); }
  else { gl_FragColor = vec4(mix(col, uFog, f), a); }
}`;

/** a batch of camera-facing particles drawn in one call. `additive` for light, normal blending for smoke. */
export const Particles: React.FC<{ items: Particle[]; max: number; map: THREE.Texture; additive?: boolean; fog?: [string, number, number]; order?: number }> = ({ items, max, map, additive = false, fog, order = 25 }) => {
  const { geo, mat } = useMemo(() => {
    const base = new THREE.PlaneGeometry(1, 1);
    const g = new THREE.InstancedBufferGeometry();
    g.index = base.index; g.setAttribute('position', base.attributes.position); g.setAttribute('uv', base.attributes.uv);
    g.setAttribute('aP', new THREE.InstancedBufferAttribute(new Float32Array(max * 4), 4));
    g.setAttribute('aC', new THREE.InstancedBufferAttribute(new Float32Array(max * 4), 4));
    g.setAttribute('aV', new THREE.InstancedBufferAttribute(new Float32Array(max * 4), 4));
    g.setAttribute('aR', new THREE.InstancedBufferAttribute(new Float32Array(max), 1));
    const m = new THREE.ShaderMaterial({
      vertexShader: partVert, fragmentShader: partFrag, transparent: true, depthWrite: false,
      blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
      uniforms: { uMap: { value: map }, uFog: { value: new THREE.Color('#000') }, uFogNear: { value: 1e5 }, uFogFar: { value: 2e5 }, uAdd: { value: additive ? 1 : 0 } },
    });
    return { geo: g, mat: m };
  }, [max, map, additive]);
  const n = Math.min(items.length, max);
  const P = geo.attributes.aP as THREE.InstancedBufferAttribute, Cc = geo.attributes.aC as THREE.InstancedBufferAttribute;
  const V = geo.attributes.aV as THREE.InstancedBufferAttribute, R = geo.attributes.aR as THREE.InstancedBufferAttribute;
  for (let i = 0; i < n; i++) {
    const it = items[i];
    P.setXYZW(i, it.p[0], it.p[1], it.p[2], it.size);
    Cc.setXYZW(i, it.c[0], it.c[1], it.c[2], it.a);
    if (it.v) V.setXYZW(i, it.v[0], it.v[1], it.v[2], it.stretch ?? 3); else V.setXYZW(i, 0, 0, 0, 0);
    R.setX(i, it.rot ?? 0);
  }
  P.needsUpdate = Cc.needsUpdate = V.needsUpdate = R.needsUpdate = true;
  geo.instanceCount = n;
  if (fog) { mat.uniforms.uFog.value.set(fog[0]); mat.uniforms.uFogNear.value = fog[1]; mat.uniforms.uFogFar.value = fog[2]; }
  if (n === 0) return null;
  return <mesh geometry={geo} material={mat} frustumCulled={false} renderOrder={order} />;
};

/** linear-space rgb of a css colour times k (for particle colours) */
export const rgb = (c: string, k = 1): [number, number, number] => { const x = new THREE.Color(c); return [x.r * k, x.g * k, x.b * k]; };

// ================================================================================================ shadows
/** enables the shadow map once from inside the canvas (ThreeStage is shared and does not turn shadows on) */
export const ShadowSetup: React.FC = () => {
  const { gl, scene } = useThree();
  useLayoutEffect(() => {
    gl.shadowMap.enabled = true; gl.shadowMap.type = THREE.PCFSoftShadowMap; gl.shadowMap.needsUpdate = true;
    scene.traverse((o) => { const m = (o as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined; if (Array.isArray(m)) m.forEach((x) => { x.needsUpdate = true; }); else if (m) m.needsUpdate = true; });
  }, [gl, scene]);
  return null;
};
/** sets cast/receive shadow on every mesh under it, every render (cheap; keeps conditional children covered) */
export const Shadows: React.FC<{ cast?: boolean; receive?: boolean; children: React.ReactNode }> = ({ cast = true, receive = true, children }) => {
  const ref = useRef<THREE.Group>(null);
  useLayoutEffect(() => { ref.current?.traverse((o) => { if ((o as THREE.Mesh).isMesh) { o.castShadow = cast; o.receiveShadow = receive; } }); });
  return <group ref={ref}>{children}</group>;
};
