// Mission status (top centre): the level, its targets, the live numbers against them, and at the end the report with the
// score formula written out. SYSTEM RECOVERED appears only when the sim itself says so (sim.recovered).
import { useSim } from '../store';
import { fmt, pct } from './kit';

export function MissionStatus({ compact = false }: { compact?: boolean }) {
  const sim = useSim();
  const sc = sim.sc, tg = sc.targets, T = sim.totals;
  const now = sim.s.now / 1000;
  const finished = T.completed + T.rejected + T.timedOut;
  const success = finished ? T.completed / finished : 1;
  const p95 = sim.last()?.p95 ?? 0;
  const okS = success >= tg.success, okP = p95 <= tg.p95, okC = T.peakCost <= tg.budget;
  const r = sim.done ? sim.report() : null;

  return (
    <div className={`mission${compact ? ' compact' : ''}`}>
      <div className="mission-head">
        <span className="lvl">{sc.level ? `LEVEL ${sc.level}` : 'FREE PLAY'}</span>
        <h1>{sc.name}</h1>
        <span className="clock mono">{now.toFixed(1)} / {sc.duration} s</span>
      </div>
      {!compact ? <p className="brief">{sc.brief}</p> : null}
      <div className="targets">
        <span className={okS ? 'ok' : 'bad'}>success <b className="mono">{pct(success, 2)}</b> / ≥ {pct(tg.success)}</span>
        <span className={okP ? 'ok' : 'bad'}>p95 <b className="mono">{Math.round(p95)} ms</b> / ≤ {tg.p95}</span>
        <span className={okC ? 'ok' : 'bad'}>peak cost <b className="mono">{fmt(T.peakCost)}</b> / ≤ {fmt(tg.budget)} cr/hr</span>
      </div>
      <div className="progress"><div style={{ width: `${Math.min(100, (now / sc.duration) * 100)}%` }} /></div>
      {sim.recovered && !r ? <div className="recovered">SYSTEM RECOVERED</div> : null}
      {r ? (
        <div className={`report ${r.passed ? 'pass' : 'fail'}`}>
          <div className="verdict">{r.passed ? 'MISSION PASSED' : 'MISSION FAILED'} <span className="mono">· score {r.score}</span></div>
          <div className="formula mono">
            score = 1000 × (0.5 × reliability + 0.3 × latency + 0.2 × cost)<br />
            = 1000 × (0.5 × {r.rel.toFixed(3)} + 0.3 × {r.lat.toFixed(3)} + 0.2 × {r.cost.toFixed(3)})
          </div>
          <div className="formula-key">
            reliability = success {pct(r.success, 2)} ÷ target {pct(tg.success)} (max 1) · latency = target {tg.p95} ms ÷ run p95 {Math.round(r.p95)} ms (max 1) · cost = 1.5 − peak {fmt(r.peakCost)} ÷ budget {fmt(tg.budget)} (0..1)
          </div>
          <p className="lesson">{sc.lesson}</p>
        </div>
      ) : null}
    </div>
  );
}
