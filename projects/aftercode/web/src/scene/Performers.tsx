// The dancers on stage: one Avatar per performer, posed every frame from the song beat (pure), positioned by formation.
// Office intro (Developer Break): everyone starts seated at their desk and stands up one after another on the beat.
import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Avatar } from '../dance/avatar';
import { clipPose, getClip, intensify, mirrorPose, newPose, type Clip, type Pose } from '../dance/clips';
import { cue, position } from '../dance/crew';
import { faceMesh } from '../face/faces';
import { getState, modeKind, useApp } from '../state';
import { AF } from './af';

/** seated pose (office intro): thighs forward, shins down, a slight lean, forearms on the desk */
function sitPose(c: Clip): Pose {
  const p = newPose(c); const id = new THREE.Quaternion();
  for (let j = 0; j < c.joints.length; j++) p.q.set([id.x, id.y, id.z, id.w], j * 4);
  const set = (n: string, x: number, y = 0, z = 0) => { const j = c.joints.indexOf(n); if (j < 0) return; const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(x, y, z, 'XYZ')); p.q.set([q.x, q.y, q.z, q.w], j * 4); };
  set('LeftUpLeg', -1.5); set('RightUpLeg', -1.5); set('LeftLeg', 1.45); set('RightLeg', 1.45);
  set('LowerBack', 0.18); set('LeftArm', 0.2, 0, 1.15); set('RightArm', 0.2, 0, -1.15); set('LeftForeArm', 0, -1.35, 0); set('RightForeArm', 0, 1.35, 0);
  set('Neck', 0.25);
  p.root.set([0, 8.6, -1.2]);
  return p;
}
const qa = new THREE.Quaternion(), qb = new THREE.Quaternion(), fwd = new THREE.Vector3();
function blendPose(a: Pose, b: Pose, w: number, out: Pose) {
  for (let j = 0; j < a.q.length; j += 4) {
    qa.set(a.q[j], a.q[j + 1], a.q[j + 2], a.q[j + 3]); qb.set(b.q[j], b.q[j + 1], b.q[j + 2], b.q[j + 3]); qa.slerp(qb, w);
    out.q[j] = qa.x; out.q[j + 1] = qa.y; out.q[j + 2] = qa.z; out.q[j + 3] = qa.w;
  }
  for (let k = 0; k < 3; k++) out.root[k] = a.root[k] + (b.root[k] - a.root[k]) * w;
}
/** stand-up beat of performer i in the office intro (lead first, then the others two beats apart) */
export const standBeat = (i: number) => 8 + (i === 0 ? 0 : 4 + 2 * i);
/** office desk spots for performer i of n (the intro), matching the Office world's desk layout */
export const deskSpot = (i: number, n: number): [number, number] => { const mid = (n - 1) / 2, k = i === 0 ? mid : mid + (i % 2 ? -(i + 1) / 2 : i / 2); return [(k - mid) * 1.55, -0.9]; };   // lead in the middle

export const Performers: React.FC<{ skeleton: Clip }> = ({ skeleton }) => {
  const performers = useApp((s) => s.performers), faces = useApp((s) => s.faces);
  const root = useRef<THREE.Group>(null);
  const avatars = useRef(new Map<string, Avatar>());
  const faceOf = useRef(new Map<string, string | null>());
  const lookOf = useRef(new Map<string, string>());
  const pose = useMemo(() => newPose(skeleton), [skeleton]);
  const sit = useMemo(() => sitPose(skeleton), [skeleton]);
  const out = useMemo(() => newPose(skeleton), [skeleton]);

  useEffect(() => {
    const g = root.current!; const map = avatars.current;
    for (const [id, av] of map) if (!performers.find((p) => p.id === id)) { g.remove(av); map.delete(id); }
    performers.forEach((p) => {
      let av = map.get(p.id);
      const toy = (l: typeof p.look) => l.body === 'stylized' || l.body === 'anime';
      if (av && (toy(av.look) !== toy(p.look) || (av.look.height ?? 1) !== (p.look.height ?? 1))) {   // proportions change: rebuild the skeleton
        g.remove(av); map.delete(p.id); faceOf.current.delete(p.id); av = undefined;
      }
      if (!av) { av = new Avatar(skeleton, p.look); map.set(p.id, av); g.add(av); lookOf.current.set(p.id, JSON.stringify(p.look)); }
      const lk = JSON.stringify(p.look);
      if (lookOf.current.get(p.id) !== lk) { av.dressUp(p.look); lookOf.current.set(p.id, lk); }
      if (faceOf.current.get(p.id) !== p.faceId) {
        faceOf.current.set(p.id, p.faceId);
        const slot = av.faceSlot; slot.clear();
        const rec = faces.find((f) => f.id === p.faceId);
        av.setPhoto(!!rec);   // no photo: the avatar's own drawn face (eyes, brows, mouth) shows
        if (rec) void faceMesh(rec).then((m) => { if (faceOf.current.get(p.id) === rec.id) slot.add(m); });
      }
    });
  }, [performers, faces, skeleton]);

  useFrame(() => {
    const s = getState(), n = s.performers.length, kind = modeKind(s);
    const office = s.world === 'office' && s.officeIntro;
    s.performers.forEach((p, i) => {
      const av = avatars.current.get(p.id); if (!av) return;
      const c = cue(kind, s.performers, i, AF.b, AF.dropBeat, s.turnBeats, s.turnAt);
      const clip = getClip(c.style) ?? getClip('hiphop'); if (!clip) return;
      av.calibrate(clip, (t) => { clipPose(clip, t / clip.beat, pose, clip.beat); return pose; });
      clipPose(clip, AF.b + c.beatOffset, pose, AF.beatLen);
      if (c.mirror) mirrorPose(clip, pose);
      intensify(clip, pose, Math.min(1.2, c.intensity * s.intensity));
      let [x, z] = position(s.formation, n, i, AF.b - s.phraseOffset, s.phraseBeats);
      let yaw = c.yaw;
      if (office) {
        const sb = standBeat(i) + s.introAt, w = Math.max(0, Math.min(1, (AF.b - sb) / 2));
        const ww = w * w * (3 - 2 * w);
        if (ww < 1) { blendPose(sit, pose, ww, out); av.apply(clip, out, ww > 0.5); } else av.apply(clip, pose);
        const [dx, dz] = deskSpot(i, n);
        const u = Math.max(0, Math.min(1, (AF.b - sb - 1) / 4)), uu = u * u * (3 - 2 * u);
        x = dx + (x - dx) * uu; z = dz + (z - dz) * uu; yaw = Math.PI * (1 - uu) + yaw * uu;   // seated facing the desk, turns to the room as it stands
      } else av.apply(clip, pose);
      // arrival: a newly added dancer drops in from above and lands decelerating (no fade, no grow-from-zero)
      let y = 0; if (p.spawnBeat !== undefined) { const u = Math.max(0, Math.min(1, (AF.b - p.spawnBeat) / 1.2)); y = 3.2 * (1 - u) ** 3; av.visible = AF.b >= p.spawnBeat; } else av.visible = true;
      if (s.faceFront) {   // the hips' heading from this pose (pure), cancelled; travel pinned
        const h = av.bones[0]; fwd.set(0, 0, 1).applyQuaternion(h.quaternion); yaw -= Math.atan2(fwd.x, fwd.z); h.position.x = 0; h.position.z = 0;
      }
      av.position.set(x, y, z); av.rotation.y = yaw; av.seed = i; av.tick(AF.t, AF.b, c.rap ?? 0);
    });
  });
  return <group ref={root} />;
};
