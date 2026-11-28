"""Design sheet (gate 2): the cast lineup at one scale, every lead's expression heads, the locked palette.
python scripts/design_sheet.py [lineup|heads|palette|all]"""
import sys, pathlib, importlib, time
ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from ink.core import Pic, render, affine, ell, rect
from ink.finish import finish
from ink import palette as K, kit

OUT = ROOT / "out" / "design"
OUT.mkdir(parents=True, exist_ok=True)
CAST = [("bhimsen", "BHIMSEN", ["neutral", "blink", "smug", "anger", "shock", "snore"]),
        ("chhotu", "CHHOTU", ["neutral", "blink", "joy", "anger", "shock", "asleep"]),
        ("ramu", "RAMU", ["neutral", "blink", "smug", "shock", "sheepish"]),
        ("shamu", "SHAMU", ["neutral", "blink", "smug", "anger", "shock"]),
        ("badebabu", "BADE BABU", ["neutral", "blink", "stern", "shock", "smug"])]
FONT = str(ROOT / "public" / "fonts" / "Archivo-VF.ttf")


def label(img, xy, text, size=34, fill=K.INK):
    d = ImageDraw.Draw(img)
    try:
        f = ImageFont.truetype(FONT, size)
        f.set_variation_by_axes([900, 100]) if hasattr(f, "set_variation_by_axes") else None
    except Exception:
        f = ImageFont.load_default()
    w = d.textlength(text, font=f)
    d.text((xy[0] - w / 2, xy[1]), text, font=f, fill=fill)


def lineup():
    W, H = 2700, 1500
    pic = Pic()
    # a simple floor + wall so the figures stand in light, not on a swatch
    pic.fill([[0, 0], [W, 0], [W, 1330], [0, 1330]], K.COBALT_L, smooth=False)
    pic.fill([[0, 1330], [W, 1330], [W, H], [0, H]], K.CREAM_SH, smooth=False)
    pic.fill([[1700, 0], [2300, 0], [1900, 1330], [1300, 1330]], K.CREAM, smooth=False, alpha=90)   # window shaft
    kit.wood(pic, 0, 1330, W, H, plank=60, seed=3)
    xs = [420, 950, 1400, 1830, 2300]
    sc = 0.58
    for (mod, name, ex), x in zip(CAST, xs):
        m = importlib.import_module(f"cast.{mod}")
        pic.fill(ell(x, 1350, 230, 26, 16), K.COBALT, alpha=110)                       # contact shadow
        pic.add(m.figure("neutral"), affine(tx=x, ty=1350, sx=sc))
    img = finish(render(pic, W, H, S=3))
    for (mod, name, ex), x in zip(CAST, xs):
        label(img, (x, 1400), name, 40, K.INK)
    img.save(OUT / "sheet_cast_lineup.png")


def heads():
    cw, ch = 430, 470
    rows = len(CAST)
    cols = max(len(c[2]) for c in CAST)
    W, H = 220 + cols * cw, rows * ch
    pic = Pic()
    pic.fill([[0, 0], [W, 0], [W, H], [0, H]], K.CREAM, smooth=False)
    for r, (mod, name, ex) in enumerate(CAST):
        m = importlib.import_module(f"cast.{mod}")
        pic.fill([[0, r * ch], [W, r * ch], [W, r * ch + 4], [0, r * ch + 4]], K.CREAM_SH, smooth=False)
        for c, e in enumerate(ex):
            x, y = 220 + c * cw + cw / 2, r * ch + ch - 78
            s = {"bhimsen": 0.6, "chhotu": 0.52, "ramu": 0.78, "shamu": 0.66, "badebabu": 0.56}[mod]
            pic.add(m.head(e), affine(tx=x, ty=y, sx=s))
    img = finish(render(pic, W, H, S=3))
    for r, (mod, name, ex) in enumerate(CAST):
        label(img, (110, r * ch + ch / 2 - 20), name, 30)
        for c, e in enumerate(ex):
            label(img, (220 + c * cw + cw / 2, r * ch + ch - 34), e, 22, K.FINE)
    img.save(OUT / "sheet_heads.png")


def palette():
    sw = [("cobalt", K.COBALT, "#2c4bb0"), ("salmon skin", K.SKIN, "#f08470"), ("cream", K.CREAM, "#f3e5c4"),
          ("gold", K.GOLD, "#e2a72e"), ("railway red", K.RED, "#c2392b"), ("ink", K.INK, "#170b08")]
    W, H = 1800, 420
    pic = Pic()
    pic.fill([[0, 0], [W, 0], [W, H], [0, H]], K.CREAM, smooth=False)
    for i, (n, c, hx) in enumerate(sw):
        x = 150 + i * 300
        P = rect(x - 110, 60, x + 110, 260, 20)
        pic.shape(P, c, w=4.0, seed=10 + i, jit=1.2)
        if n == "salmon skin":
            pic.fill([[x + 20, 60], [x + 110, 60], [x + 110, 260], [x + 60, 260]], K.SKIN_SH, smooth=False)
            pic.fill(ell(x - 60, 110, 30, 20, 10), K.SKIN_LI)
    img = finish(render(pic, W, H, S=3))
    for i, (n, c, hx) in enumerate(sw):
        label(img, (150 + i * 300, 290), n, 30)
        label(img, (150 + i * 300, 336), hx, 24, K.FINE)
    img.save(OUT / "sheet_palette.png")


def sets_row():
    """The three sets + the key still as 9:16 thumbnails, side by side."""
    import importlib as il
    from ink.core import render as R
    thumbs = []
    for name, t in (("compartment", 0.4), ("office", 0.3), ("platform", 0.5)):
        m = il.import_module(f"sets.{name}")
        img = R(m.build(t), 1080, 1920, S=2)
        if hasattr(m, "overlay"):
            m.overlay(img, t)
        thumbs.append(finish(img))
    thumbs.append(Image.open(OUT / "key_still_line01.png").convert("RGB"))
    tw, th = 540, 960
    W, H = 60 + 4 * (tw + 40), th + 160
    sheet = Image.new("RGB", (W, H), K.CREAM)
    names = ["A. night compartment", "B. 10 AM booking office", "C. platform by day", "key still: line 1"]
    for i, (im, n) in enumerate(zip(thumbs, names)):
        x = 60 + i * (tw + 40)
        sheet.paste(im.resize((tw, th), Image.LANCZOS), (x, 40))
        label(sheet, (x + tw / 2, th + 70), n, 30)
    sheet.save(OUT / "sheet_sets.png")


def combined():
    parts = [Image.open(OUT / f) .convert("RGB") for f in ("sheet_cast_lineup.png", "sheet_heads.png", "sheet_sets.png", "sheet_palette.png")]
    W = 2400
    parts = [im.resize((W, int(im.height * W / im.width)), Image.LANCZOS) for im in parts]
    H = sum(im.height for im in parts) + 40 * (len(parts) + 1)
    out = Image.new("RGB", (W, H), K.CREAM)
    y = 40
    for im in parts:
        out.paste(im, (0, y))
        y += im.height + 40
    out.save(OUT / "DESIGN_SHEET_berth42_v1.png")
    out.resize((W // 2, H // 2), Image.LANCZOS).save(OUT / "DESIGN_SHEET_berth42_v1_small.jpg", quality=88)


if __name__ == "__main__":
    what = sys.argv[1] if len(sys.argv) > 1 else "all"
    t = time.time()
    for k in (["lineup", "heads", "palette", "sets_row", "combined"] if what == "all" else [what]):
        globals()[k]()
        print(k, "done", round(time.time() - t, 1), "s")

