// ARCHITECT CONSOLE: every control writes a real action into the sim (useStore().set), and the sim records it on the
// timeline. Controls a level locks are greyed with the reason; each one carries a one-line engineering explanation.
import { useStore, useSim, type CamMode } from '../store';
import { DB_TIERS, type DbTier, type LbStrategy } from '../simulation/engine';
import type { ControlKey } from '../simulation/scenarios';
import { Section, Seg, Slider, Stepper, Toggle, fmt, fmtK } from './kit';
import { sfx } from '../audio/ui';

const TIP: Record<string, string> = {
  traffic: 'Arrival rate as a share of the scenario curve. Past a tier\'s capacity, queues grow until requests time out or get rejected.',
  replicas: 'App instances behind the load balancer. Each serves ~5,000 req/s and needs a few seconds to boot. More app servers never add database capacity.',
  lb: 'How the load balancer picks an instance. Round robin rotates blindly; least connections favours the shortest queue; weighted splits by configured capacity.',
  health: 'Health checks pull an instance from rotation when its queue wait passes 1 s, and add it back once it recovers.',
  cache: 'An edge cache answers repeated reads without touching the app or the database. Writes and uncacheable reads always go through.',
  autoscale: 'The autoscaler compares average app utilization with a target and adds or removes instances (ceil(n · util / target)). New instances still need to boot.',
  db: 'The database has its own capacity in work units per second (a read is 1 unit, a write is 2). It is independent of the app tier.',
  workers: 'Workers drain the async job queue at ~400 jobs/s each. Jobs are acknowledged (202) right away; the queue absorbs bursts.',
  timeout: 'How long a client waits. Requests still queued after this fail as timed out, even if the server would finish them later.',
  camera: 'Camera framing only: it changes what you see, never what the simulation does.',
};

const LB_OPTS: { v: LbStrategy; label: string; tip: string }[] = [
  { v: 'rr', label: 'Round robin', tip: 'Rotates through healthy-looking instances, blind to their load.' },
  { v: 'least', label: 'Least conn', tip: 'Sends each chunk of traffic to the instance with the fewest open requests.' },
  { v: 'weighted', label: 'Weighted', tip: 'Splits traffic by each instance\'s configured capacity (it does not see degradation).' },
];
const CAMS: { v: CamMode; label: string }[] = [
  { v: 'overview', label: 'Overview' }, { v: 'follow', label: 'Follow' }, { v: 'bottleneck', label: 'Bottleneck' }, { v: 'orbit', label: 'Orbit' }, { v: 'cinematic', label: 'Cinema' },
];

export function ArchitectConsole({ compact = false }: { compact?: boolean }) {
  const sim = useSim();
  const set = useStore((s) => s.set);
  const cam = useStore((s) => s.cam), setCam = useStore((s) => s.setCam);
  const debug = useStore((s) => s.debug), setDebug = useStore((s) => s.setDebug);
  const p = sim.p;
  const lock = (k: ControlKey) => sim.sc.locked[k];
  const live = sim.insts.filter((i) => i.state === 'up' || i.state === 'boot').length;
  const booting = sim.insts.filter((i) => i.state === 'boot').length;

  return (
    <aside className={`panel console${compact ? ' compact' : ''}`} aria-label="Architect Console">
      <h2 className="panel-title"><span className="dot" />ARCHITECT CONSOLE</h2>

      <Section title="Traffic" tip={TIP.traffic} locked={lock('traffic')} compact={compact}>
        <Slider value={p.trafficPct} min={0} max={100} step={5} show={(v) => `${v} %`} title={TIP.traffic}
          onCommit={(v) => set({ trafficPct: v }, `Traffic → ${v} % of peak`)} />
      </Section>

      <Section title="App replicas" tip={TIP.replicas} locked={lock('replicas')} compact={compact} accent="var(--cyan)">
        <div className="row">
          <Stepper value={live} min={1} max={16} disabled={p.autoscale}
            title={p.autoscale ? 'The autoscaler owns the replica count while it is on. Turn it off to scale by hand.' : TIP.replicas}
            onChange={(v) => set({ appReplicas: v }, `App replicas → ${v}`)} />
          <span className="meta">{booting ? <b className="amber">{booting} booting</b> : 'all ready'}{p.autoscale ? <em> · autoscaler in charge</em> : null}</span>
        </div>
      </Section>

      <Section title="Load balancer" tip={TIP.lb} locked={lock('lb')} compact={compact}>
        <Seg value={p.lb} options={LB_OPTS} onPick={(v) => set({ lb: v })} title={TIP.lb} />
        <div className="row gap">
          <Toggle on={p.healthChecks} label="Health checks" title={TIP.health} disabled={!!lock('health')}
            onChange={(v) => set({ healthChecks: v }, `Health checks ${v ? 'ON' : 'OFF'}`)} />
          {lock('health') ? <span className="meta">🔒 {lock('health')}</span> : null}
        </div>
      </Section>

      <Section title="Edge cache" tip={TIP.cache} locked={lock('cache')} compact={compact} accent="var(--emerald)">
        <Toggle on={p.cacheOn} label={p.cacheOn ? 'Cache ON' : 'Cache OFF'} title={TIP.cache} onChange={(v) => set({ cacheOn: v })} />
        <div className="kv"><span>Size</span>
          <Slider value={p.cacheSize} min={1000} max={50000} step={1000} show={(v) => `${fmtK(v)} keys`} disabled={!p.cacheOn}
            title="How many entries fit. Popular keys follow a Zipf curve, so a small cache already catches most repeats."
            onCommit={(v) => set({ cacheSize: v }, `Cache size → ${fmt(v)} keys`)} />
        </div>
        <div className="kv"><span>TTL</span>
          <Slider value={p.cacheTtl / 1000} min={5} max={120} step={5} show={(v) => `${v} s`} disabled={!p.cacheOn}
            title="Time to live: after this an entry expires and the next read is a miss that refills it."
            onCommit={(v) => set({ cacheTtl: v * 1000 }, `Cache TTL → ${v} s`)} />
        </div>
      </Section>

      <Section title="Autoscaling" tip={TIP.autoscale} locked={lock('autoscale')} compact={compact} accent="var(--amber)">
        <Toggle on={p.autoscale} label={p.autoscale ? 'Autoscale ON' : 'Autoscale OFF'} title={TIP.autoscale} onChange={(v) => set({ autoscale: v })} />
        <div className="kv"><span>Target</span>
          <Slider value={Math.round(p.asTarget * 100)} min={30} max={95} step={5} show={(v) => `${v} %`}
            title="Target average utilization. Lower = more headroom for surges, more cost."
            onCommit={(v) => set({ asTarget: v / 100 }, `Autoscale target → ${v} %`)} />
        </div>
        <div className="kv"><span>Min / max</span>
          <div className="row">
            <Stepper value={p.asMin} min={1} max={p.asMax} title="Never fewer than this many instances." onChange={(v) => set({ asMin: v }, `Autoscale min → ${v}`)} />
            <Stepper value={p.asMax} min={p.asMin} max={16} title="Never more than this many (a cost cap)." onChange={(v) => set({ asMax: v }, `Autoscale max → ${v}`)} />
          </div>
        </div>
        {!compact ? <p className="meta">Boot {p.startupDelay / 1000} s · window {p.asWindow / 1000} s · cooldown {p.asCooldown / 1000} s</p> : null}
      </Section>

      <Section title="Database tier" tip={TIP.db} locked={lock('db')} compact={compact} accent="var(--orange)">
        <Seg value={p.dbTier} title={TIP.db} onPick={(v: DbTier) => set({ dbTier: v })}
          options={(['S', 'M', 'L'] as DbTier[]).map((t) => ({ v: t, label: t, tip: `${fmt(DB_TIERS[t].units)} units/s · ${DB_TIERS[t].cost} cr/hr` }))} />
        <p className="meta mono">{fmt(DB_TIERS[p.dbTier].units)} units/s · {DB_TIERS[p.dbTier].cost} cr/hr</p>
      </Section>

      <Section title="Worker pool" tip={TIP.workers} locked={lock('workers')} compact={compact} accent="var(--violet)">
        <div className="row">
          <Stepper value={p.workers} min={0} max={30} title={TIP.workers} onChange={(v) => set({ workers: v }, `Workers → ${v}`)} />
          <span className="meta mono">{fmt(p.workers * p.workerRate)} jobs/s</span>
        </div>
      </Section>

      <Section title="Client timeout" tip={TIP.timeout} locked={lock('timeout')} compact={compact}>
        <Slider value={p.timeout} min={250} max={5000} step={250} show={(v) => `${(v / 1000).toFixed(2)} s`} title={TIP.timeout}
          onCommit={(v) => set({ timeout: v }, `Timeout → ${(v / 1000).toFixed(2)} s`)} />
      </Section>

      {!compact ? (
        <Section title="Camera" tip={TIP.camera}>
          <div className="cams">
            {CAMS.map((c) => <button key={c.v} type="button" className={cam === c.v ? 'on' : ''} onClick={() => { sfx.click(); setCam(c.v); }}>{c.label}</button>)}
          </div>
          <Toggle on={debug} label="Debug metrics & log" title="Show raw sample values in the event log." onChange={setDebug} />
        </Section>
      ) : null}
    </aside>
  );
}
