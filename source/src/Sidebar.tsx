import React, { useEffect, useState } from 'react';
import { childrenOf, projects, favorites, trashedPages, createPage, createFromTemplate, TEMPLATES, restorePage, deleteForever, progress, moveProject, movePage } from './store';
import { logout } from './firebase';
import { Page } from './types';

function MoveMenu({ page, projs, onMove, close }: { page: Page; projs: Page[]; onMove: (id: string, parent: string | null) => void; close: () => void }) {
  return (<div className="pop sb-move" onClick={e => e.stopPropagation()}>
    <div className="pop-lbl">Mover a…</div>
    <div className="pop-list">
      {page.parentId && <div className="pop-item" onClick={() => { onMove(page.id, null); close(); }}><span className="pi-ic">↥</span><div>Sacar a Páginas</div></div>}
      {projs.filter(pr => pr.id !== page.parentId && pr.id !== page.id).map(pr => <div key={pr.id} className="pop-item" onClick={() => { onMove(page.id, pr.id); close(); }}><span className="pi-ic">{pr.icon}</span><div>{pr.title || 'Proyecto'}</div></div>)}
    </div>
  </div>);
}

function Tree({ page, depth, view, onOpen, projs, mv, setMv }: { page: Page; depth: number; view: string; onOpen: (id: string) => void; projs: Page[]; mv: string; setMv: (v: string) => void }) {
  const kids = childrenOf(page.id);
  const [open, setOpen] = useState(false);
  return (
    <div>
      <div className={'sb-item' + (view === page.id ? ' active' : '')} style={{ paddingLeft: 6 + depth * 14 }} onClick={() => onOpen(page.id)}>
        <span className="tw" onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}>{kids.length ? (open ? '▾' : '▸') : '·'}</span>
        <span className="ic">{page.icon || '📄'}</span><span className="nm">{page.title || 'Sin título'}</span>
        <span className="mvbtn" title="Mover a proyecto" onClick={(e) => { e.stopPropagation(); setMv(mv === page.id ? '' : page.id); }}>⤴</span>
        <span className="add" onClick={(e) => { e.stopPropagation(); const c = createPage(page.id); setOpen(true); onOpen(c.id); }}>+</span>
      </div>
      {mv === page.id && <MoveMenu page={page} projs={projs} onMove={movePage} close={() => setMv('')} />}
      {open && kids.map(k => <Tree key={k.id} page={k} depth={depth + 1} view={view} onOpen={onOpen} projs={projs} mv={mv} setMv={setMv} />)}
    </div>
  );
}

export default function Sidebar({ className, view, onOpen, theme, setTheme, onSearch, status }:
  { className: string; view: string; onOpen: (id: string) => void; theme: string; setTheme: (t: string) => void; onSearch: () => void; status: string }) {
  const [showTrash, setShowTrash] = useState(false);
  const [tpl, setTpl] = useState(false);
  const [openProj, setOpenProj] = useState<Record<string, boolean>>({});
  const [mv, setMv] = useState('');
  useEffect(() => { if (!tpl) return; const close = () => setTpl(false); const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setTpl(false); }; document.addEventListener('click', close); document.addEventListener('keydown', esc); return () => { document.removeEventListener('click', close); document.removeEventListener('keydown', esc); }; }, [tpl]);
  useEffect(() => { if (!mv) return; const c = () => setMv(''); document.addEventListener('click', c); return () => document.removeEventListener('click', c); }, [mv]);
  const projs = projects();
  const loosePages = childrenOf(null).filter(p => !p.isProject);
  const favs = favorites();
  const tr = trashedPages();
  const nav = (icon: string, label: string, v: string) => <button className={'sb-btn' + (view === v ? ' act' : '')} onClick={() => onOpen(v)}>{icon} {label}</button>;

  return (
    <aside className={'sidebar ' + className}>
      <div className="sb-top"><span className="sb-brand">CarDesign</span><button className="iconbtn" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>{theme === 'dark' ? '☀️' : '🌙'}</button></div>
      <div className="sb-foot" style={{ borderTop: 0, borderBottom: '1px solid var(--line)', position: 'relative' }}>
        <button className="sb-btn" onClick={onSearch}>🔍 Buscar <span style={{ marginLeft: 'auto', fontSize: 11 }}>Ctrl K</span></button>
        {nav('🏠', 'Inicio', 'dashboard')}
        {nav('🗂️', 'Tablero', 'board')}
        {nav('📅', 'Calendario', 'calendar')}
        {nav('💰', 'Finanzas', 'finances')}
        {nav('📊', 'Métricas', 'metrics')}
        {nav('📣', 'Planner redes', 'planner')}
        {nav('👥', 'Contactos', 'contacts')}
        {nav('🗄️', 'NAS', 'nas')}
        <button className="sb-btn" onClick={(e) => { e.stopPropagation(); setTpl(t => !t); }}>✏️ Nueva página ▾</button>
        {tpl && <div className="pop" style={{ left: 8, top: 300, width: 230 }} onClick={e => e.stopPropagation()}><div className="pop-list">
          {TEMPLATES.map(t => <div key={t.key} className="pop-item" onClick={() => { setTpl(false); onOpen(createFromTemplate(null, t.key).id); }}><span className="pi-ic">{t.icon}</span><div>{t.label}</div></div>)}
        </div></div>}
      </div>
      <div className="sb-scroll">
        {favs.length > 0 && <><div className="sb-label">Favoritos</div>{favs.map(p => <div key={'f' + p.id} className={'sb-item' + (view === p.id ? ' active' : '')} onClick={() => onOpen(p.id)}><span className="tw">·</span><span className="ic">{p.icon}</span><span className="nm">{p.title || 'Sin título'}</span></div>)}</>}
        <div className="sb-label">Proyectos</div>
        {projs.map((p) => { const pg = progress(p.id); const kids = childrenOf(p.id); const isOpen = openProj[p.id]; return (
          <div key={p.id}>
            <div className={'sb-item proj' + (view === p.id ? ' active' : '')} onClick={() => onOpen(p.id)}>
              <span className="tw" onClick={(e) => { e.stopPropagation(); setOpenProj(o => ({ ...o, [p.id]: !o[p.id] })); }}>{kids.length ? (isOpen ? '▾' : '▸') : '·'}</span>
              <span className="ic">{p.icon}</span><span className="nm">{p.title || 'Proyecto'}</span>
              <span className="reord"><span onClick={(e) => { e.stopPropagation(); moveProject(p.id, -1); }} title="Subir">▲</span><span onClick={(e) => { e.stopPropagation(); moveProject(p.id, 1); }} title="Bajar">▼</span></span>
              <span className="add" title="Añadir página al proyecto" onClick={(e) => { e.stopPropagation(); const c = createPage(p.id); setOpenProj(o => ({ ...o, [p.id]: true })); onOpen(c.id); }}>+</span>
              <span className="cnt">{pg.tot ? pg.pct + '%' : ''}</span>
            </div>
            {isOpen && kids.map(k => <Tree key={k.id} page={k} depth={1} view={view} onOpen={onOpen} projs={projs} mv={mv} setMv={setMv} />)}
          </div>
        ); })}
        <div className="sb-item add-proj" onClick={() => onOpen(createPage(null, true).id)}><span className="ic">＋</span><span className="nm">Nuevo proyecto</span></div>
        {loosePages.length > 0 && <><div className="sb-label">Páginas sueltas</div>{loosePages.map(p => <Tree key={p.id} page={p} depth={0} view={view} onOpen={onOpen} projs={projs} mv={mv} setMv={setMv} />)}</>}
      </div>
      <div className="sb-foot">
        <div className="syncline"><span className="d" />{status}</div>
        <button className={'sb-btn' + (view === 'docs' ? ' act' : '')} onClick={() => onOpen('docs')}>❔ Ayuda</button>
        <button className="sb-btn" onClick={() => setShowTrash(s => !s)}>🗑️ Papelera {tr.length ? `(${tr.length})` : ''}</button>
        {showTrash && tr.map(p => <div key={'t' + p.id} className="sb-item" style={{ fontSize: 13 }}><span className="ic">{p.icon}</span><span className="nm">{p.title || 'Sin título'}</span><span className="add" style={{ opacity: 1 }} onClick={() => restorePage(p.id)}>↩</span><span className="add" style={{ opacity: 1 }} onClick={() => { if (confirm('¿Eliminar definitivamente?')) deleteForever(p.id); }}>✕</span></div>)}
        <button className="sb-btn" onClick={logout}>↩ Cerrar sesión</button>
      </div>
    </aside>
  );
}
