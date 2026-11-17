"""Ep 01 video carousel sound (2026-11-02). Original, synthesized here (licence-clean); no voice.
  Slide 1 (12 s): a 120 BPM 8-bit loop (C Am F G); a hit on frame 0; a zoom whoosh into the first game, a whip on each
    game change, a whoosh back to the grid; while a game is full-frame, ONLY that game's own sounds play (the times come
    from audio/out/carousel_events.json, written from the same sim the picture draws); a buzzer on the strike, a 0.25 s
    stop, then the impact + power-up arpeggio on "1 DEV + 49 AI AGENTS"; the last 0.4 s fade so the loop is clean.
  Slides 2-7 (6 s each): a soft 120 BPM bed (pad, pluck arps, light kick and hats), a pop on every reveal time in
    src/carousel/events.json, typing under the terminal, a stamp hit on LAST, an impact on the CTA.
Each file is mastered to -14 LUFS, true peak under -1.5 dBTP: public/audio/carousel_s1.wav .. carousel_s7.wav.
    npx tsx scripts/carousel_events.ts && python scripts/audio/mix_carousel.py
"""
import json, pathlib, re, subprocess, sys

import numpy as np
import soundfile as sf

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import score as S  # noqa: E402

ROOT = HERE.parent.parent; SR = S.SR
EV = json.loads((ROOT / "src/carousel/events.json").read_text(encoding="utf-8"))
GAME = json.loads((ROOT / "audio/out/carousel_events.json").read_text(encoding="utf-8"))["events"]
BEAT = 60 / EV["bpm"]; BAR = 4 * BEAT
CH = [(48, [60, 64, 67, 72]), (45, [57, 60, 64, 69]), (41, [53, 57, 60, 65]), (43, [55, 59, 62, 67])]   # C Am F G
rng = np.random.default_rng(7)


def tone(kind, f, n, duty=0.25):
    ph = np.cumsum(np.full(n, f / SR) if np.isscalar(f) else f / SR) % 1.0
    if kind == "sq": return np.where(ph < duty, 1.0, -1.0)
    if kind == "tri": return 4 * np.abs(ph - 0.5) - 1
    return np.sin(2 * np.pi * ph)


def put(buf, x, t, g=1.0):
    i = int(round(t * SR))
    if i >= len(buf) or i + len(x) <= 0: return
    a = max(0, -i); j = max(0, i); m = min(len(x) - a, len(buf) - j)
    buf[j:j + m] += x[a:a + m] * g


def chip(buf, f0, f1, L, g, at, kind="sq", duty=0.5):
    m = int(L * SR); tt = np.arange(m) / SR
    put(buf, tone(kind, f0 + (f1 - f0) * tt / L, m, duty) * np.exp(-tt / (L * 0.5)), at, g)


def noise_hit(buf, lo, hi, L, tau, g, at):
    m = int(L * SR); put(buf, S.bp(rng.standard_normal(m), lo, hi) * np.exp(-np.arange(m) / SR / tau), at, g)


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


# ------------------------------------------------------------------------------------------------ slide 1
def slide1():
    s1 = EV["s1"]; dur = s1["dur"]; N = int(dur * SR)
    mus, fx = np.zeros(N), np.zeros(N)
    stop = (s1["answer"] - 0.25, s1["answer"])
    for k in range(int(dur / (BEAT / 4))):                        # sixteenths
        tb = k * BEAT / 4; root, arp = CH[int(tb // BAR) % 4]
        n = int(BEAT / 4 * SR * 0.85); e = np.exp(-np.arange(n) / SR / 0.05)
        put(mus, tone("sq", S.midi(arp[k % 4] + 12), n, 0.125) * e, tb, 0.10)
        if k % 2 == 0: put(mus, tone("tri", S.midi(root - 12), n) * np.exp(-np.arange(n) / SR / 0.12), tb, 0.36)
        if k % 4 == 0:                                            # chip kick on every beat
            m = int(0.14 * SR); tt = np.arange(m) / SR
            put(mus, np.sin(2 * np.pi * np.cumsum(50 + 120 * np.exp(-tt * 38)) / SR) * np.exp(-tt / 0.09), tb, 0.55)
        if k % 8 == 4: noise_hit(mus, 1500, 8000, 0.1, 0.04, 0.32, tb)          # snare on 2 and 4
        if k % 2 == 1: noise_hit(mus, 7000, 16000, 0.03, 0.012, 0.10, tb)        # hats
    # a lead motif over bars 2-4 (original): it lifts the punch-ins
    MOT = [(0, 79), (0.5, 76), (1, 79), (1.5, 84), (2.5, 83), (3, 79), (4, 81), (4.5, 79), (5, 76), (6, 74), (6.5, 76)]
    for bar0 in (1, 3):
        for at, nt in MOT:
            m = int(0.22 * SR); put(mus, tone("sq", S.midi(nt), m, 0.25) * np.exp(-np.arange(m) / SR / 0.12), bar0 * BAR + at * BEAT, 0.07)
    a, b = (int(x * SR) for x in stop); mus[a:b] = 0
    f = int(0.005 * SR); mus[a - f:a] *= np.linspace(1, 0, f); mus[b:b + f] *= np.linspace(0, 1, f)

    put(fx, S.sfx("impact"), 0.0, 0.55)                                         # frame 0: the hook lands
    F = s1["focus"]
    put(fx, S.sfx("whoosh", length=0.45), F[0][0] - 0.12, 0.5)                  # zoom into the first game
    for a0, _ in F[1:]: put(fx, S.sfx("whoosh", length=0.3), a0 - 0.06, 0.45)   # whips
    put(fx, S.sfx("whoosh", length=0.45), F[-1][1] - 0.1, 0.4)                  # back to the grid
    games = ["pf", "sh", "bt", "pz"]
    for e in GAME:
        g = games.index(e["game"]); a0, b0 = F[g]
        if not (a0 + 0.05 <= e["t"] < b0 - 0.02): continue
        t, k = e["t"], e["kind"]
        if k == "jump": chip(fx, 280, 900, 0.22, 0.16, t)
        elif k == "land": noise_hit(fx, 200, 1500, 0.06, 0.02, 0.25, t)
        elif k == "coin": chip(fx, 988, 988, 0.07, 0.12, t); chip(fx, 1319, 1319, 0.2, 0.12, t + 0.07)
        elif k == "pew": chip(fx, 1700, 500, 0.12, 0.10, t)
        elif k == "boom": noise_hit(fx, 150, 4000, 0.28, 0.08, 0.45, t); chip(fx, 160, 50, 0.2, 0.25, t, "tri")
        elif k in ("zap", "zap2"): chip(fx, 2200 if k == "zap" else 1700, 900, 0.07, 0.07, t, "sq", 0.3)
        elif k == "ko": put(fx, S.sfx("subImpact"), t, 0.5); chip(fx, 600, 120, 0.35, 0.14, t)
        elif k == "blast": chip(fx, 300, 1800, 0.38, 0.13, t, "sin"); noise_hit(fx, 800, 6000, 0.4, 0.15, 0.22, t + 0.38)
        elif k == "swap": noise_hit(fx, 1500, 5000, 0.05, 0.015, 0.2, t)
        elif k.startswith("pop"):
            c = int(k[3:]); base = [72, 76, 79, 84][c - 1]
            for j, d in enumerate((0, 4, 7)): m = int(0.25 * SR); put(fx, np.sin(2 * np.pi * S.midi(base + d) * np.arange(m) / SR) * np.exp(-np.arange(m) / SR / 0.08), t + j * 0.035, 0.16)
    # the strike, the stop, the answer, the swipe
    chip(fx, 300, 90, 0.3, 0.22, s1["strike"], "sq", 0.5); noise_hit(fx, 800, 4000, 0.2, 0.06, 0.25, s1["strike"])
    put(fx, S.sfx("impact"), s1["answer"], 0.9); put(fx, S.sfx("flashHit"), s1["answer"], 0.35)
    for j, nt in enumerate((72, 76, 79, 84, 88, 91)): chip(fx, S.midi(nt), S.midi(nt), 0.12, 0.10, s1["answer"] + 0.06 + j * 0.055, "sq", 0.25)
    chip(fx, 1200, 1600, 0.08, 0.10, s1["swipe"], "sin")
    x = mus + fx
    end = int((dur - 0.4) * SR); x[end:] *= np.linspace(1, 0, N - end) ** 1.5
    return x


# ------------------------------------------------------------------------------------------------ slides 2-7
def bed(dur, rot):
    N = int(dur * SR); out = np.zeros(N)
    for b in range(int(np.ceil(dur / BAR))):
        root, arp = CH[(b + rot) % 4]; t0 = b * BAR
        m = int(BAR * SR); tt = np.arange(m) / SR; env = np.minimum(1, tt / 0.3) * np.minimum(1, (BAR - tt) / 0.3)
        pad = sum(S.lp(S.saw(S.midi(n), m), 1200) for n in arp[:3]) / 3
        put(out, pad * env, t0, 0.10)
        for k in range(8):                                        # pluck arps on eighths
            tb = t0 + k * BEAT / 2; m = int(0.3 * SR); tt = np.arange(m) / SR
            put(out, np.sin(2 * np.pi * S.midi(arp[(k * 3) % 4] + 12) * tt) * np.exp(-tt / 0.09), tb, 0.08)
        for k in range(4):
            tb = t0 + k * BEAT
            if k in (0, 2):
                m = int(0.25 * SR); tt = np.arange(m) / SR
                put(out, np.sin(2 * np.pi * np.cumsum(48 + 90 * np.exp(-tt * 30)) / SR) * np.exp(-tt / 0.14), tb, 0.45)
            noise_hit(out, 7000, 16000, 0.04, 0.015, 0.07, tb + BEAT / 2)
        put(out, S.lp(S.saw(S.midi(root - 12), int(BAR * SR)), 300) * env, t0, 0.12)
    return out


def blip(buf, at, k):
    f = [1320, 1480, 1660, 1760][k % 4]; m = int(0.09 * SR); tt = np.arange(m) / SR
    put(buf, np.sin(2 * np.pi * f * tt * (1 + 0.3 * np.exp(-tt * 40))) * np.exp(-tt / 0.03), at, 0.20)
    noise_hit(buf, 3000, 9000, 0.02, 0.006, 0.08, at)


def info(n):
    dur = EV["info"]["dur"]; R = EV["info"][f"s{n}"]; N = int(dur * SR)
    x = bed(dur, n); fx = np.zeros(N)
    put(fx, S.sfx("whoosh", length=0.5), max(0, R[1] - 0.25), 0.35)          # the title
    for k, at in enumerate(R[2:]): blip(fx, at, k)
    if n == 5: put(fx, S.sfx("typing", length=1.6), R[2], 0.35)
    if n == 6: put(fx, S.sfx("subImpact"), R[4], 0.7); put(fx, S.sfx("mechClick"), R[4], 0.4)
    if n == 7: put(fx, S.sfx("impact"), R[2], 0.6); put(fx, S.sfx("resolve", length=2.5), R[3], 0.35)
    y = x + fx
    f = int(0.25 * SR); y[-f:] *= np.linspace(1, 0, f); y[:int(0.01 * SR)] *= np.linspace(0, 1, int(0.01 * SR))
    return y


def main():
    out = ROOT / "public/audio"; out.mkdir(parents=True, exist_ok=True)
    for n, y in [(1, slide1())] + [(n, info(n)) for n in range(2, 8)]:
        lufs, peak = master(y, out / f"carousel_s{n}.wav")
        print(f"carousel_s{n}.wav  {len(y) / SR:.2f}s  {lufs} LUFS  peak {peak} dBFS")


if __name__ == "__main__":
    main()
