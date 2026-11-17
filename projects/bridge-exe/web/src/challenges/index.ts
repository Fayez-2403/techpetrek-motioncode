// Five educational challenges. Every pass condition reads a solver result of the CURRENT input (fresh run), never a
// visual. Targets are fictional teaching objectives, not design approval criteria.
import type { SolveOk } from '../engineering/types';
import { DEFAULT_PARAMS } from '../geometry/trussPresets';
import { DEFAULT_LOADS } from '../engineering/model';
import { MATERIALS } from '../engineering/materials';
import { DEFAULT_BEAM, useStore, type Design } from '../store';
import { deflectionLimit } from '../engineering/educationalChecks';
import { fmt } from '../engineering/units';

export interface Check { pass: boolean; lines: string[] }
export interface Challenge {
  id: string; n: number; title: string; brief: string; env: 'gorge' | 'city';
  setup: () => void;
  check: () => Check;
}

const fresh = () => { const s = useStore.getState(); return s.result && s.result.inputsHash === s.modelHash ? s.result : null; };
const solved = () => { const r = fresh(); return r && r.status === 'solved' ? (r as SolveOk) : null; };
const loadDesign = (d: Partial<Design>) => {
  const s = useStore.getState();
  s.edit((cur) => ({ ...cur, ...d }), 'challenge-setup');
  s.set({ result: null, selected: null, lens: 'real', mode: 'lab', sweep: null, compare: false });
};

export const BUDGET_T = 12;   // fictional budget, tonnes of steel per truss plane (a 11.8 t solution exists: checked by search)
export const CHALLENGES: Challenge[] = [
  {
    id: 'first-load', n: 1, env: 'city', title: 'FIRST LOAD',
    brief: 'A 24 m city beam carries one 500 kN truck at midspan (no deck load). Run the analysis, then answer: what does the LEFT bearing carry?',
    setup: () => { const s = useStore.getState(); s.set({ env: 'city', beam: { ...DEFAULT_BEAM, q: 0, points: [{ x: 12, fy: -500e3 }] }, beamDirty: true, beamResult: null, quiz: null, lens: 'deform' }); },
    check: () => {
      const s = useStore.getState(), r = s.beamResult;
      if (!r || r.status !== 'solved' || s.beamDirty) return { pass: false, lines: ['Run the beam analysis first.'] };
      const left = r.reactions.find((x) => x.x === 0)!.ry_N;
      const pass = s.quiz === 'half' && Math.abs(left - 250e3) < 1;
      return { pass, lines: [`Solver: left reaction ${fmt.kN(left, 1)} (run ${r.runId})`, s.quiz ? (s.quiz === 'half' ? 'Correct: P/2 by symmetry.' : 'Not quite: look at the solver value.') : 'Pick an answer.'] };
    },
  },
  {
    id: 'missing-member', n: 2, env: 'gorge', title: 'THE MISSING MEMBER',
    brief: 'Diagonal D2 has been removed. Run it: the solver will refuse (a mechanism has no answer). Use ADD MEMBER to brace panel 2, then rerun.',
    setup: () => loadDesign({ params: { ...DEFAULT_PARAMS, removed: ['D2'] }, material: MATERIALS[0], loads: DEFAULT_LOADS }),
    check: () => {
      const r = fresh(), s = useStore.getState();
      if (!r) return { pass: false, lines: ['Run the analysis.'] };
      if (r.status !== 'solved') return { pass: false, lines: ['Solver: ' + r.reasons[0], 'That is the diagnosis. Now add a member across panel 2.'] };
      const fixed = s.design.params.added.length > 0;
      return { pass: fixed, lines: [fixed ? `Stable again: ${s.design.params.added.map((a) => `${a.id} ${a.a}–${a.b}`).join(', ')} solved (${r.runId}).` : 'Solved, but use a new member to fix it.'] };
    },
  },
  {
    id: 'budget', n: 3, env: 'gorge', title: 'BUDGET VS STIFFNESS',
    brief: `Keep deflection ≤ span/900, utilisation proxy ≤ 1.0 and steel ≤ ${BUDGET_T} t per plane. Change areas, height, panels or topology (dead + deck + 300 kN truck).`,
    setup: () => loadDesign({ params: { ...DEFAULT_PARAMS, areas: { top: 0.016, bottom: 0.014, vertical: 0.006, diagonal: 0.009 } }, material: MATERIALS[0], loads: DEFAULT_LOADS }),
    check: () => {
      const r = solved(), s = useStore.getState();
      if (!r) return { pass: false, lines: ['Run the analysis on the current design.'] };
      const lim = deflectionLimit(s.design.params.span, 900), d = r.metrics.maxAbsDisplacement_m, t = r.metrics.mass_kg / 1000, u = r.metrics.maxUtilization;
      return { pass: d <= lim && t <= BUDGET_T && u <= 1, lines: [`Deflection ${fmt.mm(d)} / limit ${fmt.mm(lim)} ${d <= lim ? '✓' : '✕'}`, `Utilisation proxy ${u.toFixed(2)} / 1.00 ${u <= 1 ? '✓' : '✕'}`, `Steel ${t.toFixed(2)} t / budget ${BUDGET_T} t ${t <= BUDGET_T ? '✓' : '✕'}`] };
    },
  },
  {
    id: 'moving-load', n: 4, env: 'gorge', title: 'THE MOVING LOAD',
    brief: 'Run MOVING-LOAD SWEEP (one static solve per truck position). Then park the truck where the bridge deflects most and run once more.',
    setup: () => loadDesign({ params: DEFAULT_PARAMS, material: MATERIALS[0], loads: { ...DEFAULT_LOADS, vehicle: { on: true, x: 6, P: 300e3 } } }),
    check: () => {
      const s = useStore.getState(), r = solved(), sw = s.sweep;
      if (!sw?.done) return { pass: false, lines: ['Run the sweep first.'] };
      if (!r) return { pass: false, lines: [`Envelope worst position: x = ${fmt.m(sw.worstX, 1)}. Park the truck there and run.`] };
      const ok = Math.abs(s.design.loads.vehicle.x - sw.worstX) <= s.design.params.span / s.design.params.panels / 2;
      return { pass: ok, lines: [`Truck at ${fmt.m(s.design.loads.vehicle.x, 1)}; envelope worst ${fmt.m(sw.worstX, 1)}`, ok ? `Found it: max deflection ${fmt.mm(r.metrics.maxAbsDisplacement_m)}.` : 'Not the worst spot yet.'] };
    },
  },
  {
    id: 'impossible-span', n: 5, env: 'gorge', title: 'THE IMPOSSIBLE SPAN',
    brief: 'Cross 72 m. Valid model, deflection ≤ span/700, utilisation proxy ≤ 0.9, steel ≤ 26 t per plane. Educational simulation; not a buildable bridge design.',
    setup: () => loadDesign({ params: { ...DEFAULT_PARAMS, span: 72, panels: 8, height: 6 }, material: MATERIALS[0], loads: { ...DEFAULT_LOADS, vehicle: { on: true, x: 36, P: 300e3 } } }),
    check: () => {
      const r = solved(), s = useStore.getState();
      if (!r) return { pass: false, lines: ['Run the analysis.'] };
      const lim = s.design.params.span / 700, d = r.metrics.maxAbsDisplacement_m, u = r.metrics.maxUtilization, t = r.metrics.mass_kg / 1000;
      const pass = s.design.params.span >= 72 && d <= lim && u <= 0.9 && t <= 26;
      return { pass, lines: [`Span ${fmt.m(s.design.params.span, 0)} ${s.design.params.span >= 72 ? '✓' : '✕'}`, `Deflection ${fmt.mm(d)} / ${fmt.mm(lim)} ${d <= lim ? '✓' : '✕'}`, `Utilisation proxy ${u.toFixed(2)} / 0.90 ${u <= 0.9 ? '✓' : '✕'}`, `Steel ${t.toFixed(1)} t / 26 t ${t <= 26 ? '✓' : '✕'}`] };
    },
  },
];
