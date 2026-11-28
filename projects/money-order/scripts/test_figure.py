"""Look-dev: one character full figure."""
import sys, pathlib, importlib, time
ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from ink.core import Pic, render, affine
from ink.finish import finish
from ink import palette as K
name = sys.argv[1]; expr = sys.argv[2] if len(sys.argv) > 2 else "neutral"
mod = importlib.import_module(f"cast.{name}")
t = time.time()
W, H = 1080, 1350
sc = float(sys.argv[3]) if len(sys.argv) > 3 else 0.68
pic = Pic(); pic.add(mod.figure(expr), affine(tx=540, ty=1300, sx=sc))
img = render(pic, W, H, S=3, bg=K.COBALT_L)
finish(img).save(ROOT / "out" / "design" / f"fig_{name}.png")
print("ok", round(time.time() - t, 1), "s")
