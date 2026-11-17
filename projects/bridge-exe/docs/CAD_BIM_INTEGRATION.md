# CAD / BIM integration status

| Path | Status | What it does | Limits |
|---|---|---|---|
| Parametric geometry (web/src/geometry/trussPresets.ts) | **verified** | Pratt / Howe / Warren from span, panels, height, drags, removed/added members; stable IDs B0…, T…, BC…, TC…, V…, D…, EP…, X… shared by the solver, the 3D view, the CSV and the IFC | 2D truss per plane |
| GLB export (app → GLB button) | **verified** | Visual geometry of both planes with member IDs in userData | Not a CAD solid, not certified |
| CSV / JSON report (app; `bun scripts/export_run.ts`) | **verified** | Members, nodes, reactions, loads, run ID, input hash, solver, material source, disclaimers | Educational |
| IFC (solver/export_ifc.py, IfcOpenShell 0.9.0) | **verified** | IFC4X3_ADD2: IfcProject → IfcSite → IfcBridge → 58 IfcMember (CHS profile swept along each bar, CHORD/BRACE), Pset `BRIDGEEXE_Member` with ID, nodes, A, L, axial N, stress, proxy, run ID, hash | Conceptual: no deck, connections, classification or code data |
| FreeCAD / STEP | **not installed** | — | A mesh export is never called STEP |
| Autodesk AutoCAD / Civil 3D MCP | **not installed / unverified** | — | Tech Preview (Public Beta) per Autodesk; Civil 3D is not a bridge FE solver |
| Autodesk Revit MCP | **not installed / unverified** | — | Tech Preview, Revit 2027.2 only; Read / Write / Experimental servers |
| Autodesk Fusion MCP | **not installed / unverified** | — | — |

## If an Autodesk MCP is added later (the safe flow)
1. Detect the product and version; list the server's actual tool names and permissions.
2. Start read-only (Revit "Read" server): query elements, export a view.
3. Preview any write; get the user's approval; work only in a disposable sample model.
4. Record the real session; label any reconstruction "illustrative".

## Reel wording
VO line 7 ("Claude scripts likhke CAD aur reporting workflow bhi automate kar sakta hai") is shown with this project's real
files (truss.ts, crosscheck.py output, the IFC read back, the CSV), labelled "real files from this project · re-typeset
for the phone". No Autodesk product appears.
