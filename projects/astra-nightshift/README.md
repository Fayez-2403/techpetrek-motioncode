# GPT-6.2 Astra · From codebase to short film

A 56-second, English-led Hinglish promo for Techpetrek. It demonstrates one script revision from the existing project, then asks viewers to comment “story” for the repo bundle. All full-screen traffic is recorded footage played at source speed. The editorial graphics, voiceover and music were created for this cut.

[Preview MP4](out/astra-workflow-preview/astra-workflow-preview.mp4) · [Review frames](out/astra-workflow-preview/contact-sheet.jpg) · [Post caption](post/astra-workflow-caption.txt) · [DM reply](post/story-dm.txt) · [Subtitles](post/astra-workflow.srt)

## Edit

Open this directory in HyperFrames to view the separate traffic, transparent graphics and audio tracks. The preview is 720 × 1280 at 30 fps.

- Change the spoken script in `src/config/astra-workflow.json`. `python scripts/cutting_dialogue.py --astra-workflow` rebuilds the recorded narration and subtitle timings, reusing cached takes. New takes require the project's ElevenLabs credentials.
- Run `python scripts/v3_mix.py` to mix dialogue and original music.
- Edit `scripts/v3_middle.py` for the brief, source example, prompt, timing and five-repo panels. Edit `scripts/v3_bookends.py` for the Astra title and the “story” CTA. `scripts/v3_render.py` places subtitles and the persistent brand mark.
- Run `npm run preview` to encode the graphics and composite the review MP4. To use an existing graphics render, run `python scripts/v3_render.py preview`. Footage sources and credits are in [the road edit notes](docs/v3-road-credits.md).

[Production notes](docs/astra-workflow.md) · [Aakhri Cutting version](out/cutting-preview/aakhri-cutting-preview.mp4) · [Original Nightshift version](out/preview/nightshift-preview.mp4)
