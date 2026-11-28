"""RAMU, clerk 1. Short and round. Round wire spectacles, a cobalt eyeshade, oiled side tufts, a red pen behind the
ear, a cream shirt with red sleeve garters, high cobalt trousers. Expressions: neutral, blink, smug, shock, sheepish."""
import numpy as np

from ink.core import Pic, ell, arc
from ink import kit, face
from ink.figure import diag_shade
from ink import palette as K

SEED = 6300


def head(expr="neutral", look=(0.0, 0.0), seed=SEED) -> Pic:
    p = Pic()
    jaw = {"shock": 40}.get(expr, 0)
    L = [[0, -404], [-120, -396], [-178, -344], [-200, -262], [-212, -180], [-196, -92], [-140, -30], [-60, -2], [0, 4]]
    sk = face.jawdrop(face.sym(L), jaw, -150)
    for sx in (-1, 1):
        p.shape(ell(sx * 206, -228, 30, 44, 12), K.SKIN if sx < 0 else K.SKIN_SH, w=3.2, seed=seed + sx)
    p.shape([[178, -300], [262, -392], [282, -380], [200, -284]], K.RED, w=2.8, seed=seed + 5)          # pen
    p.fill([[262, -392], [282, -380], [292, -404], [272, -412]], K.GOLD, seed=seed + 6)
    face.face_base(p, sk, seed + 10, shade=((60, -460), (170, 40)),
                   lights=[ell(-130, -160, 46, 34, 12), ell(-60, -372, 60, 20, 12)],
                   shades=[ell(0, -300, 190, 40, 16), ell(0, -20 + jaw, 120, 22, 14)])
    p.ink(arc(0, -36 + jaw, 110, 26, 20, 160, 10), w=2.0, color=K.FINE, alpha=210, seed=seed + 11)      # double chin
    kit.pores(p, -120, -150, 40, 30, n=12, seed=seed + 12)
    kit.pores(p, 120, -150, 40, 30, n=12, seed=seed + 13)
    # oiled hair: a flat combed cap with strands, side tufts above the ears
    Hr = [[-176, -330], [-170, -386], [-110, -418], [0, -428], [110, -418], [170, -386], [176, -330], [130, -360],
          [0, -376], [-130, -360]]
    p.fill(Hr, K.INK, jit=1.2, seed=seed + 20)
    for i in range(6):
        x = -120 + i * 46
        p.ink([[x, -414], [x + 30, -372]], w=1.6, color=K.COBALT_L, alpha=170, taper=(0.3, 0.5), seed=seed + 21 + i)
    for sx in (-1, 1):
        kit.barbed(p, [[sx * 176, -330], [sx * 206, -300], [sx * 210, -262], [sx * 186, -270], [sx * 170, -300]],
                   seed=seed + 30 + sx, barbs=5, length=7, side=-sx)
    ex = {"sheepish": "neutral"}.get(expr, expr)
    lk = (0.8, 0.2) if expr == "sheepish" else look
    face.eyes(p, [-64, 64], -238, 0.9, ex, lk, seed + 40, bags=1)
    face.brows(p, [-66, 66], -300, 0.85, "shock" if expr == "sheepish" else expr, seed + 50, thick=0.7)
    # round spectacles: thin wire, lilac lenses, one glint
    for sx in (-1, 1):
        G = ell(sx * 64, -238, 52, 50, 20)
        p.fill(G, K.LILAC, alpha=60)
        p.ink(np.vstack([G, G[:1]]), w=3.2, taper=(0, 0), pressure=0.15, seed=seed + 60 + sx, smooth=False)
        kit.sparkle(p, sx * 64 - 22, -262, 0.5)
    p.ink([[-14, -244], [0, -252], [14, -244]], w=2.6, taper=(0, 0), seed=seed + 63)
    for sx in (-1, 1):
        p.ink([[sx * 116, -244], [sx * 196, -250]], w=2.4, taper=(0, 0.3), seed=seed + 64 + sx)
    face.nose(p, [[-16, -230], [-30, -176], [-46, -148], [-22, -130], [0, -136], [22, -130], [46, -148], [30, -176],
                  [16, -230]], seed + 70, nostrils=(18, -146, 6), tip=(-14, -156, 12), split_x=6)
    kind = {"neutral": "flat", "blink": "flat", "smug": "grin", "shock": "shock", "sheepish": "grin", "joy": "grin"}[expr]
    kit.mouth(p, 0, -92 + jaw * 0.6, 0.8 if kind != "grin" else (0.85 if expr == "smug" else 0.6), kind, seed=seed + 80)
    # the cobalt eyeshade: band + translucent brim over the brow
    p.shape([[-196, -340], [-150, -374], [0, -386], [150, -374], [196, -340], [150, -352], [0, -364], [-150, -352]],
            K.COBALT_D, w=3.0, seed=seed + 90)
    Br = [[-202, -338], [-150, -360], [0, -368], [150, -360], [202, -338], [176, -306], [0, -294], [-176, -306]]
    p.fill(Br, K.COBALT, alpha=200, seed=seed + 91)
    p.outline(np.asarray(Br, float), w=3.0, seed=seed + 92, breaks=2)
    return p


def _torso(**kw):
    p = Pic()
    T = [[-230, 0], [-262, -140], [-250, -270], [-210, -360], [-110, -404], [0, -412], [110, -404], [210, -360],
         [250, -270], [262, -140], [230, 0]]
    F = p.fill(T, K.CREAM, jit=1.4, seed=SEED + 300)
    diag_shade(p, F, K.CREAM_SH, (60, -460), (180, 40))
    p.outline(F, w=4.0, seed=SEED + 301, breaks=3)
    p.ink([[0, -400], [0, -150]], w=2.2, taper=(0.05, 0.3), seed=SEED + 302)
    for i in range(4):
        p.dot((10, -370 + i * 60), 5, K.CREAM_SH)
    C = [[-80, -414], [-10, -370], [-20, -330], [-90, -380]]
    p.shape(C, K.CREAM, w=2.8, seed=SEED + 303)
    p.shape([[80, -414], [10, -370], [20, -330], [90, -380]], K.CREAM_SH, w=2.8, seed=SEED + 304)
    # high cobalt trousers up over the belly + braces
    Tr = [[-238, -150], [-252, -60], [-240, 20], [240, 20], [252, -60], [238, -150], [0, -170]]
    TF = p.fill(Tr, K.COBALT, jit=1.2, seed=SEED + 310)
    diag_shade(p, TF, K.COBALT_D, (40, -220), (130, 60))
    p.outline(TF, w=3.8, seed=SEED + 311, breaks=2)
    for sx in (-1, 1):
        p.shape([[sx * 120, -404], [sx * 146, -404], [sx * 166, -150], [sx * 140, -150]], K.RED, w=2.6, seed=SEED + 320 + sx)
        p.dot((sx * 150, -160), 8, K.GOLD)
    return p


def _legs(**kw):
    p = Pic()
    for sx in (-1, 1):
        x = sx * 96
        Lg = [[x - 96, 0], [x - 92, 220], [x - 80, 300], [x + 80, 300], [x + 92, 220], [x + 96, 0]]
        F = p.fill(Lg, K.COBALT, jit=1.2, seed=SEED + 400 + sx)
        if sx > 0:
            diag_shade(p, F, K.COBALT_D, (x - 20, -10), (x + 30, 320))
        p.outline(F, w=3.6, seed=SEED + 401 + sx, breaks=2)
        Sh = [[x - 86, 296], [x - 96, 336], [x + 60, 340], [x + 104, 318], [x + 80, 292]]
        if sx < 0:
            Sh = [[-q[0] + 2 * x, q[1]] for q in Sh]
        p.shape(Sh, K.INK, w=3.0, seed=SEED + 410 + sx)
        p.ink([[x - 30, 300], [x + 20, 302]], w=2.0, color=K.COBALT_L, alpha=200, seed=SEED + 420 + sx)
    return p


def _head_part(**kw):
    return head(kw.get("expr", "neutral"), kw.get("look", (0, 0)))


def rig():
    r = face.humanoid(SEED + 600, _torso, _legs, _head_part, hips_y=-340, shoulder=(226, -330),
                      head_pivot=(0, -390),
                      arm_kw=dict(upper=(200, 104, 90), fore=(180, 90, 72), sleeve=K.CREAM, cuff=K.CREAM_SH,
                                  hand_scale=0.85, hand_pose="hold"))
    return r


def _garters(pic):
    return pic


FORE_L = 180
NEUTRAL = {"armL": 0.3, "armR": -0.3, "foreL": -0.1, "foreR": 0.1}


def figure(expr="neutral", angles=None, look=(0, 0), hands=None) -> Pic:
    """hands = {"L": (x, y), "R": (x, y)} wrist targets in character space (two-bone IK)."""
    from ink.figure import reach
    a = dict(NEUTRAL)
    a.update(angles or {})
    r = rig()
    for side, tgt in (hands or {}).items():
        a = reach(r, dict(a, L2=FORE_L), side, tgt, bend=(1 if side == "L" else -1))
    return r.pose(a, expr=expr, look=look)
