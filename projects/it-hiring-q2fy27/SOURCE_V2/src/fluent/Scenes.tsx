// V2 scenes (Fluent light): a "Jobs Brief" app window with pivot tabs; each scene is a page of the app. Facts: ../../FACTS.md.
import React from 'react';
import { Img, staticFile, useCurrentFrame } from 'remotion';
import { clamp, criticalSpring, invLerp, lerp } from '../lib/anim';
import { wf } from '../lib/words';
import { CONTENT, Card, FONT, FPS, Headline, Icon, Label, MessageBar, Pill, SEGS, SH, Source, T, Toast, WIN, decel, enter, hit, pop, seg, useScene } from './kit';

const fmt = (x: number) => Math.round(x).toLocaleString('en-US');
const count = (l: number, at: number, v: number, w = 6) => { const s = criticalSpring((l - at) / FPS, w); return s > 0.996 ? v : v * s; };
const SRC = 'Source: Q2 FY27 company results · Moneycontrol, People Matters (Oct 26)';

// ------------------------------------------------------------------ app frame: title bar + pivot tabs
const TABS = [{ t: 'Headlines', w: 168 }, { t: 'Numbers', w: 150 }, { t: 'Freshers', w: 150 }, { t: 'Skills', w: 112 }, { t: 'Apply', w: 104 }];
const TAB_OF: Record<string, number> = { hook: 0, total: 0, bars: 1, wipro: 1, twist: 1, freshers: 2, ai: 2, skills: 3, project: 4, cta: 4 };
const tabX = (i: number) => CONTENT.x + TABS.slice(0, i).reduce((a, b) => a + b.w + 20, 0);

export const AppFrame: React.FC = () => {
  const f = useCurrentFrame();
  const s = SEGS.find((x) => f >= x.from && f < x.from + x.durationInFrames) ?? SEGS[SEGS.length - 1];
  const cur = TAB_OF[s.id], prevSeg = SEGS[Math.max(0, SEGS.indexOf(s) - 1)], prev = TAB_OF[prevSeg.id];
  const k = decel(invLerp(s.from, s.from + 18, f));
  const ix = lerp(tabX(prev), tabX(cur), k), iw = lerp(TABS[prev].w, TABS[cur].w, k);
  return (
    <div style={{ position: 'absolute', left: WIN.x, top: WIN.y, width: WIN.w, height: WIN.h, borderRadius: 16, background: '#F9FAFC', border: `1px solid ${T.stroke2}`, boxShadow: SH.s28 }}>
      <div style={{ height: 64, display: 'flex', alignItems: 'center', gap: 14, padding: '0 22px', borderBottom: `1px solid ${T.stroke}` }}>
        <Img src={staticFile('brand/techpe-trek.jpg')} style={{ width: 34, height: 34, borderRadius: 8 }} />
        <span style={{ fontFamily: FONT.ui, fontWeight: 700, fontSize: 26, color: T.text }}>Jobs Brief</span>
        <span style={{ fontFamily: FONT.ui, fontWeight: 500, fontSize: 22, color: T.text3 }}>· TechpeTrek</span>
        <span style={{ marginLeft: 10 }}><Pill text="Q2 FY27 edition" size={19} /></span>
        <span style={{ flex: 1 }} />
        <svg width={150} height={24} viewBox="0 0 150 24"><path d="M10 12h16M64 5h14v14H64zM118 5l14 14M132 5 118 19" stroke={T.text2} strokeWidth={1.6} fill="none" /></svg>
      </div>
      <div style={{ position: 'relative', height: 66 }}>
        {TABS.map((t, i) => (
          <span key={t.t} style={{ position: 'absolute', left: tabX(i) - WIN.x, top: 16, width: t.w, textAlign: 'center', fontFamily: FONT.ui, fontWeight: i === cur ? 700 : 600, fontSize: 26,
            color: i === cur ? T.text : T.text3 }}>{t.t}</span>
        ))}
        <div style={{ position: 'absolute', left: ix - WIN.x + iw * 0.2, width: iw * 0.6, top: 56, height: 4, borderRadius: 2, background: T.brand }} />
      </div>
    </div>
  );
};

/** page entrance: Fluent slide-from-right + fade */
const Page: React.FC<{ l: number; children: React.ReactNode }> = ({ l, children }) => {
  const p = decel(invLerp(0, 22, l));
  return <div style={{ position: 'absolute', inset: 0, transform: `translateX(${(1 - p) * 90}px)`, opacity: clamp(p * 1.6) }}>{children}</div>;
};

// ------------------------------------------------------------------ 1. hook
export const Hook: React.FC = () => {
  const { l, at } = useScene('hook');
  const ind = at('h1', 'India'), jobs = at('h1', 'jobs'), naya = at('h1', 'naya');
  const flip = decel(invLerp(0, 16, l));
  return (
    <>
      {/* calendar tile, readable at frame 0 */}
      <Card x={CONTENT.x} y={392} w={250} h={260} elev="s16" style={{ overflow: 'hidden', transform: `scale(${1.04 - 0.04 * flip}) rotate(${-3 + 3 * flip}deg)` }}>
        <div style={{ height: 82, background: T.brand, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT.punch, fontSize: 52, color: '#F4F8FD', letterSpacing: '0.04em' }}>NOV</div>
        <div style={{ textAlign: 'center', fontFamily: FONT.punch, fontSize: 84, color: T.text, lineHeight: 2.0 }}>2026</div>
      </Card>
      <div style={{ position: 'absolute', left: CONTENT.x + 286, top: 398 }}>
        <Headline l={l} words={[{ t: 'ISSS', at: -6, color: T.brand }]} size={104} />
        <Headline l={l} words={[{ t: 'NOVEMBER,', at: -4 }]} size={98} />
      </div>
      {/* Fluent loading skeleton: the news "loads" until the headline lands */}
      {l < ind + 14 ? (
        <div style={{ position: 'absolute', left: CONTENT.x, top: 700, width: CONTENT.w, opacity: 1 - invLerp(ind - 2, ind + 14, l) }}>
          {[[0, 620, 70], [90, 840, 110], [230, 300, 44], [290, 888, 96], [410, 888, 96]].map(([y, w, h], i) => (
            <div key={i} style={{ position: 'absolute', top: y, width: w, height: h, borderRadius: 10, overflow: 'hidden', background: T.card2, border: `1px solid ${T.stroke}` }}>
              <div style={{ position: 'absolute', top: 0, bottom: 0, width: 260, left: ((l * 14 + i * 120) % 1300) - 300, background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.95), rgba(255,255,255,0))' }} />
            </div>
          ))}
        </div>
      ) : null}
      <div style={{ position: 'absolute', left: CONTENT.x, width: CONTENT.w, top: 700 }}>
        <Headline l={l} size={86} words={[{ t: 'India', at: ind }, { t: 'mein', at: ind + 6 }, { t: 'JOBS', at: jobs, color: T.brand }, { t: 'ka', at: jobs + 8 }]} />
        <Headline l={l} size={132} words={[{ t: 'NAYA', at: naya, hl: T.brandSoft2 }, { t: 'SCENE!', at: naya + 8, hl: T.brandSoft2 }]} />
      </div>
      <div style={{ position: 'absolute', left: CONTENT.x, top: 1040, display: 'flex', gap: 14, flexWrap: 'wrap', width: CONTENT.w }}>
        {[{ t: 'Freshers', i: 'cap' }, { t: 'Final-year students', i: 'people' }, { t: 'Job aspirants', i: 'briefcase' }].map((x, i) => (
          <Pill key={x.t} text={x.t} icon={x.i} p={pop(l, jobs + 4 + i * 6)} size={28} color={T.text} bg={T.card} style={{ boxShadow: SH.s4, border: `1px solid ${T.stroke}` }} />
        ))}
      </div>
      <div style={{ position: 'absolute', left: CONTENT.x, top: 1140, width: CONTENT.w }}>
        <MessageBar kind="info" title="Q2 FY27 results aa gaye" body="Data: July–September 2026 · 5 IT giants" p={enter(l, naya + 10)} />
      </div>
      <Toast l={l} at={12} icon="news" title="Jobs Brief · India" body="IT hiring update for freshers" y={1256} />
    </>
  );
};

// ------------------------------------------------------------------ 2. total
const COS = [{ n: 'TCS', m: 'TC' }, { n: 'Infosys', m: 'IN' }, { n: 'HCLTech', m: 'HC' }, { n: 'Wipro', m: 'WI' }, { n: 'Tech Mahindra', m: 'TM' }];
const MONO = [T.brand, T.purple, T.teal, T.amber, T.green];
export const Total: React.FC = () => {
  const { l, at } = useScene('total');
  const five = at('l1', 'five'), jul = at('l1', 'July'), net = at('l1', 'net'), add = at('l1', 'add');
  return (
    <Page l={l}>
      <Label text="Top 5 IT companies · Q2 FY27" style={{ position: 'absolute', left: CONTENT.x, top: 392 }} />
      <div style={{ position: 'absolute', left: CONTENT.x, top: 436, width: CONTENT.w, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        {COS.map((c, i) => (
          <div key={c.n} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 18px 8px 8px', borderRadius: 999, background: T.card, border: `1px solid ${T.stroke}`, boxShadow: SH.s4,
            opacity: clamp(pop(l, five + i * 4) * 1.4), transform: `scale(${0.85 + 0.15 * pop(l, five + i * 4)})` }}>
            <span style={{ width: 44, height: 44, borderRadius: 22, background: `${MONO[i]}22`, color: MONO[i], display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT.ui, fontWeight: 800, fontSize: 19 }}>{c.m}</span>
            <span style={{ fontFamily: FONT.ui, fontWeight: 700, fontSize: 28, color: T.text }}>{c.n}</span>
          </div>
        ))}
      </div>
      <Card x={CONTENT.x} y={600} w={CONTENT.w} h={430} p={enter(l, jul - 6)} elev="s16" style={{ padding: '30px 36px', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Icon name="people" size={36} color={T.green} sw={2} />
          <span style={{ fontFamily: FONT.ui, fontWeight: 700, fontSize: 30, color: T.text2 }}>Net headcount added</span>
          <span style={{ flex: 1 }} />
          <Pill text="Jul–Sep 2026" size={22} p={pop(l, jul)} />
        </div>
        <div style={{ fontFamily: FONT.punch, fontSize: 176, color: T.green, lineHeight: 1.1, marginTop: 10, fontVariantNumeric: 'tabular-nums', transform: `scale(${1 + 0.05 * hit(l, add, 20)})`, transformOrigin: 'left center' }}>
          +{fmt(count(l, 10, 13918, 2.2))}
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 18, marginTop: 8 }}>
          {[{ k: 'Q1', v: 5480 }, { k: 'Q2', v: 13918 }].map((b, i) => (
            <div key={b.k} style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}>
              <div style={{ width: 44, height: (b.v / 13918) * 90 * decel(invLerp(net + 10 + i * 8, net + 34 + i * 8, l)), borderRadius: 6, background: i ? T.green : `${T.green}66` }} />
              <span style={{ fontFamily: FONT.ui, fontWeight: 600, fontSize: 22, color: T.text2 }}>{b.k} +{fmt(b.v)}</span>
            </div>
          ))}
        </div>
      </Card>
      <div style={{ position: 'absolute', left: CONTENT.x, top: 1064 }}>
        <MessageBar kind="info" title="Net headcount = vacancies nahi" body="Quarter-end headcount minus quarter-start headcount" p={enter(l, add)} />
      </div>
      <Source text={SRC} />
    </Page>
  );
};

// ------------------------------------------------------------------ 3+4. company chart (bars + wipro)
const ROWS = [
  { n: 'HCLTech', v: 6450, line: 'l2', w: 'HCLTech' },
  { n: 'Tech Mahindra', v: 5446, line: 'l2', w: 'Mahindra' },
  { n: 'Infosys', v: 4480, line: 'l2', w: 'Infosys' },
  { n: 'TCS', v: 4258, line: 'l2', w: 'TCS' },
  { n: 'Wipro', v: -6716, line: 'l3', w: 'Minus' },
];
const Chart: React.FC<{ f: number; y: number }> = ({ f, y }) => {
  const ats = ROWS.map((r) => wf(r.line, r.w) - 6), wipName = wf('l3', 'Wipro');
  const IN = 36, Wd = CONTENT.w - 2 * IN, Z = IN + Wd / 2, S = (Wd / 2) / 6716;
  return (
    <Card x={CONTENT.x} y={y} w={CONTENT.w} h={720} elev="s16">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '26px 36px 6px' }}>
        <Icon name="chart" size={34} color={T.brand} sw={2} />
        <span style={{ fontFamily: FONT.ui, fontWeight: 700, fontSize: 30, color: T.text }}>Net headcount change · Q2 FY27</span>
      </div>
      <div style={{ position: 'absolute', left: Z - 1, top: 92, width: 2, height: 600, background: T.stroke2 }} />
      {ROWS.map((r, i) => {
        const at = ats[i], neg = r.v < 0, shown = i === 4 ? f >= wipName - 4 : f >= at - 4;
        const g = f >= at ? count(f, at, r.v, 7) : 0, len = Math.abs(g) * S, c = neg ? T.red : T.green;
        return (
          <div key={r.n} style={{ position: 'absolute', left: IN, width: Wd, top: 104 + i * 118, opacity: shown ? 1 : 0.3 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontFamily: FONT.ui, fontWeight: 700, fontSize: 38, color: T.text }}>{r.n}</span>
              <span style={{ fontFamily: FONT.punch, fontSize: 46, color: f >= at ? c : T.text3, fontVariantNumeric: 'tabular-nums' }}>{f >= at ? (g >= 0 ? '+' : '−') + fmt(Math.abs(g)) : i === 4 && shown ? '?' : '—'}</span>
            </div>
            <div style={{ position: 'relative', height: 30, marginTop: 8, borderRadius: 6, background: T.card2, border: `1px solid ${T.stroke}` }}>
              <div style={{ position: 'absolute', top: 0, height: 30, borderRadius: 6, background: c, opacity: 0.88, left: neg ? Z - IN - len : Z - IN, width: len,
                boxShadow: hit(f, at, 20) > 0.05 ? `0 0 0 ${4 * hit(f, at, 20)}px ${c}33` : undefined }} />
            </div>
          </div>
        );
      })}
    </Card>
  );
};
export const Bars: React.FC = () => {
  const { f, l } = useScene('bars');
  return (
    <Page l={l}>
      <Label text="Company-wise · net employees" style={{ position: 'absolute', left: CONTENT.x, top: 392 }} />
      <Chart f={f} y={436} />
      <Toast l={l} at={60} out={300} icon="info" title="Net change" body="Joined minus left, not vacancies" y={1180} color={T.green} />
      <Source text={SRC} />
    </Page>
  );
};
export const Wipro: React.FC = () => {
  const { f, l, at } = useScene('wipro');
  const minus = at('l3', 'Minus');
  const sh = 7 * hit(l, minus, 14);
  return (
    <div style={{ position: 'absolute', inset: 0, transform: `translate(${Math.sin(l * 2.9) * sh}px, ${Math.cos(l * 3.4) * sh}px)` }}>
      <Label text="Company-wise · net employees" style={{ position: 'absolute', left: CONTENT.x, top: 392 }} />
      <Chart f={f} y={436} />
      <div style={{ position: 'absolute', left: CONTENT.x, top: 1180 }}>
        <MessageBar kind="error" title="Wipro: −6,716 (net)" body="Baaki chaar companies plus mein · total +13,918" p={enter(l, minus + 16)} />
      </div>
    </div>
  );
};

// ------------------------------------------------------------------ 5. twist
export const Twist: React.FC = () => {
  const { l, at } = useScene('twist');
  const dh = at('l4', 'Dhyaan'), num = at('l4', '13,918'), nahi = at('l4', 'nahi');
  const x = decel(invLerp(nahi, nahi + 12, l));
  return (
    <Page l={l}>
      <div style={{ position: 'absolute', left: CONTENT.x, top: 392 }}><Headline l={l} size={92} words={[{ t: 'DHYAAN', at: Math.max(2, dh) }, { t: 'DO!', at: Math.max(2, dh) + 6, color: T.amber }]} /></div>
      <Card x={CONTENT.x} y={530} w={CONTENT.w} h={230} p={enter(l, 10)} tint={T.greenSoft} style={{ padding: '26px 34px', boxSizing: 'border-box' }}>
        <Label text="Net headcount" />
        <div style={{ fontFamily: FONT.punch, fontSize: 110, color: T.green, lineHeight: 1.05 }}>+13,918</div>
        <div style={{ fontFamily: FONT.text, fontSize: 24, color: T.text2 }}>Sep 30 headcount − Jun 30 headcount</div>
      </Card>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 772, textAlign: 'center', fontFamily: FONT.punch, fontSize: 110, color: T.amber, lineHeight: 1,
        transform: `scale(${pop(l, num)}) rotate(${(1 - pop(l, num)) * 90}deg)` }}>≠</div>
      <Card x={CONTENT.x} y={900} w={CONTENT.w} h={200} p={enter(l, num + 6)} style={{ padding: '26px 34px', boxSizing: 'border-box' }}>
        <Label text="Live job vacancies" />
        <div style={{ position: 'relative', display: 'inline-block', fontFamily: FONT.punch, fontSize: 96, color: T.text3, lineHeight: 1.1 }}>13,918
          <div style={{ position: 'absolute', left: -8, right: -8, top: '52%', height: 9, borderRadius: 5, background: T.red, transformOrigin: 'left', transform: `scaleX(${x}) rotate(-4deg)` }} />
        </div>
        <span style={{ marginLeft: 20 }}><Pill text="NAHI" color={T.red} bg={T.redSoft} size={30} p={pop(l, nahi + 4)} /></span>
      </Card>
      <div style={{ position: 'absolute', left: CONTENT.x, top: 1130 }}>
        <MessageBar kind="warning" title="Net ≠ job openings" body="Openings sirf official careers pages pe dikhte hain" p={enter(l, nahi + 12)} />
      </div>
    </Page>
  );
};

// ------------------------------------------------------------------ 6. freshers
const Ring: React.FC<{ p: number; size: number; color: string; label: string }> = ({ p, size, color, label }) => {
  const r = size / 2 - 10, c = 2 * Math.PI * r;
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size}><circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={T.card2} strokeWidth={14} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={14} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - p)} transform={`rotate(-90 ${size / 2} ${size / 2})`} /></svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT.ui, fontWeight: 800, fontSize: 30, color: T.text }}>{label}</div>
    </div>
  );
};
export const Freshers: React.FC = () => {
  const { l, at } = useScene('freshers');
  const fr = at('l5', 'Freshers'), inf = at('l5', 'Infosys'), hcl = at('l5', 'HCLTech');
  return (
    <Page l={l}>
      <div style={{ position: 'absolute', left: CONTENT.x, top: 392 }}><Headline l={l} size={84} words={[{ t: 'FRESHERS', at: Math.max(2, fr), color: T.brand }, { t: 'KE LIYE?', at: Math.max(2, fr) + 8 }]} /></div>
      <Card x={CONTENT.x} y={520} w={CONTENT.w} h={330} p={enter(l, inf - 4)} elev="s16" style={{ padding: '26px 34px', boxSizing: 'border-box', display: 'flex', gap: 30, alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Icon name="cap" size={36} color={T.purple} sw={2} /><span style={{ fontFamily: FONT.ui, fontWeight: 700, fontSize: 34, color: T.text }}>Infosys</span></div>
          <div style={{ fontFamily: FONT.punch, fontSize: 100, color: T.purple, lineHeight: 1.1 }}>~{fmt(l >= inf ? count(l, inf + 6, 8000) : 0)}</div>
          <div style={{ fontFamily: FONT.text, fontWeight: 600, fontSize: 26, color: T.text2 }}>college graduates · Q2 (CEO, Oct 23 call)</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <Ring p={(13000 / 20000) * decel(invLerp(inf + 20, inf + 60, l))} size={190} color={T.purple} label="13k/20k" />
          <div style={{ fontFamily: FONT.text, fontSize: 20, color: T.text3, marginTop: 6 }}>H1 vs FY27 target</div>
        </div>
      </Card>
      <Card x={CONTENT.x} y={880} w={CONTENT.w} h={300} p={enter(l, hcl - 4)} elev="s16" style={{ padding: '26px 34px', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Icon name="briefcase" size={36} color={T.teal} sw={2} /><span style={{ fontFamily: FONT.ui, fontWeight: 700, fontSize: 34, color: T.text }}>HCLTech</span></div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
          <span style={{ fontFamily: FONT.punch, fontSize: 100, color: T.teal, lineHeight: 1.1 }}>{fmt(l >= hcl ? count(l, hcl + 6, 6136) : 0)}</span>
          <span style={{ fontFamily: FONT.text, fontWeight: 600, fontSize: 26, color: T.text2 }}>freshers recruited · Q2</span>
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>{Array.from({ length: 12 }, (_, i) => <span key={i} style={{ opacity: clamp(pop(l, hcl + 10 + i * 2) * 1.4), transform: `scale(${pop(l, hcl + 10 + i * 2)})` }}><Icon name="cap" size={46} color={T.teal} sw={1.8} /></span>)}</div>
      </Card>
      <div style={{ position: 'absolute', left: CONTENT.x, top: 1210 }}><Pill text="Gross fresher intake · net headcount nahi" icon="info" color={T.text2} bg={T.card} size={24} p={enter(l, hcl + 30)} style={{ boxShadow: SH.s4 }} /></div>
      <Source text="Source: Infosys Q2 FY27 call (Oct 23) · People Matters (Oct 26)" />
    </Page>
  );
};

// ------------------------------------------------------------------ 7. AI signal
export const Ai: React.FC = () => {
  const { l, at } = useScene('ai');
  const ai = at('l6', 'AI'), pc = at('l6', '29');
  const pts = [[0, 140], [120, 128], [240, 118], [360, 96], [480, 70], [600, 20]];
  const draw = decel(invLerp(ai, ai + 50, l));
  return (
    <Page l={l}>
      <Card x={CONTENT.x} y={392} w={CONTENT.w} h={560} p={enter(l, 2)} elev="s16" style={{ padding: '28px 34px', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Icon name="sparkle" size={38} color={T.purple} sw={2} />
          <span style={{ fontFamily: FONT.ui, fontWeight: 700, fontSize: 32, color: T.text }}>Infosys · AI revenue</span>
          <span style={{ flex: 1 }} /><Pill text="Q2 vs Q1" size={22} color={T.purple} bg={T.purpleSoft} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 10 }}>
          <Icon name="up" size={86} color={T.green} sw={2.6} style={{ opacity: clamp(pop(l, pc) * 1.4) }} />
          <span style={{ fontFamily: FONT.punch, fontSize: 170, color: T.green, lineHeight: 1 }}>+{Math.round(count(l, 8, 29, 3))}%</span>
        </div>
        <svg width={620} height={170} viewBox="0 0 620 170" style={{ marginTop: 14 }}>
          <polyline points={pts.map((p) => p.join(',')).join(' ')} fill="none" stroke={T.purple} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={800} strokeDashoffset={800 * (1 - draw)} />
          {pts.map((p, i) => (draw > i / 5 ? <circle key={i} cx={p[0]} cy={p[1]} r={8} fill={T.card} stroke={T.purple} strokeWidth={4} /> : null))}
        </svg>
        <div style={{ fontFamily: FONT.text, fontSize: 20, color: T.text3 }}>Illustration of the trend; the reported figure is +29% quarter-on-quarter</div>
      </Card>
      <div style={{ position: 'absolute', left: CONTENT.x, top: 990, display: 'flex', gap: 14, flexWrap: 'wrap', width: CONTENT.w }}>
        <Pill text="AI = 10.5% of revenue" icon="chart" color={T.purple} bg={T.purpleSoft} size={28} p={pop(l, pc + 16)} />
        <Pill text="CFO, Q2 call · Oct 23" icon="news" color={T.text2} bg={T.card} size={24} p={pop(l, pc + 24)} style={{ boxShadow: SH.s4 }} />
      </div>
      <div style={{ position: 'absolute', left: CONTENT.x, top: 1100 }}>
        <MessageBar kind="success" title="Signal: AI skills ki demand" body="TechpeTrek take · skills list next" p={enter(l, pc + 30)} />
      </div>
    </Page>
  );
};

// ------------------------------------------------------------------ 8. skills
const SKILLS = [
  { t: 'Python ya Java', s: 'ek language, strong basics', i: 'code', c: T.brand, w: 'Python' },
  { t: 'AI + GenAI apps', s: 'APIs, prompts, RAG', i: 'sparkle', c: T.purple, w: 'AI' },
  { t: 'Cloud deployment', s: 'AWS / Azure / GCP basics', i: 'cloud', c: T.teal, w: 'cloud' },
  { t: 'SQL + data', s: 'queries, dashboards', i: 'database', c: T.amber, w: 'SQL' },
  { t: 'Git + testing', s: 'GitHub, unit tests', i: 'branch', c: T.green, w: 'Git' },
];
export const Skills: React.FC = () => {
  const { l, at } = useScene('skills');
  const ats = SKILLS.map((s) => at('l7', s.w)), q = at('l7', 'Toh');
  return (
    <Page l={l}>
      <div style={{ position: 'absolute', left: CONTENT.x, top: 386, width: CONTENT.w, display: 'flex', alignItems: 'center' }}>
        <Headline l={l} size={86} words={[{ t: 'KYA', at: Math.max(2, q) }, { t: 'SEEKHEIN?', at: Math.max(2, q) + 6, color: T.brand }]} />
        <span style={{ flex: 1 }} /><Pill text="TechpeTrek suggestion" size={20} color={T.text2} bg={T.card} style={{ boxShadow: SH.s4 }} />
      </div>
      {SKILLS.map((s, i) => {
        const on = l >= ats[i], p = pop(l, ats[i], 16, 0.55);
        return (
          <Card key={s.t} x={CONTENT.x} y={510 + i * 152} w={CONTENT.w} h={134} p={enter(l, 6 + i * 4)} elev={on ? 's16' : 's4'}
            style={{ display: 'flex', alignItems: 'center', gap: 24, padding: '0 28px', boxSizing: 'border-box', borderLeft: `6px solid ${on ? s.c : T.stroke}` }}>
            <div style={{ width: 84, height: 84, borderRadius: 14, background: on ? `${s.c}1F` : T.card2, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${on ? 0.9 + 0.1 * p : 0.9})` }}>
              <Icon name={s.i} size={50} color={on ? s.c : T.text3} sw={1.9} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: FONT.ui, fontWeight: 800, fontSize: 42, color: on ? T.text : T.text3 }}>{s.t}</div>
              <div style={{ fontFamily: FONT.text, fontWeight: 500, fontSize: 24, color: T.text3 }}>{s.s}</div>
            </div>
            <span style={{ fontFamily: FONT.punch, fontSize: 40, color: on ? s.c : T.stroke2 }}>0{i + 1}</span>
            {on ? <Icon name="check" size={46} color={s.c} sw={2.2} style={{ transform: `scale(${p})` }} /> : <span style={{ width: 46 }} />}
          </Card>
        );
      })}
    </Page>
  );
};

// ------------------------------------------------------------------ 9. project + apply
export const Project: React.FC = () => {
  const { l, at } = useScene('project');
  const dep = at('l8', 'deploy'), live = at('l8', 'live'), app = at('l8', 'Apply'), off = at('l8', 'official');
  const steps = ['Build', 'Test', 'Deploy', 'Live'];
  const prog = decel(invLerp(4, dep + 20, l));
  return (
    <Page l={l}>
      <Card x={CONTENT.x} y={392} w={CONTENT.w} h={380} p={enter(l, 2)} elev="s16" style={{ padding: '28px 34px', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Icon name="rocket" size={40} color={T.brand} sw={1.9} />
          <span style={{ fontFamily: FONT.ui, fontWeight: 800, fontSize: 38, color: T.text }}>Ek project · live deploy</span>
          <span style={{ flex: 1 }} />
          {l >= live ? <Pill text="LIVE" icon="globe" color={T.green} bg={T.greenSoft} size={26} p={pop(l, live)} /> : null}
        </div>
        <div style={{ position: 'relative', height: 12, borderRadius: 6, background: T.card2, marginTop: 40, border: `1px solid ${T.stroke}` }}>
          <div style={{ position: 'absolute', left: 0, top: 0, height: 12, width: `${prog * 100}%`, borderRadius: 6, background: T.brand }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 18 }}>
          {steps.map((s, i) => {
            const done = prog >= (i + 1) / steps.length - 0.01;
            return <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="check" size={34} color={done ? T.brand : T.text3} sw={2} /><span style={{ fontFamily: FONT.ui, fontWeight: 700, fontSize: 28, color: done ? T.text : T.text3 }}>{s}</span></div>;
          })}
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 34 }}>
          <Pill text="README.md" icon="news" size={24} color={T.text2} bg={T.card2} /><Pill text="Live demo link" icon="globe" size={24} color={T.text2} bg={T.card2} /><Pill text="GitHub" icon="branch" size={24} color={T.text2} bg={T.card2} />
        </div>
      </Card>
      <Card x={CONTENT.x} y={810} w={CONTENT.w} h={300} p={enter(l, app - 6)} elev="s16" style={{ padding: '28px 34px', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Icon name="shield" size={48} color={T.green} sw={2} />
          <span style={{ fontFamily: FONT.punch, fontSize: 56, color: T.text }}>Apply sirf <span style={{ color: T.green }}>official</span> site pe</span>
        </div>
        <div style={{ marginTop: 26, display: 'flex', alignItems: 'center', gap: 12, padding: '16px 22px', borderRadius: 10, background: T.card2, border: `1px solid ${T.stroke}` }}>
          <Icon name="globe" size={30} color={l >= off ? T.green : T.text3} sw={2} />
          <span style={{ fontFamily: FONT.mono, fontSize: 28, color: T.text2 }}>company.com/careers</span>
          <span style={{ flex: 1 }} />
          {l >= off ? <Pill text="Verified" icon="check" color={T.green} bg={T.greenSoft} size={22} p={pop(l, off)} /> : null}
        </div>
      </Card>
      <div style={{ position: 'absolute', left: CONTENT.x, top: 1140 }}><Pill text="Illustration · example project and URL" size={20} color={T.text3} bg="transparent" /></div>
    </Page>
  );
};

// ------------------------------------------------------------------ 10. CTA
const Button: React.FC<{ primary?: boolean; icon: string; text: string; press: number; p: number }> = ({ primary, icon, text, press, p }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '24px 40px', borderRadius: 12, background: primary ? T.brand : T.card, border: `1px solid ${primary ? T.brand : T.stroke2}`,
    boxShadow: SH.s8, transform: `scale(${(0.9 + 0.1 * p) * (1 - 0.06 * press)})`, opacity: clamp(p * 1.4) }}>
    <Icon name={icon} size={46} color={primary ? '#F4F8FD' : T.text} sw={2} />
    <span style={{ fontFamily: FONT.punch, fontSize: 52, color: primary ? '#F4F8FD' : T.text }}>{text}</span>
  </div>
);
export const Cta: React.FC = () => {
  const { l, at } = useScene('cta');
  const jobs = at('l9', 'JOBS'), save = at('l9', 'save');
  const press = (a: number) => (l >= a && l < a + 10 ? Math.sin(((l - a) / 10) * Math.PI) : 0);
  // pointer glides to each button and taps on its word
  const px = l < save - 14 ? 380 : lerp(380, 760, decel(invLerp(save - 14, save, l))), py = l < save - 14 ? 690 : lerp(690, 690, 1);
  return (
    <Page l={l}>
      <div style={{ position: 'absolute', left: CONTENT.x, top: 400, width: CONTENT.w }}>
        <Headline l={l} size={84} words={[{ t: 'Roadmap', at: 2 }, { t: 'chahiye?', at: 8, color: T.brand }]} />
        <div style={{ fontFamily: FONT.text, fontWeight: 600, fontSize: 30, color: T.text2, marginTop: 10, opacity: enter(l, 14) }}>Portfolio checklist + verified careers links</div>
      </div>
      <div style={{ position: 'absolute', left: CONTENT.x, top: 640, display: 'flex', gap: 24 }}>
        <Button primary icon="comment" text="Comment JOBS" press={press(jobs)} p={pop(l, Math.max(4, jobs - 10))} />
        <Button icon="bookmark" text="Save" press={press(save)} p={pop(l, Math.max(8, jobs - 4))} />
      </div>
      <svg width={60} height={60} viewBox="0 0 24 24" style={{ position: 'absolute', left: px, top: py, opacity: enter(l, jobs - 20) }}>
        <path d="M5 3l14 8-6 1.5L10 19z" fill={T.card} stroke={T.text} strokeWidth={1.5} strokeLinejoin="round" />
      </svg>
      <Card x={CONTENT.x} y={850} w={CONTENT.w} h={330} p={enter(l, 20)} style={{ padding: '24px 30px', boxSizing: 'border-box' }}>
        <Label text="Sources" />
        {['Company Q2 FY27 results, via Moneycontrol & People Matters (Oct 26)', 'Infosys Q2 FY27 earnings call (Oct 23)', 'Skills list: TechpeTrek suggestion · independent explainer'].map((s, i) => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14, opacity: enter(l, 26 + i * 6) }}>
            <Icon name="news" size={28} color={T.text3} sw={1.8} /><span style={{ fontFamily: FONT.text, fontWeight: 500, fontSize: 24, color: T.text2 }}>{s}</span>
          </div>
        ))}
      </Card>
      <div style={{ position: 'absolute', left: CONTENT.x, top: 1210, display: 'flex', alignItems: 'center', gap: 14, opacity: enter(l, 30) }}>
        <Img src={staticFile('brand/techpe-trek.jpg')} style={{ width: 54, height: 54, borderRadius: 12 }} />
        <span style={{ fontFamily: FONT.ui, fontWeight: 800, fontSize: 32, color: T.text }}>TechpeTrek</span>
        <span style={{ fontFamily: FONT.ui, fontWeight: 500, fontSize: 24, color: T.text3 }}>· net headcount ≠ vacancies</span>
      </div>
    </Page>
  );
};

export const SCENES: Record<string, React.FC> = { hook: Hook, total: Total, bars: Bars, wipro: Wipro, twist: Twist, freshers: Freshers, ai: Ai, skills: Skills, project: Project, cta: Cta };
export { seg };
