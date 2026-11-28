"""BHIMSEN, the pehelwan. Huge. Bald dome with a tiny choti, a barbed handlebar moustache, one gold tooth, jowls,
dash-row chest hair, a striped vest. Expressions: neutral, blink, smug, anger, shock, snore.
Local units, y down; the head's neck base is at (0, 0)."""
import numpy as np

from ink.core import Pic, ell, arc, mirror, catmull, affine
from ink import kit
from ink import palette as K

SEED = 4100


def _skull(jaw=0.0):
    """Pear-shaped mass: a small dome on a massive jaw and hanging jowls. `jaw` drops the lower face (px)."""
    L = np.array([[0, -600], [-92, -594], [-160, -566], [-204, -512], [-224, -444], [-232, -374], [-252, -304],
                  [-292, -232], [-320, -160], [-316, -88], [-276, -36], [-186, -4], [-84, 8], [0, 10]], float)
    R = mirror(L)[1:]
    R[:, 1] += np.clip((R[:, 1] + 250) / 250, 0, 1) * 12          # the right jowl hangs a little lower
    R[:, 0] += np.clip((R[:, 1] + 250) / 250, 0, 1) * 8
    P = np.vstack([L, R])
    if jaw:
        w = np.clip((P[:, 1] + 300) / 280, 0, 1)                    # below the nose, everything drops
        P[:, 1] += jaw * w
    return P


def head(expr="neutral", look=(0.0, 0.0), seed=SEED) -> Pic:
    p = Pic()
    jaw = {"shock": 58, "snore": 22, "anger": 10}.get(expr, 0)
    sk = _skull(jaw)
    # ears first (the head overlaps their inner half)
    for sx in (-1, 1):
        E = ell(sx * 226, -352, 52, 74, 14)
        p.shape(E, K.SKIN_SH if sx > 0 else K.SKIN, w=3.6, seed=seed + 5 + sx)
        p.ink(arc(sx * 232, -352, 26, 42, 100 if sx < 0 else -80, 260 if sx < 0 else 80, 8), w=1.8,
              color=K.FINE, alpha=210, seed=seed + 7 + sx)
    # the choti: a little ink flame on the dome
    p.fill([[-14, -606], [-6, -650], [14, -690], [20, -660], [12, -632], [16, -606]], K.INK, seed=seed + 9)
    # skull fill, then shade (one darker tone split by a hard diagonal: light from the upper left)
    H = p.fill(sk, K.SKIN, jit=2.2, seed=seed)
    sh = Pic()
    sh.fill([[70, -700], [420, -700], [420, 40], [205, 40]], K.SKIN_SH, smooth=False)
    sh.fill([[-150, -540], [-110, -574], [-40, -590], [-60, -560], [-120, -530]], K.SKIN_LI, jit=2.0, seed=seed + 15)   # bone catches the light (a hard-edged tone, not gloss)
    for sx in (-1, 1):                                                          # brows throw shade on the sockets
        sh.fill(ell(sx * 62, -392, 58, 26, 14), K.SKIN_SH, alpha=170)
    sh.fill(ell(0, -206 + jaw * 0.5, 150, 26, 16), K.SKIN_SH, alpha=190)          # the moustache throws shade
    sh.fill([[-270, -236], [-226, -256], [-190, -230], [-214, -200], [-262, -204]], K.SKIN_LI, jit=2.0, seed=seed + 16)  # cheek fat
    # second chin + jowl shading
    sh.fill(arc(0, -12 + jaw, 190, 40, 0, 180, 14).tolist() + [[-190, -12 + jaw]], K.SKIN_SH, alpha=200)
    p.clip(H, sh, smooth=False)
    p.outline(H, w=4.6, seed=seed + 1, breaks=4)
    # wrinkles that follow the skull (fine red, slightly see-through)
    for i, y in enumerate((-468, -494, -522)):
        p.ink(arc(0, y + 90, 126 - i * 14, 70, 215, 325, 9), w=1.8, color=K.FINE, alpha=200, seed=seed + 20 + i)
    kit.pores(p, -150, -250, 46, 34, n=14, seed=seed + 30)
    kit.pores(p, 150, -250, 46, 34, n=14, seed=seed + 31)
    kit.ticks(p, 0, -96 + jaw, 236, 66, n=190, length=9, angle=95, spread=30, seed=seed + 32, alpha=235)   # stubble
    kit.ticks(p, -250, -150 + jaw * 0.5, 40, 60, n=40, length=8, angle=100, seed=seed + 33, alpha=235)
    kit.ticks(p, 256, -150 + jaw * 0.5, 40, 60, n=40, length=8, angle=80, seed=seed + 34, alpha=235)
    # jowl folds from the nose wings
    for sx in (-1, 1):
        p.ink([[sx * 70, -300], [sx * 128, -230], [sx * 160, -150 + jaw * 0.6], [sx * 156, -96 + jaw * 0.8]],
              w=3.0, taper=(0.1, 0.5), seed=seed + 40 + sx)
        p.ink([[sx * 182, -140 + jaw * 0.6], [sx * 214, -92 + jaw * 0.8]], w=2.0, color=K.FINE, alpha=210,
              taper=(0.2, 0.5), seed=seed + 43 + sx)
    p.ink(arc(0, -34 + jaw, 150, 28, 20, 160, 11), w=2.2, color=K.FINE, alpha=210, seed=seed + 46)      # second chin
    for sx in (-1, 1):                                                         # cheek contour + crow's feet
        p.ink([[sx * 200, -300], [sx * 232, -250], [sx * 236, -200]], w=1.8, color=K.FINE, alpha=210, taper=(0.2, 0.5), seed=seed + 47 + sx)
        for k in range(3):
            p.ink([[sx * 96, -380 + k * 10], [sx * (116 + k * 4), -388 + k * 16]], w=1.4, color=K.FINE, alpha=200, taper=(0.2, 0.6), seed=seed + 140 + k + sx * 5)
    # eyes: small, crowded in the middle, with bags
    ex = "blink" if expr in ("blink", "snore") else expr
    for sx in (-1, 1):
        kit.bags(p, sx * 60, -372, 0.9, n=2, seed=seed + 50 + sx)
        kit.eye(p, sx * 60, -372, 1.0, ex, look, seed=seed + 60 + sx, side=sx)
        kit.brow(p, sx * 64, -418, 1.25, expr if expr != "snore" else "neutral", side=sx, seed=seed + 70 + sx, thick=1.4)
    # the nose: a big bulb, shaded on the right, a highlight on the tip
    N = [[-22, -392], [-28, -330], [-56, -290], [-60, -254], [-30, -236], [0, -244], [30, -236], [60, -254],
         [56, -290], [28, -330], [22, -392]]
    NP = p.fill(N, K.SKIN, jit=1.0, seed=seed + 80)
    ns = Pic()
    ns.fill([[8, -420], [100, -420], [100, -220], [40, -220]], K.SKIN_SH, smooth=False)
    ns.fill(ell(-16, -268, 13, 9, 10), K.SKIN_LI)
    p.clip(NP, ns, smooth=False)
    p.ink(catmull(np.array(N[1:-1], float)), w=3.6, taper=(0.2, 0.2), seed=seed + 81)
    for sx in (-1, 1):
        p.fill(ell(sx * 22, -252 - (6 if expr == "anger" else 0), 9 if expr == "anger" else 7, 6, 10), K.MOUTH)
    kit.pores(p, 0, -280, 34, 20, n=10, seed=seed + 82, r=1.0)
    # mouth (drawn before the moustache; a grin is wide enough to clear it)
    my = -196 + jaw * 0.55
    kind = {"neutral": "flat", "blink": "flat", "smug": "grin", "anger": "snarl", "shock": "shock",
            "snore": "o"}[expr]
    kit.mouth(p, 0, my, 1.32, kind, seed=seed + 90, gold=3 if kind in ("grin", "snarl", "shock") else None,
              wide=1.25 if kind == "grin" else 1.0)
    # handlebar moustache: solid ink, barbed lower edge, tips curled up (lifted on a grin)
    up = {"smug": -16, "anger": 8, "shock": 6}.get(expr, 0)
    for sx in (-1, 1):
        M = [[sx * 6, -246], [sx * 70, -252], [sx * 140, -238 + up], [sx * 196, -262 + up], [sx * 206, -296 + up],
             [sx * 186, -306 + up], [sx * 182, -282 + up], [sx * 150, -214 + up], [sx * 80, -204 + up * 0.5],
             [sx * 6, -214]]
        kit.barbed(p, M, seed=seed + 100 + sx, barbs=12, length=9, side=sx)
    if expr == "snore":
        for i, (x, y, s) in enumerate(((170, -470, 1.0), (215, -530, 1.3), (268, -600, 1.6))):
            p.ink([[x, y], [x + 28 * s, y], [x, y + 24 * s], [x + 28 * s, y + 24 * s]], w=3.0, taper=(0.05, 0.05),
                  seed=seed + 120 + i, smooth=False)
    return p


def neck() -> Pic:
    p = Pic()
    P = [[-190, 60], [-176, -80], [176, -80], [190, 60]]
    p.shape(P, K.SKIN, w=4.0, seed=SEED + 300)
    sh = Pic()
    sh.fill([[40, -100], [260, -100], [260, 80], [120, 80]], K.SKIN_SH, smooth=False)
    p.clip(catmull(np.array(P, float), closed=True), sh, smooth=False)
    return p


# ---------------- body ----------------
from ink.figure import Rig, limb, diag_shade, tube


def _torso(**kw):
    p = Pic()
    T = [[-370, 10], [-470, -170], [-482, -300], [-452, -410], [-404, -478], [-300, -520], [-214, -566], [0, -580],
         [214, -566], [300, -520], [404, -478], [452, -410], [482, -300], [470, -170], [370, 10]]
    F = p.fill(T, K.SKIN, jit=1.5, seed=SEED + 400)
    diag_shade(p, F, K.SKIN_SH, (150, -600), (300, 40))
    # chest hair in the scoop
    for i, row in enumerate(([[-120, -500], [-60, -440], [0, -420], [60, -440], [120, -500]],
                             [[-90, -460], [0, -380], [90, -460]])):
        kit.dash_rows(p, row, rows=2, gap=14, dash=10, step=15, w=2.0, seed=SEED + 410 + i, tilt=0.2)
    # the striped vest (cream, red stripes), scoop neck + straps, stretched over the belly
    V = [[-362, 14], [-462, -170], [-472, -300], [-444, -400], [-300, -486], [-262, -520], [-168, -526],
         [-150, -470], [-90, -380], [0, -350], [90, -380], [150, -470], [168, -526], [262, -520], [300, -486],
         [444, -400], [472, -300], [462, -170], [362, 14], [0, 44]]
    VF = p.fill(V, K.CREAM, jit=1.5, seed=SEED + 420)
    st = Pic()
    kit.stripes(st, -480, -560, 480, 20, every=46, width=17, color=K.RED, angle=0.04)
    st.fill([[150, -620], [700, -620], [700, 60], [300, 60]], K.COBALT, smooth=False, alpha=90)   # shade side
    p.clip(VF, st, smooth=False)
    p.outline(VF, w=4.2, seed=SEED + 421, breaks=4)
    for sx in (-1, 1):                                                                  # stretch folds
        p.ink([[sx * 300, -120], [sx * 200, -60], [sx * 120, -30]], w=2.2, color=K.FINE, alpha=210,
              taper=(0.2, 0.5), seed=SEED + 430 + sx)
    # red kamarband at the waist
    B = [[-372, 6], [0, 40], [372, 6], [366, 52], [0, 86], [-366, 52]]
    p.shape(B, K.RED, w=3.6, seed=SEED + 440, jit=1.2)
    p.fill([[352, 20], [392, 40], [412, 120], [380, 132], [356, 70]], K.RED_SH, seed=SEED + 441)   # knot at the hip
    p.outline(catmull(np.array([[352, 20], [392, 40], [412, 120], [380, 132], [356, 70]], float), closed=True),
              w=2.8, seed=SEED + 442, breaks=2)
    return p


def _legs(**kw):
    p = Pic()
    D = [[-388, 0], [-420, 200], [-400, 430], [-330, 500], [-200, 506], [-110, 470], [-40, 230], [0, 200],
         [40, 230], [110, 470], [200, 506], [330, 500], [400, 430], [420, 200], [388, 0]]
    F = p.fill(D, K.CREAM, jit=1.6, seed=SEED + 500)
    diag_shade(p, F, K.CREAM_SH, (90, -40), (240, 560))
    p.outline(F, w=4.2, seed=SEED + 501, breaks=4)
    for i, (a, b) in enumerate((((-300, 60), (-250, 420)), ((-180, 120), (-150, 450)), ((250, 60), (290, 420)),
                                ((150, 140), (180, 450)), ((-30, 60), (0, 190)))):
        p.ink([a, ((a[0] + b[0]) / 2 + 12, (a[1] + b[1]) / 2), b], w=2.4, color=K.FINE, alpha=220, taper=(0.2, 0.4),
              seed=SEED + 510 + i)
    for sx in (-1, 1):                                                                  # feet in chappals
        x = sx * 250
        p.shape([[x - 130, 560], [x - 120, 518], [x + 110, 512], [x + 140, 560]], K.mix(K.RED, K.INK, 0.4), w=3.4,
                seed=SEED + 520 + sx)
        Fo = [[x - 110, 530], [x - 92, 486], [x + 10, 476], [x + 104, 494], [x + 118, 532]]
        p.shape(Fo, K.SKIN if sx < 0 else K.SKIN_SH, w=3.4, seed=SEED + 530 + sx)
        for k in range(4):
            tx = x - 70 + k * 46
            p.ink([[tx, 506], [tx + 6, 530]], w=2.0, taper=(0.3, 0.3), seed=SEED + 540 + k)
    return p


def _upper(side):
    def fn(**kw):
        p = Pic()
        limb(p, (0, 0), (0, 310), 246, 190, K.SKIN, K.SKIN_SH, SEED + 600 + side, bulge=0.2, shade_side=-side)
        D = ell(side * 8, 10, 150, 128, 18)                                            # deltoid
        F = p.fill(D, K.SKIN, jit=1.4, seed=SEED + 605 + side)
        diag_shade(p, F, K.SKIN_SH, (side * 30, -200), (side * 70, 200)) if side > 0 else None
        n = len(F)
        seg = F[int(n * 0.55):int(n * 0.98)] if side < 0 else F[int(n * 0.52):int(n * 0.95)]
        p.ink(seg if side > 0 else F[np.r_[int(n * 0.5):n, 0:int(n * 0.05)]], w=3.8, taper=(0.1, 0.3),
              seed=SEED + 606 + side, smooth=False)
        p.ink([[-side * 60, 150], [-side * 20, 210], [side * 40, 230]], w=2.2, color=K.FINE, alpha=210,
              taper=(0.2, 0.5), seed=SEED + 607 + side)                                # bicep line
        kit.ticks(p, 0, 180, 60, 100, n=26, length=8, angle=90, seed=SEED + 610 + side)
        return p
    return fn


def _fore(side):
    def fn(**kw):
        p = Pic()
        limb(p, (0, -10), (0, 250), 196, 140, K.SKIN, K.SKIN_SH, SEED + 620 + side, bulge=0.1, shade_side=-side)
        kit.ticks(p, 0, 120, 50, 90, n=24, length=8, angle=90, seed=SEED + 630 + side)
        kit.hand(p, 0, 236, s=1.55, rot=np.pi, pose="fist", shade=side > 0, seed=SEED + 640 + side,
                 mirror_x=side > 0)
        return p
    return fn


def _head_part(**kw):
    p = Pic()
    p.add(head(kw.get("expr", "neutral"), kw.get("look", (0, 0))))
    return p


def rig() -> Rig:
    r = Rig()
    r.part("hips", None, (0, -560), lambda **kw: Pic(), z=0)
    r.part("legs", "hips", (0, 0), _legs, z=0)
    r.part("torso", "hips", (0, 0), _torso, z=1)
    r.part("head", "torso", (0, -560), _head_part, z=4)
    for side, name in ((-1, "L"), (1, "R")):
        r.part("arm" + name, "torso", (side * 420, -440), _upper(side), z=3)
        r.part("fore" + name, "arm" + name, (0, 290), _fore(side), z=2)
    return r


FORE_L = 250
NEUTRAL = {"armL": 0.22, "armR": -0.22, "foreL": -0.08, "foreR": 0.08}


def figure(expr="neutral", angles=None, look=(0, 0), hands=None) -> Pic:
    """hands = {"L": (x, y), "R": (x, y)} wrist targets in character space (two-bone IK)."""
    from ink.figure import reach
    a = dict(NEUTRAL)
    a.update(angles or {})
    r = rig()
    for side, tgt in (hands or {}).items():
        a = reach(r, dict(a, L2=FORE_L), side, tgt, bend=(1 if side == "L" else -1))
    return r.pose(a, expr=expr, look=look)
