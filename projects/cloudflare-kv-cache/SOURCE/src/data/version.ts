// Active version of the Cloudflare KV-cache reel. v1: "Socho…" hook (55 s). v2: the user's Sheetal/Munni hook.
// Timings come from audio-src/timing.py (SCENE_TIMINGS.json = v1, SCENE_TIMINGS.v2.json = v2).
import v1 from '../../SCENE_TIMINGS.json';
import v2 from '../../SCENE_TIMINGS.v2.json';

export const VERSION = 'v2' as 'v1' | 'v2';
export const TIMINGS = VERSION === 'v2' ? v2 : v1;
