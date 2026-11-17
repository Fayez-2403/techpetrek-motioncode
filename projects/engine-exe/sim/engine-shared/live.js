// ENGINE.EXE live: the simulator you drive. Start / pause, engine speed, slow motion, crank-angle scrub (slider or
// chart), ±5° steps, reset, orbit and zoom, four camera presets, four modes (solid, cutaway, exploded, x-ray),
// isolation of eight parts, and the four-stroke lesson. Left alone it plays tour.js as an auto tour with the
// operator's cursor; any click, drag, wheel or key hands control over at once, and 25 s of quiet hands it back.
// Desktop: the fixed 1600 x 900 stage scaled to fit. Phones and narrow windows: the view on top (or left) and the
// cards in a scrolling column, zoomed to stay readable.
import {warmComposer} from 'teardown-kit/warm.js';
import {CONFIG} from './config.js';
import {CAMS, createConsole, H, MODES, W} from './console.js';
import {PART_KEYS} from './engine.js';
import {engineStateAt} from './kin.js';
import {renderPage} from './page.js';
import {createStage} from './stage.js';
import {director, DURATION, makeCursor, PART_VIEW, ss, VIEW_FN} from './tour.js';

const IDLE = 25;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const wrap = (d) => ((((d + 180) % 360) + 360) % 360) - 180;
const MODE_K = {solid: [0, 0, 0], cutaway: [1, 0, 0], exploded: [0, 0, 1], xray: [0, 1, 0]};

const CSS = `
html,body{background:#efefec;overflow:hidden;margin:0}
#app{position:absolute!important;inset:auto!important;left:0;top:0;width:${W}px;height:${H}px;transform-origin:0 0}
#app.compact{width:100vw;height:100vh}
#gl{touch-action:none;cursor:grab}
#gl.drag{cursor:grabbing}
`;

export function runLive() {
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);
  const app = document.getElementById('app');
  const ui = createConsole(app);
  const canvas = document.createElement('canvas');
  canvas.id = 'gl';
  ui.view.prepend(canvas);
  const st = createStage({canvas});

  // ------------------------------------------------------------ quality tiers and layout
  const TIERS = [
    {samples: 8, ao: true, shadow: 4096, pr: 2},
    {samples: 4, ao: false, shadow: 2048, pr: 1.5},
    {samples: 2, ao: false, shadow: 1024, pr: 1},
  ];
  const coarse = matchMedia('(pointer: coarse)').matches || Math.min(innerWidth, innerHeight) < 700;
  let tier = coarse ? 2 : 0;
  let scale = 1;
  let layoutNow = '';
  const wantCompact = () => innerWidth < 900 || innerHeight < 560 || innerHeight > innerWidth * 1.05;
  const fit = () => {
    const mode = wantCompact() ? 'compact' : 'stage';
    if (mode !== layoutNow) {
      layoutNow = mode;
      ui.layout(mode);
    }
    const pr = TIERS[tier].pr;
    if (mode === 'stage') {
      scale = Math.min(innerWidth / W, innerHeight / H);
      Object.assign(app.style, {width: `${W}px`, height: `${H}px`, transform: `translate(${(innerWidth - W * scale) / 2}px, ${(innerHeight - H * scale) / 2}px) scale(${scale})`});
      st.resize(W, H, clamp((devicePixelRatio || 1) * scale, 0.75, pr));
    } else {
      scale = 1;
      Object.assign(app.style, {width: `${innerWidth}px`, height: `${innerHeight}px`, transform: 'none'});
      const [vw, vh] = ui.compactSize(innerWidth, innerHeight);
      st.resize(vw, vh, clamp(devicePixelRatio || 1, 0.75, pr));
    }
  };
  const applyTier = () => {
    const {pr, ...q} = TIERS[tier];
    void pr;
    st.setQuality(q);
    fit();
  };
  applyTier();
  addEventListener('resize', fit);

  // ------------------------------------------------------------ state
  let T = 0;
  const L = {
    th: 0,
    rpm: CONFIG.rpm.default,
    rpmTarget: CONFIG.rpm.default,
    paused: false,
    slow: false,
    playback: CONFIG.playback.normal,
    view: 'iso',
    viewAt: 0,
    mode: 'solid',
    cut: 0,
    xray: 0,
    explode: 0,
    solo: null,
    soloShown: null,
    fade: 0,
    learn: false,
    learnK: 0,
    labels: true,
    focus: [],
  };
  const off = {az: 0, el: 0, k: 1};
  const cam = {...VIEW_FN.open(0)};
  let ring = {t: -9, x: 0, y: 0};
  const pulse = (k) => {
    if (ui.compact) return;
    const [x, y] = ui.spot(k);
    ring = {t: T, x, y};
  };

  // ------------------------------------------------------------ the tour
  const AP = {on: true, t0: 0, loop: 0};
  let lastInput = -99;
  let tourCursor = makeCursor(ui);
  const startTour = () => {
    AP.on = true;
    AP.t0 = T;
    AP.loop = 0;
    Object.assign(off, {az: 0, el: 0, k: 1});
    if (!ui.compact) tourCursor = makeCursor(ui);
  };
  // the visitor takes over exactly where the tour is
  const takeOver = () => {
    lastInput = T;
    if (!AP.on) return;
    AP.on = false;
    const d = director((T - AP.t0) % DURATION);
    Object.assign(L, {
      th: d.theta,
      rpm: d.rpm,
      rpmTarget: d.paused ? CONFIG.rpm.default : Math.max(CONFIG.rpm.min, d.rpm),
      paused: d.paused,
      slow: d.slow,
      playback: d.playback,
      view: d.cam === 'open' ? 'iso' : d.cam,
      viewAt: T - d.camSince,
      mode: d.mode,
      cut: d.cut,
      xray: d.xray,
      explode: d.explode,
      solo: d.fade > 0.5 ? d.solo : null,
      soloShown: d.solo,
      fade: d.fade,
      learn: d.learn,
      learnK: d.learnK,
      focus: [],
    });
    if (L.paused) L.rpm = 0;
  };
  ui.tourChip.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    lastInput = T;
    if (AP.on) takeOver();
    else startTour();
  });
  addEventListener('pointerdown', (e) => {
    if (e.target !== ui.tourChip) takeOver();
  });

  // ------------------------------------------------------------ controls
  const setView = (v) => {
    L.view = v;
    L.viewAt = T;
    Object.assign(off, {az: 0, el: 0, k: 1});
  };
  const on = (k, fn) =>
    ui.btn[k].addEventListener('click', () => {
      takeOver();
      pulse(k);
      fn();
    });
  on('play', () => {
    L.paused = !L.paused;
    if (!L.paused && L.rpm < 1) L.rpm = 0;
  });
  on('back', () => {
    L.paused = true;
    L.th -= 5;
  });
  on('fwd', () => {
    L.paused = true;
    L.th += 5;
  });
  on('reset', () => (L.th = 0));
  on('slow', () => (L.slow = !L.slow));
  for (const k of CAMS) on('c_' + k, () => setView(k));
  for (const k of MODES) on('m_' + k, () => (L.mode = k));
  for (const k of PART_KEYS)
    on('p_' + k, () => {
      L.solo = k;
      L.soloShown = k;
      setView(PART_VIEW[k]);
    });
  on('p_all', () => {
    L.solo = null;
    if (Object.values(PART_VIEW).includes(L.view)) setView('iso');
  });
  on('learn', () => {
    L.learn = !L.learn;
    if (L.learn) {
      L.slow = true;
      L.paused = false;
      L.solo = null;
      if (L.mode === 'solid' || L.mode === 'exploded') L.mode = 'cutaway';
      setView('teach');
    }
  });
  on('labels', () => (L.labels = !L.labels));
  // a stage row starts that stroke
  ui.stRows.forEach((r, i) =>
    r.addEventListener('click', () => {
      takeOver();
      L.th = i * 180 + 0.5;
      L.paused = false;
    }),
  );
  // drags: engine speed, crank angle, the chart
  const drag = (node, apply) =>
    node.addEventListener('pointerdown', (e) => {
      takeOver();
      e.preventDefault();
      node.setPointerCapture(e.pointerId);
      const move = (ev) => {
        apply(ev.clientX);
        lastInput = T;
      };
      const up = () => {
        node.removeEventListener('pointermove', move);
        node.removeEventListener('pointerup', up);
      };
      node.addEventListener('pointermove', move);
      node.addEventListener('pointerup', up);
      move(e);
    });
  drag(ui.rpmHit, (x) => (L.rpmTarget = Math.round(CONFIG.rpm.min + ui.sliderK(ui.rpmTrack, x) * (CONFIG.rpm.max - CONFIG.rpm.min))));
  const scrub = (deg) => {
    L.paused = true;
    L.th = deg;
  };
  drag(ui.angHit, (x) => scrub(ui.sliderK(ui.angTrack, x) * 720));
  drag(ui.chart, (x) => scrub(ui.chartAngle(x)));
  addEventListener('keydown', (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const key = e.key.toLowerCase();
    const v = {1: 'iso', 2: 'front', 3: 'side', 4: 'top'}[key];
    takeOver();
    if (v) setView(v);
    else if (key === ' ') L.paused = !L.paused;
    else if (key === 'h') ui.panels.style.visibility = ui.panels.style.visibility === 'hidden' ? '' : 'hidden';
    else if (key === 'r') L.th = 0;
    else if (key === 'arrowleft') {
      L.paused = true;
      L.th -= e.shiftKey ? 1 : 5;
    } else if (key === 'arrowright') {
      L.paused = true;
      L.th += e.shiftKey ? 1 : 5;
    } else if (key === 'arrowup') L.rpmTarget = clamp(L.rpmTarget + 500, CONFIG.rpm.min, CONFIG.rpm.max);
    else if (key === 'arrowdown') L.rpmTarget = clamp(L.rpmTarget - 500, CONFIG.rpm.min, CONFIG.rpm.max);
    else return;
    e.preventDefault();
  });
  // orbit and zoom on the view
  let dragging = null;
  canvas.addEventListener('pointerdown', (e) => {
    dragging = {x: e.clientX, y: e.clientY};
    canvas.setPointerCapture(e.pointerId);
    canvas.classList.add('drag');
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    off.az -= ((e.clientX - dragging.x) / scale) * 0.3;
    off.el = clamp(off.el + ((e.clientY - dragging.y) / scale) * 0.2, -25, 70);
    dragging = {x: e.clientX, y: e.clientY};
    lastInput = T;
  });
  const endDrag = () => {
    dragging = null;
    canvas.classList.remove('drag');
  };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);
  canvas.addEventListener(
    'wheel',
    (e) => {
      e.preventDefault();
      takeOver();
      off.k = clamp(off.k * Math.exp(e.deltaY * 0.0012), 0.4, 2.4);
    },
    {passive: false},
  );

  // ------------------------------------------------------------ the frame
  let last = performance.now();
  const perf = {n: 0, sum: 0, slow: 0, age: 0};
  let page = null;
  const frame = (now) => {
    const dt = Math.min(0.1, Math.max(0, (now - last) / 1000));
    last = now;
    T += dt;
    // drop a quality tier when the frame rate stays low (integrated GPUs)
    if (tier < TIERS.length - 1) {
      perf.age += dt;
      if (perf.age > 0.6) {
        perf.sum += dt;
        perf.n++;
        if (perf.sum >= 0.5 && perf.n >= 6) {
          perf.slow = perf.sum / perf.n > 0.022 ? perf.slow + 1 : 0;
          perf.sum = 0;
          perf.n = 0;
          if (perf.slow >= (perf.age < 6 ? 1 : 2)) {
            tier++;
            applyTier();
            Object.assign(perf, {age: 0, slow: 0});
          }
        }
      }
    }

    if (AP.on) {
      const c = T - AP.t0;
      const loop = Math.floor(c / DURATION);
      const cyc = c - loop * DURATION;
      if (loop > AP.loop) AP.loop = loop;
      const d = director(cyc);
      // a loop restart glides the camera back instead of cutting
      const k = AP.loop > 0 && cyc < 1.2 ? 1 - Math.exp(-dt / 0.3) : 1;
      cam.az += wrap(d.camera.az - cam.az) * k;
      for (const key of ['tx', 'ty', 'tz', 'el', 'd', 'sx', 'sy']) cam[key] += (d.camera[key] - cam[key]) * k;
      const cursor = ui.compact ? null : tourCursor(cyc);
      page = {...d, camera: {...cam}, rpmTarget: d.rpm, labels: L.labels, cursor, badge: d.beat};
      L.th = d.theta;
    } else {
      if (T - lastInput > IDLE) startTour();
      // modes, isolation and the lesson ease toward their targets
      const e = (tau) => 1 - Math.exp(-dt / tau);
      const [c0, x0, e0] = MODE_K[L.mode];
      L.cut += (c0 - L.cut) * e(0.3);
      L.xray += (x0 - L.xray) * e(0.3);
      L.explode += (e0 - L.explode) * e(0.45);
      L.fade += ((L.solo ? 1 : 0) - L.fade) * e(0.22);
      if (!L.solo && L.fade < 0.01) L.soloShown = null;
      L.learnK += ((L.learn ? 1 : 0) - L.learnK) * e(0.25);
      L.playback += ((L.slow ? CONFIG.playback.slow : CONFIG.playback.normal) - L.playback) * e(0.25);
      const target = L.paused ? 0 : L.rpmTarget;
      L.rpm += (target - L.rpm) * e(0.4);
      if (!L.paused) L.th += (L.rpm / 60) * 360 * dt * L.playback;
      L.th = ((L.th % 720) + 720) % 720;
      const tgt = VIEW_FN[L.view](T - L.viewAt);
      tgt.az += off.az;
      tgt.el = clamp(tgt.el + off.el, -20, 84);
      tgt.d *= off.k;
      const k = e(0.4);
      cam.az += wrap(tgt.az - cam.az) * k;
      for (const key of ['tx', 'ty', 'tz', 'el', 'd', 'sx', 'sy']) cam[key] += (tgt[key] - cam[key]) * k;
      const rk = Math.max(0, 1 - (T - ring.t) / 0.55);
      page = {
        theta: L.th,
        rpm: L.paused ? 0 : L.rpm,
        rpmTarget: L.rpmTarget,
        paused: L.paused,
        slow: L.slow,
        playback: L.playback,
        cam: L.view,
        camSince: T - L.viewAt,
        camera: {...cam},
        mode: L.mode,
        cut: L.cut,
        xray: L.xray,
        explode: L.explode,
        solo: L.soloShown,
        fade: L.fade,
        learn: L.learn,
        learnK: L.learnK,
        labels: L.labels,
        focus: [],
        cursor: {x: -99, y: -99, press: false, ring: rk, ringX: ring.x, ringY: ring.y},
        badge: '',
      };
    }
    // when paused the engine speed still reads the set value on the dashboard's cam rpm
    renderPage(st, ui, page);
    if (ui.tourChip.classList.contains('on') !== AP.on || !ui.tourChip.firstChild) {
      ui.tourChip.classList.toggle('on', AP.on);
      ui.tourChip.innerHTML = AP.on ? '<i></i>AUTO TOUR · CLICK ANYWHERE TO TAKE OVER' : '▶ RESUME TOUR';
    }
    if (!window.SIM_SHOWN) {
      window.SIM_SHOWN = true;
      dispatchEvent(new Event('simframe'));
    }
    if (!held) requestAnimationFrame(frame);
  };
  let held = false;
  // every shader compiles at once before the first frame (kit/warm.js), the isolation twins included
  const lights = st.scene;
  warmComposer(st.renderer, st.composer, st.scene, st.camera, [{materials: st.eng.twins, target: st.composer.renderTarget1, lights}]).then(() => requestAnimationFrame(frame));

  // a small API for the tests and the console
  window.LIVE = {
    st,
    ui,
    L,
    AP,
    takeOver,
    startTour,
    /** stop drawing (screenshots of a still canvas are fast), then carry on */
    hold(on) {
      const was = held;
      held = on;
      if (was && !on) {
        last = performance.now();
        requestAnimationFrame(frame);
      }
    },
    engineStateAt,
    get page() {
      return page;
    },
    get tier() {
      return tier;
    },
    get T() {
      return T;
    },
    ss,
  };
}
