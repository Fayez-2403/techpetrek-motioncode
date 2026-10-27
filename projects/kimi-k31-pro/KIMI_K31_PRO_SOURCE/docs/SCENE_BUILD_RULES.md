# Scene build rules (for everyone building a scene in this project)

Project: `C:\Users\ce\motion-as-code\projects\kimi-k31-pro\KIMI_K31_PRO_SOURCE` (Remotion 4.0.538, React 19, three 0.186,
@react-three/fiber 9, @remotion/three). Read first: `STORYBOARD.md` (your scenes' shot specs and the hand-off frames to the
neighbouring scenes), `REFERENCE_ANALYSIS.md` (craft lessons), `src/data/verifiedClaims.ts`, `src/styles/theme.ts`,
`src/styles/typography.ts`, `src/lib/anim.ts`, `src/lib/rng.ts`, `src/lib/layout.ts`, `src/three/stage.tsx`, and the
components in `src/components/`. `src/scenes/ModelReveal.tsx` and `src/scenes/CADLaboratory.tsx` are the reference scenes
for the quality bar once they exist.

## File ownership (parallel work)
- Edit ONLY the files you were assigned (your scene files, plus new files you create with your scene's name in them, e.g.
  `src/three/HumanRig.tsx`, `src/data/fictionalFinance.ts`). Never edit shared files (theme, typography, anim, rng, layout,
  stage, components/*, compositions/*, Root.tsx, sceneManifest.ts, verifiedClaims.ts, SCENE_TIMINGS.json, package.json).
  If you need a shared helper changed, write a local helper in your own file and mention it in your final report.
- Do not run git commands (the lead commits). Do not install packages.
- Put your stills in `out/wip/<your-agent-name>/` and your bundle in `out/bundle-<your-agent-name>/`.

## Scene contract
- Export the component with the exact name in `src/data/sceneManifest.ts`, signature `React.FC<SceneProps>`
  (`{ dur: number; variant: 'master' | 'reel' }` from `src/scenes/types.ts`). `dur` is the scene length in frames (30 fps).
- **Pure function of the frame** (`useCurrentFrame()`, local to the scene). No `Math.random`, `Date.now`, `performance.now`,
  R3F `useFrame` deltas or physics engines. Seeded randomness only (`mulberry32`, `hash` from `src/lib/rng.ts`).
  Rendering the same frame twice must give the same pixels.
- **Duration-elastic:** time phases as fractions of `dur` (e.g. `const p = f / dur`), with sensible minimum spans, so the scene
  works at both the master and reel lengths (see the table in STORYBOARD.md: e.g. coding is 12.6 s master but 5.4 s reel)
  and after the voice changes. In the short reel versions, drop secondary beats rather than speeding everything up.
- **Both formats:** `useLayout()` gives `{ w, h, tall, safe, t }`. Recompose for 9:16 (stack, re-frame the camera, larger
  type), never just crop. Reel content must stay between y = 260 and y = 1360 (captions + Instagram UI below, UI above);
  master key text above y = 900 (captions at the bottom ~64–150 px). Side margin `safe.side`.
- **Numbers and claims:** never type a number or claim into a scene. Import from `src/data/verifiedClaims.ts`
  (`N`, `CLAIMS`, `NAMES`, `LABELS`) or `src/data/benchmarkData.ts`. Every number shown carries its qualifier via
  `<SourceAttribution id=... />` (or the claim's `qualifier`). Fictional sample data (finance, agent UI) lives in your own
  `src/data/<scene>*.ts` file and must be visibly fictional. Do not invent Kimi outputs, latencies, speeds or results.
- **Provenance label:** B scenes render `<ProvenanceLabel kind="B" note="..." />`, C scenes `<ProvenanceLabel kind="C" />`.
  Any success indicator (check marks, "tests passed", green states) must sit inside a labelled reconstruction.
- **Type:** fonts via `F.display` (Unbounded), `F.text` (Instrument Sans), `F.mono` (JetBrains Mono); sizes from `L.t`
  (hero > title > statement > evidence > label/attribution). Kinetic words: `KineticTitle` effects (`build`, `depth`,
  `faster`, `reason`, `rise`, `decode`) — don't animate every word the same way.
- **Look:** palette in `C` / `WORLD` (theme.ts). Each world has its own character (code = real dev workspace; CAD = neutral
  engineering studio; lab = dim scientific viz; finance = light premium panels). No stock glowing robots, no random camera
  shake, no unreadable glitch type, no endless typing, no template transitions.
- **3D:** use `ThreeStage`, `Env` (studio reflections) and `CamRig` from `src/three/stage.tsx`. Build geometry once with
  `useMemo`; animate transforms/uniforms per frame. Keep it light enough for an Intel Iris Xe (aim < 1.5 s per frame at
  1080p): no huge particle counts (≤ 60k points), no post-processing passes, modest shadow use. Fake glow with additive
  sprites / emissive materials.
- **Hand-offs:** match the first/last frames described in STORYBOARD.md for your scenes (positions, sizes, colours), so
  cuts are motivated.

## Checking your work (required)
1. Type-check: `node node_modules/typescript/bin/tsc --noEmit` (fix every error in your files).
2. Bundle once per code change: `npx remotion bundle src/index.ts --out-dir out/bundle-<name>` (~10 s).
3. Stills from that bundle (~4 s each): `npx remotion still out/bundle-<name> S-<scene>-<variant> out/wip/<name>/<file>.png --frame=<n>`
   (compositions: `S-hook-master`, `S-coding-reel`, … ids in SCENE_TIMINGS.json; frame numbers are local to the scene).
4. LOOK at the PNGs with the Read tool: start, middle, end and every phase change, for master AND reel. Check sharpness,
   framing, legibility at phone size, overflow, safe zones, font rendering, aliasing, colour consistency. Fix what's weak
   and re-check. Two or three critique rounds per scene is normal. Don't stop at "it renders".
5. Run at most one still/bundle command at a time (memory is shared with other builders).

## Report back
Files created/changed, what each scene shows per phase (master and reel), the hand-off frames, provenance labels used,
any compromise vs STORYBOARD.md and why, any helper you'd like promoted to a shared file, and the paths of 4–6 stills that
best show the result.
