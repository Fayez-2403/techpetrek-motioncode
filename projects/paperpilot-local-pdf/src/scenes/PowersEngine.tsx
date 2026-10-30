// Scene 03 THE FOUR PDF SUPERPOWERS (13.5-21.5 s) and Scene 04 THE RUST ENGINE (21.5-27.5 s).
import React from 'react';
import { Img, staticFile, useCurrentFrame } from 'remotion';
import { clamp, easeInOutCubic, easeInQuint, easeOutQuint, invLerp, lerp } from '../animation/anim';
import { wf } from '../audio/words';
import { Headline, Label, s0, s1, Sheet, SPRING, Stage } from '../components/kit';
import { RustCore } from '../components/RustCore';
import { C, FONT, glow } from '../themes/tokens';
import BOXES from './ocr_boxes.json';

const TINT = [C.cyan, C.rust, C.mint];
const NAMES = ['invoice.pdf', 'report.pdf', 'notes.pdf'];

export const Powers: React.FC = () => {
  const g = useCurrentFrame();
  const A = s0('powers'), END = s1('powers');
  const MG = wf('l03', 'merge'), MK = wf('l03', 'karo,', 0), SP = wf('l03', 'split'), CP = wf('l03', 'compress'), SC = wf('l03', 'Scanned'), OC = wf('l03', 'OCR');
  const seg = g < SP - 4 ? 0 : g < CP - 2 ? 1 : g < SC - 4 ? 2 : 3;
  const out = (b: number) => 1 - easeInQuint(invLerp(b - 8, b, g));
  return (
    <Stage g={g} pool={seg === 3 ? C.mint : C.cyan} pool2={C.rust}>
      <Headline g={g} top={250} size={150} words={[{ t: 'MERGE', at: MG, c: C.cyan }]} out={SP - 8} />
      <Headline g={g} top={250} size={150} words={[{ t: 'SPLIT', at: SP, c: C.cyan }]} out={CP - 6} />
      <Headline g={g} top={250} size={150} words={[{ t: 'COMPRESS', at: CP, c: C.cyan, size: 140 }]} out={SC - 6} />
      <Headline g={g} top={250} size={96} words={[{ t: 'SCANNED?', at: SC, c: C.ink2 }]} out={OC - 4} />
      <Headline g={g} top={250} size={150} words={[{ t: 'OCR', at: OC, c: C.mint }]} out={END - 20} />

      {/* MERGE: three files arrive from three directions and snap into one stack on "karo" */}
      {seg === 0 ? NAMES.map((nm, i) => {
        const fly = easeOutQuint(invLerp(A + i * 5, MK - 6, g));
        const from = [[-700, 760], [360, -700], [1400, 760]][i];
        const spread = (1 - SPRING.slam(g, MK)) * 170;
        const x = lerp(from[0], 360 + (i - 1) * spread, fly), y = lerp(from[1], 620 + (i - 1) * 14 + Math.abs(i - 1) * spread * 0.3, fly);
        return <div key={nm} style={{ position: 'absolute', left: x, top: y, opacity: out(SP - 4), transform: `rotate(${(i - 1) * 12 * (1 - fly) + (i - 1) * 4 * (spread / 170)}deg)` }}>
          <Sheet name={g < MK ? nm : undefined} title={nm.split('.')[0].toUpperCase()} tint={TINT[i]} seed={i + 1} />
        </div>;
      }) : null}
      {seg === 0 && g >= MK ? (
        <>
          <div style={{ position: 'absolute', left: 540 - 300 * (1 + (g - MK) / 10), top: 860 - 300 * (1 + (g - MK) / 10), width: 600 * (1 + (g - MK) / 10), height: 600 * (1 + (g - MK) / 10),
            borderRadius: '50%', border: `6px solid ${C.cyan}`, opacity: clamp(1 - (g - MK) / 18) }} />
          <div style={{ position: 'absolute', left: 540, top: 1150, transform: 'translateX(-50%)', fontFamily: FONT.mono, fontWeight: 600, fontSize: 30, color: C.ink, opacity: clamp((g - MK) / 8) * out(SP - 4) }}>3 PDFs → 1 PDF</div>
        </>
      ) : null}

      {/* SPLIT: one document turns to camera, a cyan plane slices it, two files settle apart */}
      {seg === 1 ? (() => {
        const turn = easeOutQuint(invLerp(SP - 6, SP + 8, g)), cut = easeInOutCubic(invLerp(SP + 2, SP + 18, g)), sep = SPRING.paper(g, SP + 18);
        const half = (top: boolean) => (
          <div style={{ position: 'absolute', left: 290 + (top ? -150 : 150) * sep, top: 520 + (top ? -40 : 60) * sep, width: 500, height: 667,
            clipPath: top ? 'inset(0 0 50% 0)' : 'inset(50% 0 0 0)', transform: `rotate(${(top ? -6 : 6) * sep}deg) scale(${1 - 0.18 * sep})` }}>
            <Sheet w={500} h={667} title="REPORT" tint={C.rust} seed={2} tag={false} />
          </div>
        );
        return (
          <div style={{ position: 'absolute', inset: 0, perspective: 1600, opacity: out(CP - 2) }}>
            <div style={{ position: 'absolute', inset: 0, transformStyle: 'preserve-3d', transform: `rotateY(${(1 - turn) * 38}deg)`, transformOrigin: '540px 860px' }}>
              {half(true)}{half(false)}
            </div>
            <div style={{ position: 'absolute', left: 180, width: 720, top: lerp(470, 1240, cut), height: 6, background: C.cyan, boxShadow: `0 0 40px 10px ${C.cyan}88`,
              opacity: cut > 0 && cut < 1 ? 1 : 0 }} />
            {sep > 0.2 ? ['split_1.pdf', 'split_2.pdf'].map((nm, i) => (
              <div key={nm} style={{ position: 'absolute', left: i ? 640 : 110, top: i ? 1220 : 450, fontFamily: FONT.mono, fontWeight: 600, fontSize: 28, color: C.ink, padding: '6px 14px',
                borderRadius: 10, background: 'rgba(14,23,36,0.9)', border: `1.5px solid ${C.cyan}66`, opacity: clamp((sep - 0.2) * 2) }}>{nm}</div>
            )) : null}
          </div>
        );
      })() : null}

      {/* COMPRESS: a thick stack in a glass chamber; the walls close and the file gets thinner (no invented %) */}
      {seg === 2 ? (() => {
        const squeeze = easeInOutCubic(invLerp(CP + 2, CP + 28, g)), bounce = SPRING.slam(g, CP + 28);
        const wall = lerp(300, 230, squeeze) + 8 * (1 - bounce) * (squeeze >= 1 ? 1 : 0);
        const pages = Math.round(lerp(10, 2, squeeze));
        return (
          <div style={{ position: 'absolute', inset: 0, opacity: out(SC - 2) }}>
            <div style={{ position: 'absolute', left: 540 - wall - 30, top: 470, width: 2 * (wall + 30), height: 800, borderRadius: 34, border: `3px solid ${C.cyan}88`,
              background: 'linear-gradient(90deg, rgba(41,214,229,0.16), rgba(41,214,229,0.03) 30%, rgba(41,214,229,0.03) 70%, rgba(41,214,229,0.16))', boxShadow: glow(0.3, C.cyan, 50) }} />
            {[-1, 1].map((s) => <div key={s} style={{ position: 'absolute', left: 540 + s * (wall + 30) - 9, top: 520, width: 18, height: 700, borderRadius: 9, background: C.cyan, boxShadow: glow(0.8, C.cyan, 30) }} />)}
            <div style={{ position: 'absolute', left: 540 - 200 * lerp(1, 0.82, squeeze), top: 560, transform: `scale(${lerp(1, 0.82, squeeze)}, ${lerp(1, 0.96, squeeze)})`, transformOrigin: '0 0' }}>
              <Sheet w={400} h={533} title="MERGED" name="merged.pdf" tint={C.rust} seed={5} pages={pages} />
            </div>
          </div>
        );
      })() : null}

      {/* OCR: the real sample scan goes under a scanner; the beam lights each word the real OCR run found */}
      {seg === 3 ? (() => {
        // the scan is cropped to its text block (source px 60..760 x 140..700) so the words read on a phone
        const inn = SPRING.panel(g, SC - 2), sw = 720, k = sw / 700, x0 = 180, y0 = 560, sh = 560 * k;
        const beam = invLerp(OC, OC + 90, g), by = y0 + beam * sh;
        const back = easeInOutCubic(invLerp(END - 46, END - 14, g));
        return (
          <>
            <div style={{ position: 'absolute', left: 140, top: 520, width: 800, height: sh + 80, borderRadius: 30, background: '#05080D', border: '2px solid #22324A',
              boxShadow: '0 50px 120px rgba(0,0,0,0.7)', transform: `translateY(${(1 - inn) * 400}px)`, opacity: clamp(inn * 1.4) }} />
            <div style={{ position: 'absolute', left: x0, top: y0, width: sw, height: sh, borderRadius: 8, overflow: 'hidden', transform: `translateY(${(1 - inn) * 600}px) rotate(${(1 - inn) * 4}deg)`,
              boxShadow: '0 20px 50px rgba(0,0,0,0.5)', filter: beam > 0 ? undefined : 'brightness(0.85)' }}>
              <Img src={staticFile('img/scan.png')} style={{ position: 'absolute', left: -60 * k, top: -140 * k, width: 1240 * k, height: 1754 * k }} />
              {(BOXES as [number, number, number, number, string][]).map(([bx, byy, bw, bh, w], i) => {
                const lit = clamp((by - (y0 + (byy - 140) * k)) / 30);
                return <div key={i} title={w} style={{ position: 'absolute', left: (bx - 60) * k - 4, top: (byy - 140) * k - 5, width: bw * k + 8, height: bh * k + 10, borderRadius: 4,
                  background: `rgba(141,227,181,${0.32 * lit})`, border: `2px solid rgba(141,227,181,${lit})`, boxShadow: lit > 0 ? glow(0.4 * lit, C.mint, 12) : 'none' }} />;
              })}
            </div>
            {beam > 0 && back < 1 ? (
              <div style={{ position: 'absolute', left: lerp(150, 0, back), width: lerp(780, 1080, back), top: lerp(by, 960, back) - 3, height: 6, background: C.cyan, boxShadow: `0 0 36px 8px ${C.cyan}99` }} />
            ) : null}
            <Label top={y0 + sh + 100} left={140} a={clamp((g - OC - 30) / 12) * (1 - back)}>real OCR run · paperpilot ocr v0.6.1 · sample scan</Label>
          </>
        );
      })() : null}
    </Stage>
  );
};

// ---------------------------------------------------------------- Scene 04
interface Node { id: string; title: string; col: string; cue: number }

const NodeCard: React.FC<{ n: Node; g: number; mcp: boolean }> = ({ n, g, mcp }) => {
  const on = clamp((g - n.cue) / 8);
  return (
    <div style={{ width: 340, height: 222, borderRadius: 22, background: 'rgba(11,18,29,0.95)', border: `2px solid ${on ? n.col : '#24344A'}`,
      boxShadow: on ? glow((mcp ? 0.9 : 0.5) * on, n.col, mcp ? 70 : 40) : '0 20px 40px rgba(0,0,0,0.5)', overflow: 'hidden', position: 'relative' }}>
      <div style={{ position: 'absolute', left: 16, top: 12, fontFamily: FONT.mono, fontWeight: 700, fontSize: 24, letterSpacing: 2, color: on ? n.col : C.ink2 }}>{n.title}</div>
      <div style={{ position: 'absolute', left: 12, right: 12, top: 52, bottom: 12, borderRadius: 12, overflow: 'hidden', background: '#070B12' }}>
        {n.id === 'browser' ? <Img src={staticFile('img/web_hero.png')} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
        {n.id === 'desktop' ? <Img src={staticFile('img/desktop_ui.png')} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: '0 0' }} /> : null}
        {n.id === 'cli' ? <div style={{ padding: 10, fontFamily: FONT.mono, fontSize: 17, lineHeight: 1.35, color: C.ink }}><span style={{ color: C.mint }}>$</span> paperpilot merge<br />--inputs a.pdf b.pdf<br />--output merged.pdf</div> : null}
        {n.id === 'rest' ? <div style={{ padding: 10, fontFamily: FONT.mono, fontSize: 17, lineHeight: 1.35, color: C.ink }}>POST localhost:7823<br /><span style={{ color: C.cyan }}>/api/v1/pdf/merge</span></div> : null}
        {n.id === 'mcp' ? <div style={{ padding: 10, fontFamily: FONT.mono, fontSize: 18, lineHeight: 1.4, color: C.ink }}><span style={{ color: C.rust }}>paperpilot-mcp</span><br />stdio · 76 tools<br />pdf_merge pdf_ocr …</div> : null}
      </div>
    </div>
  );
};

export const Engine: React.FC = () => {
  const g = useCurrentFrame();
  const A = s0('engine'), END = s1('engine');
  const EN = wf('l04', 'engine'), BR = wf('l04', 'browser,'), DE = wf('l04', 'desktop'), CO = wf('l04', 'command'), HAI = wf('l04', 'hai!');
  const NODES: Node[] = [
    { id: 'mcp', title: 'MCP', col: C.rust, cue: HAI + 10 },
    { id: 'browser', title: 'BROWSER · WASM', col: C.cyan, cue: BR },
    { id: 'desktop', title: 'DESKTOP', col: C.cyan, cue: DE },
    { id: 'cli', title: 'CLI', col: C.mint, cue: CO },
    { id: 'rest', title: 'LOCAL REST', col: C.mint, cue: CO + 28 },
  ];
  const ZOOM = END - 60, e = easeInOutCubic(invLerp(A, ZOOM, g)), cx = 540, cy = 900, rx = 330, ry = 360;
  const pos = NODES.map((_, i) => {
    const a = ((-90 + i * 72 + 180 * e) * Math.PI) / 180, z = Math.sin(a);
    return { x: cx + rx * Math.cos(a), y: cy + ry * Math.sin(a), z, s: 0.74 + 0.26 * (z + 1) / 2 };
  });
  const zoom = easeInQuint(invLerp(ZOOM, END, g)), mp = pos[0];
  return (
    <Stage g={g} pool={C.rust} pool2={C.cyan}>
      <div style={{ position: 'absolute', inset: 0, transformOrigin: `${mp.x}px ${mp.y}px`, transform: `scale(${1 + 5 * zoom})` }}>
        <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
          {pos.map((p, i) => {
            const n = NODES[i], on = clamp((g - n.cue) / 8), mcp = i === 0;
            return (
              <g key={n.id}>
                <line x1={p.x} y1={p.y} x2={cx} y2={cy} stroke={on ? n.col : '#2A3A50'} strokeOpacity={0.4 + 0.6 * on} strokeWidth={mcp ? 7 : 3.5} />
                {on > 0 ? Array.from({ length: 3 }, (_, k) => {
                  const u = ((g - n.cue) / 40 + k / 3) % 1;
                  return <rect key={k} x={lerp(p.x, cx, u) - 9} y={lerp(p.y, cy, u) - 12} width={18} height={24} rx={3} fill={C.paper} opacity={0.9 * on} />;
                }) : null}
              </g>
            );
          })}
        </svg>
        <RustCore g={g} size={300} x={cx} y={cy} power={0.6 + 0.4 * clamp((g - EN) / 20)} />
        {pos.map((p, i) => ({ p, i })).sort((a, b) => a.p.z - b.p.z).map(({ p, i }) => (
          <div key={NODES[i].id} style={{ position: 'absolute', left: p.x - 170, top: p.y - 111, transform: `scale(${p.s})`, opacity: 0.55 + 0.45 * (p.z + 1) / 2 }}>
            <NodeCard n={NODES[i]} g={g} mcp={i === 0} />
          </div>
        ))}
      </div>
      <Headline g={g} top={250} size={120} words={[{ t: 'ONE', at: EN - 4 }, { t: 'ENGINE', at: EN + 4, c: C.rust }]} out={ZOOM + 10} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: 380, textAlign: 'center', fontFamily: FONT.mono, fontWeight: 600, fontSize: 38, letterSpacing: 4, color: C.ink2,
        opacity: clamp((g - HAI - 6) / 10) * (1 - zoom) }}>MULTIPLE WAYS TO USE IT</div>
    </Stage>
  );
};
