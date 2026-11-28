"""Look-dev: render a set at t, optionally with cast placed in it."""
import sys, pathlib, importlib, time
ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from ink.core import Pic, render, affine
from ink.finish import finish
name = sys.argv[1]; t = float(sys.argv[2]) if len(sys.argv) > 2 else 0.0
m = importlib.import_module(f"sets.{name}")
t0 = time.time()
img = render(m.build(t), 1080, 1920, S=3)
if hasattr(m, "overlay"):
    m.overlay(img, t)
finish(img).save(ROOT / "out" / "design" / f"set_{name}.png")
print("ok", round(time.time() - t0, 1), "s")
