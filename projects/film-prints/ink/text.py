"""Raster lettering for signage (TATKAL, BUSY, SEAT): an OFL font, then the same finish as the frame."""
import pathlib
from PIL import Image, ImageDraw, ImageFont

ROOT = pathlib.Path(__file__).resolve().parents[1]
FONT = str(ROOT / "public" / "fonts" / "Archivo-VF.ttf")


def text_img(text, size, color, weight=900, width=62, stroke=0, stroke_color=(23, 11, 8)):
    f = ImageFont.truetype(FONT, size)
    try:
        f.set_variation_by_axes([weight, width])   # axis order is [Weight, Width]
    except Exception:
        pass
    d = ImageDraw.Draw(Image.new("L", (1, 1)))
    x0, y0, x1, y1 = d.textbbox((0, 0), text, font=f, stroke_width=stroke)
    im = Image.new("RGBA", (x1 - x0 + 8, y1 - y0 + 8), (0, 0, 0, 0))
    ImageDraw.Draw(im).text((4 - x0, 4 - y0), text, font=f, fill=tuple(color) + (255,), stroke_width=stroke,
                            stroke_fill=tuple(stroke_color) + (255,))
    return im


def paste_center(img, t, cx, cy, rot=0.0):
    if rot:
        t = t.rotate(rot, resample=Image.BICUBIC, expand=True)
    img.alpha_composite(t, (int(cx - t.width / 2), int(cy - t.height / 2)))
