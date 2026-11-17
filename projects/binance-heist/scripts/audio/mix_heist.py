"""$6.34B BINANCE BREACH sound: an original dark cyber score (synthesized here, 120 BPM, C minor, bar 1 at 0.0 s) with a
quiet tabla layer (bayan + dayan, synthesized), Liam's 11 lines, and SFX on the director's own event times
(src/reel/Director.tsx and src/compositions/Heist.tsx: the phone buzz, the glitch, the vault blast, the keyboard, the
alert, the call windows, the zip drop, the network pulses, the myth stamp, the BTC counter, the ice, the checklist, SAFE).
The hook: buzz -> glitch -> a 150 ms dead stop -> the vault hit at 1.30 s, the loudest moment of the first 3 s.
Music ducked under the voice; master -14 LUFS / -1.5 dBTP (bridge-exe master()).
Writes public/audio/mix_heist.wav (+ music_only_heist.wav) and audio/out/beats_heist.json.
    python scripts/audio/mix_heist.py
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
rng = np.random.default_rng(20261029)
PROG = [(36, [60, 63, 67]), (32, [56, 60, 63]), (29, [56, 60, 65]), (31, [55, 59, 62])]   # Cm Ab Fm G


def wordT(line, pat, fb):   # same lookup as Director.wordT: picture and sound share the word times
    l = next((l for l in TM["lines"] if l["id"] == line), None)
    return next((w["t0"] for w in (l["words"] if l else []) if re.search(pat, w["w"])), fb)
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
def pad(notes, L, g=1.0, cut=1200):
    m = int(L * SR); x = sum(S.saw(S.midi(n), m, detune=0.25) for n in notes) / len(notes)
    return S.lp(x, cut) * np.minimum(1, T(m) / 0.4) * np.clip((L - T(m)) / 0.3, 0, 1) * g
def pluck(n, L=0.18, g=1.0, cut=2600):
    m = int(L * SR); return S.lp(S.saw(S.midi(n), m), cut) * np.exp(-T(m) / (L * 0.35)) * g
def tone(f, L, g=1.0):
    m = int(L * SR); return np.sin(2 * np.pi * f * T(m)) * np.exp(-T(m) / (L * 0.4)) * g
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
def buzz(L, g=1.0):   # a phone vibrating on a desk
    m = int(L * SR); t = T(m); am = 0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 28 * t))
    return S.lp(np.sign(np.sin(2 * np.pi * 150 * t)) * am, 700) * np.minimum(1, t / 0.01) * np.clip((L - t) / 0.02, 0, 1) * g
def coins(L, dens, g=1.0):   # a rush of small metal: inharmonic pings at a density per second
    out = np.zeros(int(L * SR)); k = int(L * dens)
    for _ in range(k):
        m = int(0.07 * SR); t = T(m); f = rng.uniform(2400, 6200)
        p = (np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * f * 2.76 * t)) * np.exp(-t / 0.025) * rng.uniform(0.3, 1)
        put(out, p, rng.uniform(0, L - 0.07))
    return out * g
def glitch(L, g=1.0):   # bit-crushed noise stutters gated on 1/32 notes
    m = int(L * SR); t = T(m); x = np.round(rng.standard_normal(m) * 3) / 3
    gate = (np.floor(t / (BEAT / 8)) % 3 != 1).astype(float)
    hold = np.repeat(x[::40], 40)[:m]
    return S.bp(hold, 300, 6000) * gate * g
def crackle(L, g=1.0):   # ice spreading: fine clicks getting denser
    out = np.zeros(int(L * SR))
    for k in range(int(L * 60)):
        at = L * (k / (L * 60)) ** 0.6; m = int(0.012 * SR)
        put(out, S.hp(rng.standard_normal(m), 3000) * np.exp(-T(m) / 0.003) * rng.uniform(0.2, 1), at)
    return out * g


def music():
    out = np.zeros(N)
    h, rp, my, fr, at, ls, cta = (SEC[k] for k in ("hook", "report", "myth", "frozen", "attribution", "lesson", "cta"))
    # hook: a sub drone under the buzz, the dead stop 1.15-1.30, the blast, a minor stab tail, then the desk drone
    put(out, pad([48, 51, 55], 1.15, 0.22, 500), 0.0)
    put(out, S.sfx("subImpact"), 1.30, 1.0); put(out, kick(1.2, 0.5), 1.30)
    put(out, pad([48, 51, 55, 60], 1.7, 0.32, 2200), 1.30)
    put(out, pad([36, 48, 51], h["t1"] - 2.95 + 0.3, 0.2, 600), 2.95)
    for b in range(int(TOTAL / BAR) + 1):
        t0 = b * BAR
        if t0 < 4.0 or t0 >= cta["t0"]: continue
        root, ch = PROG[b % 4]
        ice = fr["t0"] <= t0 < at["t0"]             # frozen: the groove thins, only kick on 1
        sparse = at["t0"] <= t0 < ls["t0"]          # attribution: half-time
        put(out, pad(ch, BAR + 0.3, 0.13, 900 if ice else 1300), t0)
        for k in range(4):
            tb = t0 + k * BEAT
            if my["t0"] - 0.1 <= tb < my["t0"] + 0.55: continue   # "Ruko —": the beat stops for the scratch
            if not ice or k == 0: put(out, kick(0.85 if not sparse or k in (0, 2) else 0, 0.32), tb)
            m = int(BEAT * SR); put(out, S.lp(S.saw(S.midi(root - 12), m), 320) * np.minimum(1, T(m) / 0.12) ** 1.5 * 0.3, tb)
            if k in (1, 3) and not ice: put(out, snare(0.3 if not sparse else 0.18), tb)
            if not ice: put(out, hat(0.08), tb + BEAT / 2); put(out, hat(0.04), tb + BEAT / 4)
        for k in (0, 5): put(out, bayan(0.22), t0 + k * BEAT / 2)            # tabla, quiet, under everything
        for k, n in ((2, 67), (3, 72), (6, 67), (7, 70)): put(out, dayan(n, 0.09), t0 + k * BEAT / 2)
        if t0 >= rp["t0"]:
            for k in range(8): put(out, pluck(ch[k % 3] + (12 if k % 4 == 3 else 0), 0.16, 0.06), t0 + k * BEAT / 2)
    # lesson: a lift (riser into it, dead stop 150 ms, a hit on the first item)
    l0 = ls["t0"]; put(out, S.sfx("riser", length=1.6), l0 - 1.75, 0.55); put(out, kick(1.1, 0.5), l0); put(out, pad([60, 63, 67, 72], 2.2, 0.25, 2400), l0)
    # cta: resolve to C major on SAFE
    c = cta["t0"]; put(out, kick(1.0, 0.5), c); put(out, pad([48, 55, 60, 64], TOTAL - c, 0.3, 1800), c)
    sw = wordT("v11", r"^SAFE", c + 0.8)
    for at_, n in [(0, 72), (0.12, 76), (0.24, 79), (0.36, 84)]: put(out, tone(S.midi(n), 1.4, 0.12), sw + at_)
    out[int((l0 - 0.15) * SR):int(l0 * SR)] *= 0.05
    end = int((TOTAL - 1.0) * SR); out[end:] *= np.linspace(1, 0, N - end) ** 2
    return out


def sfx():
    out = np.zeros(N); fx = lambda k, L=None, p=1.0: S.sfx(k, length=L, pitch=p)  # noqa: E731
    h, rp, jn, sp, sb, my, dr, fr, at, ls, cta = (SEC[k] for k in ("hook", "report", "june", "sept", "springboard", "myth", "drain", "frozen", "attribution", "lesson", "cta"))
    # HOOK — the phone buzzes twice, the invite pings, it glitches, stop, the vault blows, coins rush
    put(out, buzz(0.34, 0.5), 0.0); put(out, buzz(0.3, 0.45), 0.52)
    put(out, tone(1318.5, 0.25, 0.25), 0.06); put(out, tone(1760, 0.35, 0.22), 0.16)
    put(out, glitch(0.25, 0.35), 0.9); put(out, fx("errorBlip"), 0.9, 0.3)
    put(out, fx("impact"), 1.30, 0.9); put(out, thud(1.0), 1.30); put(out, fx("whoosh", 0.6), 1.25, 0.3)
    put(out, coins(1.55, 90, 0.18), 1.38)
    put(out, fx("whoosh", 0.5), 2.85, 0.25); put(out, fx("alarm"), 3.45, 0.12)      # back at the desk: the recoil
    # REPORT — the panel lands, the lens, the $6.34B counter (bass hit + ticks), the date chips
    r0 = rp["t0"]; put(out, fx("whoosh", 0.5), r0 - 0.15, 0.25); put(out, fx("paper"), r0 + 0.05, 0.35)
    put(out, fx("mechClick"), r0 + 0.1, 0.3); put(out, fx("mechClick"), r0 + 0.6, 0.3)
    put(out, fx("glass"), r0 + 1.0, 0.12)
    six = wordT("v02", r"^\$6\.34B", r0 + 3)
    put(out, fx("subImpact"), six - 0.05, 0.55); put(out, thud(0.7), six - 0.05)
    for k in range(12): put(out, tone(1900 + 60 * k, 0.04, 0.07), six + k * 0.075)
    # JUNE — typing, the download, the alert and the recoil
    j0 = jn["t0"]; put(out, fx("mechClick"), j0 + 0.1, 0.3)
    put(out, fx("typing", 2.0), j0 + 0.2, 0.4); put(out, fx("typing", 1.6), j0 + 2.4, 0.3)
    for k in range(8): put(out, tone(880 + 55 * k, 0.05, 0.05), j0 + 2.3 + k * 0.24)   # the progress bar
    put(out, fx("errorBlip"), j0 + 4.2, 0.5); put(out, fx("alarm"), j0 + 4.25, 0.18); put(out, thud(0.6), j0 + 4.2)
    # SEPT — three call windows pop, they cut out, the zip drops on the desk, the assignment screen
    s0 = sp["t0"]; put(out, fx("mechClick"), s0 + 0.1, 0.3)
    for at_, p in ((0.2, 1.0), (0.9, 1.12), (1.7, 1.26)): put(out, fx("glass", None, p), s0 + at_, 0.1); put(out, tone(660 * p, 0.15, 0.12), s0 + at_)
    put(out, glitch(0.3, 0.2), s0 + 3.3)
    put(out, fx("whoosh", 0.5), s0 + 3.2, 0.3); put(out, thud(0.9), s0 + 3.7); put(out, fx("magLock"), s0 + 3.72, 0.3)
    put(out, fx("errorBlip"), s0 + 3.6, 0.3); put(out, fx("mechClick"), s0 + 3.3, 0.3)
    # SPRINGBOARD — red pulses run the graph
    b0 = sb["t0"]; put(out, fx("whoosh", 0.6), b0 - 0.1, 0.3); put(out, fx("nodeChain", 2.0), b0 + 0.4, 0.3)
    for k in range(12): put(out, fx("dataPulse"), b0 + 0.6 + k * 0.5, 0.18)
    # MYTH — "Ruko —": record scratch, the stamp slams
    m0 = my["t0"]; put(out, fx("scratch"), m0 - 0.1, 0.55); put(out, fx("dhishoom"), m0 + 0.15, 0.8); put(out, thud(1.0), m0 + 0.15)
    # DRAIN — coins pour out, the 18,270 BTC counter
    d0 = dr["t0"]; put(out, fx("whoosh", 0.6), d0 - 0.1, 0.3); put(out, coins(dr["t1"] - d0, 45, 0.12), d0)
    btc = wordT("v07", r"^18,270", d0 + 1.6)
    put(out, fx("subImpact"), btc - 0.05, 0.6)
    for k in range(16): put(out, tone(1700 + 45 * k, 0.04, 0.07), btc + k * 0.075)
    # FROZEN — the ice spreads over the coins, $2.85B locks, the green chip, the lens on "absorb"
    f0 = fr["t0"]; put(out, fx("shimmer", 2.2), f0 + 0.3, 0.3); put(out, crackle(2.1, 0.2), f0 + 0.3)
    put(out, fx("glass", None, 0.8), f0 + 0.35, 0.18)
    frz = wordT("v08", r"^\$2\.85B", f0 + 0.6); put(out, fx("magLock"), frz, 0.45); put(out, thud(0.5), frz)
    put(out, fx("fixChime"), f0 + 3.7, 0.4)
    put(out, fx("whoosh", 0.5), f0 + 3.5, 0.25); put(out, fx("paper"), f0 + 3.6, 0.3); put(out, fx("glass"), f0 + 6.8, 0.1)
    # ATTRIBUTION — two columns land
    a0 = at["t0"]; put(out, fx("whoosh", 0.5), a0 - 0.1, 0.25); put(out, thud(0.7), a0 + 0.3); put(out, fx("mechClick"), a0 + 0.3, 0.35)
    nk = wordT("v09", r"^North$", a0 + 2.4); put(out, thud(0.7), nk); put(out, fx("mechClick"), nk, 0.35)
    # LESSON — three checklist items, the sandbox walls rise, the zip goes in, the seal locks
    l0 = ls["t0"]
    for k, (d0_, n) in enumerate(((0.3, 72), (2.2, 75), (4.0, 79))): put(out, fx("mechClick"), l0 + d0_, 0.35); put(out, tone(S.midi(n), 0.3, 0.16), l0 + d0_)
    put(out, fx("unfold", 0.8), l0 + 0.6, 0.3); put(out, fx("whoosh", 0.8), l0 + 1.4, 0.2); put(out, fx("magLock"), l0 + 2.7, 0.5)
    # CTA — the pill lands on SAFE
    c = cta["t0"]; put(out, fx("whoosh", 0.5), c - 0.1, 0.3)
    sw = wordT("v11", r"^SAFE", c + 0.8); put(out, fx("fixChime"), sw, 0.4)
    for sc in TM["sections"][1:]: put(out, thud(0.35), sc["t0"])              # every section cut lands on a low hit
    put(out, thud(0.4), 2.95)
    out[int(1.15 * SR):int(1.30 * SR)] = 0.0                               # the dead stop before the vault hit
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
    env = S.envelope(vox, 0.01, 0.3); duck = 1 - 0.68 * np.clip(env / 0.08, 0, 1)
    mus[int(1.15 * SR):int(1.30 * SR)] = 0.0
    out = ROOT / "public/audio/mix_heist.wav"; out.parent.mkdir(parents=True, exist_ok=True)
    I, tp = master(vox * 1.0 + mus * 0.42 * duck + fx * 0.62, out)
    I2, tp2 = master(mus * 0.6 + fx * 0.6, ROOT / "public/audio/music_only_heist.wav")
    (ROOT / "audio/out/beats_heist.json").write_text(json.dumps({"bpm": 120, "beat": BEAT, "bar1": 0.0, "total": TOTAL, "beats": [round(i * BEAT, 2) for i in range(int(TOTAL / BEAT) + 1)], "hook_hit": 1.30}, indent=1), encoding="utf-8")
    print(f"-> {out}  {TOTAL:.2f} s  {I:.1f} LUFS  peak {tp:.1f} dBFS  | music only {I2:.1f} LUFS")


if __name__ == "__main__":
    main()
