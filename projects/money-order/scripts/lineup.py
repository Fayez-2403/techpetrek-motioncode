"""Look-dev: the cast lineup at one scale + an expression grid."""
import sys, pathlib, importlib
ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from ink.core import Pic, render, affine, ell, rect
from ink.finish import finish
from ink import palette as K, kit
CAST = [("hariram", ["neutral", "joy", "worry", "shock"]), ("munshi", ["neutral", "smug", "worry", "shock"]),
        ("tara", ["neutral", "focus", "smug", "shock"]), ("mohan", ["neutral", "joy", "smug", "shock"])]
W, H = 2400, 1500
p = Pic()
p.fill(rect(0, 0, W, 1330), K.COBALT_L); p.fill(rect(0, 1330, W, H), K.CREAM_SH)
kit.wood(p, 0, 1330, W, H, plank=60, seed=3)
for (m, ex), x in zip(CAST, (380, 960, 1500, 2020)):
    mod = importlib.import_module(f"cast.{m}")
    p.fill(ell(x, 1350, 220, 26, 16), K.COBALT, alpha=110)
    p.add(mod.figure("neutral"), affine(tx=x, ty=1350, sx=0.6))
finish(render(p, W, H, S=2)).save(ROOT / "out/design/lineup.png")
cw, ch = 420, 440
g = Pic(); g.fill(rect(0, 0, 4 * cw, 4 * ch), K.CREAM)
for r, (m, ex) in enumerate(CAST):
    mod = importlib.import_module(f"cast.{m}")
    for c, e in enumerate(ex):
        g.add(mod.head(e), affine(tx=c * cw + cw / 2, ty=r * ch + ch - 50, sx=0.62))
finish(render(g, 4 * cw, 4 * ch, S=2)).save(ROOT / "out/design/heads.png")
print("ok")
