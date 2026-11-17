// Live metrics from the simulator: the latest 100 ms sample (sim.last()), the run totals, and charts over sim.samples.
import { useSim } from '../store';
import { Chart } from './Chart';
import { fmt, fmtK, ms, pct } from './kit';

const C = { cyan: '#2ee6ff', amber: '#ffb020', coral: '#ff4d5e', emerald: '#2bff9a', violet: '#a98bff', orange: '#ff8a3d', white: '#dfe8ff' };
const utilColor = (u: number) => (u >= 0.95 ? C.coral : u >= 0.7 ? C.amber : C.cyan);

function Stat({ label, value, color, sub }: { label: string; value: string; color?: string; sub?: string }) {
  return (
    <div className="stat">
      <span className="stat-label">{label}</span>
      <span className="stat-value mono" style={color ? { color } : undefined}>{value}</span>
      {sub ? <span className="stat-sub">{sub}</span> : null}
    </div>
  );
}

function Bar({ label, u, color }: { label: string; u: number; color?: string }) {
  const c = color ?? utilColor(u);
  return (
    <div className="ubar">
      <span>{label}</span>
      <div className="track"><div className="fill" style={{ width: `${Math.min(100, u * 100)}%`, background: c, boxShadow: `0 0 10px ${c}88` }} /></div>
      <b className="mono" style={{ color: c }}>{pct(u)}</b>
    </div>
  );
}

export function MetricsPanel({ compact = false }: { compact?: boolean }) {
  const sim = useSim();
  const x = sim.last(), T = sim.totals, sc = sim.sc, S = sim.samples;
  const now = sim.s.now / 1000;
  const failed = T.rejected + T.timedOut;
  const up = sim.insts.filter((i) => i.state === 'up').length, boot = sim.insts.filter((i) => i.state === 'boot').length;
  const col = (k: keyof NonNullable<typeof x>) => S.map((s) => s[k] as number);

  return (
    <aside className={`panel metrics${compact ? ' compact' : ''}`} aria-label="Metrics">
      <h2 className="panel-title"><span className="dot live" />LIVE METRICS</h2>
      <p className="disclaimer">Simulated backend · fictional costs</p>

      <div className="stats">
        <Stat label="Arrivals" value={`${fmtK(x?.arrRate ?? 0)}/s`} sub={`${fmt(T.arrived)} total`} />
        <Stat label="Completed" value={fmt(T.completed)} color={C.cyan} sub={`${fmtK(x?.doneRate ?? 0)}/s`} />
        <Stat label="Failed" value={fmt(failed)} color={failed ? C.coral : undefined} sub={`${fmt(T.rejected)} rejected · ${fmt(T.timedOut)} timed out`} />
        <Stat label="In flight" value={fmt(sim.inFlight)} sub={`DB queue ${fmt(sim.dbQueued)}`} />
        <Stat label="Error rate" value={pct(x?.errRate ?? 0, 1)} color={(x?.errRate ?? 0) > 0.01 ? C.coral : C.emerald} />
        <Stat label="Cache hit" value={sim.p.cacheOn ? pct(x?.hitRate ?? 0) : 'off'} color={sim.p.cacheOn ? C.emerald : undefined} />
        <Stat label="p50 / p95" value={`${Math.round(x?.p50 ?? 0)} / ${Math.round(x?.p95 ?? 0)}`} color={(x?.p95 ?? 0) > sc.targets.p95 ? C.coral : C.white} sub="ms · last 5 s" />
        <Stat label="Replicas" value={`${up}${boot ? ` +${boot}` : ''}`} color={boot ? C.amber : C.cyan} sub={boot ? `${boot} booting` : 'ready'} />
        <Stat label="Cost" value={`${fmt(sim.cost)}`} color={sim.cost > sc.targets.budget ? C.coral : C.white} sub={`cr/hr · budget ${fmt(sc.targets.budget)}`} />
        <Stat label="Jobs queued" value={fmt(sim.jobsQueued)} color={C.violet} sub={`${fmt(T.jobsDone)} done`} />
      </div>

      <div className="ubars">
        <Bar label="App tier" u={x?.appUtil ?? 0} />
        <Bar label="Database" u={x?.dbUtil ?? 0} />
        <Bar label="Workers" u={x?.jobUtil ?? 0} color={C.violet} />
      </div>

      <h3>Throughput vs arrivals <small>req/s</small></h3>
      <Chart duration={sc.duration} now={now} fmt={fmtK} height={compact ? 90 : 62}
        series={[{ values: col('arrRate'), color: C.white, label: 'arrivals' }, { values: col('doneRate'), color: C.cyan, fill: true, label: 'completed' }, { values: col('failRate'), color: C.coral, label: 'failed' }]} />
      <h3>Latency <small>ms</small></h3>
      <Chart duration={sc.duration} now={now} fmt={(v) => ms(v)} height={compact ? 90 : 62} target={{ v: sc.targets.p95, color: C.amber, label: `target ${sc.targets.p95}` }}
        series={[{ values: col('p95'), color: C.coral, label: 'p95' }, { values: col('p50'), color: C.cyan, label: 'p50' }]} />
      {!compact ? (
        <>
          <h3>Utilization</h3>
          <Chart duration={sc.duration} now={now} max={1.05} fmt={(v) => pct(Math.min(1, v))}
            series={[{ values: col('appUtil'), color: C.cyan, label: 'app' }, { values: col('dbUtil'), color: C.orange, label: 'database' }, { values: col('hitRate'), color: C.emerald, label: 'cache hit' }]} />
          <h3>Queues <small>requests</small></h3>
          <Chart duration={sc.duration} now={now} fmt={fmtK}
            series={[{ values: col('appQ'), color: C.cyan, label: 'app' }, { values: col('dbQ'), color: C.orange, label: 'database' }, { values: col('jobQ'), color: C.violet, label: 'jobs' }]} />
        </>
      ) : null}
    </aside>
  );
}
