// Three open-licensed families (SIL OFL 1.1, files + licences in public/fonts), as the brief asks:
//   Space Grotesk (variable 300-700)  headlines
//   Inter (variable 100-900)          UI, captions, labels
//   IBM Plex Mono (400-700)           terminal, tool names, file names: things that are literally code
import { continueRender, delayRender, staticFile } from 'remotion';

const FACES: [string, string, FontFaceDescriptors][] = [
  ['Space Grotesk', 'fonts/SpaceGrotesk-VF.ttf', { weight: '300 700' }],
  ['Inter', 'fonts/InterVariable.woff2', { weight: '100 900' }],
  ['IBM Plex Mono', 'fonts/IBMPlexMono-Regular.ttf', { weight: '400' }],
  ['IBM Plex Mono', 'fonts/IBMPlexMono-Medium.ttf', { weight: '500' }],
  ['IBM Plex Mono', 'fonts/IBMPlexMono-SemiBold.ttf', { weight: '600' }],
  ['IBM Plex Mono', 'fonts/IBMPlexMono-Bold.ttf', { weight: '700' }],
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
