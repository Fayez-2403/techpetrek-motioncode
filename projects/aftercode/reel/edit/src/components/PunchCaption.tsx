// One short Roman Hinglish punch line in the fixed caption band under the media window (never stacked subtitles).
// Cards come from the lead (SCENE_TIMINGS.variants.reel.captions): { t0, t1, text, words: [{ w, t0, t1 }] }, seconds.
// Each word masks up at its own spoken time (all at t0 if a card has no word timings). Key words: *asterisks* in the
// word/text, or `key: true` / `hl: true` on a word -> alert accent + marker underline. One line, fitted to the band.
import React from 'react';
import { easeInCubic, easeOutCubic, easeOutExpo, invLerp } from '../lib/anim';
import { C } from '../styles/theme';
import { F } from '../styles/typography';
import { fitSize } from './cardText';
import type { Variant } from './TypeTag';

export interface CaptionWord { w: string; t0: number; t1: number; key?: boolean; hl?: boolean }
export interface CaptionCard { t0: number; t1: number; text: string; words?: CaptionWord[] }
interface Geo { y: number; h: number; size: number }
interface Props { cards: CaptionCard[]; frame: number; fps?: number; geo: Geo; x?: number; width?: number; variant?: Variant; align?: 'left' | 'center' }

const CAP = { family: F.head, weight: 820, tracking: -0.02, ws: 0.02 };
const strip = (s: string) => s.replace(/\*/g, '');
const isKey = (s: string) => /^\*.*\*[.,!?…:;]*$/.test(s.trim());

export const PunchCaption: React.FC<Props> = ({ cards, frame, fps = 60, geo, x = 64, width = 952, variant = 'paper', align = 'left' }) => {
  if (!geo.h) return null;
  const sec = frame / fps;
  const card = cards.find((c) => sec >= c.t0 && sec < c.t1);
  if (!card) return null;
  const words: CaptionWord[] = card.words?.length
    ? card.words
    : card.text.trim().split(/\s+/).map((w) => ({ w, t0: card.t0, t1: card.t1 }));
  const plain = words.map((w) => strip(w.w)).join(' ');
  const size = fitSize(plain, width, geo.size, CAP, geo.size * 0.68);
  const left = (card.t1 - sec) * fps;
  const out = easeInCubic(invLerp(7, 0, left));
  const dark = variant === 'dark';
  return (
    <div style={{ position: 'absolute', left: x, top: geo.y, width, height: geo.h, display: 'flex', alignItems: 'center',
      justifyContent: align === 'center' ? 'center' : 'flex-start', gap: size * (0.26 + CAP.ws),
      fontFamily: CAP.family, fontWeight: CAP.weight, fontSize: size, letterSpacing: `${CAP.tracking}em`, lineHeight: 1, whiteSpace: 'nowrap',
      color: dark ? C.lunar : C.ink, opacity: 1 - out, transform: `translateY(${-out * 10}px)` }}>
      {words.map((w, i) => {
        const t = (sec - Math.max(card.t0, w.t0)) * fps + 2;   // word lands ~2 frames before it is heard
        const p = easeOutExpo(invLerp(0, 14, t));
        const u = easeOutCubic(invLerp(6, 20, t));
        const hl = w.key || w.hl || isKey(w.w);
        return (
          <span key={i} style={{ position: 'relative', display: 'inline-block', overflow: 'hidden', padding: '0.08em 0 0.16em', margin: '-0.08em 0 -0.16em' }}>
            <span style={{ display: 'inline-block', transform: `translateY(${(1 - p) * 112}%)`, color: hl ? (dark ? '#FF7B47' : C.alertDeep) : undefined }}>{strip(w.w)}</span>
            {hl && <span style={{ position: 'absolute', left: 0, bottom: '0.06em', height: '0.09em', width: `${u * 100}%`, background: C.alert }} />}
          </span>
        );
      })}
    </div>
  );
};
