// BRIDGE.EXE: the Structural Lab UI around the 3D viewport.
import { useEffect, useRef, useState } from 'react';
import { useFresh, useStore, type CamPreset, type Env } from '../store';
import { Scene } from '../world/Scene';
import { DesignPanel, Envelope, SolverPanel } from './Panels';
import { Row, Seg, Toggle, download } from './kit';
import { CHALLENGES } from '../challenges';
import { fmt } from '../engineering/units';
import type { SolveOk } from '../engineering/types';
import { DISCLAIMER, replayJSON } from '../engineering/reports';
import { PROXY_NOTE } from '../engineering/educationalChecks';
import { vclock } from '../world/clock';
import { exportGLB } from '../geometry/exportGeometry';
import { ReelOverlay } from '../reel/ReelMode';
import './styles.css';

function Fps() {
  const [fps, setFps] = useState(0);
  useEffect(() => { let n = 0, t0 = performance.now(), raf = 0; const f = () => { n++; const t = performance.now(); if (t - t0 > 1000) { setFps(Math.round((n * 1000) / (t - t0))); n = 0; t0 = t; } raf = requestAnimationFrame(f); }; raf = requestAnimationFrame(f); return () => cancelAnimationFrame(raf); }, []);
  return <span className="fps">{fps} FPS</span>;
}

function TopBar() {
  const s = useStore();
  return (
    <>
      <div className="title">
        <h1>BRIDGE<span>.EXE</span></h1>
        <p>{s.env === 'gorge' ? 'Cliffside truss · linear elastic 2D truss per plane' : s.env === 'city' ? 'City beam · Euler–Bernoulli beam FE' : 'Skyline cable-stayed · concept visual'}</p>
      </div>
      <div className="topright">
        <Seg value={s.env} options={[['gorge', 'GORGE TRUSS'], ['city', 'CITY BEAM'], ['skyline', 'SKYLINE']]} onChange={(v: Env) => { s.set({ env: v, mode: 'lab', compare: false, cam: 'hero', camNonce: s.camNonce + 1, lens: 'real' }); s.logIt('env', v); }} />
        <span className="chip">SI · kN · mm</span><Fps />
        <button className="btn" onClick={() => { const c = document.querySelector('canvas'); if (c) download(`bridge-exe_${Date.now()}.png`, dataURLtoBlob(c.toDataURL('image/png'))); }}>SCREENSHOT</button>
        <button className="btn" onClick={() => exportGLB()} disabled={s.env !== 'gorge'}>GLB</button>
        <button className="btn" onClick={() => download('bridge-exe_replay.json', replayJSON(s.log, s.design))}>REPLAY</button>
        <button className="btn" onClick={() => s.set({ info: true })}>INFO</button>
      </div>
    </>
  );
}
const dataURLtoBlob = (u: string) => { const [h, b] = u.split(','), bin = atob(b), a = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i); return new Blob([a], { type: h.slice(5, h.indexOf(';')) }); };

const CAMS: [CamPreset, string][] = [['hero', 'HERO'], ['under', 'UNDERSIDE'], ['macro', 'JOINT MACRO'], ['xray', 'ELEVATION'], ['vehicle', 'FOLLOW TRUCK'], ['gorge', 'GORGE'], ['sunset', 'SUNSET']];

function BottomBar() {
  const s = useStore(), fresh = useFresh();
  const canSnap = fresh && s.result?.status === 'solved';
  return (
    <div className="bottom">
      <div className="cams">{CAMS.filter(([c]) => s.env === 'gorge' || ['hero', 'under', 'xray', 'sunset'].includes(c)).map(([c, l]) => <button key={c} className={s.cam === c ? 'on' : ''} onClick={() => s.set({ cam: c, camNonce: s.camNonce + 1 })}>{l}</button>)}</div>
      {s.env === 'gorge' ? (
        <div className="ab">
          <button className={`btn ${s.snapA ? 'on' : ''}`} disabled={!canSnap} onClick={() => s.snapshot('A')}>SAVE A{s.snapA ? ` · ${s.snapA.result.runId}` : ''}</button>
          <button className={`btn ${s.snapB ? 'on' : ''}`} disabled={!canSnap} onClick={() => s.snapshot('B')}>SAVE B{s.snapB ? ` · ${s.snapB.result.runId}` : ''}</button>
          <button className={`btn ${s.compare ? 'on' : ''}`} disabled={!s.snapA || !s.snapB} onClick={() => s.set({ compare: !s.compare })}>A vs B</button>
          <button className={`btn arcade ${s.mode === 'arcade' ? 'on' : ''}`} onClick={() => s.set({ mode: s.mode === 'arcade' ? 'lab' : 'arcade', arcade: { armed: false, t0: 0, nonce: s.arcade.nonce }, compare: false })}>{s.mode === 'arcade' ? 'EXIT ARCADE' : 'ENTER ARCADE MODE'}</button>
          <button className="btn" onClick={() => s.set({ challenge: s.challenge ? null : 'menu' })}>CHALLENGES</button>
        </div>
      ) : <div className="ab"><button className="btn" onClick={() => s.set({ challenge: s.challenge ? null : 'menu' })}>CHALLENGES</button></div>}
      <div className="exp">
        <Toggle label="Night" on={s.night} onChange={(v) => s.set({ night: v })} />
        <Toggle label="Reduced motion" on={s.reducedMotion} onChange={(v) => s.set({ reducedMotion: v })} />
        <Seg value={s.quality} options={[['low', 'LOW'], ['medium', 'MED'], ['high', 'HIGH']]} onChange={(v) => s.set({ quality: v })} />
      </div>
      <div className="foot">{DISCLAIMER}</div>
    </div>
  );
}

function ArcadePanel() {
  const s = useStore();
  if (s.mode !== 'arcade') return null;
  return (
    <>
      <div className="arcade-banner">STYLIZED FAILURE — NOT AN ENGINEERING PREDICTION</div>
      <div className="arcade-panel">
        <p>Artistic break-apart for fun. It ignores the solver and has no capacity meaning.</p>
        <label className="sl"><span className="sl-l">Break zone (panel)</span><span className="sl-v">{s.breakPanel + 1}</span>
          <input type="range" min={1} max={s.design.params.panels - 2} value={s.breakPanel} onChange={(e) => s.set({ breakPanel: +e.target.value })} disabled={s.arcade.armed} /></label>
        <div className="btns">
          {!s.arcade.armed ? <button className="btn warn" onClick={() => { s.set({ arcade: { armed: true, t0: vclock.t + 0.3, nonce: s.arcade.nonce + 1 } }); s.logIt('arcade-trigger', { breakPanel: s.breakPanel }); }}>TRIGGER</button>
            : <button className="btn" onClick={() => { s.set({ arcade: { armed: false, t0: 0, nonce: s.arcade.nonce + 1 }, follow: false }); s.logIt('arcade-reset'); }}>RESET BRIDGE</button>}
          <Toggle label="Follow fragment" on={s.follow} onChange={(v) => s.set({ follow: v })} />
        </div>
        {s.arcadeInfo && s.arcade.armed ? <p className="note">{s.arcadeInfo.bodies} rigid bodies (Rapier, precomputed 7 s at 60 Hz) + {s.arcadeInfo.particles.toLocaleString()} dust/spark particles (visual only).</p> : null}
      </div>
    </>
  );
}

function CompareOverlay() {
  const s = useStore();
  if (!s.compare || !s.snapA || !s.snapB || s.env !== 'gorge') return null;
  const a = s.snapA.result as SolveOk, b = s.snapB.result as SolveOk;
  const d = (x: number, y: number) => `${y >= x ? '+' : ''}${(((y - x) / x) * 100).toFixed(1)}%`;
  const rows: [string, number, number, (v: number) => string][] = [
    ['Max deflection', a.metrics.maxAbsDisplacement_m, b.metrics.maxAbsDisplacement_m, (v) => fmt.mm(v)],
    ['Max axial', a.metrics.maxAbsAxial_N, b.metrics.maxAbsAxial_N, (v) => fmt.kN(v, 0)],
    ['Utilisation (proxy)', a.metrics.maxUtilization, b.metrics.maxUtilization, (v) => v.toFixed(2)],
    ['Steel / plane', a.metrics.mass_kg, b.metrics.mass_kg, (v) => fmt.t(v, 2)],
  ];
  return (
    <>
      <div className="cmp-tag a">A · {a.runId}</div><div className="cmp-tag b">B · {b.runId}</div>
      <div className="cmp-table">
        <div className="row head"><span /><b>A</b><b>B</b><b>Δ</b></div>
        {rows.map(([k, x, y, f]) => <div className="row" key={k}><span>{k}</span><b>{f(x)}</b><b>{f(y)}</b><b className={y > x ? 'up' : 'down'}>{d(x, y)}</b></div>)}
        <p className="note">Saved runs, same camera. Values are the solver outputs of each run.</p>
      </div>
    </>
  );
}

function ChallengePanel() {
  const s = useStore();
  const [, force] = useState(0);
  useEffect(() => { const i = setInterval(() => force((x) => x + 1), 400); return () => clearInterval(i); }, []);
  if (!s.challenge) return null;
  if (s.challenge === 'menu') return (
    <div className="modal ch"><h2>CHALLENGES</h2>
      {CHALLENGES.map((c) => <button key={c.id} className="ch-item" onClick={() => { c.setup(); s.set({ challenge: c.id, cam: 'hero', camNonce: s.camNonce + 1 }); s.logIt('challenge', c.id); }}>
        <b>{c.n}. {c.title}</b>{s.challengeDone[c.id] ? <i>✓ done</i> : null}<span>{c.brief}</span></button>)}
      <button className="btn" onClick={() => s.set({ challenge: null })}>CLOSE</button>
    </div>
  );
  const c = CHALLENGES.find((x) => x.id === s.challenge)!, res = c.check();
  if (res.pass && !s.challengeDone[c.id]) setTimeout(() => s.set({ challengeDone: { ...s.challengeDone, [c.id]: true } }));
  return (
    <div className={`ch-card ${res.pass ? 'pass' : ''}`}>
      <h3>{c.n}. {c.title}{res.pass ? ' — COMPLETE' : ''}</h3>
      <p>{c.brief}</p>
      {c.id === 'first-load' ? <div className="btns">{[['half', 'P/2 = 250 kN'], ['full', 'P = 500 kN'], ['quarter', 'P/4 = 125 kN']].map(([k, l]) => <button key={k} className={`btn ${s.quiz === k ? 'on' : ''}`} onClick={() => s.set({ quiz: k })}>{l}</button>)}</div> : null}
      {c.id === 'moving-load' ? <Envelope /> : null}
      <ul>{res.lines.map((l) => <li key={l}>{l}</li>)}</ul>
      {res.pass && c.id === 'impossible-span' ? <p className="warnline">Educational simulation; not a buildable bridge design.</p> : null}
      <div className="btns"><button className="btn" onClick={() => s.set({ challenge: 'menu' })}>ALL CHALLENGES</button><button className="btn" onClick={() => s.set({ challenge: null })}>CLOSE</button></div>
    </div>
  );
}

function InfoModal() {
  const s = useStore(), ok = s.result?.status === 'solved' ? (s.result as SolveOk) : null;
  if (!s.info) return null;
  return (
    <div className="modal info" onClick={(e) => e.target === e.currentTarget && s.set({ info: false })}>
      <div className="info-body">
        <h2>HOW THIS LAB WORKS</h2>
        <p><b>Pipeline.</b> Parameters → validated model (nodes, members, supports, loads, SI units) → direct-stiffness solve in TypeScript (dense Gaussian elimination, partial pivoting; a zero pivot = mechanism) → displacements, axial forces N = EA/L·Δ, reactions, residuals → the 3D view. Cross-checked against an independent numpy solver and PyNite 3.2.1 (differences ≤ 1e-14 relative on the fixture set).</p>
        <p><b>Assumptions.</b> Linear elastic, small displacements, static loads, pin-jointed bars (axial force only), ideal pin (B0) and roller (last joint) bearings. Each of the two truss planes is the analysed 2D truss and carries half the deck. Deck, floor beams, railings and top bracing are drawn but not analysed. No buckling analysis, plastic hinges, fracture, fatigue, dynamics, wind, cables, foundations or code checks.</p>
        <p><b>Utilisation.</b> {PROXY_NOTE}: tension N/(fy·A); compression |N|/min(fy·A, π²EI/L²) with an assumed thin circular hollow section (t = D/20).</p>
        <p><b>Loads.</b> Illustrative user scenarios, not IS/IRC/Eurocode load models. Deck UDL by tributary length; truck by the lever rule; a moving truck is a sequence of static solves.</p>
        <p><b>Arcade mode.</b> Stylized rigid-body break-apart (Rapier). It is a game effect, not a failure prediction.</p>
        <p className="warnline">{DISCLAIMER}</p>
        {ok && s.resultModel ? (
          <>
            <h3>RAW RESULTS · {ok.runId}</h3>
            <div className="tbl"><div className="tr th"><span>member</span><span>L (m)</span><span>N (kN)</span><span>σ (MPa)</span><span>util.</span></div>
              {ok.members.map((m) => <div className="tr" key={m.id}><span>{m.id}</span><span>{m.length_m.toFixed(3)}</span><span>{(m.axial_N / 1e3).toFixed(1)}</span><span>{(m.stress_Pa / 1e6).toFixed(1)}</span><span>{m.utilization.toFixed(3)}</span></div>)}</div>
            <div className="tbl"><div className="tr th"><span>node</span><span>ux (mm)</span><span>uy (mm)</span></div>
              {ok.nodes.map((n) => <div className="tr" key={n.id}><span>{n.id}</span><span>{(n.ux_m * 1e3).toFixed(3)}</span><span>{(n.uy_m * 1e3).toFixed(3)}</span></div>)}</div>
          </>
        ) : null}
        <button className="btn" onClick={() => s.set({ info: false })}>CLOSE</button>
      </div>
    </div>
  );
}

function Tutorial() {
  const s = useStore();
  if (!s.tutorial) return null;
  return (
    <div className="tutorial">
      <ol><li><b>DESIGN</b> drag a cyan joint or change the span</li><li><b>APPLY LOAD</b> set the truck and deck load</li><li><b>ANALYZE</b> press RUN, then pick a lens</li></ol>
      <button className="btn" onClick={() => s.set({ tutorial: false })}>GOT IT</button>
    </div>
  );
}

function LowerThird() {
  const s = useStore(), fresh = useFresh();
  if (s.env === 'skyline') return <div className="lt">CINEMATIC MODEL — ANALYSIS UNAVAILABLE</div>;
  if (s.lens === 'real' || s.mode === 'arcade') return null;
  if (s.env === 'gorge' && !fresh) return <div className="lt dirty">DIRTY — RERUN REQUIRED · lens shows no results</div>;
  return <div className="lt">Educational linear-elastic model • solver-derived output{s.lens === 'deform' ? ` • visual deflection magnified ×${s.mag}` : ''}</div>;
}

export function App() {
  const ui = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      const s = useStore.getState();
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); e.shiftKey ? s.redo() : s.undo(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') { e.preventDefault(); s.redo(); }
      if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'TEXTAREA') s.run();
      if (e.key === 'Escape') s.set({ selected: null, addMode: null, challenge: null, info: false });
    };
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  }, []);
  const reel = useStore((s) => s.reel);
  if (reel) return <div className="app"><Scene /><div className="ui"><ReelOverlay /></div></div>;
  return (
    <div className="app">
      <Scene />
      <div className="ui" ref={ui}>
        <TopBar />
        <DesignPanel />
        <SolverPanel />
        <BottomBar />
        <ArcadePanel />
        <CompareOverlay />
        <ChallengePanel />
        <LowerThird />
        <Tutorial />
        <InfoModal />
      </div>
    </div>
  );
}
export { Row };
