// ENGINE.EXE console: the panels round the engine. Every number shown here is read from engineStateAt() (kin.js);
// the illustrative values (ignition, pressure index) are labelled as such. Each panel is a fixed-size card with its
// own absolute layout, so the same cards can sit on the 1600 x 900 stage (desktop) or stack in a scrolling column
// under the 3D view (phones and narrow windows, zoomed to stay readable).
import {CONFIG} from './config.js';
import {DISPLACEMENT_CC, exhaustLift, intakeLift, pressureIndex, sliderCrank, STAGES} from './kin.js';
import {PART_KEYS, PARTS} from './engine.js';

export const C = {ink: '#17191c', mute: '#878a8f', faint: '#c9cac6', line: '#e1e1dc', panel: 'rgba(250,250,248,.95)', accent: '#c8692e', accentSoft: 'rgba(200,105,46,.12)', blue: '#3f86da', exh: '#8a817a', grey: '#5d6670', fire: '#e8742a'};
export const CAMS = ['iso', 'front', 'side', 'top'];
export const MODES = ['solid', 'cutaway', 'exploded', 'xray'];
const MODE_LABEL = {solid: 'SOLID', cutaway: 'CUTAWAY', exploded: 'EXPLODED', xray: 'X-RAY'};
export const W = 1600;
export const H = 900;
export const PANEL = {title: [250, 136], stroke: [250, 196], dash: [250, 270], transport: [250, 196], chart: [250, 232], parts: [250, 318], view: [250, 150]};
// stage layout (1600 x 900): left and right columns, the engine between them
export const STAGE_POS = {title: [32, 24], stroke: [32, 172], dash: [32, 382], transport: [32, 666], chart: [1318, 24], parts: [1318, 270], view: [1318, 602]};
// compact layout: the order the cards stack under the view
export const COMPACT_ORDER = ['stroke', 'transport', 'dash', 'view', 'parts', 'chart'];

const CSS = `
#app{font-family:Inter,system-ui,sans-serif;color:${C.ink};-webkit-font-smoothing:antialiased;font-variant-numeric:tabular-nums}
#app *{box-sizing:border-box}
.view{position:absolute;left:0;top:0;width:${W}px;height:${H}px;overflow:hidden}
.view canvas{position:absolute;left:0;top:0;width:100%!important;height:100%!important;display:block}
.panels{position:absolute;inset:0;pointer-events:none}
.pn{position:absolute;pointer-events:auto}
.pn.card{background:${C.panel};border:1px solid ${C.line};box-shadow:0 1px 2px rgba(20,22,26,.04);transition:box-shadow .3s,border-color .3s}
.pn.card.focus{border-color:${C.accent};box-shadow:0 0 0 3px ${C.accentSoft}}
.pn > *{position:absolute}
.cp{font-size:9.6px;font-weight:600;letter-spacing:1.4px;text-transform:uppercase;white-space:nowrap}
.mu{color:${C.mute}}
.mono{font-family:'JetBrains Mono',monospace}
.tb{height:22px;padding:0 6px;display:flex;align-items:center;justify-content:center;font-size:9.4px;font-weight:600;letter-spacing:.9px;text-transform:uppercase;border:1px solid ${C.line};background:#fff;color:${C.ink};white-space:nowrap;cursor:pointer;user-select:none}
.tb:hover{filter:brightness(.96)}
.tb.on{background:${C.ink};color:#fff;border-color:${C.ink}}
.tb.acc{background:${C.accent};color:#fff;border-color:${C.accent}}
.tag{font-size:8px;font-weight:700;letter-spacing:1.2px;padding:2px 5px;border:1px solid currentColor;line-height:1}
.row{left:12px;right:12px;height:17px;display:flex;align-items:center;justify-content:space-between}
.row .k{font-size:9.2px;font-weight:600;letter-spacing:1.1px;color:${C.mute};text-transform:uppercase}
.row .v{font-family:'JetBrains Mono',monospace;font-size:12.4px;font-weight:600}
.trk{height:3px;background:#e3e3df}
.knob{width:10px;height:14px;margin-left:-5px;background:${C.accent};top:-5.5px;position:absolute}
.stg{left:12px;right:12px;height:21px;display:flex;align-items:center;gap:9px;cursor:pointer}
.stg i{display:block;width:28px;height:2px;background:${C.line}}
.stg b{font-size:9.6px;font-weight:600;letter-spacing:1.4px;color:${C.mute}}
.stg.on i{background:${C.accent}}
.stg.on b{color:${C.ink}}
.call{position:absolute;white-space:nowrap;pointer-events:none}
.call b{display:block;font-size:12px;font-weight:650;letter-spacing:.1px}
.call span{display:block;font-size:8.6px;font-weight:600;letter-spacing:1.3px;color:${C.mute};text-transform:uppercase;margin-top:2px}
.cur{position:absolute;left:0;top:0;z-index:50;filter:drop-shadow(0 1px 2px rgba(0,0,0,.3));pointer-events:none}
.ring{position:absolute;width:34px;height:34px;margin:-17px 0 0 -17px;border-radius:50%;border:1.5px solid ${C.accent};opacity:0;z-index:49;pointer-events:none}
.tourchip{position:absolute;left:50%;top:22px;transform:translateX(-50%);display:flex;align-items:center;gap:7px;height:23px;padding:0 12px;border:1px solid ${C.line};background:rgba(255,255,255,.95);color:${C.ink};font:600 9px Inter,sans-serif;letter-spacing:1.3px;white-space:nowrap;cursor:pointer;z-index:40}
.tourchip i{display:block;width:6px;height:6px;border-radius:50%;background:${C.accent}}
.tourchip.on i{animation:blink 1.2s steps(2) infinite}
@keyframes blink{50%{opacity:.15}}
.hint{position:absolute;left:0;right:0;bottom:12px;text-align:center;font-size:9px;font-weight:600;letter-spacing:1.3px;color:#b4b5b1;text-transform:uppercase;pointer-events:none}
.badge{position:absolute;left:50%;transform:translateX(-50%);top:56px;font-size:9px;font-weight:700;letter-spacing:1.4px;color:${C.mute};text-transform:uppercase;pointer-events:none;white-space:nowrap}
#app.compact .pn.title-pn{display:none}
#app.compact .tourchip{top:auto;bottom:10px}
#app.compact .badge{top:auto;bottom:42px}
.ctitle{display:none}
#app.compact .ctitle{display:block;position:absolute;left:12px;top:10px;pointer-events:none}
`;
const el = (h) => {
  const d = document.createElement('div');
  d.innerHTML = h.trim();
  return d.firstElementChild;
};
const fx = (v, n = 2) => (Math.abs(v) < 0.005 ? 0 : v).toFixed(n);
const sign = (v, n = 1) => `${v >= 0 ? '+' : '−'}${Math.abs(v).toFixed(n)}`;

export function createConsole(app) {
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);
  const view = el(`<div class="view"></div>`);
  app.appendChild(view);
  const panels = el(`<div class="panels"></div>`);
  app.appendChild(panels);
  const P = {};
  const card = (key, cls = 'card') => {
    const [w, h] = PANEL[key];
    const n = el(`<div class="pn ${cls}" data-p="${key}" style="width:${w}px;height:${h}px"></div>`);
    panels.appendChild(n);
    P[key] = n;
    return n;
  };
  const put = (parent, h) => {
    const n = el(h);
    parent.appendChild(n);
    return n;
  };
  const btn = {};

  // ------------------------------------------------------------ title and rev counter
  const tp = card('title', 'title-pn');
  put(tp, `<div style="left:2px;top:2px;width:40px;height:3px;background:${C.accent}"></div>`);
  put(tp, `<div style="left:0;top:12px;font-size:30px;font-weight:800;letter-spacing:-.6px;line-height:1">ENGINE<span style="color:${C.accent}">.</span>EXE</div>`);
  put(tp, `<div style="left:1px;top:48px;font-size:13px;font-weight:500;color:#45484d">${CONFIG.tagline}</div>`);
  put(tp, `<div class="cp mu" style="left:1px;top:70px;font-size:8.8px;font-weight:600;line-height:1.55">GENERIC EDUCATIONAL ENGINE · ${DISPLACEMENT_CC.toFixed(0)} CC<br>1-CYL · 4-STROKE · SOHC · 2-VALVE · AIR-COOLED</div>`);
  const rpmBig = put(tp, `<div class="mono" style="left:0;top:100px;font-size:30px;font-weight:700;letter-spacing:-1px;color:${C.accent};line-height:1"></div>`);
  const rpmSub = put(tp, `<div class="cp" style="left:104px;top:104px;font-size:9px;line-height:1.45;font-weight:600"></div>`);
  // compact layout: the title rides on the view instead
  const ctitle = put(view, `<div class="ctitle"><div style="font-size:19px;font-weight:800;letter-spacing:-.3px">ENGINE<span style="color:${C.accent}">.</span>EXE</div><div style="font-size:10.5px;color:#55585d;margin-top:1px">${CONFIG.tagline}</div></div>`);
  const ctRpm = put(view, `<div class="ctitle mono" style="left:auto!important;right:12px;text-align:right;font-size:17px;font-weight:700;color:${C.accent}"></div>`);

  // ------------------------------------------------------------ four-stroke stage
  const sp = card('stroke');
  put(sp, `<div class="cp" style="left:12px;top:11px;font-weight:700">FOUR-STROKE CYCLE</div>`);
  const stAng = put(sp, `<div class="cp mu mono" style="right:12px;top:10px;font-size:10px;font-weight:600"></div>`);
  const stBig = put(sp, `<div style="left:12px;top:28px;font-size:25px;font-weight:750;letter-spacing:-.3px;line-height:1.1;white-space:nowrap"></div>`);
  const stText = put(sp, `<div style="left:12px;right:12px;top:62px;font-size:11.6px;line-height:1.38;color:#3b3e43;height:34px"></div>`);
  const stRows = STAGES.map((s, i) => {
    const r = put(sp, `<div class="stg" style="top:${102 + i * 22}px"><i></i><b>${s.n} &nbsp;${s.key}</b><span class="mono mu" style="margin-left:auto;font-size:9.6px">${i * 180}–${i * 180 + 180}°</span></div>`);
    return r;
  });
  const stBar = put(sp, `<div style="left:12px;top:${102 + 4 * 22 + 2}px;height:2px;background:${C.accent};width:0"></div>`);

  // ------------------------------------------------------------ live state (calculated) + illustrative
  const dp = card('dash');
  put(dp, `<div class="cp" style="left:12px;top:11px;font-weight:700">LIVE STATE</div>`);
  put(dp, `<div class="tag" style="right:12px;top:9px;color:${C.ink}">CALCULATED</div>`);
  const ROWS = [
    ['crank', 'Crank angle'],
    ['stroke', 'Stroke'],
    ['pos', 'Piston from TDC'],
    ['vel', 'Piston speed'],
    ['rod', 'Rod angle'],
    ['cam', 'Camshaft'],
    ['camrpm', 'Cam speed'],
    ['in', 'Intake lift'],
    ['ex', 'Exhaust lift'],
  ];
  const dv = {};
  ROWS.forEach(([k, label], i) => {
    const r = put(dp, `<div class="row" style="top:${32 + i * 19}px"><span class="k">${label}</span><span class="v"></span></div>`);
    dv[k] = r.lastElementChild;
  });
  const inBar = put(dp, `<div style="left:12px;top:${32 + 7 * 19 + 17}px;height:2px;background:${C.blue};width:0"></div>`);
  const exBar = put(dp, `<div style="left:12px;top:${32 + 8 * 19 + 17}px;height:2px;background:${C.exh};width:0"></div>`);
  const yI = 32 + 9 * 19 + 6;
  put(dp, `<div style="left:12px;right:12px;top:${yI}px;height:1px;background:${C.line}"></div>`);
  put(dp, `<div class="tag" style="right:12px;top:${yI + 8}px;color:${C.fire}">ILLUSTRATIVE</div>`);
  const ignRow = put(dp, `<div class="row" style="top:${yI + 8}px;right:110px"><span class="k">Ignition</span><span class="v" style="display:flex;align-items:center;gap:6px"><i style="display:block;width:9px;height:9px;border-radius:50%;background:#ddd"></i><em style="font-style:normal"></em></span></div>`);
  const ignDot = ignRow.querySelector('i');
  const ignTxt = ignRow.querySelector('em');
  const prRow = put(dp, `<div class="row" style="top:${yI + 30}px"><span class="k">Pressure index</span><span class="v"></span></div>`);
  const prVal = prRow.lastElementChild;
  put(dp, `<div class="trk" style="left:12px;right:12px;top:${yI + 51}px"></div>`);
  const prBar = put(dp, `<div style="left:12px;top:${yI + 51}px;height:3px;background:${C.fire};width:0"></div>`);

  // ------------------------------------------------------------ transport
  const trp = card('transport');
  const tbtn = (k, x, y, w, label) => (btn[k] = put(trp, `<div class="tb" style="left:${x}px;top:${y}px;width:${w}px">${label}</div>`));
  tbtn('play', 12, 12, 82, '▶ PLAY');
  tbtn('back', 98, 12, 42, '−5°');
  tbtn('fwd', 144, 12, 42, '+5°');
  tbtn('reset', 190, 12, 48, 'RESET');
  tbtn('slow', 12, 40, 82, 'SLOW-MO');
  const playTxt = put(trp, `<div class="cp mu" style="left:102px;top:46px;font-weight:600"></div>`);
  const SL = {x: 12, w: 226};
  put(trp, `<div class="cp" style="left:12px;top:76px;font-weight:600">ENGINE SPEED</div>`);
  const rpmTxt = put(trp, `<div class="cp mono" style="right:12px;top:75px;font-weight:600;font-size:10.5px"></div>`);
  const rpmTrack = put(trp, `<div class="trk" style="left:${SL.x}px;top:96px;width:${SL.w}px;cursor:ew-resize"></div>`);
  const rpmKnob = put(rpmTrack, `<div class="knob"></div>`);
  put(trp, `<div class="cp" style="left:12px;top:118px;font-weight:600">CRANK ANGLE</div>`);
  const angTxt = put(trp, `<div class="cp mono" style="right:12px;top:117px;font-weight:600;font-size:10.5px"></div>`);
  const angTrack = put(trp, `<div style="left:${SL.x}px;top:138px;width:${SL.w}px;height:3px;display:flex;cursor:ew-resize">${[C.blue, C.grey, C.fire, C.exh].map((c) => `<i style="flex:1;background:${c};opacity:.45"></i>`).join('')}</div>`);
  const angKnob = put(angTrack, `<div class="knob" style="background:${C.ink}"></div>`);
  put(trp, `<div class="mono mu" style="left:12px;right:12px;top:150px;display:flex;justify-content:space-between;font-size:8.6px">${[0, 180, 360, 540, 720].map((d) => `<span>${d}</span>`).join('')}</div>`);
  put(trp, `<div class="cp mu" style="left:12px;top:172px;font-size:8.4px;font-weight:600">SPACE PLAY · ← → STEP · R RESET</div>`);
  // hit areas a little taller than the tracks
  const hitOf = (track) => put(trp, `<div style="left:${SL.x - 6}px;top:${parseFloat(track.style.top) - 9}px;width:${SL.w + 12}px;height:21px;cursor:ew-resize"></div>`);
  const rpmHit = hitOf(rpmTrack);
  const angHit = hitOf(angTrack);

  // ------------------------------------------------------------ 720° cycle chart
  const chp = card('chart');
  put(chp, `<div class="cp" style="left:12px;top:11px;font-weight:700">720° CYCLE</div>`);
  put(chp, `<div class="cp mu" style="right:12px;top:11px;font-weight:600">DRAG TO SCRUB</div>`);
  put(
    chp,
    `<div class="cp" style="left:12px;top:28px;font-size:8.4px;font-weight:600;display:flex;gap:7px;letter-spacing:1px">${[
      ['PISTON', C.ink, ''],
      ['INTAKE', C.blue, ''],
      ['EXHAUST', C.exh, ''],
      ['PRESS.*', C.fire, '3 2'],
    ]
      .map(([n, c, d]) => `<span style="display:flex;align-items:center;gap:4px"><svg width="14" height="4"><line x1="0" x2="14" y1="2" y2="2" stroke="${c}" stroke-width="1.6" stroke-dasharray="${d}"/></svg>${n}</span>`)
      .join('')}</div>`,
  );
  const CW = 234;
  const CH = 160;
  const X = (d) => 14 + (d / 720) * (CW - 22);
  const Y = (v) => 124 - v * 100;
  const chart = put(chp, `<svg style="left:6px;top:44px;cursor:ew-resize" width="${CW}" height="${CH}"></svg>`);
  {
    let h = '';
    const bands = ['INTAKE', 'COMPR', 'POWER', 'EXHAUST'];
    bands.forEach((n, i) => {
      h += `<rect data-band="${i}" x="${X(i * 180)}" y="${Y(1.06)}" width="${X(180) - X(0)}" height="${Y(0) - Y(1.06)}" fill="transparent"/>`;
      h += `<text x="${X(i * 180 + 90)}" y="${Y(1.06) - 3}" font-size="7" letter-spacing=".8" text-anchor="middle" fill="${C.mute}" font-weight="600">${n}</text>`;
    });
    for (const d of [180, 360, 540]) h += `<line x1="${X(d)}" x2="${X(d)}" y1="${Y(1.06)}" y2="${Y(0)}" stroke="${C.line}" stroke-width=".8"/>`;
    h += `<line x1="${X(0)}" x2="${X(720)}" y1="${Y(0)}" y2="${Y(0)}" stroke="${C.ink}" stroke-width=".8"/>`;
    const curve = (fn, col, w, dash = '') => {
      let p = '';
      for (let d = 0; d <= 720; d += 3) p += `${d ? 'L' : 'M'}${X(d).toFixed(1)} ${Y(fn(d)).toFixed(1)}`;
      return `<path d="${p}" fill="none" stroke="${col}" stroke-width="${w}" stroke-dasharray="${dash}" stroke-linejoin="round"/>`;
    };
    const VL = CONFIG.valves.intake.lift;
    h += curve((d) => pressureIndex(d) / 100, C.fire, 1.1, '3 2');
    h += curve((d) => 1 - sliderCrank(d).disp / CONFIG.stroke, C.ink, 1.4);
    h += curve((d) => (intakeLift(d) / VL) * 0.62, C.blue, 1.6);
    h += curve((d) => (exhaustLift(d) / VL) * 0.62, C.exh, 1.6);
    // valve events
    const ev = [
      ['IO', CONFIG.valves.intake.open, C.blue],
      ['IC', CONFIG.valves.intake.close, C.blue],
      ['EO', CONFIG.valves.exhaust.open, C.exh],
      ['EC', CONFIG.valves.exhaust.close, C.exh],
    ];
    for (const [n, d, c] of ev) {
      h += `<line x1="${X(d)}" x2="${X(d)}" y1="${Y(0)}" y2="${Y(0) + 4}" stroke="${c}" stroke-width="1.2"/><text x="${X(d)}" y="${Y(0) + 12}" font-size="6.6" text-anchor="middle" fill="${c}" font-weight="700">${n}</text>`;
    }
    for (const d of [0, 180, 360, 540, 720]) h += `<text x="${X(d)}" y="${Y(0) + 22}" font-size="6.8" text-anchor="middle" fill="${C.mute}" font-family="JetBrains Mono">${d}°</text>`;
    h += `<text x="${X(360) + 3}" y="${Y(0.98)}" font-size="6.4" fill="${C.fire}" font-weight="600">SPARK</text><line x1="${X(360 - CONFIG.sparkAdvance)}" x2="${X(360 - CONFIG.sparkAdvance)}" y1="${Y(1.0)}" y2="${Y(0.86)}" stroke="${C.fire}" stroke-width="1.2"/>`;
    h += `<line class="cur" x1="0" x2="0" y1="${Y(1.06)}" y2="${Y(0)}" stroke="${C.accent}" stroke-width="1.6"/>`;
    h += `<circle class="dp" r="2.8" fill="${C.ink}"/><circle class="di" r="2.8" fill="${C.blue}"/><circle class="de" r="2.8" fill="${C.exh}"/><circle class="dpr" r="2.4" fill="${C.fire}"/>`;
    chart.innerHTML = h;
  }
  put(chp, `<div class="mu" style="left:12px;right:12px;top:208px;font-size:8.6px;line-height:1.35">Piston: TDC at top. Valve lift: ${VL_ONE()} mm at 62% height. *Pressure is illustrative, not measured or simulated.</div>`);
  const chCur = chart.querySelector('.cur');
  const chDots = {p: chart.querySelector('.dp'), i: chart.querySelector('.di'), e: chart.querySelector('.de'), pr: chart.querySelector('.dpr')};
  const bands = [...chart.querySelectorAll('[data-band]')];

  // ------------------------------------------------------------ components (isolation) + info card
  const pp = card('parts');
  put(pp, `<div class="cp" style="left:12px;top:11px;font-weight:700">COMPONENTS</div>`);
  put(pp, `<div class="cp mu" style="right:12px;top:11px;font-weight:600">CLICK TO ISOLATE</div>`);
  const SHORT = {piston: 'PISTON', rod: 'CON ROD', crank: 'CRANKSHAFT', cam: 'CAMSHAFT', intake: 'INTAKE VALVE', exhaust: 'EXHAUST VALVE', head: 'CYL HEAD', flywheel: 'FLYWHEEL'};
  PART_KEYS.forEach((k, i) => {
    btn['p_' + k] = put(pp, `<div class="tb" style="left:${12 + (i % 2) * 115}px;top:${30 + Math.floor(i / 2) * 26}px;width:111px">${SHORT[k]}</div>`);
  });
  btn.p_all = put(pp, `<div class="tb" style="left:12px;top:${30 + 4 * 26}px;width:226px">SHOW ALL PARTS</div>`);
  const yInfo = 30 + 5 * 26 + 6;
  put(pp, `<div style="left:12px;right:12px;top:${yInfo}px;height:1px;background:${C.line}"></div>`);
  const infoName = put(pp, `<div style="left:12px;top:${yInfo + 10}px;font-size:16px;font-weight:750"></div>`);
  const infoSub = put(pp, `<div class="cp" style="left:12px;top:${yInfo + 32}px;font-size:8.6px;color:${C.accent}"></div>`);
  const infoText = put(pp, `<div style="left:12px;right:12px;top:${yInfo + 48}px;font-size:11.2px;line-height:1.4;color:#3b3e43"></div>`);

  // ------------------------------------------------------------ camera, mode, learn
  const vp = card('view');
  put(vp, `<div class="cp mu" style="left:12px;top:11px;font-weight:600">CAMERA</div>`);
  CAMS.forEach((k, i) => (btn['c_' + k] = put(vp, `<div class="tb" style="left:${12 + i * 57}px;top:26px;width:54px">${k.toUpperCase()}</div>`)));
  put(vp, `<div class="cp mu" style="left:12px;top:58px;font-weight:600">MODE</div>`);
  const mw = [50, 62, 66, 42];
  let mx = 12;
  MODES.forEach((k, i) => {
    btn['m_' + k] = put(vp, `<div class="tb" style="left:${mx}px;top:73px;width:${mw[i]}px">${MODE_LABEL[k]}</div>`);
    mx += mw[i] + 2;
  });
  btn.learn = put(vp, `<div class="tb" style="left:12px;top:110px;width:142px">LEARN THE 4 STROKES</div>`);
  btn.labels = put(vp, `<div class="tb" style="left:158px;top:110px;width:80px">LABELS</div>`);

  // ------------------------------------------------------------ the view's overlay: callouts, the pointer, tour chip, hint
  const callSvg = put(view, `<svg style="position:absolute;inset:0;overflow:visible;pointer-events:none" width="100%" height="100%"></svg>`);
  const callG = put(view, `<div style="position:absolute;inset:0;pointer-events:none"></div>`);
  const badge = put(view, `<div class="badge"></div>`);
  const tourChip = put(view, `<div class="tourchip"></div>`);
  const hint = put(view, `<div class="hint">DRAG TO ORBIT · SCROLL TO ZOOM · H HIDES THE PANELS</div>`);
  const ring = put(view, `<div class="ring"></div>`);
  const cur = put(view, `<div class="cur"><svg width="22" height="22" viewBox="0 0 34 34"><path d="M4 3 L30 13.5 L17.5 17.5 L13.5 30 Z" fill="#111" stroke="#fff" stroke-width="2.2" stroke-linejoin="round"/></svg></div>`);
  const pool = [];
  for (let i = 0; i < 4; i++) pool.push(put(callG, `<div class="call"><b></b><span></span></div>`));

  // ------------------------------------------------------------ layout
  let compact = false;
  const layout = (mode) => {
    compact = mode === 'compact';
    app.classList.toggle('compact', compact);
    if (!compact) {
      Object.assign(view.style, {position: 'absolute', left: '0', top: '0', width: `${W}px`, height: `${H}px`});
      Object.assign(panels.style, {position: 'absolute', inset: '0', overflow: '', display: '', padding: ''});
      for (const [k, n] of Object.entries(P)) {
        const [x, y] = STAGE_POS[k];
        Object.assign(n.style, {position: 'absolute', left: `${x}px`, top: `${y}px`, zoom: '', margin: '', order: ''});
      }
      hint.style.display = '';
    } else hint.style.display = 'none';
  };
  // compact: the view takes the top (portrait) or the left (landscape); the cards scroll in the rest
  const compactSize = (vw, vh) => {
    const portrait = vh >= vw;
    const viewW = portrait ? vw : Math.round(vw * 0.6);
    const viewH = portrait ? Math.round(vh * 0.5) : vh;
    Object.assign(view.style, {position: 'fixed', left: '0', top: '0', width: `${viewW}px`, height: `${viewH}px`});
    const colW = portrait ? vw : vw - viewW;
    const zoom = Math.min(1.7, (colW - 20) / 250);
    Object.assign(panels.style, {
      position: 'fixed',
      inset: 'auto',
      left: portrait ? '0' : `${viewW}px`,
      top: portrait ? `${viewH}px` : '0',
      width: `${colW}px`,
      height: `${portrait ? vh - viewH : vh}px`,
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '10px 0 30px',
    });
    for (const [k, n] of Object.entries(P)) {
      const o = COMPACT_ORDER.indexOf(k);
      Object.assign(n.style, {position: 'relative', left: '0', top: '0', zoom: String(zoom), margin: '0 0 8px', order: String(o < 0 ? 99 : o), flexShrink: '0'});
    }
    return [viewW, viewH];
  };

  // ------------------------------------------------------------ geometry for the tour cursor and hit tests
  const spot = (key) => {
    const n = btn[key];
    const a = app.getBoundingClientRect();
    const r = n.getBoundingClientRect();
    const s = a.width / (compact ? a.width : W) || 1;
    return [(r.left - a.left + r.width / 2) / s, (r.top - a.top + r.height / 2) / s];
  };
  const stageSpot = (k, dx, dy) => {
    const [x, y] = STAGE_POS[k];
    return [x + dx, y + dy];
  };
  const sliderK = (track, clientX) => {
    const r = track.getBoundingClientRect();
    return Math.min(1, Math.max(0, (clientX - r.left) / r.width));
  };
  const chartAngle = (clientX) => {
    const r = chart.getBoundingClientRect();
    const sx = r.width / CW;
    return Math.min(720, Math.max(0, ((clientX - r.left) / sx - 14) / ((CW - 22) / 720)));
  };

  const pointer = (c) => {
    cur.style.display = c.x < 0 ? 'none' : 'block';
    cur.style.transform = `translate(${(c.x - 3).toFixed(2)}px, ${(c.y - 2).toFixed(2)}px) scale(${c.press ? 0.88 : 1})`;
    ring.style.left = `${c.ringX}px`;
    ring.style.top = `${c.ringY}px`;
    ring.style.opacity = String(c.ring * 0.85);
    ring.style.transform = `scale(${(0.35 + 0.9 * (1 - c.ring)).toFixed(3)})`;
  };
  const last = {};
  const set = (key, node, v, prop = 'textContent') => {
    if (last[key] === v) return;
    last[key] = v;
    node[prop] = v;
  };

  return {
    view,
    panels,
    P,
    btn,
    stRows,
    rpmHit,
    angHit,
    rpmTrack,
    angTrack,
    chart,
    tourChip,
    layout,
    compactSize,
    spot,
    stageSpot,
    sliderK,
    chartAngle,
    pointer,
    knobX: (k) => SL.x + k * SL.w,
    get compact() {
      return compact;
    },
    /** s: {st (engine state), rpm, playText, paused, slow, cam, mode, solo, learn, labels, callouts, cursor, focus, badge, tour} */
    update(s) {
      const st = s.st;
      const th = st.crankAngle;
      set('rpm', rpmBig, String(Math.round(s.rpm)));
      set('rpmSub', rpmSub, `REV / MIN<br><span style="color:${C.mute}">PICTURE ${s.playText}</span>`, 'innerHTML');
      set('ctRpm', ctRpm, `${Math.round(s.rpm)} RPM`, 'textContent');
      void ctitle;

      // stage card
      const stg = STAGES[st.phaseIndex];
      set('stAng', stAng, `θ ${th.toFixed(0).padStart(3, ' ')}°`);
      set('stBig', stBig, `<span style="color:${C.accent}">${stg.n}</span> ${stg.key.charAt(0) + stg.key.slice(1).toLowerCase()}`, 'innerHTML');
      set('stText', stText, stg.text);
      stRows.forEach((r, i) => {
        if (last['row' + i] !== (i === st.phaseIndex)) {
          last['row' + i] = i === st.phaseIndex;
          r.classList.toggle('on', i === st.phaseIndex);
        }
      });
      stBar.style.top = `${102 + st.phaseIndex * 22 + 19}px`;
      stBar.style.width = `${(st.phaseProgress * 226).toFixed(1)}px`;

      // live state: every value straight from the model
      set('d_crank', dv.crank, `${th.toFixed(1)}°`);
      set('d_stroke', dv.stroke, st.phase);
      set('d_pos', dv.pos, `${fx(st.pistonPosition)} mm`);
      set('d_vel', dv.vel, `${st.pistonVelocity > 0.005 ? '↓' : st.pistonVelocity < -0.005 ? '↑' : '·'} ${Math.abs(st.pistonVelocity).toFixed(2)} m/s`);
      set('d_rod', dv.rod, `${sign(st.rodAngle)}°`);
      set('d_cam', dv.cam, `${st.camAngle.toFixed(1)}°`);
      set('d_camrpm', dv.camrpm, `${Math.round(st.camRpm)} rpm`);
      set('d_in', dv.in, `${fx(st.intakeLift)} mm`);
      set('d_ex', dv.ex, `${fx(st.exhaustLift)} mm`);
      inBar.style.width = `${((st.intakeLift / CONFIG.valves.intake.lift) * 226).toFixed(1)}px`;
      exBar.style.width = `${((st.exhaustLift / CONFIG.valves.exhaust.lift) * 226).toFixed(1)}px`;
      const ig = st.ignition;
      const burning = ig.burn > 0.02 && ig.burn < 0.98;
      set('ign', ignTxt, ig.spark ? 'SPARK' : burning ? 'BURN' : '—');
      ignDot.style.background = ig.spark ? C.accent : burning ? C.fire : '#dcdcd8';
      ignDot.style.boxShadow = ig.spark ? `0 0 0 4px ${C.accentSoft}` : 'none';
      set('pr', prVal, st.pressureIndex.toFixed(0));
      prBar.style.width = `${((st.pressureIndex / 100) * 226).toFixed(1)}px`;

      // transport
      set('play', btn.play, s.paused ? '▶ PLAY' : '❚❚ PAUSE');
      btn.slow.classList.toggle('acc', !!s.slow);
      set('playTxt', playTxt, `PICTURE ${s.playText}`);
      set('rpmTxt', rpmTxt, `${Math.round(s.rpm)} RPM`);
      rpmKnob.style.left = `${(((s.rpmTarget ?? s.rpm) - CONFIG.rpm.min) / (CONFIG.rpm.max - CONFIG.rpm.min)) * 100}%`;
      set('angTxt', angTxt, `${th.toFixed(0)}°`);
      angKnob.style.left = `${(th / 720) * 100}%`;

      // chart cursor and dots
      const cx = X(th).toFixed(1);
      chCur.setAttribute('x1', cx);
      chCur.setAttribute('x2', cx);
      const VL = CONFIG.valves.intake.lift;
      const dot = (n, v) => {
        n.setAttribute('cx', cx);
        n.setAttribute('cy', Y(v).toFixed(1));
      };
      dot(chDots.p, 1 - st.pistonFraction);
      dot(chDots.i, (st.intakeLift / VL) * 0.62);
      dot(chDots.e, (st.exhaustLift / VL) * 0.62);
      dot(chDots.pr, st.pressureIndex / 100);
      bands.forEach((b, i) => b.setAttribute('fill', i === st.phaseIndex ? (i === 2 ? 'rgba(232,116,42,.10)' : 'rgba(23,25,28,.05)') : 'transparent'));

      // toggles
      for (const k of CAMS) btn['c_' + k].classList.toggle('on', s.cam === k);
      for (const k of MODES) btn['m_' + k].classList.toggle('on', s.mode === k);
      for (const k of PART_KEYS) btn['p_' + k].classList.toggle('acc', s.solo === k);
      btn.p_all.classList.toggle('on', !s.solo);
      btn.learn.classList.toggle('acc', !!s.learn);
      btn.labels.classList.toggle('on', !!s.labels);
      const info = s.solo ? PARTS[s.solo] : null;
      set('iName', infoName, info ? info.name : 'Whole engine');
      set('iSub', infoSub, info ? info.sub : `BORE ${CONFIG.bore} · STROKE ${CONFIG.stroke} · ROD ${CONFIG.rod} MM`);
      set(
        'iText',
        infoText,
        info ? info.text : 'One crank angle drives every part you see: the piston and rod by the exact slider-crank, the camshaft at half speed, and both valves from their timing curves. Pick a part to isolate it.',
      );
      for (const [k, n] of Object.entries(P)) n.classList.toggle('focus', !!(s.focus && s.focus.includes(k)));
      set('badge', badge, s.badge || '');

      // callouts: a label and a thin leader to its point on the engine
      let lh = '';
      pool.forEach((n, i) => {
        const c = s.callouts[i];
        if (!c || !c.at || c.o < 0.02) {
          n.style.opacity = '0';
          return;
        }
        const [ax, ay] = c.at;
        const [lx, ly] = c.label;
        const w = c.w ?? 110;
        const right = lx >= ax;
        const x0 = right ? lx : lx - w;
        lh += `<circle cx="${ax.toFixed(1)}" cy="${ay.toFixed(1)}" r="2.6" fill="${c.accent ? C.accent : C.ink}" opacity="${c.o.toFixed(2)}"/><polyline points="${ax.toFixed(1)},${ay.toFixed(1)} ${lx.toFixed(1)},${(ly + 17).toFixed(1)} ${(right ? lx + w : lx - w).toFixed(1)},${(ly + 17).toFixed(1)}" fill="none" stroke="${C.mute}" stroke-width=".9" opacity="${c.o.toFixed(2)}"/>`;
        n.style.opacity = c.o.toFixed(2);
        n.style.left = `${x0.toFixed(1)}px`;
        n.style.top = `${(ly - 12).toFixed(1)}px`;
        n.style.textAlign = right ? 'left' : 'right';
        n.style.width = `${w}px`;
        n.firstChild.textContent = c.name;
        n.lastChild.textContent = c.sub;
      });
      callSvg.innerHTML = lh;
      pointer(s.cursor);
    },
  };
}
function VL_ONE() {
  return CONFIG.valves.intake.lift;
}
