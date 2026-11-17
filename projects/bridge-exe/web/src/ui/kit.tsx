import type { ReactNode } from 'react';

export const Section = ({ title, children, right }: { title: string; children: ReactNode; right?: ReactNode }) => (
  <section className="sec"><header><span>{title}</span>{right}</header>{children}</section>
);

export function Slider({ label, value, min, max, step, show, onChange, disabled }: {
  label: string; value: number; min: number; max: number; step: number; show: string; onChange: (v: number) => void; disabled?: boolean;
}) {
  return (
    <label className={`sl ${disabled ? 'dis' : ''}`}>
      <span className="sl-l">{label}</span><span className="sl-v">{show}</span>
      <input type="range" min={min} max={max} step={step} value={value} disabled={disabled} onChange={(e) => onChange(+e.target.value)} />
    </label>
  );
}

export const Seg = <T extends string>({ value, options, onChange }: { value: T; options: [T, string][]; onChange: (v: T) => void }) => (
  <div className="seg">{options.map(([v, l]) => <button key={v} className={v === value ? 'on' : ''} onClick={() => onChange(v)}>{l}</button>)}</div>
);

export const Toggle = ({ label, on, onChange }: { label: string; on: boolean; onChange: (v: boolean) => void }) => (
  <button className={`tg ${on ? 'on' : ''}`} onClick={() => onChange(!on)}><i />{label}</button>
);

export const Row = ({ k, v, warn }: { k: string; v: ReactNode; warn?: boolean }) => (
  <div className={`row ${warn ? 'warn' : ''}`}><span>{k}</span><b>{v}</b></div>
);

export function download(name: string, data: string | Blob, type = 'application/json') {
  const blob = typeof data === 'string' ? new Blob([data], { type }) : data;
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
