# Session resume: DOTS, The Great To-Do List Heist (96 s short)

Brief: pasted by the user on 2026-10-19 (10 scenes, the five official Dots mascots, 120 BPM heist score, narrator +
mascot dialogue). The user's additions: use every useful skill, and **everything in Hinglish**.

Decisions made without asking (the brief settled them, or the rules did; raise any change with the user):
- **Music:** an original synthesized score. The brief's references (Makeba, Uptown Funk) need licences.
- **Narrator:** Liam on eleven_turbo_v2_5 with language hi. That is the user's Indian-accent pick from gh3/gh4. Turbo ignores [tags].
- **Mascots:** premade ElevenLabs voices on eleven_v3 with [tags], pitch-lifted.
  - Pink: Sarah, +2 st
  - Blue: Charlie, +3 st, seed 3
  - Yellow: Daniel, +1 st
  - Green: Laura, +3 st
  - Purple: Eric, 0 st
- **Labelling:** marked FAN-MADE · UNOFFICIAL on every frame, because the mascot designs are OpenAI's. No logos; app names are set in our own type.

## Where things are
| Piece | File |
|---|---|
| Facts + sources | FACTS.md (openai.com 403: corroborated from launch coverage; check by hand before posting) |
| Script: 34 lines (narrator + 5 mascots), Devanagari spoken / Roman display | analysis/script_dots.py |
| Voices: one take per speaker, cut by timestamps + silence-snapped boundaries | analysis/dots_vo.py, takes in audio/dots/takes (v1/, P_*, G_*, B3, B11 = auditions) |
| Score: 48 bars, 120 BPM, 5 stereo stems, silence 53-54 s | analysis/dots_music.py -> audio/dots/stems, data/dots/music.json |
| Storyboard as data: events from word times on the 0.25 s grid + foley sheet | analysis/dots_cues.py -> data/dots/cues.json |
| Mix: carve under voices (-9 dB speech band / -3 dB broad), -14 LUFS | analysis/dots_mix.py -> audio/dots/mix.mp3, data/dots/audio.json |
| Characters + monster (bible as code) | app/src/scenes/_dots.ts |
| The short (10 scenes, camera keys, sets, overlay) | app/src/scenes/dots.ts; variants `dots`, `dots_sheet` (timeline.ts, vite.config.ts) |

## Commands
```
python analysis/dots_vo.py --reuse            # re-cut the voices from saved takes (no credits)
python analysis/dots_cues.py && python analysis/dots_music.py && python analysis/dots_mix.py
cd app && bun scripts/render.ts stills --variant dots --t 0.3,11.6,93.6 --out ../out/wip/x
bash <scratchpad>/render_win30.sh dots ../projects/dots-heist/output/dots_animatic.mp4 1 24     # animatic
bash <scratchpad>/render_win60.sh dots ../projects/dots-heist/output/dots_master.mp4 2 10       # final (ask first)
python analysis/reel_qa.py projects/dots-heist/output/dots_master.mp4 --variant dots --frames 5760 --max-dur 100 --allow-silence 53.0-54.0
```

## Checkpoints
Stage 1 facts ✓ · 2 hook ✓ · 3 script + voices ✓ (STT word-for-word) · 4 storyboard ✓ · 5 score + mix ✓ ·
6 build + stills ✓ (out/wip/dots_a..d) · 7 animatic ✓ · final ✓ 2026-10-20: output/dots_master.mp4 (60 fps, QA 9/9),
dots_social.mp4, dots_cover.png / _alt.png. User changes on 2026-10-20:
- Cold-open heist hook: line 0 is its own take "H", seed 5.
- BY OPENAI badge in our own type (the real logo is used if app/public/brand/openai-logo.png exists).
- Music 0.62 -> 0.48.
Earlier versions kept: *_v1-oldhook.mp4, audio/dots/*_v1-prehook*, takes_backup_prehook.
