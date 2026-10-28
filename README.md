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
| `docs/` | Workflow notes and production write-ups (`TECHPE-TREK-WORKFLOW.md`, `JEV-EXPLAINER.md`, the Motion Flex notes, …). |
| `kit/` | The Motion Flex prompt kit. |
| `colab/` | Colab notebooks for rendering without a local GPU. |
| `.claude/` | Claude Code setup for this repo: the `reel-pipeline` skill (every reel goes through it) and a prompt hook. |
| `CLAUDE.md` | The rules Claude Code follows in this repo (determinism, beat/word timing, stills before renders). |

---

## Projects

### Interactive apps

| Project | What | Run |
|---|---|---|
| `projects/aftercode/web` | **AFTERCODE: Face Dance Studio.** Your photo or selfie on a 3D avatar that dances to the beat: solo, duo, battle and crew modes, 8 worlds, CMU mocap and per-world song slots. Live at **https://aftercode-one.vercel.app** | `bun install && bun run dev` (port 54210) |
| `projects/astra-exe/web` | **ASTRA.EXE.** A celestial-bow physics lab (R3F + Rapier) that fractures a floating mountain. Open-source copy: **https://github.com/Fayez-2403/Astra.exe** | `bun install && bun run dev` (port 54200) |

### Reels made with Remotion

Each of these has its own `package.json` and is a standard Remotion project. Run `npm install` in it, then `npx remotion studio` to preview, or use its `scripts/render.mjs` / `render_reel.mjs` to render.

| Project | Reel |
|---|---|
| `projects/aftercode/reel/edit` | AFTERCODE 70 s reel (captured from the app's `?reel=1` mode; the song switches at every mode change) |
| `projects/cloudflare-kv-cache/SOURCE` | Cloudflare GLM-5.3 KV-cache exposure explainer (v1 55 s, v2 60 s Sheetal/Munni hook; light "memory floor" world; version in `src/data/version.ts`; `npx remotion studio src/index.ts`, `node scripts/render.mjs`) |
| `projects/anthropic-ipo/SOURCE` | Anthropic IPO explainer |
| `projects/genie-4/SOURCE` | Google DeepMind Genie 4 explainer, Bollywood-poster style with DeepMind's demo clips (clips are not in the repo: download them from the post, see `projects/genie-4/FACTS.md`) |
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
| Google Chrome | headless capture and rendering |

### Environment variables

Nothing in this repo contains a key. Scripts read keys from your environment only:

| Variable | Needed by |
|---|---|
| `ELEVENLABS_API_KEY` | voice-over generation (`analysis/*_vo.py`, the Remotion `audio-src` scripts) |

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
  - `share/` (the open-source ASTRA.EXE copy, published on its own);
  - imported skill packs in `skills/` and `.claude/skills/` (only `reel-pipeline` is this repo's own).
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

Everything else (the scenes, analysis scripts, apps and reel sources) is original work by Tech पे Trek.
