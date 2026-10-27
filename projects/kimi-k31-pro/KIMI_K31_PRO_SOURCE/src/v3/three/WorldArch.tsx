// 3D · ARCHITECTURE SIMULATION world: a white-clay city model on a seamless base, a site plan drawn on the ground, and a
// parametric twisting tower (superellipse floor plates, twist + taper + slight entasis) that assembles floor by floor on
// the beats, then gets its glass facade panel by panel. A sun-study light then sweeps the day and the shadows of the tower
// and its neighbours swing across the site. All timing comes from `archTime(f)` so the 2D overlay reads the same values.
import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { mulberry32 } from '../../lib/rng';
import { clamp, easeInOutCubic, easeOutCubic, invLerp, lerp, smootherStep } from '../../lib/anim';
import { ShadowSun, doneInst, mixHex, ramp, setInst, useGlowTex, useInstanced, useSoftRectTex, worldHook, type Vec3 } from './WorldKit';

// ------------------------------------------------------------------------------------------------ parameters
export const ARCH = { N: 28, fh: 0.92, slab: 0.17, a: 5.5, b: 4.4, n: 3.2, twist: 1.6, taper: 0.64, cols: 20, panels: 46 };
export const TOWER_H = ARCH.N * ARCH.fh;
const BEAT = 15;
/** floor groups: [first, end) land starting on beats 1, 2, 3 */
const GROUPS: [number, number, number][] = [[0, 10, 1 * BEAT], [10, 19, 2 * BEAT], [19, ARCH.N, 3 * BEAT]];
const DROP = 6;

export function floorPose(i: number) {
  const u = i / (ARCH.N - 1);
  return { y: i * ARCH.fh, rot: ARCH.twist * smootherStep(u * 0.92 + 0.04), s: lerp(1, ARCH.taper, Math.pow(u, 1.25)) * (1 + 0.055 * Math.sin(Math.PI * u)) };
}
export function floorStart(i: number) {
  const g = GROUPS.find(([a, b]) => i >= a && i < b)!;
  return g[2] + (i - g[0]) * 1.0;
}
/** superellipse outline (x, z), inset from the plate edge */
function outline(inset: number, segs = 112): [number, number][] {
  const a = ARCH.a - inset, b = ARCH.b - inset, e = 2 / ARCH.n, pts: [number, number][] = [];
  for (let k = 0; k < segs; k++) {
    const t = (k / segs) * Math.PI * 2, c = Math.cos(t), s = Math.sin(t);
    pts.push([a * Math.sign(c) * Math.abs(c) ** e, b * Math.sign(s) * Math.abs(s) ** e]);
  }
  return pts;
}
/** equally spaced points along a closed outline (by arc length) */
function alongOutline(pts: [number, number][], n: number): [number, number][] {
  const L: number[] = [0];
  for (let k = 1; k <= pts.length; k++) { const p = pts[k - 1], q = pts[k % pts.length]; L.push(L[k - 1] + Math.hypot(q[0] - p[0], q[1] - p[1])); }
  const tot = L[L.length - 1], out: [number, number][] = [];
  for (let j = 0; j < n; j++) {
    const d = (j / n) * tot; let k = 0; while (L[k + 1] < d) k++;
    const t = (d - L[k]) / (L[k + 1] - L[k]), p = pts[k], q = pts[(k + 1) % pts.length];
    out.push([lerp(p[0], q[0], t), lerp(p[1], q[1], t)]);
  }
  return out;
}

// ------------------------------------------------------------------------------------------------ timeline
export function archTime(f: number) {
  // sun study from the bar (f60): eased steps on every beat plus a steady drift
  const u = clamp((f - 60) / 58);
  const steps = u * 4, stepE = Math.floor(steps) + easeInOutCubic(steps - Math.floor(steps));
  const g = 0.45 * u + 0.55 * Math.min(4, stepE) / 4;
  const sunS = 0.13 + 0.74 * g;
  const sunOn = smootherStep(invLerp(50, 60, f));
  const floors = ARCH.N > 0 ? Array.from({ length: ARCH.N }, (_, i) => clamp((f - floorStart(i)) / DROP)) : [];
  const placed = floors.filter((p) => p >= 1).length;
  const facade = easeInOutCubic(invLerp(40, 72, f));
  const hour = 6 + sunS * 14;
  return { sunS, sunOn, floors, placed, facade, hour, plan: easeOutCubic(invLerp(-14, 10, f)), grid: easeOutCubic(invLerp(3, 20, f)), arc: easeOutCubic(invLerp(46, 62, f)) };
}
/** sun direction for day fraction s (east = +x, the sun runs through the north, -z, so noon shadows fall toward the camera) */
export function sunDir(s: number): Vec3 {
  const th = Math.PI * s, tilt = 0.8;
  return [Math.cos(th), Math.sin(th) * Math.cos(tilt), -Math.sin(th) * Math.sin(tilt)];
}
export const SUN_R = 40;

// ------------------------------------------------------------------------------------------------ geometry
function extrudeFlat(pts: [number, number][], depth: number) {
  const sh = new THREE.Shape(pts.map(([x, z]) => new THREE.Vector2(x, -z)));
  const g = new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: false, curveSegments: 1 });
  g.rotateX(-Math.PI / 2);
  return g;
}
/** open wall band around an outline from y0 to y1, uv.x = perimeter fraction, uv.y = height fraction, normals outward */
function band(pts: [number, number][], y0: number, y1: number) {
  const n = pts.length, pos: number[] = [], uv: number[] = [], idx: number[] = [];
  for (let k = 0; k <= n; k++) {
    const [x, z] = pts[k % n];
    pos.push(x, y0, z, x, y1, z); uv.push(k / n, 0, k / n, 1);
  }
  for (let k = 0; k < n; k++) { const a = k * 2, b = a + 1, c = a + 2, d = a + 3; idx.push(a, c, b, b, c, d); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals();
  // make sure the normals point outward (flip the winding if not)
  const nx = g.attributes.normal.getX(0), nz = g.attributes.normal.getZ(0), [px, pz] = pts[0];
  if (nx * px + nz * pz < 0) { for (let i = 0; i < idx.length; i += 3) { const t = idx[i + 1]; idx[i + 1] = idx[i + 2]; idx[i + 2] = t; } g.setIndex(idx); g.computeVertexNormals(); }
  return g;
}
/** flat ground ribbons for plan lines: segments (x1,z1,x2,z2) with a draw-order value per segment */
function ribbons(segs: [number, number, number, number, number][], w: number, y = 0.24) {
  const pos: number[] = [], at: number[] = [];
  segs.forEach(([x1, z1, x2, z2, t]) => {
    const dx = x2 - x1, dz = z2 - z1, l = Math.hypot(dx, dz) || 1, nx = (-dz / l) * w * 0.5, nz = (dx / l) * w * 0.5;
    const q = [[x1 - nx, z1 - nz], [x2 - nx, z2 - nz], [x2 + nx, z2 + nz], [x1 + nx, z1 + nz]];
    [0, 2, 1, 0, 3, 2].forEach((k) => { pos.push(q[k][0], y, q[k][1]); at.push(t); });
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aT', new THREE.Float32BufferAttribute(at, 1));
  return g;
}
const drawMat = (color: string, opacity: number) => new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -4,
  uniforms: { uC: { value: new THREE.Color(color) }, uO: { value: opacity }, uD: { value: 0 } },
  vertexShader: 'attribute float aT; varying float vT; void main(){ vT = aT; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `uniform vec3 uC; uniform float uO, uD; varying float vT;
    void main(){ if (vT > uD) discard; gl_FragColor = vec4(uC, uO);
    #include <colorspace_fragment>
    }`,
});

function dashed(x1: number, z1: number, x2: number, z2: number, dash: number, gap: number, t0: number, t1: number, out: [number, number, number, number, number][]) {
  const l = Math.hypot(x2 - x1, z2 - z1), n = Math.floor(l / (dash + gap));
  for (let k = 0; k <= n; k++) {
    const a = (k * (dash + gap)) / l, b = Math.min(1, (k * (dash + gap) + dash) / l);
    if (a >= 1) break;
    out.push([lerp(x1, x2, a), lerp(z1, z2, a), lerp(x1, x2, b), lerp(z1, z2, b), lerp(t0, t1, a)]);
  }
}
function circleSegs(cx: number, cz: number, r: number, n: number, t: number, out: [number, number, number, number, number][]) {
  for (let k = 0; k < n; k++) { const a0 = (k / n) * Math.PI * 2, a1 = ((k + 1) / n) * Math.PI * 2; out.push([cx + r * Math.cos(a0), cz + r * Math.sin(a0), cx + r * Math.cos(a1), cz + r * Math.sin(a1), t]); }
}

/** the city model around the site: blocks, plinths, buildings, trees (seeded) */
function buildContext() {
  const r = mulberry32(2207), P = 32, B = 24;
  const boxes: { p: Vec3; s: Vec3; ry: number }[] = [], plinths: { p: Vec3; s: Vec3 }[] = [], trees: Vec3[] = [];
  for (let bi = -4; bi <= 4; bi++) for (let bj = -4; bj <= 4; bj++) {
    const cx = bi * P, cz = bj * P, d = Math.hypot(bi, bj);
    plinths.push({ p: [cx, 0.09, cz], s: [B, 0.18, B] });
    if (bi === 0 && bj === 0) continue;
    const kind = r(), hBoost = Math.max(0, 1 - d / 5) * 0.6;
    if (kind < 0.12 && d > 1.2) { // park: a cluster of trees
      for (let k = 0; k < 14; k++) trees.push([cx + (r() - 0.5) * B * 0.8, 0, cz + (r() - 0.5) * B * 0.8]);
      continue;
    }
    if (kind < 0.45) { // perimeter block with a courtyard
      const h = 1.4 + r() * 2.6 + hBoost * 3, t = 6 + r() * 2;
      boxes.push({ p: [cx, 0.18 + h / 2, cz - (B - t) / 2 + 0.5], s: [B - 1, h, t], ry: 0 });
      boxes.push({ p: [cx, 0.18 + h * 0.4, cz + (B - t) / 2 - 0.5], s: [B - 1, h * 0.8, t], ry: 0 });
      boxes.push({ p: [cx - (B - t) / 2 + 0.5, 0.18 + h * 0.45, cz], s: [t, h * 0.9, B - 2 * t], ry: 0 });
      boxes.push({ p: [cx + (B - t) / 2 - 0.5, 0.18 + h * 0.55, cz], s: [t, h * 1.1, B - 2 * t], ry: 0 });
      if (r() < 0.4) { const th = 4 + r() * 4 + hBoost * 6; boxes.push({ p: [cx + (B - t) / 2 - 0.5, 0.18 + th / 2, cz - (B - t) / 2 + 0.5], s: [t, th, t], ry: 0 }); }
    } else if (kind < 0.75) { // podium + slim tower
      const ph = 1.4 + r() * 1.4, th = 4 + r() * 6 + hBoost * 7, tw = 6 + r() * 4;
      boxes.push({ p: [cx, 0.18 + ph / 2, cz], s: [B - 2, ph, B - 2], ry: 0 });
      boxes.push({ p: [cx + (r() - 0.5) * 6, 0.18 + ph + th / 2, cz + (r() - 0.5) * 6], s: [tw, th, tw * (0.8 + r() * 0.5)], ry: 0 });
    } else { // two slabs
      const h1 = 1.8 + r() * 4 + hBoost * 4, h2 = 1.8 + r() * 4 + hBoost * 4;
      boxes.push({ p: [cx - 5.5, 0.18 + h1 / 2, cz], s: [9, h1, B - 3], ry: 0 });
      boxes.push({ p: [cx + 5.5, 0.18 + h2 / 2, cz], s: [9, h2, B - 3], ry: 0 });
    }
  }
  // street trees along the roads (both sides), near the centre
  for (let k = -3; k <= 4; k++) {
    const road = k * P - P / 2;
    for (let s = -110; s <= 110; s += 7) {
      const q = (((s + P / 2) % P) + P) % P;
      if (q < 4.8 || q > P - 4.8) continue;
      const jitter = (r() - 0.5) * 0.6;
      if (r() < 0.82) trees.push([road - 3.1, 0, s + jitter]);
      if (r() < 0.82) trees.push([road + 3.1, 0, s + jitter]);
      if (r() < 0.82) trees.push([s + jitter, 0, road - 3.1]);
      if (r() < 0.82) trees.push([s + jitter, 0, road + 3.1]);
    }
  }
  // the site's own plaza trees
  for (let k = 0; k < 10; k++) { const a = (k / 10) * Math.PI * 2 + 0.2; trees.push([Math.cos(a) * 9.8, 0, Math.sin(a) * 9.8]); }
  // keep the tower footprint and the plaza ring clear
  const t2 = trees.filter(([x, , z]) => !(Math.abs(x) < 11.5 && Math.abs(z) < 11.5) || Math.hypot(x, z) > 9);
  return { boxes, plinths, trees: t2 };
}

// ------------------------------------------------------------------------------------------------ the world
export const ArchWorld: React.FC<{ f: number }> = ({ f }) => {
  const T = archTime(f);
  const glow = useGlowTex();
  const soft = useSoftRectTex();

  const geo = useMemo(() => {
    const plate = outline(0), glassLine = outline(0.16), colPts = alongOutline(outline(0.55), ARCH.cols);
    return {
      slab: extrudeFlat(plate, ARCH.slab),
      glass: band(glassLine, ARCH.slab, ARCH.fh),
      col: new THREE.CylinderGeometry(0.11, 0.11, ARCH.fh - ARCH.slab, 10),
      edge: new THREE.BufferGeometry().setFromPoints(plate.map(([x, z]) => new THREE.Vector3(x, ARCH.slab + 0.004, z))),
      colPts,
      box: new THREE.BoxGeometry(1, 1, 1),
      tree: new THREE.IcosahedronGeometry(1, 2),
      stick: new THREE.CylinderGeometry(0.06, 0.08, 1, 6),
      plane: new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2),
    };
  }, []);

  const mats = useMemo(() => {
    const clayHero = new THREE.MeshStandardMaterial({ color: '#FBFAF7', roughness: 0.82, metalness: 0, envMapIntensity: 0.45 });
    const clay = new THREE.MeshStandardMaterial({ color: '#F1EEE8', roughness: 0.9, metalness: 0, envMapIntensity: 0.45 });
    const clayTree = new THREE.MeshStandardMaterial({ color: '#F5F3EE', roughness: 0.95, metalness: 0, envMapIntensity: 0.45 });
    const ground = new THREE.MeshStandardMaterial({ color: '#E7E3DC', roughness: 1, metalness: 0, envMapIntensity: 0.45 });
    const plinth = new THREE.MeshStandardMaterial({ color: '#F4F1EB', roughness: 0.95, metalness: 0, envMapIntensity: 0.45 });
    const site = new THREE.MeshStandardMaterial({ color: '#E2DDD3', roughness: 0.95, metalness: 0, envMapIntensity: 0.45 });
    const ao = new THREE.MeshBasicMaterial({ color: '#5A5246', transparent: true, opacity: 0.26, alphaMap: soft, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
    const glassU = { uCut: { value: -5 }, uGlowAmt: { value: 1 }, uPanels: { value: ARCH.panels }, uGlowC: { value: new THREE.Color('#38B6FF') } };
    const glass = worldHook(new THREE.MeshStandardMaterial({ color: '#7895AD', metalness: 0.88, roughness: 0.06, transparent: true, opacity: 0.92, envMapIntensity: 0.85 }),
      'arch-glass-v1', glassU, (s) => s
        .replace('#include <common>', '#include <common>\nuniform float uCut, uPanels, uGlowAmt; uniform vec3 uGlowC; varying vec2 vUvG;')
        .replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>
          float pid = floor(vUvG.x * uPanels);
          float fl = floor(vWp.y / ${ARCH.fh.toFixed(3)});
          float jit = wh21(vec2(pid, fl)) * 1.6 + 0.5 * sin(vUvG.x * 6.2832 * 2.0);
          float front = uCut - jit;
          if (vWp.y > front) discard;
          float edgeGlow = 1.0 - smoothstep(0.0, 1.4, front - vWp.y);
          float mu = fract(vUvG.x * uPanels);
          float mull = max(1.0 - smoothstep(0.0, 0.06, mu), smoothstep(0.94, 1.0, mu));
          mull = max(mull, 1.0 - smoothstep(0.0, 0.05, vUvG.y));
          mull = max(mull, smoothstep(0.55, 0.58, vUvG.y) * (1.0 - smoothstep(0.58, 0.61, vUvG.y)) * 0.8);`)
        .replace('#include <color_fragment>', `#include <color_fragment>
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.93, 0.93, 0.92), mull);
          diffuseColor.a = mix(diffuseColor.a, 1.0, mull);`)
        .replace('#include <metalnessmap_fragment>', '#include <metalnessmap_fragment>\nmetalnessFactor = mix(metalnessFactor, 0.0, mull);')
        .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = mix(roughnessFactor, 0.7, mull);')
        .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += uGlowC * edgeGlow * 2.4 * uGlowAmt;'),
      (v) => v.replace('#include <common>', '#include <common>\nvarying vec2 vUvG;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvUvG = uv;'));
    const edgeMats = Array.from({ length: ARCH.N }, () => new THREE.LineBasicMaterial({ color: '#2F7BFF', transparent: true, opacity: 0, depthWrite: false }));
    return { clayHero, clay, clayTree, ground, plinth, site, ao, glass, glassU, edgeMats };
  }, [soft]);

  const ctx = useMemo(buildContext, []);
  // the glass keeps its own studio reflections while the scene-wide fill is turned down for the sun study
  const { gl } = useThree();
  const roomEnv = useMemo(() => { const pm = new THREE.PMREMGenerator(gl); const t = pm.fromScene(new RoomEnvironment(), 0.04).texture; pm.dispose(); return t; }, [gl]);
  (mats.glass as THREE.MeshStandardMaterial).envMap = roomEnv;

  // ---- instanced meshes
  const slabs = useInstanced(geo.slab, mats.clayHero, ARCH.N, { cast: true, receive: true });
  const glassM = useInstanced(geo.glass, mats.glass, ARCH.N, {});
  const cols = useInstanced(geo.col, mats.clayHero, ARCH.N * ARCH.cols, { cast: true, receive: true });
  const ctxBoxes = useInstanced(geo.box, mats.clay, ctx.boxes.length, { cast: true, receive: true });
  const plinths = useInstanced(geo.box, mats.plinth, ctx.plinths.length, { receive: true, cast: true });
  const trees = useInstanced(geo.tree, mats.clayTree, ctx.trees.length, { cast: true, receive: true });
  const sticks = useInstanced(geo.stick, mats.clayTree, ctx.trees.length, { cast: false, receive: true });
  const aos = useInstanced(geo.plane, mats.ao, ctx.boxes.length, {});

  // static instances (cheap enough to set every frame, keeps the code simple and deterministic)
  useMemo(() => {
    ctx.boxes.forEach((b, i) => {
      setInst(ctxBoxes, i, b.p, b.s, b.ry);
      // contact shadow, clipped to the block's plinth so it never floats over the road
      const P = 32, bx = Math.round(b.p[0] / P) * P, bz = Math.round(b.p[2] / P) * P;
      const x0 = Math.max(bx - 12, b.p[0] - b.s[0] * 0.8 - 0.75), x1 = Math.min(bx + 12, b.p[0] + b.s[0] * 0.8 + 0.75);
      const z0 = Math.max(bz - 12, b.p[2] - b.s[2] * 0.8 - 0.75), z1 = Math.min(bz + 12, b.p[2] + b.s[2] * 0.8 + 0.75);
      setInst(aos, i, [(x0 + x1) / 2, 0.185, (z0 + z1) / 2], [x1 - x0, 1, z1 - z0]);
    });
    ctx.plinths.forEach((b, i) => setInst(plinths, i, b.p, b.s));
    const rr = mulberry32(77);
    ctx.trees.forEach((t, i) => { const s = 0.55 + rr() * 0.32; setInst(trees, i, [t[0], 0.18 + 1.25 * s + 0.4, t[2]], [s, s * 1.05, s]); setInst(sticks, i, [t[0], 0.18 + 0.6 * s, t[2]], [1, 1.2 * s, 1]); });
    [ctxBoxes, plinths, trees, sticks, aos].forEach((m) => doneInst(m));
  }, [ctx, ctxBoxes, plinths, trees, sticks, aos]);

  // ---- tower per frame
  const lineObjs = useMemo(() => mats.edgeMats.map((m) => new THREE.LineLoop(geo.edge, m)), [mats, geo]);
  let topY = 0;
  for (let i = 0; i < ARCH.N; i++) {
    const P = floorPose(i), p = T.floors[i], e = easeOutCubic(p), on = p > 0;
    const y = P.y + (1 - e) * 2.8, s = on ? P.s * (0.93 + 0.07 * e) : 0;
    if (p > 0) topY = Math.max(topY, P.y + ARCH.fh);
    setInst(slabs, i, [0, y, 0], [s, on ? 1 : 0, s], P.rot);
    setInst(glassM, i, [0, y, 0], [s, on ? 1 : 0, s], P.rot);
    const cr = Math.cos(P.rot), sr = Math.sin(P.rot);
    geo.colPts.forEach(([x, z], j) => {
      const lx = x * s, lz = z * s;
      setInst(cols, i * ARCH.cols + j, [lx * cr + lz * sr, y + ARCH.slab + (ARCH.fh - ARCH.slab) / 2, -lx * sr + lz * cr], on ? [1, 1, 1] : [0, 0, 0]);
    });
    const lo = lineObjs[i];
    lo.position.set(0, y, 0); lo.rotation.set(0, P.rot, 0); lo.scale.set(s || 1e-4, 1, s || 1e-4);
    const land = floorStart(i) + DROP;
    mats.edgeMats[i].opacity = on ? (0.12 + 0.88 * Math.exp(-Math.max(0, f - land) / 5)) * Math.min(1, p * 2) * (1 - 0.7 * T.facade) : 0;
  }
  [slabs, glassM, cols].forEach((m) => doneInst(m));
  mats.glassU.uCut.value = lerp(-2, TOWER_H + 3, T.facade);
  mats.glassU.uGlowAmt.value = Math.min(1, (1 - T.facade) * 6);
  const coreH = Math.min(TOWER_H + 1.2, Math.max(0.01, topY + 1.4 * smootherStep(invLerp(8, 15, f))));
  const crown = easeOutCubic(invLerp(floorStart(ARCH.N - 1) + 4, floorStart(ARCH.N - 1) + 12, f));

  // ---- structural grid lines: column paths up the whole height, drawn bottom-up before the floors arrive
  const gridLines = useMemo(() => {
    const m = new THREE.LineBasicMaterial({ color: '#2F7BFF', transparent: true, opacity: 0.8, depthWrite: false });
    return geo.colPts.map(([x, z]) => {
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= ARCH.N; i++) {
        const P = floorPose(Math.min(ARCH.N - 1, i)), y = i * ARCH.fh, cr = Math.cos(P.rot), sr = Math.sin(P.rot);
        pts.push(new THREE.Vector3(x * P.s * cr + z * P.s * sr, y, -x * P.s * sr + z * P.s * cr));
      }
      return new THREE.Line(new THREE.BufferGeometry().setFromPoints(new THREE.CatmullRomCurve3(pts).getPoints(ARCH.N * 4)), m);
    });
  }, [geo]);
  gridLines.forEach((l, j) => l.geometry.setDrawRange(0, Math.ceil((ARCH.N * 4 + 1) * clamp(T.grid * 1.15 - (j % 5) * 0.03))));
  (gridLines[0].material as THREE.LineBasicMaterial).opacity = 0.85 * (1 - 0.75 * smootherStep(invLerp(30, 70, f)));

  // ---- site plan drawn on the ground
  const plan = useMemo(() => {
    const solid: [number, number, number, number, number][] = [], dash: [number, number, number, number, number][] = [], fine: [number, number, number, number, number][] = [];
    // plot boundary (dash-dot) and setback (dashed)
    const pb = 11.4;
    dashed(-pb, -pb, pb, -pb, 1.6, 0.6, 0.0, 0.25, dash); dashed(pb, -pb, pb, pb, 1.6, 0.6, 0.25, 0.5, dash);
    dashed(pb, pb, -pb, pb, 1.6, 0.6, 0.5, 0.75, dash); dashed(-pb, pb, -pb, -pb, 1.6, 0.6, 0.75, 1.0, dash);
    const sb = 8.6;
    dashed(-sb, -sb, sb, -sb, 0.5, 0.45, 0.2, 0.4, fine); dashed(sb, -sb, sb, sb, 0.5, 0.45, 0.4, 0.6, fine);
    dashed(sb, sb, -sb, sb, 0.5, 0.45, 0.6, 0.8, fine); dashed(-sb, sb, -sb, -sb, 0.5, 0.45, 0.8, 1.0, fine);
    // structural grid axes with bubbles
    const xs = [-6, -3, 0, 3, 6], zs = [-4.5, -1.5, 1.5, 4.5], E = 15;
    xs.forEach((x, k) => { dashed(x, -E, x, E, 2.2, 0.35, 0.1 + k * 0.05, 0.55 + k * 0.05, fine); circleSegs(x, -E - 0.8, 0.75, 20, 0.6 + k * 0.05, solid); });
    zs.forEach((z, k) => { dashed(-E, z, E, z, 2.2, 0.35, 0.15 + k * 0.05, 0.6 + k * 0.05, fine); circleSegs(-E - 0.8, z, 0.75, 20, 0.65 + k * 0.05, solid); });
    // footprint
    const fp = outline(0, 96);
    fp.forEach(([x, z], k) => { const q = fp[(k + 1) % fp.length]; solid.push([x, z, q[0], q[1], 0.3 + 0.5 * (k / fp.length)]); });
    // plaza ring + north arrow
    circleSegs(0, 0, 9.6, 72, 0.7, fine);
    const nx = 13.6, nz = 13.6; circleSegs(nx, nz, 1.2, 28, 0.9, solid);
    solid.push([nx, nz + 0.9, nx, nz - 1.9, 0.92], [nx, nz - 1.9, nx - 0.5, nz - 1.1, 0.95], [nx, nz - 1.9, nx + 0.5, nz - 1.1, 0.95]);
    return {
      solid: new THREE.Mesh(ribbons(solid, 0.2), drawMat('#2F6FE8', 0.9)),
      dash: new THREE.Mesh(ribbons(dash, 0.24), drawMat('#2F6FE8', 0.85)),
      fine: new THREE.Mesh(ribbons(fine, 0.11), drawMat('#2F6FE8', 0.6)),
    };
  }, []);
  [plan.solid, plan.dash, plan.fine].forEach((m) => { (m.material as THREE.ShaderMaterial).uniforms.uD.value = T.plan * 1.02; });
  const planFade = 1 - 0.55 * smootherStep(invLerp(40, 80, f));
  (plan.solid.material as THREE.ShaderMaterial).uniforms.uO.value = 0.9 * planFade;
  (plan.dash.material as THREE.ShaderMaterial).uniforms.uO.value = 0.85 * planFade;
  (plan.fine.material as THREE.ShaderMaterial).uniforms.uO.value = 0.6 * planFade;

  // ---- sun-path arc (dotted, hour marks) in the sky over the site
  const arc = useMemo(() => {
    const n = 140, pos = new Float32Array(n * 3), hp = new Float32Array(15 * 3);
    for (let k = 0; k < n; k++) { const d = sunDir(k / (n - 1)); pos.set([d[0] * SUN_R, d[1] * SUN_R, d[2] * SUN_R], k * 3); }
    for (let h = 0; h <= 14; h++) { const d = sunDir(h / 14); hp.set([d[0] * SUN_R, d[1] * SUN_R, d[2] * SUN_R], h * 3); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const gh = new THREE.BufferGeometry(); gh.setAttribute('position', new THREE.BufferAttribute(hp, 3));
    return { g, gh, n };
  }, []);
  arc.g.setDrawRange(0, Math.ceil(arc.n * T.arc)); arc.gh.setDrawRange(0, Math.ceil(15 * T.arc));

  // ---- lights
  const sd = sunDir(T.sunS);
  const sunCol = ramp(['#FFC895', '#FFE9D0', '#FFF8EE', '#FFE6C8', '#FFB27A'], T.sunS);
  const sunI = T.sunOn * (5.8 - 2.4 * Math.sin(Math.PI * T.sunS));
  const keyI = 3.3 * (1 - T.sunOn);
  const sunPos: Vec3 = [sd[0] * 140, sd[1] * 140, sd[2] * 140];
  const sunSky: Vec3 = [sd[0] * SUN_R, sd[1] * SUN_R, sd[2] * SUN_R];
  const pop = T.sunOn > 0 ? Math.exp(-Math.max(0, f - 60) / 7) : 0;
  const hemiSky = mixHex('#F4F6FA', '#FFF1E2', T.sunOn), hemiGround = mixHex('#ABA295', '#B09C88', T.sunOn);

  return (
    <group>
      <hemisphereLight color={hemiSky} groundColor={hemiGround} intensity={0.46 - 0.08 * T.sunOn} />
      <ShadowSun pos={[-52, 74, 40]} intensity={keyI} color="#FFFFFF" ext={52} far={260} map={4096} radius={2.2} shadow={0.9} />
      <ShadowSun pos={sunPos} intensity={sunI} color={sunCol} ext={62} far={300} map={4096} radius={1.6} shadow={0.9} />

      {/* base */}
      <mesh geometry={geo.plane} material={mats.ground} scale={[700, 1, 700]} receiveShadow />
      <primitive object={plinths} />
      <mesh geometry={geo.box} material={mats.site} position={[0, 0.1, 0]} scale={[23.6, 0.2, 23.6]} receiveShadow />
      <primitive object={ctxBoxes} />
      <primitive object={trees} />
      <primitive object={sticks} />
      <primitive object={plan.fine} />
      <primitive object={plan.dash} />
      <primitive object={plan.solid} />

      {/* tower */}
      <mesh geometry={geo.box} material={mats.clayHero} position={[0, coreH / 2, 0]} scale={[2.9, coreH, 2.3]} castShadow receiveShadow />
      <primitive object={slabs} />
      <primitive object={cols} />
      <primitive object={glassM} />
      {lineObjs.map((l, i) => <primitive key={i} object={l} />)}
      {gridLines.map((l, i) => <primitive key={`g${i}`} object={l} />)}
      <group position={[0, TOWER_H + (1 - crown) * 3, 0]} rotation={[0, floorPose(ARCH.N - 1).rot, 0]} visible={crown > 0}>
        <mesh geometry={geo.box} material={mats.clayHero} position={[0, 0.7, 0]} scale={[4.6 * ARCH.taper, 1.4, 3.4 * ARCH.taper]} castShadow receiveShadow />
        <mesh geometry={geo.box} material={mats.clayHero} position={[0, 0.06, 0]} scale={[2 * ARCH.a * ARCH.taper * 0.96, 0.12, 2 * ARCH.b * ARCH.taper * 0.96]} castShadow receiveShadow />
        <mesh geometry={geo.stick} material={mats.clayHero} position={[0.4, 3.6, 0]} scale={[1.4, 5.4, 1.4]} castShadow />
      </group>

      {/* sun path */}
      <points geometry={arc.g}>
        <pointsMaterial map={glow} color="#FF9A3C" size={1.1} sizeAttenuation transparent opacity={0.85} depthWrite={false} toneMapped={false} />
      </points>
      <points geometry={arc.gh}>
        <pointsMaterial map={glow} color="#FF7A1A" size={2.6} sizeAttenuation transparent opacity={0.95} depthWrite={false} toneMapped={false} />
      </points>
      {T.sunOn > 0 ? (
        <group position={sunSky}>
          <sprite scale={[9 + 14 * pop, 9 + 14 * pop, 1]}>
            <spriteMaterial map={glow} color="#FFB45C" transparent opacity={0.75 * T.sunOn} depthWrite={false} toneMapped={false} blending={THREE.AdditiveBlending} />
          </sprite>
          <sprite scale={[3.2, 3.2, 1]}>
            <spriteMaterial map={glow} color="#FFF4DC" transparent opacity={T.sunOn} depthWrite={false} toneMapped={false} />
          </sprite>
        </group>
      ) : null}
    </group>
  );
};
