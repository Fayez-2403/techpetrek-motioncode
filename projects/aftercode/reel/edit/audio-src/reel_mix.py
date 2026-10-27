"""AFTERCODE reel mix: six Kevin MacLeod tracks (CC BY 4.0), switching song at every mode change exactly as the app was
captured (web/src/reel/reel.ts SONGS: reel r0..r1 plays the song from ss), each chunk level-matched to the Realizer chunk,
Liam's lines placed at their reel times (voScript 'at'), music ducked ~8 dB under the voice, four hand-placed hits
(monitor dive, outfit swap, the 0:38 drop, the final downbeat), then two-pass loudnorm to -14 LUFS / -1.5 dBTP.
    python audio-src/reel_mix.py
"""
import json, pathlib, subprocess
import numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt

HERE = pathlib.Path(__file__).resolve().parent; ROOT = HERE.parent
SR, DUR, O = 48000, 70.0, 22.96
MUS_DIR = ROOT.parent.parent / "web" / "public" / "music"
SONGS = [   # keep in step with web/src/reel/reel.ts
    (0.0, 3.44, "Local Forecast - Elevator", 0.0), (3.44, 14.96, "Realizer", 3.44 + O), (14.96, 24.56, "Electro Cabello", 82.57),
    (24.56, 28.4, "Monkeys Spinning Monkeys", 86.68), (28.4, 34.16, "Smooth Move", 33.0), (34.16, 62.96, "Realizer", 34.16 + O),
    (62.96, 70.0, "Funk Game Loop", 36.58)]
n = int(DUR * SR)

def load(p, sr=SR, ss=0.0, t=None):
    raw = subprocess.run(["ffmpeg", "-loglevel", "error", "-ss", str(ss)] + (["-t", str(t)] if t else []) + ["-i", str(p), "-f", "f32le", "-ac", "2", "-ar", str(sr), "pipe:1"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, 2).copy()
mus = np.zeros((n, 2), np.float32); chunks = []
for r0, r1, name, ss in SONGS:
    k0, k1 = int(round(r0 * SR)), int(round(r1 * SR)); m = k1 - k0
    c = load(MUS_DIR / f"{name}.mp3", ss=ss, t=(r1 - r0) + 0.2)[:m]; c = np.pad(c, ((0, m - len(c)), (0, 0)))
    fi, fo = int(0.006 * SR), int(0.02 * SR); c[:fi] *= np.linspace(0, 1, fi)[:, None]; c[-fo:] *= np.linspace(1, 0, fo)[:, None]
    chunks.append((k0, k1, name, c))
ref = np.sqrt(np.mean(chunks[5][3] ** 2))   # the main Realizer body (team, drop, montage)
for k0, k1, name, c in chunks:
    g = float(np.clip(ref / max(np.sqrt(np.mean(c ** 2)), 1e-6), 0.4, 2.0)); mus[k0:k1] += c * g
    print(f"music {k0 / SR:6.2f}-{k1 / SR:6.2f}  {name:28s} gain {g:.2f}")
fade = int(1.1 * SR); mus[-fade:] *= np.linspace(1, 0, fade)[:, None] ** 1.5

# voice
script = json.loads((ROOT / "src" / "data" / "voScript.json").read_text(encoding="utf-8"))
vo = np.zeros(n, np.float32)
for l in script["reel"]:
    y, sr = sf.read(HERE / "out" / "reel" / f"{l['id']}.wav", dtype="float32")
    if sr != SR: y = np.interp(np.arange(int(len(y) * SR / sr)) / SR, np.arange(len(y)) / sr, y).astype(np.float32)
    k = int(l["at"] * SR); vo[k:k + len(y)] += y[: n - k]
    print(f"{l['id']} {l['at']:6.2f} - {l['at'] + len(y) / SR:6.2f}  {l['cap']}")

# ducking envelope
env = np.abs(vo); a = np.exp(-1 / (0.01 * SR)); r = np.exp(-1 / (0.3 * SR)); e = np.zeros(n, np.float32); s = 0.0
for i in range(0, n, 48):
    v = env[i:i + 48].max(); s = v if v > s else s * r ** 48 + v * (1 - r ** 48); e[i:i + 48] = s
duck = 1 - 0.6 * np.clip(e / 0.05, 0, 1)

def T(m): return np.arange(m) / SR
rng = np.random.default_rng(7)
def bp(x, lo, hi): return sosfilt(butter(2, [lo, hi], "band", fs=SR, output="sos"), x)
def whoosh(L):
    m = int(L * SR); u = T(m) / L; x = rng.standard_normal(m)
    lo = sosfilt(butter(2, 900, "low", fs=SR, output="sos"), x); hi = bp(x, 1500, 9000)
    return (lo * (1 - u) + hi * u) * np.sin(np.pi * u) ** 2 * 0.5
def impact():
    m = int(1.8 * SR); t = T(m); f = 36 + 70 * np.exp(-t * 9)
    return np.tanh(1.5 * np.sin(2 * np.pi * np.cumsum(f) / SR)) * np.exp(-t / 0.7) * 0.9 + bp(rng.standard_normal(m), 3000, 12000) * np.exp(-t / 0.5) * 0.25
def lift():
    m = int(0.6 * SR); t = T(m); return np.sin(2 * np.pi * (600 + 900 * t) * t) * np.exp(-t / 0.18) * 0.18 + bp(rng.standard_normal(m), 4000, 11000) * np.exp(-t / 0.12) * 0.2
fx = np.zeros(n, np.float32)
def put(t, x, g):
    k = int(t * SR); m = min(len(x), n - k); fx[k:k + m] += (x[:m] * g).astype(np.float32)
put(3.44, impact(), 0.6)          # DANCE: elevator music -> Realizer
put(4.25, whoosh(1.15), 0.8)      # the dive into the monitor
put(17.01, lift(), 0.7)           # streetwear -> chrome
for t in (14.96, 24.56, 28.4, 62.96): put(t, impact(), 0.4); put(t - 0.3, lift(), 0.35)   # song switches
put(38.0, impact(), 0.95)         # the drop: the whole crew
put(68.72, impact(), 0.8)         # the final downbeat

mix = mus * (duck * 0.9)[:, None] + vo[:, None] * 1.0 + fx[:, None] * (1 - 0.4 * np.clip(e / 0.05, 0, 1))[:, None]
mix = np.tanh(mix * 1.05) / 1.05
out = ROOT / "public" / "audio"; out.mkdir(parents=True, exist_ok=True)
sf.write(out / "mix_raw.wav", mix.astype(np.float32), SR); sf.write(out / "vo_reel.wav", vo, SR)
ln = "loudnorm=I=-14:TP=-1.5:LRA=11"
r1 = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(out / "mix_raw.wav"), "-af", ln + ":print_format=json", "-f", "null", "-"], capture_output=True, text=True).stderr
j = json.loads(r1[r1.rindex("{"): r1.rindex("}") + 1])
f2 = f"{ln}:measured_I={j['input_i']}:measured_TP={j['input_tp']}:measured_LRA={j['input_lra']}:measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true"
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(out / "mix_raw.wav"), "-af", f2, "-ar", str(SR), str(out / "mix_reel.wav")], check=True)
print("wrote public/audio/mix_reel.wav")

# IG-music master: the same voice and hits with no music bed, for adding a licensed song in Instagram's editor
ig = np.tanh((vo[:, None] + fx[:, None] * 0.8) * 1.05) / 1.05
sf.write(out / "ig_raw.wav", ig.astype(np.float32), SR)
ln = "loudnorm=I=-16:TP=-1.5:LRA=11"
r1 = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(out / "ig_raw.wav"), "-af", ln + ":print_format=json", "-f", "null", "-"], capture_output=True, text=True).stderr
j = json.loads(r1[r1.rindex("{"): r1.rindex("}") + 1])
f2 = f"{ln}:measured_I={j['input_i']}:measured_TP={j['input_tp']}:measured_LRA={j['input_lra']}:measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true"
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(out / "ig_raw.wav"), "-af", f2, "-ar", str(SR), str(out / "mix_reel_igmusic.wav")], check=True)
print("wrote public/audio/mix_reel_igmusic.wav (-16 LUFS, no music)")
