# Brief: AFTERCODE Final: Build Your Cast

Created 2026-10-31 from the motion-studio reel template.
- **The contract:** `docs/TECHPETREK_MASTER_REEL_STUDIO.md` (repo root).
- **The block brief method:** `.claude/skills/motion-studio/guide/brief.md`.

**How to fill it:**
- Fill every field.
- `AUTO`: the agent decides and writes down what it chose.
- `MISSING`: an honest placeholder. It blocks only the scene or export that needs it.

## NEW REEL BRIEF
```yaml
project_title: "AFTERCODE Final: Build Your Cast"
subject_and_angle: "The user's own app AFTERCODE (aftercode-one.vercel.app): its improved 3D character builder makes a whole cast of ORIGINAL characters who battle, duet and dance on the beat"
primary_source_urls: ["https://aftercode-one.vercel.app", "projects/aftercode/web (the app's source)"]
secondary_reference_urls: []
mode: PRODUCT_DEMO
idea: "Battle-show format (MC + round cards) as a product demo: every round is a builder preset, captured live from the app"
runtime_seconds: 46.19          # measured: 6 song segments, whole bars (src/config/plan.json)
runtime_max_seconds: 60
format: "9:16"
resolution: "1080x1920"
fps: 60
language: "Hinglish"
voiceover: "ElevenLabs Liam eleven_turbo_v2_5 hi, seed 5, speed 1.15: 10 MC lines, every line checked with Scribe + faster-whisper"
soundtrack: "Bundled CC BY 4.0 songs from the app (Kevin MacLeod): Realizer, Smooth Move, Disco Medusae, Electro Cabello, Monkeys Spinning Monkeys; one per round, switched on measured downbeats"
hook: "Frame 0: split-screen CEO face-off, VS badge slammed, DISS BATTLE title, the top CEO already rapping; MC: 'CEO versus CEO!'"
core_reveal: "Not one real face: every character was built in AFTERCODE's builder, one click per change"
scene_count: 9                  # hook, morph, builder, R1 CEO, R2 leaders, R3 neta, filmi duo, sitcom squad, finale
featured_source_videos: []
visual_style: "AFTERCODE's own world: night ink, cyan, pink, lime; the app's 3D worlds; Archivo condensed slams"
actor_reference_images: []
mascot_or_character_reference_images: ["assets/cast/*.jpg (the 14 original characters, rendered from the app)"]
logo_file: "AFTERCODE wordmark set in Inter (the app's own logo is type)"
preferred_cta: "Comment CAST (auto-DM the link) + aftercode-one.vercel.app on screen"
post_caption: true
cover_image: true
budget: "FREE-FIRST (one small ElevenLabs take)"
licensing_requirements: "Own captures + CC BY music credited + generated VO; NO real people's faces or likeness (user's choice 2026-10-31; the real photos in projects/aftercode/assets stay unused)"
critical_constraints: ["original characters only", "no invented quotes for real people", "music credit in caption", "ask before the full render"]
```

## Logline
A battle MC calls five rounds (CEOs, leaders, netas, a filmi duo, a sitcom squad); the twist: every one of them was built in AFTERCODE in a few clicks, and you can build your own.

## Block brief (motion-studio)
- FILM: a battle show as a product demo, 46.2 s, music-led with an MC.
- BRAND: HERO = the characters; APP = AFTERCODE (Face Dance Studio + character builder); RESULT = a cast that dances on the beat; SET = the app's 8 worlds.
- FACTS: docs/factcheck.md (F1-F7).
- FORMAT + RENDERER: 9:16 60 fps; 3D captured frame-exact from the app (web/src/reel/final.ts, seek(r) pure), the builder UI captured in the phone layout at 2x; edit + type in Remotion (src/compositions/Final.tsx).
- TIMELINE: src/config/plan.json, measured by the app: A realizer 9 bars (hook, morph, builder, round 1), B smooth-move 3, C disco-medusae 3, D electro-cabello 3, E monkeys 4, F realizer 2.
- BEATS: hook = the face-off (belief: this is a battle); morph = 4 looks on 4 beats (belief: it is one builder); builder = 7 clicks on 7 beats (belief: it is easy); rounds = variety; finale = the whole cast + CTA.
- LOOP: no.
- CAMERA: battle close-ups face-front (the mocap's turn cancelled), two-shots at 4-4.5 m in portrait, squad on a 54 deg lens, finale pyramid crane.
- LOOK: night ink + cyan / pink / lime, Archivo 900 condensed slams, Inter captions.
- SOUND: one song per round on measured downbeats, slam + whoosh on every switch, pops on the morph beats, taps on the builder clicks, MC ducks the music 6 dB; -14 LUFS.
- CHECKS: reel_qa.py, look.py G0/G2/G3, measure.py, Scribe + whisper on every line.

## Assumptions made (when the user gave only a topic or URL)
- The user chose original characters over real faces (AskUserQuestion, 2026-10-31); Aishwarya Rai and Salman Khan hold Delhi High Court orders (Sept and Dec 2025) against AI use of their likeness.
- "diss" is not spoken (the TTS says "dis" = "this"); the DISS BATTLE cards carry it.
