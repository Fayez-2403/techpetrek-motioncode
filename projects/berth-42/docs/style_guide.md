# Style guide: Berth 42: Ek Seat, Do Ticket

ONE world for this reel; never the previous reel's look (master studio §6, motionmaxxing world rules).
Copy the final tokens into `src/themes/tokens.ts`.

## Reference analysis (if a reference was given)
| Field | Notes |
|---|---|
| Palette (hex) | |
| Typography (family, width, weight, scale) | |
| Composition (where the eye goes first) | |
| Pacing (s between meaningful changes) | |
| Motion (snap, glide, overshoot, cut, hold) | |
| Texture | |

**DO NOT COPY:** logos, copy, subjects.

## Palette
| Role | Hex | Use |
|---|---|---|
| base | | ground |
| text | | |
| accent | | keywords, hero |
| accent 2 | | rare |

## Type
| Role | Face |
|---|---|
| Display | |
| UI | Inter |
| Mono | JetBrains Mono |

All are OFL fonts, in public/fonts.

## Material, light, camera, lens
| Field | Notes |
|---|---|
| Material | |
| Lighting (key, fill, rim, screen glow) | |
| Camera grammar | |
| Lens / depth / blur | |

## Motion classes (scripts/motion.py numbers)
| Class | Curve | Overshoot |
|---|---|---|
| micro UI | spring 3 Hz / 0.7 | ~1.05 |
| panels | spring 2 Hz / 0.8 | ~1.02 |
| props | spring 2.4 Hz / 0.6 | ~1.1 |
| mascot | spring 2 Hz / 0.5 | ~1.16 |
| camera | quintic, almost invisible | none |
| headlines | land fast, hold to read | none |

## Banned here
- generic glow on everything
- endless gradients
- random particle storms
- one transition everywhere
- centred text on a gradient
- meaningless UI
- tiny corner text
- distorted marks
- fake data
- unplanned jitter

## Berth 42 ink-cel kit (v1, 2026-11-27)

The method is in `docs/KT_ink_cel_style.md`. The code:

| File | What it holds |
|---|---|
| `ink/core.py` | pen polygons; `LINE_SCALE` = 0.75 |
| `ink/kit.py` | eyes, mouths with every tooth, hands, ticks, pores, dash rows, stripes, plaid, wood, sparkle, moon, hand-lettered digits, ticket |
| `ink/face.py` | shared head builder and rig |
| `ink/figure.py` | limbs, rig, two-bone IK |
| `ink/finish.py` | the old-cartoon pass |
| `ink/palette.py` | the 5 locked colours; everything else is derived from them |
| `ink/text.py` | signage lettering only: Archivo, with the variation axes in [Weight, Width] order |

**Sets** (each one `build(t)`, a pure function of t):
- `sets/compartment.py` (night)
- `sets/office.py` (10 AM)
- `sets/platform.py` (day)
