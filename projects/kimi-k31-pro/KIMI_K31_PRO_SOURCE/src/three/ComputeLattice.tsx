// Scene 03's worlds: a lattice of compute modules with light pulses running along their links (concept visualization,
// not Kimi's architecture), and a context field: a document stack that fans open and spills into a wall of tiles.
import React, { useMemo } from 'react';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mulberry32 } from '../lib/rng';
import { useDotTexture } from './MoonScene';

interface Mod { p: THREE.Vector3; s: THREE.Vector3 }

function buildLattice() {
  const r = mulberry32(303), mods: Mod[] = [];
  for (let k = 0; k < 30; k++) for (let j = -3; j <= 3; j++) for (let i = -4; i <= 4; i++) {
    const x = i * 1.7, y = j * 1.35, z = 4 - k * 1.55;
    if (Math.abs(x) < 1.6 && Math.abs(y) < 1.2) continue;          // the corridor the camera flies through
    if (r() < 0.38) continue;
    mods.push({ p: new THREE.Vector3(x + (r() - 0.5) * 0.25, y + (r() - 0.5) * 0.2, z), s: new THREE.Vector3(0.9 + r() * 0.5, 0.45 + r() * 0.5, 0.8 + r() * 0.6) });
  }
  const links: [THREE.Vector3, THREE.Vector3][] = [];
  for (let a = 0; a < mods.length; a++) for (let b = a + 1; b < Math.min(mods.length, a + 40); b++) {
    const d = mods[a].p.distanceTo(mods[b].p);
    if (d < 1.9 && r() < 0.55) links.push([mods[a].p, mods[b].p]);
  }
  return { mods, links };
}

export const Lattice: React.FC<{ t: number; glow: number }> = ({ t, glow }) => {
  const tex = useDotTexture();
  const L = useMemo(buildLattice, []);
  const { body, slit, lines, pulseGeo, pulses } = useMemo(() => {
    const g = new RoundedBoxGeometry(1, 1, 1, 2, 0.08);
    const mat = new THREE.MeshStandardMaterial({ color: '#1B2550', metalness: 0.85, roughness: 0.32 });
    const body = new THREE.InstancedMesh(g, mat, L.mods.length);
    const slitG = new THREE.PlaneGeometry(1, 0.06);
    const slit = new THREE.InstancedMesh(slitG, new THREE.MeshBasicMaterial({ color: '#5CE1FF', toneMapped: false, transparent: true, opacity: 0.9 }), L.mods.length * 2);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion();
    L.mods.forEach((md, i) => {
      body.setMatrixAt(i, m.compose(md.p, q, md.s));
      // two glowing slits on the face pointing at the corridor
      const side = Math.abs(md.p.x) > Math.abs(md.p.y * 1.25) ? new THREE.Vector3(-Math.sign(md.p.x), 0, 0) : new THREE.Vector3(0, -Math.sign(md.p.y), 0);
      const rot = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), side);
      for (let k = 0; k < 2; k++) {
        const c = md.p.clone().add(side.clone().multiply(md.s).multiplyScalar(0.502)).add(new THREE.Vector3(0, (k - 0.5) * md.s.y * 0.4, 0));
        if (side.y !== 0) c.set(md.p.x + (k - 0.5) * md.s.x * 0.4, md.p.y + side.y * md.s.y * 0.502, md.p.z);
        slit.setMatrixAt(i * 2 + k, m.compose(c, rot, new THREE.Vector3(md.s.x * 0.7, 1, 1)));
      }
    });
    const pos = new Float32Array(L.links.length * 6);
    L.links.forEach(([a, b], i) => pos.set([a.x, a.y, a.z, b.x, b.y, b.z], i * 6));
    const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const lines = new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: '#5CE1FF', transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false }));
    const r = mulberry32(17), n = 1800;
    const pulses = Array.from({ length: n }, () => ({ l: Math.floor(r() * L.links.length), ph: r(), sp: 0.35 + r() * 0.9 }));
    const pulseGeo = new THREE.BufferGeometry(); pulseGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    return { body, slit, lines, pulseGeo, pulses };
  }, [L]);
  const arr = pulseGeo.attributes.position.array as Float32Array;
  pulses.forEach((p, i) => {
    const [a, b] = L.links[p.l], u = (p.ph + t * p.sp) % 1;
    arr[i * 3] = a.x + (b.x - a.x) * u; arr[i * 3 + 1] = a.y + (b.y - a.y) * u; arr[i * 3 + 2] = a.z + (b.z - a.z) * u;
  });
  pulseGeo.attributes.position.needsUpdate = true; pulseGeo.computeBoundingSphere();
  (slit.material as THREE.MeshBasicMaterial).opacity = 0.35 + 0.6 * glow;
  return (
    <group>
      <primitive object={body} />
      <primitive object={slit} />
      <primitive object={lines} />
      <points geometry={pulseGeo}>
        <pointsMaterial map={tex} size={0.16} sizeAttenuation color="#BFF3FF" transparent opacity={0.95} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </points>
    </group>
  );
};

function paperTexture(seed: number) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 332;
  const g = c.getContext('2d')!, r = mulberry32(seed);
  g.fillStyle = '#E9EEF7'; g.fillRect(0, 0, 256, 332);
  g.fillStyle = '#0E1526'; g.fillRect(22, 24, 120, 10);
  for (let y = 52; y < 312; y += 11) {
    if (r() < 0.12) { y += 8; continue; }
    g.fillStyle = r() < 0.08 ? '#1BA8D6' : '#8E99AE';
    g.fillRect(22, y, 70 + r() * 142, 4);
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}

export const TILE_COLS = 96, TILE_ROWS = 54;

/** document stack that fans open (fan 0..1), then spills (spill 0..1) into a wall of context tiles (fill 0..1) */
export const ContextField: React.FC<{ fan: number; spill: number; fill: number; flatten: number }> = ({ fan, spill, fill, flatten }) => {
  const sheets = 12;
  const texes = useMemo(() => Array.from({ length: sheets }, (_, i) => paperTexture(40 + i)), []);
  const { tiles, order } = useMemo(() => {
    const n = TILE_COLS * TILE_ROWS, r = mulberry32(5);
    const g = new RoundedBoxGeometry(1, 1, 0.12, 1, 0.12);
    const tiles = new THREE.InstancedMesh(g, new THREE.MeshBasicMaterial({ color: '#ffffff', toneMapped: false }), n);
    const col = new THREE.Color(), navy = new THREE.Color('#0C1A3E'), cy = new THREE.Color('#5CE1FF'), vi = new THREE.Color('#8C7DFF'), am = new THREE.Color('#FFB547');
    for (let i = 0; i < n; i++) {
      // colours mix in linear space, so most tiles stay close to navy and ~18% light up
      const v = r(), lit = r() < 0.18, k = lit ? 0.22 + 0.78 * r() : 0.012 + 0.05 * r();
      tiles.setColorAt(i, col.copy(navy).lerp(v < 0.012 ? am : v < 0.16 ? vi : cy, v < 0.012 ? 0.9 : k));
    }
    // reveal order: outward spiral from the centre, with a little seeded jitter
    const order = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const cx = (i % TILE_COLS) - TILE_COLS / 2 + 0.5, cy = Math.floor(i / TILE_COLS) - TILE_ROWS / 2 + 0.5;
      const d = Math.hypot(cx / 1.0, cy / 0.75) / Math.hypot(TILE_COLS / 2, TILE_ROWS / 2 / 0.75), a = (Math.atan2(cy, cx) / (Math.PI * 2) + 0.5) * 0.08;
      order[i] = Math.min(1, d * 0.92 + a + r() * 0.04);
    }
    return { tiles, order };
  }, []);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), s = new THREE.Vector3();
  const pitch = 0.24;
  for (let i = 0; i < TILE_COLS * TILE_ROWS; i++) {
    const c = i % TILE_COLS, rr = Math.floor(i / TILE_COLS);
    const gx = (c - TILE_COLS / 2 + 0.5) * pitch, gy = (rr - TILE_ROWS / 2 + 0.5) * pitch;
    const k = Math.max(0, Math.min(1, (fill - order[i]) / 0.08));
    // flatten: each row's tiles merge into one bar (the code rows of scene 04)
    const fx = flatten;
    p.set(gx, gy, -(1 - k) * 6);
    const sz = 0.2 * k;
    s.set(sz + fx * (pitch - sz + 0.001), sz * (1 - fx * 0.55), sz);
    q.setFromEuler(e.set((1 - k) * 1.2, (1 - k) * 0.8, 0));
    tiles.setMatrixAt(i, m.compose(p, q, s));
  }
  tiles.instanceMatrix.needsUpdate = true;
  return (
    <group>
      <group rotation={[-1.02 * (1 - flatten), 0, 0]} position={[0, -0.4 * (1 - flatten), 0]}><primitive object={tiles} /></group>
      {texes.map((tx, i) => {
        const a = (i - (sheets - 1) / 2) * 0.13 * fan;
        const out = Math.max(0, Math.min(1, spill * 1.4 - i * 0.03));
        return (
          <mesh key={i} position={[Math.sin(a) * 0.85 * fan, -0.42 + i * 0.012 * (1 - fan), 0.8 + i * 0.02 + out * 3]} rotation={[-0.08, 0, -a * 0.9]} scale={1 - out * 0.4}>
            <planeGeometry args={[0.86, 1.12]} />
            <meshStandardMaterial map={tx} transparent opacity={1 - out} roughness={0.7} metalness={0} side={THREE.DoubleSide} />
          </mesh>
        );
      })}
    </group>
  );
};
