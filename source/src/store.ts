import { DB, Page, Block, BlockType, Task, Status, Movement, Post, PostStatus, Contact, EventItem, Metric, Sale } from './types';
const KEY = 'cardesign_unified_v1';
export const uid = () => Math.random().toString(36).slice(2, 10);

export const STATUS: Record<Status, { label: string; color: string }> = {
  backlog: { label: 'Backlog', color: '#8b8f9a' }, todo: { label: 'Por hacer', color: '#9aa6b8' },
  doing: { label: 'En progreso', color: '#f4a623' }, blocked: { label: 'Bloqueada', color: '#e63946' }, done: { label: 'Hecha', color: '#3ec46d' },
};
export const STATUS_ORDER: Status[] = ['backlog', 'todo', 'doing', 'blocked', 'done'];
export const PRIO = { alta: { label: 'Alta', color: '#e63946' }, media: { label: 'Media', color: '#f4a623' }, baja: { label: 'Baja', color: '#4f7cff' } };
export const POST_STATUS: Record<PostStatus, { label: string; color: string }> = { idea: { label: 'Idea', color: '#9aa6b8' }, guion: { label: 'Guion', color: '#4f7cff' }, grabado: { label: 'Grabado', color: '#9b5de5' }, editado: { label: 'Editado', color: '#f4a623' }, publicado: { label: 'Publicado', color: '#3ec46d' } };
export const POST_ORDER: PostStatus[] = ['idea', 'guion', 'grabado', 'editado', 'publicado'];
export const PLATFORMS = ['Instagram', 'Reel', 'TikTok', 'YouTube', 'Web', 'Story'];
export const EVENT_COLORS = ['#4f7cff', '#e63946', '#3ec46d', '#9b5de5', '#f4a623', '#00b8d9'];

function emptyDB(): DB {
  return { members: [{ id: 'alvaro', name: 'Álvaro', color: '#4f7cff', emails: ['revistacardesign@gmail.com', 'alvaro.murodunabeitia@gmail.com'] }, { id: 'alfon', name: 'Alfon', color: '#e63946', emails: ['alfondcc@telycom4.com'] }], pages: [], tasks: [], finances: [], posts: [], contacts: [], events: [], metrics: [], sales: [] };
}
function ensure(d: any): DB {
  const e = emptyDB();
  if (!d.members || !d.members.length) d.members = e.members;
  ['pages', 'tasks', 'finances', 'posts', 'contacts', 'events', 'metrics', 'sales'].forEach(k => { if (!Array.isArray(d[k])) d[k] = []; });
  d.finances.forEach((m: any) => { if (m.iva === undefined) m.iva = 0; });
  return d as DB;
}

let db: DB;
try { const r = localStorage.getItem(KEY); db = r ? ensure(JSON.parse(r)) : emptyDB(); } catch { db = emptyDB(); }

const subs = new Set<() => void>();
export function subscribe(fn: () => void) { subs.add(fn); return () => subs.delete(fn); }
let applyingRemote = false;
export function isApplyingRemote() { return applyingRemote; }
function persist() { localStorage.setItem(KEY, JSON.stringify(db)); }
function emit() { persist(); subs.forEach(f => f()); }

export const getDB = () => db;
export function setDB(next: any, remote = false) { db = ensure(next); applyingRemote = remote; emit(); applyingRemote = false; }

/* pages */
export const getPage = (id: string) => db.pages.find(p => p.id === id);
export const childrenOf = (pid: string | null) => db.pages.filter(p => p.parentId === pid && !p.trashed).sort((a, b) => a.order - b.order);
export const projects = () => db.pages.filter(p => p.isProject && !p.trashed).sort((a, b) => a.order - b.order);
export const favorites = () => db.pages.filter(p => p.favorite && !p.trashed);
export const trashedPages = () => db.pages.filter(p => p.trashed);
export const members = () => db.members;
export const member = (id: string) => db.members.find(m => m.id === id);

export function createPage(parentId: string | null = null, isProject = false): Page {
  const order = isProject ? projects().length : childrenOf(parentId).length;
  const p: Page = { id: uid(), parentId, title: '', icon: isProject ? '📁' : '📄', cover: '', blocks: [{ id: uid(), type: 'text', text: '' }], favorite: false, trashed: false, collapsed: false, isProject, order, createdAt: Date.now(), updatedAt: Date.now() };
  db.pages.push(p); emit(); return p;
}
export function updatePage(id: string, patch: Partial<Page>) { const p = getPage(id); if (!p) return; Object.assign(p, patch, { updatedAt: Date.now() }); emit(); }
function descendants(id: string): string[] { const out = [id]; const st = [id]; while (st.length) { const c = st.pop()!; db.pages.filter(p => p.parentId === c).forEach(k => { out.push(k.id); st.push(k.id); }); } return out; }
export function trashPage(id: string) { descendants(id).forEach(i => { const p = getPage(i); if (p) p.trashed = true; }); emit(); }
export function restorePage(id: string) { const p = getPage(id); if (p) { p.trashed = false; emit(); } }
export function deleteForever(id: string) { const ids = descendants(id); db.pages = db.pages.filter(p => !ids.includes(p.id)); db.tasks = db.tasks.filter(t => !ids.includes(t.projectId)); emit(); }
/* reordenar proyectos en el menú */
export function moveProject(id: string, dir: -1 | 1) {
  const ps = projects(); const i = ps.findIndex(p => p.id === id); const j = i + dir; if (i < 0 || j < 0 || j >= ps.length) return;
  const a = ps[i], b = ps[j]; const ao = a.order; a.order = b.order; b.order = ao; emit();
}

/* blocks */
export function setBlockText(pid: string, bid: string, text: string) { const p = getPage(pid); if (!p) return; const b = p.blocks.find(x => x.id === bid); if (!b) return; b.text = text; p.updatedAt = Date.now(); persist(); }
export function setBlock(pid: string, bid: string, patch: Partial<Block>) { const p = getPage(pid); if (!p) return; const b = p.blocks.find(x => x.id === bid); if (!b) return; Object.assign(b, patch); p.updatedAt = Date.now(); emit(); }
export function addBlockAfter(pid: string, bid: string | null, block?: Partial<Block>): string { const p = getPage(pid); if (!p) return ''; const nb: Block = { id: uid(), type: 'text', text: '', ...block }; const idx = bid ? p.blocks.findIndex(x => x.id === bid) : p.blocks.length - 1; p.blocks.splice(idx + 1, 0, nb); p.updatedAt = Date.now(); emit(); return nb.id; }
export function removeBlock(pid: string, bid: string) { const p = getPage(pid); if (!p) return; p.blocks = p.blocks.filter(x => x.id !== bid); if (!p.blocks.length) p.blocks.push({ id: uid(), type: 'text', text: '' }); p.updatedAt = Date.now(); emit(); }
export function moveBlock(pid: string, from: number, to: number) { const p = getPage(pid); if (!p) return; const [m] = p.blocks.splice(from, 1); p.blocks.splice(to, 0, m); p.updatedAt = Date.now(); emit(); }
export function changeType(pid: string, bid: string, type: BlockType) { const p = getPage(pid); if (!p) return; const b = p.blocks.find(x => x.id === bid); if (!b) return; b.type = type; if (type === 'todo' && b.checked === undefined) b.checked = false; if (type === 'table' && !b.rows) b.rows = [['', ''], ['', '']]; p.updatedAt = Date.now(); emit(); }

/* tasks */
export const tasks = () => db.tasks;
export const projectTasks = (pid: string) => db.tasks.filter(t => t.projectId === pid);
export function progress(pid: string) { const ts = projectTasks(pid); const d = ts.filter(t => t.status === 'done').length; return { d, tot: ts.length, pct: ts.length ? Math.round(d / ts.length * 100) : 0 }; }
function nextOrder(s: Status) { const ts = db.tasks.filter(t => t.status === s); return ts.length ? Math.max(...ts.map(t => t.order || 0)) + 1 : 0; }
export function createTask(status: Status, projectId: string): Task { const t: Task = { id: uid(), projectId, title: 'Nueva tarea', status, priority: 'media', assignee: '', due: '', labels: [], notes: '', comments: [], subtasks: [], order: nextOrder(status), createdAt: Date.now() }; db.tasks.unshift(t); emit(); return t; }
export function updateTask(id: string, patch: Partial<Task>) { const t = db.tasks.find(x => x.id === id); if (!t) return; Object.assign(t, patch); emit(); }
export function deleteTask(id: string) { db.tasks = db.tasks.filter(t => t.id !== id); emit(); }
export function reindexStatus(status: Status, orderedIds: string[]) { orderedIds.forEach((id, i) => { const t = db.tasks.find(x => x.id === id); if (t) { t.status = status; t.order = i; } }); emit(); }

/* finanzas */
export const finances = () => db.finances;
export function addMovement(m?: Partial<Movement>): Movement { const mv: Movement = { id: uid(), date: new Date().toISOString().slice(0, 10), concept: '', category: 'General', type: 'ingreso', amount: 0, iva: 0, who: 'empresa', ...m }; db.finances.unshift(mv); emit(); return mv; }
export function updateMovement(id: string, patch: Partial<Movement>) { const m = db.finances.find(x => x.id === id); if (!m) return; Object.assign(m, patch); emit(); }
export function deleteMovement(id: string) { db.finances = db.finances.filter(x => x.id !== id); emit(); }

/* ventas (anuario + publicidad) */
export const sales = () => db.sales;
export function addSale(s?: Partial<Sale>): Sale { const v: Sale = { id: uid(), date: new Date().toISOString().slice(0, 10), type: 'anuario', concept: '', units: 1, amount: 0, iva: 0, who: 'empresa', ...s }; db.sales.unshift(v); emit(); return v; }
export function updateSale(id: string, patch: Partial<Sale>) { const v = db.sales.find(x => x.id === id); if (!v) return; Object.assign(v, patch); emit(); }
export function deleteSale(id: string) { db.sales = db.sales.filter(x => x.id !== id); emit(); }

/* contactos */
export const contacts = () => db.contacts;
export function addContact(c?: Partial<Contact>): Contact { const v: Contact = { id: uid(), name: '', email: '', phone: '', company: '', role: '', status: 'Nuevo', notes: '', ...c }; db.contacts.unshift(v); emit(); return v; }
export function updateContact(id: string, patch: Partial<Contact>) { const v = db.contacts.find(x => x.id === id); if (!v) return; Object.assign(v, patch); emit(); }
export function deleteContact(id: string) { db.contacts = db.contacts.filter(x => x.id !== id); emit(); }

/* eventos del calendario */
export const events = () => db.events;
export function addEvent(e?: Partial<EventItem>): EventItem { const v: EventItem = { id: uid(), title: 'Evento', date: new Date().toISOString().slice(0, 10), color: EVENT_COLORS[0], notes: '', ...e }; db.events.unshift(v); emit(); return v; }
export function updateEvent(id: string, patch: Partial<EventItem>) { const v = db.events.find(x => x.id === id); if (!v) return; Object.assign(v, patch); emit(); }
export function deleteEvent(id: string) { db.events = db.events.filter(x => x.id !== id); emit(); }

/* métricas */
export const posts = () => db.posts;
export function addPost(p?: Partial<Post>): Post { const v: Post = { id: uid(), title: 'Nueva idea', platform: 'Instagram', status: 'idea', date: '', assignee: '', notes: '', order: db.posts.filter(x => x.status === (p?.status || 'idea')).length, ...p }; db.posts.unshift(v); emit(); return v; }
export function updatePost(id: string, patch: Partial<Post>) { const v = db.posts.find(x => x.id === id); if (!v) return; Object.assign(v, patch); emit(); }
export function deletePost(id: string) { db.posts = db.posts.filter(x => x.id !== id); emit(); }
export function reindexPosts(status: PostStatus, orderedIds: string[]) { orderedIds.forEach((id, i) => { const v = db.posts.find(x => x.id === id); if (v) { v.status = status; v.order = i; } }); emit(); }

export const metrics = () => db.metrics;
export function addMetric(m?: Partial<Metric>): Metric { const v: Metric = { id: uid(), date: new Date().toISOString().slice(0, 10), channel: 'Instagram', metric: 'Seguidores', value: 0, ...m }; db.metrics.unshift(v); emit(); return v; }
export function updateMetric(id: string, patch: Partial<Metric>) { const v = db.metrics.find(x => x.id === id); if (!v) return; Object.assign(v, patch); emit(); }
export function deleteMetric(id: string) { db.metrics = db.metrics.filter(x => x.id !== id); emit(); }

/* plantillas */
export const TEMPLATES = [
  { key: 'blank', label: 'Página en blanco', icon: '📄', build: () => ({ title: '', icon: '📄', blocks: [{ type: 'text', text: '' }] }) },
  { key: 'car', label: 'Ficha de coche', icon: '🚗', build: () => ({ title: 'Nuevo coche', icon: '🚗', blocks: [{ type: 'h2', text: 'Datos' }, { type: 'table', text: '', rows: [['Campo', 'Valor'], ['Marca', ''], ['Modelo', ''], ['Año', ''], ['Propietario', ''], ['Estado', ''], ['Contacto', '']] }, { type: 'h2', text: 'Notas' }, { type: 'text', text: '' }] }) },
  { key: 'article', label: 'Artículo / reportaje', icon: '📰', build: () => ({ title: 'Nuevo artículo', icon: '📰', blocks: [{ type: 'callout', text: 'Resumen / entradilla…' }, { type: 'h2', text: 'Introducción' }, { type: 'text', text: '' }, { type: 'h2', text: 'Desarrollo' }, { type: 'text', text: '' }, { type: 'h2', text: 'Conclusión' }, { type: 'text', text: '' }, { type: 'h3', text: 'Fuentes' }, { type: 'bulleted', text: '' }] }) },
  { key: 'interview', label: 'Entrevista', icon: '🎙️', build: () => ({ title: 'Entrevista a …', icon: '🎙️', blocks: [{ type: 'callout', text: 'Quién, dónde y cuándo' }, { type: 'h2', text: 'Preguntas' }, { type: 'numbered', text: '' }, { type: 'h2', text: 'Respuestas / notas' }, { type: 'text', text: '' }] }) },
  { key: 'meeting', label: 'Reunión', icon: '🗓️', build: () => ({ title: 'Reunión ' + new Date().toLocaleDateString('es-ES'), icon: '🗓️', blocks: [{ type: 'h2', text: 'Asistentes' }, { type: 'bulleted', text: '' }, { type: 'h2', text: 'Temas' }, { type: 'bulleted', text: '' }, { type: 'h2', text: 'Acuerdos / acciones' }, { type: 'todo', text: '', checked: false }] }) },
  { key: 'event', label: 'Evento', icon: '🎪', build: () => ({ title: 'Nuevo evento', icon: '🎪', blocks: [{ type: 'callout', text: 'Fecha, lugar y objetivo' }, { type: 'h2', text: 'Logística' }, { type: 'todo', text: '', checked: false }, { type: 'h2', text: 'Contactos / proveedores' }, { type: 'table', text: '', rows: [['Nombre', 'Rol', 'Contacto'], ['', '', '']] }, { type: 'h2', text: 'Escaleta' }, { type: 'numbered', text: '' }] }) },
  { key: 'tasks', label: 'Lista de tareas', icon: '✅', build: () => ({ title: 'Tareas', icon: '✅', blocks: [{ type: 'todo', text: '', checked: false }, { type: 'todo', text: '', checked: false }, { type: 'todo', text: '', checked: false }] }) },
];
export function createFromTemplate(parentId: string | null, key: string, isProject = false): Page {
  const tpl = TEMPLATES.find(t => t.key === key) || TEMPLATES[0];
  const t = tpl.build() as any;
  const order = isProject ? projects().length : childrenOf(parentId).length;
  const p: Page = { id: uid(), parentId, title: t.title, icon: t.icon, cover: '', blocks: t.blocks.map((b: any) => ({ id: uid(), ...b })), favorite: false, trashed: false, collapsed: false, isProject, order, createdAt: Date.now(), updatedAt: Date.now() };
  db.pages.push(p); emit(); return p;
}
