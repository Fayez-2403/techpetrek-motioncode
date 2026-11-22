// The picture's own events -> audio/events.json: the level timeline, a name slam + site whoosh + upgrade accent per
// resource, the Land-book scroll, the Godly wipe, the payoff, the CTA.  npx tsx scripts/dump_events.ts
import fs from 'node:fs';
import { levelOf } from '../src/reel/sites';
import { T, sec } from '../src/reel/timeline';
const levels = T.sections.map((s) => ({ t0: s.t0, t1: s.t1, id: s.id, L: levelOf(s.id) || (['payoff', 'cta'].includes(s.id) ? 11 : 0) }));
const ev: { t: number; kind: string; L?: number }[] = [];
for (const s of levels) if (s.L >= 1 && s.L <= 10) ev.push({ t: s.t0, kind: 'slam', L: s.L }, { t: s.t0 + 0.02, kind: 'page', L: s.L }, { t: s.t0 + 0.45, kind: 'act', L: s.L });
ev.push({ t: sec('landbook').t0 + 0.3, kind: 'wipe' }, { t: sec('godly').t0 + 0.1, kind: 'wipe' }, { t: sec('payoff').t0, kind: 'payoff' }, { t: sec('payoff').t1 - 1.6, kind: 'wipe' }, { t: sec('cta').t0 + 0.1, kind: 'cta' });
ev.sort((a, b) => a.t - b.t);
fs.writeFileSync('audio/events.json', JSON.stringify({ duration: T.duration, levels, events: ev }, null, 1));
console.log('events', ev.length, 'duration', T.duration);
