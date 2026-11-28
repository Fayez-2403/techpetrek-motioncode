"""The locked palette for Feed ka Muqabla: a night mehfil. Indigo night, ivory marble, warm skin, lantern gold, and the two
parties' colours (saffron = Party Bhejo / push, emerald = Party Maango / pull) + ink. Shadows go toward indigo, lit toward ivory."""

def hx(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def mix(a, b, t):
    return tuple(int(round(a[i] * (1 - t) + b[i] * t)) for i in range(3))


COBALT = hx("2f3b8f")      # indigo-lapis night
SKIN = hx("d98a55")        # warm tan, the whole cast
SKIN_SH = hx("b0623a")
SKIN_LI = hx("f0b07f")
CREAM = hx("f4ead6")       # ivory marble
GOLD = hx("e7ad3b")        # lantern gold / brass
RED = hx("e0612a")         # saffron: Party Bhejo (push)
GREEN = hx("1d8c6e")       # emerald: Party Maango (pull)
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
GREEN_SH = mix(GREEN, COBALT, 0.35)
GREEN_LI = mix(GREEN, CREAM, 0.45)
GREEN_D = mix(GREEN, INK, 0.4)
RED_D = mix(RED, INK, 0.35)
NIGHT = mix(COBALT, INK, 0.45)            # the sky behind the arches
MARBLE_SH = mix(CREAM, COBALT, 0.22)
