"""Breakdown X-ray sound: Liam over the REAL stems the kit separated from our 18-repos reel (work/stems: drums + bass
+ other, the vocal stem left out), placed so the picture and sound agree:
  hook     film 31 s on (the full orchestra, matching the kit still at 0:31)
  steps    a low bed from film 20 s on
  payoff   film 1 s on, full level: the metronome becomes a kick, then hats, in sync with the kit's frames
  full     film 50 s on;  cta: rings out
plus a whoosh on every scene start. -14 LUFS / -1.5 dBTP -> public/audio/mix.wav
"""
import json, pathlib, re, subprocess
import numpy as np, soundfile as sf
from scipy.signal import butter, resample_poly, sosfilt
ROOT = pathlib.Path(__file__).resolve().parents[2]
TM = json.loads((ROOT / "SCENE_TIMINGS.json").read_text(encoding="utf-8")); S = {s["id"]: s for s in TM["sections"]}
SR = 48000; DUR = TM["duration"]; N = int(DUR * SR) + SR; rng = np.random.default_rng(5)
def dec(p):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(p), "-ac", "2", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, 2).astype(float)
inst = sum(dec(ROOT / "work/stems" / f"{k}.mp3") for k in ("drums", "bass", "other"))
def seg(src_t, n_s): a = int(src_t * SR); return inst[a:a + int(n_s * SR)]
def put(buf, x, t, g=1.0):
    i = int(t * SR); m = min(len(x), len(buf) - i)
    if m > 0: buf[i:i + m] += x[:m] * g
def fade(x, fi=0.08, fo=0.12):
    x = x.copy(); a, b = int(fi * SR), int(fo * SR)
    if len(x) > a + b: x[:a] *= np.linspace(0, 1, a)[:, None]; x[-b:] *= np.linspace(1, 0, b)[:, None]
    return x
bed = np.zeros((N, 2))
h = S["hook"]; put(bed, fade(seg(31, h["t1"] - h["t0"])), h["t0"], 0.9)
st0, st1 = S["skill"]["t0"], S["payoff"]["t0"]; put(bed, fade(seg(20, st1 - st0)), st0, 0.45)
p = S["payoff"]; put(bed, fade(seg(1, p["t1"] - p["t0"]), 0.02), p["t0"], 1.0)
f = S["full"]; c = S["cta"]; L = DUR - f["t0"]; x = fade(seg(50, L), 0.03, 1.5); put(bed, x, f["t0"], 1.0)
fx = np.zeros((N, 2))
def whoosh(L=0.25):
    n = int(L * SR); z = rng.standard_normal(n); env = np.sin(np.pi * np.arange(n) / n) ** 2; y = np.zeros(n); lo = np.linspace(500, 4000, n)
    for i in range(0, n, 1024): y[i:i + 1024] = sosfilt(butter(2, [lo[i] * .7, lo[i] * 1.5], "band", fs=SR, output="sos"), z[i:i + 1024])
    return np.stack([y * env] * 2, 1)
for s in TM["sections"][1:]: put(fx, whoosh(), s["t0"] - 0.22, 0.25)
vox = np.zeros((N, 2))
for l in TM["lines"]:
    y, sr = sf.read(ROOT / "audio/out" / f"{l['id']}.wav"); y = y.mean(1) if y.ndim > 1 else y; y = resample_poly(y, SR, sr) if sr != SR else y
    y *= .12 / (np.sqrt(np.mean(y[np.abs(y) > .01] ** 2)) + 1e-9); put(vox, np.stack([y, y], 1), l["start"])
env = np.convolve(np.abs(vox).max(1), np.ones(12000) / 12000, "same"); duck = (1 - .6 * np.clip(env / .04, 0, 1))[:, None]
mix = (vox + bed * .5 * duck + fx * .5)[: int(DUR * SR)]
raw = ROOT / "audio/raw.wav"; sf.write(raw, mix * .5, SR, subtype="FLOAT")
a = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(raw), "-af", "loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"], capture_output=True, text=True).stderr
m = json.loads(a[a.rindex("{"):a.rindex("}") + 1]); dst = ROOT / "public/audio/mix.wav"
af = f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true"
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(raw), "-af", af, "-ar", str(SR), "-ac", "2", "-c:a", "pcm_s16le", str(dst)], check=True); raw.unlink()
r = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(dst), "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True).stderr
print("mix", re.findall(r"I:\s+(-?[\d.]+) LUFS", r)[-1], "LUFS, peak", re.findall(r"Peak:\s+(-?[\d.]+) dBFS", r)[-1])
