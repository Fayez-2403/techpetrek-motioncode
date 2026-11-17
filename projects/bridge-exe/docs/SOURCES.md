# Sources (retrieved 2026-11-02)

| Source | URL | What was verified | Licence | Caveats |
|---|---|---|---|---|
| PyNite docs (v3.2.0 pages; PyNiteFEA 3.2.1 installed) | https://pynite.readthedocs.io/en/latest/ | "simple finite element analysis for Python"; FEModel3D API checked by introspection: `add_node`, `add_material(E,G,nu,rho)`, `add_section(A,Iy,Iz,J)`, `add_member(..., material, section)`, `def_support`, `def_releases`, `add_node_load`, `analyze_linear` | MIT | Members are 3D beam-columns; the cross-check releases bending at both ends to model pins |
| OpenSeesPy truss example | https://openseespydoc.readthedocs.io/en/latest/src/truss.html | `model('basic','-ndm',2,'-ndf',2)`, `element('Truss',…)`, elastic material E = 3000, load (100, −50) at node 4, expected 0.5301 / −0.1779 | BSD-style (OpenSees) | Reproduced by our solver in tests (no OpenSeesPy install needed) |
| OpenSees Truss element | https://opensees.github.io/OpenSeesDocumentation/user/manual/model/elements/Truss.html | Truss elements are axial-force-only | — | Context for "no bending in a truss model" |
| Autodesk MCP index | https://help.autodesk.com/view/ADSKMCP/ENU/ | AutoCAD and Civil 3D MCP Server: Local, Tech Preview (Public Beta); Revit MCP Server: Local, Tech Preview (Public Beta); Fusion MCP: Local, GA; Fusion Data MCP: Remote, GA; Fusion Compute MCP: Remote, Public Beta; Product Help MCP: Remote, GA | Autodesk terms | None of these is installed here; nothing in the reel claims one |
| Revit public MCP | https://help.autodesk.com/cloudhelp/ENU/ADSKMCP-RevitMcp/files/ADSKMCP_RevitMcp_revit_mcp_server_html.html | Technical Preview; Revit 2027.2 only; Read / Write / Experimental server options | Autodesk terms | Write and Experimental can modify the model |
| IfcOpenShell | https://github.com/IfcOpenShell/IfcOpenShell (0.9.0 via pip) | `project.create_file(version="IFC4X3_ADD2")`, `unit.add_si_unit`, `geometry.add_profile_representation`, `pset.edit_pset`; file read back and tessellated | LGPL-3.0 | Conceptual geometry only |
| FreeCAD | https://github.com/FreeCAD/FreeCAD | Not installed on this machine | LGPL-2.1+ | No STEP solid export offered (a mesh is not a parametric STEP) |
| React Three Fiber / drei | https://r3f.docs.pmnd.rs/ | R3F 9.8.2, drei 10.7.9 | MIT | — |
| Three.js | https://threejs.org/docs/ | r186; GLTFExporter for GLB | MIT | GLB = visual geometry |
| Rapier (compat) | https://rapier.rs | 0.12.0 rigid bodies for the arcade mode only | Apache-2.0 | Never used for engineering numbers |
| Remotion | https://www.remotion.dev/docs | 4.0.538 for the overlay | Remotion licence (individual use free) | — |
| IS 800:2007 cl. 2.2.4.1 (via secondary sources) | https://www.brainkart.com/article/Properties-Of-Structural-Steel_3414/ ; https://infralens.in/code/IS-800-2007 | E = 2.0×10⁵ N/mm², unit mass 7850 kg/m³, ν = 0.3 | BIS standard | Printed code not fetched; verify against the BIS text |
| IS 2062 E250 (via secondary sources) | https://beamdimensions.com/materials/Steel/Indian_Standard_(IS)/IS_2062 ; https://digeca.tatasteel.com/blogs/is-2062-e250-e350-e410-steel-grades-guide | fy 250 MPa for t < 20 mm, fu 410 MPa | BIS standard | Yield falls for thicker plates |
| ASM Al 6061-T6 (repost) | https://www.aerospacemetals.com/wp-content/uploads/2023/06/Aluminum-6061-T6-6061-T651.pdf | E 68.9 GPa, tensile yield 276 MPa | — | Secondary copy of the ASM sheet |
| Fonts | Inter, Archivo, JetBrains Mono (public/fonts, OFL.txt files) | SIL OFL 1.1 | OFL | — |
