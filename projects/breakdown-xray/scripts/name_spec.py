"""Names the kit's drafted spec (work/breakdown.json) from the ground truth of the film we broke down: the 18-repos
reel's own timeline (projects/repo18-copy-studio/SCENE_TIMINGS.json) and its score design (mix_reel.py: which layer
enters at which level). Labels are Roman (no Devanagari on screen). Keeps every measured value prep found.
    python scripts/name_spec.py
"""
import json, pathlib
R = pathlib.Path(__file__).resolve().parents[1]
spec = json.loads((R / "work/breakdown.json").read_text(encoding="utf-8"))
TM = json.loads((R.parent / "repo18-copy-studio/SCENE_TIMINGS.json").read_text(encoding="utf-8"))
S = {s["id"]: s for s in TM["sections"]}
NAME = {"hook": "AI-slop ball", "reanimate": "reanimate", "motiondesign": "motion-design", "mgstyles": "mg-styles-15", "huashu": "huashu", "anidoodle": "anidoodle",
        "manim": "Manim", "blender": "blender-skills", "quarks": "three.quarks", "postfx": "postprocessing", "tweakpane": "Tweakpane", "effectcraft": "EffectCraft",
        "cinetic": "cinetic", "motionmaxxing": "motionmaxxing", "openverse": "Openverse", "librosa": "librosa", "whisperx": "WhisperX", "remotion": "Remotion",
        "ffmpeg": "FFmpeg", "payoff": "Same ball", "total": "Star total", "cta": "Comment COPY"}
def scene_at(t): return next((s for s in TM["sections"] if s["t0"] <= t < s["t1"]), TM["sections"][-1])
# V1: keep every measured shot, name it by the scene it falls in
spec["shots"] = [[a, b, NAME[scene_at((a + b) / 2)["id"]]] for a, b, _ in spec["shots"]]
# acts: the film's own grouping
acts = [("hook", "AI slop"), ("reanimate", "Copy + timing"), ("mgstyles", "Style + paint"), ("manim", "Math + 3D"), ("quarks", "VFX + finish"),
        ("cinetic", "Film + de-slop"), ("openverse", "Sound + words"), ("remotion", "Ship it"), ("payoff", "Same ball")]
spec["acts"] = [{"start": round(S[k]["t0"], 3), "title": v} for k, v in acts]
end = TM["duration"]
t = lambda k: round(S[k]["t0"], 3)
vo = []
for l in TM["lines"]:
    cap = l["cap"].replace("—", "-"); short = cap.split(" - ")[0] if l["id"] != "v01" else "Ye ball dekho, AI slop"
    vo.append([round(l["start"], 3), round(l["end"], 3), short[:34]])
spec["lanes"] = [
    {"name": "Voice-over (Liam)", "stem": "vocals", "clips": vo},
    {"name": "Drums", "stem": "drums", "clips": [[0, t("reanimate"), "Metronome (slop)"], [t("reanimate"), t("motiondesign"), "Kick"], [t("motiondesign"), t("cinetic"), "Kick + hats"],
                                                 [t("cinetic"), t("librosa"), "+ claps"], [t("librosa"), round(end - 0.6, 3), "+ sub on the 1"]]},
    {"name": "Bass", "stem": "bass", "clips": [[0, t("reanimate"), "Slop hum"], [t("mgstyles"), round(end - 0.8, 3), "Bass line"]]},
    {"name": "Synths", "stem": "other", "clips": [[t("huashu"), t("anidoodle"), "Pad"], [t("anidoodle"), round(end - 0.4, 3), "Pad + plucks"]]},
    {"name": "FX", "stem": "drums", "clips": [[t("quarks"), t("openverse"), "Thud + sparkle", "other"], [t("openverse"), t("payoff"), "Boing on every bounce"], [t("total"), t("cta"), "Counter roll"]]},
]
spec["aspect"] = "9:16"
spec["style"] = {"ground": "#07080d", "accent": "#ffcf5a", "light": True}
spec["_note"] = "Named from the film's own timeline + score design (scripts/name_spec.py). Film: our 18-repos reel."
(R / "work/breakdown.json").write_text(json.dumps(spec, ensure_ascii=False, indent=1), encoding="utf-8")
print(len(spec["shots"]), "shots |", [a["title"] for a in spec["acts"]], "|", [l["name"] for l in spec["lanes"]])
