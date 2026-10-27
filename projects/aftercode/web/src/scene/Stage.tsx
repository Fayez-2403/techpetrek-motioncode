// The live 3D stage: one clock tick per frame (AF), the selected world, the dancers, the camera director and post FX.
import React, { Suspense, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { EffectComposer, Bloom, Vignette, ChromaticAberration, ToneMapping } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { getClip, loadAll, type Clip } from '../dance/clips';
import { useApp, type WorldId } from '../state';
import { updateAF, AF } from './af';
import { Performers } from './Performers';
import { Director } from './Director';
import { NeonTunnel, ParticleGalaxy, LiquidChrome, AudioCity } from '../worlds/WorldsA';
import { FractalBloom, BeatStage, DreamSpace, OfficeBreak } from '../worlds/WorldsB';

const WORLD: Record<WorldId, React.FC> = { tunnel: NeonTunnel, galaxy: ParticleGalaxy, chrome: LiquidChrome, city: AudioCity, bloom: FractalBloom, stage: BeatStage, dream: DreamSpace, office: OfficeBreak };
const BLOOM: Record<WorldId, number> = { tunnel: 1.3, galaxy: 1.1, chrome: 0.5, city: 0.9, bloom: 0.7, stage: 1.2, dream: 0.25, office: 0.8 };

const Clock: React.FC = () => { useFrame(() => { updateAF(); }, -10); return null; };
const Env: React.FC = () => {
  const { gl, scene } = useThree();
  useEffect(() => { const pm = new THREE.PMREMGenerator(gl); const env = pm.fromScene(new RoomEnvironment(), 0.04).texture; scene.environment = env; scene.environmentIntensity = 0.32; return () => { env.dispose(); pm.dispose(); }; }, [gl, scene]);
  return null;
};
const Post: React.FC<{ world: WorldId; quality: string }> = ({ world, quality }) => {
  if (quality === 'low') return null;
  return (
    <EffectComposer multisampling={quality === 'high' ? 4 : 0}>
      <Bloom mipmapBlur intensity={BLOOM[world]} luminanceThreshold={1.0} luminanceSmoothing={0.25} />
      <ChromaticAberration offset={new THREE.Vector2(0.0006, 0.0004)} radialModulation={false} modulationOffset={0} />
      <Vignette eskil={false} offset={0.28} darkness={0.72} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  );
};

export const Stage: React.FC<{ camOverride?: (c: THREE.PerspectiveCamera) => boolean; onReady?: () => void }> = ({ camOverride, onReady }) => {
  const world = useApp((s) => s.world), quality = useApp((s) => s.quality), view = useApp((s) => s.view);
  const [skeleton, setSkeleton] = useState<Clip | null>(null);
  useEffect(() => { void loadAll().then(() => { setSkeleton(getClip('hiphop')!); onReady?.(); }); }, [onReady]);
  const W = WORLD[world];
  return (
    <Canvas shadows={quality !== 'low'} dpr={quality === 'high' ? [1, 2] : 1} gl={{ antialias: true, preserveDrawingBuffer: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
      camera={{ position: [0, 1.4, 6], fov: 38, near: 0.05, far: 200 }} style={{ position: 'absolute', inset: 0 }}>
      <Clock /><Env />
      <Suspense fallback={null}>
        <W key={world} />
        {skeleton && view === 'dance' ? <Performers skeleton={skeleton} /> : null}
      </Suspense>
      <Director override={camOverride} />
      <Post world={world} quality={quality} />
    </Canvas>
  );
};
export { AF };
