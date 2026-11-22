// The picture's own events -> audio/events.json: the level timeline (which repo is on, from when), every ball impact
// (the 0.5 s beat grid, as the stage uses), beat starts (name slams + page fly-ins), the FFmpeg export, the total, the CTA.
//   npx tsx scripts/dump_events.ts
import fs from 'node:fs';
import { levelOf } from '../src/reel/repos';
import { T, sec } from '../src/reel/timeline';

const levels = T.sections.map((s) => ({ t0: s.t0, t1: s.t1, id: s.id, L: levelOf(s.id) || (['payoff', 'total', 'cta'].includes(s.id) ? 19 : 0) }));
const ev: { t: number; kind: string; L?: number }[] = [];
for (const s of levels) if (s.L >= 1 && s.L <= 18) { ev.push({ t: s.t0, kind: 'slam', L: s.L }); ev.push({ t: s.t0 + 0.02, kind: 'page', L: s.L }); }
const Lat = (t: number) => levels.find((s) => t >= s.t0 && t < s.t1)?.L ?? 0;
for (let k = 1; k * 0.5 < T.duration - 0.6; k++) ev.push({ t: k * 0.5, kind: 'impact', L: Lat(k * 0.5) });
ev.push({ t: sec('payoff').t0, kind: 'payoff' }, { t: sec('total').t0 + 0.1, kind: 'total' }, { t: sec('cta').t0 + 0.1, kind: 'cta' });
ev.push({ t: sec('motionmaxxing').t0 + 0.15, kind: 'wipe' }, { t: sec('effectcraft').t0 + 0.15, kind: 'explode' }, { t: sec('ffmpeg').t0 + 0.9, kind: 'render' }, { t: sec('ffmpeg').t0 + 2.4, kind: 'done' });
ev.sort((a, b) => a.t - b.t);
fs.writeFileSync('audio/events.json', JSON.stringify({ duration: T.duration, levels, events: ev }, null, 1));
console.log('events', ev.length, 'duration', T.duration);
