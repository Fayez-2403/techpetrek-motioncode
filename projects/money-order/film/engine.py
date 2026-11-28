"""Berth 42 film engine: timeline access, easing/acting helpers, camera, frame compositing (layers with depth of
field, raster text overlays, finish, impact flash, whips, captions). Every frame is a pure function of t."""
from __future__ import annotations
import json, math, pathlib
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

from ink.core import Pic, render, affine, apply, rng
from ink.finish import finish
from ink import palette as K

ROOT = pathlib.Path(__file__).resolve().parents[1]
import os
VER = os.environ.get("BERTH_VER", "v1")
SUFFIX = "" if VER == "v1" else f"_{VER}"
TL = json.loads((ROOT / ("SCENE_TIMINGS.json" if VER == "v1" else f"SCENE_TIMINGS.{VER}.json")).read_text(encoding="utf-8"))
LINES = {l["id"]: l for l in TL["lines"]}
TOTAL = TL["total"]
DFPS = 30                     # drawing rate (cel on twos inside the 60 fps master)
FW, FH = 1080, 1920           # frame space


# ---------------- timeline ----------------
def S(i, d=0.0):
    return LINES[i]["start"] + d


def E(i, d=0.0):
    return LINES[i]["end"] + d


def P(i, k, d=0.0, edge="t0"):
    return LINES[i]["phrases"][k][edge] + d


def Wd(i, k, j, d=0.0, edge="t0"):
    return LINES[i]["phrases"][k]["words"][j][edge] + d


# ---------------- easing + acting ----------------
def clamp(x, a=0.0, b=1.0):
    return max(a, min(b, x))


def prog(t, t0, t1):
    return clamp((t - t0) / max(1e-6, t1 - t0))


def eout(x):                   # land decelerates: most travel early, long tail
    x = clamp(x)
    return 1 - (1 - x) ** 4


def ein(x):                    # leave accelerates
    x = clamp(x)
    return x ** 3


def spring(x, k=7.0, z=0.5):
    """0 -> 1 with one visible overshoot (snap poses)."""
    x = clamp(x, 0, 4)
    return 1 - math.exp(-z * k * x * 3) * math.cos(k * x * 3 * math.sqrt(1 - z * z))


def lerp(a, b, u):
    if isinstance(a, (tuple, list)):
        return tuple(lerp(x, y, u) for x, y in zip(a, b))
    return a + (b - a) * u


def keys(t, ks, dur=0.16, kind="spring"):
    """Piecewise keyed value: ks = [(t, value), ...]. Each change snaps in `dur` with one overshoot (or an ease)."""
    v = ks[0][1]
    for tk, vk in ks[1:]:
        if t < tk:
            break
        u = (t - tk) / dur
        if u >= 1:
            v = vk
        else:
            v = lerp(v, vk, spring(u) if kind == "spring" else eout(u))
    return v


def glide(t, ks):
    """Camera-style keyed value: eased (decelerating) between keys (t, value)."""
    if t <= ks[0][0]:
        return ks[0][1]
    for (t0, a), (t1, b) in zip(ks[:-1], ks[1:]):
        if t <= t1:
            return lerp(a, b, eout(prog(t, t0, t1)) if t1 > t0 else 1)
    return ks[-1][1]


def step(t, ks):
    v = ks[0][1]
    for tk, vk in ks:
        if t >= tk:
            v = vk
    return v


def blinking(t, seed=0, period=2.7):
    ph = (t + (seed % 97) * 0.37) % period
    return ph < 0.1


def shake(t, t0, dur=0.28, amp=14.0, seed=0):
    if not (t0 <= t < t0 + dur):
        return 0.0, 0.0
    a = amp * (1 - (t - t0) / dur) ** 2
    r = rng(seed + int((t - t0) * 60))
    return float(r.uniform(-a, a)), float(r.uniform(-a, a))


def breathe(t, seed=0, amp=0.006, f=0.75):
    return 1 + amp * math.sin(2 * math.pi * f * t + seed)


# ---------------- camera ----------------
def cam(cx, cy, zoom=1.0, rot=0.0, sx=0.0, sy=0.0):
    """World (frame-space set coords) -> screen. (cx, cy) lands at the frame centre."""
    return affine(tx=FW / 2 + sx, ty=FH / 2 + sy) @ affine(rot=rot, sx=zoom) @ affine(tx=-cx, ty=-cy)


def place(M, x, y, s, sy=None, rot=0.0):
    return M @ affine(tx=x, ty=y, sx=s, sy=sy if sy is not None else s, rot=rot)


# ---------------- frame ----------------
class Frame:
    def __init__(self):
        self.layers = []      # (Pic in screen space, blur_px)
        self.texts = []       # (text, x, y, size, color, rot, font, weight, stroke, alpha)
        self.flash = 0.0      # impact flash opacity (<= 0.12)
        self.post = []        # fn(img, scale) after the finish (e.g. the logo)

    def layer(self, pic, blur=0.0):
        self.layers.append((pic, blur))

    def image(self, path, M, rect_world, clip_world=None, alpha=255):
        """A real screenshot placed into the world rect (x0, y0, x1, y1), seen through camera M, optionally clipped
        to another world rect (the phone's screen). It composites in layer order, so hands can be drawn over it."""
        self.layers.append(("img", str(path), M, rect_world, clip_world, alpha))

    def text(self, s, x, y, size, color=K.INK, rot=0.0, font="archivo", weight=900, stroke=0, alpha=255, M=None,
             reveal=1.0):
        if M is not None:
            (x, y), = apply(M, [[x, y]])
            size = size * math.sqrt(abs(np.linalg.det(M[:2, :2])))
            rot = rot - math.degrees(math.atan2(M[1, 0], M[0, 0]))
        self.texts.append((s, x, y, size, color, rot, font, weight, stroke, alpha, reveal))


FONTS = {"archivo": ROOT / "public/fonts/Archivo-VF.ttf", "fredoka": ROOT / "public/fonts/fredoka/Fredoka-VF.ttf",
         "kalam": ROOT / "public/fonts/kalam/Kalam-Bold.ttf", "mono": ROOT / "public/fonts/JetBrainsMono-VF.ttf"}
_fc = {}


def font(name, size, weight=900, width=100):
    k = (name, int(size), weight, width)
    if k not in _fc:
        f = ImageFont.truetype(str(FONTS[name]), max(4, int(size)))
        try:
            ax = f.get_variation_axes()
            vals = []
            for a in ax:
                n = a["name"].decode() if isinstance(a["name"], bytes) else a["name"]
                vals.append(clamp(weight, a["minimum"], a["maximum"]) if n.lower().startswith("weight")
                            else clamp(width, a["minimum"], a["maximum"]))
            f.set_variation_by_axes(vals)
        except Exception:
            pass
        _fc[k] = f
    return _fc[k]


def draw_text(img, s, x, y, size, color, rot=0.0, fname="archivo", weight=900, stroke=0, alpha=255, scale=1.0,
              stroke_color=K.INK, reveal=1.0, anchor="c"):
    f = font(fname, size * scale, weight)
    d = ImageDraw.Draw(Image.new("L", (1, 1)))
    sw = int(round(stroke * scale))
    x0, y0, x1, y1 = d.textbbox((0, 0), s, font=f, stroke_width=sw)
    im = Image.new("RGBA", (x1 - x0 + 10, y1 - y0 + 10), (0, 0, 0, 0))
    ImageDraw.Draw(im).text((5 - x0, 5 - y0), s, font=f, fill=tuple(color) + (alpha,), stroke_width=sw,
                            stroke_fill=tuple(stroke_color) + (alpha,))
    full_w = im.width
    if reveal < 1.0:                                   # handwriting reveal, left to right
        cut = Image.new("RGBA", im.size, (0, 0, 0, 0))
        wv = max(1, int(full_w * max(0.0, reveal)))
        cut.paste(im.crop((0, 0, wv, im.height)), (0, 0))
        im = cut
    if rot:
        im = im.rotate(rot, resample=Image.BICUBIC, expand=True)
    ox = 0 if anchor == "l" else im.width / 2
    pos = (int(x * scale - ox), int(y * scale - im.height / 2))
    if img.mode == "RGBA":
        img.alpha_composite(im, (max(0, pos[0]), max(0, pos[1])) if min(pos) >= 0 else (0, 0)) if min(pos) >= 0 else img.paste(im, pos, im)
    else:
        img.paste(im, pos, im)


# ---------------- captions (the prompt's style) ----------------
def _chunks():
    out = []
    for l in TL["lines"]:
        for ph in l["phrases"]:
            ws = ph["words"]
            cur = []
            for w in ws:
                cur.append(w)
                if len(cur) == 3 or (len(cur) >= 2 and w is ws[-1]) or w is ws[-1]:
                    out.append(cur)
                    cur = []
            if cur:
                out.append(cur)
    res = []
    for i, c in enumerate(out):
        t0 = c[0]["t0"] - 0.03
        t1 = min(out[i + 1][0]["t0"] - 0.03 if i + 1 < len(out) else c[-1]["t1"] + 0.4, c[-1]["t1"] + 0.45)
        res.append((t0, t1, " ".join(w["w"] for w in c)))
    return res


CHUNKS = _chunks()


def caption(img, t, scale, y=1430):
    for t0, t1, s in CHUNKS:
        if t0 <= t < t1:
            dim = (t - t0) < 3 / DFPS                       # arrives dim for 3 frames, then full
            col = K.mix((255, 226, 26), K.CREAM_SH, 0.55) if dim else (255, 226, 26)
            size = 96 if len(s) < 14 else (84 if len(s) < 20 else 72)
            draw_text(img, s, FW / 2 + 3, y + 6, size, K.INK, fname="fredoka", weight=700, stroke=9, alpha=150,
                      scale=scale)                           # soft drop
            draw_text(img, s, FW / 2, y, size, col, fname="fredoka", weight=700, stroke=9, scale=scale)
            return


# ---------------- whips ----------------
def whip(img, amount, direction=1):
    """Blur-whip: directional smear (averaged shifted copies). amount 0..1."""
    if amount <= 0.01:
        return img
    a = np.asarray(img).astype(np.float32)
    W = a.shape[1]
    n = 9
    span = amount * W * 0.16
    acc = np.zeros_like(a)
    for k in range(n):
        dx = int(direction * (k / (n - 1) - 0.5) * span + direction * amount * W * 0.06)
        acc += np.roll(a, dx, axis=1)
    return Image.fromarray(np.clip(acc / n, 0, 255).astype(np.uint8))


_imgc = {}


def _place_image(entry, W, H, Mout):
    _, path, M, (x0, y0, x1, y1), clip, alpha = entry
    if path not in _imgc:
        _imgc[path] = Image.open(path).convert("RGBA")
    src = _imgc[path]
    iw, ih = src.size
    A = Mout @ M @ np.array([[(x1 - x0) / iw, 0, x0], [0, (y1 - y0) / ih, y0], [0, 0, 1]], float)
    inv = np.linalg.inv(A)
    out = src.transform((W, H), Image.AFFINE, data=(inv[0, 0], inv[0, 1], inv[0, 2], inv[1, 0], inv[1, 1], inv[1, 2]),
                        resample=Image.BICUBIC, fillcolor=(0, 0, 0, 0))
    if clip is not None or alpha < 255:
        m = Image.new("L", (W, H), 0)
        if clip is not None:
            cx0, cy0, cx1, cy1 = clip
            q = apply(Mout @ M, [[cx0, cy0], [cx1, cy0], [cx1, cy1], [cx0, cy1]])
            ImageDraw.Draw(m).polygon([tuple(v) for v in q], fill=alpha)
        else:
            m = Image.new("L", (W, H), alpha)
        a_ = np.minimum(np.asarray(out.getchannel("A")), np.asarray(m))
        out.putalpha(Image.fromarray(a_))
    return out


def compose(fr: Frame, t, W, H, S, scale):
    """Frame -> finished RGB image (before whips/captions)."""
    Mout = affine(sx=scale)
    lm = scale / (scale ** 0.3) if scale != 1 else 1.0
    img = None
    for entry in fr.layers:
        if isinstance(entry[0], str) and entry[0] == "img":
            L = _place_image(entry, W, H, Mout)
        else:
            pic, blur = entry
            L = render(pic.transformed(Mout), W, H, S, line_mul=lm)
            if blur:
                L = L.filter(ImageFilter.GaussianBlur(blur * scale))
        img = L if img is None else Image.alpha_composite(img, L)
    if img is None:
        img = Image.new("RGBA", (W, H), K.CREAM + (255,))
    for (s, x, y, size, color, rot, fname, weight, stroke, alpha, reveal) in fr.texts:
        draw_text(img, s, x, y, size, color, rot, fname, weight, stroke, alpha, scale, reveal=reveal)
    out = finish(img, frame=int(round(t * 60)))
    if fr.flash > 0:
        a = np.asarray(out).astype(np.float32)
        a = a * (1 - fr.flash) + np.array(K.CREAM, np.float32) * fr.flash
        out = Image.fromarray(a.astype(np.uint8))
    for fn in fr.post:
        fn(out, scale)
    return out
