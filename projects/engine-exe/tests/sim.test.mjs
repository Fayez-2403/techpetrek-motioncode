// Validation of the built pages in Chromium on the real GPU: node tests/sim.test.mjs
// The film page (deterministic, window.ENGINE.renderAt) checks the posed 3D parts and the dashboard against the
// model; the live page checks the controls, the hand-over from the tour, speed settings and frame rate.
// Writes docs/validation-sim.json and the screenshots in screenshots/.
import fs from 'node:fs';
import path from 'node:path';
import {open} from './browser.mjs';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')), '..');
const DIST = path.join(ROOT, 'teardown-out', 'dist');
const SHOTS = path.join(ROOT, 'screenshots');
fs.mkdirSync(SHOTS, {recursive: true});
const results = [];
const add = (name, pass, detail) => {
  results.push({name, pass, detail});
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}  — ${detail}`);
};

// ------------------------------------------------------------ the film page: parts and dashboard against the model
{
  const {browser, page, errors} = await open(path.join(DIST, 'engine-film.html'), {capture: true});
  await page.waitForFunction(() => window.SIM && window.SIM.ready, null, {timeout: 60000});
  const gpu = await page.evaluate(() => {
    const gl = document.createElement('canvas').getContext('webgl2');
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : 'unknown';
  });
  results.push({name: 'GPU', pass: true, detail: gpu, info: true});
  await page.evaluate(() => (window.__NODRAW = true));
  const r = await page.evaluate(() => {
    const E = window.ENGINE;
    const eng = E.st.eng;
    const D2R = Math.PI / 180;
    const out = {rodTop: 0, rodBot: 0, rodTopEx: 0, rodBotEx: 0, cam: 0, valve: 0, rockerBeta: 0, rollerMin: 1e9, rollerMax: 0, tipAxial: 0, tipSide: 0, dash: [], phase: [], chart: 0, n: 0};
    const W = (k) => eng.anchorAt(k).clone().multiplyScalar(1000);
    const g = {intake: E.geom.valveGeom('intake'), exhaust: E.geom.valveGeom('exhaust')};
    const prof = {intake: E.geom.lobeProfile(g.intake), exhaust: E.geom.lobeProfile(g.exhaust)};
    const rot = (p, a) => [p[0] * Math.cos(a) - p[1] * Math.sin(a), p[0] * Math.sin(a) + p[1] * Math.cos(a)];
    const num = (s) => parseFloat(String(s).replace('−', '-').replace(/[^0-9.+-]/g, ''));
    for (let th = 0; th < 720; th += 1) {
      const st = E.renderAt(th, {mode: 'cutaway', cut: 1});
      out.n++;
      // the rod ends sit on the crank pin and the wrist pin
      out.rodTop = Math.max(out.rodTop, W('rodSmall').distanceTo(W('pistonPin')));
      out.rodBot = Math.max(out.rodBot, W('rodBig').distanceTo(W('crankPin')));
      // the cam turns at half the crank's angle
      const c = eng.groups.crank.rotation.z;
      const k = eng.groups.cam.rotation.z;
      out.cam = Math.max(out.cam, Math.abs(k - c / 2));
      for (const kind of ['intake', 'exhaust']) {
        const G = g[kind];
        const lift = kind === 'intake' ? st.intakeLift : st.exhaustLift;
        // the valve sits lift mm down its own stem from the seat
        const p = eng.valves[kind].v.position;
        const along = (G.S[0] - p.x) * G.a[0] + (G.S[1] - p.y) * G.a[1];
        out.valve = Math.max(out.valve, Math.abs(along - lift));
        // the rocker is turned by the angle that gives exactly this lift
        out.rockerBeta = Math.max(out.rockerBeta, Math.abs(eng.rockers[kind].rk.rotation.z - E.geom.rockerBeta(G, lift)));
        // the roller rides the lobe: its centre is one roller radius from the lobe surface, never inside it
        const rc = E.geom.rollerAt(G, th);
        const q = rot([rc[0] - G.K[0], rc[1] - G.K[1]], (th / 2) * D2R);
        let m = 1e9;
        for (const pt of prof[kind]) m = Math.min(m, Math.hypot(pt[0] - q[0], pt[1] - q[1]));
        out.rollerMin = Math.min(out.rollerMin, m);
        out.rollerMax = Math.max(out.rollerMax, m);
        // the rocker's valve end against the valve tip: along the stem (must be 0) and sideways (the rocker's slide)
        const b = E.geom.rockerBeta(G, lift);
        const r0 = [G.T[0] - G.P[0], G.T[1] - G.P[1]];
        const r1 = rot(r0, b);
        const end = [G.P[0] + r1[0], G.P[1] + r1[1]];
        const tip = [G.T[0] - lift * G.a[0], G.T[1] - lift * G.a[1]];
        const dx = end[0] - tip[0];
        const dy = end[1] - tip[1];
        out.tipAxial = Math.max(out.tipAxial, Math.abs(dx * G.a[0] + dy * G.a[1]));
        out.tipSide = Math.max(out.tipSide, Math.abs(-dx * G.a[1] + dy * G.a[0]));
      }
      // the dashboard reads the same state
      if (th % 7 === 0) {
        const v = [...document.querySelectorAll('[data-p="dash"] .row .v')].map((n) => n.textContent);
        const exp = [st.crankAngle, null, st.pistonPosition, Math.abs(st.pistonVelocity), st.rodAngle, st.camAngle, st.camRpm, st.intakeLift, st.exhaustLift];
        const tol = [0.051, null, 0.0051, 0.0051, 0.051, 0.051, 0.51, 0.0051, 0.0051];
        exp.forEach((e, i) => {
          if (e === null) {
            if (v[i] !== st.phase) out.dash.push(`${th}: stroke ${v[i]} ≠ ${st.phase}`);
            return;
          }
          const got = num(v[i]);
          if (!(Math.abs(got - e) <= tol[i])) out.dash.push(`${th}: row ${i} ${v[i]} vs ${e}`);
        });
        const pr = num(v[v.length - 1]);
        if (Math.abs(pr - st.pressureIndex) > 0.51) out.dash.push(`${th}: pressure ${pr} vs ${st.pressureIndex}`);
        const big = document.querySelector('[data-p="stroke"]').innerText;
        if (!big.toUpperCase().includes(st.phase)) out.phase.push(`${th}: ${st.phase}`);
        const cx = parseFloat(document.querySelector('[data-p="chart"] .cur').getAttribute('x1'));
        const want = 14 + (st.crankAngle / 720) * (234 - 22);
        out.chart = Math.max(out.chart, Math.abs(cx - want));
      }
    }
    // the same with the engine exploded: the mechanism stays connected while the shells move off
    for (let th = 0; th < 720; th += 3) {
      E.renderAt(th, {mode: 'exploded', explode: 1});
      out.rodTopEx = Math.max(out.rodTopEx, W('rodSmall').distanceTo(W('pistonPin')));
      out.rodBotEx = Math.max(out.rodBotEx, W('rodBig').distanceTo(W('crankPin')));
    }
    return out;
  });
  add('Connecting rod stays on the wrist pin (720 poses, 1° steps)', r.rodTop < 1e-6, `max gap ${r.rodTop.toExponential(2)} mm`);
  add('Connecting rod stays on the crank pin (720 poses)', r.rodBot < 1e-6, `max gap ${r.rodBot.toExponential(2)} mm`);
  add('Rod stays connected in EXPLODED mode', r.rodTopEx < 1e-6 && r.rodBotEx < 1e-6, `max gaps ${r.rodTopEx.toExponential(1)} / ${r.rodBotEx.toExponential(1)} mm`);
  add('3D camshaft turns at half the 3D crankshaft angle', r.cam < 1e-9, `max |cam − crank/2| ${r.cam.toExponential(1)} rad`);
  add('3D valves sit exactly at the model lift', r.valve < 1e-9, `max error ${r.valve.toExponential(1)} mm`);
  add('Rockers turned by the angle that gives the model lift', r.rockerBeta < 1e-9, `max error ${r.rockerBeta.toExponential(1)} rad`);
  add('Cam roller rides the generated lobe (no gap, no overlap)', r.rollerMin > 3.85 && r.rollerMax < 4.15, `roller-centre-to-lobe distance ${r.rollerMin.toFixed(3)}–${r.rollerMax.toFixed(3)} mm (roller radius 4.000)`);
  add('Rocker pushes the valve tip along its stem', r.tipAxial < 1e-9, `axial error ${r.tipAxial.toExponential(1)} mm; sideways slide on the tip up to ${r.tipSide.toFixed(2)} mm`);
  add('Dashboard values match engineStateAt() (every 7°)', r.dash.length === 0, r.dash.length ? r.dash.slice(0, 4).join('; ') : '9 calculated rows + pressure index agree to display precision at 103 angles');
  add('Stroke card shows the model phase', r.phase.length === 0, r.phase.length ? r.phase.slice(0, 4).join('; ') : 'label matched at every sampled angle');
  add('720° chart cursor at the crank angle', r.chart < 0.06, `max offset ${r.chart.toFixed(3)} px`);

  // the camera never enters the engine: the whole tour, every preset, and the presets zoomed all the way in
  const cam = await page.evaluate(() => {
    const E = window.ENGINE;
    const cam = E.st.camera;
    const box = E.BOX;
    let worst = 1e9;
    let at = '';
    const check = (label) => {
      const d = box.distanceToPoint(cam.position);
      if (d < worst) {
        worst = d;
        at = label;
      }
    };
    for (let t = 0; t <= 50; t += 0.1) {
      window.SIM.render(t);
      check(`tour t=${t.toFixed(1)}`);
    }
    for (const [v, fn] of Object.entries(E.VIEW_FN)) {
      for (const k of [1, 0.4]) {
        for (const de of [0, -20, 60]) {
          const c = fn(2);
          E.renderAt(200, {cam: v, camera: {...c, d: c.d * k, el: Math.max(-20, Math.min(84, c.el + de))}});
          check(`${v} zoom ${k} el ${de >= 0 ? '+' : ''}${de}`);
        }
      }
    }
    return {worst, at, near: cam.near};
  });
  add('Camera never clips into the engine', cam.worst > cam.near, `closest approach ${(cam.worst * 1000).toFixed(0)} mm from the engine's box (near plane ${cam.near * 1000} mm) at ${cam.at}`);

  // modes: cutaway plane, exploded offsets, x-ray opacity
  const modes = await page.evaluate(() => {
    const E = window.ENGINE;
    const eng = E.st.eng;
    const o = {};
    E.renderAt(100, {mode: 'cutaway', cut: 1});
    o.clip = eng.CLIP.constant;
    E.renderAt(100, {mode: 'exploded', explode: 1});
    o.head = eng.groups.head.position.y;
    o.cover = eng.groups.cover.position.y;
    o.case = eng.groups.caseHalves[1].position.z;
    E.renderAt(100, {mode: 'xray', xray: 1});
    o.xo = eng.H.alu.opacity;
    return o;
  });
  add('Cutaway plane through the cylinder axis', Math.abs(modes.clip) <= 0.0005 + 1e-12, `section plane at z = ${(modes.clip * 1000).toFixed(1)} mm (0.5 mm behind the axis plane, clear of the case joint face)`);
  add('Exploded: head, cover and case move on assembly axes', modes.head > 70 && modes.cover > 190 && modes.case > 60, `head +${modes.head.toFixed(0)} mm (y), cover +${modes.cover.toFixed(0)} mm (y), case halves ±${modes.case.toFixed(0)} mm (z)`);
  add('X-ray: housing see-through', modes.xo < 0.2, `housing opacity ${modes.xo.toFixed(2)}`);

  // screenshots (drawn again from here on)
  await page.evaluate(() => (window.__NODRAW = false));
  const shots = [
    ['01-hero-solid.png', 380, {mode: 'solid', cam: 'iso'}],
    ['02-cutaway-power.png', 372, {mode: 'cutaway', cut: 1, cam: 'bore'}],
    ['03-exploded.png', 100, {mode: 'exploded', explode: 1, cam: 'iso', camera: {tx: 0, ty: 0.16, tz: 0, az: 38, el: 18, d: 1.6, sx: 0, sy: 0}}],
    ['04-xray-valvetrain.png', 610, {mode: 'xray', xray: 1, cam: 'head'}],
    ['05-isolate-piston.png', 200, {mode: 'cutaway', cut: 1, solo: 'piston', fade: 1, cam: 'piston'}],
    ['06-isolate-camshaft.png', 100, {mode: 'xray', xray: 1, solo: 'cam', fade: 1, cam: 'cam'}],
    ['07-learn-intake.png', 95, {mode: 'cutaway', cut: 1, learn: true, learnK: 1, cam: 'teach', slow: true, playback: 0.01}],
    ['08-learn-power.png', 368, {mode: 'cutaway', cut: 1, learn: true, learnK: 1, cam: 'teach', slow: true, playback: 0.01}],
    ['09-front.png', 540, {mode: 'solid', cam: 'front'}],
    ['10-isolate-flywheel.png', 300, {mode: 'solid', solo: 'flywheel', fade: 1, cam: 'flywheel'}],
  ];
  for (const [f, th, o] of shots) {
    await page.evaluate(([th, o]) => window.ENGINE.renderAt(th, o), [th, o]);
    await page.screenshot({path: path.join(SHOTS, f), timeout: 120000});
  }
  add('Film page ran without errors', errors.length === 0, errors.length ? errors.slice(0, 3).join(' | ') : 'no page errors');
  await browser.close();
}

// ------------------------------------------------------------ the live page: tour, hand-over, controls, speed, fps
const still = async (page, file) => {
  await page.evaluate(() => window.LIVE.hold(true));
  await page.waitForTimeout(120);
  await page.screenshot({path: file, timeout: 120000});
  await page.evaluate(() => window.LIVE.hold(false));
};
{
  const {browser, page, errors} = await open(path.join(DIST, 'engine-live.html'));
  await page.waitForFunction(() => window.SIM_SHOWN, null, {timeout: 60000});
  await page.waitForTimeout(1500);
  const s0 = await page.evaluate(() => ({on: window.LIVE.AP.on}));
  add('Live page starts in the auto tour', s0.on, `tour ${s0.on ? 'running' : 'off'}`);
  // frame rate over 4 s of the tour
  const fps = await page.evaluate(
    () =>
      new Promise((res) => {
        let n = 0;
        const t0 = performance.now();
        const f = () => {
          n++;
          if (performance.now() - t0 < 4000) requestAnimationFrame(f);
          else res({fps: (n * 1000) / (performance.now() - t0), tier: window.LIVE.tier});
        };
        requestAnimationFrame(f);
      }),
  );
  results.push({name: 'Live frame rate (headless, this machine)', pass: true, info: true, detail: `${fps.fps.toFixed(1)} fps on quality tier ${fps.tier}`});
  console.log(`INFO  live fps ${fps.fps.toFixed(1)} (tier ${fps.tier})`);
  // a click on CUTAWAY hands control over and switches the mode
  const btnBox = await page.evaluate(() => {
    const r = window.LIVE.ui.btn.m_cutaway.getBoundingClientRect();
    return [r.left + r.width / 2, r.top + r.height / 2];
  });
  await page.mouse.click(btnBox[0], btnBox[1]);
  await page.waitForTimeout(1200);
  const s1 = await page.evaluate(() => ({on: window.LIVE.AP.on, mode: window.LIVE.L.mode, cut: window.LIVE.L.cut, cls: window.LIVE.ui.btn.m_cutaway.className}));
  add('A click hands control to the visitor', !s1.on, `tour ${s1.on ? 'still running' : 'stopped'} after the click`);
  add('CUTAWAY button switches the mode', s1.mode === 'cutaway' && s1.cut > 0.9 && s1.cls.includes('on'), `mode ${s1.mode}, cut ${s1.cut.toFixed(2)}`);
  // speed settings: the crank advances at rpm × playback
  const sp = [];
  for (const rpm of [300, 1400, 6000, 9000]) {
    const d = await page.evaluate(
      (rpm) =>
        new Promise((res) => {
          const L = window.LIVE.L;
          L.paused = false;
          L.slow = false;
          L.playback = 1 / 20;
          L.rpmTarget = rpm;
          L.rpm = rpm;
          setTimeout(() => {
            const t0 = window.LIVE.T;
            const a0 = L.th;
            let acc = 0;
            let prev = a0;
            const f = () => {
              acc += ((L.th - prev + 720) % 720);
              prev = L.th;
              if (window.LIVE.T - t0 < 1.5) requestAnimationFrame(f);
              else res({deg: acc, dt: window.LIVE.T - t0, rpm: L.rpm});
            };
            requestAnimationFrame(f);
          }, 300);
        }),
      rpm,
    );
    const expect = (rpm / 60) * 360 * d.dt * (1 / 20);
    sp.push({rpm, err: Math.abs(d.deg - expect) / expect, deg: d.deg, expect});
  }
  add('Crank advances at rpm × playback at 300 / 1400 / 6000 / 9000 rpm', sp.every((x) => x.err < 0.03), sp.map((x) => `${x.rpm} rpm: ${x.deg.toFixed(0)}° vs ${x.expect.toFixed(0)}° expected`).join('; '));
  // crank slider scrub pauses and sets the angle
  const sc = await page.evaluate(() => {
    const r = window.LIVE.ui.angTrack.getBoundingClientRect();
    return [r.left + r.width * 0.75, r.top + r.height / 2];
  });
  await page.mouse.click(sc[0], sc[1]);
  await page.waitForTimeout(300);
  const s2 = await page.evaluate(() => ({th: window.LIVE.L.th, paused: window.LIVE.L.paused, txt: document.querySelector('[data-p="dash"] .row .v').textContent}));
  add('Crank-angle slider scrubs and pauses', s2.paused && Math.abs(s2.th - 540) < 4, `angle ${s2.th.toFixed(1)}° (slider at 75% → 540°), paused ${s2.paused}, dashboard ${s2.txt}`);
  // stepping
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(200);
  const s3 = await page.evaluate(() => window.LIVE.L.th);
  add('Single step +5°', Math.abs(s3 - s2.th - 5) < 1e-6, `${s2.th.toFixed(1)}° → ${s3.toFixed(1)}°`);
  // isolate the piston from the panel
  const pb = await page.evaluate(() => {
    const r = window.LIVE.ui.btn.p_piston.getBoundingClientRect();
    return [r.left + r.width / 2, r.top + r.height / 2];
  });
  await page.mouse.click(pb[0], pb[1]);
  await page.waitForTimeout(1500);
  const s4 = await page.evaluate(() => ({solo: window.LIVE.L.solo, fade: window.LIVE.L.fade, view: window.LIVE.L.view, info: document.querySelector('[data-p="parts"]').innerText.includes('Seals the cylinder')}));
  add('Isolating a part highlights it, moves the camera, explains it', s4.solo === 'piston' && s4.fade > 0.9 && s4.view === 'piston' && s4.info, `solo ${s4.solo}, fade ${s4.fade.toFixed(2)}, camera ${s4.view}, info card ${s4.info ? 'shown' : 'missing'}`);
  await still(page, path.join(SHOTS, '11-live-isolate-piston.png'));
  // exploded, then the four-stroke lesson
  await page.evaluate(() => window.LIVE.ui.btn.p_all.click());
  await page.evaluate(() => window.LIVE.ui.btn.m_exploded.click());
  await page.waitForTimeout(2500);
  await still(page, path.join(SHOTS, '12-live-exploded.png'));
  await page.evaluate(() => {
    window.LIVE.L.rpmTarget = 1400;
    window.LIVE.L.rpm = 1400;
    window.LIVE.ui.btn.learn.click();
  });
  await page.waitForTimeout(1500);
  await page.evaluate(() => window.LIVE.ui.stRows[2].click());
  await page.waitForTimeout(250);
  const s5 = await page.evaluate(() => ({learn: window.LIVE.L.learn, mode: window.LIVE.L.mode, slow: window.LIVE.L.slow, th: window.LIVE.L.th}));
  add('Learn mode: slow motion, cutaway, stage jump', s5.learn && s5.mode === 'cutaway' && s5.slow && s5.th > 360 && s5.th < 390, `learn ${s5.learn}, mode ${s5.mode}, slow ${s5.slow}, θ ${s5.th.toFixed(0)}° after jumping to 03 POWER`);
  await page.waitForTimeout(500);
  await still(page, path.join(SHOTS, '13-live-learn-power.png'));
  add('Live page ran without errors', errors.length === 0, errors.length ? errors.slice(0, 3).join(' | ') : 'no page errors');
  await browser.close();
}

// ------------------------------------------------------------ phone layout
{
  const {browser, page, errors} = await open(path.join(DIST, 'engine-live.html'), {width: 390, height: 844, dpr: 2});
  await page.waitForFunction(() => window.SIM_SHOWN, null, {timeout: 60000});
  await page.waitForTimeout(2500);
  const m = await page.evaluate(() => {
    const big = document.querySelector('[data-p="stroke"] > div:nth-child(3)');
    const z = parseFloat(document.querySelector('[data-p="stroke"]').style.zoom || '1');
    return {compact: window.LIVE.ui.compact, size: window.LIVE.st.size, zoom: z, scrollW: document.documentElement.scrollWidth};
  });
  add('Phone (390 × 844): compact layout, readable cards, no sideways scroll', m.compact && m.zoom >= 1.3 && m.scrollW <= 390, `view ${m.size.w}×${m.size.h}, cards zoom ×${m.zoom.toFixed(2)} (11.6 px body → ${(11.6 * m.zoom).toFixed(1)} px), page width ${m.scrollW}px`);
  await still(page, path.join(SHOTS, '14-phone-portrait.png'));
  add('Phone page ran without errors', errors.length === 0, errors.length ? errors.slice(0, 3).join(' | ') : 'no page errors');
  await browser.close();
}

const real = results.filter((x) => !x.info);
const pass = real.filter((x) => x.pass).length;
console.log(`\n${pass}/${real.length} passed`);
fs.writeFileSync(path.join(ROOT, 'docs', 'validation-sim.json'), JSON.stringify({results}, null, 1));
process.exit(pass === real.length ? 0 : 1);
