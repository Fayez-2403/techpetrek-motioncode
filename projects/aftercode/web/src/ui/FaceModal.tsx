// FACE DANCE STUDIO: upload photo / take selfie / use default avatar. All local: the camera starts only when the user
// presses TAKE SELFIE (and the indicator shows while it is on); captures are never stored beyond the in-memory face record.
import React, { useEffect, useRef, useState } from 'react';
import { detect, makeFace, toCanvas, type Detected } from '../face/faces';
import { getState, setState, updatePerformer, useApp } from '../state';

type Step = 'choose' | 'camera' | 'review';
export const FaceModal: React.FC<{ performer: number; onClose: () => void }> = ({ performer, onClose }) => {
  const [step, setStep] = useState<Step>('choose');
  const [src, setSrc] = useState<HTMLCanvasElement | null>(null);
  const [turns, setTurns] = useState(0);
  const [found, setFound] = useState<Detected[] | null>(null);
  const [pick, setPick] = useState(0);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [mirror, setMirror] = useState(true);
  const [name, setName] = useState(`Dancer ${String(performer + 1).padStart(2, '0')}`);
  const consent = useApp((s) => s.consent);
  const video = useRef<HTMLVideoElement>(null), stream = useRef<MediaStream | null>(null), preview = useRef<HTMLCanvasElement>(null);
  const drop = useRef<HTMLDivElement>(null);

  const stopCam = () => { stream.current?.getTracks().forEach((t) => t.stop()); stream.current = null; };
  useEffect(() => stopCam, []);

  const loadImage = (file: File) => {
    if (!/image\/(jpeg|png|webp)/.test(file.type)) { setErr('Please choose a JPEG, PNG or WebP image.'); return; }
    const img = new Image(); img.onload = () => { setSrc(toCanvas(img)); setTurns(0); setStep('review'); URL.revokeObjectURL(img.src); };
    img.src = URL.createObjectURL(file);
  };
  const startCam = async () => {
    setErr('');
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 1280, height: 720 }, audio: false });
      setStep('camera');
      requestAnimationFrame(() => { if (video.current && stream.current) { video.current.srcObject = stream.current; void video.current.play(); } });
    } catch { setErr('Camera permission was not granted (or no camera found). You can upload a photo instead.'); }
  };
  const capture = () => {
    const v = video.current; if (!v) return;
    const c = toCanvas(Object.assign(v, { width: v.videoWidth, height: v.videoHeight }) as unknown as HTMLVideoElement & { width: number; height: number }, 0, mirror);
    stopCam(); setSrc(c); setTurns(0); setStep('review');
  };
  // detect whenever the image or rotation changes
  useEffect(() => {
    if (!src || step !== 'review') return;
    const c = toCanvas(src, turns);
    setBusy(true); setErr(''); setFound(null);
    detect(c).then((d) => {
      setFound(d); setPick(0); setBusy(false);
      if (!d.length) setErr('No face found. Try a brighter, front-facing photo, rotate the image, or move closer to the camera.');
      const p = preview.current; if (p) { p.width = c.width; p.height = c.height; const g = p.getContext('2d')!; g.drawImage(c, 0, 0); }
    }).catch(() => { setBusy(false); setErr('Face detection could not start in this browser (WebGL / WebAssembly needed).'); });
  }, [src, turns, step]);
  // outline the found faces on the preview
  useEffect(() => {
    const p = preview.current; if (!p || !src || !found) return;
    const c = toCanvas(src, turns), g = p.getContext('2d')!; g.drawImage(c, 0, 0);
    found.forEach((f, i) => { g.lineWidth = Math.max(3, p.width / 200); g.strokeStyle = i === pick ? '#3bf0ff' : 'rgba(255,255,255,0.5)'; g.strokeRect(f.box.x * p.width, f.box.y * p.height, f.box.w * p.width, f.box.h * p.height); });
  }, [found, pick, src, turns]);

  const commit = () => {
    if (!src || !found?.length) return;
    const others = getState().performers.length > 1 || performer > 0;
    if (others && !consent) { setErr('Please confirm you have permission to use this person\'s likeness.'); return; }
    const rec = makeFace(toCanvas(src, turns), found[pick], name);
    setState((s) => ({ faces: [...s.faces, rec] }));
    updatePerformer(performer, { faceId: rec.id, look: { skin: rec.skin } as never });
    onClose();
  };
  const useDefault = () => { updatePerformer(performer, { faceId: null }); onClose(); };

  return (
    <div className="modal-back" onClick={() => { stopCam(); onClose(); }}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head"><span>FACE DANCE STUDIO</span><b>{name}</b><button className="x" onClick={() => { stopCam(); onClose(); }}>×</button></div>
        {step === 'choose' ? (
          <div className="choose">
            <div ref={drop} className="drop" onDragOver={(e) => { e.preventDefault(); drop.current?.classList.add('over'); }} onDragLeave={() => drop.current?.classList.remove('over')}
              onDrop={(e) => { e.preventDefault(); drop.current?.classList.remove('over'); const f = e.dataTransfer.files[0]; if (f) loadImage(f); }}>
              <div className="big">UPLOAD PHOTO</div><div className="sub">drop a JPEG, PNG or WebP here, or</div>
              <label className="btn">Choose file<input type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) loadImage(f); }} /></label>
            </div>
            <button className="tile" onClick={startCam}><div className="big">TAKE SELFIE</div><div className="sub">uses your camera only after you press this</div></button>
            <button className="tile" onClick={useDefault}><div className="big">USE DEFAULT AVATAR</div><div className="sub">a stylized face, no photo</div></button>
          </div>
        ) : null}
        {step === 'camera' ? (
          <div className="cam">
            <div className="cam-live"><span className="rec-dot" /> CAMERA ON</div>
            <div className="cam-view" style={{ transform: mirror ? 'scaleX(-1)' : undefined }}><video ref={video} playsInline muted /><div className="guide" /></div>
            <div className="row"><button className="btn primary" onClick={capture}>Capture</button><label className="chk"><input type="checkbox" checked={mirror} onChange={(e) => setMirror(e.target.checked)} /> Mirrored preview</label>
              <button className="btn" onClick={() => { stopCam(); setStep('choose'); }}>Turn camera off</button></div>
          </div>
        ) : null}
        {step === 'review' ? (
          <div className="review">
            <canvas ref={preview} className="preview" />
            <div className="side">
              <div className="row"><button className="btn" onClick={() => setTurns((t) => t - 1)}>⟲ Rotate</button><button className="btn" onClick={() => setTurns((t) => t + 1)}>⟳ Rotate</button><button className="btn" onClick={() => { setSrc(null); setStep('choose'); }}>Retake / other photo</button></div>
              {busy ? <div className="note">Finding faces… (on this device)</div> : null}
              {found && found.length > 1 ? <div className="faces">{found.map((_, i) => <button key={i} className={`btn ${i === pick ? 'primary' : ''}`} onClick={() => setPick(i)}>Face {i + 1}</button>)}</div> : null}
              {found?.length ? <div className="note ok">Face found{found.length > 1 ? `s: ${found.length}. Pick one.` : '.'} Head turn ≈ {Math.round(found[pick].yawDeg)}°</div> : null}
              <label className="field">Name<input value={name} onChange={(e) => setName(e.target.value)} /></label>
              <label className="chk"><input type="checkbox" checked={consent} onChange={(e) => setState({ consent: e.target.checked })} /> I have permission to use the likeness of everyone I add.</label>
              <div className="note small">Processed on this device. Nothing is uploaded or saved; Delete all faces removes them at once. Exports are labelled as a synthetic performance.</div>
              <button className="btn primary wide" disabled={!found?.length} onClick={commit}>Put this face on {name}</button>
            </div>
          </div>
        ) : null}
        {err ? <div className="err">{err}</div> : null}
      </div>
    </div>
  );
};
