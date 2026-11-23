"""Sliding Window (Pehchaan cut) dialogue timeline -> SCENE_TIMINGS.json (the single timing source for picture, captions and
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
    # problem
    "headDrop": P("w01", 2, "t0", 0.2), "tension": S("w02"), "trainIn": P("w02", 1, "t1", -0.55),
    # simple: 8 overs, the khidki, the rule, then one slide per spoken sum
    "oversIn": S("w03"), "lagatar": P("w03", 1), "brute": S("w04"), "khidki": P("w05", 1), "aage": P("w05", 2), "naya": P("w05", 3), "purana": P("w05", 4),
    "s0": P("w06", 0), "s1": P("w06", 1), "s2": P("w06", 2), "s3": P("w06", 3), "s4": P("w06", 4), "best": P("w06", 5), "plusMinus": P("w06", 5, "t1", 0.2),
    "surprised": S("w07"), "asli": P("w08", 1), "tieOn": P("w08", 2), "quizIn": S("w09", -0.2),
    # quiz
    "q1": S("w09", -0.15), "q1hl": W("w09", 0, 6), "q1ok": P("w10", 3),
    "q2": S("w11", -0.15), "q2hl": W("w11", 0, 2), "q2hl2": W("w11", 0, 5), "q2shrink": P("w12", 2), "q2ok": P("w12", 3),
    "q3": S("w13", -0.15), "q3hl": W("w13", 0, 2), "q3hl2": W("w13", 0, 6), "q3shrink": P("w14", 0), "q3ok": P("w14", 1),
    "q4": S("w15", -0.15), "q4hl": W("w15", 0, 2), "q4huh": S("w16"), "q4size": P("w17", 0), "q4count": P("w17", 1), "q4ok": P("w18", 2),
    "q5": S("w19", -0.15), "q5hl": W("w19", 1, 0), "q5hl2": W("w19", 1, 2), "q5ok": W("w20", 0, 2),
    # rule + cta
    "tieOff": S("w21"), "c1": P("w21", 1), "c2": P("w21", 2), "c3": P("w21", 3), "phod": S("w22", 0.3),
    "cta": S("w23"), "platforms": P("w23", 1), "typeKey": P("w23", 2, "t0", 0.3),
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
