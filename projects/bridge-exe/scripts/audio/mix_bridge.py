"""BRIDGE.EXE sound: an original score synthesized here (licence-clean), Liam's 10 lines at their window starts, SFX on
the reel's own events (audio/out/reel_events.json: span steps, drag snaps, the RUN, lens switches, Rapier breaks,
impacts, splashes), music ducked under the voice, mastered to -14 LUFS / -1.5 dBTP.

  120 BPM, A minor, bar 1 at 0.0 s (2 s bars); every section edge (SCENE_TIMINGS.json) is a downbeat.
  0 sub-impact + metal ring + surge | 4 lift (strings, wind) | 11 magnetic clicks on every span step / drag snap
  18 drive (dhol-like membranes, truck rumble) | RUN: the music drops out, a click, then the solver tones and a hit
  26 analysis pulse layer, a tick per lens | 35 snare accents on the A/B values | 44 metallic code-to-CAD hits
  50 arcade bass hit, fractured metal, splashes | 57 music ducks for the proof | 63 heroic resolve + CTA chime
Writes public/audio/mix_bridge.wav, audio/out/beats_bridge.json, audio/out/stems_bridge/*.wav.
    python scripts/audio/mix_bridge.py
"""
import json, pathlib, re, subprocess, sys

import numpy as np
import soundfile as sf
from scipy.signal import resample_poly

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import score as S  # noqa: E402   (sfx(), filters, envelope(); SR 48 kHz)

ROOT = HERE.parent.parent; SR = S.SR
TM = json.loads((ROOT / "SCENE_TIMINGS.json").read_text(encoding="utf-8"))
VO = json.loads((ROOT / "audio/out/lines.json").read_text(encoding="utf-8"))["lines"]
EV = json.loads((ROOT / "audio/out/reel_events.json").read_text(encoding="utf-8"))
SEC = {s["id"]: s for s in TM["sections"]}
TOTAL = TM["duration"]; N = int(TOTAL * SR)
BPM = 120; BEAT = 0.5; BAR = 2.0
RUN_T = next(e["t"] for e in EV["events"] if e["kind"] == "run")
STOP = (RUN_T - 0.32, 24.0)           # the drop: from just before the RUN press to the next downbeat
rng = np.random.default_rng(20261102)

# A minor: i - VI - III - VII (Am F C G); the CTA resolves to A major
PROG = [(45, [57, 60, 64]), (41, [57, 60, 65]), (48, [55, 60, 64]), (43, [55, 59, 62])]


def put(buf, x, t, g=1.0):
    i = int(round(t * SR))
    if i >= len(buf) or i + len(x) <= 0: return
    a = max(0, -i); j = max(0, i); m = min(len(x) - a, len(buf) - j)
    buf[j:j + m] += x[a:a + m] * g


def T(n): return np.arange(n) / SR
def kick(g=1.0, n=0.32):
    m = int(n * SR); t = T(m); f = 44 + 120 * np.exp(-t * 30)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.18) * g
def dha(g=1.0):        # low membrane with a pitch bend (dhol-like bass side), original synthesis
    m = int(0.42 * SR); t = T(m); f = 72 + 38 * np.exp(-t * 9)
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.22) + S.lp(rng.standard_normal(m), 400) * np.exp(-t / 0.02) * 0.4) * g
def tin(g=1.0):        # high slap (treble side)
    m = int(0.12 * SR); t = T(m)
    return (S.bp(rng.standard_normal(m), 1800, 6000) * np.exp(-t / 0.025) + np.sin(2 * np.pi * 620 * t) * np.exp(-t / 0.04) * 0.5) * g
def snare(g=1.0):
    m = int(0.22 * SR); t = T(m)
    return (S.bp(rng.standard_normal(m), 1200, 7000) * np.exp(-t / 0.07) + np.sin(2 * np.pi * 190 * t) * np.exp(-t / 0.05) * 0.5) * g
def hat(g=1.0):
    m = int(0.05 * SR); return S.hp(rng.standard_normal(m), 7500) * np.exp(-T(m) / 0.014) * g
def strings(notes, L, g=1.0, cut=2200, att=0.6):
    m = int(L * SR); x = sum(S.saw(S.midi(n), m, detune=0.18) for n in notes) / len(notes)
    e = np.minimum(1, T(m) / att) * np.clip((L - T(m)) / 0.5, 0, 1)
    vib = 1 + 0.004 * np.sin(2 * np.pi * 5.2 * T(m))
    return S.lp(x * vib, cut) * e * g
def drone(note, L, g=1.0):
    m = int(L * SR); t = T(m); f = S.midi(note)
    x = np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * f * 2.01 * t) + 0.25 * S.lp(S.saw(f, m), 500)
    return x * np.minimum(1, t / 1.2) * np.clip((L - t) / 1.0, 0, 1) * g
def bell(note, L=0.8, g=1.0):
    m = int(L * SR); t = T(m); f = S.midi(note)
    return (np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t / 0.1)) * np.exp(-t / 0.3) * g
def metal(f0=220, L=1.6, g=1.0):   # struck steel member: inharmonic partials
    m = int(L * SR); t = T(m)
    return sum(a * np.sin(2 * np.pi * f0 * r * t) * np.exp(-t / d) for r, a, d in [(1, 1, 1.2), (2.32, 0.6, 0.7), (4.25, 0.4, 0.35), (6.8, 0.25, 0.18)]) * g
def click(g=1.0, f=2400):         # magnetic UI click
    m = int(0.05 * SR); t = T(m)
    return (np.sin(2 * np.pi * f * t) * np.exp(-t / 0.008) + S.bp(rng.standard_normal(m), 3000, 9000) * np.exp(-t / 0.004) * 0.6) * g
def wind(L, g=1.0):
    m = int(L * SR); x = S.bp(rng.standard_normal(m), 250, 1400)
    sw = 0.6 + 0.4 * np.sin(2 * np.pi * T(m) / 5.3) * np.sin(2 * np.pi * T(m) / 2.1 + 1)
    return x * sw * np.minimum(1, T(m) / 1.5) * np.clip((L - T(m)) / 1.5, 0, 1) * g
def rumble(L, g=1.0):
    m = int(L * SR); return S.lp(rng.standard_normal(m), 120) * np.minimum(1, T(m) / 0.4) * np.clip((L - T(m)) / 0.4, 0, 1) * g


def music():
    out = np.zeros(N)
    # 0-4 hook: sub impact, metal ring, surge riser, tense toms on a quickening grid
    put(out, S.sfx("subImpact"), 0.0, 0.95); put(out, metal(110, 2.5), 0.0, 0.32)
    put(out, drone(33, 4.2, 0.35), 0.0)
    for k in range(10): put(out, dha(0.45 + 0.04 * k), 0.4 + 3.4 * (1 - (1 - k / 10) ** 1.5))
    m = int(1.0 * SR); tt = T(m)
    put(out, S.hp(rng.standard_normal(m), 1500) * (tt / 1.0) ** 2 * 0.25, 3.0)
    # bars
    for b in range(int(TOTAL / BAR)):
        t0 = b * BAR
        if t0 < 4: continue
        if t0 >= SEC["cta"]["t0"]: break
        root, ch = PROG[b % 4]
        reveal = t0 < SEC["geometry"]["t0"]
        drive = SEC["load"]["t0"] <= t0 < SEC["lenses"]["t0"]
        analysis = SEC["lenses"]["t0"] <= t0 < SEC["arcade"]["t0"]
        arcade = SEC["arcade"]["t0"] <= t0 < SEC["evidence"]["t0"]
        proof = SEC["evidence"]["t0"] <= t0 < SEC["cta"]["t0"]
        put(out, strings([n + 12 for n in ch] if not reveal else ch, BAR + 0.4, 0.2 if reveal else 0.14, 1600 if reveal else 2400), t0)
        put(out, drone(root - 12, BAR + 0.3, 0.22 if not proof else 0.12), t0)
        if reveal: continue                                       # the reveal is strings + wind only (the lift)
        g = 0.55 if proof else 1.0
        for k in range(4):
            tb = t0 + k * BEAT
            if not proof: put(out, kick(0.8 * g), tb)
            put(out, hat(0.1 * g), tb + BEAT / 2)
            if drive or arcade:
                put(out, dha(0.5), tb); put(out, tin(0.22), tb + BEAT * 0.75)
                if k in (1, 3): put(out, tin(0.3), tb + BEAT / 2)
            if analysis and k in (1, 3): put(out, snare(0.3), tb)
        if analysis or proof:                                     # the analysis pulse: a soft 16th pluck in the chord
            for k in range(16):
                n = ch[k % 3] + 12
                mm = int(0.14 * SR); put(out, S.lp(S.saw(S.midi(n), mm), 2200) * np.exp(-T(mm) / 0.05) * (0.05 if proof else 0.07), t0 + k * BEAT / 4)
    put(out, wind(TOTAL, 0.07), 0.0)
    # the RUN drop: silence, then the music re-enters on the next downbeat
    a, b = (int(x * SR) for x in STOP); out[a:b] = 0
    f = int(0.005 * SR); out[a - f:a] *= np.linspace(1, 0, f); out[b:b + f] *= np.linspace(0, 1, f)
    # 63: heroic resolve (A major) + ring-out
    c = SEC["cta"]["t0"]
    put(out, S.sfx("subImpact"), c, 0.8); put(out, kick(1.1, 0.6), c)
    put(out, strings([57, 61, 64, 69, 73], 6.6, 0.32, 3200, 0.2), c); put(out, drone(33, 7.0, 0.3), c)
    for at, n in [(0, 69), (0.25, 73), (0.5, 76), (0.75, 81)]: put(out, bell(n, 1.8, 0.16), c + at)
    end = int((TOTAL - 1.2) * SR); out[end:] *= np.linspace(1, 0, N - end) ** 2
    return out


def sfx_track():
    out = np.zeros(N); fx = lambda k, L=0.8: S.sfx(k, length=L)  # noqa: E731
    put(out, fx("whoosh", 1.4), SEC["reveal"]["t0"] - 0.2, 0.3)                   # crane out of the fog
    for e in EV["events"]:
        t, k = e["t"], e["kind"]
        if t < SEC["geometry"]["t0"]: continue                                     # (the scan's initial state)
        if k == "span": put(out, click(0.5, 2000), t); put(out, fx("mechClick"), t, 0.35)
        elif k == "snap": put(out, click(0.45, 2600 + 120 * e["v"] * 4), t)
        elif k == "run": put(out, fx("mechClick"), t - 0.13, 0.6)                  # the press
        elif k == "lens": put(out, fx("whoosh", 0.5), t - 0.06, 0.18); put(out, click(0.3, 3200), t)
    g = SEC["geometry"]["t0"]
    put(out, fx("magLock"), g + 3.45, 0.45)                                        # grabbing the joint
    ld = SEC["load"]["t0"]
    put(out, rumble(3.8, 0.55), ld + 0.25); put(out, fx("whoosh", 1.2), ld + 0.2, 0.2)
    # solver reveal: result tones, then the hit on the next downbeat
    put(out, fx("dataBurst", 0.7), RUN_T + 0.05, 0.3)
    for i, n in enumerate([76, 79, 83]): put(out, bell(n, 0.5, 0.12), RUN_T + 0.06 + i * 0.09)
    put(out, fx("impact"), RUN_T + 0.02, 0.55)
    cp = SEC["compare"]["t0"]
    put(out, fx("whoosh", 0.6), cp - 0.1, 0.25)
    for at in (1.9, 2.15, 2.4, 4.6): put(out, snare(0.35), cp + at)                # the delta rows land
    cad = SEC["cad"]["t0"]
    put(out, metal(330, 1.0, 0.25), cad); put(out, fx("typing", 1.0), cad + 0.2, 0.25)
    for at in (1.3, 2.3, 3.2, 3.9): put(out, metal(440 + 60 * at, 0.6, 0.18), cad + at); put(out, click(0.35, 2800), cad + at)
    # arcade: bass hit at the release, fractured metal on breaks, thuds on impacts, splashes
    ar = EV["arcade"]; t0 = ar["t0"]
    put(out, S.sfx("subImpact"), t0 + 0.3, 0.9); put(out, fx("whoosh", 1.6), t0 + 0.4, 0.35)
    last = {"break": -9, "impact": -9, "splash": -9}
    for bu in ar["bursts"]:
        t, k = t0 + bu["t"], bu["kind"]
        if t >= SEC["evidence"]["t0"] - 0.3 or t - last[k] < (0.09 if k == "break" else 0.16): continue
        last[k] = t
        if k == "break": put(out, metal(180 + 140 * rng.random(), 0.9, 0.16), t)
        elif k == "impact": put(out, kick(0.5, 0.35), t); put(out, S.bp(rng.standard_normal(int(0.3 * SR)), 300, 3000) * np.exp(-T(int(0.3 * SR)) / 0.08) * 0.25, t)
        else: put(out, S.bp(rng.standard_normal(int(0.9 * SR)), 500, 6000) * np.exp(-T(int(0.9 * SR)) / 0.25) * 0.3, t)
    ev = SEC["evidence"]["t0"]
    put(out, fx("typing", 1.1), ev + 0.25, 0.22)
    cta = SEC["cta"]["t0"]
    cw = next(w["t0"] for l in TM["lines"] if l["id"] == "v10" for w in l["words"] if w["w"].lower().startswith("comment"))
    put(out, bell(88, 1.2, 0.22), cw - 0.12); put(out, bell(93, 1.2, 0.16), cw - 0.02)   # the CTA chime
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
    env = S.envelope(vox, 0.01, 0.3); duck = 1 - 0.7 * np.clip(env / 0.08, 0, 1)
    mix = vox * 1.0 + mus * 0.42 * duck + fx * 0.7
    st = ROOT / "audio/out/stems_bridge"; st.mkdir(parents=True, exist_ok=True)
    for name, x in (("voice", vox), ("music", mus * 0.42 * duck), ("sfx", fx * 0.7)): sf.write(st / f"{name}.wav", x, SR, subtype="FLOAT")
    out = ROOT / "public/audio/mix_bridge.wav"; out.parent.mkdir(parents=True, exist_ok=True)
    I, tp = master(mix, out)
    # a music-only master too (no VO), for the "music only" deliverable / Instagram's own audio choices
    I2, tp2 = master(mus * 0.6 + fx * 0.7, ROOT / "public/audio/music_only_bridge.wav")
    beats = [round(i * BEAT, 3) for i in range(int(TOTAL / BEAT) + 1)]
    (ROOT / "audio/out/beats_bridge.json").write_text(json.dumps({"bpm": BPM, "beat": BEAT, "bar1": 0.0, "total": TOTAL, "beats": beats,
        "downbeats": beats[::4], "voice_at": place, "music_stop": STOP, "run": RUN_T, "sections": TM["sections"]}, indent=1), encoding="utf-8")
    print(f"-> {out}  {TOTAL:.1f} s  {I:.1f} LUFS  peak {tp:.1f} dBFS   | music only {I2:.1f} LUFS {tp2:.1f} dBFS")


if __name__ == "__main__":
    main()
