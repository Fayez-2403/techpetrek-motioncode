"""CHHOTU, the dulha. Tall and thin (the joke is the name). An oversized red safa with a gold brooch and a plume,
a long hooked nose, a pencil moustache, an Adam's apple, a gold kurta, cream churidar, red mojaris.
Expressions: neutral, blink, joy, shock, anger, asleep. Neck base at (0, 0), y down."""
import numpy as np

from ink.core import Pic, ell, arc, catmull
from ink import kit, face
from ink.figure import diag_shade, tube
from ink import palette as K

SEED = 5200


def _safa(p, seed, front=True):
    """The turban: big wrapped folds, a hard shade side, a gold brooch with a glint and a plume."""
    if not front:
        T = [[-232, -400], [-262, -470], [-250, -560], [-200, -640], [-110, -690], [0, -704], [110, -690],
             [200, -640], [250, -560], [262, -470], [232, -400], [120, -372], [0, -366], [-120, -372]]
        F = p.fill(T, K.RED, jit=2.0, seed=seed)
        sub = Pic()
        sub.fill([[60, -760], [400, -760], [400, -300], [150, -300]], K.RED_SH, smooth=False)
        for i in range(5):                                       # wrapped folds, diagonal
            y = -400 - i * 62
            sub.ink([[-280, y + 50], [-120, y - 6], [60, y - 30], [280, y - 70]], w=3.0, taper=(0.05, 0.2),
                    seed=seed + 10 + i)
            sub.ink([[-260, y + 30], [-100, y - 20], [80, y - 44]], w=1.6, color=K.FINE, alpha=200,
                    taper=(0.2, 0.4), seed=seed + 20 + i)
        kit.dash_rows(sub, [[-200, -470], [0, -520], [200, -560]], rows=1, gap=0, dash=7, step=22, w=1.6,
                      seed=seed + 30, color=K.GOLD, alpha=230)
        p.clip(F, sub, smooth=False)
        p.outline(F, w=4.4, seed=seed + 1, breaks=4)
        # the tail of the cloth falling behind the right shoulder
        tail = [[206, -420], [250, -390], [270, -260], [262, -110], [236, -116], [236, -250], [206, -380]]
        p.shape(tail, K.RED_SH, w=3.6, seed=seed + 40)
        return
    # brooch + plume (drawn in front)
    B = ell(-30, -548, 30, 36, 14)
    p.shape(B, K.GOLD, w=3.2, seed=seed + 50)
    p.fill(ell(-30, -548, 14, 17, 12), K.RED)
    kit.sparkle(p, -40, -560, 0.6)
    for i in range(3):
        a = [-34 + i * 6, -584]
        p.ink([a, [-60 + i * 16, -660], [-40 + i * 34, -760], [10 + i * 30, -800]], w=5.0 - i, taper=(0.1, 0.7),
              color=K.CREAM if i else K.GOLD_LI, seed=seed + 60 + i, pressure=0.2)
    P = [[-36, -590], [-80, -680], [-60, -780], [-10, -830], [6, -800], [-24, -720], [-14, -640]]
    p.fill(P, K.CREAM, seed=seed + 70)
    kit.dash_rows(p, [[-40, -600], [-50, -700], [-20, -800]], rows=1, gap=0, dash=12, step=16, w=1.6, seed=seed + 71,
                  color=K.FINE, alpha=200, tilt=0.1)


def head(expr="neutral", look=(0.0, 0.0), seed=SEED) -> Pic:
    p = Pic()
    jaw = {"shock": 46, "anger": 6, "joy": 4}.get(expr, 0)
    L = [[0, -470], [-110, -462], [-160, -420], [-170, -340], [-164, -262], [-150, -190], [-120, -110], [-70, -40],
         [-26, -6], [0, 0]]
    sk = face.jawdrop(face.sym(L), jaw, -190)
    _safa(p, seed, front=False)
    for sx in (-1, 1):
        E = ell(sx * 164, -290, 34, 52, 14)
        p.shape(E, K.SKIN if sx < 0 else K.SKIN_SH, w=3.4, seed=seed + 100 + sx)
    face.face_base(p, sk, seed + 110, shade=((50, -520), (130, 40)),
                   lights=[ell(-92, -230, 34, 24, 12), ell(-40, -60, 30, 14, 10)],
                   shades=[ell(0, -400, 150, 40, 16)])                    # the safa throws shade on the brow
    kit.ticks(p, 0, -70 + jaw, 90, 40, n=40, length=7, angle=95, spread=25, seed=seed + 120, alpha=200)
    kit.pores(p, -86, -210, 30, 26, n=10, seed=seed + 121)
    for sx in (-1, 1):
        p.ink([[sx * 44, -220], [sx * 70, -160], [sx * 76, -120 + jaw * 0.5]], w=2.4, taper=(0.15, 0.5),
              seed=seed + 130 + sx)                                    # nose-to-mouth folds
    face.eyes(p, [-52, 52], -318, 0.86, expr, look, seed + 140, bags=1)
    face.brows(p, [-56, 56], -362, 0.95, expr, seed + 150, thick=0.6)
    # the long hooked nose: bridge high, tip hanging down over the moustache
    N = [[-16, -352], [-22, -290], [-38, -228], [-62, -180], [-58, -140], [-30, -112], [-4, -104], [26, -116],
         [52, -150], [44, -200], [26, -270], [16, -352]]
    face.nose(p, N, seed + 160, nostrils=(22, -128, 8), tip=(-24, -150, 18), split_x=4)
    my = -66 + jaw * 0.55
    kind = {"neutral": "flat", "blink": "flat", "joy": "grin", "anger": "snarl", "shock": "shock",
            "asleep": "flat"}[expr]
    kit.mouth(p, 0, my, 0.8, kind, seed=seed + 170, wide=1.15 if kind == "grin" else 1.0)
    # pencil moustache
    for sx in (-1, 1):
        p.fill([[sx * 6, -96], [sx * 56, -90], [sx * 72, -80], [sx * 52, -84], [sx * 6, -88]], K.INK,
               seed=seed + 180 + sx)
    _safa(p, seed, front=True)
    if expr == "asleep":
        p.ink([[150, -460], [182, -460], [150, -430], [182, -430]], w=3.0, smooth=False, seed=seed + 190)
    return p


def _torso(**kw):
    p = Pic()
    # neck with an Adam's apple (visible above the band collar)
    Nk = [[-56, -880], [-50, -800], [50, -800], [56, -880]]
    p.shape(Nk, K.SKIN, w=3.6, seed=SEED + 300)
    p.ink(arc(4, -846, 12, 10, 200, 340, 7), w=2.2, seed=SEED + 301)
    # the long gold kurta, to the knee
    T = [[-170, -790], [-190, -620], [-176, -360], [-196, -60], [-210, 160], [0, 176], [210, 160], [196, -60],
         [176, -360], [190, -620], [170, -790], [60, -812], [-60, -812]]
    F = p.fill(T, K.GOLD, jit=1.5, seed=SEED + 310)
    sub = Pic()
    sub.fill([[30, -900], [400, -900], [400, 260], [110, 260]], K.GOLD_SH, smooth=False)
    kit.dash_rows(sub, [[-210, 120], [0, 140], [210, 120]], rows=2, gap=12, dash=8, step=18, w=1.6, seed=SEED + 311,
                  color=K.RED, alpha=230, tilt=0.0)                       # embroidered hem
    p.clip(F, sub, smooth=False)
    p.outline(F, w=4.2, seed=SEED + 312, breaks=4)
    C = [[-66, -820], [66, -820], [62, -780], [-62, -780]]                  # band collar
    p.shape(C, K.GOLD_SH, w=3.2, seed=SEED + 313)
    p.ink([[0, -780], [0, -420]], w=2.4, taper=(0.05, 0.3), seed=SEED + 314)
    for i in range(5):
        p.dot((14, -740 + i * 66), 6, K.CREAM)
        p.ink(ell(14, -740 + i * 66, 7, 7, 10), w=1.2, color=K.FINE, closed=True, smooth=False, taper=(0, 0),
              seed=SEED + 320 + i)
    for i, (a, b) in enumerate((((-120, -200), (-150, 120)), ((120, -240), (150, 110)), ((-40, -100), (-60, 140)))):
        p.ink([a, ((a[0] + b[0]) / 2 + 10, (a[1] + b[1]) / 2), b], w=2.2, color=K.FINE, alpha=210, taper=(0.2, 0.4),
              seed=SEED + 330 + i)
    return p


def _legs(**kw):
    p = Pic()
    for sx in (-1, 1):
        x = sx * 72
        Lg = [[x - 58, 120], [x - 50, 500], [x - 44, 700], [x + 40, 700], [x + 50, 500], [x + 56, 120]]
        F = p.fill(Lg, K.CREAM, jit=1.2, seed=SEED + 400 + sx)
        if sx > 0:
            diag_shade(p, F, K.CREAM_SH, (x - 10, 100), (x + 30, 720))
        p.outline(F, w=3.8, seed=SEED + 401 + sx, breaks=2)
        for k in range(6):                                                 # churidar gathers at the ankle
            y = 560 + k * 22
            p.ink(arc(x, y, 46, 8, 20, 160, 7), w=1.8, color=K.FINE, alpha=220, seed=SEED + 410 + k + sx * 10)
        Sh = [[x - 56, 700], [x - 60, 742], [x + 40, 750], [x + 110, 730], [x + 150, 700], [x + 120, 712], [x + 40, 698]]
        if sx < 0:
            Sh = [[-q[0] + 2 * x, q[1]] for q in Sh]
        p.shape(Sh, K.RED, w=3.4, seed=SEED + 420 + sx)
        kit.dash_rows(p, [[x - 40, 712], [x + 20, 708]], rows=1, gap=0, dash=6, step=14, w=1.6, seed=SEED + 430 + sx,
                      color=K.GOLD)
    return p


def _head_part(**kw):
    return head(kw.get("expr", "neutral"), kw.get("look", (0, 0)))


def rig():
    return face.humanoid(SEED + 600, _torso, _legs, _head_part, hips_y=-720, shoulder=(170, -770),
                         head_pivot=(0, -860),
                         arm_kw=dict(upper=(330, 96, 82), fore=(300, 82, 64), sleeve=K.GOLD, cuff=K.GOLD_SH,
                                     hand_scale=0.82, hand_pose="hold"))


FORE_L = 300
NEUTRAL = {"armL": 0.12, "armR": -0.12, "foreL": -0.05, "foreR": 0.05}


def figure(expr="neutral", angles=None, look=(0, 0), hands=None) -> Pic:
    """hands = {"L": (x, y), "R": (x, y)} wrist targets in character space (two-bone IK)."""
    from ink.figure import reach
    a = dict(NEUTRAL)
    a.update(angles or {})
    r = rig()
    for side, tgt in (hands or {}).items():
        a = reach(r, dict(a, L2=FORE_L), side, tgt, bend=(1 if side == "L" else -1))
    return r.pose(a, expr=expr, look=look)
