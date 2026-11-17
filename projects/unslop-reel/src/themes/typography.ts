// Open-licensed families (SIL OFL 1.1, files + licences in public/fonts), picked by the reel's unslop direction:
//   Instrument Sans (variable)  every caption, title and label after the turn (400-600, sentence case)
//   IBM Plex Mono               meta, sources, file names, commands, measurements
//   Inter (variable)            only the slop-era hook (800, gradient text), which the reel then unslops
import { continueRender, delayRender, staticFile } from 'remotion';

const FACES: [string, string, FontFaceDescriptors][] = [
  ['Instrument Sans', 'fonts/InstrumentSans-VF.ttf', { weight: '400 700', stretch: '75% 100%' }],
  ['IBM Plex Mono', 'fonts/IBMPlexMono-Regular.ttf', { weight: '400' }],
  ['IBM Plex Mono', 'fonts/IBMPlexMono-Medium.ttf', { weight: '500' }],
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
