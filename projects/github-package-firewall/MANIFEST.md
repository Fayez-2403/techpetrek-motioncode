# GitHub package firewall reel (v3, light + caution hook): source, asset and code manifest

v3 (2026-10-21) adds a caution-buzzer hook first (synthesized buzzer, a beacon, a caution sign and caution tapes drawn in
code), says "according" and "time" for "mutabik" and "waqt", and drops the end card's tagline. v2 is kept as variant
`pkgfw_v2` (`app/src/scenes/pkgfw_v2.ts`, `data/pkgfw_v2/`, `audio/pkgfw_v2/`, `analysis/script_pkgfw_v2.py`, `*_v2-light.*`).

v2 (2026-10-21) is a restyle of v1: light mode in Microsoft Fluent 2 tokens, GitHub look-alike interfaces, real screenshots,
the official GitHub and npm logos, a more conversational voice, and a much quieter score with UI foley only. v1 (dark) is
kept: `MANIFEST_v1-dark.md`, variant `pkgfw_v1`, `output/*_v1-dark.*`.

## Sources (facts)
| Source | Use |
|---|---|
| GitHub Changelog, "GitHub package firewall in public preview", 2026-10-20: https://github.blog/changelog/2026-10-20-github-package-firewall-in-public-preview/ | All claims; the GitHub quote (F13); the on-screen credit "Source: GitHub Changelog • Oct 20, 2026"; three screenshots |
| GitHub Docs, "Protecting endpoints with package firewall": https://docs.github.com/enterprise-cloud@latest/code-security/how-tos/secure-your-supply-chain/secure-your-dependencies/protecting-endpoints-with-package-firewall | Policy names and defaults, who configures it, the `.npmrc` registry line, the npm notice example and the override form fields (F14); three screenshots |
| Microsoft Fluent 2 design system: https://fluent2.microsoft.design/ (tokens from `@fluentui/tokens`) | The look: neutrals, brand blue, shadows, radii, type ramp, motion curves and durations |
| GitHub Primer (light) | Colours of the GitHub look-alike interfaces |

Line-by-line traceability: `FACTS.md`.

## Assets
| Asset | Origin | Rights / use |
|---|---|---|
| Screenshots (6): changelog title, intro, "Availability and limitations"; docs title, policy controls, npm notice | Captured 2026-10-21 by `app/scripts/shoot_pages.ts` (headless Chrome, 430 px wide, 2.5×, light scheme; github.blog renders this post dark). Full pages and crops in `references/screens/`, used crops in `app/public/pkgfw/screens/` | Public pages, shown unedited as cited receipts, each labelled "REAL SCREENSHOT" |
| GitHub mark | Primer Octicons `mark-github` SVG path, unmodified (`brand-assets/mark-github-24.svg`) | Used only to refer to GitHub, per GitHub's logo guidance; not altered or recoloured beyond black / white |
| npm logo | Simple Icons `npm` SVG path, unmodified, npm red #CB3837 (`brand-assets/npm.svg`) | Used only to refer to npm |
| GitHub look-alike interfaces (terminal, Actions run, settings page, override dialog) | Drawn in code, `app/src/scenes/pkgfw.ts` | Original drawings, labelled "ILLUSTRATION" or "EXAMPLE OUTPUT FROM GITHUB DOCS"; no GitHub UI image is copied except the labelled screenshots |
| Package names in the hook | Made up; all 404 on registry.npmjs.org on 2026-10-21 (list in FACTS.md) | Fictional, labelled |
| TechpeTrek logo | `Assets/Brand Logo.jpeg` → `app/public/brand/techpe-trek.jpg` | The user's own brand |
| Voice | ElevenLabs "Liam" (TX3LPaxmHKxFdv7VOQHJ), the user's account; one take, `eleven_turbo_v2_5`, language hi, seed 5, speed 1.12, stability 0.45 | Generated for this reel; cached in `audio/pkgfw/takes/v3_s5.{mp3,json}` (v2: `v2_s5`) |
| Music | Original 122 BPM score, synthesized by `analysis/pkgfw_music.py` (no samples): soft kick and clap, pads, plucks, no impacts | Original, licensed by construction. "Blinding Lights" was a reference only and is not used |
| Foley | Synthesized by `analysis/pkgfw_mix.py`: the caution buzzer (v3), quiet keys, Enter, ticks, toggles, clicks (no booms) | Original |
| Caution hook visuals (beacon, hazard-striped sign, caution tapes, warning triangle) | Drawn in code, `alert()` in `app/src/scenes/pkgfw.ts` | Original |
| Fonts | Mona Sans (400–800) and Monaspace Neon (400/600/700), GitHub, via Fontsource → `app/public/pkgfw/fonts/` | SIL Open Font License |

## Code (the editable project)
| File | Role |
|---|---|
| `analysis/script_pkgfw.py` | Script: the 122 BPM grid, nine chapters, the voice lines (Devanagari for the voice, Roman Hinglish for captions), voice settings, emphasis words (v1: `script_pkgfw_v1.py`) |
| `analysis/pkgfw_vo.py` | Voice: one take with timestamps, cut by character alignment, each chapter placed on a beat → voice MP3/WAV, `data/pkgfw/lyrics.json`, `layout.json`, the SRT |
| `analysis/pkgfw_music.py` | Quiet score from `layout.json` → stems and `data/pkgfw/music.json` |
| `analysis/pkgfw_cues.py` | Storyboard as data: each event is its word, snapped to the nearest eighth note; quiet foley cues → `data/pkgfw/cues.json` |
| `analysis/pkgfw_mix.py` | Mix: music at 0.36 with ducking, foley ×0.3, a look-ahead limiter, −14 LUFS stereo, under −1 dBTP → `audio/pkgfw/mix.{wav,mp3}`, `data/pkgfw/audio.json`, the beat map |
| `analysis/pkgfw_qa.py` | The brief's QC as code → `QC-auto.json` |
| `app/src/scenes/pkgfw.ts` | The reel: nine chapters (the caution hook first), Fluent tokens and helpers, captions, the credit (pure functions of t) (v2: `pkgfw_v2.ts`, v1: `pkgfw_v1.ts`) |
| `app/src/timeline.ts` | Variants `pkgfw` (v3), `pkgfw_v2` and `pkgfw_v1` |
| `app/scripts/shoot_pages.ts` | Screenshot tool for the receipts |

Rebuild everything with no new credits (the take is cached):
```
python analysis/pkgfw_vo.py --seed 5
python analysis/pkgfw_music.py
python analysis/pkgfw_cues.py
python analysis/pkgfw_mix.py
cd app; $env:VITE_VARIANT='pkgfw'; bunx vite --port 54178       # live preview
```
Re-shoot the receipts: `cd app; bun scripts/shoot_pages.ts ../projects/github-package-firewall/references/screens changelog=<url> docs=<url>`.

## Deliverables (output/)
| File | What |
|---|---|
| `pkgfw_master.mp4` | Final H.264 1080×1920 60 fps (after approval) |
| `pkgfw_animatic_30fps.mp4` | Preview animatic (30 fps) |
| `../../../audio/pkgfw/voiceover.wav` | The voice, WAV |
| `pkgfw_captions.srt` | Captions from the final voice timestamps (40 cues) |
| `pkgfw_thumbnail.png` | Cover (v3), 1080×1920, key content inside the 3:4 grid crop: the caution sign at 3.50 s (`../cover/cover_base_v3.py`), then the same title card (`bun ../cover/cover_pkgfw.ts <repo> cover_base_v3.png <out>`). v2's cover, `pkgfw_thumbnail_v2-light.png`, was built from the 5.40 s frame by `../cover/cover_base.py`, then `bun ../cover/cover_pkgfw.ts <repo> cover_base.png <out>` (Fluent card in Chrome: Mona Sans, the GitHub mark, the npm logo) |
| `pkgfw_beatmap.json` | Beat map: grid, cuts, events, foley, voice lines |
| `../QC-auto.json`, `../QC.md` | The QC report |
| `../CAPTION.md` | The post caption |
| `../EDIT-NOTES.md` | Edit decision list and the source slate |
