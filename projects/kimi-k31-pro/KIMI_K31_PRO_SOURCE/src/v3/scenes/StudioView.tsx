// V3 · 3D · BLENDER-STYLE VIEWPORT (3 bars). A generic 3D modelling app with our own dark styling (no real app's logo
// or branding): viewport with grid, axis gizmo, outliner, modifier stack and timeline. On the beat grid the default
// cube is subdivided (Ctrl 1, Ctrl 2), sculpted into a fuselage, gets a pod that the Mirror modifier flips across, a
// canopy and a fin (Bevel), then the shading switches from clay to rendered on bar 3 (the wow) and the thrusters
// light when Play is pressed. Cursor, selection outlines and key chips are deterministic.
import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import * as THREE from 'three';
import { clamp, dampedSpring, easeInOutCubic, easeOutCubic, invLerp, keys, lerp, reveal } from '../../lib/anim';
import { CamRig, Env, ThreeStage, orbit, project, type V3 } from '../../three/stage';
import { F } from '../../styles/typography';
import { Cursor, cursorAt, type CursorKey } from '../components/BrowserFrame';
import { GLOW, Racer, RenderWorld, StudioGrid, useRacerAssets, type RacerState } from '../three/StudioRacer';
import { beatAt, V3Tag, type V3Props } from '../lib';

// ------------------------------------------------------------------------------------------------ layout + palette
const U = { app: '#131518', panel: '#1B1D21', panel2: '#212429', head: '#272A30', field: '#121417', line: '#0B0C0E', text: '#D3D7DE', mute: '#858C98', faint: '#596070', blue: '#4C82E6', blueSoft: 'rgba(76,130,230,0.30)', sel: '#FF9B3D' };
const TOPH = 40, VY = 80, VW = 1290, VH = 790, RX = 1290, RW = 1920 - RX;
const OUT_Y = 40, OUT_H = 344, PROP_Y = 384, PROP_H = 486, TL_Y = 870, ST_Y = 1046;
const D2R = Math.PI / 180;
const SHADE_X = [1150, 1182, 1214, 1246];      // viewport header shading buttons (wire, clay, material, rendered)
const ADD_MOD: [number, number] = [1440, 446];  // "Add Modifier" button
const PLAY: [number, number] = [790, 888];      // timeline play button

function camAt(f: number) {
  const yaw = (f < 120 ? lerp(32, 62, f / 120) : 62 - 88 * easeOutCubic(invLerp(120, 200, f))) * D2R;
  const pitch = keys(f, [[0, 17], [60, 14], [120, 13], [180, 7]]) * D2R;
  const r = keys(f, [[0, 6.6], [44, 6.9], [62, 8.7], [120, 9.2], [180, 7.7]]);
  const target: V3 = [0.15, keys(f, [[0, 0.86], [180, 0.98]]), 0];
  return { pos: orbit(target, r, yaw, pitch), target, fov: 30, shiftX: 0.1 };
}

// ------------------------------------------------------------------------------------------------ small UI atoms
const Ic: React.FC<{ d: string; c?: string; s?: number; w?: number; fill?: string }> = ({ d, c = U.mute, s = 20, w = 1.8, fill = 'none' }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill={fill} stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }}><path d={d} /></svg>
);
const I = {
  box: 'M4 7 L12 3 L20 7 L20 17 L12 21 L4 17 Z M4 7 L12 11 L20 7 M12 11 V21',
  cam: 'M3 8 H15 V17 H3 Z M15 11 L21 8 V17 L15 14',
  bulb: 'M12 3 A6 6 0 0 1 16 13.5 V16 H8 V13.5 A6 6 0 0 1 12 3 M9.5 19 H14.5',
  mesh: 'M12 4 L20 19 H4 Z M12 4 L12 19 M8 11.5 L16 11.5',
  wrench: 'M14.5 4 A4.5 4.5 0 0 0 10.4 10.4 L4 16.8 L7.2 20 L13.6 13.6 A4.5 4.5 0 0 0 20 9.5 L17 12 L14 10 L12 7 Z',
  mirror: 'M12 3 V21 M10 6 L4 18 H10 Z M14 6 L20 18 H14 Z',
  eye: 'M2.5 12 C6 6 18 6 21.5 12 C18 18 6 18 2.5 12 Z M12 9.5 A2.5 2.5 0 1 1 12 14.5 A2.5 2.5 0 1 1 12 9.5',
  search: 'M10.5 4 A6.5 6.5 0 1 1 10.5 17 A6.5 6.5 0 1 1 10.5 4 M15.5 15.5 L20 20',
  filter: 'M4 5 H20 L14 12 V19 L10 17 V12 Z',
  sub: 'M4 4 H20 V20 H4 Z M8 8 H16 V16 H8 Z',
  bevel: 'M4 20 V9 L9 4 H20 M8 20 V11 L11 8 H20',
  cube: 'M4 7.5 L12 3.5 L20 7.5 V16.5 L12 20.5 L4 16.5 Z M4 7.5 L12 11.5 L20 7.5 M12 11.5 V20.5',
  move: 'M12 3 V21 M3 12 H21 M12 3 L9.5 5.5 M12 3 L14.5 5.5 M12 21 L9.5 18.5 M12 21 L14.5 18.5 M3 12 L5.5 9.5 M3 12 L5.5 14.5 M21 12 L18.5 9.5 M21 12 L18.5 14.5',
  rot: 'M19 12 A7 7 0 1 1 16 6.2 M19 3.5 V8 H14.5',
  scale: 'M4 20 H11 V13 H4 Z M11 13 L20 4 M14 4 H20 V10',
  select: 'M4 4 H9 M14 4 H20 V9 M20 14 V20 H15 M9 20 H4 V15 M4 9 V4',
  pen: 'M4 20 L5 15 L16 4 L20 8 L9 19 Z',
  ruler: 'M3 16 L16 3 L21 8 L8 21 Z M7 12 L9 14 M10 9 L12 11 M13 6 L15 8',
  globe: 'M12 3 A9 9 0 1 1 12 21 A9 9 0 1 1 12 3 M3 12 H21 M12 3 C8 8 8 16 12 21 C16 16 16 8 12 3',
  layers: 'M12 3 L21 8 L12 13 L3 8 Z M3 12.5 L12 17.5 L21 12.5 M3 16.5 L12 21.5 L21 16.5',
  dots: 'M6 6 h.01 M12 6 h.01 M18 6 h.01 M6 12 h.01 M12 12 h.01 M18 12 h.01 M6 18 h.01 M12 18 h.01 M18 18 h.01',
  link: 'M9 15 L15 9 M10 6 L12 4 A4 4 0 0 1 20 12 L18 14 M14 18 L12 20 A4 4 0 0 1 4 12 L6 10',
  sphere: 'M12 3 A9 9 0 1 1 12 21 A9 9 0 1 1 12 3 M3 12 C8 15 16 15 21 12',
  pin: 'M9 3 H15 L14 9 L17 13 H7 L10 9 Z M12 13 V21',
  close: 'M6 6 L18 18 M18 6 L6 18',
  chevD: 'M6 9 L12 15 L18 9', chevR: 'M9 6 L15 12 L9 18',
  play: 'M7 4 L19 12 L7 20 Z', toStart: 'M6 4 V20 M18 4 L9 12 L18 20 Z', toEnd: 'M18 4 V20 M6 4 L15 12 L6 20 Z', keyPrev: 'M16 5 L9 12 L16 19', keyNext: 'M8 5 L15 12 L8 19',
  monitor: 'M3 5 H21 V16 H3 Z M9 20 H15 M12 16 V20',
  overlay: 'M9 5 A7 7 0 1 1 9 19 A7 7 0 1 1 9 5 M15 5 A7 7 0 1 1 15 19',
  magnet: 'M5 4 V12 A7 7 0 0 0 19 12 V4 H15 V12 A3 3 0 0 1 9 12 V4 Z',
};
const T: React.FC<{ c?: string; s?: number; w?: number; mono?: boolean; children: React.ReactNode; style?: React.CSSProperties }> = ({ c = U.text, s = 18, w = 500, mono, children, style }) => (
  <span style={{ fontFamily: mono ? F.mono : F.text, fontSize: s, fontWeight: w, color: c, whiteSpace: 'pre', lineHeight: 1, ...style }}>{children}</span>
);
const Field: React.FC<{ children: React.ReactNode; w?: number; hi?: number; style?: React.CSSProperties }> = ({ children, w = 220, hi = 0, style }) => (
  <div style={{ width: w, height: 28, borderRadius: 5, background: hi ? `rgba(76,130,230,${0.25 + 0.5 * hi})` : U.field, border: `1px solid ${hi ? U.blue : '#2C3036'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', ...style }}>{children}</div>
);

// ------------------------------------------------------------------------------------------------ panels
const TopBar: React.FC<{ tab: string }> = ({ tab }) => (
  <div style={{ position: 'absolute', left: 0, top: 0, width: 1920, height: TOPH, background: U.app, display: 'flex', alignItems: 'center', gap: 22, padding: '0 14px', boxSizing: 'border-box', borderBottom: `1px solid ${U.line}` }}>
    <svg width={22} height={22} viewBox="0 0 24 24"><path d="M12 2 L21 7 V17 L12 22 L3 17 V7 Z" fill="none" stroke="#7FA6F2" strokeWidth={2} /><path d="M12 7 L16.5 9.5 V14.5 L12 17 L7.5 14.5 V9.5 Z" fill="#7FA6F2" /></svg>
    {['File', 'Edit', 'Render', 'Window', 'Help'].map((m) => <T key={m} s={18}>{m}</T>)}
    <div style={{ marginLeft: 24, display: 'flex', gap: 2 }}>
      {['Layout', 'Modeling', 'Sculpting', 'UV', 'Shading', 'Animation', 'Rendering'].map((m) => (
        <div key={m} style={{ padding: '8px 16px', borderRadius: '6px 6px 0 0', background: m === tab ? U.head : 'transparent', marginTop: 6 }}>
          <T s={18} c={m === tab ? '#fff' : U.mute} w={m === tab ? 600 : 500}>{m}</T>
        </div>
      ))}
    </div>
    <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
      <Field w={190}><T s={16} c={U.mute}>Scene</T></Field>
      <Field w={190}><T s={16} c={U.mute}>Main Layer</T></Field>
    </div>
  </div>
);

const ViewportHeader: React.FC<{ mode: string; shade: number; overlays: boolean }> = ({ mode, shade, overlays }) => (
  <div style={{ position: 'absolute', left: 0, top: TOPH, width: VW, height: VY - TOPH, background: U.head, display: 'flex', alignItems: 'center', boxSizing: 'border-box', padding: '0 12px', gap: 18, borderBottom: `1px solid ${U.line}` }}>
    <Ic d={I.cube} c={U.text} />
    <div style={{ padding: '5px 12px', borderRadius: 5, background: U.field, display: 'flex', gap: 8, alignItems: 'center' }}><T s={17}>{mode}</T><Ic d={I.chevD} s={14} /></div>
    {(mode === 'Sculpt Mode' ? ['View', 'Sculpt', 'Mask', 'Face Sets'] : ['View', 'Select', 'Add', 'Object']).map((m) => <T key={m} s={17}>{m}</T>)}
    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ padding: '5px 10px', borderRadius: 5, background: U.field, display: 'flex', gap: 6, alignItems: 'center' }}><T s={16} c={U.mute}>Global</T><Ic d={I.chevD} s={13} /></div>
      <Ic d={I.magnet} />
      <div style={{ width: 34, height: 28, borderRadius: 5, background: overlays ? U.blueSoft : U.field, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Ic d={I.overlay} c={overlays ? '#E8EEFA' : U.mute} s={18} /></div>
      <div style={{ width: 18 }} />
    </div>
    {/* shading buttons, absolutely placed so the cursor can hit them */}
    {SHADE_X.map((x, i) => (
      <div key={i} style={{ position: 'absolute', left: x, top: 6, width: 30, height: 28, borderRadius: i === 0 ? '5px 0 0 5px' : i === 3 ? '0 5px 5px 0' : 0, background: i === shade ? U.blue : U.field, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width={18} height={18} viewBox="0 0 20 20">
          {i === 0 && <circle cx={10} cy={10} r={7} fill="none" stroke="#DDE3EE" strokeWidth={1.6} />}
          {i === 1 && <circle cx={10} cy={10} r={7} fill="#C9CDD4" />}
          {i === 2 && <><circle cx={10} cy={10} r={7} fill="#8A90A0" /><path d="M3 10 A7 7 0 0 1 10 3 V10 Z M10 17 A7 7 0 0 0 17 10 H10 Z" fill="#DDE1E8" /></>}
          {i === 3 && <><defs><radialGradient id="rg" cx="35%" cy="30%" r="75%"><stop offset="0%" stopColor="#fff" /><stop offset="45%" stopColor="#F0A070" /><stop offset="100%" stopColor="#5A2E4A" /></radialGradient></defs><circle cx={10} cy={10} r={7} fill="url(#rg)" /></>}
        </svg>
      </div>
    ))}
  </div>
);

const ROWS: { name: string; icon: keyof typeof I; c: string; lvl: number; at: number }[] = [
  { name: 'Scene Collection', icon: 'box', c: '#9AA3B2', lvl: 0, at: -1 },
  { name: 'Collection', icon: 'box', c: '#9AA3B2', lvl: 1, at: -1 },
  { name: 'Camera', icon: 'cam', c: '#8FCB7A', lvl: 2, at: -1 },
  { name: 'Light', icon: 'bulb', c: '#E8C25A', lvl: 2, at: -1 },
  { name: 'Body', icon: 'mesh', c: '#F2A65A', lvl: 2, at: -1 },
  { name: 'Pod', icon: 'mesh', c: '#F2A65A', lvl: 2, at: 60 },
  { name: 'Canopy', icon: 'mesh', c: '#F2A65A', lvl: 2, at: 90 },
  { name: 'Fin', icon: 'mesh', c: '#F2A65A', lvl: 2, at: 97 },
];

const Outliner: React.FC<{ f: number; sel: Record<string, number> }> = ({ f, sel }) => {
  let y = 50;
  return (
    <div style={{ position: 'absolute', left: RX, top: OUT_Y, width: RW, height: OUT_H, background: U.panel, borderLeft: `2px solid ${U.line}`, borderBottom: `2px solid ${U.line}`, overflow: 'hidden' }}>
      <div style={{ height: 40, background: U.head, display: 'flex', alignItems: 'center', gap: 12, padding: '0 12px' }}>
        <Ic d={I.layers} c={U.text} />
        <div style={{ flex: 1, height: 26, borderRadius: 13, background: U.field, display: 'flex', alignItems: 'center', gap: 8, padding: '0 10px' }}><Ic d={I.search} s={15} /></div>
        <Ic d={I.filter} /><Ic d={I.box} />
      </div>
      {ROWS.map((r) => {
        const k = r.at < 0 ? 1 : easeOutCubic(invLerp(r.at, r.at + 6, f));
        if (k <= 0) return null;
        const h = 32 * k, top = y; y += h;
        const s = sel[r.name] ?? 0, active = s > 0.99;
        const badge = r.name === 'Body' && f >= 15 ? 'wrench' : r.name === 'Pod' && f >= 75 ? 'mirror' : null;
        return (
          <div key={r.name} style={{ position: 'absolute', left: 0, top, width: RW, height: h, overflow: 'hidden', opacity: k,
            background: s > 0 ? (active ? 'rgba(76,130,230,0.42)' : 'rgba(76,130,230,0.22)') : 'transparent' }}>
            <div style={{ position: 'absolute', left: 14 + r.lvl * 24, top: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
              {r.lvl < 2 ? <Ic d={I.chevD} s={13} /> : <div style={{ width: 13 }} />}
              <Ic d={I[r.icon]} c={r.c} s={18} />
              <T s={18} c={active ? '#FFD2A6' : s > 0 ? '#F0F3F8' : U.text}>{r.name}</T>
              {badge && <Ic d={I[badge]} c="#7FA6F2" s={16} />}
            </div>
            {r.lvl === 2 && <div style={{ position: 'absolute', right: 16, top: 6, display: 'flex', gap: 12 }}><Ic d={I.eye} s={18} /><Ic d={I.monitor} s={18} /></div>}
          </div>
        );
      })}
    </div>
  );
};

type Row = [label: string, value: React.ReactNode];
const ModCard: React.FC<{ name: string; icon: keyof typeof I; open: number; appear: number; flash: number; rows: Row[] }> = ({ name, icon, open, appear, flash, rows }) => {
  const bodyH = (rows.length * 38 + 12) * open;
  return (
    <div style={{ marginBottom: 8 * appear, height: (42 + bodyH) * appear, overflow: 'hidden', opacity: appear, transform: `translateX(${(1 - appear) * 40}px)`,
      borderRadius: 7, background: U.panel2, border: `1px solid ${flash > 0 ? `rgba(76,130,230,${0.35 + 0.65 * flash})` : '#2A2E35'}`, boxShadow: flash > 0 ? `0 0 ${18 * flash}px rgba(76,130,230,${0.5 * flash})` : undefined }}>
      <div style={{ height: 42, display: 'flex', alignItems: 'center', gap: 10, padding: '0 12px', background: U.head }}>
        <Ic d={open > 0.5 ? I.chevD : I.chevR} s={14} />
        <Ic d={I[icon]} c="#7FA6F2" s={19} />
        <T s={20} w={600} c="#EEF1F6">{name}</T>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 12 }}><Ic d={I.monitor} s={17} c="#AEB8CA" /><Ic d={I.cam} s={17} c="#AEB8CA" /><Ic d={I.close} s={15} /></div>
      </div>
      <div style={{ padding: '8px 14px 0 46px' }}>
        {rows.map(([l, v], i) => (
          <div key={i} style={{ height: 38, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 170, textAlign: 'right' }}><T s={17} c={U.mute}>{l}</T></div>
            {v}
          </div>
        ))}
      </div>
    </div>
  );
};
const Num: React.FC<{ v: string; hi?: number; w?: number }> = ({ v, hi = 0, w = 250 }) => <Field w={w} hi={hi}><T s={17} mono c={hi ? '#fff' : U.text}>{v}</T></Field>;
const Toggle: React.FC<{ on: boolean; label?: string }> = ({ on, label }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
    <div style={{ width: 20, height: 20, borderRadius: 4, background: on ? U.blue : U.field, border: `1px solid ${on ? U.blue : '#3A3F47'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {on && <Ic d="M5 12 L10 17 L19 7" c="#fff" s={15} w={2.6} />}
    </div>
    {label && <T s={17}>{label}</T>}
  </div>
);
const Seg: React.FC<{ items: string[]; on: number }> = ({ items, on }) => (
  <div style={{ display: 'flex' }}>{items.map((x, i) => (
    <div key={x} style={{ width: 70, height: 28, background: i === on ? U.blue : U.field, border: '1px solid #2C3036', marginLeft: -1, borderRadius: i === 0 ? '5px 0 0 5px' : i === items.length - 1 ? '0 5px 5px 0' : 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <T s={17} c={i === on ? '#fff' : U.text}>{x}</T></div>))}</div>
);

const PROP_TABS: (keyof typeof I)[] = ['wrench', 'cam', 'monitor', 'layers', 'globe', 'box', 'wrench', 'dots', 'link', 'mesh', 'sphere'];
const Properties: React.FC<{ f: number; level: number }> = ({ f, level }) => {
  const ap = (a: number) => dampedSpring((f - a) / 30, 18, 0.7);
  const open = (a: number, b: number) => (f < b ? reveal(f, a, 6) : 1 - reveal(f, b, 6));
  const fl = (a: number) => (f >= a ? Math.max(0, 1 - (f - a) / 14) : 0);
  const hiLevel = f >= 30 ? Math.max(0, 1 - (f - 30) / 12) : f >= 15 ? Math.max(0, 1 - (f - 15) / 12) : 0;
  return (
    <div style={{ position: 'absolute', left: RX, top: PROP_Y, width: RW, height: PROP_H, background: U.panel, borderLeft: `2px solid ${U.line}`, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: 48, height: PROP_H, background: U.app, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 10, gap: 6 }}>
        {PROP_TABS.map((t, i) => (
          <div key={i} style={{ width: 36, height: 34, borderRadius: 6, background: i === 6 ? U.blueSoft : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Ic d={I[t]} s={19} c={i === 6 ? '#9DBCF7' : U.mute} />
          </div>
        ))}
      </div>
      <div style={{ position: 'absolute', left: 60, top: 0, right: 12 }}>
        <div style={{ height: 44, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Ic d={I.mesh} c="#F2A65A" s={18} /><T s={18} w={600}>Body</T><Ic d={I.chevR} s={14} /><Ic d={I.wrench} c="#7FA6F2" s={17} /><T s={18} c={U.mute}>Modifiers</T>
          <div style={{ marginLeft: 'auto' }}><Ic d={I.pin} s={17} /></div>
        </div>
        <div style={{ height: 38, borderRadius: 6, background: '#2C3038', border: '1px solid #3A3F48', display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px', marginBottom: 12,
          boxShadow: [75, 90].some((a) => f >= a && f < a + 6) ? `0 0 0 2px ${U.blue}` : undefined }}>
          <Ic d={I.wrench} c={U.text} s={17} /><T s={18} w={600}>Add Modifier</T><div style={{ marginLeft: 'auto' }}><Ic d={I.chevD} s={14} /></div>
        </div>
        <ModCard name="Subdivision" icon="sub" appear={ap(15)} open={open(15, 75)} flash={fl(15)}
          rows={[['Levels Viewport', <Num key="a" v={String(level)} hi={hiLevel} />], ['Render', <Num key="b" v="3" />], ['', <Toggle key="c" on label="Optimal Display" />]]} />
        <ModCard name="Mirror" icon="mirror" appear={ap(75)} open={open(75, 90)} flash={fl(75)}
          rows={[['Axis', <Seg key="a" items={['X', 'Y', 'Z']} on={1} />], ['Bisect', <Seg key="b" items={['X', 'Y', 'Z']} on={-1} />], ['', <Toggle key="c" on label="Clipping" />]]} />
        <ModCard name="Bevel" icon="bevel" appear={ap(90)} open={open(90, 999)} flash={fl(90)}
          rows={[['Amount', <Num key="a" v="0.02 m" />], ['Segments', <Num key="b" v="3" />], ['Limit Method', <Seg key="c" items={['None', 'Angle']} on={1} />]]} />
      </div>
    </div>
  );
};

const KEYS: Record<string, number[]> = { Summary: [1, 20, 40, 60, 80, 100, 120], Body: [1, 40, 80, 120], Pod: [1, 30, 60, 90, 120], Canopy: [1, 60, 120], Camera: [1, 120] };
const Timeline: React.FC<{ f: number; frame: number; playing: boolean }> = ({ f, frame, playing }) => {
  const x0 = 70, px = (1920 - 120) / 120, X = (fr: number) => x0 + fr * px;
  const b = beatAt(f);
  return (
    <div style={{ position: 'absolute', left: 0, top: TL_Y, width: 1920, height: ST_Y - TL_Y, background: U.panel, borderTop: `2px solid ${U.line}`, overflow: 'hidden' }}>
      <div style={{ height: 36, background: U.head, display: 'flex', alignItems: 'center', gap: 22, padding: '0 14px' }}>
        <Ic d={I.layers} c={U.text} />
        {['Playback', 'Keying', 'View', 'Marker'].map((m) => <T key={m} s={17}>{m}</T>)}
      </div>
      {/* transport, absolutely placed so the cursor can hit Play */}
      <div style={{ position: 'absolute', left: PLAY[0] - 100, top: 4, display: 'flex', gap: 6 }}>
        {[I.toStart, I.keyPrev, I.play, I.keyNext, I.toEnd].map((d, i) => (
          <div key={i} style={{ width: 36, height: 28, borderRadius: 5, background: i === 2 && playing ? U.blue : U.field, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Ic d={d} s={16} c={i === 2 && playing ? '#fff' : U.text} fill={i === 2 || i === 0 || i === 4 ? (i === 2 && playing ? '#fff' : 'none') : 'none'} />
          </div>
        ))}
      </div>
      <div style={{ position: 'absolute', left: 940, top: 4, display: 'flex', gap: 10, alignItems: 'center' }}>
        <Field w={90} hi={playing ? 0.2 : 0}><T s={17} mono>{String(frame)}</T></Field>
        <T s={16} c={U.mute}>Start</T><Field w={70}><T s={16} mono>1</T></Field>
        <T s={16} c={U.mute}>End</T><Field w={80}><T s={16} mono>120</T></Field>
      </div>
      {/* ruler */}
      <div style={{ position: 'absolute', left: 0, top: 36, width: 1920, height: 28, background: U.panel2 }}>
        {Array.from({ length: 13 }, (_, i) => (
          <div key={i} style={{ position: 'absolute', left: X(i * 10) - 20, top: 6, width: 40, textAlign: 'center' }}><T s={15} mono c={U.mute}>{String(i * 10)}</T></div>
        ))}
      </div>
      {Object.entries(KEYS).map(([name, ks], r) => (
        <div key={name} style={{ position: 'absolute', left: 0, top: 70 + r * 26, width: 1920, height: 24, background: r === 0 ? 'rgba(255,255,255,0.03)' : 'transparent' }}>
          {ks.map((k) => {
            const hit = playing && frame >= k && frame - k < 6;
            return <div key={k} style={{ position: 'absolute', left: X(k) - 7, top: 5, width: 13, height: 13, transform: `rotate(45deg) scale(${hit ? 1.35 : 1})`,
              background: hit ? '#FFD38A' : name === 'Summary' ? '#C9CED8' : '#E8E3D6', border: '1px solid #0B0C0E', boxShadow: hit ? '0 0 12px #FFB35A' : undefined }} />;
          })}
        </div>
      ))}
      {/* playhead */}
      <div style={{ position: 'absolute', left: X(frame) - 1, top: 36, width: 2, height: 200, background: U.blue }} />
      <div style={{ position: 'absolute', left: X(frame) - 24, top: 38, width: 48, height: 24, borderRadius: 5, background: U.blue, display: 'flex', alignItems: 'center', justifyContent: 'center',
        transform: `scale(${playing ? 1 + 0.08 * b.pulse : 1})` }}><T s={15} mono c="#fff" w={700}>{String(frame)}</T></div>
    </div>
  );
};

const StatusBar: React.FC<{ stats: string }> = ({ stats }) => (
  <div style={{ position: 'absolute', left: 0, top: ST_Y, width: 1920, height: 1080 - ST_Y, background: U.app, display: 'flex', alignItems: 'center', gap: 26, padding: '0 16px', boxSizing: 'border-box' }}>
    {['Select', 'Rotate View', 'Object'].map((m, i) => <div key={m} style={{ display: 'flex', gap: 8, alignItems: 'center' }}><div style={{ width: 14, height: 18, borderRadius: 7, border: `1.5px solid ${U.mute}`, background: i === 1 ? 'transparent' : 'transparent' }} /><T s={16} c={U.mute}>{m}</T></div>)}
    <div style={{ marginLeft: 'auto' }}><T s={16} c={U.mute} mono>{stats}</T></div>
  </div>
);

/** navigation gizmo: the app's Z-up axes (X = three X, Y = three -Z, Z = three Y) seen from the camera */
const Gizmo: React.FC<{ pos: V3; target: V3; cx: number; cy: number }> = ({ pos, target, cx, cy }) => {
  const fw = new THREE.Vector3(...target).sub(new THREE.Vector3(...pos)).normalize();
  const rt = new THREE.Vector3().crossVectors(fw, new THREE.Vector3(0, 1, 0)).normalize();
  const up = new THREE.Vector3().crossVectors(rt, fw);
  const R = 46;
  const ax = [
    { l: 'X', v: new THREE.Vector3(1, 0, 0), c: '#E0545A' },
    { l: 'Y', v: new THREE.Vector3(0, 0, -1), c: '#86B843' },
    { l: 'Z', v: new THREE.Vector3(0, 1, 0), c: '#4F8BE8' },
  ].flatMap((a) => [{ ...a, s: 1 }, { ...a, s: -1 }])
    .map((a) => ({ ...a, x: cx + R * a.s * a.v.dot(rt), y: cy - R * a.s * a.v.dot(up), z: a.s * a.v.dot(fw) }))
    .sort((p, q) => q.z - p.z);
  return (
    <svg width={VW} height={VH} style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none' }}>
      <circle cx={cx} cy={cy} r={R + 18} fill="rgba(255,255,255,0.05)" />
      {ax.map((a, i) => (
        <g key={i}>
          {a.s > 0 && <line x1={cx} y1={cy} x2={a.x} y2={a.y} stroke={a.c} strokeWidth={3} />}
          <circle cx={a.x} cy={a.y} r={a.s > 0 ? 13 : 10} fill={a.s > 0 ? a.c : 'rgba(0,0,0,0.25)'} stroke={a.c} strokeWidth={a.s > 0 ? 0 : 2} opacity={a.s > 0 ? 1 : 0.75} />
          {a.s > 0 && <text x={a.x} y={a.y + 5.5} textAnchor="middle" fontFamily={F.text} fontWeight={700} fontSize={15} fill="#101216">{a.l}</text>}
        </g>
      ))}
    </svg>
  );
};

const KEY_CHIPS: { at: number; keys: string[]; label: string }[] = [
  { at: 15, keys: ['Ctrl', '1'], label: 'Subdivide' },
  { at: 30, keys: ['Ctrl', '2'], label: 'Subdivide' },
  { at: 60, keys: ['Shift', 'A'], label: 'Add · Pod' },
  { at: 105, keys: ['A'], label: 'Select all' },
  { at: 121, keys: [], label: 'Rendered preview' },
];

// ------------------------------------------------------------------------------------------------ 3D scenes
const ClayScene: React.FC<{ s: RacerState; cam: ReturnType<typeof camAt>; y: number; grid: number }> = ({ s, cam, y, grid }) => {
  const R = useRacerAssets();
  return (
    <>
      <CamRig pos={cam.pos} target={cam.target} fov={cam.fov} shiftX={cam.shiftX} />
      <StudioGrid opacity={grid} />
      <group position={[0, y, 0]}><Racer s={s} mode="clay" R={R} /></group>
    </>
  );
};
const RenderScene: React.FC<{ s: RacerState; cam: ReturnType<typeof camAt>; y: number; ignite: number }> = ({ s, cam, y, ignite }) => {
  const R = useRacerAssets();
  const shadow = React.useMemo(() => new THREE.MeshBasicMaterial({ map: R.glow, color: '#000000', transparent: true, depthWrite: false }), [R]);
  const pool = React.useMemo(() => new THREE.MeshBasicMaterial({ map: R.glow, color: GLOW, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }), [R]);
  shadow.opacity = 0.75 - 0.25 * ignite; pool.opacity = 0.55 * ignite * (0.8 + 0.3 * s.pulse);
  return (
    <>
      <CamRig pos={cam.pos} target={cam.target} fov={cam.fov} shiftX={cam.shiftX} />
      <Env intensity={0.85} />
      <hemisphereLight args={['#A9B4FF', '#FF9C78', 0.75]} />
      <directionalLight position={[4, 6, 5]} intensity={2.6} color="#FFE4CC" />
      <directionalLight position={[-6, 3, -5]} intensity={3.2} color="#9DB9FF" />
      <pointLight position={[0, 0.3, 0]} intensity={3.5 * ignite} distance={5} color={GLOW} />
      <RenderWorld />
      <group scale={[1, -1, 1]}><group position={[0, y, 0]}><Racer s={s} mode="render" R={R} reflect /></group></group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]} scale={[5.6, 2.8, 1]} material={shadow}><planeGeometry args={[1, 1]} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-0.2, 0.01, 0]} scale={[7.5, 4.2, 1]} material={pool}><planeGeometry args={[1, 1]} /></mesh>
      <group position={[0, y, 0]}><Racer s={s} mode="render" R={R} /></group>
    </>
  );
};

// ------------------------------------------------------------------------------------------------ shot
export const StudioView: React.FC<V3Props> = () => {
  const f = useCurrentFrame();
  const b = beatAt(f);
  const cam = camAt(f);

  // model state on the beat grid
  const sculpt = easeInOutCubic(invLerp(46, 60, f));
  const sub = (f < 15 ? 0 : f < 30 ? easeOutCubic(invLerp(15, 21, f)) : 1 + easeOutCubic(invLerp(30, 36, f))) + sculpt;
  const level = f < 15 ? 0 : f < 30 ? 1 : 2;
  const wire = clamp((f - 15) / 2) * (1 - clamp((f - 105) / 3));
  const density = f < 30 ? 2 : f < 46 ? 4 : 8;
  const spring = (a: number) => (f < a ? 0 : dampedSpring((f - a) / 30, 16, 0.5));
  const ignite = reveal(f, 135, 8);
  const selAll = f >= 105;
  const sel = {
    body: f < 60 ? 1 : selAll ? 0.6 : 0, pod: f >= 60 && f < 90 ? 1 : selAll ? 0.6 : 0,
    canopy: f >= 90 && f < 97 ? 1 : selAll ? 0.6 : 0, fin: f >= 97 ? 1 : 0,
  };
  const s: RacerState = { sub, sculpt, density, wire, pod: spring(60), mirror: easeInOutCubic(invLerp(76, 87, f)), canopy: spring(90), fin: spring(97),
    ignite, pulse: f >= 135 ? b.pulse : 0, sel };
  const hover = f >= 135 ? 0.14 * reveal(f, 135, 24) + 0.035 * Math.sin(((f - 135) / 30) * Math.PI * 2 * 0.5) : 0;
  const y = 0.92 + hover - 0.02 * sculpt;
  const rs: RacerState = { ...s, wire: 0, sel: { body: 0, pod: 0, canopy: 0, fin: 0 } };

  // rendered switch on bar 3: left-to-right resolve, then noise clears
  const rv = easeInOutCubic(invLerp(120, 129, f));
  const noise = f >= 120 ? 1 - invLerp(121, 136, f) : 0;
  const samples = f >= 120 ? Math.min(128, Math.round(2 ** ((f - 120) / 1.55))) : 0;
  const mode = f >= 45 && f < 60 ? 'Sculpt Mode' : 'Object Mode';
  const tab = f >= 45 && f < 60 ? 'Sculpting' : 'Modeling';
  const playing = f >= 135, frame = playing ? 1 + (f - 135) : 1;

  // cursor (frame coords); the sculpt brush follows the body's top from nose to tail
  const proj = (p: V3): [number, number] => { const [x, yy] = project(p, cam, VW, VH); return [x, VY + yy]; };
  const bs = proj([1.35, y + 0.48, 0.32]), be = proj([-1.35, y + 0.52, 0.32]);
  const CUR: CursorKey[] = [[0, 1010, 650], [16, 930, 600], [40, 900, 520], [45, bs[0], bs[1]], [59, be[0], be[1]], [72, ADD_MOD[0], ADD_MOD[1]], [92, ADD_MOD[0], ADD_MOD[1]],
    [116, SHADE_X[3] + 13, 58], [122, SHADE_X[3] + 13, 58], [133, PLAY[0], PLAY[1]], [138, PLAY[0], PLAY[1]], [180, 1000, 690]];
  const [cx, cy] = cursorAt(f, CUR);
  const clicks = [75, 90, 120, 135];
  const lastClick = clicks.filter((c) => f >= c).pop();
  const press = clicks.some((c) => f >= c - 2 && f < c + 2) ? 1 : 0;
  const sculpting = f >= 45 && f < 60;

  const verts = f < 15 ? 8 : f < 30 ? 26 : f < 46 ? 98 : f < 60 ? 1538 : f < 76 ? 1922 : f < 90 ? 2306 : f < 97 ? 2594 : 2690;
  const objs = f < 60 ? 1 : f < 90 ? 2 : f < 97 ? 3 : 4;
  const selName = f < 60 ? 'Body' : f < 90 ? 'Pod' : f < 97 ? 'Canopy' : 'Fin';
  const selMap: Record<string, number> = { Body: sel.body, Pod: sel.pod, Canopy: sel.canopy, Fin: sel.fin };

  return (
    <AbsoluteFill style={{ background: U.app, overflow: 'hidden' }}>
      <TopBar tab={tab} />
      <ViewportHeader mode={mode} shade={f >= 120 ? 3 : 1} overlays={f < 120} />
      {/* viewport */}
      <div style={{ position: 'absolute', left: 0, top: VY, width: VW, height: VH, overflow: 'hidden' }}>
        {rv < 1 && (
          <div style={{ position: 'absolute', inset: 0 }}>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, #474C55 0%, #353940 55%, #2B2E34 100%)' }} />
            <ThreeStage width={VW} height={VH} fog={['#33373E', 14, 42]}><ClayScene s={s} cam={cam} y={y} grid={1} /></ThreeStage>
          </div>
        )}
        {rv > 0 && (
          <div style={{ position: 'absolute', inset: 0, clipPath: rv < 1 ? `inset(0 ${(1 - rv) * 100}% 0 0)` : undefined, filter: noise > 0.05 ? `blur(${2.5 * noise * noise}px) saturate(${1 - 0.3 * noise})` : undefined }}>
            <ThreeStage width={VW} height={VH} fog={['#F09C76', 16, 52]} exposure={1.05}><RenderScene s={rs} cam={cam} y={y} ignite={ignite} /></ThreeStage>
          </div>
        )}
        {rv > 0 && rv < 1 && <div style={{ position: 'absolute', left: rv * VW - 3, top: 0, width: 6, height: VH, background: 'linear-gradient(180deg, rgba(255,220,190,0), #FFE6CF 30%, #FFE6CF 70%, rgba(255,220,190,0))', boxShadow: '0 0 30px 10px rgba(255,170,120,0.55)' }} />}
        {noise > 0 && (
          <svg width={VW} height={VH} style={{ position: 'absolute', inset: 0, opacity: 0.55 * noise * rv, mixBlendMode: 'overlay' }}>
            <filter id={`sn${f % 5}`}><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={1} seed={f} /><feColorMatrix type="saturate" values="0" /></filter>
            <rect width="100%" height="100%" filter={`url(#sn${f % 5})`} />
          </svg>
        )}
        {/* toolbar */}
        <div style={{ position: 'absolute', left: 10, top: 16, width: 46, borderRadius: 8, background: 'rgba(30,32,36,0.92)', padding: '6px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          {(['select', 'move', 'rot', 'scale', 'pen', 'ruler', 'cube'] as (keyof typeof I)[]).map((k, i) => (
            <div key={k} style={{ width: 36, height: 36, borderRadius: 6, background: i === (sculpting ? 4 : 0) ? U.blue : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Ic d={I[k]} c={i === (sculpting ? 4 : 0) ? '#fff' : U.text} s={20} />
            </div>
          ))}
        </div>
        {/* info text */}
        <div style={{ position: 'absolute', left: 72, top: 14, display: 'flex', flexDirection: 'column', gap: 7 }}>
          <T s={17} c="#E6EAF0" w={600}>{f >= 120 ? 'Perspective · Rendered' : 'Perspective'}</T>
          <T s={16} c="#B9C0CC">{`(1) Collection | ${selName}`}</T>
          {f >= 120 && <T s={16} c={samples < 128 ? '#FFD2A6' : '#BFE8CF'} mono>{samples < 128 ? `Sample ${samples} / 128` : 'Samples 128 / 128 · done'}</T>}
        </div>
        {f >= 120 && samples < 128 && <div style={{ position: 'absolute', left: 0, top: 0, height: 3, width: (samples / 128) * VW, background: '#FFB27A' }} />}
        {/* gizmo + nav buttons */}
        <Gizmo pos={cam.pos} target={cam.target} cx={VW - 96} cy={84} />
        <div style={{ position: 'absolute', left: VW - 116, top: 172, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[I.search, 'M12 3 V21 M3 12 H21 M8 7 L12 3 L16 7 M8 17 L12 21 L16 17', I.cam, I.box].map((d, i) => (
            <div key={i} style={{ width: 40, height: 40, borderRadius: 20, background: 'rgba(30,32,36,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Ic d={d} c={U.text} s={19} /></div>
          ))}
        </div>
        {/* key chips */}
        {KEY_CHIPS.map((k) => {
          const a = f - k.at;
          if (a < 0 || a > 16) return null;
          const o = Math.min(1, a / 2) * (1 - clamp((a - 12) / 4));
          return (
            <div key={k.at} style={{ position: 'absolute', left: 700, top: VH - 92, transform: `translateX(-50%) translateY(${(1 - easeOutCubic(Math.min(1, a / 4))) * 12}px)`, opacity: o, display: 'flex', gap: 8, alignItems: 'center',
              padding: '10px 14px', borderRadius: 10, background: 'rgba(14,15,18,0.82)', border: '1px solid rgba(255,255,255,0.08)' }}>
              {k.keys.map((x) => <div key={x} style={{ minWidth: 26, padding: '6px 10px', borderRadius: 6, background: '#E9ECF1', boxShadow: '0 3px 0 #8E949E', textAlign: 'center' }}><T s={20} w={700} c="#16181D">{x}</T></div>)}
              <T s={20} w={600} c="#E6EAF0" style={{ marginLeft: 6 }}>{k.label}</T>
            </div>
          );
        })}
        {/* sculpt brush ring */}
        {sculpting && (
          <svg width={VW} height={VH} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            <circle cx={cx} cy={cy - VY} r={66} fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth={2.5} />
            <circle cx={cx} cy={cy - VY} r={40} fill="none" stroke="rgba(255,190,140,0.7)" strokeWidth={1.5} strokeDasharray="5 6" />
            <circle cx={cx} cy={cy - VY} r={3.5} fill="#fff" />
          </svg>
        )}
      </div>
      <Outliner f={f} sel={selMap} />
      <Properties f={f} level={level} />
      <Timeline f={f} frame={frame} playing={playing} />
      <StatusBar stats={`Collection | ${selName}   ·   Verts ${verts.toLocaleString('en-US')}   ·   Objects ${objs}/${objs + 2}`} />
      {!sculpting && <Cursor x={cx} y={cy} press={press} clickAge={lastClick !== undefined ? f - lastClick : -1} dark />}
      <V3Tag label="3D · BLENDER-STYLE VIEWPORT" />
    </AbsoluteFill>
  );
};
