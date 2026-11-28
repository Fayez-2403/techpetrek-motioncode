"""SET: the night mehfil in a haveli courtyard. An ivory marble wall with three cusped (multifoil) Mughal arches: the
middle one open to the indigo night and a full moon, the side ones filled with jaali lattice. Brass lanterns sway in the
arches, marigold garlands swag between them, a lapis dari covers the raised takht (stage), and a dark row of audience
heads sits in front (their hands go up on a "wah!"). Pure functions of t.

    back(t)            sky, moon, wall, arches, lanterns, garlands, the dari (draw the cast over it)
    front(t, wah)      the takht's carved front edge + the audience heads (over the cast's laps)
    arch(cx, ys, a, yb, foils)  a cusped arch outline (also the jharokha mask for real grabs)
"""
import math
import numpy as np

from ink.core import Pic, ell, arc, rng, rect, boxy
from ink import kit
from ink import palette as K

W, H = 1080, 1920
WALL_TOP, WALL_BOT = 120, 1190
STAGE_Y = 1180          # the dari's back edge
FRONT_Y = 1520          # the takht's front edge (laps sit between)
ARCHES = [(540, 560, 250, 1180, 7), (150, 700, 120, 1180, 5), (930, 700, 120, 1180, 5)]   # cx, spring y, half width, bottom y, foils
DARI = mix_ = K.mix(K.COBALT, K.CREAM, 0.12)


def arch(cx, ys, a, yb, foils=7, n=120, depth=None):
    """A cusped arch opening: vertical jambs from yb up to the spring line ys, then a pointed arch whose edge is a row
    of lobes bulging into the wall (cusps point inward). Returns a closed polygon (clockwise from bottom-left)."""
    d = 0.32 * a
    R = a + d
    ph_apex = math.acos(-d / R)
    left = [(cx + d + R * math.cos(p), ys - R * math.sin(p)) for p in np.linspace(math.pi, ph_apex, n // 2)]
    right = [(2 * cx - x, y) for x, y in left[::-1]]
    curve = np.array(left + right[1:])
    seg = np.r_[0, np.cumsum(np.hypot(*np.diff(curve, axis=0).T))]
    u = seg / seg[-1]
    tang = np.gradient(curve, axis=0)
    nrm = np.stack([tang[:, 1], -tang[:, 0]], 1)
    nrm /= np.linalg.norm(nrm, axis=1, keepdims=True) + 1e-9
    nrm *= np.sign(((curve - [cx, ys]) * nrm).sum(1, keepdims=True) + 1e-9)     # outward (away from the centre)
    A = depth if depth is not None else 0.11 * a
    edge = curve + nrm * (A * np.abs(np.sin(np.pi * foils * u)))[:, None]
    return np.vstack([[[cx - a, yb]], edge, [[cx + a, yb]]])


def _sky(p, t, x0, y0, x1, y1, moon=True):
    p.fill(rect(x0 - 20, y0 - 20, x1 + 20, y1 + 20), K.NIGHT)
    r = rng(41)
    for i in range(60):
        x, y = r.uniform(x0, x1), r.uniform(y0, y0 + (y1 - y0) * 0.75)
        tw = 0.55 + 0.45 * math.sin(t * (1.3 + r.uniform(0, 2)) + i)
        p.dot((x, y), r.uniform(1.6, 3.4), K.CREAM, alpha=int(110 + 140 * tw))
    if moon:
        mx, my = 600, 500
        for g, al in ((3.2, 26), (2.2, 46), (1.5, 80)):
            p.fill(ell(mx, my, 96 * g, 96 * g, 28), K.mix(K.CREAM, K.GOLD, 0.25), alpha=al)
        p.shape(ell(mx, my, 96, 96, 28), K.mix(K.CREAM, K.GOLD, 0.18), w=2.6, seed=42, jit=0.4)
        for k, (dx, dy, rr) in enumerate(((-28, -20, 18), (26, 18, 12), (-6, 40, 9))):
            p.fill(ell(mx + dx, my + dy, rr, rr * 0.8, 12), K.mix(K.CREAM, K.COBALT, 0.12), alpha=150)
    # far city rooftops + a minaret-free skyline (domes and chhatris)
    for k, (x, w_, h_) in enumerate(((340, 120, 90), (470, 70, 140), (700, 140, 110), (820, 60, 70))):
        p.fill([[x - w_ / 2, y1], [x - w_ / 2, y1 - h_], [x - w_ * 0.3, y1 - h_ - 26], [x, y1 - h_ - 40], [x + w_ * 0.3, y1 - h_ - 26],
                [x + w_ / 2, y1 - h_], [x + w_ / 2, y1]], K.mix(K.COBALT, K.INK, 0.6), smooth=False)
        for j in range(3):
            p.dot((x - w_ / 3 + j * w_ / 3, y1 - h_ * 0.5), 4, K.GOLD_LI, alpha=int(120 + 100 * math.sin(t * 2 + k + j)))


def _jaali(sub, x0, y0, x1, y1, step=46):
    sub.fill(rect(x0, y0, x1, y1), K.mix(K.CREAM, K.GOLD, 0.12))
    for i in range(int((x1 - x0) / step) + 2):
        for j in range(int((y1 - y0) / step) + 2):
            x, y = x0 + i * step + (step / 2 if j % 2 else 0), y0 + j * step
            sub.fill([[x, y - step * 0.42], [x + step * 0.42, y], [x, y + step * 0.42], [x - step * 0.42, y]], K.NIGHT, smooth=False)
            sub.dot((x, y), 4, K.GOLD_SH, alpha=170)


def lantern(p, x, y, t, k=0, s=1.0, glow=1.0):
    sw = 0.06 * math.sin(t * 1.4 + k * 1.7)
    lx, ly = x + 220 * s * math.sin(sw), y + 220 * s * (1 - math.cos(sw))
    p.ink([[x, y - 200 * s], [lx, ly - 30 * s]], w=2.4, color=K.GOLD_SH, taper=(0, 0), seed=100 + k)
    fl = 1 + 0.06 * math.sin(t * 9 + k * 2.1) * math.sin(t * 5.3 + k)
    for g, al in ((3.4, 22), (2.3, 40), (1.5, 70)):
        p.fill(ell(lx, ly + 40 * s, 52 * s * g * fl, 60 * s * g * fl, 20), K.mix(K.GOLD_LI, K.CREAM, 0.35), alpha=int(al * glow))
    body = [[lx - 34 * s, ly - 10 * s], [lx + 34 * s, ly - 10 * s], [lx + 44 * s, ly + 40 * s], [lx + 30 * s, ly + 96 * s],
            [lx - 30 * s, ly + 96 * s], [lx - 44 * s, ly + 40 * s]]
    p.shape(body, K.mix(K.GOLD_LI, K.CREAM, 0.4), w=3.0, seed=110 + k, jit=0.5)
    for j in range(3):
        xx = lx - 22 * s + j * 22 * s
        p.ink([[xx, ly - 6 * s], [xx * 0.96 + lx * 0.04, ly + 92 * s]], w=2.4, color=K.GOLD_SH, taper=(0, 0), seed=120 + k * 3 + j)
    p.shape([[lx - 40 * s, ly - 10 * s], [lx, ly - 46 * s], [lx + 40 * s, ly - 10 * s]], K.GOLD, w=2.8, seed=130 + k, jit=0.3)
    p.shape(ell(lx, ly + 100 * s, 18 * s, 10 * s, 10), K.GOLD, w=2.2, seed=135 + k)


def garland(p, x0, y0, x1, y1, sag, t, k=0, n=18):
    pts = []
    for i in range(n + 1):
        u = i / n
        x = x0 + (x1 - x0) * u
        y = y0 + (y1 - y0) * u + sag * math.sin(math.pi * u) * (1 + 0.04 * math.sin(t * 1.6 + k))
        pts.append((x, y))
    p.ink(pts, w=2.0, color=K.GREEN_D, taper=(0, 0), seed=150 + k, smooth=False)
    for i, (x, y) in enumerate(pts):
        p.dot((x, y), 14, K.RED if (i + k) % 3 else K.GOLD)
        p.dot((x - 3, y - 4), 5, K.GOLD_LI)
    for e in (pts[0], pts[-1]):                                   # tassels
        p.ink([[e[0], e[1]], [e[0], e[1] + 120]], w=8, color=K.RED, taper=(0.1, 0.6), seed=160 + k)


def back(t=0.0, lanterns=True) -> Pic:
    p = Pic()
    _sky(p, t, -40, -40, W + 40, WALL_BOT)
    wall = Pic()
    wall.fill(rect(-60, WALL_TOP, W + 60, WALL_BOT + 40), K.CREAM)
    # cornice band + chhajja shadow
    wall.fill(rect(-60, WALL_TOP, W + 60, WALL_TOP + 70), K.mix(K.CREAM, K.GOLD, 0.25))
    wall.fill(rect(-60, WALL_TOP + 70, W + 60, WALL_TOP + 96), K.MARBLE_SH)
    for i in range(26):
        x = -40 + i * 46
        wall.fill([[x, WALL_TOP + 14], [x + 20, WALL_TOP + 35], [x, WALL_TOP + 56], [x - 20, WALL_TOP + 35]], K.GOLD_SH, smooth=False, alpha=200)
    # pilasters
    for x in (310, 770):
        wall.fill(rect(x - 40, WALL_TOP + 96, x + 40, WALL_BOT + 40), K.mix(K.CREAM, K.GOLD, 0.1))
        wall.fill(rect(x + 14, WALL_TOP + 96, x + 40, WALL_BOT + 40), K.MARBLE_SH, alpha=200)
        for k in range(8):
            y = WALL_TOP + 180 + k * 120
            wall.ink(arc(x, y, 24, 30, 200, 340, 8), w=2.0, color=K.GOLD_SH, alpha=200, seed=170 + k + x)
    p.add(wall)
    for k, (cx, ys, a, yb, foils) in enumerate(ARCHES):
        O = arch(cx, ys, a, yb, foils)
        sub = Pic()
        if k == 0:
            _sky(sub, t, cx - a - 20, ys - a * 1.5, cx + a + 20, yb)
        else:
            _jaali(sub, cx - a - 10, ys - a * 1.6, cx + a + 10, yb)
        p.clip(O, sub, smooth=False)
        p.ink(np.vstack([O, O[:1]]), w=7, color=K.GOLD, taper=(0, 0), pressure=0.05, seed=180 + k, smooth=False)
        p.ink(O[1:-1] + [0, -18], w=2.4, color=K.GOLD_SH, alpha=200, taper=(0.1, 0.1), seed=185 + k, smooth=False)
        # spandrel rosettes
        for sx in (-1, 1):
            rx, ry = cx + sx * a * 0.95, ys - a * 0.95
            for j in range(6):
                aa = j * math.pi / 3 + t * 0.0
                wall_p = (rx + 18 * math.cos(aa), ry + 18 * math.sin(aa))
                p.dot(wall_p, 9, K.RED if k == 0 else K.GREEN_LI, alpha=220)
            p.dot((rx, ry), 8, K.GOLD)
    if lanterns:
        for k, (cx, ys, a, yb, foils) in enumerate(ARCHES):
            lantern(p, cx, ys - a * 0.55 + 150, t, k, s=1.0 if k == 0 else 0.8)
    garland(p, 20, WALL_TOP + 110, 520, WALL_TOP + 120, 150, t, 0)
    garland(p, 560, WALL_TOP + 120, 1060, WALL_TOP + 110, 150, t, 1)
    # the dari (stage carpet) in perspective
    D = [[-80, STAGE_Y], [W + 80, STAGE_Y], [W + 200, FRONT_Y], [-200, FRONT_Y]]
    p.fill(D, DARI, smooth=False)
    sub = Pic()
    for j in range(7):
        y = STAGE_Y + 20 + j * 48
        for i in range(16):
            x = -40 + i * 76 + (38 if j % 2 else 0)
            sub.fill([[x, y - 14], [x + 22, y], [x, y + 14], [x - 22, y]], K.mix(K.CREAM, K.COBALT, 0.3), smooth=False, alpha=150)
            sub.dot((x, y), 4, K.GOLD, alpha=200)
    sub.fill([[-80, STAGE_Y], [W + 80, STAGE_Y], [W + 84, STAGE_Y + 22], [-84, STAGE_Y + 22]], K.GOLD_SH, smooth=False)
    p.clip(D, sub, smooth=False)
    for sx, c in ((-1, K.RED_SH), (1, K.GREEN_SH)):                 # each party's bolster (gaddi + takiya) along the back
        x = 540 + sx * 300
        p.shape(boxy([[x - 230, STAGE_Y - 70], [x + 230, STAGE_Y - 70], [x + 240, STAGE_Y + 10], [x - 240, STAGE_Y + 10]], 16), c, w=3.0,
                seed=190 + sx, jit=0.6)
        for j in range(5):
            p.ink([[x - 200 + j * 100, STAGE_Y - 64], [x - 200 + j * 100, STAGE_Y + 4]], w=1.8, color=K.FINE, alpha=150, seed=195 + j + sx)
    return p


def front(t=0.0, wah=0.0, heads=True) -> Pic:
    p = Pic()
    F = [[-200, FRONT_Y], [W + 200, FRONT_Y], [W + 200, FRONT_Y + 110], [-200, FRONT_Y + 110]]
    p.fill(F, K.mix(K.RED_D, K.COBALT, 0.35), smooth=False)
    p.ink([[-200, FRONT_Y + 4], [W + 200, FRONT_Y + 4]], w=5, color=K.GOLD, taper=(0, 0), seed=200)
    for i in range(14):
        x = -60 + i * 90
        p.ink(arc(x + 45, FRONT_Y + 64, 34, 30, 180, 360, 10), w=2.4, color=K.GOLD_SH, alpha=220, seed=201 + i)
        p.dot((x + 45, FRONT_Y + 70), 5, K.GOLD_SH)
    p.fill(rect(-200, FRONT_Y + 110, W + 200, H + 60), K.mix(K.COBALT, K.INK, 0.62))
    if heads:
        r = rng(207)
        for i in range(11):
            x = -30 + i * 112 + r.uniform(-20, 20)
            y = FRONT_Y + 300 + r.uniform(-30, 40) + 6 * math.sin(t * 2.2 + i * 1.3)
            s_ = r.uniform(0.9, 1.15)
            col = K.mix(K.COBALT, K.INK, 0.72)
            p.fill(ell(x, y + 160 * s_, 120 * s_, 120 * s_, 16), col)              # shoulders
            p.fill(ell(x, y, 64 * s_, 74 * s_, 16), col)
            p.ink(arc(x, y, 64 * s_, 74 * s_, 210, 330, 10), w=4, color=K.mix(K.GOLD_LI, K.CREAM, 0.3), alpha=150, taper=(0.3, 0.3), seed=210 + i)
            if wah > 0.01 and i % 3 != 1:                                      # hands up: "wah!"
                up = wah * (0.7 + 0.3 * math.sin(t * 7 + i))
                for sx in (-1, 1):
                    hx, hy = x + sx * 90 * s_, y + 120 - 330 * up * s_
                    p.ink([[x + sx * 70 * s_, y + 160 * s_], [hx, hy]], w=34 * s_, color=col, taper=(0, 0.2), seed=220 + i + sx)
                    p.fill(ell(hx, hy - 20, 30 * s_, 38 * s_, 12), col)
    return p


def banner(p, t, reveal=1.0, y=300):
    """A cloth banner strung across the middle arch (its words go on as text over it, see banner_text)."""
    sw = 4 * math.sin(t * 1.2)
    x0, x1 = 300, 780
    yb = y + sw
    drop = 130 * reveal
    B = [[x0, yb], [x1, yb], [x1 - 8, yb + drop], [540, yb + drop + 18 * reveal], [x0 + 8, yb + drop]]
    p.shape(B, K.mix(K.CREAM, K.GOLD, 0.2), w=3.4, seed=230, jit=0.6)
    p.ink([[x0, yb + 8], [x1, yb + 8]], w=6, color=K.RED, taper=(0, 0), seed=231)
    if reveal > 0.9:
        p.ink([[x0 + 10, yb + drop - 10], [540, yb + drop + 8], [x1 - 10, yb + drop - 10]], w=6, color=K.GREEN, taper=(0, 0), seed=232)
    for x in (x0, x1):
        p.ink([[x, yb], [x + (40 if x == x0 else -40), yb - 80]], w=2.4, color=K.GOLD_SH, taper=(0, 0), seed=233 + x)
    return (540, yb + drop * 0.5)
