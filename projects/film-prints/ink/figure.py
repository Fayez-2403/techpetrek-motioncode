"""Figure helpers: tapered limbs with a hard shade side, and a part-based rig (each part has a pivot and its own
local drawing, so a pose is just joint angles). Local units, y down."""
import math
import numpy as np

from .core import Pic, ell, catmull, affine, apply
from . import palette as K


def tube(a, b, wa, wb, n=6, bulge=0.0):
    """Outline of a tapered limb from a to b (widths wa -> wb), with an optional muscle bulge."""
    a, b = np.asarray(a, float), np.asarray(b, float)
    d = b - a
    L = np.linalg.norm(d) + 1e-9
    d /= L
    nrm = np.array([-d[1], d[0]])
    left, right = [], []
    for t in np.linspace(0, 1, n):
        w = (wa * (1 - t) + wb * t) / 2 * (1 + bulge * math.sin(math.pi * t))
        c = a + d * L * t
        left.append(c + nrm * w)
        right.append(c - nrm * w)
    capb = [b + d * wb * 0.35]
    capa = [a - d * wa * 0.3]
    return np.vstack([left, capb, right[::-1], capa])


def limb(pic, a, b, wa, wb, color, shade, seed, bulge=0.0, w=3.8, shade_side=1, shade_frac=0.42):
    """A filled limb with one hard-edged shade side (the side away from the upper-left light)."""
    P = tube(a, b, wa, wb, bulge=bulge)
    F = pic.fill(P, color, jit=1.2, seed=seed)
    a, b = np.asarray(a, float), np.asarray(b, float)
    d = (b - a) / (np.linalg.norm(b - a) + 1e-9)
    nrm = np.array([-d[1], d[0]]) * shade_side
    sub = Pic()
    big = max(wa, wb) * 2
    off = nrm * max(wa, wb) * (0.5 - shade_frac)
    sub.fill([a + off - d * big, b + off + d * big, b + off + d * big + nrm * big, a + off - d * big + nrm * big], shade,
             smooth=False)
    pic.clip(F, sub, smooth=False)
    pic.outline(F, w=w, seed=seed + 1, breaks=2)
    return F


def diag_shade(pic, P, shade, p0, p1, alpha=255):
    """Clip a hard diagonal shade (everything right of the line p0 -> p1) inside shape P."""
    p0, p1 = np.asarray(p0, float), np.asarray(p1, float)
    d = (p1 - p0) / (np.linalg.norm(p1 - p0) + 1e-9)
    n = np.array([d[1], -d[0]])
    if n[0] < 0:
        n = -n
    big = 4000
    sub = Pic()
    sub.fill([p0 - d * big, p1 + d * big, p1 + d * big + n * big, p0 - d * big + n * big], shade, smooth=False,
             alpha=alpha)
    pic.clip(P, sub, smooth=False)


class Rig:
    """A jointed cut-out: parts are (name, parent, pivot in parent space, draw fn(pose) -> Pic in part space)."""

    def __init__(self):
        self.parts = []          # (name, parent, pivot, fn, z)

    def part(self, name, parent, pivot, fn, z=0):
        self.parts.append((name, parent, np.asarray(pivot, float), fn, z))

    def pose(self, angles=None, offsets=None, root=None, **kw):
        angles, offsets = angles or {}, offsets or {}
        mats = {}
        out = []
        for name, parent, pivot, fn, z in self.parts:
            PM = mats[parent] if parent else (root if root is not None else np.eye(3))
            ox, oy = offsets.get(name, (0, 0))
            M = PM @ affine(tx=pivot[0] + ox, ty=pivot[1] + oy, rot=angles.get(name, 0.0))
            mats[name] = M
            out.append((z, len(out), fn(**kw), M))
        pic = Pic()
        for z, _, p, M in sorted(out, key=lambda r: (r[0], r[1])):
            pic.add(p, M)
        return pic


def make_arm(seed, upper=(300, 150, 120), fore=(250, 118, 92), skin=None, sleeve=None, cuff=None, hand_scale=1.0,
             hand_pose="open", side=-1, hand_rot=None):
    """Returns (upper_fn, fore_fn) for a rig. Sleeve colours turn the limb into cloth; the hand is always skin."""
    skin = skin or K.SKIN
    cu = sleeve or skin
    cs = K.mix(cu, K.COBALT, 0.3) if sleeve else K.SKIN_SH
    from . import kit

    def up(**kw):
        p = Pic()
        L, wa, wb = upper
        limb(p, (0, 0), (0, L), wa, wb, cu, cs, seed, bulge=0.08, shade_side=-side)
        if sleeve:
            p.ink([[-side * wa * 0.2, L * 0.3], [0, L * 0.55], [side * wa * 0.15, L * 0.8]], w=2.0, color=K.FINE,
                  alpha=200, taper=(0.2, 0.5), seed=seed + 3)
        return p

    def fo(**kw):
        p = Pic()
        L, wa, wb = fore
        limb(p, (0, -8), (0, L), wa, wb, cu, cs, seed + 10, bulge=0.04, shade_side=-side)
        if cuff:
            Cf = tube((0, L - 34), (0, L + 4), wb * 1.12, wb * 1.12)
            p.shape(Cf, cuff, w=3.2, seed=seed + 12)
        pose = kw.get("hand_" + ("L" if side < 0 else "R"), hand_pose)
        kit.hand(p, 0, L - 4, s=hand_scale, rot=np.pi if hand_rot is None else hand_rot, pose=pose, shade=side > 0,
                 seed=seed + 20, mirror_x=side > 0)
        return p

    return up, fo


def ik2(shoulder, target, L1, L2, bend=1):
    """Two-bone IK in the rig's angle convention (a part draws along +y; rot th maps (0,1) -> (-sin th, cos th)).
    Returns (upper angle, forearm angle relative to the upper arm). bend=+1/-1 picks the elbow side."""
    S, T = np.asarray(shoulder, float), np.asarray(target, float)
    v = T - S
    D = min(np.linalg.norm(v), (L1 + L2) * 0.999)
    D = max(D, abs(L1 - L2) * 1.001 + 1e-6)
    phi = math.atan2(-v[0], v[1])
    a = math.acos(np.clip((L1 * L1 + D * D - L2 * L2) / (2 * L1 * D), -1, 1))
    th1 = phi + bend * a
    E = S + L1 * np.array([-math.sin(th1), math.cos(th1)])
    w = T - E
    thw = math.atan2(-w[0], w[1])
    return th1, thw - th1


def reach(rig_obj, angles, side, target_local, bend=1):
    """Pose one arm of a humanoid rig so its wrist lands on target_local (character space). Returns angles."""
    parts = {n: (par, piv) for n, par, piv, fn, z in rig_obj.parts}
    hips = parts["hips"][1]
    torso = parts["torso"][1]
    sh = hips + torso + parts["arm" + side][1]
    L1 = parts["fore" + side][1][1]
    L2 = L1 * 0.9 if "L2" not in angles else angles.pop("L2")
    a1, a2 = ik2(sh, target_local, L1, L2, bend)
    angles = dict(angles)
    angles["arm" + side], angles["fore" + side] = a1, a2
    return angles
