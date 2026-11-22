# Nightshift

A 24.8 s Techpetrek reel inviting viewers to try a rainy Three.js night-drive prompt in GPT-6.2 Astra. The finished review cut is [out/preview/nightshift-preview.mp4](out/preview/nightshift-preview.mp4).

## Edit and preview

Open this folder in HyperFrames, or run `npx hyperframes preview`. The composition is `index.html`. Its portrait canvas uses the browser's 2D projection of original geometry, seeded streets and wet surfaces. The CTA prompt names Three.js as a suggested build tool. The film renderer uses Canvas 2D.

- `src/drive.js` draws the street, car and camera angles.
- `src/driver.js` draws the portrait and point-cloud selection sweep.
- `src/film.js` draws titles, narration captions and the always-visible original Techpetrek logo.
- `src/endcard.js` controls the CTA copy and type-on animation.
- `src/config/voScript.json` contains the Hinglish narration. `scripts/mix_nightshift.py` places the recorded takes and drives the score, shot timings and word captions.

From this project folder, `node scripts/preview.mjs --stills` captures review frames. `node scripts/preview.mjs` creates the 540 × 960, 30 fps review MP4 with sound. The proof runner uses the repo's tools/motion-studio Puppeteer install, Chrome, and FFmpeg. The existing mix is included. To change it, run `python scripts/mix_nightshift.py`. New narration can be generated through the repo's existing `scripts/audio/vo.py reel` workflow.

[Visual reference and fact check](docs/factcheck.md) · [Edit notes](docs/shotlist.md) · [Instagram copy](post/caption.txt)
