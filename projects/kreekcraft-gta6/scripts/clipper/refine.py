"""Second pass on the picked moments: a wider window (40 s before, 25 s after the peak), faster-whisper small.en with
word timestamps, so the cut can start on a sentence and end on the payoff. -> audio/refined.json
    python scripts/clipper/refine.py <audio> <peak_s> [<peak_s> ...]
"""
import json, pathlib, subprocess, sys

import numpy as np
from faster_whisper import WhisperModel

ROOT = pathlib.Path(__file__).resolve().parents[2]
SRC = sys.argv[1]; PEAKS = [float(x) for x in sys.argv[2:]]; SR = 16000
m = WhisperModel("small.en", device="cpu", compute_type="int8")
out = []
for p in PEAKS:
    a = max(0, p - 40); b = p + 25
    raw = subprocess.run(["ffmpeg", "-v", "error", "-ss", str(a), "-to", str(b), "-i", SRC, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True, check=True).stdout
    y = np.frombuffer(raw, np.float32)
    segs, _ = m.transcribe(y, language="en", vad_filter=True, beam_size=5, word_timestamps=True)
    words = [{"w": w.word.strip(), "t0": round(a + w.start, 2), "t1": round(a + w.end, 2)} for s in segs for w in s.words]
    out.append({"peak_s": p, "from_s": a, "to_s": b, "words": words})
    print(f"\n=== peak {int(p // 3600)}:{int(p % 3600 // 60):02d}:{int(p % 60):02d}")
    line, t_line = [], None
    for w in words:
        if t_line is None: t_line = w["t0"]
        line.append(w["w"])
        if w["w"].endswith((".", "?", "!")) or len(line) > 14:
            print(f"  {t_line - p:+6.1f}  {' '.join(line)}"); line, t_line = [], None
    if line: print(f"  {t_line - p:+6.1f}  {' '.join(line)}")
json.dump(out, open(ROOT / "audio/refined.json", "w", encoding="utf-8"), indent=1)
