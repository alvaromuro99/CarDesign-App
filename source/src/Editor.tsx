import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { getPage, getDB, updatePage, setBlockText, setBlock, addBlockAfter, removeBlock, moveBlock, changeType, trashPage, uid } from './store';
import { Block, BlockType, DBData, DBColumn } from './types';
import { caretOffset, setCaret, EMOJIS } from './caret';

const SLASH: { type: BlockType; label: string; ic: string; sub: string }[] = [
  { type: 'text', label: 'Texto', ic: 'T', sub: 'Texto sin formato' },
  { type: 'h1', label: 'Encabezado 1', ic: 'H1', sub: 'Título grande' },
  { type: 'h2', label: 'Encabezado 2', ic: 'H2', sub: 'Título mediano' },
  { type: 'h3', label: 'Encabezado 3', ic: 'H3', sub: 'Título pequeño' },
  { type: 'bulleted', label: 'Lista', ic: '•', sub: 'Lista con viñetas' },
  { type: 'numbered', label: 'Lista numerada', ic: '1.', sub: 'Pasos o secuencias' },
  { type: 'todo', label: 'Tarea', ic: '☑', sub: 'Checklist editable' },
  { type: 'quote', label: 'Cita', ic: '❝', sub: 'Bloque citado' },
  { type: 'callout', label: 'Callout', ic: '💡', sub: 'Bloque destacado' },
  { type: 'code', label: 'Código', ic: '</>', sub: 'Bloque de código' },
  { type: 'table', label: 'Tabla', ic: '▦', sub: 'Tabla simple' },
  { type: 'database', label: 'Base de datos', ic: '🗃️', sub: 'Colección con vistas' },
  { type: 'image', label: 'Imagen', ic: '🖼️', sub: 'Subir o por URL' },
  { type: 'pdf', label: 'PDF / archivo', ic: '📎', sub: 'Adjuntar un PDF' },
  { type: 'divider', label: 'Divisor', ic: '—', sub: 'Línea separadora' },
];
const COVERS = ['linear-gradient(120deg,#e63946,#ff8a5b)', 'linear-gradient(120deg,#4f7cff,#7be3ff)', 'linear-gradient(120deg,#3ec46d,#bff09a)', 'linear-gradient(120deg,#9b5de5,#f15bb5)', 'linear-gradient(120deg,#222,#555)', '#d9a679', '#7a9e7e', '#6b7b8c'];
const OPT_COLORS = ['#e6e6e4', '#ffd9b0', '#ffe7a8', '#c6e8c6', '#b9dcff', '#e0cffc', '#ffcfe0'];
let pendingFocus: { id: string; pos: number } | null = null;
function newDB(): DBData { return { view: 'table', columns: [{ id: uid(), name: 'Nombre', type: 'text' }, { id: uid(), name: 'Estado', type: 'select', options: [{ label: 'Pendiente', color: '#ffd9b0' }, { label: 'En curso', color: '#b9dcff' }, { label: 'Hecho', color: '#c6e8c6' }] }], rows: [{ id: uid(), cells: {} }, { id: uid(), cells: {} }] }; }
function escapeHtml(s: string) { const d = document.createElement('div'); d.innerText = s; return d.innerHTML; }

export default function Editor({ pageId, onOpen }: { pageId: string; onOpen: (id: string) => void }) {
  const page = getPage(pageId)!;
  const [emoji, setEmoji] = useState(false);
  const [coverMenu, setCoverMenu] = useState(false);
  const [slash, setSlash] = useState<{ id: string; q: string; x: number; y: number; sel: number; mention?: boolean } | null>(null);
  const [tb, setTb] = useState<{ x: number; y: number } | null>(null);
  useLayoutEffect(() => { if (pendingFocus) { const el = document.querySelector<HTMLElement>(`[data-bid="${pendingFocus.id}"]`); if (el) setCaret(el, Math.min(pendingFocus.pos, (el.innerText || '').length)); pendingFocus = null; } });
  useEffect(() => { const onSel = () => { const s = window.getSelection(); if (!s || s.isCollapsed || s.rangeCount === 0) { setTb(null); return; } const node = s.anchorNode as any; const el = node?.nodeType === 3 ? node.parentElement : node; if (!el || !el.closest || !el.closest('[data-bid]')) { setTb(null); return; } const r = s.getRangeAt(0).getBoundingClientRect(); setTb({ x: r.left + r.width / 2, y: r.top - 42 }); }; document.addEventListener('selectionchange', onSel); return () => document.removeEventListener('selectionchange', onSel); }, []);
  if (!page) return null;
  const mentionItems = (q: string) => getDB().pages.filter(p => !p.trashed && p.id !== pageId && (p.title || '').toLowerCase().includes(q.toLowerCase())).slice(0, 8);
  const filtered = slash ? (slash.mention ? mentionItems(slash.q) : SLASH.filter(s => s.label.toLowerCase().includes(slash.q.toLowerCase()))) : [];
  function saveActive() { const s = window.getSelection(); const node = s?.anchorNode as any; const el = node?.nodeType === 3 ? node.parentElement : node; const host = el?.closest?.('[data-bid]') as HTMLElement; if (host) setBlockText(pageId, host.dataset.bid!, host.innerHTML); }
  function fmt(cmd: string) { document.execCommand(cmd); saveActive(); }
  function addLink() { const url = prompt('URL del enlace:'); if (url) { document.execCommand('createLink', false, url); saveActive(); } }
  function applySlash(id: string, type: BlockType) { const p = getPage(pageId)!; const b = p.blocks.find(x => x.id === id)!; b.text = ''; if (type === 'divider' || type === 'table' || type === 'image' || type === 'pdf') { changeType(pageId, id, type); const nid = addBlockAfter(pageId, id); pendingFocus = { id: nid, pos: 0 }; } else if (type === 'database') { changeType(pageId, id, 'database'); const bb = getPage(pageId)!.blocks.find(x => x.id === id)!; bb.db = newDB(); setBlock(pageId, id, { db: bb.db }); addBlockAfter(pageId, id); } else { changeType(pageId, id, type); pendingFocus = { id, pos: 0 }; } setSlash(null); }
  function applyMention(id: string, targetId: string) { const tp = getPage(targetId); if (!tp) return; document.execCommand('insertHTML', false, `<a class="pagelink" data-page="${targetId}" contenteditable="false">${tp.icon || '📄'} ${escapeHtml(tp.title || 'Sin título')}</a>&nbsp;`); saveActive(); setSlash(null); }
  function onInput(e: React.FormEvent<HTMLDivElement>, b: Block) {
    const el = e.currentTarget; const html = el.innerHTML; const text = el.innerText;
    if (b.type === 'text') { const md: [RegExp, BlockType][] = [[/^# $/, 'h1'], [/^## $/, 'h2'], [/^### $/, 'h3'], [/^[-*] $/, 'bulleted'], [/^1\. $/, 'numbered'], [/^\[\] $/, 'todo'], [/^\[ \] $/, 'todo'], [/^> $/, 'quote'], [/^``` ?$/, 'code']]; for (const [re, t] of md) { if (re.test(text)) { setBlockText(pageId, b.id, ''); changeType(pageId, b.id, t); pendingFocus = { id: b.id, pos: 0 }; return; } } if (text === '--- ' || text === '---') { setBlockText(pageId, b.id, ''); changeType(pageId, b.id, 'divider'); const nid = addBlockAfter(pageId, b.id); pendingFocus = { id: nid, pos: 0 }; return; } }
    setBlockText(pageId, b.id, html); el.classList.toggle('empty', text.trim().length === 0);
    const sp = text.lastIndexOf('/'); const at = text.lastIndexOf('@'); const r = window.getSelection()?.getRangeAt(0).getBoundingClientRect();
    if (sp >= 0 && (sp === 0 || text[sp - 1] === ' ') && !text.slice(sp).includes(' ')) setSlash({ id: b.id, q: text.slice(sp + 1), x: r ? r.left : 200, y: r ? r.bottom + 6 : 200, sel: 0 });
    else if (at >= 0 && (at === 0 || text[at - 1] === ' ') && !text.slice(at).includes(' ')) setSlash({ id: b.id, q: text.slice(at + 1), x: r ? r.left : 200, y: r ? r.bottom + 6 : 200, sel: 0, mention: true });
    else if (slash) setSlash(null);
  }
  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>, b: Block, idx: number) {
    if ((e.ctrlKey || e.metaKey) && ['b', 'i', 'u'].includes(e.key.toLowerCase())) { e.preventDefault(); fmt(e.key.toLowerCase() === 'b' ? 'bold' : e.key.toLowerCase() === 'i' ? 'italic' : 'underline'); return; }
    if (slash && slash.id === b.id) { if (e.key === 'ArrowDown') { e.preventDefault(); setSlash({ ...slash, sel: Math.min(slash.sel + 1, filtered.length - 1) }); return; } if (e.key === 'ArrowUp') { e.preventDefault(); setSlash({ ...slash, sel: Math.max(slash.sel - 1, 0) }); return; } if (e.key === 'Enter') { e.preventDefault(); const it: any = filtered[slash.sel]; if (it) { slash.mention ? applyMention(b.id, it.id) : applySlash(b.id, it.type); } return; } if (e.key === 'Escape') { setSlash(null); return; } }
    const el = e.currentTarget;
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); const pos = caretOffset(el); const text = el.innerText; const before = text.slice(0, pos); const after = text.slice(pos); if ((b.type === 'bulleted' || b.type === 'numbered' || b.type === 'todo') && text === '') { changeType(pageId, b.id, 'text'); pendingFocus = { id: b.id, pos: 0 }; return; } setBlockText(pageId, b.id, escapeHtml(before)); const cont: BlockType = (b.type === 'bulleted' || b.type === 'numbered' || b.type === 'todo') ? b.type : 'text'; const nid = addBlockAfter(pageId, b.id, { type: cont, text: escapeHtml(after), checked: cont === 'todo' ? false : undefined }); const p = getPage(pageId)!; const cur = p.blocks.find(x => x.id === b.id)!; cur.text = escapeHtml(before); pendingFocus = { id: nid, pos: 0 }; }
    else if (e.key === 'Backspace') { const pos = caretOffset(el); if (pos === 0 && window.getSelection()?.isCollapsed) { if (b.type !== 'text') { e.preventDefault(); changeType(pageId, b.id, 'text'); pendingFocus = { id: b.id, pos: 0 }; return; } if (idx > 0) { e.preventDefault(); const p = getPage(pageId)!; const prev = p.blocks[idx - 1]; const len = (prev.text || '').replace(/<[^>]+>/g, '').length; prev.text = (prev.text || '') + el.innerHTML; removeBlock(pageId, b.id); pendingFocus = { id: prev.id, pos: len }; } } }
  }
  function onClickEditor(e: React.MouseEvent) { const a = (e.target as HTMLElement).closest('.pagelink') as HTMLElement; if (a) { e.preventDefault(); onOpen(a.dataset.page!); } }
  let numCount = 0;
  return (
    <>
      <div className="topbar"><span className="crumb">{page.isProject ? '📁 ' : ''}{page.icon} {page.title || 'Sin título'}</span></div>
      {page.cover && <div className="cover" style={{ background: page.cover }}><div className="cover-actions"><button className="cover-btn" onClick={() => setCoverMenu(m => !m)}>Cambiar</button><button className="cover-btn" onClick={() => updatePage(pageId, { cover: '' })}>Quitar</button></div></div>}
      {coverMenu && <div className="pop" style={{ left: 80, top: 150 }}><div className="swatches">{COVERS.map(c => <div key={c} className="sw" style={{ background: c }} onClick={() => { updatePage(pageId, { cover: c }); setCoverMenu(false); }} />)}</div></div>}
      <div className={'page' + (page.cover ? ' has-cover' : '')} onClick={onClickEditor}>
        <div className="pageicon" onClick={() => setEmoji(e => !e)}>{page.icon || '📄'}</div>
        {emoji && <div className="pop" style={{ left: 30, top: page.cover ? 180 : 90, width: 320 }}><div className="emoji-grid">{EMOJIS.map(em => <button key={em} onClick={() => { updatePage(pageId, { icon: em }); setEmoji(false); }}>{em}</button>)}</div></div>}
        <div className="page-tools no-print">
          {!page.cover && <button onClick={() => updatePage(pageId, { cover: COVERS[0] })}>🖼️ Portada</button>}
          <button onClick={() => updatePage(pageId, { favorite: !page.favorite })}>{page.favorite ? '★ Favorito' : '☆ Favorito'}</button>
          <button onClick={() => window.print()}>⬇ Exportar PDF</button>
          <button onClick={() => { if (confirm('¿Mover a la papelera?')) trashPage(pageId); }}>🗑️ Eliminar</button>
        </div>
        <TitleArea pageId={pageId} title={page.title} />
        {page.blocks.map((b, idx) => { if (b.type === 'numbered') numCount++; else numCount = 0; return <BlockRow key={b.id} page={page} block={b} idx={idx} num={numCount} onInput={onInput} onKeyDown={onKeyDown} />; })}
        <div className="no-print" style={{ height: 40, cursor: 'text' }} onClick={() => { const nid = addBlockAfter(pageId, page.blocks[page.blocks.length - 1]?.id || null); pendingFocus = { id: nid, pos: 0 }; }} />
      </div>
      {tb && <div className="fmtbar no-print" style={{ left: tb.x, top: Math.max(tb.y, 8) }} onMouseDown={e => e.preventDefault()}><button onClick={() => fmt('bold')}><b>B</b></button><button onClick={() => fmt('italic')}><i>i</i></button><button onClick={() => fmt('underline')}><u>U</u></button><button onClick={addLink}>🔗</button></div>}
      {slash && filtered.length > 0 && <div className="pop no-print" style={{ left: slash.x, top: slash.y, width: 280 }}><div className="pop-list">{slash.mention ? (filtered as any[]).map((p, i) => <div key={p.id} className={'pop-item' + (i === slash.sel ? ' sel' : '')} onMouseDown={(e) => { e.preventDefault(); applyMention(slash.id, p.id); }}><span className="pi-ic">{p.icon || '📄'}</span><div>{p.title || 'Sin título'}</div></div>) : (filtered as any[]).map((it, i) => <div key={it.type} className={'pop-item' + (i === slash.sel ? ' sel' : '')} onMouseDown={(e) => { e.preventDefault(); applySlash(slash.id, it.type); }}><span className="pi-ic">{it.ic}</span><div><div>{it.label}</div><div className="pi-sub">{it.sub}</div></div></div>)}</div></div>}
    </>
  );
}

function TitleArea({ pageId, title }: { pageId: string; title: string }) { const ref = useRef<HTMLTextAreaElement>(null); useEffect(() => { if (ref.current) { ref.current.style.height = 'auto'; ref.current.style.height = ref.current.scrollHeight + 'px'; } }, [title]); return <textarea ref={ref} className="title" placeholder="Sin título" defaultValue={title} rows={1} onInput={(e) => { const t = e.currentTarget; t.style.height = 'auto'; t.style.height = t.scrollHeight + 'px'; updatePage(pageId, { title: t.value }); }} />; }

function BlockRow({ page, block, idx, num, onInput, onKeyDown }: { page: any; block: Block; idx: number; num: number; onInput: any; onKeyDown: any }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { if (ref.current && ref.current.innerHTML !== block.text) { ref.current.innerHTML = block.text || ''; ref.current.classList.toggle('empty', !ref.current.innerText.trim()); } }, [block.id, block.type]);
  const ph = block.type === 'text' ? "Escribe '/' para comandos o '@' para enlazar" : block.type.startsWith('h') ? 'Encabezado' : block.type === 'quote' ? 'Cita' : block.type === 'callout' ? 'Escribe algo…' : block.type === 'code' ? 'Código' : '';
  const cls = 'block' + (block.text ? '' : ' empty') + (block.type === 'h1' ? ' b-h1' : block.type === 'h2' ? ' b-h2' : block.type === 'h3' ? ' b-h3' : block.type === 'quote' ? ' b-quote' : block.type === 'code' ? ' b-code' : '') + (block.type === 'todo' && block.checked ? ' todo-done' : '');
  const editable = () => <div ref={ref} data-bid={block.id} className={cls} contentEditable suppressContentEditableWarning data-ph={ph} onInput={(e) => onInput(e, block)} onKeyDown={(e) => onKeyDown(e, block, idx)} />;
  function startDrag(e: React.PointerEvent) { e.preventDefault(); const rows = Array.from(document.querySelectorAll<HTMLElement>('.block-row')); const handle = e.currentTarget as HTMLElement; let targetIdx = idx; const move = (ev: PointerEvent) => { rows.forEach(r => r.classList.remove('dragover-top', 'dragover-bot')); const el = document.elementFromPoint(ev.clientX, ev.clientY)?.closest('.block-row') as HTMLElement | null; if (!el) return; const ti = rows.indexOf(el); if (ti < 0) return; const r = el.getBoundingClientRect(); const below = ev.clientY > r.top + r.height / 2; el.classList.add(below ? 'dragover-bot' : 'dragover-top'); targetIdx = below ? ti + 1 : ti; }; const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); rows.forEach(r => r.classList.remove('dragover-top', 'dragover-bot')); let to = targetIdx; if (to > idx) to -= 1; if (to !== idx && to >= 0) moveBlock(page.id, idx, to); }; window.addEventListener('pointermove', move); window.addEventListener('pointerup', up); }
  let body: React.ReactNode;
  if (block.type === 'divider') body = <hr className="divider" />;
  else if (block.type === 'image') body = <ImageBlock page={page} block={block} />;
  else if (block.type === 'pdf') body = <PdfBlock page={page} block={block} />;
  else if (block.type === 'table') body = <TableBlock page={page} block={block} />;
  else if (block.type === 'database') body = <DatabaseBlock page={page} block={block} />;
  else if (block.type === 'bulleted') body = <div className="li" style={{ flex: 1 }}><span className="bullet">•</span>{editable()}</div>;
  else if (block.type === 'numbered') body = <div className="li" style={{ flex: 1 }}><span className="bullet">{num}.</span>{editable()}</div>;
  else if (block.type === 'todo') body = <div className="li" style={{ flex: 1 }}><span className={'chk' + (block.checked ? ' on' : '')} onClick={() => setBlock(page.id, block.id, { checked: !block.checked })}>{block.checked ? '✓' : ''}</span>{editable()}</div>;
  else if (block.type === 'callout') body = <div className="b-callout" style={{ flex: 1 }}><span className="emoji">💡</span>{editable()}</div>;
  else body = editable();
  return <div className="block-row"><div className="bh no-print"><button data-drag onPointerDown={startDrag}>⠿</button></div>{body}</div>;
}

function ImageBlock({ page, block }: { page: any; block: Block }) {
  const inp = useRef<HTMLInputElement>(null);
  const upload = (file: File) => { if (file.size > 900 * 1024) { alert('Imagen muy grande (máx ~900 KB). Usa una URL.'); return; } const r = new FileReader(); r.onload = () => setBlock(page.id, block.id, { src: String(r.result) }); r.readAsDataURL(file); };
  const pick = () => { const u = prompt('URL de la imagen:', block.src || ''); if (u) setBlock(page.id, block.id, { src: u }); };
  return (<div style={{ flex: 1 }}>{block.src ? <><img className="b-img" src={block.src} /><div className="no-print" style={{ display: 'flex', gap: 8, marginTop: 4 }}><button className="mini" onClick={() => inp.current?.click()}>Cambiar</button><button className="mini" onClick={pick}>URL</button><button className="mini" onClick={() => setBlock(page.id, block.id, { src: '' })}>Quitar</button></div></> : <div className="img-empty no-print"><button className="mini" onClick={() => inp.current?.click()}>📤 Subir archivo</button> <button className="mini" onClick={pick}>🔗 Desde URL</button></div>}<input ref={inp} type="file" accept="image/*" hidden onChange={e => { const f = e.target.files?.[0]; if (f) upload(f); }} /></div>);
}

function PdfBlock({ page, block }: { page: any; block: Block }) {
  const inp = useRef<HTMLInputElement>(null);
  const upload = (file: File) => { if (file.size > 800 * 1024) { alert('PDF muy grande (máx ~800 KB para guardarlo embebido). Para archivos grandes usa un enlace (URL).'); return; } const r = new FileReader(); r.onload = () => setBlock(page.id, block.id, { src: String(r.result), name: file.name }); r.readAsDataURL(file); };
  const pick = () => { const u = prompt('URL del PDF:', block.src || ''); if (u) setBlock(page.id, block.id, { src: u, name: 'PDF' }); };
  return (<div style={{ flex: 1 }}>{block.src ? <div className="pdfbox"><span>📎</span><a href={block.src} target="_blank" rel="noreferrer">{block.name || 'Abrir PDF'}</a><button className="mini no-print" onClick={() => inp.current?.click()}>Cambiar</button><button className="mini no-print" onClick={() => setBlock(page.id, block.id, { src: '' })}>Quitar</button></div> : <div className="img-empty no-print"><button className="mini" onClick={() => inp.current?.click()}>📤 Subir PDF</button> <button className="mini" onClick={pick}>🔗 URL</button></div>}<input ref={inp} type="file" accept="application/pdf" hidden onChange={e => { const f = e.target.files?.[0]; if (f) upload(f); }} /></div>);
}

function TableBlock({ page, block }: { page: any; block: Block }) {
  const rows = block.rows || [['', '']];
  const setCell = (r: number, c: number, v: string) => { const nr = rows.map(x => x.slice()); nr[r][c] = v; setBlock(page.id, block.id, { rows: nr }); };
  const addRow = () => { const cols = rows[0]?.length || 2; setBlock(page.id, block.id, { rows: [...rows.map(x => x.slice()), Array(cols).fill('')] }); };
  const addCol = () => setBlock(page.id, block.id, { rows: rows.map(x => [...x, '']) });
  const toDB = () => { const cols: DBColumn[] = (rows[0] || []).map(h => ({ id: uid(), name: h || 'Columna', type: 'text' as const })); const drows = rows.slice(1).map(r => ({ id: uid(), cells: Object.fromEntries(cols.map((c, i) => [c.id, r[i] || ''])) })); setBlock(page.id, block.id, { type: 'database' as any, db: { view: 'table', columns: cols, rows: drows } } as any); };
  return (<div style={{ flex: 1, overflowX: 'auto' }}><table className="nt"><tbody>{rows.map((row, r) => <tr key={r}>{row.map((cell, c) => <td key={c} contentEditable suppressContentEditableWarning className={r === 0 ? 'th' : ''} onBlur={e => setCell(r, c, e.currentTarget.innerText)} dangerouslySetInnerHTML={{ __html: cell }} />)}</tr>)}</tbody></table><div className="no-print" style={{ display: 'flex', gap: 8, marginTop: 6 }}><button className="mini" onClick={addRow}>+ fila</button><button className="mini" onClick={addCol}>+ columna</button><button className="mini" onClick={toDB}>🗃️ Convertir en base de datos</button></div></div>);
}

function DatabaseBlock({ page, block }: { page: any; block: Block }) {
  const db = block.db || newDB();
  const save = (patch: Partial<DBData>) => setBlock(page.id, block.id, { db: { ...db, ...patch } });
  const setCell = (rowId: string, colId: string, v: any) => save({ rows: db.rows.map(r => r.id === rowId ? { ...r, cells: { ...r.cells, [colId]: v } } : r) });
  const addRow = () => save({ rows: [...db.rows, { id: uid(), cells: {} }] });
  const addCol = () => { const name = prompt('Nombre de la propiedad:'); if (!name) return; const type = (prompt('Tipo: text, select, checkbox, date, person, number', 'text') || 'text') as any; save({ columns: [...db.columns, { id: uid(), name, type, options: type === 'select' ? [] : undefined }] }); };
  const delRow = (id: string) => save({ rows: db.rows.filter(r => r.id !== id) });
  const members = getDB().members; const selects = db.columns.filter(c => c.type === 'select');
  function CellEditor({ row, col }: any) {
    const v = row.cells[col.id];
    if (col.type === 'checkbox') return <input type="checkbox" checked={!!v} onChange={e => setCell(row.id, col.id, e.target.checked)} />;
    if (col.type === 'date') return <input type="date" className="dbinp" value={v || ''} onChange={e => setCell(row.id, col.id, e.target.value)} />;
    if (col.type === 'person') return <select className="dbinp" value={v || ''} onChange={e => setCell(row.id, col.id, e.target.value)}><option value="">—</option>{members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select>;
    if (col.type === 'select') { const opts = col.options || []; return <select className="dbinp dbsel" value={v || ''} onChange={e => { if (e.target.value === '__new') { const lbl = prompt('Nueva opción:'); if (lbl) { const color = OPT_COLORS[opts.length % OPT_COLORS.length]; save({ columns: db.columns.map(c => c.id === col.id ? { ...c, options: [...opts, { label: lbl, color }] } : c) }); setCell(row.id, col.id, lbl); } } else setCell(row.id, col.id, e.target.value); }}><option value="">—</option>{opts.map(o => <option key={o.label} value={o.label}>{o.label}</option>)}<option value="__new">+ Nueva opción…</option></select>; }
    return <input className="dbinp" value={v || ''} onChange={e => setCell(row.id, col.id, e.target.value)} />;
  }
  const optColor = (col: any, val: any) => (col.options || []).find((o: any) => o.label === val)?.color || 'var(--bg2)';
  const firstText = db.columns.find(c => c.type === 'text') || db.columns[0];
  return (
    <div style={{ flex: 1, overflowX: 'auto' }}>
      <div className="dbbar no-print"><button className={'mini' + (db.view === 'table' ? ' on' : '')} onClick={() => save({ view: 'table' })}>▦ Tabla</button><button className={'mini' + (db.view === 'board' ? ' on' : '')} onClick={() => save({ view: 'board', groupBy: db.groupBy || selects[0]?.id })}>▥ Tablero</button><button className={'mini' + (db.view === 'gallery' ? ' on' : '')} onClick={() => save({ view: 'gallery' })}>▢ Galería</button>{db.view === 'board' && selects.length > 0 && <select className="dbinp" value={db.groupBy || ''} onChange={e => save({ groupBy: e.target.value })}>{selects.map(c => <option key={c.id} value={c.id}>Agrupar: {c.name}</option>)}</select>}<span style={{ flex: 1 }} /><button className="mini" onClick={addCol}>+ Propiedad</button></div>
      {db.view === 'table' && <table className="nt"><thead><tr>{db.columns.map(c => <th key={c.id}>{c.name}</th>)}<th></th></tr></thead><tbody>{db.rows.map(row => <tr key={row.id}>{db.columns.map(col => <td key={col.id} style={col.type === 'select' ? { background: row.cells[col.id] ? optColor(col, row.cells[col.id]) : undefined } : undefined}><CellEditor row={row} col={col} /></td>)}<td><button className="xrow no-print" onClick={() => delRow(row.id)}>×</button></td></tr>)}</tbody></table>}
      {db.view === 'board' && (() => { const gb = db.columns.find(c => c.id === db.groupBy); const opts = gb?.options || []; const groups = [...opts.map(o => o.label), '']; return (<div className="board" style={{ padding: 0 }}>{groups.map(g => <div className="bcol" key={g || 'none'} style={{ minWidth: 220, width: 220 }}><div className="bcol-h">{g || 'Sin'} <span className="c">{db.rows.filter(r => (r.cells[db.groupBy!] || '') === g).length}</span></div><div className="drop">{db.rows.filter(r => (r.cells[db.groupBy!] || '') === g).map(r => <div className="tcard" key={r.id} style={{ borderLeftColor: g ? optColor(gb, g) : 'var(--line)' }}><div className="tc-main"><div className="tc-title">{r.cells[firstText?.id] || 'Sin título'}</div></div></div>)}</div></div>)}</div>); })()}
      {db.view === 'gallery' && <div className="gallery">{db.rows.map(r => <div className="gcard" key={r.id}><div className="gtitle">{r.cells[firstText?.id] || 'Sin título'}</div>{db.columns.filter(c => c !== firstText).map(c => <div key={c.id} className="gprop"><span className="gk">{c.name}:</span> {c.type === 'checkbox' ? (r.cells[c.id] ? '✅' : '—') : c.type === 'person' ? (members.find(m => m.id === r.cells[c.id])?.name || '—') : (r.cells[c.id] || '—')}</div>)}</div>)}</div>}
      {db.view === 'table' && <button className="mini no-print" style={{ marginTop: 6 }} onClick={addRow}>+ Fila</button>}
    </div>
  );
}
