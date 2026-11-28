"""Ek Film, Hazaar Copies: the shot list as code, in the bioscope-wala format. Bioscope Baba chants (lip-flap from the
voice's word times); the 1936 fable is seen through the box's brass porthole and opens with an iris; chapters arrive as
REEL 1-4 film-leader countdowns; the cold open and the CDN/TTL beats are REAL screen grabs inside an inked phone."""
import math, json, pathlib
import numpy as np

from ink.core import Pic, affine, ell, rect, boxy
from ink import kit
from ink import palette as K
from cast import baba, seth, censor, munni
from sets import mela, studio, india, cinema
from . import props as PR
from . import props3 as P3
from .engine import (Frame, S, E, P, Wd, TOTAL, cam, prog, eout, ein, spring, lerp, keys, glide, step, blinking,
                     shake, breathe, clamp, talk)

_ROOT = pathlib.Path(__file__).resolve().parents[1]
RC = _ROOT / "public" / "receipts"
BOX = json.loads((_ROOT / "docs" / "grab_boxes.json").read_text(encoding="utf-8"))
BLINKY = ("neutral", "smug", "stern", "talk")
BOXPOS = (620, 1300, 1.15)
HOLES = [(BOXPOS[0] + dx * BOXPOS[2], BOXPOS[1] + 20 * BOXPOS[2]) for dx in (-160, 0, 160)]


def actor(w, mod, x, y, s, t, expr, look=(0, 0), hands=None, angles=None, seed=0, rot=0.0, blink=True, br=0.006, mouth=0.0,
          squash=0.0):
    e = "blink" if (blink and expr in BLINKY and blinking(t, seed) and mouth < 0.05) else expr
    loc = {k: ((v[0] - x) / s, (v[1] - y) / s) for k, v in (hands or {}).items()} or None
    kw = {"mouth": mouth} if mod is baba else {}
    fig = mod.figure(e, dict(angles or {}), look=look, hands=loc, **kw)
    sy = s * breathe(t, seed, br) * (1 - 0.12 * squash)
    w.add(fig, affine(tx=x, ty=y, sx=s * (1 + 0.08 * squash), sy=sy, rot=rot))


def baba_talk(t):
    return talk(t)


# ---------------- real screen grabs in an inked phone ----------------
def _screen(cx, cy, s):
    return cx - 132 * s, cy - 250 * s, cx + 132 * s, cy + 262 * s


def _css(cx, cy, s):
    sx0, sy0, sx1, sy1 = _screen(cx, cy, s)
    sw = sx1 - sx0
    return lambda x, y: (sx0 + x * sw / 412, sy0 + y * sw * 880 / 412 / 880)


def phone_grab(fr, M, img_id, cx=540, cy=980, s=1.6, hands=True):
    w = Pic()
    PR.phone(w, cx, cy, s, seed=300)
    fr.layer(w.transformed(M))
    sx0, sy0, sx1, sy1 = _screen(cx, cy, s)
    ih = (sx1 - sx0) * 880 / 412
    fr.image(RC / f"{img_id}.png", M, (sx0, sy0, sx1, sy0 + ih), clip_world=(sx0, sy0, sx1, sy1))
    if hands:
        hp = Pic()
        kit.hand(hp, cx - 150 * s / 1.6, cy + 640 * s / 1.6, s=1.5 * s / 1.6, rot=0.45, pose="hold", seed=301)
        kit.hand(hp, cx + 170 * s / 1.6, cy + 660 * s / 1.6, s=1.4 * s / 1.6, rot=-0.45, pose="hold", seed=302, mirror_x=True)
        fr.layer(hp.transformed(M))
    return _css(cx, cy, s)


def ring(w, a, b, u, seed=0, under=False):
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


def grab_shot(t, t0, t1, img_id, tr, porthole=True, s=1.6, zoom_to=1.7, seed=400):
    """A real grab: the phone seen through the bioscope porthole, the camera punching onto the key sentence, a red ring."""
    fr = Frame()
    bg = Pic()
    bg.add(mela.build(t), cam(560, 1100, 1.2))
    fr.layer(bg, blur=16)
    a, b = _box(_css(540, 980, s), img_id)
    fx, fy = (a[0] + b[0]) / 2, (a[1] + b[1]) / 2
    v = eout(prog(t, tr - 0.25, tr + 0.15))
    M = cam(lerp(540, fx, v), lerp(980, fy, v), glide(t, [(t0, 1.0), (tr - 0.25, 1.05), (tr + 0.15, zoom_to), (t1, zoom_to + 0.06)]))
    css = phone_grab(fr, M, img_id, s=s)
    a, b = _box(css, img_id)
    w = Pic()
    ring(w, a, b, eout(prog(t, tr, tr + 0.35)), seed=seed)
    fr.layer(w.transformed(M))
    if porthole:
        r = lerp(900, 470, eout(prog(t, t0, t0 + 0.3)))
        fr.porthole = (540, 960, r)
    return fr


# ======================= COLD OPEN (the mela + real grabs) =======================
def sh_open(t):
    """'Dekho dekho, IPL dekho:' Baba chants and cranks; kids at the portholes; the camera pushes into the window."""
    tp = P("b01", 1)
    fr = Frame()
    z = glide(t, [(0, 1.0), (tp, 1.08), (P("b01", 2), 2.6)])
    v = eout(prog(t, tp, P("b01", 2)))
    M = cam(lerp(540, HOLES[1][0], v), lerp(1220, HOLES[1][1], v), z)
    w = Pic()
    w.add(mela.build(t))
    holes, knob = P3.bioscope(w, *BOXPOS, t=t, crank=t * 1.3, seed=5)
    actor(w, baba, 230, 1880, 0.62, t, "talk", (0.6, 0), {"R": knob}, seed=1, mouth=baba_talk(t))
    actor(w, munni, 880, 1960, 0.72, t, "joy", (-0.5, 0), seed=4)
    fr.layer(w.transformed(M))
    return fr


def sh_ipl(t):
    """'final ki raat JioHotstar pe 5.5 crore log, ek saath live dekho!' afaqs: 55 million peak concurrency."""
    return grab_shot(t, P("b01", 2), S("b02"), "afaqs_55", P("b01", 2, 1.0), zoom_to=2.05, seed=410)


def sh_blinkit(t):
    """'Dekho dekho, Blinkit dekho: 400 se zyada sheher, 2,700 se zyada stores,' Eternal's Blinkit page."""
    return grab_shot(t, S("b02"), P("b02", 4), "blinkit_stores", P("b02", 2), zoom_to=2.2, seed=420)


def sh_darkstore(t):
    """'dukaan tumhare mohalle mein dekho!' Business Today: dark stores across Blinkit, Instamart, Zepto..."""
    return grab_shot(t, P("b02", 4), S("b03"), "bt_dark", P("b02", 4, 0.3), zoom_to=1.6, seed=430)


def sh_bridge(t):
    """'Ye jaadu nahi, ek purana nuskha hai,' Baba, smug, taps the box."""
    t0 = S("b03")
    fr = Frame()
    M = cam(500, 1260, glide(t, [(t0, 1.35), (P("b03", 2), 1.45)]))
    w = Pic()
    w.add(mela.build(t))
    holes, knob = P3.bioscope(w, *BOXPOS, t=t, crank=0.2, seed=5)
    tap = keys(t, [(0, (420, 1500)), (P("b03", 1), (430, 1200)), (P("b03", 1, 0.3), (420, 1500))], dur=0.15)
    actor(w, baba, 230, 1880, 0.62, t, "talk", (0.5, -0.2), {"R": tap}, seed=1, mouth=baba_talk(t))
    fr.layer(w.transformed(M))
    return fr


def sh_peep(t):
    """'aao bioscope mein jhaanko, 1936 ka qissa hai!' Munni peeps in; we dive through the window."""
    t0 = P("b03", 2)
    fr = Frame()
    u = ein(prog(t, P("b03", 3), S("b04")))
    M = cam(lerp(800, HOLES[2][0], u), lerp(1290, HOLES[2][1], u), lerp(1.8, 7.0, u))
    w = Pic()
    w.add(mela.build(t))
    P3.bioscope(w, *BOXPOS, t=t, crank=t * 1.3, seed=5)
    actor(w, munni, 870, 1900, 0.72, t, step(t, [(0, "neutral"), (t0 + 0.6, "joy")]), (-0.9, 0), {"L": (760, 1330)}, seed=4)
    fr.layer(w.transformed(M))
    return fr


# ======================= REEL leaders =======================
def make_leader(n, title, t0, dur=0.9):
    def sh(t):
        fr = Frame()
        w = Pic()
        k = t - t0
        num = max(1, 3 - int(k / (dur / 3)))
        P3.leader(w, 1080, 1920, k * 3, n=num, seed=500 + n)
        fr.layer(w)
        fr.text(f"REEL {n}", 540, 380, 110, K.INK)
        fr.text(title, 540, 1560, 70, K.RED, font="kalam", weight=700)
        return fr
    return sh


# ======================= REEL 1: one reel, one city =======================
def sh_studio(t):
    """'Bombay ke Kamal Studio ne banayi ek film, poore desh ko Friday ko dekhni thi,' The iris opens on the studio."""
    t0 = S("b04", 0.9)
    fr = Frame()
    M = cam(520, 1300, glide(t, [(t0, 1.1), (S("b05"), 1.18)]))
    w = Pic()
    w.add(studio.build(t))
    actor(w, seth, 470, 1890, 0.6, t, step(t, [(0, "smug"), (P("b04", 1), "neutral")]), (-0.6, 0), {"L": (300, 1380)}, seed=2)
    fr.layer(w.transformed(M))
    studio.board_text(fr, M)
    fr.porthole = (540, 960, lerp(60, 1300, eout(prog(t, t0, t0 + 0.6))))
    return fr


def sh_mob(t):
    """'par reel bas ek, aur woh bhi Bombay mein, toh sab Bombay daude, aur studio pe mela lag gaya!'"""
    t0 = S("b05")
    tm = P("b05", 3)
    fr = Frame()
    sx, sy = shake(t, tm, 0.5, 16, 7)
    M = cam(lerp(560, 760, eout(prog(t, P("b05", 2), tm))), lerp(1300, 700, eout(prog(t, P("b05", 2), tm))),
            glide(t, [(t0, 1.15), (P("b05", 2), 1.2), (tm, 1.9)]), 0, sx, sy)
    mob = clamp((t - P("b05", 2)) / 0.6)
    w = Pic()
    w.add(studio.build(t, mob=mob))
    actor(w, seth, 470, 1890, 0.6, t, step(t, [(0, "neutral"), (P("b05", 2), "shock")]), (0.8, -0.6), seed=2,
          squash=spring(prog(t, P("b05", 2), P("b05", 2, 0.3))) * 0.5)
    fr.layer(w.transformed(M))
    studio.board_text(fr, M)
    return fr


# ======================= REEL 2: copies everywhere =======================
def sh_copies(t):
    """'Toh Seth-ji bole: copies banao,' Reels pop up around Seth, one per town."""
    t0 = S("b06", 0.8)
    fr = Frame()
    M = cam(520, 1250, glide(t, [(t0, 1.15), (P("b06", 2), 1.25)]))
    w = Pic()
    w.add(studio.build(t))
    actor(w, seth, 470, 1890, 0.6, t, "smug", (0.4, -0.3), {"R": (720, 1050)}, seed=2)
    for k in range(6):
        tt = P("b06", 1, 0.08 * k)
        if t >= tt:
            u = spring(prog(t, tt, tt + 0.25))
            a = -2.4 + k * 0.55
            P3.reel(w, 520 + 380 * math.cos(a), 1150 + 300 * math.sin(a), 0.32 * u + 0.01, a=t * 3 + k, seed=600 + k)
    fr.layer(w.transformed(M))
    studio.board_text(fr, M)
    return fr


def sh_map(t):
    """'har sheher ke cinema hall tak pahunchao!' The release routes draw themselves across India; vans run them."""
    t0 = P("b06", 2)
    fr = Frame()
    M = cam(lerp(400, 500, eout(prog(t, t0, S("b07")))), lerp(720, 760, eout(prog(t, t0, S("b07")))), glide(t, [(t0, 1.55), (S("b07"), 1.4)]))
    prog_ = {name: clamp((t - t0 - 0.1 * k) / 1.1) for k, name in enumerate(india.ROUTES)}   # all land before the cut
    w = india.build(t, progress=prog_)
    fr.layer(w.transformed(M))
    india.labels(fr, M)
    return fr


def sh_towns(t):
    """'Dekho dekho, Nagpur dekho, Patna dekho,' The towns pop as Baba names them."""
    t0 = S("b07")
    fr = Frame()
    hl = []
    if t >= P("b07", 1):
        hl.append("Nagpur")
    if t >= P("b07", 2):
        hl.append("Patna")
    tgt = india.town("Patna") if t >= P("b07", 2) else (india.town("Nagpur") if t >= P("b07", 1) else np.array([500, 760]))
    M = cam(lerp(500, tgt[0], eout(prog(t, t0, t0 + 0.4))), lerp(760, tgt[1], eout(prog(t, t0, t0 + 0.4))),
            glide(t, [(t0, 1.4), (P("b07", 1), 1.9), (P("b07", 2), 2.0)]))
    w = india.build(t, progress={n: 1.0 for n in india.ROUTES}, highlight=tuple(hl))
    fr.layer(w.transformed(M))
    india.labels(fr, M, highlight=tuple(hl))
    return fr


def _screen_hero(sub, cx, cy, w, h, t):
    """The film on the screen: a hero silhouette waving on a painted backdrop."""
    sub.fill(rect(cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2), K.mix(K.CREAM, K.COBALT, 0.25))
    sub.fill(ell(cx + 200, cy - 120, 70, 70, 20), K.mix(K.CREAM, K.GOLD, 0.4))
    sub.fill([[cx - w / 2, cy + 120], [cx + w / 2, cy + 80], [cx + w / 2, cy + h / 2], [cx - w / 2, cy + h / 2]], K.mix(K.COBALT, K.CREAM, 0.4), smooth=False)
    sub.fill(ell(cx - 60, cy - 40, 46, 56, 14), K.INK)
    sub.fill(rect(cx - 110, cy + 10, cx - 10, cy + 160, 20), K.INK)
    a = 0.6 * math.sin(t * 6)
    sub.ink([[cx - 20, cy + 40], [cx + 40 + 30 * math.cos(a), cy - 20 + 30 * math.sin(a)]], w=16, taper=(0, 0), seed=700)


def sh_hall(t):
    """'sab apne sheher ke hall mein film dekho!' Patna's Lakshmi Talkies: the beam, the audience, Munni with peanuts."""
    t0 = P("b07", 3)
    fr = Frame()
    M = cam(540, 1100, glide(t, [(t0, 1.0), (S("b08"), 1.06)]))
    w = cinema.build(t, lambda sub, cx, cy, ww, hh: _screen_hero(sub, cx, cy, ww, hh, t), laugh=0.4)
    actor(w, munni, 230, 2080, 0.85, t, "joy", (0.3, -0.8), {"R": (330, 1760)}, seed=4)
    fr.layer(w.transformed(M))
    fr.text("LAKSHMI TALKIES, PATNA", 540, 210, 44, K.GOLD_LI, M=M)
    return fr


def sh_cdn(t):
    """'Isi ko kehte hain CDN: asli ek jagah, aur copies tumhare paas.' Cloudflare's own definition."""
    return grab_shot(t, S("b08"), S("b09"), "cf_def", P("b08", 0, 0.6), zoom_to=2.0, seed=440)


# ======================= REEL 3: the censor's cut =======================
def _strip_frames(p, cx, cy, w, h, i, t, cut_from=99):
    if i >= cut_from:
        return
    P3.flowers(p, cx, cy + h * 0.38, h / 520, t, touch=0.6 + 0.4 * (i % 2), seed=800 + i)


def sh_censor(t):
    """'Par release ke baad censor ne romance ka ek scene katwa diya,' SNIP: the flower frames are cut out."""
    t0 = S("b09", 0.8)
    tc = Wd("b09", 0, 10)
    fr = Frame()
    sx, sy = shake(t, tc, 0.3, 14, 9)
    M = cam(540, 1150, glide(t, [(t0, 1.15), (S("b10"), 1.25)]), 0, sx, sy)
    w = Pic()
    w.add(studio.build(t))
    actor(w, censor, 300, 1880, 0.82, t, step(t, [(0, "stern"), (tc, "smug")]), (0.7, -0.2), {"R": (560, 1180)}, seed=3)
    cut = t >= tc
    P3.film_strip(w, 380, 1180, 1100, h=170, seed=810,
                  frames_fn=lambda p, cx, cy, ww, hh, i: _strip_frames(p, cx, cy, ww, hh, i, t, cut_from=(2 if cut else 99)))
    if cut:                                                      # the cut piece falls away
        k = t - tc
        piece = Pic()
        P3.film_strip(piece, 0, 0, 340, h=170, seed=820, frames_fn=lambda p, cx, cy, ww, hh, i: _strip_frames(p, cx, cy, ww, hh, i, t))
        w.add(piece, affine(tx=760 + 80 * k, ty=1180 + 900 * k * k, rot=0.8 * k))
    op = 1.0 - spring(prog(t, tc - 0.15, tc)) if t < tc + 0.3 else 0.2
    P3.scissors(w, 600, 1180, 1.2, open_amt=max(0.0, op), rot=-0.15, seed=830)
    fr.layer(w.transformed(M))
    if t >= tc:
        sc = lerp(3.0, 1.0, eout(prog(t, tc, tc + 0.14)))
        fr.text("CUT!", 760, 900, 120 * sc, K.RED, rot=-8, M=M)
    return fr


def sh_old_reel(t):
    """'aur chhote sheheron mein purana reel chalta raha, phool milte rahe!' Patna still shows the flowers."""
    t0 = S("b10")
    tf = P("b10", 1)
    fr = Frame()
    M = cam(540, glide(t, [(t0, 760), (tf, 640)]), glide(t, [(t0, 1.15), (tf, 1.5), (S("b11"), 1.55)]))
    touch = eout(prog(t, t0 + 0.6, tf + 0.2))
    w = cinema.build(t, lambda sub, cx, cy, ww, hh: (sub.fill(rect(cx - ww / 2, cy - hh / 2, cx + ww / 2, cy + hh / 2), K.mix(K.CREAM, K.COBALT, 0.2)),
                                                    P3.flowers(sub, cx, cy + hh * 0.36, 1.0, t, touch=touch, seed=840)),
                     laugh=0.9 if t >= tf else 0.2)
    actor(w, munni, 230, 2080, 0.85, t, step(t, [(0, "joy"), (tf, "shock"), (tf + 0.5, "joy")]), (0.3, -0.9), {"R": (330, 1760)}, seed=4)
    fr.layer(w.transformed(M))
    return fr


def sh_stale(t):
    """'Copy purani, sach naya: isi ko kehte hain stale cache, bhaiya!' Two screens side by side: NAYA vs PURANA."""
    t0 = S("b11")
    fr = Frame()
    M = cam(540, 960, glide(t, [(t0, 1.0), (S("b12"), 1.05)]))
    w = Pic()
    w.fill(rect(-40, -40, 1120, 1960), cinema.DARK)
    for k, (cx, label) in enumerate(((290, "BOMBAY"), (790, "PATNA"))):
        w.shape(rect(cx - 220, 620, cx + 220, 1060, 12), K.mix(K.CREAM, K.COBALT, 0.2), w=4.0, seed=850 + k, jit=0.5)
        if k == 1:
            sub = Pic()
            P3.flowers(sub, cx, 1040, 0.55, t, touch=1.0, seed=860)
            w.clip(rect(cx - 220, 620, cx + 220, 1060, 12), sub)
        else:
            w.ink([[cx - 120, 840], [cx + 120, 840]], w=10, color=K.INK, taper=(0, 0), seed=861)
        for g, al in ((2.4, 30), (1.4, 60)):
            w.fill([[cx - 30, 1500], [cx + 30, 1500], [cx + 220 * g / 2.4, 1060], [cx - 220 * g / 2.4, 1060]], K.mix(K.CREAM, K.GOLD, 0.3),
                   smooth=False, alpha=al)
    fr.layer(w.transformed(M))
    fr.text("BOMBAY", 290, 560, 52, K.CREAM, M=M)
    fr.text("PATNA", 790, 560, 52, K.CREAM, M=M)
    for k, (tt, cx, s_) in enumerate(((P("b11", 1), 290, "NAYA"), (P("b11", 0), 790, "PURANA"))):
        if t >= tt:
            sc = lerp(3.0, 1.0, eout(prog(t, tt, tt + 0.14)))
            fr.text(s_, cx, 1150, 78 * sc, K.GOLD_LI if k == 0 else K.RED, rot=-6 + 12 * k, M=M)
    if t >= P("b11", 2, 0.3):
        sc = lerp(3.0, 1.0, eout(prog(t, P("b11", 2, 0.3), P("b11", 2, 0.44))))
        fr.text("STALE CACHE", 540, 1265, 96 * sc, K.RED, rot=-4, M=M)
    return fr


# ======================= REEL 4: the date and the telegram =======================
def sh_can(t):
    """'Toh har dabbe pe likhi tareekh: is din ke baad reel wapas bhejo,' A date goes on every can."""
    t0 = S("b12", 0.8)
    tw = P("b12", 0, 0.6)
    fr = Frame()
    bg = Pic()
    bg.add(studio.build(t), cam(540, 1300, 1.3))
    fr.layer(bg, blur=12)
    M = cam(540, 980, glide(t, [(t0, 1.3), (S("b13"), 1.4)]))
    w = Pic()
    P3.film_can(w, 540, 1000, 2.0, seed=870)
    r = prog(t, tw, tw + 0.8)
    PR.pen(w, 360 + 400 * r, 960, 1.2, rot=0.6, seed=871)
    fr.layer(w.transformed(M))
    fr.text("WAPSI: 15 JAN 1937", 540, 996, 46, K.INK, font="kalam", weight=700, M=M, reveal=r)
    return fr


def sh_telegram(t):
    """'aur zaroorat pade toh telegram: purana reel hatao, naya lagao!'"""
    t0 = S("b13")
    fr = Frame()
    bg = Pic()
    bg.add(cinema.build(t, None), cam(540, 900, 1.2))
    fr.layer(bg, blur=12)
    M = cam(540, 960, glide(t, [(t0, 1.0), (P("b13", 1), 1.15), (S("b14"), 1.2)]))
    w = Pic()
    L = eout(prog(t, t0, t0 + 0.8))
    PR.telegram(w, 540, 920, 1.12, length=L, seed=880, rows=2)
    fr.layer(w.transformed(M))
    fr.text("PURANA REEL HATAO STOP", 540, 880, 50, K.INK, font="mono", weight=700, M=M, reveal=clamp(L * 1.2))
    fr.text("NAYA LAGAO STOP  -SETH", 540, 980, 50, K.INK, font="mono", weight=700, M=M, reveal=clamp(L * 1.6 - 0.6))
    return fr


def sh_maxage(t):
    """'Aaj wahi tareekh hai TTL, jaise Cache-Control max-age, aur telegram ka naam hai purge.' MDN's real page."""
    fr = grab_shot(t, S("b14"), S("b15"), "mdn_maxage", P("b14", 1), zoom_to=2.1, seed=450)
    tp = Wd("b14", 2, 5, -0.03)                         # on the word "purge", a frame early
    if t >= tp:
        sc = lerp(3.0, 1.0, eout(prog(t, tp, tp + 0.14)))
        fr.text("PURGE", 540, 360, 120 * sc, K.CREAM, rot=-6, stroke=7)
    return fr


def sh_usool(t):
    """'Toh usool ye hai: asli ek, copies hazaar, aur har copy pe expiry ki tareekh!' The rule card."""
    t0 = S("b15")
    fr = Frame()
    bg = Pic()
    bg.add(mela.build(t), cam(560, 1100, 1.2))
    fr.layer(bg, blur=14)
    M = cam(540, 960, glide(t, [(t0, 1.05), (S("b16"), 1.0)]))
    w = Pic()
    w.shape(boxy([[160, 480], [920, 460], [940, 1440], [140, 1460]], 20), K.mix(K.CREAM, K.GOLD, 0.3), w=4.4, seed=890, jit=1.2)
    for y in (480, 1440):
        w.shape(ell(540, y, 420, 40, 20), K.mix(K.GOLD, K.RED, 0.4), w=3.6, seed=891 + y)
    rows = [("Asli: ek", P("b15", 1)), ("Copies: hazaar", P("b15", 2)), ("Har copy: expiry date", P("b15", 3))]
    for k, (s_, tt) in enumerate(rows):
        if t >= tt:
            P3.reel(w, 260, 760 + k * 220, 0.3, a=t * 2, seed=892 + k)
    fr.layer(w.transformed(M))
    fr.text("TOH USOOL YE HAI", 540, 600, 66, K.RED, M=M)
    for k, (s_, tt) in enumerate(rows):
        if t >= tt:
            fr.text(s_, 600, 770 + k * 220, 62, K.INK, font="kalam", weight=700, M=M, reveal=clamp((t - tt) / 0.4))
    return fr


def sh_cta(t):
    """'CDN aur caching ka pura design chahiye? Comment karo CDN.' Baba holds up a slate."""
    t0 = S("b16")
    tc = P("b16", 1)
    fr = Frame()
    M = cam(500, 1250, glide(t, [(t0, 1.35), (S("b17"), 1.42)]))
    w = Pic()
    w.add(mela.build(t))
    P3.bioscope(w, *BOXPOS, t=t, crank=t * 1.3, seed=5)
    slate = (420, lerp(1500, 1040, spring(prog(t, tc - 0.2, tc + 0.1))))
    actor(w, baba, 230, 1880, 0.62, t, "talk", (0.6, -0.2), {"R": (slate[0] + 40, slate[1] + 120)}, seed=1, mouth=baba_talk(t))
    w.shape(boxy([[slate[0] - 150, slate[1] - 90], [slate[0] + 150, slate[1] - 90], [slate[0] + 150, slate[1] + 90], [slate[0] - 150, slate[1] + 90]], 12),
            K.INK, w=4.0, seed=900, jit=0.6)
    fr.layer(w.transformed(M))
    fr.text("CDN", slate[0], slate[1] + 4, 110, K.CREAM, M=M, rot=3)
    return fr


def sh_brand(t):
    """'Tech pe Trek...' The porthole closes on the logo."""
    t0 = S("b17")
    fr = Frame()
    M = cam(HOLES[1][0], HOLES[1][1], glide(t, [(t0, 2.2), (TOTAL, 2.3)]))
    w = Pic()
    w.add(mela.build(t))
    P3.bioscope(w, *BOXPOS, t=t, crank=t * 1.3, seed=5)
    fr.layer(w.transformed(M))
    tl = t0 + 0.05
    sc = lerp(3.2, 1.0, eout(prog(t, tl, tl + 0.3)))

    def logo(img, scale, sc=sc, show=t >= tl):
        if not show:
            return
        from PIL import Image as I, ImageDraw as D
        lg = I.open(str(_ROOT / "public/brand/techpe-trek.jpg")).convert("RGBA")
        sz = int(330 * sc * scale)
        lg = lg.resize((sz, sz), I.LANCZOS)
        m = I.new("L", lg.size, 0)
        D.Draw(m).ellipse([0, 0, sz - 1, sz - 1], fill=255)
        lg.putalpha(m)
        rgba = img.convert("RGBA")
        rgba.alpha_composite(lg, (int(540 * scale - sz / 2), int(960 * scale - sz / 2)))
        img.paste(rgba.convert("RGB"))

    fr.post.append(logo)
    fr.porthole = (540, 960, 430)
    return fr


def cut():
    return [
        (0.0, sh_open, False),
        (P("b01", 2), sh_ipl, True),
        (S("b02"), sh_blinkit, True),
        (P("b02", 4), sh_darkstore, True),
        (S("b03"), sh_bridge, True),
        (P("b03", 2), sh_peep, False),
        (S("b04"), make_leader(1, "Ek reel, ek sheher", S("b04")), False),
        (S("b04", 0.9), sh_studio, False),
        (S("b05"), sh_mob, False),
        (S("b06"), make_leader(2, "Copies har sheher", S("b06"), 0.8), True),
        (S("b06", 0.8), sh_copies, False),
        (P("b06", 2), sh_map, True),
        (S("b07"), sh_towns, False),
        (P("b07", 3), sh_hall, True),
        (S("b08"), sh_cdn, True),
        (S("b09"), make_leader(3, "Censor ki kainchi", S("b09"), 0.8), True),
        (S("b09", 0.8), sh_censor, False),
        (S("b10"), sh_old_reel, True),
        (S("b11"), sh_stale, True),
        (S("b12"), make_leader(4, "Tareekh aur telegram", S("b12"), 0.8), True),
        (S("b12", 0.8), sh_can, False),
        (S("b13"), sh_telegram, True),
        (S("b14"), sh_maxage, True),
        (S("b15"), sh_usool, True),
        (S("b16"), sh_cta, True),
        (S("b17"), sh_brand, False),
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
            ev.append((t0, "cut_tick", 0.7))
    for n, t0, d in ((1, S("b04"), 0.9), (2, S("b06"), 0.8), (3, S("b09"), 0.8), (4, S("b12"), 0.8)):
        for j in range(3):
            ev.append((t0 + j * d / 3, "beep", 0.5))                 # the leader's countdown pips
        ev.append((t0, "projector", 0.6))
    ev += [(0.0, "chimta", 0.6), (P("b01", 2, 1.0), "marker", 0.6), (P("b02", 2), "marker", 0.6), (P("b02", 4, 0.3), "marker", 0.6),
           (P("b03", 1), "tap", 0.6), (P("b03", 2, 0.6), "pop", 0.5), (S("b04", 0.9), "iris", 0.6), (P("b05", 2), "crowd_roar", 0.7),
           (P("b05", 3), "thunder_soft", 0.6), (P("b06", 1), "pop", 0.5), (P("b06", 1, 0.24), "pop", 0.5), (P("b06", 1, 0.4), "pop", 0.5),
           (P("b06", 2), "van", 0.5), (P("b07", 1), "pop", 0.6), (P("b07", 2), "pop", 0.6), (P("b07", 3), "projector", 0.6),
           (P("b07", 3, 0.6), "crowd_cheer", 0.5), (P("b08", 0, 0.6), "marker", 0.6), (Wd("b09", 0, 10), "snip", 1.0),
           (Wd("b09", 0, 10), "stamp", 0.7), (S("b10", 0.6), "projector", 0.5), (P("b10", 1), "ooh", 0.7),
           (P("b11", 0), "stamp", 0.8), (P("b11", 1), "stamp", 0.8), (P("b11", 2, 0.3), "stamp", 0.9), (P("b12", 0, 0.6), "scratch", 0.5),
           (S("b13"), "teleprinter", 0.6), (P("b14", 1), "marker", 0.6), (P("b14", 2), "stamp", 0.85), (P("b15", 1), "pop", 0.5),
           (P("b15", 2), "pop", 0.5), (P("b15", 3), "pop", 0.5), (P("b16", 1, -0.2), "flip", 0.6), (S("b17", 0.05), "brand_sting", 0.75)]
    return sorted(ev)
