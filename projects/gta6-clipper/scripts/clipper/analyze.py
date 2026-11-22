"""Our open re-build of the "Claude clipper" method (Rollandex's GTA 6 clipper video, 0:55-2:24), on a stream recording:
  1 loudness per second (RMS dB) against a rolling 5-minute baseline -> "loud seconds" (+dB over normal)
  2 chat speed, if a live_chat replay file is present (messages per 10 s vs the stream average)
  3 a fast full transcript (faster-whisper base.en, VAD) so every candidate window can be read
  4 candidates = the strongest spikes, at least 45 s apart, each a 32 s window (22 s before the peak, 10 s after),
    with its transcript -> audio/candidates.json. Claude (in the session) then reads them and scores 0-10.
    python scripts/clipper/analyze.py <audio-or-video> [--chat live_chat.json] [--top 24] [--from 0] [--to END]
"""
import json, pathlib, subprocess, sys

import numpy as np

ROOT = pathlib.Path(__file__).resolve().parents[2]
arg = lambda k, d=None: sys.argv[sys.argv.index(k) + 1] if k in sys.argv else d
SRC = sys.argv[1]; TOP = int(arg("--top", 24)); T0 = float(arg("--from", 0)); T1 = arg("--to")
SR = 16000

raw = subprocess.run(["ffmpeg", "-v", "error", "-ss", str(T0)] + (["-to", T1] if T1 else []) + ["-i", SRC, "-vn", "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True, check=True).stdout
y = np.frombuffer(raw, np.float32); n = len(y) // SR
db = np.array([20 * np.log10(np.sqrt(np.mean(y[i * SR:(i + 1) * SR] ** 2)) + 1e-7) for i in range(n)])
W = 300; base = np.array([np.median(db[max(0, i - W // 2):i + W // 2]) for i in range(n)])
ex = db - base                                           # loudness over the local normal
sm = np.convolve(ex, np.ones(3) / 3, "same")             # a 3 s spike, not a single pop
print(f"audio {n} s ({n / 3600:.2f} h) | median {np.median(db):.1f} dB | 99th pct excess {np.percentile(ex, 99):.1f} dB")

chat = None
if arg("--chat"):
    msgs = []
    for line in open(arg("--chat"), encoding="utf-8"):
        try:
            d = json.loads(line); a = d["replayChatItemAction"]; ms = int(a.get("videoOffsetTimeMsec", 0)) / 1000
            msgs.append(ms - T0)
        except Exception:
            pass
    h = np.histogram(msgs, bins=n, range=(0, n))[0].astype(float)
    r10 = np.convolve(h, np.ones(10), "same"); chat = r10 / (np.mean(r10) + 1e-9)
    print(f"chat: {len(msgs)} messages")

score = sm + (3 * np.log2(np.maximum(chat, 0.5)) if chat is not None else 0)
order = np.argsort(-score); picks = []
for i in order:
    if score[i] < 4 or len(picks) >= TOP: break
    if all(abs(i - p) >= 45 for p in picks): picks.append(int(i))
picks.sort()
print(f"{len(picks)} candidates")

from faster_whisper import WhisperModel
m = WhisperModel("base.en", device="cpu", compute_type="int8")
cands = []
for p in picks:
    a, b = max(0, p - 22), min(n, p + 10)
    segs, _ = m.transcribe(y[a * SR:b * SR], language="en", vad_filter=True, beam_size=1)
    text = " ".join(s.text.strip() for s in segs)
    cands.append({"peak_s": p + T0, "start_s": a + T0, "end_s": b + T0, "excess_db": round(float(sm[p]), 1), "chat_x": round(float(chat[p]), 2) if chat is not None else None,
                  "stamp": f"{int((p + T0) // 3600)}:{int((p + T0) % 3600 // 60):02d}:{int((p + T0) % 60):02d}", "text": text})
    print(f"{cands[-1]['stamp']} +{cands[-1]['excess_db']} dB  {text[:150]}")
(ROOT / "audio").mkdir(exist_ok=True)
json.dump({"source": SRC, "from_s": T0, "seconds": n, "loud_db": [round(float(v), 1) for v in ex[::1]], "candidates": cands}, open(ROOT / "audio/candidates.json", "w", encoding="utf-8"), indent=1)
