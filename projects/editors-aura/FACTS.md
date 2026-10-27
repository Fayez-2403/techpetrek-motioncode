# Facts on screen (The Editor's Aura)

Every claim the reel makes, with its source. Demo values inside the fictional product UI and the fictional pit stop are
marked as fictional on screen.

| On screen | Claim | Source / status |
|---|---|---|
| Hook | "6 RENDERS. ALL CODE." / "BUILT IN VS CODE WITH CLAUDE OPUS 5.5" | True. The six renders are code in `app/src/scenes/aura/r1..r6`, built in this session. The user's IDE shows Claude Code with Opus 5.5 (user_9/user_11) |
| IDE | "OPUS 5.5", "EFFORT · EXTRA HIGH" | The user's screenshots: the model picker (user_11) and the chip "Opus 5.5 Extra high" (user_9) |
| BUILD CHECK | Beat grid "95.002 BPM · fit 31.2 ms (95%)" | `data/aura/song_map.json` (aura_songmap.py) |
| | Frame-exact seek(t) | The pdoom engine: each frame is a function of t (CLAUDE.md rule; SeqCache + the prepare barrier for footage) |
| | Spring motion system | `spring()` / `springTo()` in `app/src/scenes/_vo.ts` |
| | Canvas UI choreography | Layer2D. HyperFrames is **not** claimed (not installed) |
| | Three.js / WebGL 2, "three 0.186" | `app/package.json` (^0.186.0) |
| | FFmpeg render · H.264 · yuv420p · bt709 | `app/scripts/render.ts` encode settings |
| | Synthesized SFX | `analysis/aura_mix.py` (no samples) |
| | Frame QA | `analysis/reel_qa.py`, stills, contact sheets |
| Stages | "36 bars · 70 events on the eighth grid" | `analysis/aura_cues.py` output: 70 Dubplate events, 0 off the grid (plus 16 measured intro events) |
| | "stills · 20.3 → 27.7 s", "contact sheet · 0 events off the grid", "1080×1920 · 60 fps" | Render 01's still checks; the cue check; the master's spec (the master is not rendered yet) |
| Terminal | The commands and their output lines | Copied from real runs this session (render.ts stills, aura_cues.py, aura_songmap.py) |
| Fix scene | "ARTIFACT · R04 v1 · chrome reflects black" | A real frame of Render 04 from before its environment fix (out/wip_aura/r4/f_0055.40.png) |
| | "R04 v2 · CONTACT SHEET", "FRAMES CHECKED · 8/8" | The real stills of Render 04 after the fix (app/public/aura/thumbs/sheet_*.jpg) |
| R02 | "Lumen", KPIs (1,284 renders, 76,800 frames, 99.7% on-beat), "Beat alignment · last 30 renders" | **Fictional product UI**, labelled "LUMEN · fictional product" |
| R03 | The uniform readouts u_kick / u_bass / u_vocal / u_hat / u_rms | The real values from data/aura/audio.json at that frame |
| R04 | "LOCK n/8" | The mark has 8 pieces, each locking on an eighth |
| R05 | "terrain 90,601 verts", "lava 2,600 particles" | 301 × 301 vertices; 2,600 GPU particles in r5_volcano.ts |
| R06 | "STOP 1.98 s", "SLOW ×3.2", "PIT STOP · RENDERED, NOT FILMED" | **Fictional** (a CG stop, labelled "CG · fictional team"). The stop is shown at 6.32 reel-seconds for 1.98 event-seconds (×3.2) |
| Editor | "BPM 95.00", "GRID 1/8 · 0.316 s", "TARGET −14 LUFS" | song_map.json; the mix measures −14.0 LUFS (aura_mix.py) |
| | "LOCKED · 0 OFF THE GRID", "FOLEY · 121 CUES" | The cue check; the cue sheet |
| End card | "BUILT WITH CLAUDE OPUS 5.5 · TECHPE TREK" | The user's choice. "with", not "×": no partnership is implied |
| Labels | "BACKSHOT · AI PLACEHOLDER" | The backshot is the user's AI clip (Gemini/Veo mark visible) |

## V4 (renders only, 2026-10-22)
| On screen | Claim | Source / status |
|---|---|---|
| Hook | "9 RENDERS. / ALL CODE. / BUILT WITH CLAUDE OPUS 5.5" | True. Nine renders in code: `app/src/scenes/aura/r1..r9`. R08 (ink) and R09 (bounce) were built 2026-10-22 for V4 |
| Tags | "R02 · PRODUCT UI · FICTIONAL", "R06 · PIT STOP · CG" | V4 hides the renders' own HUD labels, so the tags carry "fictional" / "CG" instead |
| R02 | "Every frame, on the beat.", "Beat alignment · last 30 renders" | **Fictional product copy** (Lumen) |
| R06 | "1.98 s", "PIT STOP · RENDERED, NOT FILMED" | **Fictional** CG stop (as V1) |
| Captions | LIKE A NUCLEAR BOMB · TALK TO THE BOYS / GIRLS / WOMAN / MAN · talk to the → COMPUTER TONGUE · TOUGHER THAN A LION · SOUND TEST · GOING UNDER · NUMBER ONE | Dubplate's words as heard in the V4 edit. Whisper transcription (`data/aura/song_map.json`), snapped to vocal onsets. No published lyric found to check against. "talk to the → computer" spans V4's join |
| Outro | "I DON'T JUST EDIT VIDEOS. / I BUILD THEM.", "BUILT WITH CLAUDE OPUS 5.5 · TECHPE TREK" | As V2 |
