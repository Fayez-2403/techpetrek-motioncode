// Small console building blocks: a labelled row with an engineering tooltip, a segmented control, a toggle, a stepper
// and a slider that commits on release (so dragging records one action, not hundreds).
import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { sfx } from '../audio/ui';

export const fmt = (n: number) => Math.round(n).toLocaleString('en-US');
export const fmtK = (n: number) => (Math.abs(n) >= 10_000 ? `${(n / 1000).toFixed(n >= 100_000 ? 0 : 1)}k` : fmt(n));
export const pct = (x: number, d = 0) => `${(x * 100).toFixed(d)} %`;
export const ms = (x: number) => `${Math.round(x)} ms`;

/** a group of controls; `locked` greys it out and shows the reason */
export function Section({ title, tip, locked, compact, children, accent }: { title: string; tip?: string; locked?: string; compact?: boolean; children: ReactNode; accent?: string }) {
  return (
    <section className={`ctl${locked ? ' locked' : ''}`} style={accent ? ({ '--accent': accent } as CSSProperties) : undefined}>
      <header>
        <span className="ctl-title">{title}</span>
        {tip && !compact ? <span className="info" title={tip}>i</span> : null}
      </header>
      {tip && !compact ? <p className="tip">{tip}</p> : null}
      <fieldset disabled={!!locked}>{children}</fieldset>
      {locked ? <p className="lock">🔒 {locked}</p> : null}
    </section>
  );
}

export function Seg<T extends string>({ value, options, onPick, title }: { value: T; options: { v: T; label: string; tip?: string }[]; onPick: (v: T) => void; title?: string }) {
  return (
    <div className="seg" role="radiogroup" title={title}>
      {options.map((o) => (
        <button key={o.v} type="button" role="radio" aria-checked={value === o.v} className={value === o.v ? 'on' : ''} title={o.tip}
          onClick={() => { if (o.v !== value) { sfx.click(); onPick(o.v); } }}>{o.label}</button>
      ))}
    </div>
  );
}

export function Toggle({ on, onChange, label, title, disabled }: { on: boolean; onChange: (v: boolean) => void; label: string; title?: string; disabled?: boolean }) {
  return (
    <button type="button" className={`toggle${on ? ' on' : ''}`} role="switch" aria-checked={on} title={title} disabled={disabled}
      onClick={() => { (on ? sfx.off : sfx.on)(); onChange(!on); }}>
      <span className="knob" /> <span>{label}</span>
    </button>
  );
}

export function Stepper({ value, min, max, onChange, title, disabled, unit }: { value: number; min: number; max: number; onChange: (v: number) => void; title?: string; disabled?: boolean; unit?: string }) {
  const go = (v: number) => { if (v < min || v > max) { sfx.deny(); return; } sfx.click(); onChange(v); };
  return (
    <div className="stepper" title={title}>
      <button type="button" disabled={disabled || value <= min} onClick={() => go(value - 1)} aria-label="decrease">−</button>
      <span className="num">{value}{unit ? <small> {unit}</small> : null}</span>
      <button type="button" disabled={disabled || value >= max} onClick={() => go(value + 1)} aria-label="increase">+</button>
    </div>
  );
}

/** a range input that shows its value live but calls onCommit only when released */
export function Slider({ value, min, max, step, onCommit, show, title, disabled }: { value: number; min: number; max: number; step: number; onCommit: (v: number) => void; show: (v: number) => string; title?: string; disabled?: boolean }) {
  const [v, setV] = useState(value);
  const [drag, setDrag] = useState(false);
  useEffect(() => { if (!drag) setV(value); }, [value, drag]);
  const commit = () => { setDrag(false); if (v !== value) { sfx.tick(); onCommit(v); } };
  return (
    <label className="slider" title={title}>
      <input type="range" min={min} max={max} step={step} value={v} disabled={disabled}
        style={{ '--fill': `${((v - min) / (max - min)) * 100}%` } as CSSProperties}
        onChange={(e) => { setDrag(true); setV(Number(e.target.value)); }}
        onPointerUp={commit} onKeyUp={commit} onBlur={() => drag && commit()} />
      <span className="num">{show(v)}</span>
    </label>
  );
}
