"""The soundtrack: A1 the user-supplied song (source 0:00-1:40, never restarted), and synthesized Foley (no samples)
placed on the picture's own events, read from src/data/shots.json (npx tsx scripts/dump_edit.ts) so sound and picture
share one clock. Two deliberate music edits from the spec: a 0.27 s gated silence on the rollback decision, and a dead
stop on the final Enter (98.95 s), then room tone. Foley sits low under the music (keyboard = signature motif, single
velocity-varied one-shots, never a loop). Master: stereo two-pass loudnorm, -14 LUFS / -1.5 dBTP.
Writes public/audio/mix_master.wav (+ public/audio/fx_only.wav for an Instagram-music version) and docs/audio-map.md.
    python scripts/audio/mix_master.py
"""
import json, pathlib, re, subprocess

import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfilt

ROOT = pathlib.Path(__file__).resolve().parents[2]
SR = 48000; DUR = 100.0; N = int(DUR * SR); ENTER = 98.95; LID = 98.907   # song stops on the beat; the lid closes 43 ms before
SH = json.loads((ROOT / "src/data/shots.json").read_text(encoding="utf-8"))
rng = np.random.default_rng(20261107)
def shot(kind_id):  # first shot whose src/id matches
    return next(s for s in SH if s.get("src") == kind_id or s.get("id") == kind_id)
def bp(x, a, b): return sosfilt(butter(2, [a, b], "band", fs=SR, output="sos"), x)
def lp(x, f): return sosfilt(butter(2, f, "low", fs=SR, output="sos"), x)
def T(n): return np.arange(n) / SR


def put(buf, x, t, g=1.0, pan=0.0):
    if x.ndim == 1: x = np.stack([x * (1 - max(0, pan)), x * (1 + min(0, pan))], 1)
    i = int(round(t * SR))
    if i >= len(buf) or i + len(x) <= 0: return
    a = max(0, -i); j = max(0, i); m = min(len(x) - a, len(buf) - j)
    buf[j:j + m] += x[a:a + m] * g


def key(g=1.0, heavy=False, seed=0):
    r = np.random.default_rng(seed); n = int(0.09 * SR); t = T(n)
    tick = bp(r.standard_normal(n), 2500, 9000) * np.exp(-t / 0.004)
    f = (170 if heavy else 250) * (1 + 0.2 * (r.random() - 0.5))
    body = np.sin(2 * np.pi * f * t) * np.exp(-t / (0.035 if heavy else 0.018)) * 0.6
    bottom = bp(r.standard_normal(n), 600, 2200) * np.exp(-np.maximum(t - 0.012, 0) / 0.01) * (t > 0.012) * 0.5
    return (tick + body + bottom) * g * (0.75 + 0.5 * r.random())
def typing(buf, a, b, rate=13, g=0.5, seed=0):
    r = np.random.default_rng(seed); t = a
    while t < b:
        put(buf, key(g, heavy=r.random() > 0.85, seed=int(t * 997)), t, pan=(r.random() - 0.5) * 0.3); t += (1 / rate) * (0.5 + r.random())
def click(g=1.0): n = int(0.03 * SR); return bp(rng.standard_normal(n), 3000, 9000) * np.exp(-T(n) / 0.003) * g
def chime(f=880, g=1.0, L=1.2):
    n = int(L * SR); t = T(n); return sum(a * np.sin(2 * np.pi * f * m * t) * np.exp(-t / (0.5 / m)) for m, a in [(1, 1), (2, 0.4), (3, 0.2)]) * np.minimum(1, t / 0.004) * g * 0.3
def ping(g=1.0): return chime(1320, g, 0.7) + chime(1760, g * 0.5, 0.7)
def buzz(g=1.0):
    n = int(0.28 * SR); t = T(n); return lp(np.sign(np.sin(2 * np.pi * 110 * t)), 1200) * np.exp(-t / 0.12) * g * 0.25
def noise_bed(L, lo, hi, g, fade=0.3):
    n = int(L * SR); x = bp(rng.standard_normal(n), lo, hi); e = np.minimum(1, np.minimum(T(n), L - T(n)) / fade); return x * e * g
def thunk(g=1.0):
    n = int(0.5 * SR); t = T(n); f = 70 + 60 * np.exp(-t * 20)
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.12) + bp(rng.standard_normal(n), 300, 2000) * np.exp(-t / 0.03) * 0.5) * g
def clink(g=1.0, f=2400):
    n = int(0.6 * SR); t = T(n); return sum(np.sin(2 * np.pi * f * m * t) * np.exp(-t / (0.25 / m)) for m in (1, 2.71, 5.1)) * np.minimum(1, t / 0.001) * g * 0.15
def pour(L=1.0, g=1.0):
    n = int(L * SR); x = bp(rng.standard_normal(n), 400, 3500) * (0.6 + 0.4 * np.abs(np.sin(2 * np.pi * 7 * T(n)))); return x * np.minimum(1, np.minimum(T(n), L - T(n)) / 0.08) * g
def power_down(g=1.0):
    n = int(0.9 * SR); t = T(n); f = 900 * np.exp(-t * 4) + 40
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.25) * 0.08
    c = click(1.0); x[:len(c)] += c * 0.8
    return x * g


def master(x, path):
    raw = path.with_suffix(".raw.wav"); sf.write(raw, x * 0.5, SR, subtype="FLOAT")
    a = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(raw), "-af", "loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"], capture_output=True, text=True).stderr
    m = json.loads(a[a.rindex("{"):a.rindex("}") + 1])
    af = (f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}:"
          f"measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true")
    subprocess.run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", str(raw), "-af", af, "-ar", str(SR), "-ac", "2", "-c:a", "pcm_s16le", str(path)], check=True)
    raw.unlink()
    r = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(path), "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True).stderr
    return float(re.findall(r"I:\s+(-?[\d.]+) LUFS", r)[-1]), float(re.findall(r"Peak:\s+(-?[\d.]+) dBFS", r)[-1])


def main():
    song, _ = sf.read(ROOT / "audio/src/sajan_48k.wav"); song = song[:N].copy()
    if len(song) < N: song = np.pad(song, ((0, N - len(song)), (0, 0)))
    # the rollback decision: the music narrows to silence for 0.27 s before the Enter, then surges back
    rb = shot("rollback")["t0"]; ge = rb + 0.35; a, b = int((ge - 0.27) * SR), int(ge * SR)
    song[a - int(0.03 * SR):a] *= np.linspace(1, 0, int(0.03 * SR))[:, None]; song[a:b] = 0; song[b:b + int(0.01 * SR)] *= np.linspace(0, 1, int(0.01 * SR))[:, None]
    # the final Enter: the song stops dead
    e = int((ENTER + 0.02) * SR); song[e - int(0.015 * SR):e] *= np.linspace(1, 0, int(0.015 * SR))[:, None]; song[e:] = 0
    fx = np.zeros((N, 2)); log = []
    def ev(name, t): log.append((round(t, 3), name))
    # 01 hush: city hum + one close key click
    put(fx, noise_bed(3.7, 80, 600, 0.02), 0.0); put(fx, key(0.8, seed=1), 0.62); ev("key click (eye)", 0.62)
    # 02 morning
    put(fx, pour(1.0, 0.18), shot("s02_pour_water")["t0"] + 0.05); ev("water pour", shot("s02_pour_water")["t0"])
    put(fx, clink(0.8, 2600), shot("s02_breakfast")["t0"] + 0.35); ev("spoon clink", shot("s02_breakfast")["t0"] + 0.35)
    # 03 train
    put(fx, lp(noise_bed(3.3, 30, 400, 0.12), 300), shot("V2")["t0"]); put(fx, thunk(0.6), shot("s03_doors_close")["t0"] + 0.62); ev("door thunk", shot("s03_doors_close")["t0"] + 0.62)
    # 04 cursor + commute
    typing(fx, shot("cursor")["t0"] + 0.2, shot("cursor")["t0"] + 0.55, 16, 0.45, 4); ev("typing", shot("cursor")["t0"] + 0.2)
    for k in range(3): put(fx, thunk(0.12), shot("s04_crosswalk_feet")["t0"] + k * 0.16)
    # 05 meeting: mute click, tile click
    put(fx, click(0.5), shot("standup")["t0"] + 0.1); put(fx, click(0.6), shot("calltile")["t0"] + 0.8); ev("clicks", shot("calltile")["t0"] + 0.8)
    # 06 deep work: the keyboard motif
    typing(fx, shot("editor")["t0"], shot("editor")["t1"], 14, 0.5, 6); typing(fx, shot("s06_mech_keys")["t0"], shot("s06_mech_keys")["t1"], 16, 0.55, 7)
    put(fx, key(1.0, heavy=True, seed=60), shot("tests")["t0"] + 0.02); ev("Enter (tests)", shot("tests")["t0"])
    put(fx, chime(1046, 0.4), shot("tests")["t0"] + 1.15)
    # 07 review: approve click
    pr = shot("pr"); put(fx, click(0.8), pr["t0"] + 0.58 * (pr["t1"] - pr["t0"])); put(fx, chime(988, 0.45), pr["t0"] + 0.6 * (pr["t1"] - pr["t0"])); ev("approved", pr["t0"] + 0.6 * (pr["t1"] - pr["t0"]))
    # 08 lunch
    put(fx, clink(0.9, 2200), shot("s08_salad")["t0"] + 0.5); put(fx, clink(0.7, 2900), shot("s08_bowl")["t0"] + 0.3)
    # 09 CI
    for nm in ("testfail", "commit"): put(fx, key(0.9, heavy=True, seed=90), shot(nm)["t0"] + 0.02)
    put(fx, buzz(0.5), shot("testfail")["t0"] + 0.4); typing(fx, shot("s06_keys_lowlight")["t0"], shot("s06_keys_lowlight")["t1"], 15, 0.5, 9)
    ci = shot("ci")
    for i in range(4): put(fx, thunk(0.18), ci["t0"] + (0.12 + i * 0.16 + 0.1) * (ci["t1"] - ci["t0"]))
    put(fx, chime(1318, 0.5), shot("cipass")["t0"] + 0.2); ev("CI passed", shot("cipass")["t0"] + 0.2)
    # 10 incident
    put(fx, ping(0.6), shot("V4")["t0"] + 0.08); ev("incident ping", shot("V4")["t0"] + 0.08)
    typing(fx, shot("channel")["t0"] + 0.6, shot("channel")["t0"] + 1.6, 18, 0.4, 10)
    put(fx, key(1.3, heavy=True, seed=100), ge); ev("Enter (rollback decision)", ge)
    # 11 recovery
    for i in range(3): put(fx, chime([988, 1175, 1318][i], 0.45), shot("statuses")["t0"] + i * 0.28 * (shot("statuses")["t1"] - shot("statuses")["t0"]) + 0.05)
    typing(fx, shot("s06_mech_keys")["t0"] + 0.0, shot("s06_mech_keys")["t1"], 15, 0.45, 11)
    # 12 practice
    jd = shot("judge"); put(fx, buzz(0.4), jd["t0"] + 0.1); put(fx, chime(1568, 0.5), jd["t0"] + 0.5 * (jd["t1"] - jd["t0"])); ev("Accepted", jd["t0"] + 0.5 * (jd["t1"] - jd["t0"]))
    # 13 travel: cabin hum, rain
    put(fx, lp(noise_bed(1.5, 40, 500, 0.08), 400), shot("s13_wing")["t0"])
    # 14 the final Enter + the power-down click, then room tone
    v5 = shot("V5")["t0"]; typing(fx, v5 + 0.05, v5 + 1.3, 12, 0.5, 14); put(fx, key(1.5, heavy=True, seed=140), v5 + 1.45); ev("final Enter (V5)", v5 + 1.45)
    put(fx, thunk(0.55), LID); put(fx, power_down(0.9), LID + 0.05); ev("lid closes = screen off", LID)
    room = noise_bed(DUR - ENTER + 0.5, 100, 1500, 0.025, 0.2) + np.sin(2 * np.pi * 50 * T(int((DUR - ENTER + 0.5) * SR))) * 0.01
    put(fx, room, ENTER - 0.1)
    out = ROOT / "public/audio"; out.mkdir(parents=True, exist_ok=True)
    I1, p1 = master(song * 1.0 + fx * 0.6, out / "mix_master.wav")
    I2, p2 = master(fx + np.stack([noise_bed(DUR, 100, 1500, 0.006, 0.5)] * 2, 1), out / "fx_only.wav")
    md = ["# Audio map", "", "A1 = the user's song (source 0:00-1:40). Two edits: gated silence before the rollback Enter, a dead stop at the final Enter.", "",
          f"- master: {I1:.1f} LUFS, peak {p1:.1f} dBFS (`public/audio/mix_master.wav`)", f"- fx only (IG-music version): {I2:.1f} LUFS (`public/audio/fx_only.wav`)",
          f"- gated silence: {ge - 0.27:.3f}–{ge:.3f} s", "", "| t (s) | event |", "|---|---|"] + [f"| {t:.3f} | {n} |" for t, n in sorted(log)]
    (ROOT / "docs/audio-map.md").write_text("\n".join(md) + "\n", encoding="utf-8")
    print(f"mix_master {I1:.1f} LUFS peak {p1:.1f} | fx_only {I2:.1f} LUFS | gate {ge - 0.27:.3f}-{ge:.3f} | events {len(log)}")


if __name__ == "__main__":
    main()
