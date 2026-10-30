// Open-licensed families (SIL OFL 1.1, files + licences in public/fonts):
//   Cinzel (variable 400-900)              product name and note headings (close to the brand banner's gold serif)
//   Cormorant Garamond (+ italic, 300-700) the copy lines and the note words
//   Inter (variable)                       the url
import { continueRender, delayRender, staticFile } from 'remotion';

const FACES: [string, string, FontFaceDescriptors][] = [
  ['Cinzel', 'fonts/Cinzel-VF.ttf', { weight: '400 900' }],
  ['Cormorant Garamond', 'fonts/CormorantGaramond-VF.ttf', { weight: '300 700' }],
  ['Cormorant Garamond', 'fonts/CormorantGaramond-Italic-VF.ttf', { weight: '300 700', style: 'italic' }],
  ['Inter', 'fonts/InterVariable.woff2', { weight: '100 900' }],
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
