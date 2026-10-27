// checklistKey (WHAT TO DO NOW: ROTATE KEYS): a polished chrome key slides into a lock cylinder and turns 90 degrees with a
// small overshoot "click" on the beat; the cylinder's ring lights mint and the label ticks. ILLUSTRATIVE.
import React, { useMemo } from 'react';
import * as THREE from 'three';
import type { MediaProps } from './types';
import { ThreeStage, Env, CamRig, type V3 } from '../three/stage';
import { C } from '../styles/theme';
import { clamp, dampedSpring, easeInOutCubic, easeOutCubic, invLerp, lerp } from '../lib/anim';
import { Backdrop3D, BEAT, DoneLabel, Glow, Win, WinVignette, canvasTex, doneAt, everyBeat, fovFor, hit, ramp, roundedSlab, tallness, useFontsReady } from './_stub';

function bowShape() {
  // key bow: rounded head with a hole
  const s = new THREE.Shape();
  s.absarc(0, 0, 0.5, 0, Math.PI * 2, false);
  const hole = new THREE.Path(); hole.absarc(0, 0.12, 0.17, 0, Math.PI * 2, true);
  s.holes.push(hole);
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.08, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 4, curveSegments: 48 });
  g.translate(0, 0, -0.04);
  return g;
}
function faceTex() {
  return canvasTex(512, 512, (g, W) => {
    const c = W / 2;
    const gr = g.createRadialGradient(c, c, 10, c, c, c); gr.addColorStop(0, '#B9C0CB'); gr.addColorStop(1, '#7D8490');
    g.fillStyle = gr; g.fillRect(0, 0, W, W);
    for (let i = 0; i < 70; i++) { g.beginPath(); g.arc(c, c, 30 + i * 3.2, 0, Math.PI * 2); g.strokeStyle = `rgba(255,255,255,${i % 2 ? 0.05 : 0.025})`; g.lineWidth = 1.5; g.stroke(); }
  });
}

const Scene: React.FC<MediaProps> = ({ w, h, f, dur }) => {
  const D = doneAt(dur);
  const res = useMemo(() => {
    const chrome = new THREE.MeshPhysicalMaterial({ color: '#E9EDF3', metalness: 1, roughness: 0.13, clearcoat: 0.6, envMapIntensity: 1.4 });
    const steel = new THREE.MeshPhysicalMaterial({ color: '#FFFFFF', map: faceTex(), metalness: 1, roughness: 0.28, envMapIntensity: 1.2 });
    const plate = new THREE.MeshPhysicalMaterial({ color: '#191B20', metalness: 0.7, roughness: 0.38, clearcoat: 0.5, clearcoatRoughness: 0.45 });
    return { chrome, steel, plate, bow: bowShape(), plateGeo: roundedSlab(4.4, 3.0, 0.36, 0.3, 0.06) };
  }, []);

  // insert: slides in over the first beat; turn: starts before D, lands on D with an overshoot click
  const ins = easeInOutCubic(invLerp(-26, Math.min(BEAT, D - 14), f));
  const turn = dampedSpring((f - (D - 12)) / 60, 15, 0.42);
  const kz = lerp(1.6, 0.0, ins);                 // key shoulder distance from the cylinder face
  const rot = turn * (Math.PI / 2);
  const click = hit(f, D, 16);
  const done = ramp(f, D - 2, D + 6);
  const pulse = everyBeat(f, 12) * done;

  const tall = tallness(w, h);
  const fov = fovFor(w, h, 28);
  const camPos: V3 = [3.3 + Math.sin(f * 0.005) * 0.25, 1.25 + tall * 0.3, 6.6 - Math.min(f, 240) * 0.002];
  const target: V3 = [0.35, 0.05 - tall * 0.12, 0.6];
  const mint = new THREE.Color(C.mintSoft), idle = new THREE.Color('#3A3F48');
  const ringCol = idle.clone().lerp(mint, done);

  const teeth = [0.16, 0.1, 0.2, 0.12, 0.18, 0.09];
  return (
    <>
      <CamRig pos={camPos} target={target} fov={fov} />
      <Env intensity={0.9} />
      <Backdrop3D top="#15171B" bottom="#09090B" glowA={'#' + new THREE.Color('#1A1E24').lerp(new THREE.Color('#0F2A20'), done).getHexString()} dirA={[-0.3, 0.2, -1]} powA={3} glowB="#1A1C22" dirB={[0.7, 0.4, -1]} powB={4} />
      <ambientLight intensity={0.25} />
      <directionalLight position={[4, 5, 6]} intensity={1.4} color="#F5F7FF" />
      <directionalLight position={[-5, 2, -2]} intensity={0.9} color="#9FB2D6" />
      <pointLight position={[-0.6, -0.3, 2.2]} intensity={done * 5 + click * 6} distance={4} color={C.mintSoft} />
      {/* lock plate + cylinder */}
      <mesh geometry={res.plateGeo} material={res.plate} position={[0, 0, -0.18]} />
      <mesh position={[0, 0, 0.0]} rotation={[Math.PI / 2, 0, 0]} material={res.steel}><cylinderGeometry args={[0.78, 0.78, 0.2, 64]} /></mesh>
      <mesh position={[0, 0, 0.01]}><torusGeometry args={[0.8, 0.045, 16, 96]} /><meshPhysicalMaterial color="#C9CFD8" metalness={1} roughness={0.2} /></mesh>
      {/* inner rotating plug with keyway */}
      <group rotation={[0, 0, rot]}>
        <mesh position={[0, 0, 0.105]}><circleGeometry args={[0.5, 64]} /><meshPhysicalMaterial color="#AEB5C0" metalness={1} roughness={0.22} /></mesh>
        <mesh position={[0, 0, 0.11]}><planeGeometry args={[0.075, 0.62]} /><meshBasicMaterial color="#050506" /></mesh>
      </group>
      {/* indicator ring + 0 / 90 ticks */}
      <mesh position={[0, 0, 0.014]}><ringGeometry args={[0.98, 1.04, 96]} /><meshBasicMaterial color={ringCol} toneMapped={false} /></mesh>
      <mesh position={[0, 1.18, 0.014]}><planeGeometry args={[0.06, 0.2]} /><meshBasicMaterial color="#5A606B" toneMapped={false} /></mesh>
      <mesh position={[1.18, 0, 0.014]}><planeGeometry args={[0.2, 0.06]} /><meshBasicMaterial color={ringCol} toneMapped={false} /></mesh>
      <Glow pos={[0, 0, 0.2]} size={3.4} color={C.mint} opacity={done * 0.32 + click * 0.45 + pulse * 0.1} />
      {click > 0.02 ? (
        <mesh position={[0, 0, 0.03]} scale={[1 + (1 - click) * 0.7, 1 + (1 - click) * 0.7, 1]}>
          <ringGeometry args={[1.02, 1.08, 96]} /><meshBasicMaterial color={C.mintSoft} transparent opacity={click} toneMapped={false} depthWrite={false} />
        </mesh>
      ) : null}
      {/* the key: shaft along +z out of the cylinder, bow outside */}
      <group position={[0, 0, kz]} rotation={[0, 0, rot]}>
        <mesh position={[0, 0, 0.55]} material={res.chrome}><boxGeometry args={[0.07, 0.24, 1.1]} /></mesh>
        {teeth.map((t, i) => (
          <mesh key={i} position={[0, -0.12 - t / 2, 0.1 + i * 0.13]} material={res.chrome}><boxGeometry args={[0.07, t, 0.09]} /></mesh>
        ))}
        <mesh position={[0, 0.0, 1.18]} material={res.chrome}><boxGeometry args={[0.16, 0.34, 0.16]} /></mesh>
        <mesh geometry={res.bow} material={res.chrome} position={[0, 0.0, 1.62]} rotation={[0, Math.PI / 2, 0]} scale={[0.95, 0.95, 1]} />
      </group>
    </>
  );
};

export const ChecklistKey: React.FC<MediaProps> = (p) => {
  const ready = useFontsReady();
  const D = doneAt(p.dur);
  return (
    <Win w={p.w} h={p.h} bg="#0A0A0C">
      {ready ? <ThreeStage width={p.w} height={p.h} exposure={1.05}><Scene {...p} /></ThreeStage> : null}
      <WinVignette strength={0.45} />
      <DoneLabel x={24} y={22} text="ROTATE KEYS" p={ramp(p.f, 2, 18)} done={ramp(p.f, D - 2, D + 8)} />
    </Win>
  );
};
