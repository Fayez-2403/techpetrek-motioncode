// Web Worker: generates a pre-fractured target off the main thread.
import { generate, transferables } from './fracture';
import type { FieldKind } from './shapes';

self.onmessage = (e: MessageEvent<{ id: number; kind: FieldKind; seed: number; n: number }>) => {
  const { id, kind, seed, n } = e.data;
  const fr = generate(kind, seed, n);
  (self as unknown as Worker).postMessage({ id, fr }, transferables(fr));
};
