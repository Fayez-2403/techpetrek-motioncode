// buildBreak (Railway, CONFIRMED BREACH: builds / deploys disrupted): a sleek deploy pipeline (BUILD -> DEPLOY -> LIVE glass
// stations on a lit lane) with packets flowing. On a beat a PAUSED gate drops onto the lane, the stations go grey, the
// flow stops and the incoming packets pile up against the gate. Original diagram, no vendor UI. ILLUSTRATIVE.
import React, { useLayoutEffect, useMemo } from 'react';
import * as THREE from 'three';
import type { MediaProps } from './types';
import { ThreeStage, Env, CamRig, type V3 } from '../three/stage';
import { C } from '../styles/theme';
import { F } from '../styles/typography';
import { clamp, dampedSpring, easeInOutCubic, easeOutCubic, invLerp, lerp } from '../lib/anim';
import { hash } from '../lib/rng';
import { Backdrop3D, BEAT, ContactShadow, Glow, Win, WinVignette, canvasTex, fovFor, glowTex, hit, roundedSlab, rr, setInst, tallness, useFontsReady } from './_stub';

const XB = -1.45;                     // gate position on the lane
const STATIONS = [{ x: -4.55, name: 'BUILD' }, { x: 0.85, name: 'DEPLOY' }, { x: 4.85, name: 'LIVE' }];
const V0 = 0.05, SP = 0.52, X0 = -7.6, NP = 56, JMIN = -28;
const PK = 0.25;                       // packet size

/** halt beat: the gate lands here (beat 2 for a 2-3 s item, beat 3 for 3.5 s+, beat 1 under 100 frames) */
const haltAt = (dur: number) => (dur < 100 ? 1 : dur < 210 ? 2 : 3) * BEAT;

/** distance flowed by frame f: constant speed, then a linear slow-down to a stop over [a, a+d] */
const flow = (f: number, a: number, d: number) => {
  if (f <= a) return V0 * f;
  const t = Math.min(f - a, d);
  return V0 * a + V0 * (t - (t * t) / (2 * d));
};

// pile slots behind the gate: [back from gate, up, sideways]
const SLOTS: V3[] = [
  [0.2, 0, -0.15], [0.2, 0, 0.15], [0.5, 0, -0.15], [0.5, 0, 0.15], [0.35, 0.25, 0], [0.8, 0, -0.15], [0.8, 0, 0.15], [0.65, 0.25, 0.02],
  [0.5, 0.49, -0.02], [1.1, 0, -0.13], [1.1, 0, 0.14], [0.95, 0.25, 0], [1.4, 0, 0.0], [1.7, 0, -0.1], [2.0, 0, 0.1], [2.3, 0, 0],
];

function stationTex(name: string, paused: boolean) {
  return canvasTex(640, 360, (g, W, H) => {
    g.clearRect(0, 0, W, H);
    g.fillStyle = paused ? 'rgba(160,166,178,0.9)' : '#F2F4F8';
    g.font = `800 112px ${F.head}`; (g as unknown as { fontStretch: string }).fontStretch = 'semi-condensed';
    g.textBaseline = 'alphabetic'; g.fillText(name, 30, 128);
    // status pill
    const col = paused ? '#9AA0AC' : C.mintSoft, label = paused ? 'PAUSED' : 'RUNNING';
    g.font = `800 40px ${F.mono}`; const tw = g.measureText(label).width;
    rr(g, 34, 176, tw + 100, 70, 35); g.fillStyle = paused ? 'rgba(40,42,48,0.9)' : 'rgba(18,60,44,0.9)'; g.fill();
    g.lineWidth = 3; g.strokeStyle = col; g.stroke();
    if (paused) { g.fillStyle = col; rr(g, 60, 194, 10, 34, 3); g.fill(); rr(g, 78, 194, 10, 34, 3); g.fill(); }
    else { g.fillStyle = col; g.beginPath(); g.arc(74, 211, 13, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = col; g.textBaseline = 'middle'; g.fillText(label, 104, 213);
    // hairlines
    g.fillStyle = 'rgba(255,255,255,0.14)'; rr(g, 34, 290, 220, 12, 6); g.fill(); rr(g, 270, 290, 120, 12, 6); g.fill();
  });
}
function signTex() {
  return canvasTex(720, 220, (g, W, H) => {
    g.clearRect(0, 0, W, H);
    rr(g, 8, 8, W - 16, H - 16, 34); g.fillStyle = 'rgba(14,15,18,0.94)'; g.fill(); g.lineWidth = 7; g.strokeStyle = C.alert; g.stroke();
    g.fillStyle = C.alert; rr(g, 70, 58, 26, 104, 6); g.fill(); rr(g, 114, 58, 26, 104, 6); g.fill();
    g.font = `900 122px ${F.head}`; (g as unknown as { fontStretch: string }).fontStretch = 'condensed';
    g.textBaseline = 'middle'; g.fillText('PAUSED', 180, 116);
  });
}
function dashTex() {
  const t = canvasTex(256, 16, (g, W, H) => { g.clearRect(0, 0, W, H); g.fillStyle = '#fff'; for (let i = 0; i < 4; i++) { rr(g, i * 64 + 6, 3, 40, H - 6, 5); g.fill(); } });
  t.wrapS = THREE.RepeatWrapping; t.repeat.set(14 / 1.2, 1);
  return t;
}

const Scene: React.FC<MediaProps> = ({ w, h, f, dur }) => {
  const H = haltAt(dur);
  const res = useMemo(() => {
    const plinth = roundedSlab(15, 2.3, 0.5, 0.2, 0.06);
    const lane = roundedSlab(15, 0.82, 0.07, 0.08, 0.025);
    const block = roundedSlab(1.95, 1.3, 1.5, 0.16, 0.05);
    const blade = roundedSlab(0.12, 1.25, 1.2, 0.05, 0.025);
    const pk = roundedSlab(PK, PK, PK, 0.05, 0.02, 3);
    const tex = STATIONS.map((s) => [stationTex(s.name, false), stationTex(s.name, true)]);
    const sign = signTex(), dash = dashTex();
    const pkMat = new THREE.MeshBasicMaterial({ color: '#ffffff', toneMapped: false });
    const pkMesh = new THREE.InstancedMesh(pk, pkMat, NP);
    pkMesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(NP * 3).fill(1), 3);
    pkMesh.frustumCulled = false;
    const glowGeo = new THREE.BufferGeometry();
    glowGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(NP * 3), 3));
    glowGeo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(NP * 3), 3));
    const glowMat = new THREE.PointsMaterial({ map: glowTex(), size: 0.9, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, sizeAttenuation: true });
    // packet arrival frames at their pile slot (computed once per dur)
    return { plinth, lane, block, blade, tex, sign, dash, pkMesh, glowGeo, glowMat };
  }, []);

  // ---- flow model ----
  // at the halt everything stops (grey), except the packets in transit between BUILD and the gate: they keep coming and
  // pile up against the gate (amber).
  const dnA = H - 2, dnD = 26;
  const sDn = flow(f, dnA, dnD), sH = flow(H, dnA, dnD);
  const jUpMax = Math.floor((XB - 0.05 - X0 - sH) / SP);
  const jA = Math.ceil((STATIONS[0].x + 0.35 - X0 - V0 * H) / SP);
  const slotX = (r: number) => XB - SLOTS[Math.min(r, SLOTS.length - 1)][0] - (r >= SLOTS.length ? (r - SLOTS.length + 1) * 0.3 : 0);
  const arrive = (j: number) => (slotX(jUpMax - j) - X0 - j * SP) / V0;
  const mint = new THREE.Color(C.mintSoft), amber = new THREE.Color('#FFA15C'), grey = new THREE.Color('#596070');
  const pkMesh = res.pkMesh;
  const gp = res.glowGeo.getAttribute('position') as THREE.BufferAttribute, gc = res.glowGeo.getAttribute('color') as THREE.BufferAttribute;
  const col = new THREE.Color();
  const greyT = easeInOutCubic(invLerp(H, H + 24, f));
  useLayoutEffect(() => {
    for (let n = 0; n < NP; n++) {
      const j = JMIN + n;
      let x: number, y = PK / 2, z = 0, ry = 0, vis = true;
      const pile = j <= jUpMax && j >= jA;
      if (pile) {
        const r = jUpMax - j, slot = SLOTS[Math.min(r, SLOTS.length - 1)], sx = slotX(r), t = arrive(j);
        if (f >= t) {
          const p = easeOutCubic(invLerp(t, t + 11, f));
          x = sx; y = PK / 2 + slot[1] * p + Math.sin(Math.PI * p) * 0.16 * (slot[1] > 0 ? 1 : 0.4); z = slot[2] * p;
          ry = (hash(r, 3) - 0.5) * 0.5 * p;
        } else x = X0 + j * SP + V0 * f;
        col.copy(mint).lerp(amber, easeOutCubic(invLerp(t, t + 10, f)));
      } else {
        x = X0 + j * SP + (j > jUpMax ? sDn : Math.min(sDn, V0 * f));
        col.copy(mint).lerp(grey, greyT);
      }
      if (x < -7.4 || x > 7.3) vis = false;
      // fade inside stations a touch (they're behind frosted glass anyway)
      setInst(pkMesh, n, [x, y, z], vis ? [1, 1, 1] : [0, 0, 0], 0, ry, 0);
      pkMesh.setColorAt(n, col);
      gp.setXYZ(n, x, y, z); gc.setXYZ(n, vis ? col.r * 0.55 : 0, vis ? col.g * 0.55 : 0, vis ? col.b * 0.55 : 0);
    }
    pkMesh.instanceMatrix.needsUpdate = true; if (pkMesh.instanceColor) pkMesh.instanceColor.needsUpdate = true;
    gp.needsUpdate = true; gc.needsUpdate = true;
  });

  // dashes scroll with the (downstream) flow and stop
  res.dash.offset.x = -sDn / 1.2;
  const dashCol = new THREE.Color(C.mintSoft).lerp(new THREE.Color('#3A3F4A'), greyT);

  // gate drop: lands on the halt beat with a small bounce
  const drop = dampedSpring((f - (H - 9)) / 60, 15, 0.42);
  const gateY = lerp(6.5, 0.62, drop);
  const land = hit(f, H, 14);

  const tall = tallness(w, h);
  const fov = fovFor(w, h, 30);
  const k = easeInOutCubic(clamp(f / Math.max(dur, 120)));
  const camPos: V3 = [lerp(-6.4, -5.6, k), 4.3 + tall * 0.5, lerp(8.9, 8.4, k)];
  const target: V3 = [lerp(-0.45, -0.75, k), 0.3 - tall * 0.12, 0];

  return (
    <>
      <CamRig pos={camPos} target={target} fov={fov} />
      <Env intensity={0.7} />
      <Backdrop3D top="#1A1C22" bottom="#0B0C0E" glowA={'#' + new THREE.Color('#123029').lerp(new THREE.Color('#3A1C0E'), greyT).getHexString()} dirA={[0.2, 0.3, -1]} powA={5} glowB="#18202C" dirB={[-0.7, 0.2, -1]} powB={4} />
      <ambientLight intensity={0.35} />
      <directionalLight position={[-5, 8, 6]} intensity={1.9} color="#F3F6FF" />
      <directionalLight position={[6, 3, -6]} intensity={0.8} color="#9FB4D8" />
      <pointLight position={[XB, 2.2, 1.5]} intensity={drop > 0.5 ? 18 * clamp(drop) : 0} distance={6} color="#FF6A2A" />
      {/* plinth + lane */}
      <mesh geometry={res.plinth} position={[0, -0.33, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <meshPhysicalMaterial color="#15171C" roughness={0.38} metalness={0.55} clearcoat={0.7} clearcoatRoughness={0.25} />
      </mesh>
      <mesh geometry={res.lane} position={[0, -0.036, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <meshPhysicalMaterial color="#22252C" roughness={0.22} metalness={0.4} clearcoat={1} clearcoatRoughness={0.1} />
      </mesh>
      <mesh position={[0, 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[14, 0.045]} />
        <meshBasicMaterial map={res.dash} color={dashCol} transparent opacity={0.85} toneMapped={false} depthWrite={false} />
      </mesh>
      {/* packets */}
      <primitive object={res.pkMesh} />
      <points geometry={res.glowGeo} material={res.glowMat} />
      {/* stations */}
      {STATIONS.map((s, i) => {
        const pz = easeInOutCubic(invLerp(H + 4 + i * 5, H + 18 + i * 5, f));
        const pulse = (1 - greyT) * Math.exp(-((((f - i * 10) % BEAT) + BEAT) % BEAT) / 9);
        return (
          <group key={s.name} position={[s.x, 0.66, 0]}>
            <mesh geometry={res.block}>
              <meshPhysicalMaterial color={new THREE.Color('#B9D8CF').lerp(new THREE.Color('#C3C7CF'), greyT)} roughness={0.36} transmission={1} thickness={0.8} ior={1.4} metalness={0} clearcoat={0.8} clearcoatRoughness={0.15}
                attenuationColor={new THREE.Color('#79A99C').lerp(new THREE.Color('#9AA0AA'), greyT)} attenuationDistance={2.2} emissive={new THREE.Color(C.mintSoft)} emissiveIntensity={0.05 * (1 - greyT) + pulse * 0.05} />
            </mesh>
            {/* status light bar on top */}
            <mesh position={[0, 0.655, 0.45]}>
              <boxGeometry args={[1.5, 0.025, 0.06]} />
              <meshBasicMaterial color={new THREE.Color(C.mintSoft).lerp(new THREE.Color('#4A505C'), greyT)} toneMapped={false} />
            </mesh>
            <mesh position={[0, 0.16, 0.755]}>
              <planeGeometry args={[1.62, 0.91]} />
              <meshBasicMaterial map={res.tex[i][0]} transparent opacity={1 - pz} depthWrite={false} toneMapped={false} />
            </mesh>
            <mesh position={[0, 0.16, 0.756]}>
              <planeGeometry args={[1.62, 0.91]} />
              <meshBasicMaterial map={res.tex[i][1]} transparent opacity={pz} depthWrite={false} toneMapped={false} />
            </mesh>
            <Glow pos={[0, 0.72, 0.4]} size={1.6} color={C.mintSoft} opacity={0.22 * (1 - greyT) + pulse * 0.25} />
            <ContactShadow pos={[0, -0.6, 0]} sx={2.6} sz={2.1} opacity={0.5} />
          </group>
        );
      })}
      {/* the PAUSED gate */}
      <group position={[XB, gateY, 0]} visible={f >= H - 9}>
        <mesh geometry={res.blade} position={[0, 0, 0]} rotation={[0, -0.45, 0]}>
          <meshPhysicalMaterial color="#FF9C6A" roughness={0.25} transmission={1} thickness={0.3} ior={1.4} emissive={new THREE.Color(C.alert)} emissiveIntensity={0.35 + land * 0.8} clearcoat={1} />
        </mesh>
        <mesh position={[0, 0.98, 0.1]} rotation={[0, Math.atan2(camPos[0] - XB, camPos[2]) * 0.8, 0]}>
          <planeGeometry args={[1.7, 1.7 * (220 / 720)]} />
          <meshBasicMaterial map={res.sign} transparent depthWrite={false} toneMapped={false} />
        </mesh>
        <mesh position={[0, 0.6, 0.1]}>
          <boxGeometry args={[0.035, 0.42, 0.035]} />
          <meshStandardMaterial color="#2B2E35" metalness={0.8} roughness={0.3} />
        </mesh>
        <Glow pos={[0, 0, 0.62]} size={2.4} color={C.alert} opacity={0.28 + land * 0.5} />
      </group>
      {drop > 0.6 ? <ContactShadow pos={[XB, 0.004, 0]} sx={0.9} sz={1.7} opacity={0.55 * clamp((drop - 0.6) * 3)} /> : null}
      {/* landing ring on the lane */}
      {land > 0.02 ? (
        <mesh position={[XB, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[1 + (1 - land) * 2.4, 1 + (1 - land) * 2.4, 1]}>
          <ringGeometry args={[0.55, 0.62, 48]} />
          <meshBasicMaterial color={C.alert} transparent opacity={land * 0.8} depthWrite={false} toneMapped={false} />
        </mesh>
      ) : null}
    </>
  );
};

export const BuildBreak: React.FC<MediaProps> = (p) => {
  const ready = useFontsReady();
  return (
    <Win w={p.w} h={p.h} bg="#0D0E11">
      {ready ? <ThreeStage width={p.w} height={p.h} exposure={1.05} fog={['#0C0D10', 12, 22]}><Scene {...p} /></ThreeStage> : null}
      <WinVignette strength={0.45} />
    </Win>
  );
};
