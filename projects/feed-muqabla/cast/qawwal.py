"""The qawwals of Feed ka Muqabla, from one parametric builder. They sit cross-legged: the rig's legs are a lap.
  bhejo   USTAD BHEJO, lead of Party Bhejo (push). Saffron kurta, gold sadri, a small saffron safa with a gold band and
          plume, a big black handlebar moustache, gold earrings. Loud, sure, hands up.
  maango  USTAD MAANGO, lead of Party Maango (pull). Emerald kurta, gold sadri, an embroidered emerald topi, a trimmed
          black beard, round gold spectacles. Calm, clever, one finger up.
  bc1/bc2 Party Bhejo's chorus clappers; mc1/mc2 Party Maango's (no headwear or small caps, party colours).
Expressions: neutral, blink, talk, joy, shock, smug. mouth_open 0..1 comes from the voice's word times."""
import numpy as np

from ink.core import Pic, ell, arc, rect, rng
from ink import kit, face
from ink.figure import diag_shade, reach
from ink import palette as K

SPEC = {
    "bhejo": dict(seed=21100, kurta=K.RED, vest=K.GOLD, hat="safa", hat_c=K.RED, tache="handlebar", beard=False, glasses=False, wide=1.06),
    "maango": dict(seed=21300, kurta=K.GREEN, vest=K.GOLD, hat="topi", hat_c=K.GREEN, tache="trim", beard=True, glasses=True, wide=1.0),
    "bc1": dict(seed=21500, kurta=K.RED_LI, vest=None, hat=None, tache="trim", beard=False, glasses=False, wide=0.96, hair="crop"),
    "bc2": dict(seed=21600, kurta=K.CREAM, vest=K.RED, hat="cap", hat_c=K.RED, tache="handlebar", beard=False, glasses=False, wide=1.02),
    "mc1": dict(seed=21700, kurta=K.GREEN_LI, vest=None, hat=None, tache=None, beard=True, glasses=False, wide=0.98, hair="curl"),
    "mc2": dict(seed=21800, kurta=K.CREAM, vest=K.GREEN, hat="cap", hat_c=K.GREEN, tache="trim", beard=False, glasses=False, wide=1.0),
}
FORE_L = 230


def _tache(p, kind, jaw, seed):
    if kind == "handlebar":
        for sx in (-1, 1):
            M = [[sx * 4, -172], [sx * 60, -180], [sx * 104, -160], [sx * 128, -186], [sx * 124, -214], [sx * 108, -206], [sx * 110, -182],
                 [sx * 92, -150], [sx * 56, -150], [sx * 4, -154]]
            p.fill(M, K.INK, jit=1.0, seed=seed + 70 + sx)
    elif kind == "trim":
        for sx in (-1, 1):
            M = [[sx * 4, -170], [sx * 52, -174], [sx * 76, -150], [sx * 46, -156], [sx * 4, -156]]
            p.fill(M, K.INK, jit=0.8, seed=seed + 74 + sx)


def head(spec, expr="neutral", look=(0.0, 0.0), mouth_open=0.0) -> Pic:
    sp = SPEC[spec] if isinstance(spec, str) else spec
    seed, wd = sp["seed"], sp["wide"]
    p = Pic()
    jaw = {"shock": 34}.get(expr, 0) + 24 * mouth_open
    L = [[0, -420], [-104 * wd, -412], [-150 * wd, -366], [-160 * wd, -286], [-154 * wd, -206], [-136 * wd, -140], [-104 * wd, -74],
         [-58 * wd, -16], [0, 0]]
    sk = face.jawdrop(face.sym(L), jaw, -150)
    for sx in (-1, 1):
        p.shape(ell(sx * 158 * wd, -262, 30, 46, 12), K.SKIN if sx < 0 else K.SKIN_SH, w=3.0, seed=seed + sx)
        if spec in ("bhejo", "maango") or sx < 0:
            p.dot((sx * 160 * wd, -214), 7, K.GOLD)
    if sp.get("hair") == "curl":                                         # curls behind the ears
        for k in range(7):
            a = np.pi * (0.1 + 0.8 * k / 6)
            p.shape(ell(-150 * wd * np.cos(a) * 1.1, -330 - 120 * np.sin(a), 34, 30, 10), K.INK, w=2.0, seed=seed + 5 + k, jit=0.6)
    face.face_base(p, sk, seed + 10, shade=((40, -480), (140, 40)),
                   lights=[[[-112 * wd, -226], [-86 * wd, -246], [-64 * wd, -222], [-88 * wd, -200]]], shades=[ell(0, -380, 140, 26, 14)])
    ex = {"talk": "neutral"}.get(expr, expr)
    face.eyes(p, [-50, 50], -292, 0.8, ex, look, seed + 20, bags=1)
    if sp["glasses"]:
        for sx in (-1, 1):
            G = ell(sx * 52, -292, 40, 36, 18)
            p.fill(G, K.LILAC, alpha=50)
            p.ink(np.vstack([G, G[:1]]), w=3.4, color=K.GOLD, taper=(0, 0), seed=seed + 24 + sx, smooth=False)
        p.ink([[-14, -296], [0, -304], [14, -296]], w=3.0, color=K.GOLD, taper=(0, 0), seed=seed + 27)
        kit.sparkle(p, 40, -312, 0.4)
    face.brows(p, [-52, 52], -340, 0.86, ex, seed + 30, thick=1.0)
    face.nose(p, [[-14, -300], [-22, -242], [-40, -202], [-24, -186], [0, -190], [24, -186], [40, -202], [22, -242], [14, -300]],
              seed + 40, nostrils=(18, -194, 6), tip=(-14, -208, 12), split_x=6)
    my = -128 + jaw * 0.45
    if sp["beard"]:                                                     # a trimmed beard that drops with the jaw
        B = [[-138 * wd, -170], [-128 * wd, -96 + jaw * 0.5], [-90 * wd, -30 + jaw], [-40, 6 + jaw], [0, 14 + jaw], [40, 6 + jaw],
             [90 * wd, -30 + jaw], [128 * wd, -96 + jaw * 0.5], [138 * wd, -170], [100 * wd, -130], [60, -104 + jaw * 0.4],
             [0, -96 + jaw * 0.4], [-60, -104 + jaw * 0.4], [-100 * wd, -130]]
        p.fill(B, K.INK, jit=1.2, seed=seed + 60)
        kit.barbed(p, B[:9], color=K.INK, seed=seed + 61, barbs=12, length=9, side=1)
    if expr == "talk" or mouth_open > 0.05:
        h = 10 + 44 * mouth_open
        O = ell(0, my + h * 0.4, 30 + 10 * mouth_open, h * 0.55, 14)
        p.fill(O, K.MOUTH)
        if mouth_open > 0.3:
            kit.teeth_row(p, -24, 24, my + 2, 10, 5, seed=seed + 50)
            p.fill(ell(0, my + h * 0.75, 18, h * 0.18, 10), K.TONGUE)
        p.outline(O, w=3.0, seed=seed + 51, breaks=2)
    else:
        kind = {"neutral": "flat", "blink": "flat", "joy": "grin", "shock": "shock", "smug": "grin"}.get(expr, "flat")
        kit.mouth(p, 0, my, 0.78, kind, seed=seed + 52)
    _tache(p, sp["tache"], jaw, seed)
    hat = sp["hat"]
    if hat == "safa":                                                   # a small saffron turban, gold band, plume
        T = [[-170, -366], [-190, -436], [-160, -516], [-80, -556], [20, -566], [116, -546], [180, -486], [190, -420], [168, -366],
             [80, -386], [0, -394], [-90, -386]]
        F = p.fill(T, sp["hat_c"], jit=2.0, seed=seed + 80)
        sub = Pic()
        sub.fill([[60, -620], [320, -620], [320, -300], [130, -300]], K.RED_SH, smooth=False)
        for i in range(4):
            y = -400 - i * 40
            sub.ink([[-220, y + 30], [-60, y - 8], [120, y - 26], [230, y - 44]], w=2.2, color=K.FINE, alpha=170, taper=(0.1, 0.2), seed=seed + 81 + i)
        sub.fill([[-200, -430], [200, -470], [200, -446], [-200, -406]], K.GOLD, smooth=False)
        p.clip(F, sub, smooth=False)
        p.outline(F, w=4.0, seed=seed + 86, breaks=4)
        p.shape(ell(-30, -462, 22, 24, 10), K.GOLD_LI, w=2.4, seed=seed + 87)               # the brooch
        p.ink([[-30, -486], [-60, -600], [-20, -680], [30, -700]], w=10, color=K.CREAM, taper=(0.3, 0.9), seed=seed + 88)   # plume
        p.ink([[-30, -486], [-56, -600], [-18, -676]], w=2.0, color=K.FINE, taper=(0.2, 0.8), seed=seed + 89)
    elif hat == "topi":                                                 # an embroidered pillbox cap
        T = [[-146, -376], [-150, -470], [-110, -508], [0, -518], [110, -508], [150, -470], [146, -376], [0, -392]]
        F = p.fill(T, sp["hat_c"], jit=1.2, seed=seed + 80)
        sub = Pic()
        sub.fill([[40, -560], [220, -560], [220, -340], [80, -340]], K.GREEN_SH, smooth=False)
        for k in range(9):
            x = -128 + k * 32
            sub.ink([[x, -470], [x + 10, -440], [x, -410]], w=3.0, color=K.GOLD, taper=(0, 0), seed=seed + 81 + k)
        sub.fill([[-160, -404], [160, -404], [160, -380], [-160, -380]], K.GOLD, smooth=False)
        p.clip(F, sub, smooth=False)
        p.outline(F, w=3.8, seed=seed + 92, breaks=3)
    elif hat == "cap":                                                  # a small boat cap (chorus)
        T = [[-140, -378], [-120, -456], [0, -478], [120, -456], [140, -378], [0, -396]]
        p.shape(T, sp["hat_c"], w=3.4, seed=seed + 80, jit=1.0)
        p.ink([[-120, -400], [0, -414], [120, -400]], w=2.0, color=K.GOLD, taper=(0.1, 0.1), seed=seed + 81)
    else:                                                               # hair
        Hh = [[-160 * wd, -300], [-170 * wd, -380], [-120, -456], [0, -474], [120, -456], [170 * wd, -380], [160 * wd, -300],
              [120, -380], [40, -404], [-60, -400], [-120, -372]]
        p.fill(Hh, K.INK, jit=1.6, seed=seed + 80)
    return p


def _torso(sp):
    def fn(**kw):
        p = Pic()
        sd = sp["seed"]
        T = [[-150, 30], [-158, -200], [-172, -420], [-186, -490], [-90, -526], [0, -532], [90, -526], [186, -490], [172, -420],
             [158, -200], [150, 30]]
        F = p.fill(T, sp["kurta"], jit=1.3, seed=sd + 300)
        diag_shade(p, F, K.mix(sp["kurta"], K.COBALT, 0.32), (30, -600), (140, 40))
        p.outline(F, w=4.0, seed=sd + 302, breaks=3)
        p.ink([[0, -520], [0, -330]], w=2.4, color=K.FINE, taper=(0.1, 0.2), seed=sd + 303)          # placket + buttons
        for k in range(4):
            p.dot((10, -500 + k * 44), 5, K.GOLD)
        if sp["vest"] is not None:                                      # the sadri (sleeveless jacket)
            for sx in (-1, 1):
                V = [[sx * 150, 0], [sx * 160, -410], [sx * 118, -500], [sx * 44, -380], [sx * 26, -30]]
                p.shape(V, sp["vest"], w=3.4, seed=sd + 310 + sx)
                kit.dash_rows(p, [[sx * 140, -360], [sx * 90, -300], [sx * 60, -200]], rows=2, gap=20, dash=5, step=20, w=2.0,
                              color=K.mix(sp["vest"], K.INK, 0.45), seed=sd + 312 + sx, tilt=0)
        # a garland of marigolds on the leads
        if sp.get("hat") in ("safa", "topi"):
            r = rng(sd + 320)
            for k in range(15):
                u = k / 14
                x = -120 + 240 * u
                y = -500 + 260 * np.sin(np.pi * u)
                p.dot((x, y), 17, K.RED if k % 2 else K.GOLD)
                p.dot((x + r.uniform(-4, 4), y - 4), 6, K.GOLD_LI)
        return p
    return fn


def _lap(sp):
    def fn(**kw):
        p = Pic()
        sd = sp["seed"]
        Lp = [[-290, 120], [-300, 40], [-240, -20], [-120, -50], [0, -40], [120, -50], [240, -20], [300, 40], [290, 120],
              [150, 132], [0, 126], [-150, 132]]
        F = p.fill(Lp, K.CREAM, jit=1.2, seed=sd + 400)
        diag_shade(p, F, K.CREAM_SH, (0, -80), (200, 160))
        p.outline(F, w=3.6, seed=sd + 401, breaks=3)
        for sx in (-1, 1):                                              # knees + a folded ankle
            p.ink(arc(sx * 190, 40, 90, 60, 200, 340, 9), w=2.2, color=K.FINE, alpha=200, seed=sd + 402 + sx)
        p.shape(ell(-60, 96, 70, 26, 12), K.SKIN_SH, w=2.6, seed=sd + 405)
        Hm = [[-160, -30], [-170, 60], [0, 80], [170, 60], [160, -30], [0, -20]]           # the kurta's hem over the lap
        Fh = p.fill(Hm, sp["kurta"], jit=1.0, seed=sd + 406)
        diag_shade(p, Fh, K.mix(sp["kurta"], K.COBALT, 0.32), (40, -40), (160, 90))
        p.outline(Fh, w=3.4, seed=sd + 407, breaks=2)
        return p
    return fn


_rigs = {}


def rig(name):
    if name not in _rigs:
        sp = SPEC[name]
        head_fn = lambda **kw: head(name, kw.get("expr", "neutral"), kw.get("look", (0, 0)), kw.get("mouth", 0.0))
        _rigs[name] = face.humanoid(sp["seed"] + 600, _torso(sp), _lap(sp), head_fn, hips_y=-130, shoulder=(172, -476),
                                    head_pivot=(0, -520),
                                    arm_kw=dict(upper=(250, 80, 70), fore=(FORE_L, 70, 58), sleeve=sp["kurta"], cuff=K.GOLD,
                                                hand_scale=0.8, hand_pose="open"))
    return _rigs[name]


NEUTRAL = {"armL": 0.25, "armR": -0.25, "foreL": -0.6, "foreR": 0.6}


def figure(name, expr="neutral", angles=None, look=(0, 0), hands=None, mouth=0.0, hand_pose=None) -> Pic:
    a = dict(NEUTRAL)
    a.update(angles or {})
    r = rig(name)
    for side, tgt in (hands or {}).items():
        a = reach(r, dict(a, L2=FORE_L), side, tgt, bend=(1 if side == "L" else -1))
    kw = {}
    if hand_pose:
        kw.update({"hand_" + k: v for k, v in hand_pose.items()})
    return r.pose(a, expr=expr, look=look, mouth=mouth, **kw)
