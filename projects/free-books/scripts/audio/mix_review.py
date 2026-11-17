"""Sound for the screen-review carousel (each slide plays alone): an original driving 124 BPM beat (A minor, plucky
synth + sub), and UI foley on the slide's own event times (src/review/Review.tsx): card swoosh-in, cursor glides,
highlight draws (a rising tick per box), label pops, the click, mascot boings, the hook's page flips, the outro's
list ticks and final hit. Each slide mastered to -14 LUFS / -1.5 dBTP.  -> public/audio/rev_<id>.wav
    python scripts/audio/mix_review.py
"""
import pathlib, sys
import numpy as np

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import score as S  # noqa: E402
sys.path.insert(0, str(HERE.parents[2] / "bridge-exe/scripts/audio"))
from mix_bridge import master  # noqa: E402

ROOT = HERE.parent.parent; SR = S.SR; rng = np.random.default_rng(1105)
BEAT = 60 / 124
PROG = [(45, [57, 60, 64]), (41, [57, 60, 65]), (48, [55, 60, 64]), (43, [55, 59, 62])]
BOOKS = ["lbdl", "udl", "dlbook", "d2l", "mml", "rl", "sre", "srw", "bsrs", "progit", "ejs", "ostep"]


def put(b, x, t, g=1.0):
    i = int(round(t * SR))
    if i >= len(b) or i + len(x) <= 0: return
    a = max(0, -i); j = max(0, i); m = min(len(x) - a, len(b) - j); b[j:j + m] += x[a:a + m] * g
def T(n): return np.arange(n) / SR
def kick(g=1.0):
    m = int(0.26 * SR); t = T(m); f = 46 + 120 * np.exp(-t * 32); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.14) * g
def snare(g=1.0):
    m = int(0.18 * SR); return (S.bp(rng.standard_normal(m), 1500, 8000) * np.exp(-T(m) / 0.05)) * g
def hat(g=1.0):
    m = int(0.035 * SR); return S.hp(rng.standard_normal(m), 8500) * np.exp(-T(m) / 0.01) * g
def pluck(n, L=0.16, g=1.0):
    m = int(L * SR); return S.lp(S.saw(S.midi(n), m), 3800) * np.exp(-T(m) / (L * 0.3)) * g
def tone(f, L, g=1.0):
    m = int(L * SR); return np.sin(2 * np.pi * f * T(m)) * np.exp(-T(m) / (L * 0.35)) * np.minimum(1, T(m) / 0.003) * g
def tick(k, g=1.0): return tone(1200 * 2 ** (k / 12), 0.09, g)
def boing(g=1.0):
    m = int(0.3 * SR); t = T(m); f = 220 + 380 * np.exp(-t * 9) * (1 + 0.3 * np.sin(2 * np.pi * 18 * t)); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.12) * g
def click(g=1.0):
    m = int(0.03 * SR); return (S.bp(rng.standard_normal(m), 2500, 9000) * np.exp(-T(m) / 0.004) + np.sin(2 * np.pi * 1800 * T(m)) * np.exp(-T(m) / 0.006)) * g


def music(dur, drop=None):
    n = int(dur * SR); out = np.zeros(n)
    for b in range(int(dur / (4 * BEAT)) + 1):
        t0 = b * 4 * BEAT; root, ch = PROG[b % 4]
        for k in range(4):
            tb = t0 + k * BEAT
            put(out, kick(0.8), tb); put(out, hat(0.09), tb + BEAT / 2); put(out, hat(0.05), tb + BEAT / 4)
            if k in (1, 3): put(out, snare(0.3), tb)
            m = int(BEAT * SR); put(out, S.lp(S.saw(S.midi(root - 12), m), 340) * np.minimum(1, T(m) / 0.1) ** 1.5 * 0.24, tb)
        for k in range(8): put(out, pluck(ch[k % 3] + (12 if k % 4 == 3 else 0), 0.15, 0.07), t0 + k * BEAT / 2)
    if drop: a, b = (int(x * SR) for x in drop); out[a:b] *= 0.15
    out[int((dur - 0.5) * SR):] *= np.linspace(1, 0, n - int((dur - 0.5) * SR)) ** 2
    return out


def book_sfx(dur):
    out = np.zeros(int(dur * SR)); fx = lambda k, L=0.6: S.sfx(k, length=L)  # noqa: E731
    put(out, fx("whoosh", 0.6), 0.0, 0.35); put(out, boing(0.25), 0.5)                  # card + mascot in
    for tt in (0.9, 2.3, 4.0, 6.0): put(out, fx("whoosh", 0.3), tt - 0.45, 0.12)        # cursor glides
    put(out, tick(0, 0.3), 1.0); put(out, click(0.3), 1.2)                              # title box + label
    for i in range(3): put(out, tick(3 + i * 2, 0.28), 2.4 + i * 0.25)                  # rows / stat
    put(out, boing(0.22), 1.9); put(out, boing(0.22), 3.7); put(out, fx("riser", 0.8), 3.0, 0.12)
    put(out, tick(12, 0.35), 4.15); put(out, tone(1568, 0.5, 0.2), 4.35); put(out, fx("glass"), 4.2, 0.18)   # FREE ✓
    put(out, click(0.6), 6.0); put(out, tone(2093, 0.25, 0.2), 6.1); put(out, boing(0.22), 5.6)            # the click
    return out


def main():
    for b in BOOKS:
        I, tp = master(music(8.0, drop=(3.95, 4.15)) * 0.5 + book_sfx(8.0) * 0.8, ROOT / f"public/audio/rev_{b}.wav")
        print(f"{b:7s} {I:.1f} LUFS {tp:.1f} dBFS")
    # hook: page flips every 0.55 s from 1.2 s, a counter tick each, the mascot drops in
    h = np.zeros(int(10 * SR)); put(h, S.sfx("subImpact"), 0.1, 0.8); put(h, boing(0.35), 1.1)
    for i in range(12): put(h, S.sfx("whoosh", length=0.25), 1.15 + i * 0.55, 0.15); put(h, tick(i, 0.22), 1.25 + i * 0.55)
    put(h, tone(1760, 0.8, 0.25), 7.9)
    I, tp = master(music(10.0) * 0.5 + h * 0.8, ROOT / "public/audio/rev_hook.wav"); print(f"hook    {I:.1f} LUFS")
    o = np.zeros(int(7 * SR))
    for i in range(12): put(o, tick(i % 8, 0.15), 0.1 + i * 0.06); put(o, click(0.25), 0.8 + i * (3.4 / 12))
    put(o, S.sfx("subImpact"), 4.3, 0.7); put(o, tone(1760, 1.0, 0.25), 4.35); put(o, tone(2637, 1.0, 0.18), 4.45)
    I, tp = master(music(7.0) * 0.5 + o * 0.8, ROOT / "public/audio/rev_outro.wav"); print(f"outro   {I:.1f} LUFS")


if __name__ == "__main__":
    main()
