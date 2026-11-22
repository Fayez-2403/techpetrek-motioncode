"""Seekable 720 × 1280 editorial overlays for the Astra traffic film."""

from functools import lru_cache
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


SIZE = (720, 1280)
FONT_DIR = Path(__file__).resolve().parents[1] / "public" / "fonts"
INK = (20, 25, 23)
PAPER = (255, 244, 223)
AMBER = (255, 182, 92)
TRANSPARENT = Image.new("RGBA", SIZE)
LEFT = 59


def smooth(t):
    t = max(0, min(1, t))
    return t * t * (3 - 2 * t)


def ramp(t, start, duration):
    return smooth((t - start) / duration)


@lru_cache(maxsize=32)
def font(size, weight, width, mono):
    filename = "JetBrainsMono-VF.ttf" if mono else "Archivo-VF.ttf"
    face = ImageFont.truetype(str(FONT_DIR / filename), size)
    face.set_variation_by_axes([weight] if mono else [weight, width])
    return face


@lru_cache(maxsize=64)
def lettering(text, size, weight, width, colour, mono=False):
    """Keep full-resolution antialiased outlines and cache repeat measurements."""
    face = font(size, weight, width, mono)
    left, top, right, bottom = face.getbbox(text)
    image = Image.new("RGBA", (right - left + 4, bottom - top + 4))
    ImageDraw.Draw(image).text((2 - left, 2 - top), text, font=face, fill=colour)
    return image


def line(layer, words, x, y, size, weight, width, colour, amount, mono=False):
    if amount <= 0:
        return
    word = lettering(words, size, weight, width, colour, mono)
    if amount >= 1:
        layer.alpha_composite(word, (x, y))
        return
    offset = round((1 - amount) ** 2 * word.height)
    if offset < word.height:
        layer.alpha_composite(word, (x, y + offset), (0, 0, word.width, word.height - offset))


@lru_cache(maxsize=3)
def matte(kind):
    # A flat ink margin turns into a gradual, transparent shoulder over the street.
    if kind == "cta":
        stops = ((0, 199), (120, 222), (460, 238), (622, 215), (820, 110), (936, 0))
    else:
        stops = ((0, 184), (112, 212), (285, 222), (410, 194), (654, 54), (806, 0))
    strip = Image.new("RGBA", (1, SIZE[1]))
    draw = ImageDraw.Draw(strip)
    for (y0, a0), (y1, a1) in zip(stops, stops[1:]):
        for y in range(y0, y1):
            alpha = round(a0 + (a1 - a0) * smooth((y - y0) / (y1 - y0)))
            draw.point((0, y), INK + (alpha,))
    return strip.resize(SIZE)


def rule(layer, y, amount):
    edge = LEFT + round(595 * amount)
    if edge <= LEFT:
        return
    pen = ImageDraw.Draw(layer)
    pen.line((LEFT, y, edge, y), fill=(221, 212, 190, 145), width=1)
    pen.line((LEFT, y, min(edge, LEFT + 41), y), fill=AMBER, width=3)


def fade(layer, amount):
    if amount < 1:
        layer.putalpha(layer.getchannel("A").point(lambda a: round(a * amount)))
    return layer


def opener(t):
    layer = matte("intro").copy()
    rule(layer, 130, ramp(t, -0.22, 0.7))
    if t < 3.67:
        copy = Image.new("RGBA", SIZE)
        line(copy, "GPT-6.2", LEFT - 2, 166, 90, 520, 100, PAPER, ramp(t, -0.3, 0.69))
        line(copy, "Astra", LEFT - 5, 253, 161, 815, 100, AMBER, ramp(t, -0.10, 0.73))
        layer.alpha_composite(fade(copy, 1 - ramp(t, 3.29, 0.38)))
    else:
        line(layer, "GPT-6.2 Astra", LEFT, 165, 29, 600, 100, AMBER, ramp(t, 3.59, 0.46), mono=True)
        line(layer, "From codebase", LEFT - 3, 225, 84, 700, 92, PAPER, ramp(t, 3.65, 0.57))
        line(layer, "to short film.", LEFT - 3, 312, 84, 700, 92, PAPER, ramp(t, 3.74, 0.57))
    return fade(layer, 1 - ramp(t, 7.52, 0.48))


def closing(local_time):
    t = local_time
    if t < 3.37:
        layer = matte("intro").copy()
        rule(layer, 136, ramp(t, 0, 0.53))
        line(layer, "GPT-6.2 Astra", LEFT, 169, 30, 630, 100, AMBER, ramp(t, 0.02, 0.50), mono=True)
        line(layer, "Use it in your", LEFT - 4, 234, 86, 650, 95, PAPER, ramp(t, 0.07, 0.57))
        line(layer, "own codebase.", LEFT - 4, 321, 86, 720, 95, PAPER, ramp(t, 0.17, 0.57))
        return fade(layer, ramp(t, 0, 0.26) * (1 - ramp(t, 3.0, 0.37)))

    u = t - 3.37
    layer = matte("cta").copy()
    rule(layer, 126, ramp(u, 0, 0.48))
    line(layer, "Comment", LEFT - 2, 171, 67, 530, 99, PAPER, ramp(u, -0.03, 0.52))
    line(layer, "“story”", LEFT - 4, 256, 181, 800, 94, AMBER, ramp(u, 0.05, 0.65))
    # The distribution note stays visually subordinate to the exact keyword.
    rule(layer, 505, ramp(u, 0.49, 0.6))
    line(layer, "DM mein", LEFT, 540, 28, 600, 100, AMBER, ramp(u, 0.61, 0.46), mono=True)
    line(layer, "My repo + 5 more repos", LEFT - 2, 591, 48, 600, 92, PAPER, ramp(u, 0.70, 0.49))
    line(layer, "+ the skills I used.", LEFT - 2, 645, 48, 600, 92, PAPER, ramp(u, 0.82, 0.49))
    return fade(layer, ramp(u, -0.04, 0.27))


def paint_bookend(t: float) -> Image.Image:
    """Return an RGBA overlay for global film time t, in seconds."""
    if 0 <= t < 8:
        return opener(t)
    if 44 <= t <= 56:
        return closing(t - 44)
    return TRANSPARENT.copy()
