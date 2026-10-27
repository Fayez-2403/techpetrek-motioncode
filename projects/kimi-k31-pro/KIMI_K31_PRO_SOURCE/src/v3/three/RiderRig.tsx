// RiderRig: a procedural mannequin-style human for the V3 board and duel shots (original designs). The pose is given as
// a pelvis/chest/head frame plus hand and ankle targets; arms and legs are solved with two-bone IK each frame, so hands
// and feet land exactly where the choreography puts them. Outfits: the board rider (jacket, trousers, boots, helmet with a
// visor) and armoured duelists (pauldrons, breastplate, crested helmet, gauntlets, greaves). Also: the hover-board and a
// lit cloth strip used for scarves and capes. Geometry is built once; only transforms change per frame.
import React, { useMemo } from 'react';
import * as THREE from 'three';
import { add, cross, dot, frameQuat, madd, mul, norm, sub, vlen, type P3 } from './SkyKit';
import { Glow } from './SkyGlider';

const YV = new THREE.Vector3(0, 1, 0);
const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));

/** two-bone IK: root a, target t, bone lengths, pole direction -> middle joint and (reach-clamped) end */
export function ik2(a: P3, t: P3, l1: number, l2: number, pole: P3) {
  const d = sub(t, a), L = vlen(d);
  const Lc = clamp(L, Math.abs(l1 - l2) + 0.02, (l1 + l2) * 0.999);
  const dir = L > 1e-6 ? mul(d, 1 / L) : [0, -1, 0] as P3;
  const end = madd(a, dir, Lc);
  const x = (l1 * l1 - l2 * l2 + Lc * Lc) / (2 * Lc), h = Math.sqrt(Math.max(0, l1 * l1 - x * x));
  let pp = sub(pole, mul(dir, dot(pole, dir)));
  if (vlen(pp) < 1e-5) pp = Math.abs(dir[1]) < 0.9 ? cross(dir, [0, 1, 0]) : cross(dir, [1, 0, 0]);
  return { mid: add(madd(a, dir, x), mul(norm(pp), h)), end };
}

export interface BodyPose {
  pelvis: P3; pf: P3; pu: P3;        // pelvis centre, facing direction, up
  cf: P3; cu: P3;                     // chest facing / up
  look: P3;                           // head facing
  handR: P3; handL: P3; poleR: P3; poleL: P3;   // wrist targets and elbow pole directions
  footR: P3; footL: P3; kneeR: P3; kneeL: P3;   // ankle targets and knee pole directions
  toeR: P3; toeL: P3;                 // foot pointing directions
  gripR?: P3; gripL?: P3;             // direction the closed hand points (blade axis)
}
export interface Outfit {
  skin: string; top: string; accent: string; bottom: string; boots: string; gloves: string; helmet: string; visor: string;
  armor?: boolean; metal?: string; trim?: string;
  /** limb thickness multiplier (padded clothing) */
  bulk?: number;
}

export const B = { hip: 0.095, thigh: 0.44, shin: 0.43, upper: 0.29, fore: 0.27, sh: 0.185 };

/** joint positions for a pose (exported so scenes can attach props such as blades) */
export function solveBody(p: BodyPose) {
  const pr = norm(cross(p.pf, p.pu)), cr = norm(cross(p.cf, p.cu));
  const hipR = madd(madd(p.pelvis, pr, B.hip), p.pu, -0.05), hipL = madd(madd(p.pelvis, pr, -B.hip), p.pu, -0.05);
  const waist = madd(p.pelvis, p.pu, 0.1);
  const shR = madd(madd(waist, p.cu, 0.36), cr, B.sh), shL = madd(madd(waist, p.cu, 0.36), cr, -B.sh);
  const neck = madd(waist, p.cu, 0.43);
  const head = madd(madd(neck, p.cu, 0.13), p.look, 0.015);
  const armR = ik2(shR, p.handR, B.upper, B.fore, p.poleR), armL = ik2(shL, p.handL, B.upper, B.fore, p.poleL);
  const legR = ik2(hipR, p.footR, B.thigh, B.shin, p.kneeR), legL = ik2(hipL, p.footL, B.thigh, B.shin, p.kneeL);
  return { pr, cr, hipR, hipL, waist, shR, shL, neck, head, elbowR: armR.mid, wristR: armR.end, elbowL: armL.mid, wristL: armL.end, kneeR: legR.mid, ankleR: legR.end, kneeL: legL.mid, ankleL: legL.end };
}
export type Joints = ReturnType<typeof solveBody>;

/** lathe along +Y from 0 to len, radius r0 at the root and r1 at the end, rounded caps */
function limbGeo(len: number, r0: number, r1: number, seg = 14) {
  const pts: THREE.Vector2[] = [];
  const n = 18;
  for (let i = 0; i <= n; i++) {
    const s = i / n, y = s * len;
    const core = r0 + (r1 - r0) * s;
    const cap = Math.sqrt(clamp(y / (r0 * 0.85))) * Math.sqrt(clamp((len - y) / (r1 * 0.85)));
    pts.push(new THREE.Vector2(Math.max(1e-4, core * (0.55 + 0.45 * cap) * (s === 0 || s === 1 ? 0.02 : 1)), y));
  }
  const g = new THREE.LatheGeometry(pts, seg);
  g.computeVertexNormals();
  return g;
}
function torsoGeo() {
  const prof: [number, number][] = [[0.02, -0.02], [0.125, 0.0], [0.138, 0.08], [0.15, 0.17], [0.168, 0.27], [0.165, 0.33], [0.14, 0.38], [0.085, 0.425], [0.02, 0.44]];
  const g = new THREE.LatheGeometry(new THREE.SplineCurve(prof.map(([r, y]) => new THREE.Vector2(r, y))).getPoints(30), 24);
  g.scale(1, 1, 0.64);
  g.computeVertexNormals();
  return g;
}

function useRigParts(o: Outfit) {
  return useMemo(() => {
    const cloth = (c: string, r = 0.78) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: 0.02 });
    const shiny = (c: string) => new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.32, metalness: 0.55, clearcoat: 0.8, clearcoatRoughness: 0.15 });
    const M = {
      skin: cloth(o.skin, 0.6), top: o.armor ? cloth(o.top, 0.7) : cloth(o.top, 0.62), accent: o.armor ? shiny(o.accent) : cloth(o.accent, 0.55),
      bottom: cloth(o.bottom, 0.8), boots: o.armor ? shiny(o.boots) : cloth(o.boots, 0.5), gloves: cloth(o.gloves, 0.7),
      helmet: new THREE.MeshPhysicalMaterial({ color: o.helmet, roughness: 0.25, metalness: o.armor ? 0.6 : 0.1, clearcoat: 1, clearcoatRoughness: 0.08 }),
      visor: new THREE.MeshPhysicalMaterial({ color: '#0B1222', emissive: o.visor, emissiveIntensity: 0.9, roughness: 0.05, metalness: 0.3, clearcoat: 1 }),
      metal: shiny(o.metal ?? o.accent),
      trim: new THREE.MeshBasicMaterial({ color: o.trim ?? o.visor, toneMapped: false }),
    };
    const k = (o.armor ? 1.12 : 1) * (o.bulk ?? 1);
    return {
      M,
      thigh: limbGeo(B.thigh, 0.085 * k, 0.06 * k), shin: limbGeo(B.shin, 0.062 * k, 0.046 * k),
      upper: limbGeo(B.upper, 0.056 * k, 0.046 * k), fore: limbGeo(B.fore, 0.047 * k, 0.04 * k),
      greave: limbGeo(B.shin * 0.78, 0.074, 0.062), gauntlet: limbGeo(B.fore * 0.62, 0.06, 0.054),
      neck: limbGeo(0.12, 0.048, 0.045), torso: torsoGeo(),
      sphere: new THREE.SphereGeometry(1, 24, 16),
      helmetTop: new THREE.SphereGeometry(1, 28, 16, 0, Math.PI * 2, 0, Math.PI * 0.62),
      visorBand: new THREE.SphereGeometry(1, 28, 8, Math.PI * 0.18, Math.PI * 0.64, Math.PI * 0.42, Math.PI * 0.2),
      collar: new THREE.TorusGeometry(0.07, 0.03, 10, 24),
      boot: new THREE.CapsuleGeometry(0.052, 0.15, 6, 12),
      pauldron: new THREE.SphereGeometry(1, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.5),
      crest: (() => { const s = new THREE.Shape(); s.moveTo(-0.11, 0); s.quadraticCurveTo(0.02, 0.16, 0.16, 0.1); s.lineTo(0.12, 0.0); s.lineTo(-0.11, 0); const g = new THREE.ExtrudeGeometry(s, { depth: 0.016, bevelEnabled: true, bevelSize: 0.006, bevelThickness: 0.006, bevelSegments: 2 }); g.translate(0, 0, -0.008); g.rotateY(Math.PI / 2); return g; })(),
      skirt: new THREE.CylinderGeometry(0.15, 0.2, 0.2, 16, 1, true),
      belt: new THREE.TorusGeometry(0.135, 0.022, 8, 28),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(o)]);
}

const seg = (a: P3, b: P3) => {
  const d = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]).normalize();
  const q = new THREE.Quaternion().setFromUnitVectors(YV, d);
  return [q.x, q.y, q.z, q.w] as [number, number, number, number];
};

/** the figure. Coordinates are those of the parent group. */
export const Body: React.FC<{ pose: BodyPose; outfit: Outfit; shadows?: boolean }> = ({ pose: p, outfit: o, shadows = false }) => {
  const G = useRigParts(o);
  const J = solveBody(p);
  const M = G.M;
  const pq = frameQuat(p.pf, p.pu), cq = frameQuat(p.cf, p.cu), hq = frameQuat(p.look, p.cu);
  const footQ = (toe: P3, up: P3) => frameQuat(norm(sub(toe, mul(up, dot(toe, up)))), up);
  const cs = shadows;
  const limb = (geo: THREE.BufferGeometry, a: P3, b: P3, m: THREE.Material, key: string) => <mesh key={key} geometry={geo} material={m} position={a} quaternion={seg(a, b)} castShadow={cs} />;
  const ball = (c: P3, r: number | P3, m: THREE.Material, key: string, q?: [number, number, number, number]) => <mesh key={key} geometry={G.sphere} material={m} position={c} quaternion={q} scale={typeof r === 'number' ? [r, r, r] : r} castShadow={cs} />;
  const hands: [P3, P3 | undefined, string][] = [[J.wristR, p.gripR, 'R'], [J.wristL, p.gripL, 'L']];
  return (
    <group>
      {/* legs */}
      {limb(G.thigh, J.hipR, J.kneeR, M.bottom, 'thR')}{limb(G.thigh, J.hipL, J.kneeL, M.bottom, 'thL')}
      {limb(G.shin, J.kneeR, J.ankleR, M.bottom, 'shR')}{limb(G.shin, J.kneeL, J.ankleL, M.bottom, 'shL')}
      {ball(J.kneeR, 0.064 * (o.armor ? 1.25 : 1), o.armor ? M.metal : M.bottom, 'knR')}{ball(J.kneeL, 0.064 * (o.armor ? 1.25 : 1), o.armor ? M.metal : M.bottom, 'knL')}
      {o.armor && limb(G.greave, madd(J.kneeR, norm(sub(J.ankleR, J.kneeR)), 0.06), J.ankleR, M.metal, 'grR')}
      {o.armor && limb(G.greave, madd(J.kneeL, norm(sub(J.ankleL, J.kneeL)), 0.06), J.ankleL, M.metal, 'grL')}
      {([['R', J.ankleR, p.toeR], ['L', J.ankleL, p.toeL]] as [string, P3, P3][]).map(([k, an, toe]) => (
        <mesh key={'bt' + k} geometry={G.boot} material={M.boots} position={madd(madd(an, toe, 0.07), p.pu, -0.045)} quaternion={footQ(toe, p.pu)} rotation={undefined} castShadow={cs}>
        </mesh>
      ))}
      {/* pelvis + belt */}
      <group position={p.pelvis} quaternion={pq}>
        <mesh geometry={G.sphere} material={M.bottom} scale={[0.165, 0.12, 0.115]} castShadow={cs} />
        <mesh geometry={G.belt} material={o.armor ? M.metal : M.accent} position={[0, 0.07, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[1.05, 0.82, 1]} />
        {o.armor && <mesh geometry={G.skirt} material={M.top} position={[0, -0.04, 0]} scale={[1.08, 1, 0.8]} castShadow={cs} />}
      </group>
      {/* torso */}
      <group position={J.waist} quaternion={cq}>
        <mesh geometry={G.torso} material={M.top} castShadow={cs} />
        {o.armor ? (
          <mesh geometry={G.torso} material={M.metal} position={[0, 0.04, -0.012]} scale={[1.07, 0.86, 1.1]} castShadow={cs} />
        ) : (
          <mesh geometry={G.torso} material={M.accent} position={[0, 0.26, 0]} scale={[1.03, 0.36, 1.05]} />
        )}
        <mesh geometry={G.collar} material={o.armor ? M.metal : M.accent} position={[0, 0.42, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 0.85, 1]} />
      </group>
      {limb(G.neck, J.neck, J.head, M.skin, 'neck')}
      {/* head + helmet */}
      <group position={J.head} quaternion={hq}>
        <mesh geometry={G.sphere} material={M.skin} scale={[0.098, 0.112, 0.104]} castShadow={cs} />
        <mesh geometry={G.helmetTop} material={M.helmet} scale={[0.112, 0.124, 0.118]} position={[0, 0.006, 0.004]} castShadow={cs} />
        <mesh geometry={G.visorBand} material={M.visor} scale={[0.113, 0.12, 0.115]} rotation={[0, Math.PI, 0]} position={[0, -0.005, 0]} />
        {o.armor && <mesh geometry={G.crest} material={M.accent} position={[0, 0.1, 0.01]} />}
        {o.armor && <mesh geometry={G.sphere} material={M.helmet} scale={[0.1, 0.06, 0.1]} position={[0, -0.075, 0.01]} />}
      </group>
      {/* arms */}
      {limb(G.upper, J.shR, J.elbowR, M.top, 'uaR')}{limb(G.upper, J.shL, J.elbowL, M.top, 'uaL')}
      {limb(G.fore, J.elbowR, J.wristR, M.top, 'faR')}{limb(G.fore, J.elbowL, J.wristL, M.top, 'faL')}
      {ball(J.shR, 0.068, M.top, 'sR')}{ball(J.shL, 0.068, M.top, 'sL')}
      {ball(J.elbowR, 0.05, M.top, 'eR')}{ball(J.elbowL, 0.05, M.top, 'eL')}
      {o.armor && limb(G.gauntlet, madd(J.wristR, norm(sub(J.elbowR, J.wristR)), 0.17), J.wristR, M.metal, 'gaR')}
      {o.armor && limb(G.gauntlet, madd(J.wristL, norm(sub(J.elbowL, J.wristL)), 0.17), J.wristL, M.metal, 'gaL')}
      {o.armor && [[J.shR, J.elbowR, 'pR'], [J.shL, J.elbowL, 'pL']].map(([s, e, k]) => (
        <mesh key={k as string} geometry={G.pauldron} material={M.metal} position={madd(s as P3, norm(sub(e as P3, s as P3)), -0.02)} quaternion={seg(e as P3, s as P3)} scale={[0.115, 0.09, 0.115]} castShadow={cs} />
      ))}
      {hands.map(([w, g, k]) => ball(g ? madd(w, g, 0.03) : w, [0.048, 0.052, 0.045], M.gloves, 'h' + k))}
    </group>
  );
};

// ------------------------------------------------------------------------------------------------ cloth strip
/** a lit, double-sided ribbon through `pts` (local coords), `side` gives the across direction per point */
export const ClothStrip: React.FC<{ pts: P3[]; side: P3[]; width: number[]; color: string; emissive?: string; cap?: number }> = ({ pts, side, width, color, emissive, cap = 64 }) => {
  const { geo, pos } = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const p = new THREE.BufferAttribute(new Float32Array(cap * 2 * 3), 3);
    g.setAttribute('position', p);
    const idx: number[] = [];
    for (let i = 0; i < cap - 1; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    g.setIndex(idx);
    return { geo: g, pos: p };
  }, [cap]);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color, roughness: 0.7, side: THREE.DoubleSide, emissive: emissive ?? '#000000', emissiveIntensity: emissive ? 0.35 : 0 }), [color, emissive]);
  const n = Math.min(cap, pts.length);
  const A = pos.array as Float32Array;
  for (let i = 0; i < n; i++) {
    const a = madd(pts[i], side[i], width[i] / 2), b = madd(pts[i], side[i], -width[i] / 2);
    A.set(a, i * 6); A.set(b, i * 6 + 3);
  }
  pos.needsUpdate = true;
  geo.setDrawRange(0, Math.max(0, n - 1) * 6);
  geo.computeVertexNormals();
  geo.computeBoundingSphere();
  return <mesh geometry={geo} material={mat} frustumCulled={false} castShadow />;
};

// ------------------------------------------------------------------------------------------------ hover-board
function boardGeo() {
  const s = new THREE.Shape();
  const hw = 0.22, hl = 0.78;
  s.moveTo(-hw, -hl + 0.2);
  s.quadraticCurveTo(-hw, -hl, 0, -hl);
  s.quadraticCurveTo(hw, -hl, hw, -hl + 0.2);
  s.lineTo(hw, hl - 0.2);
  s.quadraticCurveTo(hw, hl, 0, hl);
  s.quadraticCurveTo(-hw, hl, -hw, hl - 0.2);
  s.lineTo(-hw, -hl + 0.2);
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.035, bevelEnabled: true, bevelThickness: 0.014, bevelSize: 0.014, bevelSegments: 3, curveSegments: 16, steps: 1 });
  g.rotateX(Math.PI / 2);
  g.translate(0, -0.014, 0);
  const pos = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const z = pos.getZ(i), k = Math.max(0, Math.abs(z) - 0.5) / 0.28;
    pos.setY(i, pos.getY(i) + 0.09 * k * k);
  }
  g.computeVertexNormals();
  return g;
}

/** the hover-board: board long axis along Z (nose at -Z), deck top at y = 0. glow 0..1. */
export const HoverBoard: React.FC<{ glow: number; color?: string; deck?: string; light?: string }> = ({ glow, color = '#F4F6FA', deck = '#1B2233', light = '#5CF0FF' }) => {
  const G = useMemo(() => {
    const geo = boardGeo();
    return {
      geo,
      shell: new THREE.MeshPhysicalMaterial({ color, roughness: 0.25, metalness: 0.3, clearcoat: 1, clearcoatRoughness: 0.06 }),
      deck: new THREE.MeshStandardMaterial({ color: deck, roughness: 0.85 }),
      strip: new THREE.MeshBasicMaterial({ color: light, toneMapped: false }),
      pod: new THREE.MeshPhysicalMaterial({ color: '#2A3142', roughness: 0.3, metalness: 0.8 }),
      podGeo: new THREE.CylinderGeometry(0.06, 0.075, 0.12, 16),
      stripGeo: new THREE.BoxGeometry(0.03, 0.012, 1.1),
      discGeo: new THREE.CircleGeometry(0.05, 16),
    };
  }, [color, deck, light]);
  return (
    <group>
      <mesh geometry={G.geo} material={G.shell} castShadow />
      <mesh geometry={G.geo} material={G.deck} position={[0, 0.004, 0]} scale={[0.88, 0.2, 0.9]} />
      {[-0.15, 0.15].map((x) => <mesh key={x} geometry={G.stripGeo} material={G.strip} position={[x, -0.052, 0]} />)}
      {[[-0.12, 0.5], [0.12, 0.5], [0, -0.45]].map(([x, z], i) => (
        <group key={i} position={[x, -0.1, z]}>
          <mesh geometry={G.podGeo} material={G.pod} />
          <mesh geometry={G.discGeo} material={G.strip} position={[0, -0.062, 0]} rotation={[Math.PI / 2, 0, 0]} />
          <Glow p={[0, -0.12, 0]} s={0.35 + 0.5 * glow} color={light} a={0.5 + 0.5 * glow} />
        </group>
      ))}
      <Glow p={[0, -0.25, 0]} s={1.4 + 1.2 * glow} color={light} a={0.22 + 0.25 * glow} />
    </group>
  );
};
