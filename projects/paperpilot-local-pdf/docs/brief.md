# Brief: PaperPilot: your PDFs, your device

Created 2026-10-29 from the motion-studio reel template.
- **The contract:** `docs/TECHPETREK_MASTER_REEL_STUDIO.md` (repo root).
- **The block brief method:** `.claude/skills/motion-studio/guide/brief.md`.

**How to fill it:**
- Fill every field.
- `AUTO`: the agent decides and writes down what it chose.
- `MISSING`: an honest placeholder. It blocks only the scene or export that needs it.

## NEW REEL BRIEF
```yaml
project_title: "PaperPilot: your PDFs, your device"
subject_and_angle: "PaperPilot v0.6.1 (Apache-2.0, Rust): process PDFs locally instead of uploading them, and hand the same tools to AI agents over MCP"
primary_source_urls: ["https://github.com/KrushnaVardhanReddy/PaperPilot", "https://github.com/KrushnaVardhanReddy/PaperPilot/releases/tag/v0.6.1", "https://github.com/KrushnaVardhanReddy/PaperPilot/blob/main/docs/coding-agents.md", "https://usepaperpilot.com"]
secondary_reference_urls: ["https://zeli.app/story/50238739", "https://sesamedisk.com/pure-rust-pdf-engine-with-wasm-and-mcp/"]
mode: PRODUCT_DEMO           # NEWS_LAUNCH | SOURCE_COMPILATION | MASCOT_FILM | EDITOR_AURA | PRODUCT_DEMO | EXPLAINER
idea: "user storyboard (8 scenes) + idea: real receipts (our own MCP / browser test runs as on-screen proof)"           # one of the 20 in .claude/skills/motion-studio/guide/ideas.md (or two combined)
runtime_seconds: 55
runtime_max_seconds: 100
format: "9:16"
resolution: "1080x1920"
fps: 60
language: "Hinglish"  # Devanagari TTS, Roman captions
voiceover: "WRITE_AND_GENERATE_IF_AUTHORIZED"   # ElevenLabs Liam, eleven_turbo_v2_5 hi (channel default)
soundtrack: "ORIGINAL"                           # synthesized score; a user song only with its file + permitted use
hook: "PRIVATE_REPORT.pdf being dragged to an upload button; time freezes; RUKO! slams in"
core_reveal: "Your PDFs can be processed on your own device, and AI agents can use the same tools through MCP (but a cloud AI can still see what the tools return)"
scene_count: 8
featured_source_videos: []
visual_style: "Premium cinematic, high-retention, highly original, physically meaningful animation"
actor_reference_images: []
mascot_or_character_reference_images: []
logo_file: "public/brand/techpe-trek.jpg"
preferred_cta: "Comment PAPER (repo link by DM)"
post_caption: true
cover_image: true
budget: "FREE-FIRST"
licensing_requirements: "Only owned/authorized/appropriately licensed media; track permissions in docs/asset_manifest.csv"
critical_constraints: ["user script word for word except: Indian developer removed (no source, F12)", "no invented benchmarks / percentages / stars", "success check only for runs we executed (F8, F9)", "privacy: local processing is not offline AI (F10)", "repo demo.gif NOT used: staged mock (wrong tool names, unverified 75%)", "logo_design.jpg NOT used: AI-generator watermark"]
```

## Logline
A viewer about to upload a private PDF to a random website is stopped mid-drag, discovers PaperPilot does the same job on their own device, watches Claude Code drive it over MCP, and learns the one privacy catch.

## Block brief (motion-studio)
- FILM: 55 s PRODUCT_DEMO, 8 scenes (user storyboard), Hinglish VO (Liam turbo v2.5, seed 5, speed 1.12).
- BRAND: HERO = the paper sheet (PDF) itself; APP = PaperPilot (orange paper-plane icon, real web + desktop UI); RESULT = merged_compressed.pdf from our real Claude Code run; SET = a dark ink-blue desk/stage with a cyan grid floor.
- FACTS: docs/factcheck.md F1-F14.
- FORMAT + RENDERER: 1080x1920, 60 fps, Remotion (React/SVG/CSS 3D). Real screenshots via Playwright.
- TIMELINE: SCENE_TIMINGS.json (55.00 s, 3300 frames) from the voice; every visual hit is a word cue (wf).
- BEATS: hook 0-6.5 / reveal 6.5-13.5 / powers 13.5-21.5 (merge, split, compress, OCR on their words) / engine 21.5-27.5 / mcp 27.5-36.5 / demo 36.5-43 / privacy 43-49 / cta 49-55.
- LOOP: none (hard cut at the end per user).
- CAMERA: one virtual camera per scene (push-in + drift), whip/zoom handoffs; scene 4 orbit via CSS 3D; scene 5 push into the terminal.
- LOOK: palette from the user's prompt (#080B12 / #121D2B / paper #F9FAFC / cyan #29D6E5 / rust #EE7946 / mint #8DE3B5 / coral #FF6475 / gray #8795A8); Space Grotesk, Inter, IBM Plex Mono.
- SOUND: original synth score (120 BPM) with ducked VO, upload blip -> stop -> impact for the hook, four accents on merge/split/compress/OCR, riser + bass hit into MCP, success ping only on the real result, quiet bed under privacy, final resolve + hard cut.
- CHECKS: reel_qa 7/7, look.py G0/G2/G3, measure.py, Scribe + faster-whisper STT, stills per scene.

## Assumptions made
- ElevenLabs v3 requested; channel rule wins (Liam turbo v2.5).
- 'Indian developer' removed: GitHub profile has no location, no source found (F12).
- Scene 6 file name is the real output name merged_compressed.pdf (our run), not merged-compressed.pdf.
- OCR visuals: real OCR run on a synthetic receipt scan (F7); words highlighted where found.
