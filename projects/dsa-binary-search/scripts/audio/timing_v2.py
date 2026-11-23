"""v2 dialogue timeline (the Pehchaan cut) -> SCENE_TIMINGS.json (the single timing source for picture, captions and
sound) + public/audio/vo.wav. Lines play in script order: gap 0.14 s on a speaker change, 0.08 s same speaker,
+0.12 s on a scene change, plus each line's 'pre' (silence before) and 'post' (hold after for an animation beat).
Named beats ('ev') are tied to words, so picture and SFX share them.

    python scripts/audio/timing_duo.py
"""
import json, pathlib
import numpy as np, soundfile as sf
ROOT = pathlib.Path(__file__).resolve().parents[2]
SR, FPS = 44100, 60
L = json.loads((ROOT / "audio/out/v2/lines_reel.json").read_text(encoding="utf-8"))["lines"]
cur, prev, out = 0.08, None, []
for l in L:
    if prev:
        cur += 0.14 if prev["who"] != l["who"] else 0.08
        if prev["scene"] != l["scene"]: cur += 0.12
    cur += l["pre"]; st = round(cur, 3)
    ph = [{"cap": p["cap"], "t0": round(st + p["t0"], 3), "t1": round(st + p["t1"], 3),
           "words": [{"w": w["w"], "t0": round(st + w["t0"], 3), "t1": round(st + w["t1"], 3)} for w in p["words"]]} for p in l["phrases"]]
    out.append({"id": l["id"], "who": l["who"], "scene": l["scene"], "start": st, "end": round(st + l["dur"], 3), "dur": l["dur"], "phrases": ph})
    cur = st + l["dur"] + l["post"]; prev = l
TOTAL = round(cur + 0.35, 3)
by = {l["id"]: l for l in out}
def P(i, k=0, edge="t0", d=0.0): return round(by[i]["phrases"][k][edge] + d, 3)
def S(i, d=0.0): return round(by[i]["start"] + d, 3)
def E(i, d=0.0): return round(by[i]["end"] + d, 3)
def W(i, k, j, edge="t0", d=0.0): return round(by[i]["phrases"][k]["words"][j][edge] + d, 3)
ev = {
    # problem: the HR notification is on screen from frame 0
    "headDrop": P("a01", 2, "t0", 0.2), "tension": S("a02"), "scaleToss": P("a02", 1, "t1", -0.35),
    # simple: one scale, 1..1000, target 737 (10 steps: 500 750 625 687 718 734 742 738 736 737)
    "sorted": P("a03", 0), "mid500": P("a03", 1, "t0", 0.1), "target": S("a04"),
    "snap1": W("a05", 0, 3), "mid750": P("a05", 1), "snap2": P("a05", 2, "t0", 0.15),
    "rapidA": P("a06", 0), "rapidB": P("a06", 1, "t1"), "found": P("a06", 2), "ten": W("a06", 2, 1),
    "surprised": S("a07"), "asli": P("a08", 1), "tieOn": P("a08", 2), "quizIn": S("a09", -0.2),
    # quiz: card in, the giveaway words, Bro's stamp on "binary"
    "q1": S("a09", -0.15), "q1hl": W("a09", 0, 2), "q1ok": P("a10", 1),
    "q2": S("a11", -0.15), "q2hl": W("a11", 0, 4), "q2half": P("a12", 1), "q2ok": P("a12", 2),
    "q3": S("a13", -0.15), "q3hl": W("a13", 0, 2), "q3huh": S("a14"), "q3range": S("a15"), "q3sweep": P("a15", 1), "q3ok": W("a16", 1, 2),
    "q4": S("a17", -0.15), "q4hl": W("a17", 0, 2), "q4days": W("a17", 0, 8), "q4ok": W("a18", 2, 2),
    "q5": S("a19", -0.15), "q5hl": W("a19", 1, 3), "q5ok": W("a20", 0, 2),
    # rule + cta
    "tieOff": S("a21"), "c1": P("a21", 1), "c2": P("a21", 2), "c3": P("a21", 3), "phod": S("a22", 0.3),
    "cta": S("a23"), "typeBinary": P("a23", 1, "t0", 0.3),
}
scenes, order = [], []
for l in out:
    if not order or order[-1] != l["scene"]: order.append(l["scene"]); scenes.append({"id": l["scene"], "start": l["start"]})
for i, s in enumerate(scenes): s["end"] = scenes[i + 1]["start"] if i + 1 < len(scenes) else TOTAL
scenes[0]["start"] = 0.0
# visual scene cuts land a little before the line that opens them (the picture leads the voice)
for s in scenes[1:]: s["start"] = round(s["start"] - 0.18, 3)
for i in range(len(scenes) - 1): scenes[i]["end"] = scenes[i + 1]["start"]
y = np.zeros(int(TOTAL * SR) + SR, np.float32)
for l in out:
    c, sr = sf.read(ROOT / "audio/out/v2/reel" / f"{l['id']}.wav", dtype="float32"); a = int(l["start"] * SR) - int(0.05 * SR)
    a = max(a, 0); y[a:a + len(c)] += c
# mouth openness per speaker per frame (0..1) from each voice's own lines: drives the cartoon lip flap
nF = int(round(TOTAL * FPS)); mouth = {"bro": np.zeros(nF), "bhai": np.zeros(nF)}
for l in out:
    c, _ = sf.read(ROOT / "audio/out/v2/reel" / f"{l['id']}.wav", dtype="float32"); a = max(int(l["start"] * SR) - int(0.05 * SR), 0)
    hop = SR // FPS
    for k in range(len(c) // hop):
        f = (a + k * hop) // hop
        if f < nF: mouth[l["who"]][f] = max(mouth[l["who"]][f], float(np.sqrt(np.mean(c[k * hop:(k + 1) * hop] ** 2))))
for w in mouth:
    m = mouth[w]; ref = np.percentile(m[m > 0.005], 90) if (m > 0.005).any() else 1
    mouth[w] = [round(float(min(1, max(0, (x - 0.012) / (ref - 0.012)))), 2) for x in m]
json.dump(mouth, open(ROOT / "src/config/mouth.v2.json", "w"), separators=(",", ":"))
(ROOT / "public/audio").mkdir(parents=True, exist_ok=True)
sf.write(ROOT / "public/audio/vo_v2.wav", y[:int(TOTAL * SR)], SR, subtype="PCM_16")
json.dump({"fps": FPS, "total": TOTAL, "frames": int(round(TOTAL * FPS)), "scenes": scenes, "ev": ev, "lines": out},
          open(ROOT / "SCENE_TIMINGS.v2.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(f"total {TOTAL:.2f} s, {int(round(TOTAL * FPS))} frames")
for s in scenes: print(f"  {s['id']:<8} {s['start']:6.2f} - {s['end']:6.2f}  ({s['end'] - s['start']:.1f} s)")
