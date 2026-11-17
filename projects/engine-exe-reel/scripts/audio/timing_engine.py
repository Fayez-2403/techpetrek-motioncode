"""One timeline from the measured takes: lines laid back to back on the 120 BPM quarter-beat grid (a breath between
them), then SCENE_TIMINGS.json with every line's absolute word times and the key words the picture keys on
(the stroke numbers, 'Spark', 'ENGINE'). Re-run after any new take (scratch or Liam).
    python scripts/audio/timing_engine.py [--scratch]
"""
import json, math, pathlib, re, subprocess, sys

ROOT = pathlib.Path(__file__).resolve().parents[2]
SP = ROOT / "src/config/voScript.json"
S = json.loads(SP.read_text(encoding="utf-8"))
VO = "vo_scratch.py" if "--scratch" in sys.argv else "vo_engine.py"
L = {l["id"]: l for l in json.loads((ROOT / "audio/out/lines.json").read_text(encoding="utf-8"))["lines"]}
GRID = 0.25
GAP = {"v01": 0.25, "v02": 0.3, "v05": 0.3, "v09": 0.3, "v10": 0.3}   # breaths before the next section
t = 0.0
for l in S["reel"]:
    m = L[l["id"]]
    l["lead"] = 0.12 if l["id"] == "v01" else 0.06
    l["t0"] = round(t, 3)
    t = math.ceil((t + l["lead"] + m["dur"] + GAP.get(l["id"], 0.15)) / GRID) * GRID
    l["t1"] = round(t, 3)
S["reel"][-1]["t1"] = round(S["reel"][-1]["t0"] + S["reel"][-1]["lead"] + L[S["reel"][-1]["id"]]["dur"] + 1.1, 3)   # CTA ring-out
SP.write_text(json.dumps(S, ensure_ascii=False, indent=1), encoding="utf-8")
subprocess.run([sys.executable, str(ROOT / "scripts/audio" / VO), "--no-stt"], check=True, capture_output=True)
L = {l["id"]: l for l in json.loads((ROOT / "audio/out/lines.json").read_text(encoding="utf-8"))["lines"]}

out = {"fps": 60, "bpm": 120, "duration": S["reel"][-1]["t1"], "voice": json.loads((ROOT / "audio/out/lines.json").read_text(encoding="utf-8")).get("voice", "Liam"), "sections": [], "lines": [], "keys": {}}
for l in S["reel"]:
    m = L[l["id"]]
    words = [{"w": w["w"], "t0": round(m["start"] + w["t0"], 3), "t1": round(m["start"] + w["t1"], 3)} for w in m["words"]]
    out["sections"].append({"id": l["scene"], "line": l["id"], "t0": l["t0"], "t1": l["t1"]})
    out["lines"].append({"id": l["id"], "start": m["start"], "end": round(m["start"] + m["dur"], 3), "cap": l["cap"], "words": words})
def key(line, pat, name, end=False):
    ws = next(x for x in out["lines"] if x["id"] == line)["words"]
    w = next(w for w in ws if re.match(pat, w["w"], re.I))
    out["keys"][name] = w["t1"] if end else w["t0"]
key("v02", r"^23", "n23")
key("v01", r"^claude", "claude")
key("v11", r"^gearbox", "machines")
key("v02", r"^slow", "slow")
key("v03", r"^angle", "angle")
key("v04", r"^rod", "rod")
key("v05", r"^camshaft", "cam")
key("v06", r"^ek", "s1")
key("v07", r"^do", "s2")
key("v08", r"^teen", "s3")
key("v08", r"^spark", "spark")
key("v08", r"^spark", "sparkEnd", end=True)
key("v09", r"^chaar", "s4")
key("v10", r"^live", "live")
key("v11", r"^engine", "engine")
out["keys"]["s4end"] = next(x for x in out["lines"] if x["id"] == "v09")["end"]
(ROOT / "SCENE_TIMINGS.json").write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding="utf-8")
for s_ in out["sections"]: print(f"{s_['id']:7s} {s_['t0']:6.2f}-{s_['t1']:6.2f}")
print("keys", {k: round(v, 2) for k, v in out["keys"].items()})
print("duration", out["duration"])
