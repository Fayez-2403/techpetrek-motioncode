// AFTERCODE shell: top bar (modes, presets, credits), left music library + waveform/beat grid, centre live stage,
// right dancer roster + character builder, bottom dock (transport; worlds, camera, quality, record).
// Desktop: a grid, so panels sit beside the stage (never over it) and collapse to slim rails ([ and ] keys).
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { engine } from '../audio/engine';
import { LIBRARY } from '../audio/library';
import { PAIRING, clearSlot, getSlot, setSlot, slotNames, slotTrackId } from '../audio/soundtracks';
import { STYLES, type StyleId } from '../dance/clips';
import { ACCESSORIES, BODY_STYLES, EYE_COLORS, FACIAL_HAIR, HAIR, HAIR_COLORS, OUTFITS, OUTFIT_COLORS, SKIN_TONES, type Look } from '../dance/avatar';
import { CREW_MODES, DUO_MODES, FORMATIONS, type Performer } from '../dance/crew';
import { CAST, SQUAD, type CastId } from '../dance/cast';
import { Stage } from '../scene/Stage';
import { CAMERAS, WORLDS, getState, newPerformer, setState, updatePerformer, useApp, type AppState, type WorldId } from '../state';
import { FaceModal } from './FaceModal';
import { detect, makeFace, toCanvas } from '../face/faces';
import { startRecording, stopRecording } from '../recorder';

/** a cast member as a dancer (src/dance/cast.ts: original characters, no real person's face or likeness) */
const who = (i: number, id: CastId): Performer => ({ ...newPerformer(i), name: CAST[id].name, style: CAST[id].style, look: { ...CAST[id].look } });
const PRESETS: { name: string; cast?: boolean; apply: () => Partial<AppState> }[] = [
  { name: 'CEO DISS BATTLE', cast: true, apply: () => ({ world: 'city', duoMode: 'battle', formation: 'line', trackId: 'realizer', performers: [who(0, 'founder'), who(1, 'boss')] }) },
  { name: 'LEADERS BATTLE', cast: true, apply: () => ({ world: 'galaxy', duoMode: 'battle', formation: 'line', trackId: 'smooth-move', performers: [who(0, 'president'), who(1, 'chancellor')] }) },
  { name: 'NETA vs NETA', cast: true, apply: () => ({ world: 'stage', duoMode: 'battle', formation: 'line', trackId: 'disco-medusae', performers: [who(0, 'neta1'), who(1, 'neta2')] }) },
  { name: 'FILMI DUO', cast: true, apply: () => ({ world: 'bloom', duoMode: 'bollywood', formation: 'line', trackId: 'electro-cabello', performers: [who(0, 'hero'), who(1, 'heroine')] }) },
  { name: 'SITCOM SQUAD', cast: true, apply: () => ({ world: 'dream', crewMode: 'chorus', formation: 'line', trackId: 'monkeys', performers: SQUAD.map((id, i) => who(i, id)) }) },
  { name: 'OFFICE RAVE', apply: () => ({ world: 'stage', performers: Array.from({ length: 5 }, (_, i) => ({ ...newPerformer(i), style: 'hiphop' as StyleId })), crewMode: 'chorus', formation: 'dynamic', trackId: 'realizer' }) },
  { name: 'BEST FRIEND DUO', apply: () => ({ world: 'bloom', performers: [newPerformer(0), newPerformer(1)].map((p) => ({ ...p, style: 'disco' as StyleId })), duoMode: 'mirror', formation: 'line', trackId: 'electro-cabello' }) },
  { name: 'MOONLIGHT', apply: () => ({ world: 'galaxy', performers: [{ ...newPerformer(0), style: 'contemporary' as StyleId, look: { ...newPerformer(0).look, outfit: 'contemporary' as const } }], trackId: 'dream-culture' }) },
  { name: 'BOLLYWOOD BREAK', apply: () => ({ world: 'stage', performers: Array.from({ length: 5 }, (_, i) => ({ ...newPerformer(i), style: 'bollywood' as StyleId, look: { ...newPerformer(i).look, outfit: (i % 2 ? 'festive' : 'festival') as 'festive' } })), crewMode: 'chorus', formation: 'v', trackId: 'disco-medusae' }) },
  { name: 'CYBER SHUFFLE', apply: () => ({ world: 'tunnel', performers: [{ ...newPerformer(0), style: 'shuffle' as StyleId, look: { ...newPerformer(0).look, outfit: 'cyberpunk' as const, body: 'android' as const } }], trackId: 'realizer' }) },
  { name: 'THE OFFICE DANCE BREAK', apply: () => ({ world: 'office', officeIntro: true, performers: Array.from({ length: 5 }, (_, i) => ({ ...newPerformer(i), style: 'hiphop' as StyleId, look: { ...newPerformer(i).look, outfit: 'office' as const } })), crewMode: 'chorus', formation: 'dynamic', trackId: 'realizer' }) },
];

const fmt = (t: number) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
/** per-viewer UI memory (panel open / closed); private windows and blocked storage just fall back to the default */
const mem = {
  get: (k: string, d: boolean) => { try { const v = localStorage.getItem(k); return v === null ? d : v === '1'; } catch { return d; } },
  set: (k: string, v: boolean) => { try { localStorage.setItem(k, v ? '1' : '0'); } catch { /* storage blocked */ } },
};
/** seeded random look (mulberry32): the same seed always gives the same character */
function randomLook(seed: number, base: Look): Partial<Look> {
  let a = seed >>> 0; const r = () => { a = (a + 0x6d2b79f5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const pick = <T,>(xs: readonly T[]) => xs[Math.floor(r() * xs.length)];
  const outfits = OUTFITS.filter((o) => !['chrome', 'scifi'].includes(o.id));
  return { ...base, outfit: pick(outfits).id, hair: pick(HAIR), facialHair: r() < 0.55 ? 'none' : pick(FACIAL_HAIR), accessory: r() < 0.5 ? 'none' : pick(ACCESSORIES),
    skin: pick(SKIN_TONES), hairColor: pick(HAIR_COLORS.slice(0, 6)), eyes: pick(EYE_COLORS), color: r() < 0.5 ? '' : pick(OUTFIT_COLORS),
    build: Math.round((0.9 + r() * 0.28) * 100) / 100, height: Math.round((0.93 + r() * 0.1) * 100) / 100 };
}

/** true while a CSS media query matches (phones use tabs, so their panels never collapse) */
function useMedia(q: string) {
  const [m, setM] = useState(() => window.matchMedia(q).matches);
  useEffect(() => { const mq = window.matchMedia(q), f = () => setM(mq.matches); mq.addEventListener('change', f); return () => mq.removeEventListener('change', f); }, [q]);
  return m;
}

function Waveform() {
  const ref = useRef<HTMLCanvasElement>(null);
  const [, force] = useState(0);
  useEffect(() => engine.on(() => force((x) => x + 1)), []);
  useEffect(() => {
    const c = ref.current, a = engine.analysis; if (!c) return;
    const g = c.getContext('2d')!; c.width = c.clientWidth * 2; c.height = c.clientHeight * 2; g.clearRect(0, 0, c.width, c.height);
    if (!a) return;
    const n = a.rms.length;
    for (let x = 0; x < c.width; x++) { const i = Math.floor((x / c.width) * n), v = a.rms[i], b = a.bass[i]; g.fillStyle = `rgba(${120 + 120 * b},${200 - 80 * b},255,0.8)`; const h = v * c.height * 0.9; g.fillRect(x, (c.height - h) / 2, 1, h); }
    g.fillStyle = 'rgba(255,59,208,0.9)'; for (const d of a.downbeats) g.fillRect((d / a.duration) * c.width, 0, 1, 8);
    for (const s of a.sections) if (s.drop) { g.fillStyle = 'rgba(255,214,0,0.9)'; g.fillRect((s.t0 / a.duration) * c.width, c.height - 8, 6, 8); }
  });
  return <canvas ref={ref} className="wave" />;
}

function Transport() {
  const [, force] = useState(0);
  const [off, setOff] = useState(engine.offsetMs);
  useEffect(() => { let r = 0; const tick = () => { force((x) => (x + 1) % 1e6); r = requestAnimationFrame(tick); }; r = requestAnimationFrame(tick); return () => cancelAnimationFrame(r); }, []);
  const t = engine.time(), d = engine.duration(), a = engine.analysis;
  const bar = useRef<HTMLDivElement>(null);
  const seekAt = (x: number) => { const r = bar.current!.getBoundingClientRect(); engine.seek(Math.max(0, Math.min(1, (x - r.left) / r.width)) * d); };
  return (
    <div className="transport">
      <button className="play" aria-label={engine.playing ? 'Pause' : 'Play'} title="Play / pause (Space)" onClick={() => (engine.playing ? engine.pause() : engine.play())}>{engine.playing ? '❚❚' : '▶'}</button>
      <button className="icon" aria-label="Back to start" title="Back to start" onClick={() => engine.seek(0)}>⟲</button>
      <span className="mono time">{fmt(t)} <i>/ {fmt(d)}</i></span>
      <div ref={bar} className="scrub" role="slider" aria-label="Song position" aria-valuemin={0} aria-valuemax={Math.round(d)} aria-valuenow={Math.round(t)}
        onPointerDown={(e) => { (e.target as HTMLElement).setPointerCapture?.(e.pointerId); seekAt(e.clientX); }} onPointerMove={(e) => { if (e.buttons) seekAt(e.clientX); }}>
        <div className="fill" style={{ width: `${d ? (t / d) * 100 : 0}%` }} />
        {a ? a.downbeats.filter((_, i) => i % 4 === 0).map((b) => <i key={b} style={{ left: `${(b / a.duration) * 100}%` }} />) : null}
        <b className="head" style={{ left: `${d ? (t / d) * 100 : 0}%` }} />
      </div>
      <span className="mono bpm">{a ? `${a.bpm.toFixed(1)} BPM` : '— BPM'}</span>
      <span className={`beat ${a && ((t - a.beats[0]) / (60 / a.bpm)) % 1 < 0.15 ? 'on' : ''}`} title="Beat" />
      <label className="mini" title="Nudge the beat grid if the dancers feel early or late">Sync
        <input type="range" min={-200} max={200} step={5} value={off} onChange={(e) => { engine.offsetMs = +e.target.value; setOff(+e.target.value); }} />
        <span className="mono">{off > 0 ? '+' : ''}{off} ms</span>
      </label>
    </div>
  );
}

function Chips<T extends string>({ value, options, onChange, cols }: { value: T; options: readonly { id: T; name: string; dot?: string }[]; onChange: (v: T) => void; cols?: number }) {
  return <div className="chips" style={cols ? { gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` } : undefined}>{options.map((o) => <button key={o.id} className={o.id === value ? 'on' : ''} onClick={() => onChange(o.id)} title={o.name}>{o.dot ? <i style={{ background: o.dot }} /> : null}<span>{o.name}</span></button>)}</div>;
}
function Swatches({ value, colors, onChange, none }: { value: string; colors: readonly string[]; onChange: (c: string) => void; none?: string }) {
  return (
    <div className="swatches">
      {none !== undefined ? <button className={`sw none ${value === '' ? 'on' : ''}`} title={none} aria-label={none} onClick={() => onChange('')} /> : null}
      {colors.map((c) => <button key={c} className={`sw ${value.toLowerCase() === c ? 'on' : ''}`} style={{ background: c }} aria-label={c} onClick={() => onChange(c)} />)}
      <label className="sw custom" title="Custom colour"><input type="color" value={value || '#888888'} onChange={(e) => onChange(e.target.value)} />+</label>
    </div>
  );
}
function Section({ title, children, open = true }: { title: string; children: React.ReactNode; open?: boolean }) {
  return <details className="sec" open={open}><summary>{title}</summary><div className="sec-body">{children}</div></details>;
}
const label = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const FITDOT: Record<string, string> = { street: '#2d4f7c', hoodie: '#3b3f4a', cyberpunk: '#22e6ff', chrome: '#d9dde4', festival: '#ff4fa3', office: '#b9d2ea', neon: '#ff2bd6', contemporary: '#f3efe8', festive: '#e2701f', scifi: '#ff7a1a', suit: '#232a3a', kurta: '#263451', lehenga: '#a3124a', leather: '#18181b', sweater: '#7d9070' };

export const App: React.FC = () => {
  const s = useApp((x) => x);
  const [faceFor, setFaceFor] = useState<number | null>(null);
  const [rec, setRec] = useState<string | null>(null);
  const [loading, setLoading] = useState('');
  const [mtab, setMtab] = useState<'music' | 'dancers' | 'worlds'>('dancers');   // phones: which panel sits under the stage
  const [btab, setBtab] = useState<'look' | 'face' | 'moves'>('look');            // character builder tab
  const [leftOpen, setLeftOpen] = useState(() => mem.get('ac.left', window.innerWidth >= 1280));
  const [rightOpen, setRightOpen] = useState(() => mem.get('ac.right', true));
  const [keys, setKeys] = useState(false);
  const phone = useMedia('(max-width: 820px)');
  const fileIn = useRef<HTMLInputElement>(null), presetsRef = useRef<HTMLDivElement>(null), seed = useRef(1);
  const toggleLeft = useCallback(() => setLeftOpen((v) => { mem.set('ac.left', !v); return !v; }), []);
  const toggleRight = useCallback(() => setRightOpen((v) => { mem.set('ac.right', !v); return !v; }), []);

  const loadTrack = useCallback(async (id: string) => {
    const tr = LIBRARY.find((t) => t.id === id); if (!tr?.file) return;
    setLoading(`Analysing "${tr.title}"…`); await engine.load(tr.id, tr.file, tr.bpm); setLoading(''); setState({ trackId: id });
  }, []);
  useEffect(() => { void loadTrack(s.trackId); void slotNames().then((slots) => setState({ slots })); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // mode soundtracks: a world picked in the UI brings its own song (the user's slot, else the bundled fallback).
  // Only UI picks switch music; capture scripts set `world` directly and keep their track.
  const pickWorld = useCallback(async (w: WorldId) => {
    setState({ world: w });
    if (!getState().soundtracks) return;
    const was = engine.playing, slot = await getSlot(w).catch(() => undefined);
    if (slot) {
      const id = slotTrackId(slot);
      if (id !== engine.trackId) { setLoading(`Analysing "${slot.name}"…`); await engine.load(id, slot.bytes); setLoading(''); setState({ trackId: id }); engine.seek(0); }
    } else if (PAIRING[w].fallback !== engine.trackId) { await loadTrack(PAIRING[w].fallback); engine.seek(0); }
    else return;
    if (was) engine.play();
  }, [loadTrack]);
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest('input, select, textarea') || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === '[') { toggleLeft(); return; }
      if (e.key === ']') { toggleRight(); return; }
      if (e.key === '?') { setKeys((v) => !v); return; }
      if (e.key === ' ' && !(e.target as HTMLElement).closest('button')) { e.preventDefault(); if (engine.playing) engine.pause(); else engine.play(); return; }
      const i = +e.key - 1; if (i >= 0 && i < WORLDS.length) void pickWorld(WORLDS[i].id);
    };
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  }, [pickWorld, toggleLeft, toggleRight]);
  const slotIn = useRef<HTMLInputElement>(null), slotFor = useRef<WorldId>('stage');
  const fillSlot = async (w: WorldId, f: File | undefined) => {
    if (!f || !f.type.startsWith('audio/')) return;
    const slot = await setSlot(w, f); setState((x) => ({ slots: { ...x.slots, [w]: slot.name } }));
    if (getState().world === w) { const was = engine.playing; setLoading(`Analysing "${slot.name}"…`); await engine.load(slotTrackId(slot), slot.bytes); setLoading(''); setState({ trackId: slotTrackId(slot) }); engine.seek(0); if (was) engine.play(); }
  };
  // test / capture hook (used by scripts/shot.ts and the reel capture): drive the app without clicking
  useEffect(() => { (window as unknown as { __ac: unknown }).__ac = { setState, getState, engine, loadTrack, presets: PRESETS.map((p) => p.name), openFace: (i: number | null) => setFaceFor(i),
    addFace: async (url: string, i: number, name = 'Test') => { const img = new Image(); img.src = url; await img.decode(); const c = toCanvas(img); const d = await detect(c); if (!d.length) return 0; const rec = makeFace(c, d[0], name); setState((x) => ({ faces: [...x.faces, rec] })); updatePerformer(i, { faceId: rec.id, look: { skin: rec.skin } as never }); return d.length; },
    applyPreset: (i: number) => { const p = PRESETS[i].apply(); setState({ ...p, selected: 0, view: 'dance' }); return p.trackId; }, presetIndex: (name: string) => PRESETS.findIndex((p) => p.name === name), setBtab: (t: 'look' | 'face' | 'moves') => setBtab(t) }; }, [loadTrack]);
  const P = s.performers, sel = Math.min(s.selected, P.length - 1), me = P[sel];
  const faceOf = (p: Performer) => s.faces.find((f) => f.id === p.faceId);
  const nameOf = (p: Performer, i: number) => faceOf(p)?.name ?? p.name ?? `Dancer ${String(i + 1).padStart(2, '0')}`;
  const look = (l: Partial<Look>) => updatePerformer(sel, { look: l as Look });
  const applyPreset = async (i: number) => { const p = PRESETS[i].apply(); setState({ ...p, selected: 0, view: 'dance' }); if (p.trackId && p.trackId !== engine.trackId) await loadTrack(p.trackId); engine.seek(0); engine.play(); };
  const rec2 = () => {
    if (s.recording) { stopRecording(); setState({ recording: false }); return; }
    const gl = document.querySelector('canvas') as HTMLCanvasElement; setState({ recording: true });
    engine.seek(0); engine.play(); startRecording(gl, s.vertical, (url) => setRec(url));
  };
  const dance = s.view === 'dance', lo = leftOpen || phone, ro = rightOpen || phone;
  return (
    <div className={`app ${s.vertical ? 'vertical' : ''} ${dance ? '' : 'novis'}`} data-mtab={mtab} data-left={lo ? 'open' : 'closed'} data-right={dance ? (ro ? 'open' : 'closed') : 'none'}>
      <main className="stage-wrap"><div className="stage-box"><Stage /></div></main>
      <div className="mtabs">{(['music', 'dancers', 'worlds'] as const).map((k) => <button key={k} className={mtab === k ? 'on' : ''} onClick={() => setMtab(k)}>{k === 'music' ? 'Music' : k === 'dancers' ? 'Dancers' : 'Worlds'}</button>)}</div>
      <header>
        <div className="logo">AFTER<b>CODE</b></div>
        <nav className="seg">{(['visualizer', 'dance'] as const).map((v) => <button key={v} className={s.view === v ? 'on' : ''} onClick={() => setState({ view: v })}>{v === 'dance' ? 'Face Dance Studio' : 'Visualizer'}</button>)}</nav>
        <div className="presets-wrap">
          <span className="lbl">Presets</span>
          <div className="presets" ref={presetsRef} onWheel={(e) => { if (presetsRef.current && Math.abs(e.deltaY) > Math.abs(e.deltaX)) presetsRef.current.scrollLeft += e.deltaY; }}>
            {PRESETS.map((p, i) => <button key={p.name} className={`${p.name.startsWith('THE OFFICE') ? 'hero' : ''} ${p.cast ? 'cast' : ''}`} onClick={() => applyPreset(i)} title={p.cast ? 'Original characters, one click' : undefined}>{p.cast ? <em>CAST</em> : null}{p.name}</button>)}
          </div>
        </div>
        <div className="right">
          <button className="icon" title="Keyboard shortcuts (?)" aria-label="Keyboard shortcuts" onClick={() => setKeys(true)}>⌨</button>
          <button onClick={() => setState({ showCredits: true })}>Credits</button>
          <button className="icon" title="Fullscreen" aria-label="Fullscreen" onClick={() => document.documentElement.requestFullscreen?.()}>⛶</button>
        </div>
      </header>

      <aside className={`left panel ${lo ? '' : 'collapsed'}`} aria-label="Music">
        <div className="panel-head">
          <h4>Music</h4>
          <button className="collapse" onClick={toggleLeft} aria-expanded={leftOpen} aria-label={leftOpen ? 'Collapse music panel' : 'Expand music panel'} title={`${leftOpen ? 'Collapse' : 'Expand'} ( [ )`}>{leftOpen ? '‹' : '›'}</button>
        </div>
        {lo ? (
          <div className="panel-body">
            {LIBRARY.map((t) => (
              <button key={t.id} className={`track ${s.trackId === t.id ? 'on' : ''} ${t.file ? '' : 'na'}`} onClick={() => (t.file ? loadTrack(t.id) : window.open(t.sourceUrl, '_blank'))}>
                <b>{t.title}</b><span>{t.genre} · {t.bpm} BPM{t.seconds ? ` · ${fmt(t.seconds)}` : ''}</span>{t.file ? null : <em>not bundled: open source page, then import</em>}
              </button>
            ))}
            <button className="btn wide" onClick={() => fileIn.current?.click()}>Import your own (MP3, WAV, OGG)</button>
            <input ref={fileIn} type="file" accept="audio/*" hidden onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; setLoading(`Analysing ${f.name}…`); await engine.load(`user:${f.name}`, await f.arrayBuffer()); setLoading(''); setState({ trackId: `user:${f.name}` }); }} />
            <Waveform />
            <div className="hint">Pink ticks: downbeats · yellow: detected drops. Bands are frequency approximations, not separated stems.</div>
            <h4 className="st-head">Mode soundtracks <label className="tog"><input type="checkbox" checked={s.soundtracks} onChange={(e) => setState({ soundtracks: e.target.checked })} />auto</label></h4>
            <div className="hint">Give every world its own song from your files. Songs stay in this browser; nothing is uploaded.</div>
            <div className="slots">
              {WORLDS.map((w, i) => (
                <div key={w.id} className={`slot ${s.world === w.id ? 'on' : ''} ${s.slots[w.id] ? 'full' : ''}`} onClick={() => void pickWorld(w.id)}
                  onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); void fillSlot(w.id, e.dataTransfer.files[0]); }}>
                  <i>{i + 1}</i>
                  <span><b>{w.name}</b><em>{s.slots[w.id] ?? `suggested: ${PAIRING[w.id].suggest}`}</em></span>
                  <button onClick={(e) => { e.stopPropagation(); slotFor.current = w.id; slotIn.current?.click(); }}>{s.slots[w.id] ? 'Replace' : '+ Song'}</button>
                  {s.slots[w.id] ? <button onClick={(e) => { e.stopPropagation(); void clearSlot(w.id).then(() => setState((x) => { const n = { ...x.slots }; delete n[w.id]; return { slots: n }; })).then(() => { if (getState().world === w.id) void pickWorld(w.id); }); }}>✕</button> : null}
                </div>
              ))}
            </div>
            <input ref={slotIn} type="file" accept="audio/*" hidden onChange={(e) => { void fillSlot(slotFor.current, e.target.files?.[0]); e.target.value = ''; }} />
            <div className="hint">Use songs you own. Clips recorded with them are for personal use; for posting, add licensed music in the platform's editor.</div>
          </div>
        ) : (
          <button className="rail" onClick={toggleLeft} title="Expand music ( [ )">
            <span className="rail-ico">♪</span><span className="rail-txt">{LIBRARY.find((t) => t.id === s.trackId)?.title ?? 'Your song'}</span>
          </button>
        )}
      </aside>

      {dance ? (
        <aside className={`rightp panel ${ro ? '' : 'collapsed'}`} aria-label="Dancers">
          <div className="panel-head">
            <button className="collapse" onClick={toggleRight} aria-expanded={rightOpen} aria-label={rightOpen ? 'Collapse dancers panel' : 'Expand dancers panel'} title={`${rightOpen ? 'Collapse' : 'Expand'} ( ] )`}>{rightOpen ? '›' : '‹'}</button>
            <h4>Dancers <small>{P.length === 1 ? 'SOLO' : P.length === 2 ? 'DUO' : `CREW · ${P.length}`}</small></h4>
          </div>
          {ro ? (
            <div className="panel-body">
              <div className="roster">
                {P.map((p, i) => (
                  <div key={p.id} className={`dancer ${i === sel ? 'on' : ''}`} onClick={() => setState({ selected: i })}>
                    <button className="face" title={faceOf(p) ? 'Change photo face' : 'Add a photo face'} aria-label={faceOf(p) ? 'Change photo face' : 'Add a photo face'} style={faceOf(p) ? undefined : { background: p.look.skin }} onClick={(e) => { e.stopPropagation(); setState({ selected: i }); setFaceFor(i); }}>{faceOf(p) ? <img src={faceOf(p)!.crop} alt="" /> : <b>{nameOf(p, i).charAt(0)}</b>}</button>
                    <span className="nm">{nameOf(p, i)}<small>{OUTFITS.find((o) => o.id === p.look.outfit)?.name} · {STYLES.find((x) => x.id === p.style)?.name}</small></span>
                    <span className="acts">
                      <button className="face-btn" onClick={(e) => { e.stopPropagation(); setState({ selected: i }); setFaceFor(i); }}>{p.faceId ? 'Change face' : '+ Add face'}</button>
                      {i > 0 ? <button title="Move up" aria-label="Move up" onClick={(e) => { e.stopPropagation(); setState((x) => { const a = [...x.performers]; [a[i - 1], a[i]] = [a[i], a[i - 1]]; return { performers: a, selected: i - 1 }; }); }}>↑</button> : null}
                      {P.length > 1 ? <button title="Remove dancer" aria-label="Remove dancer" onClick={(e) => { e.stopPropagation(); setState((x) => ({ performers: x.performers.filter((_, k) => k !== i), selected: 0 })); }}>✕</button> : null}
                    </span>
                  </div>
                ))}
                {P.length < 8 ? <button className="btn wide" onClick={() => setState((x) => ({ performers: [...x.performers, newPerformer(x.performers.length)], selected: x.performers.length }))}>+ Add dancer</button> : null}
              </div>
              {P.length === 2 ? <Sel label="Duo routine" value={s.duoMode} options={DUO_MODES} onChange={(v) => setState({ duoMode: v as AppState['duoMode'] })} /> : null}
              {P.length > 2 ? <Sel label="Crew routine" value={s.crewMode} options={CREW_MODES} onChange={(v) => setState({ crewMode: v as AppState['crewMode'] })} /> : null}
              {P.length > 1 ? <Sel label="Formation" value={s.formation} options={FORMATIONS} onChange={(v) => setState({ formation: v as AppState['formation'] })} /> : null}

              <div className="builder">
                <div className="b-head">
                  <input className="b-name" value={me.name ?? ''} placeholder={nameOf(me, sel)} aria-label="Dancer name" maxLength={24} onChange={(e) => updatePerformer(sel, { name: e.target.value })} />
                  <button className="btn" title="Random look (same button, new character each time)" onClick={() => look(randomLook(seed.current++ * 7919 + sel, me.look))}>🎲 Random</button>
                </div>
                <div className="b-tabs" role="tablist">{(['look', 'face', 'moves'] as const).map((k) => <button key={k} role="tab" aria-selected={btab === k} className={btab === k ? 'on' : ''} onClick={() => setBtab(k)}>{k === 'look' ? 'Body & outfit' : k === 'face' ? 'Face & hair' : 'Moves'}</button>)}</div>
                {btab === 'look' ? (<>
                  <Section title="Body"><Chips value={me.look.body} options={BODY_STYLES} cols={2} onChange={(v) => look({ body: v })} />
                    <label className="slider">Build <input type="range" min={0.85} max={1.25} step={0.01} value={me.look.build ?? 1} onChange={(e) => look({ build: +e.target.value })} /></label>
                    <label className="slider">Height <input type="range" min={0.88} max={1.08} step={0.01} value={me.look.height ?? 1} onChange={(e) => look({ height: +e.target.value })} /></label>
                    <div className="lbl2">Skin tone</div><Swatches value={me.look.skin} colors={SKIN_TONES} onChange={(c) => look({ skin: c })} />
                  </Section>
                  <Section title="Outfit"><Chips value={me.look.outfit} options={OUTFITS.map((o) => ({ ...o, dot: FITDOT[o.id] }))} cols={2} onChange={(v) => look({ outfit: v })} />
                    <div className="lbl2">Outfit colour</div><Swatches value={me.look.color ?? ''} colors={OUTFIT_COLORS} none="Outfit's own colours" onChange={(c) => look({ color: c })} />
                    <div className="lbl2">Light tint</div><Swatches value={me.look.tint} colors={['#ffffff', '#c9d6ff', '#ffd9c2', '#d6ffd9']} onChange={(c) => look({ tint: c || '#ffffff' })} />
                  </Section>
                </>) : null}
                {btab === 'face' ? (<>
                  <Section title="Face">
                    <div className="facebox">
                      <span className="face big" style={faceOf(me) ? undefined : { background: me.look.skin }}>{faceOf(me) ? <img src={faceOf(me)!.crop} alt="" /> : <b>{nameOf(me, sel).charAt(0)}</b>}</span>
                      <div><button className="btn primary" onClick={() => setFaceFor(sel)}>{me.faceId ? 'Replace photo face' : 'Add photo face'}</button>
                        {me.faceId ? <button className="btn" onClick={() => updatePerformer(sel, { faceId: null })}>Use drawn face</button> : <div className="hint">Or keep the drawn face: eyes, brows and a mouth that raps in battles.</div>}</div>
                    </div>
                    {me.faceId ? <label className="slider">Photo face size <input type="range" min={0.8} max={1.25} step={0.01} value={me.look.faceScale} onChange={(e) => look({ faceScale: +e.target.value })} /></label> : null}
                    <div className="lbl2">Eye colour</div><Swatches value={me.look.eyes ?? ''} colors={EYE_COLORS} onChange={(c) => look({ eyes: c || EYE_COLORS[0] })} />
                    <div className="lbl2">Facial hair</div><Chips value={me.look.facialHair ?? 'none'} options={FACIAL_HAIR.map((h) => ({ id: h, name: label(h) }))} cols={3} onChange={(v) => look({ facialHair: v })} />
                  </Section>
                  <Section title="Hair"><Chips value={me.look.hair} options={HAIR.map((h) => ({ id: h, name: h === 'none' ? 'Bald' : label(h) }))} cols={3} onChange={(v) => look({ hair: v })} />
                    <div className="lbl2">Hair colour</div><Swatches value={me.look.hairColor} colors={HAIR_COLORS} onChange={(c) => look({ hairColor: c || HAIR_COLORS[0] })} />
                  </Section>
                  <Section title="Accessory"><Chips value={me.look.accessory} options={ACCESSORIES.map((h) => ({ id: h, name: label(h) }))} cols={3} onChange={(v) => look({ accessory: v })} /></Section>
                </>) : null}
                {btab === 'moves' ? (<>
                  <Section title="Dance style"><Chips value={me.style} options={STYLES} cols={2} onChange={(v) => updatePerformer(sel, { style: v })} /></Section>
                  <Section title="Energy"><label className="slider">Movement intensity <input type="range" min={0.4} max={1.15} step={0.01} value={s.intensity} onChange={(e) => setState({ intensity: +e.target.value })} /></label></Section>
                </>) : null}
              </div>
              <div className="privacy">
                <b>Privacy</b> Faces are processed on this device and kept in memory only.
                <button className="btn danger" onClick={() => setState((x) => ({ faces: [], performers: x.performers.map((p) => ({ ...p, faceId: null })) }))}>Delete all faces ({s.faces.length})</button>
              </div>
            </div>
          ) : (
            <div className="rail">
              <button className="rail-ico" onClick={toggleRight} title="Expand dancers ( ] )" aria-label="Expand dancers panel">☺</button>
              {P.map((p, i) => <button key={p.id} className={`rail-face ${i === sel ? 'on' : ''}`} title={nameOf(p, i)} style={faceOf(p) ? undefined : { background: p.look.skin }} onClick={() => { setState({ selected: i }); toggleRight(); }}>{faceOf(p) ? <img src={faceOf(p)!.crop} alt="" /> : nameOf(p, i).charAt(0)}</button>)}
            </div>
          )}
        </aside>
      ) : null}

      <footer className="dock">
        <Transport />
        <div className="dock-row">
          <div className="worlds" role="radiogroup" aria-label="World">
            <span className="lbl">World</span>
            {WORLDS.map((w, i) => <button key={w.id} role="radio" aria-checked={s.world === w.id} className={s.world === w.id ? 'on' : ''} title={`${w.name} (${i + 1})`} onClick={() => void pickWorld(w.id)}><i>{i + 1}</i>{w.short}</button>)}
          </div>
          <div className="tools">
            <label className="field-inline"><span>Camera</span><select value={s.camera} onChange={(e) => setState({ camera: e.target.value as AppState['camera'] })}>{CAMERAS.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
            <label className="field-inline"><span>Quality</span><select value={s.quality} onChange={(e) => setState({ quality: e.target.value as AppState['quality'] })}><option value="high">High</option><option value="medium">Medium</option><option value="low">Low (8 dancers)</option></select></label>
            <button className={`ratio ${s.vertical ? 'on' : ''}`} aria-pressed={s.vertical} title="Vertical 9:16 frame for reels" onClick={() => setState({ vertical: !s.vertical })}>9:16</button>
            <button className={`rec ${s.recording ? 'on' : ''}`} onClick={rec2}>{s.recording ? '■ Stop' : '● Record reel'}</button>
          </div>
        </div>
      </footer>

      {loading ? <div className="toast">{loading}</div> : null}
      {faceFor !== null ? <FaceModal performer={faceFor} onClose={() => setFaceFor(null)} /> : null}
      {rec ? <div className="modal-back" onClick={() => setRec(null)}><div className="modal small" onClick={(e) => e.stopPropagation()}><div className="modal-head"><span>REEL READY</span><button className="x" onClick={() => setRec(null)}>×</button></div><video src={rec} controls style={{ width: '100%', maxHeight: '60vh' }} /><a className="btn primary wide" href={rec} download="aftercode-reel.webm">Download</a></div></div> : null}
      {keys ? (
        <div className="modal-back" onClick={() => setKeys(false)}><div className="modal small keys" onClick={(e) => e.stopPropagation()}>
          <div className="modal-head"><span>KEYBOARD</span><button className="x" onClick={() => setKeys(false)}>×</button></div>
          {[['Space', 'Play / pause'], ['1 – 8', 'Switch world'], ['[', 'Collapse / expand music'], [']', 'Collapse / expand dancers'], ['?', 'This list']].map(([k, v]) => <div key={k} className="krow"><kbd>{k}</kbd><span>{v}</span></div>)}
        </div></div>
      ) : null}
      {s.showCredits ? (
        <div className="modal-back" onClick={() => setState({ showCredits: false })}><div className="modal small credits" onClick={(e) => e.stopPropagation()}>
          <div className="modal-head"><span>CREDITS</span><button className="x" onClick={() => setState({ showCredits: false })}>×</button></div>
          <h5>Music</h5>{LIBRARY.map((t) => <pre key={t.id}>{t.credit}{t.file ? '' : '\n(not bundled: the MP3 was unavailable at the source)'}</pre>)}
          <h5>Motion capture</h5><p>Dance clips from the CMU Graphics Lab Motion Capture Database (mocap.cs.cmu.edu), BVH conversion by Bruce Hahne. Funded by NSF EIA-0196217. Clips: 141_12, 120_21, 93_08, 15_04, 05_02, 120_05, 94_05, 111_05, 60_01, 143_35, 90_32, 113_04.</p>
          <h5>Face tracking</h5><p>MediaPipe Face Landmarker and canonical face model, Google, Apache License 2.0.</p>
          <h5>Characters</h5><p>The cast presets are original characters made in the builder; they do not depict real people.</p>
          <h5>Fonts</h5><p>Inter and JetBrains Mono, SIL Open Font License 1.1.</p>
        </div></div>
      ) : null}
    </div>
  );
};

function Sel<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: readonly { id: string; name: string }[]; onChange: (v: string) => void }) {
  return <label className="sel">{label}<select value={value} onChange={(e) => onChange(e.target.value)}>{options.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}</select></label>;
}
