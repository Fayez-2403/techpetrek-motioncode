// Writes src/data/plan.json so the Python mix places every sound on the picture's exact clock.
import { writeFileSync } from 'node:fs';
import * as P from '../src/world/plan';
import { RISE } from '../src/world/fx';
writeFileSync('src/data/plan.json', JSON.stringify({ ...P, RISE }, null, 1));
console.log('plan.json written');
