// The quote reel's own set: a dark office and one laptop (CSS 3D). The lid opens around its hinge, the screen's light
// spills onto the desk, and whatever the scene passes as `screen` is drawn on the panel. Pure function of its props.
import React from 'react';
import { AbsoluteFill } from 'remotion';

export const LaptopRoom: React.FC<{ lid: number; power: number; zoom: number; screen: React.ReactNode; glow?: string }> = ({ lid, power, zoom, screen, glow = '31,229,200' }) => {
  const W = 840, D = 540, H = 520;                   // lid width, base depth, lid height (px)
  const angle = 90 - 100 * lid;                      // 90 = shut on the base, -10 = open and leaning back
  return (
    <AbsoluteFill style={{ background: 'linear-gradient(180deg, #0a0d11 0%, #06080a 55%, #030304 100%)', overflow: 'hidden' }}>
      {/* office: window light, ceiling strips */}
      <div style={{ position: 'absolute', left: 120, right: 120, top: 560, height: 260, background: 'linear-gradient(180deg, rgba(120,150,190,0.16), rgba(120,150,190,0.04))', filter: 'blur(6px)' }} />
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ position: 'absolute', left: -100 + i * 420, top: 40 + i * 30, width: 600, height: 5, background: 'rgba(230,240,255,0.5)', transform: 'rotate(-14deg)', filter: 'blur(1.5px)' }} />
      ))}
      {/* desk */}
      <div style={{ position: 'absolute', left: -200, right: -200, top: 1120, bottom: -100, transform: 'perspective(1200px) rotateX(64deg)', transformOrigin: '50% 0%',
        background: `radial-gradient(ellipse 560px 380px at 50% 18%, rgba(${glow},${0.32 * power}), transparent 70%), linear-gradient(180deg, #1a140f, #0b0907)` }} />
      {/* the laptop */}
      <AbsoluteFill style={{ perspective: 1700, perspectiveOrigin: '540px 700px', transform: `scale(${zoom})`, transformOrigin: '540px 1000px' }}>
        <div style={{ position: 'absolute', left: 540 - W / 2, top: 1130, width: W, height: 0, transformStyle: 'preserve-3d', transform: 'rotateX(-16deg)' }}>
          {/* base, lying flat toward the viewer */}
          <div style={{ position: 'absolute', left: 0, top: 0, width: W, height: D, transformOrigin: '50% 0%', transform: 'rotateX(90deg)', borderRadius: 26,
            background: 'linear-gradient(180deg, #2b2e33, #17191c)', boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.06)' }}>
            <div style={{ position: 'absolute', left: 60, right: 60, top: 40, height: 300, borderRadius: 12,
              background: `repeating-linear-gradient(90deg, #0d0e10 0 52px, rgba(${glow},${0.35 * power}) 52px 58px), repeating-linear-gradient(180deg, #0d0e10 0 46px, rgba(${glow},${0.35 * power}) 46px 52px)`, opacity: 0.95 }} />
            <div style={{ position: 'absolute', left: W / 2 - 150, top: 370, width: 300, height: 140, borderRadius: 14, background: '#1f2226' }} />
          </div>
          {/* lid: back shell + screen, hinged at the base's back edge */}
          <div style={{ position: 'absolute', left: 0, top: -H, width: W, height: H, transformStyle: 'preserve-3d', transformOrigin: '50% 100%', transform: `rotateX(${angle}deg)` }}>
            <div style={{ position: 'absolute', inset: 0, borderRadius: 26, background: 'linear-gradient(160deg, #3a3e45, #1c1e22)', transform: 'rotateY(180deg)', backfaceVisibility: 'hidden' }} />
            <div style={{ position: 'absolute', inset: 0, borderRadius: 26, background: '#0b0c0e', padding: 18, backfaceVisibility: 'hidden', borderTop: '2px solid rgba(255,255,255,0.22)', borderLeft: '1px solid rgba(255,255,255,0.1)',
              boxShadow: `0 0 ${200 * power}px ${50 * power}px rgba(${glow},${0.3 * power})` }}>
              <div style={{ width: '100%', height: '100%', borderRadius: 12, overflow: 'hidden', position: 'relative', background: '#000' }}>
                <div style={{ position: 'absolute', inset: 0, opacity: power }}>{screen}</div>
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(130deg, rgba(255,255,255,0.08), transparent 40%)' }} />
              </div>
            </div>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
