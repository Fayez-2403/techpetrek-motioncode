"""SETH KAMAL, the studio owner. Huge and round in a white suit: a tall black top hat, a monocle on a gold chain, a
curly ink moustache, a raspberry bow tie, a gold watch chain. Expressions: neutral, blink, smug, shock, anger, worry."""
import numpy as np

from ink.core import Pic, ell, arc, rect
from ink import kit, face
from ink.figure import diag_shade
from ink import palette as K

SEED = 11300


def head(expr="neutral", look=(0.0, 0.0), seed=SEED, **kw) -> Pic:
    p = Pic()
    jaw = {"shock": 44}.get(expr, 0)
    L = [[0, -420], [-120, -410], [-176, -360], [-196, -280], [-200, -190], [-180, -100], [-130, -36], [-60, -6], [0, 0]]
    sk = face.jawdrop(face.sym(L, lower_shift=6), jaw, -150)
    for sx in (-1, 1):
        p.shape(ell(sx * 196, -250, 30, 46, 12), K.SKIN if sx < 0 else K.SKIN_SH, w=3.2, seed=seed + sx)
    face.face_base(p, sk, seed + 10, shade=((60, -480), (170, 40)), lights=[[[-150, -180], [-120, -204], [-96, -180], [-120, -152]]],
                   shades=[ell(0, -30 + jaw, 140, 26, 14)])
    p.ink(arc(0, -36 + jaw, 120, 24, 20, 160, 10), w=2.0, color=K.FINE, alpha=210, seed=seed + 11)
    kit.pores(p, -130, -150, 40, 30, n=12, seed=seed + 12)
    ex = {"worry": "neutral"}.get(expr, expr)
    face.eyes(p, [-56, 56], -270, 0.82, ex, (0.0, 0.6) if expr == "worry" else look, seed + 20, bags=2)
    face.brows(p, [-58, 58], -318, 0.9, "shock" if expr == "worry" else expr, seed + 30, thick=1.0)
    G = ell(56, -270, 40, 40, 18)                                          # the monocle
    p.fill(G, K.LILAC, alpha=60)
    p.ink(np.vstack([G, G[:1]]), w=3.4, color=K.GOLD, taper=(0, 0), seed=seed + 40, smooth=False)
    p.ink([[96, -262], [160, -170], [170, -60]], w=1.8, color=K.GOLD, taper=(0, 0.4), seed=seed + 41)
    kit.sparkle(p, 40, -290, 0.45)
    face.nose(p, [[-16, -290], [-30, -230], [-56, -196], [-32, -176], [0, -180], [32, -176], [56, -196], [30, -230], [16, -290]],
              seed + 50, nostrils=(22, -186, 7), tip=(-16, -204, 14), split_x=6)
    my = -124 + jaw * 0.6
    kind = {"neutral": "flat", "blink": "flat", "smug": "grin", "shock": "shock", "anger": "snarl", "worry": "flat"}[expr]
    kit.mouth(p, 0, my + 6, 0.95, kind, seed=seed + 60, wide=1.2 if kind == "grin" else 1.0)
    for sx in (-1, 1):                                                     # the curly moustache
        p.fill([[sx * 6, -168], [sx * 70, -172], [sx * 120, -150], [sx * 132, -176], [sx * 112, -188], [sx * 116, -170], [sx * 70, -158],
                [sx * 6, -156]], K.INK, seed=seed + 70 + sx)
    # the top hat
    p.shape(boxy_hat(), K.INK, w=3.6, seed=seed + 80, jit=0.8)
    p.fill(rect(-120, -470, 120, -440, 10), K.RED)
    p.ink([[-90, -640], [-70, -480]], w=4, color=K.COBALT_L, alpha=170, taper=(0.2, 0.5), seed=seed + 81)
    p.shape(boxy_brim(), K.INK, w=3.4, seed=seed + 82, jit=0.6)
    return p


def boxy_hat():
    from ink.core import boxy
    return boxy([[-124, -440], [-110, -690], [110, -690], [124, -440]], 20)


def boxy_brim():
    from ink.core import boxy
    return boxy([[-190, -452], [190, -452], [176, -410], [-176, -410]], 20)


def _torso(**kw):
    p = Pic()
    T = [[-330, 0], [-410, -170], [-420, -320], [-370, -440], [-200, -500], [0, -510], [200, -500], [370, -440], [420, -320],
         [410, -170], [330, 0]]
    F = p.fill(T, K.CREAM, jit=1.5, seed=SEED + 300)
    diag_shade(p, F, K.CREAM_SH, (80, -560), (250, 60))
    p.outline(F, w=4.2, seed=SEED + 301, breaks=3)
    p.ink([[0, -470], [20, -200], [0, 0]], w=2.6, taper=(0.05, 0.2), seed=SEED + 302)
    p.shape([[-70, -500], [0, -470], [70, -500], [70, -440], [0, -460], [-70, -440]], K.RED, w=3.0, seed=SEED + 303)   # bow tie
    for i in range(3):
        p.shape(ell(28, -380 + i * 90, 12, 12, 10), K.GOLD, w=2.2, seed=SEED + 310 + i)
    p.ink([[-120, -200], [20, -150], [160, -200]], w=3.4, color=K.GOLD, taper=(0, 0), seed=SEED + 320)
    return p


def _legs(**kw):
    p = Pic()
    for sx in (-1, 1):
        x = sx * 150
        Lg = [[x - 150, 0], [x - 140, 240], [x - 120, 420], [x + 120, 420], [x + 140, 240], [x + 150, 0]]
        F = p.fill(Lg, K.CREAM_SH, jit=1.2, seed=SEED + 400 + sx)
        p.outline(F, w=3.6, seed=SEED + 401 + sx, breaks=2)
        Sh = [[x - 120, 416], [x - 130, 460], [x + 90, 466], [x + 150, 440], [x + 110, 410]]
        if sx < 0:
            Sh = [[-q[0] + 2 * x, q[1]] for q in Sh]
        p.shape(Sh, K.INK, w=3.0, seed=SEED + 410 + sx)
    return p


def _head_part(**kw):
    return head(kw.get("expr", "neutral"), kw.get("look", (0, 0)))


def rig():
    return face.humanoid(SEED + 600, _torso, _legs, _head_part, hips_y=-460, shoulder=(380, -430), head_pivot=(0, -490),
                         arm_kw=dict(upper=(260, 150, 124), fore=(230, 124, 98), sleeve=K.CREAM, cuff=K.CREAM_SH,
                                     hand_scale=1.05, hand_pose="hold"))


FORE_L = 230
NEUTRAL = {"armL": 0.25, "armR": -0.25, "foreL": -0.06, "foreR": 0.06}


def figure(expr="neutral", angles=None, look=(0, 0), hands=None, mouth=0.0) -> Pic:
    from ink.figure import reach
    a = dict(NEUTRAL)
    a.update(angles or {})
    r = rig()
    for side, tgt in (hands or {}).items():
        a = reach(r, dict(a, L2=FORE_L), side, tgt, bend=(1 if side == "L" else -1))
    return r.pose(a, expr=expr, look=look)
