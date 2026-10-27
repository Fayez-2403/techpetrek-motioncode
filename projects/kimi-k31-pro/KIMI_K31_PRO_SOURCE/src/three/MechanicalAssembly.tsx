// Procedural mechanical parts for scene 01 (a turbofan fan stage) and scene 04 (an involute spur-gear train driving a
// crank and piston). Geometry is built once (useMemo); every frame only moves transforms and uniforms, so each frame
// is a pure function of its inputs. The gear code here is also what the editor in scene 04 shows (src/data/codingSnippet.ts).
import React, { useLayoutEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { mulberry32 } from '../lib/rng';

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export type V3 = [number, number, number];

// ============================================================================================ gears
// Involute spur gear, 20° pressure angle: module m, z teeth.
export const PA = (20 * Math.PI) / 180;
const inv = (a: number) => Math.tan(a) - a;
const V2 = THREE.Vector2;

// Meshing gears turn the other way:
//   angle_b = -angle_a * z_a / z_b
// + a phase so a tooth of A sits in a gap of B.
export const meshAngle = (
  a: number, za: number, zb: number, phi: number,
) => -a * (za / zb) + phi * (1 + za / zb)
  + Math.PI - Math.PI / zb;

// Involute spur gear outline (pitch radius m·z/2).
export function gearOutline(z: number, m: number) {
  const rp = (m * z) / 2, rb = rp * Math.cos(PA);
  const ra = rp + m, rf = rp - 1.25 * m;
  const half = Math.PI / (2 * z) + inv(PA);
  const psi = (r: number) =>
    half - inv(Math.acos(Math.min(1, rb / r)));
  const pts: THREE.Vector2[] = [];
  const at = (r: number, a: number) =>
    pts.push(new V2(r * Math.cos(a), r * Math.sin(a)));
  const r0 = Math.max(rb, rf), steps = 5;
  for (let i = 0; i < z; i++) {
    const c = (i / z) * Math.PI * 2;
    at(rf, c - half);
    for (let k = 0; k <= steps; k++) {
      const r = r0 + ((ra - r0) * k) / steps;
      at(r, c - psi(r));
    }
    for (let k = steps; k >= 0; k--) {
      const r = r0 + ((ra - r0) * k) / steps;
      at(r, c + psi(r));
    }
    at(rf, c + half);
    at(rf, c + Math.PI / z);
  }
  return pts;
}

// Crank-slider: piston pin distance along the slide.
export const pistonX = (th: number, r: number, l: number) =>
  r * Math.cos(th) + Math.sqrt(l * l - (r * Math.sin(th)) ** 2);

export function gearShape(z: number, m: number, bore: number, holes = 0) {
  const shape = new THREE.Shape(gearOutline(z, m));
  const hole = (x: number, y: number, r: number) => {
    const p = new THREE.Path();
    p.absarc(x, y, r, 0, Math.PI * 2, true);
    shape.holes.push(p);
  };
  hole(0, 0, bore);
  const rp = (m * z) / 2, rm = rp * 0.56, rh = rp * 0.2;
  for (let k = 0; k < holes; k++) {
    const a = ((k + 0.5) / holes) * Math.PI * 2;
    hole(rm * Math.cos(a), rm * Math.sin(a), rh);
  }
  return shape;
}

/** The train: gear 0 drives; each other gear meshes `with` an earlier gear at angle `phi` (deg) from its centre. */
export const MODULE = 0.12;
export const GEAR_DEPTH = 0.3;
export const TRAIN: { z: number; with: number; phi: number; holes: number; color: string }[] = [
  { z: 30, with: -1, phi: 0, holes: 6, color: '#C7CED9' },
  { z: 14, with: 0, phi: 25, holes: 0, color: '#8C96A8' },
  { z: 18, with: 0, phi: -40, holes: 5, color: '#BAC3D0' },
  { z: 10, with: 2, phi: -10, holes: 0, color: '#9AA4B5' },
];
export const CRANK = { gear: 1, r: 0.46, rod: 1.75, z: 0.33 };
const rpOf = (z: number) => (MODULE * z) / 2;
export const raOf = (z: number) => rpOf(z) + MODULE;

/** gear centres (x, y) from the meshing chain */
export const GEAR_CENTRES: [number, number][] = (() => {
  const c: [number, number][] = [];
  TRAIN.forEach((g, i) => {
    if (g.with < 0) { c.push([0, 0]); return; }
    const a = TRAIN[g.with], d = rpOf(a.z) + rpOf(g.z), p = (g.phi * Math.PI) / 180;
    c.push([c[g.with][0] + d * Math.cos(p), c[g.with][1] + d * Math.sin(p)]);
    void i;
  });
  return c;
})();

/** every part's pose for drive angle a0 (radians): gear angles, crank pin, rod angle, piston pin */
export function trainPose(a0: number) {
  const ang: number[] = [];
  TRAIN.forEach((g, i) => {
    if (g.with < 0) ang.push(a0);
    else ang.push(meshAngle(ang[g.with], TRAIN[g.with].z, g.z, (g.phi * Math.PI) / 180));
    void i;
  });
  const [cx, cy] = GEAR_CENTRES[CRANK.gear];
  const th = ang[CRANK.gear];
  const pin: [number, number] = [cx + CRANK.r * Math.cos(th), cy + CRANK.r * Math.sin(th)];
  const px = cx + pistonX(th, CRANK.r, CRANK.rod);
  const rod = Math.atan2(cy - pin[1], px - pin[0]);
  return { ang, pin, rod, piston: [px, cy] as [number, number] };
}

// ============================================================================================ turbine
export const BLADES = 24, R_HUB = 0.62, R_TIP = 2.04, SPAN = 14, LOOP = 24;
export const CASING_R = 2.12;

/** one twisted airfoil section (closed loop of LOOP points), NACA-style thickness, at radius r and blade angle a */
function section(r: number, a: number, twist: number, k: number) {
  const radial = new THREE.Vector3(Math.cos(a), Math.sin(a), 0);
  const tangent = new THREE.Vector3(-Math.sin(a), Math.cos(a), 0);
  // chord runs from the leading edge (front, ahead in the spin) to the trailing edge
  const cd = tangent.clone().multiplyScalar(-Math.cos(twist)).addScaledVector(new THREE.Vector3(0, 0, -1), Math.sin(twist));
  const nd = new THREE.Vector3().crossVectors(cd, radial).normalize();
  const chord = lerp(0.52, 0.8, k), tMax = lerp(0.13, 0.05, k), sweep = 0.2 * k * k * chord;
  const pts: THREE.Vector3[] = [];
  for (let j = 0; j < LOOP; j++) {
    const psi = (j / LOOP) * Math.PI * 2;
    const u = (1 - Math.cos(psi)) / 2, side = psi < Math.PI ? 1 : -1;
    const th = 5 * tMax * chord * (0.2969 * Math.sqrt(u) - 0.126 * u - 0.3516 * u * u + 0.2843 * u ** 3 - 0.1036 * u ** 4);
    const cam = 0.05 * chord * 4 * u * (1 - u);
    pts.push(radial.clone().multiplyScalar(r).addScaledVector(cd, (u - 0.42) * chord - sweep).addScaledVector(nd, cam + side * th));
  }
  return pts;
}

export function turbineBlades() {
  const blades: THREE.Vector3[][][] = [];
  for (let i = 0; i < BLADES; i++) {
    const a = (i / BLADES) * Math.PI * 2;
    const rings: THREE.Vector3[][] = [];
    for (let s = 0; s <= SPAN; s++) {
      const k = s / SPAN;
      const r = lerp(R_HUB, R_TIP, k);
      const twist = lerp(0.96, 0.49, k);
      rings.push(section(r, a, twist, k));
    }
    blades.push(rings);
  }
  return blades;
}

/** geometry with a per-vertex noise attribute `aN` (drives the dissolve / reveal front) */
function withNoise(g: THREE.BufferGeometry, seed: number, base: (i: number, p: THREE.Vector3) => number = () => 0, amt = 1) {
  const pos = g.attributes.position, n = new Float32Array(pos.count), r = mulberry32(seed), v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) { v.fromBufferAttribute(pos, i); n[i] = base(i, v) + amt * r(); }
  g.setAttribute('aN', new THREE.BufferAttribute(n, 1));
  return g;
}

export interface TurbineGeo {
  blades: THREE.BufferGeometry; hub: THREE.BufferGeometry; casing: THREE.BufferGeometry; stator: THREE.BufferGeometry;
  rings: THREE.BufferGeometry; edges: THREE.BufferGeometry; glow: THREE.BufferGeometry; spiral: THREE.BufferGeometry;
  /** all solid vertices (local coords) + their noise, for the vertex dissolve */
  cloud: { pos: Float32Array; n: Float32Array; count: number };
  rMax: number;
}

export function buildTurbine(): TurbineGeo {
  const rnd = mulberry32(31);
  // ---- blades: loft every blade's sections into one indexed geometry
  const bl = turbineBlades();
  const bp: number[] = [], bi: number[] = [], bn: number[] = [];
  bl.forEach((rings, b) => {
    const o = bp.length / 3, bh = rnd();
    rings.forEach((ring) => ring.forEach((p) => { bp.push(p.x, p.y, p.z); bn.push(0.55 * bh + 0.45 * rnd()); }));
    for (let s = 0; s < SPAN; s++) for (let j = 0; j < LOOP; j++) {
      const a = o + s * LOOP + j, b2 = o + s * LOOP + ((j + 1) % LOOP), c = a + LOOP, d = b2 + LOOP;
      bi.push(a, c, b2, b2, c, d);
    }
    // tip cap
    const tip = rings[SPAN], cIdx = bp.length / 3, cc = new THREE.Vector3();
    tip.forEach((p) => cc.add(p)); cc.multiplyScalar(1 / LOOP);
    bp.push(cc.x, cc.y, cc.z); bn.push(0.55 * bh + 0.45 * rnd());
    for (let j = 0; j < LOOP; j++) bi.push(o + SPAN * LOOP + j, o + SPAN * LOOP + ((j + 1) % LOOP), cIdx);
  });
  const blades = new THREE.BufferGeometry();
  blades.setAttribute('position', new THREE.Float32BufferAttribute(bp, 3));
  blades.setAttribute('aN', new THREE.Float32BufferAttribute(bn, 1));
  blades.setIndex(bi);
  blades.computeVertexNormals();

  // ---- hub spinner (ogive nose + barrel), lathe around Y then turned to the Z axis
  const prof: THREE.Vector2[] = [];
  for (let s = 0; s <= 18; s++) { const u = s / 18, h = lerp(1.02, 0.08, u), q = (h - 0.08) / 0.94; prof.push(new THREE.Vector2(Math.max(0.004, R_HUB * Math.pow(Math.max(0, 1 - q * q), 0.5) * (1 - 0.42 * q)), h)); }
  prof.push(new THREE.Vector2(R_HUB, -0.62), new THREE.Vector2(R_HUB * 0.86, -0.66));
  const hub = new THREE.LatheGeometry(prof, 56); hub.rotateX(Math.PI / 2);
  withNoise(hub, 41, () => 0.15, 0.7);

  // ---- casing: inner wall, rounded lip, outer skin (a short nacelle ring)
  const cp: THREE.Vector2[] = [new THREE.Vector2(CASING_R, -0.62)];
  for (let s = 0; s <= 10; s++) { const a = Math.PI - (s / 10) * Math.PI; cp.push(new THREE.Vector2(CASING_R + 0.15 + 0.15 * Math.cos(a), 0.3 + 0.13 * Math.sin(a))); }
  cp.push(new THREE.Vector2(CASING_R + 0.34, -0.25), new THREE.Vector2(CASING_R + 0.38, -0.95));
  const casing = new THREE.LatheGeometry(cp, 120); casing.rotateX(Math.PI / 2);
  withNoise(casing, 43, () => 0, 1);

  // ---- stator vanes behind the fan + core barrel
  const vanes: THREE.BufferGeometry[] = [];
  for (let k = 0; k < 30; k++) {
    const v = new THREE.BoxGeometry(CASING_R - 0.78, 0.035, 0.36, 6, 1, 1);
    v.translate((CASING_R + 0.78) / 2, 0, 0); v.rotateX(0.22); v.rotateZ((k / 30) * Math.PI * 2); v.translate(0, 0, -0.86);
    vanes.push(v);
  }
  const core = new THREE.CylinderGeometry(0.8, 0.86, 1.7, 48, 4, true); core.rotateX(Math.PI / 2); core.translate(0, 0, -1.55);
  const stator = withNoise(mergeIndexed([...vanes, core]), 47, () => 0.2, 0.8);

  // ---- floating casing rings (a technical, slightly exploded look)
  const r1 = new THREE.TorusGeometry(CASING_R + 0.62, 0.016, 8, 180); r1.translate(0, 0, -0.1);
  const r2 = new THREE.TorusGeometry(CASING_R + 0.5, 0.008, 6, 180); r2.translate(0, 0, 0.42);
  const rings = withNoise(mergeIndexed([r1, r2]), 53, () => 0, 1);

  // ---- luminous edges: blade leading/trailing edges + tip loops, lip ring, hub ring, tick ring
  const ep: number[] = [], en: number[] = [];
  const seg = (a: THREE.Vector3, b: THREE.Vector3, n: number) => { ep.push(a.x, a.y, a.z, b.x, b.y, b.z); en.push(n, n); };
  bl.forEach((rings2) => {
    const n = 0.55 * rnd() + 0.2;
    for (let s = 0; s < SPAN; s++) { seg(rings2[s][0], rings2[s + 1][0], n); seg(rings2[s][LOOP / 2], rings2[s + 1][LOOP / 2], n); }
    for (let j = 0; j < LOOP; j++) seg(rings2[SPAN][j], rings2[SPAN][(j + 1) % LOOP], n);
  });
  const circle = (r: number, z: number, n: number, nSeg = 160) => {
    for (let k = 0; k < nSeg; k++) {
      const a0 = (k / nSeg) * Math.PI * 2, a1 = ((k + 1) / nSeg) * Math.PI * 2;
      seg(new THREE.Vector3(r * Math.cos(a0), r * Math.sin(a0), z), new THREE.Vector3(r * Math.cos(a1), r * Math.sin(a1), z), n + 0.1 * rnd());
    }
  };
  circle(CASING_R + 0.15, 0.43, 0.15); circle(CASING_R + 0.02, 0.3, 0.2); circle(R_HUB + 0.003, 0.08, 0.85, 90);
  for (let k = 0; k < 96; k++) {
    const a = (k / 96) * Math.PI * 2, r0 = CASING_R + 0.66, r1b = r0 + (k % 8 === 0 ? 0.16 : 0.07);
    seg(new THREE.Vector3(r0 * Math.cos(a), r0 * Math.sin(a), -0.1), new THREE.Vector3(r1b * Math.cos(a), r1b * Math.sin(a), -0.1), 0.05 + 0.1 * rnd());
  }
  const edges = new THREE.BufferGeometry();
  edges.setAttribute('position', new THREE.Float32BufferAttribute(ep, 3));
  edges.setAttribute('aN', new THREE.Float32BufferAttribute(en, 1));

  // ---- glow beads sampled densely along the blade edges (fake bloom)
  const gp: number[] = [], gn: number[] = [];
  bl.forEach((rings2) => {
    const n = 0.55 * rnd() + 0.2;
    for (const j of [0, LOOP / 2]) for (let s = 0; s < SPAN; s++) for (let q = 0; q < 6; q++) {
      const p = rings2[s][j].clone().lerp(rings2[s + 1][j], q / 6); gp.push(p.x, p.y, p.z); gn.push(n);
    }
  });
  for (let k = 0; k < 720; k++) { const a = (k / 720) * Math.PI * 2, r = CASING_R + 0.15; gp.push(r * Math.cos(a), r * Math.sin(a), 0.43); gn.push(0.15 + 0.1 * rnd()); }
  const glow = new THREE.BufferGeometry();
  glow.setAttribute('position', new THREE.Float32BufferAttribute(gp, 3));
  glow.setAttribute('aN', new THREE.Float32BufferAttribute(gn, 1));

  // ---- spinner swirl (the classic painted spiral on a fan spinner)
  const sp: number[] = [], sn: number[] = [];
  for (let s = 0; s <= 140; s++) {
    const u = s / 140, h = lerp(0.98, 0.1, u), q = (h - 0.08) / 0.94, r = 1.012 * R_HUB * Math.sqrt(Math.max(0, 1 - q * q)) * (1 - 0.42 * q), a = u * Math.PI * 1.7;
    sp.push(r * Math.cos(a), r * Math.sin(a), h); sn.push(0.9);
  }
  const spiral = new THREE.BufferGeometry();
  spiral.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
  spiral.setAttribute('aN', new THREE.Float32BufferAttribute(sn, 1));

  // ---- vertex cloud for the dissolve: every solid vertex
  const parts = [blades, hub, casing, stator, rings];
  let count = 0; parts.forEach((g) => { count += g.attributes.position.count; });
  const pos = new Float32Array(count * 3), n = new Float32Array(count);
  let o = 0;
  parts.forEach((g) => {
    const p = g.attributes.position.array as ArrayLike<number>, nn = g.attributes.aN.array as ArrayLike<number>;
    for (let i = 0; i < g.attributes.position.count; i++) { pos[(o + i) * 3] = p[i * 3]; pos[(o + i) * 3 + 1] = p[i * 3 + 1]; pos[(o + i) * 3 + 2] = p[i * 3 + 2]; n[o + i] = nn[i]; }
    o += g.attributes.position.count;
  });
  return { blades, hub, casing, stator, rings, edges, glow, spiral, cloud: { pos, n, count }, rMax: CASING_R + 0.8 };
}

const ni = (g: THREE.BufferGeometry) => (g.index ? g : g);

/** merge geometries (made non-indexed) keeping position, normal and, when every input has it, aN */
function mergeGeos(list: THREE.BufferGeometry[]) {
  const src = list.map((g) => { const h = ni(g); if (!h.attributes.normal) h.computeVertexNormals(); return h; });
  const names = ['position', 'normal', ...(src.every((g) => g.attributes.aN) ? ['aN'] : [])];
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

/** merge indexed geometries into one indexed geometry (no duplicated vertices) */
function mergeIndexed(list: THREE.BufferGeometry[]) {
  let n = 0, ni2 = 0; list.forEach((g) => { n += g.attributes.position.count; ni2 += g.index ? g.index.count : g.attributes.position.count; });
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), idx: number[] = [];
  let o = 0;
  list.forEach((g) => {
    if (!g.attributes.normal) g.computeVertexNormals();
    pos.set(g.attributes.position.array as Float32Array, o * 3); nor.set(g.attributes.normal.array as Float32Array, o * 3);
    if (g.index) { const ix = g.index.array; for (let i = 0; i < ix.length; i++) idx.push(ix[i] + o); }
    else for (let i = 0; i < g.attributes.position.count; i++) idx.push(i + o);
    o += g.attributes.position.count;
  });
  void ni2;
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  out.setIndex(idx);
  return out;
}

/** dissolve metric shared by meshes, edges and the vertex cloud: small = goes first (outer rim), large = last (hub) */
export const dissolveMetric = (x: number, y: number, n: number, rMax: number) => 1 - Math.min(1, Math.hypot(x, y) / rMax) * 0.7 + 0.3 * n;

// ============================================================================================ cut material
/**
 * MeshStandardMaterial with a moving cut front. mode 0: turbine dissolve (radial + noise); 1: radial reveal from the axis;
 * 2: linear reveal along `axis` between a0 and a1. sign -1 = discard where metric < cut (dissolve), +1 = discard where
 * metric > cut (reveal). The front glows (cyan) and `flash` adds a global emissive pulse (assembly lock).
 */
export function cutMaterial(params: THREE.MeshStandardMaterialParameters, mode: number, sign: number, r = 1) {
  const m = new THREE.MeshStandardMaterial(params);
  const u = {
    uCut: { value: sign < 0 ? -1 : 2 }, uSign: { value: sign }, uMode: { value: mode }, uR: { value: r },
    uAxis: { value: new THREE.Vector3(1, 0, 0) }, uA: { value: new THREE.Vector2(0, 1) },
    uGlow: { value: new THREE.Color('#5CE1FF') }, uGlowW: { value: 0.045 }, uGlowAmt: { value: 2.2 }, uFlash: { value: 0 },
    uClip: { value: new THREE.Vector4(-1e6, -1e6, 1e6, 1e6) },
  };
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, u);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float aN;\nvarying vec3 vLocal;\nvarying float vN;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvLocal = position;\nvN = aN;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
uniform float uCut, uSign, uMode, uR, uGlowW, uGlowAmt, uFlash;
uniform vec3 uAxis, uGlow;
uniform vec2 uA;
uniform vec4 uClip;
varying vec3 vLocal;
varying float vN;
float cutHash(vec3 p) { return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }
float cutMetric() {
  if (uMode < 0.5) return 1.0 - clamp(length(vLocal.xy) / uR, 0.0, 1.0) * 0.7 + 0.3 * vN;
  if (uMode < 1.5) return length(vLocal.xy) / uR;
  if (uMode < 2.5) return (dot(vLocal, uAxis) - uA.x) / (uA.y - uA.x);
  return 1.0 - clamp(length(vLocal.xy) / uR, 0.0, 1.0) * 0.8 + 0.2 * cutHash(floor(vLocal * 30.0));
}`)
      .replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>
if (gl_FragCoord.x < uClip.x || gl_FragCoord.x > uClip.z || gl_FragCoord.y < uClip.y || gl_FragCoord.y > uClip.w) discard;
float cm = cutMetric();
if (uSign * (cm - uCut) > 0.0) discard;
float cg = 1.0 - smoothstep(0.0, uGlowW, abs(cm - uCut));`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
totalEmissiveRadiance += uGlow * (cg * uGlowAmt + uFlash);`);
  };
  m.customProgramCacheKey = () => 'mech-cut-v2';
  return { m, u };
}

// ============================================================================================ glow lines / points
/** additive cyan lines or soft points that fade out with the same dissolve front as the meshes (scene 01) */
export function dissolveLineMaterial(points: boolean, size = 3) {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uCut: { value: -1 }, uR: { value: 2.9 }, uColor: { value: new THREE.Color('#5CE1FF') }, uAlpha: { value: 1 }, uFlash: { value: 0 },
      uSize: { value: size }, uScale: { value: 1 } },
    vertexShader: `
      attribute float aN; uniform float uCut, uR, uSize, uScale; varying float vA;
      void main() {
        float cm = 1.0 - clamp(length(position.xy) / uR, 0.0, 1.0) * 0.7 + 0.3 * aN;
        vA = smoothstep(uCut - 0.002, uCut + 0.06, cm) * (1.0 + 2.5 * (1.0 - smoothstep(0.0, 0.05, abs(cm - uCut))));
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        ${points ? 'gl_PointSize = uSize * uScale * clamp(10.0 / -mv.z, 0.4, 4.0);' : ''}
      }`,
    fragmentShader: `
      uniform vec3 uColor; uniform float uAlpha, uFlash; varying float vA;
      void main() {
        float a = 1.0;
        ${points ? 'vec2 d = gl_PointCoord - 0.5; a = exp(-dot(d, d) * 14.0);' : ''}
        gl_FragColor = vec4(uColor * (1.0 + uFlash), a * vA * uAlpha);
      }`,
  });
}

// ============================================================================================ camera with a shifted centre
/** camera at pos looking at target whose optical centre lands on screen pixel (cx, cy) (setViewOffset) */
export const ViewCam: React.FC<{ pos: V3; target: V3; fov: number; cx: number; cy: number }> = ({ pos, target, fov, cx, cy }) => {
  const { camera, size } = useThree();
  useLayoutEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    cam.position.set(...pos);
    cam.up.set(0, 1, 0);
    cam.lookAt(...target);
    cam.fov = fov;
    cam.near = 0.05; cam.far = 400;
    cam.aspect = size.width / size.height;
    const ox = size.width / 2 - cx, oy = size.height / 2 - cy;
    if (Math.abs(ox) > 0.01 || Math.abs(oy) > 0.01) cam.setViewOffset(size.width, size.height, ox, oy, size.width, size.height);
    else cam.clearViewOffset();
    cam.updateProjectionMatrix();
    cam.updateMatrixWorld();
  });
  return null;
};

/** the same projection in plain JS (for DOM overlays that follow 3D points: cursor, gizmo) */
export function makeProjector(W: number, H: number) {
  const cam = new THREE.PerspectiveCamera(35, W / H, 0.05, 400);
  const v = new THREE.Vector3();
  return (pos: V3, target: V3, fov: number, cx: number, cy: number, p: V3) => {
    cam.position.set(...pos); cam.up.set(0, 1, 0); cam.lookAt(...target); cam.fov = fov; cam.aspect = W / H;
    const ox = W / 2 - cx, oy = H / 2 - cy;
    if (Math.abs(ox) > 0.01 || Math.abs(oy) > 0.01) cam.setViewOffset(W, H, ox, oy, W, H); else cam.clearViewOffset();
    cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    v.set(...p).project(cam);
    return [(v.x + 1) * 0.5 * W, (1 - v.y) * 0.5 * H, v.z] as [number, number, number];
  };
}

// ============================================================================================ gear world (scene 04)
export interface WorldPart {
  key: string; solid: THREE.BufferGeometry; edges: THREE.BufferGeometry; color: string; metal: number; rough: number;
  /** reveal metric: mode 1 radial (r = radius) or mode 2 along axis */ mode: number; r: number; axis?: V3; a?: [number, number];
  /** which moving group it belongs to: gear index, 'rod', 'piston', or 'static' */ group: string;
  /** reveal centre for sorting the edge flight (local xy) */
}

function edgesOf(g: THREE.BufferGeometry, deg = 28) { return new THREE.EdgesGeometry(g, deg); }

/** all parts of the mechanical world, in flight order (gear 0 first) */
export function buildGearWorld(): WorldPart[] {
  const parts: WorldPart[] = [];
  TRAIN.forEach((g, i) => {
    const rp = rpOf(g.z);
    const body = new THREE.ExtrudeGeometry(gearShape(g.z, MODULE, i === 0 ? 0.2 : 0.13, g.holes),
      { depth: GEAR_DEPTH, bevelEnabled: true, bevelThickness: 0.022, bevelSize: 0.016, bevelOffset: -0.016, bevelSegments: 1, curveSegments: 36, steps: 1 });
    body.translate(0, 0, -GEAR_DEPTH / 2);
    const bossR = Math.min(0.36, rp * 0.34);
    const boss = new THREE.CylinderGeometry(bossR, bossR, GEAR_DEPTH + 0.14, 44, 1, false); boss.rotateX(Math.PI / 2);
    const bodyN = body, bossN = boss;
    const solid = mergeGeos([bodyN, bossN]);
    const e1 = edgesOf(body), e2 = edgesOf(boss, 30);
    const extra: THREE.BufferGeometry[] = [e1, e2];
    if (i === CRANK.gear) {
      const pin = new THREE.CylinderGeometry(0.075, 0.075, 0.26, 24); pin.rotateX(Math.PI / 2); pin.translate(CRANK.r, 0, GEAR_DEPTH / 2 + 0.12);
      const pinN = pin;
      solid.dispose();
      parts.push({ key: `gear${i}`, solid: mergeGeos([bodyN, bossN, pinN]), edges: mergeLines([...extra, edgesOf(pin, 30)]), color: g.color, metal: 1, rough: 0.3, mode: 1, r: raOf(g.z) + 0.02, group: `g${i}` });
      return;
    }
    parts.push({ key: `gear${i}`, solid, edges: mergeLines(extra), color: g.color, metal: 1, rough: i === 0 ? 0.24 : 0.32, mode: 1, r: raOf(g.z) + 0.02, group: `g${i}` });
  });
  // connecting rod: a flat link with two eyes
  {
    const l = CRANK.rod, re = 0.15, w = 0.085, s = new THREE.Shape();
    const s0 = Math.sqrt(re * re - w * w), aw = Math.asin(w / re);
    s.moveTo(s0, -w); s.lineTo(l - s0, -w);
    s.absarc(l, 0, re, Math.PI + aw, 3 * Math.PI - aw, false);
    s.lineTo(s0, w);
    s.absarc(0, 0, re, aw, 2 * Math.PI - aw, false);
    const h1 = new THREE.Path(); h1.absarc(0, 0, 0.075, 0, Math.PI * 2, true); s.holes.push(h1);
    const h2 = new THREE.Path(); h2.absarc(l, 0, 0.075, 0, Math.PI * 2, true); s.holes.push(h2);
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.08, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.01, bevelOffset: -0.01, bevelSegments: 1, curveSegments: 24 });
    g.translate(0, 0, -0.04);
    parts.push({ key: 'rod', solid: mergeGeos([g]), edges: mergeLines([edgesOf(g)]), color: '#D5DBE5', metal: 1, rough: 0.22, mode: 2, r: 1, axis: [1, 0, 0], a: [-0.2, l + 0.2], group: 'rod' });
  }
  // piston (slides along +X), pin at its left end
  {
    const g = new THREE.CylinderGeometry(0.3, 0.3, 0.72, 48, 1, false); g.rotateZ(Math.PI / 2); g.translate(0.22, 0, 0);
    const ring1 = new THREE.TorusGeometry(0.3, 0.012, 6, 48); ring1.rotateY(Math.PI / 2); ring1.translate(0.42, 0, 0);
    const ring2 = ring1.clone(); ring2.translate(0.1, 0, 0);
    parts.push({ key: 'piston', solid: mergeGeos([g, ring1, ring2]), edges: mergeLines([edgesOf(g, 30), edgesOf(ring1, 60), edgesOf(ring2, 60)]), color: '#AEB8C8', metal: 1, rough: 0.2, mode: 2, r: 1, axis: [1, 0, 0], a: [-0.15, 0.6], group: 'piston' });
  }
  // cut-away cylinder sleeve (front quadrant open so the piston shows), along +X from the crank gear
  const [c1x, c1y] = GEAR_CENTRES[CRANK.gear];
  {
    const x0 = c1x + CRANK.rod - 0.05, len = 1.55;
    const prof = [new THREE.Vector2(0.34, 0), new THREE.Vector2(0.42, 0), new THREE.Vector2(0.42, len), new THREE.Vector2(0.34, len), new THREE.Vector2(0.34, 0)];
    const g = new THREE.LatheGeometry(prof, 40, Math.PI * 0.3, Math.PI * 1.4); g.rotateZ(-Math.PI / 2); g.translate(x0, c1y, CRANK.z);
    const flange = new THREE.TorusGeometry(0.43, 0.025, 8, 40); flange.rotateY(Math.PI / 2); flange.translate(x0 + len, c1y, CRANK.z);
    const mount = new THREE.BoxGeometry(0.5, 0.16, CRANK.z + 0.42); mount.translate(x0 + len * 0.6, c1y - 0.42, (CRANK.z - 0.45) / 2);
    parts.push({ key: 'sleeve', solid: mergeGeos([g, flange, mount]), edges: mergeLines([edgesOf(g, 40), edgesOf(flange, 70), edgesOf(mount)]), color: '#7E889A', metal: 0.9, rough: 0.35, mode: 2, r: 1, axis: [1, 0, 0], a: [x0 - 0.1, x0 + len + 0.1], group: 'static' });
  }
  // shafts + back plate
  {
    const shafts: THREE.BufferGeometry[] = [], se: THREE.BufferGeometry[] = [];
    GEAR_CENTRES.forEach(([x, y], i) => {
      const r = i === 0 ? 0.19 : 0.12;
      const s = new THREE.CylinderGeometry(r, r, 0.95, 28); s.rotateX(Math.PI / 2); s.translate(x, y, -0.06);
      shafts.push(s); se.push(edgesOf(s, 30));
    });
    const minX = -2.55, maxX = c1x + CRANK.rod + 1.85, minY = -3.5, maxY = 2.55, rr = 0.34;
    const p = new THREE.Shape();
    p.moveTo(minX + rr, minY); p.lineTo(maxX - rr, minY); p.absarc(maxX - rr, minY + rr, rr, -Math.PI / 2, 0, false);
    p.lineTo(maxX, maxY - rr); p.absarc(maxX - rr, maxY - rr, rr, 0, Math.PI / 2, false);
    p.lineTo(minX + rr, maxY); p.absarc(minX + rr, maxY - rr, rr, Math.PI / 2, Math.PI, false);
    p.lineTo(minX, minY + rr); p.absarc(minX + rr, minY + rr, rr, Math.PI, Math.PI * 1.5, false);
    GEAR_CENTRES.forEach(([x, y]) => { const h = new THREE.Path(); h.absarc(x, y, 0.3, 0, Math.PI * 2, true); p.holes.push(h); });
    const plate = new THREE.ExtrudeGeometry(p, { depth: 0.1, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelOffset: -0.02, bevelSegments: 1, curveSegments: 18 });
    plate.translate(0, 0, -0.62);
    parts.push({ key: 'frame', solid: mergeGeos([plate, ...shafts]), edges: mergeLines([edgesOf(plate, 35), ...se]), color: '#2A3244', metal: 0.75, rough: 0.48, mode: 2, r: 1, axis: [1, 0, 0], a: [minX, maxX], group: 'static' });
  }
  parts.forEach((p, i) => withNoise(p.solid, 70 + i, () => 0, 1));
  return parts;
}

function mergeLines(list: THREE.BufferGeometry[]) {
  let n = 0; list.forEach((g) => { n += g.attributes.position.count; });
  const pos = new Float32Array(n * 3);
  let o = 0;
  list.forEach((g) => { pos.set(g.attributes.position.array as Float32Array, o * 3); o += g.attributes.position.count; });
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  return out;
}

/** bounding box of the assembled world (for framing) */
export const WORLD_BOUNDS = (() => {
  const [c1x] = GEAR_CENTRES[CRANK.gear];
  return { minX: -2.55, maxX: c1x + CRANK.rod + 1.85, minY: -3.5, maxY: 2.55 };
})();

// ---------------------------------------------------------------------------------------------- code-to-edge flight
/**
 * Flight attributes: each edge segment starts as a short horizontal dash on a code row (screen px) and flies to its true
 * 3D place. `cells` are the non-space characters of the code (screen px of the cell's left/centre, cell width), `dep(c)`
 * the departure frame of character c. Segments are given to characters in order (part by part, sorted by angle around
 * the part), so each code row becomes a sweep of a part.
 */
export interface Cell { x: number; y: number; w: number; h: number; dep: number }
export function flightGeometries(parts: WorldPart[], cells: Cell[], seed = 9) {
  const rnd = mulberry32(seed);
  let total = 0; parts.forEach((p) => { total += p.edges.attributes.position.count / 2; });
  let k = 0;
  return parts.map((p) => {
    const pos = p.edges.attributes.position.array as Float32Array, nSeg = pos.length / 6;
    // order this part's segments by angle around its local centre (so a code row sweeps around a gear)
    const order = Array.from({ length: nSeg }, (_, i) => i);
    const ang = order.map((i) => Math.atan2((pos[i * 6 + 1] + pos[i * 6 + 4]) / 2, (pos[i * 6] + pos[i * 6 + 3]) / 2));
    order.sort((a, b) => ang[a] - ang[b]);
    const P = new Float32Array(nSeg * 6), S = new Float32Array(nSeg * 4), D = new Float32Array(nSeg * 2), R = new Float32Array(nSeg * 2);
    order.forEach((src, j) => {
      P.set(pos.subarray(src * 6, src * 6 + 6), j * 6);
      const c = cells[Math.min(cells.length - 1, Math.floor((k / total) * cells.length))];
      const vy = (rnd() - 0.5) * c.h * 0.62, x0 = c.x + c.w * (0.08 + 0.2 * rnd()), x1 = c.x + c.w * (0.72 + 0.2 * rnd());
      S[j * 4] = x0; S[j * 4 + 1] = c.y + vy; S[j * 4 + 2] = x1; S[j * 4 + 3] = c.y + vy;
      const d = c.dep + rnd() * 3; D[j * 2] = d; D[j * 2 + 1] = d;
      const r = rnd(); R[j * 2] = r; R[j * 2 + 1] = r;
      k++;
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(P, 3));
    g.setAttribute('aStart', new THREE.BufferAttribute(S, 2));
    g.setAttribute('aDep', new THREE.BufferAttribute(D, 1));
    g.setAttribute('aR', new THREE.BufferAttribute(R, 1));
    return g;
  });
}

/** last arrival frame of each part's segments */
export function arrivals(geos: THREE.BufferGeometry[], travel: number) {
  return geos.map((g) => { const d = g.attributes.aDep.array as Float32Array; let m = 0; for (let i = 0; i < d.length; i++) m = Math.max(m, d[i]); return m + travel; });
}

export function flightMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: {
      uF: { value: 0 }, uTravel: { value: 26 }, uRes: { value: new THREE.Vector2(1920, 1080) }, uOff: { value: new THREE.Vector2(0, 0) },
      uTanHalf: { value: Math.tan((17 * Math.PI) / 180) }, uDepth: { value: 6 }, uColor: { value: new THREE.Color('#5CE1FF') },
      uHot: { value: new THREE.Color('#E8FBFF') }, uWire: { value: 0.4 }, uAlpha: { value: 1 }, uFlash: { value: 0 }, uPx: { value: new THREE.Vector2(0, 0) },
      uClip: { value: new THREE.Vector4(-1e6, -1e6, 1e6, 1e6) },
    },
    vertexShader: `
      attribute vec2 aStart; attribute float aDep; attribute float aR;
      uniform float uF, uTravel, uTanHalf, uDepth; uniform vec2 uRes, uOff, uPx;
      varying float vT; varying float vLand; varying float vPre;
      vec3 pxToView(vec2 px) {
        vec2 q = px + uOff; float k = 2.0 * uTanHalf * uDepth / uRes.y;
        return vec3((q.x - 0.5 * uRes.x) * k, -(q.y - 0.5 * uRes.y) * k, -uDepth);
      }
      void main() {
        float trav = uTravel * (0.85 + 0.3 * aR);
        float t = clamp((uF - aDep) / trav, 0.0, 1.0);
        float e = t < 0.5 ? 4.0 * t * t * t : 1.0 - pow(-2.0 * t + 2.0, 3.0) / 2.0;
        vec3 p3 = (modelViewMatrix * vec4(position, 1.0)).xyz;
        vec3 p0 = pxToView(aStart);
        vec3 p1 = p0 + vec3(0.0, 0.0, uDepth * 0.28);
        vec3 p2 = p3 + vec3(0.0, uDepth * 0.08 * (aR - 0.5), uDepth * 0.5);
        float u = 1.0 - e;
        vec3 p = u * u * u * p0 + 3.0 * u * u * e * p1 + 3.0 * u * e * e * p2 + e * e * e * p3;
        gl_Position = projectionMatrix * vec4(p, 1.0);
        gl_Position.xy += uPx * 2.0 / uRes * gl_Position.w;
        vT = t;
        vLand = clamp((uF - aDep - trav) / 10.0, 0.0, 1.0);
        vPre = smoothstep(aDep - 6.0, aDep, uF);
      }`,
    fragmentShader: `
      uniform vec3 uColor, uHot; uniform float uWire, uAlpha, uFlash; uniform vec4 uClip; varying float vT; varying float vLand; varying float vPre;
      void main() {
        if (vT >= 0.9999 && (gl_FragCoord.x < uClip.x || gl_FragCoord.x > uClip.z || gl_FragCoord.y < uClip.y || gl_FragCoord.y > uClip.w)) discard;
        float flying = step(0.0001, vT) * (1.0 - step(0.9999, vT));
        float a = vT >= 0.9999 ? mix(1.0, uWire, vLand) + uFlash : (vT > 0.0 ? 0.95 : 0.55 * vPre);
        vec3 c = mix(uColor, uHot, flying * (1.0 - vT) * 0.8 + (1.0 - vLand) * step(0.9999, vT) * 0.5);
        gl_FragColor = vec4(c, a * uAlpha);
      }`,
  });
}
