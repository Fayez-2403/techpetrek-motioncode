// Three open-licensed families (SIL OFL 1.1, files + licences in public/fonts):
//   head   Archivo (variable width + weight)  heavy, tight case-file headlines
//   serif  Instrument Serif                   the big case numerals and editorial accents
//   mono   JetBrains Mono                      kickers, chips, counters, footnotes
import { continueRender, delayRender, staticFile } from 'remotion';

export const F = {
  head: "'Archivo', system-ui, sans-serif",
  serif: "'Instrument Serif', Georgia, serif",
  mono: "'JetBrains Mono', ui-monospace, monospace",
} as const;

const FACES: [string, string, FontFaceDescriptors][] = [
  ['Archivo', 'fonts/Archivo-VF.ttf', { weight: '100 900', stretch: '62% 125%' }],
  ['Instrument Serif', 'fonts/InstrumentSerif-Regular.ttf', { weight: '400', style: 'normal' }],
  ['Instrument Serif', 'fonts/InstrumentSerif-Italic.ttf', { weight: '400', style: 'italic' }],
  ['JetBrains Mono', 'fonts/JetBrainsMono-VF.ttf', { weight: '100 800' }],
];

let loaded = false;
export function loadFonts() {
  if (loaded || typeof document === 'undefined') return;
  loaded = true;
  const h = delayRender('fonts');
  Promise.all(FACES.map(([family, file, d]) => {
    const face = new FontFace(family, `url(${staticFile(file)})`, d);
    (document.fonts as unknown as { add: (f: FontFace) => void }).add(face);
    return face.load();
  })).then(() => continueRender(h)).catch((e) => { console.error('font load failed', e); continueRender(h); });
}
