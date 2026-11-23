"""v2 (Pehchaan cut): score + SFX + voice from SCENE_TIMINGS.v2.json (the same named beats the picture uses).

Score: an original warm lo-fi bed, Dm9 - Bbmaj7 - Gm7 - A7sus4 at 92 BPM (synth Rhodes, sub, soft kick, rim, hat).
  hook: pad + riser into the 31 halvings, a stomp + chord hit on "31"; problem: pad only (night); game -> cta: groove;
  the groove stops for the turn ("par interview mein...") and lands on "answer pe binary search"; ducked under every line.
SFX (synthesised): 31 ticks + stomp, a wooden crack on every scale snap, slam, whooshes on whip cuts, pops on labels,
  bells on every answer, stamps, glass crack on the overflow, typing, a notification ping, a page flip, one boing.
Two-pass loudnorm to -14 LUFS / -1.5 dBTP -> public/audio/mix.wav; sets src/config/audioManifest.json "reel".

    python scripts/audio/mix_duo.py
"""
import json, pathlib, subprocess, sys
import numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt

ROOT = pathlib.Path(__file__).resolve().parents[2]
SR = 44100
TL = json.loads((ROOT / "SCENE_TIMINGS.v2.json").read_text(encoding="utf-8"))
EV, TOTAL = TL["ev"], TL["total"]
SC = {s["id"]: s for s in TL["scenes"]}
N = int(TOTAL * SR) + SR
rng = np.random.default_rng(7)

def bp(x, lo, hi, o=2): return sosfilt(butter(o, [lo, hi], "band", fs=SR, output="sos"), x)
def lp(x, f, o=2): return sosfilt(butter(o, f, "low", fs=SR, output="sos"), x)
def hp(x, f, o=2): return sosfilt(butter(o, f, "high", fs=SR, output="sos"), x)
def env(n, a=0.002, d=0.2):
    t = np.arange(n) / SR; e = np.exp(-t / d); k = int(a * SR)
    if k: e[:k] *= np.linspace(0, 1, k)
    return e
def put(buf, x, t, g=1.0):
    i = int(t * SR)
    if i < 0: x, i = x[-i:], 0
    j = min(len(buf), i + len(x)); buf[i:j] += x[:j - i] * g
def tone(f, dur, d=0.3, a=0.002, shape="sine"):
    n = int(dur * SR); t = np.arange(n) / SR
    w = np.sin(2 * np.pi * f * t) if shape == "sine" else np.sign(np.sin(2 * np.pi * f * t))
    return w * env(n, a, d)
def noise(dur): return rng.standard_normal(int(dur * SR))
def add(*xs):
    o = np.zeros(max(len(x) for x in xs))
    for x in xs: o[:len(x)] += x
    return o

# ---------------- SFX ----------------
def tick(k):      return bp(noise(0.03), 2500 + k * 60, 6000 + k * 80) * env(int(0.03 * SR), 0.0005, 0.008) * 0.9
def stomp():
    n = int(0.9 * SR); t = np.arange(n) / SR; f = 90 * np.exp(-t * 6) + 38
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.001, 0.35)
    return add(body * 1.2, lp(noise(0.9), 900)[:n] * env(n, 0.001, 0.06) * 0.8)
def crack(heavy=1.0):
    snap = hp(noise(0.05), 1800) * env(int(0.05 * SR), 0.0003, 0.012)
    wood = bp(noise(0.12), 700, 2200, 3) * env(int(0.12 * SR), 0.0005, 0.03) * 1.6
    thud = tone(110, 0.25, 0.07) * 0.8 * heavy
    out = np.zeros(int(0.3 * SR)); out[:len(snap)] += snap; out[:len(wood)] += wood; out[:len(thud)] += thud
    return out
def slam():
    return add(crack(1.6), stomp()[:int(0.3 * SR)] * 0.7)
def whoosh(d=0.32):
    n = int(d * SR); x = noise(d); t = np.arange(n) / n
    out = np.zeros(n)
    for i in range(0, n, 512):   # swept band
        f = 400 + 3600 * t[i]; seg = x[i:i + 1024]; out[i:i + len(seg)] += bp(seg, f, f * 1.8)[:len(out[i:i + len(seg)])] * 0.5
    return out * np.sin(np.pi * t) * 1.4
def pop(f=880): return add(tone(f, 0.12, 0.05, 0.001) * 0.7, tone(f * 1.5, 0.08, 0.03) * 0.3)
def bell(f=1046.5):
    return add(*[tone(f * m, 1.6, d, 0.001) * g for m, d, g in [(1, 0.9, 0.6), (2.76, 0.45, 0.25), (5.4, 0.2, 0.12), (2, 0.7, 0.2)]])
def stamp(): return add(tone(70, 0.35, 0.09) * 1.3, bp(noise(0.08), 300, 3000) * env(int(0.08 * SR), 0.0005, 0.02) * 1.2)
def glass():
    out = hp(noise(0.6), 3500) * env(int(0.6 * SR), 0.0005, 0.12) * 0.9
    for i in range(9): put(out, tone(2800 + i * 430, 0.25, 0.06), 0.02 + i * 0.035, 0.18)
    return out
def key(): return bp(noise(0.025), 1500, 5000) * env(int(0.025 * SR), 0.0003, 0.006) * 0.55
def ping(): o = np.zeros(int(0.5 * SR)); put(o, tone(1318.5, 0.3, 0.12), 0, 0.5); put(o, tone(1760, 0.35, 0.15), 0.11, 0.5); return o
def flip(): return bp(noise(0.18), 900, 5000) * np.sin(np.pi * np.linspace(0, 1, int(0.18 * SR))) * 0.8
def boing():
    n = int(0.5 * SR); t = np.arange(n) / SR; f = 220 + 120 * np.sin(2 * np.pi * 9 * t) * np.exp(-t * 5)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.002, 0.25) * 0.6
def shimmer(d=0.9):
    o = np.zeros(int(d * SR))
    for i in range(14): put(o, tone(1200 + i * 140, 0.2, 0.06), i * d / 16, 0.12)
    return o

def marker(): return bp(noise(0.16), 2500, 7000) * np.sin(np.pi * np.linspace(0, 1, int(0.16 * SR))) * 0.5

sfx = np.zeros(N)
E = EV
# problem: the notification lands on frame 0
put(sfx, ping(), 0.0, 0.6)
for i in range(10): put(sfx, key(), E["headDrop"] + i * 0.012, 0.8)
put(sfx, whoosh(0.5), E["scaleToss"] - 0.5, 0.7); put(sfx, slam(), E["scaleToss"], 0.9)
# simple: pins, the two explained snaps, 7 fast snaps, the find
put(sfx, shimmer(0.6), E["sorted"], 0.4)
for k in ("mid500", "mid750"): put(sfx, pop(880), E[k], 0.45)
put(sfx, pop(1046), E["target"], 0.35)
for k in ("snap1", "snap2"): put(sfx, crack(), E[k], 0.85)
for i in range(2, 9):
    t = E["rapidA"] + (i - 2) / 7 * (E["rapidB"] - E["rapidA"]); put(sfx, crack(0.5), t, 0.55); put(sfx, tick(i * 3), t - 0.1, 0.4)
put(sfx, bell(1318.5), E["found"], 0.55); put(sfx, pop(990), E["ten"], 0.4)
put(sfx, boing(), E["surprised"], 0.3)
put(sfx, whoosh(0.3), E["tieOn"], 0.5)
# quiz: card in, highlighter, the answer stamp + bell
for q in ("q1", "q2", "q3", "q4", "q5"):
    put(sfx, flip(), E[q], 0.7); put(sfx, whoosh(0.35), E[q] - 0.05, 0.4)
    put(sfx, marker(), E[q + "hl"], 0.6)
    put(sfx, stamp(), E[q + "ok"], 0.85); put(sfx, bell(1318.5 if q != "q5" else 1568), E[q + "ok"] + 0.06, 0.35)
put(sfx, crack(0.6), E["q2hl"] + 0.05, 0.5); put(sfx, pop(1046), E["q2half"], 0.4)
put(sfx, boing(), E["q3huh"], 0.35)
for v in range(10): put(sfx, key(), E["q3sweep"] + v / 10 * 0.6, 0.4)
put(sfx, marker(), E["q4days"], 0.5)
for v in range(30): put(sfx, key(), E["q4days"] + v / 30 * 0.6, 0.3)
put(sfx, crack(0.5), E["q5ok"] + 0.1, 0.5)
# rule + cta
put(sfx, whoosh(0.3), E["tieOff"], 0.5)
for k in ("c1", "c2", "c3"): put(sfx, stamp()[:int(0.2 * SR)], E[k], 0.6); put(sfx, pop(880), E[k] + 0.02, 0.3)
put(sfx, stomp(), E["phod"], 0.5); put(sfx, shimmer(1.0), E["phod"], 0.55)
for i in range(6): put(sfx, key(), E["typeBinary"] + i * 0.075, 0.6)
put(sfx, pop(1046), E["typeBinary"] + 0.7, 0.5)
put(sfx, whoosh(0.3), SC["rule"]["start"] - 0.08, 0.4); put(sfx, whoosh(0.3), SC["cta"]["start"] - 0.08, 0.4)

# ---------------- score ----------------
BPM = 92; BEAT = 60 / BPM; BAR = 4 * BEAT
CH = [[50, 53, 57, 60, 64], [46, 50, 53, 57, 62], [43, 46, 50, 53, 58], [45, 50, 52, 55, 61]]   # Dm9 Bbmaj7 Gm7 A7sus4 (midi)
mf = lambda m: 440 * 2 ** ((m - 69) / 12)
def rhodes(f, dur):
    n = int(dur * SR); t = np.arange(n) / SR
    w = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t * 3) + 0.12 * np.sin(2 * np.pi * 3 * f * t) * np.exp(-t * 6)
    return w * env(n, 0.01, 1.4) * (1 + 0.08 * np.sin(2 * np.pi * 4.5 * t))
def pad(f, dur):
    n = int(dur * SR); t = np.arange(n) / SR
    w = sum(np.sin(2 * np.pi * f * dt * t) for dt in (0.997, 1.0, 1.004)) / 3
    a = np.minimum(1, t / 0.6) * np.minimum(1, (dur - t) / 0.6)
    return lp(w, 1800) * a
def kick(): n = int(0.4 * SR); t = np.arange(n) / SR; f = 120 * np.exp(-t * 25) + 45; return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.001, 0.16)
def rim(): return bp(noise(0.05), 1500, 4000) * env(int(0.05 * SR), 0.0005, 0.015)
def hat(): return hp(noise(0.04), 7000) * env(int(0.04 * SR), 0.0005, 0.01)

mus = np.zeros(N)
stop_a, stop_b = E["tieOn"] + 0.9, E["q1"]            # the ducked stop before the quiz hit
groove_on = lambda t: (E["scaleToss"] <= t < stop_a) or (stop_b <= t < TOTAL - 0.4)
nb = int(TOTAL / BAR) + 2
for b in range(nb):
    t0 = b * BAR; ch = CH[b % 4]
    if t0 > TOTAL: break
    for m in ch[:4]: put(mus, pad(mf(m), BAR + 0.3), t0, 0.06)
    for i, m in enumerate(ch):
        if groove_on(t0 + 0.01):
            put(mus, rhodes(mf(m + 12), BAR), t0, 0.07); put(mus, rhodes(mf(m + 12), BEAT * 1.5), t0 + 1.5 * BEAT, 0.035)
    if groove_on(t0 + 0.01): put(mus, lp(tone(mf(ch[0] - 12), BAR * 0.9, 0.9, 0.01), 300), t0, 0.5)
    for k in range(8):
        tt = t0 + k * BEAT / 2
        if not groove_on(tt): continue
        if k in (0, 5): put(mus, kick(), tt, 0.55)
        if k in (2, 6): put(mus, rim(), tt, 0.35)
        put(mus, hat(), tt + (0.025 if k % 2 else 0), 0.18 if k % 2 else 0.1)
# hits: the slam, the find, the quiz start, the end
for at, ch, g in [(E["scaleToss"], CH[0], 0.1), (E["found"], CH[0], 0.08), (E["q1"], CH[1], 0.11), (E["phod"], CH[0], 0.1)]:
    for m in ch: put(mus, rhodes(mf(m + 12), 1.8), at, g)
put(mus, kick(), E["q1"], 0.8)

# ---------------- voice, duck, master ----------------
vo, _ = sf.read(ROOT / "public/audio/vo_v2.wav", dtype="float64")
v = np.zeros(N); v[:len(vo)] = vo
e = np.abs(v); k = int(0.05 * SR); e = np.convolve(e, np.ones(k) / k, "same")
duck = 1 - 0.62 * np.clip(e / 0.02, 0, 1)
duck = np.convolve(duck, np.ones(int(0.12 * SR)) / int(0.12 * SR), "same")
mix = v * 1.0 + mus * duck * 0.55 + sfx * 0.32
mix = mix[: int(TOTAL * SR)]
# fade the last 0.4 s
f = int(0.4 * SR); mix[-f:] *= np.linspace(1, 0, f)
raw = ROOT / "audio/out/v2/mix_raw.wav"; sf.write(raw, (mix / max(1e-9, np.abs(mix).max()) * 0.9).astype(np.float32), SR, subtype="FLOAT")
out = ROOT / "public/audio/mix_v2.wav"
m = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(raw), "-af", "loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"], capture_output=True, text=True).stderr
j = json.loads(m[m.rindex("{"): m.rindex("}") + 1])
af = (f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={j['input_i']}:measured_TP={j['input_tp']}:measured_LRA={j['input_lra']}"
      f":measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true")
subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(raw), "-af", af, "-ar", str(SR), "-c:a", "pcm_s16le", str(out)], check=True)
man = ROOT / "src/config/audioManifest.json"; d = json.loads(man.read_text(encoding="utf-8")); d["reel_v2"] = "audio/mix_v2.wav"
man.write_text(json.dumps(d, indent=1), encoding="utf-8")
chk = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(out), "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True).stderr
print("mix:", out, "|", [l.strip() for l in chk.splitlines() if l.strip().startswith(("I:", "Peak:"))][-2:])
