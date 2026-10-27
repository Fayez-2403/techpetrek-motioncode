// Offline song analysis (one pass when a track loads). Real measurements only, no stem separation:
//  - band energies from a 1024-point FFT at 100 frames/s: bass 20-150 Hz, mid 150-2000 Hz, high 2-10 kHz (frequency-band
//    approximations, not isolated instruments), plus RMS loudness
//  - onset strength = positive spectral flux; kick ~ bass-band flux, snare ~ mid-band flux (approximations, labelled so)
//  - tempo by autocorrelation of the onset curve (60-180 BPM, a mild prior toward the 100-130 dance range), beat phase by
//    comb filtering, then each beat snapped to the strongest onset within +-35 ms
//  - downbeats: the beat phase (mod 4) with the most bass energy; sections: 4-bar loudness blocks, "drop" = a big rise
export interface Analysis {
  duration: number; bpm: number; beats: number[]; downbeats: number[]; fps: number;
  bass: Float32Array; mid: Float32Array; high: Float32Array; rms: Float32Array; onset: Float32Array; kick: Float32Array; snare: Float32Array;
  sections: { t0: number; t1: number; level: number; drop: boolean }[];
}
const FPS = 100, N = 1024;

function fft(re: Float32Array, im: Float32Array) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) { let b = n >> 1; for (; j & b; b >>= 1) j ^= b; j ^= b; if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; } }
  for (let len = 2; len <= n; len <<= 1) {
    const a = (-2 * Math.PI) / len, wr = Math.cos(a), wi = Math.sin(a);
    for (let i = 0; i < n; i += len) {
      let cr = 1, ci = 0;
      for (let k = 0; k < len / 2; k++) {
        const ur = re[i + k], ui = im[i + k], vr = re[i + k + len / 2] * cr - im[i + k + len / 2] * ci, vi = re[i + k + len / 2] * ci + im[i + k + len / 2] * cr;
        re[i + k] = ur + vr; im[i + k] = ui + vi; re[i + k + len / 2] = ur - vr; im[i + k + len / 2] = ui - vi;
        const t = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = t;
      }
    }
  }
}
const norm = (a: Float32Array) => { let m = 1e-9; for (const v of a) m = Math.max(m, v); for (let i = 0; i < a.length; i++) a[i] /= m; return a; };
const smooth = (a: Float32Array, k: number) => { const o = new Float32Array(a.length); let s = 0; for (let i = 0; i < a.length; i++) { s += a[i] - (i >= k ? a[i - k] : 0); o[i] = s / Math.min(k, i + 1); } return o; };

export function analyse(buf: AudioBuffer, hintBpm?: number): Analysis {
  const sr = buf.sampleRate, ch = buf.numberOfChannels;
  const mono = new Float32Array(buf.length);
  for (let c = 0; c < ch; c++) { const d = buf.getChannelData(c); for (let i = 0; i < d.length; i++) mono[i] += d[i] / ch; }
  const hop = Math.round(sr / FPS), frames = Math.floor((mono.length - N) / hop);
  const bass = new Float32Array(frames), mid = new Float32Array(frames), high = new Float32Array(frames), rms = new Float32Array(frames);
  const onset = new Float32Array(frames), kick = new Float32Array(frames), snare = new Float32Array(frames);
  const win = new Float32Array(N).map((_, i) => 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (N - 1)));
  const re = new Float32Array(N), im = new Float32Array(N), prev = new Float32Array(N / 2);
  const bin = (hz: number) => Math.round((hz * N) / sr);
  const [b0, b1, b2, b3] = [bin(20), bin(150), bin(2000), bin(10000)];
  for (let f = 0; f < frames; f++) {
    let e = 0;
    for (let i = 0; i < N; i++) { const s = mono[f * hop + i]; re[i] = s * win[i]; im[i] = 0; e += s * s; }
    rms[f] = Math.sqrt(e / N);
    fft(re, im);
    let sb = 0, sm = 0, sh = 0, fl = 0, fb = 0, fm = 0;
    for (let k = 1; k < N / 2; k++) {
      const m = Math.log1p(10 * Math.hypot(re[k], im[k]));
      const d = Math.max(0, m - prev[k]); prev[k] = m;
      if (k >= b0 && k < b1) { sb += m; fb += d; } else if (k < b2) { sm += m; fm += d; } else if (k < b3) sh += m;
      if (k < b3) fl += d;
    }
    bass[f] = sb / (b1 - b0); mid[f] = sm / (b2 - b1); high[f] = sh / (b3 - b2); onset[f] = fl; kick[f] = fb; snare[f] = fm;
  }
  [bass, mid, high, rms].forEach(norm);
  // onset curve minus its local mean (adaptive threshold)
  const loc = smooth(onset, 40);
  const ons = new Float32Array(frames).map((_, i) => Math.max(0, onset[i] - loc[i]));
  norm(ons); norm(kick); norm(snare);
  // tempo
  let bestLag = 48, bestScore = -1;
  for (let lag = Math.round((60 / 180) * FPS); lag <= Math.round((60 / 60) * FPS); lag++) {
    let r = 0; for (let i = 0; i + lag < frames; i++) r += ons[i] * ons[i + lag];
    const bpm = (60 * FPS) / lag, prior = Math.exp(-0.5 * ((Math.log2(bpm / (hintBpm ?? 118))) / 0.5) ** 2);
    const score = (r / (frames - lag)) * (0.6 + 0.4 * prior);
    if (score > bestScore) { bestScore = score; bestLag = lag; }
  }
  // refine the period to a fraction of a frame with a parabolic fit
  const ac = (lag: number) => { let r = 0; for (let i = 0; i + lag < frames; i++) r += ons[i] * ons[i + lag]; return r; };
  const y0 = ac(bestLag - 1), y1 = ac(bestLag), y2 = ac(bestLag + 1);
  let period = bestLag + (0.5 * (y0 - y2)) / (y0 - 2 * y1 + y2 || 1e-9);
  // octave check: with a hint (the library BPM), fold half / double time onto the hint's octave; without one, keep 85-170
  { let bpm0 = (60 * FPS) / period;
    if (hintBpm) { for (const k of [2, 0.5]) if (Math.abs(Math.log(bpm0 * k / hintBpm)) < Math.abs(Math.log(bpm0 / hintBpm))) bpm0 *= k; }
    else { while (bpm0 < 85) bpm0 *= 2; while (bpm0 > 170) bpm0 /= 2; }
    period = (60 * FPS) / bpm0; }
  // phase by comb filter
  let bestPh = 0, bestPhScore = -1;
  for (let ph = 0; ph < period; ph += 0.5) {
    let s = 0; for (let t = ph; t < frames; t += period) s += ons[Math.round(t)] ?? 0;
    if (s > bestPhScore) { bestPhScore = s; bestPh = ph; }
  }
  // beats, each snapped to the strongest onset within +-35 ms (keeps the grid steady, follows small drifts)
  const beats: number[] = [];
  let t = bestPh;
  while (t < frames) {
    let bi = Math.round(t), bv = -1;
    for (let k = -3; k <= 3; k++) { const j = Math.round(t) + k; if (j >= 0 && j < frames && ons[j] > bv) { bv = ons[j]; bi = j; } }
    const snapped = bv > 0.25 ? bi : t;
    beats.push(snapped / FPS);
    t = snapped + period;
  }
  // downbeats
  let bestDb = 0, bestDbE = -1;
  for (let k = 0; k < 4; k++) { let e = 0; for (let i = k; i < beats.length; i += 4) e += bass[Math.round(beats[i] * FPS)] ?? 0; if (e > bestDbE) { bestDbE = e; bestDb = k; } }
  const downbeats: number[] = beats.filter((_, i) => i % 4 === bestDb);
  // sections: 4-bar blocks of loudness
  const sections: Analysis['sections'] = [];
  for (let i = 0; i + 16 <= beats.length; i += 16) {
    const a = Math.round(beats[i] * FPS), b = Math.round((beats[i + 16] ?? beats[beats.length - 1]) * FPS);
    let e = 0; for (let j = a; j < b; j++) e += rms[j]; e /= Math.max(1, b - a);
    const prevLevel = sections.length ? sections[sections.length - 1].level : e;
    sections.push({ t0: beats[i], t1: beats[i + 16] ?? buf.duration, level: e, drop: e > prevLevel * 1.12 && e > 0.35 });
  }
  const bpm = (60 * FPS) / period;
  return { duration: buf.duration, bpm, beats, downbeats, fps: FPS, bass, mid, high, rms, onset: ons, kick, snare, sections };
}

/** feature lookups at time t (seconds); all pure, so any seek returns the same values */
export const feat = (a: Analysis, arr: Float32Array, t: number) => arr[Math.max(0, Math.min(arr.length - 1, Math.round(t * a.fps)))] ?? 0;
/** decaying hit envelope from an onset curve: 1 at a peak, falling over `decay` s (looks back 0.4 s) */
export function hitEnv(a: Analysis, arr: Float32Array, t: number, decay = 0.18, thresh = 0.45) {
  let best = 0; const f = Math.round(t * a.fps);
  for (let k = 0; k < 40; k++) { const v = arr[f - k] ?? 0; if (v > thresh) best = Math.max(best, v * Math.exp(-(k / a.fps) / decay)); }
  return best;
}
/** fractional beat index at time t (beats list), linear between beats, extrapolated at the ends */
export function beatPos(a: Analysis, t: number) {
  const B = a.beats; if (B.length < 2) return t * (a.bpm / 60);
  if (t <= B[0]) return (t - B[0]) / (B[1] - B[0]);
  let lo = 0, hi = B.length - 1;
  if (t >= B[hi]) return hi + (t - B[hi]) / (B[hi] - B[hi - 1]);
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (B[m] <= t) lo = m; else hi = m; }
  return lo + (t - B[lo]) / (B[hi] - B[lo]);
}
export function sectionAt(a: Analysis, t: number) { return a.sections.find((s) => t >= s.t0 && t < s.t1) ?? a.sections[a.sections.length - 1]; }
