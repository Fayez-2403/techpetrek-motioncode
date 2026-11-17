"""The four bots each wish "Happy Diwali!" in their own voice (ElevenLabs eleven_v3, premade voices), plus a chorus
take per bot for the finale. One take per line, cached by text + voice + seed; every take checked with Scribe.
Writes audio/out/<id>.wav and audio/out/lines.json (duration + trimmed lead).
    python scripts/audio/vo_bots.py [--no-stt]
"""
import hashlib, json, pathlib, sys

import numpy as np
import soundfile as sf

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import vo  # noqa: E402

OUT = vo.ROOT / "audio/out"; TAKES = vo.ROOT / "audio/takes"; OUT.mkdir(parents=True, exist_ok=True); TAKES.mkdir(parents=True, exist_ok=True)
V = lambda vid, st=0.45, sp=1.0: {"voiceId": vid, "model": "eleven_v3", "language": "en", "stability": st, "similarity": 0.8, "speed": sp}
LINES = {
    "claude": ("[excited] Happy Diwali!", V("TX3LPaxmHKxFdv7VOQHJ"), 5),      # Liam
    "muse":   ("[cheerful] Happy Diwali!", V("EXAVITQu4vr4xnSDxMaL"), 5),     # Sarah
    "grok":   ("[cool, confident] Happy Diwali!", V("cjVigY5qzO86Huf0OWal"), 5),  # Eric
    "dots":   ("[giggles] Happy Diwali!", V("FGY2WhTYpPnrIDTdsKH5"), 5),      # Laura
    # the finale chorus: each voice shouts it once more, layered in the mix
    "claude_c": ("[shouting joyfully] Happy Diwali!!", V("TX3LPaxmHKxFdv7VOQHJ"), 7),
    "muse_c":   ("[shouting joyfully] Happy Diwali!!", V("EXAVITQu4vr4xnSDxMaL"), 7),
    "grok_c":   ("[shouting joyfully] Happy Diwali!!", V("cjVigY5qzO86Huf0OWal"), 7),
    "dots_c":   ("[shouting joyfully] Happy Diwali!!", V("FGY2WhTYpPnrIDTdsKH5"), 7),
}


def take(text, v, seed):
    h = hashlib.sha1(json.dumps([text, v, seed], sort_keys=True).encode()).hexdigest()[:12]
    mp3 = TAKES / f"{h}.mp3"
    if not mp3.exists(): a, _ = vo.synth(text, v, seed); mp3.write_bytes(a)
    return vo.decode(mp3.read_bytes())


meta = {}
for k, (text, v, seed) in LINES.items():
    y = take(text, v, seed)
    nz = np.where(np.abs(y) > 0.012)[0]; a, b = max(0, nz[0] - int(0.02 * vo.SR)), min(len(y), nz[-1] + int(0.12 * vo.SR))
    y = y[a:b]; f = int(0.02 * vo.SR); y[-f:] *= np.linspace(1, 0, f)
    sf.write(OUT / f"{k}.wav", y, vo.SR, subtype="PCM_16")
    meta[k] = {"dur": round(len(y) / vo.SR, 3)}
    heard = "" if "--no-stt" in sys.argv else vo.stt((OUT / f"{k}.wav").read_bytes())
    print(f"{k:9s} {meta[k]['dur']:.2f} s  heard: {heard}")
(OUT / "lines.json").write_text(json.dumps(meta, indent=1), encoding="utf-8")
