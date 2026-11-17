# MASTER PROMPT — SOFTWARE ENGINEER: THE LIFE BEHIND THE SCREEN
## TechpeTrek | Cinematic developer-life film | Claude Code / Opus 5.5

> Paste this entire file into Claude Code inside the existing motion-studio repository. Deliver a real, editable, technically valid, beat-synchronized film—not a speculative pitch deck.

## 0. MISSION / THE FILM

Act as a world-class film director, documentary cinematographer, editor, sound designer, motion-graphics engineer, software developer, and Remotion/HyperFrames compositor. Produce an exceptionally realistic, visually addictive **100-second, 9:16, 1080x1920, 60fps** portrait of a software engineer's life. The final feeling is **quiet, earned aura**: disciplined mornings; commute; team standups; serious deep work; architecture discussions; healthy food and recovery; code commits and CI; a real production incident; deliberate rollback and recovery; deployment; competitive-programming practice; international travel/remote-work atmosphere; and, finally, a deliberate, satisfying **LOG OFF**.

This is NOT a bland productivity video, random keyboard montage, cyberpunk hacker fantasy, motivational text slideshow, or one hundred seconds of AI-generated fantasy footage. It is grounded in the details of how real developers work, augmented by sophisticated physically motivated transitions and restrained technical visualization. Build a coherent week-in-the-life narrative, rather than falsely presenting an international trip and multiple days of work as occurring within a single day.

Story proposition: **"They see the code. They don't see the life behind it."** The opening is an emotional cinematic hook; the midsection becomes kinetic with the music; the crisis introduces tension; the travel and log-off supply the emotional resolution. This is a music video, so no continuous narration. Use only minimal diegetic speech snippets and highly selective caption cards.

## 1. READ / AUDIT ALL AVAILABLE INPUTS FIRST

- Audit the local repo and inspect its `package.json`, source trees, reusable motion components, available skills, installed tools, UI renderers, audio-analysis tooling, FFmpeg configuration, and existing compositions. Preserve the user's codebase. Avoid reinstalling what already works.
- In `assets/audio/` locate the **user-supplied** `Sajan Sajan Teri Dulhan_320(KoshalWorld.Com).mp3` or the same audio under another explicitly supplied path. Do not assume it exists in Claude Code's environment merely because it was uploaded to a chat; request it when missing.
- Import `software_developer_journey_beatmap.json` as an editorial reference, if provided. This file was derived from the real upload. Treat automatic onsets as suggestions, not certified beats/downbeats.
- The user also mentioned **"Chandni Raat"**. No separate Chandni Raat audio asset has been supplied. Do not invent a mashup, synthesize the song, or claim an extra recording exists. The uploaded Sajan Sajan audio is the production master unless the user explicitly supplies another licensed track.
- Reference reels: https://www.instagram.com/reel/DfFVsFSK51L/ ; https://www.instagram.com/reel/DfKYJkyvqEH/ ; https://www.instagram.com/reel/DfCudFCN8eH/ ; https://www.instagram.com/reel/DfJxjv8TVmh/ . Inspect local downloaded references if legitimately supplied. If they are not accessible, do not pretend you analyzed their precise editing or reuse their content.
- The project must be executable even without generative video API access: use real footage, locally composited 3D/motion UI, and optional slots for Seedance-generated clips. Never fake a completed render.

## 2. MUSIC IS THE MASTER TIMELINE

Use the original uploaded MP3. The observed recording is 441.443 seconds long, with a significantly quieter first ~12 seconds, a noticeable energy rise around **12.5 seconds**, and a roughly **108 BPM** pulse estimate in the first 100 seconds. Independently validate the beat map by listening and inspecting actual onset, kick/snare, and phrasing. Do NOT hardcode 108 BPM as a universal constant or assume that beat trackers correctly identify bar one.

**Edit window:** source song `00:00.000–01:40.000` → film `00:00.000–01:40.000`, 6,000 output frames at 60fps. If the platform requires a different cut length, preserve the 12.5s reveal and rebuild timings against the chosen phrase, rather than arbitrarily chopping the end.

First 12 seconds: restrained, detail-rich cinematic introduction. At approximately 12.56 seconds: the first energetic run of clean, on-beat cuts. Critical events later should land on independently checked phrase accents, not random 1-second intervals. Use the provided JSON to snap target scene boundaries to nearest validated beat *without* breaking narrative continuity. Store final beat markers in `src/data/beat-grid.ts` or a machine-readable companion file.

No generated singing or re-recorded lyrics. Music rights for public use must be verified separately; user possession of the MP3 is not publication permission. If the finished reel is intended for Instagram and platform music tools support it, a music-in-app final version may be needed.

## 3. CAMERA / REALISM / MAIN CHARACTER

One consistent protagonist: the same adult developer, facial identity and hairstyle based on user-supplied reference photos or licensed self-shot footage. Across footage generations preserve facial details, skin texture, wardrobe continuity, workstation geometry, hand anatomy, and realistic walking/typing. Never assume a random stock person is the real creator.

Camera: real filmic language—24mm city establishing, 35mm shoulder orbit, 50mm human dialogue, 85mm eye/hand compression, 90–100mm macro keycaps/USB/coffee/phone; selectively use handheld micro-movement, stabilized arc dollies, focus pulls, motivated whip pans, reflection match-cuts, and correct parallax. NO constant fisheye, impossible hand distortions, purposeless 3D spinning, or fake glowing "hacker" terminals.

Location/look: beautiful morning daylight, London-style metro geometry, a warm Berlin-inspired cafe, expressive Tokyo/Shinjuku night exteriors, airport/airplane window vistas. These are **atmospheric international B-roll options**. If footage is stock rather than actual user travel, don't caption it as verified footage of the user or imply it was the same location/day. Use the international segment as a later workweek/travel chapter.

Grade: warm pale-gold daylight; deep charcoal and controlled cobalt-blue screens; cinematic steel shadows; warm natural skin; reflective rain at night; restrained lavender/orange highlights. Texture: real camera grain, natural highlight roll-off, credible optics, soft window light, accurate shadows. Avoid gratuitous neon, artificial skin smoothing, AI hallucinated text, and cluttered overlays.

Text rules: less than 6 words per major card; maximum 1–2 simultaneous cards; professional editorial fonts, perfectly typeset in code; text must never cover key facial expressions or important UI. Use safe areas for Instagram's top/bottom overlays. Consistent footer identity `TECHPETREK`, small bottom-right at ~75% opacity when appropriate, not every second.

## 4. SCENE-BY-SCENE DIRECTOR'S SCRIPT (100 SEC)

### 01 | 00:00–00:04 — COLD OPEN: THE REFLECTION
Sound: original song's quiet lead-in; natural ventilation, a faint city hum, single close-miked key click.
Image: BLACK → one monitor reflection appears inside the developer's eye. With a macro focus pull reveal a real face at a desk, then a precise camera drift across glass that shows soft code reflection. The world feels hushed. A single line enters on a natural breath: **"THEY SEE THE CODE."** No digital explosions. Hook through immediate photographic quality.
Transition: the eye reflection becomes a dawn horizon in the room window.

### 02 | 00:04–00:08 — DISCIPLINE BEFORE THE SCREEN
A sunrise creeps across the apartment. Alarm silenced. Feet touch the floor. Water poured into a glass. Quick shot of comfortable running shoes / stretch. A genuine nutritious breakfast prep detail, not influencer product placement. Close shots of water droplets, fabric, sunlight and hands. Two to three shots, each with character and tactile Foley.
Transition: the circular drinking-glass rim matches a metro door window.

### 03 | 00:08–00:12.56 — PRE-DROP BUILDUP
Developer packs their laptop; puts on headphones; walks through a city street as a train approaches. Camera tracks low behind their shoes, then rises in a smooth shoulder-level orbit. Train-door closing becomes a single sharp visual threshold. Slowly introduce minimal typography **"NOT THE LIFE BEHIND IT."** As the beat arrives, cut from a door seam to a central vertical cursor on the monitor. Peak should land at measured ~12.56s.

### 04 | ~00:12.56–00:20.35 — THE COMMUTE / ENERGY RELEASE
The montage suddenly becomes fast and musical: train escalator → street crossing → bike wheel → laptop on commute → sunrise across modern office windows. Use London urban commute imagery and natural motion as the foundation; optional Tokyo city insert later for international contrast. Edit to four- and eight-beat phrases and accents. Match-cuts: metro handrail curve→coffee mug handle; footfall→mouse click; city transit grid→monitor grid. 3D overlay is limited to a subtle traced metro-route line that turns into the office's network connection, not a fictional teleport.
Text: **"COMMUTE. CONNECT. CREATE."**

### 05 | ~00:20.35–00:28.34 — STANDUP, CALLS, MEETINGS
Fast establishing office. Over-the-shoulder video call with credible remote participants; one realistic standup agenda: `Yesterday / Today / Blockers`; a calendar handoff; design review comment. Cut on keyboard mutes and headset clicks. Show genuine collaboration: listening, nodding, explaining one design, making note, follow-up task. Not all scenes are smiling zoom grids. Optional micro-dialogue in the mix: **"Morning, team."** / **"I'll take the API change."** / **"Let's ship safely."** Keep it subordinate to music.
3D transition: a single video-call tile rotates slightly and becomes the real editor window—do not render unreadable fake text.
Text: **"MEET. ALIGN. EXECUTE."**

### 06 | ~00:28.34–00:39.60 — DEEP WORK / THE FLOW STATE
THIS IS THE FIRST SIGNATURE AURA SET PIECE. Over-the-shoulder at real IDE; terminal compiles; split pane reveals tests; close-up fingers typing with extremely crisp, velocity-sensitive mechanical switch sounds. Camera makes a beautifully controlled 170–220-degree orbit from face to keyboard to monitor, passing the actual desk foreground. Genuine code appears as clean post-produced screen inserts: a TypeScript/React API integration, request validation, unit tests and git diff. No matrix rain. A sophisticated but restrained motion graphic extrudes the function call into a three-layer architecture diagram for 1.5s before landing back on real code.
Matched micro-transitions: `Enter` key depression→command executes; scrolling code→passing building reflections; IDE cursor→bright window mullion. Show 1-second concentration pause after a hard debugging moment.
Text: **"BUILD THE THING."**

### 07 | ~00:39.60–00:47.55 — SYSTEM DESIGN / EXPLANATION / REVIEW
Wall whiteboard, architecture diagram, quick colleague discussion, PR code review. The architecture diagram briefly becomes an elegant genuine 3D stack of `Client → API → Queue → Worker → Database`, connected by physically plausible moving packets. Never pretend the visual is a live production topology unless it is from an actual sample project. Show reviewing feedback and updating code. Close with PR status `Changes requested` → later `Approved` to communicate iteration rather than instant AI magic.
Transition: a sketched whiteboard arrow becomes the handle of a fork.
Text: **"THINK. DISCUSS. REFINE."**

### 08 | ~00:47.55–00:54.28 — FOOD / HEALTH / RESET
This matters: developers are human, not perpetual caffeine machines. Natural daylight on balanced lunch, laptop closed for the meal, walking break, water bottle, stretching wrists/shoulders, two shots of outdoor greenery. The beat remains alive but edit relaxes for 1 bar. Detail Foley: ceramic plate, fork tap, footsteps, breath. No unrealistically perfect lifestyle perfection. One small authentic moment of fatigue with a smile on return.
Transition: a fork's curved reflection becomes the arc of a CI pipeline indicator.
Text: **"REFUEL THE HUMAN."**

### 09 | ~00:54.28–01:05.45 — CODING → TESTS → COMMIT → CI
The second signature developer payoff. Concrete, credible sequence: bug report → branch `feat/api-validation` → implementation → unit tests passing → git diff → commit → pull request → CI jobs `lint`, `test`, `build`, `integration` completing. Show meaningful failure and correction briefly; no implausible instant zero-error production changes. One temporary 3D visualization: successful jobs travel down a realistically labeled pipeline like physical dominoes, snapping into a final clean deployment artifact. Create UI as composited, readable vector text, not generator-supplied gibberish. Keyboard sounds become a tightly gated percussive layer under the song.
Text: **"CODE. TEST. REVIEW."**
Transition: the successful build badge becomes an ominous red status light.

### 10 | ~01:05.45–01:16.34 — PRODUCTION INCIDENT / ESCALATION
The film's dramatic turn. A monitoring dashboard reads believable numbers with a sudden rise in 5xx errors and p95 latency, a phone notification lights the developer's face, an on-call team convenes. Show escalation as calmly effective, not panic theater. A production graph stretches from the screen into the environment for one carefully executed 3D moment. The developer checks logs and recent deployment, communicates in a channel, decides to pause rollout or rollback, tests a patch. The music narrows with a short gated silence on a human decision, then surges.
Diegetic speech, optional: **"Errors are climbing."** / **"Rollback first."**
Code/editor text examples: `HTTP 503`, `p95 850ms`, `Rollback started`, `Incident acknowledged`. Use fictional/example data with no actual secrets or company names.
Text: **"WHEN PROD CALLS."**

### 11 | ~01:16.34–01:24.26 — THE RECOVERY / DEPLOY
Rollback stabilizes the graph. A fix is reviewed and tested, then a staged deployment begins. Close view of typing; click `Deploy to staging`, validation, approval, progressive production rollout, monitoring checks. Render three unmistakably real statuses: `BUILD PASSED`, `DEPLOYED`, `HEALTHY`. Do not skip all checks. Camera races through a restrained 3D CI pipeline and emerges through the actual monitor into the room; dramatic but technically purposeful.
Text: **"BUILD. SHIP. OBSERVE."**

### 12 | ~01:24.26–01:31.40 — COMPETITIVE PROGRAMMING / LEARNING
After work, one focused personal practice session. Screen shows a real-looking graph shortest-path problem; a notebook sketches a graph, priority queue, and Dijkstra traversal; short flashes of actual code, timed tests, `Accepted` after iteration. Avoid pretending the protagonist solved a hard problem instantly. Cut rapidly between pen tip, brow, keyboard, IDE, timer, final acceptance. Use tasteful neon-outline graph edges for one dimensional transition, then return to actual footage.
Text: **"NEVER STOP LEARNING."**

### 13 | ~01:31.40–01:36.65 — TRAVEL / THE WORLD OUTSIDE
Temporal shift to a different day/week. Passport-safe, non-identifying shots: suitcase wheel, airport architecture, runway light, airplane wing at sunset, rainy Tokyo side street or London/European street details, a cafe window looking onto a new place. Include a brief laptop-on-cafe desk only if the story shows deliberate remote work, not work invading every vacation. Stock material is atmospheric, not a false claim of the creator's actual travels. Slow elegant camera flow contrasts with the coding rush. Colors become warm and open, music continues.
Text: **"MORE THAN THE SCREEN."**
Transition: airplane window ellipse→laptop screen/cafe window of the now familiar character.

### 14 | ~01:36.65–01:40.00 — LOG OFF (THE EMOTIONAL PAYOFF)
Return to the SAME developer identity and same workstation. A simple, credible desktop shows work done and no intrusive notifications. Their hand leaves the keyboard, moves the cursor to log off / closes the editor, then closes the laptop or turns off the main monitor. No corporate app UI needed. An authentic physical keyboard's final `Enter` keystroke hits the last strong musical accent. Sudden quiet room tone. The glowing screen fades to black but city lights remain reflected in the glass; actor takes a breath and walks away. Clean two-beat end card: **"LOG OFF."** then very small **"TECHPETREK"**. Consider a loopable reflection of the opening eye/monitor with no added ending speech. No cheesy motivational quote.

## 5. THE REALISTIC SCREENPLAY / TEXT SCRIPT

This film deliberately has almost no conventional narrator. Its script is cinematic imagery plus compact editable text:

- 0–12: `THEY SEE THE CODE.` / `NOT THE LIFE BEHIND IT.`
- 12–20: `COMMUTE. CONNECT. CREATE.`
- 20–28: `MEET. ALIGN. EXECUTE.`
- 28–39: `BUILD THE THING.`
- 39–47: `THINK. DISCUSS. REFINE.`
- 47–54: `REFUEL THE HUMAN.`
- 54–65: `CODE. TEST. REVIEW.`
- 65–76: `WHEN PROD CALLS.`
- 76–84: `BUILD. SHIP. OBSERVE.`
- 84–91: `NEVER STOP LEARNING.`
- 91–96: `MORE THAN THE SCREEN.`
- 96–100: `LOG OFF.`

Do not show every card for the whole scene. Show 6–8 of these at precise impact points; let the other actions speak visually. Do not put a long voiceover over Sajan Sajan. Optional snippets: `Morning, team.` / `I'll take the API change.` / `Errors are climbing.` / `Rollback first.`. Mix as short diegetic accents only.

## 6. SIGNATURE TRANSITION DESIGN

Every transition needs a plausible motivation and exact source/target composition:

- Eye reflection → sunrise window.
- Drinking-glass rim → metro-window ring.
- Metro door seam → IDE cursor, timed to the 12.5-second musical entry.
- Escalator handrail → coffee cup handle.
- City street grid → office display grid.
- Video-call tile → real IDE panel.
- Enter key depression → terminal action.
- Function call → 3D service diagram → real code.
- Whiteboard arrow → fork curve.
- Fork reflection → CI job arc.
- Passing CI check → red incident notification.
- Monitoring p95 line → architectural wireframe.
- Green health graph → airplane horizon.
- Airplane window → cafe/workstation glass.
- Final keyboard Enter → screen off.

Choose perhaps 8 primary transitions and 6 restrained cuts. Do not perform a showy morph every two seconds. Better to leave longer 0.8–2s unbroken shots than build nausea-inducing transitions. Use motion continuity, position matching, exposure, and exact frame-locked easing.

## 7. STOCK / INTERNATIONAL FOOTAGE / IDENTITY

Source real, properly licensed clips first. Suggested locations and mood:

London metro / modern city commute; Berlin cafe / warm workspace; Tokyo rain-neon city exteriors; international airport and airplane window, skyline at golden hour.

Prioritize verified Mixkit Free License or Pexels usable clips, and Unsplash free-license stills. Keep a manifest with source URL, creator, license, crop, FPS, resolution, duration, and attribution obligations for EACH asset. Verify the exact license before publishing; do not claim every clip is commercially reusable. Never pass off stock actors as the actual developer. For protagonist close-ups and distinctive travel shots, record real footage or use the user's consistent identity references in authorized generative-video tools.

If using **Seedance**: generate short, independent reference-guided shots—ideally 4–10 seconds for high consistency—with separate camera, action, lighting, and continuity prompts. Reference the same actor identity photo and wardrobe/room set across clips. Use end-frame/start-frame references to preserve continuity when the service supports it. Do NOT use Seedance to generate exact readable code, GitHub PRs, console logs, or product logos; screen-replace in post.

Seedance-ready clips worth requesting: `macro reflection face to sunrise`, `morning apartment and water glass`, `metro platform orbit`, `office over-the-shoulder focused typing`, `human standup meeting`, `healthy lunch cinematic close-up`, `dramatic late-night incident reaction`, `end-of-day screen-off logoff`. Use stock for international cities, airport, airplane, street and train coverage wherever real footage is stronger.

## 8. EDIT / SOUND EFFECTS / MIX

Build clean audio layers: A1 uploaded music master; A2 carefully isolated switch/keycap/spacebar/Enter sounds; A3 mouse scrolls/clicks; A4 rail door, metro/train rumble, footsteps, street ambience; A5 cup/glass/plate and food Foley; A6 call room tone/notification; A7 subtle notification, alert, successful build/deploy and screen-off sounds; A8 transitional whooshes only where motivated.

Keyboard texture is a signature motif. Record or source multiple switch timbres (soft typing, rapid typing, single return key, space bar, keycap rattle), place individual one-shots in rhythm, and use velocity variation; don't paste one unbroken mechanical-keyboard loop over everything. Keep music vocals intelligible and avoid masking. Use EQ, gain staging, small ducking around selected Foley, clean fades, and true-peak checks; no excessive limiter pumping or clicks at edit points.

Music is never restarted between scenes. Avoid a constant fake whoosh at every cut. Use a silence pocket at the incident decision and a final actual computer-power-down click at log off.

## 9. ENGINEERING / REMOTION / HYPERFRAMES ARCHITECTURE

Use the existing codebase's actual capabilities. If missing, implement modular components with frame-exact `seek(t)`, seeded randomness, spring/easing, camera transforms, custom shaders only when needed, caption safe areas, compositing masks, time-remapping, audio waveform events, and codec compatibility.

Suggested structure:

`src/compositions/DeveloperLife.tsx`
`src/scenes/01-ColdOpen.tsx` ... `14-LogOff.tsx`
`src/components/CinematicType.tsx`
`src/components/MatchCut.tsx`
`src/components/CodeScreen.tsx`
`src/components/CameraArc.tsx`
`src/data/beat-grid.ts`
`assets/audio/`, `assets/footage/`, `assets/stills/`, `assets/foley/`
`renders/contact-sheets/`, `renders/preview/`, `renders/final/`
`docs/asset-manifest.md`, `docs/music-cue-sheet.md`, `docs/continuity-bible.md`

Frame discipline: 100 seconds × 60fps = 6000 frames. Exact cut times derive from soundtrack event/phrase markers; scene boundaries above are targets, not rigid musically ignorant timestamps. Make frame-accurate deterministic animation so `seek(frame)` renders a reproducible frame. Any external footage FPS mismatch must be normalized or interpolated appropriately without changing action speed. Keep complex compositing performance manageable by pre-rendering expensive 3D / shader passes. Never use inaccurate AI-generated code text where viewers can zoom in.

Color/QC: consistent skin; no flicker; no shifting wardrobe; no melting anatomy; no phantom fingers; no bent laptop geometry; no nonsensical CLI errors; no confidential info; no random names; no unreadable overlays; no sudden geography changes presented as continuity; no fabricated screen successes.

## 10. SEEDANCE PROMPT TEMPLATE (ONE PER LIVE-ACTION SHOT)

`Create a hyperrealistic, camera-believable 6–9-second vertical 9:16 cinematic shot. Reference image 1 is the SAME adult protagonist and must preserve facial identity, hairstyle, skin texture, physique and wardrobe. Reference image 2 is the same workspace/location or the selected licensed location reference. Scene: [one clear human action]. Camera starts at [lens/angle], follows [one physically plausible dolly/orbit/tilt with direction and speed], ends with [precise end-frame composition used by the next shot]. Lighting: [time of day / key, fill, practicals]. Motion: realistic breathing, hands, reflections, parallax, shadows and prop weight. No dialogue/music generation, no text/logo/code rendering, no sudden location or face changes, no cuts within the shot, no unrealistic physics or body distortion. Output photoreal source material for later screen replacement and editorial compositing.`

Create distinct shot prompts by filling this template from the director's storyboard, not one generic prompt for all scenes.

## 11. PRODUCTION ORDER / GATES

Gate A — REFERENCE: Inspect available original Instagram files if provided, source licenses, audio, user image references, codebase capabilities.
Gate B — MUSIC: Confirm original 12.5s entrance; create beat/onset/phrase grid; choose frame-accurate cuts.
Gate C — STORYBOARD: 14 scenes; one keyframe each; actor/wardrobe/location continuity bible; transition A/B endpoint diagrams.
Gate D — ASSETS: Fetch verified licensed footage; select stills; generate only missing actor close-ups; label stock accurately; create real screen captures or coded UI composites.
Gate E — PREVIS: Low-resolution 100-second storyboard animatic with the real song, no fake proof of completion.
Gate F — RENDER: Compositing, 3D accent passes, UI overlays, screen track/replacements, time-aligned sound effects.
Gate G — QA: Sample key frames at every cut; face/hands/wardrobe; verify that CI/prod story is logically consistent; inspect audio phase and peaks; check mobile readability; validate final frame count 6000.
Gate H — DELIVERY: Final H.264 MP4, editable Remotion/HyperFrames source, cue sheet, scene contact sheet, beatmap, music/asset manifest, and optional 30-second teaser cut.

Do not claim the full video is rendered until a real export exists. If assets are missing or external generation isn't available, deliver the actual compositor plus clearly labeled placeholder slots and concrete missing-asset list.

## 12. FINAL DIRECTOR'S BRIEF

**This reel must feel photographed, not hallucinated.** Never allow flashy typography or motion graphics to replace the human story. Show the work developers actually do: communication, logic, design, testing, mistakes, review, incident response, deployment and learning. Show that they also eat well, move, breathe, travel and deliberately disconnect. The highest-aura moment is not a fake hacking glow: it is the calm rollback decision, the verified healthy deployment and the final hand lifting away from the keyboard.

Final emotional signature: **"THEY SEE THE CODE. NOT THE LIFE BEHIND IT. ... LOG OFF."**

Build the complete project now, subject to real available files and capabilities.

---

## APPENDIX A — READY-TO-PASTE SEEDANCE LIVE-ACTION SHOT PROMPTS

These are individual source-shot prompts. Generate separate clips instead of asking one video model to produce the whole reel. Use the SAME reference identity, wardrobe palette and character bible; capture natural, unobtrusive production audio only. Timing to the exact song happens later in the compositor.

### A1 — OPENING EYE / WINDOW HOOK (4–6s)

`A feature-film-quality vertical 9:16 live-action image-to-video shot using the provided portrait as the exact facial identity reference. Interior: a realistic, architecturally beautiful European-style apartment/home-workspace before sunrise, soft navy blue ambient light and a distant city outside the window. Begin with an extreme 100mm macro of the protagonist's focused right eye, with a believable tiny, soft reflection of a real computer monitor in the cornea. The camera makes a slow 25cm lateral dolly to the left and gentle rack focus, revealing natural eyelashes, skin pores and the cheek while preserving the face. The protagonist blinks, takes a thoughtful breath and turns slightly toward the window. End with the window edge and first muted gold sunrise visible beside the face; hold this exact framing for an editable match cut into the sunrise establishing shot. One continuous physical take, real light transport, realistic facial anatomy and micro-movements, no sudden face change, no floating holograms, no dialogue, no typography, no music.`

### A2 — DOOR SEAM TO THE BEAT (6–8s)

`Vertical 9:16 polished live-action city-commute sequence, reference-guided same actor and clothing, contemporary London-style metro architecture on an ordinary weekday morning. Realistic face, coat texture and human crowd behavior. Begin as a waist-height stabilized tracking camera follows the protagonist walking toward a subway car carrying a backpack, sun streaking between station pillars. The camera curves from rear three-quarter right to a front-side profile, tracking shoulder movement and physically believable parallax. Train doors close in the background; end with the two vertical door edges converging into a razor-straight central dark seam, filling frame cleanly. The final seam is a practical transition anchor that will match an IDE cursor on the 12.56-second musical impact. Real train station, no impossible architecture, no artificial speed ramp inside the generated clip, no text or UI, no dialogue or generated music.`

### A3 — DEEP WORK ORBIT (8–10s)

`Vertical 9:16 cinematic vérité portrait of the SAME developer from reference images in the SAME warm-modern workstation established in previous shots. Afternoon light from side window, softly blue monitor fill, warm practical desk lamp, one ultrawide screen and portrait secondary display. Start close on a mechanical keyboard: fingers move with realistic typing biomechanics and correct key depression, no extra fingers. The camera travels on a precise, smooth 170-degree clockwise curved dolly/orbit around the seated developer, glancing past the moving fingers, to a profile of their concentrated face, then behind their right shoulder. Finish with an over-the-shoulder view of the primary monitor, its screen mostly an uncluttered dark surface suitable for real IDE screen replacement. Strong correct desk parallax, natural 35mm lens perspective, sophisticated shoulder blocking, one shot with no cuts. No generated readable code. No fluorescent hacker fantasy, no glitch overlays, no costume shifts, no speech/music.`

### A4 — CALL TO WHITEBOARD (6–8s)

`Vertical 9:16 photoreal workplace collaboration moment. The same protagonist listens carefully to a remote software standup at a beautiful but practical engineering office. Begin over their left shoulder with believable teammates on a laptop call; avoid readable software text, as real UI will be composited. Focus pulls from the blurred call monitor to the person's thoughtful face. They turn in the chair, stand, and approach a nearby clear glass whiteboard with a simple real marker-drawn system diagram. The camera follows a natural handheld-stabilized 40cm arc to keep the subject framed. End close on the marker tip finishing one arrow line across the glass, so the moving line can match the 3D architecture line in post. The scene is calm, human, collaborative, detailed, plausible. No generic futuristic floating interfaces, no teleports, no impossible marker lettering, no dialogue/music.`

### A5 — PRODUCTION INCIDENT REACTION (8–10s)

`Vertical 9:16 premium grounded workplace thriller shot, SAME person, SAME desk and monitor arrangement now at dusk. The developer is working with measured concentration. A restrained notification glow from a primary monitor illuminates the face. Their expression changes subtly to concern, never a theatrical jump scare. Start with a 50mm tight profile, then perform a smooth, physically believable camera push past the shoulder into the monitor. The actor quietly picks up headphones, sits upright and begins typing with decisive intensity. City lights and fading daylight visible outside the same window, believable lighting continuity, realistic hand motion, slow changing breath and micro-expressions. End with the monitor occupying most of frame for insertion of a REAL compositor-created incident dashboard. Do not generate actual alert labels, company names, confidential text, or fake code. No huge red explosions, no invented random UI, no music/dialogue.`

### A6 — FINAL LOG-OFF (4–6s)

`Vertical 9:16 cinematic human ending shot, SAME person and exact recognizable workstation, city night outside window. Begin over-the-shoulder with the developer seated, a successful finished-work mood conveyed through quiet body language rather than overt celebration. Their hand makes one final precise keyboard keypress, then rests. The camera gently tracks from the keyboard to the face at three-quarter profile. A subtle relieved smile, a long exhale. They press the laptop power/sleep control or close the lid naturally. The monitor illumination fades, leaving warm amber desk-lamp light and deep city bokeh. The person stands and moves just out of focus toward the room door. End with a near-black screen reflection and a few natural city lights, clean negative space for `LOG OFF.` title in post. No generated words, no impossible limbs, no sudden camera orbit, no added music, no drama, absolutely believable human performance.`

## APPENDIX B — FAST START COMMAND TO RUN WITH THIS FILE

`Read SOFTWARE_ENGINEER_AURA_MASTER_PROMPT.md and first inspect the actual repository and all supplied media assets. Create a brief ASSET AUDIT, a beat-aligned 100s shot/transition plan from the supplied MP3 and JSON, and a local low-res animatic. Then implement the compositing project scene by scene, using only available validated footage; preserve missing-footage placeholders and list their exact required shots. Do not fake renders, asset downloads, video-generation credits, or software capabilities. On each iteration show the resulting contact sheet, verify continuity and audio timing, and export only after checks pass.`
