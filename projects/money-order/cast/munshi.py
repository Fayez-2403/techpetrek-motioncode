"""MUNSHI-JI, the village postmaster. Huge and round with a small head: a black round cap, pince-nez on a chain, a thin
pencil moustache, big jowls and a double chin, a khaki waistcoat over a cream shirt, ink-stained fingers.
Expressions: neutral, blink, smug, worry, shock, anger."""
import numpy as np

from ink.core import Pic, ell, arc, rect
from ink import kit, face
from ink.figure import diag_shade
from ink import palette as K

SEED = 9300


def head(expr="neutral", look=(0.0, 0.0), seed=SEED) -> Pic:
    p = Pic()
    jaw = {"shock": 46, "anger": 6}.get(expr, 0)
    L = [[0, -400], [-100, -394], [-150, -350], [-168, -280], [-190, -200], [-206, -120], [-186, -50], [-120, -6], [-40, 8], [0, 8]]
    sk = face.jawdrop(face.sym(L, lower_shift=6), jaw, -160)
    for sx in (-1, 1):
        p.shape(ell(sx * 168, -250, 30, 44, 12), K.SKIN if sx < 0 else K.SKIN_SH, w=3.2, seed=seed + sx)
    face.face_base(p, sk, seed + 10, shade=((50, -460), (170, 40)),
                   lights=[[[-170, -170], [-140, -196], [-112, -170], [-140, -140]]],
                   shades=[ell(0, -24 + jaw, 140, 26, 14)])
    p.ink(arc(0, -30 + jaw, 120, 24, 20, 160, 10), w=2.0, color=K.FINE, alpha=210, seed=seed + 11)        # double chin
    p.ink(arc(0, -60 + jaw, 140, 34, 30, 150, 10), w=1.8, color=K.FINE, alpha=190, seed=seed + 12)
    kit.pores(p, -120, -150, 36, 30, n=12, seed=seed + 13)
    kit.pores(p, 120, -150, 36, 30, n=12, seed=seed + 14)
    for sx in (-1, 1):
        p.ink([[sx * 40, -210], [sx * 110, -130], [sx * 130, -70 + jaw * 0.6]], w=2.4, taper=(0.15, 0.5), seed=seed + 15 + sx)
    ex = {"worry": "neutral"}.get(expr, expr)
    lk = (0.0, 0.6) if expr == "worry" else look
    face.eyes(p, [-50, 50], -262, 0.78, ex, lk, seed + 20, bags=1)
    face.brows(p, [-54, 54], -310, 0.8, "shock" if expr == "worry" else expr, seed + 30, thick=0.8)
    # pince-nez + chain
    for sx in (-1, 1):
        G = ell(sx * 50, -262, 34, 30, 18)
        p.fill(G, K.LILAC, alpha=55)
        p.ink(np.vstack([G, G[:1]]), w=2.8, taper=(0, 0), pressure=0.1, seed=seed + 40 + sx, smooth=False)
    p.ink(arc(0, -262, 16, 10, 200, 340, 6), w=2.4, taper=(0, 0), seed=seed + 43)
    kit.sparkle(p, -64, -280, 0.45)
    p.ink([[84, -262], [130, -200], [150, -130]], w=1.8, color=K.GOLD, taper=(0, 0.4), seed=seed + 44)
    face.nose(p, [[-16, -270], [-30, -216], [-52, -186], [-30, -166], [0, -170], [30, -166], [52, -186], [30, -216], [16, -270]],
              seed + 50, nostrils=(20, -176, 7), tip=(-16, -194, 14), split_x=6)
    my = -118 + jaw * 0.6
    kind = {"neutral": "flat", "blink": "flat", "smug": "grin", "worry": "flat", "shock": "shock", "anger": "snarl"}[expr]
    kit.mouth(p, 0, my + 6, 0.85, kind, seed=seed + 60, wide=1.2 if kind == "grin" else 1.0)
    for sx in (-1, 1):                                                  # thin pencil moustache
        p.fill([[sx * 6, -146], [sx * 50, -142], [sx * 66, -134], [sx * 48, -136], [sx * 6, -138]], K.INK, seed=seed + 70 + sx)
    # the black round cap
    C = [[-150, -360], [-160, -420], [-120, -470], [0, -486], [120, -470], [160, -420], [150, -360], [0, -376]]
    CF = p.fill(C, K.INK, jit=1.2, seed=seed + 80)
    p.ink([[-120, -440], [0, -458], [100, -446]], w=3, color=K.COBALT_L, alpha=170, taper=(0.2, 0.5), seed=seed + 81)
    kit.dash_rows(p, [[-150, -372], [0, -386], [150, -372]], rows=1, gap=0, dash=8, step=18, w=2.0, color=K.GOLD, seed=seed + 82, tilt=0)
    return p


def _torso(**kw):
    p = Pic()
    T = [[-330, 0], [-410, -170], [-420, -320], [-370, -440], [-200, -500], [0, -510], [200, -500], [370, -440], [420, -320],
         [410, -170], [330, 0]]
    F = p.fill(T, K.CREAM, jit=1.5, seed=SEED + 300)
    p.outline(F, w=4.2, seed=SEED + 301, breaks=3)
    W = [[-330, 0], [-405, -170], [-410, -320], [-320, -440], [-130, -470], [-40, -330], [0, -260], [40, -330], [130, -470],
         [320, -440], [410, -320], [405, -170], [330, 0], [0, 30]]
    WF = p.fill(W, K.GOLD, jit=1.5, seed=SEED + 310)
    diag_shade(p, WF, K.GOLD_SH, (80, -560), (250, 60))
    p.outline(WF, w=4.0, seed=SEED + 311, breaks=3)
    for i in range(4):
        p.shape(ell(14, -230 + i * 60, 12, 12, 10), K.CREAM, w=2.2, seed=SEED + 320 + i)
    p.ink([[-60, -150], [-120, -110], [-90, -60]], w=6, color=K.COBALT_D, taper=(0.2, 0.8), seed=SEED + 330, alpha=200)   # ink stain
    p.shape(rect(160, -260, 260, -200, 10), K.GOLD_SH, w=2.8, seed=SEED + 331)                     # pocket + pens
    for k, c in enumerate((K.RED, K.COBALT)):
        p.ink([[190 + k * 30, -200], [196 + k * 30, -300]], w=9, color=c, taper=(0, 0.1), seed=SEED + 332 + k)
    return p


def _legs(**kw):
    p = Pic()
    for sx in (-1, 1):
        x = sx * 150
        Lg = [[x - 150, 0], [x - 140, 240], [x - 120, 420], [x + 120, 420], [x + 140, 240], [x + 150, 0]]
        F = p.fill(Lg, K.mix(K.COBALT, K.INK, 0.3), jit=1.2, seed=SEED + 400 + sx)
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


def figure(expr="neutral", angles=None, look=(0, 0), hands=None) -> Pic:
    from ink.figure import reach
    a = dict(NEUTRAL)
    a.update(angles or {})
    r = rig()
    for side, tgt in (hands or {}).items():
        a = reach(r, dict(a, L2=FORE_L), side, tgt, bend=(1 if side == "L" else -1))
    return r.pose(a, expr=expr, look=look)
