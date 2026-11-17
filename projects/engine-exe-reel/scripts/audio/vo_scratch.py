"""SCRATCH narration (free Microsoft hi-IN-MadhurNeural via edge-tts) while the ElevenLabs key is invalid. Same outputs
as vo_engine.py (Liam): audio/out/<id>.wav + audio/out/lines.json with word timings, so the timeline, captions and
picture are built now and Liam drops in later with `python scripts/audio/vo_engine.py` + timing_engine.py.
    python scripts/audio/vo_scratch.py [--no-stt]
"""
import asyncio, hashlib, io, json, pathlib, subprocess, sys

import numpy as np
import soundfile as sf

ROOT = pathlib.Path(__file__).resolve().parents[2]
S = json.loads((ROOT / "src/config/voScript.json").read_text(encoding="utf-8"))
OUT = ROOT / "audio/out"; TAKES = ROOT / "audio/takes_scratch"
OUT.mkdir(parents=True, exist_ok=True); TAKES.mkdir(parents=True, exist_ok=True)
SR = 44100
VOICE, RATE = "hi-IN-MadhurNeural", "+12%"


async def synth(text):
    import edge_tts
    c = edge_tts.Communicate(text, VOICE, rate=RATE, boundary="WordBoundary")
    audio, marks = b"", []
    async for ch in c.stream():
        if ch["type"] == "audio": audio += ch["data"]
        elif ch["type"] == "WordBoundary": marks.append([ch["offset"] / 1e7, (ch["offset"] + ch["duration"]) / 1e7, ch["text"]])
    return audio, marks


def take(text):
    h = hashlib.sha1(json.dumps([text, VOICE, RATE]).encode()).hexdigest()[:12]
    mp3, js = TAKES / f"{h}.mp3", TAKES / f"{h}.json"
    if not mp3.exists():
        a, m = asyncio.run(synth(text)); mp3.write_bytes(a); js.write_text(json.dumps(m, ensure_ascii=False), encoding="utf-8")
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(mp3), "-f", "wav", "-ac", "1", "-ar", str(SR), "-"], capture_output=True, check=True).stdout
    y, _ = sf.read(io.BytesIO(raw))
    return y, json.loads(js.read_text(encoding="utf-8"))


def trim(y):
    nz = np.where(np.abs(y) > 0.01)[0]
    a, b = max(0, nz[0] - int(0.04 * SR)), min(len(y), nz[-1] + int(0.1 * SR))
    y = y[a:b].copy(); f = int(0.015 * SR); y[-f:] *= np.linspace(1, 0, f)
    return y, a / SR


def words(cap, marks, off, dur):
    cw = [w for w in cap.split() if w not in ("—", "-")]
    spans = [[a - off, b - off] for a, b, _ in marks]
    if len(spans) != len(cw):
        # Devanagari and Roman word counts differ: spread the caption words over the speech by their length
        t0, t1 = (spans[0][0], spans[-1][1]) if spans else (0, dur)
        wt = [len(w.strip(",.!?…:")) + 2 for w in cw]; tot = sum(wt); acc = 0; spans = []
        for w in wt:
            spans.append([t0 + (t1 - t0) * acc / tot, t0 + (t1 - t0) * (acc + w) / tot]); acc += w
    return [{"w": w, "t0": round(max(0, a), 3), "t1": round(b, 3)} for w, (a, b) in zip(cw, spans)]


def main():
    meta = {"voice": f"SCRATCH {VOICE} {RATE} (edge-tts) — replace with Liam", "lines": []}
    wm = None
    for l in S["reel"]:
        y, marks = take(l["tts"]); y, off = trim(y)
        sf.write(OUT / f"{l['id']}.wav", y, SR, subtype="PCM_16")
        d = len(y) / SR; start = l["t0"] + l.get("lead", S["lead"]); room = l["t1"] - l.get("margin", 0.25) - start
        meta["lines"].append({"id": l["id"], "start": round(start, 3), "dur": round(d, 3), "fits": d <= room, "cap": l["cap"], "words": words(l["cap"], marks, off, d)})
        print(f"--- {l['id']} {d:.2f} s / {room:.2f} s{'' if d <= room else '   <-- TOO LONG'}\n  script : {l['tts']}")
        if "--no-stt" not in sys.argv:
            from scipy.signal import resample_poly
            from faster_whisper import WhisperModel
            wm = wm or WhisperModel("small", device="cpu", compute_type="int8")
            z = resample_poly(y, 16000, SR).astype(np.float32)
            print("  whisper:", " ".join(s.text.strip() for s in wm.transcribe(z, language="hi", beam_size=5)[0]))
    (OUT / "lines.json").write_text(json.dumps(meta, ensure_ascii=False, indent=1), encoding="utf-8")


if __name__ == "__main__":
    main()
