"""The reel's sound, from the same beat plan the picture was captured on (src/config/plan.json, measured by the app):
  music  every segment = its CC BY song (Kevin MacLeod, bundled in the app) from that segment's measured downbeat ss to se,
         butted on the downbeat with an 8 ms crossfade, each segment levelled to the same loudness;
  voice  the MC lines (audio/out/reel/*.wav, src/config/voScript.json 'at' = [segment, beat]) with the music ducked under them;
  hits   a VS slam on frame 0 and on every round, a whoosh into each song switch, a pop on each look change (morph),
         a soft tap on each builder click.
Mastered to -14 LUFS / -1.5 dBTP.   python scripts/audio/mix.py
Writes public/audio/final_mix.wav, audio/final_raw.wav, audio/cues.json (every hit + line, in reel seconds, for the edit + QA).
"""
import json, pathlib, subprocess, sys

import numpy as np
import pyloudnorm as pyln
import soundfile as sf

ROOT = pathlib.Path(__file__).resolve().parents[2]
WEB = ROOT.parent / "web"
SR = 48000
plan = json.loads((ROOT / "src/config/plan.json").read_text(encoding="utf-8"))["segments"]
V = sys.argv[sys.argv.index("--version") + 1] if "--version" in sys.argv else "v1"   # v1 = the battle MC, v2 = the app ad
SUF = "" if V == "v1" else f"_{V}"
vos = json.loads((ROOT / "src/config" / ("voScript.json" if V == "v1" else f"voScript.{V}.json")).read_text(encoding="utf-8"))["reel"]
LINES = ROOT / "audio/out" / ("reel" if V == "v1" else f"{V}/reel")
FILES = {"realizer": "Realizer", "smooth-move": "Smooth Move", "disco-medusae": "Disco Medusae", "electro-cabello": "Electro Cabello", "monkeys": "Monkeys Spinning Monkeys"}
END = plan[-1]["r1"]; N = int(round(END * SR))
meter = pyln.Meter(SR)
rng = np.random.default_rng(11)


def song(track):
    raw = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", str(WEB / "public/music" / f"{FILES[track]}.mp3"), "-f", "f32le", "-ac", "2", "-ar", str(SR), "pipe:1"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, 2).astype(np.float64)


def seg(i):
    return next(s for s in plan if s["id"] == i)


def RB(sid, k):
    """reel time of beat k of a segment (its measured beats, extrapolated at its bpm past the end)"""
    s = seg(sid); B = s["beats"]; i = int(np.floor(k)); f = k - i
    if i < len(B) - 1: return B[i] + (B[i + 1] - B[i]) * f
    return B[-1] + (k - (len(B) - 1)) * 60 / s["bpm"]


def lufs(x):
    try: return meter.integrated_loudness(x)
    except ValueError: return -70.0


# ---- music: segments end to end, cut on the downbeat, each levelled to -20 LUFS. A segment whose song transients sit
# more than 30 ms off the app's grid (scripts/audio/sync_check.py -> src/config/sync.json) is slid by that much, so its
# hits land on the cut and on the dancers' beat (the picture is captured on the app's grid).
SYNC = json.loads((ROOT / "src/config/sync.json").read_text(encoding="utf-8")) if (ROOT / "src/config/sync.json").exists() else {}
music = np.zeros((N, 2)); cache = {}; X = int(0.008 * SR)
for s in plan:
    y = cache.setdefault(s["track"], song(s["track"]))
    sh = SYNC.get(s["id"], 0.0); sh = sh if abs(sh) > 0.03 else 0.0
    a, b = int(round((s["ss"] + sh) * SR)), int(round((s["se"] + sh) * SR)); piece = y[a:b + X].copy()
    piece *= 10 ** ((-20 - lufs(piece)) / 20)
    r0 = int(round(s["r0"] * SR)); piece[:X] *= np.linspace(0, 1, X)[:, None]
    if s is not plan[-1]: piece[-X:] *= np.linspace(1, 0, X)[:, None]
    m = min(len(piece), N - r0); music[r0:r0 + m] += piece[:m]
fade = int(0.45 * SR); music[-fade:] *= np.linspace(1, 0, fade)[:, None] ** 1.5   # the last chord rings out under the card

# ---- voice: each line at its plan beat, levelled to -15 LUFS
voice = np.zeros(N); cues = []; spans = []
for l in vos:
    y, sr = sf.read(LINES / f"{l['id']}.wav", dtype="float64"); assert sr in (44100, 48000)
    if sr != SR:
        from scipy.signal import resample_poly
        y = resample_poly(y, SR, sr)
    y *= 10 ** ((-15 - lufs(np.stack([y, y], 1))) / 20)
    t = RB(*l["at"]); k = int(round(t * SR)); m = min(len(y), N - k); voice[k:k + m] += y[:m]
    spans.append((t, t + len(y) / SR)); cues.append({"t": round(t, 3), "type": "vo", "id": l["id"], "dur": round(len(y) / SR, 3)})

# ducking: -6 dB under the voice, 60 ms in, 250 ms out (control rate 1 kHz)
C = 1000; act = np.zeros(int(END * C) + 1)
for t0, t1 in spans: act[int(t0 * C):int(t1 * C)] = 1
env = np.zeros_like(act); g = 0.0
for i, v in enumerate(act):
    k = 1 - np.exp(-1 / (0.06 * C)) if v > g else 1 - np.exp(-1 / (0.25 * C)); g += (v - g) * k; env[i] = g
duck = 1 - (1 - 10 ** (-6 / 20)) * np.interp(np.arange(N) / SR, np.arange(len(env)) / C, env)
music *= duck[:, None]

# ---- hits
fx = np.zeros(N)
def put(t, x, gain=1.0):
    k = int(round(t * SR)); m = min(len(x), N - k)
    if m > 0 and k >= 0: fx[k:k + m] += x[:m] * gain
def slam():
    n = int(0.5 * SR); t = np.arange(n) / SR
    thump = np.sin(2 * np.pi * (48 + 60 * np.exp(-t / 0.05)) * t) * np.exp(-t / 0.18)
    crack = rng.standard_normal(n) * np.exp(-t / 0.025); crack = np.diff(crack, prepend=0)
    return 0.9 * thump + 0.25 * crack
def whoosh(d=0.42):
    n = int(d * SR); t = np.arange(n) / SR; u = t / d
    w = rng.standard_normal(n); w = np.convolve(w, np.ones(6) / 6, "same")   # soft noise, brightening as it rises
    w = w * (0.3 + 0.7 * u) + np.diff(w, prepend=0) * u * 2
    return w * (u ** 2.2) * 0.35
def pop():
    n = int(0.09 * SR); t = np.arange(n) / SR
    return np.sin(2 * np.pi * np.cumsum(300 + 700 * np.exp(-t / 0.02)) / SR) * np.exp(-t / 0.03) * 0.55
def tap():
    n = int(0.03 * SR); t = np.arange(n) / SR
    return (rng.standard_normal(n) * np.exp(-t / 0.004) * 0.5 + np.sin(2 * np.pi * 2400 * t) * np.exp(-t / 0.007) * 0.4) * 0.35

put(0.0, slam(), 1.0); cues.append({"t": 0.0, "type": "slam"})
for sid, k in [("A", 20), ("B", 0), ("C", 0), ("D", 0), ("E", 0), ("F", 0)]:   # a whoosh into, a slam on, every round
    t = RB(sid, k); w = whoosh(); put(t - len(w) / SR, w); put(t, slam(), 0.8); cues.append({"t": round(t, 3), "type": "round", "seg": sid, "beat": k})
for k in range(4, 8): t = RB("A", k); put(t, pop(), 0.9); cues.append({"t": round(t, 3), "type": "pop"})
for k in range(8, 15): t = RB("A", k); put(t, tap(), 1.0); cues.append({"t": round(t, 3), "type": "tap"})
fx *= 10 ** ((-24 - lufs(np.stack([fx, fx], 1))) / 20)

mix = music + np.stack([voice + fx, voice + fx], 1)
raw = ROOT / "audio" / f"final_raw{SUF}.wav"; raw.parent.mkdir(exist_ok=True)
sf.write(raw, mix.astype(np.float32), SR)
(ROOT / "audio" / f"cues{SUF}.json").write_text(json.dumps({"_doc": "reel seconds; written by scripts/audio/mix.py", "end": END, "cues": cues}, indent=1), encoding="utf-8")
out = ROOT / "public" / "audio" / f"final_mix{SUF}.wav"; out.parent.mkdir(parents=True, exist_ok=True)
master = ROOT.parents[2] / ".claude/skills/motion-studio/scripts/master.py"
subprocess.run([sys.executable, str(master), str(raw), str(out), "--lufs", "-14", "--tp", "-1.5"], check=True)
print(f"{END:.2f} s, {len(vos)} lines, {sum(c['type'] == 'round' for c in cues)} rounds -> {out}")
