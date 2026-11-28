// The foreground: a chaotic gaming-news broadcast over the obby run. Every number/quote from docs/factcheck.md; the
// receipts are the real captured news pages. No Bisleri logo or bottle design: a generic bottle only.
import React from 'react';
import { Img, staticFile } from 'remotion';
import { ev, TL } from '../tl';

const F = { d: 'Archivo, Inter, sans-serif', u: 'Inter, sans-serif', m: '"JetBrains Mono", monospace' };
const RED = '#E10600', YEL = '#FFD400', INK = '#0B0B12', GRN = '#14C46B';
const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const eo = (x: number) => 1 - (1 - clamp(x)) ** 3;
/** lands from oversize */
const land = (t: number, at: number, d = 0.2) => { const p = clamp((t - at) / d); return p <= 0 ? 0 : 1 + (1 - eo(p)) * 0.7; };
const on = (t: number, a: string, b?: string) => t >= ev(a) && (b === undefined || t < ev(b));
const SC = (id: string) => TL.scenes.find((s) => s.id === id)!;

/** a crop of a real captured page (900 CSS px wide @2x), with an optional highlight box (CSS px of the capture) */
const Receipt: React.FC<{ t: number; at: string; src: string; site: string; cropY: number; cropH: number; hl?: { x: number; y: number; w: number; h: number }; top: number; tilt?: number; label?: string }> = ({ t, at, src, site, cropY, cropH, hl, top, tilt = -2, label }) => {
  if (t < ev(at)) return null;
  const s = land(t, ev(at), 0.22), W = 900, k = W / 900, hp = eo((t - ev(at) - 0.3) / 0.35);
  return (
    <div style={{ position: 'absolute', left: 90, top, width: W, transform: `scale(${s}) rotate(${tilt}deg)`, borderRadius: 18, overflow: 'hidden', background: '#fff', border: `6px solid ${INK}`, boxShadow: `10px 10px 0 ${INK}` }}>
      <div style={{ height: 44, background: INK, color: '#fff', display: 'flex', alignItems: 'center', gap: 12, padding: '0 16px', fontFamily: F.u, fontWeight: 800, fontSize: 22 }}>
        <span style={{ background: YEL, color: INK, borderRadius: 6, padding: '2px 10px' }}>SOURCE</span>{site}{label && <span style={{ marginLeft: 'auto', color: YEL }}>{label}</span>}
      </div>
      <div style={{ position: 'relative', height: cropH * k, overflow: 'hidden' }}>
        <Img src={staticFile(src)} style={{ position: 'absolute', left: 0, top: -cropY * k, width: W }} />
        {hl && <div style={{ position: 'absolute', left: hl.x * k - 6, top: (hl.y - cropY) * k - 4, width: (hl.w * k + 12) * hp, height: hl.h * k + 8, background: 'rgba(255,212,0,0.42)', mixBlendMode: 'multiply' }} />}
      </div>
    </div>
  );
};

const Stamp: React.FC<{ t: number; at: string; text: string; top: number; rot?: number; color?: string; size?: number }> = ({ t, at, text, top, rot = -8, color = RED, size = 120 }) => {
  if (t < ev(at)) return null;
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top, display: 'flex', justifyContent: 'center', zIndex: 6 }}>
      <div style={{ transform: `scale(${land(t, ev(at), 0.14) * 1}) rotate(${rot}deg)`, border: `12px solid ${color}`, color, borderRadius: 22, padding: '6px 34px',
        fontFamily: F.d, fontWeight: 900, fontSize: size, letterSpacing: 2, background: 'rgba(255,255,255,0.88)', textShadow: '0 0 0 #000' }}>{text}</div>
    </div>
  );
};

const Chip: React.FC<{ t: number; at: string; text: string; top: number; bg?: string; fg?: string }> = ({ t, at, text, top, bg = INK, fg = '#fff' }) => {
  if (t < ev(at)) return null;
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top, display: 'flex', justifyContent: 'center' }}>
      <div style={{ transform: `scale(${land(t, ev(at), 0.18)})`, background: bg, color: fg, border: `5px solid ${INK}`, borderRadius: 22, padding: '12px 28px', fontFamily: F.d, fontWeight: 900, fontSize: 46, boxShadow: `8px 8px 0 ${INK}` }}>{text}</div>
    </div>
  );
};

/** a simple drawn reaction face (no copyrighted memes) */
const Face: React.FC<{ kind: 'skull' | 'cry' | 'shock' | 'closed'; size: number }> = ({ kind, size }) => (
  <svg width={size} height={size} viewBox="0 0 100 100">
    {kind === 'skull' ? (
      <g><path d="M 50 8 C 22 8 12 30 14 52 C 15 64 24 68 28 70 L 30 88 L 70 88 L 72 70 C 76 68 85 64 86 52 C 88 30 78 8 50 8 Z" fill="#F5F5F5" stroke={INK} strokeWidth={4} />
        <circle cx={35} cy={48} r={10} fill={INK} /><circle cx={65} cy={48} r={10} fill={INK} /><path d="M 46 62 L 50 54 L 54 62 Z" fill={INK} />
        {[38, 46, 54, 62].map((x) => <rect key={x} x={x - 2} y={76} width={4} height={10} fill={INK} />)}</g>
    ) : (
      <g><circle cx={50} cy={50} r={44} fill="#FFCC33" stroke={INK} strokeWidth={4} />
        {kind === 'closed' ? <g stroke={INK} strokeWidth={5} fill="none"><path d="M 26 44 Q 34 50 42 44" /><path d="M 58 44 Q 66 50 74 44" /></g>
          : <g fill={INK}><circle cx={34} cy={42} r={kind === 'shock' ? 8 : 6} /><circle cx={66} cy={42} r={kind === 'shock' ? 8 : 6} /></g>}
        {kind === 'cry' && <g fill="#4FC3F7"><path d="M 30 50 Q 26 66 32 70 Q 38 66 34 50 Z" /><path d="M 66 50 Q 62 66 68 70 Q 74 66 70 50 Z" /></g>}
        {kind === 'shock' ? <ellipse cx={50} cy={70} rx={10} ry={13} fill={INK} /> : kind === 'cry' ? <path d="M 34 76 Q 50 62 66 76" stroke={INK} strokeWidth={5} fill="none" /> : <path d="M 32 66 Q 50 80 68 66" stroke={INK} strokeWidth={5} fill="none" />}</g>
    )}
  </svg>
);
const React_: React.FC<{ t: number; at: string; kind: 'skull' | 'cry' | 'shock' | 'closed'; x: number; y: number; size?: number }> = ({ t, at, kind, x, y, size = 190 }) => {
  if (t < ev(at) || t > ev(at) + 2.4) return null;
  const u = t - ev(at), wob = Math.sin(u * 14) * 8 * Math.exp(-u * 2);
  return <div style={{ position: 'absolute', left: x, top: y, transform: `scale(${land(t, ev(at), 0.16)}) rotate(${wob}deg)`, opacity: 1 - clamp((u - 2.0) / 0.4), zIndex: 7 }}><Face kind={kind} size={size} /></div>;
};

/** a generic, unbranded water bottle */
const Bottle: React.FC<{ x: number; y: number; h: number; children?: React.ReactNode }> = ({ x, y, h, children }) => (
  <div style={{ position: 'absolute', left: x, top: y, width: h * 0.42, height: h }}>
    <svg width={h * 0.42} height={h} viewBox="0 0 42 100" style={{ position: 'absolute', inset: 0 }}>
      <rect x={15} y={0} width={12} height={8} rx={2} fill="#1565C0" />
      <path d="M 14 8 L 28 8 L 30 18 C 38 22 40 28 40 36 L 40 94 C 40 97 38 100 35 100 L 7 100 C 4 100 2 97 2 94 L 2 36 C 2 28 4 22 12 18 Z" fill="rgba(179,229,252,0.55)" stroke="#E3F2FD" strokeWidth={1.4} />
      <rect x={2} y={44} width={38} height={30} fill="#FFFFFF" opacity={0.9} />
    </svg>
    <div style={{ position: 'absolute', left: 0, right: 0, top: h * 0.44, height: h * 0.3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{children}</div>
  </div>
);

const Glitch: React.FC<{ t: number }> = ({ t }) => {
  const hits = [ev('scratch'), ev('breakIn'), ev('twist'), ev('reply'), ev('pipe'), ev('ask'), ev('qaFail'), ev('unsafe2')];
  const g = hits.map((h) => t - h).find((u) => u >= 0 && u < 0.22);
  if (g === undefined) return null;
  const bands = [0.18, 0.41, 0.63, 0.82];
  return (
    <>
      {bands.map((b, i) => (
        <div key={i} style={{ position: 'absolute', left: 0, right: 0, top: `${b * 100}%`, height: 26 + i * 8, background: i % 2 ? 'rgba(255,0,80,0.35)' : 'rgba(0,255,230,0.3)', transform: `translateX(${(i % 2 ? 1 : -1) * 60 * (1 - g / 0.22)}px)`, mixBlendMode: 'screen', zIndex: 9 }} />
      ))}
      <div style={{ position: 'absolute', inset: 0, background: '#fff', opacity: 0.18 * (1 - g / 0.22), zIndex: 9 }} />
    </>
  );
};

const TopBar: React.FC<{ t: number }> = ({ t }) => {
  const tick = 'BREAKING · FSSAI ne Bisleri ke ek packaged water sample ko unsafe declare kiya · prosecution sanctioned · Bisleri: "water safe hai" · case court mein jaayega · koi recall announce nahi · ';
  const x = -((t * 180) % 2400);
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: 232, height: 112, zIndex: 8 }}>
      <div style={{ height: 64, display: 'flex', alignItems: 'center', background: RED, borderTop: `5px solid ${INK}`, borderBottom: `5px solid ${INK}` }}>
        <div style={{ background: YEL, color: INK, height: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '0 20px', fontFamily: F.d, fontWeight: 900, fontSize: 34 }}>
          <span style={{ width: 18, height: 18, borderRadius: 9, background: RED, opacity: (t * 2) % 1 < 0.6 ? 1 : 0.2 }} /> LIVE
        </div>
        <div style={{ color: '#fff', fontFamily: F.d, fontWeight: 900, fontSize: 34, paddingLeft: 18, letterSpacing: 1 }}>TECH PE TREK · GAMING NEWS</div>
      </div>
      <div style={{ height: 44, background: INK, overflow: 'hidden', position: 'relative' }}>
        <div style={{ position: 'absolute', left: x, top: 6, whiteSpace: 'nowrap', color: YEL, fontFamily: F.u, fontWeight: 800, fontSize: 26 }}>{tick + tick + tick}</div>
      </div>
    </div>
  );
};

export const Overlay: React.FC<{ t: number }> = ({ t }) => {
  const s = (id: string) => t >= SC(id).start && t < SC(id).end;
  const meter = clamp((t - ev('bromate')) / (ev('limit') - ev('bromate') + 0.2)) * 12;
  const rows = [1, 2, 3, 4, 5, 6];
  const hp = t < ev('pahs') ? 1 : t < ev('unsafe2') ? 1 : 1 - 0.0 * (t - ev('unsafe2'));
  return (
    <>
      {t >= ev('breakIn') - 0.05 && <TopBar t={t} />}
      {/* HOOK */}
      {s('hook') && (
        <>
          <div style={{ position: 'absolute', left: 50, right: 50, top: 420, textAlign: 'center', transform: `scale(${land(t, 0, 0.25) || 1}) rotate(${t < ev('scratch') ? Math.sin(t * 6) * 2 : -6}deg)` }}>
            <div style={{ fontFamily: F.d, fontWeight: 900, fontSize: 112, lineHeight: 0.95, color: '#fff', WebkitTextStroke: `6px ${INK}`, paintOrder: 'stroke', textShadow: `8px 8px 0 ${INK}` }}>HELLOOO</div>
            <div style={{ fontFamily: F.d, fontWeight: 900, fontSize: 70, color: YEL, WebkitTextStroke: `5px ${INK}`, paintOrder: 'stroke', marginTop: 10 }}>paani ke pyaase developers!</div>
          </div>
          {t >= ev('scratch') && t < ev('scratch') + 0.7 && <div style={{ position: 'absolute', left: 0, right: 0, top: 760, textAlign: 'center', fontFamily: F.d, fontWeight: 900, fontSize: 64, color: RED, WebkitTextStroke: `4px #fff`, paintOrder: 'stroke', transform: `scale(${land(t, ev('scratch'), 0.1)}) rotate(4deg)` }}>*RECORD SCRATCH*</div>}
          {t >= ev('bugs') && (
            <Bottle x={540 - 125} y={760} h={600}>
              <div style={{ fontSize: 70 }}>🐛</div>
            </Bottle>
          )}
          {t >= ev('bugs') && [0, 1, 2, 3].map((i) => {
            const u = t - ev('bugs');
            return <div key={i} style={{ position: 'absolute', left: 440 + Math.sin(u * 3 + i * 1.7) * 70, top: 960 + i * 70 + Math.cos(u * 2.4 + i) * 30, fontSize: 46, transform: `rotate(${Math.sin(u * 5 + i) * 30}deg)` }}>🐛</div>;
          })}
        </>
      )}
      {/* BREAKING */}
      {s('breaking') && (
        <>
          <div style={{ position: 'absolute', left: 0, right: 0, top: 380, textAlign: 'center', transform: `scale(${land(t, ev('breakIn'), 0.16)}) rotate(-3deg)` }}>
            <span style={{ background: RED, color: '#fff', fontFamily: F.d, fontWeight: 900, fontSize: 108, padding: '6px 30px', border: `8px solid ${INK}`, boxShadow: `10px 10px 0 ${INK}` }}>BREAKING</span>
          </div>
          <Receipt t={t} at="breakIn" src="receipts/southmatters_head.png" site="southmatters.com · 23 Nov 2026" cropY={110} cropH={150} hl={{ x: 14, y: 147, w: 872, h: 62 }} top={560} />
          <Stamp t={t} at="unsafe" text="SAMPLE: UNSAFE" top={790} size={96} />
          <Chip t={t} at="prosecution" text="⚖️ PROSECUTION SANCTIONED (FSSAI)" top={960} bg={YEL} fg={INK} />
          <React_ t={t} at="trust" kind="closed" x={120} y={1040} />
          {t >= ev('trust') && <div style={{ position: 'absolute', left: 340, top: 1080, fontFamily: F.d, fontWeight: 900, fontSize: 52, color: '#fff', WebkitTextStroke: `4px ${INK}`, paintOrder: 'stroke', transform: `scale(${land(t, ev('trust'), 0.18)})` }}>"aankh band trust" 😵</div>}
        </>
      )}
      {/* TESTS */}
      {s('tests') && (
        <>
          <Receipt t={t} at="stmt" src="receipts/onmanorama_body.png" site="onmanorama.com" label="Bisleri's statement" cropY={760} cropH={160} hl={{ x: 105, y: 796, w: 690, h: 108 }} top={380} tilt={2} />
          {t >= ev('samples') && (
            <div style={{ position: 'absolute', left: 90, top: 620, width: 900, background: '#0D1117', border: `6px solid ${INK}`, borderRadius: 18, padding: '18px 26px', boxShadow: `10px 10px 0 ${INK}`, transform: `scale(${land(t, ev('samples'), 0.2)})`, fontFamily: F.m }}>
              <div style={{ color: '#8B949E', fontSize: 26, marginBottom: 8 }}>$ fssai test · goa plant · 30 sep 2025 (as per Bisleri)</div>
              {rows.map((r) => {
                const passAt = ev('pass5') + (r - 1) * 0.12, sixth = r === 6;
                const st = sixth ? (t >= ev('limit') ? 'fail' : t >= ev('bromate') ? 'run' : 'wait') : t >= passAt ? 'pass' : 'wait';
                return (
                  <div key={r} style={{ fontSize: 34, fontWeight: 800, color: st === 'pass' ? '#3FB950' : st === 'fail' ? '#F85149' : st === 'run' ? YEL : '#6E7681' }}>
                    {st === 'pass' ? '✓' : st === 'fail' ? '✗' : st === 'run' ? '◌' : '·'} sample_{r} {sixth && t >= ev('bromate') ? `bromate ${meter.toFixed(0)} µg/L` : st === 'pass' ? 'all standards met' : ''}
                  </div>
                );
              })}
              {t >= ev('fail1') && <div style={{ marginTop: 10, fontSize: 36, fontWeight: 900, color: '#fff' }}>Tests: <span style={{ color: '#3FB950' }}>5 passed</span>, <span style={{ color: '#F85149' }}>1 failed</span></div>}
            </div>
          )}
          {t >= ev('bromate') && (
            <div style={{ position: 'absolute', left: 90, top: 1085, width: 900, transform: `scale(${land(t, ev('bromate'), 0.2)})` }}>
              <div style={{ height: 54, background: '#fff', border: `5px solid ${INK}`, borderRadius: 14, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${(meter / 15) * 100}%`, background: meter > 10 ? RED : '#29B6F6' }} />
                <div style={{ position: 'absolute', left: `${(10 / 15) * 100}%`, top: -4, bottom: -4, width: 6, background: INK }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: F.d, fontWeight: 900, fontSize: 30, color: '#fff', WebkitTextStroke: `3px ${INK}`, paintOrder: 'stroke', marginTop: 4 }}>
                <span>bromate µg/L</span><span>limit 10 · reading {meter.toFixed(0)}</span>
              </div>
            </div>
          )}
          <Stamp t={t} at="qaFail" text="QA FAILED" top={760} size={130} />
          <React_ t={t} at="qaFail" kind="skull" x={760} y={420} size={210} />
        </>
      )}
      {/* BOSS */}
      {s('boss') && (
        <>
          {t >= ev('appeal') && (
            <div style={{ position: 'absolute', left: 90, top: 400, width: 900, background: '#fff', border: `6px solid ${INK}`, borderRadius: 18, padding: '18px 26px', boxShadow: `10px 10px 0 ${INK}`, transform: `scale(${land(t, ev('appeal'), 0.2)})` }}>
              <div style={{ fontFamily: F.d, fontWeight: 900, fontSize: 44, color: INK }}>APPEAL → REFERRAL LAB</div>
              {t >= ev('bromOk') && <div style={{ fontFamily: F.d, fontWeight: 900, fontSize: 42, color: GRN, transform: `scale(${land(t, ev('bromOk'), 0.16)})`, transformOrigin: 'left' }}>✓ bromate: limit ke andar</div>}
              {t >= ev('pahs') && <div style={{ fontFamily: F.d, fontWeight: 900, fontSize: 42, color: RED, transform: `scale(${land(t, ev('pahs'), 0.16)})`, transformOrigin: 'left' }}>✗ PAHs detected</div>}
              <div style={{ fontFamily: F.u, fontWeight: 700, fontSize: 22, color: '#555', marginTop: 6 }}>FSSAI: "several PAHs can be toxic when they cross safe levels" · via southmatters.com</div>
            </div>
          )}
          {t >= ev('pahs') && (
            <div style={{ position: 'absolute', left: 90, top: 720, width: 900, transform: `scale(${land(t, ev('pahs'), 0.2)}) translateX(${t > ev('boss') && t < ev('boss') + 1 ? Math.sin(t * 60) * 8 : 0}px)` }}>
              <div style={{ fontFamily: F.d, fontWeight: 900, fontSize: 50, color: '#fff', WebkitTextStroke: `5px ${INK}`, paintOrder: 'stroke' }}>FINAL BOSS: PAHs 👾</div>
              <div style={{ height: 40, border: `5px solid ${INK}`, background: '#3B1F4F', borderRadius: 10, overflow: 'hidden' }}>
                <div style={{ width: `${hp * 100}%`, height: '100%', background: 'linear-gradient(90deg,#B04BFF,#FF2E88)' }} />
              </div>
            </div>
          )}
          <Stamp t={t} at="unsafe2" text="PHIR SE UNSAFE" top={900} size={100} />
          <React_ t={t} at="boss" kind="shock" x={110} y={980} size={200} />
        </>
      )}
      {/* REPLY + FACTS */}
      {s('reply') && (
        <>
          <Receipt t={t} at="reply" src="receipts/e4m_head.png" site="exchange4media.com · 23 Nov 2026" cropY={150} cropH={190} hl={{ x: 105, y: 181, w: 690, h: 126 }} top={380} tilt={-1.5} />
          {t >= ev('reply') + 0.5 && (
            <div style={{ position: 'absolute', left: 90, top: 640, width: 900, background: '#E8FFF1', border: `6px solid ${INK}`, borderRadius: 18, padding: '16px 24px', boxShadow: `10px 10px 0 ${INK}`, transform: `scale(${land(t, ev('reply') + 0.5, 0.2)})` }}>
              <div style={{ fontFamily: F.u, fontWeight: 900, fontSize: 30, color: '#0B6B3A' }}>BISLERI KA JAWAB</div>
              <div style={{ fontFamily: F.u, fontWeight: 800, fontSize: 36, color: INK, lineHeight: 1.2 }}>"A trusted brand for years, Bisleri remains safe for consumption"</div>
              <div style={{ fontFamily: F.u, fontWeight: 700, fontSize: 26, color: '#2E5E45', marginTop: 6 }}>independent FSSAI-approved lab: bromate within limit (company says)</div>
            </div>
          )}
          <Chip t={t} at="fGoa" text="📍 1 sample · Goa · Sept 2025" top={900} />
          <Chip t={t} at="fCourt" text="⚖️ case → court · conviction nahi" top={1000} bg={YEL} fg={INK} />
          <Chip t={t} at="fRecall" text="🚫 koi recall announce nahi" top={1100} />
        </>
      )}
      {/* PIPELINE */}
      {s('pipeline') && (
        <>
          <div style={{ position: 'absolute', left: 0, right: 0, top: 390, textAlign: 'center', fontFamily: F.d, fontWeight: 900, fontSize: 70, color: '#fff', WebkitTextStroke: `5px ${INK}`, paintOrder: 'stroke', transform: `scale(${land(t, ev('pipe'), 0.2)})` }}>
            {t < ev('ci') ? 'deploy se pehle: testing' : 'bottle se pehle: CI/CD 😭'}
          </div>
          <Bottle x={540 - 200} y={500} h={950}>
            <div style={{ fontFamily: F.m, fontWeight: 800, fontSize: 27, color: INK, textAlign: 'left', lineHeight: 1.3 }}>
              {['build ✓', 'test: bromate', 'test: PAHs', 'deploy: sip'].map((s2, i) => {
                const at = ev('ci') + 0.35 + i * 0.45, done = t >= at;
                return <div key={i} style={{ color: !done ? '#999' : i === 3 ? '#0B6B3A' : '#0B6B3A' }}>{done ? '●' : '○'} {s2}{done && i > 0 && i < 3 ? ' …' : ''}</div>;
              })}
            </div>
          </Bottle>
        </>
      )}
      {/* CTA */}
      {s('cta') && (
        <>
          <div style={{ position: 'absolute', left: 90, top: 420, width: 900, background: '#fff', border: `6px solid ${INK}`, borderRadius: 22, padding: '22px 28px', boxShadow: `10px 10px 0 ${INK}`, transform: `scale(${land(t, ev('ask'), 0.2)})` }}>
            <div style={{ fontFamily: F.d, fontWeight: 900, fontSize: 50, color: INK }}>POLL: aap kya karoge?</div>
            {[['opt1', '🤝 Bisleri pe trust'], ['opt2', '🧪 paani bhi test karke']].map(([k, label]) => (
              <div key={k} style={{ marginTop: 14, padding: '14px 20px', borderRadius: 16, border: `5px solid ${INK}`, background: t >= ev(k) ? YEL : '#F1F1F1', fontFamily: F.d, fontWeight: 900, fontSize: 44, color: INK, transform: `scale(${t >= ev(k) ? land(t, ev(k), 0.16) : 1})` }}>{label}</div>
            ))}
            <div style={{ marginTop: 12, fontFamily: F.u, fontWeight: 800, fontSize: 30, color: '#555' }}>comment mein batao 👇</div>
          </div>
          {t >= ev('brand') && (
            <div style={{ position: 'absolute', left: 0, right: 0, top: 860, display: 'flex', flexDirection: 'column', alignItems: 'center', transform: `scale(${land(t, ev('brand'), 0.22)})` }}>
              <Img src={staticFile('brand/techpe-trek.jpg')} style={{ width: 200, height: 200, borderRadius: 40, border: `6px solid ${INK}` }} />
              <div style={{ marginTop: 14, fontFamily: F.d, fontWeight: 900, fontSize: 52, color: '#fff', WebkitTextStroke: `5px ${INK}`, paintOrder: 'stroke' }}>complex tech, simple aur interesting</div>
            </div>
          )}
        </>
      )}
      <Glitch t={t} />
    </>
  );
};
