# Motion Flex: the skills and repos behind the reel (for the "comment MOTION" DMs)

Checked on 13 October 2026. For each repo we read the README and its key files, and took stars, licence and last push from
`api.github.com`. Star counts are attention, not proof of quality. No repository name appears in the video.

**The DM kit:** `kit/claude-opus 5.5 200IQ implementation.pdf` (16 phone-sized pages) and `kit/prompt.md` (the master prompt).
The PDF's prompt pages are generated from `prompt.md`; after editing it, rebuild with `cd app; bun scripts/build_kit.ts`.

## Ready-to-paste DM

> Hey! Here's everything behind the reel 👇
>
> **Start here**
> • github.com/charlie947/motion-graphics-skills (Claude Code skills: UI morphs, kinetic type, particle logos, reel export)
> • github.com/heygen-com/hyperframes (HTML → video, plus a huge library of motion rules: transitions, beat sync, easing)
> • github.com/JohnHeibel/ClaudeAnimationBase (read ANIMATION_GUIDE.md first, the best guide to character timing)
>
> **For music sync**
> • github.com/mexicat/pdoom-video (the engine I build on: every frame is code, the music drives it)
> • the music-to-video skill inside HyperFrames
>
> **For 3D**
> • github.com/mrdoob/three.js
> • the title-sequence-3d skill in Charlie's pack
>
> **If you prefer React**
> • github.com/remotion-dev/remotion + github.com/remotion-dev/skills
>
> **Bonus:** github.com/emilkowalski/skills for animation taste, github.com/guanmo-ai/awesome-ai-motion for inspiration.
> The trick that matters most: one clock, measure the song, and make every object turn into the next one.

## What each one is (and what was used from it)

| Repo | Stars · licence · last push | What it is | Open first | Used in this reel |
| --- | --- | --- | --- | --- |
| [charlie947/motion-graphics-skills](https://github.com/charlie947/motion-graphics-skills) | 245 · MIT · 2026-10-11 | 15 Claude Code motion skills (HTML + `window.seek`) | `skills/motion-effects/references/effects.md`, `reel-export/SKILL.md` | One object changing shape, ghosts and guides, masked type, the safe zone (y 360–1420, right 120 px) |
| [heygen-com/hyperframes](https://github.com/heygen-com/hyperframes) | 61,964 · Apache-2.0 · 2026-10-13 | Deterministic HTML → MP4 framework with 21 agent skills | `.claude/skills/cut-the-curve`, `motion-doctrine`, `skills/music-to-video/references/motion-primitive-catalog.md` | Lead the hit, accents after it; one current direction; nudge curve; punch frames; anti-cliché rules |
| [mexicat/pdoom-video](https://github.com/mexicat/pdoom-video) | 2,690 · MIT (code only) · 2026-10-05 | Code-rendered music video; every frame a pure function of song time | `docs/ENGINE.md`, `docs/TREATMENT.md`, `app/src/timeline.ts` | The engine itself; hit envelopes; shake on slams; motion-blur sub-frames |
| [mrdoob/three.js](https://github.com/mrdoob/three.js) | 116,321 · MIT · 2026-10-13 | 3D for the web | `src/objects/InstancedMesh.js`, `AnimationMixer.setTime` | (the engine's WebGL layer; the reel's own 3D is a small Canvas projector) |
| [remotion-dev/remotion](https://github.com/remotion-dev/remotion) + [skills](https://github.com/remotion-dev/skills) | 63,658 + 5,090 · Remotion licence / none · 2026-10-12 | Video in React, plus official agent skills | `skills/remotion-best-practices/SKILL.md`, `remotion-markup/timing.md` | One global audio clock; no realtime loops |
| [JohnHeibel/ClaudeAnimationBase](https://github.com/JohnHeibel/ClaudeAnimationBase) | 1,073 · MIT · 2026-09-24 | Hand-painted cartoon starter with an acting guide | `ANIMATION_GUIDE.md` | The character: eyes lead, then the body; anticipation, squash, a clear catch |
| [buildwithhanif/claude-animation-skill](https://github.com/buildwithhanif/claude-animation-skill) | 36 · MIT · 2026-09-23 | Node Canvas 2D animation plugin with rigs and a determinism verifier | `references/motion.md`, `references/traps.md` | Game-feel numbers (hit-stop, squash 1.35 → 1) |
| [guanmo-ai/awesome-ai-motion](https://github.com/guanmo-ai/awesome-ai-motion) | 308 · scripts MIT · 2026-10-12 | Gallery of 788 AI-coded motion works with sources | `browse/motion.en.md` | Reference discovery |
| [anthropics/skills](https://github.com/anthropics/skills) | 180,773 · mostly Apache-2.0 · 2026-10-09 | Official Claude skills | `skills/frontend-design/SKILL.md`, `algorithmic-art` | The list of "AI look" tells to avoid |
| [emilkowalski/skills](https://github.com/emilkowalski/skills) | 45,765 · MIT · 2026-10-11 | Animation-taste skills (`apple-design`, `animate`, `review-animations`) | `apple-design` | Spring damping ~0.8–1.0, small overshoot |
| [alexgreensh/anidoodle](https://github.com/alexgreensh/anidoodle) | 898 · Apache-2.0 · 2026-10-10 | 32 hand-drawn styles, scored films | `skills/anidoodle/references/motion-grammar.md` | Cuts that carry motion (matched speed and direction) |
| [alchaincyf/huashu-art-motion](https://github.com/alchaincyf/huashu-art-motion) | 3,674 · MIT · 2026-10-13 | Art-style cards + a measured "anti-slideshow" gate | `scripts/film_gate.py` | No still stretch > 6 s; visual events ≥ 2 per 10 s |
| [digitalsamba/claude-code-video-toolkit](https://github.com/digitalsamba/claude-code-video-toolkit) | 2,211 · MIT · 2026-10-12 | Full Remotion pipeline with open-model TTS/music | `/video` command | (alternative pipeline, not used) |

**Caveats worth telling people:**
- HyperFrames' best motion rules (`motion-doctrine`, `cut-the-curve`) are marked internal, so they aren't installed with the skills; read them on GitHub.
- Remotion's licence requires a company licence above 3 employees.
- `remotion-dev/skills` and `JohnHeibel/PDoomVideo` have no licence file: study them, don't copy their code.

## The ten rules this reel follows (from those sources)

1. **One clock.** Every frame is a pure function of `t`; random values are seeded.
2. **Measure the exact song edit.** Don't trust an internet BPM.
3. **Land moves on the beat.** Moves that must land start early and finish on the hit; accents fire up to 45 ms after it.
4. **Move one object across every cut** and change what it is mid-move. Never crossfade two copies.
5. **Use one current direction** for ordinary transitions. Save the others for meaning.
6. **Keep overshoot small:** spring damping 0.8–1.0, never bounce by default.
7. **Draw lines, never fade them in.** Count up, then lock on the hit.
8. **Hits get several things on the same frame:** flash, shake, ring, type.
9. **Make audio drive behaviour, not decoration.** No EQ bars or pulsing orbs. This reel draws the real waveform and the real bar.
10. **Keep every word in the safe zone,** and check stills at phone size before rendering.
