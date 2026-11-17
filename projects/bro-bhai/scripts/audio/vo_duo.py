"""Two-host narration (Bro & Bhai): every line is synthesized on its own in its speaker's voice (src/config/voScript.json
"voices"), trimmed to the speech, checked to fit its fixed slot, and checked with Scribe + faster-whisper. Writes
audio/out/<id>.wav and audio/out/lines_duo.json (speaker, slot start, length, word timings from the voice's own alignment).
Takes are cached in audio/takes/ by text + voice + settings + seed: re-running costs nothing unless the script changes.
    python scripts/audio/vo_duo.py [s03 s07 ...] [--seed 5] [--no-stt]
    python scripts/audio/vo_duo.py --audition s04 --voices <id>,<id>,...     (one line in several voices, for picking a voice)
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
SLOT, FIT = S["slot"], S["slot"] - 0.2          # a line must end 0.2 s before its slot does
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


def trim(y, al):
    nz = np.where(np.abs(y) > 0.01)[0]
    a, b = max(0, nz[0] - int(0.04 * vo.SR)), min(len(y), nz[-1] + int(0.1 * vo.SR))
    y = y[a:b].copy(); f = int(0.015 * vo.SR); y[-f:] *= np.linspace(1, 0, f)
    return y, a / vo.SR


FX = {   # per-line voice treatments (ffmpeg -af), named in voScript.json "fx"
    # "thud": the intro's loud, punchy read: chest (low shelf), presence, a fast compressor, then a limiter
    "thud": "equalizer=f=120:t=q:w=1.1:g=5,equalizer=f=3200:t=q:w=1.4:g=3,acompressor=threshold=-20dB:ratio=5:attack=4:release=60:makeup=4,alimiter=limit=0.95",
}


def post(y, l):
    """optional per-line tempo ("tempo": 1.1 = 10 % faster, pitch kept) and voice fx; returns (audio, time scale)"""
    tempo, fx = l.get("tempo", 1.0), FX.get(l.get("fx", ""), "")
    if tempo == 1.0 and not fx: return y, 1.0
    import subprocess, tempfile, os
    af = ",".join(x for x in (f"atempo={tempo}" if tempo != 1.0 else "", fx) if x)
    d = tempfile.mkdtemp(); a, b = os.path.join(d, "a.wav"), os.path.join(d, "b.wav")
    sf.write(a, y, vo.SR, subtype="FLOAT")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", a, "-af", af, "-ar", str(vo.SR), "-ac", "1", b], check=True)
    z, _ = sf.read(b, dtype="float64")
    return z, 1.0 / tempo


def words(text_cap, al, t_off):
    """caption words with times from the voice's character alignment (spoken words map 1:1 by order when counts match)"""
    chars, t0s, t1s = al["characters"], al["character_start_times_seconds"], al["character_end_times_seconds"]
    spans, cur = [], None
    for c, a, b in zip(chars, t0s, t1s):
        if c.isspace():
            if cur: spans.append(cur); cur = None
        else:
            cur = [cur[0], b] if cur else [a, b]
    if cur: spans.append(cur)
    cw = text_cap.split()
    if len(spans) != len(cw):   # different word counts (e.g. "49" vs "forty-nine"): spread evenly over the speech
        t0, t1 = spans[0][0], spans[-1][1]
        spans = [[t0 + (t1 - t0) * k / len(cw), t0 + (t1 - t0) * (k + 1) / len(cw)] for k in range(len(cw))]
    return [{"w": w, "t0": round(a - t_off, 3), "t1": round(b - t_off, 3)} for w, (a, b) in zip(cw, spans)]


def audition(line_id, ids):
    l = next(x for x in S["reel"] if x["id"] == line_id)
    for vid in ids:
        v = {**S["voices"]["bhai"], "voiceId": vid, "name": vid}
        y, al = take(l["tts"], v, int(vo.arg("--seed", "5"))); y, _ = trim(y, al)
        p = OUT / f"audition_{line_id}_{vid}.wav"; sf.write(p, y, vo.SR, subtype="PCM_16")
        print(f"--- {vid} {len(y) / vo.SR:.2f} s -> {p.name}\n  scribe : {vo.stt(p.read_bytes())}\n  whisper: {' | '.join(whisper(y))}")


def main():
    if "--audition" in sys.argv:
        audition(vo.arg("--audition", "s04"), vo.arg("--voices", "").split(",")); return
    want = [a for i, a in enumerate(sys.argv[1:], 1) if not a.startswith("--") and sys.argv[i - 1] != "--seed"]
    seed = int(vo.arg("--seed", "5"))
    meta_p = OUT / "lines_duo.json"
    meta = json.loads(meta_p.read_text(encoding="utf-8")) if meta_p.exists() else {"lines": []}
    by = {m["id"]: m for m in meta["lines"]}
    for k, l in enumerate(S["reel"]):
        if want and l["id"] not in want: continue
        v = {**S["voices"][l["who"]], **{k: l[k] for k in ("speed", "style", "stability") if k in l}}
        if v["voiceId"] == "PICK": sys.exit(f"pick a voice for {l['who']} first (--audition)")
        y, al = take(l["tts"], v, l.get("seed", seed)); y, off = trim(y, al)
        y, k_t = post(y, l)
        sf.write(OUT / f"{l['id']}.wav", y, vo.SR, subtype="PCM_16")
        d = len(y) / vo.SR
        by[l["id"]] = {"id": l["id"], "who": l["who"], "slot": round(k * SLOT, 3), "dur": round(d, 3), "fits": d <= FIT,
                       "words": [{**w, "t0": round(w["t0"] * k_t, 3), "t1": round(w["t1"] * k_t, 3)} for w in words(l["cap"], al, off)]}
        flag = "" if d <= FIT else f"   <-- TOO LONG for the {SLOT:.0f} s slot"
        print(f"--- {l['id']} {l['who']:<4} {d:.2f} s{flag}\n  script : {l['tts']}")
        if "--no-stt" not in sys.argv:
            print(f"  scribe : {vo.stt((OUT / f'{l['id']}.wav').read_bytes())}\n  whisper: {' | '.join(whisper(y))}")
    meta["lines"] = [by[l["id"]] for l in S["reel"] if l["id"] in by]
    meta_p.write_text(json.dumps(meta, ensure_ascii=False, indent=1), encoding="utf-8")


if __name__ == "__main__":
    main()
