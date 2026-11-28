"""SET C: the city counter at night. Lamp light from the upper left (pink lit surfaces, periwinkle shadow); a wall with
a clock at 9; the barred counter window (Mohan stands outside it); Tara's desk with the brass sounder, a ticker-tape
roll, the PAID register and an open cash drawer of notes and coins. build(t). Pure function of t."""
import math
import numpy as np

from ink.core import Pic, ell, arc, rng, boxy, rect
from ink import kit
from ink import palette as K

W, H = 1080, 1920
WALL = K.mix(K.COBALT, K.INK, 0.2)
LIT = K.mix(K.SKIN, K.CREAM, 0.25)
LIT2 = K.mix(K.SKIN, K.COBALT, 0.3)
WOOD = K.mix(K.GOLD, K.RED, 0.42)
WOOD_SH = K.mix(WOOD, K.COBALT, 0.55)


def room(t=0.0, clock=(9.0, 0.0)) -> Pic:
    p = Pic()
    p.fill(rect(-40, -40, W + 40, H + 40), WALL)
    p.fill([[-40, -40], [800, -40], [W + 40, 600], [W + 40, 1500], [-40, 1900]], LIT2, smooth=False)
    p.fill([[-40, -40], [560, -40], [900, 700], [360, 1700], [-40, 1700]], LIT, smooth=False)
    for i, x in enumerate(range(80, W, 160)):
        p.ink([[x, -40], [x + 2, 1400]], w=2.0, color=K.FINE, alpha=170, taper=(0, 0), seed=300 + i)
    # the lamp
    x, y = 150, 300
    fl = 1 + 0.06 * math.sin(t * 13) + 0.04 * math.sin(t * 7.3 + 1)
    for k, al in ((4.0, 40), (2.6, 60), (1.6, 90)):
        p.fill(ell(x, y, 70 * k * fl, 70 * k * fl, 24), K.mix(K.SKIN_LI, K.CREAM, 0.5), alpha=al)
    p.shape([[x - 46, y - 80], [x + 46, y - 80], [x + 56, y], [x + 40, y + 60], [x - 40, y + 60], [x - 56, y]],
            K.mix(K.CREAM, K.GOLD, 0.25), w=3.4, seed=310)
    p.fill(ell(x, y + 6, 16 * fl, 30 * fl, 14), K.GOLD_LI)
    kit.sparkle(p, x + 30, y - 30, 0.7)
    # the clock at 9
    cx, cy, R = 880, 260, 96
    p.shape(ell(cx, cy, R + 18, R + 18, 28), K.GOLD, w=4.0, seed=320)
    p.shape(ell(cx, cy, R, R, 28), K.CREAM, w=3.0, seed=321)
    hh, mm = clock
    ha = (hh % 12 + mm / 60) / 12 * 2 * math.pi
    ma = mm / 60 * 2 * math.pi
    p.ink([[cx, cy], [cx + R * 0.5 * math.sin(ha), cy - R * 0.5 * math.cos(ha)]], w=7, taper=(0, 0.5), seed=322)
    p.ink([[cx, cy], [cx + R * 0.78 * math.sin(ma), cy - R * 0.78 * math.cos(ma)]], w=4, taper=(0, 0.6), seed=323)
    p.dot((cx, cy), 7, K.INK)
    kit.sparkle(p, cx - 70, cy - 70, 0.6)
    return p


def window(t=0.0) -> Pic:
    """The barred counter window on the right (Mohan's side), outside is the dark street."""
    p = Pic()
    O = boxy([[640, 560], [1000, 560], [1000, 1300], [640, 1300]], 20)
    p.fill(O, K.mix(K.COBALT, K.INK, 0.5))
    for i in range(6):
        p.dot((680 + i * 60, 620 + (i % 2) * 40), 3, K.GOLD_LI, alpha=200)            # street lamps far away
    return p, O


def bars(t=0.0) -> Pic:
    p = Pic()
    for x in range(670, 1000, 56):
        p.fill(rect(x - 6, 560, x + 6, 1300, 20), K.INK)
    p.fill(rect(640, 1100, 1000, 1114, 20), K.INK)
    p.outline(boxy([[640, 560], [1000, 560], [1000, 1300], [640, 1300]], 20), w=5, seed=330, breaks=3)
    return p


def desk(t=0.0, drawer=0.0) -> Pic:
    p = Pic()
    D = boxy([[-40, 1380], [W + 40, 1380], [W + 40, H + 40], [-40, H + 40]])
    p.shape(D, WOOD, w=4.4, seed=340, jit=1.0)
    p.fill([[620, 1380], [W + 40, 1380], [W + 40, H + 40], [420, H + 40]], WOOD_SH, smooth=False, alpha=220)
    kit.wood(p, -40, 1380, W + 40, H + 40, plank=110, seed=341)
    # the sounder (brass) + ticker roll
    p.shape(boxy([[60, 1320], [260, 1320], [270, 1384], [50, 1384]], 12), WOOD_SH, w=3.2, seed=342, jit=0.5)
    tick = 6 * abs(math.sin(t * 18))
    p.fill(rect(100, 1260 - tick, 220, 1276 - tick, 8), K.GOLD)
    p.fill(rect(150, 1276, 170, 1320, 8), K.GOLD_SH)
    kit.sparkle(p, 120, 1262 - tick, 0.4)
    p.shape(ell(330, 1340, 40, 40, 16), K.CREAM, w=3.0, seed=343)
    p.ink([[360, 1340], [460, 1360], [520, 1420], [560, 1480]], w=14, color=K.CREAM, taper=(0, 0), seed=344)
    # the cash drawer (opens by `drawer`): notes + coins
    dx = 120 * drawer
    p.shape(boxy([[600, 1560 + dx * 0.4], [1000, 1560 + dx * 0.4], [1020, 1700 + dx], [580, 1700 + dx]], 14), WOOD_SH, w=3.4, seed=345, jit=0.5)
    if drawer > 0.1:
        for k in range(4):
            p.shape(rect(620 + k * 90, 1580 + dx * 0.4, 700 + k * 90, 1640 + dx * 0.6, 8), K.mix(K.GOLD, K.CREAM, 0.5), w=2.2, seed=346 + k, jit=0.3)
        for k in range(5):
            p.shape(ell(640 + k * 70, 1670 + dx * 0.8, 20, 10, 10), K.GOLD, w=2.0, seed=350 + k)
        kit.sparkle(p, 700, 1660 + dx * 0.8, 0.5)
    return p


def build(t=0.0, drawer=0.0, clock=(9.0, 0.0), outside=None) -> Pic:
    """outside(p): draw whoever stands outside the window (clipped into it)."""
    p = Pic()
    p.add(room(t, clock))
    win, O = window(t)
    if outside is not None:
        sub = Pic()
        sub.add(win)
        outside(sub)
        p.clip(O, sub, smooth=False)
    else:
        p.add(win)
    p.add(bars(t))
    p.add(desk(t, drawer))
    return p
