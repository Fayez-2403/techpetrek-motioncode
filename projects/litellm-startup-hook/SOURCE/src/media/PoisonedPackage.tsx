// poisonedPackage (CERT-In on LiteLLM 1.107.0): a shelf of a generic package registry (no real registry UI or logos). One
// frosted package crate, "llm-gateway", has a version tag 1.107.0 glowing red; a hidden module inside quietly siphons small
// credential tokens (icons only: cloud, CI, key, AI tool) out along a thin line. Then the crate is pulled off the shelf
// (PULLED) and a mint ROTATE CREDENTIALS plate settles on the beat. ILLUSTRATIVE.
import React, { useMemo } from 'react';
import * as THREE from 'three';
import type { MediaProps } from './types';
import { ThreeStage, Env, CamRig, type V3 } from '../three/stage';
import { C } from '../styles/theme';
import { F } from '../styles/typography';
import { clamp, dampedSpring, easeInCubic, easeInOutCubic, easeOutCubic, invLerp, lerp } from '../lib/anim';
import { hash } from '../lib/rng';
import { Backdrop3D, BEAT, ContactShadow, Glow, Win, WinVignette, canvasTex, everyBeat, fovFor, hit, roundedSlab, rr, tallness, useFontsReady } from './_stub';

const BW = 1.55, BH = 1.2, BD = 1.15;          // crate size
const XS = [-4.2, -2.1, 0, 2.1, 4.2];
/** plate lands on a beat; the crate is pulled half a beat before */
const plateAt = (dur: number) => BEAT * (1 + clamp(Math.floor((dur - 40) / 60), 1, 3));

function labelTex(name: string | null, seed: number) {
  return canvasTex(512, 300, (g, W, H) => {
    g.clearRect(0, 0, W, H);
    rr(g, 6, 6, W - 12, H - 12, 22); g.fillStyle = '#EFE9DD'; g.fill();
    g.strokeStyle = 'rgba(18,18,18,0.18)'; g.lineWidth = 3; g.stroke();
    // package glyph (isometric cube)
    const cx = 74, cy = 92, s = 38;
    g.strokeStyle = '#2A2824'; g.lineWidth = 7; g.lineJoin = 'round';
    g.beginPath(); g.moveTo(cx, cy - s); g.lineTo(cx + s, cy - s / 2); g.lineTo(cx + s, cy + s / 2); g.lineTo(cx, cy + s); g.lineTo(cx - s, cy + s / 2); g.lineTo(cx - s, cy - s / 2); g.closePath(); g.stroke();
    g.beginPath(); g.moveTo(cx - s, cy - s / 2); g.lineTo(cx, cy); g.lineTo(cx + s, cy - s / 2); g.moveTo(cx, cy); g.lineTo(cx, cy + s); g.stroke();
    if (name) {
      g.fillStyle = '#121212'; g.font = `800 50px ${F.mono}`; g.textBaseline = 'middle'; g.fillText(name, 136, 94);
      g.fillStyle = 'rgba(18,18,18,0.5)'; g.font = `600 30px ${F.mono}`; g.fillText('package', 138, 146);
    } else {
      g.fillStyle = 'rgba(18,18,18,0.55)';
      rr(g, 136, 76, 150 + hash(seed, 1) * 160, 34, 10); g.fill();
      g.fillStyle = 'rgba(18,18,18,0.22)'; rr(g, 136, 132, 120 + hash(seed, 2) * 80, 22, 8); g.fill();
    }
    g.fillStyle = 'rgba(18,18,18,0.16)';
    for (let i = 0; i < 3; i++) { rr(g, 40, 206 + i * 26, 180 + hash(seed, i + 5) * 220, 12, 6); g.fill(); }
  });
}
function tagTex(text: string | null) {
  return canvasTex(400, 180, (g, W, H) => {
    g.clearRect(0, 0, W, H);
    g.beginPath(); g.moveTo(60, 10); g.lineTo(W - 14, 10); g.arcTo(W - 6, 10, W - 6, 30, 16); g.lineTo(W - 6, H - 26); g.arcTo(W - 6, H - 10, W - 26, H - 10, 16);
    g.lineTo(60, H - 10); g.lineTo(8, H / 2); g.closePath();
    g.fillStyle = text ? '#1A0C0A' : 'rgba(40,42,48,0.95)'; g.fill(); g.lineWidth = 6; g.strokeStyle = text ? '#FF3B2F' : 'rgba(150,155,165,0.6)'; g.stroke();
    g.fillStyle = text ? '#0B0B0D' : '#15161A'; g.beginPath(); g.arc(48, H / 2, 11, 0, Math.PI * 2); g.fill();
    if (text) { g.fillStyle = '#FF6B5E'; g.font = `800 64px ${F.mono}`; g.textBaseline = 'middle'; g.textAlign = 'center'; g.fillText(text, W / 2 + 28, H / 2 + 3); }
    else { g.fillStyle = 'rgba(150,155,165,0.55)'; rr(g, 110, H / 2 - 10, 190, 20, 9); g.fill(); }
  });
}
type Icon = 'cloud' | 'ci' | 'key' | 'ai';
function iconTex(kind: Icon) {
  return canvasTex(128, 128, (g, W) => {
    g.clearRect(0, 0, W, W);
    g.beginPath(); g.arc(64, 64, 58, 0, Math.PI * 2); g.fillStyle = 'rgba(255,244,232,0.98)'; g.fill();
    g.strokeStyle = '#2A1410'; g.fillStyle = '#2A1410'; g.lineWidth = 9; g.lineCap = 'round'; g.lineJoin = 'round';
    if (kind === 'cloud') { g.beginPath(); g.arc(50, 70, 16, Math.PI * 0.5, Math.PI * 1.5); g.arc(66, 54, 20, Math.PI, Math.PI * 1.95); g.arc(84, 68, 14, Math.PI * 1.5, Math.PI * 0.5); g.closePath(); g.fill(); }
    if (kind === 'ci') { g.beginPath(); g.arc(64, 64, 26, 0.3, Math.PI * 1.7); g.stroke(); g.beginPath(); g.moveTo(88, 46); g.lineTo(92, 64); g.lineTo(76, 60); g.fill(); }
    if (kind === 'key') { g.beginPath(); g.arc(48, 64, 15, 0, Math.PI * 2); g.stroke(); g.beginPath(); g.moveTo(63, 64); g.lineTo(96, 64); g.moveTo(86, 64); g.lineTo(86, 78); g.moveTo(76, 64); g.lineTo(76, 74); g.stroke(); }
    if (kind === 'ai') { const st = (x: number, y: number, r: number) => { g.beginPath(); g.moveTo(x, y - r); g.quadraticCurveTo(x, y, x + r, y); g.quadraticCurveTo(x, y, x, y + r); g.quadraticCurveTo(x, y, x - r, y); g.quadraticCurveTo(x, y, x, y - r); g.fill(); }; st(58, 68, 30); st(88, 40, 13); }
  });
}
function stampTex(text: string, color: string, w = 620, h = 200) {
  return canvasTex(w, h, (g, W, H) => {
    g.clearRect(0, 0, W, H);
    g.strokeStyle = color; g.lineWidth = 14; rr(g, 12, 12, W - 24, H - 24, 24); g.stroke();
    g.fillStyle = color; g.font = `900 124px ${F.head}`; (g as unknown as { fontStretch: string }).fontStretch = 'condensed';
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, W / 2, H / 2 + 6);
  });
}
function plateTex() {
  return canvasTex(1100, 220, (g, W, H) => {
    g.clearRect(0, 0, W, H);
    rr(g, 8, 8, W - 16, H - 16, 40); g.fillStyle = 'rgba(8,22,17,0.92)'; g.fill(); g.lineWidth = 6; g.strokeStyle = C.mintSoft; g.stroke();
    // rotate icon
    const cx = 110, cy = H / 2;
    g.strokeStyle = C.mintSoft; g.lineWidth = 13; g.lineCap = 'round';
    g.beginPath(); g.arc(cx, cy, 40, -0.9, Math.PI * 1.35); g.stroke();
    g.fillStyle = C.mintSoft; g.beginPath(); g.moveTo(cx + 42, cy - 66); g.lineTo(cx + 52, cy - 22); g.lineTo(cx + 10, cy - 34); g.closePath(); g.fill();
    g.fillStyle = '#EFFFF7'; (g as unknown as { fontStretch: string }).fontStretch = 'semi-condensed';
    let fs = 92; g.font = `800 ${fs}px ${F.head}`;
    while (g.measureText('ROTATE CREDENTIALS').width > W - 250 && fs > 50) { fs -= 2; g.font = `800 ${fs}px ${F.head}`; }
    g.textBaseline = 'middle'; g.fillText('ROTATE CREDENTIALS', 196, cy + 4);
  });
}

function panelTex() {
  return canvasTex(1024, 256, (g, W, H) => {
    g.fillStyle = '#16171A'; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 5; i++) {
      const x = W / 2 + (i - 2) * (W * 2.1 / 14);
      const gr = g.createRadialGradient(x, H * 0.62, 4, x, H * 0.62, W * 0.085);
      gr.addColorStop(0, i === 2 ? 'rgba(120,70,60,0.85)' : 'rgba(110,104,96,0.7)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.fillRect(0, 0, W, H);
    }
    const v = g.createLinearGradient(0, 0, 0, H); v.addColorStop(0, 'rgba(0,0,0,0.55)'); v.addColorStop(0.4, 'rgba(0,0,0,0)');
    g.fillStyle = v; g.fillRect(0, 0, W, H);
  });
}
const PATH = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 1.08, 0.0), new THREE.Vector3(0.25, 1.42, -0.1), new THREE.Vector3(1.2, 1.78, -0.3), new THREE.Vector3(2.6, 2.0, -0.5), new THREE.Vector3(5.0, 2.3, -0.8)]);
const ICONS: Icon[] = ['key', 'cloud', 'ci', 'ai'];

const Scene: React.FC<MediaProps> = ({ w, h, f, dur }) => {
  const P = plateAt(dur), PULL = P - 15;
  const res = useMemo(() => {
    const crate = roundedSlab(BW, BH, BD, 0.1, 0.035);
    const shelf = roundedSlab(13, 0.16, 1.9, 0.04, 0.02);
    const mod = roundedSlab(0.3, 0.3, 0.3, 0.05, 0.02, 2);
    const labels = XS.map((_, i) => labelTex(i === 2 ? 'litellm' : null, i + 3));
    const tags = [tagTex(null), tagTex('1.107.0')];
    const icons = ICONS.map(iconTex);
    const pulled = stampTex('PULLED', '#FF4A36');
    const plate = plateTex();
    const tube = new THREE.TubeGeometry(PATH, 120, 0.014, 6, false);
    const plateGeo = roundedSlab(4.3, 0.86, 0.08, 0.2, 0.03);
    const box = new THREE.BoxGeometry(BW, BH, BD);
    const lid = new THREE.BoxGeometry(BW + 0.04, 0.045, BD + 0.04);
    const paper = new THREE.MeshStandardMaterial({ color: '#D6CCB8', roughness: 0.8, metalness: 0, side: THREE.DoubleSide });
    const hidden = new THREE.MeshBasicMaterial({ visible: false });
    const inner = new THREE.MeshStandardMaterial({ color: '#B9AE99', roughness: 0.9, side: THREE.DoubleSide });
    const boxMat = [paper, paper, paper, paper, paper, paper];
    const boxMatBad = [paper, paper, hidden, paper, paper, paper];
    const panel = panelTex();
    return { crate, shelf, mod, labels, tags, icons, pulled, plate, tube, plateGeo, panel, box, lid, boxMat, boxMatBad, paper, inner };
  }, []);

  // ---- the poisoned crate: pulled off the shelf ----
  const pull = easeInOutCubic(invLerp(PULL - 8, PULL + 16, f));
  const gone = pull >= 0.999;
  const cratePos: V3 = [0, BH / 2 + pull * 2.6 + Math.sin(pull * Math.PI) * 0.15, -pull * 1.6];
  const crateRot: V3 = [-pull * 0.25, pull * 0.18, pull * 0.08];
  const crateOp = 1 - easeInCubic(invLerp(PULL + 2, PULL + 16, f));
  const pulse = everyBeat(f, 12);
  const lidOpen = 0.3 + pulse * 0.03;
  // siphon: tokens leave the hidden module along the line until the crate is pulled; the line retracts after
  const cut = PULL - 6;
  const lineOp = 1 - easeOutCubic(invLerp(cut, cut + 16, f));
  const tokens: { u: number; k: number }[] = [];
  for (let k = -12; k < 60; k++) {
    const t0 = k * 8; if (t0 > cut) break;
    const u = (f - t0) / 74;
    if (u >= 0 && u <= 1) tokens.push({ u, k });
  }
  const pulledP = dampedSpring((f - PULL) / 60, 16, 0.5);
  const plateP = Math.min(1.025, dampedSpring((f - (P - 14)) / 60, 17, 0.7));

  const tall = tallness(w, h);
  const fov = fovFor(w, h, 30);
  const camPos: V3 = [Math.sin(f * 0.004) * 0.3 - 0.35, 1.5 + tall * 0.2, 7.5 - Math.min(f, 240) * 0.002];
  const target: V3 = [0.3, 0.74 - tall * 0.12, 0];

  return (
    <>
      <CamRig pos={camPos} target={target} fov={fov} />
      <Env intensity={0.6} />
      <Backdrop3D top="#1B1C21" bottom="#0B0C0E" glowA="#3A1410" dirA={[0.45, 0.35, -1]} powA={6} glowB="#14241F" dirB={[-0.4, -0.1, -1]} powB={5} />
      <ambientLight intensity={0.32} />
      <directionalLight position={[-3, 7, 6]} intensity={1.35} color="#FFF1E2" />
      <directionalLight position={[5, 2, -4]} intensity={0.6} color="#A8BEDF" />
      {/* shelves */}
      <mesh geometry={res.shelf} position={[0, -0.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <meshPhysicalMaterial color="#24262C" roughness={0.42} metalness={0.6} clearcoat={0.5} />
      </mesh>
      <mesh position={[0, -0.12, 0.96]}><boxGeometry args={[13, 0.2, 0.04]} /><meshStandardMaterial color="#30333A" metalness={0.7} roughness={0.35} /></mesh>
      <mesh position={[0, 0.0, 0.985]}><boxGeometry args={[13, 0.012, 0.01]} /><meshBasicMaterial color="#FFE7CC" toneMapped={false} /></mesh>
      <mesh position={[0, 1.15, -1.0]}>
        <planeGeometry args={[14, 3.4]} />
        <meshBasicMaterial map={res.panel} toneMapped={false} />
      </mesh>
      <mesh position={[0, 2.85, -0.4]}><boxGeometry args={[13, 0.08, 1.4]} /><meshStandardMaterial color="#121316" metalness={0.5} roughness={0.5} /></mesh>
      <mesh position={[0, 2.8, 0.31]}><boxGeometry args={[12.6, 0.018, 0.03]} /><meshBasicMaterial color="#FFEBD6" toneMapped={false} /></mesh>
      {/* crates */}
      {XS.map((x, i) => {
        const bad = i === 2;
        if (bad && gone) return null;
        const pos: V3 = bad ? cratePos : [x, BH / 2, 0];
        const rot: V3 = bad ? crateRot : [0, (hash(i, 4) - 0.5) * 0.12, 0];
        const sway = Math.sin(f * 0.05 + i) * 0.06;
        return (
          <group key={i} position={pos} rotation={rot}>
            <mesh geometry={res.box} material={bad ? res.boxMatBad : res.boxMat} />
            <group position={[0, BH / 2, -BD / 2]} rotation={[bad ? -lidOpen : 0, 0, 0]}>
              <mesh geometry={res.lid} material={bad ? res.boxMatBad : res.boxMat} position={[0, 0.02, BD / 2]} />
            </group>
            {bad ? (
              <group position={[0, BH / 2 - 0.12, -0.05]}>
                <mesh geometry={res.mod} scale={[1.3, 0.6, 1.3]}>
                  <meshStandardMaterial color="#1A1112" roughness={0.35} metalness={0.6} emissive="#FF2A1F" emissiveIntensity={0.6 + pulse * 0.8} transparent={crateOp < 1} opacity={crateOp} />
                </mesh>
                <Glow pos={[0, 0.2, 0.25]} size={1.7} color="#FF3B2F" opacity={(0.42 + pulse * 0.35) * crateOp} />
                <Glow pos={[0, 0.1, 0.1]} size={0.8} color="#FF6A50" opacity={(0.5 + pulse * 0.3) * crateOp} />
              </group>
            ) : null}
            {/* paper label + hanging version tag */}
            <mesh position={[-0.22, -0.26, BD / 2 + 0.006]}>
              <planeGeometry args={[0.98, 0.98 * (300 / 512)]} />
              <meshBasicMaterial map={res.labels[i]} transparent opacity={bad ? crateOp : 0.95} depthWrite={false} />
            </mesh>
            <group position={[0.42, BH / 2 - 0.12, BD / 2 + 0.03]} rotation={[0, 0, -0.1 + sway * 0.4]}>
              <mesh position={[0.0, -0.26, 0]} >
                <planeGeometry args={[0.96, 0.96 * (180 / 400)]} />
                <meshBasicMaterial map={res.tags[bad ? 1 : 0]} transparent opacity={bad ? crateOp : 0.9} depthWrite={false} toneMapped={!bad} />
              </mesh>
              {bad ? <Glow pos={[0.02, -0.26, 0.06]} size={1.5} color="#FF2E22" opacity={(0.32 + pulse * 0.4) * crateOp} /> : null}
            </group>
            <ContactShadow pos={[0, -BH / 2 + 0.003, 0]} sx={BW * 1.5} sz={BD * 1.6} opacity={bad ? 0.5 * (1 - pull) : 0.5} />
          </group>
        );
      })}
      {/* siphon line + tokens */}
      {lineOp > 0.01 ? (
        <mesh geometry={res.tube} position={[0, 0, 0]}>
          <meshBasicMaterial color="#FF4A36" transparent opacity={0.75 * lineOp} toneMapped={false} depthWrite={false} />
        </mesh>
      ) : null}
      {tokens.map(({ u, k }) => {
        const p = PATH.getPointAt(easeInOutCubic(u) * 0.97 + 0.02);
        const s = 0.32 * clamp(u * 6) * (1 - 0.25 * u);
        const pos: V3 = [p.x, p.y, p.z];
        return (
          <group key={k}>
            <sprite position={pos} scale={[s, s, s]}>
              <spriteMaterial map={res.icons[((k % 4) + 4) % 4]} transparent opacity={lineOp} depthWrite={false} toneMapped={false} />
            </sprite>
            <Glow pos={pos} size={s * 3.2} color="#FF7A5A" opacity={0.5 * lineOp} />
          </group>
        );
      })}
      {/* PULLED stamp in the empty slot */}
      {f >= PULL ? (
        <mesh position={[0, BH * 0.55, 0.1]} rotation={[0, 0, -0.08]} scale={[lerp(1.8, 1, clamp(pulledP, 0, 1.1)), lerp(1.8, 1, clamp(pulledP, 0, 1.1)), 1]}>
          <planeGeometry args={[1.75, 1.75 * (200 / 620)]} />
          <meshBasicMaterial map={res.pulled} transparent opacity={clamp((f - PULL) / 4)} depthWrite={false} toneMapped={false} />
        </mesh>
      ) : null}
      {f >= PULL ? <Glow pos={[0, BH * 0.55, 0.3]} size={3.5} color="#FF4A36" opacity={hit(f, PULL, 12) * 0.5} /> : null}
      {f >= PULL ? (
        <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[BW + 0.1, BD + 0.1]} />
          <meshBasicMaterial color="#FF4A36" transparent opacity={0.08 * clamp((f - PULL) / 10)} depthWrite={false} toneMapped={false} />
        </mesh>
      ) : null}
      {/* the mint plate */}
      {f >= P - 14 ? (
        <group position={[0, lerp(3.4, 0.08, plateP), 1.5]} rotation={[-0.08, 0, 0]}>
          <mesh geometry={res.plateGeo}>
            <meshPhysicalMaterial color="#0E2A21" roughness={0.25} metalness={0.2} clearcoat={1} transparent opacity={0.85} />
          </mesh>
          <mesh position={[0, 0, 0.046]}>
            <planeGeometry args={[4.3, 4.3 * (220 / 1100)]} />
            <meshBasicMaterial map={res.plate} transparent depthWrite={false} toneMapped={false} />
          </mesh>
          <Glow pos={[0, 0, -0.2]} size={5} color={C.mint} opacity={0.22 + hit(f, P, 14) * 0.4} />
        </group>
      ) : null}
    </>
  );
};

export const PoisonedPackage: React.FC<MediaProps> = (p) => {
  const ready = useFontsReady();
  return (
    <Win w={p.w} h={p.h} bg="#0D0E11">
      {ready ? <ThreeStage width={p.w} height={p.h} exposure={1.05} fog={['#0C0D10', 11, 20]}><Scene {...p} /></ThreeStage> : null}
      <WinVignette strength={0.45} />
    </Win>
  );
};
