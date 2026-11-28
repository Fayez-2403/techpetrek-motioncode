"""Ink core: every line in the film is a filled, variable-width polygon (never an SVG/PIL stroke).

A `Pic` is a list of vector items in local coordinates (y down). Fills are smoothed and jittered when added
(seeded, so they redraw identically every frame). Ink strokes keep their centre line; their width is in OUTPUT
pixels and is turned into a polygon only at raster time, after the camera transform, so a close-up keeps the
same thin dip-pen line as a wide. Everything is a pure function of its inputs: seeds, never an unseeded random.
"""
from __future__ import annotations
import math
import numpy as np
from PIL import Image, ImageDraw

INK = (23, 11, 8)        # warm sepia-black #170b08
FINE = (77, 20, 10)      # finest strokes #4d140a, slightly see-through
LINE_SCALE = 0.75        # global pen width (thin dip-pen line, about 3 px at 1080 wide)


def rng(seed: int) -> np.random.Generator:
    return np.random.default_rng(int(seed) & 0xFFFFFFFF)


def noise1(n: int, freq: float, seed: int) -> np.ndarray:
    """Smooth 1-D value noise in [-1, 1], n samples, `freq` bumps over the run."""
    r = rng(seed)
    k = int(freq) + 3
    v = r.uniform(-1, 1, k)
    x = np.linspace(0, freq, n)
    i = np.minimum(x.astype(int), k - 2)
    f = x - i
    f = f * f * (3 - 2 * f)
    return v[i] * (1 - f) + v[i + 1] * f


def catmull(P, closed=False, step=6.0) -> np.ndarray:
    """Catmull-Rom through the points, sampled about every `step` local units."""
    P = np.asarray(P, float)
    if len(P) < 2:
        return P
    if len(P) == 2 and not closed:
        n = max(2, int(np.linalg.norm(P[1] - P[0]) / step))
        t = np.linspace(0, 1, n)[:, None]
        return P[0] * (1 - t) + P[1] * t
    Q = np.vstack([P[-1], P, P[0], P[1]]) if closed else np.vstack([2 * P[0] - P[1], P, 2 * P[-1] - P[-2]])
    out = []
    for i in range(1, len(Q) - 2):
        p0, p1, p2, p3 = Q[i - 1], Q[i], Q[i + 1], Q[i + 2]
        k = max(3, int(np.linalg.norm(p2 - p1) / step))
        t = np.linspace(0, 1, k, endpoint=False)[:, None]
        t2, t3 = t * t, t * t * t
        out.append(0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3))
    if not closed:
        out.append(P[-1][None])
    return np.vstack(out)


def jitter(P, amp, seed, closed=True):
    """Hand-cut edges: a slow wobble along the outline normal (local units)."""
    P = np.asarray(P, float)
    if amp <= 0 or len(P) < 3:
        return P
    T = np.roll(P, -1, 0) - np.roll(P, 1, 0) if closed else np.gradient(P, axis=0)
    N = np.c_[-T[:, 1], T[:, 0]]
    N /= np.linalg.norm(N, axis=1, keepdims=True) + 1e-9
    L = np.r_[0, np.cumsum(np.linalg.norm(np.diff(P, axis=0), axis=1))]
    n = noise1(len(P), max(2, L[-1] / 90), seed) * 0.7 + noise1(len(P), max(4, L[-1] / 25), seed + 7) * 0.3
    return P + N * (n * amp)[:, None]


def stroke_poly(C, w, taper=(0.2, 0.25), pressure=0.3, wobble=0.6, seed=0, closed=False):
    """Centre line (output px) -> filled pen polygon: pressure swell, pointed ends, slight wobble."""
    C = np.asarray(C, float)
    if len(C) < 2:
        return None
    d = np.diff(C, axis=0)
    seg = np.hypot(d[:, 0], d[:, 1])
    L = np.r_[0, np.cumsum(seg)]
    tot = L[-1]
    if tot < 0.5:
        return None
    t = L / tot
    T = np.gradient(C, axis=0)
    T /= np.linalg.norm(T, axis=1, keepdims=True) + 1e-9
    N = np.c_[-T[:, 1], T[:, 0]]
    if wobble:
        C = C + N * (noise1(len(C), max(1.5, tot / 60), seed + 3) * wobble)[:, None]
    prof = 1 + pressure * noise1(len(C), max(1.2, tot / 140), seed)
    if not closed:
        a, b = taper
        if a > 0:
            prof = prof * np.clip(t / a, 0, 1) ** 0.65
        if b > 0:
            prof = prof * np.clip((1 - t) / b, 0, 1) ** 0.65
    hw = 0.5 * w * prof
    left, right = C + N * hw[:, None], C - N * hw[:, None]
    return np.vstack([left, right[::-1]])


# ---------- simple shape helpers (local units, y down) ----------
def ell(cx, cy, rx, ry, n=14, rot=0.0):
    a = np.linspace(0, 2 * np.pi, n, endpoint=False)
    x, y = rx * np.cos(a), ry * np.sin(a)
    c, s = math.cos(rot), math.sin(rot)
    return np.c_[cx + x * c - y * s, cy + x * s + y * c]


def arc(cx, cy, rx, ry, a0, a1, n=10):
    a = np.radians(np.linspace(a0, a1, n))
    return np.c_[cx + rx * np.cos(a), cy + ry * np.sin(a)]


def mirror(P, cx=0.0):
    P = np.asarray(P, float).copy()
    P[:, 0] = 2 * cx - P[:, 0]
    return P[::-1]


def affine(tx=0.0, ty=0.0, rot=0.0, sx=1.0, sy=None, px=0.0, py=0.0):
    """3x3 matrix: rotate/scale about pivot (px, py), then translate."""
    sy = sx if sy is None else sy
    c, s = math.cos(rot), math.sin(rot)
    A = np.array([[1, 0, -px], [0, 1, -py], [0, 0, 1]], float)
    B = np.array([[sx * c, -sy * s, 0], [sx * s, sy * c, 0], [0, 0, 1]], float)
    C = np.array([[1, 0, px + tx], [0, 1, py + ty], [0, 0, 1]], float)
    return C @ B @ A


def apply(M, P):
    P = np.asarray(P, float)
    return P @ M[:2, :2].T + M[:2, 2]


class Pic:
    """An ordered list of vector items. Add fills, ink, dots, clipped groups and sub-pictures."""

    def __init__(self):
        self.items = []

    # -- fills --
    def fill(self, pts, color, smooth=True, jit=0.0, seed=0, alpha=255, closed=True):
        P = np.asarray(pts, float)
        if smooth and len(P) >= 3:
            P = catmull(P, closed=closed)
        if jit:
            P = jitter(P, jit, seed)
        self.items.append({"k": "fill", "pts": P, "c": tuple(color[:3]), "a": alpha})
        return P

    # -- ink: centre line kept, width in output px --
    def ink(self, pts, w=4.0, color=INK, taper=(0.2, 0.25), pressure=0.3, wobble=0.6, seed=0,
            closed=False, smooth=True, alpha=255):
        P = np.asarray(pts, float)
        if smooth and len(P) >= 3:
            P = catmull(P, closed=closed)
        elif len(P) == 2:
            P = catmull(P)
        if closed:
            P = np.vstack([P, P[:1]])
        self.items.append({"k": "ink", "C": P, "w": w, "c": tuple(color[:3]), "a": alpha, "tp": taper,
                           "pr": pressure, "wb": wobble, "sd": seed, "cl": closed})

    def outline(self, P, w=4.0, seed=0, color=INK, breaks=3, alpha=255):
        """A closed outline as 2-4 overlapping pen strokes (never one even loop)."""
        P = np.asarray(P, float)
        n = len(P)
        r = rng(seed)
        cuts = np.sort(r.choice(n, size=min(breaks, max(1, n // 6)), replace=False))
        for i, a in enumerate(cuts):
            b = cuts[(i + 1) % len(cuts)]
            idx = np.arange(a, (b if b > a else b + n) + 3) % n          # overlap 3 points into the next stroke
            self.ink(P[idx], w=w, color=color, taper=(0.06, 0.1), pressure=0.35, seed=seed + 11 * i, smooth=False,
                     alpha=alpha)

    def shape(self, pts, color, w=4.0, seed=0, jit=1.5, ink=True, breaks=3):
        P = self.fill(pts, color, jit=jit, seed=seed)
        if ink:
            self.outline(P, w=w, seed=seed + 1, breaks=breaks)
        return P

    def dot(self, p, r, color=INK, alpha=255):
        self.items.append({"k": "dot", "p": np.asarray(p, float), "r": r, "c": tuple(color[:3]), "a": alpha})

    def clip(self, pts, sub: "Pic", smooth=True):
        P = np.asarray(pts, float)
        if smooth and len(P) >= 3 and len(P) < 200:
            P = catmull(P, closed=True)
        self.items.append({"k": "clip", "pts": P, "sub": sub})

    def add(self, other: "Pic", M=None):
        self.items.extend(other.transformed(M).items if M is not None else other.items)

    def transformed(self, M) -> "Pic":
        out = Pic()
        z = math.sqrt(abs(np.linalg.det(M[:2, :2])))
        for it in self.items:
            j = dict(it)
            if it["k"] == "fill":
                j["pts"] = apply(M, it["pts"])
            elif it["k"] == "ink":
                j["C"] = apply(M, it["C"])
                j["z"] = it.get("z", 1.0) * z
            elif it["k"] == "dot":
                j["p"] = apply(M, it["p"][None])[0]
                j["z"] = it.get("z", 1.0) * z
            elif it["k"] == "clip":
                j["pts"] = apply(M, it["pts"])
                j["sub"] = it["sub"].transformed(M)
            out.items.append(j)
        return out


# ---------- raster ----------
def _bbox(P, S, W, H, pad=4):
    x0, y0 = np.floor(P.min(0) * S) - pad
    x1, y1 = np.ceil(P.max(0) * S) + pad
    x0, y0 = max(0, int(x0)), max(0, int(y0))
    x1, y1 = min(W, int(x1)), min(H, int(y1))
    return x0, y0, x1, y1


def _draw_items(img: Image.Image, items, S: int, ox=0.0, oy=0.0, line_zoom=0.3, line_mul=1.0):
    """Draw items onto img (whose pixel (0,0) is local (ox, oy) * S). Alpha items get their own layer."""
    W, H = img.size
    d = ImageDraw.Draw(img)
    off = np.array([ox, oy])

    def pts(P):
        Q = (P - off) * S
        return [tuple(q) for q in Q]

    for it in items:
        k = it["k"]
        if k == "fill":
            P = it["pts"]
            if it["a"] >= 255:
                d.polygon(pts(P), fill=it["c"] + (255,))
            else:
                x0, y0, x1, y1 = _bbox(P - off, S, W, H)
                if x1 <= x0 or y1 <= y0:
                    continue
                lay = Image.new("RGBA", (x1 - x0, y1 - y0), (0, 0, 0, 0))
                ImageDraw.Draw(lay).polygon([(x - x0, y - y0) for x, y in pts(P)], fill=it["c"] + (it["a"],))
                img.alpha_composite(lay, (x0, y0))
        elif k == "ink":
            z = it.get("z", 1.0)
            w = it["w"] * LINE_SCALE * line_mul * (z ** line_zoom)   # close-ups thicken the line only a little
            C = (it["C"] - off)                                    # centre line in output units
            poly = stroke_poly(C * 1.0, w / 1.0, it["tp"], it["pr"], it["wb"], it["sd"], it["cl"])
            if poly is None:
                continue
            if it["a"] >= 255:
                d.polygon([tuple(q) for q in poly * S], fill=it["c"] + (255,))
            else:
                x0, y0, x1, y1 = _bbox(poly, S, W, H)
                if x1 <= x0 or y1 <= y0:
                    continue
                lay = Image.new("RGBA", (x1 - x0, y1 - y0), (0, 0, 0, 0))
                ImageDraw.Draw(lay).polygon([(x * S - x0, y * S - y0) for x, y in poly], fill=it["c"] + (it["a"],))
                img.alpha_composite(lay, (x0, y0))
        elif k == "dot":
            z = it.get("z", 1.0)
            r = it["r"] * line_mul * (z ** line_zoom) * S
            x, y = (it["p"] - off) * S
            if it["a"] >= 255:
                d.ellipse([x - r, y - r, x + r, y + r], fill=it["c"] + (255,))
            else:
                lay = Image.new("RGBA", (int(2 * r) + 4, int(2 * r) + 4), (0, 0, 0, 0))
                ImageDraw.Draw(lay).ellipse([2, 2, 2 + 2 * r, 2 + 2 * r], fill=it["c"] + (it["a"],))
                img.alpha_composite(lay, (max(0, int(x - r - 2)), max(0, int(y - r - 2))))
        elif k == "clip":
            P = it["pts"]
            x0, y0, x1, y1 = _bbox(P - off, S, W, H, pad=2)
            if x1 <= x0 or y1 <= y0:
                continue
            lay = Image.new("RGBA", (x1 - x0, y1 - y0), (0, 0, 0, 0))
            _draw_items(lay, it["sub"].items, S, ox + x0 / S, oy + y0 / S, line_zoom, line_mul)
            mask = Image.new("L", lay.size, 0)
            ImageDraw.Draw(mask).polygon([(x - x0, y - y0) for x, y in pts(P)], fill=255)
            a = np.minimum(np.asarray(lay.getchannel("A")), np.asarray(mask))
            lay.putalpha(Image.fromarray(a))
            img.alpha_composite(lay, (x0, y0))
            d = ImageDraw.Draw(img)


def render(pic: Pic, W: int, H: int, S: int = 3, bg=None, line_zoom=0.3, line_mul=1.0) -> Image.Image:
    """Rasterise at S x supersampling and downscale (anti-aliased). Returns RGBA at W x H.
    line_mul scales every pen width (a half-res preview passes 0.5 ** 0.7 so lines match the full render)."""
    img = Image.new("RGBA", (W * S, H * S), (tuple(bg) + (255,)) if bg is not None else (0, 0, 0, 0))
    _draw_items(img, pic.items, S, line_zoom=line_zoom, line_mul=line_mul)
    return img.resize((W, H), Image.LANCZOS)


def boxy(P, step=22.0):
    """Subdivide a polygon's edges so Catmull-Rom keeps them straight (only the corners round slightly)."""
    P = np.asarray(P, float)
    out = []
    for a, b in zip(P, np.roll(P, -1, 0)):
        n = max(2, int(np.linalg.norm(b - a) / step))
        t = np.linspace(0, 1, n, endpoint=False)[:, None]
        out.append(a * (1 - t) + b * t)
    return np.vstack(out)


def rect(x0, y0, x1, y1, step=22.0):
    return boxy([[x0, y0], [x1, y0], [x1, y1], [x0, y1]], step)
