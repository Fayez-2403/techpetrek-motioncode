// Dance clips (public/mocap/*.json, made by scripts/mocap.ts from the CMU database) and beat-locked pose sampling.
// pose(t) is a pure function of the song time t: the clip's own movement beat is mapped onto the song's detected beats
// (whole-beat time warp, so accents land on beats), with a seamless cross-faded loop.
import * as THREE from 'three';
import { beatPos, type Analysis } from '../audio/analysis';

export interface Clip {
  id: string; label: string; source: string; fps: number; joints: string[]; parents: number[]; offsets: number[][];
  frames: number; beat: number; phase: number; beats: number; rot: Float32Array; root: Float32Array;
}
export const STYLES = [
  { id: 'hiphop', name: 'Hip-hop groove' }, { id: 'popping', name: 'Popping' }, { id: 'shuffle', name: 'Shuffle' },
  { id: 'disco', name: 'Funk / disco' }, { id: 'contemporary', name: 'Contemporary' }, { id: 'cyber', name: 'Robotic / cyber' },
  { id: 'bollywood', name: 'Bollywood-inspired' }, { id: 'freestyle', name: 'Casual freestyle' },
  { id: 'salsa', name: 'Salsa' }, { id: 'comedy', name: 'Comedy (Macarena)' }, { id: 'moonwalk', name: 'Moonwalk' }, { id: 'groove', name: 'Side groove' },
] as const;
export type StyleId = (typeof STYLES)[number]['id'];

const clips = new Map<string, Clip>();
const pending = new Map<string, Promise<Clip>>();
export function loadClip(id: string): Promise<Clip> {
  const have = clips.get(id); if (have) return Promise.resolve(have);
  let p = pending.get(id);
  if (!p) {
    p = fetch(`/mocap/${id}.json`).then((r) => r.json()).then((j) => {
      const c: Clip = { ...j, rot: new Float32Array(j.rot), root: new Float32Array(j.root) };
      clips.set(id, c); return c;
    });
    pending.set(id, p);
  }
  return p;
}
export const getClip = (id: string) => clips.get(id);
export const loadAll = () => Promise.all(STYLES.map((s) => loadClip(s.id)));

/** pose buffers: local quaternions per joint (clip joint order) + root position (clip units) */
export interface Pose { q: Float32Array; root: Float32Array }
export const newPose = (c: Clip): Pose => ({ q: new Float32Array(c.joints.length * 4), root: new Float32Array(3) });

const qa = new THREE.Quaternion(), qb = new THREE.Quaternion();
function sampleFrame(c: Clip, t: number, out: Pose, w = 1) {
  const f = Math.max(0, Math.min(c.frames - 1.001, t * c.fps)), i = Math.floor(f), u = f - i, J = c.joints.length;
  for (let j = 0; j < J; j++) {
    const a = (i * J + j) * 4, b = ((i + 1) * J + j) * 4;
    qa.set(c.rot[a], c.rot[a + 1], c.rot[a + 2], c.rot[a + 3]); qb.set(c.rot[b], c.rot[b + 1], c.rot[b + 2], c.rot[b + 3]);
    qa.slerp(qb, u);
    if (w >= 1) { out.q[j * 4] = qa.x; out.q[j * 4 + 1] = qa.y; out.q[j * 4 + 2] = qa.z; out.q[j * 4 + 3] = qa.w; }
    else { qb.set(out.q[j * 4], out.q[j * 4 + 1], out.q[j * 4 + 2], out.q[j * 4 + 3]).slerp(qa, w); out.q.set([qb.x, qb.y, qb.z, qb.w], j * 4); }
  }
  for (let k = 0; k < 3; k++) {
    const v = c.root[i * 3 + k] * (1 - u) + c.root[(i + 1) * 3 + k] * u;
    out.root[k] = w >= 1 ? v : out.root[k] * (1 - w) + v * w;
  }
}

/** how many clip beats play per song beat (1/2, 1 or 2): the choice that keeps playback speed closest to natural */
export function beatRatio(c: Clip, songBeat: number) {
  let best = 1, err = 1e9;
  for (const r of [0.5, 1, 2]) { const speed = (r * c.beat) / songBeat; const e = Math.abs(Math.log(speed)); if (e < err) { err = e; best = r; } }
  return best;
}
/** the clip time for song beat position b (beats), with a seamless loop: overlap X beats cross-faded at the seam */
export function clipPose(c: Clip, b: number, out: Pose, songBeat: number) {
  const r = beatRatio(c, songBeat);
  const X = c.beats >= 8 ? 2 : 1;                 // overlap in clip beats
  const period = c.beats - X;                     // loop period in clip beats (whole beats: accents stay on the grid)
  const cb = ((b * r) % period + period) % period; // clip beat inside the loop
  const t = c.phase + cb * c.beat;
  if (cb < X) {
    sampleFrame(c, t + period * c.beat, out);       // tail of the previous pass...
    sampleFrame(c, t, out, cb / X);                 // ...cross-faded into the head of this one
  } else sampleFrame(c, t, out);
  return r;
}

const MIRROR = (n: string) => n.replace(/^Left/, '__R').replace(/^Right/, 'Left').replace(/^__R/, 'Right').replace(/^LHip/, '__RH').replace(/^RHip/, 'LHip').replace(/^__RH/, 'RHip')
  .replace(/^LThumb/, '__RT').replace(/^RThumb/, 'LThumb').replace(/^__RT/, 'RThumb');
const mirrorMaps = new Map<string, number[]>();
/** mirror a pose across the dancer's own YZ plane (left <-> right, for mirrored duos) */
export function mirrorPose(c: Clip, p: Pose) {
  let m = mirrorMaps.get(c.id);
  if (!m) { m = c.joints.map((n) => { const k = c.joints.indexOf(MIRROR(n)); return k < 0 ? c.joints.indexOf(n) : k; }); mirrorMaps.set(c.id, m); }
  const src = p.q.slice();
  for (let j = 0; j < c.joints.length; j++) { const s = m[j] * 4; p.q[j * 4] = src[s]; p.q[j * 4 + 1] = -src[s + 1]; p.q[j * 4 + 2] = -src[s + 2]; p.q[j * 4 + 3] = src[s + 3]; }
  p.root[0] = -p.root[0];
}
/** movement intensity: scale every joint's rotation away from rest (0.4 .. 1.15) */
export function intensify(c: Clip, p: Pose, k: number) {
  if (Math.abs(k - 1) < 1e-3) return;
  const id = new THREE.Quaternion();
  for (let j = 1; j < c.joints.length; j++) {
    qa.set(p.q[j * 4], p.q[j * 4 + 1], p.q[j * 4 + 2], p.q[j * 4 + 3]);
    const r = id.clone().slerp(qa, k); p.q.set([r.x, r.y, r.z, r.w], j * 4);
  }
}
export function songBeatPos(a: Analysis | null, t: number) { return a ? beatPos(a, t) : t * 2; }
export function songBeatLen(a: Analysis | null) { return a ? 60 / a.bpm : 0.5; }
