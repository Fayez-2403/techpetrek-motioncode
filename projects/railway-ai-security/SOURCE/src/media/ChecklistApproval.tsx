// checklistApproval (WHAT TO DO NOW: HUMAN APPROVAL): an agent action card rides up to a gate and waits behind an amber
// light curtain; a human approve toggle flips to mint on the beat, the curtain clears and the card passes with a check.
// ILLUSTRATIVE.
import React, { useMemo } from 'react';
import * as THREE from 'three';
import type { MediaProps } from './types';
import { ThreeStage, Env, CamRig, type V3 } from '../three/stage';
import { C } from '../styles/theme';
import { F } from '../styles/typography';
import { clamp, dampedSpring, easeInOutCubic, easeOutCubic, invLerp, lerp } from '../lib/anim';
import { Backdrop3D, BEAT, ContactShadow, DoneLabel, Glow, Win, WinVignette, canvasTex, doneAt, everyBeat, fovFor, hit, ramp, roundedSlab, rr, tallness, useFontsReady } from './_stub';

const GX = 0.75;          // gate x
const CW = 2.15, CH = 1.33;

function cardTex(approved: boolean) {
  return canvasTex(700, 432, (g, W, H) => {
    g.clearRect(0, 0, W, H);
    rr(g, 6, 6, W - 12, H - 12, 34); g.fillStyle = 'rgba(14,16,20,0.9)'; g.fill(); g.lineWidth = 4; g.strokeStyle = approved ? C.mintSoft : 'rgba(255,170,100,0.85)'; g.stroke();
    // bot glyph
    rr(g, 44, 46, 76, 62, 16); g.lineWidth = 7; g.strokeStyle = '#E8ECF2'; g.stroke();
    g.fillStyle = '#E8ECF2'; g.beginPath(); g.arc(68, 77, 7, 0, Math.PI * 2); g.arc(96, 77, 7, 0, Math.PI * 2); g.fill();
    g.fillRect(79, 30, 6, 16);
    g.fillStyle = '#F2F4F8'; g.font = `800 46px ${F.mono}`; g.textBaseline = 'middle'; g.fillText('AGENT ACTION', 144, 80);
    g.fillStyle = 'rgba(255,255,255,0.16)'; rr(g, 44, 158, 520, 22, 11); g.fill(); rr(g, 44, 202, 380, 22, 11); g.fill();
    const col = approved ? C.mintSoft : '#FFAA64', label = approved ? 'APPROVED' : 'WAITING';
    g.font = `800 38px ${F.mono}`; const tw = g.measureText(label).width;
    rr(g, 44, 284, tw + 96, 76, 38); g.fillStyle = approved ? 'rgba(16,60,44,0.95)' : 'rgba(70,40,18,0.95)'; g.fill(); g.lineWidth = 3; g.strokeStyle = col; g.stroke();
    g.fillStyle = col; g.beginPath(); g.arc(80, 322, 12, 0, Math.PI * 2); g.fill(); g.fillText(label, 106, 324);
  });
}
function plateTex() {
  return canvasTex(512, 256, (g, W, H) => {
    g.clearRect(0, 0, W, H);
    // person glyph
    g.fillStyle = '#E8ECF2'; g.beginPath(); g.arc(70, 90, 30, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.moveTo(22, 196); g.quadraticCurveTo(22, 132, 70, 132); g.quadraticCurveTo(118, 132, 118, 196); g.closePath(); g.fill();
    g.font = `800 44px ${F.mono}`; g.textBaseline = 'middle'; g.fillText('APPROVE', 150, 140);
  });
}
function curtainTex() {
  const t = canvasTex(64, 256, (g, W, H) => {
    g.clearRect(0, 0, W, H);
    for (let y = 0; y < H; y += 16) { g.fillStyle = 'rgba(255,255,255,0.9)'; g.fillRect(0, y, W, 3); }
    const v = g.createLinearGradient(0, 0, 0, H); v.addColorStop(0, 'rgba(255,255,255,0.35)'); v.addColorStop(1, 'rgba(255,255,255,0.08)');
    g.fillStyle = v; g.fillRect(0, 0, W, H);
  });
  return t;
}

const Scene: React.FC<MediaProps> = ({ w, h, f, dur }) => {
  const D = doneAt(dur);
  const res = useMemo(() => {
    return {
      lane: roundedSlab(14, 0.9, 0.08, 0.1, 0.03), pillar: roundedSlab(0.24, 2.1, 0.34, 0.08, 0.04),
      card: roundedSlab(CW, CH, 0.07, 0.12, 0.03), track: roundedSlab(1.5, 0.7, 0.28, 0.35, 0.08), base: roundedSlab(3.0, 1.15, 0.12, 0.18, 0.04),
      waiting: cardTex(false), approved: cardTex(true), plate: plateTex(), curtain: curtainTex(),
      check: canvasTex(128, 128, (g, W) => { g.clearRect(0, 0, W, W); g.fillStyle = C.mint; g.beginPath(); g.arc(64, 64, 60, 0, Math.PI * 2); g.fill();
        g.strokeStyle = '#F2FFF9'; g.lineWidth = 13; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.moveTo(36, 66); g.lineTo(56, 86); g.lineTo(93, 45); g.stroke(); }),
    };
  }, []);

  // card: arrives at the gate on beat 1, waits, passes after approval
  const arrive = easeOutCubic(invLerp(-30, Math.min(BEAT - 2, D - 20), f));
  const pass = easeInOutCubic(invLerp(D + 4, D + 30, f));
  const cx = lerp(-5.6, GX - 1.5, arrive) + pass * 2.75;
  const flip = dampedSpring((f - (D - 10)) / 60, 16, 0.5);   // toggle thumb
  const done = ramp(f, D - 2, D + 6);
  const clear = easeOutCubic(invLerp(D, D + 16, f));
  const wait = f >= Math.min(BEAT - 4, D - 22) && f < D ? everyBeat(f, 14) : 0;
  const knock = hit(f, Math.min(BEAT - 2, D - 20), 10);
  const badge = dampedSpring((f - (D + 22)) / 60, 14, 0.5);
  const mint = new THREE.Color(C.mintSoft), amber = new THREE.Color('#FFAA64');
  const gateCol = amber.clone().lerp(mint, done);

  const tall = tallness(w, h);
  const fov = fovFor(w, h, 30);
  const camPos: V3 = [-0.4 + Math.sin(f * 0.004) * 0.3, 2.5 + tall * 0.3, 8.8 - Math.min(f, 240) * 0.002];
  const target: V3 = [0.25, 0.35 - tall * 0.12, 0];

  return (
    <>
      <CamRig pos={camPos} target={target} fov={fov} />
      <Env intensity={0.6} />
      <Backdrop3D top="#14161A" bottom="#08090B" glowA={'#' + new THREE.Color('#24180E').lerp(new THREE.Color('#0E2A20'), done).getHexString()} dirA={[0.2, 0.2, -1]} powA={3.5} glowB="#171B22" dirB={[-0.7, 0.3, -1]} powB={4} />
      <ambientLight intensity={0.3} />
      <directionalLight position={[-4, 6, 7]} intensity={1.5} color="#F3F6FF" />
      <directionalLight position={[5, 3, -5]} intensity={0.7} color="#9DB4DC" />
      <group rotation={[0, -0.62, 0]} position={[0.2, 0, -0.4]}>
      {/* lane */}
      <mesh geometry={res.lane} position={[0, -0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <meshPhysicalMaterial color="#1C1F25" roughness={0.3} metalness={0.5} clearcoat={0.8} />
      </mesh>
      <mesh position={[0, 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[14, 0.03]} />
        <meshBasicMaterial color={new THREE.Color('#3A3F48').lerp(mint, done * 0.8)} toneMapped={false} />
      </mesh>
      {/* gate: two glass pillars + light curtain */}
      {[-0.78, 0.78].map((z) => (
        <group key={z} position={[GX, 1.05, z]}>
          <mesh geometry={res.pillar}>
            <meshPhysicalMaterial color="#C9D2DE" roughness={0.25} transmission={1} thickness={0.4} ior={1.4} clearcoat={1} emissive={gateCol} emissiveIntensity={0.25 + wait * 0.25} />
          </mesh>
          <Glow pos={[0, 1.0, 0]} size={0.9} color={'#' + gateCol.getHexString()} opacity={0.6 + wait * 0.3} />
        </group>
      ))}
      <mesh position={[GX, lerp(1.0, -0.05, clear) + (1 - clear) * 0 , 0]} rotation={[0, Math.PI / 2, 0]} scale={[1, lerp(1, 0.02, clear), 1]}>
        <planeGeometry args={[1.45, 2.0]} />
        <meshBasicMaterial map={res.curtain} color={gateCol} transparent opacity={(0.75 + wait * 0.25 + knock * 0.4) * (1 - clear * 0.9)} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
      {/* the action card */}
      <group position={[cx, CH / 2 + 0.06, 0]} rotation={[0, 0.42, 0]}>
        <mesh geometry={res.card}>
          <meshPhysicalMaterial color="#AEB8C6" roughness={0.3} transmission={1} thickness={0.3} ior={1.4} clearcoat={1} />
        </mesh>
        <mesh position={[0, 0, 0.04]}>
          <planeGeometry args={[CW * 0.98, CW * 0.98 * (432 / 700)]} />
          <meshBasicMaterial map={res.waiting} transparent opacity={1 - done} depthWrite={false} toneMapped={false} />
        </mesh>
        <mesh position={[0, 0, 0.041]}>
          <planeGeometry args={[CW * 0.98, CW * 0.98 * (432 / 700)]} />
          <meshBasicMaterial map={res.approved} transparent opacity={done} depthWrite={false} toneMapped={false} />
        </mesh>
        {badge > 0.01 ? (
          <group position={[CW / 2 - 0.12, CH / 2 - 0.1, 0.08]} scale={clamp(badge, 0, 1.15)}>
            <mesh><planeGeometry args={[0.44, 0.44]} /><meshBasicMaterial map={res.check} transparent depthWrite={false} toneMapped={false} /></mesh>
            <Glow pos={[0, 0, 0.05]} size={0.9} color={C.mint} opacity={0.6} />
          </group>
        ) : null}
        <ContactShadow pos={[0, -CH / 2 - 0.055, 0]} sx={2.2} sz={0.7} opacity={0.5} />
      </group>
      </group>
      {/* human approve toggle */}
      <group position={[1.35, -0.12, 2.6]} rotation={[-0.95, -0.12, 0]}>
        <mesh geometry={res.base} position={[0.35, 0, -0.04]}>
          <meshPhysicalMaterial color="#17191E" metalness={0.6} roughness={0.35} clearcoat={0.8} />
        </mesh>
        <mesh position={[1.05, 0, 0.03]}>
          <planeGeometry args={[1.5, 0.75]} />
          <meshBasicMaterial map={res.plate} transparent depthWrite={false} toneMapped={false} />
        </mesh>
        <group position={[-0.5, 0, 0.12]}>
          <mesh geometry={res.track}>
            <meshPhysicalMaterial color={new THREE.Color('#2E323A').lerp(new THREE.Color(C.mint), clamp(flip))} roughness={0.3} metalness={0.2} clearcoat={1} emissive={C.mint} emissiveIntensity={clamp(flip) * 0.35} />
          </mesh>
          <mesh position={[lerp(-0.4, 0.4, clamp(flip, 0, 1.08)), 0, 0.17]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.27, 0.27, 0.12, 40]} />
            <meshPhysicalMaterial color="#F1F3F6" metalness={0.1} roughness={0.25} clearcoat={1} />
          </mesh>
          <Glow pos={[0, 0, 0.3]} size={2.2} color={C.mint} opacity={done * 0.35 + hit(f, D, 14) * 0.4} />
        </group>
      </group>
    </>
  );
};

export const ChecklistApproval: React.FC<MediaProps> = (p) => {
  const ready = useFontsReady();
  const D = doneAt(p.dur);
  return (
    <Win w={p.w} h={p.h} bg="#0A0A0C">
      {ready ? <ThreeStage width={p.w} height={p.h} exposure={1.05}><Scene {...p} /></ThreeStage> : null}
      <WinVignette strength={0.45} />
      <DoneLabel x={24} y={22} text="HUMAN APPROVAL" p={ramp(p.f, 2, 18)} done={ramp(p.f, D - 2, D + 8)} />
    </Win>
  );
};
