"""Dialogue timeline for the two-voice reel -> SCENE_TIMINGS.json (the single timing source for picture, captions and
sound) + public/audio/vo.wav. Lines play in script order: gap 0.14 s on a speaker change, 0.08 s same speaker,
+0.12 s on a scene change, plus each line's 'pre' (silence before) and 'post' (hold after for an animation beat).
Named beats ('ev') are tied to words, so picture and SFX share them.

    python scripts/audio/timing_duo.py
"""
import json, pathlib
import numpy as np, soundfile as sf
ROOT = pathlib.Path(__file__).resolve().parents[2]
SR, FPS = 44100, 60
L = json.loads((ROOT / "audio/out/lines_reel.json").read_text(encoding="utf-8"))["lines"]
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
    # hook: the crowd halves 31 times from "Sirf" to 1.5 s after the line
    "halveA": S("b03"), "halveB": E("b03", 0.75), "sortedW": P("b01", 1), "scanA": S("b02"), "scanB": E("b02"),
    # problem
    "notif": S("b04", 0.1), "headDrop": P("b04", 3, "t0", 0.1), "bhaiIn": S("b05"), "scaleWhack": P("b05", 1, "t1", 0.05),
    # game
    "lineIn": S("b06"), "crawl1": P("b07", 0), "crawl2": P("b07", 1), "crawl3": P("b07", 2), "chop": P("b08", 1, "t0", 0.15),
    "g50": S("b09"), "snap1": S("b10", 0.05), "g75": S("b11"), "snap2": S("b12", 0.05),
    "g62": P("b13", 0), "snap3": P("b13", 0, "t1", 0.02), "g68": P("b13", 1), "snap4": P("b13", 1, "t1", 0.02), "g71": P("b13", 2), "found": P("b13", 2, "t1", -0.1),
    "bsTitle": P("b14", 2),
    # code
    "cards": S("b15"), "flagL": P("b15", 1), "flagH": P("b15", 2), "flagM": W("b15", 3, 3), "hopL": P("b16", 0, "t0", 0.35), "hopH": P("b16", 1, "t0", 0.35),
    "shuffle": P("b17", 1), "xStamp": P("b17", 1, "t1", 0.15), "unshuffle": E("b17", 0.45),
    "typeBad": S("b18"), "overflow": P("b18", 1), "crack": S("b19"), "fix": P("b19", 2), "fixed": E("b19", 0.1),
    # office
    "office": S("b21"), "broken": P("b21", 1), "commits": P("b21", 2), "bisectA": P("b21", 3, "t1"), "bisectB": E("b21", 0.55),
    # hero
    "frustrate": S("b22"), "heroTitle": P("b23", 0),
    # exam
    "exam": S("b24"), "books": P("b24", 1), "oneChapter": P("b24", 2), "question": P("b24", 3),
    "sim10": E("b25", -0.1), "fail": S("b26"), "scaleIn": P("b26", 2), "tiles": P("b26", 4), "naGlow": P("b27", 0), "haanGlow": P("b27", 1), "sorted": P("b27", 2),
    # border search
    "bExact": P("b28", 0), "f15": P("b28", 2), "f23": P("b28", 3), "f19": P("b28", 4), "f21": P("b28", 5), "f22": P("b28", 6),
    "gold23": S("b29"), "tally": P("b29", 1), "cardFlip": P("b30", 1), "bananas": P("b30", 1, "t0", 0.2), "chips": E("b30", 0.15),
    # payoff + cta
    "call": S("b31"), "problemType": S("b31", 0.2), "snapHand": P("b31", 2), "cta": S("b32"), "typeBinary": P("b32", 0, "t0", 0.25),
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
    c, sr = sf.read(ROOT / "audio/out/reel" / f"{l['id']}.wav", dtype="float32"); a = int(l["start"] * SR) - int(0.05 * SR)
    a = max(a, 0); y[a:a + len(c)] += c
# mouth openness per speaker per frame (0..1) from each voice's own lines: drives the cartoon lip flap
nF = int(round(TOTAL * FPS)); mouth = {"bro": np.zeros(nF), "bhai": np.zeros(nF)}
for l in out:
    c, _ = sf.read(ROOT / "audio/out/reel" / f"{l['id']}.wav", dtype="float32"); a = max(int(l["start"] * SR) - int(0.05 * SR), 0)
    hop = SR // FPS
    for k in range(len(c) // hop):
        f = (a + k * hop) // hop
        if f < nF: mouth[l["who"]][f] = max(mouth[l["who"]][f], float(np.sqrt(np.mean(c[k * hop:(k + 1) * hop] ** 2))))
for w in mouth:
    m = mouth[w]; ref = np.percentile(m[m > 0.005], 90) if (m > 0.005).any() else 1
    mouth[w] = [round(float(min(1, max(0, (x - 0.012) / (ref - 0.012)))), 2) for x in m]
json.dump(mouth, open(ROOT / "src/config/mouth.json", "w"), separators=(",", ":"))
(ROOT / "public/audio").mkdir(parents=True, exist_ok=True)
sf.write(ROOT / "public/audio/vo.wav", y[:int(TOTAL * SR)], SR, subtype="PCM_16")
json.dump({"fps": FPS, "total": TOTAL, "frames": int(round(TOTAL * FPS)), "scenes": scenes, "ev": ev, "lines": out},
          open(ROOT / "SCENE_TIMINGS.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(f"total {TOTAL:.2f} s, {int(round(TOTAL * FPS))} frames")
for s in scenes: print(f"  {s['id']:<8} {s['start']:6.2f} - {s['end']:6.2f}  ({s['end'] - s['start']:.1f} s)")
