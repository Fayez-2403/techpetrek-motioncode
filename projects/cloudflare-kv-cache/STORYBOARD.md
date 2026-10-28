# Storyboard (motionmaxxing worksheet)

**PAGE.** Problem: a real but already-fixed AI privacy bug reads as scarier or vaguer than it is. Audience: Indian AI developers, cloud and security people, on a muted phone feed. Goal: they understand the mechanism and take away one action (SGLang v0.5.22+, isolation tests). Emotion: shock, then understanding, then relief.

**Idea.** The film happens inside the GPU's KV-cache pool, a lit floor of memory pages. One coral page (another user's text) is the carried object: it lands in User A's reply, is traced back to the pool, and is wiped mint by the fix.
- First idea, discarded: a lock or shield breaking. That is the category's clip-art.
- Also considered: a chat-only UI documentary. It can't show *why* the leak happened.
- The pool floor shows the cause (pool < context window, rejected request still decoded) as a picture.

**Hero frame.** The stale-cache shot: the cyan decode head sweeps the pool and stale violet pages turn coral under "phir bhi chalti rahi" (~27.6 s).

**World.** Light ground #F8FAFF with a cool key from the top left. Pages have contact shadows, fog in the distance and mono token text on near pages. One lens (pinhole, F 1500); the camera eases scene to scene and drifts within scenes. Colour meanings: blue = User A, violet = other users, cyan = GPU, coral = exposed, mango = rejected, mint = fixed.

| # | Scene | Role | Buys: the viewer… | Picture with the text covered |
|---|---|---|---|---|
| 1 | hook 0–5.2 | hook | …sees another user's text land in a reply | chat card, coral chip flying in from User B |
| 2 | source 5.2–7.5 | proof | …knows it's an official disclosure | quoted blog title card, stamp |
| 3 | model 7.5–10.9 | proof | …knows only one model was hit | 9 GPU lanes, one coral |
| 4 | window 10.9–13.0 | proof | …knows when | 14 day cells fill coral, Sep 9 mint |
| 5 | count 13.0–15.5 | proof | …feels 155 as a quantity | 155 tiles light up |
| 6 | tokens 15.5–20.2 | turn | …sees the long prompt overrun the pool | blue fill races down the floor, mango past the limit |
| 7 | pool 20.2–23.6 | proof | …sees pool < context window (surprise, ~22 s) | top-down pool, dashed window outline snaps in |
| 8 | bug 23.6–26.4 | proof | …sees "rejected, still admitted" | prefill → decode, REJECTED card still travels |
| 9 | stale 26.4–28.4 | the point | …sees stale pages read | decode head turns violet pages coral |
| 10 | recon 28.4–30.9 | proof | …connects it back to the reply | the chat again, coral chip lands (labelled) |
| 11 | patch 30.9–36.1 | turn | …sees the fix (after a 0.9 s breath) | pool outline grows 3x, mint sweep |
| 12 | fixed 36.1–38.6 | the point | …relief | FIXED · SEP 9 stamp (the one spring) |
| 13 | noexploit 38.6–43.9 | caveat | …knows the limits of the risk | crossed warning, quote, lanes ticked |
| 14 | devs 43.9–51.1 | takeaway | …gets 3 actions | 3 check rows tick |
| 15 | cta 51.1–55.0 | cta | …comments CACHE, saves | comment field types CACHE, save fills |
