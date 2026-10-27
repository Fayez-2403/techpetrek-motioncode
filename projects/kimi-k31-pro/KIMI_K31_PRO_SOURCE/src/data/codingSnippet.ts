// On-screen strings for scenes 01 and 04 (kept out of the scene files: they contain digits, e.g. "3D").
// GEAR_SNIPPET and TURBINE_SNIPPET are verbatim excerpts of src/three/MechanicalAssembly.tsx — the code that really builds
// the gears and the turbine in this film (written for the film, not Kimi output). If that file changes, re-copy the lines
// and the first line numbers below.

/** scene 01: the one prompt line in the terminal */
export const HOOK_PROMPT = 'build an interactive 3D mechanical world';
/** scene 04: the prompt typed into the agent panel */
export const CODE_PROMPT = 'Build an interactive 3D mechanical world.';

/** src/three/MechanicalAssembly.tsx, line 18 onward: gear ratios and the involute tooth outline */
export const GEAR_SNIPPET_FILE = 'MechanicalAssembly.tsx';
export const GEAR_SNIPPET_FIRST_LINE = 18;
export const GEAR_SNIPPET: string[] = [
  "// Meshing gears turn the other way:",
  "//   angle_b = -angle_a * z_a / z_b",
  "// + a phase so a tooth of A sits in a gap of B.",
  "export const meshAngle = (",
  "  a: number, za: number, zb: number, phi: number,",
  ") => -a * (za / zb) + phi * (1 + za / zb)",
  "  + Math.PI - Math.PI / zb;",
  "",
  "// Involute spur gear outline (pitch radius m·z/2).",
  "export function gearOutline(z: number, m: number) {",
  "  const rp = (m * z) / 2, rb = rp * Math.cos(PA);",
  "  const ra = rp + m, rf = rp - 1.25 * m;",
  "  const half = Math.PI / (2 * z) + inv(PA);",
  "  const psi = (r: number) =>",
  "    half - inv(Math.acos(Math.min(1, rb / r)));",
  "  const pts: THREE.Vector2[] = [];",
  "  const at = (r: number, a: number) =>",
  "    pts.push(new V2(r * Math.cos(a), r * Math.sin(a)));",
  "  const r0 = Math.max(rb, rf), steps = 5;",
  "  for (let i = 0; i < z; i++) {",
  "    const c = (i / z) * Math.PI * 2;",
  "    at(rf, c - half);",
  "    for (let k = 0; k <= steps; k++) {",
  "      const r = r0 + ((ra - r0) * k) / steps;",
  "      at(r, c - psi(r));",
  "    }",
];

/** src/three/MechanicalAssembly.tsx, line 138 onward: the fan blades of the turbine in scene 01 */
export const TURBINE_SNIPPET_FIRST_LINE = 138;
export const TURBINE_SNIPPET: string[] = [
  "export function turbineBlades() {",
  "  const blades: THREE.Vector3[][][] = [];",
  "  for (let i = 0; i < BLADES; i++) {",
  "    const a = (i / BLADES) * Math.PI * 2;",
  "    const rings: THREE.Vector3[][] = [];",
  "    for (let s = 0; s <= SPAN; s++) {",
  "      const k = s / SPAN;",
  "      const r = lerp(R_HUB, R_TIP, k);",
  "      const twist = lerp(0.96, 0.49, k);",
  "      rings.push(section(r, a, twist, k));",
  "    }",
  "    blades.push(rings);",
];

/** editor chrome (scene 04) */
export const WORKSPACE = {
  title: 'mechanical-world — MechanicalAssembly.tsx',
  tree: [
    { name: 'MECHANICAL-WORLD', depth: 0, dir: true, open: true },
    { name: 'src', depth: 1, dir: true, open: true },
    { name: 'three', depth: 2, dir: true, open: true },
    { name: 'MechanicalAssembly.tsx', depth: 3, active: true },
    { name: 'stage.tsx', depth: 3 },
    { name: 'scenes', depth: 2, dir: true, open: true },
    { name: 'CodingWorld.tsx', depth: 3 },
    { name: 'components', depth: 2, dir: true },
    { name: 'data', depth: 2, dir: true },
    { name: 'index.ts', depth: 2 },
    { name: 'package.json', depth: 1 },
    { name: 'tsconfig.json', depth: 1 },
  ],
  tabs: [
    { name: 'MechanicalAssembly.tsx', active: true },
    { name: 'CodingWorld.tsx' },
    { name: 'stage.tsx' },
  ],
  status: { left: ['main', 'TypeScript JSX'], right: ['UTF-8', 'Spaces: 2', 'LF'] },
  agentSteps: ['Plan the gear train', 'Write MechanicalAssembly.tsx', 'Open live preview'],
  terminalTitle: 'zsh — mechanical-world',
} as const;
