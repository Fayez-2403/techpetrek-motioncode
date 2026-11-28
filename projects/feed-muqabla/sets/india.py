"""SET C: an inked map of India on old khaki paper (a stylised outline, not a survey map), Bombay marked as the studio,
dotted release routes that draw themselves to six towns, a delivery van running each route, town dots that pop.
build(t, progress, highlight). Pure function of t."""
import math
import numpy as np

from ink.core import Pic, ell, arc, rng, rect, catmull
from ink import kit
from ink import palette as K
from film import props3 as P3

W, H = 1080, 1920
# a hand-simplified outline (lon, lat)
OUTLINE = [(68.2, 23.6), (70.0, 22.9), (69.1, 22.3), (70.6, 20.8), (72.6, 21.2), (72.8, 19.0), (73.4, 16.0), (74.0, 14.8),
           (74.8, 12.9), (75.8, 11.3), (76.3, 9.9), (77.5, 8.1), (78.2, 8.9), (79.8, 10.3), (79.9, 12.0), (80.3, 13.1),
           (80.1, 15.5), (82.2, 16.6), (83.3, 17.7), (85.1, 19.3), (86.8, 20.6), (87.5, 21.6), (88.6, 21.8), (89.0, 22.4),
           (88.6, 24.2), (89.8, 26.0), (92.0, 26.9), (95.5, 28.1), (97.2, 27.8), (95.0, 26.0), (93.4, 24.2), (92.3, 24.3),
           (91.5, 25.1), (90.0, 25.3), (88.2, 26.4), (88.1, 27.9), (85.9, 27.0), (83.9, 27.4), (80.9, 28.6), (80.1, 28.9),
           (80.9, 30.2), (79.0, 31.0), (78.8, 32.5), (78.2, 35.3), (76.8, 35.4), (74.6, 34.6), (73.9, 33.8), (74.6, 32.5),
           (74.5, 31.0), (73.9, 30.0), (72.6, 28.2), (70.4, 28.0), (69.6, 27.0), (70.4, 25.7), (68.8, 24.3)]
TOWNS = {"Bombay": (72.88, 19.08), "Ahmedabad": (72.57, 23.03), "Delhi": (77.2, 28.6), "Lucknow": (80.95, 26.85),
         "Patna": (85.14, 25.6), "Calcutta": (88.36, 22.57), "Nagpur": (79.09, 21.15), "Madras": (80.27, 13.08)}
ROUTES = ["Ahmedabad", "Nagpur", "Delhi", "Lucknow", "Patna", "Calcutta", "Madras"]


def xy(lon, lat):
    k = 33.0
    return np.array([120 + (lon - 68) * k, 200 + (37 - lat) * k * 1.12])


def town(name):
    return xy(*TOWNS[name])


def route_path(name):
    a, b = town("Bombay"), town(name)
    mid = (a + b) / 2 + np.array([-(b - a)[1], (b - a)[0]]) * 0.12
    return catmull(np.array([a, mid, b]), step=8)


def build(t=0.0, progress=None, highlight=(), stale=()) -> Pic:
    """progress: {town: 0..1} how far each route has drawn (and its van travelled)."""
    p = Pic()
    paper = K.mix(K.GOLD, K.CREAM, 0.55)
    p.fill(rect(-40, -40, W + 40, H + 40), paper)
    r = rng(3)
    for i in range(140):                                           # paper speckle + fold lines
        p.dot((r.uniform(0, W), r.uniform(0, H)), r.uniform(1, 3), K.mix(paper, K.INK, 0.25), alpha=120)
    p.ink([[0, 960], [W, 950]], w=1.6, color=K.mix(paper, K.INK, 0.3), alpha=140, taper=(0, 0), seed=4)
    p.ink([[540, 0], [545, H]], w=1.6, color=K.mix(paper, K.INK, 0.3), alpha=140, taper=(0, 0), seed=5)
    O = np.array([xy(lon, lat) for lon, lat in OUTLINE])
    F = p.fill(O, K.mix(paper, K.RED, 0.12), jit=2.0, seed=6)
    sub = Pic()
    sub.fill([[600, -40], [W + 40, -40], [W + 40, H + 40], [300, H + 40]], K.mix(paper, K.COBALT, 0.18), smooth=False)
    p.clip(F, sub, smooth=False)
    p.outline(F, w=4.0, seed=7, breaks=5)
    for i in range(30):                                            # sea ticks
        x, y = r.uniform(0, W), r.uniform(1200, H)
        if x < xy(77, 10)[0] - 50 or x > xy(80.5, 10)[0] + 60:
            p.ink([[x, y], [x + 18, y]], w=1.6, color=K.COBALT_L, alpha=170, taper=(0.3, 0.3), seed=10 + i)
    progress = progress or {}
    for k, name in enumerate(ROUTES):
        u = progress.get(name, 0.0)
        if u <= 0:
            continue
        P = route_path(name)
        n = max(2, int(len(P) * min(1.0, u)))
        seg = P[:n]
        for j in range(0, len(seg) - 7, 11):                           # dashed route
            p.ink(seg[j:j + 8], w=8, color=K.RED, taper=(0.1, 0.1), seed=30 + k * 50 + j, smooth=False)
        if 0.06 < u < 1.0:                                              # vans show once they have left Bombay
            q = seg[-1]
            d = seg[-1] - seg[-3] if len(seg) > 3 else np.array([1, 0])
            P3.van(p, q[0], q[1] - 20, 0.55, t, seed=100 + k, flip=d[0] < 0)
    for name, (lon, lat) in TOWNS.items():
        q = xy(lon, lat)
        big = name == "Bombay"
        hi = name in highlight
        st = name in stale
        rad = 18 if big else (16 if hi else 10)
        if hi:
            for g, al in ((2.8, 60), (1.8, 100)):
                p.fill(ell(q[0], q[1], rad * g, rad * g, 16), K.GOLD_LI, alpha=al)
        p.shape(ell(q[0], q[1], rad, rad, 14), K.RED if big else (K.mix(K.RED, K.INK, 0.4) if st else K.COBALT_D), w=2.6, seed=200 + len(name))
        if big:
            P3.reel(p, q[0] - 70, q[1] + 10, 0.28, a=t * 2, seed=210)
    return p


def labels(fr, M, highlight=()):
    for name, (lon, lat) in TOWNS.items():
        q = xy(lon, lat)
        if name == "Bombay":                                            # under its dot: the west margin is cropped by the camera
            x, y = q[0] + 20, q[1] + 56
        else:
            x, y = q[0] + 100, q[1] - 34
        fr.text(name, x, y, 40 if name in highlight or name == "Bombay" else 32,
                K.RED if name == "Bombay" else K.INK, font="kalam", weight=700, M=M)
