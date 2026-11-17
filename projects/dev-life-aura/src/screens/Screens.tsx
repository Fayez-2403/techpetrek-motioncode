// Every screen in the film, built in code with real, readable content from one fictional sample project ("orbit-api").
// Each is a magnified fragment of a dark developer UI seen through a slowly drifting camera (a little perspective,
// monitor glow, sub-pixel scanlines). Example data only: no real company, person, secret or brand UI.
import React from 'react';
import { AbsoluteFill, interpolate } from 'remotion';

export const UI = {
  bg: '#0d1117', panel: '#141a23', line: '#222c3a', text: '#d6dde6', dim: '#7d8896', kw: '#c792ea', str: '#c3e88d', fn: '#82aaff',
  type: '#ffcb6b', num: '#f78c6c', com: '#5c6773', green: '#3fb950', red: '#f85149', amber: '#d29922', cobalt: '#4c8dff',
};
const MONO = "'IBM Plex Mono', 'JetBrains Mono', monospace", SANS = "'Inter', sans-serif";
const cl = (x: number) => Math.min(1, Math.max(0, x));
const h = (n: number) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

// ---------- syntax colouring for TypeScript ----------
const KW = new Set(['import', 'from', 'const', 'async', 'await', 'return', 'if', 'export', 'function', 'let', 'new', 'continue', 'while', 'for', 'of']);
function tsTokens(line: string) {
  const out: { s: string; c: string }[] = []; const re = /(\/\/.*$|\s+|"[^"]*"|`[^`]*`|\d+|[A-Za-z_$][\w$]*|[^\sA-Za-z_$\d"]+)/g; let m;
  while ((m = re.exec(line))) {
    const s = m[0], rest = line.slice(m.index + s.length);
    const c = s.startsWith('//') ? UI.com : KW.has(s) ? UI.kw : s.startsWith('"') || s.startsWith('`') ? UI.str : /^\d+$/.test(s) ? UI.num
      : /^[A-Z]/.test(s) ? UI.type : /^[a-z_$]/.test(s) && rest.startsWith('(') ? UI.fn : /^[a-z_$]/.test(s) && rest.trimStart().startsWith(':') ? '#89ddff' : UI.text;
    out.push({ s, c });
  }
  return out;
}

// ---------- the monitor: camera drift + glow ----------
export const Monitor: React.FC<{ k: number; children: React.ReactNode; tint?: string; seed?: number }> = ({ k, children, tint = UI.cobalt, seed = 1 }) => {
  const rx = interpolate(k, [0, 1], [5, -3.5]), ry = interpolate(k, [0, 1], [-7 + 3 * h(seed), 5]), z = interpolate(k, [0, 1], [1.0, 1.13]);
  return (
    <AbsoluteFill style={{ background: '#05070a', perspective: 1600, overflow: 'hidden' }}>
      <AbsoluteFill style={{ transform: `rotateX(${rx}deg) rotateY(${ry}deg) scale(${z})`, transformOrigin: '50% 45%' }}>
        <AbsoluteFill style={{ background: UI.bg }}>{children}</AbsoluteFill>
      </AbsoluteFill>
      <AbsoluteFill style={{ backgroundImage: 'repeating-linear-gradient(180deg, rgba(255,255,255,.018) 0 1px, transparent 1px 3px)' }} />
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 90% 60% at 50% 40%, ${tint}22 0%, transparent 70%)`, mixBlendMode: 'screen' }} />
      <AbsoluteFill style={{ background: `linear-gradient(115deg, transparent ${interpolate(k, [0, 1], [-30, 60])}%, rgba(255,255,255,.07) ${interpolate(k, [0, 1], [-15, 75])}%, transparent ${interpolate(k, [0, 1], [0, 90])}%)` }} />
    </AbsoluteFill>
  );
};

const Chrome: React.FC<{ file: string; branch?: string; children: React.ReactNode }> = ({ file, branch = 'feat/api-validation', children }) => (
  <AbsoluteFill>
    <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 120, background: UI.panel, borderBottom: `1px solid ${UI.line}`, display: 'flex', alignItems: 'flex-end' }}>
      <div style={{ marginLeft: 40, padding: '18px 30px', background: UI.bg, borderTop: `3px solid ${UI.cobalt}`, font: `500 30px ${MONO}`, color: UI.text }}>{file}</div>
    </div>
    <div style={{ position: 'absolute', left: 0, top: 120, bottom: 64, width: 70, background: UI.panel, borderRight: `1px solid ${UI.line}` }} />
    <div style={{ position: 'absolute', left: 70, right: 0, top: 120, bottom: 64 }}>{children}</div>
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 64, background: '#1f6feb', display: 'flex', alignItems: 'center', gap: 34, padding: '0 34px', font: `500 26px ${MONO}`, color: '#fff' }}>
      <span>⎇ {branch}</span><span>orbit-api</span><span style={{ marginLeft: 'auto' }}>TypeScript</span>
    </div>
  </AbsoluteFill>
);

const ORDERS = `import { z } from "zod";
import { router, db } from "../http";

const Order = z.object({
  sku: z.string().min(3),
  qty: z.number().int().positive(),
});

router.post("/orders", async (req, res) => {
  const body = Order.safeParse(req.body);
  if (!body.success)
    return res.status(400).json(body.error);
  const order = await db.orders.create(body.data);
  res.status(201).json(order);
});`;

const Code: React.FC<{ src: string; chars: number; size?: number; hl?: number[]; caret?: boolean; top?: number }> = ({ src, chars, size = 33, hl = [], caret = true, top = 330 }) => {
  const shown = src.slice(0, chars), lines = shown.split('\n');
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top, font: `400 ${size}px/2.05 ${MONO}` }}>
      {lines.map((ln, i) => (
        <div key={i} style={{ display: 'flex', whiteSpace: 'pre', background: hl.includes(i) ? 'rgba(76,141,255,.14)' : undefined }}>
          <span style={{ width: 70, textAlign: 'right', paddingRight: 22, color: '#465263', flex: 'none' }}>{i + 1}</span>
          <span>{tsTokens(ln).map((t, j) => <span key={j} style={{ color: t.c }}>{t.s}</span>)}</span>
          {caret && i === lines.length - 1 ? <span style={{ display: 'inline-block', width: 3, background: UI.cobalt, marginLeft: 1, boxShadow: `0 0 10px ${UI.cobalt}` }} /> : null}
        </div>
      ))}
    </div>
  );
};

const Term: React.FC<{ lines: { s: string; c?: string; at: number }[]; t: number; title?: string; size?: number }> = ({ lines, t, title = 'zsh · orbit-api', size = 37 }) => (
  <AbsoluteFill style={{ background: '#0a0d12' }}>
    <div style={{ height: 96, display: 'flex', alignItems: 'center', gap: 14, padding: '0 34px', background: UI.panel, borderBottom: `1px solid ${UI.line}` }}>
      {['#ff5f57', '#febc2e', '#28c840'].map((c) => <span key={c} style={{ width: 20, height: 20, borderRadius: 10, background: c }} />)}
      <span style={{ marginLeft: 16, font: `500 28px ${MONO}`, color: UI.dim }}>{title}</span>
    </div>
    <div style={{ padding: '420px 44px 40px', font: `400 ${size}px/1.75 ${MONO}` }}>
      {lines.filter((l) => t >= l.at).map((l, i) => <div key={i} style={{ color: l.c ?? UI.text, whiteSpace: 'pre-wrap' }}>{l.s}</div>)}
      <span style={{ display: 'inline-block', width: 18, height: size + 4, background: Math.floor(t * 2.4) % 2 ? 'transparent' : UI.text, verticalAlign: -6 }} />
    </div>
  </AbsoluteFill>
);

const Badge: React.FC<{ c: string; children: React.ReactNode; big?: boolean }> = ({ c, children, big }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: big ? '14px 28px' : '8px 18px', borderRadius: 999, background: `${c}22`, border: `2px solid ${c}`, color: c, font: `600 ${big ? 40 : 28}px ${SANS}` }}>{children}</span>
);

function Graph({ pts, w, hgt, c, k, max }: { pts: number[]; w: number; hgt: number; c: string; k: number; max: number }) {
  const n = Math.max(2, Math.round(pts.length * k)), p = pts.slice(0, n).map((v, i) => `${(i / (pts.length - 1)) * w},${hgt - (v / max) * hgt}`).join(' ');
  return (
    <svg width={w} height={hgt} style={{ overflow: 'visible' }}>
      {[0.25, 0.5, 0.75].map((g) => <line key={g} x1={0} x2={w} y1={hgt * g} y2={hgt * g} stroke={UI.line} strokeWidth={2} />)}
      <polyline points={p} fill="none" stroke={c} strokeWidth={6} strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 10px ${c})` }} />
    </svg>
  );
}
const series = (a: number[], n = 60) => Array.from({ length: n }, (_, i) => { const x = i / (n - 1); const seg = x * (a.length - 1), j = Math.min(a.length - 2, Math.floor(seg)), f = seg - j; return (a[j] * (1 - f) + a[j + 1] * f) * (1 + 0.06 * (h(i) - 0.5)); });

// ---------- the screens ----------
export const Screen: React.FC<{ id: string; t: number; d: number }> = ({ id, t, d }) => {
  const k = cl(t / d);
  switch (id) {
    case 'cursor': {   // the closing door seam becomes the editor's cursor (payoff 1)
      const c = cl(t / 0.22), ht = interpolate(c, [0, 1], [1920, 52]), w = interpolate(c, [0, 1], [10, 4]);
      return (
        <AbsoluteFill style={{ background: '#000' }}>
          <AbsoluteFill style={{ opacity: c }}><Monitor k={k}><Chrome file="orders.ts"><Code src={'import { z } from "zod";'} chars={Math.floor(cl((t - 0.2) / 0.35) * 24)} /></Chrome></Monitor></AbsoluteFill>
          {c < 1 ? <div style={{ position: 'absolute', left: 540 - w / 2, top: 960 - ht / 2, width: w, height: ht, background: '#cfe3ff', boxShadow: `0 0 40px ${UI.cobalt}` }} /> : null}
        </AbsoluteFill>
      );
    }
    case 'standup': {
      const rows: [string, string, string][] = [['Yesterday', 'Drafted the order schema', UI.green], ['Today', 'Validation + tests for POST /orders', UI.cobalt], ['Blockers', 'None', UI.dim]];
      return (
        <Monitor k={k}>
          <div style={{ position: 'absolute', left: 70, right: 70, top: 400 }}>
            <div style={{ font: `500 30px ${MONO}`, color: UI.dim }}>Team standup · Tue 09:30</div>
            <div style={{ font: `700 76px ${SANS}`, color: UI.text, margin: '14px 0 56px' }}>orbit-api</div>
            {rows.map(([a, b, c], i) => {
              const kk = cl((t - 0.1 - i * 0.32) / 0.22);
              return (
                <div key={a} style={{ opacity: kk, transform: `translateY(${(1 - kk) * 24}px)`, padding: '34px 0', borderTop: `1px solid ${UI.line}` }}>
                  <div style={{ font: `600 30px ${SANS}`, color: c, letterSpacing: '.04em' }}>{a.toUpperCase()}</div>
                  <div style={{ font: `500 52px/1.25 ${SANS}`, color: UI.text, marginTop: 10 }}>{b}</div>
                </div>
              );
            })}
            <div style={{ display: 'flex', gap: 18, marginTop: 50 }}>{['AK', 'MK', 'AR', 'JS', 'You'].map((n, i) => <div key={n} style={{ width: 96, height: 96, borderRadius: 48, display: 'grid', placeItems: 'center', background: ['#2b3a55', '#3a2b55', '#2b5540', '#553a2b', '#1f6feb'][i], font: `600 30px ${SANS}`, color: '#fff', boxShadow: Math.floor(t * 1.6) % 5 === i ? `0 0 0 ${4 + 4 * Math.abs(Math.sin(t * 9))}px ${UI.green}` : 'none' }}>{n}</div>)}</div>
          </div>
        </Monitor>
      );
    }
    case 'calltile': {   // the call grid; our tile ("You · sharing") grows into the editor
      const g = cl((t - d * 0.12) / (d * 0.6)), e = g * g * (3 - 2 * g);
      const tiles = ['AK', 'MK', 'AR', 'You · sharing'];
      return (
        <AbsoluteFill style={{ background: '#090c11' }}>
          {tiles.map((n, i) => {
            const me = i === 3, x = 40 + (i % 2) * 520, y = 420 + Math.floor(i / 2) * 560;
            const L = me ? interpolate(e, [0, 1], [x, 0]) : x, T = me ? interpolate(e, [0, 1], [y, 0]) : y, W = me ? interpolate(e, [0, 1], [480, 1080]) : 480, H = me ? interpolate(e, [0, 1], [520, 1920]) : 520;
            return (
              <div key={n} style={{ position: 'absolute', left: L, top: T, width: W, height: H, borderRadius: me ? 24 * (1 - e) : 24, overflow: 'hidden', background: me ? UI.bg : `linear-gradient(160deg, #1a2230, #0d1117)`,
                boxShadow: me ? `0 0 0 4px ${UI.green}` : `0 0 0 2px ${UI.line}`, opacity: me ? 1 : 1 - e }}>
                {me ? <div style={{ transform: `scale(${interpolate(e, [0, 1], [0.444, 1])})`, transformOrigin: '0 0', width: 1080, height: 1920 }}><Chrome file="orders.ts"><Code src={ORDERS} chars={120} caret={false} /></Chrome></div>
                  : <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}><div style={{ width: 170, height: 170, borderRadius: 85, background: '#2a3446', display: 'grid', placeItems: 'center', font: `600 56px ${SANS}`, color: '#c9d4e3' }}>{n}</div></div>}
                <div style={{ position: 'absolute', left: 18, bottom: 16, font: `500 26px ${SANS}`, color: '#fff', opacity: me ? 1 - e : 1 }}>{n}</div>
              </div>
            );
          })}
          <div style={{ position: 'absolute', top: 250, width: '100%', textAlign: 'center', font: `500 30px ${MONO}`, color: UI.dim, opacity: 1 - e }}>Design review · POST /orders</div>
        </AbsoluteFill>
      );
    }
    case 'editor': return <Monitor k={k}><Chrome file="orders.ts"><Code src={ORDERS} chars={Math.floor(interpolate(k, [0, 0.92], [120, ORDERS.length], { extrapolateRight: 'clamp' }))} /></Chrome></Monitor>;
    case 'tests': return (
      <Monitor k={k} tint={UI.green}><Term t={t} lines={[{ s: '$ npm test -- orders', c: UI.cobalt, at: 0 }, { s: '', at: 0.25 }, { s: ' PASS  src/routes/orders.test.ts', c: UI.green, at: 0.2 },
        { s: '  ✓ creates an order (41 ms)', c: UI.text, at: 0.32 }, { s: '  ✓ rejects qty <= 0 (6 ms)', c: UI.text, at: 0.44 }, { s: '  ✓ rejects a short sku (4 ms)', c: UI.text, at: 0.56 },
        { s: '', at: 0.62 }, { s: 'Tests:  3 passed, 3 total', c: UI.green, at: 0.7 }, { s: 'Time:   1.42 s', c: UI.dim, at: 0.8 }]} /></Monitor>);
    case 'diff': {
      const L: [string, string][] = [['@@ src/routes/orders.ts @@', UI.cobalt], ['  router.post("/orders", async (req, res) => {', UI.dim], ['-   const order = await db.orders.create(req.body);', UI.red],
        ['+   const body = Order.safeParse(req.body);', UI.green], ['+   if (!body.success)', UI.green], ['+     return res.status(400).json(body.error);', UI.green], ['+   const order = await db.orders.create(body.data);', UI.green]];
      return (
        <Monitor k={k}><Chrome file="orders.ts · diff">
          <div style={{ padding: '50px 0', font: `400 30px/1.7 ${MONO}` }}>{L.map(([s, c], i) => <div key={i} style={{ whiteSpace: 'pre', padding: '0 24px', color: c, opacity: cl((t - i * 0.12) / 0.15),
            background: s.startsWith('+') ? 'rgba(63,185,80,.12)' : s.startsWith('-') ? 'rgba(248,81,73,.12)' : undefined }}>{s}</div>)}</div>
          <div style={{ position: 'absolute', left: 30, bottom: 60, font: `500 30px ${MONO}`, color: UI.dim }}><span style={{ color: UI.green }}>+4</span> <span style={{ color: UI.red }}>−1</span> · 1 file changed</div>
        </Chrome></Monitor>
      );
    }
    case 'pr': {
      const ok = k > 0.58, sw = cl((k - 0.58) / 0.08);
      return (
        <Monitor k={k} tint={ok ? UI.green : UI.amber}>
          <div style={{ position: 'absolute', left: 60, right: 60, top: 420 }}>
            <div style={{ font: `500 30px ${MONO}`, color: UI.dim }}>orbit-api · pull request #214</div>
            <div style={{ font: `700 66px/1.2 ${SANS}`, color: UI.text, margin: '16px 0 30px' }}>Validate order payloads</div>
            <div style={{ font: `500 30px ${MONO}`, color: UI.dim, marginBottom: 46 }}>feat/api-validation → main · 2 commits</div>
            <div style={{ padding: 34, borderRadius: 20, background: UI.panel, border: `2px solid ${UI.line}`, opacity: cl((t - 0.3) / 0.2) }}>
              <div style={{ font: `600 30px ${SANS}`, color: '#c9d4e3' }}>MK reviewed</div>
              <div style={{ font: `400 40px/1.35 ${SANS}`, color: UI.text, marginTop: 14 }}>Nice. Can we name it <span style={{ font: `500 36px ${MONO}`, color: UI.type }}>OrderInput</span> so it doesn't clash with the DB model?</div>
            </div>
            <div style={{ marginTop: 36, opacity: cl((k - 0.45) / 0.1), font: `400 32px ${MONO}`, color: UI.dim }}>● You pushed: rename Order → OrderInput</div>
            <div style={{ marginTop: 56, transform: `scale(${1 + 0.06 * Math.sin(sw * Math.PI)})`, transformOrigin: 'left center' }}>
              {ok ? <Badge c={UI.green} big>✓ Approved</Badge> : <Badge c={UI.amber} big>● Changes requested</Badge>}
            </div>
          </div>
        </Monitor>
      );
    }
    case 'bug': return (
      <Monitor k={k} tint={UI.red}>
        <div style={{ position: 'absolute', left: 60, right: 60, top: 460 }}>
          <Badge c={UI.red}>bug</Badge> <Badge c={UI.dim}>api</Badge>
          <div style={{ font: `500 30px ${MONO}`, color: UI.dim, marginTop: 34 }}>BUG-482 · opened by support</div>
          <div style={{ font: `700 70px/1.2 ${SANS}`, color: UI.text, margin: '18px 0 40px' }}>POST /orders accepts <span style={{ font: `600 62px ${MONO}`, color: UI.num }}>qty: -2</span></div>
          <div style={{ padding: '28px 34px', borderRadius: 16, background: '#0a0d12', font: `400 30px/1.6 ${MONO}`, color: UI.text, opacity: cl((t - 0.6) / 0.2) }}>
            <span style={{ color: UI.cobalt }}>$</span> git switch -c feat/api-validation<br /><span style={{ color: UI.dim }}>Switched to a new branch 'feat/api-validation'</span></div>
        </div>
      </Monitor>);
    case 'testfail': {
      const fixed = k > 0.55;
      return (
        <Monitor k={k} tint={fixed ? UI.green : UI.red}>
          <Term t={t} lines={[{ s: '$ npm test -- orders', c: UI.cobalt, at: 0 }, { s: ' FAIL  src/routes/orders.test.ts', c: UI.red, at: 0.25 },
            { s: '  ✕ rejects qty <= 0', c: UI.red, at: 0.4 }, { s: '    Expected status 400, received 201', c: UI.amber, at: 0.5 },
            { s: '', at: d * 0.55 }, { s: '# qty: z.number().int().positive()', c: UI.com, at: d * 0.58 }, { s: '$ npm test -- orders', c: UI.cobalt, at: d * 0.66 },
            { s: ' PASS  src/routes/orders.test.ts  (3/3)', c: UI.green, at: d * 0.8 }]} />
        </Monitor>);
    }
    case 'commit': return (
      <Monitor k={k}><Term t={t} lines={[{ s: '$ git add -A', c: UI.cobalt, at: 0 }, { s: '$ git commit -m "Validate order payloads (BUG-482)"', c: UI.cobalt, at: 0.25 },
        { s: '[feat/api-validation 9f3c2e1] Validate order payloads', c: UI.text, at: 0.45 }, { s: ' 2 files changed, 38 insertions(+), 1 deletion(-)', c: UI.dim, at: 0.55 },
        { s: '$ git push -u origin feat/api-validation', c: UI.cobalt, at: 0.8 }, { s: '→ Pull request #214 opened', c: UI.green, at: 1.15 }]} /></Monitor>);
    case 'cipass': {
      const red = cl((k - 0.8) / 0.2), jobs = ['lint', 'test', 'build', 'integration'];
      return (
        <Monitor k={k} tint={red > 0 ? UI.red : UI.green}>
          <div style={{ position: 'absolute', left: 60, right: 60, top: 460 }}>
            <div style={{ font: `500 30px ${MONO}`, color: UI.dim }}>#214 · checks</div>
            {jobs.map((j, i) => <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 26, padding: '34px 0', borderBottom: `1px solid ${UI.line}`, font: `500 46px ${MONO}`, color: UI.text }}>
              <span style={{ width: 54, height: 54, borderRadius: 27, background: UI.green, display: 'grid', placeItems: 'center', color: '#0d1117', fontSize: 34 }}>✓</span>{j}<span style={{ marginLeft: 'auto', color: UI.dim, fontSize: 32 }}>{['18s', '41s', '1m 02s', '2m 11s'][i]}</span></div>)}
            <div style={{ marginTop: 60 }}><Badge c={UI.green} big>✓ All checks have passed · merged</Badge></div>
          </div>
          {/* the passing badge turns into the red status light of the incident */}
          <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 78%, rgba(255,40,60,${0.85 * red}) 0%, rgba(255,40,60,${0.25 * red}) 30%, transparent 60%)` }} />
        </Monitor>
      );
    }
    case 'dashboard': case 'heal': {
      const heal = id === 'heal';
      const err = heal ? series([7.8, 7.6, 5.2, 2.1, 0.6, 0.2, 0.15]) : series([0.2, 0.2, 0.25, 0.2, 1.4, 4.8, 7.8]);
      const lat = heal ? series([850, 820, 600, 320, 200, 185, 182]) : series([180, 182, 190, 185, 420, 700, 850]);
      const kk = heal ? 1 : cl(t / (d * 0.85)), e = heal ? interpolate(k, [0, 1], [7.8, 0.15]) : err[Math.round((err.length - 1) * kk)], l = heal ? interpolate(k, [0, 1], [850, 182]) : lat[Math.round((lat.length - 1) * kk)];
      const c = heal ? (k > 0.6 ? UI.green : UI.amber) : e > 2 ? UI.red : UI.text;
      return (
        <Monitor k={k} tint={heal ? UI.green : UI.red}>
          <div style={{ position: 'absolute', left: 60, right: 60, top: 280 }}>
            <div style={{ font: `500 30px ${MONO}`, color: UI.dim }}>orbit-api · production · last 30 min</div>
            {!heal && e > 2 ? <div style={{ marginTop: 26 }}><Badge c={UI.red} big>● ALERT · 5xx &gt; 5% for 2m</Badge></div> : heal && k > 0.6 ? <div style={{ marginTop: 26 }}><Badge c={UI.green} big>● Recovered</Badge></div> : <div style={{ height: 96 }} />}
            {[['HTTP 5xx rate', `${e.toFixed(1)}%`, err, 10], ['p95 latency', `${Math.round(l)} ms`, lat, 1000]].map(([lab, val, s, max], i) => (
              <div key={i} style={{ marginTop: 56 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}><span style={{ font: `500 36px ${SANS}`, color: UI.dim }}>{lab as string}</span><span style={{ font: `700 72px ${MONO}`, color: c }}>{val as string}</span></div>
                <div style={{ marginTop: 20 }}><Graph pts={s as number[]} w={960} hgt={300} c={c} k={kk} max={max as number} /></div>
              </div>
            ))}
            <div style={{ marginTop: 30, font: `500 28px ${MONO}`, color: UI.amber }}>▲ deploy v2.14.0 · 18:42</div>
          </div>
        </Monitor>
      );
    }
    case 'channel': {
      const M: [string, string, string][] = [['monitor', 'ALERT 5xx 7.8% · p95 850 ms · since v2.14.0', UI.red], ['You', 'Errors are climbing. Checking the last deploy.', UI.text],
        ['Lead', 'Rollback first. Debug after.', UI.text], ['You', 'Rolling back to v2.13.2 now.', UI.text], ['monitor', 'Incident acknowledged by You · SEV-2', UI.amber]];
      return (
        <Monitor k={k} tint={UI.red}>
          <div style={{ position: 'absolute', left: 50, right: 50, top: 380 }}>
            <div style={{ font: `600 40px ${MONO}`, color: UI.text, paddingBottom: 26, borderBottom: `1px solid ${UI.line}` }}># inc-orbit-api</div>
            {M.map(([who, msg, c], i) => { const kk = cl((t - 0.1 - i * (d * 0.17)) / 0.18); return (
              <div key={i} style={{ display: 'flex', gap: 24, marginTop: 40, opacity: kk, transform: `translateY(${(1 - kk) * 20}px)` }}>
                <div style={{ width: 84, height: 84, flex: 'none', borderRadius: 16, background: who === 'monitor' ? '#3a1d22' : who === 'You' ? '#1f6feb' : '#2b5540', display: 'grid', placeItems: 'center', font: `700 30px ${SANS}`, color: '#fff' }}>{who === 'monitor' ? '!' : who[0]}</div>
                <div><div style={{ font: `700 32px ${SANS}`, color: '#c9d4e3' }}>{who}</div><div style={{ font: `400 42px/1.3 ${SANS}`, color: c, marginTop: 6 }}>{msg}</div></div>
              </div>); })}
          </div>
        </Monitor>
      );
    }
    case 'rollback': return (
      <Monitor k={k} tint={UI.amber}><Term t={t} lines={[{ s: '$ deploy rollback orbit-api --to v2.13.2', c: UI.cobalt, at: 0.35 }, { s: '  draining v2.14.0 … 3/3 pods', c: UI.dim, at: 0.75 },
        { s: '  starting v2.13.2 … 3/3 ready', c: UI.dim, at: 1.05 }, { s: '✓ Rollback complete (48 s)', c: UI.green, at: 1.45 }, { s: '$ git revert --no-edit 7c1d9e4', c: UI.cobalt, at: 1.8 }]} /></Monitor>);
    case 'statuses': {
      const S: [string, string, string][] = [['BUILD PASSED', 'orbit-api:v2.14.1 · 4/4 checks', UI.green], ['DEPLOYED', 'staging → canary 10% → 100%', UI.cobalt], ['HEALTHY', 'p95 182 ms · 5xx 0.1%', UI.green]];
      return (
        <Monitor k={k} tint={UI.green}>
          <div style={{ position: 'absolute', left: 70, right: 70, top: 520 }}>
            {S.map(([a, b, c], i) => { const kk = cl((t - i * (d * 0.28)) / 0.2); return (
              <div key={a} style={{ marginBottom: 70, opacity: kk, transform: `translateX(${(1 - kk) * -40}px)` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 26 }}><span style={{ width: 72, height: 72, borderRadius: 36, background: c, display: 'grid', placeItems: 'center', font: `700 44px ${SANS}`, color: '#0d1117' }}>✓</span>
                  <span style={{ font: `800 84px ${SANS}`, color: c, letterSpacing: '.01em' }}>{a}</span></div>
                <div style={{ font: `500 34px ${MONO}`, color: UI.dim, margin: '12px 0 0 98px' }}>{b}</div>
              </div>); })}
          </div>
        </Monitor>
      );
    }
    case 'judge': {
      const two = k > 0.5, kk = cl((k - 0.5) / 0.1);
      return (
        <Monitor k={k} tint={two ? UI.green : UI.red}>
          <div style={{ position: 'absolute', left: 60, right: 60, top: 420 }}>
            <div style={{ font: `500 30px ${MONO}`, color: UI.dim }}>practice · graphs · medium</div>
            <div style={{ font: `700 66px ${SANS}`, color: UI.text, margin: '14px 0 36px' }}>Shortest Delivery Route</div>
            <div style={{ padding: '26px 30px', borderRadius: 16, background: '#0a0d12', font: `400 30px/1.65 ${MONO}`, color: UI.text, whiteSpace: 'pre' }}>
              {'while (pq.size) {\n  const [d, u] = pq.pop();\n'}<span style={{ background: two ? 'rgba(63,185,80,.18)' : undefined, color: two ? UI.green : UI.dim }}>{two ? '  if (d > dist[u]) continue;' : '  // (missing stale-entry check)'}</span>{'\n  for (const [v, w] of adj[u])\n    relax(u, v, w);\n}'}</div>
            <div style={{ marginTop: 50 }}>{two ? <span style={{ display: 'inline-block', transform: `scale(${1 + 0.08 * Math.sin(kk * Math.PI)})` }}><Badge c={UI.green} big>Accepted · 12/12 tests · 84 ms</Badge></span> : <Badge c={UI.red} big>Wrong Answer · test 7/12</Badge>}</div>
          </div>
        </Monitor>
      );
    }
    default: return <AbsoluteFill style={{ background: '#000' }} />;
  }
};
