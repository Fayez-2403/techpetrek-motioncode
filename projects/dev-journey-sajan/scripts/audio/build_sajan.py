"""One timeline for picture and sound: the song edit (measured), the kick grid, the typed-character times.
Song (the user's file, audio/src/sajan_sajan.mp3, a remix of "Sajan Sajan Teri Dulhan"):
  A  'Chandni raat...' (soft, no bass): song 12.40 -> reel 0.000 .. 11.005
  B  the chorus: 'Sajan' pickup in the break at song 111.98, bass back at song 112.845 = reel 12.000 (THE DROP)
  snap to black on the kick at song 118.38 = reel 17.535 (after 'aaja'), then the exit() prompt over silence-ish room tone
Writes src/config/timeline.json and three wavs in public/audio/:
  mix_song.wav   song edit + key SFX (for the user's preview / their own posting; commercial song baked in)
  mix_ig.wav     key SFX + room tone only (IG-music master: add the song in Instagram at 1:51.85)
Both mastered to -14 LUFS / -1.5 dBTP (bridge-exe master()).
    python scripts/audio/build_sajan.py
"""
import json, pathlib, re, subprocess, sys

import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfilt

HERE = pathlib.Path(__file__).resolve().parent; ROOT = HERE.parents[1]


def master(x, path):
    """stereo two-pass loudnorm to -14 LUFS / -1.5 dBTP (same settings as bridge-exe master(), kept stereo)"""
    raw = path.with_suffix(".raw.wav"); sf.write(raw, x * 0.5, SR, subtype="FLOAT")
    a = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(raw), "-af", "loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"], capture_output=True, text=True).stderr
    m = json.loads(a[a.rindex("{"):a.rindex("}") + 1])
    af = (f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}:"
          f"measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true")
    subprocess.run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", str(raw), "-af", af, "-ar", str(SR), "-ac", "2", "-c:a", "pcm_s16le", str(path)], check=True)
    raw.unlink()
    r = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(path), "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True).stderr
    return float(re.findall(r"I:\s+(-?[\d.]+) LUFS", r)[-1]), float(re.findall(r"Peak:\s+(-?[\d.]+) dBFS", r)[-1])

SR = 48000
A0, B0, KICK, SNAP_SONG = 12.40, 111.85, 112.845, 118.38
DROP = 12.0
B_REEL = DROP - (KICK - B0)                    # 11.005: where the chorus clip starts in the reel
SNAP = DROP + (SNAP_SONG - KICK)               # 17.535
TOTAL = 19.6
KICKS_SONG = [112.845, 113.415, 113.95, 114.5, 115.435, 115.81, 116.37, 116.89, 117.27, 117.635, 118.38]
LYR = [("Sajan", 111.98), ("sajan", 113.38), ("teri", 114.12), ("dulhan", 114.6), ("tujhko", 115.38), ("pukare", 116.22), ("aaja", 117.2)]

CODE = 'def morning_routine():\n    coffee = brew(type="green_tea")\n    focus = DeepWork(duration="4h")\n    return clean_code'
EXIT = "exit()"
h = lambda n: (np.sin(n * 127.1 + 311.7) * 43758.5453) % 1.0


def typing_times(text, t0, base, jitter, nl_pause):
    out, t = [], t0
    for i, c in enumerate(text):
        out.append(round(t, 3))
        t += base * (1 + jitter * (h(i + 7) - 0.5) * 2) + (nl_pause if c == "\n" else 0) + (0.12 if c in ",(=" and h(i) > 0.6 else 0)
    return out


def load_song():
    tmp = ROOT / "audio/src/sajan_48k.wav"
    if not tmp.exists():
        subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", str(ROOT / "audio/src/sajan_sajan.mp3"), "-ar", str(SR), "-ac", "2", str(tmp)], check=True)
    y, _ = sf.read(tmp); return y


def clip(y, a, b):
    return y[int(a * SR):int(b * SR)].copy()


def fade(x, fin=0.0, fout=0.0):
    n = len(x)
    if fin: k = int(fin * SR); x[:k] *= np.linspace(0, 1, k)[:, None]
    if fout: k = int(fout * SR); x[n - k:] *= np.linspace(1, 0, k)[:, None]
    return x


def key(g=1.0, heavy=False, seed=0):
    """one mechanical key: a sharp plastic tick + a low thock body"""
    r = np.random.default_rng(seed); n = int(0.09 * SR); t = np.arange(n) / SR
    tick = sosfilt(butter(2, [2500, 9000], "band", fs=SR, output="sos"), r.standard_normal(n)) * np.exp(-t / 0.004)
    f = (180 if heavy else 260) * (1 + 0.15 * (r.random() - 0.5))
    body = np.sin(2 * np.pi * f * t) * np.exp(-t / (0.03 if heavy else 0.018)) * 0.6
    bottom = sosfilt(butter(2, [600, 2200], "band", fs=SR, output="sos"), r.standard_normal(n)) * np.exp(-np.maximum(t - 0.012, 0) / 0.01) * (t > 0.012) * 0.5
    x = (tick + body + bottom) * g
    return np.stack([x * (0.9 + 0.2 * r.random()), x * (0.9 + 0.2 * r.random())], 1)


def put(buf, x, t, g=1.0):
    i = int(round(t * SR))
    if i >= len(buf) or i + len(x) <= 0: return
    a = max(0, -i); j = max(0, i); m = min(len(x) - a, len(buf) - j)
    buf[j:j + m] += x[a:a + m] * g


def main():
    code_t = typing_times(CODE, 1.6, 0.072, 0.55, 0.38)
    exit_t = typing_times(EXIT, SNAP + 0.75, 0.13, 0.4, 0)
    kicks = [round(DROP + (k - KICK), 3) for k in KICKS_SONG]
    tl = {"fps": 60, "duration": TOTAL, "drop": DROP, "bStart": round(B_REEL, 3), "snap": round(SNAP, 3), "kicks": kicks,
          "lyrics": [{"w": w, "t": round(B_REEL + (s - B0), 3)} for w, s in LYR], "code": CODE, "codeT": code_t, "exit": EXIT, "exitT": exit_t,
          "song": {"file": "the user's remix of 'Sajan Sajan Teri Dulhan'", "A": [A0, A0 + B_REEL], "B": [B0, SNAP_SONG + 0.05], "igStart": "1:51.85"}}
    (ROOT / "src/config/timeline.json").write_text(json.dumps(tl, indent=1), encoding="utf-8")

    N = int(TOTAL * SR); song = np.zeros((N, 2)); fx = np.zeros((N, 2))
    y = load_song()
    a = fade(clip(y, A0, A0 + B_REEL + 0.04), fin=0.02, fout=0.04)
    b = fade(clip(y, B0, SNAP_SONG + 0.012), fin=0.03, fout=0.012)            # the snap: the song stops dead on the kick
    put(song, a, 0.0); put(song, b, B_REEL - 0.0)
    # keys: slow and soft on the morning code; a storm after the drop; six deliberate keys for exit()
    for i, t in enumerate(code_t):
        if CODE[i] != " ": put(fx, key(0.55, seed=i), t)
    r = np.random.default_rng(7); t = DROP + 0.1
    while t < SNAP - 0.05:
        put(fx, key(0.35 + 0.25 * r.random(), heavy=r.random() > 0.7, seed=int(t * 1000)), t); t += 0.045 + 0.05 * r.random()
    for i, t in enumerate(exit_t): put(fx, key(0.9, heavy=True, seed=900 + i), t)
    put(fx, key(1.2, heavy=True, seed=999), exit_t[-1] + 0.45)              # Enter
    # room tone under the black (so the end is not dead air): a quiet hum + air
    n = N - int(SNAP * SR); t_ = np.arange(n) / SR
    hum = (np.sin(2 * np.pi * 50 * t_) * 0.4 + np.sin(2 * np.pi * 100 * t_) * 0.2) * 0.03 + sosfilt(butter(2, [200, 3000], "band", fs=SR, output="sos"), np.random.default_rng(3).standard_normal(n)) * 0.012
    fx[int(SNAP * SR):, 0] += hum; fx[int(SNAP * SR):, 1] += hum
    pre = np.zeros((N, 2)); n0 = int(SNAP * SR)                                # IG master: room tone throughout (no silent windows)
    t0 = np.arange(n0) / SR; pre[:n0, 0] = pre[:n0, 1] = sosfilt(butter(2, [200, 3000], "band", fs=SR, output="sos"), np.random.default_rng(4).standard_normal(n0)) * 0.002 + np.sin(2 * np.pi * 50 * t0) * 0.002
    out = ROOT / "public/audio"; out.mkdir(parents=True, exist_ok=True)
    I1, p1 = master(song + fx * 0.55, out / "mix_song.wav")
    I2, p2 = master(fx + pre, out / "mix_ig.wav")
    print(f"drop {DROP}  B starts {B_REEL:.3f}  snap {SNAP:.3f}  kicks {kicks}")
    print(f"mix_song {I1:.1f} LUFS peak {p1:.1f} | mix_ig {I2:.1f} LUFS peak {p2:.1f}")


if __name__ == "__main__":
    main()
