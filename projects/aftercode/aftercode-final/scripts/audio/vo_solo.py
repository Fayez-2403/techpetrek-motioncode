"""Re-voice single lines on their own (same voice + settings), when a line inside the joint take came out wrong (a word
mis-said, babble at the end of the take). Trims to the speech, writes audio/out/<version>/reel/<id>.wav, updates the line
timings in lines_reel.json, and checks the line with Scribe + faster-whisper.
    python scripts/audio/vo_solo.py --version v2 l3 l7 l9 [--seed 5]
"""
import json, pathlib, sys

import numpy as np
import soundfile as sf

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import vo  # noqa: E402
from version import OUT as VOUT  # noqa: E402

ids = [a for a in sys.argv[1:] if not a.startswith("--") and sys.argv[sys.argv.index(a) - 1] not in ("--version", "--seed")]
seed = int(vo.arg("--seed", "5"))
v = vo.SCRIPT["voice"]; lines = {l["id"]: l for l in vo.SCRIPT["reel"]}
meta_p = VOUT / "lines_reel.json"; meta = json.loads(meta_p.read_text(encoding="utf-8"))
from scipy.signal import resample_poly  # noqa: E402
from faster_whisper import WhisperModel  # noqa: E402
wm = WhisperModel("small", device="cpu", compute_type="int8")
for i in ids:
    l = lines[i]
    mp3, _ = vo.synth(l["tts"], v, seed)
    (vo.ROOT / "audio/takes" / f"solo_{i}_s{seed}.mp3").write_bytes(mp3)
    y = vo.decode(mp3); nz = np.where(np.abs(y) > 0.01)[0]
    y = y[max(0, nz[0] - int(0.04 * vo.SR)):nz[-1] + int(0.12 * vo.SR)].copy(); f = int(0.02 * vo.SR); y[-f:] *= np.linspace(1, 0, f)
    out = VOUT / "reel" / f"{i}.wav"; sf.write(out, y, vo.SR, subtype="PCM_16")
    t0, t1 = 0.04, len(y) / vo.SR - 0.12; ws = l["cap"].split()
    for m in meta["lines"]:
        if m["id"] == i:
            m["dur"] = round(len(y) / vo.SR, 3)
            m["phrases"] = [{"cap": l["cap"], "t0": round(t0, 3), "t1": round(t1, 3), "words": [{"w": w, "t0": round(t0 + (t1 - t0) * k / len(ws), 3), "t1": round(t0 + (t1 - t0) * (k + 1) / len(ws), 3)} for k, w in enumerate(ws)]}]
            m["solo"] = f"synthesized alone, seed {seed}"
    z = resample_poly(y, 16000, vo.SR).astype(np.float32)
    wh = [" ".join(s.text.strip() for s in wm.transcribe(z, language=lg, beam_size=5)[0]) for lg in ("hi", "en")]
    print(f"--- {i} {len(y) / vo.SR:.2f} s\n  script : {l['tts']}\n  scribe : {vo.stt(out.read_bytes())}\n  whisper: {wh[0]} | {wh[1]}")
meta_p.write_text(json.dumps(meta, ensure_ascii=False, indent=1), encoding="utf-8")
