// ENGINE.EXE video carousel: 4 looping slides, 4:5 (540 x 675 layout, 1080 x 1350 at dpr 2), 6 s each, English only,
// no voice. Every picture is the simulator's own engine posed by engineStateAt(); every number is the model's or a
// measured test result (projects/engine-exe/docs/VALIDATION.md). Each slide is a pure function of time and loops
// seamlessly (the crank runs whole cycles, the camera sways on a sine, the explode breathes on a cosine).
//   window.SETUP(n) once per slide, then window.SEEK(t) per frame (t in 0..DURATION).
import {warmComposer} from 'teardown-kit/warm.js';
import {CONFIG} from '../../../engine-exe/sim/engine-shared/config.js';
import {DISPLACEMENT_CC, engineStateAt} from '../../../engine-exe/sim/engine-shared/kin.js';
import {createStage} from '../../../engine-exe/sim/engine-shared/stage.js';

const W = 540;
const H = 675;
export const DURATION = 6;
const D2R = Math.PI / 180;
const TAU = Math.PI * 2;
const C = {ink: '#15171a', mute: '#7c8085', accent: '#c8692e', paper: '#f1f1ee'};
const HL = {INTAKE: ['intake', 'piston'], COMPRESSION: ['piston'], POWER: ['piston', 'plug', 'crank'], EXHAUST: ['exhaust', 'piston']};

const css = document.createElement('style');
css.textContent = `
html,body{margin:0;background:${C.paper};overflow:hidden}
#app{position:fixed;left:0;top:0;width:${W}px;height:${H}px;overflow:hidden;font-family:Inter,system-ui,sans-serif;color:${C.ink};-webkit-font-smoothing:antialiased;font-variant-numeric:tabular-nums;background:${C.paper}}
#gl{position:absolute;left:0;top:0;width:${W}px;height:${H}px}
.L{position:absolute;inset:0;pointer-events:none}
.mono{font-family:'JetBrains Mono',monospace}
.glow{text-shadow:0 0 18px ${C.paper},0 0 8px ${C.paper},0 0 3px ${C.paper}}
.pill{display:inline-flex;align-items:center;gap:7px;height:24px;padding:0 10px;border:1px solid #dcdcd7;background:rgba(255,255,255,.9);font-size:10px;font-weight:700;letter-spacing:1.4px}
.dot{width:6px;height:6px;border-radius:50%;background:${C.accent}}
.page{position:absolute;right:22px;top:24px;font-size:10px;font-weight:700;letter-spacing:1.6px;color:${C.mute}}
.call{position:absolute;white-space:nowrap;box-sizing:border-box;background:rgba(255,255,255,.94);border:1px solid #dcdcd7;padding:4px 8px 5px}
.call b{display:block;font-size:13.5px;font-weight:750}
.call span{display:block;font-size:9px;font-weight:650;letter-spacing:1.2px;color:${C.mute};margin-top:2px}
.chip{display:inline-block;border:1.5px solid ${C.ink};background:rgba(255,255,255,.92);font-size:15px;font-weight:750;padding:5px 10px}
.tag{position:absolute;left:8px;bottom:8px;font-size:9.5px;font-weight:650;color:#33363b;background:rgba(255,255,255,.92);border:1px solid #dcdcd7;padding:3px 6px}
`;
document.head.appendChild(css);
const app = document.getElementById('app');
const canvas = document.createElement('canvas');
canvas.id = 'gl';
app.appendChild(canvas);
const layer = document.createElement('div');
layer.className = 'L';
app.appendChild(layer);
const st = createStage({canvas});
const PR = devicePixelRatio || 1;
st.resize(W, H, PR);

const ops0 = {cut: 0, xray: 0, explode: 0, solo: null, fade: 0, hl: [], hlK: 0, arrows: 1, charge: 1};
const V = (tx, ty, tz, az, el, d, sy = 0, sx = 0) => ({tx, ty, tz, az: az * D2R, el: el * D2R, d, sx, sy, fit: 1});
const pose = (theta, cam, ops = {}) => {
  const s = engineStateAt(theta, CONFIG.rpm.default);
  st.frame(s, cam, {...ops0, ...ops});
  return s;
};
const at = (key) => {
  const p = st.eng.anchorAt(key);
  return p && st.project(p.x, p.y, p.z);
};
const sway = (t, amp) => amp * Math.sin((TAU * t) / DURATION); // loops
const fmtSigned = (v) => `${v >= 0 ? '+' : '−'}${Math.abs(v).toFixed(1)}`;
const head = (n) => `<div class="L"><div style="position:absolute;left:22px;top:22px" class="pill"><i class="dot"></i>ENGINE.EXE</div><div class="page">${n} / 4</div></div>`;
const q = (sel) => layer.querySelector(sel);

// ------------------------------------------------------------ the slides: setup() builds the layer once, frame(t) poses
const SLIDES = {
  // 1 · the cover: the cutaway engine firing; frame 0 is the poster (θ 372°, the burn at its brightest)
  1: {
    setup() {
      layer.innerHTML =
        head(1) +
        `<div class="L glow" style="top:66px;left:26px;right:26px">
          <div style="font-size:13px;font-weight:750;letter-spacing:3px;color:${C.accent}">NOT A RENDER. A SIMULATION.</div>
          <div style="font-size:50px;font-weight:860;letter-spacing:-2px;line-height:.98;margin-top:8px">Claude built<br>this <span style="color:${C.accent}">engine.</span></div>
          <div style="font-size:15px;font-weight:600;line-height:1.38;color:#33363b;margin-top:12px;max-width:330px">Every part moves from one physics model.<br>Not one frame animated by hand.</div>
        </div>
        <div class="L" style="top:auto;bottom:22px;left:22px;right:22px;display:flex;justify-content:space-between;align-items:flex-end">
          <div class="mono glow" style="font-size:11px;font-weight:600;color:#3b3e43;line-height:1.55"><span id="live"></span><br>${CONFIG.rpm.default} RPM · ${DISPLACEMENT_CC.toFixed(0)} CC SINGLE</div>
          <div style="background:${C.ink};color:#fff;font-size:12px;font-weight:750;letter-spacing:2px;padding:9px 14px">SWIPE →</div>
        </div>`;
    },
    frame(t) {
      const s = pose(372 + (1440 * t) / DURATION, V(0, 0.15, 0, 19 + sway(t, 5), 6 + sway(t + 1.5, 1.5), 0.9, 205, 92), {cut: 1, hl: HL[engineStateAt(372 + (1440 * t) / DURATION).phase], hlK: 1});
      q('#live').textContent = `θ ${s.crankAngle.toFixed(0).padStart(3, ' ')}° · ${s.phase} STROKE`;
    },
  },
  // 2 · one angle drives everything: the labels read the model every frame
  2: {
    labels: null,
    setup() {
      layer.innerHTML =
        head(2) +
        `<div class="L glow" style="top:62px;left:26px;right:26px">
          <div style="font-size:34px;font-weight:850;letter-spacing:-1.2px;line-height:1.02">One number<br>moves <span style="color:${C.accent}">everything.</span></div>
          <div style="font-size:13px;font-weight:600;color:#3b3e43;margin-top:8px">The crank angle θ. The rest is calculated.</div>
        </div>
        <svg class="L" id="lead" width="${W}" height="${H}"></svg><div class="L" id="calls"></div>
        <div class="L" style="top:auto;bottom:22px;left:22px;right:22px;background:rgba(255,255,255,.94);border:1px solid #dcdcd7;padding:10px 14px">
          <div style="font-size:9.5px;font-weight:750;letter-spacing:1.6px;color:${C.mute}">EXACT SLIDER-CRANK</div>
          <div class="mono" style="font-size:16px;font-weight:600;margin-top:4px">x = r·cosθ + √(l² − r²·sin²θ)</div>
        </div>`;
      // the label rows are placed once (from a pose at t = 0) so they stay still while the leaders follow the parts
      this.labels = null;
    },
    frame(t) {
      const cam = V(0, 0.13, 0, 20 + sway(t, 3), 8, 1.2, 56, -62);
      const s = pose(100 + (720 * t) / DURATION, cam, {cut: 1});
      const list = [
        ['cam', 'Camshaft', `${s.camAngle.toFixed(0).padStart(3, ' ')}° = θ ÷ 2`, 'r'],
        ['intake', 'Intake valve', `${s.intakeLift.toFixed(2)} MM LIFT`, 'l'],
        ['piston', 'Piston', `${s.pistonPosition.toFixed(1)} MM FROM TDC`, 'l'],
        ['rod', 'Connecting rod', `${fmtSigned(s.rodAngle)}° · L ${CONFIG.rod} MM`, 'r'],
        ['crankPin', 'Crankshaft', `θ = ${s.crankAngle.toFixed(0).padStart(3, ' ')}° · r ${CONFIG.stroke / 2} MM`, 'r'],
      ];
      if (!this.labels) {
        const placed = {l: [], r: []};
        this.labels = list.map(([key, , , side]) => {
          const a = at(key);
          let y = a[1] - 30;
          for (const py of placed[side]) if (Math.abs(py - y) < 42) y = py + 42;
          placed[side].push(y);
          return y;
        });
      }
      const w = 150;
      let svg = '';
      let html = '';
      list.forEach(([key, name, sub, side], i) => {
        const a = at(key);
        if (!a) return;
        const right = side === 'r';
        const y = this.labels[i];
        const lx = right ? W - 22 - w : 22 + w;
        svg += `<circle cx="${a[0].toFixed(1)}" cy="${a[1].toFixed(1)}" r="3.2" fill="${C.accent}"/><polyline points="${a[0].toFixed(1)},${a[1].toFixed(1)} ${lx},${y + 15}" fill="none" stroke="#5e6267" stroke-width="1"/>`;
        html += `<div class="call" style="left:${right ? lx : lx - w}px;top:${y - 4}px;width:${w}px;text-align:${right ? 'left' : 'right'}"><b>${name}</b><span class="mono">${sub}</span></div>`;
      });
      q('#lead').innerHTML = svg;
      q('#calls').innerHTML = html;
    },
  },
  // 3 · the four strokes: each tile plays its own 180° over the loop
  3: {
    tiles: [
      [0, 'INTAKE', '01', 'Suck', (s) => `INTAKE LIFT ${s.intakeLift.toFixed(2)} MM`],
      [180, 'COMPRESSION', '02', 'Squeeze', (s) => (s.intakeLift > 0 ? `INTAKE CLOSING ${s.intakeLift.toFixed(2)} MM` : 'BOTH VALVES SHUT')],
      [360, 'POWER', '03', 'Bang', (s) => (s.crankAngle < 362 ? `SPARK AT ${360 - CONFIG.sparkAdvance}°` : `PISTON ${s.pistonPosition.toFixed(1)} MM DOWN`)],
      [540, 'EXHAUST', '04', 'Blow', (s) => `EXHAUST LIFT ${s.exhaustLift.toFixed(2)} MM`],
    ],
    tw: 246,
    th: 226,
    setup() {
      st.resize(this.tw, this.th, PR);
      canvas.style.visibility = 'hidden';
      layer.innerHTML =
        head(3) +
        `<div class="L" style="top:62px;left:26px;right:26px">
          <div style="font-size:34px;font-weight:850;letter-spacing:-1.2px;line-height:1.02">Suck. Squeeze. Bang. <span style="color:${C.accent}">Blow.</span></div>
          <div style="font-size:13px;font-weight:600;color:#3b3e43;margin-top:8px">Four strokes in 720° of crank. Every frame posed by the model.</div>
        </div>
        <div class="L" style="top:150px;bottom:auto;left:18px;right:18px;display:grid;grid-template-columns:${this.tw}px ${this.tw}px;grid-auto-rows:${this.th}px;align-content:start;gap:12px;justify-content:center">
          ${this.tiles
            .map(([, phase, n, word], i) => `<div style="position:relative;width:${this.tw}px;height:${this.th}px;background:#ecece8;border:1px solid #deded9;overflow:hidden">
            <canvas id="t${i}" width="${this.tw * PR}" height="${this.th * PR}" style="width:${this.tw}px;height:${this.th}px;display:block"></canvas>
            <div class="glow" style="position:absolute;left:10px;top:8px"><span style="font-size:26px;font-weight:850;color:${C.accent};letter-spacing:-1px">${n}</span> <span style="font-size:14px;font-weight:800">${phase.charAt(0) + phase.slice(1).toLowerCase()}</span><div style="font-size:10px;font-weight:750;letter-spacing:1.6px;color:${C.mute};margin-top:1px">${word.toUpperCase()}</div></div>
            <div class="mono tag" id="s${i}"></div>
          </div>`)
            .join('')}
        </div>
        <div class="L" style="top:auto;bottom:22px;left:26px;right:26px;font-size:10.5px;font-weight:650;letter-spacing:.6px;color:${C.mute}">Valve timing IO 710° · IC 220° · EO 500° · EC 10° · cam at exactly ½ crank speed. Ignition is illustrative.</div>`;
    },
    frame(t) {
      this.tiles.forEach(([start, phase, , , sub], i) => {
        // each tile loops its own stroke, a quarter apart, and blinks through its ground at the restart (never at t = 0)
        const k = (t / DURATION + 0.125 + i / 4) % 1;
        const theta = start + 2 + 176 * k;
        const e = Math.min(1, (k * DURATION) / 0.18, ((1 - k) * DURATION) / 0.18);
        const alpha = e * e * (3 - 2 * e);
        const s = pose(theta, V(0, 0.15, 0, 14, 5, 0.98, 14), {cut: 1, hl: HL[phase], hlK: 1});
        const ctx = q(`#t${i}`).getContext('2d');
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#ecece8';
        ctx.fillRect(0, 0, this.tw * PR, this.th * PR);
        ctx.globalAlpha = alpha;
        ctx.drawImage(canvas, 0, 0, this.tw * PR, this.th * PR);
        ctx.globalAlpha = 1;
        q(`#s${i}`).textContent = `θ ${s.crankAngle.toFixed(0).padStart(3, ' ')}° · ${sub(s)}`;
      });
    },
    teardown() {
      canvas.style.visibility = '';
      st.resize(W, H, PR);
    },
  },
  // 4 · the ask: any machine, with the receipts; the engine breathes apart and back together while it runs
  4: {
    setup() {
      layer.innerHTML =
        head(4) +
        `<div class="L glow" style="top:62px;left:26px;right:26px">
          <div style="font-size:44px;font-weight:860;letter-spacing:-1.8px;line-height:1">Any machine.<br><span style="color:${C.accent}">Same physics.</span></div>
          <div style="display:flex;gap:7px;margin-top:14px;flex-wrap:wrap"><span class="chip">Gearbox</span><span class="chip">Pump</span><span class="chip">Landing gear</span></div>
        </div>
        <div class="L" style="top:auto;bottom:118px;left:22px;right:22px;display:flex;gap:8px;z-index:2">
          ${[
            ['42/42', 'CHECKS PASSED'],
            ['< 10⁻¹³ mm', 'ROD ERROR, 720 POSES'],
            ['826 KB', 'ONE OFFLINE FILE'],
          ]
            .map(([a, b]) => `<div style="flex:1;background:rgba(255,255,255,.94);border:1px solid #dcdcd7;padding:8px 10px"><div class="mono" style="font-size:16px;font-weight:700">${a}</div><div style="font-size:8.6px;font-weight:700;letter-spacing:1.2px;color:${C.mute};margin-top:3px">${b}</div></div>`)
            .join('')}
        </div>
        <div class="L" style="top:auto;bottom:0;left:0;right:0;height:104px;background:rgba(241,241,238,.97);border-top:1px solid #dcdcd7"></div>
        <div class="L" style="top:auto;bottom:22px;left:22px;right:22px;display:flex;align-items:center;justify-content:space-between">
          <div><div style="font-size:12px;font-weight:750;letter-spacing:2.6px">COMMENT</div><div style="background:${C.accent};color:#fff;font-size:34px;font-weight:860;letter-spacing:1px;padding:2px 12px 4px;margin-top:4px;display:inline-block">ENGINE</div></div>
          <div style="text-align:right;font-size:10px;font-weight:650;letter-spacing:1px;color:#4a4d52;line-height:1.5">GET A SIMULATOR LIKE THIS<br><span style="color:${C.mute}">Built with Claude Code + the teardown skill</span></div>
        </div>`;
    },
    frame(t) {
      const ex = 0.5 + 0.5 * Math.cos((TAU * t) / DURATION); // 1 at the start and end: frame 0 is the exploded poster
      pose(150 + (1440 * t) / DURATION, V(0, 0.2 - 0.04 * (1 - ex), 0, 38 + sway(t, 4), 15, 2.42 - 0.5 * (1 - ex), 20, 112), {explode: ex});
    },
  },
};

let cur = null;
window.DURATION = DURATION;
window.SETUP = async (n) => {
  if (cur && cur.teardown) cur.teardown();
  cur = SLIDES[n];
  cur.setup();
  await document.fonts.ready;
  return true;
};
window.SEEK = (t) => {
  cur.frame(t);
  return true;
};
warmComposer(st.renderer, st.composer, st.scene, st.camera, [{materials: st.eng.twins, target: st.composer.renderTarget1, lights: st.scene}]).then(() => (window.READY = true));
