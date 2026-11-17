// AFTERCODE Final: Build Your Cast. The picture is the app's own captures (public/clips, web/src/reel/final.ts), laid on
// the beat plan the app measured (src/config/plan.json); every overlay is placed on that plan's beats, and the sound
// (public/audio/final_mix.wav, scripts/audio/mix.py) is built from the same plan. Original characters only.
import React from 'react';
import { AbsoluteFill, Audio, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from 'remotion';
import planJson from '../config/plan.json';
import linesV1 from '../config/lines_reel.json';
import linesV2 from '../config/lines_reel.v2.json';
import voV1 from '../config/voScript.json';
import voV2 from '../config/voScript.v2.json';
import { clamp, dampedSpring, easeInCubic, easeOutQuint, invLerp } from '../animation/anim';
import { C, FONT, FPS, H, W } from '../themes/tokens';

interface Seg { id: string; r0: number; r1: number; beats: number[]; downbeats: number[]; bpm: number }
const PLAN = planJson as unknown as { segments: Seg[]; shots: { id: string; r0: number; r1: number; layer: string }[]; ui: { r0: number; r1: number } };
const SEGS = PLAN.segments;
export const TOTAL = Math.round(SEGS[SEGS.length - 1].r1 * FPS);
const seg = (id: string) => SEGS.find((s) => s.id === id)!;
/** reel second of beat k of a segment */
const RB = (id: string, k: number) => { const s = seg(id), B = s.beats, i = Math.floor(k), f = k - i; return i < B.length - 1 ? B[i] + (B[i + 1] - B[i]) * f : B[B.length - 1] + (k - B.length + 1) * (60 / s.bpm); };
const F = (t: number) => Math.round(t * FPS);
const DOWN = SEGS.flatMap((s) => s.downbeats);
const lastDown = (t: number) => DOWN.filter((d) => d <= t + 1e-6).pop() ?? 0;

// ---- picture
const Clip: React.FC<{ id: string; r0: number; r1: number; crop?: 'top' | 'bottom' }> = ({ id, r0, r1, crop }) => (
  <Sequence from={F(r0)} durationInFrames={F(r1) - F(r0)} layout="none">
    {crop ? (
      <div style={{ position: 'absolute', left: 0, width: W, height: H / 2, top: crop === 'top' ? 0 : H / 2, overflow: 'hidden' }}>
        <OffthreadVideo src={staticFile(`clips/${id}.mp4`)} muted style={{ position: 'absolute', left: 0, top: -H / 4, width: W, height: H }} />
      </div>
    ) : <AbsoluteFill><OffthreadVideo src={staticFile(`clips/${id}.mp4`)} muted style={{ width: W, height: H }} /></AbsoluteFill>}
  </Sequence>
);

/** a downbeat zoom punch (battles + squad): 2.5 % on the downbeat, settling over a quarter of a bar */
const punch = (t: number) => { const d = lastDown(t), u = t - d; return 1 + 0.025 * Math.exp(-u * 9); };

// ---- type
const Tag: React.FC<{ text: string; color: string; x: number; y: number; t: number; at: number; align?: 'left' | 'right'; size?: number; live?: boolean }> = ({ text, color, x, y, t, at, align = 'left', size = 40, live }) => {
  const s = dampedSpring(t - at, 16, 0.55), o = clamp((t - at) * 12);
  return (
    <div style={{ position: 'absolute', top: y, [align]: x, transform: `translateX(${(align === 'left' ? -1 : 1) * (1 - s) * -60}px)`, opacity: o,
      fontFamily: FONT.display, fontWeight: 850, fontStretch: '78%', fontSize: size, letterSpacing: '0.02em', color: C.base, background: color, padding: '6px 18px 8px', borderRadius: 10,
      boxShadow: `6px 6px 0 ${C.base}`, textTransform: 'uppercase', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 14 } as React.CSSProperties}>{text}
      {live ? <span style={{ width: size * 0.42, height: size * 0.42, borderRadius: '50%', background: '#ff2b5b', boxShadow: `0 0 0 ${3 + 6 * Math.exp(-((t - lastDown(t)) % 0.5) * 10)}px rgba(255,43,91,0.35)` }} /> : null}</div>
  );
};

/** the round card: slams in on the downbeat, holds a bar, then flies up into a corner chip for the rest of the round */
const RoundCard: React.FC<{ t: number; at: number; end: number; bar: number; kicker: string; title: string; color: string }> = ({ t, at, end, bar, kicker, title, color }) => {
  if (t < at || t >= end) return null;
  const inS = dampedSpring(t - at, 18, 0.5), dock = easeOutQuint(invLerp(at + bar * 0.85, at + bar * 0.85 + 0.35, t));
  const big = 1 - dock;
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: H, pointerEvents: 'none' }}>
      {/* the slam: a band across the upper third */}
      <div style={{ position: 'absolute', left: 60, right: 60, top: 300 - 70 * dock, transform: `scale(${(1.35 - 0.35 * inS) * (0.42 + 0.58 * big)}) rotate(${-3 * big}deg)`, transformOrigin: '0% 0%', opacity: clamp((t - at) * 20) }}>
        <div style={{ display: 'inline-block', fontFamily: FONT.mono, fontSize: 30, fontWeight: 700, letterSpacing: '0.24em', color, background: 'rgba(6,6,10,0.78)', padding: '6px 14px', borderRadius: 8 }}>{kicker}</div>
        <div style={{ fontFamily: FONT.display, fontWeight: 900, fontStretch: '72%', fontSize: 128, lineHeight: 0.92, color: C.ink, textTransform: 'uppercase', textShadow: `7px 7px 0 ${color}, 0 0 40px rgba(0,0,0,0.6)`, marginTop: 6 }}>{title}</div>
      </div>
      {/* the flash on the slam */}
      <AbsoluteFill style={{ background: color, opacity: 0.35 * Math.exp(-(t - at) * 14) }} />
    </div>
  );
};

/** caption pill: the MC line in Roman Hinglish, word by word */
type Lines = { lines: { id: string; dur: number; phrases: { cap: string; t0: number; t1: number; words: { w: string; t0: number; t1: number }[] }[] }[] };
const LINES = { v1: (linesV1 as Lines).lines, v2: (linesV2 as unknown as Lines).lines };
const atOf = (j: unknown) => Object.fromEntries((j as { reel: { id: string; at: [string, number] }[] }).reel.map((l) => [l.id, RB(l.at[0], l.at[1])]));
const AT = { v1: atOf(voV1), v2: atOf(voV2) };
export type Version = 'v1' | 'v2';
const Caption: React.FC<{ t: number; id: string; y: number; v?: Version }> = ({ t, id, y, v = 'v1' }) => {
  const L = LINES[v].find((l) => l.id === id)!, t0 = AT[v][id], u = t - t0;
  if (u < -0.05 || u > L.dur + 0.35) return null;
  const words = L.phrases.flatMap((p) => p.words);
  const o = Math.min(clamp((u + 0.05) * 10), clamp((L.dur + 0.35 - u) * 6));
  return (
    <div style={{ position: 'absolute', left: 80, right: 80, top: y, display: 'flex', justifyContent: 'center', opacity: o }}>
      <div style={{ background: C.card, borderRadius: 22, padding: '18px 28px', fontFamily: FONT.ui, fontWeight: 800, fontSize: 52, lineHeight: 1.15, textAlign: 'center', boxShadow: `0 0 0 2px rgba(255,255,255,0.08)` }}>
        {words.map((w, i) => { const on = u >= w.t0 - 0.03; return <span key={i} style={{ color: on ? C.ink : 'rgba(236,234,245,0.35)', transition: 'none' }}>{w.w}{i < words.length - 1 ? ' ' : ''}</span>; })}
      </div>
    </div>
  );
};

// ---- the reel
const CAST_NAMES: Record<string, [string, string]> = { ceo: ['Hoodie Founder', 'Boardroom Boss'], lead: ['The President', 'The Chancellor'], neta: ['Neta No. 1', 'Neta No. 2'] };
/** v2 (the app ad): where each line's caption sits, clear of the faces in its shot */
const CAP_Y: Record<string, number> = { h1: 1150, h2: 1270, l1: 520, l2: 520, l3: 1180, l4: 1180, l5: 1180, l6: 640, l7: 640, l9: 640 };   // l8 = the end title itself
export const Final: React.FC<{ v?: Version }> = ({ v = 'v1' }) => {
  const f = useCurrentFrame(), t = f / FPS, ad = v === 'v2';
  const K = (n: number, kind: string, v1: string) => (ad ? `EXAMPLE ${n}/5 · ${kind}` : v1);
  const shots = PLAN.shots.filter((s) => s.layer === '' && !s.id.startsWith('hook'));
  const A = (k: number) => RB('A', k);
  const hookBeat = Math.floor((t - A(0)) / (A(2) - A(0)));   // the hook's rappers switch every two beats (founder first)
  const inBattle = (t >= A(20) && t < seg('C').r1) || (t >= seg('E').r0 && t < seg('E').r1);
  const zoom = inBattle ? punch(t) : 1;
  const shotAt = (id: string) => PLAN.shots.find((s) => s.id === id)!;
  const on = (id: string) => { const s = shotAt(id); return t >= s.r0 && t < s.r1; };
  // which battle close-up is on screen (side 1: dancer 1)
  const closeName = (['ceo1', 'ceo2', 'lead2', 'lead3', 'neta2', 'neta3'] as const).find(on);
  const closeSide = closeName ? (closeName.endsWith('1') || closeName === 'lead2' || closeName === 'neta2' ? 1 : 0) : -1;
  const closeKey = closeName?.startsWith('ceo') ? 'ceo' : closeName?.startsWith('lead') ? 'lead' : 'neta';
  const MORPH = ['Suit', 'Kurta', 'Leather', 'Hoodie'];
  const mk = Math.max(0, Math.min(3, Math.floor((t - A(4)) / (A(5) - A(4)) + 1e-3)));
  const E = seg('E'), Fs = seg('F');
  return (
    <AbsoluteFill style={{ background: C.base, overflow: 'hidden' }}>
      <AbsoluteFill style={{ transform: `scale(${zoom})` }}>
        {/* HOOK: split screen, founder over boss */}
        <Clip id="hookA" r0={A(0)} r1={A(4)} crop="top" />
        <Clip id="hookB" r0={A(0)} r1={A(4)} crop="bottom" />
        {shots.map((s) => <Clip key={s.id} id={s.id} r0={s.r0} r1={s.r1} />)}
        <Clip id="ui_builder" r0={PLAN.ui.r0} r1={PLAN.ui.r1} />
      </AbsoluteFill>

      {t < A(4) ? (<>
        {/* the rapper's half is lit, the other dims */}
        <div style={{ position: 'absolute', left: 0, top: 0, width: W, height: H / 2, background: '#000', opacity: hookBeat % 2 ? 0.38 : 0 }} />
        <div style={{ position: 'absolute', left: 0, top: H / 2, width: W, height: H / 2, background: '#000', opacity: hookBeat % 2 ? 0 : 0.38 }} />
        <div style={{ position: 'absolute', left: 0, right: 0, top: H / 2 - 5, height: 10, background: `linear-gradient(90deg, ${C.accent}, ${C.accent2})` }} />
        <Tag text="Hoodie Founder" color={C.accent} x={70} y={H / 2 - 120} t={t} at={0} />
        <Tag text="Boardroom Boss" color={C.accent2} x={70} y={H / 2 + 50} t={t} at={0.06} align="right" />
        {/* VS: on screen from frame 0, settling with an overshoot */}
        <div style={{ position: 'absolute', left: W / 2 - 115, top: H / 2 - 115, width: 230, height: 230, borderRadius: '50%', background: C.lime, display: 'grid', placeItems: 'center',
          transform: `scale(${1.45 - 0.45 * dampedSpring(t, 15, 0.42)}) rotate(${-8 + 8 * dampedSpring(t, 12, 0.5)}deg)`, boxShadow: `0 0 0 10px ${C.base}, 0 0 60px rgba(182,255,59,0.55)` }}>
          <span style={{ fontFamily: FONT.display, fontWeight: 900, fontStretch: '70%', fontSize: 128, color: C.base, marginTop: -8 }}>VS</span>
        </div>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 236, textAlign: 'center', transform: `scale(${1.25 - 0.25 * dampedSpring(t, 16, 0.5)})` }}>
          <div style={{ fontFamily: FONT.mono, fontWeight: 700, fontSize: 34, letterSpacing: '0.3em', color: C.lime, textShadow: `0 2px 12px ${C.base}` }}>CEO vs CEO</div>
          <div style={{ fontFamily: FONT.display, fontWeight: 900, fontStretch: '72%', fontSize: 124, lineHeight: 0.9, color: C.ink, textShadow: `7px 7px 0 ${C.accent2}`, marginTop: 4 }}>DISS BATTLE</div>
        </div>
      </>) : null}

      {/* MORPH: the look changes on every beat */}
      {on('morph') ? (<>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 300, display: 'flex', justifyContent: 'center' }}>
          <div style={{ display: 'flex', gap: 14 }}>{MORPH.map((m, i) => (
            <div key={m} style={{ fontFamily: FONT.display, fontWeight: 850, fontStretch: '80%', fontSize: 42, textTransform: 'uppercase', padding: '8px 18px', borderRadius: 12,
              background: i === mk ? C.lime : 'rgba(10,10,18,0.7)', color: i === mk ? C.base : 'rgba(236,234,245,0.5)', transform: `scale(${i === mk ? 1 + 0.18 * Math.exp(-(t - A(4 + i)) * 10) : 0.92})` }}>{m}</div>))}</div>
        </div>
        {ad ? null : <Caption t={t} id="l02" y={1270} />}
      </>) : null}

      {/* BUILDER (the real app UI): captions over the stage area */}
      {!ad && t >= PLAN.ui.r0 && t < PLAN.ui.r1 ? (<><Caption t={t} id="l03" y={520} /><Caption t={t} id="l04" y={520} /></>) : null}
      {ad ? Object.entries(CAP_Y).map(([id, y]) => <Caption key={id} t={t} id={id} y={y} v="v2" />) : null}
      {ad && t >= A(4) && t < Fs.r0 ? <div style={{ position: 'absolute', right: 56, top: 236, display: 'flex', alignItems: 'center', gap: 10, fontFamily: FONT.ui, fontWeight: 800, fontSize: 26, letterSpacing: '0.16em', color: C.ink, background: 'rgba(10,10,18,0.72)', padding: '8px 14px', borderRadius: 999 }}><span style={{ width: 12, height: 12, borderRadius: '50%', background: C.accent }} />AFTER<span style={{ color: C.accent, marginLeft: -10 }}>CODE</span></div> : null}

      {/* ROUNDS */}
      <RoundCard t={t} at={A(20)} end={seg('A').r1} bar={A(24) - A(20)} kicker={K(1, 'BATTLE', 'ROUND 1')} title="CEO Diss Battle" color={C.accent} />
      <RoundCard t={t} at={seg('B').r0} end={seg('B').r1} bar={RB('B', 4) - RB('B', 0)} kicker={K(2, 'BATTLE', 'ROUND 2')} title="Leaders Battle" color={C.accent2} />
      <RoundCard t={t} at={seg('C').r0} end={seg('C').r1} bar={RB('C', 4) - RB('C', 0)} kicker={K(3, 'BATTLE', 'ROUND 3')} title="Neta vs Neta" color={C.lime} />
      <RoundCard t={t} at={seg('D').r0} end={seg('D').r1} bar={RB('D', 4) - RB('D', 0)} kicker={K(4, 'DUO', 'DUET')} title="Filmi Jodi" color={C.accent2} />
      <RoundCard t={t} at={E.r0} end={E.r1} bar={RB('E', 4) - RB('E', 0)} kicker={K(5, 'CREW', 'FINALE')} title="Sitcom Squad" color={C.accent} />
      {closeName ? <Tag key={closeName} text={CAST_NAMES[closeKey][closeSide === 1 ? 1 : 0]} live color={closeSide ? C.accent2 : C.accent} x={80} y={1330} t={t} at={shotAt(closeName).r0} /> : null}
      {(['ceo3', 'ceo4', 'lead1', 'neta1'] as const).filter(on).map((id) => { const k = id.startsWith('ceo') ? 'ceo' : id.startsWith('lead') ? 'lead' : 'neta';
        return <Tag key={id} text={`${CAST_NAMES[k][0]} vs ${CAST_NAMES[k][1]}`} color={C.ink} x={80} y={1330} t={t} at={shotAt(id).r0} size={34} />; })}
      {t >= E.r0 + 0.2 && t < E.r1 ? <div style={{ position: 'absolute', left: 0, right: 0, top: 1335, textAlign: 'center', fontFamily: FONT.mono, fontSize: 30, letterSpacing: '0.16em', color: C.ink,
        opacity: clamp((t - E.r0 - 0.2) * 5), textShadow: `0 2px 10px ${C.base}` }}>KABIR · MEERA · ROHAN · TARA · VIKRAM · ZOYA</div> : null}

      {/* FINALE: the whole cast + the title */}
      {t >= Fs.r0 ? (() => { const u = t - Fs.r0, cta = RB('F', 4), s = dampedSpring(u, 13, 0.55);
        return (<>
          <AbsoluteFill style={{ background: 'linear-gradient(180deg, rgba(6,6,10,0.78) 0%, rgba(6,6,10,0) 34%, rgba(6,6,10,0) 62%, rgba(6,6,10,0.85) 100%)' }} />
          <div style={{ position: 'absolute', left: 0, right: 0, top: 300, textAlign: 'center', transform: `translateY(${(1 - s) * 40}px) scale(${1.15 - 0.15 * s})`, opacity: clamp(u * 8) }}>
            <div style={{ fontFamily: FONT.ui, fontWeight: 850, fontSize: 132, letterSpacing: '0.16em' }}><span style={{ color: C.ink }}>AFTER</span><span style={{ color: C.accent }}>CODE</span></div>
            <div style={{ fontFamily: FONT.display, fontWeight: 800, fontStretch: '85%', fontSize: 58, color: C.ink, marginTop: 10, letterSpacing: '0.04em' }}>Apni cast khud banao.</div>
          </div>
          <div style={{ position: 'absolute', left: 0, right: 0, top: 1250, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22 }}>
            <div style={{ fontFamily: FONT.mono, fontSize: 40, color: C.ink, background: 'rgba(10,10,18,0.8)', padding: '12px 26px', borderRadius: 14, border: `2px solid ${C.accent}`, opacity: clamp((u - 0.3) * 6) }}>aftercode-one.vercel.app</div>
            <div style={{ fontFamily: FONT.display, fontWeight: 900, fontStretch: '80%', fontSize: 54, color: C.base, background: C.lime, padding: '10px 30px 12px', borderRadius: 999, textTransform: 'uppercase',
              transform: `scale(${t >= cta ? 1 + 0.12 * Math.exp(-(t - cta) * 8) : 0})`, boxShadow: `6px 6px 0 ${C.base}` }}>Comment “CAST”</div>
            <div style={{ fontFamily: FONT.ui, fontSize: 24, color: C.ink2, opacity: clamp((u - 0.5) * 4) }}>All characters are fictional · photo faces AI-generated · made in AFTERCODE</div>
          </div>
        </>); })() : null}

      {/* a white pop on every song switch (the slam) */}
      {SEGS.slice(1).map((s) => { const u = t - s.r0; return u >= 0 && u < 0.12 ? <AbsoluteFill key={s.id} style={{ background: '#fff', opacity: 0.55 * (1 - easeInCubic(u / 0.12)) }} /> : null; })}
      <Audio src={staticFile(ad ? 'audio/final_mix_v2.wav' : 'audio/final_mix.wav')} />
    </AbsoluteFill>
  );
};
