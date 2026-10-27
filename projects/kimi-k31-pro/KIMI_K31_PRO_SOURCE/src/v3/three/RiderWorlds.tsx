// RiderWorlds: the places the BOARD FLIGHT rider crosses (one per bar), all procedural and original:
//   CanyonWorld  a winding red-rock canyon with terraced strata walls, sand floor, boulders and a rock tunnel at its end
//   CityWorld    an avenue of night towers (instanced, window-grid shader), abstract neon (no text or logos), sky bridges,
//                flying traffic, a street of light trails far below and a holographic ring gate
//   OceanWorld   an open sea shader (scrolling wave normals, sky fresnel, sun glitter, V-shaped wake foam behind the board)
// Units are metres. Everything is a pure function of its props.
import React, { useMemo } from 'react';
import * as THREE from 'three';
import { mulberry32 } from '../../lib/rng';
import { noiseTex, Ribbons, type P3, type Strip } from './SkyKit';

const TAU = Math.PI * 2;
const sstep = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// ================================================================================================ canyon
/** centre line and half width of the canyon at depth z (rider flies along -z) */
export const canyonX = (z: number) => 7 * Math.sin(z * 0.03) + 3 * Math.sin(z * 0.075 + 1);
const canyonHW = (z: number, side: number) => 16.5 + 2.5 * Math.sin(z * 0.05 + side * 1.7);
export const TUNNEL_Z = -52;

function canyonWallGeo(side: number, seed: number) {
  const rnd = mulberry32(seed);
  const NZ = 110, NY = 26, Z0 = 50, LEN = 330, H = 72;
  const pal = ['#B8442A', '#D2683A', '#E4955A', '#A63C26', '#EDBF86', '#C85A30'].map((c) => new THREE.Color(c));
  const pos: number[] = [], col: number[] = [], idx: number[] = [];
  for (let iz = 0; iz <= NZ; iz++) for (let iy = 0; iy <= NY; iy++) {
    const z = Z0 - (iz / NZ) * LEN, y = (iy / NY) * H + (iy > 0 && iy < NY ? (rnd() - 0.5) * 0.8 : 0);
    const band = Math.floor(y / 7.5), fr = y / 7.5 - band;
    const recess = band * 1.4 + sstep(0.7, 1, fr) * 1.4;
    const n = 1.3 * Math.sin(z * 0.19 + y * 0.12 + seed) + 0.8 * Math.sin(z * 0.43 - y * 0.29 + seed * 2) + 0.45 * Math.sin(z * 1.05 + y * 0.8) + (rnd() - 0.5) * 0.5;
    const talus = y < 9 ? -4.5 * (1 - y / 9) ** 1.6 : 0;
    // close the canyon into the tunnel wall
    const pinch = z < TUNNEL_Z + 6 ? -Math.min(10, (TUNNEL_Z + 6 - z) * 0.8) : 0;
    const x = canyonX(z) + side * (canyonHW(z, side) + recess + n + talus + pinch);
    pos.push(x, y, z);
    const c = pal[(band + (seed % 3)) % pal.length].clone().lerp(pal[(band + 2) % pal.length], 0.25 + 0.2 * Math.sin(z * 0.07 + y));
    if (y < 3) c.lerp(new THREE.Color('#D69A64'), 0.5);
    col.push(c.r, c.g, c.b);
  }
  for (let iz = 0; iz < NZ; iz++) for (let iy = 0; iy < NY; iy++) {
    const a = iz * (NY + 1) + iy, b = a + 1, c = a + NY + 1, d = c + 1;
    idx.push(a, c, b, b, c, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}
function canyonFloorGeo() {
  const NX = 40, NZ = 140, W = 70, Z0 = 50, LEN = 330;
  const pos: number[] = [], col: number[] = [], idx: number[] = [];
  const a = new THREE.Color('#E3A96E'), b = new THREE.Color('#C9824C');
  for (let iz = 0; iz <= NZ; iz++) for (let ix = 0; ix <= NX; ix++) {
    const z = Z0 - (iz / NZ) * LEN, x = canyonX(z) + (ix / NX - 0.5) * W;
    const y = 0.35 * Math.sin(x * 0.7 + z * 0.25) + 0.25 * Math.sin(z * 0.6 - x * 0.3) + 0.6 * Math.sin(z * 0.06 + x * 0.1);
    pos.push(x, y, z);
    const c = a.clone().lerp(b, 0.5 + 0.5 * Math.sin(x * 0.5 + z * 0.13));
    col.push(c.r, c.g, c.b);
  }
  for (let iz = 0; iz < NZ; iz++) for (let ix = 0; ix < NX; ix++) {
    const p = iz * (NX + 1) + ix, q = p + 1, r = p + NX + 1, s = r + 1;
    idx.push(p, r, q, q, r, s);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}
/** the cliff that closes the canyon, with an arched tunnel mouth, and the tunnel behind it */
function tunnelGeo() {
  const cx = canyonX(TUNNEL_Z), R = 6.5;
  const s = new THREE.Shape();
  s.moveTo(cx - 40, -1); s.lineTo(cx + 40, -1); s.lineTo(cx + 40, 75); s.lineTo(cx - 40, 75); s.lineTo(cx - 40, -1);
  const hole = new THREE.Path();
  hole.moveTo(cx - R, -1); hole.lineTo(cx - R, 4); hole.absarc(cx, 4, R, Math.PI, 0, true); hole.lineTo(cx + R, -1); hole.lineTo(cx - R, -1);
  s.holes.push(hole);
  const wall = new THREE.ExtrudeGeometry(s, { depth: 4, bevelEnabled: false, curveSegments: 20 });
  wall.translate(0, 0, TUNNEL_Z - 4);
  const pal = ['#B8442A', '#D2683A', '#E4955A', '#A63C26', '#EDBF86'].map((c) => new THREE.Color(c));
  const p = wall.attributes.position as THREE.BufferAttribute, col: number[] = [];
  for (let i = 0; i < p.count; i++) { const c = pal[Math.max(0, Math.floor(p.getY(i) / 7.5)) % pal.length]; col.push(c.r, c.g, c.b); }
  wall.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  wall.computeVertexNormals();
  const tube = new THREE.CylinderGeometry(R, R, 70, 18, 10, true, -Math.PI / 2, Math.PI);
  tube.rotateX(-Math.PI / 2);
  const tp = tube.attributes.position as THREE.BufferAttribute, rnd = mulberry32(5);
  for (let i = 0; i < tp.count; i++) { const k = 1 + (rnd() - 0.5) * 0.12; tp.setX(i, tp.getX(i) * k); tp.setY(i, Math.max(-1, tp.getY(i) * k)); }
  tube.translate(cx, 4, TUNNEL_Z - 4 - 35);
  tube.computeVertexNormals();
  const sides = [-1, 1].map((sd) => { const g = new THREE.BoxGeometry(1, 6, 70); g.translate(cx + sd * (R + 0.5), 2, TUNNEL_Z - 4 - 35); return g; });
  return { wall, tube, sides };
}

export const CanyonWorld: React.FC<{ t: number }> = ({ t }) => {
  const G = useMemo(() => {
    const rock = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.92, flatShading: true, side: THREE.DoubleSide });
    const tn = tunnelGeo();
    const rnd = mulberry32(88);
    const boulders: { p: P3; s: number; r: number }[] = [];
    for (let k = 0; k < 60; k++) {
      const z = 40 - rnd() * 300, side = rnd() < 0.5 ? -1 : 1;
      boulders.push({ p: [canyonX(z) + side * (7 + rnd() * 8), 0, z], s: 0.6 + rnd() * 2.2, r: rnd() * TAU });
    }
    const crystals: P3[] = [];
    for (let k = 0; k < 14; k++) { const z = TUNNEL_Z - 6 - k * 4.5, a = (k % 2 ? 1 : -1) * (0.45 + 0.3 * rnd()) * Math.PI; crystals.push([canyonX(TUNNEL_Z) + Math.sin(a) * 6, 4 + Math.cos(a) * 6 * 0.8, z]); }
    return {
      rock, wallL: canyonWallGeo(-1, 3), wallR: canyonWallGeo(1, 7), floor: canyonFloorGeo(), tunnelWall: tn.wall, tube: tn.tube,
      tubeMat: new THREE.MeshStandardMaterial({ color: '#5A2E22', roughness: 0.95, side: THREE.DoubleSide, flatShading: true }),
      tubeMat2: new THREE.MeshStandardMaterial({ color: '#4A261C', roughness: 0.95, flatShading: true }), sides: tn.sides,
      boulder: new THREE.IcosahedronGeometry(1, 0), boulders, crystals,
      boulderMat: new THREE.MeshStandardMaterial({ color: '#B65E38', roughness: 0.9, flatShading: true }),
      crystal: new THREE.OctahedronGeometry(0.5, 0), crystalMat: new THREE.MeshBasicMaterial({ color: '#7FF3FF', toneMapped: false }),
    };
  }, []);
  return (
    <group>
      <mesh geometry={G.wallL} material={G.rock} />
      <mesh geometry={G.wallR} material={G.rock} />
      <mesh geometry={G.floor} material={G.rock} />
      <mesh geometry={G.tunnelWall} material={G.rock} />
      <mesh geometry={G.tube} material={G.tubeMat} />
      {G.sides.map((g, i) => <mesh key={'s' + i} geometry={g} material={G.tubeMat2} />)}
      {G.boulders.map((b, i) => <mesh key={i} geometry={G.boulder} material={G.boulderMat} position={[b.p[0], b.s * 0.3, b.p[2]]} rotation={[b.r, b.r * 1.7, 0]} scale={[b.s * 1.3, b.s, b.s * 1.1]} />)}
      {G.crystals.map((c, i) => <mesh key={'c' + i} geometry={G.crystal} material={G.crystalMat} position={c} scale={[0.5, 1.2, 0.5]} rotation={[0, i, 0.4]} />)}
      {void t}
    </group>
  );
};

// ================================================================================================ city
const bldVert = /* glsl */ `
attribute float aId;
varying vec3 vW; varying vec3 vN; varying vec3 vL; varying vec3 vSize; varying float vId;
void main() {
  vec3 size = vec3(length(instanceMatrix[0].xyz), length(instanceMatrix[1].xyz), length(instanceMatrix[2].xyz));
  vec4 w = modelMatrix * instanceMatrix * vec4(position, 1.0);
  vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal); vL = (position + vec3(0.0, 0.5, 0.0)) * size; vSize = size; vId = aId;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
const bldFrag = /* glsl */ `
uniform vec3 uBase; uniform vec3 uSkyR; uniform vec3 uHaze; uniform float uHazeDist; uniform vec3 uW0; uniform vec3 uW1; uniform vec3 uW2;
uniform vec3 uT0; uniform vec3 uT1; uniform vec3 uT2; uniform float uTime;
varying vec3 vW; varying vec3 vN; varying vec3 vL; varying vec3 vSize; varying float vId;
float h21(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
void main() {
  vec3 V = normalize(cameraPosition - vW);
  float side = abs(vN.x) > 0.5 ? 1.0 : 0.0;
  vec2 fc = side > 0.5 ? vec2(vL.z, vL.y) : vec2(vL.x, vL.y);
  vec2 cs = vec2(1.55, 2.5);
  vec2 cell = floor(fc / cs), fw = fract(fc / cs);
  float win = step(0.16, fw.x) * step(fw.x, 0.84) * step(0.24, fw.y) * step(fw.y, 0.8);
  float r = h21(cell + vec2(vId * 13.7, side * 7.1));
  float lit = step(0.56, r) * win * step(0.5, 1.0 - abs(vN.y));
  float mull = (1.0 - step(0.06, fract(fc.x / 6.2))) * 0.6;
  vec3 wc = r > 0.93 ? uW2 : (r > 0.74 ? uW1 : uW0);
  float fres = pow(1.0 - max(dot(vN, V), 0.0), 3.0);
  vec3 col = uBase * (0.6 + 0.4 * (vL.y / vSize.y)) + uSkyR * fres * 0.6;
  col += wc * lit * (0.45 + 0.6 * h21(cell * 1.7 + vId)) + uSkyR * mull * 0.25;
  // a neon crown on some towers, and a lit band every few floors on others
  float k = h21(vec2(vId, 3.3));
  vec3 tc = k > 0.66 ? uT2 : (k > 0.33 ? uT1 : uT0);
  float crown = step(vSize.y - 0.7, vL.y) * step(0.45, h21(vec2(vId, 9.1))) * (1.0 - step(0.5, vN.y));
  float bandY = fract(vL.y / 21.0);
  float band = step(0.985, bandY) * step(0.7, h21(vec2(vId, 5.5))) * (1.0 - abs(vN.y));
  col += tc * (crown + band) * 2.2;
  col = mix(col, uHaze, 1.0 - exp(-length(vW - cameraPosition) / uHazeDist));
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

export const CITY_Y = 32;
export const GATE_Z = -58;
export const NEON = ['#FF3FD0', '#3FF2FF', '#FFB23F', '#9B6BFF'];

function cityLayout() {
  const rnd = mulberry32(4242);
  const b: { x: number; z: number; w: number; d: number; h: number; y0?: number }[] = [];
  // the mega-block the rider exits on the downbeat: a bore through it at flight height
  const MB = { z: 25, d: 42, bx: 3.8, y0: CITY_Y - 2.4, y1: CITY_Y + 3.9, H: 110 };
  b.push({ x: -(MB.bx + 16), z: MB.z, w: 32, d: MB.d, h: MB.H }, { x: MB.bx + 16, z: MB.z, w: 32, d: MB.d, h: MB.H },
    { x: 0, z: MB.z, w: MB.bx * 2, d: MB.d, h: MB.y0 }, { x: 0, z: MB.z, w: MB.bx * 2, d: MB.d, h: MB.H - MB.y1, y0: MB.y1 });
  for (const side of [-1, 1]) {
    for (let row = 0; row < 4; row++) {
      let z = row === 0 ? 2 : 40;
      while (z > -330) {
        const w = 8 + rnd() * 9, d = 8 + rnd() * 10;
        const x = side * (10.5 + row * 22 + w / 2 + rnd() * (row ? 6 : 1.5));
        const h = (row === 0 ? 55 : 70) + rnd() * (row === 0 ? 80 : 130);
        b.push({ x, z: z - d / 2, w, d, h });
        z -= d + 2 + rnd() * (row ? 8 : 3);
      }
    }
  }
  const signs: { p: P3; s: P3; c: number; ring: boolean }[] = [];
  for (let k = 0; k < 44; k++) {
    const side = k % 2 ? 1 : -1, z = 30 - rnd() * 320, y = 12 + rnd() * 60;
    const ring = rnd() < 0.2;
    signs.push({ p: [side * (10.6 + (ring ? 2.5 : 0)), y, z], s: ring ? [2.2, 2.2, 2.2] : rnd() < 0.5 ? [0.25, 4 + rnd() * 8, 0.9] : [0.25, 0.9, 3 + rnd() * 6], c: Math.floor(rnd() * 4), ring });
  }
  const bridges = [{ z: -20, y: CITY_Y + 7 }, { z: -44, y: CITY_Y - 8 }, { z: 14, y: CITY_Y + 14 }, { z: -110, y: CITY_Y + 4 }];
  return { b, signs, bridges };
}

export const CityWorld: React.FC<{ t: number; cam: P3; gate: number }> = ({ t, cam, gate }) => {
  const G = useMemo(() => {
    const L = cityLayout();
    const box = new THREE.BoxGeometry(1, 1, 1);
    box.setAttribute('aId', new THREE.InstancedBufferAttribute(new Float32Array(L.b.map((_, i) => i)), 1));
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uBase: { value: new THREE.Color('#0C0F22') }, uSkyR: { value: new THREE.Color('#40308A') }, uHaze: { value: new THREE.Color('#2A1C50') }, uHazeDist: { value: 260 },
        uW0: { value: new THREE.Color('#FFD7A0') }, uW1: { value: new THREE.Color('#9FE8FF') }, uW2: { value: new THREE.Color('#FF7AD9') },
        uT0: { value: new THREE.Color(NEON[0]) }, uT1: { value: new THREE.Color(NEON[1]) }, uT2: { value: new THREE.Color(NEON[2]) }, uTime: { value: 0 },
      },
      vertexShader: bldVert, fragmentShader: bldFrag,
    });
    const im = new THREE.InstancedMesh(box, mat, L.b.length);
    const m4 = new THREE.Matrix4();
    L.b.forEach((q, i) => { m4.makeScale(q.w, q.h, q.d); m4.setPosition(q.x, 0, q.z); im.setMatrixAt(i, m4); });
    // the box is centred: shift so the base sits on y = 0 (vertex shader uses position + 0.5 for local y)
    im.instanceMatrix.needsUpdate = true;
    im.frustumCulled = false;
    const neonMats = NEON.map((c) => new THREE.MeshBasicMaterial({ color: c, toneMapped: false }));
    const haloMats = NEON.map((c) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
    const bridgeMat = new THREE.MeshStandardMaterial({ color: '#1C2240', roughness: 0.4, metalness: 0.6 });
    const street = new THREE.MeshBasicMaterial({ color: '#0A0B1A' });
    return { L, im, neonMats, haloMats, bridgeMat, street, ring: new THREE.TorusGeometry(1, 0.08, 8, 40), unit: new THREE.BoxGeometry(1, 1, 1) };
  }, []);
  // buildings are centred boxes; lift each by half its height
  useMemo(() => {
    const m4 = new THREE.Matrix4();
    G.L.b.forEach((q, i) => { m4.makeScale(q.w, q.h, q.d); m4.setPosition(q.x, (q.y0 ?? 0) + q.h / 2, q.z); G.im.setMatrixAt(i, m4); });
    G.im.instanceMatrix.needsUpdate = true;
  }, [G]);
  const bore: [P3, P3, number][] = [];
  for (const [x, y] of [[-3.75, CITY_Y - 2.35], [3.75, CITY_Y - 2.35], [-3.75, CITY_Y + 3.85], [3.75, CITY_Y + 3.85]]) bore.push([[x, y, 25], [0.08, 0.08, 42], y > CITY_Y ? 0 : 1]);
  for (let k = 0; k < 7; k++) bore.push([[0, CITY_Y + 3.85, 6 + k * 6], [7.4, 0.06, 0.12], 1]);
  // traffic: street streams far below and two flying lanes
  const strips: Strip[] = [];
  const rnd = mulberry32(9);
  for (let k = 0; k < 70; k++) {
    const lane = k % 7, y = lane < 4 ? 0.6 : lane < 6 ? CITY_Y + 18 + (lane - 4) * 16 : CITY_Y - 14;
    const x = lane < 4 ? (lane - 1.5) * 3.2 : (lane % 2 ? 1 : -1) * (3 + rnd() * 4);
    const dir = lane % 2 ? 1 : -1, v = (lane < 4 ? 22 : 40) * (0.8 + rnd() * 0.4);
    const z = (((rnd() * 400 + dir * v * t) % 400) + 400) % 400 * -1 + 40;
    const head = dir > 0 ? [1.0, 0.95, 0.85] as [number, number, number] : [1.0, 0.25, 0.3] as [number, number, number];
    strips.push({ pts: [[x, y, z], [x, y, z - dir * v * 0.12]], w: lane < 4 ? 0.5 : 0.35, a: 0.9, col: head });
  }
  const gs = 1 + 0.15 * gate;
  return (
    <group>
      <primitive object={G.im} />
      {bore.map(([p, sc, c], i) => <mesh key={'bo' + i} geometry={G.unit} material={G.neonMats[c]} position={p} scale={sc} />)}
      <mesh position={[0, -0.05, -150]} rotation={[-Math.PI / 2, 0, 0]} material={G.street}><planeGeometry args={[400, 600]} /></mesh>
      {G.L.signs.map((s, i) => s.ring ? (
        <group key={i} position={s.p} rotation={[0, Math.PI / 2, 0]}>
          <mesh geometry={G.ring} material={G.neonMats[s.c]} scale={s.s} />
          <mesh geometry={G.ring} material={G.haloMats[s.c]} scale={[s.s[0], s.s[1], s.s[2] * 6]} />
        </group>
      ) : (
        <group key={i} position={s.p}>
          <mesh geometry={G.unit} material={G.neonMats[s.c]} scale={s.s} />
          <mesh geometry={G.unit} material={G.haloMats[s.c]} scale={[s.s[0] * 3, s.s[1] + 1.2, s.s[2] + 1.2]} />
        </group>
      ))}
      {G.L.bridges.map((b, i) => (
        <group key={'b' + i} position={[0, b.y, b.z]}>
          <mesh geometry={G.unit} material={G.bridgeMat} scale={[24, 1.6, 3.2]} />
          <mesh geometry={G.unit} material={G.neonMats[(i + 1) % 4]} position={[0, -0.85, 1.62]} scale={[24, 0.12, 0.05]} />
          <mesh geometry={G.unit} material={G.neonMats[(i + 1) % 4]} position={[0, -0.85, -1.62]} scale={[24, 0.12, 0.05]} />
        </group>
      ))}
      {/* the ring gate that bursts the rider into the next place */}
      <group position={[0, CITY_Y + 0.8, GATE_Z]} scale={[gs, gs, gs]}>
        <mesh geometry={G.ring} material={G.neonMats[1]} scale={[6.5, 6.5, 2.4]} />
        <mesh geometry={G.ring} material={G.haloMats[1]} scale={[6.5, 6.5, 14]} />
        <mesh geometry={G.ring} material={G.neonMats[0]} scale={[7.4, 7.4, 1.2]} />
      </group>
      <Ribbons strips={strips} cam={cam} mode="add" soft={1.6} renderOrder={22} />
    </group>
  );
};

// ================================================================================================ ocean
const oceanVert = /* glsl */ `
varying vec3 vW;
void main() { vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
const oceanFrag = /* glsl */ `
uniform sampler2D uNoise; uniform float uTime; uniform vec3 uSun; uniform vec3 uDeep; uniform vec3 uShallow; uniform vec3 uSky; uniform vec3 uHor; uniform vec3 uSunC;
uniform vec3 uHaze; uniform float uHazeDist; uniform vec3 uRider; uniform vec2 uDir; uniform float uWake; uniform float uSpray;
varying vec3 vW;
float hgt(vec2 p) {
  return texture2D(uNoise, p * 0.021 + vec2(uTime * 0.013, uTime * 0.008)).r * 0.55
       + texture2D(uNoise, p * 0.067 + vec2(-uTime * 0.03, uTime * 0.021)).g * 0.3
       + texture2D(uNoise, p * 0.23 + vec2(uTime * 0.06, -uTime * 0.05)).r * 0.15;
}
void main() {
  vec2 p = vW.xz;
  float e = 0.35;
  float h = hgt(p), hx = hgt(p + vec2(e, 0.0)), hz = hgt(p + vec2(0.0, e));
  float dist = length(vW - cameraPosition);
  float k = 3.2 / (1.0 + dist * 0.012);
  vec3 n = normalize(vec3(-(hx - h) / e * k, 1.0, -(hz - h) / e * k));
  vec3 V = normalize(cameraPosition - vW);
  vec3 R = reflect(-V, n);
  float fres = 0.03 + 0.97 * pow(1.0 - max(dot(n, V), 0.0), 5.0);
  vec3 skyR = mix(uHor, uSky, pow(clamp(R.y, 0.0, 1.0), 0.55));
  float sr = max(dot(R, uSun), 0.0);
  float spec = pow(sr, 900.0) * 60.0 + pow(sr, 60.0) * 0.9;
  vec3 water = mix(uDeep, uShallow, clamp(0.25 + 0.9 * (h - 0.45), 0.0, 1.0));
  vec3 col = mix(water, skyR, fres) + uSunC * spec;
  // wake: a V of foam spreading behind the board, plus churned water on the centre line
  vec2 rel = p - uRider.xz;
  vec2 perp = vec2(-uDir.y, uDir.x);
  float along = dot(rel, -uDir), lat = dot(rel, perp);
  if (along > -0.3 && along < uWake) {
    float fade = (1.0 - along / uWake);
    float vline = exp(-pow((abs(lat) - along * 0.34) / (0.25 + along * 0.05), 2.0));
    float centre = exp(-lat * lat / (0.08 + along * 0.05)) * exp(-along * 0.06);
    float brk = texture2D(uNoise, p * 0.45 + uTime * 0.2).b * 0.7 + texture2D(uNoise, p * 1.3 - uTime * 0.3).r * 0.3;
    float foam = (vline * 0.8 + centre * (0.55 + 0.5 * uSpray)) * fade * smoothstep(0.42, 0.78, brk + 0.12 * vline);
    col = mix(col, vec3(0.94, 0.98, 1.0), clamp(foam, 0.0, 0.85));
  }
  col = mix(col, uHaze, 1.0 - exp(-dist / uHazeDist));
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

export const OceanWorld: React.FC<{ t: number; cam: P3; sun: P3; rider: P3; dir: [number, number]; spray: number; look: { zenith: string; horizon: string; haze: string; hazeDist: number; sunColor: string } }> = ({ t, cam, sun, rider, dir, spray, look }) => {
  const mat = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      uNoise: { value: noiseTex() }, uTime: { value: 0 }, uSun: { value: new THREE.Vector3() }, uDeep: { value: new THREE.Color('#0A3F7A') }, uShallow: { value: new THREE.Color('#1AA3B8') },
      uSky: { value: new THREE.Color() }, uHor: { value: new THREE.Color() }, uSunC: { value: new THREE.Color() }, uHaze: { value: new THREE.Color() }, uHazeDist: { value: 800 },
      uRider: { value: new THREE.Vector3() }, uDir: { value: new THREE.Vector2(0, -1) }, uWake: { value: 40 }, uSpray: { value: 0 },
    },
    vertexShader: oceanVert, fragmentShader: oceanFrag,
  }), []);
  const u = mat.uniforms;
  u.uTime.value = t; u.uSun.value.set(...sun); u.uSky.value.set(look.zenith); u.uHor.value.set(look.horizon); u.uSunC.value.set(look.sunColor);
  u.uHaze.value.set(look.haze); u.uHazeDist.value = look.hazeDist; u.uRider.value.set(...rider); u.uDir.value.set(dir[0], dir[1]); u.uSpray.value = spray;
  return (
    <mesh position={[cam[0], 0, cam[2]]} rotation={[-Math.PI / 2, 0, 0]} material={mat} renderOrder={-50}>
      <planeGeometry args={[3600, 3600, 1, 1]} />
    </mesh>
  );
};
