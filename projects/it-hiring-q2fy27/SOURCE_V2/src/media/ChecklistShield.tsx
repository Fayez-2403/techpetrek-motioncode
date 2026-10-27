// checklistShield (WHAT TO DO NOW: LEAST PRIVILEGE): an agent node floods a wall of resources with a wide amber cone of
// access; the cone narrows to a thin mint beam on the one resource it needs, and shield panels close around that single
// aperture, landing on the beat. ILLUSTRATIVE.
import React, { useMemo } from 'react';
import * as THREE from 'three';
import type { MediaProps } from './types';
import { ThreeStage, Env, CamRig, type V3 } from '../three/stage';
import { C } from '../styles/theme';
import { clamp, dampedSpring, easeInOutCubic, invLerp, lerp } from '../lib/anim';
import { hash } from '../lib/rng';
import { Backdrop3D, DoneLabel, Glow, Win, WinVignette, canvasTex, doneAt, everyBeat, fovFor, hit, ramp, roundedSlab, rr, tallness, useFontsReady } from './_stub';

const COLS = 5, ROWS = 4, TS = 0.62, TG = 0.15;
const WW = COLS * TS + (COLS - 1) * TG, WH = ROWS * TS + (ROWS - 1) * TG;
const WALL: V3 = [1.55, 0.05, -0.5], WYAW = -0.46;
const AGENT = new THREE.Vector3(-3.75, 0.05, 0.9);
const ALLOW = { c: 2, r: 1 };
const tileXY = (c: number, r: number): [number, number] => [-WW / 2 + TS / 2 + c * (TS + TG), WH / 2 - TS / 2 - r * (TS + TG)];
const toWorld = (lx: number, ly: number, lz = 0) => new THREE.Vector3(lx, ly, lz).applyAxisAngle(new THREE.Vector3(0, 1, 0), WYAW).add(new THREE.Vector3(...WALL));

type Icon = 'db' | 'folder' | 'key' | 'gear' | 'doc';
const ICONS: Icon[] = ['db', 'folder', 'key', 'gear', 'doc'];
function iconTex(kind: Icon) {
  return canvasTex(128, 128, (g, W) => {
    g.clearRect(0, 0, W, W);
    g.strokeStyle = '#FFFFFF'; g.fillStyle = '#FFFFFF'; g.lineWidth = 8; g.lineCap = 'round'; g.lineJoin = 'round';
    if (kind === 'db') { g.beginPath(); g.ellipse(64, 38, 30, 11, 0, 0, Math.PI * 2); g.stroke(); g.beginPath(); g.moveTo(34, 38); g.lineTo(34, 90); g.ellipse(64, 90, 30, 11, 0, Math.PI, 0, true); g.lineTo(94, 38); g.stroke(); g.beginPath(); g.ellipse(64, 64, 30, 11, 0, 0, Math.PI); g.stroke(); }
    if (kind === 'folder') { g.beginPath(); g.moveTo(28, 40); g.lineTo(54, 40); g.lineTo(62, 50); g.lineTo(100, 50); g.lineTo(100, 92); g.lineTo(28, 92); g.closePath(); g.stroke(); }
    if (kind === 'key') { g.beginPath(); g.arc(46, 64, 15, 0, Math.PI * 2); g.stroke(); g.beginPath(); g.moveTo(61, 64); g.lineTo(100, 64); g.moveTo(90, 64); g.lineTo(90, 80); g.moveTo(78, 64); g.lineTo(78, 76); g.stroke(); }
    if (kind === 'gear') { g.beginPath(); g.arc(64, 64, 18, 0, Math.PI * 2); g.stroke(); for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; g.beginPath(); g.moveTo(64 + Math.cos(a) * 26, 64 + Math.sin(a) * 26); g.lineTo(64 + Math.cos(a) * 36, 64 + Math.sin(a) * 36); g.stroke(); } }
    if (kind === 'doc') { g.beginPath(); g.moveTo(38, 26); g.lineTo(76, 26); g.lineTo(92, 42); g.lineTo(92, 102); g.lineTo(38, 102); g.closePath(); g.stroke(); g.beginPath(); g.moveTo(50, 60); g.lineTo(80, 60); g.moveTo(50, 78); g.lineTo(80, 78); g.stroke(); }
  });
}
function hexTex() {
  return canvasTex(512, 512, (g, W) => {
    g.clearRect(0, 0, W, W);
    g.fillStyle = 'rgba(126,227,182,0.10)'; g.fillRect(0, 0, W, W);
    const s = 26, hw = Math.sqrt(3) * s;
    g.strokeStyle = 'rgba(126,227,182,0.55)'; g.lineWidth = 2.2;
    for (let r = -1; r < W / (1.5 * s) + 1; r++) for (let q = -1; q < W / hw + 1; q++) {
      const cx = q * hw + (r % 2 ? hw / 2 : 0), cy = r * 1.5 * s;
      g.beginPath(); for (let k = 0; k < 6; k++) { const a = Math.PI / 6 + (k * Math.PI) / 3; const x = cx + s * 0.92 * Math.cos(a), y = cy + s * 0.92 * Math.sin(a); if (k) g.lineTo(x, y); else g.moveTo(x, y); } g.closePath(); g.stroke();
    }
  });
}

const coneMat = () => new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
  uniforms: { uCol: { value: new THREE.Color() }, uOp: { value: 0.5 } },
  vertexShader: `varying float vL; varying vec3 vN; varying vec3 vV;
    void main(){ vL = -position.y; vec4 wp = modelMatrix * vec4(position, 1.0); vN = normalize(mat3(modelMatrix) * normal); vV = normalize(cameraPosition - wp.xyz); gl_Position = projectionMatrix * viewMatrix * wp; }`,
  fragmentShader: `uniform vec3 uCol; uniform float uOp; varying float vL; varying vec3 vN; varying vec3 vV;
    void main(){ float facing = pow(abs(dot(normalize(vN), normalize(vV))), 1.6); float a = uOp * facing * mix(1.0, 0.4, vL) * smoothstep(0.0, 0.08, vL) * (1.0 - smoothstep(0.82, 1.0, vL));
      gl_FragColor = vec4(uCol * a, 1.0);
      #include <colorspace_fragment>
    }`,
});

const Scene: React.FC<MediaProps> = ({ w, h, f, dur }) => {
  const D = doneAt(dur);
  const res = useMemo(() => {
    const cone = new THREE.ConeGeometry(1, 1, 64, 1, true); cone.translate(0, -0.5, 0);
    const tile = roundedSlab(TS, TS, 0.12, 0.08, 0.03);
    const icons = ICONS.map(iconTex);
    const hex = hexTex();
    return { cone, tile, icons, hex, coneMat: coneMat(), beamMat: coneMat() };
  }, []);

  const narrow = easeInOutCubic(invLerp(Math.max(-8, D - 42), D - 4, f));
  const close = Math.min(1.02, dampedSpring((f - (D - 14)) / 60, 15, 0.62));
  const done = ramp(f, D - 2, D + 6);
  const flash = hit(f, D, 16);
  const pulse = everyBeat(f, 12);

  const wallC = toWorld(0, 0, 0.1);
  const [ax, ay] = tileXY(ALLOW.c, ALLOW.r);
  const allowW = toWorld(ax, ay, 0.1);
  const aim = wallC.clone().lerp(allowW, narrow);
  const L = AGENT.distanceTo(aim);
  const R = lerp(2.35, 0.07, narrow);
  const dir = aim.clone().sub(AGENT).normalize();
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir);
  const amber = new THREE.Color('#FF9A4D'), mint = new THREE.Color(C.mintSoft);
  const cCol = amber.clone().lerp(mint, narrow);
  res.coneMat.uniforms.uCol.value.copy(cCol);
  res.coneMat.uniforms.uOp.value = lerp(0.34, 1.6, narrow);

  const tall = tallness(w, h);
  const fov = fovFor(w, h, 30);
  const camPos: V3 = [0.4 + Math.sin(f * 0.004) * 0.3, 1.15 + tall * 0.2, 9.4 - Math.min(f, 240) * 0.002];
  const target: V3 = [-0.35, 0.0 - tall * 0.12, 0];

  // shield panels (wall-local): frame the one allowed tile
  const A = 0.42, M = 0.35, top = WH / 2 + M, bot = -WH / 2 - M, lft = -WW / 2 - M, rgt = WW / 2 + M;
  const panels = [
    { cx: 0, cy: (top + ay + A) / 2, w: rgt - lft, h: top - (ay + A), from: [0, 2.6] },
    { cx: 0, cy: (bot + ay - A) / 2, w: rgt - lft, h: (ay - A) - bot, from: [0, -2.6] },
    { cx: (lft + ax - A) / 2, cy: ay, w: (ax - A) - lft, h: 2 * A, from: [-2.8, 0] },
    { cx: (rgt + ax + A) / 2, cy: ay, w: rgt - (ax + A), h: 2 * A, from: [2.8, 0] },
  ];

  return (
    <>
      <CamRig pos={camPos} target={target} fov={fov} />
      <Env intensity={0.6} />
      <Backdrop3D top="#14161A" bottom="#08090B" glowA={'#' + new THREE.Color('#2A1A10').lerp(new THREE.Color('#0E2A20'), done).getHexString()} dirA={[0.4, 0.1, -1]} powA={3.5} glowB="#171B22" dirB={[-0.7, 0.2, -1]} powB={4} />
      <ambientLight intensity={0.3} />
      <directionalLight position={[-3, 5, 7]} intensity={1.4} color="#F3F6FF" />
      <directionalLight position={[5, 2, -4]} intensity={0.6} color="#9DB4DC" />
      {/* resource wall */}
      <group position={WALL} rotation={[0, WYAW, 0]}>
        <mesh position={[0, 0, -0.12]}>
          <boxGeometry args={[WW + 0.6, WH + 0.6, 0.08]} />
          <meshPhysicalMaterial color="#121418" metalness={0.6} roughness={0.4} clearcoat={0.6} />
        </mesh>
        {Array.from({ length: COLS * ROWS }, (_, i) => {
          const c = i % COLS, r = Math.floor(i / COLS), [x, y] = tileXY(c, r);
          const allowed = c === ALLOW.c && r === ALLOW.r;
          const lit = allowed ? 1 : 1 - narrow;               // amber flood -> only the allowed tile stays lit
          const col = allowed ? amber.clone().lerp(mint, narrow) : amber.clone().lerp(new THREE.Color('#3A3F48'), narrow);
          return (
            <group key={i} position={[x, y, 0]}>
              <mesh geometry={res.tile}>
                <meshPhysicalMaterial color="#23262D" metalness={0.5} roughness={0.35} clearcoat={0.7} emissive={col} emissiveIntensity={0.18 * lit + (allowed ? done * 0.25 : 0)} />
              </mesh>
              <mesh position={[0, 0, 0.065]}>
                <planeGeometry args={[TS * 0.62, TS * 0.62]} />
                <meshBasicMaterial map={res.icons[Math.floor(hash(i, 4) * ICONS.length)]} color={col} transparent opacity={0.35 + 0.65 * lit} toneMapped={false} depthWrite={false} />
              </mesh>
            </group>
          );
        })}
        {/* shield panels close around the aperture */}
        {panels.map((p, k) => {
          const ox = p.from[0] * (1 - close), oy = p.from[1] * (1 - close);
          return (
            <group key={k} position={[p.cx + ox, p.cy + oy, 0.34]}>
              <mesh>
                <planeGeometry args={[p.w, p.h]} />
                <meshBasicMaterial map={res.hex} transparent opacity={clamp(close * 1.2) * 0.9} depthWrite={false} toneMapped={false} />
              </mesh>
              <mesh position={[0, 0, -0.005]}>
                <planeGeometry args={[p.w, p.h]} />
                <meshBasicMaterial color="#0A1410" transparent opacity={clamp(close * 1.2) * 0.72} depthWrite={false} />
              </mesh>
            </group>
          );
        })}
        {/* aperture frame */}
        <mesh position={[ax, ay, 0.35]}>
          <ringGeometry args={[A * 1.36, A * 1.44, 4, 1, Math.PI / 4]} />
          <meshBasicMaterial color={C.mintSoft} transparent opacity={done} toneMapped={false} depthWrite={false} />
        </mesh>
      </group>
      {/* access cone -> beam */}
      <mesh geometry={res.cone} material={res.coneMat} position={AGENT} quaternion={q} scale={[R, L, R]} />
      <Glow pos={[allowW.x, allowW.y, allowW.z + 0.2]} size={1.2 + flash * 1.4} color={'#' + cCol.getHexString()} opacity={0.35 + narrow * 0.35} />
      {/* agent node */}
      <group position={AGENT}>
        <mesh rotation={[f * 0.01, f * 0.016, 0]}>
          <boxGeometry args={[0.5, 0.5, 0.5]} />
          <meshPhysicalMaterial color="#1D2026" metalness={0.6} roughness={0.25} clearcoat={1} emissive={cCol} emissiveIntensity={0.25} />
        </mesh>
        <Glow pos={[0, 0, 0]} size={1.8 + pulse * 0.3} color={'#' + cCol.getHexString()} opacity={0.5} />
      </group>
    </>
  );
};

export const ChecklistShield: React.FC<MediaProps> = (p) => {
  const ready = useFontsReady();
  const D = doneAt(p.dur);
  return (
    <Win w={p.w} h={p.h} bg="#0A0A0C">
      {ready ? <ThreeStage width={p.w} height={p.h} exposure={1.05}><Scene {...p} /></ThreeStage> : null}
      <WinVignette strength={0.45} />
      <DoneLabel x={24} y={22} text="LEAST PRIVILEGE" p={ramp(p.f, 2, 18)} done={ramp(p.f, D - 2, D + 8)} />
    </Win>
  );
};
