"""Intelligibility check: local faster-whisper (small, int8) listens to each narration line's window, in English mode (it
renders the Hinglish as English, which makes numbers and names comparable), and we count how many of the line's key
tokens (numbers, model and product names) it recovers. Run on the dry narration (--dry, the baseline) and on the
delivered MP4 (music + SFX + voice): a key token heard dry but lost in the mix means the mix masks the voice there.

    python scripts/stt_check.py master|reel [--dry]        -> out/qa/stt_<variant>[_dry].json
"""
import json, pathlib, re, subprocess, sys

import numpy as np

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "audio-src"))
from version import V as VER, SUFFIX, SCRIPT_PATH, TIMINGS  # noqa: E402  (--version v1|v2)
TM = json.loads(TIMINGS.read_text(encoding="utf-8"))
S = json.loads(SCRIPT_PATH.read_text(encoding="utf-8"))
FILES = {"master": ROOT.parent / f"KIMI_K31_PRO_MASTER_16x9_{VER}.mp4", "reel": ROOT.parent / f"KIMI_K31_PRO_REEL_9x16_{VER}.mp4"}
NAMES = ["kimi", "moonshot", "benchcad", "terminal", "opus", "officeqa", "highspeed", "unity", "unreal", "godot", "three"]


def keys(cap):
    toks = [w.strip(",.?!:…").lower() for w in cap.split()]
    nums = [re.sub(r"[^0-9.]", "", t) for t in toks if re.search(r"\d", t)]
    nums = [n.strip(".") for n in nums if n.strip(".") and n not in ("3",)]   # "3D" etc. handled as names
    return [n for n in nums if n] + [n for n in NAMES if any(n in t.replace("-", "").replace(".", "") for t in toks)]


def main(v):
    from faster_whisper import WhisperModel
    dry = "--dry" in sys.argv
    src = ROOT / "public" / "audio" / f"vo_{v}{SUFFIX}.wav" if dry else FILES[v]
    raw = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", str(src), "-vn", "-f", "f32le", "-ac", "1", "-ar", "16000", "pipe:1"], capture_output=True, check=True).stdout
    y = np.frombuffer(raw, np.float32)
    model = WhisperModel("small", device="cpu", compute_type="int8")
    out = []
    for line, vo in zip(S[v], TM["variants"][v]["vo"]):
        a, b = int(max(0, vo["start"] - 0.1) * 16000), int((vo["end"] + 0.25) * 16000)
        segs, _ = model.transcribe(y[a:b], language="en", vad_filter=False, beam_size=5)
        heard = " ".join(s.text.strip() for s in segs)
        h = heard.lower().replace(",", "").replace("-", "").replace("three.js", "three js")
        hs = h.replace(" ", "").replace("3js", "threejs")
        k = keys(line["cap"]); got = [x for x in k if x in h or (not re.match(r"[\d.]+$", x) and x in hs)]
        out.append({"id": line["id"], "keys": k, "heard_keys": got, "recall": round(len(got) / len(k), 2) if k else None, "heard": heard})
        print(f"{line['id']} {len(got)}/{len(k)}  {heard}")
    tot = sum(len(o["keys"]) for o in out); got = sum(len(o["heard_keys"]) for o in out)
    (ROOT / "out" / "qa").mkdir(parents=True, exist_ok=True)
    (ROOT / "out" / "qa" / f"stt_{v}_{VER}{'_dry' if dry else ''}.json").write_text(json.dumps({"key_recall": round(got / tot, 3), "lines": out}, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"key-token recall {got}/{tot} = {got / tot:.0%}")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 and not sys.argv[1].startswith("-") else "master")
