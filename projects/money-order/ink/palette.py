"""The locked palette for Ek Baar Bheja, Do Baar Kata (a new palette per story): 5 colours + ink. Every other tone is derived from these (shadow = toward cobalt,
lit = toward cream), so the film never gains a sixth colour."""

def hx(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def mix(a, b, t):
    return tuple(int(round(a[i] * (1 - t) + b[i] * t)) for i in range(3))


COBALT = hx("5a67c8")      # periwinkle (this story)
SKIN = hx("ec7a92")        # hot pink, the whole cast
SKIN_SH = hx("c25570")
SKIN_LI = hx("f6a5b8")
CREAM = hx("f1e4cf")
GOLD = hx("c8a24c")        # khaki
RED = hx("cf3b2f")         # post-box red
INK = hx("170b08")
FINE = hx("4d140a")

# derived tones (all from the five)
LILAC = mix(CREAM, COBALT, 0.16)          # eye whites, shock discs
COBALT_D = mix(COBALT, INK, 0.35)         # deep night shadow
COBALT_L = mix(COBALT, CREAM, 0.45)       # pale day sky / haze
CREAM_SH = mix(CREAM, COBALT, 0.30)       # cream in shade (blue-violet)
GOLD_SH = mix(GOLD, COBALT, 0.35)
GOLD_LI = mix(GOLD, CREAM, 0.55)
RED_SH = mix(RED, COBALT, 0.35)
RED_LI = mix(RED, SKIN_LI, 0.35)
SKIN_NIGHT = mix(SKIN, COBALT, 0.10)       # salmon lit surface at night (pink)
MOUTH = mix(RED, INK, 0.55)               # dark mouth interior
TONGUE = mix(RED, SKIN, 0.45)
TEETH = mix(CREAM, GOLD, 0.08)
HAIR = INK
