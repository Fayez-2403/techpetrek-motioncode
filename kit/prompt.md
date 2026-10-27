# The Motion Flex prompt

Use this prompt to make a beat-synced motion reel entirely in code with Claude Opus 5.5. It's the method behind the MOTION FLEX
reel by Techpe Trek: no After Effects, no timeline, every frame written as code, every cut on the beat.

**How to use it**

1. Do the one-paste setup in the PDF (*claude-opus 5.5 200IQ implementation.pdf*) once.
2. Put your song file in an empty folder. Use the exact edit you will post with.
3. Fill in the `[BRACKETS]` below. Delete any you don't need.
4. Open Claude Code in that folder, choose Claude Opus 5.5, and paste everything under the line.
5. Review the stills it shows you and give notes like you would to a designer. Approve the final render.

---

## ROLE

You are a motion design director, creative coder and music-video editor. Build a 9:16 motion reel entirely in code. It has
to look like a top motion studio's showreel, not an AI slideshow. Work in this folder, explain each step in a sentence before
you do it, and show me stills before any long render.

## THE BRIEF

- **Song:** [Matushka Ultrafunk (ultra slowed), https://www.youtube.com/shorts/wm8wIdmbVRo, file: ./song.m4a]. Swap in your
  own song; use the exact file and speed you will post with.
- **Length:** [12 bars of the song, about 29 s at this tempo]. Choose a whole number of the song's phrases, so the reel loops seamlessly.
- **Hook question on screen:** ["WHAT CAN YOU BUILD?"]
- **The creations to show, one per bar:** [websites · apps · dashboards · a product film · motion graphics · an animated story ·
  a 3D world · sound you can see]
- **Payoff copy:** ["ONE IDEA." · "ENDLESS POSSIBILITIES."]
- **Final lockup:** ["MOTION FLEX" / "Powered by Claude Opus 5.5"]
- **Call to action:** [Comment "MOTION" / I'll DM you every skill + repo behind this reel.]
- **Brand:** [near-black #121410, bone #efeee4, electric accent #d8fa79, one content colour #ff6a3d; Archivo for display,
  IBM Plex Mono for code]. If I give no brand, use near-black, warm white and one electric accent.
- **Formats:** 1080×1920, 60 fps, H.264 (primary). [Also a 1920×1080 cut if practical.]
- **Voice:** [none; music only]. Never claim audio that was not generated.

## STEP 1: MEASURE THE SONG (before any visuals)

1. Decode the exact file. Find the kick attacks: the steepest rise of the 35–160 Hz envelope, at about 3 ms resolution.
2. Fit the eighth-note pulse to those attacks with robust least squares. Drop hits more than 15 ms off the line; that's swing.
   Report the eighth, beat, bar and BPM, and the residuals.
3. Bars are 8 eighths. Find each breakdown (where the bass drops out) and each drop (where it returns). Don't trust a BPM
   from the internet. If the song has two tempo readings (half or double time), tell me which you chose and why.
4. If the song must be longer than the clip, repeat whole phrases on bar lines with 4 ms equal-power splices. Never
   time-stretch or pitch-shift.
5. Save the measurements, the source hash and the method in a manifest.

## STEP 2: WRITE THE SCORE IN MUSICAL UNITS

- Write a `score.json`. Each section starts on a bar line, and each event is `[bar, eighth]`, optionally snapped to a measured
  onset within 70 ms.
- Use one section per bar. The first breakdown and drop go to the biggest reveal; the last breakdown is the quiet "one idea"
  moment; the last drop is the explosion before the title.
- A script resolves the score into seconds (`cues.json`). Every visual and every sound effect reads only that file.
- Moves that must land on a hit start early and finish on it. Reactive accents fire 0–45 ms after the hit. Hard cuts and
  colour flips take 0 ms.

## STEP 3: BUILD IT DETERMINISTIC

- Every frame is a pure function of time: `drawFrame(ctx, t)`. No `Math.random`, `Date.now` or real-time loops; seed any
  randomness. Expose `seek(t)` so any frame renders on its own.
- Draw vector frames straight at 1080×1920 (Canvas2D or WebGL). Blend 4 sub-frames across a 180° shutter for motion blur.
- Encode H.264 High, yuv420p, BT.709 limited range with full colour tags, AAC 48 kHz, faststart. Mix at −14 LUFS with a true
  peak of −1 dBTP or lower.
- Start from a deterministic engine:
  - [pdoom-video](https://github.com/mexicat/pdoom-video) (what this reel used)
  - [HyperFrames](https://github.com/heygen-com/hyperframes) (HTML)
  - [Remotion](https://github.com/remotion-dev/remotion) (React)

## STEP 4: THE MOTION RULES

1. **One continuous journey.** Each creation physically becomes the next:
   - the hook object unfolds into the type, and the type stack becomes a browser;
   - the browser narrows into a phone while its content reflows;
   - the app's result card opens into a dashboard, and the card's bars become the chart's bars;
   - a chart bar rises into a product, which shatters into modules;
   - the modules build a character, whose world folds into a 3D city;
   - the city contracts into a record, which collapses into the hook object;
   - that object explodes into every scene, and the scenes fill the letters of the title.

   Never crossfade two copies of a thing. Move one object and change what it is mid-move.
2. **Every section gets its own composition, colour field and type treatment.** Use masks, split-flaps, vertical type,
   elastic width, 3D billboards and audio-reactive letters. Never repeat "title on top, card in the middle".
3. **Use real springs.** Damping ratio 0.8–1.0 (about 1% overshoot); no default bounce or elastic easing.
4. **Draw lines, don't fade them in.** Counters count up, then lock on the kick. Hits stack on one frame: flash, 2 inverted
   frames, shake, ring.
5. **Audio drives behaviour, not decoration.** Draw the song's real waveform and the bar's measured bass. No EQ bars, no
   pulsing orbs, no generic particles or gradients.
6. **One camera move per phrase,** never per beat. Hold one quiet moment before each drop.
7. **Make it real.** Show actual animated demos (navigation, cursor clicks, typing in an input, loading, done). Label invented
   brands and data as fictional.
8. **Show the process.** Add a small code line at the bottom of every scene: that scene's real code, the clock and the eighth
   notes of the bar.
9. **Safe zone.** Every word sits between y 360 and 1420 and clear of the right 120 px of the 1080×1920 frame. Headlines are
   90 px or more, labels 24 px or more.
10. **Engagement.** The premise is readable on frame 0. There's a payoff every bar. The CTA is big and holds at least 2 s.
    The last 0.25 s collapse back into frame 0, so the reel loops.

## STEP 5: QUALITY CONTROL (before you say it's done)

1. Show me a shot list with exact times, then stills at key frames.
2. Make a contact sheet every 0.5 s and a strip at 0.05 s spacing around every cut. Look for dead air, text collisions,
   pops at hand-offs and anything that looks generic. Fix the three worst problems, then re-check.
3. Determinism: render a set of times forwards and in reverse; the frames must match byte for byte.
4. Render a low-res animatic first, then ask me before the full 60 fps render.
5. Check the export: resolution, frame count, duration, colour tags, loudness, and the audio-to-cue offset (it should be 0 ms).
   Pull frames from the encoded MP4 and look at them.

## STEP 6: DELIVER

- The reel MP4 (and the 16:9 cut if asked), a cover frame, the shot list, and short notes on any deviation from this brief.
- Also give me: a caption with the CTA, a pinned comment, and the credit line for the music.

## HONESTY RULES

- Say "made in code with Claude Opus 5.5". Don't claim "100% AI": a human chose the song and the direction.
- Credit the engine, fonts and music. Demos of invented brands are labelled fictional. Every number on screen is either true
  or labelled sample data.
- Songs are copyrighted. Tell me to add the track from Instagram's music library at the edit's start, rather than relying on
  the file's own audio.

## RESOURCES (read before building)

- **Skills:**
  - [motion-graphics-skills](https://github.com/charlie947/motion-graphics-skills): open `effects.md` (16 UI morphs and type recipes) and `reel-export`.
  - [HyperFrames](https://github.com/heygen-com/hyperframes): `music-to-video`, `hyperframes-animation`, and on GitHub the internal `cut-the-curve` and `motion-doctrine`.
  - [Remotion skills](https://github.com/remotion-dev/skills)
  - [Emil Kowalski's skills](https://github.com/emilkowalski/skills): `apple-design`, `animate`.
- **Engines:**
  - [pdoom-video](https://github.com/mexicat/pdoom-video): `docs/ENGINE.md`, `docs/TREATMENT.md`.
  - [three.js](https://github.com/mrdoob/three.js)
  - [Remotion](https://github.com/remotion-dev/remotion)
- **Character acting:** [ClaudeAnimationBase](https://github.com/JohnHeibel/ClaudeAnimationBase): `ANIMATION_GUIDE.md`.
- **Taste and checks:**
  - [anthropics/skills](https://github.com/anthropics/skills): `frontend-design`, for the "AI look" tells to avoid.
  - [anidoodle](https://github.com/alexgreensh/anidoodle): `motion-grammar.md`, cuts that carry motion.
  - [huashu-art-motion](https://github.com/alchaincyf/huashu-art-motion): `film_gate.py`, a measured anti-slideshow gate.
- **Inspiration:** [awesome-ai-motion](https://github.com/guanmo-ai/awesome-ai-motion)
