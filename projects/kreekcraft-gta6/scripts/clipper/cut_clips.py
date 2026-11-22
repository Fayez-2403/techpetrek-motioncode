"""Cut every clip in docs/clips.json out of the live recording (video + audio tracks recorded separately by yt-dlp),
1.0x, re-encoded for frame-exact seeking (public/clips/<id>.mp4), and word-time its speech with faster-whisper
small.en (public/clips/<id>.words.json, times relative to the clip). Swear words are masked in the captions only.
    python scripts/clipper/cut_clips.py [id ...]
"""
import glob, json, pathlib, re, subprocess, sys

import numpy as np
from faster_whisper import WhisperModel

ROOT = pathlib.Path(__file__).resolve().parents[2]
INB = ROOT / "assets/inbox"
FR = 2.0   # each live DASH fragment is 2 s; fragment N covers [2(N-1), 2N] in stream time
def window(kind, s, e):
    """stitch only the fragments covering [s-2, e+2] of one track (f298 video / f140 audio) into a small file"""
    a, b = max(1, int((s - 2) // FR) + 1), int((e + 2) // FR) + 1
    base = sorted(glob.glob(str(INB / f"kreekN_*.{kind}.mp4.part")))[0]
    dst = INB / f"_win_{kind}_{a}_{b}.mp4"
    with open(dst, "wb") as o:
        for n in range(a, b + 1):
            fp = pathlib.Path(f"{base}-Frag{n}")
            if not fp.exists(): raise SystemExit(f"fragment {n} ({kind}) not downloaded yet")
            o.write(fp.read_bytes())
    st = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=start_time", "-of", "csv=p=0", str(dst)], capture_output=True, text=True).stdout or 0)
    return dst, st
CL = json.loads((ROOT / "docs/clips.json").read_text(encoding="utf-8"))["clips"]
only = sys.argv[1:]
MASK = re.compile(r"\b(f+u+c*k+\w*|shit\w*|bitch\w*|ass(hole)?|damn|n[i1]gg\w*|motherf\w*)\b", re.I)
def mask(w): return MASK.sub(lambda m: m.group(0)[0] + "*" * (len(m.group(0)) - 1), w)
out = ROOT / "public/clips"; out.mkdir(parents=True, exist_ok=True)
wm = WhisperModel("small.en", device="cpu", compute_type="int8")
for c in CL:
    if only and c["id"] not in only: continue
    segs = c.get("segments") or [[c["start"], c["end"]]]; dst = out / f"{c['id']}.mp4"; parts = []; bounds = []; acc = 0.0
    for k, (s, e) in enumerate(segs):
        pp = out / f"_{c['id']}_{k}.mp4"; parts.append(pp); bounds.append(round(acc, 3)); acc += e - s
        vw, vs = window("f298", s, e); aw, as_ = window("f140", s, e)
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{s - vs:.3f}", "-t", f"{e - s:.3f}", "-i", str(vw), "-ss", f"{s - as_:.3f}", "-t", f"{e - s:.3f}", "-i", str(aw), "-map", "0:v", "-map", "1:a",
                        "-r", "30", "-c:v", "libx264", "-preset", "medium", "-crf", "17", "-g", "30", "-bf", "0", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-ar", "48000", str(pp)], check=True)
    lst = out / f"_{c['id']}.txt"; lst.write_text("".join(f"file '{pp.name}'\n" for pp in parts), encoding="utf-8")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(lst), "-c", "copy", str(dst)], check=True)
    for pp in parts: pp.unlink()
    for w_ in INB.glob("_win_*.mp4"): w_.unlink()
    lst.unlink()
    (out / f"{c['id']}.cuts.json").write_text(json.dumps({"bounds": bounds, "marks": [{"t": bounds[m["seg"]], "text": m["text"]} for m in c.get("marks", [])]}), encoding="utf-8")
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(dst), "-ac", "1", "-ar", "16000", "-f", "f32le", "-"], capture_output=True, check=True).stdout
    segs, _ = wm.transcribe(np.frombuffer(raw, np.float32), language="en", vad_filter=True, beam_size=5, word_timestamps=True)
    words = [{"w": mask(w.word.strip()), "t0": round(w.start, 3), "t1": round(w.end, 3)} for sg in segs for w in sg.words if w.word.strip()]
    (out / f"{c['id']}.words.json").write_text(json.dumps(words, ensure_ascii=False), encoding="utf-8")
    dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(dst)], capture_output=True, text=True).stdout)
    print(f"{c['id']}: {dur:.2f} s, {len(words)} words | {' '.join(w['w'] for w in words)[:160]}")
