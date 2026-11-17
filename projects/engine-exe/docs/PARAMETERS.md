# ENGINE.EXE: mechanical parameters and assumptions

> **Generic educational engine.** This is an illustrative single-cylinder, four-stroke, air-cooled, SOHC two-valve motorcycle engine. It is **not** a replica of any manufacturer's engine. Its numbers sit in the range of a typical 150 cc commuter single, chosen so the mechanism reads clearly.

Every number lives in one file: `sim/engine-shared/config.js`. The kinematics, the 3D geometry, the generated cam lobes, the dashboard and the charts all read from it. The tests re-check everything after an edit.

## Bottom end

| Parameter | Value | Note |
|---|---|---|
| Bore | 58.0 mm | |
| Stroke | 56.0 mm | crank radius r = 28.0 mm |
| Connecting rod, centre to centre (l) | 100.0 mm | l / r = 3.57 |
| Displacement | 148.0 cc | π/4 · bore² · stroke |
| Compression ratio | 9.5 : 1 | sets the clearance volume Vc = Vd / (CR − 1) |
| Piston compression height | 26.0 mm | wrist-pin centre to crown |
| Squish gap at TDC | 1.0 mm | crown to deck |

**Kinematics (exact slider-crank).** The crank pin is at (r sin θ, r cos θ). The wrist-pin height is

    x(θ) = r·cos θ + √(l² − r²·sin² θ)

The piston position below TDC is (r + l) − x. The rod angle is asin(r sin θ / l). The piston speed is −dx/dθ · rpm · 6 / 1000 m/s.

## Cycle convention

| Crank angle | Stroke |
|---|---|
| 0°–180° | Intake |
| 180°–360° | Compression |
| 360°–540° | Power |
| 540°–720° | Exhaust |

Any input angle is normalised to 0–720°. 720° is the same as 0°.

## Valve train (SOHC, two valves, roller rockers)

| Parameter | Intake | Exhaust |
|---|---|---|
| Opens | 710° (10° before TDC) | 500° (40° before BDC) |
| Closes | 220° (40° after BDC) | 10° (10° after TDC) |
| Duration | 230° crank | 230° crank |
| Maximum lift | 7.0 mm (illustrative) | 7.0 mm (illustrative) |
| Head diameter | 25.0 mm | 21.5 mm |
| Stem tilt from the bore axis | 20° | 20° |

- **Lift curve.** The curve is L(θ) = Lmax · 64 · u³ (1 − u)³, with u = ((θ − open) mod 720) / duration, for 0 < u < 1, and zero outside the window. Lift, velocity and acceleration are all zero at both ends, and the peak falls at mid-event. Taking the angle mod 720 handles the 720 → 0 wrap: intake opens at 710 and exhaust closes at 10. The two valves overlap at TDC.
- **Camshaft.** It turns at exactly half the crank angle (camAngle = θ / 2), driven by a 14 : 28 chain at an 8 mm pitch. The base circle is 13.0 mm.
- **Rockers.** Each rocker is centre-pivoted with a 4 mm roller on the lobe:
  - The pivot sits square to the stem through the valve tip, so lift = 20 mm · sin β exactly.
  - The roller arm is about 17.9 mm, which gives a rocker ratio of about 1.12.
  - The valve end slides up to 1.27 mm sideways across the tip at full lift.
- **Lobe shapes are generated, not drawn.** For every crank angle, the code poses the rocker for that lift and finds the roller centre. It turns that point into the cam's own frame (by +θ/2), then takes the envelope one roller radius inside. The test measures the roller-to-lobe distance as 4.000 mm at every angle.

## Ignition and combustion (illustrative)

| Item | Value | Status |
|---|---|---|
| Spark | 350° (10° before the firing TDC), shown for 8° | illustrative |
| Burn | Wiebe-style 1 − exp(−5 u³) over 50° from the spark | illustrative |
| Pressure index | 0–100; polytropic (n = 1.32) compression and expansion × (1 + 3.2 × burned fraction), blow-down after exhaust opens, flat intake and exhaust strokes | **illustrative shape only** |

The pressure index and the orange combustion glow are labelled **ILLUSTRATIVE** wherever they appear. They are not a thermodynamic or CFD model, and not a measured cylinder pressure.

## Speeds

| Item | Value |
|---|---|
| Engine speed range | 300–9000 rpm (default 1400) |
| Picture speed | 1/20 (normal), 1/100 (slow motion). The crank on screen turns at rpm × picture speed; at 1400 rpm and 1/20 the cycle takes 1.7 s. |
| Cam speed | rpm / 2 |

## Geometry notes (engine space, mm)

- **Axes.** The crank axis is on z, the cylinder axis is +y and the crank centre is the origin. The exhaust is on the +x side (the front of the bike), the intake on −x.
- **Left side (−z).** The timing chain, the sprockets, the flywheel (magneto rotor) and the generator cover. The cutaway removes z > 0, so the chain stays behind the section.
- **Right side (+z).** The spark plug, angled 60° from the bore axis. It is cut away with the front half, but its spark still shows at the electrode.
- **Not modelled.** The clutch, gearbox, oil system, tensioner and carburettor. The exhaust header and intake boot are cut short.
