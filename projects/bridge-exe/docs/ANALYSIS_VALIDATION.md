# Analysis validation

Run: `cd web && bun test` (14 tests) and `bun scripts/export_fixtures.ts && python ../solver/crosscheck.py`.

## 1. Unit tests (web/tests/solver.test.ts) — 14 pass, 118 expects
| Test | Reference | Tolerance | Result |
|---|---|---|---|
| Unit conversions N/kN, Pa/MPa/GPa, m/mm, m²/mm² | exact | exact / 1e-12 | pass |
| Beam, centre point load: R = P/2, δ = PL³/48EI, M = PL/4 | closed form | rel 1e-9 | pass |
| Beam, UDL: R = wL/2, δ = 5wL⁴/384EI, M = wL²/8 | closed form | rel 1e-9 | pass |
| Beam: higher E → less deflection; 2× load → 2× deflection | linearity | rel 1e-12 | pass |
| OpenSeesPy truss example, node 4 (0.5301, −0.1779) | published | 5 decimals | pass |
| Pratt under deck UDL: midspan bottom chord = M/h | method of sections | rel 1e-9 | pass |
| Equilibrium of Pratt/Howe/Warren × 4/6/8/10 panels | ΣF = 0, ΣM = 0 | 1e-6 N, 1e-3 N·m | pass |
| Presets statically determinate (m + r = 2j) for 2–12 panels | counting rule | exact | pass |
| Higher E → less deflection; 2× load → 2× displacements and forces | linearity | rel 1e-10 | pass |
| Moving vehicle: lever rule conserves P; results vary with position | statics | 1e-6 N | pass |
| Missing diagonal → `unstable`, counting-rule reason, no numbers | — | — | pass |
| Count satisfied but geometrically unstable → singular-matrix reason | — | — | pass |
| Zero area / zero length / disconnected node / no supports → readable errors | — | — | pass |
| Input hash stable; any change changes it; same input → identical result | — | exact | pass |

## 2. Independent cross-check (solver/crosscheck.py → crosscheck_report.json)
Each fixture model is re-solved by (a) `solver/truss_solver.py`, an independent numpy implementation, and (b) **PyNite 3.2.1**
(3D frame members with both-end bending releases, out-of-plane and rotations restrained). The beam fixture is compared with
the closed-form superposition in `solver/beam_solver.py`.

| Fixture | Members | DOF | numpy disp / axial / reactions | PyNite disp / axial / reactions |
|---|---|---|---|---|
| pratt_default | 29 | 29 | 6e-16 / 3e-15 / 8e-15 | 3e-15 / 8e-15 / 2e-14 |
| howe_6p_vehicle | 21 | 21 | 3e-15 / 5e-15 / 1e-15 | 2e-15 / 4e-15 / 2e-15 |
| warren_10p_tall | 39 | 39 | 6e-15 / 9e-15 / 1e-14 | 3e-15 / 6e-15 / 6e-15 |
| pratt_dragged | 29 | 29 | 6e-15 / 8e-15 / 7e-15 | 1e-14 / 1e-14 / 1e-14 |
| pratt_aluminium | 29 | 29 | 5e-15 / 6e-15 / 8e-15 | 2e-15 / 5e-15 / 1e-14 |
| beam_city (FE vs closed form) | — | — | deflection 1.9e-11, reactions 2.0e-11 | — |

**Worst relative difference: 1.99e-11** (tolerance 1e-6).

## 3. The reel's runs
| Run | Design | Max δ | Max |N| | Reactions | Mass/plane | ΣFx, ΣFy |
|---|---|---|---|---|---|---|
| R001-f65e9923 | A: 56 m Pratt, 8 panels, h 6 m, T4 +1.75 m, deck 20 kN/m + 300 kN truck at 28 m + self-weight | 127.0 mm (L/441) at B4 | 1908 kN | 779 + 779 kN | 14.11 t | 1e-8, −3e-9 N |
| R002-872445d9 | B: A with h = 8 m | 85.7 mm (L/654) | 1439 kN | 785 + 785 kN | 15.21 t | — |
R002's utilisation proxy is 1.02 at V2 (a long vertical reaching the Euler proxy): the reel shows it as "check".

## 4. Challenge targets are reachable (design-space search, 2026-11-02)
- Budget vs stiffness (48 m, ≤ L/900, proxy ≤ 1.0, ≤ 12 t): cheapest pass found 11.83 t (Pratt, 6 panels, h 9 m).
- Impossible span (72 m, ≤ L/700, proxy ≤ 0.9, ≤ 26 t): cheapest pass found 22.48 t (Pratt, 6 panels, h 12 m).
