# GitHub package firewall reel: source, asset and code manifest

## Sources (facts)
| Source | Use |
|---|---|
| GitHub Changelog, "GitHub package firewall in public preview", 2026-10-20: https://github.blog/changelog/2026-10-20-github-package-firewall-in-public-preview/ | All claims; the on-screen credit "Source: GitHub Changelog • Oct 20, 2026" |
| GitHub Docs, "Protecting endpoints with package firewall": https://docs.github.com/enterprise-cloud@latest/code-security/how-tos/secure-your-supply-chain/secure-your-dependencies/protecting-endpoints-with-package-firewall | Policy names and defaults (minimum package age, default 1 day), who configures it, the registry URL shape, override requests |
| GitHub Docs supply-chain hub: https://docs.github.com/en/code-security/supply-chain-security/ | Context only (no firewall content) |

The fact sheet with line-by-line traceability is `FACTS.md`.

## Assets
| Asset | Origin | Rights |
|---|---|---|
| Every visual (npm cube, laptop, fictional terminal, registry, pipe, shield, runners, cards, panels, toggle) | Drawn in code, `app/src/scenes/pkgfw.ts` | Original |
| GitHub / npm names | Set in our own type (Archivo, IBM Plex Mono) | No logo artwork, no product UI copied |
| TechpeTrek logo | `Assets/Brand Logo.jpeg` → `app/public/brand/techpe-trek.jpg` | The user's own brand |
| Voice | ElevenLabs "Liam" (TX3LPaxmHKxFdv7VOQHJ), the user's account. Hook take: eleven_turbo_v2_5 hi, seed 3, speed 1.2. Body take: eleven_turbo_v2_5 hi, seed 5, speed 1.1 | Generated for this reel; the takes are cached in `audio/pkgfw/takes/` |
| Music | Original 122 BPM score synthesized by `analysis/pkgfw_music.py` (no samples) | Original, licensed by construction. "Blinding Lights" was a reference only and is not used |
| Sound effects | Synthesized by `analysis/pkgfw_mix.py` and `analysis/grokbot_mix.py` (no samples) | Original |
| Fonts | Archivo, IBM Plex Mono (`app/public/fonts`) | SIL Open Font License |

## Code (the editable project)
| File | Role |
|---|---|
| `analysis/script_pkgfw.py` | Script: the grid (122 BPM, 2-beat pickup), chapters, voice lines (Devanagari for the voice, Roman Hinglish for captions), voice settings |
| `analysis/pkgfw_vo.py` | Voice: two takes, cut by their timestamps, placed per window; writes the voice MP3/WAV, `lyrics.json` and the SRT |
| `analysis/pkgfw_music.py` | Score stems and `data/pkgfw/music.json` |
| `analysis/pkgfw_cues.py` | Storyboard as data: events from the word times, snapped to the grid, plus foley cues → `data/pkgfw/cues.json` |
| `analysis/pkgfw_mix.py` | Mix: ducking, a look-ahead limiter, −14 LUFS stereo, under −1 dBTP → `audio/pkgfw/mix.{wav,mp3}`, `data/pkgfw/audio.json`, the beat map |
| `analysis/pkgfw_qa.py` | The brief's QC as code → `QC-auto.json` |
| `app/src/scenes/pkgfw.ts` | The reel: six chapters, captions, credit (pure functions of t) |
| `app/src/timeline.ts` | Variant `pkgfw` |

Rebuild everything with no new credits:
```
python analysis/pkgfw_vo.py --seed-hook 3 --seed-body 5
python analysis/pkgfw_music.py
python analysis/pkgfw_cues.py
python analysis/pkgfw_mix.py
cd app; $env:VITE_VARIANT='pkgfw'; bunx vite --port 54178       # live preview
```

## Deliverables (output/)
| File | What |
|---|---|
| `pkgfw_master.mp4` | Final H.264 1080×1920 60 fps (after approval) |
| `pkgfw_animatic_30fps.mp4` | Preview animatic (30 fps) |
| `../../../audio/pkgfw/voiceover.wav` | The voice, WAV |
| `pkgfw_captions.srt` | Captions from the final voice timestamps |
| `pkgfw_thumbnail.png` | Cover, 1080×1920 (key content inside the 3:4 grid crop) |
| `pkgfw_beatmap.json` | Beat map: grid, cuts, events, foley, voice lines |
| `../QC-auto.json`, `../QC.md` | The QC report |
| `../CAPTION.md` | The post caption |
