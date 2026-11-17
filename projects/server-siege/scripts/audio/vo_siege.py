"""SERVER SIEGE narration: Bro (Liam) reads each line on its own, placed at its window start + lead. A line must end
0.25 s before its window does. Every take is checked with Scribe + faster-whisper. Takes are cached in audio/takes/ by
text + voice + settings + seed. Writes audio/out/<id>.wav and audio/out/lines.json (start, length, word timings).
    python scripts/audio/vo_siege.py [v03 v07 ...] [--seed 5] [--no-stt]
"""
import hashlib, json, pathlib, sys

import numpy as np
import soundfile as sf

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import vo  # noqa: E402

ROOT = vo.ROOT
S = json.loads((ROOT / "src/config/voScript.json").read_text(encoding="utf-8"))
OUT = ROOT / "audio/out"; TAKES = ROOT / "audio/takes"
OUT.mkdir(parents=True, exist_ok=True); TAKES.mkdir(parents=True, exist_ok=True)
_wm = None


def whisper(y):
    global _wm
    from scipy.signal import resample_poly
    from faster_whisper import WhisperModel
    _wm = _wm or WhisperModel("small", device="cpu", compute_type="int8")
    z = resample_poly(y, 16000, vo.SR).astype(np.float32)
    return [" ".join(s.text.strip() for s in _wm.transcribe(z, language=lg, beam_size=5)[0]) for lg in ("hi", "en")]


def take(text, v, seed):
    h = hashlib.sha1(json.dumps([text, v, seed], sort_keys=True).encode()).hexdigest()[:12]
    mp3, js = TAKES / f"{h}.mp3", TAKES / f"{h}.json"
    if not mp3.exists():
        a, al = vo.synth(text, v, seed); mp3.write_bytes(a); js.write_text(json.dumps(al), encoding="utf-8")
    return vo.decode(mp3.read_bytes()), json.loads(js.read_text(encoding="utf-8"))


def trim(y):
    nz = np.where(np.abs(y) > 0.01)[0]
    a, b = max(0, nz[0] - int(0.04 * vo.SR)), min(len(y), nz[-1] + int(0.1 * vo.SR))
    y = y[a:b].copy(); f = int(0.015 * vo.SR); y[-f:] *= np.linspace(1, 0, f)
    return y, a / vo.SR


def words(cap, al, t_off):
    """caption words timed by the voice's character alignment (1:1 by order when the word counts match, else spread)"""
    spans, cur = [], None
    for c, a, b in zip(al["characters"], al["character_start_times_seconds"], al["character_end_times_seconds"]):
        if c.isspace():
            if cur: spans.append(cur); cur = None
        else:
            cur = [cur[0], b] if cur else [a, b]
    if cur: spans.append(cur)
    spans = [s for s in spans if s[1] - s[0] > 0.0]
    cw = [w for w in cap.split() if w not in ("—", "-")]
    if len(spans) != len(cw):
        t0, t1 = spans[0][0], spans[-1][1]
        spans = [[t0 + (t1 - t0) * k / len(cw), t0 + (t1 - t0) * (k + 1) / len(cw)] for k in range(len(cw))]
    return [{"w": w, "t0": round(a - t_off, 3), "t1": round(b - t_off, 3)} for w, (a, b) in zip(cw, spans)]


def main():
    want = [a for i, a in enumerate(sys.argv[1:], 1) if not a.startswith("--") and sys.argv[i - 1] != "--seed"]
    seed = int(vo.arg("--seed", "5"))
    meta_p = OUT / "lines.json"
    meta = json.loads(meta_p.read_text(encoding="utf-8")) if meta_p.exists() else {"lines": []}
    by = {m["id"]: m for m in meta["lines"]}
    for l in S["reel"]:
        if want and l["id"] not in want: continue
        v = {**S["voice"], **{k: l[k] for k in ("speed", "style", "stability") if k in l}}
        y, al = take(l["tts"], v, l.get("seed", seed)); y, off = trim(y)
        sf.write(OUT / f"{l['id']}.wav", y, vo.SR, subtype="PCM_16")
        d, start = len(y) / vo.SR, l["t0"] + l.get("lead", S["lead"])
        room = l["t1"] - 0.25 - start
        by[l["id"]] = {"id": l["id"], "start": round(start, 3), "dur": round(d, 3), "fits": d <= room, "pose": l["pose"], "cap": l["cap"], "words": words(l["cap"], al, off)}
        flag = "" if d <= room else f"   <-- TOO LONG ({d:.2f} s > {room:.2f} s)"
        print(f"--- {l['id']} {d:.2f} s / {room:.2f} s{flag}\n  script : {l['tts']}")
        if "--no-stt" not in sys.argv:
            print(f"  scribe : {vo.stt((OUT / f'{l['id']}.wav').read_bytes())}\n  whisper: {' | '.join(whisper(y))}")
    meta["lines"] = [by[l["id"]] for l in S["reel"] if l["id"] in by]
    meta_p.write_text(json.dumps(meta, ensure_ascii=False, indent=1), encoding="utf-8")


if __name__ == "__main__":
    main()
