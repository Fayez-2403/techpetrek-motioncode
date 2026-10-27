// CASE BOARD layout (board builder): where every card hangs (Railway central), the receipt prints pinned beside each
// card, and the red strings. Pure data, derived from cases.json + the segment order in SCENE_TIMINGS.json, so a new case
// or a re-ordered timeline re-lays the board without code changes.
//   world units: card = 0.9 x 1.6 (9:16, same as the frame), board plane z = 0, +y up the wall, +z out of the board.
import { CARD_SEGS, CASES, SEGS, type Case } from '../lib/timeline';
import { CHECKLIST, type CardData } from '../components/CaseCard';
import type { V3 } from './stage';

export const CW = 0.9, CH = 1.6, CT = 0.004;   // card width, height, thickness
export const Z_CARD = 0.0085;                    // card centre above the board (front face at Z_CARD + CT/2)
export const Z_FRONT = Z_CARD + CT / 2;
export const FLAT_DZ = 0.0006;                   // unlit hand-off overlay above the front face
export const TACK_Z = 0.03;                      // strings are tied round the brass tacks at this height
export const DEG = Math.PI / 180;

export interface ReceiptRef { file: string; source: string }
export interface PrintSpot { key: string; x: number; y: number; rot: number; maxW: number; maxH: number; z: number; file: string | null; source: string; pin: string }
export interface BoardCard {
  id: string; k: number; segIdx: number; dark: boolean; data: CardData;
  x: number; y: number; rot: number;            // board position (card centre) + rotation (rad)
  pin: V3;                                      // red push pin holding the card (top centre, on the card)
  tack: V3;                                     // brass tack above the card where the strings are tied
  tackLow: V3;                                  // second tack below the card (strings to lower cards, so none crosses a headline)
  prints: PrintSpot[];
}
export interface BoardString { id: string; a: number; b: number; kind: 'hub' | 'chain'; pa: V3; pb: V3 }

// ---------------------------------------------------------------- slots (travel order = segment order)
type Slot = { x: number; y: number; rot: number; spots: { dx: number; dy: number; rot: number; w: number; h: number }[] };
const CENTER: Slot = { x: 0, y: 0.1, rot: -1.4, spots: [{ dx: 0.3, dy: -1.06, rot: 3.2, w: 0.92, h: 0.34 }, { dx: -0.62, dy: 1.12, rot: -4.5, w: 0.66, h: 0.3 }] };
const RING: Slot[] = [
  { x: 1.62, y: 1.08, rot: 3.0, spots: [{ dx: 0.02, dy: -1.06, rot: -3.0, w: 0.86, h: 0.3 }, { dx: -0.8, dy: 0.66, rot: 5.0, w: 0.6, h: 0.28 }] },
  { x: -1.6, y: 1.32, rot: -3.2, spots: [{ dx: 0.06, dy: -1.08, rot: 2.6, w: 0.9, h: 0.3 }, { dx: 0.76, dy: 0.6, rot: -6.0, w: 0.56, h: 0.28 }] },
  { x: -1.66, y: -1.4, rot: 2.4, spots: [{ dx: 0.12, dy: -1.1, rot: -2.5, w: 0.88, h: 0.32 }, { dx: 0.7, dy: 0.42, rot: 5.0, w: 0.5, h: 0.3 }] },
  { x: 1.64, y: -1.24, rot: -2.6, spots: [{ dx: 0.04, dy: -1.1, rot: 3.0, w: 0.84, h: 0.3 }, { dx: -0.74, dy: 0.55, rot: -4.0, w: 0.5, h: 0.3 }] },
  { x: -0.58, y: -2.62, rot: 3.0, spots: [{ dx: -0.18, dy: -1.02, rot: -2.0, w: 0.9, h: 0.3 }, { dx: -0.2, dy: 1.16, rot: 4.0, w: 0.62, h: 0.26 }] },
  { x: 0.05, y: 2.75, rot: -1.6, spots: [{ dx: 0.75, dy: 0.2, rot: 4, w: 0.6, h: 0.3 }] },
  { x: 2.25, y: 2.95, rot: 2.0, spots: [] },
  { x: -2.25, y: 3.05, rot: -2.0, spots: [] },
];
const CHECK: Slot = { x: 0.9, y: -2.8, rot: -2.2, spots: [] };
const ringSlot = (i: number): Slot => {
  if (i < RING.length) return RING[i];
  const a = 2.4 * i, r = 3.3 + 0.25 * (i % 3);           // golden-angle fallback for long timelines
  return { x: Math.cos(a) * r * 0.75, y: Math.sin(a) * r, rot: ((i % 2) * 2 - 1) * 2.5, spots: [] };
};

// ---------------------------------------------------------------- receipts
const PIN_COLORS = ['#E9E4D6', '#E7B93C', '#2C2E33', '#D8D2C2'];
function asReceipts(c: Case): ReceiptRef[] {
  const raw = (c as { receipts?: unknown }).receipts;
  if (!Array.isArray(raw)) return [];
  const out: ReceiptRef[] = [];
  for (const r of raw) {
    let file: string | null = null, source = '';
    if (typeof r === 'string') file = r;
    else if (r && typeof r === 'object') {
      const o = r as Record<string, unknown>;
      const f = o.file ?? o.png ?? o.src ?? o.path;
      file = typeof f === 'string' ? f : null;
      source = typeof o.source === 'string' ? o.source : [o.publisher, o.date].filter((x) => typeof x === 'string').join(' · ');
    }
    if (!file || !/\.(png|jpe?g|webp)$/i.test(file)) continue;
    file = file.replace(/^\/+/, '').replace(/^public\//, '');
    if (!file.startsWith('receipts/')) file = `receipts/${file}`;
    out.push({ file, source: source || c.footnote });
  }
  return out;
}

// ---------------------------------------------------------------- the cards
const rotate = (x: number, y: number, a: number): [number, number] => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];

function buildCards(): BoardCard[] {
  let ring = 0;
  return CARD_SEGS.map((seg, k) => {
    const isCheck = seg.id === 'checklist';
    const c = CASES.find((x) => x.id === seg.id);
    const data: CardData = isCheck || !c ? CHECKLIST : (c as unknown as CardData);
    const slot = k === 0 ? CENTER : isCheck ? CHECK : ringSlot(ring++);
    const rot = slot.rot * DEG;
    const [px, py] = rotate(0, CH / 2 - 0.085, rot);
    const [tx, ty] = rotate(0, CH / 2 + 0.07, rot);
    const [bx, by] = rotate(0, -CH / 2 - 0.07, rot);
    const recs = c && !isCheck ? asReceipts(c) : [];
    const prints: PrintSpot[] = [];
    const spots = slot.spots.slice(0, Math.max(1, Math.min(2, recs.length || 1)));
    spots.forEach((s, i) => {
      const r = recs[i];
      prints.push({ key: `${seg.id}-p${i}`, x: slot.x + s.dx, y: slot.y + s.dy, rot: s.rot * DEG, maxW: s.w, maxH: s.h, z: 0.0032 + i * 0.0007,
        file: r ? r.file : null, source: r ? r.source : '', pin: PIN_COLORS[(k + i) % PIN_COLORS.length] });
    });
    return { id: seg.id, k, segIdx: SEGS.indexOf(seg), dark: isCheck, data, x: slot.x, y: slot.y, rot,
      pin: [slot.x + px, slot.y + py, Z_FRONT], tack: [slot.x + tx, slot.y + ty, 0], tackLow: [slot.x + bx, slot.y + by, 0], prints };
  });
}

export const BOARD_CARDS: BoardCard[] = buildCards();
export const NCARDS = BOARD_CARDS.length;
/** number of real cases on the board (everything before the checklist) */
export const NCASES = BOARD_CARDS.filter((c) => !c.dark).length;

/** hub strings: Railway card to every other case (snap taut in the hook); chain: consecutive cards (drawn by the rail move) */
function ends(a: number, b: number): [V3, V3] {
  const A = BOARD_CARDS[a], B = BOARD_CARDS[b];
  const from = B.y < A.y - 0.9 ? A.tackLow : A.tack;          // going down: leave from the bottom tack
  return [[from[0], from[1], TACK_Z], [B.tack[0], B.tack[1], TACK_Z]];
}
function buildStrings(): BoardString[] {
  const out: BoardString[] = [];
  const push = (id: string, a: number, b: number, kind: 'hub' | 'chain') => { const [pa, pb] = ends(a, b); out.push({ id, a, b, kind, pa, pb }); };
  for (let j = 1; j < NCASES; j++) push(`hub-${j}`, 0, j, 'hub');
  for (let i = 1; i < NCARDS - 1; i++) push(`chain-${i}`, i, i + 1, 'chain');
  return out;
}
export const BOARD_STRINGS: BoardString[] = buildStrings();
/** the string the camera travels along into card k (k >= 1) */
export const travelString = (k: number) => BOARD_STRINGS.findIndex((s) => (k === 1 ? s.kind === 'hub' && s.b === 1 : s.kind === 'chain' && s.b === k));
/** tacks that carry at least one string */
export const TACKS: V3[] = (() => {
  const seen = new Map<string, V3>();
  for (const s of BOARD_STRINGS) for (const p of [s.pa, s.pb]) seen.set(`${p[0].toFixed(4)},${p[1].toFixed(4)}`, [p[0], p[1], 0]);
  return [...seen.values()];
})();

/** world point of a card-local point (card-local: x right, y up, from the card centre) on the card at rest */
export function onCard(c: BoardCard, lx: number, ly: number, z = Z_FRONT): V3 {
  const [x, y] = rotate(lx, ly, c.rot);
  return [c.x + x, c.y + y, z];
}
/** card px (CARD layout, 1080 x 1920) -> card-local world offset */
export const px2local = (x: number, y: number): [number, number] => [(x / 1080 - 0.5) * CW, (0.5 - y / 1920) * CH];

/** the SECRETS · ROTATE stamp on the Railway card, in card px (exported so a 2D card can reproduce it if wanted) */
export const STAMP = { cx: 548, cy: 760, w: 820, h: 214, rotDeg: -6.5, text: 'SECRETS · ROTATE' } as const;
