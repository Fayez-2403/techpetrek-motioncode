// The story scenes (FACTS.md): release (Oct 21, 1.107.0, release workflow hacked), startup (Microsoft: Python startup is the
// trigger, no import needed), targets (cloud / AI keys / dev secrets; target != theft), rootcause (maintainers' chain:
// May 27 master key -> Oct 10 GitHub tokens -> Oct 21 release), dontrun (no Python / pip inside the suspect env).
import React from 'react';
import { AbsoluteFill } from 'remotion';
import { clamp, easeInOutCubic, easeOutCubic, invLerp, lerp } from '../lib/anim';
import { F } from '../styles/typography';
import { PoisonedPackage } from '../media/PoisonedPackage';
import { EnvCards } from '../media/EnvCards';
import { Bg, Chip, Enter, Flash, K, Kicker, SAFE, Slam, Stamp, Tag, fadeIn, hit, pop, shake, useScene } from './kit';

const Win: React.FC<{ y: number; h: number; children: React.ReactNode; dim?: number; border?: string }> = ({ y, h, children, dim = 0, border = 'rgba(236,239,244,0.18)' }) => (
  <div style={{ position: 'absolute', left: 64, top: y, width: 952, height: h, borderRadius: 26, overflow: 'hidden', border: `2px solid ${border}`,
    boxShadow: '0 30px 80px rgba(0,0,0,0.55)', filter: dim ? `blur(${dim * 8}px) brightness(${1 - 0.55 * dim})` : undefined }}>{children}</div>
);

export const Release: React.FC = () => {
  const { l, dur, at } = useScene('release');
  const lite = at('l1', 'LiteLLM'), ver = at('l1', '1.107.0'), hack = at('l1', 'hacked'), pub = at('l1', 'publish');
  const sk = shake(l, [ver, hack], 12);
  const rib = easeOutCubic(invLerp(hack, hack + 12, l));
  return (
    <Enter l={l} sx={sk.x} sy={sk.y}>
      <Bg glow={K.red} amount={0.3} at="50% 60%" />
      <Kicker text="OCT 21, 2026 · PyPI + DOCKER IMAGES" p={fadeIn(l, 4)} />
      <div style={{ position: 'absolute', left: SAFE.side, right: SAFE.side, top: 340, textAlign: 'center' }}>
        <Slam l={l} at={Math.max(6, lite)} size={120}>LiteLLM</Slam><br />
        <Slam l={l} at={ver} size={130} color={K.red} from={2} style={{ fontFamily: F.mono, fontWeight: 800 }}>v1.107.0</Slam>
      </div>
      <Win y={640} h={620} border={l >= hack ? K.red : undefined}>
        <PoisonedPackage w={952} h={620} f={l} dur={dur} />
      </Win>
      {l >= hack ? (
        <div style={{ position: 'absolute', left: -100, width: 1280, top: 880, height: 96, transform: `rotate(-8deg) translateX(${(1 - rib) * -1300}px)`, background: K.red,
          display: 'flex', alignItems: 'center', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
          <div style={{ whiteSpace: 'nowrap', fontFamily: F.head, fontWeight: 900, fontSize: 52, color: '#fff', transform: `translateX(${-((l - hack) * 4) % 900}px)` }}>
            {'RELEASE WORKFLOW HACKED  ·  '.repeat(6)}
          </div>
        </div>
      ) : null}
      <Tag y={1272} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: 1236, display: 'flex', justifyContent: 'flex-start', paddingLeft: SAFE.side }}>
        <Chip p={pop(l, pub + 6)} text="PyPI pe ~2 ghante live" sub="phir pulled · LiteLLM maintainers" color={K.orange} size={30} />
      </div>
      <Flash l={l} at={0} max={0.3} />
    </Enter>
  );
};

const Box: React.FC<{ p: number; title: string; sub?: string; color?: string; glow?: number; mono?: boolean; children?: React.ReactNode }> = ({ p, title, sub, color = 'rgba(236,239,244,0.3)', glow = 0, mono, children }) => (
  <div style={{ position: 'relative', width: 760, padding: '22px 30px', borderRadius: 20, background: glow ? `rgba(80,10,8,${0.5 + 0.3 * glow})` : 'rgba(16,26,46,0.92)',
    border: `3px solid ${color}`, boxShadow: `0 16px 40px rgba(0,0,0,0.45), 0 0 ${70 * glow}px rgba(255,59,47,${0.7 * glow})`,
    opacity: clamp(p * 1.5), transform: `translateY(${(1 - p) * 30}px) scale(${0.92 + 0.08 * p})` }}>
    <div style={{ fontFamily: mono ? F.mono : F.head, fontWeight: 800, fontSize: mono ? 40 : 44, color: K.lunar, lineHeight: 1.1 }}>{title}</div>
    {sub ? <div style={{ fontFamily: F.mono, fontWeight: 600, fontSize: 22, color: K.steel, marginTop: 6 }}>{sub}</div> : null}
    {children}
  </div>
);
const Arrow: React.FC<{ l: number; on: number; red?: boolean }> = ({ l, on, red }) => (
  <div style={{ height: 46, width: 6, margin: '0 auto', opacity: on, backgroundImage: `repeating-linear-gradient(180deg, ${red ? K.red : K.steel} 0 10px, transparent 10px 18px)`,
    backgroundPositionY: `${(l * 1.5) % 18}px` }} />
);

export const Startup: React.FC = () => {
  const { l, at } = useScene('startup');
  const ms = at('l2', 'Microsoft'), env = at('l2', 'affected'), py = at('l2', 'Python'), mal = at('l2', 'malware'), imp = at('l2', 'Import');
  const red = easeOutCubic(invLerp(mal, mal + 10, l));
  const sk = shake(l, [mal, imp + 6], 12);
  return (
    <Enter l={l} sx={sk.x} sy={sk.y}>
      <Bg glow={K.red} amount={0.15 + 0.3 * red} />
      <Kicker text="MICROSOFT SECURITY RESEARCH · OCT 23" p={fadeIn(l, Math.max(2, ms))} />
      <div style={{ position: 'absolute', left: SAFE.side, right: SAFE.side, top: 340, textAlign: 'center' }}>
        <Slam l={l} at={Math.max(4, py - 4)} size={88}>PYTHON STARTUP</Slam><br />
        <Slam l={l} at={mal} size={88} color={K.red} from={2}>= TRIGGER</Slam>
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 600, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Box p={pop(l, 4)} title="$ python app.py" mono />
        <Arrow l={l} on={fadeIn(l, py - 6)} red={red > 0} />
        <Box p={pop(l, py - 4)} title="Python startup" sub="har run pe, aapke code se pehle" color={red > 0 ? K.red : undefined} glow={red * (0.7 + 0.3 * Math.sin(l / 5))}>
          {red > 0 ? <div style={{ position: 'absolute', right: 24, top: 22, padding: '8px 14px', borderRadius: 10, background: K.red, fontFamily: F.mono, fontWeight: 800, fontSize: 24,
            color: '#fff', transform: `scale(${pop(l, mal, 18, 0.4)})` }}>MALWARE RUN</div> : null}
        </Box>
        <Arrow l={l} on={fadeIn(l, py + 6)} />
        <Box p={pop(l, py + 6)} title="aapka code" sub="(abhi tak chala bhi nahi)" />
        <Arrow l={l} on={fadeIn(l, imp - 10)} />
        <div style={{ position: 'relative' }}>
          <Box p={pop(l, imp - 10)} title="import litellm" mono color={l >= imp ? K.mint : undefined} />
          {l >= imp ? <div style={{ position: 'absolute', left: 20, right: 20, top: '50%', height: 8, background: K.red, transformOrigin: 'left',
            transform: `scaleX(${easeOutCubic(invLerp(imp, imp + 8, l))})`, borderRadius: 4 }} /> : null}
          <div style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}><Stamp l={l} at={imp + 6} text="ZAROORAT NAHI!" size={74} rot={-5} /></div>
        </div>
      </div>
      <div style={{ position: 'absolute', left: SAFE.side, top: 1330, display: 'flex' }}>
        <Chip p={pop(l, env)} text="Sirf affected environment" color={K.orange} size={26} />
      </div>
      <Tag y={1338} text="ILLUSTRATION · NO REAL CODE" />
      <Flash l={l} at={mal} color={K.red} max={0.3} />
    </Enter>
  );
};

export const Targets: React.FC = () => {
  const { l, dur, at } = useScene('targets');
  const cl = at('l3', 'cloud'), ai = at('l3', 'AI'), dev = at('l3', 'developer'), lek = at('l3', 'Lekin'), cho = at('l3', 'chori');
  const turn = easeInOutCubic(invLerp(lek - 2, lek + 10, l));
  const sk = shake(l, [cl, ai, dev, cho], 9);
  const chips = [{ t: 'CLOUD CREDENTIALS', a: cl }, { t: 'AI API KEYS', a: ai }, { t: 'DEVELOPER SECRETS', a: dev }];
  return (
    <Enter l={l} sx={sk.x} sy={sk.y}>
      <Bg glow={turn > 0.5 ? K.mint : K.red} amount={0.28} />
      <Kicker text="PAYLOAD KA TARGET" p={fadeIn(l, 2)} />
      <Win y={360} h={640} dim={turn}><EnvCards w={952} h={640} f={l} dur={dur} /></Win>
      <Tag y={1012} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: 1066, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, opacity: 1 - turn }}>
        {chips.map((c) => (
          <div key={c.t} style={{ display: 'flex', alignItems: 'center', gap: 16, opacity: clamp(pop(l, c.a) * 1.5), transform: `scale(${1.4 - 0.4 * pop(l, c.a, 18, 0.45)})` }}>
            <svg width={44} height={44} viewBox="-22 -22 44 44"><circle r={16} fill="none" stroke={K.red} strokeWidth={4} /><path d="M-22 0H-8M8 0H22M0 -22V-8M0 8V22" stroke={K.red} strokeWidth={4} /></svg>
            <span style={{ fontFamily: F.head, fontWeight: 900, fontSize: 56, color: K.lunar }}>{c.t}</span>
          </div>
        ))}
      </div>
      {turn > 0 ? (
        <AbsoluteFill style={{ opacity: turn }}>
          <div style={{ position: 'absolute', left: SAFE.side, right: SAFE.side, top: 520, textAlign: 'center' }}>
            <Slam l={l} at={lek} size={150}>TARGET</Slam><br />
            <Slam l={l} at={lek + 10} size={180} color={K.mint} from={0.2} style={{ transform: `rotate(${(1 - pop(l, lek + 10)) * 180}deg)` }}>≠</Slam><br />
            <Slam l={l} at={cho} size={150} color={K.red}>CHORI</Slam>
          </div>
          <div style={{ position: 'absolute', left: SAFE.side, right: SAFE.side, top: 1110, textAlign: 'center', opacity: fadeIn(l, cho + 10, 14) }}>
            <div style={{ fontFamily: F.serif, fontStyle: 'italic', fontSize: 44, color: K.lunar, lineHeight: 1.2 }}>“A target appearing in the code does not establish successful access.”</div>
            <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 22, color: K.steel, marginTop: 12, letterSpacing: '0.1em' }}>— MICROSOFT SECURITY, OCT 23</div>
          </div>
        </AbsoluteFill>
      ) : null}
      <Flash l={l} at={lek} color={K.mint} max={0.3} />
    </Enter>
  );
};

const NODES = [
  { date: 'MAY 27', t: 'Master key public repo mein', w: 'May' },
  { date: 'OCT 10', t: 'GitHub tokens chori', w: 'GitHub' },
  { date: 'OCT 21', t: 'Release hijack → v1.107.0', w: 'hijack' },
] as const;

/** a drawn key icon */
const KeyIcon: React.FC<{ size?: number; color?: string; rot?: number }> = ({ size = 60, color = K.orange, rot = 0 }) => (
  <svg width={size} height={size} viewBox="-30 -30 60 60" style={{ transform: `rotate(${rot}deg)` }}>
    <circle cx={-12} cy={0} r={11} fill="none" stroke={color} strokeWidth={6} />
    <path d="M -1 0 H 26 M 18 0 V 11 M 9 0 V 8" stroke={color} strokeWidth={6} strokeLinecap="round" fill="none" />
  </svg>
);
export { KeyIcon };

export const RootCause: React.FC = () => {
  const { l, at } = useScene('rootcause');
  const rc = at('l4', 'Root'), rev = at('l4', 'revoke');
  const ats = NODES.map((n) => at('l4', n.w));
  const Y0 = 640, GAP = 220;
  const fill = (() => { if (l < ats[0]) return 0; if (l < ats[1]) return lerp(0, 1, easeOutCubic(invLerp(ats[0], ats[1], l))); return 1 + easeOutCubic(invLerp(ats[1], ats[2], l)); })();
  const sk = shake(l, [rev, ats[2]], 10);
  return (
    <Enter l={l} sx={sk.x} sy={sk.y}>
      <Bg glow={K.orange} amount={0.22} at="30% 60%" />
      <div style={{ position: 'absolute', left: SAFE.side, right: SAFE.side, top: 300, textAlign: 'center' }}>
        <div style={{ whiteSpace: 'nowrap' }}><Slam l={l} at={Math.max(2, rc)} size={118}>ROOT CAUSE</Slam>
        <Slam l={l} at={Math.max(2, rc) + 8} size={118} color={K.red} style={{ transform: `rotate(${12 * Math.sin(l / 6) * Math.exp(-(l - rc) / 40)}deg)` }}>?</Slam></div>
        <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 24, color: K.steel, letterSpacing: '0.12em', marginTop: 10, opacity: fadeIn(l, rc + 10) }}>LITELLM MAINTAINERS · OCT 23</div>
      </div>
      <div style={{ position: 'absolute', left: 196, top: Y0 + 30, width: 8, height: GAP * 2, background: 'rgba(236,239,244,0.15)', borderRadius: 4 }} />
      <div style={{ position: 'absolute', left: 196, top: Y0 + 30, width: 8, height: GAP * fill, background: K.red, borderRadius: 4, boxShadow: `0 0 20px ${K.red}` }} />
      {NODES.map((n, i) => {
        const p = pop(l, ats[i]);
        return (
          <div key={n.date} style={{ position: 'absolute', left: 170, top: Y0 + i * GAP, display: 'flex', alignItems: 'flex-start', gap: 34 }}>
            <div style={{ width: 60, height: 60, borderRadius: 30, flex: 'none', background: l >= ats[i] ? K.red : '#1A2338', border: `4px solid ${l >= ats[i] ? K.red : 'rgba(236,239,244,0.3)'}`,
              boxShadow: l >= ats[i] ? `0 0 ${20 + 40 * hit(l, ats[i], 20)}px ${K.red}` : 'none', transform: `scale(${1 + 0.4 * hit(l, ats[i], 16)})` }} />
            <div style={{ opacity: clamp(p * 1.5), transform: `translateX(${(1 - p) * 60}px)` }}>
              <div style={{ fontFamily: F.mono, fontWeight: 800, fontSize: 32, color: K.orange, letterSpacing: '0.08em' }}>{n.date}</div>
              <div style={{ fontFamily: F.head, fontWeight: 800, fontSize: 50, color: K.lunar, lineHeight: 1.08, maxWidth: 680 }}>{n.t}</div>
              {i === 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 10 }}>
                  <KeyIcon size={54} rot={l / 2} />
                  <Chip p={pop(l, rev)} text="KABHI REVOKE NAHI HUI" color={K.red} size={28} />
                </div>
              ) : null}
            </div>
          </div>
        );
      })}
      <div style={{ position: 'absolute', left: SAFE.side, right: SAFE.side, top: 1300, textAlign: 'center', fontFamily: F.mono, fontSize: 21, color: K.steel, opacity: fadeIn(l, ats[2] + 12) }}>
        Microsoft ne initial access independently confirm nahi kiya
      </div>
      <Flash l={l} at={ats[2]} color={K.red} max={0.3} />
    </Enter>
  );
};

export const DontRun: React.FC = () => {
  const { l, at } = useScene('dontrun');
  const env = at('l5', 'environment'), py = at('l5', 'Python'), pip = at('l5', 'pip'), mat = at('l5', 'mat');
  const sk = shake(l, [py, pip, mat], 14);
  const stripe = (top: number) => (
    <div style={{ position: 'absolute', left: 0, right: 0, top, height: 44, backgroundImage: `repeating-linear-gradient(45deg, ${K.yellow} 0 34px, #121212 34px 68px)`,
      backgroundPositionX: `${l * 3}px`, opacity: 0.9 }} />
  );
  const lines = [{ c: 'python', a: py }, { c: 'pip list', a: pip }];
  return (
    <Enter l={l} sx={sk.x} sy={sk.y}>
      <Bg glow={K.red} amount={0.35 + 0.25 * hit(l, mat, 30)} />
      {stripe(226)}{stripe(1556)}
      <div style={{ position: 'absolute', left: SAFE.side, right: SAFE.side, top: 320, textAlign: 'center' }}>
        <Slam l={l} at={2} size={96} color={K.orange} style={{ fontFamily: F.mono, fontWeight: 800 }}>v1.107.0</Slam><br />
        <Slam l={l} at={6} size={84}>INSTALL KIYA THA?</Slam>
      </div>
      <div style={{ position: 'absolute', left: 140, width: 800, top: 640, borderRadius: 22, background: '#0B1120', border: `3px solid ${K.red}`, padding: '26px 34px', boxShadow: '0 30px 80px rgba(0,0,0,0.6)' }}>
        <div style={{ fontFamily: F.mono, fontSize: 22, color: K.steel, marginBottom: 14 }}>suspect environment</div>
        {lines.map((x, xi) => (
          <div key={x.c} style={{ position: 'relative', fontFamily: F.mono, fontSize: 52, color: K.lunar, margin: '12px 0', opacity: fadeIn(l, 10 + xi * 8) }}>
            <span style={{ color: K.mint }}>$</span> {x.c}
            {l >= x.a ? <span style={{ position: 'absolute', right: 0, top: -6, fontFamily: F.head, fontWeight: 900, fontSize: 64, color: K.red, transform: `scale(${2 - pop(l, x.a, 20, 0.4)})` }}>✕</span> : null}
            {l >= x.a ? <div style={{ position: 'absolute', left: 0, right: 80, top: '52%', height: 6, background: K.red, transformOrigin: 'left', transform: `scaleX(${easeOutCubic(invLerp(x.a, x.a + 8, l))})` }} /> : null}
          </div>
        ))}
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 1000, height: 260 }}>
        {l >= mat ? (
          <div style={{ position: 'absolute', left: 540, top: 120, transform: `translate(-50%, -50%) scale(${2.2 - 1.2 * pop(l, mat, 20, 0.42)})`, display: 'flex', alignItems: 'center', gap: 24 }}>
            <svg width={150} height={150} viewBox="-50 -50 100 100"><polygon points="-20.7,-50 20.7,-50 50,-20.7 50,20.7 20.7,50 -20.7,50 -50,20.7 -50,-20.7" fill={K.red} stroke="#fff" strokeWidth={5} />
              <text y={11} textAnchor="middle" fontFamily={F.head} fontWeight={900} fontSize={30} fill="#fff">STOP</text></svg>
            <span style={{ fontFamily: F.head, fontWeight: 900, fontSize: 112, color: K.lunar, whiteSpace: 'nowrap', textShadow: `0 0 40px ${K.red}` }}>MAT CHALAO!</span>
          </div>
        ) : null}
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 1340, display: 'flex', justifyContent: 'center' }}>
        <Chip p={pop(l, env)} text="Suspect env ke andar test nahi" color={K.yellow} size={30} />
      </div>
      <Flash l={l} at={mat} color={K.red} max={0.4} />
    </Enter>
  );
};
