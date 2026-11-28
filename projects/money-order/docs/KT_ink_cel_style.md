# KT: the "hand-inked cartoon cel, drawn fully in code" style

**Sources:**
- The post: [@treyscalez, 26 Nov 2026](https://x.com/treyscalez/status/2126041304421323256), read 2026-11-27. It had 96.8K views and 1.5K likes at read time.
- The verbatim prompt: `assets/references/treyscalez_ink_cel_prompt.md` (git-ignored).
- The example video: `assets/references/example_contact_sheet.jpg` and `example_transcript.txt`.

This file is the knowledge transfer, written in our own words, plus how the style maps onto this repo.

## 1. What the post is
- **What it offers:** a free prompt for Opus 5.5 that turns any story into an animated short that looks like an old hand-inked cartoon cel.
- **How the picture is made:** entirely by code. Python draws SVG, the SVG is rasterised, Pillow and NumPy composite it, and FFmpeg encodes.
- **Banned inputs:** no image or video generators, stock art or photos.
- **Who it's for:** low-end PCs.
- **What stays fixed:** the style. Only the story, the cast, the sets and the palette change.

## 2. What the example video actually does (measured)
| Measure | Value |
|---|---|
| Format | 720x1280, 24 fps, 102 s |
| Story | A true small-town crime, a public shooting where nobody talks. It opens mid-act: "He shoots a 70-year-old grocer in the neck over some candy." |
| Words | 265 in 102 s = **2.6 words/s** (gunshot pauses included; the prompt asks for 3.5) |
| Picture change | a new shot about every **3.4 s**, joined by whips and pushes, no hard cuts |
| Captions | yellow, rounded, bold, 1-3 words, lower middle |
| Look | pink/salmon skin for every character, cobalt shadows, cream; huge lumpy heads with small features; tick-mark texture (stubble, pores, plaid); hard two-tone diagonal light; a window light shaft in interiors |

**Honest note:** some example shots (a courthouse crowd of 60+ distinct people, a ring of hundreds around a truck) are denser than a hand-written code kit produces in one pass. Treat the example as the target look, not a promise. Our crowds will be repeated extras with varied hats, colours and builds, kept out of focus behind the leads.

## 3. The style rules (distilled)
- **Line:** a thin dip-pen ink (3-5 px at 1080 wide) that swells and tapers.
  - The ink is warm sepia-black `#170b08`, never navy or pure black. The finest strokes go dark red `#4d140a`, slightly see-through.
  - Lines have a slight wobble. Never thick, even sticker outlines.
- **Colour:** flat fills, no gradients on characters.
  - Lock 4-5 colours per film: one blue, one skin tone for the whole cast, one pale, one or two accents.
  - Skin gets exactly one shade tone and one light tone.
- **Cast:** caricature, not anatomy.
  - Each character gets one silhouette plus one feature readable across a room.
  - Big lumpy heads with features crowded in the middle. Builds vary: one huge, one thin, one short.
  - Age and weight are drawn as structure (jowls, bags, folds).
  - Eyes are small and hooded, with lilac whites.
- **Texture:** short ticks, dots and dash rows, never long hatching.
  - Patterned cloth gets a real pattern. Stone gets course lines and cracks; wood gets grain ticks.
- **Hands:** one lit and one in shade; padded joints, knuckle creases, a nail that stops at the fingertip.
- **Sets:** two flat light tones split by hard diagonals.
  - Night: pink/salmon lit surfaces, cobalt shadow, a pale moon with a halo.
  - Day: pale blue sky, warm sun, blue-violet shadows.
  - Interiors: one warm light shaft in a cool room. One sparkle glint on metal.
  - Behind a close-up, the set is out of focus.
- **Props:** every noun in the script is drawn, never left as a word.
- **Expressions:** at least 5 heads per lead (neutral, blink, anger, smug/joy, shock).
  - Mouths are fully drawn (lip rim, tongue, each tooth). When a mouth opens, the jaw really drops.
  - Shock is lilac discs with pinprick pupils.
- **Finish (whole frame):**
  - soften about 1 px, then unsharp (r5, 60 %) so strokes get a pale rim;
  - slow mottling on flat fills;
  - blur colour more than brightness, and shift colour 2 px off-register;
  - bloom, a warm tone, blacks lifted to brown, a vignette, grain in brightness only.
  - Captions are burned in **after** the finish so they stay crisp.

## 4. Story and shot method
- **Script:** open in the worst or strangest moment, present tense, in one line. Then: who this is → what they want → the turn → the twist → one closing line.
  - Short sentences. Check every fact and say what couldn't be confirmed.
- **Titles:** "He [did X] for [Y]" or "How [someone] [outcome]", three options.
- **Shot list:** every clause gets a shot with four things: who, expression, body action, camera move. A clause that can't be acted gets rewritten.
- **Rhythm:** cycle close-up → wide → prop insert → reaction. Never the same framing twice in a row. A second character reacts in at least 25 % of shots.
- **Pace:** the picture changes about every 2.3 s, something new starts about every 1 s, and something moves in at least 95 % of frames.
- **Camera:** never still (push, drift, orbit, punch-in). Locations change with a 4-6 frame zoom-whip or blur-whip.
- **Acting:**
  - Poses snap in 1 frame and overshoot on a spring. Faces change every 0.3-0.8 s.
  - Calm = breathing + a blink. Smug = chin up, a silent chuckle.
  - Shock = recoil, hands fly off props. Anger = fist up, chest heaving. Grief = head down, slow.
- **Background life:** something always moves (smoke, birds, water, a crowd, a fan).

## 5. The build kit (what has to be written once)
1. **Ink function:** points → Catmull-Rom → variable-width filled polygon with pressure, tapered ends and wobble. Never SVG stroke.
2. **Kit:** ticks, dash rows, fur, cracks, masonry, scrolls, medallions, fingers, teeth, a lidded eye, a jaw-drop warp.
3. **Determinism:** a fixed seed, reseeded per body part, so a part redraws identically every frame. This is also our repo rule: no `Math.random()`; use `hash()`/mulberry32 seeds.
4. **Rigs:** each lead is a jointed cut-out (body, arms, collar, one head per expression, hands), with each part on its own layer and pivot, drawn at 2x.
   - A pose that changes the outline needs its own drawn part.
5. **Sets in depth layers** (foreground, mid, back, sky) give parallax.
   - Clamp the camera so it never shows past the set edge.
6. **Per frame:** pose the joints × the camera matrix → one affine per layer → finish → captions.
7. **Encode:** one mp4 per shot (whips inside), concat-copy, then add audio.
8. **Sound:** one SFX per event, peaking on the impact frame, about 8 per 10 s, all under the voice.

## 6. How it maps onto this repo (channel rules win)
| Prompt says | We do | Why |
|---|---|---|
| 30 fps | **60 fps master; drawings on twos (new pose every 2 frames), camera moves every frame** | channel rule is 60 fps; twos keep the cel feel |
| rsvg-convert | **not installed here**; neither cairosvg nor skia. Default: draw the ink polygons straight into Pillow at 3x supersample, then downscale (no DLLs). Alternative: the `resvg` single exe, or Chrome/Puppeteer, if Pillow is too slow | Windows Application Control already blocked one native DLL (faster-whisper's ctranslate2) in this session |
| own voice / captions only | **Liam** (TX3LPaxmHKxFdv7VOQHJ, eleven_turbo_v2_5, hi, 1.2, seed 5), Hinglish, every take STT-checked | channel voice |
| Whisper word times | **ElevenLabs character timestamps** from the take (our vo pipeline); Scribe for checks | faster-whisper is blocked on this machine |
| 3.5 words/s | **~3.3 words/s** (Liam Hinglish at 1.2) | measured on past reels |
| SFX pack | our numpy synth SFX library + an original score; never a commercial song | channel rule |
| yellow `#ffe21a` rounded captions | the same, in **Roman Hinglish**, with an OFL rounded font (Fredoka or Baloo 2, to pick at design-sheet stage) | captions never in Devanagari |
| wait for "yes" at each step | the same: script + titles → design sheet → shot list + one still per shot → render (the full render only after the user's OK) | matches CLAUDE.md |
| -- | `reel_qa.py`, motionmaxxing `look.py`, `measure.py strobe`, STT on the final mix, the benchmark gate before a preview | channel QA |

## 7. Gotchas to remember
- **Lines and proportions:**
  - Thick outlines look like sticker art.
  - Normal face proportions look like a generic cartoon.
  - Long hatching is wrong; use ticks.
- **Cast and rigs:**
  - Two similar silhouettes get confused.
  - A nail past the fingertip makes a claw.
  - A beard hides a grin unless the smile is wide.
  - Tight close-ups hide acting hands, so pull wider when the body acts.
  - A shimmering drawing means a part wasn't reseeded.
  - A puppet rig can't turn a head; each outline-changing pose needs its own drawing.
- **Captions and reuse:**
  - Keep captions off faces and hands.
  - Never reuse a cast or set from one story in the next.
- **References:** compare stills against them side by side and give an honest percentage of how close they are, without rounding up.
