"""Berth 42: the shot list as code. Each shot hangs on the voice's word times (engine.S/E/P/Wd), returns a Frame
(layers with depth of field, signage text, flash). Shot rhythm cycles close-up / wide / insert / reaction; a second
character reacts in a quarter of the shots or more; something moves in every frame."""
import math
import numpy as np

from ink.core import Pic, affine, ell, rect, boxy
from ink import kit
from ink import palette as K
from cast import bhimsen, chhotu, ramu, shamu as shyamu, badebabu
from sets import compartment, office, platform
from . import props as PR
from .engine import (Frame, S, E, P, Wd, TOTAL, cam, prog, eout, ein, spring, lerp, keys, glide, step, blinking,
                     shake, breathe, clamp, FW, FH)

BLINKY = ("neutral", "smug", "anger", "stern", "sheepish")


def actor(w, mod, x, y, s, t, expr, look=(0, 0), hands=None, angles=None, seed=0, rot=0.0, blink=True, br=0.006):
    """Draw a character into world Pic w at (x, y) feet, scale s. hands: world wrist targets (two-bone IK)."""
    e = "blink" if (blink and expr in BLINKY and blinking(t, seed)) else expr
    loc = {k: ((v[0] - x) / s, (v[1] - y) / s) for k, v in (hands or {}).items()} or None
    fig = mod.figure(e, dict(angles or {}), look=look, hands=loc)
    w.add(fig, affine(tx=x, ty=y, sx=s, sy=s * breathe(t, seed, br), rot=rot))


def sway(t):                    # the train rocks
    return 0.006 * math.sin(t * 1.7) + 0.003 * math.sin(t * 4.1)


# ======================= ACT 1: RAAT (night) =======================
def sh_hook(t):
    """0-3.1 s. Two identical tickets slam together; two ASLI stamps land; then the whip."""
    fr = Frame()
    tB = Wd("n01", 0, 4)                   # "do ticket"
    tS1, tS2 = Wd("n01", 1, 1), Wd("n01", 1, 4)   # "dono", "asli"
    sx, sy = shake(t, tB, 0.3, 22, 1)
    a1, a2 = shake(t, tS1, 0.22, 12, 2), shake(t, tS2, 0.22, 12, 3)
    sx += a1[0] + a2[0]
    sy += a1[1] + a2[1]
    z = 1.0 + 0.05 * t
    M = cam(540, 960, z, 0.01 * math.sin(t * 2), sx, sy)
    bg = Pic()
    bg.add(compartment.build(t), cam(560, 1180, 2.0))
    fr.layer(bg, blur=16)
    w = Pic()
    # ticket A (Bhimsen's fist) already moving at frame 0
    xa = lerp(30, 360, eout(prog(t, 0.0, 0.32)))            # frame 0 is already sliding in
    kit.ticket(w, xa, 760, 2.7, rot=-0.16, seed=12)
    kit.hand(w, xa - 250, 880, s=2.7, rot=math.pi / 2 + 0.35, pose="fist", seed=11)
    if t >= tB - 0.16:
        xb = lerp(1450, 720, eout(prog(t, tB - 0.16, tB)))
        kit.ticket(w, xb, 1100, 2.7, rot=0.16, seed=14)
        kit.hand(w, xb + 260, 1190, s=2.1, rot=-math.pi / 2 - 0.3, pose="hold", seed=13, mirror_x=True)
    if tB <= t < tB + 0.35:                      # impact burst lines
        k = prog(t, tB, tB + 0.35)
        for i in range(10):
            a = i / 10 * 2 * math.pi
            r0, r1 = 180 + 260 * k, 260 + 380 * k
            w.ink([[540 + r0 * math.cos(a), 930 + r0 * math.sin(a)], [540 + r1 * math.cos(a), 930 + r1 * math.sin(a)]],
                  w=7, taper=(0.1, 0.8), seed=20 + i, alpha=int(255 * (1 - k)))
    for k_, (ts, x0, y0, rot) in enumerate(((tS1, 270, 905, -0.22), (tS2, 680, 1250, 0.14))):
        if t >= ts:
            u = eout(prog(t, ts, ts + 0.14))
            sc = lerp(3.2, 1.0, u)
            PR.stamp_mark(w, x0, y0, 0.8 * sc, rot=rot, seed=30 + k_)
            fr.text("ASLI", x0, y0, 88 * sc, K.RED, rot=-math.degrees(rot), M=M, alpha=235)
    fr.layer(w.transformed(M))
    if tB <= t < tB + 0.2:
        fr.flash = 0.1 * (1 - prog(t, tB, tB + 0.2))
    return fr


def _two(t, bexpr, cexpr, blook=(0.7, 0), clook=(-0.7, 0), cxyz=(540, 1180, 1.12), tickets=True):
    M = cam(cxyz[0] + 20 * math.sin(t * 0.5), cxyz[1], cxyz[2], sway(t))
    fr = Frame()
    w = Pic()
    w.add(compartment.build(t))
    BX, CX = 290, 815
    hb, hc = (585, 1210), (655, 1140)
    w.fill(ell(BX, 1860, 300, 34, 16), K.COBALT_D, alpha=120)
    w.fill(ell(CX, 1860, 190, 30, 16), K.COBALT_D, alpha=120)
    actor(w, bhimsen, BX, 1880, 0.62, t, bexpr, blook, {"R": hb} if tickets else None, seed=1)
    actor(w, chhotu, CX, 1880, 0.56, t, cexpr, clook, {"L": hc} if tickets else None, seed=2)
    if tickets:
        kit.ticket(w, hb[0] + 40, hb[1] - 70, 1.1, rot=-0.2 + 0.05 * math.sin(t * 9), seed=11)
        kit.ticket(w, hc[0] - 40, hc[1] - 66, 1.1, rot=0.2 + 0.05 * math.sin(t * 8 + 1), seed=12)
    fr.layer(w.transformed(M))
    return fr


def sh_twoshot(t):
    """'Raat ke do baje.' Whip-out reveal: nose to nose, tickets up, the train rocking."""
    t0 = S("n02")
    z = glide(t, [(t0, 1.6), (t0 + 0.5, 1.12), (Wd("n02", 1, 2), 1.16)])
    be = step(t, [(0, "anger"), (t0 + 0.7, "smug"), (t0 + 1.2, "anger")])
    ce = step(t, [(0, "shock"), (t0 + 0.5, "anger")])
    return _two(t, be, ce, cxyz=(540, 1180, z))


def sh_chhotu(t):
    """'Ek taraf dulha Chhotu, kal subah uski shaadi hai.' CU, he hugs the sehra box; dreams; worry."""
    t0 = Wd("n02", 1, 2)
    tj = P("n02", 2, 0.35)
    fr = Frame()
    z = glide(t, [(t0, 1.9), (S("n03"), 2.25)])
    M = cam(815, 1080, z, sway(t))
    bg = Pic()
    bg.add(compartment.build(t))
    actor(bg, bhimsen, 290, 1880, 0.62, t, "anger", (0.7, 0), seed=1)
    fr.layer(bg.transformed(M), blur=9)
    w = Pic()
    e = step(t, [(0, "anger"), (Wd("n02", 1, 2, 0.5), "neutral"), (tj, "joy"), (S("n03", -0.35), "shock")])
    lk = keys(t, [(0, (-0.6, 0)), (tj, (0.3, -0.8))])
    tilt = keys(t, [(0, 0.0), (tj, 0.12)])
    actor(w, chhotu, 815, 1880, 0.56, t, e, lk, {"L": (760, 1250), "R": (870, 1250)}, {"head": tilt}, seed=2)
    PR.sehra_box(w, 815, 1240, 0.9, seed=40)
    if t >= tj:                                    # little hearts of dream, drawn as ticks + dots
        for i in range(3):
            ph = (t - tj) * 0.8 + i * 0.33
            yy = 820 - (ph % 1) * 220
            w.fill(ell(700 + i * 50, yy, 12, 10, 10), K.RED, alpha=int(255 * (1 - ph % 1)))
    fr.layer(w.transformed(M))
    return fr


def sh_bhimsen(t):
    """'Doosri taraf Pehelwan Bhimsen, kal uska dangal hai.' Low angle; the flex snaps on; gold tooth glints."""
    t0 = S("n03")
    tf = P("n03", 0, 0.65)
    fr = Frame()
    z = glide(t, [(t0, 1.55), (S("n04"), 1.7)])
    M = cam(330, 1170, z, -0.03 + sway(t))
    w = Pic()
    w.add(compartment.build(t))
    flex = t >= tf
    u = spring(prog(t, tf, tf + 0.18))
    hR = lerp((560, 1450), (640, 1010), u) if flex else (560, 1450)
    hL = lerp((20, 1450), (-30, 1010), u) if flex else (20, 1450)
    e = step(t, [(0, "neutral"), (tf, "smug"), (P("n03", 1, 0.5), "smug")])
    actor(w, bhimsen, 290, 1880, 0.62, t, e, (0.4, -0.2), {"R": hR, "L": hL}, seed=1)
    ce = step(t, [(0, "anger"), (tf + 0.1, "shock")])
    actor(w, chhotu, 905, 1880, 0.56, t, ce, (-0.8, 0), seed=2)
    if flex:
        PR.motion_lines(w, 690, 1000, 1.0, 4, 90, angle=-0.6, seed=50)
        PR.motion_lines(w, -110, 1000, 1.0, 4, 90, angle=math.pi + 0.6, seed=51)
    fr.layer(w.transformed(M))
    return fr


def sh_badebabu(t):
    """'Bade Babu register kholte hain.' He walks in with the lantern, opens the register."""
    t0 = S("n04")
    fr = Frame()
    M = cam(540, 1160, 1.08, sway(t))
    w = Pic()
    w.add(compartment.build(t))
    bx = lerp(1350, 560, eout(prog(t, t0, t0 + 0.5)))
    bob = 10 * abs(math.sin((t - t0) * 9)) if t < t0 + 0.5 else 0
    actor(w, bhimsen, 140, 1880, 0.62, t, "anger", (0.8, 0), seed=1)
    actor(w, chhotu, 960, 1880, 0.56, t, "neutral", (-0.8, 0), seed=2)
    lan = (bx - 220, 960)
    bk = (bx + 120, 1290)
    actor(w, badebabu, bx, 1890 - bob, 0.6, t, "stern", (0, 0.2), {"L": (lan[0] + 6, lan[1] + 90), "R": (bk[0] - 20, bk[1] + 40)},
          seed=3)
    PR.lantern(w, lan[0], lan[1], 0.9, t, seed=60)
    op = eout(prog(t, P("n04", 0, 0.7), P("n04", 0, 0.95)))
    w.shape(rect(bk[0] - 90 - 70 * op, bk[1] - 60, bk[0] + 90, bk[1] + 60, 14), K.COBALT_D, w=3.6, seed=61, jit=0.6)
    if op > 0.2:
        w.shape(rect(bk[0] - 80 - 60 * op, bk[1] - 52, bk[0] + 80, bk[1] + 52, 14), K.CREAM, w=2.6, seed=62, jit=0.4)
    fr.layer(w.transformed(M))
    return fr


def sh_register_night(t):
    """'Register kehta hai:' insert by lantern light - row 42 holds TWO names."""
    t0 = P("n04", 1)
    fr = Frame()
    z = glide(t, [(t0, 1.0), (P("n04", 2), 1.5)])
    rowy = 1000 - 250 + 4 * 60 - 22
    M = cam(470, lerp(1000, rowy + 40, eout(prog(t, t0, P("n04", 2)))), min(z, 1.45), 0.02)
    w = Pic()
    w.fill(rect(-200, -200, 1300, 2200), K.mix(compartment.WOOD_SH, K.INK, 0.3))
    PR.ledger(w, 540, 1000, 1.05, light=K.SKIN_LI, seed=70, night=True)
    PR.lantern(w, 990, 600, 1.2, t, seed=71)
    fr.layer(w.transformed(M))
    y42 = 1000 + (-250 + 4 * 60 - 26) * 1.05
    fr.text("Chhotu", 360, y42, 54, K.INK, rot=2, font="kalam", weight=700, M=M)
    fr.text("Bhimsen", 700, y42, 54, K.INK, rot=-1, font="kalam", weight=700, M=M)
    return fr


def sh_triple_shock(t):
    """'dono sahi!' Punch-in: all three shock."""
    t0 = P("n04", 2)
    fr = Frame()
    z = keys(t, [(0, 1.3), (t0, 1.52)], dur=0.12, kind="ease")
    sx, sy = shake(t, t0, 0.25, 10, 5)
    M = cam(540, 1140, z, sway(t), sx, sy)
    w = Pic()
    w.add(compartment.build(t))
    up = spring(prog(t, t0, t0 + 0.16))
    actor(w, bhimsen, 230, 1880, 0.62, t, "shock", (0.5, 0), {"L": lerp((0, 1450), (60, 1080), up), "R": lerp((470, 1450), (420, 1060), up)},
          {"head": -0.06}, seed=1)
    actor(w, badebabu, 560, 1890, 0.6, t, "shock", (0, 0), seed=3)
    actor(w, chhotu, 880, 1880, 0.56, t, "shock", (-0.5, 0), {"L": lerp((780, 1400), (760, 1050), up), "R": lerp((980, 1400), (1000, 1050), up)},
          {"head": 0.06}, seed=2)
    fr.layer(w.transformed(M))
    return fr


# ======================= ACT 2: REWIND (10 AM office) =======================
def sh_rewind(t):
    """'Rewind.' Bade Babu's pocket watch spins backwards; zoom-whip into its face."""
    t0, t1 = S("n05"), P("n05", 1)
    fr = Frame()
    bg = Pic()
    bg.add(compartment.build(t), cam(540, 1100, 1.4))
    fr.layer(bg, blur=14)
    k = t - t0
    z = 1.0 + 3.2 * ein(prog(t, t1 - 0.2, t1))
    M = cam(540, 900, z, -k * 0.6)
    w = Pic()
    kit.hand(w, 540, 1300, s=2.2, rot=0.0, pose="hold", seed=80)
    mins = (-k * 900) % 60
    hrs = 10 + (-k * 15) % 12
    PR.pocket_watch(w, 540, 900, 2.1, hour=hrs, minute=mins, seed=81, blur_hands=1.0)
    for i in range(3):                                    # counter-clockwise whirl
        a0 = -k * 7 + i * 2.1
        w.ink([[540 + 330 * math.cos(a0 + j * 0.12), 900 + 330 * math.sin(a0 + j * 0.12)] for j in range(10)],
              w=5, taper=(0.1, 0.7), seed=82 + i, alpha=200)
    fr.layer(w.transformed(M))
    return fr


def sh_office_wide(t):
    """'Subah ke dus baje, Tatkal khulta hai.' Pull back from the clock: the office, the rush."""
    t0 = P("n05", 1)
    tk = P("n05", 2, 0.25)
    fr = Frame()
    u = eout(prog(t, t0, t0 + 0.7))
    M = cam(lerp(860, 540, u), lerp(250, 960, u), lerp(4.2, 1.0, u))
    surge = clamp((t - tk) / 0.3)
    w = office.build(t, surge=surge)
    fr.layer(w.transformed(M))
    fr.text("TATKAL", 540, 460, 84, K.CREAM, M=M)
    return fr


def _clerks(t, M, rexpr, sexpr, rlook=(0.3, 0.9), slook=(-0.3, 0.9), surge=0.0, hands_r=None, hands_s=None,
            blur_back=0.0, fr=None, clock=(10.0, 0.0)):
    fr = fr or Frame()
    back = Pic()
    back.add(office.room(t, clock))
    back.add(office.partition(t, surge))
    if blur_back:
        fr.layer(back.transformed(M), blur=blur_back)
        w = Pic()
    else:
        w = back
    actor(w, ramu, 300, 1700, 0.72, t, rexpr, rlook, hands_r or {"L": (250, 1420), "R": (440, 1440)}, seed=4)
    actor(w, shyamu, 790, 1840, 0.55, t, sexpr, slook, hands_s or {"L": (650, 1440), "R": (850, 1420)}, seed=5)
    w.add(office.desk(t))
    fr.layer(w.transformed(M))
    if not blur_back:
        fr.text("TATKAL", 540, 460, 84, K.CREAM, M=M)
    return fr


def sh_clerks(t):
    """'Andar do clerk, Ramu aur Shyamu.' Symmetric wide."""
    t0 = S("n06")
    M = cam(540 + 14 * math.sin(t), 1200, glide(t, [(t0, 1.08), (P("n06", 2), 1.14)]))
    re = step(t, [(0, "neutral"), (P("n06", 1, 0.1), "smug")])
    se = step(t, [(0, "neutral"), (P("n06", 1, 0.6), "smug")])
    return _clerks(t, M, re, se, rlook=(0.6, 0.2), slook=(-0.6, 0.2))


def sh_register_push(t):
    """'Register ek.' Push to the single register between them."""
    t0 = P("n06", 2)
    u = eout(prog(t, t0, t0 + 0.6))
    M = cam(540, lerp(1250, 1560, u), lerp(1.14, 2.0, u))
    return _clerks(t, M, "neutral", "neutral", rlook=(0.4, 1.0), slook=(-0.4, 1.0))


def sh_ramu_peer(t):
    """'Ramu dekhta hai:' CU - he leans in, specs glint."""
    t0 = S("n07")
    M = cam(310, 1160, glide(t, [(t0, 2.0), (Wd("n07", 0, 3), 2.3)]))
    return _clerks(t, M, step(t, [(0, "neutral"), (P("n07", 0, 0.5), "smug")]), "neutral", rlook=(0.2, 1.0),
                   blur_back=10, hands_r={"L": (230, 1420), "R": (430, 1430)})


def _row_insert(t, t0, t1, z0, z1, rot=0.0, pens=None, names=None, fr=None):
    fr = fr or Frame()
    y42 = 1000 + (-250 + 4 * 60 - 26) * 1.05
    M = cam(470, lerp(1000, y42, eout(prog(t, t0, t0 + 0.5))), glide(t, [(t0, min(z0, 1.45)), (t1, min(z1, 1.55))]), rot)
    w = Pic()
    w.fill(rect(-400, -400, 1500, 2400), office.WOOD)
    kit.wood(w, -400, 400, 1500, 1700, plank=110, seed=90)
    w.fill([[700, -400], [1500, -400], [1500, 2400], [300, 2400]], office.WOOD_SH, smooth=False, alpha=180)
    PR.ledger(w, 540, 1000, 1.05, seed=91)
    w.fill([[-400, 200], [300, 200], [1300, 1800], [500, 2200]], office.SUN, smooth=False, alpha=60)
    for (x, y, r, sd) in (pens or []):
        PR.pen(w, x, y, 1.2, rot=r, seed=sd)
    fr.layer(w.transformed(M))
    for (s, x, rv) in (names or []):
        fr.text(s, x, y42, 54, K.INK, rot=1.5, font="kalam", weight=700, M=M, reveal=rv)
    return fr, M, y42


def sh_row_empty(t):
    """'berth 42 khaali.' Insert: the row is empty, in the light."""
    t0 = Wd("n07", 0, 3)
    fr, M, y42 = _row_insert(t, t0, P("n07", 1), 1.25, 1.6)
    return fr


def sh_shyamu_peer(t):
    """'Usi second, Shyamu bhi dekhta hai:' mirror CU."""
    t0 = P("n07", 1)
    M = cam(800, 1150, glide(t, [(t0, 2.0), (E("n07"), 2.3)]))
    return _clerks(t, M, "neutral", step(t, [(0, "neutral"), (Wd("n07", 1, 4), "smug")]), slook=(-0.2, 1.0),
                   blur_back=10, hands_s={"L": (660, 1430), "R": (860, 1420)})


def sh_row_hover(t):
    """'khaali.' Both pens hover in from left and right over the same empty row."""
    t0 = E("n07", -0.35)
    u = eout(prog(t, t0, t0 + 0.4))
    y42 = 1000 + (-250 + 4 * 60 - 26) * 1.05
    hov = 8 * math.sin(t * 14)
    pens = [(lerp(-100, 330, u), y42 - 30 + hov, 0.55, 95), (lerp(1180, 750, u), y42 - 30 - hov, -0.55, 96)]
    fr, M, _ = _row_insert(t, t0, S("n08"), 1.6, 1.75, rot=0.04, pens=pens)
    return fr


def sh_pens_strike(t):
    """HERO: 'Ramu likhta hai: Chhotu. Shyamu likhta hai: Bhimsen.' Both nibs hit row 42 on the same frame."""
    t0 = S("n08")
    th = t0 + 0.22
    y42 = 1000 + (-250 + 4 * 60 - 26) * 1.05
    u = eout(prog(t, t0, th))
    r1 = prog(t, Wd("n08", 0, 3), Wd("n08", 0, 3, edge="t1") + 0.1)
    r2 = prog(t, Wd("n08", 1, 4), Wd("n08", 1, 4, edge="t1") + 0.1)
    xa = lerp(-80, 300, u) + 230 * r1
    xb = lerp(1160, 640, u) + 240 * r2
    pens = [(xa, y42 - 6, 0.5, 95), (xb, y42 - 6, -0.5, 96)]
    sx, sy = shake(t, th, 0.3, 16, 7)
    fr, M, _ = _row_insert(t, t0, E("n08"), 1.75, 1.95, pens=pens,
                           names=[("Chhotu", 400, r1), ("Bhimsen", 760, r2)])
    if t >= th:
        w = Pic()
        PR.splat(w, 300, y42 + 6, 0.9, t - th, seed=97)
        PR.splat(w, 640, y42 + 6, 0.9, t - th, seed=98)
        fr.layers.insert(1, (w.transformed(cam(470, y42, 1.45 + 0.1 * prog(t, t0, E("n08")), 0, sx, sy)), 0))
    if th <= t < th + 0.2:
        fr.flash = 0.11 * (1 - prog(t, th, th + 0.2))
    return fr


def sh_cheer(t):
    """'Dono ne padha, dono ne likha. Kisi ne roka nahi.' Wide: smug clerks, the crowd cheers, two tickets go out."""
    t0 = S("n09")
    fr = Frame()
    M = cam(540, 1180, glide(t, [(t0, 1.0), (S("n10"), 1.06)]))
    fr = _clerks(t, M, "smug", "smug", rlook=(0.6, -0.5), slook=(-0.6, -0.5), surge=0.9,
                 hands_r={"L": (250, 1420), "R": (470, lerp(1420, 1050, eout(prog(t, t0 + 0.3, t0 + 0.7))))},
                 hands_s={"L": (620, lerp(1420, 1050, eout(prog(t, t0 + 0.9, t0 + 1.3)))), "R": (850, 1420)})
    w = Pic()
    for k, (ts, x) in enumerate(((t0 + 0.3, 470), (t0 + 0.9, 620))):
        if t >= ts:
            y = lerp(1420, 1000, eout(prog(t, ts, ts + 0.5)))
            kit.ticket(w, x, y, 0.8, rot=0.2 * (k - 0.5), seed=100 + k)
    fr.layer(w.transformed(M))
    return fr


def sh_race(t):
    """'Isi ko kehte hain race condition.' The two pens gallop down row 42 like racehorses; the stamp lands."""
    t0 = S("n10")
    ts = Wd("n10", 0, 4)
    y42 = 1000 + (-250 + 4 * 60 - 26) * 1.05
    k = t - t0
    xa = 150 + 260 * k + 20 * math.sin(k * 3)
    xb = 150 + 260 * k + 20 * math.sin(k * 3 + 2)
    pens = [(xa, y42 - 70 - 30 * abs(math.sin(k * 11)), 0.3, 95), (xb, y42 + 20 - 30 * abs(math.sin(k * 11 + 1.6)), 0.3, 96)]
    fr, M, _ = _row_insert(t, t0, S("n11"), 1.5, 1.6, pens=pens, names=[("Chhotu", 400, 1), ("Bhimsen", 760, 1)])
    w = Pic()
    for i in range(6):                                    # dust puffs kicked up behind the pens
        ph = (k * 2 + i / 6) % 1
        w.fill(ell(xa - 60 - ph * 160, y42 - 10 + (i % 2) * 70, 14 + 30 * ph, 10 + 20 * ph, 10), K.CREAM_SH,
               alpha=int(200 * (1 - ph)))
    if t >= ts:
        u = eout(prog(t, ts, ts + 0.14))
        sc = lerp(3.0, 1.0, u)
        PR.stamp_mark(w, 540, y42 + 160, 1.6 * sc, rot=-0.08, seed=110)
        fr.text("RACE CONDITION", 540, y42 + 160, 62 * sc, K.RED, rot=4.6, M=M, alpha=235)
    sx, sy = shake(t, ts, 0.25, 12, 9)
    fr.layer(w.transformed(cam(470, y42, glide(t, [(t0, 1.45), (S("n11"), 1.55)]), 0, sx, sy)))
    return fr


# ======================= ACT 3: TAALA (the lock) =======================
BOARD = (360, 1100, 0.9)


def _board(t, locks, M, fr=None, bb=None, blur=0.0, extra=None):
    fr = fr or Frame()
    w = Pic()
    w.add(office.room(t))
    bx, by, bs = BOARD
    pos = PR.hook_board(w, bx, by, bs, locks=locks, seed=120)
    if extra:
        extra(w, pos)
    if bb:
        actor(w, badebabu, *bb)
    fr.layer(w.transformed(M), blur=blur)
    return fr, pos


def sh_slam(t):
    """'Bade Babu ka naya rule:' he slams a brass padlock onto hook 42."""
    t0 = S("n11")
    th = P("n11", 0, 0.55)
    sx, sy = shake(t, th, 0.3, 16, 11)
    M = cam(640, 1150, glide(t, [(t0, 1.25), (P("n11", 1), 1.4)]), 0, sx, sy)
    reachp = keys(t, [(0, (760, 1500)), (th - 0.2, (740, 900)), (th, (712, 1050))], dur=0.18)
    fr, pos = _board(t, {42: 0.0} if t >= th else {}, M,
                     bb=(990, 1890, 0.6, t, step(t, [(0, "stern"), (th, "smug")]), (-0.8, -0.3), {"L": reachp}, None, 3))
    if th <= t < th + 0.18:
        fr.flash = 0.08 * (1 - prog(t, th, th + 0.18))
    return fr


def sh_board_pull(t):
    """'har seat ka apna taala. Likhne se pehle, taala.' Pull out: a lock for every seat."""
    t0 = P("n11", 1)
    u = eout(prog(t, t0, t0 + 0.8))
    M = cam(lerp(702, 520, u), lerp(1040, 1120, u), lerp(2.2, 1.0, u))
    locks = {n: (0.0 if n == 42 else 1.0) for n in range(38, 47)}
    tap = P("n11", 2, 0.2)
    hand = keys(t, [(0, (780, 1500)), (tap, (760, 1060)), (tap + 0.35, (780, 1500))], dur=0.18)
    fr, pos = _board(t, locks, M, bb=(990, 1890, 0.6, t, step(t, [(0, "stern"), (tap, "smug")]), (-0.8, 0), {"L": hand}, None, 3))
    return fr


def sh_busy(t):
    """'Jiska taala pehle, seat uski. Doosre ko jawab: seat busy.' Ramu clicks 42 shut; Shyamu's pen bounces off BUSY."""
    t0 = S("n12")
    tc = t0 + 0.35
    tb = P("n12", 3, 0.05)
    M = cam(702, 1150, glide(t, [(t0, 1.9), (E("n12"), 2.1)]))
    shut = 1.0 - spring(prog(t, tc, tc + 0.2))
    fr = Frame()
    w = Pic()
    w.add(office.room(t))
    bx, by, bs = BOARD
    pos = PR.hook_board(w, bx, by, bs, locks={n: (shut if n == 42 else 1.0) for n in range(38, 47)}, seed=120)
    hx, hy = pos[42]
    kit.hand(w, hx - 120 + 40 * spring(prog(t, tc - 0.2, tc)), hy + 120, s=1.2, rot=0.9, pose="point", seed=130)
    if t >= tc:
        kit.sparkle(w, hx - 30, hy + 30, 1.2 * (1 - prog(t, tc, tc + 0.3)))
    # the BUSY tag on the lock + Shyamu's pen bouncing off it
    w.shape(boxy([[hx + 40, hy + 120], [hx + 170, hy + 110], [hx + 178, hy + 170], [hx + 48, hy + 182]], 10), K.RED, w=3, seed=131, jit=0.5)
    bo = 0.0
    if t >= tb:
        bo = 90 * math.sin(min(1, (t - tb) / 0.5) * math.pi) * math.exp(-(t - tb) * 2)
    px = lerp(1200, hx + 200, eout(prog(t, P("n12", 2), tb))) + bo
    PR.pen(w, px, hy + 150 - bo * 0.4, 1.1, rot=-1.0, seed=132)
    actor(w, shyamu, 1080, 2150, 0.55, t, step(t, [(0, "neutral"), (tb, "anger")]), (-0.9, 0.2), seed=5)
    fr.layer(w.transformed(M))
    fr.text("BUSY", hx + 110, hy + 146, 30, K.CREAM, rot=3, M=M)
    return fr


# ======================= ACT 4: TWIST =======================
def sh_ramu_leaves(t):
    """'Agle din Ramu taala lagata hai, aur...' He locks 42, smug, and strolls out."""
    t0 = S("n13")
    tl = Wd("n13", 1, 5)
    tw = Wd("n13", 1, 7, -0.45)
    M = cam(560, 1150, 1.2)
    shut = 1.0 - spring(prog(t, tl, tl + 0.2))
    fr = Frame()
    w = Pic()
    w.add(office.room(t))
    bx, by, bs = BOARD
    pos = PR.hook_board(w, bx, by, bs, locks={n: (shut if n == 42 else 1.0) for n in range(38, 47)}, seed=120)
    rx = 520 - (0 if t < tw else 900 * ein(prog(t, tw, tw + 0.5)))
    bob = 0 if t < tw else 14 * abs(math.sin((t - tw) * 12))
    hand = (pos[42][0] - 10, pos[42][1] + 70) if t < tl + 0.3 else (rx + 120, 1500)
    actor(w, ramu, rx, 1890 - bob, 0.8, t, "smug", (0.7, -0.2), {"R": hand}, seed=4)
    if t > tw:
        PR.motion_lines(w, rx + 220, 1200, 1.0, 5, 140, angle=0.0, seed=140)
    fr.layer(w.transformed(M))
    return fr


def sh_chai(t):
    """'...chai peene chala jaata hai.' The chai stall on the platform: slurp, bliss."""
    t0 = Wd("n13", 1, 7)
    fr = Frame()
    M = cam(420, 1250, glide(t, [(t0, 1.35), (S("n14"), 1.5)]))
    w = Pic()
    w.add(platform.build(t, train_t=0.0))
    sip = (t - t0) > 0.4
    g = (560, 1300) if sip else (600, 1480)
    actor(w, ramu, 460, 1900, 0.75, t, "joy" if sip else "smug", (0.4, 0), {"R": (g[0] + 6, g[1] + 40)}, seed=4)
    PR.chai_glass(w, g[0], g[1], 1.1, t, seed=150)
    fr.layer(w.transformed(M))
    return fr


def sh_empty(t):
    """'Aur wapas aata hi nahi.' The empty stool, the clock racing forward, 42 locked alone."""
    t0 = S("n14")
    k = t - t0
    hh = 10 + k * 2.6
    mm = (k * 2.6 * 60) % 60
    fr = Frame()
    M = cam(560, 1000, glide(t, [(t0, 1.0), (S("n15"), 1.12)]))
    w = Pic()
    w.add(office.room(t, clock=(hh, mm)))
    bx, by, bs = BOARD
    PR.hook_board(w, bx, by, bs, locks={n: (0.0 if n == 42 else 1.0) for n in range(38, 47)}, seed=120)
    PR.stool(w, 820, 1560, 0.9, seed=160)
    for i in range(14):                                   # dust in the light shaft
        ph = (k * 0.15 + i / 14) % 1
        w.dot((200 + i * 52 + 30 * math.sin(i + k), 400 + ph * 900), 3.0, K.CREAM, alpha=180)
    fr.layer(w.transformed(M))
    return fr


def sh_train_leaves(t):
    """'Train chali gayi.' The carriage pulls out; the dark window 42 slides past."""
    t0 = S("n15")
    fr = Frame()
    M = cam(540, 1050, 1.12)
    w = Pic()
    w.add(platform.build(t, train_t=(t - t0) * 3.2 - 0.4))
    fr.layer(w.transformed(M))
    return fr


def sh_empty_berth(t):
    """'Berth 42 raat bhar khaali, taala laga hi raha.' Night: the berth is empty, the padlock lies on it."""
    t0 = P("n15", 1)
    fr = Frame()
    M = cam(540, 1280, glide(t, [(t0, 1.25), (S("n16"), 1.45)]), sway(t))
    w = Pic()
    w.add(compartment.build(t))
    PR.padlock(w, 560, 1380, 0.9, 0.0, rot=0.3 * math.sin(t * 1.7) * 0.2, seed=170, tag="42")
    fr.layer(w.transformed(M))
    return fr


# ======================= ACT 5: RET-GHADI =======================
def _lock_cu(t, M, open_amt, top, attach=True, hand=None, fr=None):
    fr = fr or Frame()
    w = Pic()
    w.add(office.room(t))
    bx, by, bs = BOARD
    pos = PR.hook_board(w, bx, by, bs, locks={n: 1.0 for n in range(38, 47) if n != 42}, seed=120)
    hx, hy = pos[42]
    PR.padlock(w, hx, hy + 54 * bs, bs * 0.62, open_amt=open_amt, seed=171, tag="42",
               hourglass=(top if attach else None), t=t)
    if hand:
        kit.hand(w, *hand, s=1.3, pose="hold", seed=172, mirror_x=True)
    fr.layer(w.transformed(M))
    return fr, (hx, hy)


def sh_attach(t):
    """'Isliye ab har taale ke saath ek ret-ghadi.' A hand fixes a little sand timer to the lock."""
    t0 = S("n16")
    ta = t0 + 0.7
    bx, by, bs = BOARD
    M = cam(702, 1120, glide(t, [(t0, 2.6), (S("n17"), 2.8)]))
    if t < ta:
        fr, (hx, hy) = _lock_cu(t, M, 0.0, 1.0, attach=False)
        w = Pic()
        hp = lerp((1100, 1300), (hx + 40, hy + 160), eout(prog(t, t0, ta)))
        PR.hourglass_prop(w, hp[0] - 40, hp[1], 0.34, 1.0, t, seed=173)
        kit.hand(w, hp[0] + 40, hp[1] + 60, s=1.2, rot=-0.6, pose="hold", seed=174, mirror_x=True)
        fr.layer(w.transformed(M))
        return fr
    top = 1.0 - 0.15 * prog(t, ta, S("n17"))
    fr, _ = _lock_cu(t, M, 0.0, top)
    return fr


def sh_spring_open(t):
    """'Das minute mein payment nahi hua, toh taala khud khul jaata hai.' Sand runs out; the shackle springs open."""
    t0 = S("n17")
    to = P("n17", 1, 0.5)
    M = cam(702, 1130, glide(t, [(t0, 2.8), (to, 3.1), (S("n18"), 2.9)]))
    top = 0.85 * (1 - prog(t, t0, to))
    op = spring(prog(t, to, to + 0.3)) if t >= to else 0.0
    fr, (hx, hy) = _lock_cu(t, M, op, top)
    if t >= to:
        w = Pic()
        kit.sparkle(w, hx - 20, hy + 20, 1.4 * (1 - prog(t, to, to + 0.4)))
        fr.layer(w.transformed(M))
    return fr


def sh_telegram(t):
    """'Code mein yeh ek line hai. NX: ... EX 600: ...' The teleprinter strip unrolls with the real Redis line."""
    t0 = S("n18")
    fr = Frame()
    l1, l2 = "SET seat:42 chhotu", "NX EX 600"
    size = 74
    from .engine import font
    f = font("mono", size, 700)
    x2 = 540 - f.getlength(l2) / 2
    xnx = x2 + f.getlength("NX") / 2
    xex = x2 + f.getlength("NX ") + f.getlength("EX 600") / 2
    tn, te = P("n18", 1), P("n18", 3)
    cx = glide(t, [(t0, 540), (tn, 540), (tn + 0.3, xnx), (te, xnx), (te + 0.3, xex), (P("n18", 4, 0.6), 540)])
    z = glide(t, [(t0, 1.0), (tn, 1.05), (tn + 0.3, 2.0), (te, 2.0), (te + 0.3, 2.0), (P("n18", 4, 0.6), 1.1)])
    M = cam(cx, glide(t, [(t0, 960), (tn, 960), (tn + 0.3, 1040), (P("n18", 4, 0.6), 960)]), z)
    bg = Pic()
    bg.add(office.room(t), cam(540, 900, 1.2))
    fr.layer(bg, blur=12)
    w = Pic()
    L = eout(prog(t, t0, t0 + 0.8))
    PR.telegram(w, 540, 920, 1.12, length=L, seed=180, rows=2)
    for (tt, xc, wd) in ((tn, xnx, f.getlength("NX")), (te, xex, f.getlength("EX 600"))):
        if t >= tt + 0.25:
            g = eout(prog(t, tt + 0.25, tt + 0.5))
            w.ink([[xc - wd / 2 - 6, 1082], [xc - wd / 2 - 6 + (wd + 12) * g, 1084]], w=8, color=K.RED, taper=(0.05, 0.3), seed=181)
    fr.layer(w.transformed(M))
    fr.text(l1, 540, 940, size, K.INK, font="mono", weight=700, M=M, reveal=clamp(L * 1.15))
    fr.text(l2, 540, 1040, size, K.INK, font="mono", weight=700, M=M, reveal=clamp(L * 1.6 - 0.6))
    fr.text("redis.io/commands/set: “a simple way to implement a locking system”", 540, 1190, 27, K.FINE,
            font="archivo", weight=600, M=M, alpha=230 if L > 0.9 else 0)
    return fr


def sh_phone(t):
    """'Ticket app pe payment ka countdown dekha hai? Wahi ret-ghadi hai.' The time jump: today's phone."""
    t0 = S("n19")
    tw = P("n19", 1)
    fr = Frame()
    bg = Pic()
    bg.add(compartment.build(t), cam(540, 1100, 1.3))
    fr.layer(bg, blur=14)
    u = eout(prog(t, t0, t0 + 0.45))
    M = cam(540, 980, lerp(1.6, 1.0, u), 0.02 * math.sin(t))
    w = Pic()
    kit.hand(w, 470, 1520, s=2.0, rot=0.15, pose="hold", seed=190)
    PR.phone(w, 540, 980, 1.6, seed=191)
    pop = spring(prog(t, tw, tw + 0.3)) if t >= tw else 0.0
    PR.hourglass_prop(w, 540, 1150, 0.5 + 0.35 * pop, top=1 - 0.2 * prog(t, t0, TOTAL), t=t, seed=192)
    kit.hand(w, 690, 1580, s=1.8, rot=-0.3, pose="hold", seed=193, mirror_x=True)
    fr.layer(w.transformed(M))
    secs = max(0, 599 - int((t - t0)))
    fr.text("Complete payment", 540, 680, 40, K.CREAM, M=M)
    fr.text(f"{secs // 60:02d}:{secs % 60:02d}", 540, 860, 130, K.INK, M=M)
    fr.text("PAY", 540, 1268, 46, K.CREAM, M=M)
    return fr


def sh_closing(t):
    """'Seat ussi ki jiska taala pehle laga...' The closing button: both asleep, Chhotu's head on Bhimsen's shoulder."""
    t0 = S("n20")
    fr = Frame()
    M = cam(640, 1180, glide(t, [(t0, 1.4), (S("n21"), 1.55)]), sway(t))
    w = Pic()
    w.add(compartment.build(t))
    actor(w, bhimsen, 420, 1990, 0.62, t, "snore", (0, 0), {"R": (640, 1560), "L": (250, 1560)}, {"head": 0.1}, seed=1,
          blink=False, br=0.012)
    actor(w, chhotu, 990, 2270, 0.56, t, "asleep", (0, 0), None, {"head": -0.22, "armL": 0.5, "armR": -0.2}, seed=2,
          rot=-0.16, blink=False, br=0.01)
    fr.layer(w.transformed(M))
    return fr


def sh_cta(t):
    """'Ticket booking ka pura design chahiye? Comment karo SEAT.' The tag flips to SEAT."""
    t0 = S("n21")
    tf = P("n21", 1)
    fr = Frame()
    bg = Pic()
    bg.add(compartment.build(t), cam(540, 1100, 1.4))
    fr.layer(bg, blur=14)
    M = cam(540, 960, glide(t, [(t0, 1.0), (S("n22"), 1.1)]))
    w = Pic()
    PR.padlock(w, 470, 760, 2.0, 0.0, rot=0.06 * math.sin(t * 2.2), seed=200, tag="")
    flip = abs(math.cos(math.pi * clamp((t - tf) / 0.3))) if tf <= t < tf + 0.3 else 1.0
    T = boxy([[620, 1120], [940, 1080], [980, 1320], [660, 1370]], 14)
    w.add(Pic(), None) if False else None
    tag = Pic()
    tag.shape(T, K.CREAM, w=3.6, seed=201, jit=0.6)
    w.add(tag, affine(sx=flip, sy=1.0, px=800, py=1220) if flip < 1 else np.eye(3))
    fr.layer(w.transformed(M))
    fr.text("SEAT" if t >= tf + 0.15 else "42", 800, 1225, 110 * max(0.2, flip), K.RED if t >= tf + 0.15 else K.INK,
            rot=6, M=M)
    return fr


def sh_brand(t):
    """'Tech pe Trek...' The moonlit window; the logo lands from oversize; the poles keep streaming."""
    t0 = S("n22")
    fr = Frame()
    M = cam(540, 520, glide(t, [(t0, 1.55), (TOTAL, 1.62)]), sway(t))
    w = Pic()
    w.add(compartment.build(t))
    fr.layer(w.transformed(M))
    tl = t0 + 0.05
    u = eout(prog(t, tl, tl + 0.3))
    sc = lerp(3.2, 1.0, u)

    def logo(img, scale, sc=sc, show=t >= tl):
        if not show:
            return
        from PIL import Image as I
        lg = I.open(str(__import__("pathlib").Path(__file__).resolve().parents[1] / "public/brand/techpe-trek.jpg")).convert("RGBA")
        sz = int(330 * sc * scale)
        lg = lg.resize((sz, sz), I.LANCZOS)
        m = I.new("L", lg.size, 0)
        from PIL import ImageDraw as D
        D.Draw(m).rounded_rectangle([0, 0, sz - 1, sz - 1], radius=int(sz * 0.18), fill=255)
        lg.putalpha(m)
        img_rgba = img.convert("RGBA")
        img_rgba.alpha_composite(lg, (int(540 * scale - sz / 2), int(700 * scale - sz / 2)))
        img.paste(img_rgba.convert("RGB"))

    fr.post.append(logo)
    return fr


# ======================= the cut =======================
def cut():
    """(start, fn, whip) per shot. Shots start on spoken words; whips only between locations."""
    return [
        (0.0, sh_hook, False),
        (S("n02"), sh_twoshot, True),
        (Wd("n02", 1, 2), sh_chhotu, False),
        (S("n03"), sh_bhimsen, False),
        (S("n04"), sh_badebabu, False),
        (P("n04", 1), sh_register_night, False),
        (P("n04", 2), sh_triple_shock, False),
        (S("n05"), sh_rewind, True),
        (P("n05", 1), sh_office_wide, True),
        (S("n06"), sh_clerks, False),
        (P("n06", 2), sh_register_push, False),
        (S("n07"), sh_ramu_peer, False),
        (Wd("n07", 0, 3), sh_row_empty, False),
        (P("n07", 1), sh_shyamu_peer, False),
        (E("n07", -0.35), sh_row_hover, False),
        (S("n08"), sh_pens_strike, False),
        (S("n09"), sh_cheer, False),
        (S("n10"), sh_race, False),
        (S("n11"), sh_slam, True),
        (P("n11", 1), sh_board_pull, False),
        (S("n12"), sh_busy, False),
        (S("n13"), sh_ramu_leaves, False),
        (Wd("n13", 1, 7), sh_chai, True),
        (S("n14"), sh_empty, True),
        (S("n15"), sh_train_leaves, True),
        (P("n15", 1), sh_empty_berth, True),
        (S("n16"), sh_attach, True),
        (S("n17"), sh_spring_open, False),
        (S("n18"), sh_telegram, True),
        (S("n19"), sh_phone, True),
        (S("n20"), sh_closing, True),
        (S("n21"), sh_cta, False),
        (S("n22"), sh_brand, True),
    ]


CUT = cut()


def shot_at(t):
    i = 0
    for k, (t0, fn, wh) in enumerate(CUT):
        if t >= t0:
            i = k
    return i


def events():
    """Sound events from the picture's own moments (the mixer reads film/events.json)."""
    ev = []
    for k, (t0, fn, wh) in enumerate(CUT):
        if wh and k:
            ev.append((t0 - 0.1, "whoosh", 0.55))
            ev.append((t0, "whip_hit", 0.7))           # the whip lands on a hit
        elif k:
            ev.append((t0, "cut_tick", 0.75))          # a sharp hit so same-location cuts land on a sound
    ev += [(0.0, "slide", 0.5), (Wd("n01", 0, 4), "slap", 0.9), (Wd("n01", 1, 1), "stamp", 0.85),
           (Wd("n01", 1, 4), "stamp", 0.85), (P("n03", 0, 0.65), "tuba_hit", 0.8), (P("n03", 0, 0.7), "glint", 0.5),
           (S("n04"), "steps", 0.5), (P("n04", 0, 0.7), "book", 0.6), (P("n04", 2), "shock_sting", 0.8),
           (S("n05"), "rewind", 0.8), (P("n05", 1), "clock_bell", 0.55), (P("n05", 2, 0.25), "crowd_roar", 0.6),
           (S("n08", 0.22), "nib_hit", 1.0), (Wd("n08", 0, 3), "scratch", 0.5), (Wd("n08", 1, 4), "scratch", 0.5),
           (S("n09"), "crowd_cheer", 0.55), (S("n10"), "gallop", 0.6), (Wd("n10", 0, 4), "stamp", 0.85),
           (P("n11", 0, 0.55), "clunk", 1.0), (P("n11", 2, 0.2), "tap", 0.5), (S("n12", 0.35), "click", 0.8),
           (P("n12", 3, 0.05), "boing", 0.8), (Wd("n13", 1, 5), "click", 0.7), (Wd("n13", 1, 7, -0.45), "slide_whistle", 0.6),
           (Wd("n13", 1, 7, 0.4), "slurp", 0.7), (S("n14"), "tick_fast", 0.6), (S("n15"), "train_whistle", 0.7),
           (S("n15"), "chug", 0.6), (S("n16", 0.7), "click", 0.6), (S("n17"), "sand", 0.5),
           (P("n17", 1, 0.5), "spring", 0.9), (S("n18"), "teleprinter", 0.55), (P("n18", 1), "pop", 0.7), (P("n18", 1, 0.25), "marker", 0.5), (P("n18", 3), "pop", 0.7),
           (P("n18", 3, 0.25), "marker", 0.5), (S("n19"), "beep", 0.45), (P("n19", 1), "pop", 0.6),
           (S("n20"), "snore", 0.45), (P("n21", 1, 0.15), "flip", 0.6), (S("n22", 0.05), "brand_sting", 0.75)]
    return sorted(ev)
