"""Props for Ek Film, Hazaar Copies: the bioscope box, a spinning film reel, a film can with a date label, the
censor's giant scissors, a film strip, the 'flowers touching' screen gag, a delivery van, a film-leader countdown."""
import math
import numpy as np

from ink.core import Pic, ell, arc, rect, boxy, affine, catmull
from ink import kit
from ink import palette as K


def _at(pic, sub, x, y, s=1.0, rot=0.0):
    pic.add(sub, affine(tx=x, ty=y, sx=s, rot=rot))


def bioscope(pic, x, y, s=1.0, t=0.0, crank=0.0, seed=0):
    """The painted tin peep-show box on legs: brass portholes, a dome, a crank. Returns porthole centres (world)."""
    p = Pic()
    for sx in (-1, 1):                                              # legs
        p.shape(boxy([[sx * 200 - 14, 180], [sx * 200 + 14, 180], [sx * 230 + 14, 520], [sx * 230 - 14, 520]], 14), K.mix(K.GOLD, K.RED, 0.5),
                w=3.2, seed=seed + sx, jit=0.4)
    B = boxy([[-280, -160], [280, -160], [300, 200], [-300, 200]], 20)
    p.shape(B, K.RED, w=4.4, seed=seed + 3, jit=0.8)
    sub = Pic()
    sub.fill([[80, -220], [400, -220], [400, 260], [10, 260]], K.RED_SH, smooth=False)
    for k in range(7):                                              # painted scallops + dots
        cx = -240 + k * 80
        sub.ink(arc(cx, -150, 40, 26, 0, 180, 8), w=3, color=K.GOLD, taper=(0, 0), seed=seed + 10 + k)
        sub.dot((cx, -112), 6, K.CREAM)
    for k in range(9):
        sub.dot((-260 + k * 65, 176), 5, K.GOLD)
    p.clip(B, sub, smooth=False)
    p.outline(B, w=4.4, seed=seed + 4, breaks=3)
    D = arc(0, -160, 240, 150, 180, 360, 18)                        # the dome
    p.shape(np.vstack([D, [[240, -160], [-240, -160]]]), K.GOLD, w=4.0, seed=seed + 5)
    p.fill(arc(0, -160, 240, 150, 250, 360, 10).tolist() + [[240, -160], [60, -160]], K.GOLD_SH, alpha=160)
    kit.sparkle(p, -120, -260, 0.8)
    p.shape(ell(0, -320, 26, 26, 12), K.RED, w=3.0, seed=seed + 6)            # finial
    holes = []
    for k, hx in enumerate((-160, 0, 160)):                          # brass portholes
        p.shape(ell(hx, 20, 58, 58, 22), K.GOLD, w=3.8, seed=seed + 20 + k)
        p.shape(ell(hx, 20, 40, 40, 20), K.INK, w=2.4, seed=seed + 24 + k)
        p.ink(arc(hx, 20, 32, 32, 200, 260, 6), w=3, color=K.CREAM, alpha=180, taper=(0.2, 0.5), seed=seed + 28 + k)
        holes.append((x + hx * s, y + 20 * s))
    a = crank * 2 * math.pi                                          # the crank on the right side
    hub = np.array([300, 40])
    end = hub + 90 * np.array([math.cos(a), math.sin(a)])
    p.ink([hub, end], w=10, color=K.GOLD_SH, taper=(0, 0), seed=seed + 30)
    p.shape(ell(end[0], end[1], 18, 18, 10), K.RED, w=2.6, seed=seed + 31)
    p.shape(ell(hub[0], hub[1], 16, 16, 10), K.GOLD, w=2.6, seed=seed + 32)
    _at(pic, p, x, y, s)
    return holes, (x + end[0] * s, y + end[1] * s)


def reel(pic, x, y, s=1.0, a=0.0, seed=0, film=True):
    """A film reel spinning by angle a: rim, hub, five spokes-holes, the wound film."""
    p = Pic()
    if film:
        p.fill(ell(0, 0, 150, 150, 28), K.INK)
        for k in range(5):
            p.ink(arc(0, 0, 150 - k * 14, 150 - k * 14, 0, 360, 26), w=1.2, color=K.COBALT_L, alpha=90, taper=(0, 0), seed=seed + k)
    p.shape(ell(0, 0, 170, 170, 30), K.mix(K.CREAM, K.COBALT, 0.4), w=4.0, seed=seed + 10)
    p.fill(ell(0, 0, 150, 150, 28), K.INK if film else K.COBALT_D)
    for k in range(5):
        ang = a + k * 2 * math.pi / 5
        cx, cy = 92 * math.cos(ang), 92 * math.sin(ang)
        p.shape(ell(cx, cy, 40, 40, 16), K.mix(K.CREAM, K.COBALT, 0.4), w=2.8, seed=seed + 20 + k)
    p.shape(ell(0, 0, 30, 30, 14), K.GOLD, w=3.0, seed=seed + 30)
    kit.sparkle(p, -110, -110, 0.6)
    _at(pic, p, x, y, s)


def film_can(pic, x, y, s=1.0, seed=0, label=True):
    """A round tin film can; the label area takes the date via Frame.text."""
    p = Pic()
    p.shape(ell(0, 0, 190, 70, 26), K.mix(K.CREAM, K.COBALT, 0.45), w=3.8, seed=seed)
    p.fill(rect(-190, 0, 190, 50, 20), K.mix(K.CREAM, K.COBALT, 0.6))
    p.shape(ell(0, 50, 190, 70, 26), K.mix(K.CREAM, K.COBALT, 0.6), w=3.6, seed=seed + 1)
    p.ink([[-190, 0], [-190, 50]], w=3.6, taper=(0, 0), seed=seed + 2)
    p.ink([[190, 0], [190, 50]], w=3.6, taper=(0, 0), seed=seed + 3)
    if label:
        p.shape(rect(-120, -36, 120, 30, 10), K.CREAM, w=2.8, seed=seed + 4, jit=0.4)
    kit.sparkle(p, -130, -30, 0.5)
    _at(pic, p, x, y, s)


def scissors(pic, x, y, s=1.0, open_amt=0.5, rot=0.0, seed=0):
    """Giant censor scissors: two blades about a pivot; open_amt 0 shut .. 1 wide."""
    p = Pic()
    for k, sgn in enumerate((-1, 1)):
        a = sgn * 0.32 * open_amt
        sub = Pic()
        blade = [[0, 0], [380, -14], [420, 0], [380, 14]]
        sub.shape(blade, K.mix(K.CREAM, K.COBALT, 0.35), w=3.4, seed=seed + k, jit=0.4)
        sub.ink([[20, -2], [360, -8]], w=2.4, color=K.CREAM, alpha=200, taper=(0.1, 0.4), seed=seed + 5 + k)
        sub.shape(ell(-110, 0, 70, 46, 16), K.RED, w=3.4, seed=seed + 10 + k)
        sub.fill(ell(-110, 0, 40, 22, 14), K.CREAM)
        sub.fill(rect(-50, -14, 10, 14, 8), K.RED)
        p.add(sub, affine(rot=a + (0.0 if k == 0 else math.pi * 0), py=0))
    p.shape(ell(0, 0, 14, 14, 10), K.GOLD, w=2.4, seed=seed + 20)
    _at(pic, p, x, y, s, rot)


def film_strip(pic, x0, y, x1, h=120, seed=0, frames_fn=None):
    """A horizontal film strip with sprocket holes; frames_fn(pic, cx, cy, w, h, i) draws each frame's picture."""
    p = Pic()
    p.shape(rect(x0, y - h / 2, x1, y + h / 2, 10), K.INK, w=2.4, seed=seed, jit=0.3)
    k = 0
    xx = x0 + 10
    while xx < x1 - 20:
        p.fill(rect(xx, y - h / 2 + 8, xx + 14, y - h / 2 + 20, 4), K.CREAM_SH)
        p.fill(rect(xx, y + h / 2 - 20, xx + 14, y + h / 2 - 8, 4), K.CREAM_SH)
        xx += 34
    fw = h * 0.9
    cx = x0 + fw * 0.6
    i = 0
    while cx < x1 - fw * 0.5:
        p.fill(rect(cx - fw / 2 + 4, y - h / 2 + 26, cx + fw / 2 - 4, y + h / 2 - 26, 6), K.mix(K.CREAM, K.GOLD, 0.3))
        if frames_fn:
            frames_fn(p, cx, y, fw - 8, h - 52, i)
        cx += fw + 6
        i += 1
    pic.add(p)


def flowers(pic, x, y, s=1.0, t=0.0, touch=1.0, seed=0):
    """The classic cutaway: two flowers swaying in until they touch (touch 0..1)."""
    p = Pic()
    for k, sgn in enumerate((-1, 1)):
        sway = 0.06 * math.sin(t * 3 + k) + sgn * -0.25 * touch
        sub = Pic()
        sub.ink([[0, 0], [10 * sgn, -150], [0, -300]], w=6, color=K.mix(K.GOLD, K.COBALT, 0.4), taper=(0, 0.2), seed=seed + k)
        sub.shape([[0, -170], [40 * sgn, -200], [70 * sgn, -170], [30 * sgn, -150]], K.mix(K.GOLD, K.COBALT, 0.4), w=2.4, seed=seed + 3 + k)
        for j in range(6):
            a = j * math.pi / 3
            sub.shape(ell(30 * math.cos(a), -300 + 30 * math.sin(a), 26, 20, 12, rot=a), K.RED if k == 0 else K.CREAM, w=2.6, seed=seed + 10 + j + k * 10)
        sub.shape(ell(0, -300, 18, 18, 10), K.GOLD, w=2.4, seed=seed + 30 + k)
        p.add(sub, affine(tx=sgn * 110, rot=sway, px=0, py=0))
    if touch > 0.95:
        for j in range(3):
            ph = (t * 0.8 + j / 3) % 1
            p.fill(ell(-40 + j * 40, -380 - ph * 160, 16, 14, 10), K.RED, alpha=int(230 * (1 - ph)))
    _at(pic, p, x, y, s)


def van(pic, x, y, s=1.0, t=0.0, seed=0, flip=False):
    """A tiny 1930s delivery van carrying a film can."""
    p = Pic()
    p.shape(boxy([[-90, -60], [40, -60], [90, -20], [90, 30], [-90, 30]], 10), K.RED, w=3.0, seed=seed, jit=0.4)
    p.fill(rect(46, -50, 78, -24, 6), K.CREAM)
    for wx in (-56, 56):
        p.shape(ell(wx, 34, 18, 18, 10), K.INK, w=2.4, seed=seed + int(wx))
    film_can(p, -30, -78, 0.22, seed=seed + 5, label=False)
    p.ink([[-110, 20], [-150 - 10 * math.sin(t * 9), 26]], w=4, color=K.CREAM_SH, alpha=170, taper=(0.2, 0.8), seed=seed + 7)
    _at(pic, p, x, y, -s if flip else s)


def leader(pic, W, H, t, n=3, seed=0):
    """A film-leader countdown frame: crosshairs, rings, a sweeping wedge, scratches. Digit via kit.digits."""
    p = Pic()
    p.fill(rect(-20, -20, W + 20, H + 20), K.mix(K.CREAM, K.GOLD, 0.3))
    cx, cy = W / 2, H / 2
    a = (t * 1.0) % 1.0 * 2 * math.pi
    pts = [[cx, cy]] + [[cx + 900 * math.cos(-math.pi / 2 + a * q / 24), cy + 900 * math.sin(-math.pi / 2 + a * q / 24)] for q in range(25)]
    p.fill(pts, K.mix(K.CREAM, K.COBALT, 0.4), smooth=False, alpha=200)
    for r_ in (300, 380):
        p.ink(arc(cx, cy, r_, r_, 0, 360, 40), w=5, taper=(0, 0), seed=seed + r_)
    p.ink([[0, cy], [W, cy]], w=4, taper=(0, 0), seed=seed + 1)
    p.ink([[cx, 0], [cx, H]], w=4, taper=(0, 0), seed=seed + 2)
    from ink.core import rng
    r = rng(seed + int(t * 24))
    for i in range(6):                                              # scratches + dust (change every frame on twos)
        x = r.uniform(0, W)
        p.ink([[x, r.uniform(0, H * 0.4)], [x + r.uniform(-8, 8), r.uniform(H * 0.6, H)]], w=1.6, color=K.FINE, alpha=150, taper=(0.1, 0.1), seed=seed + 10 + i)
        p.dot((r.uniform(0, W), r.uniform(0, H)), r.uniform(2, 5), K.INK, alpha=180)
    kit.digits(p, str(n), cx - 90, cy - 160, 320, w=26, seed=seed + 30)
    pic.add(p)
