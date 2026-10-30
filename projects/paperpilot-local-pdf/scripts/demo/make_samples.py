"""Synthetic sample PDFs for the PaperPilot reel (no real people or data)."""
import sys, os
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import numpy as np

out = sys.argv[1]
os.makedirs(out, exist_ok=True)
W, H = A4
rng = np.random.default_rng(7)


def photo(seed, w=1400, h=900):
    r = np.random.default_rng(seed)
    y, x = np.mgrid[0:h, 0:w]
    base = np.stack([(x / w) * 200 + 30, (y / h) * 160 + 60, ((x + y) / (w + h)) * 220], -1)
    base += r.normal(0, 18, base.shape)
    return Image.fromarray(np.clip(base, 0, 255).astype('uint8'))


def doc(name, title, lines, pages, seed):
    c = canvas.Canvas(os.path.join(out, name), pagesize=A4)
    for p in range(pages):
        c.setFont('Helvetica-Bold', 22); c.drawString(60, H - 80, title)
        c.setFont('Helvetica', 9); c.drawString(60, H - 98, 'SAMPLE DOCUMENT - synthetic data for a demo')
        c.setFont('Helvetica', 12)
        for i, l in enumerate(lines):
            c.drawString(60, H - 140 - i * 20, l)
        c.drawImage(ImageReader(photo(seed + p)), 60, 120, width=W - 120, height=(W - 120) * 0.64)
        c.drawString(60, 80, f'Page {p + 1} of {pages}')
        c.showPage()
    c.save()


doc('invoice.pdf', 'INVOICE #0042', ['Bill to: Sample Studio Pvt Ltd', 'Item: Design work (demo)', 'Amount: Rs 12,500 (sample)'], 2, 1)
doc('report.pdf', 'Q3 REPORT (SAMPLE)', ['Revenue chart: illustrative only', 'Prepared for a demo', 'No real figures'], 3, 11)
doc('notes.pdf', 'MEETING NOTES', ['1. Pick the reel hook', '2. Test PaperPilot MCP', '3. Ship on Friday'], 1, 21)

# scanned page: text rendered to an image, then slightly blurred and rotated
img = Image.new('L', (1240, 1754), 245)
d = ImageDraw.Draw(img)
try:
    f = ImageFont.truetype('arial.ttf', 46)
except OSError:
    f = ImageFont.load_default()
for i, t in enumerate(['SCANNED RECEIPT', 'Chai x2 ...... Rs 40', 'Samosa x3 .... Rs 45', 'Total ........ Rs 85', 'Thank you!']):
    d.text((120, 200 + i * 90), t, fill=20, font=f)
img = img.rotate(0.8, fillcolor=245).filter(ImageFilter.GaussianBlur(0.8))
img.save(os.path.join(out, 'scan.png'))
c = canvas.Canvas(os.path.join(out, 'scanned.pdf'), pagesize=A4)
c.drawImage(ImageReader(img), 0, 0, width=W, height=H)
c.showPage(); c.save()
for n in sorted(os.listdir(out)):
    print(n, os.path.getsize(os.path.join(out, n)))
