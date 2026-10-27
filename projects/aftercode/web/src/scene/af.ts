// AF: the per-frame audio signal every 3D system reads. Computed once per frame from the one clock (engine.time()):
// kick / snare are onset envelopes of the bass / mid bands (frequency approximations, not separated stems), bass / mid / high
// are band levels, `drop` is 1 inside a section the analysis flagged as a big loudness rise.
import { engine } from '../audio/engine';
import { feat, hitEnv, beatPos, sectionAt } from '../audio/analysis';

export const AF = { t: 0, b: 0, beatLen: 0.5, bpm: 120, kick: 0, snare: 0, bass: 0, mid: 0, high: 0, rms: 0, drop: 0, section: 0, dropBeat: 1e9, phrase: 0, beatPhase: 0, dur: 0 };
export function updateAF() {
  const t = engine.time(), a = engine.analysis;
  AF.t = t; AF.dur = engine.duration();
  if (!a) { AF.b = t * 2; AF.beatLen = 0.5; AF.kick = AF.snare = AF.bass = AF.mid = AF.high = AF.rms = AF.drop = 0; AF.beatPhase = AF.b % 1; return AF; }
  AF.bpm = a.bpm; AF.beatLen = 60 / a.bpm; AF.b = beatPos(a, t); AF.beatPhase = ((AF.b % 1) + 1) % 1; AF.phrase = Math.floor(AF.b / 32);
  AF.kick = hitEnv(a, a.kick, t, 0.16, 0.42); AF.snare = hitEnv(a, a.snare, t, 0.12, 0.5);
  AF.bass = feat(a, a.bass, t); AF.mid = feat(a, a.mid, t); AF.high = feat(a, a.high, t); AF.rms = feat(a, a.rms, t);
  const s = sectionAt(a, t); AF.section = s ? a.sections.indexOf(s) : 0; AF.drop = s?.drop ? 1 : 0;
  const firstDrop = a.sections.find((x) => x.drop); AF.dropBeat = firstDrop ? beatPos(a, firstDrop.t0) : 1e9;
  return AF;
}
