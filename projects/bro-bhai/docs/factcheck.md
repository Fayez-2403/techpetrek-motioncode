# Fact check: Bro & Bhai ep 01, Claude Code Game Studios

Every on-screen and spoken claim traces to a row here (master studio §2).

- **Checked:** 2026-11-01 against the repo's README and file tree at commit `05ad7c8` (pushed 2026-10-19), plus the GitHub API.
- **Repo:** https://github.com/Donchitos/Claude-Code-Game-Studios

| # | Claim | Kind | Source URL | Supporting excerpt / location | Status | Approved on-screen / spoken wording |
|---|---|---|---|---|---|---|
| F1 | 49 specialized agents | official (README) | repo README | "49 agents. 74 skills." (l.6); What's Included table; `.claude/agents` has 49 .md files | verified | "README mein 49 agents listed hain" |
| F2 | 74 workflow skills | official (README) | repo README | l.6, l.58, l.104 "access all 74 skills"; `.claude/skills` has 74 folders | verified | "74 skills" |
| F3 | 15 hooks, 14 rules, 62 templates | official (README) | repo README | What's Included table l.59-61 | verified | "15 hooks, 14 rules" (62 templates: optional) |
| F4 | 3 tiers: directors, department leads, specialists | official (README) | repo README | "directors who guard the vision, department leads who own their domains, and specialists" (l.27); Tier 1-3 list | verified | "Directors, leads, specialists" |
| F5 | Directors: creative director, technical director, producer; leads incl. QA lead | official (README) | repo README | Tier 1 / Tier 2 lists | verified | role names on the cards |
| F6 | Departments: design, programming, art, audio, narrative, QA, production | official (README) | repo README | Agents row of the table (l.57) | verified | "code, art, audio, QA, production" |
| F7 | Engines: Godot 4, Unity, Unreal Engine 5 specialists | official (README) | repo README | Engine Specialists table | verified | "Godot, Unity, Unreal" |
| F8 | You still make every decision | official (README) | repo README | "you still make every decision" (l.29) | verified | "Decision tumhara hi rehta hai" |
| F9 | Start with `/start` | official (README) | repo README | Setup step 3 | verified | "/start" on screen |
| F10 | Not a game generator: a template you clone; games not shipped in the repo | official (README) | repo README | "this is a template you clone to start your own project" | verified | "Template hai, ready-made game nahi" |
| F11 | Four games from one brief at different rigor levels; standard mode: 30 docs, 58 min before the first line of game code; its game was ranked LAST by two blind reviewers + a human playtest | research finding (author's own measurement, in README) | repo README | "Does it produce games, or documents?" section | verified (author's measurement, say so) | "Repo ke author ne khud test kiya: zyada documents wala game… LAST aaya" |
| F12 | Visual changes need a launched game + retained screenshot before a story closes | official (README) | repo README | "It runs the game and looks at it" | verified | "QA game chala ke dekhta hai" (optional) |
| F13 | Directors ask for Opus; lead-programmer + 15 specialists name Sonnet; the other 30 inherit your session's model | official (README) | repo README | paragraph after the hierarchy | verified | cost line: "model usage ka bill tumhara" |
| F14 | MIT licence | official | GitHub API (license: MIT) + LICENSE | | verified | "Open source, MIT" |
| F15 | Stars: 31,681 on 2026-11-01 (user's brief: ~29.4k on 30 Oct with +538 that day, GitHub Trending) | platform count, time-bound | GitHub API | stargazers_count | verified for 2026-11-01 | "31K+ stars" with the date, or omit |
| F16 | Needs Git, Claude Code, Python 3, Bash (Git for Windows on Windows) | official (README) | repo README | Prerequisites | verified | setup checklist (DM / caption) |

## Mismatch noted
- The GitHub repo description still says "72 workflow skills". The README (l.6, l.58, l.104) and the `.claude/skills` folder say 74.
  Use 74 and phrase it as "README lists 74".
- The `.claude/docs` template folders hold 73 files; the README says 62 templates. We don't say "62" on screen.

## Disclaimers needed on screen
- **Platformer demo:** "Illustrative" label (our animation, not output from the repo).
- **Role cards and org chart:** our illustration of the README's hierarchy, not the repo's UI.
- **Caveat on screen ≥ 2 s:** "49 roles ≠ 49 employees · not a one-click game".

## Not used (and why)
- "Agents work simultaneously / autonomously": not claimed by the README; the user's guardrail forbids it.
- "Zero cost": model usage costs money (F13).

## Video carousel (2026-11-02): extra rows, re-checked the same day
README unchanged since commit `05ad7c8` (GitHub API `pushed_at` 2026-10-19). F1-F10, F11, F13, F14, F16 re-read in the live README.

| # | Claim | Kind | Source | Excerpt / location | Status | On-screen wording |
|---|---|---|---|---|---|---|
| F17 | 32,676 stars on 2026-11-02 | platform count, time-bound | GitHub API `stargazers_count` | | verified 2 Nov 2026 | "32.6K+ ★ on GitHub (2 Nov 2026)" |
| F18 | `minimal` rigor: 1 doc (the one-page brief), 0 min before the first line of game code; `standard`: 30 docs, 58 min | research finding (author's own measurement) | README "Does it produce games, or documents?" table | | verified | bar chart, slide 6 |
| F19 | Tier names in the hierarchy (creative-director … community-manager) | official | README "Studio Hierarchy" block | | verified | role chips, slide 3 (a sample + "+ more") |
| F20 | Engine sub-specialists: Godot (GDScript, Shaders, GDExtension), Unity (DOTS/ECS, Shaders/VFX, Addressables, UI Toolkit), UE5 (GAS, Blueprints, Replication, UMG/CommonUI) | official | README "Engine Specialists" table | | verified | slide 4 cards (no engine logos) |
| F21 | `/start` asks where you are: no idea, vague concept, clear design, existing work | official | README Getting Started step 3 | | verified | slide 5 step 3 |

- "1 DEV + 49 AI AGENTS" (slide 1) = F1. "Turns Claude Code into a game studio" = the repo's own description.
- Slide 1's four games are our own animation: labelled "illustration · our own mini-games"; they are not output of the repo.
