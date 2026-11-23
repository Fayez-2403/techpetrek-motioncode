"""Two-voice narration (Bro = Liam, Bhai = Amogh M). One ElevenLabs take per speaker with all of that speaker's lines,
cut into lines by the take's own character timestamps (same cutter as vo.py), so each voice keeps one consistent read.
Writes audio/out/reel/<id>.wav + audio/out/lines_reel.json (with who/pre/post). Takes are cached in audio/takes/.

    python scripts/audio/vo_duo.py [--new bro|bhai] [--stt [ids...]]
"""
import hashlib, json, pathlib, sys
HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import numpy as np, soundfile as sf
from vo import synth, char_times, phrases, spans, caption_words, decode, stt, SR, ROOT, VOUT, SCRIPT  # noqa: E402

lines, voices = SCRIPT["reel"], SCRIPT["voices"]
for l in lines:
    if len(phrases(l["cap"])) != len(phrases(l["tts"])):
        sys.exit(f"{l['id']}: caption has {len(phrases(l['cap']))} phrases, tts {len(phrases(l['tts']))}")
new = sys.argv[sys.argv.index("--new") + 1] if "--new" in sys.argv else None
T = ROOT / "audio" / "takes"; T.mkdir(parents=True, exist_ok=True)
O = VOUT / "reel"; O.mkdir(parents=True, exist_ok=True)
res = {}
for who, v in voices.items():
    L = [l for l in lines if l["who"] == who]
    text = "\n\n".join(l["tts"] for l in L); seed = v["seed"]
    h = hashlib.sha1((text + json.dumps(v, sort_keys=True) + str(seed)).encode()).hexdigest()[:10]
    mp3p, alp = T / f"{who}_s{seed}_{h}.mp3", T / f"{who}_s{seed}_{h}.json"
    if new == who or not mp3p.exists():
        print(f"new take: {who} ({v['name']}), {len(text)} characters")
        mp3, al = synth(text, v, seed); mp3p.write_bytes(mp3); alp.write_text(json.dumps(al))
    y, ct = decode(mp3p.read_bytes()), char_times(text, json.loads(alp.read_text()))
    off = 0
    for i, l in enumerate(L):
        tts = l["tts"]; sp = spans(tts, off, phrases(tts))
        a, b = ct[off][0], ct[off + len(tts.rstrip()) - 1][1]
        nxt = ct[off + len(tts) + 2][0] if i + 1 < len(L) else len(y) / SR
        s0, s1 = max(0.0, a - 0.05), min(nxt - 0.03, b + 0.16)
        clip = y[int(s0 * SR):int(s1 * SR)].copy()
        f = min(len(clip) // 4, int(0.012 * SR)); clip[:f] *= np.linspace(0, 1, f); clip[-f:] *= np.linspace(1, 0, f)
        caps = phrases(l["cap"]); pt = [[ct[c0][0] - s0, ct[c1][1] - s0] for c0, c1 in sp]
        # tighten: a pause between phrases is cut down to 0.16 s after a comma, 0.24 s after . ? ! (crossfaded joins)
        for k in range(len(pt) - 1, 0, -1):
            gap = pt[k][0] - pt[k - 1][1]; keep = 0.16 if caps[k - 1].rstrip().endswith(",") else 0.24
            if gap > keep + 0.03:
                a0 = int((pt[k - 1][1] + keep / 2) * SR); n = int((gap - keep) * SR); xf = min(int(0.01 * SR), n)
                head, tail = clip[:a0 + xf].copy(), clip[a0 + n:]
                head[-xf:] = head[-xf:] * np.linspace(1, 0, xf) + tail[:xf] * np.linspace(0, 1, xf)
                clip = np.concatenate([head, tail[xf:]])
                for q in pt[k:]: q[0] -= n / SR; q[1] -= n / SR
        sf.write(O / f"{l['id']}.wav", clip, SR, subtype="PCM_16")
        ph = []
        for cap, (t0, t1) in zip(caps, pt):
            ph.append({"cap": cap, "t0": round(t0, 3), "t1": round(t1, 3), "words": caption_words(cap, t0, t1)})
        res[l["id"]] = {"id": l["id"], "who": who, "scene": l["scene"], "pre": l.get("pre", 0), "post": l.get("post", 0),
                        "dur": round(len(clip) / SR, 3), "phrases": ph, "take": mp3p.name}
        off += len(tts) + 2
out = [res[l["id"]] for l in lines]
for r in out: print(f"{r['id']} {r['who']:<4} {r['scene']:<8} {r['dur']:5.2f} s")
(VOUT / "lines_reel.json").write_text(json.dumps({"voices": {k: f"{v['name']} {v['model']} speed {v['speed']} seed {v['seed']}" for k, v in voices.items()},
                                                  "lines": out}, ensure_ascii=False, indent=1), encoding="utf-8")
print(f"total speech {sum(r['dur'] for r in out):.1f} s")
if "--stt" in sys.argv:
    ids = [a for a in sys.argv[sys.argv.index("--stt") + 1:] if not a.startswith("-")] or [l["id"] for l in lines]
    for l in lines:
        if l["id"] in ids:
            print(f"--- {l['id']} {l['who']}\n  script: {l['tts']}\n  heard : {stt((O / (l['id'] + '.wav')).read_bytes())}")
