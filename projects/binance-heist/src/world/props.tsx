// Props for the attack-chain reconstruction. Everything here is ILLUSTRATIVE (no real UI, no real malware, no logos)
// except the report panel, which is Binance's real Nov 3 report page captured in public/pages/report.png.
// Every prop is a pure function of its time argument.
import React, { useMemo } from 'react';
import * as THREE from 'three';
import { continueRender, delayRender, staticFile } from 'remotion';
import REPORT from '../config/report.json';

export const C = { navy: '#060a14', orange: '#ff7a2f', amber: '#ffb347', lav: '#a99bff', ink: '#eef2ff', red: '#ff3b4f', ice: '#8fe3ff', green: '#4ade80' };
const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lin = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
const eo = (x: number) => 1 - (1 - clamp(x)) ** 4;
function rng(seed: number) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// ---------------------------------------------------------------- live canvas screens
function useCanvas(w: number, h: number) {
  return useMemo(() => { const c = document.createElement('canvas'); c.width = w; c.height = h; const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return { c, g: c.getContext('2d')!, t }; }, [w, h]);
}
const FONT = (w: number, s: number, f = 'Inter') => `${w} ${s}px ${f}, sans-serif`;
export type Screen = { mode: 'search' | 'download' | 'call' | 'assignment' | 'alert' | 'sandbox' | 'off'; a: number };

function drawScreen(g: CanvasRenderingContext2D, W: number, H: number, s: Screen) {
  g.fillStyle = '#0d1220'; g.fillRect(0, 0, W, H);
  g.fillStyle = '#1a2236'; g.fillRect(0, 0, W, 54);
  ['#ff5f57', '#febc2e', '#28c840'].forEach((c, i) => { g.fillStyle = c; g.beginPath(); g.arc(30 + i * 30, 27, 9, 0, 7); g.fill(); });
  g.font = FONT(600, 22, '"JetBrains Mono"'); g.fillStyle = '#8b95b5'; g.fillText('illustrative reconstruction', W - 360, 34);
  if (s.mode === 'search') {
    const q = 'ai coding tool install'.slice(0, Math.floor(s.a * 16));
    g.fillStyle = '#ffffff'; g.beginPath(); g.roundRect(70, 110, W - 140, 80, 40); g.fill();
    g.fillStyle = '#1b1f2a'; g.font = FONT(600, 36); g.fillText(q + (Math.floor(s.a * 6) % 2 ? '|' : ''), 120, 163);
    ['ad · ai-coding-tool installer (download)', 'docs · official install guide', 'forum · setup help'].forEach((r, i) => {
      const k = clamp((s.a - 0.8 - i * 0.15) * 4); if (k <= 0) return;
      g.globalAlpha = k; g.fillStyle = i === 0 ? 'rgba(255,59,79,.16)' : 'rgba(255,255,255,.05)'; g.beginPath(); g.roundRect(70, 230 + i * 110, W - 140, 90, 18); g.fill();
      if (i === 0) { g.strokeStyle = C.red; g.lineWidth = 4; g.stroke(); }
      g.fillStyle = i === 0 ? '#ffb0b8' : '#c9d1ea'; g.font = FONT(600, 30); g.fillText(r, 100, 285 + i * 110); g.globalAlpha = 1;
    });
  }
  if (s.mode === 'download') {
    g.fillStyle = '#e9edf7'; g.font = FONT(800, 40); g.fillText('dev-tool-installer', 90, 170);
    g.fillStyle = '#8b95b5'; g.font = FONT(500, 28); g.fillText('downloading…', 90, 215);
    g.fillStyle = '#20283d'; g.beginPath(); g.roundRect(90, 260, W - 180, 34, 17); g.fill();
    g.fillStyle = s.a > 0.7 ? C.red : C.orange; g.beginPath(); g.roundRect(90, 260, (W - 180) * clamp(s.a / 0.7), 34, 17); g.fill();
    if (s.a > 0.7) { g.fillStyle = C.red; g.font = FONT(900, 44); g.fillText('⚠ TAMPERED PACKAGE', 90, 380); g.fillStyle = '#ffb0b8'; g.font = FONT(600, 26); g.fillText('looks real · runs hidden code', 90, 425); }
  }
  if (s.mode === 'call') {
    const tiles = [['PROJECT DIRECTOR', 0], ['HR', 0.3], ['"CEO"', 0.65]] as const;
    tiles.forEach(([n, at], i) => {
      const k = clamp((s.a - at) * 5); if (k <= 0) return;
      const x = 60 + i * ((W - 120) / 3), w = (W - 120) / 3 - 20, y = 100, h = H - 220;
      g.globalAlpha = k; g.fillStyle = '#18203a'; g.beginPath(); g.roundRect(x, y, w, h, 18); g.fill();
      const gl = Math.sin(s.a * 40 + i * 3) > 0.92 ? 8 : 0;
      g.fillStyle = '#2d3a5c'; g.beginPath(); g.arc(x + w / 2 + gl, y + h * 0.42, w * 0.18, 0, 7); g.fill();
      g.beginPath(); g.ellipse(x + w / 2 + gl, y + h * 0.82, w * 0.3, h * 0.2, 0, Math.PI, 0); g.fill();
      g.fillStyle = C.red; g.font = FONT(800, 22, '"JetBrains Mono"'); g.fillText('FAKE ' + n, x + 16, y + h - 18);
      g.globalAlpha = 1;
    });
    g.fillStyle = '#8b95b5'; g.font = FONT(600, 24); g.fillText('round 2 · video interview', 60, H - 60);
  }
  if (s.mode === 'assignment') {
    g.fillStyle = '#e9edf7'; g.font = FONT(800, 38); g.fillText('assignment.zip', 90, 170);
    g.fillStyle = '#8b95b5'; g.font = FONT(500, 26); g.fillText('"please run the setup before round 3"', 90, 215);
    for (let i = 0; i < 6; i++) { const k = clamp((s.a - 0.2 - i * 0.08) * 6); g.globalAlpha = k; g.fillStyle = i > 2 ? 'rgba(255,59,79,.7)' : 'rgba(201,209,234,.5)'; g.fillRect(90, 260 + i * 34, (W - 300) * (0.5 + ((i * 37) % 50) / 100), 16); }
    g.globalAlpha = 1;
    if (s.a > 0.65) { g.fillStyle = C.red; g.font = FONT(900, 40); g.fillText('⚠ MALICIOUS SETUP CODE', 90, H - 90); }
  }
  if (s.mode === 'alert') {
    const p = 0.5 + 0.5 * Math.sin(s.a * 18);
    g.fillStyle = `rgba(255,59,79,${0.18 + 0.2 * p})`; g.fillRect(0, 54, W, H - 54);
    g.fillStyle = '#fff'; g.font = FONT(900, 64); g.fillText('DEVICE', 90, 230); g.fillText('COMPROMISED', 90, 310);
  }
  if (s.mode === 'sandbox') {
    g.fillStyle = 'rgba(74,222,128,.14)'; g.fillRect(0, 54, W, H - 54);
    g.fillStyle = C.green; g.font = FONT(900, 58); g.fillText('SANDBOX ✓', 90, 220);
    g.fillStyle = '#c9f5d6'; g.font = FONT(600, 30); g.fillText('disposable VM · no work credentials', 90, 280);
  }
}

export const Laptop: React.FC<{ screen: Screen; glow?: number } & React.JSX.IntrinsicElements['group']> = ({ screen, glow = 0, ...g }) => {
  const cv = useCanvas(1024, 640);
  drawScreen(cv.g, 1024, 640, screen); cv.t.needsUpdate = true;
  return (
    <group {...g}>
      <mesh castShadow receiveShadow position={[0, 0.012, 0]}><boxGeometry args={[0.36, 0.024, 0.25]} /><meshStandardMaterial color="#2a2f3a" metalness={0.7} roughness={0.3} /></mesh>
      <group position={[0, 0.024, -0.12]} rotation-x={-0.25}>
        <mesh position={[0, 0.115, 0]} castShadow><boxGeometry args={[0.36, 0.23, 0.012]} /><meshStandardMaterial color="#2a2f3a" metalness={0.7} roughness={0.3} /></mesh>
        <mesh position={[0, 0.115, 0.0065]}><planeGeometry args={[0.34, 0.212]} /><meshBasicMaterial map={cv.t} toneMapped={false} /></mesh>
        <pointLight position={[0, 0.12, 0.25]} intensity={1.5 + glow * 4} distance={2.2} color={screen.mode === 'alert' || glow > 0 ? C.red : '#9fb4ff'} />
      </group>
    </group>
  );
};

export const Phone: React.FC<{ a: number; glitch: number } & React.JSX.IntrinsicElements['group']> = ({ a, glitch, ...g }) => {
  const cv = useCanvas(540, 1080);
  const G = cv.g, W = 540, H = 1080;
  G.fillStyle = '#0b1020'; G.fillRect(0, 0, W, H);
  const grd = G.createLinearGradient(0, 0, 0, H); grd.addColorStop(0, '#1d2a52'); grd.addColorStop(1, '#0b1020'); G.fillStyle = grd; G.fillRect(0, 0, W, H);
  G.fillStyle = '#fff'; G.font = FONT(300, 120); G.fillText('9:41', 130, 250);
  const k = eo(lin(a, 0, 0.3)), y = 340 - (1 - k) * 120;
  G.globalAlpha = k; G.fillStyle = 'rgba(255,255,255,.92)'; G.beginPath(); G.roundRect(30, y, W - 60, 230, 34); G.fill();
  G.fillStyle = C.orange; G.beginPath(); G.roundRect(60, y + 30, 64, 64, 16); G.fill();
  G.fillStyle = '#fff'; G.font = FONT(900, 40); G.fillText('📅', 70, y + 76);
  G.fillStyle = '#111'; G.font = FONT(800, 32); G.fillText('Interview invite', 145, y + 60);
  G.fillStyle = '#333'; G.font = FONT(500, 26); G.fillText('Round 2 · interview with', 145, y + 102); G.fillText('the “CEO” · on a chat app', 145, y + 136);
  G.fillStyle = C.orange; G.font = FONT(800, 26); G.fillText('ACCEPT', 145, y + 190); G.globalAlpha = 1;
  if (glitch > 0) {
    for (let i = 0; i < 14; i++) { const yy = ((i * 97 + Math.floor(a * 60) * 31) % H); G.drawImage(cv.c, 0, yy, W, 30, (i % 2 ? 1 : -1) * 40 * glitch, yy, W, 30); }
    G.fillStyle = `rgba(255,59,79,${0.45 * glitch})`; G.fillRect(0, 0, W, H);
    G.strokeStyle = `rgba(255,255,255,${glitch})`; G.lineWidth = 4; G.beginPath(); G.moveTo(120, 0); G.lineTo(250, 420); G.lineTo(180, 640); G.lineTo(330, 1080); G.stroke();
  }
  cv.t.needsUpdate = true;
  return (
    <group {...g}>
      <mesh castShadow><boxGeometry args={[0.078, 0.16, 0.009]} /><meshStandardMaterial color="#14161c" metalness={0.8} roughness={0.25} /></mesh>
      <mesh position={[0, 0, 0.0047]}><planeGeometry args={[0.072, 0.152]} /><meshBasicMaterial map={cv.t} toneMapped={false} /></mesh>
    </group>
  );
};

/** a floating video-call window with a faceless silhouette (never a real person) */
export const CallWindow: React.FC<{ label: string; a: number; k: number } & React.JSX.IntrinsicElements['group']> = ({ label, a, k, ...g }) => {
  const cv = useCanvas(512, 384), G = cv.g;
  G.fillStyle = '#111a30'; G.fillRect(0, 0, 512, 384);
  const gl = Math.sin(a * 37) > 0.85 ? 14 : 0;
  G.fillStyle = '#2b3a62'; G.beginPath(); G.arc(256 + gl, 160, 62, 0, 7); G.fill(); G.beginPath(); G.ellipse(256 + gl, 360, 130, 110, 0, Math.PI, 0); G.fill();
  G.fillStyle = 'rgba(255,59,79,.9)'; G.fillRect(0, 330, 512, 54); G.fillStyle = '#fff'; G.font = FONT(800, 28, '"JetBrains Mono"'); G.fillText('FAKE ' + label, 18, 366);
  if (gl) { G.fillStyle = 'rgba(169,155,255,.35)'; G.fillRect(0, (a * 900) % 384, 512, 22); }
  cv.t.needsUpdate = true;
  return (
    <group {...g} scale={k}>
      <mesh position={[0, 0, -0.01]}><boxGeometry args={[0.86, 0.66, 0.02]} /><meshStandardMaterial color="#0b0f1c" emissive={C.red} emissiveIntensity={0.25} /></mesh>
      <mesh><planeGeometry args={[0.8, 0.6]} /><meshBasicMaterial map={cv.t} toneMapped={false} /></mesh>
    </group>
  );
};

/** the "assignment" zip: an inert illustrated prop with a red caution rim */
export const Zip: React.FC<{ glow?: number } & React.JSX.IntrinsicElements['group']> = ({ glow = 0, ...g }) => (
  <group {...g}>
    <mesh castShadow><boxGeometry args={[0.22, 0.28, 0.05]} /><meshStandardMaterial color="#e9b44c" roughness={0.6} /></mesh>
    {Array.from({ length: 8 }, (_, i) => <mesh key={i} position={[0, 0.12 - i * 0.034, 0.027]}><boxGeometry args={[0.03, 0.016, 0.004]} /><meshStandardMaterial color={i % 2 ? '#7a5a1f' : '#cfd3da'} metalness={0.6} /></mesh>)}
    <mesh position={[0, 0, 0.026]}><ringGeometry args={[0.16, 0.18, 4, 1, Math.PI / 4]} /><meshBasicMaterial color={C.red} transparent opacity={0.4 + 0.6 * glow} toneMapped={false} /></mesh>
  </group>
);

export const Desk: React.FC = () => (
  <group>
    <mesh position={[0, 0.74, 0]} castShadow receiveShadow><boxGeometry args={[1.5, 0.04, 0.75]} /><meshStandardMaterial color="#3a2c22" roughness={0.55} /></mesh>
    {[[-0.7, -0.33], [0.7, -0.33], [-0.7, 0.33], [0.7, 0.33]].map(([x, z], i) => <mesh key={i} position={[x, 0.36, z]} castShadow><boxGeometry args={[0.04, 0.72, 0.04]} /><meshStandardMaterial color="#1c1f26" metalness={0.6} roughness={0.4} /></mesh>)}
    <mesh position={[0, 0.45, 0.55]} castShadow><boxGeometry args={[0.46, 0.06, 0.44]} /><meshStandardMaterial color="#20242c" /></mesh>
    <mesh position={[0, 0.78, 0.75]} castShadow><boxGeometry args={[0.46, 0.6, 0.06]} /><meshStandardMaterial color="#20242c" /></mesh>
    <mesh position={[0.48, 0.92, -0.2]}><cylinderGeometry args={[0.05, 0.04, 0.12, 18]} /><meshStandardMaterial color="#d9733f" /></mesh>
  </group>
);

// ---------------------------------------------------------------- the attack chain graph
export const NODES: Record<string, { p: [number, number, number]; label: string; col: string; r: number }> = {
  B: { p: [-1.6, 1.2, 0], label: 'ENGINEER B · LAPTOP', col: C.red, r: 0.28 },
  AI: { p: [0, 2.2, -0.6], label: 'INTERNAL AI TOOL', col: C.lav, r: 0.42 },
  A: { p: [1.4, 3.1, -0.2], label: 'ENGINEER A', col: C.amber, r: 0.24 },
  C: { p: [1.7, 1.3, 0.3], label: 'ENGINEER C', col: C.amber, r: 0.24 },
  W: { p: [0.4, 4.1, -1.2], label: 'WALLET SIGNING', col: C.orange, r: 0.3 },
};
export const EDGES: [string, string, number][] = [['B', 'AI', 0.3], ['AI', 'A', 1.3], ['AI', 'C', 1.6], ['A', 'W', 2.8], ['C', 'W', 3.1]];
const Seg: React.FC<{ a: [number, number, number]; b: [number, number, number]; r: number; col: string; o?: number }> = ({ a, b, r, col, o = 1 }) => {
  const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b), d = vb.clone().sub(va), L = d.length();
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
  return <mesh position={va.clone().add(vb).multiplyScalar(0.5)} quaternion={q}><cylinderGeometry args={[r, r, L, 8]} /><meshBasicMaterial color={col} transparent opacity={o} toneMapped={false} /></mesh>;
};
export const Graph: React.FC<{ a: number }> = ({ a }) => (
  <group>
    {EDGES.map(([f, t2, at]) => {
      const pa = NODES[f].p, pb = NODES[t2].p, k = clamp((a - at) / 0.7), lit = a > at + 0.7;
      const mid = pa.map((v, i) => v + (pb[i] - v) * k) as [number, number, number];
      return (
        <group key={f + t2}>
          <Seg a={pa} b={pb} r={0.012} col="#3a4566" o={0.8} />
          {k > 0 ? <Seg a={pa} b={mid} r={0.03} col={C.red} /> : null}
          {k > 0 && k < 1 ? <mesh position={mid}><sphereGeometry args={[0.07, 12, 10]} /><meshBasicMaterial color="#ffd2d7" toneMapped={false} /></mesh> : null}
          {lit ? <Seg a={pa} b={pb} r={0.04 + 0.01 * Math.sin(a * 10)} col={C.red} o={0.6} /> : null}
        </group>
      );
    })}
    {Object.entries(NODES).map(([k, n]) => {
      const hit = k === 'B' || EDGES.some(([, t2, at]) => t2 === k && a > at + 0.7);
      return (
        <mesh key={k} position={n.p}>
          <icosahedronGeometry args={[n.r, k === 'AI' ? 2 : 1]} />
          <meshStandardMaterial color={hit && k !== 'AI' ? C.red : n.col} emissive={hit ? (k === 'AI' ? C.lav : C.red) : n.col} emissiveIntensity={hit ? 1.4 : 0.3} roughness={0.3} flatShading={k !== 'AI'} />
        </mesh>
      );
    })}
  </group>
);

// ---------------------------------------------------------------- vault + coin river + ice
const N_COINS = 520;
export const Vault: React.FC<{ open: number; flow: number; freeze: number; t: number }> = ({ open, flow, freeze, t }) => {
  const coins = useMemo(() => { const r = rng(42); return Array.from({ length: N_COINS }, (_, i) => ({ s: r(), x: (r() - 0.5) * 1.6, y: (r() - 0.5) * 1.2, spin: r() * 6, frozen: i / N_COINS < 0.45 })); }, []);
  const ref = React.useRef<THREE.InstancedMesh>(null!), ice = React.useRef<THREE.InstancedMesh>(null!);
  React.useLayoutEffect(() => {
    const M = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(); let n = 0, m = 0;
    coins.forEach((c, i) => {
      const phase = (c.s + flow * 0.9) % 1, alive = flow > c.s * 0.8;
      if (!alive) { M.makeScale(0, 0, 0); ref.current.setMatrixAt(n++, M); return; }
      const fr = c.frozen && freeze > 0 ? Math.min(phase, 0.25 + 0.5 * c.s) : phase;   // frozen coins stop mid-air
      const z = 0.2 + fr * 9, x = c.x * (1 + fr * 1.6) + Math.sin(fr * 8 + c.spin) * 0.3, y = 1.6 + c.y * (1 + fr) - fr * fr * 1.3;
      e.set(c.spin + (c.frozen && freeze > 0 ? 0 : t * 6), t * 3 + c.spin, 0); q.setFromEuler(e);
      M.compose(new THREE.Vector3(x, y, z), q, new THREE.Vector3(1, 1, 1)); ref.current.setMatrixAt(n++, M);
      if (c.frozen && freeze > 0 && m < 240) { const s = 0.18 * eo(freeze * 1.4 - c.s * 0.4); ice.current.setMatrixAt(m++, M.compose(new THREE.Vector3(x, y, z), q, new THREE.Vector3(s, s, s))); }
    });
    ref.current.count = n; ref.current.instanceMatrix.needsUpdate = true;
    ice.current.count = m; ice.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <group>
      <group position={[0, 1.6, 0]}>
        <mesh rotation-x={Math.PI / 2} position={[0, 0, -0.3]}><cylinderGeometry args={[1.5, 1.5, 0.5, 48]} /><meshStandardMaterial color="#1e2433" metalness={0.8} roughness={0.35} /></mesh>
        <group position={[-1.3, 0, 0.05]} rotation-y={-open * 1.9}>
          <group position={[1.3, 0, 0]}>
            <mesh rotation-x={Math.PI / 2}><cylinderGeometry args={[1.28, 1.28, 0.22, 48]} /><meshStandardMaterial color="#3a4458" metalness={0.9} roughness={0.25} /></mesh>
            {Array.from({ length: 6 }, (_, i) => <mesh key={i} position={[0, 0, 0.14]} rotation-z={(i / 6) * Math.PI + t * 0.2}><boxGeometry args={[1.9, 0.08, 0.05]} /><meshStandardMaterial color="#c9cfda" metalness={0.9} roughness={0.2} /></mesh>)}
            <mesh position={[0, 0, 0.18]} rotation-x={Math.PI / 2}><cylinderGeometry args={[0.22, 0.22, 0.08, 24]} /><meshStandardMaterial color={C.orange} emissive={C.orange} emissiveIntensity={0.6} /></mesh>
          </group>
        </group>
        <pointLight position={[0, 0, 0.6]} intensity={30 * open} distance={8} color={C.amber} />
      </group>
      <instancedMesh ref={ref} args={[undefined, undefined, N_COINS]} castShadow>
        <cylinderGeometry args={[0.09, 0.09, 0.02, 20]} /><meshStandardMaterial color="#f7a531" metalness={0.95} roughness={0.22} emissive="#6a3305" emissiveIntensity={0.4} />
      </instancedMesh>
      <instancedMesh ref={ice} args={[undefined, undefined, 240]}>
        <icosahedronGeometry args={[1, 0]} /><meshPhysicalMaterial color={C.ice} roughness={0.05} transmission={0.6} transparent opacity={0.75} emissive="#2a7aa0" emissiveIntensity={0.5} flatShading />
      </instancedMesh>
    </group>
  );
};

// ---------------------------------------------------------------- the real report page (+ magnifier)
const texCache = new Map<string, THREE.Texture>();
export function usePreload(files: string[]): boolean {
  const [ready, set] = React.useState(() => files.every((f) => texCache.has(f)));
  React.useEffect(() => {
    if (ready) return;
    const h = delayRender('tex');
    const fonts = ['900 60px Archivo', '800 40px Inter', '600 30px Inter', '700 22px "JetBrains Mono"'].map((f) => document.fonts.load(f).catch(() => null));
    Promise.all([...files.map((f) => new Promise<void>((res) => new THREE.TextureLoader().load(staticFile(f), (t) => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; texCache.set(f, t); res(); }, undefined, () => res()))), ...fonts])
      .then(() => { set(true); continueRender(h); });
  }, []);
  return ready;
}
type Box = { x: number; y: number; w: number; h: number };
export const RH = (REPORT as { H: number }).H;
export const RB = (REPORT as unknown as { boxes: Record<string, Box & { para: Box }> }).boxes;
/** a window onto the report page: page css rect [y0, y0 + hCss] shown on a plane `w` wide */
export const ReportPanel: React.FC<{ y0: number; hCss: number; w: number; glow?: number } & React.JSX.IntrinsicElements['group']> = ({ y0, hCss, w, glow = 0.5, ...g }) => {
  const base = texCache.get('pages/report.png')!;
  const tex = useMemo(() => { const t = base.clone(); t.needsUpdate = true; return t; }, [base]);
  tex.repeat.set(1, hCss / RH); tex.offset.set(0, 1 - (y0 + hCss) / RH);
  const h = w * (hCss / 1280);
  return (
    <group {...g}>
      <mesh position={[0, 0, -0.03]}><boxGeometry args={[w + 0.08, h + 0.08, 0.04]} /><meshStandardMaterial color="#0b0f1c" emissive={C.amber} emissiveIntensity={glow * 0.3} /></mesh>
      <mesh><planeGeometry args={[w, h]} /><meshBasicMaterial map={tex} toneMapped={false} /></mesh>
    </group>
  );
};
/** magnifier on a page-css point, zoomed, with a brass rim */
export const Lens: React.FC<{ cx: number; cy: number; mag: number; radius: number; panelW: number } & React.JSX.IntrinsicElements['group']> = ({ cx, cy, mag, radius, panelW, ...g }) => {
  const tex = texCache.get('pages/report.png')!, asp = RH / 1280;
  const mat = useMemo(() => new THREE.ShaderMaterial({
    uniforms: { map: { value: tex }, c: { value: new THREE.Vector2() }, r: { value: 0.05 }, asp: { value: asp } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }',
    fragmentShader: `uniform sampler2D map; uniform vec2 c; uniform float r; uniform float asp; varying vec2 vUv;
      void main(){ vec2 d = vUv - .5; float rr = length(d) * 2.; vec2 uv = c + vec2(d.x, d.y / asp) * 2. * r * (1. + .16 * rr * rr);
        vec3 col = texture2D(map, uv).rgb; col *= 1. - .35 * smoothstep(.75, 1., rr); gl_FragColor = vec4(col, 1.);
        #include <colorspace_fragment>
      }`,
  }), [tex]);
  mat.uniforms.c.value.set(cx / 1280, 1 - cy / RH); mat.uniforms.r.value = Math.max(1e-4, radius / panelW / mag);   // true magnification vs the panel
  return (
    <group {...g}>
      <mesh material={mat}><circleGeometry args={[radius, 64]} /></mesh>
      <mesh><torusGeometry args={[radius, radius * 0.07, 16, 64]} /><meshStandardMaterial color="#d8b56a" metalness={0.9} roughness={0.25} /></mesh>
      <mesh position={[radius * 0.8, -radius * 1.35, 0]} rotation-z={0.6}><cylinderGeometry args={[radius * 0.07, radius * 0.09, radius * 1.3, 12]} /><meshStandardMaterial color="#2a1c12" /></mesh>
    </group>
  );
};

/** the sandbox: a glass box that seals around the assignment */
export const Sandbox: React.FC<{ k: number; seal: number } & React.JSX.IntrinsicElements['group']> = ({ k, seal, ...g }) => (
  <group {...g} scale={k}>
    <mesh><boxGeometry args={[0.5, 0.42, 0.42]} /><meshPhysicalMaterial color={seal > 0 ? C.green : '#bfe8ff'} roughness={0.05} transmission={0.8} transparent opacity={0.35 + 0.2 * seal} emissive={C.green} emissiveIntensity={seal * 0.4} /></mesh>
    <lineSegments><edgesGeometry args={[new THREE.BoxGeometry(0.5, 0.42, 0.42)]} /><lineBasicMaterial color={seal > 0 ? C.green : '#bfe8ff'} /></lineSegments>
  </group>
);

/** attribution: two neutral stone columns */
export const Columns: React.FC<{ a: number }> = ({ a }) => (
  <group>
    {[-1, 1].map((s, i) => { const k = eo(lin(a, 0.1 + i * 0.35, 0.6 + i * 0.35)); return (
      <mesh key={s} position={[s * 1.1, 1.4 * k - 0.1, 0]} castShadow receiveShadow scale={[1, k, 1]}><boxGeometry args={[1.5, 2.8, 0.5]} /><meshStandardMaterial color="#2a3142" emissive={s < 0 ? C.amber : C.lav} emissiveIntensity={0.1} roughness={0.7} /></mesh>
    ); })}
  </group>
);
