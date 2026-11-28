"""Look-dev: one character's expression heads in a row, with and without the finish."""
import sys, pathlib, importlib, time
ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from ink.core import Pic, render, affine
from ink.finish import finish
from ink import palette as K

name = sys.argv[1] if len(sys.argv) > 1 else "bhimsen"
exprs = sys.argv[2].split(",") if len(sys.argv) > 2 else ["neutral", "blink", "smug", "anger", "shock", "snore"]
mod = importlib.import_module(f"cast.{name}")
t = time.time()
W, H = 1080 * 3 // 2, 520 * 2
pic = Pic()
for i, e in enumerate(exprs):
    x = 270 + (i % 3) * 540
    y = 470 + (i // 3) * 520
    s = 0.62
    if hasattr(mod, "neck"):
        pic.add(mod.neck(), affine(tx=x, ty=y, sx=s))
    pic.add(mod.head(e), affine(tx=x, ty=y, sx=s))
img = render(pic, W, H, S=3, bg=K.CREAM)
out = ROOT / "out" / "design"
out.mkdir(parents=True, exist_ok=True)
img.convert("RGB").save(out / f"heads_{name}_raw.png")
finish(img).save(out / f"heads_{name}.png")
print("ok", round(time.time() - t, 1), "s")
