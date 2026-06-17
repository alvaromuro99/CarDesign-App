import React, { useState } from 'react';
import { getPage, projects, members, member, tasks, createTask, updateTask, deleteTask, reindexStatus, STATUS, STATUS_ORDER, PRIO, uid } from './store';
import { getEmail } from './firebase';
import { Task, Status } from './types';

function Avatar({ id }: { id: string }) { const m = member(id); if (!m) return <span className="chip muted">sin asignar</span>; return <span className="ava" title={m.name} style={{ background: m.color }}>{m.name.slice(0, 2)}</span>; }
function myId() { const e = getEmail(); return members().find(m => (m.emails || []).includes(e))?.id || ''; }

// Drag robusto con listeners en window (no depende de pointer capture)
function dragTask(e: React.PointerEvent, onDrop: (status: Status, ids: string[]) => void) {
  e.preventDefault(); e.stopPropagation();
  const card = (e.currentTarget as HTMLElement).closest('.tcard') as HTMLElement; if (!card) return;
  card.classList.add('dragging'); card.style.opacity = '0.4';
  const move = (ev: PointerEvent) => {
    card.style.pointerEvents = 'none';
    const el = document.elementFromPoint(ev.clientX, ev.clientY); card.style.pointerEvents = '';
    const drop = el && (el as HTMLElement).closest ? (el as HTMLElement).closest('.drop') as HTMLElement | null : null; if (!drop) return;
    const cards = Array.from(drop.querySelectorAll('.tcard:not(.dragging)')) as HTMLElement[];
    let after: HTMLElement | null = null;
    for (const c of cards) { const r = c.getBoundingClientRect(); if (ev.clientY < r.top + r.height / 2) { after = c; break; } }
    if (after) drop.insertBefore(card, after); else drop.appendChild(card);
  };
  const up = () => {
    window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up);
    card.classList.remove('dragging'); card.style.opacity = '';
    const drop = card.closest('.drop') as HTMLElement;
    if (drop) onDrop(drop.dataset.status as Status, Array.from(drop.querySelectorAll('.tcard')).map(c => (c as HTMLElement).dataset.id!));
  };
  window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
}

export default function Board({ onOpenProject }: { onOpenProject: (id: string) => void }) {
  const [f, setF] = useState({ q: '', project: '', assignee: '', priority: '', mine: false });
  const [openId, setOpenId] = useState<string | null>(null);
  const active = f.q || f.project || f.assignee || f.priority || f.mine;
  const me = myId();
  const list = tasks().filter(t => {
    if (f.mine && t.assignee !== me) return false;
    if (f.project && t.projectId !== f.project) return false;
    if (f.assignee && t.assignee !== f.assignee) return false;
    if (f.priority && t.priority !== f.priority) return false;
    if (f.q) { const p = getPage(t.projectId); const hay = (t.title + ' ' + (t.notes || '') + ' ' + (t.labels || []).join(' ') + ' ' + (p ? p.title : '')).toLowerCase(); if (!hay.includes(f.q.toLowerCase())) return false; }
    return true;
  });
  return (
    <div className="boardwrap">
      <div className="topbar"><span className="crumb">🗂️ Tablero</span></div>
      <div className="toolbar">
        <input className="search2" placeholder="Buscar tareas…" value={f.q} onChange={e => setF({ ...f, q: e.target.value })} />
        <button className={'mini' + (f.mine ? ' on' : '')} onClick={() => setF({ ...f, mine: !f.mine })} disabled={!me}>👤 Mis tareas</button>
        <select className="fsel" value={f.project} onChange={e => setF({ ...f, project: e.target.value })}><option value="">Todos los proyectos</option>{projects().map(p => <option key={p.id} value={p.id}>{p.title}</option>)}</select>
        <select className="fsel" value={f.assignee} onChange={e => setF({ ...f, assignee: e.target.value })}><option value="">Responsable</option>{members().map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select>
        <select className="fsel" value={f.priority} onChange={e => setF({ ...f, priority: e.target.value })}><option value="">Prioridad</option>{Object.entries(PRIO).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select>
        {active && <button className="fclear" onClick={() => setF({ q: '', project: '', assignee: '', priority: '', mine: false })}>✕ Limpiar</button>}
      </div>
      <div className="board">
        {STATUS_ORDER.map(s => { const col = list.filter(t => t.status === s).sort((a, b) => a.order - b.order); return (
          <div className="bcol" key={s}>
            <div className="bcol-h"><span className="dot" style={{ background: STATUS[s].color }} />{STATUS[s].label}<span className="c">{col.length}</span><button className="bcol-add" onClick={() => setOpenId(createTask(s, f.project || (projects()[0]?.id || '')).id)}>+</button></div>
            <div className="drop" data-status={s}>
              {col.map(t => { const p = getPage(t.projectId); return (
                <div className="tcard" key={t.id} data-id={t.id} style={{ borderLeftColor: PRIO[t.priority].color }} onClick={() => setOpenId(t.id)}>
                  <div className="tc-grip" onPointerDown={(e) => dragTask(e, reindexStatus)} onClick={e => e.stopPropagation()} title="Arrastrar">⠿</div>
                  <div className="tc-main">
                    <div className="tc-title">{t.title}</div>
                    {(t.labels || []).length > 0 && <div className="lbls">{t.labels.map(l => <span className="lbl" key={l}>{l}</span>)}</div>}
                    <div className="tc-meta">
                      {p && <span className="chip proj" onClick={(e) => { e.stopPropagation(); onOpenProject(p.id); }}>{p.icon} {p.title}</span>}
                      <span className="chip"><span className="dot" style={{ background: PRIO[t.priority].color }} />{PRIO[t.priority].label}</span>
                      {t.due && <span className="chip">📅 {t.due}</span>}
                      {t.subtasks && t.subtasks.length > 0 && <span className="chip">☑ {t.subtasks.filter(s => s.done).length}/{t.subtasks.length}</span>}
                      <Avatar id={t.assignee} />
                    </div>
                  </div>
                </div>
              ); })}
            </div>
          </div>
        ); })}
      </div>
      {openId && <TaskModal id={openId} onClose={() => setOpenId(null)} onOpenProject={onOpenProject} />}
    </div>
  );
}

export function TaskModal({ id, onClose, onOpenProject }: { id: string; onClose: () => void; onOpenProject: (id: string) => void }) {
  const t = tasks().find(x => x.id === id);
  const [c, setC] = useState(''); const [lbl, setLbl] = useState(''); const [sub, setSub] = useState('');
  if (!t) return null;
  const subtasks = t.subtasks || [];
  function send() { if (!c.trim()) return; const ms: string[] = []; members().forEach(m => { if (new RegExp('@' + m.name, 'i').test(c)) ms.push(m.id); }); updateTask(t.id, { comments: [...t.comments, { id: uid(), author: '', authorName: 'Yo', text: c, ts: Date.now(), mentions: ms }] }); setC(''); }
  function addLabel() { const v = lbl.trim(); if (!v || (t.labels || []).includes(v)) { setLbl(''); return; } updateTask(t.id, { labels: [...(t.labels || []), v] }); setLbl(''); }
  function addSub() { const v = sub.trim(); if (!v) return; updateTask(t.id, { subtasks: [...subtasks, { id: uid(), text: v, done: false }] }); setSub(''); }
  return (
    <div className="overlay" onClick={onClose}><div className="modal" onClick={e => e.stopPropagation()}>
      <div className="modal-h"><input className="mtitle" defaultValue={t.title} onBlur={e => updateTask(t.id, { title: e.target.value })} /><button className="iconbtn" onClick={onClose}>✕</button></div>
      <div className="modal-grid">
        <label>Proyecto<select defaultValue={t.projectId} onChange={e => updateTask(t.id, { projectId: e.target.value })}>{projects().map(p => <option key={p.id} value={p.id}>{p.title}</option>)}</select></label>
        <label>Estado<select defaultValue={t.status} onChange={e => updateTask(t.id, { status: e.target.value as Status })}>{STATUS_ORDER.map(s => <option key={s} value={s}>{STATUS[s].label}</option>)}</select></label>
        <label>Prioridad<select defaultValue={t.priority} onChange={e => updateTask(t.id, { priority: e.target.value as any })}>{Object.entries(PRIO).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></label>
        <label>Responsable<select defaultValue={t.assignee} onChange={e => updateTask(t.id, { assignee: e.target.value })}><option value="">Sin asignar</option>{members().map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></label>
        <label>Vencimiento<input type="date" defaultValue={t.due} onChange={e => updateTask(t.id, { due: e.target.value })} /></label>
      </div>
      <div className="mfull">Etiquetas<div className="lbls" style={{ marginTop: 4 }}>{(t.labels || []).map(l => <span className="lbl" key={l}>{l} <span className="x" onClick={() => updateTask(t.id, { labels: t.labels.filter(x => x !== l) })}>×</span></span>)}<input className="lblinp" placeholder="+ etiqueta" value={lbl} onChange={e => setLbl(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') addLabel(); }} /></div></div>
      <div className="mfull">Subtareas<div>{subtasks.map(s => <div className="subrow" key={s.id}><span className={'chk' + (s.done ? ' on' : '')} onClick={() => updateTask(t.id, { subtasks: subtasks.map(x => x.id === s.id ? { ...x, done: !x.done } : x) })}>{s.done ? '✓' : ''}</span><span className={s.done ? 'todo-done' : ''}>{s.text}</span><span className="x" onClick={() => updateTask(t.id, { subtasks: subtasks.filter(x => x.id !== s.id) })}>×</span></div>)}<div className="caddrow"><input className="cadd" placeholder="+ subtarea" value={sub} onChange={e => setSub(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') addSub(); }} /></div></div></div>
      <label className="mfull">Notas<textarea rows={3} defaultValue={t.notes} onBlur={e => updateTask(t.id, { notes: e.target.value })} /></label>
      <div className="open-proj"><button className="mini" onClick={() => { onClose(); onOpenProject(t.projectId); }}>Abrir Notion del proyecto →</button></div>
      <div className="comments"><div className="csub">Comentarios</div>{t.comments.map(cm => <div className="cmt" key={cm.id}><span className="ava sm" style={{ background: '#888' }}>{(cm.authorName || '?').slice(0, 2)}</span><div><div className="cmt-h">{cm.authorName} <span className="cmt-t">{new Date(cm.ts).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span></div><div className="cmt-b">{cm.text}</div></div></div>)}<div className="caddrow"><input className="cadd" placeholder="Comenta… @Álvaro @Alfon" value={c} onChange={e => setC(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') send(); }} /><button className="csend" onClick={send}>Enviar</button></div></div>
      <div className="modal-foot"><button className="mdel" onClick={() => { if (confirm('¿Eliminar tarea?')) { deleteTask(t.id); onClose(); } }}>🗑 Eliminar tarea</button></div>
    </div></div>
  );
}
