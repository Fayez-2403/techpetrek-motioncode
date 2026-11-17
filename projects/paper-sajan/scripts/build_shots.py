"""Builds every sketch shot of the reel from src/data/reel.json (no generated images: real footage traced into line
animation by sketch_video.py). 'fade' shots get both looks (aura + plain) for the aura draining out. Resumable.
    python scripts/build_shots.py
"""
import json, pathlib, subprocess, sys
ROOT = pathlib.Path(__file__).resolve().parents[1]
R = json.loads((ROOT / "src/data/reel.json").read_text(encoding="utf-8"))
FOOT = ROOT.parent / "dev-life-aura/public/footage"
for s in R["shots"]:
    dur = round(s["b"] - s["a"] + 0.25, 3)
    looks = ["aura", "plain"] if s["look"] == "fade" else [s["look"]]
    for lk in looks:
        out = ROOT / "public/sketch" / f"{s['id']}_{lk}.mp4"
        if out.exists() and out.stat().st_size > 20000: continue
        cmd = [sys.executable, str(ROOT / "scripts/sketch_video.py"), str(FOOT / f"{s['clip']}.mp4"), str(s["src"]), str(dur), str(out)] + (["--aura"] if lk == "aura" else []) + (["--soft"] if s.get("soft") else [])
        r = subprocess.run(cmd, capture_output=True, text=True)
        print(out.name, (r.stdout.strip().splitlines() or ["?"])[-1] if r.returncode == 0 else "FAILED " + r.stderr[-300:], flush=True)
