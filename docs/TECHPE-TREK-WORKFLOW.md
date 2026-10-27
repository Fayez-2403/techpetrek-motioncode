# Techpe Trek reel workflow — context for Claude

Drop this file into a new project as `CLAUDE.md` (or reference it from one). It describes what this user makes
again and again, how they like it done, and what has gone wrong before. Read it before starting any task.

## Who and what

- The user runs **Techpe Trek**, an Instagram channel about AI and tech news, tools and repos, for a
  Hinglish-speaking Indian audience. Logo: a hiker with a laptop, purple sun, lime mountain, black background
  (lime ~#C8F31D, purple ~#8E44FF).
- The deliverable is almost always a **9:16 Instagram Reel (1080×1920)**, 45–90 s, built entirely in code
  (no stock footage, no video generator), plus a ready-to-paste Instagram post.
- Source material is usually a link: an announcement page, an X/Twitter post, a GitHub repo list, plus
  screenshots the user drops in an `Assets/` folder.

## The loop, every time

1. **Read the source fully.** Fetch the page or post; open every linked repo or doc. The user's screenshots in
   `Assets/` are part of the brief.
2. **Check every fact before it goes on screen.** Numbers, names and dates come from the primary source (the
   README, the GitHub API, the official post), typed exactly. If the post and the source disagree, use the
   source and tell the user (e.g. a post said "~170 agents", the README said "230+"). Star counts are live and
   dated.
3. **Write the script** in Hinglish, as an ad, not a lecture: hook in the first line, one line per shot, one
   concrete detail per item, a call to action at the end ("Save karo, share karo, Techpe Trek follow karo").
   The user often writes or edits the script themselves, with ElevenLabs v3 audio tags like `[excited]`,
   `[curiosity]`, `[bold]`. Use their words exactly when they give them.
4. **Record the voice** (see Voice below), then time everything to the voice's word timings.
5. **Build the visuals** in a look that is different from their previous reels (they ask for this).
6. **Check with stills** (one frame from every shot: cut-off text, overlaps, wrong numbers, safe zone) and fix
   before rendering. Show the user the preview on localhost, not a render, while iterating.
7. **Render only when asked**, then run the upload check and look at frames from the finished file.
8. **Hand over the Instagram post:** caption (Hinglish, hook in the first ~125 characters, emoji bullets, facts
   with numbers, CTA, source credit), hashtags (~15, focused), audio name, alt text, a pinned first comment with
   any links (links are not clickable in captions), cover frame suggestion, posting tips. Put copyable text in
   code blocks.

## Preferences learned the hard way

- **Voice matters most.** They want it to sound human, young and excited, never robotic. ElevenLabs v3 (one
  continuous take of the whole script, tags steer delivery) is the default; free edge-tts sounds synthetic.
  An American voice reading Hindi has an accent; a native Indian Hindi voice from the ElevenLabs Voice Library
  is better if they provide its Voice ID.
- **Pronunciation rules** for the voice text (never shown on screen): Hindi in Devanagari, English words in
  English (Devanagari respellings of English words sounded wrong), numbers spelled out in English, repo names as
  spoken words, "Techpe" as "Tech-peh". Force awkward Hindi words with a halant (फ़ैसला → फ़ैस्ला) so they are not
  stretched.
- **Don't speed the voice up to fit a length** (a ×1.4 speed-up blurred words). Trim the script instead.
- **On-screen text is English.** No Hindi/Hinglish text on screen, no burned-in subtitles unless asked.
- **Pace:** give each item room (12–19 s per repo/feature), hold each camera stop long enough to read, and add
  a second on-screen callout per item.
- **Show the real thing:** real screenshots of the real web page or repo (captured in dark mode at 3×), toured
  by a camera (punch in, pan, pull out, whip to the next). Real counts on badges.
- **Sharpness:** they notice blur. Capture sources at 3×, draw with high-quality smoothing, and render the final
  at 2× (sharp). The fast 1× export looks soft on zooms.
- **Logo:** use their file as-is on its own dark tile, never redraw it. They have asked for it both as a
  bottom-right watermark and removed; ask if unsure. The closing "FOLLOW TECHPE TREK" lockup keeps it.
- **Safe zone:** all words between y 360 and y 1420 of 1080×1920 and out of the right 120 px.
- **Ask before long renders** (a sharp render takes 1.5–3 h on this machine) and before anything that spends
  their API credits in bulk. Change direction quickly when they do; they iterate a lot.
- **Keep earlier versions** (`_v1`, `_v2`…) instead of overwriting, and back up voice files before re-recording.

## Tools on this machine

- **Engine:** the `motion-as-code` repo (pdoom-video engine, Vite + Canvas2D/WebGL, deterministic, every frame a
  function of time). Never edit `app/src/engine/`; shared helpers go in `app/src/scenes/_vo.ts`. Each reel is a
  variant (`VITE_VARIANT` / `--variant`): its voice in `audio/<variant>/`, timings in `data/<variant>/`, shots in a
  branch of `app/src/timeline.ts`. Ready templates: night-trek (`trek_*`, dark, real pages + camera), Vox
  editorial (`vox_*`, paper, stats), plotter/graph paper (`reel_*`).
- **Preview:** `cd app; bunx vite` → http://localhost:54173 (default variant set in `vite.config.ts`).
- **Voice:** `$env:VARIANT='<name>'; python analysis/make_reel_vo.py --engine elevenlabs --voice <id>` (script in
  `analysis/script_<name>.py`), then `analysis/audio_vo.py`, `analysis/sfx_mix.py` (sound cues + bed),
  `ffmpeg -i out/mix_<name>.wav -ac 2 -b:a 192k audio/<name>/mix.mp3`.
- **Stills:** `cd app; bun scripts/render.ts stills --variant <name> --t 1,5,9 --out ../out/wip_<name>`.
- **Render:** fast `--fps 30 --samples 1 --preset veryfast --crf 20` (~25–30 min); sharp
  `--scale 2 --workers 1 --samples 1 --preset medium --crf 18` (1.5–3 h; with 2 workers it crashed). For long
  reels render ~15 s segments with `--noaudio --from a --to b`, join with ffmpeg concat, mux the mix.
- **Keys:** `ELEVENLABS_API_KEY` is a User environment variable (the key can generate speech but cannot list
  voices). The current ElevenLabs voice is "Liam" `TX3LPaxmHKxFdv7VOQHJ`. Never ask for keys in chat.
- **ffmpeg** (winget Gyan.FFmpeg) may need adding to PATH per shell. `bun`, Python 3.12, edge-tts, Chrome via
  playwright-core are installed.
- **Skills** in `C:\Users\ce\.claude\skills\`: vox-explainer, reel-export, motion-effects, hyperframes-creative
  (narration rules), hyperframes-keyframes (camera moves) and more. Use them and say which ones shaped the work.

## Gotchas

- `app/node_modules` has gone missing more than once: `cd app; bun install`.
- Old render dev servers can linger and serve the wrong variant; `render.ts` now checks the port and kills its
  server tree, but check for stray `vite --port 5xxx --strictPort` processes if a render shows the wrong reel.
- Close other Claude Code sessions on the same repo during long renders.
- Port 54173 is strict: restart the user's dev server after config changes.
- Read JSON with `encoding="utf-8"` (Devanagari breaks cp1252 on Windows).
