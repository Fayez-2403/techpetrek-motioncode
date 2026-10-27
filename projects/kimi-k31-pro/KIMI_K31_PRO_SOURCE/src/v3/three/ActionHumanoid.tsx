// A stylized procedural humanoid for the V3 action shots (the parkour runner, the survivor, the shambling figures).
// One rig, three outfits. The body is tapered lathe limbs, ellipsoid torso parts and rounded-box shoes hung on a
// forward-kinematics hierarchy; a pose is a flat set of joint angles (see ActionPoses). `fk()` mirrors the hierarchy in
// plain math so a scene can read hand / foot / head positions (flashlight beams, ground contact, the flare throw).
// Figure frame: forward +Z, up +Y, the figure's left side is +X. Geometry is built once and shared.
import React, { useMemo } from 'react';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import type { P3 } from './ActionKit';

export type A3 = [number, number, number];
export interface Pose {
  root: A3;            // hips (pelvis centre) in the figure frame
  rot: A3;             // pelvis [pitch fwd, yaw, roll] (order YXZ)
  spine: A3; chest: A3; neck: A3; head: A3;   // [bend fwd, twist, side bend]
  lSh: A3; rSh: A3;    // [flex fwd, abduct out, twist]
  lEl: number; rEl: number; lWr: number; rWr: number;
  lHip: A3; rHip: A3;  // [flex fwd, abduct out, twist]
  lKn: number; rKn: number; lAn: number; rAn: number;
}

export const RIG = {
  hipX: 0.092, hipY: -0.04, thigh: 0.44, shin: 0.43, ankleH: 0.075,
  spineY: 0.07, chestY: 0.2, shX: 0.178, shY: 0.255, neckY: 0.31, headY: 0.105,
  upper: 0.285, fore: 0.255, hand: 0.17,
};
/** hips height when standing straight */
export const STAND_H = RIG.thigh + RIG.shin + RIG.ankleH - RIG.hipY;

// ------------------------------------------------------------------------------------------------ geometry
/** tapered capsule hanging down from the joint (y = 0) to y = -len, radii r0 (top) and r1 (bottom), muscle bulge */
function limbGeo(len: number, r0: number, r1: number, bulge = 0.0, seg = 14) {
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i <= 6; i++) { const a = -Math.PI / 2 + (i / 6) * (Math.PI / 2); pts.push(new THREE.Vector2(Math.max(1e-4, r1 * Math.cos(a)), -len + r1 * Math.sin(a))); }
  for (let i = 1; i < 12; i++) { const u = i / 12; pts.push(new THREE.Vector2(r1 + (r0 - r1) * u + bulge * Math.sin(Math.PI * u) * (0.6 + 0.4 * u), -len * (1 - u))); }
  for (let i = 0; i <= 6; i++) { const a = (i / 6) * (Math.PI / 2); pts.push(new THREE.Vector2(Math.max(1e-4, r0 * Math.cos(a)), r0 * Math.sin(a))); }
  const g = new THREE.LatheGeometry(pts, seg);
  g.computeVertexNormals();
  return g;
}
function latheGeo(prof: [number, number][], seg = 22) {
  const g = new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(Math.max(1e-4, r), y)), seg);
  g.computeVertexNormals();
  return g;
}

let GEO: ReturnType<typeof buildGeo> | null = null;
function buildGeo() {
  return {
    sphere: new THREE.SphereGeometry(1, 24, 16),
    thigh: limbGeo(RIG.thigh, 0.082, 0.058, 0.012),
    shin: limbGeo(RIG.shin, 0.058, 0.04, 0.012),
    upper: limbGeo(RIG.upper, 0.054, 0.043, 0.006),
    fore: limbGeo(RIG.fore, 0.044, 0.033, 0.008),
    chest: latheGeo([[0.0, -0.01], [0.125, 0.0], [0.148, 0.07], [0.163, 0.16], [0.172, 0.235], [0.16, 0.29], [0.115, 0.33], [0.06, 0.345], [0.0, 0.35]]),
    abdomen: latheGeo([[0.0, -0.06], [0.118, -0.04], [0.13, 0.04], [0.128, 0.13], [0.118, 0.2], [0.0, 0.22]]),
    neck: new THREE.CylinderGeometry(0.046, 0.052, 0.13, 12),
    shoe: new RoundedBoxGeometry(0.105, 0.085, 0.27, 3, 0.035),
    sole: new RoundedBoxGeometry(0.112, 0.03, 0.282, 2, 0.012),
    hood: latheGeo([[0.0, -0.05], [0.09, -0.04], [0.12, 0.0], [0.1, 0.05], [0.0, 0.07]]),
    pack: new RoundedBoxGeometry(0.25, 0.31, 0.12, 3, 0.05),
    roll: new THREE.CylinderGeometry(0.06, 0.06, 0.3, 12).rotateZ(Math.PI / 2),
    rag: new THREE.PlaneGeometry(0.05, 0.16).translate(0, -0.08, 0),
    brim: new THREE.TorusGeometry(0.094, 0.018, 8, 24),
    strap: new THREE.BoxGeometry(0.045, 0.3, 0.02),
    torch: new THREE.CylinderGeometry(0.02, 0.026, 0.2, 12),
    stick: new THREE.CylinderGeometry(0.016, 0.016, 0.24, 8),
  };
}
const geo = () => (GEO ??= buildGeo());

// ------------------------------------------------------------------------------------------------ outfits
export interface Outfit {
  top: string; topDark?: string; pants: string; skin: string; shoes: string; sole: string; hair: string;
  accent?: string; hood?: boolean; pack?: string; beanie?: string; forearmSkin?: boolean; build?: number; rough?: number;
  collar?: boolean; rags?: number; hairMess?: boolean;
}
export const OUTFITS: Record<'runner' | 'survivor' | 'shambler', Outfit> = {
  runner: { top: '#138a8e', topDark: '#0c5d62', pants: '#1b1d24', skin: '#b9825f', shoes: '#eef0f2', sole: '#ff6a2a', hair: '#1a120e', accent: '#ffb347', hood: true },
  survivor: { top: '#56613f', topDark: '#3a432e', pants: '#2c3542', skin: '#a8806a', shoes: '#2a2622', sole: '#141210', hair: '#1f1914', pack: '#5f4a35', hood: true, collar: true, accent: '#8a6a3a' },
  shambler: { top: '#3f453f', topDark: '#2a2e2b', pants: '#232226', skin: '#5b6359', shoes: '#1d1d1d', sole: '#121212', hair: '#141615', forearmSkin: true, rough: 0.97, rags: 7, hairMess: true },
};

/** per-figure materials; `fade` lerps everything toward `fogColor` (emerging from fog), `glow` adds a rim of colour */
export function useOutfitMaterials(o: Outfit) {
  return useMemo(() => {
    const m = (c: string, r = o.rough ?? 0.82) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: 0, envMapIntensity: 0.5 });
    return {
      top: m(o.top), topDark: m(o.topDark ?? o.top), pants: m(o.pants), skin: m(o.skin, o.rough ? 0.85 : 0.6), shoes: m(o.shoes, 0.55), sole: m(o.sole, 0.7),
      hair: m(o.hair, 0.9), accent: m(o.accent ?? o.top, 0.5), pack: m(o.pack ?? o.top, 0.85), beanie: m(o.beanie ?? o.hair, 0.95),
      torch: new THREE.MeshStandardMaterial({ color: '#1b1d22', roughness: 0.35, metalness: 0.8 }),
      lens: new THREE.MeshBasicMaterial({ color: new THREE.Color('#fff6dc').multiplyScalar(3), toneMapped: false }),
      flare: new THREE.MeshStandardMaterial({ color: '#b3141c', roughness: 0.5, emissive: new THREE.Color('#ff3020'), emissiveIntensity: 0 }),
    };
  }, [o]);
}
export type OutfitMats = ReturnType<typeof useOutfitMaterials>;

/** tint all of a figure's materials toward a fog colour (k = 1 fully fogged) and add an emissive rim */
export function fogTint(M: OutfitMats, o: Outfit, fog: string, k: number, emissive?: string, ek = 0) {
  const f = new THREE.Color(fog);
  const pairs: [THREE.MeshStandardMaterial, string][] = [[M.top, o.top], [M.topDark, o.topDark ?? o.top], [M.pants, o.pants], [M.skin, o.skin], [M.shoes, o.shoes], [M.sole, o.sole], [M.hair, o.hair], [M.beanie, o.beanie ?? o.hair]];
  for (const [mat, c] of pairs) {
    mat.color.set(c).lerp(f, k * 0.6);
    mat.emissive.copy(f).multiplyScalar(k * 0.9);
    if (emissive && ek > 0) mat.emissive.add(new THREE.Color(emissive).multiplyScalar(ek));
  }
}

// ------------------------------------------------------------------------------------------------ figure
export interface FigureProps {
  pose: Pose; outfit: Outfit; mats: OutfitMats;
  pos: P3; yaw: number; scale?: number;
  rHand?: React.ReactNode; lHand?: React.ReactNode;
  /** lean the head / limbs thinner for a gaunt build (shamblers) */
  gaunt?: number;
  seed?: number;
}


export const Figure: React.FC<FigureProps> = ({ pose: p, outfit: o, mats, pos, yaw, scale = 1, rHand, lHand, gaunt = 0, seed = 1 }) => {
  const nr = o.rags ?? 0;
  const G = geo();
  const thin = 1 - 0.22 * gaunt;
  const leg = (s: 1 | -1) => {
    const hip = s > 0 ? p.lHip : p.rHip, kn = s > 0 ? p.lKn : p.rKn, an = s > 0 ? p.lAn : p.rAn;
    return (
      <group position={[s * RIG.hipX, RIG.hipY, 0]} rotation={[-hip[0], s * hip[2], s * hip[1]]}>
        <mesh geometry={G.thigh} material={mats.pants} scale={[thin, 1, thin * 1.08]} />
        <group position={[0, -RIG.thigh, 0]} rotation={[kn, 0, 0]}>
          <mesh geometry={G.sphere} material={mats.pants} scale={0.06 * thin} />
          <mesh geometry={G.shin} material={mats.pants} scale={[thin, 1, thin * 1.1]} />
          <group position={[0, -RIG.shin, 0]} rotation={[an, 0, 0]}>
            <mesh geometry={G.shoe} material={mats.shoes} position={[0, -0.028, 0.065]} />
            <mesh geometry={G.sole} material={mats.sole} position={[0, -0.072, 0.065]} />
          </group>
        </group>
      </group>
    );
  };
  const arm = (s: 1 | -1, prop?: React.ReactNode) => {
    const sh = s > 0 ? p.lSh : p.rSh, el = s > 0 ? p.lEl : p.rEl, wr = s > 0 ? p.lWr : p.rWr;
    const foreMat = o.forearmSkin ? mats.skin : mats.top;
    return (
      <group position={[s * RIG.shX, RIG.shY, -0.01]} rotation={[-sh[0], s * sh[2], s * sh[1]]}>
        <mesh geometry={G.sphere} material={mats.top} scale={[0.066 * thin, 0.07, 0.066 * thin]} />
        <mesh geometry={G.upper} material={mats.top} scale={[thin, 1, thin]} />
        <group position={[0, -RIG.upper, 0]} rotation={[-el, 0, 0]}>
          <mesh geometry={G.sphere} material={foreMat} scale={0.046 * thin} />
          <mesh geometry={G.fore} material={foreMat} scale={[thin, 1, thin]} />
          {o.accent && !o.forearmSkin ? <mesh geometry={G.sphere} material={mats.accent} position={[0, -RIG.fore + 0.02, 0]} scale={[0.04, 0.02, 0.04]} /> : null}
          <group position={[0, -RIG.fore, 0]} rotation={[wr, 0, 0]}>
            <mesh geometry={G.sphere} material={mats.skin} position={[0, -0.075, 0.008]} scale={[0.04, 0.082, 0.024]} />
            {prop}
          </group>
        </group>
      </group>
    );
  };
  return (
    <group position={pos} rotation={[0, yaw, 0]} scale={scale}>
      <group position={p.root} rotation={[p.rot[0], p.rot[1], p.rot[2], 'YXZ']}>
        <mesh geometry={G.sphere} material={mats.pants} position={[0, -0.02, 0]} scale={[0.162 * (0.9 + 0.1 * thin), 0.115, 0.115]} />
        {leg(1)}{leg(-1)}
        <group position={[0, RIG.spineY, 0]} rotation={p.spine}>
          <mesh geometry={G.abdomen} material={mats.topDark} scale={[thin, 1, 0.78]} />
          {nr > 0 ? Array.from({ length: nr }, (_, i) => {
            const a = ((i + 0.5) / nr) * Math.PI * 2 + seed, len = 0.7 + 0.8 * Math.abs(Math.sin(seed * 7.1 + i * 3.3));
            return <mesh key={i} geometry={G.rag} material={mats.topDark} position={[Math.sin(a) * 0.12 * thin, 0.0, Math.cos(a) * 0.09]} rotation={[0.25 * Math.cos(a) + 0.15 * Math.sin(i * 2.1 + seed), a, -0.25 * Math.sin(a)]} scale={[1, len, 1]} />;
          }) : null}
          <group position={[0, RIG.chestY, 0]} rotation={p.chest}>
            <mesh geometry={G.chest} material={mats.top} position={[0, -0.03, 0]} scale={[thin * 1.0, 1, 0.64]} />
            {o.hood ? <mesh geometry={G.hood} material={mats.topDark} position={[0, 0.3, -0.075]} scale={[1, 1, 0.75]} /> : null}
            {o.collar ? <mesh geometry={G.hood} material={mats.topDark} position={[0, 0.3, -0.03]} scale={[0.95, 0.8, 0.9]} /> : null}
            {o.pack ? (
              <>
                <mesh geometry={G.pack} material={mats.pack} position={[0, 0.12, -0.15]} rotation={[0.06, 0, 0]} />
                <mesh geometry={G.roll} material={mats.topDark} position={[0, 0.3, -0.16]} />
                {[1, -1].map((s) => <mesh key={s} geometry={G.strap} material={mats.topDark} position={[s * 0.1, 0.18, 0.1]} rotation={[0.25, 0, 0]} />)}
              </>
            ) : null}
            <group position={[0, RIG.neckY, 0]} rotation={p.neck}>
              <mesh geometry={G.neck} material={mats.skin} position={[0, 0.04, 0]} scale={[thin, 1, thin]} />
              <group position={[0, RIG.headY, 0.012]} rotation={p.head}>
                <mesh geometry={G.sphere} material={mats.skin} scale={[0.092 * (0.96 + 0.04 * thin), 0.112, 0.102]} />
                <mesh geometry={G.sphere} material={mats.skin} position={[0, -0.058, 0.032]} scale={[0.066 * thin, 0.058, 0.072]} />
                {o.beanie
                  ? <><mesh geometry={G.sphere} material={mats.beanie} position={[0, 0.034, -0.006]} scale={[0.096, 0.09, 0.103]} /><mesh geometry={G.brim} material={mats.beanie} position={[0, 0.0, -0.004]} rotation={[Math.PI / 2 + 0.12, 0, 0]} scale={[1, 1.08, 1]} /></>
                  : <mesh geometry={G.sphere} material={mats.hair} position={[0, 0.026, -0.014]} scale={[0.097, 0.1, 0.1]} />}
                {o.hairMess ? [0, 1, 2, 3, 4].map((i) => <mesh key={i} geometry={G.rag} material={mats.hair} position={[Math.sin(i * 1.3 + seed) * 0.07, 0.07, -0.03 - 0.02 * i]} rotation={[0.9 + 0.3 * i, i * 1.1 + seed, 0.6 * Math.sin(i + seed)]} scale={[1.2, 0.7, 1]} />) : null}
              </group>
            </group>
            {arm(1, lHand)}{arm(-1, rHand)}
          </group>
        </group>
      </group>
    </group>
  );
};

// ------------------------------------------------------------------------------------------------ forward kinematics
type N = THREE.Object3D;
let FK: Record<string, N> | null = null;
function fkTree() {
  if (FK) return FK;
  const n = (parent: N | null, x = 0, y = 0, z = 0) => { const o = new THREE.Object3D(); o.position.set(x, y, z); parent?.add(o); return o; };
  const fig = n(null), root = n(fig);
  root.rotation.order = 'YXZ';
  const T: Record<string, N> = { fig, root };
  for (const [s, k] of [[1, 'l'], [-1, 'r']] as const) {
    const hip = n(root, s * RIG.hipX, RIG.hipY, 0), knee = n(hip, 0, -RIG.thigh, 0), ankle = n(knee, 0, -RIG.shin, 0);
    T[k + 'Hip'] = hip; T[k + 'Knee'] = knee; T[k + 'Ankle'] = ankle;
    T[k + 'Toe'] = n(ankle, 0, -0.07, 0.2); T[k + 'Heel'] = n(ankle, 0, -0.07, -0.07);
  }
  const spine = n(root, 0, RIG.spineY, 0), chest = n(spine, 0, RIG.chestY, 0), neck = n(chest, 0, RIG.neckY, 0), head = n(neck, 0, RIG.headY, 0.012);
  Object.assign(T, { spine, chest, neck, head, headTop: n(head, 0, 0.11, 0) });
  for (const [s, k] of [[1, 'l'], [-1, 'r']] as const) {
    const sh = n(chest, s * RIG.shX, RIG.shY, -0.01), el = n(sh, 0, -RIG.upper, 0), wr = n(el, 0, -RIG.fore, 0);
    T[k + 'Sh'] = sh; T[k + 'El'] = el; T[k + 'Wr'] = wr; T[k + 'Hand'] = n(wr, 0, -0.09, 0); T[k + 'Tip'] = n(wr, 0, -0.2, 0.01);
  }
  FK = T;
  return T;
}

export type Joint = 'root' | 'chest' | 'head' | 'headTop' | 'lSh' | 'rSh' | 'lEl' | 'rEl' | 'lWr' | 'rWr' | 'lHand' | 'rHand' | 'lTip' | 'rTip' | 'lHip' | 'rHip' | 'lKnee' | 'rKnee' | 'lAnkle' | 'rAnkle' | 'lToe' | 'rToe' | 'lHeel' | 'rHeel';

/** world positions of the joints for a pose placed at pos/yaw/scale (same hierarchy as <Figure>) */
export function fk(p: Pose, pos: P3, yaw: number, scale = 1) {
  const T = fkTree();
  T.fig.position.set(...pos); T.fig.rotation.set(0, yaw, 0); T.fig.scale.setScalar(scale);
  T.root.position.set(...p.root); T.root.rotation.set(p.rot[0], p.rot[1], p.rot[2], 'YXZ');
  T.spine.rotation.set(...p.spine); T.chest.rotation.set(...p.chest); T.neck.rotation.set(...p.neck); T.head.rotation.set(...p.head);
  for (const [s, k] of [[1, 'l'], [-1, 'r']] as const) {
    const hip = s > 0 ? p.lHip : p.rHip, sh = s > 0 ? p.lSh : p.rSh;
    T[k + 'Hip'].rotation.set(-hip[0], s * hip[2], s * hip[1]);
    T[k + 'Knee'].rotation.set(s > 0 ? p.lKn : p.rKn, 0, 0);
    T[k + 'Ankle'].rotation.set(s > 0 ? p.lAn : p.rAn, 0, 0);
    T[k + 'Sh'].rotation.set(-sh[0], s * sh[2], s * sh[1]);
    T[k + 'El'].rotation.set(-(s > 0 ? p.lEl : p.rEl), 0, 0);
    T[k + 'Wr'].rotation.set(s > 0 ? p.lWr : p.rWr, 0, 0);
  }
  T.fig.updateMatrixWorld(true);
  const v = new THREE.Vector3();
  const at = (j: Joint): P3 => { T[j].getWorldPosition(v); return [v.x, v.y, v.z]; };
  const quat = (j: Joint) => T[j].getWorldQuaternion(new THREE.Quaternion());
  return { at, quat };
}

/** lowest point of the feet (toe/heel/ankle sole) for a pose, in world y */
export function footMin(p: Pose, pos: P3, yaw: number, scale = 1) {
  const F = fk(p, pos, yaw, scale);
  const ys = (['lToe', 'rToe', 'lHeel', 'rHeel'] as Joint[]).map((j) => F.at(j)[1]);
  return Math.min(...ys) - 0.012 * scale;
}

/** lowest point of the whole body (for rolls / falls): joints with their body radius */
export function bodyMin(p: Pose, pos: P3, yaw: number, scale = 1) {
  const F = fk(p, pos, yaw, scale);
  const J: [Joint, number][] = [['lToe', 0.02], ['rToe', 0.02], ['lHeel', 0.02], ['rHeel', 0.02], ['lKnee', 0.06], ['rKnee', 0.06], ['root', 0.12], ['chest', 0.15], ['head', 0.11], ['headTop', 0.0], ['lSh', 0.07], ['rSh', 0.07], ['lEl', 0.05], ['rEl', 0.05], ['lHand', 0.04], ['rHand', 0.04]];
  return Math.min(...J.map(([j, r]) => F.at(j)[1] - r * scale));
}

/** shoulder angles {flex, abd} that point a near-straight arm along world direction `d` (side +1 left, -1 right) */
export function aimArm(p: Pose, pos: P3, yaw: number, side: 1 | -1, d: P3, scale = 1) {
  const F = fk(p, pos, yaw, scale);
  const q = F.quat('chest').invert();
  const v = new THREE.Vector3(...d).normalize().applyQuaternion(q);
  const abd = side * Math.asin(Math.max(-1, Math.min(1, v.x)));
  const flex = Math.atan2(v.z, -v.y);
  return { flex, abd };
}
