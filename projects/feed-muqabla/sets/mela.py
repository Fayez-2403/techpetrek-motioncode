"""SET A: the mela at dusk, Bioscope Baba's stage. Violet dusk bands, a turning Ferris wheel, bunting that sways,
glowing lanterns, a far crowd of heads, packed-earth ground. build(t). Pure function of t."""
import math
import numpy as np

from ink.core import Pic, ell, arc, rng, rect, boxy
from ink import kit
from ink import palette as K

W, H = 1080, 1920


def build(t=0.0) -> Pic:
    p = Pic()
    p.fill(rect(-40, -40, W + 40, H + 40), K.mix(K.COBALT, K.INK, 0.25))
    for k, (y0, c) in enumerate(((560, K.mix(K.COBALT, K.RED, 0.35)), (820, K.mix(K.RED, K.GOLD, 0.35)), (980, K.mix(K.GOLD, K.CREAM, 0.3)))):
        p.fill([[-40, y0], [W + 40, y0 - 30], [W + 40, 1300], [-40, 1300]], c, smooth=False)
    # Ferris wheel (turning) behind the fair
    cx, cy, R = 800, 760, 300
    a0 = t * 0.35
    p.ink(arc(cx, cy, R, R, 0, 360, 40), w=5, color=K.COBALT_D, taper=(0, 0), seed=1)
    for k in range(10):
        a = a0 + k * math.pi / 5
        ex, ey = cx + R * math.cos(a), cy + R * math.sin(a)
        p.ink([[cx, cy], [ex, ey]], w=3, color=K.COBALT_D, taper=(0, 0), seed=2 + k)
        p.shape(boxy([[ex - 26, ey + 4], [ex + 26, ey + 4], [ex + 22, ey + 44], [ex - 22, ey + 44]], 8),
                [K.RED, K.GOLD, K.CREAM][k % 3], w=2.4, seed=20 + k, jit=0.3)
    p.fill([[cx - 30, cy], [cx + 30, cy], [cx + 140, 1300], [cx - 140, 1300]], K.COBALT_D, smooth=False)
    # stalls + far crowd heads
    for k, x in enumerate((60, 340)):
        p.shape(boxy([[x, 980], [x + 240, 980], [x + 240, 1300], [x, 1300]], 14), K.mix(K.RED, K.COBALT, 0.3), w=3.2, seed=40 + k, jit=0.6)
        p.fill([[x - 20, 990], [x + 120, 900], [x + 260, 990]], K.GOLD, smooth=False)
        for s_ in range(6):
            p.fill(rect(x + s_ * 40, 990, x + s_ * 40 + 20, 1010, 4), K.CREAM)
    r = rng(9)
    for i in range(26):
        x = r.uniform(-20, W + 20)
        y = 1250 + r.uniform(-20, 30) + 6 * math.sin(t * 3 + i)
        p.fill(ell(x, y, 30, 36, 12), K.mix(K.COBALT, K.INK, 0.4))
    # bunting strings (sway) + lanterns (glow)
    for row in range(2):
        y0 = 260 + row * 170
        pts = [[x, y0 + 60 * math.sin(math.pi * x / W) + 10 * math.sin(t * 2 + x / 200 + row)] for x in range(-40, W + 80, 60)]
        p.ink(pts, w=2.2, taper=(0, 0), seed=60 + row, smooth=False)
        for k, (x, y) in enumerate(pts[:-1]):
            sw = 0.15 * math.sin(t * 3 + k + row)
            c = [K.RED, K.GOLD, K.CREAM, K.COBALT_L][(k + row) % 4]
            p.fill([[x + 4, y], [x + 50, y + 4], [x + 27 + 30 * sw, y + 60]], c, smooth=False)
    for k, x in enumerate((180, 540, 900)):
        y = 360 + 40 * math.sin(math.pi * x / W)
        fl = 1 + 0.08 * math.sin(t * 11 + k)
        for g, al in ((2.6, 40), (1.6, 80)):
            p.fill(ell(x, y + 40, 50 * g * fl, 50 * g * fl, 18), K.mix(K.GOLD_LI, K.CREAM, 0.4), alpha=al)
        p.shape(ell(x, y + 40, 30, 42, 14), K.GOLD_LI, w=2.6, seed=80 + k)
        p.ink([[x, y - 2], [x, y + 2]], w=2, taper=(0, 0), seed=83 + k)
    # ground
    p.fill([[-40, 1300], [W + 40, 1290], [W + 40, H + 40], [-40, H + 40]], K.mix(K.GOLD, K.RED, 0.35), smooth=False)
    p.fill([[540, 1300], [W + 40, 1290], [W + 40, H + 40], [200, H + 40]], K.mix(K.GOLD, K.COBALT, 0.5), smooth=False, alpha=200)
    rr = rng(11)
    for i in range(80):
        x, y = rr.uniform(0, W), rr.uniform(1320, H)
        p.dot((x, y), rr.uniform(1.5, 3.5), K.FINE, alpha=150)
    return p
