// Second half: freshers (Infosys ~8,000 grads in Q2 per CEO; HCLTech recruited 6,136 freshers), gross != net, the fresher
// playbook (build -> deploy -> tests + README), verify on the official careers site, and the CTA with sources.
import React from 'react';
import { Img, staticFile } from 'remotion';
import { clamp, criticalSpring, easeOutCubic, invLerp } from '../lib/anim';
import { F } from '../styles/typography';
import { Bg, Chip, Enter, FPS, Flash, K, Kicker, SAFE, Slam, Tag, fadeIn, hit, pop, shake, useScene } from './kit';
import { SourceFoot } from './Data';

/** a graduate-cap glyph */
const Cap: React.FC<{ size: number; color: string; p: number }> = ({ size, color, p }) => (
  <svg width={size} height={size} viewBox="-30 -30 60 60" style={{ opacity: clamp(p * 1.6), transform: `scale(${0.4 + 0.6 * p}) translateY(${(1 - p) * 20}px)` }}>
    <path d="M -28 -6 L 0 -18 L 28 -6 L 0 6 Z" fill={color} />
    <path d="M -16 0 L -16 12 Q 0 22 16 12 L 16 0 L 0 7 Z" fill={color} opacity={0.8} />
    <path d="M 24 -4 L 24 14" stroke={color} strokeWidth={3} />
  </svg>
);

const IntakeCard: React.FC<{ l: number; at: number; who: string; n: number; label: string; src: string; icons: number }> = ({ l, at, who, n, label, src, icons }) => {
  const p = pop(l, at, 16, 0.55), sp = criticalSpring((l - at - 6) / FPS, 6), v = sp > 0.996 ? n : n * sp;
  return (
    <div style={{ width: 840, padding: '26px 32px', borderRadius: 24, background: 'rgba(16,26,46,0.9)', border: `3px solid ${K.teal}`, boxShadow: `0 0 ${20 + 40 * hit(l, at, 24)}px ${K.teal}55`,
      opacity: clamp(p * 1.5), transform: `translateX(${(1 - p) * 260}px)` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontFamily: F.head, fontWeight: 900, fontSize: 52, color: K.lunar }}>{who}</span>
        <span style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 20, color: K.steel }}>{src}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 18, marginTop: 4 }}>
        <span style={{ fontFamily: F.head, fontWeight: 900, fontSize: 96, color: K.teal, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{who === 'Infosys' ? '~' : ''}{Math.round(v).toLocaleString('en-US')}</span>
        <span style={{ fontFamily: F.head, fontWeight: 700, fontSize: 34, color: K.lunar }}>{label}</span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 14 }}>
        {Array.from({ length: icons }, (_, i) => <Cap key={i} size={44} color={K.teal} p={pop(l, at + 8 + i * 2, 18, 0.6)} />)}
      </div>
    </div>
  );
};

export const Freshers: React.FC = () => {
  const { l, at } = useScene('freshers');
  const inf = at('l6', 'Infosys'), hcl = at('l6', 'HCLTech');
  return (
    <Enter l={l}>
      <Bg glow={K.teal} amount={0.22} />
      <Kicker text="FRESHERS · Q2 FY27 · GROSS INTAKE" p={fadeIn(l, 2)} color={K.teal} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: 360, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 34 }}>
        <IntakeCard l={l} at={Math.max(2, inf)} who="Infosys" n={8000} label="college graduates" src="CEO · Q2 call, Oct 23" icons={16} />
        <IntakeCard l={l} at={hcl} who="HCLTech" n={6136} label="freshers recruited" src="People Matters, Oct 26" icons={12} />
      </div>
      <div style={{ position: 'absolute', left: SAFE.side, right: SAFE.side, top: 1180, textAlign: 'center', fontFamily: F.mono, fontSize: 22, color: K.steel, opacity: fadeIn(l, hcl + 20) }}>
        1 cap ≈ 500 hires · Infosys FY27 target: ~20,000
      </div>
    </Enter>
  );
};

export const Gross: React.FC = () => {
  const { l, at } = useScene('gross');
  const gr = at('l7', 'gross'), net = at('l7', 'net'), nahi = at('l7', 'nahi');
  const flow = (l % 40) / 40;
  const sk = shake(l, [nahi], 10);
  const Panel: React.FC<{ title: string; sub: string; color: string; p: number; out: boolean }> = ({ title, sub, color, p, out }) => (
    <div style={{ width: 400, height: 560, borderRadius: 26, background: 'rgba(16,26,46,0.9)', border: `3px solid ${color}`, opacity: clamp(p * 1.5), transform: `translateY(${(1 - p) * 60}px)`,
      display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '28px 20px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ fontFamily: F.head, fontWeight: 900, fontSize: 52, color, lineHeight: 1, textAlign: 'center' }}>{title}</div>
      <div style={{ fontFamily: F.mono, fontSize: 22, color: K.steel, marginTop: 10, textAlign: 'center' }}>{sub}</div>
      <svg width={300} height={340} viewBox="0 0 300 340" style={{ marginTop: 16 }}>
        <rect x={60} y={110} width={180} height={150} rx={18} fill="none" stroke={K.lunar} strokeWidth={6} />
        <text x={150} y={195} textAnchor="middle" fontFamily={F.mono} fontWeight={800} fontSize={24} fill={K.lunar}>COMPANY</text>
        {[0, 1, 2].map((k) => { const y = ((flow + k / 3) % 1) * 100; return <circle key={k} cx={150} cy={y} r={10} fill={K.teal} opacity={1 - y / 110} />; })}
        <text x={150} y={20} textAnchor="middle" fontFamily={F.mono} fontWeight={800} fontSize={20} fill={K.teal}>JOINED ↓</text>
        {out ? [0, 1, 2].map((k) => { const y = 270 + ((flow + k / 3) % 1) * 70; return <circle key={k} cx={150} cy={y} r={10} fill={K.coral} opacity={1 - (y - 270) / 80} />; }) : null}
        {out ? <text x={150} y={335} textAnchor="middle" fontFamily={F.mono} fontWeight={800} fontSize={20} fill={K.coral}>LEFT ↓</text> : null}
      </svg>
    </div>
  );
  return (
    <Enter l={l} sx={sk.x} sy={sk.y}>
      <Bg glow={K.yellow} amount={0.15} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: 290, display: 'flex', justifyContent: 'center', gap: 40 }}>
        <Panel title="GROSS HIRES" sub="sirf joined count" color={K.teal} p={pop(l, Math.max(2, gr))} out={false} />
        <Panel title="NET CHANGE" sub="joined − left" color={K.yellow} p={pop(l, net)} out />
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 920, display: 'flex', justifyContent: 'center' }}>
        <div style={{ fontFamily: F.head, fontWeight: 900, fontSize: 120, color: K.coral, transform: `scale(${pop(l, nahi, 18, 0.4)})` }}>≠</div>
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 1090, display: 'flex', justifyContent: 'center' }}>
        <Chip p={pop(l, nahi + 4)} text="GROSS HIRES ≠ NET CHANGE" color={K.coral} size={40} />
      </div>
      <Flash l={l} at={nahi} color={K.coral} max={0.25} />
    </Enter>
  );
};

const STEPS = [{ t: 'BUILD', w: 'build' }, { t: 'DEPLOY', w: 'deploy' }, { t: 'EXPLAIN', w: 'README' }] as const;

export const Build: React.FC = () => {
  const { l, at } = useScene('build');
  const fr = at('l8', 'fresher'), ats = STEPS.map((s) => at('l8', s.w)), tests = at('l8', 'Tests');
  const sk = shake(l, ats, 6);
  return (
    <Enter l={l} sx={sk.x} sy={sk.y}>
      <Bg glow={K.teal} amount={0.25} />
      <div style={{ position: 'absolute', left: SAFE.side, right: SAFE.side, top: 270, textAlign: 'center' }}>
        <Slam l={l} at={Math.max(2, fr - 4)} size={104} color={K.yellow}>FRESHER HO?</Slam>
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 440, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 14 }}>
        {STEPS.map((s, i) => (
          <React.Fragment key={s.t}>
            <div style={{ padding: '16px 24px', borderRadius: 16, fontFamily: F.head, fontWeight: 900, fontSize: 44, color: l >= ats[i] ? '#062520' : K.steel,
              background: l >= ats[i] ? K.teal : 'rgba(16,26,46,0.85)', border: `3px solid ${l >= ats[i] ? K.teal : 'rgba(236,239,244,0.2)'}`, transform: `scale(${l >= ats[i] ? 1 + 0.15 * hit(l, ats[i], 16) : 0.94})` }}>{s.t}</div>
            {i < 2 ? <span style={{ fontFamily: F.head, fontWeight: 900, fontSize: 40, color: K.steel }}>•</span> : null}
          </React.Fragment>
        ))}
      </div>
      {/* conceptual repo card: AI/cloud project with tests, README and a live demo (illustration, no real UI) */}
      <div style={{ position: 'absolute', left: 120, width: 840, top: 590, borderRadius: 24, background: '#0D1424', border: '2px solid rgba(236,239,244,0.25)', overflow: 'hidden',
        opacity: fadeIn(l, ats[0] - 6), transform: `translateY(${(1 - fadeIn(l, ats[0] - 6, 14)) * 40}px)` }}>
        <div style={{ padding: '20px 28px', borderBottom: '2px solid rgba(236,239,244,0.12)', display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ width: 22, height: 22, borderRadius: 6, border: `3px solid ${K.lunar}` }} />
          <span style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 30, color: K.lunar }}>your-name / ai-resume-screener</span>
        </div>
        {[
          { t: 'Live demo', s: 'deployed on cloud', at: ats[1], c: K.teal },
          { t: 'Tests passing', s: '24 / 24', at: tests, c: K.teal },
          { t: 'README.md', s: 'problem · setup · architecture', at: ats[2], c: K.teal },
        ].map((r) => (
          <div key={r.t} style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '22px 28px', borderBottom: '1px solid rgba(236,239,244,0.08)', opacity: l >= r.at ? 1 : 0.3 }}>
            <svg width={44} height={44} viewBox="0 0 44 44"><circle cx={22} cy={22} r={20} fill={l >= r.at ? r.c : 'none'} stroke={r.c} strokeWidth={3} />
              {l >= r.at ? <path d="M12 23 L19 30 L32 15" fill="none" stroke="#062520" strokeWidth={5} strokeLinecap="round" strokeDasharray={30} strokeDashoffset={30 * (1 - easeOutCubic(invLerp(r.at, r.at + 10, l)))} /> : null}</svg>
            <div>
              <div style={{ fontFamily: F.head, fontWeight: 800, fontSize: 40, color: K.lunar }}>{r.t}</div>
              <div style={{ fontFamily: F.mono, fontSize: 22, color: K.steel }}>{r.s}</div>
            </div>
          </div>
        ))}
      </div>
      <Tag y={1190} text="ILLUSTRATION · EXAMPLE PROJECT" />
    </Enter>
  );
};

export const Verify: React.FC = () => {
  const { l, at } = useScene('verify');
  const off = at('l9', 'official'), chk = at('l9', 'check');
  return (
    <Enter l={l}>
      <Bg glow={K.teal} amount={0.25} />
      <div style={{ position: 'absolute', left: SAFE.side, right: SAFE.side, top: 270, textAlign: 'center' }}>
        <Slam l={l} at={2} size={88}>APPLY SE PEHLE</Slam>
      </div>
      <div style={{ position: 'absolute', left: 140, width: 800, top: 460, borderRadius: 24, background: '#F3F1EC', overflow: 'hidden', boxShadow: '0 30px 80px rgba(0,0,0,0.55)',
        transform: `scale(${0.92 + 0.08 * pop(l, 4)})`, opacity: fadeIn(l, 2) }}>
        <div style={{ height: 58, background: '#DEDAD2', display: 'flex', alignItems: 'center', gap: 12, padding: '0 20px' }}>
          {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => <span key={c} style={{ width: 16, height: 16, borderRadius: 8, background: c }} />)}
          <div style={{ marginLeft: 12, flex: 1, height: 34, borderRadius: 17, background: '#F3F1EC', display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px', fontFamily: F.mono, fontSize: 21, color: '#3B3934' }}>
            <span style={{ color: l >= off ? '#0E7A52' : '#3B3934', fontWeight: 800 }}>{l >= off ? '✓' : '○'}</span> company.com/careers
          </div>
        </div>
        <div style={{ padding: '34px 40px' }}>
          <div style={{ fontFamily: F.head, fontWeight: 900, fontSize: 60, color: '#121212' }}>Careers</div>
          {['Graduate Engineer Trainee', 'Associate Software Engineer'].map((t, i) => (
            <div key={t} style={{ marginTop: 20, padding: '18px 22px', borderRadius: 14, border: '2px solid rgba(18,18,18,0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              opacity: fadeIn(l, 10 + i * 8) }}>
              <span style={{ fontFamily: F.head, fontWeight: 800, fontSize: 32, color: '#121212' }}>{t}</span>
              <span style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 20, color: '#0E7A52' }}>OFFICIAL</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 1060, display: 'flex', justifyContent: 'center' }}>
        <Chip p={pop(l, chk)} text="VERIFY OFFICIAL OPENINGS" color={K.teal} size={42} />
      </div>
      <Tag y={1180} text="ILLUSTRATION" />
    </Enter>
  );
};

export const Cta: React.FC = () => {
  const { l, at } = useScene('cta');
  const jobs = at('l10', 'JOBS'), save = at('l10', 'save');
  const sk = shake(l, [jobs], 10);
  return (
    <Enter l={l} sx={sk.x} sy={sk.y}>
      <Bg glow={K.teal} amount={0.35} />
      <div style={{ position: 'absolute', left: SAFE.side, right: SAFE.side, top: 300, textAlign: 'center' }}>
        <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 34, letterSpacing: '0.3em', color: K.lunar }}>COMMENT KARO</div>
        <div style={{ marginTop: 8 }}><Slam l={l} at={Math.max(2, jobs - 4)} size={200} color={K.teal} from={2.2} style={{ textShadow: `0 0 ${30 + 50 * hit(l, jobs, 30)}px ${K.teal}aa` }}>JOBS</Slam></div>
        <div style={{ fontFamily: F.head, fontWeight: 700, fontSize: 36, color: K.lunar, marginTop: 8, opacity: fadeIn(l, jobs + 6) }}>portfolio checklist + verified careers links</div>
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 760, display: 'flex', justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '24px 46px', borderRadius: 999, background: l >= save ? K.teal : 'rgba(16,26,46,0.9)', border: `3px solid ${K.teal}`,
          transform: `scale(${l >= save ? 1 + 0.18 * hit(l, save, 18) : 0.9 + 0.1 * pop(l, 6)})` }}>
          <svg width={46} height={58} viewBox="0 0 52 64"><path d="M6 4 H46 V60 L26 46 L6 60 Z" fill={l >= save ? '#062520' : 'none'} stroke={l >= save ? '#062520' : K.teal} strokeWidth={6} strokeLinejoin="round" /></svg>
          <span style={{ fontFamily: F.head, fontWeight: 900, fontSize: 60, color: l >= save ? '#062520' : K.lunar }}>SAVE THIS</span>
        </div>
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 960, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <Img src={staticFile('brand/techpe-trek.jpg')} style={{ width: 60, height: 60, borderRadius: 14 }} />
        <span style={{ fontFamily: F.head, fontWeight: 800, fontSize: 36, color: K.lunar }}>TechpeTrek</span>
      </div>
      <SourceFoot text="Sources: Q2 FY27 results via Moneycontrol & People Matters (Oct 26) · Infosys Q2 call (Oct 23)" />
      <div style={{ position: 'absolute', left: SAFE.side, right: SAFE.side, top: 1300, textAlign: 'center', fontFamily: F.mono, fontSize: 20, color: K.steel }}>Independent explainer · net headcount ≠ vacancies</div>
      <Flash l={l} at={jobs} color={K.teal} max={0.3} />
    </Enter>
  );
};

