"""ENGINE.EXE video carousel: an original synthesized score (no samples, no commercial music) for the 4 looping slides.
Each slide is 6 s = 3 bars of 4/4 at 120 BPM, rendered circularly (tails fold back into the head), so the sound loops
as seamlessly as the picture. SFX land on the simulator's own event times for each slide's crank law (main.js):
  1  theta = 372 + 240 t   spark at 350 + 720k, burn at 360 + 720k
  2  theta = 100 + 120 t   valve events IC 220, EO 500, IO 710, EC 730; burn at 360
  3  tile i restarts when (t/6 + 0.125 + i/4) mod 1 = 0
  4  explode = 0.5 + 0.5 cos(2 pi t / 6): assembled at t = 3
Writes out/engine_carousel_<n>_1080x1350_music.mp4 (video stream copied, AAC 48 kHz, two-pass loudnorm -14 LUFS / -1.5 dBTP).
    python carousel/score_carousel.py
"""
import json, pathlib, subprocess

import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfilt

HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE / "out"
SR = 48000; L = 6.0; N = int(L * SR); BEAT = 0.5
rng = np.random.default_rng(20261117)
def T(n): return np.arange(n) / SR
def lp(x, f): return sosfilt(butter(2, f, "low", fs=SR, output="sos"), x)
def hp(x, f): return sosfilt(butter(2, f, "high", fs=SR, output="sos"), x)
def bp(x, a, b): return sosfilt(butter(2, [a, b], "band", fs=SR, output="sos"), x)
def put(buf, x, t, g=1.0, pan=0.0):
    """circular placement: anything past the loop end wraps to the start"""
    if x.ndim == 1: x = np.stack([x * min(1, 1 - pan), x * min(1, 1 + pan)], 1)
    i = int(round((t % L) * SR)) % N
    idx = (np.arange(len(x)) + i) % N
    np.add.at(buf, idx, x * g)

def kick():
    n = int(0.3 * SR); t = T(n); f = 46 + 95 * np.exp(-t * 32)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.12)
def hat(open_=False):
    n = int((0.12 if open_ else 0.04) * SR); return hp(rng.standard_normal(n), 7500) * np.exp(-T(n) / (0.04 if open_ else 0.01)) * 0.3
def clap():
    n = int(0.18 * SR); t = T(n); z = bp(rng.standard_normal(n), 900, 4000)
    env = sum(np.exp(-np.maximum(t - d, 0) / 0.012) * (t >= d) for d in (0, 0.011, 0.022)) + np.exp(-t / 0.06) * 0.6
    return z * env * 0.5
def tone(midi, dur, kind):
    n = int(dur * SR); t = T(n); f = 440 * 2 ** ((midi - 69) / 12)
    if kind == "bass":
        x = np.tanh(1.6 * (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(4 * np.pi * f * t))); env = np.minimum(1, t / 0.006) * np.exp(-t / 0.28)
        return lp(x, 900) * env
    if kind == "pluck":
        saw = 2 * ((f * t) % 1) - 1; env = np.exp(-t / 0.09) * np.minimum(1, t / 0.002)
        return lp(saw, 2600) * env
    x = sum(np.sin(2 * np.pi * f * k * t + k) / k for k in (1, 2, 3)) * (1 + 0.004 * np.sin(2 * np.pi * 5 * t))
    return lp(x, 2000) * np.minimum(1, t / 0.35) * np.minimum(1, np.maximum(dur - t, 0) / 0.4)

# A minor, 3 bars: Am (bar 1) F (bar 2) G -> E (bar 3) leads back to Am at the loop point
BARS = [(45, [57, 60, 64]), (41, [57, 60, 65]), (43, [55, 59, 62])]
ARP = [0, 2, 1, 2]
def music(energy=1.0):
    out = np.zeros((N, 2))
    for b, (root, chord) in enumerate(BARS):
        t0 = b * 4 * BEAT
        for m in chord: put(out, tone(m, 4 * BEAT + 0.4, "pad"), t0, 0.05)
        for k in range(4):
            tb = t0 + k * BEAT
            put(out, kick(), tb, 0.9)
            if k in (1, 3): put(out, clap(), tb, 0.55 * energy)
            put(out, hat(k == 3 and b == 2), tb + BEAT / 2, 0.8, pan=0.25)
            r = root if not (b == 2 and k >= 2) else 40   # G -> E turnaround
            put(out, tone(r, BEAT * 0.9, "bass"), tb, 0.42)
            put(out, tone(r + 12, BEAT * 0.4, "bass"), tb + BEAT / 2, 0.22)
        for s in range(16):                               # 16th-note arpeggio, the "machine" in the score
            m = chord[ARP[s % 4]] + (12 if s % 8 == 7 else 0)
            put(out, tone(m + 12, 0.2, "pluck"), t0 + s * BEAT / 4, 0.09 * energy, pan=-0.35 + 0.7 * ((s % 4) / 3))
    return out

# ---- sfx on the model's events
def thud(g=1.0):
    n = int(0.42 * SR); t = T(n); f = 40 + 90 * np.exp(-t * 22)
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.12) + lp(rng.standard_normal(n), 600) * np.exp(-t / 0.03) * 0.5) * g
def crackle(g=1.0):
    n = int(0.06 * SR); z = np.zeros(n); idx = rng.random(n) < 0.08; z[idx] = rng.uniform(-1, 1, idx.sum())
    return hp(z, 3000) * 2.2 * g
def click(g=1.0):
    n = int(0.05 * SR); t = T(n); return (np.sin(2 * np.pi * 2600 * t) * np.exp(-t / 0.006) + bp(rng.standard_normal(n), 1500, 6000) * np.exp(-t / 0.004) * 0.6) * g
def whoosh(dur, up, g=1.0):
    n = int(dur * SR); t = T(n); x = rng.standard_normal(n); env = np.sin(np.pi * t / dur) ** 2
    lo = np.linspace(400, 3000, n) if up else np.linspace(3000, 400, n); y = np.zeros(n)
    for i in range(0, n, 2048): y[i:i + 2048] = bp(x[i:i + 2048], lo[i] * 0.7, lo[i] * 1.6)
    return y * env * g

def events(n):
    """(time, kind, extra) from each slide's crank law in main.js"""
    ev = []
    if n == 1:
        th = lambda a: (a - 372) / 240
        for k in (1, 2): ev += [(th(350 + 720 * k), "spark", 0), (th(360 + 720 * k), "burn", 0)]
        for a in (220, 500, 710, 730): ev += [(th(a + 720 * j), "valve", a) for j in range(3) if 0 <= th(a + 720 * j) < L]
    elif n == 2:
        th = lambda a: (a - 100) / 120
        ev += [(th(350), "spark", 0), (th(360), "burn", 0)] + [(th(a), "valve", a) for a in (220, 500, 710, 730)]
    elif n == 3:
        ev += [((L * (0.875 - i / 4)) % L, "tick", i) for i in range(4)]
    elif n == 4:
        ev += [(0.0, "whoosh_in", 0), (3.0 - 0.02, "clunk", 0), (3.0, "whoosh_out", 0)]
    return [e for e in ev if 0 <= e[0] < L + 0.5]

def sfx(n):
    out = np.zeros((N, 2))
    for t, k, x in events(n):
        if k == "spark": put(out, crackle(0.5), t, pan=0.15)
        elif k == "burn": put(out, thud(0.8), t)
        elif k == "valve": put(out, click(0.18), t, pan=-0.35 if x in (220, 710) else 0.35)
        elif k == "tick": put(out, click(0.28), t, pan=-0.4 + 0.27 * x)
        elif k == "whoosh_in": put(out, whoosh(2.9, False, 0.22), t + 0.05)
        elif k == "whoosh_out": put(out, whoosh(2.9, True, 0.22), t)
        elif k == "clunk": put(out, thud(0.9), t)
    return out

def loudnorm(raw, dst):
    a = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(raw), "-af", "loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"], capture_output=True, text=True).stderr
    m = json.loads(a[a.rindex("{"):a.rindex("}") + 1])
    af = (f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}:"
          f"measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true")
    subprocess.run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", str(raw), "-af", af, "-ar", str(SR), "-ac", "2", str(dst)], check=True)

def main():
    (OUT / "audio").mkdir(parents=True, exist_ok=True)
    for n in (1, 2, 3, 4):
        mix = music(1.0 if n in (1, 4) else 0.8) * 0.5 + sfx(n) * 0.6
        # loudnorm needs > 3 s of context to settle: measure and normalise three loops, keep the middle one
        raw = OUT / "audio" / f"s{n}.raw.wav"; sf.write(raw, np.tile(mix * 0.5, (3, 1)), SR, subtype="FLOAT")
        norm = OUT / "audio" / f"s{n}.norm.wav"; loudnorm(raw, norm)
        y, _ = sf.read(norm); y = y[N:2 * N]; wav = OUT / "audio" / f"engine_carousel_{n}.wav"; sf.write(wav, y, SR, subtype="PCM_16")
        raw.unlink(); norm.unlink()
        vid = OUT / f"engine_carousel_{n}_1080x1350.mp4"; dst = OUT / f"engine_carousel_{n}_1080x1350_music.mp4"
        subprocess.run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", str(vid), "-i", str(wav), "-map", "0:v", "-map", "1:a", "-c:v", "copy",
                        "-c:a", "aac", "-b:a", "192k", "-ar", str(SR), "-shortest", "-movflags", "+faststart", str(dst)], check=True)
        r = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(dst), "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True).stderr
        import re
        I = float(re.findall(r"I:\s+(-?[\d.]+) LUFS", r)[-1]); pk = float(re.findall(r"Peak:\s+(-?[\d.]+) dBFS", r)[-1])
        print(f"slide {n}: {I:.1f} LUFS, peak {pk:.1f} dBFS, events {[(round(t, 2), k) for t, k, _ in events(n)]} -> {dst.name}")

if __name__ == "__main__":
    main()
