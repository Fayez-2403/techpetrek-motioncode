"""Original score + sound design for the Redemption Rouge film (music-only, no VO), synthesized here: no samples,
licence-clean. Every time comes from SCENE_TIMINGS.json (the same events the picture reads).

  120 BPM, D minor. Bars (2 s): Dm Dm Bb A | Dm Bb Gm A | Dm Gm Bb Dm
  race 0-8     engine rumble that revs through the three shifts, doppler whooshes on every close pass, four-on-floor,
               16th bass, snare build 6.0-7.5, brake (7.5), then a dead stop 7.83-8.0 (the ducked breath)
  notes 8-15   the hit (sub + glass ting + petal air burst), half-time, warm pad, ONE bell note per note word
               (top notes high and climbing, heart in the middle, base low)
  box 15-20    slide whoosh, groove back, shimmer on each light sweep
  finale 20-24 the last trail's whoosh, name impact, resolve to Dm at 22.0 that rings to the end

    python scripts/audio/score_film.py      -> public/audio/mix_reel.wav (-14 LUFS) + audio/out/stems
"""
import json, pathlib, subprocess, sys
import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfilt

ROOT = pathlib.Path(__file__).resolve().parents[2]
TM = json.loads((ROOT / "SCENE_TIMINGS.json").read_text(encoding="utf-8"))
R = TM["variants"]["reel"]; EV = R["events"]; DUR = R["seconds"]
SR = 48000; N = int(DUR * SR); BPM = TM["bpm"]; BEAT = 60 / BPM; BAR = 4 * BEAT
RNG = np.random.default_rng(20261029)

def midi(n): return 440.0 * 2 ** ((n - 69) / 12)
def T(n): return np.arange(n) / SR
def lp(x, fc, o=2): return sosfilt(butter(o, min(fc, SR * 0.45), "low", fs=SR, output="sos"), x)
def hp(x, fc, o=2): return sosfilt(butter(o, fc, "high", fs=SR, output="sos"), x)
def bp(x, lo, hi, o=2): return sosfilt(butter(o, [lo, min(hi, SR * 0.45)], "band", fs=SR, output="sos"), x)
def noise(n): return RNG.standard_normal(n)
def env(n, a, d): e = np.exp(-T(n) / d); na = max(1, int(a * SR)); e[:na] *= np.linspace(0, 1, na); return e
def saw(f, n, k=16, det=0.0):
    t = T(n); y = np.zeros(n)
    for h in range(1, k + 1):
        if f * h > 14000: break
        y += np.sin(2 * np.pi * f * h * (1 + det) * t + h * 0.7) / h
    return y
def add(buf, x, t, g=1.0):
    i = int(round(t * SR))
    if i >= len(buf): return
    if i < 0: x = x[-i:]; i = 0
    m = min(len(x), len(buf) - i); buf[i:i + m] += x[:m] * g

# chords per bar (root midi, triad)
DM, BB, GM, A_ = (38, [62, 65, 69]), (34, [58, 62, 65]), (43, [55, 58, 62]), (33, [57, 61, 64])
BARS = [DM, DM, BB, A_, DM, BB, GM, A_, DM, GM, BB, DM]
def bar_at(t): return BARS[min(len(BARS) - 1, int(t // BAR))]

drums, bass, pad, keys, fx, eng = (np.zeros(N) for _ in range(6))
brake, stop0, stop1, hit = EV["brake"], EV["stop"][0], EV["stop"][1], EV["hit"]

# ---------------------------------------------------------------- drum voices
def kick(g=1.0):
    n = int(0.5 * SR); t = T(n); f = 45 + 110 * np.exp(-t * 30)
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.001, 0.22) + lp(noise(n), 3000) * env(n, 0.0005, 0.006) * 0.4) * g
def snare(g=1.0):
    n = int(0.35 * SR); t = T(n)
    return (bp(noise(n), 1200, 9000) * env(n, 0.001, 0.09) * 0.8 + np.sin(2 * np.pi * 190 * t) * env(n, 0.001, 0.05) * 0.5) * g
def hat(g=1.0, open_=False):
    n = int((0.25 if open_ else 0.06) * SR); return hp(noise(n), 7000, 4) * env(n, 0.0005, 0.08 if open_ else 0.018) * g

KICKS = []
for b in np.arange(0, DUR, BEAT):
    if b < brake: KICKS.append(b)
    elif hit <= b < EV["boxIn"] and (b - hit) % 1.0 < 1e-6: KICKS.append(b)          # half-time in the notes
    elif EV["boxIn"] <= b < 22.0: KICKS.append(b)
KICKS.append(22.0)
for k in KICKS: add(drums, kick(1.0 if k >= hit else 0.95), k)
for b in np.arange(BEAT, DUR, 2 * BEAT):                                            # backbeat
    if 2.0 <= b < 6.0 or EV["boxIn"] + 0.5 <= b < 22.0: add(drums, snare(0.55), b)
    if hit <= b < EV["boxIn"] and int(round((b - hit) / BEAT)) % 4 == 2: add(drums, snare(0.35), b)
roll = np.arange(6.0, brake, BEAT / 4)                                              # build: 16ths then 32nds, rising
for i, b in enumerate(roll): add(drums, snare(0.18 + 0.5 * i / len(roll)), b)
for b in np.arange(7.0, brake, BEAT / 8): add(drums, snare(0.25), b)
for b in np.arange(0, DUR, BEAT / 2):
    off = abs((b / BEAT) % 1 - 0.5) < 1e-6
    if b < 4.0 and off: add(drums, hat(0.35), b)
    elif 4.0 <= b < brake: add(drums, hat(0.25), b); add(drums, hat(0.18), b + BEAT / 4)
    elif hit <= b < EV["boxIn"] and off: add(drums, hat(0.16), b)
    elif EV["boxIn"] <= b < 22.0: add(drums, hat(0.3 if off else 0.15, open_=off), b)

# ---------------------------------------------------------------- bass
def bass_note(f, n, cut=900): return lp(saw(f, n, 10) + 0.5 * np.sin(2 * np.pi * f / 2 * T(n)), cut, 3) * env(n, 0.003, n / SR * 0.7)
for b in np.arange(0, brake, BEAT / 4):                                             # race: 16th pulse
    root = bar_at(b)[0]; add(bass, bass_note(midi(root), int(BEAT / 4 * SR * 0.9), 500 + 900 * (b / brake)) * 0.5, b)
for b in np.arange(hit, EV["boxIn"], BAR / 2):                                      # notes: long sub notes
    root = bar_at(b)[0]; n = int(BAR / 2 * SR); add(bass, np.sin(2 * np.pi * midi(root) * T(n)) * env(n, 0.02, 1.2) * 0.38, b)
for b in np.arange(EV["boxIn"], 22.0, BEAT / 2):                                    # box/finale: 8ths
    root = bar_at(b)[0]; add(bass, bass_note(midi(root), int(BEAT / 2 * SR * 0.85), 1100) * 0.5, b)
n = int(2.0 * SR); add(bass, np.sin(2 * np.pi * midi(38) * T(n)) * env(n, 0.01, 1.4) * 0.8, 22.0)
# sidechain: duck bass under every kick
duck = np.ones(N)
for k in KICKS:
    i = int(k * SR); m = min(int(0.22 * SR), N - i)
    if m > 0: duck[i:i + m] = np.minimum(duck[i:i + m], 1 - 0.7 * np.exp(-T(m) / 0.06))
bass *= duck

# ---------------------------------------------------------------- pad + bells
def pad_chord(notes, n, cut):
    y = sum(saw(midi(m), n, 12, d) for m in notes for d in (-0.004, 0.004)) / (2 * len(notes))
    return lp(y, cut, 2) * np.minimum(1, T(n) / 0.4) * np.minimum(1, (n / SR - T(n)) / 0.5)
for bi in range(len(BARS)):
    t0 = bi * BAR
    if t0 < 4.0: continue
    g = 0.22 if t0 < hit else 0.3 if t0 < EV["boxIn"] else 0.3
    n = int(BAR * SR) + int(0.4 * SR); add(pad, pad_chord(BARS[bi][1], n, 1400 if t0 >= hit else 800) * g, t0)
n = int(2.4 * SR); add(pad, pad_chord([62, 65, 69, 74], n, 2200) * 0.45, 22.0)
def bell(f, g=1.0, d=1.2):
    n = int(d * 2 * SR); t = T(n); mod = np.sin(2 * np.pi * f * 3.5 * t) * 1.8 * np.exp(-t / 0.25)
    return (np.sin(2 * np.pi * f * t + mod) * env(n, 0.002, d) + 0.25 * np.sin(2 * np.pi * f * 2 * t) * env(n, 0.002, d / 3)) * g
MEL = {"top": [69, 72, 74, 76, 77, 81], "heart": [74, 77, 81], "base": [50, 53, 57]}
for key, grp in EV["notes"].items():
    for i, _w in enumerate(grp["words"]):
        add(keys, bell(midi(MEL[key][i]), 0.32 if key != "base" else 0.45, 0.9 if key != "base" else 1.4), grp["at"] + i * grp["step"])

# ---------------------------------------------------------------- engine (race)
def rpm(t):
    if t < EV["turn"]: return 1.0 + 0.08 * np.sin(t * 3)
    s = 1 + 1.9 * ((t - EV["turn"]) / (brake - EV["turn"])) ** 3 if t < brake else 0
    for sh in EV["shifts"]:
        if t >= sh: s *= 1 - 0.16 * np.exp(-(t - sh) * 7)
    if t >= brake: s = 2.4 * max(0, 1 - (t - brake) / (stop0 - brake)) ** 2
    return s
tt = np.arange(int(stop0 * SR)) / SR
f0 = 38 * np.array([rpm(x) for x in tt[::48]]).repeat(48)[:len(tt)] + 6 * np.sin(tt * 2)
ph = 2 * np.pi * np.cumsum(f0) / SR
engine = sum(np.sin(h * ph) / h ** 0.8 for h in range(1, 18)) * (0.6 + 0.4 * np.sin(ph * 0.5) ** 2)
engine = lp(engine, 2400) * (0.35 + 0.15 * np.clip((tt - 4) / 3.5, 0, 1))
engine[-int(0.03 * SR):] *= np.linspace(1, 0, int(0.03 * SR))
eng[:len(engine)] += engine

def whoosh(dur=0.7, f_hi=3200, g=1.0, doppler=True):
    n = int(dur * SR); t = T(n); c = np.linspace(0, 1, n)
    shape = np.exp(-((c - 0.5) / 0.18) ** 2)
    y = np.zeros(n); seg = int(0.02 * SR); x = noise(n)
    for i in range(0, n, seg):                                                       # swept band
        fc = 300 + f_hi * np.exp(-((i / n - 0.5) / 0.22) ** 2)
        y[i:i + seg] = bp(x[max(0, i - 2000):i + seg], fc * 0.6, fc * 1.6)[-min(seg, n - i):]
    tone = np.sin(2 * np.pi * np.cumsum(220 * (1.25 - 0.5 * c)) / SR) * 0.35 if doppler else 0
    return (y * 0.9 + tone) * shape * g
for i, p in enumerate(EV["passes"]):
    add(fx, whoosh(0.6 if p < EV["turn"] else 0.45, 2600 + 300 * (i % 3), 0.55 + 0.25 * (p > EV["turn"])), p - 0.3 if p < EV["turn"] else p - 0.22)
add(fx, whoosh(0.4, 4000, 0.7), EV["turn"] - 0.2)                                  # the whip
for sh in EV["shifts"]:                                                             # gear shifts: a click + exhaust pop
    n = int(0.12 * SR); add(fx, bp(noise(n), 800, 5000) * env(n, 0.001, 0.02) * 0.6, sh)
n = int((stop0 - brake) * SR); t = T(n)                                             # the brake squeal
sq = np.sin(2 * np.pi * np.cumsum(2300 + 300 * np.sin(t * 40) - 900 * t) / SR) * 0.12 + bp(noise(n), 1800, 4000) * 0.25
add(fx, sq * np.linspace(1, 0, n) ** 1.5, brake)

# ---------------------------------------------------------------- the hit + later accents
def sub_impact(g=1.0):
    n = int(1.8 * SR); t = T(n); f = 32 + 60 * np.exp(-t * 6)
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.001, 0.7) + lp(noise(n), 1200) * env(n, 0.001, 0.05) * 0.6) * g
def glass(f=1318.5, g=1.0, d=2.4):
    n = int(d * 1.4 * SR); t = T(n); y = sum(a * np.sin(2 * np.pi * f * r * t + r) * np.exp(-t / (d * dd))
                                         for r, a, dd in [(1, 1, 1), (2.76, 0.5, 0.6), (5.4, 0.25, 0.35), (1.5, 0.3, 0.8)])
    return y * env(n, 0.002, 10) * 0.25 * g
def air(dur=2.5, g=1.0):
    n = int(dur * SR); return hp(noise(n), 2500) * env(n, 0.01, dur / 3) * 0.25 * g
def crash(g=1.0, d=1.8):
    n = int(d * SR); return (hp(noise(n), 4500, 2) * env(n, 0.001, d / 3) + bp(noise(n), 300, 2000) * env(n, 0.001, 0.08) * 0.8) * 0.5 * g
add(fx, sub_impact(1.8), hit); add(fx, crash(1.0), hit); add(fx, glass(1318.5, 1.2), hit); add(fx, air(2.8, 1.2), hit)
add(pad, pad_chord([62, 65, 69, 74], int(1.6 * SR), 3000) * 0.7, hit)              # the chord the roses open on
add(fx, glass(1760, 0.5, 1.6), EV["notes"]["heart"]["at"])                          # rose shimmer
add(fx, whoosh(0.7, 2200, 0.7, False), EV["boxIn"] - 0.35)                          # box slides in
for s in (16.1, 18.1): add(fx, glass(2349, 0.25, 1.0), s + 0.4)                     # light combs the box
add(fx, whoosh(0.8, 3500, 0.9), EV["carrier"] - 0.35)                               # the last trail
add(fx, sub_impact(0.6), EV["name"])                                               # the name lands
add(fx, glass(1174.7, 0.6, 2.2), 22.0); add(fx, glass(2349, 0.3, 1.2), 23.0)       # resolve + the final glint

# ---------------------------------------------------------------- mix
music = drums * 0.9 + bass * 0.9 + pad * 0.8 + keys * 1.0
music = np.tanh(music * 1.1) / 1.1
mix = music + fx * 1.0 + eng * 0.8
mix[:int(brake * SR)] *= 0.78                                                       # the race sits ~2 dB under the hit
i0, i1 = int(stop0 * SR), int(hit * SR)                                             # the dead stop: everything but tails gone
fade = int(0.02 * SR)
mix[i0 - fade:i0] *= np.linspace(1, 0.03, fade); mix[i0:i1] *= 0.03
mix[-int(0.25 * SR):] *= np.linspace(1, 0.6, int(0.25 * SR))
st = np.stack([mix, mix], 1)
st[:, 0] += 0.04 * np.roll(pad + keys, 480); st[:, 1] += 0.04 * np.roll(pad + keys, 720)   # a little width on the pads
st /= np.max(np.abs(st)) * 1.05
out = ROOT / "audio" / "out"; out.mkdir(parents=True, exist_ok=True)
for name, x in [("drums", drums), ("bass", bass), ("pad", pad), ("keys", keys), ("fx", fx), ("engine", eng)]:
    sf.write(out / f"stem_{name}.wav", x / (np.max(np.abs(x)) + 1e-9) * 0.9, SR)
raw = out / "mix_raw.wav"; sf.write(raw, st, SR, subtype="FLOAT")
dst = ROOT / "public" / "audio" / "mix_reel.wav"
ms = ROOT.parents[1] / ".claude" / "skills" / "motion-studio" / "scripts" / "master.py"
subprocess.run([sys.executable, str(ms), str(raw), str(dst), "--lufs", "-14", "--tp", "-2"], check=True)
(ROOT / "src" / "config" / "audioManifest.json").write_text(json.dumps({"_doc": "Written by scripts/audio/score_film.py.", "reel": "audio/mix_reel.wav"}, indent=1), encoding="utf-8")
print("wrote", dst)
