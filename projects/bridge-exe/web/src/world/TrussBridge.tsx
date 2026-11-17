// The hero bridge. Two identical truss planes (z = ±HALF_W); each is the analysed 2D truss, member for member, with
// the solver's IDs. Deck slabs, floor beams, railings and the top lateral bracing are VISUAL ONLY (deck loads reach
// the truss by the stated tributary rule). Every position is recomputed per frame from the run's displacements × the
// visual magnification × viz.k, so the deformation can ease in without React re-renders.
import { useMemo, useRef, useState } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { Html, Line } from '@react-three/drei';
import * as THREE from 'three';
import { useFresh, useStore } from '../store';
import { HALF_W, PAL, memberColor, nodeWorld, segMatrix, viz } from './viz';
import { chs } from '../engineering/educationalChecks';
import type { SolveOk, TrussModel } from '../engineering/types';
import { fmt } from '../engineering/units';
import { isDraggable, snap } from '../geometry/trussPresets';
import { deckNodes } from '../engineering/loadDistribution';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const M4 = new THREE.Matrix4(), C = new THREE.Color(), va = V(), vb = V();
const DECK_Y = 0.42;

/** the model + result the meshes should draw right now */
export function useDrawn() {
  const model = useStore((s) => s.model), result = useStore((s) => s.result), fresh = useFresh();
  const ok = result && result.status === 'solved' ? (result as SolveOk) : null;
  return { model, ok: fresh ? ok : null, stale: !fresh && !!ok, lastOk: ok };
}

export type Snap = import('../store').Snapshot;
/** the model, run and node positions to draw this frame: the live design, or a saved A/B snapshot */
function frameState(snap?: Snap | null) {
  const s = useStore.getState();
  if (snap) {
    const ok = snap.result.status === 'solved' ? (snap.result as SolveOk) : null, k = ok ? viz.k : 0;
    return { s, model: snap.model, ok, fresh: true, k, vx: snap.design.loads.vehicle, ...nodeWorld(snap.model, ok, k, s.mag) };
  }
  const fresh = !!s.result && s.result.inputsHash === s.modelHash;
  const ok = fresh && s.result?.status === 'solved' ? (s.result as SolveOk) : null;
  const k = ok ? viz.k : 0;
  return { s, model: s.model, ok, fresh, k, vx: s.design.loads.vehicle, ...nodeWorld(s.model, ok, k, s.mag) };
}

function Members({ snap }: { snap?: Snap | null }) {
  const ref = useRef<THREE.InstancedMesh>(null!);
  const live = useStore((s) => s.model), model = snap?.model ?? live, count = model.members.length * 2;
  const set = useStore((s) => s.set);
  useFrame(() => {
    const mesh = ref.current; if (!mesh) return;
    const { s, model, ok, fresh, pos, span } = frameState(snap);
    const res = new Map(ok?.members.map((m) => [m.id, m]) ?? []);
    const dmap = new Map(ok?.nodes.map((n) => [n.id, Math.hypot(n.ux_m, n.uy_m)]) ?? []);
    const maxN = ok?.metrics.maxAbsAxial_N ?? 1;
    model.members.forEach((m, i) => {
      const a = pos.get(m.a)!, b = pos.get(m.b)!, r = res.get(m.id);
      let rad = Math.max(0.075, chs(m.A).D / 2) * 1.2;
      if (s.lens === 'path' && r) rad = 0.06 + 0.32 * Math.abs(r.axial_N) / maxN;
      memberColor(s.lens, r, ok, fresh, C, ((dmap.get(m.a) ?? 0) + (dmap.get(m.b) ?? 0)) / 2);
      if (viz.xray > 0) { C.copy(PAL.tension); rad *= 0.55; }
      if (!snap && s.selected === m.id) C.lerp(PAL.white, 0.55); else if (!snap && s.hovered === m.id) C.lerp(PAL.white, 0.3);
      if (viz.pulse >= 0) { const px = -span / 2 + viz.pulse * span, mx = (a.x + b.x) / 2; C.lerp(PAL.white, Math.max(0, 1 - Math.abs(mx - px) / 4) * 0.5); }  // RUN feedback sweep, not a stress wave
      for (const p of [0, 1]) {
        const z = p ? -HALF_W : HALF_W;
        mesh.setMatrixAt(i + p * model.members.length, segMatrix(va.set(a.x, a.y, z), vb.set(b.x, b.y, z), rad, M4));
        mesh.setColorAt(i + p * model.members.length, C);
      }
    });
    mesh.count = model.members.length * 2;
    mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  });
  const idOf = (e: ThreeEvent<PointerEvent | MouseEvent>) => (e.instanceId == null ? null : model.members[e.instanceId % model.members.length]?.id ?? null);
  const reel = useStore((s) => s.reel);
  return (
    <instancedMesh key={count} ref={ref} args={[undefined, undefined, Math.max(1, count)]} castShadow receiveShadow
      onPointerMove={reel || snap ? undefined : (e) => { e.stopPropagation(); const id = idOf(e); if (useStore.getState().hovered !== id) set({ hovered: id }); }}
      onPointerOut={reel || snap ? undefined : () => set({ hovered: null })}
      onClick={reel || snap ? undefined : (e) => { e.stopPropagation(); const st = useStore.getState(); if (st.addMode) return; set({ selected: idOf(e) }); }}>
      <cylinderGeometry args={[1, 1, 1, 14, 1]} />
      <meshStandardMaterial roughness={0.36} metalness={0.78} envMapIntensity={1.1} />
    </instancedMesh>
  );
}

function Joints({ snap }: { snap?: Snap | null }) {
  const plates = useRef<THREE.InstancedMesh>(null!), bolts = useRef<THREE.InstancedMesh>(null!);
  const live = useStore((s) => s.model.nodes.length), n = snap?.model.nodes.length ?? live;
  const boltOff = useMemo(() => [[-0.28, -0.22], [0, -0.26], [0.28, -0.22], [-0.28, 0.22], [0, 0.26], [0.28, 0.22]], []);
  const rot = useMemo(() => new THREE.Quaternion().setFromAxisAngle(V(1, 0, 0), Math.PI / 2), []);
  useFrame(() => {
    const { model, pos } = frameState(snap); let i = 0, j = 0;
    for (const nd of model.nodes) {
      const p = pos.get(nd.id)!;
      for (const z of [HALF_W, -HALF_W]) for (const side of [1, -1]) {
        plates.current.setMatrixAt(i++, M4.compose(va.set(p.x, p.y, z + side * 0.2), new THREE.Quaternion(), vb.set(1.05, 0.95, 0.05)));
        for (const [bx, by] of boltOff) bolts.current.setMatrixAt(j++, M4.compose(va.set(p.x + bx, p.y + by, z + side * 0.24), rot, vb.set(0.05, 0.05, 0.05)));
      }
    }
    plates.current.count = i; bolts.current.count = j;
    plates.current.instanceMatrix.needsUpdate = bolts.current.instanceMatrix.needsUpdate = true;
    plates.current.computeBoundingSphere(); bolts.current.computeBoundingSphere();
  });
  return (
    <>
      <instancedMesh key={`p${n}`} ref={plates} args={[undefined, undefined, n * 4]} castShadow>
        <boxGeometry /><meshStandardMaterial color="#56616c" roughness={0.45} metalness={0.7} />
      </instancedMesh>
      <instancedMesh key={`b${n}`} ref={bolts} args={[undefined, undefined, n * 24]}>
        <cylinderGeometry args={[1, 1, 1.4, 6]} /><meshStandardMaterial color="#9aa5ae" roughness={0.3} metalness={0.9} />
      </instancedMesh>
    </>
  );
}

/** deck, floor beams, lane marks, railings, top bracing: visual only */
function DeckAndBracing({ snap }: { snap?: Snap | null }) {
  const slab = useRef<THREE.InstancedMesh>(null!), beams = useRef<THREE.InstancedMesh>(null!), marks = useRef<THREE.InstancedMesh>(null!);
  const rails = useRef<THREE.InstancedMesh>(null!), posts = useRef<THREE.InstancedMesh>(null!), brace = useRef<THREE.InstancedMesh>(null!);
  const live = useStore((s) => s.model.nodes.length), n = snap?.model.nodes.length ?? live;
  const qy = useMemo(() => new THREE.Quaternion(), []), ez = V(0, 0, 1), qz = new THREE.Quaternion();
  useFrame(() => {
    const { model, pos } = frameState(snap);
    const d = deckNodes(model.nodes).map((nd) => pos.get(nd.id)!);
    let a = 0, b = 0, c = 0, r = 0, p = 0, k = 0;
    for (let i = 0; i < d.length - 1; i++) {
      const p0 = d[i], p1 = d[i + 1], len = Math.hypot(p1.x - p0.x, p1.y - p0.y), ang = Math.atan2(p1.y - p0.y, p1.x - p0.x);
      qz.setFromAxisAngle(ez, ang);
      const mx = (p0.x + p1.x) / 2, my = (p0.y + p1.y) / 2;
      slab.current.setMatrixAt(a++, M4.compose(va.set(mx, my + DECK_Y, 0), qz, vb.set(len + 0.02, 0.26, HALF_W * 2 - 0.5)));
      for (let m = 0; m < 3; m++) { const f = (m + 0.5) / 3; marks.current.setMatrixAt(c++, M4.compose(va.set(p0.x + (p1.x - p0.x) * f, p0.y + (p1.y - p0.y) * f + DECK_Y + 0.135, 0), qz, vb.set(len / 6, 0.01, 0.14))); }
      for (const z of [HALF_W - 0.55, -(HALF_W - 0.55)]) {
        rails.current.setMatrixAt(r++, M4.compose(va.set(mx, my + DECK_Y + 1.15, z), qz, vb.set(len, 0.08, 0.08)));
        rails.current.setMatrixAt(r++, M4.compose(va.set(mx, my + DECK_Y + 0.65, z), qz, vb.set(len, 0.05, 0.05)));
        for (let m = 0; m < 3; m++) { const f = m / 3; posts.current.setMatrixAt(p++, M4.compose(va.set(p0.x + (p1.x - p0.x) * f, p0.y + (p1.y - p0.y) * f + DECK_Y + 0.6, z), qy, vb.set(0.07, 1.1, 0.07))); }
      }
    }
    for (const q of d) beams.current.setMatrixAt(b++, M4.compose(va.set(q.x, q.y + 0.05, 0), qy, vb.set(0.34, 0.55, HALF_W * 2)));
    // top lateral bracing: struts between the planes at every top joint, an X in every top panel
    const tops = model.nodes.filter((nd) => nd.id.startsWith('T')).sort((x, y) => x.x - y.x).map((nd) => pos.get(nd.id)!);
    for (const t of tops) brace.current.setMatrixAt(k++, segMatrix(va.set(t.x, t.y, HALF_W), vb.set(t.x, t.y, -HALF_W), 0.07, M4));
    for (let i = 0; i < tops.length - 1; i++) {
      brace.current.setMatrixAt(k++, segMatrix(va.set(tops[i].x, tops[i].y, HALF_W), vb.set(tops[i + 1].x, tops[i + 1].y, -HALF_W), 0.045, M4));
      brace.current.setMatrixAt(k++, segMatrix(va.set(tops[i].x, tops[i].y, -HALF_W), vb.set(tops[i + 1].x, tops[i + 1].y, HALF_W), 0.045, M4));
    }
    for (const [mesh, cnt] of [[slab, a], [beams, b], [marks, c], [rails, r], [posts, p], [brace, k]] as const) {
      mesh.current.count = cnt; mesh.current.instanceMatrix.needsUpdate = true; mesh.current.computeBoundingSphere();
    }
  });
  const night = useStore((s) => s.night);
  return (
    <group>
      <instancedMesh key={`s${n}`} ref={slab} args={[undefined, undefined, n]} castShadow receiveShadow><boxGeometry /><meshStandardMaterial color="#3a3d42" roughness={0.82} /></instancedMesh>
      <instancedMesh key={`m${n}`} ref={marks} args={[undefined, undefined, n * 3]}><boxGeometry /><meshStandardMaterial color="#e9e2c8" roughness={0.6} emissive={night ? '#6b664f' : '#000'} /></instancedMesh>
      <instancedMesh key={`f${n}`} ref={beams} args={[undefined, undefined, n]} castShadow><boxGeometry /><meshStandardMaterial color="#4f5963" roughness={0.5} metalness={0.6} /></instancedMesh>
      <instancedMesh key={`r${n}`} ref={rails} args={[undefined, undefined, n * 4]}><boxGeometry /><meshStandardMaterial color="#aeb7bf" roughness={0.35} metalness={0.8} /></instancedMesh>
      <instancedMesh key={`p${n}`} ref={posts} args={[undefined, undefined, n * 6]}><boxGeometry /><meshStandardMaterial color="#8f99a2" roughness={0.4} metalness={0.8} /></instancedMesh>
      <instancedMesh key={`x${n}`} ref={brace} args={[undefined, undefined, n * 3]} castShadow><cylinderGeometry args={[1, 1, 1, 8]} /><meshStandardMaterial color="#5f6b77" roughness={0.4} metalness={0.75} /></instancedMesh>
    </group>
  );
}

function Bearings({ model }: { model: TrussModel }) {
  const span = Math.max(...model.nodes.map((n) => n.x));
  return (
    <group>
      {model.nodes.filter((n) => n.support).map((n) => (
        <group key={n.id} position={[n.x - span / 2, -0.5, 0]}>
          {[HALF_W, -HALF_W].map((z) => (
            <group key={z} position={[0, 0, z]}>
              <mesh position={[0, -0.12, 0]} castShadow><boxGeometry args={[1.3, 0.24, 1.1]} /><meshStandardMaterial color="#7a858f" metalness={0.7} roughness={0.4} /></mesh>
              {n.support === 'pin'
                ? <mesh position={[0, 0.16, 0]} rotation-x={Math.PI / 2}><cylinderGeometry args={[0.22, 0.22, 0.9, 16]} /><meshStandardMaterial color="#c9d3db" metalness={0.9} roughness={0.25} /></mesh>
                : [-0.36, 0, 0.36].map((dx) => <mesh key={dx} position={[dx, 0.08, 0]} rotation-x={Math.PI / 2}><cylinderGeometry args={[0.13, 0.13, 0.9, 14]} /><meshStandardMaterial color="#c9d3db" metalness={0.9} roughness={0.25} /></mesh>)}
            </group>
          ))}
        </group>
      ))}
    </group>
  );
}

/** a small articulated truck sitting on the deck at the vehicle position (the analysed vehicle is 2 × P: P per plane) */
export function Truck({ x, y, tint = '#d8dde2' }: { x: number; y: number; tint?: string }) {
  return (
    <group position={[x, y, 0]}>
      <mesh position={[2.9, 1.25, 0]} castShadow><boxGeometry args={[2.2, 2.1, 2.5]} /><meshStandardMaterial color="#e2a13a" roughness={0.45} metalness={0.3} /></mesh>
      <mesh position={[3.55, 1.6, 0]}><boxGeometry args={[0.9, 0.9, 2.3]} /><meshStandardMaterial color="#1b2733" roughness={0.1} metalness={0.6} /></mesh>
      <mesh position={[-1.4, 1.65, 0]} castShadow><boxGeometry args={[6.6, 2.8, 2.55]} /><meshStandardMaterial color={tint} roughness={0.55} /></mesh>
      {[-3.6, -2.4, 0.4, 3.1].flatMap((wx) => [1.1, -1.1].map((wz) => (
        <mesh key={`${wx}${wz}`} position={[wx, 0.48, wz]} rotation-x={Math.PI / 2}><cylinderGeometry args={[0.48, 0.48, 0.42, 14]} /><meshStandardMaterial color="#15181b" roughness={0.9} /></mesh>
      )))}
    </group>
  );
}

function Vehicle({ snap }: { snap?: Snap | null }) {
  const ref = useRef<THREE.Group>(null!);
  const liveOn = useStore((s) => s.design.loads.vehicle.on), on = snap ? snap.design.loads.vehicle.on : liveOn, mode = useStore((s) => s.mode);
  useFrame(() => {
    if (!ref.current) return;
    const { model, pos, vx } = frameState(snap);
    const d = deckNodes(model.nodes), span = d[d.length - 1].x, X = vx.x - span / 2;
    const pts = d.map((nd) => pos.get(nd.id)!);
    let y = 0;
    for (let i = 0; i < pts.length - 1; i++) if (X >= pts[i].x && X <= pts[i + 1].x) { const f = (X - pts[i].x) / (pts[i + 1].x - pts[i].x); y = pts[i].y + (pts[i + 1].y - pts[i].y) * f; }
    ref.current.position.set(X, y + DECK_Y + 0.13, 1.7);
  });
  if (!on || mode === 'arcade') return null;
  return <group ref={ref}><Truck x={0} y={0} /></group>;
}

function Arrow({ dir, len, color, r = 0.12 }: { dir: 1 | -1; len: number; color: string; r?: number }) {
  // points along +y*dir; the tip sits at the origin
  return (
    <group rotation-z={dir === 1 ? 0 : Math.PI}>
      <mesh position={[0, -len / 2 - 0.35, 0]}><cylinderGeometry args={[r, r, Math.max(0.01, len - 0.7), 10]} /><meshBasicMaterial color={color} toneMapped={false} /></mesh>
      <mesh position={[0, -0.35, 0]}><coneGeometry args={[r * 3.2, 0.7, 14]} /><meshBasicMaterial color={color} toneMapped={false} /></mesh>
    </group>
  );
}

/** applied loads (deck + vehicle + point loads, self-weight not drawn) and support reactions, on the front plane */
function Forces() {
  const model = useStore((s) => s.model), showR = useStore((s) => s.showReactions), labels = useStore((s) => s.showLabels), showLoads = useStore((s) => s.showLoads);
  const { ok } = useDrawn();
  const { loads, labelled } = useMemo(() => {
    const acc = new Map<string, number>(), lab = new Map<string, number>();
    for (const l of model.loads) {
      if (l.tag === 'self-weight') continue;
      acc.set(l.node, (acc.get(l.node) ?? 0) + l.fy);
      if (l.tag !== 'deck') lab.set(l.node, (lab.get(l.node) ?? 0) + l.fy);
    }
    return { loads: [...acc].filter(([, f]) => Math.abs(f) > 1), labelled: lab };
  }, [model]);
  const deckQ = useStore((s) => s.design.loads.deckUDL * s.design.loads.scale);
  const maxF = Math.max(1, ...loads.map(([, f]) => Math.abs(f)));
  const groups = useRef<(THREE.Group | null)[]>([]);
  useFrame(() => {
    const { pos } = frameState();
    loads.forEach(([id], i) => { const g = groups.current[i], p = pos.get(id); if (g && p) g.position.set(p.x, p.y + DECK_Y + 0.3, HALF_W + 0.9); });
  });
  const span = Math.max(...model.nodes.map((n) => n.x));
  return (
    <group>
      {showLoads ? loads.map(([id, f], i) => {
        const len = 1.4 + 4.2 * Math.abs(f) / maxF;
        return (
          <group key={id} ref={(g) => { groups.current[i] = g; }}>
            <group position={[0, len + 0.05, 0]}><Arrow dir={-1} len={len} color="#F5A64D" r={0.07} /></group>
            {labels && labelled.has(id) ? <Html zIndexRange={[4, 0]} position={[0, len + 0.8, 0]} center className="tag tag-load">{labelled.get(id)! < 0 ? '▼ ' : ''}{fmt.kN(-labelled.get(id)!, 0)}</Html> : null}
          </group>
        );
      }) : null}
      {showLoads && labels && deckQ > 0 && loads.length ? <Html zIndexRange={[4, 0]} position={[-span / 2 + span * 0.18, 7.2, HALF_W + 0.9]} center className="tag tag-load">deck {(deckQ / 1e3).toFixed(0)} kN/m → joints</Html> : null}
      {showR && ok ? ok.reactions.map((r) => {
        const n = model.nodes.find((x) => x.id === r.nodeId)!, len = 2 + 3 * Math.abs(r.ry_N) / Math.max(...ok.reactions.map((q) => Math.abs(q.ry_N)), 1);
        return (
          <group key={r.nodeId} position={[n.x - span / 2, -0.75, HALF_W + 2.6]}>
            <Arrow dir={1} len={len} color="#58D6AF" r={0.11} />
            <group position={[0, -len, 0]} />
            {labels ? <Html zIndexRange={[4, 0]} position={[0, -len - 0.9, 0]} center className="tag tag-react">R<sub>{r.nodeId}</sub> {fmt.kN(r.ry_N, 0)}{Math.abs(r.rx_N) > 1 ? ` · H ${fmt.kN(r.rx_N, 0)}` : ''}</Html> : null}
          </group>
        );
      }) : null}
    </group>
  );
}

function Dimensions() {
  const model = useStore((s) => s.model), d = useStore((s) => s.design.params), lens = useStore((s) => s.lens), labels = useStore((s) => s.showLabels);
  if (lens !== 'real' || !labels) return null;
  const span = Math.max(...model.nodes.map((n) => n.x)), y = -3.2, z = HALF_W + 1.6;
  const t1 = model.nodes.find((n) => n.id.startsWith('T'))!;
  const hx = t1.x - span / 2 - 1.2;
  return (
    <group>
      <Line points={[[-span / 2, y, z], [span / 2, y, z]]} color="#63E5FA" lineWidth={1.2} />
      {[-span / 2, span / 2].map((x) => <Line key={x} points={[[x, y - 0.5, z], [x, y + 0.9, z]]} color="#63E5FA" lineWidth={1.2} />)}
      <Html zIndexRange={[4, 0]} position={[0, y - 0.9, z]} center className="tag tag-dim">SPAN {fmt.m(span)} · {d.panels} panels</Html>
      <Line points={[[hx, 0, z], [hx, t1.y, z]]} color="#63E5FA" lineWidth={1.2} dashed dashSize={0.3} gapSize={0.2} />
      <Html zIndexRange={[4, 0]} position={[hx - 1.6, t1.y / 2, z]} center className="tag tag-dim">h {fmt.m(t1.y)}</Html>
    </group>
  );
}

function Ghost() {
  const show = useStore((s) => s.showGhost), lens = useStore((s) => s.lens), model = useStore((s) => s.model);
  const { ok } = useDrawn();
  if (!show || !ok || lens !== 'deform') return null;
  const { pos } = nodeWorld(model, null, 0, 0);
  return (
    <group>
      {model.members.map((m) => { const a = pos.get(m.a)!, b = pos.get(m.b)!;
        return <Line key={m.id} points={[[a.x, a.y, HALF_W + 0.02], [b.x, b.y, HALF_W + 0.02]]} color="#E8F3F7" lineWidth={1} transparent opacity={0.55} dashed dashSize={0.4} gapSize={0.25} />; })}
    </group>
  );
}

/** draggable top-chord joints (front plane). Snap 0.25 m; ghost of the pre-drag shape; label with live coordinates. */
function Handles() {
  const model = useStore((s) => s.model), mode = useStore((s) => s.mode), dragging = useStore((s) => s.dragging), reel = useStore((s) => s.reel);
  const addMode = useStore((s) => s.addMode), lens = useStore((s) => s.lens), handles = useStore((s) => s.handles);
  const [hover, setHover] = useState<string | null>(null);
  const before = useRef<TrussModel | null>(null);
  if (!handles || mode !== 'lab' || (lens !== 'real' && !addMode)) return null;
  const span = Math.max(...model.nodes.map((n) => n.x));
  const st = useStore.getState;
  const onMove = (e: ThreeEvent<PointerEvent>) => {
    const id = st().dragging; if (!id) return;
    e.stopPropagation();
    const p = st().design.params, base = model.nodes.find((n) => n.id === id)!;
    const baseX = base.x - (p.offsets[id]?.dx ?? 0), w = p.span / p.panels;
    const dx = Math.max(-0.45 * w, Math.min(0.45 * w, snap(e.point.x + span / 2 - baseX)));
    const dy = Math.max(2 - p.height, Math.min(15 - p.height, snap(e.point.y - p.height)));
    const cur = p.offsets[id] ?? { dx: 0, dy: 0 };
    if (cur.dx !== dx || cur.dy !== dy) st().edit((d) => ({ ...d, params: { ...d.params, offsets: { ...d.params.offsets, [id]: { dx, dy } } } }), 'drag', { id, dx, dy }, false);
  };
  const end = () => { if (st().dragging) { st().logIt('drag-end', { id: st().dragging }); st().set({ dragging: null }); before.current = null; } };
  const ghost = before.current ? nodeWorld(before.current, null, 0, 0).pos : null;
  return (
    <group>
      {dragging ? (
        <mesh position={[0, 6, HALF_W]} onPointerMove={onMove} onPointerUp={end} onPointerLeave={end}>
          <planeGeometry args={[400, 200]} /><meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      ) : null}
      {ghost && before.current ? before.current.members.map((m) => { const a = ghost.get(m.a)!, b = ghost.get(m.b)!;
        return <Line key={m.id} points={[[a.x, a.y, HALF_W + 0.05], [b.x, b.y, HALF_W + 0.05]]} color="#63E5FA" lineWidth={1} transparent opacity={0.45} dashed dashSize={0.3} gapSize={0.2} />; }) : null}
      {model.nodes.filter((n) => (addMode ? true : isDraggable(n.id))).map((n) => {
        const on = hover === n.id || dragging === n.id, picked = addMode?.includes(n.id);
        return (
          <group key={n.id} position={[n.x - span / 2, n.y, HALF_W + 0.35]}>
            <mesh scale={on || picked ? 1.45 : 1}
              onPointerOver={reel ? undefined : (e) => { e.stopPropagation(); setHover(n.id); document.body.style.cursor = addMode ? 'crosshair' : 'grab'; }}
              onPointerOut={reel ? undefined : () => { setHover(null); document.body.style.cursor = ''; }}
              onPointerDown={reel ? undefined : (e) => {
                e.stopPropagation();
                const s = st();
                if (s.addMode) {
                  const sel = [...s.addMode, n.id];
                  if (sel.length === 2 && sel[0] !== sel[1]) {
                    const id = `X${s.design.params.added.length + 1}`;
                    s.edit((d) => ({ ...d, params: { ...d.params, added: [...d.params.added, { id, a: sel[0], b: sel[1] }] } }), 'add-member', { id, a: sel[0], b: sel[1] });
                    s.set({ addMode: null });
                  } else s.set({ addMode: sel.slice(0, 1) });
                  return;
                }
                if (!isDraggable(n.id)) return;
                before.current = s.model;
                s.edit((d) => d, 'drag-start', { id: n.id });   // one undo step per drag
                s.set({ dragging: n.id, selected: null });
              }}>
              <sphereGeometry args={[0.42, 20, 14]} />
              <meshBasicMaterial color={picked ? '#F5A64D' : on ? '#ffffff' : '#63E5FA'} toneMapped={false} transparent opacity={0.92} />
            </mesh>
            {on || picked ? <Html zIndexRange={[4, 0]} position={[0, 1.2, 0]} center className="tag tag-node">{n.id} · x {fmt.m(n.x, 2)} · y {fmt.m(n.y, 2)}</Html> : null}
          </group>
        );
      })}
    </group>
  );
}

function SelectedLabel() {
  const sel = useStore((s) => s.selected), model = useStore((s) => s.model);
  const { ok, stale, lastOk } = useDrawn();
  const m = model.members.find((x) => x.id === sel);
  if (!m) return null;
  const span = Math.max(...model.nodes.map((n) => n.x));
  const a = model.nodes.find((n) => n.id === m.a)!, b = model.nodes.find((n) => n.id === m.b)!;
  const r = (ok ?? (stale ? lastOk : null))?.members.find((x) => x.id === m.id);
  return (
    <Html zIndexRange={[4, 0]} position={[(a.x + b.x) / 2 - span / 2, (a.y + b.y) / 2 + 1.4, HALF_W + 0.6]} center className={`tag tag-sel ${stale ? 'stale' : ''}`}>
      <b>{m.id}</b> {m.a}–{m.b} · L {fmt.m(Math.hypot(b.x - a.x, b.y - a.y))}
      {r ? <><br />N {fmt.kN(r.axial_N, 0)} {r.axial_N >= 0 ? 'tension' : 'compression'} · σ {fmt.MPa(r.stress_Pa, 0)}</> : <><br />not analysed yet</>}
    </Html>
  );
}

/** value tags on chosen members (store.tags) and ID labels on every member and joint (store.showIds), front plane */
function MemberTags() {
  const tags = useStore((s) => s.tags), ids = useStore((s) => s.showIds), model = useStore((s) => s.model);
  const { ok } = useDrawn();
  const refs = useRef<(THREE.Group | null)[]>([]);
  const list = ids ? model.members.map((m) => m.id) : tags;
  useFrame(() => {
    const { pos } = frameState();
    list.forEach((id, i) => { const m = model.members.find((x) => x.id === id), g = refs.current[i]; if (!m || !g) return;
      const a = pos.get(m.a)!, b = pos.get(m.b)!; g.position.set((a.x + b.x) / 2, (a.y + b.y) / 2, HALF_W + 0.5); });
  });
  if (!list.length) return null;
  const span = Math.max(...model.nodes.map((n) => n.x));
  return (
    <group>
      {list.map((id, i) => {
        const r = ok?.members.find((x) => x.id === id);
        return <group key={id} ref={(g) => { refs.current[i] = g; }}>
          <Html zIndexRange={[4, 0]} center className={`tag ${ids ? 'tag-id' : r ? (r.axial_N >= 0 ? 'tag-ten' : 'tag-comp') : ''}`}>{ids || !r ? id : `${id} ${r.axial_N >= 0 ? '+' : '−'}${Math.abs(r.axial_N / 1e3).toFixed(0)} kN`}</Html>
        </group>;
      })}
      {ids ? model.nodes.map((n) => <Html zIndexRange={[4, 0]} key={n.id} position={[n.x - span / 2, n.y + (n.deck ? -1.1 : 1.0), HALF_W + 0.5]} center className="tag tag-node">{n.id}</Html>) : null}
    </group>
  );
}

export function TrussBridge() {
  const model = useStore((s) => s.model), mode = useStore((s) => s.mode), arcade = useStore((s) => s.arcade);
  const hidden = mode === 'arcade' && arcade.armed;
  return (
    <group visible={!hidden}>
      <Members />
      <Joints />
      <DeckAndBracing />
      <Bearings model={model} />
      <Vehicle />
      {!hidden ? <><Forces /><Dimensions /><Ghost /><Handles /><SelectedLabel /><MemberTags /></> : null}
    </group>
  );
}

/** a saved snapshot drawn with the same meshes (A/B comparison) */
export function SnapshotBridge({ snap }: { snap: Snap }) {
  return (
    <group>
      <Members snap={snap} />
      <Joints snap={snap} />
      <DeckAndBracing snap={snap} />
      <Bearings model={snap.model} />
      <Vehicle snap={snap} />
    </group>
  );
}
