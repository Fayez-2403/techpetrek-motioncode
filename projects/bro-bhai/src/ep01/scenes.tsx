// The 18 stage visuals of ep 01, one per 3 s slot (the user's storyboard). Each gets u = seconds into its slot.
// Real names only: AGENTS / SKILLS are the repo's .claude/agents and .claude/skills (commit 05ad7c8). Mock game UI is
// labelled ILLUSTRATIVE. Stage area: x 70..1010, y 500..1130.
import React from 'react';
import { Img, staticFile } from 'remotion';
import { C, FONT, depth } from '../themes/tokens';
import { clamp, easeInCubic, easeInOutCubic, easeOutCubic, easeOutExpo, invLerp, lerp } from '../animation/anim';
import { Chip, Illustrative, Panel, Stamp, fade, sp } from './kit';

export const AGENTS = 'accessibility-specialist ai-programmer analytics-engineer art-director audio-director community-manager creative-director devops-engineer economy-designer engine-programmer game-designer gameplay-programmer godot-csharp-specialist godot-gdextension-specialist godot-gdscript-specialist godot-shader-specialist godot-specialist lead-programmer level-designer live-ops-designer localization-lead narrative-director network-programmer performance-analyst producer prototyper qa-lead qa-tester release-manager security-engineer sound-designer systems-designer technical-artist technical-director tools-programmer ue-blueprint-specialist ue-gas-specialist ue-replication-specialist ue-umg-specialist ui-programmer unity-addressables-specialist unity-dots-specialist unity-shader-specialist unity-specialist unity-ui-specialist unreal-specialist ux-designer world-builder writer'.split(' ');
const SKILLS = 'start brainstorm map-systems design-system quick-design design-review code-review sprint-plan create-epics create-stories dev-story story-done playtest-report bug-report bug-triage qa-plan smoke-check perf-profile balance-check scope-check tech-debt gate-check art-bible asset-spec ux-design ux-review prototype vertical-slice milestone-review release-checklist launch-checklist patch-notes hotfix localize team-qa team-ui team-audio team-level security-audit setup-engine retrospective estimate changelog onboard help adopt'.split(' ');
const TIER1 = ['creative-director', 'technical-director', 'producer'];
const TIER2 = ['game-designer', 'lead-programmer', 'art-director', 'audio-director', 'narrative-director', 'qa-lead', 'release-manager', 'localization-lead'];

type S = React.FC<{ u: number }>;
const X0 = 70, Y0 = 500, SW = 940, SH = 630;
const abs = (l: number, t: number, extra: React.CSSProperties = {}): React.CSSProperties => ({ position: 'absolute', left: l, top: t, ...extra });
/** a tiny "seat": the role's initials in a rounded tile */
const initials = (a: string) => a.split('-').filter((p) => p !== 'specialist').slice(0, 2).map((p) => p[0].toUpperCase()).join('');

// 01 · tiny developer desk splits into a glowing 49-seat org chart
const S01: S = ({ u }) => {
  const burst = easeOutExpo(invLerp(0.45, 1.6, u));
  return (
    <>
      <div style={abs(540 - 90, 980 - 120 * (1 - burst * 0.4), { width: 180, textAlign: 'center', transform: `scale(${1.25 - 0.45 * burst})` })}>
        <div style={{ width: 160, height: 100, margin: '0 auto', borderRadius: 14, background: C.navy, border: `6px solid #c9d7ea`, boxShadow: `0 0 ${30 * burst}px ${C.cyan}` }}>
          <div style={{ margin: 14, height: 8, width: 90, borderRadius: 4, background: C.cyan }} /><div style={{ marginLeft: 14, height: 8, width: 60, borderRadius: 4, background: '#5d6f93' }} />
        </div>
        <div style={{ width: 180, height: 14, borderRadius: 7, background: '#b4c3d8', marginTop: 4 }} />
        <div style={{ fontFamily: FONT.mono, fontSize: 22, color: C.navy2, marginTop: 8 }}>1 developer</div>
      </div>
      {AGENTS.map((a, i) => {
        const r = Math.floor(i / 7), c = i % 7, d = clamp(burst * 1.6 - (Math.abs(c - 3) + Math.abs(r - 3)) * 0.07);
        const x = lerp(540, 150 + c * 130, d), y = lerp(960, 520 + r * 62, d);
        return <div key={a} style={abs(x - 50, y - 24, { width: 100, height: 48, borderRadius: 12, background: '#fff', border: `2px solid ${i % 3 === 0 ? C.magenta : C.cyan}`,
          opacity: d, transform: `scale(${0.4 + 0.6 * d})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT.mono, fontWeight: 800, fontSize: 20, color: C.navy,
          boxShadow: `0 0 ${18 * d}px ${C.cyan}66` })}>{initials(a)}</div>;
      })}
    </>
  );
};

// 02 · code window transforms into a miniature studio floor
const S02: S = ({ u }) => {
  const m = easeInOutCubic(invLerp(0.9, 1.9, u));
  const rows = [[3, C.magenta, 'DIRECTORS'], [8, C.cyan, 'LEADS'], [12, '#7d8db0', 'SPECIALISTS']] as const;
  return (
    <>
      <Panel x={X0 + 60} y={Y0 + 20} w={SW - 120} h={SH - 40} style={{ background: lerp(1, 0, m) > 0.5 ? '#0f1a33' : C.panel, transition: 'none' }}>
        {m < 0.5 ? (
          <div style={{ padding: 34, fontFamily: FONT.mono, fontSize: 30, color: '#cfe8ff', opacity: 1 - m * 2 }}>
            <div style={{ color: C.cyan }}>~/my-game $ claude</div>
            {['> /start', '  studio: 3 tiers ready', '  directors · leads · specialists'].map((l, i) => <div key={l} style={{ marginTop: 18, opacity: fade(u, 0.2 + i * 0.22) }}>{l}</div>)}
          </div>
        ) : rows.map(([n, col, label], r) => (
          <div key={label} style={abs(40, 50 + r * 175, { width: SW - 200 })}>
            <div style={{ fontFamily: FONT.mono, fontSize: 26, fontWeight: 800, color: col, letterSpacing: '0.12em', opacity: fade(u, 1.0 + r * 0.15) }}>{label}</div>
            <div style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
              {Array.from({ length: n }, (_, i) => {
                const s = sp(u, 1.05 + r * 0.18 + i * 0.03);
                return <div key={i} style={{ width: 60, height: 60, borderRadius: 14, background: '#fff', border: `4px solid ${col}`, transform: `translateY(${(1 - s) * 40}px) scale(${clamp(s)})`,
                  boxShadow: depth(0.4) }}><div style={{ width: 24, height: 24, borderRadius: 12, background: col, margin: '7px auto 0' }} /></div>;
              })}
            </div>
          </div>
        ))}
      </Panel>
    </>
  );
};

// 03 · the real GitHub page (dated grab) with a clear SOURCE overlay
const S03: S = ({ u }) => {
  const s = sp(u, 0.05), z = lerp(1.0, 1.06, easeInOutCubic(invLerp(0.4, 3, u)));
  return (
    <Panel x={X0} y={Y0 + 10} w={SW} h={SH - 20} style={{ transform: `translateY(${(1 - s) * 80}px) rotateX(${(1 - s) * 18}deg)`, opacity: clamp(s * 2), background: '#fff' }}>
      <Img src={staticFile('receipts/repo_card_2026-11-01.png')} style={{ position: 'absolute', left: 0, top: 0, width: SW * z, transformOrigin: '0 0' }} />
      <div style={abs(24, SH - 96, { padding: '10px 18px', borderRadius: 12, background: C.navy, color: '#fff', fontFamily: FONT.mono, fontSize: 21, fontWeight: 700, opacity: fade(u, 0.5) })}>
        SOURCE · github.com · screenshot 1 Nov 2026
      </div>
      <div style={abs(SW - 220, 20, { opacity: fade(u, 0.8) })}><Chip col={C.ok}>MIT licence</Chip></div>
    </Panel>
  );
};

// 04 · three-tier hierarchy unfolds with spring motion
const S04: S = ({ u }) => {
  const tierY = [560, 720, 900];
  const card = (name: string, x: number, y: number, at: number, col: string, w = 250) => {
    const s = sp(u, at);
    return <div key={name} style={abs(x - w / 2, y, { width: w, transform: `translateY(${(1 - s) * -60}px) scale(${clamp(s, 0, 1.2)})`, opacity: clamp(s * 2) })}>
      <Chip col={col} mono style={{ width: w, justifyContent: 'center', fontSize: w > 260 ? 25 : 21, padding: '14px 6px' }}>{name}</Chip></div>;
  };
  const lineOp = fade(u, 0.6, 0.4);
  return (
    <>
      <svg style={abs(0, 0, { width: 1080, height: 1920, opacity: lineOp })}>
        {TIER1.map((_, i) => TIER2.slice(i * 3, i * 3 + 3).map((__, j) => <line key={`${i}${j}`} x1={200 + i * 340} y1={620} x2={172 + ((i * 3 + j) % 4) * 245} y2={720} stroke={C.cyan} strokeWidth={3} strokeDasharray="6 8" />))}
      </svg>
      {TIER1.map((a, i) => card(a, 200 + i * 340, tierY[0], 0.1 + i * 0.08, C.magenta, 315))}
      {TIER2.map((a, i) => card(a, 172 + (i % 4) * 245, tierY[1] + Math.floor(i / 4) * 95, 0.55 + i * 0.06, C.cyan, 236))}
      <div style={abs(0, 1010, { width: 1080, textAlign: 'center', fontFamily: FONT.ui, fontWeight: 800, fontSize: 30, color: C.navy2, opacity: fade(u, 1.3) })}>Tier 1 · Directors  →  Tier 2 · Department leads  →  Tier 3 · Specialists</div>
    </>
  );
};

// 05 · role tokens cascade into departments (code · art · audio)
const DEPTS: [string, string, string[]][] = [
  ['CODE', C.cyan, ['gameplay-programmer', 'engine-programmer', 'ai-programmer', 'network-programmer', 'ui-programmer', 'tools-programmer']],
  ['ART', C.magenta, ['art-director', 'technical-artist', 'world-builder', 'level-designer', 'ux-designer']],
  ['AUDIO', '#7a5cff', ['audio-director', 'sound-designer', 'writer', 'narrative-director']],
];
const S05: S = ({ u }) => (
  <>
    {DEPTS.map(([d, col, roles], c) => (
      <div key={d} style={abs(90 + c * 310, 520, { width: 290 })}>
        <div style={{ textAlign: 'center', fontFamily: FONT.display, fontWeight: 900, fontSize: 56, color: col, opacity: fade(u, c * 0.1) }}>{d}</div>
        <div style={{ height: 6, borderRadius: 3, background: col, margin: '8px 20px 14px', transform: `scaleX(${fade(u, 0.1 + c * 0.1, 0.4)})` }} />
        {roles.map((r, i) => {
          const at = 0.3 + c * 0.12 + i * 0.16, f = easeOutCubic(invLerp(at, at + 0.45, u)), bounce = Math.sin(clamp(f) * Math.PI) * 10;
          return <div key={r} style={{ marginBottom: 12, transform: `translateY(${(1 - f) * -360 - bounce}px)`, opacity: clamp(f * 3), textAlign: 'center' }}>
            <Chip col={col} mono style={{ fontSize: 21, padding: '9px 10px' }}>{r}</Chip></div>;
        })}
      </div>
    ))}
  </>
);

/** a tiny platformer world (mock, ILLUSTRATIVE): ground tiles, a coin, the hero at x,y */
const Platformer: React.FC<{ hx: number; hy: number; broken?: boolean; children?: React.ReactNode; tint?: string }> = ({ hx, hy, broken, children, tint }) => (
  <Panel x={X0 + 40} y={Y0 + 20} w={SW - 80} h={SH - 60} style={{ background: 'linear-gradient(#bfe8ff, #eef9ff)' }}>
    {[...Array(14)].map((_, i) => (broken && (i === 6 || i === 7)) ? null : <div key={i} style={abs(i * 62, 470, { width: 60, height: 60, background: '#5bbf6a', borderTop: '10px solid #3e9a4e', borderRadius: 6 })} />)}
    <div style={abs(560, 300, { width: 180, height: 40, background: '#c98b4b', borderRadius: 8, borderTop: '8px solid #a46a33' })} />
    <div style={abs(630, 250, { width: 34, height: 34, borderRadius: 17, background: '#ffd34d', border: '4px solid #e0a800' })} />
    <div style={abs(hx, hy, { width: 54, height: 64, borderRadius: 14, background: tint ?? C.navy })}><div style={{ width: 14, height: 14, borderRadius: 7, background: '#fff', margin: '14px 0 0 28px' }} /></div>
    {children}
  </Panel>
);

// 06 · QA magnifier checks a little platformer
const S06: S = ({ u }) => {
  const mx = lerp(180, 700, easeInOutCubic(invLerp(0.3, 2.6, u))), my = 820 + Math.sin(u * 3) * 30;
  return (
    <>
      <Platformer hx={160 + u * 60} hy={406} />
      <div style={abs(mx - 90, my - 90, { width: 180, height: 180, borderRadius: 90, border: `12px solid ${C.navy}`, background: 'rgba(18,184,245,0.12)', boxShadow: `0 0 30px ${C.cyan}` })} />
      <div style={abs(mx + 50, my + 60, { width: 26, height: 110, borderRadius: 12, background: C.navy, transform: 'rotate(-45deg)', transformOrigin: 'top' })} />
      <div style={abs(110, 1040, { display: 'flex', gap: 14, opacity: fade(u, 0.6) })}><Chip col={C.magenta} mono>qa-lead</Chip><Chip col={C.magenta} mono>qa-tester</Chip><Chip col={C.cyan} mono>producer</Chip><Chip col={C.cyan} mono>release-manager</Chip></div>
    </>
  );
};

/** a big counter that stops exactly on `n` */
const Counter: React.FC<{ u: number; n: number; label: string; col: string }> = ({ u, n, label, col }) => {
  const v = Math.round(n * easeOutExpo(invLerp(0.25, 1.6, u))), land = sp(u, 1.6, 16, 0.45);
  return (
    <div style={abs(0, 560, { width: 1080, textAlign: 'center' })}>
      <div style={{ fontFamily: FONT.display, fontWeight: 900, fontSize: 300, lineHeight: 1, color: C.navy, transform: `scale(${1 + 0.08 * (u > 1.6 ? 1 - land : 0) + 0.04 * Math.max(0, 1 - Math.abs(land - 1) * 10)})`,
        textShadow: `0 8px 0 ${col}, 0 26px 50px ${col}55` }}>{v}</div>
      <div style={{ fontFamily: FONT.mono, fontWeight: 700, fontSize: 34, color: C.navy2, letterSpacing: '0.1em', marginTop: 10 }}>{label}</div>
    </div>
  );
};

// 07 · number counter stops exactly at 49
const S07: S = ({ u }) => (
  <>
    <Counter u={u} n={49} label="SPECIALIZED AGENTS · README" col={C.cyan} />
    <div style={abs(130, 1010, { width: 820, display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' })}>
      {AGENTS.map((a, i) => <div key={a} style={{ width: 26, height: 26, borderRadius: 6, background: i < Math.round(49 * easeOutExpo(invLerp(0.25, 1.6, u))) ? C.cyan : '#d5e3f2' }} />)}
    </div>
  </>
);

// 08 · skill tiles snap into an organised grid (real slash commands), 74 on the counter
const S08: S = ({ u }) => {
  const n = Math.round(74 * easeOutExpo(invLerp(0.2, 1.7, u)));
  return (
    <>
      <div style={abs(0, 512, { width: 1080, textAlign: 'center', fontFamily: FONT.display, fontWeight: 900, fontSize: 120, color: C.navy, textShadow: `0 6px 0 ${C.magenta}` })}>{n}<span style={{ fontSize: 46, color: C.navy2 }}> skills</span></div>
      <div style={abs(80, 680, { width: 920, display: 'flex', flexWrap: 'wrap', gap: 9, justifyContent: 'center' })}>
        {SKILLS.slice(0, 40).map((s, i) => {
          const at = 0.2 + i * 0.035, f = sp(u, at, 16, 0.55), r = (i * 37) % 11 - 5;
          return <div key={s} style={{ padding: '6px 10px', borderRadius: 10, background: '#fff', border: `2px solid ${i % 4 === 0 ? C.magenta : C.cyan}`, fontFamily: FONT.mono, fontSize: 18, fontWeight: 700, color: C.navy,
            transform: `translate(${(1 - clamp(f)) * r * 40}px, ${(1 - clamp(f)) * -200}px) rotate(${(1 - clamp(f)) * r * 6}deg)`, opacity: clamp(f * 3) }}>/{s}</div>;
        })}
      </div>
    </>
  );
};

// 09 · the rules gate lights up and stops a broken build (proof: the README's own badges)
const S09: S = ({ u }) => {
  const bx = u < 1.3 ? lerp(-140, 420, easeOutCubic(invLerp(0.2, 1.3, u))) : 420 - 120 * Math.sin(clamp((u - 1.3) / 0.5) * Math.PI) * Math.exp(-(u - 1.3) * 2);
  const hit = u > 1.3, gate = fade(u, 0.1, 0.3);
  return (
    <>
      <Img src={staticFile('receipts/readme_badges_2026-11-01.png')} style={abs(150, 520, { width: 780, borderRadius: 14, boxShadow: depth(0.6), opacity: fade(u, 0.05) })} />
      <div style={abs(560, 760, { width: 40, height: 300, borderRadius: 14, background: hit ? C.bad : C.cyan, boxShadow: `0 0 ${hit ? 50 : 24}px ${hit ? C.bad : C.cyan}`, opacity: gate })} />
      <div style={abs(620, 800, { fontFamily: FONT.display, fontWeight: 900, fontSize: 52, color: C.navy, lineHeight: 1.05, opacity: gate })}>15 HOOKS<br /><span style={{ color: C.magenta }}>14 RULES</span></div>
      <div style={abs(bx, 860, { width: 150, height: 110, borderRadius: 16, background: '#fff', border: `4px solid ${hit ? C.bad : C.navy}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: FONT.mono, fontWeight: 800, fontSize: 22, color: hit ? C.bad : C.navy, transform: `rotate(${hit ? -6 : 0}deg)` })}>{hit ? '✕ blocked' : 'build ⚠'}</div>
    </>
  );
};

// 10 · STEP 1: the creator writes a one-line premise (after /start)
const PREMISE = 'Ek chhota platformer: chai-loving robot, 5 levels.';
const S10: S = ({ u }) => {
  const n = Math.floor(clamp((u - 0.7) / 1.6) * PREMISE.length);
  return (
    <Panel x={X0 + 30} y={Y0 + 40} w={SW - 60} h={SH - 100} style={{ background: '#0f1a33' }}>
      <div style={{ padding: 36, fontFamily: FONT.mono, fontSize: 32, color: '#d9ecff', lineHeight: 1.7 }}>
        <div style={{ color: C.cyan }}>&gt; /start</div>
        <div style={{ opacity: fade(u, 0.35), color: '#8fa6cc' }}>? Where are you: no idea · vague concept · clear design</div>
        <div style={{ marginTop: 10 }}>&gt; <span style={{ color: '#fff' }}>{PREMISE.slice(0, n)}</span><span style={{ opacity: Math.floor(u * 4) % 2 ? 1 : 0, color: C.cyan }}>▌</span></div>
      </div>
      <div style={abs(36, SH - 170, { opacity: fade(u, 2.4) })}><Chip col={C.ok}>✓ game idea defined</Chip></div>
    </Panel>
  );
};

// 11 · STEP 2: kanban cards march into a timeline
const TASKS = ['Design doc', 'Player jump', 'Level 1', 'Chai pickup', 'Sound pass', 'QA pass'];
const S11: S = ({ u }) => (
  <>
    <div style={abs(110, 1030, { width: 860, height: 8, borderRadius: 4, background: '#c5d6ea' })} />
    {['M1', 'M2', 'M3'].map((m, i) => <div key={m} style={abs(205 + i * 330, 1004, { width: 60, height: 60, borderRadius: 30, background: C.navy, color: '#fff', fontFamily: FONT.mono, fontWeight: 800, fontSize: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: fade(u, 0.1 + i * 0.1) })}>{m}</div>)}
    {TASKS.map((t, i) => {
      const at = 0.5 + i * 0.22, f = easeInOutCubic(invLerp(at, at + 0.6, u));
      const x = lerp(110 + (i % 2) * 34, 90 + Math.floor(i / 2) * 330, f), y = lerp(560 + i * 26, 690 + (i % 2) * 150, f);
      return <div key={t} style={abs(x, y, { width: 290, padding: '22px 22px', borderRadius: 20, background: '#fff', border: `4px solid ${i % 2 ? C.magenta : C.cyan}`, boxShadow: depth(0.7),
        fontFamily: FONT.ui, fontWeight: 900, fontSize: 32, color: C.navy, transform: `rotate(${(1 - f) * ((i % 3) - 1) * 6}deg)` })}>{t}</div>;
    })}
  </>
);

// 12 · STEP 3: design / code / QA cards compare notes
const S12: S = ({ u }) => {
  const who = [['game-designer', C.magenta, 'fits the vision?'], ['lead-programmer', C.cyan, 'no magic numbers'], ['qa-lead', '#7a5cff', 'tested + looked at?']] as const;
  return (
    <>
      {who.map(([n, col, note], i) => {
        const s = sp(u, 0.1 + i * 0.15), x = 100 + i * 300;
        return (
          <div key={n} style={abs(x, 560, { width: 280, transform: `translateY(${(1 - s) * 80}px)`, opacity: clamp(s * 2) })}>
            <Chip col={col} mono style={{ fontSize: 20, width: 270, justifyContent: 'center' }}>{n}</Chip>
            <div style={{ marginTop: 18, padding: '18px 16px', borderRadius: 20, background: '#fff', border: `2px solid ${col}`, fontFamily: FONT.ui, fontSize: 31, fontWeight: 800, color: C.navy, boxShadow: depth(0.5),
              opacity: fade(u, 0.9 + i * 0.3) }}>“{note}”</div>
            <div style={{ marginTop: 16, fontSize: 64, textAlign: 'center', color: C.ok, opacity: fade(u, 1.9 + i * 0.2), transform: `scale(${sp(u, 1.9 + i * 0.2)})` }}>✓</div>
          </div>
        );
      })}
    </>
  );
};

// 13 · mock platformer, clearly marked ILLUSTRATIVE
const S13: S = ({ u }) => {
  const hx = 60 + u * 150, jump = Math.max(0, Math.sin(clamp((u - 1.2) / 0.8) * Math.PI)) * 170;
  return (
    <>
      <Platformer hx={hx} hy={406 - jump} />
      <Illustrative x={X0 + 60} y={Y0 + 40} text="DEMO = ILLUSTRATIVE · not repo output" />
    </>
  );
};

// 14 · the hero falls through the floor, the QA card goes red
const S14: S = ({ u }) => {
  const fall = easeInCubic(invLerp(0.35, 1.1, u)) * 340;
  return (
    <>
      <Platformer hx={400} hy={406 + fall} broken tint={u > 0.6 ? C.bad : C.navy} />
      <div style={abs(620, 590, { transform: `rotate(6deg) scale(${sp(u, 1.0)})`, opacity: clamp(sp(u, 1.0) * 2) })}>
        <div style={{ padding: '20px 26px', borderRadius: 18, background: C.bad, color: '#fff', fontFamily: FONT.display, fontWeight: 900, fontSize: 44, boxShadow: `0 0 40px ${C.bad}88` }}>⚑ QA: FAIL</div>
        <div style={{ marginTop: 10, fontFamily: FONT.mono, fontSize: 20, color: C.navy2 }}>player falls through floor</div>
      </div>
      <Illustrative x={X0 + 60} y={Y0 + 40} />
    </>
  );
};

// 15 · payroll gag stamped MYTH
const S15: S = ({ u }) => (
  <>
    <Panel x={X0 + 80} y={Y0 + 10} w={SW - 160} h={SH - 30} style={{ background: '#fff' }}>
      <div style={{ padding: '26px 34px', fontFamily: FONT.mono, fontSize: 24, color: C.navy }}>
        <div style={{ fontWeight: 800, fontSize: 30, marginBottom: 14 }}>PAYROLL · NOVEMBER</div>
        {AGENTS.slice(0, 9).map((a, i) => <div key={a} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: `1px dashed ${C.line}`, padding: '7px 0', opacity: fade(u, 0.05 * i) }}><span>{a}</span><span>₹ ??,???</span></div>)}
        <div style={{ marginTop: 10, color: C.navy2 }}>… + 40 more</div>
      </div>
    </Panel>
    <Stamp text="MYTH" u={u} at={0.02} x={540} y={830} size={150} />
  </>
);

// 16 · the wand disappears, a human approves the change
const S16: S = ({ u }) => {
  const poof = invLerp(0.2, 0.8, u), cur = easeInOutCubic(invLerp(1.2, 2.1, u)), click = u > 2.15;
  return (
    <>
      {poof < 1 ? <div style={abs(420, 620, { width: 220, height: 220, opacity: 1 - poof, transform: `rotate(${-30 + poof * 40}deg) scale(${1 - 0.6 * poof})` })}>
        <div style={abs(100, 60, { width: 22, height: 170, borderRadius: 8, background: C.navy })} /><div style={abs(70, 10, { width: 82, height: 82, background: '#ffd34d', clipPath: 'polygon(50% 0,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)' })} /></div> : null}
      {[...Array(10)].map((_, i) => { const a = (i / 10) * Math.PI * 2, r = 40 + 200 * easeOutCubic(poof); return poof > 0 && poof < 1 ? <div key={i} style={abs(470 + Math.cos(a) * r, 740 + Math.sin(a) * r, { width: 14, height: 14, borderRadius: 7, background: i % 2 ? C.cyan : C.magenta, opacity: 1 - poof })} /> : null; })}
      <Panel x={X0 + 130} y={Y0 + 120} w={SW - 260} h={360} style={{ opacity: fade(u, 0.7), transform: `scale(${0.9 + 0.1 * sp(u, 0.7)})` }}>
        <div style={{ padding: 34, fontFamily: FONT.ui, color: C.navy }}>
          <div style={{ fontWeight: 900, fontSize: 36 }}>Apply changes to player.gd?</div>
          <div style={{ fontFamily: FONT.mono, fontSize: 22, color: C.navy2, marginTop: 10 }}>+ 24  − 6 lines · reviewed by lead-programmer</div>
          <div style={{ display: 'flex', gap: 20, marginTop: 40 }}>
            <div style={{ padding: '16px 34px', borderRadius: 14, background: click ? C.ok : C.navy, color: '#fff', fontWeight: 900, fontSize: 30, transform: `scale(${click ? 0.95 : 1})` }}>{click ? '✓ Approved' : 'Approve'}</div>
            <div style={{ padding: '16px 34px', borderRadius: 14, border: `2px solid ${C.line}`, fontWeight: 700, fontSize: 30, color: C.navy2 }}>Reject</div>
          </div>
        </div>
      </Panel>
      <svg viewBox="0 0 40 52" style={abs(lerp(900, 330, cur), lerp(1090, 900, cur), { width: 54, height: 70, opacity: fade(u, 1.1), filter: 'drop-shadow(0 6px 8px rgba(11,27,58,0.3))' })}><path d="M4 2 L4 40 L14 31 L21 48 L28 45 L21 29 L35 29 Z" fill="#fff" stroke={C.navy} strokeWidth="3" strokeLinejoin="round" /></svg>
      <div style={abs(X0 + 130, Y0 + 520, { fontFamily: FONT.ui, fontWeight: 800, fontSize: 30, color: '#cfe0ff', opacity: fade(u, 2.3) })}>you make every decision · README</div>
    </>
  );
};

// 17 · budget meter and permission toggle
const S17: S = ({ u }) => {
  const a = lerp(-80, 25, easeInOutCubic(invLerp(0.2, 1.6, u))), on = u > 1.6;
  return (
    <>
      <Panel x={X0 + 40} y={Y0 + 30} w={420} h={480}>
        <div style={{ textAlign: 'center', marginTop: 26, fontFamily: FONT.mono, fontWeight: 800, fontSize: 24, color: C.navy2 }}>MODEL USAGE</div>
        <svg viewBox="0 0 400 260" style={abs(10, 90, { width: 400, height: 260 })}>
          <path d="M40 220 A160 160 0 0 1 360 220" fill="none" stroke="#d5e3f2" strokeWidth="26" strokeLinecap="round" />
          <path d="M40 220 A160 160 0 0 1 360 220" fill="none" stroke="url(#g)" strokeWidth="26" strokeLinecap="round" strokeDasharray={`${503 * (a + 90) / 180} 600`} />
          <defs><linearGradient id="g"><stop offset="0" stopColor={C.ok} /><stop offset="0.6" stopColor={C.cyan} /><stop offset="1" stopColor={C.magenta} /></linearGradient></defs>
          <line x1="200" y1="220" x2={200 + Math.sin((a * Math.PI) / 180) * 140} y2={220 - Math.cos((a * Math.PI) / 180) * 140} stroke={C.navy} strokeWidth="10" strokeLinecap="round" />
          <circle cx="200" cy="220" r="16" fill={C.navy} />
        </svg>
        <div style={abs(0, 380, { width: 420, textAlign: 'center', fontFamily: FONT.ui, fontWeight: 800, fontSize: 30, color: C.navy })}>costs money</div>
      </Panel>
      <Panel x={X0 + 500} y={Y0 + 30} w={400} h={480}>
        <div style={{ textAlign: 'center', marginTop: 26, fontFamily: FONT.mono, fontWeight: 800, fontSize: 24, color: C.navy2 }}>PERMISSIONS</div>
        {['ask before running', 'review hooks', 'review generated code'].map((l, i) => {
          const o = u > 1.6 + i * 0.25;
          return <div key={l} style={abs(30, 110 + i * 110, { width: 340, display: 'flex', alignItems: 'center', gap: 18, fontFamily: FONT.ui, fontWeight: 700, fontSize: 25, color: C.navy })}>
            <div style={{ width: 84, height: 46, borderRadius: 23, background: o ? C.ok : '#c9d5e6', position: 'relative' }}><div style={{ position: 'absolute', top: 5, left: o ? 43 : 5, width: 36, height: 36, borderRadius: 18, background: '#fff' }} /></div>{l}</div>;
        })}
      </Panel>
      {on ? null : null}
    </>
  );
};

// 18 · CTA + source cue + TechpeTrek end card
const S18: S = ({ u }) => {
  const s = sp(u, 0.05, 12, 0.5);
  return (
    <>
      <div style={abs(0, 560, { width: 1080, textAlign: 'center', transform: `scale(${0.6 + 0.4 * s})`, opacity: clamp(s * 2) })}>
        <div style={{ display: 'inline-block', padding: '28px 54px', borderRadius: 30, background: `linear-gradient(135deg, ${C.cyan}, ${C.cyanDeep})`, color: '#fff', fontFamily: FONT.display, fontWeight: 900, fontSize: 80, whiteSpace: 'nowrap',
          boxShadow: `0 20px 60px ${C.cyan}66, 0 8px 0 ${C.navy}` }}>Comment “STUDIO”</div>
        <div style={{ marginTop: 30, fontFamily: FONT.ui, fontWeight: 800, fontSize: 34, color: C.navy }}>repo + safe setup checklist DM mein</div>
        <div style={{ marginTop: 8, fontFamily: FONT.ui, fontWeight: 700, fontSize: 28, color: C.navy2 }}>save karo · share karo</div>
      </div>
      <div style={abs(0, 905, { width: 1080, textAlign: 'center', opacity: fade(u, 0.6) })}>
        <div style={{ fontFamily: FONT.mono, fontSize: 24, color: C.navy }}>github.com/Donchitos/Claude-Code-Game-Studios</div>
        <div style={{ fontFamily: FONT.mono, fontSize: 20, color: C.navy2, marginTop: 6 }}>MIT · README checked 1 Nov 2026 · 31.7k★ that day</div>
        <Img src={staticFile('brand/techpe-trek.jpg')} style={{ width: 96, height: 96, borderRadius: 22, marginTop: 18, opacity: 0.75 }} />
      </div>
    </>
  );
};

export const SCENES: S[] = [S01, S02, S03, S04, S05, S06, S07, S08, S09, S10, S11, S12, S13, S14, S15, S16, S17, S18];
/** which slots carry the source lower-third (factual reveals) */
export const SOURCED = new Set([2, 3, 6, 7, 8, 15]);
