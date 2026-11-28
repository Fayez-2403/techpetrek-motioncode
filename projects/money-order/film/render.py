"""Render Berth 42. Drawings at 30 fps (cel on twos) -> a 60 fps H.264 master with the mix.

    python -m film.render stills 0.5,3.6,...      # look-dev stills -> out/wip/
    python -m film.render sheet                   # one still per shot -> out/wip/shots_sheet.jpg
    python -m film.render preview                 # 540x960 motion check (the default; ask before full)
    python -m film.render full                    # 1080x1920 (only after the user's OK)
Resumable: existing frame PNGs are skipped.
"""
import sys, os, time, json, pathlib, subprocess
from multiprocessing import Pool

ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from film.engine import compose, caption, whip, TOTAL, DFPS, VER, SUFFIX  # noqa: E402
from film import shots as SH  # noqa: E402

MODES = {"preview": (540, 960, 2, 0.5), "full": (1080, 1920, 3, 1.0)}


def frame(t, mode="preview"):
    W, H, S, sc = MODES[mode]
    k = SH.shot_at(t)
    t0, fn, wh = SH.CUT[k]
    img = compose(fn(t), t, W, H, S, sc)
    t1 = SH.CUT[k + 1][0] if k + 1 < len(SH.CUT) else TOTAL + 1
    nwh = SH.CUT[k + 1][2] if k + 1 < len(SH.CUT) else False
    d = 1 if k % 2 else -1
    if wh and t - t0 < 0.1:
        img = whip(img, 1 - (t - t0) / 0.1, d)
    elif nwh and t1 - t < 0.1:
        img = whip(img, 1 - (t1 - t) / 0.1, -d)
    caption(img, t, sc)
    return img


def _job(args):
    i, mode, outdir = args
    p = outdir / f"f{i:05d}.png"
    if p.exists():
        return i
    frame(i / DFPS, mode).save(p, compress_level=1)
    return i


def render_all(mode="preview", workers=7):
    W, H, S, sc = MODES[mode]
    out = ROOT / "out" / f"frames_{mode}{SUFFIX}"
    out.mkdir(parents=True, exist_ok=True)
    n = int(TOTAL * DFPS) + 1
    t0 = time.time()
    with Pool(workers) as pool:
        for k, i in enumerate(pool.imap_unordered(_job, [(i, mode, out) for i in range(n)], chunksize=4)):
            if k % 100 == 0:
                print(f"{k}/{n} frames, {time.time() - t0:.0f} s", flush=True)
    mix = ROOT / f"public/audio/mix{SUFFIX}.wav"
    vid = ROOT / "out" / f"{ROOT.name}_{VER}_{mode}_{W}x{H}_60fps.mp4"
    cmd = ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-framerate", str(DFPS), "-i", str(out / "f%05d.png")]
    if mix.exists():
        cmd += ["-i", str(mix)]
    cmd += ["-vf", "fps=60,format=yuv420p", "-c:v", "libx264", "-preset", "medium", "-crf", "17", "-profile:v", "high",
            "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709"]
    if mix.exists():
        cmd += ["-c:a", "aac", "-b:a", "192k", "-shortest"]
    cmd += ["-t", f"{TOTAL:.3f}", "-movflags", "+faststart", str(vid)]
    subprocess.run(cmd, check=True)
    print("wrote", vid, f"in {(time.time() - t0) / 60:.1f} min")


def stills(ts, mode="preview", tag="wip"):
    out = ROOT / "out" / "wip"
    out.mkdir(parents=True, exist_ok=True)
    paths = []
    for t in ts:
        p = out / f"{tag}_{t:06.2f}.png"
        frame(t, mode).save(p)
        paths.append(p)
    return paths


def sheet(mode="preview"):
    from PIL import Image
    ts = []
    for k, (t0, fn, wh) in enumerate(SH.CUT):
        t1 = SH.CUT[k + 1][0] if k + 1 < len(SH.CUT) else TOTAL
        ts.append(round(t0 + (t1 - t0) * 0.62, 2))
    with Pool(7) as pool:
        imgs = pool.starmap(frame, [(t, mode) for t in ts])
    tw, th = 270, 480
    cols = 9
    rows = (len(imgs) + cols - 1) // cols
    sh = Image.new("RGB", (cols * tw, rows * th), (20, 12, 10))
    for i, im in enumerate(imgs):
        sh.paste(im.resize((tw, th)), ((i % cols) * tw, (i // cols) * th))
    sh.save(ROOT / "out" / "wip" / f"shots_sheet{SUFFIX}.jpg", quality=88)
    print("sheet", ts)


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "preview"
    if cmd == "stills":
        print(stills([float(x) for x in sys.argv[2].split(",")]))
    elif cmd == "sheet":
        (ROOT / "out" / "wip").mkdir(parents=True, exist_ok=True)
        sheet()
    else:
        render_all(cmd)
