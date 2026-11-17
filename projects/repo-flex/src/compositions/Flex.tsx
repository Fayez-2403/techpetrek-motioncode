// Repo flex (music only: Runaway bass drop, user's file). After @viashaan's reel: a chat where a command is typed,
// sent, and its result bursts from a card to full frame. One command per 82-BPM bar (8 grid ticks) from the drop:
// type on ticks 0-1, send + burst on the tick-2 snare, punch on the tick-6 snare, cut back on the next bar's kick.
// Every time comes from src/config/grid.json (measured) and flex.json; pure function of the frame.
import React from 'react';
import { AbsoluteFill, Audio, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from 'remotion';
import grid from '../config/grid.json';
import flex from '../config/flex.json';

export const FLEX_FRAMES = Math.round(flex.end * 60);
const B = grid.beat, BAR = B * 8;
const C = { bg: '#0d0e10', panel: '#16181b', line: 'rgba(255,255,255,0.08)', ink: '#F2F0EA', ink2: '#8E8B85', gold: '#F2C35A', teal: '#1FE5C8', orange: '#FF6A3D' };
const F = { ui: 'Inter, sans-serif', mono: '"JetBrains Mono", monospace', brand: 'Fraunces, serif' };
const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const outQ = (x: number) => 1 - (1 - clamp(x)) ** 5;
const back = (x: number) => { x = clamp(x); const c = 1.6; return 1 + (c + 1) * (x - 1) ** 3 + c * (x - 1) ** 2; };
const lastBeat = (T: number) => grid.beats.reduce((a, b) => (T >= b ? b : a), 0);
type Block = typeof flex.blocks[number];

const KEYS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
const Keyboard: React.FC<{ hot: string; pop: number }> = ({ hot, pop }) => (
  <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 560, background: '#1d1f23', paddingTop: 26 }}>
    {KEYS.map((row, r) => (
      <div key={row} style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 16, paddingLeft: r * 40 }}>
        {[...row].map((k) => {
          const on = k === hot;
          return (
            <div key={k} style={{ width: 86, height: 104, borderRadius: 14, background: on ? '#4a4e56' : '#33363c', color: C.ink, fontFamily: F.ui, fontSize: 44,
              display: 'flex', alignItems: 'center', justifyContent: 'center', transform: on ? `translateY(${-30 * pop}px) scale(${1 + 0.35 * pop})` : undefined,
              boxShadow: '0 3px 0 rgba(0,0,0,0.5)' }}>{k}</div>
          );
        })}
      </div>
    ))}
    <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
      <div style={{ width: 180, height: 104, borderRadius: 14, background: hot === '/' ? '#4a4e56' : '#2a2c31', color: C.ink, fontFamily: F.mono, fontSize: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>/ -</div>
      <div style={{ width: 520, height: 104, borderRadius: 14, background: '#33363c' }} />
      <div style={{ width: 180, height: 104, borderRadius: 14, background: C.orange, color: '#fff', fontFamily: F.ui, fontWeight: 700, fontSize: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>send</div>
    </div>
  </div>
);

/** the chat screen for one command: typing (t0 .. send), then the sent bubble + "Building with …" */
const Chat: React.FC<{ T: number; cmd: string; t0: number; send: number; note?: string }> = ({ T, cmd, t0, send, note }) => {
  const typeEnd = send - 0.12;
  const n = clamp((T - t0) / (typeEnd - t0)) * cmd.length;
  const typed = cmd.slice(0, Math.floor(n));
  const hot = T < typeEnd ? (cmd[Math.floor(n)] ?? '') : '';
  const pop = 1 - (n % 1);
  const sent = T >= send;
  const spin = (T * 8) % (Math.PI * 2);
  const kick = Math.exp(-(T - lastBeat(T)) * 12);                    // a small bounce on every beat
  const drift = clamp((T - t0) / (send - t0 + 0.4));                  // a slow push-in while typing (never a still frame)
  return (
    <AbsoluteFill style={{ background: C.bg, fontFamily: F.ui, transformOrigin: '540px 1300px', transform: `scale(${1 + 0.045 * drift + 0.012 * kick}) translateY(${-18 * drift}px)` }}>
      <div style={{ position: 'absolute', top: 70, left: 0, right: 0, height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: `1px solid ${C.line}` }}>
        <div style={{ position: 'absolute', left: 50, fontSize: 44, color: C.ink2 }}>≡</div>
        <div style={{ padding: '14px 34px', borderRadius: 40, background: C.panel, color: C.ink, fontSize: 38, fontWeight: 700 }}>
          <span style={{ color: C.gold, fontFamily: F.brand, fontWeight: 900 }}>EditorBro</span><span style={{ color: C.ink2, fontWeight: 500 }}> · studio</span>
        </div>
        <div style={{ position: 'absolute', right: 50, width: 64, height: 64, borderRadius: 32, background: C.orange, color: '#fff', fontWeight: 800, fontSize: 30, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>FK</div>
      </div>
      {note ? <div style={{ position: 'absolute', top: 260, left: 0, right: 0, textAlign: 'center', color: C.ink2, fontSize: 40 }}>{note}</div> : null}
      {sent ? (
        <>
          <div style={{ position: 'absolute', top: 360, right: 60, padding: '22px 34px', borderRadius: 34, background: C.panel, color: C.ink, fontFamily: F.mono, fontSize: 48,
            transform: `translateY(${(1 - outQ((T - send) / 0.18)) * 500}px)` }}>{cmd}</div>
          <div style={{ position: 'absolute', top: 500, left: 60, color: C.ink2, fontSize: 38, display: 'flex', alignItems: 'center', gap: 16, opacity: clamp((T - send) / 0.1) }}>
            <span style={{ display: 'inline-block', color: C.orange, fontSize: 48, transform: `rotate(${spin}rad)` }}>✳</span> Building with {cmd}…
          </div>
        </>
      ) : null}
      <div style={{ position: 'absolute', left: 40, right: 40, bottom: 600, height: 120, borderRadius: 60, background: C.panel, border: `1px solid ${C.line}`, display: 'flex', alignItems: 'center', padding: '0 40px',
        fontFamily: F.mono, fontSize: 50, color: C.ink }}>
        {sent ? <span style={{ color: C.ink2, fontFamily: F.ui, fontSize: 40 }}>Reply to EditorBro…</span> : <span>{typed}<span style={{ opacity: Math.floor(T * 4) % 2 ? 1 : 0.2, color: C.orange }}>|</span></span>}
      </div>
      <Keyboard hot={hot} pop={pop} />
    </AbsoluteFill>
  );
};

/** one bar: chat until the send, then the result bursts from a card in the chat to full frame */
const Command: React.FC<{ T: number; b: Block }> = ({ T, b }) => {
  const burst = back((T - b.send) / 0.3);                             // the card bursts on the tick-2 snare itself
  const open = T >= b.send;
  const punch = T >= b.punch ? Math.exp(-(T - b.punch) * 9) : 0;
  const kick = Math.exp(-(T - lastBeat(T)) * 12);
  // card in the chat: 640 x 1138 at (220, 600); full frame: 1080 x 1920 at (0, 0)
  const s = 0.593 + (1 - 0.593) * burst, x = 220 * (1 - burst), y = 600 * (1 - burst);
  return (
    <AbsoluteFill>
      <Chat T={T} cmd={b.cmd} t0={b.bar} send={b.send} />
      <Sequence from={Math.round(b.send * 60)} layout="none">
        {open ? (
          <div style={{ position: 'absolute', left: x, top: y, width: 1080, height: 1920, transformOrigin: '0 0', transform: `scale(${s * (1 + 0.05 * punch + 0.01 * kick)})`,
            borderRadius: 60 * (1 - burst), overflow: 'hidden', boxShadow: '0 40px 120px rgba(0,0,0,0.6)' }}>
            <OffthreadVideo src={staticFile(b.file)} muted style={{ width: 1080, height: 1920 }} />
            <div style={{ position: 'absolute', right: 50, top: 1330, padding: '12px 22px', borderRadius: 16, background: 'rgba(0,0,0,0.72)', fontFamily: F.mono, fontSize: 40, color: C.orange }}>{b.cmd}</div>
            <div style={{ position: 'absolute', left: 50, bottom: 300, padding: '12px 22px', borderRadius: 16, background: 'rgba(0,0,0,0.65)', fontFamily: F.mono, fontSize: 32, color: C.ink }}>⑂ {b.path}</div>
            {punch > 0 ? <AbsoluteFill style={{ background: `rgba(255,250,235,${0.35 * punch})` }} /> : null}
          </div>
        ) : null}
      </Sequence>
    </AbsoluteFill>
  );
};

const Outro: React.FC<{ T: number }> = ({ T }) => {
  const t0 = flex.outro;
  const sn = t0 + 2 * B;
  return (
    <AbsoluteFill style={{ background: C.bg, fontFamily: F.ui }}>
      <div style={{ position: 'absolute', top: 260, left: 0, right: 0, textAlign: 'center' }}>
        <div style={{ fontFamily: F.brand, fontWeight: 900, fontSize: 150, color: C.gold, transform: `scale(${1.25 - 0.25 * outQ((T - t0) / 0.3)})`, opacity: clamp((T - t0) / 0.1) }}>{flex.blocks.length} builds</div>
        <div style={{ fontFamily: F.mono, fontSize: 38, color: C.ink, marginTop: 4, opacity: clamp((T - t0 - 0.2) / 0.2) }}>all from one repo</div>
      </div>
      <div style={{ position: 'absolute', top: 560, left: 60, right: 60, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18 }}>
        {flex.blocks.map((b, i) => {
          const p = back((T - t0 - i * B * 0.5) / 0.3);
          return (
            <div key={b.cmd} style={{ height: 420, borderRadius: 22, overflow: 'hidden', position: 'relative', transform: `scale(${clamp(p, 0, 1.2)})`, opacity: clamp(p * 2), border: `1px solid ${C.line}` }}>
              <Sequence from={Math.round(t0 * 60)} layout="none">
                <OffthreadVideo src={staticFile(b.file)} muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </Sequence>
              <div style={{ position: 'absolute', left: 10, bottom: 10, fontFamily: F.mono, fontSize: 20, color: C.orange, background: 'rgba(0,0,0,0.7)', padding: '4px 10px', borderRadius: 8 }}>{b.cmd}</div>
            </div>
          );
        })}
        <div style={{ height: 420, borderRadius: 22, background: C.panel, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: C.ink2, fontFamily: F.mono, fontSize: 26,
          opacity: clamp((T - t0 - 3.5 * B) / 0.2) }}>+ your<br />next build</div>
      </div>
      <div style={{ position: 'absolute', top: 1500, left: 0, right: 0, textAlign: 'center', opacity: clamp((T - sn) / 0.08), transform: `scale(${1.3 - 0.3 * outQ((T - sn) / 0.3)})` }}>
        <span style={{ display: 'inline-block', padding: '20px 44px', borderRadius: 26, background: C.gold, color: '#2a1a05', fontWeight: 900, fontSize: 64 }}>Comment “EDITOR”</span>
        <div style={{ marginTop: 18, color: C.ink2, fontSize: 34 }}>fork it · build your own</div>
      </div>
    </AbsoluteFill>
  );
};

export const Flex: React.FC = () => {
  const T = useCurrentFrame() / 60;
  const i = flex.blocks.findIndex((b, k) => T >= b.bar && T < (flex.blocks[k + 1]?.bar ?? flex.outro));
  const drop = T >= grid.drop ? Math.exp(-(T - grid.drop) * 7) : 0;
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      {T < grid.drop ? <Chat T={T} cmd="/flex my repos" t0={0.05} send={grid.drop - 0.25} /> : null}
      {i >= 0 ? <Command T={T} b={flex.blocks[i]} /> : null}
      {T >= flex.outro ? <Outro T={T} /> : null}
      {drop > 0 ? <AbsoluteFill style={{ background: `rgba(255,106,61,${0.45 * drop})` }} /> : null}
      <Audio src={staticFile('audio/flex_mix.wav')} />
    </AbsoluteFill>
  );
};
