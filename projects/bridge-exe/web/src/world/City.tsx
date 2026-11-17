// ENVIRONMENTS B and C: an original riverfront city.
//  B (city): a simply supported girder solved by the Euler–Bernoulli beam FE (engineering/beam.ts). The deformed shape,
//    bending-moment and shear ribbons are drawn from the solved run only.
//  C (skyline): a cable-stayed concept. No cable / nonlinear model exists here, so it is drawn in neutral colours and
//    the UI says CINEMATIC MODEL — ANALYSIS UNAVAILABLE. No stress colours, no numbers.
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../store';
import { mulberry32 } from './noise';
import { segMatrix, viz } from './viz';
import { Truck } from './TrussBridge';
import { fmt } from '../engineering/units';

function windowTexture() {
  const cv = document.createElement('canvas'); cv.width = 64; cv.height = 128;
  const g = cv.getContext('2d')!, r = mulberry32(5);
  g.fillStyle = '#1a2533'; g.fillRect(0, 0, 64, 128);
  for (let y = 4; y < 128; y += 8) for (let x = 4; x < 64; x += 8) { const on = r() < 0.42; g.fillStyle = on ? `rgba(255,${200 + r() * 40},${130 + r() * 60},${0.6 + r() * 0.4})` : 'rgba(80,110,140,0.35)'; g.fillRect(x, y, 5, 5); }
  const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; return t;
}

export function City() {
  const env = useStore((s) => s.env), L = useStore((s) => s.beam.L), night = useStore((s) => s.night);
  const half = env === 'skyline' ? 62 : L / 2 - 1;
  const tex = useMemo(windowTexture, []);
  const towers = useMemo(() => {
    const r = mulberry32(env === 'skyline' ? 31 : 17), out: { x: number; z: number; w: number; d: number; h: number; c: string }[] = [];
    for (let i = 0; i < 260; i++) {
      const side = r() < 0.5 ? -1 : 1, x = side * (half + 22 + r() * 260), z = (r() - 0.5) * 520;
      if (Math.abs(z) < 16 && Math.abs(x) < half + 60) continue;
      const far = Math.min(1, Math.abs(x) / 250);
      out.push({ x, z, w: 10 + r() * 16, d: 10 + r() * 16, h: 10 + r() * (30 + far * 110), c: ['#3d4c5c', '#55606b', '#6a7480', '#2f3d4d'][Math.floor(r() * 4)] });
    }
    return out;
  }, [env, half]);
  const ref = useRef<THREE.InstancedMesh>(null!);
  useEffect(() => {
    const m = ref.current; if (!m) return; const M = new THREE.Matrix4(), c = new THREE.Color();
    towers.forEach((t, i) => { m.setMatrixAt(i, M.compose(new THREE.Vector3(t.x, t.h / 2 - 1, t.z), new THREE.Quaternion(), new THREE.Vector3(t.w, t.h, t.d))); m.setColorAt(i, c.set(t.c)); });
    m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; m.computeBoundingSphere();
  }, [towers]);
  return (
    <group>
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh position={[s * (half + 300), -1.5, 0]} receiveShadow><boxGeometry args={[600, 3, 1400]} /><meshStandardMaterial color="#6f7a6a" roughness={0.95} /></mesh>
          <mesh position={[s * (half + 9), -0.95, 0]} receiveShadow><boxGeometry args={[18, 0.1, 1400]} /><meshStandardMaterial color="#b9b2a4" roughness={0.9} /></mesh>
          <mesh position={[s * (half + 0.6), -3.2, 0]}><boxGeometry args={[1.2, 5, 1400]} /><meshStandardMaterial color="#8d8a82" roughness={0.9} /></mesh>
        </group>
      ))}
      <mesh rotation-x={-Math.PI / 2} position-y={-4.2}><planeGeometry args={[half * 2 + 2, 1400]} /><meshStandardMaterial color={night ? '#0c2230' : '#2d5560'} roughness={0.06} metalness={0.4} /></mesh>
      <instancedMesh ref={ref} args={[undefined, undefined, towers.length]} castShadow receiveShadow>
        <boxGeometry /><meshStandardMaterial map={tex} emissiveMap={tex} emissive={night ? '#ffffff' : '#000000'} emissiveIntensity={night ? 1.2 : 0} roughness={0.35} metalness={0.4} />
      </instancedMesh>
    </group>
  );
}

const Mx = new THREE.Matrix4(), a = new THREE.Vector3(), b = new THREE.Vector3();

export function BeamBridge() {
  const beam = useStore((s) => s.beam), res = useStore((s) => s.beamResult), dirty = useStore((s) => s.beamDirty), lens = useStore((s) => s.lens);
  const labels = useStore((s) => s.showLabels);
  const ok = res && res.status === 'solved' && !dirty ? res : null;
  const girder = useRef<THREE.InstancedMesh>(null!), ribbon = useRef<THREE.InstancedMesh>(null!);
  const n = ok ? ok.xs.length : 65;
  useFrame(() => {
    const s = useStore.getState(), k = ok ? viz.k : 0, mag = s.mag;
    const xs = ok ? ok.xs : Array.from({ length: 65 }, (_, i) => (beam.L * i) / 64), uy = ok ? ok.uy : xs.map(() => 0);
    for (let i = 0; i < xs.length - 1; i++) {
      a.set(xs[i] - beam.L / 2, uy[i] * mag * k, 0); b.set(xs[i + 1] - beam.L / 2, uy[i + 1] * mag * k, 0);
      const len = a.distanceTo(b), ang = Math.atan2(b.y - a.y, b.x - a.x);
      girder.current.setMatrixAt(i, Mx.compose(a.clone().add(b).multiplyScalar(0.5).setY((a.y + b.y) / 2 - 0.6), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), ang), new THREE.Vector3(len + 0.01, 1.5, 9)));
    }
    girder.current.count = xs.length - 1; girder.current.instanceMatrix.needsUpdate = true; girder.current.computeBoundingSphere();
    // diagram ribbon: bending moment (axial lens slot) or shear (util lens slot), from the solved element end forces
    if (ok && (lens === 'axial' || lens === 'util')) {
      const vals = ok.segments.map((g) => (lens === 'axial' ? (g.M0 + g.M1) / 2 : (g.V0 + g.V1) / 2));
      const max = Math.max(...vals.map(Math.abs), 1e-9);
      ok.segments.forEach((g, i) => {
        const h = (vals[i] / max) * 5;
        ribbon.current.setMatrixAt(i, segMatrix(a.set((g.x0 + g.x1) / 2 - beam.L / 2, 2.2, 4.8), b.set((g.x0 + g.x1) / 2 - beam.L / 2, 2.2 + Math.abs(h), 4.8), (g.x1 - g.x0) / 2, Mx, 0.05));
        ribbon.current.setColorAt(i, new THREE.Color(lens === 'axial' ? (vals[i] >= 0 ? '#F5A64D' : '#63E5FA') : vals[i] >= 0 ? '#58D6AF' : '#FF6C70'));
      });
      ribbon.current.count = ok.segments.length;
    } else ribbon.current.count = 0;
    ribbon.current.instanceMatrix.needsUpdate = true; if (ribbon.current.instanceColor) ribbon.current.instanceColor.needsUpdate = true; ribbon.current.computeBoundingSphere();
  });
  const P = beam.points[0];
  return (
    <group>
      <instancedMesh key={`g${n}`} ref={girder} args={[undefined, undefined, n]} castShadow receiveShadow>
        <boxGeometry /><meshStandardMaterial color={lens === 'real' ? '#c7c2b8' : '#7e8a96'} roughness={0.6} metalness={0.2} />
      </instancedMesh>
      <instancedMesh key={`r${n}`} ref={ribbon} args={[undefined, undefined, n]}>
        <boxGeometry /><meshBasicMaterial toneMapped={false} transparent opacity={0.85} />
      </instancedMesh>
      {[-1, 1].map((s) => <mesh key={s} position={[s * beam.L / 2, -2.2, 0]} castShadow><boxGeometry args={[1.4, 2.2, 9.4]} /><meshStandardMaterial color="#8f8b84" roughness={0.9} /></mesh>)}
      {P ? <Truck x={P.x - beam.L / 2} y={0.2} tint="#cfd8df" /> : null}
      {labels && ok ? ok.reactions.map((r) => <Html zIndexRange={[4, 0]} key={r.x} position={[r.x - beam.L / 2, -4.2, 5]} center className="tag tag-react">R {fmt.kN(r.ry_N, 0)}</Html>) : null}
      {labels && ok ? <Html zIndexRange={[4, 0]} position={[ok.metrics.at_m - beam.L / 2, -2.6, 5]} center className="tag tag-load">δmax {fmt.mm(ok.metrics.maxAbsDeflection_m)}</Html> : null}
      {labels && ok && (lens === 'axial' || lens === 'util') ? <Html zIndexRange={[4, 0]} position={[0, 8.4, 4.8]} center className="tag tag-dim">{lens === 'axial' ? `BENDING MOMENT · max ${(ok.metrics.maxAbsMoment_Nm / 1e3).toFixed(0)} kN·m` : `SHEAR · max ${fmt.kN(ok.metrics.maxAbsShear_N, 0)}`}</Html> : null}
    </group>
  );
}

/** concept only: no analysis, neutral colours */
export function CableStayed() {
  const pyl = -34, deckY = 7.5, H = 66;
  const cables = useMemo(() => {
    const out: [THREE.Vector3, THREE.Vector3][] = [];
    for (let i = 1; i <= 9; i++) for (const z of [-5.2, 5.2]) {
      out.push([new THREE.Vector3(pyl, H - 4 - i * 2.4, z * 0.15), new THREE.Vector3(pyl + i * 9.5, deckY + 0.6, z)]);
      out.push([new THREE.Vector3(pyl, H - 4 - i * 2.4, z * 0.15), new THREE.Vector3(pyl - i * 4.6, deckY + 0.6, z)]);
    }
    return out;
  }, []);
  const ref = useRef<THREE.InstancedMesh>(null!);
  useEffect(() => { cables.forEach(([p, q], i) => ref.current?.setMatrixAt(i, segMatrix(p, q, 0.09, new THREE.Matrix4()))); if (ref.current) { ref.current.instanceMatrix.needsUpdate = true; ref.current.computeBoundingSphere(); } }, [cables]);
  return (
    <group>
      <mesh position={[0, deckY, 0]} castShadow receiveShadow><boxGeometry args={[150, 1.4, 12]} /><meshStandardMaterial color="#c9ccd0" roughness={0.6} /></mesh>
      {[-3.4, 3.4].map((z) => <mesh key={z} position={[pyl, H / 2 - 4, z]} rotation-x={z > 0 ? -0.05 : 0.05} castShadow><boxGeometry args={[3, H, 2.2]} /><meshStandardMaterial color="#d8d6d0" roughness={0.7} /></mesh>)}
      <instancedMesh ref={ref} args={[undefined, undefined, cables.length]}><cylinderGeometry args={[1, 1, 1, 6]} /><meshStandardMaterial color="#eef2f5" roughness={0.3} metalness={0.6} /></instancedMesh>
      {[-62, 62].map((x) => <mesh key={x} position={[x, deckY / 2 - 1.5, 0]}><boxGeometry args={[3, deckY + 3, 11]} /><meshStandardMaterial color="#9a978f" /></mesh>)}
    </group>
  );
}
