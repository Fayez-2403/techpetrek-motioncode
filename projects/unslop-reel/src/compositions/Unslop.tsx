// AI WEBSITE SAB EK JAISI?! — the unslop reel (1080 x 1920, 60 fps). The reel opens as slop (purple gradient, glow,
// gradient text, emoji, five identical screens), redlines itself, and turns into its own designed look on "bhai bas karo".
// Then the proof is real: unslop's README and Daily Launch through a magnifier (src/reel/Page.tsx), our own unslop run
// on the repo's example as the story video unslop's story.mjs rendered (public/clips/unslop-story.mp4), and the licence
// credit. Every fact is in docs/factcheck.md; every event hangs on Liam's word times (src/reel/time.ts).
import React from 'react';
import { AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from 'remotion';
import { ThreeCanvas } from '@remotion/three';
import { MonitorWall, CUT, useTexture } from '../world/Monitors';
import { PageWin, type Box } from '../reel/Page';
import { C, F } from '../reel/style';
import { E, T, clamp, lerp, lin, sec, secAt, wordT } from '../reel/time';
import PAGES from '../config/pages.json';
import EX from '../config/example.json';
import HK from '../config/hook.json';

export const UNSLOP_SECONDS = T.duration;
const FPS = 60;
const RB = PAGES.repo.boxes as Record<string, Box>, DB = PAGES.daily.boxes as Record<string, Box>, XB = EX.boxes as Record<string, Box>;
const WORDS = T.lines.filter((l) => l.id !== 'v00' && l.id !== 'v01').flatMap((l) => l.words.map((w) => ({ ...w, line: l.id })));   // v00 + v01 are the hook's own type
const w = (line: string, re: RegExp, fb: number) => wordT(line, re, fb);
const TURN = w('v02', /^karo/, 5.5);                         // the reel unslops itself here
const VSTART = w('v06', /^chalaya/, 23.2);                    // our story video starts on "chalaya"
const STEPS: [string, number][] = [['Spacing', 2.0], ['Color and icons', 3.5], ['Type and copy', 4.7], ['Details', 7.55]];   // measured in the video
const VLEN = 9.22;

// -------- small pieces --------
const Tag: React.FC<{ b: { x: number; y: number; w: number; h: number }; label: string; k: number; fixed?: number; side?: 'top' | 'bottom' | 'right' | 'bottomRight' }> = ({ b, label, k, fixed = 0, side = 'top' }) => {
  if (k <= 0) return null;
  const col = fixed > 0.5 ? C.ivory : C.red, s = lerp(1.04, 1, E.out(k));
  const tp: React.CSSProperties = side === 'bottomRight' ? { right: -2, top: '100%', marginTop: 8 } : side === 'top' ? { left: -2, bottom: '100%', marginBottom: 8 } : side === 'bottom' ? { left: -2, top: '100%', marginTop: 8 } : { left: '100%', top: '50%', marginLeft: 12, transform: 'translateY(-50%)' };
  return (
    <div style={{ position: 'absolute', left: b.x, top: b.y, width: b.w, height: b.h, border: `2.5px solid ${col}`, borderRadius: 6, background: fixed > 0.5 ? 'rgba(244,235,221,.05)' : 'rgba(255,77,106,.08)', opacity: clamp(k * 3), transform: `scale(${s})` }}>
      <span style={{ position: 'absolute', ...tp, padding: '4px 14px', borderRadius: 18, whiteSpace: 'nowrap', background: col, color: fixed > 0.5 ? '#141415' : '#fff', font: `500 24px/1.3 ${F.mono}` }}>{label}</span>
    </div>
  );
};
const Line: React.FC<{ t: number; t0: number; top: number; children: React.ReactNode; size?: number; color?: string; mono?: boolean; left?: number; t1?: number }> = ({ t, t0, top, children, size = 26, color = C.muted, mono = true, left = 48, t1 = 1e9 }) => {
  if (t < t0 || t > t1) return null;
  const k = E.out(lin(t, t0, t0 + 0.35)), o = 1 - E.in(lin(t, t1 - 0.2, t1));
  return <div style={{ position: 'absolute', left, right: 48, top, opacity: k * o, transform: `translateY(${(1 - k) * 10}px)`, fontFamily: mono ? F.mono : F.ui, fontWeight: mono ? 400 : 500, fontSize: size, lineHeight: 1.35, color }}>{children}</div>;
};

function Captions({ t }: { t: number }) {
  const cur = WORDS.findIndex((x) => t >= x.t0 - 0.05 && t < x.t1 + 0.3);
  if (cur < 0 || t < sec('slop').t0) return null;                 // the hook's headline is its own caption
  const x = WORDS[cur], line = WORDS.filter((y) => y.line === x.line), i = line.indexOf(x), st = Math.floor(i / 4) * 4, group = line.slice(st, st + 4);
  const ent = E.out(lin(t, group[0].t0 - 0.06, group[0].t0 + 0.12)), clean = E.inout(lin(t, TURN, TURN + 0.6));
  return (
    <div style={{ position: 'absolute', left: 60, right: 170, top: 1580, textAlign: 'center', opacity: ent, transform: `translateY(${(1 - ent) * 14}px)` }}>
      {group.map((g, n) => {
        const on = t >= g.t0 - 0.03, word = g.w.replace(/[—…"]/g, '');
        return (
          <span key={n} style={{ position: 'relative', display: 'inline-block', margin: '0 10px' }}>
            <span style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 60, lineHeight: 1.1, color: on ? C.ivory : 'rgba(244,235,221,.38)', opacity: clean, textShadow: '0 2px 18px rgba(0,0,0,.7)' }}>{word}</span>
            {clean < 1 ? <span style={{ position: 'absolute', left: 0, top: 0, fontFamily: F.slop, fontWeight: 800, fontSize: 60, lineHeight: 1.1, whiteSpace: 'nowrap', opacity: (1 - clean) * (on ? 1 : 0.45), background: 'linear-gradient(135deg,#f0abfc,#818cf8)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', filter: 'drop-shadow(0 0 16px rgba(168,85,247,.85))' }}>{word}</span> : null}
          </span>
        );
      })}
    </div>
  );
}

// the reel's own headline: slop until "bhai bas karo", then unslopped in place (gradient -> ivory, 800 -> 500, emoji out, "?!" -> "?")
function Headline({ t }: { t: number }) {
  const s1 = sec('slop');
  if (t > s1.t1 + 0.05 || t < sec('hook').t0 - 0.02) return null;
  const v = T.lines.find((l) => l.id === 'v01')!.words, k = E.inout(lin(t, TURN + 0.1, TURN + 0.75)), out = 1 - E.in(lin(t, s1.t1 - 0.25, s1.t1));
  const words = ['AI', 'website', 'sab', 'ek', 'jaisi?'];
  const emo = (ch: string, d: number) => <span style={{ display: 'inline-block', width: lerp(118, 0, k), overflow: 'hidden', verticalAlign: 'top', opacity: 1 - k, transform: `translateY(${Math.sin(t * 6 + d) * 6 * (1 - k)}px)` }}>{ch}</span>;
  const g = (txt: string, i: number) => {
    const at = v[Math.min(i, v.length - 1)].t0, a = E.out(lin(t, at - 0.05, at + 0.12));
    return (
      <span key={i} style={{ position: 'relative', display: 'inline-block', marginRight: 22, opacity: a, transform: `translateY(${(1 - a) * 26}px) scale(${lerp(1.25, 1, a)})` }}>
        <span style={{ fontFamily: F.ui, fontWeight: 500, color: C.ivory, opacity: k }}>{txt}</span>
        <span style={{ position: 'absolute', left: 0, top: 0, whiteSpace: 'nowrap', fontFamily: F.slop, fontWeight: 800, opacity: 1 - k, background: 'linear-gradient(135deg,#f0abfc,#818cf8)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>{txt}</span>
      </span>
    );
  };
  const bang = E.out(lin(t, v[v.length - 1].t0, v[v.length - 1].t0 + 0.12));
  return (
    <div style={{ position: 'absolute', left: 40, right: 40, top: 262, textAlign: 'center', fontSize: lerp(108, 100, k), lineHeight: 1.06, opacity: out, filter: k < 1 ? `drop-shadow(0 0 ${28 * (1 - k)}px rgba(168,85,247,.9))` : undefined }}>
      <div style={{ whiteSpace: 'nowrap' }}>{emo('✨', 0)}{words.slice(0, 2).map((x, i) => g(x, i))}</div>
      <div style={{ whiteSpace: 'nowrap' }}>{words.slice(2).map((x, i) => g(x, i + 2))}<span style={{ display: 'inline-block', width: lerp(40, 0, k), overflow: 'hidden', verticalAlign: 'top', opacity: (1 - k) * bang, fontFamily: F.slop, fontWeight: 800, color: '#e9d5ff' }}>!</span>{emo('🚀', 2)}</div>
    </div>
  );
}

// -------- the 2D view of unslop's example (the cut from the monitor wall lands on exactly this view) --------
function Example({ t, z, cx, cy, top = 960, children, dim = 0 }: { t: number; z: number; cx: number; cy: number; top?: number; children?: (m: (b: Box) => Box) => React.ReactNode; dim?: number }) {
  const left = 540 - cx * z, tp = top - cy * z, m = (b: Box) => ({ x: left + b.x * z, y: tp + b.y * z, w: b.w * z, h: b.h * z });
  return (
    <>
      <Img src={staticFile('pages/example_dashboard.png')} style={{ position: 'absolute', left, top: tp, width: 1440 * z, height: 900 * z, maxWidth: 'none', filter: dim ? `brightness(${1 - dim})` : undefined }} />
      {children?.(m)}
    </>
  );
}


// -------- the intro: who made it, on his real GitHub pages (profile + repositories, then the unslop repo and its stars) --------
const STARS: Box = { x: 998, y: 502, w: 64, h: 20 };          // "8.4k stars" in the repo sidebar (public/pages/hook_repo.png, 4 Nov 18:12 UTC)
function FullPage({ img, cssW, cssH, cx, cy, z, dim = 0.5, children }: { img: string; cssW: number; cssH: number; cx: number; cy: number; z: number; dim?: number; children?: (m: (b: Box) => Box, L: { left: number; top: number }) => React.ReactNode }) {
  const left = 540 - cx * z, top = 960 - cy * z, m = (b: Box) => ({ x: left + b.x * z, y: top + b.y * z, w: b.w * z, h: b.h * z });
  return (
    <>
      <Img src={staticFile(img)} style={{ position: 'absolute', left, top, width: cssW * z, height: cssH * z, maxWidth: 'none', filter: `brightness(${1 - dim})` }} />
      {children?.(m, { left, top })}
    </>
  );
}
function Intro({ t }: { t: number }) {
  const s = sec('intro'), v = T.lines.find((l) => l.id === 'v00')!.words, at = (re: RegExp, fb: number) => v.find((x) => re.test(x.w))?.t0 ?? fb;
  const tDamir = at(/^Damir/, 0.87), tSkill = at(/^skill/, 2.35), tStars = at(/^8,000/, 4.37), sw = E.inout(lin(t, tSkill - 0.25, tSkill + 0.15));
  const name = HK.profile.name as Box;
  // the profile drifts up so his repositories scroll past; the repo page rises in on "skill"
  const prof = { cx: 470, cy: lerp(560, 860, lin(t, 0, tSkill + 0.2)), z: 1.08 };
  const repo = { cx: 890, cy: lerp(380, 336, E.out(lin(t, tSkill, tStars))), z: lerp(1.08, 1.2, lin(t, tSkill, s.t1)) };
  const lensK = E.out(lin(t, tStars - 0.12, tStars + 0.2)), out = E.in(lin(t, s.t1 - 0.22, s.t1));
  const IDX = [[0, 1, 2, 3], [4, 5, 6, 7], [9, 10, 11, 12, 15, 16]];   // v00 word index per on-screen word
  const phrases: [number, number, string[]][] = [[0, at(/^ne$/, 1.91) - 0.05, ['Ek developer,', 'Damir Sokolovsky']], [at(/^ne$/, 1.91) - 0.05, at(/^aur$/, 3.17), ['ne ek skill', 'banaya']], [at(/^aur$/, 3.17), s.t1, ['1 hafte mein', '8,000+ GitHub stars']]];
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: 1 - out, transform: `scale(${1 + 0.06 * out})` }}>
      <div style={{ position: 'absolute', inset: 0, transform: `translateY(${-sw * 1920}px)` }}>
        <FullPage img="pages/hook_profile.png" cssW={1280} cssH={1800} {...prof} dim={0.4}>
          {(m) => { const k = E.out(lin(t, tDamir - 0.05, tDamir + 0.2)), b = m(name); return k > 0 ? <div style={{ position: 'absolute', left: b.x - 10, top: b.y - 8, width: (b.w + 20) * k, height: b.h + 16, border: `3px solid ${C.ivory}`, borderRadius: 8 }} /> : null; }}
        </FullPage>
      </div>
      <div style={{ position: 'absolute', inset: 0, transform: `translateY(${(1 - sw) * 1920}px)` }}>
        <FullPage img="pages/hook_repo.png" cssW={1280} cssH={1800} {...repo} dim={0.4}>
          {(m) => {
            if (lensK <= 0) return null;
            const b = m(STARS), r = 230 * lensK, mag = 2.2, zz = repo.z * mag, cx = b.x + b.w / 2, cy = b.y + b.h / 2;
            return (
              <div style={{ position: 'absolute', left: cx - r - 120, top: cy - r + 40, width: 2 * r, height: 2 * r, borderRadius: '50%', overflow: 'hidden', boxShadow: `0 0 0 4px ${C.ivory}, 0 24px 60px rgba(0,0,0,.6)`, background: '#0d1117' }}>
                <Img src={staticFile('pages/hook_repo.png')} style={{ position: 'absolute', left: r - (STARS.x + STARS.w / 2) * zz, top: r - (STARS.y + STARS.h / 2) * zz, width: 1280 * zz, height: 1800 * zz, maxWidth: 'none' }} />
                <div style={{ position: 'absolute', left: r - (STARS.w / 2 + 34) * zz, top: r - (STARS.h / 2 + 5) * zz, width: (STARS.w + 40) * zz, height: (STARS.h + 10) * zz, border: `2px solid ${C.ivory}`, borderRadius: 6, opacity: lensK }} />
              </div>
            );
          }}
        </FullPage>
      </div>
      {/* a neutral scrim so the type reads over the pages */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 900, background: 'linear-gradient(180deg, rgba(20,20,21,.92) 0%, rgba(20,20,21,.75) 55%, rgba(20,20,21,0) 100%)' }} />
      {phrases.map(([a, b, lines], i) => {
        if (t < a - 0.02 || t > b + 0.05) return null;
        const leave = E.in(lin(t, b - 0.12, b + 0.02));
        let n = 0;
        return (
          <div key={i} style={{ position: 'absolute', left: 40, right: 40, top: 300, textAlign: 'center', opacity: 1 - leave, transform: `translateY(${-leave * 40}px)` }}>
            {lines.map((ln, li) => (
              <div key={li} style={{ whiteSpace: 'nowrap', font: `500 ${li === 1 && i === 0 ? 104 : 96}px/1.12 ${F.ui}`, color: C.ivory }}>
                {ln.split(' ').map((w, wi) => {
                  const idx = n++, wt = Math.max(a, v[Math.min(v.length - 1, IDX[i][idx])]?.t0 ?? a);   // each on-screen word appears as Liam says it
                  const k = i === 0 && idx === 0 ? 1 : E.out(lin(t, wt - 0.05, wt + 0.12));   // frame 0 already reads "Ek"
                  return <span key={wi} style={{ display: 'inline-block', marginRight: 22, opacity: k, transform: `translateY(${(1 - k) * 26}px)` }}>{w}</span>;
                })}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

function Scene({ t, tex }: { t: number; tex: ReturnType<typeof useTexture> }) {
  const s = secAt(t), id = s.id, a = t - s.t0, f = useCurrentFrame();
  const hook = sec('hook'), slopS = sec('slop');
  const zCut = 1080 / CUT.cssW;
  if (id === 'intro') return <Intro t={t} />;
  if (id === 'hook') {
    return tex ? <ThreeCanvas width={1080} height={1920} gl={{ alpha: true, antialias: true }} style={{ position: 'absolute', inset: 0 }}><MonitorWall t={t - hook.t0} tex={tex} t1={hook.t1 - hook.t0} /></ThreeCanvas> : null;
  }
  if (id === 'slop') {
    const z = lerp(zCut, zCut * 1.08, E.inout(lin(t, slopS.t0, slopS.t1)));
    const kP = lin(t, w('v02', /^Purple/, 2.55) - 0.05, w('v02', /^Purple/, 2.55) + 0.2), kG = lin(t, w('v02', /^glow/, 3.8) - 0.4, w('v02', /^glow/, 3.8) - 0.15), kE = lin(t, w('v02', /^emoji/, 4.15) - 0.05, w('v02', /^emoji/, 4.15) + 0.2);
    const leave = E.in(lin(t, slopS.t1 - 0.3, slopS.t1));
    return (
      <div style={{ position: 'absolute', inset: 0, transform: `translateY(${leave * -260}px)`, opacity: 1 - leave }}>
        <Example t={t} z={z} cx={CUT.cx} cy={CUT.cy} dim={0.1 * E.inout(lin(t, TURN, TURN + 0.6))}>
          {(m) => <>
            <Tag b={m({ x: 940, y: 52, w: 270, h: 110 })} label="Purple gradient" k={kP} side="bottom" />
            <Tag b={m({ x: XB.bars.x, y: XB.bars.y - 10, w: 420, h: XB.bars.h + 10 })} label="Glow" k={kG} />
            <Tag b={m({ x: 232, y: XB.overview.y, w: 28, h: 258 })} label="Emoji labels" k={kE} side="right" />
          </>}
        </Example>
      </div>
    );
  }
  if (id === 'unslop') {
    const kL = E.out(lin(t, w('v03', /^Claude/, 7.56) - 0.3, w('v03', /^Claude/, 7.56) + 0.2)), kA = E.out(lin(t, w('v03', /^open/, 10.45) - 0.35, w('v03', /^open/, 10.45)));
    const v0 = { cx: 640, cy: 470, z: 0.78 }, v1 = { cx: 470, cy: RB.what.y + 120, z: 1.05 }, v2 = { cx: 900, cy: 420, z: 1.05 };
    const m1 = E.inout(lin(t, s.t0 + 0.4, w('v03', /^Claude/, 7.56))), m2 = E.inout(lin(t, w('v03', /^open/, 10.45) - 0.5, w('v03', /^open/, 10.45) + 0.2));
    const view = { cx: lerp(lerp(v0.cx, v1.cx, m1), v2.cx, m2), cy: lerp(lerp(v0.cy, v1.cy, m1), v2.cy, m2), z: lerp(lerp(v0.z, v1.z, m1), v2.z, m2) };
    const enter = E.out(lin(t, s.t0, s.t0 + 0.4));
    return (
      <>
        <Line t={t} t0={s.t0 + 0.3} top={276} size={26}>by Damir Sokolovsky · @heydamir</Line>
        <div style={{ position: 'absolute', inset: 0, transform: `translateY(${(1 - enter) * 160}px)`, opacity: enter }}>
          <PageWin img="pages/repo.png" cssW={1280} cssH={PAGES.repo.H} win={{ x: 40, y: 330, w: 1000, h: 1170 }} view={view} url="github.com/heydamir/unslop" drift={t - s.t0}
            lens={kA > 0 ? { at: RB.about, mag: 1.7, r: 250, k: kA, dy: 40 } : { at: RB.what, mag: 1.9, r: 260, k: kL * (1 - kA), dy: 30 }} />
        </div>
      </>
    );
  }
  if (id === 'audit') {
    const z = 1.32, view = { cx: 590, cy: 330 };
    const kw = (re: RegExp, fb: number) => E.out(lin(t, w('v04', re, fb) - 0.08, w('v04', re, fb) + 0.15));
    const rows: [number, number][] = [[214, 46], [272, 30], [302, 40], [350, 32], [383, 44], [441, 31]];
    const list = E.out(lin(t, w('v04', /^list/, 16.04) - 0.3, w('v04', /^list/, 16.04) + 0.15));
    const enter = E.out(lin(t, s.t0, s.t0 + 0.35));
    return (
      <>
        <div style={{ position: 'absolute', left: 40, top: 340, width: 1000, height: 1160, borderRadius: 18, overflow: 'hidden', boxShadow: `0 0 0 1px ${C.hair}`, opacity: enter, transform: `translateY(${(1 - enter) * 120}px)` }}>
          <div style={{ position: 'absolute', inset: 0 }}>
            <Example t={t} z={z} cx={view.cx} cy={view.cy} top={380}>
              {(m) => {
                const k1 = kw(/^spacing/, 12.2);
                return <>
                  {rows.map(([y, h], i) => k1 > 0 ? <Tag key={i} b={m({ x: 232, y, w: 236, h })} label={`${h}px`} k={lin(t, w('v04', /^spacing/, 12.2) + i * 0.05, w('v04', /^spacing/, 12.2) + i * 0.05 + 0.15)} side="right" /> : null)}
                  <Tag b={m({ x: 940, y: 50, w: 270, h: 100 })} label="Purple to blue gradient" k={kw(/^color/, 12.75)} side="bottom" />
                  <Tag b={m({ x: XB.headline.x, y: XB.headline.y, w: 430, h: XB.headline.h })} label="Greeting headline" k={kw(/^copy/, 13.6)} side="bottom" />
                  <Tag b={m({ x: XB.navlabel.x, y: XB.navlabel.y - 2, w: 92, h: 20 })} label="Tracked caps" k={kw(/^type/, 14.27)} />
                  <Tag b={m({ x: XB.logo.x - 2, y: XB.logo.y - 2, w: 36, h: 36 })} label="Emoji icons" k={kw(/^icons/, 13.18)} side="right" />
                </>;
              }}
            </Example>
          </div>
          {list > 0 ? (
            <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '28px 32px', background: C.raised, borderTop: `1px solid ${C.hair}`, transform: `translateY(${(1 - list) * 100}%)` }}>
              <div style={{ font: `500 26px/1.3 ${F.ui}`, color: C.ivory, marginBottom: 14 }}>Audit</div>
              {['Violet to blue gradients · page, logo, active row, pills', 'Gradient text · wordmark, headline, figures', 'Emoji as icons · nav, plans, card labels', 'Tracked caps · Navigation, Plans, card labels', 'Off-grid rows · 46 / 30 / 40 / 32 / 44 / 31 px', 'Copy · greeting, “!!”, changes with no reference'].map((x, i) => {
                const k = E.out(lin(t, w('v04', /^list/, 16.04) - 0.1 + i * 0.06, w('v04', /^list/, 16.04) + 0.15 + i * 0.06));
                return <div key={i} style={{ display: 'flex', gap: 16, alignItems: 'center', font: `400 24px/1.6 ${F.mono}`, color: C.sec, opacity: k, transform: `translateY(${(1 - k) * 8}px)` }}><span style={{ width: 10, height: 10, borderRadius: 5, background: C.red, flex: 'none' }} />{x}</div>;
              })}
            </div>
          ) : null}
        </div>
      </>
    );
  }
  if (id === 'direction') {
    const kL = E.out(lin(t, s.t0 + 0.2, s.t0 + 0.55)), card = w('v05', /^direction/, 18.75);
    return (
      <>
        <PageWin img="pages/repo.png" cssW={1280} cssH={PAGES.repo.H} win={{ x: 40, y: 330, w: 1000, h: 500 }} view={{ cx: 360, cy: RB.direction.y + 10, z: 0.92 }} url="github.com/heydamir/unslop" drift={t - s.t0}
          lens={{ at: RB.direction, mag: 1.65, r: 175, k: kL, dx: 40 }} k={E.out(lin(t, s.t0, s.t0 + 0.3))} />
        <div style={{ position: 'absolute', left: 40, right: 40, top: 870, padding: '30px 34px', borderRadius: 18, background: C.raised, boxShadow: `0 0 0 1px ${C.hair}`, opacity: E.out(lin(t, card - 0.4, card - 0.1)) }}>
          <div style={{ font: `500 26px/1.3 ${F.ui}`, color: C.ivory, marginBottom: 16 }}>Direction · our run on EmberAI</div>
          {[['Product', 'invoicing for small teams'], ['Character', 'steady, exact, a little warm'], ['World', 'a bookkeeper’s desk, receipts and ink'], ['Moments', 'the revenue bars, a paper receipt'], ['Signature', 'the accountant’s double rule']].map(([k, v], i) => {
            const e = E.out(lin(t, card - 0.2 + i * 0.22, card + 0.1 + i * 0.22));
            return <div key={k} style={{ display: 'flex', font: `400 28px/1.75 ${F.mono}`, opacity: e, transform: `translateY(${(1 - e) * 10}px)` }}><span style={{ width: 210, color: C.muted }}>{k}</span><span style={{ color: C.ivory }}>{v}</span></div>;
          })}
        </div>
      </>
    );
  }
  if (id === 'run' || id === 'passes' || (id === 'story' && t < VSTART + VLEN + 0.3)) {
    const playing = t >= VSTART, vt = t - VSTART, enter = E.out(lin(t, sec('run').t0, sec('run').t0 + 0.4));
    return (
      <>
        <Line t={t} t0={sec('run').t0 + 0.05} top={290} size={30} color={C.ivory}>Our run: Claude Code + unslop</Line>
        <Line t={t} t0={sec('run').t0 + 0.3} top={336} size={25}>on the repo’s own example · not a guaranteed result</Line>
        <div style={{ position: 'absolute', left: 0, top: 420, width: 1080, height: 1080, overflow: 'hidden', opacity: enter, transform: `scale(${lerp(0.94, 1, enter)})` }}>
          {playing ? <Sequence from={Math.round(VSTART * FPS)} layout="none"><OffthreadVideo src={staticFile('clips/unslop-story.mp4')} muted style={{ width: 1080, height: 1080 }} /></Sequence>
            : <Img src={staticFile('clips/story_first.png')} style={{ width: 1080, height: 1080, transform: `scale(${1 + 0.02 * lin(t, sec('run').t0, VSTART)})` }} />}
        </div>
        <div style={{ position: 'absolute', left: 48, right: 48, top: 1512, display: 'flex', gap: 30, font: `400 26px/1 ${F.mono}` }}>
          {STEPS.map(([n, at], i) => { const on = playing && vt >= at, now = on && (i === STEPS.length - 1 || vt < STEPS[i + 1][1]); return <span key={n} style={{ color: now ? C.ivory : on ? C.sec : 'rgba(244,235,221,.3)' }}>{i + 1} {n}</span>; })}
        </div>
      </>
    );
  }
  if (id === 'story') {
    const k = E.out(lin(t, VSTART + VLEN + 0.3, VSTART + VLEN + 0.75)), lens = E.out(lin(t, w('v08', /^Playwright/, 33.9) - 0.2, w('v08', /^Playwright/, 33.9) + 0.2));
    return (
      <>
        <div style={{ position: 'absolute', left: lerp(0, 48, k), top: lerp(420, 300, k), width: lerp(1080, 400, k), height: lerp(1080, 400, k), borderRadius: lerp(0, 14, k), overflow: 'hidden', boxShadow: `0 0 0 1px ${C.hair}` }}>
          <Img src={staticFile('clips/story_last.png')} style={{ width: '100%', height: '100%' }} />
        </div>
        <div style={{ position: 'absolute', left: 480, right: 48, top: 300, opacity: k }}>
          <div style={{ font: `500 30px/1.3 ${F.mono}`, color: C.ivory }}>unslop-story.mp4</div>
          <div style={{ font: `400 25px/1.6 ${F.mono}`, color: C.muted, marginTop: 10 }}>2160 × 2160 · 60 fps · 9.2 s<br />rendered by story.mjs</div>
          <div style={{ marginTop: 26, padding: '18px 20px', borderRadius: 12, background: C.deep, boxShadow: `0 0 0 1px ${C.hair}`, font: `400 21px/1.55 ${F.mono}`, color: C.sec }}>
            <span style={{ color: C.muted }}>$</span> node story.mjs story.html unslop-story.mp4<br /><span style={{ color: C.ivory }}>saved unslop-story.mp4, 4 steps, 9.2s</span>
          </div>
        </div>
        <PageWin img="pages/repo.png" cssW={1280} cssH={PAGES.repo.H} win={{ x: 40, y: 790, w: 1000, h: 700 }} view={{ cx: 520, cy: RB.needs.y + 20, z: 0.95 }} url="github.com/heydamir/unslop" drift={t - s.t0}
          lens={{ at: RB.story, mag: 1.6, r: 300, k: lens, dx: 120, dy: 60 }} k={E.out(lin(t, VSTART + VLEN + 0.5, VSTART + VLEN + 0.9))} />
      </>
    );
  }
  if (id === 'stacks') {
    const k = E.out(lin(t, s.t0 + 0.05, s.t0 + 0.45)), mk = E.out(lin(t, w('v09', /^React/, 37.07) - 0.1, w('v09', /^HTML/, 39.94) + 0.2));
    return (
      <>
        <PageWin img="pages/repo.png" cssW={1280} cssH={PAGES.repo.H} win={{ x: 40, y: 330, w: 1000, h: 1170 }} view={{ cx: lerp(560, 540, k), cy: RB.stacks.y - 30, z: lerp(0.95, 1.12, E.inout(lin(t, s.t0, s.t1))) }} url="github.com/heydamir/unslop" drift={t - s.t0}
          marks={[{ b: RB.stacks, k: mk }]} lens={{ at: RB.stacks, mag: 1.5, r: 330, k: E.out(lin(t, s.t0 + 0.3, s.t0 + 0.7)), dy: 250 }} k={k} />
      </>
    );
  }
  if (id === 'stars') {
    const k = E.out(lin(t, s.t0 + 0.05, s.t0 + 0.45)), lk = E.out(lin(t, w('v10', /^mutabik/, 43.06) - 0.2, w('v10', /^mutabik/, 43.06) + 0.2));
    return (
      <>
        <PageWin img="pages/daily.png" cssW={1280} cssH={PAGES.daily.H} win={{ x: 40, y: 330, w: 1000, h: 960 }} view={{ cx: 560, cy: 420, z: lerp(0.8, 0.95, E.inout(lin(t, s.t0, s.t1))) }} url="dailylaunch.org/p/unslop" drift={t - s.t0}
          lens={{ at: DB.asof, mag: 1.2, r: 340, k: lk, dy: 110 }} k={k} />
        <Line t={t} t0={s.t0 + 0.6} top={1312} size={25}>third-party snapshot · data as of 07:25 UTC, 4 Nov 2026 · not audited by us</Line>
      </>
    );
  }
  if (id === 'license') {
    const k = E.out(lin(t, s.t0 + 0.05, s.t0 + 0.45)), lk = E.out(lin(t, w('v11', /^License/, 46.58) + 0.3, w('v11', /^License/, 46.58) + 0.7)), dk = E.out(lin(t, w('v11', /^Damir/, 48.84) - 0.4, w('v11', /^Damir/, 48.84)));
    const v = { cx: lerp(560, 360, dk), cy: lerp(RB.license.y, RB.created.y, dk), z: 0.95 };
    return (
      <>
        <PageWin img="pages/repo.png" cssW={1280} cssH={PAGES.repo.H} win={{ x: 40, y: 330, w: 1000, h: 960 }} view={v} url="github.com/heydamir/unslop" drift={t - s.t0}
          lens={dk > 0.5 ? { at: RB.created, mag: 1.8, r: 300, k: dk, dy: 200 } : { at: RB.license, mag: 1.8, r: 300, k: lk * (1 - dk * 2), dy: 200 }} k={k} />
        <Line t={t} t0={w('v11', /^credit/, 50.52) - 0.2} top={1312} size={26} color={C.ivory}>unslop by Damir Sokolovsky (@heydamir) · github.com/heydamir/unslop</Line>
      </>
    );
  }
  if (id === 'taste') {
    const k = E.out(lin(t, s.t0, s.t0 + 0.35)), rv = w('v12', /^review/, 54.68), cur = E.inout(lin(t, s.t0 + 0.4, rv - 0.1));
    const cx = lerp(300, 1000, cur), cy = lerp(1200, 420 + 350, cur);
    return (
      <>
        <div style={{ position: 'absolute', left: 0, top: 420, width: 1080, height: 1080, opacity: k, transform: `scale(${1 + 0.012 * (t - s.t0)})`, transformOrigin: '86% 30%' }}>
          <Img src={staticFile('clips/story_last.png')} style={{ width: 1080, height: 1080 }} />
          <Tag b={{ x: 928, y: 262, w: 146, h: 170 }} label="Overdue since when? · your call" k={lin(t, rv - 0.05, rv + 0.2)} side="bottomRight" />
        </div>
        <svg width="44" height="44" viewBox="0 0 24 24" style={{ position: 'absolute', left: cx, top: cy, opacity: k, transform: `scale(${t > rv - 0.1 && t < rv + 0.05 ? 0.92 : 1})` }}><path d="M4 3l15 8-6.5 1.5L10 19z" fill={C.ivory} stroke="#141415" strokeWidth="1.2" strokeLinejoin="round" /></svg>
      </>
    );
  }
  // cta
  const dz = w('v13', /^DESIGN/, 56.63), k = E.out(lin(t, s.t0, s.t0 + 0.35)), fx = lin(t, dz + 0.35, dz + 0.65);
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: 640, textAlign: 'center', opacity: k, transform: `scale(${(1 + 0.03 * (t - s.t0)) * (1 + 0.08 * E.in(lin(t, T.duration - 1.0, T.duration)))}) translateY(${-6 * (t - s.t0)}px)` }}>   {/* the film ends in motion: leave accelerates */}
      <div style={{ font: `500 96px/1.1 ${F.ui}`, color: C.ivory, transform: `translateY(${(1 - k) * 20}px)` }}>Comment</div>
      <div style={{ position: 'relative', display: 'inline-block', marginTop: 26, padding: '6px 30px', font: `500 132px/1.05 ${F.ui}`, color: C.ivory, opacity: E.out(lin(t, dz - 0.05, dz + 0.1)) }}>
        DESIGN
        <div style={{ position: 'absolute', inset: 0, border: `3px solid ${fx > 0.5 ? C.ivory : C.red}`, borderRadius: 8 }} />
        <span style={{ position: 'absolute', left: -3, top: '100%', marginTop: 12, padding: '5px 16px', borderRadius: 20, background: fx > 0.5 ? C.ivory : C.red, color: fx > 0.5 ? '#141415' : '#fff', font: `500 26px/1.3 ${F.mono}`, whiteSpace: 'nowrap' }}>repo + setup steps in your DM</span>
      </div>
      <div style={{ marginTop: 120, font: `400 26px/1.5 ${F.mono}`, color: C.muted, opacity: E.out(lin(t, T.duration - 1.25, T.duration - 0.85)), transform: `translateY(${(1 - E.out(lin(t, T.duration - 1.25, T.duration - 0.85))) * 24}px)` }}>unslop by @heydamir · CC BY 4.0</div>
    </div>
  );
}

export const Unslop: React.FC = () => {
  const f = useCurrentFrame(), t = f / FPS, tex = useTexture('pages/example_dashboard.png');
  const clean = E.inout(lin(t, TURN, TURN + 0.6)), id = secAt(t).id, slopIn = E.out(lin(t, sec('hook').t0 - 0.12, sec('hook').t0 + 0.08));
  const src: Record<string, string> = { intro: 'github.com/heydamir · captured 4 Nov 2026', unslop: 'Source: github.com/heydamir/unslop · README', audit: 'unslop on unslop’s own example · examples/dashboard.html', direction: 'Source: unslop README · direction from our run',
    stacks: 'Source: unslop README', story: 'Source: unslop README · video rendered by its story.mjs', stars: 'Source: dailylaunch.org/p/unslop (third-party)', license: 'Source: unslop README + LICENSE (CC BY 4.0)' };
  return (
    <AbsoluteFill style={{ background: C.page, overflow: 'hidden' }}>
      {/* the slop era: purple gradient + radial glow, drained on the turn */}
      <AbsoluteFill style={{ opacity: (1 - clean) * slopIn, background: `linear-gradient(180deg, ${C.slopA} 0%, ${C.slopB} 52%, ${C.slopC} 100%)` }} />
      <AbsoluteFill style={{ opacity: (1 - clean) * slopIn * (0.75 + 0.25 * Math.sin(t * 5)), background: 'radial-gradient(60% 35% at 50% 20%, rgba(192,132,252,.45), transparent 70%)' }} />
      <Scene t={t} tex={tex} />
      <Headline t={t} />
      {id === 'slop' && t > w('v02', /^bhai/, 5.15) - 0.1 ? <>
        <Tag b={{ x: 130, y: 262, w: 820, h: 236 }} label="Gradient text" k={lin(t, w('v02', /^bhai/, 5.15) - 0.1, w('v02', /^bhai/, 5.15) + 0.1)} fixed={lin(t, TURN + 0.5, TURN + 0.55)} side="bottom" />
      </> : null}
      {src[id] ? <div style={{ position: 'absolute', left: 48, top: 240, font: `400 22px/1 ${F.mono}`, color: C.muted }}>{src[id]}</div> : null}
      <Captions t={t} />
      <Img src={staticFile('brand/techpe-trek.jpg')} style={{ position: 'absolute', right: 46, bottom: 320, width: 92, height: 92, borderRadius: 14, opacity: 0.75 }} />
      <Audio src={staticFile('audio/mix_unslop.wav')} />
    </AbsoluteFill>
  );
};
