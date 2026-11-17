// DEV JOURNEY: Chandni raat -> SEV-1 (1080x1920, 60 fps), built from the user's DeveloperJourneyReel spec.
// Every time comes from src/config/timeline.json (scripts/audio/build_sajan.py): the song edit, the kick grid and the
// typed-character times, so picture, keys and song share one clock. No randomness: hash() only.
import React from 'react';
import { AbsoluteFill, Audio, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import TL from '../config/timeline.json';

export const SECONDS = TL.duration;
const DROP = TL.drop, SNAP = TL.snap, K = TL.kicks;
const AUDIO = 'audio/mix_song.wav';
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const hash = (n: number) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const outQ = (x: number) => 1 - (1 - Math.min(1, Math.max(0, x))) ** 4;
const FONT = { ui: "'Inter', sans-serif", mono: "'JetBrains Mono', monospace", display: "'Archivo', sans-serif" };
// kick envelope: 1 on each kick, decaying fast (drives punch-zoom, shake and flashes)
const kickEnv = (t: number) => K.reduce((m, k) => (t >= k ? Math.max(m, Math.exp(-(t - k) / 0.11)) : m), 0);
const lastKick = (t: number) => { let i = -1; K.forEach((k, j) => { if (t >= k) i = j; }); return i; };

// ---------- Python with real syntax colours, typed character by character ----------
const KW = new Set(['def', 'return']);
function tokens(line: string) {
  const out: { s: string; c: string }[] = []; const re = /(\s+|"[^"]*"|[A-Za-z_]\w*|[()=:,.]|\S)/g; let m;
  while ((m = re.exec(line))) {
    const s = m[0];
    const c = KW.has(s) ? '#ff79c6' : s.startsWith('"') ? '#a5e844' : /^[A-Z]/.test(s) ? '#8be9fd' : /^[a-z_]\w*$/.test(s) && line.slice(m.index + s.length).startsWith('(') ? '#50fa7b'
      : /^(type|duration)$/.test(s) ? '#ffb86c' : /[()=:,.]/.test(s) ? '#c9d1d9' : '#e6edf3';
    out.push({ s, c });
  }
  return out;
}
function CodeWindow({ t }: { t: number }) {
  const n = TL.codeT.filter((x) => x <= t).length, shown = TL.code.slice(0, n);
  const y = interpolate(t, [0, DROP], [200, -100], clamp), op = interpolate(t, [0, 0.5], [0.35, 1], clamp);
  const lines = shown.split('\n'), caretOn = Math.floor(t * 2.2) % 2 === 0 || n < TL.code.length;
  return (
    <div style={{ position: 'absolute', left: 60, right: 60, top: 760, transform: `translateY(${y}px)`, opacity: op, borderRadius: 26, overflow: 'hidden',
      background: 'rgba(8,12,20,.78)', backdropFilter: 'blur(14px)', boxShadow: '0 0 0 1.5px rgba(0,255,255,.55), 0 0 60px rgba(0,255,255,.28), 0 40px 90px rgba(0,0,0,.6)' }}>
      <div style={{ height: 64, display: 'flex', alignItems: 'center', gap: 12, padding: '0 26px', borderBottom: '1px solid rgba(255,255,255,.08)' }}>
        {['#ff5f57', '#febc2e', '#28c840'].map((c) => <span key={c} style={{ width: 16, height: 16, borderRadius: 8, background: c }} />)}
        <span style={{ marginLeft: 14, font: `500 26px ${FONT.mono}`, color: '#8b949e' }}>morning.py</span>
      </div>
      <div style={{ padding: '30px 34px 40px', font: `500 37px/1.7 ${FONT.mono}`, minHeight: 330 }}>
        {lines.map((ln, i) => (
          <div key={i} style={{ whiteSpace: 'pre' }}>
            <span style={{ color: '#3d4b5c', marginRight: 26 }}>{i + 1}</span>
            {tokens(ln).map((tk, j) => <span key={j} style={{ color: tk.c }}>{tk.s}</span>)}
            {i === lines.length - 1 && caretOn ? <span style={{ display: 'inline-block', width: 4, height: 42, background: '#00ffff', verticalAlign: -8, marginLeft: 2, boxShadow: '0 0 12px #00ffff' }} /> : null}
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- the binary overlay (code-built, screen blend) ----------
function Binary({ t }: { t: number }) {
  const cols = 18;
  return (
    <AbsoluteFill style={{ mixBlendMode: 'screen', opacity: 0.4 }}>
      {Array.from({ length: cols }, (_, c) => {
        const speed = 380 + 520 * hash(c), off = (t - DROP) * speed + hash(c + 50) * 1920;
        const rows = 34, digits = Array.from({ length: rows }, (_, r) => (hash(c * 97 + r + Math.floor(off / 56)) > 0.5 ? '1' : '0')).join('\n');
        return <div key={c} style={{ position: 'absolute', left: c * 60 + 8, top: (off % 56) - 56, whiteSpace: 'pre', font: `700 34px/56px ${FONT.mono}`, color: c % 3 ? '#00ffff' : '#ff00ff', opacity: 0.35 + 0.5 * hash(c + 9), textShadow: '0 0 10px currentColor' }}>{digits}</div>;
      })}
    </AbsoluteFill>
  );
}

// ---------- chaos panels (flash on kicks) ----------
function Accepted() {
  const bars = Array.from({ length: 26 }, (_, i) => 0.12 + 0.88 * Math.exp(-(((i - 5) / 4.2) ** 2)) + 0.05 * hash(i));
  return (
    <div style={{ position: 'absolute', left: 70, right: 70, top: 1080, padding: 40, borderRadius: 24, background: 'rgba(6,20,10,.92)', boxShadow: '0 0 0 2px #00ff66, 0 0 80px rgba(0,255,102,.5)' }}>
      <div style={{ font: `800 64px ${FONT.ui}`, color: '#00ff66' }}>Accepted</div>
      <div style={{ font: `500 30px ${FONT.mono}`, color: '#b9f6ca', marginTop: 6 }}>Runtime 0 ms · beats 100.00%</div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 180, marginTop: 26 }}>
        {bars.map((b, i) => <div key={i} style={{ flex: 1, height: `${b * 100}%`, background: i === 0 ? '#00ff66' : 'rgba(0,255,102,.35)', borderRadius: 4 }} />)}
      </div>
    </div>
  );
}
function Terminal({ t, t0, err }: { t: number; t0: number; err?: boolean }) {
  const logs = err
    ? ['FATAL: connection to server at "prod-db" failed', 'ERROR: too many connections (max 500)', 'pg_isready: no response', 'retrying in 1s... retrying in 2s... retrying in 4s', 'FATAL: connection to server at "prod-db" failed']
    : ['$ docker-compose up --build -d && git push --force', '[+] Building 41.2s (17/17) FINISHED', ' => [api 6/9] RUN pip install -r requirements.txt', ' ✔ Container prod-api-1      Started', 'To github.com:team/backend.git', ' + 9f3c2e1...a17b0d4 main -> main (forced update)'];
  const k = Math.max(0, t - t0), shown = Math.min(logs.length, 1 + Math.floor(k * 22));
  return (
    <div style={{ position: 'absolute', left: 50, right: 50, top: 1040, padding: '30px 34px', borderRadius: 22, background: 'rgba(2,6,10,.94)', boxShadow: `0 0 0 2px ${err ? '#ff3355' : '#00ffff'}, 0 0 70px ${err ? 'rgba(255,51,85,.5)' : 'rgba(0,255,255,.45)'}` }}>
      {logs.slice(0, shown).map((l, i) => <div key={i} style={{ font: `500 29px/1.55 ${FONT.mono}`, color: err ? (i % 2 ? '#ff8a9a' : '#ff3355') : i === 0 ? '#00ffff' : '#9fe8ff', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{l}</div>)}
    </div>
  );
}
function Incident({ t }: { t: number; }) {
  const { fps } = useVideoConfig();
  const s = spring({ fps, frame: Math.round((t - DROP) * 60), config: { damping: 10 } }), e = kickEnv(t);
  return (
    <div style={{ position: 'absolute', top: 470, left: 90, right: 90, transform: `scale(${s * (1 + 0.04 * e)}) rotate(${(hash(lastKick(t)) - 0.5) * 3 * e}deg)`, background: '#FF0033', padding: '40px 44px', borderRadius: 22,
      boxShadow: `0 0 ${100 + 80 * e}px rgba(255,0,51,.85)` }}>
      <div style={{ font: `800 50px/1.15 ${FONT.mono}`, color: '#fff' }}>! JIRA: CRITICAL SEV-1</div>
      <div style={{ font: `600 38px/1.3 ${FONT.ui}`, color: '#ffd6dc', marginTop: 14 }}>Prod DB is down. All hands on deck.</div>
    </div>
  );
}
// which flash panel each kick shows (15 frames, like the spec's Sequences)
const FLASH: Record<number, 'acc' | 'term' | 'err'> = { 1: 'acc', 2: 'term', 4: 'err', 5: 'term', 7: 'acc', 8: 'err', 9: 'term' };

function Escalation({ t }: { t: number }) {
  const t0 = K[3]; if (t < t0) return null;
  const sc = interpolate(t, [t0, t0 + 10 / 60], [3, 1], clamp) * (1 + 0.1 * (t > t0 + 0.2 ? kickEnv(t) : 0)), op = interpolate(t, [t0, t0 + 2 / 60], [0, 1], clamp);
  const split = 4 + 10 * kickEnv(t);
  return (
    <div style={{ position: 'absolute', top: 860, width: '100%', textAlign: 'center', opacity: op, transform: `scale(${sc}) rotateZ(-5deg)`,
      font: `italic 900 118px/1 ${FONT.display}`, fontStretch: '100%', color: '#fff', letterSpacing: '-0.01em', textShadow: `${split}px ${split}px 0 #FF00FF, ${-split}px ${-split}px 0 #00FFFF` }}>ESCALATION</div>
  );
}

export const DevJourney: React.FC = () => {
  const t = useCurrentFrame() / 60;
  const chaos = t >= DROP && t < SNAP, morning = t < DROP;
  // the inhale (zoom out over the 'Sajan' pickup), the crash on the drop, then a punch on every kick
  const inhale = interpolate(t, [DROP - 0.5, DROP, DROP + 5 / 60], [1, 0.85, 1.1], clamp);
  const cam = t < DROP + 5 / 60 ? inhale : 1.0 + 0.1 * kickEnv(t) + 0.02;
  const amp = chaos ? 5 + 16 * kickEnv(t) : 0, f = t * 60;
  const sx = Math.sin(f * 0.8) * amp, sy = Math.cos(f * 0.9) * amp;
  const ki = lastKick(t), flash = chaos && ki >= 0 && t - K[ki] < 15 / 60 ? FLASH[ki] : undefined;
  return (
    <AbsoluteFill style={{ background: '#050510', overflow: 'hidden' }}>
      <Audio src={staticFile(AUDIO)} />
      <AbsoluteFill style={{ transform: `scale(${cam}) translate(${sx}px, ${sy}px)`, transformOrigin: 'center center' }}>
        {morning ? (
          <>
            <Img src={staticFile('plates/bg_dawn_desk.jpg')} style={{ position: 'absolute', left: 0, top: -8, width: 1080, height: 1935, objectFit: 'cover',
              opacity: interpolate(t, [0, 1], [0.45, 0.72], clamp), transform: `scale(${1 + 0.06 * (t / DROP)})`, transformOrigin: '50% 70%' }} />
            <AbsoluteFill style={{ background: 'linear-gradient(180deg, rgba(5,5,16,.55) 0%, rgba(5,5,16,.1) 35%, rgba(5,5,16,.35) 100%)' }} />
            <CodeWindow t={t} />
            <div style={{ position: 'absolute', top: '15%', width: '100%', textAlign: 'center', color: '#fff', font: `200 62px ${FONT.ui}`, letterSpacing: '0.06em',
              opacity: interpolate(t, [100 / 60, 130 / 60, DROP - 0.5, DROP], [0, 1, 1, 0], clamp), textShadow: '0 2px 24px rgba(0,0,0,.6)' }}>
              STATUS: COMMUTING &amp; CODING
            </div>
          </>
        ) : null}
        {chaos ? (
          <>
            <Img src={staticFile('plates/bg_server_aisle.jpg')} style={{ position: 'absolute', left: 0, top: -8, width: 1080, height: 1935, objectFit: 'cover', opacity: 0.6 + 0.3 * kickEnv(t), filter: 'hue-rotate(45deg) contrast(150%)' }} />
            <Binary t={t} />
            <AbsoluteFill style={{ background: '#ff0033', opacity: 0.18 * kickEnv(t), mixBlendMode: 'screen' }} />
            <Incident t={t} />
            {flash === 'acc' ? <Accepted /> : flash === 'term' ? <Terminal t={t} t0={K[ki]} /> : flash === 'err' ? <Terminal t={t} t0={K[ki]} err /> : null}
            <Escalation t={t} />
          </>
        ) : null}
      </AbsoluteFill>
      {t >= SNAP ? <LogOff t={t} /> : null}
    </AbsoluteFill>
  );
};

function LogOff({ t }: { t: number }) {
  const n = TL.exitT.filter((x) => x <= t).length, enter = TL.exitT[TL.exitT.length - 1] + 0.45;
  const blink = Math.floor((t * 60) / 15) % 2 === 0;
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      {/* a monitor still warm in the dark: a breathing cyan glow + drifting scanlines (keeps the last frames alive) */}
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 70% 30% at 40% 48%, rgba(0,255,255,${0.07 + 0.05 * Math.sin(t * 7)}) 0%, rgba(0,0,0,0) 70%)` }} />
      <AbsoluteFill style={{ backgroundImage: 'repeating-linear-gradient(180deg, rgba(0,255,255,.05) 0px, rgba(0,255,255,.05) 2px, rgba(0,0,0,0) 2px, rgba(0,0,0,0) 7px)', backgroundPositionY: `${(t * 60) % 7}px`, opacity: 0.8 }} />
      <div style={{ position: 'absolute', top: '45%', left: '7%', right: '5%', font: `500 50px/1.6 ${FONT.mono}`, color: '#00FFFF', transformOrigin: '20% 50%',
        transform: `scale(${1 + 0.07 * Math.min(1, (t - SNAP) / 2.1)})`, textShadow: `0 0 ${12 + 6 * Math.sin(t * 9)}px rgba(0,255,255,.5)` }}>
        <div>~/developer/day_14 $ {TL.exit.slice(0, n)}{t < enter && blink ? '_' : ''}</div>
        {t >= enter ? <div style={{ color: '#5f7f88' }}>logout{blink ? '_' : ''}</div> : null}
      </div>
    </AbsoluteFill>
  );
}
