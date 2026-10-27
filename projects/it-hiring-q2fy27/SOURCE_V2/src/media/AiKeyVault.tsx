// aiKeyVault (Railway, COMPANY'S EARLY FINDINGS): a dark vault; AI-provider "key" tokens float above a lit pedestal, and a
// shadowy claw on a cable reaches down for them, beat by beat, and hovers — it never grabs (this is a suspected goal, not a
// confirmed outcome). On-graphic label: SUSPECTED GOAL (company's early findings). Abstract, no tooling. ILLUSTRATIVE.
import React, { useMemo } from 'react';
import * as THREE from 'three';
import type { MediaProps } from './types';
import { ThreeStage, Env, CamRig, type V3 } from '../three/stage';
import { C } from '../styles/theme';
import { F } from '../styles/typography';
import { clamp, dampedSpring, easeInOutCubic, easeOutCubic, invLerp, lerp, spline } from '../lib/anim';
import { hash } from '../lib/rng';
import { Backdrop3D, BEAT, ContactShadow, Glow, Label, Win, WinVignette, canvasTex, everyBeat, fovFor, hit, ramp, tallness, useFontsReady } from './_stub';

const NT = 5;

function tokenTex() {
  return canvasTex(256, 256, (g, W) => {
    g.fillStyle = '#0E1217'; g.fillRect(0, 0, W, W);
    const c = W / 2;
    const gr = g.createRadialGradient(c, c, 10, c, c, W * 0.5); gr.addColorStop(0, '#26323F'); gr.addColorStop(1, '#0E1217');
    g.fillStyle = gr; g.fillRect(0, 0, W, W);
    g.strokeStyle = '#DDEBFF'; g.fillStyle = '#DDEBFF'; g.lineWidth = 12; g.lineCap = 'round';
    // key glyph
    g.beginPath(); g.arc(c - 30, c + 6, 24, 0, Math.PI * 2); g.stroke();
    g.beginPath(); g.moveTo(c - 6, c + 6); g.lineTo(c + 56, c + 6); g.moveTo(c + 40, c + 6); g.lineTo(c + 40, c + 28); g.moveTo(c + 22, c + 6); g.lineTo(c + 22, c + 22); g.stroke();
    g.font = `800 44px ${F.mono}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('AI', c, c - 52);
  });
}
function doorTex() {
  return canvasTex(512, 512, (g, W) => {
    const c = W / 2;
    g.fillStyle = '#0B0C0E'; g.fillRect(0, 0, W, W);
    for (let i = 0; i < 9; i++) { g.beginPath(); g.arc(c, c, 40 + i * 26, 0, Math.PI * 2); g.strokeStyle = `rgba(150,160,175,${0.05 + (i % 3 === 0 ? 0.07 : 0.02)})`; g.lineWidth = i % 3 === 0 ? 5 : 2; g.stroke(); }
    for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2; g.beginPath(); g.moveTo(c + Math.cos(a) * 60, c + Math.sin(a) * 60); g.lineTo(c + Math.cos(a) * 250, c + Math.sin(a) * 250); g.strokeStyle = 'rgba(150,160,175,0.035)'; g.lineWidth = 2; g.stroke(); }
  });
}

/** cylinder between two points */
const Rod: React.FC<{ a: V3; b: V3; r: number; mat: THREE.Material }> = ({ a, b, r, mat }) => {
  const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b);
  const mid = va.clone().add(vb).multiplyScalar(0.5), len = va.distanceTo(vb);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), vb.clone().sub(va).normalize());
  return <mesh position={mid} quaternion={q} scale={[r, len, r]} material={mat}><cylinderGeometry args={[1, 1, 1, 12]} /></mesh>;
};

const Scene: React.FC<MediaProps> = ({ w, h, f }) => {
  const res = useMemo(() => {
    const tTex = tokenTex(); tTex.center.set(0.5, 0.5); tTex.rotation = Math.PI / 2;
    const side = new THREE.MeshPhysicalMaterial({ color: '#C9D3E0', metalness: 1, roughness: 0.22, envMapIntensity: 1.2 });
    const cap = new THREE.MeshPhysicalMaterial({ color: '#FFFFFF', metalness: 0.6, roughness: 0.3, emissiveMap: tTex, emissive: new THREE.Color('#FFFFFF'), emissiveIntensity: 1.25, map: tTex });
    const tokenGeo = new THREE.CylinderGeometry(0.39, 0.39, 0.09, 6, 1);
    const clawMat = new THREE.MeshPhysicalMaterial({ color: '#25272C', metalness: 0.9, roughness: 0.32, clearcoat: 0.6 });
    const eyeMat = new THREE.MeshBasicMaterial({ color: '#FF6A2A', toneMapped: false });
    const door = doorTex();
    const beam = canvasTex(64, 256, (g, W, H) => {
      const v = g.createLinearGradient(0, 0, 0, H); v.addColorStop(0, 'rgba(255,255,255,0.9)'); v.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = v; g.fillRect(0, 0, W, H);
      g.globalCompositeOperation = 'destination-in';
      const hz = g.createLinearGradient(0, 0, W, 0); hz.addColorStop(0, 'rgba(0,0,0,0)'); hz.addColorStop(0.5, 'rgba(0,0,0,1)'); hz.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = hz; g.fillRect(0, 0, W, H);
    });
    return { side, cap, tokenGeo, clawMat, eyeMat, door, beam };
  }, []);

  // claw path (hub position) keyed to beats; it never closes on the tokens
  const desc = [[3.4, 5.0, 0.55], [2.05, 4.05, 0.45], [1.05, 3.5, 0.35], [0.55, 3.2, 0.3], [0.5, 3.14, 0.3]];
  const prog = (() => {
    // 0 at f=-20 (already in frame at f=0), one step per beat with a spring settle
    let u = 0;
    for (let k = 0; k < 4; k++) u += clamp(dampedSpring((f - (k * BEAT - (k === 0 ? 40 : 12))) / 60, 11, 0.62), 0, 1.06);
    return u / 4;
  })();
  const hp = spline(desc, prog);
  const sway = Math.sin(f * 0.045) * 0.05;
  const hub: V3 = [hp[0] + sway, hp[1] + Math.sin(f * 0.07) * 0.03, hp[2]];
  const open = lerp(0.35, 0.95, easeOutCubic(prog * 1.3)) - 0.15 * ramp(f, 3 * BEAT, 4 * BEAT);
  const scan = ramp(f, 2 * BEAT - 6, 2 * BEAT + 8);
  const pulse = everyBeat(f, 12);

  const tall = tallness(w, h);
  const fov = fovFor(w, h, 30);
  const camPos: V3 = [-0.8 + Math.sin(f * 0.004) * 0.3, 1.9 + tall * 0.2, 8.4 - Math.min(f, 240) * 0.002];
  const target: V3 = [0.3, 1.62 - tall * 0.1, 0];
  const labelP = ramp(f, 4, 20);

  return (
    <>
      <CamRig pos={camPos} target={target} fov={fov} />
      <Env intensity={0.45} />
      <Backdrop3D top="#111317" bottom="#08090B" glowA="#1A2230" dirA={[-0.1, 0.25, -1]} powA={5} glowB="#2A140C" dirB={[0.7, 0.6, -1]} powB={6} />
      <ambientLight intensity={0.12} />
      <directionalLight position={[-4, 5, 5]} intensity={0.9} color="#DCE6FF" />
      <directionalLight position={[3, 5, -5]} intensity={1.3} color="#7FA6FF" />
      <directionalLight position={[-2, 6, -4]} intensity={1.4} color="#9DB6E8" />
      <pointLight position={[-0.4, 0.95, 0.6]} intensity={9} distance={5} color="#CFE2FF" />
      <pointLight position={[hub[0], hub[1] + 0.4, hub[2] + 0.6]} intensity={2 + pulse * 2} distance={3} color="#FF6A2A" />
      {/* vault door behind */}
      <group position={[0.3, 1.7, -4.2]}>
        <mesh><circleGeometry args={[3.1, 64]} /><meshStandardMaterial map={res.door} metalness={0.7} roughness={0.5} color="#9AA3B0" /></mesh>
        <mesh position={[0, 0, 0.1]}><torusGeometry args={[3.25, 0.28, 16, 96]} /><meshPhysicalMaterial color="#2A2D33" metalness={0.9} roughness={0.3} clearcoat={0.5} /></mesh>
        {Array.from({ length: 16 }, (_, i) => { const a = (i / 16) * Math.PI * 2; return (
          <mesh key={i} position={[Math.cos(a) * 3.25, Math.sin(a) * 3.25, 0.32]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.09, 0.09, 0.16, 16]} /><meshStandardMaterial color="#3A3E46" metalness={0.9} roughness={0.25} /></mesh>
        ); })}
      </group>
      {/* floor + pedestal */}
      <mesh position={[0, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[14, 64]} /><meshPhysicalMaterial color="#0E0F12" roughness={0.5} metalness={0.4} clearcoat={0.3} /></mesh>
      <group position={[-0.4, 0, 0]}>
        <mesh position={[0, 0.22, 0]}><cylinderGeometry args={[1.55, 1.7, 0.44, 64]} /><meshPhysicalMaterial color="#1A1C21" metalness={0.85} roughness={0.3} clearcoat={0.6} /></mesh>
        <mesh position={[0, 0.445, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[1.38, 1.47, 96]} /><meshBasicMaterial color="#BFD6FF" toneMapped={false} /></mesh>
        <Glow pos={[0, 0.6, 0]} size={4.2} color="#9EC0FF" opacity={0.28} />
        {/* tokens */}
        {Array.from({ length: NT }, (_, i) => {
          const a = ((i - (NT - 1) / 2) / (NT - 1)) * 1.6;
          const x = ((i - (NT - 1) / 2) / (NT - 1)) * 2.75, z = Math.cos(a) * 0.45 - 0.2;
          const y = 1.0 + Math.sin(f * 0.05 + i * 0.9) * 0.06 + Math.abs(i - 3) * 0.04;
          const look = Math.sin(f * 0.02 + i) * 0.25 - a * 0.3;
          // the scan from the claw makes the nearest tokens flare briefly as it passes
          const sx = lerp(1.05, -1.85, (((f - 2 * BEAT) % 60) + 60) % 60 / 60) + 0.4;
          const near = scan * Math.exp(-((x - sx) ** 2) * 3);
          const flick = 1 + near * 0.6;
          return (
            <group key={i} position={[x, y, z]} rotation={[Math.PI / 2, 0, 0]}>
              <group rotation={[0, 0, look]}>
                <mesh geometry={res.tokenGeo} material={[res.side, res.cap, res.cap]} rotation={[0, (hash(i, 2) - 0.5) * 0.3, 0]} />
              </group>
              <Glow pos={[0, -0.2, 0]} size={1.25 * flick} color="#B8D2FF" opacity={0.34 * flick} />
            </group>
          );
        })}
        <ContactShadow pos={[0, 0.45, 0]} sx={2.6} sz={1.6} opacity={0.35} />
      </group>
      {/* the claw */}
      <Rod a={[hub[0], hub[1] + 0.3, hub[2]]} b={[hub[0] + 0.9, 9, hub[2] - 0.4]} r={0.045} mat={res.clawMat} />
      <group position={hub} scale={1.45}>
        <mesh material={res.clawMat}><cylinderGeometry args={[0.24, 0.3, 0.34, 32]} /></mesh>
        <mesh position={[0, 0.22, 0]} material={res.clawMat}><cylinderGeometry args={[0.1, 0.18, 0.16, 24]} /></mesh>
        <mesh position={[0, -0.21, 0]} material={res.clawMat}><cylinderGeometry args={[0.3, 0.22, 0.1, 32]} /></mesh>
        <mesh position={[0, -0.02, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.305, 0.02, 8, 64]} /><meshBasicMaterial color="#FF6A2A" toneMapped={false} transparent opacity={0.7 + pulse * 0.3} /></mesh>
        {[0, 1, 2].map((k) => {
          const a = (k / 3) * Math.PI * 2 + 0.5;
          return (
            <group key={k} rotation={[0, a, 0]}>
              <group position={[0.24, -0.22, 0]} rotation={[0, 0, open]}>
                <mesh position={[0, -0.3, 0]} material={res.clawMat}><boxGeometry args={[0.1, 0.6, 0.15]} /></mesh>
                <mesh position={[0, -0.6, 0]} material={res.clawMat}><sphereGeometry args={[0.08, 16, 16]} /></mesh>
                <group position={[0, -0.6, 0]} rotation={[0, 0, -open * 1.35]}>
                  <mesh position={[0, -0.22, 0]} material={res.clawMat}><boxGeometry args={[0.085, 0.44, 0.13]} /></mesh>
                  <mesh position={[-0.05, -0.5, 0]} rotation={[0, 0, -0.7]} material={res.clawMat}><coneGeometry args={[0.06, 0.2, 12]} /></mesh>
                  <mesh position={[0.045, -0.2, 0]} material={res.eyeMat}><boxGeometry args={[0.006, 0.22, 0.02]} /></mesh>
                </group>
              </group>
            </group>
          );
        })}
        <Glow pos={[0, -0.12, 0.25]} size={0.8} color="#FF6A2A" opacity={0.5 + pulse * 0.3} />
      </group>
      {/* scan beam: a soft fan from the claw tip sweeping across the tokens */}
      {scan > 0.01 ? (() => {
        const sx = lerp(1.05, -1.85, (((f - 2 * BEAT) % 60) + 60) % 60 / 60);
        const tip = new THREE.Vector3(hub[0], hub[1] - 1.2, hub[2]), end = new THREE.Vector3(sx, 1.05, 0.2);
        const mid = tip.clone().add(end).multiplyScalar(0.5), len = tip.distanceTo(end);
        const ang = Math.atan2(end.x - tip.x, tip.y - end.y);
        return (
          <mesh position={mid} rotation={[0, 0, ang]}>
            <planeGeometry args={[0.7, len]} />
            <meshBasicMaterial map={res.beam} color="#FF6A2A" transparent opacity={0.8 * scan} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} />
          </mesh>
        );
      })() : null}
    </>
  );
};

export const AiKeyVault: React.FC<MediaProps> = (p) => {
  const ready = useFontsReady();
  const lp = ramp(p.f, 4, 22);
  return (
    <Win w={p.w} h={p.h} bg="#090A0C">
      {ready ? <ThreeStage width={p.w} height={p.h} exposure={1.1} fog={['#08090B', 9, 16]}><Scene {...p} /></ThreeStage> : null}
      <WinVignette strength={0.5} />
      <Label x={p.w - 28} y={p.h - 96} anchor="right" text="SUSPECTED GOAL" sub="(company's early findings)" color={C.alert} p={lp} size={26} />
    </Win>
  );
};
