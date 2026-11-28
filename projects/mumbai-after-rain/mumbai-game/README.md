# Mumbai After Rain

Open `play-mumbai.html` in Chrome, Edge or another WebGL 2 browser to play offline. Choose a body colour and press **Start driving**. Use W/S to accelerate or brake and A/D to steer, or use the arrow keys. Phones have touch controls. **Watch the drive** plays the same scene with the 56-second narration, score and captions.

## Change the game with Astra

Open this folder in your coding workspace and select GPT-6.2 Astra. For a first edit, try “Read the Mumbai drive source. Change the cinema poster, keep its Hindi lettering legible from the road, and show the same camera frame before and after.”

- `src/city.js` builds the buildings, billboards, lettering, vendors, umbrellas and stalls.
- `src/vehicles.js` models the vehicles and rigs the wheels.
- `src/route.js` defines the street circuit. `src/game.js` handles traffic, controls, reflections, lighting and replay cameras.
- `src/hud.js` draws the minimap, speed, captions, titles and Techpetrek logo.

## Rebuild

Keep the sibling `public` folder in place. With Node.js and Bun installed, run `npm ci`, then `npm run build` from this folder. The build embeds the logo, Archivo font, and mixed audio into a standalone `play-mumbai.html`.

The optional capture script uses Chrome, Puppeteer Core and FFmpeg. Inside the full Techpetrek workspace it uses the installed Motion Studio copy of Puppeteer. In an extracted source kit, install it with `npm install --no-save puppeteer-core@25.16.0`. Set `CHROME_PATH` to the Chrome executable if it differs from the Windows default. Run `npm test` to check controls and seeded replay, or `node scripts/capture.mjs record 720 30` to record the portrait preview.
