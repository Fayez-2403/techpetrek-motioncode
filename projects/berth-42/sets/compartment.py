"""SET A: the night compartment, berth 42. Lamp light from the upper left: lit surfaces salmon/pink, shadow cobalt,
a pale moon with a halo in the barred window, telegraph poles streaming past (the background life).
Layers (back -> front) in frame space 1080 x 1920; t (s) drives the life. Pure function of t."""
import math
import numpy as np

from ink.core import Pic, ell, arc, rng, boxy, rect
from ink import kit
from ink import palette as K

WOOD = K.mix(K.GOLD, K.RED, 0.45)
WOOD_SH = K.mix(WOOD, K.COBALT, 0.55)
WOOD_LI = K.mix(WOOD, K.SKIN_LI, 0.35)
NIGHT = K.mix(K.COBALT, K.INK, 0.45)
LIT = K.mix(K.SKIN, K.CREAM, 0.2)              # lamp-lit wall (pink/salmon)
LIT2 = K.mix(K.SKIN, K.COBALT, 0.25)
W, H = 1080, 1920
WIN = (190, 230, 890, 760)                    # window box


def sky(t=0.0) -> Pic:
    """Seen through the window: night sky, moon + halo, stars, hills, telegraph poles + sagging wires."""
    p = Pic()
    x0, y0, x1, y1 = WIN
    p.fill([[x0 - 40, y0 - 40], [x1 + 40, y0 - 40], [x1 + 40, y1 + 40], [x0 - 40, y1 + 40]], NIGHT, smooth=False)
    r = rng(42)
    for i in range(40):
        p.dot((r.uniform(x0, x1), r.uniform(y0, y0 + 300)), r.uniform(1.0, 2.2), K.CREAM, alpha=int(r.uniform(120, 230)))
    kit.moon(p, 730, 360, 54)
    hills = [[x0 - 40, 650], [300, 600], [420, 630], [560, 580], [700, 620], [820, 590], [x1 + 40, 610], [x1 + 40, y1 + 40],
             [x0 - 40, y1 + 40]]
    p.fill(hills, K.mix(K.COBALT, K.INK, 0.25), seed=7, jit=3)
    # telegraph poles streaming right -> left (parallax life), spacing 520 px, speed 900 px/s
    off = (t * 900) % 520
    for k in range(-1, 4):
        x = x1 + 200 - off - k * 520 + 260
        p.fill([[x - 7, 380], [x + 7, 380], [x + 9, y1 + 40], [x - 9, y1 + 40]], K.INK, smooth=False)
        p.fill([[x - 60, 410], [x + 60, 410], [x + 60, 420], [x - 60, 420]], K.INK, smooth=False)
        for sx in (-50, 50):
            p.dot((x + sx, 404), 5, K.CREAM_SH)
    for yy in (412, 440):
        pts = []
        for k in range(-1, 5):
            x = x1 + 200 - off - k * 520 + 260
            pts.append([x, yy])
        pts = pts[::-1]
        for a, b in zip(pts[:-1], pts[1:]):
            mid = [(a[0] + b[0]) / 2, yy + 34]
            p.ink([a, mid, b], w=1.6, color=K.INK, taper=(0, 0), pressure=0.1, seed=int(a[0]))
    return p


def wall(t=0.0) -> Pic:
    p = Pic()
    p.fill([[0, 0], [W, 0], [W, H], [0, H]], K.COBALT, smooth=False)
    # the lamp's lit diagonal (two flat tones split by a hard edge)
    p.fill([[0, 0], [760, 0], [W, 560], [W, 1500], [0, 1900]], LIT2, smooth=False)
    p.fill([[0, 0], [520, 0], [880, 760], [330, 1720], [0, 1720]], LIT, smooth=False)
    # wood panelling: seams + grain ticks over the whole wall
    for i, x in enumerate(range(90, W, 180)):
        p.ink([[x, 0], [x + 2, H]], w=2.2, color=K.FINE, alpha=200, taper=(0, 0), pressure=0.2, seed=300 + i)
    kit.wood(p, 0, 0, W, 1720, plank=180, seed=11, horizontal=False)
    # window frame + bars
    x0, y0, x1, y1 = WIN
    Fr = [[x0 - 46, y0 - 46], [x1 + 46, y0 - 46], [x1 + 46, y1 + 46], [x0 - 46, y1 + 46]]
    p.fill(Fr, WOOD, smooth=False)
    p.fill([[x1 - 200, y0 - 46], [x1 + 46, y0 - 46], [x1 + 46, y1 + 46], [x1 - 520, y1 + 46]], WOOD_SH, smooth=False,
           alpha=200)
    p.outline(np.array(Fr, float), w=4.0, seed=31, breaks=4)
    return p


def window_hole() -> np.ndarray:
    x0, y0, x1, y1 = WIN
    return np.array([[x0, y0 + 40], [x0 + 40, y0], [x1 - 40, y0], [x1, y0 + 40], [x1, y1], [x0, y1]], float)


def window_front(t=0.0) -> Pic:
    p = Pic()
    x0, y0, x1, y1 = WIN
    p.outline(window_hole(), w=4.4, seed=33, breaks=3)
    for i, y in enumerate((y0 + 150, y0 + 300, y0 + 450)):
        p.fill([[x0, y - 7], [x1, y - 7], [x1, y + 7], [x0, y + 7]], K.mix(K.INK, K.COBALT, 0.3), smooth=False)
        p.ink([[x0, y - 3], [x1, y - 3]], w=1.6, color=K.COBALT_L, alpha=180, taper=(0.1, 0.1), seed=40 + i)
    kit.sparkle(p, x0 + 130, y0 + 147, 0.45)
    return p


def berths(t=0.0) -> Pic:
    p = Pic()
    # upper berth plank + cushion, with the chain
    UB = rect(-20, 880, W + 20, 960)
    p.shape(UB, WOOD, w=4.0, seed=51, jit=1.5)
    p.fill([[-20, 920], [W + 20, 920], [W + 20, 960], [-20, 960]], WOOD_SH, smooth=False, alpha=220)
    UC = rect(-20, 822, W + 20, 884)
    p.shape(UC, K.RED_SH, w=3.6, seed=52, jit=1.5)
    for i in range(12):
        p.dot((40 + i * 92, 852), 6, K.mix(K.RED_SH, K.INK, 0.4))
    for i in range(14):
        a = np.array([1000, 300 + i * 40])
        p.ink(ell(a[0], a[1], 9, 16, 10), w=2.4, closed=True, taper=(0, 0), seed=60 + i, smooth=False)
    # luggage on the upper berth: a tin trunk and the sehra box
    T = boxy([[80, 690], [420, 690], [430, 822], [70, 822]])
    p.shape(T, K.COBALT_D, w=4.0, seed=70)
    p.fill([[80, 690], [420, 690], [424, 712], [76, 712]], K.mix(K.COBALT_D, K.CREAM, 0.25), smooth=False)
    p.shape(rect(222, 742, 278, 790, 10), K.GOLD, w=2.6, seed=71, jit=0.6)
    kit.sparkle(p, 236, 752, 0.4)
    S = boxy([[640, 730], [860, 730], [870, 822], [630, 822]])
    p.shape(S, K.GOLD, w=3.6, seed=72)
    kit.dash_rows(p, [[640, 760], [860, 760]], rows=2, gap=24, dash=8, step=18, w=1.8, color=K.RED, seed=73, tilt=0)
    # the lower berth: red leather, buttoned, and the brass 42 plate above it
    LB = rect(-20, 1470, W + 20, 1580)
    p.shape(LB, K.RED, w=4.2, seed=80, jit=1.5)
    p.fill([[560, 1470], [W + 20, 1470], [W + 20, 1580], [440, 1580]], K.RED_SH, smooth=False, alpha=230)
    BK = rect(-20, 1200, W + 20, 1472)
    p.shape(BK, K.mix(K.RED, K.SKIN, 0.15), w=4.0, seed=81, jit=1.5)
    p.fill([[640, 1200], [W + 20, 1200], [W + 20, 1472], [500, 1472]], K.RED_SH, smooth=False, alpha=220)
    for r_ in range(3):
        for i in range(9):
            x, y = 60 + i * 120 + (r_ % 2) * 60, 1260 + r_ * 76
            p.dot((x, y), 5, K.mix(K.RED_SH, K.INK, 0.45))
            for a in (0, 1.57, 3.14, 4.71):
                p.ink([[x + 8 * math.cos(a), y + 8 * math.sin(a)], [x + 22 * math.cos(a), y + 22 * math.sin(a)]],
                      w=1.4, color=K.FINE, alpha=170, taper=(0.2, 0.6), seed=int(x + y + a))
    PL = rect(440, 1060, 640, 1150, 12)
    p.shape(PL, K.GOLD, w=3.4, seed=90, jit=1.0)
    p.fill([[560, 1060], [640, 1060], [640, 1150], [520, 1150]], K.GOLD_SH, smooth=False, alpha=200)
    for xx in (456, 624):
        p.dot((xx, 1076), 5, K.GOLD_SH)
    kit.digits(p, "42", 486, 1072, 64, w=8, seed=91)
    kit.sparkle(p, 470, 1086, 0.5)
    # floor
    p.fill([[-20, 1580], [W + 20, 1580], [W + 20, H], [-20, H]], WOOD_SH, smooth=False)
    p.fill([[-20, 1580], [640, 1580], [240, H], [-20, H]], K.mix(WOOD, K.SKIN, 0.2), smooth=False, alpha=220)
    p.ink([[-20, 1582], [W + 20, 1582]], w=4.0, taper=(0, 0), seed=96)
    kit.wood(p, 0, 1580, W, H, plank=60, seed=95)
    # a surahi (water pot) and a folded newspaper on the floor: every noun a drawing
    Sr = [[880, 1700], [850, 1640], [870, 1600], [900, 1590], [930, 1600], [950, 1640], [920, 1700]]
    p.shape(Sr, K.mix(K.RED, K.GOLD, 0.4), w=3.4, seed=97)
    p.fill([[905, 1600], [950, 1640], [920, 1700], [905, 1700]], K.RED_SH, smooth=False, alpha=160)
    N = boxy([[120, 1690], [330, 1670], [350, 1740], [140, 1762]])
    p.shape(N, K.CREAM, w=3.2, seed=98, jit=0.8)
    for i in range(5):
        p.ink([[150, 1700 + i * 11], [320, 1684 + i * 11]], w=1.4, color=K.FINE, alpha=180, taper=(0.1, 0.2), seed=99 + i)
    return p


def lamp(t=0.0) -> Pic:
    """A hurricane lamp on a bracket, upper left: its glow, flame flicker and one sparkle."""
    p = Pic()
    x, y = 120, 1010
    fl = 1 + 0.06 * math.sin(t * 13.0) + 0.04 * math.sin(t * 7.3 + 1)
    for k, al in ((4.0, 40), (2.6, 60), (1.6, 90)):
        p.fill(ell(x, y, 70 * k * fl, 70 * k * fl, 24), K.mix(K.SKIN_LI, K.CREAM, 0.5), alpha=al)
    p.fill(rect(x - 80, y - 150, x + 20, y - 136, 8), K.INK)
    G = [[x - 50, y - 90], [x + 50, y - 90], [x + 62, y], [x + 46, y + 70], [x - 46, y + 70], [x - 62, y]]
    p.fill(G, K.mix(K.CREAM, K.GOLD, 0.25), alpha=230)
    p.fill(ell(x, y + 6, 18 * fl, 34 * fl, 14), K.GOLD_LI)
    p.fill(ell(x, y + 14, 9, 18, 10), K.CREAM)
    p.outline(np.array(G, float), w=3.6, seed=101, breaks=2)
    p.shape(boxy([[x - 70, y + 70], [x + 70, y + 70], [x + 60, y + 110], [x - 60, y + 110]], 10), K.GOLD_SH, w=3.4, seed=102, jit=0.6)
    p.shape(boxy([[x - 56, y - 120], [x + 56, y - 120], [x + 50, y - 88], [x - 50, y - 88]], 10), K.GOLD_SH, w=3.0, seed=103, jit=0.6)
    kit.sparkle(p, x + 34, y - 40, 0.8)
    return p


def build(t=0.0) -> Pic:
    """The whole set as one Pic (for stills; shots use the layers with their own parallax)."""
    p = Pic()
    p.add(wall(t))
    p.clip(window_hole(), sky(t), smooth=False)
    p.add(window_front(t))
    p.add(berths(t))
    p.add(lamp(t))
    return p
