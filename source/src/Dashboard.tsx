import React, { useState } from 'react';
import { projects, tasks, events, getPage, progress, financeSummary, totalFollowers, totalVisits, prevRange, member } from './store';
import RangePicker, { Range, defaultRange } from './RangePicker';
const eur = (n: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n || 0);
const num = (n: number) => Math.round(n || 0).toLocaleString('es-ES');

export default function Dashboard({ onOpen }: { onOpen: (v: string) => void }) {
  const [range, setRange] = useState<Range>(defaultRange());
  const today = new Date().toISOString().slice(0, 10);
  const in7 = new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10);
  const prev = prevRange(range.from, range.to);

  const fin = financeSummary(range.from, range.to);
  const finPrev = prev.to ? financeSummary(prev.from, prev.to) : null;
  const followers = totalFollowers(range.to || today);
  const followersPrev = prev.to ? totalFollowers(prev.to) : 0;
  const visitsSocial = totalVisits(range.from, range.to, 'social');
  const visitsSocialPrev = prev.to ? totalVisits(prev.from, prev.to, 'social') : 0;
  const visitsWeb = totalVisits(range.from, range.to, 'web');
  const visitsWebPrev = prev.to ? totalVisits(prev.from, prev.to, 'web') : 0;

  const open = tasks().filter(t => t.status !== 'done');
  const doing = tasks().filter(t => t.status === 'doing').length;
  const overdue = open.filter(t => t.due && t.due < today).sort((a, b) => a.due.localeCompare(b.due));
  const week = open.filter(t => t.due && t.due >= today && t.due <= in7).sort((a, b) => a.due.localeCompare(b.due));
  const evNext = events().filter(e => e.date >= today).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 6);

  const trend = (cur: number, pr: number, money = false) => {
    if (!prev.to || (!cur && !pr)) return null;
    const d = cur - pr, pct = pr ? Math.round(d / Math.abs(pr) * 100) : 0;
    return <div className="ktrend" style={{ color: d >= 0 ? '#3ec46d' : '#e63946' }}>{d >= 0 ? '▲' : '▼'} {money ? eur(Math.abs(d)) : num(Math.abs(d))} ({pct >= 0 ? '+' : ''}{pct}%)</div>;
  };
  const kpi = (label: string, value: string, color?: string, sub?: React.ReactNode) => (
    <div className="fcard"><div className="fl">{label}</div><div className="fv" style={color ? { color } : undefined}>{value}</div>{sub && <div className="ksub">{sub}</div>}</div>);
  const who = (id: string) => member(id)?.name || '';
  const taskRow = (t: any) => { const p = getPage(t.projectId); const m = member(t.assignee); return (
    <div className="agt" key={t.id} onClick={() => onOpen('board')}>
      <span className={'when' + (t.due < today ? ' od' : '')}>{t.due < today ? '¡Vencida! ' : ''}{t.due}</span>
      <span className="agtt">{t.title}</span>
      {m && <span className="agp" style={{ color: m.color }}>{m.name}</span>}
      {p && <span className="agp">{p.icon} {p.title}</span>}
    </div>); };

  return (<div className="boardwrap"><div className="topbar"><span className="crumb">🏠 Inicio</span></div>
    <div className="finwrap">
      <RangePicker value={range} onChange={setRange} />
      <div className="fincards k6">
        {kpi('Beneficio', eur(fin.neto), fin.neto >= 0 ? '#3ec46d' : '#e63946', finPrev ? trend(fin.neto, finPrev.neto, true) : `${eur(fin.ingresos)} − ${eur(fin.gastos)}`)}
        {kpi('Seguidores totales', num(followers), '#9b5de5', trend(followers, followersPrev) || 'todas las redes')}
        {kpi('Visualizaciones (redes)', num(visitsSocial), '#4f7cff', trend(visitsSocial, visitsSocialPrev))}
        {kpi('Páginas vistas web', num(visitsWeb), '#00b8d9', trend(visitsWeb, visitsWebPrev))}
        {kpi('Anuarios entregados', num(fin.anuarios), 'var(--accent)')}
        {kpi('Tareas', num(doing) + ' en curso', '#f4a623', overdue.length ? <span style={{ color: '#e63946' }}>{overdue.length} vencida{overdue.length > 1 ? 's' : ''}</span> : 'sin vencidas 🎉')}
      </div>

      <div className="finrow3">
        <div className="finbox"><div className="csub">💰 Finanzas del periodo</div>
          <div className="ministat"><span>Ingresos</span><b style={{ color: '#3ec46d' }}>{eur(fin.ingresos)}</b></div>
          <div className="ministat"><span>Gastos</span><b style={{ color: '#e63946' }}>{eur(fin.gastos)}</b></div>
          <div className="ministat"><span>Beneficio</span><b style={{ color: fin.neto >= 0 ? '#3ec46d' : '#e63946' }}>{eur(fin.neto)}</b></div>
          <div className="ministat" style={{ borderTop: '1px solid var(--line)', paddingTop: 6 }}><span>IVA a liquidar</span><b>{eur(fin.ivaLiq)}</b></div>
          <div className="ministat" style={{ fontSize: 11, color: 'var(--muted)' }}><span>Margen</span><span>{fin.margen.toFixed(0)}%</span></div>
        </div>
        <div className="finbox"><div className="csub">⏰ Tareas {overdue.length ? <span style={{ color: '#e63946' }}>· {overdue.length} vencidas</span> : ''}</div>
          {overdue.slice(0, 5).map(taskRow)}
          {week.length > 0 && <div className="csub" style={{ fontSize: 11, marginTop: 8, opacity: .8 }}>Esta semana</div>}
          {week.slice(0, 5).map(taskRow)}
          {!overdue.length && !week.length && <div className="empty">Nada urgente esta semana. 🎉</div>}
        </div>
        <div className="finbox"><div className="csub">📅 Próximos eventos</div>{evNext.length ? evNext.map(e => <div className="agt" key={e.id} onClick={() => onOpen('calendar')} style={{ borderLeft: '3px solid ' + e.color, paddingLeft: 9 }}><span className="when">{e.date}</span><span className="agtt">{e.title}</span></div>) : <div className="empty">Sin eventos próximos. Añádelos en Calendario.</div>}</div>
      </div>

      <div className="csub" style={{ marginTop: 18 }}>Proyectos</div>
      <div className="cards-proj">{projects().map(p => { const pg = progress(p.id); return <div className="pcard" key={p.id} onClick={() => onOpen(p.id)}><div className="h"><span className="e">{p.icon}</span><b>{p.title}</b></div><div className="pbar"><i style={{ width: pg.pct + '%' }} /></div><div className="pmeta">{pg.d} de {pg.tot} hechas · {pg.pct}%</div></div>; })}</div>
    </div></div>);
}
