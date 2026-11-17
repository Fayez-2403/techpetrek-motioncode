// App state. The rule the whole UI follows: results belong to one solver run of one exact input (inputsHash). Any edit
// makes the model DIRTY; lenses and numbers then show the last run greyed until RUN ANALYSIS solves the new input.
import { create } from 'zustand';
import { DEFAULT_PARAMS, type TrussParams } from './geometry/trussPresets';
import { DEFAULT_LOADS, makeModel } from './engineering/model';
import type { LoadCase } from './engineering/loadDistribution';
import { MATERIALS } from './engineering/materials';
import type { Material, SolveResult, TrussModel } from './engineering/types';
import { solveTruss } from './engineering/truss';
import { solveBeam, type BeamModel, type BeamOk, type BeamFail } from './engineering/beam';
import { hashOf } from './engineering/hash';

export type Env = 'gorge' | 'city' | 'skyline';
export type Lens = 'real' | 'deform' | 'axial' | 'util' | 'path';
export type Mode = 'lab' | 'arcade';
export type Quality = 'low' | 'medium' | 'high';
export type CamPreset = 'hero' | 'under' | 'macro' | 'xray' | 'vehicle' | 'gorge' | 'sunset' | 'free';

export interface Design { params: TrussParams; material: Material; loads: LoadCase }
export interface Snapshot { label: 'A' | 'B'; design: Design; result: SolveResult; model: TrussModel }
export interface LogEntry { step: number; kind: string; data?: unknown; hash?: string }
export interface Sweep { positions: number[]; maxDisp: number[]; midChord: number[]; runIds: string[]; worstX: number; done: boolean }

export const DEFAULT_BEAM: BeamModel = { analysisType: 'linear-beam-euler-bernoulli', L: 24, E: 200e9, I: 0.035, points: [{ x: 12, fy: -500e3 }], q: -40e3 };

interface State {
  env: Env; mode: Mode; lens: Lens; mag: number; showGhost: boolean; showReactions: boolean; showLabels: boolean;
  quality: Quality; night: boolean; reducedMotion: boolean; cam: CamPreset; camNonce: number; tutorial: boolean; info: boolean;
  reel: boolean; reelT: number; tags: string[]; showIds: boolean; handles: boolean; showLoads: boolean;
  design: Design;
  history: Design[]; future: Design[];
  model: TrussModel; modelHash: string;
  result: SolveResult | null; resultModel: TrussModel | null; seq: number; solveMs: number;
  selected: string | null; hovered: string | null; dragging: string | null; addMode: string[] | null;
  snapA: Snapshot | null; snapB: Snapshot | null; compare: boolean;
  sweep: Sweep | null; sweepCancel: boolean;
  beam: BeamModel; beamResult: BeamOk | BeamFail | null; beamDirty: boolean;
  arcade: { armed: boolean; t0: number; nonce: number }; breakPanel: number; arcadeInfo: { bodies: number; particles: number } | null; follow: boolean;
  challenge: string | null; challengeDone: Record<string, boolean>; quiz: string | null;
  log: LogEntry[];
  set: (p: Partial<State>) => void;
  edit: (fn: (d: Design) => Design, kind: string, data?: unknown, keepHistory?: boolean) => void;
  undo: () => void; redo: () => void; reset: () => void;
  run: () => SolveResult;
  runBeam: () => void;
  editBeam: (b: Partial<BeamModel>) => void;
  snapshot: (label: 'A' | 'B') => void;
  logIt: (kind: string, data?: unknown) => void;
}

const DEFAULT_DESIGN: Design = { params: DEFAULT_PARAMS, material: MATERIALS[0], loads: DEFAULT_LOADS };
const derive = (d: Design) => { const model = makeModel(d.params, d.material, d.loads); return { model, modelHash: hashOf(model) }; };
const now = () => (typeof performance !== 'undefined' ? performance.now() : 0);

export const useStore = create<State>((set, get) => ({
  env: 'gorge', mode: 'lab', lens: 'real', mag: 60, showGhost: true, showReactions: true, showLabels: true,
  quality: 'high', night: false, reducedMotion: false, cam: 'hero', camNonce: 0, tutorial: true, info: false, reel: false, reelT: 0, tags: [], showIds: false, handles: true, showLoads: true,
  design: DEFAULT_DESIGN, history: [], future: [],
  ...derive(DEFAULT_DESIGN),
  result: null, resultModel: null, seq: 0, solveMs: 0,
  selected: null, hovered: null, dragging: null, addMode: null,
  snapA: null, snapB: null, compare: false,
  sweep: null, sweepCancel: false,
  beam: DEFAULT_BEAM, beamResult: null, beamDirty: true,
  arcade: { armed: false, t0: 0, nonce: 0 }, breakPanel: 4, arcadeInfo: null, follow: false,
  challenge: null, challengeDone: {}, quiz: null,
  log: [],
  set: (p) => set(p),
  logIt: (kind, data) => set((s) => ({ log: [...s.log.slice(-499), { step: s.log.length ? s.log[s.log.length - 1].step + 1 : 1, kind, data, hash: s.modelHash }] })),
  edit: (fn, kind, data, keepHistory = true) => {
    const s = get(), design = fn(s.design);
    set({ design, ...derive(design), history: keepHistory ? [...s.history.slice(-79), s.design] : s.history, future: keepHistory ? [] : s.future, sweep: null });
    get().logIt(kind, data);
  },
  undo: () => { const s = get(); if (!s.history.length) return; const prev = s.history[s.history.length - 1];
    set({ design: prev, ...derive(prev), history: s.history.slice(0, -1), future: [s.design, ...s.future] }); get().logIt('undo'); },
  redo: () => { const s = get(); if (!s.future.length) return; const next = s.future[0];
    set({ design: next, ...derive(next), history: [...s.history, s.design], future: s.future.slice(1) }); get().logIt('redo'); },
  reset: () => { set({ design: DEFAULT_DESIGN, ...derive(DEFAULT_DESIGN), history: [], future: [], result: null, resultModel: null, selected: null, sweep: null, addMode: null, mode: 'lab' }); get().logIt('reset'); },
  run: () => {
    const s = get(), t0 = now();
    const result = solveTruss(s.model, s.seq + 1);
    set({ result, resultModel: s.model, seq: s.seq + 1, solveMs: now() - t0 });
    get().logIt('run', { runId: result.runId, status: result.status, inputsHash: result.inputsHash });
    return result;
  },
  runBeam: () => { const s = get(); const r = solveBeam(s.beam, s.seq + 1); set({ beamResult: r, beamDirty: false, seq: s.seq + 1 }); get().logIt('run-beam', { runId: r.runId, status: r.status }); },
  editBeam: (b) => { set((s) => ({ beam: { ...s.beam, ...b }, beamDirty: true })); get().logIt('edit-beam', b); },
  snapshot: (label) => {
    const s = get();
    if (!s.result || !s.resultModel || s.result.inputsHash !== s.modelHash) return;
    const snap: Snapshot = { label, design: s.design, result: s.result, model: s.resultModel };
    set(label === 'A' ? { snapA: snap } : { snapB: snap });
    get().logIt('snapshot', { label, runId: s.result.runId });
  },
}));

/** the result is current only if it was solved from exactly the model on screen */
export const useFresh = () => useStore((s) => !!s.result && s.result.inputsHash === s.modelHash);
