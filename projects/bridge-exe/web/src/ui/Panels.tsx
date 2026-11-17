// The Structural Lab panels. Left: design. Right: loads, solver, results, lenses. Every control edits the design
// (-> DIRTY) or the view; only RUN ANALYSIS produces numbers.
import { useMemo, useState } from 'react';
import { useFresh, useStore, type Lens } from '../store';
import { Row, Section, Seg, Slider, Toggle, download } from './kit';
import { MATERIALS } from '../engineering/materials';
import { fmt, GPa, toGPa, toMM2, mm2, kN, toKN } from '../engineering/units';
import { validateTruss } from '../engineering/validation';
import type { SolveOk } from '../engineering/types';
import type { Topology } from '../geometry/trussPresets';
import { deckNodes } from '../engineering/loadDistribution';
import { solveTruss } from '../engineering/truss';
import { makeModel } from '../engineering/model';
import { PROXY_NOTE } from '../engineering/educationalChecks';
import { modelJSON, reportCSV } from '../engineering/reports';
import { viz } from '../world/viz';

/** rule-based requirements form: text -> parameters. No AI call happens in the app; the parse is shown back. */
export function parseBrief(text: string) {
  const t = text.toLowerCase(), num = (re: RegExp) => { const m = t.match(re); return m ? parseFloat(m[1]) : undefined; };
  const span = num(/(\d+(?:\.\d+)?)\s*m(?:etre|eter)?s?\s*(?:long|span|wide|gap|gorge)/) ?? num(/span\D{0,8}(\d+(?:\.\d+)?)/);
  const height = num(/(\d+(?:\.\d+)?)\s*m\s*(?:tall|high|deep|height)/) ?? num(/height\D{0,8}(\d+(?:\.\d+)?)/);
  const panels = num(/(\d+)\s*panels?/);
  const truck = num(/(\d+(?:\.\d+)?)\s*kn\s*(?:truck|vehicle|lorry)/) ?? num(/(?:truck|vehicle|lorry)\D{0,8}(\d+(?:\.\d+)?)\s*kn/);
  const topology: Topology | undefined = /warren/.test(t) ? 'warren' : /howe/.test(t) ? 'howe' : /pratt/.test(t) ? 'pratt' : undefined;
  const material = /alumin/.test(t) ? MATERIALS[1] : /steel/.test(t) ? MATERIALS[0] : undefined;
  const S = Math.min(72, Math.max(32, Math.round((span ?? 48) / 2) * 2));
  return {
    span: S, height: Math.min(12, Math.max(3, height ?? Math.round((S / 8) * 4) / 4)),
    panels: Math.min(12, Math.max(4, panels ? Math.round(panels / 2) * 2 : Math.round(S / 6 / 2) * 2)),
    topology: topology ?? 'pratt', material, truck: truck ? kN(truck) / 2 : undefined,
    found: { span, height, panels, topology, material: material?.name, truck },
  };
}

export function DesignPanel() {
  const s = useStore(), p = s.design.params, mat = s.design.material;
  const [brief, setBrief] = useState('A 56 m steel Warren truss over the gorge, 600 kN truck');
  const [parsed, setParsed] = useState<string | null>(null);
  const edit = (fn: (d: typeof s.design) => typeof s.design, kind: string, data?: unknown) => s.edit(fn, kind, data);
  const setP = (patch: Partial<typeof p>, kind = 'param') => edit((d) => ({ ...d, params: { ...d.params, ...patch } }), kind, patch);
  const setArea = (g: keyof typeof p.areas, v: number) => setP({ areas: { ...p.areas, [g]: mm2(v) } }, 'area');
  if (s.env !== 'gorge') return <BeamDesign />;
  return (
    <aside className="rail left">
      <Section title="DESCRIBE → GENERATE">
        <textarea value={brief} onChange={(e) => setBrief(e.target.value)} rows={2} spellCheck={false} />
        <button className="btn" onClick={() => {
          const g = parseBrief(brief);
          edit((d) => ({ ...d, material: g.material ?? d.material, params: { ...d.params, span: g.span, height: g.height, panels: g.panels, topology: g.topology, offsets: {}, removed: [], added: [] },
            loads: g.truck ? { ...d.loads, vehicle: { ...d.loads.vehicle, on: true, P: g.truck, x: g.span / 2 } } : { ...d.loads, vehicle: { ...d.loads.vehicle, x: Math.min(d.loads.vehicle.x, g.span) } } }), 'generate', { brief, ...g.found });
          setParsed(`Read: ${Object.entries(g.found).filter(([, v]) => v != null).map(([k, v]) => `${k} ${v}`).join(' · ') || 'nothing, defaults used'}. Generated ${g.topology} · ${g.span} m · h ${g.height} m · ${g.panels} panels.`);
        }}>GENERATE MODEL</button>
        {parsed ? <p className="note">{parsed} Rule-based parser; no AI call runs inside the app.</p> : null}
      </Section>
      <Section title="TOPOLOGY">
        <Seg value={p.topology} options={[['pratt', 'PRATT'], ['howe', 'HOWE'], ['warren', 'WARREN']]} onChange={(v) => setP({ topology: v, offsets: {}, removed: [], added: [] }, 'topology')} />
      </Section>
      <Section title="GEOMETRY">
        <Slider label="Clear span" value={p.span} min={32} max={72} step={2} show={fmt.m(p.span, 0)} onChange={(v) => edit((d) => ({ ...d, params: { ...d.params, span: v }, loads: { ...d.loads, vehicle: { ...d.loads.vehicle, x: Math.min(d.loads.vehicle.x, v) } } }), 'span', v)} />
        <Slider label="Truss height" value={p.height} min={3} max={12} step={0.25} show={fmt.m(p.height)} onChange={(v) => setP({ height: v })} />
        <Slider label="Panels" value={p.panels} min={4} max={12} step={2} show={String(p.panels)} onChange={(v) => setP({ panels: v, offsets: {}, removed: [], added: [] })} />
        <p className="note">Drag the cyan top-chord joints in the viewport (snap 0.25 m). {Object.keys(p.offsets).length ? <a onClick={() => setP({ offsets: {} }, 'reset-drags')}>Reset {Object.keys(p.offsets).length} drag(s)</a> : null}</p>
      </Section>
      <Section title="SECTIONS · AREA PER GROUP">
        {(['top', 'bottom', 'diagonal', 'vertical'] as const).filter((g) => !(g === 'vertical' && p.topology === 'warren')).map((g) => (
          <Slider key={g} label={`${g} chord`.replace('diagonal chord', 'diagonals').replace('vertical chord', 'verticals')} value={Math.round(toMM2(p.areas[g]))} min={1000} max={30000} step={250} show={fmt.mm2(p.areas[g])} onChange={(v) => setArea(g, v)} />
        ))}
      </Section>
      <Section title="MATERIAL">
        <select value={mat.id.startsWith('custom') ? 'custom' : mat.id} onChange={(e) => edit((d) => ({ ...d, material: MATERIALS.find((m) => m.id === e.target.value) ?? d.material }), 'material', e.target.value)}>
          {MATERIALS.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          {mat.id.startsWith('custom') ? <option value="custom">{mat.name}</option> : null}
        </select>
        <Slider label="E (override)" value={toGPa(mat.E)} min={10} max={250} step={1} show={fmt.GPa(mat.E)} onChange={(v) => edit((d) => ({ ...d, material: { ...d.material, id: 'custom-' + d.material.id.replace(/^custom-/, ''), name: `${d.material.name.replace(/ \(edited\)$/, '')} (edited)`, E: GPa(v), source: 'user override' } }), 'E', v)} />
        <Slider label="Density" value={mat.rho} min={1000} max={9000} step={50} show={`${mat.rho} kg/m³`} onChange={(v) => edit((d) => ({ ...d, material: { ...d.material, id: 'custom-' + d.material.id.replace(/^custom-/, ''), name: `${d.material.name.replace(/ \(edited\)$/, '')} (edited)`, rho: v, source: 'user override' } }), 'rho', v)} />
        <p className="note src">{mat.source}</p>
      </Section>
      <Section title="MEMBERS">
        <div className="btns">
          <button className={`btn ${s.addMode ? 'on' : ''}`} onClick={() => s.set({ addMode: s.addMode ? null : [], lens: 'real' })}>{s.addMode ? (s.addMode.length ? `PICK 2nd JOINT (${s.addMode[0]})` : 'PICK 1st JOINT') : '+ ADD MEMBER'}</button>
          <button className="btn" disabled={!s.selected} onClick={() => { const id = s.selected!; edit((d) => ({ ...d, params: { ...d.params, removed: id.startsWith('X') ? d.params.removed : [...d.params.removed, id], added: d.params.added.filter((a) => a.id !== id) } }), 'remove-member', id); s.set({ selected: null }); }}>REMOVE {s.selected ?? 'SELECTED'}</button>
        </div>
        {p.removed.length || p.added.length ? <p className="note">Removed {p.removed.join(', ') || '—'} · added {p.added.map((a) => `${a.id} ${a.a}–${a.b}`).join(', ') || '—'} <a onClick={() => setP({ removed: [], added: [] }, 'restore-members')}>restore</a></p> : null}
      </Section>
      <div className="btns hist">
        <button className="btn" disabled={!s.history.length} onClick={s.undo}>↶ UNDO</button>
        <button className="btn" disabled={!s.future.length} onClick={s.redo}>↷ REDO</button>
        <button className="btn" onClick={s.reset}>RESET</button>
      </div>
    </aside>
  );
}

function BeamDesign() {
  const s = useStore(), b = s.beam;
  if (s.env === 'skyline') return (
    <aside className="rail left"><Section title="SKYLINE CABLE-STAYED">
      <p className="badge-unavail">CINEMATIC MODEL — ANALYSIS UNAVAILABLE</p>
      <p className="note">Cables are tension-only and the deck/pylon system needs a nonlinear cable model that this lab does not implement. So this bridge is a concept visual: no stress colours, no numbers.</p>
    </Section></aside>
  );
  const P = b.points[0];
  return (
    <aside className="rail left">
      <Section title="CITY BEAM · SIMPLY SUPPORTED">
        <Slider label="Span" value={b.L} min={12} max={40} step={1} show={fmt.m(b.L, 0)} onChange={(v) => s.editBeam({ L: v, points: P ? [{ ...P, x: Math.min(P.x, v) }] : [] })} />
        <Slider label="E" value={toGPa(b.E)} min={10} max={250} step={1} show={fmt.GPa(b.E)} onChange={(v) => s.editBeam({ E: GPa(v) })} />
        <Slider label="I (second moment)" value={b.I} min={0.005} max={0.12} step={0.001} show={`${b.I.toFixed(3)} m⁴`} onChange={(v) => s.editBeam({ I: v })} />
        <Slider label="Uniform load w" value={-toKN(b.q)} min={0} max={120} step={1} show={`${(-toKN(b.q)).toFixed(0)} kN/m`} onChange={(v) => s.editBeam({ q: -kN(v) })} />
        <Slider label="Truck load P" value={P ? -toKN(P.fy) : 0} min={0} max={1500} step={10} show={`${P ? (-toKN(P.fy)).toFixed(0) : 0} kN`} onChange={(v) => s.editBeam({ points: v > 0 ? [{ x: P?.x ?? b.L / 2, fy: -kN(v) }] : [] })} />
        <Slider label="Truck position" value={P?.x ?? b.L / 2} min={0} max={b.L} step={0.5} show={fmt.m(P?.x ?? b.L / 2, 1)} onChange={(v) => s.editBeam({ points: P ? [{ ...P, x: v }] : [] })} disabled={!P} />
        <p className="note">Euler–Bernoulli beam FE (cubic Hermite elements). Linear elastic, small deflection, no shear deformation (fine for slender spans).</p>
      </Section>
    </aside>
  );
}

export function LoadPanel() {
  const s = useStore(), lc = s.design.loads, span = s.design.params.span;
  const setL = (patch: Partial<typeof lc>, kind = 'load') => s.edit((d) => ({ ...d, loads: { ...d.loads, ...patch } }), kind, patch);
  const [ptNode, setPtNode] = useState('T4'), [ptKN, setPtKN] = useState(100);
  if (s.env !== 'gorge') return null;
  const sweep = s.sweep;
  return (
    <Section title="LOAD TEST LAB · PER TRUSS PLANE">
      <Slider label="Deck load (tributary)" value={toKN(lc.deckUDL)} min={0} max={60} step={1} show={`${toKN(lc.deckUDL).toFixed(0)} kN/m`} onChange={(v) => setL({ deckUDL: kN(v) })} />
      <div className="tgs"><Toggle label="Self-weight" on={lc.selfWeight} onChange={(v) => setL({ selfWeight: v })} /><Toggle label="Truck" on={lc.vehicle.on} onChange={(v) => setL({ vehicle: { ...lc.vehicle, on: v } })} /></div>
      <Slider label="Truck load P" value={toKN(lc.vehicle.P)} min={0} max={800} step={10} show={`${toKN(lc.vehicle.P).toFixed(0)} kN`} onChange={(v) => setL({ vehicle: { ...lc.vehicle, P: kN(v) } })} disabled={!lc.vehicle.on} />
      <Slider label="Truck position" value={lc.vehicle.x} min={0} max={span} step={0.5} show={fmt.m(lc.vehicle.x, 1)} onChange={(v) => setL({ vehicle: { ...lc.vehicle, x: v } }, 'vehicle-x')} disabled={!lc.vehicle.on} />
      <Slider label="Load scale" value={lc.scale} min={0.25} max={3} step={0.05} show={`×${lc.scale.toFixed(2)}`} onChange={(v) => setL({ scale: v })} />
      <div className="pt">
        <select value={ptNode} onChange={(e) => setPtNode(e.target.value)}>{s.model.nodes.map((n) => <option key={n.id}>{n.id}</option>)}</select>
        <input type="number" value={ptKN} onChange={(e) => setPtKN(+e.target.value)} /><span>kN ↓</span>
        <button className="btn" onClick={() => setL({ points: [...lc.points, { node: ptNode, fx: 0, fy: -kN(ptKN) }] }, 'point-load')}>ADD</button>
      </div>
      {lc.points.length ? <p className="note">{lc.points.map((q) => `${q.node} ${fmt.kN(-q.fy, 0)}`).join(' · ')} <a onClick={() => setL({ points: [] })}>clear</a></p> : null}
      <p className="note">Illustrative loads, not a design code. Each truss plane carries half the deck; the truck shown is 2 × P. Deck load → deck joints by tributary length; truck → adjacent joints by the lever rule.</p>
      <div className="btns">
        {!sweep || sweep.done ? <button className="btn" disabled={!lc.vehicle.on} onClick={() => runSweep()}>MOVING-LOAD SWEEP</button> : <button className="btn warn" onClick={() => s.set({ sweepCancel: true })}>CANCEL SWEEP</button>}
      </div>
      {sweep ? <Envelope /> : null}
    </Section>
  );
}

export async function runSweep() {
  const st = useStore.getState, d = st().design, span = d.params.span, w = span / d.params.panels;
  const positions = Array.from({ length: d.params.panels * 4 + 1 }, (_, i) => (i * w) / 4);
  const mid = `BC${d.params.panels / 2 + 1}`;
  const sw = { positions: [] as number[], maxDisp: [] as number[], midChord: [] as number[], runIds: [] as string[], worstX: 0, done: false };
  st().set({ sweep: { ...sw }, sweepCancel: false });
  for (let i = 0; i < positions.length; i++) {
    if (st().sweepCancel) { st().set({ sweep: null, sweepCancel: false }); st().logIt('sweep-cancelled'); return; }
    const r = solveTruss(makeModel(d.params, d.material, { ...d.loads, vehicle: { ...d.loads.vehicle, on: true, x: positions[i] } }), i + 1);
    if (r.status !== 'solved') { st().set({ sweep: null }); st().logIt('sweep-failed', { reason: r.reasons[0] }); return; }
    sw.positions.push(positions[i]); sw.maxDisp.push(r.metrics.maxAbsDisplacement_m); sw.midChord.push(r.members.find((m) => m.id === mid)?.axial_N ?? 0); sw.runIds.push(r.runId);
    st().set({ sweep: { ...sw } });
    if (i % 4 === 3) await new Promise((res) => setTimeout(res, 16));
  }
  const k = sw.maxDisp.indexOf(Math.max(...sw.maxDisp));
  st().set({ sweep: { ...sw, worstX: sw.positions[k], done: true } });
  st().logIt('sweep', { solves: sw.positions.length, worstX: sw.positions[k] });
}

export function Envelope({ big = false }: { big?: boolean }) {
  const sw = useStore((s) => s.sweep), span = useStore((s) => s.design.params.span), vx = useStore((s) => s.design.loads.vehicle.x);
  if (!sw || !sw.positions.length) return null;
  const W = big ? 900 : 280, H = big ? 260 : 90, max = Math.max(...sw.maxDisp) * 1.08;
  const pts = sw.positions.map((x, i) => `${(x / span) * W},${H - (sw.maxDisp[i] / max) * H}`).join(' ');
  return (
    <div className={`env ${big ? 'big' : ''}`}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        <polyline points={pts} fill="none" stroke="#63E5FA" strokeWidth={big ? 4 : 2} />
        {sw.done ? <line x1={(sw.worstX / span) * W} x2={(sw.worstX / span) * W} y1={0} y2={H} stroke="#F5A64D" strokeDasharray="4 4" strokeWidth={big ? 3 : 1.5} /> : null}
        <line x1={(vx / span) * W} x2={(vx / span) * W} y1={0} y2={H} stroke="#E8F3F7" strokeOpacity={0.35} strokeWidth={big ? 2 : 1} />
      </svg>
      <span>max deflection envelope · {sw.positions.length} static solves{sw.done ? ` · worst at x = ${fmt.m(sw.worstX, 1)} (${fmt.mm(Math.max(...sw.maxDisp))})` : ' …'}</span>
    </div>
  );
}

const LENSES: [Lens, string, string][] = [['real', 'REAL', 'Rendered steel'], ['deform', 'DEFORMATION', 'Solver displacement × magnification'], ['axial', 'AXIAL FORCE', 'Red compression · cyan tension'], ['util', 'UTILISATION', PROXY_NOTE], ['path', 'LOAD PATH', 'Thickness ∝ |N| · reactions']];
const BEAM_LENS: Record<Lens, string> = { real: 'REAL', deform: 'DEFORMATION', axial: 'MOMENT', util: 'SHEAR', path: 'REACTIONS' };

export function SolverPanel() {
  const s = useStore(), fresh = useFresh();
  const v = useMemo(() => validateTruss(s.model), [s.model]);
  if (s.env === 'skyline') return <aside className="rail right"><Section title="SOLVER"><p className="badge-unavail">ANALYSIS UNAVAILABLE</p></Section></aside>;
  if (s.env === 'city') return <BeamSolver />;
  const r = s.result, ok = r && r.status === 'solved' ? (r as SolveOk) : null;
  const status = !r ? (v.status === 'ok' ? ['MODEL VALID · NOT ANALYSED', 'idle'] : v.status === 'unstable' ? ['MODEL UNSTABLE', 'bad'] : ['UNSUPPORTED CONFIGURATION', 'bad'])
    : !fresh ? ['DIRTY — RERUN REQUIRED', 'dirty'] : r.status === 'solved' ? ['SOLVED · RESULTS CURRENT', 'ok'] : r.status === 'unstable' ? ['MODEL UNSTABLE', 'bad'] : ['UNSUPPORTED CONFIGURATION', 'bad'];
  const reasons = !r || !fresh ? (v.status !== 'ok' ? v.reasons : []) : r.status !== 'solved' ? r.reasons : [];
  const L = s.design.params.span;
  return (
    <aside className="rail right">
      <Section title="SOLVER">
        <div className={`status ${status[1]}`}>{status[0]}</div>
        <button className="run" onClick={() => { s.run(); viz.pulse = 0; s.logIt('run-click'); }}>RUN ANALYSIS</button>
        {reasons.length ? <ul className="reasons">{reasons.map((x) => <li key={x}>{x}</li>)}</ul> : null}
        {r ? (
          <div className={`prov ${fresh ? '' : 'stale'}`}>
            <Row k="run" v={r.runId} /><Row k="input hash" v={r.inputsHash} />
            <Row k="solver" v={`${r.solver.name.replace('bridge-exe ', '')} v${r.solver.version}`} />
            {ok ? <><Row k="DOF · solve" v={`${ok.diagnostics.dof} · ${s.solveMs.toFixed(2)} ms`} /><Row k="ΣFx · ΣFy" v={`${ok.diagnostics.equilibriumX_N.toExponential(1)} · ${ok.diagnostics.equilibriumY_N.toExponential(1)} N`} /></> : null}
          </div>
        ) : null}
      </Section>
      {ok ? (
        <Section title={fresh ? 'RESULTS' : 'RESULTS · STALE (last run)'}>
          <div className={fresh ? '' : 'stale'}>
            <Row k="Max deflection" v={`${fmt.mm(ok.metrics.maxAbsDisplacement_m)} @ ${ok.metrics.maxDisplacementNode} · L/${Math.round(L / ok.metrics.maxAbsDisplacement_m)}`} />
            <Row k="Max axial" v={`${fmt.kN(ok.metrics.maxAbsAxial_N, 0)} · ${ok.metrics.maxAxialMember}`} />
            <Row k="Utilisation (proxy)" v={`${ok.metrics.maxUtilization.toFixed(2)} · ${ok.metrics.maxUtilizationMember}`} warn={ok.metrics.maxUtilization > 1} />
            <Row k="Steel mass" v={`${fmt.t(ok.metrics.mass_kg, 2)} per plane`} />
            {ok.reactions.map((x) => <Row key={x.nodeId} k={`Reaction ${x.nodeId}`} v={`${fmt.kN(x.ry_N, 0)}${Math.abs(x.rx_N) > 1 ? ` · H ${fmt.kN(x.rx_N, 0)}` : ''}`} />)}
            <p className="note">Utilisation = {PROXY_NOTE}: N/(fy·A) in tension, |N|/min(fy·A, Euler) in compression, CHS t = D/20.</p>
            <div className="btns">
              <button className="btn" onClick={() => download(`bridge-exe_${ok.runId}.csv`, reportCSV(s.resultModel!, ok), 'text/csv')}>CSV REPORT</button>
              <button className="btn" onClick={() => download(`bridge-exe_${ok.runId}.json`, modelJSON(s.design, s.resultModel!, ok))}>MODEL + RESULT JSON</button>
              <button className="btn" onClick={() => s.set({ info: true })}>RAW TABLES</button>
            </div>
          </div>
        </Section>
      ) : null}
      <Section title="ENGINEERING LENSES">
        <div className="lenses">{LENSES.map(([k, l, d]) => <button key={k} className={s.lens === k ? 'on' : ''} title={d} onClick={() => { s.set({ lens: k }); s.logIt('lens', k); }}>{l}</button>)}</div>
        <Slider label="Visual magnification" value={s.mag} min={1} max={200} step={1} show={`×${s.mag}`} onChange={(v) => s.set({ mag: v })} />
        <div className="tgs"><Toggle label="Ghost" on={s.showGhost} onChange={(v) => s.set({ showGhost: v })} /><Toggle label="Reactions" on={s.showReactions} onChange={(v) => s.set({ showReactions: v })} /><Toggle label="Labels" on={s.showLabels} onChange={(v) => s.set({ showLabels: v })} /></div>
      </Section>
      <LoadPanel />
    </aside>
  );
}

function BeamSolver() {
  const s = useStore(), r = s.beamResult, ok = r && r.status === 'solved' ? r : null;
  return (
    <aside className="rail right">
      <Section title="BEAM SOLVER">
        <div className={`status ${!r ? 'idle' : s.beamDirty ? 'dirty' : ok ? 'ok' : 'bad'}`}>{!r ? 'MODEL VALID · NOT ANALYSED' : s.beamDirty ? 'DIRTY — RERUN REQUIRED' : ok ? 'SOLVED · RESULTS CURRENT' : 'UNSUPPORTED CONFIGURATION'}</div>
        <button className="run" onClick={() => { s.runBeam(); s.set({ lens: s.lens === 'real' ? 'deform' : s.lens }); }}>RUN ANALYSIS</button>
        {r && r.status !== 'solved' ? <ul className="reasons">{r.reasons.map((x) => <li key={x}>{x}</li>)}</ul> : null}
        {ok ? (
          <div className={s.beamDirty ? 'stale' : ''}>
            <Row k="run" v={ok.runId} /><Row k="input hash" v={ok.inputsHash} />
            <Row k="Max deflection" v={`${fmt.mm(ok.metrics.maxAbsDeflection_m)} @ x = ${fmt.m(ok.metrics.at_m, 1)} · L/${Math.round(s.beam.L / ok.metrics.maxAbsDeflection_m)}`} />
            <Row k="Max moment" v={`${(ok.metrics.maxAbsMoment_Nm / 1e3).toFixed(0)} kN·m`} />
            <Row k="Max shear" v={fmt.kN(ok.metrics.maxAbsShear_N, 0)} />
            {ok.reactions.map((x) => <Row key={x.x} k={`Reaction x = ${x.x} m`} v={fmt.kN(x.ry_N, 1)} />)}
          </div>
        ) : null}
      </Section>
      <Section title="LENSES">
        <div className="lenses">{(Object.keys(BEAM_LENS) as Lens[]).map((k) => <button key={k} className={s.lens === k ? 'on' : ''} onClick={() => s.set({ lens: k })}>{BEAM_LENS[k]}</button>)}</div>
        <Slider label="Visual magnification" value={s.mag} min={1} max={200} step={1} show={`×${s.mag}`} onChange={(v) => s.set({ mag: v })} />
      </Section>
    </aside>
  );
}

/** keep the deck geometry in sync for exports elsewhere */
export const spanOf = (nodes: { x: number; deck: boolean }[]) => { const d = deckNodes(nodes as any); return d[d.length - 1]?.x ?? 0; };
