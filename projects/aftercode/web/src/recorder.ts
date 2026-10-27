// Record Reel: the WebGL canvas + the song (MediaRecorder, WebM). Each frame is composited onto a 2D canvas that adds the
// required labels: "SYNTHETIC PERFORMANCE · made with AFTERCODE" and the music credit (CC BY 4.0 needs attribution).
import { engine } from './audio/engine';
import { LIBRARY } from './audio/library';

let rec: MediaRecorder | null = null, raf = 0;
export function startRecording(gl: HTMLCanvasElement, vertical: boolean, onDone: (url: string) => void) {
  const W = vertical ? 1080 : 1920, H = vertical ? 1920 : 1080;
  const out = document.createElement('canvas'); out.width = W; out.height = H; const g = out.getContext('2d')!;
  const track = LIBRARY.find((t) => t.id === engine.trackId);
  const credit = track ? `Music: "${track.title}" Kevin MacLeod (incompetech.com) · CC BY 4.0` : 'Music: user upload';
  const draw = () => {
    const sw = gl.width, sh = gl.height, s = Math.max(W / sw, H / sh);
    g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
    g.drawImage(gl, (W - sw * s) / 2, (H - sh * s) / 2, sw * s, sh * s);
    g.font = `600 ${Math.round(H * 0.014)}px Inter, sans-serif`; g.fillStyle = 'rgba(255,255,255,0.78)'; g.textAlign = 'left';
    g.fillText('SYNTHETIC PERFORMANCE · made with AFTERCODE', W * 0.05, H * (vertical ? 0.86 : 0.94));
    g.font = `500 ${Math.round(H * 0.012)}px Inter, sans-serif`; g.fillStyle = 'rgba(255,255,255,0.6)';
    g.fillText(credit, W * 0.05, H * (vertical ? 0.875 : 0.965));
    raf = requestAnimationFrame(draw);
  };
  draw();
  const stream = out.captureStream(60);
  const a = engine.recordDest?.stream.getAudioTracks()[0]; if (a) stream.addTrack(a);
  const chunks: Blob[] = [];
  rec = new MediaRecorder(stream, { mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus') ? 'video/webm;codecs=vp9,opus' : 'video/webm', videoBitsPerSecond: 16_000_000 });
  rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
  rec.onstop = () => { cancelAnimationFrame(raf); onDone(URL.createObjectURL(new Blob(chunks, { type: 'video/webm' }))); };
  rec.start(500);
}
export function stopRecording() { rec?.stop(); rec = null; }
