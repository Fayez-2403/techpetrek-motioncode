// Every sound in the laboratory is synthesised live with the Web Audio API: no samples, no files, nothing to
// license. The bow creaks and sings as it is drawn (louder and higher with the draw), the release twangs
// (Karplus-Strong string), impacts drop a sub-bass hit under a crack and a crumble, each mode adds its own
// layer, pieces knock as they collide (Rapier contact-force events), the rings chime, thunder follows the
// distant lightning, and a low drone with wind sits under it all.
import type { SimEvent } from '../core/simcore';
import { lightningAt } from '../view/arena';
import { mulberry32 } from '../core/noise';

export class AudioEngine {
  ctx: AudioContext | null = null;
  private master!: GainNode; private comp!: DynamicsCompressorNode; private verb!: ConvolverNode; private wet!: GainNode;
  private noise!: AudioBuffer;
  private draw: { creak: GainNode; creakF: BiquadFilterNode; tone: OscillatorNode[]; toneG: GainNode; hum: OscillatorNode; humG: GainNode } | null = null;
  private amb: { g: GainNode } | null = null;
  private lastCreak = 0; private thunderSlot = -1; private contactBudget = 0; private lastT = 0;
  enabled = true; volume = 0.8;

  /** Must be called from a user gesture (browsers start audio only then). */
  start() {
    if (this.ctx) { void this.ctx.resume(); return; }
    const ctx = new AudioContext();
    this.ctx = ctx;
    this.master = ctx.createGain(); this.master.gain.value = this.enabled ? this.volume : 0;
    this.comp = ctx.createDynamicsCompressor(); this.comp.threshold.value = -16; this.comp.ratio.value = 4; this.comp.attack.value = 0.004; this.comp.release.value = 0.25;
    this.verb = ctx.createConvolver(); this.wet = ctx.createGain(); this.wet.gain.value = 0.32;
    this.verb.buffer = this.impulse(3.2, 2.4);
    this.verb.connect(this.wet); this.wet.connect(this.comp); this.master.connect(this.comp); this.master.connect(this.verb); this.comp.connect(ctx.destination);
    const n = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate), d = n.getChannelData(0), r = mulberry32(3);
    for (let i = 0; i < d.length; i++) d[i] = r() * 2 - 1;
    this.noise = n;
    this.ambience();
  }
  setEnabled(on: boolean) { this.enabled = on; if (this.ctx) this.master.gain.setTargetAtTime(on ? this.volume : 0, this.ctx.currentTime, 0.05); }

  private impulse(sec: number, decay: number) {
    const ctx = this.ctx!, len = Math.floor(ctx.sampleRate * sec), b = ctx.createBuffer(2, len, ctx.sampleRate), r = mulberry32(8);
    for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (r() * 2 - 1) * Math.pow(1 - i / len, decay); }
    return b;
  }
  private env(g: GainNode, t: number, peak: number, a: number, dec: number) {
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + dec);
  }
  private osc(type: OscillatorType, f0: number, f1: number, dur: number, peak: number, when = 0, a = 0.005, dest?: AudioNode) {
    const ctx = this.ctx!, t = ctx.currentTime + when, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t); if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur);
    this.env(g, t, peak, a, dur); o.connect(g); g.connect(dest ?? this.master); o.start(t); o.stop(t + a + dur + 0.05);
  }
  private burst(type: BiquadFilterType, f: number, q: number, dur: number, peak: number, when = 0, a = 0.003, f1?: number, dest?: AudioNode) {
    const ctx = this.ctx!, t = ctx.currentTime + when, s = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = this.noise; s.loop = true; fl.type = type; fl.frequency.setValueAtTime(f, t); fl.Q.value = q;
    if (f1) fl.frequency.exponentialRampToValueAtTime(f1, t + dur);
    this.env(g, t, peak, a, dur); s.connect(fl); fl.connect(g); g.connect(dest ?? this.master); s.start(t, Math.random() * 1.5); s.stop(t + a + dur + 0.05);
  }
  /** Karplus-Strong plucked string, rendered into a buffer. */
  private pluck(freq: number, dur: number, peak: number, bright = 0.5) {
    const ctx = this.ctx!, sr = ctx.sampleRate, n = Math.floor(sr * dur), b = ctx.createBuffer(1, n, sr), d = b.getChannelData(0);
    const L = Math.max(2, Math.round(sr / freq)), buf = new Float32Array(L), r = mulberry32(Math.round(freq));
    // excitation: noise, low-passed more for a darker pluck
    let lp = 0;
    for (let i = 0; i < L; i++) { lp += (r() * 2 - 1 - lp) * (0.25 + 0.75 * bright); buf[i] = lp; }
    // the delay line averages neighbours each pass: the string's decay and its loss of highs
    let k = 0;
    for (let i = 0; i < n; i++) { const a = buf[k]!, c = buf[(k + 1) % L]!; d[i] = a; buf[k] = (a + c) * 0.5 * 0.9962; k = (k + 1) % L; }
    const s = ctx.createBufferSource(), g = ctx.createGain(); s.buffer = b; g.gain.value = peak; s.connect(g); g.connect(this.master); s.start();
  }

  private ambience() {
    const ctx = this.ctx!, g = ctx.createGain(); g.gain.value = 0.0001; g.gain.exponentialRampToValueAtTime(0.5, ctx.currentTime + 3); g.connect(this.master);
    // drone: a tonic and fifth (D2, A2) through a slowly breathing low-pass, a touch of buzz
    for (const [f, v] of [[73.42, 0.05], [110, 0.03], [146.83, 0.015], [73.6, 0.035]] as const) {
      const o = ctx.createOscillator(), lp = ctx.createBiquadFilter(), og = ctx.createGain();
      o.type = 'sawtooth'; o.frequency.value = f; lp.type = 'lowpass'; lp.frequency.value = 420; lp.Q.value = 2;
      const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 0.07 + f * 0.0003; lg.gain.value = 180; lfo.connect(lg); lg.connect(lp.frequency); lfo.start();
      og.gain.value = v; o.connect(lp); lp.connect(og); og.connect(g); o.start();
    }
    // cosmic wind
    const s = ctx.createBufferSource(), bp = ctx.createBiquadFilter(), wg = ctx.createGain();
    s.buffer = this.noise; s.loop = true; bp.type = 'bandpass'; bp.frequency.value = 380; bp.Q.value = 0.7; wg.gain.value = 0.05;
    const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 0.05; lg.gain.value = 220; lfo.connect(lg); lg.connect(bp.frequency); lfo.start();
    s.connect(bp); bp.connect(wg); wg.connect(g); s.start();
    this.amb = { g };
  }

  private startDraw() {
    const ctx = this.ctx!;
    const creak = ctx.createGain(); creak.gain.value = 0; const creakF = ctx.createBiquadFilter(); creakF.type = 'bandpass'; creakF.frequency.value = 900; creakF.Q.value = 6;
    creakF.connect(creak); creak.connect(this.master);
    const toneG = ctx.createGain(); toneG.gain.value = 0; toneG.connect(this.master); toneG.connect(this.verb);
    const tone = [1, 1.5, 2.01, 3.02].map((k) => { const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = 220 * k; const g = ctx.createGain(); g.gain.value = 0.25 / k; o.connect(g); g.connect(toneG); o.start(); return o; });
    const hum = ctx.createOscillator(), humG = ctx.createGain(); hum.type = 'sawtooth'; hum.frequency.value = 55; const hlp = ctx.createBiquadFilter(); hlp.type = 'lowpass'; hlp.frequency.value = 300;
    humG.gain.value = 0; hum.connect(hlp); hlp.connect(humG); humG.connect(this.master); hum.start();
    this.draw = { creak, creakF, tone, toneG, hum, humG };
  }
  private stopDraw() {
    if (!this.draw || !this.ctx) return;
    const t = this.ctx.currentTime, d = this.draw;
    d.toneG.gain.setTargetAtTime(0, t, 0.06); d.humG.gain.setTargetAtTime(0, t, 0.05);
    for (const o of d.tone) o.stop(t + 0.5); d.hum.stop(t + 0.5);
    this.draw = null;
  }

  /** Per frame: the drawn string's voice follows the draw (0..1), and thunder follows the lightning. */
  update(state: { held: boolean; draw: number; drawSpeed: number; clock: number }) {
    if (!this.ctx || !this.enabled) return;
    const ctx = this.ctx, t = ctx.currentTime;
    if (state.held && !this.draw) this.startDraw();
    if (!state.held && this.draw) this.stopDraw();
    if (this.draw) {
      const u = state.draw, d = this.draw;
      d.toneG.gain.setTargetAtTime(0.02 + 0.09 * u * u, t, 0.05);
      d.tone.forEach((o, k) => o.frequency.setTargetAtTime((180 + 260 * u) * [1, 1.5, 2.01, 3.02][k]!, t, 0.08));
      d.humG.gain.setTargetAtTime(0.03 * u + (u > 0.85 ? 0.05 * (u - 0.85) / 0.15 : 0), t, 0.05);
      d.hum.frequency.setTargetAtTime(48 + 30 * u, t, 0.1);
      // wooden creak grains while the string is moving
      if (Math.abs(state.drawSpeed) > 0.05 && state.clock - this.lastCreak > 0.05 + 0.1 * (1 - u)) {
        this.lastCreak = state.clock;
        this.burst('bandpass', 600 + 900 * u + Math.random() * 300, 8, 0.05, 0.05 + 0.12 * u, 0, 0.002);
      }
    }
    const L = lightningAt(state.clock);
    if (L.k > 0.5 && L.slot !== this.thunderSlot) {
      this.thunderSlot = L.slot;
      const delay = 0.8 + (L.slot % 3) * 0.6;
      this.burst('lowpass', 180, 0.8, 2.6, 0.32, delay, 0.08, 60); this.osc('sine', 46, 30, 1.8, 0.2, delay, 0.05);
      this.burst('bandpass', 900, 1.2, 0.25, 0.08, delay - 0.05, 0.01);
    }
    this.contactBudget = Math.min(6, this.contactBudget + (state.clock - this.lastT) * 20);
    this.lastT = state.clock;
  }

  onEvent(e: SimEvent) {
    if (!this.ctx || !this.enabled) return;
    if (e.type === 'launch') {
      const p = e.power;
      this.pluck(98 + 40 * p, 0.9, 0.5 + 0.4 * p, 0.6);
      this.burst('bandpass', 2400, 0.9, 0.35, 0.18 + 0.3 * p, 0, 0.003, 500);
      this.osc('sine', 70, 38, 0.25, 0.4 * p, 0, 0.003);
      this.osc('triangle', 400 + 300 * p, 1600 + 1000 * p, 0.35, 0.06, 0.01, 0.01);
      const mode = e.mode;
      if (mode === 'vajra') for (let i = 0; i < 6; i++) this.burst('highpass', 4000, 0.7, 0.04, 0.1, 0.03 * i);
      if (mode === 'agni') this.burst('lowpass', 700, 0.7, 0.9, 0.2, 0, 0.08, 300);
      if (mode === 'vayu') this.osc('sine', 900, 2200, 0.8, 0.05, 0, 0.05);
      if (mode === 'cosmic') for (const f of [660, 990, 1320]) this.osc('sine', f, f * 0.5, 1.2, 0.03, 0, 0.1);
      this.burst('bandpass', 900, 1.5, 1.4, 0.07, 0.05, 0.3, 300); // flight whoosh trailing off
    } else if (e.type === 'impact') {
      const k = Math.min(1, 0.4 + e.info.E / 3e9);
      this.osc('sine', 62, 26, 1.2, 0.9 * k, 0, 0.004);
      this.burst('highpass', 1800, 0.7, 0.18, 0.6 * k, 0, 0.001);
      this.burst('lowpass', 900, 0.6, 2.8, 0.45 * k, 0.02, 0.01, 150);
      for (let i = 0; i < 14; i++) this.burst('bandpass', 300 + Math.random() * 1200, 3, 0.06 + Math.random() * 0.1, 0.12 * k, 0.1 + Math.random() * 1.8);
      if (e.mode === 'vajra') { for (let i = 0; i < 18; i++) this.burst('highpass', 3000 + Math.random() * 4000, 1, 0.03, 0.18, Math.random() * 0.5); this.burst('lowpass', 250, 0.7, 2.2, 0.35, 0.1, 0.02, 60); }
      if (e.mode === 'agni') { this.burst('lowpass', 500, 0.8, 3.2, 0.45, 0, 0.25, 200); for (let i = 0; i < 20; i++) this.burst('bandpass', 2000 + Math.random() * 3000, 4, 0.02, 0.06, Math.random() * 2.5); }
      if (e.mode === 'vayu') { this.burst('bandpass', 400, 1.2, 4, 0.4, 0, 0.4, 1600); this.osc('sine', 700, 1500, 3, 0.05, 0.2, 0.6); }
      if (e.mode === 'cosmic') { for (const f of [220, 277, 330, 440]) this.osc('sine', f * 2, f, 3.2, 0.06, 0, 0.3); this.burst('highpass', 6000, 0.7, 2.2, 0.08, 0, 1.4); }
      if (e.target === 'crystal' || e.target === 'slab') for (let i = 0; i < 9; i++) this.osc('sine', 2200 + Math.random() * 4200, 1800 + Math.random() * 3000, 0.4 + Math.random() * 0.6, 0.05, Math.random() * 0.25, 0.001);
    } else if (e.type === 'contact') {
      if (this.contactBudget < 1) return; this.contactBudget--;
      const v = Math.min(0.25, 0.03 + e.force / 4000);
      this.burst('lowpass', 500 + Math.random() * 500, 1, 0.08 + Math.random() * 0.08, v, 0, 0.002);
    } else if (e.type === 'ring') {
      const f = [1318.5, 1567.98, 1975.53][e.idx] ?? 1318.5;
      this.osc('sine', f, f, 1.4, 0.18, 0, 0.002); this.osc('sine', f * 2.76, f * 2.76, 0.6, 0.05, 0, 0.002);
    } else if (e.type === 'clang') {
      for (const f of [523, 1240, 2870]) this.osc('triangle', f, f * 0.98, 0.9, 0.12, 0, 0.001);
    } else if (e.type === 'challenge' && e.state.status === 'won') {
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => this.osc('sine', f, f, 0.9, 0.12, i * 0.11, 0.004));
    } else if (e.type === 'reset') {
      this.burst('bandpass', 300, 1, 0.5, 0.12, 0, 0.3, 1800);
    }
  }

  ui(kind: 'click' | 'tick' | 'select', v = 0.5) {
    if (!this.ctx || !this.enabled) return;
    if (kind === 'click') this.osc('sine', 1400, 900, 0.05, 0.07);
    else if (kind === 'tick') this.osc('sine', 600 + 900 * v, 600 + 900 * v, 0.03, 0.04);
    else this.osc('triangle', 880 + 440 * v, 1320 + 440 * v, 0.18, 0.06, 0, 0.004);
  }
}
