// A dark developer workspace drawn in DOM (scene 04, and the token colours for scene 01's terminal): window chrome,
// activity bar, explorer, tabs, gutter, TypeScript highlighting in WORLD.code colours, a line-by-line streaming reveal,
// per-character alpha (for code that lifts off as geometry), skeleton bars and a cursor. Everything is positioned in
// frame pixels so scenes can align 3D points/edges with exact character cells (JetBrains Mono advance = 0.6 em).
import React from 'react';
import { WORLD } from '../styles/theme';
import { F } from '../styles/typography';

const W = WORLD.code;

// ------------------------------------------------------------------------------------------------ tokenizer
export type TokKind = 'kw' | 'str' | 'num' | 'fn' | 'com' | 'type' | 'id' | 'prop' | 'pun' | 'ws';
export interface Tok { t: string; k: TokKind }

const KW = new Set(['const', 'let', 'var', 'function', 'return', 'new', 'import', 'from', 'export', 'for', 'of', 'in', 'if', 'else',
  'type', 'interface', 'as', 'while', 'void', 'number', 'string', 'boolean', 'class', 'extends', 'await', 'async', 'typeof']);
const LIT = new Set(['true', 'false', 'null', 'undefined']);

export const TOK_COLOR: Record<TokKind, string> = {
  kw: W.kw, str: W.str, num: W.num, fn: W.fn, com: W.com, type: W.type, id: W.text, prop: '#C3CCDB', pun: '#8E9AB0', ws: W.text,
};

/** a small, honest TypeScript tokenizer: comments, strings, numbers, keywords, calls, types, punctuation */
export function tokenize(line: string): Tok[] {
  const out: Tok[] = [];
  let i = 0;
  const push = (t: string, k: TokKind) => { out.push({ t, k }); i += t.length; };
  while (i < line.length) {
    const rest = line.slice(i);
    let m: RegExpExecArray | null;
    if ((m = /^\/\/.*/.exec(rest))) push(m[0], 'com');
    else if ((m = /^'(?:[^'\\]|\\.)*'?/.exec(rest)) || (m = /^`[^`]*`?/.exec(rest)) || (m = /^"(?:[^"\\]|\\.)*"?/.exec(rest))) push(m[0], 'str');
    else if ((m = /^\d+(?:\.\d+)?/.exec(rest))) push(m[0], 'num');
    else if ((m = /^[A-Za-z_$][\w$]*/.exec(rest))) {
      const w = m[0], after = line.slice(i + w.length).trimStart(), before = line.slice(0, i).trimEnd();
      const k: TokKind = KW.has(w) ? 'kw' : LIT.has(w) ? 'num' : after.startsWith('(') ? 'fn' : before.endsWith('.') ? 'prop'
        : /^[A-Z]/.test(w) ? 'type' : 'id';
      push(w, k);
    } else if ((m = /^\s+/.exec(rest))) push(m[0], 'ws');
    else if ((m = /^=>/.exec(rest))) push(m[0], 'kw');
    else push(rest[0], 'pun');
  }
  return out;
}

/** per-character colours of a line (same length as the line) */
export function charColors(line: string): string[] {
  const c: string[] = [];
  tokenize(line).forEach((tk) => { for (let i = 0; i < tk.t.length; i++) c.push(TOK_COLOR[tk.k]); });
  return c;
}

// ------------------------------------------------------------------------------------------------ editor
export interface TreeItem { name: string; depth: number; dir?: boolean; open?: boolean; active?: boolean }
export interface TabItem { name: string; active?: boolean; dirty?: boolean }
export interface SkeletonBar { x: number; y: number; w: number; h: number; color: string; a: number }

export interface CodeEditorProps {
  /** window rect in frame px */
  x: number; y: number; w: number; h: number;
  title: string;
  tree?: readonly TreeItem[] | null;
  tabs: readonly TabItem[];
  status?: { left: readonly string[]; right: readonly string[] };
  lines: readonly string[];
  firstLine?: number;
  fs: number; lineH: number;
  /** frame x of the first code column, frame y of row 0's top */
  codeLeft: number; rowTop: number; rows: number;
  /** frame x where the code pane ends / frame y where it ends (a divider is drawn there when it is inside the window) */
  paneRight?: number; paneBottom?: number;
  titleH?: number; tabsH?: number; statusH?: number; activityW?: number; treeW?: number;
  lineReveal?: (row: number) => number;
  charAlpha?: (row: number, col: number) => number;
  skeleton?: (row: number) => SkeletonBar | null;
  activeRow?: number | null;
  cursor?: { row: number; col: number; on: boolean } | null;
  /** opacity of chrome (title, tree, tabs, gutter, status) and of the code text */
  chrome?: number; codeAlpha?: number;
  minimap?: boolean;
  uiScale?: number;
  style?: React.CSSProperties;
}

const Icon: React.FC<{ kind: 'files' | 'search' | 'git' | 'run' | 'ext'; s: number; c: string }> = ({ kind, s, c }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
    {kind === 'files' && <><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5" /></>}
    {kind === 'search' && <><circle cx="11" cy="11" r="6" /><path d="M20 20l-4.3-4.3" /></>}
    {kind === 'git' && <><circle cx="6" cy="6" r="2.2" /><circle cx="6" cy="18" r="2.2" /><circle cx="18" cy="9" r="2.2" /><path d="M6 8.2v7.6M18 11.2c0 3.5-5 3.2-10.4 5.4" /></>}
    {kind === 'run' && <><path d="M7 5l11 7-11 7z" /></>}
    {kind === 'ext' && <><rect x="4" y="4" width="7" height="7" rx="1" /><rect x="13" y="4" width="7" height="7" rx="1" /><rect x="4" y="13" width="7" height="7" rx="1" /><rect x="13" y="13" width="7" height="7" rx="1" /></>}
  </svg>
);

export const CodeEditor: React.FC<CodeEditorProps> = (p) => {
  const {
    x, y, w, h, title, tree, tabs, status, lines, firstLine = 1, fs, lineH, codeLeft, rowTop, rows,
    titleH = 32, tabsH = 38, statusH = 26, activityW = 48, lineReveal, charAlpha, skeleton, activeRow, cursor,
    chrome = 1, codeAlpha = 1, minimap = true, uiScale = 1, style,
  } = p;
  const treeW = tree ? p.treeW ?? 220 : 0;
  const paneRight = Math.min(p.paneRight ?? x + w, x + w);
  const groupLeft = x + activityW + treeW;
  const cw = fs * 0.6;
  const ui = 14 * uiScale;
  const bodyTop = y + titleH, bodyBottom = y + h - statusH;
  const paneBottom = Math.min(p.paneBottom ?? bodyBottom, bodyBottom);
  const mmW = minimap && paneRight - codeLeft > 760 ? 84 : 0;

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', ...style }}>
      {/* window */}
      <div style={{ position: 'absolute', left: x, top: y, width: w, height: h, borderRadius: 12, background: W.bg, overflow: 'hidden',
        boxShadow: `0 40px 120px rgba(0,0,0,${0.55 * chrome}), 0 0 0 1px rgba(120,150,200,${0.16 * chrome})` }}>
        {/* title bar */}
        <div style={{ position: 'absolute', left: 0, top: 0, width: w, height: titleH, background: '#0D1220', opacity: chrome,
          borderBottom: `1px solid ${W.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {['#FF5F57', '#FEBC2E', '#28C840'].map((c, i) => (
            <div key={i} style={{ position: 'absolute', left: 16 + i * 20, top: titleH / 2 - 6, width: 12, height: 12, borderRadius: 6, background: c, opacity: 0.72 }} />
          ))}
          <div style={{ fontFamily: F.text, fontSize: ui, color: W.mute, letterSpacing: '0.01em' }}>{title}</div>
        </div>
        {/* activity bar */}
        <div style={{ position: 'absolute', left: 0, top: titleH, width: activityW, height: h - titleH - statusH, background: '#0C111E', opacity: chrome,
          borderRight: `1px solid ${W.line}`, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 14, gap: 22 }}>
          {(['files', 'search', 'git', 'run', 'ext'] as const).map((k, i) => (
            <div key={k} style={{ position: 'relative' }}>
              {i === 0 && <div style={{ position: 'absolute', left: -(activityW / 2 - 12) - 2, top: -4, width: 2, height: 32, background: W.fn }} />}
              <Icon kind={k} s={24 * uiScale} c={i === 0 ? W.text : W.mute} />
            </div>
          ))}
        </div>
        {/* explorer */}
        {tree && (
          <div style={{ position: 'absolute', left: activityW, top: titleH, width: treeW, height: h - titleH - statusH, background: W.panel, opacity: chrome,
            borderRight: `1px solid ${W.line}`, paddingTop: 10 }}>
            <div style={{ fontFamily: F.text, fontSize: ui * 0.82, color: W.mute, letterSpacing: '0.12em', padding: '2px 16px 10px', fontWeight: 600 }}>EXPLORER</div>
            {tree.map((it, i) => (
              <div key={i} style={{ height: ui * 1.85, display: 'flex', alignItems: 'center', gap: 7, paddingLeft: 12 + it.depth * 12, paddingRight: 8, overflow: 'hidden', textOverflow: 'ellipsis',
                background: it.active ? 'rgba(92,225,255,0.09)' : 'transparent', borderLeft: it.active ? `2px solid ${W.fn}` : '2px solid transparent',
                fontFamily: F.text, fontSize: it.depth === 0 ? ui * 0.86 : ui * 1.02, fontWeight: it.depth === 0 ? 650 : 450,
                letterSpacing: it.depth === 0 ? '0.06em' : '0', color: it.active ? W.text : it.dir ? '#AEB8CB' : W.mute, whiteSpace: 'nowrap' }}>
                {it.dir ? (
                  <svg width={ui * 0.7} height={ui * 0.7} viewBox="0 0 10 10" style={{ transform: `rotate(${it.open ? 90 : 0}deg)` }}>
                    <path d="M3 1.5l4 3.5-4 3.5" fill="none" stroke={W.mute} strokeWidth={1.4} />
                  </svg>
                ) : (
                  <span style={{ fontFamily: F.mono, fontSize: ui * 0.62, fontWeight: 700, color: it.name.endsWith('.json') ? W.num : W.type,
                    width: ui * 1.1, textAlign: 'center' }}>{it.name.endsWith('.json') ? '{}' : 'TS'}</span>
                )}
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>{it.name}</span>
              </div>
            ))}
          </div>
        )}
        {/* tabs */}
        <div style={{ position: 'absolute', left: groupLeft - x, top: titleH, width: paneRight - groupLeft, height: tabsH, background: W.panel, opacity: chrome,
          borderBottom: `1px solid ${W.line}`, display: 'flex', overflow: 'hidden' }}>
          {tabs.map((t, i) => (
            <div key={i} style={{ height: tabsH, display: 'flex', alignItems: 'center', gap: 8, padding: '0 18px', fontFamily: F.text, fontSize: ui,
              color: t.active ? W.text : W.mute, background: t.active ? W.bg : 'transparent', borderRight: `1px solid ${W.line}`,
              borderTop: t.active ? `2px solid ${W.fn}` : '2px solid transparent', whiteSpace: 'nowrap' }}>
              <span style={{ fontFamily: F.mono, fontSize: ui * 0.66, fontWeight: 700, color: W.type }}>TS</span>
              {t.name}
              {t.active && <span style={{ color: W.mute, fontSize: ui * 1.05, marginLeft: 4 }}>×</span>}
            </div>
          ))}
        </div>
        {/* status bar */}
        <div style={{ position: 'absolute', left: 0, top: h - statusH, width: w, height: statusH, background: '#0D1220', opacity: chrome,
          borderTop: `1px solid ${W.line}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 14px',
          fontFamily: F.text, fontSize: ui * 0.9, color: W.mute }}>
          <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
            <svg width={ui} height={ui} viewBox="0 0 24 24" fill="none" stroke={W.mute} strokeWidth={2}><circle cx="6" cy="6" r="2.5" /><circle cx="6" cy="18" r="2.5" /><circle cx="18" cy="8" r="2.5" /><path d="M6 8.5v7M18 10.5c0 4-6 3-11 6" /></svg>
            {status?.left.map((s, i) => <span key={i}>{s}</span>)}
          </div>
          <div style={{ display: 'flex', gap: 18 }}>{status?.right.map((s, i) => <span key={i}>{s}</span>)}</div>
        </div>
      </div>

      {/* code pane (frame coordinates, clipped to the editor group) */}
      <div style={{ position: 'absolute', left: groupLeft, top: bodyTop + tabsH, width: Math.max(0, paneRight - groupLeft), height: Math.max(0, paneBottom - bodyTop - tabsH), overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: -groupLeft, top: -(bodyTop + tabsH), width: 4000, height: 4000 }}>
          {/* active line */}
          {activeRow != null && activeRow >= 0 && activeRow < rows && (
            <div style={{ position: 'absolute', left: groupLeft, top: rowTop + activeRow * lineH, width: paneRight - groupLeft, height: lineH,
              background: 'rgba(140,170,230,0.055)', borderTop: '1px solid rgba(140,170,230,0.08)', borderBottom: '1px solid rgba(140,170,230,0.08)', opacity: chrome }} />
          )}
          {Array.from({ length: rows }, (_, r) => {
            const line = lines[r] ?? '';
            const rv = lineReveal ? lineReveal(r) : 1;
            const shown = Math.floor(rv * line.length + 1e-6);
            const cols = charColors(line);
            const top = rowTop + r * lineH;
            const indent = line.length - line.trimStart().length;
            const sk = skeleton?.(r);
            return (
              <React.Fragment key={r}>
                {/* gutter number */}
                <div style={{ position: 'absolute', left: groupLeft, width: codeLeft - groupLeft - fs * 1.1, top, height: lineH, display: 'flex', alignItems: 'center',
                  justifyContent: 'flex-end', fontFamily: F.mono, fontSize: fs * 0.8, color: r === activeRow ? '#C9D2E2' : '#465169', opacity: chrome,
                  fontVariantNumeric: 'tabular-nums' }}>{firstLine + r}</div>
                {/* indent guides */}
                {rv > 0 && Array.from({ length: Math.floor(indent / 2) }, (_, g) => (
                  <div key={g} style={{ position: 'absolute', left: codeLeft + g * 2 * cw + 1, top, width: 1, height: lineH, background: '#1C2539', opacity: chrome * codeAlpha }} />
                ))}
                {/* skeleton bar */}
                {sk && sk.a > 0.001 && (
                  <div style={{ position: 'absolute', left: sk.x, top: sk.y - sk.h / 2, width: Math.max(0, sk.w), height: sk.h, borderRadius: sk.h / 2, background: sk.color, opacity: sk.a }} />
                )}
                {/* code */}
                {shown > 0 && (
                  <div style={{ position: 'absolute', left: codeLeft, top, height: lineH, display: 'flex', alignItems: 'center', whiteSpace: 'pre',
                    fontFamily: F.mono, fontSize: fs, fontVariantLigatures: 'none', letterSpacing: 0, opacity: codeAlpha }}>
                    {line.slice(0, shown).split('').map((ch, c) => {
                      const head = rv < 1 && c >= shown - 3;
                      const a = charAlpha ? charAlpha(r, c) : 1;
                      return <span key={c} style={{ color: head ? '#E8FBFF' : cols[c], opacity: a, textShadow: head ? '0 0 10px rgba(92,225,255,0.9)' : undefined }}>{ch}</span>;
                    })}
                  </div>
                )}
              </React.Fragment>
            );
          })}
          {/* cursor */}
          {cursor && cursor.on && (
            <div style={{ position: 'absolute', left: codeLeft + cursor.col * cw, top: rowTop + cursor.row * lineH + lineH * 0.16, width: 2, height: lineH * 0.68,
              background: '#E8EDF6', boxShadow: '0 0 8px rgba(92,225,255,0.6)' }} />
          )}
          {/* minimap */}
          {mmW > 0 && (
            <div style={{ position: 'absolute', left: paneRight - mmW - 14, top: rowTop, width: mmW, opacity: 0.55 * chrome * codeAlpha }}>
              {lines.map((line, r) => {
                const rv = lineReveal ? lineReveal(r) : 1;
                if (rv <= 0) return null;
                let col = 0;
                return (
                  <div key={r} style={{ position: 'absolute', top: r * 4.2, left: 0, height: 2.4, width: mmW }}>
                    {tokenize(line).map((tk, i) => {
                      const x0 = col; col += tk.t.length;
                      if (tk.k === 'ws') return null;
                      return <div key={i} style={{ position: 'absolute', left: x0 * 1.45, width: tk.t.length * 1.45, height: 2.4, background: TOK_COLOR[tk.k], borderRadius: 1 }} />;
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      {/* divider */}
      {paneRight < x + w - 1 && (
        <div style={{ position: 'absolute', left: paneRight - 0.5, top: bodyTop, width: 1, height: bodyBottom - bodyTop, background: W.line, opacity: chrome }} />
      )}
      {paneBottom < bodyBottom - 1 && (
        <div style={{ position: 'absolute', left: groupLeft, top: paneBottom - 0.5, width: paneRight - groupLeft, height: 1, background: W.line, opacity: chrome }} />
      )}
    </div>
  );
};
