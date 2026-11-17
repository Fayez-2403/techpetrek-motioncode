// One physical prop per repo, each a pure function of its local time `a` (seconds since the beat started).
// They are illustrations of what each tool does in this studio, built in code; the repo pages themselves are real.
import React, { useMemo } from 'react';
import * as THREE from 'three';
import { E, clamp, lin } from './timeline';

const cyan = '#63E5FA', amber = '#F5A64D', orange = '#D97757', ink = '#E8F3F7';
const B = (p: { pos: [number, number, number]; s: [number, number, number]; c: string; e?: number; rot?: [number, number, number]; o?: number }) => (
  <mesh position={p.pos} rotation={p.rot ?? [0, 0, 0]} castShadow receiveShadow>
    <boxGeometry args={p.s} /><meshStandardMaterial color={p.c} emissive={p.c} emissiveIntensity={p.e ?? 0} roughness={0.45} metalness={0.2} transparent={p.o !== undefined} opacity={p.o ?? 1} />
  </mesh>
);
const Seg: React.FC<{ a: [number, number, number]; b: [number, number, number]; r?: number; c?: string; o?: number }> = ({ a, b, r = 0.05, c = cyan, o = 1 }) => {
  const m = useMemo(() => {
    const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b), d = vb.clone().sub(va), L = d.length();
    return { pos: va.clone().add(vb).multiplyScalar(0.5), q: new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()), L };
  }, [a.join(), b.join()]);
  return <mesh position={m.pos} quaternion={m.q}><cylinderGeometry args={[r, r, m.L, 6]} /><meshBasicMaterial color={c} transparent opacity={o} toneMapped={false} /></mesh>;
};

/** canvas text as a texture (fonts are loaded before the canvas mounts) */
const texCache = new Map<string, THREE.CanvasTexture>();
export function textTex(text: string, o: { w?: number; h?: number; size?: number; color?: string; bg?: string; font?: string; align?: CanvasTextAlign } = {}) {
  const key = JSON.stringify([text, o]); const hit = texCache.get(key); if (hit) return hit;
  const W = o.w ?? 1024, H = o.h ?? 256, c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d')!; if (o.bg) { g.fillStyle = o.bg; g.fillRect(0, 0, W, H); }
  g.fillStyle = o.color ?? ink; g.font = `${o.font ?? '800'} ${o.size ?? 120}px "JetBrains Mono", monospace`; g.textAlign = o.align ?? 'center'; g.textBaseline = 'middle';
  text.split('\n').forEach((ln, i, all) => g.fillText(ln, o.align === 'left' ? 24 : W / 2, H / 2 + (i - (all.length - 1) / 2) * (o.size ?? 120) * 1.1));
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; texCache.set(key, t); return t;
}
export const Label: React.FC<{ text: string; w: number; h?: number; color?: string; bg?: string; size?: number } & React.JSX.IntrinsicElements['group']> = ({ text, w, h, color, bg, size, ...g }) => {
  const H = h ?? w / 4, tex = textTex(text, { w: 1024, h: Math.round(1024 * (H / w)), color, bg, size: size ?? Math.round(1024 * (H / w) * 0.6) });
  return <group {...g}><mesh><planeGeometry args={[w, H]} /><meshBasicMaterial map={tex} transparent toneMapped={false} depthWrite={false} /></mesh></group>;
};

/** Blender: an armature drawn over the bot (shoulders, spine, legs) that the bot then poses */
export const Rig: React.FC<{ a: number; y?: number }> = ({ a, y = 0 }) => {
  const k = E.out(lin(a, 0.05, 0.45)), o = 0.95 * k;
  const J: [number, number, number][] = [[0, 0.95 + y, 0], [0, 2.95 + y, 1.4], [0, 4.6 + y, 1.4], [-3.4, 2.3 + y, 1.4], [3.4, 2.3 + y, 1.4], [-2.2, 0.2 + y, 1.4], [2.3, 0.2 + y, 1.4]];
  return (
    <group>
      {[[0, 1], [1, 2], [1, 3], [1, 4], [0, 5], [0, 6]].map(([i, j]) => <Seg key={`${i}${j}`} a={J[i]} b={J[j]} r={0.07} c={cyan} o={o} />)}
      {J.map((p, i) => <mesh key={i} position={p} scale={k}><octahedronGeometry args={[0.24]} /><meshBasicMaterial color={i === 1 ? amber : cyan} toneMapped={false} /></mesh>)}
    </group>
  );
};

/** Three.js: a wireframe world grows around the bot */
export const WireWorld: React.FC<{ a: number }> = ({ a }) => {
  const k = E.out(lin(a, 0, 0.8));
  return (
    <group position={[0, 3, 0]} rotation={[a * 0.4, a * 0.9, 0]} scale={2 + 7 * k}>
      <mesh><icosahedronGeometry args={[1, 1]} /><meshBasicMaterial color={cyan} wireframe transparent opacity={0.55 * (1 - lin(a, 1.8, 2.6))} toneMapped={false} /></mesh>
      <mesh rotation={[0.6, 0.3, 0]}><torusKnotGeometry args={[0.55, 0.12, 80, 10]} /><meshBasicMaterial color={amber} wireframe transparent opacity={0.35} toneMapped={false} /></mesh>
    </group>
  );
};

/** NumPy: a 12×12 array of value-cubes; a wave of computation sweeps through it */
export const ArrayGrid: React.FC<{ a: number }> = ({ a }) => {
  const N = 12, ref = React.useRef<THREE.InstancedMesh>(null!), M = new THREE.Matrix4(), C = new THREE.Color();
  const rise = E.out(lin(a, 0, 0.5));
  React.useLayoutEffect(() => {
    const m = ref.current; if (!m) return;
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
      const v = 0.5 + 0.5 * Math.sin(i * 0.7 + j * 0.45 + a * 5), d = Math.hypot(i - N / 2, j - N / 2);
      const h = 0.15 + 1.6 * v * rise * clamp((a * 7 - d) / 3);
      m.setMatrixAt(i * N + j, M.compose(new THREE.Vector3((i - N / 2) * 0.9, h / 2, (j - N / 2) * 0.9 - 2), new THREE.Quaternion(), new THREE.Vector3(0.75, h, 0.75)));
      m.setColorAt(i * N + j, C.set('#1f4e79').lerp(new THREE.Color(cyan), v).lerp(new THREE.Color(amber), Math.max(0, v - 0.7) * 2));
    }
    m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true;
  });
  return <instancedMesh ref={ref} args={[undefined, undefined, N * N]} castShadow><boxGeometry /><meshStandardMaterial roughness={0.35} emissive="#0a2a3a" /></instancedMesh>;
};

/** Numba: speed streaks behind the dashing bot */
export const Streaks: React.FC<{ a: number; x: number }> = ({ a, x }) => (
  <group>
    {Array.from({ length: 9 }, (_, i) => {
      const y = 0.6 + (i % 5) * 0.9, len = 4 + (i * 1.7) % 6, o = 0.5 * (1 - lin(a, 1.2, 1.9));
      return <B key={i} pos={[x - len / 2 - 3.2 - (i % 3), y, (i % 3) * 0.6 - 0.6]} s={[len, 0.07, 0.07]} c={i % 2 ? cyan : ink} e={1} o={o} />;
    })}
  </group>
);

/** SciPy: a noisy waveform that gets low-pass filtered as the beat goes on */
export const Wave: React.FC<{ a: number }> = ({ a }) => {
  const N = 60, f = clamp(a / 1.4);
  return (
    <group position={[0, 0.05, 2]}>
      {Array.from({ length: N }, (_, i) => {
        const x = (i - N / 2) * 0.32, smooth = Math.sin(i * 0.25 + a * 4), noise = Math.sin(i * 2.7 + a * 11) * 0.8 + Math.sin(i * 5.3) * 0.5;
        const h = 0.3 + Math.abs(smooth * 1.4 + noise * (1 - f)) * 1.2;
        return <B key={i} pos={[x, h / 2, 0]} s={[0.2, h, 0.2]} c={f > 0.6 ? cyan : amber} e={0.5} />;
      })}
    </group>
  );
};

/** GSAP: a timeline track with keyframe diamonds and the easing curve the bot follows */
export const Track: React.FC<{ a: number; keys: number[] }> = ({ a, keys }) => (
  <group position={[0, 0.06, 1]}>
    <B pos={[0, 0, 0]} s={[22, 0.1, 0.9]} c="#1a2633" />
    <B pos={[-11 + 22 * clamp(a / 1.4), 0.06, 0]} s={[0.08, 0.12, 1.2]} c={amber} e={1} />
    {keys.map((x, i) => <mesh key={i} position={[x, 0.35, 0]} rotation={[0, 0, Math.PI / 4]} scale={a > i * 0.35 ? 1.25 : 1}><boxGeometry args={[0.5, 0.5, 0.5]} /><meshStandardMaterial color={a > i * 0.35 ? cyan : '#4b5b6b'} emissive={cyan} emissiveIntensity={a > i * 0.35 ? 0.8 : 0} /></mesh>)}
  </group>
);

/** Remotion: a film strip of frames sliding past; each frame is the real Remotion page header */
export const FilmStrip: React.FC<{ a: number; tex: THREE.Texture }> = ({ a, tex }) => (
  <group position={[-((a * 3.2) % 4.4), 4.4, -1]}>
    {Array.from({ length: 9 }, (_, i) => (
      <group key={i} position={[(i - 4) * 4.4, 0, 0]}>
        <B pos={[0, 0, -0.05]} s={[4.3, 3.2, 0.06]} c="#0b0d10" />
        {[-1.42, 1.42].map((y) => Array.from({ length: 6 }, (_, k) => <B key={`${y}${k}`} pos={[-1.8 + k * 0.72, y, 0.01]} s={[0.32, 0.22, 0.02]} c="#e8e2d6" />))}
        <mesh position={[0, 0, 0.02]}><planeGeometry args={[3.9, 2.2]} /><meshBasicMaterial map={tex} toneMapped={false} /></mesh>
      </group>
    ))}
  </group>
);

/** Puppeteer: the control cross and strings; the bot's limbs follow them */
export const Strings: React.FC<{ a: number; anchors: [number, number, number][]; bar: [number, number, number] }> = ({ a, anchors, bar }) => (
  <group>
    <group position={bar} rotation={[0, 0, Math.sin(a * 6) * 0.18]}>
      <B pos={[0, 0, 0]} s={[7.5, 0.22, 0.22]} c="#c9a36a" /><B pos={[0, 0, 0]} s={[0.22, 0.22, 3.2]} c="#c9a36a" />
    </group>
    {anchors.map((p, i) => <Seg key={i} a={[bar[0] + (i - 1.5) * 2.3, bar[1], bar[2]]} b={p} r={0.025} c={ink} o={0.85} />)}
  </group>
);

/** Tone.js: piano keys on the floor; a key glows when the bot lands on it */
export const Keys: React.FC<{ a: number; hits: { t: number; k: number }[] }> = ({ a, hits }) => (
  <group position={[-7, 0, 1.5]}>
    {Array.from({ length: 14 }, (_, k) => {
      const h = hits.find((x) => x.k === k && a >= x.t && a < x.t + 0.25), down = h ? 0.12 * (1 - (a - h.t) / 0.25) : 0;
      return <B key={k} pos={[k * 1.05, 0.2 - down, 0]} s={[1, 0.4, 3.6]} c={h ? cyan : '#e9edf1'} e={h ? 0.9 : 0} />;
    })}
    {[0, 1, 3, 4, 5, 7, 8, 10, 11, 12].map((k) => <B key={`b${k}`} pos={[k * 1.05 + 0.52, 0.5, -0.7]} s={[0.6, 0.4, 2.2]} c="#14171b" />)}
  </group>
);

/** Pedalboard: three stomp boxes; each LED lights when the bot stomps it */
export const Pedals: React.FC<{ a: number; hits: number[] }> = ({ a, hits }) => (
  <group position={[0, 0, 2]}>
    {[['COMP', '#2f6feb'], ['LIMIT', '#d6453d'], ['VERB', '#3aa776']].map(([n, c], i) => {
      const on = a >= hits[i], kick = on ? Math.exp(-(a - hits[i]) * 10) : 0;
      return (
        <group key={n} position={[(i - 1) * 4.2, 0, 0]}>
          <B pos={[0, 0.55 - kick * 0.15, 0]} s={[2.6, 1.1, 3.4]} c={c} e={0.15 + kick * 0.6} />
          <B pos={[0, 1.15 - kick * 0.15, 0.7]} s={[1.4, 0.15, 1.4]} c="#cfd6dd" />
          {[-0.7, 0, 0.7].map((x) => <mesh key={x} position={[x, 1.25, -1.0]}><cylinderGeometry args={[0.22, 0.22, 0.3, 14]} /><meshStandardMaterial color="#20242a" /></mesh>)}
          <mesh position={[0, 1.2, -0.3]}><sphereGeometry args={[0.16, 10, 8]} /><meshBasicMaterial color={on ? '#ff4d4d' : '#3a1010'} toneMapped={false} /></mesh>
          <Label text={n as string} w={2.2} h={0.5} position={[0, 0.6, 1.72]} color="#fff" />
        </group>
      );
    })}
  </group>
);

/** pyloudnorm: a loudness meter; the −14 LUFS ledge is where the bot lands */
export const Meter: React.FC<{ a: number }> = ({ a }) => (
  <group position={[-4.2, 0, -0.5]}>
    {Array.from({ length: 12 }, (_, i) => {
      const lvl = 6 + 4 * Math.abs(Math.sin(a * 7 + i)) * (1 - lin(a, 1.2, 2)) + 3 * lin(a, 1.2, 2);
      const on = i < lvl;
      return <B key={i} pos={[0, 0.5 + i * 0.75, 0]} s={[2.2, 0.6, 1.2]} c={i >= 10 ? '#ff5a4f' : i >= 8 ? amber : '#58D6AF'} e={on ? 0.9 : 0.05} o={on ? 1 : 0.35} />;
    })}
    <B pos={[3.5, 6.2, 0]} s={[5, 0.3, 3]} c="#2a3a4a" e={0.2} />
    <Label text="−14 LUFS" w={3.2} h={0.8} position={[3.5, 6.9, 1.55]} color={cyan} />
  </group>
);

/** OpenCV: a scan plane sweeping down + a detection box around the bot */
export const Scan: React.FC<{ a: number }> = ({ a }) => {
  const y = 9 - 9 * clamp((a % 1.2) / 1.2), k = E.out(lin(a, 0.5, 0.9));
  return (
    <group>
      <mesh position={[0, y, 1]} rotation-x={-Math.PI / 2}><planeGeometry args={[12, 6]} /><meshBasicMaterial color={cyan} transparent opacity={0.14} toneMapped={false} side={THREE.DoubleSide} /></mesh>
      <B pos={[0, y, 1]} s={[12, 0.04, 0.04]} c={cyan} e={1} />
      {k > 0 ? (
        <group scale={[k, k, 1]} position={[0, 3, 1.5]}>
          {[[0, 3.2, 0, 8.8, 0.08], [0, -3.2, 0, 8.8, 0.08]].map(([x, y2, , w, h], i) => <B key={i} pos={[x, y2, 0]} s={[w, h, 0.05]} c="#58D6AF" e={1} />)}
          {[-4.4, 4.4].map((x) => <B key={x} pos={[x, 0, 0]} s={[0.08, 6.4, 0.05]} c="#58D6AF" e={1} />)}
          <Label text="bot 0.99" w={2.8} h={0.7} position={[-2.9, 3.75, 0]} color="#071522" bg="#58D6AF" />
        </group>
      ) : null}
    </group>
  );
};

/** Pillow: a contact sheet wall of the 16 real repo headers */
export const ContactSheet: React.FC<{ a: number; texs: THREE.Texture[] }> = ({ a, texs }) => (
  <group position={[0, 5.2, -2.5]}>
    {texs.map((t, i) => {
      const k = E.back(lin(a, i * 0.035, i * 0.035 + 0.3)), x = (i % 4 - 1.5) * 3.3, y = (1.5 - Math.floor(i / 4)) * 1.95;
      return <mesh key={i} position={[x, y, 0]} scale={k}><planeGeometry args={[3.15, 1.77]} /><meshBasicMaterial map={t} toneMapped={false} /></mesh>;
    })}
  </group>
);

/** faster-whisper: the spoken words float out of the bot as caption chips */
export const Bubbles: React.FC<{ a: number; words: string[] }> = ({ a, words }) => (
  <group position={[0, 4.6, 1.8]}>
    {words.map((w, i) => {
      const t0 = i * 0.28, u = lin(a, t0, t0 + 1.6);
      if (u <= 0) return null;
      return <Label key={i} text={w} w={0.5 + w.length * 0.34} h={0.8} color="#071522" bg={i % 2 ? cyan : '#E8F3F7'} position={[(i % 2 ? 1 : -1) * (1.2 + u * 2.4), u * 5.5, u * 1.5]} scale={E.back(lin(a, t0, t0 + 0.25))} />;
    })}
  </group>
);

/** FFmpeg: a conveyor into an encoder; a reel goes in, an MP4 comes out */
export const Encoder: React.FC<{ a: number }> = ({ a }) => {
  const u = clamp(a / 2.6), inX = -8 + 8 * E.inout(clamp(u * 2)), outX = 1.8 + 8 * E.out(clamp(u * 2 - 1));
  return (
    <group position={[0, 0, 0.5]}>
      <B pos={[0, 0.35, 0]} s={[20, 0.3, 2.6]} c="#1b2128" />
      {Array.from({ length: 20 }, (_, i) => <B key={i} pos={[-9.5 + ((i + a * 4) % 20), 0.52, 0]} s={[0.12, 0.06, 2.5]} c="#3b4652" />)}
      <B pos={[0, 2.4, 0]} s={[3.6, 4.2, 3.4]} c="#2b3440" e={0.1 + 0.3 * Math.abs(Math.sin(a * 9)) * (u > 0.3 && u < 0.7 ? 1 : 0)} />
      <Label text="FFMPEG" w={3} h={0.7} position={[0, 3.6, 1.72]} color={amber} />
      {u < 0.5 ? <mesh position={[inX, 1.4, 0]} rotation-x={Math.PI / 2}><cylinderGeometry args={[0.95, 0.95, 0.4, 24]} /><meshStandardMaterial color="#c8ccd2" metalness={0.7} roughness={0.3} /></mesh> : null}
      {u > 0.5 ? <group position={[outX, 1.2, 0]}><B pos={[0, 0, 0]} s={[1.9, 1.3, 1.3]} c={cyan} e={0.4} /><Label text="MP4" w={1.6} h={0.55} position={[0, 0, 0.67]} color="#071522" /></group> : null}
    </group>
  );
};

/** ReportLab: a page prints out of a slot and lands in the bot's hands */
export const Printer: React.FC<{ a: number }> = ({ a }) => {
  const u = E.out(lin(a, 0.2, 1.2));
  return (
    <group position={[3.5, 0, 0]}>
      <B pos={[0, 1.6, 0]} s={[3.6, 3.2, 2.8]} c="#e2ded6" />
      <B pos={[0, 3.25, 0.6]} s={[2.8, 0.12, 0.3]} c="#20242a" />
      <group position={[0, 3.3 + u * 2.4, 0.6 + u * 1.2]} rotation-x={-0.4 + u * 0.4}>
        <mesh><planeGeometry args={[2.4, 3.2]} /><meshStandardMaterial color="#ffffff" side={THREE.DoubleSide} /></mesh>
        <Label text={'PROMPT\nPACK.PDF'} w={2.2} h={1.2} position={[0, 0.6, 0.01]} color="#D97757" size={150} />
        {[0, 1, 2, 3, 4].map((i) => <mesh key={i} position={[0, -0.3 - i * 0.28, 0.01]}><planeGeometry args={[1.9 - (i % 2) * 0.5, 0.09]} /><meshBasicMaterial color="#9aa3ad" /></mesh>)}
      </group>
    </group>
  );
};

/** the stomp shockwave: an expanding ring on the floor + dust puffs */
export const Shock: React.FC<{ a: number; pos?: [number, number, number]; c?: string }> = ({ a, pos = [0, 0.05, 0], c = amber }) => {
  if (a < 0 || a > 0.8) return null;
  const u = a / 0.8, r = 1 + 9 * E.out(u);
  return (
    <group position={pos}>
      <mesh rotation-x={-Math.PI / 2}><ringGeometry args={[r * 0.86, r, 64]} /><meshBasicMaterial color={c} transparent opacity={0.8 * (1 - u)} toneMapped={false} side={THREE.DoubleSide} /></mesh>
      {Array.from({ length: 10 }, (_, i) => { const th = (i / 10) * Math.PI * 2, d = 2.5 + 3.5 * E.out(u); return <mesh key={i} position={[Math.cos(th) * d, 0.3 + u * 0.8, Math.sin(th) * d]} scale={0.6 + u}><sphereGeometry args={[0.3, 6, 5]} /><meshBasicMaterial color="#c9b8a6" transparent opacity={0.5 * (1 - u)} /></mesh>; })}
    </group>
  );
};

export const COL = { cyan, amber, orange, ink };
