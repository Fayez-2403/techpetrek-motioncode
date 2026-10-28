# FACTS: Cloudflare GLM-5.3 KV-cache exposure reel

Every on-screen claim and VO line traces to a row below. Checked on 2026-10-28 by re-opening the primary source.

**Primary source:** Cloudflare blog, "Cross-request KV cache exposure in the GLM-5.3 Workers AI model, and our remediation with SGLang".
- URL: https://blog.cloudflare.com/kv-cache-exposure-remediation/
- Published 2026-10-26 (page structured data, `datePublished`); modified 2026-10-27.
- Published "as part of a coordinated disclosure".

## Verified facts (quotes from the post)

| # | Claim used in the reel | Source wording |
|---|---|---|
| F1 | Cloudflare disclosed a cross-request KV-cache exposure in one Workers AI model, GLM-5.3 (`@cf/zai-org/glm-5.3`) | title; model id in the post |
| F2 | Affected responses contained text from other customers' / other users' requests | "responses that contained data from other customers' requests made to the same model"; "other users' prompts and partial generations" |
| F3 | Exposure window: Aug 27, 2026 (model launch) to Sep 9, 2026 | "exposure was present from launch" (Aug 27); "we restored the model on September 9" (19:40 UTC) |
| F4 | Reported Sep 8, 2026 by security researcher Gadi Evron through HackerOne | "Gadi Evron submitted a report on September 8 through our HackerOne program" |
| F5 | Exactly 155 responses affected, all for prompts longer than 681,280 tokens | "In total, 155 responses were affected, all to prompts longer than 681,280 tokens." |
| F6 | Config: the prefill KV-cache pool held 681,280 tokens; the context window was 1,048,576 | "the KV cache pool on our prefill GPUs only had room for 681,280 tokens" |
| F7 | SGLang bug (disaggregated prefill/decode): an over-length request was marked rejected but still admitted; decode attended over stale KV pages holding data from earlier requests | "attending over stale cache pages that still held data from earlier requests" |
| F8 | The SGLang bug had been reported upstream by another user (issue #30233, July 6, 2026) | as quoted |
| F9 | Fix: pool raised to hold the full context (~2.04 million tokens); SGLang patched so rejected requests retire before any KV transfer (upstreamed #38704; maintainers merged #38935) | "we made the pool hold the full context" |
| F10 | No evidence of deliberate exploitation; the affected requests looked like ordinary long-context use | "We found no evidence of deliberate exploitation." |
| F11 | No other Workers AI model affected | "We have confirmed that no other model hosted on Workers AI was affected." |
| F12 | Operators running disaggregated SGLang should update to v0.5.22 or later | "update SGLang dependencies to v0.5.22 or later" |

## Corrections to the master prompt (TPT-20261027-1700-R03)

- The prompt says "previous users' text". The post says **other customers' requests / other users' sessions**. The VO and captions say "doosre user ka text".
- The prompt's VO says "SGLang engine ka rejection-path bug, jisne purane request ka data reuse kar diya". That is accurate (stale pages from earlier requests), with one addition: the bug combined with a **pool smaller than the context window** (a config error). The VO names both.
- "Fixed Sep 9" is accurate as "model restored with the fix on Sep 9". Further hardening continued after that date (deferred KV release, bounded Mooncake batches).
- The post does **not** say whether affected customers were notified. The reel says nothing about notification.
- The HN buzz counts in the prompt (~112 points / 37 comments) were a snapshot and are **not used** anywhere.

## Illustrative, labelled on screen

- The two chat windows (User A, User B) and every chat text in them are **invented**. The "leaked" fragment is placeholder gibberish, not real user data. Label: "Illustrative reconstruction".
- KV pages, the pool grid and the token ribbon are diagrams of the mechanism, not Cloudflare's UI.
- Dev checklist item 3 ("cross-tenant isolation test") is a TechpeTrek suggestion, labelled as such. Items 1 and 2 come from the post (F12, F6).

## Not used

- The Cloudflare logo is not used. The name appears in our own type, and the blog title is quoted as text with its URL.
- No screenshots of the blog.
- No user counts (the post counts responses, not people).
