"""HAPPY DIWALI FROM THE BOTS: the soundtrack, original and synthesized (no samples), on the picture's clock
(src/data/plan.json, written by `npx tsx scripts/dump_plan.ts`).
  score   120 BPM: dhol (dhum + tak) and a shehnai-like lead; enters on the walk, thins under the wishes, full finale
  crackers phuljhari ignition crackle + fizz, rocket whistle -> boom (+ crackle / willow shimmer), anaar hiss,
          chakri whirr, ladi pops, bomb boom
  voices  the four "Happy Diwali!" (audio/out/*.wav from vo_bots.py) + the layered chorus; music ducked under them
Master: stereo two-pass loudnorm -14 LUFS / -1.5 dBTP -> public/audio/mix.wav
    python scripts/audio/mix_diwali.py
"""
import json, pathlib, re, subprocess

import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfilt, resample_poly

ROOT = pathlib.Path(__file__).resolve().parents[2]
P = json.loads((ROOT / "src/data/plan.json").read_text(encoding="utf-8"))
SR = 48000; DUR = P["DURATION"]; N = int(DUR * SR); BEAT = 0.5
rng = np.random.default_rng(20261108)
def T(n): return np.arange(n) / SR
def bp(x, a, b): return sosfilt(butter(2, [a, min(b, SR * 0.45)], "band", fs=SR, output="sos"), x)
def lp(x, f): return sosfilt(butter(2, f, "low", fs=SR, output="sos"), x)
def hp(x, f): return sosfilt(butter(2, f, "high", fs=SR, output="sos"), x)
def put(buf, x, t, g=1.0, pan=0.0):
    if x.ndim == 1: x = np.stack([x * min(1, 1 - pan), x * min(1, 1 + pan)], 1)
    i = int(round(t * SR))
    if i >= len(buf) or i + len(x) <= 0: return
    a = max(0, -i); j = max(0, i); m = min(len(x) - a, len(buf) - j); buf[j:j + m] += x[a:a + m] * g
def pan_of(x): return float(np.clip(x / 3.5, -0.8, 0.8))

# ---------------- score ----------------
def dhum(g=1.0):
    n = int(0.45 * SR); t = T(n); f = 55 + 45 * np.exp(-t * 18)
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.22) + bp(rng.standard_normal(n), 80, 400) * np.exp(-t / 0.02) * 0.4) * g
def tak(g=1.0):
    n = int(0.16 * SR); t = T(n)
    return (bp(rng.standard_normal(n), 900, 5000) * np.exp(-t / 0.03) + np.sin(2 * np.pi * 320 * t) * np.exp(-t / 0.04) * 0.5) * g * 0.6
def shehnai(midi, L, g=1.0):
    n = int(L * SR); t = T(n); f0 = 440 * 2 ** ((midi - 69) / 12) * (1 + 0.012 * np.sin(2 * np.pi * 6 * t) * np.minimum(1, t / 0.25))
    ph = 2 * np.pi * np.cumsum(f0) / SR; x = sum(np.sin(k * ph) / k ** 0.8 for k in range(1, 12))
    x = bp(x, 700, 3200) * 1.3 + lp(x, 1200) * 0.4
    env = np.minimum(1, t / 0.04) * np.minimum(1, (L - t) / 0.08)
    return x * env * g * 0.12
def music():
    out = np.zeros((N, 2))
    w0, stop, ch = P["WALK0"], P["STOP"], P["CHORUS"]
    t = w0; k = 0
    while t < DUR - 0.2:
        full = t < stop or t >= ch - 0.6
        bar = k % 8
        if bar in (0, 3, 6) or (not full and bar == 0): put(out, dhum(0.9 if full else 0.5), t)
        if full and bar in (2, 4, 7): put(out, tak(0.8), t, pan=-0.2)
        if full and bar % 2 == 1: put(out, tak(0.45), t, pan=0.25)
        t += BEAT / 2; k += 1
    # the lead: a festive phrase in Bilawal (C major), on the walk and again in the finale
    phrase = [(72, 1), (74, 1), (76, 2), (79, 1), (76, 1), (74, 1), (72, 1), (74, 2), (76, 1), (79, 1), (81, 2), (79, 2)]
    for start in (w0 + 2 * BEAT, ch - 0.5):
        tt = start
        for m, beats in phrase:
            if tt > DUR - 0.3: break
            put(out, shehnai(m, beats * BEAT * 0.98), tt, pan=0.1); tt += beats * BEAT
    return out

# ---------------- crackers ----------------
def crackle(L, g=1.0, density=0.03):
    n = int(L * SR); z = np.zeros(n); idx = rng.random(n) < density / 10
    z[idx] = rng.uniform(-1, 1, idx.sum()); return hp(z, 2500) * g * 3
def fizz(L, g=1.0):
    n = int(L * SR); x = bp(rng.standard_normal(n), 3000, 11000) * (0.7 + 0.3 * np.abs(np.sin(2 * np.pi * 13 * T(n))))
    return (x + crackle(L, 0.6, 0.02)) * g * np.minimum(1, T(n) / 0.15) * np.minimum(1, (L - T(n)) / 0.3)
def whistle(L=1.05, g=1.0):
    n = int(L * SR); t = T(n); f = 1400 + 1700 * (t / L) ** 0.8
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.6 + bp(rng.standard_normal(n), 1500, 6000) * 0.25) * np.minimum(1, t / 0.08) * g * 0.35
def boom(g=1.0, size=1.0):
    n = int(1.8 * SR); t = T(n); f = 45 + 70 * np.exp(-t * 14)
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / (0.35 * size)) + lp(rng.standard_normal(n), 900) * np.exp(-t / 0.12) * 0.8) * g
def hiss(L, g=1.0, mod=0.0):
    n = int(L * SR); x = bp(rng.standard_normal(n), 1800, 9000) * (1 + mod * np.sin(2 * np.pi * 4.5 * T(n)))
    return x * np.minimum(1, T(n) / 0.3) * np.minimum(1, (L - T(n)) / 0.6) * g
def pop(g=1.0):
    n = int(0.08 * SR); t = T(n); return (bp(rng.standard_normal(n), 600, 6000) * np.exp(-t / 0.012) + np.sin(2 * np.pi * 180 * t) * np.exp(-t / 0.02)) * g

def sfx():
    out = np.zeros((N, 2)); ev = []
    # the night itself, from frame 0: a crowd murmur and distant crackers popping far away (never a silent frame)
    amb = lp(rng.standard_normal(N), 700) * 0.05 + bp(rng.standard_normal(N), 300, 1200) * 0.025 * (1 + 0.5 * np.sin(2 * np.pi * 0.3 * T(N)))
    out[:, 0] += amb; out[:, 1] += np.roll(amb, 2400)
    tt = 0.05
    while tt < DUR:
        put(out, lp(pop(0.12), 1500), tt, pan=float(rng.uniform(-0.9, 0.9))); tt += float(rng.uniform(0.25, 0.9))
    for k, t0 in P["IGNITE"].items():
        x = P["XPOS"][k]; put(out, crackle(0.5, 1.3, 0.12), t0, pan=pan_of(x)); put(out, fizz(DUR - t0, 0.07), t0, pan=pan_of(x)); ev.append((t0, f"ignite {k}"))
    for s in P["SHELLS"]:
        tb = s["t"] + P["RISE"]; pn = pan_of(s["x"])
        put(out, whistle(P["RISE"], 0.9), s["t"], pan=pn)
        put(out, boom(0.9, 1.3 if s["kind"] == "willow" else 1.0), tb, pan=pn); ev.append((tb, f"burst {s['kind']}"))
        if s["kind"] == "crackle": put(out, crackle(1.4, 1.0, 0.06), tb + 0.8, pan=pn)
        if s["kind"] == "willow": put(out, hiss(2.6, 0.12), tb + 0.2, pan=pn)
    for f in P["FOUNTAINS"]: put(out, hiss(f["t1"] - f["t0"] + 1.0, 0.16), f["t0"], pan=pan_of(f["x"])); ev.append((f["t0"], "anaar"))
    for w in P["WHEELS"]: put(out, hiss(w["t1"] - w["t0"], 0.12, mod=0.6) + 0 * 0, w["t0"], pan=pan_of(w["x"])); put(out, crackle(w["t1"] - w["t0"], 0.5, 0.03), w["t0"], pan=pan_of(w["x"])); ev.append((w["t0"], "chakri"))
    for l in P["LADIS"]:
        for i in range(l["n"]): tp = l["t0"] + (i / l["n"]) * (l["t1"] - l["t0"]); put(out, pop(0.5), tp, pan=float(np.clip(-0.8 + 1.6 * i / l["n"], -0.8, 0.8)))
        ev.append((l["t0"], "ladi"))
    for b in P["BOMBS"]: put(out, boom(1.5, 1.6), b["t"], pan=pan_of(b["x"])); ev.append((b["t"], "bomb"))
    return out, ev

def voices():
    out = np.zeros((N, 2))
    for k, t0 in P["SAY"].items():
        y, sr = sf.read(ROOT / "audio/out" / f"{k}.wav"); y = resample_poly(y, SR, sr) if sr != SR else y
        put(out, y, t0 - 0.04, g=1.0, pan=pan_of(P["XPOS"][k]) * 0.6)
    for i, k in enumerate(["claude", "muse", "grok", "dots"]):
        y, sr = sf.read(ROOT / "audio/out" / f"{k}_c.wav"); y = resample_poly(y, SR, sr) if sr != SR else y
        put(out, y, P["CHORUS"] - 0.04 + i * 0.012, g=0.75, pan=pan_of(P["XPOS"][k]) * 0.5)
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
    mus, (fx, ev), vox = music(), sfx(), voices()
    env = np.abs(vox).max(1); env = np.convolve(env, np.ones(int(0.25 * SR)) / int(0.25 * SR), "same")
    duck = (1 - 0.6 * np.clip(env / 0.05, 0, 1))[:, None]
    mix = vox * 1.0 + mus * 0.45 * duck + fx * 0.55 * (0.5 + 0.5 * duck)
    I, pk = master(mix, ROOT / "public/audio/mix.wav")
    print(f"mix {I:.1f} LUFS peak {pk:.1f} | {len(ev)} cracker events")

if __name__ == "__main__":
    main()
