"""Ek Baar Bheja, Do Baar Kata: the shot list as code. Shots hang on the voice's word times; rhythm cycles close-up /
wide / insert / reaction; something moves in every frame (rain, lamp, scale, ticker, crows, breathing, blinks)."""
import math
import numpy as np

from ink.core import Pic, affine, ell, rect, boxy
from ink import kit
from ink import palette as K
from cast import hariram, munshi, tara, mohan
from sets import village, line, city
from . import props as PR
from . import props2 as P2
from .engine import (Frame, S, E, P, Wd, TOTAL, cam, prog, eout, ein, spring, lerp, keys, glide, step, blinking,
                     shake, breathe, clamp)

BLINKY = ("neutral", "smug", "anger", "focus", "worry")


def actor(w, mod, x, y, s, t, expr, look=(0, 0), hands=None, angles=None, seed=0, rot=0.0, blink=True, br=0.006):
    e = "blink" if (blink and expr in BLINKY and blinking(t, seed)) else expr
    loc = {k: ((v[0] - x) / s, (v[1] - y) / s) for k, v in (hands or {}).items()} or None
    w.add(mod.figure(e, dict(angles or {}), look=look, hands=loc), affine(tx=x, ty=y, sx=s, sy=s * breathe(t, seed, br), rot=rot))


def taps(t, t0, t1, rate=7.0):
    """A telegraph key press value (0/1) from a deterministic dot-dash rhythm."""
    if not (t0 <= t < t1):
        return 0.0
    ph = ((t - t0) * rate) % 4
    return 1.0 if ph < 0.6 or 1.4 < ph < 2.6 else 0.0


def dots_at(t, t0, speed=0.32, n=7, start=0.0):
    out = []
    for k in range(n):
        u = start + (t - t0) * speed - k * 0.045
        out.append((u, k % 3 == 1))
    return out


# ---------------- village helpers ----------------
def _village(t, M, mexpr="neutral", mlook=(0, 0), hexpr="neutral", hlook=(0.5, 0), press=0.0, mhands=None, hhands=None,
             fr=None, blur=0.0, extra=None, show_h=True, show_m=True):
    fr = fr or Frame()
    w = Pic()
    w.add(village.room(t))
    if show_m:
        actor(w, munshi, 720, 1700, 0.6, t, mexpr, mlook, mhands, seed=3)
    w.add(village.counter(t))
    knob = village.key_arm(w, press)
    if extra:
        extra(w)
    if show_h:
        actor(w, hariram, 250, 1910, 0.76, t, hexpr, hlook, hhands, seed=1)
    fr.layer(w.transformed(M), blur=blur)
    village.board_text(fr, M)
    return fr, knob


def _city(t, M, texpr="neutral", tlook=(0, 0), mexpr="neutral", mlook=(-0.6, 0), drawer=0.0, thands=None, fr=None, blur=0.0,
          extra=None, show_mohan=True):
    fr = fr or Frame()
    w = Pic()
    w.add(city.room(t))
    win, O = city.window(t)
    sub = Pic()
    sub.add(win)
    if show_mohan:
        actor(sub, mohan, 830, 2010, 0.55, t, mexpr, mlook, seed=4)
    w.clip(O, sub, smooth=False)
    w.add(city.bars(t))
    actor(w, tara, 360, 1800, 0.55, t, texpr, tlook, thands, seed=2)
    w.add(city.desk(t, drawer))
    if extra:
        extra(w)
    fr.layer(w.transformed(M), blur=blur)
    return fr


# ======================= HOOK =======================
def sh_form(t):
    """'Hariram ne money order ek baar bheja,' The form slides in; ONE stamp slams on 'ek baar'."""
    ts = Wd("n01", 1, 4)
    fr = Frame()
    sx, sy = shake(t, ts, 0.25, 16, 1)
    bg = Pic()
    bg.add(village.build(t), cam(560, 1250, 1.8))
    fr.layer(bg, blur=14)
    M = cam(540, 960, 1.0 + 0.04 * (t - P("n01", 1)), 0.01 * math.sin(t * 2), sx, sy)
    w = Pic()
    xf = lerp(40, 540, eout(prog(t, P("n01", 1), P("n01", 1, 0.32))))
    P2.mo_form(w, xf, 980, 1.35, seed=10, rot=-0.04)
    kit.hand(w, xf - 380, 1130, s=2.0, rot=math.pi / 2 + 0.4, pose="hold", seed=11)
    if t >= ts - 0.12:
        u = eout(prog(t, ts - 0.12, ts))
        PR.stamp_mark(w, 560, lerp(600, 1060, u), 1.1, rot=-0.12, seed=12)
        kit.hand(w, 690, lerp(500, 960, u), s=2.2, rot=-0.3, pose="fist", seed=13, mirror_x=True)
    fr.layer(w.transformed(M))
    fr.text("MONEY ORDER", xf, 980 - 165 * 1.35, 54, K.CREAM, M=M)
    if t >= ts:
        fr.text("SENT", 560, 1060, 92, K.RED, rot=7, M=M, alpha=235)
    if ts <= t < ts + 0.2:
        fr.flash = 0.08 * (1 - prog(t, ts, ts + 0.2))
    return fr


def sh_passbook(t):
    """'aur paisa kat gaya do baar!' The khata: TWO -Rs 50 stamps; the balance falls to 0."""
    t1, t2 = Wd("n01", 2, 2), Wd("n01", 2, 4)
    fr = Frame()
    a, b = shake(t, t1, 0.22, 14, 2), shake(t, t2, 0.25, 18, 3)
    M = cam(540, 960, glide(t, [(P("n01", 2), 1.25), (S("n02"), 1.12)]), 0.015, a[0] + b[0], a[1] + b[1])
    w = Pic()
    w.fill(rect(-400, -400, 1500, 2400), K.mix(village.WOOD, K.INK, 0.2))
    kit.wood(w, -400, -400, 1500, 2400, plank=120, seed=20)
    rows = P2.passbook(w, 540, 960, 1.15, seed=21, rot=-0.02)
    for k, (tt, x0, y0) in enumerate(((t1, 660, rows[2] + 30), (t2, 660, rows[3] + 30))):
        if t >= tt:
            sc = lerp(3.0, 1.0, eout(prog(t, tt, tt + 0.13)))
            PR.stamp_mark(w, x0, y0, 0.62 * sc, rot=-0.1 + 0.08 * k, seed=22 + k)
    fr.layer(w.transformed(M))
    fr.text("Jama", 230, rows[1] + 30, 52, K.INK, font="kalam", M=M)
    fr.text("100", 420, rows[1] + 30, 56, K.INK, font="kalam", M=M)
    for k, (tt, y0) in enumerate(((t1, rows[2] + 30), (t2, rows[3] + 30))):
        if t >= tt:
            sc = lerp(3.0, 1.0, eout(prog(t, tt, tt + 0.13)))
            fr.text("- Rs 50", 660, y0, 60 * sc, K.RED, rot=5 - 4 * k, M=M, alpha=235)
    if t >= t2 + 0.35:
        fr.text("Bacha: 0", 330, rows[5] + 30, 60, K.RED, font="kalam", M=M, reveal=clamp((t - t2 - 0.35) / 0.4))
    return fr


# ======================= GAON =======================
def sh_village_wide(t):
    """'Gaon ka kisaan Hariram, bete Mohan ki college fees ke liye...' Hariram at the counter; a thought of Mohan."""
    t0 = S("n02")
    tb = P("n02", 1)
    M = cam(540, 1180, glide(t, [(t0, 1.05), (S("n03"), 1.12)]))
    fr, _ = _village(t, M, "neutral", (-0.6, 0.2), step(t, [(0, "neutral"), (tb + 0.4, "joy")]), (0.7, -0.3),
                     hhands={"R": (420, 1400)})
    if t >= tb:
        u = eout(prog(t, tb, tb + 0.35))
        w = Pic()
        P2.bubble(w, 470, 640, 0.95 * u + 0.05, seed=30)
        if u > 0.6:
            w.add(mohan.head("joy" if blinking(t, 9, 1.7) is False else "joy"), affine(tx=440, ty=720, sx=0.34))
            kit.digits(w, "50", 560, 560, 50, w=6, color=K.RED, seed=31)
        fr.layer(w.transformed(M))
    return fr


def sh_munshi_taps(t):
    """'aur post office mein Munshi-ji telegraph se sheher sandesh bhejte hain.' He taps the key; dots climb the wire."""
    t0 = S("n03")
    M = cam(860, 1200, glide(t, [(t0, 1.7), (E("n03"), 1.85)]))
    pr = taps(t, P("n03", 0, 1.0), E("n03") + 0.2)
    fr = Frame()
    fr, knob = _village(t, M, "smug", (0.6, 0.6), press=pr, mhands={"R": (980, 1290 + 12 * pr)}, show_h=False)
    w = Pic()
    for k in range(6):                                          # dots rising along the wire to the window
        u = ((t - t0) * 0.55 - k * 0.12) % 1.0
        x = lerp(1000, 880, u)
        y = lerp(1340, 380, u) + 30 * math.sin(u * 6)
        w.fill(ell(x, y, 26, 26, 12), K.GOLD_LI, alpha=80)
        if k % 3 == 1:
            w.fill(rect(x - 16, y - 5, x + 16, y + 5, 5), K.CREAM)
        else:
            w.fill(ell(x, y, 8, 8, 10), K.CREAM)
    fr.layer(w.transformed(M))
    return fr


# ======================= TAAR =======================
def sh_line(t):
    """'Aadha sandesh gaya hi tha, ki toofan mein taar toot gaya.' The message runs the wire; lightning; snap."""
    t0 = S("n04")
    tsn = P("n04", 1, 0.6)
    fr = Frame()
    sx, sy = shake(t, tsn, 0.35, 18, 4)
    M = cam(540, 960, glide(t, [(t0, 1.0), (E("n04"), 1.08)]), 0, sx, sy)
    fl = clamp(1 - (t - tsn) / 0.3) if t >= tsn else 0.0
    pl, path = line.build(t, dots=dots_at(t, t0, 0.28), snap=(t - tsn) if t >= tsn else None, flash=fl)
    fr.layer(pl.transformed(M))
    return fr


def sh_munshi_worry(t):
    """'Munshi-ji ghabra gaye: pahuncha ya nahi?' CU: the key silent, question marks."""
    t0 = S("n05")
    M = cam(720, 1180, glide(t, [(t0, 2.0), (P("n05", 2), 2.2)]))
    fr, _ = _village(t, M, step(t, [(0, "worry"), (P("n05", 1), "shock")]), (0.3, -0.4), show_h=False, blur=0)
    for k in range(3):
        tt = t0 + 0.3 + k * 0.35
        if t >= tt:
            sc = lerp(2.4, 1.0, eout(prog(t, tt, tt + 0.15)))
            fr.text("?", 560 + k * 140, 820 - k * 40 + 8 * math.sin(t * 5 + k), 120 * sc, K.INK, rot=10 - k * 10, M=M)
    return fr


def sh_resend(t):
    """'Toh unhone dobara bhej diya.' The wire knotted back; the SAME message runs again."""
    t0 = P("n05", 2)
    M = cam(540, 960, 1.02)
    fr = Frame()
    pl, _ = line.build(t, dots=dots_at(t, t0, 0.4), snap=2.0, mended=True)
    fr.layer(pl.transformed(M))
    return fr


# ======================= SHEHER =======================
def sh_city_twice(t):
    """'Sheher mein Tara ne dono sandesh padhe, aur Mohan ko paise do baar mil gaye.' Two slips, two payouts."""
    t0 = S("n06")
    tp = P("n06", 1)
    M = cam(560, 1180, glide(t, [(t0, 1.05), (S("n07"), 1.12)]))
    drawer = eout(prog(t, tp, tp + 0.3))
    h1, h2 = tp + 0.35, tp + 1.3
    hand = keys(t, [(0, (420, 1450)), (h1, (690, 1110)), (h1 + 0.45, (560, 1500)), (h2, (690, 1110)), (h2 + 0.45, (560, 1500))], dur=0.2)

    def extra(w):
        for k, tt in enumerate((t0 + 0.2, t0 + 0.9)):
            if t >= tt:
                y = lerp(1500, 1310, eout(prog(t, tt, tt + 0.3)))
                P2.slip(w, 330 + k * 60, y - k * 30, 0.7, seed=40 + k, rot=0.08 * (k - 0.5))
        for k, tt in enumerate((h1, h2)):
            if t >= tt:
                y = lerp(1500, 1160 - k * 60, eout(prog(t, tt, tt + 0.3)))
                P2.notes(w, 760 + k * 50, y, 0.7, n=3, seed=50 + k, rot=0.15 * k)

    me = step(t, [(0, "neutral"), (h1 + 0.2, "joy"), (h2 + 0.2, "smug")])
    return _city(t, M, step(t, [(0, "focus"), (tp, "neutral")]), (0.5, 0.2), me, (-0.6, 0.3), drawer, {"R": hand}, extra=extra)


def sh_hariram_shock(t):
    """'Aur gaon mein Hariram ke khaate se kat gaye sau rupaye.' Back in the village: the khata, the shock."""
    t0 = S("n07")
    tk = Wd("n07", 0, 3)
    M = cam(330, 1160, glide(t, [(t0, 1.6), (S("n08"), 1.75)]))

    def extra(w):
        P2.passbook(w, 470, 1290, 0.38, seed=60, rot=-0.3)

    fr, _ = _village(t, M, "worry", (-0.6, 0), step(t, [(0, "neutral"), (tk, "shock")]), (0.5, 0.5),
                     hhands={"R": (420, 1330), "L": (330, 1360)}, extra=extra)
    if t >= tk:
        sc = lerp(3.0, 1.0, eout(prog(t, tk, tk + 0.14)))
        fr.text("- Rs 100", 470, 1220, 54 * sc, K.RED, rot=-14, M=M)
    return fr


def sh_duplicate(t):
    """'Isi ko kehte hain duplicate request: retry zaroori tha, par retry ne hi nuksaan kar diya.'"""
    t0 = S("n08")
    td = P("n08", 0, 1.3)
    tn = P("n08", 1, 0.6)
    fr = Frame()
    M = cam(540, 960, glide(t, [(t0, 1.0), (E("n08"), 1.12)]))
    w = Pic()
    w.fill(rect(-400, -400, 1500, 2400), K.mix(city.WALL, city.LIT, 0.3))
    for k in range(2):
        x = lerp(-300 if k == 0 else 1400, 540, eout(prog(t, t0 + 0.2 + k * 0.4, t0 + 0.6 + k * 0.4)))
        P2.slip(w, x, 700 + k * 210, 1.5, seed=70 + k, rot=0.05 * (1 - 2 * k))
    if t >= td:
        sc = lerp(3.0, 1.0, eout(prog(t, td, td + 0.14)))
        PR.stamp_mark(w, 560, 1130, 1.25 * sc, rot=-0.06, seed=72)
    if t >= tn:
        P2.potli(w, 820, 1300, 0.9, full=1 - eout(prog(t, tn, tn + 0.5)), seed=73)
    fr.layer(w.transformed(M))
    for k in range(2):
        x = lerp(-300 if k == 0 else 1400, 540, eout(prog(t, t0 + 0.2 + k * 0.4, t0 + 0.6 + k * 0.4)))
        fr.text("Rs 50 > Mohan", x, 720 + k * 210, 50, K.INK, font="kalam", M=M)
    if t >= td:
        sc = lerp(3.0, 1.0, eout(prog(t, td, td + 0.14)))
        fr.text("DUPLICATE", 560, 1130, 74 * sc, K.RED, rot=3.4, M=M, alpha=235)
    return fr


# ======================= FIX =======================
def sh_number(t):
    """'Toh Munshi-ji ne har form par ek number likhna shuru kiya, receipt number 417,'"""
    t0 = S("n09")
    tw = P("n09", 1)
    fr = Frame()
    bg = Pic()
    bg.add(village.build(t), cam(700, 1200, 1.6))
    fr.layer(bg, blur=12)
    M = cam(lerp(540, 760, eout(prog(t, tw - 0.3, tw + 0.2))), lerp(960, 900, eout(prog(t, tw - 0.3, tw + 0.2))),
            glide(t, [(t0, 1.0), (tw, 1.0), (tw + 0.3, 1.6)]))
    w = Pic()
    bx, by = P2.mo_form(w, 540, 960, 1.35, seed=80)
    r = prog(t, tw + 0.1, P("n09", 1, edge="t1"))
    PR.pen(w, bx - 60 + 120 * r, by + 10, 1.0, rot=0.5, seed=81)
    fr.layer(w.transformed(M))
    fr.text("MONEY ORDER", 540, 960 - 165 * 1.35, 54, K.CREAM, M=M)
    fr.text("417", bx, by, 66, K.INK, font="kalam", M=M, reveal=r)
    return fr


def _register(t, M, rows, paid, fr=None, extra=None):
    fr = fr or Frame()
    w = Pic()
    w.fill(rect(-400, -400, 1500, 2400), city.WOOD)
    kit.wood(w, -400, -400, 1500, 2400, plank=110, seed=90)
    w.fill([[700, -400], [1500, -400], [1500, 2400], [300, 2400]], city.WOOD_SH, smooth=False, alpha=180)
    rowpos = PR.ledger(w, 540, 1000, 1.05, rows=rows, hi=-1, seed=91, night=True)
    for n, (tt, tag) in paid.items():
        if t >= tt:
            x, y = rowpos(n)
            sc = lerp(2.6, 1.0, eout(prog(t, tt, tt + 0.13)))
            PR.stamp_mark(w, x + 470, y + 22, 0.5 * sc, rot=-0.06, seed=92 + n)
    if extra:
        extra(w, rowpos)
    fr.layer(w.transformed(M))
    for n, (tt, tag) in paid.items():
        if t >= tt:
            x, y = rowpos(n)
            sc = lerp(2.6, 1.0, eout(prog(t, tt, tt + 0.13)))
            fr.text(tag, x + 470, y + 22, 46 * sc, K.RED, rot=3.4, M=M, alpha=235)
            fr.text("Mohan  Rs 50", x + 190, y + 22, 40, K.INK, font="kalam", M=M)
    return fr, rowpos


def sh_register(t):
    """'aur Tara ke paas ek register: jo number pehle hi paid hai, uska paisa dobara nahi milega.'"""
    t0 = S("n10")
    tpaid = P("n10", 1, 0.5)
    trej = P("n10", 2)
    M = cam(560, 900, glide(t, [(t0, 1.0), (tpaid, 1.25), (E("n10"), 1.3)]))

    def extra(w, rowpos):
        if t >= trej:                                           # the second 417 slip bounces off
            x, y = rowpos(417)
            k = t - trej
            bo = 120 * math.sin(min(1, k / 0.5) * math.pi) * math.exp(-k * 2.2)
            P2.slip(w, 1000 - bo * 0.6 + lerp(300, 0, eout(prog(t, trej, trej + 0.25))), y + 30 - bo, 0.7, seed=100, rot=-0.2)
    fr, rowpos = _register(t, M, range(414, 421), {417: (tpaid, "PAID")}, extra=extra)
    if t >= trej + 0.3:
        x, y = rowpos(417)
        fr.text("417 already PAID", 900, y - 60, 40, K.RED, M=M, rot=-6)
    return fr


def sh_confident(t):
    """'Ab taar toote toh bina dare dobara bhejo: number wahi hai,' The wire breaks again; the 417 tag rides the resend."""
    t0 = S("n11")
    tsn = t0 + 0.5
    fr = Frame()
    M = cam(540, 960, glide(t, [(t0, 1.0), (P("n11", 2), 1.08)]))
    mended = t > P("n11", 1)
    pl, path = line.build(t, dots=dots_at(t, t0 if not mended else P("n11", 1), 0.36), snap=(t - tsn) if t >= tsn else None,
                          mended=mended, flash=clamp(1 - (t - tsn) / 0.3) if t >= tsn else 0.0,
                          tag=(clamp((t - P("n11", 1)) * 0.36 - 0.02) if mended else clamp((t - t0) * 0.36), "417"))
    fr.layer(pl.transformed(M))
    return fr


def sh_once(t):
    """'toh paisa ek hi baar jaayega.' Mohan gets ONE stack; the duplicate is turned away."""
    t0 = P("n11", 2)
    M = cam(700, 1120, glide(t, [(t0, 1.55), (S("n12"), 1.65)]))

    def extra(w):
        if t >= t0 + 0.2:
            P2.notes(w, 780, lerp(1500, 1160, eout(prog(t, t0 + 0.2, t0 + 0.5))), 0.7, n=3, seed=110)

    return _city(t, M, "smug", (0.6, 0), step(t, [(0, "neutral"), (t0 + 0.4, "joy")]), (-0.5, 0.4), 1.0,
                 {"R": (690, 1150)}, extra=extra)


# ======================= TWIST =======================
def sh_new_form(t):
    """'Par agle mahine Hariram ghabra gaye, aur naya form bhar diya, naye number ke saath,'"""
    t0 = S("n12")
    tn = P("n12", 2)
    fr = Frame()
    if t < P("n12", 1):
        M = cam(300, 1120, glide(t, [(t0, 1.6), (P("n12", 1), 1.75)]))
        fr, _ = _village(t, M, "neutral", (-0.5, 0), "worry", (0.2, 0.6), hhands={"R": (420, 1340)})
        return fr
    bg = Pic()
    bg.add(village.build(t), cam(400, 1200, 1.6))
    fr.layer(bg, blur=12)
    M = cam(lerp(540, 760, eout(prog(t, tn - 0.2, tn + 0.2))), 900, glide(t, [(P("n12", 1), 1.0), (tn, 1.0), (tn + 0.3, 1.6)]))
    w = Pic()
    bx, by = P2.mo_form(w, 540, 960, 1.35, seed=120, rot=0.03)
    r = prog(t, tn + 0.05, P("n12", 2, edge="t1"))
    PR.pen(w, bx - 60 + 120 * r, by + 10, 1.0, rot=0.5, seed=121)
    kit.hand(w, bx - 40 + 120 * r, by + 220, s=1.6, rot=0.4, pose="hold", seed=122)
    fr.layer(w.transformed(M))
    fr.text("MONEY ORDER", 540, 960 - 165 * 1.35, 54, K.CREAM, M=M)
    fr.text("418", bx, by, 66, K.RED, font="kalam", M=M, reveal=r)
    return fr


def sh_paid_again(t):
    """'aur register ne use naya payment samjha,' 418 is a NEW row: PAID again."""
    t0 = S("n13")
    M = cam(560, 1000, glide(t, [(t0, 1.1), (P("n13", 1), 1.3)]))
    fr, rowpos = _register(t, M, range(414, 421), {417: (-1, "PAID"), 418: (t0 + 0.9, "PAID")})
    return fr


def sh_twice_again(t):
    """'toh paisa phir do baar gaya!' Hariram's shock; the khata stamped again."""
    t0 = P("n13", 1)
    t1, t2 = t0 + 0.25, t0 + 0.7
    M = cam(300, 1120, glide(t, [(t0, 1.7), (S("n14"), 1.85)]))
    a, b = shake(t, t1, 0.22, 12, 6), shake(t, t2, 0.22, 12, 7)
    M = M @ affine(tx=a[0] + b[0], ty=a[1] + b[1])
    fr, _ = _village(t, M, "shock", (-0.6, 0), "shock", (0.3, 0.2), hhands={"R": (420, 1100), "L": (90, 1100)})
    for k, tt in enumerate((t1, t2)):
        if t >= tt:
            sc = lerp(3.0, 1.0, eout(prog(t, tt, tt + 0.13)))
            fr.text("- Rs 50", 420 + k * 60, 820 + k * 90, 60 * sc, K.RED, rot=8 - 10 * k, M=M)
    return fr


# ======================= RULE =======================
def sh_rule(t):
    """'Asli rule: number ek baar banta hai, aur har retry pe wahi number jaata hai.' One form, three slips, all 417."""
    t0 = S("n14")
    fr = Frame()
    M = cam(540, 960, glide(t, [(t0, 1.0), (E("n14"), 1.06)]))
    w = Pic()
    w.fill(rect(-400, -400, 1500, 2400), K.mix(K.CREAM, K.COBALT, 0.25))
    P2.mo_form(w, 540, 560, 0.95, seed=130)
    starts = [P("n14", 2, 0.1 + 0.35 * k) for k in range(3)]
    for k, tt in enumerate(starts):
        if t >= tt:
            u = eout(prog(t, tt, tt + 0.35))
            P2.slip(w, lerp(540, 240 + k * 300, u), lerp(700, 1180, u), 0.95, seed=131 + k, rot=0.1 * (k - 1))
    fr.layer(w.transformed(M))
    fr.text("MONEY ORDER", 540, 560 - 165 * 0.95, 40, K.CREAM, M=M)
    fr.text("417", 540 + 215 * 0.95, 560 - 60 * 0.95, 50, K.INK, font="kalam", M=M)
    for k, tt in enumerate(starts):
        if t >= tt:
            u = eout(prog(t, tt, tt + 0.35))
            fr.text(f"retry {k + 1}: 417", lerp(540, 240 + k * 300, u), lerp(700, 1180, u) + 6, 40, K.INK, font="kalam", M=M)
    if t >= P("n14", 1):
        fr.text("ek baar banta hai", 540, 820, 52, K.RED, font="kalam", M=M, reveal=clamp((t - P("n14", 1)) / 0.6))
    return fr


def sh_key(t):
    """'Aaj ki bhasha mein ise idempotency key kehte hain.' The number becomes a brass key."""
    t0 = S("n15")
    fr = Frame()
    bg = Pic()
    bg.add(city.room(t), cam(540, 900, 1.3))
    fr.layer(bg, blur=14)
    M = cam(540, 960, glide(t, [(t0, 1.3), (t0 + 0.4, 1.0), (E("n15"), 1.06)]), 0.03 * math.sin(t * 1.5))
    w = Pic()
    u = spring(prog(t, t0, t0 + 0.4))
    P2.brass_key(w, 560, 900, 1.6 * u + 0.01, rot=-0.15, seed=140)
    fr.layer(w.transformed(M))
    if u > 0.8:
        kr = -0.15
        lx, ly = -145 * 1.6, 202 * 1.6
        fr.text("417", 560 + math.cos(kr) * lx - math.sin(kr) * ly, 900 + math.sin(kr) * lx + math.cos(kr) * ly, 60, K.INK,
                font="kalam", M=M, rot=-math.degrees(kr) + 3.6)
    if t >= P("n15", 0, 1.2):
        fr.text("IDEMPOTENCY KEY", 540, 560, 70, K.CREAM, M=M, reveal=clamp((t - P("n15", 0, 1.2)) / 0.5))
    return fr


def sh_header(t):
    """'Stripe jaise payment APIs mein ye ek header hai, Idempotency-Key, taaki retry pe paisa do baar na kate.'"""
    t0 = S("n16")
    th = P("n16", 1)
    fr = Frame()
    from .engine import font
    l1, l2 = "POST /v1/payments", "Idempotency-Key: 417"
    size = 60
    f = font("mono", size, 700)
    x2 = 540 - f.getlength(l2) / 2
    xh = x2 + f.getlength("Idempotency-Key") / 2
    bg = Pic()
    bg.add(city.room(t), cam(540, 900, 1.2))
    fr.layer(bg, blur=12)
    cx = glide(t, [(t0, 540), (th, 540), (th + 0.3, xh), (P("n16", 2, 0.4), 540)])
    z = glide(t, [(t0, 1.0), (th, 1.05), (th + 0.3, 1.7), (P("n16", 2, 0.4), 1.05)])
    M = cam(cx, glide(t, [(t0, 960), (th + 0.3, 1030), (P("n16", 2, 0.4), 960)]), z)
    w = Pic()
    L = eout(prog(t, t0, t0 + 0.8))
    PR.telegram(w, 540, 920, 1.12, length=L, seed=150, rows=2)
    if t >= th + 0.25:
        g = eout(prog(t, th + 0.25, th + 0.5))
        wd = f.getlength("Idempotency-Key")
        w.ink([[xh - wd / 2, 1082], [xh - wd / 2 + wd * g, 1084]], w=8, color=K.RED, taper=(0.05, 0.3), seed=151)
    fr.layer(w.transformed(M))
    fr.text(l1, 540, 940, size, K.INK, font="mono", weight=700, M=M, reveal=clamp(L * 1.15))
    fr.text(l2, 540, 1040, size, K.INK, font="mono", weight=700, M=M, reveal=clamp(L * 1.6 - 0.6))
    fr.text("docs.stripe.com: “safely retrying requests without accidentally performing the same operation twice”",
            540, 1190, 22, K.CREAM, font="archivo", weight=600, M=M, alpha=230 if L > 0.9 else 0)
    return fr


def sh_phone(t):
    """'Achhe payment systems bhi yahi karte hain: retry karo, par wahi key ke saath.' Today's app: processing,
    retry with the same key, paid once."""
    t0 = S("n17")
    tr, tk = P("n17", 1), P("n17", 2, 0.4)
    fr = Frame()
    bg = Pic()
    bg.add(city.build(t), cam(540, 1100, 1.3))
    fr.layer(bg, blur=14)
    M = cam(540, 980, lerp(1.5, 1.0, eout(prog(t, t0, t0 + 0.45))), 0.02 * math.sin(t))
    w = Pic()
    kit.hand(w, 470, 1520, s=2.0, rot=0.15, pose="hold", seed=160)
    PR.phone(w, 540, 980, 1.6, seed=161)
    kit.hand(w, 690, 1580, s=1.8, rot=-0.3, pose="hold", seed=162, mirror_x=True)
    spin = (t * 6) % (2 * math.pi)
    if t < tk:
        for k in range(8):
            a = spin + k * math.pi / 4
            w.fill(ell(540 + 70 * math.cos(a), 980 + 70 * math.sin(a), 10, 10, 8), K.COBALT, alpha=int(80 + 20 * k))
    else:
        u = spring(prog(t, tk, tk + 0.3))
        w.ink([[470, 990], [520, 1040], [620, 930]], w=18 * u + 1, color=K.mix(K.GOLD, K.INK, 0.2), taper=(0.1, 0.1), seed=163)
    fr.layer(w.transformed(M))
    fr.text("Payment", 540, 680, 44, K.CREAM, M=M)
    status = "Processing..." if t < tr else ("Retry 2 - key 417" if t < tk else "Paid once")
    fr.text(status, 540, 820, 50 if t < tr else (38 if t < tk else 64), K.INK, M=M)
    fr.text("Rs 50", 540, 1150, 70, K.INK, M=M)
    return fr


def sh_closing(t):
    """'Paisa ek hi baar katna chahiye, chahe sandesh kitni bhi baar jaaye.' Hariram smiles; one stamp; the key keeps tapping."""
    t0 = S("n18")
    M = cam(520, 1180, glide(t, [(t0, 1.15), (S("n19"), 1.3)]))
    pr = taps(t, t0, S("n19"), 9)

    def extra(w):
        P2.passbook(w, 470, 1300, 0.34, seed=170, rot=-0.25)

    fr, _ = _village(t, M, "smug", (0.5, 0.4), "joy", (0.3, 0), press=pr, mhands={"R": (980, 1290 + 12 * pr)},
                     hhands={"R": (420, 1330)}, extra=extra)
    fr.text("- Rs 50", 470, 1250, 34, K.RED, rot=-14, M=M)
    return fr


def sh_cta(t):
    """'Payment system ka pura design chahiye? Comment karo RETRY.' The key's tag flips to RETRY."""
    t0 = S("n19")
    tf = P("n19", 1)
    fr = Frame()
    bg = Pic()
    bg.add(city.build(t), cam(540, 1100, 1.3))
    fr.layer(bg, blur=14)
    M = cam(540, 960, glide(t, [(t0, 1.0), (S("n20"), 1.08)]))
    w = Pic()
    flip = abs(math.cos(math.pi * clamp((t - tf) / 0.3))) if tf <= t < tf + 0.3 else 1.0
    kr = -0.15 + 0.04 * math.sin(t * 2.2)
    P2.brass_key(w, 600, 760, 1.7, rot=kr, seed=180, flip=max(0.05, flip))
    fr.layer(w.transformed(M))
    lx, ly = -145 * 1.7, 202 * 1.7                                   # the tag centre, rotated with the key
    tagx = 600 + math.cos(kr) * lx - math.sin(kr) * ly
    tagy = 760 + math.sin(kr) * lx + math.cos(kr) * ly
    fr.text("RETRY" if t >= tf + 0.15 else "417", tagx, tagy, (60 if t >= tf + 0.15 else 70) * max(0.2, flip),
            K.RED if t >= tf + 0.15 else K.INK, M=M, rot=-math.degrees(kr) + 3.6)
    return fr


def sh_brand(t):
    """'Tech pe Trek...' The lamp-lit counter; the logo lands from oversize."""
    t0 = S("n20")
    fr = Frame()
    M = cam(540, 640, glide(t, [(t0, 1.3), (TOTAL, 1.38)]))
    w = Pic()
    w.add(city.room(t))
    fr.layer(w.transformed(M))
    tl = t0 + 0.05
    sc = lerp(3.2, 1.0, eout(prog(t, tl, tl + 0.3)))

    def logo(img, scale, sc=sc, show=t >= tl):
        if not show:
            return
        from PIL import Image as I, ImageDraw as D
        import pathlib
        lg = I.open(str(pathlib.Path(__file__).resolve().parents[1] / "public/brand/techpe-trek.jpg")).convert("RGBA")
        sz = int(330 * sc * scale)
        lg = lg.resize((sz, sz), I.LANCZOS)
        m = I.new("L", lg.size, 0)
        D.Draw(m).rounded_rectangle([0, 0, sz - 1, sz - 1], radius=int(sz * 0.18), fill=255)
        lg.putalpha(m)
        rgba = img.convert("RGBA")
        rgba.alpha_composite(lg, (int(540 * scale - sz / 2), int(760 * scale - sz / 2)))
        img.paste(rgba.convert("RGB"))

    fr.post.append(logo)
    return fr


# ======================= v2 COLD OPEN: real screen grabs =======================
import json as _json, pathlib as _pl
_ROOT = _pl.Path(__file__).resolve().parents[1]
RC = _ROOT / "public" / "receipts"
BOX = _json.loads((_ROOT / "docs" / "grab_boxes.json").read_text(encoding="utf-8"))


def _screen(cx, cy, s):
    return cx - 132 * s, cy - 250 * s, cx + 132 * s, cy + 262 * s


def _css(cx, cy, s, yoff=0.0):
    sx0, sy0, sx1, sy1 = _screen(cx, cy, s)
    sw = sx1 - sx0
    ih = sw * 880 / 412
    return lambda x, y: (sx0 + x * sw / 412, sy0 - yoff + y * ih / 880)


def phone_grab(fr, M, img_id, cx=540, cy=980, s=1.6, yoff=0.0, hands=True):
    """The inked phone with a REAL screenshot filling its screen (clipped to it). Returns css(x, y) -> world."""
    w = Pic()
    PR.phone(w, cx, cy, s, seed=300)
    fr.layer(w.transformed(M))
    sx0, sy0, sx1, sy1 = _screen(cx, cy, s)
    sw = sx1 - sx0
    ih = sw * 880 / 412
    iy0 = sy0 - yoff
    fr.image(RC / f"{img_id}.png", M, (sx0, iy0, sx1, iy0 + ih), clip_world=(sx0, sy0, sx1, sy1))
    if hands:
        hp = Pic()
        kit.hand(hp, cx - 150 * s / 1.6, cy + 640 * s / 1.6, s=1.5 * s / 1.6, rot=0.45, pose="hold", seed=301)
        kit.hand(hp, cx + 170 * s / 1.6, cy + 660 * s / 1.6, s=1.4 * s / 1.6, rot=-0.45, pose="hold", seed=302, mirror_x=True)
        fr.layer(hp.transformed(M))
    return _css(cx, cy, s, yoff)


def ring(w, a, b, u, seed=0, under=False):
    """A red marker ring (or underline) drawn on by u (0..1) around the world box a-b."""
    if u <= 0:
        return
    (x0, y0), (x1, y1) = a, b
    if under:
        w.ink([[x0, y1 + 6], [x0 + (x1 - x0) * u, y1 + 8]], w=9, color=K.RED, taper=(0.05, 0.3), seed=seed)
        return
    cx, cy, rx, ry = (x0 + x1) / 2, (y0 + y1) / 2, (x1 - x0) / 2 + 22, (y1 - y0) / 2 + 18
    n = max(3, int(40 * u))
    pts = [[cx + rx * math.cos(-2.6 + 6.6 * k / 40), cy + ry * math.sin(-2.6 + 6.6 * k / 40)] for k in range(n)]
    w.ink(pts, w=8, color=K.RED, taper=(0.05, 0.4), pressure=0.3, seed=seed, alpha=235)


def _box(css, img_id):
    b = BOX[img_id]["box"]
    return css(b["x"], b["y"]), css(b["x"] + b["width"], b["y"] + b["height"])


def _grab_bg(fr, t):
    bg = Pic()
    bg.add(city.room(t), cam(540, 900, 1.3))
    fr.layer(bg, blur=16)


def sh_grab_head(t):
    """'Train ticket ka paisa kat gaya, ticket mila nahi,' Paytm's own page; the headline gets ringed."""
    tr = P("h1", 1)
    fr = Frame()
    _grab_bg(fr, t)
    cy = lerp(1500, 980, eout(prog(t, 0.0, 0.3)))                       # frame 0 already sliding up
    sx, sy = shake(t, tr, 0.25, 12, 401)
    a, b = _box(_css(540, 980, 1.6), "paytm_head")
    fx, fy = (a[0] + b[0]) / 2, (a[1] + b[1]) / 2
    u = eout(prog(t, 0.25, 1.0))
    M = cam(lerp(540, fx, u), lerp(980, fy + 170, u), glide(t, [(0, 1.0), (0.3, 1.05), (1.0, 1.65), (P("h1", 2), 1.75)]), 0, sx, sy)
    css = phone_grab(fr, M, "paytm_head", cy=cy)
    a, b = _box(css, "paytm_head")
    w = Pic()
    ring(w, a, b, eout(prog(t, tr, tr + 0.35)), seed=402)
    fr.layer(w.transformed(M))
    return fr


def sh_grab_rebook(t):
    """'aur Paytm khud likhta hai: turant dobara book mat karna!' Punch-in on Paytm's own 'Do not rebook immediately.'"""
    t0, tp = P("h1", 2), P("h1", 3)
    fr = Frame()
    _grab_bg(fr, t)
    a, b = _box(_css(540, 980, 1.6), "paytm_rebook")
    fx, fy = (a[0] + b[0]) / 2, (a[1] + b[1]) / 2
    sx, sy = shake(t, tp, 0.3, 14, 403)
    z = glide(t, [(t0, 1.15), (tp, 1.3), (tp + 0.25, 2.3), (S("h2"), 2.4)])
    v = eout(prog(t, tp, tp + 0.25))
    M = cam(lerp(540, fx, v), lerp(980, fy, v), z, 0, sx, sy)
    css = phone_grab(fr, M, "paytm_rebook")
    a, b = _box(css, "paytm_rebook")
    w = Pic()
    ring(w, a, b, eout(prog(t, tp + 0.2, tp + 0.55)), seed=404, under=True)
    ring(w, (a[0] - 6, a[1] - 4), (b[0] + 4, b[1] + 6), eout(prog(t, tp + 0.5, tp + 0.9)), seed=405)
    fr.layer(w.transformed(M))
    return fr


def sh_grab_gpay(t):
    """'Google Pay bhi yahi kehta hai: ruko.' Google Pay's page, ringed; PhonePe's headline slides in behind."""
    t0, tr = S("h2"), P("h2", 1)
    fr = Frame()
    _grab_bg(fr, t)
    a, b = _box(_css(620, 1000, 1.5), "gpay_progress")
    fx, fy = (a[0] + b[0]) / 2, (a[1] + b[1]) / 2
    v = eout(prog(t, tr - 0.2, tr + 0.2))
    M = cam(lerp(560, fx, v), lerp(980, fy, v), glide(t, [(t0, 1.0), (tr - 0.2, 1.0), (tr + 0.2, 1.7), (P("h2", 2), 1.75)]))
    if t >= t0 + 0.4:                                                    # a second phone: PhonePe, tilted, behind
        u = eout(prog(t, t0 + 0.4, t0 + 0.8))
        Mb = M @ affine(tx=lerp(-700, 0, u), ty=60, rot=-0.12, px=330, py=900)
        phone_grab(fr, Mb, "phonepe_head", cx=330, cy=900, s=1.2, hands=False)
    css = phone_grab(fr, M, "gpay_progress", cx=620, cy=1000, s=1.5)
    a, b = _box(css, "gpay_progress")
    w = Pic()
    ring(w, a, b, eout(prog(t, tr, tr + 0.35)), seed=406)
    fr.layer(w.transformed(M))
    return fr


def sh_why(t):
    """'Kyun? Kyunki dobara pay matlab naya payment, aur paisa do baar kat sakta hai.' An inked phone: PAY, PAY -> two."""
    t0 = P("h2", 2)
    ta, tb, tc = Wd("h2", 3, 1), Wd("h2", 3, 4), P("h2", 4, 0.3)
    fr = Frame()
    _grab_bg(fr, t)
    M = cam(540, 960, glide(t, [(t0, 1.1), (S("n01"), 1.0)]))
    w = Pic()
    PR.phone(w, 540, 1000, 1.6, seed=410)
    for k, tt in enumerate((ta, tb)):
        if t >= tt:
            u = spring(prog(t, tt, tt + 0.25))
            y = 760 + k * 170
            w.shape(rect(360, y - 60 * u, 720, y + 60 * u, 14), K.CREAM, w=3.0, seed=411 + k, jit=0.4)
    tap = 0.0
    for tt in (ta, tb):
        if tt - 0.12 <= t < tt + 0.1:
            tap = 1.0
    kit.hand(w, 600, 1440 - 40 * tap, s=1.6, rot=-0.2, pose="point", seed=413, mirror_x=True)
    if t >= tc:
        for k in range(2):
            u = eout(prog(t, tc + 0.25 * k, tc + 0.25 * k + 0.4))
            w.shape(ell(lerp(540, 300 + 480 * k, u), lerp(1000, 1500, u), 40, 40, 16), K.GOLD, w=3.0, seed=414 + k)
    fr.layer(w.transformed(M))
    for k, tt in enumerate((ta, tb)):
        if t >= tt:
            y = 760 + k * 170
            fr.text(f"Payment {k + 1}: pending", 540, y, 34, K.INK, M=M)
            if t >= tc + 0.2 * k:
                sc = lerp(2.6, 1.0, eout(prog(t, tc + 0.2 * k, tc + 0.2 * k + 0.13)))
                fr.text("- Rs 50", 640, y + 6, 40 * sc, K.RED, rot=-8, M=M)
    fr.text("PAY", 540, 1268, 46, K.CREAM, M=M)
    return fr


def sh_1937(t):
    """'Ye problem 1937 mein bhi thi:' Zoom-whip into the village calendar."""
    t0 = S("n01")
    fr = Frame()
    u = eout(prog(t, t0, t0 + 0.5))
    M = cam(lerp(540, 630, u), lerp(1100, 650, u), lerp(1.0, 3.0, u))
    fr.layer(village.build(t).transformed(M))
    return fr


def cut():
    return [
        (0.0, sh_grab_head, False),
        (P("h1", 2), sh_grab_rebook, False),
        (S("h2"), sh_grab_gpay, True),
        (P("h2", 2), sh_why, True),
        (S("n01"), sh_1937, True),
        (P("n01", 1), sh_form, True),
        (P("n01", 2), sh_passbook, True),
        (S("n02"), sh_village_wide, True),
        (S("n03"), sh_munshi_taps, False),
        (S("n04"), sh_line, True),
        (S("n05"), sh_munshi_worry, True),
        (P("n05", 2), sh_resend, True),
        (S("n06"), sh_city_twice, True),
        (S("n07"), sh_hariram_shock, True),
        (S("n08"), sh_duplicate, True),
        (S("n09"), sh_number, True),
        (S("n10"), sh_register, True),
        (S("n11"), sh_confident, True),
        (P("n11", 2), sh_once, True),
        (S("n12"), sh_new_form, True),
        (S("n13"), sh_paid_again, True),
        (P("n13", 1), sh_twice_again, True),
        (S("n14"), sh_rule, True),
        (S("n15"), sh_key, False),
        (S("n16"), sh_header, False),
        (S("n17"), sh_phone, True),
        (S("n18"), sh_closing, True),
        (S("n19"), sh_cta, True),
        (S("n20"), sh_brand, False),
    ]


CUT = cut()


def shot_at(t):
    i = 0
    for k, (t0, fn, wh) in enumerate(CUT):
        if t >= t0:
            i = k
    return i


def events():
    ev = []
    for k, (t0, fn, wh) in enumerate(CUT):
        if wh and k:
            ev.append((t0 - 0.1, "whoosh", 0.55))
            ev.append((t0, "whip_hit", 0.7))
        elif k:
            ev.append((t0, "cut_tick", 0.75))
    ev += [(0.0, "slide", 0.5), (P("h1", 1), "marker", 0.6), (P("h1", 3), "stamp", 0.7), (P("h1", 3, 0.2), "marker", 0.6),
           (P("h2", 1), "marker", 0.6), (S("h2", 0.4), "slide", 0.4), (Wd("h2", 3, 1), "tap", 0.8), (Wd("h2", 3, 4), "tap", 0.8),
           (P("h2", 4, 0.3), "stamp", 0.8), (P("h2", 4, 0.5), "stamp", 0.8), (P("h2", 4, 0.3), "cash", 0.6), (S("n01"), "rewind", 0.7),
           (P("n01", 1), "slide", 0.5), (Wd("n01", 1, 4), "stamp", 0.9), (Wd("n01", 2, 2), "stamp", 0.85), (Wd("n01", 2, 4), "stamp", 0.9),
           (P("n02", 1, 0.0), "pop", 0.5), (P("n03", 0, 1.0), "morse", 0.55), (S("n04"), "morse", 0.5), (P("n04", 1, 0.6), "thunder", 0.95),
           (P("n04", 1, 0.6), "snap", 0.8), (S("n05", 0.3), "pop", 0.4), (S("n05", 0.65), "pop", 0.4), (S("n05", 1.0), "pop", 0.4),
           (P("n05", 2), "morse", 0.55), (S("n06", 0.2), "ticker", 0.6), (S("n06", 0.9), "ticker", 0.6), (P("n06", 1), "drawer", 0.6),
           (P("n06", 1, 0.35), "cash", 0.6), (P("n06", 1, 1.3), "cash", 0.6), (Wd("n07", 0, 3), "shock_sting", 0.85),
           (P("n08", 0, 1.3), "stamp", 0.9), (P("n08", 1, 0.6), "deflate", 0.6), (P("n09", 1, 0.1), "scratch", 0.5),
           (P("n10", 1, 0.5), "stamp", 0.8), (P("n10", 2), "boing", 0.8), (S("n11", 0.5), "snap", 0.7), (P("n11", 1), "morse", 0.55),
           (P("n11", 2, 0.2), "cash", 0.6), (P("n12", 2, 0.05), "scratch", 0.5), (S("n13", 0.9), "stamp", 0.8),
           (P("n13", 1, 0.25), "stamp", 0.85), (P("n13", 1, 0.7), "stamp", 0.85), (P("n13", 1), "shock_sting", 0.7),
           (P("n14", 2, 0.1), "pop", 0.5), (P("n14", 2, 0.45), "pop", 0.5), (P("n14", 2, 0.8), "pop", 0.5), (S("n15"), "key_chime", 0.8),
           (S("n16"), "teleprinter", 0.55), (P("n16", 1, 0.25), "marker", 0.5), (S("n17"), "beep", 0.45), (P("n17", 2, 0.4), "success", 0.7),
           (S("n18"), "morse", 0.45), (P("n19", 1, 0.15), "flip", 0.6), (S("n20", 0.05), "brand_sting", 0.75)]
    return sorted(ev)
