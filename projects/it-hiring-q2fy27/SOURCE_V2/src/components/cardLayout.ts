// CASE FILE card geometry for the 9:16 frame (px). Shared by the 2D card (CardLayer) and the 3D board's card textures
// (CaseBoard), so the 3D card that flies to camera lands exactly where the 2D card takes over. Everything readable stays
// inside y 260..1500 (Instagram UI above / below).
export const CARD = {
  w: 1080, h: 1920,
  dash: { x: 64, y: 272, w: 64, h: 7 },
  counter: { right: 1016, y: 262, size: 30 },                // "02 / 08"
  numeral: { x: 56, y: 318, size: 168 },                      // serif "01"
  kicker: { x: 250, y: 336, size: 26, icon: 34 },             // mono context line with an icon disc
  headline: { x: 250, y: 384, w: 770, size: 86, lh: 0.94, maxLines: 3 },
  body: { x: 64, y: 664, w: 952, size: 40, lh: 1.22, maxLines: 3 },
  media: { x: 64, y: 828, w: 952, h: 488, r: 18 },
  footnote: { x: 64, y: 1326, size: 21 },
  chips: { x: 64, y: 1362, h: 70, gap: 16, label: 20, value: 32 },
  caption: { y: 1444, h: 56, size: 44 },                      // one punch line per beat (Roman Hinglish)
} as const;

/** 4:5 carousel slide (1080x1350): same parts, re-spaced */
export const CARD45 = {
  w: 1080, h: 1350,
  dash: { x: 64, y: 70, w: 64, h: 7 },
  counter: { right: 1016, y: 60, size: 30 },
  numeral: { x: 56, y: 116, size: 150 },
  kicker: { x: 240, y: 128, size: 24, icon: 32 },
  headline: { x: 240, y: 170, w: 780, size: 78, lh: 0.94, maxLines: 2 },
  body: { x: 64, y: 360, w: 952, size: 34, lh: 1.24, maxLines: 3 },
  media: { x: 64, y: 500, w: 952, h: 590, r: 18 },
  footnote: { x: 64, y: 1104, size: 19 },
  chips: { x: 64, y: 1140, h: 66, gap: 16, label: 19, value: 30 },
  caption: { y: 1230, h: 0, size: 0 },
} as const;
