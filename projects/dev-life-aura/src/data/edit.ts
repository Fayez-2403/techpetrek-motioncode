// The edit decision list: every chapter is a run of shots measured in BEATS of the measured grid (src/data/beat-grid.ts),
// laid back to back from the chapter's cut, so every cut lands on the music by construction. The last shot of a chapter
// stretches to the next chapter's cut. Sources: stock (public/footage, licences in docs/asset_manifest.csv), our
// code-built screens / 3D, and the generated protagonist (assets/generated -> public/gen; a still with a push until its
// Veo clip exists, see src/data/gen.json).
import { GRID } from './beat-grid';
import GEN from './gen.json';

export type Grade = 'dawn' | 'day' | 'warm' | 'night' | 'alert' | 'travel' | 'end';
export type Move = { z0?: number; z1?: number; x0?: number; x1?: number; y0?: number; y1?: number };
export type Shot =
  | { kind: 'clip'; src: string; from?: number; grade: Grade; move?: Move; flip?: boolean; speed?: number }
  | { kind: 'gen'; id: string; grade: Grade; move?: Move; from?: number }
  | { kind: 'screen'; id: string; grade?: Grade }
  | { kind: 'three'; id: string };
export type Placed = Shot & { t0: number; t1: number; chapter: string; i: number };

const BEATS = GRID.beats as readonly number[];
const SCENE = (id: string) => GRID.scenes.find((s) => s.id === id)!;
// the beat index at (or right after) time t
const beatIdx = (t: number) => { let i = BEATS.findIndex((b) => b >= t - 0.02); return i < 0 ? BEATS.length - 1 : i; };

type Spec = [number, Shot];          // [length in beats, shot]
const C: Record<string, Spec[]> = {
  // 01 COLD OPEN: the reflection in the eye (one held shot), then into the window light
  '01': [[99, { kind: 'gen', id: 'V1', grade: 'dawn', from: 0.5, move: { z0: 1.06, z1: 1.0 } }]],      // V1: the blink at ~1-2.5 s
  // 02 DISCIPLINE BEFORE THE SCREEN: curtain light, water, breakfast, shoes
  '02': [[2, { kind: 'clip', src: 's02_curtain', grade: 'dawn', from: 1.5, move: { z0: 1.06, z1: 1.0 } }],
         [2, { kind: 'clip', src: 's02_pour_water', grade: 'dawn', from: 2.0 }],
         [2, { kind: 'clip', src: 's02_breakfast', grade: 'dawn', from: 6.0, move: { z0: 1.0, z1: 1.08 } }],
         [99, { kind: 'clip', src: 's02_shoes', grade: 'dawn', from: 1.2 }]],
  // 03 PRE-DROP: laptop packed, the platform (him), the doors close into a seam at the drop
  '03': [[2, { kind: 'clip', src: 's03_laptop_case', grade: 'warm', from: 18, move: { z0: 1.4, z1: 1.46, x0: -60, x1: -60, y0: -220, y1: -220 } }],
         [4, { kind: 'gen', id: 'V2', grade: 'day', from: 2.8, move: { z0: 1.0, z1: 1.04 } }],     // V2: he turns to the train
         [99, { kind: 'clip', src: 's03_doors_close', grade: 'day', from: 10.5 }]],
  // 04 COMMUTE (payoff 1 at 12.51): seam -> cursor, then one shot per beat
  '04': [[1, { kind: 'screen', id: 'cursor' }],
         [2, { kind: 'clip', src: 's04_escalator', grade: 'day', from: 4 }],
         [1, { kind: 'clip', src: 's04_crosswalk_feet', grade: 'day', from: 2 }],
         [1, { kind: 'clip', src: 's04_bike_wheel', grade: 'day', from: 3 }],
         [2, { kind: 'clip', src: 's04_crowd_cross', grade: 'day', from: 6 }],
         [2, { kind: 'clip', src: 's04_train_laptop', grade: 'day', from: 2 }],
         [2, { kind: 'three', id: 'route' }],
         [99, { kind: 'clip', src: 's04_office_glass', grade: 'warm', from: 3, move: { z0: 1.0, z1: 1.06 } }]],
  // 05 STANDUP: office, the agenda, the room, a colleague on the call, the call tile becomes the editor
  '05': [[2, { kind: 'clip', src: 's05_office', grade: 'day', from: 5 }],
         [4, { kind: 'screen', id: 'standup' }],
         [2, { kind: 'clip', src: 's05_meeting', grade: 'day', from: 8 }],
         [2, { kind: 'clip', src: 's05_videocall', grade: 'day', from: 3 }],
         [99, { kind: 'screen', id: 'calltile' }]],
  // 06 DEEP WORK (signature): the orbit, real code, keys, tests, the architecture extrude, the diff, the pause
  '06': [[4, { kind: 'gen', id: 'V3', grade: 'warm', from: 0.6, move: { z0: 1.0, z1: 1.03 } }],          // V3: typing, the lamp slides in
         [4, { kind: 'screen', id: 'editor' }],
         [2, { kind: 'clip', src: 's06_mech_keys', grade: 'warm', from: 2 }],
         [3, { kind: 'screen', id: 'tests' }],
         [3, { kind: 'three', id: 'layers' }],
         [2, { kind: 'screen', id: 'diff' }],
         [2, { kind: 'clip', src: 's06_programmer_v', grade: 'warm', from: 1 }],
         [99, { kind: 'gen', id: 'F3', grade: 'warm', move: { z0: 1.04, z1: 1.1 } }]],
  // 07 SYSTEM DESIGN: whiteboard, the 3D stack, discussion, PR review -> approved
  '07': [[3, { kind: 'clip', src: 's07_whiteboard', grade: 'day', from: 3 }],
         [4, { kind: 'three', id: 'stack' }],
         [2, { kind: 'clip', src: 's07_coworkers', grade: 'day', from: 4 }],
         [99, { kind: 'screen', id: 'pr' }]],
  // 08 REFUEL: lunch, the park, water at the desk (the edit relaxes for a bar)
  '08': [[3, { kind: 'clip', src: 's08_salad', grade: 'warm', from: 4, move: { z0: 1.0, z1: 1.06 } }],
         [2, { kind: 'clip', src: 's08_bowl', grade: 'warm', from: 0 }],
         [4, { kind: 'clip', src: 's08_park', grade: 'day', from: 2 }],
         [99, { kind: 'clip', src: 's08_water_desk', grade: 'day', from: 1.5 }]],
  // 09 CODE -> TESTS -> COMMIT -> CI (second signature): bug, branch, a failing test, the fix, the PR, the CI dominoes
  '09': [[3, { kind: 'screen', id: 'bug' }],
         [3, { kind: 'screen', id: 'testfail' }],
         [2, { kind: 'clip', src: 's06_keys_lowlight', grade: 'warm', from: 3 }],
         [3, { kind: 'screen', id: 'commit' }],
         [5, { kind: 'three', id: 'ci' }],
         [99, { kind: 'screen', id: 'cipass' }]],
  // 10 INCIDENT (the bass drop at 67.49 is the escalation): the glow on his face, the dashboard, phone, channel, decision
  '10': [[2, { kind: 'gen', id: 'V4', grade: 'alert', from: 2.0, move: { z0: 1.0, z1: 1.05 } }],     // V4: headphones on, right before the drop
         [3, { kind: 'screen', id: 'dashboard' }],
         [1, { kind: 'clip', src: 's10_phone_dark', grade: 'alert', from: 4, move: { z0: 1.35, z1: 1.45, y0: 240, y1: 240 } }],
         [3, { kind: 'screen', id: 'channel' }],
         [1, { kind: 'clip', src: 's10_night_desk', grade: 'alert', from: 5 }],
         [3, { kind: 'screen', id: 'rollback' }],
         [99, { kind: 'gen', id: 'V4', grade: 'alert', from: 5.0, move: { z0: 1.06, z1: 1.1 } }]],     // V4 later: decisive typing
  // 11 RECOVERY + DEPLOY: the graph heals, the pipeline flythrough, three real statuses
  '11': [[3, { kind: 'screen', id: 'heal' }],
         [3, { kind: 'three', id: 'deploy' }],
         [2, { kind: 'clip', src: 's06_mech_keys', grade: 'night', from: 6 }],
         [99, { kind: 'screen', id: 'statuses' }]],
  // 12 PRACTICE: pen, the graph, the notebook, the judge (wrong answer first)
  '12': [[2, { kind: 'clip', src: 's12_pen_graph', grade: 'night', from: 2 }],
         [3, { kind: 'three', id: 'dijkstra' }],
         [1, { kind: 'clip', src: 's12_notebook', grade: 'night', from: 2, move: { z0: 1.1, z1: 1.15 } }],
         [99, { kind: 'screen', id: 'judge' }]],
  // 13 TRAVEL (a later week): airport, luggage, wing at sunset, neon rain, a cafe window
  '13': [[1, { kind: 'clip', src: 's13_airport', grade: 'travel', from: 3 }],
         [1, { kind: 'clip', src: 's13_luggage', grade: 'travel', from: 4 }],
         [99, { kind: 'clip', src: 's13_wing', grade: 'travel', from: 0.5 }]],
  // 14 LOG OFF: the same developer, the same desk; the last Enter; the screen goes dark
  // V5 (Veo 3.1 Lite): last keypress ~1.4 s in, the lid closes at 4.35 s = 98.907 (the screen-off), he stands and leaves
  '14': [[99, { kind: 'gen', id: 'V5', grade: 'end', from: 0, move: { z0: 1.0, z1: 1.04 } }]],
};

export const START: Record<string, number> = { '14': 94.557 };     // 14 starts on the beat 2.2 s early (travel shortens)
const SCENES = GRID.scenes.map((s, j, a) => ({ id: s.id, t: START[s.id] ?? s.t, end: j + 1 < a.length ? (START[a[j + 1].id] ?? a[j + 1].t) : s.end }));
export const SHOTS: Placed[] = (() => {
  const out: Placed[] = [];
  for (const sc of SCENES) {
    let bi = beatIdx(sc.t), t: number = sc.t; let i = 0;
    for (const [n, shot] of C[sc.id]) {
      const nb = Math.min(BEATS.length - 1, bi + n);
      const t1 = n >= 99 || BEATS[nb] > sc.end - 0.05 ? sc.end : BEATS[nb];
      out.push({ ...shot, t0: t, t1, chapter: sc.id, i: i++ } as Placed);
      if (t1 >= sc.end) break;
      t = t1; bi = nb;
    }
  }
  return out;
})();
export const GEN_CLIPS = GEN as Record<string, string>;      // id -> public path of a finished Veo clip
export { SCENE, BEATS };
