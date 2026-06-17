import React, { useMemo, useState } from 'react';
import { getDB } from './store';
export default function Search({ onClose, onOpen }: { onClose: () => void; onOpen: (id: string) => void }) {
  const [q, setQ] = useState('');
  const items = useMemo(() => {
    const db = getDB(); const ql = q.trim().toLowerCase(); const out: any[] = [];
    db.pages.filter(p => !p.trashed).forEach(p => { if (!ql || (p.title || '').toLowerCase().includes(ql) || p.blocks.some(b => (b.text || '').toLowerCase().includes(ql))) out.push({ id: p.id, icon: p.icon || '📄', label: p.title || 'Sin título', sub: 'Página', go: p.id }); });
    if (ql) { db.tasks.forEach(t => { if ((t.title || '').toLowerCase().includes(ql)) out.push({ id: 't' + t.id, icon: '✅', label: t.title, sub: 'Tarea', go: 'board' }); });
      db.contacts.forEach(c => { if ((c.name + ' ' + c.company + ' ' + c.email).toLowerCase().includes(ql)) out.push({ id: 'c' + c.id, icon: '👤', label: c.name || c.company || c.email, sub: 'Contacto', go: 'contacts' }); }); }
    return out.slice(0, 25);
  }, [q]);
  const [sel, setSel] = useState(0);
  return (<div className="overlay" onClick={onClose}><div className="search-box" onClick={e => e.stopPropagation()}>
    <input autoFocus placeholder="Buscar páginas, tareas, contactos…" value={q} onChange={e => { setQ(e.target.value); setSel(0); }} onKeyDown={e => { if (e.key === 'ArrowDown') { e.preventDefault(); setSel(s => Math.min(s + 1, items.length - 1)); } else if (e.key === 'ArrowUp') { e.preventDefault(); setSel(s => Math.max(s - 1, 0)); } else if (e.key === 'Enter') { const it = items[sel]; if (it) onOpen(it.go); } else if (e.key === 'Escape') onClose(); }} />
    <div className="search-res">{items.length === 0 && <div style={{ padding: 16, color: 'var(--muted)' }}>Sin resultados.</div>}{items.map((it, i) => <div key={it.id} className={'r' + (i === sel ? ' sel' : '')} onMouseEnter={() => setSel(i)} onClick={() => onOpen(it.go)}><span>{it.icon}</span><div><div>{it.label}</div><div className="sub">{it.sub}</div></div></div>)}</div>
  </div></div>);
}
