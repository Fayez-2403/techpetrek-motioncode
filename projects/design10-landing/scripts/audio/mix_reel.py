"""ONE PAGE, 10 UPGRADES (adapted from the 18-repos reel): the soundtrack upgrades with the page (original, synthesized, no samples).
  L0 slop       a bare metronome click on every beat
  L1 reanimate  + kick           L2 motion   + offbeat hats      L3 styles  + bass        L4 paint  + pad
  L5 doodle     + pluck arp      L9 postfx   + the filter opens  L12 cinetic + clap on 2/4  L15 librosa + sub on the 1
  payoff        everything, loudest; total: hold; cta: ring-out
  sfx           ball impacts (dry tick -> weighted thud from L2 -> pitched boing from L14 Openverse), sparkle from L8,
                a name-slam thump + page whoosh on every repo, layer whoosh on EffectCraft, a wipe on motionmaxxing,
                an encode buzz + done chime on FFmpeg, a counter roll on the total, a chime on the CTA
  voice         Liam lines at SCENE_TIMINGS starts, ducking the bed
Master two-pass loudnorm -14 LUFS / -1.5 dBTP -> public/audio/mix.wav; the bed alone -> audio/score_only.wav (librosa check).
    python scripts/audio/mix_reel.py
"""
import json, pathlib, re, subprocess

import numpy as np
import soundfile as sf
from scipy.signal import butter, resample_poly, sosfilt

ROOT = pathlib.Path(__file__).resolve().parents[2]
TM = json.loads((ROOT / "SCENE_TIMINGS.json").read_text(encoding="utf-8"))
EV = json.loads((ROOT / "audio/events.json").read_text(encoding="utf-8"))
SR = 48000; DUR = TM["duration"]; N = int(DUR * SR) + SR; BEAT = 0.5
LV = EV["levels"]
rng = np.random.default_rng(20261120)
def T(n): return np.arange(n) / SR
def bp(x, a, b): return sosfilt(butter(2, [a, min(b, SR * 0.45)], "band", fs=SR, output="sos"), x)
def lp(x, f): return sosfilt(butter(2, f, "low", fs=SR, output="sos"), x)
def hp(x, f): return sosfilt(butter(2, f, "high", fs=SR, output="sos"), x)
def put(buf, x, t, g=1.0, pan=0.0):
    if x.ndim == 1: x = np.stack([x * min(1, 1 - pan), x * min(1, 1 + pan)], 1)
    i = int(round(t * SR))
    if i >= len(buf) or i + len(x) <= 0: return
    a = max(0, -i); j = max(0, i); m = min(len(x) - a, len(buf) - j); buf[j:j + m] += x[a:a + m] * g
def L_at(t): return next((s["L"] for s in LV if s["t0"] <= t < s["t1"]), 19)

def kick(g=1.0):
    n = int(0.32 * SR); t = T(n); f = 46 + 100 * np.exp(-t * 30); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.13) * g
def sub(g=1.0):
    n = int(0.6 * SR); t = T(n); return np.sin(2 * np.pi * 41.2 * t) * np.exp(-t / 0.35) * np.minimum(1, t / 0.01) * g
def hat(g=1.0, o=False):
    n = int((0.12 if o else 0.045) * SR); return hp(rng.standard_normal(n), 7500) * np.exp(-T(n) / (0.04 if o else 0.011)) * g * 0.3
def clap(g=1.0):
    n = int(0.2 * SR); t = T(n); z = bp(rng.standard_normal(n), 900, 4200)
    return z * (sum(np.exp(-np.maximum(t - d, 0) / 0.012) * (t >= d) for d in (0, 0.011, 0.023)) + np.exp(-t / 0.07) * 0.6) * 0.45 * g
def click(g=1.0, f=2400):
    n = int(0.04 * SR); t = T(n); return (np.sin(2 * np.pi * f * t) * np.exp(-t / 0.005)) * g
def tone(midi, L, kind="bass", g=1.0, cut=2200):
    n = int(L * SR); t = T(n); f = 440 * 2 ** ((midi - 69) / 12)
    if kind == "bass":
        x = np.tanh(1.5 * (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(4 * np.pi * f * t))); return lp(x, 900) * np.minimum(1, t / 0.006) * np.exp(-t / 0.3) * g
    if kind == "pluck":
        saw = 2 * ((f * t) % 1) - 1; return lp(saw, cut) * np.exp(-t / 0.09) * np.minimum(1, t / 0.002) * g
    x = sum(np.sin(2 * np.pi * f * k * t + k) / k for k in (1, 2, 3)) * (1 + 0.004 * np.sin(2 * np.pi * 5 * t))
    return lp(x, cut) * np.minimum(1, t / 0.4) * np.minimum(1, np.maximum(L - t, 0) / 0.5) * g
PROG = [(45, [57, 60, 64]), (41, [57, 60, 65]), (48, [55, 60, 64]), (43, [55, 59, 62])]   # Am F C G

def music():
    out = np.zeros((N, 2)); room = lp(rng.standard_normal(N), 420) * 0.04 + bp(rng.standard_normal(N), 120, 300) * 0.028; out[:, 0] += room; out[:, 1] += np.roll(room, 1900)
    # the slop's flat electric hum under level 0 (never a silent window), fading as the first repo lands
    tt = T(N); l0 = np.array([1.0 if L_at(x) < 1 else 0.0 for x in tt[::480]]).repeat(480)[:N]
    l0 = np.convolve(l0, np.ones(96000) / 96000, "same") * 2; l0 = np.minimum(l0, 1)
    hum = (np.sin(2 * np.pi * 110 * tt) * 0.6 + np.sin(2 * np.pi * 220 * tt) * 0.25) * 0.09 * l0
    out[:, 0] += hum; out[:, 1] += hum
    k = 0; t = 0.0
    cta0 = next(s["t0"] for s in LV if s["id"] == "cta")
    while t < DUR - 0.2:
        L = L_at(t); fade = 1.0 if t < cta0 else max(0.0, 1 - (t - cta0) / (DUR - cta0)) ** 1.3
        big = 1.25 if any(s["id"] == "payoff" and s["t0"] <= t < s["t1"] for s in LV) else 1.0
        root, chord = PROG[(k // 8) % 4]; cut = 1400 if L < 5 else 3200
        if L < 1: put(out, click(0.35, 1800 if k % 4 else 2600), t)
        if L >= 1: put(out, kick(0.9 * fade * big), t)
        if L >= 2: put(out, hat(0.8 * fade, o=(k % 8 == 7)), t + BEAT / 2, pan=0.25)
        if L >= 3 and k % 2 == 0: put(out, tone(root, BEAT * 1.9, "bass", 0.4 * fade * big), t)
        if L >= 4 and k % 8 == 0:
            for i, m in enumerate(chord): put(out, tone(m, BEAT * 9.2, "pad", 0.05 * fade, cut), t - 0.3, pan=-0.3 + 0.3 * i)
        if L >= 5:
            for s_ in range(4): put(out, tone(chord[[0, 2, 1, 2][s_]] + 12, 0.2, "pluck", 0.07 * fade, cut), t + s_ * BEAT / 4, pan=-0.35 + 0.23 * s_)
        if L >= 7 and k % 4 in (1, 3): put(out, clap(0.9 * fade), t)
        if L >= 9 and k % 4 == 0: put(out, sub(0.5 * fade * big), t)
        t += BEAT; k += 1
    return out

def whoosh(L=0.22, g=1.0, up=True):
    n = int(L * SR); x = rng.standard_normal(n); env = np.sin(np.pi * T(n) / L) ** 2; lo = np.linspace(500, 4000, n) if up else np.linspace(4000, 500, n); y = np.zeros(n)
    for i in range(0, n, 1024): y[i:i + 1024] = bp(x[i:i + 1024], lo[i] * 0.7, lo[i] * 1.5)
    return y * env * g
def thud(g=1.0):
    n = int(0.3 * SR); t = T(n); f = 60 + 120 * np.exp(-t * 30); return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.08) + lp(rng.standard_normal(n), 800) * np.exp(-t / 0.015) * 0.4) * g
def boing(g=1.0, base=180):
    n = int(0.35 * SR); t = T(n); f = base * (1 + 1.2 * np.exp(-t * 14)) * (1 + 0.04 * np.sin(2 * np.pi * 18 * t)); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.12) * np.minimum(1, t / 0.003) * g
def sparkle(g=1.0):
    n = int(0.4 * SR); out = np.zeros(n)
    for i in range(6):
        f = 2600 + 1800 * rng.random(); s = int(rng.random() * 0.15 * SR); m = n - s; tt = T(m); out[s:] += np.sin(2 * np.pi * f * tt) * np.exp(-tt / 0.05) * 0.3
    return out * g
def slamthump(g=1.0):
    n = int(0.36 * SR); t = T(n); f = 42 + 80 * np.exp(-t * 26); return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.1) + lp(rng.standard_normal(n), 700) * np.exp(-t / 0.02) * 0.4) * g
def buzz(L=1.5, g=1.0):
    n = int(L * SR); t = T(n); x = np.sign(np.sin(2 * np.pi * 110 * t)) * 0.3 + bp(rng.standard_normal(n), 2000, 6000) * 0.2; return lp(x, 2500) * np.minimum(1, t / 0.05) * np.minimum(1, (L - t) / 0.1) * g
def chime(g=1.0):
    n = int(1.4 * SR); t = T(n); return sum(np.sin(2 * np.pi * f * t) * np.exp(-t / d) for f, d in ((880, 0.6), (1318.5, 0.45), (1760, 0.3))) * g * 0.25
def roll(L=1.8, g=1.0):
    out = np.zeros(int(L * SR)); k = 0; t = 0.0
    while t < L - 0.05: put2 = click(0.25, 3000 + 600 * (k % 3)); i = int(t * SR); m = min(len(put2), len(out) - i); out[i:i + m] += put2[:m]; t += 0.05 + 0.1 * (t / L) ** 2; k += 1
    return out * g

def sfx():
    out = np.zeros((N, 2)); counts = {}
    for e in EV["events"]:
        k, t, L = e["kind"], e["t"], e.get("L", 0); counts[k] = counts.get(k, 0) + 1
        if k == "impact":
            if L < 2: put(out, click(0.3, 900), t)
            elif L < 14: put(out, thud(0.55), t)
            else: put(out, thud(0.45), t); put(out, boing(0.35, 170 + 30 * ((int(t / 0.5)) % 4)), t)
            if 8 <= L: put(out, sparkle(0.35), t, pan=0.2)
        elif k == "slam": put(out, slamthump(0.6), t)
        elif k == "act": put(out, sparkle(0.5), t, pan=0.2); put(out, click(0.25, 2600), t)
        elif k == "page": put(out, whoosh(0.25, 0.28), t - 0.05, pan=-0.2)
        elif k == "explode": put(out, whoosh(0.6, 0.45), t); put(out, whoosh(0.6, 0.4, up=False), t + 1.4)
        elif k == "wipe": put(out, whoosh(0.4, 0.35), t)
        elif k == "render": put(out, buzz(1.45, 0.12), t)
        elif k == "done": put(out, chime(0.7), t)
        elif k == "payoff": put(out, sub(1.0), t); put(out, whoosh(0.5, 0.4), t - 0.5)
        elif k == "total": put(out, roll(1.8, 0.6), t)
        elif k == "cta": put(out, chime(0.9), t)
    return out, counts

def load(p):
    y, sr = sf.read(p)
    if y.ndim > 1: y = y.mean(1)
    return resample_poly(y, SR, sr) if sr != SR else y
def voices():
    out = np.zeros((N, 2))
    for l in TM["lines"]:
        y = load(ROOT / "audio/out" / f"{l['id']}.wav"); y *= 0.12 / (np.sqrt(np.mean(y[np.abs(y) > 0.01] ** 2)) + 1e-9); put(out, y, l["start"])
    return out

def master(x, path):
    raw = path.with_suffix(".raw.wav"); sf.write(raw, x * 0.5, SR, subtype="FLOAT")
    a = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(raw), "-af", "loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"], capture_output=True, text=True).stderr
    m = json.loads(a[a.rindex("{"):a.rindex("}") + 1])
    af = (f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true")
    subprocess.run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", str(raw), "-af", af, "-ar", str(SR), "-ac", "2", "-c:a", "pcm_s16le", str(path)], check=True); raw.unlink()
    r = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(path), "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True).stderr
    return float(re.findall(r"I:\s+(-?[\d.]+) LUFS", r)[-1]), float(re.findall(r"Peak:\s+(-?[\d.]+) dBFS", r)[-1])

def main():
    mus, (fx, counts), vox = music(), sfx(), voices()
    sf.write(ROOT / "audio/score_only.wav", (mus[: int(DUR * SR)] * 0.4), SR)
    env = np.abs(vox).max(1); w = int(0.25 * SR); env = np.convolve(env, np.ones(w) / w, "same")
    duck = (1 - 0.55 * np.clip(env / 0.04, 0, 1))[:, None]
    mix = (vox * 1.0 + mus * 0.42 * duck + fx * 0.5 * (0.6 + 0.4 * duck))[: int(DUR * SR)]
    I, pk = master(mix, ROOT / "public/audio/mix.wav")
    print(f"mix {I:.1f} LUFS, true peak {pk:.1f} dBFS | {counts} | {DUR:.2f} s")

if __name__ == "__main__":
    main()
