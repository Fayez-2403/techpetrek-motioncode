"""SCRATCH guide narration (timing only, NOT the final voice): Microsoft Edge neural TTS hi-IN-MadhurNeural through the
edge-tts package, one request per line, with the service's word-boundary timestamps. Same outputs as vo.py
(audio-src/out/<variant>/<line>.wav + audio-src/out/lines_<variant>.json, marked "scratch": true), so the
picture is cut to real speech lengths. Replace it with vo.py (ElevenLabs Liam) or align.py (a recorded take).

    python audio-src/scratch_vo.py master|reel
"""
import asyncio, io, json, pathlib, subprocess, sys

import numpy as np
import soundfile as sf
import edge_tts

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from vo import HERE, SCRIPT, SR, phrases, spans, caption_words  # noqa: E402
from version import V, OUT as VOUT  # noqa: E402

VOICE, RATE = ("hi-IN-MadhurNeural", "+12%") if V == "v1" else (SCRIPT["voice"]["voiceId"], SCRIPT["voice"]["rate"])


async def say(text):
    c = edge_tts.Communicate(text, VOICE, rate=RATE, boundary="WordBoundary")
    audio, words = bytearray(), []
    async for ch in c.stream():
        if ch["type"] == "audio": audio += ch["data"]
        elif ch["type"] == "WordBoundary": words.append((ch["text"], ch["offset"] / 1e7, (ch["offset"] + ch["duration"]) / 1e7))
    return bytes(audio), words


def decode(mp3):
    raw = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", "pipe:0", "-f", "f32le", "-ac", "1", "-ar", str(SR), "pipe:1"],
                         input=mp3, capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).copy()


def main(variant):
    O = VOUT / variant; O.mkdir(parents=True, exist_ok=True); res = []
    only = sys.argv[sys.argv.index("--only") + 1].split(",") if "--only" in sys.argv else None   # regenerate just these lines
    prev = {x["id"]: x for x in json.loads((VOUT / f"lines_{variant}.json").read_text(encoding="utf-8"))["lines"]} if only else {}
    for l in SCRIPT[variant]:
        if only and l["id"] not in only:
            res.append(prev[l["id"]]); continue
        tts = l["tts"]; mp3, words = asyncio.run(say(tts)); y = decode(mp3)
        sp = spans(tts, 0, phrases(tts)); wt, pos = [], 0
        for w, a, b in words:                       # word -> char position in the line
            i = tts.find(w, pos)
            if i < 0: continue
            wt.append((i, a, b)); pos = i + len(w)
        s0 = max(0.0, wt[0][1] - 0.05); s1 = min(len(y) / SR, wt[-1][2] + 0.16)
        clip = y[int(s0 * SR):int(s1 * SR)].copy()
        f = int(0.012 * SR); clip[:f] *= np.linspace(0, 1, f); clip[-f:] *= np.linspace(1, 0, f)
        sf.write(O / f"{l['id']}.wav", clip, SR, subtype="PCM_16")
        ph = []
        for cap, (c0, c1) in zip(phrases(l["cap"]), sp):
            inn = [(a, b) for i, a, b in wt if c0 <= i <= c1]
            t0, t1 = (inn[0][0] - s0, inn[-1][1] - s0) if inn else (ph[-1]["t1"] if ph else 0, (ph[-1]["t1"] if ph else 0) + 0.3)
            ph.append({"cap": cap, "t0": round(t0, 3), "t1": round(t1, 3), "words": caption_words(cap, t0, t1)})
        res.append({"id": l["id"], "scene": l["scene"], "min": l["min"], "cut": l.get("cut"), "dur": round(len(clip) / SR, 3), "phrases": ph})
        print(f"{l['id']} {l['scene']:<11} {len(clip) / SR:5.2f} s  (min {l['min']})")
    meta = {"source": f"Microsoft Edge neural TTS {VOICE} rate {RATE}" + (" (SCRATCH guide voice, timing only)" if V == "v1" else " (v2 English narration)"),
            "take": None, "scratch": V == "v1", "lines": res}
    (VOUT / f"lines_{variant}.json").write_text(json.dumps(meta, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"total speech {sum(r['dur'] for r in res):.1f} s")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 and not sys.argv[1].startswith("-") else "master")
