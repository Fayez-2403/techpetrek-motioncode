// Face Dance Studio, face side. Everything runs on this device: MediaPipe Face Landmarker (Apache-2.0, model + wasm served
// from /public/models) finds faces and 478 landmarks; the chosen face is cut from the photo and becomes the texture of
// MediaPipe's canonical 468-vertex face mesh, with each vertex's UV = that landmark's position in the photo (this
// "frontalises" a tilted head onto the mesh). The mask fades out along the face oval so it blends into the head.
// Nothing is uploaded or stored: faces live in memory until removed (Delete all faces clears them at once).
import * as THREE from 'three';
import { FaceLandmarker, FilesetResolver, type NormalizedLandmark } from '@mediapipe/tasks-vision';

let landmarker: FaceLandmarker | null = null;
export async function getLandmarker() {
  if (landmarker) return landmarker;
  const files = await FilesetResolver.forVisionTasks('/models/wasm');
  landmarker = await FaceLandmarker.createFromOptions(files, {
    baseOptions: { modelAssetPath: '/models/face_landmarker.task', delegate: 'GPU' },
    runningMode: 'IMAGE', numFaces: 6, outputFacialTransformationMatrixes: true,
  });
  return landmarker;
}

export interface FaceRecord {
  id: string; name: string; crop: string;                // data URL of the cropped face region (the texture)
  uv: Float32Array;                                      // 468 landmark positions inside the crop (u, v)
  skin: string; yawDeg: number; createdAt: number;
}
export interface Detected { box: { x: number; y: number; w: number; h: number }; landmarks: NormalizedLandmark[]; yawDeg: number }

/** draw an image (rotated by quarter turns) to a canvas we own */
export function toCanvas(img: CanvasImageSource & { width: number; height: number }, quarterTurns = 0, mirror = false) {
  const turn = ((quarterTurns % 4) + 4) % 4, w = img.width, h = img.height;
  const c = document.createElement('canvas'); c.width = turn % 2 ? h : w; c.height = turn % 2 ? w : h;
  const g = c.getContext('2d')!;
  g.translate(c.width / 2, c.height / 2); g.rotate((turn * Math.PI) / 2); if (mirror) g.scale(-1, 1);
  g.drawImage(img, -w / 2, -h / 2);
  return c;
}

export async function detect(canvas: HTMLCanvasElement): Promise<Detected[]> {
  const lm = await getLandmarker();
  const res = lm.detect(canvas);
  return (res.faceLandmarks ?? []).map((pts, i) => {
    let x0 = 1, y0 = 1, x1 = 0, y1 = 0;
    for (const p of pts) { x0 = Math.min(x0, p.x); y0 = Math.min(y0, p.y); x1 = Math.max(x1, p.x); y1 = Math.max(y1, p.y); }
    const m = res.facialTransformationMatrixes?.[i]?.data;
    const yawDeg = m ? (Math.atan2(m[8], m[10]) * 180) / Math.PI : 0;
    return { box: { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }, landmarks: pts, yawDeg };
  }).sort((a, b) => a.box.x - b.box.x);
}

/** cut the face out (with margin) at up to 512 px and store UVs relative to the crop */
export function makeFace(canvas: HTMLCanvasElement, d: Detected, name: string): FaceRecord {
  const W = canvas.width, H = canvas.height, m = 0.18;
  const bx = Math.max(0, (d.box.x - d.box.w * m) * W), by = Math.max(0, (d.box.y - d.box.h * m) * H);
  const bw = Math.min(W - bx, d.box.w * (1 + 2 * m) * W), bh = Math.min(H - by, d.box.h * (1 + 2 * m) * H);
  const side = Math.min(512, Math.max(bw, bh));
  const c = document.createElement('canvas'); c.width = Math.round((side * bw) / Math.max(bw, bh)); c.height = Math.round((side * bh) / Math.max(bw, bh));
  const g = c.getContext('2d')!; g.drawImage(canvas, bx, by, bw, bh, 0, 0, c.width, c.height);
  const uv = new Float32Array(468 * 2);
  for (let i = 0; i < 468; i++) { const p = d.landmarks[i]; uv[i * 2] = (p.x * W - bx) / bw; uv[i * 2 + 1] = 1 - (p.y * H - by) / bh; }
  // skin tone: average of small cheek / forehead patches
  let r = 0, gg = 0, b = 0, n = 0;
  for (const k of [50, 280, 151, 205, 425]) {
    const px = Math.round(uv[k * 2] * c.width), py = Math.round((1 - uv[k * 2 + 1]) * c.height);
    const data = g.getImageData(Math.max(0, px - 4), Math.max(0, py - 4), 8, 8).data;
    for (let i = 0; i < data.length; i += 4) { r += data[i]; gg += data[i + 1]; b += data[i + 2]; n++; }
  }
  // the pixels are sRGB: say so, or getHexString() treats them as linear and brightens them (pale, washed-out necks and hands)
  const skin = new THREE.Color().setRGB(r / n / 255, gg / n / 255, b / n / 255, THREE.SRGBColorSpace);
  return { id: Math.random().toString(36).slice(2, 9), name, crop: c.toDataURL('image/jpeg', 0.92), uv, skin: '#' + skin.getHexString(), yawDeg: d.yawDeg, createdAt: Date.now() };
}

// ---------------------------------------------------------------- canonical face mesh (MediaPipe, Apache-2.0)
const OVAL = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109];
let canon: { pos: Float32Array; index: number[]; alpha: Float32Array } | null = null;
export async function loadCanonical() {
  if (canon) return canon;
  const txt = await (await fetch('/models/canonical_face_model.obj')).text();
  const pos: number[] = [], index: number[] = [];
  for (const line of txt.split('\n')) {
    const t = line.trim().split(/\s+/);
    if (t[0] === 'v') pos.push(+t[1], +t[2], +t[3]);
    else if (t[0] === 'f') for (let k = 1; k <= 3; k++) index.push(parseInt(t[k].split('/')[0], 10) - 1);
  }
  const P = new Float32Array(pos);
  // centre: oval rim average z = 0, so the mask sits on the head sphere
  let cx = 0, cy = 0, cz = 0; for (const k of OVAL) { cx += P[k * 3]; cy += P[k * 3 + 1]; cz += P[k * 3 + 2]; }
  cx /= OVAL.length; cy /= OVAL.length; cz /= OVAL.length;
  for (let i = 0; i < P.length; i += 3) { P[i] -= cx; P[i + 1] -= cy; P[i + 2] -= cz; }
  // alpha: 0 on the oval, rising to 1 a little inside (soft edge)
  const poly = OVAL.map((k) => [P[k * 3], P[k * 3 + 1]]);
  const alpha = new Float32Array(468);
  for (let i = 0; i < 468; i++) {
    const x = P[i * 3], y = P[i * 3 + 1];
    let d = 1e9;
    for (let a = 0; a < poly.length; a++) {
      const [x1, y1] = poly[a], [x2, y2] = poly[(a + 1) % poly.length];
      const dx = x2 - x1, dy = y2 - y1, u = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy)));
      d = Math.min(d, Math.hypot(x - x1 - u * dx, y - y1 - u * dy));
    }
    alpha[i] = OVAL.includes(i) ? 0 : Math.min(1, Math.max(0, (d - 0.15) / 1.6)) ** 0.8;
  }
  canon = { pos: P, index, alpha };
  return canon;
}

/** the face mask mesh for a face record (metres; ~15 cm wide; faces +Z) */
export async function faceMesh(face: FaceRecord) {
  const c = await loadCanonical();
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(c.pos.slice(), 3));
  g.setAttribute('uv', new THREE.BufferAttribute(face.uv, 2));
  g.setAttribute('aAlpha', new THREE.BufferAttribute(c.alpha, 1));
  g.setIndex(c.index); g.computeVertexNormals();
  const tex = await new THREE.TextureLoader().loadAsync(face.crop); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const m = new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: 0.58, metalness: 0, depthWrite: true });
  m.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float aAlpha; varying float vAlpha;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvAlpha = aAlpha;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vAlpha;').replace('#include <dithering_fragment>', '#include <dithering_fragment>\ngl_FragColor.a *= vAlpha;');
  };
  const mesh = new THREE.Mesh(g, m);
  mesh.scale.setScalar(0.0102); mesh.renderOrder = 2;
  return mesh;
}
