// The reel's 2D layer over the WebGL frame and the DOM controls, drawn fresh for every frame from t (pure).
// Text stays inside the Reels safe zone: x 90..960, y 230..1600 of 1080x1920.
import { sat, smooth, outCubic, outExpo } from './util';

export interface VOWord { w: string; start: number; end: number }
export interface VOLine { i: number; chapter: string; text: string; start: number; end: number; words: VOWord[] }

const W = 1080, H = 1920;
const GOLD = ['#fff4cf', '#ffd77a', '#e6a033'];
// key words in gold, the claim words in sky blue (kept in step with analysis/script_astra.py EMPH / RISK)
const EMPH = new Set(['Mahabharat', 'legendary', 'weapons', 'PHYSICS', 'ENGINE', 'celestial', 'bow', 'string', 'kheench', 'Power', 'aim', 'impact', 'pahaad',
  'Lightning,', 'fire,', 'storm…', 'cosmic', 'gravity', 'Gravity,', 'power,', 'material—', 'LIVE', 'impossible', 'teen', 'rings,', 'final', 'target.', 'perfect', 'shot',
  '3D', 'physics', 'experience', 'object', 'simulate']);
const CLAIM = new Set(['pre-rendered', 'nahi!', 'Claude', 'Code', 'actual', 'interactive']);

export class Overlay {
  cv = document.createElement('canvas'); c: CanvasRenderingContext2D;
  bursts: { words: VOWord[]; start: number; end: number }[] = [];
  constructor(host: HTMLElement, vo: VOLine[]) {
    this.cv.width = W; this.cv.height = H; this.c = this.cv.getContext('2d')!;
    host.appendChild(this.cv);
    // caption bursts: 2 to 4 words, broken after punctuation, each held until the next one starts
    for (const l of vo) {
      let cur: VOWord[] = [];
      const flush = () => { if (cur.length) this.bursts.push({ words: cur, start: cur[0]!.start, end: cur[cur.length - 1]!.end }); cur = []; };
      l.words.forEach((w) => { cur.push(w); if (cur.length >= 4 || (cur.length >= 2 && /[,.!?…।—]$/.test(w.w))) flush(); });
      flush();
    }
    for (let i = 0; i < this.bursts.length; i++) {
      const b = this.bursts[i]!, n = this.bursts[i + 1];
      b.end = Math.min(b.end + 0.45, n ? n.start - 0.02 : b.end + 0.45);
    }
  }
  clear() { this.c.clearRect(0, 0, W, H); }

  private font(px: number, w = 900, fam = 'Archivo X') { this.c.font = `${w} ${px}px "${fam}", "Segoe UI Emoji", sans-serif`; }

  /** A centred title line that slams in (scale and blur settle) and fades out. */
  title(text: string, y: number, t: number, t0: number, t1: number, o: { size?: number; color?: 'gold' | 'white' | 'sky' | 'violet'; glow?: string; tracking?: number; slam?: boolean; out?: number } = {}) {
    if (t < t0 || t > t1 + (o.out ?? 0.25)) return;
    const c = this.c, size = o.size ?? 92;
    const u = (t - t0) / 0.32, k = o.slam !== false ? 1 + 0.32 * Math.exp(-u * 5) * Math.cos(u * 7) * (u < 1.6 ? 1 : 0) : 1;
    const a = sat((t - t0) / 0.08) * (1 - sat((t - t1) / (o.out ?? 0.25)));
    if (a <= 0) return;
    this.font(size);
    const track = o.tracking ?? 0.04;
    c.save(); c.globalAlpha = a; c.translate(W / 2, y); c.scale(k, k);
    const letters = [...text], widths = letters.map((ch) => c.measureText(ch).width + size * track);
    let total = widths.reduce((s, v) => s + v, 0) - size * track;
    const maxW = 880; const fit = total > maxW ? maxW / total : 1;
    c.scale(fit, fit); total *= 1;
    let x = -total / 2;
    const grad = c.createLinearGradient(0, -size * 0.8, 0, size * 0.2);
    const pal = o.color === 'white' ? ['#ffffff', '#f6f0e4', '#d9d1c4'] : o.color === 'sky' ? ['#e8f6ff', '#9fd8ff', '#5aa8ff'] : o.color === 'violet' ? ['#f2e8ff', '#c9a8ff', '#8f6bff'] : GOLD;
    grad.addColorStop(0, pal[0]!); grad.addColorStop(0.55, pal[1]!); grad.addColorStop(1, pal[2]!);
    c.shadowColor = o.glow ?? 'rgba(255,170,60,0.75)'; c.shadowBlur = size * 0.45;
    c.lineJoin = 'round'; c.strokeStyle = 'rgba(10,6,2,0.85)'; c.lineWidth = size * 0.11;
    for (let i = 0; i < letters.length; i++) { c.strokeText(letters[i]!, x, 0); x += widths[i]!; }
    x = -total / 2; c.shadowBlur = 0; c.fillStyle = grad;
    for (let i = 0; i < letters.length; i++) { c.fillText(letters[i]!, x, 0); x += widths[i]!; }
    c.restore();
  }

  /** Words revealed one after another at given times (e.g. GRAB . PULL . AIM . RELEASE). */
  sequence(words: [string, number][], y: number, t: number, t1: number, size = 64, sep = ' • ') {
    if (t < words[0]![1] || t > t1 + 0.3) return;
    const c = this.c; this.font(size);
    const parts = words.map(([w], i) => (i ? sep : '') + w), ws = parts.map((p) => c.measureText(p).width);
    const total = ws.reduce((a, b) => a + b, 0), fit = Math.min(1, 880 / total);
    let x = -total / 2;
    const fade = 1 - sat((t - t1) / 0.3);
    c.save(); c.translate(W / 2, y); c.scale(fit, fit); y = 0;
    words.forEach(([, t0], i) => {
      const u = sat((t - t0) / 0.22), a = u * fade;
      if (a > 0) {
        c.globalAlpha = a; c.shadowColor = 'rgba(255,170,60,0.8)'; c.shadowBlur = 24 * u;
        c.strokeStyle = 'rgba(10,6,2,0.85)'; c.lineWidth = size * 0.1; c.lineJoin = 'round';
        const yy = y + (1 - outCubic(u)) * 30;
        c.strokeText(parts[i]!, x, yy); c.fillStyle = i === words.length - 1 ? '#9fd8ff' : '#ffe39c'; c.fillText(parts[i]!, x, yy);
      }
      x += ws[i]!;
    });
    c.restore();
  }

  /** VO captions: the burst being spoken, the current word lit. */
  captions(t: number, y = 1450) {
    const b = this.bursts.find((x) => t >= x.start - 0.04 && t < x.end);
    if (!b) return;
    const c = this.c, size = 60;
    this.font(size, 700, 'Archivo');
    const words = b.words.map((w) => w.w), ws = words.map((w) => c.measureText(w + ' ').width);
    // at most two lines inside 880 px
    const lines: number[][] = [[]]; let lw = 0;
    ws.forEach((w, i) => { if (lw + w > 860 && lines[lines.length - 1]!.length) { lines.push([]); lw = 0; } lines[lines.length - 1]!.push(i); lw += w; });
    const pop = outExpo((t - b.start + 0.04) / 0.18);
    c.save();
    lines.forEach((ln, li) => {
      const total = ln.reduce((s, i) => s + ws[i]!, 0);
      let x = W / 2 - total / 2;
      const yy = y + (li - (lines.length - 1) / 2) * size * 1.15 + (1 - pop) * 18;
      for (const i of ln) {
        const w = b.words[i]!, on = t >= w.start - 0.03 && t < w.end + 0.08, said = t >= w.start - 0.03;
        const col = EMPH.has(w.w) ? '#ffd36b' : CLAIM.has(w.w) ? '#9fd8ff' : '#ffffff';
        c.globalAlpha = pop * (said ? 1 : 0.55);
        c.lineJoin = 'round'; c.lineWidth = 12; c.strokeStyle = 'rgba(5,4,10,0.92)'; c.strokeText(w.w, x, yy);
        if (on) { c.shadowColor = col; c.shadowBlur = 22; }
        c.fillStyle = col; c.fillText(w.w, x, yy); c.shadowBlur = 0;
        x += ws[i]!;
      }
    });
    c.restore();
  }

  /** The pointer: an arrow cursor; a ring when it presses; a soft glow while it holds the string. */
  cursor(x: number, y: number, a: number, press: number, hold: boolean, t: number) {
    if (a <= 0.01) return;
    const c = this.c;
    c.save(); c.globalAlpha = a; c.translate(x, y);
    if (hold) { const g = c.createRadialGradient(0, 0, 4, 0, 0, 60); g.addColorStop(0, 'rgba(255,220,140,0.55)'); g.addColorStop(1, 'rgba(255,220,140,0)'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, 60, 0, Math.PI * 2); c.fill(); }
    if (press > 0 && press < 1) { c.strokeStyle = `rgba(255,236,190,${1 - press})`; c.lineWidth = 5; c.beginPath(); c.arc(0, 0, 16 + press * 54, 0, Math.PI * 2); c.stroke(); }
    c.scale(1.9, 1.9);
    c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 28); c.lineTo(7, 21.5); c.lineTo(12, 32); c.lineTo(16.5, 30); c.lineTo(11.5, 20); c.lineTo(20, 20); c.closePath();
    c.shadowColor = 'rgba(0,0,0,0.6)'; c.shadowBlur = 8; c.shadowOffsetY = 2;
    c.fillStyle = '#fff'; c.fill(); c.shadowBlur = 0; c.shadowOffsetY = 0; c.lineWidth = 1.6; c.strokeStyle = '#111'; c.stroke();
    c.restore();
    void t;
  }

  /** A small rounded label (badges, tags, 3D callouts). */
  tag(text: string, x: number, y: number, a: number, o: { size?: number; col?: string; bg?: string; align?: 'left' | 'center' } = {}) {
    if (a <= 0.01) return;
    const c = this.c, size = o.size ?? 30;
    this.font(size, 700, 'Archivo');
    const w = c.measureText(text).width + size * 1.1, h = size * 1.55;
    const x0 = o.align === 'left' ? x : x - w / 2;
    c.save(); c.globalAlpha = a;
    c.fillStyle = o.bg ?? 'rgba(6,8,18,0.72)'; c.strokeStyle = o.col ?? 'rgba(240,189,90,0.8)'; c.lineWidth = 2.5;
    c.beginPath(); c.roundRect(x0, y - h / 2, w, h, h / 2); c.fill(); c.stroke();
    c.fillStyle = o.col ?? '#ffe39c'; c.textBaseline = 'middle'; c.fillText(text, x0 + size * 0.55, y + 1);
    c.restore();
  }

  /** The CTA pill with a drawn bow-and-arrow mark (an emoji font's bow varies by system). */
  cta(text: string, x: number, y: number, a: number, t: number) {
    if (a <= 0.01) return;
    const c = this.c, size = 58;
    this.font(size, 900, 'Archivo X');
    const tw = c.measureText(text).width, icon = 74, w = tw + icon + size * 1.4, h = size * 1.75, x0 = x - w / 2;
    const k = 1 + 0.04 * Math.sin(t * 6) * a;
    c.save(); c.globalAlpha = a; c.translate(x, y); c.scale(k, k); c.translate(-x, -y);
    c.shadowColor = 'rgba(255,170,60,0.7)'; c.shadowBlur = 40;
    const g = c.createLinearGradient(0, y - h / 2, 0, y + h / 2); g.addColorStop(0, '#ffe7a6'); g.addColorStop(1, '#e19a32');
    c.fillStyle = g; c.beginPath(); c.roundRect(x0, y - h / 2, w, h, h / 2); c.fill(); c.shadowBlur = 0;
    c.fillStyle = '#1a0f04'; c.textBaseline = 'middle'; c.fillText(text, x0 + size * 0.7, y + 3);
    // the mark: a recurve bow (an arc), its string, an arrow across
    const ix = x0 + size * 0.7 + tw + 22, iy = y;
    c.strokeStyle = '#1a0f04'; c.lineWidth = 6; c.lineCap = 'round';
    c.beginPath(); c.moveTo(ix + 10, iy - 30); c.quadraticCurveTo(ix + 44, iy, ix + 10, iy + 30); c.stroke();
    c.lineWidth = 2.5; c.beginPath(); c.moveTo(ix + 10, iy - 30); c.lineTo(ix + 10, iy + 30); c.stroke();
    c.lineWidth = 4; c.beginPath(); c.moveTo(ix - 2, iy); c.lineTo(ix + 52, iy); c.stroke();
    c.beginPath(); c.moveTo(ix + 52, iy); c.lineTo(ix + 42, iy - 7); c.lineTo(ix + 42, iy + 7); c.closePath(); c.fillStyle = '#1a0f04'; c.fill();
    c.restore();
  }

  /** A code editor card with real source lines, a highlighted line and a typing cursor. */
  code(rect: [number, number, number, number], a: number, file: string, lines: string[], first: number, hi: number, scroll: number) {
    if (a <= 0.01) return;
    const [x, y, w, h] = rect, c = this.c;
    c.save(); c.globalAlpha = a;
    c.fillStyle = 'rgba(13,15,24,0.95)'; c.strokeStyle = 'rgba(143,182,255,0.35)'; c.lineWidth = 2;
    c.beginPath(); c.roundRect(x, y, w, h, 22); c.fill(); c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.05)'; c.fillRect(x + 2, y + 2, w - 4, 52);
    for (const [k, col] of [[0, '#ff5f57'], [1, '#febc2e'], [2, '#28c840']] as const) { c.fillStyle = col; c.beginPath(); c.arc(x + 30 + k * 26, y + 27, 8, 0, Math.PI * 2); c.fill(); }
    this.font(22, 600, 'Plex Mono'); c.fillStyle = '#cfd9ff'; c.textBaseline = 'middle'; c.fillText(file, x + 120, y + 28);
    c.beginPath(); c.rect(x, y + 56, w, h - 62); c.clip();
    const lh = 33, top = y + 80 - scroll * lh;
    this.font(23, 400, 'Plex Mono');
    lines.forEach((ln, i) => {
      const yy = top + i * lh;
      if (yy < y + 40 || yy > y + h + 20) return;
      if (i === hi) { c.fillStyle = 'rgba(240,189,90,0.16)'; c.fillRect(x + 4, yy - lh / 2, w - 8, lh); }
      c.fillStyle = 'rgba(160,170,200,0.45)'; c.textAlign = 'right'; c.fillText(String(first + i), x + 64, yy); c.textAlign = 'left';
      this.syntax(ln, x + 84, yy, w - 100);
    });
    c.restore();
  }
  private syntax(s: string, x: number, y: number, maxW: number) {
    const c = this.c;
    const re = /(\/\/.*$)|('[^']*'|`[^`]*`|"[^"]*")|(\b(?:const|let|for|if|else|return|new|while|this|class|export|function|import|from|await|async|of|true|false|null)\b)|(\b\d+(?:\.\d+)?(?:e-?\d+)?\b)|([A-Za-z_$][\w$]*(?=\())|([^\s\w]+|\w+|\s+)/g;
    let m: RegExpExecArray | null, xx = x;
    while ((m = re.exec(s)) && xx < x + maxW) {
      const tok = m[0];
      c.fillStyle = m[1] ? '#6a7a99' : m[2] ? '#9fe0a0' : m[3] ? '#c792ea' : m[4] ? '#f7b36b' : m[5] ? '#82aaff' : '#e6e1d6';
      c.fillText(tok, xx, y); xx += c.measureText(tok).width;
    }
  }

  /** A browser window's chrome around a rectangle (the live app in it). */
  browser(rect: [number, number, number, number], a: number, url: string) {
    if (a <= 0.01) return;
    const [x, y, w, h] = rect, c = this.c;
    c.save(); c.globalAlpha = a;
    c.strokeStyle = 'rgba(220,225,240,0.75)'; c.lineWidth = 3; c.beginPath(); c.roundRect(x, y, w, h, 20); c.stroke();
    c.fillStyle = 'rgba(28,30,40,0.96)'; c.beginPath(); c.roundRect(x, y, w, 64, [20, 20, 0, 0]); c.fill();
    for (const [k, col] of [[0, '#ff5f57'], [1, '#febc2e'], [2, '#28c840']] as const) { c.fillStyle = col; c.beginPath(); c.arc(x + 32 + k * 28, y + 32, 9, 0, Math.PI * 2); c.fill(); }
    c.fillStyle = 'rgba(255,255,255,0.09)'; c.beginPath(); c.roundRect(x + 130, y + 14, w - 160, 36, 18); c.fill();
    this.font(22, 400, 'Plex Mono'); c.fillStyle = '#d8dcea'; c.textBaseline = 'middle'; c.fillText(url, x + 152, y + 33);
    c.restore();
  }

  /** Dim everything outside a rectangle (for the browser view). */
  frameMask(rect: [number, number, number, number], a: number) {
    if (a <= 0.01) return;
    const [x, y, w, h] = rect, c = this.c;
    c.save(); c.globalAlpha = a; c.fillStyle = '#05060c';
    c.beginPath(); c.rect(0, 0, W, H); c.roundRect(x, y, w, h, 20); c.fill('evenodd'); c.restore();
  }

  /** A flash-to-white (or colour) over the frame. */
  flash(a: number, col = '255,246,220') { if (a > 0.003) { this.c.fillStyle = `rgba(${col},${Math.min(1, a)})`; this.c.fillRect(0, 0, W, H); } }
  vignette(a: number) {
    if (a <= 0) return;
    const g = this.c.createRadialGradient(W / 2, H / 2, H * 0.25, W / 2, H / 2, H * 0.72);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${a})`); this.c.fillStyle = g; this.c.fillRect(0, 0, W, H);
  }
  /** Letterbox bars (0..1). */
  bars(k: number) { if (k <= 0) return; const h = 150 * smooth(k); this.c.fillStyle = '#000'; this.c.fillRect(0, 0, W, h); this.c.fillRect(0, H - h, W, h); }
}
