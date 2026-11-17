// The fixed districts: Edge Gateway, Cache Vault, Load Balancer, Database Core and the Job Conveyor. Each one reads
// the live sim every frame and shows its real state: brightness, colour, spin and crate counts all come from sim numbers.
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { DB_TIERS } from '../simulation/engine';
import { useStore } from '../store';
import { vclock } from './clock';
import { COLOR, POS, hash, recent, slotPos, slotsOf, utilColor } from './layout';

const sim = () => useStore.getState().sim;
const metal = () => new THREE.MeshStandardMaterial({ color: COLOR.metal, metalness: 0.85, roughness: 0.32 });
const glow = (c: string, k = 2) => new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(k), toneMapped: false });
const tmp = new THREE.Object3D(), col = new THREE.Color();

/** sum of a sample field over the run so far (a pure "integrated" spin angle: speed changes never make it jump) */
function integral(f: (s: { dbUtil: number; arrRate: number; jobUtil: number }) => number) {
  let a = 0; for (const s of sim().samples) a += f(s) * 0.1; return a;
}

// ------------------------------------------------------------------------------------------------------- Edge Gateway
export function EdgeGateway() {
  const rings = useRef<THREE.Group>(null), ringMat = useMemo(() => glow(COLOR.cyan, 1), []), beam = useRef<THREE.Mesh>(null);
  const m = useMemo(metal, []);
  useFrame(() => {
    const a = recent(sim(), (s) => s.arrRate) / 25000;
    ringMat.color.set(COLOR.cyan).multiplyScalar(0.8 + 2.6 * Math.min(1.2, a));
    if (rings.current) rings.current.children.forEach((r, i) => { r.rotation.x = vclock.t * (0.3 + i * 0.15) * (i % 2 ? -1 : 1) + integral((s) => s.arrRate / 20000) * 0.6; });
    if (beam.current) { beam.current.position.y = 1 + ((vclock.t * 0.6) % 1) * 11; (beam.current.material as THREE.MeshBasicMaterial).opacity = 0.12 + 0.25 * Math.min(1, a); }
  });
  return (
    <group position={POS.gateway}>
      {[-8, 8].map((z) => (
        <group key={z} position={[0, 0, z]}>
          <mesh castShadow material={m} position-y={6.5}><boxGeometry args={[2.4, 13, 2.4]} /></mesh>
          <mesh position={[1.25, 6.5, 0]} material={ringMat}><boxGeometry args={[0.08, 12, 0.5]} /></mesh>
          <mesh position={[0, 13.4, 0]} material={m}><boxGeometry args={[3.2, 0.8, 3.2]} /></mesh>
        </group>
      ))}
      <mesh castShadow material={m} position-y={13.6}><boxGeometry args={[2.2, 1.2, 19]} /></mesh>
      <mesh position={[1.15, 13.6, 0]} material={ringMat}><boxGeometry args={[0.06, 0.3, 18]} /></mesh>
      <group ref={rings} position-y={6.8}>
        {[5.6, 4.6, 3.6].map((r, i) => (
          <mesh key={i} material={ringMat} rotation-y={Math.PI / 2}><torusGeometry args={[r, 0.09 + i * 0.03, 8, 96, Math.PI * (1.3 + i * 0.25)]} /></mesh>
        ))}
      </group>
      <mesh ref={beam} rotation-y={Math.PI / 2}><planeGeometry args={[15, 0.25]} /><meshBasicMaterial color={COLOR.cyan} transparent opacity={0.2} toneMapped={false} side={THREE.DoubleSide} depthWrite={false} /></mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={0.02}><ringGeometry args={[9, 9.3, 64]} /><meshBasicMaterial color={new THREE.Color(COLOR.cyan).multiplyScalar(1.5)} toneMapped={false} /></mesh>
      <pointLight color={COLOR.cyan} intensity={60} distance={30} position={[3, 8, 0]} />
    </group>
  );
}

// -------------------------------------------------------------------------------------------------------- Cache Vault
const CUBES = { x: 4, z: 4, y: 14 };
export function CacheVault() {
  const n = CUBES.x * CUBES.y * CUBES.z;
  const cubes = useRef<THREE.InstancedMesh>(null), frameMat = useMemo(() => glow(COLOR.emerald, 1), []);
  const m = useMemo(metal, []);
  const cubeMat = useMemo(() => new THREE.MeshBasicMaterial({ toneMapped: false }), []);
  useFrame(() => {
    const S = sim(), on = S.p.cacheOn, fill = on ? Math.min(1, S.cacheFill / S.p.cacheSize) : 0, hit = on ? recent(S, (s) => s.hitRate) : 0;
    const lit = Math.round(fill * n);
    frameMat.color.set(on ? COLOR.emerald : COLOR.grey).multiplyScalar(on ? 0.8 + 2 * hit : 0.4);
    const im = cubes.current; if (!im) return;
    for (let k = 0; k < n; k++) {
      const x = k % CUBES.x, z = Math.floor(k / CUBES.x) % CUBES.z, y = Math.floor(k / (CUBES.x * CUBES.z));
      tmp.position.set((x - 1.5) * 0.95, 0.9 + y * 0.72, (z - 1.5) * 0.95);
      const on_ = k < lit, flick = on_ ? 0.6 + 0.4 * Math.sin(vclock.t * 6 + hash(k) * 30) * hit : 0;
      tmp.scale.setScalar(on_ ? 0.62 : 0.3); tmp.updateMatrix(); im.setMatrixAt(k, tmp.matrix);
      im.setColorAt(k, on_ ? col.set(COLOR.emerald).multiplyScalar(1 + 2.2 * flick) : col.set('#13243a'));
    }
    im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true;
  });
  return (
    <group position={POS.cache}>
      <mesh material={m} position-y={0.3} castShadow receiveShadow><boxGeometry args={[6.4, 0.6, 6.4]} /></mesh>
      <instancedMesh ref={cubes} args={[undefined, undefined, n]} material={cubeMat}><boxGeometry args={[1, 1, 1]} /></instancedMesh>
      <mesh position-y={6} renderOrder={2}>
        <boxGeometry args={[4.8, 11, 4.8]} />
        <meshPhysicalMaterial color={'#9fffe0'} metalness={0.1} roughness={0.05} transparent opacity={0.14} depthWrite={false} clearcoat={1} />
      </mesh>
      {[[-2.45, -2.45], [2.45, -2.45], [-2.45, 2.45], [2.45, 2.45]].map(([x, z], i) => (
        <mesh key={i} position={[x, 6, z]} material={frameMat}><boxGeometry args={[0.12, 11, 0.12]} /></mesh>
      ))}
      <mesh position-y={11.7} material={m}><boxGeometry args={[5.4, 0.5, 5.4]} /></mesh>
      <pointLight color={COLOR.emerald} intensity={30} distance={18} position={[0, 6, 4]} />
    </group>
  );
}

// ------------------------------------------------------------------------------------------------------ Load Balancer
export function LoadBalancer() {
  const head = useRef<THREE.Group>(null), ring = useRef<THREE.Mesh>(null), ringMat = useMemo(() => glow(COLOR.cyan, 2), []);
  const m = useMemo(metal, []);
  useFrame(() => {
    const S = sim(), now = S.s.now, live = S.insts.filter((i) => i.state === 'up'), slots = slotsOf(S.insts);
    // the arm aims where the strategy sends traffic: round robin steps through the rotation, least connections
    // points at the emptiest queue, weighted sweeps across the fleet
    let target: THREE.Vector3 | null = null;
    if (live.length) {
      let pick = live[0];
      if (S.p.lb === 'rr') pick = live[Math.floor(now / 60) % live.length];
      else if (S.p.lb === 'least') for (const i of live) { if (i.q.size < pick.q.size) pick = i; }
      else pick = live[Math.floor(((Math.sin(now / 900) + 1) / 2) * live.length * 0.999)];
      target = slotPos(slots.get(pick.id) ?? 0);
    }
    if (head.current && target) head.current.rotation.y = Math.atan2(-(target.z - POS.lb.z), target.x - POS.lb.x);
    if (ring.current) ring.current.rotation.z = integral((s) => s.arrRate / 8000) + vclock.t * 0.2;
    const rej = S.samples.length ? S.samples[S.samples.length - 1].failRate : 0;
    ringMat.color.set(rej > 500 ? COLOR.coral : COLOR.cyan).multiplyScalar(1.6 + Math.min(1.5, recent(S, (s) => s.arrRate) / 15000));
  });
  return (
    <group position={POS.lb}>
      <mesh material={m} position-y={0.5} castShadow receiveShadow><cylinderGeometry args={[4, 4.4, 1, 48]} /></mesh>
      <mesh material={m} position-y={2.2} castShadow><cylinderGeometry args={[1.3, 1.6, 3.2, 24]} /></mesh>
      <mesh ref={ring} position-y={2.4} rotation-x={-Math.PI / 2} material={ringMat}><torusGeometry args={[3.2, 0.12, 8, 64, Math.PI * 1.6]} /></mesh>
      <group ref={head} position-y={4.1}>
        <mesh material={m} castShadow><boxGeometry args={[1.6, 0.8, 1.6]} /></mesh>
        <mesh position-x={1.9} material={ringMat}><boxGeometry args={[2.6, 0.18, 0.18]} /></mesh>
        <mesh position-x={3.3} material={ringMat}><coneGeometry args={[0.35, 0.8, 12]} /></mesh>
      </group>
      <mesh rotation-x={-Math.PI / 2} position-y={1.02}><ringGeometry args={[2.2, 2.5, 48]} /><meshBasicMaterial color={new THREE.Color(COLOR.cyan).multiplyScalar(1.4)} toneMapped={false} /></mesh>
    </group>
  );
}

// ------------------------------------------------------------------------------------------------------ Database Core
const DBQ_MAX = 180;
export function DatabaseCore() {
  const core = useRef<THREE.Mesh>(null), rings = useRef<THREE.Group>(null), light = useRef<THREE.PointLight>(null);
  const coreMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#2a0f05', emissive: COLOR.orange, emissiveIntensity: 2, roughness: 0.3 }), []);
  const stripMat = useMemo(() => glow(COLOR.orange, 2), []), ringMat = useMemo(() => glow(COLOR.orange, 2), []);
  const warnMat = useMemo(() => new THREE.MeshBasicMaterial({ color: new THREE.Color(COLOR.coral).multiplyScalar(3), toneMapped: false, transparent: true, opacity: 0 }), []);
  const crates = useRef<THREE.InstancedMesh>(null);
  const m = useMemo(metal, []);
  const crateMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#2a1a10', emissive: COLOR.amber, emissiveIntensity: 0.35, metalness: 0.5, roughness: 0.4 }), []);
  useFrame(() => {
    const S = sim(), u = recent(S, (s) => s.dbUtil), hot = u >= 0.95, t = vclock.t;
    const flick = hot ? 0.5 + 0.5 * Math.sin(t * 22) : 0;
    coreMat.emissive.set(hot ? COLOR.coral : COLOR.orange);
    coreMat.emissiveIntensity = 1.2 + u * 3.5 + flick * 2;
    if (core.current) core.current.scale.setScalar(1 + 0.06 * Math.sin(t * (2 + u * 10)) * u);
    stripMat.color.set(utilColor(u)).multiplyScalar(1 + u * 2.5);
    ringMat.color.set(hot ? COLOR.coral : COLOR.orange).multiplyScalar(1.2 + u * 2.5);
    const spin = integral((s) => 0.4 + s.dbUtil * 5);
    if (rings.current) rings.current.children.forEach((r, i) => { r.rotation.set(spin * (0.6 + i * 0.35) * (i % 2 ? -1 : 1), spin * 0.3 * (i + 1), i * 0.9); });
    if (light.current) light.current.intensity = 80 + u * 260 + flick * 200;
    warnMat.opacity = hot ? 0.35 + 0.5 * flick : 0;
    // waiting requests: crates in arcs at the core's entrance (1 crate per ~110 queued queries)
    const im = crates.current; if (!im) return;
    const k = Math.min(DBQ_MAX, Math.ceil(S.dbQueued / 110));
    for (let j = 0; j < DBQ_MAX; j++) {
      const row = Math.floor(j / 30), a = Math.PI * 0.66 + ((j % 30) / 29) * Math.PI * 0.68, r = 8.7 + row * 0.8;
      tmp.position.set(Math.cos(a) * r, 0.42, -Math.sin(a) * r * -1);
      tmp.rotation.set(0, -a, 0); tmp.scale.setScalar(j < k ? 0.55 : 0.0001); tmp.updateMatrix(); im.setMatrixAt(j, tmp.matrix);
    }
    im.instanceMatrix.needsUpdate = true;
  });
  return (
    <group position={POS.db}>
      <mesh material={m} position-y={0.5} castShadow receiveShadow><cylinderGeometry args={[7.4, 8, 1, 6]} /></mesh>
      <mesh material={m} position-y={1.3} castShadow><cylinderGeometry args={[6, 6.6, 0.8, 6]} /></mesh>
      {Array.from({ length: 6 }, (_, i) => {
        const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
        return (
          <group key={i} position={[Math.cos(a) * 5.6, 0, Math.sin(a) * 5.6]} rotation-y={-a}>
            <mesh material={m} position-y={6.4} castShadow><boxGeometry args={[1.1, 10.5, 1.1]} /></mesh>
            <mesh material={stripMat} position={[-0.58, 6.4, 0]}><boxGeometry args={[0.06, 9.5, 0.3]} /></mesh>
          </group>
        );
      })}
      <mesh material={m} position-y={12} castShadow><cylinderGeometry args={[6.4, 6.4, 0.9, 6]} /></mesh>
      <mesh ref={core} material={coreMat} position-y={6.6}><icosahedronGeometry args={[2.6, 3]} /></mesh>
      <group ref={rings} position-y={6.6}>
        {[3.5, 4.1, 4.7].map((r, i) => <mesh key={i} material={ringMat}><torusGeometry args={[r, 0.1, 8, 96]} /></mesh>)}
      </group>
      <mesh rotation-x={-Math.PI / 2} position-y={1.75} material={warnMat}><ringGeometry args={[6.5, 7.6, 6]} /></mesh>
      <pointLight ref={light} color={COLOR.orange} intensity={120} distance={40} position={[0, 7, 0]} />
      <instancedMesh ref={crates} args={[undefined, undefined, DBQ_MAX]} material={crateMat} castShadow><boxGeometry args={[0.85, 0.85, 0.85]} /></instancedMesh>
    </group>
  );
}

// ------------------------------------------------------------------------------------------------------- Job Conveyor
const BOXES = 90, WORKER_SLOTS = 16;
export function QueueFacility() {
  const boxes = useRef<THREE.InstancedMesh>(null), bots = useRef<THREE.InstancedMesh>(null);
  const boxMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#2a1f4a', emissive: COLOR.violet, emissiveIntensity: 1.2, metalness: 0.4, roughness: 0.4 }), []);
  const botMat = useMemo(() => new THREE.MeshBasicMaterial({ toneMapped: false }), []);
  const m = useMemo(metal, []);
  const a = POS.jobsIn, b = POS.jobsOut, len = a.distanceTo(b), ang = Math.atan2(-(b.z - a.z), b.x - a.x);
  useFrame(() => {
    const S = sim(), queued = S.jobsQueued, k = Math.min(BOXES, Math.ceil(queued / 120)), ju = recent(S, (s) => s.jobUtil);
    const run = integral((s) => 0.5 + s.jobUtil * 2.5);
    const im = boxes.current;
    if (im) {
      for (let j = 0; j < BOXES; j++) {
        // boxes queue from the far end backwards; the belt moves them along at worker speed
        const u = 1 - ((j + 0.5) / BOXES) + ((run * 0.04) % (1 / BOXES));
        tmp.position.set(a.x + (b.x - a.x) * u, 1.25, a.z + (b.z - a.z) * u);
        tmp.rotation.set(0, ang, 0); tmp.scale.setScalar(j < k ? 0.55 : 0.0001); tmp.updateMatrix(); im.setMatrixAt(j, tmp.matrix);
      }
      im.instanceMatrix.needsUpdate = true;
    }
    const bm = bots.current;
    if (bm) {
      for (let j = 0; j < WORKER_SLOTS; j++) {
        const on = j < S.p.workers, x = j % 4, z = Math.floor(j / 4);
        tmp.position.set(POS.workers.x + (x - 1.5) * 1.6, 0.9 + (on ? 0.25 * Math.max(0, Math.sin(vclock.t * 8 + j)) * ju : 0), POS.workers.z + (z - 1.5) * 1.6);
        tmp.rotation.set(0, 0, 0); tmp.scale.set(1, on ? 1 : 0.2, 1); tmp.updateMatrix(); bm.setMatrixAt(j, tmp.matrix);
        bm.setColorAt(j, on ? col.set(COLOR.violet).multiplyScalar(0.8 + 2 * ju) : col.set('#1a1f33'));
      }
      bm.instanceMatrix.needsUpdate = true; if (bm.instanceColor) bm.instanceColor.needsUpdate = true;
    }
  });
  return (
    <group>
      <group position={[(a.x + b.x) / 2, 0, (a.z + b.z) / 2]} rotation-y={ang}>
        <mesh material={m} position-y={0.45} castShadow receiveShadow><boxGeometry args={[len, 0.9, 2.2]} /></mesh>
        <mesh position-y={0.92}><boxGeometry args={[len, 0.04, 1.8]} /><meshStandardMaterial color={'#0b0f1e'} roughness={0.9} /></mesh>
        {[-1.15, 1.15].map((z) => <mesh key={z} position={[0, 0.95, z]}><boxGeometry args={[len, 0.06, 0.06]} /><meshBasicMaterial color={new THREE.Color(COLOR.violet).multiplyScalar(2)} toneMapped={false} /></mesh>)}
      </group>
      <instancedMesh ref={boxes} args={[undefined, undefined, BOXES]} material={boxMat} castShadow><boxGeometry args={[1.2, 1, 1.2]} /></instancedMesh>
      <mesh material={m} position={[POS.workers.x, 0.25, POS.workers.z]} receiveShadow><boxGeometry args={[7.4, 0.5, 7.4]} /></mesh>
      <instancedMesh ref={bots} args={[undefined, undefined, WORKER_SLOTS]} material={botMat}><boxGeometry args={[0.9, 0.9, 0.9]} /></instancedMesh>
    </group>
  );
}

export const dbUnits = () => DB_TIERS[sim().p.dbTier].units;
