"""HARIRAM, the farmer who sends the money order. Short and hunched. A cream pagdi with khaki bands, bushy white
barbed brows and a drooping white moustache, sunken cheeks, big ears, one gap tooth, a red check shawl, a walking stick.
Expressions: neutral, blink, joy, worry, shock."""
import numpy as np

from ink.core import Pic, ell, arc, rect
from ink import kit, face
from ink.figure import diag_shade
from ink import palette as K

SEED = 9100
WHITE = K.mix(K.CREAM, K.LILAC, 0.3)


def head(expr="neutral", look=(0.0, 0.0), seed=SEED) -> Pic:
    p = Pic()
    jaw = {"shock": 44}.get(expr, 0)
    L = [[0, -430], [-104, -424], [-150, -380], [-162, -300], [-150, -220], [-128, -150], [-120, -86], [-86, -30],
         [-36, -2], [0, 2]]
    sk = face.jawdrop(face.sym(L, lower_shift=4), jaw, -170)
    for sx in (-1, 1):                                                   # big ears
        p.shape(ell(sx * 164, -260, 40, 62, 14), K.SKIN if sx < 0 else K.SKIN_SH, w=3.4, seed=seed + sx)
        p.ink(arc(sx * 168, -260, 20, 36, 100 if sx < 0 else -80, 260 if sx < 0 else 80, 8), w=1.8, color=K.FINE,
              alpha=210, seed=seed + 3 + sx)
    face.face_base(p, sk, seed + 10, shade=((40, -500), (150, 40)),
                   lights=[[[-120, -230], [-90, -250], [-70, -230], [-92, -206], [-118, -206]]],
                   shades=[ell(sx * 92, -150, 40, 60, 12) for sx in (-1, 1)] + [ell(0, -350, 150, 30, 14)])   # sunken cheeks
    for i, y in enumerate((-356, -372)):
        p.ink(arc(0, y + 70, 90 - i * 10, 50, 215, 325, 9), w=1.6, color=K.FINE, alpha=200, seed=seed + 20 + i)
    kit.ticks(p, 0, -70 + jaw, 110, 50, n=70, length=6, angle=95, spread=30, seed=seed + 21, color=WHITE, alpha=230)
    kit.pores(p, -90, -200, 30, 24, n=10, seed=seed + 22)
    for sx in (-1, 1):
        p.ink([[sx * 36, -230], [sx * 80, -150], [sx * 96, -80 + jaw * 0.6]], w=2.6, taper=(0.15, 0.5), seed=seed + 24 + sx)
        for k in range(3):                                              # crow's feet
            p.ink([[sx * 78, -300 + k * 9], [sx * (100 + k * 5), -306 + k * 15]], w=1.4, color=K.FINE, alpha=200,
                  taper=(0.2, 0.6), seed=seed + 27 + k + sx * 4)
    ex = {"worry": "neutral"}.get(expr, expr)
    lk = (0.1, 0.7) if expr == "worry" else look
    face.eyes(p, [-50, 50], -292, 0.8, ex, lk, seed + 30, bags=2)
    bexpr = {"worry": "shock", "joy": "joy"}.get(expr, expr)
    for i, sx in enumerate((-1, 1)):                                   # bushy white barbed brows
        lift = {"shock": -24, "worry": -14, "joy": -8}.get(expr, 0)
        tilt = 14 if expr == "worry" else 0
        B = [[sx * 104, -320 + lift + (-tilt if True else 0)], [sx * 54, -346 + lift], [sx * 14, -330 + lift - tilt],
             [sx * 18, -312 + lift - tilt], [sx * 56, -324 + lift], [sx * 100, -304 + lift]]
        kit.barbed(p, B, color=WHITE, seed=seed + 40 + i, barbs=10, length=10, side=-1)
        p.outline(np.array(B, float), w=1.6, seed=seed + 42 + i, breaks=2, color=K.FINE)
    face.nose(p, [[-14, -300], [-26, -240], [-44, -204], [-26, -186], [0, -190], [26, -186], [44, -204], [26, -240],
                  [14, -300]], seed + 50, nostrils=(18, -196, 6), tip=(-14, -212, 12), split_x=6)
    my = -120 + jaw * 0.6
    kind = {"neutral": "flat", "blink": "flat", "joy": "grin", "worry": "flat", "shock": "shock"}[expr]
    kit.mouth(p, 0, my + 10, 0.85, kind, seed=seed + 60, wide=1.2 if kind == "grin" else 1.0)
    if kind in ("grin", "shock"):                                       # the gap tooth
        p.fill(rect(-6, my + 10, 8, my + 30, 4), K.MOUTH)
    # drooping white moustache with barbed edges
    up = {"joy": -10, "shock": -6}.get(expr, 0)
    for sx in (-1, 1):
        M = [[sx * 4, -176], [sx * 60, -180], [sx * 104, -150 + up], [sx * 112, -96 + up], [sx * 96, -94 + up],
             [sx * 80, -130 + up], [sx * 40, -150], [sx * 4, -156]]
        kit.barbed(p, M, color=WHITE, seed=seed + 70 + sx, barbs=10, length=8, side=sx)
        p.outline(np.array(M, float), w=1.6, seed=seed + 72 + sx, breaks=2, color=K.FINE)
    # the pagdi: cream wraps with khaki bands, a fold tail over the left ear
    T = [[-176, -350], [-196, -420], [-170, -500], [-90, -548], [0, -560], [90, -548], [170, -500], [196, -420], [176, -350],
         [90, -372], [0, -380], [-90, -372]]
    F = p.fill(T, K.CREAM, jit=2.0, seed=seed + 80)
    sub = Pic()
    sub.fill([[40, -600], [300, -600], [300, -300], [120, -300]], K.CREAM_SH, smooth=False)
    for i in range(4):
        y = -380 - i * 44
        sub.ink([[-220, y + 30], [-60, y - 10], [120, y - 26], [230, y - 50]], w=7, color=K.GOLD, taper=(0, 0), seed=seed + 81 + i,
                alpha=220)
        sub.ink([[-220, y + 36], [-60, y - 4], [120, y - 20], [230, y - 44]], w=2.0, color=K.FINE, alpha=200, taper=(0.1, 0.2),
                seed=seed + 85 + i)
    p.clip(F, sub, smooth=False)
    p.outline(F, w=4.2, seed=seed + 89, breaks=4)
    p.shape([[-170, -400], [-214, -380], [-226, -300], [-200, -250], [-186, -300], [-176, -360]], K.CREAM_SH, w=3.2, seed=seed + 90)
    return p


def _torso(**kw):
    p = Pic()
    T = [[-150, 0], [-170, -160], [-176, -320], [-150, -420], [-70, -452], [0, -456], [70, -452], [150, -420], [176, -320],
         [170, -160], [150, 0]]
    F = p.fill(T, K.CREAM, jit=1.4, seed=SEED + 300)
    diag_shade(p, F, K.CREAM_SH, (30, -520), (130, 40))
    p.outline(F, w=4.0, seed=SEED + 301, breaks=3)
    p.ink([[0, -440], [6, -250]], w=2.2, taper=(0.05, 0.3), seed=SEED + 302)
    for i, (a, b) in enumerate((((-110, -200), (-130, -20)), ((100, -260), (124, -30)))):
        p.ink([a, ((a[0] + b[0]) / 2 + 8, (a[1] + b[1]) / 2), b], w=2.0, color=K.FINE, alpha=210, taper=(0.2, 0.4), seed=SEED + 303 + i)
    # the red check shawl over the left shoulder
    Sh = [[-170, -420], [-40, -456], [60, -300], [20, -120], [-60, -90], [-140, -240]]
    SF = p.fill(Sh, K.RED, jit=1.4, seed=SEED + 310)
    sub = Pic()
    kit.plaid(sub, -220, -480, 100, -60, K.RED, K.GOLD, K.CREAM, every=40)
    sub.fill([[-20, -500], [200, -500], [200, 0], [-60, 0]], K.RED_SH, smooth=False, alpha=170)
    p.clip(SF, sub, smooth=False)
    p.outline(SF, w=3.8, seed=SEED + 311, breaks=3)
    return p


def _legs(**kw):
    p = Pic()
    D = [[-150, 0], [-160, 180], [-140, 300], [-40, 306], [0, 200], [40, 306], [140, 300], [160, 180], [150, 0]]
    F = p.fill(D, K.CREAM, jit=1.3, seed=SEED + 400)
    diag_shade(p, F, K.CREAM_SH, (20, -20), (90, 330))
    p.outline(F, w=3.8, seed=SEED + 401, breaks=3)
    for sx in (-1, 1):
        x = sx * 86
        p.shape([[x - 30, 300], [x - 34, 380], [x + 30, 380], [x + 34, 300]], K.SKIN if sx < 0 else K.SKIN_SH, w=3.2, seed=SEED + 410 + sx)
        p.shape([[x - 50, 370], [x - 56, 404], [x + 70, 406], [x + 90, 384], [x + 40, 366]] if sx > 0 else
                [[x + 50, 370], [x + 56, 404], [x - 70, 406], [x - 90, 384], [x - 40, 366]], K.mix(K.RED, K.INK, 0.4), w=3.0,
                seed=SEED + 420 + sx)
    return p


def _head_part(**kw):
    return head(kw.get("expr", "neutral"), kw.get("look", (0, 0)))


def rig():
    return face.humanoid(SEED + 600, _torso, _legs, _head_part, hips_y=-400, shoulder=(160, -420),
                         head_pivot=(30, -430),
                         arm_kw=dict(upper=(200, 86, 74), fore=(190, 74, 60), sleeve=K.CREAM, cuff=K.CREAM_SH,
                                     hand_scale=0.8, hand_pose="hold"))


FORE_L = 190
NEUTRAL = {"armL": 0.15, "armR": -0.15, "foreL": -0.05, "foreR": 0.05, "head": 0.1}


def figure(expr="neutral", angles=None, look=(0, 0), hands=None) -> Pic:
    from ink.figure import reach
    a = dict(NEUTRAL)
    a.update(angles or {})
    r = rig()
    for side, tgt in (hands or {}).items():
        a = reach(r, dict(a, L2=FORE_L), side, tgt, bend=(1 if side == "L" else -1))
    return r.pose(a, expr=expr, look=look)
