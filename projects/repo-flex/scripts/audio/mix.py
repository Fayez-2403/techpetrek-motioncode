"""The reel's sound: the user's song (Runaway bass drop) + quiet key clicks on every typed character and a soft tap on
each send, placed from the same flex.json / grid.json the picture reads. Mastered to -14 LUFS / -2 dBTP.
    python scripts/audio/mix.py
Writes public/audio/flex_mix.wav.
"""
import json, pathlib, subprocess, sys

import numpy as np
import soundfile as sf

ROOT = pathlib.Path(__file__).resolve().parents[2]
SR = 48000
g = json.loads((ROOT / "src/config/grid.json").read_text())
fx = json.loads((ROOT / "src/config/flex.json").read_text())
song, sr = sf.read(ROOT / "public/audio/runaway_bass_drop.wav", dtype="float64")
assert sr == SR
n = int(fx["end"] * SR)
song = song[:n]
rng = np.random.default_rng(7)

def click(gain=0.08):
    m = int(0.025 * SR); t = np.arange(m) / SR
    return (rng.standard_normal(m) * np.exp(-t / 0.004) * 0.6 + np.sin(2 * np.pi * 2600 * t) * np.exp(-t / 0.006) * 0.4) * gain
fxt = np.zeros(n)
def put(t, x):
    k = int(t * SR); m = min(len(x), n - k)
    if m > 0: fxt[k:k + m] += x[:m]
typing = [("/flex my repos", 0.05, g["drop"] - 0.25)] + [(b["cmd"], b["bar"], b["send"]) for b in fx["blocks"]]
for cmd, t0, send in typing:
    end = send - 0.12
    for i in range(len(cmd)):
        put(t0 + (end - t0) * i / len(cmd), click(0.06))
    put(send, click(0.12))
mix = song + np.stack([fxt, fxt], 1)
fade = int(0.35 * SR); mix[-fade:] *= np.linspace(1, 0, fade)[:, None]
raw = ROOT / "audio" / "flex_raw.wav"; raw.parent.mkdir(exist_ok=True)
sf.write(raw, mix.astype(np.float32), SR)
master = ROOT.parents[1] / ".claude/skills/motion-studio/scripts/master.py"
subprocess.run([sys.executable, str(master), str(raw), str(ROOT / "public/audio/flex_mix.wav"), "--lufs", "-14", "--tp", "-2"], check=True)
