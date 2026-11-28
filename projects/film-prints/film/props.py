"""Props for Berth 42 (every noun in the script is a drawing). Local units, y down; each fn adds to a Pic."""
import math
import numpy as np

from ink.core import Pic, ell, arc, rect, boxy, affine, catmull
from ink import kit
from ink import palette as K

STEEL = K.mix(K.CREAM, K.COBALT, 0.42)
STEEL_SH = K.mix(K.CREAM, K.COBALT, 0.7)
WOOD = K.mix(K.GOLD, K.RED, 0.45)
WOOD_SH = K.mix(WOOD, K.COBALT, 0.5)


def _at(pic, sub, x, y, s=1.0, rot=0.0):
    pic.add(sub, affine(tx=x, ty=y, sx=s, rot=rot))


def padlock(pic, x, y, s=1.0, open_amt=0.0, rot=0.0, seed=0, tag=None, hourglass=None, t=0.0):
    """Brass padlock. open_amt 0 = shut, 1 = shackle up and swung out. tag: digits on a hanging tag."""
    p = Pic()
    lift = 46 * open_amt
    swing = 0.7 * max(0.0, open_amt - 0.4) / 0.6
    sh = Pic()
    Sh = np.vstack([arc(0, -60, 52, 66, 180, 360, 14)])
    sh.ink(Sh, w=16, color=STEEL_SH, taper=(0, 0), pressure=0.05, wobble=0.3, seed=seed)
    sh.ink(Sh, w=9, color=STEEL, taper=(0, 0), pressure=0.05, wobble=0.3, seed=seed + 1)
    sh.ink([[-52, -60], [-52, 0]], w=16, color=STEEL_SH, taper=(0, 0), seed=seed + 2)
    sh.ink([[52, -60], [52, -6]], w=16, color=STEEL_SH, taper=(0, 0), seed=seed + 3)
    sh.ink([[-52, -60], [-52, 0]], w=9, color=STEEL, taper=(0, 0), seed=seed + 4)
    sh.ink([[52, -60], [52, -6]], w=9, color=STEEL, taper=(0, 0), seed=seed + 5)
    p.add(sh, affine(ty=-lift, rot=swing, px=-52, py=0))
    B = rect(-86, -10, 86, 130, 18)
    p.shape(B, K.GOLD, w=4.0, seed=seed + 10, jit=0.8)
    sub = Pic()
    sub.fill([[20, -20], [120, -20], [120, 150], [-20, 150]], K.GOLD_SH, smooth=False)
    sub.ink([[-70, 10], [60, 10]], w=3, color=K.GOLD_LI, taper=(0.2, 0.5), seed=seed + 11)
    p.clip(B, sub, smooth=False)
    p.outline(B, w=4.0, seed=seed + 12, breaks=3)
    p.fill(ell(0, 52, 13, 13, 12), K.INK)
    p.fill([[-6, 56], [6, 56], [9, 92], [-9, 92]], K.INK, smooth=False)
    kit.sparkle(p, -50, 20, 0.55)
    if tag is not None:
        p.ink([[60, 120], [90, 168], [96, 190]], w=2.2, color=K.FINE, taper=(0, 0), seed=seed + 20)
        T = boxy([[70, 190], [150, 178], [160, 236], [80, 248]], 10)
        p.shape(T, K.CREAM, w=3.0, seed=seed + 21, jit=0.6)
        if tag:
            kit.digits(p, tag, 90, 196, 34, w=4.5, seed=seed + 22)
    if hourglass is not None:
        hourglass_prop(p, 0, 168, 0.55, hourglass, t, seed + 40)
    _at(pic, p, x, y, s, rot)


def hourglass_prop(pic, x, y, s=1.0, top=1.0, t=0.0, seed=0):
    """Sand timer: wood plates + posts, glass bulbs, sand (top fraction `top`), a falling thread while running."""
    p = Pic()
    G = np.array([[-60, -120], [60, -120], [50, -40], [8, -4], [8, 4], [50, 40], [60, 120], [-60, 120], [-50, 40],
                  [-8, 4], [-8, -4], [-50, -40]], float)
    p.fill(G, K.mix(K.LILAC, K.COBALT_L, 0.4), alpha=170)
    top = max(0.0, min(1.0, top))
    if top > 0.01:
        h = 100 * top
        y0 = -8 - h
        p.fill([[-8 - 44 * top, y0], [8 + 44 * top, y0], [8, -6], [-8, -6]], K.GOLD, smooth=False)
        if top < 0.995:
            p.ink([[0, -4], [0, 116]], w=3.0, color=K.GOLD, taper=(0, 0), seed=seed)
    bh = 100 * (1 - top)
    if bh > 1:
        p.fill([[-56, 116], [56, 116], [10 + 34 * (1 - (1 - top)), 116 - bh], [-10 - 34 * (1 - (1 - top)), 116 - bh]],
               K.GOLD_SH, smooth=False)
        p.fill(ell(0, 116 - bh, 30 * (1 - top) + 10, 8, 10), K.GOLD)
    p.ink(np.vstack([G, G[:1]]), w=3.4, taper=(0, 0), pressure=0.15, seed=seed + 1, smooth=False)
    p.ink([[-36, -100], [-30, -60]], w=3, color=K.CREAM, alpha=200, taper=(0.2, 0.5), seed=seed + 2)
    for yy in (-136, 136):
        p.shape(rect(-80, yy - 16, 80, yy + 16, 12), WOOD, w=3.4, seed=seed + 3 + yy, jit=0.6)
    for xx in (-72, 72):
        p.shape(rect(xx - 8, -124, xx + 8, 124, 12), WOOD_SH, w=2.8, seed=seed + 5 + xx, jit=0.4)
    _at(pic, p, x, y, s)


def pocket_watch(pic, x, y, s=1.0, hour=10.0, minute=0.0, seed=0, blur_hands=0.0):
    p = Pic()
    p.ink([[0, -150], [-40, -230], [-20, -320]], w=4, color=K.GOLD, taper=(0, 0), seed=seed)
    kit.dash_rows(p, [[0, -150], [-40, -230], [-20, -320]], rows=1, gap=0, dash=6, step=12, w=2.2, color=K.GOLD_SH,
                  seed=seed + 1, tilt=1.0)
    p.shape(ell(0, -134, 22, 18, 12), K.GOLD, w=3, seed=seed + 2)
    p.shape(ell(0, 0, 130, 130, 30), K.GOLD, w=4.4, seed=seed + 3)
    p.fill([[30, -140], [160, -140], [160, 140], [-40, 140]], K.GOLD_SH, smooth=False, alpha=0)
    p.shape(ell(0, 0, 108, 108, 30), K.CREAM, w=3, seed=seed + 4)
    for k in range(12):
        a = k * math.pi / 6
        p.ink([[90 * math.sin(a), -90 * math.cos(a)], [102 * math.sin(a), -102 * math.cos(a)]],
              w=3.2 if k % 3 == 0 else 1.6, taper=(0, 0), seed=seed + 10 + k)
    ha = (hour % 12 + minute / 60) / 12 * 2 * math.pi
    ma = minute / 60 * 2 * math.pi
    for j in range(3 if blur_hands > 0 else 1):
        off = -j * blur_hands * 0.25
        al = 255 if j == 0 else 110
        p.ink([[0, 0], [52 * math.sin(ha + off * 0.08), -52 * math.cos(ha + off * 0.08)]], w=8, taper=(0, 0.5),
              seed=seed + 30, alpha=al)
        p.ink([[0, 0], [84 * math.sin(ma + off), -84 * math.cos(ma + off)]], w=5, taper=(0, 0.6), seed=seed + 31,
              alpha=al)
    p.dot((0, 0), 8, K.INK)
    kit.sparkle(p, -70, -70, 0.8)
    _at(pic, p, x, y, s)


def phone(pic, x, y, s=1.0, seed=0):
    """An inked phone (the time-jump object): ink body, cream screen. Text goes on via Frame.text."""
    p = Pic()
    B = rect(-150, -290, 150, 290, 30)
    p.shape(B, K.INK, w=3.6, seed=seed, jit=0.6)
    Sc = rect(-132, -250, 132, 262, 20)
    p.shape(Sc, K.CREAM, w=2.4, seed=seed + 1, jit=0.4)
    p.fill(rect(-132, -250, 132, -190, 20), K.COBALT)
    p.shape(rect(-100, 150, 100, 220, 18), K.RED, w=2.6, seed=seed + 2, jit=0.4)
    p.fill(ell(0, -272, 26, 6, 10), K.mix(K.INK, K.COBALT, 0.4))
    kit.sparkle(p, -110, -230, 0.5)
    _at(pic, p, x, y, s)


def pen(pic, x, y, s=1.0, rot=0.0, seed=0):
    """A dip pen pointing along +y (nib at the end), rot about the nib."""
    p = Pic()
    p.ink([[0, -320], [0, -40]], w=16, color=K.RED_SH, taper=(0.02, 0.02), seed=seed)
    p.ink([[-3, -300], [-3, -60]], w=3, color=K.RED_LI, alpha=200, taper=(0.1, 0.1), seed=seed + 1)
    p.shape([[-9, -44], [9, -44], [3, 0], [0, 6], [-3, 0]], K.GOLD, w=2.4, seed=seed + 2, jit=0.2)
    p.ink([[0, -30], [0, 0]], w=1.4, color=K.INK, taper=(0, 0.3), seed=seed + 3)
    _at(pic, p, x, y, s, rot)


def ledger(pic, x, y, s=1.0, rows=range(38, 47), hi=42, light=K.GOLD, seed=0, night=False):
    """Top-down open register: two pages, ruled rows with numbers; row `hi` lit. Names go on via Frame.text."""
    p = Pic()
    paper = K.mix(K.CREAM, K.SKIN, 0.2) if night else K.CREAM
    L = boxy([[-420, -300], [0, -320], [0, 330], [-430, 310]], 20)
    R = boxy([[0, -320], [420, -300], [430, 310], [0, 330]], 20)
    p.shape(L, paper, w=4.0, seed=seed, jit=0.6)
    p.shape(R, paper, w=4.0, seed=seed + 1, jit=0.6)
    p.fill([[160, -320], [420, -300], [430, 310], [100, 330]], K.CREAM_SH if not night else K.mix(paper, K.COBALT, 0.4),
           smooth=False, alpha=150)
    n = len(rows)
    for i, r in enumerate(rows):
        yy = -250 + i * (540 / n)
        if r == hi:
            p.fill(rect(-410, yy - 52, 410, yy + 6, 20), light, alpha=110)
        p.ink([[-410, yy + 6], [410, yy + 6]], w=1.6, color=K.RED, alpha=170, taper=(0, 0), seed=seed + 10 + i)
        kit.digits(p, str(r), -400, yy - 44, 36, w=4, seed=seed + 30 + i)
    p.ink([[-340, -300], [-340, 316]], w=1.6, color=K.RED, alpha=170, taper=(0, 0), seed=seed + 60)
    p.ink([[0, -320], [2, 330]], w=4.4, taper=(0.03, 0.03), seed=seed + 61)
    _at(pic, p, x, y, s)
    return lambda r: (x + (-300) * s, y + (-250 + (list(rows).index(r)) * (540 / n) - 22) * s)


def telegram(pic, x, y, s=1.0, length=1.0, seed=0, rows=1):
    """A cream telegram strip, unrolled to `length` (0..1) of 900 units, with perforated edges."""
    p = Pic()
    Lx = 900 * max(0.02, length)
    hh = 70 if rows == 1 else 152
    S_ = rect(-450, -hh, -450 + Lx, hh, 20)
    p.shape(S_, K.mix(K.CREAM, K.GOLD, 0.12), w=3.6, seed=seed, jit=0.5)
    for i in range(int(Lx / 30)):
        xx = -440 + i * 30
        p.dot((xx, -hh + 12), 3.2, K.CREAM_SH)
        p.dot((xx, hh - 12), 3.2, K.CREAM_SH)
    if length < 1:
        p.shape(ell(-450 + Lx, 0, 34, hh + 6, 16), K.mix(K.CREAM, K.GOLD, 0.25), w=3.4, seed=seed + 1)   # the roll
    _at(pic, p, x, y, s)


def hook_board(pic, x, y, s=1.0, locks=None, seed=0):
    """Wall board: hooks 38-46, each with a number and (optionally) a padlock: locks = {n: open_amt}."""
    p = Pic()
    p.shape(rect(-470, -170, 470, 330, 22), WOOD, w=4.2, seed=seed, jit=1.0)
    p.fill([[120, -170], [470, -170], [470, 330], [-40, 330]], WOOD_SH, smooth=False, alpha=200)
    kit.wood(p, -470, -170, 470, 330, plank=100, seed=seed + 1)
    nums = list(range(38, 47))
    pos = {}
    for i, n in enumerate(nums):
        col, row = i % 5, i // 5
        hx, hy = -380 + col * 190, -110 + row * 240
        p.fill(rect(hx - 30, hy - 26, hx + 30, hy + 8, 10), K.CREAM)
        kit.digits(p, str(n), hx - 22, hy - 22, 26, w=3.2, seed=seed + 10 + i)
        p.ink(arc(hx, hy + 30, 12, 16, 0, 200, 8), w=5, color=K.INK, taper=(0, 0.4), seed=seed + 30 + i)
        pos[n] = (hx, hy + 44)
    _at(pic, p, x, y, s)
    out = {}
    for n, (hx, hy) in pos.items():
        out[n] = (x + hx * s, y + hy * s)
        if locks and n in locks:
            padlock(pic, x + hx * s, y + (hy + 54) * s, s * 0.42, open_amt=locks[n], seed=seed + 200 + n)
    return out


def stool(pic, x, y, s=1.0, seed=0):
    p = Pic()
    p.shape(boxy([[-110, -20], [110, -20], [100, 20], [-100, 20]], 14), WOOD, w=3.6, seed=seed, jit=0.6)
    for xx in (-80, 80):
        p.shape(boxy([[xx - 12, 20], [xx + 12, 20], [xx + 20 * np.sign(xx) + 10, 280], [xx + 20 * np.sign(xx) - 10, 280]], 14),
                WOOD_SH, w=3.0, seed=seed + int(xx), jit=0.4)
    _at(pic, p, x, y, s)


def chai_glass(pic, x, y, s=1.0, t=0.0, seed=0):
    p = Pic()
    G = boxy([[-30, -50], [30, -50], [24, 40], [-24, 40]], 8)
    p.fill(G, K.mix(K.CREAM, K.GOLD, 0.35), alpha=220)
    p.fill([[-28, -30], [28, -30], [24, 40], [-24, 40]], K.mix(K.GOLD, K.RED, 0.5), smooth=False, alpha=230)
    p.ink(np.vstack([G, G[:1]]), w=2.6, taper=(0, 0), smooth=False, seed=seed)
    for i in range(2):
        a = t * 2.4 + i * 2
        p.ink([[-8 + i * 16, -60], [-14 + i * 16 + 8 * math.sin(a), -100], [-6 + i * 16, -140]], w=2.4, color=K.CREAM,
              alpha=200, taper=(0.2, 0.8), seed=seed + 1 + i)
    _at(pic, p, x, y, s)


def sehra_box(pic, x, y, s=1.0, seed=0):
    p = Pic()
    p.shape(rect(-90, -60, 90, 60, 14), K.GOLD, w=3.6, seed=seed, jit=0.6)
    p.fill([[20, -60], [90, -60], [90, 60], [0, 60]], K.GOLD_SH, smooth=False, alpha=200)
    kit.dash_rows(p, [[-80, -30], [80, -30]], rows=3, gap=24, dash=8, step=18, w=2.0, color=K.RED, seed=seed + 1, tilt=0)
    for i in range(7):                                   # the sehra's flower strands spilling out
        xx = -70 + i * 23
        p.ink([[xx, -60], [xx + 4, -110 - 10 * (i % 2)]], w=3, color=K.CREAM, taper=(0, 0.3), seed=seed + 10 + i)
        p.dot((xx + 4, -112 - 10 * (i % 2)), 6, K.RED if i % 2 else K.CREAM)
    _at(pic, p, x, y, s)


def lantern(pic, x, y, s=1.0, t=0.0, seed=0):
    p = Pic()
    fl = 1 + 0.06 * math.sin(t * 13.0) + 0.04 * math.sin(t * 7.3 + 1)
    for k, al in ((3.4, 36), (2.2, 60), (1.4, 90)):
        p.fill(ell(0, 0, 70 * k * fl, 70 * k * fl, 24), K.mix(K.SKIN_LI, K.CREAM, 0.5), alpha=al)
    p.ink(arc(0, -110, 40, 50, 180, 360, 10), w=4, taper=(0, 0), seed=seed)
    G = [[-46, -84], [46, -84], [56, 0], [42, 64], [-42, 64], [-56, 0]]
    p.fill(G, K.mix(K.CREAM, K.GOLD, 0.25), alpha=230)
    p.fill(ell(0, 6, 16 * fl, 30 * fl, 14), K.GOLD_LI)
    p.fill(ell(0, 14, 8, 16, 10), K.CREAM)
    p.outline(np.array(G, float), w=3.4, seed=seed + 1, breaks=2)
    p.shape(boxy([[-62, 64], [62, 64], [54, 100], [-54, 100]], 10), K.GOLD_SH, w=3.2, seed=seed + 2, jit=0.5)
    p.shape(boxy([[-50, -110], [50, -110], [44, -82], [-44, -82]], 10), K.GOLD_SH, w=3.0, seed=seed + 3, jit=0.5)
    kit.sparkle(p, 30, -36, 0.7)
    _at(pic, p, x, y, s)


def stamp_mark(pic, x, y, s=1.0, rot=0.0, seed=0):
    """A red rubber-stamp frame (the word goes on via Frame.text)."""
    p = Pic()
    O = rect(-150, -60, 150, 60, 14)
    p.ink(np.vstack([O, O[:1]]), w=9, color=K.RED, taper=(0, 0), pressure=0.35, wobble=1.2, seed=seed, smooth=False, alpha=230)
    p.ink(np.vstack([rect(-134, -46, 134, 46, 14), rect(-134, -46, 134, 46, 14)[:1]]), w=3, color=K.RED, taper=(0, 0),
          pressure=0.3, wobble=1.0, seed=seed + 1, smooth=False, alpha=210)
    _at(pic, p, x, y, s, rot)


def splat(pic, x, y, s=1.0, t=0.0, seed=0, color=K.INK):
    """Ink splash at an impact, growing then holding."""
    from ink.core import rng
    r = rng(seed)
    g = min(1.0, t / 0.12)
    p = Pic()
    for i in range(9):
        a = i / 9 * 2 * math.pi + r.uniform(-0.2, 0.2)
        L = r.uniform(40, 120) * g
        p.ink([[0, 0], [L * math.cos(a), L * math.sin(a)]], w=r.uniform(6, 12), color=color, taper=(0.0, 0.8), seed=seed + i)
        p.fill(ell(L * 1.15 * math.cos(a), L * 1.15 * math.sin(a), 7 * g + 1, 7 * g + 1, 8), color)
    p.fill(ell(0, 0, 30 * g + 2, 24 * g + 2, 12), color, jit=3, seed=seed + 20)
    _at(pic, p, x, y, s)


def motion_lines(pic, x, y, s=1.0, n=5, length=120, angle=0.0, seed=0, color=K.INK):
    for i in range(n):
        yy = (i - n / 2) * 26
        a, b = np.array([0, yy]), np.array([length * (0.6 + 0.4 * ((i * 7) % 3) / 2), yy])
        c, sn = math.cos(angle), math.sin(angle)
        R = np.array([[c, -sn], [sn, c]])
        pic.ink([np.array([x, y]) + R @ a * s, np.array([x, y]) + R @ b * s], w=3, color=color, taper=(0.1, 0.7),
                seed=seed + i, alpha=220)
