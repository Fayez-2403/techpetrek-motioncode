"""Ep 01 sound (v5: the user's new intro hook, loud and 20 % faster, over a faster game level; the hook owns its own
length, rounded up to a half beat, and every later line keeps a 3 s slot after it): an original 8-bit score (synthesized here, licence-clean), the two hosts' lines in their fixed 3 s slots,
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
SLOT = SCRIPT["slot"]
BPM = 120; BEAT = 60 / BPM; BAR = 4 * BEAT
VO_IN = 0.08                       # a line starts this long after its slot's cut (s01 at 0: the hook speaks on frame 0)
# the hook: as long as the intro line + 0.2 s, rounded up to a half beat (the launch track drops when it ends)
HOOK = math.ceil((LINES["s01"]["dur"] + 0.2) / (BEAT / 2)) * (BEAT / 2)
SHIFT = HOOK - 3.0                 # every v4 body time moves by this much (the v4 hook was 3 s)
TOTAL = HOOK + SLOT * (len(SCRIPT["reel"]) - 1); N = int(TOTAL * SR)
STOP = (41.75 + SHIFT, 42.0 + SHIFT)   # music silent: the beat before "Lekin 49 employees hire nahi hue!"
slot_at = lambda k: 0.0 if k == 0 else HOOK + (k - 1) * SLOT  # noqa: E731


def hook_events():
    """the game level's beats, derived from the intro's own word times (picture and sound both read this file)"""
    W = LINES["s01"]["words"]
    def at(word, nth=0):
        hits = [w["t0"] for w in W if w["w"].lower().strip("?!,.…").startswith(word.lower())]
        return hits[nth] if len(hits) > nth else hits[-1]
    solo, games1, gh, lead, n49, agents, maze = at("solo"), at("games"), at("github"), at("lead"), at("49"), at("agents"), at("mazedaar")
    games2 = at("games", 1)
    ev = {
        "_doc": "Written by scripts/audio/mix_ep01.py from the intro's word times (audio/out/lines_duo.json s01). The hook (src/ep01/hook.tsx) and the mix both read it; never retime by hand.",
        "hook": HOOK, "solo": solo, "github": gh, "lead": lead, "n49": n49, "agents": agents, "mazedaar": maze, "games2": games2,
        "coins": [0.12, 0.26, 0.4, 0.54, solo + 0.95, solo + 1.1, at("saare"), at("saare") + 0.15, at("saare") + 0.3, at("saare") + 0.45, at("saare") + 0.6],
        "dive": [solo + 0.2, solo + 0.72], "splash": solo + 0.38,
        "jumpBlock": [games1 - 0.12, games1 + 0.34], "bump": games1 + 0.08,
        "fire": [gh - 0.68, gh - 0.53, gh - 0.38], "bugHit": [gh - 0.44, gh - 0.29, gh - 0.14],
        "chest": gh, "charge": gh + 0.42, "radiation": gh + 0.82,
        "pipes": [at("unity"), at("unreal"), at("godot")],
        "flag": [maze - 0.5, maze + 0.12], "fireworks": [games2, games2 + 0.2, games2 + 0.4],
    }
    ev = {k: (round(v, 3) if isinstance(v, float) else [round(x, 3) for x in v] if isinstance(v, list) else v) for k, v in ev.items()}
    (ROOT / "src/ep01/hook_events.json").write_text(json.dumps(ev, indent=1), encoding="utf-8")
    return ev


EV = hook_events()
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
    # --- hook: a FAST bright 8-bit level loop (160 BPM sixteenth arps + triangle bass + noise snare), 0 .. HOOK
    HB = 60 / 160
    for k in range(int(HOOK / (HB / 4))):
        tb = k * HB / 4; root, arp = CH[(k // 16) % 4]
        n = int(HB / 4 * SR * 0.8); e = np.exp(-np.arange(n) / SR / 0.04)
        put(out, tone("sq", S.midi(arp[k % 4] + 12), n, 0.125) * e * 0.12, tb)
        if k % 2 == 0: put(out, tone("tri", S.midi(root - 12), n) * np.exp(-np.arange(n) / SR / 0.1) * 0.35, tb)
        if k % 8 == 4: m = int(0.1 * SR); put(out, S.bp(rng.standard_normal(m), 1500, 8000) * np.exp(-np.arange(m) / SR / 0.04) * 0.3, tb)
        if k % 4 == 0: m = int(0.12 * SR); tt = np.arange(m) / SR; put(out, np.sin(2 * np.pi * np.cumsum(55 + 110 * np.exp(-tt * 40)) / SR) * np.exp(-tt / 0.08) * 0.45, tb)   # chip kick
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
    # --- the hook level (times from src/ep01/hook_events.json): coins, splash, jumps, fireballs, bug pops, the chest,
    #     radiation, three pipes, agents joining, the flag, fireworks, the drop
    E = EV
    def chip(f0, f1, L, g, at, wave="sq"):
        m = int(L * SR); tt = np.arange(m) / SR; f = f0 + (f1 - f0) * tt / L
        ph = np.cumsum(f) / SR; y = np.sign(np.sin(2 * np.pi * ph)) if wave == "sq" else np.sin(2 * np.pi * ph)
        put(out, y * np.exp(-tt / (L * 0.5)) * g, at)
    for i in range(8): m = int(0.03 * SR); put(out, S.bp(rng.standard_normal(m), 300, 2500) * np.exp(-np.arange(m) / SR / 0.01) * 0.45, 0.02 + i * 0.06)   # footsteps
    for c in E["coins"]: chip(988, 988, 0.06, 0.09, c); chip(1319, 1319, 0.16, 0.09, c + 0.06)                                          # coin
    m = int(0.7 * SR); tt = np.arange(m) / SR; put(out, S.lp(rng.standard_normal(m), 2500) * np.exp(-tt / 0.18) * 0.7, E["splash"])  # splash
    chip(300, 1200, 0.3, 0.16, E["dive"][1] - 0.05)                                                                                     # leap out
    chip(300, 1200, 0.3, 0.16, E["jumpBlock"][0]); put(out, fx("mechClick"), E["bump"], 0.5); chip(660, 880, 0.2, 0.1, E["bump"] + 0.05)
    for at in E["fire"]: chip(1400, 300, 0.18, 0.14, at)                                                                                # pew
    for at in E["bugHit"]: chip(220, 80, 0.12, 0.2, at); put(out, S.bp(rng.standard_normal(int(0.08 * SR)), 800, 5000) * 0.25, at)    # bug pop
    put(out, fx("glass"), E["chest"], 0.45); chip(523, 1047, 0.35, 0.1, E["chest"])                                                     # the repo chest opens
    m = int(0.4 * SR); tt = np.arange(m) / SR
    put(out, np.sin(2 * np.pi * np.cumsum(120 + 2400 * (tt / 0.4) ** 2) / SR) * (0.2 + 0.8 * tt / 0.4) * 0.25, E["charge"])          # radiation charge
    put(out, fx("flashHit"), E["radiation"], 0.6)
    for at in E["pipes"]: chip(250, 1000, 0.25, 0.15, at - 0.12); put(out, fx("impact"), at, 0.25)                                     # a hop per engine pipe
    for i in range(14): chip(880 + 40 * i, 880 + 40 * i, 0.05, 0.06, E["lead"] + (E["agents"] - E["lead"]) * i / 13)                   # agents join
    put(out, fx("whoosh", 0.6), E["flag"][0], 0.3); chip(200, 1600, 0.6, 0.12, E["flag"][0])          # the flag run
    for at in E["fireworks"]: put(out, S.bp(rng.standard_normal(int(0.4 * SR)), 1500, 9000) * np.exp(-np.arange(int(0.4 * SR)) / SR / 0.1) * 0.3, at)
    put(out, fx("impact"), HOOK, 0.9)                                                                                                    # the drop
    # --- the body
    for k in range(2, len(SCRIPT["reel"])):
        w = fx("whoosh", 0.6); put(out, w[: int(0.5 * SR)] * np.linspace(1, 0, int(0.5 * SR)), slot_at(k) - 0.22, 0.26)
    for t, n in ((18.3 + SHIFT, 14), (21.3 + SHIFT, 12)):
        for i in range(n): put(out, S.hp(rng.standard_normal(int(0.012 * SR)), 3000) * 0.5, t + i * 0.09 * (1 + i / 30), 0.5)
        put(out, fx("flashHit"), t + n * 0.1 + 0.25, 0.35)
    put(out, fx("typing", 1.4), 27.2 + SHIFT, 0.35)
    put(out, fx("alarm", 0.9), 39.6 + SHIFT, 0.25)
    put(out, fx("subImpact"), 42.0 + SHIFT, 0.8)
    put(out, fx("scratch", 0.5), 45.1 + SHIFT, 0.3)
    put(out, fx("resolve", 2.5), 51.0 + SHIFT, 0.5)
    return out


def voices():
    out = np.zeros(N); place = {}
    for k, l in enumerate(SCRIPT["reel"]):
        y, sr = sf.read(ROOT / "audio/out" / f"{l['id']}.wav", dtype="float64")
        y = resample_poly(y, SR, sr) if sr != SR else y
        g = {"bhai": 1.41, "hook": 1.6}.get(l["who"], 1.0)                    # Bhai +3 dB (the user's "pretty loud"); the intro +4 dB, "loud and clear"
        t = 0.0 if k == 0 else slot_at(k) + VO_IN; put(out, y, t, g); place[l["id"]] = round(t, 3)
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
        "downbeats": beats[::4], "hook": HOOK, "cuts": [slot_at(k) for k in range(len(SCRIPT["reel"]))], "voice_at": place, "music_stop": STOP}, indent=1), encoding="utf-8")
    print(f"-> {out}  {TOTAL:.1f} s  {I:.1f} LUFS  peak {tp:.1f} dBFS")


if __name__ == "__main__":
    main()
