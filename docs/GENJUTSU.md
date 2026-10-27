# Genjutsu (AI character / object replacement) for reels

Installed 2026-10-21 in `tools/genjutsu/` (TEIN's open-source workflow, MIT; set up natively on Windows, see
`tools/genjutsu/WINDOWS-PATCH.md`). It takes a real video and replaces a person (or object) in it with a new character, keeping
the original motion, camera and soundtrack: Seedance generates the new subject, guided by colored depth + SAM masks or a face
mesh. Good for: turning yourself or stock footage into a character or mascot, a "same scene, new character" hook, comedic
re-casts of your own clips.

## What it costs (nothing is free here except preparation in face-mesh mode)
| Service | Used for | Key in `tools/genjutsu/.env` |
|---|---|---|
| Enhancor (Seedance 2.5 API) | the generation: a draft, then 1080p after you approve | `ENHANCOR_API_KEY` (https://app.enhancor.ai/api-dashboard) |
| Replicate | depth (Depth Anything Video), masks (SAM 3), vocal separation (Demucs) | `REPLICATE_API_TOKEN` (https://replicate.com/account/api-tokens) |
| Hugging Face (optional) | an alternative depth model | `HF_TOKEN` |
Both paid accounts must be funded. The app never retries a paid call by itself: it drafts first and waits for your approval
before 1080p.

## Modes
- **Advanced (depth + SAM):** any subject. Uses Replicate for depth and masks.
- **Fast · Face mesh:** one centred speaker. Tracking runs locally (MediaPipe), with no depth or SAM calls (vocal separation still uses Replicate).
- **Advanced + Face mesh:** both, for faces with a complex scene.

## Run it
```
cd tools\genjutsu
doctor-windows.cmd --mesh            # offline checks (no paid calls); add --require-keys once .env is filled
start-windows.cmd                    # the UI at http://127.0.0.1:8770 (PORT=8771 for another port)
```
`start-windows.cmd` also opens a temporary Cloudflare quick tunnel that only receives Enhancor's "job finished" callback (no UI,
no files). Keep that window open while a job runs.

The flow: upload your MP4/MOV, prepare it, review the whole mask and approve it, add your character reference image(s), review
the prompt, generate a draft, then approve the 1080p version. Outputs land in `tools/genjutsu/runs/<job>/` with the original
soundtrack restored.

## Into a reel
Use the 1080p result like any other clip. Cut it to frames with the `analysis/reveals_media.py` pattern (`extract(...)`) and play
it in a scene with `SeqCache` (`app/src/scenes/_vo.ts`), exactly like the project clips in `scenes/reveals.ts`.

## Rules (read before every job)
- **Only footage you own or have licensed.** Your own shoots, or Mixkit **Free License** stock (check each clip's page). Never use
  other creators' videos, and never use the project clips in `projects/*/references/source/`.
- **Only references you have rights to:** your own face or character art, or your brand mascot.
- **Never put a real person's face** on someone else, or make a real person appear to say or do something.
- **Label it:** "AI-generated character" on screen, plus Instagram's AI label.
- **Uploads are public:** the app uploads your media to tmpfiles (temporary) and, as a fallback, catbox (public and permanent).
  Don't send private footage. Set `MEDIA_HOST_FALLBACKS=` (empty) in `.env` to disable catbox.
- **Your voice is changed:** the vocals are pitched +3 semitones in the generation input, and the final file keeps your original soundtrack.
