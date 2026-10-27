// indiaMapBlr: the compliant India tile map (see IndiaMap.tsx) with the beacon on Bengaluru (Anthropic India office, opened Feb 2026).
// pulses rippling out from an ADVISORY beacon on every beat. No cities, places or claims.
// Tile mask: hex cells (0.42 deg) whose centres fall inside the Survey-of-India-compliant outline of India (datameet
// "india-composite", CC-0: India incl. all of J&K / Ladakh and Arunachal Pradesh), plus island cells (Andaman & Nicobar,
// Lakshadweep) drawn smaller; a corridor rule keeps the Siliguri corridor joined. ILLUSTRATIVE.
import React, { useLayoutEffect, useMemo } from 'react';
import * as THREE from 'three';
import type { MediaProps } from './types';
import { ThreeStage, Env, CamRig, project, type V3 } from '../three/stage';
import { C } from '../styles/theme';
import { clamp, dampedSpring, easeInOutCubic, lerp } from '../lib/anim';
import { hash } from '../lib/rng';
import { Backdrop3D, BEAT, Glow, Label, Win, WinVignette, canvasTex, everyBeat, fovFor, hit, ramp, setInst, tallness, useFontsReady } from './_stub';

// rows "r:q,q,~q" (~ = island cell); pointy-top hexes, s = 0.42 deg in (lon-82)*cos22, lat-22 projection
const MASK = '-23:~14 -22:~-11,~14,~15 -21:-7,-6,~14 -20:-7,-6,-5,-4,~14 -19:~-13,~-11,-7,-6,-5,-4 -18:~-12,~-11,-7,-6,-5,-4,-3 -17:~-13,~-12,-8,-7,-6,-5,-4,~13 -16:~-12,-8,-7,-6,-5,-4,-3,~13,~14,~15 -15:-9,-8,-7,-6,-5,-4,-3,~13 -14:-9,-8,-7,-6,-5,-4,-3,14,~16 -13:-10,-9,-8,-7,-6,-5,-4,-3,~14 -12:-9,-8,-7,-6,-5,-4,-3 -11:-10,-9,-8,-7,-6,-5,-4,-3 -10:-10,-9,-8,-7,-6,-5,-4,-3,-2 -9:-11,-10,-9,-8,-7,-6,-5,-4,-3,-2,-1 -8:-11,-10,-9,-8,-7,-6,-5,-4,-3,-2,-1,0 -7:-11,-10,-9,-8,-7,-6,-5,-4,-3,-2,-1,0,1 -6:-11,-10,-9,-8,-7,-6,-5,-4,-3,-2,-1,0,1,2 -5:-12,-11,-10,-9,-8,-7,-6,-5,-4,-3,-2,-1,0,1,2 -4:-11,-10,-9,-8,-7,-6,-5,-4,-3,-2,-1,0,1,2,3,4 -3:-12,-11,-10,-9,-8,-7,-6,-5,-4,-3,-2,-1,0,1,2,3,4,5 -2:-14,-11,-10,-9,-8,-7,-6,-5,-4,-3,-2,-1,0,1,2,3,4,5,6 -1:-16,-15,-14,-13,-12,-11,-10,-9,-8,-7,-6,-5,-4,-3,-2,-1,0,1,2,3,4,5,~7,~8 0:-16,-15,-14,-13,-12,-11,-10,-9,-8,-7,-6,-5,-4,-3,-2,-1,0,1,2,3,4,5,6,7,8,9,14 1:-15,-14,-13,-12,-11,-10,-9,-8,-7,-6,-5,-4,-3,-2,-1,0,1,2,3,4,5,6,7,8,13 2:-17,-16,-15,-14,-13,-12,-11,-10,-9,-8,-7,-6,-5,-4,-3,-2,-1,0,1,2,3,4,5,6,7,8,12,14 3:~-18,-17,-16,-15,-14,-13,-12,-11,-10,-9,-8,-7,-6,-5,-4,-3,-2,-1,0,1,2,3,4,5,6,7,8,12,13,14,15 4:-14,-13,-12,-11,-10,-9,-8,-7,-6,-5,-4,-3,-2,-1,0,1,2,3,4,5,6,7,13,14,15,16 5:-14,-13,-12,-11,-10,-9,-8,-7,-6,-5,-4,-3,-2,-1,0,1,2,3,4,5,6,7,8,11,12,13,14,15 6:-14,-13,-12,-11,-10,-9,-8,-7,-6,-5,-4,-3,-2,-1,0,1,2,3,4,5,6,7,8,10,11,12,13,14,15,16 7:-15,-14,-13,-12,-11,-10,-9,-8,-7,-6,-5,-4,-3,-2,-1,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16 8:-15,-14,-13,-12,-11,-10,-9,-8,-7,-6,-5,-4,-3,-2,-1,0,1,2,3,8,9,13,14,15,16,17 9:-15,-14,-13,-12,-11,-10,-9,-8,-7,-6,-5,-4,-3,-2,-1,0,8,12,13,14,15,16,17,18 10:-12,-11,-10,-9,-8,-7,-6,-5,-4,-3,-2,-1,14,15,16,17,18,19 11:-12,-11,-10,-9,-8,-7,-6,-5,-4,-3,15,16,17,18 12:-11,-10,-9,-8,-7,-6,-5,-4,-3 13:-11,-10,-9,-8,-7,-6,-5,-4,-3,-2 14:-9,-8,-7,-6,-5,-4,-3 15:-10,-9,-8,-7,-6,-5 16:-8,-7,-6,-5 17:-10,-9,-8,-7,-6,-5,-4 18:-10,-9,-8,-7,-6,-5,-4 19:-11,-10,-9,-8,-7,-6,-5 20:-10,-9,-8,-7,-6,-5,-4,-3 21:-10,-9,-8,-7,-6,-5,-4,-3 22:-11,-10,-9,-8,-7,-4 23:-12,-11,-10,-9';
const S = 0.42, HW = Math.sqrt(3) * S, RS = 1.5 * S, K = 0.235;   // K: projected degrees -> world units
type Cell = { x: number; z: number; island: boolean; seed: number };
function cells(): Cell[] {
  const out: Cell[] = [];
  for (const row of MASK.split(' ')) {
    const [rs, qs] = row.split(':'); const r = Number(rs);
    for (const t of qs.split(',')) {
      const island = t.startsWith('~'), q = Number(island ? t.slice(1) : t);
      const cx = q * HW + (Math.abs(r) % 2 === 1 ? HW / 2 : 0), cy = r * RS;
      out.push({ x: cx * K, z: -cy * K, island, seed: hash(q, r) });
    }
  }
  // centre the mainland bounding box
  const xs = out.map((c) => c.x), zs = out.map((c) => c.z);
  const ox = (Math.min(...xs) + Math.max(...xs)) / 2, oz = (Math.min(...zs) + Math.max(...zs)) / 2;
  return out.map((c) => ({ ...c, x: c.x - ox, z: c.z - oz }));
}
const CELLS = cells();
// beacon over central India (a location, deliberately unlabelled): lon 78.6, lat 23.2
const BEACON: [number, number] = (() => {
  const xs = CELLS.map((c) => c.x), zs = CELLS.map((c) => c.z);
  // recompute the same centring offset in projected space
  const raw = (lon: number, lat: number) => [((lon - 82) * Math.cos((22 * Math.PI) / 180)) * K, -(lat - 22) * K];
  const all: number[][] = [];
  for (const row of MASK.split(' ')) { const [rs, qs] = row.split(':'); const r = Number(rs); for (const t of qs.split(',')) { const q = Number(t.replace('~', '')); all.push([(q * HW + (Math.abs(r) % 2 === 1 ? HW / 2 : 0)) * K, -r * RS * K]); } }
  const ox = (Math.min(...all.map((a) => a[0])) + Math.max(...all.map((a) => a[0]))) / 2, oz = (Math.min(...all.map((a) => a[1])) + Math.max(...all.map((a) => a[1]))) / 2;
  void xs; void zs;
  const b = raw(77.59, 12.97);   // Bengaluru
  return [b[0] - ox, b[1] - oz];
})();

function floorTex() {
  const t = canvasTex(512, 512, (g, W) => {
    g.fillStyle = '#0D0E11'; g.fillRect(0, 0, W, W);
    g.fillStyle = 'rgba(160,170,190,0.16)';
    const step = 16;
    for (let y = 0; y < W / step; y++) for (let x = 0; x < W / step; x++) { g.beginPath(); g.arc(x * step + (y % 2 ? step / 2 : 0) + 4, y * step * 0.866 + 4, 1.1, 0, Math.PI * 2); g.fill(); }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(16, 16);
  return t;
}
function fadeTex() {
  return canvasTex(256, 256, (g, W) => {
    const gr = g.createRadialGradient(W / 2, W / 2, 0, W / 2, W / 2, W / 2);
    gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.55, 'rgba(0,0,0,0.35)'); gr.addColorStop(1, 'rgba(0,0,0,1)');
    g.fillStyle = gr; g.fillRect(0, 0, W, W);
  }, false);
}

const camFor = (f: number, w: number, h: number) => {
  const tall = tallness(w, h);
  const yaw = -0.22 + Math.sin(f * 0.0035) * 0.05 + f * 0.0005, el = 1.17 - tall * 0.04, dist = 12.5 - Math.min(f, 240) * 0.003 - tall * 0.6;
  const tgt: V3 = [0.2, 0, 0.28 - tall * 0.15];
  const pos: V3 = [tgt[0] + dist * Math.cos(el) * Math.sin(yaw), dist * Math.sin(el), tgt[2] + dist * Math.cos(el) * Math.cos(yaw)];
  return { pos, target: tgt, fov: fovFor(w, h, 33) };
};

const Scene: React.FC<MediaProps> = ({ w, h, f }) => {
  const res = useMemo(() => {
    const geo = new THREE.CylinderGeometry(S * K * 0.93, S * K * 0.93, 1, 6, 1);
    geo.translate(0, 0.5, 0);
    const mat = new THREE.MeshPhysicalMaterial({ color: '#FFFFFF', metalness: 0.35, roughness: 0.42, clearcoat: 0.6, clearcoatRoughness: 0.3, flatShading: true });
    const mesh = new THREE.InstancedMesh(geo, mat, CELLS.length);
    mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(CELLS.length * 3).fill(1), 3);
    mesh.frustumCulled = false;
    const floor = floorTex(), fade = fadeTex();
    return { mesh, floor, fade };
  }, []);

  // signal rings: one per beat (prewarmed so frame 0 already shows a pulse in flight)
  const rings: { r: number; a: number }[] = [];
  for (let k = -2; k * BEAT <= f; k++) {
    const t = f - k * BEAT, r = t * 0.055;
    if (r > 0 && r < 7.5) rings.push({ r, a: Math.exp(-r * 0.38) * (k % 4 === 0 ? 0.9 : 0.55) });
  }
  const base = new THREE.Color('#262A31'), hi = new THREE.Color('#353A44'), orange = new THREE.Color(C.alert), col = new THREE.Color();
  useLayoutEffect(() => {
    const m = res.mesh;
    CELLS.forEach((c, i) => {
      const d = Math.hypot(c.x - BEACON[0], c.z - BEACON[1]);
      let bump = 0;
      for (const rg of rings) bump += rg.a * Math.exp(-(((d - rg.r) / 0.15) ** 2));
      bump = Math.min(bump, 1.3);
      const hgt = (c.island ? 0.06 : 0.1 + c.seed * 0.08) + bump * 0.16;
      const sc = c.island ? 0.62 : 1;
      setInst(m, i, [c.x, 0, c.z], [sc, hgt, sc]);
      col.copy(base).lerp(hi, c.seed).lerp(orange, clamp(bump * 0.8) * 0.85);
      m.setColorAt(i, col);
    });
    m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true;
  });

  const cam = camFor(f, w, h);
  const bp = everyBeat(f, 12);
  const rise = dampedSpring((f + 18) / 60, 9, 0.7);
  return (
    <>
      <CamRig pos={cam.pos} target={cam.target} fov={cam.fov} />
      <Env intensity={0.5} />
      <Backdrop3D top="#16181D" bottom="#0B0C0F" glowA="#2A1A12" dirA={[0.3, 0.1, -1]} powA={4} glowB="#141C28" dirB={[-0.7, 0.2, -1]} powB={4} />
      <ambientLight intensity={0.35} />
      <directionalLight position={[-4, 9, 3]} intensity={1.8} color="#F4F6FF" />
      <directionalLight position={[5, 3, -6]} intensity={0.9} color="#9DB4DC" />
      <pointLight position={[BEACON[0], 1.4, BEACON[1]]} intensity={6 + bp * 6} distance={5} color="#FF7A3D" />
      {/* floor: faint hex-dot lattice, fading out */}
      <mesh position={[0, -0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[70, 70]} />
        <meshStandardMaterial map={res.floor} roughness={0.6} metalness={0.2} />
      </mesh>
      <mesh position={[0, 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[16, 16]} />
        <meshBasicMaterial color="#0B0C0F" alphaMap={res.fade} transparent depthWrite={false} />
      </mesh>
      <Glow pos={[0, -0.3, 0]} size={11} color="#2A3446" opacity={0.5} />
      <primitive object={res.mesh} />
      {/* ADVISORY beacon */}
      <group position={[BEACON[0], 0, BEACON[1]]}>
        <mesh position={[0, 0.9, 0]}>
          <cylinderGeometry args={[0.012, 0.03, 1.8, 12, 1, true]} />
          <meshBasicMaterial color="#FFB08A" transparent opacity={0.65} toneMapped={false} depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
        <mesh position={[0, lerp(1.2, 1.9, rise) + Math.sin(f * 0.06) * 0.05, 0]} rotation={[0, f * 0.02, 0]} scale={[0.17, 0.24, 0.17]}>
          <octahedronGeometry args={[1, 0]} />
          <meshPhysicalMaterial color="#FF7A3D" emissive={C.alert} emissiveIntensity={0.8 + bp * 0.8} metalness={0.2} roughness={0.2} clearcoat={1} flatShading />
        </mesh>
        <Glow pos={[0, lerp(1.2, 1.9, rise), 0]} size={1.4 + bp * 0.5} color={C.alert} opacity={0.55} />
        <Glow pos={[0, 0.25, 0]} size={1.6} color={C.alert} opacity={0.35 + bp * 0.3} />
        <mesh position={[0, 0.32, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[1 + (1 - hit(f, Math.floor(f / BEAT) * BEAT, 30)) * 1.6, 1 + (1 - hit(f, Math.floor(f / BEAT) * BEAT, 30)) * 1.6, 1]}>
          <ringGeometry args={[0.2, 0.235, 48]} />
          <meshBasicMaterial color={C.alert} transparent opacity={0.7 * hit(f, Math.floor(f / BEAT) * BEAT, 30)} toneMapped={false} depthWrite={false} />
        </mesh>
      </group>
    </>
  );
};

export const IndiaMapBlr: React.FC<MediaProps> = (p) => {
  const ready = useFontsReady();
  const cam = camFor(p.f, p.w, p.h);
  const top = project([BEACON[0], 2.25, BEACON[1]], { pos: cam.pos, target: cam.target, fov: cam.fov }, p.w, p.h);
  const lp = ramp(p.f, 6, 24, easeInOutCubic);
  return (
    <Win w={p.w} h={p.h} bg="#0B0C0F">
      {ready ? <ThreeStage width={p.w} height={p.h} exposure={1.08} fog={['#0B0C0F', 13, 22]}><Scene {...p} /></ThreeStage> : null}
      <WinVignette strength={0.5} />
      <Label x={top[0]} y={top[1] - 44} anchor="center" text="BENGALURU" color={C.alert} p={lp} size={26} />
    </Win>
  );
};
