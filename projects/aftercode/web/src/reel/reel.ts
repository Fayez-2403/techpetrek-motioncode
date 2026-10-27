// The 70 s AFTERCODE reel, captured from this app. The music switches song at every mode change (SONGS): reel time r maps to
// song time ss + (r - r0) of the segment under r, and seek() puts that track in the engine, so every dance move and world
// effect is the app's own beat-sync to the song you hear. Realizer segments keep the original window (r + O). Each 3D shot sets
// app state (world, dancers, routine, formation) and a scripted camera; seek(r) is pure (same r -> same frame).
// UI shots (face studio, roster, full app) are captured separately in the desktop layout (scripts/capture.ts ui).
import * as THREE from 'three';
import { engine } from '../audio/engine';
import { beatPos, type Analysis } from '../audio/analysis';
import { LIBRARY } from '../audio/library';
import { DEFAULT_LOOK, type Look } from '../dance/avatar';
import type { Performer } from '../dance/crew';
import type { StyleId } from '../dance/clips';
import { reelCam } from '../scene/Director';
import { getState, setState, type AppState } from '../state';

export const O = 22.96;            // song second at reel 0: the breakdown return (60.96 s) lands on reel 38.00
export const FPS = 60;
const DB = (k: number) => 1.52 + 1.92 * k;   // reel downbeats: 1.52, 3.44, 5.36 ...

// one song per mode; every boundary is a shot cut, every ss a measured downbeat of that song (scripts/analysis_multi.ts)
export const SONGS = [
  { r0: 0, r1: 3.44, track: 'local-forecast', ss: 0 },              // coders at their desks: elevator music
  { r0: 3.44, r1: 14.96, track: 'realizer', ss: 3.44 + O },          // DANCE: the lead stands, face studio, solo
  { r0: 14.96, r1: 24.56, track: 'electro-cabello', ss: 82.57 },     // outfits + worlds
  { r0: 24.56, r1: 28.4, track: 'monkeys', ss: 86.68 },              // a friend drops in: duo
  { r0: 28.4, r1: 34.16, track: 'smooth-move', ss: 33 },             // dance battle
  { r0: 34.16, r1: 62.96, track: 'realizer', ss: 34.16 + O },        // the whole team, the 0:38 drop, montage, the app
  { r0: 62.96, r1: 70, track: 'funk-game-loop', ss: 36.58 },         // back in the office
];
const songAt = (r: number) => SONGS.find((s) => r >= s.r0 && r < s.r1) ?? SONGS[SONGS.length - 1];
const songT = (r: number) => { const s = songAt(r); return s.ss + (r - s.r0); };
const AN = new Map<string, Analysis>();
/** load every reel song once (engine cache), so seek() can switch tracks synchronously */
export async function prepare() {
  for (const id of new Set(SONGS.map((s) => s.track))) { const t = LIBRARY.find((x) => x.id === id)!; AN.set(id, await engine.load(id, t.file!, t.bpm)); }
  return [...AN.keys()];
}
// Electro Cabello downbeats (song 84.62, 86.67, 88.72, 90.77) in reel time
const EC = [14.96, 17.01, 19.06, 21.11, 23.16, 24.56];

const look = (p: Partial<Look>): Look => ({ ...DEFAULT_LOOK, ...p });
const DEV: Look[] = [
  look({ outfit: 'hoodie', hair: 'short', accessory: 'headphones', skin: '#c99a7a', hairColor: '#1c1512' }),
  look({ outfit: 'office', hair: 'bun', skin: '#8d5a3c', hairColor: '#120d0a' }),
  look({ outfit: 'street', hair: 'curly', accessory: 'cap', skin: '#e2b896', hairColor: '#3a2416' }),
  look({ outfit: 'office', hair: 'buzz', accessory: 'shades', skin: '#a8714f', hairColor: '#0e0c0b' }),
  look({ outfit: 'hoodie', hair: 'long', skin: '#f0c9a8', hairColor: '#5a3a22', tint: '#c9d6ff' }),
];
const STAGE: Look[] = [
  look({ outfit: 'neon', hair: 'short', accessory: 'headphones', skin: '#c99a7a' }),
  look({ outfit: 'chrome', hair: 'bun', skin: '#8d5a3c' }),
  look({ outfit: 'cyberpunk', hair: 'curly', skin: '#e2b896' }),
  look({ outfit: 'festive', hair: 'buzz', skin: '#a8714f' }),
  look({ outfit: 'festival', hair: 'long', skin: '#f0c9a8' }),
];
const P = (id: string, l: Look, style: StyleId, spawnBeat?: number): Performer => ({ id, faceId: null, look: l, style, role: id.endsWith('0') ? 'lead' : 'support', spawnBeat });

type Cam = (r: number, u: number) => { P: THREE.Vector3; T: THREE.Vector3; fov: number };
interface Shot { id: string; r0: number; r1: number; state: () => Partial<AppState>; cam: Cam }
const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const ease = (u: number) => (u < 0.5 ? 4 * u * u * u : 1 - (-2 * u + 2) ** 3 / 2);
const orbit = (a: number, rad: number, y: number, ty = 1.0, fov = 38, cx = 0, cz = 0) => ({ P: V(cx + Math.sin(a) * rad, y, cz + Math.cos(a) * rad), T: V(cx, ty, cz), fov });
const sb = (r: number) => { const a = AN.get(songAt(r).track); return a ? beatPos(a, songT(r)) : songT(r) * 2.0833; };

export const SHOTS: Shot[] = [
  // 1. the office: five coders at their desks, code on every monitor; the lead stands on "DANCE"; the camera dives into a monitor
  { id: 'office', r0: 0, r1: DB(2), state: () => ({ world: 'office', officeIntro: true, introAt: sb(DB(1)) - 8, formation: 'line', crewMode: 'chorus', performers: DEV.map((l, i) => P(`d${i}`, l, 'disco')) }),
    cam: (r) => { const dive = ease(Math.min(1, Math.max(0, (r - 4.25) / 1.11))); const push = Math.min(1, r / 4.25);
      return { P: V(0.05, 1.98 - 0.08 * push, 1.0 - 0.25 * push).lerp(V(0.0, 1.07, -1.27), dive), T: V(0.0, 0.98, -1.55).lerp(V(0.0, 1.06, -1.62), dive), fov: 62 - 34 * dive }; } },
  // 2. solo in the Neon Pulse Tunnel (after the face-studio UI insert)
  { id: 'solo1', r0: DB(4), r1: DB(5), state: () => ({ world: 'tunnel', officeIntro: false, performers: [P('d0', STAGE[0], 'freestyle')], formation: 'line' }),
    cam: (_r, u) => ({ P: V(-0.3 + 0.6 * u, 0.45, 3.4 - 0.3 * u), T: V(0, 1.15, 0), fov: 44 }) },
  { id: 'solo2', r0: DB(5), r1: DB(6), state: () => ({ world: 'tunnel', performers: [P('d0', STAGE[0], 'freestyle')] }),
    cam: (_r, u) => orbit(-0.35 + 0.5 * u, 2.3, 1.5, 1.3, 34) },
  { id: 'solo3', r0: DB(6), r1: DB(7), state: () => ({ world: 'tunnel', performers: [P('d0', STAGE[0], 'cyber')] }),
    cam: (_r, u) => ({ P: V(0, 0.8 + 1.6 * ease(u), 4.6 + 0.6 * u), T: V(0, 1.0, 0), fov: 40 }) },
  // 3. outfit + worlds: one continuous orbit across hard cuts, the dancer carried in the same pose
  { id: 'outfitA', r0: EC[0], r1: EC[1], state: () => ({ world: 'tunnel', performers: [P('d0', look({ outfit: 'street', hair: 'short', accessory: 'headphones' }), 'disco')] }), cam: (r) => orbit(0.9 - (r - DB(7)) * 0.16, 3.1, 1.25, 1.0) },
  { id: 'outfitB', r0: EC[1], r1: EC[2], state: () => ({ world: 'tunnel', performers: [P('d0', look({ outfit: 'chrome', hair: 'short', accessory: 'headphones' }), 'disco')] }), cam: (r) => orbit(0.9 - (r - DB(7)) * 0.16, 3.1, 1.25, 1.0) },
  { id: 'chrome', r0: EC[2], r1: EC[3], state: () => ({ world: 'chrome', performers: [P('d0', look({ outfit: 'chrome', hair: 'short', accessory: 'headphones' }), 'disco')] }), cam: (r) => orbit(0.9 - (r - DB(7)) * 0.16, 3.1, 1.25, 1.0) },
  { id: 'galaxy', r0: EC[3], r1: EC[4], state: () => ({ world: 'galaxy', performers: [P('d0', look({ outfit: 'chrome', hair: 'short', accessory: 'headphones' }), 'contemporary')] }), cam: (r) => orbit(0.9 - (r - DB(7)) * 0.16, 3.4, 1.6, 1.05) },
  { id: 'bloom', r0: EC[4], r1: EC[5], state: () => ({ world: 'bloom', performers: [P('d0', look({ outfit: 'festival', hair: 'short', accessory: 'headphones' }), 'contemporary')] }), cam: (r) => orbit(0.9 - (r - DB(7)) * 0.16, 2.6, 2.4, 1.0, 44) },   // high + inside the inner flower ring (r 3.6): open petals never block
  // 4. duo: a friend drops in (mirror), then a dance battle on the rooftop
  { id: 'duo', r0: DB(12), r1: DB(14), state: () => ({ world: 'dream', duoMode: 'mirror', formation: 'line', performers: [P('d0', STAGE[0], 'disco'), P('d1', STAGE[1], 'disco', sb(DB(12) + 0.48))] }),
    cam: (_r, u) => ({ P: V(-0.6 + 1.2 * u, 1.35, 4.2 - 0.4 * u), T: V(0, 1.0, 0), fov: 38 }) },
  { id: 'battle', r0: DB(14), r1: DB(17), state: () => ({ world: 'city', duoMode: 'battle', formation: 'line', performers: [P('d0', STAGE[0], 'cyber'), P('d1', STAGE[1], 'shuffle')] }),
    cam: (r, u) => { const side = Math.floor((sb(r) / 8)) % 2 ? 1 : -1; return { P: V(side * 1.2 + Math.sin(u * 2) * 0.3, 1.25, 3.6), T: V(side * 0.45, 1.05, 0), fov: 36 }; } },
  // 5. the crew: build-up, the drop at reel 38.00, formations line -> V -> rows
  { id: 'crew', r0: DB(18), r1: DB(23), state: () => ({ world: 'stage', crewMode: 'buildup', formation: 'dynamic', phraseBeats: 8, phraseOffset: sb(DB(19)) - 4,
      performers: STAGE.map((l, i) => P(`d${i}`, l, 'disco', i ? sb(DB(18)) + i * 0.5 : undefined)) }),
    cam: (r) => { if (r < DB(19)) { const u = (r - DB(18)) / 1.92; return { P: V(0, 0.9, 9.0 - 0.8 * u), T: V(0, 1.15, -0.3), fov: 44 }; }
      if (r < DB(21)) { const u = (r - DB(19)) / 3.84; return orbit(-0.7 + 1.4 * u, 8.6, 1.9, 1.05, 44); }
      const u = (r - DB(21)) / 3.84; return { P: V(0.5, 1.0 + 3.2 * ease(u), 8.6 + 0.8 * u), T: V(0, 0.85 - 0.1 * u, -0.3), fov: 44 }; } },
  // 6. montage: the crew in all eight worlds, two beats each
  ...(['tunnel', 'galaxy', 'chrome', 'city', 'bloom', 'stage', 'dream', 'office'] as const).map((w, k): Shot => ({
    id: `m_${w}`, r0: DB(23) + k * 0.96, r1: DB(23) + (k + 1) * 0.96,
    state: () => ({ world: w, officeIntro: false, crewMode: 'chorus', formation: (['v', 'line', 'rows', 'v', 'circle', 'line', 'v', 'rows'] as const)[k], performers: STAGE.map((l, i) => P(`d${i}`, l, (['disco', 'freestyle', 'cyber', 'disco', 'bollywood', 'freestyle', 'contemporary', 'disco'] as const)[k])) }),
    cam: (_r, u) => orbit((k % 2 ? 0.45 : -0.45) + (k % 2 ? -0.3 : 0.3) * u, 8.4 - 0.7 * u, 1.3 + (k % 3) * 0.35, 1.1, 44) })),
  { id: 'm_end', r0: DB(23) + 7.68, r1: DB(28), state: () => ({ world: 'tunnel', crewMode: 'chorus', formation: 'v', performers: STAGE.map((l, i) => P(`d${i}`, l, 'disco')) }),
    cam: (_r, u) => ({ P: V(0, 0.9 + 0.4 * u, 8.6 - 1.4 * u), T: V(0, 1.1, -0.3), fov: 46 }) },
  // 7. finale: the office again, transformed; the crew's synced finish; the title rides the last downbeats
  { id: 'finale', r0: DB(32), r1: 70.0, state: () => ({ world: 'office', officeIntro: false, crewMode: 'chorus', formation: 'v', performers: DEV.map((l, i) => P(`d${i}`, l, 'disco')) }),
    cam: (_r, u) => ({ P: V(0, 1.4 + 1.2 * ease(u), 6.8 + 2.4 * ease(u)), T: V(0, 1.0, -0.6), fov: 44 }) },
];

let cur: Shot | null = null;
/** put the app at reel time r: state for the shot under r, the song clock at r + O, the scripted camera */
export function seek(r: number) {
  const sh = SHOTS.find((s) => r >= s.r0 && r < s.r1) ?? SHOTS[SHOTS.length - 1];
  if (sh !== cur) { setState({ view: 'dance', camera: 'director', quality: 'high', ...sh.state() }); cur = sh; }
  const song = songAt(r);
  if (engine.trackId !== song.track) { if (!AN.has(song.track)) throw new Error('reel: call prepare() first'); void engine.load(song.track, ''); }   // cache hit: synchronous
  engine.manual = songT(r);
  const u = Math.min(1, Math.max(0, (r - sh.r0) / (sh.r1 - sh.r0)));
  reelCam.fn = (cam) => { const c = sh.cam(r, u); cam.position.copy(c.P); cam.lookAt(c.T); cam.fov = c.fov; cam.updateProjectionMatrix(); };
  return sh.id;
}
export const reelApi = { seek, prepare, songs: SONGS, shots: SHOTS.map((s) => ({ id: s.id, r0: s.r0, r1: s.r1 })), O, getState };
