// Heads-up display: title, power meter, honest energy readout, challenge bar, performance overlay, loading,
// toasts and the 9:16 capture mode (frame guide, PNG export, WebM recording, camera bookmarks).
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { MODES, CELESTIAL_GAIN } from '../core/config';
import { CHALLENGES } from '../core/challenges';
import { settings, ui, telemetry, useStore, toast } from './store';
import { stageRef, startChallenge } from './App';

export function TopBar() {
  return (
    <header className="topbar">
      <div className="logo"><b>ASTRA</b><i>.EXE</i></div>
      <div className="sub">The Celestial Weapon Physics Laboratory</div>
    </header>
  );
}

export function Hud() {
  const T = useStore(telemetry, (t) => t);
  const mode = useStore(settings, (s) => s.mode);
  const mult = useStore(settings, (s) => s.impactMult);
  const drawing = useStore(ui, (s) => s.drawing);
  const hover = useStore(ui, (s) => s.hover);
  const M = MODES[mode];
  const pct = Math.round(T.draw * 100);
  return (
    <div className="hud">
      <div className={`meter${drawing ? ' live' : ''}`} style={{ ['--mode' as string]: `rgb(${M.trail.map((v) => Math.round(v * 255)).join(',')})` }}>
        <div className="bar"><div className="fill" style={{ width: `${pct}%` }} /></div>
        <div className="nums">
          <span className="big">{pct}<small>%</small></span>
          <span>draw</span>
          <span className="big">{T.speed.toFixed(0)}<small> m/s</small></span>
          <span>launch</span>
          <span className="big">{T.ke.toFixed(0)}<small> J</small></span>
          <span>arrow KE (physical)</span>
        </div>
        <div className="mode-tag">{M.emoji} <span className="hi">{M.hi}</span> · {M.label}</div>
      </div>
      {T.lastImpact && <div className="impact-line">Last impact · {T.lastImpact} <span className="dim">(fantasy = real KE × {CELESTIAL_GAIN.toExponential(1)} × {mult.toFixed(1)})</span></div>}
      <div className="hint">{drawing ? 'Pull back for power · nock low to aim higher · release to fire' : hover ? 'Grab the string' : 'Grab the glowing string and pull back · drag empty space to aim · Space fires · B replays'}</div>
    </div>
  );
}

export function ChallengeBar() {
  const ch = useStore(ui, (s) => s.challenge);
  if (!ch) return null;
  const C = CHALLENGES[ch.id];
  return (
    <div className={`challenge-bar ${ch.status}`}>
      <div className="t">{C.title}</div>
      <div className="g">{ch.note || C.goal}</div>
      <div className="p"><div style={{ width: `${Math.round(ch.progress * 100)}%` }} /></div>
      <div className="teach">{C.teach.map((x) => <span key={x}>{x}</span>)}</div>
      <div className="btns">
        <button onClick={() => void startChallenge(ch.id)}>Reset challenge</button>
        <button onClick={() => void startChallenge(null)}>Exit</button>
      </div>
    </div>
  );
}

export function Debug() {
  const on = useStore(ui, (s) => s.debug);
  const T = useStore(telemetry, (t) => t);
  if (!on) return null;
  const gl = stageRef.current?.renderer;
  const info = gl?.info.render;
  return (
    <div className="debug">
      <div><b>{T.fps.toFixed(0)}</b> fps</div>
      <div><b>{T.loose}</b> active rigid bodies · <b>{T.fixed}</b> attached pieces</div>
      <div><b>{T.rubble}</b> decorative rubble (instanced, not simulated)</div>
      <div>draw <b>{Math.round(T.draw * 100)}%</b> · time scale <b>{T.timeScale.toFixed(2)}×</b></div>
      <div>physics <b>{T.stepMs.toFixed(2)}</b> ms/step (1/120 s) · detached <b>{(T.detached * 100).toFixed(1)}%</b></div>
      <div>quality <b>{T.quality}</b> · {info ? `${info.calls} draw calls, ${(info.triangles / 1000).toFixed(0)}k tris` : ''} · WebGL2</div>
    </div>
  );
}

export function Loading() {
  const status = useStore(ui, (s) => s.status);
  return (
    <div className="loading">
      <div className="logo big"><b>ASTRA</b><i>.EXE</i></div>
      <div className="forge">Forging the Astral Bow</div>
      <div className="spinner" />
      <ul>{status.map((s, i) => <li key={i}>{s}</li>)}</ul>
    </div>
  );
}

export function Toast() {
  const t = useStore(ui, (s) => s.toast);
  const [, force] = useState(0);
  useEffect(() => { if (!t) return; const id = setTimeout(() => force((x) => x + 1), 2300); return () => clearTimeout(id); }, [t]);
  if (!t || performance.now() - t.t > 2200) return null;
  return <div className="toast" key={t.t}>{t.text}</div>;
}

/** 9:16 framing guide with the Reels safe zones, high-res PNG export, WebM recording and camera bookmarks. */
export function CaptureFrame() {
  const rec = useRef<MediaRecorder | null>(null);
  const recording = useStore(ui, (s) => s.recording);
  const marks = useRef<(null | { p: THREE.Vector3; l: THREE.Vector3; f: number })[]>([null, null, null]);
  useEffect(() => {
    try {
      const m = JSON.parse(localStorage.getItem('astra-bookmarks') ?? 'null');
      if (Array.isArray(m)) marks.current = m.map((x: { p: number[]; l: number[]; f: number } | null) => x && { p: new THREE.Vector3(...x.p), l: new THREE.Vector3(...x.l), f: x.f });
    } catch { /* storage unavailable: bookmarks last for this visit only */ }
  }, []);
  const save = (i: number) => {
    const c = stageRef.current?.camRig; if (!c) return;
    marks.current[i] = { p: c.pos.clone(), l: c.look.clone(), f: c.fov };
    try { localStorage.setItem('astra-bookmarks', JSON.stringify(marks.current.map((m) => m && { p: m.p.toArray(), l: m.l.toArray(), f: m.f }))); } catch { /* fine */ }
    toast(`Camera bookmark ${i + 1} saved`);
  };
  const go = (i: number) => {
    const m = marks.current[i], c = stageRef.current?.camRig;
    if (!m || !c) { toast('Empty bookmark: save one first'); return; }
    settings.set({ camera: 'cinematic' });
    const pose = { pos: m.p.clone(), look: m.l.clone(), fov: m.f };
    c.snap(pose); c.cut = { until: Infinity, pose };
  };
  const png = () => {
    const st = stageRef.current; if (!st) return;
    const gl = st.renderer, dpr = gl.getPixelRatio();
    gl.setPixelRatio(dpr * 2); st.setSize(innerWidth, innerHeight); st.updateViews(0, { camera: false }); st.render();
    gl.domElement.toBlob((b) => {
      if (b) { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `astra-${Date.now()}.png`; a.click(); }
      gl.setPixelRatio(dpr); st.setSize(innerWidth, innerHeight);
    }, 'image/png');
  };
  const record = () => {
    const st = stageRef.current; if (!st) return;
    if (rec.current) { rec.current.stop(); rec.current = null; ui.set({ recording: false }); return; }
    const stream = st.renderer.domElement.captureStream(60);
    const r = new MediaRecorder(stream, { mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9' : 'video/webm', videoBitsPerSecond: 24e6 });
    const parts: Blob[] = [];
    r.ondataavailable = (e) => parts.push(e.data);
    r.onstop = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(parts, { type: 'video/webm' })); a.download = `astra-${Date.now()}.webm`; a.click(); };
    r.start(); rec.current = r; ui.set({ recording: true });
  };
  return (
    <div className="capture-frame">
      <div className="guide"><div className="safe-top" /><div className="safe-bottom" /><span>9:16 · Reels safe zone</span></div>
      <div className="capture-bar">
        <button onClick={png}>PNG ×2</button>
        <button className={recording ? 'on' : ''} onClick={record}>{recording ? '■ Stop recording' : '● Record WebM'}</button>
        {[0, 1, 2].map((i) => <span key={i} className="bm"><button onClick={() => go(i)}>Cam {i + 1}</button><button onClick={() => save(i)} title="Save the current camera">save</button></span>)}
        <button onClick={() => { const c = stageRef.current?.camRig; if (c) c.cut = null; ui.set({ capture: false }); }}>Exit <kbd>Esc</kbd></button>
      </div>
    </div>
  );
}
