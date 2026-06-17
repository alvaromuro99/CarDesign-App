import React, { useEffect, useState } from 'react';
import { childrenOf, projects, favorites, trashedPages, createPage, createFromTemplate, TEMPLATES, restorePage, deleteForever, progress, moveProject } from './store';
import { logout } from './firebase';
import { Page } from './types';

function Tree({ page, depth, view, onOpen }: { page: Page; depth: number; view: string; onOpen: (id: string) => void }) {
  const kids = childrenOf(page.id);
  const [open, setOpen] = useState(false);
  return (
    <div>
      <div className={'sb-item' + (view === page.id ? ' active' : '')} style={{ paddingLeft: 6 + depth * 14 }} onClick={() => onOpen(page.id)}>
        <span className="tw" onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}>{kids.length ? (open ? '▾' : '▸') : '·'}</span>
        <span className="ic">{page.icon || '📄'}</span><span className="nm">{page.title || 'Sin título'}</span>
        <span className="add" onClick={(e) => { e.stopPropagation(); const c = createPage(page.id); setOpen(true); onOpen(c.id); }}>+</span>
      </div>
      {open && kids.map(k => <Tree key={k.id} page={k} depth={depth + 1} view={view} onOpen={onOpen} />)}
    </div>
  );
}

export default function Sidebar({ className, view, onOpen, theme, setTheme, onSearch, status }:
  { className: string; view: string; onOpen: (id: string) => void; theme: string; setTheme: (t: string) => void; onSearch: () => void; status: string }) {
  const [showTrash, setShowTrash] = useState(false);
  const [tpl, setTpl] = useState(false);
  useEffect(() => { if (!tpl) return; const close = () => setTpl(false); const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setTpl(false); }; document.addEventListener('click', close); document.addEventListener('keydown', esc); return () => { document.removeEventListener('click', close); document.removeEventListener('keydown', esc); }; }, [tpl]);
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
        {projs.map((p, i) => { const pg = progress(p.id); return (
          <div key={p.id}>
            <div className={'sb-item' + (view === p.id ? ' active' : '')} onClick={() => onOpen(p.id)}>
              <span className="ic">{p.icon}</span><span className="nm">{p.title || 'Proyecto'}</span>
              <span className="reord"><span onClick={(e) => { e.stopPropagation(); moveProject(p.id, -1); }} title="Subir">▲</span><span onClick={(e) => { e.stopPropagation(); moveProject(p.id, 1); }} title="Bajar">▼</span></span>
              <span className="cnt">{pg.tot ? pg.d + '/' + pg.tot : ''}</span>
            </div>
            {childrenOf(p.id).map(k => <Tree key={k.id} page={k} depth={1} view={view} onOpen={onOpen} />)}
          </div>
        ); })}
        <div className="sb-item add-proj" onClick={() => onOpen(createPage(null, true).id)}><span className="ic">＋</span><span className="nm">Nuevo proyecto</span></div>
        {loosePages.length > 0 && <><div className="sb-label">Páginas</div>{loosePages.map(p => <Tree key={p.id} page={p} depth={0} view={view} onOpen={onOpen} />)}</>}
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
