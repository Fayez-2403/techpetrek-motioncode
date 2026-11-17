"""Cut the approved host pose sheets (assets/generated/hosts/<who>_sheet_v1.jpg: 8 poses, 4 x 2 on flat #00FF00) into one
transparent PNG per pose: public/hosts/<who>_<pose>.png. Each figure is taken as its own connected shape (a shrugging
arm that crosses into the next cell stays with its owner), keyed off the green with a soft edge and the green spill
removed, then placed on a fixed 900x780 canvas with the chest centred and the cut-off at the bottom, so swapping poses
never makes the body jump.
    python scripts/cut_poses.py
"""
import pathlib

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = pathlib.Path(__file__).resolve().parents[1]
POSES = ['neutral', 'talk', 'point', 'think', 'shock', 'laugh', 'thumbs', 'shrug']
CW, CH = 900, 780


def key(rgb):
    r, g, b = (rgb[..., i].astype(float) for i in range(3))
    spill = g - np.maximum(r, b)                                  # how much greener than the other channels
    a = 1 - np.clip((spill - 40) / 70, 0, 1)                      # pure green -> 0, a soft ramp at the edge
    out = rgb.astype(float).copy()
    out[..., 1] = np.where(spill > 0, np.maximum(r, b) + np.clip(spill, 0, 30) * 0.2, g)   # despill
    return out.clip(0, 255).astype(np.uint8), a


def cut(who):
    im = np.asarray(Image.open(ROOT / f'assets/generated/hosts/{who}_sheet_v1.jpg').convert('RGB'))
    H, W = im.shape[:2]; rgb, a = key(im)
    lab, n = ndimage.label(a > 0.5)
    cells = {}
    for i, sl in enumerate(ndimage.find_objects(lab), 1):
        m = lab[sl] == i
        if m.sum() < 400: continue                                # specks
        cy, cx = ndimage.center_of_mass(lab == i)
        cells.setdefault((int(cy // (H / 2)), int(cx // (W / 4))), []).append(i)
    out = ROOT / 'public/hosts'; out.mkdir(parents=True, exist_ok=True)
    for (r, c), ids in sorted(cells.items()):
        mask = np.isin(lab, ids)
        mask = ndimage.binary_fill_holes(mask) | (mask)           # keep the lens interiors (clear glasses stay see-through via alpha)
        ys, xs = np.where(mask)
        y1 = ys.max()                                             # the flat cut-off at the bottom of the figure
        band = mask[y1 - 120:y1 + 1]                              # chest / shoulders: a stable centre across poses
        cxs = np.where(band.any(0))[0]; cx = int((cxs.min() + cxs.max()) / 2)
        alpha = np.where(mask, a, 0) * 255
        rgba = np.dstack([rgb, alpha.astype(np.uint8)])
        x0, top = cx - CW // 2, y1 + 1 - CH
        canvas = np.zeros((CH, CW, 4), np.uint8)
        sx0, sy0 = max(0, x0), max(0, top); sx1, sy1 = min(W, x0 + CW), min(H, top + CH)
        canvas[sy0 - top:sy1 - top, sx0 - x0:sx1 - x0] = rgba[sy0:sy1, sx0:sx1]
        # anything that belongs to a neighbouring figure inside this window is already transparent (mask is per figure)
        name = POSES[r * 4 + c]
        Image.fromarray(canvas).save(out / f'{who}_{name}.png', optimize=True)
        print(who, name, 'figure px', int(mask.sum()), 'chest x', cx)


for w in ('bro', 'bhai'):
    cut(w)
