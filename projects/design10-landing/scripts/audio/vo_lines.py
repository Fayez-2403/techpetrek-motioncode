"""Narration, one take per line, cached by text + voice settings. Writes audio/out/<id>.wav and audio/out/lines.json
(line length + caption word times relative to the line start); timing_reel.py then lays the lines on the timeline.
  python scripts/audio/vo_lines.py scratch [--no-stt]   # free hi-IN-MadhurNeural (edge-tts) while the ElevenLabs key is invalid
  python scripts/audio/vo_lines.py liam [--no-stt]      # ElevenLabs Liam, eleven_turbo_v2_5 hi (voScript.json "voice"); key from HKCU, never printed
Every take is checked with faster-whisper (small, hi) unless --no-stt; Scribe is the second check for Liam.
"""
import asyncio, base64, hashlib, io, json, os, pathlib, subprocess, sys, urllib.request

import numpy as np
import soundfile as sf

ROOT = pathlib.Path(__file__).resolve().parents[2]
S = json.loads((ROOT / "src/config/voScript.json").read_text(encoding="utf-8"))
MODE = sys.argv[1] if len(sys.argv) > 1 and not sys.argv[1].startswith("-") else "scratch"
OUT = ROOT / "audio/out"; TAKES = ROOT / f"audio/takes_{MODE}"
OUT.mkdir(parents=True, exist_ok=True); TAKES.mkdir(parents=True, exist_ok=True)
SR = 44100
EDGE = (os.environ.get("EDGE_VOICE", "hi-IN-MadhurNeural"), os.environ.get("EDGE_RATE", "+22%"), os.environ.get("EDGE_PITCH", "+4Hz"))


async def edge(text):
    import edge_tts
    c = edge_tts.Communicate(text, EDGE[0], rate=EDGE[1], pitch=EDGE[2], boundary="WordBoundary")
    audio, marks = b"", []
    async for ch in c.stream():
        if ch["type"] == "audio": audio += ch["data"]
        elif ch["type"] == "WordBoundary": marks.append([ch["offset"] / 1e7, (ch["offset"] + ch["duration"]) / 1e7, ch["text"]])
    return audio, marks


def key():
    try:
        import winreg
        with winreg.OpenKey(winreg.HKEY_CURRENT_USER, "Environment") as h:
            return winreg.QueryValueEx(h, "ELEVENLABS_API_KEY")[0].strip()
    except OSError:
        return os.environ["ELEVENLABS_API_KEY"].strip()


def liam(text, seed=None):
    v = S["voice"]
    body = {"text": text, "model_id": v["model"], "seed": seed or v["seed"], "language_code": v["language"],
            "voice_settings": {"stability": v["stability"], "similarity_boost": v["similarity"], "speed": v["speed"]}}
    req = urllib.request.Request(f"https://api.elevenlabs.io/v1/text-to-speech/{v['voiceId']}/with-timestamps?output_format=mp3_44100_128",
                                 data=json.dumps(body).encode(), headers={"xi-api-key": key(), "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=300) as r:
        d = json.loads(r.read())
    al = d.get("alignment") or d["normalized_alignment"]
    # characters -> word spans
    marks, cur, t0 = [], "", None
    for ch, a, b in zip(al["characters"], al["character_start_times_seconds"], al["character_end_times_seconds"]):
        if ch.isspace():
            if cur: marks.append([t0, last, cur]); cur = ""
            continue
        if not cur: t0 = a
        cur += ch; last = b
    if cur: marks.append([t0, last, cur])
    return base64.b64decode(d["audio_base64"]), marks


def take(text, seed=None):
    tag = [text, MODE, EDGE if MODE == "scratch" else S["voice"]] + ([seed] if seed else [])
    h = hashlib.sha1(json.dumps(tag, ensure_ascii=False).encode()).hexdigest()[:12]
    mp3, js = TAKES / f"{h}.mp3", TAKES / f"{h}.json"
    if not mp3.exists():
        a, m = asyncio.run(edge(text)) if MODE == "scratch" else liam(text, seed)
        mp3.write_bytes(a); js.write_text(json.dumps(m, ensure_ascii=False), encoding="utf-8")
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(mp3), "-f", "wav", "-ac", "1", "-ar", str(SR), "-"], capture_output=True, check=True).stdout
    y, _ = sf.read(io.BytesIO(raw))
    return y, json.loads(js.read_text(encoding="utf-8"))


def trim(y):
    nz = np.where(np.abs(y) > 0.01)[0]
    a, b = max(0, nz[0] - int(0.03 * SR)), min(len(y), nz[-1] + int(0.08 * SR))
    y = y[a:b].copy(); f = int(0.015 * SR); y[-f:] *= np.linspace(1, 0, f)
    return y, a / SR


def words(cap, marks, off, dur):
    """caption words with times. Devanagari and Roman word counts differ, so the caption words are spread over each
    spoken word span by length (a caption word never runs ahead of its speech)."""
    cw = [w for w in cap.split() if w not in ("—", "-", "–")]
    spans = [[a - off, b - off] for a, b, _ in marks]
    if len(spans) != len(cw):
        t0, t1 = (spans[0][0], spans[-1][1]) if spans else (0, dur)
        wt = [len(w.strip(",.!?…:'")) + 2 for w in cw]; tot = sum(wt); acc = 0; spans = []
        for w in wt:
            spans.append([t0 + (t1 - t0) * acc / tot, t0 + (t1 - t0) * (acc + w) / tot]); acc += w
    return [{"w": w, "t0": round(max(0, a), 3), "t1": round(min(dur, b), 3)} for w, (a, b) in zip(cw, spans)]


def main():
    voice = f"SCRATCH {EDGE[0]} {EDGE[1]} {EDGE[2]} (edge-tts): replace with Liam" if MODE == "scratch" else f"Liam {S['voice']['model']} speed {S['voice']['speed']} seed {S['voice']['seed']}"
    meta = {"voice": voice, "lines": []}
    wm = None
    for l in S["reel"]:
        y, marks = take(l["tts"], l.get("seed")); y, off = trim(y)
        sf.write(OUT / f"{l['id']}.wav", y, SR, subtype="PCM_16")
        d = len(y) / SR
        meta["lines"].append({"id": l["id"], "dur": round(d, 3), "cap": l["cap"], "words": words(l["cap"], marks, off, d)})
        print(f"--- {l['id']} {d:5.2f} s  {l['tts']}")
        if "--no-stt" not in sys.argv:
            from scipy.signal import resample_poly
            from faster_whisper import WhisperModel
            wm = wm or WhisperModel("small", device="cpu", compute_type="int8")
            z = resample_poly(y, 16000, SR).astype(np.float32)
            print("    whisper:", " ".join(s.text.strip() for s in wm.transcribe(z, language="hi", beam_size=5)[0]))
    (OUT / "lines.json").write_text(json.dumps(meta, ensure_ascii=False, indent=1), encoding="utf-8")
    print("total speech", round(sum(x["dur"] for x in meta["lines"]), 2), "s")


if __name__ == "__main__":
    main()
