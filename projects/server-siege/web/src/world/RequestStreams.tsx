// Request packets: glowing streaks along every link of the request path. One packet stands for PER_PACKET requests
// (labelled in the UI). Packets are a pure function of sim time and the sim's per-sample flow history: emission slot j
// exists if hash(j) < the flow at its emission time, and sits (now - emitted) * speed along its path. So nothing jumps
// when traffic changes, pausing freezes them, fast-forward speeds them up and the reel can seek to any frame.
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { Flow, Sim } from '../simulation/engine';
import { useStore } from '../store';
import { COLOR, POS, hash, slotPos, slotsOf } from './layout';

export const PER_PACKET = 250;          // requests per drawn packet
const SLOT_MS = 1000 / 240;            // emission slot length (max 240 packets/s per stream = 60,000 req/s)
const MAX = 7000;

interface Stream { key: number; a: THREE.Vector3; b: THREE.Vector3; lift: number; spread: number; spreadEnd: number; color: THREE.Color; speed: number; rate: (f: Flow) => number; len: number }

const C = (c: string, k: number) => new THREE.Color(c).multiplyScalar(k);
const COLS = { in: C(COLOR.cyan, 1.7), hit: C(COLOR.emerald, 2), app: C(COLOR.cyan, 1.9), db: C('#ffc860', 1.6), job: C(COLOR.violet, 2.2), resp: C('#7dffcf', 1.1), bad: C(COLOR.coral, 3) };

function streams(S: Sim): Stream[] {
  const out: Stream[] = [];
  const add = (key: number, a: THREE.Vector3, b: THREE.Vector3, lift: number, color: THREE.Color, speed: number, rate: (f: Flow) => number, spread = 0.35, spreadEnd = spread) =>
    out.push({ key, a, b, lift, spread, spreadEnd, color, speed, rate, len: a.distanceTo(b) + lift });
  const g = POS.gateway.clone().setY(2.2), lb = POS.lb.clone().setY(2.6), cache = POS.cache.clone().setY(4), db = POS.db.clone().setY(3.5);
  add(1, POS.client.clone().setY(2), g, 0, COLS.in, 13, (f) => f.arrivals, 9, 0.8);                       // the incoming wave
  add(2, g, cache, 3, COLS.hit, 12, (f) => f.hits, 0.4);                                                   // cache hits served at the edge
  add(3, cache, POS.client.clone().setY(5).setZ(-12), 2, COLS.hit, 14, (f) => f.hits, 0.4, 3);
  add(4, g, lb, 0.6, COLS.in, 12, (f) => f.toLb, 0.5);
  const slots = slotsOf(S.insts);
  for (const i of S.insts) {
    const k = slots.get(i.id); if (k === undefined || i.state === 'off') continue;
    const t = slotPos(k).setY(2.2);
    add(100 + i.id, lb, t.clone().setX(t.x - 1.6), 1.2, COLS.app, 12, (f) => f.toInst[i.id] ?? 0, 0.25);
    const share = (f: Flow) => (f.toLb ? (f.toInst[i.id] ?? 0) / f.toLb : 0);
    add(1000 + i.id, t.clone().setY(4), db, 4 + (k % 4), COLS.db, 13, (f) => f.toDb * share(f), 0.25);
    add(2000 + i.id, t.clone().setY(2), POS.jobsIn.clone().setY(1.6), 2, COLS.job, 11, (f) => f.toJobs * share(f), 0.2);
  }
  add(5, db.clone().setY(9), g.clone().setY(9), 9, COLS.resp, 18, (f) => f.dbDone, 0.6);                  // responses home
  add(6, lb, lb.clone().setY(9), 0, COLS.bad, 7, (f) => f.rejected + f.timedOut, 3.5, 5);                 // failures spark off
  return out;
}

export function RequestStreams() {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ toneMapped: false, transparent: true, opacity: 0.95, depthWrite: false, blending: THREE.AdditiveBlending }), []);
  const tmp = useMemo(() => new THREE.Object3D(), []), p = useMemo(() => new THREE.Vector3(), []), q = useMemo(() => new THREE.Vector3(), []), mid = useMemo(() => new THREE.Vector3(), []);
  useFrame(() => {
    const im = mesh.current; if (!im) return;
    const S = useStore.getState().sim, now = S.s.now, flows = S.flows;
    let n = 0;
    const flowAt = (ms: number): Flow | undefined => flows[Math.floor(ms / 100)] ?? (ms <= now ? S.s.flow : undefined);
    const bez = (st: Stream, u: number, out: THREE.Vector3) => {
      mid.copy(st.a).add(st.b).multiplyScalar(0.5); mid.y += st.lift;
      const v = 1 - u; out.set(v * v * st.a.x + 2 * v * u * mid.x + u * u * st.b.x, v * v * st.a.y + 2 * v * u * mid.y + u * u * st.b.y, v * v * st.a.z + 2 * v * u * mid.z + u * u * st.b.z);
    };
    for (const st of streams(S)) {
      const travel = (st.len / st.speed) * 1000;
      const j0 = Math.max(0, Math.floor((now - travel) / SLOT_MS)), j1 = Math.floor(now / SLOT_MS);
      for (let j = j0; j <= j1 && n < MAX; j++) {
        const born = j * SLOT_MS, f = flowAt(born); if (!f) continue;
        const prob = (st.rate(f) * 10) / PER_PACKET / (1000 / SLOT_MS);
        if (hash(j, st.key) >= prob) continue;
        const u = (now - born) / travel; if (u < 0 || u > 1) continue;
        bez(st, u, p); bez(st, Math.min(1, u + 0.02), q);
        const sp = (st.spread + (st.spreadEnd - st.spread) * u) * 2;
        const ox = (hash(j, st.key + 7) - 0.5) * sp, oy = (hash(j, st.key + 13) - 0.5) * sp * 0.5, oz = (hash(j, st.key + 29) - 0.5) * sp * 2;
        p.x += ox * 0.3; p.y += Math.abs(oy); p.z += oz; q.x += ox * 0.3; q.y += Math.abs(oy); q.z += oz;
        tmp.position.copy(p); tmp.lookAt(q);
        const s = st.key === 6 ? 0.7 : 1;
        tmp.scale.set(s, s, s * (1 + st.speed * 0.04)); tmp.updateMatrix();
        im.setMatrixAt(n, tmp.matrix); im.setColorAt(n, st.color); n++;
      }
    }
    im.count = n;
    im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true;
  });
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, MAX]} material={mat} frustumCulled={false}>
      <boxGeometry args={[0.14, 0.14, 0.42]} />
    </instancedMesh>
  );
}
