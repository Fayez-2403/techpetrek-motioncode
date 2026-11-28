"""Berth 42 mix: an original 1930s-cartoon score (tuba oompah, pizzicato, harmonium lead, dholak, glockenspiel, a train
chug at night) arranged by the voice's scenes, plus SFX placed from the picture's own events (film.shots.events()),
the voice on top, music ducked under it, mastered to -14 LUFS / TP -2.5 (square-ish reeds get a 15 kHz low-pass).

    python scripts/audio/mix_reel.py
"""
import json, pathlib, subprocess, sys
import numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt

ROOT = pathlib.Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))
from film import shots as SH                      # noqa: E402
from film.engine import S, E, P, TOTAL, LINES, SUFFIX     # noqa: E402

SR = 44100
N = int(TOTAL * SR) + SR
rng = np.random.default_rng(42)


def bp(x, lo, hi, o=2): return sosfilt(butter(o, [lo, hi], "band", fs=SR, output="sos"), x)
def lp(x, f, o=2): return sosfilt(butter(o, f, "low", fs=SR, output="sos"), x)
def hp(x, f, o=2): return sosfilt(butter(o, f, "high", fs=SR, output="sos"), x)


def env(n, a=0.002, d=0.2):
    t = np.arange(n) / SR
    e = np.exp(-t / d)
    k = int(a * SR)
    if k:
        e[:k] *= np.linspace(0, 1, k)
    return e


def put(buf, x, t, g=1.0):
    i = int(t * SR)
    if i < 0:
        x, i = x[-i:], 0
    j = min(len(buf), i + len(x))
    if j > i:
        buf[i:j] += x[:j - i] * g


def tone(f, dur, d=0.3, a=0.002):
    n = int(dur * SR)
    t = np.arange(n) / SR
    return np.sin(2 * np.pi * f * t) * env(n, a, d)


def noise(dur):
    return rng.standard_normal(int(dur * SR))


def sweep(f0, f1, dur, d=None, shape="sine"):
    n = int(dur * SR)
    f = np.geomspace(f0, f1, n)
    ph = 2 * np.pi * np.cumsum(f) / SR
    w = np.sin(ph) if shape == "sine" else np.sign(np.sin(ph)) * 0.5
    return w * (env(n, 0.005, d) if d else np.sin(np.pi * np.linspace(0, 1, n)))


mf = lambda m: 440 * 2 ** ((m - 69) / 12)


# ---------------- instruments ----------------
def tuba(m, dur):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = mf(m)
    w = sum(np.sin(2 * np.pi * f * k * t) / k ** 1.2 for k in range(1, 7))
    a = np.minimum(1, t / 0.025) * np.exp(-t / (dur * 0.7))
    return lp(w * a, 900) * 0.5


def pizz(m, d=0.16):
    n = int(0.35 * SR)
    t = np.arange(n) / SR
    f = mf(m)
    w = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(4 * np.pi * f * t) + 0.12 * np.sin(6 * np.pi * f * t)
    return w * env(n, 0.001, d) * 0.4


def reed(m, dur, vib=5.2):
    """Harmonium: odd-heavy reed tone, slow attack, slight vibrato."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = mf(m) * (1 + 0.004 * np.sin(2 * np.pi * vib * t))
    ph = 2 * np.pi * np.cumsum(f) / SR
    w = np.sin(ph) + 0.5 * np.sin(3 * ph) + 0.3 * np.sin(5 * ph) + 0.18 * np.sin(2 * ph)
    a = np.minimum(1, t / 0.08) * np.minimum(1, (dur - t) / 0.12)
    return lp(w * a, 3200) * 0.22


def glock(m):
    return sum(tone(mf(m) * k, 1.2, d, 0.001) * g for k, d, g in ((1, 0.8, 0.5), (2.76, 0.3, 0.2), (5.4, 0.12, 0.08)))


def dhol_low():
    n = int(0.4 * SR)
    t = np.arange(n) / SR
    f = 120 * np.exp(-t * 9) + 70
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.001, 0.16) * 0.9


def dhol_high():
    return add(bp(noise(0.08), 900, 3500) * env(int(0.08 * SR), 0.0005, 0.02) * 0.7, tone(420, 0.1, 0.04) * 0.3)


def add(*xs):
    o = np.zeros(max(len(x) for x in xs))
    for x in xs:
        o[:len(x)] += x
    return o


def chug():
    return hp(noise(0.12), 1800) * env(int(0.12 * SR), 0.004, 0.04) * 0.35


# ---------------- SFX ----------------
def whoosh(d=0.3):
    n = int(d * SR)
    x = noise(d)
    out = np.zeros(n)
    for i in range(0, n, 512):
        f = 500 + 3000 * i / n
        seg = x[i:i + 1024]
        out[i:i + len(seg)] += bp(seg, f, f * 1.8)[:len(out[i:i + len(seg)])] * 0.5
    return out * np.sin(np.pi * np.linspace(0, 1, n)) * 1.4


def slap():
    return add(bp(noise(0.06), 600, 5000) * env(int(0.06 * SR), 0.0003, 0.015) * 1.6, tone(140, 0.2, 0.05) * 0.9)


def stamp():
    return add(tone(70, 0.35, 0.09) * 1.3, bp(noise(0.08), 300, 3000) * env(int(0.08 * SR), 0.0005, 0.02) * 1.2)


def clunk():
    return add(tone(95, 0.5, 0.14) * 1.2, bp(noise(0.1), 400, 2500) * env(int(0.1 * SR), 0.0005, 0.03),
               tone(620, 0.4, 0.12) * 0.3, tone(930, 0.3, 0.08) * 0.2)


def click():
    return add(bp(noise(0.02), 2000, 8000) * env(int(0.02 * SR), 0.0002, 0.004), tone(1800, 0.06, 0.015) * 0.3)


def boing():
    n = int(0.6 * SR)
    t = np.arange(n) / SR
    f = 200 + 130 * np.sin(2 * np.pi * 10 * t) * np.exp(-t * 5)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.002, 0.3) * 0.7


def spring_fx():
    return add(boing() * 0.8, sweep(300, 1400, 0.25, 0.12) * 0.4, tone(1046, 0.4, 0.2) * 0.3)


def bell(f=1046.5):
    return add(*[tone(f * m, 1.6, d, 0.001) * g for m, d, g in [(1, 0.9, 0.6), (2.76, 0.45, 0.25), (5.4, 0.2, 0.12)]])


def scratch(d=0.8):
    n = int(d * SR)
    x = bp(noise(d), 2500, 7500) * 0.35
    a = 0.5 + 0.5 * np.sin(2 * np.pi * 11 * np.arange(n) / SR) ** 2
    return x * a * np.minimum(1, (d - np.arange(n) / SR) / 0.1)


def crowd(d=1.2, rise=True):
    n = int(d * SR)
    x = sum(bp(noise(d), 200 + 140 * k, 600 + 200 * k) for k in range(4)) * 0.25
    a = np.linspace(0.2, 1, n) if rise else np.sin(np.pi * np.linspace(0, 1, n))
    return x * a


def rewind_fx(d=0.7):
    return add(sweep(1800, 200, d, None, "square") * 0.25, hp(noise(d), 2000) * np.linspace(1, 0.2, int(d * SR)) * 0.25)


def tick_fast(d=1.4):
    o = np.zeros(int(d * SR))
    for i in range(int(d / 0.07)):
        put(o, bp(noise(0.02), 3000, 7000) * env(int(0.02 * SR), 0.0003, 0.005), i * 0.07, 0.8)
    return o


def train_whistle(d=1.1):
    n = int(d * SR)
    t = np.arange(n) / SR
    a = np.minimum(1, t / 0.06) * np.minimum(1, (d - t) / 0.3)
    w = sum(np.sin(2 * np.pi * f * t * (1 - 0.01 * t)) for f in (587, 740, 880)) / 3
    return (w + 0.15 * bp(noise(d), 500, 3000)[:n]) * a * 0.5


def chugging(d=3.0):
    o = np.zeros(int(d * SR))
    for i in range(int(d / 0.25)):
        put(o, chug(), i * 0.25 * (1 - 0.004 * i), 1.0 if i % 2 == 0 else 0.6)
    return o


def sand(d=2.5):
    n = int(d * SR)
    return hp(noise(d), 4000) * 0.15 * np.minimum(1, np.arange(n) / SR / 0.2) * np.minimum(1, (d - np.arange(n) / SR) / 0.2)


def teleprinter(d=1.0):
    o = np.zeros(int(d * SR))
    for i in range(int(d / 0.055)):
        put(o, add(bp(noise(0.02), 1500, 5000) * env(int(0.02 * SR), 0.0003, 0.006), tone(160, 0.03, 0.01) * 0.4), i * 0.055, 0.9)
    return o


def snore(d=1.6):
    n = int(d * SR)
    t = np.arange(n) / SR
    return lp(noise(d), 500) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.9 * t)) ** 2 * 0.5


def slide_whistle(d=0.55):
    return sweep(1500, 420, d, None) * 0.4


def slurp():
    return bp(noise(0.5), 600, 2500) * np.sin(np.pi * np.linspace(0, 1, int(0.5 * SR))) ** 2 * 0.5


def gallop(d=1.6):
    o = np.zeros(int(d * SR))
    for i in range(int(d / 0.36)):
        for k, dt in enumerate((0, 0.09, 0.17)):
            put(o, add(tone(260 - k * 30, 0.06, 0.02) * 0.6, bp(noise(0.03), 800, 3000) * env(int(0.03 * SR), 0.0003, 0.008)), i * 0.36 + dt)
    return o


FX = {"cut_tick": lambda: add(pizz(74, 0.07) * 1.4, bp(noise(0.025), 1500, 6000) * env(int(0.025 * SR), 0.0002, 0.005) * 1.4, tone(160, 0.08, 0.025) * 0.8),
      "whip_hit": lambda: add(tone(90, 0.25, 0.06) * 1.2, bp(noise(0.04), 800, 5000) * env(int(0.04 * SR), 0.0002, 0.01) * 1.2),
      "whoosh": whoosh, "slide": lambda: whoosh(0.35) * 0.7, "slap": slap, "stamp": stamp,
      "tuba_hit": lambda: add(tuba(38, 0.6) * 1.6, tuba(50, 0.5)), "glint": lambda: tone(2637, 0.4, 0.15) * 0.4,
      "steps": lambda: add(*[np.pad(tone(110, 0.08, 0.03), (int(i * 0.16 * SR), 0)) for i in range(3)]),
      "book": lambda: bp(noise(0.25), 400, 3000) * np.sin(np.pi * np.linspace(0, 1, int(0.25 * SR))) * 0.6,
      "shock_sting": lambda: add(reed(74, 0.6) * 2, reed(78, 0.6) * 1.6, reed(81, 0.6) * 1.4, tuba(38, 0.6)),
      "rewind": rewind_fx, "clock_bell": lambda: bell(880), "crowd_roar": lambda: crowd(1.2),
      "nib_hit": lambda: add(stamp() * 1.2, slap(), tone(55, 0.5, 0.2) * 0.8), "scratch": scratch,
      "crowd_cheer": lambda: crowd(1.6, rise=False), "gallop": gallop, "clunk": clunk,
      "tap": lambda: add(tone(300, 0.08, 0.03), click()), "click": click, "boing": boing, "slide_whistle": slide_whistle,
      "slurp": slurp, "tick_fast": tick_fast, "train_whistle": train_whistle, "chug": chugging, "sand": sand,
      "spring": spring_fx, "teleprinter": teleprinter, "marker": lambda: scratch(0.25),
      "beep": lambda: add(tone(1320, 0.12, 0.08), np.pad(tone(1320, 0.12, 0.08), (int(0.18 * SR), 0))),
      "pop": lambda: add(tone(880, 0.12, 0.05) * 0.7, tone(1320, 0.08, 0.03) * 0.3), "snore": snore,
      "flip": lambda: bp(noise(0.18), 900, 5000) * np.sin(np.pi * np.linspace(0, 1, int(0.18 * SR))) * 0.8,
      "brand_sting": lambda: add(glock(93) * 0.6, np.pad(glock(97), (int(0.08 * SR), 0)) * 0.5),   # high only: never on the words
      "brand_tail": lambda: add(glock(81), np.pad(glock(85), (int(0.08 * SR), 0)), reed(62, 1.4) * 1.2, reed(66, 1.4), tuba(38, 1.2))}

ev = SH.events()
(ROOT / "film" / f"events{SUFFIX}.json").write_text(json.dumps([{"t": round(t, 3), "sfx": n, "gain": g} for t, n, g in ev], indent=1))
sfx = np.zeros(N)
for t, n, g in ev:
    put(sfx, FX[n](), t, g)

# ---------------- score: arranged by the voice's scenes, 120 BPM ----------------
BPM = 120
BEAT = 60 / BPM
mus = np.zeros(N)
MINOR = [[50, 53, 57], [46, 50, 53], [48, 52, 55], [45, 49, 52]]       # Dm Bb C A  (comic tension)
MAJOR = [[50, 54, 57], [55, 59, 62], [57, 61, 64], [50, 54, 57]]       # D G A D    (resolution)
sec = [("hook", 0.0, S("n02")), ("raat", S("n02"), S("n05")), ("rush", S("n05"), S("n11")), ("taala", S("n11"), S("n13")),
       ("twist", S("n13"), S("n16")), ("ghadi", S("n16"), S("n19")), ("aaj", S("n19"), S("n21")), ("end", S("n21"), TOTAL)]
mel_minor = [62, 65, 64, 62, 60, 62, 57, 58]        # a little Bhairavi-ish turn
mel_major = [66, 69, 71, 69, 66, 64, 62, 64]
for name, a, b in sec:
    nb = int((b - a) / BEAT) + 1
    for k in range(nb):
        t = a + k * BEAT
        if t >= b:
            break
        bar = k // 4
        prog_ = MAJOR if name in ("ghadi", "aaj", "end") else MINOR
        ch = prog_[bar % 4]
        if name == "hook":
            if k % 2 == 0:
                put(mus, tuba(ch[0] - 12, BEAT * 0.9), t, 0.5)
            put(mus, reed(ch[2] + 12, BEAT), t, 0.12)
        elif name in ("raat", "aaj"):
            if k % 4 == 0:
                put(mus, reed(ch[0] + 12, BEAT * 4), t, 0.5)
                put(mus, reed(ch[1] + 12, BEAT * 4), t, 0.35)
            if k % 2 == 0:
                put(mus, tuba(ch[0] - 12, BEAT * 0.8), t, 0.35)
            put(mus, reed((mel_minor if name == "raat" else mel_major)[k % 8] + 12, BEAT * 0.95), t, 0.32)
            for e8 in range(2):
                put(mus, chug(), t + e8 * BEAT / 2, 0.9 if e8 == 0 else 0.5)
        elif name in ("rush", "taala"):
            put(mus, tuba(ch[0] - 12 if k % 2 == 0 else ch[2] - 12, BEAT * 0.5), t, 0.7)    # oom
            put(mus, pizz(ch[1] + 12), t + BEAT / 2, 0.8)                                  # pah
            put(mus, pizz(ch[2] + 12), t + BEAT / 2 + 0.01, 0.6)
            put(mus, dhol_low(), t, 0.6 if k % 2 == 0 else 0.35)
            put(mus, dhol_high(), t + BEAT * 0.5, 0.45)
            if k % 4 == 3:
                put(mus, dhol_high(), t + BEAT * 0.75, 0.35)
            if name == "rush" and k % 2 == 0:
                put(mus, reed(mel_minor[(k // 2) % 8] + 12, BEAT * 1.9), t, 0.3)
        elif name == "twist":
            if k % 2 == 0:                                                # a low reed pad: the twist never drops to silence
                put(mus, reed(ch[0], BEAT * 2.1), t, 0.28)
            if t < S("n14"):
                put(mus, pizz(ch[0] + 12), t, 0.7)
                put(mus, tuba(ch[0] - 12, BEAT * 0.5), t, 0.5)
            elif t < S("n15"):
                if k % 4 == 0:
                    put(mus, reed(ch[0] + 12, BEAT * 3.8), t, 0.35)       # lonely: one reed note
            else:
                put(mus, reed(ch[0] + 12, BEAT * 0.95), t, 0.25)
                for e8 in range(2):
                    put(mus, chug(), t + e8 * BEAT / 2, 0.8)
        elif name == "ghadi":
            put(mus, glock(mel_major[k % 8] + 12), t, 0.22)
            put(mus, pizz(ch[0] + 12), t + BEAT / 2, 0.6)
            if k % 2 == 0:
                put(mus, tuba(ch[0] - 12, BEAT * 0.8), t, 0.45)
        elif name == "end":
            if t < S("n22"):
                put(mus, pizz(ch[0] + 12), t, 0.6)
                put(mus, glock(mel_major[k % 8] + 12), t + BEAT / 2, 0.18)
# the final chord rings to the last frame (no silent tail)
tb = P("n22", 0, edge="t1") + 0.14                 # after "Tech pe Trek:", never on it
for m in (50, 54, 57, 62):
    put(mus, reed(m + 12, TOTAL - tb + 0.2), tb, 0.32)
put(mus, tuba(38, 1.6), tb, 0.6)
put(sfx, FX["brand_tail"](), tb, 0.55)

# ---------------- voice, duck, master ----------------
vo, _ = sf.read(ROOT / f"public/audio/vo{SUFFIX}.wav", dtype="float64")
v = np.zeros(N)
v[:len(vo)] = vo
e = np.abs(v)
k = int(0.05 * SR)
e = np.convolve(e, np.ones(k) / k, "same")
duck = 1 - 0.6 * np.clip(e / 0.02, 0, 1)
duck = np.convolve(duck, np.ones(int(0.12 * SR)) / int(0.12 * SR), "same")
clear = np.ones(N)                                  # the brand words sit almost dry
clear[int((S("n22") - 0.1) * SR):int((P("n22", 0, edge="t1") + 0.12) * SR)] = 0.15
clear = np.convolve(clear, np.ones(int(0.08 * SR)) / int(0.08 * SR), "same")
mix = v * 1.0 + mus * duck * clear * 0.55 + sfx * clear * 0.32
put(mix, glock(93) * 0.09, P("n22", 0, edge="t1") + 0.01)   # one high ting fills the pause after the brand (no silence, no mask)
mix = mix[: int(TOTAL * SR)]
f = int(0.06 * SR)
mix[-f:] *= np.linspace(1, 0, f)
mix = np.tanh(mix / (np.abs(mix).max() + 1e-9) * 2.2) / np.tanh(2.2)
(ROOT / "audio/out").mkdir(parents=True, exist_ok=True)
raw = ROOT / f"audio/out/mix_raw{SUFFIX}.wav"
sf.write(raw, (mix / max(1e-9, np.abs(mix).max()) * 0.9).astype(np.float32), SR, subtype="FLOAT")
out = ROOT / f"public/audio/mix{SUFFIX}.wav"
m = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(raw), "-af", "lowpass=f=15000,loudnorm=I=-14:TP=-2.5:LRA=11:print_format=json",
                    "-f", "null", "-"], capture_output=True, text=True).stderr
j = json.loads(m[m.rindex("{"): m.rindex("}") + 1])
af = (f"lowpass=f=15000,loudnorm=I=-14:TP=-2.5:LRA=11:measured_I={j['input_i']}:measured_TP={j['input_tp']}:"
      f"measured_LRA={j['input_lra']}:measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true")
subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(raw), "-af", af, "-ar", str(SR), "-c:a", "pcm_s16le",
                str(out)], check=True)
chk = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(out), "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True,
                     text=True).stderr
print("mix:", out, "|", [l.strip() for l in chk.splitlines() if l.strip().startswith(("I:", "Peak:"))][-2:], "|", len(ev), "events")
