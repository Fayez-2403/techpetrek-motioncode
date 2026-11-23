// FACT 2: good websites keep a hash, not your password. Login card -> one-way machine -> 64 characters (the stored
// hash). Login: type again -> same hash -> MATCH. One letter wrong -> a totally different hash (only 6 of 64 match).
import React from 'react';
import { C, FONT } from '../themes/tokens';
import { ev } from '../tl';
import { clamp, easeInOutCubic, easeOutCubic, lerp } from '../animation/anim';
import { Receipt, land } from './Kit';
import DEMO from '../config/demo.json';

const H = DEMO.hash;
const rows = (h: string) => [h.slice(0, 32), h.slice(32)];

const HashBlock: React.FC<{ t: number; at: number; h: string; y: number; label: string; cmp?: string; d?: number }> = ({ t, at, h, y, label, cmp, d = 0.7 }) => {
  if (t < at) return null;
  const n = Math.round(64 * clamp((t - at) / d));
  return (
    <div style={{ position: 'absolute', left: 80, right: 80, top: y, transform: `scale(${land(t, at, 0.18)})` }}>
      <div style={{ fontFamily: FONT.ui, fontWeight: 800, fontSize: 26, color: C.dim, marginBottom: 4, textAlign: 'center' }}>{label}</div>
      {rows(h).map((r, ri) => (
        <div key={ri} style={{ fontFamily: FONT.mono, fontWeight: 800, fontSize: 34, letterSpacing: 1, textAlign: 'center', lineHeight: 1.25 }}>
          {r.split('').map((ch, i) => {
            const k = ri * 32 + i; if (k >= n) return <span key={i} style={{ opacity: 0 }}>{ch}</span>;
            const col = cmp ? (cmp[k] === ch ? C.haan : C.na) : C.scale;
            return <span key={i} style={{ color: col }}>{ch}</span>;
          })}
        </div>
      ))}
    </div>
  );
};

export const Hash: React.FC<{ t: number }> = ({ t }) => {
  const inn = ev('hIn'), out = ev('hOut'), login = ev('hLogin'), type = ev('hType'), match = ev('hMatch'), wrong = ev('hWrong'), diff = ev('hDiff');
  const gear = (t - ev('hMachine')) * 220;
  const field = t < login ? '••••••••••••' : t < wrong ? 'password123'.slice(0, Math.round(11 * clamp((t - type) / 0.5))) : 'password12' + '4';
  const flyP = easeInOutCubic(clamp((t - inn) / 0.6));
  const running = (t > inn + 0.3 && t < out + 0.5) || (t > type + 0.4 && t < match) || (t > wrong + 0.3 && t < diff + 0.3);
  return (
    <>
      <Receipt id="owasp_hash" t={t} at={ev('hSrc')} />
      {/* login card */}
      <div style={{ position: 'absolute', left: 80, top: 450, width: 420, height: 300, transform: `scale(${land(t, ev('hQ'), 0.22)})`, background: C.paper,
        border: `5px solid ${C.ink}`, borderRadius: 26, padding: '22px 26px' }}>
        <div style={{ fontFamily: FONT.display, fontWeight: 900, fontSize: 44, color: C.ink }}>Login</div>
        <div style={{ marginTop: 14, height: 62, borderRadius: 14, border: '3px solid #C9CBE0', fontFamily: FONT.ui, fontSize: 28, color: '#6A6D88', display: 'flex', alignItems: 'center', padding: '0 16px' }}>bro@example.com</div>
        <div style={{ marginTop: 14, height: 62, borderRadius: 14, border: `3px solid ${t >= wrong ? C.na : '#C9CBE0'}`, fontFamily: FONT.mono, fontWeight: 800, fontSize: 30, color: C.ink, display: 'flex', alignItems: 'center', padding: '0 16px' }}>
          {t >= wrong ? <span>password12<span style={{ color: C.na }}>4</span></span> : field}
        </div>
      </div>
      {/* the password flying into the machine */}
      {t >= inn && flyP < 1 && (
        <div style={{ position: 'absolute', left: lerp(110, 640, flyP), top: lerp(650, 560, flyP) - Math.sin(flyP * Math.PI) * 120, fontFamily: FONT.mono, fontWeight: 900, fontSize: 36,
          color: C.scale, background: C.ink, borderRadius: 12, padding: '4px 12px', opacity: 1 - flyP * 0.3 }}>password123</div>
      )}
      {/* the one-way machine */}
      {t >= ev('hMachine') && (
        <div style={{ position: 'absolute', left: 560, top: 450, width: 440, height: 300, transform: `scale(${land(t, ev('hMachine'), 0.22)})`, background: '#262A6A',
          border: `5px solid ${running ? C.scale : '#3D4290'}`, borderRadius: 26, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <svg width={220} height={150} viewBox="-110 -75 220 150">
            {[[-40, 0, 52, 1], [42, -18, 36, -1.4]].map(([x, y, r, dir], i) => (
              <g key={i} transform={`translate(${x} ${y}) rotate(${running ? gear * dir : 0})`}>
                {Array.from({ length: 10 }, (_, k) => <rect key={k} x={-8} y={-r - 12} width={16} height={22} rx={3} fill={C.scale} transform={`rotate(${k * 36})`} />)}
                <circle r={r} fill={C.scale} /><circle r={r * 0.4} fill="#262A6A" />
              </g>
            ))}
          </svg>
          <div style={{ fontFamily: FONT.display, fontWeight: 900, fontSize: 40, color: '#fff' }}>ONE-WAY</div>
          <div style={{ fontFamily: FONT.mono, fontSize: 22, color: C.dim }}>demo: SHA-256 · asli sites: bcrypt/Argon2</div>
        </div>
      )}
      <HashBlock t={t} at={out} h={H.h1} y={790} label={t >= login ? '🔒 database mein sirf yeh (64 akshar)' : 'bahar: 64 akshar'} />
      {t >= type && t < wrong && <HashBlock t={t} at={type + 0.6} h={H.h1} y={920} label="login pe abhi bana hash" cmp={H.h1} />}
      {t >= wrong && <HashBlock t={t} at={wrong + 0.45} h={H.h2} y={920} label="password124 ka hash" cmp={H.h1} d={0.5} />}
      {t >= match && t < wrong && (
        <div style={{ position: 'absolute', left: 0, right: 0, top: 1040, textAlign: 'center', transform: `scale(${land(t, match, 0.2)})`, fontFamily: FONT.display, fontWeight: 900, fontSize: 48, color: C.haan }}>✓ MATCH, login ho gaya</div>
      )}
      {t >= diff && (
        <div style={{ position: 'absolute', left: 0, right: 0, top: 1040, textAlign: 'center', transform: `scale(${land(t, diff, 0.2)})`, fontFamily: FONT.display, fontWeight: 900, fontSize: 46, color: C.na }}>
          ✗ 64 mein se sirf {H.same_pos} same: poora alag
        </div>
      )}
    </>
  );
};
