"""The reel's one timeline, from the measured takes: lines back to back on the 120 BPM quarter-beat grid (each line's
'gap' is the breath after it), every scene = its line, plus absolute word times. SCENE_TIMINGS.json is read by the
picture (src/reel/timeline.ts), the captions and the sound (scripts/audio/mix_reel.py). Re-run after any new take.
    python scripts/audio/timing_reel.py
"""
import json, math, pathlib

ROOT = pathlib.Path(__file__).resolve().parents[2]
S = json.loads((ROOT / "src/config/voScript.json").read_text(encoding="utf-8"))
LJ = json.loads((ROOT / "audio/out/lines.json").read_text(encoding="utf-8"))
L = {l["id"]: l for l in LJ["lines"]}
GRID = 0.125
HOOK_LEAD = 0.08    # frame 0 is already moving; the first word lands at 0.08 s
t = 0.0
out = {"fps": 60, "bpm": S["bpm"], "voice": LJ["voice"], "sections": [], "lines": [], "bite": []}
B = S.get("bite")
def place_bite():
    global t
    # the source bite: the presenter's own words (original audio, 1.0x), cut back to back; captions spread over each segment
    if True:
        for i, (a, b, text) in enumerate(B["segments"]):
            ws = text.split(); wt = [len(w) + 2 for w in ws]; tot = sum(wt); acc = 0; words = []
            for w, k in zip(ws, wt):
                words.append({"w": w, "t0": round(t + 0.06 + (b - a - 0.2) * acc / tot, 3), "t1": round(t + 0.06 + (b - a - 0.2) * (acc + k) / tot, 3)}); acc += k
            out["bite"].append({"clip": B["clip"], "src0": a, "src1": b, "t0": round(t, 3), "t1": round(t + b - a, 3)})
            out["lines"].append({"id": f"b{i + 1}", "scene": "bite", "start": round(t, 3), "end": round(t + b - a, 3), "cap": text, "words": words})
            t += b - a
        out["sections"].append({"id": "bite", "line": "b1", "t0": out["bite"][0]["t0"], "t1": round(t, 3)})

first = S.get("bite_after") is None
if B and first: place_bite()
for i, l in enumerate(S["reel"]):
    m = L[l["id"]]
    lead = HOOK_LEAD if i == 0 else S["lead"]
    start = t + lead
    end = start + m["dur"]
    t1 = math.ceil((end + l.get("gap", 0.15)) / GRID) * GRID
    if l["scene"] == "cta": t1 = round(end + 1.2, 3)    # ring-out: the end hold stays <= 1.4 s
    out["sections"].append({"id": l["scene"], "line": l["id"], "t0": round(t, 3), "t1": round(t1, 3)})
    out["lines"].append({"id": l["id"], "scene": l["scene"], "start": round(start, 3), "end": round(end, 3), "cap": l["cap"],
                         "words": [{"w": w["w"], "t0": round(start + w["t0"], 3), "t1": round(start + w["t1"], 3)} for w in m["words"]]})
    t = t1
    if B and S.get("bite_after") == l["id"]: place_bite()
out["duration"] = round(t, 3)
(ROOT / "SCENE_TIMINGS.json").write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding="utf-8")
for s in out["sections"]: print(f"{s['id']:12s} {s['t0']:6.2f} - {s['t1']:6.2f}  ({s['t1'] - s['t0']:.2f})")
print("duration", out["duration"], "|", out["voice"])
