# Open Higgsfield AI (tools/open-higgsfield-ai)

A self-hosted web studio for paid image, video and lip-sync models: Image Studio, Video Studio, Lip Sync Studio and Cinema
Studio. It is an optional extra for reels, used like Higgsfield and Genjutsu: only when the user approves the spend.

- **Source:** https://github.com/Autom8AI/Open-Higgsfield-AI, MIT. Cloned at commit `d32d022` (2026-10-25).
- **Not in this repo:** it is a separate repository, git-ignored (`tools/open-higgsfield-ai/`). Update it with
  `git -C tools/open-higgsfield-ai pull`.

## The key: kie.ai, not Muapi
The upstream README and the @krish.exploits setup PDF say Muapi.ai. The code at `d32d022` calls **https://api.kie.ai**
instead:
- `packages/studio/src/kie.js` sends `Authorization: Bearer <key>` to `/api/v1/jobs/createTask`;
- the key is stored in the browser's localStorage as `kie_key`.

The key popup still says "Muapi.ai"; that label is stale. So:
- get the key at https://kie.ai/api-key;
- every generation spends kie.ai credits;
- if a future pull switches back to Muapi, re-check `packages/studio/src/` and update this note.

The key stays in the browser. Never put it in a committed file.

## Install (once)
Run in PowerShell from the repo root. These steps install third-party npm packages, and their install scripts run
(esbuild, sharp, unrs-resolver). Electron's ~100 MB binary is skipped; the desktop build isn't needed.

```powershell
cd tools/open-higgsfield-ai
$env:ELECTRON_SKIP_BINARY_DOWNLOAD = "1"
npm ci --no-audit --no-fund
npm run build:studio
```

## Run
```powershell
cd tools/open-higgsfield-ai
npm run dev -- -p 54230
```
Then:
1. Open http://localhost:54230.
2. Paste the kie.ai key.
3. Pick a studio.

Downloads go to your browser's download folder; move them into the reel's `assets/generated/` and log each one in
`docs/asset_manifest.csv` (model, prompt, date).

## From scripts (what Claude uses for reels)
The studio keeps its key in the browser, so reels use `tools/open_higgsfield.py`. It calls the same kie.ai endpoints and
model slugs as `packages/studio/src/kie.js`, reading the key from `KIE_API_KEY`:

```powershell
setx KIE_API_KEY "<your kie.ai key>"      # once; new terminals see it (the script also reads it from the registry)
python tools/open_higgsfield.py credits
python tools/open_higgsfield.py image --model nano-banana-2 --prompt "..." --aspect 9:16 --out projects/<reel>/assets/generated
python tools/open_higgsfield.py video --model seedance-2 --prompt "..." --duration 5 --resolution 720p [--image first.jpg] --out ...
python tools/open_higgsfield.py lipsync --image face.jpg --audio line.wav --out ...
```
- Add `--dry` to print the request without spending anything.
- Each result gets a `.json` sidecar (model, prompt, inputs, task id, date) for the asset manifest.

## Rules for reels
- **Costs:** ask the user before generating, and say roughly how many generations. Test with short clips first.
- **Faces:** no real people's faces or likenesses (celebrities, politicians, other creators), and no other creators'
  footage. Use synthetic people or the user's own photos, with their consent.
- **Labels:** label generated shots as AI in the reel or caption, and keep the factcheck honest (a generated shot is
  "our illustrative animation", never footage of a real event).
- **Desktop installers:** the upstream Releases installers are unsigned. Use the source install above instead.
