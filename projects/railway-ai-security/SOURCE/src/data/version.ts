// The version the Remotion project renders. v1 = first cut (62.25 s, scratch voice, short board hook);
// v2 = the user's long hook (kinetic intro1-3) + "Number one..five", Liam voice (until the take exists: Edge guide voice, timing only).
// Audio for each version: audio-src scripts with --version <v>; src/data/audioManifest.json points at the active mix.
import v1 from '../../SCENE_TIMINGS.json';
import v2 from '../../SCENE_TIMINGS.v2.json';

export const VERSION = 'v2' as 'v1' | 'v2';
export const TIMINGS = (VERSION === 'v2' ? v2 : v1) as unknown as typeof v1;
