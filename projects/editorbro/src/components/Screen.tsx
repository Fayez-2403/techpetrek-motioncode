// v3: the billboard is a 9:16 LED screen. ScreenMap paints any 1080x1920 content onto the screen's four corners as
// captured from the Three.js world (web/ capture --corners), with a perspective (homography) matrix3d. The LED overlay
// (pixel grid + glow) makes it read as a lit screen. Also the three things the screen shows.
import React from 'react';
import { AbsoluteFill } from 'remotion';
import { Gold, Land, Typed } from './Type';
import { clamp, easeOutQuint, invLerp } from '../animation/anim';
import { C, FONT } from '../themes/tokens';

type Pt = number[];
/** matrix3d that maps the 0..w x 0..h box onto the quad (TL, TR, BR, BL) */
export function quadMatrix(q: Pt[], w = 1080, h = 1920) {
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = q;
  const dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3, dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3;
  const den = dx1 * dy2 - dx2 * dy1 || 1e-9;
  const g = (dx3 * dy2 - dx2 * dy3) / den, hh = (dx1 * dy3 - dx3 * dy1) / den;
  const a = x1 - x0 + g * x1, b = x3 - x0 + hh * x3, d = y1 - y0 + g * y1, e = y3 - y0 + hh * y3;
  return `matrix3d(${a / w},${d / w},0,${g / w},${b / h},${e / h},0,${hh / h},0,0,1,0,${x0},${y0},0,1)`;
}

export const ScreenMap: React.FC<{ quad: Pt[]; glow?: number; children: React.ReactNode }> = ({ quad, glow = 1, children }) => (
  <AbsoluteFill style={{ pointerEvents: 'none' }}>
    <div style={{ position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, transformOrigin: '0 0', transform: quadMatrix(quad), overflow: 'hidden' }}>
      {children}
      <AbsoluteFill style={{ backgroundImage: 'radial-gradient(rgba(0,0,0,0.45) 1.1px, transparent 1.3px)', backgroundSize: '6px 6px', opacity: 0.55 }} />
      <AbsoluteFill style={{ boxShadow: `inset 0 0 120px rgba(31,229,200,${0.18 * glow})`, background: 'linear-gradient(160deg, rgba(255,255,255,0.08), transparent 35%)' }} />
    </div>
  </AbsoluteFill>
);

/** the LED ad the screen plays while we drive toward it */
export const WelcomeScreen: React.FC<{ T: number }> = ({ T }) => {
  const pulse = 0.5 + 0.5 * Math.sin(T * 6);
  return (
    <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 40%, #0f3a3a, #041214 70%)', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
      <div style={{ position: 'absolute', top: 220, fontFamily: FONT.mono, fontSize: 52, letterSpacing: 14, color: C.teal }}>NOW SHOWING</div>
      <div style={{ fontFamily: FONT.brand, fontStyle: 'italic', fontSize: 90, color: C.ink, marginBottom: 20 }}>welcome to</div>
      <Gold size={250}>Editor</Gold>
      <Gold size={250} style={{ marginTop: -10 }}>Bro</Gold>
      <div style={{ marginTop: 60, fontFamily: FONT.display, fontStretch: '80%', fontWeight: 800, fontSize: 64, color: C.ink, letterSpacing: 4 }}>PROMPT · BUILD · RENDER</div>
      <div style={{ position: 'absolute', bottom: 200, width: 40, height: 40, borderRadius: 20, background: '#FF3B30', opacity: 0.5 + 0.5 * pulse, boxShadow: '0 0 40px #FF3B30' }} />
    </AbsoluteFill>
  );
};

const CODE = ['const BB = { x: 15, z: -105, w: 6, h: 10.67 };', 'camera.position.lerp(FILL_POS, e);', 'screenFace.localToWorld(corner).project(camera);',
  'renderer.render(scene, camera);', 'const sky = new THREE.ShaderMaterial({ ... });', 'world.render(t)   // pure function of t',
  'place(1400, () => [10 + rnd() * 60, 0, ...]);', 'composer.addPass(new UnrealBloomPass(...));'];

/** "100% CODE": first on the screen, then full-frame once the dive fills it. Times are the v3 voice's. */
export const FlipContent: React.FC<{ T: number; code: number; camera: number }> = ({ T, code, camera }) => {
  return (
    <AbsoluteFill style={{ background: '#030607', overflow: 'hidden' }}>
      {CODE.map((l, i) => (
        <div key={l} style={{ position: 'absolute', left: 60, top: ((i * 240 + T * 140) % 1920) - 40, fontFamily: FONT.mono, fontSize: 30, color: C.teal, opacity: 0.22, whiteSpace: 'nowrap' }}>{l}</div>
      ))}
      <Land T={T} at={code - 0.8} style={{ position: 'absolute', top: 520, left: 0, right: 0, textAlign: 'center' }}>
        <div style={{ fontFamily: FONT.brand, fontWeight: 900, fontSize: 250, lineHeight: 0.9, color: C.teal, textShadow: `0 0 40px ${C.teal}99` }}>100%</div>
      </Land>
      <Land T={T} at={code - 0.08} from={1.4} style={{ position: 'absolute', top: 760, left: 0, right: 0, textAlign: 'center' }}>
        <Gold size={220}>CODE</Gold>
      </Land>
      <Land T={T} at={code + 0.24} from={1.08} style={{ position: 'absolute', top: 1010, left: 0, right: 0, textAlign: 'center', fontFamily: FONT.brand, fontStyle: 'italic', fontSize: 60, color: C.ink }}>
        rendered, not filmed.
      </Land>
      {T >= camera - 0.1 ? (
        <div style={{ position: 'absolute', top: 1130, left: 0, right: 0, textAlign: 'center', fontSize: 46 }}>
          <span style={{ padding: '12px 26px', borderRadius: 14, background: 'rgba(0,0,0,0.75)', border: `1.5px solid ${C.teal}55` }}>
            <Typed T={T} t0={camera} text="const cameraFrames = 0;" cps={22} color={C.teal} />
          </span>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

/** the outro card: BUILD YOUR OWN. `comment` = when "Comment EDITOR" lands. */
export const BuildCard: React.FC<{ T: number; at: number; comment: number }> = ({ T, at, comment }) => (
  <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 42%, #2a2008, #070604 72%)', alignItems: 'center', textAlign: 'center' }}>
    <Land T={T} at={at} from={1.35} style={{ position: 'absolute', top: 300, left: 0, right: 0 }}>
      <div style={{ fontFamily: FONT.display, fontStretch: '70%', fontWeight: 900, fontSize: 230, lineHeight: 0.86, color: C.ink, letterSpacing: -4 }}>BUILD<br />YOUR<br /><span style={{ color: C.gold }}>OWN</span></div>
    </Land>
    <Land T={T} at={at + 0.25} style={{ position: 'absolute', top: 1000, left: 0, right: 0 }}>
      <div style={{ fontFamily: FONT.ui, fontWeight: 700, fontSize: 54, color: C.ink2 }}>studio, with</div>
      <Gold size={170}>EditorBro</Gold>
      <div style={{ fontFamily: FONT.mono, fontSize: 40, color: C.ink, marginTop: 14 }}>github.com/Fayez-2403/EditorBro</div>
    </Land>
    {T >= comment ? (
      <div style={{ position: 'absolute', top: 1440, left: 0, right: 0, opacity: clamp((T - comment) * 6), transform: `scale(${1.3 - 0.3 * easeOutQuint(invLerp(comment, comment + 0.35, T))})` }}>
        <span style={{ display: 'inline-block', padding: '18px 40px', borderRadius: 24, background: C.gold, color: C.brown, fontFamily: FONT.display, fontStretch: '80%', fontWeight: 900, fontSize: 84 }}>COMMENT “EDITOR”</span>
      </div>
    ) : null}
  </AbsoluteFill>
);
