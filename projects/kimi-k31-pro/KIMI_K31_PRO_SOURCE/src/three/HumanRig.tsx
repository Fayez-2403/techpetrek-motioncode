// Scene 06 (HumanSimulation): the procedural musculoskeletal figure and the lab floor.
// Bones are lathe shapes (epiphyses + shaft) in lunar white; muscles are spindles between attachment points that glow
// with their activation. Everything is placed from a forward-kinematics skeleton (src/data/humanSimModel.ts) each frame;
// geometry is built once.
import React, { useMemo } from 'react';
import * as THREE from 'three';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { attach, loc, MUSCLES, type MuscleDef, type P3, type Side, type Skel } from '../data/humanSimModel';
import { WORLD } from '../styles/theme';

const Y = new THREE.Vector3(0, 1, 0);
const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));

// ------------------------------------------------------------------ geometry
/** lathe profile of a long bone: rounded epiphyses (r0 proximal, r1 distal) and a slimmer shaft */
function boneGeo(len: number, r0: number, rs: number, r1: number, e0 = 0.16, e1 = 0.16, seg = 14) {
  const pts: THREE.Vector2[] = [];
  const n = 30;
  for (let i = 0; i <= n; i++) {
    const s = i / n;
    const core = rs + (r0 - rs) * Math.exp(-((s / e0) ** 2)) + (r1 - rs) * Math.exp(-(((1 - s) / e1) ** 2));
    const cap = Math.sqrt(clamp((s * len) / (r0 * 0.9))) * Math.sqrt(clamp(((1 - s) * len) / (r1 * 0.9)));
    pts.push(new THREE.Vector2(Math.max(1e-4, core * cap), s * len));
  }
  const g = new THREE.LatheGeometry(pts, seg);
  g.computeVertexNormals();
  return g;
}

/** unit-length spindle (muscle belly), widest at `peak` */
function spindleGeo(peak = 0.5, seg = 10) {
  const pts: THREE.Vector2[] = [];
  const n = 22;
  for (let i = 0; i <= n; i++) {
    const s = i / n;
    const q = s < peak ? s / peak : (1 - s) / (1 - peak);
    pts.push(new THREE.Vector2(Math.max(1e-4, Math.sin((Math.PI / 2) * clamp(q)) ** 1.25), s));
  }
  const g = new THREE.LatheGeometry(pts, seg);
  g.computeVertexNormals();
  return g;
}

/** an elliptical rib hoop in the thorax frame (x anterior, y up, z lateral), tilted so the front sits lower */
function ribGeo(k: number) {
  const s = Math.sin((Math.PI * (k + 1)) / 11.5);
  const a = 0.07 + 0.03 * s, b = 0.095 + 0.05 * s, y = 0.07 + 0.02 * k, tilt = -0.42 - 0.03 * (9 - k);
  const open = k < 3 ? 0.55 : 0.08; // lower (floating) ribs stay open at the front
  const pts: THREE.Vector3[] = [];
  const m = 40;
  for (let i = 0; i <= m; i++) {
    const ang = open / 2 + (i / m) * (2 * Math.PI - open);
    // ellipse around a centre in front of the spine; angle 0 = front
    const ex = Math.cos(ang) * a + a * 0.82, ez = Math.sin(ang) * b;
    // tilt about z around the spine contact (x = 0)
    const x = ex * Math.cos(tilt) - 0, yy = y + ex * Math.sin(tilt);
    pts.push(new THREE.Vector3(x - 0.012, yy, ez));
  }
  const curve = new THREE.CatmullRomCurve3(pts, false);
  return new THREE.TubeGeometry(curve, 48, 0.0042, 5, false);
}

/** an iliac wing: a thin fan-shaped plate (side outline of the ilium), extruded with a soft bevel.
 *  Pelvis frame: x anterior, y up (origin at the hip joint height), z lateral. */
function iliumGeo() {
  const sh = new THREE.Shape();
  sh.moveTo(-0.02, -0.02);
  sh.splineThru([
    new THREE.Vector2(0.03, -0.005), new THREE.Vector2(0.058, 0.045), new THREE.Vector2(0.05, 0.085), new THREE.Vector2(0.012, 0.112),
    new THREE.Vector2(-0.04, 0.118), new THREE.Vector2(-0.085, 0.092), new THREE.Vector2(-0.098, 0.055), new THREE.Vector2(-0.07, 0.02),
    new THREE.Vector2(-0.02, -0.02),
  ]);
  const raw = new THREE.ExtrudeGeometry(sh, { depth: 0.006, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 3, curveSegments: 28 });
  raw.translate(0, 0, -0.003);
  raw.deleteAttribute('uv');
  const g = mergeVertices(raw, 1e-5);
  g.computeVertexNormals();
  return g;
}

/** the skull as one solid: its side profile (vault, brow, nasal, maxilla, chin, jaw angle, mastoid) extruded with a deep
 *  rounded bevel, so the silhouette reads correctly in the side views this lab uses. Head frame: x anterior, y up. */
function skullGeo() {
  const outline: [number, number][] = [[-0.098, 0.0], [-0.093, 0.045], [-0.065, 0.088], [-0.02, 0.108], [0.03, 0.104], [0.068, 0.078], [0.088, 0.04],
    [0.093, 0.012], [0.086, -0.004], [0.095, -0.03], [0.093, -0.05], [0.087, -0.062], [0.089, -0.078], [0.085, -0.1], [0.07, -0.116], [0.03, -0.11],
    [-0.004, -0.097], [-0.012, -0.07], [-0.03, -0.042], [-0.064, -0.05], [-0.09, -0.03]];
  const c: [number, number] = [0.0, -0.004], k = 0.86;
  const pts = outline.map(([x, y]) => new THREE.Vector2(c[0] + (x - c[0]) * k, c[1] + (y - c[1]) * k));
  const sh = new THREE.Shape();
  sh.moveTo(pts[0].x, pts[0].y);
  sh.splineThru([...pts.slice(1), pts[0]]);
  const depth = 0.07;
  const raw = new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: true, bevelThickness: 0.034, bevelSize: 0.014, bevelSegments: 6, curveSegments: 56 });
  raw.translate(0, 0, -depth / 2);
  raw.deleteAttribute('uv');
  const g = mergeVertices(raw, 1e-5);
  g.computeVertexNormals();
  return g;
}

/** the mandible: a U-shaped bar from jaw joint to chin and back (head frame: x anterior, y up, z lateral) */
function mandibleGeo() {
  const p = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
  const curve = new THREE.CatmullRomCurve3([p(-0.004, -0.04, -0.052), p(0.004, -0.098, -0.048), p(0.05, -0.112, -0.036), p(0.082, -0.118, 0),
    p(0.05, -0.112, 0.036), p(0.004, -0.098, 0.048), p(-0.004, -0.04, 0.052)]);
  return new THREE.TubeGeometry(curve, 40, 0.008, 6, false);
}

function useRigGeometry() {
  return useMemo(() => {
    const spindles = new Map<number, THREE.BufferGeometry>();
    for (const m of MUSCLES) { const p = m.peak ?? 0.5; if (!spindles.has(p)) spindles.set(p, spindleGeo(p)); }
    return {
      femur: boneGeo(0.43, 0.027, 0.012, 0.029, 0.1, 0.12),
      tibia: boneGeo(0.43, 0.029, 0.012, 0.019, 0.12, 0.08),
      fibula: boneGeo(0.4, 0.009, 0.0055, 0.01, 0.08, 0.08, 8),
      humerus: boneGeo(0.3, 0.024, 0.0105, 0.02, 0.12, 0.1),
      radius: boneGeo(0.255, 0.009, 0.007, 0.012, 0.1, 0.12, 8),
      ulna: boneGeo(0.255, 0.012, 0.0065, 0.008, 0.12, 0.1, 8),
      hand: boneGeo(0.17, 0.014, 0.017, 0.007, 0.25, 0.3, 10),
      calc: boneGeo(0.07, 0.016, 0.017, 0.018, 0.3, 0.3, 10),
      meta: boneGeo(0.158, 0.019, 0.011, 0.012, 0.18, 0.14, 10),
      toe: boneGeo(0.06, 0.01, 0.008, 0.006, 0.25, 0.3, 8),
      clav: boneGeo(0.15, 0.008, 0.006, 0.009, 0.15, 0.15, 8),
      sacrum: boneGeo(0.13, 0.034, 0.024, 0.01, 0.3, 0.3, 12),
      sternum: boneGeo(0.15, 0.012, 0.016, 0.01, 0.2, 0.2, 10),
      neckBone: boneGeo(0.11, 0.012, 0.009, 0.012, 0.2, 0.2, 10),
      sphere: new THREE.SphereGeometry(1, 28, 20),
      disc: new THREE.CylinderGeometry(1, 1, 1, 14, 1),
      ring: new THREE.TorusGeometry(0.044, 0.0075, 10, 40),
      ilium: iliumGeo(),
      mandible: mandibleGeo(),
      skull: skullGeo(),
      orbit: new THREE.TorusGeometry(0.019, 0.0045, 8, 24),
      ribs: Array.from({ length: 10 }, (_, k) => ribGeo(k)),
      spindles,
    };
  }, []);
}

// ------------------------------------------------------------------ placement helpers
const tmpA = new THREE.Vector3(), tmpB = new THREE.Vector3();
/** position + quaternion that point a +Y-aligned shape from a to b, and the length */
function span(a: P3, b: P3) {
  tmpA.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
  const len = tmpA.length() || 1e-6;
  tmpB.copy(tmpA).divideScalar(len);
  const q = new THREE.Quaternion().setFromUnitVectors(Y, tmpB);
  return { pos: a, q: [q.x, q.y, q.z, q.w] as [number, number, number, number], len };
}
const lerp3 = (a: P3, b: P3, t: number): P3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

// ------------------------------------------------------------------ figure
export interface FigureProps {
  k: Skel;
  /** activation 0..1 per muscle id and side ("gluteus.R") */
  act: (id: string, side: Side) => number;
  /** per-muscle colour override (e.g. the shoulder moment-arm check) */
  muscleColor?: (id: string, side: Side) => string | undefined;
  opacity?: number;
  /** build-in 0..1 per group: pelvis, legs, spine, ribs, skull, arms, muscles */
  build?: Partial<Record<'pelvis' | 'legs' | 'feet' | 'spine' | 'ribs' | 'skull' | 'arms' | 'muscles', number>>;
  /** muscle thickness multiplier (thicker reads better when the figure is small) */
  muscleScale?: number;
  /** overall emissive lift of the bones (dim lab = small) */
  boneGlow?: number;
}

const BONE = new THREE.Color(WORLD.lab.bone);
const BONE_FAR = new THREE.Color(WORLD.lab.bone).multiplyScalar(0.62);
const FLASH = new THREE.Color('#5CE1FF');

export const Figure: React.FC<FigureProps> = ({ k, act, muscleColor, opacity = 1, build = {}, muscleScale = 1, boneGlow = 0.06 }) => {
  const G = useRigGeometry();
  if (opacity <= 0.002) return null;
  const transparent = opacity < 0.999;
  const bv = (g: keyof NonNullable<FigureProps['build']>) => (build[g] === undefined ? 1 : clamp(build[g] as number));

  // a bone material: lunar white, far side dimmer, a cyan flash while it resolves
  const boneMat = (far: boolean, b: number, double = false) => {
    const col = (far ? BONE_FAR : BONE).clone().lerp(FLASH, (1 - b) * 0.55);
    const em = FLASH.clone().multiplyScalar((1 - b) * 0.9 * (b > 0 ? 1 : 0)).add(new THREE.Color(0x0e1626).multiplyScalar(boneGlow * 10));
    return <meshStandardMaterial color={col} emissive={em} roughness={0.46} metalness={0.02} envMapIntensity={0.55}
      transparent={transparent || b < 1} opacity={opacity * clamp(b * 1.6)} side={double ? THREE.DoubleSide : THREE.FrontSide} />;
  };

  const els: React.ReactNode[] = [];
  let key = 0;
  /** lathe bone from a to b (grows from a while building) */
  const bone = (geo: THREE.BufferGeometry, a: P3, b: P3, far: boolean, bld: number, nominal?: number) => {
    if (bld <= 0) return;
    const s = span(a, b);
    const sy = nominal ? s.len / nominal : 1;
    els.push(<mesh key={key++} geometry={geo} position={s.pos} quaternion={s.q} scale={[1, sy * clamp(bld * 1.25), 1]}>{boneMat(far, bld)}</mesh>);
  };
  /** ellipsoid in a sagittal frame (rotation about z = th), scale [anterior, up, lateral] */
  const ell = (p: P3, th: number, sc: [number, number, number], far: boolean, bld: number, extra?: [number, number, number], dark?: boolean) => {
    if (bld <= 0) return;
    const g = clamp(bld * 1.25);
    els.push(<mesh key={key++} geometry={G.sphere} position={p} rotation={[extra?.[0] ?? 0, extra?.[1] ?? 0, th + (extra?.[2] ?? 0)]} scale={[sc[0] * g, sc[1] * g, sc[2] * g]}>
      {dark ? <meshStandardMaterial color="#0a101c" roughness={1} transparent={transparent} opacity={opacity * clamp(bld * 1.6)} /> : boneMat(far, bld)}</mesh>);
  };

  // ---- legs
  for (const sd of ['R', 'L'] as Side[]) {
    const l = k[sd], far = sd === 'L';
    const bl = bv('legs'), bf = bv('feet');
    bone(G.femur, l.hip, l.knee, far, bl);
    bone(G.tibia, l.knee, l.ankle, far, clamp(bl * 1.2 - 0.2));
    bone(G.fibula, loc(l.knee, l.thSh, 0.03, -0.018, l.s * 0.022), loc(l.ankle, l.thSh, -0.005, -0.012, l.s * 0.024), far, clamp(bl * 1.3 - 0.3));
    ell(loc(l.knee, l.thTh, -0.012, 0.042), l.thTh, [0.012, 0.022, 0.02], far, clamp(bl * 1.3 - 0.3)); // patella
    bone(G.calc, l.ankle, l.heel, far, bf, 0.07);
    bone(G.meta, l.ankle, l.mtp, far, bf, 0.158);
    bone(G.toe, l.mtp, l.toe, far, bf);
    ell(l.ankle, l.thSh, [0.018, 0.016, 0.02], far, bf); // talus
  }
  // ---- pelvis (in its own frame: x anterior, y up)
  {
    const bp = bv('pelvis');
    for (const s of [1, -1]) ell(loc(k.P, k.thP, 0.045, -0.035, s * 0.06), k.thP, [0.02, 0.028, 0.016], s < 0, bp); // ischial tuberosities
    if (bp > 0) {
      const g = clamp(bp * 1.25);
      els.push(
        <group key={key++} position={loc(k.P, k.thP, -0.005, -0.012)} rotation={[0, 0, k.thP]} scale={[g, g, g]}>
          <mesh geometry={G.ilium} position={[0, 0, 0.078]} rotation={[0, -0.38, 0]}>{boneMat(false, bp)}</mesh>
          <mesh geometry={G.ilium} position={[0, 0, -0.078]} rotation={[0, 0.38, 0]}>{boneMat(true, bp)}</mesh>
          <group position={[0.022, -0.05, 0]} rotation={[0, 0, -0.55]}>
            <mesh geometry={G.ring} rotation={[Math.PI / 2, 0, 0]} scale={[1, 1.18, 1]}>{boneMat(false, bp)}</mesh>
          </group>
        </group>,
      );
    }
    bone(G.sacrum, loc(k.P, k.thP, -0.12, -0.085), loc(k.P, k.thP, 0.0, -0.1), false, bp);
  }
  // ---- spine: lumbar, thoracic, cervical discs
  {
    const bs = bv('spine');
    const run = (a: P3, b: P3, n: number, r: number, h: number, i0: number) => {
      for (let i = 0; i < n; i++) {
        const bi = clamp(bs * 1.6 - ((i0 + i) / 24) * 0.6);
        if (bi <= 0) continue;
        const p = lerp3(a, b, (i + 0.5) / n);
        const s = span(a, b);
        const g = clamp(bi * 1.25);
        els.push(<mesh key={key++} geometry={G.disc} position={p} quaternion={s.q} scale={[r * g, h, r * g * 0.9]}>{boneMat(false, bi)}</mesh>);
      }
    };
    run(k.S0, k.L1, 5, 0.021, 0.026, 0);
    run(k.L1, k.T1, 12, 0.015, 0.017, 5);
    run(k.T1, k.C7, 7, 0.011, 0.011, 17);
  }
  // ---- ribcage, sternum, scapulae, clavicles (thorax frame)
  {
    const br = bv('ribs');
    if (br > 0) {
      els.push(
        <group key={key++} position={k.L1} rotation={[0, 0, k.thT]}>
          {G.ribs.map((g, i) => {
            const bi = clamp(br * 1.6 - (i / 9) * 0.6);
            return bi > 0 ? <mesh key={i} geometry={g} scale={[clamp(bi * 1.2), 1, clamp(bi * 1.2)]}>{boneMat(false, bi)}</mesh> : null;
          })}
        </group>,
      );
    }
    bone(G.sternum, loc(k.L1, k.thT, -0.27, 0.15), loc(k.L1, k.thT, -0.12, 0.168), false, br);
    const ba = bv('arms');
    for (const sd of ['R', 'L'] as Side[]) {
      const s = sd === 'R' ? 1 : -1, far = sd === 'L';
      bone(G.clav, loc(k.L1, k.thT, -0.275, 0.13, s * 0.025), loc(k.L1, k.thT, -0.262, 0.03, s * 0.17), far, ba);
      ell(loc(k.L1, k.thT, -0.205, -0.055, s * 0.1), k.thT, [0.04, 0.066, 0.007], far, ba, [0, -s * 0.5, 0]);
    }
  }
  // ---- skull + neck
  {
    const bk = bv('skull');
    bone(G.neckBone, k.T1, k.C7, false, bk);
    if (bk > 0) {
      const g = clamp(bk * 1.25);
      const socket = <meshStandardMaterial color="#1a2232" roughness={0.9} transparent={transparent} opacity={opacity} />;
      els.push(
        <group key={key++} position={k.head} rotation={[0, 0, k.thH]} scale={[g, g, g]}>
          <mesh geometry={G.skull}>{boneMat(false, bk)}</mesh>
          {[1, -1].map((s) => (
            <mesh key={s} geometry={G.sphere} position={[0.083, 0.006, s * 0.037]} scale={[0.017, 0.015, 0.02]}>{socket}</mesh>
          ))}
          <mesh geometry={G.sphere} position={[0.093, -0.025, 0]} scale={[0.009, 0.014, 0.01]}>{socket}</mesh>
          <mesh geometry={G.disc} position={[0.088, -0.064, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[0.003, 0.074, 0.003]}>{socket}</mesh>
        </group>,
      );
    }
  }
  // ---- arms
  for (const sd of ['R', 'L'] as Side[]) {
    const l = k[sd], far = sd === 'L';
    const ba = bv('arms');
    bone(G.humerus, l.sh, l.elbow, far, ba);
    bone(G.radius, loc(l.elbow, l.thFore, 0.0, 0.009, l.s * 0.012), loc(l.wrist, l.thFore, 0, 0.009, l.s * 0.012), far, clamp(ba * 1.2 - 0.2));
    bone(G.ulna, loc(l.elbow, l.thFore, -0.015, -0.01, -l.s * 0.004), loc(l.wrist, l.thFore, 0, -0.008, -l.s * 0.004), far, clamp(ba * 1.2 - 0.2));
    bone(G.hand, l.wrist, l.hand, far, clamp(ba * 1.3 - 0.3));
  }

  // ---- muscles
  const bm = bv('muscles');
  if (bm > 0) {
    MUSCLES.forEach((m: MuscleDef, mi) => {
      for (const sd of ['R', 'L'] as Side[]) {
        const a = attach(k, sd, m.a), b = attach(k, sd, m.b);
        const s = span(a, b);
        const grow = clamp(bm * 1.6 - (mi / MUSCLES.length) * 0.6);
        if (grow <= 0) continue;
        const ac = clamp(act(m.id, sd));
        const far = sd === 'L';
        const col = muscleColor?.(m.id, sd) ?? WORLD.lab.muscle;
        const base = new THREE.Color(col).multiplyScalar(far ? 0.3 : 0.46);
        const emis = new THREE.Color(col).multiplyScalar((0.05 + ac * 1.1) * (far ? 0.5 : 1));
        const r = m.r * muscleScale * (0.75 + 0.25 * grow);
        const geo = G.spindles.get(m.peak ?? 0.5)!;
        const sc: [number, number, number] = [r, s.len * clamp(grow * 1.2), r];
        els.push(
          <mesh key={key++} geometry={geo} position={s.pos} quaternion={s.q} scale={sc} renderOrder={2}>
            <meshStandardMaterial color={base} emissive={emis} roughness={0.5} metalness={0} transparent opacity={opacity * clamp(grow * 1.5) * (far ? 0.55 : 0.84)} depthWrite={!far} />
          </mesh>,
        );
        if (ac > 0.04) {
          els.push(
            <mesh key={key++} geometry={geo} position={s.pos} quaternion={s.q} scale={[r * 2.2, sc[1], r * 2.2]} renderOrder={3}>
              <meshBasicMaterial color={col} transparent opacity={opacity * grow * ac * (far ? 0.08 : 0.2)} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
            </mesh>,
          );
        }
      }
    });
  }
  return <group>{els}</group>;
};

// ------------------------------------------------------------------ floor
const floorVert = /* glsl */ `
varying vec3 vW;
void main() { vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
const floorFrag = /* glsl */ `
uniform vec3 uCenter; uniform float uOffset; uniform vec2 uRadius; uniform vec3 uColor; uniform vec3 uPool; uniform float uOpacity;
varying vec3 vW;
float grid(vec2 p, float sp, float wpx) {
  vec2 q = p / sp;
  vec2 g = abs(fract(q - 0.5) - 0.5) / fwidth(q);
  return 1.0 - min(min(g.x, g.y) / wpx, 1.0);
}
void main() {
  vec2 rel = vec2(vW.x - uCenter.x, vW.z - uCenter.z);
  vec2 p = vec2(rel.x + uOffset, rel.y);
  float d = length(rel / uRadius);
  float fade = 1.0 - smoothstep(0.35, 1.0, d);
  float minor = grid(p, 0.125, 1.0);
  float major = grid(p, 0.5, 1.3);
  float pool = exp(-d * d * 5.0);
  vec3 col = uColor * (minor * 0.32 + major * 0.75) + uPool * pool * 0.10;
  float a = (minor * 0.32 + major * 0.75 + pool * 0.35) * fade * uOpacity;
  gl_FragColor = vec4(col, a);
}`;

export const LabFloor: React.FC<{ center: P3; offset: number; radius?: [number, number]; opacity?: number; size?: [number, number] }> = ({ center, offset, radius = [2.6, 1.3], opacity = 1, size = [8, 4] }) => {
  const uniforms = useMemo(() => ({
    uCenter: { value: new THREE.Vector3() }, uOffset: { value: 0 }, uRadius: { value: new THREE.Vector2(2.6, 1.3) },
    uColor: { value: new THREE.Color('#7fa6cc') }, uPool: { value: new THREE.Color('#5c86b8') }, uOpacity: { value: 1 },
  }), []);
  uniforms.uCenter.value.set(center[0], center[1], center[2]);
  uniforms.uOffset.value = offset;
  uniforms.uRadius.value.set(radius[0], radius[1]);
  uniforms.uOpacity.value = opacity;
  if (opacity <= 0.002) return null;
  return (
    <mesh position={[center[0], center[1], center[2]]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={0}>
      <planeGeometry args={[size[0], size[1], 1, 1]} />
      <shaderMaterial vertexShader={floorVert} fragmentShader={floorFrag} uniforms={uniforms} transparent depthWrite={false} toneMapped={false} />
    </mesh>
  );
};

/** the lights of the dim lab: soft cool key, cyan rim from behind, low fill */
export const LabLights: React.FC<{ k?: number }> = ({ k = 1 }) => (
  <>
    <hemisphereLight args={['#9fb6d8', '#0b1220', 0.55 * k]} />
    <directionalLight position={[3, 5, 6]} intensity={2.1 * k} color="#eef3ff" />
    <directionalLight position={[-4, 2.5, -5]} intensity={2.6 * k} color="#5CE1FF" />
    <directionalLight position={[-2, -1, 4]} intensity={0.35 * k} color="#8C7DFF" />
  </>
);
