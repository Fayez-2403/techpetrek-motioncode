// The CASE FILE card (9:16 CARD or 4:5 CARD45 geometry from cardLayout.ts), paper or dark variant.
// Beat-locked choreography, card-local frame `f` (0 = card starts cross-fading in), `phase` = film frame at f = 0:
//   f 0        dash draws, paper + grid already there
//   B1         counter ticks over, type tag decodes, numeral slides in, kicker types on, headline masks up word by word
//   B1 + 20    body lines fade up one by one
//   B2         media window scales from 0.96 with its shadow growing; media plan starts (cuts on beats)
//   B3, B4     chip 1, chip 2 pop
// intro 'handoff' starts with dash / numeral / kicker / headline already inked (for a 3D card texture that shows them).
import React, { useMemo } from 'react';
import { CARD, CARD45 } from './cardLayout';
import { clamp, dampedSpring, easeInOutCubic, easeOutCubic, easeOutExpo, invLerp } from '../lib/anim';
import { mulberry32 } from '../lib/rng';
import { C } from '../styles/theme';
import { F } from '../styles/typography';
import { Chips, type Chip } from './Chips';
import { MediaWindow, mediaSchedule, planFor, slotAt, type CueAt, type ReceiptRef, type Slot } from './MediaWindow';
import { TypeTag, type Variant } from './TypeTag';
import { TYPE, bodyPages, fitSize, headlineLayout, trackingCss, useFontsReady, wrapLines } from './cardText';

export type Layout = typeof CARD | typeof CARD45;
export type Intro = 'build' | 'handoff';
export interface CardData {
  id: string; n?: number; tag: string; kicker: string; headline: string; body: string[]; chips: Chip[]; footnote: string;
  receipts?: ReceiptRef[]; icon?: IconName; rows?: string[]; numeral?: string; planKey?: string;
}

/** the "WHAT TO DO NOW" card (dark variant): 4 action rows, media window cycles the 4 checklist animations */
export const CHECKLIST: CardData = {
  id: 'checklist', tag: 'ACTION', kicker: 'Defensive checklist · 4 steps', headline: 'WHAT TO DO NOW', body: [],
  rows: ['ROTATE KEYS', 'LEAST PRIVILEGE', 'HUMAN APPROVAL FOR AGENTS', 'AUDIT LOGS'], icon: 'check',
  chips: [], footnote: 'Defensive guidance only · no exploit details', receipts: [], planKey: 'checklist',
};

export const pad2 = (n: number) => String(n).padStart(2, '0');

/** beat grid for a card: B1 = first beat after the card lands; tighter steps when the card is short */
export function cardTimes(len: number, phase: number, intro: Intro = 'build') {
  const nb = (x: number) => Math.ceil((x + phase) / 30) * 30 - phase;
  const B1 = nb(intro === 'build' ? 12 : 8);
  const step = len - B1 >= 230 ? 30 : 15;
  return { B1, B2: B1 + step, B3: B1 + 2 * step, B4: B1 + 3 * step, step };
}

// ---------------------------------------------------------------- palette per variant
export function ink(variant: Variant) {
  const d = variant === 'dark';
  return {
    bg: d ? C.graphite : C.paper, text: d ? C.lunar : C.ink, body: d ? '#C4C8D1' : '#26241F', mute: d ? C.steel : C.mute,
    grid: d ? 'rgba(236,239,244,0.045)' : 'rgba(18,18,18,0.058)', accent: C.alert, accentText: d ? '#FF7B47' : C.alertDeep,
    hair: d ? 'rgba(236,239,244,0.12)' : 'rgba(18,18,18,0.14)',
  };
}

// ---------------------------------------------------------------- background: paper / graphite, 40 px grid, seeded grain
let grainUrl: string | null = null;
function grainTile() {
  if (grainUrl || typeof document === 'undefined') return grainUrl;
  const s = 256, cv = document.createElement('canvas');
  cv.width = cv.height = s;
  const g = cv.getContext('2d');
  if (!g) return null;
  const img = g.createImageData(s, s), r = mulberry32(4242);
  for (let i = 0; i < s * s; i++) {
    const v = 128 + (r() - 0.5) * 120 + (r() < 0.012 ? (r() - 0.5) * 160 : 0);
    img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = clamp(v, 0, 255);
    img.data[i * 4 + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  grainUrl = cv.toDataURL('image/png');
  return grainUrl;
}

export const CardBackground: React.FC<{ w: number; h: number; variant: Variant }> = ({ w, h, variant }) => {
  const p = ink(variant), dark = variant === 'dark';
  const grain = useMemo(grainTile, []);
  return (
    <div style={{ position: 'absolute', left: 0, top: 0, width: w, height: h, overflow: 'hidden',
      background: dark
        ? `radial-gradient(110% 70% at 50% 22%, #23252C 0%, ${C.graphite} 58%, #0E0F12 100%)`
        : `radial-gradient(115% 72% at 50% 20%, #FAF7F0 0%, ${C.paper} 50%, #E9E1D1 100%)` }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage:
        `linear-gradient(${p.grid} 1px, transparent 1px), linear-gradient(90deg, ${p.grid} 1px, transparent 1px)`,
        backgroundSize: '40px 40px', backgroundPosition: '-1px -1px' }} />
      {grain && <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${grain})`, backgroundSize: '256px 256px',
        mixBlendMode: dark ? 'screen' : 'multiply', opacity: dark ? 0.05 : 0.13 }} />}
    </div>
  );
};

// ---------------------------------------------------------------- icons (24 px viewBox line glyphs)
export type IconName = 'cloud' | 'key' | 'shield' | 'search' | 'nodes' | 'flask' | 'check' | 'alert' | 'doc';
const ICON_BY_TAG: [string, IconName][] = [['CONFIRMED BREACH', 'cloud'], ['AI-ASSISTED', 'nodes'], ['GOVERNMENT', 'shield'],
  ['SECURITY RESEARCH', 'search'], ['INTERNAL TEST', 'flask'], ['ACTION', 'check']];
export const iconFor = (d: Pick<CardData, 'icon' | 'tag'>): IconName => d.icon ?? ICON_BY_TAG.find(([k]) => d.tag.toUpperCase().startsWith(k))?.[1] ?? 'doc';
export const Icon: React.FC<{ name: IconName; size: number; color: string }> = ({ name, size, color }) => {
  const P = { fill: 'none', stroke: color, strokeWidth: 2.1, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      {name === 'cloud' && <path {...P} d="M7 18h10.5a4 4 0 0 0 .6-7.95A5.5 5.5 0 0 0 7.4 9.2 4.4 4.4 0 0 0 7 18z" />}
      {name === 'key' && <><circle {...P} cx={8} cy={12} r={3.6} /><path {...P} d="M11.6 12H20m-3 0v3m-3-3v2.2" /></>}
      {name === 'shield' && <path {...P} d="M12 3.2 19 6v5.6c0 4.3-3 7.6-7 9.2-4-1.6-7-4.9-7-9.2V6z" />}
      {name === 'search' && <><circle {...P} cx={10.5} cy={10.5} r={5.6} /><path {...P} d="m15 15 5 5" /></>}
      {name === 'nodes' && <><circle {...P} cx={6} cy={7} r={2.3} /><circle {...P} cx={18} cy={7} r={2.3} /><circle {...P} cx={12} cy={17.5} r={2.3} /><path {...P} d="M8.2 7.6h7.6M7.2 9.1l3.6 6.4m6-6.4-3.6 6.4" /></>}
      {name === 'flask' && <path {...P} d="M9.5 3.5h5M10.4 3.5v5.4L5.6 17.6A2 2 0 0 0 7.4 20.5h9.2a2 2 0 0 0 1.8-2.9l-4.8-8.7V3.5M8 14.5h8" />}
      {name === 'check' && <path {...P} strokeWidth={2.6} d="m5.5 12.5 4.2 4.2 8.8-9.4" />}
      {name === 'alert' && <><path {...P} d="M12 3.8 21 19.5H3z" /><path {...P} d="M12 10v4.2m0 2.6v.1" /></>}
      {name === 'doc' && <><path {...P} d="M6.5 3.5h7.5l4 4v13h-11.5z" /><path {...P} d="M9.5 12h5m-5 3.5h5" /></>}
    </svg>
  );
};

// ---------------------------------------------------------------- top bar: dash, type tag, counter
const Counter: React.FC<{ n: number; total: number; t: number; size: number; color: string }> = ({ n, total, t, size, color }) => {
  const cur = pad2(n), prev = pad2(n > 1 ? n - 1 : n);
  const p = easeInOutCubic(invLerp(0, 16, t));
  return (
    <div style={{ display: 'flex', fontFamily: F.mono, fontSize: size, fontWeight: 600, letterSpacing: '0.2em', color, lineHeight: 1, whiteSpace: 'pre' }}>
      {[...cur].map((ch, i) => (
        <span key={i} style={{ position: 'relative', display: 'inline-block', overflow: 'hidden', height: '1.1em', marginTop: '-0.05em' }}>
          {ch === prev[i] ? <span style={{ display: 'inline-block', paddingTop: '0.05em' }}>{ch}</span> : <>
            <span style={{ display: 'inline-block', paddingTop: '0.05em', transform: `translateY(${-p * 110}%)` }}>{prev[i]}</span>
            <span style={{ position: 'absolute', left: 0, top: 0, paddingTop: '0.05em', transform: `translateY(${(1 - p) * 110}%)` }}>{ch}</span>
          </>}
        </span>
      ))}
      <span>{` / ${pad2(total)}`}</span>
    </div>
  );
};

export const TopBar: React.FC<{ L: Layout; f: number; tag?: string; n: number; total: number; variant: Variant; dashAt: number; at: number; still?: boolean }> = ({ L, f, tag, n, total, variant, dashAt, at, still }) => {
  const p = ink(variant);
  const dw = still ? 1 : easeOutExpo(invLerp(dashAt, dashAt + 18, f));
  const cy = L.dash.y + L.dash.h / 2;
  const tagSize = Math.round(L.counter.size * 0.62);
  return (
    <>
      <div style={{ position: 'absolute', left: L.dash.x, top: L.dash.y, width: L.dash.w * dw, height: L.dash.h, background: p.accent }} />
      {tag && (
        <div style={{ position: 'absolute', left: L.dash.x + L.dash.w + 22, top: cy, transform: 'translateY(-50%)', display: 'flex' }}>
          <TypeTag tag={tag} f={f} at={at + 2} variant={variant} size={tagSize} still={still} />
        </div>
      )}
      <div style={{ position: 'absolute', right: L.w - L.counter.right - L.counter.size * 0.2, top: L.counter.y }}>
        <Counter n={n} total={total} t={still ? 99 : f - at} size={L.counter.size} color={p.accent} />
      </div>
    </>
  );
};

// ---------------------------------------------------------------- numeral, kicker, headline, body
export const Numeral: React.FC<{ L: Layout; text?: string; check?: boolean; t: number; variant: Variant }> = ({ L, text, check, t, variant }) => {
  const p = easeOutExpo(invLerp(0, 30, t));
  const s = L.numeral.size;
  if (check) {
    const d = easeInOutCubic(invLerp(4, 26, t));
    return (
      <div style={{ position: 'absolute', left: L.numeral.x + 4, top: L.numeral.y + s * 0.1, opacity: t < 0 ? 0 : 1 }}>
        <svg width={s * 0.92} height={s * 0.8} viewBox="0 0 100 86">
          <path d="M8 46 L38 74 L94 10" fill="none" stroke={variant === 'dark' ? C.mintSoft : C.mint} strokeWidth={9} strokeLinecap="round"
            strokeLinejoin="round" strokeDasharray={140} strokeDashoffset={140 * (1 - d)} />
        </svg>
      </div>
    );
  }
  return (
    <div style={{ position: 'absolute', left: L.numeral.x, top: L.numeral.y, height: s * 0.92, overflow: 'hidden', paddingRight: 12 }}>
      <div style={{ fontFamily: F.serif, fontSize: s, lineHeight: 0.92, color: C.alert, letterSpacing: '-0.02em',
        transform: `translateX(${(1 - p) * -105}%)`, opacity: t < 0 ? 0 : clamp(0.2 + p) }}>{text}</div>
    </div>
  );
};

export const Kicker: React.FC<{ x: number; y: number; size: number; icon: number; maxRight: number; text: string; iconName: IconName; t: number; variant: Variant }> = ({ x, y, size, icon, maxRight, text, iconName, t, variant }) => {
  const p = ink(variant), dark = variant === 'dark';
  const pop = dampedSpring(t / 60, 16, 0.55);
  const tx = x + icon + Math.round(icon * 0.42);
  const fs = fitSize(text, maxRight - tx, size, TYPE.mono, size * 0.7);
  const rev = easeOutCubic(invLerp(4, 26, t));
  return (
    <>
      <div style={{ position: 'absolute', left: x, top: y, width: icon, height: icon, borderRadius: '50%', background: dark ? C.alert : C.ink,
        display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${t < 0 ? 0 : pop})` }}>
        <Icon name={iconName} size={icon * 0.62} color={dark ? C.graphite : C.paper} />
      </div>
      <div style={{ position: 'absolute', left: tx, top: y + icon / 2, transform: 'translateY(-50%)', fontFamily: F.mono, fontSize: fs, fontWeight: 500,
        letterSpacing: trackingCss(TYPE.mono), color: dark ? '#B5BAC5' : C.ink2, whiteSpace: 'nowrap', lineHeight: 1,
        clipPath: `inset(-20% ${(1 - rev) * 100}% -20% 0)` }}>{text}</div>
      {rev > 0 && rev < 0.98 && (
        <div style={{ position: 'absolute', left: tx + (fs * 0.62) * text.length * rev, top: y + icon / 2 - fs * 0.55, width: fs * 0.55, height: fs * 1.1, background: p.accent }} />
      )}
    </>
  );
};

export const Headline: React.FC<{ x: number; y: number; w: number; size: number; lh: number; maxLines: number; text: string; t: number; variant: Variant; color?: string; accentWords?: number[] }> = ({ x, y, w, size, lh, maxLines, text, t, variant, color, accentWords }) => {
  const { size: s, lines } = headlineLayout(text, { w, size, maxLines });
  const p = ink(variant);
  let wi = 0;
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: w + 40, fontFamily: F.head, fontWeight: TYPE.head.weight, fontSize: s,
      letterSpacing: trackingCss(TYPE.head), wordSpacing: `${TYPE.head.ws}em`, lineHeight: lh, color: color ?? p.text, whiteSpace: 'nowrap' }}>
      {lines.map((line, li) => (
        <div key={li} style={{ height: s * lh }}>
          {line.split(' ').map((word, k) => {
            const i = wi++;
            const q = easeOutExpo(invLerp(i * 4, i * 4 + 24, t));
            return (
              <React.Fragment key={k}>
                {k > 0 && ' '}
                <span style={{ display: 'inline-block', overflow: 'hidden', verticalAlign: 'top', padding: '0.12em 0.03em 0.2em', margin: '-0.12em -0.03em -0.2em' }}>
                  <span style={{ display: 'inline-block', transform: `translateY(${(1 - q) * 112}%)`, color: accentWords?.includes(i) ? C.alert : undefined }}>{word}</span>
                </span>
              </React.Fragment>
            );
          })}
        </div>
      ))}
    </div>
  );
};

/** height (px) the headline will take */
export const headlineHeight = (text: string, g: { w: number; size: number; lh: number; maxLines: number }) => {
  const { size, lines } = headlineLayout(text, g);
  return lines.length * size * g.lh;
};

export interface BodyPage { size: number; lines: string[] }
/** body copy; `pages` from bodyPages(), page k shown from starts[k] (page turns cross-fade, lines fade up one by one) */
export const Body: React.FC<{ x: number; y: number; w: number; lh: number; pages: BodyPage[]; starts: number[]; f: number; variant: Variant; still?: boolean }> = ({ x, y, w, lh, pages, starts, f, variant, still }) => {
  const p = ink(variant);
  let k = 0;
  for (let i = 0; i < starts.length; i++) { if (f >= starts[i]) k = i; }
  if (still) k = 0;
  const page = (pg: BodyPage, t: number, outP: number, key: string) => (
    <div key={key} style={{ position: 'absolute', left: 0, top: 0, opacity: 1 - outP, transform: `translateY(${-outP * 12}px)` }}>
      {pg.lines.map((line, i) => {
        const q = still ? 1 : easeOutCubic(invLerp(i * 7, i * 7 + 24, t));
        return <div key={i} style={{ fontSize: pg.size, height: pg.size * lh, opacity: q, transform: `translateY(${(1 - q) * 18}px)` }}>{line}</div>;
      })}
    </div>
  );
  const turn = k > 0 && !still ? f - starts[k] : 99;
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: w + 20, fontFamily: F.head, fontWeight: TYPE.body.weight,
      lineHeight: lh, letterSpacing: trackingCss(TYPE.body), color: p.body, whiteSpace: 'nowrap' }}>
      {turn < 10 && pages[k - 1] && page(pages[k - 1], 999, easeOutCubic(invLerp(0, 10, turn)), `p${k - 1}`)}
      {pages[k] && page(pages[k], still ? 999 : f - starts[k] - (k > 0 ? 8 : 0), 0, `p${k}`)}
    </div>
  );
};

// ---------------------------------------------------------------- checklist rows (dark card)
const ChecklistRows: React.FC<{ x: number; y: number; w: number; rowH: number; rows: string[]; f: number; at: number; slots: Slot[]; still?: boolean }> = ({ x, y, w, rowH, rows, f, at, slots, still }) => {
  const k = slots.length ? slotAt(slots, f) : -1;
  const ts = Math.round(rowH * 0.56);
  const fs = Math.min(...rows.map((r) => fitSize(r, w - rowH * 1.9, ts, TYPE.value, ts * 0.7)));
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: w }}>
      {rows.map((r, i) => {
        const inT = still ? 99 : f - at - i * 6;
        const q = easeOutCubic(invLerp(0, 22, inT));
        const popAt = slots[i]?.from ?? at + 30 * (i + 1);
        const pt = still ? 99 : (f - popAt) / 60;
        const done = pt >= 0;
        const s = dampedSpring(pt, 18, 0.45);
        const active = still ? false : k === i && f >= (slots[i]?.from ?? 1e9);
        const flash = still ? 0 : Math.max(0, 1 - Math.abs(pt * 60 - 6) / 22) * (done ? 1 : 0);
        const cs = rowH * 0.62;
        let color = 'rgba(236,239,244,0.42)';
        if (done) color = active ? '#FFFFFF' : C.lunar;
        return (
          <div key={i} style={{ position: 'relative', height: rowH, display: 'flex', alignItems: 'center', gap: rowH * 0.34,
            borderTop: i ? '1px solid rgba(236,239,244,0.10)' : 'none', opacity: q, transform: `translateY(${(1 - q) * 14}px)` }}>
            <div style={{ position: 'absolute', inset: '4px -14px', borderRadius: 10, background: `rgba(126,227,182,${0.07 * (active ? 1 : 0) + 0.12 * flash})` }} />
            {active && <div style={{ position: 'absolute', left: -14, top: rowH * 0.2, width: 4, height: rowH * 0.6, background: C.mintSoft, borderRadius: 2 }} />}
            <div style={{ position: 'relative', width: cs, height: cs, flex: 'none', borderRadius: '50%', boxSizing: 'border-box',
              border: done ? 'none' : '2px solid rgba(236,239,244,0.28)', background: done ? C.mint : 'transparent',
              transform: `scale(${done ? 0.55 + 0.45 * s : 1})`, display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: done ? `0 0 ${18 * flash}px rgba(126,227,182,${0.6 * flash})` : 'none' }}>
              {done && <Icon name="check" size={cs * 0.7} color="#FFFFFF" />}
            </div>
            <div style={{ position: 'relative', fontFamily: F.head, fontWeight: TYPE.value.weight, fontSize: fs, letterSpacing: '-0.005em', lineHeight: 1,
              whiteSpace: 'nowrap', color }}>{r}</div>
            <div style={{ position: 'absolute', right: 0, fontFamily: F.mono, fontSize: Math.round(rowH * 0.3), fontWeight: 600, letterSpacing: '0.12em',
              color: done ? C.mintSoft : C.steel, opacity: done ? 0.9 : 0.5 }}>{pad2(i + 1)}</div>
          </div>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------- footnote
export const Footnote: React.FC<{ x: number; y: number; size: number; text: string; t: number; variant: Variant; width: number }> = ({ x, y, size, text, t, variant, width }) => {
  const p = ink(variant);
  const q = easeOutCubic(invLerp(0, 20, t));
  const fs = fitSize(text, width, size, TYPE.mono, Math.min(size, 16));
  return (
    <div style={{ position: 'absolute', left: x, top: y, width, height: size * 1.3, display: 'flex', alignItems: 'center', opacity: q,
      fontFamily: F.mono, fontSize: fs, fontWeight: 500, letterSpacing: '0.02em', color: p.mute, whiteSpace: 'nowrap', lineHeight: 1, overflow: 'hidden' }}>
      {text}
    </div>
  );
};

// ---------------------------------------------------------------- layout of one card (shared with the carousel)
type Box = { x: number; y: number; w: number; h: number; r: number };
export interface CardPlan {
  L: Layout; T: ReturnType<typeof cardTimes>; head: { size: number; lines: string[] };
  headG: { x: number; y: number; w: number; size: number; lh: number; maxLines: number };
  bodyY: number; bodyLh: number; pages: BodyPage[]; pageStarts: number[]; media: Box; rowsTop: number; rowH: number; slots: Slot[];
}
/** where everything goes and when, for a card. 9:16: media window fixed (hand-off + steadiness), body turns pages if
 *  the copy does not fit at full size. 4:5: body flows, the media window takes the remaining height. */
export function planCard(data: CardData, layout: 'CARD' | 'CARD45', len: number, phase: number, intro: Intro, cueAt?: CueAt): CardPlan {
  const L: Layout = layout === 'CARD45' ? CARD45 : CARD;
  const T = cardTimes(len, phase, intro);
  const headG = { ...L.headline, maxLines: Math.max(L.headline.maxLines, 3) };
  const head = headlineLayout(data.headline, headG);
  const headBottom = L.headline.y + head.lines.length * head.size * L.headline.lh;
  const numBottom = L.numeral.y + L.numeral.size * 0.86;
  const gap = Math.round(L.headline.size * 0.4);
  const bodyY = Math.round(Math.min(L.body.y, Math.max(headBottom + gap, numBottom + 18)));
  const contentW = L.w - L.body.x * 2;
  let media: Box = { ...L.media };
  const bottom = L.media.y + L.media.h;
  let rowH = 0, pages: BodyPage[] = [];
  const isList = !!data.rows?.length;
  if (isList) {
    const n = data.rows!.length, minRow = layout === 'CARD45' ? 52 : 56;
    rowH = Math.min(64, (L.media.y - 16 - bodyY) / n);
    if (rowH < minRow) { rowH = minRow; const top = Math.round(bodyY + rowH * n + 16); media = { ...media, y: top, h: bottom - top }; }
  } else if (layout === 'CARD45') {
    let s: number = L.body.size;
    let ls = data.body.flatMap((p) => wrapLines(p, contentW, s, TYPE.body));
    while (s > 28 && bottom - (bodyY + ls.length * s * L.body.lh + 20) < 400) { s -= 1; ls = data.body.flatMap((p) => wrapLines(p, contentW, s, TYPE.body)); }
    pages = [{ size: s, lines: ls }];
    const top = Math.round(bodyY + ls.length * s * L.body.lh + 22);
    if (top > media.y) media = { ...media, y: top, h: bottom - top };
  } else {
    const maxLines = Math.max(1, Math.floor((L.media.y - 14 - bodyY) / (L.body.size * L.body.lh)));
    pages = bodyPages(data.body, contentW, L.body.size, maxLines);
  }
  const slots = mediaSchedule(planFor(data.planKey ?? data.id, data.receipts ?? []), T.B2, len, phase, 30, cueAt);
  // body pages turn on the media cut nearest to an even split (or on the beat grid)
  const bodyAt = T.B1 + 22;
  const pageStarts = [bodyAt];
  for (let k = 1; k < pages.length; k++) {
    const target = bodyAt + ((len - bodyAt) * k) / pages.length;
    const cut = slots.map((s) => s.from).filter((x) => x > pageStarts[k - 1] + 60).sort((a, b) => Math.abs(a - target) - Math.abs(b - target))[0];
    pageStarts.push(cut !== undefined && Math.abs(cut - target) < 60 ? cut : Math.round((target + phase) / 30) * 30 - phase);
  }
  return { L, T, head, headG, bodyY, bodyLh: L.body.lh, pages, pageStarts, media, rowsTop: bodyY, rowH, slots };
}

// ---------------------------------------------------------------- the card
export interface CaseCardProps {
  data: CardData;
  counter: { n: number; total: number };
  /** card-local frame (0 = card starts cross-fading in) */
  f: number;
  /** card-local frame at which the card's segment ends (media plan runs until here; the last item keeps playing after) */
  len: number;
  /** film frame at f = 0 (beat grid) */
  phase?: number;
  layout?: 'CARD' | 'CARD45';
  variant?: Variant;
  intro?: Intro;
  /** narration word cues for media cuts (reel only) */
  cueAt?: CueAt;
  /** render the settled end state (PNG stills) */
  still?: boolean;
  /** extra layers drawn on top (carousel footer etc.) */
  children?: React.ReactNode;
}

export const CaseCard: React.FC<CaseCardProps> = ({ data, counter, f, len, phase = 0, layout = 'CARD', variant = 'paper', intro = 'build', still, cueAt, children }) => {
  useFontsReady();
  const P = planCard(data, layout, len, phase, intro, cueAt);
  const { L, T } = P;
  const pre = intro === 'handoff' || still;
  const contentW = L.w - L.body.x * 2;
  const isList = !!data.rows?.length;
  const done = isList ? P.slots.filter((s) => f >= s.from).length : 0;
  const chips: Chip[] = isList
    ? [{ label: 'STEPS', value: `${still ? data.rows!.length : done} / ${data.rows!.length} DONE` }, { label: 'TYPE', value: 'DEFENSIVE ONLY' }]
    : data.chips;
  const numText = data.numeral ?? pad2(data.n ?? counter.n);
  const tB1 = pre ? 999 : f - T.B1;
  return (
    <div style={{ position: 'absolute', left: 0, top: 0, width: L.w, height: L.h, overflow: 'hidden' }}>
      <CardBackground w={L.w} h={L.h} variant={variant} />
      <TopBar L={L} f={f} tag={data.tag} n={counter.n} total={counter.total} variant={variant} dashAt={pre ? -999 : 0} at={T.B1} still={still} />
      <Numeral L={L} text={numText} check={isList} t={tB1} variant={variant} />
      <Kicker x={L.kicker.x} y={L.kicker.y} size={L.kicker.size} icon={L.kicker.icon} maxRight={L.counter.right}
        text={data.kicker} iconName={iconFor(data)} t={pre ? 999 : f - T.B1 - 4} variant={variant} />
      <Headline {...P.headG} text={data.headline} t={pre ? 999 : tB1 - 8} variant={variant} />
      {isList
        ? <ChecklistRows x={L.body.x} y={P.rowsTop} w={contentW} rowH={P.rowH} rows={data.rows!} f={f} at={T.B1 + 22} slots={P.slots} still={still} />
        : <Body x={L.body.x} y={P.bodyY} w={contentW} lh={P.bodyLh} pages={P.pages} starts={P.pageStarts} f={f} variant={variant} still={still} />}
      <MediaWindow receipts={data.receipts ?? []} footnote={data.footnote} geo={P.media} f={f} at={T.B2} slots={P.slots}
        variant={variant} still={still} tagSize={layout === 'CARD45' ? 17 : 18} />
      <Footnote x={L.footnote.x} y={L.footnote.y} size={L.footnote.size} text={data.footnote} t={still ? 999 : f - T.B2 - 12} variant={variant} width={contentW} />
      <Chips chips={chips} geo={L.chips} width={contentW} f={f} at={[T.B3, T.B4]} variant={variant} still={still} />
      {children}
    </div>
  );
};
