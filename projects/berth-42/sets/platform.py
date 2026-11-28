"""SET C: the platform by day. Pale blue sky, the station canopy on iron columns with scroll brackets and a zigzag
valance, the red carriage with one dark window (berth 42), steam drifting (the life), a chai stall with a brass kettle,
stone paving with broken course lines and cracks. Frame space 1080 x 1920; t moves the train and the steam."""
import math
import numpy as np

from ink.core import Pic, ell, arc, rng, boxy, rect
from ink import kit
from ink import palette as K

W, H = 1080, 1920
SKY = K.mix(K.COBALT_L, K.CREAM, 0.35)
IRON = K.COBALT_D
STONE = K.mix(K.CREAM, K.GOLD, 0.12)
STONE_SH = K.mix(STONE, K.COBALT, 0.4)


def sky(t=0.0) -> Pic:
    p = Pic()
    p.fill([[0, 0], [W, 0], [W, H], [0, H]], SKY, smooth=False)
    for i, (x, y, s) in enumerate(((180, 160, 1.0), (760, 260, 1.3), (520, 90, 0.8))):
        x = x - t * 12
        cl = [[x - 120 * s, y + 30], [x - 80 * s, y - 20], [x, y - 40 * s], [x + 90 * s, y - 24], [x + 140 * s, y + 30]]
        p.fill(cl, K.CREAM, alpha=220, seed=10 + i)
    return p


def canopy(t=0.0) -> Pic:
    p = Pic()
    # roof + zigzag valance
    p.fill(rect(-20, 0, W + 20, 300), K.mix(K.COBALT, K.CREAM, 0.25))
    p.fill([[500, 0], [W + 20, 0], [W + 20, 300], [300, 300]], K.mix(K.COBALT, K.INK, 0.15), smooth=False, alpha=200)
    zz = [[-20, 300]]
    for i in range(0, 24):
        zz += [[i * 48 + 24, 350], [(i + 1) * 48, 300]]
    zz += [[W + 20, 300], [W + 20, 280], [-20, 280]]
    p.fill(zz, K.CREAM, smooth=False)
    p.ink([q for q in zz[:-2]], w=3.0, taper=(0, 0), smooth=False, seed=20)
    p.ink([[-20, 280], [W + 20, 280]], w=4.0, taper=(0, 0), seed=21)
    # iron columns with scroll brackets
    for k, x in enumerate((120, 960)):
        p.shape(rect(x - 22, 300, x + 22, 1560, 30), IRON, w=3.6, seed=30 + k, jit=0.6)
        p.ink([[x - 8, 320], [x - 8, 1540]], w=2.0, color=K.COBALT_L, alpha=170, taper=(0, 0), seed=32 + k)
        for sx in (-1, 1):
            sc = [[x, 380], [x + sx * 80, 360], [x + sx * 130, 320], [x + sx * 110, 304], [x + sx * 84, 320]]
            p.ink(sc, w=6.0, color=IRON, taper=(0.05, 0.5), seed=40 + k * 2 + (sx > 0))
            p.ink(arc(x + sx * 50, 400, 26, 26, 0, 300, 10), w=4.0, color=IRON, taper=(0.1, 0.5), seed=44 + k)
        p.shape(rect(x - 40, 1540, x + 40, 1590, 12), IRON, w=3.4, seed=48 + k)
    return p


def train(t=0.0, dark_window=True) -> Pic:
    """The red carriage; x drifts with t (leaving to the left)."""
    p = Pic()
    dx = -t * 160
    y0, y1 = 760, 1290
    C = rect(-200 + dx, y0, 1500 + dx, y1, 30)
    p.shape(C, K.RED, w=4.4, seed=60, jit=1.0)
    p.fill([[620 + dx, y0], [1500 + dx, y0], [1500 + dx, y1], [400 + dx, y1]], K.RED_SH, smooth=False, alpha=230)
    p.fill(rect(-200 + dx, y0, 1500 + dx, y0 + 40, 30), K.mix(K.RED, K.INK, 0.35))
    p.fill(rect(-200 + dx, y1 - 70, 1500 + dx, y1, 30), K.mix(K.RED, K.INK, 0.35))
    for i in range(6):                                         # windows with bars; one is dark: berth 42
        x = -100 + i * 260 + dx
        dark = dark_window and i == 3
        Wd = rect(x, y0 + 110, x + 170, y0 + 330, 16)
        p.shape(Wd, K.INK if dark else K.mix(K.SKIN_LI, K.CREAM, 0.4), w=3.6, seed=70 + i, jit=0.6)
        if not dark:
            p.fill(ell(x + 86, y0 + 240, 40, 50, 12), K.SKIN, alpha=230)          # a passenger, out of focus
            p.fill(ell(x + 86, y0 + 190, 46, 20, 12), [K.RED, K.CREAM, K.GOLD, K.COBALT][i % 4], alpha=230)
        for b in range(3):
            yy = y0 + 160 + b * 60
            p.fill(rect(x, yy - 5, x + 170, yy + 5, 30), K.INK)
        if dark:
            kit.digits(p, "42", x + 50, y0 + 360, 54, w=7, color=K.CREAM, seed=80)
    for i in range(4):                                         # rivet rows
        kit.dash_rows(p, [[-200 + dx, y0 + 60 + i * 0], [1500 + dx, y0 + 60]], rows=1, gap=0, dash=4, step=40, w=3,
                      color=K.mix(K.RED, K.INK, 0.5), seed=90 + i, tilt=1.0) if i == 0 else None
    for i in range(4):                                         # wheels
        x = 40 + i * 400 + dx
        p.shape(ell(x, y1 + 40, 70, 70, 20), K.INK, w=3.0, seed=100 + i)
        p.ink(ell(x, y1 + 40, 40, 40, 16), w=3.0, color=K.COBALT_L, closed=True, smooth=False, taper=(0, 0), seed=110 + i)
    return p


def steam(t=0.0) -> Pic:
    p = Pic()
    r = rng(5)
    for i in range(9):
        ph = (t * 0.35 + i / 9.0) % 1.0
        x = 1040 - ph * 900 + r.uniform(-40, 40)
        y = 700 - ph * 380 + 30 * math.sin(i * 2 + t)
        s = 0.6 + ph * 1.4
        al = int(230 * (1 - ph) ** 0.6)
        pf = [[x - 110 * s, y + 30 * s], [x - 70 * s, y - 40 * s], [x + 10 * s, y - 70 * s], [x + 90 * s, y - 40 * s],
              [x + 120 * s, y + 20 * s], [x + 40 * s, y + 60 * s], [x - 50 * s, y + 60 * s]]
        sub = Pic()
        sub.fill([[x - 200 * s, y - 200 * s], [x + 300 * s, y - 200 * s], [x + 300 * s, y + 200 * s], [x - 200 * s, y + 200 * s]],
                 K.CREAM, smooth=False)
        sub.fill([[x + 10 * s, y - 120 * s], [x + 200 * s, y - 120 * s], [x + 200 * s, y + 120 * s], [x + 30 * s, y + 120 * s]],
                 K.CREAM_SH, smooth=False)
        if al > 40:
            p.clip(pf, sub)
    return p


def ground(t=0.0) -> Pic:
    p = Pic()
    p.fill(rect(-20, 1330, W + 20, H), STONE)
    p.fill([[540, 1330], [W + 20, 1330], [W + 20, H], [200, H]], STONE_SH, smooth=False, alpha=170)
    p.fill(rect(-20, 1330, W + 20, 1372, 30), K.GOLD)                 # platform edge line
    p.ink([[-20, 1372], [W + 20, 1372]], w=3.6, taper=(0, 0), seed=300)
    r = rng(8)
    for row in range(6):                                            # broken course lines
        y = 1440 + row * 90
        x = -20
        while x < W:
            L = r.uniform(80, 200)
            p.ink([[x, y + r.uniform(-3, 3)], [x + L, y + r.uniform(-3, 3)]], w=2.2, color=K.FINE, alpha=200,
                  taper=(0.1, 0.1), seed=310 + row * 20 + int(x))
            p.ink([[x + L, y], [x + L + r.uniform(-10, 10), y + 90]], w=1.8, color=K.FINE, alpha=180, taper=(0.1, 0.1),
                  seed=330 + row * 20 + int(x))
            x += L + r.uniform(10, 30)
    p.ink([[300, 1500], [340, 1580], [320, 1660], [380, 1720]], w=2.0, color=K.FINE, alpha=220, taper=(0.1, 0.6), seed=360)
    p.ink([[340, 1580], [400, 1600]], w=1.6, color=K.FINE, alpha=220, taper=(0.1, 0.6), seed=361)
    return p


def chai_stall(t=0.0) -> Pic:
    p = Pic()
    x0 = 40
    p.shape(rect(x0, 1440, x0 + 400, 1720, 18), K.mix(K.GOLD, K.RED, 0.45), w=4.0, seed=400, jit=1.0)
    p.fill([[x0 + 250, 1440], [x0 + 400, 1440], [x0 + 400, 1720], [x0 + 180, 1720]], K.mix(K.GOLD, K.COBALT, 0.5),
           smooth=False, alpha=200)
    kit.wood(p, x0, 1440, x0 + 400, 1720, plank=70, seed=401)
    # brass kettle + glasses + steam curls
    Kt = [[x0 + 80, 1440], [x0 + 70, 1390], [x0 + 100, 1340], [x0 + 170, 1336], [x0 + 200, 1380], [x0 + 190, 1440]]
    p.shape(Kt, K.GOLD, w=3.6, seed=410)
    p.ink([[x0 + 196, 1390], [x0 + 250, 1360], [x0 + 270, 1330]], w=7, color=K.GOLD_SH, taper=(0.1, 0.4), seed=411)
    kit.sparkle(p, x0 + 110, 1370, 0.6)
    for i in range(3):
        a = t * 2 + i * 2.1
        p.ink([[x0 + 130 + i * 14, 1330], [x0 + 120 + i * 14 + 14 * math.sin(a), 1290], [x0 + 136 + i * 14, 1250]],
              w=2.4, color=K.CREAM, alpha=200, taper=(0.2, 0.8), seed=420 + i)
    for i in range(4):
        gx = x0 + 240 + i * 36
        p.shape(boxy([[gx, 1400], [gx + 26, 1400], [gx + 22, 1440], [gx + 4, 1440]], 8), K.mix(K.CREAM, K.GOLD, 0.5),
                w=2.4, seed=430 + i, jit=0.4)
    return p


def build(t=0.0, dark_window=True, train_t=None) -> Pic:
    p = Pic()
    p.add(sky(t))
    p.add(train(t if train_t is None else train_t, dark_window))
    p.add(steam(t))
    p.add(canopy(t))
    p.add(ground(t))
    p.add(chai_stall(t))
    return p
