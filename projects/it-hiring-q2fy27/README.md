# IT hiring Q2 FY27 reel — "Wipro minus… baaki IT giants plus?!"

A 60 s, 9:16, 60 fps Hinglish reel for TechpeTrek, built in Remotion 4. The node_modules folder is a junction to ../railway-ai-security/SOURCE.

- **Facts:** FACTS.md.
- **Story (editable):** SOURCE/src/data/voScript.json. Each line has a caption, the TTS text and its scene. A copy of the story is in output/story.json.
- **Sound cue sheet:** SOURCE/src/audio/cues.json.
- **Scenes:** SOURCE/src/lite/Data.tsx (hook, total, q1, bars, wipro, twist) and SOURCE/src/lite/Payoff.tsx (freshers, gross, build, verify, cta).
- **Shared tokens and motion:** SOURCE/src/lite/kit.tsx (palette, safe zones, spring pop, shake, chips) and SOURCE/src/lib/anim.ts (pure seek(t) easing and springs).
- **Word cues:** every cue is a spoken word (SOURCE/src/lib/words.ts), so a new voice take re-times the whole film.

## Rebuild (run in SOURCE/)

    python audio-src/vo.py reel --seed 5 --stt      # Liam take, cut per line, speech-to-text check
    python audio-src/timing.py                      # SCENE_TIMINGS.json (124 BPM grid, padded to 60.00 s) + vo_reel.wav
    python audio-src/score.py reel                  # original score + dhol + sfx + mix, -14 LUFS
    npx remotion bundle src/index.ts --out-dir out/bundle
    node scripts/stills.mjs out/bundle out/wip/x 0,600,1500 LiteReel
    node scripts/render.mjs                         # one-command export -> ../output/it_hiring_q2fy27_reel_1080x1920_60fps.mp4
