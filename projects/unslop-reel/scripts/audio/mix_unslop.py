"""AI WEBSITE SAB EK JAISI?! sound, original and synthesized here (120 BPM, bar 1 at 0.0 s). It does what the picture does:
a generic bright "AI corporate" bed (major-7 pad, sparkle chimes, claps) until "bhai bas karo", a record stop and 120 ms
of silence, then the designed groove: E dorian funk (syncopated 16th bass, muted chord stabs, hats) with light tabla.
SFX sit on the picture's own events (src/compositions/Unslop.tsx + src/world/Monitors.tsx): monitor landings, the red
tags, the lens drops, the six spacing measurements, the story video's four steps (a rising note per step), the cursor
click, the DESIGN box turning white. Music ducked under Liam; master -14 LUFS / -1.5 dBTP (bridge-exe master()).
Writes public/audio/mix_unslop.wav (+ music_only_unslop.wav).
    python scripts/audio/mix_unslop.py
"""
import json, pathlib, re, sys

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
SEC = {s["id"]: s for s in TM["sections"]}
TOTAL = TM["duration"]; N = int(TOTAL * SR); BEAT = 0.5; BAR = 2.0
rng = np.random.default_rng(20261104)


def wordT(line, pat, fb):   # same lookup as src/reel/time.ts wordT: picture and sound share the word times
    l = next((l for l in TM["lines"] if l["id"] == line), None)
    return next((w["t0"] for w in (l["words"] if l else []) if re.search(pat, w["w"])), fb)


TURN = wordT("v02", r"^karo", 5.5); VSTART = wordT("v06", r"^chalaya", 23.2); STEPS = [2.0, 3.5, 4.7, 7.55]; VLEN = 9.22
H0 = SEC["hook"]["t0"]; LAND = [H0 + x for x in (-0.15, 0.34, 0.34, 0.68, 0.68)]   # hook-relative in Monitors.tsx


def put(buf, x, t, g=1.0):
    i = int(round(t * SR))
    if i >= len(buf) or i + len(x) <= 0: return
    a = max(0, -i); j = max(0, i); m = min(len(x) - a, len(buf) - j)
    buf[j:j + m] += x[a:a + m] * g
def T(n): return np.arange(n) / SR
def kick(g=1.0, n=0.32):
    m = int(n * SR); t = T(m); f = 42 + 130 * np.exp(-t * 30); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.17) * g
def snare(g=1.0):
    m = int(0.22 * SR); t = T(m); return (S.bp(rng.standard_normal(m), 1200, 7000) * np.exp(-t / 0.07) + np.sin(2 * np.pi * 180 * t) * np.exp(-t / 0.04) * 0.4) * g
def hat(g=1.0):
    m = int(0.04 * SR); return S.hp(rng.standard_normal(m), 8000) * np.exp(-T(m) / 0.012) * g
def clap(g=1.0):
    m = int(0.18 * SR); t = T(m); n = S.bp(rng.standard_normal(m), 900, 6000)
    e = sum(np.exp(-np.maximum(t - d, 0) / 0.012) * (t >= d) for d in (0, 0.008, 0.016)) + np.exp(-t / 0.08) * 0.5
    return n * e * g * 0.6
def pad(notes, L, g=1.0, cut=1200):
    m = int(L * SR); x = sum(S.saw(S.midi(n), m, detune=0.25) for n in notes) / len(notes)
    return S.lp(x, cut) * np.minimum(1, T(m) / 0.4) * np.clip((L - T(m)) / 0.3, 0, 1) * g
def stab(notes, L=0.12, g=1.0):   # a muted funk chord stab
    m = int(L * SR); x = sum(S.saw(S.midi(n), m, detune=0.08) for n in notes) / len(notes)
    return S.bp(x, 300, 3200) * np.exp(-T(m) / 0.045) * g
def tone(f, L, g=1.0):
    m = int(L * SR); return np.sin(2 * np.pi * f * T(m)) * np.exp(-T(m) / (L * 0.4)) * g
def bell(n, L=0.9, g=1.0):
    m = int(L * SR); t = T(m); f = S.midi(n)
    return (np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * f * 2.0 * t) * np.exp(-t / 0.2) + 0.2 * np.sin(2 * np.pi * f * 3.01 * t) * np.exp(-t / 0.08)) * np.exp(-t / (L * 0.35)) * g
def thud(g=1.0):
    m = int(0.5 * SR); t = T(m); f = 36 + 60 * np.exp(-t * 18)
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.2) + S.lp(rng.standard_normal(m), 700) * np.exp(-t / 0.04) * 0.6) * g
def bayan(g=1.0):   # the low tabla drum: a sine that bends up as the palm presses
    m = int(0.4 * SR); t = T(m); f = 78 * (1 + 0.35 * (1 - np.exp(-t * 9)))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.2) * g
def dayan(n=67, g=1.0):   # the high tabla drum "na": ringing partials + a finger click
    m = int(0.25 * SR); t = T(m); f = S.midi(n)
    y = sum(a * np.sin(2 * np.pi * f * r * t) * np.exp(-t / d) for r, a, d in [(1, 1, 0.12), (2.0, 0.5, 0.07), (3.0, 0.3, 0.05), (4.1, 0.15, 0.03)])
    return (y + S.bp(rng.standard_normal(m), 2500, 8000) * np.exp(-t / 0.006) * 0.4) * g


def music():
    out = np.zeros(N)
    # INTRO: his real pages; a low pulse that tightens toward "stars!", then the wall lands on a hit
    v0 = next(l for l in TM["lines"] if l["id"] == "v00")["words"]
    for k in range(int(H0 / BEAT)):
        tb = k * BEAT; put(out, kick(0.45 + 0.03 * k, 0.28), tb); put(out, S.lp(S.saw(S.midi(28), int(BEAT * SR)), 180) * 0.22, tb)
        if k % 2: put(out, hat(0.05), tb)
    put(out, pad([40, 47, 52], H0, 0.12, 700), 0.0)
    put(out, S.sfx("riser", length=1.8), H0 - 1.85, 0.45)
    out[int((H0 - 0.1) * SR):int(H0 * SR)] *= 0.0
    put(out, kick(1.2, 0.5), H0); put(out, S.sfx("subImpact"), H0, 0.7)
    # SLOP ERA: the stock "uplifting AI" bed, a bit too shiny on purpose
    for b in range(int(H0 / BAR), int(TURN / BAR) + 1):
        t0 = max(b * BAR, H0)
        ch = [[60, 64, 67, 71], [57, 60, 64, 67], [53, 57, 60, 64], [55, 59, 62, 65]][b % 4]
        put(out, pad(ch, BAR + 0.3, 0.16, 2600), t0)
        for k in range(8): put(out, bell(ch[k % 4] + 12, 0.5, 0.05), t0 + k * BEAT / 2)
        for k in range(4):
            put(out, kick(0.6, 0.25), t0 + k * BEAT)
            if k in (1, 3): put(out, clap(0.35), t0 + k * BEAT)
    out[int((TURN - 0.12) * SR):] = 0.0
    # THE GROOVE: E dorian funk from the turn to the end (Em7 / A7 per bar)
    EM, A7 = (40, [64, 67, 71, 74]), (45, [61, 64, 67, 69])
    bass16 = {0: 0, 3: 0, 6: 12, 8: 0, 10: 7, 11: 10, 14: 12}
    tl, cta = SEC["taste"]["t0"], SEC["cta"]["t0"]
    put(out, kick(1.2, 0.5), TURN); put(out, S.sfx("subImpact"), TURN, 0.8)
    for bar in range(int(TURN / BAR), int(TOTAL / BAR) + 1):
        t0 = bar * BAR
        root, ch = (EM if bar % 2 == 0 else A7)
        thin = tl <= t0 < cta
        for st in range(16):
            ts = t0 + st * BEAT / 4
            if ts < TURN or ts >= TOTAL - 0.4: continue
            if st % 4 == 0: put(out, kick(0.85 if not thin else 0.5), ts)
            if st in (4, 12) and not thin: put(out, snare(0.32), ts)
            put(out, hat(0.07 if st % 2 else 0.11), ts)
            if st in bass16:
                m = int(BEAT / 4 * SR * 1.6); put(out, S.lp(S.saw(S.midi(root - 12 + bass16[st]), m), 420) * np.exp(-T(m) / 0.09) * 0.42, ts)
            if st in (2, 6, 10, 13) and not thin: put(out, stab(ch, 0.11, 0.12), ts)
        if t0 + BAR <= TURN: continue
        put(out, pad(ch, BAR + 0.3, 0.07, 1100), max(t0, TURN))   # a quiet sustained bed under the funk, so no gap is silent
        for k in (0, 5): put(out, bayan(0.18), t0 + k * BEAT / 2)
        for k, n in ((2, 71), (3, 76), (6, 71), (7, 74)): put(out, dayan(n, 0.07), t0 + k * BEAT / 2)
        if bar % 4 == 3: put(out, bayan(0.3), t0 + 3.5 * BEAT); put(out, dayan(79, 0.1), t0 + 3.75 * BEAT)   # a small dhol-ish turn
    # the story video's four steps: a note per step, climbing
    for st, n in zip(STEPS, [76, 79, 83, 88]): put(out, bell(n, 1.2, 0.12), VSTART + st)
    # cta: resolve to E minor 9 on DESIGN turning white
    dz = wordT("v13", r"^DESIGN", 56.63); put(out, pad([52, 59, 62, 66, 71], TOTAL - dz, 0.22, 2200), dz)
    for at_, n in [(0.45, 83), (0.57, 86), (0.69, 90)]: put(out, bell(n, 1.4, 0.09), dz + at_)
    end = int((TOTAL - 0.8) * SR); out[end:] *= np.linspace(1, 0, N - end) ** 2
    return out


def sfx():
    out = np.zeros(N); fx = lambda k, L=None, p=1.0: S.sfx(k, length=L, pitch=p)  # noqa: E731
    w = wordT
    # HOOK: the five screens land (impact when the 0.24 s landing ends), a shimmer on the sparkle, the push
    for i, lt in enumerate(LAND):
        at = max(0.0, lt + 0.22); put(out, thud(0.55 if i == 0 else 0.4), at); put(out, fx("glass", None, 1.0 + 0.08 * i), at, 0.06)
    put(out, fx("shimmer", 1.2), H0, 0.25)
    put(out, fx("whoosh", 1.0), H0 + 1.45, 0.35)
    # INTRO: the box on his name, the page slide on "skill", the lens on the stars, a tick per word of the number
    put(out, fx("mechClick"), w("v00", r"^Damir", 0.87), 0.45)
    put(out, fx("whoosh", 0.7), w("v00", r"^skill", 2.35) - 0.3, 0.4); put(out, thud(0.4), w("v00", r"^skill", 2.35) + 0.1)
    st = w("v00", r"^8,000", 4.37); put(out, fx("glass"), st - 0.1, 0.18)
    for k in range(10): put(out, tone(1600 + 90 * k, 0.04, 0.07), st + k * 0.05)
    # SLOP: the three red tags, the tag on our own headline, the record stop, the drop
    for re_, fb in ((r"^Purple", 2.55), (r"^glow", 3.4), (r"^emoji", 4.15)):
        put(out, fx("mechClick"), w("v02", re_, fb), 0.4); put(out, fx("errorBlip"), w("v02", re_, fb) + 0.02, 0.22)
    bh = w("v02", r"^bhai", 5.15); put(out, fx("mechClick"), bh - 0.1, 0.5); put(out, fx("errorBlip"), bh - 0.08, 0.3)
    put(out, fx("scratch"), TURN - 0.4, 0.5)
    put(out, fx("whoosh", 0.7), TURN + 0.05, 0.3); put(out, fx("fixChime"), TURN + 0.5, 0.3)
    # every section cut lands on a low hit and a soft air move
    for sc in TM["sections"][2:]: put(out, thud(0.3), sc["t0"]); put(out, fx("whoosh", 0.4), sc["t0"] - 0.12, 0.14)
    # UNSLOP: the lens drops twice
    put(out, fx("glass"), w("v03", r"^Claude", 7.56) - 0.1, 0.14); put(out, fx("glass", None, 1.12), w("v03", r"^open", 10.45) - 0.2, 0.14)
    # AUDIT: six spacing measurements tick in, then a tag per sign, then the list rows
    sp = w("v04", r"^spacing", 12.2)
    for i in range(6): put(out, tone(1500 + 120 * i, 0.05, 0.1), sp + i * 0.05)
    for re_, fb in ((r"^color", 12.75), (r"^icons", 13.18), (r"^copy", 13.6), (r"^type", 14.27)): put(out, fx("mechClick"), w("v04", re_, fb) - 0.05, 0.35)
    ls = w("v04", r"^list", 16.04); put(out, fx("paper"), ls - 0.25, 0.3)
    for i in range(6): put(out, tone(900, 0.04, 0.06), ls - 0.05 + i * 0.06)
    # DIRECTION: the lens, the five lines of our direction
    put(out, fx("glass"), SEC["direction"]["t0"] + 0.2, 0.12); dc = w("v05", r"^direction", 18.75)
    for i in range(5): put(out, fx("mechClick"), dc - 0.15 + i * 0.22, 0.16)
    # RUN / STORY: the video starts, the shrink to a file, the terminal line, the lens
    put(out, fx("mechClick"), VSTART, 0.4); put(out, fx("riser", 1.0), VSTART - 1.0, 0.12)
    put(out, fx("whoosh", 0.6), VSTART + VLEN + 0.3, 0.3); put(out, fx("typing", 0.6), VSTART + VLEN + 0.5, 0.25)
    put(out, fx("glass"), w("v08", r"^Playwright", 33.9) - 0.2, 0.14)
    # STACKS / STARS / LICENSE: one lens each, a tick per stack, a bell on 1.2k, the credit line
    put(out, fx("glass"), SEC["stacks"]["t0"] + 0.3, 0.12)
    for re_, fb in ((r"^React", 37.07), (r"^Vue", 37.56), (r"^Svelte", 37.91), (r"^Tailwind", 38.47), (r"^HTML", 39.94)): put(out, tone(1320, 0.06, 0.07), w("v09", re_, fb))
    put(out, fx("glass"), w("v11", r"^License", 46.58) + 0.3, 0.12); put(out, fx("glass", None, 1.1), w("v11", r"^Damir", 48.84) - 0.4, 0.12)
    put(out, fx("magLock"), w("v11", r"^credit", 50.52) - 0.2, 0.3)
    # TASTE: the cursor clicks, the last tag; CTA: the box turns white
    rv = w("v12", r"^review", 54.68); put(out, fx("mechClick"), rv - 0.1, 0.5); put(out, fx("errorBlip"), rv, 0.2)
    dz = w("v13", r"^DESIGN", 56.63); put(out, fx("mechClick"), dz, 0.4); put(out, fx("fixChime"), dz + 0.5, 0.45)
    out[int((TURN - 0.12) * SR):int(TURN * SR)] = 0.0                        # the dead stop before the drop
    return out


def voices():
    out = np.zeros(N)
    for l in VO:
        y, sr = sf.read(ROOT / "audio/out" / f"{l['id']}.wav", dtype="float64")
        if y.ndim > 1: y = y.mean(1)
        put(out, resample_poly(y, SR, sr) if sr != SR else y, l["start"])
    return out


def main():
    mus, fx, vox = music(), sfx(), voices()
    env = S.envelope(vox, 0.01, 0.3); duck = 1 - 0.7 * np.clip(env / 0.08, 0, 1)
    out = ROOT / "public/audio/mix_unslop.wav"; out.parent.mkdir(parents=True, exist_ok=True)
    I, tp = master(vox * 1.0 + mus * 0.42 * duck + fx * 0.6, out)
    I2, _ = master(mus * 0.6 + fx * 0.6, ROOT / "public/audio/music_only_unslop.wav")
    print(f"-> {out}  {TOTAL:.2f} s  {I:.1f} LUFS  peak {tp:.1f} dBFS  | music only {I2:.1f} LUFS")


if __name__ == "__main__":
    main()
