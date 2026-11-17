"""Contact sheet of a stills folder: python scripts/sheet.py out/stills_v1 [cols] [w]"""
import sys, pathlib
from PIL import Image, ImageDraw
d = pathlib.Path(sys.argv[1]); cols = int(sys.argv[2]) if len(sys.argv) > 2 else 4; w = int(sys.argv[3]) if len(sys.argv) > 3 else 300
fs = sorted(p for p in d.glob("*.png")); h = int(w * 16 / 9); rows = (len(fs) + cols - 1) // cols
S = Image.new("RGB", (cols * w, rows * (h + 22)), (20, 20, 20)); D = ImageDraw.Draw(S)
for i, f in enumerate(fs):
    im = Image.open(f).convert("RGB").resize((w, h)); x, y = (i % cols) * w, (i // cols) * (h + 22)
    S.paste(im, (x, y + 22)); D.text((x + 6, y + 4), f"{int(f.stem) / 60:.2f}s", fill=(255, 220, 120))
S.save(d / "sheet.jpg", quality=88); print(d / "sheet.jpg", S.size)
