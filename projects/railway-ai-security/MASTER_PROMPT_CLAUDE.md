# TechpeTrek Reel — "Railway Cloud Breach + AI Security Week" (Claude master prompt)

Paste or say: **"Run projects/railway-ai-security/MASTER_PROMPT_CLAUDE.md"**. Rewritten from a GPT draft for Claude Code in the
`motion-as-code` repo, so it follows this repo's rules and skills. Today's date is checked at the start of the run; facts are checked
again before export.

---

<role>
You are TechpeTrek's fact-checking researcher, Hinglish scriptwriter, motion designer, sound designer and render engineer for one
60-second Instagram Reel. Viewers are Indian developers, CS students, startup builders and AI tinkerers. They will act on what this
reel says (rotate keys, change agent permissions), so **accuracy and clear labelling come first**: a wrong number or a blurred
"breach vs research" line would hurt the channel more than any weak visual.
</role>

<how_to_run>
1. Read `CLAUDE.md`, `README.md`, `docs/CONTEXT.md` and `MEMORY.md`, then invoke the **`reel-pipeline`** skill and run its stages in
   order, loading each stage's skills: brand → brief + facts (`motion-brief-writer`, WebSearch/WebFetch) → hook (`11-social-hook`,
   `hyperframes-creative`) → script + voice → template/look (`vox-explainer` or `faceless-explainer`; `animated-chart` for numbers;
   `motion-effects`, `hyperframes-animation`) → music + sound (`hyperframes-audio`) → build → animatic → final → export + QA
   (`reel-export`, `analysis/reel_qa.py`) → post kit.
2. Keep the repo rules (engine: Remotion + Three.js as the original spec asked, reusing the projects/kimi-k31-pro kit; every frame a pure function of time, seeded randomness only,
   never edit `app/src/engine/`), check work with stills, explain each change in one or two sentences before making it, keep earlier
   versions (`*_v1`), and **ask before the full render or any 4K render**.
3. Keep state in `projects/railway-ai-security/` (FACTS.md, PROGRESS.md, brief, script, QA.md) so the work survives a context reset.
4. Make the creative decisions yourself. Stop and ask only about money (ElevenLabs credits, paid assets), rights to third-party
   material, or if fewer than **four** cases survive the research gate.
</how_to_run>

<non_negotiables>
- **Railway = Railway.com, the developer cloud / hosting platform. Never Indian Railways.** Say so on screen in the first 3 seconds
  and in the caption, pinned comment and cover.
- **Label every case with its true type** and never call them all "jailbreaks". Use exactly one tag per case:
  `CONFIRMED BREACH` · `AI-ASSISTED INTRUSION (reported)` · `GOVERNMENT ADVISORY` · `SECURITY RESEARCH` · `INTERNAL TEST`.
- **Keep confirmed facts apart from claims.** Railway's confirmed unauthorized access is not the same as its *suspected* attacker
  goal (AI-provider API keys for distillation) or its *initial evidence* about abliterated models. Show these as separate panels:
  "CONFIRMED" vs "COMPANY'S EARLY FINDINGS". Never say an AI agent or jailbreak caused the breach unless a primary source says so.
- **No harmful detail:** no exploit steps, payloads, real keys or tokens, attack tooling, or "how they did it" reconstructions.
  Defensive guidance only.
- **No fabricated UI or logos:** no fake screenshots of Railway, Reuters, CERT-In, GitHub, Anthropic or OpenAI pages, and no
  recreated logos. Source cards are original typographic citations: publisher, date, title in quotes, and a short URL.
  Illustrative visuals (server diagrams, ENV cards, dashboards) carry an `ILLUSTRATIVE` tag. ENV cards show only `•••••` or
  `REDACTED`, never realistic-looking secrets.
- **No invented numbers:** no affected-user counts, site counts, money figures or "trending" claims unless the primary source states
  them, quoted exactly with publisher + date on screen.
- **Status words must match the source:** "preliminary", "investigation ongoing", "patched", "advisory" and similar terms are used
  only if the source uses them, and are re-checked on export day.
</non_negotiables>

<research_gate>
Stage 1 must pass before any picture work. For each lead below, open the **primary source** (fall back to a second reputable
outlet only to corroborate). Record in `FACTS.md`, per case:
- exact date(s);
- what happened, in the source's own words, with short quotes;
- the type tag above;
- status (ongoing / patched / closed);
- numbers (only stated ones);
- what is *not* confirmed;
- **India impact** (`DIRECT` = Indian users/orgs/agency named; `INDIRECT` = platform or tool widely used by Indian developers, stated
  without unsourced usage stats; `GLOBAL` = context only);
- the on-screen footnote text.

If a case cannot be verified, **drop it and re-time** the remaining cases; don't soften it and keep it.

Pre-check from 2026-10-26 (these are leads, not proof; re-verify everything):

1. **Railway developer-cloud breach (MAIN STORY).**
   - Source: blog.railway.com/p/preliminary-report-october-security-incident.
   - Page title seen: "Preliminary Report: Oct 21st Security Incident". It follows Railway's first disclosure of Oct 21; the timeline
     covers Oct 20–22.
   - The report says:
     - attackers gained unauthorized access to a subset of internal systems;
     - a subset of customers had secrets exposed that required credential rotation;
     - Railway recommends all customers who signed up before Oct 21 rotate the keys stored on Railway, and has notified directly
       impacted customers;
     - Railway reported potentially impacted secrets to partner vendors;
     - builds, deploys, dashboard, API and CLI were disrupted;
     - "Early investigations" suggest the attack was trying to obtain AI-provider API keys for distillation attacks;
     - "initial evidence" suggests the actor had access to abliterated models and substantial compute;
     - external incident responders and the authorities are involved, and the forensic investigation is ongoing.
   - **Check for a newer follow-up or final report** and use the latest wording.
   - India angle: `INDIRECT`. It matters to Indian developers and startups who host on Railway. Don't claim how many Indian users
     there are.
2. **CERT-In advisory on AI agents** (CIAD-2026-0049).
   - Source: cert-in.org.in, VLCODE=CIAD-2026-0049. The page is dynamic, so read the advisory text itself (or its PDF).
   - Confirm the date (lead: 2026-10-15), the exact scope (what agents did, which systems, and whether it is a real incident or a
     general warning) and the recommended mitigations.
   - India angle: `DIRECT` (India's national CERT). This is the strongest India-first case: make it Case 2.
3. **GitHub Copilot prompt-injection research.**
   - Lead: theinjection.dev/products/github-copilot/. This is a secondary tracker; find the **original advisory or paper**, plus
     affected versions and patch status.
   - India angle: `INDIRECT` (Copilot is widely used by Indian developers). Any claim about India's developer population needs its
     own source, e.g. GitHub Octoverse, or leave it out.
4. **Reuters: one hacker used AI agents for a few thousand dollars to break into scores of sites** (2026-10-19).
   - Reuters blocks automated fetches (401). Read the article itself or a syndicated copy and confirm the site count wording and
     whether any Indian or Asian sites were named.
   - India angle: `DIRECT` only if Indian sites are named; otherwise `GLOBAL`, framed as "same playbook can hit Indian sites".
5. **Anthropic threat intelligence report** ("Countering misuse of AI: September 2026").
   - Pick one case; prefer one that involves India, South Asia or APAC actors or targets, if the report has one.
   - Show the older date (September) clearly.
6. **OpenAI: an AI agent "lied about disabling its safety monitoring system"** (The Verge headline).
   - This is an internal test, not a public breach. India angle: `GLOBAL`. It is the weakest India link, so use one line, or **swap
     it** for a verified October 2026 India / South Asia / APAC AI-security item.

Replacement rule: to improve India relevance you may replace cases 4–6 with verified October 2026 items in this order:
- India, e.g. further CERT-In advisories, Indian companies or government systems with an AI angle;
- South Asia (Pakistan, Bangladesh, Sri Lanka, Nepal);
- Southeast Asia / wider APAC;
- global.

Each replacement needs a primary source and the same FACTS.md entry. Never pad to reach six; four or five strong cases beats six
mixed ones.
</research_gate>

<hook>
The first 3–5 s must be India-first, grounded and urgent without overclaiming. Frame 0 must already be a strong image: no black
frame, no logo sting. Options (pick after research, test them with the `11-social-hook` principles):
1. **"Railway pe app deploy ki hai? Railway khud keh raha hai — keys ROTATE karo!"** *(recommended: action + source-grounded)*
2. "Indian devs — aapki cloud API keys RISK mein?!"
3. "Ek developer cloud hack hua… aur CERT-In ne bhi AI agents par warning di!"
4. "AI API keys churane ke liye poora CLOUD platform hack?!"
5. "Startup ka backend Railway pe hai? Ye 5 second dekho."

On-screen hook headline, in the reference style (short, concrete, past tense): **"Hackers got into a dev cloud."**, with the kicker
"Railway.com · Oct 20–22" and the chip "ROTATE KEYS · RAILWAY'S OWN ADVICE".

First-frame plan:
- 0.0 s: the dark alert variant of the case card. A deploy dashboard (original, `ILLUSTRATIVE`) sits in the media window with an
  orange `SECRETS · ROTATE` alert pulsing on the downbeat.
- 0.4 s: the headline masks up.
- By 1.5 s: a chip appears that stays until 4 s: **"Railway.com = developer cloud · NOT Indian Railways"**.
- By 4–5 s: the viewer knows the value — "kya hua, kya confirmed hai, aapko kya karna hai" — plus a tease that this is 1 of N cases
  this week, with India's CERT-In among them.
</hook>

<storyboard>
60 s, 1080×1920, 60 fps (3600 frames), cuts every 2–4 s on a 120 BPM grid (1 beat = 0.5 s = 30 frames). Re-time to the final voice.
Keep every caption and footnote inside Instagram's safe area (clear of the top ~250 px and bottom ~420 px).

Every case is one CASE FILE card (see reference_style) laid out for 9:16: the card occupies y ≈ 260–1500, and the punch-caption band
sits just below the media window. Inside a case, the 2–4 s microcuts happen in the media window (receipt → animation → highlight),
while the card frame stays put. That steadiness is what makes the reference feel premium.

| Time | Case | On screen | Tag |
|---|---|---|---|
| 0–4 | Hook | dashboard alert → headline → "NOT Indian Railways" chip | ILLUSTRATIVE |
| 4–8 | Railway | source card (Railway blog, date, report title) + "OCT 20–22" | CONFIRMED BREACH |
| 8–13 | Railway | redacted ENV cards, some flagged "rotate"; "subset of customers" (wording as the source has it) | CONFIRMED BREACH |
| 13–17 | Railway | builds paused / deploys disrupted (original diagram) | CONFIRMED BREACH |
| 17–23 | Railway | two panels: CONFIRMED (access, secrets, disruption) vs COMPANY'S EARLY FINDINGS (AI-key goal, abliterated models) + "AI jailbreak as cause: NOT confirmed" | — |
| 23–30 | CERT-In | stylised advisory card (no facsimile), India outline highlight, advisory ID + date | GOVERNMENT ADVISORY |
| 30–36 | Copilot | prompt-injection concept: hidden instruction in a file → assistant follows it (abstract, no payload) | SECURITY RESEARCH |
| 36–42 | Reuters | AI-agents-at-scale intrusion concept; site count only if verified | AI-ASSISTED INTRUSION (reported) |
| 42–47 | Anthropic | one case card, "SEPTEMBER 2026" prominent | (per source) |
| 47–50 | OpenAI or swap | sandbox monitor graphic, "INTERNAL TEST — not a breach" | INTERNAL TEST |
| 50–57 | Action | checklist: ROTATE KEYS · LEAST PRIVILEGE · HUMAN APPROVAL FOR AGENTS · AUDIT LOGS | — |
| 57–60 | CTA | "Comment SECURITY" + source URLs on the end card | — |

Attack-type legend: a small persistent chip shows the current case's tag, colour-coded, so viewers never confuse a breach with
research.
</storyboard>

<script>
Hinglish narration, about 140–150 words for 60 s (energetic Hinglish runs at roughly 2.4 words a second). Follow the
`hyperframes-creative` narration rules: write for the ear, deliver value by line 2, say numbers the way they're spoken. Rewrite the
draft below freely for rhythm, but **only state what FACTS.md confirms**, and keep every caveat.

> "Railway pe app deploy ki hai? Railway khud keh raha hai — apni keys rotate karo! Haan, ye Railway developer cloud hai, Indian
> Railways nahi. October mein Railway ne unauthorized access confirm kiya — kuch customers ke secrets expose hue, aur builds aur
> deploys ruk gaye. Company ke early findings ke mutabik attackers AI-provider API keys target kar rahe the — lekin AI jailbreak ne
> breach kiya, ye confirm nahi hai. Aur ye akela case nahi: CERT-In ne AI agents par advisory jaari ki. Copilot par
> prompt-injection research aayi. Reuters ne AI agents se hue intrusions report kiye. Har case ka type alag hai — breach, advisory,
> research. Developer ho? Keys rotate karo, agents ko kam permission do, aur audit logs check karo. Comment karo SECURITY, aur ye
> Reel save kar lo."

Voice:
- ElevenLabs "Liam" (TX3LPaxmHKxFdv7VOQHJ). Hindi in Devanagari for the TTS, English words in English, numbers spelled out. Say the
  brand as "Tech पे Trek".
- **First check the credit balance; if it is too low, stop and ask** (no silent spending, no low-quality voice shipped as final).
- Check every take with speech-to-text, especially "Railway", "CERT-In" ("Cert In"), "Copilot", "prompt injection" and "API keys".
- On-screen captions are Roman Hinglish (never Devanagari on screen): word-level timing from the final voice, at most 2 lines, 3–5
  words per card, key words highlighted.
</script>

<reference_style>
The quality bar is two reference posts the user picked. Both are Sebastian Hardy carousels, 4:5, about 12 s per slide, silent:
"It hacked a PS5" (instagram.com/p/DerqguLDgQa, 10k likes, 5.7k comments) and "It hacked a Switch 2" (instagram.com/p/De6qGz9jj3y).
The user also likes his "400 repos" and "Muse AI" posts. If they share those links, study them the same way.

Before designing, study the references: download with `python -m yt_dlp`, keep the files in the scratchpad only, and look at frames.
Learn the system, but **don't clone his brand** (exact palette, fonts or layout). Build TechpeTrek's own **"CASE FILE"** system at the
same level:

- **Paper:** an editorial page (warm off-white paper with a faint 40 px grid), ink-black type and one alert accent (security orange
  #FF5A1F). The TechpeTrek purple appears only on brand marks.
- **Case card anatomy** (one card per case; the reference's key move is one verified case per card):
  1. **Top bar:** an accent dash at the top-left; a mono page counter at the top-right ("02 / 08").
  2. **Case number:** a big serif numeral in the accent colour ("01").
  3. **Kicker:** an icon plus a mono kicker with the real context ("Railway.com · developer cloud · Oct 20–22").
  4. **Headline:** a heavy, tight headline of 3–5 words, in past tense and concrete, e.g. "Hackers got into a dev cloud.",
     "India's CERT-In raised an alarm.", "A hidden prompt hijacked Copilot." Every headline must match FACTS.md, with no hype
     beyond the source.
  5. **Body:** 2–3 plain lines in the source's wording (who, what, what's confirmed).
  6. **Media window:** a framed window with a soft shadow, holding either a **real receipt** or an **original animation**:
     - a real receipt is a screenshot of the actual source page, captured with Playwright (the Carbon-X `shoot_text` pattern), cropped
       to the relevant passage and labelled "SOURCE: publisher, date";
     - an original animation is tagged ILLUSTRATIVE.
     - Never fake a page.
  7. **Two stat chips:** a small mono label plus a bold value, verified facts only, e.g. "ROTATE IF SIGNED UP · BEFORE OCT 21",
     "STATUS · INVESTIGATION ONGOING", "ISSUED BY · CERT-In", "TYPE · RESEARCH".
  8. **Footnote:** a tiny footnote line with publisher · date · short URL, readable on a phone.
- **Fonts:** open-licensed only, and check each licence. Serif numerals: Instrument Serif or DM Serif Display. Heavy headlines:
  Archivo Black / Archivo ExtraBold (already in the repo from ASTRA). Kicker and chips: JetBrains Mono.
- **Motion (per card, beat-locked):**
  - the counter ticks over on the downbeat;
  - the numeral slides in;
  - the headline masks up word by word;
  - the body fades in line by line;
  - the media window scales from 0.96 with its shadow growing;
  - the chips pop on beats 3 and 4;
  - the card exits with a clean page-slide on the next downbeat.
  - Inside the window, the receipt scrolls slowly or a highlight sweeps the quoted line.
  - Calm, premium, readable. The urgency comes from the hook and the sound, not from shaking type.
- **One text system:** the card text carries the facts. Keep spoken-word captions to one short Roman Hinglish punch line per beat, in
  a fixed band under the media window; never full subtitles stacked over body copy. The SRT file is still delivered for
  accessibility.
</reference_style>

<look_and_sound>
- **Look:** the CASE FILE system above. The hook and checklist may flip to a dark "alert" variant (graphite #15161A, the same layout,
  orange accents) for contrast. Original vector server and cloud diagrams inside the media windows; restrained glitch only on the
  hook.
- **Flashes:** at most 3 per second and never full-screen strobe (accessibility).
- **Type hierarchy:** headline > body > chips > footnote. Every word must be readable at phone size (headline ≥ 84 px, body ≥ 40 px
  and chips ≥ 30 px on 1080 width).
- **Music:** an original 120 BPM cyber-tech track synthesized in code (the `analysis/*_music.py` pattern) so it is licence-clean.
  Cuts sit on the beat, with an impact on the hook and on each case change.
- **Sound effects:** synthesized UI clicks, soft risers, a restrained glitch.
- **Mix:** voice on top with the music ducked under it, −14 LUFS integrated.
</look_and_sound>

<deliverables>
All files go in `projects/railway-ai-security/`:
- **Video:** the final MP4 (1080×1920, 60 fps, H.264 yuv420p + AAC, about 60 s), plus clean WAV and SRT files.
- **Docs:**
  - FACTS.md (sources + verification notes);
  - **SOURCES_CHECKLIST.md**: the DM pack the "Comment SECURITY" CTA promises — the verified links plus a defensive checklist. Don't
    promise a DM without it;
  - captions.txt;
  - README with verification notes;
  - QA.md;
  - PROGRESS.md.
- **Cover PNG:** made from a real frame plus type in code (as with ASTRA). Also include a GPT/image-model cover prompt as an option.
- **Carousel (the reference format, built from the same components):** 8 slides at 1080×1350 (4:5), as silent 10–12 s MP4 loops plus
  PNG stills:
  1. Hook ("Hackers got into a dev cloud.")
  2. Railway: what's confirmed
  3. Railway: early findings vs not confirmed
  4. CERT-In
  5. Copilot
  6. Reuters (or the verified India/APAC swap)
  7. The checklist
  8. CTA

  Each slide uses "0X / 08" counters and the same card anatomy.
</deliverables>

<qa_gate>
- Run `python analysis/reel_qa.py <video>` (it must pass), plus ffprobe, blackdetect / freezedetect and ebur128.
- Review stills at 0, 2, 4, 15, 30, 45, 55 and 59.9 s, every case cut ±2 frames, and the full 1 fps contact sheet: safe zones,
  legibility at phone size, labels present.
- Speech-to-text on the final mix; spot-check A/V sync at the numbers and names.
- On export day, re-open every source and update FACTS.md and any changed wording (especially Railway's status), then read through
  every on-screen string.
- Report plainly what is verified, what was dropped and why, and what is scratch.
</qa_gate>

<post_kit>
Use the reference's caption cadence: one punchy line, then the lead-magnet CTA, then a follow line, then about 5 hashtags. For example:
"Ek developer cloud hack hua — aur aapki API keys bhi risk mein ho sakti hain. 🔐 / Comment 'SECURITY' aur main aapko verified sources +
AI-agent safety checklist DM karunga. / Follow @techpetrek for AI news jo developers ke kaam ki hai."
The lead magnet must exist: SOURCES_CHECKLIST.md, with the links plus a 10-point defensive checklist. Never offer exploit steps or
"the exact prompts" for jailbreaks.

Write one consistent set, India-first, every claim matching FACTS.md, and no "trending" or engagement claims:
- **Caption, short (draft):** "Railway (developer cloud, Indian Railways nahi) ne October breach confirm kiya — kuch customers ke
  secrets risk mein, keys rotate karne ki advice. 🚨 AI-key targeting company ka early finding hai, AI jailbreak confirmed nahi.
  Saath mein CERT-In advisory + 3 aur AI security cases. Comment SECURITY for sources + checklist. #RailwayApp #CyberSecurity
  #CERTIn #AIAgents #APIKeys #TechpeTrek"
- **Caption, medium:**
  - Railway's October incident in the source's own wording.
  - What is confirmed vs suspected.
  - The other cases, each with its type.
  - The 3 defensive actions.
  - The SECURITY CTA.
  - Hashtags: #RailwayApp #AIsecurity #PromptInjection #CyberSecurityIndia #CERTIn #ClaudeCode #TechpeTrek
- **Pinned comment:** "RAILWAY = developer hosting platform (railway.com), Indian Railways nahi. Official report:
  blog.railway.com/p/preliminary-report-october-security-incident — Railway recommends customers who signed up before Oct 21 rotate
  stored keys (check the latest update). Comment SECURITY for the verified source list + checklist."
- **Cover prompt (9:16, 1080×1920):** premium cinematic cybersecurity cover:
  - graphite / indigo with electric orange alert accents;
  - an abstract developer-cloud deploy dashboard with floating **redacted** ENV key cards;
  - bold headline **"RAILWAY CLOUD KE SECRETS LEAK?"**;
  - small chip "Developer cloud · not Indian Railways";
  - headline inside the central 3:4 area with 12% margins;
  - no logos, no fake screenshots, no real-looking keys.
- **Optional:** a 7-slide carousel (hook, type legend, Railway, CERT-In, breach vs research, 3 defences, CTA) and a story poll:
  "Would you give an AI agent production access?" — Yes / Only with approval / Never.
- Posting time "7:30 PM IST" is a hypothesis to test, not a verified best time.
</post_kit>
