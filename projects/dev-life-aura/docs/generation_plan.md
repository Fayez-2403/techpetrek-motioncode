# Paid generation plan (cap: 240 kie.ai credits; 1 credit ≈ $0.005)

Everything else in the film is free:
- 41 Pexels / Mixkit Free clips, listed in `docs/asset_manifest.csv`;
- code-built screens, 3D and type;
- the user's song, and synthesized Foley.

| # | Asset | Model | Credits | Status |
|---|---|---|---|---|
| 0 | Character sheet (front, ¾, profile) | Nano Banana 2, 1K, seed 2611 | 8 | DONE → `assets/generated/char_sheet_v1.jpg` |
| F1–F5 | 5 start frames, same face (ref = sheet) | Nano Banana 2 edit, 1K, 9:16 | 5 × 8 = 40 | waiting for approval |
| V1–V5 | 5 hero motion shots, 8 s, 9:16, first frame = F1–F5; Veo's audio is stripped | Veo 3.1 Lite, 720p | 5 × 30 = 150 | waiting for approval |
| R | One retake (whichever shot fails QA: face drift, hands, text) | either | ≤ 30 | reserve |
| | **Total** | | **≤ 228** | |

The rules from the spec apply to every shot:
- no readable text, code or logos generated (screens are dark and replaced in post);
- one continuous take;
- an end frame designed for the next match cut;
- labelled AI in the caption.

## F1 / V1: cold open, eye → window (chapter 01, 0–3.76 s)
- **F1:** an extreme macro of HIS right eye (the sheet's identity). A soft reflection of a monitor in the cornea, navy pre-dawn room light, natural lashes and skin pores, 100 mm macro look, 9:16.
- **V1:** a slow 25 cm lateral dolly to the left with a gentle rack focus from the eye to the cheek. He blinks, breathes and turns slightly toward the window. It ends with the window edge and the first gold sunrise beside his face, held for the match cut. No text, no music, no dialogue.

## F2 / V2: platform, shoulder orbit (chapter 03, 8.1–12.5 s)
- **F2:** him on a modern metro platform on a weekday morning, backpack on, headphones on, rear three-quarter waist-height framing, sun striping between the pillars.
- **V2:** a stabilized waist-height track that curves to a front-side profile as the train doors close behind him. It ends on the two door edges meeting in a straight dark vertical seam, which is the cut to the IDE cursor on the 12.51 vocal entry. No signage text.

## F3 / V3: deep-work orbit (chapter 06, 28.5–39.7 s)
- **F3:** close on his hands on a dark mechanical keyboard at the warm wooden desk by the window, afternoon side light, a cobalt monitor fill, the desk lamp on the right.
- **V3:** a smooth clockwise 170° orbit from the hands, past his concentrating profile, to over his right shoulder. It ends with the dark, plain monitor filling the frame, for the screen replacement. Correct finger biomechanics; no readable screen.

## F4 / V4: incident reaction (chapter 10, 66.0–76.3 s)
- **F4:** the same desk at dusk, a tight 50 mm profile. A red-tinted notification glow from the monitor lights his face; the city is fading outside.
- **V4:** his expression shifts to quiet concern, with no jump scare. The camera pushes past the shoulder toward the monitor while he puts on the headphones and starts typing decisively. It ends with the monitor filling most of the frame, for our dashboard.

## F5 / V5: log-off (chapter 14, 96.75–100 s)
- **F5:** the same desk at night, over the shoulder, an amber lamp, city bokeh in the window, his hand on the keyboard.
- **V5:** a final keypress, then the hand rests. The camera tracks to a three-quarter view of his face: a small relieved smile and an exhale. He closes the laptop lid naturally, the screen glow fades, and amber lamp light remains. He stands and moves out of focus. It ends on a near-black screen reflection with city lights, for `LOG OFF.`

## Everything else (free): which chapters use stock vs code vs generated
| Chapter | Stock (free) | Code-built (free) | Generated (paid) |
|---|---|---|---|
| 01 | | the eye-reflection screen glow, "THEY SEE THE CODE." | V1 |
| 02 | curtain light, water pour, breakfast, shoe-tie, window + city | | |
| 03 | laptop into case, train arriving, doors closing, platform back view | "NOT THE LIFE BEHIND IT." | V2 |
| 04 | escalator, crosswalk feet, bike wheel, laptop on train, office glass, crowd | metro route line → network line | |
| 05 | office, meeting, video call | standup agenda card, call tile → IDE | |
| 06 | mechanical keys, low-light keys, programmer over the shoulder | VS Code-like IDE, terminal, tests, git diff, 3-layer architecture extrude | V3 |
| 07 | whiteboard, coworkers | 3D Client → API → Queue → Worker → DB, PR "Changes requested" → "Approved" | |
| 08 | bowl, salad, park, water at the desk | | |
| 09 | keys | branch, diff, commit, PR, CI jobs as 3D dominoes | |
| 10 | night desk, phone in the dark, late worker | dashboard 5xx / p95, incident channel, rollback | V4 |
| 11 | | rollback graph, staged deploy, BUILD PASSED / DEPLOYED / HEALTHY | |
| 12 | pen graph, notebook | Dijkstra graph + PQ, timed tests, Accepted after one Wrong Answer | |
| 13 | wing, neon rain, cafe rain, airport, luggage | | |
| 14 | rain window, laptop close, city night | LOG OFF., TECHPETREK | V5 |
