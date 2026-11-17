// Look-dev of the reel's world (portrait): frame 0 = bot magnifying three.js's real star count; frame 1 = stomp
// landing on a floor panel; frame 2 = wide gallery with the bot; frame 3 = puppet strings over the Puppeteer panel.
import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { ThreeCanvas } from '@remotion/three';
import * as THREE from 'three';
import { Bot } from '../bot/Bot';
import { idle, jump, magnify, cheer } from '../bot/moves';
import { Panel, Lens, PANEL_ASPECT, usePreload, ALL_TEXTURES } from '../world/Panel';
import { BG, Dust, Floor, Fog, Gallery, Lights, SLUGS } from '../world/Studio';
import BOX from '../config/repoBoxes.json';
import { Cam } from '../world/Camera';

export const HeroLookDev: React.FC = () => {
  const f = useCurrentFrame();
  const W = 8, H = W * PANEL_ASPECT, star = (BOX as any).threejs.starsAbout;
  const ready = usePreload(ALL_TEXTURES(SLUGS));
  if (!ready) return <AbsoluteFill style={{ background: BG }} />;
  return (
    <AbsoluteFill style={{ background: BG }}>
      <ThreeCanvas width={1080} height={1920} shadows gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}>
        <color attach="background" args={[BG]} />
        <Fog />
        <Lights />
        <Floor />
        <Dust t={2} />
        {f === 0 ? (
          <>
            <Cam pos={[5.5, 6.5, 15]} look={[1.2, 6.2, 0]} fov={46} />
            <Gallery except={['threejs']} />
            <Panel slug="threejs" width={W} position={[1.5, H / 2 + 0.3, -2]} rotation-y={-0.18} glow={0.9} />
            <Lens slug="threejs" uv={[star.u, star.v]} zoom={3.2} radius={1.55} position={[3.4, 9.6, 1.2]} rotation-y={-0.18} />
            <Bot p={magnify(1.2, { look: [0.8, 0.9], prop: 'none' })} />
          </>
        ) : f === 1 ? (
          <>
            <Cam pos={[-11, 6, 15]} look={[0, 1.5, 0]} fov={46} />
            <Gallery />
            <Panel slug="pedalboard" width={9} position={[0, 0.06, 0]} rotation-x={-Math.PI / 2} glow={1} />
            <Bot p={jump(0.84, 0, 4, 0.7, [0, 0.08, 0], [0, 0.08, 0], true)} />
          </>
        ) : f === 2 ? (
          <>
            <Cam pos={[0, 9, 30]} look={[0, 5, 0]} fov={50} />
            <Gallery dim={0.8} />
            <Bot p={cheer(0.2)} />
          </>
        ) : (
          <>
            <Cam pos={[6, 7, 16]} look={[0, 5.5, 0]} fov={46} />
            <Gallery except={['puppeteer']} />
            <Panel slug="puppeteer" width={W} position={[-1, H / 2 + 0.3, -3]} glow={0.9} />
            <Bot p={idle(0.7, { pos: [0, 2.2, 1], armL: { raise: 1.2, swing: 0, stretch: 1 }, armR: { raise: 0.6, swing: 0, stretch: 1 }, legs: [0.3, 0, 0.5, 0.1], eyes: 'wide', mouth: 'o' })} />
            {[[-2.8, 4.2], [3.3, 3.6], [-1.6, 3.2], [1.9, 3.2]].map(([x, y], i) => (
              <mesh key={i} position={[x, y + 7, 1]}><cylinderGeometry args={[0.02, 0.02, 14, 4]} /><meshBasicMaterial color="#e8f3f7" transparent opacity={0.7} /></mesh>
            ))}
          </>
        )}
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
