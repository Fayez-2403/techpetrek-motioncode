"""Measure the beat grid of the reel's song (assets/music/runaway_bass_drop.mp3) -> src/config/grid.json.
    python scripts/audio/grid.py
Beats: librosa beat track, then a least-squares straight line through the steady beats (the grid every cut reads).
Bars: the beat phase whose low end (kick/bass, < 150 Hz) is strongest, every 4 beats. Drop: the first big rise in
loudness. Phrases: 8-beat blocks from the drop. Nothing here is guessed: every number comes from the file.
"""
import json, pathlib

import librosa
import numpy as np

ROOT = pathlib.Path(__file__).resolve().parents[2]
SONG = ROOT / "assets" / "music" / "runaway_bass_drop.mp3"
y, sr = librosa.load(SONG, sr=22050)
dur = len(y) / sr
_, beats = librosa.beat.beat_track(y=y, sr=sr, units="time")
k = np.arange(len(beats))
B, a = np.polyfit(k[2:], beats[2:], 1)
resid = np.abs(beats[2:] - (a + B * k[2:]))
grid = [a + B * i for i in range(-5, int(dur / B) + 6) if 0 <= a + B * i < dur]

# loudness envelope and the drop
hop = 256
rms = librosa.feature.rms(y=y, hop_length=hop)[0]; tt = librosa.times_like(rms, sr=sr, hop_length=hop)
db = 20 * np.log10(rms + 1e-9)
drop_i = int(np.argmax(db > db.max() - 12))
drop = min(grid, key=lambda g: abs(g - tt[drop_i]))

# downbeat phase: low-end energy on each beat, summed per phase (mod 4)
low = librosa.feature.rms(y=librosa.effects.preemphasis(y, coef=-0.97), hop_length=hop)[0]
S = np.abs(librosa.stft(y, n_fft=2048, hop_length=hop)); f = librosa.fft_frequencies(sr=sr, n_fft=2048)
lowband = S[f < 150].sum(0)
on = lambda t: lowband[min(len(lowband) - 1, int(t * sr / hop))]
gi = [i for i, g in enumerate(grid) if g >= drop]
phase = max(range(4), key=lambda p: sum(on(grid[i]) for i in gi if (i - gi[0]) % 4 == p))
bars = [round(grid[i], 3) for i in gi if (i - gi[0]) % 4 == phase]

out = {
    "_doc": "Measured by scripts/audio/grid.py from assets/music/runaway_bass_drop.mp3. Cuts read this; never retime by eye.",
    "song": "audio/runaway_bass_drop.wav", "duration": round(dur, 3), "bpm": round(60 / B, 2), "beat": round(B, 5),
    "fitResidualMs": round(float(resid.max() * 1000), 1), "drop": round(drop, 3),
    "beats": [round(g, 3) for g in grid], "bars": bars, "phrases": bars[::2],
}
(ROOT / "src" / "config" / "grid.json").write_text(json.dumps(out, indent=1), encoding="utf-8")
print(f"{out['bpm']} BPM, beat {B*1000:.1f} ms, worst fit {out['fitResidualMs']} ms, drop {out['drop']} s")
print("bars", bars)
