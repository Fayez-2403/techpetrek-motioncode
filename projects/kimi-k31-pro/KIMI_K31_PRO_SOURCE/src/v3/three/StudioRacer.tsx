// A procedural hover-racer that is "modelled" on the beat in the V3 studio viewport (v3studio). The body starts as the
// default cube, rounds with each subdivision level (Catmull-Clark limit ≈ superellipsoid), is sculpted into a fuselage,
// then pods (mirrored), canopy and fin are added. Two looks: clay (matcap, wire overlay, orange selection hull) and
// rendered (clear-coated two-tone paint, glass, glowing thrusters). Original design. Pure function of its props.
import React, { useMemo } from 'react';
import * as THREE from 'three';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

type V = THREE.Vector3;
const sm = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const gauss = (x: number, c: number, w: number) => Math.exp(-(((x - c) / w) ** 2));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// ============================================================================================ textures + materials
const canvasTex = (w: number, h: number, draw: (x: CanvasRenderingContext2D) => void, srgb = true) => {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d')!);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
};
/** studio clay matcap (soft key top-left, cool rim) */
export const makeMatcap = () => canvasTex(256, 256, (x) => {
  const g = x.createRadialGradient(92, 78, 6, 128, 128, 150);
  g.addColorStop(0, '#F4F4F2'); g.addColorStop(0.3, '#C3C4C6'); g.addColorStop(0.68, '#7B7E84'); g.addColorStop(1, '#2C2E33');
  x.fillStyle = g; x.fillRect(0, 0, 256, 256);
  const r = x.createRadialGradient(128, 128, 96, 128, 128, 128);
  r.addColorStop(0, 'rgba(210,220,235,0)'); r.addColorStop(1, 'rgba(210,220,235,0.4)');
  x.fillStyle = r; x.fillRect(0, 0, 256, 256);
});
/** soft round glow for additive sprites */
export const makeGlow = () => canvasTex(128, 128, (x) => {
  const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.18, 'rgba(255,255,255,0.55)'); g.addColorStop(0.5, 'rgba(255,255,255,0.12)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 128, 128);
});

/** inverted-hull selection outline (constant-ish pixel width) */
export const outlineMat = (color: string, width = 0.0024) => new THREE.ShaderMaterial({
  uniforms: { uColor: { value: new THREE.Color(color) }, uOpacity: { value: 1 }, uWidth: { value: width } },
  vertexShader: 'uniform float uWidth; void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); vec3 n = normalize(normalMatrix * normal); mv.xyz += n * uWidth * -mv.z; gl_Position = projectionMatrix * mv; }',
  fragmentShader: 'uniform vec3 uColor; uniform float uOpacity; void main(){ gl_FragColor = vec4(uColor, uOpacity); }',
  side: THREE.BackSide, transparent: true, depthWrite: false,
});

// ============================================================================================ parametric surfaces
interface PGeo { geo: THREE.BufferGeometry; wire: THREE.BufferGeometry }
/** grid surface fn(u,v) with outward winding, plus a quad wire (every `wu`-th column / `wv`-th row) */
export function paramSurface(nu: number, nv: number, fn: (u: number, v: number, o: V) => void, closeU = false, wu = 2, wv = 2): PGeo {
  const cols = closeU ? nu : nu + 1, o = new THREE.Vector3();
  const pos = new Float32Array(cols * (nv + 1) * 3);
  for (let j = 0; j <= nv; j++) for (let i = 0; i < cols; i++) { fn(i / nu, j / nv, o); pos.set([o.x, o.y, o.z], (j * cols + i) * 3); }
  const idx: number[] = [];
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
    const i1 = closeU ? (i + 1) % nu : i + 1;
    const a = j * cols + i, b = j * cols + i1, c = (j + 1) * cols + i, d = (j + 1) * cols + i1;
    idx.push(a, c, b, b, c, d);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setIndex(idx); geo.computeVertexNormals();
  // make the winding point outwards (normals away from the centroid on average)
  const cen = new THREE.Vector3(); for (let k = 0; k < pos.length; k += 3) cen.add(o.set(pos[k], pos[k + 1], pos[k + 2]));
  cen.multiplyScalar(3 / pos.length);
  let dot = 0; const nrm = geo.attributes.normal;
  for (let k = 0; k < nrm.count; k++) dot += nrm.getX(k) * (pos[k * 3] - cen.x) + nrm.getY(k) * (pos[k * 3 + 1] - cen.y) + nrm.getZ(k) * (pos[k * 3 + 2] - cen.z);
  if (dot < 0) { for (let k = 0; k < idx.length; k += 3) { const t = idx[k + 1]; idx[k + 1] = idx[k + 2]; idx[k + 2] = t; } geo.setIndex(idx); geo.computeVertexNormals(); }
  const lp: number[] = [], P = (i: number, j: number) => { const k = (j * cols + (closeU ? i % nu : i)) * 3; return [pos[k], pos[k + 1], pos[k + 2]]; };
  for (let j = 0; j <= nv; j += wv) for (let i = 0; i < nu; i++) lp.push(...P(i, j), ...P(i + 1, j));
  for (let i = 0; i < (closeU ? nu : nu + 1); i += wu) for (let j = 0; j < nv; j++) lp.push(...P(i, j), ...P(i, j + 1));
  const wire = new THREE.BufferGeometry(); wire.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3));
  return { geo, wire };
}
/** lathe around the X axis from (x, r) profile points (linearly resampled) */
export function latheX(profile: [number, number][], seg = 40, wu = 4, wv = 1): PGeo {
  const n = profile.length - 1;
  return paramSurface(seg, n, (u, v, o) => {
    const [x, r] = profile[Math.round(v * n)], a = u * Math.PI * 2;
    o.set(x, r * Math.cos(a), r * Math.sin(a));
  }, true, wu, wv);
}

// ============================================================================================ body shape
const N = 30;
const LEVELS = [{ n: 0, s: 0.92 }, { n: 4.4, s: 0.86 }, { n: 2.75, s: 0.82 }, { n: 2.3, s: 0.8 }];
const A = new THREE.Vector3(), B = new THREE.Vector3(), D = new THREE.Vector3();
function levelPos(p: V, i: number, o: V) {
  const L = LEVELS[i];
  if (!L.n) return o.copy(p).multiplyScalar(L.s);
  const s = (Math.abs(p.x) ** L.n + Math.abs(p.y) ** L.n + Math.abs(p.z) ** L.n) ** (1 / L.n);
  return o.copy(p).multiplyScalar(L.s / s);
}
function rounded(p: V, level: number, o: V) {
  const i = Math.min(2, Math.max(0, Math.floor(level))), t = Math.min(1, level - i);
  levelPos(p, i, A); levelPos(p, i + 1, B);
  return o.lerpVectors(A, B, t);
}
/** fuselage coordinates of a cube point: u along the length (+1 nose), cy/cz on the section (superellipse) */
function fuseParams(p: V) {
  D.copy(p).normalize();
  const u = D.x, rho = Math.sqrt(Math.max(0, 1 - u * u));
  const ca = rho > 1e-5 ? D.z / rho : 0, sa = rho > 1e-5 ? D.y / rho : 0, m = 2.9;
  const cz = Math.sign(ca) * Math.abs(ca) ** (2 / m), cy = Math.sign(sa) * Math.abs(sa) ** (2 / m);
  return { u, rho, cy, cz };
}
function fuselage(p: V, o: V) {
  const { u, rho, cy, cz } = fuseParams(p);
  const env = rho ** (u > 0 ? 0.78 : 0.3);
  const W = 0.76 * env * (1 - 0.34 * sm(0.15, 1, u)) * (1 + 0.05 * gauss(u, -0.35, 0.3));
  const Ht = 0.42 * env * (1 + 0.32 * gauss(u, 0.12, 0.42)) * (1 - 0.18 * sm(0.3, 1, u));
  const Hb = 0.27 * env;
  let y = cy > 0 ? Ht * cy : Hb * cy;
  y += -0.13 * sm(0.3, 1, u) * (1 - 0.3 * cy) + 0.07 * sm(-0.3, -1, u);
  let z = W * cz;
  z *= 1 - 0.1 * gauss(u, 0.05, 0.3) * gauss(cy, 0.0, 0.35);          // side scallop
  const x = 2.3 * u * (u < 0 ? 0.96 : 1);
  return o.set(x, y, z);
}
function bodyPos(p: V, sub: number, sculpt: number, o: V) {
  rounded(p, sub, o);
  if (sculpt <= 0) return o;
  const ox = o.x, oy = o.y, oz = o.z;
  fuselage(p, o);
  return o.set(lerp(ox, o.x, sculpt), lerp(oy, o.y, sculpt), lerp(oz, o.z, sculpt));
}

const PEARL = new THREE.Color('#EEEBE4'), GRAPHITE = new THREE.Color('#23262D'), ACCENT = new THREE.Color('#FF4B2B');
export const ACC = '#FF4B2B', GLOW = '#6FE7FF';

interface BodyGeo { geo: THREE.BufferGeometry; base: Float32Array; wire: THREE.BufferGeometry; wireMax: number }
function buildBody(): BodyGeo {
  let g: THREE.BufferGeometry = new THREE.BoxGeometry(2, 2, 2, N, N, N);
  g.deleteAttribute('normal'); g.deleteAttribute('uv');
  g = mergeVertices(g, 1e-4);
  const base = (g.attributes.position.array as Float32Array).slice();
  const col = new Float32Array(base.length), p = new THREE.Vector3(), c = new THREE.Color();
  for (let i = 0; i < base.length; i += 3) {
    p.set(base[i], base[i + 1], base[i + 2]);
    const { u, cy, cz } = fuseParams(p);
    const lower = sm(-0.02, -0.22, cy);
    const stripe = sm(0.17, 0.11, Math.abs(cz)) * sm(0.25, 0.5, cy) * sm(-0.92, -0.75, u);
    const nose = sm(0.82, 0.95, u) * (1 - lower);
    c.copy(PEARL).lerp(ACCENT, Math.max(stripe, nose)).lerp(GRAPHITE, lower);
    col.set([c.r, c.g, c.b], i);
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.computeVertexNormals();
  const wireMax = 6 * 2 * 9 * WS * 2;
  const wire = new THREE.BufferGeometry();
  wire.setAttribute('position', new THREE.BufferAttribute(new Float32Array(wireMax * 3), 3));
  return { geo: g, base, wire, wireMax };
}
const WS = 24;
const FACES: [number, number][] = [[0, 1], [0, -1], [1, 1], [1, -1], [2, 1], [2, -1]];
function updateBody(b: BodyGeo, sub: number, sculpt: number, density: number) {
  const pos = b.geo.attributes.position.array as Float32Array, p = new THREE.Vector3(), o = new THREE.Vector3();
  for (let i = 0; i < pos.length; i += 3) {
    p.set(b.base[i], b.base[i + 1], b.base[i + 2]);
    bodyPos(p, sub, sculpt, o);
    pos[i] = o.x; pos[i + 1] = o.y; pos[i + 2] = o.z;
  }
  b.geo.attributes.position.needsUpdate = true;
  b.geo.computeVertexNormals();
  // quad cage wire: `density` lines per cube face, mapped through the same shape, pushed out a hair
  const w = b.wire.attributes.position.array as Float32Array;
  let k = 0;
  const put = (q: V) => { bodyPos(q, sub, sculpt, o); const l = o.length() || 1; o.multiplyScalar(1 + 0.006 / l); w[k++] = o.x; w[k++] = o.y; w[k++] = o.z; };
  const q = new THREE.Vector3(), set = (ax: number, sg: number, a: number, c: number) => {
    const arr = [0, 0, 0]; arr[ax] = sg; arr[(ax + 1) % 3] = a; arr[(ax + 2) % 3] = c; return q.set(arr[0], arr[1], arr[2]);
  };
  for (const [ax, sg] of FACES) for (let l = 0; l <= density; l++) {
    const a = -1 + (2 * l) / density;
    for (let s = 0; s < WS; s++) {
      const v0 = -1 + (2 * s) / WS, v1 = -1 + (2 * (s + 1)) / WS;
      put(set(ax, sg, a, v0)); put(set(ax, sg, a, v1));
      put(set(ax, sg, v0, a)); put(set(ax, sg, v1, a));
    }
  }
  b.wire.setDrawRange(0, k / 3);
  b.wire.attributes.position.needsUpdate = true;
}

// ============================================================================================ parts
interface Parts { pod: PGeo; intake: THREE.BufferGeometry; pylon: PGeo; canopy: PGeo; fin: PGeo; nozzle: PGeo; disc: THREE.BufferGeometry }
function buildParts(): Parts {
  const pod = latheX([[-0.98, 0.0], [-0.97, 0.1], [-0.9, 0.17], [-0.7, 0.225], [-0.35, 0.25], [0.1, 0.255], [0.45, 0.24], [0.66, 0.215], [0.76, 0.18], [0.78, 0.15], [0.74, 0.13], [0.72, 0.0]], 40, 4, 1);
  const intake = new THREE.CircleGeometry(0.13, 32).rotateY(Math.PI / 2).translate(0.735, 0, 0);
  // swept airfoil pylon from the body side (v=0) to the pod (v=1)
  const pylon = paramSurface(28, 10, (u, v, o) => {
    const ch = lerp(1.3, 0.8, v), xle = lerp(0.5, 0.3, v), th = 0.09 * (1 - 0.35 * v), a = u * Math.PI * 2;
    const t = (1 - Math.cos(a)) / 2, side = Math.sin(a) >= 0 ? 1 : -1;
    const yy = side * th * 2.6 * (0.2969 * Math.sqrt(t) - 0.126 * t - 0.3516 * t * t + 0.2843 * t ** 3 - 0.1015 * t ** 4);
    o.set(xle - t * ch, yy + lerp(0.0, -0.12, v), lerp(0.34, 1.44, v));
  }, true, 7, 5);
  // canopy: half ellipsoid, pointed toward the nose
  const canopy = paramSurface(36, 12, (u, v, o) => {
    const a = u * Math.PI * 2, th = v * Math.PI * 0.5, s = Math.sin(th);
    let x = Math.cos(a) * s, z = Math.sin(a) * s;
    const y = Math.cos(th);
    x = x > 0 ? x * 1.0 : x * 0.85;
    o.set(0.38 + x * 0.92, 0.27 + y * 0.31, z * 0.36 * (1 - 0.35 * Math.max(0, x)));
  }, true, 4, 3);
  // tail fin: swept plate with a thin airfoil section
  const fin = paramSurface(20, 8, (u, v, o) => {
    const ch = lerp(0.95, 0.34, v), xle = lerp(-1.25, -1.86, v), th = 0.045, a = u * Math.PI * 2;
    const t = (1 - Math.cos(a)) / 2, side = Math.sin(a) >= 0 ? 1 : -1;
    const zz = side * th * 2.4 * (0.2969 * Math.sqrt(t) - 0.126 * t - 0.3516 * t * t + 0.2843 * t ** 3 - 0.1015 * t ** 4);
    o.set(xle - t * ch, 0.18 + v * 0.62, zz);
  }, true, 5, 4);
  const nozzle = latheX([[-1.98, 0.0], [-1.98, 0.17], [-2.18, 0.21], [-2.24, 0.25], [-2.2, 0.27], [-1.95, 0.27]], 40, 4, 1);
  const disc = new THREE.CircleGeometry(0.17, 32).rotateY(-Math.PI / 2).translate(-2.0, 0, 0);
  return { pod, intake, pylon, canopy, fin, nozzle, disc };
}

// ============================================================================================ component
export interface RacerState {
  sub: number; sculpt: number; density: number; wire: number;
  pod: number; mirror: number; canopy: number; fin: number;
  ignite: number; pulse: number;
  sel: { body: number; pod: number; canopy: number; fin: number };
}
export type RacerMode = 'clay' | 'render';

export function useRacerAssets() {
  return useMemo(() => {
    const matcap = makeMatcap(), glow = makeGlow();
    return {
      body: buildBody(), parts: buildParts(), glow,
      clay: new THREE.MeshMatcapMaterial({ matcap, color: '#D9DADD', toneMapped: false, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 }),
      clayDark: new THREE.MeshMatcapMaterial({ matcap, color: '#9EA3AC', toneMapped: false, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 }),
      wire: new THREE.LineBasicMaterial({ color: '#16181C', transparent: true, opacity: 0.6, depthWrite: false }),
      wireSel: new THREE.LineBasicMaterial({ color: '#FFB46A', transparent: true, opacity: 0.75, depthWrite: false }),
      sel: outlineMat('#FF9B3D'), selDim: outlineMat('#D8741E'),
      paint: new THREE.MeshPhysicalMaterial({ vertexColors: true, metalness: 0.25, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 1.15 }),
      dark: new THREE.MeshPhysicalMaterial({ color: '#272B33', metalness: 0.85, roughness: 0.32, clearcoat: 0.6, envMapIntensity: 1 }),
      pearl: new THREE.MeshPhysicalMaterial({ color: '#ECE8E0', metalness: 0.2, roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.06 }),
      accent: new THREE.MeshPhysicalMaterial({ color: ACC, metalness: 0.3, roughness: 0.3, clearcoat: 1 }),
      glass: new THREE.MeshPhysicalMaterial({ color: '#0B1420', metalness: 0.7, roughness: 0.03, clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 1.6 }),
      emit: new THREE.MeshBasicMaterial({ color: GLOW, toneMapped: false, transparent: true }),
      sprite: new THREE.SpriteMaterial({ map: glow, color: GLOW, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, toneMapped: false }),
      mirrorPlane: new THREE.MeshBasicMaterial({ color: '#FF9B3D', transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }),
    };
  }, []);
}
export type RacerAssets = ReturnType<typeof useRacerAssets>;

const Part: React.FC<{ g: PGeo | THREE.BufferGeometry; mode: RacerMode; R: RacerAssets; mat: THREE.Material; wire: number; sel: number; dim?: boolean; reflect?: boolean }> = ({ g, mode, R, mat, wire, sel, dim, reflect }) => {
  const geo = g instanceof THREE.BufferGeometry ? g : g.geo, wg = g instanceof THREE.BufferGeometry ? null : g.wire;
  return (
    <>
      <mesh geometry={geo} material={mode === 'clay' ? (dim ? R.clayDark : R.clay) : mat} />
      {mode === 'clay' && wire > 0.01 && wg && <lineSegments geometry={wg} material={sel > 0.5 ? R.wireSel : R.wire} />}
      {!reflect && sel > 0.01 && <mesh geometry={geo} material={sel > 0.99 ? R.sel : R.selDim} />}
    </>
  );
};

/** the racer at the origin (body centred, nose +X). `reflect` drops overlays for the mirrored floor copy. */
export const Racer: React.FC<{ s: RacerState; mode: RacerMode; R: RacerAssets; reflect?: boolean }> = ({ s, mode, R, reflect }) => {
  if (!reflect) updateBody(R.body, s.sub, s.sculpt, s.density);
  R.wire.opacity = 0.55 * s.wire; R.wireSel.opacity = 0.8 * s.wire;
  const P = R.parts, glowK = s.ignite * (0.75 + 0.45 * s.pulse);
  R.emit.opacity = mode === 'render' ? Math.max(0.15, s.ignite) : 0;
  R.sprite.opacity = glowK;
  R.mirrorPlane.opacity = 0.22 * Math.sin(Math.PI * Math.min(1, Math.max(0, s.mirror)));
  const podScale = Math.max(0.0001, s.pod);
  const pod = (mirror: boolean) => (
    <group scale={[podScale, podScale, podScale * (mirror ? lerp(1, -1, s.mirror) : 1)]}>
      <group position={[-0.28, -0.1, 1.44]} scale={[1.12, 1.12, 1.12]}>
        <Part g={P.pod} mode={mode} R={R} mat={R.dark} wire={s.wire} sel={s.sel.pod} dim reflect={reflect} />
        {mode === 'render' && <mesh geometry={P.intake} material={R.emit} />}
        {mode === 'render' && <sprite material={R.sprite} position={[-1.05, 0, 0]} scale={[0.9 * glowK + 0.01, 0.9 * glowK + 0.01, 1]} />}
      </group>
      <Part g={P.pylon} mode={mode} R={R} mat={R.pearl} wire={s.wire} sel={s.sel.pod} reflect={reflect} />
    </group>
  );
  return (
    <group>
      <mesh geometry={R.body.geo} material={mode === 'clay' ? R.clay : R.paint} frustumCulled={false} />
      {mode === 'clay' && s.wire > 0.01 && <lineSegments geometry={R.body.wire} material={s.sel.body > 0.5 ? R.wireSel : R.wire} frustumCulled={false} />}
      {!reflect && s.sel.body > 0.01 && <mesh geometry={R.body.geo} material={s.sel.body > 0.99 ? R.sel : R.selDim} frustumCulled={false} />}
      {s.pod > 0.001 && pod(false)}
      {s.mirror > 0.001 && pod(true)}
      {s.mirror > 0.001 && s.mirror < 0.999 && !reflect && <mesh material={R.mirrorPlane}><planeGeometry args={[5.2, 2.2]} /></mesh>}
      {s.canopy > 0.001 && (
        <group position={[0.38, 0.27, 0]} scale={[s.canopy, s.canopy, s.canopy]}>
          <group position={[-0.38, -0.27, 0]}><Part g={P.canopy} mode={mode} R={R} mat={R.glass} wire={s.wire} sel={s.sel.canopy} dim reflect={reflect} /></group>
        </group>
      )}
      {s.fin > 0.001 && (
        <group position={[-1.5, 0.2, 0]} scale={[1, s.fin, 1]}>
          <group position={[1.5, -0.2, 0]}><Part g={P.fin} mode={mode} R={R} mat={R.accent} wire={s.wire} sel={s.sel.fin} reflect={reflect} /></group>
        </group>
      )}
      {s.sculpt > 0.6 && (
        <group scale={[1, Math.min(1, (s.sculpt - 0.6) / 0.4), Math.min(1, (s.sculpt - 0.6) / 0.4)]}>
          <Part g={P.nozzle} mode={mode} R={R} mat={R.dark} wire={s.wire} sel={s.sel.body} dim reflect={reflect} />
          {mode === 'render' && <mesh geometry={P.disc} material={R.emit} />}
          {mode === 'render' && <sprite material={R.sprite} position={[-2.35, 0, 0]} scale={[1.5 * glowK + 0.01, 1.5 * glowK + 0.01, 1]} />}
        </group>
      )}
    </group>
  );
};

// ============================================================================================ viewport set dressing
/** DCC floor grid with red X / green Y axis lines (Z-up naming; three's Z is the app's Y) */
export const StudioGrid: React.FC<{ opacity?: number }> = ({ opacity = 1 }) => {
  const { minor, major, ax, ay, mats } = useMemo(() => {
    const mk = (step: number, ext: number, skip: number) => {
      const p: number[] = [];
      for (let i = -ext; i <= ext; i += step) {
        if (skip && Math.abs(i % skip) < 1e-6) continue;
        if (Math.abs(i) < 1e-6) continue;
        p.push(i, 0, -ext, i, 0, ext, -ext, 0, i, ext, 0, i);
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); return g;
    };
    const line = (a: number[], b: number[]) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([...a, ...b], 3)); return g; };
    return {
      minor: mk(1, 30, 5), major: mk(5, 30, 0), ax: line([-30, 0.001, 0], [30, 0.001, 0]), ay: line([0, 0.001, -30], [0, 0.001, 30]),
      mats: [new THREE.LineBasicMaterial({ color: '#545A64', transparent: true }), new THREE.LineBasicMaterial({ color: '#666D78', transparent: true }),
        new THREE.LineBasicMaterial({ color: '#C2474C', transparent: true }), new THREE.LineBasicMaterial({ color: '#79A33E', transparent: true })],
    };
  }, []);
  mats[0].opacity = 0.55 * opacity; mats[1].opacity = 0.8 * opacity; mats[2].opacity = opacity; mats[3].opacity = opacity;
  return (
    <group>
      <lineSegments geometry={minor} material={mats[0]} />
      <lineSegments geometry={major} material={mats[1]} />
      <lineSegments geometry={ax} material={mats[2]} />
      <lineSegments geometry={ay} material={mats[3]} />
    </group>
  );
};

/** dusk world for the rendered look: gradient dome + glossy dark floor that fades into the horizon */
export const RenderWorld: React.FC = () => {
  const { dome, floor } = useMemo(() => ({
    dome: new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, toneMapped: false,
      vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: `varying vec3 vD; void main(){ float y = vD.y;
        vec3 top = vec3(0.09,0.11,0.24), mid = vec3(0.36,0.25,0.42), hz = vec3(0.98,0.62,0.45), gnd = vec3(0.07,0.06,0.09);
        vec3 c = mix(hz, mid, smoothstep(0.0, 0.16, y)); c = mix(c, top, smoothstep(0.14, 0.6, y));
        c = mix(gnd, c, smoothstep(-0.05, 0.0, y)) ; c += vec3(1.0,0.75,0.55) * 0.35 * exp(-abs(y) * 22.0);
        gl_FragColor = vec4(c, 1.0); }`,
    }),
    floor: new THREE.MeshPhysicalMaterial({ color: '#141219', metalness: 0.2, roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.1, transparent: true, opacity: 0.86 }),
  }), []);
  return (
    <group>
      <mesh material={dome}><sphereGeometry args={[80, 48, 24]} /></mesh>
      <mesh material={floor} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}><circleGeometry args={[60, 64]} /></mesh>
    </group>
  );
};
