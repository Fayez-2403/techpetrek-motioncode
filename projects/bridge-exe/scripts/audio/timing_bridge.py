"""One timeline for picture and sound: voScript windows (the reel's sections) + the measured takes
(audio/out/lines.json) -> SCENE_TIMINGS.json, read by the app's ?reel=1 mode, the Remotion overlay and the mixer.
    python scripts/audio/timing_bridge.py
"""
import json, pathlib

ROOT = pathlib.Path(__file__).resolve().parents[2]
S = json.loads((ROOT / "src/config/voScript.json").read_text(encoding="utf-8"))
L = {l["id"]: l for l in json.loads((ROOT / "audio/out/lines.json").read_text(encoding="utf-8"))["lines"]}
NAMES = ["hook", "reveal", "geometry", "load", "lenses", "compare", "cad", "arcade", "evidence", "cta"]
out = {"fps": 60, "bpm": 120, "beat": 0.5, "duration": S["reel"][-1]["t1"], "sections": [], "lines": []}
for name, l in zip(NAMES, S["reel"]):
    m = L[l["id"]]
    assert m["fits"], f"{l['id']} does not fit its window"
    out["sections"].append({"id": name, "line": l["id"], "t0": l["t0"], "t1": l["t1"]})
    out["lines"].append({"id": l["id"], "start": m["start"], "end": round(m["start"] + m["dur"], 3), "cap": l["cap"],
                         "words": [{"w": w["w"], "t0": round(m["start"] + w["t0"], 3), "t1": round(m["start"] + w["t1"], 3)} for w in m["words"]]})
(ROOT / "SCENE_TIMINGS.json").write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding="utf-8")
for s, l in zip(out["sections"], out["lines"]):
    print(f"{s['id']:9s} {s['t0']:5.1f}-{s['t1']:5.1f}  voice {l['start']:6.2f}-{l['end']:6.2f}  {' '.join(w['w'] + '@' + str(w['t0']) for w in l['words'][:4])} …")
