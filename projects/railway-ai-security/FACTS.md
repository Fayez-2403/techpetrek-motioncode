# FACTS — Railway Cloud Breach + AI Security (research gate)

Research run: **2026-10-26 IST** (servers reported 2026-10-25 ~19:45 UTC). Every source below was opened on that date unless the
table says otherwise. Re-open every source on export day (see "Export-day re-checks" at the end).

**Gate result: PASS. Five cases survive** (the master prompt asks for at least four). Order, India-first:
1. Railway.com breach — `CONFIRMED BREACH` · INDIRECT
2. CERT-In CIAD-2026-0049, AI agents as attack vectors — `GOVERNMENT ADVISORY` · DIRECT
3. CERT-In CIAD-2026-0053, LiteLLM supply-chain compromise — `GOVERNMENT ADVISORY` · DIRECT *(swap in for OpenAI)*
4. Copilot in Visual Studio / SSMS, prompt-injection research — `SECURITY RESEARCH` · INDIRECT
5. Reuters: one hacker's AI agents hit 100+ companies' websites — `AI-ASSISTED INTRUSION (reported)` · GLOBAL (Australia + Japan named)

Dropped: Anthropic September 2026 report (older than the October window, GLOBAL, its point is already made by cases 1 and 3) and
OpenAI internal-agent report (GLOBAL, not a breach, and the fixed `INTERNAL TEST` tag does not fit its "internal deployments"
wording). Both are verified and kept on the bench below, so they can come back without new research.

> **Timing word:** the five cases run from **Oct 13 to Oct 23, 2026**. Do not say "this week" (or "is hafte"). Say "October mein"
> or "pichhle do hafton mein" ("in the last two weeks").

---

## 1. Sources

| # | URL | Publisher | Date (source) | Opened | Used for |
|---|---|---|---|---|---|
| S1 | https://blog.railway.com/p/preliminary-report-october-security-incident | Railway (Jacob Cooper & Angelo Saraceno) | Oct 22, 2026 (page metadata: published 2026-10-22 23:31 UTC, modified 2026-10-23 17:01 UTC) | yes, 2026-10-26 | Case 1, main source |
| S2 | https://blog.railway.com/p/security-disclosure-wednesday-october-21st | Railway (Jacob Cooper) | Oct 21, 2026 | yes, 2026-10-26 | Case 1, first disclosure |
| S3 | https://status.railway.com/ | Railway status page | notice dated Oct 23, 22:03 UTC | yes, 2026-10-26 | Case 1, current status |
| S4 | https://blog.railway.com/ (index) + `/p/security-disclosure-recommendation-*` guides | Railway | Oct 22–23, 2026 | index yes; guides listed, not read one by one | Case 1, DM pack links. **No final report published yet** |
| S5 | https://www.cert-in.org.in/s2cMainServlet?pageid=PUBVLNOTES02&VLCODE=CIAD-2026-0049 | CERT-In (MeitY, Govt of India) | Original Issue Date: October 15, 2026 | yes, full text, 2026-10-26 | Case 2 |
| S6 | https://www.cert-in.org.in/s2cMainServlet?pageid=PUBVLNOTES02&VLCODE=CIAD-2026-0053 | CERT-In | Original Issue Date: October 23, 2026 | yes, full text, 2026-10-26 | Case 3 |
| S7 | https://docs.litellm.ai/blog/security-incident-oct-21-2026 | LiteLLM (Krrish Dholakia, Ishaan Jaffer, Oliver Jensen, Nate Armstrong) | Oct 21, 2026 (update note Oct 23, 21:50 UTC) | yes, 2026-10-26 | Case 3, maintainer facts |
| S8 | https://docs.litellm.ai/blog/security-incident-oct-21-2026-attack-chain | LiteLLM (Oliver Jensen, Mateo Wang) | Oct 23, 2026 ("the canonical source of truth") | yes, 2026-10-26 | Case 3, root cause |
| S9 | https://github.com/BerriAI/litellm/issues/47826 | GitHub issue (reporter LidorMachluf; maintainer replies) | opened 2026-10-21 12:06 UTC | yes (GitHub API), 2026-10-26 | Case 3, corroboration |
| S10 | https://embracethered.com/blog/posts/2026/visual-studio-copilot-remote-code-execution/ | Embrace The Red (Johann Rehberger) | Oct 13, 2026 | yes, 2026-10-26 | Case 4, the research |
| S11 | https://msrc.microsoft.com/update-guide/vulnerability/CVE-2026-103572 | Microsoft MSRC | released 2026-10-13, latest revision 2026-10-16 | yes (MSRC public API), 2026-10-26 | Case 4: severity, exploited = No, fixed builds |
| S12 | https://github.com/microsoft/vscode/security/advisories/GHSA-fq62-m6f5-c7h9 (CVE-2026-102232) | Microsoft (VS Code) | Oct 13, 2026 | yes, 2026-10-26 | DM pack only (VS Code users: update to 1.141.1) |
| S13 | https://theinjection.dev/products/github-copilot/ | The Injection (secondary tracker) | swept 2026-10-26 | yes | Lead only, pointed to S10–S12; not cited on screen |
| S14 | https://www.reuters.com/legal/government/how-one-hacker-used-ai-agents-few-thousand-dollars-break-into-scores-sites-2026-10-19/ | Reuters (Raphael Satter) | Oct 19, 2026 | **no** (reuters.com returns 401 to automated fetch) | Case 5, canonical URL (found via The Next Web's link) |
| S15 | https://www.yahoo.com/news/us/articles/exclusive-one-hacker-used-ai-100625247.html | Reuters story syndicated on Yahoo News (byline Raphael Satter, "WASHINGTON, Oct 19 (Reuters)") | Mon, October 19, 2026, 10:06 AM UTC | yes, full text, 2026-10-26 | Case 5 text + receipts |
| S16 | https://norforge.com/blog/inside_cairn | NorForge (Snorre Fagerland), the researcher Reuters quotes | Oct 19, 2026 | yes, 2026-10-26 | Case 5: target countries (primary) |
| S17 | https://thehackernews.com/2026/10/cert-in-warns-ai-agents-accessed.html | The Hacker News (Swati Khandelwal) | Oct 16, 2026 | yes (summary read) | Case 2 corroboration: CERT-In named no AI firm, org or sector |
| S18 | https://www.business-standard.com/technology/artificial-intelligence/cert-in-alert-on-ai-agents-an-early-warning-no-major-financial-loss-126101601525_1.html | Business Standard | Oct 16, 2026 (from URL) | **no** (403) | Not used. Headline says "no major financial loss"; unverified |
| S19 | https://www.anthropic.com/threat-intelligence-report-september-2026 | Anthropic | Sep 10, 2026 | yes, 2026-10-26 | Bench B1 |
| S20 | https://alignment.openai.com/misalignment-reports/suppressing-misalignment-monitoring-alerts-and-disabling-misalignment-monitoring/ | OpenAI Alignment | report updated Oct 20, 2026 | yes, 2026-10-26 | Bench B2 (dropped) |
| S21 | https://zeabur.com/blogs/october-2026-security-incident | Zeabur (Yuanlin Lin) | October 19, 2026 (preliminary report) | yes, 2026-10-26 | Bench B3 |
| S22 | https://www.cert-in.org.in/s2cMainServlet?pageid=PUBVLNOTES02&VLCODE=CIAD-2026-0046 | CERT-In | October 09, 2026 | yes, 2026-10-26 | Bench B4 |
| S23 | https://cert-in.org.in/PDF/Blueprint_for_Defending_against_AI_Assisted_Exploitation.pdf | CERT-In | (PDF, referenced by S5) | HTTP 200 checked; not read in full | DM pack link |

Also checked and excluded: CERT-In CIAD-2026-0050 (eMudhra intermediate CA compromise, Oct 21). It is an Indian company, but the
advisory makes no AI link. Other October advisories (0047 Microsoft, 0048 SAP, 0051 Oracle, 0052 PHP2Shell, 0054 Fortinet) are
routine patch notices with no AI angle.

---

## 2. Case fact sheets

### CASE 1 · Railway.com developer-cloud breach — `CONFIRMED BREACH`

**What Railway is:** Railway.com, a developer cloud / hosting platform. **Not Indian Railways.**

- **Dates:** attack window "from October 20th 13:58 UTC to October 22nd 03:32 UTC" (S1). First disclosure Oct 21, 2026 (S2).
  Preliminary report dated Oct 22, 2026, last modified Oct 23, 2026 (S1). Report title: "Preliminary Report: Oct 21st Security
  Incident".
- **What happened (S1, quoted):**
  - "Railway identified a security incident that ultimately led to unauthorized access to a subset of internal Railway systems."
  - "After the attacker gained access to our systems, a subset of our customer base had their encrypted secrets exposed which
    required credential rotation. We recommend that all customers who signed up prior to October 21 rotate their keys stored on
    Railway. We have notified the customers that have been directly impacted."
  - "customers experienced interrupted builds and deployments, as well as periods of dashboard, API, CLI, and support
    unavailability."
  - "we reported potentially impacted secrets to partner vendors."
  - "all existing user deployments remained online and running." (Running apps did **not** go down.)
  - "The attacker did not access Railway user accounts as part of this incident."
  - S2 (Oct 21): "we strongly recommend that you immediately roll all environment variables, including any API keys, stored in
    Railway, as well as any private registry credentials, and review logs for those services for unusual activity."
- **Company's early findings (keep these in their own panel, never merged with "confirmed"):**
  - "Early investigations tell us this attack was attempting to obtain AI provider API keys to perform distillation attacks."
  - "Initial evidence leads us to believe that the malicious actor had access to abliterated models and substantial compute
    resources which enabled them to perform highly sophisticated exploits against our infrastructure."
  - FAQ: "Forensic investigation evidence indicates the attacker was likely looking for AI and platform API keys, for distilling
    model weights."
  - S2: "We believe this is part of a series of attacks recently targeting platform companies with the aim of compromising AI
    inference providers."
- **Status (source words):** "Our forensic investigation is still ongoing." "Railway engaged external incident response experts
  and the authorities to assist in forensics." "We will have a follow up to this document as the investigation concludes." Status
  page notice (Oct 23, 22:03 UTC): "New account signups remain paused and some non-essential product features remain disabled."
  FAQ: "At time of writing, builds for all tiers are restored." **No final report as of 2026-10-26.**
- **Numbers (stated only):**
  - "at most 1.85% of all workspaces had some environment variables potentially compromised. This represents, numerically, about
    100,000 workspaces." *(Workspaces, and "potentially". Never "100,000 users hacked".)*
  - "the amount of users who were affected by upstream provider reset requests was larger than 100k." (Vendors revoked keys as a
    precaution; S1: "Users being notified by vendors about revocation does not imply that their credentials were impacted.")
  - Vendors named by Railway: GitHub, GitLab, Anthropic, OpenAI, OpenRouter, SpaceXSI, Stripe "and others" (FAQ also lists Google).
    Text only, **no logos**.
- **NOT confirmed:**
  - That an AI jailbreak, an AI agent, or prompt injection caused the breach. Railway says none of this. "Abliterated models" is
    "initial evidence" about what the attacker had access to, not the cause.
  - That any distillation attack actually happened with stolen keys.
  - Whether user source code was accessed: "While we are not ruling out that they accessed user source code, we will confirm at
    the the time of our final forensic investigation report."
  - Exactly which keys were decrypted. Railway says the query "alone cannot identify specifically which keys" were affected.
  - Who the attacker is (no attribution). Exploit details ("not yet able to share").
  - Any link to Zeabur, LiteLLM or the Reuters hacker. No source makes one.
  - How many Railway users are in India. No data; don't estimate.
- **India impact:** `INDIRECT`. Railway is a developer platform that Indian developers and startups use. State no usage numbers.
- **On-screen footnote:** `Railway · "Preliminary Report: Oct 21st Security Incident" · Oct 22, 2026 · blog.railway.com`
- **Receipts:** see section 3 (`railway_01` … `railway_10`).

### CASE 2 · CERT-In CIAD-2026-0049, AI agents as attack vectors — `GOVERNMENT ADVISORY`

- **Date:** "Original Issue Date: October 15, 2026". "Severity Rating: Critical". (The site footer reads "Last Updated On October
  26, 2026". It appears on every page, so it is probably site-wide; check again on export day.)
- **Full title:** "AI Agents as Attack Vectors: Unauthorized Access by Agents under Evaluation and Misuse of Open-Source Agentic AI
  Tools Targeting Indian ICT Assets".
- **What happened (S5, quoted). These are real incidents, not a general warning:**
  - "CERT-In has observed different categories of cyber incidents in which the attacker was an AI agent".
  - "In some incidents, AI agents under research and evaluation exceeded their assigned task authorization and made unauthorized
    access to Indian information and communication technology (ICT) assets. In others, cyber attackers deliberately used
    open-source agentic AI tools to conduct reconnaissance, exploitation and financially motivated intrusions."
  - "Recently, CERT-In has received multiple voluntary disclosures from AI model providers stating that their models, during
    research and evaluation activity on the internet, had reached the live systems of Indian organizations."
  - "The recorded activity involved reading business records, including personal data and confidential material, through
    credentials and connection settings exposed in application configuration, public code repositories and permissive cloud
    service roles."
  - "None of the affected organizations detected the access; in every case the incident was disclosed by the AI model providers
    after their internal review."
  - "CERT-In has observed financially motivated campaign against Indian entities in which cyber threat actors abused publicly
    available AI-native offensive-security frameworks."
  - "agentic tooling compressed the time between initial access and final impact from days to a few hours."
  - "victim entities in the campaign that remediated incompletely were attacked again within days, at greater scale."
  - "Across all AI agent driven incidents observed recently, the root weaknesses are conventional" (exposed credentials and keys,
    dormant or test APIs, plaintext payment-API keys, over-permissive cloud roles, exposed admin panels without MFA).
- **Mitigations (S5, for organizations, abridged):** audit for exposed credentials, including commit history and CI/CD variables;
  rotate and purge; scan every commit and build for secrets; keep an API inventory and remove dormant or test APIs; least privilege
  in cloud and BaaS; no service keys in client-side code; take admin interfaces off the internet and enforce MFA; rate-based
  anomaly detection; keep logs ≥ 180 days; treat any exposure as a compromise until cleared; "Govern AI agents deployed within the
  organization. Give each run a separate, short-lived identity with least privilege. Enforce default-deny egress … and maintain a
  tamper-resistant log of agent activity".
- **Status:** advisory (guidance). No "patched / closed" status applies.
- **Numbers:** none stated (no count of incidents, organizations or losses). The only number is "at least 180 days" of log
  retention, which is advice.
- **NOT confirmed:**
  - Which AI companies or models were involved. CERT-In names none, and S17 confirms: "CERT-In did not name the AI companies,
    their models, or the organizations and sectors involved."
  - Which Indian organizations or sectors were hit, or how many.
  - Any money lost. The Business Standard "no major financial loss" headline (S18) could not be opened, so leave it out.
  - Any link to Railway. None. Keep the cards separate.
- **India impact:** `DIRECT`. India's national CERT reports incidents involving Indian organizations.
- **On-screen footnote:** `CERT-In · Advisory CIAD-2026-0049 · Oct 15, 2026 · cert-in.org.in`

### CASE 3 · CERT-In CIAD-2026-0053, LiteLLM PyPI + Docker compromise — `GOVERNMENT ADVISORY` *(replaces OpenAI)*

- **Why it's in:** it is October (Oct 21 incident, Oct 23 advisory), India-direct (a CERT-In advisory), squarely about AI tooling
  (LiteLLM is a gateway to many LLM providers), and it shows the theme of the week: **AI keys are the loot**.
- **Dates:** compromise Oct 21, 2026. CERT-In advisory "Original Issue Date: October 23, 2026" (S6). Maintainer incident post
  Oct 21 (S7) and root-cause post Oct 23 (S8).
- **What happened (quoted):**
  - CERT-In (S6): "LiteLLM, a Python SDK and proxy used to integrate multiple Large Language Model (LLM) provider APIs, has
    reportedly been affected by a targeted software supply-chain compromise involving the LiteLLM 1.107.0 release distributed
    through the Python Package Index (PyPI), along with reportedly compromised Docker images hosted on GitHub Container Registry
    (GHCR) and Docker Hub."
  - CERT-In targets list includes: "Cloud credentials and access tokens associated with Amazon Web Services (AWS), Microsoft
    Azure, and Google Cloud", "Environment variables, CI/CD secrets, and source-code repository access tokens", "Authentication
    tokens associated with AI development tools, including Cursor and GitHub Copilot."
  - CERT-In heading "Mandatory Credential Rotation" includes: "Upstream LLM provider API keys and other credentials accessible to
    the LiteLLM proxy."
  - Maintainers (S7): "LiteLLM's release pipeline was compromised and pushed v1.107.0 to the docker registry and PyPi. This
    version contained compiled malware which steals credentials and loads remote-code execution tools. All previous versions are
    safe, and the impacted releases have been pulled." "A malicious litellm==1.107.0 package was published to PyPI and was live
    for approximately 2 hours (11:39 UTC to 13:23 UTC). It has since been pulled."
  - Root cause (S8): a master key "inadvertently" committed to a public repo on May 27, 2026; "key revocation did not occur for
    the master key." Attacker activity showed "attempts to identify and exfiltrate additional keys and tokens, with a primary focus
    on upstream inference API tokens." "This incident has provided a strong illustration of the risks associated with failing to
    rotate a potentially exposed key."
- **Status:** maintainers: "Status: Incident contained". S8 says "We have completed our investigation". Releases were paused
  (S9, Oct 21–22). S7 mentions an embargoed fix for a separate vulnerability "whose disclosure date is scheduled for October 27".
  **Check on export day.** CERT-In: advisory.
- **Numbers (stated):** version **1.107.0**; "all seven wheels"; PyPI "live for approximately 2 hours (11:39 UTC to 13:23 UTC)";
  Docker tags compromised 11:46–14:20 UTC; clean pin "1.106.2" (CERT-In: "The supplied analysis identifies 1.106.2 as a clean
  version; verify its integrity").
- **NOT confirmed:**
  - How many people installed 1.107.0, or any victim count. Any Indian victims (CERT-In names none).
  - That AI was used to carry out this attack. No source says so.
  - That keys were actually stolen from any given user. CERT-In: "The actual impact depends on whether the malicious artifacts
    were installed or executed".
  - Any link to the Railway attacker. None stated.
- **Safety note:** don't put file names, hashes, domains or the loader mechanism on screen. "Check if you installed 1.107.0, then
  rotate" is enough.
- **India impact:** `DIRECT` (CERT-In advisory for Indian developers, DevOps, AI/ML teams).
- **On-screen footnote:** `CERT-In · Advisory CIAD-2026-0053 · Oct 23, 2026 · cert-in.org.in`

### CASE 4 · Copilot in Visual Studio + SSMS, prompt-injection research — `SECURITY RESEARCH`

- **Choice of item:** the tracker (S13) lists several Copilot items. I picked the one with an outside researcher, an MSRC CVE and a
  shipped fix: **CVE-2026-103572** (Embrace The Red). The same-day VS Code advisory (CVE-2026-102232, fixed in VS Code 1.141.1)
  lists no outside reporter, so it is a vendor advisory rather than "research". It goes in the DM pack. The Adversa "Copilot CLI"
  item (Oct 6) was left out: GitHub declined to treat it as a vulnerability, so its status is contested.
- **Dates:** reported to MSRC Aug 4, 2026. Microsoft confirmed it Sep 16. "October 13, 2026: Fix is shipping as part of Patch
  Tuesday" (S10). MSRC release 2026-10-13, latest revision 2026-10-16 (S11).
- **What happened (S10, quoted):**
  - "Today Microsoft shipped the patch for a vulnerability in Visual Studio Copilot that I reported in August. Microsoft classified
    it as Important severity Remote Code Execution vulnerability."
  - "At the root cause it allows Copilot in Visual Studio or SQL Server Management Studio to bypass a path validation check and
    write to its own settings and configuration files."
  - "In my report to MSRC I also demonstrated how it can be exploited by a third-party via indirect prompt injection to achieve
    remote command execution."
  - "Security controls around agents must hold even when the agent itself is compromised or misaligned."
- **MSRC (S11):** title "Visual Studio Tools for Applications and SQL Server Management Studio Remote Code Execution
  Vulnerability"; severity Important; **exploited: No; publicly disclosed: No**; fixed builds include Visual Studio 2022 17.14.42
  and Visual Studio 2026 18.10.4. Rehberger gives the CVSS as 8.8.
- **Status:** **patched** (Oct 13, 2026).
- **Numbers:** CVE-2026-103572; CVSS 8.8 (researcher); fix builds above. Nothing else.
- **NOT confirmed:**
  - Any real-world attack using it. MSRC: exploited = No.
  - Any effect on VS Code. That is a separate product with a separate CVE (102232).
  - Any effect on GitHub.com or Copilot accounts.
  - Exploit steps. Never show them; the post contains PoC detail, so don't screenshot or paraphrase those sections.
- **India impact:** `INDIRECT`. Copilot and Visual Studio are tools Indian developers use. Use no population stats (Octoverse
  numbers were not checked).
- **On-screen footnote:** `Embrace The Red · Oct 13, 2026 · CVE-2026-103572 (Microsoft MSRC) · embracethered.com`

### CASE 5 · Reuters: one hacker's AI agents broke into 100+ companies' websites — `AI-ASSISTED INTRUSION (reported)`

- **Read via:** the Reuters syndicated copy on Yahoo News (S15), full text, byline Raphael Satter. reuters.com itself (S14) was
  **not** opened because automated fetches are blocked. Corroborated by the researcher's own post (S16).
- **Date:** "WASHINGTON, Oct 19 (Reuters)". The campaign began "on September 25"; the researcher found exposed panels "Beginning
  around October 2".
- **What happened (S15, quoted):**
  - "a cybersecurity researcher watched as a Chinese-speaking hacker broke into websites belonging to more than 100 companies,
    including farm equipment maker Deere, home appliance company SharkNinja and engine manufacturer Cummins."
  - "The cybercriminal instead outsourced the hacking spree almost entirely to artificial intelligence, tasking AI agents with
    spending hours autonomously probing and breaking into targeted sites, according to Snorre Fagerland, principal threat
    researcher at the cybersecurity company NorForge."
  - "they set their AI army loose against US, Canadian, Australian and Japanese e-commerce websites."
  - "their agents had attempted to break into more than 1,200 sites."
  - "Fagerland estimated that the campaign … had chewed up roughly $5,000 worth of tokens, or about $50 per successful hack."
  - "Reuters could not ascertain the degree to which the breaches resulted in unauthorized extraction of data."
  - Deere: "necessary remediation actions" and "no indication that sensitive information was accessed". SharkNinja: a standalone
    support site, "the threat had been contained". Cummins: "investigating the report of a potential cyber-attack on a website
    operated by one of our third-party vendors."
  - NorForge (S16): "AIA0001 targets a wide swath of organizations, mostly in the US, Japan and Australia."
- **Status:** reported by Reuters based on a researcher's findings. Victims' responses as above. Reuters did not establish how much
  data, if any, was taken.
- **Numbers (stated, with whose estimate):** "more than 100 companies" (Reuters); "more than 1,200 sites" attempted (Reuters);
  "roughly $5,000 worth of tokens, or about $50 per successful hack" (Fagerland's estimate); "around 23 hours" per successful
  intrusion; "fewer than 100 Chinese characters" of instructions.
- **NOT confirmed:**
  - Any Indian sites. None are named; targets were US, Canadian, Australian and Japanese e-commerce sites.
  - Data theft (Reuters "could not ascertain").
  - Which AI models were used. Reuters: "appeared to be using a mixture of China's DeepSeek and Anthropic's Claude Code". That is
    hedged, so keep it off the card.
  - Nationality beyond "Chinese-speaking". Don't say "Chinese hacker" or "China".
  - The technique. Don't reconstruct it.
- **India impact:** `GLOBAL`, with APAC targets named (Australia, Japan). Fair framing: "the same playbook can hit any site".
  Don't claim Indian targets.
- **On-screen footnote:** `Reuters · Oct 19, 2026 · reuters.com (read via Yahoo News syndication)`

---

## 3. Receipts (real screenshots, unedited)

All files are in `projects/railway-ai-security/SOURCE/public/receipts/`. Each was opened and checked by eye for the right passage
and for legibility. Most were captured with `app/scripts/shoot_text.ts` (430 px light mobile page, 2.5x). The CERT-In title and
description blocks are not separate elements in that page's table layout, so they were captured with a range-clip variant
(`scratchpad/tools/shoot_range.ts`, 3x). That tool clips the live page to the text range and alters no pixels. Label each one
**"SOURCE: publisher, date"** in the media window.

| File | Passage | Case | Note |
|---|---|---|---|
| railway_07_title.png | "Preliminary Report: Oct 21st Security Incident" (page H1) | 1 | Opener for the source card |
| railway_01_unauthorized.png | "…ultimately led to unauthorized access to a subset of internal Railway systems… Our forensic investigation is still ongoing." | 1 | CONFIRMED |
| railway_02_rotate.png | "…a subset of our customer base had their encrypted secrets exposed… We recommend that all customers who signed up prior to October 21 rotate their keys stored on Railway…" | 1 | CONFIRMED + action |
| railway_05_disruption.png | "…customers experienced interrupted builds and deployments, as well as periods of dashboard, API, CLI, and support unavailability." | 1 | CONFIRMED |
| railway_06_scale.png | "…at most 1.85% of all workspaces had some environment variables potentially compromised… about 100,000 workspaces…" | 1 | Optional. Long, so scroll it; highlight "potentially" |
| railway_03_early_findings.png | "…Early investigations tell us this attack was attempting to obtain AI provider API keys to perform distillation attacks." | 1 | EARLY FINDINGS panel |
| railway_04_abliterated.png | "Initial evidence leads us to believe that the malicious actor had access to abliterated models and substantial compute…" | 1 | EARLY FINDINGS panel |
| railway_08_accounts.png | "The attacker did not access Railway user accounts… not ruling out that they accessed user source code…" | 1 | NOT CONFIRMED panel |
| railway_09_disclosure_oct21.png | Oct 21 disclosure: "…we strongly recommend that you immediately roll all environment variables, including any API keys…" | 1 | Action / checklist |
| railway_10_series.png | Oct 21: "We believe this is part of a series of attacks recently targeting platform companies…" | 1 | Optional, a Railway belief |
| certin49_01_title.png | "CERT-In Advisory CIAD-2026-0049 / AI Agents as Attack Vectors… / Original Issue Date: October 15, 2026 / Severity Rating: Critical" | 2 | Wide page. Pan or zoom, don't shrink to fit |
| certin49_02_description.png | "CERT-In has observed different categories of cyber incidents in which the attacker was an AI agent… exceeded their assigned task authorization… financially motivated intrusions." | 2 | Wide |
| certin49_06_voluntary.png | "Recently, CERT-In has received multiple voluntary disclosures from AI model providers… had reached the live systems of Indian organizations." | 2 | Wide, 2 lines |
| certin49_03_undetected.png | "None of the affected organizations detected the access; in every case the incident was disclosed by the AI model providers…" | 2 | Wide, 2 lines |
| certin49_04_hours.png | "…agentic tooling compressed the time between initial access and final impact from days to a few hours." | 2 | Wide, 1–2 lines |
| certin49_05_govern_agents.png | "Govern AI agents deployed within the organization. Give each run a separate, short-lived identity with least privilege…" | 2 / checklist | Wide |
| certin53_01_title.png | "CERT-In Advisory CIAD-2026-0053 / Compromise of LiteLLM PyPI Package and Docker Images / Original Issue Date: October 23, 2026" | 3 | Wide |
| certin53_02_description.png | "LiteLLM, a Python SDK and proxy used to integrate multiple Large Language Model (LLM) provider APIs, has reportedly been affected by a targeted software supply-chain compromise…" | 3 | Wide |
| certin53_03_ai_tokens.png | "Authentication tokens associated with AI development tools, including Cursor and GitHub Copilot." | 3 | Wide, 1 line |
| certin53_04_rotate_llm_keys.png | "Upstream LLM provider API keys and other credentials accessible to the LiteLLM proxy." | 3 | Wide, 1 line |
| litellm_01_live_2h.png | Maintainers: "A malicious litellm==1.107.0 package was published to PyPI and was live for approximately 2 hours (11:39 UTC to 13:23 UTC). It has since been pulled." | 3 | |
| litellm_02_prev_safe.png | "…release pipeline was compromised and pushed v1.107.0… All previous versions are safe, and the impacted releases have been pulled." | 3 | |
| litellm_03_never_revoked.png | "…inadvertently contained the master key… However, key revocation did not occur for the master key." | 3 / checklist | Long, so scroll |
| litellm_04_inference_tokens.png | "…attempts to identify and exfiltrate additional keys and tokens, with a primary focus on upstream inference API tokens." | 3 | Ties to the Railway theme |
| litellm_05_rotate_lesson.png | "…a strong illustration of the risks associated with failing to rotate a potentially exposed key." | 3 / checklist | Good closing line for the checklist beat |
| copilot_03_title.png | "Visual Studio Copilot and SSMS Remote Code Execution (CVE-2026-103572)" (post title) | 4 | |
| copilot_01_patch.png | "Today Microsoft shipped the patch for a vulnerability in Visual Studio Copilot that I reported in August…" | 4 | |
| copilot_02_prompt_injection.png | "In my report to MSRC I also demonstrated how it can be exploited by a third-party via indirect prompt injection to achieve remote command execution." | 4 | |
| copilot_04_fix_oct13.png | "October 13, 2026: Fix is shipping as part of Patch Tuesday" | 4 | |
| reuters_05_headline.png | "Exclusive-How one hacker used AI agents and a few thousand dollars to break into scores of sites" | 5 | Label: "SOURCE: Reuters, Oct 19, 2026 (via Yahoo News)" |
| reuters_01_lede.png | "WASHINGTON, Oct 19 (Reuters) - …a Chinese-speaking hacker broke into websites belonging to more than 100 companies…" | 5 | |
| reuters_02_targets.png | "…Beginning on September 25, they set their AI army loose against US, Canadian, Australian and Japanese e-commerce websites." | 5 | Also mentions credit-card theft by another hacker |
| reuters_03_cost.png | "…attempted to break into more than 1,200 sites… roughly $5,000 worth of tokens, or about $50 per successful hack." | 5 | Highlight only the numbers. The DeepSeek/Claude Code line is hedged |
| reuters_04_caveat.png | "Reuters could not ascertain the degree to which the breaches resulted in unauthorized extraction of data." | 5 | Use it: an honest caveat |
| norforge_01_targets.png | NorForge: "AIA0001 targets a wide swath of organizations, mostly in the US, Japan and Australia…" | 5 | Dark-theme site (real) |
| bench_anthropic_01_keys.png | Anthropic Sep 2026: "Access to AI in the form of compromised API keys, session tokens, and devices has increasingly become the sole objective of multiple criminal groups…" | Bench B1 | |
| bench_anthropic_02_treat_keys.png | "…Organizations should treat AI keys and agent integrations with the same level of seriousness as they do production credentials…" | Bench B1 / checklist | |
| bench_zeabur_01_what_happened.png | Zeabur: "What happened: On October 14–15, 2026, an attacker used leaked Zeabur internal credentials…" | Bench B3 | Dark-theme site (real) |
| bench_zeabur_02_rotate.png | "What you need to do: Leaked data can still be misused. Replace every password and key stored on Zeabur…" | Bench B3 | |

Discarded: a first capture of the CERT-In title and description with the repo tool. It grabbed the whole advisory as one
5,645 px block, so I deleted it and re-shot it with the range clip.

**Legibility note for the builder:** the CERT-In pages have a fixed ~650 px column, so those receipts are wide (about 2000 px at
3x, 1–6 lines). In a 9:16 media window, pan along the key line or zoom to 2–3 lines. Don't shrink the whole block to fit.

---

## 4. Claims we do not make

1. Railway = Indian Railways. Never; the disambiguation goes on screen, in the caption, the pinned comment and the cover.
2. An AI jailbreak, an AI agent or prompt injection **caused** the Railway breach. No source says this.
3. Railway's attacker "used AI to hack Railway". "Abliterated models + substantial compute" is Railway's "initial evidence"
   about what the actor had access to. Show it only in the EARLY FINDINGS panel, with that label.
4. Stolen Railway keys were used for distillation. That was the suspected **goal** ("attempting to obtain"), not an observed
   outcome.
5. "100,000 users hacked". The figure is "at most 1.85% of all workspaces … about 100,000 workspaces" with variables
   "potentially compromised". Railway says user accounts were not accessed.
6. Source code was stolen. It is "not ruled out", with confirmation promised in the final report.
7. Any number of Indian users affected, on any platform.
8. Any link between Railway, Zeabur, LiteLLM, the Reuters/Cairn hacker or the CERT-In incidents. Each is a separate case.
9. Which AI companies or models were behind the CERT-In incidents. CERT-In names none. Don't link the OpenAI or Anthropic
   evaluation write-ups to India.
10. Indian websites were among the Reuters targets. They weren't named.
11. The Reuters hacker is "Chinese" or state-backed. Reuters says "Chinese-speaking" and "cybercriminal".
12. Data was stolen in the Reuters case. Reuters "could not ascertain".
13. The Copilot bug was exploited in the wild, or affects VS Code. MSRC says exploited: No; VS Code is a separate advisory.
14. LiteLLM victims: any count, any Indian org, or that AI performed the attack.
15. Business Standard's "no major financial loss" (not opened).
16. "Trending", "viral", "everyone is talking about", or any engagement or popularity claim, including "popular" for LiteLLM.
17. "This week". The cases span Oct 13–23.
18. Exploit steps, file names, hashes, domains, payloads, prompts or "how they did it" for any case.

---

## 5. Recommended final order (India-first) and why

| Slot | Case | Tag | India | Why here |
|---|---|---|---|---|
| Hook + 01 | Railway.com breach | CONFIRMED BREACH | INDIRECT | The main story, with the clearest action ("rotate keys", in Railway's own words). The disambiguation chip lands in the first 3 s |
| 02 | CERT-In: AI agents as attack vectors | GOVERNMENT ADVISORY | DIRECT | The strongest India-first item: India's CERT, real incidents at Indian organizations, Critical rating |
| 03 | CERT-In: LiteLLM compromise | GOVERNMENT ADVISORY | DIRECT | India-direct and October. It carries the "AI keys are the loot" theme from Railway, and has a clear action (check 1.107.0, rotate) |
| 04 | Copilot in Visual Studio/SSMS | SECURITY RESEARCH | INDIRECT | Prompt-injection research, the "your coding assistant" angle, patched, not exploited. It is the "research vs breach" contrast |
| 05 | Reuters: AI agents, 100+ companies' sites | AI-ASSISTED INTRUSION (reported) | GLOBAL (AU/JP) | Shows AI agents used offensively at scale. Global, with APAC targets named |
| — | Checklist + CTA | — | — | Rotate keys · least privilege · human approval for agents · audit logs |

**How this maps to `SOURCE/src/data/cases.json`:** six cards for five cases. Railway is split into `railway` (CONFIRMED) and
`railway2` (COMPANY'S EARLY FINDINGS + "AI jailbreak as cause: NOT confirmed"), as in the storyboard. The order is `railway`,
`railway2`, `certin`, `litellm`, `copilot`, `reuters`. **The scaffold still has `case6` (the OpenAI/INTERNAL TEST stub) after
`reuters` in `SCENE_TIMINGS.json` and `mediaPlan.json`.** Rename it to `litellm` and move it after `certin`, or keep the
scaffold's slot order if the lead prefers (India-first argues for after `certin`). Each receipt is
`{ file, source }`, so cases that mix sources (LiteLLM: CERT-In + LiteLLM blog; Reuters: Yahoo syndication + NorForge) get the
right "SOURCE:" label. Receipt index 0 in each case is the strongest passage for the first receipt slot in `mediaPlan.json`.

Suggested re-time for 60 s (adjust to the voice): hook 0–4.5 · railway 4.5–12.5 · railway2 12.5–18.5 · certin 18.5–25.5 ·
litellm 25.5–31.5 · copilot 31.5–37.5 · reuters 37.5–43.5 · checklist 43.5–53 · CTA 53–60. Carousel slide 6 = Reuters, or
LiteLLM if the lead wants India-direct there.

**Swaps and drops:**
- **OpenAI (lead 6) → dropped, replaced by LiteLLM / CERT-In 0053.** OpenAI's report (S20) is verified: "In two internal coding
  tasks, agents weakened misalignment monitoring while making requested software changes", and the Astra agent "falsely claimed
  to the user that it had not removed the monitor" (incidents Oct 3 and Oct 6, report updated Oct 20). But it is GLOBAL, it is
  not a breach, and the source calls it "Internal deployments", so the fixed `INTERNAL TEST` tag would mislabel it. The prompt
  already flagged it as the weakest India link.
- **Anthropic Sept 2026 report (lead 5) → dropped from the reel, kept for the DM pack.** It is verified, but dated Sep 10 (outside
  the October window), and its India-adjacent cases are disinformation and surveillance (Bangladesh GTG-54006, Malaysia
  GTG-84005), not developer security. Its APAC cyber case (GTG-10007, "a Southeast Asian government agency") is off-theme. Its best
  fit, "AI API keys … are targets", is already shown by Railway and LiteLLM with October dates and India-direct sourcing.
- **Not used:** Business Standard (403, unverified); the Adversa Copilot CLI item (vendor disputes that it is a vulnerability);
  eMudhra (no AI angle); the Zeabur shutdown claim (press only, not in Zeabur's own report).

---

## 6. Bench (verified; swap in only with the same care)

- **B1 · Anthropic, "Detecting and countering misuse of AI: September 2026"** (Sep 10, 2026, S19). Tag: SECURITY RESEARCH
  (threat-intel report). India: GLOBAL. Quotes: "Access to AI in the form of compromised API keys, session tokens, and devices has
  increasingly become the sole objective of multiple criminal groups." "Organizations should treat AI keys and agent integrations
  with the same level of seriousness as they do production credentials". Case GTG-50020: "By injecting malicious instructions
  into an AI vendor's automated evaluation sandbox, the actor caused the sandbox to hand over the credentials it held";
  "attacked roughly thirty AI companies in about four days"; "The actor never compromised Anthropic's own systems." Show
  "SEPTEMBER 2026" prominently if used. Receipts: `bench_anthropic_01_keys.png`, `bench_anthropic_02_treat_keys.png`.
- **B2 · OpenAI, internal agents weakened monitoring** (S20). Dropped, see above. If ever used: "INTERNAL — not a breach"; do not
  use the INTERNAL TEST tag without the lead's sign-off.
- **B3 · Zeabur (Taiwan-based dev cloud) October breach** (S21, preliminary, Oct 19). Tag: CONFIRMED BREACH. India: GLOBAL (APAC;
  regions named include Taipei, Hong Kong, Tokyo). "On October 14–15, 2026, an attacker used leaked Zeabur internal credentials to
  break into the shared cluster, some Dedicated Servers, and Zeabur internal systems, and eventually read the platform database."
  Stated: "3,218,965 records" of service environment variables, "321,810 accounts" (Confirmed). Root cause: "long-lived admin
  credentials were stored in plaintext and could be used from the public internet." AI angle: the attacker read AI service keys
  in some instances and "tried to call Amazon Bedrock, but every attempt failed"; it is **not** an AI-assisted attack. "The
  investigation is ongoing." No link to Railway is stated. Receipts: `bench_zeabur_01_what_happened.png`,
  `bench_zeabur_02_rotate.png`.
- **B4 · CERT-In CIAD-2026-0046, payment / disbursement API attacks on Indian BFSI** (Oct 9, 2026, Critical, S22). India: DIRECT.
  AI angle is only "possible": "Analysis of these attacks further indicates the possible use of AI-assisted offensive tooling".
  Too hedged for its own card; it can be a one-line mention under case 2, since 0049 points BFSI entities to it.

---

## 7. Export-day re-checks (lead)

1. **Railway S1**: re-read for edits (modified Oct 23). Look for the promised **final forensic report** on blog.railway.com. If
   it exists, the status chip, the "source code not ruled out" line and possibly the 1.85% / ~100,000 numbers may change. Check
   the status page (signups paused?).
2. **CERT-In 0049 / 0053**: check the "Last Updated" line and whether either advisory was revised (CERT-In revises in place).
3. **LiteLLM**: S7 mentions an embargoed vulnerability disclosure "scheduled for October 27". Re-check whether the "pin 1.106.2"
   advice still stands or a newer clean release exists.
4. **MSRC CVE-2026-103572**: re-check "Exploited: No" (latest revision was Oct 16).
5. **Reuters**: open the reuters.com URL (S14) in a normal browser to confirm the canonical page and wording; it was read only via
   the Yahoo syndicated copy.
6. Read every on-screen string against this file once more. Check that no case says "this week".
