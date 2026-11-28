"""Reusable drawing kit: eyes with a hooded lid, mouths with every tooth, padded hands, ticks, dots, dash rows,
barbed facial hair, stripes, plaid, wood grain, a sparkle glint and a haloed moon. Local units, y down."""
import math
import numpy as np

from .core import Pic, rng, ell, arc, catmull, affine, apply, INK, FINE
from . import palette as K


# ---------------- textures ----------------
def _pts_in_ellipse(n, cx, cy, rx, ry, seed):
    r = rng(seed)
    a = r.uniform(0, 2 * np.pi, n)
    d = np.sqrt(r.uniform(0, 1, n))
    return np.c_[cx + rx * d * np.cos(a), cy + ry * d * np.sin(a)]


def pores(pic, cx, cy, rx, ry, n=18, seed=0, r=1.15, alpha=170, density=3.0):
    rr = rng(seed + 5)
    for p in _pts_in_ellipse(int(n * density), cx, cy, rx * 1.3, ry * 1.3, seed):
        pic.dot(p, r * rr.uniform(0.6, 1.25), K.FINE, alpha=alpha)


def ticks(pic, cx, cy, rx, ry, n=30, length=9, angle=90, spread=25, w=1.7, seed=0, color=K.FINE, alpha=210):
    """Short pen ticks (stubble, grass, fur): never long hatching."""
    r = rng(seed)
    for i, p in enumerate(_pts_in_ellipse(n, cx, cy, rx, ry, seed + 1)):
        a = math.radians(angle + r.uniform(-spread, spread))
        L = length * r.uniform(0.7, 1.25)
        q = p + np.array([math.cos(a), -math.sin(a)]) * L
        pic.ink([p, q], w=w, color=color, taper=(0.35, 0.5), pressure=0.2, wobble=0.2, seed=seed + 3 * i, alpha=alpha)


def dash_rows(pic, path, rows=3, gap=10, dash=9, step=14, w=1.8, seed=0, color=K.INK, alpha=230, tilt=0.5):
    """Rows of small dashes along a path (knit, fur, chest hair)."""
    P = catmull(np.asarray(path, float))
    L = np.r_[0, np.cumsum(np.linalg.norm(np.diff(P, axis=0), axis=1))]
    T = np.gradient(P, axis=0)
    T /= np.linalg.norm(T, axis=1, keepdims=True) + 1e-9
    N = np.c_[-T[:, 1], T[:, 0]]
    r = rng(seed)
    for row in range(rows):
        s = (row % 2) * step / 2
        while s < L[-1]:
            i = np.searchsorted(L, s)
            i = min(i, len(P) - 1)
            p = P[i] + N[i] * (row * gap) + r.normal(0, 1.2, 2)
            d = (T[i] * tilt + N[i] * (1 - tilt))
            d /= np.linalg.norm(d)
            pic.ink([p - d * dash / 2, p + d * dash / 2], w=w, color=color, taper=(0.4, 0.4), pressure=0.2,
                    wobble=0.2, seed=seed + int(s), alpha=alpha)
            s += step * r.uniform(0.85, 1.15)


def stripes(sub, x0, y0, x1, y1, every=34, width=14, color=K.RED, angle=0.0):
    """Fill a clip group with stripes (use inside Pic.clip)."""
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    R = math.hypot(x1 - x0, y1 - y0)
    M = affine(rot=angle, px=cx, py=cy)
    y = cy - R
    while y < cy + R:
        rect = np.array([[cx - R, y], [cx + R, y], [cx + R, y + width], [cx - R, y + width]])
        sub.fill(apply(M, rect), color, smooth=False)
        y += every


def plaid(sub, x0, y0, x1, y1, base, a, b, every=46):
    sub.fill([[x0, y0], [x1, y0], [x1, y1], [x0, y1]], base, smooth=False)
    x = x0
    while x < x1:
        sub.fill([[x, y0], [x + 12, y0], [x + 12, y1], [x, y1]], a, smooth=False, alpha=150)
        x += every
    y = y0
    while y < y1:
        sub.fill([[x0, y], [x1, y], [x1, y + 12], [x0, y + 12]], a, smooth=False, alpha=150)
        y += every
    x = x0 + every / 2
    while x < x1:
        sub.ink([[x, y0], [x, y1]], w=1.4, color=b, taper=(0, 0), pressure=0.1, wobble=0.3, seed=int(x), alpha=170)
        x += every


def wood(pic, x0, y0, x1, y1, plank=70, seed=0, horizontal=True):
    """Plank seams + grain ticks."""
    r = rng(seed)
    if horizontal:
        y = y0 + plank
        while y < y1:
            pic.ink([[x0, y], [x1, y + r.uniform(-2, 2)]], w=2.6, taper=(0.02, 0.02), pressure=0.25, seed=int(y))
            y += plank
        for i in range(int((x1 - x0) * (y1 - y0) / 2600)):
            p = np.array([r.uniform(x0, x1), r.uniform(y0, y1)])
            pic.ink([p, p + [r.uniform(10, 22), r.uniform(-1, 1)]], w=1.4, color=K.FINE, taper=(0.4, 0.4),
                    pressure=0.1, seed=seed + i, alpha=170)
    else:
        x = x0 + plank
        while x < x1:
            pic.ink([[x, y0], [x + r.uniform(-2, 2), y1]], w=2.6, taper=(0.02, 0.02), pressure=0.25, seed=int(x))
            x += plank
        for i in range(int((x1 - x0) * (y1 - y0) / 2600)):
            p = np.array([r.uniform(x0, x1), r.uniform(y0, y1)])
            pic.ink([p, p + [r.uniform(-1, 1), r.uniform(10, 22)]], w=1.4, color=K.FINE, taper=(0.4, 0.4),
                    pressure=0.1, seed=seed + i, alpha=170)


def sparkle(pic, x, y, s=1.0, color=K.CREAM):
    """One glint on a lamp, coin or blade: a 4-point star."""
    a, b = 26 * s, 5 * s
    pic.fill([[x, y - a], [x + b, y - b], [x + a, y], [x + b, y + b], [x, y + a], [x - b, y + b], [x - a, y],
              [x - b, y - b]], color, smooth=False)


def moon(pic, x, y, r=70):
    for k, al in ((3.2, 26), (2.3, 40), (1.6, 70)):
        pic.fill(ell(x, y, r * k, r * k, 28), K.mix(K.CREAM, K.COBALT, 0.35), alpha=al)
    pic.fill(ell(x, y, r, r, 28), K.mix(K.CREAM, K.GOLD, 0.12))


# ---------------- faces ----------------
def eye(pic, cx, cy, s=1.0, expr="neutral", look=(0.0, 0.0), seed=0, side=1, hood=0.38, skin=K.SKIN):
    """A small hooded eye: lilac white, dot pupil, skin lid over the top, thick lash line. `side` = -1 left, 1 right."""
    lx, ly = look
    if expr in ("blink", "asleep", "snore"):
        pic.fill(ell(cx, cy, 27 * s, 17 * s, 16), skin, smooth=True)
        pic.ink(arc(cx, cy - 4 * s, 26 * s, 12 * s, 200, 340, 9), w=4.6, taper=(0.15, 0.3), seed=seed)
        pic.ink(arc(cx, cy + 4 * s, 18 * s, 6 * s, 30, 150, 7), w=1.5, color=K.FINE, alpha=200, seed=seed + 1)
        return
    if expr == "joy":
        pic.ink(arc(cx, cy + 6 * s, 24 * s, 16 * s, 195, 345, 9), w=4.8, taper=(0.15, 0.25), seed=seed)
        pic.ink(arc(cx, cy + 14 * s, 18 * s, 6 * s, 20, 160, 7), w=1.5, color=K.FINE, alpha=200, seed=seed + 1)
        return
    if expr == "shock":
        R = 40 * s
        pic.fill(ell(cx, cy, R, R * 1.05, 20), K.LILAC)
        pic.outline(ell(cx, cy, R, R * 1.05, 20), w=3.2, seed=seed, breaks=2)
        pic.dot((cx + lx * 6 * s, cy + ly * 6 * s), 3.2 * s, K.INK)
        for i in range(5):                                         # lashes tick off the top
            a = math.radians(205 + i * 32)
            p = np.array([cx + math.cos(a) * R, cy + math.sin(a) * R * 1.05])
            pic.ink([p, p + np.array([math.cos(a), math.sin(a)]) * 9 * s], w=2.2, taper=(0.1, 0.6), seed=seed + i)
        return
    rx, ry = 26 * s, 18 * s
    if expr == "anger":
        rx, ry, hood = 23 * s, 15 * s, 0.5
    if expr == "smug":
        hood = 0.56
    W = ell(cx, cy, rx, ry, 18)
    pic.fill(W, K.LILAC)
    pr = 6.6 * s if expr != "anger" else 4.6 * s
    pic.dot((cx + lx * rx * 0.45, cy + ly * ry * 0.3 + 2 * s), pr, K.INK)
    # the hooded lid: skin covering the top of the white, tilted down at the inner corner when angry
    inner = -side
    tilt = (8 * s if expr == "anger" else 0)
    top = cy - ry * (1 - 2 * hood)
    lid = [[cx - rx * 1.25, cy - 2 * ry], [cx + rx * 1.25, cy - 2 * ry],
           [cx + rx * 1.18, top + (tilt if inner > 0 else -tilt * 0.3)],
           [cx, top + 2 * s], [cx - rx * 1.18, top + (tilt if inner < 0 else -tilt * 0.3)]]
    sub = Pic()
    sub.fill(lid, skin, smooth=False)
    pic.clip(ell(cx, cy, rx * 1.02, ry * 1.04, 18), sub)
    lash = [[cx - rx * 1.12, top + (tilt if inner < 0 else 0) + 3 * s], [cx, top + 1 * s],
            [cx + rx * 1.12, top + (tilt if inner > 0 else 0) + 3 * s]]
    pic.ink(lash, w=5.2, taper=(0.12, 0.35), pressure=0.25, seed=seed)
    pic.ink(arc(cx, cy, rx * 0.95, ry * 0.95, 25, 155, 9), w=1.6, color=K.FINE, alpha=210, seed=seed + 2)


def bags(pic, cx, cy, s=1.0, n=2, seed=0):
    for i in range(n):
        pic.ink(arc(cx, cy + (24 + i * 10) * s, (22 - i * 3) * s, (7 + i * 2) * s, 25, 155, 8), w=1.7,
                color=K.FINE, alpha=190, seed=seed + i)


def brow(pic, cx, cy, s=1.0, expr="neutral", side=1, seed=0, thick=1.0):
    """A thick solid brow with a barbed lower edge. side: -1 = viewer-left eye, 1 = viewer-right."""
    lift = {"shock": -26, "anger": 10, "smug": -6, "joy": -10}.get(expr, 0) * s
    tilt = {"anger": 16, "shock": -6, "smug": 6}.get(expr, 0) * s
    inner_x = cx - side * 30 * s
    outer_x = cx + side * 32 * s
    top = [[outer_x, cy - 6 * s + lift - tilt * 0.3], [cx, cy - 14 * s + lift], [inner_x, cy - 10 * s + lift + tilt]]
    bot = [[inner_x, cy + 2 * s * thick + lift + tilt], [cx, cy - 2 * s + lift], [outer_x, cy + 4 * s + lift - tilt * 0.3]]
    pic.fill(np.vstack([top, bot]), K.INK, smooth=True, jit=1.2 * s, seed=seed)
    for i in range(5):                                                # barbs
        t = i / 4
        p = np.array(bot[0]) * (1 - t) + np.array(bot[2]) * t
        pic.ink([p, p + [side * 4 * s, 7 * s]], w=2.0, taper=(0.1, 0.7), seed=seed + i)


def teeth_row(pic, x0, x1, y, h, n, gold=None, seed=0, down=True):
    """Teeth drawn one by one along a row (down=True hangs from the top lip)."""
    wtooth = (x1 - x0) / n
    for i in range(n):
        a = x0 + i * wtooth
        mid = abs((i + 0.5) / n - 0.5) * 2
        hh = h * (1 - 0.35 * mid * mid)
        if down:
            P = [[a + 1, y], [a + wtooth - 1, y], [a + wtooth - 1.5, y + hh * 0.8], [a + wtooth / 2, y + hh],
                 [a + 1.5, y + hh * 0.8]]
        else:
            P = [[a + 1, y], [a + wtooth - 1, y], [a + wtooth - 1.5, y - hh * 0.8], [a + wtooth / 2, y - hh],
                 [a + 1.5, y - hh * 0.8]]
        c = K.GOLD if gold is not None and i == gold else K.TEETH
        pic.fill(P, c, smooth=True)
        pic.ink(P + [P[0]], w=1.4, color=K.FINE, taper=(0, 0), pressure=0.15, wobble=0.2, seed=seed + i,
                smooth=False, alpha=220)
        if c == K.GOLD:
            sparkle(pic, a + wtooth * 0.5, y + (hh * 0.35 if down else -hh * 0.35), 0.45)


def mouth(pic, cx, cy, s=1.0, kind="flat", seed=0, gold=None, skin=K.SKIN, wide=1.0):
    """Mouths are fully drawn: lip rim, dark interior, tongue, both rows of teeth, gums on a grin."""
    W = 70 * s * wide
    if kind == "flat":
        pic.ink([[cx - W, cy + 2 * s], [cx - W * 0.3, cy - 3 * s], [cx + W * 0.3, cy - 1 * s], [cx + W, cy + 3 * s]],
                w=4.2, taper=(0.15, 0.15), seed=seed)
        for sx in (-1, 1):
            pic.ink([[cx + sx * W, cy + 2 * s], [cx + sx * (W + 9 * s), cy - 7 * s]], w=2.2, taper=(0.2, 0.6),
                    seed=seed + sx)
        pic.ink(arc(cx, cy + 18 * s, W * 0.35, 6 * s, 20, 160, 7), w=1.6, color=K.FINE, alpha=200, seed=seed + 4)
        return
    if kind == "o":
        P = ell(cx, cy, 16 * s, 20 * s, 14)
        pic.fill(P, K.MOUTH)
        pic.outline(P, w=3.6, seed=seed, breaks=2)
        return
    if kind in ("grin", "smug"):
        top = [[cx - W, cy - 6 * s], [cx, cy + 2 * s], [cx + W, cy - 6 * s]]
        bot = [[cx + W * 0.92, cy + 2 * s], [cx, cy + 46 * s], [cx - W * 0.92, cy + 2 * s]]
        O = catmull(np.vstack([top, bot]), closed=True)
        pic.fill(O, K.MOUTH, smooth=False)
        sub = Pic()
        sub.fill(ell(cx, cy + 4 * s, W, 10 * s, 16), K.mix(K.RED, K.SKIN, 0.3))            # gums
        teeth_row(sub, cx - W * 0.86, cx + W * 0.86, cy + 2 * s, 22 * s, 9, gold=gold, seed=seed)
        sub.fill(ell(cx + 6 * s, cy + 44 * s, W * 0.5, 16 * s, 16), K.TONGUE)
        pic.clip(O, sub, smooth=False)
        pic.outline(O, w=4.0, seed=seed + 9, breaks=2)
        for sx in (-1, 1):
            pic.ink([[cx + sx * W * 0.98, cy - 4 * s], [cx + sx * (W + 14 * s), cy - 14 * s]], w=2.6,
                    taper=(0.2, 0.7), seed=seed + sx)
        pic.ink(arc(cx, cy + 56 * s, W * 0.4, 8 * s, 20, 160, 7), w=1.8, color=K.FINE, alpha=200, seed=seed + 5)
        return
    if kind in ("shock", "roar"):
        H = (88 if kind == "shock" else 70) * s
        O = ell(cx, cy + H * 0.45, W * 0.62, H * 0.55, 18)
        pic.fill(O, K.MOUTH, smooth=True)
        sub = Pic()
        teeth_row(sub, cx - W * 0.5, cx + W * 0.5, cy - 2 * s, 16 * s, 8, gold=gold, seed=seed)
        teeth_row(sub, cx - W * 0.42, cx + W * 0.42, cy + H, 13 * s, 7, seed=seed + 20, down=False)
        sub.fill(ell(cx, cy + H * 0.86, W * 0.4, H * 0.2, 14), K.TONGUE)
        pic.clip(O, sub, smooth=False)
        pic.outline(O, w=4.2, seed=seed + 9, breaks=2)
        return
    if kind == "snarl":
        O = catmull(np.array([[cx - W, cy], [cx - W * 0.4, cy - 12 * s], [cx + W * 0.4, cy - 12 * s], [cx + W, cy],
                              [cx + W * 0.5, cy + 30 * s], [cx - W * 0.5, cy + 30 * s]]), closed=True)
        pic.fill(O, K.MOUTH, smooth=False)
        sub = Pic()
        teeth_row(sub, cx - W * 0.85, cx + W * 0.85, cy - 12 * s, 21 * s, 9, gold=gold, seed=seed)
        teeth_row(sub, cx - W * 0.7, cx + W * 0.7, cy + 30 * s, 17 * s, 8, seed=seed + 20, down=False)
        pic.clip(O, sub, smooth=False)
        pic.outline(O, w=4.2, seed=seed + 9, breaks=2)


def barbed(pic, P, color=K.INK, seed=0, barbs=14, length=10, w=2.0, side=1):
    """Solid facial hair with barbed edges: the fill, then short barbs along its lower edge."""
    pic.fill(P, color, smooth=True, jit=1.5, seed=seed)
    Q = catmull(np.asarray(P, float), closed=True)
    r = rng(seed)
    idx = np.linspace(0, len(Q) - 1, barbs).astype(int)
    T = np.gradient(Q, axis=0)
    T /= np.linalg.norm(T, axis=1, keepdims=True) + 1e-9
    N = np.c_[T[:, 1], -T[:, 0]] * side
    for k, i in enumerate(idx):
        p = Q[i]
        pic.ink([p, p + N[i] * length * r.uniform(0.6, 1.3) + T[i] * r.uniform(-3, 3)], w=w, color=color,
                taper=(0.05, 0.8), seed=seed + k)


# ---------------- hands ----------------
def _finger(pic, base, ang, L, Wf, color, seed, nail=True, bend=0.0):
    """A padded finger: capsule with joint bulges, crease ticks at the knuckles, a short nail that stops at the tip."""
    d = np.array([math.sin(ang), -math.cos(ang)])
    n = np.array([-d[1], d[0]])
    pts_l, pts_r = [], []
    for t in np.linspace(0, 1, 7):
        bulge = 1 + 0.12 * math.exp(-((t - 0.38) / 0.1) ** 2) + 0.1 * math.exp(-((t - 0.7) / 0.1) ** 2)
        wdt = Wf * (1 - 0.18 * t) * bulge / 2
        c = base + d * L * t + n * bend * L * t * t
        pts_l.append(c + n * wdt)
        pts_r.append(c - n * wdt)
    tip = base + d * L * 1.07 + n * bend * L
    P = np.vstack([pts_l, [tip], pts_r[::-1]])
    pic.fill(P, color, smooth=True, seed=seed)
    pic.outline(catmull(P, closed=True), w=2.8, seed=seed, breaks=2)
    for t in (0.38, 0.7):                                                         # crease ticks
        c = base + d * L * t + n * bend * L * t * t
        pic.ink([c + n * Wf * 0.28, c - n * Wf * 0.16], w=1.5, color=K.FINE, taper=(0.3, 0.5), seed=seed + int(t * 9))
    if nail:
        c = base + d * L * 0.9 + n * bend * L * 0.81
        N = ell(c[0], c[1], Wf * 0.24, L * 0.11, 10, rot=ang)
        pic.fill(N, K.SKIN_LI)
        pic.ink(np.vstack([N, N[:1]]), w=1.3, color=K.FINE, taper=(0, 0), pressure=0.1, seed=seed + 5, alpha=220,
                smooth=False)


def hand(pic, x, y, s=1.0, rot=0.0, pose="open", shade=False, seed=0, ring=None, mirror_x=False):
    """Wrist at (x, y), fingers point up when rot = 0. pose: open | fist | point | hold."""
    color = K.SKIN_SH if shade else K.SKIN
    sub = Pic()
    pw, ph = 86, 80
    if pose == "fist":
        body = [[-pw * 0.5, 0], [-pw * 0.58, -ph * 0.6], [-pw * 0.45, -ph * 1.05], [0, -ph * 1.16], [pw * 0.5, -ph * 1.08],
                [pw * 0.6, -ph * 0.55], [pw * 0.5, 0]]
        sub.fill(body, color, jit=1.2, seed=seed)
        sub.outline(catmull(np.array(body, float), closed=True), w=3.2, seed=seed, breaks=3)
        for i in range(4):                                                         # curled fingers + knuckle bumps
            cx = -pw * 0.36 + i * pw * 0.24
            sub.ink(arc(cx, -ph * 0.98, pw * 0.13, ph * 0.18, 200, 340, 7), w=2.4, seed=seed + i)
            sub.ink([[cx + pw * 0.12, -ph * 0.95], [cx + pw * 0.12, -ph * 0.62]], w=2.0, taper=(0.1, 0.5), seed=seed + 10 + i)
        th = [[-pw * 0.55, -ph * 0.45], [-pw * 0.1, -ph * 0.62], [pw * 0.25, -ph * 0.56], [pw * 0.22, -ph * 0.44],
              [-pw * 0.2, -ph * 0.36]]
        sub.fill(th, color, seed=seed + 30)
        sub.outline(catmull(np.array(th, float), closed=True), w=2.6, seed=seed + 31, breaks=2)
        nail = ell(pw * 0.16, -ph * 0.5, 9, 6, 10)
        sub.fill(nail, K.SKIN_LI)
        sub.ink(np.vstack([nail, nail[:1]]), w=1.2, color=K.FINE, taper=(0, 0), smooth=False, alpha=220, seed=seed)
    else:
        palm = [[-pw * 0.42, 0], [-pw * 0.55, -ph * 0.55], [-pw * 0.48, -ph], [pw * 0.5, -ph * 1.02], [pw * 0.56, -ph * 0.5],
                [pw * 0.42, 0]]
        L = [62, 72, 68, 52]
        spread = [-0.2, -0.06, 0.07, 0.2] if pose == "open" else [-0.05, 0, 0.04, 0.08]
        curl = [0, 0, 0, 0] if pose == "open" else [0.25, 0.3, 0.32, 0.35]
        if pose == "point":
            L = [62, 40, 36, 30]
            curl = [0, 0.7, 0.75, 0.8]
        for i in range(4):
            bx = -pw * 0.36 + i * pw * 0.24
            _finger(sub, np.array([bx, -ph * 0.92]), spread[i], L[i] * (0.62 if curl[i] > 0.5 else 1), 21, color,
                    seed + 40 * i, bend=curl[i])
        sub.fill(palm, color, jit=1.0, seed=seed)
        sub.outline(catmull(np.array(palm, float), closed=True), w=3.0, seed=seed + 2, breaks=3)
        sub.ink(arc(0, -ph * 0.4, pw * 0.3, ph * 0.18, 200, 320, 7), w=1.6, color=K.FINE, alpha=200, seed=seed + 3)
        _finger(sub, np.array([-pw * 0.5, -ph * 0.35]), -0.95, 50, 25, color, seed + 200, bend=0.05)
        if ring is not None:
            c = np.array([-pw * 0.36 + ring * pw * 0.24, -ph * 0.92 - 18])
            sub.fill(ell(c[0], c[1], 13, 5, 12), K.GOLD)
            sparkle(sub, c[0] + 6, c[1] - 2, 0.35)
    M = affine(tx=x, ty=y, rot=rot, sx=(-s if mirror_x else s), sy=s)
    pic.add(sub, M)


# ---------------- hand-lettered numerals (ink, never a font) ----------------
_DIG = {
    "0": [[[0.3, 0], [0.55, 0.18], [0.58, 0.55], [0.45, 0.92], [0.25, 1.0], [0.05, 0.8], [0.02, 0.4], [0.12, 0.08], [0.3, 0]]],
    "1": [[[0.14, 0.2], [0.34, 0.0], [0.34, 1.0]], [[0.12, 1.0], [0.52, 1.0]]],
    "2": [[[0.05, 0.22], [0.25, 0.0], [0.52, 0.12], [0.5, 0.38], [0.04, 1.0], [0.6, 0.98]]],
    "3": [[[0.06, 0.12], [0.3, 0.0], [0.52, 0.16], [0.42, 0.44], [0.22, 0.48]], [[0.22, 0.48], [0.52, 0.6], [0.54, 0.86], [0.3, 1.0], [0.04, 0.88]]],
    "4": [[[0.46, 1.0], [0.46, 0.0], [0.02, 0.66], [0.62, 0.66]]],
    "5": [[[0.56, 0.0], [0.12, 0.02], [0.08, 0.44], [0.4, 0.4], [0.58, 0.66], [0.44, 0.94], [0.2, 1.0], [0.02, 0.88]]],
    "6": [[[0.5, 0.06], [0.24, 0.1], [0.06, 0.5], [0.12, 0.92], [0.34, 1.0], [0.54, 0.8], [0.46, 0.52], [0.2, 0.52], [0.07, 0.66]]],
    "7": [[[0.02, 0.02], [0.6, 0.0], [0.24, 1.0]]],
    "8": [[[0.3, 0.46], [0.08, 0.3], [0.16, 0.04], [0.42, 0.04], [0.5, 0.28], [0.3, 0.46], [0.04, 0.68], [0.12, 0.96], [0.46, 0.96], [0.56, 0.7], [0.3, 0.46]]],
    "9": [[[0.52, 0.34], [0.34, 0.5], [0.1, 0.42], [0.06, 0.16], [0.28, 0.0], [0.52, 0.12], [0.54, 0.5], [0.4, 1.0]]],
    ":": [],
}


def digits(pic, text, x, y, h, w=None, color=K.INK, seed=0, spacing=0.72):
    """Hand-lettered numerals at (x, y) = top-left, h tall, drawn with the pen."""
    w = w or max(2.0, h * 0.11)
    cx = x
    for i, ch in enumerate(text):
        if ch == " ":
            cx += h * 0.4
            continue
        if ch == ":":
            pic.dot((cx + h * 0.12, y + h * 0.32), w * 0.55, color)
            pic.dot((cx + h * 0.12, y + h * 0.72), w * 0.55, color)
            cx += h * 0.32
            continue
        for k, stroke in enumerate(_DIG.get(ch, [])):
            P = [[cx + px * h, y + py * h] for px, py in stroke]
            pic.ink(P, w=w, color=color, taper=(0.08, 0.12), pressure=0.25, seed=seed + i * 7 + k)
        cx += h * spacing
    return cx


def ticket(pic, x, y, s=1.0, rot=0.0, seed=0):
    """A 1930s card ticket: cream card, red band, hand-lettered B-42, a punched hole."""
    from .core import affine, rect
    sub = Pic()
    C = rect(-70, -40, 70, 40, 10)
    sub.shape(C, K.CREAM, w=3.0, seed=seed, jit=0.6)
    sub.fill(rect(-70, -40, 70, -18, 10), K.RED)
    sub.ink(np.vstack([C, C[:1]]), w=3.0, taper=(0, 0), smooth=False, seed=seed + 1)
    digits(sub, "42", -24, -8, 38, w=5, seed=seed + 2)
    sub.ink([[-58, -4], [-38, -4]], w=4, taper=(0, 0), seed=seed + 3)                  # the "B-" dash
    sub.fill(ell(52, 18, 6, 6, 10), K.INK)
    pic.add(sub, affine(tx=x, ty=y, rot=rot, sx=s))
