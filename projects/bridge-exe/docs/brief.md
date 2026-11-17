# Brief: BRIDGE.EXE — Can your design survive?

Created 2026-11-02 from the motion-studio reel template, from the user's master prompt "BRIDGE.EXE — Ancient structures,
modern intelligence" and their note: "I want to make a reel to show the advancements in Civil Engineering".
- **The contract:** `docs/TECHPETREK_MASTER_REEL_STUDIO.md` (repo root).
- **The block brief method:** `.claude/skills/motion-studio/guide/brief.md`.

## NEW REEL BRIEF
```yaml
project_title: "BRIDGE.EXE — Can your design survive?"
subject_and_angle: "A playable 3D bridge lab we built with Claude Code: drag a truss, load it, and a tested solver (cross-checked against PyNite) computes the deflections, member forces and reactions shown in the 3D world. AI + civil engineering, honestly labelled."
primary_source_urls:
  - https://pynite.readthedocs.io/en/latest/
  - https://openseespydoc.readthedocs.io/en/latest/src/truss.html
  - https://help.autodesk.com/view/ADSKMCP/ENU/
  - https://help.autodesk.com/cloudhelp/ENU/ADSKMCP-RevitMcp/files/ADSKMCP_RevitMcp_revit_mcp_server_html.html
  - https://github.com/IfcOpenShell/IfcOpenShell
secondary_reference_urls: []
mode: PRODUCT_DEMO      # our own app, captured from its ?reel=1 mode (real runs, scripted input)
idea: "Interactive lab + its own reel (as ASTRA.EXE / SERVER SIEGE)"
runtime_seconds: 70
runtime_max_seconds: 75
format: "9:16"
resolution: "1080x1920"
fps: 60
language: "Hinglish"
voiceover: "ElevenLabs Liam, eleven_turbo_v2_5, hi, speed 1.12 (hook 1.18), seeds 5 / 7 (v06)"
soundtrack: "ORIGINAL"   # scripts/audio/mix_bridge.py, 120 BPM A minor, synthesized
hook: "Frame 0: the 56 m truss already sagging (×40) in red/cyan force colours, 'AI × BRIDGE ENGINEERING?!' crashing in; VO 'Bhai, AI se bridge model banwaya… phir uspar LOAD TEST chala diya!'"
core_reveal: "The colours and the sag are real solver output (run R001, 127.0 mm, cross-checked with PyNite), and the collapse is clearly a game effect."
scene_count: 10
featured_source_videos: []
visual_style: "Premium dark CAD studio over an original golden-hour gorge; cyan / amber / red / emerald engineering palette"
actor_reference_images: []
mascot_or_character_reference_images: []
logo_file: "public/brand/techpe-trek.jpg"
preferred_cta: "COMMENT CIVIL (tools, repo links, safe setup checklist: docs/SHARE_WITH_COMMENT_CIVIL.md)"
post_caption: true
cover_image: true
budget: "FREE-FIRST (ElevenLabs VO only)"
licensing_requirements: "Everything original or open source (MIT/BSD/LGPL/OFL); no stock, no songs, no vendor logos"
critical_constraints:
  - "Educational software, not a licensed engineer / code check / construction approval"
  - "Never fabricate solver output; every number on screen is read from a run object"
  - "Arcade collapse labelled STYLIZED FAILURE — NOT AN ENGINEERING PREDICTION throughout"
  - "No Autodesk MCP claims: none is installed here"
```

## Logline
A viewer watches a bridge being dragged into shape, loaded with a truck and solved for real, compares two designs, sees the
files the pipeline writes, enjoys a clearly fictional collapse, and is told that real decisions belong to qualified engineers.

## Block brief (motion-studio)
- **FILM:** a product demo of our own app, 70 s, ten sections on the 120 BPM grid (SCENE_TIMINGS.json).
- **BRAND:** HERO = the truss (its colours are its data). APP = BRIDGE.EXE (web/). RESULT = run R001 (127.0 mm, L/441, 1908 kN). SET = an original gorge.
- **FACTS:** docs/factcheck.md; every number comes from `solveTruss` runs R001 / R002 at capture time.
- **FORMAT + RENDERER:** R3F app (web/) captured frame-exactly (`seek(t)`), Remotion overlay (src/compositions/Bridge.tsx).
- **TIMELINE:** SCENE_TIMINGS.json, written by scripts/audio/timing_bridge.py from the measured VO takes.
- **BEATS:** hook / reveal / geometry / load+RUN / lenses / A vs B / CAD+report / arcade / evidence / CTA (docs/shotlist.md).
- **LOOP:** none (ends on the CTA, end hold < 1.4 s).
- **CAMERA:** keyed shots, hard cuts on motion, one crane (reveal), one follow (arcade); quintic in-outs.
- **LOOK:** golden hour, ACES, restrained bloom; the lens colours are the only saturated colours on the bridge.
- **SOUND:** original score; a magnetic click per span step / drag snap; music drops out for the RUN; Rapier events drive the arcade foley.
- **CHECKS:** reel_qa.py, look.py G0/G2/G3, measure.py, Scribe + faster-whisper on every line.

## Assumptions made
- "AI se bridge model banwaya" = Claude Code (Opus 5.5) wrote this app, its parametric generator and its solver; the reel shows it as a lab, not as an AI that designed a certified bridge.
- Line 6 names the change actually shown (truss height 6 → 8 m) instead of "member ya section".
- The user's on-screen lines (DRAG • DESIGN • MODIFY, …) are kept as specified, small, never as slogans over the proof.
