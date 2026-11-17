"""Conceptual IFC export of a BRIDGE.EXE model (IfcOpenShell). Schema IFC4X3_ADD2 (it has IfcBridge).

One IfcMember per bar per truss plane, swept as a circular hollow profile (the app's assumed CHS, t = D/20) along the
bar axis, with stable names (<member id>_front / _back) and a property set holding the solver run's numbers.
This is conceptual geometry for viewing and data exchange: NOT a code-compliant BIM deliverable, no connections,
no deck, no reinforcement, no classification system.
    python solver/export_ifc.py output/BRIDGE_EXE_SAMPLE_MODEL.json output/BRIDGE_EXE_MODEL.ifc
"""
import json, math, sys

import numpy as np
import ifcopenshell
import ifcopenshell.api
import ifcopenshell.util.placement  # noqa: F401  (loads the api helpers)

HALF_W = 4.6
WALL = 20


def main(src, dst):
    data = json.load(open(src, encoding="utf8"))
    model, result = data["model"], data["result"]
    res = {m["id"]: m for m in result["members"]} if result and result.get("status") == "solved" else {}
    f = ifcopenshell.api.run("project.create_file", version="IFC4X3_ADD2")
    project = ifcopenshell.api.run("root.create_entity", f, ifc_class="IfcProject", name="BRIDGE.EXE educational model")
    metre = ifcopenshell.api.run("unit.add_si_unit", f, unit_type="LENGTHUNIT")   # metres (the default would be mm)
    ifcopenshell.api.run("unit.assign_unit", f, units=[metre])
    ctx = ifcopenshell.api.run("context.add_context", f, context_type="Model")
    body = ifcopenshell.api.run("context.add_context", f, context_type="Model", context_identifier="Body", target_view="MODEL_VIEW", parent=ctx)
    site = ifcopenshell.api.run("root.create_entity", f, ifc_class="IfcSite", name="Fictional gorge")
    bridge = ifcopenshell.api.run("root.create_entity", f, ifc_class="IfcBridge", name="Cliffside truss (conceptual)")
    ifcopenshell.api.run("aggregate.assign_object", f, relating_object=project, products=[site])
    ifcopenshell.api.run("aggregate.assign_object", f, relating_object=site, products=[bridge])

    nodes = {n["id"]: n for n in model["nodes"]}
    span = max(n["x"] for n in model["nodes"])
    count = 0
    for m in model["members"]:
        a, b = nodes[m["a"]], nodes[m["b"]]
        D = math.sqrt(WALL * m["A"] / math.pi)
        dx, dy = b["x"] - a["x"], b["y"] - a["y"]
        L = math.hypot(dx, dy)
        profile = f.create_entity("IfcCircleHollowProfileDef", ProfileType="AREA", ProfileName=f"CHS {D * 1000:.0f}x{D / WALL * 1000:.1f}", Radius=D / 2, WallThickness=D / WALL)
        for side, z in (("front", HALF_W), ("back", -HALF_W)):
            el = ifcopenshell.api.run("root.create_entity", f, ifc_class="IfcMember", name=f"{m['id']}_{side}", predefined_type="CHORD" if m["group"] in ("top", "bottom", "endpost") else "BRACE")
            rep = ifcopenshell.api.run("geometry.add_profile_representation", f, context=body, profile=profile, depth=L)
            ifcopenshell.api.run("geometry.assign_representation", f, product=el, representation=rep)
            # local z (extrusion) along the bar, origin at node a
            zax = np.array([dx / L, dy / L, 0.0]); xax = np.array([0.0, 0.0, 1.0]); yax = np.cross(zax, xax)
            mat = np.eye(4); mat[:3, 0] = xax; mat[:3, 1] = yax; mat[:3, 2] = zax; mat[:3, 3] = [a["x"] - span / 2, a["y"], z]
            ifcopenshell.api.run("geometry.edit_object_placement", f, product=el, matrix=mat)
            ifcopenshell.api.run("spatial.assign_container", f, relating_structure=bridge, products=[el])
            pset = ifcopenshell.api.run("pset.add_pset", f, product=el, name="BRIDGEEXE_Member")
            props = {"MemberId": m["id"], "NodeA": m["a"], "NodeB": m["b"], "Group": m["group"], "Area_m2": m["A"], "Length_m": L}
            if m["id"] in res:
                r = res[m["id"]]
                props.update({"Axial_N": r["axial_N"], "Stress_Pa": r["stress_Pa"], "UtilizationProxy": r["utilization"], "RunId": result["runId"],
                              "InputsHash": result["inputsHash"], "Note": "educational linear-elastic result; not a code check"})
            ifcopenshell.api.run("pset.edit_pset", f, pset=pset, properties=props)
            count += 1
    f.write(dst)
    check = ifcopenshell.open(dst)
    print(f"wrote {dst}: schema {check.schema_identifier}, {len(check.by_type('IfcMember'))} IfcMember, "
          f"{len(check.by_type('IfcBridge'))} IfcBridge, run {result['runId'] if result else 'none'}")


if __name__ == "__main__":
    main(*sys.argv[1:3])
