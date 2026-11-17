"""Ep 01 sound: an original 8-bit score (synthesized here, licence-clean), the two hosts' lines in their fixed 3 s slots,
SFX on the story beats, music ducked under the voices, mastered to -14 LUFS / < -1 dBTP (louder, per the user's v4 note; the prompt said -16).
  tempo 120 BPM (beat 0.5 s): every 3 s slot = 6 beats, so each cut lands on a beat (the prompt's 124 was a candidate).
  C - Am - F - G, one chord a bar; a soft triangle pad, square arpeggio, triangle bass, noise drums; a 0.25 s stop before the s15 myth slam.
Writes public/audio/mix_ep01.wav, audio/out/beats_ep01.json (beat map), audio/out/stems_ep01/*.wav.
    python scripts/audio/mix_ep01.py
"""
import json, math, pathlib, subprocess, re, sys

import numpy as np
import soundfile as sf
from scipy.signal import resample_poly

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import score as S  # noqa: E402   (sfx(), filters, envelope(); SR 48 kHz)

ROOT = HERE.parent.parent; SR = S.SR
SCRIPT = json.loads((ROOT / "src/config/voScript.json").read_text(encoding="utf-8"))
LINES = {m["id"]: m for m in json.loads((ROOT / "audio/out/lines_duo.json").read_text(encoding="utf-8"))["lines"]}
SLOT = SCRIPT["slot"]; TOTAL = SLOT * len(SCRIPT["reel"]); N = int(TOTAL * SR)
BPM = 120; BEAT = 60 / BPM; BAR = 4 * BEAT
VO_IN = 0.08                       # a line starts this long after its slot's cut (s01 at 0: the hook speaks on frame 0)
STOP = (41.75, 42.0)               # music silent: the beat before "Lekin 49 employees hire nahi hue!"
HOOK = 3.0                         # the game level; the launch track drops at 3.0 s
rng = np.random.default_rng(20261101)


def tone(kind, f, n, duty=0.25):
    ph = np.cumsum(np.full(n, f / SR)) % 1.0
    if kind == "sq": return np.where(ph < duty, 1.0, -1.0)
    if kind == "tri": return 4 * np.abs(ph - 0.5) - 1
    return np.sin(2 * np.pi * ph)


def put(buf, x, t, g=1.0):
    i = int(t * SR)
    if i >= len(buf) or i + len(x) <= 0: return
    a = max(0, -i); j = max(0, i); m = min(len(x) - a, len(buf) - j)
    buf[j:j + m] += x[a:a + m] * g


def music():
    """0-3 s: the hook's 8-bit level loop. 3 s on: an original launch track (120 BPM) with a ringtone-style bell hook."""
    out = np.zeros(N)
    CH = [(48, [60, 64, 67, 72]), (45, [57, 60, 64, 69]), (41, [53, 57, 60, 65]), (43, [55, 59, 62, 67])]   # C Am F G
    # --- hook: bright 8-bit loop (sixteenth arps + triangle bass + noise snare), 0 .. 3 s
    for k in range(int(HOOK / (BEAT / 4))):
        tb = k * BEAT / 4; root, arp = CH[(k // 16) % 4]
        n = int(BEAT / 4 * SR * 0.8); e = np.exp(-np.arange(n) / SR / 0.05)
        put(out, tone("sq", S.midi(arp[k % 4] + 12), n, 0.125) * e * 0.12, tb)
        if k % 2 == 0: put(out, tone("tri", S.midi(root - 12), n) * np.exp(-np.arange(n) / SR / 0.1) * 0.35, tb)
        if k % 8 == 4: m = int(0.1 * SR); put(out, S.bp(rng.standard_normal(m), 1500, 8000) * np.exp(-np.arange(m) / SR / 0.04) * 0.3, tb)
    # riser into the drop (2.2 .. 3.0 s)
    n = int(0.8 * SR); tt = np.arange(n) / SR
    put(out, S.hp(rng.standard_normal(n), 1500) * (tt / 0.8) ** 2 * 0.35 + np.sin(2 * np.pi * np.cumsum(200 + 900 * (tt / 0.8) ** 2) / SR) * (tt / 0.8) ** 2 * 0.15, HOOK - 0.8)
    # --- launch track, 3 s .. end
    nb = int(TOTAL / BAR) + 1
    for b in range(nb):
        t0 = HOOK + b * BAR
        if t0 >= TOTAL: break
        root, arp = CH[b % 4]
        full = 1.0 if b >= 2 else 0.75                                        # bars 1-2 build, then everything
        for k in range(4):                                                    # four-on-the-floor kick + sidechain pump
            tb = t0 + k * BEAT
            m = int(0.3 * SR); tt = np.arange(m) / SR; f = 48 + 120 * np.exp(-tt * 35)
            put(out, np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / 0.16) * 0.95, tb)
            m = int(BEAT * SR); tt = np.arange(m) / SR; pump = np.minimum(1, tt / 0.18) ** 1.5    # pumping saw bass on the off-beat
            put(out, S.lp(S.saw(S.midi(root - 12), m), 380) * pump * 0.30 * full, tb)
            if k in (1, 3):                                                   # clap
                m = int(0.18 * SR); put(out, S.bp(rng.standard_normal(m), 900, 5000) * np.exp(-np.arange(m) / SR / 0.06) * 0.42 * full, tb)
            m = int(0.12 * SR); put(out, S.hp(rng.standard_normal(m), 6500) * np.exp(-np.arange(m) / SR / 0.05) * 0.16, tb + BEAT / 2)   # open hat
        # supersaw stabs on beats 1 and the "and" of 2
        for at in (0, 1.5, 2.5):
            m = int(0.22 * SR); tt = np.arange(m) / SR; e = np.exp(-tt / 0.09)
            chord = sum(S.saw(S.midi(x), m) for x in arp[:3]) / 3
            put(out, S.lp(chord, 3200) * e * 0.20 * full, t0 + at * BEAT)
        # the ringtone hook: a bell motif over every 2 bars (original melody), from bar 2
        if b >= 1:
            MOTIF = [(0, 76), (0.5, 79), (1, 84), (1.5, 83), (2, 79), (3, 76), (3.5, 74), (4, 76), (5, 79), (5.5, 81), (6, 79)]   # beats within 2 bars
            if b % 2 == 1:
                for at, note in MOTIF:
                    m = int(0.5 * SR); tt = np.arange(m) / SR; f = S.midi(note)
                    bell = (np.sin(2 * np.pi * f * tt) + 0.5 * np.sin(2 * np.pi * f * 2.76 * tt) * np.exp(-tt / 0.08) + 0.25 * np.sin(2 * np.pi * f * 5.4 * tt) * np.exp(-tt / 0.04))
                    put(out, bell * np.exp(-tt / 0.22) * 0.13, t0 + at * BEAT)
    # silence: the beat before the myth slam; the outro rings out
    a, b = (int(x * SR) for x in STOP); out[a:b] = 0
    f = int(0.004 * SR); out[a - f:a] *= np.linspace(1, 0, f); out[b:b + f] *= np.linspace(0, 1, f)
    end = int((TOTAL - 1.2) * SR); out[end:] *= np.linspace(1, 0, N - end) ** 2
    return out


def sfx_track():
    out = np.zeros(N); fx = lambda k, L=0.8: S.sfx(k, length=L)  # noqa: E731   (sounds that need a length get one)
    # --- the hook level: steps, splash, jump, landing, three fireballs, radiation charge + zap, the slam, the drop
    for i in range(5): m = int(0.03 * SR); put(out, S.bp(rng.standard_normal(m), 300, 2500) * np.exp(-np.arange(m) / SR / 0.01) * 0.5, 0.02 + i * 0.07)
    m = int(0.7 * SR); tt = np.arange(m) / SR; put(out, S.lp(rng.standard_normal(m), 2500) * np.exp(-tt / 0.18) * 0.7, 0.45)               # splash
    m = int(0.3 * SR); tt = np.arange(m) / SR; put(out, np.sign(np.sin(2 * np.pi * np.cumsum(300 + 900 * tt / 0.3) / SR)) * np.exp(-tt / 0.15) * 0.18, 0.75)   # jump
    put(out, fx("impact"), 1.25, 0.35)                                                                                                        # landing
    for at in (1.3, 1.5, 1.7):                                                                                                                # fireballs: pew
        m = int(0.18 * SR); tt = np.arange(m) / SR; put(out, np.sign(np.sin(2 * np.pi * np.cumsum(1400 - 4000 * tt) / SR)) * np.exp(-tt / 0.07) * 0.15, at)
    m = int(0.75 * SR); tt = np.arange(m) / SR                                                                                                # radiation: charge, then zap
    put(out, np.sin(2 * np.pi * np.cumsum(120 + 2400 * (tt / 0.75) ** 2) / SR) * (0.2 + 0.8 * tt / 0.75) * 0.25 + S.bp(rng.standard_normal(m), 2000, 9000) * 0.12 * (tt / 0.75), 1.9 - 0.05)
    put(out, fx("flashHit"), 1.93, 0.6)
    put(out, fx("subImpact"), 2.55, 0.8)                                                                                                      # 49 AI ROLES?! slam
    put(out, fx("impact"), HOOK, 0.9)                                                                                                         # the drop
    # --- the body
    for k in range(2, len(SCRIPT["reel"])):
        w = fx("whoosh", 0.6); put(out, w[: int(0.5 * SR)] * np.linspace(1, 0, int(0.5 * SR)), k * SLOT - 0.22, 0.26)
    for t, n in ((18.3, 14), (21.3, 12)):
        for i in range(n): put(out, S.hp(rng.standard_normal(int(0.012 * SR)), 3000) * 0.5, t + i * 0.09 * (1 + i / 30), 0.5)
        put(out, fx("flashHit"), t + n * 0.1 + 0.25, 0.35)
    put(out, fx("typing", 1.4), 27.2, 0.35)
    put(out, fx("alarm", 0.9), 39.6, 0.25)
    put(out, fx("subImpact"), 42.0, 0.8)
    put(out, fx("scratch", 0.5), 45.1, 0.3)
    put(out, fx("resolve", 2.5), 51.0, 0.5)
    return out


def voices():
    out = np.zeros(N); place = {}
    for k, l in enumerate(SCRIPT["reel"]):
        y, sr = sf.read(ROOT / "audio/out" / f"{l['id']}.wav", dtype="float64")
        y = resample_poly(y, SR, sr) if sr != SR else y
        g = 1.41 if l["who"] == "bhai" else 1.0                               # Bhai sits +3 dB hotter (the user's "pretty loud")
        t = 0.0 if k == 0 else k * SLOT + VO_IN; put(out, y, t, g); place[l["id"]] = round(t, 3)
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
    env = S.envelope(vox, 0.01, 0.3); duck = 1 - 0.72 * np.clip(env / (0.08 + 1e-9), 0, 1)  # about -11 dB under speech: an energetic bed that still lets the words through
    mix = vox * 1.0 + mus * 0.55 * duck + fx * 0.8
    st = ROOT / "audio/out/stems_ep01"; st.mkdir(parents=True, exist_ok=True)
    for name, x in (("voice", vox), ("music", mus * 0.55 * duck), ("sfx", fx * 0.8)): sf.write(st / f"{name}.wav", x, SR, subtype="FLOAT")
    out = ROOT / "public/audio/mix_ep01.wav"; out.parent.mkdir(parents=True, exist_ok=True)
    I, tp = master(mix, out)
    beats = [round(i * BEAT, 3) for i in range(int(TOTAL / BEAT) + 1)]
    (ROOT / "audio/out/beats_ep01.json").write_text(json.dumps({"bpm": BPM, "beat": BEAT, "slot": SLOT, "total": TOTAL, "beats": beats,
        "downbeats": beats[::4], "cuts": [k * SLOT for k in range(len(SCRIPT["reel"]))], "voice_at": place, "music_stop": STOP}, indent=1), encoding="utf-8")
    print(f"-> {out}  {TOTAL:.1f} s  {I:.1f} LUFS  peak {tp:.1f} dBFS")


if __name__ == "__main__":
    main()
