import React, { useState } from 'react';
import { projects, tasks, events, getPage, progress, financeSummary, totalFollowers, totalVisits, prevRange, member, PRIO } from './store';
import RangePicker, { Range, defaultRange } from './RangePicker';
import Icon from './icons';
const eur = (n: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n || 0);
const num = (n: number) => Math.round(n || 0).toLocaleString('es-ES');
const PREVLBL: Record<string, string> = { hoy: 'ayer', semana: 'sem. anterior', mes: 'mes anterior', trimestre: 'trim. anterior', anio: 'año anterior', custom: 'periodo anterior', todo: '' };

function Donut({ pct, color }: { pct: number; color: string }) {
  const r = 34, c = 2 * Math.PI * r, p = Math.max(0, Math.min(100, pct));
  return (<svg viewBox="0 0 90 90" className="donut">
    <circle cx="45" cy="45" r={r} fill="none" stroke="var(--line)" strokeWidth="10" />
    <circle cx="45" cy="45" r={r} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - p / 100)} transform="rotate(-90 45 45)" />
    <text x="45" y="42" textAnchor="middle" className="donut-v">{Math.round(pct)}%</text>
    <text x="45" y="58" textAnchor="middle" className="donut-l">Margen</text>
  </svg>);
}

export default function Dashboard({ onOpen }: { onOpen: (v: string) => void }) {
  const [range, setRange] = useState<Range>(defaultRange());
  const today = new Date().toISOString().slice(0, 10);
  const in7 = new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10);
  const prev = prevRange(range.from, range.to);
  const plbl = PREVLBL[range.preset] || 'periodo anterior';

  const fin = financeSummary(range.from, range.to);
  const finPrev = prev.to ? financeSummary(prev.from, prev.to) : null;
  const followers = totalFollowers(range.to || today);
  const followersPrev = prev.to ? totalFollowers(prev.to) : 0;
  const visitsSocial = totalVisits(range.from, range.to, 'social');
  const visitsSocialPrev = prev.to ? totalVisits(prev.from, prev.to, 'social') : 0;
  const visitsWeb = totalVisits(range.from, range.to, 'web');
  const visitsWebPrev = prev.to ? totalVisits(prev.from, prev.to, 'web') : 0;

  const openT = tasks().filter(t => t.status !== 'done');
  const doing = tasks().filter(t => t.status === 'doing').length;
  const overdue = openT.filter(t => t.due && t.due < today).sort((a, b) => a.due.localeCompare(b.due));
  const week = openT.filter(t => t.due && t.due >= today && t.due <= in7).sort((a, b) => a.due.localeCompare(b.due));
  const evNext = events().filter(e => e.date >= today).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5);
  const projs = projects();

  const trend = (cur: number, pr: number, money = false) => {
    if (!prev.to || (!cur && !pr)) return <span className="kt-flat">—</span>;
    const d = cur - pr, pct = pr ? Math.round(d / Math.abs(pr) * 100) : 100;
    return <span className="ktrend" style={{ color: d >= 0 ? '#3ec46d' : '#e63946' }}>{d >= 0 ? '↑' : '↓'} {Math.abs(pct)}% <span className="kt-sub">vs {plbl}</span></span>;
  };
  const kcard = (icon: string, chipBg: string, iconColor: string, label: string, value: string, color: string, foot: React.ReactNode) => (
    <div className="kcard"><div className="ktop"><span className="kchip" style={{ background: chipBg, color: iconColor }}><Icon n={icon} size={18} /></span><span className="klabel">{label}</span></div>
      <div className="kval" style={{ color }}>{value}</div><div className="kfoot">{foot}</div></div>);
  const taskRow = (t: any) => { const p = getPage(t.projectId); const m = member(t.assignee); const pr = PRIO[t.priority]; return (
    <div className="trow" key={t.id} onClick={() => onOpen('board')}>
      <span className="tdot" style={{ background: t.due < today ? '#e63946' : (pr?.color || '#9aa6b8') }} />
      <span className={'twhen' + (t.due < today ? ' od' : '')}>{t.due < today ? 'Vencida: ' : ''}{(t.due || '').slice(5)}</span>
      <span className="ttitle">{t.title}</span>
      {pr && <span className="tprio" style={{ color: pr.color, borderColor: pr.color }}>{pr.label}</span>}
      {p && <span className="tproj">{p.icon} {p.title}</span>}
    </div>); };

  return (<div className="boardwrap dash"><div className="topbar"><span className="crumb">🏠 Inicio</span></div>
    <div className="finwrap">
      <RangePicker value={range} onChange={setRange} />

      <div className="kpi6">
        {kcard('trending', 'rgba(62,196,109,.16)', '#3ec46d', 'Beneficio', eur(fin.neto), fin.neto >= 0 ? '#3ec46d' : '#e63946', finPrev ? trend(fin.neto, finPrev.neto, true) : <span className="kt-sub">{eur(fin.ingresos)} − {eur(fin.gastos)}</span>)}
        {kcard('users', 'rgba(155,93,229,.16)', '#9b5de5', 'Seguidores totales', num(followers), '#9b5de5', trend(followers, followersPrev))}
        {kcard('eye', 'rgba(79,124,255,.16)', '#4f7cff', 'Visualizaciones (redes)', num(visitsSocial), '#4f7cff', trend(visitsSocial, visitsSocialPrev))}
        {kcard('globe', 'rgba(0,184,217,.16)', '#00b8d9', 'Páginas vistas web', num(visitsWeb), '#00b8d9', trend(visitsWeb, visitsWebPrev))}
        {kcard('file', 'rgba(244,166,35,.16)', '#f4a623', 'Anuarios entregados', num(fin.anuarios), 'var(--txt)', <span className="klink" onClick={(e) => { e.stopPropagation(); onOpen('finances'); }}>Ver finanzas →</span>)}
        {kcard('check', 'rgba(244,166,35,.16)', '#f4a623', 'Tareas', doing + ' en curso', '#f4a623', overdue.length ? <span className="klink" style={{ color: '#e63946' }} onClick={(e) => { e.stopPropagation(); onOpen('board'); }}>{overdue.length} vencidas →</span> : <span className="klink" onClick={(e) => { e.stopPropagation(); onOpen('board'); }}>Ver mis tareas →</span>)}
      </div>

      <div className="finrow3">
        <div className="dbox"><div className="dbox-h"><Icon n="wallet" size={16} /> Finanzas del periodo</div>
          <div className="finsplit">
            <div className="finstats">
              <div className="ministat"><span>Ingresos</span><b style={{ color: '#3ec46d' }}>{eur(fin.ingresos)}</b></div>
              <div className="ministat"><span>Gastos</span><b style={{ color: '#e63946' }}>{eur(fin.gastos)}</b></div>
              <div className="ministat"><span>Beneficio</span><b style={{ color: fin.neto >= 0 ? '#3ec46d' : '#e63946' }}>{eur(fin.neto)}</b></div>
              <div className="ministat"><span>IVA a liquidar</span><b>{eur(fin.ivaLiq)}</b></div>
            </div>
            <Donut pct={fin.margen} color={fin.margen >= 0 ? '#3ec46d' : '#e63946'} />
          </div>
        </div>
        <div className="dbox"><div className="dbox-h"><Icon n="check" size={16} /> Tareas {overdue.length ? <span className="badge-red">{overdue.length} vencidas</span> : ''}</div>
          {overdue.slice(0, 3).map(taskRow)}
          {week.slice(0, Math.max(0, 4 - Math.min(3, overdue.length))).map(taskRow)}
          {!overdue.length && !week.length && <div className="empty">Nada urgente esta semana. 🎉</div>}
          <button className="dbtn" onClick={() => onOpen('board')}>≣ Ver todas las tareas</button>
        </div>
        <div className="dbox"><div className="dbox-h"><Icon n="calendar" size={16} /> Próximos eventos</div>
          {evNext.length ? evNext.map(e => <div className="trow" key={e.id} onClick={() => onOpen('calendar')}><span className="tdot" style={{ background: e.color }} /><span className="twhen">{(e.date || '').slice(5)}</span><span className="ttitle">{e.title}</span></div>)
            : <div className="ev-empty">Sin eventos próximos. Añádelos en Calendario.</div>}
          <button className="dbtn accent" onClick={() => onOpen('calendar')}>Ir al calendario →</button>
        </div>
      </div>

      <div className="dash-sec"><span className="csub" style={{ margin: 0 }}>Proyectos</span><span className="klink" onClick={() => onOpen('board')}>Ver todos los proyectos →</span></div>
      <div className="cards-proj">{projs.map(p => { const pg = progress(p.id); return <div className="pcard" key={p.id} onClick={() => onOpen(p.id)}><div className="h"><span className="e">{p.icon}</span><b>{p.title}</b><span className="pcard-pct">{pg.pct}%</span></div><div className="pbar"><i style={{ width: pg.pct + '%' }} /></div><div className="pmeta">{pg.d} de {pg.tot} tareas</div></div>; })}
        <div className="pcard pcard-new" onClick={() => onOpen('board')}><div className="h"><span className="e">＋</span><b>Nuevo proyecto</b></div><div className="pmeta">Gestiónalos en el Tablero</div></div>
      </div>

    </div></div>);
}
