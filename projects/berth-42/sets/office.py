"""SET B: the 10 AM booking office. Day: a cool blue-violet room, one warm shaft from the high window falling on the
register; a brass wall clock at 10:00 (sparkle); the barred TATKAL window with the crowd bobbing outside; a ceiling
fan turning; chipped plaster with brick courses and branching cracks. Frame space 1080 x 1920."""
import math
import numpy as np

from ink.core import Pic, ell, arc, rng, boxy, rect, affine
from ink import kit
from ink import palette as K
from ink.text import text_img, paste_center

W, H = 1080, 1920
WALL = K.mix(K.CREAM, K.COBALT, 0.18)
WALL_SH = K.mix(K.CREAM, K.COBALT, 0.42)
SUN = K.mix(K.CREAM, K.GOLD, 0.22)
WOOD = K.mix(K.GOLD, K.RED, 0.45)
WOOD_SH = K.mix(WOOD, K.COBALT, 0.5)


def crowd(t=0.0, surge=0.0) -> Pic:
    """Heads behind the bars: single drawings with a breathing bob (extras: fewer marks, same line)."""
    p = Pic()
    p.fill(rect(250, 560, 830, 1000), K.mix(K.COBALT_L, K.CREAM, 0.3))
    r = rng(77)
    hats = [K.RED, K.CREAM, K.GOLD, K.COBALT, None, K.RED_SH, K.CREAM_SH]
    for row in range(2):
        for i in range(7):
            x = 260 + i * 92 + row * 46 + r.uniform(-10, 10)
            y = 760 + row * 120 + (10 + 26 * surge) * math.sin(t * (3.0 + i * 0.4 + row + 4 * surge) + i)
            s = 0.9 + row * 0.15
            p.shape(ell(x, y, 44 * s, 54 * s, 14), K.SKIN if (i + row) % 2 else K.SKIN_SH, w=3.0, seed=500 + i + row * 10)
            for sx in (-1, 1):
                p.dot((x + sx * 14 * s, y - 4), 3.4, K.INK)
            p.ink([[x - 12 * s, y + 24 * s], [x + 12 * s, y + 22 * s]], w=2.0, seed=520 + i + row * 10)
            hc = hats[(i * 3 + row) % len(hats)]
            if hc is not None:
                p.shape([[x - 50 * s, y - 34 * s], [x - 40 * s, y - 70 * s], [x, y - 84 * s], [x + 40 * s, y - 70 * s],
                         [x + 50 * s, y - 34 * s]], hc, w=3.0, seed=540 + i + row * 10)
            p.shape(boxy([[x - 60 * s, y + 50 * s], [x + 60 * s, y + 50 * s], [x + 70 * s, y + 160 * s],
                          [x - 70 * s, y + 160 * s]], 14), hats[(i + row * 2) % 4] or K.CREAM, w=3.0, seed=560 + i + row * 10)
    # hands reaching through the bars, waving forms
    for i, x in enumerate((360, 520, 700)):
        a = (0.3 + 0.4 * surge) * math.sin(t * (5 + 5 * surge) + i * 2)
        kit.hand(p, x, 1000 - 60 * surge, s=0.8, rot=a, pose="open", seed=600 + i)
    return p


def room(t=0.0, clock=(10.0, 0.0)) -> Pic:
    p = Pic()
    p.fill([[0, 0], [W, 0], [W, H], [0, H]], WALL, smooth=False)
    # shadow side of the room (blue-violet), hard diagonal
    p.fill([[700, 0], [W, 0], [W, H], [300, H]], WALL_SH, smooth=False)
    # chipped plaster showing brick courses, and a branching crack
    sub = Pic()
    sub.fill(rect(-40, 1100, 400, 1500), K.mix(K.RED, K.CREAM, 0.45))
    for row in range(10):
        y = 1110 + row * 40
        sub.ink([[-40, y], [420, y + 2]], w=2.0, color=K.FINE, alpha=200, taper=(0, 0), seed=700 + row)
        for k in range(6):
            x = -20 + k * 80 + (row % 2) * 40
            sub.ink([[x, y], [x, y + 40]], w=1.8, color=K.FINE, alpha=190, taper=(0, 0), seed=720 + row * 7 + k)
    hole = [[20, 1160], [180, 1120], [330, 1190], [360, 1330], [250, 1450], [80, 1420], [10, 1300]]
    p.clip(hole, sub)
    p.outline(np.array(hole, float), w=3.0, seed=740, breaks=3)
    for i, cr in enumerate(([[1010, 900], [980, 1000], [1000, 1080], [960, 1160]], [[980, 1000], [930, 1040]],
                            [[1000, 1080], [1060, 1130]])):
        p.ink(cr, w=2.2 - i * 0.4, color=K.FINE, alpha=220, taper=(0.1, 0.6), seed=750 + i)
    # the high arched window (upper left) and its warm shaft
    Wn = np.vstack([arc(220, 130, 160, 100, 180, 360, 14), boxy([[380, 130], [380, 300], [60, 300], [60, 130]], 20)])
    p.fill(Wn, K.mix(K.CREAM, K.GOLD, 0.5), smooth=False)
    p.outline(Wn, w=4.0, seed=760, breaks=3)
    for x in (165, 275):
        p.ink([[x, 40], [x, 300]], w=5.0, taper=(0, 0), seed=761 + x)
    p.ink([[60, 200], [380, 200]], w=4.0, taper=(0, 0), seed=763)
    p.fill([[60, 300], [380, 300], [980, 1500], [520, 1640]], SUN, smooth=False, alpha=150)
    # ceiling fan (turning)
    a0 = t * 7.0
    for k in range(3):
        a = a0 + k * 2.094
        blade = [[540, 60], [540 + 230 * math.cos(a) - 24 * math.sin(a), 60 + 40 * math.sin(a) + 6],
                 [540 + 240 * math.cos(a) + 24 * math.sin(a), 60 + 40 * math.sin(a) - 6]]
        p.fill(blade, WOOD_SH, smooth=False)
    p.shape(ell(540, 60, 30, 18, 12), K.INK, w=2.4, seed=770)
    p.ink([[540, -10], [540, 44]], w=6, taper=(0, 0), seed=771)
    # the brass wall clock at 10:00
    cx, cy, R = 860, 250, 112
    p.shape(ell(cx, cy, R + 22, R + 22, 30), K.GOLD, w=4.2, seed=780)
    p.fill([[cx - 20, cy - R - 22], [cx + 160, cy - R - 22], [cx + 160, cy + R + 22], [cx + 20, cy + R + 22]],
           K.GOLD_SH, smooth=False, alpha=0)
    p.shape(ell(cx, cy, R, R, 30), K.CREAM, w=3.0, seed=781)
    for k in range(12):
        a = k * math.pi / 6
        p.ink([[cx + R * 0.82 * math.sin(a), cy - R * 0.82 * math.cos(a)], [cx + R * 0.94 * math.sin(a), cy - R * 0.94 * math.cos(a)]],
              w=3.0 if k % 3 == 0 else 1.6, taper=(0, 0), seed=790 + k)
    kit.digits(p, "12", cx - 20, cy - R * 0.74, 30, w=4, seed=800)
    kit.digits(p, "3", cx + R * 0.58, cy - 14, 30, w=4, seed=801)
    kit.digits(p, "6", cx - 9, cy + R * 0.5, 30, w=4, seed=802)
    kit.digits(p, "9", cx - R * 0.72, cy - 14, 30, w=4, seed=803)
    hh, mm = clock
    hour = (hh % 12 + mm / 60) / 12 * 2 * math.pi
    mnt = mm / 60 * 2 * math.pi
    p.ink([[cx, cy], [cx + R * 0.5 * math.sin(hour), cy - R * 0.5 * math.cos(hour)]], w=8, taper=(0, 0.5), seed=810)
    p.ink([[cx, cy], [cx + R * 0.78 * math.sin(mnt), cy - R * 0.78 * math.cos(mnt)]], w=5, taper=(0, 0.6), seed=811)
    p.dot((cx, cy), 8, K.INK)
    kit.sparkle(p, cx - 90, cy - 100, 0.8)
    pend = 22 * math.sin(t * 3.1)
    p.ink([[cx, cy + R + 22], [cx + pend, cy + R + 160]], w=3, taper=(0, 0), seed=812)
    p.shape(ell(cx + pend, cy + R + 180, 26, 26, 14), K.GOLD, w=3.0, seed=813)
    return p


def partition(t=0.0, surge=0.0) -> Pic:
    """The wooden partition with the barred TATKAL window; the board above takes the lettering (overlay)."""
    p = Pic()
    P = [[150, 470], [930, 470], [930, 1260], [150, 1260]]
    sub = Pic()
    sub.fill(rect(150, 470, 930, 1260), WOOD)
    sub.fill([[600, 470], [930, 470], [930, 1260], [380, 1260]], WOOD_SH, smooth=False, alpha=220)
    kit.wood(sub, 150, 470, 930, 1260, plank=90, seed=830, horizontal=False)
    hole = boxy([[250, 1000], [250, 700], [330, 600], [540, 560], [750, 600], [830, 700], [830, 1000]], 20)
    # cut the window: draw the crowd + bars there
    p.fill(rect(150, 470, 930, 1260), WOOD, jit=1.2, seed=831)
    p.clip(rect(150, 470, 930, 1260), sub)
    p.clip(hole, crowd(t, surge))
    for x in range(290, 830, 62):
        p.fill(rect(x - 6, 560, x + 6, 1004, 30), K.INK)
        p.ink([[x - 2, 600], [x - 2, 990]], w=1.4, color=K.COBALT_L, alpha=170, taper=(0, 0), seed=840 + x)
    p.fill(rect(250, 820, 830, 834, 30), K.INK)
    p.outline(hole, w=5, seed=850, breaks=3)
    p.outline(rect(150, 470, 930, 1260), w=4.4, seed=851, breaks=4)
    # the sign board
    p.shape(rect(330, 400, 750, 520, 16), K.RED, w=4.2, seed=860, jit=1.0)
    p.fill([[600, 400], [750, 400], [750, 520], [560, 520]], K.RED_SH, smooth=False, alpha=200)
    return p


def desk(t=0.0) -> Pic:
    """The desk and the giant shared register, an ink pot and two pens."""
    p = Pic()
    D = boxy([[-30, 1380], [W + 30, 1380], [W + 30, H], [-30, H]])
    p.shape(D, WOOD, w=4.4, seed=900, jit=1.0)
    p.fill([[620, 1380], [W + 30, 1380], [W + 30, H], [420, H]], WOOD_SH, smooth=False, alpha=220)
    kit.wood(p, -30, 1380, W + 30, H, plank=110, seed=901)
    # the register: two cream pages, ruled rows, row numbers, a spine
    L = boxy([[150, 1420], [540, 1400], [540, 1760], [130, 1790]], 20)
    R = boxy([[540, 1400], [930, 1420], [950, 1790], [540, 1760]], 20)
    for k, Pg in enumerate((L, R)):
        p.shape(Pg, K.CREAM, w=3.8, seed=910 + k, jit=0.8)
    p.fill([[700, 1400], [930, 1420], [950, 1790], [640, 1760]], K.CREAM_SH, smooth=False, alpha=160)
    for i in range(9):
        y = 1450 + i * 36
        p.ink([[160, y + (8 - i) * 0.5], [530, y - 2]], w=1.4, color=K.RED, alpha=170, taper=(0, 0), seed=920 + i)
        p.ink([[550, y - 2], [930, y + (8 - i) * 0.5]], w=1.4, color=K.RED, alpha=170, taper=(0, 0), seed=930 + i)
        kit.digits(p, str(38 + i), 168, y - 30, 22, w=3, seed=940 + i)
    p.fill(rect(152, 1560, 928, 1592, 20), K.GOLD, alpha=90)                        # row 42 in the light
    p.ink([[540, 1400], [542, 1764]], w=4.0, taper=(0.05, 0.05), seed=950)
    # ink pot + two pens
    p.shape(boxy([[960, 1500], [1040, 1500], [1050, 1600], [950, 1600]], 12), K.COBALT_D, w=3.4, seed=960, jit=0.6)
    p.fill(ell(1000, 1500, 34, 10, 12), K.INK)
    kit.sparkle(p, 972, 1530, 0.4)
    for k, (a, b) in enumerate((((60, 1560), (160, 1440)), ((990, 1460), (1060, 1330)))):
        p.ink([a, b], w=9, color=K.RED_SH, taper=(0.02, 0.02), seed=970 + k)
        p.ink([a, [a[0] + (a[0] - b[0]) * 0.12, a[1] + (a[1] - b[1]) * 0.12]], w=5, color=K.GOLD, taper=(0, 0.9),
              seed=972 + k)
    return p


def build(t=0.0, surge=0.0, clock=(10.0, 0.0)) -> Pic:
    p = Pic()
    p.add(room(t, clock))
    p.add(partition(t, surge))
    p.add(desk(t))
    return p


def overlay(img, t=0.0):
    """Lettering on the board (TATKAL) - composited before the finish so it ages with the frame."""
    S = img.width / W
    paste_center(img, text_img("TATKAL", int(84 * S), K.CREAM, weight=900, width=90), 540 * S, 460 * S)
