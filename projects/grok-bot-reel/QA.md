# Grok Bot reel: QA report (checkpoint I), 2026-10-19

## Deliverables (output/)
| File | What |
|---|---|
| grok-bot-reel_master.mp4 | Final master: 1080x1920, 60 fps, 3,480 frames, 58.000 s, H.264 CRF 18 + AAC 192k (78 MB) |
| grok-bot-reel_social.mp4 | Compact social version: CRF 23, bt709, faststart, AAC 160k (27 MB) |
| grok-bot-reel_cover.png / _cover_alt.png | Cover frames (1.6 s hook; 55.6 s hero) |
| grok-bot-reel_contact_sheet.png | Frames at 0, 0.5, 1.5, 6, 12, 18, 24, 30, 36, 42, 48, 54, 57.5 s, taken from the master |
| grokbot_animatic.mp4 | Checkpoint F animatic (30 fps, lower resolution, earlier framing) |

## Automated checks (analysis/grokbot_qa.py -> QA-auto.json): 14/14 pass
- Exactly 3,480 frames at 60 fps; 1080x1920 H.264; AAC audio present.
- No unplanned silences; the 42.00-42.25 s pattern interrupt is silent; loudness -14.1 LUFS.
- Chapter cuts on the 120 BPM bar/beat grid; all 82 story events and 67 foley cues on the 0.25 s grid.
- Captions come from the voice's own word timestamps (143 words); each VO line starts inside its chapter.
- Brand spelled GROK BOT / Grok Bot; no xAI / X logo artwork; the fact sheet cites x.ai's launch post.

## Speech check (ElevenLabs speech-to-text on the final mix)
"Bro, six AI bots, one entire team, and they don't just chat, they work … This is Grok Bot. Comment bot for the build."
Matches the script word for word. The first word was first misheard ("I built") under the frame-0 hit; fixed by clearing
the speech band of that hit.

## Visual review (stills and contact sheets, chapter by chapter)
- Fixed during review: foreground bots blocking close-ups (foreground culling for non-acting bots and desk screens); the
  routine and apps chapters restaged for a 9:16 frame; a 2x-scale bug that rendered the 3D black in the first final
  (stopped and re-rendered).
- Each of the six bots keeps the same rig, proportions, colours and props in every shot (one builder, _grokbots.ts).
- Comprehension without sound: big type carries the story ("6 AI BOTS / 1 TEAM", "REAL WORK", role tags, "PARALLEL",
  "SAVED AS A ROUTINE", "REAL APPS / SHARED COMPUTER / + CONTEXT", "APPROVAL NEEDED / YOU STAY IN CONTROL", "SHIPPED",
  "COMMENT BOT").

## Honest limits
- I can't watch video. The brief's playback reviews (normal speed, 0.5x, no audio) were done as frame sampling, not
  viewing. Please watch it at 0.5x yourself before posting.
- The robots are stylised procedural rigs (pose functions plus walk and typing cycles), not hand-keyed Pixar animation.
  The acting reads, but it is simpler than the brief's reference bar.
- Not used: Higgsfield generation (no workspace set; no credits spent) and Phantom (needs a CUDA GPU and model weights).
  Everything was rendered in code.
- Not reviewed: the two X posts in the brief. Nothing in the reel copies them.
- No official logos: x.ai blocks automated downloads, so the reel uses the name in its own type. To add logos, put the
  official files in brand-assets/ and say so.
- The hook line runs to 2.30 s, past the 2.0 s chapter cut (it can't be said in 2 s); the visual cut stays at 2.0 s.
- Labelled on screen as illustrative: the six-bot crew, all UI, the sample data ("+38% saves*") and the approval demo.

## Before posting
Check x.ai/bot by hand for any change since 2026-10-19 (availability, wording), then re-read FACTS.md.

## v2 (2026-10-19, user feedback): Hinglish, white office, cute crew, quieter music
- Narration rewritten in Hinglish (Devanagari for the voice, Roman Hinglish captions, no Hindi script on screen). Liam on
  eleven_v3 with language hi, seed 7. Speech-to-text heard every word; "Bro" was clipped by pause-shortening and fixed.
- Music bed down about 4.4 dB, ducking up to about -9 dB under speech; mix still -14 LUFS.
- Bright white office (windows, plants, white desks, light UI, white server pillar); neon cyan removed; cute redesign of
  all six bots on the same rig; floor halos under the acting bot; no handheld drift.
- Automated QA on the v2 master: 14/14 pass (3,480 frames, -14.1 LUFS, 174 caption words, every cue on the grid).
- v1 (English, dark studio) kept as output/*_v1-english-dark.*
