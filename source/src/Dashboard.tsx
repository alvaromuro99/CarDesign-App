import React, { useState } from 'react';
import { projects, tasks, events, getPage, progress, financeSummary, totalFollowers, totalVisits } from './store';
import RangePicker, { Range, defaultRange } from './RangePicker';
const eur = (n: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n || 0);
const num = (n: number) => (n || 0).toLocaleString('es-ES');
export default function Dashboard({ onOpen }: { onOpen: (v: string) => void }) {
  const [range, setRange] = useState<Range>(defaultRange());
  const today = new Date().toISOString().slice(0, 10);
  const in7 = new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10);
  const fin = financeSummary(range.from, range.to);
  const followers = totalFollowers(range.to || today);
  const visitsSocial = totalVisits(range.from, range.to, 'social');
  const visitsWeb = totalVisits(range.from, range.to, 'web');
  const doing = tasks().filter(t => t.status === 'doing').length;
  const soon = tasks().filter(t => t.due && t.status !== 'done' && t.due <= in7).sort((a, b) => a.due.localeCompare(b.due));
  const evNext = events().filter(e => e.date >= today).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 6);
  const kpi = (label: string, value: string, color?: string, sub?: string) => (
    <div className="fcard"><div className="fl">{label}</div><div className="fv" style={color ? { color } : undefined}>{value}</div>{sub && <div className="ksub">{sub}</div>}</div>);
  return (<div className="boardwrap"><div className="topbar"><span className="crumb">🏠 Inicio</span></div>
    <div className="finwrap">
      <RangePicker value={range} onChange={setRange} />
      <div className="fincards k6">
        {kpi('Beneficio', eur(fin.neto), fin.neto >= 0 ? '#3ec46d' : '#e63946', `${eur(fin.ingresos)} − ${eur(fin.gastos)}`)}
        {kpi('Anuarios entregados', num(fin.anuarios), 'var(--accent)')}
        {kpi('Seguidores totales', num(followers), '#9b5de5', 'suma de todas las redes')}
        {kpi('Visitas en redes', num(visitsSocial), '#4f7cff')}
        {kpi('Visitas / lecturas web', num(visitsWeb), '#00b8d9')}
        {kpi('Tareas en progreso', num(doing), '#f4a623')}
      </div>
      <div className="finrow">
        <div className="finbox"><div className="csub">⏰ Recordatorios (vencen pronto)</div>{soon.length ? soon.slice(0, 8).map(t => { const p = getPage(t.projectId); return <div className="agt" key={t.id} onClick={() => onOpen('board')}><span className={'when' + (t.due < today ? ' od' : '')}>{t.due < today ? '¡Vencida! ' : ''}{t.due}</span><span className="agtt">{t.title}</span>{p && <span className="agp">{p.icon} {p.title}</span>}</div>; }) : <div className="empty">Nada urgente. 🎉</div>}</div>
        <div className="finbox"><div className="csub">📅 Próximos eventos</div>{evNext.length ? evNext.map(e => <div className="agt" key={e.id} onClick={() => onOpen('calendar')} style={{ borderLeft: '3px solid ' + e.color, paddingLeft: 9 }}><span className="when">{e.date}</span><span className="agtt">{e.title}</span></div>) : <div className="empty">Sin eventos próximos.</div>}</div>
      </div>
      <div className="csub" style={{ marginTop: 18 }}>Proyectos</div>
      <div className="cards-proj">{projects().map(p => { const pg = progress(p.id); return <div className="pcard" key={p.id} onClick={() => onOpen(p.id)}><div className="h"><span className="e">{p.icon}</span><b>{p.title}</b></div><div className="pbar"><i style={{ width: pg.pct + '%' }} /></div><div className="pmeta">{pg.d} de {pg.tot} hechas · {pg.pct}%</div></div>; })}</div>
    </div></div>);
}
