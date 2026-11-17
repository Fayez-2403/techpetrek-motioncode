# Fact check: ONE BOT, 16 REPOS (checked 2026-11-03)

| # | Claim | Kind | Source | Status | On screen / spoken |
|---|---|---|---|---|---|
| F1 | The 16 tools of the "motion studio" stack (15 GitHub repos + ReportLab) | community post | @0xwhrrari on X, 27 Oct 2026 (read 2026-10-29, kept in .claude/skills/motion-studio/references/source/); the newer post 2117240315069276186 could not be opened (X returned 402) | verified (older post); newer post NOT seen | "stack list via @0xwhrrari" |
| F2 | Star counts per repo | GitHub REST API | docs/repos.json (fetched 2026-11-03) + the captured pages (src/config/repoBoxes.json) | verified | the ★ chip on each title card; the magnifier shows the page's own counter |
| F3 | Total stars of the 15 GitHub repos = 615,035 | sum of F2 | docs/repos.json | verified | "★ 615,035 · GitHub stars across 15 repos"; "छह लाख से ज़्यादा stars" |
| F4 | "सोलह free repos" / "sab free" | licences | GitHub licence fields + GSAP licence page; ReportLab open-source toolkit (BSD) | verified as free to use; GSAP is free but not OSI open-source, so the VO says "free", not "open-source" | VO lines 1, 8 |
| F5 | What each tool does (one line each) | tool docs / repo descriptions | repo descriptions (docs/repos.json) and the motion-studio pack table | verified (plain descriptions) | title-card job lines, VO |
| F6 | The repo pages are real | our capture | assets/screenshots/*.png (web/scripts/grab_repos.mjs, public pages, no login, 2026-11-03) | verified | panels + lens |
| F7 | The bot | fan-made rebuild | Assets/claude bot face.png (user-supplied) | fan-made, labelled | "fan-made bot" |
| F8 | The props (rig, wire world, array grid, film strip, puppet strings, keys, pedals, meter, scan, contact sheet, captions, encoder, printer) | our illustrative animation | src/reel/props.tsx | illustrative | (no claim of being the tools' real output) |

## Star counts (GitHub API, 2026-11-03)
| Repo | API stars | Page shows | Licence | Description | URL |
|---|---|---|---|---|---|
| blender/blender | 21,571 | 21.6k stars | NOASSERTION | Official mirror of Blender | https://github.com/blender/blender |
| mrdoob/three.js | 117,464 | 117.5k stars | MIT | JavaScript 3D Library. | https://github.com/mrdoob/three.js |
| numpy/numpy | 33,241 | 33.2k stars | NOASSERTION | The fundamental package for scientific computing with Python | https://github.com/numpy/numpy |
| numba/numba | 11,199 | 11.2k stars | BSD-2-Clause | NumPy aware dynamic Python compiler using LLVM | https://github.com/numba/numba |
| greensock/GSAP | 30,095 | 30.1k stars | None | GSAP (GreenSock Animation Platform), a JavaScript animation  | https://github.com/greensock/GSAP |
| remotion-dev/remotion | 70,248 | 70.2k stars | NOASSERTION | 🎥      Make videos programmatically with React | https://github.com/remotion-dev/remotion |
| puppeteer/puppeteer | 95,792 | 95.8k stars | Apache-2.0 | JavaScript API for Chrome and Firefox | https://github.com/puppeteer/puppeteer |
| Tonejs/Tone.js | 14,877 | 14.9k stars | MIT | A Web Audio framework for making interactive music in the br | https://github.com/Tonejs/Tone.js |
| scipy/scipy | 15,179 | 15.2k stars | BSD-3-Clause | SciPy library main repository | https://github.com/scipy/scipy |
| spotify/pedalboard | 6,408 | 6.4k stars | GPL-3.0 | 🎛 🔊 A Python library for audio. | https://github.com/spotify/pedalboard |
| csteinmetz1/pyloudnorm | 789 | 789 stars | MIT | Flexible audio loudness meter in Python with implementation  | https://github.com/csteinmetz1/pyloudnorm |
| SYSTRAN/faster-whisper | 26,433 | 26.4k stars | MIT | Faster Whisper transcription with CTranslate2 | https://github.com/SYSTRAN/faster-whisper |
| opencv/opencv | 91,416 | 91.4k stars | Apache-2.0 | Open Source Computer Vision Library | https://github.com/opencv/opencv |
| python-pillow/Pillow | 13,963 | 14.0k stars | NOASSERTION | Python Imaging Library (fork) | https://github.com/python-pillow/Pillow |
| FFmpeg/FFmpeg | 66,360 | 66.4k stars | NOASSERTION | Mirror of https://git.ffmpeg.org/ffmpeg.git | https://github.com/FFmpeg/FFmpeg |
| MrBitBucket/reportlab-mirror | 87 | — | BSD-3-Clause | mirror of https://hg.reportlab.com/hg-public/reportlab | https://github.com/MrBitBucket/reportlab-mirror |
