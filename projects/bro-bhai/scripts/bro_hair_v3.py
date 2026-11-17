"""v3 (2026-11-02, the user's note on v2: "remove tika and give him long hair instead"). kie.ai had 0 credits left, so the
v2 Bro poses are edited in code, deterministically:
  1. the tika is painted out with the forehead's own skin tone (median of the skin ring around it), softened at the edge;
  2. shoulder-length hair is drawn BEHIND the figure (same cartoon style: dark fill, bold outline, two strand lines),
     from the top of his hair down past his ears to the shoulders; the shirt naturally covers it below.
Reads public/hosts_v2/bro_*.png (the cut v2 poses), writes public/hosts/bro_*.png.
    python scripts/bro_hair_v3.py
"""
import pathlib

import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy import ndimage

ROOT = pathlib.Path(__file__).resolve().parents[1]
SRC, OUT = ROOT / 'public/hosts_v2', ROOT / 'public/hosts'
HAIR, LINE, STRAND = (27, 20, 17, 255), (10, 7, 6, 255), (58, 44, 36, 255)


def head(rgba):
    """hair bbox (dark pixels in the top part of the figure) and the face box under it"""
    a = rgba[..., 3] > 128
    ys = np.where(a.any(1))[0]; top = ys.min()
    lum = rgba[..., :3].astype(float).mean(2)
    dark = a & (lum < 55)
    band = dark[top: top + 260]
    yy, xx = np.where(band)
    hx0, hx1, hy0 = xx.min(), xx.max(), top
    return hx0, hx1, hy0


def remove_tika(rgba, hx0, hx1, hy0):
    r, g, b = (rgba[..., i].astype(int) for i in range(3))
    y0, y1 = hy0 + 40, hy0 + 260
    reg = np.zeros(r.shape, bool); reg[y0:y1, hx0:hx1] = True
    red = reg & (r > 150) & (r - g > 70) & (r - b > 60) & (rgba[..., 3] > 128)   # the tika: saturated red/orange
    lab, n = ndimage.label(ndimage.binary_dilation(red, iterations=2))
    if not n: return rgba, 0
    sizes = ndimage.sum(red, lab, range(1, n + 1)); k = int(np.argmax(sizes)) + 1
    m = ndimage.binary_dilation(lab == k, iterations=5)
    ring = ndimage.binary_dilation(m, iterations=8) & ~m & (rgba[..., 3] > 128)
    ring &= ~((r > 150) & (r - g > 70))
    skin = np.median(rgba[ring][:, :3], axis=0)
    out = rgba.copy(); out[m, :3] = skin
    # soften the patch edge into the surrounding skin
    soft = Image.fromarray(out).filter(ImageFilter.GaussianBlur(3)); sa = np.asarray(soft)
    edge = ndimage.binary_dilation(m, iterations=3) & ~ndimage.binary_erosion(m, iterations=2)
    out[edge, :3] = sa[edge, :3]
    return out, int(m.sum())


def catmull(pts, n=14):
    """a closed Catmull-Rom curve through pts (smooth cartoon contours)"""
    out, k = [], len(pts)
    for i in range(k):
        p0, p1, p2, p3 = (np.array(pts[(i + j) % k], float) for j in (-1, 0, 1, 2))
        for t in np.linspace(0, 1, n, endpoint=False):
            out.append(tuple(0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t ** 3)))
    return out


def add_hair(rgba, hx0, hx1, hy0):
    W = hx1 - hx0; cx = (hx0 + hx1) / 2
    img = Image.new('RGBA', (rgba.shape[1], rgba.shape[0]), (0, 0, 0, 0)); d = ImageDraw.Draw(img)
    top, bot = hy0 + 0.04 * W, hy0 + 1.36 * W                     # from the crown to just behind the shoulders
    R = [(cx + 0.30 * W, top), (hx1 + 0.02 * W, top + 0.22 * W), (hx1 + 0.08 * W, top + 0.6 * W), (hx1 + 0.10 * W, top + 0.95 * W),
         (hx1 + 0.13 * W, bot - 0.06 * W), (hx1 + 0.06 * W, bot), (hx1 - 0.02 * W, bot - 0.07 * W), (hx1 - 0.09 * W, bot + 0.01 * W),
         (hx1 - 0.17 * W, bot - 0.1 * W), (cx + 0.16 * W, bot - 0.28 * W)]
    L = [(2 * cx - x, y) for x, y in reversed(R)]
    contour = catmull([(cx, top - 0.02 * W)] + R + [(cx, bot - 0.32 * W)] + L)
    d.polygon(contour, fill=HAIR)
    d.line(contour + [contour[0]], fill=LINE, width=7, joint='curve')
    for sgn in (-1, 1):                                            # flowing strand lines on each lock
        for k, off in enumerate((0.47, 0.58)):
            xs = cx + sgn * off * W
            pts = catmull([(xs, top + 0.5 * W), (xs + sgn * 0.03 * W, top + 0.85 * W), (xs + sgn * 0.01 * W, bot - 0.16 * W - k * 0.04 * W), (xs - sgn * 0.01 * W, top + 0.8 * W)], 10)
            d.line(pts[: len(pts) // 2], fill=STRAND, width=5, joint='curve')
    base = Image.fromarray(rgba)
    img.alpha_composite(base)
    return np.asarray(img)


def main():
    for p in sorted(SRC.glob('bro_*.png')):
        rgba = np.asarray(Image.open(p).convert('RGBA')).copy()
        hx0, hx1, hy0 = head(rgba)
        rgba, n = remove_tika(rgba, hx0, hx1, hy0)
        rgba = add_hair(rgba, hx0, hx1, hy0)
        Image.fromarray(rgba).save(OUT / p.name, optimize=True)
        print(p.name, 'head', hx0, hx1, hy0, 'tika px', n)


if __name__ == '__main__':
    main()
