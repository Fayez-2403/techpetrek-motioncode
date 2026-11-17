"""Cut the montage under the quote: one shot per beat of our Bella ciao grid (src/config/bella.json), from our own renders.
    python scripts/cuts.py
Writes public/clips/q_NN.mp4 (1080x1920, 60 fps, no audio, 0.15 s of tail) and src/config/cuts.json {at, dur, file, label}.
"""
import json, pathlib, subprocess

ROOT = pathlib.Path(__file__).resolve().parents[1]
EB = ROOT.parent / "editorbro"
G = json.loads((ROOT / "src/config/bella.json").read_text(encoding="utf-8"))
REEL = EB / "out/editorbro_v2_reel_1080x1920_60fps.mp4"
C = EB / "public/clips"
# (source, source second, label): in cut order
R = ROOT / "public/clips/clean"   # caption-free renders of the EditorBro reel (its Reel with captions=false)
SHOTS = [
    (R / "r_10.2.mp4", 0.0, "one prompt"), (C / "demo_brand.mp4", 1.6, "brand site"), (R / "r_14.6.mp4", 0.0, "64 skills"),
    (C / "demo_store.mp4", 2.2, "e-commerce"), (R / "r_17.2.mp4", 0.0, "12 gates"), (C / "demo_food.mp4", 2.6, "food app"),
    (C / "demo_delivery.mp4", 3.0, "live tracking"), (C / "m_data.mp4", 0.3, "data story"), (C / "demo_loyalty.mp4", 4.4, "loyalty app"),
    (C / "demo_vault.mp4", 3.0, "E2EE chat"), (C / "m_perfume.mp4", 0.4, "product film"), (C / "demo_automation.mp4", 3.0, "automation"),
    (C / "demo_company.mp4", 0.8, "corporate site"), (R / "r_26.5.mp4", 0.0, "20+ reels"), (C / "demo_wordpress.mp4", 0.6, "WordPress"),
    (C / "demo_brand.mp4", 4.0, "3D product"), (R / "r_37.0.mp4", 0.0, "9 websites"), (C / "demo_vault.mp4", 4.6, "real encryption"),
    (C / "demo_store.mp4", 5.2, "checkout"), (R / "r_44.6.mp4", 0.0, "prompt → render"),
]
beats = G["beats"]
INTRO = 4                                   # the laptop intro owns the first 4 beats (0-2.1 s)
cut_at = beats[INTRO:INTRO + len(SHOTS)]
end = G["sections"]["cta"][0]
out, OUT = [], ROOT / "public/clips"
OUT.mkdir(parents=True, exist_ok=True)
for i, (src, ss, label) in enumerate(SHOTS):
    at = cut_at[i]; nxt = cut_at[i + 1] if i + 1 < len(SHOTS) else end
    dur = round(nxt - at, 3); f = f"clips/q_{i:02d}.mp4"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", str(ss), "-i", str(src), "-t", str(dur + 0.15),
                    "-vf", "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=60", "-an",
                    "-c:v", "libx264", "-crf", "17", "-pix_fmt", "yuv420p", str(ROOT / "public" / f)], check=True)
    out.append({"at": at, "dur": dur, "file": f, "label": label})
(ROOT / "src/config/cuts.json").write_text(json.dumps({"shots": out, "intro": [0.0, cut_at[0]], "cta": {"at": end}}, indent=1), encoding="utf-8")
print(len(out), "shots, last ends", end)
