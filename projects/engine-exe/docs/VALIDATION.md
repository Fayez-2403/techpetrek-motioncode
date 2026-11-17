# ENGINE.EXE validation report

Generated 2026-11-15 by `tests/report.mjs` from `tests/kin.test.mjs` and `tests/sim.test.mjs`.

**42 / 42 checks passed.**

- GPU: ANGLE (Intel, Intel(R) Iris(R) Xe Graphics (0x00009A49) Direct3D11 vs_5_0 ps_5_0, D3D11)
- Live frame rate (headless, this machine): 60.1 fps on quality tier 0

## 1. Mechanical model (node, `engineStateAt`, 72,001 crank angles at 0.01°)

| Result | Check | Measured |
|---|---|---|
| PASS | Piston at TDC (0 mm) at 0°, 360°, 720° | piston position 0.000000 mm at all three |
| PASS | Piston at BDC (= stroke) at 180°, 540° | piston position 56.000000 mm at both |
| PASS | TDC and BDC are the true extremes (0.01° sweep) | minima at 0, 360, 720°; maxima at 180, 540° |
| PASS | Slider-crank formula x = r·cosθ + √(l² − r²·sin²θ) | max deviation 1.3e-13 mm over 72001 angles |
| PASS | Connecting rod length constant (crank pin ↔ wrist pin = l) | max \|length − 100\| = 4.3e-14 mm |
| PASS | Camshaft at exactly half crank speed | camAngle = θ/2 for every sample; camRpm = rpm/2 at 300, 1400, 6000, 9000 |
| PASS | Intake lift is zero outside 710°→220° (wrapping 720) | lift > 0 only inside the window; exactly 0 outside |
| PASS | Exhaust lift is zero outside 500°→10° (wrapping 720) | lift > 0 only inside the window; exactly 0 outside |
| PASS | Valve events wrap continuously across 720 → 0 | overlap at TDC: intake 0.032 mm, exhaust 0.032 mm; largest 0.01° step 0.00105 mm |
| PASS | Peak lift 7 mm at mid-event | intake 7.000 mm at 105°, exhaust 7.000 mm at 615°, never above |
| PASS | Stroke labels change at 0 / 180 / 360 / 540 / 720 | 0°→INTAKE, 179.99°→INTAKE, 180°→COMPRESSION, 359.99°→COMPRESSION, 360°→POWER, 539.99°→POWER, 540°→EXHAUST, 719.99°→EXHAUST, 720°→INTAKE |
| PASS | Crank angle normalised to 0..720 | −10°≡710°, 1440°≡0°, 725°≡5° |
| PASS | Ignition fires once per cycle, near the firing TDC | spark 350°–357.99°; illustrative pressure peak (index 100) at 381.59° |
| PASS | Piston speed scales with rpm | 90° ATDC: 2.932 m/s at 1000 rpm, 23.457 m/s at 8000 rpm (mean piston speed at 1000 rpm 1.87 m/s) |
| PASS | Displacement and compression ratio from the dimensions | 148.0 cc, CR 9.50:1 |

## 2. The built pages (Chromium on the GPU)

The film page poses the real 3D parts at every crank angle and reads them back. The live page is driven with real clicks and keys.

| Result | Check | Measured |
|---|---|---|
| PASS | Connecting rod stays on the wrist pin (720 poses, 1° steps) | max gap 4.67e-14 mm |
| PASS | Connecting rod stays on the crank pin (720 poses) | max gap 1.07e-14 mm |
| PASS | Rod stays connected in EXPLODED mode | max gaps 4.0e-14 / 1.1e-14 mm |
| PASS | 3D camshaft turns at half the 3D crankshaft angle | max \|cam − crank/2\| 0.0e+0 rad |
| PASS | 3D valves sit exactly at the model lift | max error 1.3e-14 mm |
| PASS | Rockers turned by the angle that gives the model lift | max error 0.0e+0 rad |
| PASS | Cam roller rides the generated lobe (no gap, no overlap) | roller-centre-to-lobe distance 4.000–4.000 mm (roller radius 4.000) |
| PASS | Rocker pushes the valve tip along its stem | axial error 2.6e-14 mm; sideways slide on the tip up to 1.27 mm |
| PASS | Dashboard values match engineStateAt() (every 7°) | 9 calculated rows + pressure index agree to display precision at 103 angles |
| PASS | Stroke card shows the model phase | label matched at every sampled angle |
| PASS | 720° chart cursor at the crank angle | max offset 0.050 px |
| PASS | Camera never clips into the engine | closest approach 42 mm from the engine's box (near plane 20 mm) at crank zoom 0.4 el +60 |
| PASS | Cutaway plane through the cylinder axis | section plane at z = -0.5 mm (0.5 mm behind the axis plane, clear of the case joint face) |
| PASS | Exploded: head, cover and case move on assembly axes | head +80 mm (y), cover +200 mm (y), case halves ±62 mm (z) |
| PASS | X-ray: housing see-through | housing opacity 0.12 |
| PASS | Film page ran without errors | no page errors |
| PASS | Live page starts in the auto tour | tour running |
| PASS | A click hands control to the visitor | tour stopped after the click |
| PASS | CUTAWAY button switches the mode | mode cutaway, cut 0.99 |
| PASS | Crank advances at rpm × playback at 300 / 1400 / 6000 / 9000 rpm | 300 rpm: 137° vs 137° expected; 1400 rpm: 637° vs 637° expected; 6000 rpm: 2730° vs 2730° expected; 9000 rpm: 4095° vs 4095° expected |
| PASS | Crank-angle slider scrubs and pauses | angle 540.0° (slider at 75% → 540°), paused true, dashboard 540.0° |
| PASS | Single step +5° | 540.0° → 545.0° |
| PASS | Isolating a part highlights it, moves the camera, explains it | solo piston, fade 0.96, camera piston, info card shown |
| PASS | Learn mode: slow motion, cutaway, stage jump | learn true, mode cutaway, slow true, θ 383° after jumping to 03 POWER |
| PASS | Live page ran without errors | no page errors |
| PASS | Phone (390 × 844): compact layout, readable cards, no sideways scroll | view 390×422, cards zoom ×1.48 (11.6 px body → 17.2 px), page width 390px |
| PASS | Phone page ran without errors | no page errors |

## 3. What is calculated and what is illustrative

| Value | Source | Status |
|---|---|---|
| Crank angle, stroke, phase | crank angle mod 720 | calculated |
| Piston position, piston speed | exact slider-crank, `x = r·cosθ + √(l² − r²·sin²θ)` | calculated |
| Rod angle | `asin(r·sinθ / l)` | calculated |
| Camshaft angle and speed | `θ / 2`, `rpm / 2` | calculated |
| Intake and exhaust lift | C2 bump `64·u³(1−u)³` over each timing window | calculated from the illustrative timing |
| Cam lobe shapes | the roller's path through the rocker, then its envelope | derived from the lift curves |
| Ignition (spark at 350°) | a fixed 10° advance | **illustrative** |
| Pressure index and combustion glow | polytropic compression and expansion plus a Wiebe-style burn | **illustrative**. This is not a thermodynamic model, a CFD result or a measured pressure. |

## 4. Known limitations

- **Generic engine.** This is a generic educational engine, not a replica of any manufacturer's design. Every dimension and timing value is illustrative and editable in `sim/engine-shared/config.js`.
- **Valve-tip slide.** The rocker's valve end slides sideways on the valve tip by up to 1.27 mm at full lift. The geometry is exact along the stem, and the slide is real behaviour for a flat-tipped valve under a rocker.
- **Rigid parts.** There is no valve-spring dynamics, valve float, chain stretch, tensioner, oil, or part flex.
- **Pressure is a shape.** The pressure curve shows the shape of the cycle; it does not predict torque or power.
- **Clutch and gearbox not modelled.** The crankcase is modelled round the crank only. The exhaust and intake are cut short: the header ends below the engine and the intake boot ends at a flange.
- **Section view.** The cutaway shows the inside faces of the cut shells, not solid section caps.
- **Phone layout.** On phones the 3D view and the cards stack; the auto tour runs without the operator cursor there.
- **Frame rate.** The rate above was measured headless on this machine. The page drops quality tiers by itself on slower GPUs: no AO, a lower pixel ratio, smaller shadow maps.
