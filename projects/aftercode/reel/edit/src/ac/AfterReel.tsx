// AFTERCODE product reel (70 s, 1080x1920, 60 fps). The picture is the real app: 3D shots captured from its own reel
// mode (web/src/reel/reel.ts) and UI inserts captured from the desktop app, all on one continuous window of the song.
// This file only edits: shot order, camera moves over the UI, captions on Liam's words, a few hero words, the end card.
import React from 'react';
import { AbsoluteFill, Audio, OffthreadVideo, Sequence, continueRender, delayRender, staticFile, useCurrentFrame } from 'remotion';
import lines from '../../audio-src/out/lines_reel.json';
import script from '../data/voScript.json';

const FPS = 60;
const C = { ink: '#06060a', a: '#3bf0ff', b: '#ff3bd0', txt: '#f2f0fa' };
const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const inv = (a: number, b: number, x: number) => clamp((x - a) / (b - a));
const dec = (u: number) => 1 - (1 - clamp(u)) ** 4;                       // land decelerates
const io = (u: number) => { u = clamp(u); return u < 0.5 ? 4 * u * u * u : 1 - (-2 * u + 2) ** 3 / 2; };

let fontReq: number | null = null;
if (typeof document !== 'undefined' && fontReq === null) {
  fontReq = delayRender('inter');
  const f = new FontFace('Inter', `url(${staticFile('fonts/InterVariable.woff2')})`, { weight: '100 900' });
  f.load().then((ff) => { (document.fonts as unknown as { add: (x: FontFace) => void }).add(ff); continueRender(fontReq!); }).catch(() => continueRender(fontReq!));
}

// ---------------------------------------------------------------- the shot list (reel seconds), matching the capture
const DB = (k: number) => 1.52 + 1.92 * k;
const SHOTS: [string, number, number][] = [
  ['office', 0, DB(2)], ['ui_face', DB(2), DB(4)], ['solo1', DB(4), DB(5)], ['solo2', DB(5), DB(6)], ['solo3', DB(6), DB(7)],
  // outfits + worlds ride Electro Cabello's downbeats (the song switches at every mode change: web/src/reel/reel.ts SONGS)
  ['outfitA', 14.96, 17.01], ['outfitB', 17.01, 19.06], ['chrome', 19.06, 21.11], ['galaxy', 21.11, 23.16], ['bloom', 23.16, 24.56],
  ['duo', DB(12), DB(14)], ['battle', DB(14), DB(17)], ['ui_roster', DB(17), DB(18)], ['crew', DB(18), DB(23)],
  ...(['tunnel', 'galaxy', 'chrome', 'city', 'bloom', 'stage', 'dream', 'office'].map((w, k) => [`m_${w}`, DB(23) + k * 0.96, DB(23) + (k + 1) * 0.96] as [string, number, number])),
  ['m_end', DB(23) + 7.68, DB(28)], ['ui_app', DB(28), DB(32)], ['finale', DB(32), 70],
];

type Key = { t: number; s: number; x: number; y: number };
const camAt = (keys: Key[], t: number) => {
  let k = 0; while (k < keys.length - 2 && t > keys[k + 1].t) k++;
  const a = keys[k], b = keys[Math.min(k + 1, keys.length - 1)], u = io(inv(a.t, b.t, t));
  return { s: a.s + (b.s - a.s) * u, x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u };
};
/** a UI insert: the 1920x1080 capture under a moving camera (scale + focus point in UI pixels), on a dark ground */
const UIShot: React.FC<{ id: string; keys: Key[]; dur: number }> = ({ id, keys, dur }) => {
  const { s, x, y } = camAt(keys, useCurrentFrame() / FPS);
  void dur;
  return (
    <AbsoluteFill style={{ background: '#05050a', overflow: 'hidden' }}>
      <OffthreadVideo src={staticFile(`clips/${id}.mp4`)} muted style={{ position: 'absolute', left: 540 - x * s, top: 960 - y * s, width: 1920 * s, height: 1080 * s }} />
    </AbsoluteFill>
  );
};

/** the cursor in the face studio: enters oversize, parks, presses (2-3 f squash), the target answers a frame later */
const Cursor: React.FC<{ path: { t: number; x: number; y: number }[]; press: number; keys: Key[] }> = ({ path, press, keys }) => {
  const t = useCurrentFrame() / FPS, cam = camAt(keys, t);
  let k = 0; while (k < path.length - 2 && t > path[k + 1].t) k++;
  const a = path[k], b = path[k + 1] ?? a, u = dec(inv(a.t, b.t, t));
  const px = a.x + (b.x - a.x) * u, py = a.y + (b.y - a.y) * u;
  const sq = t > press && t < press + 0.05 ? 0.82 : 1, arrive = 1 + 1.6 * (1 - dec(inv(path[0].t, path[0].t + 0.35, t)));
  if (t < path[0].t || t > press + 0.35) return null;
  return (
    <svg width={64} height={64} viewBox="0 0 24 24" style={{ position: 'absolute', left: 540 + (px - cam.x) * cam.s, top: 960 + (py - cam.y) * cam.s, transform: `scale(${arrive * sq})`, transformOrigin: '0 0' }}>
      <path d="M4 2l15 9-6.5 1.6L9.4 19z" fill="#fff" stroke="#111" strokeWidth={1.4} strokeLinejoin="round" />
    </svg>
  );
};

// ---------------------------------------------------------------- captions on Liam's words
interface W { w: string; t0: number; t1: number }
const AT = Object.fromEntries((script as { reel: { id: string; at: number }[] }).reel.map((l) => [l.id, l.at]));
const WORDS: (W & { line: string })[] = (lines as { lines: { id: string; phrases: { words: W[] }[] }[] }).lines.flatMap((l) => l.phrases.flatMap((p) => p.words.map((w) => ({ ...w, line: l.id, t0: w.t0 + AT[l.id], t1: w.t1 + AT[l.id] }))));
const GROUPS: (W & { line: string })[][] = [];
for (const w of WORDS) { const g = GROUPS[GROUPS.length - 1]; if (g && g[0].line === w.line && g.length < 5 && !/[,.?!…:]$/.test(g[g.length - 1].w)) g.push(w); else GROUPS.push([w]); }
const KEY = /^(DANCE|team|photo|selfie|beat|Outfit|world|duo|battle|dance|worlds|music|crew|AfterCode|setup)/i;
const Captions: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  const i = GROUPS.findIndex((g, k) => t >= g[0].t0 - 0.06 && t < Math.min(g[g.length - 1].t1 + 0.35, (GROUPS[k + 1]?.[0].t0 ?? 1e9) - 0.04));
  if (i < 0) return null;
  const g = GROUPS[i];
  return (
    <div style={{ position: 'absolute', left: 90, right: 90, top: 1410, textAlign: 'center', fontFamily: 'Inter', fontWeight: 800, fontSize: 60, lineHeight: 1.12, letterSpacing: '-0.01em',
      color: C.txt, textShadow: '0 4px 24px rgba(0,0,0,0.75), 0 0 2px rgba(0,0,0,0.9)' }}>
      {g.map((w, k) => {
        const on = t >= w.t0 - 0.03, p = dec(inv(w.t0 - 0.03, w.t0 + 0.12, t));
        return <React.Fragment key={k}><span style={{ display: 'inline-block', opacity: on ? 1 : 0.38, color: on && KEY.test(w.w) ? C.a : C.txt, transform: `translateY(${(1 - p) * 10}px)` }}>{w.w}</span>{k < g.length - 1 ? ' ' : ''}</React.Fragment>;
      })}
    </div>
  );
};

/** a hero word: arrives from oversize (decelerating), holds, leaves by shrinking */
const Hero: React.FC<{ text: React.ReactNode; t0: number; t1: number; y?: number; size?: number; color?: string }> = ({ text, t0, t1, y = 820, size = 170, color = C.txt }) => {
  const t = useCurrentFrame() / FPS;
  if (t < t0 || t > t1) return null;
  const inn = dec(inv(t0, t0 + 0.2, t)), out = inv(t1 - 0.14, t1, t) ** 2;
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: y, textAlign: 'center', fontFamily: 'Inter', fontWeight: 900, fontSize: size, letterSpacing: '-0.035em', lineHeight: 0.92, color,
      transform: `scale(${(2.6 - 1.6 * inn) * (1 - 0.25 * out)})`, opacity: 1 - out, textShadow: '0 10px 50px rgba(0,0,0,0.55)' }}>{text}</div>
  );
};
const Flash: React.FC<{ at: number; len?: number; color?: string; max?: number }> = ({ at, len = 0.1, color = '#fff', max = 0.55 }) => {
  const t = useCurrentFrame() / FPS; if (t < at || t > at + len) return null;
  return <AbsoluteFill style={{ background: color, opacity: max * (1 - (t - at) / len) }} />;
};

const EndCard: React.FC = () => {
  const t = useCurrentFrame() / FPS, t0 = 64.88;
  if (t < t0) return null;
  const w = dec(inv(t0, t0 + 0.25, t)), sub = dec(inv(65.55, 65.85, t)), cta = dec(inv(67.2, 67.45, t));
  const shrink = 1 - 0.12 * io(inv(68.72, 70, t));
  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, rgba(6,6,10,${0.15 + 0.35 * w}) 0%, rgba(6,6,10,${0.55 * w}) 45%, rgba(6,6,10,${0.15 + 0.3 * w}) 100%)` }}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 760, textAlign: 'center', transform: `scale(${(3.2 - 2.2 * w) * shrink})` }}>
        <div style={{ fontFamily: 'Inter', fontWeight: 900, fontSize: 150, letterSpacing: '0.04em', color: C.txt }}>AFTER<span style={{ color: C.a }}>CODE</span></div>
      </div>
      <div style={{ position: 'absolute', left: 80, right: 80, top: 960, textAlign: 'center', fontFamily: 'Inter', fontWeight: 600, fontSize: 46, color: C.txt, opacity: sub, transform: `translateY(${(1 - sub) * 26}px)` }}>
        When coding stops, the world starts dancing.
      </div>
      <div style={{ position: 'absolute', left: 80, right: 80, top: 1090, textAlign: 'center', fontFamily: 'Inter', fontWeight: 800, fontSize: 54, color: C.a, opacity: cta, transform: `translateY(${(1 - cta) * 26}px)` }}>
        Would you use this on your setup?
      </div>
    </AbsoluteFill>
  );
};

export const AfterReel: React.FC = () => (
  <AbsoluteFill style={{ background: C.ink }}>
    {SHOTS.map(([id, r0, r1]) => {
      const from = Math.round(r0 * FPS), dur = Math.round(r1 * FPS) - from;
      let body: React.ReactNode = <OffthreadVideo src={staticFile(`clips/${id}.mp4`)} muted style={{ width: 1080, height: 1920 }} />;
      if (id === 'ui_face') { const keys = [{ t: 0, s: 1.55, x: 790, y: 545 }, { t: 0.5, s: 1.58, x: 800, y: 545 }, { t: 1.4, s: 1.7, x: 1020, y: 550 }, { t: 2.5, s: 1.9, x: 1250, y: 555 }, { t: 3.84, s: 2.1, x: 1290, y: 560 }];
        body = <><UIShot id={id} dur={dur} keys={keys} />
        <Cursor path={[{ t: 0.9, x: 1440, y: 780 }, { t: 1.6, x: 1310, y: 600 }, { t: 2.7, x: 1300, y: 585 }]} press={2.85} keys={keys} /></>; }
      // the dancer panel (UI x 1600-1900): rows 01-05 fill in one by one
      if (id === 'ui_roster') body = <UIShot id={id} dur={dur} keys={[{ t: 0, s: 3.0, x: 1740, y: 330 }, { t: 1.92, s: 3.3, x: 1740, y: 300 }]} />;
      // whole app -> music library -> world bar (Particle Galaxy picked at 3.84) -> dancer panel
      if (id === 'ui_app') body = <UIShot id={id} dur={dur} keys={[{ t: 0, s: 0.56, x: 960, y: 540 }, { t: 0.7, s: 0.56, x: 960, y: 540 }, { t: 1.3, s: 2.1, x: 270, y: 460 },
        { t: 2.5, s: 2.1, x: 270, y: 480 }, { t: 3.1, s: 1.55, x: 440, y: 900 }, { t: 4.9, s: 1.55, x: 470, y: 900 }, { t: 5.5, s: 2.0, x: 1650, y: 480 }, { t: 7.68, s: 2.1, x: 1650, y: 470 }]} />;
      return <Sequence key={id} from={from} durationInFrames={dur}>{body}</Sequence>;
    })}
    <Hero text="DANCE" t0={3.44} t1={5.2} y={760} size={210} color={C.a} />
    <Hero text={<>solo <span style={{ color: C.a }}>→</span> duo</>} t0={DB(12)} t1={DB(13)} y={300} size={140} />
    <Hero text="BATTLE" t0={DB(14)} t1={DB(15)} y={300} size={170} color={C.b} />
    <Hero text="Poori team." t0={DB(18)} t1={DB(19) - 0.02} y={330} size={130} />
    <Hero text={<>Ek dance<br />floor.</>} t0={DB(19)} t1={DB(20)} y={300} size={150} color={C.a} />
    <Flash at={DB(19)} len={0.12} max={0.6} />
    {[3.44, 14.96, 24.56, 28.4, 62.96].map((t) => <Flash key={t} at={t} len={0.09} max={0.3} />)}
    <Flash at={68.72} len={0.12} max={0.45} color={C.a} />
    <EndCard />
    <Captions />
    <Audio src={staticFile('audio/mix_reel.wav')} />
  </AbsoluteFill>
);
