// Three open-licensed families (SIL OFL 1.1, files and licences in public/fonts):
//   display  Unbounded        wide, geometric, a little lunar: hero words and the lockup
//   text     Instrument Sans  crisp and slightly condensed: statements, captions, UI
//   mono     JetBrains Mono   code, numbers in data, attributions
import { continueRender, delayRender, staticFile } from 'remotion';

export const F = {
  display: "'Unbounded', 'Instrument Sans', sans-serif",
  text: "'Instrument Sans', system-ui, sans-serif",
  mono: "'JetBrains Mono', ui-monospace, monospace",
} as const;

const FACES: [string, string, string][] = [
  ['Unbounded', 'fonts/Unbounded-VF.ttf', '200 900'],
  ['Instrument Sans', 'fonts/InstrumentSans-VF.ttf', '400 700'],
  ['JetBrains Mono', 'fonts/JetBrainsMono-VF.ttf', '100 800'],
];

let loaded = false;
/** Registers the fonts once and holds the render until they are ready. */
export function loadFonts() {
  if (loaded || typeof document === 'undefined') return;
  loaded = true;
  const h = delayRender('fonts');
  Promise.all(
    FACES.map(([family, file, weight]) => {
      const face = new FontFace(family, `url(${staticFile(file)})`, { weight, style: 'normal' });
      (document.fonts as unknown as { add: (f: FontFace) => void }).add(face);
      return face.load();
    }),
  )
    .then(() => continueRender(h))
    .catch((e) => { console.error('font load failed', e); continueRender(h); });
}

/** Type scale (px) for the two frames. Hero > statement > evidence > attribution. */
export const T = {
  master: { hero: 168, title: 92, statement: 44, body: 30, evidence: 26, label: 19, attribution: 18, caption: 42 },
  reel: { hero: 150, title: 84, statement: 50, body: 34, evidence: 30, label: 24, attribution: 24, caption: 50 },
} as const;
