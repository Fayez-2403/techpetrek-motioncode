// Writes src/data/shots.json (every placed shot with t0/t1) so the Python mix shares the picture's exact clock.
import { writeFileSync } from 'node:fs';
import { SHOTS } from '../src/data/edit';
writeFileSync('src/data/shots.json', JSON.stringify(SHOTS.map((s) => ({ ...s })), null, 1));
console.log(SHOTS.length, 'shots');
