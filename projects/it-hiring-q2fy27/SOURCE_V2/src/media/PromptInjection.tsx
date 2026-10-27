// promptInjection (Copilot research, SECURITY RESEARCH): a generic editor (our own styling, no product UI) shows a README.
// An assistant orb reads it line by line; one line is a hidden instruction, shown only as a redacted bar (no payload). When
// the read head reaches it, the beam turns orange, and the assistant's suggestion path branches: the expected route fades
// to a dashed ghost while the real one veers off and turns red. On-graphic label: SECURITY RESEARCH. ILLUSTRATIVE.
import React, { useLayoutEffect, useMemo } from 'react';
import * as THREE from 'three';
import type { MediaProps } from './types';
import { ThreeStage, Env, CamRig, type V3 } from '../three/stage';
import { C } from '../styles/theme';
import { F } from '../styles/typography';
import { clamp, dampedSpring, easeInOutCubic, easeOutCubic, invLerp, lerp } from '../lib/anim';
import { Backdrop3D, BEAT, Glow, Label, Win, WinVignette, canvasTex, everyBeat, fovFor, hit, ramp, roundedSlab, rr, tallness, useFontsReady } from './_stub';

const TW = 1600, TH = 1056, L0 = 168, LH = 80, HID = 6;
const LINES: (string | null)[] = ['# Project setup', '', 'Install the dependencies, then start', 'the dev server:', '  npm install', '  npm run dev', null, '## Usage', 'See the docs folder for details.', ''];
const EW = 4.75, EH = EW * (TH / TW);
const lineY = (i: number) => EH / 2 - ((L0 + i * LH) / TH) * EH;     // local y of line i (text middle)

function editorTex() {
  return canvasTex(TW, TH, (g, W, H) => {
    g.clearRect(0, 0, W, H);
    rr(g, 4, 4, W - 8, H - 8, 34); g.fillStyle = 'rgba(16,18,23,0.97)'; g.fill();
    g.lineWidth = 3; g.strokeStyle = 'rgba(255,255,255,0.12)'; g.stroke();
    // title strip
    g.save(); rr(g, 4, 4, W - 8, H - 8, 34); g.clip(); g.fillStyle = 'rgba(255,255,255,0.045)'; g.fillRect(0, 0, W, 96); g.restore();
    ['#4A4E58', '#4A4E58', '#4A4E58'].forEach((c, i) => { g.fillStyle = c; g.beginPath(); g.arc(52 + i * 34, 48, 10, 0, Math.PI * 2); g.fill(); });
    rr(g, 170, 20, 300, 76, 14); g.fillStyle = 'rgba(255,255,255,0.07)'; g.fill();
    g.fillStyle = '#C9CFDA'; g.font = `700 36px ${F.mono}`; g.textBaseline = 'middle'; g.fillText('README.md', 196, 58);
    // gutter + lines
    LINES.forEach((t, i) => {
      const y = L0 + i * LH;
      g.fillStyle = 'rgba(160,168,182,0.45)'; g.font = `600 34px ${F.mono}`; g.textAlign = 'right'; g.fillText(String(i + 1), 104, y); g.textAlign = 'left';
      if (t === null) {
        rr(g, 150, y - 30, 880, 60, 12); g.fillStyle = '#07080A'; g.fill();
        g.save(); rr(g, 150, y - 30, 880, 60, 12); g.clip();
        g.strokeStyle = 'rgba(255,90,31,0.22)'; g.lineWidth = 10; for (let x = 120; x < 1070; x += 34) { g.beginPath(); g.moveTo(x, y + 40); g.lineTo(x + 60, y - 40); g.stroke(); }
        g.restore();
        rr(g, 150, y - 30, 880, 60, 12); g.lineWidth = 3; g.strokeStyle = 'rgba(255,90,31,0.7)'; g.stroke();
        g.fillStyle = C.alert; g.font = `800 30px ${F.mono}`; g.fillText('HIDDEN INSTRUCTION', 1060, y + 2);
        return;
      }
      if (!t) return;
      const h1 = t.startsWith('#');
      g.font = `${h1 ? 800 : 600} ${h1 ? 44 : 40}px ${F.mono}`;
      g.fillStyle = h1 ? '#EEF1F6' : t.startsWith('  ') ? '#9FD9C2' : '#AEB5C2';
      g.fillText(t, 150, y + 2);
    });
  });
}
function beamTex() {
  return canvasTex(64, 256, (g, W, H) => {
    const v = g.createLinearGradient(0, 0, 0, H); v.addColorStop(0, 'rgba(255,255,255,0.95)'); v.addColorStop(1, 'rgba(255,255,255,0.05)');
    g.fillStyle = v; g.fillRect(0, 0, W, H);
    g.globalCompositeOperation = 'destination-in';
    const hz = g.createLinearGradient(0, 0, W, 0); hz.addColorStop(0, 'rgba(0,0,0,0)'); hz.addColorStop(0.5, 'rgba(0,0,0,1)'); hz.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = hz; g.fillRect(0, 0, W, H);
  });
}

// editor transform (world): position + yaw; lines map through it
const EPOS: V3 = [-1.55, 0.32, 0], EYAW = 0.15;
const onEditor = (lx: number, ly: number, lz = 0.02): THREE.Vector3 => new THREE.Vector3(lx, ly, lz).applyAxisAngle(new THREE.Vector3(0, 1, 0), EYAW).add(new THREE.Vector3(...EPOS));
const ORB = new THREE.Vector3(2.15, 1.55, 0.9);
const BRANCH = new THREE.Vector3(3.15, 0.55, 0.75);
const PATH_A = new THREE.CatmullRomCurve3([ORB.clone(), new THREE.Vector3(2.55, 1.15, 0.85), BRANCH.clone()]);
const PATH_GHOST = new THREE.CatmullRomCurve3([BRANCH.clone(), new THREE.Vector3(3.7, 0.4, 0.7), new THREE.Vector3(4.35, 0.32, 0.6)]);
const PATH_B = new THREE.CatmullRomCurve3([BRANCH.clone(), new THREE.Vector3(3.35, 0.0, 0.8), new THREE.Vector3(3.0, -0.75, 0.95), new THREE.Vector3(2.35, -1.2, 1.05)]);

const Tube: React.FC<{ geo: THREE.TubeGeometry; p: number; color: THREE.Color | string; opacity?: number; segs: number }> = ({ geo, p, color, opacity = 1, segs }) => {
  useLayoutEffect(() => { geo.setDrawRange(0, Math.floor(segs * clamp(p)) * 8 * 6); });
  if (p <= 0.001) return null;
  return <mesh geometry={geo}><meshBasicMaterial color={color} transparent opacity={opacity} toneMapped={false} depthWrite={false} /></mesh>;
};

const Scene: React.FC<MediaProps> = ({ w, h, f }) => {
  const res = useMemo(() => {
    const ed = editorTex(), beam = beamTex();
    const slab = roundedSlab(EW + 0.08, EH + 0.08, 0.1, 0.2, 0.03);
    const tA = new THREE.TubeGeometry(PATH_A, 60, 0.034, 8, false);
    const tB = new THREE.TubeGeometry(PATH_B, 80, 0.034, 8, false);
    const tG = new THREE.TubeGeometry(PATH_GHOST, 60, 0.018, 8, false);
    return { ed, beam, slab, tA, tB, tG };
  }, []);

  // read head: mid-file at frame 0, reaches the hidden line on beat 1 and locks there
  const line = f < BEAT ? lerp(2.6, HID, easeInOutCubic(f / BEAT)) : HID;
  const lock = ramp(f, BEAT - 3, BEAT + 6);
  const lockHit = hit(f, BEAT, 18);
  const pA = ramp(f, BEAT + 8, 2 * BEAT, easeInOutCubic);          // path to the branch, lands on beat 2
  const pB = ramp(f, 2 * BEAT, 3 * BEAT - 4, easeInOutCubic);     // veers, lands on beat 3
  const pG = ramp(f, 2 * BEAT + 2, 2 * BEAT + 24);
  const endHit = hit(f, 3 * BEAT, 18);
  const pulse = everyBeat(f, 12);
  const red = new THREE.Color('#FF3B2F'), mint = new THREE.Color(C.mintSoft), orange = new THREE.Color(C.alert);
  const aCol = mint.clone().lerp(red, ramp(f, 2 * BEAT, 3 * BEAT));
  const beamCol = new THREE.Color('#BFE9D9').lerp(orange, lock);

  // beam geometry: orb -> point on the current line
  const ly = lineY(line), lx = lerp(-1.3, -0.4, lock);
  const tgt = onEditor(lx, ly, 0.06);
  const mid = ORB.clone().add(tgt).multiplyScalar(0.5), len = ORB.distanceTo(tgt);
  const dir = ORB.clone().sub(tgt).normalize();
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);

  const tall = tallness(w, h);
  const fov = fovFor(w, h, 30);
  const camPos: V3 = [0.6 + Math.sin(f * 0.004) * 0.3, 0.55 + tall * 0.15, 9.6 - Math.min(f, 240) * 0.003];
  const target: V3 = [0.4, 0.05 - tall * 0.1, 0];
  const bEnd = PATH_B.getPointAt(1), gEnd = PATH_GHOST.getPointAt(1);

  return (
    <>
      <CamRig pos={camPos} target={target} fov={fov} />
      <Env intensity={0.55} />
      <Backdrop3D top="#16181D" bottom="#0A0B0D" glowA="#14261F" dirA={[0.5, 0.4, -1]} powA={5} glowB="#1A1E28" dirB={[-0.6, 0.0, -1]} powB={4} />
      <ambientLight intensity={0.3} />
      <directionalLight position={[-3, 5, 7]} intensity={1.5} color="#F2F5FF" />
      {/* editor */}
      <group position={EPOS} rotation={[0, EYAW, 0]}>
        <mesh geometry={res.slab} position={[0, 0, -0.06]}>
          <meshPhysicalMaterial color="#14161B" roughness={0.3} metalness={0.4} clearcoat={1} clearcoatRoughness={0.12} />
        </mesh>
        <mesh position={[0, 0, 0.002]}>
          <planeGeometry args={[EW, EH]} />
          <meshBasicMaterial map={res.ed} transparent toneMapped={false} />
        </mesh>
        {/* line read highlight */}
        <mesh position={[-0.15, ly, 0.01]}>
          <planeGeometry args={[EW - 0.4, (LH / TH) * EH * 0.92]} />
          <meshBasicMaterial color={beamCol} transparent opacity={0.1 + lock * 0.08} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
        </mesh>
        {/* hidden bar flare on lock */}
        <mesh position={[lerp(-EW / 2, EW / 2, (150 + 440) / TW), lineY(HID), 0.012]}>
          <planeGeometry args={[(880 / TW) * EW, (60 / TH) * EH]} />
          <meshBasicMaterial color={C.alert} transparent opacity={lockHit * 0.5 + lock * 0.06 + pulse * lock * 0.05} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
        </mesh>
      </group>
      {/* the assistant orb + its read beam */}
      <mesh position={ORB}><sphereGeometry args={[0.2, 32, 32]} /><meshPhysicalMaterial color="#DFF7EE" emissive={mint.clone().lerp(orange, lock * 0.6)} emissiveIntensity={1.2} roughness={0.15} clearcoat={1} /></mesh>
      <Glow pos={[ORB.x, ORB.y, ORB.z]} size={1.6 + pulse * 0.3} color={'#' + mint.clone().lerp(orange, lock * 0.7).getHexString()} opacity={0.55} />
      <mesh position={mid} quaternion={q}>
        <planeGeometry args={[0.5 + lock * 0.2, len]} />
        <meshBasicMaterial map={res.beam} color={beamCol} transparent opacity={0.5} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
      {/* suggestion path: branch, ghost of the expected route, veer in red */}
      <Tube geo={res.tA} p={pA} color={aCol} segs={60} />
      <Tube geo={res.tG} p={pG} color="#9AA3B2" opacity={0.45} segs={60} />
      <Tube geo={res.tB} p={pB} color={red} segs={80} />
      {pA > 0.98 ? <mesh position={BRANCH}><sphereGeometry args={[0.075, 20, 20]} /><meshBasicMaterial color={aCol} toneMapped={false} /></mesh> : null}
      {pG > 0.5 ? (
        <group position={gEnd}>
          <mesh rotation={[0, 0, 0]}><ringGeometry args={[0.13, 0.17, 40]} /><meshBasicMaterial color="#9AA3B2" transparent opacity={0.5 * pG} toneMapped={false} depthWrite={false} /></mesh>
        </group>
      ) : null}
      {pB > 0.02 && pB < 0.999 ? <Glow pos={[PATH_B.getPointAt(pB).x, PATH_B.getPointAt(pB).y, PATH_B.getPointAt(pB).z]} size={0.7} color="#FF3B2F" opacity={0.8} /> : null}
      {pB >= 0.999 ? (
        <group position={bEnd}>
          <mesh><sphereGeometry args={[0.13, 24, 24]} /><meshBasicMaterial color="#FF3B2F" toneMapped={false} /></mesh>
          <Glow pos={[0, 0, 0]} size={1.3 + endHit * 1.5} color="#FF3B2F" opacity={0.55 + pulse * 0.2} />
          <mesh scale={[1 + (1 - endHit) * 2, 1 + (1 - endHit) * 2, 1]}><ringGeometry args={[0.16, 0.19, 40]} /><meshBasicMaterial color="#FF3B2F" transparent opacity={endHit * 0.8} toneMapped={false} depthWrite={false} /></mesh>
        </group>
      ) : null}
    </>
  );
};

export const PromptInjection: React.FC<MediaProps> = (p) => {
  const ready = useFontsReady();
  return (
    <Win w={p.w} h={p.h} bg="#0B0C0E">
      {ready ? <ThreeStage width={p.w} height={p.h} exposure={1.05}><Scene {...p} /></ThreeStage> : null}
      <WinVignette strength={0.45} />
      <Label x={p.w - 24} y={p.h - 70} anchor="right" text="SECURITY RESEARCH" color={C.alert} p={ramp(p.f, 4, 22)} size={26} />
    </Win>
  );
};
