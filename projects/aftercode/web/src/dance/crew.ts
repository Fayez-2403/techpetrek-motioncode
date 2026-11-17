// Choreography and formations for solo / duo / crew. Everything is a pure function of the song beat position b, so a
// seek or pause can never put dancers out of step. Formations change only on phrase boundaries (8 bars by default) and
// glide between spots over 4 beats with ease-in-out, never teleporting; spacing keeps >= 1.05 m between performers.
import type { StyleId } from './clips';
import type { Look } from './avatar';

export interface Performer { id: string; faceId: string | null; look: Look; style: StyleId; role: 'lead' | 'support'; spawnBeat?: number; name?: string }
export const DUO_MODES = [
  { id: 'mirror', name: 'Mirror duo' }, { id: 'sync', name: 'Synchronized duo' }, { id: 'battle', name: 'Dance battle' },
  { id: 'alternate', name: 'Alternating groove' }, { id: 'comedy', name: 'Comedy duo' }, { id: 'bollywood', name: 'Bollywood-inspired duo' },
] as const;
export const CREW_MODES = [
  { id: 'chorus', name: 'Full synchronized routine' }, { id: 'canon', name: 'Canon (delayed)' }, { id: 'teams', name: 'Two-team battle' },
  { id: 'highlight', name: 'Solo highlights' }, { id: 'leader', name: 'Leader + followers' }, { id: 'buildup', name: 'Build-up to the drop' }, { id: 'own', name: 'Everyone their own style' },
] as const;
export const FORMATIONS = [
  { id: 'line', name: 'Straight line' }, { id: 'v', name: 'V formation' }, { id: 'circle', name: 'Circle' }, { id: 'triangle', name: 'Triangle' },
  { id: 'rows', name: 'Two rows' }, { id: 'soloist', name: 'Centre soloist' }, { id: 'dynamic', name: 'Dynamic switching' },
] as const;
export type DuoMode = (typeof DUO_MODES)[number]['id'];
export type CrewMode = (typeof CREW_MODES)[number]['id'];
export type FormationId = (typeof FORMATIONS)[number]['id'];

const SP = 1.15;   // spacing (m)
export function spot(f: Exclude<FormationId, 'dynamic'>, n: number, i: number): [number, number] {
  if (n === 1) return [0, 0];
  const mid = (n - 1) / 2;
  switch (f) {
    case 'line': return [(i - mid) * SP, 0];
    case 'v': { const k = i - mid; return [k * SP * 0.95, -Math.abs(k) * 0.7]; }
    case 'circle': { if (n === 2) return [(i - 0.5) * SP * 1.2, 0]; const a = (i / n) * Math.PI * 2 + Math.PI / 2, r = Math.max(1.1, (SP * n) / (2 * Math.PI)); return [Math.cos(a) * r, Math.sin(a) * r * 0.75 - 0.2]; }
    case 'triangle': { let row = 0, idx = i; while (idx > row) { idx -= row + 1; row++; } return [(idx - row / 2) * SP, -row * 0.85 + 0.4]; }
    case 'rows': { const front = Math.ceil(n / 2), r = i < front ? 0 : 1, k = r ? i - front : i, cnt = r ? n - front : front; return [(k - (cnt - 1) / 2) * SP * 1.3, r ? -1.35 : 0.35]; }
    case 'soloist': { if (i === 0) return [0, 0.55]; const k = i - 1, m = n - 1; return [(k - (m - 1) / 2) * SP, -0.75]; }
  }
}
const DYN: Exclude<FormationId, 'dynamic'>[] = ['line', 'v', 'rows', 'circle', 'soloist'];
const ease = (u: number) => (u < 0.5 ? 2 * u * u : 1 - (-2 * u + 2) ** 2 / 2);
/** position of performer i at beat b: formation per phrase, gliding to the next one over 4 beats before the phrase line */
export function position(f: FormationId, n: number, i: number, b: number, phraseBeats = 32): [number, number] {
  if (f !== 'dynamic') return spot(f, n, i);
  const ph = Math.max(0, Math.floor(b / phraseBeats)), into = b - ph * phraseBeats;
  const cur = DYN[ph % DYN.length], next = DYN[(ph + 1) % DYN.length];
  const a = spot(cur, n, i), c = spot(next, n, i);
  const u = ease(Math.max(0, Math.min(1, (into - (phraseBeats - 4)) / 4)));
  return [a[0] + (c[0] - a[0]) * u, a[1] + (c[1] - a[1]) * u];
}

export interface Cue { style: StyleId; beatOffset: number; mirror: boolean; intensity: number; yaw: number; rap?: number }   // rap: 0-1, the mouth raps on the beat
/** what each performer dances at beat b */
export function cue(kind: 'solo' | DuoMode | CrewMode, p: Performer[], i: number, b: number, dropBeat = 1e9, turn = 8, turnAt = 0): Cue {
  const me = p[i], n = p.length, phrase8 = Math.floor((b - turnAt) / turn), odd = ((phrase8 % 2) + 2) % 2, phrase4 = Math.floor(b / 4);   // phrase8: the battle turn (turn beats long, counted from turnAt)
  const base: Cue = { style: me.style, beatOffset: 0, mirror: false, intensity: 1, yaw: 0 };
  switch (kind) {
    case 'solo': return base;
    case 'mirror': return { ...base, style: p[0].style, mirror: i === 1 };
    case 'sync': return { ...base, style: p[0].style };
    case 'battle': { const on = odd === i % 2; return { ...base, style: on ? me.style : 'groove', intensity: on ? 1.05 : 0.55, yaw: on ? 0 : (i === 0 ? 0.6 : -0.6), rap: on ? 1 : 0 }; }
    case 'alternate': { const on = phrase4 % 2 === i % 2; return { ...base, intensity: on ? 1.05 : 0.6 }; }
    case 'comedy': return { ...base, style: odd ? 'comedy' : 'moonwalk', intensity: 1.12, mirror: i === 1 };
    case 'bollywood': return { ...base, style: 'bollywood', mirror: i === 1 };
    case 'own': return base;
    case 'chorus': return { ...base, style: p[0].style };
    case 'canon': return { ...base, style: p[0].style, beatOffset: -i };
    case 'teams': { const team = i < Math.ceil(n / 2) ? 0 : 1, on = odd === team; return { ...base, style: team ? p[n - 1].style : p[0].style, intensity: on ? 1.05 : 0.5, yaw: on ? 0 : (team ? -0.5 : 0.5), rap: on ? 0.8 : 0 }; }
    case 'highlight': { const star = phrase8 % n; return { ...base, style: i === star ? me.style : p[0].style, intensity: i === star ? 1.1 : 0.55 }; }
    case 'leader': return { ...base, style: p[0].style, beatOffset: i === 0 ? 0 : -1, intensity: i === 0 ? 1.1 : 0.9 };
    case 'buildup': { const pre = b < dropBeat; return { ...base, style: p[0].style, beatOffset: pre ? -i * 0.5 : 0, intensity: pre ? 0.55 + 0.45 * Math.max(0, 1 - (dropBeat - b) / 32) : 1.1 }; }
  }
  return base;
}
