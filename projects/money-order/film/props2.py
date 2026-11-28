"""Props for the money-order story: the passbook (khata), the money-order form with its receipt-number box, message
slips, rupee notes, the brass idempotency key, a thought bubble. Text goes on via Frame.text."""
import math
import numpy as np

from ink.core import Pic, ell, arc, rect, boxy, affine
from ink import kit
from ink import palette as K


def _at(pic, sub, x, y, s=1.0, rot=0.0):
    pic.add(sub, affine(tx=x, ty=y, sx=s, rot=rot))


def passbook(pic, x, y, s=1.0, seed=0, rot=0.0):
    """An open khata: two pages with ruled rows. Returns row y positions (in world) for text."""
    p = Pic()
    L = boxy([[-380, -260], [0, -280], [0, 280], [-390, 262]], 20)
    R = boxy([[0, -280], [380, -260], [390, 262], [0, 280]], 20)
    p.shape(boxy([[-410, -250], [410, -250], [420, 300], [-420, 300]], 20), K.RED_SH, w=3.4, seed=seed, jit=0.6)
    p.shape(L, K.CREAM, w=3.6, seed=seed + 1, jit=0.6)
    p.shape(R, K.CREAM, w=3.6, seed=seed + 2, jit=0.6)
    p.fill([[120, -280], [380, -260], [390, 262], [60, 280]], K.CREAM_SH, smooth=False, alpha=130)
    for i in range(7):
        yy = -190 + i * 66
        p.ink([[-370, yy], [370, yy]], w=1.4, color=K.RED, alpha=160, taper=(0, 0), seed=seed + 10 + i)
    p.ink([[150, -270], [154, 270]], w=1.4, color=K.RED, alpha=160, taper=(0, 0), seed=seed + 20)
    p.ink([[0, -280], [2, 280]], w=4, taper=(0.03, 0.03), seed=seed + 21)
    _at(pic, p, x, y, s, rot)
    return [y + (-190 + i * 66 - 30) * s for i in range(7)]


def mo_form(pic, x, y, s=1.0, seed=0, rot=0.0):
    """The money-order form: red header band, fields, and the receipt-number box (top right)."""
    p = Pic()
    F = rect(-300, -200, 300, 200, 16)
    p.shape(F, K.mix(K.CREAM, K.RED, 0.08), w=3.6, seed=seed, jit=0.6)
    p.fill(rect(-300, -200, 300, -130, 16), K.RED)
    for i in range(3):
        yy = -70 + i * 70
        p.ink([[-260, yy], [120, yy]], w=1.6, color=K.FINE, alpha=190, taper=(0, 0), seed=seed + 10 + i)
    p.shape(rect(150, -100, 280, -20, 10), K.CREAM, w=3.2, seed=seed + 20, jit=0.4)       # receipt-number box
    p.fill(ell(230, 130, 50, 50, 18), K.RED, alpha=60)
    p.ink(np.vstack([ell(230, 130, 50, 50, 18), ell(230, 130, 50, 50, 18)[:1]]), w=3, color=K.RED, taper=(0, 0), smooth=False,
          seed=seed + 21, alpha=180)
    _at(pic, p, x, y, s, rot)
    return (x + 215 * s, y - 60 * s)                                                     # box centre (world, rot ignored)


def slip(pic, x, y, s=1.0, seed=0, rot=0.0):
    """A telegram message slip."""
    p = Pic()
    p.shape(rect(-170, -70, 170, 70, 12), K.mix(K.CREAM, K.GOLD, 0.15), w=3.0, seed=seed, jit=0.5)
    p.fill(rect(-170, -70, 170, -40, 12), K.COBALT)
    for i in range(2):
        p.ink([[-140, -10 + i * 34], [100 - i * 40, -10 + i * 34]], w=1.6, color=K.FINE, alpha=190, taper=(0, 0), seed=seed + 1 + i)
    _at(pic, p, x, y, s, rot)


def notes(pic, x, y, s=1.0, n=3, seed=0, rot=0.0):
    p = Pic()
    for k in range(n):
        p.shape(rect(-110 + k * 10, -50 - k * 8, 110 + k * 10, 50 - k * 8, 10), K.mix(K.GOLD, K.CREAM, 0.45), w=2.6, seed=seed + k, jit=0.4)
        p.shape(ell(k * 10, -k * 8, 28, 28, 14), K.mix(K.GOLD, K.CREAM, 0.2), w=1.8, seed=seed + 10 + k)
    kit.digits(p, "50", -96 + (n - 1) * 10, -40 - (n - 1) * 8, 30, w=3.5, seed=seed + 20)
    _at(pic, p, x, y, s, rot)


def brass_key(pic, x, y, s=1.0, rot=0.0, seed=0, tag=True, flip=1.0):
    """The idempotency key: a big brass key with a hanging tag (tag text via Frame.text)."""
    p = Pic()
    p.shape(ell(-170, 0, 90, 90, 22), K.GOLD, w=4.2, seed=seed)
    p.fill(ell(-170, 0, 40, 40, 16), K.CREAM_SH)
    p.ink(np.vstack([ell(-170, 0, 40, 40, 16), ell(-170, 0, 40, 40, 16)[:1]]), w=3, taper=(0, 0), smooth=False, seed=seed + 1)
    p.shape(rect(-90, -22, 230, 22, 10), K.GOLD, w=3.8, seed=seed + 2, jit=0.4)
    p.shape(boxy([[150, 22], [190, 22], [190, 90], [170, 90], [170, 60], [150, 60]], 8), K.GOLD, w=3.2, seed=seed + 3, jit=0.3)
    p.shape(boxy([[200, 22], [230, 22], [230, 70], [200, 70]], 8), K.GOLD, w=3.0, seed=seed + 4, jit=0.3)
    p.fill([[-40, -22], [230, -22], [230, 0], [-40, 0]], K.GOLD_LI, smooth=False, alpha=140)
    kit.sparkle(p, -200, -40, 0.9)
    if tag:
        p.ink([[-170, 90], [-150, 160]], w=2.4, color=K.FINE, taper=(0, 0), seed=seed + 5)
        T = boxy([[-230, 160], [-70, 150], [-60, 240], [-220, 254]], 10)
        tg = Pic()
        tg.shape(T, K.CREAM, w=3.2, seed=seed + 6, jit=0.5)
        p.add(tg, affine(sx=flip, sy=1, px=-145, py=200) if flip < 1 else np.eye(3))
    _at(pic, p, x, y, s, rot)


def bubble(pic, x, y, s=1.0, seed=0):
    """A thought cloud with three trailing puffs (contents drawn by the caller)."""
    p = Pic()
    C = [[-230, 0], [-200, -110], [-80, -170], [60, -160], [190, -100], [230, 10], [170, 110], [20, 150], [-150, 120]]
    p.shape(C, K.CREAM, w=3.6, seed=seed, jit=4.0)
    for k, (dx, dy, r) in enumerate(((-150, 190, 30), (-190, 250, 20), (-216, 296, 12))):
        p.shape(ell(dx, dy, r, r * 0.8, 12), K.CREAM, w=2.8, seed=seed + 1 + k)
    _at(pic, p, x, y, s)


def potli(pic, x, y, s=1.0, full=1.0, seed=0):
    """Hariram's cloth money pouch; deflates with `full`."""
    p = Pic()
    w = 110 * (0.6 + 0.4 * full)
    B = [[-w, 40], [-w * 0.9, -60 * full - 10], [-30, -110 * full - 20], [30, -110 * full - 20], [w * 0.9, -60 * full - 10], [w, 40],
         [0, 70]]
    p.shape(B, K.RED, w=3.6, seed=seed, jit=1.2)
    p.fill([[10, -140], [w + 20, -140], [w + 20, 80], [0, 80]], K.RED_SH, smooth=False, alpha=150)
    p.ink([[-36, -110 * full - 20], [0, -110 * full - 40], [36, -110 * full - 20]], w=4, color=K.GOLD, taper=(0, 0), seed=seed + 1)
    _at(pic, p, x, y, s)
