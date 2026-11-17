// One frame of the page, the same for the live simulator and the recorded tour: the engine state from the model,
// the engine posed and drawn, then the console and the callouts updated from the same state.
import {CAMS} from './console.js';
import {engineStateAt} from './kin.js';
import {callouts, HL, ss} from './tour.js';

const D2R = Math.PI / 180;
export const playText = (p) => (p >= 0.999 ? 'REAL TIME' : `1/${Math.round(1 / p)} SPEED`);

/**
 * page: {theta, rpm, rpmTarget, paused, slow, playback, camera (degrees), cam, camSince, mode, cut, xray, explode,
 *        solo, fade, learn, learnK, labels, focus, cursor, badge}
 */
export function renderPage(stage, ui, page) {
  const st = engineStateAt(page.theta, page.rpm);
  // exploded parts need more room: the camera rises and pulls back with the explode amount
  const ex = page.explode || 0;
  const cam = {...page.camera, ty: page.camera.ty + 0.1 * ex, d: page.camera.d * (1 + 0.42 * ex)};
  // isolating a part that has nothing to do with the gas puts the arrows away and dims the charge
  const k = page.solo ? page.fade : 0;
  const gasPart = ['piston', 'intake', 'exhaust', 'head'].includes(page.solo);
  const arrows = page.solo === 'intake' || page.solo === 'exhaust' ? 1 : 1 - k;
  stage.frame(
    st,
    {...cam, az: cam.az * D2R, el: cam.el * D2R},
    {cut: page.cut, xray: page.xray, explode: page.explode, solo: page.solo, fade: page.fade, hl: page.learn || page.learnK > 0.01 ? HL[st.phase] : [], hlK: page.learnK, arrows, charge: gasPart ? 1 : 1 - 0.8 * k, noDraw: !!window.__NODRAW},
  );
  const vis = page.labels ? ss(0.9, 1.6, page.camSince) : 0;
  const area = ui.compact ? [10, stage.size.w - 10] : [330, 1290];
  const calls = callouts(stage, page, st.phase, vis, area).filter(Boolean);
  const camKey = page.cam === 'hero' || page.cam === 'open' ? 'iso' : page.cam;
  ui.update({
    st,
    rpm: page.rpm,
    rpmTarget: page.rpmTarget ?? page.rpm,
    playText: playText(page.playback),
    paused: page.paused,
    slow: page.slow,
    cam: CAMS.includes(camKey) ? camKey : null,
    mode: page.mode,
    solo: page.fade > 0.5 ? page.solo : null,
    learn: page.learn,
    labels: page.labels,
    callouts: calls,
    cursor: page.cursor || {x: -99, y: -99, press: false, ring: 0, ringX: 0, ringY: 0},
    focus: page.focus,
    badge: page.badge,
  });
  return st;
}
