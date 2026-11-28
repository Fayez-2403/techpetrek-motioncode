from pathlib import Path
from PIL import Image, ImageDraw

out = Path(__file__).resolve().parents[2] / 'out' / 'mumbai-drive-preview'
frames = sorted(out.glob('frame-*.jpg'), key=lambda f: float(f.stem[6:]))
sheet = Image.new('RGB', (6 * 216, ((len(frames) + 5) // 6) * 408), (15, 19, 23))
draw = ImageDraw.Draw(sheet)
for i, frame in enumerate(frames):
    x, y = (i % 6) * 216, (i // 6) * 408
    with Image.open(frame) as image:
        sheet.paste(image.resize((216, 384), Image.Resampling.LANCZOS), (x, y))
    draw.text((x + 8, y + 389), frame.stem[6:] + 's', fill=(240, 227, 200))
sheet.save(out / 'contact-sheet.jpg', quality=94)
