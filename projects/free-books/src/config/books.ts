// The 12 books. Every one is free from its own author or publisher (official page captured 2026-11-04 in
// public/pages/, the proof text located on that page in pages.json). Covers in the film are our own typographic
// design (not the publisher's art); the real official pages appear as the panels.
import PAGES from './pages.json';

export interface Book {
  id: string; page: keyof typeof PAGES.pages; title: string[]; by: string; pub: string;
  free: 'FREE PDF' | 'FREE ONLINE' | 'FREE PDF + ONLINE'; licence?: string; learn: string; site: string;
  cover: [string, string]; // our cover colours: base, accent
}
export const BOOKS: Book[] = [
  { id: 'lbdl', page: 'lbdl', title: ['THE LITTLE BOOK', 'OF DEEP LEARNING'], by: 'François Fleuret', pub: 'Univ. of Geneva · 2023', free: 'FREE PDF', licence: 'CC non-commercial · 1,000,000+ downloads', learn: 'deep learning, end to end, in a phone-sized read', site: 'fleuret.org/francois/lbdl.html', cover: ['#1d3557', '#f1c40f'] },
  { id: 'udl', page: 'udl', title: ['UNDERSTANDING', 'DEEP LEARNING'], by: 'Simon J. D. Prince', pub: 'MIT Press · 2023', free: 'FREE PDF', learn: 'the maths and intuition behind modern models', site: 'udlbook.github.io/udlbook', cover: ['#0b4f6c', '#20bf55'] },
  { id: 'dlbook', page: 'dlbook', title: ['DEEP', 'LEARNING'], by: 'Goodfellow · Bengio · Courville', pub: 'MIT Press · 2016', free: 'FREE ONLINE', learn: 'the classic deep-learning textbook', site: 'deeplearningbook.org', cover: ['#3d0c11', '#ff6b6b'] },
  { id: 'd2l', page: 'd2l', title: ['DIVE INTO', 'DEEP LEARNING'], by: 'Zhang · Lipton · Li · Smola', pub: 'open source · used at 500 universities', free: 'FREE PDF + ONLINE', learn: 'learn by running code: PyTorch, JAX, TensorFlow', site: 'd2l.ai', cover: ['#14213d', '#fca311'] },
  { id: 'mml', page: 'mml', title: ['MATHEMATICS', 'FOR MACHINE', 'LEARNING'], by: 'Deisenroth · Faisal · Ong', pub: 'Cambridge Univ. Press · 2020', free: 'FREE PDF', learn: 'linear algebra, calculus, probability for ML', site: 'mml-book.github.io', cover: ['#2d6a4f', '#d8f3dc'] },
  { id: 'rl', page: 'rl', title: ['REINFORCEMENT', 'LEARNING'], by: 'Sutton & Barto', pub: 'MIT Press · 2nd ed. 2018', free: 'FREE PDF', learn: 'the RL bible: rewards, agents, policies', site: 'incompleteideas.net/book', cover: ['#5a189a', '#e0aaff'] },
  { id: 'sre', page: 'sre', title: ['SITE', 'RELIABILITY', 'ENGINEERING'], by: 'Google', pub: "O'Reilly · 2016", free: 'FREE ONLINE', learn: 'how Google runs production systems', site: 'sre.google/books', cover: ['#1a73e8', '#ffffff'] },
  { id: 'srw', page: 'sre', title: ['THE SITE', 'RELIABILITY', 'WORKBOOK'], by: 'Google', pub: "O'Reilly · 2018", free: 'FREE ONLINE', learn: 'SRE in practice: SLOs, on-call, incidents', site: 'sre.google/books', cover: ['#188038', '#ffffff'] },
  { id: 'bsrs', page: 'sre', title: ['BUILDING SECURE', '& RELIABLE', 'SYSTEMS'], by: 'Google', pub: "O'Reilly · 2020", free: 'FREE ONLINE', learn: 'security + reliability by design', site: 'sre.google/books', cover: ['#c5221f', '#ffffff'] },
  { id: 'progit', page: 'progit', title: ['PRO', 'GIT'], by: 'Scott Chacon & Ben Straub', pub: 'Apress · 2nd ed.', free: 'FREE PDF + ONLINE', licence: 'CC BY-NC-SA 3.0', learn: 'Git from basics to internals', site: 'git-scm.com/book', cover: ['#f05032', '#1b1b1b'] },
  { id: 'ejs', page: 'ejs', title: ['ELOQUENT', 'JAVASCRIPT'], by: 'Marijn Haverbeke', pub: '4th edition · 2024', free: 'FREE ONLINE', licence: 'CC BY-NC', learn: 'JavaScript, properly, with exercises', site: 'eloquentjavascript.net', cover: ['#f7df1e', '#1b1b1b'] },
  { id: 'ostep', page: 'ostep', title: ['OPERATING', 'SYSTEMS: THREE', 'EASY PIECES'], by: 'Remzi & Andrea Arpaci-Dusseau', pub: 'Univ. of Wisconsin', free: 'FREE PDF', learn: 'how an OS really works', site: 'pages.cs.wisc.edu/~remzi/OSTEP', cover: ['#264653', '#e9c46a'] },
];
export const byId = (id: string) => BOOKS.find((b) => b.id === id)!;
export const proof = (b: Book) => (PAGES.pages as Record<string, { proof: { u: number; v: number; w: number; h: number; text: string } | null }>)[b.page].proof;

export interface Slide { id: string; kicker: string; books: string[]; dur: number }
export const SLIDES: Slide[] = [
  { id: 's1', kicker: 'FREE', books: [], dur: 10 },
  { id: 's2', kicker: 'START WITH AI', books: ['lbdl', 'udl'], dur: 8.5 },
  { id: 's3', kicker: 'GO DEEPER', books: ['dlbook', 'd2l'], dur: 8.5 },
  { id: 's4', kicker: 'MATHS + RL', books: ['mml', 'rl'], dur: 8.5 },
  { id: 's5', kicker: 'RUN IT LIKE GOOGLE', books: ['sre', 'srw', 'bsrs'], dur: 11 },
  { id: 's6', kicker: 'CODE + SYSTEMS', books: ['progit', 'ejs', 'ostep'], dur: 11 },
  { id: 's7', kicker: 'GET ALL 12', books: [], dur: 7 },
];
/** a book segment inside a slide: [t0, t1) */
export const segs = (s: Slide) => { const lead = 0.25, per = (s.dur - lead - 0.35) / Math.max(1, s.books.length); return s.books.map((id, i) => ({ id, t0: lead + i * per, t1: lead + (i + 1) * per })); };
