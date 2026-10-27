# Motion Flex: the Claude cut

Built 13 October 2026, from scratch, by Claude Opus 5.5 in Claude Code. This replaces the earlier GPT-built `possibilities`
sequence and `motion` intro as the main Motion Flex video. The earlier variants are untouched, so the two can be compared.

| Deliverable | File | Size, length |
| --- | --- | --- |
| The reel (the 30-second storyboard) | `out/motion-flex_claude_reel.mp4` | 1080×1920, 60 fps, 29.10 s, loops seamlessly |
| Integrated video (process intro + reel) | `out/motion-flex_claude_full.mp4` | 1080×1920, 60 fps, 43.65 s |
| 16:9 director's cut (score + reel + beat) | `out/motion-flex_claude_16x9.mp4` | 1920×1080, 60 fps, 29.10 s |

All three are H.264 High, yuv420p, BT.709 limited range, AAC 320k, faststart, mixed at −14 LUFS with a true peak of −5.2 dBTP.

## Seventh song: General Levy, "Dubplate" (Little Lion Sound, Hip-Hop Freestyle), with a new hook

Source: https://youtu.be/e2kIhlfmOJw (198 s), saved as `out/motion_references/dubplate/e2kIhlfmOJw.wav`.

| Variant | Length | Song window | Output |
| --- | --- | --- | --- |
| `flex_gl` | 32.85 s | 160.32–193.16 s | `out/motion-flex_claude_reel_dubplate.mp4` (not rendered yet) |
| `flex_gl_full` | 48.01 s | 145.16–193.16 s | |

**Grid.**
- 94.99 BPM; one unit is an eighth (0.3158 s), and a section is one bar (2.53 s). 95% of beats sit within 15 ms.
- After every bass gap the bass slams back on units ≡ 1 (mod 8), so those units are the bar lines.

**The viral part, put up front.** The trending segment is the "Nuclear Bomb" chopper. Speech-to-text with word timestamps
(`out/motion_references/dubplate/stt.json`) places it:
- "General Levy, yes, I come… like a nuclear bomb" at 161.6 s;
- then the fast run, about 8 words a second, until about 172 s;
- then a bass gap at 187.2–187.8 s, with a slam on unit 593 (188.11 s).

The title lands on that slam. So the reel starts 11 bars earlier, at 160.32 s, and "like a nuclear bomb" hits 1.26 s in,
on the hook's unroll. An earlier cut of this song put the title on unit 305 (97.15 s).

**New hook** (the user: "the starting does not look good"). Before, the first ~1.2 s was a small, still cube on an empty
frame. Now:
- WHAT is already stamped on frame 0, over a bigger cube (`HOOK_A` = 210, was 150) that is already spinning;
- CAN, YOU and BUILD? stomp in on the bar's next eighths (the last two are the measured pre-kick and kick);
- each slab of the unrolling cube wipes over its word as it lands.

This is `kinetic()` in `app/src/scenes/flex.ts`, and it applies to every flex variant.

**Mascot** (the user, `flex_gl` only): Claude Code's pixel creature, from the user's reference icon, built as voxels in
`app/src/scenes/_mascot.ts` and drawn over the whole reel in the top band.
- It has the 12×8 body, side arms, four legs, white eye slots and black pixel "thug life" shades.
- It walks a loop in depth (away, a turn, toward the camera), always facing where it walks, and steps on every eighth of
  the song's grid.
- On every bar's downbeat it turns to the camera, raises both arms in a flex, and an orange aura flares (glow, rays,
  pixel sparks, a shock ring).
- Every other flex, a BUILT BY CLAUDE tag pops beside it.

Rebuild with `python analysis/build_flex_song.py gl`. When posting, add "Dubplate" from Instagram's library and start it
at 2:40.3 for the reel, or 2:25.2 for the full version.

## Sixth song: Kordhell, "Murder In My Mind"

Chosen for an instant hook and escalation later: the energy is there from the first frame, and drops keep landing.
METAMORPHOSIS was measured too and lost: it opens with 10 s of near-silence.

| Variant | Length | Window of the track | File |
| --- | --- | --- | --- |
| `flex_mim` | 26.0 s | 29.03–55.03 s | `out/motion-flex_claude_reel_murderinmymind.mp4` |
| `flex_mim_full` | 38.0 s | 17.03–55.03 s (starts on the first drop) | `out/motion-flex_claude_full_murderinmymind.mp4` |

**Grid.** 120.007 BPM (98% of beats within 7.8 ms); one unit is a half-beat, and a section is one bar (2.0 s).
- The tracker locks onto the off-beats, so the bar lines are the units ≡ 3 (mod 8).
- Every 8 bars, a 2 s bass gap ends in a slam: 17.02, 33.02 and 49.05 s.

**Where the slams land:**
- **The full version** opens on the first slam.
- **The app scene** lands on the second slam.
- **"ONE IDEA."** fills the next gap, and **"ENDLESS POSSIBILITIES."** detonates on the third slam.
- **MOTION FLEX** lands at 51.03 s and holds 2 bars.

Rebuild with `python analysis/build_flex_song.py mim`.

When posting, start the library track at 0:17.0 for the full version, or 0:29.0 for the reel.

## Fifth song (the reference's own): Black Coast, "TRNDSTTR" (Lucian Remix)

This is the song of your own reference edit, Nihat Mustafayev's reel, whose description credits "trndsttr". Onset
cross-correlation places that edit at normal speed from **55.58 s** of the CloudKid upload, which is the drop. The match
scored 1.12, against about 0.3 for every alternative.

| Variant | Length | Window of the track | File |
| --- | --- | --- | --- |
| `flex_tr` | 24.0 s | 55.63–79.63 s (starts on the drop, like the reference edit) | `out/motion-flex_claude_reel_trndsttr.mp4` |
| `flex_tr_full` | 35.1 s | 44.56–79.63 s (the 6-bar intro sits exactly on the 10 s bass-silent build) | `out/motion-flex_claude_full_trndsttr.mp4` |

**Grid.** 130.036 BPM (beat 0.46141 s, first beat 0.2629 s); one unit is a half-beat, and a section is one bar (1.846 s).

**Where things land:**
- **The drop:** the bass attack is at 55.619 s, on unit 240, a bar line. The reel's first frame is there.
- **The title:** it lands on bar 11 (75.93 s in the track) and holds 2 bars.

Rebuild with `python analysis/build_flex_song.py tr`.

When posting, add "TRNDSTTR (Lucian Remix)" from Instagram's library. Start it at 0:55.6 for the reel, or 0:44.6 for the full version.

## Fourth song: Hanumankind, "Big Dawgs" (prod. Kalmi)

Taken from the official music video on Hanumankind's channel.

| Variant | Length | Window of the video's audio | File |
| --- | --- | --- | --- |
| `flex_bd` | 32.0 s | 68.94–100.94 s | `out/motion-flex_claude_reel_bigdawgs.mp4` |
| `flex_bd_full` | 48.0 s | 52.93–100.94 s | `out/motion-flex_claude_full_bigdawgs.mp4` |

**Grid.** The track is 90 BPM in half-time; the grid unit is the 180-level pulse, 0.33338 s, so a section is one bar (2.667 s).
- The music video's audio is edited, so the grid is fitted only where it is one continuous take (40–104 s). Inside that window all 192 beats are inliers, 95% within 12.5 ms.
- Fit fix: the tracker's times are frame-quantised, so the fit is now seeded with the mean gap, not the median.

**Where the drops land:**
- **The full version** starts in the first bass drop-out (52.6–54.3 s), so the bass kicks in during the intro's first bar.
- **"ENDLESS POSSIBILITIES."** explodes where the bass slams back after the second drop-out (95.61 s).
- **MOTION FLEX** lands one bar later (98.27 s).

Rebuild with `python analysis/build_flex_song.py bd`.

When posting, add "Big Dawgs" from Instagram's library. The music video's timing may differ from the streaming version, so line up the start by ear: the title should land one bar after the second bass drop-out.

## Third song (recommended): Daft Punk, "Harder, Better, Faster, Stronger"

Taken from the official audio on the Daft Punk channel. The robot vocals ("work it, make it, do it, makes us harder, better,
faster, stronger") are the reel's own message, and the four-on-the-floor kick gives every cut a hit to land on.

| Variant | Length | Window of the track | Title lands | File |
| --- | --- | --- | --- | --- |
| `flex_dp` | 25.27 s | 78.99–104.26 s (song bars 40–52) | 21.39 s (track 1:40.4) | `out/motion-flex_claude_reel_daftpunk.mp4` |
| `flex_dp_full` | 36.94 s | 67.32–104.26 s (song bars 34–52) | 33.05 s | `out/motion-flex_claude_full_daftpunk.mp4` |

**Grid.** A constant fit to the beats gives 123.448 BPM: the beat is 0.48603 s, the first beat at 1.2202 s, and 95% of beats sit within 13 ms of the grid.

**One section per bar** (1.944 s), with the title holding 2 bars (the score's `end` moves to bar 13).

**The structure matches the score:**

| Song bars | Musical event | Reel moment |
| --- | --- | --- |
| 42–43 | bass dips | the dashboard's command palette |
| 44 | bass returns | the product launch |
| 48–49 | bass out completely (2-bar breakdown) | "ONE IDEA." |
| 50 | the drop | "ENDLESS POSSIBILITIES." |
| 51 (loudest bar) | the peak | MOTION FLEX |

Rebuild with `python analysis/build_flex_song.py dp`.

When posting, add the song from Instagram's library starting at 1:07.3 (full) or 1:19.0 (reel). Those offsets assume the album version (3:44).

## Second song: the Oppenheimer theme

These variants use "Can You Hear The Music" (Ludwig Göransson, from the composer's official YouTube upload): the same scenes and
the same `score.json`, re-timed to that track.

| Variant | Length | Window of the track | File |
| --- | --- | --- | --- |
| `flex_opp` | 28.14 s | 75.63–103.78 s | `out/motion-flex_claude_reel_oppenheimer.mp4` |
| `flex_opp_full` | 42.24 s | 61.53–103.78 s | `out/motion-flex_claude_full_oppenheimer.mp4` |

**How it differs from the phonk version:**
- **No kick drum, a drifting pulse.** The track's pulse wanders, so the grid is the measured beat sequence itself, from `librosa beat_track` (tightness 400). The median pulse is 0.3019 s (≈199 BPM; labelled "~203 bpm" on screen).
- **One beat is one score eighth**, so a section is 8 beats, about 2.36 s.
- **The hard cut to silence is the impact.** The window ends on the track's own cut (101.49 s in the track). The title section starts on the last beat before it, so MOTION FLEX solidifies just as the music stops, with a low boom under the silence.
- **One continuous excerpt.** There are no loops or splices, and nothing is stretched.

Rebuild with `python analysis/build_flex_song.py`. Preview with `$env:VITE_VARIANT='flex_opp'; bun run dev:flex`. Render with `--variant flex_opp` (or `flex_opp_full`).

The song is copyrighted. When posting, add it from Instagram's library and start it so the cut to silence lands with the title.

## Preview and render

```powershell
cd app
bun run dev:flex                                    # http://localhost:54173, the reel; space plays it
$env:VITE_VARIANT='flex_full'; bun run dev:flex     # the integrated video
bun scripts/render_flex.ts --stills 3.3,9.8 --out ../out/flex_wip/check      # stills + out-of-order seek check
bun scripts/render_flex.ts --sheet 0:29:0.5 --out ../out/flex_wip/sheet.jpg  # contact sheet
bun scripts/render_flex.ts --video --scale .5 --fps 30 --out ../out/flex_wip/animatic.mp4   # animatic, ~30 s
bun run render:flex                                 # final reel: 60 fps, 4 motion-blur sub-frames
bun scripts/render_flex.ts --variant flex_full --video --fps 60 --samples 4 --out ../out/motion-flex_claude_full.mp4
bun scripts/render_flex.ts --wide --video --fps 60 --samples 2 --out ../out/motion-flex_claude_16x9.mp4
```

To change any timing, edit `data/flex/score.json` (written in bars and eighth notes), then run
`python analysis/build_flex_audio.py`. This rebuilds the cues, the SFX mix and the engine data, and both scenes re-time.

## Files

| Path | Role |
| --- | --- |
| `app/src/scenes/flex.ts` | The reel: 12 sections, one continuous object story, HUD, loop tail |
| `app/src/scenes/flex_intro.ts` | The 6-bar process intro of `flex_full` |
| `app/src/scenes/_vo.ts` (Flex section) | Shared kit: palette, closed-form springs, a quaternion/perspective projector, type helpers |
| `app/src/flex-export.ts`, `app/flex-render.html` | Seekable exporter: `window.__flex.render(t)` draws 1080×1920 vector frames; `?wide=1` gives the 16:9 cut |
| `app/scripts/render_flex.ts` | Stills, determinism check, contact sheets, video |
| `data/flex/score.json` | The choreography in musical units, plus the SFX list |
| `analysis/build_flex_audio.py` | Measures the grid, builds the edits, resolves the cues, mixes the SFX, normalises loudness |
| `data/flex*/cues.json` | Resolved times (the single source of timing for scenes and sound) |

The engine (`app/src/engine/`) was not edited.

## Music

- **Source.** The exact Short you supplied, *MATUSHKA ULTRAFUNK [ULTRA SLOWED*, uploaded by phonk_music (SHA-256 checked on every build).
  - It is **not** a clip of the official *ULTRA SLOWED* release on satirin's channel.
  - That release runs at 0.2165 s per eighth note, against the Short's 0.3031 s. Neither waveform nor mel correlation matched it at any slowdown factor.
  - So the Short stays the source.
- **Grid.** Measured from the Short's kick attacks: the steepest rise of the 35–160 Hz envelope, fitted by robust least squares on the eighth-note pulse.
  - The fit uses 6 inlier kicks, each within 15 ms; kicks further off the grid are swing.
  - Eighth note 0.30311 s, beat 0.60623 s (98.97 BPM), bar 2.42490 s, first bar line at 0.1589 s in the Short.
- **Structure.** The Short holds a 6-bar phrase. The bass drops out from 8.57 to 9.57 s, then the drop lands on bar 5's line.
  - **Reel:** 12 bars = 2 phrases, 29.099 s. Its end flows into its start, so an Instagram replay doesn't jump.
  - **Integrated:** 18 bars = 3 phrases, 43.648 s.
  - Nothing is time-stretched or pitch-shifted; the phrase is repeated on bar lines with 4 ms equal-power splices.
- **SFX.** Whooshes peak on each morph's landing; clicks on UI taps; ticks per typed character; a riser into the second drop; slams on the drops and on the final impact.
  - They are placed from the same `cues.json` the visuals read, and measured as +1.4 to +2.9 dB lifts on their cues: felt, not fighting the song.

## Shot list (reel time, seconds)

One section per bar. Each morph starts early and lands on its bar line; each section's payoff hits that bar's kick (the bar line + 0.91 s).
Times marked "snapped" were moved onto the measured onset within 70 ms.

| Bar | Time | Section, on-screen copy | What happens | Carrier into the next |
| --- | --- | --- | --- | --- |
| 1 | 0.000–2.425 | WHAT CAN YOU BUILD? | A lit cube spins inside a construction system (vertex rays, orbit ring, live yaw readout); exploded view on the pre-kick 0.606; on the kick 0.909 its four sides fly in true 3D onto four type slabs, each word rising through its slab's mask. "// made entirely in code with Claude Opus 5.5" from frame 0. | The slabs close into a browser window (top slab becomes the chrome bar) |
| 2 | 2.425–4.850 | WEBSITES THAT COME ALIVE. | A fictional studio site assembles in reading order; the hero art (generative rings) wipes open on the kick 3.334; cards rise in eighths; the cursor clicks the responsive toggle 3.941. | The window narrows into a phone while every element reflows to mobile (per-word FLIP); the page swipes up to the app |
| 3 | 4.850–7.275 | APPS THAT FEEL MAGICAL. (two vertical columns) | Tab pill stretches; field focus on the pre-kick 5.456; "launch the speaker" typed from the kick 5.759; press 6.365; pill becomes a spinner; ring closes and a check draws 6.820; result card rises. | The result card opens into the full-frame dashboard, and its 8 bars travel into the dashboard's 8 bars |
| 4 | 7.275–9.700 | DATA TURNED INTO EXPERIENCES. | Split-flap title locks on the kick 8.184 with the KPI counters; the line chart is drawn; the 7D→30D filter re-shapes the series. In the breakdown (8.41–9.41) the room dims, ⌘K opens, "show growth" is typed, Enter 9.093 charges the tallest bar. | On the drop 9.700 the charged bar shoots up |
| 5 | 9.700–12.124 | PRODUCT STORIES THAT SELL. | A fictional speaker on a dark stage: letterbox slams in, top light, lime and white rim lights, an orbiting reflection and rotating grille; PRODUCT / STORIES / THAT SELL. enter on the drop bar's kicks (9.900, 10.640, 11.094, snapped); callouts. | The silhouette shatters into 30 modules that fly to the poster grid; hard flip to lime on the bar line |
| 6 | 12.124–14.549 | MOTION WITHOUT LIMITS. | Swiss poster: MOTION rises from the centre outward and stretches its width in a wave; WITHOUT / LIMITS. slam on the kick 13.034 with 2 inverted frames; modules morph square → circle → quarter → triangle in diagonal waves on the eighths, shear into a brick bond, extrude. | Six modules become the character's head, body, arms and legs; the lime field closes into the story's sun |
| 7 | 14.549–16.974 | STORIES BROUGHT TO LIFE. | Layered dusk landscape with parallax; the character lands (squash), walks, looks up (eyes first) on 15.156, catches the seed falling from the sun on the kick 15.459, hugs it, jumps on 16.065. | The illustration drains to lime wireframe, the sun sinks, the world folds flat into the city's ground grid; the hero shrinks onto a street corner |
| 8 | 16.974–19.399 | WORLDS BUILT FROM CODE. | 81 procedural glass towers rise in a ripple; one camera move for the phrase (crane down, dolly in, turn); the title stands up as three billboards in 3D on the kick 17.884; the code (`extrude(h)`, `noise(x, z)`) is pinned to towers; hat hits flicker roof lights. | The towers become waves, the camera rises to top-down, the night contracts into a record and the tops fly radially onto its tick ring |
| 9 | 19.399–21.824 | SOUND YOU CAN SEE. | A record whose groove is the song's measured waveform; a ring of 96 ticks that is the current bar's measured low band (eighths in orange, a playhead); particles on a rose curve gain petals on the kicks 20.006 (3 → 5) and 20.309 (5 → 7). | Everything collapses to one point while the record expands to fill the frame |
| 10 | 21.824–24.249 | ONE IDEA. | The cube again. In the breakdown (22.96–23.96) a fragment of every scene orbits it, faster and closer; everything is pulled in. | The drop |
| 11 | 24.249–26.674 | ENDLESS POSSIBILITIES. | 2 inverted frames and a shake on the drop; the cube bursts into a tunnel of 30 scene tiles flying at the camera; the tiles flip on the kick 25.190. | The tiles converge into the ten letter boxes (landing on the kick 25.643) |
| 12 | 26.674–29.099 | MOTION FLEX · Powered by Claude Opus 5.5 · COMMENT "MOTION" / I'll DM you every skill + repo behind this reel. | Each letter is a window onto one scene (M websites, O app, T dashboard, I product, O poster, N story, F city, L record, E hook, X app); on the bar line the fill rises through the letters; credit and CTA land; final impact on the kick 27.583 (CTA punch, 2 inverted frames, light sweep). | The last 0.26 s collapse into the opening cube, so the replay starts on its own next frame |

The process line at the bottom of the frame (below the safe zone) shows the current section's code, the clock and the eighth notes of the bar.

## Integrated video (`flex_full`): 6-bar process intro + the reel

| Bar | Time | Headline | Process shown |
| --- | --- | --- | --- |
| 1 | 0.000–2.425 | IT STARTS WITH ONE PROMPT. | A terminal; "make a motion reel on the beat" typed; Enter on 1.819; the reply (song read, 12 scenes planned, writing the scene) |
| 2 | 2.425–4.850 | CLAUDE OPUS 5.5 WRITES THE CODE. | Real lines of `flex.ts` written in on the sixteenths, syntax-coloured; capability chips land on the kick 3.334 |
| 3 | 4.850–7.275 | EVERY CUT ON THE BEAT. | The song's waveform scanned; eighth and bar grid snaps into place on the kick 5.759; measured kicks marked; tempo readouts |
| 4 | 7.275–9.700 | EVERY FRAME IS CODE. | A film strip of the reel's own frames under a playhead; it stops in the breakdown, restarts when the bass returns |
| 5 | 9.700–12.124 | NO AFTER EFFECTS. → NO TIMELINE. JUST CODE. | A keyframe timeline struck through on the drop; second headline on the kick 10.640 |
| 6 | 12.124–14.549 | HERE'S WHAT IT BUILT. | The code's characters fly into the visible faces of the cube, which becomes the reel's first frame at 14.549 |

## Storyboard deviation, and why

The brief times the sections at 0, 2, 5, 8 … 26 s (3 s each). This song's bar is 2.42 s, so 3-second sections would cut at random points inside bars.

I locked one section to each bar instead, which gives three things:
- **A payoff every 2.42 s.** The brief asks for one every 2–3 s.
- **Musical hits on the right moments.** The product launches on the first drop, "ONE IDEA." sits in the second breakdown, and "ENDLESS POSSIBILITIES." explodes on the second drop.
- **A readable CTA.** The finale gets three bars, so the CTA is on screen for about 2.1 s. The loop shows it again on every replay.

The copy, its order and the chain of transformations are as briefed.

## Quality control

The review loop: contact sheets every 0.5 s, dense strips at 0.05 s spacing around every hand-off, full-size stills for type, animatics, and the determinism check (every listed time rendered forward and in reverse must match byte for byte; it passes).

Problems found and fixed, most visible first:

1. **Non-deterministic frames.** 608×1080 is not exactly 9:16, so the bottom pixel row kept the previous frame. Frames are now scaled to full height, the 0.9 px horizontal overhang is cropped, and the canvas is cleared each frame.
2. **A black band across the story landscape.** A colour helper returned `rgb()` strings that `alpha()` could not parse. It returns hex now.
3. **App → dashboard reset.** The result card's content stayed fully visible (a nested `globalAlpha` reset its fade), and the dashboard then rebuilt from empty. The card's 8 bars now travel into the dashboard's 8 bars as one shared element.
4. **City → record paths crossing in V shapes.** Ring slots were assigned column by column. Each tower top now takes the slot of its own bearing, so the paths are radial.
5. **Converge into the title.** Distant tiles were skipped, so the FLEX row never formed. On the 2 inverted punch frames the scrim showed as a grey blob.
6. **Readability:**
   - The sun overlapped the story title.
   - The letters were unreadable while fragments filled them; a lime/bone outline now carries the word.
   - The city was muddy; it is relit as glass with lit edges, window bands and depth fog, and the camera pulled back.
   - The module field looked random; colours and kinds now follow the grid.
7. **Safe zone.** Headlines were fitted to x 36–572, which entered the right 120 px of the final frame. All text now fits 36–536, and centred type sits on the safe-zone centre line.
8. **Pacing and audio:**
   - About 0.3 s of empty page between the hook and the website.
   - The hook's premise line at 13 px is now 16 px and visible from frame 0.
   - The HUD was hidden under the browser edge.
   - SFX were inaudible under the dense mix and are now raised.
   - The loop point clicked; 4 ms edge fades fix it.

Not verified: no one listened to the mix (the checks are numerical), and the reel was not viewed on a phone, only as full-size stills.

## Narration

Music-led, as you asked, so no voice was generated. The optional script from the brief:

> What if one idea could become almost anything? Websites that feel alive. Apps that respond. Dashboards that tell stories.
> Product films. Motion graphics. Animated stories. Interactive worlds. With Claude Opus 5.5 and the right tools, ideas become
> things you can build. Welcome to Motion Flex.

## Provenance (what you can truthfully say)

- **Written by Claude Opus 5.5 in this session:** every scene, the shared Flex kit, the exporter, the render script, the audio analysis and edit script, and the score.
- **Not written by Claude:**
  - The render engine: pdoom-video by mexicat, MIT.
  - The fonts: Archivo and IBM Plex Mono, both OFL.
  - The song: by satirin, FUNK DEMON and EVO, used here in a third-party ultra-slowed edit.
  - The SFX: synthesized in an earlier session.
- **The demos are fictional.** The site (FIELD studio), the app, the dashboard's sample data and the speaker (AURA ONE) are invented, and they are labelled on screen as demo data or fictional product.
- **Claims that hold:** "Made in code with Claude Opus 5.5" and "No After Effects" are true for this video. Avoid "100% AI" or "Claude did everything": a human picked the song, the brief and the references.
- **The song is copyrighted.** For posting, add the track from Instagram's own music library if it is there, at this edit's start, and lower the original audio. Otherwise the platform may mute or claim the reel. The research DM list is in `docs/MOTION-FLEX-RESOURCES.md`.

## Posting copy

**Caption:** I made this entire reel in code with Claude Opus 5.5. No After Effects. No timeline. Every frame is a function of
time, and every cut lands on the beat. Comment **MOTION** and I'll DM you every skill and repo I used.

**Pinned comment:** Comment MOTION for the resource list. The site, app, dashboard and speaker are fictional demos; the
workflow is AI-assisted code + a code renderer + measured music analysis.

**Cover:** the lockup frame at 28.4 s, or the four type slabs at 1.6 s.
