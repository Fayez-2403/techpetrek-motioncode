// ENGINE.EXE mechanical model: ONE source of truth. engineStateAt(crankAngle, rpm) returns the complete state of the
// engine at a crank angle; the 3D parts, the dashboard, the 720° chart, the callouts and the tour all read it.
// No three.js here, so node can test it (tests/kin.test.mjs).
//
// Engine space (millimetres): crank axis on z, cylinder axis on +y, crank centre at the origin, +x toward the
// exhaust side (the front of the bike). Crank angle theta: 0 = piston at TDC with the crank pin straight up; the pin
// sits at (r sin θ, r cos θ), so the crank turns clockwise seen from +z. The cycle runs 0..720:
//   0-180 intake · 180-360 compression · 360-540 power · 540-720 exhaust, then wraps to 0.
import {CONFIG} from './config.js';

const D2R = Math.PI / 180;
export const mod = (a, m) => ((a % m) + m) % m;

export const R = CONFIG.stroke / 2; // crank radius r
export const L = CONFIG.rod; // rod length l
export const PIN_TDC = R + L; // wrist-pin height at TDC
export const PIN_BDC = L - R; // wrist-pin height at BDC
export const AREA = (Math.PI * CONFIG.bore * CONFIG.bore) / 4; // mm²
export const VD = AREA * CONFIG.stroke; // swept volume, mm³
export const VC = VD / (CONFIG.compressionRatio - 1); // clearance volume, mm³
export const DISPLACEMENT_CC = VD / 1000;
export const CROWN_TDC = PIN_TDC + CONFIG.pistonCompressionHeight;
export const DECK = CROWN_TDC + CONFIG.deckClearance;

export const STROKES = ['INTAKE', 'COMPRESSION', 'POWER', 'EXHAUST'];
export const STAGES = [
  {key: 'INTAKE', n: '01', text: 'The piston moves down and the intake valve opens.'},
  {key: 'COMPRESSION', n: '02', text: 'Both valves close and the piston moves upward.'},
  {key: 'POWER', n: '03', text: 'Ignition occurs near TDC and the piston moves downward.'},
  {key: 'EXHAUST', n: '04', text: 'The exhaust valve opens and the piston moves upward.'},
];

/**
 * Slider-crank, exact. x = r·cos θ + √(l² − r²·sin²θ) is the wrist-pin height above the crank axis.
 * Returns the pin height, the displacement from TDC, the crank-pin point, the rod angle (degrees from the cylinder
 * axis, positive while the crank pin is on the +x side) and dx/dθ in mm per degree.
 */
export function sliderCrank(theta) {
  const a = theta * D2R;
  const s = Math.sin(a);
  const c = Math.cos(a);
  const root = Math.sqrt(L * L - R * R * s * s);
  const x = R * c + root;
  const dxdth = (-R * s - (R * R * s * c) / root) * D2R;
  return {x, disp: PIN_TDC - x, pin: {x: R * s, y: R * c}, rodAngle: Math.asin((R * s) / L) / D2R, dxdth};
}

/**
 * Valve lift in mm at crank angle theta for a valve {open, close, lift}. A C2-smooth bump, 64·u³(1−u)³ (zero lift,
 * velocity and acceleration at both ends, peak at mid-event), over the event from open to close, measured round the
 * 720° cycle so events that cross 720 → 0 (intake opens at 710, exhaust closes at 10) wrap correctly.
 */
export function valveLift(theta, v) {
  const dur = mod(v.close - v.open, 720);
  const u = mod(theta - v.open, 720) / dur;
  if (u <= 0 || u >= 1) return 0;
  return v.lift * 64 * u ** 3 * (1 - u) ** 3;
}
export const intakeLift = (th) => valveLift(mod(th, 720), CONFIG.valves.intake);
export const exhaustLift = (th) => valveLift(mod(th, 720), CONFIG.valves.exhaust);

/** cylinder volume above the crown, mm³ */
export const volumeAt = (th) => VC + AREA * sliderCrank(th).disp;

// ------------------------------------------------------------ ILLUSTRATIVE combustion (not a thermodynamic model)
const SPARK = 360 - CONFIG.sparkAdvance;
const P_IN = 0.95; // relative pressure during intake (index units, roughly bar)
const P_EX = 1.12; // during the exhaust stroke
const N_POLY = 1.32; // polytropic exponent for compression and expansion
const RISE = 3.2; // pressure-rise factor of the burn
const EVO = CONFIG.valves.exhaust.open;
const IVC = CONFIG.valves.intake.close;
/** Wiebe-style burned fraction 0..1, starting at the spark */
export function burnFraction(th) {
  th = mod(th, 720);
  if (th < SPARK || th >= 600) return 0;
  const u = (th - SPARK) / CONFIG.burnDuration;
  return 1 - Math.exp(-5 * u ** 3);
}
const smooth = (x) => {
  const u = Math.min(1, Math.max(0, x));
  return u * u * (3 - 2 * u);
};
function rawPressure(th) {
  th = mod(th, 720);
  const VMAX = VC + VD;
  const fired = (t) => P_IN * Math.pow(VMAX / volumeAt(t), N_POLY) * (1 + RISE * burnFraction(t));
  if (th < 180) return P_IN;
  if (th < EVO) return Math.max(P_IN, fired(th));
  if (th < 540) {
    const k = smooth((th - EVO) / (540 - EVO));
    return fired(EVO) + (P_EX - fired(EVO)) * k;
  }
  if (th < 680) return P_EX;
  return P_EX + (P_IN - P_EX) * smooth((th - 680) / 40);
}
let P_MAX = 0;
for (let t = 0; t < 720; t += 0.25) P_MAX = Math.max(P_MAX, rawPressure(t));
export const PRESSURE_PEAK_RAW = P_MAX;
/** illustrative cylinder-pressure index, 0..100 (100 = the cycle's peak). Shape only, not measured. */
export const pressureIndex = (th) => (100 * rawPressure(th)) / P_MAX;
void IVC;

/**
 * The complete mechanical state at a crank angle (degrees, any value; normalised to 0..720) and an engine speed.
 * Kinematic values are calculated exactly; ignition and pressure are illustrative.
 */
export function engineStateAt(crankAngle, rpm = CONFIG.rpm.default) {
  const th = mod(crankAngle, 720);
  const sc = sliderCrank(th);
  const phaseIndex = Math.min(3, Math.floor(th / 180));
  const iL = intakeLift(th);
  const eL = exhaustLift(th);
  const sparkK = th >= SPARK && th < SPARK + 8 ? 1 - (th - SPARK) / 8 : 0;
  const burn = burnFraction(th);
  const burnRate = th >= SPARK && th < 600 ? (burnFraction(th + 1) - burnFraction(th - 1)) / 2 : 0;
  const degPerSec = rpm * 6;
  return {
    crankAngle: th,
    crankAngle360: mod(th, 360),
    phase: STROKES[phaseIndex],
    phaseIndex,
    phaseProgress: (th - phaseIndex * 180) / 180,
    pistonPosition: sc.disp, // mm below TDC
    pistonFraction: sc.disp / CONFIG.stroke, // 0 at TDC, 1 at BDC
    pistonPinY: sc.x, // wrist-pin height above the crank axis, mm
    pistonVelocity: (-sc.dxdth * degPerSec) / 1000, // m/s, positive moving down
    rodAngle: sc.rodAngle,
    crankPin: sc.pin, // mm
    camAngle: th / 2, // degrees, 0..360: exactly half the crank
    camRpm: rpm / 2,
    rpm,
    intakeLift: iL,
    exhaustLift: eL,
    intakeOpen: iL > 0,
    exhaustOpen: eL > 0,
    ignition: {spark: sparkK > 0, sparkK, burn, burnRate, sparkAngle: SPARK},
    pressureIndex: pressureIndex(th),
    illustrative: ['ignition', 'pressureIndex'],
    volumeCc: volumeAt(th) / 1000,
  };
}
