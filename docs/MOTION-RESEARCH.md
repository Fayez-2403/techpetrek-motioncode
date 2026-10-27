# Motion reel research

Reviewed 13 October 2026. This is an implementation and resource-selection study for the music-led Claude motion reel. Repository names belong in this document and the requested DM resource list, not in the video.

## Decision

Keep this project's deterministic renderer. Use the user's existing motion skills for choreography, extend the installed Three.js layer for a persistent 3D form, and drive the whole reel from the supplied recording's measured audio events. A new rendering framework would add migration work without inherently improving the animation.

The highest-value new research is HyperFrames' continuity guidance and executable examples, followed by Remotion's explicit time and audio rules. Motion Canvas and Theatre.js offer useful authoring ideas, but are less direct fits for this reel. This ranking reflects this codebase and brief; it is not a claim that one project universally produces the best motion.

## Existing project: what was inspected

Local sources: [README](../README.md), [package.json](../app/package.json), [scene interface](../app/src/engine/scene.ts), [audio sampling](../app/src/engine/audio.ts), [engine](../app/src/engine/engine.ts), and the equivalent upstream [animation utilities](https://github.com/mexicat/pdoom-video/blob/fa164b74fd0b26a99375715b619c55b4a0fb3d05/app/src/engine/util.ts).

- `Scene.render(f, out)` receives absolute and local time, continuous beat/bar indices, audio envelopes and onset pulses. `AudioData.beatAt()` and `timeOfBeat()` already convert between seconds and the measured beat grid.
- `kick`, `snare` and `hat` are decaying pulses, suitable for transient accents. `low`, `mid`, `high` and `rms` are envelopes, suitable for sustained intensity. These are different signals and should drive different properties.
- The engine supports HDR render targets, adaptive temporal samples and arbitrary-time rendering. Seeded hashes, noise, keyframes, springs and path-length helpers already exist. Maintain the README's engine boundary: new scene code should use these capabilities without rewriting the engine.
- The existing portrait workflow crops a centered column from a wide logical canvas. Design to that actual crop, then check the exported 1080×1920 image. Wide-scene text positions cannot simply be reused.

Implementation implication: one persistent scene with phases is a particularly good fit. Its form, particles, camera and typography can hand motion across musical changes without the reset that independent plates often introduce.

## Start with the user's skills

The workspace contains Charlie Hills' 13-skill pack at `skills/motion-graphics-skills-main/motion-graphics-skills-main/`. Additional installed motion and HyperFrames skills were found at `C:/Users/ce/.claude/skills/`. They are existing local resources; this research did not install or refresh anything.

### Charlie Hills pack

Read: the local `README.md`, `LICENSE`, `motion-effects/SKILL.md`, `motion-effects/references/effects.md`, `title-sequence-3d/SKILL.md`, `reel-export/SKILL.md` and `motion-brief-writer/SKILL.md`. [Upstream pack](https://github.com/charlie947/motion-graphics-skills).

The most useful recipes are masked type, perspective shift, flowing paths, card-to-workspace and particle-logo assembly. Their common strength is a visible object changing its role: a container expands into its next layout, or points converge into a meaningful shape. The object remains recognizable through the move. Preserve that principle across the reel.

The pack's eight-second effect structure includes a long hold and a return. It explicitly cautions that complete loops are too slow as reel inserts. Borrow active transformations and retime them to measured musical anchors; do not chain sixteen complete demonstrations. The export skill's y=360–1420/right-120px protection is a conservative local layout convention, not proof of a permanent Instagram interface specification.

The pack is MIT licensed. Its model-specific marketing is separate from its techniques: deterministic drawing, masks and timing can be implemented by any capable coding model. It supplies instructions, not an automatic increase in model or GPU capability.

### Installed HyperFrames resources

Read locally:

- `music-to-video/SKILL.md`, `references/motion-primitive-catalog.md`, and selected analysis code in `scripts/analyze-beatgrid.py`.
- `motion-graphics/SKILL.md` and `hyperframes-animation/SKILL.md`.
- `hyperframes-animation/adapters/three.md`, `rules-index.md`, and `rules/nudge-curve.md`.
- `hyperframes-creative/references/motion-principles.md`.
- Executable examples `music-to-video/references/templates/card-flyby/index.html` and `music-to-video/references/motion-primitives/particle-burst/scene.html`.

The music catalog distinguishes an event's arrival from an animation's beginning. To make a shape land on a hit, start its movement before that hit; an impact-triggered accent starts at the hit. Reserve camera travel for phrases, structural changes for strong anchors and small texture accents for weaker events. This is a better translation of the user's request than applying a scale pulse to every object on every beat. [Source catalog](https://github.com/heygen-com/hyperframes/blob/ab06445439333ce23eb5e415f9c51e3bd3ac461d/skills/music-to-video/references/motion-primitive-catalog.md).

The installed analyzer uses `librosa.beat.beat_track`, frequency-band energy/flux and heuristic drum classification. Its default four-beat bar assumption and inferred drum labels are analysis outputs, not ground truth about every recording. Save one canonical analysis and verify the resulting sync against the actual clip. The exact short or remix matters more than an internet BPM label. [Analysis source](https://github.com/heygen-com/hyperframes/blob/ab06445439333ce23eb5e415f9c51e3bd3ac461d/skills/music-to-video/scripts/analyze-beatgrid.py).

Code-level findings from the examples:

- **Card flyby:** a finite table of depth/rotation poses, plus an explicit landing schedule, produces the impression of a continuous deck passing the camera. It advances neighboring cards together and reveals each solid face with a diagonal mask. The landing schedule is an excellent data interface for this reel. The supplied example is fixed at 1920×1080, and its fallback schedule is hand-designed rather than music analysis. Adapt both. [Reviewed implementation](https://github.com/heygen-com/hyperframes/blob/ab06445439333ce23eb5e415f9c51e3bd3ac461d/skills/music-to-video/references/templates/card-flyby/index.html).
- **Particle burst:** a fixed 36-element pool derives directions and lengths from the particle index, which makes its variation repeatable. Useful idea, but its hero entry overlaps later scale tweens and uses an elastic settle. For this project, compute one analytic transform per object and use a restrained settle instead of copying the overlapping timeline verbatim. [Reviewed implementation](https://github.com/heygen-com/hyperframes/blob/ab06445439333ce23eb5e415f9c51e3bd3ac461d/skills/music-to-video/references/motion-primitives/particle-burst/scene.html).
- **Nudge curve:** separates a short acceleration, a fast travel segment and a longer deceleration. The recipe is a useful rhythm reference; if implementing it as mathematical segments, inspect the velocity at each join because adjacent easing functions do not automatically guarantee derivative continuity. [Recipe](https://github.com/heygen-com/hyperframes/blob/ab06445439333ce23eb5e415f9c51e3bd3ac461d/skills/hyperframes-animation/rules/nudge-curve.md).

These resources contain differing house styles. Some encourage ambient motion and varied entry directions; the newer continuity doctrine rejects idle wobble and favors a consistent direction. For this brief, prioritize the user's request for continuous motion: preserve the main object's trajectory and use changes with a visible cause. Keep small audio-driven surface activity subordinate to that trajectory.

## Internet review: adoption signals and fit

GitHub API snapshot retrieved 13 October 2026. Stars and forks indicate public attention and participation; neither measures installed users, output quality or commercial adoption. Last push is activity metadata, not a maintenance guarantee. Every row links the primary API record used for its counts.

| Repository | Stars | Forks | Last push (UTC date) | Fit here |
| --- | ---: | ---: | --- | --- |
| [Three.js](https://api.github.com/repos/mrdoob/three.js) | 116,315 | 36,626 | 2026-10-12 | Already installed; strongest direct 3D extension |
| [Remotion](https://api.github.com/repos/remotion-dev/remotion) | 63,585 | 5,008 | 2026-10-12 | Established alternative rendering framework |
| [HyperFrames](https://api.github.com/repos/heygen-com/hyperframes) | 61,745 | 5,524 | 2026-10-12 | Strong existing skill library and choreography examples |
| [GSAP](https://api.github.com/repos/greensock/GSAP) | 29,127 | 2,252 | 2026-04-13 | Useful optional authoring timeline; unnecessary for pure math here |
| [Motion Canvas](https://api.github.com/repos/motion-canvas/motion-canvas) | 19,300 | 839 | 2026-07-02 | Strong explainer authoring concepts; a separate runtime |
| [Theatre.js](https://api.github.com/repos/theatre-js/theatre) | 12,755 | 479 | 2024-08-14 | Visual keyframe authoring, with integration and activity caveats |
| [Remotion skills](https://api.github.com/repos/remotion-dev/skills) | 5,074 | 559 | 2026-10-12 | Valuable time/audio/3D rules; React-specific examples |
| [pdoom-video](https://api.github.com/repos/mexicat/pdoom-video) | 2,684 | 293 | 2026-10-05 | Exact renderer ancestry and closest musical example |
| [Motion graphics skills](https://api.github.com/repos/charlie947/motion-graphics-skills) | 237 | 42 | 2026-10-11 | Already owned; focused creative recipes |

HyperFrames also maintains an [adopter list](https://github.com/heygen-com/hyperframes/blob/ab06445439333ce23eb5e415f9c51e3bd3ac461d/ADOPTERS.md). It describes production uses and exploratory uses together. Treat those as project-reported examples, not independently audited adoption totals.

### 1. pdoom-video: keep the proven foundation

Reviewed upstream README, `app/src/engine/util.ts`, license, and this fork's scene/audio/engine implementations. The useful mechanics are arbitrary-time frames, seeded variation, music features and temporal sampling. Its existing aesthetic is a reference, not the required style for the new reel. [Repository](https://github.com/mexicat/pdoom-video), [reviewed utilities](https://github.com/mexicat/pdoom-video/blob/fa164b74fd0b26a99375715b619c55b4a0fb3d05/app/src/engine/util.ts).

**Action:** reuse the rendering pipeline and implement new visual phases as a scene. Keep motion equations dependent on `f.t`, measured beat positions and stable object indices. Upstream's MIT code license does not license its song, lyrics or separately licensed fonts. [License and credits](https://github.com/mexicat/pdoom-video#license).

### 2. Three.js: use actual spatial continuity

Reviewed `src/objects/InstancedMesh.js` and the license. `InstancedMesh` is appropriate for many objects sharing geometry/material with distinct transforms. `setMatrixAt()` writes the matrix array; the upload must be requested with the instance buffer's `needsUpdate` flag after batch updates. [Source](https://github.com/mrdoob/three.js/blob/dev/src/objects/InstancedMesh.js).

**Action:** build a fixed index set whose positions interpolate between a ring, a lattice, an orbit and an assembled symbol. Do not destroy the set at each phase. One lighting system and a deliberate camera path make the form feel physical. Avoid per-frame object/material allocation. Use the existing installed Three.js version, not the older CDN version appearing in a skill example. MIT licensed. [License](https://github.com/mrdoob/three.js/blob/dev/LICENSE).

### 3. HyperFrames: the strongest additional continuity study

Reviewed `motion-doctrine`, `seam-craft`, the local executable examples above, and runtime adapters `three.ts` and `gsap.ts`. Its [motion doctrine](https://github.com/heygen-com/hyperframes/blob/ab06445439333ce23eb5e415f9c51e3bd3ac461d/.agents/skills/motion-doctrine/SKILL.md) emphasizes matching direction, axis and speed across a cut, with a recognizable carrier object. Its [seam notes](https://github.com/heygen-com/hyperframes/blob/ab06445439333ce23eb5e415f9c51e3bd3ac461d/.agents/skills/seam-craft/SKILL.md) explain why an opaque stage background matters when transition layers expose the stage.

The [Three adapter](https://github.com/heygen-com/hyperframes/blob/ab06445439333ce23eb5e415f9c51e3bd3ac461d/packages/core/src/runtime/adapters/three.ts) publishes an explicit seek time and handles readiness; it does not animate the scene for the author. The [GSAP adapter](https://github.com/heygen-com/hyperframes/blob/ab06445439333ce23eb5e415f9c51e3bd3ac461d/packages/core/src/runtime/adapters/gsap.ts) contains substantial exact-boundary handling. This supports retaining simple analytic scene state in the current engine.

**Action:** borrow continuity and landing-schedule design now. Consider HyperFrames when a future project needs HTML-native authoring and its catalog. Migrating this renderer is unnecessary. Apache-2.0; preserve applicable notices when redistributing source. [License](https://github.com/heygen-com/hyperframes/blob/ab06445439333ce23eb5e415f9c51e3bd3ac461d/LICENSE).

### 4. Remotion skills: useful discipline, different runtime

Reviewed current `skills/remotion-markup/{timing,audio-visualization,transitions,3d}.md`. The [3D rule](https://github.com/remotion-dev/skills/blob/7ba4dcf8ebe1626b00baa41e1f2478113719b60b/skills/remotion-markup/3d.md) requires animation from the composition frame, not an independent realtime loop. The [audio rule](https://github.com/remotion-dev/skills/blob/7ba4dcf8ebe1626b00baa41e1f2478113719b60b/skills/remotion-markup/audio-visualization.md) explicitly warns about local frame offsets discontinuously sampling a shared soundtrack. [Transitions](https://github.com/remotion-dev/skills/blob/7ba4dcf8ebe1626b00baa41e1f2478113719b60b/skills/remotion-markup/transitions.md) distinguish overlaps that shorten a sequence from overlays that do not.

**Action:** preserve a global audio clock, clamp phase interpolation and account for overlaps explicitly. Do not paste React hooks into this Canvas/Three scene. [Timing source](https://github.com/remotion-dev/skills/blob/7ba4dcf8ebe1626b00baa41e1f2478113719b60b/skills/remotion-markup/timing.md).

The main renderer uses the Remotion License, not MIT: the reviewed terms allow qualifying individuals/small organizations free use and require a company license outside that eligibility. The skills repository API reports no detected license; do not infer a permissive copying license from public visibility. [Main license](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md), [official skill documentation](https://www.remotion.dev/docs/ai/skills).

### 5. GSAP: optional explicit timeline authoring

Reviewed `src/gsap-core.js` around `seek`, `totalTime`, `time` and `paused`. `seek()` resolves a timeline position through `totalTime()`, and paused timelines can therefore be driven by a render clock. This is a useful authoring option for complex DOM choreography, but it does not make uncontrolled callbacks or independent tweens deterministic. [Core source](https://github.com/greensock/GSAP/blob/master/src/gsap-core.js).

**Action:** use the existing math helpers for this scene. If later adding GSAP, make the render clock its owner and test nonsequential seeks. GSAP uses its own no-charge standard license, including restrictions involving competing visual animation builders; it is not MIT. [Official license](https://gsap.com/community/standard-license/).

### 6. Motion Canvas: excellent staged explanations

Reviewed `flow/all.ts`, `tweening/tween.ts` and `time-events.mdx`. `all()` joins concurrent generator tasks; `tween()` evaluates against the framework's fixed thread time; named time events let authors retime an action against audio. [Concurrent flow](https://github.com/motion-canvas/motion-canvas/blob/7b91435c301d530351dcf5ebb91dd139c002e405/packages/core/src/flow/all.ts), [tween source](https://github.com/motion-canvas/motion-canvas/blob/7b91435c301d530351dcf5ebb91dd139c002e405/packages/core/src/tweening/tween.ts), [time events](https://github.com/motion-canvas/motion-canvas/blob/7b91435c301d530351dcf5ebb91dd139c002e405/packages/docs/docs/getting-started/time-events.mdx).

**Action:** borrow named anchors such as `first-hit`, `morph-lock` and `cta-land`; resolve them from the audio map. Do not transplant generator state into arbitrary-time render callbacks. Better candidate for a future detailed explainer than a new dependency for this reel. MIT licensed. [License](https://github.com/motion-canvas/motion-canvas/blob/7b91435c301d530351dcf5ebb91dd139c002e405/LICENSE).

### 7. Theatre.js: editor when hand-tuning becomes valuable

Reviewed `packages/core/src/sequences/TheatreSequence.ts` and root/core/studio licenses. The public sequence exposes a position setter, pause/play controls and attached-audio handling. This suggests an optional authoring path for camera/keyframe tuning, followed by rendering at explicit positions. [Sequence source](https://github.com/theatre-js/theatre/blob/6ea82b938ea49609489f6377ded693ccc6ee8f5b/packages/core/src/sequences/TheatreSequence.ts).

**Action:** defer. The current project does not need a new editor or saved-state format, and the API snapshot reports an older last push than the other candidates. Core is Apache-2.0, while Studio has a separate AGPL-3.0 license; do not generalize the root license to every package. [Core license](https://github.com/theatre-js/theatre/blob/6ea82b938ea49609489f6377ded693ccc6ee8f5b/packages/core/LICENSE), [Studio license](https://github.com/theatre-js/theatre/blob/6ea82b938ea49609489f6377ded693ccc6ee8f5b/packages/studio/LICENSE).

## Concrete translation into this reel

These are proposed design decisions derived from the research, not claims about completed validation:

1. Start with a composed frame and visible motion. Keep the first claim readable while one spatial form establishes the visual language.
2. Keep a carrier across every phase: the same ring/points/container should become the next structure. Match screen position and velocity at handoffs. If the form leaves left, the next element must continue that motion unless an impact visibly redirects it.
3. Separate continuous motion from percussion. A camera path supplies travel; measured bass energy supplies restrained surface response; sparse onsets trigger emphasis. Avoid restarting all three on each beat.
4. Lock major transformations onto actual musical events. Retiming parameters should reference audio anchors, not independent guessed second values spread across scene files.
5. Let typography demonstrate capabilities through its treatment: a masked word, a word arranged in depth, then a particle reconstruction. One short message per phase; no repository list, fake benchmarks or fabricated productivity numbers.
6. Finish with a readable request such as `COMMENT MOTION` / `FOR THE SKILLS + REPOS`. The DM delivers the promised resources. A loop back should preserve the visual trajectory; it should not undo everything in a long reverse animation.
7. Verify out-of-order seeks, the frame before/at/after each handoff, phone-size readability, the exact crop, and the finished video's music sync. Review motion at playback speed as well as still frames; a contact sheet cannot demonstrate continuity or beat timing.

## Claude Opus 5.5: verified name versus authorship

Anthropic's official announcement is dated **22 September 2026** and identifies **Claude Opus 5.5**, including the API identifier `claude-opus-5-5` in its availability section. The model name in the brief is valid as of this research date. [Official announcement](https://www.anthropic.com/claude-opus-5-5).

That verifies the product, not who created this project's code. A statement such as “built only with Claude Opus 5.5” needs an actual Claude-authored workflow and an honest account of the existing engine, supplied music and source assets. Keep the current deliverable framed as a Claude motion showcase or workflow concept unless that stronger production claim has been established. “State of the art” is the creative ambition here; no comparative motion-quality benchmark was run.

The supplied music and Instagram reference URLs are separate inputs. Repository research does not prove that their audiovisual content has been downloaded, listened to or visually inspected. Those access and inspection results belong in the production notes from the reference/audio work.

## Ready-to-send resource DM

> Here are the motion resources I researched for the reel:
>
> Start here: [Motion Graphics Skills](https://github.com/charlie947/motion-graphics-skills) for effect recipes and briefs.
>
> For music timing and continuous transitions: [HyperFrames](https://github.com/heygen-com/hyperframes).
>
> For a code-rendered music video and deterministic rendering approach: [pdoom-video](https://github.com/mexicat/pdoom-video).
>
> For 3D forms and camera motion: [Three.js](https://github.com/mrdoob/three.js).
>
> Prefer React? Use [Remotion](https://github.com/remotion-dev/remotion) with its [agent skills](https://github.com/remotion-dev/skills).
>
> My main takeaway: use one clock, analyze the exact song edit, and make objects transform into the next scene. Installing more libraries alone will not create better motion.

This is prepared copy only. No DMs were sent.

## Addendum: the user's Movez course and its linked projects

The X URL supplied later was inaccessible directly. The author's [own readable edition](https://movez.substack.com/p/how-to-build-motion-design-studio) was read instead. Applied here: deterministic frames, a state list on measured audio, closed-form container motion, reference inspection, and critique before export. The user's attached storyboard supplies the creative content and explicitly authorizes execution; optional approval instructions in the article are not a new restriction on that request.

Additional primary repositories reviewed, 13 October 2026:

| Project | Material inspected | Useful contribution / fit |
|---|---|---|
| [JohnHeibel/PDoomVideo](https://github.com/JohnHeibel/PDoomVideo) | README, `ANIMATION_GUIDE.md`, directory architecture | p5.js/brush character film, chapter-level continuity. Distinct from this workspace's mexicat engine; do not confuse the two. |
| [ClaudeAnimationBase](https://github.com/JohnHeibel/ClaudeAnimationBase) | Full `ANIMATION_GUIDE.md`, README, engine/character API documented there | Staged cause/reaction, readable poses, consistent screen direction, deterministic independent frames, and detailed strips around contacts. Particularly useful for the character's catch. MIT starter; not installed. |
| [claude-animation-skill](https://github.com/buildwithhanif/claude-animation-skill) | README and its library/file map | Node Canvas alternative with character rigs, texture vocabulary, sound cues, sheet/strip/determinism verification. MIT. Useful for a richer illustrated follow-up; no need to replace this renderer. |
| [Battle-of-Austerlitz-Film](https://github.com/WinterArc21/Battle-of-Austerlitz-Film) | README, documented renderer/shader/event/score architecture | Long-form staging, procedural environments, picture-derived sound events, resumable chunks. A production example rather than a lightweight reusable motion skill. |
| [awesome-ai-motion](https://github.com/guanmo-ai/awesome-ai-motion) | README, categorization and source-linked UI-morph entries | Reference discovery, not an animation engine. Its showcased UI morph is relevant to browser → app → dashboard. Popularity snapshots are discovery signals, not proof of quality or engagement. |
| [awesome-claude-5-5-videos](https://github.com/athemeroy/awesome-claude-5-5-videos) | README and evidence/production-method discussion | The original Opus-only URL now redirects to a broader model collection. Useful for comparing production evidence and styles; creator attribution and sampled previews do not verify model calls or full-motion quality. |

The 30-second implementation follows those practical ideas, with original fictional demos in the established rendering architecture. It does not copy another creator's characters or footage. Repository research is not the same as integrating or executing every repository.
