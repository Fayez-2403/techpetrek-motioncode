"""MUNNI, the small-town cinema-goer. A short girl: two ink braids with raspberry ribbons, big eyes, a gap-tooth
grin, a violet frock with lilac dots, a paper cone of peanuts. Expressions: neutral, blink, joy, shock, smug."""
import numpy as np

from ink.core import Pic, ell, arc, rect
from ink import kit, face
from ink.figure import diag_shade
from ink import palette as K

SEED = 11700


def head(expr="neutral", look=(0.0, 0.0), seed=SEED, **kw) -> Pic:
    p = Pic()
    jaw = {"shock": 34}.get(expr, 0)
    for sx in (-1, 1):                                                   # braids behind
        B = [[sx * 110, -260], [sx * 160, -180], [sx * 176, -60], [sx * 160, 40], [sx * 130, 50], [sx * 136, -60], [sx * 120, -170]]
        p.fill(B, K.INK, jit=1.4, seed=seed + sx)
        for k in range(4):
            y = -150 + k * 50
            p.ink([[sx * 130, y], [sx * 168, y + 20]], w=1.6, color=K.COBALT_L, alpha=160, taper=(0.2, 0.4), seed=seed + 3 + k + sx)
        p.shape(ell(sx * 148, 44, 34, 18, 12, rot=0.4 * sx), K.RED, w=2.8, seed=seed + 10 + sx)
    L = [[0, -360], [-100, -350], [-142, -300], [-150, -220], [-140, -140], [-110, -66], [-60, -14], [0, 0]]
    sk = face.jawdrop(face.sym(L), jaw, -130)
    face.face_base(p, sk, seed + 20, shade=((40, -420), (130, 40)), lights=[[[-110, -170], [-84, -190], [-64, -168], [-86, -146]]])
    p.fill([[-142, -280], [-100, -350], [0, -372], [100, -350], [142, -280], [100, -300], [0, -316], [-100, -300]], K.INK, jit=1.0, seed=seed + 21)
    face.eyes(p, [-50, 50], -220, 1.1, expr, look, seed + 30, bags=0)
    face.brows(p, [-50, 50], -276, 0.7, expr, seed + 40, thick=0.5)
    face.nose(p, [[-8, -210], [-16, -176], [-26, -152], [-12, -144], [0, -146], [12, -144], [26, -152], [16, -176], [8, -210]], seed + 50,
              nostrils=(10, -150, 4), tip=(-8, -160, 8), split_x=2)
    kind = {"neutral": "flat", "blink": "flat", "joy": "grin", "shock": "shock", "smug": "grin"}[expr]
    kit.mouth(p, 0, -96 + jaw * 0.6, 0.62, kind, seed=seed + 60)
    if kind == "grin":
        p.fill(rect(-5, -94, 6, -80, 3), K.MOUTH)                            # gap tooth
    for sx in (-1, 1):
        p.fill(ell(sx * 92, -150, 22, 14, 12), K.RED, alpha=90)              # cheek blush
    return p


def _torso(**kw):
    p = Pic()
    T = [[-210, 20], [-180, -160], [-120, -300], [0, -320], [120, -300], [180, -160], [210, 20]]
    F = p.fill(T, K.COBALT, jit=1.3, seed=SEED + 300)
    sub = Pic()
    from ink.core import rng
    r = rng(SEED + 301)
    for i in range(30):
        sub.dot((r.uniform(-200, 200), r.uniform(-310, 10)), 6, K.CREAM, alpha=200)
    sub.fill([[30, -360], [300, -360], [300, 60], [80, 60]], K.COBALT_D, smooth=False, alpha=150)
    p.clip(F, sub, smooth=False)
    p.outline(F, w=3.8, seed=SEED + 302, breaks=3)
    p.shape([[-60, -320], [0, -270], [60, -320], [40, -300], [0, -282], [-40, -300]], K.CREAM, w=2.4, seed=SEED + 303)
    return p


def _legs(**kw):
    p = Pic()
    for sx in (-1, 1):
        x = sx * 60
        p.shape([[x - 30, 0], [x - 28, 240], [x + 28, 240], [x + 30, 0]], K.SKIN if sx < 0 else K.SKIN_SH, w=3.0, seed=SEED + 400 + sx)
        Sh = [[x - 40, 236], [x - 46, 270], [x + 50, 272], [x + 70, 252], [x + 30, 232]]
        if sx < 0:
            Sh = [[-q[0] + 2 * x, q[1]] for q in Sh]
        p.shape(Sh, K.RED, w=3.0, seed=SEED + 410 + sx)
    return p


def _head_part(**kw):
    return head(kw.get("expr", "neutral"), kw.get("look", (0, 0)))


def rig():
    return face.humanoid(SEED + 600, _torso, _legs, _head_part, hips_y=-260, shoulder=(150, -280), head_pivot=(0, -300),
                         arm_kw=dict(upper=(150, 64, 56), fore=(140, 56, 46), skin=K.SKIN, hand_scale=0.6, hand_pose="hold"))


FORE_L = 140
NEUTRAL = {"armL": 0.3, "armR": -0.3, "foreL": -0.1, "foreR": 0.1}


def figure(expr="neutral", angles=None, look=(0, 0), hands=None, mouth=0.0) -> Pic:
    from ink.figure import reach
    a = dict(NEUTRAL)
    a.update(angles or {})
    r = rig()
    for side, tgt in (hands or {}).items():
        a = reach(r, dict(a, L2=FORE_L), side, tgt, bend=(1 if side == "L" else -1))
    return r.pose(a, expr=expr, look=look)
