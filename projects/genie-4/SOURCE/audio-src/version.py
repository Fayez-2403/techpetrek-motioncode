"""Single-version project: fixed paths (kept as a module so the shared audio scripts work unchanged)."""
import pathlib, sys

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parent
V = next((sys.argv[i + 1] for i, a in enumerate(sys.argv) if a == "--version" and i + 1 < len(sys.argv)), "v1")
SUFFIX = "" if V == "v1" else f"_{V}"
SCRIPT_PATH = ROOT / "src" / "data" / ("voScript.json" if V == "v1" else f"voScript.{V}.json")
OUT = HERE / "out" if V == "v1" else HERE / "out" / V
TIMINGS = ROOT / ("SCENE_TIMINGS.json" if V == "v1" else f"SCENE_TIMINGS.{V}.json")
MANIFEST = ROOT / "src" / "data" / "audioManifest.json"
