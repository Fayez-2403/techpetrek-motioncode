"""ONE BOT, 16 REPOS sound: an original news-flash score (synthesized here), Liam's 9 lines, and SFX on the director's own
event times (src/reel/Director.tsx: the stomp landings, key hits, pedal stomps, hops, the scan, the encoder ...).
120 BPM, D minor, bar 1 at 0.0 s. Music ducked under the voice; master -14 LUFS / -1.5 dBTP.
Writes public/audio/mix_studio.wav (+ music_only_studio.wav) and audio/out/beats_studio.json.
    python scripts/audio/mix_studio.py
"""
import json, pathlib, sys

import numpy as np
import soundfile as sf
from scipy.signal import resample_poly

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import score as S  # noqa: E402
sys.path.insert(0, str(HERE.parents[2] / "bridge-exe/scripts/audio"))
from mix_bridge import master  # noqa: E402  (two-pass loudnorm, shared)

ROOT = HERE.parent.parent; SR = S.SR
TM = json.loads((ROOT / "SCENE_TIMINGS.json").read_text(encoding="utf-8"))
VO = json.loads((ROOT / "audio/out/lines.json").read_text(encoding="utf-8"))["lines"]
SEC = {s["id"]: s for s in TM["sections"]}; BEATS = TM["beats"]
TOTAL = TM["duration"]; N = int(TOTAL * SR); BEAT = 0.5; BAR = 2.0
rng = np.random.default_rng(20261103)
NO_DROP = {"numba", "scipy", "gsap", "puppeteer", "tonejs", "pedalboard", "ffmpeg"}   # beats without the drop-in stomp
PROG = [(38, [62, 65, 69]), (34, [58, 62, 65]), (41, [60, 65, 69]), (36, [60, 64, 67])]   # Dm Bb F C


def put(buf, x, t, g=1.0):
    i = int(round(t * SR))
    if i >= len(buf) or i + len(x) <= 0: return
    a = max(0, -i); j = max(0, i); m = min(len(x) - a, len(buf) - j)
    buf[j:j + m] += x[a:a + m] * g
def T(n): return np.arange(n) / SR
def kick(g=1.0, n=0.3):
    m = int(n * SR); t = T(m); f = 45 + 125 * np.exp(-t * 32); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.16) * g
def snare(g=1.0):
    m = int(0.2 * SR); t = T(m); return (S.bp(rng.standard_normal(m), 1500, 8000) * np.exp(-t / 0.06) + np.sin(2 * np.pi * 200 * t) * np.exp(-t / 0.04) * 0.4) * g
def hat(g=1.0):
    m = int(0.04 * SR); return S.hp(rng.standard_normal(m), 8000) * np.exp(-T(m) / 0.012) * g
def stab(notes, L=0.35, g=1.0, cut=3500):   # brassy news stab
    m = int(L * SR); x = sum(S.saw(S.midi(n), m, detune=0.15) for n in notes) / len(notes)
    return S.lp(x, cut) * np.minimum(1, T(m) / 0.008) * np.exp(-T(m) / (L * 0.5)) * g
def pad(notes, L, g=1.0):
    m = int(L * SR); x = sum(S.saw(S.midi(n), m, detune=0.2) for n in notes) / len(notes)
    return S.lp(x, 1500) * np.minimum(1, T(m) / 0.3) * np.clip((L - T(m)) / 0.3, 0, 1) * g
def pluck(n, L=0.18, g=1.0):
    m = int(L * SR); return S.lp(S.saw(S.midi(n), m), 3200) * np.exp(-T(m) / (L * 0.35)) * g
def tone(f, L, g=1.0):
    m = int(L * SR); return np.sin(2 * np.pi * f * T(m)) * np.exp(-T(m) / (L * 0.4)) * g
def piano(n, g=1.0):
    m = int(0.9 * SR); t = T(m); f = S.midi(n)
    return (np.sin(2 * np.pi * f * t) + 0.5 * np.sin(4 * np.pi * f * t) * np.exp(-t / 0.2) + 0.2 * np.sin(6 * np.pi * f * t) * np.exp(-t / 0.1)) * np.exp(-t / 0.35) * g
def thud(g=1.0):
    m = int(0.5 * SR); t = T(m); f = 38 + 60 * np.exp(-t * 18)
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.2) + S.lp(rng.standard_normal(m), 700) * np.exp(-t / 0.04) * 0.6) * g


def music():
    out = np.zeros(N)
    # hook: news stinger + timpani roll into the stomp at 0.77
    for k in range(10): put(out, thud(0.18 + 0.05 * k), 0.02 + k * 0.07)
    put(out, stab([62, 65, 69, 74], 0.9, 0.5), 0.77); put(out, S.sfx("subImpact"), 0.77, 0.9)
    for at, ch in [(1.77, [60, 64, 67]), (2.27, [62, 65, 69]), (2.77, [65, 69, 72])]: put(out, stab(ch, 0.3, 0.35), at)
    for b in range(int(TOTAL / BAR) + 1):
        t0 = b * BAR
        if t0 >= SEC["cta"]["t0"]: break
        root, ch = PROG[b % 4]
        drop = SEC["total"]["t0"] <= t0 < SEC["cta"]["t0"]
        put(out, pad(ch, BAR + 0.3, 0.12), t0)
        for k in range(4):
            tb = t0 + k * BEAT
            if t0 >= 1.5:
                put(out, kick(0.85), tb)
                m = int(BEAT * SR); put(out, S.lp(S.saw(S.midi(root - 12), m), 380) * np.minimum(1, T(m) / 0.12) ** 1.5 * 0.28, tb)
                if k in (1, 3): put(out, snare(0.35), tb)
            put(out, hat(0.1), tb + BEAT / 2); put(out, hat(0.05), tb + BEAT / 4)
        if t0 >= 6:
            for k in range(8): put(out, pluck(ch[k % 3] + (12 if k >= 4 else 0), 0.16, 0.07 if not drop else 0.1), t0 + k * BEAT / 2)
    # total: a rising arpeggio while the counter runs, a hit at the end; cta: resolve
    a0 = SEC["total"]["t0"]
    for k in range(20): put(out, pluck(62 + [0, 3, 7, 10, 12][k % 5] + 12 * (k // 10), 0.14, 0.09), a0 + 0.25 + k * 0.12)
    put(out, stab([62, 66, 69, 74], 0.8, 0.45), a0 + 2.6); put(out, S.sfx("subImpact"), a0 + 2.6, 0.6)
    c = SEC["cta"]["t0"]; put(out, kick(1.0, 0.5), c); put(out, pad([62, 66, 69, 74], 4.4, 0.32), c)
    for at, n in [(0, 74), (0.25, 78), (0.5, 81), (0.75, 86)]: put(out, tone(S.midi(n), 1.4, 0.12), c + at)
    end = int((TOTAL - 1.1) * SR); out[end:] *= np.linspace(1, 0, N - end) ** 2
    return out


def sfx():
    out = np.zeros(N); fx = lambda k, L=0.8: S.sfx(k, length=L)  # noqa: E731
    put(out, fx("whoosh", 0.8), 0.0, 0.35)                                 # falling out of the sky
    for i in range(16): put(out, fx("whoosh", 0.4), 0.05 + i * 0.12, 0.08)  # the panels slam into the arc
    for b in BEATS:
        t0, s = b["t0"], b["slug"]
        if s not in NO_DROP: put(out, fx("whoosh", 0.4), t0 - 0.05, 0.18); put(out, thud(0.8), t0 + 0.17)
        put(out, fx("mechClick"), t0 + 0.1, 0.35)                           # the panel slams in
        put(out, fx("glass"), t0 + 0.3, 0.12)                               # the lens catches the light
        if s == "blender": put(out, fx("shimmer", 0.6), t0 + 0.2, 0.3)
        if s == "threejs": put(out, fx("whoosh", 1.2), t0 + 0.1, 0.3)
        if s == "numpy": put(out, fx("dataBurst", 1.2), t0 + 0.1, 0.3)
        if s == "numba": put(out, fx("whoosh", 1.0), t0 + 0.15, 0.5); put(out, fx("accelSweep", 1.0), t0 + 0.15, 0.25)
        if s == "scipy": put(out, fx("riser", 1.4), t0, 0.15)
        if s == "gsap":
            for k in range(3): put(out, thud(0.4), t0 + k * 0.45 + 0.44); put(out, tone(880 * (1 + k * 0.25), 0.2, 0.15), t0 + k * 0.45 + 0.44)
        if s == "remotion":
            for k in range(10): put(out, fx("mechClick"), t0 + 0.3 + k * 0.18, 0.12)
        if s == "puppeteer":
            for k in range(5): put(out, S.sfx("twang", pitch=1 + 0.2 * k), t0 + 0.2 + k * 0.45, 0.3)
        if s == "tonejs":
            for k, n in enumerate([69, 72, 76]): put(out, piano(n, 0.45), t0 + 0.46 + k * 0.5)
        if s == "pedalboard":
            for k in range(3): put(out, thud(0.9), t0 + 0.12 + k * 0.7); put(out, fx("mechClick"), t0 + 0.12 + k * 0.7, 0.5)
        if s == "pyloudnorm": put(out, fx("riser", 1.0), t0 + 0.7, 0.2); put(out, thud(0.9), t0 + 1.72); put(out, tone(1320, 0.4, 0.2), t0 + 1.75)
        if s == "opencv": put(out, fx("servo", 0.4), t0 + 0.35, 0.3); [put(out, tone(1760, 0.08, 0.15), t0 + 0.5 + k * 0.3) for k in range(5)]
        if s == "pillow":
            for k in range(16): put(out, fx("mechClick"), t0 + k * 0.035, 0.08)
        if s == "fasterwhisper":
            for k in range(5): put(out, tone(660 + 110 * k, 0.12, 0.18), t0 + 0.3 + k * 0.28)
        if s == "ffmpeg": put(out, fx("servoRhythm", 2.0), t0 + 0.2, 0.25); put(out, tone(1568, 0.5, 0.2), t0 + 1.35)
        if s == "reportlab": put(out, fx("typing", 1.0), t0 + 0.2, 0.3); put(out, fx("paper"), t0 + 1.1, 0.4)
    a0 = SEC["total"]["t0"]
    for k in range(24): put(out, tone(2000 + 40 * k, 0.04, 0.08), a0 + 0.25 + k * 0.1)   # the counter ticking
    cw = next(w["t0"] for l in TM["lines"] if l["id"] == "v09" for w in l["words"] if w["w"].lower().startswith("comment"))
    put(out, tone(S.midi(86), 1.0, 0.22), cw - 0.1); put(out, tone(S.midi(93), 1.0, 0.16), cw)
    return out


def voices():
    out = np.zeros(N)
    for l in VO:
        y, sr = sf.read(ROOT / "audio/out" / f"{l['id']}.wav", dtype="float64")
        put(out, resample_poly(y, SR, sr) if sr != SR else y, l["start"])
    return out


def main():
    mus, fx, vox = music(), sfx(), voices()
    env = S.envelope(vox, 0.01, 0.3); duck = 1 - 0.65 * np.clip(env / 0.08, 0, 1)
    out = ROOT / "public/audio/mix_studio.wav"; out.parent.mkdir(parents=True, exist_ok=True)
    I, tp = master(vox * 1.0 + mus * 0.45 * duck + fx * 0.6, out)
    I2, tp2 = master(mus * 0.6 + fx * 0.6, ROOT / "public/audio/music_only_studio.wav")
    (ROOT / "audio/out/beats_studio.json").write_text(json.dumps({"bpm": 120, "beat": BEAT, "bar1": 0.0, "total": TOTAL, "beats": [round(i * BEAT, 2) for i in range(int(TOTAL / BEAT) + 1)], "repo_beats": BEATS}, indent=1), encoding="utf-8")
    print(f"-> {out}  {TOTAL:.2f} s  {I:.1f} LUFS  peak {tp:.1f} dBFS  | music only {I2:.1f} LUFS")


if __name__ == "__main__":
    main()
