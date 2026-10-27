# GitHub package firewall reel: fact sheet

Every claim in the voice, captions and on-screen copy must trace to a line here. Checked 2026-10-21.

## Sources
1. GitHub Changelog, "GitHub package firewall in public preview", 2026-10-20 (Release):
   https://github.blog/changelog/2026-10-20-github-package-firewall-in-public-preview/
2. GitHub Docs, "Protecting endpoints with package firewall":
   https://docs.github.com/enterprise-cloud@latest/code-security/how-tos/secure-your-supply-chain/secure-your-dependencies/protecting-endpoints-with-package-firewall
3. GitHub Docs, supply-chain security hub (no firewall content; context only): https://docs.github.com/en/code-security/supply-chain-security/

On-screen source credit: **GitHub Changelog • Oct 20, 2026**.

## Verified facts (source)
| # | Fact | Source |
|---|---|---|
| F1 | Package firewall is in **public preview** for **all GitHub Enterprise Cloud** customers, including **GitHub Enterprise Cloud with data residency**. | 1 |
| F2 | It is **free during the preview**; at general availability it **will be charged on metered usage, similar to Actions billing**. | 1 |
| F3 | It **sits between endpoints (like Actions runners or coding agents) and the upstream package repositories**, and inspects **both metadata requests and package downloads**. | 1 |
| F4 | Its purpose: malware that exploits systems **at package installation time**. | 1 |
| F5 | **Currently it only supports npm packages.** No other ecosystem is named as planned. | 1 |
| F6 | Admins set policy controls for their enterprise: a **configurable cooldown period**; **checks against the GitHub Advisory Database** for malware or vulnerability alerts; **supply-chain checks such as attestation downgrades**. | 1 |
| F7 | Endpoints (coding agents, CI/CD hosts) **must be configured** to send requests through the firewall instead of directly to the upstream registry. It is not automatic. | 1, 2 |
| F8 | A package blocked in error can get an **exception request** ("Request an override" link in the npm output or CI log). | 1, 2 |
| F9 | Docs policy names and defaults: **Block known malware** (On), **Block vulnerability advisories** (Critical only), **Block attestation downgrades** (On), **Block newly-introduced install scripts** (On), **Minimum package age** 1–365 days (default **1 day**, 0 disables). | 2 |
| F10 | Configured by **enterprise security managers and enterprise administrators** (or a custom role with the fine-grained permission). | 2 |
| F11 | Endpoints connect via an enterprise npm registry URL plus a token in the user-level `.npmrc` (or `npm config set`). Artifactory routing is **experimental**. | 2 |
| F12 | The feature is in public preview and "subject to change". | 2 |
| F13 | Install-time malware attacks are "harvesting credentials on CI/CD hosts or developer workstations without even running the package's code" (GitHub's own words; v2 quotes them, attributed). | 1 |
| F14 | The docs' example of a blocked install: `npm notice testcontainers: 1 version blocked by package-firewall due to security policies (version cooldown). Request an override: https://github.com/enterprises/octocats/security/bypass-requests/package-firewall/new?ecosystem=npm&package=testcontainers` (a cooldown block, not malware; shown labelled "example output from GitHub Docs", with "reason: version cooldown"). The override form asks for repository, ecosystem, package name, version, reason. | 2 |

## Claims we must NOT make
- It blocks all malware, or makes installs "safe".
- It protects everyone automatically (it needs enterprise admin policy plus endpoint configuration: F7).
- It supports PyPI or any ecosystem other than npm (F5).
- It is free forever (free during preview only: F2).
- Any real incident, real malicious package name, or real victim. All bad packages on screen are fictional and generic.

## Script line → fact (v3, 2026-10-21; v2 was the same without the first line, with "mutabik" and "waqt")
| Line (Roman Hinglish caption) | Fact |
|---|---|
| Kya aap bhi wahi npm i ka istemal karte ho? Agar haan, toh ye dekhen... | (a question to the viewer; the caution styling is a hook device, it claims no incident) |
| Ek npm install, aur saath mein aa jaate hain dher saare packages. Ek bhi kharab nikla, toh? | (a question; npm installs bring dependencies, general) |
| GitHub ke according, aise attacks install ke time hi, CI ya laptop se credentials chura lete hain, code chalaaye bina hi. | F4, F13 (attributed to GitHub) |
| Isiliye GitHub laaya hai package firewall, abhi public preview mein. | F1 |
| Ye runners aur coding agents, aur npm registry ke beech, har request aur download check karta hai. | F3 |
| Rules admins set karte hain: naya version, by default ek din rukta hai; Advisory Database mein malware ho, toh block; aur attestation gayab ho, toh bhi block. | F6, F9, F10 |
| Galti se block hua? npm ke output mein hi, override ka link mil jaata hai. | F8, F14 |
| Par ye apne aap on nahi hota, setup karna padta hai; aur abhi sirf npm, sirf Enterprise Cloud. | F7, F5, F1 |
| Aap ise apne CI mein on karoge? Comment karo FIREWALL! | (question) |

## Real assets used (v2)
- Screenshots (captured 2026-10-21 by `app/scripts/shoot_pages.ts`, 430 px wide at 2.5x; the full pages are in `references/screens/`):
  github.blog changelog post (the site renders it dark): title, intro, "Availability and limitations"; GitHub Docs page:
  title, the five policy controls, the npm notice example. Each is labelled "REAL SCREENSHOT" on screen.
- Logos: the GitHub mark (Primer Octicons `mark-github`) and the npm logo (Simple Icons `npm`), drawn from their published
  SVG paths, unmodified, to refer to the products (`brand-assets/`).
- Fonts: Mona Sans and Monaspace Neon (GitHub, SIL OFL), via Fontsource.

## Script line → fact (v1)
| Line (Roman Hinglish caption) | Fact |
|---|---|
| Bas ek npm install… aur poora build khatre mein. | F4 (install-time risk; hypothetical, no incident named) |
| Ruko… rewind! | (hook device, no claim) |
| Ek risky dependency, tumhara app chalne se pehle hi, build tak pahunch sakti hai. | F4 |
| Isiliye GitHub ne abhi enterprise workflows ke liye package firewall launch kiya hai. | F1, F3 |
| Admins rules set karte hain: cooldown period, advisory checks, aur supply-chain checks. Policy fail? Package wahin ruk jaata hai. | F6, F9, F10 (blocked per policy, F8 exception exists) |
| Par ye automatic nahi hai, aur abhi preview sirf npm support karta hai. | F5, F7 |
| Tum ise apne CI mein enable karoge? Comment karo FIREWALL! | (question, no claim) |

## On-screen copy → fact (v3; v2 is the same without the caution sign)
- Caution sign (v3 hook): "CAUTION", "Kya aap bhi wahi `$ npm i` ka istemal karte ho?" → "Agar haan? toh ye dekhen…", caution
  tapes reading CAUTION, an amber beacon: a question, no claim (no incident, no package named).
- Hook headlines "One command." / "Many packages." / "One bad package?": a question, no claim. The flood's package names are
  fictional: every one returned 404 from registry.npmjs.org on 2026-10-21 (`dateo-utils`, `colr-kit`, `left-ui`, `jsonish-fast`,
  `path-kit`, `globlet-tiny`, `ms-lite`, `date-fmt`, `uikit-lite`, `debugx-lite`, `chalkly`, `urlish-parse`, `unknown-pkg`);
  chip "ILLUSTRATION · package names are fictional".
- Problem: "The risk: install time" + the Actions look-alike (labelled "ILLUSTRATION · GitHub Actions look-alike"), secret
  names NPM_TOKEN / CLOUD_KEY / GITHUB_TOKEN as generic examples, and the GitHub quote: F4, F13.
- News: the real changelog screenshot ("REAL SCREENSHOT · github.blog"), chips "PUBLIC PREVIEW" + "GitHub Enterprise Cloud": F1.
- How: "Where it sits" (ILLUSTRATION): runner / coding agent → package firewall → upstream registry, request + download checked: F3.
- Policy: the real docs screenshot ("REAL SCREENSHOT · GitHub Docs"), then the five controls as listed in the docs, with their
  documented defaults (labelled "ILLUSTRATION · controls as listed in GitHub Docs"): F6, F9, F10.
- Blocked: the docs' own npm notice and override URL (`testcontainers`, `octocats`), labelled "EXAMPLE OUTPUT FROM GITHUB DOCS",
  then a look-alike of the override form's fields: F8, F14.
- Limits: the `.npmrc` registry line (shape from the docs), "npm only", "Enterprise Cloud", plus the real "Availability and
  limitations" screenshot: F5, F7, F11, F1, F2.
- CTA: a question, no claim.

## On-screen copy → fact (v1)
- "GitHub Package Firewall — PUBLIC PREVIEW": F1
- Cards "Cooldown period" / "Advisory checks" / "Supply-chain checks": F6 (sub-lines from F9: "min. package age · default 1 day", "GitHub Advisory Database", "e.g. attestation downgrades")
- Limits: "npm only" (F5), "Enterprise Cloud preview" (F1), "configure endpoints" (F7)
- Labels: "FICTIONAL TERMINAL" (the npm install scene), "CONCEPTUAL VISUALIZATION" (the policy scene), "ILLUSTRATION" on any generic UI. No GitHub interface is copied; no GitHub or npm logo artwork (names in our own type).
