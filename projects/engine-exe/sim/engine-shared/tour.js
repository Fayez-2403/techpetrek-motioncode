// ENGINE.EXE guided tour: a SCRIPT of operator moves (press a button, change the mode, isolate a part, slow down,
// teach the four strokes) and director(t), the whole state of the page at tour time t, as a pure function of t.
// The live page plays it as its auto tour (and hands control over on any input); the film entry records it.
import {CONFIG} from './config.js';
import {mod} from './kin.js';
import {PARTS} from './engine.js';

const smoother = (x) => {
  const u = Math.min(1, Math.max(0, x));
  return u * u * u * (u * (u * 6 - 15) + 10);
};
export const ss = (a, b, t) => smoother((t - a) / (b - a));

// the ten beats of the brief: reveal, start, into the cylinder, piston and rod, slow crank, transparent head,
// cam and valves, the four strokes, the dashboard and chart, back to the assembled engine
export const SCRIPT = [
  {t: 0, cam: 'open', mode: 'solid', label: 'Full engine'},
  {t: 2.6, press: 'play', play: true, label: 'Engine starts'},
  {t: 5.4, press: 'm_cutaway', mode: 'cutaway', cam: 'bore', label: 'Into the cylinder'},
  {t: 8.8, press: 'p_piston', solo: 'piston', cam: 'piston', label: 'Piston'},
  {t: 11.8, press: 'p_rod', solo: 'rod', cam: 'rod', label: 'Connecting rod'},
  {t: 14.8, press: 'slow', slow: true, label: 'Slow motion'},
  {t: 15.7, press: 'p_crank', solo: 'crank', cam: 'crank', label: 'Crankshaft'},
  {t: 19.0, press: 'm_xray', mode: 'xray', solo: null, cam: 'head', label: 'Transparent head'},
  {t: 22.2, press: 'p_cam', solo: 'cam', cam: 'cam', label: 'Camshaft'},
  {t: 25.2, press: 'p_intake', solo: 'intake', cam: 'valves', label: 'Intake valve'},
  {t: 28.1, press: 'p_exhaust', solo: 'exhaust', cam: 'valves', label: 'Exhaust valve'},
  {t: 31.0, press: 'learn', learn: true, solo: null, mode: 'cutaway', cam: 'teach', label: 'The four strokes'},
  {t: 41.2, point: 'chart', focus: ['dash', 'chart'], cam: 'dash', label: 'Dashboard and cycle chart'},
  {t: 45.2, press: 'm_solid', mode: 'solid', learn: false, slow: false, focus: [], cam: 'hero', label: 'Assembled again'},
];
export const DURATION = 50;
export const PART_VIEW = {piston: 'piston', rod: 'rod', crank: 'crank', cam: 'cam', intake: 'valves', exhaust: 'valves', head: 'head', flywheel: 'flywheel'};

// ------------------------------------------------------------ camera views: functions of u, seconds since the view came on
// target (tx, ty, tz) in metres, az from +z toward +x and el in degrees, distance d in metres, sx/sy screen shift px
export const VIEW_FN = {
  open: (u) => {
    const k = smoother(u / 5.2);
    return {tx: 0, ty: 0.12, tz: 0, az: 64 - 26 * k, el: 15 + 7 * k, d: 1.45 - 0.2 * k, sx: 0, sy: 6};
  },
  hero: (u) => ({tx: 0, ty: 0.12, tz: 0, az: 38 + 0.8 * u, el: 22, d: 1.25, sx: 0, sy: 6}),
  iso: (u) => ({tx: 0, ty: 0.12, tz: 0, az: 38 + 0.6 * u, el: 22, d: 1.25, sx: 0, sy: 6}),
  front: () => ({tx: 0, ty: 0.12, tz: 0, az: 90, el: 7, d: 1.2, sx: 0, sy: 6}),
  side: () => ({tx: 0, ty: 0.12, tz: 0, az: 0.01, el: 6, d: 1.2, sx: 0, sy: 6}),
  top: () => ({tx: 0, ty: 0.12, tz: -0.01, az: 30, el: 82, d: 1.1, sx: 0, sy: 0}),
  bore: (u) => ({tx: 0, ty: 0.13, tz: 0, az: 13 + 1.2 * u, el: 6, d: 0.98, sx: 0, sy: 0}),
  piston: (u) => ({tx: 0, ty: 0.135, tz: 0, az: 18 + 1.0 * u, el: 9, d: 0.66, sx: 0, sy: 0}),
  rod: (u) => ({tx: 0, ty: 0.07, tz: 0, az: 15 + 1.0 * u, el: 5, d: 0.68, sx: 0, sy: 0}),
  crank: (u) => ({tx: 0, ty: 0.02, tz: 0, az: 30 + 1.4 * u, el: 14, d: 0.64, sx: 0, sy: 0}),
  head: (u) => ({tx: 0, ty: 0.225, tz: 0, az: 22 + 1.4 * u, el: 14, d: 0.8, sx: 0, sy: 0}),
  cam: (u) => ({tx: 0, ty: 0.258, tz: 0, az: 42 + 1.0 * u, el: 20, d: 0.5, sx: 0, sy: 0}),
  valves: (u) => ({tx: 0, ty: 0.215, tz: 0, az: 6 + 0.8 * u, el: 7, d: 0.6, sx: 0, sy: 0}),
  flywheel: (u) => ({tx: 0, ty: 0.01, tz: -0.06, az: 212 + 1.0 * u, el: 12, d: 0.66, sx: 0, sy: 0}),
  teach: (u) => ({tx: 0, ty: 0.15, tz: 0, az: 10 + 0.5 * u, el: 5, d: 1.06, sx: 0, sy: 0}),
  dash: (u) => ({tx: 0, ty: 0.14, tz: 0, az: 14 + 0.5 * u, el: 8, d: 1.12, sx: 0, sy: 0}),
};
const VIEWS = SCRIPT.filter((e) => e.cam).map((e) => [e.t, e.cam]);
export function blend(a, b, k, backOff = true) {
  const o = {};
  for (const key in b) o[key] = key === 'az' ? a.az + (((b.az - a.az + 540) % 360) - 180) * k : a[key] + (b[key] - a[key]) * k;
  const swing = Math.min(1, Math.abs(((b.az - a.az + 540) % 360) - 180) / 90);
  if (backOff) o.d += Math.max(0, Math.max(a.d, b.d) + 0.35 * swing - o.d) * Math.sin(Math.PI * k);
  return o;
}
/** the tour camera at t: every parameter eased from the last view, the azimuth the short way round */
export const camAt = (t) => {
  let i = 0;
  while (i < VIEWS.length - 1 && VIEWS[i + 1][0] <= t) i++;
  const view = (k) => VIEW_FN[VIEWS[k][1]](t - VIEWS[k][0]);
  const cur = view(i);
  if (i === 0) return cur;
  const k = ss(VIEWS[i][0], VIEWS[i][0] + 1.7, t);
  return k >= 1 ? cur : blend(view(i - 1), cur, k);
};
export const camName = (t) => VIEWS.filter(([t0]) => t0 <= t).pop()[1];
export const camSince = (t) => t - VIEWS.filter(([t0]) => t0 <= t).pop()[0];

// ------------------------------------------------------------ the operator's state at t
const lastOf = (key, t, dflt) => {
  let v = dflt;
  let at = -1;
  let prev = dflt;
  for (const e of SCRIPT) {
    if (e.t > t) break;
    if (key in e) {
      prev = v;
      v = e[key];
      at = e.t;
    }
  }
  return {v, at, prev};
};
const MODE_K = {solid: [0, 0, 0], cutaway: [1, 0, 0], exploded: [0, 0, 1], xray: [0, 1, 0]};
/** a mode's three continuous amounts (cut, xray, explode), eased over 1.1 s from the previous mode */
const modeAt = (t) => {
  const m = lastOf('mode', t, 'solid');
  const k = ss(m.at, m.at + 1.1, t);
  const a = MODE_K[m.prev];
  const b = MODE_K[m.v];
  return {mode: m.v, cut: a[0] + (b[0] - a[0]) * k, xray: a[1] + (b[1] - a[1]) * k, explode: a[2] + (b[2] - a[2]) * k};
};
const soloAt = (t) => {
  const s = lastOf('solo', t, null);
  if (s.v) return {solo: s.v, fade: s.prev ? 1 : ss(s.at + 0.25, s.at + 1.0, t)};
  if (s.prev) return {solo: s.prev, fade: 1 - ss(s.at, s.at + 0.6, t), shown: null};
  return {solo: null, fade: 0};
};
// engine speed and playback
const PLAY_AT = SCRIPT.find((e) => e.play).t;
export const rpmAt = (t) => CONFIG.rpm.idle * ss(PLAY_AT, PLAY_AT + 1.3, t);
const playbackAt = (t) => {
  const s = lastOf('slow', t, false);
  const a = s.prev ? CONFIG.playback.slow : CONFIG.playback.normal;
  const b = s.v ? CONFIG.playback.slow : CONFIG.playback.normal;
  return a + (b - a) * ss(s.at, s.at + 0.7, t);
};
// the crank angle: the picture's rotation integrated once at load (rpm × playback), offset so the four-stroke
// lesson opens at the start of intake
const DT = 1 / 240;
const TH = [];
{
  let th = 0;
  for (let t = 0; t <= DURATION + 1; t += DT) {
    TH.push(th);
    th += ((rpmAt(t + DT / 2) / 60) * 360 * DT) * playbackAt(t + DT / 2);
  }
}
const rawTheta = (t) => {
  const u = Math.max(0, Math.min(TH.length - 2, t / DT));
  const i = Math.floor(u);
  return TH[i] + (TH[i + 1] - TH[i]) * (u - i);
};
const LEARN_AT = SCRIPT.find((e) => e.learn).t;
const TH0 = mod(2 - rawTheta(LEARN_AT), 720);
export const thetaAt = (t) => TH0 + rawTheta(t);

export const HL = {INTAKE: ['intake', 'piston'], COMPRESSION: ['piston'], POWER: ['piston', 'plug', 'crank'], EXHAUST: ['exhaust', 'piston']};

/** the whole page at tour time t (pure) */
export function director(t) {
  const m = modeAt(t);
  const s = soloAt(t);
  const learn = lastOf('learn', t, false);
  const slow = lastOf('slow', t, false);
  const focus = lastOf('focus', t, []);
  const play = t >= PLAY_AT;
  const beat = SCRIPT.filter((e) => e.t <= t).pop();
  return {
    t,
    theta: thetaAt(t),
    rpm: rpmAt(t),
    paused: !play,
    slow: !!slow.v,
    playback: playbackAt(t),
    cam: camName(t),
    camSince: camSince(t),
    camera: camAt(t),
    ...m,
    solo: s.solo,
    fade: s.fade,
    learn: !!learn.v,
    learnK: learn.v ? ss(learn.at, learn.at + 0.8, t) : 1 - ss(learn.at, learn.at + 0.6, t),
    focus: focus.v,
    beat: beat.label,
  };
}

// ------------------------------------------------------------ the operator's pointer (stage layout only)
export function makeCursor(ui) {
  const EV = SCRIPT.filter((e) => e.t > 0 && (e.press || e.point)).map((e) => ({t: e.t, spot: e.press ? ui.spot(e.press) : ui.stageSpot(e.point, 150, 120), click: !!e.press}));
  const REST = [[820, 470], [700, 420], [900, 520], [760, 380]];
  const WP = [[0, 980, 640]];
  EV.forEach((e, i) => {
    WP.push([e.t - 0.5, ...e.spot]);
    WP.push([e.t + 0.25, ...e.spot]);
    WP.push([e.t + 1.6, ...REST[i % REST.length]]);
  });
  WP.sort((a, b) => a[0] - b[0]);
  return (t) => {
    let i = 0;
    while (i < WP.length - 2 && t > WP[i + 1][0]) i++;
    const [t0, x0, y0] = WP[i];
    const [t1, x1, y1] = WP[i + 1];
    const k = ss(t0, t1, t);
    const len = Math.hypot(x1 - x0, y1 - y0);
    const bow = Math.sin(Math.PI * k) * Math.min(24, len * 0.07);
    let press = false;
    let ring = 0;
    let rx = 0;
    let ry = 0;
    for (const e of EV) {
      if (!e.click) continue;
      if (t >= e.t - 0.07 && t < e.t + 0.1) press = true;
      if (t >= e.t && t < e.t + 0.55) {
        ring = 1 - (t - e.t) / 0.55;
        [rx, ry] = e.spot;
      }
    }
    return {x: x0 + (x1 - x0) * k + (len ? (-(y1 - y0) / len) * bow : 0), y: y0 + (y1 - y0) * k + (len ? ((x1 - x0) / len) * bow : 0), press, ring, ringX: rx, ringY: ry};
  };
}

// ------------------------------------------------------------ callouts: which parts get a label, from the page state
const CALLS = {
  solid: [
    ['fins', 'Cooling fins', 'AIR-COOLED'],
    ['plug', 'Spark plug', 'IGNITION'],
    ['exhaustPort', 'Exhaust', 'TO THE HEADER'],
  ],
  cutaway: [
    ['cam', 'Camshaft', 'HALF CRANK SPEED'],
    ['piston', 'Piston', 'SLIDER-CRANK'],
    ['crank', 'Crankshaft', `r = ${CONFIG.stroke / 2} MM`],
  ],
  exploded: [
    ['cover', 'Head cover', 'LIFTS OFF FIRST'],
    ['head', 'Cylinder head', 'VALVES STAY IN IT'],
    ['fins', 'Cylinder barrel', 'SLIDES OFF THE PISTON'],
    ['case', 'Crankcase', 'SPLITS IN HALVES'],
  ],
  xray: [
    ['cam', 'Camshaft', 'HALF CRANK SPEED'],
    ['intake', 'Intake valve', `${CONFIG.valves.intake.lift} MM LIFT`],
    ['chain', 'Timing chain', `${CONFIG.sprocket.crankTeeth} : ${CONFIG.sprocket.camTeeth} SPROCKETS`],
  ],
};
const LEARN_CALLS = {
  INTAKE: [['intake', 'Intake valve', 'OPEN'], ['intakePort', 'Air-fuel in', 'DRAWN BY THE PISTON']],
  COMPRESSION: [['piston', 'Piston', 'RISING · BOTH VALVES SHUT']],
  POWER: [['plugTip', 'Spark', `~${CONFIG.sparkAdvance}° BEFORE TDC`], ['piston', 'Piston', 'PUSHED DOWN']],
  EXHAUST: [['exhaust', 'Exhaust valve', 'OPEN'], ['exhaustPort', 'Burned gas out', 'PUSHED BY THE PISTON']],
};
/** callouts in view pixels: {name, sub, at, label, o}. area = [x0, x1] where labels may sit, vw/vh the view size */
export function callouts(stage, page, phase, vis, area) {
  const list = page.solo && page.fade > 0.5 ? [[page.solo, PARTS[page.solo].name, PARTS[page.solo].sub]] : page.learn ? LEARN_CALLS[phase] : CALLS[page.mode] || [];
  const {w: vw, h: vh} = stage.size;
  const cx = vw / 2;
  const w = 132;
  // labels sit in two clear columns either side of the engine, leaders running in to their points
  const out = list.slice(0, 4).map(([key, name, sub]) => {
    const p = stage.eng.anchorAt(key);
    const at = p && stage.project(p.x, p.y, p.z);
    if (!at) return null;
    const right = at[0] >= cx;
    return {name, sub, at, right, label: [right ? area[1] - w : area[0] + w, at[1] - 34], w, o: vis, accent: !!(page.solo || page.learn)};
  });
  for (const side of [true, false]) {
    const col = out.filter((c) => c && c.right === side).sort((a, b) => a.label[1] - b.label[1]);
    let y = 64;
    for (const c of col) {
      c.label[1] = Math.max(c.label[1], y);
      y = c.label[1] + 46;
    }
    for (const c of col) c.label[1] = Math.min(c.label[1], vh - 70);
  }
  return out;
}
