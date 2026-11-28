"""BADE BABU, the TT and station master. Stout. A walrus moustache wide enough to clear a grin, bushy brows, a peaked
railway cap with a brass badge, a cobalt coat with two rows of brass buttons, a gold watch chain and a whistle.
Expressions: neutral, blink, stern, shock, smug."""
import numpy as np

from ink.core import Pic, ell, arc
from ink import kit, face
from ink.figure import diag_shade
from ink import palette as K

SEED = 8500


def head(expr="neutral", look=(0.0, 0.0), seed=SEED) -> Pic:
    p = Pic()
    jaw = {"shock": 48, "stern": 6}.get(expr, 0)
    L = [[0, -470], [-150, -462], [-212, -404], [-230, -306], [-238, -206], [-218, -116], [-160, -44], [-64, -6], [0, 0]]
    sk = face.jawdrop(face.sym(L, lower_shift=8), jaw, -180)
    for sx in (-1, 1):
        p.shape(ell(sx * 232, -290, 34, 52, 12), K.SKIN if sx < 0 else K.SKIN_SH, w=3.2, seed=seed + sx)
    face.face_base(p, sk, seed + 10, shade=((70, -520), (190, 40)),
                   lights=[ell(-150, -180, 44, 34, 12)],
                   shades=[ell(0, -440, 220, 30, 16), ell(0, -40 + jaw, 140, 30, 14)])
    p.ink(arc(0, -50 + jaw, 130, 26, 20, 160, 10), w=2.0, color=K.FINE, alpha=210, seed=seed + 11)
    kit.pores(p, -150, -170, 46, 36, n=16, seed=seed + 12)
    kit.pores(p, 150, -170, 46, 36, n=16, seed=seed + 13)
    for sx in (-1, 1):
        p.ink([[sx * 60, -250], [sx * 150, -150], [sx * 170, -80 + jaw * 0.6]], w=2.6, taper=(0.15, 0.5),
              seed=seed + 14 + sx)                                   # jowl folds
    ex = {"stern": "anger"}.get(expr, expr)
    face.eyes(p, [-66, 66], -316, 0.86, ex, look, seed + 20, bags=2)
    for sx in (-1, 1):                                               # bushy brows
        lift = {"shock": -26, "stern": 12, "smug": -8}.get(expr, 0)
        tilt = 18 if expr == "stern" else 0
        B = [[sx * 120, -352 + lift], [sx * 66, -378 + lift], [sx * 18, -362 + lift + tilt], [sx * 22, -344 + lift + tilt],
             [sx * 70, -354 + lift], [sx * 118, -336 + lift]]
        kit.barbed(p, B, seed=seed + 30 + sx, barbs=10, length=10, side=-1)
    face.nose(p, [[-20, -330], [-40, -276], [-70, -244], [-58, -206], [-20, -196], [0, -200], [20, -196], [58, -206],
                  [70, -244], [40, -276], [20, -330]], seed + 40, nostrils=(24, -212, 8), tip=(-24, -232, 16), split_x=8)
    my = -122 + jaw * 0.6
    kind = {"neutral": "flat", "blink": "flat", "stern": "snarl", "shock": "shock", "smug": "grin"}[expr]
    if kind != "flat":
        kit.mouth(p, 0, my + 8, 1.05, kind, seed=seed + 50, wide=1.3 if kind == "grin" else 1.0)
    # the walrus moustache: a big drooping mass that hides a closed mouth
    up = {"smug": -14, "shock": -6}.get(expr, 0)
    W = [[0, -204], [-60, -212], [-130, -196], [-176, -150 + up], [-190, -96 + up], [-160, -104 + up], [-120, -130 + up],
         [-70, -140 + up], [0, -148 + up * 0.5], [70, -140 + up], [120, -130 + up], [160, -104 + up], [190, -96 + up],
         [176, -150 + up], [130, -196], [60, -212]]
    kit.barbed(p, W, seed=seed + 60, barbs=22, length=11, side=1)
    for i in range(7):
        x = -120 + i * 40
        p.ink([[x, -190], [x * 1.1, -150 + up]], w=1.6, color=K.COBALT_L, alpha=150, taper=(0.3, 0.5), seed=seed + 61 + i)
    # the peaked railway cap: cobalt crown, dark band, ink brim with a glint, brass badge
    Cr = [[-236, -470], [-262, -540], [-230, -630], [-100, -670], [100, -670], [230, -630], [262, -540], [236, -470]]
    CF = p.fill(Cr, K.COBALT, jit=1.4, seed=seed + 70)
    diag_shade(p, CF, K.COBALT_D, (60, -730), (170, -450))
    p.outline(CF, w=4.2, seed=seed + 71, breaks=3)
    Bd = [[-232, -480], [232, -480], [226, -442], [-226, -442]]
    p.shape(Bd, K.COBALT_D, w=3.4, seed=seed + 72)
    Bm = [[-240, -450], [-120, -422], [0, -414], [120, -422], [240, -450], [180, -390], [0, -376], [-180, -390]]
    p.shape(Bm, K.INK, w=3.0, seed=seed + 73)
    p.ink([[-120, -406], [0, -400], [90, -404]], w=2.4, color=K.COBALT_L, alpha=180, taper=(0.3, 0.5), seed=seed + 74)
    kit.sparkle(p, -60, -404, 0.5)
    Bg = [[0, -570], [-34, -540], [-24, -490], [0, -480], [24, -490], [34, -540]]
    p.shape(Bg, K.GOLD, w=2.8, seed=seed + 75)
    kit.sparkle(p, -8, -540, 0.6)
    return p


def _torso(**kw):
    p = Pic()
    T = [[-310, 10], [-356, -160], [-350, -330], [-300, -470], [-170, -520], [0, -530], [170, -520], [300, -470],
         [350, -330], [356, -160], [310, 10]]
    F = p.fill(T, K.COBALT, jit=1.4, seed=SEED + 300)
    diag_shade(p, F, K.COBALT_D, (90, -600), (250, 60))
    p.outline(F, w=4.2, seed=SEED + 301, breaks=3)
    p.ink([[30, -500], [60, -260], [40, 0]], w=2.6, taper=(0.05, 0.2), seed=SEED + 302)         # coat overlap
    C = [[-130, -530], [0, -470], [130, -530], [110, -470], [0, -420], [-110, -470]]
    p.shape(C, K.COBALT_D, w=3.2, seed=SEED + 303)
    for col in (-60, 120):
        for i in range(4):
            y = -400 + i * 92
            p.shape(ell(col, y, 15, 15, 12), K.GOLD, w=2.4, seed=SEED + 310 + i + col)
            kit.sparkle(p, col - 4, y - 5, 0.3)
    # watch chain across the belly, the watch peeking from the pocket
    p.ink([[-60, -220], [40, -170], [170, -210]], w=3.4, color=K.GOLD, taper=(0, 0), pressure=0.1, seed=SEED + 330)
    kit.dash_rows(p, [[-60, -220], [40, -170], [170, -210]], rows=1, gap=0, dash=5, step=12, w=2.0, seed=SEED + 331,
                  color=K.GOLD_SH, tilt=1.0)
    p.shape(ell(196, -214, 26, 26, 14), K.GOLD, w=3.0, seed=SEED + 332)
    kit.sparkle(p, 188, -222, 0.4)
    p.shape([[160, -240], [260, -240], [262, -196], [158, -196]], K.COBALT_D, w=3.0, seed=SEED + 333)   # pocket flap
    # the whistle on a cord
    p.ink([[-140, -500], [-180, -360], [-200, -300]], w=2.2, color=K.RED, taper=(0, 0), seed=SEED + 340)
    p.shape([[-220, -300], [-170, -300], [-170, -270], [-226, -276]], K.GOLD, w=2.6, seed=SEED + 341)
    return p


def _legs(**kw):
    p = Pic()
    for sx in (-1, 1):
        x = sx * 130
        Lg = [[x - 130, 0], [x - 120, 260], [x - 104, 460], [x + 104, 460], [x + 120, 260], [x + 130, 0]]
        F = p.fill(Lg, K.COBALT_D, jit=1.2, seed=SEED + 400 + sx)
        p.outline(F, w=3.6, seed=SEED + 401 + sx, breaks=2)
        Sh = [[x - 104, 456], [x - 114, 498], [x + 80, 504], [x + 134, 478], [x + 96, 450]]
        if sx < 0:
            Sh = [[-q[0] + 2 * x, q[1]] for q in Sh]
        p.shape(Sh, K.INK, w=3.0, seed=SEED + 410 + sx)
        p.ink([[x - 40, 462], [x + 30, 464]], w=2.0, color=K.COBALT_L, alpha=200, seed=SEED + 420 + sx)
    return p


def _head_part(**kw):
    return head(kw.get("expr", "neutral"), kw.get("look", (0, 0)))


def rig():
    return face.humanoid(SEED + 600, _torso, _legs, _head_part, hips_y=-500, shoulder=(320, -460),
                         head_pivot=(0, -500),
                         arm_kw=dict(upper=(270, 140, 120), fore=(240, 120, 96), sleeve=K.COBALT, cuff=K.GOLD,
                                     hand_scale=1.0, hand_pose="hold"))


FORE_L = 240
NEUTRAL = {"armL": 0.2, "armR": -0.2, "foreL": -0.06, "foreR": 0.06}


def figure(expr="neutral", angles=None, look=(0, 0), hands=None) -> Pic:
    """hands = {"L": (x, y), "R": (x, y)} wrist targets in character space (two-bone IK)."""
    from ink.figure import reach
    a = dict(NEUTRAL)
    a.update(angles or {})
    r = rig()
    for side, tgt in (hands or {}).items():
        a = reach(r, dict(a, L2=FORE_L), side, tgt, bend=(1 if side == "L" else -1))
    return r.pose(a, expr=expr, look=look)
