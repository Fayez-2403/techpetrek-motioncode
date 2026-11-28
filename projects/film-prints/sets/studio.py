"""SET B: Kamal Studio, Bombay, 1936 (day). A sound stage: a big film camera on a tripod, two round studio lamps with
glow, stacked film cans, the KAMAL STUDIO board, the master reel on its stand; a gate window with a crowd (mob) that
surges. build(t, mob). Pure function of t."""
import math
import numpy as np

from ink.core import Pic, ell, arc, rng, rect, boxy
from ink import kit
from ink import palette as K
from film import props3 as P3

W, H = 1080, 1920
WALL = K.mix(K.CREAM, K.COBALT, 0.25)
WALL_SH = K.mix(K.CREAM, K.COBALT, 0.5)
FLOOR = K.mix(K.GOLD, K.RED, 0.4)


def build(t=0.0, mob=0.0, reel_a=None) -> Pic:
    p = Pic()
    p.fill(rect(-40, -40, W + 40, H + 40), WALL)
    p.fill([[640, -40], [W + 40, -40], [W + 40, H + 40], [260, H + 40]], WALL_SH, smooth=False)
    for i, x in enumerate(range(60, W, 120)):                       # stage flats
        p.ink([[x, -40], [x + 2, 1380]], w=1.8, color=K.FINE, alpha=150, taper=(0, 0), seed=300 + i)
    p.shape(rect(160, 140, 920, 250, 14), K.RED, w=4.0, seed=1, jit=0.8)          # the board (lettering via text)
    # the gate window with the crowd
    O = boxy([[620, 400], [1000, 400], [1000, 760], [620, 760]], 16)
    sub = Pic()
    sub.fill(rect(600, 380, 1020, 780), K.mix(K.COBALT_L, K.CREAM, 0.5))
    r = rng(5)
    for row in range(2):
        for i in range(6):
            x = 640 + i * 70 + row * 35 + r.uniform(-6, 6)
            y = 620 + row * 90 + (8 + 30 * mob) * math.sin(t * (4 + 5 * mob) + i * 1.3 + row)
            sub.shape(ell(x, y, 30, 38, 12), K.SKIN if (i + row) % 2 else K.SKIN_SH, w=2.4, seed=10 + i + row * 10)
            sub.fill([[x - 34, y - 24], [x, y - 56], [x + 34, y - 24]], [K.RED, K.CREAM, K.GOLD, K.COBALT][(i + row) % 4], smooth=False)
    if mob > 0.2:
        for i in range(4):
            a = 0.4 * math.sin(t * 9 + i)
            kit.hand(sub, 680 + i * 90, 760 - 40 * mob, s=0.7, rot=a, pose="open", seed=40 + i)
    p.clip(O, sub, smooth=False)
    for x in range(650, 1000, 50):
        p.fill(rect(x - 5, 400, x + 5, 760, 20), K.INK)
    p.outline(O, w=4.4, seed=2, breaks=3)
    # two studio lamps with glow
    for k, (x, y) in enumerate(((150, 520), (480, 470))):
        for g, al in ((3.0, 40), (1.8, 70)):
            p.fill(ell(x, y, 90 * g, 90 * g, 20), K.mix(K.CREAM, K.GOLD, 0.4), alpha=al)
        p.shape(ell(x, y, 90, 90, 22), K.COBALT_D, w=3.6, seed=20 + k)
        p.fill(ell(x, y, 66, 66, 20), K.mix(K.CREAM, K.GOLD, 0.35))
        kit.sparkle(p, x - 30, y - 30, 0.7)
        p.ink([[x, y + 90], [x, 1300]], w=8, color=K.COBALT_D, taper=(0, 0), seed=24 + k)
    # floor
    p.fill([[-40, 1300], [W + 40, 1300], [W + 40, H + 40], [-40, H + 40]], FLOOR, smooth=False)
    p.fill([[600, 1300], [W + 40, 1300], [W + 40, H + 40], [240, H + 40]], K.mix(FLOOR, K.COBALT, 0.4), smooth=False, alpha=220)
    kit.wood(p, -40, 1300, W + 40, H + 40, plank=100, seed=30)
    # stacked film cans
    for k in range(4):
        P3.film_can(p, 860, 1560 - k * 70, 0.7, seed=40 + k, label=False)
    # the master reel on its stand
    p.shape(boxy([[200, 1500], [240, 1500], [260, 1700], [180, 1700]], 10), K.COBALT_D, w=3.2, seed=50, jit=0.3)
    P3.reel(p, 220, 1380, 0.9, a=(t * 2.0 if reel_a is None else reel_a), seed=51)
    # the camera on a tripod
    for sx in (-1, 0, 1):
        p.ink([[560, 1240], [560 + sx * 110, 1700]], w=8, color=K.COBALT_D, taper=(0, 0), seed=60 + sx)
    p.shape(boxy([[460, 1120], [660, 1120], [660, 1250], [460, 1250]], 12), K.INK, w=3.4, seed=63, jit=0.4)
    for k, ox in enumerate((500, 620)):
        P3.reel(p, ox, 1080, 0.36, a=t * 3 + k, seed=64 + k)
    p.shape(boxy([[660, 1160], [740, 1150], [740, 1220], [660, 1210]], 8), K.COBALT_D, w=3.0, seed=66, jit=0.3)
    kit.sparkle(p, 720, 1170, 0.5)
    return p


def board_text(fr, M):
    fr.text("KAMAL STUDIO  BOMBAY", 540, 196, 60, K.CREAM, M=M)
