// Technical visualization, used only where it explains something (spec section 4): 2D SVG for the metro route that
// becomes the office network and for Dijkstra's algorithm; real 3D (@remotion/three) for the architecture layers, the
// service stack with moving packets, the CI dominoes and the deploy flythrough. Labels are canvas textures (readable,
// typeset by us). All motion is a function of the shot-local time t.
import React, { useMemo } from 'react';
import { AbsoluteFill, interpolate } from 'remotion';
import { ThreeCanvas } from '@remotion/three';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { UI } from '../screens/Screens';

const MONO = "'IBM Plex Mono', monospace", SANS = "'Inter', sans-serif";
const cl = (x: number) => Math.min(1, Math.max(0, x));
const ease = (x: number) => { x = cl(x); return x * x * (3 - 2 * x); };

// ---------- label texture ----------
function useLabel(text: string, sub = '', color = '#d6dde6', w = 1024, h = 256) {
  return useMemo(() => {
    const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d')!;
    g.fillStyle = 'rgba(0,0,0,0)'; g.clearRect(0, 0, w, h);
    g.fillStyle = color; g.font = `700 ${sub ? 92 : 104}px Inter, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(text, w / 2, sub ? h * 0.38 : h / 2);
    if (sub) { g.fillStyle = '#8b97a8'; g.font = `500 54px "IBM Plex Mono", monospace`; g.fillText(sub, w / 2, h * 0.76); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
  }, [text, sub, color, w, h]);
}
const Label: React.FC<{ text: string; sub?: string; color?: string; pos: [number, number, number]; s?: number; op?: number }> = ({ text, sub = '', color, pos, s = 1, op = 1 }) => {
  const tex = useLabel(text, sub, color);
  return <mesh position={pos}><planeGeometry args={[2.4 * s, 0.6 * s]} /><meshBasicMaterial map={tex} transparent opacity={op} depthWrite={false} toneMapped={false} /></mesh>;
};

// R3F's default camera is replaced per frame via a small helper using useThree
function SetCam({ p, l, fov = 40 }: { p: [number, number, number]; l: [number, number, number]; fov?: number }) {
  const { camera } = useThree();
  const c = camera as THREE.PerspectiveCamera; c.position.set(...p); c.fov = fov; c.aspect = 1080 / 1920; c.lookAt(...l); c.updateProjectionMatrix();
  return null;
}
const Lights = () => (<><ambientLight intensity={0.25} /><directionalLight position={[3, 6, 5]} intensity={1.4} /><pointLight position={[-3, 2, 3]} intensity={6} color="#4c8dff" distance={12} /></>);

const Canvas3D: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThreeCanvas width={1080} height={1920} gl={{ antialias: true }} style={{ background: '#05070a' }}>
    <color attach="background" args={['#05070a']} /><fog attach="fog" args={['#05070a', 6, 18]} />
    <Lights />{children}
  </ThreeCanvas>
);

// ---------- 06: the function call extrudes into three layers, then flattens back toward the code ----------
function Layers({ t, d }: { t: number; d: number }) {
  const k = t / d, sep = ease(k / 0.45) * (1 - ease((k - 0.8) / 0.2) * 0.6);
  const L: [string, string, string][] = [['Route', 'POST /orders', '#82aaff'], ['Service', 'validate → create', '#c792ea'], ['Repository', 'db.orders', '#3fb950']];
  return (
    <Canvas3D>
      <SetCam p={[interpolate(k, [0, 1], [2.6, -1.8]), interpolate(k, [0, 1], [3.2, 2.4]), 6.4]} l={[0, 0.2, 0]} />
      {L.map(([a, b, c], i) => {
        const y = (1 - i) * 1.25 * sep;
        return (
          <group key={a} position={[0, y, 0]}>
            <mesh><boxGeometry args={[3.2, 0.12, 2]} /><meshStandardMaterial color="#141a23" emissive={c} emissiveIntensity={0.18} roughness={0.4} metalness={0.3} /></mesh>
            <mesh position={[0, 0.065, 0]}><boxGeometry args={[3.22, 0.01, 2.02]} /><meshBasicMaterial color={c} transparent opacity={0.5} /></mesh>
            <Label text={a} sub={b} color={c} pos={[0, 0.42, 1.05]} s={1.05} op={cl((sep - 0.3) / 0.4)} />
          </group>
        );
      })}
      {[0, 1, 2].map((j) => { const p = ((t * 1.6 + j / 3) % 1); return <mesh key={j} position={[0.9, 1.25 * sep * (1 - 2 * p), 0.3]}><sphereGeometry args={[0.07, 16, 16]} /><meshBasicMaterial color="#ffffff" /></mesh>; })}
    </Canvas3D>
  );
}

// ---------- 07: Client -> API -> Queue -> Worker -> Database, with packets ----------
function Stack({ t, d }: { t: number; d: number }) {
  const k = t / d, N: [string, string][] = [['Client', 'mobile + web'], ['API', 'orbit-api'], ['Queue', 'orders.created'], ['Worker', 'fulfilment'], ['Database', 'postgres']];
  const y = (i: number) => 3.2 - i * 1.6;
  return (
    <Canvas3D>
      <SetCam p={[2.2, interpolate(ease(k), [0, 1], [3.6, -2.4]), 7.2]} l={[0, interpolate(ease(k), [0, 1], [2.2, -1.8]), 0]} />
      {N.map(([a, b], i) => (
        <group key={a} position={[0, y(i), 0]}>
          <mesh><boxGeometry args={[2.6, 0.9, 0.9]} /><meshStandardMaterial color="#141a23" emissive="#4c8dff" emissiveIntensity={0.12 + 0.25 * Math.max(0, 1 - Math.abs(k * 5 - i - 0.3))} roughness={0.35} metalness={0.4} /></mesh>
          <Label text={a} sub={b} pos={[0, 0, 0.47]} s={0.95} />
          {i < N.length - 1 ? <mesh position={[0, -0.8, 0]}><cylinderGeometry args={[0.04, 0.04, 0.7, 12]} /><meshBasicMaterial color="#2b3a55" /></mesh> : null}
        </group>
      ))}
      {Array.from({ length: 6 }, (_, j) => { const p = (t * 0.9 + j / 6) % 1, yy = interpolate(p, [0, 1], [y(0) - 0.45, y(4) + 0.45]); return <mesh key={j} position={[0, yy, 0]}><sphereGeometry args={[0.08, 16, 16]} /><meshBasicMaterial color={j % 2 ? '#3fb950' : '#82aaff'} /></mesh>; })}
    </Canvas3D>
  );
}

// ---------- 09: the CI jobs fall like dominoes into the release artifact ----------
function CI({ t, d }: { t: number; d: number }) {
  const k = t / d, J = ['lint', 'test', 'build', 'integration'];
  return (
    <Canvas3D>
      <SetCam p={[interpolate(k, [0, 1], [-3.6, 1.6]), 2.0, 6.0]} l={[0.6, 0.6, 0]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}><planeGeometry args={[20, 20]} /><meshStandardMaterial color="#0b0f15" roughness={0.6} metalness={0.2} /></mesh>
      {J.map((j, i) => {
        const tf = 0.12 + i * 0.16, f = ease((k - tf) / 0.12), x = -2.4 + i * 1.25, on = k > tf;
        return (
          <group key={j} position={[x, 0, 0]} rotation={[0, 0, -f * 1.15]}>
            <mesh position={[0, 0.95, 0]}><boxGeometry args={[0.32, 1.9, 1.1]} /><meshStandardMaterial color="#141a23" emissive={on ? '#3fb950' : '#4c8dff'} emissiveIntensity={on ? 0.5 : 0.15} roughness={0.4} /></mesh>
            <Label text={j} color={on ? '#3fb950' : '#d6dde6'} pos={[0, 2.3, 0.2]} s={0.7} />
          </group>
        );
      })}
      {(() => { const g = ease((k - 0.78) / 0.15); return (
        <group position={[2.9, 0.6, 0]} scale={0.6 + 0.4 * g}>
          <mesh rotation={[0.3, t * 0.8, 0]}><boxGeometry args={[1.1, 1.1, 1.1]} /><meshStandardMaterial color="#0f2a18" emissive="#3fb950" emissiveIntensity={0.2 + 0.8 * g} roughness={0.3} metalness={0.5} /></mesh>
          <Label text="v2.14.1" sub="artifact" color="#3fb950" pos={[0, 1.25, 0]} s={0.8} op={g} />
        </group>); })()}
    </Canvas3D>
  );
}

// ---------- 11: the deploy flythrough: staging -> canary 10% -> 50% -> 100% -> healthy ----------
function Deploy({ t, d }: { t: number; d: number }) {
  const k = ease(t / d), R = ['staging', 'canary 10%', 'canary 50%', '100%'];
  const z = interpolate(k, [0, 1], [8, -9.5]);
  return (
    <Canvas3D>
      <SetCam p={[0.3 * Math.sin(t * 1.3), 0.2, z]} l={[0, 0, z - 6]} fov={52} />
      {R.map((r, i) => { const zz = 2 - i * 3.6, passed = z < zz + 0.5; return (
        <group key={r} position={[0, 0, zz]}>
          <mesh><torusGeometry args={[1.9, 0.06, 16, 96]} /><meshBasicMaterial color={passed ? '#3fb950' : '#4c8dff'} /></mesh>
          <Label text={r} color={passed ? '#3fb950' : '#d6dde6'} pos={[0, 2.5, 0]} s={0.9} />
        </group>); })}
      <Label text="HEALTHY" sub="p95 182 ms · 5xx 0.1%" color="#3fb950" pos={[0, 0, -13]} s={2.2} />
    </Canvas3D>
  );
}

// ---------- 04: the metro route line becomes the office network ----------
function Route({ t, d }: { t: number; d: number }) {
  const k = t / d, draw = ease(k / 0.6), net = ease((k - 0.55) / 0.4);
  const S: [number, number, string][] = [[180, 1500, 'Home'], [360, 1180, 'Central'], [640, 1010, 'Riverside'], [820, 700, 'Tech Park'], [700, 420, 'Office']];
  const path = S.map(([x, y], i) => `${i ? 'L' : 'M'}${x},${y}`).join(' ');
  return (
    <AbsoluteFill style={{ background: '#06080c' }}>
      <svg width={1080} height={1920}>
        <defs><filter id="glow"><feGaussianBlur stdDeviation="6" /><feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge></filter></defs>
        {Array.from({ length: 24 }, (_, i) => <line key={i} x1={0} x2={1080} y1={i * 80} y2={i * 80} stroke="#0f141c" strokeWidth={2} />)}
        <path d={path} fill="none" stroke="#ff9a3c" strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} filter="url(#glow)" opacity={1 - net * 0.7} />
        {S.map(([x, y, n], i) => { const on = draw > i / (S.length - 1) - 0.02; return (
          <g key={n} opacity={on ? 1 : 0}><circle cx={x} cy={y} r={20} fill="#06080c" stroke="#ff9a3c" strokeWidth={8} opacity={1 - net} />
            <text x={x + 40} y={y + 12} fill="#d6dde6" fontFamily={SANS} fontSize={36} fontWeight={600} opacity={1 - net}>{n}</text></g>); })}
        {/* the office network grows from the last station */}
        {[[700, 420, 300, 300], [700, 420, 950, 260], [700, 420, 540, 640], [700, 420, 980, 560], [300, 300, 160, 520], [950, 260, 1010, 120]].map(([x1, y1, x2, y2], i) => (
          <g key={i} opacity={net}><line x1={x1} y1={y1} x2={x1 + (x2 - x1) * net} y2={y1 + (y2 - y1) * net} stroke="#4c8dff" strokeWidth={5} filter="url(#glow)" />
            <circle cx={x2} cy={y2} r={14 * net} fill="#4c8dff" /></g>))}
      </svg>
    </AbsoluteFill>
  );
}

// ---------- 12: Dijkstra relaxing a small graph; the priority queue on the side ----------
function Dijkstra({ t, d }: { t: number; d: number }) {
  const k = t / d;
  const V: [number, number, string][] = [[200, 520, 'A'], [540, 380, 'B'], [880, 540, 'C'], [330, 920, 'D'], [720, 900, 'E'], [540, 1280, 'F']];
  const E: [number, number, number][] = [[0, 1, 4], [0, 3, 2], [1, 2, 5], [1, 4, 10], [3, 4, 3], [2, 4, 1], [4, 5, 2], [3, 5, 8]];
  const order = [0, 3, 1, 4, 2, 5], dist = [0, 4, 6, 2, 5, 7], step = Math.floor(k * (order.length + 0.8));
  const done = new Set(order.slice(0, step)), tree = new Set(['0-3', '0-1', '3-4', '4-2', '4-5']);
  return (
    <AbsoluteFill style={{ background: '#08060d' }}>
      <svg width={1080} height={1920}>
        <defs><filter id="g2"><feGaussianBlur stdDeviation="5" /><feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge></filter></defs>
        {E.map(([a, b, w], i) => { const key = `${a}-${b}`, lit = tree.has(key) && done.has(a) && done.has(b); return (
          <g key={i}><line x1={V[a][0]} y1={V[a][1]} x2={V[b][0]} y2={V[b][1]} stroke={lit ? '#b18cff' : '#2a2340'} strokeWidth={lit ? 8 : 4} filter={lit ? 'url(#g2)' : undefined} />
            <text x={(V[a][0] + V[b][0]) / 2 + 14} y={(V[a][1] + V[b][1]) / 2 - 10} fill="#8b7fae" fontFamily={MONO} fontSize={32}>{w}</text></g>); })}
        {V.map(([x, y, n], i) => { const on = done.has(i); return (
          <g key={n}><circle cx={x} cy={y} r={54} fill={on ? '#2a1d4a' : '#14101f'} stroke={on ? '#b18cff' : '#3a3156'} strokeWidth={6} filter={on ? 'url(#g2)' : undefined} />
            <text x={x} y={y + 14} textAnchor="middle" fill="#e6e0f5" fontFamily={SANS} fontWeight={700} fontSize={40}>{n}</text>
            <text x={x} y={y + 104} textAnchor="middle" fill={on ? '#b18cff' : '#5a5178'} fontFamily={MONO} fontSize={32}>{on ? `d=${dist[i]}` : 'd=∞'}</text></g>); })}
      </svg>
      <div style={{ position: 'absolute', left: 60, right: 60, top: 1480, padding: '26px 32px', borderRadius: 18, background: '#120e1c', border: '2px solid #2a2340', font: `400 32px/1.6 ${MONO}`, color: '#cfc6ea' }}>
        <div style={{ color: '#8b7fae' }}>priority queue</div>
        <div>[{order.slice(step, step + 3).map((i) => `(${dist[i]}, ${V[i][2]})`).join(', ') || '— empty —'}]</div>
      </div>
    </AbsoluteFill>
  );
}

export const Viz: React.FC<{ id: string; t: number; d: number }> = ({ id, t, d }) => {
  switch (id) {
    case 'layers': return <Layers t={t} d={d} />;
    case 'stack': return <Stack t={t} d={d} />;
    case 'ci': return <CI t={t} d={d} />;
    case 'deploy': return <Deploy t={t} d={d} />;
    case 'route': return <Route t={t} d={d} />;
    case 'dijkstra': return <Dijkstra t={t} d={d} />;
    default: return <AbsoluteFill style={{ background: '#000' }} />;
  }
};
