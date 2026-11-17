"""Real footage -> hand-drawn line animation (the i.iz.jae look, our palette), no generated images.
Each drawing is an XDoG ink pass on a real frame, held "on twos" (12 drawings/s, each shown 5 frames at 60 fps).
Two looks from the same footage:
  plain  cream ink lines on dark paper
  aura   the same, plus the developer's AURA: lines lit by his screen turn electric lime, and his silhouette
         (mediapipe person segmentation) carries a lime rim glow
    python scripts/sketch_video.py <clip.mp4> <from_s> <dur_s> <out.mp4> [--aura] [--hold 5]
"""
import argparse, pathlib, subprocess

import cv2
import numpy as np

ap = argparse.ArgumentParser(); ap.add_argument("clip"); ap.add_argument("start", type=float); ap.add_argument("dur", type=float); ap.add_argument("out")
ap.add_argument("--aura", action="store_true"); ap.add_argument("--hold", type=int, default=5); ap.add_argument("--soft", action="store_true"); ap.add_argument("--fps", type=int, default=60)
a = ap.parse_args()
W, H = 1080, 1920
PAPER = np.array([20, 16, 13], np.float32)        # BGR #0d1014-ish warm black paper
INK = np.array([210, 230, 239], np.float32)       # BGR cream #efe6d2
LIME = np.array([58, 255, 200], np.float32)       # BGR #c8ff3a

seg = None
if True:
    import mediapipe as mp
    from mediapipe.tasks.python import vision, BaseOptions
    MODEL = str(pathlib.Path(__file__).resolve().parents[1] / "tools/selfie_segmenter.tflite")   # Google's selfie segmenter (Apache-2.0)
    seg = vision.ImageSegmenter.create_from_options(vision.ImageSegmenterOptions(base_options=BaseOptions(model_asset_path=MODEL), output_confidence_masks=True))

def xdog(x, s=1.0, k=1.6, p=20, eps=-0.015, phi=14):
    g1, g2 = cv2.GaussianBlur(x, (0, 0), s), cv2.GaussianBlur(x, (0, 0), s * k)
    d = (1 + p) * g1 - p * g2
    return np.where(d >= eps, 1.0, 1.0 + np.tanh(phi * (d - eps)))

rng = np.random.default_rng(3)
paper_tex = cv2.GaussianBlur(rng.normal(0, 1, (H, W)).astype(np.float32), (0, 0), 1.0) * 3 + cv2.GaussianBlur(rng.normal(0, 1, (H, W)).astype(np.float32), (0, 0), 14) * 6

cap = cv2.VideoCapture(a.clip); src_fps = cap.get(cv2.CAP_PROP_FPS) or 60
cap.set(cv2.CAP_PROP_POS_MSEC, a.start * 1000)
n_out = int(round(a.dur * a.fps)); step = a.hold * src_fps / a.fps        # source frames per drawing
pathlib.Path(a.out).parent.mkdir(parents=True, exist_ok=True)
ff = subprocess.Popen(["ffmpeg", "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{W}x{H}", "-r", str(a.fps), "-i", "-",
                       "-c:v", "libx264", "-crf", "16", "-preset", "medium", "-pix_fmt", "yuv420p", "-g", "12", "-movflags", "+faststart", a.out], stdin=subprocess.PIPE)
frames, last, src_i, want = 0, None, 0, 0.0
ok, fr = cap.read()
while frames < n_out and ok:
    if src_i >= want or last is None:
        f = cv2.resize(fr, (W, H)).astype(np.float32) / 255.0
        g0 = cv2.cvtColor(f, cv2.COLOR_BGR2GRAY)
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
        g8 = clahe.apply((g0 * 255).astype(np.uint8))                                   # lift dark footage before tracing
        if a.soft: g8 = cv2.bilateralFilter(cv2.bilateralFilter(g8, 9, 45, 7), 9, 45, 7)  # texture (asphalt, tiles) out, edges kept
        g = g8.astype(np.float32) / 255.0
        # a little per-drawing jitter of the line threshold = the hand-drawn "boil"
        jit = (frames // a.hold) % 3
        dark = 1.0 - xdog(g, s=1.0 + 0.05 * jit); light = 1.0 - xdog(1.0 - g, s=1.0 + 0.05 * jit)
        ink = np.clip(np.maximum(dark, light * 0.85), 0, 1); ink[ink < 0.2] = 0
        out = PAPER[None, None, :] + paper_tex[..., None]
        im = mp.Image(image_format=mp.ImageFormat.SRGB, data=cv2.cvtColor((f * 255).astype(np.uint8), cv2.COLOR_BGR2RGB))
        msk = cv2.resize(seg.segment(im).confidence_masks[0].numpy_view().astype(np.float32).squeeze(), (W, H))
        msk = cv2.GaussianBlur(msk, (0, 0), 2); fig = np.clip((msk - 0.35) * 4, 0, 1)
        # the figure: anime cel shading, 3 flat tones from his own light (cream highlight, warm grey, cool shadow)
        lv = cv2.GaussianBlur(g, (0, 0), 3)
        if (fig > 0.5).sum() > 500:                      # stretch the shading to his own light range
            lo, hi = np.percentile(lv[fig > 0.5], [8, 92]); lv = np.clip((lv - lo) / max(1e-3, hi - lo), 0, 1)
        tones = np.where(lv > 0.62, 0, np.where(lv > 0.3, 1, 2))
        pal = np.array([[205, 222, 233], [128, 136, 146], [70, 66, 62]], np.float32)       # BGR cream / warm grey / shadow
        cel = pal[tones]
        out = out * (1 - fig[..., None] * 0.92) + cel * fig[..., None] * 0.92
        col = np.broadcast_to(INK, out.shape).copy()
        col = col * (1 - fig[..., None]) + np.array([40, 34, 30], np.float32) * fig[..., None]    # ink on the figure is dark, like the refs
        if a.aura:
            # lines lit by the screen (bright + cool in the source) turn lime
            b, gr, r = f[..., 0], f[..., 1], f[..., 2]
            lit = np.clip((g - 0.35) * 2.2, 0, 1) * np.clip((b + gr - r) * 2 + 0.4, 0, 1)
            col = col * (1 - lit[..., None]) + LIME * lit[..., None]
        out = out * (1 - ink[..., None]) + col * ink[..., None]
        if a.aura:
            m = (fig > 0.5).astype(np.float32)
            edge = cv2.dilate(m, np.ones((5, 5), np.uint8)) - cv2.erode(m, np.ones((5, 5), np.uint8))
            glow = cv2.GaussianBlur(edge, (0, 0), 18) * 2.2 + cv2.GaussianBlur(edge, (0, 0), 4) * 1.2
            glow = np.clip(glow, 0, 1) * (0.85 + 0.15 * np.sin(frames / a.hold * 1.3))
            out = out + LIME[None, None, :] * glow[..., None] * 0.9
        last = np.clip(out, 0, 255).astype(np.uint8)
        want += step
    ff.stdin.write(last.tobytes()); frames += 1
    ok, fr = cap.read(); src_i += 1
    # keep pace: one source frame per output frame when the source is 60 fps; drawings change every `hold`
ff.stdin.close(); ff.wait()
print(a.out, frames, "frames")
