// App state: a tiny external store (useSyncExternalStore). Faces are kept in memory only; nothing persists a face.
import { useSyncExternalStore } from 'react';
import type { FaceRecord } from './face/faces';
import type { Performer, DuoMode, CrewMode, FormationId } from './dance/crew';
import { DEFAULT_LOOK } from './dance/avatar';

export const WORLDS = [
  { id: 'tunnel', name: 'Neon Pulse Tunnel' }, { id: 'galaxy', name: 'Particle Galaxy' }, { id: 'chrome', name: 'Liquid Chrome Waves' },
  { id: 'city', name: 'Audio City Skyline' }, { id: 'bloom', name: 'Fractal Bloom' }, { id: 'stage', name: 'Beat Dancer Stage' },
  { id: 'dream', name: 'Dream Space' }, { id: 'office', name: 'Developer Break Mode' },
] as const;
export type WorldId = (typeof WORLDS)[number]['id'];
export const CAMERAS = [
  { id: 'director', name: 'Auto director' }, { id: 'front', name: 'Full-body front' }, { id: 'orbit', name: 'Three-quarter orbit' },
  { id: 'low', name: 'Low-angle stage' }, { id: 'track', name: 'Side tracking' }, { id: 'crane', name: 'Crane rise' },
  { id: 'wide', name: 'Wide crew' }, { id: 'close', name: 'Close-up' }, { id: 'concert', name: 'Rotating concert' },
] as const;
export type CameraId = (typeof CAMERAS)[number]['id'];

export interface AppState {
  view: 'visualizer' | 'dance';
  world: WorldId; camera: CameraId; trackId: string;
  performers: Performer[]; faces: FaceRecord[];
  duoMode: DuoMode; crewMode: CrewMode; formation: FormationId; intensity: number;
  selected: number; consent: boolean; quality: 'low' | 'medium' | 'high';
  vertical: boolean; recording: boolean; showCredits: boolean; panel: 'faces' | 'look' | null;
  officeIntro: boolean;   // Developer Break: dancers start seated, then stand on the music
  introAt: number;        // song beat at which the office intro starts (the lead stands 8 beats later)
  phraseBeats: number; phraseOffset: number;   // dynamic formations: change every phraseBeats, counted from phraseOffset
  soundtracks: boolean;                         // mode soundtracks: switching world (from the UI) switches to that world's song
  slots: Partial<Record<WorldId, string>>;      // world -> name of the user's song in that slot (bytes stay in IndexedDB)
}
let id = 0;
export const newPerformer = (i: number): Performer => ({ id: `p${++id}`, faceId: null, style: 'hiphop', role: i === 0 ? 'lead' : 'support',
  look: { ...DEFAULT_LOOK, outfit: (['street', 'hoodie', 'office', 'neon', 'chrome', 'festival', 'cyberpunk', 'festive'] as const)[i % 8],
    hair: (['short', 'bun', 'curly', 'buzz', 'long', 'short', 'none', 'bun'] as const)[i % 8], skin: ['#c99a7a', '#8d5a3c', '#e2b896', '#a8714f', '#f0c9a8', '#6f4a33', '#d8a47f', '#b9835e'][i % 8] } });

let state: AppState = {
  view: 'dance', world: 'tunnel', camera: 'director', trackId: 'realizer', performers: [newPerformer(0)], faces: [],
  duoMode: 'mirror', crewMode: 'chorus', formation: 'dynamic', intensity: 1, selected: 0, consent: false, quality: 'high',
  vertical: false, recording: false, showCredits: false, panel: null, officeIntro: true, introAt: 0, phraseBeats: 32, phraseOffset: 0,
  soundtracks: true, slots: {},
};
const subs = new Set<() => void>();
export const getState = () => state;
export function setState(p: Partial<AppState> | ((s: AppState) => Partial<AppState>)) {
  state = { ...state, ...(typeof p === 'function' ? p(state) : p) }; subs.forEach((f) => f());
}
export function useApp<T>(sel: (s: AppState) => T): T {
  return useSyncExternalStore((cb) => { subs.add(cb); return () => subs.delete(cb); }, () => sel(state));
}
export const updatePerformer = (i: number, p: Partial<Performer>) => setState((s) => ({ performers: s.performers.map((x, k) => (k === i ? { ...x, ...p, look: { ...x.look, ...(p.look ?? {}) } } : x)) }));
export const modeKind = (s: AppState) => (s.performers.length === 1 ? 'solo' : s.performers.length === 2 ? s.duoMode : s.crewMode);
