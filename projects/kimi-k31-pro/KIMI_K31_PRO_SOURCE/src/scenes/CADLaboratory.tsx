// 05 · 3D ENGINEERING LAB (illustrative reconstruction). Match cut from the gear: the fan disk of a turbofan, front-on in
// wireframe. The camera orbits to an orthographic side view where a reference sketch draws itself (profiles + parametric
// dimensions), then shifts from orthographic to perspective while surfaces grow around the axis, turn solid, explode
// along the axis with callouts, and lock back together. BenchCAD numbers, two parametric beats (tower twist, configurable
// lamp), then the exit: a dimension arc around the hub that becomes the hip joint of scene 06.
import React, { useMemo } from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import * as THREE from 'three';
import { BENCHCAD } from '../data/benchmarkData';
import { CLAIMS } from '../data/verifiedClaims';
import { clamp, countUp, easeInOutCubic, easeOutCubic, fmt, invLerp, keys, lerp, reveal, window_ } from '../lib/anim';
import { useLayout } from '../lib/layout';
import { C, WORLD } from '../styles/theme';
import { F } from '../styles/typography';
import { ProvenanceLabel } from '../components/ProvenanceLabel';
import { SourceAttribution } from '../components/SourceAttribution';
import { CamRig, Env, ThreeStage, orbit, project, type V3 } from '../three/stage';
import { SKETCH, Turbofan, PART_ANCHORS } from '../three/Turbofan';
import { Lamp, Tower } from '../three/ParametricObjects';
import type { SceneProps } from './types';

const D2R = Math.PI / 180;

/** the reference sketch: profile outlines mirrored about the axis, in the plane x = 0, drawn progressively */
const Sketch: React.FC<{ draw: number; opacity: number }> = ({ draw, opacity }) => {
  const { lines, dims, mat, dimMat } = useMemo(() => {
    const mat = new THREE.LineBasicMaterial({ color: '#E6EAF0', transparent: true });
    const dimMat = new THREE.LineDashedMaterial({ color: '#5CE1FF', transparent: true, dashSize: 0.06, gapSize: 0.04 });
    const mk = (pts: [number, number][], s: number) => new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts.map(([r, z]) => new THREE.Vector3(0, r * s, z))), mat);
    const lines = SKETCH.flatMap((pr) => [mk(pr, 1), mk(pr, -1)]);
    const seg = (a: V3, b: V3) => { const l = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(...a), new THREE.Vector3(...b)]), dimMat); l.computeLineDistances(); return l; };
    const dims = [
      seg([0, -1.6, 2.06], [0, -1.6, -2.95]), seg([0, -1.5, 2.06], [0, -1.7, 2.06]), seg([0, -1.5, -2.95], [0, -1.7, -2.95]),
      seg([0, 1.0, 2.45], [0, -1.0, 2.45]), seg([0, 1.0, 2.37], [0, 1.0, 2.53]), seg([0, -1.0, 2.37], [0, -1.0, 2.53]),
      seg([0, 0.62, -3.25], [0, -0.62, -3.25]), seg([0, 0.0, 2.3], [0, 0.0, -3.4]),
    ];
    return { lines, dims, mat, dimMat };
  }, []);
  mat.opacity = opacity; dimMat.opacity = opacity * 0.9;
  lines.forEach((l, i) => {
    const n = l.geometry.attributes.position.count, k = clamp(draw * 1.25 - (i / lines.length) * 0.25);
    l.geometry.setDrawRange(0, Math.max(0, Math.ceil(n * k)));
  });
  return (
    <group>
      {lines.map((l, i) => <primitive key={i} object={l} />)}
      {dims.map((l, i) => <primitive key={`d${i}`} object={l} visible={draw > 0.55} />)}
    </group>
  );
};

/** small parametric viewport (its own canvas), shown only during the parametric beat */
const ParamCard: React.FC<{ title: string; param: string; value: number; children: React.ReactNode; x: number; y: number; w: number; h: number; on: number; cam: V3; target: V3 }> = ({ title, param, value, children, x, y, w, h, on, cam, target }) => (
  <div style={{ position: 'absolute', left: x, top: y, width: w, height: h, borderRadius: 14, overflow: 'hidden', opacity: on, transform: `translateY(${(1 - on) * 24}px)`,
    background: 'linear-gradient(180deg, #353A43 0%, #1B1E23 100%)', border: '1px solid rgba(230,234,240,0.16)', boxShadow: '0 30px 60px rgba(0,0,0,0.45)' }}>
    <div style={{ position: 'absolute', inset: 0 }}>
      <ThreeStage width={w} height={h}>
        <Env intensity={1} />
        <CamRig pos={cam} target={target} fov={30} />
        <directionalLight position={[3, 5, 4]} intensity={2.2} />
        <ambientLight intensity={0.25} />
        {children}
      </ThreeStage>
    </div>
    <div style={{ position: 'absolute', left: 18, top: 14, fontFamily: F.mono, fontSize: 17, letterSpacing: '0.08em', color: WORLD.cad.ink }}>{title}</div>
    <div style={{ position: 'absolute', left: 18, right: 18, bottom: 16, display: 'flex', alignItems: 'center', gap: 12, fontFamily: F.mono, fontSize: 16, color: WORLD.cad.mute }}>
      <span style={{ minWidth: 110 }}>{param}</span>
      <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'rgba(230,234,240,0.18)', position: 'relative' }}>
        <div style={{ width: `${value * 100}%`, height: 4, borderRadius: 2, background: C.cyan }} />
        <div style={{ position: 'absolute', left: `calc(${value * 100}% - 8px)`, top: -6, width: 16, height: 16, borderRadius: 8, background: C.lunar, boxShadow: `0 0 10px ${C.cyan}` }} />
      </div>
    </div>
  </div>
);

const STAGES = ['SKETCH', 'CAD', '3D'];

export const CADLaboratory: React.FC<SceneProps> = ({ dur, variant }) => {
  const f = useCurrentFrame();
  const L = useLayout();
  const reel = variant === 'reel';
  const p = f / dur, t = f / 30;
  const k = (pts: [number, number][]) => keys(p, pts);

  // phase plan (fractions of the scene). The reel drops the parametric beat.
  const X = reel
    ? { side: 0.18, persp: 0.34, solid: 0.42, explode: [0.44, 0.56], back: [0.74, 0.82], param: [2, 2], exit: 0.86 }
    : { side: 0.19, persp: 0.36, solid: 0.44, explode: [0.45, 0.58], back: [0.64, 0.72], param: [0.73, 0.88], exit: 0.89 };

  const yaw = k([[0, 0], [0.05, 0], [X.side, 90], [X.side + 0.03, 90], [X.persp, 38], [X.explode[0], 34], [X.back[0], 56], [X.back[1], 46], [X.exit, 30], [X.exit + 0.05, 0], [1, 0]]) * D2R;
  const pitch = k([[0, 0], [X.side + 0.03, 0], [X.persp, 16], [X.back[0], 10], [X.exit, 12], [X.exit + 0.05, 0], [1, 0]]) * D2R;
  const fov = k([[0, 4], [X.side + 0.03, 4], [X.persp, 30], [X.exit, 30], [X.exit + 0.05, 4], [1, 4]]);
  const half = reel
    ? k([[0, 1.786 * 1.78], [X.side, 4.5], [X.persp, 4.9], [X.explode[0], 8.8], [X.explode[1], 9.8], [X.back[0], 9.8], [X.back[1], 8.8], [X.exit, 4.6], [X.exit + 0.05, 1.786 * 1.78], [1, 1.786 * 1.7]])
    : k([[0, 1.786], [X.side, 2.3], [X.persp, 2.4], [X.explode[1], 4.5], [X.back[0], 4.6], [X.back[1], 2.6], [X.param[0], 3.0], [X.param[1], 3.0], [X.exit, 2.5], [X.exit + 0.05, 1.786], [1, 1.70]]);
  const tz = k([[0, 1.36], [X.side, -0.45], [X.persp, -0.45], [X.explode[1], -0.6], [X.back[1], -0.45], [X.exit, -0.2], [X.exit + 0.05, 1.36], [1, 1.36]]);
  const tx = 0;
  const dist = half / Math.tan((fov * D2R) / 2);
  const target: V3 = [tx, 0, tz];
  const cam = orbit(target, dist, yaw, pitch);
  const uUp = reel ? easeInOutCubic(invLerp(0, 40 * D2R, yaw)) : 0;
  const up: V3 = [0, 1 - uUp, uUp];

  // model state
  const wire = k([[0, 1], [X.solid, 1], [X.solid + 0.06, 0.12], [X.exit, 0.12], [X.exit + 0.04, 1], [1, 1]]);
  const grow = easeInOutCubic(invLerp(X.side + 0.02, X.persp + 0.02, p));
  const solid = k([[0, 0], [X.persp - 0.02, 0], [X.solid, 1], [X.exit, 1], [X.exit + 0.04, 0], [1, 0]]);
  const explode = k([[0, 0], [X.explode[0], 0], [X.explode[1], reel ? 0.4 : 0.78], [X.back[0], reel ? 0.4 : 0.78], [X.back[1], 0], [1, 0]]);
  // reel: the model sits in the upper part of the frame (higher still while the BenchCAD panel is up)
  const vOff = reel ? 0.083 - 0.05 * window_(p, 0.1, 0.45, 0.04) + 0.012 * window_(p, 0.45, 0.85, 0.04) : 0;
  // while the BenchCAD panel is up (master), the model frames into the left of the viewport
  const shiftX = reel ? 0 : -0.14 * window_(p, 0.455, 0.74, 0.04) - 0.1 * window_(p, X.param[0] - 0.005, X.param[1] + 0.005, 0.03);
  const spin = t * 1.6 + 0.3;
  const sketchDraw = easeInOutCubic(invLerp(0.06, X.side + 0.02, p));
  const sketchOp = window_(p, 0.06, X.persp + 0.02, 0.04);
  const studio = easeOutCubic(invLerp(0.03, 0.16, p)) * (1 - easeInOutCubic(invLerp(X.exit, X.exit + 0.06, p)));
  const stage = p < X.side + 0.03 ? 0 : p < X.solid ? 1 : 2;

  // callouts during the exploded view
  const camObj = { pos: cam, target, fov, up, shiftX, viewOffsetY: vOff };
  const calloutOn = window_(p, X.explode[0] + 0.04, X.back[0] + 0.02, 0.03);
  const callouts = PART_ANCHORS.map((a) => {
    const z = a.z + a.explode * explode;
    const [x, y] = project([0, a.r * 1.04, z], camObj, L.w, L.h);
    return { ...a, x, y };
  });

  // BenchCAD panel
  const bcOn = window_(p, reel ? 0.46 : 0.47, reel ? 0.86 : 0.73, 0.025);
  const bcAt = (reel ? 0.5 : 0.52) * dur;

  // exit arc (exact geometry shared with HumanSimulation)
  const arcP = easeInOutCubic(invLerp((X.exit + 0.035) * dur, (X.exit + 0.1) * dur, f));
  const acx = L.w / 2, acy = reel ? 800 : 540, R = 194;
  const arcEnd = -90 + 270 * arcP;
  const ex = acx + R * Math.cos(arcEnd * D2R), ey = acy + R * Math.sin(arcEnd * D2R);
  const dark = easeInOutCubic(invLerp((X.exit + 0.05) * dur, dur, f));

  const paramOn = reel ? 0 : window_(p, X.param[0] + 0.01, X.param[1], 0.025);
  const twist = easeInOutCubic(invLerp(X.param[0] + 0.03, X.param[1] - 0.02, p));
  const panelW = 600;

  return (
    <AbsoluteFill style={{ background: `radial-gradient(110% 90% at 50% 38%, ${WORLD.cad.bg0} 0%, ${WORLD.cad.bg1} 70%)` }}>
      <AbsoluteFill style={{ background: '#05070C', opacity: 1 - studio }} />
      {/* blueprint grid of the viewport */}
      <AbsoluteFill style={{ opacity: studio * 0.9, backgroundImage: `linear-gradient(${WORLD.cad.grid} 1px, transparent 1px), linear-gradient(90deg, ${WORLD.cad.grid} 1px, transparent 1px), linear-gradient(${WORLD.cad.gridMajor} 1px, transparent 1px), linear-gradient(90deg, ${WORLD.cad.gridMajor} 1px, transparent 1px)`,
        backgroundSize: '40px 40px, 40px 40px, 200px 200px, 200px 200px', backgroundPosition: 'center' }} />
      <ThreeStage>
        <Env intensity={1.15} />
        <CamRig pos={cam} target={target} fov={fov} up={up} shiftX={shiftX} viewOffsetY={vOff} />
        <directionalLight position={[4, 6, 5]} intensity={2.4 * solid + 0.2} />
        <directionalLight position={[-5, 2, -4]} intensity={1.2 * solid} color="#BFD8FF" />
        <ambientLight intensity={0.2} />
        <Turbofan wire={wire} grow={grow} solid={solid} explode={explode} spin={spin} />
        <Sketch draw={sketchDraw} opacity={sketchOp} />
        {!reel && <gridHelper args={[30, 60, '#6F7886', '#3A3F48']} position={[0, -1.62, -0.4]} material-transparent material-opacity={0.35 * solid * studio} />}
      </ThreeStage>

      {/* sketch dimension labels (parametric names, not measurements) */}
      {sketchOp > 0.02 && ([['L', [0, -1.6, -0.45], 0, 26], ['Ø fan', [0, 0, 2.45], 18, 0], ['Ø core', [0, 0, -3.25], 18, 0]] as [string, V3, number, number][]).map(([s, pt, dx, dy]) => {
        const [x, y] = project(pt, camObj, L.w, L.h);
        return <div key={s} style={{ position: 'absolute', left: x + dx, top: y + dy, transform: 'translate(-50%,-50%)', fontFamily: F.mono, fontSize: L.t.evidence, color: C.cyan, opacity: sketchOp * reveal(p, 0.12, 0.04) }}>{s}</div>;
      })}

      {/* callouts */}
      {calloutOn > 0.01 && callouts.map((c, i) => (
        <div key={c.key} style={{ position: 'absolute', left: c.x, top: c.y, opacity: calloutOn * reveal(f, (X.explode[0] + 0.04) * dur + i * 3, 8) }}>
          <div style={{ position: 'absolute', left: 0, top: -64, width: 1, height: 64, background: 'rgba(230,234,240,0.7)' }} />
          <div style={{ position: 'absolute', left: -5, top: -5, width: 10, height: 10, borderRadius: 5, border: `2px solid ${C.cyan}` }} />
          <div style={{ position: 'absolute', left: 10, top: -84, whiteSpace: 'nowrap', fontFamily: F.mono, fontSize: L.t.label, letterSpacing: '0.08em', color: WORLD.cad.ink }}>{c.label}</div>
        </div>
      ))}

      {/* CAD chrome: stage tracker + axis gizmo */}
      <div style={{ position: 'absolute', left: L.safe.side, top: reel ? L.safe.top + 96 : 150, display: 'flex', gap: 14, alignItems: 'center', opacity: studio, fontFamily: F.display, fontWeight: 600, fontSize: reel ? 34 : 30, letterSpacing: '0.04em' }}>
        {STAGES.map((s, i) => (
          <React.Fragment key={s}>
            <span style={{ color: i === stage ? C.lunar : i < stage ? C.cyan : 'rgba(230,234,240,0.32)' }}>{s}</span>
            {i < 2 && <span style={{ color: 'rgba(230,234,240,0.4)', fontFamily: F.text }}>→</span>}
          </React.Fragment>
        ))}
      </div>
      <div style={{ position: 'absolute', left: L.safe.side, top: reel ? L.safe.top + 146 : 196, fontFamily: F.mono, fontSize: L.t.label, color: WORLD.cad.mute, opacity: studio }}>
        {['VIEW: FRONT', 'VIEW: RIGHT · ORTHOGRAPHIC', 'VIEW: PERSPECTIVE'][p < 0.07 ? 0 : p < X.side + 0.04 ? 1 : 2]} · {['SKETCH', 'WIREFRAME', 'SURFACE', 'SOLID', 'EXPLODED', 'ASSEMBLED'][p < X.side ? 0 : p < X.side + 0.06 ? 1 : p < X.solid ? 2 : p < X.explode[0] ? 3 : p < X.back[1] ? 4 : 5]}
      </div>
      <svg width={120} height={120} style={{ position: 'absolute', right: L.safe.side, top: reel ? 1220 : 900, opacity: studio * 0.9 }}>
        {([[1, 0, WORLD.cad.axisZ, 'Z'], [0, -1, WORLD.cad.axisY, 'Y'], [-0.6, 0.6, WORLD.cad.axisX, 'X']] as [number, number, string, string][]).map(([dx, dy, col, s]) => {
          const a = reel ? Math.atan2(dy, dx) : Math.atan2(dy, dx) - yaw * 0.6;
          const x2 = 60 + Math.cos(a) * 42, y2 = 60 + Math.sin(a) * 42;
          return <g key={s}><line x1={60} y1={60} x2={x2} y2={y2} stroke={col} strokeWidth={3} /><text x={x2 + Math.cos(a) * 12} y={y2 + Math.sin(a) * 12 + 5} fill={col} fontFamily="JetBrains Mono" fontSize={15} textAnchor="middle">{s}</text></g>;
        })}
      </svg>

      {/* BenchCAD */}
      {bcOn > 0.01 && (
        <div style={{ position: 'absolute', ...(reel ? { left: L.safe.side, right: L.safe.side, top: 935 } : { right: L.safe.side, top: 250, width: panelW }), opacity: bcOn,
          transform: `translateY(${(1 - easeOutCubic(bcOn)) * 20}px)`, padding: reel ? '24px 28px' : '26px 30px', borderRadius: 16, background: 'rgba(14,16,20,0.78)', border: '1px solid rgba(230,234,240,0.14)', backdropFilter: 'blur(8px)' }}>
          <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: reel ? 34 : 30, color: C.lunar, letterSpacing: '0.02em' }}>{BENCHCAD.title}</div>
          <div style={{ marginTop: reel ? 18 : 20, display: 'flex', flexDirection: 'column', gap: reel ? 12 : 14 }}>
            {BENCHCAD.bars.map((b, i) => {
              const at = bcAt + (b.hero ? 18 : i * 5), v = countUp(f, at, 34, b.value);
              return (
                <div key={b.model} style={{ display: 'grid', gridTemplateColumns: reel ? '250px 1fr 96px' : '210px 1fr 86px', alignItems: 'center', gap: 14 }}>
                  <span style={{ fontFamily: F.text, fontWeight: b.hero ? 700 : 500, fontSize: reel ? 26 : 22, color: b.hero ? C.lunar : WORLD.cad.mute }}>{b.model}</span>
                  <div style={{ height: b.hero ? 16 : 12, background: 'rgba(230,234,240,0.08)', borderRadius: 3 }}>
                    <div style={{ height: '100%', width: `${(v / BENCHCAD.axisMax) * 100}%`, borderRadius: 3, background: b.hero ? C.cyan : 'rgba(230,234,240,0.42)' }} />
                  </div>
                  <span style={{ fontFamily: F.mono, fontSize: reel ? 28 : 24, color: b.hero ? C.amber : WORLD.cad.ink, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmt(v, 1)}%</span>
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, marginLeft: reel ? 264 : 224, marginRight: reel ? 110 : 100, fontFamily: F.mono, fontSize: 15, color: WORLD.cad.mute }}>
            <span>{BENCHCAD.axisMin}</span><span>{BENCHCAD.axisMax / 2}</span><span>{BENCHCAD.axisMax}</span>
          </div>
          <SourceAttribution id="benchCad" at={bcAt + 10} style={{ marginTop: 14 }} size={reel ? 24 : 17} />
        </div>
      )}

      {/* parametric beats */}
      {paramOn > 0.01 && (
        <>
          <div style={{ position: 'absolute', left: L.safe.side, top: 900, fontFamily: F.mono, fontSize: L.t.label, color: WORLD.cad.ink, opacity: paramOn, letterSpacing: '0.08em' }}>MECHANICAL ASSEMBLY</div>
          <ParamCard title="ARCHITECTURAL MODEL" param="TWIST" value={twist} x={L.w - L.safe.side - 560} y={210} w={560} h={330} on={paramOn} cam={[3.4, 2.6, 3.4]} target={[0, 1.05, 0]}>
            <Tower twist={twist * Math.PI * 0.5} />
          </ParamCard>
          <ParamCard title="CONFIGURABLE PRODUCT" param="ARM · SHADE" value={1 - twist * 0.7} x={L.w - L.safe.side - 560} y={560} w={560} h={330} on={reveal(p, X.param[0] + 0.03, 0.03) * paramOn} cam={[1.9, 1.25, 2.3]} target={[0.15, 0.8, 0]}>
            <Lamp arm={1 - twist * 0.7} shade={twist} />
          </ParamCard>
          <SourceAttribution text={`${CLAIMS.parametric.display} · ${CLAIMS.scripting.display}`} style={{ position: 'absolute', right: L.safe.side, top: 906, opacity: paramOn }} />
        </>
      )}

      {/* exit */}
      <AbsoluteFill style={{ background: '#05070C', opacity: dark * 0.92 }} />
      {arcP > 0 && (
        <svg width={L.w} height={L.h} style={{ position: 'absolute', inset: 0 }}>
          <path d={`M ${acx} ${acy - R} A ${R} ${R} 0 ${270 * arcP > 180 ? 1 : 0} 1 ${ex} ${ey}`} fill="none" stroke={C.cyan} strokeWidth={3} />
          <circle cx={ex} cy={ey} r={6} fill={C.cyan} />
          <text x={ex - 34} y={ey - 14} fill={C.lunar} fontFamily="JetBrains Mono" fontSize={26} opacity={arcP}>θ</text>
        </svg>
      )}
      <ProvenanceLabel kind="B" note="Model built for this film · not a production-ready CAD part" at={10} />
    </AbsoluteFill>
  );
};
