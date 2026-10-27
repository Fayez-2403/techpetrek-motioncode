// Fractures come from a worker and are cached in IndexedDB (a reload, or the reel capture, starts instantly).
// The cache key includes a version: bump it whenever shapes.ts or fracture.ts change.
import type { Fracture } from '../core/fracture';
import type { FieldKind } from '../core/shapes';

const VERSION = 'v5';
const DB = 'astra-exe', STORE = 'fractures';

function db(): Promise<IDBDatabase | null> {
  return new Promise((res) => {
    try {
      const r = indexedDB.open(DB, 1);
      r.onupgradeneeded = () => r.result.createObjectStore(STORE);
      r.onsuccess = () => res(r.result);
      r.onerror = () => res(null);
    } catch { res(null); }
  });
}
async function get(key: string): Promise<Fracture | null> {
  const d = await db(); if (!d) return null;
  return new Promise((res) => {
    try { const q = d.transaction(STORE).objectStore(STORE).get(key); q.onsuccess = () => res((q.result as Fracture) ?? null); q.onerror = () => res(null); }
    catch { res(null); }
  });
}
async function put(key: string, fr: Fracture) {
  const d = await db(); if (!d) return;
  try { d.transaction(STORE, 'readwrite').objectStore(STORE).put(fr, key); } catch { /* cache is optional */ }
}

let worker: Worker | null = null, nextId = 1;
const waiting = new Map<number, (fr: Fracture) => void>();

export async function loadFracture(kind: FieldKind, seed: number, n: number, onStatus?: (s: string) => void): Promise<Fracture> {
  const key = `${VERSION}-${kind}-${seed}-${n}`;
  const hit = await get(key);
  if (hit) { onStatus?.(`${kind}: ${hit.chunks.length} pieces (cached)`); return hit; }
  onStatus?.(`fracturing the ${kind} into ${n} pieces...`);
  worker ??= new Worker(new URL('../core/gen.worker.ts', import.meta.url), { type: 'module' });
  worker.onmessage = (e: MessageEvent<{ id: number; fr: Fracture }>) => { waiting.get(e.data.id)?.(e.data.fr); waiting.delete(e.data.id); };
  const id = nextId++;
  const fr = await new Promise<Fracture>((res) => { waiting.set(id, res); worker!.postMessage({ id, kind, seed, n }); });
  onStatus?.(`${kind}: ${fr.chunks.length} pieces in ${(fr.ms / 1000).toFixed(1)} s`);
  void put(key, fr);
  return fr;
}
