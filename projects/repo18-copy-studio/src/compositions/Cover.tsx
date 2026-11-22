// Cover (1080x1920): the finished ball (all 18 upgrades) with the headline inside the 3:4 crop.
import React from 'react';
import { AbsoluteFill, Img, staticFile } from 'remotion';
import { Stage, SW } from '../ball/Stage';

export const Cover: React.FC = () => (
  <AbsoluteFill style={{ background: '#06080d' }}>
    <div style={{ position: 'absolute', left: 0, top: 560, width: SW, height: 860, transform: `scale(${1080 / SW})`, transformOrigin: '0 0' }}><Stage t={12.42} L={18} a={9} /></div>
    <div style={{ position: 'absolute', left: 60, right: 60, top: 280, textAlign: 'center', fontFamily: 'Archivo', fontWeight: 900, fontStretch: '72%', fontSize: 132, lineHeight: 0.92, color: '#fff', textShadow: '0 8px 0 #000' }}>1 BALL<br /><span style={{ color: '#ffcf5a' }}>18 REPOS</span></div>
    <Img src={staticFile('brand/techpe-trek.jpg')} style={{ position: 'absolute', right: 90, bottom: 300, width: 130, height: 130, borderRadius: 24, opacity: 0.75 }} />
  </AbsoluteFill>
);
