// Active version of this reel. v1 reads SCENE_TIMINGS.json (the v2 render); v3 is the hot re-voice with the GTA intro,
// the LED-screen billboard and the BUILD YOUR OWN outro (SCENE_TIMINGS.v3.json). v1 stays intact for re-renders.
import v1 from '../../SCENE_TIMINGS.json';
import v3 from '../../SCENE_TIMINGS.v3.json';

export const VERSION = 'v3' as 'v1' | 'v3';
export const TIMINGS = VERSION === 'v3' ? v3 : v1;
export const TIMINGS_V1 = v1;
