# Fact check: JOB INTERVIEW SE $6 BILLION HACK?!

Every on-screen and spoken claim traces to a row here (master studio §2). Checked 2026-11-04.

**Primary source:** Binance, "Initial Findings and Response Update", 3 Nov 2026.
- URL: https://www.binance.bh/en/blog/community/3229153443759566763
- The page needs a real browser (curl gets a 202 bot check), so it was captured with Playwright.
- Full text: `assets/sources/binance_nov3_report.txt`.
- Page capture: `public/pages/report.png`, the same page that the reel's lens magnifies.

**Secondary sources (attribution, context):**
- NBC News: https://www.nbcnews.com/business/markets/binance-hack-fake-job-interview-heist-rcna607238
- Reuters: https://www.reuters.com/world/binance-says-hackers-used-fake-job-interview-compromise-computer-before-63-2026-11-03/
- The National: https://www.thenationalnews.com/business/money/2026/11/03/binance-says-fake-job-interviews-and-internal-ai-tool-used-in-63bn-heist/
- Wired: https://www.wired.com/story/binance-says-hackers-used-well-known-tricks-to-carry-out-a-dollar634-billion-heist

| # | Claim | Kind | Source | Verbatim excerpt | Status | Approved wording (VO / screen) |
|---|---|---|---|---|---|---|
| F1 | $6.34B in assets impacted | official | Binance report | "Approximately USD 6.34 billion in digital assets were impacted by the incident." | verified | "$6.34B ke assets impact hue" / "$6.34B · DIGITAL ASSETS IMPACTED" (lens on that sentence) |
| F2 | Incident on Oct 29, report on Nov 3 | official | Binance report | "What happened on 29 October" (section heading); the report is dated 3 Nov 2026 | verified | The OCT 29 INCIDENT and NOV 3 BINANCE REPORT chips are kept apart |
| F3 | June: tampered tool installed while getting an AI coding tool | official | Binance report | "Engineer A from Wallet DevOps downloaded a tampered Homebrew installation in order to install a popular AI coding tool after searching for it on a search engine." | verified | "June mein ek engineer ne AI coding tool dhoondhte hue tampered tool install kar liya" |
| F4 | Sept: fake Project Director, HR, then "CEO" | official | Binance report | "contacted through a legitimate job-hunting platform by an individual posing as a Project Director … a first-round interview with a HR representative, followed by a second-round interview with an individual claiming to be the CEO of a fictitious company." | verified | "fake 'Project Director' … interview, fake CEO" |
| F5 | The CEO round was on a chat app | official | Binance report | "The second interview was conducted in a popular social chat app" | verified | Phone: "Round 2 · interview with the 'CEO' · on a chat app"; window "FAKE CEO · CHAT" |
| F6 | The "assignment" contained malicious code | official | Binance report | "Engineer B was instructed to download an 'assignment' containing a malicious code repository onto his work computer." | verified | "Us assignment mein malicious code tha" |
| F7 | Oct 20: an internal AI tool used as a springboard | official | Binance report | "20 October, 2026 — use of an internal AI tool as a springboard." | verified | "Oct 20 ko attackers ne internal AI tool ko springboard banaya" |
| F8 | The AI did not steal by itself | official (framing) | Binance report | The techniques list "compromised internal AI tooling" among several the attackers combined; the AI tool was misused by people | verified | "AI ne khud chori nahi ki; attackers ne uska access misuse kiya" / "USED BY ATTACKERS · NOT AUTONOMOUS" |
| F9 | 18,270 BTC sent to the attacker | official | Binance report | "Binance hot wallet sent 18,270 BTC to an attacker-controlled address." | verified | "hot wallet se 18,270 bitcoin attacker ke paas" |
| F10 | ~$2.85B frozen or intercepted | official | Binance report | "approximately USD 2.85 billion in digital assets have been frozen or intercepted, subject to reconciliation and market price volatility." | verified | "Lagbhag $2.85B freeze ya intercept hue" / "~$2.85B FROZEN / INTERCEPTED · frozen ≠ recovered" |
| F11 | Binance absorbs the loss, not users | official | Binance report | "Binance will absorb the financial impact of the stolen funds, not our users." | verified | "nuksaan Binance khud uthayega" / "BINANCE WILL ABSORB THE LOSS" (lens on that sentence) |
| F12 | FBI blames a North Korea-linked group | news | Binance report + NBC / Reuters | Report: "The latest information released by the Federal Bureau of Investigation indicates that the Democratic People's Republic of Korea is responsible"; coverage names TraderTraitor | verified | "FBI ne North Korea-linked group ko blame kiya" |
| F13 | North Korea rejects the claim | news | The National / Reuters | "The FBI has blamed a North Korean hacking group, a claim North Korea has rejected." | verified (exact wording of the response not published) | "North Korea inkaar karta hai" / "rejects the claim", shown under ATTRIBUTION · DISPUTED |
| F14 | The lesson / checklist | our advice | General practice, not a Binance quote | — | advice | "work laptop par unknown code mat chalao. Sandbox mein test karo." |

## Disclaimers on screen
- **illustrative reconstruction:** small, top-left at y 205. It shows on every 3D breach shot: the phone, the desk, the calls, the graph, the vault and the sandbox. These are our animations, not footage or Binance UI.
- **"subject to reconciliation":** on the frozen-section source line.
- **frozen ≠ recovered:** under the meter.
- **ATTRIBUTION · DISPUTED:** over the two columns.

## Not used (and why)
- **The report's attack mechanics** (the signing-service abuse and the EIP-7702 authorisation details) are left out on purpose: no actionable exploit detail.
- **"98% of the impacted token assets have been replenished"** (Binance report, as of 31 Oct 2026) is verified but left out of the VO for runtime. "Binance will absorb … not our users" carries the same point. It can go in the post caption.
- **"$6.3B"** (the rounded figure in headlines): the reel uses Binance's own "$6.34B". The hook's "$6 BILLION" is the spoken round-down, and the $6.34B chip is on screen at the same moment.
- **No phishing URLs, no fake screenshots, no made-up Binance UI.** The only Binance mark on screen is inside the real captured report page (Playwright capture of binance.bh), shown as the cited source with the source line.
