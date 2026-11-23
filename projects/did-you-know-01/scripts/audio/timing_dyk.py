"""DID YOU KNOW #01 dialogue timeline -> SCENE_TIMINGS.json (the single timing source for picture, captions and
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
    # hook: the terminal types from frame 0; the result lands on "nahi"; the clock flips on "1901"; the title on "Chaar"
    "hResult": W("d01", 2, 6), "hFlip": W("d02", 0, 7), "hTitle": S("d04"),
    # 1 float
    "fRun": S("d05"), "fOut": P("d05", 0, "t1", -0.1), "fFour": W("d06", 0, 3), "fBin": P("d07", 0), "f01": P("d07", 1), "fThird": P("d07", 2),
    "fNever": P("d07", 3), "fRound": P("d08", 0), "fLeft": P("d08", 1), "fSrc": P("d07", 0, "t0", 0.4),
    # 2 hash
    "hQ": S("d12"), "hYes": S("d13"), "hMachine": P("d13", 1), "hIn": P("d13", 2), "hOut": P("d13", 3), "hLogin": S("d14"),
    "hType": P("d15", 0), "hMatch": P("d15", 1, "t1", -0.2), "hWrong": P("d15", 2), "hDiff": P("d15", 3), "hSrc": P("d13", 1, "t0", 0.3),
    # 3 tokens
    "tQ": S("d16"), "tWords": P("d17", 0), "tTok": P("d17", 1), "tEn": P("d17", 3), "tHi": P("d18", 0), "tOld": W("d18", 1, 4), "tNew": P("d18", 2), "t15": W("d18", 2, 4),
    "tUp": S("d19"), "tSrc": P("d17", 1, "t0", 0.2),
    # 4 2038
    "yQ": P("d19", 2), "yEpoch": P("d21", 1), "yLimit": P("d21", 2), "yMax": P("d21", 3), "yWhen": S("d22"), "yDate": P("d23", 0),
    "yWrap": P("d23", 1, "t1", -0.15), "y1901": P("d23", 2), "yFix": S("d24"), "y64": P("d25", 0), "y292": P("d25", 1), "y21": P("d25", 2), "ySrc": P("d21", 1, "t0", 0.3),
    # cta
    "cta": S("d26"), "typeDYK": P("d26", 1, "t0", 0.3),
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
