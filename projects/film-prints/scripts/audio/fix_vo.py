"""Surgical fixes on public/audio/vo.wav for three take artefacts that Scribe flagged (2026-11-28), without a new take
(a new take would move every word time and force a full re-render). Run after timing_reel.py, before mix_reel.py.
The untouched file is kept as vo_raw.wav; every edit uses 12 ms fades, so there are no clicks.

  b01  "...live dekho" carries a 0.15 s extra syllable (heard as "naya")  -> fade out from 5.66 s
  b14  "tareekh hai, [mumble] hai TTL"                                   -> mute 55.08-55.71 (keeps "tareekh hai, ... TTL")
  b17  "aur interest... interesting" (false start)                       -> mute 72.44-73.86, put b14's clean "aur" at 72.52, move the clean
                                                                            "interesting" (73.33-73.84) to 72.68, so it
                                                                            follows "aur" and lands 2 f before its caption
"""
import pathlib
import shutil
import numpy as np
import soundfile as sf

ROOT = pathlib.Path(__file__).resolve().parents[2]
VO = ROOT / "public/audio/vo.wav"
RAW = ROOT / "public/audio/vo_raw.wav"
if not RAW.exists():
    shutil.copy(VO, RAW)
y, SR = sf.read(RAW, dtype="float64")
FADE = int(0.012 * SR)


def ramp(n, up):
    r = 0.5 - 0.5 * np.cos(np.linspace(0, np.pi, n))
    return r if up else r[::-1]


def gain_shape(n, a, b):
    """Envelope that is 1 outside [a, b] seconds and 0 inside, with fades."""
    g = np.ones(n)
    i, j = int(a * SR), int(b * SR)
    g[i:j] = 0
    g[i - FADE:i] *= ramp(FADE, False)
    g[j:j + FADE] *= ramp(FADE, True)
    return g


def shape(sig):
    return sig[:, None] if y.ndim > 1 else sig


out = y.copy()
n = len(out)
# b01: fade out the tail
i = int(5.66 * SR)
out[i:i + FADE] *= shape(ramp(FADE, False))
out[i + FADE:int(6.30 * SR)] = 0
# b14: mute the mumble + doubled "hai"
out *= shape(gain_shape(n, 55.08, 55.71))
# b17: lift the clean "interesting", mute the false start + old spot, drop it in after "aur"
a, b = int(73.33 * SR), int(73.84 * SR)
word = y[a:b].copy()
word[:FADE] *= shape(ramp(FADE, True))
word[-FADE:] *= shape(ramp(FADE, False))
out *= shape(gain_shape(n, 72.44, 73.86))          # also b17's own "aur", which Scribe hears as "on"/"and"
k = int(72.68 * SR)
out[k:k + len(word)] += word
# the clean "aur" from b14 ("max-age, aur telegram", 58.055-58.145: a pause before it, the t-closure after it)
a, b = int(58.055 * SR), int(58.145 * SR)
aur = y[a:b].copy()
aur[:FADE // 2] *= shape(ramp(FADE // 2, True))
aur[-FADE:] *= shape(ramp(FADE, False))
k = int(72.52 * SR)
out[k:k + len(aur)] += aur
sf.write(VO, out, SR, subtype="PCM_16")
print("vo fixed ->", VO)
