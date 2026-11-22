// THE BALL. One bouncing ball (the first exercise every animator does) that starts as AI slop (level 0) and gains one
// upgrade per repo (level 1..18). Each upgrade is our own illustration of what that repo does; the layers add up.
// The stage is a stack of DOM layers (each its own SVG) so EffectCraft's beat can really pull them apart in 3D.
// Pure function of t: impacts land on the score's beat grid (120 BPM, every 0.5 s from t = 0).
import React from 'react';
import { REPOS } from '../reel/repos';
import { E, clamp, lerp, lin, spring } from '../reel/timeline';

export const SW = 1000, SH = 860;            // stage units
const BEAT = 0.5, FLOOR = 690, R0 = 66;
const C = { ink: '#F3F1EC', coral: '#ff6b57', ice: '#8fd3ff', night: '#0b1020', gold: '#ffcf5a', mute: '#7d8796' };

/** seeded hash in [0,1) */
const h1 = (n: number) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

export type BallState = { x: number; y: number; sx: number; sy: number; rot: number; u: number; k: number; H: number };
/** kinematics at time t for level L (H = bounce height multiplier from the Tweakpane slider) */
export function ball(t: number, L: number, H = 1): BallState {
  const k = Math.floor(t / BEAT), u = t / BEAT - k;
  const px = (t % 8) / 8, tri = px < 0.5 ? px * 2 : 2 - px * 2;                 // ping-pong across the stage, 8 s period
  const xe = L >= 2 ? tri * tri * (3 - 2 * tri) : tri;                            // eased travel once timing is fixed
  const x = lerp(180, 820, xe);
  const hmax = 360 * H;
  if (L < 1) {                                                                     // slop: linear triangle, no weight
    const y = hmax * (1 - Math.abs(2 * u - 1));
    return { x, y, sx: 1, sy: 1, rot: 0, u, k, H };
  }
  const y = hmax * 4 * u * (1 - u);                                                // reanimate: the copied parabola
  if (L < 2) return { x, y, sx: 1, sy: 1, rot: 0, u, k, H };
  // motion-design-skill: squash on contact, stretch with speed, a little spin
  const dc = Math.min(u, 1 - u) * BEAT, contact = Math.exp(-dc / 0.035);
  const v = Math.abs(1 - 2 * u), stretch = 1 + 0.22 * v * (1 - contact);
  const sq = 1 - 0.32 * contact;
  return { x, y, sx: (1 / Math.sqrt(stretch)) * (1 / sq) ** 0.5 * (contact > 0.5 ? 1.08 : 1), sy: stretch * sq, rot: (t * 140) % 360, u, k, H };
}

/** the style the stage is in (mg-styles-15 cycles through three looks on its beat, then settles on "night neon") */
function look(L: number, a: number) {
  const looks = [
    { bg: '#d9d9d6', floor: '#c4c4c0', ball: '#9aa0a6', ink: '#5a5f66' },      // slop grey
    { bg: '#fff1e2', floor: '#f0d9c4', ball: '#ff8fab', ink: '#7a4d3a' },      // pastel
    { bg: '#ffe14d', floor: '#111', ball: '#111111', ink: '#111' },            // brutalist
    { bg: C.night, floor: '#141b30', ball: C.coral, ink: C.ice },              // night neon (final)
  ];
  if (L < 3) return looks[0];
  if (L === 3 && a < 1.2) return looks[1 + Math.min(2, Math.floor(a / 0.4))];
  return looks[3];
}

const Layer: React.FC<{ children: React.ReactNode; z?: number; ex: number; i: number; label?: string; style?: React.CSSProperties }> = ({ children, ex, i, label, style }) => (
  <div style={{ position: 'absolute', inset: 0, transformStyle: 'preserve-3d', transform: ex > 0 ? `translateZ(${i * 110 * ex}px)` : undefined, ...style }}>
    <svg width="100%" height="100%" viewBox={`0 0 ${SW} ${SH}`} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>{children}</svg>
    {ex > 0.4 && label ? <div style={{ position: 'absolute', left: -12, top: 18, padding: '4px 10px', borderRadius: 8, background: 'rgba(5,7,10,.85)', color: C.ink, fontFamily: '"JetBrains Mono", monospace', fontSize: 22, opacity: (ex - 0.4) / 0.6, transform: 'translateX(-100%)' }}>{label}</div> : null}
  </div>
);

/** painted ink-wash ridges (huashu): layered brush strokes, seeded, drifting */
function Paint({ t, reveal }: { t: number; reveal: number }) {
  const ridges = [0, 1, 2, 3];
  return (
    <g>
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0a0f22" /><stop offset="0.6" stopColor="#1b2448" /><stop offset="1" stopColor="#2c2a4a" /></linearGradient>
        <filter id="brush"><feTurbulence type="fractalNoise" baseFrequency="0.012 0.08" numOctaves="3" seed="4" /><feDisplacementMap in="SourceGraphic" scale="22" /></filter>
        <clipPath id="rev"><rect x={-600} y={-800} width={(SW + 1200) * reveal} height={SH + 1600} /></clipPath>
      </defs>
      <g clipPath="url(#rev)">
        <rect x={-600} y={-800} width={SW + 1200} height={SH + 1600} fill="url(#sky)" />
        <circle cx={760} cy={170} r={58} fill="#f6e7c8" opacity={0.85} />
        {ridges.map((r) => {
          const base = 380 + r * 85, drift = (t * (6 + r * 5)) % 400, pts: string[] = [];
          for (let x = -600; x <= SW + 600; x += 40) pts.push(`${x},${base - 90 * Math.abs(Math.sin((x + drift + r * 300) / (170 + r * 40))) - 40 * h1(Math.floor((x + drift) / 40) + r * 99)}`);
          return <polygon key={r} points={`-600,${SH + 800} ${pts.join(' ')} ${SW + 600},${SH + 800}`} fill={['#1d2650', '#232c58', '#151b38', '#0e1328'][r]} opacity={0.92} filter="url(#brush)" />;
        })}
      </g>
    </g>
  );
}

export const Stage: React.FC<{ t: number; L: number; a: number; full?: boolean; slopHalf?: number }> = ({ t, L, a, full = false, slopHalf = 0 }) => {
  // Tweakpane's slider raises the bounce while it plays, and the new height stays
  const H = L < 10 ? 1 : L > 10 ? 1.18 : 1 + 0.18 * E.inout(lin(a, 0.5, 1.6));
  const b = ball(t, L, H), lk = look(L, a), r = R0;
  const cx = b.x, cy = FLOOR - r * b.sy - b.y;
  const act = (n: number) => L === n;                       // this level is the one being demonstrated now
  const ex = act(11) ? E.inout(lin(a, 0.15, 0.7)) * (1 - E.inout(lin(a, 1.5, 2.1))) : 0;   // EffectCraft explode
  const cine = L >= 12 ? (act(12) ? E.out(lin(a, 0, 0.5)) : 1) : 0;
  const rem = act(17) ? E.inout(lin(a, 0.1, 0.6)) * (1 - E.inout(lin(a, 2.6, 3.2))) : 0;    // Remotion: shrink into timeline
  const post = L >= 9 ? (act(9) ? E.inout(lin(a, 0.2, 1.4)) : 1) : 0;                    // postfx wipe position
  const trail = Array.from({ length: 10 }, (_, i) => { const q = ball(t - (i + 1) * 0.03, L, H); return { x: q.x, y: FLOOR - r - q.y, i }; });
  const impacts = [0, 1, 2].map((j) => ({ k: b.k - j, age: (b.u + j) * BEAT }));
  const words = ['MAKE', 'EVERY', 'BOUNCE', 'LAND'];

  const ballG = (
    <g transform={`translate(${cx} ${cy}) scale(${b.sx} ${b.sy})`}>
      {L >= 7 ? (
        <>
          <defs>
            <radialGradient id="sh" cx="0.35" cy="0.3" r="0.8"><stop offset="0" stopColor="#ffd0c6" /><stop offset="0.35" stopColor={lk.ball} /><stop offset="1" stopColor="#7a1f22" /></radialGradient>
            <radialGradient id="rim" cx="0.5" cy="0.5" r="0.5"><stop offset="0.78" stopColor="rgba(143,211,255,0)" /><stop offset="1" stopColor="rgba(143,211,255,.75)" /></radialGradient>
          </defs>
          <circle r={r} fill="url(#sh)" />
          <circle r={r} fill="url(#rim)" />
          <ellipse cx={-22} cy={-26} rx={14} ry={9} fill="#fff" opacity={0.85} transform="rotate(-30)" />
        </>
      ) : <circle r={r} fill={lk.ball} />}
      {L >= 5 ? (() => {   // anidoodle: a doodled face + a boiling outline on twos
        const seed = Math.floor(t * 12), pts: string[] = [];
        for (let i = 0; i <= 24; i++) { const th = (i / 24) * Math.PI * 2, rr = r + 3 + 4 * (h1(seed * 31 + i) - 0.5); pts.push(`${Math.cos(th) * rr},${Math.sin(th) * rr}`); }
        const blink = (t % 2.7) > 2.6 ? 0.15 : 1;
        return (
          <g>
            <polyline points={pts.join(' ')} fill="none" stroke={L >= 7 ? '#2a0d0d' : lk.ink} strokeWidth={5} strokeLinejoin="round" />
            <ellipse cx={-20} cy={-10} rx={8} ry={13 * blink} fill="#1a0b0b" /><ellipse cx={20} cy={-10} rx={8} ry={13 * blink} fill="#1a0b0b" />
            <path d={`M -22 18 Q 0 ${b.u < 0.15 || b.u > 0.85 ? 26 : 38} 22 18`} fill="none" stroke="#1a0b0b" strokeWidth={6} strokeLinecap="round" />
          </g>
        );
      })() : null}
    </g>
  );

  const layers: { label: string; node: React.ReactNode }[] = [
    { label: 'background', node: L >= 4 ? <Paint t={t} reveal={act(4) ? E.inout(lin(a, 0.1, 1.3)) : 1} /> : <rect x={-600} y={-800} width={SW + 1200} height={SH + 1600} fill={lk.bg} /> },
    { label: 'floor', node: (
      <g>
        <rect x={-600} y={FLOOR} width={SW + 1200} height={600} fill={L >= 4 ? '#0c1124' : lk.floor} />
        {L >= 7 ? Array.from({ length: 13 }, (_, i) => <line key={i} x1={500 + (i - 6) * 90} y1={FLOOR} x2={500 + (i - 6) * 300} y2={SH + 400} stroke="#24305a" strokeWidth={2} />) : null}
        {L >= 7 ? <ellipse cx={cx} cy={FLOOR + 6} rx={r * (1.2 - b.y / 900)} ry={14 * (1.2 - b.y / 900)} fill="#000" opacity={0.55 - b.y / 1400} /> : null}
        {L >= 15 ? (() => {   // librosa: the beat strip (impacts land on the ticks)
          const off = (t / BEAT) % 1;
          return <g>{Array.from({ length: 24 }, (_, i) => { const x = (i - off) * 70 - 300 + 500 - 70 * 3; const on = i === 7; return <g key={i}><rect x={x - 3} y={FLOOR + 40 - (on ? 34 : 16) - 10 * h1(i + Math.floor(t / BEAT))} width={6} height={(on ? 34 : 16) + 10 * h1(i + Math.floor(t / BEAT))} fill={on && b.u < 0.15 ? C.gold : '#3b4a7a'} /></g>; })}
            <text x={40} y={FLOOR + 92} fill={C.mute} fontFamily="JetBrains Mono" fontSize={24}>librosa · 120.2 BPM</text></g>;
        })() : null}
      </g>) },
    { label: 'path + math', node: (
      <g>
        {L >= 1 && L < 2 || act(1) ? Array.from({ length: 9 }, (_, i) => {   // reanimate: onion-skin of the reference bounce
          const q = ball(t + (i - 4) * 0.06, 1, H); return <circle key={i} cx={q.x} cy={FLOOR - r - q.y} r={r} fill="none" stroke={C.ice} strokeWidth={3} strokeDasharray="8 8" opacity={act(1) ? 0.55 * (1 - Math.abs(i - 4) / 5) : 0} />;
        }) : null}
        {L >= 6 ? (() => {   // Manim: the arc, plotted
          const span = 2 * BEAT, k0 = Math.floor(t / span) * span, pts: string[] = [];
          const draw = act(6) ? E.inout(lin(a, 0.2, 1.2)) : 1;
          for (let i = 0; i <= 60 * draw; i++) { const tt = k0 + (i / 60) * span; const q = ball(tt, L, H); pts.push(`${q.x},${FLOOR - r - q.y}`); }
          return <polyline points={pts.join(' ')} fill="none" stroke={C.gold} strokeWidth={3} strokeDasharray="2 10" strokeLinecap="round" opacity={0.75} />;
        })() : null}
      </g>) },
    { label: 'particles', node: L >= 8 ? (
      <g>
        {trail.map((p) => <circle key={p.i} cx={p.x} cy={p.y + r * 0.2} r={r * (0.5 - p.i * 0.04)} fill={C.coral} opacity={0.16 * (1 - p.i / 10)} />)}
        {impacts.map((im) => im.age < 0.6 ? Array.from({ length: 16 }, (_, i) => {
          const s = im.k * 17 + i, ang = Math.PI * (0.1 + 0.8 * h1(s)), sp = 260 + 340 * h1(s + 5), ix = ball(im.k * BEAT, L, H).x;
          const x = ix + Math.cos(ang) * sp * im.age * (h1(s + 9) > 0.5 ? 1 : -1), y = FLOOR - Math.sin(ang) * sp * im.age + 900 * im.age * im.age;
          return <circle key={`${im.k}-${i}`} cx={x} cy={Math.min(FLOOR, y)} r={4 + 4 * h1(s + 2)} fill={i % 3 ? C.gold : C.ice} opacity={1 - im.age / 0.6} />;
        }) : null)}
        {L >= 14 ? impacts.map((im) => im.age < 0.45 ? <ellipse key={`w${im.k}`} cx={ball(im.k * BEAT, L, H).x} cy={FLOOR - 10} rx={40 + 420 * im.age} ry={12 + 110 * im.age} fill="none" stroke={C.ice} strokeWidth={4} opacity={0.6 * (1 - im.age / 0.45)} /> : null) : null}
      </g>) : null },
    { label: 'ball', node: ballG },
    { label: 'type', node: (
      <g>
        {cine > 0 ? <text x={500} y={300} textAnchor="middle" fontFamily="Archivo" fontWeight={900} fontSize={190} fill="#fff" opacity={0.12 * cine} style={{ fontStretch: '70%' }}>BOUNCE</text> : null}
        {L >= 6 ? <text x={50} y={90} fontFamily="Georgia, serif" fontStyle="italic" fontSize={42} fill={C.gold} opacity={act(6) ? clamp((a - 0.1) / 0.4) : 0.65}>y = h · 4u(1 − u)</text> : null}
        {L >= 16 ? (() => { const w = words[b.k % 4], sc = spring(b.u * BEAT, 22, 0.4); return <text x={500} y={210} textAnchor="middle" fontFamily="Archivo" fontWeight={900} fontSize={110} fill={b.k % 4 === 3 ? C.gold : '#fff'} transform={`translate(500 190) scale(${0.6 + 0.4 * sc}) translate(-500 -190)`} style={{ fontStretch: '74%' }}>{w}</text>; })() : null}
        {L < 2 ? <text x={500} y={120} textAnchor="middle" fontFamily="JetBrains Mono" fontSize={30} fill={lk.ink} opacity={0.7}>linear · no weight · no style</text> : null}
      </g>) },
  ];

  // postfx: bloom (a blurred bright copy), vignette and grain, revealed by a wipe on its beat
  const postLayer = post > 0 ? (
    <div style={{ position: 'absolute', inset: 0, clipPath: `inset(0 ${100 - post * 100}% 0 0)` }}>
      <div style={{ position: 'absolute', inset: 0, filter: 'blur(26px) brightness(1.6)', mixBlendMode: 'screen', opacity: 0.55 }}>
        <svg width="100%" height="100%" viewBox={`0 0 ${SW} ${SH}`}>{ballG}{layers[3].node}</svg>
      </div>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 45%, transparent 45%, rgba(0,0,0,.55) 100%)' }} />
      <svg width="100%" height="100%" viewBox={`0 0 ${SW} ${SH}`} style={{ position: 'absolute', inset: 0, mixBlendMode: 'overlay', opacity: 0.35 }}>
        <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={Math.floor(t * 24) % 997} /></filter>
        <rect width={SW} height={SH} filter="url(#grain)" />
      </svg>
      {act(9) && post < 1 ? <div style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: 4, background: C.gold, boxShadow: `0 0 20px ${C.gold}` }} /> : null}
    </div>
  ) : null;

  const tile = act(7) ? E.inout(lin(a, 0.1, 1.3)) : 1;    // blender: render tiles reveal the 3D look
  const stack = (
    <div style={{ position: 'absolute', inset: 0, transformStyle: 'preserve-3d', transform: ex > 0 ? `rotateX(${52 * ex}deg) rotateZ(${-28 * ex}deg) scale(${1 - 0.28 * ex})` : undefined }}>
      {layers.map((l, i) => <Layer key={l.label} i={i} ex={ex} label={l.label} style={ex > 0 ? { outline: `2px solid rgba(143,211,255,${0.6 * ex})`, background: i === 0 ? undefined : `rgba(143,211,255,${0.04 * ex})` } : undefined}>{l.node}</Layer>)}
    </div>
  );
  const slop = slopHalf > 0 ? (
    <div style={{ position: 'absolute', inset: 0, clipPath: `inset(0 ${100 - slopHalf * 100}% 0 0)` }}>
      <Stage t={t} L={0} a={0} />
      <div style={{ position: 'absolute', left: 20, top: 20, padding: '6px 14px', borderRadius: 10, background: '#111', color: '#fff', fontFamily: 'Archivo', fontWeight: 900, fontSize: 34 }}>SLOP</div>
    </div>
  ) : null;

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: ex > 0 ? 'visible' : 'hidden', perspective: 2200, transform: `scale(${1 - 0.42 * rem}) translateY(${-260 * rem}px) scale(${1 + 0.06 * cine * (full ? 0 : 1)})`, transformOrigin: '50% 40%' }}>
      {tile < 1 ? (
        <>
          <Stage t={t} L={6} a={9} />
          <div style={{ position: 'absolute', inset: 0, maskImage: tilesMask(tile), WebkitMaskImage: tilesMask(tile), maskSize: '100% 100%', WebkitMaskSize: '100% 100%' }}>{stack}</div>
          <div style={{ position: 'absolute', left: 24, bottom: 24, fontFamily: '"JetBrains Mono", monospace', fontSize: 26, color: C.ink, background: 'rgba(0,0,0,.6)', padding: '6px 12px', borderRadius: 8 }}>rendering 3D · {Math.round(tile * 100)}%</div>
        </>
      ) : stack}
      {postLayer}
      {cine > 0 ? <><div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 70 * cine, background: '#000' }} /><div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 70 * cine, background: '#000' }} /></> : null}
      {act(2) ? <Easing a={a} /> : null}
      {act(3) ? <Swatches a={a} /> : null}
      {act(10) ? <Pane a={a} H={H} /> : null}
      {act(18) ? <Export a={a} /> : null}
      {slop}
    </div>
  );
};

/** blender's render tiles: 8 x 7 buckets revealed in a scattered order, as a mask image */
function tilesMask(u: number) {
  const n = 56, on = Math.floor(u * n); let rects = '';
  for (let i = 0; i < on; i++) { const j = (i * 23) % n; rects += `<rect x='${j % 8}' y='${Math.floor(j / 8)}' width='1.02' height='1.02' fill='white'/>`; }
  return `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 8 7' preserveAspectRatio='none'>${rects}</svg>")`;
}

/** motion-design-skill: the easing curve that replaces the linear move */
function Easing({ a }: { a: number }) {
  const u = E.out(lin(a, 0.1, 0.5)), d = E.inout(lin(a, 0.3, 1.2)), pts: string[] = [], lp: string[] = [];
  for (let i = 0; i <= 40; i++) { const x = i / 40; pts.push(`${20 + x * 240},${260 - (x * x * (3 - 2 * x)) * 220}`); lp.push(`${20 + x * 240},${260 - x * 220}`); }
  return (
    <div style={{ position: 'absolute', left: 24, top: 24, width: 290, height: 290, borderRadius: 18, background: 'rgba(5,7,10,.82)', border: '1px solid rgba(255,255,255,.18)', opacity: u, transform: `scale(${0.9 + 0.1 * u})` }}>
      <svg width="290" height="290"><polyline points={lp.join(' ')} fill="none" stroke="#7d8796" strokeWidth={3} strokeDasharray="6 6" />
        <polyline points={pts.slice(0, Math.max(2, Math.round(41 * d))).join(' ')} fill="none" stroke="#ffcf5a" strokeWidth={6} strokeLinecap="round" />
        <text x={20} y={30} fill="#F3F1EC" fontFamily="JetBrains Mono" fontSize={20}>linear → ease + squash</text></svg>
    </div>
  );
}
function Swatches({ a }: { a: number }) {
  const cols = [['#fff1e2', '#ff8fab'], ['#ffe14d', '#111'], ['#0b1020', '#ff6b57']], cur = Math.min(2, Math.floor(a / 0.4));
  return <div style={{ position: 'absolute', right: 24, top: 24, display: 'flex', gap: 12 }}>{cols.map(([bg, fg], i) => <div key={i} style={{ width: 84, height: 84, borderRadius: 16, background: bg, border: `4px solid ${i === cur ? '#ffcf5a' : 'rgba(255,255,255,.25)'}`, display: 'grid', placeItems: 'center', transform: `scale(${i === cur ? 1.1 : 1})` }}><div style={{ width: 34, height: 34, borderRadius: 17, background: fg }} /></div>)}
    <div style={{ position: 'absolute', right: 0, top: 96, whiteSpace: 'nowrap', fontFamily: '"JetBrains Mono", monospace', fontSize: 22, color: '#F3F1EC' }}>style {String(cur + 1).padStart(2, '0')} / 15</div></div>;
}
function Pane({ a, H }: { a: number; H: number }) {
  const u = E.out(lin(a, 0.05, 0.35)) * (1 - E.in(lin(a, 2.1, 2.45)));
  const rows: [string, number][] = [['bounce', (H - 1) / 0.18 * 0.4 + 0.5], ['squash', 0.68], ['glow', 0.55]];
  return (
    <div style={{ position: 'absolute', right: 24, top: 24, width: 330, padding: 16, borderRadius: 10, background: '#28292e', color: '#c8c9cf', fontFamily: 'Inter', fontSize: 20, opacity: u, transform: `translateX(${(1 - u) * 40}px)`, boxShadow: '0 12px 30px rgba(0,0,0,.5)' }}>
      {rows.map(([n, v]) => <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '8px 0' }}><span style={{ width: 70 }}>{n}</span>
        <div style={{ flex: 1, height: 8, borderRadius: 4, background: '#3b3d44', position: 'relative' }}><div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${v * 100}%`, borderRadius: 4, background: '#8fd3ff' }} /><div style={{ position: 'absolute', left: `calc(${v * 100}% - 9px)`, top: -5, width: 18, height: 18, borderRadius: 9, background: '#e8e9ee' }} /></div>
        <span style={{ width: 48, fontFamily: '"JetBrains Mono", monospace', fontSize: 18 }}>{v.toFixed(2)}</span></div>)}
    </div>
  );
}
function Export({ a }: { a: number }) {
  const cmd = 'ffmpeg -i frames/%05d.png -c:v libx264 -pix_fmt yuv420p bounce.mp4', n = Math.round(cmd.length * E.out(lin(a, 0.1, 0.9))), p = E.inout(lin(a, 0.9, 2.4)), o = 1 - E.in(lin(a, 3.2, 3.7));
  if (o <= 0) return null;
  return (
    <div style={{ opacity: o, position: 'absolute', left: 24, right: 24, bottom: 24, padding: '16px 20px', borderRadius: 14, background: 'rgba(5,7,10,.9)', border: '1px solid rgba(255,255,255,.18)', fontFamily: '"JetBrains Mono", monospace', fontSize: 22, color: '#F3F1EC' }}>
      <div>$ {cmd.slice(0, n)}</div>
      <div style={{ marginTop: 12, height: 14, borderRadius: 7, background: '#1d2433' }}><div style={{ width: `${p * 100}%`, height: '100%', borderRadius: 7, background: p >= 1 ? '#58e0a0' : '#8fd3ff' }} /></div>
      <div style={{ marginTop: 8, color: p >= 1 ? '#58e0a0' : '#7d8796' }}>{p >= 1 ? '✓ bounce.mp4 · H.264 · yuv420p' : `encoding · ${Math.round(p * 100)}%`}</div>
    </div>
  );
}
export const _REPOS = REPOS;
