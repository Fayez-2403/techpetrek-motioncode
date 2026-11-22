// A postable 9:16 stream clip (the classic clipper layout): the streamer's facecam enlarged on top, the gameplay
// centre below, word-by-word captions on the seam, our hook line on top, a quiet credit. 1.0x, original audio.
// Source: the IShowSpeed live (1280x720): facecam box x 0-258, y 306-468; gameplay crop x 300-1125 (clear of the cam,
// minimap and chat overlays).
import React from 'react';
import { AbsoluteFill, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';

export type ClipProps = { id: string; hook: string; words: { w: string; t0: number; t1: number }[]; dur: number };
const SRC = { w: 1280, h: 720 }, CAM = { x: 0, y: 306, w: 258, h: 162 }, GAME = { x: 300, y: 0, w: 825, h: 720 };
const TOP = 250, CAMH = 1080 * (CAM.h / CAM.w), GAMEY = TOP + CAMH, GAMEH = 1920 - GAMEY;
const F = { d: 'Archivo, Inter, sans-serif', m: '"JetBrains Mono", monospace' };
const clamp = (x: number) => Math.min(1, Math.max(0, x));

/** a window onto the source video: shows source box `b` scaled into a w x h box */
const Window: React.FC<{ src: string; b: { x: number; y: number; w: number; h: number }; w: number; h: number; top: number; dim?: number }> = ({ src, b, w, h, top, dim = 1 }) => {
  const k = Math.max(w / b.w, h / b.h), vw = SRC.w * k, vh = SRC.h * k;
  const ox = -b.x * k - (b.w * k - w) / 2, oy = -b.y * k - (b.h * k - h) / 2;
  return (
    <div style={{ position: 'absolute', left: 0, top, width: w, height: h, overflow: 'hidden' }}>
      <OffthreadVideo src={src} style={{ position: 'absolute', left: ox, top: oy, width: vw, height: vh, filter: dim < 1 ? `brightness(${dim})` : undefined }} />
    </div>
  );
};

export const Clip: React.FC<ClipProps> = ({ id, hook, words }) => {
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
      <Window src={src} b={GAME} w={1080} h={GAMEH} top={GAMEY} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: GAMEY - 3, height: 6, background: '#ff2d55' }} />
      <div style={{ position: 'absolute', left: 40, right: 40, top: 60, textAlign: 'center', opacity: hookIn, transform: `scale(${1.25 - 0.25 * hookIn})` }}>
        <span style={{ display: 'inline-block', padding: '14px 26px', borderRadius: 18, background: '#fff', color: '#000', fontFamily: F.d, fontWeight: 900, fontStretch: '82%', fontSize: 62, lineHeight: 1.05, boxShadow: '0 10px 30px rgba(0,0,0,.5)' }}>{hook}</span>
      </div>
      {burst.length ? (
        <div style={{ position: 'absolute', left: 30, right: 30, top: GAMEY + 40, textAlign: 'center' }}>
          {burst.map((x, i) => {
            const on = t >= x.t0 - 0.03, now = w === x;
            return <span key={i} style={{ display: 'inline-block', margin: '0 10px', fontFamily: F.d, fontWeight: 900, fontStretch: '84%', fontSize: 84, lineHeight: 1.1, textTransform: 'uppercase',
              color: now ? '#ffe600' : on ? '#fff' : 'rgba(255,255,255,.45)', WebkitTextStroke: '3px #000', textShadow: '0 6px 0 #000', transform: `scale(${now ? 1.1 : 1})` }}>{x.w}</span>;
          })}
        </div>
      ) : null}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 182, textAlign: 'center', color: 'rgba(255,255,255,.75)', fontFamily: F.m, fontSize: 24 }}>@IShowSpeed · YouTube live · GTA VI © Rockstar Games</div>
    </AbsoluteFill>
  );
};
