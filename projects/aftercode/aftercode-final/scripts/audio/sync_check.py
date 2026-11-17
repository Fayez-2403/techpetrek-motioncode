"""Measure, per song segment, where the song's real transients sit against the beat grid the app measured (plan.json),
calibrated on the mix's own slams (placed at known times). Writes src/config/sync.json: {segment: seconds}, the shift
mix.py applies to that segment's song slice when |shift| > 30 ms (so the music hits on the cut and on the dancers' beat).
    python scripts/audio/sync_check.py        (after a mix: it needs public/audio/final_mix.wav + audio/cues.json)
"""
import json, pathlib

import librosa
import numpy as np

ROOT = pathlib.Path(__file__).resolve().parents[2]
P = json.loads((ROOT / "src/config/plan.json").read_text(encoding="utf-8"))
cues = json.loads((ROOT / "audio/cues.json").read_text(encoding="utf-8"))["cues"]
FILES = {"realizer": "Realizer", "smooth-move": "Smooth Move", "disco-medusae": "Disco Medusae", "electro-cabello": "Electro Cabello", "monkeys": "Monkeys Spinning Monkeys"}
SR = 22050


def peaks(y):
    o = librosa.onset.onset_strength(y=y, sr=SR, hop_length=64, n_fft=512); tt = librosa.times_like(o, sr=SR, hop_length=64)
    return tt[librosa.util.peak_pick(o, pre_max=6, post_max=6, pre_avg=20, post_avg=20, delta=np.percentile(o, 75) * 0.4, wait=10)]


y, _ = librosa.load(ROOT / "public/audio/final_mix.wav", sr=SR, mono=True); pk = peaks(y)
bias = float(np.median([min(pk - c["t"], key=abs) for c in cues if c["type"] in ("slam", "round")]))
out = {"_doc": "song transient minus app beat grid, per segment, calibrated (detector bias %+.0f ms on the known slams). mix.py shifts a segment's slice by this when |value| > 0.03 s." % (bias * 1000)}
for s in P["segments"]:
    a = max(0.0, s["ss"] - 1)
    z, _ = librosa.load(ROOT.parent / "web/public/music" / f"{FILES[s['track']]}.mp3", sr=SR, mono=True, offset=a, duration=s["se"] - s["ss"] + 2)
    pz = peaks(z) + a
    beats = np.array(s["beats"]) - s["r0"] + s["ss"]
    off = np.array([min(pz - b, key=abs) for b in beats]); good = off[np.abs(off) < 0.09]
    v = float(np.median(good) - bias) if len(good) else 0.0
    out[s["id"]] = round(v, 3)
    print(f"{s['id']} {s['track']:<16} {len(good):2d}/{len(off)} beats matched, transient {v * 1000:+.0f} ms vs the grid")
(ROOT / "src/config/sync.json").write_text(json.dumps(out, indent=1), encoding="utf-8")
