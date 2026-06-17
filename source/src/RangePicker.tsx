import React from 'react';
const ymd = (d: Date) => d.toISOString().slice(0, 10);
export interface Range { from: string; to: string; preset: string; }
export function presetRange(preset: string, base = new Date()): Range {
  const y = base.getFullYear(), m = base.getMonth(), d = base.getDate();
  const mk = (a: Date, b: Date) => ({ from: ymd(a), to: ymd(b), preset });
  if (preset === 'hoy') return mk(new Date(y, m, d), new Date(y, m, d));
  if (preset === 'semana') { const dow = (base.getDay() + 6) % 7; const mon = new Date(y, m, d - dow); return mk(mon, new Date(y, m, d - dow + 6)); }
  if (preset === 'mes') return mk(new Date(y, m, 1), new Date(y, m + 1, 0));
  if (preset === 'trimestre') { const q = Math.floor(m / 3) * 3; return mk(new Date(y, q, 1), new Date(y, q + 3, 0)); }
  if (preset === 'anio') return mk(new Date(y, 0, 1), new Date(y, 11, 31));
  if (preset === 'todo') return { from: '', to: '', preset };
  return { from: '', to: '', preset: 'custom' };
}
export const defaultRange = () => presetRange('anio');
const LABELS: [string, string][] = [['hoy', 'Hoy'], ['semana', 'Semana'], ['mes', 'Mes'], ['trimestre', 'Trimestre'], ['anio', 'Año'], ['todo', 'Todo'], ['custom', 'Personalizado']];
export default function RangePicker({ value, onChange }: { value: Range; onChange: (r: Range) => void }) {
  return (<div className="rangepick no-print">
    <div className="views">{LABELS.map(([k, l]) => <button key={k} className={value.preset === k ? 'on' : ''} onClick={() => onChange(k === 'custom' ? { ...value, preset: 'custom' } : presetRange(k))}>{l}</button>)}</div>
    {value.preset === 'custom' && <div className="rangedates"><input type="date" className="fsel" value={value.from} onChange={e => onChange({ ...value, from: e.target.value })} /><span>→</span><input type="date" className="fsel" value={value.to} onChange={e => onChange({ ...value, to: e.target.value })} /></div>}
  </div>);
}
