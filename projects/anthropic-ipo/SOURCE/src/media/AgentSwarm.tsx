// agentSwarm (Reuters, AI-ASSISTED INTRUSION reported): one source node releases a seeded swarm of small agent drones that
// fan out across a grid of generic "website" cubes, hopping cube to cube and probing each with a light ping. On every beat
// a few of the probed cubes light orange. No names, no counts on screen. ILLUSTRATIVE.
import React, { useLayoutEffect, useMemo } from 'react';
import * as THREE from 'three';
import type { MediaProps } from './types';
import { ThreeStage, Env, CamRig, type V3 } from '../three/stage';
import { C } from '../styles/theme';
import { clamp, easeInOutCubic, easeOutCubic, invLerp, lerp } from '../lib/anim';
import { hash } from '../lib/rng';
import { Backdrop3D, BEAT, Glow, Win, WinVignette, canvasTex, everyBeat, fovFor, glowTex, roundedSlab, rr, setInst, tallness, useFontsReady } from './_stub';

const GX = 11, GZ = 6, SPX = 1.0, SPZ = 1.0, CB = 0.66, CHT = 0.42;
const ND = 46;
const HUB = new THREE.Vector3(-5.85, 0.9, 0.3);
const CUBES = Array.from({ length: GX * GZ }, (_, i) => {
  const gx = i % GX, gz = Math.floor(i / GX);
  const x = (gx - (GX - 1) / 2) * SPX + 0.35, z = (gz - (GZ - 1) / 2) * SPZ;
  return { x, z, h: CHT * (0.75 + hash(i, 9) * 0.6), flagged: hash(i, 3) < 0.27, d: Math.hypot(x - HUB.x, z - HUB.z) };
});
const BY_DIST = CUBES.map((c, i) => ({ i, d: c.d })).sort((a, b) => a.d - b.d).map((o) => o.i);
const ROUNDS = 9;
/** drone i, round k -> cube index (fan-out: each round reaches further from the hub) */
const targetOf = (i: number, k: number) => {
  const n = BY_DIST.length, band = Math.min(n - 1, Math.floor(((k + 0.5) / 4.2) * n));
  const spread = Math.floor(n * 0.42);
  const j = clamp(Math.round(band + (hash(i, k, 5) - 0.5) * spread), 0, n - 1);
  return BY_DIST[j];
};
/** arrival frame of drone i at its k-th cube: a little before beat k+1 */
const arriveAt = (i: number, k: number) => BEAT * (k + 1) - 1 - Math.floor(hash(i, k, 7) * 16);
const top = (ci: number) => new THREE.Vector3(CUBES[ci].x, CUBES[ci].h + 0.34, CUBES[ci].z);

function siteTex() {
  return canvasTex(256, 256, (g, W) => {
    g.clearRect(0, 0, W, W);
    rr(g, 18, 18, W - 36, W - 36, 26); g.fillStyle = 'rgba(255,255,255,0.10)'; g.fill(); g.lineWidth = 6; g.strokeStyle = 'rgba(255,255,255,0.85)'; g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.85)'; g.fillRect(18, 70, W - 36, 5);
    [44, 70, 96].forEach((x) => { g.beginPath(); g.arc(x, 45, 8, 0, Math.PI * 2); g.fill(); });
    rr(g, 46, 100, 100, 70, 8); g.fillStyle = 'rgba(255,255,255,0.55)'; g.fill();
    g.fillStyle = 'rgba(255,255,255,0.5)'; rr(g, 160, 104, 52, 12, 6); g.fill(); rr(g, 160, 128, 40, 12, 6); g.fill(); rr(g, 46, 190, 166, 12, 6); g.fill();
  });
}

const Scene: React.FC<MediaProps> = ({ w, h, f }) => {
  const res = useMemo(() => {
    const body = roundedSlab(CB, CB, 1, 0.08, 0.03);
    body.rotateX(-Math.PI / 2); body.translate(0, 0.5, 0);   // unit height, base at y=0
    const bodyMat = new THREE.MeshPhysicalMaterial({ color: '#FFFFFF', roughness: 0.35, metalness: 0.4, clearcoat: 0.8, clearcoatRoughness: 0.2 });
    const bodies = new THREE.InstancedMesh(body, bodyMat, CUBES.length);
    bodies.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(CUBES.length * 3).fill(1), 3);
    const topGeo = new THREE.PlaneGeometry(CB * 0.86, CB * 0.86); topGeo.rotateX(-Math.PI / 2);
    const topMat = new THREE.MeshBasicMaterial({ map: siteTex(), transparent: true, depthWrite: false, toneMapped: false });
    const tops = new THREE.InstancedMesh(topGeo, topMat, CUBES.length);
    tops.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(CUBES.length * 3).fill(1), 3);
    const droneGeo = new THREE.OctahedronGeometry(0.1, 0);
    const droneMat = new THREE.MeshBasicMaterial({ color: '#EAF4FF', toneMapped: false });
    const drones = new THREE.InstancedMesh(droneGeo, droneMat, ND);
    const beamGeo = new THREE.CylinderGeometry(0.012, 0.05, 1, 10, 1, true); beamGeo.translate(0, -0.5, 0);
    const beamMat = new THREE.MeshBasicMaterial({ color: '#FFFFFF', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
    const beams = new THREE.InstancedMesh(beamGeo, beamMat, ND);
    beams.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(ND * 3), 3);
    const ringGeo = new THREE.RingGeometry(0.2, 0.225, 40); ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({ color: '#FFFFFF', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
    const rings = new THREE.InstancedMesh(ringGeo, ringMat, ND);
    rings.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(ND * 3), 3);
    const gGeo = new THREE.BufferGeometry();
    gGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array((ND + CUBES.length) * 3), 3));
    gGeo.setAttribute('color', new THREE.BufferAttribute(new Float32Array((ND + CUBES.length) * 3), 3));
    const gMat = new THREE.PointsMaterial({ map: glowTex(), size: 0.85, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
    for (const m of [bodies, tops, drones, beams, rings]) m.frustumCulled = false;
    return { bodies, tops, drones, beams, rings, gGeo, gMat };
  }, []);

  const steel = new THREE.Color('#2C3038'), steelHi = new THREE.Color('#3A3F49'), orange = new THREE.Color(C.alert), white = new THREE.Color('#DDE6F5');
  const topIdle = new THREE.Color('#7E8796'), topHot = new THREE.Color('#FFB089');
  useLayoutEffect(() => {
    const { bodies, tops, drones, beams, rings, gGeo } = res;
    const gp = gGeo.getAttribute('position') as THREE.BufferAttribute, gc = gGeo.getAttribute('color') as THREE.BufferAttribute;
    // probe flash + flag state per cube
    const flash = new Float32Array(CUBES.length), lit = new Float32Array(CUBES.length);
    const pos = new THREE.Vector3(), a = new THREE.Vector3(), b = new THREE.Vector3(), m = new THREE.Vector3(), col = new THREE.Color();
    for (let i = 0; i < ND; i++) {
      // which leg is the drone on?
      let k = 0; while (k < ROUNDS - 1 && f > arriveAt(i, k) + 10) k++;
      const tA = arriveAt(i, k), dep = k === 0 ? tA - 44 - Math.floor(hash(i, 1) * 10) : arriveAt(i, k - 1) + 10;
      a.copy(k === 0 ? HUB : top(targetOf(i, k - 1))); b.copy(top(targetOf(i, k)));
      const u = easeInOutCubic(invLerp(dep, tA, f));
      m.copy(a).add(b).multiplyScalar(0.5); m.y += 0.6 + a.distanceTo(b) * 0.12;
      pos.copy(a).multiplyScalar((1 - u) ** 2).addScaledVector(m, 2 * u * (1 - u)).addScaledVector(b, u * u);
      const visible = f >= dep - 6 || k > 0;
      if (f >= tA) pos.y += Math.sin((f - tA) * 0.3) * 0.02;
      setInst(drones, i, [pos.x, pos.y, pos.z], visible ? [1, 1.4, 1] : [0, 0, 0], 0, f * 0.05 + i, 0);
      // ping: beam + ring while hovering
      const ping = f >= tA ? Math.exp(-((f - tA) / 7) * 2.2) : 0;
      const ci = targetOf(i, k);
      setInst(beams, i, [pos.x, pos.y, pos.z], [1, 0.34, 1]);
      beams.setColorAt(i, col.copy(white).multiplyScalar(ping * 0.55));
      const rs = 1 + (1 - ping) * 0.8;
      setInst(rings, i, [CUBES[ci].x, CUBES[ci].h + 0.012, CUBES[ci].z], [rs, 1, rs]);
      rings.setColorAt(i, col.copy(CUBES[ci].flagged ? orange : white).multiplyScalar(ping * 0.5));
      flash[ci] = Math.max(flash[ci], ping);
      gp.setXYZ(i, pos.x, pos.y, pos.z); gc.setXYZ(i, visible ? 0.5 : 0, visible ? 0.62 : 0, visible ? 0.8 : 0);
      // flagged cubes light at the beat after any probe reaches them
      for (let kk = 0; kk <= k; kk++) {
        const c2 = targetOf(i, kk), beat = BEAT * (kk + 1);
        if (CUBES[c2].flagged && f >= beat) lit[c2] = Math.max(lit[c2], easeOutCubic(invLerp(beat, beat + 8, f)));
      }
    }
    CUBES.forEach((c, j) => {
      setInst(bodies, j, [c.x, 0, c.z], [1, c.h, 1]);
      bodies.setColorAt(j, col.copy(steel).lerp(steelHi, hash(j, 2)).lerp(orange, lit[j] * 0.55));
      setInst(tops, j, [c.x, c.h + 0.006, c.z], [1, 1, 1]);
      tops.setColorAt(j, col.copy(topIdle).lerp(white, flash[j] * 0.8).lerp(topHot, lit[j]));
      const gi = ND + j;
      gp.setXYZ(gi, c.x, c.h + 0.15, c.z);
      gc.setXYZ(gi, lit[j] * 0.9, lit[j] * 0.38, lit[j] * 0.14);
    });
    for (const mm of [bodies, tops, drones, beams, rings]) { mm.instanceMatrix.needsUpdate = true; if (mm.instanceColor) mm.instanceColor.needsUpdate = true; }
    gp.needsUpdate = true; gc.needsUpdate = true;
  });

  const tall = tallness(w, h);
  const fov = fovFor(w, h, 30);
  const k = Math.min(f, 240);
  const camPos: V3 = [-4.6 + k * 0.004, 7.4 + tall * 0.4, 9.4 - k * 0.006];
  const target: V3 = [-1.25, -0.35 - tall * 0.2, 0.25];
  const bp = everyBeat(f, 12);
  return (
    <>
      <CamRig pos={camPos} target={target} fov={fov} />
      <Env intensity={0.55} />
      <Backdrop3D top="#16181D" bottom="#0A0B0D" glowA="#2A160E" dirA={[0.6, 0.0, -1]} powA={4} glowB="#162030" dirB={[-0.6, 0.1, -1]} powB={4} />
      <ambientLight intensity={0.3} />
      <directionalLight position={[-6, 9, 5]} intensity={1.6} color="#F3F6FF" />
      <directionalLight position={[6, 4, -6]} intensity={0.7} color="#9DB4DC" />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.001, 0]}>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color="#0D0E11" roughness={0.75} metalness={0.2} />
      </mesh>
      <primitive object={res.bodies} />
      <primitive object={res.tops} />
      <primitive object={res.rings} />
      <primitive object={res.beams} />
      <primitive object={res.drones} />
      <points geometry={res.gGeo} material={res.gMat} />
      {/* source node */}
      <group position={[HUB.x, 0, HUB.z]}>
        <mesh position={[0, 0.35, 0]}><cylinderGeometry args={[0.32, 0.4, 0.7, 6]} /><meshPhysicalMaterial color="#1A1C21" metalness={0.8} roughness={0.3} clearcoat={0.7} flatShading /></mesh>
        <mesh position={[0, 0.72, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[0.2, 0.26, 6]} /><meshBasicMaterial color={C.alert} toneMapped={false} /></mesh>
        <Glow pos={[0, 0.8, 0]} size={1.4 + bp * 0.4} color={C.alert} opacity={0.5} />
      </group>
    </>
  );
};

export const AgentSwarm: React.FC<MediaProps> = (p) => {
  const ready = useFontsReady();
  return (
    <Win w={p.w} h={p.h} bg="#0B0C0E">
      {ready ? <ThreeStage width={p.w} height={p.h} exposure={1.05} fog={['#0B0C0E', 13, 24]}><Scene {...p} /></ThreeStage> : null}
      <WinVignette strength={0.5} />
    </Win>
  );
};
