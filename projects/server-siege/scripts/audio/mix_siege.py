"""SERVER SIEGE sound: an original electronic score (synthesized here, licence-clean), Bro's 10 lines at their window
starts, SFX placed from the REAL sim run (audio/out/reel_run.json: launches, decommissions, cache on, DB at 100 %), the
music ducked under the voice, mastered to -14 LUFS / -1.5 dBTP.
  120 BPM, D minor. Bar 1 lands at 3.0 s (2 s bars), so every VO window edge (3, 9, 17, 25, 33, 41, 49, 57, 63) is a downbeat.
  0-3 tense hook + impact | 3-9 intro pulse | 9-25 driving | 24.75 stop | 25-33 low-bass meltdown (half time, alarms)
  33-49 rising recovery theme | 49-63 restrained triumphant groove | 63 signature hit, ring-out to 68.
Writes public/audio/mix_siege.wav, audio/out/beats_siege.json, audio/out/stems_siege/*.wav.
    python scripts/audio/mix_siege.py
"""
import json, pathlib, re, subprocess, sys

import numpy as np
import soundfile as sf
from scipy.signal import resample_poly

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import score as S  # noqa: E402   (sfx(), filters, envelope(); SR 48 kHz)

ROOT = HERE.parent.parent; SR = S.SR
VO = json.loads((ROOT / "audio/out/lines.json").read_text(encoding="utf-8"))["lines"]
RUN = json.loads((ROOT / "audio/out/reel_run.json").read_text(encoding="utf-8"))
TOTAL = 68.0; N = int(TOTAL * SR)
BPM = 120; BEAT = 60 / BPM; BAR = 4 * BEAT; BAR1 = 3.0
STOP = (24.75, 25.0)          # silence: the beat before "Lekin ruk…"
SIM0 = 3.0                    # reel time of sim t = 0
rng = np.random.default_rng(20261101)

# D minor: i - VI - III - VII (Dm Bb F C); the recovery lifts to III - VII - i - VI with brighter voicing
DRIVE = [(38, [62, 65, 69]), (34, [58, 62, 65]), (41, [57, 60, 65]), (36, [55, 60, 64])]
LIFT = [(41, [65, 69, 72]), (36, [64, 67, 72]), (38, [62, 65, 69, 74]), (34, [62, 65, 70])]


def put(buf, x, t, g=1.0):
    i = int(round(t * SR))
    if i >= len(buf) or i + len(x) <= 0: return
    a = max(0, -i); j = max(0, i); m = min(len(x) - a, len(buf) - j)
    buf[j:j + m] += x[a:a + m] * g


def T(n): return np.arange(n) / SR
def kick(g=1.0, n=0.32):
    m = int(n * SR); t = T(m); f = 46 + 130 * np.exp(-t * 32)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.17) * g
def clap(g=1.0):
    m = int(0.2 * SR); return S.bp(rng.standard_normal(m), 900, 5200) * np.exp(-T(m) / 0.06) * g
def hat(g=1.0, open_=False):
    m = int((0.14 if open_ else 0.05) * SR); return S.hp(rng.standard_normal(m), 7000) * np.exp(-T(m) / (0.05 if open_ else 0.015)) * g
def pluck(note, L=0.3, g=1.0, cut=3000):
    m = int(L * SR); return S.lp(S.saw(S.midi(note), m), cut) * np.exp(-T(m) / (L * 0.4)) * g
def pad(notes, L, g=1.0, cut=1800):
    m = int(L * SR); x = sum(S.saw(S.midi(n), m, detune=0.12) for n in notes) / len(notes)
    e = np.minimum(1, T(m) / 0.25) * np.minimum(1, (L - T(m)) / 0.3).clip(0)
    return S.lp(x, cut) * e * g
def bell(note, L=0.7, g=1.0):
    m = int(L * SR); t = T(m); f = S.midi(note)
    return (np.sin(2 * np.pi * f * t) + 0.45 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t / 0.09) + 0.2 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t / 0.04)) * np.exp(-t / 0.28) * g


def music():
    out = np.zeros(N)
    # ---- 0-3: tense hook. A first-frame impact, a sub pulse that accelerates, ticking hats, a glitch on "gaya!", a riser
    put(out, S.sfx("subImpact"), 0.0, 0.9)
    for k in range(12):
        t = 0.25 + 2.6 * (1 - (1 - k / 12) ** 1.6)
        put(out, kick(0.55 + 0.03 * k, 0.2), t)
    for k in range(int(3 / (BEAT / 4))): put(out, hat(0.18 + 0.1 * (k / 24)), k * BEAT / 4)
    put(out, pad([38, 45, 50, 53], 3.0, 0.35, 900), 0.0)
    m = int(0.9 * SR); tt = T(m)
    put(out, S.hp(rng.standard_normal(m), 1800) * (tt / 0.9) ** 2 * 0.3 + np.sin(2 * np.pi * np.cumsum(180 + 1400 * (tt / 0.9) ** 2) / SR) * (tt / 0.9) ** 2 * 0.12, BAR1 - 0.9)
    # ---- 3-68: bar by bar
    for b in range(int((TOTAL - BAR1) / BAR) + 1):
        t0 = BAR1 + b * BAR
        if t0 >= TOTAL - 0.01: break
        if 63 <= t0: break                                                  # the end hit is its own event
        meltdown = 25 <= t0 < 33
        lift = 33 <= t0 < 49
        groove = 49 <= t0 < 63
        intro = t0 < 9
        root, ch = (LIFT if (lift or groove) else DRIVE)[b % 4]
        if meltdown:                                                        # half-time: sub, a heavy kick on 1 and 3, alarm stabs
            m = int(BAR * SR); t = T(m)
            put(out, np.sin(2 * np.pi * S.midi(26) * t) * np.minimum(1, t / 0.05) * np.exp(-t / 1.6) * 0.75, t0)
            put(out, kick(1.1, 0.5), t0); put(out, kick(0.9, 0.5), t0 + 2 * BEAT)
            put(out, clap(0.35), t0 + 3 * BEAT)
            put(out, pad([50, 53, 56], BAR, 0.22, 700), t0)                 # D dim colour: unease
            continue
        g = 0.7 if intro else 1.0
        for k in range(4):
            tb = t0 + k * BEAT
            put(out, kick(0.95 * g), tb)
            m = int(BEAT * SR); pump = np.minimum(1, T(m) / 0.16) ** 1.5    # sidechain-pumped bass
            put(out, S.lp(S.saw(S.midi(root - 12), m), 330 + (300 if groove else 0)) * pump * 0.3 * g, tb)
            put(out, hat(0.14, True), tb + BEAT / 2)
            if not intro:
                put(out, hat(0.08), tb + BEAT / 4); put(out, hat(0.08), tb + 3 * BEAT / 4)
                if k in (1, 3): put(out, clap(0.42), tb)
        # 16th arpeggio whose filter opens over 9-25 (the pressure rising)
        cut = 900 + 3200 * min(1, max(0, (t0 - 3) / 22)) if not (lift or groove) else 3600
        for k in range(16):
            n = ch[k % len(ch)] + (12 if k % 8 >= 4 else 0)
            put(out, pluck(n, 0.16, 0.10 * g, cut), t0 + k * BEAT / 4)
        put(out, pad(ch, BAR, 0.16 if not lift else 0.2, 1400 if not lift else 2600), t0)
        if lift or groove:                                                  # the recovery theme: a rising bell line, every 2 bars
            if b % 2 == 0:
                MOT = [(0, 74), (0.5, 77), (1, 81), (2, 79), (2.5, 77), (3, 76), (4, 77), (4.5, 81), (5, 84), (6, 81)]
                for at, note in MOT: put(out, bell(note + (0 if lift else 0), 0.7, 0.12 if lift else 0.1), t0 + at * BEAT)
        if 41 <= t0 < 49 and t0 + BAR >= 49 - 0.01:                         # snare roll into the groove
            for k in range(16): put(out, clap(0.12 + 0.3 * k / 16), t0 + k * BEAT / 4)
    # ---- 63: the signature hit and its ring-out
    put(out, S.sfx("subImpact"), 63.0, 1.0)
    put(out, kick(1.2, 0.6), 63.0)
    put(out, pad([50, 57, 62, 66, 69], 5.0, 0.4, 3000), 63.0)            # D major: resolved
    for at, note in [(63.0, 74), (63.25, 78), (63.5, 81), (63.75, 86)]: put(out, bell(note, 1.6, 0.16), at)
    # the stop before "Lekin ruk"
    a, b = (int(x * SR) for x in STOP); out[a:b] = 0
    f = int(0.004 * SR); out[a - f:a] *= np.linspace(1, 0, f); out[b:b + f] *= np.linspace(0, 1, f)
    end = int((TOTAL - 1.5) * SR); out[end:] *= np.linspace(1, 0, N - end) ** 2
    return out


def sfx_track():
    """sounds on the real sim events of the reel run (reel time = sim t + 3); the hook flash-forward uses its own"""
    out = np.zeros(N); fx = lambda k, L=0.8: S.sfx(k, length=L)  # noqa: E731
    put(out, fx("dataBurst", 2.2), 0.1, 0.35)                                 # the request wave
    put(out, fx("alarm", 0.9), 1.6, 0.35)                                     # the city falls
    put(out, fx("scratch", 0.5), 2.45, 0.35)                                  # "gaya!"
    put(out, fx("impact"), 3.0, 0.8)                                          # the drop into the reveal
    put(out, fx("whoosh", 1.4), 3.1, 0.3)
    for e in RUN["log"]:
        t, txt = e["t"] + SIM0, e["text"]
        if t < 3.05: continue
        if txt.startswith("Launching") or ("launching" in txt):              # towers rise: mechanical whir + locks
            put(out, fx("riser", 1.2), t, 0.22); put(out, fx("mechClick"), t, 0.5)
        elif "healthy" in txt: put(out, fx("magLock"), t, 0.45)
        elif "decommissioned" in txt: put(out, fx("suck", 0.6), t, 0.25)
        elif "Edge cache ON" in txt: put(out, fx("glass"), t, 0.6); put(out, fx("dataBurst", 1.5), t + 0.2, 0.25)
        elif txt.startswith("Console:"): put(out, fx("mechClick"), t - 0.05, 0.45)
        elif "SYSTEM RECOVERED" in txt: pass                                  # shown later (49 s); its sound sits there
    # DB alarm while the database is really at 100 % (from the run's samples), at most every 2 s
    last = -9
    for s in RUN["samples"]:
        t = s["t"] + SIM0
        if s["db"] >= 0.995 and t - last >= 2.0 and 25 <= t < 35: put(out, fx("alarm", 0.6), t, 0.22); last = t
    put(out, fx("subImpact"), 25.12, 0.7)                                     # "Lekin ruk"
    put(out, fx("resolve", 2.5), 49.0, 0.45)                                  # SYSTEM RECOVERED on screen
    put(out, fx("typing", 1.2), 57.4, 0.25); put(out, fx("mechClick"), 61.0, 0.5)   # the console
    return out


def voices():
    out = np.zeros(N); place = {}
    for l in VO:
        y, sr = sf.read(ROOT / "audio/out" / f"{l['id']}.wav", dtype="float64")
        y = resample_poly(y, SR, sr) if sr != SR else y
        put(out, y, l["start"]); place[l["id"]] = l["start"]
    return out, place


def master(x, path):
    raw = path.with_suffix(".raw.wav"); sf.write(raw, np.stack([x, x], 1) * 0.5, SR, subtype="FLOAT")
    a = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(raw), "-af", "loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"], capture_output=True, text=True).stderr
    m = json.loads(a[a.rindex("{"):a.rindex("}") + 1])
    af = (f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}:"
          f"measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true")
    subprocess.run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", str(raw), "-af", af, "-ar", str(SR), "-ac", "2", "-c:a", "pcm_s16le", str(path)], check=True)
    raw.unlink()
    r = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(path), "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True).stderr
    return float(re.findall(r"I:\s+(-?[\d.]+) LUFS", r)[-1]), float(re.findall(r"Peak:\s+(-?[\d.]+) dBFS", r)[-1])


def main():
    mus, fx = music(), sfx_track(); vox, place = voices()
    env = S.envelope(vox, 0.01, 0.3); duck = 1 - 0.68 * np.clip(env / 0.08, 0, 1)
    mix = vox * 1.0 + mus * 0.5 * duck + fx * 0.75
    st = ROOT / "audio/out/stems_siege"; st.mkdir(parents=True, exist_ok=True)
    for name, x in (("voice", vox), ("music", mus * 0.5 * duck), ("sfx", fx * 0.75)): sf.write(st / f"{name}.wav", x, SR, subtype="FLOAT")
    out = ROOT / "public/audio/mix_siege.wav"; out.parent.mkdir(parents=True, exist_ok=True)
    I, tp = master(mix, out)
    beats = [round(BAR1 + i * BEAT, 3) for i in range(int((TOTAL - BAR1) / BEAT) + 1)]
    (ROOT / "audio/out/beats_siege.json").write_text(json.dumps({"bpm": BPM, "beat": BEAT, "bar1": BAR1, "total": TOTAL, "beats": beats,
        "downbeats": beats[::4], "voice_at": place, "music_stop": STOP}, indent=1), encoding="utf-8")
    print(f"-> {out}  {TOTAL:.1f} s  {I:.1f} LUFS  peak {tp:.1f} dBFS")


if __name__ == "__main__":
    main()
