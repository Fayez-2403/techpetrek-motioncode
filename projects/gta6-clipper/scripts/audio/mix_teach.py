"""Teach reel sound: Liam + an original 120 BPM bed (kick, hats, bass) that drops out while the finished clip plays its
own audio (the 'result' section), a whoosh + thump on every step, a chime on the CTA. -14 LUFS / -1.5 dBTP.
    python scripts/audio/mix_teach.py  -> public/audio/teach_mix.wav
"""
import json, pathlib, re, subprocess
import numpy as np, soundfile as sf
from scipy.signal import butter, resample_poly, sosfilt

ROOT = pathlib.Path(__file__).resolve().parents[2]
TM = json.loads((ROOT / "SCENE_TIMINGS.json").read_text(encoding="utf-8"))
SR = 48000; DUR = TM["duration"]; N = int(DUR * SR); B = 0.5
S = {s["id"]: s for s in TM["sections"]}; rng = np.random.default_rng(7)
def T(n): return np.arange(n) / SR
def lp(x, f): return sosfilt(butter(2, f, "low", fs=SR, output="sos"), x)
def hp(x, f): return sosfilt(butter(2, f, "high", fs=SR, output="sos"), x)
def bp(x, a, b): return sosfilt(butter(2, [a, b], "band", fs=SR, output="sos"), x)
def put(buf, x, t, g=1.0):
    if x.ndim == 1: x = np.stack([x, x], 1)
    i = int(round(t * SR)); a = max(0, -i); j = max(0, i); m = min(len(x) - a, len(buf) - j)
    if m > 0: buf[j:j + m] += x[a:a + m] * g
def kick(): n = int(.3 * SR); t = T(n); f = 46 + 100 * np.exp(-t * 30); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / .13)
def hat(): n = int(.045 * SR); return hp(rng.standard_normal(n), 7500) * np.exp(-T(n) / .011) * .3
def bass(m): n = int(.9 * SR); t = T(n); f = 440 * 2 ** ((m - 69) / 12); return lp(np.tanh(1.5 * np.sin(2 * np.pi * f * t)), 900) * np.exp(-t / .3)
def whoosh(L=.25):
    n = int(L * SR); x = rng.standard_normal(n); env = np.sin(np.pi * T(n) / L) ** 2; y = np.zeros(n); lo = np.linspace(500, 4000, n)
    for i in range(0, n, 1024): y[i:i + 1024] = bp(x[i:i + 1024], lo[i] * .7, lo[i] * 1.5)
    return y * env
def thump(): n = int(.3 * SR); t = T(n); f = 42 + 80 * np.exp(-t * 26); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / .1)
def chime(): n = int(1.4 * SR); t = T(n); return sum(np.sin(2 * np.pi * f * t) * np.exp(-t / d) for f, d in ((880, .6), (1318.5, .45), (1760, .3))) * .25

bed = np.zeros((N, 2)); room = lp(rng.standard_normal(N), 420) * .07 + bp(rng.standard_normal(N), 150, 400) * .03; bed += room[:, None]
r0, r1 = S["result"]["t0"], S["result"]["t1"]; k = 0; t = 0.0
while t < DUR - .2:
    if not (r0 - .1 <= t < r1):
        lv = 1.0 if t < S["cta"]["t0"] else max(0, 1 - (t - S["cta"]["t0"]) / 3.4)
        put(bed, kick(), t, .9 * lv); put(bed, hat(), t + B / 2, .8 * lv)
        if k % 2 == 0: put(bed, bass([45, 41, 48, 43][(k // 8) % 4]), t, .35 * lv)
    t += B; k += 1
fx = np.zeros((N, 2))
for s in TM["sections"][1:]: put(fx, whoosh(), s["t0"] - .2, .3); put(fx, thump(), s["t0"], .5)
put(fx, chime(), S["cta"]["t0"] + .6, .9)
vox = np.zeros((N, 2))
for l in TM["lines"]:
    y, sr = sf.read(ROOT / "audio/out" / f"{l['id']}.wav"); y = y.mean(1) if y.ndim > 1 else y; y = resample_poly(y, SR, sr) if sr != SR else y
    y *= .12 / (np.sqrt(np.mean(y[np.abs(y) > .01] ** 2)) + 1e-9); put(vox, y, l["start"])
env = np.convolve(np.abs(vox).max(1), np.ones(12000) / 12000, "same"); duck = (1 - .55 * np.clip(env / .04, 0, 1))[:, None]
mix = vox + bed * .42 * duck + fx * .5
raw = ROOT / "audio/teach_raw.wav"; sf.write(raw, mix * .5, SR, subtype="FLOAT")
a = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(raw), "-af", "loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"], capture_output=True, text=True).stderr
m = json.loads(a[a.rindex("{"):a.rindex("}") + 1]); dst = ROOT / "public/audio/teach_mix.wav"
af = f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true"
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(raw), "-af", af, "-ar", str(SR), "-ac", "2", "-c:a", "pcm_s16le", str(dst)], check=True); raw.unlink()
print("teach mix ->", dst)
