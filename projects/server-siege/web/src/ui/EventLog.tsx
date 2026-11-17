// The sim's event log (scaling, cache, health checks, recovery), newest at the bottom. Debug adds the raw last sample.
import { useEffect, useRef, useState } from 'react';
import { useStore, useSim } from '../store';

export function EventLog() {
  const sim = useSim();
  const debug = useStore((s) => s.debug);
  const [open, setOpen] = useState(true);
  const box = useRef<HTMLDivElement>(null);
  const lines = sim.logLines;
  useEffect(() => { const b = box.current; if (b) b.scrollTop = b.scrollHeight; }, [lines.length, open]);
  const last = sim.last();
  return (
    <aside className={`panel log${open ? '' : ' closed'}`} aria-label="Event log">
      <button type="button" className="panel-title as-button" onClick={() => setOpen(!open)}>
        <span className="dot" />EVENT LOG <small>{lines.length}</small><span className="chev">{open ? '▾' : '▸'}</span>
      </button>
      {open ? (
        <div className="log-lines" ref={box}>
          {lines.map((l, i) => (
            <div key={i} className={`line ${l.kind}`}><span className="mono t">{l.t.toFixed(1)}s</span>{l.text}</div>
          ))}
          {debug && last ? <pre className="raw mono">{JSON.stringify(last, (_k, v) => (typeof v === 'number' ? Math.round(v * 1000) / 1000 : v), 1)}</pre> : null}
        </div>
      ) : null}
    </aside>
  );
}
