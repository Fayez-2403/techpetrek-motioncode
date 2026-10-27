// envCards (Railway, CONFIRMED BREACH): a slow orbit of frosted-glass ENV cards with redacted values. On each beat one more
// card is flagged: an orange ROTATE stamp lands and the glass turns amber, or the card flips to show a lock. Only a subset
// of the cards is ever flagged. Values are only "•••••" or "REDACTED". ILLUSTRATIVE (the card adds the tag).
import React, { useMemo } from 'react';
import * as THREE from 'three';
import type { MediaProps } from './types';
import { ThreeStage, Env, CamRig, type V3 } from '../three/stage';
import { C } from '../styles/theme';
import { F } from '../styles/typography';
import { clamp, dampedSpring, easeOutCubic, invLerp, lerp } from '../lib/anim';
import { hash, mulberry32 } from '../lib/rng';
import { Backdrop3D, BEAT, Glow, Win, WinVignette, canvasTex, fovFor, hit, roundedSlab, rr, tallness, useFontsReady } from './_stub';

const N = 7;
const OMEGA = (2 * Math.PI) / 2400;          // one revolution in 40 s: calm
const RX = 3.75, RZ = 2.7, CW = 2.4, CH = 1.48, CD = 0.07;
const KEYS = ['API_KEY', 'DATABASE_URL', 'JWT_SECRET', 'AI_PROVIDER_KEY', 'REDIS_URL', 'WEBHOOK_SECRET', 'S3_ACCESS_KEY'];
const VALUES = ['dots', 'redacted', 'dots', 'redacted', 'dots', 'redacted', 'dots'];
const TH0 = -0.1;
const theta = (i: number, f: number) => TH0 + (i / N) * Math.PI * 2 + OMEGA * f;
const wrap = (a: number) => ((((a + Math.PI) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) - Math.PI;

type Ev = { card: number; kind: 'stamp' | 'flip'; at: number };
/** which card gets flagged on which beat: the free card nearest the left-front / right-front slot at that beat */
function plan(): Ev[] {
  const ev: Ev[] = [];
  const used = new Set<number>();
  // frame 0 already shows the front card flagged (a microcut must read on its first frame)
  let c0 = 0, best = 9;
  for (let i = 0; i < N; i++) { const d = Math.abs(wrap(theta(i, 0))); if (d < best) { best = d; c0 = i; } }
  ev.push({ card: c0, kind: 'stamp', at: -999 }); used.add(c0);
  const kinds: Ev['kind'][] = ['stamp', 'flip', 'stamp', 'flip'];
  for (let k = 1; k <= kinds.length; k++) {
    const at = k * BEAT, target = k % 2 ? -0.9 : 0.9;
    let pick = -1; best = 9;
    for (let i = 0; i < N; i++) { if (used.has(i)) continue; const d = Math.abs(wrap(theta(i, at) - target)); if (d < best) { best = d; pick = i; } }
    used.add(pick); ev.push({ card: pick, kind: kinds[k - 1], at });
  }
  return ev;
}
const PLAN = plan();

function faceTex(key: string, value: string) {
  return canvasTex(1024, 632, (g, W, H) => {
    g.clearRect(0, 0, W, H);
    const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, 'rgba(255,255,255,0.16)'); gr.addColorStop(1, 'rgba(255,255,255,0.04)');
    rr(g, 6, 6, W - 12, H - 12, 46); g.fillStyle = gr; g.fill();
    g.lineWidth = 3; g.strokeStyle = 'rgba(255,255,255,0.38)'; g.stroke();
    // soft diagonal sheen (fake reflection band)
    g.save(); rr(g, 6, 6, W - 12, H - 12, 46); g.clip();
    const sh = g.createLinearGradient(0, 0, W * 0.6, H); sh.addColorStop(0, 'rgba(255,255,255,0.13)'); sh.addColorStop(0.35, 'rgba(255,255,255,0.03)'); sh.addColorStop(0.36, 'rgba(255,255,255,0)'); sh.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = sh; g.fillRect(0, 0, W, H); g.restore();
    // header
    g.fillStyle = 'rgba(236,239,244,0.75)'; g.beginPath(); g.arc(74, 84, 11, 0, Math.PI * 2); g.fill();
    g.font = `700 34px ${F.mono}`; g.textBaseline = 'middle'; g.fillText('ENV', 100, 86);
    g.font = `600 28px ${F.mono}`; g.textAlign = 'right'; g.fillStyle = 'rgba(236,239,244,0.55)'; g.fillText('SECRET', W - 70, 86); g.textAlign = 'left';
    // key name (shrink to fit)
    let size = 86; g.font = `800 ${size}px ${F.mono}`;
    while (g.measureText(key).width > W - 140 && size > 40) { size -= 2; g.font = `800 ${size}px ${F.mono}`; }
    g.fillStyle = '#F4F6FA'; g.fillText(key, 70, 228);
    // value pill
    rr(g, 62, 312, W - 124, 136, 30); g.fillStyle = 'rgba(6,7,10,0.62)'; g.fill(); g.lineWidth = 2.5; g.strokeStyle = 'rgba(255,255,255,0.20)'; g.stroke();
    g.fillStyle = 'rgba(236,239,244,0.62)'; g.font = `700 54px ${F.mono}`; g.fillText('=', 100, 382);
    if (value === 'dots') { g.fillStyle = '#E9EDF3'; g.font = `800 64px ${F.mono}`; g.fillText('•••••••••••', 170, 384); }
    else { g.fillStyle = '#E9EDF3'; g.font = `800 56px ${F.mono}`; g.fillText('REDACTED', 170, 384); }
    // metadata hairlines
    g.fillStyle = 'rgba(255,255,255,0.16)'; rr(g, 70, 516, 230, 16, 8); g.fill(); rr(g, 320, 516, 150, 16, 8); g.fill(); rr(g, W - 230, 516, 160, 16, 8); g.fill();
  });
}
function lockTex() {
  return canvasTex(1024, 632, (g, W, H) => {
    g.clearRect(0, 0, W, H);
    const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, 'rgba(255,255,255,0.16)'); gr.addColorStop(1, 'rgba(255,255,255,0.05)');
    rr(g, 6, 6, W - 12, H - 12, 46); g.fillStyle = gr; g.fill(); g.lineWidth = 3; g.strokeStyle = 'rgba(255,255,255,0.4)'; g.stroke();
    const cx = W / 2, cy = 282;
    g.lineWidth = 30; g.strokeStyle = '#EEF1F6'; g.lineCap = 'round';
    g.beginPath(); g.arc(cx, cy - 46, 74, Math.PI, 0); g.lineTo(cx + 74, cy + 10); g.moveTo(cx - 74, cy - 46); g.lineTo(cx - 74, cy + 10); g.stroke();
    rr(g, cx - 128, cy, 256, 196, 34); g.fillStyle = '#EEF1F6'; g.fill();
    g.fillStyle = '#20232B'; g.beginPath(); g.arc(cx, cy + 82, 24, 0, Math.PI * 2); g.fill(); rr(g, cx - 10, cy + 92, 20, 56, 8); g.fill();
    g.font = `800 46px ${F.mono}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = 'rgba(236,239,244,0.75)'; g.fillText('•••••', cx, 548);
  });
}
function stampTex() {
  return canvasTex(640, 240, (g, W, H) => {
    g.clearRect(0, 0, W, H);
    g.strokeStyle = C.alert; g.lineWidth = 16; rr(g, 14, 14, W - 28, H - 28, 26); g.stroke();
    g.fillStyle = C.alert; g.font = `900 132px ${F.head}`; (g as unknown as { fontStretch: string }).fontStretch = 'condensed';
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('ROTATE', W / 2, H / 2 + 6);
    // ink texture: knock out a few deterministic specks
    const r = mulberry32(77); g.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < 260; i++) { g.globalAlpha = 0.25 + r() * 0.5; g.beginPath(); g.arc(r() * W, r() * H, 0.8 + r() * 2.6, 0, Math.PI * 2); g.fill(); }
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  });
}

const Scene: React.FC<MediaProps> = ({ w, h, f }) => {
  const res = useMemo(() => {
    const slab = roundedSlab(CW, CH, CD, 0.14, 0.03);
    const plane = new THREE.PlaneGeometry(CW * 0.985, CH * 0.985);
    const faces = KEYS.map((k, i) => faceTex(k, VALUES[i]));
    const lock = lockTex(), stamp = stampTex();
    const glass = KEYS.map(() => new THREE.MeshPhysicalMaterial({ color: '#DCE4F0', metalness: 0, roughness: 0.3, transmission: 1, thickness: 0.35, ior: 1.42,
      specularIntensity: 1, clearcoat: 0.6, clearcoatRoughness: 0.15, envMapIntensity: 1.1, attenuationColor: new THREE.Color('#BFD0E6'), attenuationDistance: 2.5 }));
    const faceMats = faces.map((t) => new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, toneMapped: false }));
    const backMat = new THREE.MeshBasicMaterial({ map: lock, transparent: true, depthWrite: false, toneMapped: false });
    const stampMats = KEYS.map(() => new THREE.MeshBasicMaterial({ map: stamp, transparent: true, depthWrite: false, toneMapped: false }));
    // dust for depth
    const rnd = mulberry32(9), P = 140, pos = new Float32Array(P * 3);
    for (let i = 0; i < P; i++) { pos[i * 3] = (rnd() - 0.5) * 16; pos[i * 3 + 1] = (rnd() - 0.5) * 8; pos[i * 3 + 2] = -6 + rnd() * 9; }
    const dust = new THREE.BufferGeometry(); dust.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return { slab, plane, faceMats, backMat, stampMats, glass, dust };
  }, []);

  const tall = tallness(w, h);
  const fov = fovFor(w, h, 29);
  const camPos: V3 = [Math.sin(f * 0.0045) * 0.45, 2.7 + Math.sin(f * 0.003) * 0.12, 10.2];
  const target: V3 = [0, 0.32 - tall * 0.1, 0];
  const amber = new THREE.Color('#FFB443'), base = new THREE.Color('#DCE4F0');

  return (
    <>
      <CamRig pos={camPos} target={target} fov={fov} />
      <Env intensity={0.75} />
      <Backdrop3D top="#1A1C22" bottom="#0A0B0E" glowA="#4A220E" dirA={[0.5, 0.3, -1]} powA={7} glowB="#16202E" dirB={[-0.6, 0.25, -1]} powB={4} />
      <ambientLight intensity={0.25} />
      <directionalLight position={[-4, 6, 7]} intensity={1.6} color="#F2F5FF" />
      <pointLight position={[3.5, 1.8, -3]} intensity={40} distance={14} color="#FF7A3D" />
      <points geometry={res.dust}>
        <pointsMaterial size={0.035} color="#C9D3E3" transparent opacity={0.35} depthWrite={false} blending={THREE.AdditiveBlending} sizeAttenuation toneMapped={false} />
      </points>
      {KEYS.map((_, i) => {
        const th = theta(i, f);
        const bob = Math.sin(f * 0.033 + i * 1.7) * 0.07;
        const x = RX * Math.sin(th), z = RZ * Math.cos(th) - 0.3, y = -0.42 * Math.cos(th) + 0.42 + bob;
        const yaw = Math.atan2(x - camPos[0], camPos[2] - z) * 0.72 - 0.22 * Math.sin(th);
        const pitch = -Math.atan2(camPos[1] - y, camPos[2] - z) * 0.55;
        const ev = PLAN.find((e) => e.card === i);
        const stampP = ev && ev.kind === 'stamp' ? (ev.at < 0 ? 1 : clamp(dampedSpring((f - ev.at + 4) / 60, 15, 0.5), 0, 1.2)) : 0;
        const stampA = ev && ev.kind === 'stamp' ? (ev.at < 0 ? 1 : clamp((f - ev.at + 4) / 4)) : 0;
        const flipP = ev && ev.kind === 'flip' ? dampedSpring((f - ev.at + 16) / 60, 11, 0.62) : 0;
        const amberT = ev && ev.kind === 'stamp' ? (ev.at < 0 ? 1 : easeOutCubic(invLerp(ev.at - 2, ev.at + 10, f))) : 0;
        const g = res.glass[i];
        g.color.copy(base).lerp(amber, amberT * 0.62);
        g.emissive.set(ev?.kind === 'flip' ? '#9FB8E0' : C.alert); g.emissiveIntensity = amberT * 0.1 + (ev && ev.at > 0 ? hit(f, ev.at, 10) * (ev.kind === 'flip' ? 0.22 : 0.35) : 0);
        res.faceMats[i].color.setRGB(1, lerp(1, 0.9, amberT), lerp(1, 0.8, amberT));
        const s = stampP > 0 ? lerp(1.9, 1, Math.min(stampP, 1.15)) : 1;
        res.stampMats[i].opacity = stampA * 0.96;
        const flash = ev && ev.at > 0 ? hit(f, ev.at, 12) : 0;
        return (
          <group key={i} position={[x, y, z]} rotation={[pitch, yaw, Math.sin(f * 0.02 + i) * 0.025]}>
            <group rotation={[0, flipP * Math.PI, 0]}>
              <mesh geometry={res.slab} material={g} />
              <mesh geometry={res.plane} material={res.faceMats[i]} position={[0, 0, CD / 2 + 0.004]} />
              <mesh geometry={res.plane} material={res.backMat} position={[0, 0, -CD / 2 - 0.004]} rotation={[0, Math.PI, 0]} />
              {stampA > 0 ? (
                <mesh material={res.stampMats[i]} position={[CW * 0.12, -CH * 0.05, CD / 2 + 0.012]} rotation={[0, 0, 0.17]} scale={[s, s, 1]}>
                  <planeGeometry args={[CW * 0.62, CW * 0.62 * (240 / 640)]} />
                </mesh>
              ) : null}
            </group>
            {flash > 0.01 ? <Glow pos={[0, 0, 0.3]} size={3.2} color={ev?.kind === 'flip' ? '#BFD6FF' : C.alert} opacity={flash * 0.42} /> : null}
          </group>
        );
      })}
    </>
  );
};

export const EnvCards: React.FC<MediaProps> = (p) => {
  const ready = useFontsReady();
  return (
    <Win w={p.w} h={p.h} bg="#0E0F12">
      {ready ? <ThreeStage width={p.w} height={p.h} exposure={1.05} fog={['#0C0D10', 10, 19]}><Scene {...p} /></ThreeStage> : null}
      <WinVignette strength={0.42} />
    </Win>
  );
};
