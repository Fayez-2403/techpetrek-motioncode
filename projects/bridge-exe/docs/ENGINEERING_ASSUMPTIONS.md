# Engineering assumptions

BRIDGE.EXE is educational software. It is not a substitute for a licensed structural engineer, a geotechnical
investigation, design-code checks, construction documents or bridge certification.

## Units
SI inside (m, m², N, Pa, kg, kg/m³); display in kN, MPa/GPa, mm, t. Converters and formatting: web/src/engineering/units.ts (tested).

## Truss (Environment A, primary)
- Idealised **pin-jointed 2D truss**, linear elastic, small displacements, static loads. Each bar: E, A, L; axial force only.
- **Direct stiffness method**: global K assembled from bar stiffness EA/L·[c², cs; cs, s²]; restraints applied; K_ff u_f = F_f
  solved by dense Gaussian elimination with partial pivoting. N = EA/L·(c·Δu + s·Δv), + tension. Stress = N/A.
- **Supports**: B0 pin (ux = uy = 0), last deck joint roller (uy = 0).
- **Failure to solve is reported, never zero-filled**: validation (duplicate IDs, missing nodes, zero length, near-zero area,
  isolated / dangling joints, fewer than 3 restraints, counting rule m + r < 2j) and a relative zero-pivot check (1e-10)
  that names the joint and direction of the mechanism.
- **Two truss planes**: the render shows two identical planes 9.2 m apart; each is the analysed truss and carries HALF the
  deck. All load inputs are per plane; the truck drawn is 2 × P.
- **Visual only (not analysed)**: deck slab, floor beams, railings, top lateral bracing, portal bracing, bearings' geometry.

## Loads (illustrative, not a code load model)
- Deck UDL q per plane → deck joints by **tributary length** (half panel each side).
- Truck P per plane between two deck joints → **lever rule** (simply supported stringer).
- Self-weight ρ·A·L·g per bar, half to each end joint (optional).
- **Moving load** = a sequence of independent static solves (4 positions per panel); any motion in between is display only.
- No IS 875 / IRC 6 / Eurocode combinations are implied.

## Educational utilisation proxy (not code compliance)
- Every bar assumed a thin circular hollow section, wall t = D/20: D = √(20A/π), I = πD⁴/160.
- Tension: N / (fy·A). Compression: |N| / min(fy·A, π²EI/L²) (Euler, pinned ends, K = 1).
- No resistance factors, imperfections, buckling curves, connections, local buckling, fatigue or serviceability codes.

## Beam (Environment B)
- Simply supported **Euler–Bernoulli** beam, cubic Hermite finite elements (v, θ per node), consistent nodal loads for the UDL.
  Nodal results are exact for this theory (tests: PL³/48EI, 5wL⁴/384EI, R = P/2, wL/2, M = PL/4, wL²/8).
- No shear deformation: fine for slender spans; deep beams need a Timoshenko model.

## Cable-stayed (Environment C)
- **Concept visual only.** Cables are tension-only and need a nonlinear / cable model this lab does not implement, so the UI
  says CINEMATIC MODEL — ANALYSIS UNAVAILABLE and shows no stress colours or numbers.

## Not modelled anywhere
Buckling analysis (beyond the Euler proxy), plastic hinges, fracture, progressive collapse, fatigue, dynamics / vibration
modes, wind and aeroelastics, temperature, foundations, connections, construction stages, code checks.

## Arcade mode
Rapier rigid bodies with an artistic break timer. It ignores the solver; it is a game effect, labelled as such.
