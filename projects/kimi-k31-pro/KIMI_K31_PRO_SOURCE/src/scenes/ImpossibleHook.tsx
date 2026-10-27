// 01 · THE IMPOSSIBLE HOOK (C, concept visualization)
// Frame 0 is a finished, luminous turbofan fan stage in a black void. Its meshes dissolve into their own vertices; the
// vertices stream into rows that resolve into monospace code (the turbine's real source), while the camera races
// backward and a terminal pane resolves around the rows. The rows fold into ONE prompt line. Kinetic type:
// "ONE PROMPT." (decode) -> "AN ENTIRE WORLD." (build). Exit: everything collapses into one cyan-white point at the
// centre (r = 6 px) on near-black, where scene 02 begins.
import React, { useLayoutEffect, useMemo } from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import * as THREE from 'three';
import { Env, ThreeStage } from '../three/stage';
import { buildTurbine, cutMaterial, dissolveLineMaterial, dissolveMetric, ViewCam, type V3 } from '../three/MechanicalAssembly';
import { HOOK_PROMPT, TURBINE_SNIPPET, WORKSPACE } from '../data/codingSnippet';
import { KineticTitle } from '../components/KineticTitle';
import { ProvenanceLabel } from '../components/ProvenanceLabel';
import { charColors } from '../components/CodeEditor';
import { clamp, easeInCubic, easeInOutCubic, easeOutCubic, invLerp, lerp, smoothStep } from '../lib/anim';
import { mulberry32 } from '../lib/rng';
import { useLayout, type Layout } from '../lib/layout';
import { C, WORLD } from '../styles/theme';
import { F } from '../styles/typography';
import type { SceneProps } from './types';

// ------------------------------------------------------------------------------------------------ timing
/** all phase frames as fractions of dur (master 7.2 s; the 5.4 s reel drops nothing but runs a tighter table) */
function timeline(dur: number, reel: boolean) {
  const r = (x: number) => Math.round(x * dur);
  const travel = Math.round(clamp(dur * 0.11, 16, 24));
  const k = reel
    ? { heroEnd: 0.13, d0: 0.11, d1: 0.34, p0: 0.14, p1: 0.49, z0: 0.2, chrome0: 0.36, fold0: 0.5, fold1: 0.6, one: 0.56, all: 0.61, label: 0.6 }
    : { heroEnd: 0.17, d0: 0.14, d1: 0.4, p0: 0.18, p1: 0.52, z0: 0.24, chrome0: 0.38, fold0: 0.555, fold1: 0.655, one: 0.62, all: 0.68, label: 0.6 };
  return {
    heroEnd: r(k.heroEnd),
    d0: r(k.d0), d1: r(k.d1), travel,          // dissolve front; vertex travel time
    p0: r(k.p0), p1: r(k.p1),                  // 3D pull-back (exponential ease-in)
    z0: r(k.z0),                               // terminal layer zoom-out start (ends at p1)
    chrome0: r(k.chrome0),                     // terminal chrome resolves
    fold0: r(k.fold0), fold1: r(k.fold1),      // code rows fold into the prompt line
    one: r(k.one), all: r(k.all),              // kinetic type
    label: r(k.label),
    c0: dur - 12,                              // collapse into the point
  };
}

const CUT0 = 0.28, CUT1 = 1.32;

// ------------------------------------------------------------------------------------------------ layout
function terminalLayout(L: Layout) {
  const tall = L.tall;
  const fs = tall ? 32 : 34, cw = fs * 0.6, lineH = tall ? 44 : 46;
  const rows = ['> ' + HOOK_PROMPT, ...TURBINE_SNIPPET];
  const n = rows.length;
  const w = tall ? L.w - 2 * L.safe.side : 1240;
  const x0 = (L.w - w) / 2, padX = tall ? 30 : 40, padY = tall ? 20 : 22, barH = 36;
  const textLeft = x0 + padX;
  const tallH = barH + 2 * padY + n * lineH, shortH = barH + 2 * padY + lineH;
  const tallTop = (tall ? 930 : L.h / 2) - tallH / 2;
  const promptY = tall ? 880 : L.h / 2;                    // final prompt row centre
  const shortTop = promptY - barH - padY - lineH / 2;
  const rowY0 = tallTop + barH + padY + lineH / 2;          // row 0 centre in the tall pane
  const origin: [number, number] = tall ? [500, 930] : [L.w / 2, L.h / 2];
  const zoom0 = tall ? 1.2 : 1.55;
  const centre: [number, number] = [L.w / 2, L.h / 2];
  return { fs, cw, lineH, rows, n, w, x0, padX, padY, barH, textLeft, tallH, shortH, tallTop, shortTop, promptY, rowY0, origin, zoom0, centre };
}
type TL = ReturnType<typeof terminalLayout>;

// ------------------------------------------------------------------------------------------------ vertex stream
interface Stream { geo: THREE.BufferGeometry; arr: Float32Array; cells: { r: number; c: number; x: number; y: number }[] }

function buildStream(cloud: { pos: Float32Array; n: Float32Array; count: number }, rMax: number, rotor: Uint8Array, T: TL, tm: TM): Stream {
  const cells: Stream['cells'] = [];
  T.rows.forEach((line, r) => line.split('').forEach((ch, c) => { if (ch !== ' ') cells.push({ r, c, x: T.textLeft + c * T.cw, y: T.rowY0 + r * T.lineH }); }));
  const N = cloud.count, rnd = mulberry32(77);
  const appear = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const m = dissolveMetric(cloud.pos[i * 3], cloud.pos[i * 3 + 1], cloud.n[i], rMax);
    appear[i] = tm.d0 + ((m - CUT0) / (CUT1 - CUT0)) * (tm.d1 - tm.d0);
  }
  const order = Array.from({ length: N }, (_, i) => i).sort((a, b) => appear[a] - appear[b]);
  const target = new Float32Array(N * 2), seed = new Float32Array(N * 3), hold = new Float32Array(N), cellOf = new Int32Array(N);
  const arr = new Float32Array(cells.length).fill(0);
  order.forEach((i, k) => {
    const ci = Math.min(cells.length - 1, Math.floor((k / N) * cells.length)), cell = cells[ci];
    target[i * 2] = cell.x + T.cw * (0.1 + 0.8 * rnd());
    target[i * 2 + 1] = cell.y + (rnd() - 0.5) * T.fs * 0.16;
    seed[i * 3] = rnd(); seed[i * 3 + 1] = rnd(); seed[i * 3 + 2] = rnd();
    cellOf[i] = ci;
    arr[ci] = Math.max(arr[ci], appear[i] + 4 + tm.travel * (0.8 + 0.4 * seed[i * 3 + 2]));
  });
  for (let i = 0; i < N; i++) hold[i] = arr[cellOf[i]] + 1;
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(cloud.pos, 3));
  geo.setAttribute('aTarget', new THREE.BufferAttribute(target, 2));
  geo.setAttribute('aT', new THREE.BufferAttribute(appear, 1));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 3));
  geo.setAttribute('aHold', new THREE.BufferAttribute(hold, 1));
  geo.setAttribute('aRot', new THREE.BufferAttribute(new Float32Array(rotor), 1));
  return { geo, arr, cells };
}

function streamMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: {
      uF: { value: 0 }, uTravel: { value: 24 }, uZoom: { value: 1 }, uDepth: { value: 4 }, uTanHalf: { value: Math.tan((15 * Math.PI) / 180) },
      uRes: { value: new THREE.Vector2(1920, 1080) }, uOrigin: { value: new THREE.Vector2(960, 540) }, uOff: { value: new THREE.Vector2(0, 0) },
      uSpin: { value: 0 }, uSize: { value: 2.4 }, uScale: { value: 1 },
    },
    vertexShader: `
      attribute vec2 aTarget; attribute float aT; attribute vec3 aSeed; attribute float aHold; attribute float aRot;
      uniform float uF, uTravel, uZoom, uDepth, uTanHalf, uSpin, uSize, uScale; uniform vec2 uRes, uOrigin, uOff;
      varying float vA; varying float vHot;
      vec3 pxToView(vec2 px) {
        vec2 q = px + uOff; float k = 2.0 * uTanHalf * uDepth / uRes.y;
        return vec3((q.x - 0.5 * uRes.x) * k, -(q.y - 0.5 * uRes.y) * k, -uDepth);
      }
      void main() {
        float a = uSpin * aRot, ca = cos(a), sa = sin(a);
        vec3 lp = vec3(position.x * ca - position.y * sa, position.x * sa + position.y * ca, position.z);
        float trav = uTravel * (0.8 + 0.4 * aSeed.z);
        float t = clamp((uF - aT - 4.0) / trav, 0.0, 1.0);
        float e = t < 0.5 ? 4.0 * t * t * t : 1.0 - pow(-2.0 * t + 2.0, 3.0) / 2.0;
        vec3 p0 = (modelViewMatrix * vec4(lp, 1.0)).xyz;
        vec3 p3 = pxToView(uOrigin + (aTarget - uOrigin) * uZoom);
        vec3 dir = normalize(vec3(aSeed.x - 0.5, aSeed.y - 0.5, aSeed.z - 0.3) + 1e-4);
        vec3 p1 = p0 + dir * (0.25 + 0.3 * aSeed.z) + vec3(0.0, 0.0, 0.9);
        vec3 p2 = p3 + vec3(-0.42 * uDepth * (0.5 + 0.5 * aSeed.x), (aSeed.y - 0.5) * 0.03 * uDepth, -0.12 * uDepth);
        float u = 1.0 - e;
        vec3 p = u * u * u * p0 + 3.0 * u * u * e * p1 + 3.0 * u * e * e * p2 + e * e * e * p3;
        gl_Position = projectionMatrix * vec4(p, 1.0);
        float appear = smoothstep(aT - 3.0, aT + 1.0, uF);
        float handoff = 1.0 - smoothstep(aHold, aHold + 7.0, uF);
        vA = appear * handoff * mix(1.0, 0.5, sin(3.14159 * t));
        vHot = 1.0 - smoothstep(0.0, 0.35, t) + 0.6 * smoothstep(0.85, 1.0, t);
        float sz = mix(uSize * 1.5 * clamp(9.0 / -p0.z, 0.5, 2.5), uSize * pow(uZoom, 0.8), e);
        gl_PointSize = sz * uScale;
      }`,
    fragmentShader: `
      varying float vA; varying float vHot;
      void main() {
        vec2 d = gl_PointCoord - 0.5;
        float a = exp(-dot(d, d) * 12.0);
        vec3 c = mix(vec3(0.36, 0.88, 1.0), vec3(0.92, 0.99, 1.0), clamp(vHot, 0.0, 1.0));
        gl_FragColor = vec4(c, a * vA * 0.9);
      }`,
  });
}

// ------------------------------------------------------------------------------------------------ 3D
interface CamPose { pos: V3; target: V3; fov: number }

function camPose(f: number, tm: TM, tall: boolean): { pose: CamPose; pull: number } {
  const d0 = tall ? 20.5 : 11.8, dMacro = tall ? 16.8 : 9.4, dFar = tall ? 90 : 52;
  const macro = easeInOutCubic(invLerp(0, tm.heroEnd + 18, f));
  const u = invLerp(tm.p0, tm.p1, f);
  const ex = (Math.pow(2, 6 * u) - 1) / 63;                   // exponential ease-in (HeroPullback)
  const dist = lerp(d0, dMacro, macro) * Math.pow(dFar / lerp(d0, dMacro, macro), ex);
  const yaw = lerp(0.62, 0.5, macro) - 0.22 * ex - 0.0012 * f;
  const pitch = lerp(0.2, 0.15, macro);
  const tgtMacro: V3 = tall ? [0.35, 0.55, 0.15] : [0.62, 0.62, 0.2];
  const k = macro * (1 - ex);
  const target: V3 = [tgtMacro[0] * k, tgtMacro[1] * k, tgtMacro[2] * k];
  const pos: V3 = [target[0] + dist * Math.cos(pitch) * Math.sin(yaw), target[1] + dist * Math.sin(pitch), target[2] + dist * Math.cos(pitch) * Math.cos(yaw)];
  return { pose: { pos, target, fov: 30 }, pull: ex };
}

type TM = ReturnType<typeof timeline>;
const TurbineWorld: React.FC<{ f: number; tm: TM; T: TL; L: Layout }> = ({ f, tm, T, L }) => {
  const geo = useMemo(() => buildTurbine(), []);
  const rotor = useMemo(() => {
    // which cloud vertices spin with the rotor (blades + hub come first in the cloud)
    const n = geo.blades.attributes.position.count + geo.hub.attributes.position.count;
    const a = new Uint8Array(geo.cloud.count); a.fill(1, 0, n); return a;
  }, [geo]);
  const stream = useMemo(() => buildStream(geo.cloud, geo.rMax, rotor, T, tm), [geo, rotor, T, tm]);
  const mats = useMemo(() => ({
    blades: cutMaterial({ color: '#B9C2CF', metalness: 1, roughness: 0.2, side: THREE.DoubleSide }, 0, -1, geo.rMax),
    hub: cutMaterial({ color: '#4E596E', metalness: 1, roughness: 0.3 }, 0, -1, geo.rMax),
    casing: cutMaterial({ color: '#5F697B', metalness: 1, roughness: 0.26, side: THREE.DoubleSide }, 0, -1, geo.rMax),
    stator: cutMaterial({ color: '#3F495C', metalness: 0.9, roughness: 0.42, side: THREE.DoubleSide }, 0, -1, geo.rMax),
    rings: cutMaterial({ color: '#B4BDCC', metalness: 1, roughness: 0.22 }, 0, -1, geo.rMax),
    edges: dissolveLineMaterial(false), glow: dissolveLineMaterial(true, 5), spiral: dissolveLineMaterial(false),
    stream: streamMaterial(),
    dust: new THREE.PointsMaterial({ color: '#9DB4D6', size: 0.035, sizeAttenuation: true, transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending }),
  }), [geo]);
  const spiralLine = useMemo(() => new THREE.Line(geo.spiral, mats.spiral), [geo, mats]);
  const dust = useMemo(() => {
    const r = mulberry32(5), p = new Float32Array(900 * 3);
    for (let i = 0; i < 900; i++) { const a = r() * Math.PI * 2, z = r() * 2 - 1, rad = 4 + r() * 26, s = Math.sqrt(1 - z * z); p[i * 3] = rad * s * Math.cos(a); p[i * 3 + 1] = rad * s * Math.sin(a) * 0.7; p[i * 3 + 2] = rad * z; }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3)); return g;
  }, []);

  const { pose, pull } = camPose(f, tm, L.tall);
  const spin = 0.0105 * f + 0.4;
  const cut = lerp(CUT0, CUT1, invLerp(tm.d0, tm.d1, f)) - (f < tm.d0 ? 1 : 0);
  const impact = Math.exp(-f / 6);
  const zoom = zoomAt(f, tm, T);
  const cx = L.tall ? L.w / 2 : L.w / 2, cy = L.tall ? 720 : L.h / 2;

  useLayoutEffect(() => {
    [mats.blades, mats.hub, mats.casing, mats.stator, mats.rings].forEach(({ u }) => { u.uCut.value = cut; u.uFlash.value = 0.025 * impact; u.uR.value = geo.rMax; });
    [mats.edges, mats.glow, mats.spiral].forEach((m) => { m.uniforms.uCut.value = cut; m.uniforms.uR.value = geo.rMax; m.uniforms.uFlash.value = 1.6 * impact; });
    mats.edges.uniforms.uAlpha.value = 1; mats.glow.uniforms.uAlpha.value = 0.55; mats.spiral.uniforms.uAlpha.value = 0.85;
    mats.glow.uniforms.uScale.value = L.h / 1080 * (L.tall ? 0.8 : 1);
    mats.spiral.uniforms.uColor.value.set('#DDF7FF');
    const s = mats.stream.uniforms;
    s.uF.value = f; s.uTravel.value = tm.travel; s.uZoom.value = zoom; s.uSpin.value = spin; s.uRes.value.set(L.w, L.h);
    s.uOrigin.value.set(T.origin[0], T.origin[1]); s.uOff.value.set(L.w / 2 - cx, L.h / 2 - cy); s.uScale.value = L.h / 1080 * (L.tall ? 0.85 : 1);
    mats.dust.opacity = 0.45;
  });

  const light = 1 - 0.85 * clamp(pull * 1.4);
  return (
    <>
      <ViewCam pos={pose.pos} target={pose.target} fov={pose.fov} cx={cx} cy={cy} />
      <Env intensity={0.42 * light} />
      <ambientLight intensity={0.05} />
      <directionalLight position={[-6, 8, -5]} intensity={6.5 * light} color="#D4E6FF" />
      <directionalLight position={[7, 1.5, 9]} intensity={1.1 * light} color="#E8EEF8" />
      <directionalLight position={[2, -6, 4]} intensity={0.35 * light} color="#5CE1FF" />
      <group rotation={[0, 0, spin]}>
        <mesh geometry={geo.blades} material={mats.blades.m} />
        <mesh geometry={geo.hub} material={mats.hub.m} />
        <lineSegments geometry={geo.edges} material={mats.edges} />
        <points geometry={geo.glow} material={mats.glow} />
        <primitive object={spiralLine} />
      </group>
      <mesh geometry={geo.casing} material={mats.casing.m} />
      <mesh geometry={geo.stator} material={mats.stator.m} />
      <mesh geometry={geo.rings} material={mats.rings.m} />
      <points geometry={stream.geo} material={mats.stream} frustumCulled={false} />
      <points geometry={dust} material={mats.dust} />
    </>
  );
};

/** terminal-layer zoom: big while the rows form, exponential ease-in to 1 (the pull-back), a small lock settle */
function zoomAt(f: number, tm: TM, T: TL) {
  if (f >= tm.p1) { const t = f - tm.p1; return 1 - 0.016 * Math.exp(-t / 5) * Math.sin(t / 2.1); }
  const u = invLerp(tm.z0, tm.p1, f), ex = (Math.pow(2, 6 * u) - 1) / 63;
  return Math.pow(T.zoom0, 1 - ex);
}

// ------------------------------------------------------------------------------------------------ scene
export const ImpossibleHook: React.FC<SceneProps> = ({ dur, variant }) => {
  const f = useCurrentFrame();
  const L = useLayout();
  const tm = useMemo(() => timeline(dur, variant === 'reel'), [dur, variant]);
  const T = useMemo(() => terminalLayout(L), [L.w, L.h]); // eslint-disable-line react-hooks/exhaustive-deps
  // arrival frame of every character (same computation the 3D stream uses)
  const arrivals = useMemo(() => {
    const geo = buildTurbineArrivalsOnly(T, tm);
    return geo;
  }, [T, tm]);

  const zoom = zoomAt(f, tm, T);
  const [ox, oy] = T.origin;
  const fold = easeInOutCubic(invLerp(tm.fold0, tm.fold1, f));
  const chromeA = smoothStep(invLerp(tm.chrome0, tm.p1, f));
  const lock = f >= tm.p1 ? Math.exp(-(f - tm.p1) / 6) : 0;
  const c = clamp((f - tm.c0) / 12);                         // collapse progress
  const termTop = lerp(T.tallTop, T.shortTop, fold), termH = lerp(T.tallH, T.shortH, fold);
  const promptY = lerp(T.rowY0, T.promptY, fold);
  const blinkOn = Math.floor((f - tm.p1) / 14) % 2 === 0;
  const [cx, cy] = T.centre;

  // a char's position (layout px) and alpha: the code rows fold into the prompt row with the same ease as the pane
  const charState = (r: number, col: number) => {
    let y = T.rowY0 + r * T.lineH, a = 1, sy = 1;
    if (r === 0) y = promptY;
    else {
      y = lerp(T.rowY0 + r * T.lineH, promptY, fold);
      a = 1 - smoothStep(invLerp(0.25, 0.8, fold + (r - 1) * 0.012));
      sy = 1 - 0.75 * fold;
    }
    return { x: T.textLeft + col * T.cw, y, a, sy };
  };

  const rowsEls: React.ReactNode[] = [];
  T.rows.forEach((line, r) => {
    const cols = r === 0 ? null : charColors(line);
    line.split('').forEach((ch, col) => {
      if (ch === ' ') return;
      const key = `${r}-${col}`;
      const arr = arrivals.get(key) ?? 1e9;
      if (!Number.isFinite(arr)) return;
      const resolve = smoothStep(invLerp(arr - 2, arr + 6, f));
      if (resolve <= 0) return;
      const s = charState(r, col);
      let { x, y } = s;
      let a = s.a * resolve, sc = 1, blur = 0;
      const color = r === 0 ? (col < 2 ? C.cyan : C.lunar) : (cols ? cols[col] : C.lunar);
      // collapse: every character falls into the centre point, far ones first
      if (r === 0 && f >= tm.c0) {
        // positions are in layout px; zoom is 1 by now
        const d = Math.hypot(x + T.cw / 2 - cx, y - cy), dmax = T.cw * 30;
        const st = tm.c0 + 4 * clamp(1 - d / dmax);
        const q = easeInCubic(invLerp(st, st + 6, f));
        x = lerp(x, cx - T.cw / 2, q); y = lerp(y, cy, q); sc = 1 - 0.8 * q; a *= 1 - smoothStep(invLerp(0.75, 1, q)); blur = q * 2;
      }
      if (a <= 0.003) return;
      rowsEls.push(
        <span key={key} style={{ position: 'absolute', left: x, top: y - T.lineH / 2, width: T.cw, height: T.lineH, display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontFamily: F.mono, fontSize: T.fs, fontWeight: r === 0 ? 560 : 420, color: f >= tm.c0 && r === 0 ? '#E8FBFF' : color,
          opacity: a * (r === 0 ? 1 : 0.88), transform: `scale(${sc}, ${sc * s.sy})`, filter: blur > 0.05 ? `blur(${blur}px)` : undefined,
          textShadow: r === 0 ? `0 0 ${10 + 26 * lock}px rgba(92,225,255,${0.35 + 0.5 * lock + (f >= tm.c0 ? 0.6 : 0)})` : '0 0 8px rgba(92,225,255,0.25)',
          fontVariantLigatures: 'none' }}>{ch}</span>,
      );
    });
  });

  // terminal pane (layout px); fades out at the start of the collapse
  const paneA = chromeA * (1 - smoothStep(invLerp(tm.c0, tm.c0 + 5, f)));
  const cursorCol = T.rows[0].length + 0.15;
  const cursorA = f >= tm.p1 - 4 && f < tm.c0 && blinkOn ? 1 : 0;

  // kinetic type: collapses into the point too
  const typeCollapse = easeInCubic(invLerp(tm.c0, tm.c0 + 8, f));
  const typeStyle = (cy0: number): React.CSSProperties => ({
    position: 'absolute', left: 0, right: 0, top: cy0, display: 'flex', justifyContent: 'center', gap: L.t.title * 0.32,
    transformOrigin: `${cx}px ${cy - cy0}px`, transform: `scale(${1 - 0.97 * typeCollapse})`, opacity: 1 - smoothStep(invLerp(0.55, 0.95, typeCollapse)),
    filter: typeCollapse > 0.02 ? `blur(${typeCollapse * 6}px)` : undefined,
  });
  const titleSize = L.t.title;
  const oneTop = L.tall ? 650 : T.shortTop - 64 - titleSize;
  const allTop = L.tall ? 990 : T.shortTop + T.shortH + 58;

  // the hand-off point
  const pr = 6 * easeOutCubic(invLerp(tm.c0 + 1, tm.c0 + 10, f));
  const glowA = clamp((f - tm.c0) / 8);

  // background: void, slightly lifted around the turbine at the start, near-black at the end
  const bgLift = (1 - clamp(f / (tm.p1 || 1))) * (1 - c);

  return (
    <AbsoluteFill style={{ background: C.void, overflow: 'hidden' }}>
      <AbsoluteFill style={{ background: `radial-gradient(70% 60% at 50% ${L.tall ? '37%' : '50%'}, rgba(20,34,72,${0.55 * bgLift + 0.12 * (1 - c)}) 0%, rgba(3,5,11,0) 70%)` }} />
      {f < tm.c0 + 2 && (
        <ThreeStage exposure={1.05}>
          <TurbineWorld f={f} tm={tm} T={T} L={L} />
        </ThreeStage>
      )}
      {/* terminal layer (zooms with the pull-back) */}
      <AbsoluteFill style={{ transformOrigin: `${ox}px ${oy}px`, transform: `scale(${zoom})` }}>
        {paneA > 0.002 && (
          <div style={{ position: 'absolute', left: T.x0, top: termTop, width: T.w, height: termH, borderRadius: 14, overflow: 'hidden',
            background: `rgba(11,15,26,${0.86 * paneA})`, border: `1px solid rgba(150,180,225,${0.26 * paneA})`,
            boxShadow: `0 30px 90px rgba(0,0,0,${0.5 * paneA}), 0 0 ${40 + 60 * lock}px rgba(92,225,255,${(0.06 + 0.25 * lock) * paneA})` }}>
            <div style={{ height: T.barH, borderBottom: `1px solid rgba(150,180,225,${0.14 * paneA})`, background: `rgba(16,22,38,${0.9 * paneA})`, display: 'flex',
              alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              {['#FF5F57', '#FEBC2E', '#28C840'].map((col, i) => (
                <div key={i} style={{ position: 'absolute', left: 16 + i * 20, top: T.barH / 2 - 6, width: 12, height: 12, borderRadius: 6, background: col, opacity: 0.7 * paneA }} />
              ))}
              <div style={{ fontFamily: F.text, fontSize: L.tall ? 20 : 15, color: WORLD.code.mute, opacity: paneA }}>{WORKSPACE.terminalTitle}</div>
            </div>
          </div>
        )}
        {rowsEls}
        {cursorA > 0 && (
          <div style={{ position: 'absolute', left: T.textLeft + cursorCol * T.cw, top: promptY - T.fs * 0.55, width: T.cw * 0.9, height: T.fs * 1.1,
            background: 'rgba(232,251,255,0.9)', boxShadow: '0 0 14px rgba(92,225,255,0.8)' }} />
        )}
      </AbsoluteFill>
      {/* kinetic type */}
      {f >= tm.one && f < dur - 1 && (
        <div style={typeStyle(oneTop)}>
          <KineticTitle text="ONE PROMPT." fx="decode" at={tm.one} size={titleSize} weight={700} tracking={-0.005} />
        </div>
      )}
      {f >= tm.all && f < dur - 1 && (L.tall ? (
        <>
          <div style={typeStyle(allTop)}>
            <KineticTitle text="AN" fx="build" at={tm.all} size={titleSize} weight={700} />
            <KineticTitle text="ENTIRE" fx="build" at={tm.all + 3} size={titleSize} weight={700} />
          </div>
          <div style={typeStyle(allTop + titleSize * 1.12)}><KineticTitle text="WORLD." fx="build" at={tm.all + 7} size={titleSize} weight={700} color="#FFFFFF" /></div>
        </>
      ) : (
        <div style={typeStyle(allTop)}>
          <KineticTitle text="AN" fx="build" at={tm.all} size={titleSize} weight={700} />
          <KineticTitle text="ENTIRE" fx="build" at={tm.all + 3} size={titleSize} weight={700} />
          <KineticTitle text="WORLD." fx="build" at={tm.all + 9} size={titleSize} weight={700} color="#FFFFFF" />
        </div>
      ))}
      {/* the point scene 02 starts from */}
      {f >= tm.c0 && (
        <div style={{ position: 'absolute', left: cx - pr, top: cy - pr, width: 2 * pr, height: 2 * pr, borderRadius: '50%',
          background: 'radial-gradient(circle, #FFFFFF 0%, #E6FBFF 45%, #9BEBFF 100%)',
          boxShadow: `0 0 ${10 * glowA}px ${3 * glowA}px rgba(92,225,255,0.85), 0 0 ${36 * glowA}px ${10 * glowA}px rgba(92,225,255,0.22)` }} />
      )}
      {/* provenance: subtle and late (frame 0 stays clean); leaves before the collapse */}
      <AbsoluteFill style={{ opacity: 0.8 * (1 - smoothStep(invLerp(tm.c0 - 6, tm.c0, f))) }}>
        <ProvenanceLabel kind="C" at={tm.label} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** character arrival frames without touching WebGL (the DOM text resolves exactly when its vertices land) */
const arrivalCache = new Map<string, Map<string, number>>();
function buildTurbineArrivalsOnly(T: TL, tm: TM) {
  const key = `${T.textLeft}|${T.rowY0}|${tm.d0}|${tm.d1}|${tm.travel}`;
  const hit = arrivalCache.get(key);
  if (hit) return hit;
  const geo = buildTurbine();
  const n = geo.blades.attributes.position.count + geo.hub.attributes.position.count;
  const rotor = new Uint8Array(geo.cloud.count); rotor.fill(1, 0, n);
  const s = buildStream(geo.cloud, geo.rMax, rotor, T, tm);
  const m = new Map<string, number>();
  s.cells.forEach((c, i) => m.set(`${c.r}-${c.c}`, s.arr[i]));
  arrivalCache.set(key, m);
  return m;
}
