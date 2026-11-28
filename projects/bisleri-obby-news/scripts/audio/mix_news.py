"""Bisleri x obby breaking news: 150 BPM chiptune + broadcast SFX + voice from SCENE_TIMINGS.json (the same named beats the picture uses).

Score: an original warm lo-fi bed, Dm9 - Bbmaj7 - Gm7 - A7sus4 at 92 BPM (synth Rhodes, sub, soft kick, rim, hat).
  hook: pad + riser into the 31 halvings, a stomp + chord hit on "31"; problem: pad only (night); game -> cta: groove;
  the groove stops for the turn ("par interview mein...") and lands on "answer pe binary search"; ducked under every line.
SFX (synthesised): 31 ticks + stomp, a wooden crack on every scale snap, slam, whooshes on whip cuts, pops on labels,
  bells on every answer, stamps, glass crack on the overflow, typing, a notification ping, a page flip, one boing.
Two-pass loudnorm to -14 LUFS / -1.5 dBTP -> public/audio/mix.wav; sets src/config/audioManifest.json "reel".

    python scripts/audio/mix_duo.py
"""
import json, pathlib, subprocess, sys
import numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt

ROOT = pathlib.Path(__file__).resolve().parents[2]
SR = 44100
TL = json.loads((ROOT / "SCENE_TIMINGS.json").read_text(encoding="utf-8"))
EV, TOTAL = TL["ev"], TL["total"]
SC = {s["id"]: s for s in TL["scenes"]}
N = int(TOTAL * SR) + SR
rng = np.random.default_rng(7)

def bp(x, lo, hi, o=2): return sosfilt(butter(o, [lo, hi], "band", fs=SR, output="sos"), x)
def lp(x, f, o=2): return sosfilt(butter(o, f, "low", fs=SR, output="sos"), x)
def hp(x, f, o=2): return sosfilt(butter(o, f, "high", fs=SR, output="sos"), x)
def env(n, a=0.002, d=0.2):
    t = np.arange(n) / SR; e = np.exp(-t / d); k = int(a * SR)
    if k: e[:k] *= np.linspace(0, 1, k)
    return e
def put(buf, x, t, g=1.0):
    i = int(t * SR)
    if i < 0: x, i = x[-i:], 0
    j = min(len(buf), i + len(x)); buf[i:j] += x[:j - i] * g
def tone(f, dur, d=0.3, a=0.002, shape="sine"):
    n = int(dur * SR); t = np.arange(n) / SR
    w = np.sin(2 * np.pi * f * t) if shape == "sine" else np.sign(np.sin(2 * np.pi * f * t))
    return w * env(n, a, d)
def noise(dur): return rng.standard_normal(int(dur * SR))
def add(*xs):
    o = np.zeros(max(len(x) for x in xs))
    for x in xs: o[:len(x)] += x
    return o

# ---------------- SFX ----------------
def tick(k):      return bp(noise(0.03), 2500 + k * 60, 6000 + k * 80) * env(int(0.03 * SR), 0.0005, 0.008) * 0.9
def stomp():
    n = int(0.9 * SR); t = np.arange(n) / SR; f = 90 * np.exp(-t * 6) + 38
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.001, 0.35)
    return add(body * 1.2, lp(noise(0.9), 900)[:n] * env(n, 0.001, 0.06) * 0.8)
def crack(heavy=1.0):
    snap = hp(noise(0.05), 1800) * env(int(0.05 * SR), 0.0003, 0.012)
    wood = bp(noise(0.12), 700, 2200, 3) * env(int(0.12 * SR), 0.0005, 0.03) * 1.6
    thud = tone(110, 0.25, 0.07) * 0.8 * heavy
    out = np.zeros(int(0.3 * SR)); out[:len(snap)] += snap; out[:len(wood)] += wood; out[:len(thud)] += thud
    return out
def slam():
    return add(crack(1.6), stomp()[:int(0.3 * SR)] * 0.7)
def whoosh(d=0.32):
    n = int(d * SR); x = noise(d); t = np.arange(n) / n
    out = np.zeros(n)
    for i in range(0, n, 512):   # swept band
        f = 400 + 3600 * t[i]; seg = x[i:i + 1024]; out[i:i + len(seg)] += bp(seg, f, f * 1.8)[:len(out[i:i + len(seg)])] * 0.5
    return out * np.sin(np.pi * t) * 1.4
def pop(f=880): return add(tone(f, 0.12, 0.05, 0.001) * 0.7, tone(f * 1.5, 0.08, 0.03) * 0.3)
def bell(f=1046.5):
    return add(*[tone(f * m, 1.6, d, 0.001) * g for m, d, g in [(1, 0.9, 0.6), (2.76, 0.45, 0.25), (5.4, 0.2, 0.12), (2, 0.7, 0.2)]])
def stamp(): return add(tone(70, 0.35, 0.09) * 1.3, bp(noise(0.08), 300, 3000) * env(int(0.08 * SR), 0.0005, 0.02) * 1.2)
def glass():
    out = hp(noise(0.6), 3500) * env(int(0.6 * SR), 0.0005, 0.12) * 0.9
    for i in range(9): put(out, tone(2800 + i * 430, 0.25, 0.06), 0.02 + i * 0.035, 0.18)
    return out
def key(): return bp(noise(0.025), 1500, 5000) * env(int(0.025 * SR), 0.0003, 0.006) * 0.55
def ping(): o = np.zeros(int(0.5 * SR)); put(o, tone(1318.5, 0.3, 0.12), 0, 0.5); put(o, tone(1760, 0.35, 0.15), 0.11, 0.5); return o
def flip(): return bp(noise(0.18), 900, 5000) * np.sin(np.pi * np.linspace(0, 1, int(0.18 * SR))) * 0.8
def boing():
    n = int(0.5 * SR); t = np.arange(n) / SR; f = 220 + 120 * np.sin(2 * np.pi * 9 * t) * np.exp(-t * 5)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.002, 0.25) * 0.6
def shimmer(d=0.9):
    o = np.zeros(int(d * SR))
    for i in range(14): put(o, tone(1200 + i * 140, 0.2, 0.06), i * d / 16, 0.12)
    return o

def marker(): return bp(noise(0.16), 2500, 7000) * np.sin(np.pi * np.linspace(0, 1, int(0.16 * SR))) * 0.5

def horn(d=0.8):
    n = int(d * SR); t = np.arange(n) / SR; a = np.minimum(1, t / 0.04) * np.minimum(1, (d - t) / 0.12)
    w = sum(np.sign(np.sin(2 * np.pi * f * t)) * g for f, g in ((311, 0.5), (370, 0.4), (466, 0.3)))
    return lp(w * a, 2400) * 0.35
def clack(): return add(bp(noise(0.07), 300, 1800) * env(int(0.07 * SR), 0.0005, 0.02) * 1.3, tone(90, 0.12, 0.04) * 0.6)
def coin(): return add(tone(1568, 0.25, 0.08) * 0.5, tone(2093, 0.25, 0.1) * 0.35)

def sq(f, dur, d=0.2, a=0.002, duty=0.5):
    n = int(dur * SR); t = np.arange(n) / SR; ph = (t * f) % 1
    return np.where(ph < duty, 1.0, -1.0) * env(n, a, d)
def scratch():
    n = int(0.42 * SR); t = np.arange(n) / SR
    f = 900 * (1 + 0.8 * np.sin(2 * np.pi * 7 * t)) * np.exp(-t * 2)
    w = bp(noise(0.42), 300, 4000) * np.abs(np.sin(2 * np.pi * np.cumsum(f) / SR * 0.05))
    return w * env(n, 0.002, 0.3) * 1.2
def buzz(d=0.35): return lp(sq(110, d, 1.0, 0.002, 0.3) * 0.6 + sq(116, d, 1.0, 0.002, 0.3) * 0.6, 2500) * env(int(d * SR), 0.002, d)
def sting():
    o = np.zeros(int(1.0 * SR))
    for f, dt in ((440, 0), (554, 0.0), (659, 0.0), (880, 0.12)): put(o, sq(f, 0.7, 0.35, 0.002, 0.25) * 0.25, dt)
    return o
def roar():
    n = int(1.2 * SR); t = np.arange(n) / SR; f = 70 + 30 * np.sin(2 * np.pi * 3 * t)
    return np.tanh(3 * np.sin(2 * np.pi * np.cumsum(f) / SR)) * env(n, 0.05, 0.6) * 0.8 + lp(noise(1.2), 400)[:n] * env(n, 0.05, 0.5) * 0.5
def zap(): n = int(0.12 * SR); t = np.arange(n) / SR; f = 2400 * np.exp(-t * 30) + 200; return np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * env(n, 0.001, 0.05) * 0.4
def splash(): return add(bp(noise(0.7), 400, 5000) * env(int(0.7 * SR), 0.005, 0.25) * 1.2, tone(160, 0.3, 0.08) * 0.6)
def coin(): o = np.zeros(int(0.3 * SR)); put(o, sq(988, 0.08, 0.06, 0.001, 0.5), 0, 0.3); put(o, sq(1319, 0.2, 0.12, 0.001, 0.5), 0.07, 0.3); return o

sfx = np.zeros(N)
E = EV
put(sfx, scratch(), E["scratch"], 1.0); put(sfx, zap(), E["scratch"] + 0.05, 0.6)
for i in range(4): put(sfx, pop(300 + i * 70), E["bugs"] + i * 0.12, 0.35)
put(sfx, sting(), E["breakIn"], 0.9); put(sfx, stomp(), E["breakIn"], 0.6)
put(sfx, stamp(), E["unsafe"], 0.9); put(sfx, buzz(0.3), E["unsafe"] + 0.05, 0.4)
put(sfx, stamp()[:int(0.25 * SR)], E["prosecution"], 0.6); put(sfx, bell(880), E["prosecution"] + 0.05, 0.25)
put(sfx, boing(), E["trust"], 0.5)
put(sfx, flip(), E["stmt"], 0.6); put(sfx, marker(), E["stmt"] + 0.3, 0.5)
for i in range(6): put(sfx, key(), E["samples"] + i * 0.05, 0.5)
for i in range(5): put(sfx, coin(), E["pass5"] + i * 0.12, 0.5)
t = E["bromate"]
while t < E["limit"]: put(sfx, tick(int((t - E["bromate"]) * 10)), t, 0.35); t += 0.12
put(sfx, buzz(0.5), E["limit"], 0.8); put(sfx, buzz(0.3), E["fail1"], 0.6)
put(sfx, stamp(), E["qaFail"], 1.0); put(sfx, splash(), E["qaFail"] + 0.55, 0.9)
put(sfx, zap(), E["twist"], 0.7); put(sfx, whoosh(0.4), E["twist"], 0.5)
put(sfx, flip(), E["appeal"], 0.5); put(sfx, coin(), E["bromOk"], 0.5); put(sfx, buzz(0.35), E["pahs"] + 1.35, 0.6); put(sfx, roar(), E["pahs"] + 1.4, 0.8)   # after the word "PAHs", never on it
put(sfx, stamp(), E["unsafe2"], 1.0); put(sfx, splash(), E["unsafe2"] + 0.55, 0.9); put(sfx, roar(), E["boss"], 0.6)
put(sfx, zap(), E["reply"], 0.6); put(sfx, flip(), E["reply"], 0.5); put(sfx, pop(880), E["reply"] + 0.5, 0.4); put(sfx, bell(1318.5), E["safe"], 0.35)
for k in ("fGoa", "fCourt", "fRecall"): put(sfx, stamp()[:int(0.2 * SR)], E[k], 0.55); put(sfx, pop(990), E[k] + 0.02, 0.3)
put(sfx, zap(), E["pipe"], 0.6)
for i in range(4): put(sfx, coin() if i < 3 else bell(1568), E["ci"] + 0.35 + i * 0.45, 0.4)
put(sfx, zap(), E["ask"], 0.6); put(sfx, pop(880), E["opt1"], 0.5); put(sfx, pop(1046), E["opt2"], 0.5)
_st = sting()[:int(0.5 * SR)]; _st[-int(0.1 * SR):] *= np.linspace(1, 0, int(0.1 * SR))
put(sfx, _st, E["brand"] - 0.55, 0.6)   # done before "Tech pe Trek" starts, never on it
for i in range(int(TOTAL * 2.3)):      # a soft hop blip on every 4th hop
    if i % 4 == 0: put(sfx, sq(520 + (i % 8) * 40, 0.05, 0.03, 0.001, 0.25), i / 2.3, 0.12)

# ---------------- score: 150 BPM chiptune ----------------
BPM = 150; BEAT = 60 / BPM; BAR = 4 * BEAT
mf = lambda m: 440 * 2 ** ((m - 69) / 12)
def kick(): n = int(0.3 * SR); t = np.arange(n) / SR; f = 140 * np.exp(-t * 30) + 45; return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.001, 0.12)
def snare(): return add(hp(noise(0.18), 1500) * env(int(0.18 * SR), 0.001, 0.05), tone(190, 0.1, 0.04) * 0.5)
def hat(): return hp(noise(0.03), 8000) * env(int(0.03 * SR), 0.0005, 0.008)
HAPPY = [[57, 60, 64], [53, 57, 60], [55, 59, 62], [52, 55, 59]]     # Am F G Em
BOSS = [[57, 60, 63], [56, 59, 63], [55, 58, 62], [56, 59, 62]]      # darker, chromatic
mus = np.zeros(N)
stops = [(E["breakIn"] - 0.45, E["breakIn"]), (E["twist"] - 0.3, E["twist"])]
boss_on = lambda t: E["twist"] <= t < E["reply"]
groove = lambda t: 0.0 <= t < TOTAL - 0.4 and not any(a <= t < b for a, b in stops)
for b in range(int(TOTAL / BAR) + 2):
    t0 = b * BAR
    if t0 > TOTAL: break
    ch = (BOSS if boss_on(t0) else HAPPY)[b % 4]
    for k in range(16):                                   # 16th-note arpeggio lead
        tt = t0 + k * BEAT / 4
        if not groove(tt) or E["brand"] - 0.05 <= tt: continue   # the sign-off line gets no lead arp
        m = ch[k % 3] + 12 + (12 if k % 8 == 7 else 0)
        put(mus, sq(mf(m), BEAT / 4, 0.05, 0.001, 0.25), tt, 0.07)
    for k in range(8):                                    # bass on 8ths
        tt = t0 + k * BEAT / 2
        if groove(tt): put(mus, lp(sq(mf(ch[0] - 24), BEAT / 2, 0.12, 0.002, 0.5), 900), tt, 0.22 if not boss_on(tt) else 0.3)
    for k in range(4):
        tt = t0 + k * BEAT
        if not groove(tt): continue
        put(mus, kick(), tt, 0.6)
        if k % 2 == 1: put(mus, snare(), tt, 0.45)
    for k in range(8):
        tt = t0 + k * BEAT / 2
        if groove(tt) and tt < E["brand"] - 0.05: put(mus, hat(), tt, 0.15)
for at in (E["breakIn"], E["twist"]): put(mus, kick(), at, 0.9)
# the ending: a last kick + an Am chord that rings through the final 0.4 s (the groove stops at TOTAL - 0.4)
put(mus, kick(), TOTAL - 0.4, 0.8)
for m in (57, 60, 64, 69): put(mus, sq(mf(m), 0.45, 0.25, 0.002, 0.6), TOTAL - 0.4, 0.09)
# the stops are never digital silence: a rising whoosh breathes into the hit
for a, b in stops:
    n = int((b - a) * SR); r = hp(noise(b - a), 900)[:n] * np.linspace(0.05, 1, n) ** 2
    put(mus, r, a, 0.35)

# ---------------- voice, duck, master ----------------
vo, _ = sf.read(ROOT / "public/audio/vo.wav", dtype="float64")
v = np.zeros(N); v[:len(vo)] = vo
e = np.abs(v); k = int(0.05 * SR); e = np.convolve(e, np.ones(k) / k, "same")
duck = 1 - 0.62 * np.clip(e / 0.02, 0, 1)
duck = np.convolve(duck, np.ones(int(0.12 * SR)) / int(0.12 * SR), "same")
# words STT found masked in the final mix: the music dips further under them
clear = np.ones(N)
for a0, a1, g in ((45.75, 46.45, 0.45), (E["brand"] - 0.05, TOTAL - 0.42, 0.5), (E["brand"] - 0.05, E["brand"] + 1.33, 0.15)):   # "Tech pe Trek" almost dry
    clear[int(a0 * SR):int(a1 * SR)] = g
clear = np.convolve(clear, np.ones(int(0.08 * SR)) / int(0.08 * SR), "same")
mix = v * 1.0 + mus * duck * clear * 0.5 + sfx * 0.34
mix = mix[: int(TOTAL * SR)]
# tiny de-click fade only: the final chord rings to the last frame (no silent tail)
f = int(0.08 * SR); mix[-f:] *= np.linspace(1, 0, f)
# gentle soft-clip limiter so loudnorm can reach -14 LUFS without breaking the true-peak ceiling
mix = np.tanh(mix / (np.abs(mix).max() + 1e-9) * 2.4) / np.tanh(2.4)
raw = ROOT / "audio/out/mix_raw.wav"; sf.write(raw, (mix / max(1e-9, np.abs(mix).max()) * 0.9).astype(np.float32), SR, subtype="FLOAT")
out = ROOT / "public/audio/mix.wav"
m = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(raw), "-af", "lowpass=f=15000,loudnorm=I=-14:TP=-2.5:LRA=11:print_format=json", "-f", "null", "-"], capture_output=True, text=True).stderr
j = json.loads(m[m.rindex("{"): m.rindex("}") + 1])
af = (f"lowpass=f=15000,loudnorm=I=-14:TP=-2.5:LRA=11:measured_I={j['input_i']}:measured_TP={j['input_tp']}:measured_LRA={j['input_lra']}"
      f":measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true")
subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(raw), "-af", af, "-ar", str(SR), "-c:a", "pcm_s16le", str(out)], check=True)
man = ROOT / "src/config/audioManifest.json"; d = json.loads(man.read_text(encoding="utf-8")); d["reel"] = "audio/mix.wav"
man.write_text(json.dumps(d, indent=1), encoding="utf-8")
chk = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(out), "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True).stderr
print("mix:", out, "|", [l.strip() for l in chk.splitlines() if l.strip().startswith(("I:", "Peak:"))][-2:])
