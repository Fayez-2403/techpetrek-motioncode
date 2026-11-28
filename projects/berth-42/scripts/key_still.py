"""Key still: the opening frame (line 1) - two men, one berth, the same ticket. Hands placed by IK, tickets on the hands."""
import sys, pathlib, time
ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from ink.core import Pic, render, affine, ell
from ink.finish import finish
from ink import kit, palette as K
from sets import compartment
from cast import bhimsen, chhotu
t0 = time.time()
def local(w, tx, ty, s): return ((w[0] - tx) / s, (w[1] - ty) / s)
BX, BY, BS = 290, 1880, 0.62
CX, CY, CS = 815, 1880, 0.56
hb = (585, 1210)      # Bhimsen's wrist (world)
hc = (655, 1140)      # Chhotu's wrist (world)
p = Pic()
p.add(compartment.build(0.4))
p.fill(ell(BX, 1860, 300, 34, 16), K.COBALT_D, alpha=120)
p.fill(ell(CX, 1860, 190, 30, 16), K.COBALT_D, alpha=120)
p.add(bhimsen.figure("anger", look=(0.7, 0), hands={"R": local(hb, BX, BY, BS)}), affine(tx=BX, ty=BY, sx=BS))
p.add(chhotu.figure("shock", look=(-0.7, 0), hands={"L": local(hc, CX, CY, CS)}), affine(tx=CX, ty=CY, sx=CS))
kit.ticket(p, hb[0] + 40, hb[1] - 70, 1.1, rot=-0.2, seed=11)
kit.ticket(p, hc[0] - 40, hc[1] - 66, 1.1, rot=0.2, seed=12)
img = render(p, 1080, 1920, S=3)
finish(img).save(ROOT / "out" / "design" / "key_still_line01.png")
print("ok", round(time.time() - t0, 1))
