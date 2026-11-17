"""ENGINE.EXE reel soundtrack: original and synthesized (no samples), on the picture's own clock.
  voice   audio/out/<id>.wav at SCENE_TIMINGS line starts
  score   120 BPM: a soft four-on-the-floor pulse, a bass on the root, a pad; full in the hook, thinner under the
          voice, a lift on the four strokes, out on the CTA ring
  sfx     from audio/events.json (scripts/dump_events.mjs, the same director the picture uses): a crackle on every
          spark, a thud on every burn, a click on every valve closing, an impact on every cut, a tape-stop on "slow",
          a whoosh on explode, a clunk on assemble
Master: stereo two-pass loudnorm -14 LUFS / -1.5 dBTP -> audio/mix.wav
    python scripts/audio/mix_engine.py
"""
import json, pathlib, re, subprocess

import numpy as np
import soundfile as sf
from scipy.signal import butter, resample_poly, sosfilt

ROOT = pathlib.Path(__file__).resolve().parents[2]
TM = json.loads((ROOT / "SCENE_TIMINGS.json").read_text(encoding="utf-8"))
EV = json.loads((ROOT / "audio/events.json").read_text(encoding="utf-8"))["events"]
SR = 48000; DUR = TM["duration"]; N = int(DUR * SR); BEAT = 0.5
SEC = {s["id"]: s for s in TM["sections"]}
rng = np.random.default_rng(20261115)
def T(n): return np.arange(n) / SR
def bp(x, a, b): return sosfilt(butter(2, [a, min(b, SR * 0.45)], "band", fs=SR, output="sos"), x)
def lp(x, f): return sosfilt(butter(2, f, "low", fs=SR, output="sos"), x)
def hp(x, f): return sosfilt(butter(2, f, "high", fs=SR, output="sos"), x)
def put(buf, x, t, g=1.0, pan=0.0):
    if x.ndim == 1: x = np.stack([x * min(1, 1 - pan), x * min(1, 1 + pan)], 1)
    i = int(round(t * SR))
    if i >= len(buf) or i + len(x) <= 0: return
    a = max(0, -i); j = max(0, i); m = min(len(x) - a, len(buf) - j); buf[j:j + m] += x[a:a + m] * g

# ---------------- score ----------------
def kick(g=1.0):
    n = int(0.32 * SR); t = T(n); f = 48 + 90 * np.exp(-t * 30)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.13) * g
def hat(g=1.0):
    n = int(0.05 * SR); return hp(rng.standard_normal(n), 7000) * np.exp(-T(n) / 0.012) * g * 0.35
def note(midi, L, g=1.0, kind="bass"):
    n = int(L * SR); t = T(n); f = 440 * 2 ** ((midi - 69) / 12)
    if kind == "bass":
        x = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(4 * np.pi * f * t); env = np.minimum(1, t / 0.01) * np.exp(-t / 0.35)
    else:
        x = sum(np.sin(2 * np.pi * f * k * t + k) / k for k in (1, 2, 3)) * (1 + 0.004 * np.sin(2 * np.pi * 5 * t))
        x = lp(x, 2400); env = np.minimum(1, t / 0.4) * np.minimum(1, (L - t) / 0.5)
    return x * env * g
PROG = [(45, [57, 60, 64]), (41, [57, 60, 65]), (43, [55, 59, 62]), (40, [55, 59, 64])]   # Am F G Em
def level(t):
    """how full the score is at t: full hook, thin under the explanations, a lift on the strokes, out at the end"""
    if t < SEC["slow"]["t0"]: return 1.0
    if t < SEC["s1"]["t0"]: return 0.62
    if t < SEC["live"]["t0"]: return 0.85
    if t < SEC["cta"]["t0"]: return 0.7
    return max(0.0, 0.7 * (1 - (t - SEC["cta"]["t0"]) / (DUR - SEC["cta"]["t0"])) ** 1.5)
def music():
    out = np.zeros((N, 2)); t = 0.0; k = 0
    # a quiet workshop room tone under everything: never a silent frame
    room = lp(rng.standard_normal(N), 500) * 0.02 + bp(rng.standard_normal(N), 120, 260) * 0.012
    out[:, 0] += room; out[:, 1] += np.roll(room, 1800)
    while t < DUR - 0.2:
        lv = level(t)
        put(out, kick(0.9 * lv), t)
        if lv > 0.75 or k % 2: put(out, hat(lv), t + BEAT / 2, pan=0.25)
        if k % 2 == 0:
            root, chord = PROG[(k // 8) % 4]
            put(out, note(root, BEAT * 1.9, 0.42 * lv, "bass"), t)
        if k % 8 == 0:
            root, chord = PROG[(k // 8) % 4]
            # pads overlap the next chord by a beat, so the bed never dips between them
            for i, m in enumerate(chord): put(out, note(m, BEAT * 9.2, 0.055 * max(lv, 0.35), "pad"), t - 0.3, pan=-0.3 + 0.3 * i)
        t += BEAT; k += 1
    return out

# ---------------- sfx from the picture's events ----------------
def crackle(g=1.0):
    n = int(0.06 * SR); z = np.zeros(n); idx = rng.random(n) < 0.08; z[idx] = rng.uniform(-1, 1, idx.sum())
    return (hp(z, 3000) * 2.2 + bp(rng.standard_normal(n), 4000, 12000) * np.exp(-T(n) / 0.008) * 0.6) * g
def thud(g=1.0):
    n = int(0.42 * SR); t = T(n); f = 42 + 85 * np.exp(-t * 22)
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.12) + lp(rng.standard_normal(n), 600) * np.exp(-t / 0.03) * 0.5) * g
def click(g=1.0):
    n = int(0.05 * SR); t = T(n)
    return (np.sin(2 * np.pi * 2600 * t) * np.exp(-t / 0.006) + bp(rng.standard_normal(n), 1500, 6000) * np.exp(-t / 0.004) * 0.6) * g
def impact(g=1.0):
    n = int(0.6 * SR); t = T(n); f = 60 + 180 * np.exp(-t * 18)
    whoosh_n = int(0.18 * SR)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.18) * 0.8 + bp(rng.standard_normal(n), 300, 5000) * np.exp(-t / 0.05) * 0.5
    return body * g, whoosh_n
def whoosh(L=0.5, up=True, g=1.0):
    n = int(L * SR); t = T(n); x = rng.standard_normal(n); env = np.sin(np.pi * t / L) ** 2
    lo = np.linspace(400, 3000, n) if up else np.linspace(3000, 400, n)
    out = np.zeros(n)
    for i in range(0, n, 2048):
        out[i:i + 2048] = bp(x[i:i + 2048], lo[i] * 0.7, lo[i] * 1.6)
    return out * env * g
def tapestop(L=1.1, g=1.0):
    n = int(L * SR); t = T(n); f = 220 * (1 - t / L) ** 1.6 + 20
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.4 * np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR))) * np.exp(-t / (L * 0.7)) * g * 0.35
def chime(g=1.0):
    n = int(1.4 * SR); t = T(n)
    return sum(np.sin(2 * np.pi * f * t) * np.exp(-t / d) for f, d in ((880, 0.6), (1318.5, 0.45), (1760, 0.3))) * g * 0.25

def sfx():
    out = np.zeros((N, 2)); counts = {}
    for e in EV:
        k, t = e["kind"], e["t"]
        counts[k] = counts.get(k, 0) + 1
        if k == "spark": put(out, crackle(0.5), t, pan=0.15)
        elif k == "burn": put(out, thud(0.7 * e.get("k", 1)), t)
        elif k == "valve": put(out, click(0.16), t, pan=-0.35 if e.get("which") == "intake" else 0.35)
        elif k == "cut":
            body, wn = impact(0.55); put(out, whoosh(0.18, True, 0.16), t - 0.18); put(out, body, t)
        elif k == "slow": put(out, tapestop(1.2, 0.9), t)
        elif k == "explode": put(out, whoosh(0.9, True, 0.5), t); put(out, impact(0.4)[0], t + 0.9)
        elif k == "assemble": put(out, whoosh(0.8, False, 0.45), t); put(out, thud(0.9), t + 0.8)
        elif k == "cta": put(out, chime(0.9), t)
    return out, counts

def voices():
    out = np.zeros((N, 2))
    for l in TM["lines"]:
        y, sr = sf.read(ROOT / "audio/out" / f"{l['id']}.wav")
        if y.ndim > 1: y = y.mean(1)
        y = resample_poly(y, SR, sr) if sr != SR else y
        put(out, y, l["start"])
    return out

def master(x, path):
    raw = path.with_suffix(".raw.wav"); sf.write(raw, x * 0.5, SR, subtype="FLOAT")
    a = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(raw), "-af", "loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"], capture_output=True, text=True).stderr
    m = json.loads(a[a.rindex("{"):a.rindex("}") + 1])
    af = (f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}:"
          f"measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true")
    subprocess.run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", str(raw), "-af", af, "-ar", str(SR), "-ac", "2", "-c:a", "pcm_s16le", str(path)], check=True); raw.unlink()
    r = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(path), "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True).stderr
    return float(re.findall(r"I:\s+(-?[\d.]+) LUFS", r)[-1]), float(re.findall(r"Peak:\s+(-?[\d.]+) dBFS", r)[-1])

def main():
    mus, (fx, counts), vox = music(), sfx(), voices()
    env = np.abs(vox).max(1); w = int(0.25 * SR); env = np.convolve(env, np.ones(w) / w, "same")
    duck = (1 - 0.62 * np.clip(env / 0.05, 0, 1))[:, None]
    mix = vox * 1.0 + mus * 0.42 * duck + fx * 0.6 * (0.55 + 0.45 * duck)
    I, pk = master(mix, ROOT / "audio/mix.wav")
    print(f"mix {I:.1f} LUFS, true peak {pk:.1f} dBFS | events {counts}")

if __name__ == "__main__":
    main()
