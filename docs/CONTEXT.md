# Project context (as of 2026-10-11)

## Latest work: Motion Flex, the Claude cut, 2026-10-13

A full rebuild of Motion Flex by Claude Opus 5.5 (the user called the earlier build GPT's). New variants `flex` (29.1 s reel,
12 bars) and `flex_full` (6-bar process intro + reel, 43.6 s); scenes `scenes/flex.ts`, `scenes/flex_intro.ts`, kit in the Flex
section of `_vo.ts`. Timing: `data/flex/score.json` (bars, eighths) -> `python analysis/build_flex_audio.py` -> `data/flex*/cues.json`
(also builds the SFX mix and engine data). Export: `app/scripts/render_flex.ts` (stills, `--check`, `--sheet`, `--video`, `--wide`
for the 16:9 director's cut). One section per bar, so it deviates from the brief's 3-second marks on purpose (see
`docs/MOTION-FLEX-CLAUDE.md`). Finished files: `out/motion-flex_claude_reel.mp4`, `out/motion-flex_claude_full.mp4`,
`out/motion-flex_claude_16x9.mp4`. DM pack: `docs/MOTION-FLEX-RESOURCES.md`. The earlier `motion`/`possibilities`/`motion_full`
variants are untouched.

## Earlier: Motion Flex, first build, 2026-10-13

The active new task is a music-only motion showcase, superseding the voice-led editing assumptions below for
these variants. `motion` preserves the initial 15-second draft. `possibilities` is the user's new 30-second
“What Can You Build?” storyboard; `motion_full` retains 14.6982 seconds of the first draft and appends it.
The exact supplied Matushka Ultrafunk Short is ultra-slowed and only 15 seconds long. A documented phrase loop
extends it without changing tempo. Scene transitions and UI interactions use measured audio transients.

Read `docs/MOTION-POSSIBILITIES.md` for the exact edit, commands and provenance; `docs/MOTION-RESEARCH.md` for
the researched skills/repos and Movez course. The source is `app/src/scenes/possibilities.ts`. Its native Canvas
export uses the same scene through `canvasFrame`, avoiding unused WebGL post passes; the engine stays untouched.
`bun run dev:motion` now previews this sequence. `colab/render_motion_flex.ipynb` is separate from the original
GitHub-series notebook. The latest attached brief explicitly authorizes the animatic and final renders.

New requirements: no repository names on screen; English text; fictional demos visibly labelled; payoff
“ONE IDEA. ENDLESS POSSIBILITIES.”; final “MOTION FLEX / Powered by Claude Opus 5.5”; comment MOTION CTA.
No new narration or API spending. This session's edits are Codex-authored, so do not describe the complete
production as made exclusively by Claude. No messages or social posts have been sent.

Where this project stands, what was decided and why, and what is left. Read this, then `README.md` and
`CLAUDE.md`, before changing anything.

## What this repo is

A code-driven video engine (pdoom-video, in `app/src/engine/`, MIT, **never edit**) that renders plates
(`app/src/scenes/*.ts`) timed to a voiceover. Shared plate helpers live in `app/src/scenes/_vo.ts`. Every plate is a
pure function of time. Timings come from the voice's word timings (`data/<variant>/lyrics.json`), never hard-coded
seconds.

There are three cuts ("variants"), selected by `VITE_VARIANT` (dev server) or `--variant` (renderer):

| Variant | What it is | Status |
| --- | --- | --- |
| `decision` (default) | **Microsoft-Decision-1 explainer for the Techpe Trek channel**, 9:16, Vox style | Active work |
| `reel` | Jev explainer, 9:16, original ink / graph-paper theme | Done, parked |
| `wide` | Original Jev explainer, 16:9 | Never rendered; user only wants portrait |

## The active video: `decision`

- **Topic and facts:** Microsoft's post "Introducing Microsoft-Decision-1, our model for fast decision-making"
  (Microsoft Command Line, 2026.10.09) plus its chart "Accuracy, latency and calibration, side by side" (screenshots
  the user supplied). Every number on screen is typed exactly as the source gives it: 83.5% accuracy over 36
  benchmarks / 147,137 questions, p50 85 ms vs GPT-6 Sol 3.01 s (35×), 2.5× vs H2O-Lightning-4B v1.1, 1.3% flip
  rate, XBOX Research 10,000+ items / over 14× faster / 200× less expensive, $0.042 per million input tokens and
  free output, Microsoft Foundry and OpenRouter.
- **Look:** Vox template from the `vox-explainer` skill: paper and grain, halftone, torn-edge cards, bold condensed
  type (Archivo at width 62), motion stepped on twos, a torn navy wipe at each cut, the skill's default palette
  (red #B8312A, cream #F1E6D0, paper #FBF7EE, navy #14213D, yellow #F2C230). Text on screen is English only.
- **Brand:** the Techpe Trek logo (`Assets/Brand Logo.jpeg`, copied to `app/public/brand/techpe-trek.jpg`) pops in
  on the first frame on its own dark tile (`vox_logo`). Never redraw the logo.
- **Script:** written by the user in Roman Hinglish with ElevenLabs v3 audio tags (`[curiosity]`, `[excited]`,
  `[bold]`, ...). Stored in `analysis/script_decision.py`, set in Devanagari for pronunciation, English words in
  Latin, numbers spelled out for the voice in `SPOKEN`. One line per shot (13 shots). Trimmed to 1 minute by
  cutting the "20 faislo ... 2 seconds barbaad" and "calibration ... Jev se 1.5 peechhe" lines and their shots.
- **Shots:** listed in the `decision` branch of `app/src/timeline.ts`. Shot modules: `vox_logo`, `vox_kinetic`,
  `vox_cards`, `vox_counter`, `vox_bars`, `vox_shuffle` (plus `vox_grid` and `vox_lollipop`, currently unused).
  Stamps and notes land on spoken words (`stampWord`, `noteWord`, `land`); if a script line changes, check those
  words or indices still exist (also in `cues_decision` in `analysis/sfx_mix.py`).
- **Sound:** score in code (`sfx_mix.py`, `cues_decision` + a low bed), mixed to `audio/decision/mix.mp3`. The dev
  server and the renderer play `mix.mp3` when it exists.
- **Starter removed (2026-10-11):** the Techpe Trek logo shot and its "Techpe Trek par doston, I discovered today
  that" line are gone (the user disliked how "Tech" and the opener sounded); 12 lines / 12 shots, the question opens
  on frame 0. `vox_logo` and the logo file stay available.
- **Pronunciation rules (in `script_decision.py` SPOKEN):** English words go to the voice in English (Devanagari
  respellings of English words sounded wrong); numbers and acronyms spelled out in English; फ़ैसला / फ़ैसले sent as
  फ़ैस्ला / फ़ैस्ले so it says "fais-la". The ElevenLabs voice so far is `TX3LPaxmHKxFdv7VOQHJ` (believed to be the
  American "Liam"); a native Indian Hindi voice from the Voice Library would fix most of the accent. The natural
  take is ~84 s; fitting 60 s needs a x1.44 speed-up, which blurs pronunciation (trim words rather than speed up).
  The user's API key is restricted to speech: it cannot list or look up voices (401).
- **No voiceover (user's choice, 2026-10-11, later reversed for the pronunciation rework):** `mix.mp3` is now effects-only (`sfx_mix.py --no-voice` ->
  `out/mix_decision_fx.wav`: same cues and bed, no ducking, -16 LUFS). The voice is still used for timing (lyrics
  data). The voice + effects mix is kept as `audio/decision/mix_voice.mp3`; copy it over `mix.mp3` to bring the
  voice back. Videos: `out/decision-1Microsoft.mp4` (with voice), `out/decision-1Microsoft_no-voice.mp4` (effects only).

### Open task: the human voice (blocked on the user)

The user wants a voice that sounds human, young, excited and conversational, not like TTS. Chosen route:
**ElevenLabs v3**, one continuous take of the whole script so the tags steer the delivery.

- Code is ready: `make_reel_vo.py --engine elevenlabs --voice <voice id> --max 60` (word timings from ElevenLabs
  character timestamps; speeds up with pitch kept only if the take runs past `--max`).
- **Waiting for the user to set `ELEVENLABS_API_KEY`** as a User environment variable (they must not paste it in
  chat; the script reads the User env var from the registry, so no restart is needed).
- Then: find a young, energetic, conversational Hindi male voice in the ElevenLabs shared library (or use one the
  user names), run the take, then `audio_vo.py`, `sfx_mix.py`, `mix.mp3`, check stills, and render on request.
- Until then the audio is a **temporary** free edge-tts take (hi-IN-MadhurNeural, +45% rate, +8 Hz) of the new
  script, 61.6 s.

## Newest work: the "GitHub Trending" series, 4 reels (variants `gh1`..`gh4`, default `gh1`, 2026-10-12)

From a post listing 10 repos blowing up on GitHub; every claim checked against each repo's description / README,
stars live from the GitHub API on 2026-10-12. Each part is under 60 s at Liam's natural speed (Hinglish voice, English
text on screen), night-trek template with the `gh` theme (GitHub dark, green #3FB950, purple #A371F7, contribution
grid), full-screen windows (`full: true`), no watermark, outro lockup with the logo.

| Variant | Part | Repos | Length |
| --- | --- | --- | --- |
| gh1 | 1/4 Creators | VoiceStudio, ppt-master, diagram-design | 52.7 s |
| gh2 | 2/4 Wild AI apps | gods-eye-view, REA, paperclip | 46.5 s |
| gh3 | 3/4 Claude Code skill packs | mattpocock/skills, ECC | 33.7 s |
| gh4 | 4/4 Rules + memory | andrej-karpathy-skills, claude-mem | 39.5 s |

- Scripts: `analysis/script_gh1..4.py`; shots: the `series` table in `app/src/timeline.ts` (tour stops are page CSS
  px picked from `app/public/gh/boxes.json`); hook module `trek_series.ts`; sound cues `TREK_CUES` in `sfx_mix.py`.
- Real pages: `app/public/gh/*.jpg` (3x captures, cropped to 4000 CSS px max).
- Voices + mixes are done (`audio/gh1..4/voiceover.mp3`, `mix.mp3`); no API keys needed to render.
- Rendered so far: `out/github-trending-part1.mp4` on Windows, but its chip reads "PART 1/3" (rendered before the
  split into 4). The timeline now says "PART 1/4": **re-render gh1**, then gh2, gh3, gh4.
- Render each sharp, one by one: `bash app/scripts/render_reel.sh <variant> ../out/github-trending-partN.mp4`
  (15 s segments with retries, single worker, joined + mixed), or `bun scripts/render.ts video --variant <v> --scale 2
  --workers 1 --fps 30 --samples 1 --preset medium --crf 18 --out ...`.
- Google Colab option: `colab/render_on_colab.ipynb` + `motion-as-code-colab.zip` (free Colab is not faster than a
  laptop: 2 vCPUs; check WebGL is hardware-accelerated first).

## Earlier reel: `repos` (five agent repos, 2026-10-11)

Five GitHub repos of ready-made AI agents and skills (from @undefinedKi's X post and its "400+" poster,
`Assets/HUSBRebWQAACn4j.jpg`): agency-agents, wshobson/agents, anthropics/knowledge-work-plugins,
anthropics/claude-quickstarts, addyosmani/agent-skills. Numbers checked on 2026-10-11 against each README and the
GitHub API (live stars 159K / 40K / 29K / 18K / 105K; agency-agents says "230+ Specialized Agents"; wshobson 94
plugins, 202 agents, 184 skills, 105 commands; knowledge-work-plugins 11 plugins; agent-skills 25 skills).

- **Look ("night trek", deliberately unlike the earlier reels):** near-black ground, Techpe Trek lime #C8F31D and
  purple #8E44FF, extra-wide heavy Archivo, smooth camera moves. Shot modules `trek_hook`, `trek_repo`, `trek_outro`;
  helpers (`TrekPlate`, `browser`, `camAt` pose ladder, `cursor`, `starBadge`, `streaks`) in `_vo.ts`.
- **Real pages:** `app/public/repos/*.jpg` are real GitHub captures (dark, 2x, 1280 CSS px wide, 3600 tall) with
  `boxes.json` (page boxes of the name, file list, README and the words the voice names). Re-capture with the
  scratch script pattern in this chat (playwright, `fullPage: true`) if the repos change.
- **Logo:** bottom-right watermark on every shot (black drops out with `lighten`); large in the outro lockup.
- **Voice:** English, ElevenLabs Liam, natural pace (66 s at first take). User is editing the script
  (`analysis/script_repos.py`); re-run `make_reel_vo.py --engine elevenlabs --voice TX3LPaxmHKxFdv7VOQHJ`, then
  `audio_vo.py`, `sfx_mix.py` (`cues_repos` + `pulse` bed; new sounds click / riser / boom), `mix.mp3`.

## How to run

```powershell
# ffmpeg is installed but this shell may not see it; add it per session:
$env:Path += ";C:\Users\ce\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-9.0.2-full_build\bin"

cd app; bunx vite                       # preview at http://localhost:54173 (decision); press space
# $env:VITE_VARIANT='reel'; bunx vite   # the Jev reel instead

# voice + data for the decision cut (from the repo root)
$env:VARIANT='decision'; python analysis/make_reel_vo.py --engine elevenlabs --voice <id> --max 60
# (free fallback) $env:VARIANT='decision'; python analysis/make_reel_vo.py --voice hi-IN-MadhurNeural --rate +45% --pitch +8Hz
$env:VARIANT='decision'; python analysis/audio_vo.py
$env:VARIANT='decision'; python analysis/sfx_mix.py
ffmpeg -y -i out/mix_decision.wav -ac 2 -b:a 192k audio/decision/mix.mp3

# check stills (cropped to the 9:16 column)
cd app; bun scripts/render.ts stills --variant decision --t 5,20,40 --out ../out/wip_decision

# final render (ask the user first): sharp, 1080x1920; --samples 1 suits the stepped Vox motion
cd app; bun scripts/render.ts video --variant decision --scale 2 --fps 30 --samples 1 --preset medium --crf 18 --out ../out/techpe-trek_decision-1.mp4
```

Last finished render: `out/techpe-trek_decision-1.mp4` (64.4 s, the earlier 15-shot script with the young
edge-tts male voice; passed the reel-export upload checks). It is out of date once the ElevenLabs voice lands.

## How the 9:16 cuts work

The engine canvas is fixed at 1920×1080 (can't edit the engine). Portrait plates draw in a centred 608×1080 column
(`COL` in `_vo.ts`); `render.ts --variant` crops it (and scales videos to 1080×1920); the dev page shows only the
column (`#reelbox` in `index.html`, set up in `main.ts`). `--scale 2` renders the column at 1216×2160 and scales
down, which is what keeps text sharp. All words stay inside the Reels safe zone (reel-export skill: y 360..1420 and
out of the right 120 px of 1080×1920; `VOX_BOX` / `SAFE` in `_vo.ts`).

## User preferences (learned the hard way)

- Portrait Instagram reels only. Preview on localhost:54173; **ask before any video render** (a sharp render takes
  about 2 to 3 hours on this machine).
- Facts exact and traceable; the user approves the script. Do not add on-screen text in Hindi or Hinglish.
- Wants a human, young, excited male voice; was unhappy with robotic TTS.
- Use the skills: `vox-explainer` (look, script shape, score, editor's frame check), `reel-export` (safe zone,
  upload checks), `hyperframes-creative` narration rules (write for the ear, value by line 2, numbers as spoken).
  `brand-intake` was not run: there is no brand.md / MOTION.md yet; offering to re-colour the template to the
  Techpe Trek palette (black, lime, purple) is still open.
- Skills are installed for every project in `C:\Users\ce\.claude\skills\` (13 motion-graphics + 21 HyperFrames);
  the originals are in `skills/`.

## Gotchas

- **Sharp (`--scale 2`) renders: use `--workers 1`.** With 2 workers the render's WebSocket dropped (code 1006,
  both workers at once) again and again on 2026-10-12; one worker finished cleanly. For long reels, render ~15 s
  segments with `--noaudio --from a --to b`, join with `ffmpeg -f concat -c copy`, then mux `audio/<variant>/mix.mp3`.
- Another Claude Code session was open on this repo at the same time (it edited `render.ts`); close extra sessions
  before long renders.
- `repos` reel: no bottom-right watermark (`noWatermark`), taller window (520 px); final `out/5-ai-agent-repos_v3.mp4`.

- `app/node_modules` went missing once; `cd app; bun install` restores it.
- Port 54173 is `strictPort`: an old dev server holding it makes a new one fail. The user restarts their own server.
- `render.ts` never reuses a running dev server unless `--url` is given (a running server may serve another variant).
- edge-tts only: pass the rate as `--rate +50%` or `--rate=+50%`; it has no "excited" style, and its multilingual
  male voices read Hindi with a foreign accent (samples in `out/voice_samples/`).
- On Windows, read JSON with `encoding="utf-8"` (Devanagari breaks cp1252).
- Stills taken just after a line ends land in the next shot's wipe; sample at `line end - 0.05`.

## Backups in `out/`

`backup_decision_swara/` (female voice), `backup_decision_madhur_deep/`, `backup_decision_madhur_young/` (earlier
decision voices, 14/15-line scripts), `backup_swara/` (Jev reel voice). The Jev reel's Hindi voice is parked as
`audio/reel/voiceover_hindi.mp3` (the reel plays a silent track). `out/wip_*` folders are review stills, safe to
delete.
