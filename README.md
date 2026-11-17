# Motion as Code

Instagram reels, explainers and interactive web apps made entirely in code, with Claude Code, for **Tech पे Trek**. There's no After Effects and no timeline editor. Every frame is a pure function of time, every cut comes from measured data (voice word timings or a song's beat grid), and every video re-renders from source.

> This README and `.gitignore` are kept up to date as projects are added.

---

## What's in the repo

| Path | What it is |
|---|---|
| `app/` | The **pdoom-video engine** (by mexicat, MIT; see `LICENSE.pdoom-engine`) plus all the "plates" (scenes) for the engine-rendered reels. `app/src/engine/` is the engine itself and stays untouched; scenes live in `app/src/scenes/`, and `app/src/timeline.ts` maps each variant to its scenes. |
| `analysis/` | Python: voice-over generation and word alignment, music scores, foley/cue sheets, mixing (−14 LUFS), cover frames and QA (`reel_qa.py`). |
| `data/` | Small JSON the reels are built from: word timings, beat grids, cue sheets, per-variant audio analysis. |
| `projects/` | One folder per reel or app, each self-contained: briefs, `FACTS.md` (sourced facts), captions, and its own source (Remotion, Vite or R3F). |
| `docs/` | Workflow notes and production write-ups. `TECHPETREK_MASTER_REEL_STUDIO.md` is the production contract every reel follows; the others are `TECHPE-TREK-WORKFLOW.md`, `JEV-EXPLAINER.md`, the Motion Flex notes, … |
| `kit/` | The Motion Flex prompt kit. |
| `colab/` | Colab notebooks for rendering without a local GPU. |
| `.claude/` | Claude Code setup for this repo. It has the `reel-pipeline` skill (every reel goes through it) and the `motion-studio` skill: the "Motion Studio in 20 Repos" stack (16 open-source tools, the studio brief and gates, 20 reel ideas, measuring scripts). It also has a prompt hook that loads both for any reel prompt. |
| `tools/motion-studio/` | The Node side of the motion studio: `render_html.mjs` (Puppeteer: HTML cards and UI to transparent PNGs, by state or by `window.seek(t)`), a card template, plus GSAP, Three.js and Tone.js. Run `npm install` here. |
| `CLAUDE.md` | The rules Claude Code follows in this repo (determinism, beat/word timing, stills before renders). |

---

## Projects

### Interactive apps

| Project | What | Run |
|---|---|---|
| `projects/aftercode/web` | **AFTERCODE: Face Dance Studio.** Your photo or selfie on a 3D avatar that dances to the beat: solo, duo, battle and crew modes, 8 worlds, CMU mocap and per-world song slots. Live at **https://aftercode-one.vercel.app** | `bun install && bun run dev` (port 54210) |
| `projects/server-siege/web` | **SERVER SIEGE.** A playable 3D system-design simulator: a deterministic backend sim (edge cache, load balancer, app instances, database, job queue, HPA-style autoscaler) drawn as a living server city, with 6 levels and the One Million Challenge. `bun test` runs the 12 sim checks; `?reel=1` is the seekable capture mode for its 68 s reel (`projects/server-siege`, Bro explains). Model and limits: `docs/SIMULATION.md` | `bun install && bun run dev` (port 54240) |
| `projects/engine-exe` | **ENGINE.EXE.** An interactive 3D four-stroke engine simulator: a generic, illustrative 148 cc air-cooled SOHC two-valve single. One model (`engineStateAt`) drives everything: the exact slider-crank, the cam at half speed, valve lift over the 0–720° cycle, and cam lobes generated from the lift curves. It has solid, cutaway, exploded and X-ray modes, isolation of 8 parts, a four-stroke lesson, a live dashboard and 720° chart, and an auto tour. Ignition and pressure are labelled illustrative. Built on the teardown skill kit; one offline file, `engine-live.html`. `node tests/kin.test.mjs` (15 model checks) and `node tests/sim.test.mjs` (27 GPU checks) write `docs/VALIDATION.md`. It is going into a reel: the tour film `engine-film` is the capture source | `node scripts/build.mjs`, then open `engine-live.html` |
| `projects/bridge-exe/web` | **BRIDGE.EXE.** An educational 3D bridge-design lab: drag a Pratt / Howe / Warren truss over a gorge, load it (deck, self-weight, truck, moving-load sweep) and a tested direct-stiffness solver gives deflections, member forces and reactions shown as lenses in the 3D world (A vs B, 5 challenges, city beam FE, cable-stayed concept, labelled arcade collapse with Rapier). `bun test` (14 solver tests), `bun tests/e2e.ts` (18 interaction tests), `python ../solver/crosscheck.py` (numpy + PyNite 3.2.1, ≤ 2e-11), IFC export via IfcOpenShell. `?reel=1` is the capture mode for its 70 s reel (`projects/bridge-exe`). Not a licensed engineer's design tool | `bun run dev` (port 54250) |
| `projects/repo-studio` | **ONE BOT, 16 REPOS: the quality benchmark for every reel (docs/BENCHMARK_REPO_STUDIO.md).** A news-flash reel (Remotion + @remotion/three, rendered natively in 3D): a rigged voxel rebuild of the Claude bot (fan-made, from `Assets/claude bot face.png`) stomps through the real public GitHub pages of the 16-repo motion-studio stack, magnifies each real star counter, and acts out each tool. Pages captured by `web/scripts/grab_repos.mjs`, facts from the GitHub API (`docs/repos.json`), Liam VO, original score | `npx remotion studio src/index.ts` |
| `projects/free-books` | **12 legally free tech books** video carousel (1080 x 1350, 14 slides) in the screen-review style: each book's real official page in a browser card, cursor + lime highlight boxes on the real chapters and the page's own proof that it is free, an original mascot. Pages + element boxes captured by `web/scripts/grab_pages_v2.mjs`, targets by `scripts/pick_targets.py` | `npx remotion studio src/index.ts` |
| `projects/binance-heist` | **JOB INTERVIEW SE $6 BILLION HACK?!** A 60 s Hinglish news explainer (Remotion + @remotion/three) of Binance's 3 Nov 2026 breach report. It is an illustrative 3D reconstruction: a procedural engineer at a desk (vendored zach-d-films rig), a live-canvas laptop and phone, the fake interview calls, an attack graph, and a vault of 520 instanced coins, 45 % of them iced (2.85 / 6.34). A lens magnifies the exact sentences on the live-captured report page (`web/scripts/grab_report.mjs`). The voice is Liam. The score is original (120 BPM C minor, synthesized tabla): `scripts/audio/mix_heist.py`. Facts are in `docs/factcheck.md`. The render command is `node scripts/render_heist.mjs --scale 0.5` | `npx remotion studio src/index.ts` |
| `projects/unslop-reel` | **AI WEBSITE SAB EK JAISI?!** A 60 s Hinglish reel (Remotion + @remotion/three) on unslop by Damir Sokolovsky (@heydamir, CC BY 4.0). It opens as slop (a 3D wall of five identical vibecoded screens, gradient text, emoji), redlines itself and turns into its own designed look. The hero is our real run of the unslop skill on the repo's own example (`unslop-story/story.html`), rendered by the skill's `story.mjs`. README sentences and the Daily Launch snapshot appear under a magnifier (`web/scripts/grab_pages.mjs`). Liam VO, original score (`scripts/audio/mix_unslop.py`); preview: `node scripts/render_unslop.mjs --scale 0.5` | `npx remotion studio src/index.ts` |
| `projects/dev-journey-sajan` | **DEV JOURNEY: CHANDNI RAAT TO SEV-1** A 19.6 s music-led reel (Remotion) built from the user's `DeveloperJourneyReel` spec. A calm photoreal dawn desk (kie.ai Nano Banana 2) types `morning_routine()` to the soft 'Chandni raat' part of the user's 'Sajan Sajan Teri Dulhan' remix. At 0:12 it crashes on the measured bass return of the 'Sajan' chorus into a SEV-1 server-aisle chaos: kick-synced Accepted, terminal and ESCALATION flashes. It snaps to black on a kick for `exit()`. One timeline (`scripts/audio/build_sajan.py`) holds the song edit, kicks and typed-key SFX. `mix_song.wav` (song baked) and `mix_ig.wav` (keys only; add the song in Instagram at 1:51.85); preview: `node scripts/render_dev.mjs --scale 0.5` | `npx remotion studio src/index.ts` |
| `projects/dev-life-aura` | **SOFTWARE ENGINEER: THE LIFE BEHIND THE SCREEN** A 100 s, 6000-frame music film (Remotion), built from the user's master prompt and beat map on their 'Sajan Sajan Teri Dulhan' remix. The beat map is verified and corrected (`scripts/audio/beatgrid.py`: it ran 49 ms early, and the bass drop at 67.488 s switches to an 82 BPM half-time grid). There are 14 chapters and 62 shots, every cut on a measured beat (`src/data/edit.ts`). The footage is 41 free Pexels / Mixkit-Free clips (`docs/asset_manifest.csv`) and an original fictional developer (Nano Banana 2 character sheet + start frames; Veo 3.1 Lite for the log-off). Every screen is code-built (`src/screens`), with 3D only where it explains (`src/viz`). The mix is the song plus synthesized Foley on picture events (`scripts/audio/mix_master.py`). Preview: `node scripts/render_film.mjs --scale 0.5` | `npx remotion studio src/index.ts` |
| `projects/paper-sajan` | **SAJAN: THE DEVELOPER'S AURA** A 25 s 2D-animation-style reel on the user's 'Sajan Sajan Teri Dulhan' remix (song 1:45.18-2:10.20, mastered to -14 LUFS), inspired by i.iz.jae's anime lyric videos. There are no generated images: real developer footage (free Pexels/Mixkit stock) is traced into hand-drawn line animation held on twos (`scripts/sketch_video.py`: XDoG ink, a cel-shaded figure from MediaPipe segmentation, a lime AURA rim). The figure is plain and grey until the song's breath, the aura ignites on the bass return, and it drains as the laptop closes into the song's silence: 'log off.'. Handwritten lyrics (Kalam, OFL) land on the vocal. Shots in `src/data/reel.json`; preview: `npx remotion render out/bundle AuraReel …` | `npx remotion studio src/index.ts` |
| `projects/bots-diwali` | **HAPPY DIWALI FROM THE BOTS** A 16 s 3D Diwali greeting (Remotion + @remotion/three, all code-built, no generated images). The Claude bot (a voxel build of Claude Code's pixel creature), GROK and MUSE (original stand-ins on the Grok Bot crew's rig: charcoal, and Meta-blue) and one felt Dots mascot walk up a lit street holding phuljhari. Rockets (peony, ring, willow, crackle), anaar, chakri, ladi and bombs go off around them: a deterministic particle engine in `src/world/fx.ts`. Each bot says 'Happy Diwali!' (ElevenLabs v3, four voices, STT-checked), then sparklers write 'Happy Diwali'. Original dhol + shehnai score and synthesized cracker SFX on the picture's clock (`scripts/audio/mix_diwali.py`) | `npx remotion studio src/index.ts` |
| `tools/claude-animation-skills` | Six reel animation skills by Artem Novitckii (MIT, vendored at commit 5dbea55): `/zach-d-films`, `/stick-figure`, `/map-route`, `/breakdown`, `/graph`, `/minimalistic-graphics`. Linked into `.claude/skills/` (junctions). Windows fixes noted in `VENDORED.txt` | `bash kit/setup.sh` (done); voice models: `bash kit/setup.sh --voice` (~1 GB, optional) |
| `tools/unslop` | **unslop** by Damir Sokolovsky (@heydamir, CC BY 4.0, commit a6f121e). This is the vendored Claude Code skill, linked as `.claude/skills/unslop`. It audits AI-looking UI, sets a direction, and fixes it in nine passes. `scripts/story.mjs` renders the square story video and needs `CHROME_PATH` on Windows (see VENDORED.txt). The credit is required in every copy and video | `/unslop this dashboard` |
| `projects/astra-exe/web` | **ASTRA.EXE.** A celestial-bow physics lab (R3F + Rapier) that fractures a floating mountain. Open-source copy: **https://github.com/Fayez-2403/Astra.exe** | `bun install && bun run dev` (port 54200) |

### Reels made with Remotion

**A new reel** starts as the full master-studio folder: `python .claude/skills/motion-studio/scripts/new_reel.py <slug> --title "..."`. That creates `projects/<slug>/` with `assets/` (git-ignored), `docs/` (brief, fact check, asset manifest, style guide, shot list, review log, …), a Remotion `src/`, `audio/`, `scripts/` (voice, score, beat analysis, asset check, contact sheets, render), `public/`, `post/` and `out/`.

Each of these has its own `package.json` and is a standard Remotion project. Run `npm install` in it, then `npx remotion studio` to preview, or use its `scripts/render.mjs` / `render_reel.mjs` to render.

| Project | Reel |
|---|---|
| `projects/aftercode/reel/edit` | AFTERCODE 70 s reel (captured from the app's `?reel=1` mode; the song switches at every mode change) |
| `projects/apple-m6-local-ai` | Apple M6 local-AI news reel (39 s, Module A of the master studio file; the first reel built as the full master-studio folder. Apple's press images and clip are not in the repo: see its `docs/asset_manifest.csv`) |
| `projects/paperpilot-local-pdf` | PaperPilot reel (55 s, PRODUCT_DEMO, 8 scenes from the user's storyboard): local Rust/WASM PDF tools + MCP. On-screen proof comes from our own test runs (real Claude Code + paperpilot-mcp merge/compress, browser network check, CLI OCR) in `docs/factcheck.md`; screenshots and the repo icon are not in the repo |
| `projects/editorbro` | **EditorBro** reel (55 s, Hinglish Liam): a GTA-style highway hook built in Three.js (`web/src/world`), the 64-skill pipeline, a montage of our reels, and nine demo websites for fictional brands (`web/demos`: brand, store, loyalty, food, delivery, automation, WordPress theme, corporate, real-WebCrypto E2EE). `scripts/sync_editorbro.py` builds the public EditorBro repo folder. Reference reels and plates are not in the repo |
| `projects/bro-bhai` | **Bro & Bhai** series (Hinglish, two cartoon hosts; ep 01: Claude Code Game Studios, 62 s, lip-synced hosts). Also a 7-slide **video carousel** (1080 x 1350): slide 1 = four original mini-games (platformer, arcade shooter, team battle, match-3) under the hook, slides 2-7 = the facts. Game sims in `src/carousel/sim.ts` feed both the picture and `scripts/audio/mix_carousel.py`. Host photos and generated sheets are not in the repo |
| `projects/anthropic-ipo/SOURCE` | Anthropic IPO explainer |
| `projects/gpt61-terra/SOURCE` | GPT-6.1 Terra launch |
| `projects/it-hiring-q2fy27/SOURCE`, `SOURCE_V2` | IT hiring Q2 FY27 data reel (dark, then Fluent light) |
| `projects/kimi-k31-pro/KIMI_K31_PRO_SOURCE` | Kimi K3.1 Pro film (`npm run studio`) |
| `projects/litellm-startup-hook/SOURCE` | LiteLLM 1.107.0 reel |
| `projects/railway-ai-security/SOURCE` | Railway AI-security case board |

### Reels rendered by the engine (`app/`)

Previewing a variant needs a dev server. Rendering a variant runs headless Chrome and ffmpeg:

```sh
cd app && bun install
bunx vite                                                     # dev server; the variant is set with VITE_VARIANT
bun scripts/render.ts stills --variant carbonx --t 1,5,9 --out ../out/wip   # check stills first
bun scripts/render.ts video  --variant carbonx                # full render
```

| Variant(s) | Project folder |
|---|---|
| `carbonx` | `projects/carbon-x`: Carbon-X DNA-model reel |
| `duet` | `projects/claude-duet`: Claude Duet news reel |
| `reveals`, `reveals_v1`, `reveals_v2` | `projects/claude-reveals`: "WHATTT?!" reel |
| `dots` | `projects/dots-heist`: DOTS heist short |
| `aura`, `aura_v4`, `aura_v41` | `projects/editors-aura`: The Editor's Aura |
| `pkgfw`, `pkgfw_v1`, `pkgfw_v2` | `projects/github-package-firewall`: GitHub package firewall |
| `grokbot` | `projects/grok-bot-reel`: Grok Bot 3D studio reel |
| `motion`, `possibilities`, `motion_full`, `flex` | Motion Flex (see `docs/MOTION-FLEX-CLAUDE.md`) |
| `reel`, `decision`, `repos` | The Jev explainer and earlier reels (see `docs/JEV-EXPLAINER.md`) |

---

## Requirements

| Tool | Used for |
|---|---|
| [Bun](https://bun.sh) 1.1+ | the engine app, AFTERCODE, ASTRA.EXE, capture scripts |
| Node.js 20+ | the Remotion projects |
| Python 3.12 | `analysis/` (numpy, scipy, soundfile, opencv-python, mediapipe; install what a script imports) |
| ffmpeg | every render and mix |
| Google Chrome | headless capture and rendering (Puppeteer uses the installed Chrome; set `CHROME_PATH` if it lives elsewhere) |
| [Blender](https://www.blender.org) 5 | 3D hero shots (`.claude/skills/motion-studio/blender/scene_template.py`); `winget install --id BlenderFoundation.Blender -e` |
| Python extras | the motion studio: `pip install --user pedalboard pyloudnorm reportlab numba pillow faster-whisper` |

Check the whole studio in one go: `python .claude/skills/motion-studio/scripts/check_tools.py` (it prints OK or MISS and the install command for each of the 16 tools).

### Environment variables

Nothing in this repo contains a key. Scripts read keys from your environment only:

| Variable | Needed by |
|---|---|
| `ELEVENLABS_API_KEY` | voice-over generation (`analysis/*_vo.py`, the Remotion `audio-src` scripts) |
| `KIE_API_KEY` | generated images / video / lip sync (`tools/open_higgsfield.py`, the Open Higgsfield AI models on kie.ai; `docs/OPEN-HIGGSFIELD.md`) |

Set it in your shell or user environment (on Windows: `setx ELEVENLABS_API_KEY "<your key>"`). Never put it in a committed file; `.env` files are git-ignored.

---

## What isn't in the repo, and why

To keep the repo small and to publish only what's ours to share, these stay local (see `.gitignore`):

- **Renders and recordings:** `out/`, `output/`, captured clips, QA stills, and all video and audio files. The scripts regenerate them.
- **Voice-overs, scores and mixes:** regenerated by `analysis/` (voices need your own ElevenLabs key).
- **Third-party material:**
  - research `references/`, on-screen "receipt" screenshots of other sites, and repo cards;
  - stock footage and frames extracted from it;
  - clips from other creators' videos.
- **Separate repositories:**
  - `OpenMontage/` (https://github.com/calesthio/OpenMontage);
  - `tools/genjutsu/` (https://github.com/sirioberati/Genjustsu-Open-Source-Workflow, setup in `docs/GENJUTSU.md`);
  - `tools/open-higgsfield-ai/` (https://github.com/Autom8AI/Open-Higgsfield-AI, MIT, setup in `docs/OPEN-HIGGSFIELD.md`);
  - `share/` (the open-source ASTRA.EXE copy, published on its own);
  - imported skill packs in `skills/` and `.claude/skills/` (only `reel-pipeline` and `motion-studio` are this repo's own);
  - the "Motion Studio in 20 Repos" PDF and its transcription (`.claude/skills/motion-studio/references/source/`, the author's text).
- **Secrets and dependencies:** `.env*`, `node_modules/`, Python virtualenvs, build output.

So some reels won't re-render straight from a fresh clone until you add their source media (a song, a stock clip, screenshots). The project's notes (`MANIFEST.md`, `FACTS.md`, `EDIT-NOTES.md`) list what each one needs.

---

## Credits and licences

| What | Credit / licence |
|---|---|
| Engine (`app/src/engine/`) | pdoom-video by mexicat (Giacomo Magnanini), MIT (`LICENSE.pdoom-engine`) |
| AFTERCODE music | Kevin MacLeod (incompetech.com), CC BY 4.0: "Realizer", "Smooth Move", "Electro Cabello", "Disco Medusae", "Funk Game Loop", "Dream Culture", "Local Forecast - Elevator", "Monkeys Spinning Monkeys", "Sneaky Snitch", "Fluffing a Duck" |
| AFTERCODE dance motion | CMU Graphics Lab Motion Capture Database (mocap.cs.cmu.edu) |
| Face tracking | MediaPipe Face Landmarker, Google, Apache-2.0 |
| Fonts | Inter, JetBrains Mono, Archivo, Cormorant, IBM Plex Mono: SIL Open Font License 1.1 |
| Voices | ElevenLabs text-to-speech, generated on the channel owner's account (the audio isn't included) |
| Motion studio method | Adapted from the "Motion Studio in 20 Repos" prompt pack and the "Motion Engineering" article by @0xwhrrari (x.com/0xwhrrari). The tools are their own projects: Blender (GPL), NumPy, SciPy, Puppeteer, GSAP, Three.js, Pedalboard, pyloudnorm, Tone.js, Remotion, OpenCV, Numba, Pillow, faster-whisper, ReportLab, FFmpeg |

Everything else (the scenes, analysis scripts, apps and reel sources) is original work by Tech पे Trek.
