"""Cross-check the TypeScript solver against (1) an independent numpy solver and (2) PyNite 3.x, on every fixture in
solver/fixtures (written by web/scripts/export_fixtures.ts). Writes docs/ANALYSIS_VALIDATION.md's table to
solver/crosscheck_report.json and exits 1 if any relative difference is above the tolerance.

PyNite models the truss as 3D frame members with bending released at both ends (pin joints), out-of-plane
displacement and nodal rotations restrained, so its members carry axial force only.
    python solver/crosscheck.py
"""
import json, sys, glob, os
import numpy as np

sys.path.insert(0, os.path.dirname(__file__))
from truss_solver import solve_truss
from beam_solver import deflection, reactions

TOL = 1e-6  # relative, against the largest value of the same kind
HERE = os.path.dirname(__file__)


def pynite_truss(model):
    from Pynite import FEModel3D
    m = FEModel3D()
    mat = model["material"]
    m.add_material("mat", mat["E"], mat["E"] / 2.6, 0.3, mat["rho"])
    for n in model["nodes"]:
        m.add_node(n["id"], n["x"], n["y"], 0.0)
        sup = n["support"]
        m.def_support(n["id"], sup in ("pin",), sup in ("pin", "roller"), True, True, True, True)
    for e in model["members"]:
        sec = f"s_{e['id']}"
        m.add_section(sec, e["A"], 1e-6, 1e-6, 1e-6)
        m.add_member(e["id"], e["a"], e["b"], "mat", sec)
        m.def_releases(e["id"], Ryi=True, Rzi=True, Ryj=True, Rzj=True)
    for l in model["loads"]:
        if l["fx"]:
            m.add_node_load(l["node"], "FX", l["fx"])
        if l["fy"]:
            m.add_node_load(l["node"], "FY", l["fy"])
    m.analyze_linear(check_statics=False)
    combo = "Combo 1"
    nodes = {n: (m.nodes[n].DX[combo], m.nodes[n].DY[combo]) for n in m.nodes}
    # PyNite's axial(): + = compression in its sign convention; flip to + tension
    axial = {e["id"]: -m.members[e["id"]].axial(m.members[e["id"]].L() / 2, combo) for e in model["members"]}
    reac = {}
    for n in model["nodes"]:
        if n["support"] == "pin":
            reac[n["id"] + "/rx"] = m.nodes[n["id"]].RxnFX[combo]
        if n["support"] in ("pin", "roller"):
            reac[n["id"] + "/ry"] = m.nodes[n["id"]].RxnFY[combo]
    return {"nodes": nodes, "axial": axial, "reactions": reac}


def rel_diff(a: dict, b: dict) -> float:
    keys = a.keys() & b.keys()
    scale = max(max(abs(np.asarray(v)).max() for v in a.values()), 1e-30)
    return max(float(np.max(np.abs(np.asarray(a[k]) - np.asarray(b[k])))) for k in keys) / scale


def main():
    report, worst = [], 0.0
    try:
        import importlib.metadata as md
        pynite_version = md.version("PyNiteFEA")
    except Exception:
        pynite_version = None
    for path in sorted(glob.glob(os.path.join(HERE, "fixtures", "*.json"))):
        fx = json.load(open(path, encoding="utf8"))
        model, ts = fx["model"], fx["ts"]
        if model.get("analysisType") == "linear-beam-euler-bernoulli":
            xs = np.array(ts["xs"])
            v = deflection(model, xs)
            d = float(np.max(np.abs(v - np.array(ts["uy"])))) / float(np.max(np.abs(v)))
            ra, rb = reactions(model)
            dr = max(abs(ra - ts["reactions"][0]["ry_N"]), abs(rb - ts["reactions"][1]["ry_N"])) / max(abs(ra), abs(rb))
            row = {"fixture": fx["name"], "check": "TS beam FE vs closed form", "deflection": d, "reactions": dr}
            worst = max(worst, d, dr)
            report.append(row)
            continue
        ts_nodes = {n["id"]: (n["ux_m"], n["uy_m"]) for n in ts["nodes"]}
        ts_axial = {m["id"]: m["axial_N"] for m in ts["members"]}
        ts_reac = {}
        for r in ts["reactions"]:
            node = next(n for n in model["nodes"] if n["id"] == r["nodeId"])
            if node["support"] == "pin":
                ts_reac[r["nodeId"] + "/rx"] = r["rx_N"]
            ts_reac[r["nodeId"] + "/ry"] = r["ry_N"]
        py = solve_truss(model)
        row = {"fixture": fx["name"], "runId": ts["runId"], "members": len(model["members"]), "dof": ts["diagnostics"]["dof"],
               "numpy": {"disp": rel_diff(py["nodes"], ts_nodes), "axial": rel_diff(py["axial"], ts_axial), "reactions": rel_diff(py["reactions"], ts_reac)},
               "cond": py["condition"]}
        worst = max(worst, *row["numpy"].values())
        if pynite_version:
            pn = pynite_truss(model)
            row["pynite"] = {"disp": rel_diff(pn["nodes"], ts_nodes), "axial": rel_diff(pn["axial"], ts_axial), "reactions": rel_diff(pn["reactions"], ts_reac)}
            worst = max(worst, *row["pynite"].values())
        report.append(row)
    out = {"tolerance": TOL, "pynite": pynite_version, "numpy": np.__version__, "worst": worst, "rows": report}
    json.dump(out, open(os.path.join(HERE, "crosscheck_report.json"), "w"), indent=1)
    for r in report:
        print(json.dumps(r))
    print(f"worst relative difference {worst:.2e}  (tolerance {TOL:.0e}; PyNite {pynite_version}, numpy {np.__version__})")
    sys.exit(0 if worst < TOL else 1)


if __name__ == "__main__":
    main()
