// The bundled music library. Every track was downloaded from the artist's own site (incompetech.com) on 2026-10-27 and
// is licensed Creative Commons Attribution 4.0; the credit below is Kevin MacLeod's standard attribution format.
// "Cipher" is listed but not bundled: its MP3 returned 404 at incompetech, so the app links the source and offers import.
export interface Track {
  id: string; title: string; artist: string; genre: string; bpm: number; mood: string;
  file: string | null; seconds: number | null; license: string; licenseUrl: string; sourceUrl: string; credit: string;
}
const CC = 'Creative Commons Attribution 4.0', CCU = 'https://creativecommons.org/licenses/by/4.0/';
const credit = (t: string) => `"${t}" Kevin MacLeod (incompetech.com)\nLicensed under Creative Commons: By Attribution 4.0 License\nhttp://creativecommons.org/licenses/by/4.0/`;
const mp3 = (t: string) => `https://incompetech.com/music/royalty-free/mp3-royaltyfree/${encodeURIComponent(t)}.mp3`;
const src = (isrc: string) => `https://incompetech.com/music/royalty-free/index.html?isrc=${isrc}`;

export const LIBRARY: Track[] = [
  { id: 'realizer', title: 'Realizer', artist: 'Kevin MacLeod', genre: 'Disco', bpm: 125, mood: 'Grooving / energetic', file: '/music/Realizer.mp3', seconds: 310.2, license: CC, licenseUrl: CCU, sourceUrl: src('USUAN1900024'), credit: credit('Realizer') },
  { id: 'smooth-move', title: 'Smooth Move', artist: 'Kevin MacLeod', genre: 'Funk', bpm: 120, mood: 'Dance groove', file: '/music/Smooth Move.mp3', seconds: 64.1, license: CC, licenseUrl: CCU, sourceUrl: src('USUAN1100528'), credit: credit('Smooth Move') },
  { id: 'electro-cabello', title: 'Electro Cabello', artist: 'Kevin MacLeod', genre: 'Disco', bpm: 117, mood: 'Happy / playful', file: '/music/Electro Cabello.mp3', seconds: 190.8, license: CC, licenseUrl: CCU, sourceUrl: src('USUAN1400048'), credit: credit('Electro Cabello') },
  { id: 'disco-medusae', title: 'Disco Medusae', artist: 'Kevin MacLeod', genre: 'Disco', bpm: 115, mood: 'Fun / energetic', file: '/music/Disco Medusae.mp3', seconds: 221.3, license: CC, licenseUrl: CCU, sourceUrl: src('USUAN1500041'), credit: credit('Disco Medusae') },
  { id: 'funk-game-loop', title: 'Funk Game Loop', artist: 'Kevin MacLeod', genre: 'Funk', bpm: 104, mood: 'Casual dance break', file: '/music/Funk Game Loop.mp3', seconds: 56.5, license: CC, licenseUrl: CCU, sourceUrl: src('USUAN1100839'), credit: credit('Funk Game Loop') },
  { id: 'dream-culture', title: 'Dream Culture', artist: 'Kevin MacLeod', genre: 'Contemporary', bpm: 70, mood: 'Relaxed / dreamy', file: '/music/Dream Culture.mp3', seconds: 214.4, license: CC, licenseUrl: CCU, sourceUrl: src('USUAN1300046'), credit: credit('Dream Culture') },
  // internet-famous Kevin MacLeod tracks, downloaded from incompetech.com on 2026-10-27 (same CC BY 4.0 licence); bpm as measured by the app
  { id: 'local-forecast', title: 'Local Forecast - Elevator', artist: 'Kevin MacLeod', genre: 'Lounge', bpm: 109, mood: 'Elevator / waiting', file: '/music/Local Forecast - Elevator.mp3', seconds: 189.2, license: CC, licenseUrl: CCU, sourceUrl: mp3('Local Forecast - Elevator'), credit: credit('Local Forecast - Elevator') },
  { id: 'monkeys', title: 'Monkeys Spinning Monkeys', artist: 'Kevin MacLeod', genre: 'Comedy', bpm: 143.5, mood: 'Playful / silly', file: '/music/Monkeys Spinning Monkeys.mp3', seconds: 125.0, license: CC, licenseUrl: CCU, sourceUrl: mp3('Monkeys Spinning Monkeys'), credit: credit('Monkeys Spinning Monkeys') },
  { id: 'sneaky-snitch', title: 'Sneaky Snitch', artist: 'Kevin MacLeod', genre: 'Comedy', bpm: 87, mood: 'Sneaky / mischievous', file: '/music/Sneaky Snitch.mp3', seconds: 136.6, license: CC, licenseUrl: CCU, sourceUrl: mp3('Sneaky Snitch'), credit: credit('Sneaky Snitch') },
  { id: 'fluffing-a-duck', title: 'Fluffing a Duck', artist: 'Kevin MacLeod', genre: 'Comedy', bpm: 162.5, mood: 'Goofy / bouncy', file: '/music/Fluffing a Duck.mp3', seconds: 67.3, license: CC, licenseUrl: CCU, sourceUrl: mp3('Fluffing a Duck'), credit: credit('Fluffing a Duck') },
  { id: 'cipher', title: 'Cipher', artist: 'Kevin MacLeod', genre: 'Electronica', bpm: 150, mood: 'High-energy / futuristic', file: null, seconds: null, license: CC, licenseUrl: CCU, sourceUrl: src('USUAN1100844'), credit: credit('Cipher') },
];
