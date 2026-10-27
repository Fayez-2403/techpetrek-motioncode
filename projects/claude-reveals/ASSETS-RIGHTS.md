# Asset and rights checklist (before animation)

Status 2026-10-21. Working copies are in `references/source/` (SHA-256 in `SHA256SUMS.txt`), downloaded from the public
posts' own media files on video.twimg.com at the best quality X serves. Contact sheets: `references/contact/`. Thread
screenshots: `references/screens/` (X's official embed, platform.twitter.com, dark and light).

**Rights, plainly:** Anthropic embedding a video in its thread credits the creator. It does **not** license TechpeTrek to
re-publish it. Each creator still owns their video. Before the reel is posted, each of the five creators should say yes,
and ideally send their original file (C needs a better master). DM drafts are at the end of this file. Nothing has been sent.

## Source videos (all six found; none missing)
| ID | Project | Creator | File | As served | Audio | Permission | Notes |
|---|---|---|---|---|---|---|---|
| A | Wildfire analysis ("FireTrace") | Dilum Sanjaya @DilumSanjaya | `A_wildfire_dilumsanjaya.mp4` | 3456×1990, variable ~57 fps (r 120), 115.0 s, 15 Mbps | none | **not requested** | Excellent quality. Variable frame rate: convert to constant 60 fps by timestamp (keeps 1.0× speed) |
| B | Doodle chess | Kevin Ngo @kevin_t_ngo | `B_chess_kevin_t_ngo.mp4` | 1920×1080, 60 fps, 73.6 s, 3.8 Mbps | stereo AAC | **not requested** | Has title cards ("ballpoint", "the opera game, paris 1858") and blank paper at 0:04, 0:20, 0:40, 0:52 |
| C | Handwriting to font | Harshpreet Singh @harshpreet931 | `C_font_harshpreet931.mp4` | **1280×720**, 30 fps, 65.0 s, **0.3 Mbps** | none | **not requested** | X serves only 720p at a low bitrate (the post claims 1920×1080). Ask the creator for the original file |
| D | Electromagnetic field | The Bugged Dev @thebuggeddev | `D_emfield_thebuggeddev.mp4` | 2824×1754, variable ~57 fps, 71.3 s, 8.7 Mbps | none | **not requested** | Dense UI; show at full width so the field and meters read |
| E | AngioView (3D cardiology) | Annas Rahman, MD @AnnasRahmanMD | `E_angioview_annasrahmanmd.mp4` | 3336×2160, ~60 fps, **12.45 s** | none | **not requested** | Short: the whole clip fits Reveal 05, untouched |
| F | Animated haiku | Kevin Ngo @kevin_t_ngo | `F_haiku_kevin_t_ngo.mp4` | 1080×1080, 30 fps, 40.1 s | stereo AAC | **not requested** | About 2 s per poem, so 3 poems fit in 6 s |

All horizontal clips go in a fitted frame, full width (1080 px), never cropped or stretched; the square haiku goes at 1080×1080.
The excerpts play at 1.0× from 60 fps frame sequences cut by ffmpeg (30 fps sources show each frame twice, as in the original).

## Proposed excerpts (to confirm on finer stills; the source mapping for deliverable 5)
| Reveal | Clip | In → out (source time) | On screen | Why |
|---|---|---|---|---|
| 01 | A | 00:01.0 → 00:11.0 (10 s) | 3D terrain, the glowing perimeter, hot-spot path | The clearest "fire spread over time" shot |
| 02 | B | 00:07.5 → 00:16.0 (8.5 s) | Full doodled board, pieces move | Shows it is a real game, not a drawing |
| 03A | C | 00:05.5 → 00:09.0 (3.5 s) + 00:41.5 → 00:47.0 (5.5 s) | 81 → 120 pages pile up; "Harshpreet Hand" alphabet | Two uncut excerpts: the input and the result |
| 03B | F | 00:20.0 → 00:26.0 (6 s) | Tram map, monsoon roses, split shell | Three colourful, different poems |
| 04 | D | 00:05.0 → 00:15.0 (10 s) | Magnet pushed through the coil; field lines and the meter swing | The "push it around" moment |
| 05 | E | 00:00.0 → 00:12.4 (all) | 3D heart + angiogram as the C-arm angle changes | The whole clip, uninterrupted |
| 0–17 s collage | A–F | short loops from the same excerpts | 6 tiles, all playing | The brief's background collage |

## Thread screenshots (real)
`references/screens/t1…t7_{dark,light}.png`: X's own embed of each post (430 css px wide at 2.5×). They show the verified
Claude account, the text, the video poster frames, the date and counts. They are shown unedited, labelled
"Source: @claudeai on X · Oct 16, 2026".

## Logos and brand
- Claude / Anthropic marks appear only inside the real screenshots (the avatar). They are never redrawn or animated on their own.
- X logo appears only inside the real screenshots.
- TechpeTrek logo: `app/public/brand/techpe-trek.jpg` (the user's own).

## The actor: real stock footage (Mixkit, Stock Video Free License)
History (2026-10-21): the user first chose an AI actor (Higgsfield), but the Higgsfield account is on the free plan with
0 credits, and the user then asked for free tools only. Nothing was generated; no Higgsfield credits were spent.
The actor is now **real stock footage of one actor** from Mixkit's 516xx series (a young man in a hoodie and an RGB headset
at a gaming PC): clips 51602 (green-screen monitor), 51606, 51607, 51611, 51612 (v2; v1 also used 51610), downloaded at 720p, the free
download size (`references/stock/free720/`, SHA-256 alongside).
- **Licence: Mixkit Stock Video Free License.** Commercial and non-commercial use, social media video posts, YouTube,
  modification allowed. No attribution needed (we credit "Actor: stock footage (Mixkit)" on the end card anyway). Each
  clip's licence was read from its own Mixkit page (`"copyrightNotice"`), not assumed.
- **Rejected:** a more expressive glasses-wearing actor (45734, 45735, 45809-45814) and others (8843, 14830, 24059, 32838,
  32845, 49030) are under Mixkit's **Restricted** License: personal, non-commercial use only, never social media for
  something that makes money. None of them are used.
- Mixkit's User Terms page sits behind a Cloudflare check that headless browsers can't pass. It wasn't read here, so read
  it once before posting. Our use is a fan's excited reaction: nothing offensive, and no endorsement claimed.
- Honesty: he is a stock actor, not a real person reacting to these projects. The reel presents him as a comedic stand-in
  for the viewer, and the end card says "Actor: stock footage (Mixkit)".
- What the stock can't do: there's no real chair leap. The jump is his arms-out celebration as a comic freeze-frame that
  launches, with confetti and a boing. There's no glasses adjustment, and his lips don't say "WHAT" (the voice is Liam).

## Generated by us (original, no rights issue)
Music (original 120 BPM electro-funk score synthesized in Python), comedy and transition foley (synthesized), all
typography (code), the confetti, sparks, field lines, heartbeat line and paper effects (code). None of these imitate a demo.

## Permission DM drafts (not sent; for the user to send)
> Hi <name>! I run Techpe Trek (tech reels in Hinglish). Claude featured your <project> in their Oct 16 thread, and I'd
> love to include a <N>-second excerpt of your original video in a reel about it, unedited and credited to you (@handle)
> on screen and in the caption. Would that be OK? If you have the original file, I'd use that instead of the compressed
> copy from X. Thanks!

Send to: @DilumSanjaya (A), @kevin_t_ngo (B and F, one message), @harshpreet931 (C, ask for the original file),
@thebuggeddev (D), @AnnasRahmanMD (E).
