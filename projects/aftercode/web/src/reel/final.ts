// The AFTERCODE final reel, "Build your cast": captured from this app with ORIGINAL characters only (src/dance/cast.ts; no
// real person's face or likeness). The six battle characters wear AI-generated photo faces of fictional people (PHOTO below).
// The timeline is built from measured downbeats in prepare(): every segment is a whole
// number of bars of its own bundled CC BY song (Kevin MacLeod), so each cut and song switch lands on a downbeat, and the
// dancers move to the song you hear (engine.manual = that song's clock). seek(r) is pure: the same r gives the same frame.
//   ?reel=final  -> 3D shots, UI hidden (scripts/capture.ts)      ?uireel=final -> the builder UI shot (scripts/capture_ui_final.ts)
import * as THREE from 'three';
import { engine } from '../audio/engine';
import { beatPos, type Analysis } from '../audio/analysis';
import { LIBRARY } from '../audio/library';
import { CAST, SQUAD, type CastId } from '../dance/cast';
import type { Performer } from '../dance/crew';
import type { Look } from '../dance/avatar';
import { reelCam } from '../scene/Director';
import { getState, setState, type AppState } from '../state';
import { detect, makeFace, toCanvas, type FaceRecord } from '../face/faces';

export const FPS = 60;
/** song segments, in order. at = a song second near the wanted downbeat (the first downbeat at or after it is used) */
const SEGS = [
  { id: 'A', track: 'realizer', at: 60.96, bars: 9 },        // hook, look morph, builder UI, round 1: CEO diss battle
  { id: 'B', track: 'smooth-move', at: 32, bars: 3 },         // round 2: leaders (its loudest section, 32-40 s)
  { id: 'C', track: 'disco-medusae', at: 25.35, bars: 3 },    // round 3: neta vs neta (its loudest section, 25.4-33.7 s)
  { id: 'D', track: 'electro-cabello', at: 82.57, bars: 3 },  // filmi duo (its loudest section, 82-90 s)
  { id: 'E', track: 'monkeys', at: 87.0, bars: 4 },           // sitcom squad (its loudest stretch, 87-100 s)
  { id: 'F', track: 'realizer', at: 60.96, bars: 3 },         // the whole cast + end card (3 bars: room for the CTA line)
] as const;
type SegId = (typeof SEGS)[number]['id'];
export interface Seg { id: SegId; track: string; ss: number; se: number; r0: number; r1: number; beats: number[]; downbeats: number[]; bpm: number }

const AN = new Map<string, Analysis>();
let PLAN: Seg[] = [];
const seg = (id: SegId) => PLAN.find((s) => s.id === id)!;
/** reel time of beat k of a segment (k counted from its first downbeat; measured beats, extrapolated past the end) */
const RB = (id: SegId, k: number) => { const s = seg(id), B = s.beats, i = Math.floor(k), f = k - i; const b0 = B[Math.min(i, B.length - 1)] ?? s.r1; const b1 = B[i + 1] ?? b0 + 60 / s.bpm; return i < B.length ? b0 + (b1 - b0) * f : s.r1 + (k - B.length) * (60 / s.bpm); };
const segAt = (r: number) => PLAN.find((s) => r >= s.r0 && r < s.r1) ?? PLAN[PLAN.length - 1];
const songT = (r: number) => { const s = segAt(r); return s.ss + (r - s.r0); };
const sbeat = (id: SegId, r: number) => beatPos(AN.get(seg(id).track)!, seg(id).ss + (r - seg(id).r0));   // song beat at reel time r

type Cam = (r: number, u: number) => { P: THREE.Vector3; T: THREE.Vector3; fov: number };
/** layer: '' = the main picture; 'B' = a second picture of the same moment (the hook's lower split-screen half) */
interface Shot { id: string; r0: number; r1: number; layer?: string; state: () => Partial<AppState>; step?: (k: number) => Partial<AppState>; stepAt?: (r: number) => number; cam: Cam }
const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const ease = (u: number) => (u < 0.5 ? 4 * u * u * u : 1 - (-2 * u + 2) ** 3 / 2);
const orbit = (a: number, rad: number, y: number, ty = 1.0, fov = 38, cx = 0, cz = 0) => ({ P: V(cx + Math.sin(a) * rad, y, cz + Math.cos(a) * rad), T: V(cx, ty, cz), fov });
/** photo faces for the battle characters: fictional people made with Nano Banana 2 via Open Higgsfield AI / kie.ai
 *  (aftercode-final/assets/generated/faces, prompts in the .json sidecars), served from /_reel (never deployed) */
const PHOTO: CastId[] = ['founder', 'boss', 'president', 'chancellor', 'neta1', 'neta2'];
const FACES = new Map<string, FaceRecord>();
async function loadFaces() {
  for (const id of PHOTO) {
    if (FACES.has(id)) continue;
    const img = new Image(); img.src = `/_reel/faces/${id}.jpg`; await img.decode();
    const c = toCanvas(img), d = await detect(c);
    if (d.length) FACES.set(id, { ...makeFace(c, d[0], CAST[id].name), id: `face-${id}` });
  }
  setState({ faces: [...FACES.values()] });
}
/** a cast member; its photo face (and that photo's skin tone on neck and hands) when it has one */
const who = (id: CastId, i: number, look?: Partial<Look>, photo = true): Performer => {
  const f = photo ? FACES.get(id) : undefined;
  return { id: `${id}${i}`, faceId: f?.id ?? null, name: CAST[id].name, style: CAST[id].style, role: i ? 'support' : 'lead', look: { ...CAST[id].look, ...(f ? { skin: f.skin } : {}), ...look } };
};
/** a two-dancer battle: the rapper switches every `turn` beats, counted from the segment's first downbeat; faces front, in place */
const battle = (id: SegId, world: AppState['world'], a: CastId, b: CastId, turn = 4): Partial<AppState> => ({ world, officeIntro: false, duoMode: 'battle', formation: 'line', faceFront: true, turnBeats: turn, turnAt: sbeat(id, seg(id).r0), performers: [who(a, 0), who(b, 1)] });
const X = 0.575;   // formation 'line' with two dancers: x = -X (dancer 0), +X (dancer 1)
/** close on one dancer (side -1: dancer 0, +1: dancer 1): the face sits in the frame's middle band (it survives a half-height crop) */
const closeOn = (side: number, u: number, h = 1.36) => ({ P: V(side * X + side * 0.22 - 0.3 * side * u, h + 0.04, 1.8 - 0.15 * u), T: V(side * X, h - 0.05, 0), fov: 30 });
// the morph shot: one character, a new look on every beat (the builder's point, shown in the world)
const MORPH: Partial<Look>[] = [
  { outfit: 'suit', hair: 'quiff', facialHair: 'stubble', color: '#59606e', accessory: 'none' },
  { outfit: 'kurta', hair: 'side', facialHair: 'mustache', color: '#8e1f2f', accessory: 'none' },
  { outfit: 'leather', hair: 'quiff', facialHair: 'goatee', color: '', accessory: 'shades' },
  { outfit: 'hoodie', hair: 'curly', facialHair: 'none', color: '', accessory: 'headphones' },
];

let SHOTS: Shot[] = [];
function buildShots(): Shot[] {
  const A = (k: number) => RB('A', k), D = (k: number) => RB('D', k), E = (k: number) => RB('E', k), F = (k: number) => RB('F', k);
  const two = (id: SegId, k0: number, world: AppState['world'], a: CastId, b: CastId, cam: Cam, name: string): Shot => ({ id: name, r0: RB(id, k0), r1: RB(id, k0 + 4), state: () => battle(id, world, a, b), cam });
  const duo = (): Partial<AppState> => ({ world: 'bloom', officeIntro: false, duoMode: 'bollywood', formation: 'line', faceFront: true, performers: [who('hero', 0), who('heroine', 1)] });
  const squad = (formation: AppState['formation']): Partial<AppState> => ({ world: 'dream', officeIntro: false, crewMode: 'chorus', formation, faceFront: true, performers: SQUAD.map((id, i) => who(id, i)) });
  const list: Shot[] = [
    // HOOK (bar 1): the CEO face-off as a split screen, founder on top, boss below; each raps for two beats
    { id: 'hookA', r0: A(0), r1: A(4), state: () => battle('A', 'city', 'founder', 'boss', 2), cam: (_r, u) => closeOn(-1, u) },
    { id: 'hookB', r0: A(0), r1: A(4), layer: 'B', state: () => battle('A', 'city', 'founder', 'boss', 2), cam: (_r, u) => closeOn(1, u) },
    // TWIST (bar 2): same character, a new look on every beat
    { id: 'morph', r0: A(4), r1: A(8), state: () => ({ world: 'stage', officeIntro: false, formation: 'line', faceFront: true, performers: [who('boss', 0, MORPH[0], false)] }),   // drawn face: the beard changes every beat
      stepAt: (r) => Math.max(0, Math.min(3, Math.floor(sbeat('A', r) - sbeat('A', A(4)) + 1e-3))), step: (k) => ({ performers: [who('boss', 0, MORPH[k], false)] }),
      cam: (_r, u) => orbit(-0.22 + 0.44 * u, 2.35 - 0.15 * u, 1.36, 1.1, 36) },
    // (A 8-20: the builder UI, captured separately by scripts/capture_ui_final.ts)
    // ROUND 1: CEO diss battle, four bars; the rapper switches every bar (bar 1: the boss)
    two('A', 20, 'city', 'founder', 'boss', (_r, u) => closeOn(1, u), 'ceo1'),
    two('A', 24, 'city', 'founder', 'boss', (_r, u) => closeOn(-1, u), 'ceo2'),
    two('A', 28, 'city', 'founder', 'boss', (_r, u) => ({ P: V(0.8 - 1.6 * u, 0.85, 4.3), T: V(0, 1.0, 0), fov: 40 }), 'ceo3'),
    two('A', 32, 'city', 'founder', 'boss', (_r, u) => orbit(0.5 - 0.9 * ease(u), 4.1 + 0.4 * u, 1.45, 0.95, 42), 'ceo4'),
    // ROUND 2: leaders, in the neon tunnel (dark suits read against it)
    two('B', 0, 'tunnel', 'president', 'chancellor', (_r, u) => ({ P: V(0, 0.65 + 0.4 * u, 4.9 - 0.4 * u), T: V(0, 1.1, 0), fov: 42 }), 'lead1'),
    two('B', 4, 'tunnel', 'president', 'chancellor', (_r, u) => closeOn(1, u), 'lead2'),
    two('B', 8, 'tunnel', 'president', 'chancellor', (_r, u) => closeOn(-1, u), 'lead3'),
    // ROUND 3: neta vs neta, on the rally stage
    two('C', 0, 'stage', 'neta1', 'neta2', (_r, u) => orbit(-0.5 + 0.4 * u, 4.5, 1.05, 1.1, 42), 'neta1'),
    two('C', 4, 'stage', 'neta1', 'neta2', (_r, u) => closeOn(1, u), 'neta2'),
    two('C', 8, 'stage', 'neta1', 'neta2', (_r, u) => closeOn(-1, u), 'neta3'),
    // FILMI DUO (bloom): inside the inner flower ring (r < 3.6) so the petals never block; wide lenses for two in portrait
    { id: 'filmi1', r0: D(0), r1: D(4), state: duo, cam: (_r, u) => orbit(-0.35 + 0.45 * u, 3.2, 2.3, 0.95, 50) },
    { id: 'filmi2', r0: D(4), r1: D(8), state: duo, cam: (_r, u) => ({ P: V(-0.25 + 0.5 * u, 1.9, 2.7), T: V(0, 1.12, 0), fov: 50 }) },
    { id: 'filmi3', r0: D(8), r1: D(12), state: duo, cam: (_r, u) => orbit(0.3 - 0.6 * u, 3.2, 2.0 + 1.0 * ease(u), 1.0, 50) },
    // SITCOM SQUAD (dream): six friends, one routine; two rows of three, then a pyramid on bar 3 (switched on the cut)
    { id: 'squad1', r0: E(0), r1: E(4), state: () => squad('rows'), cam: (_r, u) => ({ P: V(0, 1.25, 6.4 - 0.5 * u), T: V(0, 0.85, -0.5), fov: 54 }) },   // rows of three span +-1.5 m: a wide lens in portrait
    { id: 'squad2', r0: E(4), r1: E(8), state: () => squad('rows'), cam: (_r, u) => ({ P: V(-1.7 + 3.4 * u, 1.3, 2.9), T: V(-1.5 + 3.0 * u, 1.1, 0.35), fov: 42 }) },
    { id: 'squad3', r0: E(8), r1: E(12), state: () => squad('triangle'), cam: (_r, u) => ({ P: V(0.3, 0.5, 6.0 - 0.5 * u), T: V(0, 1.25, -0.5), fov: 52 }) },
    { id: 'squad4', r0: E(12), r1: E(16), state: () => squad('triangle'), cam: (_r, u) => ({ P: V(0, 1.3 + 2.2 * ease(u), 6.4 + 0.8 * u), T: V(0, 0.9, -0.5), fov: 50 }) },
    // FINALE: the whole cast, a 14-dancer pyramid (the end card rides on it in the edit)
    { id: 'cast', r0: F(0), r1: F(12), state: () => ({ world: 'stage', officeIntro: false, crewMode: 'chorus', formation: 'triangle', faceFront: true, quality: 'medium',
        performers: (['boss', 'founder', 'heroine', 'neta2', 'hero', 'president', 'neta1', 'chancellor', ...SQUAD] as CastId[]).map((id, i) => ({ ...who(id, i), style: 'disco' as const })) }),
      cam: (_r, u) => ({ P: V(0, 1.6 + 0.7 * ease(u), 8.2 + 1.0 * ease(u)), T: V(0, 0.85, -1.6), fov: 50 }) },
  ];
  return list;
}

/** load every song once (engine cache, so seek() can switch tracks synchronously), then lay the segments end to end */
export async function prepare() {
  for (const id of new Set(SEGS.map((s) => s.track))) { const t = LIBRARY.find((x) => x.id === id)!; AN.set(id, await engine.load(id, t.file!, t.bpm)); }
  let r = 0; PLAN = [];
  for (const g of SEGS) {
    const a = AN.get(g.track)!, D = a.downbeats;
    const at = g.at >= 0 ? g.at : (a.sections.find((s) => s.drop)?.t0 ?? D[8]);
    let k = D.findIndex((d) => d >= at - 0.05); if (k < 0) k = 0;
    const ss = D[k], bar = (D[Math.min(D.length - 1, k + 1)] - D[k]) || (240 / a.bpm);
    const se = D[k + g.bars] ?? ss + g.bars * bar;
    const beats = a.beats.filter((b) => b >= ss - 0.02 && b < se - 0.02).map((b) => +(r + b - ss).toFixed(4));
    const downbeats = D.filter((d) => d >= ss - 0.02 && d < se - 0.02).map((d) => +(r + d - ss).toFixed(4));
    PLAN.push({ id: g.id, track: g.track, ss: +ss.toFixed(4), se: +se.toFixed(4), r0: +r.toFixed(4), r1: +(r + se - ss).toFixed(4), beats, downbeats, bpm: +a.bpm.toFixed(2) });
    r += se - ss;
  }
  await loadFaces();
  SHOTS = buildShots();
  return PLAN;
}

let cur: Shot | null = null, curStep = -1;
/** put the app at reel time r: that shot's state (and per-beat step), that segment's song clock, the scripted camera */
export function seek(r: number, layer = '') {
  if (!PLAN.length) throw new Error('reel: call prepare() first');
  const L = SHOTS.filter((s) => (s.layer ?? '') === layer), sh = L.find((s) => r >= s.r0 && r < s.r1) ?? L[L.length - 1];
  if (sh !== cur) { setState({ view: 'dance', camera: 'director', quality: 'high', faceFront: false, turnBeats: 8, ...sh.state() }); cur = sh; curStep = -1; }
  if (sh.step && sh.stepAt) { const k = sh.stepAt(r); if (k !== curStep) { setState(sh.step(k)); curStep = k; } }
  const s = segAt(r);
  if (engine.trackId !== s.track) void engine.load(s.track, '');   // cache hit: synchronous
  engine.manual = songT(r);
  const u = Math.min(1, Math.max(0, (r - sh.r0) / (sh.r1 - sh.r0)));
  reelCam.fn = (cam) => { const c = sh.cam(r, u); cam.position.copy(c.P); cam.lookAt(c.T); cam.fov = c.fov; cam.updateProjectionMatrix(); };
  return sh.id;
}

// ---- the builder UI shot (phone layout, ?uireel=final): build "Boardroom Boss" one click per beat, then he dances
interface UIStep { tab: 'look' | 'face' | 'moves'; target: string; look?: Partial<Look>; style?: string; name?: string }
const UI_STEPS: UIStep[] = [
  { tab: 'look', target: '.chips button[title="Sharp suit + tie"]', look: { outfit: 'suit' } },
  { tab: 'look', target: '.swatches .sw[aria-label="#59606e"]', look: { color: '#59606e' } },
  { tab: 'face', target: '.chips button[title="Quiff"]', look: { hair: 'quiff' } },
  { tab: 'face', target: '.chips button[title="Stubble"]', look: { facialHair: 'stubble' } },
  { tab: 'look', target: '.swatches .sw[aria-label="#c98a64"]', look: { skin: '#c98a64' } },
  { tab: 'moves', target: '.chips button[title="Popping"]', style: 'popping' },
  { tab: 'moves', target: '.b-name', name: 'Boardroom Boss' },
];
export const UI_BEATS = { from: 8, to: 20 };   // segment A beats
const uiBase = (): Performer => ({ id: 'ui0', faceId: null, name: '', style: 'hiphop', role: 'lead', look: { ...CAST.boss.look, outfit: 'street', color: '', hair: 'short', facialHair: 'none', skin: '#eabf9c' } });
let uiStarted = false, uiLast = '', uiTab = '';
const uiPos: { x: number; y: number }[] = [];
const target = (k: number) => { const el = document.querySelector<HTMLElement>(UI_STEPS[k].target); if (!el) return null; const rc = el.getBoundingClientRect(); return { el, x: rc.left + rc.width * 0.5, y: rc.top + rc.height * 0.55 }; };
/** the builder shot at reel time r: one change per beat (the chip lights as it lands), the tab switches as the cursor sets off,
 *  the cursor glides to the next target over the second half of the beat and taps on the beat; the name types itself out.
 *  Captured in time order (scripts/capture_ui_final.ts), so the glide starts from where the last tap landed. */
export function seekUI(r: number) {
  if (!PLAN.length) throw new Error('reel: call prepare() first');
  const N = UI_STEPS.length, b = sbeat('A', r) - sbeat('A', RB('A', UI_BEATS.from)), k = Math.max(-1, Math.min(N - 1, Math.floor(b + 1e-3))), g = b - Math.floor(b);
  if (!uiStarted) { setState({ view: 'dance', camera: 'director', world: 'stage', officeIntro: false, formation: 'line', faceFront: true, performers: [uiBase()], selected: 0 }); uiStarted = true; }
  const p = uiBase();
  for (let j = 0; j <= k; j++) { const st = UI_STEPS[j]; Object.assign(p.look, st.look ?? {}); if (st.style) p.style = st.style as Performer['style']; if (st.name) p.name = j === k ? st.name.slice(0, Math.ceil(st.name.length * Math.min(1, g * 2.2))) : st.name; }
  const key = JSON.stringify(p); if (key !== uiLast) { setState({ performers: [p] }); uiLast = key; }
  const heading = g >= 0.5 ? Math.min(N - 1, k + 1) : Math.max(0, k);   // the step the cursor is on / heading to
  if (UI_STEPS[heading].tab !== uiTab) { (window as unknown as { __ac: { setBtab: (t: string) => void } }).__ac.setBtab(UI_STEPS[heading].tab); uiTab = UI_STEPS[heading].tab; }
  const s = segAt(r); if (engine.trackId !== s.track) void engine.load(s.track, '');
  engine.manual = songT(r);
  reelCam.fn = (cam) => { cam.position.set(0.0, 1.3, 2.45); cam.lookAt(0, 1.02, 0); cam.fov = 36; cam.updateProjectionMatrix(); };
  // keep the heading target in view inside the panel
  const body = document.querySelector<HTMLElement>('.rightp .panel-body'), tgt = target(heading);
  if (tgt && body) { const top = tgt.el.getBoundingClientRect().top - body.getBoundingClientRect().top + body.scrollTop; if (top < body.scrollTop + 30 || top > body.scrollTop + body.clientHeight - 50) body.scrollTop = Math.max(0, top - body.clientHeight * 0.4); }
  const at = target(heading); if (!at) return k;
  let x = at.x, y = at.y;
  if (g < 0.5 && k >= 0) uiPos[k] = { x, y };
  else if (g >= 0.5 && k >= 0 && uiPos[k]) { const e = ease((g - 0.5) / 0.5); x = uiPos[k].x + (at.x - uiPos[k].x) * e; y = uiPos[k].y + (at.y - uiPos[k].y) * e; }
  let cur = document.getElementById('reel-cursor');
  if (!cur) { cur = document.createElement('div'); cur.id = 'reel-cursor'; document.body.appendChild(cur); }
  const tap = b >= 0 && g < 0.16 ? 0.8 + g * 1.25 : 1, ring = b >= 0 && g < 0.3 ? 0.5 * (1 - g / 0.3) : 0;   // press on the beat, a ring that fades
  cur.style.cssText = `position:fixed;left:${x}px;top:${y}px;width:24px;height:24px;margin:-12px 0 0 -12px;border-radius:50%;background:rgba(255,255,255,0.95);box-shadow:0 0 0 ${4 + 14 * (1 - ring * 2)}px rgba(59,240,255,${ring.toFixed(3)}),0 4px 14px rgba(0,0,0,0.55);transform:scale(${tap.toFixed(3)});z-index:99;pointer-events:none;`;
  return k;
}
/** a cast portrait (assets/cast): one character, facing front on the stage, a medium close-up at song second t */
export function portrait(id: CastId, t = 70.1) {
  if (!PLAN.length) throw new Error('reel: call prepare() first');
  setState({ view: 'dance', camera: 'director', quality: 'high', world: 'stage', officeIntro: false, formation: 'line', faceFront: true, turnBeats: 8, performers: [who(id, 0)] }); cur = null;
  if (engine.trackId !== 'realizer') void engine.load('realizer', '');
  engine.manual = t;
  reelCam.fn = (cam) => { cam.position.set(0.15, 1.3, 2.3); cam.lookAt(0, 1.08, 0); cam.fov = 36; cam.updateProjectionMatrix(); };
}
export const finalApi = { portrait, castIds: Object.keys(CAST), seek, seekUI, prepare, get plan() { return PLAN; }, get shots() { return SHOTS.map((s) => ({ id: s.id, r0: s.r0, r1: s.r1, layer: s.layer ?? '' })); }, uiShot: () => ({ r0: RB('A', UI_BEATS.from), r1: RB('A', UI_BEATS.to) }), getState };
