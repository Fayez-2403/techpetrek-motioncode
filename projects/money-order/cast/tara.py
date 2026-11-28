"""TARA, the city telegraph-and-counter clerk. Tall and thin: a huge hair bun with a pencil through it, big telegraph
headphones, a long sharp nose, thick lashes, red lips, a periwinkle blouse with a cream pallu, gold bangles.
Expressions: neutral, blink, focus, smug, shock, joy."""
import numpy as np

from ink.core import Pic, ell, arc, rect
from ink import kit, face
from ink.figure import diag_shade
from ink import palette as K

SEED = 9500


def head(expr="neutral", look=(0.0, 0.0), seed=SEED) -> Pic:
    p = Pic()
    jaw = {"shock": 40}.get(expr, 0)
    # the bun (behind)
    p.fill(ell(10, -560, 150, 120, 22), K.INK, jit=2.0, seed=seed)
    for i in range(5):
        p.ink(arc(10, -560, 120 - i * 18, 90 - i * 14, 200, 520, 14), w=1.6, color=K.COBALT_L, alpha=150, taper=(0.2, 0.4), seed=seed + 1 + i)
    p.ink([[-150, -650], [190, -470]], w=10, color=K.GOLD, taper=(0, 0.2), seed=seed + 8)          # the pencil
    p.fill([[180, -476], [204, -462], [196, -450]], K.SKIN_LI, smooth=False)
    L = [[0, -470], [-90, -462], [-130, -416], [-142, -340], [-136, -250], [-116, -160], [-80, -70], [-36, -14], [0, -4]]
    sk = face.jawdrop(face.sym(L), jaw, -150)
    face.face_base(p, sk, seed + 10, shade=((40, -520), (120, 40)),
                   lights=[[[-110, -220], [-84, -236], [-66, -214], [-88, -196]]],
                   shades=[ell(0, -400, 130, 26, 12)])
    # hair framing the face
    for sx in (-1, 1):
        Hh = [[sx * 2, -476], [sx * 90, -470], [sx * 138, -420], [sx * 146, -330], [sx * 126, -380], [sx * 70, -430], [sx * 2, -440]]
        p.fill(Hh, K.INK, jit=1.0, seed=seed + 20 + sx)
    face.eyes(p, [-46, 46], -318, 0.82, {"focus": "anger"}.get(expr, expr), look, seed + 30, bags=0)
    for sx in (-1, 1):                                                  # thick lashes
        for k in range(3):
            p.ink([[sx * (52 + k * 8), -334 + k * 3], [sx * (64 + k * 10), -350 + k * 4]], w=2.2, taper=(0.1, 0.7), seed=seed + 33 + k + sx)
    face.brows(p, [-50, 50], -358, 0.75, {"focus": "anger"}.get(expr, expr), seed + 40, thick=0.5)
    face.nose(p, [[-10, -330], [-14, -270], [-30, -206], [-40, -184], [-20, -178], [0, -182], [14, -184], [12, -230], [10, -330]],
              seed + 50, nostrils=(12, -186, 5), tip=(-18, -196, 10), split_x=2)
    my = -116 + jaw * 0.6
    kind = {"neutral": "flat", "blink": "flat", "focus": "flat", "smug": "grin", "shock": "shock", "joy": "grin"}[expr]
    if kind == "flat":
        p.shape([[-40, my - 2], [-14, my - 10], [0, my - 6], [14, my - 10], [40, my - 2], [12, my + 14], [-12, my + 14]], K.RED,
                w=2.6, seed=seed + 60)                                   # red lips
    else:
        kit.mouth(p, 0, my, 0.7, kind, seed=seed + 61)
    # telegraph headphones: khaki band over the head, periwinkle cups on the ears
    p.ink(arc(0, -330, 170, 190, 190, 350, 14), w=14, color=K.GOLD_SH, taper=(0, 0), pressure=0.05, seed=seed + 70)
    p.ink(arc(0, -330, 170, 190, 190, 350, 14), w=7, color=K.GOLD, taper=(0, 0), pressure=0.05, seed=seed + 71)
    for sx in (-1, 1):
        p.shape(ell(sx * 150, -290, 40, 58, 14), K.COBALT if sx < 0 else K.COBALT_D, w=3.6, seed=seed + 72 + sx)
        p.fill(ell(sx * 150, -290, 18, 30, 12), K.INK)
        kit.sparkle(p, sx * 150 - 14, -320, 0.35)
    if expr == "focus":                                                 # listening ticks: dot-dash in the air
        for k, w_ in enumerate((10, 30, 10)):
            p.ink([[200 + k * 40, -380], [200 + k * 40 + w_, -380]], w=5, taper=(0, 0), seed=seed + 80 + k)
    return p


def _torso(**kw):
    p = Pic()
    T = [[-130, 0], [-136, -200], [-150, -400], [-170, -470], [-80, -500], [0, -506], [80, -500], [170, -470], [150, -400],
         [136, -200], [130, 0]]
    F = p.fill(T, K.COBALT, jit=1.3, seed=SEED + 300)
    diag_shade(p, F, K.COBALT_D, (30, -560), (140, 40))
    p.outline(F, w=4.0, seed=SEED + 301, breaks=3)
    P_ = [[-170, -470], [-60, -500], [120, -250], [140, 0], [40, 0], [-40, -260]]                   # the pallu drape
    PF = p.fill(P_, K.CREAM, jit=1.3, seed=SEED + 310)
    sub = Pic()
    sub.fill([[30, -600], [300, -600], [300, 60], [60, 60]], K.CREAM_SH, smooth=False)
    kit.dash_rows(sub, [[-150, -480], [-40, -480], [140, -220]], rows=1, gap=0, dash=7, step=16, w=2.0, color=K.RED, seed=SEED + 311)
    p.clip(PF, sub, smooth=False)
    p.outline(PF, w=3.6, seed=SEED + 312, breaks=3)
    return p


def _legs(**kw):
    p = Pic()
    S_ = [[-130, 0], [-150, 400], [-160, 700], [160, 700], [150, 400], [130, 0]]
    F = p.fill(S_, K.CREAM, jit=1.3, seed=SEED + 400)
    diag_shade(p, F, K.CREAM_SH, (10, -20), (60, 720))
    p.outline(F, w=3.8, seed=SEED + 401, breaks=3)
    for i in range(4):
        x = -90 + i * 60
        p.ink([[x, 40], [x + 6, 680]], w=1.8, color=K.FINE, alpha=190, taper=(0.1, 0.3), seed=SEED + 410 + i)
    kit.dash_rows(p, [[-160, 660], [160, 660]], rows=2, gap=14, dash=8, step=18, w=2.0, color=K.RED, seed=SEED + 420, tilt=0)
    return p


def _head_part(**kw):
    return head(kw.get("expr", "neutral"), kw.get("look", (0, 0)))


def rig():
    return face.humanoid(SEED + 600, _torso, _legs, _head_part, hips_y=-700, shoulder=(160, -460), head_pivot=(0, -500),
                         arm_kw=dict(upper=(300, 72, 62), fore=(280, 62, 50), sleeve=K.COBALT, cuff=K.GOLD,
                                     hand_scale=0.72, hand_pose="hold"))


FORE_L = 280
NEUTRAL = {"armL": 0.12, "armR": -0.12, "foreL": -0.05, "foreR": 0.05}


def figure(expr="neutral", angles=None, look=(0, 0), hands=None) -> Pic:
    from ink.figure import reach
    a = dict(NEUTRAL)
    a.update(angles or {})
    r = rig()
    for side, tgt in (hands or {}).items():
        a = reach(r, dict(a, L2=FORE_L), side, tgt, bend=(1 if side == "L" else -1))
    return r.pose(a, expr=expr, look=look)
