import React, { useEffect, useState } from 'react';
import { useStore } from './useStore';
import Sidebar from './Sidebar';
import Editor from './Editor';
import Board from './Board';
import Calendar from './Calendar';
import Finances from './Finances';
import Planner from './Planner';
import Contacts from './Contacts';
import Metrics from './Metrics';
import Nas from './Nas';
import Dashboard from './Dashboard';
import Docs from './Docs';
import Search from './Search';
import Icon from './icons';
import { getPage, tasks, members } from './store';
import { initFirebase, login, setStatusListener, getEmail } from './firebase';

export default function App() {
  useStore();
  const [theme, setTheme] = useState(() => localStorage.getItem('cn_theme') || 'dark');
  const [view, setView] = useState<string>('dashboard');
  const [user, setUser] = useState<any>(undefined);
  const [status, setStatus] = useState('Conectando…');
  const [search, setSearch] = useState(false);
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => { document.documentElement.classList.toggle('dark', theme === 'dark'); document.body.classList.toggle('dark', theme === 'dark'); localStorage.setItem('cn_theme', theme); }, [theme]);
  useEffect(() => { setStatusListener(setStatus); initFirebase(u => setUser(u)); }, []);
  useEffect(() => { const h = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setSearch(true); } }; window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h); }, []);

  const open = (v: string) => { setView(v); setNavOpen(false); };

  if (user === undefined) return <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>Cargando…</div>;
  if (user === null) return (<div className="login"><div className="login-card"><h2>CarDesign Workspace</h2><p>Inicia sesión para acceder a tu espacio sincronizado.</p><button className="gbtn" onClick={login}>Entrar con Google</button><p className="err">{status.startsWith('Error') ? status : ''}</p></div></div>);

  const pageExists = !['dashboard', 'board', 'calendar', 'finances', 'planner', 'contacts', 'metrics', 'nas', 'docs'].includes(view) && getPage(view) && !getPage(view)!.trashed;
  const email = getEmail();
  const me = members().find(m => m.emails && m.emails.includes(email));
  const meName = me ? me.name : (email ? email.split('@')[0] : 'CarDesign Team');
  const initial = (meName[0] || 'C').toUpperCase();
  const overdue = tasks().filter(t => t.status !== 'done' && t.due && t.due < new Date().toISOString().slice(0, 10)).length;

  return (
    <div className="app">
      <button className="hamb" onClick={() => setNavOpen(true)}>☰</button>
      {navOpen && <div className="sb-backdrop" onClick={() => setNavOpen(false)} />}
      <Sidebar className={navOpen ? 'open' : ''} view={view} onOpen={open} theme={theme} setTheme={setTheme} status={status} />
      <div className="maincol">
        <header className="apphdr">
          <button className="hsearch" onClick={() => setSearch(true)}><Icon n="search" size={15} /><span>Buscar…</span><kbd>⌘K</kbd></button>
          <button className="hicon" title="Tareas vencidas" onClick={() => open('board')}><Icon n="bell" size={18} />{overdue > 0 && <span className="hbadge">{overdue}</span>}</button>
          <button className="hicon" title="Tema" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}><Icon n={theme === 'dark' ? 'sun' : 'moon'} size={18} /></button>
          <div className="huser" style={me ? { ['--uc' as any]: me.color } : undefined}>
            <div className="havatar" style={me ? { background: me.color } : undefined}>{initial}</div>
            <div className="hu-meta"><b>{meName}</b><span>Sesión iniciada</span></div>
          </div>
        </header>
        <div className="main">
          {view === 'dashboard' ? <Dashboard onOpen={open} />
            : view === 'board' ? <Board onOpenProject={open} />
            : view === 'calendar' ? <Calendar onOpenProject={open} />
            : view === 'finances' ? <Finances />
            : view === 'planner' ? <Planner />
            : view === 'contacts' ? <Contacts />
            : view === 'metrics' ? <Metrics />
            : view === 'nas' ? <Nas />
            : view === 'docs' ? <Docs />
            : pageExists ? <Editor key={view} pageId={view} onOpen={open} />
            : <div style={{ padding: 60, color: 'var(--muted)' }}>Selecciona una sección.</div>}
        </div>
      </div>
      {search && <Search onClose={() => setSearch(false)} onOpen={(id) => { setSearch(false); open(id); }} />}
    </div>
  );
}
