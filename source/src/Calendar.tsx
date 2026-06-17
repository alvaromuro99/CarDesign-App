import React, { useState } from 'react';
import { tasks, projects, getPage, createTask, STATUS, events, addEvent, updateEvent, deleteEvent, EVENT_COLORS } from './store';
import { TaskModal } from './Board';
import { Status } from './types';
const MONTHS = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
const DOWS = ['dom','lun','mar','mié','jue','vie','sáb'];

export default function Calendar({ onOpenProject }: { onOpenProject: (id: string) => void }) {
  const now = new Date();
  const [ym, setYm] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const [proj, setProj] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const [evId, setEvId] = useState<string | null>(null);
  const [mode, setMode] = useState<'mes' | 'agenda'>(typeof window !== 'undefined' && window.innerWidth < 780 ? 'agenda' : 'mes');
  const withDue = tasks().filter(t => t.due && (!proj || t.projectId === proj));
  const evs = events();
  const todayStr = new Date().toISOString().slice(0, 10);
  const prev = () => setYm(s => s.m === 0 ? { y: s.y - 1, m: 11 } : { y: s.y, m: s.m - 1 });
  const next = () => setYm(s => s.m === 11 ? { y: s.y + 1, m: 0 } : { y: s.y, m: s.m + 1 });

  const Toolbar = (<div className="toolbar">
    <div className="views"><button className={mode === 'mes' ? 'on' : ''} onClick={() => setMode('mes')}>📆 Mes</button><button className={mode === 'agenda' ? 'on' : ''} onClick={() => setMode('agenda')}>📋 Agenda</button></div>
    {mode === 'mes' && <><button className="mini" onClick={prev}>‹</button><b style={{ textTransform: 'capitalize', minWidth: 130, textAlign: 'center' }}>{MONTHS[ym.m]} {ym.y}</b><button className="mini" onClick={next}>›</button><button className="mini" onClick={() => setYm({ y: now.getFullYear(), m: now.getMonth() })}>Hoy</button></>}
    <select className="fsel" value={proj} onChange={e => setProj(e.target.value)}><option value="">Todos los proyectos</option>{projects().map(p => <option key={p.id} value={p.id}>{p.title}</option>)}</select>
    <button className="mini" onClick={() => setEvId(addEvent({ date: `${ym.y}-${String(ym.m + 1).padStart(2, '0')}-15` }).id)}>+ Evento</button>
    <span className="leg"><span className="dot" style={{ background: '#4f7cff' }} /> eventos · <span className="dot" style={{ background: '#9aa6b8' }} /> tareas</span>
  </div>);

  function Day({ ds }: { ds: string }) {
    const dt = withDue.filter(t => t.due === ds); const de = evs.filter(e => e.date === ds);
    return (<>{de.map(e => <div key={e.id} className="calt ev" style={{ borderLeftColor: e.color, background: e.color + '22' }} onClick={() => setEvId(e.id)}>🗓 {e.title}</div>)}
      {dt.map(t => { const p = getPage(t.projectId); return <div key={t.id} className="calt" style={{ borderLeftColor: STATUS[t.status as Status].color }} onClick={() => setOpenId(t.id)}>{p && <span className="cale">{p.icon}</span>}{t.title}</div>; })}</>);
  }
  let grid;
  if (mode === 'mes') {
    const first = new Date(ym.y, ym.m, 1); const startDow = (first.getDay() + 6) % 7; const days = new Date(ym.y, ym.m + 1, 0).getDate();
    const cells: React.ReactNode[] = [];
    for (let i = 0; i < startDow; i++) cells.push(<div key={'e' + i} className="calcell empty" />);
    for (let d = 1; d <= days; d++) { const ds = `${ym.y}-${String(ym.m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`; cells.push(<div key={d} className={'calcell' + (ds === todayStr ? ' today' : '')}><div className="caln">{d}<span className="caladd" onClick={() => { const t = createTask('todo', proj || projects()[0]?.id || ''); t.due = ds; setOpenId(t.id); }}>＋</span></div><Day ds={ds} /></div>); }
    grid = <div className="calgrid" style={{ padding: '0 20px' }}>{['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'].map(d => <div key={d} className="calhd">{d}</div>)}{cells}</div>;
  } else {
    const items = [...withDue.map(t => ({ d: t.due, kind: 'task', t })), ...evs.map(e => ({ d: e.date, kind: 'event', e }))].filter((x: any) => x.d >= todayStr).sort((a, b) => a.d.localeCompare(b.d));
    const byDate: Record<string, any[]> = {}; items.forEach(x => (byDate[x.d] = byDate[x.d] || []).push(x));
    const fmt = (ds: string) => { const dt = new Date(ds + 'T00:00:00'); return `${DOWS[dt.getDay()]} ${dt.getDate()} ${MONTHS[dt.getMonth()].slice(0, 3)}`; };
    grid = <div className="agenda">{Object.keys(byDate).length === 0 ? <div className="empty">No hay tareas ni eventos próximos.</div> : Object.keys(byDate).map(ds => <div className="agday" key={ds}><div className={'agdh' + (ds === todayStr ? ' today' : '')}>{ds === todayStr ? 'Hoy · ' : ''}{fmt(ds)}</div>{byDate[ds].map((x: any) => x.kind === 'event' ? <div className="agt" key={x.e.id} onClick={() => setEvId(x.e.id)} style={{ borderLeft: '3px solid ' + x.e.color }}><span>🗓</span><span className="agtt">{x.e.title}</span></div> : <div className="agt" key={x.t.id} onClick={() => setOpenId(x.t.id)}><span className="dot" style={{ background: STATUS[x.t.status as Status].color }} /><span className="agtt">{x.t.title}</span></div>)}</div>)}</div>;
  }
  return (<div className="boardwrap"><div className="topbar"><span className="crumb">📅 Calendario</span></div>{Toolbar}{grid}
    {openId && <TaskModal id={openId} onClose={() => setOpenId(null)} onOpenProject={onOpenProject} />}
    {evId && (() => { const e = evs.find(x => x.id === evId); if (!e) return null; return (<div className="overlay" onClick={() => setEvId(null)}><div className="modal" onClick={ev => ev.stopPropagation()}><div className="modal-h"><input className="mtitle" defaultValue={e.title} onBlur={ev => updateEvent(e.id, { title: ev.target.value })} /><button className="iconbtn" onClick={() => setEvId(null)}>✕</button></div><div className="modal-grid"><label>Fecha<input type="date" defaultValue={e.date} onChange={ev => updateEvent(e.id, { date: ev.target.value })} /></label><label>Color<div className="swatches">{EVENT_COLORS.map(c => <div key={c} className="sw" style={{ background: c, outline: e.color === c ? '2px solid var(--txt)' : 'none' }} onClick={() => updateEvent(e.id, { color: c })} />)}</div></label></div><label className="mfull">Notas<textarea rows={3} defaultValue={e.notes} onBlur={ev => updateEvent(e.id, { notes: ev.target.value })} /></label><div className="modal-foot"><button className="mdel" onClick={() => { deleteEvent(e.id); setEvId(null); }}>🗑 Eliminar evento</button></div></div></div>); })()}
  </div>);
}
