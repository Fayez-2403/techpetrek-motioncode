// A postable 9:16 stream clip (the classic clipper layout): the streamer's facecam enlarged on top, the gameplay
// centre below, word-by-word captions on the seam, our hook line on top, a quiet credit. 1.0x, original audio.
// Source: KreekCraft's GTA 6 live (1280x720): green-screen facecam top-left (head box x 0-300, y 45-223); gameplay crop
// x 290-980, y 70-677 (clear of the cam, chat, minimap and mission pop-ups). The campaign's required @KreekCraft overlay
// (public/brand/kreekcraft_overlay.png) stays on screen for the whole clip.
import React from 'react';
import { AbsoluteFill, Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';

export type ClipProps = { id: string; hook: string; words: { w: string; t0: number; t1: number }[]; dur: number; bounds?: number[]; marks?: { t: number; text: string }[]; replay?: { from: number; to: number; src: number }[] };
const SRC = { w: 1280, h: 720 }, CAM = { x: 0, y: 70, w: 429, h: 270 }, GAME = { x: 290, y: 70, w: 690, h: 607 };
const TOP = 360, CAMH = 1080 * (CAM.h / CAM.w), GAMEY = TOP + CAMH, GAMEH = 1920 - GAMEY;
const F = { d: 'Archivo, Inter, sans-serif', m: '"JetBrains Mono", monospace' };
const clamp = (x: number) => Math.min(1, Math.max(0, x));

/** a window onto the source video: shows source box `b` scaled into a w x h box */
const Window: React.FC<{ src: string; b: { x: number; y: number; w: number; h: number }; w: number; h: number; top: number; dim?: number; startFrom?: number }> = ({ src, b, w, h, top, dim = 1, startFrom }) => {
  const k = Math.max(w / b.w, h / b.h), vw = SRC.w * k, vh = SRC.h * k;
  const ox = -b.x * k - (b.w * k - w) / 2, oy = -b.y * k - (b.h * k - h) / 2;
  return (
    <div style={{ position: 'absolute', left: 0, top, width: w, height: h, overflow: 'hidden' }}>
      <OffthreadVideo src={src} muted={startFrom !== undefined} startFrom={startFrom} style={{ position: 'absolute', left: ox, top: oy, width: vw, height: vh, filter: dim < 1 ? `brightness(${dim})` : undefined }} />
    </div>
  );
};

export const Clip: React.FC<ClipProps> = ({ id, hook, words, bounds = [], marks = [], replay = [] }) => {
  const f = useCurrentFrame(), { fps } = useVideoConfig(), t = f / fps, src = staticFile(`clips/${id}.mp4`);
  const cur = words.findIndex((x) => t >= x.t0 - 0.04 && t < x.t1 + 0.25);
  const w = cur >= 0 ? words[cur] : null, k0 = cur >= 0 ? Math.floor(cur / 3) * 3 : 0, burst = cur >= 0 ? words.slice(k0, k0 + 3) : [];
  const hookIn = clamp(t / 0.25);
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      {/* the top band: a blurred copy of the gameplay behind the hook */}
      <div style={{ position: 'absolute', left: 0, top: 0, width: 1080, height: TOP, overflow: 'hidden', filter: 'blur(24px)' }}>
        <Window src={src} b={GAME} w={1080} h={TOP + 200} top={-100} dim={0.45} />
      </div>
      <Window src={src} b={CAM} w={1080} h={CAMH} top={TOP} />
      {/* gameplay: live, except during an instant replay (a re-run of the real moment while the facecam stays live) */}
      {(() => { const r = replay.find((x) => t >= x.from && t < x.to);
        return r ? (
          <Sequence from={Math.round(r.from * fps)} durationInFrames={Math.round((r.to - r.from) * fps)} layout="none">
            <Window src={src} b={GAME} w={1080} h={GAMEH} top={GAMEY} startFrom={Math.round(r.src * fps)} />
            <div style={{ position: 'absolute', right: 24, top: GAMEY + GAMEH - 150, padding: '6px 14px', borderRadius: 8, background: '#ff2d55', color: '#fff', fontFamily: F.d, fontWeight: 900, fontSize: 34 }}>● REPLAY</div>
          </Sequence>
        ) : <Window src={src} b={GAME} w={1080} h={GAMEH} top={GAMEY} />; })()}
      <div style={{ position: 'absolute', left: 0, right: 0, top: GAMEY - 3, height: 6, background: '#ff2d55' }} />
      <div style={{ position: 'absolute', left: 30, right: 30, top: 28, textAlign: 'center', opacity: hookIn, transform: `scale(${1.25 - 0.25 * hookIn})` }}>
        <span style={{ display: 'inline-block', padding: '14px 26px', borderRadius: 18, background: '#fff', color: '#000', fontFamily: F.d, fontWeight: 900, fontStretch: '78%', fontSize: 50, lineHeight: 1.05, boxShadow: '0 10px 30px rgba(0,0,0,.5)' }}>{hook}</span>
      </div>
      {burst.length ? (
        <div style={{ position: 'absolute', left: 30, right: 30, top: GAMEY + 30, textAlign: 'center' }}>
          {burst.map((x, i) => {
            const on = t >= x.t0 - 0.03, now = w === x;
            return <span key={i} style={{ display: 'inline-block', margin: '0 10px', fontFamily: F.d, fontWeight: 900, fontStretch: '84%', fontSize: 84, lineHeight: 1.1, textTransform: 'uppercase',
              color: now ? '#ffe600' : on ? '#fff' : 'rgba(255,255,255,.45)', WebkitTextStroke: '3px #000', textShadow: '0 6px 0 #000', transform: `scale(${now ? 1.1 : 1})` }}>{x.w}</span>;
          })}
        </div>
      ) : null}
      {marks.map((m, i) => { const a = t - m.t; if (a < 0 || a > 1.4) return null; const u = clamp(a / 0.15) * clamp((1.4 - a) / 0.2);
        return <div key={i} style={{ position: 'absolute', left: 0, right: 0, top: GAMEY + GAMEH / 2 - 70, textAlign: 'center', opacity: u }}><span style={{ display: 'inline-block', padding: '16px 34px', borderRadius: 14, background: '#ffe600', color: '#000', fontFamily: F.d, fontWeight: 900, fontSize: 70, transform: `rotate(-2deg) scale(${0.9 + 0.1 * u})` }}>{m.text}</span></div>; })}
      {bounds.slice(1).map((b, i) => { const a = t - b; return a >= 0 && a < 0.16 ? <AbsoluteFill key={`j${i}`} style={{ background: '#fff', opacity: 0.1 * (1 - a / 0.16) }} /> : null; })}
      <Img src={staticFile('brand/kreekcraft_overlay.png')} style={{ position: 'absolute', left: (1080 - 660) / 2, top: 214, width: 660 }} />
    </AbsoluteFill>
  );
};
