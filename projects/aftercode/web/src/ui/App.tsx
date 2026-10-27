// AFTERCODE shell: top bar (modes, presets, privacy, credits), left music library + waveform/beat grid, centre live stage,
// right dancer roster + look controls, bottom transport, timeline, beat offset, world / camera / record.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { engine } from '../audio/engine';
import { LIBRARY } from '../audio/library';
import { PAIRING, clearSlot, getSlot, setSlot, slotNames, slotTrackId } from '../audio/soundtracks';
import { STYLES, type StyleId } from '../dance/clips';
import { ACCESSORIES, BODY_STYLES, HAIR, OUTFITS } from '../dance/avatar';
import { CREW_MODES, DUO_MODES, FORMATIONS } from '../dance/crew';
import { Stage } from '../scene/Stage';
import { CAMERAS, WORLDS, getState, newPerformer, setState, updatePerformer, useApp, type AppState, type WorldId } from '../state';
import { FaceModal } from './FaceModal';
import { detect, makeFace, toCanvas } from '../face/faces';
import { startRecording, stopRecording } from '../recorder';

const PRESETS: { name: string; apply: () => Partial<AppState> }[] = [
  { name: 'OFFICE RAVE', apply: () => ({ world: 'stage', performers: Array.from({ length: 5 }, (_, i) => ({ ...newPerformer(i), style: 'hiphop' as StyleId })), crewMode: 'chorus', formation: 'dynamic', trackId: 'realizer' }) },
  { name: 'BEST FRIEND DUO', apply: () => ({ world: 'bloom', performers: [newPerformer(0), newPerformer(1)].map((p) => ({ ...p, style: 'disco' as StyleId })), duoMode: 'mirror', formation: 'line', trackId: 'electro-cabello' }) },
  { name: 'MOONLIGHT', apply: () => ({ world: 'galaxy', performers: [{ ...newPerformer(0), style: 'contemporary' as StyleId, look: { ...newPerformer(0).look, outfit: 'contemporary' as const } }], trackId: 'dream-culture' }) },
  { name: 'BOLLYWOOD BREAK', apply: () => ({ world: 'stage', performers: Array.from({ length: 5 }, (_, i) => ({ ...newPerformer(i), style: 'bollywood' as StyleId, look: { ...newPerformer(i).look, outfit: (i % 2 ? 'festive' : 'festival') as 'festive' } })), crewMode: 'chorus', formation: 'v', trackId: 'disco-medusae' }) },
  { name: 'CYBER SHUFFLE', apply: () => ({ world: 'tunnel', performers: [{ ...newPerformer(0), style: 'shuffle' as StyleId, look: { ...newPerformer(0).look, outfit: 'cyberpunk' as const, body: 'android' as const } }], trackId: 'realizer' }) },
  { name: 'THE OFFICE DANCE BREAK', apply: () => ({ world: 'office', officeIntro: true, performers: Array.from({ length: 5 }, (_, i) => ({ ...newPerformer(i), style: 'hiphop' as StyleId, look: { ...newPerformer(i).look, outfit: 'office' as const } })), crewMode: 'chorus', formation: 'dynamic', trackId: 'realizer' }) },
];

const fmt = (t: number) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;

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
  useEffect(() => { let r = 0; const tick = () => { force((x) => (x + 1) % 1e6); r = requestAnimationFrame(tick); }; r = requestAnimationFrame(tick); return () => cancelAnimationFrame(r); }, []);
  const t = engine.time(), d = engine.duration(), a = engine.analysis;
  const bar = useRef<HTMLDivElement>(null);
  return (
    <div className="transport">
      <button className="play" onClick={() => (engine.playing ? engine.pause() : engine.play())}>{engine.playing ? '❚❚' : '▶'}</button>
      <button className="btn" onClick={() => engine.seek(0)}>⟲</button>
      <span className="mono">{fmt(t)} / {fmt(d)}</span>
      <div ref={bar} className="scrub" onPointerDown={(e) => { const r = bar.current!.getBoundingClientRect(); engine.seek(((e.clientX - r.left) / r.width) * d); }}>
        <div className="fill" style={{ width: `${d ? (t / d) * 100 : 0}%` }} />
        {a ? a.downbeats.filter((_, i) => i % 4 === 0).map((b) => <i key={b} style={{ left: `${(b / a.duration) * 100}%` }} />) : null}
      </div>
      <span className="mono bpm">{a ? `${a.bpm.toFixed(1)} BPM` : '— BPM'}</span>
      <span className={`beat ${a && ((t - a.beats[0]) / (60 / a.bpm)) % 1 < 0.15 ? 'on' : ''}`} />
      <label className="mini">offset <input type="range" min={-200} max={200} step={5} defaultValue={0} onChange={(e) => (engine.offsetMs = +e.target.value)} /></label>
    </div>
  );
}

export const App: React.FC = () => {
  const s = useApp((x) => x);
  const [faceFor, setFaceFor] = useState<number | null>(null);
  const [rec, setRec] = useState<string | null>(null);
  const [loading, setLoading] = useState('');
  const [mtab, setMtab] = useState<'music' | 'dancers' | 'worlds'>('dancers');   // phones: which panel sits under the stage
  const fileIn = useRef<HTMLInputElement>(null);

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
    const k = (e: KeyboardEvent) => { if ((e.target as HTMLElement).closest('input, select, textarea')) return; const i = +e.key - 1; if (i >= 0 && i < WORLDS.length) void pickWorld(WORLDS[i].id); };
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  }, [pickWorld]);
  const slotIn = useRef<HTMLInputElement>(null), slotFor = useRef<WorldId>('stage');
  const fillSlot = async (w: WorldId, f: File | undefined) => {
    if (!f || !f.type.startsWith('audio/')) return;
    const slot = await setSlot(w, f); setState((x) => ({ slots: { ...x.slots, [w]: slot.name } }));
    if (getState().world === w) { const was = engine.playing; setLoading(`Analysing "${slot.name}"…`); await engine.load(slotTrackId(slot), slot.bytes); setLoading(''); setState({ trackId: slotTrackId(slot) }); engine.seek(0); if (was) engine.play(); }
  };
  // test / capture hook (used by scripts/shot.ts and the reel capture): drive the app without clicking
  useEffect(() => { (window as unknown as { __ac: unknown }).__ac = { setState, getState, engine, loadTrack, presets: PRESETS.map((p) => p.name), openFace: (i: number | null) => setFaceFor(i),
    addFace: async (url: string, i: number, name = 'Test') => { const img = new Image(); img.src = url; await img.decode(); const c = toCanvas(img); const d = await detect(c); if (!d.length) return 0; const rec = makeFace(c, d[0], name); setState((x) => ({ faces: [...x.faces, rec] })); updatePerformer(i, { faceId: rec.id, look: { skin: rec.skin } as never }); return d.length; }, applyPreset: (i: number) => { const p = PRESETS[i].apply(); setState({ ...p, selected: 0, view: 'dance' }); return p.trackId; } }; }, [loadTrack]);
  const P = s.performers, sel = Math.min(s.selected, P.length - 1), me = P[sel];
  const applyPreset = async (i: number) => { const p = PRESETS[i].apply(); setState({ ...p, selected: 0, view: 'dance' }); if (p.trackId && p.trackId !== engine.trackId) await loadTrack(p.trackId); engine.seek(0); engine.play(); };
  const rec2 = () => {
    if (s.recording) { stopRecording(); setState({ recording: false }); return; }
    const gl = document.querySelector('canvas') as HTMLCanvasElement; setState({ recording: true });
    engine.seek(0); engine.play(); startRecording(gl, s.vertical, (url) => setRec(url));
  };
  return (
    <div className={`app ${s.vertical ? 'vertical' : ''}`} data-mtab={mtab}>
      <div className="stage-wrap"><div className="stage-box"><Stage /></div></div>
      <div className="mtabs">{(['music', 'dancers', 'worlds'] as const).map((k) => <button key={k} className={mtab === k ? 'on' : ''} onClick={() => setMtab(k)}>{k === 'music' ? 'Music' : k === 'dancers' ? 'Dancers' : 'Worlds'}</button>)}</div>
      <header>
        <div className="logo">AFTER<b>CODE</b></div>
        <nav>{(['visualizer', 'dance'] as const).map((v) => <button key={v} className={s.view === v ? 'on' : ''} onClick={() => setState({ view: v })}>{v === 'dance' ? 'FACE DANCE STUDIO' : 'VISUALIZER'}</button>)}</nav>
        <div className="presets">{PRESETS.map((p, i) => <button key={p.name} className={p.name.startsWith('THE OFFICE') ? 'hero' : ''} onClick={() => applyPreset(i)}>{p.name}</button>)}</div>
        <div className="right"><button onClick={() => setState({ showCredits: true })}>Credits</button><button onClick={() => document.documentElement.requestFullscreen?.()}>Fullscreen</button></div>
      </header>

      <aside className="left">
        <h4>Music</h4>
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
      </aside>

      {s.view === 'dance' ? (
        <aside className="rightp">
          <h4>Dancers <small>{P.length === 1 ? 'SOLO' : P.length === 2 ? 'DUO' : 'CREW'}</small></h4>
          <div className="roster">
            {P.map((p, i) => (
              <div key={p.id} className={`dancer ${i === sel ? 'on' : ''}`} onClick={() => setState({ selected: i })}>
                <span className="num">{String(i + 1).padStart(2, '0')}</span>
                <span className="face">{p.faceId ? <img src={s.faces.find((f) => f.id === p.faceId)?.crop} alt="" /> : '+'}</span>
                <span className="nm">{s.faces.find((f) => f.id === p.faceId)?.name ?? 'Add face'}</span>
                <button onClick={(e) => { e.stopPropagation(); setFaceFor(i); }}>{p.faceId ? 'Replace' : 'Add face'}</button>
                {P.length > 1 ? <button onClick={(e) => { e.stopPropagation(); setState((x) => ({ performers: x.performers.filter((_, k) => k !== i), selected: 0 })); }}>✕</button> : null}
                {i > 0 ? <button onClick={(e) => { e.stopPropagation(); setState((x) => { const a = [...x.performers]; [a[i - 1], a[i]] = [a[i], a[i - 1]]; return { performers: a }; }); }}>↑</button> : null}
              </div>
            ))}
            {P.length < 8 ? <button className="btn wide" onClick={() => setState((x) => ({ performers: [...x.performers, newPerformer(x.performers.length)], selected: x.performers.length }))}>+ Add dancer</button> : null}
          </div>
          {P.length === 2 ? <Sel label="Duo routine" value={s.duoMode} options={DUO_MODES} onChange={(v) => setState({ duoMode: v as AppState['duoMode'] })} /> : null}
          {P.length > 2 ? <Sel label="Crew routine" value={s.crewMode} options={CREW_MODES} onChange={(v) => setState({ crewMode: v as AppState['crewMode'] })} /> : null}
          {P.length > 1 ? <Sel label="Formation" value={s.formation} options={FORMATIONS} onChange={(v) => setState({ formation: v as AppState['formation'] })} /> : null}
          <Sel label="Dance style" value={me.style} options={STYLES} onChange={(v) => updatePerformer(sel, { style: v as StyleId })} />
          <Sel label="Body style" value={me.look.body} options={BODY_STYLES} onChange={(v) => updatePerformer(sel, { look: { body: v } as never })} />
          <Sel label="Outfit" value={me.look.outfit} options={OUTFITS} onChange={(v) => updatePerformer(sel, { look: { outfit: v } as never })} />
          <Sel label="Hair" value={me.look.hair} options={HAIR.map((h) => ({ id: h, name: h }))} onChange={(v) => updatePerformer(sel, { look: { hair: v } as never })} />
          <Sel label="Accessory" value={me.look.accessory} options={ACCESSORIES.map((h) => ({ id: h, name: h }))} onChange={(v) => updatePerformer(sel, { look: { accessory: v } as never })} />
          <div className="rowp">
            <label>Skin<input type="color" value={me.look.skin} onChange={(e) => updatePerformer(sel, { look: { skin: e.target.value } as never })} /></label>
            <label>Tint<input type="color" value={me.look.tint} onChange={(e) => updatePerformer(sel, { look: { tint: e.target.value } as never })} /></label>
            <label>Hair<input type="color" value={me.look.hairColor} onChange={(e) => updatePerformer(sel, { look: { hairColor: e.target.value } as never })} /></label>
          </div>
          <label className="slider">Face size<input type="range" min={0.8} max={1.25} step={0.01} value={me.look.faceScale} onChange={(e) => updatePerformer(sel, { look: { faceScale: +e.target.value } as never })} /></label>
          <label className="slider">Movement intensity<input type="range" min={0.4} max={1.15} step={0.01} value={s.intensity} onChange={(e) => setState({ intensity: +e.target.value })} /></label>
          <div className="privacy">
            <b>Privacy</b> Faces are processed on this device and kept in memory only.
            <button className="btn danger" onClick={() => setState((x) => ({ faces: [], performers: x.performers.map((p) => ({ ...p, faceId: null })) }))}>Delete all faces ({s.faces.length})</button>
          </div>
        </aside>
      ) : null}

      <footer>
        <Transport />
        <div className="worlds">{WORLDS.map((w, i) => <button key={w.id} className={s.world === w.id ? 'on' : ''} onClick={() => void pickWorld(w.id)}><i>{i + 1}</i>{w.name}</button>)}</div>
        <div className="tools">
          <select value={s.camera} onChange={(e) => setState({ camera: e.target.value as AppState['camera'] })}>{CAMERAS.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
          <select value={s.quality} onChange={(e) => setState({ quality: e.target.value as AppState['quality'] })}><option value="high">High</option><option value="medium">Medium</option><option value="low">Low (8 dancers)</option></select>
          <button className={s.vertical ? 'on' : ''} onClick={() => setState({ vertical: !s.vertical })}>9:16</button>
          <button className={`rec ${s.recording ? 'on' : ''}`} onClick={rec2}>{s.recording ? '■ Stop' : '● Record reel'}</button>
        </div>
      </footer>

      {loading ? <div className="toast">{loading}</div> : null}
      {faceFor !== null ? <FaceModal performer={faceFor} onClose={() => setFaceFor(null)} /> : null}
      {rec ? <div className="modal-back" onClick={() => setRec(null)}><div className="modal small" onClick={(e) => e.stopPropagation()}><div className="modal-head"><span>REEL READY</span><button className="x" onClick={() => setRec(null)}>×</button></div><video src={rec} controls style={{ width: '100%', maxHeight: '60vh' }} /><a className="btn primary wide" href={rec} download="aftercode-reel.webm">Download</a></div></div> : null}
      {s.showCredits ? (
        <div className="modal-back" onClick={() => setState({ showCredits: false })}><div className="modal small credits" onClick={(e) => e.stopPropagation()}>
          <div className="modal-head"><span>CREDITS</span><button className="x" onClick={() => setState({ showCredits: false })}>×</button></div>
          <h5>Music</h5>{LIBRARY.map((t) => <pre key={t.id}>{t.credit}{t.file ? '' : '\n(not bundled: the MP3 was unavailable at the source)'}</pre>)}
          <h5>Motion capture</h5><p>Dance clips from the CMU Graphics Lab Motion Capture Database (mocap.cs.cmu.edu), BVH conversion by Bruce Hahne. Funded by NSF EIA-0196217. Clips: 141_12, 120_21, 93_08, 15_04, 05_02, 120_05, 94_05, 111_05, 60_01, 143_35, 90_32, 113_04.</p>
          <h5>Face tracking</h5><p>MediaPipe Face Landmarker and canonical face model, Google, Apache License 2.0.</p>
          <h5>Fonts</h5><p>Inter and JetBrains Mono, SIL Open Font License 1.1.</p>
        </div></div>
      ) : null}
    </div>
  );
};

function Sel<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: readonly { id: string; name: string }[]; onChange: (v: string) => void }) {
  return <label className="sel">{label}<select value={value} onChange={(e) => onChange(e.target.value)}>{options.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}</select></label>;
}
void getState;
