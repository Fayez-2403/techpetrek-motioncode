// Tiny Web Audio blips for the console (no assets). Silent until the first user gesture creates the AudioContext.
let ctx: AudioContext | null = null;
let armed = false;

function arm() {
  if (armed) return;
  armed = true;
  const start = () => { if (!ctx) { try { ctx = new AudioContext(); } catch { ctx = null; } } };
  window.addEventListener('pointerdown', start, { once: true });
  window.addEventListener('keydown', start, { once: true });
}
if (typeof window !== 'undefined') arm();

function blip(freq: number, dur: number, type: OscillatorType, gain: number, slide = 0) {
  if (!ctx) return;
  const t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t + dur);
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(ctx.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

export const sfx = {
  click: () => blip(1800, 0.05, 'square', 0.03),
  on: () => blip(620, 0.12, 'triangle', 0.06, 520),
  off: () => blip(900, 0.12, 'triangle', 0.05, -500),
  tick: () => blip(2400, 0.025, 'sine', 0.02),
  deny: () => blip(180, 0.15, 'sawtooth', 0.04, -60),
};
