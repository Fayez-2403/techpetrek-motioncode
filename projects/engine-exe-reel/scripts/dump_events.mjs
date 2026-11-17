// The picture's own events (sparks, burns, valve closings, cuts) from src/reel/director.js → audio/events.json.
//   node scripts/dump_events.mjs
import fs from 'node:fs';
import {DURATION, events, playbackAt, thetaAt, K} from '../src/reel/director.js';
const ev = events();
fs.mkdirSync(new URL('../audio/', import.meta.url), {recursive: true});
fs.writeFileSync(new URL('../audio/events.json', import.meta.url), JSON.stringify({duration: DURATION, events: ev}, null, 1));
const n = (k) => ev.filter((e) => e.kind === k).length;
console.log(`${ev.length} events: ${n('spark')} sparks, ${n('burn')} burns, ${n('valve')} valve closings, ${n('cut')} cuts`);
for (const [k, t] of Object.entries(K)) console.log(k.padEnd(9), t.toFixed(2), 'θ', (((thetaAt(t) % 720) + 720) % 720).toFixed(1), 'picture', (1 / playbackAt(t)).toFixed(0) + 'x slower');
