// The 3D world at time t. Stations: DESK (0,0,0), GRAPH (8,0,0), VAULT (16,0,-1), REPORT (-8,0,0), ATTRIB (24,0,0).
// Section times come from SCENE_TIMINGS.json (the measured voice); every pose, prop and camera is a pure function of t.
import React from 'react';
import * as THREE from 'three';
import T from '../../SCENE_TIMINGS.json';
import { Cam, type CamPose } from '../world/Camera';
import { Person, SIT, typing, recoil, mixJ, type Joints } from '../world/Person';
import { C, CallWindow, Columns, Desk, Graph, Laptop, Lens, NODES, Phone, RB, ReportPanel, Sandbox, Vault, Zip, type Screen } from '../world/props';

type V = [number, number, number];
export const sec = (id: string) => T.sections.find((s) => s.id === id)!;
export const wordT = (line: string, re: RegExp, fb: number) => T.lines.find((l) => l.id === line)?.words.find((w) => re.test(w.w))?.t0 ?? fb;
const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lin = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
export const E = { out: (x: number) => 1 - (1 - clamp(x)) ** 4, in: (x: number) => clamp(x) ** 3, inout: (x: number) => { x = clamp(x); return x < 0.5 ? 16 * x ** 5 : 1 - (-2 * x + 2) ** 5 / 2; } };
const V3 = (a: number[], b: number[], k: number) => a.map((x, i) => lerp(x, b[i], k)) as V;
const add = (p: V, d: V): V => [p[0] + d[0], p[1] + d[1], p[2] + d[2]];
const move = (t: number, t0: number, t1: number, a: CamPose, b: CamPose, ease = E.inout): CamPose => { const k = ease(lin(t, t0, t1)); return { pos: V3(a.pos, b.pos, k), look: V3(a.look, b.look, k), fov: lerp(a.fov ?? 40, b.fov ?? 40, k) }; };
const K = (pos: V, look: V, fov = 40): CamPose => ({ pos, look, fov });
const GRAPH: V = [8, 0, 0], VAULT: V = [16, 0, -1], REPORT: V = [-8, 0, 0], ATTRIB: V = [24, 0, 0];

/** one engineer at the desk; hoodie colour tells A (June) from B (Sept) */
function DeskScene({ t, pose, screen, hoodie, glow = 0, pov = false, children }: { t: number; pose: Joints; screen: Screen; hoodie: string; glow?: number; pov?: boolean; children?: React.ReactNode }) {
  return (
    <group>
      <Desk />
      <Laptop screen={screen} glow={glow} position={[0, 0.76, -0.05]} />
      {pov ? null : <Person pose={pose} hoodie={hoodie} position={[0, 0, 0.52]} rotation-y={Math.PI} mouth={0} />}
      {children}
    </group>
  );
}

function Lights({ warm = 1, alarm = 0 }: { warm?: number; alarm?: number }) {
  return (
    <>
      <ambientLight intensity={0.12} />
      <hemisphereLight args={['#8fa6ff', '#120a06', 0.35]} />
      <directionalLight position={[3, 6, 4]} intensity={1.6 * warm} color="#ffd8b0" castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-6} shadow-camera-right={6} shadow-camera-top={6} shadow-camera-bottom={-6} />
      <pointLight position={[-3, 2.5, -2]} intensity={25} distance={14} color={C.lav} />
      <pointLight position={[2.5, 1.2, 2]} intensity={18 + 40 * alarm} distance={10} color={alarm > 0 ? C.red : C.orange} />
    </>
  );
}

function Floor() {
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} receiveShadow><planeGeometry args={[200, 200]} /><meshStandardMaterial color="#0a0f1c" roughness={0.35} metalness={0.5} /></mesh>
      <gridHelper args={[200, 200, '#1a2540', '#111a2e']} position={[0, 0.002, 0]} />
    </group>
  );
}

export const World: React.FC<{ t: number }> = ({ t }) => {
  const S = (id: string) => sec(id), id = (T.sections.find((s) => t >= s.t0 && t < s.t1) ?? T.sections[T.sections.length - 1]).id, s = S(id), a = t - s.t0, d = s.t1 - s.t0;
  let cam: CamPose = K([2, 1.6, 3], [0, 1, 0]), body: React.ReactNode = null, shake = 0, alarm = 0;
  const hoodA = '#2b3a5a', hoodB = '#5a2a3a';
  if (id === 'hook') {
    if (t < 1.3) {                                   // the phone: interview invite, buzzing, then it glitches
      const buzz = Math.sin(t * 70) * 0.06 * (t < 0.9 ? 1 : 0);
      cam = move(t, 0, 1.3, K([0.05, 1.29, 0.5], [0, 1.25, 0.25], 36), K([0.04, 1.28, 0.45], [0, 1.24, 0.25], 34));
      body = <><DeskScene t={t} pose={SIT} screen={{ mode: 'call', a: 0.5 }} hoodie={hoodB} pov /><Phone a={t * 1.2} glitch={E.out(lin(t, 0.9, 1.2))} position={[0, 1.27, 0.25]} rotation={[0, 0, buzz]} /></>;
    } else if (t < 2.95) {                           // the vault blows open
      const k = t - 1.3;
      cam = move(t, 1.3, 2.95, K(add(VAULT, [0.4, 1.4, 4.2]), add(VAULT, [0, 1.6, 0]), 56), K(add(VAULT, [-0.6, 1.0, 6.8]), add(VAULT, [0, 1.6, 0]), 50), E.out);
      body = <group position={VAULT}><Vault open={E.out(lin(k, 0, 0.4))} flow={0.2 + k * 0.35} freeze={0} t={t} /></group>;
      shake = Math.max(0, 1 - k / 0.5) * 0.12;
    } else {                                          // back to the dark desk: it started with one call
      cam = move(t, 2.95, s.t1, K([0.55, 1.32, -0.95], [0, 1.22, 0.5], 32), K([0.4, 1.3, -0.75], [0, 1.24, 0.5], 30));
      body = <DeskScene t={t} pose={mixJ(typing(t), recoil(0.5), E.out(lin(t, 3.4, 3.8)))} screen={{ mode: 'alert', a: t }} hoodie={hoodB} glow={1} />;
      alarm = 1;
    }
  } else if (id === 'report' || (id === 'frozen' && a > 3.6)) {
    const imp = RB.impacted, abs = RB.absorb, frz = RB.frozen;
    const isFrozen = id === 'frozen', la = isFrozen ? a - 3.6 : a;
    const target = isFrozen ? abs : imp, lk = E.inout(lin(la, isFrozen ? 0.2 : 1.4, isFrozen ? 0.9 : 2.3));
    const y0 = isFrozen ? 700 : lerp(120, 650, E.inout(lin(la, 0.3, 1.6))), w = 3.4, hCss = 1100;
    const cx = lerp(640, target.x + target.w / 2, lk), cy = lerp(y0 + 300, target.y + target.h / 2, lk);
    const px = (cx / 1280 - 0.5) * w, py = (1 - (cy - y0) / hCss - 0.5) * w * (hCss / 1280);
    const lens2 = !isFrozen && la > 3.2 ? 1 : 0;
    const cx2 = frz.x + frz.w * 0.75, cy2 = frz.y + frz.h / 2 + 22;
    cam = move(la, 0, isFrozen ? 2.6 : d, K(add(REPORT, [0.4, 2.2, 6.4]), add(REPORT, [0, 2.1, 0]), 40), K(add(REPORT, [px * 0.3, 2.2 + py * 0.3, 5.2]), add(REPORT, [px * 0.4, 2.15 + py * 0.4, 0]), 40));
    body = (
      <group position={REPORT}>
        <ReportPanel y0={y0} hCss={hCss} w={w} position={[0, 2.2, 0]} glow={0.8} />
        {lk > 0 ? <Lens cx={cx} cy={cy} mag={2.4} panelW={w} radius={Math.max(0.001, 0.5 * E.out(lin(la, 1.0, 1.4)))} position={[px, 2.2 + py, 0.35]} /> : null}
        {lens2 ? <Lens cx={cx2} cy={cy2} mag={2.4} panelW={w} radius={Math.max(0.001, 0.38 * E.out(lin(la, 3.2, 3.6)))} position={[((cx2 / 1280) - 0.5) * w, 2.2 + (1 - (cy2 - y0) / hCss - 0.5) * w * (hCss / 1280) - 0.25, 0.45]} /> : null}
      </group>
    );
  } else if (id === 'june') {
    const scr: Screen = a < 2.2 ? { mode: 'search', a: a / 2.2 } : a < 4.2 ? { mode: 'download', a: (a - 2.2) / 2 } : { mode: 'alert', a: a - 4.2 };
    const pose = a < 4.2 ? typing(t) : mixJ(typing(t), recoil(1), E.out(lin(a, 4.2, 4.6)));
    cam = a < 2.2 ? move(a, 0, 2.2, K([0.35, 1.45, 1.05], [0, 0.95, -0.05], 38), K([0.25, 1.32, 0.78], [0, 0.92, -0.08], 34)) : a < 4.2 ? move(a, 2.2, 4.2, K([-1.3, 1.25, 1.2], [0, 1.0, 0.1], 40), K([-1.1, 1.28, 1.35], [0, 1.0, 0.15], 38))
      : move(a, 4.2, d, K([-0.5, 1.3, -0.9], [0, 1.2, 0.5], 32), K([-0.35, 1.28, -0.7], [0, 1.22, 0.5], 30));
    alarm = a > 4.2 ? 1 : 0;
    body = <DeskScene t={t} pose={pose} screen={scr} hoodie={hoodA} glow={alarm} />;
  } else if (id === 'sept') {
    const zipY = lerp(2.4, 0.8, E.out(lin(a, 3.2, 3.7))), scr: Screen = a < 3.6 ? { mode: 'call', a: a / 2.4 } : { mode: 'assignment', a: (a - 3.6) / 1.6 };
    cam = move(a, 0, d, K([1.6, 1.7, 2.6], [0, 1.45, -0.4], 42), K([0.9, 1.4, 1.8], [0, 1.15, -0.3], 38));
    body = (
      <DeskScene t={t} pose={a > 3.7 ? mixJ(typing(t), recoil(0.4), E.out(lin(a, 3.7, 4.2))) : typing(t)} screen={scr} hoodie={hoodB} glow={a > 4.6 ? 1 : 0}>
        {[['PROJECT DIRECTOR', -0.75, 1.62, 0.2], ['HR', 0, 1.85, 0.9], ['CEO · CHAT', 0.75, 1.62, 1.7]].map(([l, x, y, at]) => (
          <CallWindow key={l as string} label={l as string} a={a} k={E.out(lin(a, at as number, (at as number) + 0.35)) * (1 - E.in(lin(a, 3.3, 3.6)))} position={[x as number, y as number, -0.55]} rotation-y={-(x as number) * 0.4} />
        ))}
        {a > 3.15 ? <Zip position={[0.32, zipY, 0.05]} rotation={[-1.2, 0.2, 0]} glow={0.5 + 0.5 * Math.sin(a * 8)} /> : null}
      </DeskScene>
    );
  } else if (id === 'springboard' || id === 'myth') {
    const ga = id === 'myth' ? 6 : a;
    cam = id === 'myth' ? move(a, 0, d, K(add(GRAPH, [1.4, 2.9, 4.6]), add(GRAPH, NODES.AI.p), 40), K(add(GRAPH, [0.5, 2.6, 3.6]), add(GRAPH, NODES.AI.p), 38))
      : move(a, 0, d, K(add(GRAPH, [-3.5, 2.0, 5.5]), add(GRAPH, [0, 2.2, 0]), 46), K(add(GRAPH, [2.5, 2.8, 5.2]), add(GRAPH, [0, 2.4, -0.4]), 44));
    body = <group position={GRAPH}><Graph a={ga} /></group>;
  } else if (id === 'drain' || id === 'frozen') {
    const fz = id === 'frozen' ? E.out(lin(a, 0.3, 2.4)) : 0;
    cam = id === 'drain' ? move(a, 0, d, K(add(VAULT, [2.4, 0.8, 6]), add(VAULT, [0, 1.6, 2]), 50), K(add(VAULT, [-1.2, 2.2, 8.5]), add(VAULT, [0, 1.4, 3]), 48))
      : move(a, 0, 3.6, K(add(VAULT, [-1.2, 2.2, 8.5]), add(VAULT, [0, 1.4, 3]), 48), K(add(VAULT, [1.5, 2.6, 7.5]), add(VAULT, [0, 1.6, 2.5]), 46));
    body = <group position={VAULT}><Vault open={1} flow={(id === 'drain' ? 0.6 : 0.6 + 5 * 0.3) + a * 0.3} freeze={fz} t={t} /></group>;
  } else if (id === 'attribution') {
    cam = move(a, 0, d, K(add(ATTRIB, [0, 1.5, 6]), add(ATTRIB, [0, 1.4, 0]), 44), K(add(ATTRIB, [0, 1.6, 5.2]), add(ATTRIB, [0, 1.4, 0]), 42));
    body = <group position={ATTRIB}><Columns a={a} /></group>;
  } else if (id === 'lesson' || id === 'cta') {
    const la = id === 'cta' ? 7 : a, sb = E.out(lin(la, 0.6, 1.1)), zipK = E.inout(lin(la, 1.4, 2.6)), seal = la > 2.7 ? 1 : 0;
    cam = id === 'cta' ? move(a, 0, d, K([0.9, 1.35, 1.9], [0, 1.0, 0], 38), K([1.6, 1.6, 3.2], [0, 1.1, 0], 42)) : move(a, 0, d, K([1.2, 1.4, 1.6], [0.15, 0.95, -0.05], 36), K([0.8, 1.3, 1.25], [0.2, 0.9, -0.05], 34));
    body = (
      <DeskScene t={t} pose={typing(t)} screen={seal ? { mode: 'sandbox', a: la } : { mode: 'assignment', a: 1 }} hoodie={hoodB}>
        <Sandbox k={sb} seal={seal} position={[0.42, 0.98, 0.0]} />
        <Zip position={V3([0.32, 0.8, 0.05], [0.42, 0.98, 0], zipK)} rotation={[-1.2 * (1 - zipK), 0.2, 0]} scale={1 - 0.35 * zipK} glow={seal ? 0 : 1} />
      </DeskScene>
    );
  }
  const sh = shake * Math.sin(t * 83);
  return (
    <>
      <Cam pos={[cam.pos[0] + sh, cam.pos[1] + shake * Math.cos(t * 71), cam.pos[2]]} look={cam.look} fov={cam.fov} />
      <Lights alarm={alarm} />
      <Floor />
      {body}
    </>
  );
};
export { T };
