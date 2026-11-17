// Writes audio/out/carousel_events.json: every game sound moment from src/carousel/sim.ts (the same data the slides draw),
// so scripts/audio/mix_carousel.py places sound exactly where the picture moves.
//   npx tsx scripts/carousel_events.ts
import { writeFileSync, mkdirSync } from 'node:fs';
import { soundEvents } from '../src/carousel/sim';

mkdirSync('audio/out', { recursive: true });
const ev = soundEvents();
writeFileSync('audio/out/carousel_events.json', JSON.stringify({ _doc: 'written by scripts/carousel_events.ts from src/carousel/sim.ts', events: ev }, null, 1));
console.log(ev.length, 'events');
