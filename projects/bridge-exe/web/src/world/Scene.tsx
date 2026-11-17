// The 3D canvas: lights, a locally generated reflection environment (no network), the active environment, the
// bridge, the arcade rig, the A/B split renderer and restrained post (bloom only on emissive UI-like accents).
import { Suspense, useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import { Bloom, EffectComposer, N8AO, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { useStore } from '../store';
import { Sky, SUN_DIR } from './Sky';
import { Abutments, Gorge } from './Gorge';
import { SnapshotBridge, TrussBridge } from './TrussBridge';
import { CameraDirector } from './CameraDirector';
import { City, BeamBridge, CableStayed } from './City';
import { ArcadeFailure } from './ArcadeFailure';
import { vclock } from './clock';
import { viz, HALF_W } from './viz';
import { reelProbe } from '../reel/ReelMode';

function Lights() {
  const night = useStore((s) => s.night), q = useStore((s) => s.quality);
  const sun = useRef<THREE.DirectionalLight>(null!);
  useEffect(() => { sun.current.target.position.set(0, 0, 0); sun.current.target.updateMatrixWorld(); }, []);
  const d = night ? new THREE.Vector3(0.4, 0.45, -0.8).normalize() : SUN_DIR;
  return (
    <>
      <directionalLight ref={sun} position={d.clone().multiplyScalar(160).toArray()} intensity={night ? 0.55 : 3.6} color={night ? '#9fb8de' : '#ffd8a8'}
        castShadow={q !== 'low'} shadow-mapSize={[q === 'high' ? 4096 : 2048, q === 'high' ? 4096 : 2048]} shadow-bias={-0.0004} shadow-normalBias={0.04}
        shadow-camera-left={-70} shadow-camera-right={70} shadow-camera-top={60} shadow-camera-bottom={-60} shadow-camera-near={10} shadow-camera-far={420} />
      <hemisphereLight args={[night ? '#28406a' : '#a9c6e8', night ? '#0b1220' : '#5a4a3a', night ? 0.35 : 0.75]} />
      {night ? <pointLight position={[0, 9, 0]} intensity={60} distance={60} color="#ffcf8a" /> : null}
    </>
  );
}

/** advance the visual clock in the app (the reel sets it through seek) and ease the deformation blend */
function Clock() {
  useFrame((_, dt) => {
    const s = useStore.getState();
    if (s.reel) return;
    vclock.t += s.reducedMotion ? 0 : dt;
    const fresh = s.env === 'city' ? !!s.beamResult && s.beamResult.status === 'solved' && !s.beamDirty
      : !!s.result && s.result.inputsHash === s.modelHash && s.result.status === 'solved';
    const target = fresh && s.lens !== 'real' && (s.env === 'city' || s.lens === 'deform' || s.lens === 'path') ? 1 : 0;
    viz.k += (target - viz.k) * (s.reducedMotion ? 1 : Math.min(1, dt * 4));
    if (viz.pulse >= 0) { viz.pulse += dt * 1.4; if (viz.pulse > 1.2) viz.pulse = -1; }
  });
  return null;
}

/** test hook: screen positions of the joints (tests/e2e.ts drags them with the real mouse) */
function TestProbe() {
  const { camera, size } = useThree(), v = new THREE.Vector3();
  useFrame(() => {
    const bx = (window as any).__bx; if (!bx) return;
    const s = useStore.getState(), span = Math.max(...s.model.nodes.map((x) => x.x));
    for (const n of s.model.nodes) { v.set(n.x - span / 2, n.y, HALF_W + 0.35).project(camera); bx.probe[n.id] = [(v.x * 0.5 + 0.5) * size.width, (-v.y * 0.5 + 0.5) * size.height]; }
  });
  return null;
}

/** A/B: the same camera renders snapshot A and snapshot B into the two halves (top/bottom when the view is portrait) */
function CompareRenderer() {
  const { gl, scene, camera, size } = useThree();
  const a = useRef<THREE.Group>(null!), b = useRef<THREE.Group>(null!), live = useRef<THREE.Object3D | null>(null);
  const snapA = useStore((s) => s.snapA), snapB = useStore((s) => s.snapB);
  useFrame(() => {
    const cam = camera as THREE.PerspectiveCamera, portrait = size.height > size.width;
    live.current = live.current ?? scene.getObjectByName('live-bridge') ?? null;
    if (live.current) live.current.visible = false;
    const w = portrait ? size.width : size.width / 2, h = portrait ? size.height / 2 : size.height;
    const aspect0 = cam.aspect; cam.aspect = w / h; cam.updateProjectionMatrix();
    gl.autoClear = false; gl.setScissorTest(true); gl.clear();
    for (const [g, other, i] of [[a, b, 0], [b, a, 1]] as const) {
      g.current.visible = true; other.current.visible = false;
      const x = portrait ? 0 : i * w, y = portrait ? (1 - i) * h : 0;
      gl.setViewport(x, y, w, h); gl.setScissor(x, y, w, h); gl.render(scene, cam);
    }
    gl.setScissorTest(false); gl.autoClear = true; gl.setViewport(0, 0, size.width, size.height);
    cam.aspect = aspect0; cam.updateProjectionMatrix();
    a.current.visible = b.current.visible = true;
    if (live.current) live.current.visible = true;
  }, 1);
  if (!snapA || !snapB) return null;
  return (
    <>
      <group ref={a}><SnapshotBridge snap={snapA} /></group>
      <group ref={b}><SnapshotBridge snap={snapB} /></group>
    </>
  );
}

/** reel: project the dragged joint to screen pixels for the cursor overlay */
function ReelProbe() {
  const { camera, size } = useThree(), v = new THREE.Vector3();
  useFrame(() => {
    const s = useStore.getState(), n = s.model.nodes.find((x) => x.id === 'T4'); if (!n) return;
    const span = Math.max(...s.model.nodes.map((x) => x.x));
    v.set(n.x - span / 2, n.y, HALF_W + 0.35).project(camera);
    reelProbe.T4 = [(v.x * 0.5 + 0.5) * size.width, (-v.y * 0.5 + 0.5) * size.height];
  }, 2);
  return null;
}

function World() {
  const env = useStore((s) => s.env), model = useStore((s) => s.model), compare = useStore((s) => s.compare);
  const snapA = useStore((s) => s.snapA), snapB = useStore((s) => s.snapB), q = useStore((s) => s.quality);
  const span = Math.max(...model.nodes.map((n) => n.x));
  const comparing = compare && !!snapA && !!snapB && env === 'gorge';
  return (
    <>
      <Sky />
      <Lights />
      <Environment resolution={128} frames={1} background={false}>
        <Lightformer form="rect" intensity={2.2} color="#ffe2c0" position={[-6, 4, -8]} scale={[12, 4, 1]} />
        <Lightformer form="rect" intensity={1.2} color="#9cc8ff" position={[6, 6, 6]} scale={[10, 6, 1]} />
        <Lightformer form="ring" intensity={0.8} color="#ffffff" position={[0, 10, 0]} scale={4} />
      </Environment>
      {env === 'gorge' ? (
        <>
          <Gorge />
          <Abutments span={span} />
          <group name="live-bridge"><TrussBridge /></group>
          <ArcadeFailure />
          {comparing ? <CompareRenderer /> : null}
        </>
      ) : (
        <>
          <City />
          {env === 'city' ? <BeamBridge /> : <CableStayed />}
        </>
      )}
      <CameraDirector />
      <Clock />
      {useStore.getState().reel ? <ReelProbe /> : <TestProbe />}
      {!comparing ? (
        <EffectComposer multisampling={q === 'high' ? 4 : 0} enableNormalPass={false}>
          {q === 'high' ? <N8AO aoRadius={2.2} intensity={1.6} distanceFalloff={0.6} halfRes /> : <></>}
          <Bloom luminanceThreshold={0.92} luminanceSmoothing={0.2} intensity={0.45} mipmapBlur />
          <Vignette offset={0.32} darkness={0.42} />
        </EffectComposer>
      ) : null}
    </>
  );
}

export function Scene() {
  const reel = useStore((s) => s.reel);
  return (
    <Canvas shadows dpr={reel ? 1 : [1, 1.75]} gl={{ antialias: true, preserveDrawingBuffer: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.0 }}
      camera={{ position: [-40, 10, 36], fov: 45, near: 0.3, far: 5000 }} onPointerMissed={() => useStore.getState().set({ selected: null })}>
      <Suspense fallback={null}><World /></Suspense>
    </Canvas>
  );
}
