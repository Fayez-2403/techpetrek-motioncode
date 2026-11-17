// The one store the UI and the world share. It owns the Sim; the world reads sim state directly every frame (no React
// re-render), while the UI re-renders on `version`, bumped at most ~10 times a second.
import { create } from 'zustand';
import { Sim, type Params } from './simulation/engine';
import { scenarioById, type ControlKey } from './simulation/scenarios';

export type CamMode = 'overview' | 'follow' | 'bottleneck' | 'orbit' | 'cinematic';

interface Store {
  sim: Sim;
  scenarioId: string;
  version: number;
  playing: boolean;
  speed: number;            // sim seconds per real second
  cam: CamMode;
  debug: boolean;
  picker: boolean;          // scenario picker open
  /** the reel's capture mode: the sim is seeked by window.seek(t), never by real time */
  reel: boolean;
  load(id: string, params?: Partial<Params>): void;
  set(p: Partial<Params>, label?: string): void;
  locked(k: ControlKey): string | undefined;
  toggle(): void;
  setSpeed(x: number): void;
  restart(): void;
  seek(ms: number): void;
  advance(realMs: number): void;
  setCam(c: CamMode): void;
  setDebug(d: boolean): void;
  setPicker(p: boolean): void;
  bump(): void;
}

let lastBump = 0;
export const useStore = create<Store>((set, get) => ({
  sim: new Sim(scenarioById('million')),
  scenarioId: 'million',
  version: 0,
  playing: false,
  speed: 1,
  cam: 'overview',
  debug: false,
  picker: true,
  reel: false,
  load: (id, params) => set({ sim: new Sim(scenarioById(id), params), scenarioId: id, playing: false, version: get().version + 1, picker: false }),
  set: (p, label) => { get().sim.dispatch(p, label); if (!get().playing) { get().sim.step(); } get().bump(); },
  locked: (k) => get().sim.sc.locked[k],
  toggle: () => { const s = get(); if (s.sim.done) s.restart(); set({ playing: !get().playing }); },
  setSpeed: (speed) => set({ speed }),
  restart: () => { const s = get(); set({ sim: new Sim(s.sim.sc), playing: false, version: s.version + 1 }); },
  seek: (ms) => { get().sim.seek(ms); set({ version: get().version + 1 }); },
  advance: (realMs) => {
    const s = get();
    if (!s.playing || s.reel) return;
    s.sim.runTo(s.sim.s.now + Math.min(250, realMs) * s.speed);
    if (s.sim.done) set({ playing: false });
    s.bump();
  },
  setCam: (cam) => set({ cam }),
  setDebug: (debug) => set({ debug }),
  setPicker: (picker) => set({ picker }),
  bump: () => { const now = performance.now(); if (now - lastBump > 90) { lastBump = now; set({ version: get().version + 1 }); } },
}));

/** subscribe a UI component to sim updates (returns the sim) */
export const useSim = () => { useStore((s) => s.version); return useStore((s) => s.sim); };
