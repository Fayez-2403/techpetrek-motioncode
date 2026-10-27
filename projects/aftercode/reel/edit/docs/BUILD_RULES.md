# Build rules — Railway / AI-security reel (Remotion 4 + Three.js r186 + R3F 9)

Project: `C:\Users\ce\motion-as-code\projects\railway-ai-security\SOURCE`. Brief: `..\MASTER_PROMPT_CLAUDE.md` (read
<non_negotiables>, <reference_style>, <storyboard>). The reel is 1080×1920, **60 fps**, ~60 s, 120 BPM (beat = 30 frames, bar = 120).

## Concept: THE AI SECURITY CASE BOARD
A dark incident room. On the wall, a detective's evidence board (dark felt / cork, subtle texture) holds paper CASE FILE
cards (one per case, + a dark "WHAT TO DO NOW" checklist card), pinned with push pins, linked by taut red string, with
real "receipt" prints (screenshots of the sources, from `public/receipts/`) pinned beside each card like evidence photos.
A pendant lamp swings slowly; a volumetric light cone with dust motes; restrained film grain. The camera travels between
cases **along the red string** (signature transition). Each case card lifts off the board, flies to camera and fills the
frame; the 2D CASE FILE card (CardLayer) takes over with its media window. The CTA pulls back to reveal the whole web.

## Files / ownership
- Read-only shared contracts (do not edit): `src/lib/{anim,rng,layout,timeline}.ts`, `src/components/cardLayout.ts`,
  `src/styles/*`, `src/three/stage.tsx`, `src/data/cases.json` (written by research; may change — never hard-code its text),
  `src/data/mediaPlan.json`, `SCENE_TIMINGS.json` (generated; currently STUB estimates — build duration-elastic),
  `src/compositions/Reel.tsx`, `src/Root.tsx` (the lead edits these; ask in your report for registrations you need).
- Your own files only (named in your task). No git, no installs, no edits to other builders' files.

## Rules
- Pure function of the frame (`useCurrentFrame()` = film frame in BoardLayer/CardLayer; media items get `f`). No
  Math.random / Date.now / performance.now / useFrame deltas / physics. Seeded `mulberry32`/`hash` only. Same frame twice =
  same pixels.
- Everything timed from `src/lib/timeline.ts` (segments, `IN` = 48-frame board transition at a case segment's start,
  `XF` = 6-frame cross-fades) and fractions of segment length; land hits on beats (30 frames).
- On-screen text comes from `cases.json` / props, never typed facts. No logos of Railway / Reuters / CERT-In / GitHub /
  Anthropic / OpenAI; no fake UI of their sites; receipts are the real PNGs only, unedited, labelled
  "SOURCE: publisher · date". Our own animations carry an `ILLUSTRATIVE` tag. ENV values only `•••••` / `REDACTED`.
  No exploit steps, payload text, or realistic keys. Never "Indian Railways" anything (no trains).
- Instagram safe area: readable text inside y 260–1500 (9:16), side margin 64.
- Fonts: `F.head` Archivo (weights 100–900, stretch 62–125%), `F.serif` Instrument Serif (+ italic), `F.mono` JetBrains
  Mono. Palette `C` in `src/styles/theme.ts` (paper/ink/alert orange, graphite dark variant, string red, mint for actions).
- 3D: `ThreeStage` (pass `width`/`height` for small windows), `Env`, `CamRig` from `src/three/stage.tsx`. Budget on an Intel
  Iris Xe: ≤ 0.8 s per 1080×1920 frame for the board, ≤ 0.4 s for a media window; instancing; no post-processing passes;
  fake glow with additive sprites. Canvas textures (for cards) built once with `useMemo` after fonts load (`document.fonts.ready`
  inside a `delayRender`).
- Look: premium, editorial, cinematic; out-of-the-box but calm and readable. No random shake, no unreadable glitch, flashes
  ≤ 3/s and never full-screen strobe.

## Checking
`node node_modules/typescript/bin/tsc --noEmit`; bundle `npx remotion bundle src/index.ts --out-dir out/bundle-<you>`; stills
`npx remotion still out/bundle-<you> <Composition> out/wip/<you>/<f>.png --frame=<n>`; LOOK at them (Read tool); 2–3 critique
rounds; one render command at a time. Report: files, what happens beat by beat, compromises, registrations you need from the
lead, best stills.
