"""Turns one illustration into the layers the sketch reveal needs (public/art/<name>/):
  lines.png   the ink lines only (XDoG on luminance + the strong cream strokes), cream/ink on transparent
  order.png   the drawing order: 0 = drawn first. Starts at the focus point (the face) and spreads outward along
              the lines with a little noise, like a pen moving across the page
  wash.png    the soft order for the watercolour flood (smooth, radial from the focus, noisy edge)
  base.jpg    the illustration itself (1080x1920)
    python scripts/sketch_layers.py <image> <name> <focus_x> <focus_y>     (focus in 1080x1920 coordinates)
"""
import pathlib, sys

import cv2
import numpy as np

ROOT = pathlib.Path(__file__).resolve().parents[1]
src, name, fx, fy = sys.argv[1], sys.argv[2], float(sys.argv[3]), float(sys.argv[4])
out = ROOT / "public/art" / name; out.mkdir(parents=True, exist_ok=True)
W, H = 1080, 1920
img = cv2.imread(src, cv2.IMREAD_COLOR)
img = cv2.resize(img, (W, H), interpolation=cv2.INTER_LANCZOS4)
cv2.imwrite(str(out / "base.jpg"), img, [cv2.IMWRITE_JPEG_QUALITY, 94])
g = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY).astype(np.float32) / 255.0

# XDoG: thin, confident ink lines
def xdog(x, s=0.9, k=1.6, p=22, eps=-0.02, phi=12):
    a, b = cv2.GaussianBlur(x, (0, 0), s), cv2.GaussianBlur(x, (0, 0), s * k)
    d = (1 + p) * a - p * b
    return np.where(d >= eps, 1.0, 1.0 + np.tanh(phi * (d - eps)))
dark = 1.0 - xdog(g)                                   # dark ink strokes (on the cream areas)
light = 1.0 - xdog(1.0 - g)                            # bright strokes (cream lines on the indigo paper)
ink = np.clip(np.maximum(dark, light * 0.9), 0, 1)
ink = cv2.GaussianBlur(ink, (0, 0), 0.6); ink[ink < 0.18] = 0
# line colour: the original pixel colour, pushed toward the ink/cream it already is
rgba = np.dstack([img, (ink * 255).astype(np.uint8)])
cv2.imwrite(str(out / "lines.png"), rgba)

# drawing order: geodesic-ish distance from the focus, through the line pixels (cheap: distance field + noise)
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
d = np.sqrt((xx - fx) ** 2 + ((yy - fy) * 0.85) ** 2)
rng = np.random.default_rng(7)
n = cv2.resize(rng.random((48, 27)).astype(np.float32), (W, H), interpolation=cv2.INTER_CUBIC)
n2 = cv2.resize(rng.random((240, 135)).astype(np.float32), (W, H), interpolation=cv2.INTER_CUBIC)
order = d / d.max() * 0.82 + n * 0.12 + n2 * 0.06
order = (order - order.min()) / (order.max() - order.min())
cv2.imwrite(str(out / "order.png"), (order * 255).astype(np.uint8))
# wash: smoother, a watercolour edge
wash = d / d.max() * 0.75 + cv2.GaussianBlur(n, (0, 0), 20) * 0.25 + n2 * 0.05
wash = (wash - wash.min()) / (wash.max() - wash.min())
cv2.imwrite(str(out / "wash.png"), (wash * 255).astype(np.uint8))
print(out, "ink coverage", round(float((ink > 0).mean()), 3))
