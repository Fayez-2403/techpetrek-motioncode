# LiteLLM 1.107.0 reel — "Maan lo… aapki website AI ne chura li"

A 60 s, 9:16, 60 fps Hinglish reel for TechpeTrek. Remotion 4 (its node_modules are a junction to ../railway-ai-security/SOURCE).

- Facts: FACTS.md. Script and voice settings: SOURCE/src/data/voScript.json. Sound cues: SOURCE/src/audio/cues.json.
- Scenes: SOURCE/src/lite/ (kit, Hook, Story, Payoff, LiteReel). Every visual cue is a spoken word (src/lib/words.ts), so a new take re-times everything automatically.

Pipeline (run in SOURCE/):

    python audio-src/vo.py reel --seed 5 --stt     # Liam take (ELEVENLABS_API_KEY), cut per line, speech-to-text check
    python audio-src/timing.py                     # SCENE_TIMINGS.json + public/audio/vo_reel.wav
    python audio-src/score.py reel                 # music + sfx + mix -> public/audio/mix_reel.wav (-14 LUFS)
    node scripts/stills.mjs out/bundle out/wip/x 0,300,900 LiteReel   # after: npx remotion bundle src/index.ts --out-dir out/bundle
    node scripts/render.mjs                        # resumable chunked render -> ../output/litellm_startup_hook_reel_1080x1920_60fps.mp4
    python ../../../analysis/reel_qa.py ../output/litellm_startup_hook_reel_1080x1920_60fps.mp4 --frames 3600

Outputs are in output/: the MP4, the SRT, voice.wav, POST_KIT.md, music_license.txt, qc_report.md and cover.png.
