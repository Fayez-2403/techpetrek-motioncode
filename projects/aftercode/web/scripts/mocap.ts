// Mocap preprocessor: CMU BVH (120 fps, Bruce Hahne's BVH conversion) -> compact 60 fps dance clips in public/mocap/*.json.
// For each clip: picks the strongest continuous dance window, measures the motion's own beat (period + phase of the
// movement accents, from joint angular speed), removes root drift (dancers stay on their mark) and turns the clip to
// face +Z (the camera). Run: bun scripts/mocap.ts
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import * as THREE from 'three';

interface Joint { name: string; parent: number; offset: number[]; channels: string[] }
function parseBVH(text: string) {
  const tok = text.split(/\s+/).filter(Boolean);
  let i = 0;
  const joints: Joint[] = [];
  const stack: number[] = [];
  while (tok[i] !== 'MOTION') {
    const t = tok[i++];
    if (t === 'ROOT' || t === 'JOINT') {
      joints.push({ name: tok[i++], parent: stack.length ? stack[stack.length - 1] : -1, offset: [], channels: [] });
    } else if (t === 'End') {
      i++; // "Site"
      joints.push({ name: '__end', parent: stack[stack.length - 1], offset: [], channels: [] });
    } else if (t === '{') stack.push(joints.length - 1);
    else if (t === '}') stack.pop();
    else if (t === 'OFFSET') joints[joints.length - 1].offset = [+tok[i++], +tok[i++], +tok[i++]];
    else if (t === 'CHANNELS') { const n = +tok[i++]; for (let k = 0; k < n; k++) joints[joints.length - 1].channels.push(tok[i++]); }
  }
  i++; // MOTION
  i++; const nFrames = +tok[i++]; // Frames:
  i += 2; const frameTime = +tok[i++]; // Frame Time:
  const nCh = joints.reduce((a, j) => a + j.channels.length, 0);
  const data = new Float32Array(nFrames * nCh);
  for (let k = 0; k < nFrames * nCh; k++) data[k] = +tok[i++];
  return { joints, nFrames, frameTime, nCh, data };
}

const SPEC = [
  // style id, source, label (CMU description)
  { id: 'hiphop', file: '141_12', label: 'Hip-hop groove (CMU 141_12 "Dance, Twist")' },
  { id: 'popping', file: '120_21', label: 'Popping (CMU 120_21 "Robot")' },
  { id: 'shuffle', file: '93_08', label: 'Shuffle / Charleston (CMU 93_08 "xtra fancy charleston")' },
  { id: 'disco', file: '15_04', label: 'Funk / disco (CMU 15_04 Egyptian walk, the Twist, the Cabbage Patch)' },
  { id: 'contemporary', file: '05_02', label: 'Contemporary (CMU 05_02 modern dance)' },
  { id: 'cyber', file: '120_05', label: 'Robotic / cyber (CMU 120_05 "Mickey Dance")' },
  { id: 'bollywood', file: '94_05', label: 'Bollywood-inspired groove (CMU 94_05, subject 94 "indian dance")' },
  { id: 'freestyle', file: '111_05', label: 'Casual freestyle (CMU 111_05 "Dance")' },
  { id: 'salsa', file: '60_01', label: 'Salsa (CMU 60_01)' },
  { id: 'comedy', file: '143_35', label: 'Comedy / Macarena (CMU 143_35)' },
  { id: 'moonwalk', file: '90_32', label: 'Moonwalk (CMU 90_32)' },
  { id: 'groove', file: '113_04', label: 'Side groove (CMU 113_04 "Dance")' },
];

const OUT_FPS = 60;
mkdirSync('public/mocap', { recursive: true });
const index: unknown[] = [];
const eu = new THREE.Euler(), q = new THREE.Quaternion();

for (const s of SPEC) {
  const b = parseBVH(readFileSync(`../assets/mocap_bvh/${s.file}.bvh`, 'utf8'));
  const J = b.joints.filter((j) => j.name !== '__end');
  const map = b.joints.map((j) => J.indexOf(j));
  // parent indices in the compact list (End Sites dropped; their parents keep their own offsets)
  const parents = J.map((j) => (j.parent < 0 ? -1 : map[j.parent]));
  const srcFps = 1 / b.frameTime;
  const step = srcFps / OUT_FPS;
  const n = Math.floor(b.nFrames / step);
  // local rotations + root position per output frame
  const rot = new Float32Array(n * J.length * 4), root = new Float32Array(n * 3);
  for (let f = 0; f < n; f++) {
    const src = Math.min(b.nFrames - 1, Math.round(f * step));
    let c = src * b.nCh;
    let ji = 0;
    for (const j of b.joints) {
      if (j.name === '__end') continue;
      let x = 0, y = 0, z = 0, px = 0, py = 0, pz = 0; const order: string[] = [];
      for (const ch of j.channels) {
        const v = b.data[c++];
        if (ch === 'Xposition') px = v; else if (ch === 'Yposition') py = v; else if (ch === 'Zposition') pz = v;
        else { const a = (v * Math.PI) / 180; order.push(ch[0]); if (ch[0] === 'X') x = a; else if (ch[0] === 'Y') y = a; else z = a; }
      }
      // BVH applies rotations in channel order: R = R1 * R2 * R3; three's Euler order 'ZYX' = Rz*Ry*Rx
      eu.set(x, y, z, (order.join('') || 'ZYX') as THREE.EulerOrder); q.setFromEuler(eu);
      rot.set([q.x, q.y, q.z, q.w], (f * J.length + ji) * 4);
      if (ji === 0) root.set([px, py, pz], f * 3);
      ji++;
    }
  }
  // movement energy: summed angular speed of the main limbs
  const energy = new Float32Array(n);
  for (let f = 1; f < n; f++) {
    let e = 0;
    for (let j = 0; j < J.length; j++) {
      const a = (f * J.length + j) * 4, p = ((f - 1) * J.length + j) * 4;
      const d = Math.abs(rot[a] * rot[p] + rot[a + 1] * rot[p + 1] + rot[a + 2] * rot[p + 2] + rot[a + 3] * rot[p + 3]);
      e += Math.acos(Math.min(1, d));
    }
    energy[f] = e;
  }
  // smooth, then pick the 12 s window (or the whole clip if shorter) with the highest mean energy and low root travel
  const win = Math.min(n - 2, Math.round(12 * OUT_FPS));
  let best = 1, bestScore = -1e9;
  for (let a = 1; a + win < n; a += 15) {
    let e = 0; for (let f = a; f < a + win; f++) e += energy[f];
    const dx = root[(a + win) * 3] - root[a * 3], dz = root[(a + win) * 3 + 2] - root[a * 3 + 2];
    const score = e / win - 0.002 * Math.hypot(dx, dz);
    if (score > bestScore) { bestScore = score; best = a; }
  }
  // the clip's beat: autocorrelation of the energy over 0.35..1.1 s lags
  const seg = energy.slice(best, best + win);
  const mean = seg.reduce((x, y) => x + y, 0) / seg.length;
  let bestLag = 30, bestR = -1;
  for (let lag = Math.round(0.35 * OUT_FPS); lag <= Math.round(1.1 * OUT_FPS); lag++) {
    let r = 0; for (let f = 0; f + lag < seg.length; f++) r += (seg[f] - mean) * (seg[f + lag] - mean);
    if (r > bestR) { bestR = r; bestLag = lag; }
  }
  const beat = bestLag / OUT_FPS;
  // accent phase: where the folded energy peaks inside one beat
  const fold = new Float32Array(bestLag);
  for (let f = 0; f < seg.length; f++) fold[f % bestLag] += seg[f];
  let ph = 0; for (let k = 1; k < bestLag; k++) if (fold[k] > fold[ph]) ph = k;
  // loop length: whole beats (multiple of 4), as long as the window allows
  const beats = Math.max(4, Math.floor(win / bestLag / 4) * 4);
  const len = beats * bestLag + 1;
  // facing: rotate so the hips' initial forward points at +Z; root drift: remove the trend, keep the bounce
  // facing: circular mean of the hips' forward yaw over the loop window (not just its first frame), rotated to +Z
  let sx = 0, sz = 0;
  for (let f = best; f < best + len; f += 4) { const a0 = f * J.length * 4; const qq = new THREE.Quaternion(rot[a0], rot[a0 + 1], rot[a0 + 2], rot[a0 + 3]); const fw = new THREE.Vector3(0, 0, 1).applyQuaternion(qq); const n2 = Math.hypot(fw.x, fw.z) || 1; sx += fw.x / n2; sz += fw.z / n2; }
  const yaw = Math.atan2(sx, sz); const spread = Math.hypot(sx, sz) / Math.ceil(len / 4);
  const turn = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -yaw);
  const outRot: number[] = [], outRoot: number[] = [];
  const x0 = root[best * 3], z0 = root[best * 3 + 2], x1 = root[(best + len - 1) * 3], z1 = root[(best + len - 1) * 3 + 2];
  for (let f = 0; f < len; f++) {
    const src = best + f, u = f / (len - 1);
    for (let j = 0; j < J.length; j++) {
      const a = (src * J.length + j) * 4;
      q.set(rot[a], rot[a + 1], rot[a + 2], rot[a + 3]);
      if (j === 0) q.premultiply(turn);
      outRot.push(+q.x.toFixed(4), +q.y.toFixed(4), +q.z.toFixed(4), +q.w.toFixed(4));
    }
    // root drift: subtract a 2 s moving average of x/z (keeps the sway, pins the dancer to its mark), periodic at the loop seam
    let mx = 0, mz = 0; const W2 = 60;
    for (let k = -W2; k <= W2; k++) { const ss = best + Math.min(len - 1, Math.max(0, f + k)); mx += root[ss * 3]; mz += root[ss * 3 + 2]; }
    mx /= 2 * W2 + 1; mz /= 2 * W2 + 1; void x0; void z0; void x1; void z1; void u;
    const v = new THREE.Vector3(root[src * 3] - mx, root[src * 3 + 1], root[src * 3 + 2] - mz).applyQuaternion(turn);
    outRoot.push(+v.x.toFixed(3), +v.y.toFixed(3), +v.z.toFixed(3));
  }
  const clip = { id: s.id, label: s.label, source: `CMU Graphics Lab Motion Capture Database, ${s.file} (BVH by B. Hahne)`, fps: OUT_FPS,
    joints: J.map((j) => j.name), parents, offsets: J.map((j) => j.offset.map((v) => +v.toFixed(4))), frames: len,
    beat: +beat.toFixed(4), phase: +(ph / OUT_FPS).toFixed(4), beats, rot: outRot, root: outRoot };
  writeFileSync(`public/mocap/${s.id}.json`, JSON.stringify(clip));
  index.push({ id: s.id, label: s.label, beat: clip.beat, beats, seconds: +((len - 1) / OUT_FPS).toFixed(2), file: s.file });
  console.log(`facing-consistency ${spread.toFixed(2)}  ${s.id.padEnd(13)} ${s.file.padEnd(7)} window ${(best / OUT_FPS).toFixed(1)}s  beat ${beat.toFixed(3)}s (${(60 / beat).toFixed(0)} bpm)  ${beats} beats  ${((len - 1) / OUT_FPS).toFixed(1)}s`);
}
writeFileSync('public/mocap/index.json', JSON.stringify(index, null, 1));
