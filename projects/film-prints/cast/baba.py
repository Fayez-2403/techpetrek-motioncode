"""BIOSCOPE BABA, the narrator who chants. Lanky. A big bandhani turban (raspberry with lilac dots), a white barbed
beard and moustache, kohl-lined eyes, a gold kurta with a dark vest, a red cloth bag. His mouth flaps with the voice:
expressions neutral, blink, talk, joy, shock, smug."""
import numpy as np

from ink.core import Pic, ell, arc, rect
from ink import kit, face
from ink.figure import diag_shade
from ink import palette as K

SEED = 11100
WHITE = K.mix(K.CREAM, K.LILAC, 0.2)


def head(expr="neutral", look=(0.0, 0.0), seed=SEED, mouth_open=0.0) -> Pic:
    p = Pic()
    jaw = {"shock": 36}.get(expr, 0) + 26 * mouth_open
    L = [[0, -440], [-100, -432], [-146, -386], [-156, -300], [-150, -220], [-130, -150], [-110, -80], [-70, -20], [0, 0]]
    sk = face.jawdrop(face.sym(L), jaw, -160)
    for sx in (-1, 1):
        p.shape(ell(sx * 154, -270, 34, 50, 12), K.SKIN if sx < 0 else K.SKIN_SH, w=3.2, seed=seed + sx)
        p.dot((sx * 158, -224), 7, K.GOLD)                               # earrings
    face.face_base(p, sk, seed + 10, shade=((40, -500), (140, 40)),
                   lights=[[[-110, -230], [-84, -250], [-62, -226], [-86, -204]]], shades=[ell(0, -360, 140, 30, 14)])
    ex = {"talk": "neutral"}.get(expr, expr)
    face.eyes(p, [-50, 50], -300, 0.82, ex, look, seed + 20, bags=1)
    for sx in (-1, 1):                                                   # kohl: a thick lower lash line
        p.ink(arc(sx * 50, -300, 24, 14, 20, 160, 8), w=3.6, taper=(0.2, 0.3), seed=seed + 25 + sx)
    face.brows(p, [-52, 52], -344, 0.85, {"talk": "neutral"}.get(expr, expr), seed + 30, thick=0.9)
    face.nose(p, [[-14, -300], [-22, -240], [-40, -200], [-24, -184], [0, -188], [24, -184], [40, -200], [22, -240], [14, -300]],
              seed + 40, nostrils=(18, -192, 6), tip=(-14, -206, 12), split_x=6)
    # mouth: open with the voice (talk) - a dark oval that grows with mouth_open, under the beard
    my = -150 + jaw * 0.4
    if expr in ("talk",) or mouth_open > 0.05:
        h = 10 + 46 * mouth_open
        O = ell(0, my + h * 0.4, 30 + 10 * mouth_open, h * 0.55, 14)
        p.fill(O, K.MOUTH)
        if mouth_open > 0.3:
            kit.teeth_row(p, -24, 24, my + 2, 10, 5, seed=seed + 50)
        p.outline(O, w=3.0, seed=seed + 51, breaks=2)
    else:
        kind = {"neutral": "flat", "blink": "flat", "joy": "grin", "shock": "shock", "smug": "grin"}.get(expr, "flat")
        kit.mouth(p, 0, my, 0.8, kind, seed=seed + 52)
    # the white beard + moustache (barbed), dropping with the jaw
    B = [[-120, -150], [-96, -40 + jaw * 0.6], [-50, 40 + jaw], [0, 70 + jaw], [50, 40 + jaw], [96, -40 + jaw * 0.6], [120, -150],
         [80, -110], [40, -90 + jaw * 0.5], [0, -84 + jaw * 0.5], [-40, -90 + jaw * 0.5], [-80, -110]]
    kit.barbed(p, B, color=WHITE, seed=seed + 60, barbs=16, length=12, side=1)
    p.outline(np.array(B, float), w=1.8, seed=seed + 61, breaks=3, color=K.FINE)
    for sx in (-1, 1):
        M = [[sx * 4, -176], [sx * 60, -178], [sx * 100, -150], [sx * 96, -130], [sx * 56, -152], [sx * 4, -156]]
        kit.barbed(p, M, color=WHITE, seed=seed + 62 + sx, barbs=8, length=8, side=sx)
        p.outline(np.array(M, float), w=1.6, seed=seed + 64 + sx, breaks=2, color=K.FINE)
    # the bandhani turban
    T = [[-170, -360], [-198, -440], [-170, -530], [-80, -580], [20, -592], [120, -570], [190, -500], [200, -420], [176, -360],
         [80, -384], [0, -392], [-90, -384]]
    F = p.fill(T, K.RED, jit=2.2, seed=seed + 70)
    sub = Pic()
    sub.fill([[60, -640], [320, -640], [320, -300], [140, -300]], K.RED_SH, smooth=False)
    from ink.core import rng
    r = rng(seed + 71)
    for i in range(46):
        x, y = r.uniform(-190, 200), r.uniform(-590, -370)
        sub.dot((x, y), 4.0, K.CREAM, alpha=230)
    for i in range(4):
        y = -400 - i * 44
        sub.ink([[-220, y + 30], [-60, y - 8], [120, y - 26], [230, y - 44]], w=2.2, color=K.FINE, alpha=190, taper=(0.1, 0.2), seed=seed + 72 + i)
    p.clip(F, sub, smooth=False)
    p.outline(F, w=4.2, seed=seed + 76, breaks=4)
    p.shape([[150, -470], [210, -500], [250, -440], [224, -400], [180, -430]], K.RED_SH, w=3.2, seed=seed + 77)       # the turban's fan
    return p


def _torso(**kw):
    p = Pic()
    T = [[-150, 0], [-156, -200], [-168, -420], [-190, -500], [-90, -540], [0, -546], [90, -540], [190, -500], [168, -420],
         [156, -200], [150, 0]]
    F = p.fill(T, K.GOLD, jit=1.3, seed=SEED + 300)
    diag_shade(p, F, K.GOLD_SH, (30, -600), (140, 40))
    kit.dash_rows(p, [[-140, -120], [0, -100], [140, -120]], rows=2, gap=24, dash=6, step=22, w=2.2, color=K.RED, seed=SEED + 301, tilt=0)
    p.outline(F, w=4.0, seed=SEED + 302, breaks=3)
    V = [[-150, -40], [-160, -420], [-110, -500], [-40, -380], [-20, -60]]                              # the dark vest
    p.shape(V, K.COBALT_D, w=3.4, seed=SEED + 310)
    p.shape([[150, -40], [160, -420], [110, -500], [40, -380], [20, -60]], K.COBALT_D, w=3.4, seed=SEED + 311)
    p.ink([[-120, -500], [60, -260], [150, -80]], w=6, color=K.RED, taper=(0, 0), seed=SEED + 312)        # bag strap
    p.shape([[90, -140], [200, -150], [210, -20], [100, -10]], K.RED, w=3.2, seed=SEED + 313)
    return p


def _legs(**kw):
    p = Pic()
    for sx in (-1, 1):
        x = sx * 70
        Lg = [[x - 66, 0], [x - 60, 380], [x - 54, 640], [x + 54, 640], [x + 60, 380], [x + 66, 0]]
        F = p.fill(Lg, K.CREAM, jit=1.2, seed=SEED + 400 + sx)
        if sx > 0:
            diag_shade(p, F, K.CREAM_SH, (x - 10, -10), (x + 20, 660))
        p.outline(F, w=3.6, seed=SEED + 401 + sx, breaks=2)
        Sh = [[x - 56, 636], [x - 62, 672], [x + 70, 676], [x + 120, 650], [x + 60, 630]]
        if sx < 0:
            Sh = [[-q[0] + 2 * x, q[1]] for q in Sh]
        p.shape(Sh, K.mix(K.RED, K.INK, 0.4), w=3.0, seed=SEED + 410 + sx)
    return p


def _head_part(**kw):
    return head(kw.get("expr", "neutral"), kw.get("look", (0, 0)), mouth_open=kw.get("mouth", 0.0))


def rig():
    return face.humanoid(SEED + 600, _torso, _legs, _head_part, hips_y=-640, shoulder=(180, -490), head_pivot=(0, -540),
                         arm_kw=dict(upper=(310, 84, 74), fore=(290, 74, 60), sleeve=K.GOLD, cuff=K.RED, hand_scale=0.82,
                                     hand_pose="hold"))


FORE_L = 290
NEUTRAL = {"armL": 0.12, "armR": -0.12, "foreL": -0.05, "foreR": 0.05}


def figure(expr="neutral", angles=None, look=(0, 0), hands=None, mouth=0.0) -> Pic:
    from ink.figure import reach
    a = dict(NEUTRAL)
    a.update(angles or {})
    r = rig()
    for side, tgt in (hands or {}).items():
        a = reach(r, dict(a, L2=FORE_L), side, tgt, bend=(1 if side == "L" else -1))
    return r.pose(a, expr=expr, look=look, mouth=mouth)
