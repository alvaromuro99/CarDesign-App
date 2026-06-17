import React from 'react';
import { projects, tasks, finances, sales, events, posts, getPage, progress } from './store';
const eur = (n: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n || 0);
export default function Dashboard({ onOpen }: { onOpen: (v: string) => void }) {
  const today = new Date().toISOString().slice(0, 10);
  const in7 = new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10);
  const yr = String(new Date().getFullYear());
  const all = tasks();
  const doing = all.filter(t => t.status === 'doing').length;
  const soon = all.filter(t => t.due && t.status !== 'done' && t.due <= in7).sort((a, b) => a.due.localeCompare(b.due));
  const ing = finances().filter(m => m.type === 'ingreso' && (m.date || '').startsWith(yr)).reduce((s, m) => s + (+m.amount || 0), 0);
  const gas = finances().filter(m => m.type === 'gasto' && (m.date || '').startsWith(yr)).reduce((s, m) => s + (+m.amount || 0), 0);
  const ventasYr = sales().filter(s => (s.date || '').startsWith(yr));
  const anuarios = ventasYr.filter(s => s.type === 'anuario').reduce((s, x) => s + (+x.units || 0), 0);
  const ventasEur = ventasYr.reduce((s, x) => s + (+x.amount || 0), 0);
  const evNext = events().filter(e => e.date >= today).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5);
  const porPublicar = posts().filter(p => p.status !== 'publicado').length;
  return (<div className="boardwrap"><div className="topbar"><span className="crumb">🏠 Inicio</span></div>
    <div className="finwrap">
      <div className="fincards">
        <div className="fcard" onClick={() => onOpen('finances')} style={{ cursor: 'pointer' }}><div className="fl">Beneficio {yr}</div><div className="fv" style={{ color: (ing - gas) >= 0 ? '#3ec46d' : '#e63946' }}>{eur(ing - gas)}</div></div>
        <div className="fcard" onClick={() => onOpen('finances')} style={{ cursor: 'pointer' }}><div className="fl">Anuarios vendidos {yr}</div><div className="fv" style={{ color: 'var(--accent)' }}>{anuarios}</div></div>
        <div className="fcard" onClick={() => onOpen('finances')} style={{ cursor: 'pointer' }}><div className="fl">Ventas {yr}</div><div className="fv" style={{ color: '#3ec46d' }}>{eur(ventasEur)}</div></div>
        <div className="fcard" onClick={() => onOpen('board')} style={{ cursor: 'pointer' }}><div className="fl">Tareas en progreso</div><div className="fv" style={{ color: '#f4a623' }}>{doing}</div></div>
        <div className="fcard" onClick={() => onOpen('planner')} style={{ cursor: 'pointer' }}><div className="fl">Contenido por publicar</div><div className="fv">{porPublicar}</div></div>
      </div>
      <div className="finrow">
        <div className="finbox"><div className="csub">⏰ Recordatorios (vencen pronto)</div>{soon.length ? soon.slice(0, 8).map(t => { const p = getPage(t.projectId); return <div className="agt" key={t.id} onClick={() => onOpen('board')} style={{ cursor: 'pointer' }}><span className={'when' + (t.due < today ? ' od' : '')}>{t.due < today ? '¡Vencida! ' : ''}{t.due}</span><span className="agtt">{t.title}</span>{p && <span className="agp">{p.icon} {p.title}</span>}</div>; }) : <div className="empty">Nada urgente. 🎉</div>}</div>
        <div className="finbox"><div className="csub">📅 Próximos eventos</div>{evNext.length ? evNext.map(e => <div className="agt" key={e.id} onClick={() => onOpen('calendar')} style={{ cursor: 'pointer', borderLeft: '3px solid ' + e.color }}><span className="when">{e.date}</span><span className="agtt">{e.title}</span></div>) : <div className="empty">Sin eventos próximos.</div>}</div>
      </div>
      <div className="csub" style={{ marginTop: 16 }}>Proyectos</div>
      <div className="cards-proj">{projects().map(p => { const pg = progress(p.id); return <div className="pcard" key={p.id} onClick={() => onOpen(p.id)}><div className="h"><span className="e">{p.icon}</span><b>{p.title}</b></div><div className="pbar"><i style={{ width: pg.pct + '%' }} /></div><div className="pmeta">{pg.d} de {pg.tot} hechas · {pg.pct}%</div></div>; })}</div>
    </div></div>);
}
