// ?reel=1: the portrait capture mode the reel is recorded from. The page is driven only by window.seek(t) (reel
// seconds). installReel solves design A and design B with the real solver (the same call RUN ANALYSIS makes) and
// precomputes the arcade rig, then every seek applies reelState(t) to the store and poses the camera. Every number
// on the overlay is read from those run objects; nothing is typed in by hand.
import { useStore, type Design, type Snapshot } from '../store';
import { makeModel } from '../engineering/model';
import { solveTruss } from '../engineering/truss';
import { hashOf } from '../engineering/hash';
import type { SolveOk, TrussModel } from '../engineering/types';
import { fmt } from '../engineering/units';
import { PROXY_NOTE } from '../engineering/educationalChecks';
import { vclock } from '../world/clock';
import { viz } from '../world/viz';
import { reelCam } from '../world/CameraDirector';
import { arcadeClock, reelArcade, simulateArcade, HZ, ARCADE_SECONDS } from '../world/ArcadeFailure';
import { DESIGN_A, DESIGN_B, FOLLOW_FROM, REEL, RUN_AT, T, cameraAt, reelState, sec, shots } from './timeline';
import CROSS from '../../../solver/crosscheck_report.json';
import './reel.css';

declare global { interface Window { seek?: (t: number) => Promise<void>; __ready?: boolean; __reelInfo?: () => unknown } }
const frame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));

const modelCache = new Map<Design, { model: TrussModel; modelHash: string }>();
const derive = (d: Design) => { let m = modelCache.get(d); if (!m) { const model = makeModel(d.params, d.material, d.loads); m = { model, modelHash: hashOf(model) }; if (modelCache.size > 400) modelCache.clear(); modelCache.set(d, m); } return m; };

export const RUNS: { A: SolveOk | null; B: SolveOk | null; snapA: Snapshot | null; snapB: Snapshot | null } = { A: null, B: null, snapA: null, snapB: null };

export function installReel() {
  const mA = derive(DESIGN_A), mB = derive(DESIGN_B);
  const A = solveTruss(mA.model, 1), B = solveTruss(mB.model, 2);
  if (A.status !== 'solved' || B.status !== 'solved') throw new Error('reel designs must solve');
  RUNS.A = A; RUNS.B = B;
  RUNS.snapA = { label: 'A', design: DESIGN_A, result: A, model: mA.model };
  RUNS.snapB = { label: 'B', design: DESIGN_B, result: B, model: mB.model };
  reelArcade.breakPanel = REEL.breakPanel;
  useStore.setState({ reel: true, tutorial: false, quality: 'high', mag: REEL.mag, showGhost: true, snapA: RUNS.snapA, snapB: RUNS.snapB, seq: 2 });
  document.body.classList.add('reel');
  const shotList = shots();
  const apply = (t: number) => {
    const st = reelState(t), d = derive(st.design);
    vclock.t = t; viz.k = st.k; viz.pulse = st.pulse; arcadeClock.t = st.arcadeT;
    useStore.setState({
      reelT: t, design: st.design, model: d.model, modelHash: d.modelHash,
      result: st.run === 'A' ? A : st.run === 'B' ? B : null, resultModel: st.run === 'B' ? mB.model : st.run ? mA.model : null,
      lens: st.lens, mode: st.mode, compare: st.compare, showLabels: st.labels, showReactions: st.reactions, handles: st.handles,
      dragging: st.dragging, tags: st.tags, showLoads: st.loads, showIds: st.showIds, night: st.night, selected: null, hovered: null,
      arcade: { armed: st.mode === 'arcade', t0: 0, nonce: 1 },
    });
    reelCam.pose = t >= FOLLOW_FROM() && t < sec('arcade').t1 ? followPose(t) : cameraAt(t, shotList);
  };
  (window as any).seekState = async (t: number) => apply(t);
  /** cover plates: design A, run A, one hero camera; 'cad' = cyan x-ray wireframe, 'force' = load-path lens (deformed ×40) */
  (window as any).coverShot = async (kind: 'cad' | 'force') => {
    apply(sec('lenses').t0 + 3.5);
    viz.xray = kind === 'cad' ? 1 : 0; viz.k = kind === 'force' ? 1 : 0;
    useStore.setState({ lens: kind === 'cad' ? 'real' : 'path', showLabels: false, showReactions: kind === 'force', tags: [], showLoads: false, reelT: -1 });
    reelCam.pose = { pos: [-9, -5, 25], look: [1, 7.5, 0], fov: 62 };
    await frame(); await frame(); await frame();
  };
  window.seek = async (t: number) => { apply(t); await frame(); await frame(); };
  window.__reelInfo = () => ({ A: { runId: A.runId, metrics: A.metrics }, B: { runId: B.runId, metrics: B.metrics }, arcade: reelArcade.sim ? { bodies: reelArcade.sim.bodies, t0: sec('arcade').t0 + 1.0, bursts: reelArcade.sim.bursts.map((b) => ({ t: +b.t.toFixed(3), kind: b.kind, y: +b.p[1].toFixed(1) })) } : null });
  simulateArcade(mA.model, REEL.breakPanel).then((sim) => { reelArcade.sim = sim; window.__ready = true; });
}

/** the arcade camera rides with the break-panel deck piece (positions from the precomputed Rapier run) */
function followPose(t: number) {
  const sim = reelArcade.sim, at = t - (sec('arcade').t0 + 1.0);
  if (!sim) return cameraAt(t);
  const nb = sim.pieces.filter((p) => p.kind === 'bar').length, i = nb + REEL.breakPanel, n = sim.pieces.length;
  const f = Math.min(ARCADE_SECONDS * HZ - 1, Math.max(0, Math.floor(at * HZ)));
  const smooth = (k: number) => { let x = 0, y = 0, z = 0, c = 0; for (let j = Math.max(0, k - 12); j <= k; j++) { const o = (j * n + i) * 7; x += sim.frames[o]; y += sim.frames[o + 1]; z += sim.frames[o + 2]; c++; } return [x / c, y / c, z / c]; };
  const [x, y, z] = smooth(f);
  const u = Math.min(1, Math.max(0, (t - FOLLOW_FROM()) / 1.2)), e = 1 - (1 - u) ** 3;
  const start = cameraAt(FOLLOW_FROM() - 0.001);
  const pos: [number, number, number] = [x - 16, Math.max(y + 7, -56), z + 20];
  const L = (a: number[], b: number[]) => a.map((v, k) => v + (b[k] - v) * e) as [number, number, number];
  return { pos: L(start.pos, pos), look: L(start.look, [x, y - 2, z]), fov: 52 };
}

const Cursor = ({ x, y, press }: { x: number; y: number; press: boolean }) => (
  <svg className="reel-cursor" style={{ left: x, top: y, transform: `scale(${press ? 0.86 : 1})` }} width="58" height="70" viewBox="0 0 29 35">
    <path d="M2 2 L2 27 L8.5 21 L13 32 L17.5 30 L13 19.5 L22 19.5 Z" fill="#fff" stroke="#071522" strokeWidth="2" strokeLinejoin="round" />
  </svg>
);
const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const inOut = (t: number, a: number, b: number, f = 0.25) => clamp((t - a) / f) * clamp((b - t) / f);

export function ReelOverlay() {
  const t = useStore((s) => s.reelT), A = RUNS.A, B = RUNS.B;
  const st = useStore.getState();
  if (!A || !B) return null;
  const S = (id: string) => sec(id), g = S('geometry'), ld = S('load'), ln = S('lenses'), cp = S('compare'), ev = S('evidence');
  const span = st.design.params.span;
  const runAt = RUN_AT();
  // cursor: span slider (geometry), T4 joint drag (projected), RUN button (load)
  let cur: { x: number; y: number; press: boolean } | null = null;
  if (t >= g.t0 + 0.3 && t < g.t0 + 2.8) { const span = st.design.params.span; cur = { x: 60 + 32 + ((span - 32) / 40) * 896 + 4, y: 356, press: t > g.t0 + 0.75 && t < g.t0 + 2.6 }; }
  if (t >= g.t0 + 2.6 && t < g.t0 + 6.3 && reelProbe.T4) cur = { x: reelProbe.T4[0] - 6, y: reelProbe.T4[1] - 4, press: t >= g.t0 + 3.0 && t < g.t0 + 5.8 };
  if (t >= runAt - 1.3 && t < runAt + 0.9) { const u = clamp((t - (runAt - 1.3)) / 1.0); cur = { x: 760 - u * 230, y: 1225 - u * 85, press: t >= runAt && t < runAt + 0.1 }; }
  const dirty = st.result == null;
  const lowerThird = st.lens !== 'real' && st.mode === 'lab' && t >= ln.t0 - 0.05 && t < ev.t1 && !(t >= S('cad').t0 && t < S('arcade').t0)
    ? `Educational linear-elastic model · solver output${st.lens === 'deform' ? ` · deflection ×${REEL.mag}` : ''}` : null;
  const hookNote = t >= 0 && t < S('hook').t1 ? `Solver run ${A.runId} · deflection shown ×${REEL.mag}` : null;
  const dm = (x: number, y: number) => `${y >= x ? '+' : '−'}${Math.abs(((y - x) / x) * 100).toFixed(0)}%`;
  return (
    <div className="reel-ov">
      {/* geometry: the span slider + node readout */}
      {t >= g.t0 + 0.2 && t < g.t0 + 2.9 ? (
        <div className="rcard slider" style={{ opacity: inOut(t, g.t0 + 0.2, g.t0 + 2.9) }}>
          <span>Clear span</span><b>{fmt.m(span, 0)}</b>
          <i className="track"><i className="fill" style={{ width: `${((span - 32) / 40) * 100}%` }} /><i className="knob" style={{ left: `${((span - 32) / 40) * 100}%` }} /></i>
        </div>
      ) : null}
      {t >= g.t0 + 2.9 && t < g.t1 ? (
        <div className="rcard node" style={{ opacity: inOut(t, g.t0 + 2.9, g.t1) }}>
          <span>Joint T4 · snap 0.25 m</span><b>y {fmt.m(st.model.nodes.find((n) => n.id === 'T4')!.y)}</b>
          <em>{st.model.members.length} members · {st.model.nodes.length} joints regenerated</em>
        </div>
      ) : null}
      {/* load: the load card, then the solver card with RUN */}
      {t >= ld.t0 + 0.6 && t < ld.t1 ? (
        <div className="rcard load" style={{ opacity: inOut(t, ld.t0 + 0.6, ld.t1) }}>
          <span>Truck</span><b>2 × {fmt.kN(REEL.truckP, 0)}</b>
          <span>Deck load</span><b>{(DESIGN_A.loads.deckUDL / 1e3).toFixed(0)} kN/m</b>
          <span>Self-weight</span><b>on</b>
          <em>illustrative loads · per truss plane</em>
        </div>
      ) : null}
      {t >= g.t1 - 1.2 && t < ld.t1 ? (
        <div className="rcard solver" style={{ opacity: inOut(t, g.t1 - 1.2, ld.t1) }}>
          <div className={`pill ${dirty ? (t < runAt ? 'idle' : 'idle') : 'ok'}`}>{dirty ? 'MODEL VALID · NOT ANALYSED' : 'SOLVED · RESULTS CURRENT'}</div>
          <div className={`runbtn ${t >= runAt && t < runAt + 0.12 ? 'down' : ''}`}>RUN ANALYSIS</div>
          {!dirty ? (
            <div className="res">
              <div><span>run</span><b>{A.runId}</b></div>
              <div><span>max deflection</span><b>{fmt.mm(A.metrics.maxAbsDisplacement_m)} · L/{Math.round(span / A.metrics.maxAbsDisplacement_m)}</b></div>
              <div><span>max axial</span><b>{fmt.kN(A.metrics.maxAbsAxial_N, 0)} · {A.metrics.maxAxialMember}</b></div>
              <div><span>reactions</span><b>{A.reactions.map((r) => fmt.kN(r.ry_N, 0)).join(' + ')}</b></div>
              <div><span>ΣFy residual</span><b>{A.diagnostics.equilibriumY_N.toExponential(0)} N</b></div>
            </div>
          ) : null}
        </div>
      ) : null}
      {/* lenses: legend */}
      {t >= ln.t0 && t < ln.t1 ? (
        <div className="legend">
          {st.lens === 'deform' ? <><i className="g1" /><span>displacement · ghost = undeformed · ×{REEL.mag}</span></> : null}
          {st.lens === 'axial' || st.lens === 'path' ? <><i className="comp" /><span>compression</span><i className="ten" /><span>tension</span>{st.lens === 'path' ? <span>· thickness ∝ |N|</span> : null}</> : null}
        </div>
      ) : null}
      {/* compare */}
      {t >= cp.t0 && t < cp.t1 ? (
        <>
          <div className="cmp-label a">A · h 6 m · {A.runId}</div>
          <div className="cmp-label b">B · h 8 m · {B.runId}</div>
          <div className="rcard delta" style={{ opacity: inOut(t, cp.t0 + 1.9, cp.t1) }}>
            <div className="hd"><span /><b>A</b><b>B</b><b>Δ</b></div>
            <div><span>max deflection</span><b>{fmt.mm(A.metrics.maxAbsDisplacement_m, 0)}</b><b>{fmt.mm(B.metrics.maxAbsDisplacement_m, 0)}</b><b className="good">{dm(A.metrics.maxAbsDisplacement_m, B.metrics.maxAbsDisplacement_m)}</b></div>
            <div><span>steel / plane</span><b>{fmt.t(A.metrics.mass_kg, 1)}</b><b>{fmt.t(B.metrics.mass_kg, 1)}</b><b className="bad">{dm(A.metrics.mass_kg, B.metrics.mass_kg)}</b></div>
            {t >= cp.t0 + 4.6 ? <div><span>utilisation proxy</span><b>{A.metrics.maxUtilization.toFixed(2)}</b><b>{B.metrics.maxUtilization.toFixed(2)} {B.metrics.maxUtilizationMember}</b><b className={B.metrics.maxUtilization > 1 ? 'bad' : ''}>{B.metrics.maxUtilization > 1 ? 'check' : ''}</b></div> : null}
          </div>
        </>
      ) : null}
      {/* arcade */}
      {st.mode === 'arcade' ? <div className="arcade-tag">STYLIZED FAILURE — NOT AN ENGINEERING PREDICTION<small>game effect · {reelArcade.sim?.bodies ?? 0} Rapier rigid bodies + dust particles</small></div> : null}
      {/* evidence */}
      {t >= ev.t0 && t < ev.t1 ? (
        <div className="rcard evidence" style={{ opacity: inOut(t, ev.t0 + 0.2, ev.t1) }}>
          <div className="hd">EDUCATIONAL SIMULATION</div>
          <div><span>run</span><b>{A.runId}</b></div>
          <div><span>input hash</span><b>{A.inputsHash}</b></div>
          <div><span>model</span><b>linear-elastic 2D truss · {A.diagnostics.dof} DOF</b></div>
          <div><span>equilibrium</span><b>ΣFx {A.diagnostics.equilibriumX_N.toExponential(0)} · ΣFy {A.diagnostics.equilibriumY_N.toExponential(0)} N</b></div>
          <div><span>cross-check</span><b>numpy + PyNite {CROSS.pynite}: ≤ {CROSS.worst.toExponential(0)}</b></div>
          <em>{PROXY_NOTE} · not a licensed engineer's design</em>
        </div>
      ) : null}
      {lowerThird ? <div className="reel-lt">{lowerThird}</div> : null}
      {hookNote ? <div className="reel-lt hook">{hookNote}</div> : null}
      {cur ? <Cursor {...cur} /> : null}
    </div>
  );
}

/** screen positions of a few world points, written by ReelProbe inside the canvas each frame */
export const reelProbe: { T4?: [number, number] } = {};
export { T };
