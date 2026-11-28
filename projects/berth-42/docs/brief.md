# Brief: Berth 42: Ek Seat, Do Ticket

Created 2026-11-27 from the motion-studio reel template.
- **The contract:** `docs/TECHPETREK_MASTER_REEL_STUDIO.md` (repo root).
- **The block brief method:** `.claude/skills/motion-studio/guide/brief.md`.

**How to fill it:**
- Fill every field.
- `AUTO`: the agent decides and writes down what it chose.
- `MISSING`: an honest placeholder. It blocks only the scene or export that needs it.

## NEW REEL BRIEF
```yaml
project_title: "Berth 42: Ek Seat, Do Ticket"
subject_and_angle: "System design as a fable: a ticket booking system (Tatkal) selling the last berth. Race condition -> per-seat lock -> lock with TTL"
primary_source_urls: ["https://redis.io/docs/latest/commands/set/", "https://www.businesstoday.in/amp/india/story/no-new-tatkal-rules-from-april-15-irctc-clears-air-on-social-media-misinformation-471844-2025-04-13"]
secondary_reference_urls: ["https://x.com/treyscalez/status/2126041304421323256"]   # style prompt (KT in docs/KT_ink_cel_style.md)
mode: MASCOT_FILM            # NEWS_LAUNCH | SOURCE_COMPILATION | MASCOT_FILM | EDITOR_AURA | PRODUCT_DEMO | EXPLAINER
idea: AUTO            # one of the 20 in .claude/skills/motion-studio/guide/ideas.md (or two combined)
runtime_seconds: 70
runtime_max_seconds: 100
format: "9:16"
resolution: "1080x1920"
fps: 60
language: "Hinglish"  # Devanagari TTS, Roman captions
voiceover: "WRITE_AND_GENERATE_IF_AUTHORIZED"   # ElevenLabs Liam, eleven_turbo_v2_5 hi (channel default)
soundtrack: "ORIGINAL"                           # synthesized score; a user song only with its file + permitted use
hook: "Raat ke do baje. Chalti train. Berth 42 pe do aadmi, aur dono ke haath mein ek hi ticket."
core_reveal: "Seat ussi ki jiska taala pehle laga, aur sirf tab tak jab tak ret-ghadi chale (lock + TTL)."
scene_count: AUTO
featured_source_videos: []
visual_style: "Hand-inked 1930s cartoon cel drawn fully in code (ink polygons, flat 5-colour palette, two-tone light, old-cartoon finish); no image generators"
actor_reference_images: []
mascot_or_character_reference_images: []
logo_file: "public/brand/techpe-trek.jpg"
preferred_cta: "Comment SEAT -> ticket booking design DM"
post_caption: true
cover_image: true
budget: "FREE-FIRST"
licensing_requirements: "Only owned/authorized/appropriately licensed media; track permissions in docs/asset_manifest.csv"
critical_constraints: ["original invented cast, no real person", "never claim IRCTC/BookMyShow internals", "60 fps master, poses on twos", "Roman captions #ffe21a"]
```

## Logline
Two strangers hold the same ticket for berth 42; we rewind to a 10 AM booking office where two clerks share one register, watch the fix (a padlock) become the next bug (a stuck lock), and end on the sand timer that explains every payment countdown. Full treatment: docs/story.md.

## Block brief (motion-studio)
Write each block here (see guide/brief.md):
FILM / BRAND (HERO, APP, RESULT, SET) / FACTS / FORMAT + RENDERER / TIMELINE / BEATS / LOOP / CAMERA / LOOK / SOUND / CHECKS

## Assumptions made (when the user gave only a topic or URL)
- ...
