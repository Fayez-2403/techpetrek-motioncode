// Scenario picker: the six levels and the sandbox. A corner button reopens it.
import { useStore } from '../store';
import { SCENARIOS } from '../simulation/scenarios';
import { fmt, pct } from './kit';
import { sfx } from '../audio/ui';

export function ScenarioSelector() {
  const open = useStore((s) => s.picker), current = useStore((s) => s.scenarioId);
  const { load, setPicker } = useStore.getState();
  if (!open) return <button type="button" className="picker-open" onClick={() => { sfx.click(); setPicker(true); }}>☰ Levels</button>;
  return (
    <div className="picker" role="dialog" aria-modal="true" aria-label="Choose a scenario">
      <div className="picker-inner">
        <header>
          <span className="kicker">SERVER SIEGE</span>
          <h1>Can your backend survive?</h1>
          <p>A playable system-design simulator. Every number comes from a deterministic simulation of a fictional backend; nothing here load-tests a real website, and costs are fictional credits.</p>
        </header>
        <div className="cards">
          {SCENARIOS.map((s) => (
            <button key={s.id} type="button" className={`card${s.id === current ? ' current' : ''}${s.id === 'million' ? ' hero' : ''}`}
              onClick={() => { sfx.on(); load(s.id); }}>
              <span className="lvl">{s.level ? `LEVEL ${s.level}` : 'FREE PLAY'}</span>
              <h2>{s.name}</h2>
              <p className="brief">{s.brief}</p>
              <p className="lesson">{s.lesson}</p>
              <span className="tg mono">≥ {pct(s.targets.success)} success · p95 ≤ {s.targets.p95} ms · ≤ {fmt(s.targets.budget)} cr/hr · {s.duration} s</span>
            </button>
          ))}
        </div>
        <button type="button" className="ghost close" onClick={() => setPicker(false)}>Keep playing the current scenario</button>
      </div>
    </div>
  );
}
