// Writes docs/VALIDATION.md from the two test runs (docs/validation-kin.json, docs/validation-sim.json).
//   node tests/kin.test.mjs && node tests/sim.test.mjs && node tests/report.mjs
import fs from 'node:fs';

const kin = JSON.parse(fs.readFileSync(new URL('../docs/validation-kin.json', import.meta.url), 'utf8'));
const sim = JSON.parse(fs.readFileSync(new URL('../docs/validation-sim.json', import.meta.url), 'utf8'));
const real = (r) => r.filter((x) => !x.info);
const all = [...real(kin.results), ...real(sim.results)];
const passed = all.filter((x) => x.pass).length;
const row = (r) => `| ${r.pass ? 'PASS' : '**FAIL**'} | ${r.name} | ${String(r.detail).replace(/\|/g, '\\|')} |`;
const info = sim.results.filter((x) => x.info);
const date = new Date().toISOString().slice(0, 10);

const md = `# ENGINE.EXE validation report

Generated ${date} by \`tests/report.mjs\` from \`tests/kin.test.mjs\` and \`tests/sim.test.mjs\`.

**${passed} / ${all.length} checks passed.**

${info.map((x) => `- ${x.name}: ${x.detail}`).join('\n')}

## 1. Mechanical model (node, \`engineStateAt\`, ${kin.samples.toLocaleString('en')} crank angles at 0.01°)

| Result | Check | Measured |
|---|---|---|
${real(kin.results).map(row).join('\n')}

## 2. The built pages (Chromium on the GPU)

The film page poses the real 3D parts at every crank angle and reads them back. The live page is driven with real clicks and keys.

| Result | Check | Measured |
|---|---|---|
${real(sim.results).map(row).join('\n')}

## 3. What is calculated and what is illustrative

| Value | Source | Status |
|---|---|---|
| Crank angle, stroke, phase | crank angle mod 720 | calculated |
| Piston position, piston speed | exact slider-crank, \`x = r·cosθ + √(l² − r²·sin²θ)\` | calculated |
| Rod angle | \`asin(r·sinθ / l)\` | calculated |
| Camshaft angle and speed | \`θ / 2\`, \`rpm / 2\` | calculated |
| Intake and exhaust lift | C2 bump \`64·u³(1−u)³\` over each timing window | calculated from the illustrative timing |
| Cam lobe shapes | the roller's path through the rocker, then its envelope | derived from the lift curves |
| Ignition (spark at 350°) | a fixed 10° advance | **illustrative** |
| Pressure index and combustion glow | polytropic compression and expansion plus a Wiebe-style burn | **illustrative**. This is not a thermodynamic model, a CFD result or a measured pressure. |

## 4. Known limitations

- **Generic engine.** This is a generic educational engine, not a replica of any manufacturer's design. Every dimension and timing value is illustrative and editable in \`sim/engine-shared/config.js\`.
- **Valve-tip slide.** The rocker's valve end slides sideways on the valve tip by up to 1.27 mm at full lift. The geometry is exact along the stem, and the slide is real behaviour for a flat-tipped valve under a rocker.
- **Rigid parts.** There is no valve-spring dynamics, valve float, chain stretch, tensioner, oil, or part flex.
- **Pressure is a shape.** The pressure curve shows the shape of the cycle; it does not predict torque or power.
- **Clutch and gearbox not modelled.** The crankcase is modelled round the crank only. The exhaust and intake are cut short: the header ends below the engine and the intake boot ends at a flange.
- **Section view.** The cutaway shows the inside faces of the cut shells, not solid section caps.
- **Phone layout.** On phones the 3D view and the cards stack; the auto tour runs without the operator cursor there.
- **Frame rate.** The rate above was measured headless on this machine. The page drops quality tiers by itself on slower GPUs: no AO, a lower pixel ratio, smaller shadow maps.
`;
fs.writeFileSync(new URL('../docs/VALIDATION.md', import.meta.url), md);
console.log(`docs/VALIDATION.md  ${passed}/${all.length} passed`);
