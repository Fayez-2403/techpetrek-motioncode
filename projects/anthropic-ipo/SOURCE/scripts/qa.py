"""Final-file QA: ffprobe summary, blackdetect, freezedetect, ebur128 loudness, a 1 fps contact sheet, and close-up frames
(first frame, first 3 s, every scene midpoint, every cut +-2 frames, last frame). Writes out/qa/<variant>/ and qa_<variant>.json.

    python scripts/qa.py [master|reel]
"""
import json, pathlib, re, subprocess, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
VER = sys.argv[sys.argv.index("--version") + 1] if "--version" in sys.argv else "v1"
TM = json.loads((ROOT / ("SCENE_TIMINGS.json" if VER == "v1" else f"SCENE_TIMINGS.{VER}.json")).read_text(encoding="utf-8"))
FILES = {"reel": ROOT.parent / "output" / f"railway_ai_security_reel_{VER}_1080x1920_60fps.mp4"}


def ff(args):
    return subprocess.run(["ffmpeg", "-hide_banner", "-nostats", *args], capture_output=True, text=True).stderr


def qa(variant):
    f = FILES[variant]; O = ROOT / "out" / "qa" / f"{variant}_{VER}"; O.mkdir(parents=True, exist_ok=True)
    pr = json.loads(subprocess.run(["ffprobe", "-v", "error", "-show_streams", "-show_format", "-of", "json", str(f)], capture_output=True, text=True).stdout)
    v = next(s for s in pr["streams"] if s["codec_type"] == "video"); a = [s for s in pr["streams"] if s["codec_type"] == "audio"]
    res = {"file": f.name, "size_mb": round(int(pr["format"]["size"]) / 1e6, 1), "duration": float(pr["format"]["duration"]), "width": v["width"], "height": v["height"],
           "fps": v["r_frame_rate"], "vcodec": v["codec_name"], "pix_fmt": v["pix_fmt"], "color": v.get("color_space"), "acodec": a[0]["codec_name"] if a else None,
           "vbitrate_kbps": round(int(pr["format"]["bit_rate"]) / 1000)}
    bd = ff(["-i", str(f), "-vf", "blackdetect=d=0.2:pix_th=0.06", "-an", "-f", "null", "-"])
    res["black"] = [(float(x), float(y)) for x, y in re.findall(r"black_start:([\d.]+) black_end:([\d.]+)", bd)]
    fd = ff(["-i", str(f), "-vf", "freezedetect=n=0.0008:d=1.2", "-an", "-f", "null", "-"])
    st = [float(x) for x in re.findall(r"freeze_start: ([\d.]+)", fd)]; en = [float(x) for x in re.findall(r"freeze_end: ([\d.]+)", fd)]
    res["freeze"] = list(zip(st, en + [res["duration"]] * (len(st) - len(en))))
    lu = ff(["-i", str(f), "-map", "0:a", "-af", "ebur128=peak=true", "-f", "null", "-"])
    res["lufs_i"] = float(re.findall(r"I:\s+(-?[\d.]+) LUFS", lu)[-1]); res["true_peak"] = float(re.findall(r"Peak:\s+(-?[\d.]+) dBFS", lu)[-1])
    res["lra"] = float(re.findall(r"LRA:\s+([\d.]+) LU", lu)[-1])
    # contact sheet, 1 fps
    cols = 10 if variant == "master" else 12; w = 320 if variant == "master" else 180
    n = int(res["duration"]) + 1; rows = (n + cols - 1) // cols
    ff(["-y", "-i", str(f), "-vf", f"fps=1,scale={w}:-1,drawtext=text='%{{pts\\:hms}}':x=4:y=4:fontsize=14:fontcolor=white:box=1:boxcolor=black@0.5,tile={cols}x{rows}", "-frames:v", "1", str(O / "contact_1fps.jpg")])
    # close-ups
    times = {"first": 0.0, "last": res["duration"] - 1 / 30}
    for t in (0.5, 1.0, 1.5, 2.0, 2.5, 3.0): times[f"open_{t}"] = t
    for s in TM["variants"][variant]["scenes"]:
        times[f"mid_{s['id']}"] = (s["start"] + s["end"]) / 2
        if s["start"] > 0:
            for d in (-2, 0, 2): times[f"cut_{s['id']}_{d:+d}"] = s["start"] + d / 30
    for k, t in times.items():
        ff(["-y", "-ss", f"{max(0, t):.3f}", "-i", str(f), "-frames:v", "1", "-q:v", "3", str(O / f"{k}.jpg")])
    (ROOT / "out" / "qa" / f"qa_{variant}_{VER}.json").write_text(json.dumps(res, indent=1))
    print(json.dumps(res, indent=1))


if __name__ == "__main__":
    for var in ["reel"]:
        if FILES[var].exists(): qa(var)
        else: print(f"{FILES[var].name} not rendered yet")
