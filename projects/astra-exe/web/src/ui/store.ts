// A tiny external store for the UI (React reads it with useSyncExternalStore; the simulation reads it directly,
// so dragging a slider never re-renders the 3D scene).
import { useSyncExternalStore } from 'react';
import type { LiveSettings, Telemetry } from '../view/stage';
import type { ChallengeState } from '../core/challenges';

export function createStore<T extends object>(init: T) {
  let s = init;
  const ls = new Set<() => void>();
  return {
    get: () => s,
    set: (p: Partial<T>) => { s = { ...s, ...p }; ls.forEach((l) => l()); },
    subscribe: (l: () => void) => { ls.add(l); return () => { ls.delete(l); }; },
  };
}
export type Store<T extends object> = ReturnType<typeof createStore<T>>;
export function useStore<T extends object, U>(store: Store<T>, sel: (s: T) => U): U {
  return useSyncExternalStore(store.subscribe, () => sel(store.get()));
}

export interface UIState {
  ui: boolean; panel: boolean; debug: boolean; sound: boolean; capture: boolean; loaded: boolean; status: string[];
  hover: boolean; drawing: boolean; challenge: ChallengeState | null; toast: { text: string; t: number } | null; recording: boolean;
}

const params = new URLSearchParams(location.search);
const q = params.get('q');
// without ?q=: phones and integrated or software GPUs start on low (medium runs at about 12-16 fps on an Iris Xe)
function defaultQuality(): 'low' | 'medium' {
  if (matchMedia('(pointer: coarse)').matches) return 'low';
  try {
    const gl = document.createElement('canvas').getContext('webgl2'), ext = gl?.getExtension('WEBGL_debug_renderer_info');
    const r = String(ext && gl ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : '');
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
    return /intel|swiftshader|llvmpipe|microsoft basic|mali|adreno|powervr/i.test(r) ? 'low' : 'medium';
  } catch { return 'low'; }
}
export const settings = createStore<LiveSettings>({
  mode: 'vajra', drawPower: 1, gravity: 'earth', material: 'brittle', impactMult: 1, drag: true, timeScale: 1, paused: false, slowmo: true,
  camera: 'cinematic', quality: q === 'low' || q === 'medium' || q === 'high' || q === 'ultra' ? q : defaultQuality(), trajectory: true, autoCut: true,
});
export const ui = createStore<UIState>({
  ui: true, panel: matchMedia('(min-width: 900px)').matches, debug: params.has('debug'), sound: true, capture: false, loaded: false, status: [],
  hover: false, drawing: false, challenge: null, toast: null, recording: false,
});
export const telemetry = createStore<Telemetry>({ fps: 0, loose: 0, fixed: 0, rubble: 0, draw: 0, speed: 0, ke: 0, fantasy: 0, timeScale: 1, stepMs: 0, quality: 'medium', detached: 0, lastImpact: '', challenge: '' });

export function toast(text: string) { ui.set({ toast: { text, t: performance.now() } }); }
