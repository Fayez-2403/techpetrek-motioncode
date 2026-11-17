# Fact check: AFTERCODE Final: Build Your Cast

Every on-screen and spoken claim traces to a row here (master studio §2).

- **Status:** verified / uncertain / removed.
- **Kinds:**
  - official announcement
  - community demo
  - marketing claim
  - research finding
  - unverified viral claim
  - our illustrative animation
- **Blocked sources:** if a source is blocked (X often is), say so here. Never describe unseen footage.

| # | Claim | Kind | Source URL | Supporting excerpt / location | Status | Approved on-screen / spoken wording |
|---|---|---|---|---|---|---|
| F1 | Every character in the reel is original (no real face or likeness) | our illustrative animation | projects/aftercode/web/src/dance/cast.ts | 14 characters defined by look parameters only; no photo faces in any capture | verified | "Ek bhi real face nahi... sab maine khud banaye!" / "All characters are fictional - made in AFTERCODE" |
| F2 | Each builder change is one click (outfit, colour, hair, facial hair, skin, style, name) | community demo (our own app) | web/src/ui/App.tsx (Chips / Swatches) + public/clips/ui_builder.mp4 | the builder shot shows 7 changes on 7 beats, each a single tap | verified | "Outfit, daadhi, hair... bas ek click!" |
| F3 | A dancer can be named and sent to the stage | community demo (our own app) | App.tsx b-name input; the roster | the name types in, the dancer dances on the stage | verified | "Naam do... aur stage pe bhejo!" |
| F4 | The app is live at aftercode-one.vercel.app | official (our deployment) | https://aftercode-one.vercel.app | deployed 2026-10-31 (dpl_N92wcyjucHrvy7fdMapXcuhkM3fi), smoke test passed live | verified | on-screen URL |
| F5 | Battles, duets and crews are built-in routines | community demo (our own app) | web/src/dance/crew.ts DUO_MODES / CREW_MODES; the CAST presets in the header | Dance battle, Bollywood-inspired duo, Full synchronized routine | verified | round cards |
| F6 | Music: Kevin MacLeod, CC BY 4.0 | official licence | incompetech.com (credits in the app: web/src/audio/library.ts) | Realizer, Smooth Move, Disco Medusae, Electro Cabello, Monkeys Spinning Monkeys | verified | caption credit |
| F8 | You can upload your own photo (or take a selfie) and dance as yourself | community demo (our own app) | web/src/ui/FaceModal.tsx (UPLOAD PHOTO / TAKE SELFIE / USE DEFAULT AVATAR) | the face is mapped onto the dancer's head on this device | verified | v2: "Ya apni photo daalo, aur khud naacho!" |
| F9 | Eight worlds; real music (bundled CC BY tracks + your own songs) | community demo (our own app) | web/src/state.ts WORLDS (8); library.ts + Import your own / Mode soundtracks | 8 entries; MP3/WAV/OGG import | verified | v2: "aath alag worlds, real music!" |
| F10 | The duo and cast setups are one click | community demo (our own app) | the CAST presets in the header (App.tsx PRESETS) | one button each | verified | v2: "Duo mode: filmi jodi, ek click mein!" |
| F7 | The dancing is motion capture (CMU) driven by the song's beat | research dataset | app Credits: CMU Graphics Lab Motion Capture Database | dancers move to the song's measured beat (engine.manual = the song clock) | verified | not claimed on screen |

## Benchmarks (each needs baseline, attribution and an honest scale)
| Metric | Value | Baseline | Who measured | Source | Chart scale note |
|---|---|---|---|---|---|

## Disclaimers needed on screen
For each, note where it goes and why:
- illustrative reconstruction
- not official UI
- prototype
- estimated
- not clinically validated

## Not used (and why)
- ...

## Applied on screen
- "All characters are fictional - made in AFTERCODE": the finale (F segment), small, under the CTA.
- No real people, no party colours on the netas (navy and maroon vests), no real flags or logos.
