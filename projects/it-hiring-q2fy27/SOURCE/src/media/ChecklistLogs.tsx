// checklistLogs (WHAT TO DO NOW: AUDIT LOGS): a glowing log ledger scrolls; a chrome magnifier sweeps it (the lens shows a
// real magnified view of the same rows). On the beat the scroll stops, the lens settles on one entry and it lights mint.
// Log lines are generic and defensive (no real systems, no secrets). ILLUSTRATIVE.
import React, { useMemo } from 'react';
import * as THREE from 'three';
import type { MediaProps } from './types';
import { ThreeStage, Env, CamRig, type V3 } from '../three/stage';
import { C } from '../styles/theme';
import { F } from '../styles/typography';
import { clamp, dampedSpring, easeInOutCubic, easeOutCubic, invLerp, lerp } from '../lib/anim';
import { hash } from '../lib/rng';
import { Backdrop3D, DoneLabel, Glow, Win, WinVignette, canvasTex, doneAt, everyBeat, fovFor, hit, ramp, roundedSlab, rr, tallness, useFontsReady } from './_stub';

const NR = 24, RH = 96, TW = 1024, TH = NR * RH;
const LW = 4.1, LH = 3.9, RY = 0.45;            // ledger size; RY = share of the texture visible at once (12 rows)
const ACTORS = ['agent-01', 'svc-ci', 'user', 'agent-02', 'svc-deploy'];
const ACTIONS = ['tool.call', 'env.read', 'deploy.request', 'approval.granted', 'key.rotated', 'policy.check', 'token.revoked', 'login.mfa', 'secret.access'];
const STATUS = ['ok', 'ok', 'ok', 'warn', 'ok', 'ok', 'info'];
const TARGET_ACTION = 'key.rotated';

function rows() {
  return Array.from({ length: NR }, (_, k) => {
    const t = 36000 + k * 47 + Math.floor(hash(k, 1) * 40);
    const hh = String(Math.floor(t / 3600) % 24).padStart(2, '0'), mm = String(Math.floor(t / 60) % 60).padStart(2, '0'), ss = String(t % 60).padStart(2, '0');
    return { time: `${hh}:${mm}:${ss}`, actor: ACTORS[Math.floor(hash(k, 2) * ACTORS.length)], action: k % 6 === 3 ? TARGET_ACTION : ACTIONS[Math.floor(hash(k, 3) * ACTIONS.length)], st: STATUS[Math.floor(hash(k, 4) * STATUS.length)] };
  });
}
const ROWS = rows();
function ledgerTex() {
  const t = canvasTex(TW, TH, (g, W) => {
    g.fillStyle = '#0C0F12'; g.fillRect(0, 0, W, TH);
    ROWS.forEach((r, k) => {
      const y = k * RH;
      if (k % 2) { g.fillStyle = 'rgba(255,255,255,0.025)'; g.fillRect(0, y, W, RH); }
      g.fillStyle = 'rgba(255,255,255,0.06)'; g.fillRect(40, y + RH - 2, W - 80, 2);
      g.textBaseline = 'middle';
      g.font = `600 34px ${F.mono}`; g.fillStyle = 'rgba(150,160,175,0.75)'; g.fillText(r.time, 48, y + RH / 2);
      g.font = `700 34px ${F.mono}`; g.fillStyle = '#9FD9C2'; g.fillText(r.actor, 250, y + RH / 2);
      g.font = `700 36px ${F.mono}`; g.fillStyle = r.action === TARGET_ACTION ? '#EAF6F0' : '#C9CFDA'; g.fillText(r.action, 500, y + RH / 2);
      const col = r.st === 'ok' ? C.mintSoft : r.st === 'warn' ? '#FFAA64' : '#8FA6D6';
      g.fillStyle = col; g.beginPath(); g.arc(W - 70, y + RH / 2, 11, 0, Math.PI * 2); g.fill();
    });
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

const SPEED = 0.0034;   // texture v per frame (rows drift upward)

const Scene: React.FC<MediaProps> = ({ w, h, f, dur }) => {
  const D = doneAt(dur);
  const res = useMemo(() => {
    const tex = ledgerTex();
    const lensTex = tex.clone(); lensTex.needsUpdate = true;
    const slab = roundedSlab(LW + 0.22, LH + 0.22, 0.14, 0.22, 0.04);
    return { tex, lensTex, slab };
  }, []);

  // scroll: constant speed, then eases to a stop that lands on the beat
  const stopA = D - 16, stopD = 16;
  const scrollAt = (x: number) => (x <= stopA ? SPEED * x : SPEED * stopA + SPEED * (Math.min(x - stopA, stopD) - Math.min(x - stopA, stopD) ** 2 / (2 * stopD)));
  const OY = -scrollAt(f), OYend = -scrollAt(D + 60);
  res.tex.repeat.set(1, RY); res.tex.offset.set(0, OY);

  // pick the target row that will sit nearest the lens's preferred height when the scroll stops
  const tgt = useMemo(() => {
    let best = { ly: 0, d: 9 };
    ROWS.forEach((r, k) => {
      if (r.action !== TARGET_ACTION) return;
      const vRow = 1 - (k + 0.5) / NR;
      for (let wrap = -3; wrap <= 3; wrap++) {
        const vPlane = (vRow + wrap - OYend) / RY;
        const ly = (vPlane - 0.5) * LH;
        if (Math.abs(ly) < LH / 2 - 0.6 && Math.abs(ly + 0.1) < best.d) best = { ly, d: Math.abs(ly + 0.1) };
      }
    });
    return best.ly;
  }, [OYend]);

  // lens sweep (ledger-local), settling on the target on the beat
  const settle = easeInOutCubic(invLerp(D - 22, D, f));
  const sweepX = Math.sin(f * 0.045) * 0.95, sweepY = Math.cos(f * 0.031) * 0.75 + 0.15;
  const lx0 = lerp(sweepX, 0.42, settle), ly0 = lerp(sweepY, tgt, settle);
  const R = 0.6, Z = 1.32;
  const lt = res.lensTex;
  lt.repeat.set((2 * R) / (Z * LW), ((2 * R) / (Z * LH)) * RY);
  lt.offset.set(lx0 / LW + 0.5 - R / (Z * LW), (ly0 / LH + 0.5 - R / (Z * LH)) * RY + OY);

  const done = ramp(f, D - 2, D + 6);
  const flash = hit(f, D, 16);
  const pulse = everyBeat(f, 14);
  const press = dampedSpring((f - (D - 4)) / 60, 18, 0.45);

  const tall = tallness(w, h);
  const fov = fovFor(w, h, 30);
  const camPos: V3 = [0.9 + Math.sin(f * 0.004) * 0.3, 1.3 + tall * 0.2, 8.9 - Math.min(f, 240) * 0.002];
  const target: V3 = [0.15, 0.0 - tall * 0.12, 0];
  const rowH = LH / (NR * RY);

  return (
    <>
      <CamRig pos={camPos} target={target} fov={fov} />
      <Env intensity={0.8} />
      <Backdrop3D top="#14161A" bottom="#08090B" glowA={'#' + new THREE.Color('#14201C').lerp(new THREE.Color('#0E2A20'), done).getHexString()} dirA={[0.0, 0.1, -1]} powA={3} glowB="#1A1C22" dirB={[0.7, 0.4, -1]} powB={4} />
      <ambientLight intensity={0.3} />
      <directionalLight position={[3, 5, 6]} intensity={1.4} color="#F5F7FF" />
      <directionalLight position={[-5, 2, -3]} intensity={0.8} color="#9FB2D6" />
      <group position={[0.35, 0.05, -0.4]} rotation={[-0.36, 0.2, 0]}>
        {/* ledger */}
        <mesh geometry={res.slab} position={[0, 0, -0.09]}>
          <meshPhysicalMaterial color="#121519" metalness={0.5} roughness={0.3} clearcoat={1} clearcoatRoughness={0.15} />
        </mesh>
        <mesh>
          <planeGeometry args={[LW, LH]} />
          <meshBasicMaterial map={res.tex} toneMapped={false} />
        </mesh>
        {/* fade the top / bottom rows */}
        <mesh position={[0, LH / 2 - 0.35, 0.004]}><planeGeometry args={[LW, 0.7]} /><meshBasicMaterial color="#0C0F12" transparent opacity={0.7} depthWrite={false} /></mesh>
        <mesh position={[0, -LH / 2 + 0.35, 0.004]}><planeGeometry args={[LW, 0.7]} /><meshBasicMaterial color="#0C0F12" transparent opacity={0.7} depthWrite={false} /></mesh>
        {/* found entry highlight */}
        <mesh position={[0, ly0, 0.008]}>
          <planeGeometry args={[LW - 0.12, rowH * 0.96]} />
          <meshBasicMaterial color={C.mint} transparent opacity={done * 0.28 + flash * 0.3} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
        </mesh>
        <mesh position={[0, ly0 - rowH * 0.5, 0.009]}><planeGeometry args={[(LW - 0.12) * done, 0.012]} /><meshBasicMaterial color={C.mintSoft} toneMapped={false} /></mesh>
        {/* magnifier, floating above the ledger */}
        <group position={[lx0, ly0, 0.42 - press * 0.06]}>
          <mesh><circleGeometry args={[R, 64]} /><meshBasicMaterial map={res.lensTex} toneMapped={false} /></mesh>
          <mesh position={[0, 0, 0.004]}><circleGeometry args={[R, 64]} /><meshBasicMaterial color={C.mint} transparent opacity={done * 0.16 + flash * 0.2} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} /></mesh>
          <mesh position={[0, 0, 0.01]}>
            <circleGeometry args={[R, 64]} />
            <meshPhysicalMaterial color="#FFFFFF" transparent opacity={0.12} roughness={0.05} metalness={0} clearcoat={1} envMapIntensity={1.5} depthWrite={false} />
          </mesh>
          <mesh><torusGeometry args={[R + 0.035, 0.055, 24, 96]} /><meshPhysicalMaterial color="#E6EAF0" metalness={1} roughness={0.15} envMapIntensity={1.4} /></mesh>
          <group rotation={[0, 0, -0.75]}>
            <mesh position={[0, -(R + 0.42), 0]}><cylinderGeometry args={[0.07, 0.085, 0.62, 24]} /><meshPhysicalMaterial color="#1E2126" metalness={0.6} roughness={0.35} clearcoat={0.8} /></mesh>
            <mesh position={[0, -(R + 0.09), 0]}><cylinderGeometry args={[0.06, 0.06, 0.12, 20]} /><meshPhysicalMaterial color="#D9DEE5" metalness={1} roughness={0.2} /></mesh>
          </group>
          <Glow pos={[0, 0, -0.1]} size={2.2} color={C.mint} opacity={done * 0.25 + flash * 0.35 + pulse * 0.04} />
        </group>
      </group>
    </>
  );
};

export const ChecklistLogs: React.FC<MediaProps> = (p) => {
  const ready = useFontsReady();
  const D = doneAt(p.dur);
  return (
    <Win w={p.w} h={p.h} bg="#0A0A0C">
      {ready ? <ThreeStage width={p.w} height={p.h} exposure={1.05}><Scene {...p} /></ThreeStage> : null}
      <WinVignette strength={0.45} />
      <DoneLabel x={24} y={22} text="AUDIT LOGS" p={ramp(p.f, 2, 18)} done={ramp(p.f, D - 2, D + 8)} />
    </Win>
  );
};
