"""CENSOR BABU. Short and stout: a tall ink hair-puff, giant round glasses, a pencil-thin moustache, a khaki-gold
coat with a raspberry rosette. His prop is a giant pair of scissors (film.props3). Expressions: neutral, blink, stern,
smug, shock."""
import numpy as np

from ink.core import Pic, ell, arc, rect
from ink import kit, face
from ink.figure import diag_shade
from ink import palette as K

SEED = 11500


def head(expr="neutral", look=(0.0, 0.0), seed=SEED, **kw) -> Pic:
    p = Pic()
    jaw = {"shock": 40}.get(expr, 0)
    p.fill([[-150, -330], [-170, -430], [-120, -540], [-20, -590], [90, -580], [160, -500], [170, -400], [150, -330]], K.INK, jit=2.6,
           seed=seed)                                                    # the hair puff
    for i in range(5):
        p.ink(arc(10, -460, 120 - i * 18, 90 - i * 14, 200, 330, 10), w=1.6, color=K.COBALT_L, alpha=150, taper=(0.2, 0.4), seed=seed + 1 + i)
    L = [[0, -380], [-110, -372], [-160, -320], [-176, -240], [-170, -160], [-136, -80], [-80, -20], [0, 0]]
    sk = face.jawdrop(face.sym(L), jaw, -140)
    for sx in (-1, 1):
        p.shape(ell(sx * 170, -230, 28, 42, 12), K.SKIN if sx < 0 else K.SKIN_SH, w=3.2, seed=seed + 10 + sx)
    face.face_base(p, sk, seed + 20, shade=((50, -440), (150, 40)), lights=[[[-130, -150], [-104, -170], [-84, -150], [-104, -128]]])
    ex = {"stern": "anger"}.get(expr, expr)
    face.eyes(p, [-60, 60], -246, 0.9, ex, look, seed + 30, bags=1)
    face.brows(p, [-62, 62], -300, 0.85, ex, seed + 40, thick=0.9)
    for sx in (-1, 1):                                                   # giant round glasses
        G = ell(sx * 60, -246, 58, 54, 22)
        p.fill(G, K.LILAC, alpha=70)
        p.ink(np.vstack([G, G[:1]]), w=5, taper=(0, 0), pressure=0.1, seed=seed + 50 + sx, smooth=False)
        kit.sparkle(p, sx * 60 - 24, -272, 0.55)
    p.ink([[-4, -250], [4, -250]], w=4, taper=(0, 0), seed=seed + 53)
    face.nose(p, [[-12, -240], [-20, -190], [-34, -160], [-18, -148], [0, -150], [18, -148], [34, -160], [20, -190], [12, -240]],
              seed + 60, nostrils=(14, -156, 5), tip=(-12, -168, 10), split_x=4)
    my = -100 + jaw * 0.6
    kind = {"neutral": "flat", "blink": "flat", "stern": "snarl", "smug": "grin", "shock": "shock"}[expr]
    kit.mouth(p, 0, my + 4, 0.78, kind, seed=seed + 70)
    for sx in (-1, 1):
        p.fill([[sx * 4, -124], [sx * 50, -120], [sx * 62, -112], [sx * 46, -114], [sx * 4, -118]], K.INK, seed=seed + 80 + sx)
    return p


def _torso(**kw):
    p = Pic()
    T = [[-230, 0], [-262, -140], [-250, -270], [-210, -360], [-110, -404], [0, -412], [110, -404], [210, -360], [250, -270],
         [262, -140], [230, 0]]
    F = p.fill(T, K.GOLD, jit=1.4, seed=SEED + 300)
    diag_shade(p, F, K.GOLD_SH, (60, -460), (180, 40))
    p.outline(F, w=4.0, seed=SEED + 301, breaks=3)
    p.ink([[0, -400], [10, -40]], w=2.4, taper=(0.05, 0.2), seed=SEED + 302)
    for i in range(3):
        p.shape(ell(26, -330 + i * 90, 11, 11, 10), K.COBALT_D, w=2.2, seed=SEED + 310 + i)
    p.shape(ell(-120, -300, 34, 34, 14), K.RED, w=2.8, seed=SEED + 320)                                   # rosette
    p.fill([[-136, -270], [-120, -200], [-104, -270]], K.RED_SH, smooth=False)
    return p


def _legs(**kw):
    p = Pic()
    for sx in (-1, 1):
        x = sx * 96
        Lg = [[x - 96, 0], [x - 92, 220], [x - 80, 300], [x + 80, 300], [x + 92, 220], [x + 96, 0]]
        F = p.fill(Lg, K.COBALT_D, jit=1.2, seed=SEED + 400 + sx)
        p.outline(F, w=3.6, seed=SEED + 401 + sx, breaks=2)
        Sh = [[x - 86, 296], [x - 96, 336], [x + 60, 340], [x + 104, 318], [x + 80, 292]]
        if sx < 0:
            Sh = [[-q[0] + 2 * x, q[1]] for q in Sh]
        p.shape(Sh, K.INK, w=3.0, seed=SEED + 410 + sx)
    return p


def _head_part(**kw):
    return head(kw.get("expr", "neutral"), kw.get("look", (0, 0)))


def rig():
    return face.humanoid(SEED + 600, _torso, _legs, _head_part, hips_y=-340, shoulder=(226, -330), head_pivot=(0, -390),
                         arm_kw=dict(upper=(200, 104, 90), fore=(180, 90, 72), sleeve=K.GOLD, cuff=K.GOLD_SH, hand_scale=0.85,
                                     hand_pose="hold"))


FORE_L = 180
NEUTRAL = {"armL": 0.3, "armR": -0.3, "foreL": -0.1, "foreR": 0.1}


def figure(expr="neutral", angles=None, look=(0, 0), hands=None, mouth=0.0) -> Pic:
    from ink.figure import reach
    a = dict(NEUTRAL)
    a.update(angles or {})
    r = rig()
    for side, tgt in (hands or {}).items():
        a = reach(r, dict(a, L2=FORE_L), side, tgt, bend=(1 if side == "L" else -1))
    return r.pose(a, expr=expr, look=look)
