// ARCADE FAILURE LAB: STYLIZED FAILURE — NOT AN ENGINEERING PREDICTION.
// An artistic break: the chosen break panel lets go first, neighbours follow on a timer. Nothing here reads solver
// results or capacities. Pieces (each truss bar of both planes + each deck panel) become Rapier rigid bodies that fall
// under gravity and collide with the gorge. The whole 7 s is precomputed at 60 Hz when the mode is triggered, so
// playback is a lookup by time (the reel seeks it frame-exactly). Dust and sparks are GPU-style particles computed
// from seeded bursts; they are not simulated parts. Reset frees the Rapier world and every body.
import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import { useStore } from '../store';
import { HALF_W, nodeWorld } from './viz';
import { chs } from '../engineering/educationalChecks';
import { deckNodes } from '../engineering/loadDistribution';
import { heightAt, RIVER_Y } from './terrain';
import { mulberry32 } from './noise';
import { vclock } from './clock';
import type { TrussModel } from '../engineering/types';

export const ARCADE_SECONDS = 7, HZ = 60;
export const arcadeClock: { t: number | null } = { t: null };    // reel override (seconds since trigger)
export interface Piece { kind: 'bar' | 'deck'; size: [number, number, number]; release: number; fixed: boolean }
export interface ArcadeSim { pieces: Piece[]; frames: Float32Array; bursts: { t: number; p: [number, number, number]; kind: 'break' | 'impact' | 'splash' }[]; bodies: number }

/** the reel injects its precomputed run here so a seek never waits on Rapier */
export const reelArcade: { sim: ArcadeSim | null; breakPanel: number } = { sim: null, breakPanel: 4 };
let rapierReady: Promise<void> | null = null;
const initRapier = () => (rapierReady ??= RAPIER.init());

export async function simulateArcade(model: TrussModel, breakPanel: number, seed = 7): Promise<ArcadeSim> {
  await initRapier();
  const world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
  world.timestep = 1 / HZ;
  // ground: a trimesh of the gorge around the bridge, plus the abutment blocks
  const gx: number[] = [], gi: number[] = [], step = 2, X = 90, Z = 40, nx = (2 * X) / step + 1, nz = (2 * Z) / step + 1;
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const x = -X + i * step, z = -Z + j * step; gx.push(x, heightAt(x, z), z); }
  for (let j = 0; j < nz - 1; j++) for (let i = 0; i < nx - 1; i++) { const a = j * nx + i; gi.push(a, a + nx, a + 1, a + 1, a + nx, a + nx + 1); }
  world.createCollider(RAPIER.ColliderDesc.trimesh(new Float32Array(gx), new Uint32Array(gi)).setFriction(0.9));
  const { pos, span } = nodeWorld(model, null, 0, 0);
  for (const s of [-1, 1]) world.createCollider(RAPIER.ColliderDesc.cuboid(3.4, 2.65, 6.2).setTranslation(s * (span / 2 + 2.2), -3.35, 0));

  const rnd = mulberry32(seed), nPanels = deckNodes(model.nodes).length - 1, panelW = span / nPanels;
  const panelOf = (x: number) => Math.floor((x + span / 2) / panelW);
  const pieces: Piece[] = [], bodies: RAPIER.RigidBody[] = [], bursts: ArcadeSim['bursts'] = [];
  const add = (p: THREE.Vector3, q: THREE.Quaternion, half: [number, number, number], kind: Piece['kind'], panel: number) => {
    const fixed = panel <= 0 || panel >= nPanels - 1;
    const release = fixed ? Infinity : 0.35 + 0.16 * Math.abs(panel - breakPanel) + rnd() * 0.08;
    const body = world.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(p.x, p.y, p.z).setRotation(q).setCcdEnabled(true));
    world.createCollider(RAPIER.ColliderDesc.cuboid(...half).setDensity(kind === 'deck' ? 2.4 : 7.8).setFriction(0.7).setRestitution(0.15), body);
    pieces.push({ kind, size: [half[0] * 2, half[1] * 2, half[2] * 2], release, fixed }); bodies.push(body);
  };
  const up = new THREE.Vector3(0, 1, 0);
  for (const m of model.members) {
    const a = pos.get(m.a)!, b = pos.get(m.b)!, dir = new THREE.Vector3(b.x - a.x, b.y - a.y, 0), len = dir.length();
    const q = new THREE.Quaternion().setFromUnitVectors(up, dir.normalize()), r = Math.max(0.075, chs(m.A).D / 2) * 1.2;
    for (const z of [HALF_W, -HALF_W]) add(new THREE.Vector3((a.x + b.x) / 2, (a.y + b.y) / 2, z), q, [r, len / 2 - 0.05, r], 'bar', panelOf((a.x + b.x) / 2));
  }
  const d = deckNodes(model.nodes).map((n) => pos.get(n.id)!);
  for (let i = 0; i < d.length - 1; i++) add(new THREE.Vector3((d[i].x + d[i + 1].x) / 2, 0.42, 0), new THREE.Quaternion(), [(d[i + 1].x - d[i].x) / 2 - 0.05, 0.13, HALF_W - 0.25], 'deck', i);

  const steps = ARCADE_SECONDS * HZ, frames = new Float32Array(steps * pieces.length * 7);
  const released = new Uint8Array(pieces.length), landed = new Uint8Array(pieces.length);
  for (let f = 0; f < steps; f++) {
    const t = f / HZ;
    pieces.forEach((pc, i) => {
      if (!released[i] && t >= pc.release) {
        released[i] = 1;
        const b = bodies[i]; b.setBodyType(RAPIER.RigidBodyType.Dynamic, true);
        const tr = b.translation();
        b.setLinvel({ x: (tr.x > 0 ? 1 : -1) * (0.3 + rnd() * 1.2), y: -1.5 - rnd() * 2.5, z: (rnd() - 0.5) * 1.6 }, true);
        b.setAngvel({ x: (rnd() - 0.5) * 1.6, y: (rnd() - 0.5) * 0.8, z: (rnd() - 0.5) * 2.2 }, true);
        if (pc.kind === 'deck' || rnd() < 0.25) bursts.push({ t, p: [tr.x, tr.y, tr.z], kind: 'break' });
      }
    });
    world.step();
    pieces.forEach((pc, i) => {
      const b = bodies[i], p = b.translation(), q = b.rotation(), o = (f * pieces.length + i) * 7;
      frames[o] = p.x; frames[o + 1] = p.y; frames[o + 2] = p.z; frames[o + 3] = q.x; frames[o + 4] = q.y; frames[o + 5] = q.z; frames[o + 6] = q.w;
      if (released[i] && !landed[i]) {
        if (p.y < RIVER_Y + 0.6) { landed[i] = 1; bursts.push({ t, p: [p.x, RIVER_Y + 0.3, p.z], kind: 'splash' }); }
        else if (p.y < heightAt(p.x, p.z) + 1.4 && t > pc.release + 0.4) { landed[i] = 1; bursts.push({ t, p: [p.x, p.y, p.z], kind: 'impact' }); }
      }
    });
  }
  const sim = { pieces, frames, bursts: bursts.slice(0, 90), bodies: pieces.length };
  world.free();
  return sim;
}

/** dust, splash and sparks: seeded particles per burst, positions are a pure function of (t − burst time) */
function Particles({ sim, tA }: { sim: ArcadeSim; tA: () => number }) {
  const N = 1600;
  const seeds = useMemo(() => {
    const r = mulberry32(99), per = Math.max(1, Math.floor(N / Math.max(1, sim.bursts.length)));
    return Array.from({ length: N }, (_, i) => {
      const bi = Math.min(sim.bursts.length - 1, Math.floor(i / per)), th = r() * Math.PI * 2, ph = r() * 0.9;
      return { bi, dir: [Math.cos(th) * Math.sin(ph + 0.4), Math.cos(ph), Math.sin(th) * Math.sin(ph + 0.4)], sp: 2 + r() * 7, life: 1.4 + r() * 2.6, j: r() * 0.15 };
    });
  }, [sim]);
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
    g.setAttribute('alpha', new THREE.BufferAttribute(new Float32Array(N), 1));
    g.setAttribute('tint', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
    g.setAttribute('size', new THREE.BufferAttribute(new Float32Array(N), 1));
    return g;
  }, []);
  const mat = useMemo(() => new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    vertexShader: `attribute float alpha; attribute float size; attribute vec3 tint; varying float vA; varying vec3 vT;
      void main(){ vA = alpha; vT = tint; vec4 mv = modelViewMatrix * vec4(position,1.); gl_PointSize = size * 300. / -mv.z; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `varying float vA; varying vec3 vT; void main(){ float d = length(gl_PointCoord - .5); if (d > .5) discard; gl_FragColor = vec4(vT, vA * smoothstep(.5, .1, d)); }`,
  }), []);
  useFrame(() => {
    const t = tA(), P = geo.attributes.position.array as Float32Array, A = geo.attributes.alpha.array as Float32Array;
    const T = geo.attributes.tint.array as Float32Array, S = geo.attributes.size.array as Float32Array;
    seeds.forEach((s, i) => {
      const b = sim.bursts[s.bi]; const age = b ? t - b.t - s.j : -1;
      if (!b || age < 0 || age > s.life) { A[i] = 0; return; }
      const spark = b.kind === 'break' && i % 4 === 0, splash = b.kind === 'splash', u = age / s.life;
      const sp = spark ? s.sp * 2.2 : s.sp * (splash ? 1.3 : 0.7), drag = 1 - Math.exp(-age * 1.6);
      P[i * 3] = b.p[0] + s.dir[0] * sp * drag / 1.6;
      P[i * 3 + 1] = b.p[1] + (spark || splash ? s.dir[1] * sp * age - 4.9 * age * age : s.dir[1] * sp * drag / 1.6 + age * 0.8);
      P[i * 3 + 2] = b.p[2] + s.dir[2] * sp * drag / 1.6;
      A[i] = spark ? (1 - u) * 0.95 : (1 - u) * (splash ? 0.75 : 0.45);
      const c = spark ? [1, 0.62, 0.25] : splash ? [0.85, 0.92, 0.95] : [0.72, 0.64, 0.55];
      T[i * 3] = c[0]; T[i * 3 + 1] = c[1]; T[i * 3 + 2] = c[2];
      S[i] = spark ? 0.12 : (splash ? 0.6 : 1.1) * (0.6 + u * 1.8);
    });
    for (const k of ['position', 'alpha', 'tint', 'size']) geo.attributes[k].needsUpdate = true;
  });
  return <points geometry={geo} material={mat} frustumCulled={false} />;
}

export function ArcadeFailure() {
  const arcade = useStore((s) => s.arcade), mode = useStore((s) => s.mode), model = useStore((s) => s.model);
  const [own, setSim] = useState<ArcadeSim | null>(null);
  const reel = useStore((s) => s.reel), sim = reel ? (mode === 'arcade' && arcade.armed ? reelArcade.sim : null) : own;
  const bars = useRef<THREE.InstancedMesh>(null!), decks = useRef<THREE.InstancedMesh>(null!);
  useEffect(() => {
    let live = true;
    if (reel) return;
    if (mode === 'arcade' && arcade.armed) simulateArcade(model, useStore.getState().breakPanel).then((s) => { if (live) { setSim(s); useStore.getState().set({ arcadeInfo: { bodies: s.bodies, particles: 1600 } }); } });
    else setSim(null);
    return () => { live = false; };
  }, [arcade.nonce, arcade.armed, mode, reel]);
  const tA = () => (arcadeClock.t != null ? arcadeClock.t : Math.max(0, vclock.t - useStore.getState().arcade.t0));
  const M = useMemo(() => new THREE.Matrix4(), []), p = useMemo(() => new THREE.Vector3(), []), q = useMemo(() => new THREE.Quaternion(), []), sc = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ camera }) => {
    if (!sim || !bars.current) return;
    const breakPanel = reel ? reelArcade.breakPanel : useStore.getState().breakPanel;
    const f = Math.min(ARCADE_SECONDS * HZ - 1, Math.max(0, Math.floor(tA() * HZ))), n = sim.pieces.length;
    let ib = 0, id = 0, follow: THREE.Vector3 | null = null;
    sim.pieces.forEach((pc, i) => {
      const o = (f * n + i) * 7;
      p.set(sim.frames[o], sim.frames[o + 1], sim.frames[o + 2]); q.set(sim.frames[o + 3], sim.frames[o + 4], sim.frames[o + 5], sim.frames[o + 6]);
      const shake = tA() < pc.release && tA() > pc.release - 0.6 ? Math.sin(tA() * 90 + i) * 0.03 : 0;
      p.y += shake;
      if (pc.kind === 'bar') { sc.set(pc.size[0] / 2, pc.size[1] + 0.1, pc.size[2] / 2); bars.current.setMatrixAt(ib++, M.compose(p, q, sc)); }
      else { sc.set(...pc.size); decks.current.setMatrixAt(id, M.compose(p, q, sc)); if (id === breakPanel) follow = p.clone(); id++; }
    });
    bars.current.count = ib; decks.current.count = id;
    bars.current.instanceMatrix.needsUpdate = decks.current.instanceMatrix.needsUpdate = true;
    bars.current.computeBoundingSphere(); decks.current.computeBoundingSphere();
    if (useStore.getState().follow && follow && !useStore.getState().reel) {
      const fp = follow as THREE.Vector3;
      camera.position.lerp(new THREE.Vector3(fp.x - 14, Math.max(fp.y + 5, RIVER_Y + 6), fp.z + 16), 0.12); camera.lookAt(fp);
    }
  });
  if (!sim) return null;
  const nb = sim.pieces.filter((x) => x.kind === 'bar').length, nd = sim.pieces.length - nb;
  return (
    <group>
      <instancedMesh ref={bars} args={[undefined, undefined, nb]} castShadow>
        <cylinderGeometry args={[1, 1, 1, 10]} /><meshStandardMaterial color="#6d7b89" roughness={0.4} metalness={0.75} />
      </instancedMesh>
      <instancedMesh ref={decks} args={[undefined, undefined, nd]} castShadow>
        <boxGeometry /><meshStandardMaterial color="#3a3d42" roughness={0.85} />
      </instancedMesh>
      <Particles sim={sim} tA={tA} />
    </group>
  );
}
