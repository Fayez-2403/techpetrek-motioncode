"""MOHAN, the son in the city. Lanky student: a tall pompadour, big ears, a crooked grin, a red college blazer with a
khaki crest, khaki trousers. Expressions: neutral, blink, joy, smug, shock."""
import numpy as np

from ink.core import Pic, ell, arc, rect
from ink import kit, face
from ink.figure import diag_shade
from ink import palette as K

SEED = 9700


def head(expr="neutral", look=(0.0, 0.0), seed=SEED) -> Pic:
    p = Pic()
    jaw = {"shock": 42}.get(expr, 0)
    L = [[0, -430], [-96, -422], [-140, -380], [-150, -300], [-140, -210], [-110, -120], [-70, -50], [-26, -8], [0, -2]]
    sk = face.jawdrop(face.sym(L, lower_shift=4), jaw, -160)
    for sx in (-1, 1):
        p.shape(ell(sx * 156, -280, 44, 64, 14), K.SKIN if sx < 0 else K.SKIN_SH, w=3.4, seed=seed + sx)
    face.face_base(p, sk, seed + 10, shade=((40, -500), (140, 40)),
                   lights=[[[-110, -230], [-84, -250], [-64, -228], [-86, -206]]])
    kit.pores(p, -86, -200, 30, 24, n=10, seed=seed + 12)
    face.eyes(p, [-48, 48], -300, 0.84, expr, look, seed + 20, bags=0)
    face.brows(p, [-50, 50], -344, 0.8, expr, seed + 30, thick=0.7)
    face.nose(p, [[-12, -300], [-18, -240], [-32, -206], [-16, -192], [0, -196], [16, -192], [32, -206], [18, -240], [12, -300]],
              seed + 40, nostrils=(14, -200, 5), tip=(-12, -212, 10), split_x=4)
    my = -120 + jaw * 0.6
    kind = {"neutral": "flat", "blink": "flat", "joy": "grin", "smug": "grin", "shock": "shock"}[expr]
    kit.mouth(p, 14 if kind == "grin" else 0, my, 0.8, kind, seed=seed + 50, wide=1.1)               # crooked grin: off-centre
    # the pompadour: a tall ink wave with shine strokes
    Hp = [[-140, -360], [-150, -440], [-110, -520], [-20, -600], [90, -620], [160, -560], [150, -470], [120, -430], [40, -440],
          [-40, -420], [-110, -380]]
    p.fill(Hp, K.INK, jit=1.6, seed=seed + 60)
    for i in range(3):
        p.ink([[-60 + i * 40, -520 + i * 10], [20 + i * 40, -580 + i * 8], [100 + i * 20, -570]], w=2.4, color=K.COBALT_L, alpha=170,
              taper=(0.2, 0.6), seed=seed + 61 + i)
    for sx in (-1, 1):
        p.fill([[sx * 140, -360], [sx * 150, -300], [sx * 132, -300], [sx * 128, -350]], K.INK, smooth=False)
    return p


def _torso(**kw):
    p = Pic()
    T = [[-170, 0], [-180, -200], [-196, -420], [-210, -500], [-90, -540], [0, -546], [90, -540], [210, -500], [196, -420],
         [180, -200], [170, 0]]
    F = p.fill(T, K.RED, jit=1.3, seed=SEED + 300)
    diag_shade(p, F, K.RED_SH, (40, -600), (160, 40))
    p.outline(F, w=4.0, seed=SEED + 301, breaks=3)
    p.shape([[-70, -540], [0, -470], [70, -540], [40, -380], [0, -420], [-40, -380]], K.CREAM, w=3.0, seed=SEED + 302)   # shirt
    p.fill([[-12, -470], [12, -470], [16, -380], [0, -360], [-16, -380]], K.COBALT_D)                                     # tie
    for sx in (-1, 1):
        p.ink([[sx * 70, -540], [sx * 40, -300], [sx * 20, 0]], w=2.6, taper=(0.05, 0.2), seed=SEED + 303 + sx)          # lapels
    p.shape(boxy_crest(), K.GOLD, w=2.6, seed=SEED + 310, jit=0.5)
    for i in range(2):
        p.shape(ell(30, -220 + i * 80, 10, 10, 10), K.GOLD, w=2.0, seed=SEED + 320 + i)
    return p


def boxy_crest():
    from ink.core import boxy
    return boxy([[-140, -400], [-90, -400], [-90, -350], [-115, -326], [-140, -350]], 8)


def _legs(**kw):
    p = Pic()
    for sx in (-1, 1):
        x = sx * 76
        Lg = [[x - 70, 0], [x - 66, 400], [x - 60, 700], [x + 60, 700], [x + 66, 400], [x + 70, 0]]
        F = p.fill(Lg, K.GOLD, jit=1.2, seed=SEED + 400 + sx)
        if sx > 0:
            diag_shade(p, F, K.GOLD_SH, (x - 10, -10), (x + 20, 720))
        p.outline(F, w=3.6, seed=SEED + 401 + sx, breaks=2)
        Sh = [[x - 60, 696], [x - 66, 736], [x + 80, 740], [x + 120, 716], [x + 70, 690]]
        if sx < 0:
            Sh = [[-q[0] + 2 * x, q[1]] for q in Sh]
        p.shape(Sh, K.INK, w=3.0, seed=SEED + 410 + sx)
    return p


def _head_part(**kw):
    return head(kw.get("expr", "neutral"), kw.get("look", (0, 0)))


def rig():
    return face.humanoid(SEED + 600, _torso, _legs, _head_part, hips_y=-720, shoulder=(196, -490), head_pivot=(0, -540),
                         arm_kw=dict(upper=(320, 86, 74), fore=(300, 74, 60), sleeve=K.RED, cuff=K.CREAM,
                                     hand_scale=0.8, hand_pose="hold"))


FORE_L = 300
NEUTRAL = {"armL": 0.1, "armR": -0.1, "foreL": -0.04, "foreR": 0.04}


def figure(expr="neutral", angles=None, look=(0, 0), hands=None) -> Pic:
    from ink.figure import reach
    a = dict(NEUTRAL)
    a.update(angles or {})
    r = rig()
    for side, tgt in (hands or {}).items():
        a = reach(r, dict(a, L2=FORE_L), side, tgt, bend=(1 if side == "L" else -1))
    return r.pose(a, expr=expr, look=look)
