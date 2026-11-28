"""The old-cartoon finish, applied to the whole composed frame (before captions).

soften ~1 px -> unsharp r5 60 % (pale rim on every stroke) -> slow mottling on flat fills -> colour blurred more than
brightness and shifted 2 px off-register -> gentle bloom -> warm tone -> blacks lifted to deep brown -> light vignette
-> fine grain in brightness only. Seeded by the frame index, so it is a pure function of time.
"""
import numpy as np
from PIL import Image, ImageFilter, ImageChops
from scipy.ndimage import gaussian_filter, zoom as nzoom

from .core import rng


def _mottle(h, w, seed, slow):
    r = rng(seed)
    g = r.normal(0, 1, (max(2, h // 90), max(2, w // 90)))
    g = gaussian_filter(g, 1.2)
    m = nzoom(g, (h / g.shape[0], w / g.shape[1]), order=1)[:h, :w]
    return m / (np.abs(m).max() + 1e-9)


def finish(img: Image.Image, frame: int = 0, strength: float = 1.0) -> Image.Image:
    im = img.convert("RGB")
    W, H = im.size
    k = W / 1080.0
    im = im.filter(ImageFilter.GaussianBlur(0.55 * k))
    im = im.filter(ImageFilter.UnsharpMask(radius=5 * k, percent=int(60 * strength), threshold=0))
    # colour channels: blur more than luma, and shift 2 px off-register
    y, cb, cr = im.convert("YCbCr").split()
    cb = ImageChops.offset(cb.filter(ImageFilter.GaussianBlur(1.6 * k)), int(round(2 * k)), 0)
    cr = ImageChops.offset(cr.filter(ImageFilter.GaussianBlur(1.6 * k)), -int(round(2 * k)), int(round(1 * k)))
    im = Image.merge("YCbCr", (y, cb, cr)).convert("RGB")
    a = np.asarray(im).astype(np.float32) / 255.0
    # slow mottling: two fields cross-faded over ~2 s, so fills breathe instead of boiling
    slow = frame / 60.0 / 2.0
    i0 = int(np.floor(slow))
    f = slow - i0
    m = _mottle(H, W, 9001 + i0, slow) * (1 - f) + _mottle(H, W, 9002 + i0, slow) * f
    a *= (1 + 0.025 * strength * m)[..., None]
    # bloom on the bright areas
    lum = a.mean(2)
    br = np.clip((lum - 0.86) / 0.14, 0, 1)[..., None] * a
    a += 0.12 * strength * gaussian_filter(br, (14 * k, 14 * k, 0))
    # warm tone, lifted blacks (deep brown), vignette
    a *= np.array([1.03, 1.0, 0.95], np.float32)
    lift = np.array([0.085, 0.05, 0.04], np.float32)
    a = lift + a * (1 - lift)
    yy, xx = np.mgrid[0:H, 0:W]
    v = ((xx - W / 2) / (W * 0.62)) ** 2 + ((yy - H / 2) / (H * 0.62)) ** 2
    a *= (1 - 0.22 * strength * np.clip(v, 0, 1.6) ** 1.3)[..., None]
    # grain in brightness only
    g = rng(77 + frame).normal(0, 0.016 * strength, (H, W)).astype(np.float32)
    a += g[..., None]
    return Image.fromarray((np.clip(a, 0, 1) * 255 + 0.5).astype(np.uint8))
