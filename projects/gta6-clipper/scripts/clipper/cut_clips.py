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
V = sorted(glob.glob(str(INB / "speed_live_*.f298.mp4*")))[0]
A = sorted(glob.glob(str(INB / "speed_live_*.f140.mp4*")))[0]
CL = json.loads((ROOT / "docs/clips.json").read_text(encoding="utf-8"))["clips"]
only = sys.argv[1:]
MASK = re.compile(r"\b(f+u+c*k+\w*|shit\w*|bitch\w*|ass(hole)?|damn|n[i1]gg\w*|motherf\w*)\b", re.I)
def mask(w): return MASK.sub(lambda m: m.group(0)[0] + "*" * (len(m.group(0)) - 1), w)
out = ROOT / "public/clips"; out.mkdir(parents=True, exist_ok=True)
wm = WhisperModel("small.en", device="cpu", compute_type="int8")
for c in CL:
    if only and c["id"] not in only: continue
    s, e = c["start"], c["end"]; dst = out / f"{c['id']}.mp4"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", str(s), "-to", str(e), "-i", V, "-ss", str(s), "-to", str(e), "-i", A, "-map", "0:v", "-map", "1:a",
                    "-c:v", "libx264", "-preset", "medium", "-crf", "17", "-g", "30", "-bf", "0", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-ar", "48000", str(dst)], check=True)
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(dst), "-ac", "1", "-ar", "16000", "-f", "f32le", "-"], capture_output=True, check=True).stdout
    segs, _ = wm.transcribe(np.frombuffer(raw, np.float32), language="en", vad_filter=True, beam_size=5, word_timestamps=True)
    words = [{"w": mask(w.word.strip()), "t0": round(w.start, 3), "t1": round(w.end, 3)} for sg in segs for w in sg.words if w.word.strip()]
    (out / f"{c['id']}.words.json").write_text(json.dumps(words, ensure_ascii=False), encoding="utf-8")
    dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(dst)], capture_output=True, text=True).stdout)
    print(f"{c['id']}: {dur:.2f} s, {len(words)} words | {' '.join(w['w'] for w in words)[:160]}")
