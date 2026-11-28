"""Shared head-building helpers, so every character uses the same line, shade and texture rules."""
import numpy as np

from .core import Pic, ell, arc, catmull, mirror
from .figure import Rig, diag_shade, make_arm
from . import kit
from . import palette as K


def sym(L, lower_shift=0.0):
    """Mirror a left half-outline (top -> chin) into a full closed outline."""
    L = np.asarray(L, float)
    R = mirror(L)[1:]
    if lower_shift:
        R[:, 1] += np.clip((R[:, 1] - R[:, 1].min()) / (np.ptp(R[:, 1]) + 1e-9), 0, 1) * lower_shift
    return np.vstack([L, R])


def jawdrop(P, amount, y_from):
    P = np.asarray(P, float).copy()
    if amount:
        w = np.clip((P[:, 1] - y_from) / 200.0, 0, 1)
        P[:, 1] += amount * w
    return P


def face_base(p, sk, seed, shade=((60, -700), (200, 40)), lights=(), shades=(), w=4.4):
    """Skull fill, a hard diagonal shade (light from the upper left), light patches, cast shade, the outline."""
    H = p.fill(sk, K.SKIN, jit=2.0, seed=seed)
    sub = Pic()
    p0, p1 = np.asarray(shade[0], float), np.asarray(shade[1], float)
    d = (p1 - p0) / np.linalg.norm(p1 - p0)
    n = np.array([d[1], -d[0]])
    if n[0] < 0:
        n = -n
    sub.fill([p0 - d * 3000, p1 + d * 3000, p1 + d * 3000 + n * 3000, p0 - d * 3000 + n * 3000], K.SKIN_SH,
             smooth=False)
    for k, e in enumerate(lights):
        sub.fill(e, K.SKIN_LI, jit=4.0, seed=seed + 50 + k)
    for e in shades:
        sub.fill(e, K.SKIN_SH, alpha=180)
    p.clip(H, sub, smooth=False)
    p.outline(H, w=w, seed=seed + 1, breaks=4)
    return H


def eyes(p, xs, y, s, expr, look, seed, bags=1, skin=K.SKIN):
    ex = "blink" if expr in ("blink", "snore", "asleep") else expr
    for i, x in enumerate(xs):
        side = -1 if x < 0 else 1
        if bags:
            kit.bags(p, x, y, s * 0.9, n=bags, seed=seed + i)
        kit.eye(p, x, y, s, ex, look, seed=seed + 10 + i, side=side, skin=skin)


def brows(p, xs, y, s, expr, seed, thick=1.0):
    for i, x in enumerate(xs):
        kit.brow(p, x, y, s, expr if expr not in ("asleep", "snore") else "neutral", side=-1 if x < 0 else 1,
                 seed=seed + i, thick=thick)


def nose(p, N, seed, nostrils=None, tip=None, split_x=8):
    NP = p.fill(N, K.SKIN, jit=1.0, seed=seed)
    sub = Pic()
    ys = np.asarray(N, float)[:, 1]
    sub.fill([[split_x, ys.min() - 40], [split_x + 300, ys.min() - 40], [split_x + 300, ys.max() + 40],
              [split_x + 40, ys.max() + 40]], K.SKIN_SH, smooth=False)
    if tip is not None:
        sub.fill(ell(tip[0], tip[1], tip[2], tip[2] * 0.7, 10), K.SKIN_LI)
    p.clip(NP, sub, smooth=False)
    p.ink(catmull(np.asarray(N, float)[1:-1]), w=3.4, taper=(0.2, 0.2), seed=seed + 1)
    if nostrils:
        dx, ny, r = nostrils
        for sx in (-1, 1):
            p.fill(ell(sx * dx, ny, r * 1.2, r * 0.8, 10), K.MOUTH)
    return NP


def humanoid(seed, torso, legs, head_fn, hips_y, shoulder, head_pivot, arm_kw, arm_z=(3, 2), head_z=4,
             shoulder_r=None):
    """A standard cut-out rig: hips -> legs, torso -> head, arms (upper over the elbow)."""
    r = Rig()
    r.part("hips", None, (0, hips_y), lambda **kw: Pic(), z=0)
    r.part("legs", "hips", (0, 0), legs, z=0)
    r.part("torso", "hips", (0, 0), torso, z=1)
    r.part("head", "torso", head_pivot, head_fn, z=head_z)
    for side, name in ((-1, "L"), (1, "R")):
        up, fo = make_arm(seed + (0 if side < 0 else 50), side=side, **arm_kw)
        r.part("arm" + name, "torso", (side * shoulder[0], shoulder[1]), up, z=arm_z[0])
        r.part("fore" + name, "arm" + name, (0, arm_kw.get("upper", (300,))[0] - 10), fo, z=arm_z[1])
    return r
