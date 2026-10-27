# V3 showcase — shot build rules

V3 is a **90.0 s music-only showcase reel** (no narration): a portrait "rotate your phone" card, then a 16:9 film shown
rotated 90° inside the 9:16 frame. The brief asked for the structure, pacing and scene types of Moonshot's official
"Meet Kimi K3.1 Pro" film (see REFERENCE_ANALYSIS.md) — **built from scratch in code**: never copy a specific shot, frame,
character design, logo or footage of that film, any game, film or brand. Generic genres (sky flight, racing, parkour,
zombie survival, future city…) are what we recreate, with our own designs.

Project: `C:\Users\ce\motion-as-code\projects\kimi-k31-pro\KIMI_K31_PRO_SOURCE`. Read first: `docs/SCENE_BUILD_RULES.md`
(the general contract — determinism, file ownership, stills workflow, quality bar; all still apply), `src/v3/lib.tsx`,
`src/v3/timeline.json`, `src/v3/V3Film.tsx`, `src/three/stage.tsx`, `src/lib/anim.ts`, `src/lib/rng.ts`, `src/styles/theme.ts`,
`src/styles/typography.ts`. Look at `src/three/MechanicalAssembly.tsx`, `src/three/HumanRig.tsx`, `src/three/Turbofan.tsx` for
the 3D quality bar already in the film.

## Shot contract
- File `src/v3/scenes/<Name>.tsx` exporting `<Name>: React.FC<V3Props>` (`{ dur }`, frames at 30 fps; lengths in
  timeline.json: 2 bars = 4 s = 120 frames, 3 bars = 180, 4 bars = 240). Replace the stub; keep the export name.
- **Frame = 1920×1080 always.** Use `useLayout()` (it honours the FrameOverride) and `<ThreeStage>` (same); never
  `useVideoConfig()` for sizes. Stills: composition `V3-<id>` (e.g. `V3-skyFlight`), 1920×1080, frames local to the shot.
- **Pure function of the frame**; seeded randomness only; no physics engines, no `useFrame`. Same frame twice = same pixels.
- **Beat sync (120 BPM):** a beat is 15 frames, a bar 60. The shot starts on a downbeat (hard cut). Put visible hits on beats:
  `beatAt(frame)` gives `{ i, ph, pulse }` (pulse decays from 1 on each beat). Camera moves and key actions should land on
  beats/bars (a jump on beat 4, a hit on beat 2, a speed burst on the bar). The music is synthesized to the same grid.
- **Label:** render `<V3Tag label={...} />` with your shot's label from timeline.json (bottom-left; `dark` prop on light
  backgrounds). No other text claims, no numbers about Kimi, no fake UI that implies a Kimi run, no "AI generated" claims.
- **Text keep-out:** in the rotated reel Instagram's UI covers the landscape frame's left 250 px and right 400 px; keep any
  text (titles, UI labels you want read) inside x 250–1520, and also keep text out of the top band y < 140 where x > 880
  (Instagram's like/comment buttons once rotated). The picture itself should use the whole frame.
- **No brands / IP:** no real car makes, game titles, logos (including Blender's logo), real cities' landmarks as the
  subject, or real people. "Blender-style" = a generic DCC layout (viewport, outliner, properties, timeline) with our own
  styling and no Blender branding.
- **Content:** zombie survival stays stylized and bloodless (silhouettes, flashlight, tension — no gore). Fights are a
  stylized duel (energy blades / sparks), no gore.
- **Look:** cinematic and varied per shot (the reference film is colourful game worlds, sunlit skies, neon cities, clean web
  UI on soft backgrounds) — not everything navy. High-end procedural 3D: strong silhouettes, atmospheric perspective (fog),
  controlled reflections (`Env`), rim light, depth; camera always moving with intent (fly-throughs, chase cams, orbit,
  crane), speed lines / motion trails for speed. Fake glow with additive sprites. No post-processing passes.
- **Performance:** aim ≤ 1.5 s per frame at 1080p on an Intel Iris Xe; ≤ 60k points, instancing for crowds/buildings.
- **Each shot must have one "wow" beat** (the reference's best shots: a dive through clouds, a near-miss, an impact, a
  reveal). No dead frames: something moves every frame.

## Workflow
Bundle once per change into `out/bundle-<agent>`, render stills with
`npx remotion still out/bundle-<agent> V3-<id> out/wip/<agent>/<file>.png --frame=<n>`; LOOK at first / beat hits / last
frames; 2–3 critique rounds. One still or bundle command at a time. Do not run git, do not edit shared files, do not
install packages. Report: files, what each shot shows beat by beat, compromises, best stills.
