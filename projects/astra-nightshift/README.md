# Mumbai After Rain

GPT-6.2 Astra authored the Three.js city, vehicles, driving simulation and replay camera for this 56-second Techpetrek reel. The route is a fictional monsoon-night circuit inspired by Mumbai. You can drive through the same scenes shown in the reel.

[Watch the preview](out/mumbai-drive-preview/mumbai-drive-preview.mp4) · [Open the playable game](mumbai-game/play-mumbai.html) · [Review frames](out/mumbai-drive-preview/contact-sheet.jpg) · [Post caption](post/caption.txt) · [DM reply](post/mumbai-drive-dm.txt) · [Subtitles](post/mumbai-drive.srt)

[Claude handoff for the next voiceover and gameplay pass](docs/mumbai-claude-handoff.md)

Open the game in a browser with WebGL 2. Choose a paint colour and start driving. W or Up accelerates, S or Down brakes, and A/D or the arrow keys steer. Touch controls appear on phones. “Watch the drive” plays the narrated replay.

The source lives in [mumbai-game/src](mumbai-game/src). Building the game requires Node, Bun and the three npm package. From the game directory, run `npm ci`, then `npm run build`. The result is a self-contained HTML file with embedded audio and logo. On this workstation, `npm test` checks replay and controls. From the project directory, use `npm run preview` to record the 720 × 1280 review MP4. [Production credits](docs/mumbai-drive.md)

## Previous edit · From codebase to short film

A 56-second, English-led Hinglish promo for Techpetrek. It demonstrates one script revision from the existing project, then asks viewers to comment “story” for the repo bundle. All full-screen traffic is recorded footage played at source speed. The editorial graphics, voiceover and music were created for this cut.

[Preview MP4](out/astra-workflow-preview/astra-workflow-preview.mp4) · [Review frames](out/astra-workflow-preview/contact-sheet.jpg) · [Post caption](post/astra-workflow-caption.txt) · [DM reply](post/story-dm.txt) · [Subtitles](post/astra-workflow.srt)

### Edit the previous version

The archived composition has separate traffic, transparent graphics and audio tracks. Its preview is 720 × 1280 at 30 fps.

- Change the spoken script in `src/config/astra-workflow.json`. `python scripts/cutting_dialogue.py --astra-workflow` rebuilds the recorded narration and subtitle timings, reusing cached takes. New takes require the project's ElevenLabs credentials.
- Run `python scripts/v3_mix.py` to mix dialogue and original music.
- Edit `scripts/v3_middle.py` for the brief, source example, prompt, timing and five-repo panels. Edit `scripts/v3_bookends.py` for the Astra title and the “story” CTA. `scripts/v3_render.py` places subtitles and the persistent brand mark.
- Run `npm run preview:v3` to encode the graphics and composite the previous version. Its HyperFrames entry point is archived in [the V3 composition](docs/astra-workflow-v3.html.txt). Footage sources and credits are in [the road edit notes](docs/v3-road-credits.md).

[Production notes](docs/astra-workflow.md) · [Aakhri Cutting version](out/cutting-preview/aakhri-cutting-preview.mp4) · [Original Nightshift version](out/preview/nightshift-preview.mp4)
