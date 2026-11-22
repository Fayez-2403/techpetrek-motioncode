"""docs/clips.json + public/clips/<id>.{words,cuts}.json -> src/config/clips.generated.json (the Remotion props)."""
import json, pathlib, subprocess
R = pathlib.Path(__file__).resolve().parents[2]; out = []
for c in json.loads((R / "docs/clips.json").read_text(encoding="utf-8"))["clips"]:
    f = R / f"public/clips/{c['id']}.mp4"
    if not f.exists(): continue
    d = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(f)], capture_output=True, text=True).stdout)
    cuts = json.loads((R / f"public/clips/{c['id']}.cuts.json").read_text()) if (R / f"public/clips/{c['id']}.cuts.json").exists() else {"bounds": [0], "marks": []}
    out.append({"id": c["id"], "hook": c["hook"], "dur": round(d, 3), "words": json.loads((R / f"public/clips/{c['id']}.words.json").read_text(encoding="utf-8")),
                "bounds": cuts["bounds"], "marks": cuts["marks"], "replay": c.get("replay", [])})
(R / "src/config/clips.generated.json").write_text(json.dumps(out, ensure_ascii=False), encoding="utf-8"); print([o["id"] for o in out])
