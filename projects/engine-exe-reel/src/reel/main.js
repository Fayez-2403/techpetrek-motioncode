// ENGINE.EXE reel: 9:16 (540 x 960 layout, 1080 x 1920 at dpr 2), 60 fps. The simulator's own engine, stage and
// model (../../../engine-exe/sim/engine-shared), driven by director.js on the measured voice. render(t) is pure.
// Every number on screen is engineStateAt() at that frame.
import {runSim} from 'teardown-kit/runtime.js';
import {CONFIG} from '../../../engine-exe/sim/engine-shared/config.js';
import {engineStateAt, exhaustLift, intakeLift, sliderCrank, STAGES} from '../../../engine-exe/sim/engine-shared/kin.js';
import {createStage} from '../../../engine-exe/sim/engine-shared/stage.js';
import {director, DURATION, HL, K, sec, ss, T} from './director.js';

const W = 540;
const H = 960;
const D2R = Math.PI / 180;
const C = {ink: '#16181b', mute: '#7f8388', accent: '#c8692e', blue: '#3f86da', exh: '#8a817a', fire: '#e8742a', paper: '#f3f3f1'};
const CSS = `
#app{position:absolute!important;inset:auto!important;left:0;top:0;width:${W}px;height:${H}px;overflow:hidden;background:#efefec;font-family:Inter,system-ui,sans-serif;color:${C.ink};-webkit-font-smoothing:antialiased;font-variant-numeric:tabular-nums}
#app canvas{position:absolute;left:0;top:0;width:${W}px!important;height:${H}px!important}
.o{position:absolute;pointer-events:none;white-space:nowrap}
.mono{font-family:'JetBrains Mono',monospace}
.cap{position:absolute;left:24px;right:24px;top:672px;display:flex;justify-content:center}
.hd{text-shadow:0 0 14px #efefec,0 0 6px #efefec,0 0 2px #efefec}
.cap div{background:rgba(22,24,27,.9);color:#fff;font-weight:750;font-size:21px;line-height:1.28;padding:7px 12px 8px;text-align:center;max-width:470px;white-space:normal}
.cap b{color:#f0a06a;font-weight:800}
`;
const el = (h) => {
  const d = document.createElement('div');
  d.innerHTML = h.trim();
  return d.firstElementChild;
};
const fx = (v, n = 1) => (Math.abs(v) < 0.5 * 10 ** -n ? 0 : v).toFixed(n);
const sgn = (v, n = 1) => `${v >= 0 ? '+' : '−'}${Math.abs(v).toFixed(n)}`;
// entrances decelerate from oversize, exits accelerate out (motionmaxxing), as functions of t
const easeOut = (x) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 4);
const easeIn = (x) => Math.pow(Math.min(1, Math.max(0, x)), 3);
const show = (t, a, b, inD = 0.28, outD = 0.18) => (t < a || t > b ? 0 : Math.min(easeOut((t - a) / inD), 1 - easeIn((t - (b - outD)) / outD)));

export const DEFAULTS = {duration: DURATION, fps: 60, theme: 'light', hud: {enabled: false, title: 'ENGINE.EXE reel', subtitle: ''}, director: {enabled: false}, watermark: ''};

runSim(DEFAULTS, async ({canvas, capture}) => {
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);
  const app = document.getElementById('app');
  app.prepend(canvas);
  const st = createStage({canvas});
  const resize = () => st.resize(W, H, capture ? devicePixelRatio || 1 : Math.min(devicePixelRatio || 1, 2));
  resize();
  const add = (h) => {
    const n = el(h);
    app.appendChild(n);
    return n;
  };

  // ------------------------------------------------------------ the frame's layers
  const flash = add(`<div class="o" style="inset:0;background:#fff;opacity:0"></div>`);
  add(`<div class="o" style="left:22px;top:22px"><div style="width:30px;height:3px;background:${C.accent}"></div><div style="font-size:19px;font-weight:800;letter-spacing:-.3px;margin-top:7px">ENGINE<span style="color:${C.accent}">.</span>EXE</div></div>`);
  add(`<div class="o" style="right:22px;top:30px;text-align:right;font-size:8.6px;font-weight:650;letter-spacing:1.3px;color:${C.mute};line-height:1.5">GENERIC 148 CC SINGLE<br>ILLUSTRATIVE MODEL</div>`);
  const chip = add(`<div class="o mono" style="left:22px;top:62px;font-size:11.5px;font-weight:600;color:#3a3d42"></div>`);
  // headline area (y 92-250): one card per beat
  const hook = add(`<div class="o hd" style="left:0;right:0;top:96px;text-align:center"><div class="mono n" style="font-size:96px;font-weight:700;letter-spacing:-5px;color:${C.accent};line-height:1"></div><div style="font-size:14px;font-weight:750;letter-spacing:2.4px;margin-top:6px">TURNS EVERY SECOND</div><div class="mono s" style="font-size:11.5px;color:${C.mute};margin-top:5px">${CONFIG.rpm.default} RPM ÷ 60</div></div>`);
  const made = add(`<div class="o hd" style="left:0;right:0;top:96px;text-align:center"><div style="font-size:15px;font-weight:750;letter-spacing:3.2px">MADE BY</div><div class="c" style="font-size:76px;font-weight:850;letter-spacing:-2.5px;color:${C.accent};line-height:1.02">Claude</div><div class="mono" style="font-size:12px;font-weight:600;color:#3a3d42;margin-top:4px">0 HAND-ANIMATED PARTS · 1 PHYSICS MODEL</div></div>`);
  const slow = add(`<div class="o hd" style="left:0;right:0;top:92px;text-align:center"><div class="mono" style="font-size:92px;font-weight:700;letter-spacing:-5px;line-height:1">1/20</div><div style="font-size:14px;font-weight:750;letter-spacing:2.4px;margin-top:6px">PICTURE SPEED</div></div>`);
  const ang = add(`<div class="o hd" style="left:0;right:0;top:94px;text-align:center"><div style="font-size:14px;font-weight:750;letter-spacing:2.4px">CRANK ANGLE</div><div class="mono v" style="font-size:74px;font-weight:700;letter-spacing:-4px;color:${C.accent};line-height:1.05"></div><div style="font-size:12.5px;font-weight:650;color:${C.mute};letter-spacing:1.2px">MOVES EVERY PART ON SCREEN</div></div>`);
  const rodc = add(`<div class="o hd" style="left:0;right:0;top:94px;text-align:center"><div class="k" style="font-size:14px;font-weight:750;letter-spacing:2.4px"></div><div class="mono v" style="font-size:70px;font-weight:700;letter-spacing:-3px;color:${C.accent};line-height:1.08"></div><div class="mono" style="font-size:12.5px;color:#3a3d42">x = r·cosθ + √(l² − r²·sin²θ)</div><div class="mono" style="font-size:10.5px;color:${C.mute};margin-top:3px">r ${CONFIG.stroke / 2} mm · l ${CONFIG.rod} mm</div></div>`);
  const camc = add(`<div class="o hd" style="left:0;right:0;top:88px;text-align:center"><svg width="330" height="132" viewBox="0 0 330 132"></svg><div style="font-size:14px;font-weight:750;letter-spacing:2.2px;margin-top:2px">CAM = CRANK ÷ 2</div></div>`);
  const camSvg = camc.querySelector('svg');
  const strokeC = add(`<div class="o hd" style="left:0;right:0;top:92px;text-align:center"><div class="n" style="font-size:88px;font-weight:800;letter-spacing:-4px;color:${C.accent};line-height:.95"></div><div class="k" style="font-size:34px;font-weight:800;letter-spacing:-.4px;margin-top:4px"></div><div class="mono s" style="font-size:12.5px;color:#3a3d42;margin-top:6px"></div></div>`);
  const dash = add(`<div class="o" style="left:50%;top:92px;width:300px;margin-left:-150px;background:rgba(250,250,248,.94);border:1px solid #e1e1dc;padding:10px 14px 8px"></div>`);
  const anyC = add(`<div class="o hd" style="left:0;right:0;top:96px;text-align:center"><div style="font-size:15px;font-weight:750;letter-spacing:3.2px">ANY MACHINE</div><div class="m" style="display:flex;justify-content:center;gap:8px;margin-top:12px"></div></div>`);
  const anyM = anyC.querySelector('.m');
  const MACH = ['Gearbox', 'Pump', 'Landing gear'];
  const ctaC = add(`<div class="o hd" style="left:0;right:0;top:96px;text-align:center"><div style="font-size:15px;font-weight:750;letter-spacing:3px">COMMENT</div><div style="display:inline-block;margin-top:8px;background:${C.accent};color:#fff;font-size:52px;font-weight:850;letter-spacing:1px;padding:4px 18px 6px">ENGINE</div><div style="font-size:12.5px;font-weight:650;color:${C.mute};letter-spacing:1.4px;margin-top:9px">GET A SIMULATOR LIKE THIS</div></div>`);
  const credit = add(`<div class="o" style="left:0;right:0;top:820px;text-align:center;font-size:11px;font-weight:650;letter-spacing:1.2px;color:#55585d">BUILT WITH CLAUDE CODE + THE TEARDOWN SKILL</div>`);
  // the live 720° strip during the lesson
  const strip = add(`<svg class="o" style="left:24px;top:740px" width="492" height="64"></svg>`);
  {
    const X = (d) => 6 + (d / 720) * 480;
    const Y = (v) => 50 - v * 40;
    let h = `<rect x="0" y="0" width="492" height="64" fill="rgba(250,250,248,.92)" stroke="#e1e1dc"/>`;
    for (let i = 0; i < 4; i++) h += `<rect class="b" data-i="${i}" x="${X(i * 180)}" y="6" width="${X(180) - X(0)}" height="46" fill="transparent"/><text x="${X(i * 180 + 90)}" y="61" font-size="7.4" text-anchor="middle" fill="${C.mute}" font-weight="700" letter-spacing="1">${STAGES[i].n} ${STAGES[i].key}</text>`;
    const curve = (fn, col, w) => {
      let p = '';
      for (let d = 0; d <= 720; d += 4) p += `${d ? 'L' : 'M'}${X(d).toFixed(1)} ${Y(fn(d)).toFixed(1)}`;
      return `<path d="${p}" fill="none" stroke="${col}" stroke-width="${w}"/>`;
    };
    h += curve((d) => 1 - sliderCrank(d).disp / CONFIG.stroke, C.ink, 1.3) + curve((d) => intakeLift(d) / 7 * 0.7, C.blue, 1.6) + curve((d) => exhaustLift(d) / 7 * 0.7, C.exh, 1.6);
    h += `<line class="cur" y1="4" y2="52" stroke="${C.accent}" stroke-width="2"/>`;
    strip.innerHTML = h;
  }
  const stripCur = strip.querySelector('.cur');
  const stripBands = [...strip.querySelectorAll('.b')];
  // one callout: a leader from a part to its label
  const callSvg = add(`<svg class="o" style="left:0;top:0" width="${W}" height="${H}"></svg>`);
  const callL = add(`<div class="o" style="font-size:15px;font-weight:750"><div class="a"></div><div class="b" style="font-size:9px;font-weight:650;letter-spacing:1.3px;color:${C.mute};margin-top:2px"></div></div>`);
  const cap = add(`<div class="cap"><div></div></div>`);
  const capBox = cap.firstChild;

  const CALL = {
    angle: ['crankPin', 'Crank pin', `r = ${CONFIG.stroke / 2} MM`],
    rodA: ['piston', 'Piston', 'STRAIGHT UP AND DOWN'],
    rodB: ['rod', 'Connecting rod', 'STROKE INTO TURN'],
    cam: ['cam', 'Camshaft', '14 : 28 CHAIN'],
    s1: ['intake', 'Intake valve', 'OPEN'],
    s2: ['piston', 'Piston', 'RISING'],
    s3: ['plugTip', 'Spark', `${360 - CONFIG.sparkAdvance}°`],
    s4: ['exhaust', 'Exhaust valve', 'OPEN'],
  };

  // ------------------------------------------------------------ render(t)
  const render = (t) => {
    const d = director(t);
    const s = engineStateAt(d.theta, d.rpm);
    const k = d.solo ? d.fade : 0;
    const arrows = d.solo === 'intake' || d.solo === 'exhaust' ? 1 : 1 - k;
    const gas = ['piston', 'intake', 'exhaust'].includes(d.solo) || !d.solo;
    st.frame(s, {...d.camera, az: d.camera.az * D2R, el: d.camera.el * D2R}, {cut: d.cut, xray: d.xray, explode: d.explode, solo: d.solo, fade: d.fade, hl: d.learnK > 0.01 ? HL[s.phase] : [], hlK: d.learnK, arrows, charge: gas ? 1 : 1 - 0.8 * k});

    // a soft impact flash on every cut (>= 0.18 s, <= 10 % opacity: no strobe)
    const lastCut = [0, ...T.sections.map((x) => x.t0)].filter((c) => c <= t).pop();
    flash.style.opacity = (0.1 * Math.max(0, 1 - (t - lastCut) / 0.22) * (t > 0.1 ? 1 : 0)).toFixed(3);
    const pt = d.playback >= 0.999 ? 'REAL TIME' : `1/${Math.round(1 / d.playback)} SPEED`;
    chip.textContent = `θ ${(s.crankAngle).toFixed(0).padStart(3, ' ')}° · ${s.phase} · ${d.rpm} RPM · PICTURE ${pt}`;

    // the headline cards
    const S = (id) => sec(id);
    const o = (n, v) => {
      n.style.opacity = v.toFixed(3);
      n.style.transform = `translateY(${((1 - v) * -10).toFixed(1)}px) scale(${(1 + (1 - v) * 0.18).toFixed(3)})`;
    };
    // hook: the counter rolls to 23.3 as "23" is spoken
    // hook: MADE BY Claude lands at once, the name lights as it is spoken
    o(made, show(t, 0.05, S('slow').t0 + 0.05, 0.3));
    made.querySelector('.c').style.color = t >= K.claude - 0.05 ? C.accent : C.ink;
    // then the counter rolls to 23.3 as "23" is spoken
    o(hook, show(t, S('slow').t0 + 0.05, K.slow - 0.12));
    const roll = ss(S('slow').t0 + 0.1, K.n23 + 0.1, t);
    hook.querySelector('.n').textContent = ((CONFIG.rpm.default / 60) * roll).toFixed(1);
    o(slow, show(t, K.slow, S('angle').t0));
    o(ang, show(t, S('angle').t0 + 0.15, S('rod').t0));
    ang.querySelector('.v').textContent = `θ ${s.crankAngle360.toFixed(0)}°`;
    o(rodc, show(t, S('rod').t0 + 0.1, S('cam').t0));
    const rodPart = t >= K.rod;
    rodc.querySelector('.k').textContent = rodPart ? 'ROD ANGLE' : 'PISTON FROM TDC';
    rodc.querySelector('.v').textContent = rodPart ? `${sgn(s.rodAngle)}°` : `${fx(s.pistonPosition)} mm`;
    o(camc, show(t, S('cam').t0 + 0.12, S('s1').t0));
    {
      // two dials: the crank needle at θ, the cam needle at θ/2
      const dial = (cx, a, label, val) => {
        const r = 46;
        const x = cx + Math.sin(a * D2R) * r;
        const y = 58 - Math.cos(a * D2R) * r;
        return `<circle cx="${cx}" cy="58" r="${r}" fill="rgba(250,250,248,.9)" stroke="#d9d9d4" stroke-width="1.4"/><line x1="${cx}" y1="58" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="${C.accent}" stroke-width="3" stroke-linecap="round"/><circle cx="${cx}" cy="58" r="4" fill="${C.ink}"/><text x="${cx}" y="122" text-anchor="middle" font-size="10.5" font-weight="750" letter-spacing="1.6" fill="${C.ink}">${label}</text><text x="${cx}" y="132" text-anchor="middle" font-size="9.5" font-family="JetBrains Mono" fill="${C.mute}">${val}</text>`;
      };
      camSvg.innerHTML = dial(85, s.crankAngle, 'CRANK', `${s.crankAngle.toFixed(0)}° / 720`) + dial(245, s.camAngle, 'CAM', `${s.camAngle.toFixed(0)}° / 360`);
    }
    // the four strokes, each on its spoken number
    const strokeKeys = [K.s1, K.s2, K.s3, K.s4, S('live').t0];
    let si = -1;
    for (let i = 0; i < 4; i++) if (t >= strokeKeys[i] - 0.05 && t < strokeKeys[i + 1]) si = i;
    const sv = si < 0 ? 0 : show(t, strokeKeys[si] - 0.05, strokeKeys[si + 1], 0.22, si === 3 ? 0.3 : 0.12);
    o(strokeC, sv);
    if (si >= 0) {
      strokeC.querySelector('.n').textContent = STAGES[si].n;
      strokeC.querySelector('.k').textContent = STAGES[si].key.charAt(0) + STAGES[si].key.slice(1).toLowerCase();
      const sub = [`INTAKE LIFT ${fx(s.intakeLift, 2)} mm`, `PISTON ${fx(s.pistonPosition)} mm FROM TDC`, s.ignition.spark || s.crankAngle < 362 ? `SPARK AT ${360 - CONFIG.sparkAdvance}° · θ ${s.crankAngle.toFixed(0)}°` : `PISTON ${fx(s.pistonPosition)} mm · BURN*`, `EXHAUST LIFT ${fx(s.exhaustLift, 2)} mm`][si];
      strokeC.querySelector('.s').textContent = sub;
    }
    const lv = show(t, K.live - 0.6, S('cta').t0 + 0.2);
    o(dash, lv);
    {
      const rows = [
        ['Crank angle', `${s.crankAngle.toFixed(1)}°`],
        ['Stroke', s.phase],
        ['Piston from TDC', `${fx(s.pistonPosition, 2)} mm`],
        ['Rod angle', `${sgn(s.rodAngle)}°`],
        ['Camshaft', `${s.camAngle.toFixed(1)}°`],
        ['Intake lift', `${fx(s.intakeLift, 2)} mm`],
        ['Exhaust lift', `${fx(s.exhaustLift, 2)} mm`],
      ];
      dash.innerHTML =
        `<div style="display:flex;justify-content:space-between;font-size:9.6px;font-weight:750;letter-spacing:1.5px;margin-bottom:4px"><span>LIVE STATE</span><span style="border:1px solid ${C.ink};padding:1px 4px;font-size:8px">CALCULATED</span></div>` +
        rows
          .map(([a, b], i) => {
            const v = ss(K.live - 0.45 + i * 0.09, K.live - 0.2 + i * 0.09, t);
            return `<div style="display:flex;justify-content:space-between;height:21px;align-items:center;opacity:${v.toFixed(2)};transform:translateX(${((1 - v) * 14).toFixed(1)}px)"><span style="font-size:10px;font-weight:650;letter-spacing:1.1px;color:${C.mute};text-transform:uppercase">${a}</span><span class="mono" style="font-size:14.5px;font-weight:650">${b}</span></div>`;
          })
          .join('');
    }
    o(anyC, show(t, S('cta').t0 + 0.25, K.engine - 0.3));
    anyM.innerHTML = MACH.map((m, i) => {
      const at = i === 0 ? K.machines : K.machines + 0.55 * i + 0.1;
      const v = ss(at - 0.05, at + 0.25, t);
      return `<span style="display:inline-block;border:1.5px solid ${C.ink};background:rgba(250,250,248,.92);font-size:18px;font-weight:750;padding:5px 10px;opacity:${v.toFixed(2)};transform:translateY(${((1 - v) * -8).toFixed(1)}px) scale(${(1 + (1 - v) * 0.25).toFixed(3)})">${m}</span>`;
    }).join('');
    o(ctaC, show(t, K.engine - 0.35, DURATION + 1, 0.3));
    credit.style.opacity = show(t, S('cta').t0 + 0.6, DURATION + 1, 0.5).toFixed(3);
    // the strip
    const stv = show(t, S('s1').t0 + 0.2, S('live').t0 + 0.1);
    strip.style.opacity = stv.toFixed(3);
    const cx = (6 + (s.crankAngle / 720) * 480).toFixed(1);
    stripCur.setAttribute('x1', cx);
    stripCur.setAttribute('x2', cx);
    stripBands.forEach((b, i) => b.setAttribute('fill', i === s.phaseIndex ? (i === 2 ? 'rgba(232,116,42,.13)' : 'rgba(22,24,27,.06)') : 'transparent'));

    // the callout for this beat
    const key = d.section === 'rod' ? (t >= K.rod ? 'rodB' : 'rodA') : d.section;
    const c = CALL[key];
    let cv = 0;
    if (c) {
      const p = st.eng.anchorAt(c[0]);
      const at = p && st.project(p.x, p.y, p.z);
      cv = ss(d.since + 0, 0, 0) || ss(0.45, 0.85, d.since);
      if (at && cv > 0.01) {
        const right = at[0] < W * 0.52;
        const lx = right ? 352 : 188;
        const ly = Math.max(300, Math.min(560, at[1] - 40));
        callSvg.innerHTML = `<circle cx="${at[0].toFixed(1)}" cy="${at[1].toFixed(1)}" r="3.4" fill="${C.accent}" opacity="${cv.toFixed(2)}"/><polyline points="${at[0].toFixed(1)},${at[1].toFixed(1)} ${lx},${ly + 22} ${right ? lx + 166 : lx - 166},${ly + 22}" fill="none" stroke="#6e7277" stroke-width="1" opacity="${cv.toFixed(2)}"/>`;
        callL.style.opacity = cv.toFixed(2);
        callL.style.left = `${right ? lx : lx - 166}px`;
        callL.style.top = `${ly - 2}px`;
        callL.style.width = '166px';
        callL.style.textAlign = right ? 'left' : 'right';
        callL.querySelector('.a').textContent = c[1];
        callL.querySelector('.b').textContent = c[2];
      } else cv = 0;
    }
    if (!cv) {
      callSvg.innerHTML = '';
      callL.style.opacity = '0';
    }

    // word captions: the current line, the spoken word lit
    const line = T.lines.find((l) => t >= l.start - 0.08 && t <= l.end + 0.35);
    if (line) {
      // long lines split in two halves at the comma/full stop nearest the middle, showing the half being spoken
      const ws = line.words;
      let cut = ws.length;
      if (ws.length > 7) {
        let best = Math.floor(ws.length / 2);
        let bd = 99;
        ws.forEach((w, i) => {
          if (/[,.:?]$/.test(w.w) && i < ws.length - 1 && Math.abs(i + 1 - ws.length / 2) < bd) {
            bd = Math.abs(i + 1 - ws.length / 2);
            best = i + 1;
          }
        });
        cut = best;
      }
      const half = cut < ws.length && t >= ws[cut].t0 - 0.05 ? ws.slice(cut) : ws.slice(0, cut);
      capBox.innerHTML = half.map((w) => (t >= w.t0 - 0.03 && t < w.t1 + 0.06 ? `<b>${w.w}</b>` : w.w)).join(' ');
      cap.style.opacity = '1';
    } else cap.style.opacity = '0';
    return {};
  };
  window.REEL = {st, director, render};
  return {resize, render};
});
