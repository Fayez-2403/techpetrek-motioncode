# From codebase to short film

56-second Techpetrek promo for GPT-6.2 Astra. The tone is a single respectful, English-led voice with Roman Hinglish captions. The edit uses real traffic at its recorded speed. The viewer sees a concrete script improvement, gets a prompt to try in their codebase, and can comment “story” for the creator’s repo, five reference repos and the skills.

## Editorial sources

- CLAUDE.md and .claude/skills/reel-pipeline/SKILL.md establish the audience, dialogue style, reference checks and preview workflow. The motion-studio skill supplies the brief and shot methodology.
- “Camera neeche lao” appears in projects/astra-nightshift/src/config/voScript.json. Moving it to the shot list is the editorial example used in this version.
- projects/astra-nightshift/post/aakhri-cutting.srt demonstrates measured subtitle timings. analysis/reel_qa.py checks the encoded picture and sound.
- The five references were selected from projects/repo-studio/docs/repos.json. GitHub’s public API verified the creator repo, the five repositories and the two SKILL.md paths. The DM is a draft for the creator to send to commenters.

[Creator repository](https://github.com/Fayez-2403/techpetrek-motioncode) · [Comment reply](../post/story-dm.txt) · [Footage credits](v3-road-credits.md)

## Preview verification

The reviewed encode is 56.000 seconds, 720 × 1280, 30 fps, 1,680 frames, with H.264 picture and stereo AAC. The final program measured −14.0 LUFS. The repository checker found zero flat sampled frames and zero unplanned silence windows. The strobe scan found zero one-frame spikes. The remaining master-size check expects a 1080 × 1920 master; this delivery is the portrait preview.

The nine road shots matched frames from their original recordings at two timestamps in every shot. The lowest luminance correlation between those crops and the encoded plate was 0.9995. The logo crop matched the original artwork throughout all 1,680 encoded frames, with minimum RGB correlation 0.984. The voice CTA was independently transcribed as “Please comment story.” HyperFrames checks passed and the opening, brief, rewrite prompt and ending were inspected in the editable player.
