"""Fit the reel to the user's song (assets/bella_ciao.mp3): measure its beats, shift it so a beat lands at 0.1 s,
carve a 0.35 s dead stop before the final hit and land a sub impact on it. Replaces the synthesized grid.
    python scripts/audio/song.py
Writes public/audio/song_mix.wav (-14 LUFS) and src/config/bella.json (same schema as bella.py, plus "audio").
The beat grid is MEASURED (librosa beat track, then a least-squares straight line through the beats), never guessed.
"""
import json, pathlib, subprocess, sys

import librosa
import numpy as np
import soundfile as sf

ROOT = pathlib.Path(__file__).resolve().parents[2]
SRC = ROOT / "assets" / "bella_ciao.mp3"
SR = 48000
T0 = 0.1
INTRO, SHOTS, STOP_LEN = 4, 20, 0.35

y, _ = librosa.load(SRC, sr=SR, mono=False)
y = np.atleast_2d(y)
mono = y.mean(0)
_, beats = librosa.beat.beat_track(y=librosa.resample(mono, orig_sr=SR, target_sr=22050), sr=22050, units="time")
k = np.arange(len(beats))
B, a = np.polyfit(k[2:], beats[2:], 1)                 # beat period and phase from the steady part
resid = beats[2:] - (a + B * k[2:])
first = a % B                                          # first grid beat inside the song
offset = first - T0                                    # trim this much so a beat sits at 0.1 s (pad if negative)
if offset >= 0:
    y = y[:, int(offset * SR):]
else:
    y = np.pad(y, ((0, 0), (int(-offset * SR), 0)))
beat = lambda i: T0 + i * B
cta = beat(INTRO + SHOTS)
hit = beat(INTRO + SHOTS + 5)
total = round(beat(INTRO + SHOTS + 8) + 0.1, 3)
n = int(total * SR)
y = y[:, :n] if y.shape[1] >= n else np.pad(y, ((0, 0), (0, n - y.shape[1])))

# the dead stop: the song cuts out for STOP_LEN before the hit (5 ms ramps so nothing clicks)
s0, s1, r = int((hit - STOP_LEN) * SR), int(hit * SR), int(0.005 * SR)
g = np.ones(n); g[s0:s1] = 0; g[s0 - r:s0] = np.linspace(1, 0, r); g[s1:s1 + r] = np.linspace(0, 1, r)
y = y * g
# sub impact on the hit, a 0.4 s fade at the very end
m = int(0.9 * SR); tt = np.arange(m) / SR
sub = np.sin(2 * np.pi * np.cumsum(30 + 80 * np.exp(-tt * 8)) / SR) * np.exp(-tt / 0.5)
y[:, s1:s1 + m] += 0.6 * sub[: n - s1]
f = int(0.4 * SR); y[:, -f:] *= np.linspace(1, 0, f)

raw = ROOT / "public" / "audio" / "song_raw.wav"
sf.write(raw, y.T.astype(np.float32), SR)
master = ROOT.parents[1] / ".claude" / "skills" / "motion-studio" / "scripts" / "master.py"
subprocess.run([sys.executable, str(master), str(raw), str(ROOT / "public" / "audio" / "song_mix.wav"), "--lufs", "-14", "--tp", "-2"], check=True)

nb = int((total - T0) / B) + 1
grid = [round(beat(i), 3) for i in range(nb) if beat(i) < total]
(ROOT / "src" / "config" / "bella.json").write_text(json.dumps({
    "_doc": "Written by scripts/audio/song.py from the user's assets/bella_ciao.mp3: measured beat grid, a beat at 0.1 s.",
    "audio": "audio/song_mix.wav", "bpm": round(60 / B, 2), "t0": T0, "beat": round(B, 5), "total": total,
    "songOffset": round(offset, 3), "fitResidualMs": round(float(np.abs(resid).max() * 1000), 1),
    "beats": grid, "downbeats": grid[::4],
    "sections": {"drop": [T0, round(cta, 3)], "cta": [round(cta, 3), total], "stop": [round(hit - STOP_LEN, 3), round(hit, 3)], "finalHit": round(hit, 3)},
}, indent=1), encoding="utf-8")
print(f"song: {60 / B:.2f} BPM, beat {B * 1000:.1f} ms, worst fit {np.abs(resid).max() * 1000:.0f} ms, offset {offset:+.3f} s, "
      f"total {total} s, CTA {cta:.2f}, hit {hit:.2f}")
