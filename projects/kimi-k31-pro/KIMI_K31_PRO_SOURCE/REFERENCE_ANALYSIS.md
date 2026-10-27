# Reference analysis — "Meet Kimi K3.1 Pro" (craft only)

Purpose: study pacing, shot language, transitions, type and sound of the official launch film so our
independent explainer can match or beat its craft. **Nothing here is to be copied shot-for-shot, and no
footage or frames from it go into this project.** All frames used for this analysis live only in the
session scratchpad (`...\scratchpad\refvid\`).

## 1. What was fetched and how

| Item | Value |
|---|---|
| URL | https://youtu.be/DIyHTpfWctU |
| Title / channel | "Meet Kimi K3.1 Pro" / Kimi AI (official), uploaded 2026-10-23 |
| Description | "Full-project coding, parametric 3D modeling, reliable finance work. Now live on Kimi.ai, Kimi Work, Kimi Code and the Kimi API." |
| Duration | 93.71 s |
| Video | 1920x1080, 25 fps, AV1 (yt-dlp format 399) |
| Audio | Opus 48 kHz stereo (format 251), merged to mp4 |

Method: yt-dlp 2026.08.19 (first attempt succeeded; warning about a missing JS runtime, no effect).
Frames: 1 fps (94 frames) + 4 fps (375 frames) contact sheets, ffmpeg scene scores for every frame
(`select=gte(scene,0)` + metadata print) and frames at scene>0.3 (36 events), 12.5 fps strips around
21 transitions, plus ~28 full-res stills. Every sheet and strip was viewed. Audio: ffmpeg ebur128
(integrated + 3 s short-term), librosa beat_track / onset_strength / RMS / mel spectrogram (plotted
with cut markers and viewed), faster-whisper "small" (CPU, int8).

What I could not do, stated plainly:
- I cannot listen. Sound notes come from loudness, onsets and the spectrogram; I do not name instruments or genre.
- Whether the retro-desk opening (0.2–1.4 s) is live action, CG or AI-generated cannot be told from the frames.
- Cut times are from the AV1 stream at 25 fps: +-1 frame (40 ms).
- Beat tracking is reliable for 20–72 s (steady ~129 BPM). It is weak for 0–20 s and 75–94 s, where the music does not pulse steadily.

## 2. Structure at a glance

| Section | Time (s) | Shots | Avg shot | Content |
|---|---|---|---|---|
| A Hook | 0.00–4.68 | 5 | 0.94 s | retro PC, prompt on CRT, glitch, a world appears out of code |
| B World + logo | 4.68–19.92 | 7 | 2.2 s | cloud-sea flythrough, game HUD, K3.1 logo card, rooftop flight |
| (black) | 19.92–21.08 | 1 | 1.16 s | breath before the drop |
| C Genre montage | 21.08–35.62 | 16 | 0.9 s | racing, jet, FPS zombie, parkour (game captures, labelled) |
| D 3D craft | 35.62–44.62 | 4 | 2.25 s | cathedral + clay build split, robot, future city |
| E Websites | 44.62–70.90 | 9 | 2.9 s | floating browser windows over a cloud plate, carousel, collage |
| F Title | 70.90–75.64 | 1 | 4.74 s | "THIS IS IT" scramble to "KIMI K3.1 PRO", slashed |
| G Finale | 75.64–89.88 | 8 | 1.8 s | black, palace terrace, moon, sword fight, dragon |
| H End cards | 89.88–93.71 | 2 | 1.9 s | "Now available on Kimi.ai, App & Api", "KIMI" |

49 cuts/units overall, so an average shot length of about **1.9 s**. There is no narration. On-screen text
is limited to labels, the logo and the end cards. Everything else is diegetic UI: HUDs and website copy.

## 3. Per-shot table

Abbreviations: HC = hard cut, LA = low angle, WS/MS/CU = wide/medium/close, mono = monospace caps label chip.

| # | Time (dur) | Subject | Framing | Camera | Background | Palette | Lighting | Type | Transition out | Sound | Technique | Emotion | Our implementation (original) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 0.00–0.20 (0.2) | K3.1 logo card (same image as #10) | WS | static | misty peaks | grey-blue, white | soft overcast | brush glyph + serif caps | HC | impact at 0.30 | MG over plate | flash/tease | skip; a 5-frame flash wastes the hook on our first view |
| 2 | 0.20–1.40 (1.2) | beige retro PC, CRT shows Kimi terminal; tapes "GAME ENGINE / 3D MODELING / LEVEL DESIGN / TEXTURE MAPS / REAL-TIME RENDERING", "K3.1" cartridge | WS frontal, centred | locked off | wall of vintage electronics | teal-grey, olive, beige, brown wood | low-key, screen glow | tiny terminal text | HC on hit | near-silence 0.42–0.81, two mechanical clicks (0.88, 1.44) | photoreal set (LA/CG unknown) | curiosity, nostalgia | ours opens on an object (turbine), not a desk; a locked-off frame with one light source is worth borrowing |
| 3 | 1.40–1.76 (0.36) | CRT CU: "Welcome to Kimi K3.1 Pro!", Model/Version, prompt "Create a cinematic Chinese fantasy scene in UE", C++ `Write(...)` lines, "K3.1 Pro is running 11h28m30s" | screen fills frame, bezel curve visible | static | CRT | near-black, cyan/white mono | screen emissive | mono terminal | in-shot glitch | cut on onset 1.42 | screen MG in CRT plate | "it's working" | our prompt terminal is the *destination* of 01; render it as crisp SVG/DOM text, readable for at least 0.8 s, not 0.36 s |
| 4 | 1.76–2.36 (0.6) | code smear, RGB block datamosh of a statue, white blowout | same | static | CRT | RGB bars, then white | — | code glyphs | flash to full frame | glitch hit 2.37 | 2D glitch comp | rupture | one 2–3 frame flash at most; our turbine-to-vertices beat does this job geometrically |
| 5 | 2.36–4.68 (2.32) | colossal seated stone statue | LA WS hero | slow push | deep-blue sky, cirrus streaks | blue/white/stone | hard sun, top-left | code-glyph texture over frame, dissolving in ~0.3 s; second pulse 3.0–3.2 | HC under cloud roll-in | swell to loudest of intro (~3.3) | 3D render + glyph overlay | awe: code became a world | glyph quads (InstancedMesh, SDF atlas) placed *on surfaces*, settling with seeded per-glyph delays |
| 6 | 4.68–6.76 (2.08) | sea of cumulus | eye-level WS | slow forward drift | sky | pale blue/white | soft daylight | — | HC | drops to airy bed (~-20 dB RMS) | volumetric render | breath | use a 2 s low-energy shot after the hook peak; ours could be the sphere hanging in black |
| 7 | 6.76–9.04 (2.28) | rock island + statue in cloud | top-down WS | slow descent | clouds | white/charcoal | flat | — | HC | music fully enters at 6.8 | 3D render | scale | — |
| 8 | 9.04–10.84 (1.8) | haloed Buddha heads, pagoda roof in cloud | high WS | drift | clouds | white, gold rings | soft | — | HC | steady bed | 3D render | wonder | — |
| 9 | 10.84–15.88 (5.04) | white-robed swordsman on flying sword; past statues, cliffs, teal lake, into fog | 3rd-person chase | follows, banks | cloud sea, then lake | white, then teal | diffuse, fog | game HUD fades in 11.0–11.3 (ink-brush icons, minimap) | fog whiteout 15.1–15.8, then HC | bed continues | real-time game capture | freedom, "it's playable" | the longest take; motivated whiteouts (fog) are cheap in Three.js (`scene.fog` density ramp) |
| 10 | 15.88–17.95 (2.07) | brush glyph "K3.1" + "KIMI K3.1 PRO" serif small caps | centred lockup over WS peaks | slight drift | misty mountains | grey-blue, cream sky | overcast | logo fades in ~0.45 s | ~0.1 s dissolve | bright shimmer hit at ~15.9–16 | MG over plate | brand stamp | our 02 lockup: hold 2.0 s+, fade/reveal no longer than 0.5 s, our own type (no brush glyph) |
| 11 | 18.00–19.92 (1.92) | rider over grey-tile rooftops, reveals colossal statue legs | chase, low | fast fly, bank | Chinese town | slate grey | overcast | — | HC to black | riser 18–19.5 | game/3D capture | momentum | — |
| 12 | 19.92–21.08 (1.16) | black | — | — | black | — | — | — | HC | low drone, top band empty | edit | anticipation | black + sub drone for 1 s before our first demo drop |
| 13 | 21.08–22.08 (1.0) | jet + flying hero in desert canyon, light trails | chase | fast | red rock, blue sky | rust/blue/cyan | hard sun | HUD numerals | HC | **strongest transient of the film (21.13) = drop** | game capture | release | put our montage/demo start on the biggest hit |
| 14 | 22.08–24.00 (1.92) | jet through rock arch, laser, explosion; "SLOW-MO x0.02" HUD | WS | slow-mo, then normal | canyon | rust/pink/white | hard sun | label chip "▲ UNITY SPEED RACING" | HC | — | game capture | control | speed contrast (slow vs fast) is the idea for our 10 Highspeed |
| 15 | 24.00–25.72 (1.72) | red muscle car, neon exhaust | chase, low | fast, heavy motion blur | night road | red/cyan on dark green | neon | HUD: speedometer arc + big italic numerals, score ticking each frame; label "ARCADE RACING GAME" decodes 24.5–24.9 | HC | — | game capture | adrenaline | live counters: tick numbers every frame inside a gauge, never as a static slide |
| 16 | 25.72–27.16 (1.44) | same car, autumn tunnel | chase | radial speed blur | orange trees | orange/red | warm | HUD | HC | — | game capture | peak speed | — |
| 17–21 | 27.16–30.68 (5 shots: 0.48 / 0.52 / 0.68 / 0.80 / 1.04) | FPS zombie: neon alley, then alley erupting in fire, burning zombie, green energy gun in a street, dark corridor with flashlight | 1st-person | handheld feel | urban night/day | blue neon, then orange/red, then grey, then black | neon, fire, flashlight | label "FPS ZOMBIE SURVIVAL" (decode 28.0–28.3) | HC each | dense hits, 4–4.5 onsets/s | game capture | intensity | the fastest run of the film; for our 12 montage use 0.5–1.0 s shots, one idea per shot |
| 22 | 30.68–35.62 (6 shots: 0.96 / 0.36 / 0.72 / 1.00 / ~1.9) | rooftop parkour: run, fall between towers, landing roll, sunset water-tower roofs, top-down dive to the street grid | mixed, ends in top-down | follow, then vertical dive | city | gold sunset, slate | golden hour | HUD timer "00:26.63", speed bar, avatar "007 a.k.a. Kimi"; label "ROOFTOP PARKOUR BY UNREAL ENGINE" | zoom/radial-blur push 35.6–35.9 | pitch-glide sound 33–35.5 | game capture | thrill | a radial blur push between two of our worlds (post-process pass) |
| 23 | 35.62–41.20 (5.58) | Gothic cathedral nave; from 37.4 a split: left final render, right grey clay viewport where pillars, then arches, then walls assemble, then the camera flies inside | WS one-point, then 62/38 split | slow push (both halves) | interior / grey viewport | amber + stone vs neutral grey | warm shafts vs flat | label "3D ARCHITECTURE VISUALIZATION" | HC | top band thins | 3D render + viewport capture split | "this is how it was built" | **direct precedent for our 05**: final vs process side-by-side, process half animating by component groups |
| 24 | 41.20–42.52 (1.32) | cute camera-head robot in wooden shed, head tilts | MS | static | shed | cream/teal/brown | warm practical | label "REAL-TIME 3D ASSEMBLY" (block flicker 41.22–41.38, decode to 41.62) | HC | high band filtered out 41–43.3 | 3D render | charm | — |
| 25 | 42.52–43.22 (0.7) | industrial gate at dusk, crescent moon; vehicle launches at camera | WS | static | dusk sky | blue/steel | dusk | same label | **plume whiteout wipe** 43.2–43.3 | filter opens at 43.3 | 3D render | launch | object-motivated wipe: something in our scene fills the lens |
| 26 | 43.22–44.62 (1.4) | hover cars in a canyon of brick towers | chase | fast forward | city canyon | purple/brick, white plume | haze | label "3D FUTURE CITY" | frame shrinks into a browser window over cloud plate (~0.15 s) | — | game capture + window comp | turn to "built for the web" | the full-bleed-to-window pull-back is a strong chapter hinge; use it once |
| 27 | 44.62–48.00 (3.38) | Blender UI: Alpine town, church, lake | window on cloud plate | window slides in R to L (~0.5 s); viewport orbit | soft grey cloud plate | warm town on grey | — | label "3D TOWN IN BLENDER" | carousel slide | regular pulse | screen capture in MG window | craft | one window style across every demo makes mixed looks read as one system |
| 28 | 48.00–52.32 (4.32) | dark car site: chrome car, neon X lights; push to rear plate "KIMI K3.1"; "Veloce GRAND TOURING COUPE"; "Every single part." + "1,153 individual parts" with exploded car, cursor | window | site camera orbit + push | black site | chrome/white | studio rim light | site headlines; label "3D WEBSITE" bottom-right | HC | loudest mid-section (RMS ~-3 dB at 49) | screen capture | luxury/precision | the exploded-parts counter is diegetic proof; our 05 can count parts as they separate |
| 29 | 52.32–54.60 (2.28) | white "FORM / 01 DEXTEROUS ARM" site: hundreds of flat-laid parts fly together into a blue robot arm (52.4–53.3), then a hand CU | window | assemble, then in-site cut | white UI | white, steel blue, yellow chip | flat | label "3D PRODUCT ANIMATION" (yellow block first) | HC | — | screen capture | satisfying assembly | scatter-to-assemble in 0.8 s, staggered by part size |
| 30 | 54.60–56.10 (1.5) | dual robot arms solving a cube, side panels and charts | window | static | dark UI | white on black | — | white chip, black text | carousel slide | — | screen capture | competence | — |
| 31–32 | 56.10–61.30 (3.18 + 2.02) | "The Atelier": ornithopter on green cutting mat, then camera swings into a greenhouse room; ornithopter flies at lens | window | slow push, then in-site camera move | dark wood desk | green, cream, brown | warm | label arrives late (57.2–57.6) | **wings fill frame = wipe** | dense hi-freq pulses 56–60 (~9 onsets/s) | screen capture | delight | foreground-occlusion wipe |
| 33 | 61.30–64.20 (2.9) | blurred flying pages, then "Paper Tide" site: endless letter stacks, a black printer device, letter cards UI | window | slow drift | paper world | white, navy ink, red accent | flat bright | label "3D INTERACTIVE STORYTELLING" | window shrink, HC | gap ~62.3 then hit 62.51 as the label lands | screen capture | poetry/scale | density as meaning: our 03 document stack |
| 34 | 64.20–67.62 (3.42) | "HUMAN FIGURE": chrome Thinker splashed with paint, huge display type, fluid blobs; scroll to yellow "A STILL FORM. A MOVING MIND." | starts full-bleed, retreats to window | pull-back, then scroll | pink/lilac, then yellow | saturated pop | flat | site display type; label "INTERACTIVE ART WEBSITE" | fast shrink (~0.15 s, motion blur) | — | screen capture | boldness | — |
| 35 | 67.62–70.90 (3.28) | window becomes a small card on light grey; many site cards pop in around it as a collage, then the collage drifts off right | WS of cards | lateral drift | light grey | mixed, on near-white | flat | site names inside cards | collage exits right | thinning, high band fades | MG layout of captures | "all of this" | our 12 payoff: grid/collage of our own scene stills from the film, then clear to empty |
| 36 | 70.90–75.64 (4.74) | "THIS IS IT" (serif small caps) scrambles in (70.94–71.6); armored warrior with red sash flies L to R (73.1–74.3), letters scramble as he passes and resolve to "KIMI K3.1 PRO" (74.32); hold ~1.2 s; slash back through the title (75.5) | centred text, cut-out character | static | near-white | black type, red sash | flat | small serif caps | slash, then HC to black | music thins to about -40 dB RMS at 73; whoosh hit 73.3; near-silence 74.5–75.2; slash hit 75.3 | MG + character render | climax, wit | text driven by an object passing over it (scramble mask follows a moving x); our own subject, our own type |
| 37 | 75.64–78.14 (2.5) | black | — | — | — | — | — | — | fade up ~1.0 s | low ambience | edit | reset | second black beat; ours before 12 |
| 38 | 78.14–81.08 (2.94) | lone hatted figure on a reflective palace terrace, red pillars, gold clouds | LA WS, deep perspective | slow push | sunset sky | red/gold/black | backlit golden | — | HC | — | cinematic CG | epic calm | — |
| 39 | 81.08–83.08 (2.0) | railing with gourd finials, cloud sea, huge moon | MS | slow lateral | moon + clouds | gold/sepia | backlit | — | HC | onset at cut 81.1 | cinematic CG | majesty | the moon as a quiet hero: echo with our 02 sphere terminator |
| 40–43 | 83.08–87.00 (4 shots: 0.92 / 1.40 / 0.80 / 0.80) | sword fight: hatted hero vs black-clad warriors; leaps up red pillars; backlit silhouette mid-air; impact burst on the floor | MS to WS, LA | fast follow | red lattice, sky | red/gold, white slash arcs | backlit | — | HC each | hits at 83.1, 85.4 | cinematic CG | action payoff | arcs as light trails (`MeshLine`/ribbon strips) for our agent graph pulses |
| 44 | 87.00–89.88 (2.88) | giant dragon roars over the terrace; tiny lone figure | WS | static | terrace, clouds | red/white/gold | backlit | — | HC to black card | sustained loud 85.5–89.9 | cinematic CG | scale finale | end on a single big-scale image before the card |
| 45 | 89.88–91.55 (1.67) | "NOW AVAILABLE / ON KIMI.AI, APP & API" | centred 2 lines | static | black | white | — | serif small caps | HC | hit at 89.9–90.0 | MG | call to act | our end card: availability line in our type plus "independent, not affiliated" |
| 46 | 91.55–93.71 (2.16) | "KIMI" wordmark | centred | static | black | white | — | geometric sans wordmark | end | last hit 91.77, decay to silence 93.6 | MG | sign-off | hold 2 s, music tail decays under it |

## 4. Pattern notes

- **Hero shots:** low-angle colossal scale against sky (#5, #38, #44) and a lone small figure against something huge (#9, #38, #44). Hero shots get 2–3 s and are static or slow-pushed.
- **Demos:** every capability is shown *as a finished artefact in use*: a game being played or a site being scrolled. Process is shown only once, in the cathedral split (#23) and the part assembly (#29).
- **3D:** realistic renders throughout, with camera moves inside the artefact (site orbit, viewport fly-through) rather than cuts.
- **Data viz:** none. The only numbers are diegetic: speed and score counters ticking every frame, "1,153 individual parts", and the terminal clock jumping from 9h53m20s (0.8 s) to 11h28m30s (1.5 s) to imply a long run.
- **UI animation:** one container (browser window, back/forward/reload, close X) over one soft cloud plate. Moves are a horizontal carousel slide (~0.5 s), a full-bleed-to-window shrink (~0.15 s, motion blur), and window-to-card pulled back into a collage.
- **Code:** a real-looking terminal with a prompt (readable for only ~0.35 s), then code used as *texture*: glyphs over the statue that dissolve away.
- **Cross-subject transitions:** about 35 of 49 are hard cuts, several hidden under an object (cloud roll-in at 4.68, fog whiteout 15.1–15.88). The rest are window moves (shrink 43.55 and 67.62, carousel slides 44.62, 48.00 and 56.10) or wipes motivated by objects in the frame: vehicle plume (43.2), ornithopter wings (61.0–61.3), zoom-blur push (35.6), sword slash to black (75.6), fade up from black (78.1). The single dissolve is logo to city (17.95). Glitch is used once, in the hook.
- **Pacing:** fast in the montages (C: 0.9 s average; FPS shots 0.48–1.04 s). Slow where content moves inside the frame (E: 2.9 s; up to 4.3 s). Long takes appear at the edges of sections (#9 5.0 s, #23 5.6 s). Two black beats (1.16 s and 2.5 s) mark the act breaks.
- **Type hierarchy:** (1) the brand lockup (brush glyph + serif small caps), at 15.9 s and as text at 74.3 s; (2) end cards (serif small caps, then a sans wordmark); (3) the category label chip: ▲ + monospace caps, dark translucent or white, yellow corner brackets, placed bottom-left mostly (bottom-right or centre when content needs it); (4) diegetic UI copy. The film adds no headlines of its own.
- **Label reveal:** a small solid block flickers through cyan, white and yellow for ~0.2 s, then the letters decode in random order for ~0.25–0.4 s (≈0.5 s total). It appears 0.3–1.1 s *after* the cut, never on the cut frame, and stays until the next cut.
- **Sound design:** music and SFX only. faster-whisper small with VAD found 0 speech segments; without VAD it produced only one hallucinated "You" at 90–92 s (no_speech_prob 0.76). Integrated loudness is **-10.6 LUFS**, LRA 8.9 LU, true peak **+1.8 dBFS** (decoded Opus, over 0). Short-term loudness: -6 to -8 LUFS in 14–30 s, -13 to -15 in 56–62, -17/-18 at 72–74 (the hush before the name), -12 to -16 in the finale. Tempo estimate is 129.2 BPM (~0.465 s/beat), steady 20–72 s.
  Events: silence and clicks 0–1.4; glitch hit 2.37; airy drop 4.68; full entry 6.8; shimmer at the logo 15.9; riser 18–19.5; sub drone in the black 19.9–21.1; **drop 21.13 (largest onset)**; filtered top end 41–43.3, opening on the future city; loudest 48–52; gap then hit 62.3/62.51; thinning 70–75 with near-silence 74.5–75.2; slash 75.3; final hits 89.9 and 91.77, then decay.
- **Cuts vs music:** only 18/49 cuts fall within 80 ms of a tracked beat, about chance (random baseline ~35%). 26/49 fall within 60 ms of an onset (random ~39%). So the editor cuts **on sound accents, not on a strict beat grid**, and every act change sits on a big hit (21.08, 75.6, 89.88).

## 5. Coverage matrix: our 12 scenes vs the reference

| Our scene | Comparable reference moment(s) | How we match | How we exceed |
|---|---|---|---|
| 01 Impossible Hook: turbine to vertices to code to prompt terminal | 0.2–4.68: prompt on CRT, code glitch, statue out of code (#2–#5) | same promise in under 5 s: "a prompt makes a world"; land the terminal on a hit | the reverse direction in one continuous take: the *same* vertices become glyphs, then the prompt (no datamosh, no cut); prompt readable at least 0.8 s, not 0.36 s |
| 02 Model Reveal: luminous sphere, moonlight terminator, lockup | logo card 15.88–17.95 (#10); moon 81–83 (#39); title scramble 70.9–75.6 (#36) | reveal within 0.5 s, hold the lockup 2 s+, entry on a shimmer/hit | the terminator sweep *is* the reveal (light uncovers the wordmark), which is more motivated than a fade over a plate |
| 03 Intelligence Engine: compute module, document stack into context grid, "3T-class", "1M tokens" | no equivalent; closest are Paper Tide stacks (#33) and the card collage (#35) | density reads as scale; one label chip per idea | the reference explains nothing; we make the numbers instruments (counters on the grid) tied to verified claims |
| 04 Coding becomes creation: editor, code to edges, working Three.js gear world | terminal to world (#3–#5); window carousel (#27–#34) | finished artefact shown *running*; consistent window container | causal continuity: code lines extrude into the gear edges inside one shot, where the reference cuts from terminal to result |
| 05 3D engineering lab: CAD jet engine, sketch to wireframe to solid to exploded | cathedral final-vs-clay split (#23); "Every single part / 1,153" (#28); scatter-to-assemble arm (#29) | split-screen process vs result; staged component groups; diegetic part counter | four explicit stages with clean stage labels, and an exploded view that re-assembles on the beat |
| 06 Human simulation: musculoskeletal figure, initial vs improved gait split | split-screen grammar (#23); character physics in parkour (#22) | same camera and timing on both halves | a measured comparison: synced gait cycles, step markers, honest labels; the reference has no before/after |
| 07 Financial research: documents to cells to model to charts | none (finance appears only in the YouTube description) | label chip and window container for continuity | entirely ours; a full pipeline told in one move |
| 08 Long-horizon agents: PLAN to SEARCH to BUILD to TEST to DEBUG to REVIEW to DELIVER | running clock 9h53m to 11h28m on the CRT (#2/#3) | a running clock as proof of duration | visible stage progression with light pulses along the graph edges (slash-arc energy idea, #40–43) |
| 09 Benchmark reveal: honest Terminal-Bench 4.0 bars | none; only diegetic counters (#15, #28) | numbers tick up like live instruments, label-chip style | a truthful zero-based axis and source line; the reference never shows a benchmark |
| 10 Highspeed: dual timelines | slow-mo x0.02 vs full speed (#14 to #15/16); speed blur | contrast slow vs fast in adjacent beats | both timelines in one frame, same start mark, so the gap is measurable |
| 11 Open-weight: cube unfolds into pathways | none; nearest is the window-to-collage expansion (#35) and exploded parts (#28–29) | one object opening into many | the unfold carries meaning (weights become routes), which is clearer than a collage |
| 12 Creator payoff montage + end card | genre montage 21–35.6 (#13–22, 0.9 s average); collage (#35); end cards (#45–46) | 0.5–1.0 s shots on hits, black beat before, card 1.7 s plus a 2 s sign-off | the montage is built from *our own* scenes, so it pays off what the viewer has seen; the end card states availability and "independent, not affiliated" |

## 6. Craft lessons (most useful, concrete)

1. **Hook in under 5 s, one readable line.** The prompt is the only copy, and it is followed by the result appearing. Give our prompt at least 0.8 s of readability; theirs (0.36 s) is too short for a VO-led explainer.
2. **Hero-word hold 1.2–2.2 s.** Logo card 2.07 s (fade-in ~0.45 s); resolved "KIMI K3.1 PRO" ~1.2 s; end cards 1.67 s and 2.16 s.
3. **Use black as punctuation, twice.** 1.16 s black with a sub drone before the biggest hit (montage start), and 2.5 s black plus a ~1 s fade-up before the finale.
4. **Pace by internal motion.** Cut fast (0.5–1.0 s) when shots are static or similar, and hold 3–4 s when the content moves by itself (scrolls, orbits, assemblies). Overall average ≈1.9 s.
5. **One label system for every demo.** ▲ + monospace caps, corner brackets, a block-cursor flicker then a ~0.5 s decode, entering 0.3–1.1 s after the cut. It inverts on light backgrounds. Build ours in our own design, with the same discipline.
6. **Cut on sound accents, not a beat grid.** Measured: cuts track onsets better than beats. Following CLAUDE.md, take cut points from our *measured* track onsets, and put act changes on the largest transients.
7. **Motivated wipes over effects.** Use clouds, fog, exhaust, wings or a blade crossing the lens. Glitch once at most.
8. **One container unifies mixed looks.** Identical windows over one soft plate, a horizontal carousel (~0.5 s), then a pull-back into a collage, then clear to empty for the title.
9. **Numbers are diegetic and alive.** Counters tick every frame inside gauges, the parts count sits in the UI, and a clock jump implies duration. For our VO film, numbers should animate as instruments in the scene, synced to the word that says them (wordOf/lineOf), not as stat slides.
10. **Mix with dynamics, but deliver cleaner.** They run hot (-10.6 LUFS, +1.8 dBFS true peak) and duck to about -18 LUFS short-term before the name reveal. Keep the dip-before-reveal shape, but master to our own target with true peak at or below -1 dBTP.
