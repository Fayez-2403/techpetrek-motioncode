# Mumbai After Rain — creative and technical handoff for Claude

Techpetrek’s 56-second reel promotes GPT-6.2 Astra by showing something it built. A viewer can watch the silver Monsoon GT pass a Hindi cinema poster on a wet Mumbai street, then open the game and drive through that same spot. Start by watching the cut with sound and taking one turn in the game. [Current reel](../out/mumbai-drive-preview/mumbai-drive-preview.mp4) · [Playable build](../mumbai-game/play-mumbai.html) · [Twelve review frames](../out/mumbai-drive-preview/contact-sheet.jpg)

## v2 pass (2026-11-23): new voice + sharp preview

- **Voice:**
  - Liam (`TX3LPaxmHKxFdv7VOQHJ`) on `eleven_turbo_v2_5`, speed 1.2, stability 0.4, seed 5: the channel's young, energetic read. Amogh is now the fallback.
  - The settings live in `src/config/mumbai-drive.json` → `"tts"`; `cutting_dialogue.py` reads them, and the other cuts keep their old defaults.
  - The key is read from the saved Windows variable first.
- **Script:** punchier, English-led Hinglish to "aap", each line on its shot.
  - "Yeh Mumbai street? GPT-6.2 Astra ne banayi hai." / "Aur haan, yeh game hai. Steering aapke haath mein!"
  - "Dekhiye, 'Aakhri Local'! …har ek akshar." now starts at 11.6 s, on the poster.
  - "Kaali-peeli taxi, rickshaw, laal bus…" plays over the traffic and bonnet shots. "Bonnet camera on…" / "Ab asli maza: … Astra ko boliye…"
  - The offer, then the requested close, word for word.
  - Every line fits its window at tempo 1.0 (the poster line at 1.006). Scribe heard every word.
- **Sharp preview:** the game caps live rendering at 1440 px, so a 1080-wide capture was really 810×1440. `capture.mjs` now calls `driveCapture.resize(width, height)` for stills and recording, which gives a true 1080×1920. Record with `node mumbai-game/scripts/capture.mjs record 1080 30`.
- **The v2 preview:** `out/mumbai-drive-preview/mumbai-drive-preview_v2_1080_liam.mp4` (1080×1920, 30 fps, 56 s, −14.6 LUFS, reel_qa 8/8, Scribe clean, 0 strobe frames). It was saved under its own name because `mumbai-drive-preview.mp4` was open, so Windows blocked the rename.
- **v1 kept:**
  - `out/mumbai-drive-preview/mumbai-drive-preview_v1_720_amogh.mp4`
  - `src/config/mumbai-drive_v1_amogh.json`
  - `post/mumbai-drive_v1_amogh.srt`

## The creator’s brief

- Keep the picture inside the original Three.js world. Astra authored the city, signs, vehicles, driving simulation and replay cameras. The route is a fictional Mumbai circuit. The edit adds Techpetrek’s supplied logo, an ElevenLabs voice and a synthesized soundtrack.
- The reference supplied the idea of vehicle selection followed by a night drive. Mumbai supplies the identity through kaali-peeli taxis, rickshaws, a red bus, cinema lettering, market stalls and wet asphalt. Believable vehicle movement matters more to the creator than an extra plot beat. [Meng To reference](https://x.com/MengTo/status/2124015852592988367)
- Use conversational, English-led Hinglish. Address the viewer as **aap**. Let the viewer hear the car between lines. Keep the small Techpetrek logo at bottom right throughout.
- The offer is the creator’s repo, **five additional reference repos**, and skills to try with GPT-6.2 Astra in the viewer’s own codebase. The requested close is **“Aapko bhi aisi short story banani hai aur zyada views chahiye? Please comment ‘story’.”** The DM is a prepared text reply. [Post caption](../post/caption.txt) · [DM copy and links](../post/mumbai-drive-dm.txt)
- Keep the cut over 50 and under 60 seconds. The current 56-second timeline already fits. The creator chose to stop at a 720 × 1280 review preview.

## What the audience sees and hears

| Picture time | What is on screen | What to listen for in the next cut |
| --- | --- | --- |
| 0–4 s | Front three-quarter tracking shot of the coupe. *Mumbai After Rain* appears. | The current opening names GPT-6.2 Astra, Mumbai, playability and Three.js in one breath. Give the hook one job. |
| 4–8.5 s | The camera moves around the coupe in the garage. The playable menu offers three paint colours. | This is where “you can drive it yourself” makes sense. Leave a moment for the car reveal. |
| 8.5–20 s | Rear chase, then a close look at the **आख़िरी लोकल** poster from 11.7–15.1 s, then back to traffic. | The current line lists signs, shops and balconies. Name the poster while the viewer can actually read it. |
| 20–29 s | Bonnet view through the railway viaduct and towards the market. | The existing “watch the wheels” line continues into a shot that hides the player’s wheels. Move the line to a visible turn or talk about the approaching traffic here. |
| 29–44 s | Low side tracking through the market, then a higher chase camera from 40 s. | The current voice invites the viewer to change the wet-road lighting. A brief same-frame lighting comparison could demonstrate what editing the code does. |
| 44–56 s | The repo offer begins. The “Comment ‘story’” graphic appears at 47.3 s. The camera starts pulling back at 49 s. | The spoken CTA runs from 49.15 to 53.84 s. Preserve the final two seconds of reading time and make “story” easy to hear over the score. |

## First pass on the voice

Try a creator talking to one viewer. A possible first take is **“This Mumbai street? GPT-6.2 Astra built it.”** Let the garage answer the next question with **“And yes, you can drive it yourself.”** At the cinema, try **“Dekhiye, ‘Aakhri Local’. Even the lettering is drawn in code.”** These are audition lines. Record them against the actual shots and choose the delivery that sounds natural on a phone.

The voice source is [mumbai-drive.json](../src/config/mumbai-drive.json). Each beat has spoken text in `tts`, Roman-script caption phrases in `groups`, and a speech start time in `at`. The generator uses the next beat’s `start` as its timing boundary. Where spoken and printed words split differently, `counts` maps spoken tokens to each caption word. The existing hook handles “GPT-6.2” this way.

The generator caches timestamped ElevenLabs takes. Its cache key includes the voice settings and adjacent lines, so one rewrite can also regenerate neighbouring takes. New takes use the environment variable `ELEVENLABS_API_KEY`. The script prints a tempo factor for each line it fits to picture. Audition the dry opening and closing offer first. If a line sounds hurried, shorten it or give it more time. Then check pronunciation of “GPT-6.2 Astra,” “repo,” and “story” against the final mix. [Dialogue generator](../scripts/cutting_dialogue.py) · [Current timed transcript](../post/mumbai-drive.srt)

## Where to improve the functionality

| Area | Editable source | A concrete next improvement |
| --- | --- | --- |
| Controls and cameras | [game.js](../mumbai-game/src/game.js), [main.js](../mumbai-game/src/main.js), [game-shell.html](../mumbai-game/game-shell.html) | Live driving uses a chase camera. The replay already has a bonnet view. A keyboard and touch camera toggle would let viewers try the same perspective themselves. |
| Traffic and wheels | [route.js](../mumbai-game/src/route.js), [vehicles.js](../mumbai-game/src/vehicles.js), [game.js](../mumbai-game/src/game.js) | Review one bend from the side at quarter speed. Check wheel contact, front-wheel angle and taxi spacing. `film(t)` choreographs traffic by time, while `playStep(dt, keys)` advances interactive traffic. Check the bend in both modes. |
| City and screen graphics | [city.js](../mumbai-game/src/city.js), [hud.js](../mumbai-game/src/hud.js) | Street signs and poster art live in the 3D scene. Captions, minimap, speed, CTA and logo are drawn over it. Check legibility at phone size. |
| Audio | [v3_mix.py](../scripts/v3_mix.py), [engine-audio.js](../mumbai-game/src/engine-audio.js) | The Python mixer makes the reel soundtrack and lowers it under speech. The browser synthesizes the live engine separately. For a clearer CTA, adjust the reel mix and listen on a phone speaker. |

## Rebuild the right version

Use the full `motion-as-code` checkout for voice work. The shareable game ZIP includes the finished mix and the game source. The take generator and mixer live in the full checkout. The open IDE tab, `play-mumbai.html`, is a generated offline bundle. Make changes in the sources above so the next build carries them forward.

Run these commands from the repository root in PowerShell. The Mumbai flag selects this cut in both shared Python scripts. The final capture command replaces the current preview, so keep a copy for a listening comparison if needed.

```powershell
Set-Location projects/astra-nightshift
python scripts/cutting_dialogue.py --mumbai-drive
python scripts/v3_mix.py --mumbai-drive
npm --prefix mumbai-game run build
npm --prefix mumbai-game test
node mumbai-game/scripts/capture.mjs stills 720
node mumbai-game/scripts/capture.mjs record 720 30
python ../../analysis/reel_qa.py out/mumbai-drive-preview/mumbai-drive-preview.mp4 --frames 1680 --max-dur 59.9
```

The dialogue step writes the dry voice to `audio/out/mumbai-drive/dialogue.wav` and regenerates both `mumbai-game/src/captions.json` and `post/mumbai-drive.srt`. The mix lands at `public/audio/mumbai-drive.m4a`. The build embeds it in the playable HTML, and the recorder pairs it with the captured game frames. This keeps the narrated replay and MP4 in sync.

The baseline is 56 seconds, 1,680 frames at 30 fps, −14.0 LUFS and a verified bottom-right logo in every frame. The QA tool expects 1080 × 1920 for its master-resolution check. The approved 720 × 1280 preview passed the other seven checks. For the next review, compare the opening four seconds, the poster cutaway, one vehicle turn and the last spoken “story.” [Baseline QA](../out/mumbai-drive-preview/mumbai-drive-preview_qa.json)
