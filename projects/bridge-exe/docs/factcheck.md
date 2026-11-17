# Fact check: BRIDGE.EXE — Can your design survive?

Every on-screen and spoken claim traces to a row here (master studio §2). Checked 2026-11-02.

| # | Claim | Kind | Source | Supporting excerpt / location | Status | On-screen / spoken wording |
|---|---|---|---|---|---|---|
| F1 | The app was built with Claude Code (Claude Opus 5.5) | our own build | this repo, this session | web/, solver/, scripts written by Claude Code | verified | "Claude Opus 5.5 ke saath bani ek interactive engineering lab" |
| F2 | The colours, sag and numbers come from a real solver run | our own run | web/src/engineering/truss.ts; run R001-f65e9923 (input hash f65e99238cca0271) | `solveTruss` direct stiffness, 29 DOF; ΣFy −3e-9 N | verified | "actual structural solver run karo — sirf animation nahi"; REAL SOLVER OUTPUT |
| F3 | Design A (56 m Pratt, T4 +1.75 m, deck 20 kN/m + 300 kN truck per plane, self-weight): max deflection 127.0 mm (L/441), max axial 1908 kN, reactions 779 + 779 kN, 14.1 t steel per plane | our own run | output/BRIDGE_EXE_ANALYSIS_REPORT.csv | runId row + member rows | verified | solver card, evidence card |
| F4 | Design B (same, height 8 m): 85.7 mm (−33 %), 15.2 t (+8 %), utilisation proxy 1.02 at V2 | our own run | run R002-872445d9 (ReelMode.installReel) | `__reelInfo()` | verified | A vs B card |
| F5 | The TS solver matches an independent numpy solver and PyNite 3.2.1 | our own test | solver/crosscheck_report.json | worst relative difference 1.99e-11 over 5 truss + 1 beam fixtures | verified | evidence card; CROSS-CHECK card |
| F6 | The solver reproduces the OpenSeesPy truss example (0.5301, −0.1779) | published reference | https://openseespydoc.readthedocs.io/en/latest/src/truss.html | "node 4 displacements … 0.5301 and -0.1779" | verified | (docs only) |
| F7 | Beam FE reproduces PL³/48EI and 5wL⁴/384EI | textbook closed form | tests/solver.test.ts | relative error < 1e-9 | verified | (app Info panel) |
| F8 | PyNite provides simple FE analysis for Python; docs v3.2.0 | official docs | https://pynite.readthedocs.io/en/latest/ | "simple finite element analysis for Python" | verified | SHARE doc only |
| F9 | Autodesk AutoCAD and Civil 3D MCP Server and Revit MCP Server are "Tech Preview (Public Beta)"; Revit MCP supports Revit 2027.2 | official docs | https://help.autodesk.com/view/ADSKMCP/ENU/ ; Revit MCP page | listing statuses; "Autodesk Revit 2027.2 is the only version currently supported" | verified | not claimed in the reel (none installed) |
| F10 | IFC export via IfcOpenShell (IFC4X3_ADD2, 1 IfcBridge, 58 IfcMember) | our own output | output/BRIDGE_EXE_MODEL.ifc (solver/export_ifc.py, IfcOpenShell 0.9.0) | read back with ifcopenshell | verified | CAD · IFC card ("real files from this project") |
| F11 | "Claude scripts likhke CAD aur reporting workflow bhi automate kar sakta hai" | general capability, shown by our own files | solver/export_ifc.py, engineering/reports.ts | the IFC + CSV in output/ were produced by scripts Claude wrote | verified | VO line 7 |
| F12 | Steel preset E = 200 GPa, 7850 kg/m³ (IS 800:2007 cl. 2.2.4.1); fy 250 MPa (IS 2062 E250, t < 20 mm) | standard via secondary sources | lecture notes / IS-code summaries (docs/SOURCES.md) | values agree across sources; printed code not fetched | uncertain-minor (secondary) | app material note only |
| F13 | Aluminium 6061-T6: E 68.9 GPa, yield 276 MPa, 2700 kg/m³ | ASM datasheet (repost) | docs/SOURCES.md | "Modulus of Elasticity 68.9 GPa … Tensile Yield 276 MPa" | verified (secondary copy) | app only |
| F14 | The arcade collapse is not a prediction | our illustrative animation | web/src/world/ArcadeFailure.tsx | breaks on a timer, ignores the solver | verified | STYLIZED FAILURE — NOT AN ENGINEERING PREDICTION (banner throughout 50–57 s) |
| F15 | Loads are illustrative, not a code load model | our assumption | engineering/model.ts | DEFAULT_LOADS | verified | "illustrative loads · per truss plane" |
| F16 | The utilisation is an educational proxy, not code compliance | our assumption | engineering/educationalChecks.ts | CHS t = D/20, Euler, no factors | verified | evidence card + A/B "check" |

## Removed / not claimed
- Any Autodesk MCP / Civil 3D / Revit session (none installed; F9 is context only).
- "AI designed a safe bridge" (never said; the cover asks "AI BUILT THIS BRIDGE?!" over an "educational simulation" note).
- Wind, dynamics, buckling analysis, fatigue, code compliance (not modelled; Info panel says so).

## Benchmarks
| Metric | Value | Baseline | Who measured | Source | Chart scale note |
|---|---|---|---|---|---|
| Max deflection A vs B | 127.0 → 85.7 mm | design A | our solver, same loads | runs R001 / R002 | delta % computed from the two runs |
