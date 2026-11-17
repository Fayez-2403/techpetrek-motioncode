# Fact check: AI WEBSITE SAB EK JAISI?! (unslop)

Checked 2026-11-04. Every spoken or on-screen claim traces to a row.

**Sources:**
- **Repo:** https://github.com/heydamir/unslop
  - README rendered by GitHub, captured to `public/pages/repo.png`.
  - Sentence boxes are in `src/config/pages.json`.
  - The skill is vendored at commit a6f121e in `tools/unslop`.
- **GitHub API:** https://api.github.com/repos/heydamir/unslop (2026-11-04)
  - created_at 2026-10-29T15:41:21Z, stargazers 8,070, forks 401, license CC-BY-4.0, language JavaScript.
- **Daily Launch:** https://dailylaunch.org/p/unslop
  - A third-party tracker, captured to `public/pages/daily.png`.
  - Data "as of 07:25 UTC, 4 November 2026".

| # | Claim | Kind | Source | Verbatim | Status | Approved wording |
|---|---|---|---|---|---|---|
| F1 | unslop is a skill for Claude Code and Codex | official | README | "unslop is a skill for Claude Code and Codex that turns vibecoded, AI-looking UI into a designed interface with its own character." | verified | "Claude Code aur Codex ke liye ek open skill" |
| F2 | It finds slop: purple gradients, glows, emoji labels, shouty copy, uneven spacing | official | README | "It finds the slop first, the purple gradients, glows, emoji labels, shouty copy and uneven spacing" | verified | lens on that sentence |
| F3 | Audit, then direction before edits | official | README | "It audits the screen and proposes a direction before it edits anything" | verified | "Phir product se design direction set karta hai, edit se pehle" |
| F4 | Pass order | official | README | "Spacing, color, icons, copy, type, layout, details, visuals and motion, in that order." | verified | the list as on the page |
| F5 | Stacks | official | README | "Next.js, React, Vue, Svelte, Tailwind or plain HTML and CSS" | verified | "React, Vue, Svelte, Tailwind ya plain HTML" |
| F6 | Story video: square, under 10 s, needs Playwright + ffmpeg | official | README | "A square video under 10 seconds of your screen unslopping itself, ready to post. It needs Playwright and ffmpeg." | verified | "square, das second se kam, Playwright aur ffmpeg se" |
| F7 | Paid image generation asks first | official | README | "it shows the prompt and asks before every paid generation" | verified | not spoken; we spent nothing |
| F8 | License CC BY 4.0, credit required | official | README + LICENSE + API | "as long as you credit Damir Sokolovsky (@heydamir) and link back to this repository" | verified | "CC BY 4.0, creator ko credit dena zaroori" + on-screen credit "unslop by @heydamir" |
| F9 | Creator | official | README | "Created by Damir Sokolovsky (@heydamir)" | verified | on screen |
| F10 | Created 29 Oct 2026 | API + Daily Launch | GitHub API | created_at 2026-10-29T15:41:21Z | verified | (caption only) |
| F11 | ~+1.2k stars on 4 Nov, rank #18 | third-party | Daily Launch | "It ranked #18 on Daily Launch on 4 November 2026 with a Launch Score of 64, from +1.2k stars today on GitHub." (as of 07:25 UTC) | verified as reported; not audited by us | "Daily Launch ke mutabik 4 November ko lagbhag 1.2k naye stars" + label "third-party snapshot · 4 Nov 2026" |
| F13 | The hook: "ek hafte mein 8,000 se zyada GitHub stars" | API + capture | GitHub API + repo page | created_at 2026-10-29T15:41:21Z. Stargazers 8,070 on 2026-11-04, and 9,057 on 2026-11-05. The repo page captured 2026-11-04 18:12 UTC reads "8.4k stars" (`public/pages/hook_repo.png`). | verified: more than 8,000 within a week of creation | "Ek developer, Damir Sokolovsky, ne ek skill banaya aur ek hafte mein 8,000 se zyada GitHub stars!" with the lens on the page's own "8.4k stars". "6 din" was avoided: the 8,070 reading came about 6 days and 1 hour after creation |
| F14 | Damir Sokolovsky is the developer; his repositories | official | github.com/heydamir?tab=repositories (captured 2026-11-04) | profile name "Damir Sokolovsky"; public repos incl. unslop, termling, spider-lens … | verified | the hook background. His public GitHub profile (with its avatar) is shown as the source, and credited |
| F12 | The before/after in the reel | **our run** | this project | We ran the unslop skill (Claude Code, 2026-11-04) on the repo's own example `examples/dashboard.html`. The story video was rendered by the repo's `scripts/story.mjs` to `out/story/unslop-story.mp4` (1:1, 9.2 s). | real output of our run, not a guarantee | "Humne isi repo ke example dashboard pe unslop chalaya; ye hamara run hai, guaranteed output nahi" + on-screen "our run · not a guaranteed result" |

## On-screen labels
- **"our run · Claude Code + unslop · repo example"** over the story video.
- **"third-party snapshot · Daily Launch · 4 Nov 2026"** on the star figure.
- **"unslop by @heydamir"**, burned into the story video by story.mjs (the license credit). It is also in the source line and the caption.

## Not used (and why)
- **"Hire the unslopper" / paid service:** not part of the skill.
- **v2:** the Daily Launch "+1.2k stars on 4 Nov" beat (F11) was cut from the VO to fit the new developer hook under 60 s. It stays in the post caption, labelled third-party. The hook uses the first-party GitHub figure instead (F13).
- **"One-click professional design":** not claimed. The README says it audits and proposes a direction first.
- **"Open-source":** the license is CC BY 4.0, a content licence, not an OSI software licence. The VO says "open skill" and names the licence.
