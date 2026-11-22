// HOW TO CLIP GTA 6 WITH CLAUDE: the method from Rollandex's video (credited), demonstrated with our own real run on
// IShowSpeed's live: the real loudness curve of 1.9 h (audio/candidates.json), real transcript lines, our real 0-10
// scores (docs/clips.json), the real crop boxes on a real frame, and the finished clip playing with its own sound.
import React from 'react';
import { AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from 'remotion';
import CAND from '../../audio/candidates.json';
import CLIPS from '../../docs/clips.json';
import TIMING from '../../SCENE_TIMINGS.json';

const T = TIMING as unknown as { duration: number; sections: { id: string; t0: number; t1: number }[]; lines: { id: string; words: { w: string; t0: number; t1: number }[] }[] };
export const TEACH_FRAMES = Math.round(T.duration * 30);
const sec = (id: string) => T.sections.find((s) => s.id === id)!;
const at = (t: number) => T.sections.find((s) => t >= s.t0 && t < s.t1) ?? T.sections[T.sections.length - 1];
const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lin = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
const eo = (x: number) => 1 - (1 - clamp(x)) ** 4, eio = (x: number) => { x = clamp(x); return x < 0.5 ? 16 * x ** 5 : 1 - (-2 * x + 2) ** 5 / 2; };
const sp = (t: number) => (t <= 0 ? 0 : 1 - Math.exp(-0.42 * 16 * t) * Math.cos(16 * 0.91 * t));
const F = { d: 'Archivo, Inter, sans-serif', u: 'Inter, sans-serif', m: '"JetBrains Mono", monospace' };
const K = { red: '#ff2d55', yel: '#ffe600', ink: '#ffffff', mute: 'rgba(255,255,255,.62)', green: '#3ddc84', bg: '#0a0a0c' };
const C = CAND as unknown as { seconds: number; loud_db: number[]; candidates: { stamp: string; peak_s: number; excess_db: number; text: string }[] };
const CL = (CLIPS as unknown as { clips: { id: string; score: number; hook: string; peak: number }[] }).clips;
const stamp = (s: number) => `${Math.floor(s / 3600)}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

const Title: React.FC<{ t: number; t0: number; text: string; sub?: string; col?: string; top?: number }> = ({ t, t0, text, sub, col = K.ink, top = 170 }) => {
  const a = t - t0, s = sp(a - 0.05);
  return (
    <div style={{ position: 'absolute', left: 50, right: 50, top, textAlign: 'center' }}>
      <div style={{ display: 'inline-block', transform: `scale(${1.8 - 0.8 * s})`, fontFamily: F.d, fontWeight: 900, fontStretch: '76%', fontSize: 104, lineHeight: 0.95, color: col, textShadow: '0 7px 0 #000' }}>{text}</div>
      {sub ? <div style={{ marginTop: 12, fontFamily: F.u, fontWeight: 700, fontSize: 32, color: K.mute, opacity: clamp((a - 0.25) / 0.2) }}>{sub}</div> : null}
    </div>
  );
};
const Phone: React.FC<{ src: string; x: number; y: number; w: number; from: number; vol?: number; start?: number }> = ({ src, x, y, w, from, vol = 0, start = 0 }) => (
  <div style={{ position: 'absolute', left: x, top: y, width: w, height: w * 16 / 9, borderRadius: w * 0.07, overflow: 'hidden', border: '6px solid #1d1d22', boxShadow: '0 30px 80px rgba(0,0,0,.6)', background: '#000' }}>
    <Sequence from={from} layout="none"><OffthreadVideo src={src} startFrom={start} muted={vol === 0} volume={vol} style={{ width: '100%', height: '100%' }} /></Sequence>
  </div>
);

function Loud({ t }: { t: number }) {
  const s = sec('loud'), a = t - s.t0, draw = eio(lin(a, 0.1, 1.6)), W = 980, H = 520, n = C.loud_db.length, step = Math.ceil(n / 490);
  const pts: string[] = [];
  for (let i = 0; i < n * draw; i += step) { const v = Math.max(...C.loud_db.slice(i, i + step)); pts.push(`${(i / n) * W},${H - 40 - clamp((v + 6) / 26) * (H - 80)}`); }
  const top = [...C.candidates].sort((x, y) => y.excess_db - x.excess_db).slice(0, 5);
  return (
    <div style={{ position: 'absolute', left: 50, top: 520, width: W, height: H, borderRadius: 22, background: '#111116', border: '1px solid rgba(255,255,255,.12)', overflow: 'hidden' }}>
      <svg width={W} height={H}>
        <line x1={0} x2={W} y1={H - 40 - clamp(14 / 26) * (H - 80)} y2={H - 40 - clamp(14 / 26) * (H - 80)} stroke={K.red} strokeDasharray="8 8" strokeWidth={2} opacity={0.6} />
        <polyline points={pts.join(' ')} fill="none" stroke="#7a7a88" strokeWidth={2} />
        {top.map((c, i) => { const x = (c.peak_s / n) * W, y = H - 40 - clamp((c.excess_db + 6) / 26) * (H - 80), on = draw >= c.peak_s / n && a > 1.0 + i * 0.12;
          return on ? <g key={i}><circle cx={x} cy={y} r={14} fill="none" stroke={K.yel} strokeWidth={4} /><text x={Math.min(W - 150, x + 18)} y={y - 12} fill={K.yel} fontFamily="JetBrains Mono" fontSize={24} fontWeight={800}>+{c.excess_db} dB</text></g> : null; })}
      </svg>
      <div style={{ position: 'absolute', left: 18, bottom: 10, fontFamily: F.m, fontSize: 22, color: K.mute }}>loudness over normal · 1.9 h of IShowSpeed&apos;s live · 0:00 → {stamp(n)}</div>
    </div>
  );
}

export const Teach: React.FC = () => {
  const f = useCurrentFrame(), t = f / 30, s = at(t), a = t - s.t0;
  const words = T.lines.flatMap((l) => l.words), cur = words.findIndex((x) => t >= x.t0 - 0.05 && t < x.t1 + 0.3);
  const k0 = cur >= 0 ? Math.floor(cur / 3) * 3 : 0, line = T.lines.find((l) => l.words.includes(words[cur]));
  const burst = cur >= 0 && line ? line.words.slice(Math.floor(line.words.indexOf(words[cur]) / 3) * 3, Math.floor(line.words.indexOf(words[cur]) / 3) * 3 + 3) : [];
  const r = sec('result');
  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 40%, #1a1a22 0%, ${K.bg} 70%)`, color: K.ink }}>
      {s.id === 'hook' ? <>
        {['c2-tooyoung', 'c3-killchoice', 'c4-thisisit', 'c5-happyfamily'].map((c, i) => <Phone key={c} src={staticFile(`teach/gta6_${c}.mp4`)} x={60 + (i % 2) * 500} y={470 + Math.floor(i / 2) * 470 * 0 + (i > 1 ? 0 : 0)} w={460} from={0} start={30 * (2 + i)} />).slice(0, 2)}
        <Title t={t} t0={0} text="GTA 6 CLIPPING" sub="khelna nahi · clip karna" col={K.yel} />
      </> : null}
      {s.id === 'link' ? <>
        <Title t={t} t0={s.t0} text="1 · STREAM LINK" />
        <Img src={staticFile('teach/frame.jpg')} style={{ position: 'absolute', left: 50, top: 470, width: 980, borderRadius: 22, opacity: eo(lin(a, 0, 0.3)) }} />
        <div style={{ position: 'absolute', left: 50, right: 50, top: 1050, padding: '22px 26px', borderRadius: 18, background: '#000', border: '1px solid rgba(255,255,255,.15)', fontFamily: F.m, fontSize: 30, color: K.green }}>
          &gt; {'clip youtube.com/watch?v=OIeLbmyraRQ'.slice(0, Math.round(38 * eo(lin(a, 0.3, 1.4))))}<span style={{ opacity: Math.floor(t * 3) % 2 }}>█</span></div>
      </> : null}
      {s.id === 'transcript' ? <>
        <Title t={t} t0={s.t0} text="POORA TRANSCRIPT" sub="faster-whisper · har word, timestamp ke saath" />
        <div style={{ position: 'absolute', left: 50, right: 50, top: 470, height: 760, overflow: 'hidden', borderRadius: 22, background: '#0f0f14', border: '1px solid rgba(255,255,255,.12)', padding: 26, fontFamily: F.m, fontSize: 26, lineHeight: 1.55 }}>
          <div style={{ transform: `translateY(${-a * 120}px)` }}>{C.candidates.map((c) => <div key={c.stamp}><span style={{ color: K.yel }}>{c.stamp}</span> <span style={{ color: '#ddd' }}>{c.text.replace(/f\w*ck\w*|shit\w*/gi, (m) => m[0] + '***').slice(0, 90)}…</span></div>)}</div>
        </div>
      </> : null}
      {s.id === 'loud' ? <><Title t={t} t0={s.t0} text="2 · SABSE LOUD = VIRAL" col={K.yel} sub="loud seconds vs the stream's normal" /><Loud t={t} /></> : null}
      {s.id === 'score' ? <>
        <Title t={t} t0={s.t0} text="CLAUDE KA SCORE" sub="0 se 10 · transcript padh ke" />
        <div style={{ position: 'absolute', left: 60, right: 60, top: 480 }}>
          {CL.map((c, i) => { const u = eo(lin(a, 0.15 + i * 0.16, 0.45 + i * 0.16)); return (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 22, marginBottom: 18, padding: '18px 24px', borderRadius: 18, background: '#121218', border: `2px solid ${c.score >= 8 ? K.yel : 'rgba(255,255,255,.12)'}`, opacity: u, transform: `translateX(${(1 - u) * 90}px)` }}>
              <span style={{ fontFamily: F.d, fontWeight: 900, fontSize: 64, color: c.score >= 8 ? K.yel : K.ink, width: 110 }}>{c.score.toFixed(1)}</span>
              <span style={{ flex: 1, fontFamily: F.u, fontWeight: 800, fontSize: 30, lineHeight: 1.2 }}>{c.hook}</span>
              <span style={{ fontFamily: F.m, fontSize: 24, color: K.mute }}>{stamp(c.peak)}</span>
            </div>); })}
        </div>
      </> : null}
      {s.id === 'layout' ? (() => {
        const u = eio(lin(a, 0.9, 2.0)), fw = 980, k = fw / 1280;
        const cam = { x: 50 + 0 * k, y: 470 + 306 * k, w: 258 * k, h: 162 * k }, game = { x: 50 + 300 * k, y: 470, w: 825 * k, h: 720 * k };
        const camT = { x: 300, y: 470, w: 480, h: 480 * 162 / 258 }, gameT = { x: 300, y: 470 + 480 * 162 / 258, w: 480, h: 853 - 480 * 162 / 258 };
        const L = (p: typeof cam, q: typeof camT) => ({ left: p.x + (q.x - p.x) * u, top: p.y + (q.y - p.y) * u, width: p.w + (q.w - p.w) * u, height: p.h + (q.h - p.h) * u });
        return <>
          <Title t={t} t0={s.t0} text="3 · FACECAM + GAMEPLAY" />
          <Img src={staticFile('teach/frame.jpg')} style={{ position: 'absolute', left: 50, top: 470, width: fw, borderRadius: 18, opacity: 1 - 0.85 * u }} />
          <div style={{ position: 'absolute', ...L(game, gameT), border: `5px solid ${K.yel}`, borderRadius: 10, overflow: 'hidden' }}><Img src={staticFile('teach/frame.jpg')} style={{ position: 'absolute', left: -300 * (gameT.w / 825) * u - 300 * k * (1 - u), top: 0, width: 1280 * (u * gameT.w / 825 + (1 - u) * k), opacity: u }} /></div>
          <div style={{ position: 'absolute', ...L(cam, camT), border: `5px solid ${K.red}`, borderRadius: 10, overflow: 'hidden' }}><Img src={staticFile('teach/frame.jpg')} style={{ position: 'absolute', left: 0, top: -306 * (u * camT.w / 258 + (1 - u) * k), width: 1280 * (u * camT.w / 258 + (1 - u) * k), opacity: u }} /></div>
          <div style={{ position: 'absolute', left: 50, right: 50, top: 1470, textAlign: 'center', fontFamily: F.m, fontSize: 26, color: K.mute, opacity: clamp((a - 2.1) * 3) }}>+ word-by-word captions + hook · Whisper · FFmpeg · Remotion</div>
        </>;
      })() : null}
      {s.id === 'result' ? <><Phone src={staticFile('teach/gta6_c2-tooyoung.mp4')} x={250} y={300} w={580} from={Math.round(r.t0 * 30)} vol={1} start={30 * 6} />
        <div style={{ position: 'absolute', left: 0, right: 0, top: 200, textAlign: 'center', fontFamily: F.d, fontWeight: 900, fontSize: 64, color: K.green }}>✓ READY TO POST</div></> : null}
      {s.id === 'live' ? <>
        <Title t={t} t0={s.t0} text="LIVE? HAR MINUTE" sub="1-minute pieces · last 15 min · post fast" />
        <div style={{ position: 'absolute', left: 60, right: 60, top: 560, display: 'flex', gap: 8 }}>{Array.from({ length: 15 }, (_, i) => { const on = i < Math.floor(a * 4.5) % 16; return <div key={i} style={{ flex: 1, height: 160, borderRadius: 10, background: on ? (i === Math.floor(a * 4.5) % 16 - 1 ? K.red : '#2a2a33') : '#16161b', border: '1px solid rgba(255,255,255,.1)' }} />; })}</div>
        <div style={{ position: 'absolute', left: 60, top: 760, fontFamily: F.m, fontSize: 30, color: K.red }}>● REC  1 min chunks → score → clip → post</div>
      </> : null}
      {s.id === 'money' ? <>
        <Title t={t} t0={s.t0} text="PAISA KAHAN SE?" col={K.green} />
        <div style={{ position: 'absolute', left: 60, right: 60, top: 560, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: F.d, fontWeight: 900, fontSize: 60 }}>
          {['CLIP', 'VIEWS', 'CAMPAIGN', 'PAYOUT'].map((x, i) => { const u = eo(lin(a, 0.2 + i * 0.3, 0.5 + i * 0.3)); return <React.Fragment key={x}><span style={{ opacity: u, color: i === 3 ? K.green : K.ink, fontSize: 48 }}>{x}</span>{i < 3 ? <span style={{ opacity: u, color: K.mute, fontSize: 48 }}>→</span> : null}</React.Fragment>; })}
        </div>
        <div style={{ position: 'absolute', left: 60, right: 60, top: 700, fontFamily: F.u, fontSize: 32, color: K.mute, textAlign: 'center' }}>clipping campaigns pay by views · rates differ per campaign</div>
      </> : null}
      {s.id === 'rules' ? <>
        <Title t={t} t0={s.t0} text="RULES PEHLE" col={K.yel} />
        <div style={{ position: 'absolute', left: 90, right: 90, top: 520, fontFamily: F.u, fontWeight: 800, fontSize: 44, lineHeight: 1.7 }}>
          {['✓ campaign that allows this creator', '✓ follow its posting rules', '✓ credit the streamer'].map((x, i) => <div key={x} style={{ opacity: eo(lin(a, 0.2 + i * 0.35, 0.5 + i * 0.35)) }}>{x}</div>)}
        </div>
      </> : null}
      {s.id === 'cta' ? (() => { const x = sp(a - 0.1); return <div style={{ position: 'absolute', left: 50, right: 50, top: 560, textAlign: 'center' }}>
        <div style={{ transform: `scale(${1.6 - 0.6 * x})`, fontFamily: F.d, fontWeight: 900, fontStretch: '76%', fontSize: 108, lineHeight: 0.95, textShadow: '0 7px 0 #000' }}>POORA SETUP<br /><span style={{ color: K.yel }}>FREE</span></div>
        <div style={{ display: 'inline-block', marginTop: 34, padding: '22px 56px', borderRadius: 999, background: K.red, fontFamily: F.d, fontWeight: 900, fontSize: 72, opacity: clamp((a - 0.6) * 3) }}>COMMENT &ldquo;CLIP&rdquo;</div></div>; })() : null}
      {burst.length ? <div style={{ position: 'absolute', left: 40, right: 40, top: 1380, textAlign: 'center' }}>{burst.map((x, i) => <span key={i} style={{ display: 'inline-block', margin: '0 10px', fontFamily: F.d, fontWeight: 900, fontStretch: '82%', fontSize: 74, color: words[cur] === x ? K.yel : t >= x.t0 ? '#fff' : 'rgba(255,255,255,.4)', textShadow: '0 5px 0 #000' }}>{x.w.replace(/[—…]/g, '')}</span>)}</div> : null}
      <div style={{ position: 'absolute', left: 40, right: 40, bottom: 318, textAlign: 'center', fontFamily: F.m, fontSize: 20, color: 'rgba(255,255,255,.5)' }}>method: @imrollandex · demo: our own run on @IShowSpeed&apos;s live · GTA VI © Rockstar Games</div>
      <Audio src={staticFile('audio/teach_mix.wav')} />
    </AbsoluteFill>
  );
};
