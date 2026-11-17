"""Sound for the 7 carousel slides (each slide plays on its own): an original warm 110 BPM groove (D major), plus SFX
on the slide's own event times (src/config/books.ts segs + src/compositions/Slide.tsx): the book whoosh-in and land,
the page slam, the lens glint, the book opening with a chime, the bot's cheer; slide 1's stomp and orbiting books;
slide 7's stacking tower. Mastered per slide to -14 LUFS / -1.5 dBTP.  -> public/audio/slide_<id>.wav
    python scripts/audio/mix_slides.py
"""
import pathlib, sys
import numpy as np

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import score as S  # noqa: E402
sys.path.insert(0, str(HERE.parents[2] / "bridge-exe/scripts/audio"))
from mix_bridge import master  # noqa: E402

ROOT = HERE.parent.parent; SR = S.SR
rng = np.random.default_rng(1104)
SLIDES = [("s1", 10, []), ("s2", 8.5, ["lbdl", "udl"]), ("s3", 8.5, ["dlbook", "d2l"]), ("s4", 8.5, ["mml", "rl"]),
          ("s5", 11, ["sre", "srw", "bsrs"]), ("s6", 11, ["progit", "ejs", "ostep"]), ("s7", 7, [])]
BEAT = 60 / 110
PROG = [(50, [62, 66, 69]), (47, [62, 66, 71]), (43, [62, 67, 71]), (45, [61, 64, 69])]   # D Bm G A


def put(b, x, t, g=1.0):
    i = int(round(t * SR))
    if i >= len(b) or i + len(x) <= 0: return
    a = max(0, -i); j = max(0, i); m = min(len(x) - a, len(b) - j); b[j:j + m] += x[a:a + m] * g
def T(n): return np.arange(n) / SR
def kick(g=1.0):
    m = int(0.28 * SR); t = T(m); f = 48 + 110 * np.exp(-t * 30); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.15) * g
def clap(g=1.0):
    m = int(0.18 * SR); return S.bp(rng.standard_normal(m), 1100, 6000) * np.exp(-T(m) / 0.05) * g
def hat(g=1.0):
    m = int(0.04 * SR); return S.hp(rng.standard_normal(m), 8000) * np.exp(-T(m) / 0.012) * g
def keys(notes, L, g=1.0):
    m = int(L * SR); t = T(m); x = sum(np.sin(2 * np.pi * S.midi(n) * t) + 0.3 * np.sin(4 * np.pi * S.midi(n) * t) * np.exp(-t / 0.3) for n in notes) / len(notes)
    return x * np.exp(-t / (L * 0.6)) * np.minimum(1, t / 0.01) * g
def bell(n, L=1.2, g=1.0):
    m = int(L * SR); t = T(m); f = S.midi(n); return (np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t / 0.12)) * np.exp(-t / 0.4) * g
def thud(g=1.0):
    m = int(0.4 * SR); t = T(m); f = 60 + 70 * np.exp(-t * 20); return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.14) + S.lp(rng.standard_normal(m), 900) * np.exp(-t / 0.03) * 0.5) * g
def rustle(L=0.5, g=1.0):
    m = int(L * SR); x = S.bp(rng.standard_normal(m), 1500, 7000) * (0.5 + 0.5 * np.sin(2 * np.pi * 23 * T(m)) ** 2); return x * np.sin(np.pi * T(m) / L) * g


def music(dur):
    n = int(dur * SR); out = np.zeros(n); bars = int(dur / (4 * BEAT)) + 1
    for b in range(bars):
        t0 = b * 4 * BEAT; root, ch = PROG[b % 4]
        put(out, keys(ch, 4 * BEAT + 0.3, 0.18), t0)
        for k in range(4):
            tb = t0 + k * BEAT
            put(out, kick(0.7), tb); put(out, hat(0.08), tb + BEAT / 2)
            if k in (1, 3): put(out, clap(0.25), tb)
            m = int(BEAT * SR); put(out, S.lp(S.saw(S.midi(root - 12), m), 300) * np.minimum(1, T(m) / 0.1) * 0.22, tb)
        for k in range(8): put(out, keys([ch[k % 3] + 12], 0.25, 0.05), t0 + k * BEAT / 2)
    out[int((dur - 0.6) * SR):] *= np.linspace(1, 0, n - int((dur - 0.6) * SR)) ** 2
    return out


def sfx(sid, dur, books):
    n = int(dur * SR); out = np.zeros(n); fx = lambda k, L=0.8: S.sfx(k, length=L)  # noqa: E731
    if sid == "s1":
        put(out, fx("whoosh", 0.6), 0.0, 0.4); put(out, S.sfx("subImpact"), 0.55, 0.8); put(out, thud(0.8), 0.55)
        for i in range(12): put(out, fx("whoosh", 0.35), 0.9 + i * 0.12, 0.12); put(out, bell(74 + (i % 5) * 2, 0.6, 0.06), 1.3 + i * 0.12)
        put(out, fx("riser", 1.5), 4.4, 0.18); put(out, bell(86, 1.6, 0.18), 6.0); put(out, rustle(0.8, 0.2), 6.0)
        put(out, fx("glass"), 7.6, 0.25)
    elif sid == "s7":
        for i in range(12): put(out, thud(0.45), 0.55 + i * 0.2)
        put(out, thud(0.9), 3.67); put(out, bell(81, 1.4, 0.2), 3.7); put(out, bell(86, 1.4, 0.16), 3.85)
    else:
        lead, per = 0.25, (dur - 0.25 - 0.35) / len(books)
        for i in range(len(books)):
            t0 = lead + i * per
            put(out, fx("whoosh", 0.5), t0, 0.35); put(out, thud(0.7), t0 + 0.45)            # book flies in + lands
            put(out, fx("mechClick"), t0 + 0.5, 0.3); put(out, thud(0.35), t0 + 0.62)       # page slams in behind
            put(out, fx("glass"), t0 + 0.8, 0.14)                                            # lens glint
            put(out, rustle(0.7, 0.3), t0 + 1.5); put(out, bell(81, 1.2, 0.16), t0 + 1.9); put(out, bell(88, 1.2, 0.1), t0 + 2.0)   # opens with light
            put(out, fx("whoosh", 0.4), t0 + per - 0.42, 0.25)                                # out to the shelf
    return out


def main():
    for sid, dur, books in SLIDES:
        mix = music(dur) * 0.5 + sfx(sid, dur, books) * 0.75
        I, tp = master(mix, ROOT / f"public/audio/slide_{sid}.wav")
        print(f"{sid}: {dur:5.1f} s  {I:.1f} LUFS  peak {tp:.1f} dBFS")


if __name__ == "__main__":
    main()
