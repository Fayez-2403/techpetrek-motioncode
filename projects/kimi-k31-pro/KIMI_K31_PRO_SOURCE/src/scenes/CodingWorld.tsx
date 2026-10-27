// 04 · CODING BECOMES CREATION (B, illustrative reconstruction; code and scene written for this film, not Kimi output)
// Entry: the 18 cyan bars scene 03 ends on resolve into the code rows of a dark developer workspace. A prompt types in
// the agent panel; the real gear code (src/three/MechanicalAssembly.tsx) streams in by lines; a panel resize with snap-to-grid
// opens a live viewport; every edge segment of the gear world starts as a dash on a code character and flies to its true
// 3D place; the gears mesh and turn (angle_b = -angle_a * z_a / z_b), a crank drives a piston, a cursor drags the drive gear.
// Exit: the viewport fills the frame and the camera dollies onto the drive gear face-on, centred, radius 0.28 H, as a cyan
// wireframe, still turning — scene 05 opens on a fan disk of that size and spin.
import React, { useLayoutEffect, useMemo } from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { Env, ThreeStage } from '../three/stage';
import {
  arrivals as partArrivals, buildGearWorld, CRANK, cutMaterial, flightGeometries, flightMaterial, GEAR_CENTRES, GEAR_DEPTH, makeProjector,
  raOf, trainPose, TRAIN, ViewCam, type Cell, type V3,
} from '../three/MechanicalAssembly';
import { CodeEditor } from '../components/CodeEditor';
import { CODE_PROMPT, GEAR_SNIPPET, GEAR_SNIPPET_FILE, GEAR_SNIPPET_FIRST_LINE, WORKSPACE } from '../data/codingSnippet';
import { CLAIMS } from '../data/verifiedClaims';
import { attributionText, SourceAttribution } from '../components/SourceAttribution';
import { KineticTitle } from '../components/KineticTitle';
import { ProvenanceLabel } from '../components/ProvenanceLabel';
import { clamp, easeInOutCubic, easeOutCubic, invLerp, lerp, smoothStep, smootherStep } from '../lib/anim';
import { hash } from '../lib/rng';
import { useLayout, type Layout } from '../lib/layout';
import { C, WORLD } from '../styles/theme';
import { F } from '../styles/typography';
import type { SceneProps } from './types';

const W = WORLD.code;
const FOV = 34;
/** drive-gear speed after the lock (rad per frame); scene 05 matches this spin */
export const CODING_EXIT_SPIN = 0.5 / 30;
/** outer (tip) radius of the exit gear as a fraction of frame height */
export const CODING_EXIT_RADIUS = 0.28;

// ------------------------------------------------------------------------------------------------ timing
const REF = { master: 378, reel: 162 };
function timeline(dur: number, reel: boolean) {
  const s = dur / (reel ? REF.reel : REF.master), r = (x: number) => Math.round(x * s);
  const k = reel
    ? { chrome1: 12, promptA: 6, promptB: 22, send: 24, streamA: 26, stagger: 2.2, wipe: 6, rsCursor: 999, rsA: 50, rsB: 64, flyA: 62, flyB: 90, travel: 20,
      titleA: 4, titleB: 54, titleC: 60, capA: 34, capB: 76, attr: 40, dragIn: 999, dragA: 999, dragB: 999, dragOut: 999,
      typeOut: 122, expA: 124, expB: 144, camA: 124, camB: 147, fadeA: 122, fadeB: 134, wireA: 126, wireB: 144 }
    : { chrome1: 14, promptA: 18, promptB: 48, send: 50, streamA: 54, stagger: 3, wipe: 8, rsCursor: 104, rsA: 112, rsB: 138, flyA: 142, flyB: 196, travel: 24,
      titleA: 194, titleB: 204, titleC: 212, capA: 210, capB: 236, attr: 216, dragIn: 246, dragA: 268, dragB: 312, dragOut: 330,
      typeOut: 318, expA: 324, expB: 352, camA: 326, camB: 362, fadeA: 338, fadeB: 360, wireA: 336, wireB: 358 };
  const t = Object.fromEntries(Object.entries(k).map(([key, v]) => [key, key === 'stagger' || key === 'wipe' || key === 'travel' ? v : r(v)])) as typeof k;
  const lock = t.flyB + 4 + Math.ceil(t.travel * 1.15);
  return { ...t, lock };
}
type TM = ReturnType<typeof timeline>;

// ------------------------------------------------------------------------------------------------ layout
function layoutFor(L: Layout, reel: boolean) {
  if (!reel) {
    // rows sit exactly on the bars scene 03 ends on: row i centre y = 206 + 38 i, code starts at x = 360
    const win = { x: 40, y: 132, w: 1840, h: 764 };
    const titleH = 24, tabsH = 30, statusH = 24, activityW = 48, treeW = 196;
    const groupLeft = win.x + activityW + treeW;
    const right = win.x + win.w;
    const cols = Array.from({ length: 13 }, (_, k) => groupLeft + (k * (right - groupLeft)) / 12);
    return { reel, win, titleH, tabsH, statusH, activityW, treeW, fs: 22, lineH: 38, codeLeft: 360, rowTop: 187, rows: 18, rowsAfter: 18, groupLeft, right,
      bodyTop: win.y + titleH, bodyBottom: win.y + win.h - statusH, grid: cols, splitFrom: cols[9], splitTo: cols[6] };
  }
  const win = { x: 40, y: 626, w: L.w - 80, h: 724 };
  const titleH = 32, tabsH = 40, statusH = 24, activityW = 44;
  const rowTop = win.y + titleH + tabsH, lineH = 34;
  const bodyBottom = win.y + win.h - statusH;
  const grid = Array.from({ length: 20 }, (_, k) => rowTop + k * lineH).filter((y) => y <= bodyBottom);
  return { reel, win, titleH, tabsH, statusH, activityW, treeW: 0, fs: 22, lineH, codeLeft: win.x + activityW + 62, rowTop, rows: 12, rowsAfter: 4,
    groupLeft: win.x + activityW, right: win.x + win.w, bodyTop: win.y + titleH, bodyBottom, grid, splitFrom: bodyBottom, splitTo: rowTop + 4 * lineH + 2 };
}
type LK = ReturnType<typeof layoutFor>;

/** split position (master: divider x; reel: divider y) with snap-to-grid: the drag moves continuously, the divider jumps
 * column to column with a small overshoot, and settles on the target when released */
function splitAt(f: number, tm: TM, K: LK) {
  const drag = (g: number) => lerp(K.splitFrom, K.reel ? K.splitTo - 10 : K.splitTo - 16, easeInOutCubic(invLerp(tm.rsA, tm.rsB, g)));
  const snapOf = (x: number) => K.grid.reduce((b, c) => (Math.abs(c - x) < Math.abs(b - x) ? c : b), K.grid[0]);
  let pos = K.splitFrom, prev = snapOf(K.splitFrom);
  const back = (u: number) => { const c1 = 1.9, c3 = c1 + 1; return 1 + c3 * (u - 1) ** 3 + c1 * (u - 1) ** 2; };
  for (let g = tm.rsA; g <= Math.min(f, tm.rsB); g++) {
    const sn = snapOf(drag(g));
    if (sn !== prev) { pos += (sn - prev) * back(clamp((f - g) / 4)); prev = sn; }
  }
  const final = K.splitTo;
  if (f > tm.rsB && prev !== final) pos += (final - prev) * back(clamp((f - tm.rsB) / 5));
  return { pos, dragX: drag(Math.min(f, tm.rsB)), snapped: prev };
}

// ------------------------------------------------------------------------------------------------ camera
interface Cam { pos: V3; target: V3; fov: number; cx: number; cy: number }
function camAt(f: number, tm: TM, K: LK, vp: { x: number; y: number; w: number; h: number }, L: Layout): Cam {
  const T: V3 = K.reel ? [1.75, -0.56, 0] : [1.72, -0.5, 0];
  const tanH = Math.tan((FOV * Math.PI) / 360);
  const reelBody = K.bodyBottom - K.splitTo - 36;
  const D = K.reel ? L.h / (2 * tanH * ((0.9 * reelBody) / 5.6)) : 24.6;
  const yaw = 0.34 + 0.00045 * (f - tm.flyA), pitch = 0.19;
  const orbitPos: V3 = [T[0] + D * Math.cos(pitch) * Math.sin(yaw), T[1] + D * Math.sin(pitch), T[2] + D * Math.cos(pitch) * Math.cos(yaw)];
  // exit: face-on to the drive gear; its tip circle (front face) has radius 0.28 H on screen
  const faceZ = GEAR_DEPTH / 2 + raOf(TRAIN[0].z) / (2 * CODING_EXIT_RADIUS * Math.tan((FOV * Math.PI) / 360));
  const face: V3 = [0, 0, faceZ];
  const e = easeInOutCubic(invLerp(tm.camA, tm.camB, f));
  const ePos = e * e * (3 - 2 * e);
  const pos: V3 = [lerp(orbitPos[0], face[0], ePos), lerp(orbitPos[1], face[1], ePos), lerp(orbitPos[2], face[2], e)];
  const target: V3 = [lerp(T[0], 0, e), lerp(T[1], 0, e), 0];
  const cx = lerp(vp.x + vp.w / 2, L.w / 2, e), cy = lerp(vp.y + vp.h / 2, L.h / 2, e);
  return { pos, target, fov: FOV, cx, cy };
}

/** drive angle: motor ramps up after the lock; the cursor adds a drag (master) */
function driveAngle(f: number, tm: TM) {
  const R = 20, t = f - tm.lock;
  const s = t <= 0 ? 0 : t < R ? (t * t) / (2 * R) : t - R / 2;
  const drag = 1.7 * smootherStep(invLerp(tm.dragA, tm.dragB, f));
  return CODING_EXIT_SPIN * s + drag;
}

// ------------------------------------------------------------------------------------------------ 3D world
function floorMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { uA: { value: 0 }, uC: { value: new THREE.Vector2(1.7, 0) }, uClip: { value: new THREE.Vector4(-1e6, -1e6, 1e6, 1e6) } },
    vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: `
      uniform float uA; uniform vec2 uC; uniform vec4 uClip; varying vec3 vW;
      float line(float x, float s, float w) { float d = abs(fract(x / s + 0.5) - 0.5) * s; return 1.0 - smoothstep(0.0, w * fwidth(x) * 1.2 + 0.004, d); }
      void main() {
        if (gl_FragCoord.x < uClip.x || gl_FragCoord.x > uClip.z || gl_FragCoord.y < uClip.y || gl_FragCoord.y > uClip.w) discard;
        vec2 p = vW.xz;
        float minor = max(line(p.x, 0.5, 1.0), line(p.y, 0.5, 1.0));
        float major = max(line(p.x, 2.5, 1.5), line(p.y, 2.5, 1.5));
        float fade = 1.0 - smoothstep(4.0, 13.0, length(p - uC));
        vec3 c = mix(vec3(0.16, 0.22, 0.34), vec3(0.24, 0.34, 0.52), major);
        float a = max(minor * 0.35, major * 0.7) * fade * uA;
        float ax = (1.0 - smoothstep(0.0, 0.03, abs(p.y))) * 0.5 * fade * uA;
        gl_FragColor = vec4(mix(c, vec3(0.75, 0.33, 0.3), ax > a ? 1.0 : 0.0), max(a, ax));
      }`,
  });
}

interface WorldState {
  f: number; tm: TM; L: Layout; cam: Cam; a0: number; cells: Cell[]; others: number; plateOut: number; g0Hot: number; wireOut: number; floorA: number; retract: number;
  body: { x: number; y: number; w: number; h: number };
}

const GearScene: React.FC<WorldState> = ({ f, tm, L, cam, a0, cells, others, plateOut, g0Hot, wireOut, floorA, retract, body }) => {
  const parts = useMemo(() => buildGearWorld(), []);
  const geos = useMemo(() => flightGeometries(parts, cells), [parts, cells]);
  const arr = useMemo(() => partArrivals(geos, tm.travel * 1.15), [geos, tm.travel]);
  const mats = useMemo(() => parts.map((p) => {
    const plate = p.key === 'frame';
    const cm = cutMaterial({ color: plate ? '#121725' : p.color, metalness: plate ? 0.25 : p.metal, roughness: plate ? 0.78 : p.rough,
      transparent: p.key !== 'gear0' }, p.mode, 1, p.r);
    if (p.axis) cm.u.uAxis.value.set(p.axis[0], p.axis[1], p.axis[2]);
    if (p.a) cm.u.uA.value.set(p.a[0], p.a[1]);
    cm.u.uGlowW.value = plate ? 0.025 : 0.05; cm.u.uGlowAmt.value = plate ? 0.5 : 1.4;
    return { cm, fm: flightMaterial() };
  }), [parts]);
  const floor = useMemo(() => floorMaterial(), []);
  const pose = trainPose(a0);
  const { gl } = useThree();
  const dpr = gl.getPixelRatio();
  const clipV = new THREE.Vector4(body.x * dpr, (L.h - body.y - body.h) * dpr, (body.x + body.w) * dpr, (L.h - body.y) * dpr);

  useLayoutEffect(() => {
    parts.forEach((p, i) => {
      const { cm, fm } = mats[i];
      const isG0 = p.key === 'gear0';
      const rv = easeOutCubic(invLerp(arr[i] - 2, arr[i] + 14, f));
      // the exit gear dissolves from its rim into its wireframe (voxel burn front, as in 01); everything else fades out
      if (isG0 && retract > 0) { cm.u.uMode.value = 3; cm.u.uSign.value = -1; cm.u.uCut.value = lerp(0.2, 1.24, retract); }
      else { cm.u.uMode.value = p.mode; cm.u.uSign.value = 1; cm.u.uCut.value = rv <= 0 ? -1 : lerp(-0.02, 1.06, rv); }
      cm.u.uClip.value.copy(clipV); fm.uniforms.uClip.value.copy(clipV);
      if (!isG0) cm.m.opacity = 1 - (p.key === 'frame' ? plateOut : clamp(others * 1.6));
      cm.m.visible = cm.m.opacity > 0.003;
      if (isG0) { cm.u.uGlowAmt.value = retract > 0 ? 2.6 : 1.4; cm.u.uGlowW.value = retract > 0 ? 0.07 : 0.05; }
      cm.u.uFlash.value = f > arr[i] ? (p.key === 'frame' ? 0.06 : 0.4) * Math.exp(-(f - arr[i]) / 5) : 0;
      const u = fm.uniforms;
      u.uF.value = f; u.uTravel.value = tm.travel; u.uRes.value.set(L.w, L.h); u.uOff.value.set(L.w / 2 - cam.cx, L.h / 2 - cam.cy);
      u.uTanHalf.value = Math.tan((cam.fov * Math.PI) / 360); u.uDepth.value = 7;
      u.uWire.value = isG0 ? lerp(lerp(0.34, 0.85, g0Hot), 1, wireOut) : 0.3;
      u.uAlpha.value = isG0 ? 1 : 1 - (p.key === 'frame' ? plateOut : others);
      u.uFlash.value = f > arr[i] ? 0.6 * Math.exp(-(f - arr[i]) / 4) : 0;
    });
    floor.uniforms.uA.value = floorA;
    floor.uniforms.uClip.value.copy(clipV);
  });

  const tf = (g: string): { position: V3; rotation: V3 } => {
    if (g.startsWith('g')) { const i = Number(g.slice(1)); return { position: [GEAR_CENTRES[i][0], GEAR_CENTRES[i][1], 0], rotation: [0, 0, pose.ang[i]] }; }
    if (g === 'rod') return { position: [pose.pin[0], pose.pin[1], CRANK.z], rotation: [0, 0, pose.rod] };
    if (g === 'piston') return { position: [pose.piston[0], pose.piston[1], CRANK.z], rotation: [0, 0, 0] };
    return { position: [0, 0, 0], rotation: [0, 0, 0] };
  };

  return (
    <>
      <ViewCam pos={cam.pos} target={cam.target} fov={cam.fov} cx={cam.cx} cy={cam.cy} />
      <Env intensity={0.9} />
      <ambientLight intensity={0.06} />
      <directionalLight position={[-5, 7, 9]} intensity={2.4} color="#EEF3FA" />
      <directionalLight position={[8, 3, -6]} intensity={2.2} color="#9FE9FF" />
      <directionalLight position={[2, -5, 7]} intensity={0.5} color="#8C7DFF" />
      {parts.map((p, i) => (
        <group key={p.key} {...tf(p.group)}>
          <mesh geometry={p.solid} material={mats[i].cm.m} />
          <lineSegments geometry={geos[i]} material={mats[i].fm} frustumCulled={false} renderOrder={2} />
        </group>
      ))}
      <mesh position={[1.7, -3.5, 0]} rotation={[-Math.PI / 2, 0, 0]} material={floor} renderOrder={1}>
        <planeGeometry args={[34, 34]} />
      </mesh>
    </>
  );
};

// ------------------------------------------------------------------------------------------------ DOM pieces
const Cursor: React.FC<{ x: number; y: number; a: number; grab?: boolean; resize?: boolean; s?: number }> = ({ x, y, a, grab, resize, s = 1 }) => {
  if (a <= 0.01) return null;
  return (
    <div style={{ position: 'absolute', left: x, top: y, opacity: a, zIndex: 60, transform: `scale(${s})`, transformOrigin: '0 0' }}>
      {grab && <div style={{ position: 'absolute', left: -20, top: -20, width: 40, height: 40, borderRadius: 20, border: `2px solid ${C.cyan}`, boxShadow: `0 0 18px ${C.cyan}`, opacity: 0.9 }} />}
      {resize ? (
        <svg width="34" height="22" viewBox="0 0 34 22" style={{ position: 'absolute', left: -17, top: -11 }}>
          <path d="M1 11l7-7v4h18V4l7 7-7 7v-4H8v4z" fill="#FFFFFF" stroke="#0B0F1A" strokeWidth="1.4" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg width="24" height="34" viewBox="0 0 24 34" style={{ position: 'absolute', left: -2, top: -2 }}>
          <path d="M2 2v26l7-6.5 4.6 10 4.2-1.9-4.5-9.8H23z" fill="#FFFFFF" stroke="#0B0F1A" strokeWidth="1.6" strokeLinejoin="round" />
        </svg>
      )}
    </div>
  );
};

/** small axis gizmo that follows the 3D camera */
const Gizmo: React.FC<{ x: number; y: number; dirs: { k: string; c: string; dx: number; dy: number }[]; a: number }> = ({ x, y, dirs, a }) => (
  <svg width={110} height={110} style={{ position: 'absolute', left: x - 55, top: y - 55, opacity: a, overflow: 'visible' }}>
    {dirs.map((d) => (
      <g key={d.k}>
        <line x1={55} y1={55} x2={55 + d.dx * 34} y2={55 + d.dy * 34} stroke={d.c} strokeWidth={2.2} />
        <circle cx={55 + d.dx * 34} cy={55 + d.dy * 34} r={8} fill={d.c} />
        <text x={55 + d.dx * 34} y={55 + d.dy * 34 + 4} fontSize={10} fontFamily={F.mono} fontWeight={700} textAnchor="middle" fill="#0B0F1A">{d.k}</text>
      </g>
    ))}
  </svg>
);

// ------------------------------------------------------------------------------------------------ scene
export const CodingWorld: React.FC<SceneProps> = ({ dur, variant }) => {
  const f = useCurrentFrame();
  const L = useLayout();
  const reel = variant === 'reel';
  const tm = useMemo(() => timeline(dur, reel), [dur, reel]);
  const K = useMemo(() => layoutFor(L, reel), [L.w, L.h, reel]); // eslint-disable-line react-hooks/exhaustive-deps
  const project = useMemo(() => makeProjector(L.w, L.h), [L.w, L.h]);
  const lines = GEAR_SNIPPET;
  const cw = K.fs * 0.6;

  // ---- departure frame of every character that becomes geometry
  const { cells, depOf } = useMemo(() => {
    const out: Cell[] = [], dep = new Map<string, number>();
    const span = tm.flyB - tm.flyA - 10;
    for (let r = 0; r < K.rowsAfter; r++) {
      const line = lines[r] ?? '';
      for (let c = 0; c < line.length; c++) {
        if (line[c] === ' ') continue;
        const d = tm.flyA + (K.rowsAfter > 1 ? (r / (K.rowsAfter - 1)) * span : 0) + (c / 56) * 10 + hash(r, c, 3) * 3;
        out.push({ x: K.codeLeft + c * cw, y: K.rowTop + r * K.lineH + K.lineH / 2, w: cw, h: K.fs * 0.8, dep: d });
        dep.set(`${r}-${c}`, d);
      }
    }
    return { cells: out, depOf: dep };
  }, [K, tm, lines, cw]);

  // ---- phases
  const chrome = smoothStep(invLerp(K.reel ? 3 : 0, tm.chrome1, f));
  const split = splitAt(f, tm, K);
  const exp = easeInOutCubic(invLerp(tm.expA, tm.expB, f));            // viewport grows to the full frame
  const typeOut = smoothStep(invLerp(tm.typeOut, tm.typeOut + 12, f));
  const vpBase = K.reel
    ? { x: K.win.x, y: split.pos, w: K.win.w, h: K.bodyBottom - split.pos }
    : { x: split.pos, y: K.bodyTop, w: K.right - split.pos, h: K.bodyBottom - K.bodyTop };
  const vp = { x: lerp(vpBase.x, 0, exp), y: lerp(vpBase.y, 0, exp), w: lerp(vpBase.w, L.w, exp), h: lerp(vpBase.h, L.h, exp) };
  const headerH = 36 * (1 - exp);
  const body = { x: vp.x, y: vp.y + headerH, w: vp.w, h: vp.h - headerH };
  const vpOpen = smoothStep(invLerp(tm.rsA + 4, tm.rsB + 6, f));     // viewport content fades in as the panel opens
  const cam = camAt(f, tm, K, body, L);
  const a0 = driveAngle(f, tm);
  const landed = f > tm.lock + 2;

  // ---- editor state
  const lineReveal = (r: number) => clamp((f - (tm.streamA + r * tm.stagger)) / tm.wipe);
  const streaming = Array.from({ length: K.rows }, (_, r) => lineReveal(r)).findIndex((v) => v > 0 && v < 1);
  const lastRow = Math.min(K.rows, lines.length) - 1;
  const activeRow = f < tm.streamA ? 0 : streaming >= 0 ? streaming : lastRow;
  const curCol = f < tm.streamA ? 0 : Math.floor(lineReveal(activeRow) * (lines[activeRow]?.length ?? 0));
  const blink = Math.floor(f / 15) % 2 === 0;
  const charAlpha = (r: number, c: number) => {
    const d = depOf.get(`${r}-${c}`);
    if (d === undefined) return 1;
    return 1 - 0.74 * smoothStep(invLerp(d - 6, d + 2, f));
  };
  // the bars scene 03 ends on (master) become the skeleton rows; the reel boots from black with the same bars
  const skeleton = (r: number) => {
    const line = lines[r] ?? '';
    const ind = line.length - line.trimStart().length;
    const m = easeInOutCubic(invLerp(K.reel ? 4 : 1, tm.chrome1 + 2, f));
    const x03 = K.codeLeft, w03 = 300 + hash(r, 5) * 800;
    const y03 = K.reel ? K.rowTop + r * K.lineH + K.lineH / 2 : 200 + r * 38 + 6;
    const yRow = K.rowTop + r * K.lineH + K.lineH / 2;
    const wLine = Math.max(0, (line.length - ind) * cw);
    const boot = 1;                                   // both formats cut straight onto the bars
    const fade = 1 - smoothStep(invLerp(0, 0.6, lineReveal(r)));
    const a = lerp(0.35, line.trim() ? 0.16 : 0, m) * boot * fade;
    const c = [lerp(92, 120, m), lerp(225, 150, m), lerp(255, 200, m)];
    return { x: lerp(x03, K.codeLeft + ind * cw, m), y: lerp(y03, yRow, m), w: lerp(K.reel ? Math.min(w03, K.right - K.codeLeft - 40) : w03, wLine, m), h: lerp(12, 9, m),
      color: `rgb(${c[0]},${c[1]},${c[2]})`, a };
  };

  // ---- cursor (master): resize drag, then grabbing the drive gear
  let cursor: React.ReactNode = null;
  let g0Hot = 0;
  if (!K.reel) {
    if (f >= tm.rsCursor && f < tm.rsB + 14) {
      const appear = smoothStep(invLerp(tm.rsCursor, tm.rsCursor + 6, f));
      const x = f < tm.rsA ? lerp(K.splitFrom + 60, K.splitFrom, easeOutCubic(invLerp(tm.rsCursor, tm.rsA, f))) : f <= tm.rsB ? split.dragX : lerp(split.pos, split.pos + 120, easeInOutCubic(invLerp(tm.rsB + 2, tm.rsB + 14, f)));
      cursor = <Cursor x={x} y={560} a={appear * (1 - smoothStep(invLerp(tm.rsB + 6, tm.rsB + 14, f)))} resize />;
    }
    if (f >= tm.dragIn && f < tm.dragOut + 4) {
      const grabR = 1.42, grabWorld = (135 * Math.PI) / 180;
      const phi = grabWorld - driveAngle(tm.dragA, tm);              // grab point fixed on the gear
      const at = (g: number) => {
        const camG = camAt(g, tm, K, body, L), ang = phi + driveAngle(g, tm);
        const p = project(camG.pos, camG.target, camG.fov, camG.cx, camG.cy, [grabR * Math.cos(ang), grabR * Math.sin(ang), GEAR_DEPTH / 2]);
        return [p[0], p[1]] as const;
      };
      const g = at(Math.min(Math.max(f, tm.dragA), tm.dragB));
      let x: number, y: number;
      if (f < tm.dragA) {
        const u = easeInOutCubic(invLerp(tm.dragIn, tm.dragA, f)), s0 = [K.right - 120, K.bodyBottom - 90];
        x = lerp(s0[0], g[0], u) + Math.sin(u * Math.PI) * 30; y = lerp(s0[1], g[1], u) - Math.sin(u * Math.PI) * 40;
      } else if (f <= tm.dragB) { x = g[0]; y = g[1]; }
      else { const u = easeInOutCubic(invLerp(tm.dragB, tm.dragOut, f)); x = g[0] + u * 140; y = g[1] + u * 60; }
      const a = smoothStep(invLerp(tm.dragIn, tm.dragIn + 6, f)) * (1 - smoothStep(invLerp(tm.dragOut - 8, tm.dragOut, f)));
      const grabbing = f >= tm.dragA && f <= tm.dragB + 2;
      g0Hot = smoothStep(invLerp(tm.dragA - 10, tm.dragA, f)) * (1 - smoothStep(invLerp(tm.dragB, tm.dragB + 10, f)));
      cursor = <Cursor x={x} y={y} a={a} grab={grabbing} />;
    }
  }

  // ---- exit fades
  const others = smoothStep(invLerp(tm.fadeA, tm.fadeB, f));
  const plateOut = smoothStep(invLerp(tm.expA - 2, tm.expA + 14, f));
  const wireOut = smoothStep(invLerp(tm.wireA, tm.wireB, f));
  const retract = smoothStep(invLerp(tm.wireA, tm.wireB, f));
  const floorA = smoothStep(invLerp(tm.lock - 6, tm.lock + 16, f)) * (1 - smoothStep(invLerp(tm.expA, tm.expA + 18, f)));
  const editorOut = easeInOutCubic(invLerp(tm.expA, tm.expB - 6, f));

  // ---- canvas clip: the whole window while edges fly over the editor, then the viewport body
  const winR = { x: K.win.x, y: K.bodyTop, w: K.win.w, h: K.bodyBottom - K.bodyTop };
  const clip = exp > 0.001 || landed ? body : winR;
  const clipPath = `inset(${clip.y}px ${L.w - clip.x - clip.w}px ${L.h - clip.y - clip.h}px ${clip.x}px)`;

  // ---- gizmo
  const gz = (() => {
    const o = project(cam.pos, cam.target, cam.fov, cam.cx, cam.cy, cam.target);
    const ax: [string, string, V3][] = [['X', '#E06A5A', [1, 0, 0]], ['Y', '#7CC77A', [0, 1, 0]], ['Z', '#5A8DE0', [0, 0, 1]]];
    return ax.map(([k, c, d]) => {
      const p = project(cam.pos, cam.target, cam.fov, cam.cx, cam.cy, [cam.target[0] + d[0], cam.target[1] + d[1], cam.target[2] + d[2]]);
      const dx = p[0] - o[0], dy = p[1] - o[1], n = Math.hypot(dx, dy) || 1;
      return { k, c, dx: (dx / n) * Math.min(1, n / 40), dy: (dy / n) * Math.min(1, n / 40) };
    });
  })();

  // ---- prompt typing (~1 s master, ~0.55 s reel)
  const typed = CODE_PROMPT.slice(0, Math.round(CODE_PROMPT.length * clamp((f - tm.promptA) / (tm.promptB - tm.promptA))));
  const sent = f >= tm.send;
  const sendFlash = sent ? Math.exp(-(f - tm.send) / 4) : 0;

  const ui = K.reel ? 1.25 : 1;
  const winShift = K.reel ? 0 : -editorOut * 160;
  const editorA = 1 - editorOut;

  return (
    <AbsoluteFill style={{ background: W.bg, overflow: 'hidden' }}>
      {/* outside the window darkens a touch once the chrome is in, so the window reads as an object */}
      <AbsoluteFill style={{ background: `radial-gradient(120% 100% at 50% 40%, rgba(11,15,26,0) 40%, rgba(3,5,11,${0.75 * chrome}) 100%)` }} />
      <div style={{ position: 'absolute', inset: 0, transform: `translateX(${winShift}px)`, opacity: K.reel ? 1 - exp : editorA }}>
        <CodeEditor x={K.win.x} y={K.win.y} w={K.win.w} h={K.win.h} title={WORKSPACE.title} tree={K.reel ? null : WORKSPACE.tree} treeW={K.treeW}
          tabs={K.reel ? WORKSPACE.tabs.slice(0, 2) : WORKSPACE.tabs} status={WORKSPACE.status} lines={lines} firstLine={GEAR_SNIPPET_FIRST_LINE}
          fs={K.fs} lineH={K.lineH} codeLeft={K.codeLeft} rowTop={K.rowTop} rows={K.rows} titleH={K.titleH} tabsH={K.tabsH} statusH={K.statusH}
          activityW={K.activityW} paneRight={K.reel ? undefined : split.pos} paneBottom={K.reel ? split.pos : undefined}
          lineReveal={lineReveal} charAlpha={charAlpha} skeleton={skeleton} activeRow={f >= tm.streamA && f < tm.flyA ? activeRow : null}
          cursor={f >= tm.streamA - 2 && f < tm.flyA ? { row: activeRow, col: curCol, on: streaming >= 0 || blink } : null}
          chrome={chrome} uiScale={ui} />
      </div>

      {/* agent panel (master) — becomes the live viewport when the panel is resized */}
      {!K.reel && f < tm.rsB + 10 && (
        <div style={{ position: 'absolute', left: split.pos + 1, top: K.bodyTop, width: K.right - split.pos - 1, height: K.bodyBottom - K.bodyTop, background: W.panel,
          opacity: chrome * (1 - smoothStep(invLerp(tm.rsA + 2, tm.rsA + 14, f))), overflow: 'hidden' }}>
          <div style={{ height: K.tabsH, borderBottom: `1px solid ${W.line}`, display: 'flex', alignItems: 'center', padding: '0 16px', gap: 10,
            fontFamily: F.text, fontSize: 13, letterSpacing: '0.12em', fontWeight: 650, color: W.mute }}>
            <span style={{ width: 8, height: 8, borderRadius: 4, background: C.cyan, boxShadow: `0 0 8px ${C.cyan}` }} />AGENT
          </div>
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ borderRadius: 10, padding: '14px 16px', minHeight: 92, background: sent ? W.panel2 : '#0D1322',
              border: `1px solid ${sent ? W.line : `rgba(92,225,255,${0.45 + 0.4 * sendFlash})`}`, boxShadow: sent ? 'none' : '0 0 0 3px rgba(92,225,255,0.08)',
              fontFamily: F.text, fontSize: 25, lineHeight: 1.3, color: typed ? C.lunar : W.mute, fontWeight: 500 }}>
              {typed || 'Describe what to build'}
              {!sent && typed.length < CODE_PROMPT.length && f >= tm.promptA - 4 && <span style={{ display: 'inline-block', width: 2, height: 26, marginLeft: 2, background: C.cyan, verticalAlign: -4 }} />}
            </div>
            {WORKSPACE.agentSteps.map((st, i) => {
              const at = [tm.send + 4, tm.send + 12, tm.rsA - 4][i];
              const done = [tm.send + 12, tm.streamA + K.rows * tm.stagger + tm.wipe, 1e9][i];
              const a = smoothStep(invLerp(at, at + 6, f));
              const prog = i === 1 ? clamp((f - tm.streamA) / (K.rows * tm.stagger + tm.wipe)) : f >= done ? 1 : 0;
              return (
                <div key={i} style={{ opacity: a, transform: `translateY(${(1 - a) * 8}px)`, fontFamily: F.mono, fontSize: 15, color: f >= done ? W.text : '#AEB8CB' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {f >= done ? <span style={{ width: 9, height: 9, borderRadius: 5, background: C.cyan }} />
                      : <svg width="12" height="12" viewBox="0 0 12 12" style={{ transform: `rotate(${f * 18}deg)` }}><path d="M6 1a5 5 0 1 1-5 5" fill="none" stroke={C.cyan} strokeWidth="2" /></svg>}
                    {st}
                  </div>
                  {i === 1 && <div style={{ marginTop: 8, marginLeft: 21, height: 3, borderRadius: 2, background: W.line }}><div style={{ width: `${prog * 100}%`, height: 3, borderRadius: 2, background: C.cyan }} /></div>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* reel prompt: an inline prompt box over the editor */}
      {K.reel && f < tm.send + 10 && (
        <div style={{ position: 'absolute', left: K.codeLeft - 40, top: K.rowTop + 10, width: K.right - K.codeLeft + 10, height: 74, borderRadius: 12, background: '#0D1322',
          border: `1px solid rgba(92,225,255,${0.5 + 0.4 * sendFlash})`, boxShadow: '0 18px 50px rgba(0,0,0,0.5), 0 0 0 3px rgba(92,225,255,0.08)', display: 'flex', alignItems: 'center',
          gap: 14, padding: '0 20px', fontFamily: F.text, fontSize: 30, color: C.lunar, opacity: chrome * (1 - smoothStep(invLerp(tm.send + 2, tm.send + 10, f))),
          transform: `scaleY(${1 - 0.3 * smoothStep(invLerp(tm.send + 2, tm.send + 10, f))})` }}>
          <span style={{ color: C.cyan, fontFamily: F.mono, fontWeight: 700 }}>›</span>
          <span>{typed || <span style={{ color: W.mute }}>Describe what to build</span>}</span>
          {typed.length < CODE_PROMPT.length && f >= tm.promptA && <span style={{ width: 2, height: 30, background: C.cyan, marginLeft: -12 }} />}
        </div>
      )}

      {/* snap-to-grid guides while the panel is dragged */}
      {f >= tm.rsA - 2 && f < tm.rsB + 16 && K.grid.map((g, i) => {
        const near = g === split.snapped;
        const a = smoothStep(invLerp(tm.rsA - 2, tm.rsA + 4, f)) * (1 - smoothStep(invLerp(tm.rsB + 4, tm.rsB + 16, f)));
        const inRange = K.reel ? g > K.splitTo - 60 && g < K.splitFrom : g >= K.grid[5] && g <= K.grid[10];
        if (!inRange) return null;
        const flash = near && f > tm.rsB ? Math.exp(-(f - tm.rsB) / 5) : 0;
        const st: React.CSSProperties = K.reel
          ? { left: K.win.x + K.activityW, top: g - 0.5, width: K.win.w - K.activityW, height: 1, backgroundImage: `linear-gradient(90deg, ${C.cyan} 50%, transparent 50%)`, backgroundSize: '10px 1px' }
          : { left: g - 0.5, top: K.bodyTop + K.tabsH, width: 1, height: K.bodyBottom - K.bodyTop - K.tabsH, backgroundImage: `linear-gradient(180deg, ${C.cyan} 50%, transparent 50%)`, backgroundSize: '1px 10px' };
        return <div key={i} style={{ position: 'absolute', ...st, opacity: a * (near ? 0.75 + flash : 0.22) }} />;
      })}

      {/* live viewport */}
      {f >= tm.rsA && (
        <div style={{ position: 'absolute', left: vp.x, top: vp.y, width: vp.w, height: vp.h, opacity: vpOpen, background: '#080C16', overflow: 'hidden',
          borderLeft: K.reel || exp > 0.5 ? 'none' : `1px solid ${W.line}`, borderTop: K.reel && exp < 0.5 ? `1px solid ${W.line}` : 'none',
          borderRadius: K.reel ? `0 0 ${12 * (1 - exp)}px ${12 * (1 - exp)}px` : `0 ${12 * (1 - exp)}px 0 0` }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(90% 80% at 50% 45%, rgba(30,44,78,0.55) 0%, rgba(8,12,22,0) 70%)', opacity: 1 - exp }} />
          <div style={{ height: 36, opacity: 1 - exp, borderBottom: `1px solid ${W.line}`, background: W.panel, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 14px', fontFamily: F.text, fontSize: 14 * ui, color: W.mute }}>
            <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
              <span style={{ color: W.text, display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ width: 7, height: 7, borderRadius: 4, background: C.cyan }} />Preview</span>
              <span>Scene</span>
            </div>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', fontFamily: F.mono, fontSize: 12.5 * ui }}>
              <span>Perspective</span>
              <span style={{ padding: '2px 8px', borderRadius: 10, border: `1px solid rgba(92,225,255,0.4)`, color: C.cyan }}>● Live</span>
            </div>
          </div>
        </div>
      )}

      {/* the 3D world (also draws the edges flying out of the code) */}
      {f >= tm.flyA - 8 && (
        <ThreeStage style={{ clipPath }} exposure={1.05}>
          <GearScene f={f} tm={tm} L={L} cam={cam} a0={a0} cells={cells} others={others} plateOut={plateOut} body={body} g0Hot={g0Hot} wireOut={wireOut} floorA={floorA} retract={retract} />
        </ThreeStage>
      )}

      {/* viewport overlays */}
      {f >= tm.rsA && exp < 0.99 && (
        <div style={{ opacity: vpOpen * (1 - exp) }}>
          <Gizmo x={body.x + body.w - 70} y={body.y + body.h - 70} dirs={gz} a={0.85} />
          <div style={{ position: 'absolute', left: body.x + 16, top: body.y + 12, fontFamily: F.mono, fontSize: 13 * ui, color: W.mute }}>{GEAR_SNIPPET_FILE}</div>
        </div>
      )}
      {cursor}

      {/* type */}
      <TypeBlock f={f} tm={tm} K={K} L={L} out={typeOut} />

      <ProvenanceLabel kind="B" note="Code and scene written for this film — not Kimi output" at={K.reel ? 2 : 6} />
    </AbsoluteFill>
  );
};

/** "CODING → INTERACTIVE WORLDS" + the capability lines (verifiedClaims) + attribution */
const TypeBlock: React.FC<{ f: number; tm: TM; K: LK; L: Layout; out: number }> = ({ f, tm, K, L, out }) => {
  if (f < tm.titleA - 1 || out >= 1) return null;
  const size = K.reel ? 52 : 60;
  const left = K.reel ? L.safe.side : 112;
  const top = K.reel ? 376 : 590;
  const capSize = K.reel ? 24 : 21;
  const capA = (at: number) => smoothStep(invLerp(at, at + 10, f));
  const caps = [CLAIMS.threejs.display, CLAIMS.engines.display];
  const scrimA = K.reel ? 0 : smoothStep(invLerp(tm.titleA - 6, tm.titleA + 10, f)) * (1 - out);
  return (
    <>
      {scrimA > 0 && <div style={{ position: 'absolute', left: K.win.x, top: 430, width: K.grid[6] - K.win.x, height: K.bodyBottom - 430,
        background: 'linear-gradient(180deg, rgba(11,15,26,0) 0%, rgba(11,15,26,0.9) 38%, rgba(11,15,26,0.96) 100%)', opacity: scrimA }} />}
      <div style={{ position: 'absolute', left, top, opacity: 1 - out, transform: `translateY(${out * 18}px)`, zIndex: 40 }}>
        <KineticTitle text="CODING →" fx="decode" at={tm.titleA} size={size} weight={700} />
        <div style={{ height: size * 0.2 }} />
        <div style={{ display: 'flex', gap: size * 0.3 }}>
          <KineticTitle text="INTERACTIVE" fx="build" at={tm.titleB} size={size} weight={700} />
          <KineticTitle text="WORLDS" fx="build" at={tm.titleC} size={size} weight={700} color="#FFFFFF" />
        </div>
        <div style={{ height: size * (K.reel ? 0.34 : 0.42) }} />
        {caps.map((t, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: i ? 8 : 0, opacity: capA(i ? tm.capB : tm.capA),
            transform: `translateX(${(1 - capA(i ? tm.capB : tm.capA)) * -14}px)`, fontFamily: F.mono, fontSize: capSize, letterSpacing: '0.06em', color: C.lunar, fontWeight: 560 }}>
            <span style={{ width: capSize * 0.42, height: capSize * 0.42, background: C.cyan, boxShadow: `0 0 10px ${C.cyan}` }} />{t}
          </div>
        ))}
        <SourceAttribution text={attributionText('threejs')} at={tm.attr} style={{ marginTop: K.reel ? 8 : 12 }} size={K.reel ? 24 : 17} />
      </div>
    </>
  );
};
