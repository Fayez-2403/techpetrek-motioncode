"""Berth 42 timeline -> SCENE_TIMINGS.json (the one timing source for picture, captions and sound) + public/audio/vo.wav.
Lines play in script order: gap 0.08 s, +0.12 s on a scene change, plus each line's 'pre' and 'post'.
Shots hang on these word times (film/tl.py reads them).

    python scripts/audio/timing_reel.py
"""
import json, pathlib, math
import numpy as np, soundfile as sf

import sys
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from version import OUT, TIMINGS, SUFFIX, SCRIPT_PATH  # noqa: E402  (--version v2)
ROOT = pathlib.Path(__file__).resolve().parents[2]
SR, FPS = 44100, 60
L = json.loads((OUT / "lines_reel.json").read_text(encoding="utf-8"))["lines"]
JG = json.loads(SCRIPT_PATH.read_text(encoding="utf-8")).get("pause", {}).get("join_gap", 0.08)
GRID = json.loads(SCRIPT_PATH.read_text(encoding="utf-8")).get("grid")      # chant: a new (non-joined) line starts on a beat
BEAT = 60.0 / GRID["bpm"] * GRID.get("snap_beats", 1) if GRID else None
CG = json.loads(SCRIPT_PATH.read_text(encoding="utf-8")).get("pause", {}).get("chain_gap", 0.06)
cur, prev, out = 0.12, None, []
for l in L:
    if l.get("with"):                                     # unison: same start as its partner, no own caption
        w = next(o for o in out if o["id"] == l["with"])
        st = w["start"]
        ph = [{"cap": p["cap"], "t0": round(st + p["t0"], 3), "t1": round(st + p["t1"], 3),
               "words": [{"w": x["w"], "t0": round(st + x["t0"], 3), "t1": round(st + x["t1"], 3)} for x in p["words"]]}
              for p in l["phrases"]]
        out.append({"id": l["id"], "who": l.get("who"), "scene": l["scene"], "start": st, "end": round(st + l["dur"], 3), "dur": l["dur"],
                    "phrases": ph, "with": l["with"], "tek": l.get("tek", False)})
        cur = max(cur, st + l["dur"] + l["post"])
        continue
    tight = prev and (prev.get("join") or prev.get("chain"))
    if prev:
        cur += JG if prev.get("join") else (CG if prev.get("chain") else 0.08)
        if prev["scene"] != l["scene"] and not tight:
            cur += 0.12
    cur += l["pre"]
    if BEAT and not tight:
        cur = math.ceil((cur - 0.02) / BEAT) * BEAT      # onto the next beat
    st = round(cur, 3)
    ph = [{"cap": p["cap"], "t0": round(st + p["t0"], 3), "t1": round(st + p["t1"], 3),
           "words": [{"w": w["w"], "t0": round(st + w["t0"], 3), "t1": round(st + w["t1"], 3)} for w in p["words"]]}
          for p in l["phrases"]]
    out.append({"id": l["id"], "who": l.get("who"), "scene": l["scene"], "start": st, "end": round(st + l["dur"], 3), "dur": l["dur"],
                "phrases": ph, "tek": l.get("tek", False)})
    cur = max(cur, st + l["dur"] + l["post"])
    prev = l
TOTAL = round(cur + 0.3, 3)
y = np.zeros(int(TOTAL * SR) + SR, np.float32)
for l in out:
    a, _ = sf.read(OUT / "reel" / f"{l['id']}.wav", dtype="float32")
    i = int(l["start"] * SR)
    y[i:i + len(a)] += a
(ROOT / "public/audio").mkdir(parents=True, exist_ok=True)
sf.write(ROOT / f"public/audio/vo{SUFFIX}.wav", y[:int(TOTAL * SR)], SR, subtype="PCM_16")
TIMINGS.write_text(json.dumps({"fps": FPS, "total": TOTAL, "frames": int(round(TOTAL * FPS)),
                                                      "lines": out}, ensure_ascii=False, indent=1), encoding="utf-8")
print(f"total {TOTAL:.2f} s, {int(round(TOTAL * FPS))} frames")
for l in out:
    print(l["id"], l["scene"], l["start"], l["end"], " | ".join(p["cap"] for p in l["phrases"]))
