"""V3 showcase score: an original 120 BPM electronic track, exactly 90.0 s (45 bars), synthesized here (no samples), laid
out by src/v3/timeline.json so every shot change lands on a downbeat with a hit.

  intro  (bars 0-1)  ambient pad swell, soft pulse, a whoosh as the card turns
  build  (bars 2-3)  title: riser + snare roll + filter sweep; the last 2 beats are silent (the point collapses)
  drop1  (bars 4-19) games: four-on-the-floor, claps, off-beat hats, sidechained supersaw chords, sub bass, lead hook
  break  (bars 20-29) 3D worlds: half-time groove, wide pads, plucks
  drop2  (bars 30-39) web: full groove again, pluck lead
  finale (bars 40-44) a hit on every beat of the recap bar, then the closing chord and tail
Progression A minor: Am - F - C - G (one chord per bar).   python audio-src/score_v3.py -> public/audio/music_v3.wav (-14 LUFS)
"""
import json, pathlib, sys

import numpy as np
import soundfile as sf

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parent
sys.path.insert(0, str(HERE))
import score as S  # noqa: E402  (synth helpers)

SR = S.SR
TL = json.loads((ROOT / "src/v3/timeline.json").read_text(encoding="utf-8"))
BPM = TL["bpm"]; BEAT = 60 / BPM; BAR = 4 * BEAT
shots, b = [], 0
for s in TL["shots"]: shots.append({**s, "b0": b}); b += s["bars"]
NB = b; TOTAL = NB * BAR; N = int(round(TOTAL * SR))
section_of_bar = [next(s["section"] for s in shots if s["b0"] <= i < s["b0"] + s["bars"]) for i in range(NB)]
CH = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]]          # Am F C G
ROOT_N = [45, 41, 36, 43]
midi = S.midi
rng = np.random.default_rng(90)


def T(n): return np.arange(n) / SR
def place(buf, t, x, g=1.0):
    k = int(round(t * SR)); m = min(len(x), len(buf) - k)
    if m > 0 and k >= 0: buf[k:k + m] += x[:m] * g


def supersaw(f, n, voices=5, spread=0.012):
    y = np.zeros(n)
    for v in range(voices):
        d = (v - (voices - 1) / 2) / ((voices - 1) / 2) * spread
        y += S.saw(f * (1 + d), n, 12) * (1.0 if v == voices // 2 else 0.7)
    return y / voices


def kick():
    n = int(0.45 * SR); t = T(n)
    return np.sin(2 * np.pi * np.cumsum(42 + 110 * np.exp(-t * 38)) / SR) * np.exp(-t / 0.2) + S.bp(rng.standard_normal(n), 1500, 6000) * np.exp(-t / 0.004) * 0.3


def clap():
    n = int(0.3 * SR); t = T(n); x = S.bp(rng.standard_normal(n), 900, 6000)
    e = sum(np.exp(-np.maximum(0, t - d) / 0.012) * (t >= d) for d in (0, 0.011, 0.022)) * 0.6 + np.exp(-t / 0.09) * 0.5
    return x * e


def hat(open_=False):
    n = int((0.22 if open_ else 0.05) * SR); t = T(n)
    return S.hp(rng.standard_normal(n), 7500) * np.exp(-t / (0.07 if open_ else 0.012))


def build():
    st = {k: np.zeros(N) for k in ("drums", "bass", "chords", "lead", "pad", "fx")}
    lead_pat = [0, None, 2, None, 4, 3, None, 2, 0, None, 2, 4, 5, None, 4, 2]   # scale-degree hook per bar (8ths)
    scale = [57, 60, 62, 64, 67, 69, 72]                                           # A minor pentatonic-ish
    for bi in range(NB):
        sec = section_of_bar[bi]; t0 = bi * BAR; ch, rn = CH[bi % 4], ROOT_N[bi % 4]
        full = sec in ("drop1", "drop2", "finale") and not (sec == "finale" and bi > shots[-1]["b0"])
        half = sec == "break"
        nb = int(BAR * SR) + int(0.5 * SR)
        # pads (everywhere, wider in intro/break)
        pad = sum(S.saw(midi(x), nb, 8, d) for x, d in zip(ch + [ch[0] + 12], (0, .003, -.002, .0015)))
        lvl = {"intro": 0.09, "build": 0.07, "drop1": 0.035, "break": 0.08, "drop2": 0.035, "finale": 0.05}[sec]
        place(st["pad"], t0, S.lp(pad, 1800 if sec != "intro" else 900) * S.adsr(nb, 0.5 if sec in ("intro", "break") else 0.08, 0.5), lvl)
        if sec == "build":   # filter-swept saw stabs opening up toward the drop
            for q in range(8):
                fc = 400 + 5000 * ((bi - shots[1]["b0"]) * 8 + q) / 16
                n8 = int(BEAT / 2 * SR); y = S.lp(supersaw(midi(ch[0]), n8) + supersaw(midi(ch[2]), n8), fc) * np.exp(-T(n8) / 0.12)
                place(st["chords"], t0 + q * BEAT / 2, y, 0.16)
        if full or half:
            for q in range(16):                               # sixteenth grid
                tq = t0 + q * BEAT / 4
                if full and q % 4 == 0: place(st["drums"], tq, kick(), 0.9)
                if half and q in (0, 10): place(st["drums"], tq, kick(), 0.8)
                if full and q in (4, 12): place(st["drums"], tq, clap(), 0.35)
                if half and q == 8: place(st["drums"], tq, clap(), 0.3)
                if q % 4 == 2: place(st["drums"], tq, hat(open_=full), 0.10 if full else 0.07)
                elif q % 2 == 1: place(st["drums"], tq, hat(), 0.05)
            for q in range(8):                                # bass on eighths (off-beat pump in drops)
                if full and q % 2 == 0: continue
                n8 = int(BEAT / 2 * SR); f = midi(rn)
                y = S.lp(S.saw(f, n8, 8) * 0.5 + np.sin(2 * np.pi * f / 2 * T(n8)) * 0.8, 600) * np.exp(-T(n8) / 0.18)
                place(st["bass"], t0 + q * BEAT / 2, y, 0.22 if full else 0.16)
            if full:                                          # sidechained supersaw chord stabs on the off-beats
                for q in range(4):
                    n4 = int(BEAT * 0.5 * SR)
                    y = S.lp(sum(supersaw(midi(x), n4) for x in ch), 4200) * np.exp(-T(n4) / 0.16)
                    place(st["chords"], t0 + q * BEAT + BEAT / 2, y, 0.11)
                for q, deg in enumerate(lead_pat):           # lead hook
                    if deg is None: continue
                    note = scale[deg] + (12 if sec == "drop2" else 0)
                    n8 = int(BEAT / 2 * SR * 0.9); f = midi(note)
                    y = (S.saw(f, n8, 6) * 0.35 + np.sin(2 * np.pi * f * T(n8)) * 0.6) * np.exp(-T(n8) / (0.11 if sec == "drop2" else 0.2))
                    place(st["lead"], t0 + q * BEAT / 2, S.lp(y, 5200), 0.10)
            if half:                                          # plucks
                for q in range(8):
                    note = (ch + [ch[0] + 12])[[0, 1, 2, 3, 2, 1, 3, 2][q]] + 12
                    n8 = int(0.3 * SR); f = midi(note)
                    place(st["lead"], t0 + q * BEAT / 2, np.sin(2 * np.pi * f * T(n8)) * np.exp(-T(n8) / 0.09), 0.06)
        if sec == "intro":                                    # soft heartbeat pulse
            for q in range(4): place(st["drums"], t0 + q * BEAT, kick() * np.linspace(1, 0.3, len(kick())), 0.25)
    # build: snare roll + riser, then 2 beats of silence before the drop
    tb = shots[1]["b0"] * BAR; tdrop = shots[2]["b0"] * BAR
    roll_t = tb
    while roll_t < tdrop - 2 * BEAT:
        k = (roll_t - tb) / (tdrop - 2 * BEAT - tb); step = BEAT / (2 if k < 0.5 else 4 if k < 0.8 else 8)
        place(st["drums"], roll_t, clap(), 0.12 + 0.25 * k); roll_t += step
    place(st["fx"], tb, S.sfx("riser", tdrop - tb - 2 * BEAT), 0.9)
    k0, k1 = int((tdrop - 2 * BEAT) * SR), int(tdrop * SR)
    for k in st: st[k][k0:k1] *= 0.0
    # sidechain pump on everything tonal in the drops
    beat_ph = (T(N) % BEAT) / BEAT; pump = 1 - 0.55 * np.exp(-beat_ph * 8)
    drop_mask = np.zeros(N)
    for bi in range(NB):
        if section_of_bar[bi] in ("drop1", "drop2"): drop_mask[int(bi * BAR * SR):int((bi + 1) * BAR * SR)] = 1
    for k in ("chords", "pad", "lead", "bass"): st[k] *= 1 - drop_mask * (1 - pump)
    # shot changes: impact + whoosh on each cut (drops), shimmer in the break, a hit per beat on the recap bar
    for s in shots[2:]:
        t = s["b0"] * BAR
        if s["section"] in ("drop1", "drop2"):
            place(st["fx"], t, S.sfx("impact"), 0.55 if s is not shots[2] else 1.0); place(st["fx"], t - 0.35, S.sfx("whoosh", 0.4), 0.35)
        elif s["section"] == "break":
            place(st["fx"], t, S.sfx("glass", pitch=1.0), 0.45); place(st["fx"], t - 0.5, S.sfx("whoosh", 0.55), 0.25)
    place(st["fx"], tdrop, S.sfx("subImpact"), 1.0)
    fin = shots[-1]["b0"] * BAR
    for q in range(4): place(st["fx"], fin + q * BEAT, S.sfx("impact"), 0.6); place(st["fx"], fin + q * BEAT, S.sfx("mechClick"), 0.4)
    place(st["fx"], fin - 0.6, S.sfx("riser", 0.6), 0.5)
    # closing chord + tail over the last 4 bars
    tc = fin + BAR; n = int((TOTAL - tc) * SR)
    chord = sum(supersaw(midi(x), n, 5, 0.008) for x in (45, 57, 60, 64, 69)) * S.adsr(n, 0.02, 2.0) * np.exp(-T(n) / 4.5)
    place(st["chords"], tc, S.lp(chord, 3000), 0.12); place(st["fx"], tc, S.sfx("resolve"), 0.8)
    place(st["fx"], 0.0, S.sfx("riseTone", 3.6), 0.35); place(st["fx"], shots[1]["b0"] * BAR - 0.5, S.sfx("whoosh", 0.6), 0.5)
    return st


def main():
    st = build()
    mix = st["drums"] * 1.0 + st["bass"] * 1.0 + st["chords"] * 1.0 + st["lead"] * 1.0 + st["pad"] * 1.0 + st["fx"] * 0.9
    mix = np.tanh(mix * 1.2) / 1.2
    O = HERE / "out" / "v3"; O.mkdir(parents=True, exist_ok=True)
    for k, x in st.items(): sf.write(O / f"stem_{k}.wav", x.astype(np.float32), SR)
    raw = O / "music_raw.wav"; sf.write(raw, np.stack([mix, mix], 1).astype(np.float32), SR)
    outp = ROOT / "public" / "audio" / "music_v3.wav"
    I, tp = S.loudnorm(raw, outp)
    print(f"v3 music: {TOTAL:.2f} s ({NB} bars at {BPM} BPM), {I:.1f} LUFS, true peak {tp:.1f} dBFS -> {outp.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
