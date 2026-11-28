"""SHAMU, clerk 2. Lanky and stooped. A huge lumpy jaw with an underbite, a unibrow, centre-parted slick hair, big
ears, a cream shirt, a plaid waistcoat, a red bow tie. Expressions: neutral, blink, smug, anger, shock."""
import numpy as np

from ink.core import Pic, ell, arc
from ink import kit, face
from ink.figure import diag_shade
from ink import palette as K

SEED = 7400


def head(expr="neutral", look=(0.0, 0.0), seed=SEED) -> Pic:
    p = Pic()
    jaw = {"shock": 50, "anger": 8}.get(expr, 0)
    L = [[0, -502], [-84, -496], [-124, -458], [-132, -392], [-134, -320], [-150, -250], [-166, -160], [-170, -50],
         [-160, 20], [-120, 56], [-50, 66], [0, 66]]                      # a long lantern jaw, squared chin
    sk = face.jawdrop(face.sym(L, lower_shift=6), jaw, -240)
    for sx in (-1, 1):                                                   # big flappy ears
        p.shape(ell(sx * 140, -350, 40, 66, 14), K.SKIN if sx < 0 else K.SKIN_SH, w=3.4, seed=seed + sx)
        p.ink(arc(sx * 144, -350, 20, 40, 100 if sx < 0 else -80, 260 if sx < 0 else 80, 8), w=1.8, color=K.FINE,
              alpha=210, seed=seed + 3 + sx)
    face.face_base(p, sk, seed + 10, shade=((40, -560), (210, 40)),
                   lights=[ell(-120, -150, 30, 60, 12), ell(-60, -456, 40, 16, 10)],
                   shades=[ell(0, -390, 120, 24, 12)])
    kit.ticks(p, 0, -40 + jaw, 150, 90, n=140, length=8, angle=95, spread=30, seed=seed + 11, alpha=225)
    kit.pores(p, -160, -170, 40, 40, n=14, seed=seed + 12)
    p.ink([[-12, 50 + jaw], [0, 22 + jaw], [12, 50 + jaw]], w=2.0, color=K.FINE, alpha=210, seed=seed + 13)  # chin cleft
    for sx in (-1, 1):
        p.ink([[sx * 34, -290], [sx * 80, -210], [sx * 96, -120 + jaw * 0.5]], w=2.4, taper=(0.15, 0.5),
              seed=seed + 14 + sx)
    # slick centre-parted hair
    for sx in (-1, 1):
        Hh = [[sx * 4, -508], [sx * 70, -502], [sx * 122, -466], [sx * 136, -396], [sx * 116, -428], [sx * 60, -462],
              [sx * 4, -472]]
        p.fill(Hh, K.INK, jit=1.0, seed=seed + 20 + sx)
        for i in range(3):
            p.ink([[sx * (20 + i * 26), -510 + i * 4], [sx * (60 + i * 26), -470 + i * 8]], w=1.6, color=K.COBALT_L,
                  alpha=170, taper=(0.3, 0.5), seed=seed + 23 + i + sx * 5)
    ex = expr
    face.eyes(p, [-46, 46], -366, 0.78, ex, look, seed + 30, bags=2)
    # the unibrow: one bar across, barbed
    lift = {"shock": -22, "anger": 8, "smug": -6}.get(expr, 0)
    dip = 16 if expr == "anger" else 0
    U = [[-106, -398 + lift], [-50, -420 + lift], [0, -410 + lift + dip], [50, -420 + lift], [106, -398 + lift],
         [98, -380 + lift], [50, -394 + lift], [0, -384 + lift + dip], [-50, -394 + lift], [-98, -380 + lift]]
    kit.barbed(p, U, seed=seed + 40, barbs=12, length=6, side=1)
    face.nose(p, [[-12, -380], [-16, -320], [-30, -274], [-14, -258], [0, -262], [14, -258], [30, -274], [16, -320],
                  [12, -380]], seed + 50, nostrils=(14, -268, 5), tip=(-10, -276, 10), split_x=4)
    my = -150 + jaw * 0.6
    if expr in ("neutral", "blink", "smug"):
        # underbite: the lower teeth stand over the top lip
        kit.mouth(p, 0, my, 0.9, "flat", seed=seed + 60)
        teeth_y = my + 2
        kit.teeth_row(p, -40, 40, teeth_y, 16, 5, seed=seed + 61, down=False)
        if expr == "smug":
            for sx in (-1, 1):
                p.ink([[sx * 62, my + 2], [sx * 84, my - 14]], w=2.6, taper=(0.2, 0.6), seed=seed + 62 + sx)
    else:
        kit.mouth(p, 0, my, 0.95, {"anger": "snarl", "shock": "shock"}[expr], seed=seed + 60)
    return p


def _torso(**kw):
    p = Pic()
    T = [[-150, 0], [-156, -200], [-170, -420], [-196, -500], [-100, -540], [0, -546], [100, -540], [196, -500],
         [170, -420], [156, -200], [150, 0]]
    F = p.fill(T, K.CREAM, jit=1.3, seed=SEED + 300)
    p.outline(F, w=4.0, seed=SEED + 301, breaks=3)
    # plaid waistcoat
    W = [[-150, 0], [-156, -200], [-164, -420], [-110, -500], [-40, -380], [0, -300], [40, -380], [110, -500],
         [164, -420], [156, -200], [150, 0], [0, 20]]
    WF = p.fill(W, K.COBALT, jit=1.3, seed=SEED + 310)
    sub = Pic()
    kit.plaid(sub, -200, -560, 200, 40, K.COBALT, K.RED, K.CREAM, every=44)
    sub.fill([[30, -620], [400, -620], [400, 60], [120, 60]], K.COBALT_D, smooth=False, alpha=130)
    p.clip(WF, sub, smooth=False)
    p.outline(WF, w=4.0, seed=SEED + 311, breaks=3)
    for i in range(4):
        p.dot((0, -260 + i * 60), 7, K.GOLD)
    # red bow tie at the collar
    p.shape([[-56, -540], [0, -520], [56, -540], [56, -490], [0, -510], [-56, -490]], K.RED, w=3.0, seed=SEED + 320)
    p.shape(ell(0, -515, 14, 16, 10), K.RED_SH, w=2.4, seed=SEED + 321)
    return p


def _legs(**kw):
    p = Pic()
    for sx in (-1, 1):
        x = sx * 70
        Lg = [[x - 70, 0], [x - 62, 380], [x - 56, 700], [x + 56, 700], [x + 62, 380], [x + 70, 0]]
        F = p.fill(Lg, K.CREAM_SH, jit=1.2, seed=SEED + 400 + sx)
        if sx > 0:
            diag_shade(p, F, K.mix(K.CREAM_SH, K.COBALT, 0.3), (x - 10, -10), (x + 20, 720))
        p.outline(F, w=3.6, seed=SEED + 401 + sx, breaks=2)
        Sh = [[x - 60, 696], [x - 66, 734], [x + 80, 740], [x + 120, 716], [x + 70, 690]]
        if sx < 0:
            Sh = [[-q[0] + 2 * x, q[1]] for q in Sh]
        p.shape(Sh, K.INK, w=3.0, seed=SEED + 410 + sx)
    return p


def _head_part(**kw):
    return head(kw.get("expr", "neutral"), kw.get("look", (0, 0)))


def rig():
    return face.humanoid(SEED + 600, _torso, _legs, _head_part, hips_y=-740, shoulder=(184, -490),
                         head_pivot=(18, -540),
                         arm_kw=dict(upper=(320, 84, 74), fore=(300, 74, 60), sleeve=K.CREAM, cuff=K.CREAM_SH,
                                     hand_scale=0.78, hand_pose="hold"))


FORE_L = 300
NEUTRAL = {"armL": 0.1, "armR": -0.1, "foreL": -0.04, "foreR": 0.04, "head": 0.08}


def figure(expr="neutral", angles=None, look=(0, 0), hands=None) -> Pic:
    """hands = {"L": (x, y), "R": (x, y)} wrist targets in character space (two-bone IK)."""
    from ink.figure import reach
    a = dict(NEUTRAL)
    a.update(angles or {})
    r = rig()
    for side, tgt in (hands or {}).items():
        a = reach(r, dict(a, L2=FORE_L), side, tgt, bend=(1 if side == "L" else -1))
    return r.pose(a, expr=expr, look=look)
