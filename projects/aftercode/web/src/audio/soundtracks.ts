// Mode soundtracks: one song per world, imported by the user from their own files and kept in this browser (IndexedDB).
// Nothing is uploaded or bundled. Switching world from the UI plays that world's song (analysed for beats like any track);
// an empty slot falls back to a bundled CC BY track. The suggestions are labels only: the user brings their own copy.
import type { WorldId } from '../state';

export interface Slot { world: WorldId; name: string; bytes: ArrayBuffer; size: number }

/** what each world was designed around (a hint shown in the empty slot) and the bundled fallback */
export const PAIRING: Record<WorldId, { suggest: string; fallback: string }> = {
  stage: { suggest: 'Naatu Naatu (RRR)', fallback: 'realizer' },
  dream: { suggest: 'Chaleya (Jawan)', fallback: 'dream-culture' },
  tunnel: { suggest: 'Jhoome Jo Pathaan', fallback: 'realizer' },
  office: { suggest: 'Kala Chashma', fallback: 'funk-game-loop' },
  city: { suggest: 'Sapphire (Ed Sheeran)', fallback: 'smooth-move' },
  bloom: { suggest: 'Kesariya', fallback: 'disco-medusae' },
  galaxy: { suggest: 'Tum Hi Ho', fallback: 'dream-culture' },
  chrome: { suggest: 'Malhari', fallback: 'electro-cabello' },
};

const DB = 'aftercode', STORE = 'soundtracks';
let dbp: Promise<IDBDatabase> | null = null;
const db = () => (dbp ??= new Promise((ok, bad) => {
  const r = indexedDB.open(DB, 1);
  r.onupgradeneeded = () => r.result.createObjectStore(STORE, { keyPath: 'world' });
  r.onsuccess = () => ok(r.result); r.onerror = () => bad(r.error);
}));
const run = async <T>(mode: IDBTransactionMode, f: (s: IDBObjectStore) => IDBRequest<T>) => {
  const s = (await db()).transaction(STORE, mode).objectStore(STORE);
  return new Promise<T>((ok, bad) => { const r = f(s); r.onsuccess = () => ok(r.result); r.onerror = () => bad(r.error); });
};

export const getSlot = (w: WorldId) => run<Slot | undefined>('readonly', (s) => s.get(w));
export const clearSlot = (w: WorldId) => run('readwrite', (s) => s.delete(w));
export async function setSlot(w: WorldId, f: File) {
  const slot: Slot = { world: w, name: f.name.replace(/\.[a-z0-9]+$/i, ''), bytes: await f.arrayBuffer(), size: f.size };
  await run('readwrite', (s) => s.put(slot));
  return slot;
}
/** world -> song name, for the panel (bytes stay in the store) */
export async function slotNames(): Promise<Partial<Record<WorldId, string>>> {
  try {
    const all = await run<Slot[]>('readonly', (s) => s.getAll());
    return Object.fromEntries(all.map((x) => [x.world, x.name]));
  } catch { return {}; }   // private window / storage blocked: the feature still works per session via fallbacks
}
export const slotTrackId = (s: Slot) => `slot:${s.world}:${s.name}:${s.size}`;
