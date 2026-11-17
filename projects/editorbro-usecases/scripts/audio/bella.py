"""Our own arrangement of "Bella ciao" (traditional Italian folk melody, public domain): an electronic drop from 0.1 s.
    python scripts/audio/bella.py
120 BPM, D minor, beat k at 0.1 + 0.5 k s. Three passes of the "o bella ciao, bella ciao, bella ciao ciao ciao" hook
(2 bars each), then the CTA bars with a riser, a stop and a final hit. Writes:
  public/audio/bella_raw.wav, then (master.py) public/audio/bella.wav at -14 LUFS / -2 dBTP
  src/config/bella.json  {bpm, t0, beat, total, beats[], downbeats[], hits[], sections}
Everything here is synthesized (no samples), so the track is ours.
"""
import json, pathlib, subprocess, sys

import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfilt

ROOT = pathlib.Path(__file__).resolve().parents[2]
SR = 48000
BPM, T0 = 120, 0.1
B = 60 / BPM
BARS_HOOK, TOTAL = 6, 16.2           # 3 hook passes x 2 bars = 6 bars (12 s), then the CTA to 16.2 s
rng = np.random.default_rng(31)

def m2f(m): return 440 * 2 ** ((m - 69) / 12)
def t(n): return np.arange(n) / SR
def lp(x, fc): return sosfilt(butter(2, min(fc, SR * 0.45), "low", fs=SR, output="sos"), x)
def hp(x, fc): return sosfilt(butter(2, fc, "high", fs=SR, output="sos"), x)
def env(n, a, d): e = np.exp(-t(n) / d); na = max(1, int(a * SR)); e[:na] *= np.linspace(0, 1, na); return e
def saw(f, n, k=18, det=0.0):
    y = np.zeros(n); tt = t(n)
    for h in range(1, k + 1):
        if f * h > 16000: break
        y += np.sin(2 * np.pi * f * h * (1 + det) * tt) / h
    return y

N = int(TOTAL * SR)
mix = {k: np.zeros(N) for k in ("kick", "clap", "hat", "bass", "lead", "pad", "fx")}
def put(track, at, x, g=1.0):
    k = int(at * SR); m = min(len(x), N - k)
    if m > 0: mix[track][k:k + m] += x[:m] * g
beat = lambda k: T0 + k * B

# the hook, in beats from a bar start: (beat offset, length in beats, midi). D minor, A-D-E-F | E-D-F | E-D-A | F-E-D
HOOK = [(-0.5, 0.5, 57), (0, 0.5, 62), (0.5, 0.5, 64), (1, 1, 65), (2, 0.5, 64), (2.5, 0.5, 62), (3, 1, 65),
        (4, 0.5, 64), (4.5, 0.5, 62), (5, 1, 69), (6, 0.75, 65), (6.75, 0.75, 64), (7.5, 0.5, 62)]
CHORDS = [[50, 53, 57], [50, 53, 57], [45, 49, 52], [50, 53, 57]]   # Dm | Dm | A | Dm (per bar, repeating)
ROOTS = [38, 38, 33, 38]

hits = []
for p in range(3):                                   # three hook passes
    bar0 = p * 2
    for off, ln, note in HOOK:
        if p == 0 and off < 0: continue              # the very first pickup would sit before 0.1 s
        at = beat(bar0 * 4 + off); n = int(ln * B * SR * 0.95)
        f = m2f(note + (12 if p == 2 else 0))
        y = (saw(f, n, det=0.004) + saw(f, n, det=-0.004) + 0.5 * saw(f / 2, n)) * env(n, 0.005, 0.5 + ln * 0.3)
        put("lead", at, lp(y, 5200 if p else 3800), 0.16)
        hits.append(round(at, 3))

total_beats = int((TOTAL - T0) / B)
for k in range(total_beats + 1):
    at = beat(k); bar = k // 4; inbar = k % 4
    cta = at >= beat(BARS_HOOK * 4)
    stop = beat(BARS_HOOK * 4 + 5) - 0.35 <= at < beat(BARS_HOOK * 4 + 5)   # the dead stop before the last hit (0.35 s)
    if stop: continue
    # kick on every beat
    n = int(0.42 * SR); f = 48 + 110 * np.exp(-t(n) * 28)
    put("kick", at, np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.001, 0.18), 0.9)
    # clap on 2 and 4
    if inbar in (1, 3):
        n = int(0.22 * SR); put("clap", at, hp(rng.standard_normal(n), 900) * env(n, 0.001, 0.06), 0.28)
    # offbeat open hat
    n = int(0.12 * SR); put("hat", at + B / 2, hp(rng.standard_normal(n), 7500) * env(n, 0.001, 0.04), 0.12)
    # bass: driving eighths on the root
    r = ROOTS[bar % 4]
    for e in (0, 0.5):
        n = int(B / 2 * SR * 0.9); f0 = m2f(r)
        y = saw(f0, n, 8) * 0.6 + np.sin(2 * np.pi * f0 / 2 * t(n))
        put("bass", at + e * B, lp(y, 700 if not cta else 900) * env(n, 0.003, 0.12), 0.32)
    # pad: one chord per bar
    if inbar == 0:
        n = int(4 * B * SR); ch = CHORDS[bar % 4]
        y = sum(saw(m2f(c + 12), n, 10, d) for c, d in zip(ch, (0.0, 0.003, -0.003)))
        put("pad", at, lp(y, 2400) * env(n, 0.08, 3.0), 0.035)

# CTA: riser into the stop, then the final hit + a long Dm chord
cta0 = beat(BARS_HOOK * 4)
n = int((beat(BARS_HOOK * 4 + 5) - 0.35 - cta0) * SR)
u = t(n) / (n / SR)
put("fx", cta0, hp(rng.standard_normal(n), 2000) * u ** 2.5 * 0.5 + np.sin(2 * np.pi * np.cumsum(200 + 1600 * u ** 2) / SR) * u ** 2 * 0.18, 0.6)
final = beat(BARS_HOOK * 4 + 5)
n = int(0.9 * SR); put("fx", final, np.sin(2 * np.pi * np.cumsum(30 + 80 * np.exp(-t(n) * 8)) / SR) * env(n, 0.001, 0.5), 1.0)
n = int((TOTAL - final) * SR)
y = sum(saw(m2f(c), n, 14, d) for c, d in zip([50, 57, 62, 65, 69], (0, .003, -.003, .002, -.002)))
put("pad", final, lp(y, 3000) * env(n, 0.01, 1.6), 0.07)
for off, ln, note in HOOK[1:5]:                      # the hook's first four notes ring once more over the logo
    at = final + 0.5 + off * B * 0.5; n = int(ln * B * SR * 0.5)
    put("lead", at, lp(saw(m2f(note + 12), n) * env(n, 0.004, 0.3), 5000), 0.1)

# sidechain pump from the kick grid, then sum
ph = ((t(N) - T0) % B) / B
pump = 1 - 0.5 * np.exp(-ph * 9)
out = mix["kick"] + mix["clap"] + mix["hat"] + (mix["bass"] + mix["lead"] + mix["pad"]) * pump + mix["fx"]
fade = int(0.3 * SR); out[-fade:] *= np.linspace(1, 0, fade)
raw = ROOT / "public" / "audio" / "bella_raw.wav"; raw.parent.mkdir(parents=True, exist_ok=True)
sf.write(raw, np.stack([out, out], 1).astype(np.float32), SR)
master = ROOT.parents[1] / ".claude" / "skills" / "motion-studio" / "scripts" / "master.py"
subprocess.run([sys.executable, str(master), str(raw), str(ROOT / "public" / "audio" / "bella.wav"), "--lufs", "-14", "--tp", "-2"], check=True)

beats = [round(beat(k), 3) for k in range(total_beats + 1) if beat(k) < TOTAL]
(ROOT / "src" / "config" / "bella.json").write_text(json.dumps({
    "_doc": "Written by scripts/audio/bella.py: our arrangement of the traditional Bella ciao melody. Picture cuts read this grid.",
    "bpm": BPM, "t0": T0, "beat": B, "total": TOTAL, "beats": beats, "downbeats": beats[::4], "hookNotes": hits,
    "sections": {"drop": [T0, cta0], "cta": [cta0, TOTAL], "stop": [beat(BARS_HOOK * 4 + 5) - 0.35, final], "finalHit": final},
}, indent=1), encoding="utf-8")
print(f"bella: {TOTAL} s, {len(beats)} beats, CTA at {cta0:.2f} s, final hit {final:.2f} s")
