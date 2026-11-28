# DM replies: every comment-keyword reply in one place

When someone comments the keyword from a reel, send that file's messages **in order** (DM 1, then DM 2…). Every message
is under Instagram's 1,000-character limit. The files are named `KEYWORD__reel.txt`.

| Comment keyword | Reel | File | Messages (characters) | Note |
|---|---|---|---|---|
| **ASTRA** | GPT-6.2 Astra & Sol launch reel | [ASTRA__gpt62-astra-sol.txt](ASTRA__gpt62-astra-sol.txt) | 2 (786, 663) | full breakdown from OpenAI's launch page; benchmarks are OpenAI's own |
| **BINARY** | Binary Search "Pehchaan" (v2, approved) | [BINARY__dsa-binary-search_v2.txt](BINARY__dsa-binary-search_v2.txt) | 2 (545, 337) | ✅ use this one: 10 problems by clue + template |
| BINARY (old) | Binary Search v1 (95 s preview) | [BINARY__dsa-binary-search_v1-old.txt](BINARY__dsa-binary-search_v1-old.txt) | 2 (662, 419) | only if you post the v1 cut |
| **WINDOW** | Sliding Window "Pehchaan" | [WINDOW__dsa-sliding-window.txt](WINDOW__dsa-sliding-window.txt) | 2 (660, 371) | 10 problems: LeetCode 5 · GFG 3 · Codeforces 2 + templates |
| **CLIP** | GTA 6 "how to clip" teach reel | [CLIP__gta6-clipper-teach-reel.txt](CLIP__gta6-clipper-teach-reel.txt) | 2 (928, 858) | setup + Claude prompt + both repo links |
| **COPY** | 18 repos: one ball | [COPY__repo18-copy-studio.txt](COPY__repo18-copy-studio.txt) | 2 (934, 539) | all 18 repo links |
| **DESIGN** | 10 design resources: one page | [DESIGN__design10-landing.txt](DESIGN__design10-landing.txt) | 1 (787) | all 10 links |
| **RETRY** | Ek Baar Bheja, Do Baar Kata (payment idempotency fable) | [RETRY__money-order.txt](RETRY__money-order.txt) | 2 (662, 716) | duplicate request -> idempotency key (Stripe Idempotency-Key), reuse the key on every retry, 409, expiry, backoff |
| **CDN** | Ek Film, Hazaar Copies (bioscope CDN + caching fable) | [CDN__film-prints.txt](CDN__film-prints.txt) | 5 (730, 907, 786, 741, 845) | ✅ use this one: concepts, a header cheat sheet (immutable, no-cache + ETag, private/no-store, s-maxage, stale-while-revalidate/if-error), origin protection (cache key, Vary, tag purge, tiered cache, request collapsing), live HLS TTLs, 9 official links |
| CDN (old) | same reel, first DM | [CDN__film-prints_v1-old.txt](CDN__film-prints_v1-old.txt) | 2 (633, 813) | superseded by the 5-message version |
| **SEAT** | Berth 42 (ticket booking system design fable) | [SEAT__berth-42.txt](SEAT__berth-42.txt) | 2 (685, 656) | race condition -> per-seat lock -> lock + TTL (Redis SET NX EX), optimistic locking, idempotent payment |
| **story** | Mumbai After Rain (Astra-built drive, projects/mumbai-after-rain) | [STORY__mumbai-after-rain.txt](STORY__mumbai-after-rain.txt) | 1 (single DM) | reference game (Drive) + 5-step "kaise banayein" guide with the Astra prompt + repo + 5 reference repos |
| story | Astra workflow reel (earlier cut, projects/astra-nightshift) | [STORY__astra-workflow.txt](STORY__astra-workflow.txt) | 1 (867) | only for that older reel |
| **CIVIL** | BRIDGE.EXE bridge lab | [CIVIL__bridge-exe.txt](CIVIL__bridge-exe.txt) | 3 (718, 615, 479) | DM-ready version; the full doc is [CIVIL__bridge-exe_full-doc.md](CIVIL__bridge-exe_full-doc.md) |
| DYK | Did you know #01 | [DYK__did-you-know-01_rejected.txt](DYK__did-you-know-01_rejected.txt) | 2 (679, 328) | ❌ that reel was rejected; kept for reference only |

## Captions that promise a DM but have no DM written yet

| Keyword | Reel | Where the caption is |
|---|---|---|
| BREAKDOWN | Breakdown X-ray (posts-design/mcp kit) | `projects/breakdown-xray/post/caption.txt` |
| EDITOR | EditorBro | `projects/editorbro/post/caption_final.txt` |

## Rules for new DMs

- **Placement:** one file per reel here, named `KEYWORD__reel.txt`, with `=== DM 1 … ===` headers between messages.
- **Length:** each message must be under 1,000 characters (Instagram cuts off longer DMs).
- **Accuracy:** only verified facts and tested commands; links are the official pages.
- **Wording:** "interview favourite", never "most asked".
- **Sync:** these are copies of each project's `post/` file. If you change one, change both, or edit only here and treat this folder as the master.
