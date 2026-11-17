// Validation of the mechanical model alone (no browser): node tests/kin.test.mjs
// Writes docs/validation-kin.json for the report.
import fs from 'node:fs';
import {CONFIG} from '../sim/engine-shared/config.js';
import * as K from '../sim/engine-shared/kin.js';

const results = [];
const test = (name, fn) => {
  try {
    const detail = fn();
    results.push({name, pass: true, detail});
  } catch (e) {
    results.push({name, pass: false, detail: e.message});
  }
};
const ok = (c, msg) => {
  if (!c) throw new Error(msg);
};
const S = (th) => K.engineStateAt(th, 1400);
const STEP = 0.01;
const angles = [];
for (let t = 0; t <= 720 + 1e-9; t += STEP) angles.push(Math.round(t * 100) / 100);

test('Piston at TDC (0 mm) at 0°, 360°, 720°', () => {
  for (const t of [0, 360, 720]) ok(Math.abs(S(t).pistonPosition) < 1e-9, `${t}°: ${S(t).pistonPosition}`);
  return 'piston position 0.000000 mm at all three';
});
test('Piston at BDC (= stroke) at 180°, 540°', () => {
  for (const t of [180, 540]) ok(Math.abs(S(t).pistonPosition - CONFIG.stroke) < 1e-9, `${t}°: ${S(t).pistonPosition}`);
  return `piston position ${CONFIG.stroke.toFixed(6)} mm at both`;
});
test('TDC and BDC are the true extremes (0.01° sweep)', () => {
  let mn = Infinity;
  let mx = -Infinity;
  const mins = [];
  const maxs = [];
  for (const t of angles) {
    const p = S(t).pistonPosition;
    if (p < mn - 1e-12) mn = p;
    if (p > mx + 1e-12) mx = p;
  }
  for (const t of angles) {
    const p = S(t).pistonPosition;
    if (Math.abs(p - mn) < 1e-9) mins.push(t);
    if (Math.abs(p - mx) < 1e-9) maxs.push(t);
  }
  ok(mins.every((t) => [0, 360, 720].includes(t)), `minima at ${mins}`);
  ok(maxs.every((t) => [180, 540].includes(t)), `maxima at ${maxs}`);
  return `minima at ${mins.join(', ')}°; maxima at ${maxs.join(', ')}°`;
});
test('Slider-crank formula x = r·cosθ + √(l² − r²·sin²θ)', () => {
  let worst = 0;
  for (const t of angles) {
    const a = (t * Math.PI) / 180;
    const x = K.R * Math.cos(a) + Math.sqrt(K.L ** 2 - (K.R * Math.sin(a)) ** 2);
    worst = Math.max(worst, Math.abs(x - S(t).pistonPinY));
  }
  ok(worst < 1e-9, `max error ${worst}`);
  return `max deviation ${worst.toExponential(1)} mm over ${angles.length} angles`;
});
test('Connecting rod length constant (crank pin ↔ wrist pin = l)', () => {
  let worst = 0;
  for (const t of angles) {
    const s = S(t);
    const d = Math.hypot(s.crankPin.x - 0, s.crankPin.y - s.pistonPinY);
    worst = Math.max(worst, Math.abs(d - CONFIG.rod));
  }
  ok(worst < 1e-9, `max error ${worst}`);
  return `max |length − ${CONFIG.rod}| = ${worst.toExponential(1)} mm`;
});
test('Camshaft at exactly half crank speed', () => {
  let worst = 0;
  for (const t of angles) worst = Math.max(worst, Math.abs(S(t).camAngle - t / 2 + (t === 720 ? 360 : 0)));
  ok(worst < 1e-9, `max error ${worst}`);
  for (const rpm of [300, 1400, 6000, 9000]) ok(K.engineStateAt(10, rpm).camRpm === rpm / 2, `cam rpm at ${rpm}`);
  return 'camAngle = θ/2 for every sample; camRpm = rpm/2 at 300, 1400, 6000, 9000';
});
test('Intake lift is zero outside 710°→220° (wrapping 720)', () => {
  let bad = [];
  for (const t of angles) {
    const inside = t > 710 || t < 220;
    const l = S(t).intakeLift;
    if (!inside && l !== 0) bad.push(t);
    if (inside && t !== 710 && !(l > 0) && t !== 720 && t !== 0) bad.push(t);
  }
  ok(!bad.length, `bad at ${bad.slice(0, 5)}`);
  return 'lift > 0 only inside the window; exactly 0 outside';
});
test('Exhaust lift is zero outside 500°→10° (wrapping 720)', () => {
  let bad = [];
  for (const t of angles) {
    const inside = t > 500 || t < 10;
    const l = S(t).exhaustLift;
    if (!inside && l !== 0) bad.push(t);
    if (inside && t !== 500 && !(l > 0) && t !== 720 && t !== 0) bad.push(t);
  }
  ok(!bad.length, `bad at ${bad.slice(0, 5)}`);
  return 'lift > 0 only inside the window; exactly 0 outside';
});
test('Valve events wrap continuously across 720 → 0', () => {
  const a = S(719.99);
  const b = S(0.01);
  const c = S(720);
  const d = S(0);
  ok(Math.abs(c.intakeLift - d.intakeLift) < 1e-12 && Math.abs(c.exhaustLift - d.exhaustLift) < 1e-12, '720 ≠ 0');
  ok(Math.abs(a.intakeLift - b.intakeLift) < 0.002 && Math.abs(a.exhaustLift - b.exhaustLift) < 0.002, 'jump across the wrap');
  let jump = 0;
  for (let i = 1; i < angles.length; i++) {
    jump = Math.max(jump, Math.abs(S(angles[i]).intakeLift - S(angles[i - 1]).intakeLift), Math.abs(S(angles[i]).exhaustLift - S(angles[i - 1]).exhaustLift));
  }
  ok(jump < 0.01, `largest step ${jump}`);
  return `overlap at TDC: intake ${d.intakeLift.toFixed(3)} mm, exhaust ${d.exhaustLift.toFixed(3)} mm; largest 0.01° step ${jump.toFixed(5)} mm`;
});
test('Peak lift 7 mm at mid-event', () => {
  const iMid = (CONFIG.valves.intake.open + K.mod(CONFIG.valves.intake.close - CONFIG.valves.intake.open, 720) / 2) % 720;
  const eMid = (CONFIG.valves.exhaust.open + K.mod(CONFIG.valves.exhaust.close - CONFIG.valves.exhaust.open, 720) / 2) % 720;
  ok(Math.abs(S(iMid).intakeLift - CONFIG.valves.intake.lift) < 1e-9, 'intake peak');
  ok(Math.abs(S(eMid).exhaustLift - CONFIG.valves.exhaust.lift) < 1e-9, 'exhaust peak');
  let mx = 0;
  for (const t of angles) mx = Math.max(mx, S(t).intakeLift, S(t).exhaustLift);
  ok(mx <= 7 + 1e-9, `exceeds: ${mx}`);
  return `intake 7.000 mm at ${iMid}°, exhaust 7.000 mm at ${eMid}°, never above`;
});
test('Stroke labels change at 0 / 180 / 360 / 540 / 720', () => {
  const want = [
    [0, 'INTAKE'],
    [179.99, 'INTAKE'],
    [180, 'COMPRESSION'],
    [359.99, 'COMPRESSION'],
    [360, 'POWER'],
    [539.99, 'POWER'],
    [540, 'EXHAUST'],
    [719.99, 'EXHAUST'],
    [720, 'INTAKE'],
  ];
  for (const [t, p] of want) ok(S(t).phase === p, `${t}° gave ${S(t).phase}`);
  return want.map(([t, p]) => `${t}°→${p}`).join(', ');
});
test('Crank angle normalised to 0..720', () => {
  for (const [a, b] of [[-10, 710], [1440, 0], [725, 5], [-720, 0]]) {
    const x = S(a);
    const y = S(b);
    ok(Math.abs(x.crankAngle - y.crankAngle) < 1e-9 && Math.abs(x.pistonPosition - y.pistonPosition) < 1e-9, `${a} vs ${b}`);
  }
  return '−10°≡710°, 1440°≡0°, 725°≡5°';
});
test('Ignition fires once per cycle, near the firing TDC', () => {
  const on = angles.filter((t) => S(t).ignition.spark);
  ok(on.length > 0, 'never fires');
  ok(on[0] >= 340 && on[on.length - 1] < 370, `spark from ${on[0]} to ${on[on.length - 1]}`);
  let peak = 0;
  let at = 0;
  for (const t of angles) if (S(t).pressureIndex > peak) [peak, at] = [S(t).pressureIndex, t];
  ok(at > 360 && at < 400, `pressure peak at ${at}`);
  return `spark ${on[0]}°–${on[on.length - 1]}°; illustrative pressure peak (index 100) at ${at}°`;
});
test('Piston speed scales with rpm', () => {
  const a = K.engineStateAt(90, 1000).pistonVelocity;
  const b = K.engineStateAt(90, 8000).pistonVelocity;
  ok(Math.abs(b / a - 8) < 1e-9, `ratio ${b / a}`);
  const mean = (2 * CONFIG.stroke * 1000) / 60 / 1000; // mean piston speed at 1000 rpm, m/s
  return `90° ATDC: ${a.toFixed(3)} m/s at 1000 rpm, ${b.toFixed(3)} m/s at 8000 rpm (mean piston speed at 1000 rpm ${mean.toFixed(2)} m/s)`;
});
test('Displacement and compression ratio from the dimensions', () => {
  const cc = K.DISPLACEMENT_CC;
  ok(Math.abs(cc - (Math.PI / 4) * CONFIG.bore ** 2 * CONFIG.stroke / 1000) < 1e-9, 'cc');
  const cr = (K.VC + K.VD) / K.VC;
  ok(Math.abs(cr - CONFIG.compressionRatio) < 1e-9, 'cr');
  return `${cc.toFixed(1)} cc, CR ${cr.toFixed(2)}:1`;
});

const pass = results.filter((r) => r.pass).length;
for (const r of results) console.log(`${r.pass ? 'PASS' : 'FAIL'}  ${r.name}  — ${r.detail}`);
console.log(`\n${pass}/${results.length} passed`);
fs.mkdirSync(new URL('../docs/', import.meta.url), {recursive: true});
fs.writeFileSync(new URL('../docs/validation-kin.json', import.meta.url), JSON.stringify({samples: angles.length, results}, null, 1));
process.exit(pass === results.length ? 0 : 1);
