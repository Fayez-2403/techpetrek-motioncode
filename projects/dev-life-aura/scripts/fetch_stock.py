"""Gate D (free): download the selected Pexels / Mixkit-Free clips, then make 1080x1920 60 fps proxies for Remotion.
  assets/licensed/<id>.mp4          original download (git-ignored)
  public/footage/<id>.mp4           1080x1920 centre-crop, 60 fps, no audio, CRF 18, keyframe every 12 frames (fast seek)
  docs/asset_manifest.csv           source page, file URL, licence, original res/fps/duration, crop, date
Resumable: skips files that already exist.      python scripts/fetch_stock.py
"""
import csv, datetime, json, pathlib, subprocess, sys, urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1]
SEL = json.loads((ROOT / "assets/stock_selection.json").read_text(encoding="utf-8"))
RAW = ROOT / "assets/licensed"; PRX = ROOT / "public/footage"; RAW.mkdir(parents=True, exist_ok=True); PRX.mkdir(parents=True, exist_ok=True)
UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36"}


def probe(p):
    o = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height,r_frame_rate:format=duration", "-of", "json", str(p)], capture_output=True, text=True).stdout
    j = json.loads(o); s = j["streams"][0]; n, d = s["r_frame_rate"].split("/")
    return s["width"], s["height"], round(int(n) / int(d), 2), round(float(j["format"]["duration"]), 2)


rows = []
for c in SEL:
    raw, prx = RAW / f"{c['id']}.mp4", PRX / f"{c['id']}.mp4"
    try:
        if not raw.exists() or raw.stat().st_size < 50_000:
            req = urllib.request.Request(c["mp4"], headers=UA)
            with urllib.request.urlopen(req, timeout=180) as r, open(raw, "wb") as f:
                while True:
                    b = r.read(1 << 20)
                    if not b: break
                    f.write(b)
        w, h, fps, dur = probe(raw)
        if not prx.exists():
            # cover-crop to 9:16, 60 fps (frame-duplicate, no motion interpolation: the action keeps its real speed)
            vf = "scale=w='if(gt(a,9/16),-2,1080)':h='if(gt(a,9/16),1920,-2)',crop=1080:1920,fps=60,setsar=1"
            subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", str(raw), "-vf", vf, "-an", "-c:v", "libx264", "-crf", "18", "-preset", "medium",
                            "-pix_fmt", "yuv420p", "-g", "12", "-movflags", "+faststart", str(prx)], check=True)
        rows.append([c["id"], c["scene"], c["src"], c["page"], c["mp4"], c["license"], f"{w}x{h}", fps, dur, "centre cover-crop 9:16 -> 1080x1920@60", datetime.date.today().isoformat(), "ok"])
        print(f"ok   {c['id']:20s} {w}x{h} {fps}fps {dur}s", flush=True)
    except Exception as e:  # keep going; the manifest records the failure
        rows.append([c["id"], c["scene"], c["src"], c["page"], c["mp4"], c["license"], "", "", "", "", datetime.date.today().isoformat(), f"FAILED {e}"])
        print(f"FAIL {c['id']}: {e}", flush=True)

with open(ROOT / "docs/asset_manifest.csv", "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f); w.writerow(["id", "scene", "source", "page", "file_url", "license", "original_res", "fps", "duration_s", "processing", "fetched", "status"]); w.writerows(rows)
print("done", sum(r[-1] == "ok" for r in rows), "/", len(rows))
