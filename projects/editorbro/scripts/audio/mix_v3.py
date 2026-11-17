"""v3 mix (user, 2026-10-31): the GTA track loud over the ride until the camera is inside the screen, then our own score
very low under the hot voice. Builds on score.py's v3 stems (run `python scripts/audio/score.py --version v3` first).
    python scripts/audio/mix_v3.py [--no-gta]
--no-gta: the Instagram copy (the GTA track is a commercial song: add it in Instagram instead); our bed plays from 0 s
and the manifest is left alone. Writes public/audio/mix_reel_v3.wav (-14 LUFS, -2 dBTP) and points src/config/audioManifest.json at it.
"""
import json, pathlib, subprocess, sys

import librosa
import numpy as np
import soundfile as sf

ROOT = pathlib.Path(__file__).resolve().parents[2]
SR = 48000
STEMS = ROOT / "audio" / "out" / "v3" / "reel"
TM = json.loads((ROOT / "SCENE_TIMINGS.v3.json").read_text(encoding="utf-8"))["variants"]["reel"]
WORDS = [w for c in TM["captions"] for w in c["words"]]
first = lambda pre: next(w["t0"] for w in WORDS if w["w"].lower().startswith(pre))
H01 = [c for c in TM["captions"] if c["line"] == "h01"]
SPEAK0, SPEAK1 = H01[0]["words"][0]["t0"], H01[-1]["words"][-1]["t1"]
INSIDE = 6.4                              # the dive ends (the world D1 the plates were captured with)
BED_GAIN, SFX_GAIN, GTA_DUCK = 0.12, 0.8, 0.5
NO_GTA = "--no-gta" in sys.argv

def load(p):
    x, sr = sf.read(p, dtype="float64")
    x = x.mean(1) if x.ndim > 1 else x
    return librosa.resample(x, orig_sr=sr, target_sr=SR) if sr != SR else x

n = int(TM["seconds"] * SR)
fit = lambda x: np.pad(x, (0, max(0, n - len(x))))[:n]
vo, bed, fx = (fit(load(STEMS / f"stem_{k}.wav")) for k in ("vo", "music", "sfx"))
gta = librosa.load(ROOT / "assets" / "gta_san_andreas.mp3", sr=SR, mono=False)[0]
lead = int(np.argmax(np.abs(gta).max(0) > 0.02))               # skip the mp3's silent lead-in: loud from frame 0
gta_l, gta_r = (fit(c[lead:]) for c in gta)

t = np.arange(n) / SR
inside = np.clip((t - (INSIDE - 0.1)) / 0.25, 0, 1)            # 0 before the screen, 1 inside it
gta_env = (1 - inside) * np.where((t > SPEAK0 - 0.1) & (t < SPEAK1 + 0.1), GTA_DUCK, 1.0)   # dip under "Ye GTA 6 ka trailer nahi hai!"
gta_env = np.convolve(gta_env, np.ones(int(0.06 * SR)) / int(0.06 * SR), mode="same")   # soften the duck edges
sfx_env = np.clip((t - (INSIDE - 1.2)) / 0.1, 0, 1)             # the dive whoosh onward; the old hook cues sit out
if NO_GTA: gta_env = gta_env * 0; inside = np.ones(n)
mid = vo + bed * BED_GAIN * inside + fx * SFX_GAIN * sfx_env
mix = np.stack([mid + gta_l * gta_env, mid + gta_r * gta_env], 1)
mix = np.tanh(mix * 1.05) / 1.05
raw = STEMS / "mix_v3_raw.wav"
sf.write(raw, mix.astype(np.float32), SR)
out = ROOT / "public" / "audio" / ("mix_reel_v3_noGTA.wav" if NO_GTA else "mix_reel_v3.wav")
master = ROOT.parents[1] / ".claude" / "skills" / "motion-studio" / "scripts" / "master.py"
subprocess.run([sys.executable, str(master), str(raw), str(out), "--lufs", "-14", "--tp", "-2"], check=True)
if not NO_GTA:
    man = ROOT / "src" / "config" / "audioManifest.json"
    m = json.loads(man.read_text()); m["reel"] = "audio/mix_reel_v3.wav"; man.write_text(json.dumps(m, indent=1))
print("v3 mix ->", out.relative_to(ROOT))
