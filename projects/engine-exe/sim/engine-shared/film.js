// ENGINE.EXE film: the guided tour recorded frame by frame. render(t) is a pure function of t (tour.js director).
// Also the test bed: window.ENGINE.renderAt(theta, page) draws any crank angle in any mode for the browser tests.
import {runSim} from 'teardown-kit/runtime.js';
import {createConsole, H, W} from './console.js';
import * as KIN from './kin.js';
import {engineStateAt} from './kin.js';
import {chainPath, lobeProfile, rockerBeta, rollerAt, valveGeom} from './engine.js';
import {BOX} from './stage.js';
import {renderPage} from './page.js';
import {createStage} from './stage.js';
import {DURATION, director, makeCursor, VIEW_FN} from './tour.js';

export const DEFAULTS = {duration: DURATION, fps: 60, theme: 'light', hud: {enabled: false, title: 'ENGINE.EXE', subtitle: ''}, director: {enabled: false}, watermark: ''};

export const run = () =>
  runSim(DEFAULTS, async ({canvas, capture}) => {
    const app = document.getElementById('app');
    Object.assign(app.style, {inset: 'auto', left: '0', top: '0', width: `${W}px`, height: `${H}px`, background: '#efefec'});
    const ui = createConsole(app);
    ui.view.prepend(canvas); // under the overlay
    ui.layout('stage');
    ui.tourChip.style.display = 'none';
    const st = createStage({canvas});
    const resize = () => st.resize(W, H, capture ? devicePixelRatio || 1 : Math.min(devicePixelRatio || 1, 2));
    resize();
    const cursor = makeCursor(ui);
    const tourPage = (t) => {
      const d = director(t);
      return {...d, camera: d.camera, rpmTarget: d.rpm, labels: true, cursor: cursor(t), badge: d.beat};
    };
    window.ENGINE = {
      st,
      ui,
      engineStateAt,
      director,
      KIN,
      BOX,
      VIEW_FN,
      geom: {valveGeom, lobeProfile, rollerAt, rockerBeta, chainPath},
      /** draw crank angle theta with page overrides ({mode, cut, xray, explode, solo, fade, cam, ...}) */
      renderAt(theta, o = {}) {
        const cam = o.cam || 'iso';
        const page = {theta, rpm: 1400, playback: 1 / 20, paused: true, slow: false, cam, camSince: 9, camera: VIEW_FN[cam](0), mode: 'solid', cut: 0, xray: 0, explode: 0, solo: null, fade: 0, learn: false, learnK: 0, labels: true, focus: [], ...o};
        return renderPage(st, ui, page);
      },
    };
    return {
      resize,
      render(t) {
        renderPage(st, ui, tourPage(t));
        return {};
      },
    };
  });
