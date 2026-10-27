// Playback engine. The song's position is the one clock for everything on screen (dancers, worlds, camera): the 3D scene
// reads `engine.time()` every frame and evaluates pure functions of it, so pause, seek and restart can never desync.
// A "manual" clock (reel capture) replaces the audio clock with a scripted time.
import { analyse, type Analysis } from './analysis';

type Listener = () => void;
class Engine {
  ctx: AudioContext | null = null;
  buffer: AudioBuffer | null = null;
  analysis: Analysis | null = null;
  trackId = '';
  private src: AudioBufferSourceNode | null = null;
  private gain: GainNode | null = null;
  recordDest: MediaStreamAudioDestinationNode | null = null;
  private startedAt = 0;      // ctx time when offset 0 would have played
  private offset = 0;         // song position while paused
  playing = false;
  offsetMs = 0;               // manual beat-offset correction (slider), applied to the visual clock
  manual: number | null = null;
  private listeners = new Set<Listener>();
  private cache = new Map<string, { buffer: AudioBuffer; analysis: Analysis }>();

  private ensure() {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.gain = this.ctx.createGain(); this.gain.connect(this.ctx.destination);
      this.recordDest = this.ctx.createMediaStreamDestination(); this.gain.connect(this.recordDest);
    }
    return this.ctx;
  }
  on(l: Listener) { this.listeners.add(l); return () => { this.listeners.delete(l); }; }
  private emit() { this.listeners.forEach((l) => l()); }

  async load(id: string, data: ArrayBuffer | string, bpmHint?: number) {
    const ctx = this.ensure();
    this.stop();
    let hit = this.cache.get(id);
    if (!hit) {
      const bytes = typeof data === 'string' ? await (await fetch(encodeURI(data))).arrayBuffer() : data;
      const buffer = await ctx.decodeAudioData(bytes);
      hit = { buffer, analysis: analyse(buffer, bpmHint) };
      this.cache.set(id, hit);
    }
    this.buffer = hit.buffer; this.analysis = hit.analysis; this.trackId = id; this.offset = 0;
    this.emit();
    return hit.analysis;
  }
  play() {
    const ctx = this.ensure(); if (!this.buffer || this.playing) return;
    void ctx.resume();
    const s = ctx.createBufferSource(); s.buffer = this.buffer; s.connect(this.gain!);
    s.onended = () => { if (this.src === s && this.playing && this.time() >= this.buffer!.duration - 0.05) { this.playing = false; this.offset = 0; this.emit(); } };
    s.start(0, this.offset); this.src = s; this.startedAt = ctx.currentTime - this.offset; this.playing = true; this.emit();
  }
  pause() { if (!this.playing) return; this.offset = this.rawTime(); this.stopSource(); this.playing = false; this.emit(); }
  stop() { this.stopSource(); this.playing = false; this.offset = 0; this.emit(); }
  seek(t: number) { const was = this.playing; this.stopSource(); this.playing = false; this.offset = Math.max(0, Math.min(t, this.buffer?.duration ?? 0)); if (was) this.play(); else this.emit(); }
  private stopSource() { if (this.src) { this.src.onended = null; try { this.src.stop(); } catch { /* already stopped */ } this.src.disconnect(); this.src = null; } }
  private rawTime() { return this.playing && this.ctx ? this.ctx.currentTime - this.startedAt : this.offset; }
  /** the visual clock: song position (or the scripted reel time), with the manual offset correction */
  time() { return this.manual ?? Math.max(0, this.rawTime() + this.offsetMs / 1000); }
  duration() { return this.buffer?.duration ?? 0; }
}
export const engine = new Engine();
