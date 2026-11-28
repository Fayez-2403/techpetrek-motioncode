# Fact check (before any VO): Berth 42 (2026-11-27)

The film is a "what if" fable. The characters (Chhotu, Bhimsen, Ramu, Shamu, Bade Babu) and the 1930s booking office are invented, and no real person is drawn. Only the rows below are presented as real.

| # | Claim (voice / screen) | Source + exact words | Status |
|---|---|---|---|
| F1 | "Subah ke dus baje Tatkal khulta hai" (line 5) | AC-class Tatkal opens at 10:00 AM and non-AC at 11:00 AM, one day before the journey. IRCTC's April 2025 clarification: "no such change in timings is currently proposed in the Tatkal or Premium Tatkal booking timings for AC or Non-AC classes" ([Business Today, 13 Apr 2025](https://www.businesstoday.in/amp/india/story/no-new-tatkal-rules-from-april-15-irctc-clears-air-on-social-media-misinformation-471844-2025-04-13); [Railway Board CC 08/2025](https://indianrailways.gov.in/railwayboard/uploads/directorate/traffic_comm/Comm_Cir_2025/CC%2008%20of%202025.pdf)) | ✅ The story's berth is an AC berth, so 10 AM is right. |
| F2 | `SET seat:42 chhotu NX EX 600`: NX = only if not already set; EX 600 = expires in 600 s (line 18) | Redis docs: "NX -- Only set the key if it does not already exist." "The command SET resource-name anystring NX EX max-lock-time is a simple way to implement a locking system with Redis." ([redis.io/commands/set](https://redis.io/docs/latest/commands/set/)) | ✅ Valid syntax; 600 s = 10 min. |
| F3 | Race condition: two workers read "free", then both write, so the seat is sold twice (lines 7-10) | Standard computer-science definition (check-then-act / lost update) | ✅ concept |
| F4 | A per-seat lock (not one lock for everything) keeps the other seats bookable (line 11) | Standard fine-grained locking | ✅ concept |
| F5 | A lock whose holder never returns blocks the seat forever; an expiry fixes it (lines 13-17) | The point of EX in F2 | ✅ concept |
| F6 | "Ticket app pe payment ka countdown… wahi ret-ghadi hai" (line 19) | An explanation of the general seat-hold pattern, **not a claim about any one company's internals** (IRCTC, BookMyShow…) | ✅ worded generically; the caption carries the note "illustrative story" |

## Wording rules
- **Never claim internals:** never say IRCTC or BookMyShow "uses Redis" or "uses this lock". We don't know their internals.
- **"Rewind" is a story device;** the 1930s office is imaginary. Tatkal itself started much later. The anachronism is the joke, and the caption says "what if".
- **"Interview favourite",** never "most asked".
