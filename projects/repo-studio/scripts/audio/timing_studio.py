"""One timeline: the measured takes laid back to back on the 120 BPM grid (each line starts on the beat after the
previous one ends + a breath), each repo beat starting when its name is spoken. Rewrites the voScript windows, then
SCENE_TIMINGS.json (sections, lines with absolute word times, repo beats). Run vo_studio.py --no-stt after it.
    python scripts/audio/timing_studio.py
"""
import json, math, pathlib, re, subprocess, sys
ROOT = pathlib.Path(__file__).resolve().parents[2]
SP = ROOT / "src/config/voScript.json"
S = json.loads(SP.read_text(encoding="utf-8"))
L = {l["id"]: l for l in json.loads((ROOT / "audio/out/lines.json").read_text(encoding="utf-8"))["lines"]}
BEAT = 0.5; GAP = {"v01": 0.55, "v08": 0.45}       # a little more air after the hook and before the CTA
NAMES = ["hook", "3d", "numbers", "motion", "sound", "checks", "ship", "total", "cta"]
REPOS = [("blender", r"^blender"), ("threejs", r"^three\.js"), ("numpy", r"^numpy"), ("numba", r"^numba"), ("scipy", r"^scipy"),
         ("gsap", r"^gsap"), ("remotion", r"^remotion"), ("puppeteer", r"^puppeteer"), ("tonejs", r"^tone\.js"), ("pedalboard", r"^pedalboard"),
         ("pyloudnorm", r"^pyloudnorm"), ("opencv", r"^opencv"), ("pillow", r"^pillow"), ("fasterwhisper", r"^faster-whisper"), ("ffmpeg", r"^ffmpeg"), ("reportlab", r"^reportlab")]
t = 0.0
for l in S["reel"]:
    m = L[l["id"]]; l["t0"] = round(t, 3); l["lead"] = 0.05 if l["id"] == "v01" else 0.08
    end = t + l["lead"] + m["dur"] + GAP.get(l["id"], 0.3)
    t = math.ceil(end / BEAT) * BEAT
    l["t1"] = round(t, 3)
S["reel"][-1]["t1"] = round(S["reel"][-1]["t0"] + S["reel"][-1]["lead"] + L[S["reel"][-1]["id"]]["dur"] + 1.6, 3)   # CTA ring-out
SP.write_text(json.dumps(S, ensure_ascii=False, indent=1), encoding="utf-8")
subprocess.run([sys.executable, str(ROOT / "scripts/audio/vo_studio.py"), "--no-stt"], check=True, capture_output=True)
L = {l["id"]: l for l in json.loads((ROOT / "audio/out/lines.json").read_text(encoding="utf-8"))["lines"]}
out = {"fps": 60, "bpm": 120, "beat": BEAT, "duration": S["reel"][-1]["t1"], "sections": [], "lines": [], "beats": []}
for name, l in zip(NAMES, S["reel"]):
    m = L[l["id"]]
    out["sections"].append({"id": name, "line": l["id"], "t0": l["t0"], "t1": l["t1"]})
    words = [{"w": w["w"], "t0": round(m["start"] + w["t0"], 3), "t1": round(m["start"] + w["t1"], 3)} for w in m["words"]]
    out["lines"].append({"id": l["id"], "start": m["start"], "end": round(m["start"] + m["dur"], 3), "cap": l["cap"], "words": words})
    for slug, rx in REPOS:
        hit = next((w for w in words if re.match(rx, w["w"].lower().strip("…,.!?"))), None)
        if hit: out["beats"].append({"slug": slug, "section": name, "t0": round(hit["t0"] - 0.12, 3)})
out["beats"].sort(key=lambda b: b["t0"])
for i, b in enumerate(out["beats"]):
    nxt = out["beats"][i + 1]["t0"] if i + 1 < len(out["beats"]) else None
    sec = next(s for s in out["sections"] if s["id"] == b["section"])
    b["t1"] = round(min(nxt, sec["t1"]) if nxt and nxt < sec["t1"] else sec["t1"], 3)
(ROOT / "SCENE_TIMINGS.json").write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding="utf-8")
for s in out["sections"]: print(f"{s['id']:8s} {s['t0']:6.2f}-{s['t1']:6.2f}")
for b in out["beats"]: print(f"   {b['slug']:14s} {b['t0']:6.2f}-{b['t1']:6.2f} ({b['t1'] - b['t0']:.2f} s)")
print("duration", out["duration"], "|", len(out["beats"]), "repo beats")
