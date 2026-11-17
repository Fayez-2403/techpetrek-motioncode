"""Closed-form simply supported beam (superposition of a uniform load and point loads), used to check the TypeScript
beam FE. Euler–Bernoulli, linear elastic, small deflection. Loads +up, deflection +up."""
import numpy as np


def deflection(model: dict, x: np.ndarray) -> np.ndarray:
    L, EI, q = model["L"], model["E"] * model["I"], model["q"]
    # uniform load q (+up): v = q x (L³ - 2 L x² + x³) / (24 EI)
    v = q * x * (L**3 - 2 * L * x**2 + x**3) / (24 * EI)
    for p in model["points"]:
        a, P = p["x"], p["fy"]
        b = L - a
        left = P * b * x * (L**2 - b**2 - x**2) / (6 * L * EI)
        xr = L - x
        right = P * a * xr * (L**2 - a**2 - xr**2) / (6 * L * EI)
        v = v + np.where(x <= a, left, right)
    return v


def reactions(model: dict) -> tuple[float, float]:
    L, q = model["L"], model["q"]
    ra = -q * L / 2 - sum(p["fy"] * (L - p["x"]) / L for p in model["points"])
    rb = -q * L / 2 - sum(p["fy"] * p["x"] / L for p in model["points"])
    return ra, rb
