# Comment "CIVIL": the bridge-simulation stack (send this in the DM)

Thanks for commenting! This is the stack behind BRIDGE.EXE, the educational bridge lab from the reel.
**It is an educational model, not construction approval.** Real designs need a licensed structural engineer, a site
investigation and your national codes.

## The tools (all free / open source)
| Tool | What it does here | Link |
|---|---|---|
| Claude Code | wrote the app, the solver, the tests and the export scripts | https://claude.com/claude-code |
| PyNite | Python finite-element analysis; we cross-check our truss solver against it | https://pynite.readthedocs.io/en/latest/ |
| OpenSeesPy | research-grade structural analysis; its truss example is one of our test cases | https://openseespydoc.readthedocs.io/en/latest/src/truss.html |
| IfcOpenShell | writes the IFC (BIM) file of the model | https://github.com/IfcOpenShell/IfcOpenShell |
| FreeCAD | open-source parametric CAD (for STEP solids; not used in this build) | https://github.com/FreeCAD/FreeCAD |
| Three.js + React Three Fiber | the 3D gorge and bridge in the browser | https://threejs.org/docs/ · https://r3f.docs.pmnd.rs/ |
| Rapier | rigid bodies for the (fictional) arcade collapse | https://rapier.rs |

## Safe setup checklist
1. Install Python 3.12 and Node/Bun. `pip install --user numpy PyNiteFEA ifcopenshell` (the versions we used: PyNite 3.2.1, IfcOpenShell 0.9.0).
2. Start with a **published example** (the OpenSeesPy truss example) and make your solver reproduce it before trusting anything else.
3. Check **equilibrium** on every run (sum of loads + reactions ≈ 0) and keep the input hash with every result.
4. Make unstable models **fail loudly** (singular stiffness = mechanism), never show zeros.
5. Label what is a proxy (our utilisation is not a code check) and what is visual only (deck, bracing, the arcade collapse).
6. If you connect AI to CAD (e.g. Autodesk's MCP previews), start **read-only**, use a sample model, and approve every write.
7. Never use an AI-generated or student model for a real structure without a licensed engineer's review.

## Repo
The app source will be shared as a public repo when it is published; until then this DM is the stack and checklist.

## Pinned comment
Comment CIVIL 🏗️ — I'll share the bridge-simulation stack: Claude Code + PyNite/OpenSeesPy + FreeCAD/IFC + source links.
This is an educational model, not construction approval. What should we simulate next?
