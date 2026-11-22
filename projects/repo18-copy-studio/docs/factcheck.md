# Fact check (before any VO)

Repo facts come from the GitHub REST API on 2026-11-20 (`docs/repos.json`): full name, stars, licence and description. The list itself is @flxrnc's post (https://x.com/flxrnc/status/2123392905934999811), credited on screen as "list by @flxrnc".

| # | Line claim | Source | Status |
|---|---|---|---|
| 1 | reanimate copies any animation frame by frame | repo description: "reverse-engineers any animation frame by frame, then proves the copy moves the same" | ✅ 1,924★ MIT |
| 2 | motion-design-skill: animator-like timing and easing | "timing, easing, choreography, and Disney animation principles" | ✅ 3,442★ MIT |
| 3 | mg-styles-15: 15 styles, each from one prompt | "15 motion design styles, each made … from one prompt" | ✅ 3,734★ MIT |
| 4 | huashu-art-motion: paintings that move, 35 styles | description (zh): "35种艺术风格 … 用代码让画动起来" | ✅ 7,324★ MIT |
| 5 | anidoodle: doodles and loops, all as code | "Art and animation, written as code. Illustrations, loops…" | ✅ 1,877★ Apache-2.0 |
| 6 | Manim: formulas into smooth animation | "framework for creating mathematical animations" | ✅ 42,717★ MIT |
| 7 | blender-skills: pro Blender workflows for your agent | "Professional Blender 5.3 workflows as Agent Skills for Claude Code, Codex…" | ✅ 2,495★ MIT |
| 8 | three.quarks: particles / VFX | "particle system / VFX engine for three.js" | ✅ 1,249★ MIT |
| 9 | react-postprocessing: the cinematic finish | "Postprocessing for react-three-fiber" | ✅ 1,679★ MIT |
| 10 | Tweakpane: a slider for every detail | "Compact GUI for fine-tuning parameters" | ✅ 4,721★ MIT |
| 11 | EffectCraft: compositing, written in Rust | "open-source motion graphics and compositing tool written from scratch in pure Rust" | ✅ 9,015★ Apache-2.0 |
| 12 | cinetic: launch films from code | "Cinematic launch films and motion design from code" | ✅ 1,310★ MIT |
| 13 | motionmaxxing: turns AI slop into designer-level motion | "turns AI slop videos into films that look …" | ✅ 1,706★ Apache-2.0 |
| 14 | Openverse: free sounds and music | "search engine for openly-licensed media" (repo WordPress/openverse; the post links api.openverse.org) | ✅ 719★ MIT. We say "openly licensed", never "copyright-free" |
| 15 | librosa: finds the beat | "Python library for audio and music analysis" | ✅ 9,046★ ISC |
| 16 | WhisperX: word-level timing | "Automatic Speech Recognition with Word-level Timestamps" | ✅ 25,520★ BSD-2 |
| 17 | Remotion Skills: official video skills for coding agents | remotion-dev org, "Agent Skills" | ✅ 7,608★, no licence field. We never say "free": Remotion has its own company licence |
| 18 | FFmpeg: into a real video file | FFmpeg mirror | ✅ 67,697★ |
| T | Total stars across the 18 repos: 193,783 (sum, 2026-11-20) | docs/repos.json | ✅ Spoken as "about 1.9 lakh"; the exact number is on screen |
| R | The original post passed 137k views and 4k bookmarks | fxtwitter API at fetch time | ✅ Shown only as "137k views" |

**On-screen label:** the upgrades are our own illustration of what each tool does. Where we actually ran the tool in making the reel, we say so: librosa beat grid, word timings (faster-whisper on the channel stack, not WhisperX), Remotion, FFmpeg. Small, quiet label: "illustration · tools named = real repos".
