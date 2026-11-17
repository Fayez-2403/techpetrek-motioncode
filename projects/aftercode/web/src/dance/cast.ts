// The cast: original characters made in the builder (made-up names and looks; no real person's face or likeness).
// The app's CAST presets and the final reel (src/reel/final.ts) both read these.
import { DEFAULT_LOOK, type Look } from './avatar';
import type { StyleId } from './clips';

export interface Character { name: string; look: Look; style: StyleId }
const C = (name: string, look: Partial<Look>, style: StyleId): Character => ({ name, look: { ...DEFAULT_LOOK, ...look }, style });

export const CAST = {
  founder: C('Hoodie Founder', { outfit: 'hoodie', hair: 'curly', accessory: 'glasses', skin: '#eabf9c', hairColor: '#2a1c14' }, 'hiphop'),
  boss: C('Boardroom Boss', { outfit: 'suit', hair: 'quiff', facialHair: 'stubble', skin: '#c98a64', hairColor: '#0e0c0b', color: '#59606e' }, 'popping'),
  president: C('The President', { outfit: 'suit', hair: 'side', accessory: 'glasses', skin: '#dba57f', hairColor: '#4a2f1e', color: '#263451', build: 1.08 }, 'hiphop'),
  chancellor: C('The Chancellor', { outfit: 'suit', hair: 'buzz', facialHair: 'mustache', skin: '#eabf9c', hairColor: '#8e8e93', color: '#18181b' }, 'popping'),
  neta1: C('Neta No. 1', { outfit: 'kurta', hair: 'buzz', facialHair: 'mustache', skin: '#ad7350', hairColor: '#59606e', color: '#263451', build: 1.15 }, 'bollywood'),
  neta2: C('Neta No. 2', { outfit: 'kurta', hair: 'quiff', accessory: 'glasses', skin: '#c98a64', hairColor: '#0e0c0b', color: '#8e1f2f' }, 'hiphop'),
  hero: C('Hero', { outfit: 'leather', hair: 'quiff', accessory: 'shades', facialHair: 'stubble', skin: '#d9a07a', hairColor: '#0e0c0b', build: 1.1 }, 'bollywood'),
  heroine: C('Heroine', { outfit: 'lehenga', hair: 'long', skin: '#dba57f', hairColor: '#2a1c14', eyes: '#5a3a22', build: 0.92, height: 0.95 }, 'bollywood'),
  kabir: C('Kabir', { outfit: 'sweater', hair: 'short', facialHair: 'stubble', skin: '#c98a64', hairColor: '#2a1c14' }, 'disco'),
  meera: C('Meera', { outfit: 'street', hair: 'ponytail', skin: '#dba57f', hairColor: '#4a2f1e', color: '#f2c14e', height: 0.95 }, 'disco'),
  rohan: C('Rohan', { outfit: 'office', hair: 'curly', accessory: 'glasses', skin: '#ad7350', hairColor: '#0e0c0b' }, 'disco'),
  tara: C('Tara', { outfit: 'sweater', hair: 'long', skin: '#eabf9c', hairColor: '#7a5232', color: '#a3124a', height: 0.96 }, 'disco'),
  vikram: C('Vikram', { outfit: 'leather', hair: 'buzz', facialHair: 'goatee', skin: '#8e5b3d', hairColor: '#0e0c0b', build: 1.12 }, 'disco'),
  zoya: C('Zoya', { outfit: 'contemporary', hair: 'bun', skin: '#f6d7c0', hairColor: '#b88a52', eyes: '#3f6d4e', height: 0.94 }, 'disco'),
} satisfies Record<string, Character>;
export type CastId = keyof typeof CAST;
export const SQUAD: CastId[] = ['kabir', 'meera', 'rohan', 'tara', 'vikram', 'zoya'];
