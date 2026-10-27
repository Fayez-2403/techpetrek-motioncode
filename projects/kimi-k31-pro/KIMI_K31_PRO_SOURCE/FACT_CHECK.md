# FACT CHECK

Source of truth: **https://www.kimi.ai/blog/kimi-k3-1-pro** (Moonshot AI, "Kimi K3.1 Pro Tech Blog: Advancing Open Intelligence",
`dateModified` 2026-10-24). Secondary official source: **Kimi Code docs, What's New** (https://www.kimi.com/code/docs/en/kimi-code/whats-new.html,
entry "K3.1 Pro Series is live", October 23, 2026). Text snapshots: `src/data/sources/` (fetched 2026-10-24). Every claim in the film
lives in `src/data/verifiedClaims.ts` with a verbatim quote; `npm test` fails if a quote is not in its snapshot, and
`npm test -- --live` re-checks every quote against the live pages.

Verified: 2026-10-24 (snapshot + live). Re-verify before export: run `npm test -- --live` (see QA_REPORT.md for the final run).

## Claims as given vs. the article

| # | Claim given to us | Article / docs says | Status | In the film as |
|---|---|---|---|---|
| 1 | Kimi K3.1 Pro by Moonshot AI | "We're introducing Kimi K3.1 Pro, the first model in our new K3.1 series" | ✅ | "Kimi K3.1 Pro", "by Moonshot AI" |
| 2 | "an extensively post-trained evolution of Kimi K3" | "a post-trained version of Kimi K3, with substantially larger post-training compute" | ✏️ reworded to the article's words | not voiced; available as `postTrained` |
| 3 | 3T-class, open-weight; never "3T active" | "our most capable 3T-class open-weight model to date" | ✅ | "3T-CLASS" + "3T-class = 3-trillion-parameter class (total, not active)" |
| 4 | Up to 1M-token context, depending on product and membership tier | Article: "with a 1-million-token context window" (no tier wording). Kimi Code docs: "K3.1 Pro: available on Plus / Moderato and above; Pro / Allegretto and above unlock up to 1M context." | ✅ split across the two sources | "UP TO 1M TOKENS" + "Context available varies by product and plan · Kimi Code: up to 1M context on Pro / Allegretto plans and above" |
| 5 | Highspeed ≈ 2–3× the speed, vendor-reported; "same quality" only if the article says so | Article: "which delivers 2-3× the speed of K3.1 Pro for more responsive interactions." The **docs** say "With the same model quality…"; the **article does not**. | ✅ speed / ❌ quality parity not used | "2–3× FASTER" + "Vendor-reported speed comparison." No quality claim. |
| 6 | Coding capabilities (SWE, long-horizon, front-end, Three.js, game dev, tool-based debugging, iterative builds) | "from quick fixes in real codebases to full-project builds"; "game engines such as Unity, Unreal Engine, and Godot"; "front-end pages, interactive Three.js scenes, and 3D assets"; the walking-simulator story describes diagnosing and iterative refinement | ✅ (article wording used) | VO m04; on-screen capability lines |
| 7 | Terminal-Bench 4.0: K3.1 Pro 65.7, Opus 5.5 66.4, GPT-6 Astra 58.2 (Moonshot-reported, harnesses may differ) | "K3.1 Pro scores 65.7%, ahead of GPT-6 Astra (58.2%) and narrowly behind Claude Opus 5.5 (66.4%)". Footnote: Kimi evaluated with the Claude-Code harness; other scores are the maximum reported in each blog post or the official leaderboard. | ✅ | chart + "Moonshot-reported results; harnesses and reporting methods may differ." + harness footnote |
| 8 | Kimi Code Bench 3.0 Long-horizon (internal): 61.2 vs K3 55.95 | "K3.1 Pro scores 61.2%, above K3's 55.95%" (internal benchmark) | ✅ | shown only as a comparison **with its predecessor**, labelled internal |
| 9 | 3D/CAD capabilities | "From a text brief, sketch, or reference image…"; "parametric modeling, from mechanical parts and architectural models to configurable products and custom furniture"; "write and run scripts for tools like Blender and CAD software"; "3D Make is now live on kimi.ai and the Kimi app" | ✅ | VO m05; CAD lab capability line |
| 10 | BenchCAD with tools (1,000-case subset): K3.1 Pro 92.7, Opus 5.5 96.2 | "K3.1 Pro scores 92.7% with tools, approaching … Claude Opus 5.5 (96.2%) and GPT-6 Astra (95.9%)". Footnote: open models evaluated by Moonshot on 1,000-case subsets of the 17,900-case Vision2Code set; Claude scores from Anthropic's system card; GPT-6 Astra's from its report. | ✅ + **added GPT-6 Astra 95.9** for context | panel with all three bars + "Moonshot-reported · Kimi scored on a 1,000-case subset · Claude and GPT scores from their makers' reports" |
| 11 | Human walking simulation: human-atlas, 296 skeletal (incl. cartilage), 402 muscle components; 167 missions; 420 reviews; 11.2 s alternating-stride walking; 36 shoulder moment-arm errors corrected | All confirmed verbatim ("In one internal test…") | ✅ | "Moonshot internal example — not independent scientific validation"; recreated figure labelled illustrative |
| 12 | Finance capabilities; OfficeQA Pro v2: 64.4 (Moonshot-reported); never imply guaranteed results | "state-of-the-art results on OfficeQA Pro v2 (64.4)" ("state-of-the-art" is Moonshot's own description and is not repeated); "retrieval, cross-document verification, and multi-step numerical reasoning" | ✅ | "OFFICEQA PRO V2: 64.4" + "Moonshot-reported"; fictional sample company; "not investment advice" |
| 13 | Availability: Kimi.ai, Kimi mobile, Kimi Work, Kimi Code, Kimi API | "on Kimi.ai and the Kimi mobile apps, Kimi Work and Kimi Code, and through the Kimi API"; Enterprise "access is off by default at launch" | ✅ + added the Enterprise note | availability line + "Enterprise: off by default, admins can enable" |
| 14 | Full weights scheduled for November 4, 2026 | "Full model weights will be released **by** Nov 4, 2026." | ✏️ "on Nov 4" → "by Nov 4" | "FULL WEIGHTS PLANNED BY NOV 4, 2026" · VO "4 November tak" (= by 4 November). Today (2026-10-24) is before the date, so "planned". A test fails after 2026-11-04 until this is re-checked. |
| 15 | No licensing terms; open-weight ≠ free/lightweight/unrestricted; no universal free access | The article gives no licence terms | ✅ | no licence, price or "free" wording anywhere (enforced by tests) |

## Discrepancies noted in the source itself
- **Terminal-Bench, Opus 5.5:** the article's text and its benchmark table give **66.4%**; the article's own *score vs cost* chart
  (data "sourced from tbench.ai") plots Opus 5.5 "max" at **64.85**. Moonshot's footnote explains other models' scores are the maximum
  of the vendor blog and the leaderboard. The film uses the headline/table value (66.4) with the qualifier that harnesses and reporting
  methods differ.
- **Kimi Code Bench 3.0 Long-horizon:** in the article's table GPT-6 Astra scores **66.5**, above Kimi K3.1 Pro (61.2). The film shows this
  internal benchmark only as K3.1 Pro vs K3 (what the brief and the article text compare) and says so on screen; it never implies a lead.

## Removed or not used
- "Same quality" for Highspeed: only in the Kimi Code docs, not in the article → not used.
- "state-of-the-art" for OfficeQA Pro v2: vendor wording → not repeated.
- Latency, tokens/s, prices, licence terms, free access: not stated → not used.
