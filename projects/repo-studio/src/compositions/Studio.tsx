// ONE BOT, 16 REPOS: the 3D world (src/reel/Director.tsx) under a 2D layer: the BREAKING ticker on the hook, a title
// card per repo (real name, owner and star count from the GitHub API, docs/repos.json), word-level captions from the
// voice's alignment, the live star total, the CTA. Pure function of the frame.
import React from 'react';
import { AbsoluteFill, Audio, Img, staticFile, useCurrentFrame } from 'remotion';
import { ThreeCanvas } from '@remotion/three';
import * as THREE from 'three';
import { World } from '../reel/Director';
import { usePreload, ALL_TEXTURES } from '../world/Panel';
import { BG, SLUGS } from '../world/Studio';
import { BEATS, E, JOB, NAME, REPO, T, TOTAL_STARS, beatAt, clamp, lin, sec, spring } from '../reel/timeline';

export const STUDIO_SECONDS = T.duration;
export const MIX = process.env.REMOTION_STUDIO_MIX ?? 'audio/mix_studio.wav';
const FONT = { display: 'Archivo, Inter, sans-serif', ui: 'Inter, sans-serif', mono: '"JetBrains Mono", monospace' };
const C = { cyan: '#63E5FA', amber: '#F5A64D', orange: '#D97757', ink: '#F4F1EC', red: '#E5484D', navy: '#071522' };
const WORDS = T.lines.flatMap((l) => l.words.map((w) => ({ ...w, line: l.id })));
const KEY = /^(breaking|news!?|bot|blender|three\.js|numpy|numba|scipy|gsap|remotion|puppeteer…?|tone\.js|pedalboard|pyloudnorm|opencv|pillow|faster-whisper|ffmpeg…?|reportlab|studio!?|free!?|stars)/i;
const fmtK = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n));

function Ticker({ t }: { t: number }) {
  const end = BEATS[0].t0;
  if (t > end + 0.2) return null;
  const inn = E.out(lin(t, 0.0, 0.25)), out = 1 - E.in(lin(t, end - 0.25, end + 0.1));
  const scroll = (t * 260) % 1400;
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: 250, transform: `translateX(${(1 - inn) * -1080}px)`, opacity: out }}>
      <div style={{ display: 'flex', alignItems: 'stretch', height: 92, boxShadow: '0 12px 30px rgba(0,0,0,.45)' }}>
        <div style={{ background: C.red, color: '#fff', fontFamily: FONT.display, fontWeight: 900, fontStretch: '80%', fontSize: 50, letterSpacing: '0.04em', padding: '14px 26px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ width: 18, height: 18, borderRadius: 9, background: '#fff', opacity: Math.floor(t * 3) % 2 ? 1 : 0.35 }} />BREAKING</div>
        <div style={{ flex: 1, overflow: 'hidden', background: 'rgba(7,10,16,0.92)', display: 'flex', alignItems: 'center' }}>
          <div style={{ whiteSpace: 'nowrap', transform: `translateX(${-scroll}px)`, fontFamily: FONT.mono, fontWeight: 700, fontSize: 36, color: C.ink }}>
            {Array.from({ length: 3 }, () => '16 FREE REPOS  ●  ONE MOTION STUDIO  ●  3D · MOTION · SOUND · CHECKS · SHIP  ●  ').join('')}</div>
        </div>
      </div>
    </div>
  );
}

function HookTitle({ t }: { t: number }) {
  const t0 = 0.8, end = BEATS[0].t0;
  if (t < t0 || t > end) return null;
  const a = spring(t - t0, 14, 0.42), out = 1 - E.in(lin(t, end - 0.2, end));
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: 400, textAlign: 'center', opacity: out, transform: `scale(${2.6 - 1.6 * a})` }}>
      <div style={{ fontFamily: FONT.display, fontWeight: 900, fontStretch: '70%', fontSize: 170, lineHeight: 0.86, color: '#fff', textShadow: '0 10px 0 #2a0e05, 0 0 70px rgba(217,119,87,.7)' }}>
        16 REPOS<br /><span style={{ color: C.orange }}>1 STUDIO</span></div>
    </div>
  );
}

function RepoCard({ t }: { t: number }) {
  const b = beatAt(t);
  if (!b || t >= sec('total').t0) return null;
  const a = t - b.t0, d = b.t1 - b.t0, r = REPO(b.slug);
  const slam = spring(a - 0.12, 17, 0.4), out = 1 - E.in(lin(a, d - 0.16, d)), cnt = E.out(lin(a, 0.3, 1.0));
  const stars = r.stars ? fmtK(Math.round(r.stars * cnt)) : null;
  return (
    <div style={{ position: 'absolute', left: 50, right: 50, top: 250, opacity: out }}>
      <div style={{ transformOrigin: '0 50%', transform: `scale(${2.2 - 1.2 * slam}) rotate(${(1 - slam) * -4}deg)`, fontFamily: FONT.display, fontWeight: 900, fontStretch: '72%', fontSize: b.slug === 'fasterwhisper' ? 86 : b.slug === 'pyloudnorm' || b.slug === 'pedalboard' || b.slug === 'puppeteer' ? 116 : 128, lineHeight: 0.9, color: '#fff',
        textShadow: '0 8px 0 #1a0a04, 0 0 40px rgba(0,0,0,.6)' }}>{NAME[b.slug]}</div>
      <div style={{ marginTop: 14, display: 'flex', gap: 12, alignItems: 'center', opacity: clamp((a - 0.25) / 0.2), transform: `translateY(${(1 - E.out(lin(a, 0.25, 0.5))) * 20}px)` }}>
        {stars ? <span style={{ padding: '8px 18px', borderRadius: 12, background: C.amber, color: '#1a0f05', fontFamily: FONT.mono, fontWeight: 800, fontSize: 36 }}>★ {stars}</span> : null}
        <span style={{ padding: '8px 16px', borderRadius: 12, background: 'rgba(7,12,20,.86)', color: C.ink, fontFamily: FONT.ui, fontWeight: 700, fontSize: 30 }}>{JOB[b.slug]}</span>
      </div>
      <div style={{ marginTop: 10, fontFamily: FONT.mono, fontSize: 22, color: 'rgba(244,241,236,.7)', opacity: clamp((a - 0.4) / 0.2) }}>{r.url.replace('https://', '')}</div>
    </div>
  );
}

function Captions({ t }: { t: number }) {
  const cur = WORDS.findIndex((w) => t >= w.t0 - 0.05 && t < w.t1 + 0.3);
  if (cur < 0) return null;
  const w = WORDS[cur], line = WORDS.filter((x) => x.line === w.line), k = line.indexOf(w), start = Math.floor(k / 3) * 3, burst = line.slice(start, start + 3);
  const ent = E.out5(lin(t, burst[0].t0 - 0.06, burst[0].t0 + 0.1));
  return (
    <div style={{ position: 'absolute', left: 40, right: 40, top: 1395, textAlign: 'center', opacity: ent, transform: `translateY(${(1 - ent) * 22}px)` }}>
      {burst.map((x, i) => {
        const on = t >= x.t0 - 0.03, now = on && t < x.t1 + 0.05, bare = x.w.replace(/[—…]/g, '');
        return <span key={i} style={{ display: 'inline-block', margin: '0 11px', fontFamily: FONT.display, fontWeight: 900, fontStretch: '80%', fontSize: 80, lineHeight: 1.08,
          color: !on ? 'rgba(244,241,236,.38)' : KEY.test(bare) ? C.orange : C.ink, transform: `scale(${now ? 1.08 : 1})`, textShadow: '0 5px 0 #000, 0 0 26px rgba(0,0,0,.75)' }}>{bare}</span>;
      })}
    </div>
  );
}

function Total({ t }: { t: number }) {
  const s = sec('total');
  if (t < s.t0 || t >= s.t1) return null;
  const a = t - s.t0, n = Math.round(TOTAL_STARS * E.out(lin(a, 0.25, 2.6))), slam = spring(a - 0.1, 14, 0.42);
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: 300, textAlign: 'center', transform: `scale(${1.8 - 0.8 * slam})` }}>
      <div style={{ fontFamily: FONT.mono, fontWeight: 800, fontSize: 150, color: C.amber, textShadow: '0 8px 0 #1a0a04, 0 0 60px rgba(245,166,77,.5)' }}>★ {n.toLocaleString('en-US')}</div>
      <div style={{ fontFamily: FONT.display, fontWeight: 800, fontStretch: '82%', fontSize: 44, color: C.ink, letterSpacing: '0.06em' }}>GITHUB STARS ACROSS 15 REPOS · ALL FREE</div>
      <div style={{ fontFamily: FONT.mono, fontSize: 22, color: 'rgba(244,241,236,.6)', marginTop: 8 }}>GitHub API, 3 Nov 2026 · ReportLab is not on GitHub</div>
    </div>
  );
}

function Cta({ t }: { t: number }) {
  const s = sec('cta');
  if (t < s.t0) return null;
  const a = t - s.t0, x = spring(a - 0.1, 12, 0.45), y = spring(a - (T.lines[8].words.find((w) => /comment/i.test(w.w))?.t0 ?? s.t0 + 1.5) + s.t0 - 0.1, 13, 0.4);
  return (
    <div style={{ position: 'absolute', left: 50, right: 50, top: 300, textAlign: 'center' }}>
      <div style={{ transform: `scale(${1.6 - 0.6 * x})`, opacity: clamp(x * 2), fontFamily: FONT.display, fontWeight: 900, fontStretch: '74%', fontSize: 96, lineHeight: 0.95, color: '#fff', textShadow: '0 7px 0 #1a0a04' }}>
        THE FULL STACK<br /><span style={{ color: C.orange }}>+ PROMPT PACK</span></div>
      <div style={{ opacity: y, transform: `scale(${0.7 + 0.3 * y})`, display: 'inline-block', marginTop: 30, padding: '20px 48px', borderRadius: 999, background: C.orange, color: '#1a0a04', fontFamily: FONT.display, fontWeight: 900, fontStretch: '82%', fontSize: 66, boxShadow: '0 10px 40px rgba(217,119,87,.5)' }}>COMMENT &ldquo;STUDIO&rdquo;</div>
    </div>
  );
}

export const Studio: React.FC = () => {
  const f = useCurrentFrame(), t = f / 60;
  const ready = usePreload(ALL_TEXTURES(SLUGS));
  const cut = BEATS.reduce((m, b) => (t >= b.t0 + 0.17 && t - b.t0 - 0.17 < m ? t - b.t0 - 0.17 : m), 9);
  const flash = cut < 0.18 ? 0.12 * (1 - cut / 0.18) ** 2 : 0;   // a soft impact flash, not a strobe
  return (
    <AbsoluteFill style={{ background: BG }}>
      {ready ? (
        <ThreeCanvas width={1080} height={1920} shadows gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}>
          <color attach="background" args={[BG]} />
          <fog attach="fog" args={[BG, 22, 90]} />
          <World t={t} />
        </ThreeCanvas>
      ) : null}
      <AbsoluteFill style={{ background: 'linear-gradient(180deg, rgba(0,0,0,.55) 0%, transparent 22%, transparent 62%, rgba(0,0,0,.6) 80%, rgba(0,0,0,.75) 100%)' }} />
      <AbsoluteFill style={{ background: '#fff', opacity: flash }} />
      <Ticker t={t} />
      <HookTitle t={t} />
      <RepoCard t={t} />
      <Total t={t} />
      <Cta t={t} />
      <Captions t={t} />
      <div style={{ position: 'absolute', left: 50, bottom: 316, fontFamily: FONT.mono, fontSize: 20, color: 'rgba(244,241,236,.55)' }}>stack list via @0xwhrrari · fan-made bot · real GitHub pages</div>
      {t >= sec('cta').t0 ? <Img src={staticFile('brand/techpe-trek.jpg')} style={{ position: 'absolute', right: 50, bottom: 330, width: 110, height: 110, borderRadius: 18, opacity: 0.8 * clamp((t - sec('cta').t0 - 0.4) / 0.4) }} /> : null}
      <Audio src={staticFile(MIX)} />
    </AbsoluteFill>
  );
};
