"""Cut the official Maison Milan product photos out of their white studio backgrounds (alpha mattes), upscale the
small ones 2x (Lanczos + light unsharp), and key the gold 'maison milan' wordmark off the red banner.
    python scripts/assets/cutout.py
Inputs: assets/originals/*.jpg (maisonmilan.co product gallery). Outputs: public/img/*.png"""
import pathlib
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage as ndi

ROOT = pathlib.Path(__file__).resolve().parents[2]
SRC, OUT = ROOT / "assets/originals", ROOT / "public/img"

def matte_white(img, lo=200, hi=246, scale=1):
    a = np.asarray(img.convert("RGB")).astype(np.float32)
    mn = a.min(axis=2)
    near = mn > lo                                 # candidate background (near-white)
    lab, _ = ndi.label(near)
    border = np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))
    bg = np.isin(lab, border[border > 0])
    soft = np.clip((hi - mn) / (hi - lo), 0, 1)    # soft edge from whiteness inside the bg region
    alpha = np.where(bg, soft, 1.0)
    alpha = ndi.gaussian_filter(alpha, 0.7)
    # un-premultiply the white fringe: colour = (c - (1-a)*255)/a
    aa = np.clip(alpha, 1e-3, 1)[..., None]
    rgb = np.clip((a - (1 - aa) * 255) / aa, 0, 255)
    out = Image.fromarray(np.dstack([rgb, alpha * 255]).astype(np.uint8), "RGBA")
    bbox = out.getchannel("A").point(lambda v: 255 if v > 8 else 0).getbbox()
    out = out.crop((max(0, bbox[0] - 6), max(0, bbox[1] - 6), bbox[2] + 6, bbox[3] + 6))
    if scale != 1:
        out = out.resize((out.width * scale, out.height * scale), Image.LANCZOS)
        rgb = out.convert("RGB").filter(ImageFilter.UnsharpMask(2, 60, 2))
        out = Image.merge("RGBA", (*rgb.split(), out.getchannel("A")))
    return out

for name, src, sc in [("bottle_front", "redemp-front.jpg", 2), ("bottle_side", "redemp-side.jpg", 2), ("bottle_box", "renemp-rouge.jpg", 1)]:
    o = matte_white(Image.open(SRC / src), scale=sc); o.save(OUT / f"{name}.png"); print(name, o.size)

# gold wordmark from the banner (gold letters on red): alpha from the green channel, colour kept
ban = Image.open(SRC / "redemp-1-.jpg").convert("RGB")
for name, box in [("wordmark", (1530, 740, 2160, 1050))]:
    c = np.asarray(ban.crop(box)).astype(np.float32)
    g = c[..., 1]; r = c[..., 0]
    alpha = np.clip((g - 55) / (120 - 55), 0, 1) * np.clip((g / np.maximum(r, 1) - 0.42) / 0.25, 0, 1)
    rgb = c.copy()
    o = Image.fromarray(np.dstack([rgb, alpha * 255]).astype(np.uint8), "RGBA")
    o = o.crop(o.getchannel("A").point(lambda v: 255 if v > 30 else 0).getbbox())
    o.save(OUT / f"{name}.png"); print(name, o.size)
