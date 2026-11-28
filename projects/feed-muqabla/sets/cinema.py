"""SET D: a small-town cinema hall at night (Lakshmi Talkies, Patna). The screen (its picture drawn by a callback),
the projector beam from the booth window over the audience with flicker and floating dust, rows of audience heads that
bob and laugh, the front row where Munni sits. build(t, screen_fn, laugh). Pure function of t."""
import math
import numpy as np

from ink.core import Pic, ell, arc, rng, rect, boxy
from ink import kit
from ink import palette as K

W, H = 1080, 1920
DARK = K.mix(K.COBALT, K.INK, 0.55)
SCREEN = (140, 260, 940, 820)


def build(t=0.0, screen_fn=None, laugh=0.0) -> Pic:
    p = Pic()
    p.fill(rect(-40, -40, W + 40, H + 40), DARK)
    for k in range(3):                                            # curtain folds either side of the screen
        for sx in (-1, 1):
            x = 540 + sx * (420 + k * 40)
            p.fill(rect(x - 30, 160, x + 30, 980, 20), K.mix(K.RED, K.INK, 0.35 + 0.1 * k))
    p.fill(rect(-40, 140, W + 40, 200, 10), K.mix(K.RED, K.INK, 0.3))
    x0, y0, x1, y1 = SCREEN
    S_ = rect(x0, y0, x1, y1, 12)
    sub = Pic()
    fl = 0.92 + 0.08 * math.sin(t * 31) * math.sin(t * 17)
    sub.fill(rect(x0 - 10, y0 - 10, x1 + 10, y1 + 10), K.mix(K.CREAM, K.GOLD, 0.15 * fl))
    if screen_fn:
        screen_fn(sub, (x0 + x1) / 2, (y0 + y1) / 2, x1 - x0, y1 - y0)
    p.clip(S_, sub, smooth=False)
    p.outline(S_, w=4.4, seed=1, breaks=3)
    # the beam (from the booth, top right behind the audience) with dust motes
    bx, by = 900, 1880
    beam = [[bx - 30, by], [bx + 30, by], [x1 - 40, y1 - 20], [x0 + 40, y0 + 20]]
    p.fill(beam, K.mix(K.CREAM, K.GOLD, 0.25), smooth=False, alpha=int(46 * fl))
    r = rng(4)
    for i in range(40):
        u = (r.uniform(0, 1) + t * 0.05 * r.uniform(0.5, 1.5)) % 1
        v = r.uniform(-0.4, 0.4)
        x = bx + (540 - bx) * u + v * 400 * u
        y = by + (540 - by) * u + 20 * math.sin(t + i)
        p.dot((x, y), r.uniform(1.5, 3.2), K.CREAM, alpha=int(150 * fl))
    # audience rows (heads bob; laugh shakes them)
    for row in range(4):
        y = 1180 + row * 170
        for i in range(8):
            x = 70 + i * 135 + (row % 2) * 60
            bob = 4 * math.sin(t * 2 + i + row) + laugh * 10 * abs(math.sin(t * 14 + i))
            s = 0.8 + row * 0.12
            p.fill(ell(x, y - bob, 48 * s, 58 * s, 14), K.mix(DARK, K.INK, 0.5))
            p.fill(ell(x + 14 * s, y - bob - 20 * s, 18 * s, 14 * s, 10), K.mix(K.SKIN, DARK, 0.6), alpha=160)   # beam-lit cheek
        p.fill(rect(-40, y + 40, W + 40, y + 70, 10), K.mix(K.RED, K.INK, 0.5))
    return p
