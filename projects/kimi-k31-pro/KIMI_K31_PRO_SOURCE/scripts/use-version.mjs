// Make one film version the active set the compositions import: SCENE_TIMINGS.<v>.json -> SCENE_TIMINGS.json and
// src/data/audioManifest.<v>.json -> src/data/audioManifest.json.     node scripts/use-version.mjs v1|v2
import { copyFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const v = process.argv[2] ?? 'v1';
for (const [a, b] of [[`SCENE_TIMINGS.${v}.json`, 'SCENE_TIMINGS.json'], [`src/data/audioManifest.${v}.json`, 'src/data/audioManifest.json']]) {
  if (!existsSync(path.join(ROOT, a))) throw new Error(`missing ${a}`);
  copyFileSync(path.join(ROOT, a), path.join(ROOT, b));
}
console.log(`active version: ${v}`);
