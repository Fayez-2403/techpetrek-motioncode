"""SET B: the telegraph line across the fields in a storm. A dark periwinkle sky with rain ticks, khaki fields,
four poles in depth, sagging wires, message dots (dot-dash) travelling the top wire, crows; snap(t) breaks the wire
at pole 2 with falling sparks, and a mended knot can be drawn for the resend. build(t, ...). Pure function of t."""
import math
import numpy as np

from ink.core import Pic, ell, arc, rng, rect
from ink import kit
from ink import palette as K

W, H = 1080, 1920
SKY = K.mix(K.COBALT, K.INK, 0.35)
SKY2 = K.mix(K.COBALT, K.INK, 0.15)
FIELD = K.mix(K.GOLD, K.COBALT, 0.35)
FIELD_SH = K.mix(K.GOLD, K.COBALT, 0.6)
POLES = [(180, 1500, 1.0), (520, 1220, 0.62), (760, 1060, 0.4), (920, 960, 0.26)]


def _top(i):
    x, y, s = POLES[i]
    return np.array([x, y - 900 * s])


def build(t=0.0, dots=None, snap=None, mended=False, flash=0.0, tag=None) -> Pic:
    """dots: list of (progress 0..1 along the line, is_dash). snap: time since the wire broke (None = intact)."""
    p = Pic()
    p.fill(rect(-40, -40, W + 40, 1000), SKY)
    p.fill([[-40, 500], [W + 40, 380], [W + 40, 1000], [-40, 1000]], SKY2, smooth=False, alpha=200)
    for i, (x, y, s) in enumerate(((200, 300, 1.4), (700, 220, 1.8), (980, 420, 1.2))):    # storm clouds
        cl = [[x - 220 * s, y + 60], [x - 150 * s, y - 50], [x, y - 90 * s], [x + 170 * s, y - 50], [x + 240 * s, y + 60]]
        p.fill(cl, K.mix(K.COBALT, K.INK, 0.5 - 0.1 * i), seed=10 + i)
    if flash > 0:
        p.fill(rect(-40, -40, W + 40, 1000), K.CREAM, alpha=int(110 * flash))
        p.ink([[620, 240], [580, 420], [640, 450], [560, 700]], w=9, color=K.CREAM, taper=(0.05, 0.6), seed=15)
    p.fill([[-40, 900], [W + 40, 860], [W + 40, H + 40], [-40, H + 40]], FIELD, smooth=False)
    p.fill([[540, 880], [W + 40, 860], [W + 40, H + 40], [300, H + 40]], FIELD_SH, smooth=False, alpha=200)
    r = rng(3)
    for i in range(120):                                       # field ticks (crop rows)
        x, y = r.uniform(-20, W + 20), r.uniform(940, H)
        L = 6 + (y - 900) * 0.02
        p.ink([[x, y], [x + 2, y - L]], w=1.6 + (y - 900) * 0.002, color=K.mix(K.GOLD, K.INK, 0.3), alpha=200, taper=(0.2, 0.6), seed=20 + i)
    # poles + wires
    for i, (x, y, s) in enumerate(POLES):
        top = _top(i)
        p.fill([[x - 16 * s, y], [x + 16 * s, y], [top[0] + 10 * s, top[1]], [top[0] - 10 * s, top[1]]], K.mix(K.GOLD, K.INK, 0.55), smooth=False)
        p.fill(rect(top[0] - 90 * s, top[1] + 30 * s, top[0] + 90 * s, top[1] + 46 * s, 8), K.mix(K.GOLD, K.INK, 0.55))
        for sx in (-70, 70):
            p.dot((top[0] + sx * s, top[1] + 24 * s), 7 * s + 1, K.CREAM_SH)
    path = []
    for i in range(len(POLES) - 1):
        a, b = _top(i) + [70 * POLES[i][2], 24 * POLES[i][2]], _top(i + 1) + [70 * POLES[i + 1][2], 24 * POLES[i + 1][2]]
        sag = 60 * POLES[i][2]
        for k in range(12):
            u = k / 11
            path.append(a * (1 - u) + b * u + [0, sag * 4 * u * (1 - u)])
    path = np.array(path)
    cut = len(path) // 3 + 3                                  # the break point, between pole 1 and pole 2
    if snap is None:
        p.ink(path, w=2.4, taper=(0, 0), pressure=0.05, seed=30, smooth=False)
    else:
        drop = min(1.0, snap / 0.5)
        left = path[:cut].copy()
        right = path[cut:].copy()
        left[-6:, 1] += np.linspace(0, 320 * drop, 6)
        right[:6, 1] += np.linspace(320 * drop, 0, 6)[::-1][::-1] if False else np.linspace(320 * drop, 0, 6)
        if mended:
            p.ink(path, w=2.4, taper=(0, 0), pressure=0.05, seed=30, smooth=False)
            kx, ky = path[cut]
            p.shape(ell(kx, ky, 12, 9, 10), K.GOLD, w=2.4, seed=31)            # the mended knot
        else:
            p.ink(left, w=2.4, taper=(0, 0), seed=32, smooth=False)
            p.ink(right, w=2.4, taper=(0, 0), seed=33, smooth=False)
            if snap < 0.6:
                for k in range(8):                                             # sparks
                    a_ = k / 8 * 2 * math.pi
                    L = 30 + 80 * snap
                    cx, cy = path[cut]
                    p.ink([[cx + 10 * math.cos(a_), cy + 10 * math.sin(a_)], [cx + L * math.cos(a_), cy + L * math.sin(a_)]],
                          w=3, color=K.GOLD_LI, taper=(0.1, 0.8), seed=34 + k)
    # the message: dots and dashes travelling the wire
    for (u, dash) in (dots or []):
        if 0 <= u <= 1:
            i = min(len(path) - 1, int(u * (len(path) - 1)))
            if snap is not None and not mended and i >= cut:
                continue
            x, y = path[i]
            s = 0.6 + 0.4 * (1 - i / len(path))
            for g, al in ((3.0, 50), (1.8, 90)):
                p.fill(ell(x, y, 14 * s * g, 14 * s * g, 14), K.GOLD_LI, alpha=al)
            if dash:
                p.fill(rect(x - 20 * s, y - 6 * s, x + 20 * s, y + 6 * s, 6), K.CREAM)
            else:
                p.fill(ell(x, y, 8 * s, 8 * s, 10), K.CREAM)
    if tag:                                                    # the receipt number travelling with the message
        u = tag[0]
        i = min(len(path) - 1, max(0, int(u * (len(path) - 1))))
        x, y = path[i]
        p.shape(rect(x - 46, y - 92, x + 46, y - 44, 10), K.CREAM, w=2.6, seed=40, jit=0.4)
        kit.digits(p, tag[1], x - 34, y - 86, 34, w=4.5, seed=41)
    # crows on the far wire
    for k, (x, y) in enumerate(((820, 760), (860, 750))):
        bob = 4 * math.sin(t * 6 + k)
        p.fill(ell(x, y + bob, 16, 12, 10), K.INK)
        p.fill([[x + 12, y - 4 + bob], [x + 26, y + bob], [x + 12, y + 4 + bob]], K.INK, smooth=False)
    # rain ticks (the life)
    rr = rng(int(t * 30) % 7 + 70)
    for i in range(90):
        x, y = rr.uniform(-20, W + 20), rr.uniform(-20, H)
        p.ink([[x, y], [x - 10, y + 34]], w=1.6, color=K.COBALT_L, alpha=150, taper=(0.2, 0.2), seed=200 + i)
    return p, path
