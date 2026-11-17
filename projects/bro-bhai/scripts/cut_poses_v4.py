"""v4 hosts (2026-11-02): cut the 4K sheets assets/generated/hosts/{bro_sheet_v4,bhai_sheet_v4b}.jpg (4 x 3 on flat #00FF00)
into public/hosts/<who>_<pose>.png:
  row 1: neutral, point, think, shock | row 2: laugh, thumbs, shrug, hype | row 3 (lip sync, same pose): talk_m, talk_e, talk_a, talk_o
Each figure is keyed and placed on the v1 canvas (900 x 780, chest centred, cut-off at the bottom) after scaling the sheet to
SCALE. The four mouth frames are then registered to talk_m (translation found by FFT cross-correlation of their
alpha masks), so swapping mouths never moves the head. 'talk' (the v1-v3 name) = talk_a.
    python scripts/cut_poses_v4.py
"""
import pathlib

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = pathlib.Path(__file__).resolve().parents[1]
SHEETS = {'bro': 'bro_sheet_v4.jpg', 'bhai': 'bhai_sheet_v4b.jpg'}
POSES = [['neutral', 'point', 'think', 'shock'], ['laugh', 'thumbs', 'shrug', 'hype'], ['talk_m', 'talk_e', 'talk_a', 'talk_o']]
CW, CH, SCALE = 900, 780, 0.7


def key(rgb):
    r, g, b = (rgb[..., i].astype(float) for i in range(3))
    spill = g - np.maximum(r, b)
    a = 1 - np.clip((spill - 40) / 70, 0, 1)
    out = rgb.astype(float).copy()
    out[..., 1] = np.where(spill > 0, np.maximum(r, b) + np.clip(spill, 0, 30) * 0.2, g)
    return out.clip(0, 255).astype(np.uint8), a


def place(rgb, a, mask):
    ys, xs = np.where(mask)
    y1 = ys.max()
    band = mask[max(0, y1 - 120):y1 + 1]
    cxs = np.where(band.any(0))[0]; cx = int((cxs.min() + cxs.max()) / 2)
    alpha = (np.where(mask, a, 0) * 255).astype(np.uint8)
    rgba = np.dstack([rgb, alpha])
    H, W = mask.shape
    x0, top = cx - CW // 2, y1 + 1 - CH
    canvas = np.zeros((CH, CW, 4), np.uint8)
    sx0, sy0 = max(0, x0), max(0, top); sx1, sy1 = min(W, x0 + CW), min(H, top + CH)
    canvas[sy0 - top:sy1 - top, sx0 - x0:sx1 - x0] = rgba[sy0:sy1, sx0:sx1]
    return canvas


def shift_to(ref, img):
    """translate img so its alpha (top 55 %: the head) best matches ref's"""
    h = int(CH * 0.55)
    A = ref[:h, :, 3].astype(float) / 255; B = img[:h, :, 3].astype(float) / 255
    F = np.fft.fft2(A) * np.conj(np.fft.fft2(B))
    c = np.fft.ifft2(F).real
    dy, dx = np.unravel_index(np.argmax(c), c.shape)
    dy = dy - c.shape[0] if dy > c.shape[0] // 2 else dy
    dx = dx - c.shape[1] if dx > c.shape[1] // 2 else dx
    return np.roll(np.roll(img, dy, 0), dx, 1), (int(dy), int(dx))


def cut(who):
    im = Image.open(ROOT / 'assets/generated/hosts' / SHEETS[who]).convert('RGB')
    im = im.resize((int(im.width * SCALE), int(im.height * SCALE)), Image.LANCZOS)
    rgb, a = key(np.asarray(im))
    H, W = a.shape
    lab, n = ndimage.label(a > 0.5)
    cells = {}
    for i, sl in enumerate(ndimage.find_objects(lab), 1):
        m = lab[sl] == i
        if m.sum() < 400: continue
        cy, cx = ndimage.center_of_mass(lab == i)
        cells.setdefault((int(cy // (H / 3)), int(cx // (W / 4))), []).append(i)
    out = ROOT / 'public/hosts'; out.mkdir(parents=True, exist_ok=True)
    got = {}
    for (r, c), ids in sorted(cells.items()):
        mask = np.isin(lab, ids)
        mask = ndimage.binary_fill_holes(mask) | mask
        got[POSES[r][c]] = place(rgb, a, mask)
    ref = got['talk_m']
    for name in ('talk_e', 'talk_a', 'talk_o'):
        got[name], d = shift_to(ref, got[name]); print(who, name, 'registered by', d)
    got['talk'] = got['talk_a']
    for name, canvas in got.items():
        Image.fromarray(canvas).save(out / f'{who}_{name}.png', optimize=True)
    print(who, sorted(got))


for w in SHEETS:
    cut(w)
