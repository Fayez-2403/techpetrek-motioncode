"""SET A: the village post office by day (DAK GHAR). A mud-brick wall (broken brick courses, cracks), the open door
with fields, a red post box and sunlight; a warm shaft across a cool room; the wooden counter with a brass scale, an ink
stamp, a stack of money-order forms and the brass telegraph key whose wire climbs out of the high window.
Frame space 1080 x 1920; build(t). Pure function of t."""
import math
import numpy as np

from ink.core import Pic, ell, arc, rng, boxy, rect
from ink import kit
from ink import palette as K

W, H = 1080, 1920
MUD = K.mix(K.GOLD, K.CREAM, 0.45)
MUD_SH = K.mix(MUD, K.COBALT, 0.42)
SUN = K.mix(K.CREAM, K.GOLD, 0.25)
WOOD = K.mix(K.GOLD, K.RED, 0.42)
WOOD_SH = K.mix(WOOD, K.COBALT, 0.5)
FIELD = K.mix(K.GOLD, K.CREAM, 0.15)


def room(t=0.0) -> Pic:
    p = Pic()
    p.fill(rect(-40, -40, W + 40, H + 40), MUD)
    p.fill([[640, -40], [W + 40, -40], [W + 40, H + 40], [260, H + 40]], MUD_SH, smooth=False)
    r = rng(5)
    for row in range(0, 40):                                    # broken brick courses
        y = row * 46
        x = -40 + (row % 2) * 40
        while x < W + 40:
            L = r.uniform(70, 110)
            if r.uniform() < 0.7:
                p.ink([[x, y + r.uniform(-1, 1)], [x + L, y + r.uniform(-1, 1)]], w=1.6, color=K.FINE, alpha=120, taper=(0.1, 0.1),
                      seed=row * 50 + int(x))
            if r.uniform() < 0.5:
                p.ink([[x + L, y], [x + L, y + 46]], w=1.4, color=K.FINE, alpha=110, taper=(0.1, 0.1), seed=row * 51 + int(x))
            x += L + 4
    for i, cr in enumerate(([[160, 300], [190, 380], [170, 450], [210, 540]], [[190, 380], [240, 400]], [[880, 820], [850, 900]])):
        p.ink(cr, w=2.2 - i * 0.4, color=K.FINE, alpha=220, taper=(0.1, 0.6), seed=40 + i)
    # the high window with the telegraph wire going out
    p.shape(rect(700, 140, 960, 360, 16), K.mix(K.COBALT_L, K.CREAM, 0.4), w=4.0, seed=50, jit=0.8)
    for x in (786, 872):
        p.fill(rect(x - 6, 140, x + 6, 360, 20), K.INK)
    # the open door: fields, a sky, the red post box, sunlight
    D = rect(60, 520, 420, 1400, 20)
    sub = Pic()
    sub.fill(rect(40, 500, 440, 1420), K.mix(K.COBALT_L, K.CREAM, 0.55))
    sub.fill([[40, 980], [440, 940], [440, 1420], [40, 1420]], FIELD, smooth=False)
    for i in range(14):
        x = 70 + i * 26
        sub.ink([[x, 1000 - (i % 3) * 8], [x + 6, 960 - (i % 3) * 8]], w=2.0, color=K.GOLD_SH, taper=(0.2, 0.6), seed=60 + i)
    sub.fill(ell(330, 650, 46, 46, 18), K.mix(K.CREAM, K.GOLD, 0.3))
    PB = boxy([[180, 1080], [300, 1080], [306, 1380], [174, 1380]], 14)               # the red post box
    sub.shape(PB, K.RED, w=4.0, seed=61, jit=0.6)
    sub.fill([[250, 1080], [306, 1080], [306, 1380], [236, 1380]], K.RED_SH, smooth=False)
    sub.shape(ell(240, 1080, 72, 26, 14), K.RED_SH, w=3.4, seed=62)
    sub.fill(rect(206, 1150, 274, 1166, 6), K.INK)
    kit.sparkle(sub, 200, 1110, 0.5)
    p.clip(D, sub, smooth=False)
    p.outline(D, w=4.4, seed=63, breaks=3)
    p.fill([[60, 1400], [420, 1400], [900, 1920], [300, 1920]], SUN, smooth=False, alpha=150)          # the sunlight on the floor
    p.fill([[60, 520], [420, 520], [1060, 1500], [700, 1700]], SUN, smooth=False, alpha=60)             # the warm shaft
    # wall calendar + the DAK GHAR board (lettering via overlay)
    p.shape(rect(560, 560, 700, 740, 14), K.CREAM, w=3.0, seed=70, jit=0.6)
    p.fill(rect(560, 560, 700, 604, 14), K.RED)
    kit.digits(p, "1937", 574, 640, 36, w=4.5, seed=71)
    p.shape(rect(160, 380, 560, 470, 14), K.RED, w=4.0, seed=72, jit=0.8)
    return p


def counter(t=0.0) -> Pic:
    p = Pic()
    C = boxy([[-40, 1380], [W + 40, 1380], [W + 40, H + 40], [-40, H + 40]])
    p.shape(C, WOOD, w=4.4, seed=80, jit=1.0)
    p.fill([[640, 1380], [W + 40, 1380], [W + 40, H + 40], [420, H + 40]], WOOD_SH, smooth=False, alpha=220)
    kit.wood(p, -40, 1380, W + 40, H + 40, plank=110, seed=81)
    p.fill(rect(-40, 1380, W + 40, 1404, 30), K.mix(WOOD, K.CREAM, 0.3))
    # brass scale
    p.shape(rect(80, 1340, 260, 1380, 10), K.GOLD_SH, w=3.0, seed=82, jit=0.4)
    p.fill(rect(160, 1180, 180, 1340, 10), K.GOLD_SH)
    tilt = 0.05 * math.sin(t * 1.3)
    for sx in (-1, 1):
        x = 170 + sx * 80
        y = 1190 + sx * 80 * tilt
        p.ink([[170, 1186], [x, y]], w=5, color=K.GOLD, taper=(0, 0), seed=83 + sx)
        p.ink([[x, y], [x - 30, y + 70]], w=1.6, taper=(0, 0), seed=84 + sx)
        p.ink([[x, y], [x + 30, y + 70]], w=1.6, taper=(0, 0), seed=85 + sx)
        p.shape(arc(x, y + 70, 44, 14, 0, 180, 10).tolist() + [[x - 44, y + 70]], K.GOLD, w=2.8, seed=86 + sx)
    kit.sparkle(p, 120, 1250, 0.5)
    # stack of forms + the ink stamp
    for i in range(5):
        p.shape(boxy([[380 + i * 3, 1350 - i * 8], [560 + i * 3, 1346 - i * 8], [566 + i * 3, 1376 - i * 8], [384 + i * 3, 1380 - i * 8]], 12),
                K.CREAM if i % 2 else K.mix(K.CREAM, K.RED, 0.15), w=2.2, seed=90 + i, jit=0.3)
    p.shape(rect(620, 1310, 700, 1370, 10), K.INK, w=2.6, seed=96)
    p.shape(rect(640, 1260, 680, 1312, 10), WOOD_SH, w=2.6, seed=97)
    # the brass telegraph key on its block, wire climbing to the window
    p.shape(boxy([[780, 1330], [1000, 1330], [1010, 1384], [770, 1384]], 12), WOOD, w=3.4, seed=98, jit=0.5)
    p.ink([[1000, 1350], [1040, 1200], [990, 700], [880, 360]], w=2.4, color=K.INK, taper=(0, 0), seed=99)
    return p


def key_arm(p, press=0.0):
    """The telegraph key lever (press 0..1), drawn on top so a hand can tap it."""
    a = -0.12 + 0.12 * press
    c, s = math.cos(a), math.sin(a)
    base = np.array([810, 1310])
    pts = [base + [c * dx - s * dy, s * dx + c * dy] for dx, dy in ((0, -6), (170, -6), (170, 6), (0, 6))]
    p.fill(pts, K.GOLD, smooth=False)
    p.ink(np.vstack([pts, pts[:1]]), w=2.4, taper=(0, 0), smooth=False, seed=100)
    knob = base + [c * 170, s * 170]
    p.shape(ell(knob[0], knob[1] - 10, 24, 16, 12), K.INK, w=2.4, seed=101)
    kit.sparkle(p, 860, 1300, 0.4)
    return knob


def build(t=0.0, press=0.0) -> Pic:
    p = Pic()
    p.add(room(t))
    p.add(counter(t))
    key_arm(p, press)
    return p


def board_text(fr, M):
    fr.text("DAK GHAR", 360, 426, 64, K.CREAM, M=M)
