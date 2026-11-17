// The App District: one miniature skyscraper per app instance. A new instance's tower rises mechanically during its
// boot delay (scaffold + construction ring), a decommissioned one sinks into the board. Light bands fill with the
// instance's utilization; colour is its health. Queued requests stack as crates at the tower's door.
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useStore } from '../store';
import { vclock } from './clock';
import { COLOR, SINK_MS, clamp01, easeOutBack, hash, instColor, slotPos, slotsOf, smooth } from './layout';

const sim = () => useStore.getState().sim;
const BANDS = 9, CRATES = 30;
const tmp = new THREE.Object3D();

function Tower({ id, slot }: { id: number; slot: number }) {
  const p = useMemo(() => slotPos(slot), [slot]);
  const H = 5.2 + ((slot * 7) % 5) * 0.75;
  const group = useRef<THREE.Group>(null), body = useRef<THREE.Group>(null), scaffold = useRef<THREE.LineSegments>(null), ringRef = useRef<THREE.Mesh>(null);
  const crates = useRef<THREE.InstancedMesh>(null);
  const bodyMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#111a33', metalness: 0.9, roughness: 0.28 }), []);
  const bandMats = useMemo(() => Array.from({ length: BANDS }, () => new THREE.MeshBasicMaterial({ toneMapped: false })), []);
  const topMat = useMemo(() => new THREE.MeshBasicMaterial({ toneMapped: false }), []);
  const crateMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#10223a', emissive: COLOR.cyan, emissiveIntensity: 0.5, metalness: 0.5, roughness: 0.5 }), []);
  const edges = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(2.9, H, 2.9)), [H]);
  useFrame(() => {
    const S = sim(), i = S.insts.find((x) => x.id === id), now = S.s.now, g = group.current;
    if (!i || !g) return;
    // construction: 0..1 over the boot delay; decommission: sink over SINK_MS
    const boot = i.readyAt > i.launchedAt ? clamp01((now - i.launchedAt) / (i.readyAt - i.launchedAt)) : 1;
    const sink = i.state === 'off' ? clamp01((now - i.offAt) / SINK_MS) : 0;
    g.visible = sink < 1;
    if (body.current) { body.current.scale.y = Math.max(0.001, easeOutBack(smooth(boot)) * (1 - sink)); body.current.position.y = -sink * 0.5; }
    if (scaffold.current) { scaffold.current.visible = boot < 1; scaffold.current.position.y = H / 2 + 0.3; (scaffold.current.material as THREE.LineBasicMaterial).opacity = 0.35 + 0.4 * Math.sin(vclock.t * 9) ** 2; }
    if (ringRef.current) { ringRef.current.visible = boot < 1; ringRef.current.position.y = 0.4 + boot * H; ringRef.current.rotation.z = vclock.t * 3; }
    const c = new THREE.Color(instColor(i)), lit = i.state === 'up' || i.state === 'drain' ? Math.ceil(i.util * BANDS) : 0;
    const flicker = i.degraded ? (hash(Math.floor(vclock.t * 12), id) > 0.6 ? 0.25 : 1) : 1;
    bandMats.forEach((m, k) => {
      if (i.state === 'boot') m.color.set(COLOR.cyan).multiplyScalar(k / BANDS < boot ? 0.5 : 0.04);
      else if (i.state === 'off' || i.state === 'drain') m.color.set(COLOR.grey).multiplyScalar(0.25);
      else m.color.copy(c).multiplyScalar(k < lit ? 2.2 * flicker : 0.12);
    });
    topMat.color.copy(c).multiplyScalar(i.state === 'up' ? 1.5 + 1.5 * (0.5 + 0.5 * Math.sin(vclock.t * 4 + id)) : 0.2);
    // queued requests at the door: a log scale, so 40 and 4,000 both read
    const im = crates.current;
    if (im) {
      const n = i.q.size, k = n > 0 ? Math.min(CRATES, Math.ceil(Math.log2(1 + n / 25) * 4)) : 0;
      crateMat.emissive.set(n > i.q.cap * 0.5 ? COLOR.coral : n > 200 ? COLOR.amber : COLOR.cyan);
      for (let j = 0; j < CRATES; j++) {
        const x = j % 3, z = Math.floor(j / 3) % 2, y = Math.floor(j / 6);
        tmp.position.set(-2.1 - z * 0.62, 0.3 + y * 0.6, (x - 1) * 0.62);
        tmp.scale.setScalar(j < k ? 0.5 : 0.0001); tmp.updateMatrix(); im.setMatrixAt(j, tmp.matrix);
      }
      im.instanceMatrix.needsUpdate = true;
    }
  });
  return (
    <group ref={group} position={p}>
      <mesh position-y={0.2} receiveShadow castShadow><boxGeometry args={[3.6, 0.4, 3.6]} /><meshStandardMaterial color={COLOR.metal} metalness={0.85} roughness={0.35} /></mesh>
      <group ref={body}>
        <mesh material={bodyMat} position-y={0.4 + H / 2} castShadow><boxGeometry args={[2.5, H, 2.5]} /></mesh>
        {bandMats.map((m, k) => <mesh key={k} material={m} position-y={0.75 + (k + 0.5) * ((H - 0.7) / BANDS)}><boxGeometry args={[2.56, 0.13, 2.56]} /></mesh>)}
        <mesh material={bodyMat} position-y={0.55 + H} castShadow><boxGeometry args={[1.6, 0.35, 1.6]} /></mesh>
        <mesh material={topMat} position-y={1.1 + H}><cylinderGeometry args={[0.06, 0.06, 0.9, 6]} /></mesh>
        <mesh material={topMat} position-y={1.6 + H}><sphereGeometry args={[0.16, 10, 8]} /></mesh>
      </group>
      <lineSegments ref={scaffold} geometry={edges}><lineBasicMaterial color={new THREE.Color(COLOR.cyan).multiplyScalar(2)} transparent toneMapped={false} /></lineSegments>
      <mesh ref={ringRef} rotation-x={-Math.PI / 2}><ringGeometry args={[1.75, 1.95, 4, 1]} /><meshBasicMaterial color={new THREE.Color(COLOR.cyan).multiplyScalar(3)} toneMapped={false} side={THREE.DoubleSide} /></mesh>
      <instancedMesh ref={crates} args={[undefined, undefined, CRATES]} material={crateMat} castShadow><boxGeometry args={[1, 1, 1]} /></instancedMesh>
    </group>
  );
}

/** re-renders when the instance list changes (tracked through the store's version), places a Tower per visible slot */
export function ServerDistrict() {
  useStore((s) => s.version);
  const S = useStore((s) => s.sim), slots = slotsOf(S.insts), now = S.s.now;
  const visible = S.insts.filter((i) => slots.has(i.id) && !(i.state === 'off' && now - i.offAt > SINK_MS));
  return (
    <group>
      {/* the district's floor pads for all 16 slots */}
      {Array.from({ length: 16 }, (_, k) => {
        const q = slotPos(k);
        return <mesh key={k} position={[q.x, 0.015, q.z]} rotation-x={-Math.PI / 2}><ringGeometry args={[1.9, 2.0, 4, 1, Math.PI / 4]} /><meshBasicMaterial color={'#12385a'} toneMapped={false} /></mesh>;
      })}
      {visible.map((i) => <Tower key={i.id} id={i.id} slot={slots.get(i.id)!} />)}
    </group>
  );
}
