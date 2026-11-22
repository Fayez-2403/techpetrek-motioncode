// BREAKDOWN X-RAY: a full teardown of posts-design/mcp's breakdown kit, run for real on our own 18-repos reel.
// Every image is the kit's real output from our run (public/kit: render stills, prep/stems.png, prep/shots.jpg) or
// a real capture (public/page: the kit's GitHub page); every number is what our prep printed (29 boundaries, 120.0 BPM,
// 6 stems, 152 words). Liam narrates. Pure function of the frame.
import React from 'react';
import { AbsoluteFill, Audio, Img, staticFile, useCurrentFrame } from 'remotion';
import FACTS from '../config/prep_facts.json';
import { E, T, clamp, lerp, lin, sceneAt, sec, spring, wordT } from '../reel/timeline';

export const TOTAL = Math.round(T.duration * 60);
const F = { d: 'Archivo, Inter, sans-serif', u: 'Inter, sans-serif', m: '"JetBrains Mono", monospace' };
const K = { gold: '#ffcf5a', ink: '#F3F1EC', mute: 'rgba(243,241,236,.6)', green: '#58e0a0', bg: '#07080d', line: 'rgba(255,255,255,.14)' };
const kit = (s: number) => staticFile(`kit/breakdown-${s}.png`);
const STILLS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

const Title: React.FC<{ t: number; t0: number; step?: string; text: string; sub?: string }> = ({ t, t0, step, text, sub }) => {
  const a = t - t0, s = spring(a - 0.05, 16, 0.42);
  return (
    <div style={{ position: 'absolute', left: 50, right: 50, top: 160 }}>
      {step ? <div style={{ fontFamily: F.m, fontWeight: 800, fontSize: 30, color: K.gold, opacity: clamp(a * 5) }}>{step}</div> : null}
      <div style={{ transformOrigin: '0 50%', transform: `scale(${1.7 - 0.7 * s})`, fontFamily: F.d, fontWeight: 900, fontStretch: '72%', fontSize: 104, lineHeight: 0.95, color: '#fff', textShadow: '0 7px 0 #000' }}>{text}</div>
      {sub ? <div style={{ marginTop: 12, fontFamily: F.u, fontWeight: 700, fontSize: 30, color: K.mute, opacity: clamp((a - 0.25) * 4) }}>{sub}</div> : null}
    </div>
  );
};
const Term: React.FC<{ t: number; t0: number; lines: string[]; top: number }> = ({ t, t0, lines, top }) => {
  const a = t - t0, all = lines.join('\n'), n = Math.round(all.length * E.out(lin(a, 0.2, 1.4)));
  return <div style={{ position: 'absolute', left: 50, right: 50, top, padding: '22px 26px', borderRadius: 18, background: '#000', border: `1px solid ${K.line}`, fontFamily: F.m, fontSize: 28, lineHeight: 1.5, color: K.green, whiteSpace: 'pre-wrap' }}>{all.slice(0, n)}<span style={{ opacity: Math.floor(t * 3) % 2 }}>█</span></div>;
};
const Card: React.FC<{ src: string; top: number; h?: number; a: number; fit?: 'cover' | 'contain'; pos?: string; zoom?: [number, number] }> = ({ src, top, h = 900, a, fit = 'contain', pos = '50% 50%', zoom = [1, 1.04] }) => {
  const u = E.out(lin(a, 0, 0.3));
  return <div style={{ position: 'absolute', left: 40, right: 40, top, height: h, borderRadius: 22, overflow: 'hidden', border: `1px solid ${K.line}`, background: '#000', opacity: u, transform: `translateY(${(1 - u) * 50}px)` }}>
    <Img src={src} style={{ width: '100%', height: '100%', objectFit: fit, objectPosition: pos, transform: `scale(${lerp(zoom[0], zoom[1], clamp(a / 4))})` }} /></div>;
};

function Scene({ t }: { t: number }) {
  const s = sceneAt(t), a = t - s.t0;
  switch (s.id) {
    case 'hook': return <>
      <Img src={kit(31)} style={{ position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, transform: `scale(${1.06 - 0.06 * E.inout(clamp(a / 4))})`, transformOrigin: '50% 55%' }} />
      <AbsoluteFill style={{ background: 'linear-gradient(180deg, rgba(0,0,0,.75) 0%, transparent 26%)' }} />
      <div style={{ position: 'absolute', left: 50, right: 50, top: 70, fontFamily: F.d, fontWeight: 900, fontStretch: '72%', fontSize: 96, color: '#fff', textShadow: '0 7px 0 #000', transform: `scale(${1.6 - 0.6 * spring(a - 0.05, 16, 0.42)})`, transformOrigin: '0 50%' }}>FULL TEARDOWN</div></>;
    case 'skill': return <>
      <Title t={t} t0={s.t0} text="posts.design breakdown" sub="free · MIT · github.com/posts-design/mcp" />
      <Card src={staticFile('page/repo_tree.png')} top={470} h={620} a={a} fit="cover" pos="50% 0%" />
      <Term t={t} t0={s.t0} top={1130} lines={['/plugin marketplace add posts-design/mcp', '/plugin install posts-design@posts-design']} /></>;
    case 'film': return <>
      <Title t={t} t0={s.t0} step="STEP 1" text="GIVE IT A FILM" sub="we gave it our own 18-repos reel" />
      <Card src={kit(3)} top={470} h={640} a={a} fit="cover" pos="50% 15%" />
      <Term t={t} t0={s.t0} top={1150} lines={['$ node prep.mjs film.mp4 work/ --stems elevenlabs', 'separating stems with ElevenLabs…']} /></>;
    case 'stems': {
      const rows = ['bass', 'drums', 'guitar (inaudible)', 'other', 'piano (inaudible)', 'vocals'], rev = E.inout(lin(a, 0.2, 2.6));
      return <>
        <Title t={t} t0={s.t0} step="STEP 2" text="6 STEMS" sub="ElevenLabs stem separation · our real prep/stems.png" />
        <div style={{ position: 'absolute', left: 40, right: 40, top: 470, height: 690, borderRadius: 22, overflow: 'hidden', border: `1px solid ${K.line}`, background: '#000' }}>
          <Img src={staticFile('kit/stems.png')} style={{ width: '100%', height: '100%', objectFit: 'fill', clipPath: `inset(0 ${100 - rev * 100}% 0 0)` }} />
        </div>
        <div style={{ position: 'absolute', left: 50, right: 50, top: 1180, display: 'flex', flexWrap: 'wrap', gap: 10 }}>{rows.map((r, i) => <span key={r} style={{ padding: '8px 14px', borderRadius: 10, background: r.includes('inaudible') ? 'rgba(255,255,255,.06)' : 'rgba(255,207,90,.16)', border: `1px solid ${r.includes('inaudible') ? K.line : K.gold}`, fontFamily: F.m, fontSize: 26, color: r.includes('inaudible') ? K.mute : K.ink, opacity: clamp((a - 0.3 - i * 0.15) * 4) }}>{r}</span>)}</div></>;
    }
    case 'words': {
      const W = (FACTS as { roman_words: { t: number; w: string }[]; words_total: number }).roman_words;
      return <>
        <Title t={t} t0={s.t0} step="STEP 3" text={`${(FACTS as { words_total: number }).words_total} WORDS`} sub="ElevenLabs Scribe on the vocal stem · prep/words.txt" />
        <div style={{ position: 'absolute', left: 40, right: 40, top: 470, height: 760, overflow: 'hidden', borderRadius: 22, background: '#0c0d12', border: `1px solid ${K.line}`, padding: '20px 28px', boxSizing: 'border-box' }}>
          <div style={{ transform: `translateY(${-a * 150}px)`, display: 'grid', gridTemplateColumns: '120px 1fr', rowGap: 6, fontFamily: F.m, fontSize: 32 }}>
            {W.map((x, i) => <React.Fragment key={i}><span style={{ color: K.gold }}>{x.t.toFixed(2)}</span><span style={{ color: K.ink }}>{x.w}</span></React.Fragment>)}</div>
        </div></>;
    }
    case 'cuts': {
      const n29 = Math.round(29 * E.out(lin(a, 0.2, 1.2))), bpm = wordT('cuts', /^tempo/i, 2) - s.t0;
      return <>
        <Title t={t} t0={s.t0} step="STEP 4" text="CUTS + TEMPO" sub="prep/shots.jpg · measured, not guessed" />
        <Card src={staticFile('kit/shots.jpg')} top={470} h={700} a={a} fit="cover" pos="50% 0%" zoom={[1, 1.1]} />
        <div style={{ position: 'absolute', left: 50, right: 50, top: 1195, display: 'flex', gap: 16 }}>
          <span style={{ flex: 1, textAlign: 'center', padding: '16px 0', borderRadius: 16, background: '#111', border: `2px solid ${K.gold}`, fontFamily: F.d, fontWeight: 900, fontSize: 64, color: K.gold }}>{n29} CUTS</span>
          <span style={{ flex: 1, textAlign: 'center', padding: '16px 0', borderRadius: 16, background: '#111', border: `2px solid ${K.green}`, fontFamily: F.d, fontWeight: 900, fontSize: 64, color: K.green, opacity: clamp((a - bpm) * 4) }}>120.0 BPM ✓</span>
        </div></>;
    }
    case 'naming': {
      const k = E.inout(lin(a, 0.5, 1.2));
      const rows: [string, string][] = [['"Shot 1"', '"AI-slop ball"'], ['"Shot 2"', '"reanimate"'], ['"Name by ear"', '"Metronome (slop)"'], ['"Name by ear"', '"Kick + hats"'], ['"Name by ear"', '"Bass line"'], ['"Act title"', '"Copy + timing"']];
      return <>
        <Title t={t} t0={s.t0} step="STEP 5" text="NAME EVERYTHING" sub="the kit drafts it · you name it · breakdown.json" />
        <div style={{ position: 'absolute', left: 40, right: 40, top: 470, padding: '26px 30px', borderRadius: 22, background: '#0c0d12', border: `1px solid ${K.line}`, fontFamily: F.m, fontSize: 34, lineHeight: 1.75 }}>
          {rows.map(([a0, b0], i) => { const kk = clamp(k * 1.4 - i * 0.08); return <div key={i}><span style={{ color: K.mute }}>{['shots', 'shots', 'drums', 'drums', 'bass', 'acts'][i]}: </span><span style={{ color: kk > 0.5 ? K.gold : '#ff7b7b' }}>{kk > 0.5 ? b0 : a0}</span></div>; })}
        </div></>;
    }
    case 'render': return <>
      <Title t={t} t0={s.t0} step="STEP 6" text="RENDER" sub="Node + sharp + FFmpeg · no browser" />
      <Term t={t} t0={s.t0} top={470} lines={['$ node render.mjs work/breakdown.json', '→ work/breakdown.mp4']} />
      <Card src={kit(14)} top={680} h={760} a={a - 0.6} fit="cover" pos="50% 70%" /></>;
    case 'payoff': {
      // real time: film second 1 + a, crossfading between the kit's stills (one per film second), in sync with the stems we hear
      const ft = Math.min(15, 1 + a), i0 = Math.max(1, Math.min(15, Math.floor(ft))), i1 = Math.min(15, i0 + 1), mixK = clamp((ft - i0) * 2.5 - 1.5);
      return <>
        <Img src={kit(i0)} style={{ position: 'absolute', left: 0, top: 0, width: 1080, height: 1920 }} />
        <Img src={kit(i1)} style={{ position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, opacity: mixK }} />
        <div style={{ position: 'absolute', right: 40, top: 120, padding: '8px 16px', borderRadius: 10, background: K.gold, color: '#111', fontFamily: F.m, fontWeight: 800, fontSize: 30 }}>0:{String(Math.floor(ft)).padStart(2, '0')} of our reel</div></>;
    }
    case 'full': return <Img src={kit(50)} style={{ position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, transform: `scale(${1.04 - 0.04 * clamp(a / 3)})`, transformOrigin: '50% 55%' }} />;
    default: {
      const x = spring(a - 0.1, 12, 0.45), cm = wordT('cta', /^comment/i, 1.8) - s.t0, y = spring(a - cm + 0.1, 13, 0.4);
      return <>
        <Img src={kit(50)} style={{ position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, opacity: 0.25 }} />
        <div style={{ position: 'absolute', left: 40, right: 40, top: 520, textAlign: 'center' }}>
          <div style={{ transform: `scale(${1.6 - 0.6 * x})`, opacity: clamp(x * 2), fontFamily: F.d, fontWeight: 900, fontStretch: '74%', fontSize: 104, lineHeight: 0.95, color: '#fff', textShadow: '0 7px 0 #000' }}>FREE ON GITHUB</div>
          <div style={{ marginTop: 20, fontFamily: F.m, fontSize: 30, color: K.ink }}>github.com/posts-design/mcp</div>
          <div style={{ opacity: clamp(y), transform: `scale(${0.7 + 0.3 * y})`, display: 'inline-block', marginTop: 34, padding: '22px 52px', borderRadius: 999, background: K.gold, color: '#111', fontFamily: F.d, fontWeight: 900, fontStretch: '82%', fontSize: 70 }}>COMMENT &ldquo;BREAKDOWN&rdquo;</div>
        </div></>;
    }
  }
}

const WORDS = T.lines.flatMap((l) => l.words.map((x) => ({ ...x, line: l.id })));
const KEY = /^(x-ray|claude|free|skill|elevenlabs|stems|scribe|152|29|120|bpm|node|ffmpeg|metronome|orchestra|breakdown\.?|github)/i;
function Captions({ t }: { t: number }) {
  const cur = WORDS.findIndex((x) => t >= x.t0 - 0.05 && t < x.t1 + 0.3); if (cur < 0) return null;
  const x = WORDS[cur], line = WORDS.filter((y) => y.line === x.line), k = line.indexOf(x), burst = line.slice(Math.floor(k / 3) * 3, Math.floor(k / 3) * 3 + 3);
  const s = sceneAt(t), top = s.id === 'hook' ? 262 : ['payoff', 'full'].includes(s.id) ? 214 : 1460;
  return <div style={{ position: 'absolute', left: 40, right: 40, top, textAlign: 'center' }}>
    {burst.map((y, i) => { const on = t >= y.t0 - 0.03, now = on && t < y.t1 + 0.05, bare = y.w.replace(/[—…]/g, '');
      return <span key={i} style={{ display: 'inline-block', margin: '0 10px', fontFamily: F.d, fontWeight: 900, fontStretch: '80%', fontSize: 76, color: !on ? 'rgba(243,241,236,.38)' : KEY.test(bare) ? K.gold : K.ink, transform: `scale(${now ? 1.08 : 1})`, textShadow: '0 5px 0 #000, 0 0 26px rgba(0,0,0,.8)' }}>{bare}</span>; })}
  </div>;
}

export const Reel: React.FC = () => {
  const f = useCurrentFrame(), t = f / 60, s = sceneAt(t), cut = t - s.t0, flash = s.t0 > 0 && cut < 0.18 ? 0.08 * (1 - cut / 0.18) ** 2 : 0;
  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 40%, #12131a 0%, ${K.bg} 70%)` }}>
      <Scene t={t} />
      {s.id !== 'hook' && s.id !== 'payoff' && s.id !== 'full' ? <AbsoluteFill style={{ background: 'linear-gradient(180deg, transparent 72%, rgba(0,0,0,.6) 86%)', pointerEvents: 'none' }} /> : null}
      <Captions t={t} />
      <AbsoluteFill style={{ background: '#fff', opacity: flash }} />
      {['hook', 'payoff', 'full'].includes(s.id) ? null : <div style={{ position: 'absolute', left: 40, right: 40, bottom: 318, textAlign: 'center', fontFamily: F.m, fontSize: 20, color: 'rgba(243,241,236,.5)' }}>kit: posts-design/mcp (MIT) · run by us on our own reel · @baseddesigner</div>}
      {t >= sec('cta').t0 ? <Img src={staticFile('brand/techpe-trek.jpg')} style={{ position: 'absolute', right: 50, bottom: 370, width: 110, height: 110, borderRadius: 18, opacity: 0.8 * clamp((t - sec('cta').t0 - 0.4) / 0.4) }} /> : null}
      <Audio src={staticFile('audio/mix.wav')} />
    </AbsoluteFill>
  );
};
