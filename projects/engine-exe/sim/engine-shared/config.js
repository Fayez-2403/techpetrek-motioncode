// ENGINE.EXE: every editable number for the generic educational engine lives here. Units: millimetres and degrees.
// This is NOT a replica of any manufacturer's engine. The dimensions are illustrative, in the range of a typical
// 150 cc air-cooled commuter single, chosen so the mechanism reads clearly. Change them here; the kinematics, the
// geometry, the cam lobes, the dashboard and the charts all follow.
export const CONFIG = {
  name: 'ENGINE.EXE',
  tagline: 'Every rotation tells a story.',
  label: 'Generic educational engine',

  // bottom end
  bore: 58.0, // cylinder bore
  stroke: 56.0, // crank radius r = stroke / 2
  rod: 100.0, // connecting rod length l, centre to centre
  compressionRatio: 9.5,
  pistonCompressionHeight: 26.0, // wrist-pin centre to crown
  deckClearance: 1.0, // crown to deck at TDC (squish gap)

  // valve train. Crank angles on the 0-720 cycle, 0 = TDC at the start of intake.
  valves: {
    intake: {open: 710, close: 220, lift: 7.0, headDia: 25.0, tilt: 20},
    exhaust: {open: 500, close: 10, lift: 7.0, headDia: 21.5, tilt: 20},
  },
  camBaseRadius: 13.0,
  // the rocker ratio comes out of the rocker geometry in engine.js (valve arm / cam arm); this is the target
  rockerArmCam: 20.0,

  // ignition (illustrative)
  sparkAdvance: 10, // degrees before the firing TDC (360)
  burnDuration: 50, // degrees the illustrative burn takes

  // timing drive: 2:1 so the cam turns at half crank speed
  sprocket: {crankTeeth: 14, camTeeth: 28, pitch: 8.0},

  // speeds
  rpm: {idle: 1400, default: 1400, min: 300, max: 9000},
  // what the live page shows: 1 = real time; the default slows the picture so the eye can follow it
  playback: {normal: 1 / 20, slow: 1 / 100},
};
