// The 15 scenes of the Genie 4 reel. Cues are spoken words (at(line, word)); claims per FACTS.md. Real footage comes only
// from Google DeepMind's post (credited, its own "illustrative / sequences shortened" disclaimer kept in frame); every
// diagram is ours and tagged. Layout keeps text inside x 110..970, y 180..1400 (captions sit at 1440).
import React from 'react';
import { Img, staticFile, useCurrentFrame } from 'remotion';
import env from '../data/env.json';
import { clamp, invLerp, lerp } from '../lib/anim';
import { hash } from '../lib/rng';
import { Credit, FONT, FPS, Filmi, Icon, P, SAFE, Tag, arrive, depart, hit, ink, inout, land, seg, spring, useScene } from './kit';
import { Bleed, Ground, Screen } from './World';

const ui = (size: number, color: string = P.ink, weight = 800): React.CSSProperties => ({ fontFamily: FONT.ui, fontSize: size, color, fontWeight: weight, letterSpacing: '-0.01em' });
const poster = (size: number, color: string = P.ink, weight = 900, stretch = 78): React.CSSProperties => ({ fontFamily: FONT.poster, fontSize: size, color, fontWeight: weight, fontStretch: `${stretch}%`, textTransform: 'uppercase', lineHeight: 0.95 });
const abs = (x: number, y: number, w?: number): React.CSSProperties => ({ position: 'absolute', left: x, top: y, width: w });
const center = (y: number): React.CSSProperties => ({ position: 'absolute', left: 0, right: 0, top: y, display: 'flex', justifyContent: 'center', alignItems: 'center' });
const S = (id: string) => seg(id).from;

/** centred filmi title: words land on their cues, from oversize */
const Title: React.FC<{ l: number; y: number; lines: { t: string; at: number; face?: string; size?: number }[][]; out?: number }> = ({ l, y, lines, out = 1e9 }) => {
  const q = depart(l, out, 10);
  return (
    <div style={{ position: 'absolute', left: 60, right: 60, top: y, textAlign: 'center', zIndex: 20, opacity: 1 - q, transform: `translateY(${-q * 80}px)` }}>
      {lines.map((ln, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'center', gap: 22, marginTop: i ? 10 : 0 }}>
          {ln.map((w, k) => (l >= w.at - 1 ? <Filmi key={k} text={w.t} size={w.size ?? 120} face={w.face ?? P.magenta} p={arrive(l, w.at, 12)} /> : <span key={k} />))}
        </div>
      ))}
    </div>
  );
};

/** a poster badge card that slams in (the Deewar "property list") */
const Badge: React.FC<{ l: number; at: number; icon: string; text: string; x: number; y: number; tilt: number; out: number; children?: React.ReactNode }> = ({ l, at, icon, text, x, y, tilt, out, children }) => {
  if (l < at - 1) return null;
  const p = arrive(l, at, 10), q = depart(l, out, 10);
  return (
    <div style={{ ...abs(x + q * -900, y, 700), display: 'flex', alignItems: 'center', gap: 22, padding: '22px 30px', background: P.card, border: `5px solid ${P.ink}`, borderRadius: 22,
      boxShadow: ink(10), transform: `rotate(${tilt}deg) scale(${1.6 - 0.6 * p})`, opacity: clamp(p * 3), transformOrigin: '30% 50%' }}>
      <div style={{ width: 92, height: 92, borderRadius: 20, background: P.paper2, border: `4px solid ${P.ink}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
        {children ?? <Icon name={icon} size={60} color={P.ink} sw={2.2} />}
      </div>
      <div style={{ ...poster(70) }}>{text}</div>
    </div>
  );
};

// ================================================================== 1 hook: "Aaj mere paas game engine hai…"
export const Hook: React.FC = () => {
  const { l, at, dur } = useScene('hook');
  const g = at('h01', 'game'), d3 = at('h01', '3D'), mh = at('h01', 'mahino'), tp = at('h01', 'tumhare');
  const month = Math.floor(clamp((l - mh) / 40) * 11);
  return (
    <>
      <Ground cy={30} />
      <Title l={l} y={200} out={tp - 6} lines={[[{ t: 'AAJ', at: -12, face: P.saffron, size: 170 }, { t: 'MERE', at: -8, face: P.saffron, size: 170 }], [{ t: 'PAAS…', at: -3, face: P.card, size: 170 }]]} />
      {[[170, 640, -3], [210, 860, 2.5], [150, 1080, -2]].map(([x, y, r], i) => (
        <div key={i} style={{ ...abs(x, y, 700), height: 146, borderRadius: 22, border: `5px dashed ${P.ink3}`, background: 'rgba(255,253,247,0.45)', transform: `rotate(${r}deg)`, opacity: 1 - depart(l, tp - 6, 10),
          display: 'flex', alignItems: 'center', paddingLeft: 40, ...poster(58, P.ink3) }}>{i + 1}.</div>
      ))}
      <Badge l={l} at={g} icon="gear" text="Game engine" x={170} y={640} tilt={-3} out={tp - 4} />
      <Badge l={l} at={d3} icon="palette" text="3D artists" x={210} y={860} tilt={2.5} out={tp - 2} />
      <Badge l={l} at={mh} icon="calendar" text="Mahino ka kaam" x={150} y={1080} tilt={-2} out={tp}>
        <div style={{ ...poster(46, P.magenta), fontStretch: '62%' }}>{['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'][month]}</div>
      </Badge>
      <Title l={l} y={600} lines={[[{ t: 'TUMHARE', at: tp, face: P.card, size: 132 }], [{ t: 'PAAS', at: tp + 6, face: P.card, size: 132 }, { t: 'KYA?', at: at('h01', 'kya') - 2, face: P.magenta, size: 132 }]]} out={dur - 8} />
    </>
  );
};

// ================================================================== 2 hook2: "Mere paas… ek prompt hai!" -> the prompt opens into a world
const PROMPT = 'Immersive first-person POV… the knight rider tightening the reins, dragon and wings.';
export const Hook2: React.FC = () => {
  const { l, at, from } = useScene('hook2');
  const ek = at('h02', 'ek'), pr = at('h02', 'prompt'), aur = at('h02', 'Aur'), du = at('h02', 'duniya'), ch = at('h02', 'chal');
  const typed = PROMPT.slice(0, Math.floor(clamp((l - ek + 4) / (aur - ek - 6)) * PROMPT.length));
  const open = inout(invLerp(aur - 4, du + 4, l)), bleed = inout(invLerp(ch - 10, ch + 14, l));
  const card = depart(l, aur - 2, 14);
  const w = lerp(240, 860, open), shot = { x: 540 - w / 2, y: lerp(980, 600, open), w };
  return (
    <>
      <Ground cy={52} heat={1 - bleed} />
      <Title l={l} y={200} out={aur + 4} lines={[[{ t: 'MERE', at: at('h02', 'Mere') - 2, face: P.card, size: 120 }, { t: 'PAAS…', at: at('h02', 'paas') - 2, face: P.card, size: 120 }],
        [{ t: 'EK', at: ek - 2, face: P.magenta, size: 150 }, { t: 'PROMPT!', at: pr - 2, face: P.magenta, size: 150 }]]} />
      {l >= ek - 6 && card < 1 ? (
        <div style={{ ...abs(SAFE.x, 760, SAFE.w), padding: '26px 30px', borderRadius: 26, background: 'rgba(32,33,36,0.92)', boxShadow: ink(10), opacity: 1 - card,
          transform: `scale(${(1 - card) * (1.15 - 0.15 * arrive(l, ek - 6, 12))}) translateY(${card * 200}px)`, transformOrigin: '50% 100%' }}>
          <div style={{ ...ui(38, '#F1F3F4', 500), lineHeight: 1.3, minHeight: 150 }}>{typed}{Math.floor(l / 14) % 2 ? '' : '|'}</div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ width: 64, height: 64, borderRadius: 32, background: '#E8EAED', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${1 - 0.15 * hit(l, aur - 6, 6)})` }}><Icon name="send" size={34} color="#202124" sw={2.4} /></div>
          </div>
        </div>
      ) : null}
      {l >= aur - 4 ? (bleed < 0.98 ? <Screen clip="dragon" from={from} t0={11.2} shot={shot} frame={1 - bleed} zoom={1 + 0.8 * bleed} /> : <Bleed clip="dragon" from={from} t0={11.2} fx={0.5} />) : null}
      {l >= ek ? <Tag y={1330} text={l < aur ? 'Prompt excerpt from Google DeepMind\'s dragon demo' : 'Video: Google DeepMind · Genie 4 · real-time recording, sequence shortened'} /> : null}
    </>
  );
};

// ================================================================== 3 announce: GENIE 4, 27 Oct 2026, the Genie 3 vs 4 clip
export const Announce: React.FC = () => {
  const { l, at, from } = useScene('announce');
  const go = at('l03', 'Google'), ge = at('l03', 'Genie'), oc = at('l03', 'October'), st = spring(l, oc - 2, 15, 0.5);
  return (
    <>
      <Ground cy={26} />
      <div style={{ ...center(196), opacity: arrive(l, go - 2, 10) }}><div style={{ ...poster(58, P.ink, 900, 90), letterSpacing: '0.04em' }}>Google DeepMind ka</div></div>
      <Title l={l} y={270} lines={[[{ t: 'GENIE', at: ge - 2, face: P.magenta, size: 230 }, { t: '4', at: ge + 8, face: P.saffron, size: 230 }]]} />
      <Screen clip="compare" from={from} t0={3} shot={{ x: 110, y: 620 + (1 - arrive(l, 0, 18)) * 500, w: 860, tilt: -1.2 }} />
      <div style={{ ...center(1135), ...ui(26, P.ink2, 700) }}>DeepMind ka comparison: Genie 3 vs Genie 4</div>
      {l >= oc - 2 ? (
        <div style={{ position: 'absolute', right: 96, top: 520, width: 230, height: 230, borderRadius: 115, background: P.coral, border: `6px solid ${P.ink}`, boxShadow: ink(8),
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', transform: `rotate(-14deg) scale(${2.2 - 1.2 * st})`, zIndex: 25 }}>
          <div style={{ ...poster(76, P.card, 900, 70) }}>27 OCT</div><div style={{ ...poster(42, P.card, 800, 80) }}>2026</div>
        </div>
      ) : null}
      <Credit y={1190} text="Source: deepmind.google/blog · 27 Oct 2026 · video: Google DeepMind" />
    </>
  );
};

// ================================================================== 4 worldmodel: frames (and sound) generated live as you move
export const WorldModel: React.FC = () => {
  const { l, at } = useScene('worldmodel');
  const wo = at('l03', 'world'), f = useCurrentFrame();
  const shift = (l / FPS) * 260;                     // the strip runs left as time goes
  const now = 540;                                    // the playhead
  return (
    <>
      <Ground cy={46} heat={0.7} />
      <Title l={l} y={220} lines={[[{ t: 'REAL-TIME', at: at('l03', 'real-time') - 4, face: P.saffron, size: 110 }], [{ t: 'WORLD', at: wo - 2, face: P.magenta, size: 150 }, { t: 'MODEL', at: wo + 6, face: P.magenta, size: 150 }]]} />
      <div style={{ ...abs(0, 700, 1080), height: 300, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, width: 1080, height: 300, background: P.ink }} />
        {Array.from({ length: 9 }, (_, i) => {
          const x = i * 300 - (shift % 300) - 60, idx = Math.floor(shift / 300) + i, made = x + 280 < now + 40 || x < now;
          const paint = clamp((now + 300 - x) / 300);
          return (
            <div key={i} style={{ position: 'absolute', left: x, top: 34, width: 280, height: 232, borderRadius: 8, overflow: 'hidden', background: '#2A1B3A' }}>
              <Img src={staticFile(`frames/glass_${String(idx % 12).padStart(2, '0')}.jpg`)} style={{ width: '100%', height: '100%', objectFit: 'cover', clipPath: made ? undefined : `inset(0 ${100 - paint * 100}% 0 0)`, opacity: made ? 1 : 0.9 }} />
              {!made ? <div style={{ position: 'absolute', left: `${paint * 100}%`, top: 0, bottom: 0, width: 6, background: P.magenta, boxShadow: `0 0 18px ${P.magenta}` }} /> : null}
            </div>
          );
        })}
        {Array.from({ length: 26 }, (_, i) => <div key={i} style={{ position: 'absolute', left: i * 44 - (shift % 44), top: 8, width: 22, height: 16, borderRadius: 4, background: P.paper }} />)}
        {Array.from({ length: 26 }, (_, i) => <div key={'b' + i} style={{ position: 'absolute', left: i * 44 - (shift % 44), top: 276, width: 22, height: 16, borderRadius: 4, background: P.paper }} />)}
      </div>
      <div style={{ ...abs(now - 4, 660), width: 8, height: 380, background: P.magenta, borderRadius: 4, boxShadow: ink(4) }} />
      <div style={{ ...abs(now - 80, 610, 160), textAlign: 'center', ...poster(40, P.magenta) }}>Abhi</div>
      <div style={{ ...abs(150, 1060, 780), display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 70px)', gap: 8 }}>
          {['', 'W', '', 'A', 'S', 'D'].map((k, i) => (
            <div key={i} style={{ height: 70, borderRadius: 12, visibility: k ? 'visible' : 'hidden', background: k === 'W' && Math.floor(f / 18) % 2 === 0 ? P.magenta : P.card, border: `4px solid ${P.ink}`, display: 'flex', alignItems: 'center', justifyContent: 'center', ...poster(40, k === 'W' && Math.floor(f / 18) % 2 === 0 ? P.card : P.ink) }}>{k}</div>
          ))}
        </div>
        <div style={{ ...ui(40, P.ink, 800), textAlign: 'right', lineHeight: 1.2 }}>tum chalo →<br /><span style={{ color: P.magenta }}>duniya live bane</span><br /><span style={{ ...ui(30, P.ink2, 700) }}>pixels + awaaz, saath-saath</span></div>
      </div>
      <Tag y={1310} text="Diagram · frames: Google DeepMind's stained-glass demo" />
    </>
  );
};

// ================================================================== 5 keys: push into the real WASD / arrow UI
export const Keys: React.FC = () => {
  const { l, at, from, dur } = useScene('keys');
  const kb = at('l04', 'Keyboard'), z = inout(invLerp(kb - 4, kb + 40, l)), pan = inout(invLerp(dur - 30, dur, l));
  return (
    <>
      <Ground cy={50} heat={0.6} />
      <Title l={l} y={220} lines={[[{ t: 'KEYBOARD', at: kb - 2, face: P.saffron, size: 136 }], [{ t: 'SE GHOOMO', at: kb + 8, face: P.card, size: 96 }]]} />
      <Screen clip="balloon" from={from} t0={4.5} shot={{ x: 110, y: 660, w: 860 }} zoom={1 + 2.2 * z} fx={lerp(0.05, 0.95, pan)} fy={0.93} />
      <div style={{ ...abs(110, 1200, 860), display: 'flex', justifyContent: 'space-between', opacity: arrive(l, kb + 20, 10) }}>
        <span style={{ padding: '10px 18px', borderRadius: 14, background: P.card, border: `4px solid ${P.ink}`, boxShadow: ink(6), ...ui(32) }}>W A S D: chalo</span>
        <span style={{ padding: '10px 18px', borderRadius: 14, background: P.card, border: `4px solid ${P.ink}`, boxShadow: ink(6), ...ui(32), opacity: arrive(l, dur - 30, 10) }}>arrows: camera</span>
      </div>
      <Credit y={1290} />
    </>
  );
};

// ================================================================== 6 prompt: steer the world in words (peacock -> cat, typed live)
export const Prompt: React.FC = () => {
  const { l, at, from } = useScene('prompt');
  const pr = at('l04', 'prompt'), we = at('l04', 'weather,'), ca = at('l04', 'camera'), chs = at('l04', 'characters');
  const chip = (t: string, a: number, x: number, y: number, rot: number, face: string) => l >= a - 1 ? (
    <div style={{ ...abs(x, y), padding: '12px 22px', borderRadius: 16, background: face, border: `4px solid ${P.ink}`, boxShadow: ink(7), ...poster(54, P.card, 900, 80),
      transform: `rotate(${rot}deg) scale(${1.5 - 0.5 * arrive(l, a, 10)})`, zIndex: 22 }}>{t}</div>
  ) : null;
  return (
    <>
      <Ground cy={44} />
      <Title l={l} y={200} lines={[[{ t: 'PROMPT', at: pr - 2, face: P.magenta, size: 140 }, { t: 'SE', at: pr + 4, face: P.card, size: 140 }], [{ t: 'BADLO!', at: pr + 10, face: P.magenta, size: 140 }]]} />
      <Screen clip="magic" from={from} t0={5.2} rate={1.25} shot={{ x: 110, y: 640, w: 860, tilt: 1 }} zoom={1.0 + 0.25 * inout(invLerp(0, 180, l))} fx={0.5} fy={0.8} />
      {chip('Weather', we, 96, 560, -6, P.teal)}
      {chip('Camera', ca, 650, 560, 5, P.saffron)}
      {chip('Naye characters', chs, 250, 1160, -3, P.magenta)}
      <Credit y={1290} text="Video: Google DeepMind · prompt typed live: “A flash turns the peacock into a cat.”" />
    </>
  );
};

// ================================================================== 7 physics: the bust falls, the watermelon bursts (impact on "phat")
export const Physics: React.FC = () => {
  const { l, at, from } = useScene('physics');
  const ph = at('l05', 'phat'), co = at('l05', 'Collisions'), py = at('l05', 'physics');
  const shake = hit(l, ph - 2, 10) * 14;
  return (
    <>
      <Ground cy={50} heat={1 + hit(l, ph, 20)} spin={1 + 6 * hit(l, ph, 30)} />
      <Title l={l} y={200} lines={[[{ t: 'BUST', at: at('l05', 'Bust') - 2, face: P.card, size: 120 }, { t: 'GIRAAO…', at: at('l05', 'giraao') + 4, face: P.card, size: 120 }]]} out={ph - 6} />
      {l >= ph - 4 ? <Title l={l} y={190} lines={[[{ t: 'DHISHOOM!', at: ph - 3, face: P.coral, size: 170 }]]} out={co - 4} /> : null}
      {l >= co - 4 ? <Title l={l} y={200} lines={[[{ t: 'PHYSICS', at: co - 2, face: P.saffron, size: 140 }, { t: 'BHI!', at: py - 2, face: P.magenta, size: 140 }]]} /> : null}
      <div style={{ position: 'absolute', inset: 0, transform: `translate(${Math.sin(l * 1.7) * shake}px, ${Math.cos(l * 2.3) * shake}px)` }}>
        <Screen clip="melon" from={from} t0={2.85} shot={{ x: 90, y: 560, w: 900 }} zoom={1 + 0.35 * inout(invLerp(ph - 40, ph + 10, l))} fx={0.5} fy={0.45} />
      </div>
      {/* the collision diagram, drawn over the real frame */}
      {l >= co - 2 ? (
        <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0, zIndex: 18 }}>
          {[0, 1, 2].map((i) => { const r = 40 + ((l - co) * 3 + i * 50) % 150; return <circle key={i} cx={540} cy={790} r={r} fill="none" stroke={P.coral} strokeWidth={6} opacity={clamp(1 - r / 190)} />; })}
          <path d="M 540 600 L 540 720" stroke={P.ink} strokeWidth={10} strokeLinecap="round" /><path d="M 515 695 L 540 728 L 565 695" stroke={P.ink} strokeWidth={10} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <text x={575} y={650} fontFamily={FONT.poster} fontWeight={900} fontSize={44} fill={P.ink} style={{ fontStretch: '80%' }}>COLLISION</text>
        </svg>
      ) : null}
      {l >= py - 6 ? (
        <div style={{ ...abs(610, 1010), transform: `rotate(3deg) scale(${1.3 - 0.3 * arrive(l, py - 6, 12)})`, opacity: arrive(l, py - 6, 8), zIndex: 21 }}>
          <Screen clip="maple" from={from + py - 6} t0={1.0} shot={{ x: 0, y: 0, w: 330 }} bulbs={false} frame={0.6} />
          <div style={{ ...abs(0, 205, 380), textAlign: 'center', ...poster(40, P.teal) }}>+ aerodynamics</div>
        </div>
      ) : null}
      <Credit y={1310} text="Video: Google DeepMind · prompt: “Drop a heavy white marble classical bust on top of the watermelon”" />
    </>
  );
};

// ================================================================== 8 audio: three lanes of Genie 4's own sound, then its own dialogue
const Lane: React.FC<{ l: number; at: number; clip: 'dragon' | 'sax' | 'train'; from: number; t0: number; y: number; icon: string; label: string; color: string; dim: number }> = ({ l, at, clip, from, t0, y, icon, label, color, dim }) => {
  if (l < at - 2) return null;
  const p = arrive(l, at, 14), e = (env as Record<string, { env: number[] }>)[clip].env, k0 = Math.max(0, l - at);
  return (
    <div style={{ ...abs(80 + (1 - p) * -600, y, 920), height: 200, opacity: (1 - dim * 0.7) * clamp(p * 2) }}>
      <Screen clip={clip} from={from} t0={t0} shot={{ x: 26, y: 18, w: 300 }} bulbs={false} frame={0.6} />
      <div style={{ ...abs(372, 6, 548), height: 188, borderRadius: 22, background: P.card, border: `4px solid ${P.ink}`, boxShadow: ink(7), overflow: 'hidden' }}>
        <div style={{ ...abs(20, 14), display: 'flex', gap: 10, alignItems: 'center', ...ui(30, color, 900) }}><Icon name={icon} size={36} color={color} sw={2.4} />{label}</div>
        <svg width={548} height={120} style={{ position: 'absolute', left: 0, top: 62 }}>
          {Array.from({ length: 60 }, (_, i) => { const v = e[Math.min(e.length - 1, Math.max(0, Math.floor(k0) - 59 + i))] ?? 0; const hgt = 8 + v * 100; return <rect key={i} x={14 + i * 8.8} y={60 - hgt / 2} width={5} height={hgt} rx={2.5} fill={color} opacity={0.35 + 0.65 * (i / 59)} />; })}
        </svg>
      </div>
    </div>
  );
};
export const Audio: React.FC = () => {
  const { l, at, from, dur } = useScene('audio');
  const so = at('l06', 'sounds,'), mu = at('l06', 'music'), di = at('l06', 'dialogue'), end = at('l06', 'hai.') + 30;
  const trainFrom = from + di + 28, big = inout(invLerp(end - 6, end + 18, l));
  return (
    <>
      <Ground cy={30} heat={0.8} />
      <Title l={l} y={200} out={end - 8} lines={[[{ t: 'AWAAZ', at: at('l06', 'twist:') - 2, face: P.magenta, size: 130 }, { t: 'BHI!', at: at('l06', 'twist:') + 8, face: P.card, size: 130 }]]} />
      <Lane l={l} at={so} clip="dragon" from={from + so} t0={8} y={470} icon="wind" label="Ambient: hawa, pankh" color={P.teal} dim={big} />
      <Lane l={l} at={mu} clip="sax" from={from + mu} t0={12} y={700} icon="music" label="Music: saxophone" color={P.saffron} dim={big} />
      {big < 0.05 ? <Lane l={l} at={di} clip="train" from={trainFrom} t0={0} y={930} icon="chat" label="Dialogue: characters" color={P.magenta} dim={0} /> : null}
      {big >= 0.05 ? (
        <>
          <Screen clip="train" from={trainFrom} t0={0} shot={{ x: lerp(106, 110, big), y: lerp(950, 560, big), w: lerp(300, 860, big) }} frame={big} />
          <div style={{ ...center(1090), opacity: arrive(l, end + 10, 10) }}>
            <div style={{ maxWidth: 860, padding: '16px 26px', borderRadius: 20, background: P.ink, color: P.card, ...ui(40, P.card, 700), boxShadow: ink(6, P.magenta), textAlign: 'center' }}>
              “Mind the platform edge, please.”
              <div style={{ ...ui(24, P.goldLite, 700), marginTop: 6 }}>Genie 4 ka apna generated dialogue</div>
            </div>
          </div>
        </>
      ) : null}
      <Credit y={1300} text="Video + audio: Google DeepMind · Genie 4 · all sounds produced by Genie 4 (per DeepMind)" />
      <div style={{ display: 'none' }}>{dur}</div>
    </>
  );
};

// ================================================================== 9 director: Gemini 3.8 Flash observes, plans steps, verifies
export const Director: React.FC = () => {
  const { l, at, from } = useScene('director');
  const ge = at('l07', 'Gemini'), di = at('l07', 'director'), pl = at('l07', 'planning');
  const R = 320, cx = 540, cy = 930;
  const nodes = [{ a: -90, icon: 'eye', t: 'Frames dekhe', at: di }, { a: 30, icon: 'list', t: 'Steps banaye', at: di + 14 }, { a: 150, icon: 'check', t: 'Verify kare', at: pl }];
  return (
    <>
      <Ground cy={47} heat={0.75} />
      <Title l={l} y={190} lines={[[{ t: 'GEMINI', at: ge - 2, face: P.teal, size: 130 }], [{ t: '= DIRECTOR', at: di - 2, face: P.card, size: 110 }]]} />
      <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
        <circle cx={cx} cy={cy + 20} r={R} fill="none" stroke={P.tealDeep} strokeWidth={10} strokeDasharray="26 18" strokeDashoffset={-l * 3} opacity={arrive(l, ge, 16)} />
        {Array.from({ length: 5 }, (_, i) => { const a = ((l * 1.6 + i * 72) * Math.PI) / 180; return <circle key={i} cx={cx + R * Math.cos(a)} cy={cy + R * Math.sin(a)} r={11} fill={P.teal} stroke={P.ink} strokeWidth={4} opacity={arrive(l, ge + 6, 10)} />; })}
      </svg>
      <Screen clip="balloon" from={from} t0={5.4} shot={{ x: 290, y: 760, w: 500 }} zoom={1.5} fx={0.92} fy={0.15} frame={1} />
      {nodes.map((n, i) => {
        const p = arrive(l, n.at, 12), a = (n.a * Math.PI) / 180, x = cx + R * Math.cos(a), y = cy + R * Math.sin(a);
        return l >= n.at - 1 ? (
          <div key={i} style={{ ...abs(x - 150, y - 52, 300), display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderRadius: 18, background: P.card, border: `4px solid ${P.ink}`, boxShadow: ink(7),
            transform: `scale(${1.4 - 0.4 * p})`, opacity: clamp(p * 2), zIndex: 22 }}>
            <div style={{ width: 54, height: 54, borderRadius: 27, background: P.tealSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}><Icon name={n.icon} size={34} color={P.tealDeep} sw={2.4} /></div>
            <div style={{ ...ui(30, P.ink, 900) }}>{n.t}</div>
          </div>
        ) : null;
      })}
      <div style={{ ...center(1265), ...ui(26, P.ink2, 700), opacity: arrive(l, ge + 10, 10) }}>Gemini 3.8 Flash: guiding agent in the loop</div>
      <Credit y={1310} text="Video: Google DeepMind · real “REASONING STEPS” panel from the balloon demo" />
    </>
  );
};

// ================================================================== 10 robot: multi-step events (Gemini 4 Argon + Genie 4)
export const Robot: React.FC = () => {
  const { l, at, from } = useScene('robot');
  const ms = at('l07', 'multi-step'), ev = at('l07', 'events'), fo = at('l07', 'follow');
  const steps = [ms, ev, fo];
  return (
    <>
      <Ground cy={40} heat={0.7} />
      <Title l={l} y={200} lines={[[{ t: 'MULTI-STEP', at: ms - 2, face: P.teal, size: 132 }], [{ t: 'EVENTS', at: ev - 2, face: P.card, size: 132 }]]} />
      <Screen clip="apollo" from={from} t0={2} shot={{ x: 110, y: 610, w: 860, tilt: -1 }} zoom={1.0 + 0.6 * inout(invLerp(0, 120, l))} fx={0.8} fy={0.5} />
      <div style={{ ...abs(110, 1135, 860), display: 'flex', gap: 14, justifyContent: 'center' }}>
        {steps.map((a, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 18px', borderRadius: 14, background: l >= a ? P.teal : P.card, border: `4px solid ${P.ink}`, boxShadow: ink(5),
            ...ui(30, l >= a ? P.card : P.ink, 900), transform: `scale(${1 + 0.15 * hit(l, a, 8)})` }}>
            {l >= a ? <Icon name="check" size={30} color={P.card} sw={3} /> : null}Step {i + 1}
          </div>
        ))}
      </div>
      <Credit y={1290} text="Video: Google DeepMind · Gemini 4 Argon + Genie 4 robotics experiment (Apptronik Apollo)" />
    </>
  );
};

// ================================================================== 11 limits: the caveats, drawn as a drift timeline (illustrative)
export const Limits: React.FC = () => {
  const { l, at } = useScene('limits');
  const le = at('l08', 'Lekin'), na = at('l08', 'nahi,'), dr = at('l08', 'drift'), ob = at('l08', 'objects'), inc = at('l08', 'inconsistent');
  const st = spring(l, na - 2, 15, 0.5);
  return (
    <>
      <Ground cy={30} heat={0.35} spin={0.3} />
      <Title l={l} y={190} lines={[[{ t: 'LEKIN…', at: le - 2, face: P.coral, size: 160 }]]} />
      {l >= na - 2 ? (
        <div style={{ ...center(420), zIndex: 24 }}>
          <div style={{ padding: '12px 30px', border: `8px solid ${P.coralDeep}`, borderRadius: 18, background: P.coralSoft, transform: `rotate(-5deg) scale(${2 - st})`, ...poster(72, P.coralDeep, 900, 74) }}>Physics: perfect nahi</div>
        </div>
      ) : null}
      {/* drift timeline: one object across six frames; it slides, recolours and finally vanishes as the session runs */}
      <div style={{ ...abs(80, 620, 920), height: 420, borderRadius: 26, background: P.card, border: `5px solid ${P.ink}`, boxShadow: ink(10), opacity: arrive(l, na + 6, 14), transform: `translateY(${(1 - arrive(l, na + 6, 16)) * 200}px)` }}>
        <div style={{ ...abs(28, 18), ...ui(30, P.ink, 900) }}>Session aage badhta hai →</div>
        {Array.from({ length: 6 }, (_, i) => {
          const on = l >= dr - 6 + i * 10, k = i / 5, x = 28 + i * 146;
          const drift = (ob <= l ? 1 : 0.6) * k, hue = lerp(0, 1, drift);
          return (
            <div key={i} style={{ ...abs(x, 80, 132), height: 200, borderRadius: 12, background: '#F2EADF', border: `3px solid ${P.ink}`, opacity: on ? 1 : 0.15, overflow: 'hidden' }}>
              <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 60, background: '#E3D3BE' }} />
              {i < 5 || l < inc ? (
                <svg width={132} height={200} style={{ position: 'absolute', left: (drift * 22 + hash(i, 4) * 6 * drift), top: 0 }}>
                  <rect x={36} y={70 - drift * 10} width={60} height={70 + drift * 12} rx={8} fill={hue > 0.5 ? P.violet : P.coral} stroke={P.ink} strokeWidth={4} transform={`rotate(${drift * 14} 66 110)`} />
                  <circle cx={66} cy={60 - drift * 10} r={16 - drift * 6} fill={P.gold} stroke={P.ink} strokeWidth={4} />
                </svg>
              ) : <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', ...poster(80, P.coral) }}>?</div>}
              {i === 0 ? <div style={{ ...abs(6, 6), ...ui(18, P.ink2, 700) }}>frame 1</div> : null}
            </div>
          );
        })}
        <div style={{ ...abs(28, 310, 864), height: 30, borderRadius: 15, background: '#EFE3D2', border: `3px solid ${P.ink}`, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${100 * clamp((l - dr + 6) / 90)}%`, background: `linear-gradient(90deg, ${P.gold}, ${P.coral})` }} />
        </div>
        <div style={{ ...abs(28, 352), ...ui(28, P.coralDeep, 900) }}>drift: details aur objects badal sakte hain</div>
      </div>
      <div style={{ ...abs(110, 1080, 860), display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
        {['Lambe sessions', 'Kai prompt edits', 'Navigation'].map((t, i) => (
          <span key={t} style={{ padding: '8px 16px', borderRadius: 12, background: P.coralSoft, border: `3px solid ${P.coralDeep}`, ...ui(28, P.coralDeep, 800), opacity: arrive(l, dr + 8 + i * 10, 10) }}>{t}</span>
        ))}
      </div>
      <Tag y={1270} text="Illustrative diagram · limits as stated in DeepMind's post" />
    </>
  );
};

// ================================================================== 12 preview: Now Showing / Coming Soon
export const Preview: React.FC = () => {
  const { l, at } = useScene('preview');
  const sz = at('l09', 'zaroori:'), tr = at('l09', 'trusted'), pu = at('l09', 'Public'), f = useCurrentFrame(), st = spring(l, pu - 2, 15, 0.5);
  const sign = (y: number, top: string, main: string, sub: string, p: number, lit: boolean, face: string) => (
    <div style={{ ...abs(110, y, 860), padding: '22px 28px', borderRadius: 24, background: lit ? P.ink : P.card, border: `5px solid ${P.ink}`, boxShadow: ink(10), opacity: clamp(p * 2), transform: `translateX(${(1 - p) * 500}px)` }}>
      <div style={{ ...poster(34, lit ? P.goldLite : P.ink2, 900, 90), letterSpacing: '0.08em' }}>{top}</div>
      <div style={{ ...poster(64, face, 900, 76), marginTop: 6 }}>{main}</div>
      <div style={{ ...ui(28, lit ? '#E8DDEB' : P.ink2, 700), marginTop: 6 }}>{sub}</div>
      {lit ? Array.from({ length: 18 }, (_, i) => <div key={i} style={{ position: 'absolute', left: 20 + i * 46, top: -9, width: 16, height: 16, borderRadius: 8, background: (i + Math.floor(f / 7)) % 3 ? '#D49A1A' : '#FFF6C9', boxShadow: (i + Math.floor(f / 7)) % 3 ? undefined : '0 0 12px 3px rgba(255,214,90,0.9)' }} />) : null}
    </div>
  );
  return (
    <>
      <Ground cy={24} heat={0.8} />
      <Title l={l} y={190} lines={[[{ t: 'SABSE', at: at('l09', 'Sabse') - 2, face: P.card, size: 110 }, { t: 'ZAROORI', at: sz - 2, face: P.coral, size: 110 }]]} />
      {sign(430, 'Now showing', 'Trusted testers only', 'Research preview, abhi sirf chune hue testers', arrive(l, tr - 6, 14), true, P.goldLite)}
      {sign(700, 'Coming soon', 'Google AI Ultra · Project Genie', 'waitlist khula hai', arrive(l, tr + 30, 14), false, P.magenta)}
      {sign(940, 'Coming soon', 'Gemini API · AI Studio', 'early-access partners', arrive(l, tr + 46, 14), false, P.teal)}
      {l >= pu - 2 ? (
        <div style={{ ...center(1170), zIndex: 24 }}>
          <div style={{ padding: '12px 30px', border: `8px solid ${P.coralDeep}`, borderRadius: 18, background: P.coralSoft, transform: `rotate(-4deg) scale(${2 - st})`, ...poster(66, P.coralDeep, 900, 74) }}>Public app launch: nahi</div>
        </div>
      ) : null}
      <Credit y={1310} text="Source: deepmind.google/blog · “Next steps for Genie 4” · 27 Oct 2026" />
    </>
  );
};

// ================================================================== 13 engine: game engine vs world model (our explainer)
export const Engine: React.FC = () => {
  const { l, at } = useScene('engine');
  const ga = at('l10', 'Game'), ex = at('l10', 'exciting'), le = at('l10', 'lekin'), fi = at('l10', 'finished'), st = spring(l, fi - 2, 15, 0.5);
  const rows: [string, string, string][] = [['Duniya', 'haath se banao', 'prompt se bane'], ['Physics', 'rules, exact', 'seekhi hui'], ['Consistency', 'hamesha same', 'drift ho sakta'], ['Game ship?', 'haan', 'abhi nahi']];
  return (
    <>
      <Ground cy={50} heat={0.7} />
      <div style={{ ...abs(80, 210, 920), display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ width: 400, textAlign: 'center', opacity: arrive(l, ga - 4, 10) }}><Filmi text="Game engine" size={78} face={P.saffron} p={arrive(l, ga - 4, 12)} /></div>
        <Filmi text="VS" size={110} face={P.card} p={arrive(l, ga + 8, 12)} />
        <div style={{ width: 400, textAlign: 'center' }}><Filmi text="World model" size={78} face={P.magenta} p={arrive(l, ga + 14, 12)} /></div>
      </div>
      {rows.map(([k, a, b], i) => {
        const p = arrive(l, ex - 10 + i * 10, 12), y = 470 + i * 170;
        return (
          <div key={k} style={{ ...abs(80, y, 920), height: 140, display: 'flex', gap: 16, opacity: clamp(p * 2), transform: `translateY(${(1 - p) * 60}px)` }}>
            {[a, b].map((t, j) => (
              <div key={j} style={{ flex: 1, borderRadius: 20, background: P.card, border: `4px solid ${P.ink}`, boxShadow: ink(6), padding: '14px 20px' }}>
                <div style={{ ...ui(24, P.ink2, 800), textTransform: 'uppercase', letterSpacing: '0.06em' }}>{k}</div>
                <div style={{ ...ui(38, j ? P.magenta : P.ink, 900), marginTop: 6 }}>{t}</div>
              </div>
            ))}
          </div>
        );
      })}
      {l >= fi - 2 ? (
        <div style={{ position: 'absolute', left: 560, top: 820, zIndex: 24, transform: `rotate(-9deg) scale(${2 - st})` }}>
          <div style={{ padding: '10px 24px', border: `8px solid ${P.coralDeep}`, borderRadius: 16, background: P.coralSoft, ...poster(60, P.coralDeep, 900, 72) }}>Abhi demo hai!</div>
        </div>
      ) : null}
      <Tag y={1180} p={arrive(l, le, 10)} text="TechpeTrek comparison, not from DeepMind's post" />
    </>
  );
};

// ================================================================== 14 picture: "Picture abhi baaki hai, mere dost!"
export const Picture: React.FC = () => {
  const { l, at } = useScene('picture');
  const pi = at('l10', 'Picture'), md = at('l10', 'mere'), f = useCurrentFrame();
  const n = Math.max(1, 3 - Math.floor(clamp((l + 6) / 36) * 3));
  const sweep = ((l % 36) / 36) * 360;
  return (
    <>
      <Ground cy={46} heat={1.2} spin={2} />
      <div style={{ ...abs(0, 520, 1080), height: 300, background: P.ink, overflow: 'hidden', transform: 'rotate(-4deg)' }}>
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} style={{ position: 'absolute', left: i * 300 - ((l * 9) % 300), top: 34, width: 280, height: 232, borderRadius: 8, overflow: 'hidden' }}>
            <Img src={staticFile(`frames/${i % 2 ? 'train' : 'crane'}_${i % 6}.jpg`)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        ))}
        {Array.from({ length: 28 }, (_, i) => <div key={i} style={{ position: 'absolute', left: i * 44 - ((l * 9) % 44), top: 8, width: 22, height: 16, borderRadius: 4, background: P.paper }} />)}
        {Array.from({ length: 28 }, (_, i) => <div key={'b' + i} style={{ position: 'absolute', left: i * 44 - ((l * 9) % 44), top: 276, width: 22, height: 16, borderRadius: 4, background: P.paper }} />)}
      </div>
      {l < pi + 4 ? (
        <div style={{ ...center(560), zIndex: 22 }}>
          <div style={{ width: 240, height: 240, borderRadius: 120, background: `conic-gradient(${P.ink} ${sweep}deg, rgba(30,16,48,0.55) ${sweep}deg)`, border: `8px solid ${P.card}`, display: 'flex', alignItems: 'center', justifyContent: 'center', ...poster(150, P.card) }}>{n}</div>
        </div>
      ) : null}
      <Title l={l} y={900} lines={[[{ t: 'PICTURE', at: pi - 2, face: P.magenta, size: 150 }], [{ t: 'ABHI BAAKI', at: pi + 12, face: P.saffron, size: 120 }], [{ t: 'HAI…', at: pi + 22, face: P.saffron, size: 120 }, { t: 'MERE DOST!', at: md - 2, face: P.card, size: 100 }]]} />
      <div style={{ display: 'none' }}>{f}</div>
    </>
  );
};

// ================================================================== 15 cta: Comment WORLD, save
export const Cta: React.FC = () => {
  const { l, at, from } = useScene('cta');
  const wo = at('l11', 'WORLD,'), sv = at('l11', 'save');
  const typed = 'WORLD'.slice(0, Math.max(0, Math.min(5, Math.floor((l - wo + 10) / 4))));
  const sent = l >= wo + 24, saved = l >= sv;
  return (
    <>
      <Ground cy={36} />
      <Title l={l} y={190} lines={[[{ t: 'COMMENT', at: at('l11', 'Comment') - 2, face: P.card, size: 130 }], [{ t: 'WORLD', at: wo - 2, face: P.magenta, size: 170 }]]} />
      <div style={{ ...abs(SAFE.x, 590, SAFE.w), display: 'flex', alignItems: 'center', gap: 18, padding: '24px 28px', borderRadius: 26, background: P.card, border: `5px solid ${P.ink}`, boxShadow: ink(10) }}>
        <Icon name="comment" size={54} color={P.ink2} sw={2.2} />
        <div style={{ flex: 1, ...ui(58, typed ? P.ink : P.ink3, typed ? 900 : 600) }}>{typed || 'Add a comment…'}{!sent && Math.floor(l / 14) % 2 === 0 ? '|' : ''}</div>
        <div style={{ width: 84, height: 84, borderRadius: 42, background: sent ? P.mint : P.magenta, border: `4px solid ${P.ink}`, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${1 - 0.12 * hit(l, wo + 20, 6)})` }}>
          <Icon name={sent ? 'check' : 'send'} size={44} color={P.card} sw={2.8} />
        </div>
      </div>
      <Screen clip="crane" from={from} t0={20} shot={{ x: 210, y: 800, w: 660, tilt: 1.5 }} zoom={1 + 0.15 * (l / 300)} />
      <div style={{ ...center(1210), opacity: arrive(l, sv - 10, 12) }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 26px', borderRadius: 18, background: P.card, border: `4px solid ${P.ink}`, boxShadow: ink(6), transform: `scale(${1 + 0.1 * hit(l, sv, 10)})` }}>
          <svg width={44} height={44} viewBox="0 0 24 24"><path d="M6.5 3.5h11a1 1 0 0 1 1 1v16l-6.5-4.5L5.5 20.5v-16a1 1 0 0 1 1-1z" fill={saved ? P.ink : 'none'} stroke={P.ink} strokeWidth={2} strokeLinejoin="round" /></svg>
          <span style={{ ...ui(40, P.ink, 900) }}>Save karo</span>
        </div>
      </div>
      <Credit y={1310} text="Source: deepmind.google/blog/genie-4-a-new-generation-of-world-simulation · video: Google DeepMind" />
    </>
  );
};

export const SCENES: Record<string, React.FC> = {
  hook: Hook, hook2: Hook2, announce: Announce, worldmodel: WorldModel, keys: Keys, prompt: Prompt, physics: Physics, audio: Audio,
  director: Director, robot: Robot, limits: Limits, preview: Preview, engine: Engine, picture: Picture, cta: Cta,
};
void S;
