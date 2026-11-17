"""Contact sheet of the reel look-dev stills: python scripts/sheet.py <dir> <out.jpg> (7 per row, 270x480 each)."""
import os, sys
from PIL import Image

d, out = sys.argv[1], sys.argv[2]
fs = sorted((x for x in os.listdir(d) if x.startswith('reel_') and x.endswith('.png')), key=lambda f: float(f[5:-4]))
ims = [Image.open(os.path.join(d, f)).resize((270, 480)) for f in fs]
rows = (len(ims) + 6) // 7
sheet = Image.new('RGB', (270 * 7, 480 * rows))
for i, im in enumerate(ims):
    sheet.paste(im, ((i % 7) * 270, (i // 7) * 480))
sheet.save(out, quality=85)
print(out, len(ims))
