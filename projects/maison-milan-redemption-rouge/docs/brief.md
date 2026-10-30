# Brief: Redemption Rouge: Maison Milan

Created 2026-10-29 from the motion-studio reel template.
- **The contract:** `docs/TECHPETREK_MASTER_REEL_STUDIO.md` (repo root).
- **The block brief method:** `.claude/skills/motion-studio/guide/brief.md`.

## NEW REEL BRIEF
```yaml
project_title: "Redemption Rouge: Maison Milan"
subject_and_angle: "A luxury product film for Maison Milan's Redemption Rouge Eau de Parfum: racing energy (the reseller's reel pitches it as motorsport-inspired) that turns into roses, and the bottle itself is the scent pyramid."
primary_source_urls:
  - https://maisonmilan.co/product/maison-milan-redemption-rouge-edp-100-ml-perfume/   # name, notes, copy lines, 4 product photos
secondary_reference_urls:
  - https://www.instagram.com/p/DLPYamJhNnG/        # @royalorchidperfumes reel, 5.2 s, 360x640: style reference only
  - https://www.amazon.in/s?me=A36L6SNLA0N7RQ        # Maison Milan seller store: Redemption Rouge NOT listed (checked 29 Oct 2026)
mode: PRODUCT_DEMO     # a product film: the product performs (light, speed, roses), facts from the listing and the box
idea: "Hero product film (ideas.md: product hero) + 'the object is the diagram' (the bottle carries the note pyramid)"
runtime_seconds: 24
runtime_max_seconds: 30
format: "9:16"
resolution: "1080x1920"
fps: 60
language: "English on-screen, no voice"     # user's choice 29 Oct: luxury brand film, music-only
voiceover: "NONE (user choice)"
soundtrack: "ORIGINAL"                       # synthesized in scripts/audio/score_film.py
hook: "0.0 s: red light trails rush past the bottle on a wet night track; first close pass lights the glass at 0.25 s"
core_reveal: "Redemption Rouge: top, heart and base notes, shown on the bottle itself"
scene_count: 4
featured_source_videos: []
visual_style: "Rouge-black night, red glass, label gold; Cinzel + Cormorant Garamond italic; one accent (rouge light)"
actor_reference_images: []
mascot_or_character_reference_images: []
logo_file: "public/img/wordmark.png (keyed from the official banner, maisonmilan.co)"
preferred_cta: "maisonmilan.co (website only, user's choice)"
post_caption: true
cover_image: true
budget: "FREE-FIRST (no paid generation)"
licensing_requirements: "Official Maison Milan product photos used to promote that product; confirm brand permission before paid ads"
critical_constraints:
  - "No price on screen (user's choice)"
  - "No F1 name, logo or car (trademark; brand is not an official partner): generic motorsport light only"
  - "No volume and no gender on screen: website says 100 ml / Unisex, the box says 90 ML / for women"
  - "Maison Milan branding only, no Tech Pe Trek logo (user's choice)"
```

## Logline
A red bottle stands on a wet night track while light trails scream past; it brakes, the world goes silent, and on the hit the track turns into roses. The camera then reads the scent down the bottle, from the stopper (top notes) to the label (heart) to the foot (base), and the film ends on the name.

## Block brief (motion-studio)
- **FILM:** a 24 s luxury perfume film, music-only, 4 scenes on a 120 BPM grid.
- **BRAND:**
  - HERO: the Redemption Rouge decanter (red glass, black sphere stopper, black/gold label), from the official photos.
  - APP: none.
  - RESULT: the notes and the name.
  - SET: night track, then a rose room.
- **FACTS:** see factcheck.md F1-F9. The notes come verbatim from the box and the site. The two copy lines come verbatim from the product page.
- **FORMAT + RENDERER:** 1080x1920 at 60 fps in Remotion. The bottle cut-outs come from the photos (`scripts/assets/cutout.py`). The light trails are SVG, the petals are 3D-transformed SVG, and every frame is a pure function of t.
- **TIMELINE:** `SCENE_TIMINGS.json` holds the scenes and the events. The picture (`src/scenes/Film.tsx`) and the score (`scripts/audio/score_film.py`) both read it.
- **BEATS:**

  | Beat | Time | What happens | Buys |
  |---|---|---|---|
  | race | 0-4 s | front, trails, "Freed from the old world." | bold, not old-fashioned |
  | race | 4-7.5 s | whip to a side tracking shot, 3 gear shifts | speed, energy |
  | race | 7.5-8.0 s | brake, then a dead stop | anticipation |
  | notes | 8.0 s | hit: petal burst | a rose heart under the speed |
  | notes | 8.25-15 s | top / heart / base down the bottle | the notes, remembered by position |
  | box | 15-20 s | box + "A fragrance that does not compromise with your dreams." | the full product, the brand voice |
  | finale | 20-24 s | last trail lights the bottle; name, Eau de Parfum, wordmark, url | where to get it |

- **LOOP:** none. It ends on a designed stillness with petals moving.
- **CAMERA:**
  - a push-in during the front shot;
  - a whip pan to the side shot;
  - a tilt down the bottle in the notes scene;
  - a slide-in and slow push for the box;
  - an arrival from oversize for the finale.
- **LOOK:** ground #070205, rouge light #B5121B / #FF3B2F, gold #D9B26A, ivory #F4ECE4; grain 7 %, vignette.
- **SOUND:** engine rev through the shifts, a doppler whoosh per pass, the stop 7.83-8.0 s, the hit, one bell per note word, a resolve on D minor at 22.0 s.
- **CHECKS:** stills, then a 540x960 motion check, then `look.py`, `measure.py` and `reel_qa.py`.

## Assumptions made
- "Inspired by F1" is the reseller's framing, so we use only a generic racing light language.
- "Incense Cherry" is kept as one item exactly as both the site and the box write it (no comma).
- "Bergamont" and "Toka Bean" on the site are typos; the box spells them Bergamot and Tonka Bean.
