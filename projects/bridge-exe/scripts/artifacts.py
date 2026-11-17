"""The CAD / report beat shows real project output, re-typeset for a phone. This script copies it from the files
(never typed by hand) into src/config/artifacts.json:
  code  - the stiffness assembly + axial recovery lines from web/src/engineering/truss.ts
  check - the last lines of python solver/crosscheck.py (run now)
  ifc   - a summary read back from output/BRIDGE_EXE_MODEL.ifc with IfcOpenShell
  csv   - the header and two member rows of output/BRIDGE_EXE_ANALYSIS_REPORT.csv
    python scripts/artifacts.py
"""
import json, pathlib, subprocess, sys

import ifcopenshell, ifcopenshell.util.element as U

ROOT = pathlib.Path(__file__).resolve().parents[1]
src = (ROOT / "web/src/engineering/truss.ts").read_text(encoding="utf8").splitlines()
pick = lambda needle: next(i for i, l in enumerate(src) if needle in l)
i0 = pick("for (const g of geo) {"); i1 = pick("const N = g.k * (g.c * du + g.s * dv);")
code = [l.rstrip() for l in src[i0:i0 + 3]] + ["    ..."] + [src[pick("const sol = solveDense(Kff, Ff);")].rstrip()] + ["    ..."] + [src[i1].rstrip()]
check = subprocess.run([sys.executable, str(ROOT / "solver/crosscheck.py")], capture_output=True, text=True, cwd=ROOT).stdout.strip().splitlines()
f = ifcopenshell.open(str(ROOT / "output/BRIDGE_EXE_MODEL.ifc"))
tc = next(m for m in f.by_type("IfcMember") if m.Name == "TC4_front"); ps = U.get_psets(tc)["BRIDGEEXE_Member"]
ifc = [f"schema {f.schema_identifier}", f"{len(f.by_type('IfcBridge'))} IfcBridge · {len(f.by_type('IfcMember'))} IfcMember",
       f"TC4_front · CHS {f.by_type('IfcCircleHollowProfileDef')[0].ProfileName.split()[1]} mm",
       f"Axial {ps['Axial_N'] / 1e3:.1f} kN · run {ps['RunId']}"]
csvl = (ROOT / "output/BRIDGE_EXE_ANALYSIS_REPORT.csv").read_text(encoding="utf8").splitlines()
k = next(i for i, l in enumerate(csvl) if l.startswith("section,id,a,b"))
csv = [csvl[2], csvl[k], *[l for l in csvl[k + 1:] if l.startswith("member,TC4") or l.startswith("member,BC4")]]
rep = json.loads((ROOT / "solver/crosscheck_report.json").read_text(encoding="utf8"))
nt = sum(1 for r in rep["rows"] if "numpy" in r); nb = len(rep["rows"]) - nt
out = {"code": code, "check": [f"$ python solver/crosscheck.py", f"{nt} truss fixtures: TS vs numpy vs PyNite {rep['pynite']}", f"{nb} beam fixture: TS FE vs closed form", check[-1]], "ifc": ifc, "csv": csv,
       "files": ["web/src/engineering/truss.ts", "solver/crosscheck.py", "output/BRIDGE_EXE_MODEL.ifc", "output/BRIDGE_EXE_ANALYSIS_REPORT.csv"]}
(ROOT / "src/config/artifacts.json").write_text(json.dumps(out, indent=1, ensure_ascii=False), encoding="utf8")
print(json.dumps(out, indent=1, ensure_ascii=False))
