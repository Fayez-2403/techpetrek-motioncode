"""Independent 2D truss solver (numpy, direct stiffness), written separately from the TypeScript solver so the two
can check each other. SI units. Supports: 'pin' fixes ux, uy; 'roller' fixes uy. Axial force + = tension."""
import numpy as np


def solve_truss(model: dict) -> dict:
    nodes, members, E = model["nodes"], model["members"], model["material"]["E"]
    index = {n["id"]: i for i, n in enumerate(nodes)}
    xy = np.array([[n["x"], n["y"]] for n in nodes], dtype=float)
    ndof = 2 * len(nodes)
    K = np.zeros((ndof, ndof))
    F = np.zeros(ndof)
    geo = []
    for m in members:
        i, j = index[m["a"]], index[m["b"]]
        d = xy[j] - xy[i]
        L = float(np.hypot(*d))
        c, s = d / L
        T = np.array([-c, -s, c, s])
        k = E * m["A"] / L
        dofs = [2 * i, 2 * i + 1, 2 * j, 2 * j + 1]
        K[np.ix_(dofs, dofs)] += k * np.outer(T, T)
        geo.append((m["id"], dofs, T, k, L))
    for load in model["loads"]:
        i = index[load["node"]]
        F[2 * i] += load["fx"]
        F[2 * i + 1] += load["fy"]
    fixed = []
    for i, n in enumerate(nodes):
        if n["support"] == "pin":
            fixed += [2 * i, 2 * i + 1]
        elif n["support"] == "roller":
            fixed += [2 * i + 1]
    free = [d for d in range(ndof) if d not in fixed]
    Kff = K[np.ix_(free, free)]
    if np.linalg.matrix_rank(Kff) < len(free):
        return {"status": "unstable"}
    u = np.zeros(ndof)
    u[free] = np.linalg.solve(Kff, F[free])
    R = K @ u - F
    return {
        "status": "solved",
        "nodes": {n["id"]: (u[2 * i], u[2 * i + 1]) for i, n in enumerate(nodes)},
        "axial": {mid: k * float(T @ u[dofs]) for mid, dofs, T, k, L in geo},
        "reactions": {nodes[d // 2]["id"] + ("/rx" if d % 2 == 0 else "/ry"): R[d] for d in fixed},
        "condition": float(np.linalg.cond(Kff)),
    }
