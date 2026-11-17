// Look-dev: the bot in 8 poses / expressions on the studio floor (one still per frame index).
import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { ThreeCanvas } from '@remotion/three';
import { Bot, type Pose } from '../bot/Bot';
import { cheer, idle, jump, magnify, point, shocked, walk, wave, angryStomp } from '../bot/moves';

const POSES: [string, (t: number) => Pose][] = [
  ['idle', (t) => idle(t)],
  ['hop (air)', (t) => jump(0.4, 0, 3, 0.6, [0, 0, 0], [0, 0, 0])],
  ['stomp land', () => jump(1.0, 0, 4, 0.7, [0, 0, 0], [0, 0, 0], true)],
  ['walk', (t) => walk(0.7, 0, [0, 0, 0], [0, 0, 6], 2)],
  ['wave', (t) => wave(t)],
  ['magnify', (t) => magnify(t)],
  ['goggles + point', (t) => point(t, 1, { goggles: 1, eyes: 'squint', mouth: 'grin' })],
  ['cheer', (t) => cheer(0.17)],
  ['shocked', (t) => shocked(t)],
  ['angry stomp', () => angryStomp(0.13)],
];

export const BotLookDev: React.FC = () => {
  const f = useCurrentFrame(), [, fn] = POSES[f % POSES.length];
  const p = fn(1.3);
  return (
    <AbsoluteFill style={{ background: 'radial-gradient(80% 60% at 50% 40%, #20242c, #0b0d11)' }}>
      <ThreeCanvas width={1080} height={1080} camera={{ position: [7, 5, 13], fov: 40 }} shadows gl={{ antialias: true }}>
        <ambientLight intensity={0.35} />
        <hemisphereLight args={['#bcd3ff', '#3a2a22', 0.7]} />
        <directionalLight position={[6, 12, 8]} intensity={2.4} castShadow shadow-mapSize={[2048, 2048]} />
        <pointLight position={[-6, 4, -4]} intensity={60} color="#63E5FA" />
        <group position={[0, -2.5, 0]} rotation-y={-0.35}>
          <Bot p={p} />
          <mesh rotation-x={-Math.PI / 2} receiveShadow><circleGeometry args={[9, 48]} /><meshStandardMaterial color="#1a1d23" roughness={0.6} /></mesh>
        </group>
        <perspectiveCamera />
      </ThreeCanvas>
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 40, textAlign: 'center', color: '#fff', fontFamily: 'Inter, sans-serif', fontSize: 44, fontWeight: 800 }}>{POSES[f % POSES.length][0]}</div>
    </AbsoluteFill>
  );
};
