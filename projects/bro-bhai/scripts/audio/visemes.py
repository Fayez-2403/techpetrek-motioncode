"""Lip sync for the hosts (v4 poses: talk_m / talk_e / talk_a / talk_o). Reads each host line's own audio
(audio/out/<id>.wav) and picks a mouth shape per 1/15 s (classic cartoon mouth rate):
  quiet -> m (closed) | loud -> a (wide) | mid and dark (low spectral centroid) -> o (round) | otherwise -> e
Level is normalised per line (its 95th percentile), so a soft and a loud line both open the mouth fully.
Writes audio/out/visemes_ep01.json: {line id: "mmeaao..."} (index = floor((t - line start) * 15)).
    python scripts/audio/visemes.py
"""
import json, pathlib

import numpy as np
import soundfile as sf

ROOT = pathlib.Path(__file__).resolve().parents[2]
RATE = 15
S = json.loads((ROOT / "src/config/voScript.json").read_text(encoding="utf-8"))
out = {"_doc": __doc__.strip().splitlines()[0] + " Written by scripts/audio/visemes.py.", "rate": RATE, "lines": {}}
for l in S["reel"]:
    if l["who"] not in ("bro", "bhai"): continue
    y, sr = sf.read(ROOT / "audio/out" / f"{l['id']}.wav", dtype="float64")
    y = y if y.ndim == 1 else y.mean(1)
    hop = sr // RATE; n = len(y) // hop
    rms = np.array([np.sqrt(np.mean(y[i * hop:(i + 1) * hop] ** 2)) for i in range(n)])
    cen = []
    for i in range(n):
        seg = y[i * hop:(i + 1) * hop] * np.hanning(hop); sp = np.abs(np.fft.rfft(seg)); f = np.fft.rfftfreq(hop, 1 / sr)
        cen.append(float((sp * f).sum() / (sp.sum() + 1e-9)))
    lv = rms / (np.percentile(rms, 95) + 1e-9)
    s = ""
    for v, c in zip(lv, cen):
        s += "m" if v < 0.18 else "a" if v > 0.62 else "o" if c < 1100 else "e"
    out["lines"][l["id"]] = s
    print(l["id"], l["who"], s)
(ROOT / "audio/out/visemes_ep01.json").write_text(json.dumps(out, indent=1), encoding="utf-8")
