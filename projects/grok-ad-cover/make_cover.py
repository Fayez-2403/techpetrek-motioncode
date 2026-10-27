"""Two 1080x1920 covers for the user's "Grok Bot Ad" reel (C:\\Users\\ce\\Downloads\\Grok Bot Ad.mp4), built from the reel's
own frames (src/full_*.png) and type style (Archivo heavy + purple/blue italic accents). Headline text stays inside the
centre 4:5 crop (y 285-1635) that Instagram shows in the profile grid; *_grid.png previews that crop.

    python projects/grok-ad-cover/make_cover.py
"""
import pathlib

from PIL import Image, ImageDraw, ImageFilter, ImageFont

HERE = pathlib.Path(__file__).resolve().parent
FONTS = HERE.parent.parent / "app" / "public" / "fonts"
W, H = 1080, 1920
GRID = (0, (H - 1350) // 2, W, (H - 1350) // 2 + 1350)
f = lambda name, size: ImageFont.truetype(str(FONTS / name), size)
INK, PURPLE, BLUE, RED, WHITE = (24, 24, 30), (139, 92, 246), (59, 130, 246), (232, 72, 60), (255, 255, 255)


def text_c(d, y, s, font, fill, shadow=None):
    w = d.textlength(s, font=font); x = (W - w) / 2
    if shadow: d.text((x + 4, y + 6), s, font=font, fill=shadow)
    d.text((x, y), s, font=font, fill=fill); return x, w


def runs_c(d, y, runs):
    """One centred line made of (text, font, colour) runs, baseline-aligned."""
    total = sum(d.textlength(s, font=fo) for s, fo, _ in runs); x = (W - total) / 2; asc = max(fo.getmetrics()[0] for _, fo, _ in runs)
    spans = []
    for s, fo, col in runs:
        a = fo.getmetrics()[0]; d.text((x, y + asc - a), s, font=fo, fill=col); w = d.textlength(s, font=fo); spans.append((x, w, y + asc - a, fo)); x += w
    return spans


def shadowed(base, layer_fn, blur=18, alpha=90):
    sh = Image.new("RGBA", base.size, (0, 0, 0, 0)); layer_fn(ImageDraw.Draw(sh), (20, 40, 90, alpha))
    base.alpha_composite(sh.filter(ImageFilter.GaussianBlur(blur))); layer_fn(ImageDraw.Draw(base), None)


def cover_a():
    """Blue: the reel's end card moved down, a big white hook above it."""
    src = Image.open(HERE / "src" / "full_85.6.png").convert("RGBA")
    img = Image.new("RGBA", (W, H)); top = src.crop((0, 0, W, 1)).resize((W, 320))
    img.paste(top, (0, 0)); img.paste(src, (0, 300))
    d = ImageDraw.Draw(img)
    def hook(dd, sh):
        col = sh or WHITE
        text_c(dd, 330, "Ye chatbot", f("Archivo-w1000-700.ttf", 96), col)
        text_c(dd, 450, "NAHI HAI.", f("Archivo-w1125-900.ttf", 150), col)
    shadowed(img, hook)
    d = ImageDraw.Draw(img)
    pill = f("Archivo-w1125-900.ttf", 34); s = "AI KI POORI TEAM  →"; w = d.textlength(s, font=pill)
    d.rounded_rectangle(((W - w) / 2 - 34, 668, (W + w) / 2 + 34, 740), 36, fill=WHITE); d.text(((W - w) / 2, 684), s, font=pill, fill=BLUE)
    return img


def cover_b():
    """Light: the reel's own look and phrasing, the Grok Bot card and the NOT A CHATBOT chip."""
    src = Image.open(HERE / "src" / "full_5.9.png").convert("RGBA")
    # the reel's background, rebuilt clean: soft grey-white with a blue glow top-left and a lilac glow bottom-right
    img = Image.new("RGB", (W, H), (238, 240, 245)); g = ImageDraw.Draw(img)   # paint the glows on the base colour, then blur (no grey fringes)
    g.ellipse((-420, -300, 700, 820), fill=(204, 222, 248)); g.ellipse((420, 1200, 1500, 2200), fill=(226, 218, 248))
    img = img.filter(ImageFilter.GaussianBlur(170)).convert("RGBA")
    # Grok Bot card + NOT A CHATBOT chip from the reel
    def cutout(box, inset, radius, at):   # paste a rounded element without its old background; soft shadow under it
        el = src.crop(box); m = Image.new("L", el.size, 0); ImageDraw.Draw(m).rounded_rectangle((inset, inset, el.width - inset, el.height - inset), radius, fill=255)
        sh = Image.new("RGBA", img.size, (0, 0, 0, 0)); ImageDraw.Draw(sh).rounded_rectangle((at[0] + inset, at[1] + inset + 18, at[0] + el.width - inset, at[1] + el.height - inset + 18), radius, fill=(40, 70, 140, 70))
        img.alpha_composite(sh.filter(ImageFilter.GaussianBlur(26))); el.putalpha(m); img.alpha_composite(el, at)
    cutout((80, 580, 1020, 990), 18, 44, (70, 980))
    cutout((615, 1030, 925, 1108), 10, 29, ((W - 310) // 2, 1420))
    d = ImageDraw.Draw(img)
    it = f("ArchivoItalic-w1000-800.ttf", 160); reg = f("Archivo-w1000-700.ttf", 112); big = f("Archivo-w1000-900.ttf", 124)
    spans = runs_c(d, 360, [("chatbot", it, PURPLE), (" nahi,", reg, INK)])
    x, w, y, fo = spans[0]; mid = y + fo.getmetrics()[0] * 0.62
    d.line((x - 10, mid + 22, x + w + 6, mid - 26), fill=RED, width=16)   # struck through, like the reel's crossed-out chat box
    runs_c(d, 600, [("AI ", big, BLUE), ("TEAM", big, PURPLE), (" hai!", big, INK)])
    return img


for name, im in (("cover_A_blue", cover_a()), ("cover_B_light", cover_b())):
    im = im.convert("RGB"); im.save(HERE / f"{name}.png")
    im.crop(GRID).save(HERE / f"{name}_grid.png"); print("wrote", HERE / f"{name}.png")
