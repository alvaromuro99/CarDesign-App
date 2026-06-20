import React, { useRef, useState, useMemo } from 'react';
import { contacts, allContacts, addContact, updateContact, deleteContact } from './store';
const STATUSES = ['Nuevo', 'Contactado', 'Interesado', 'Confirmado', 'Cliente', 'Patrocinador', 'Descartado'];
const ESTADOS = ['Por verificar', 'Activo', 'Ya no trabaja ahí', 'No encontrado'];
const FIELDS: [string, string][] = [['name', 'Nombre'], ['company', 'Empresa'], ['email', 'Email'], ['phone', 'Teléfono'], ['role', 'Rol'], ['clase', 'Clase'], ['industria', 'Industria'], ['interes', 'Interés'], ['estado', 'Estado'], ['notes', 'Notas']];
function download(name: string, content: BlobPart, type: string) { const u = URL.createObjectURL(new Blob([content], { type })); const a = document.createElement('a'); a.href = u; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(u), 2000); }
function parseCSV(text: string): string[][] {
  const rows: string[][] = []; let row: string[] = [], cur = '', q = false;
  for (let i = 0; i < text.length; i++) { const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; }
    else { if (c === '"') q = true; else if (c === ',' || c === ';') { row.push(cur); cur = ''; } else if (c === '\n') { row.push(cur); rows.push(row); row = []; cur = ''; } else if (c !== '\r') cur += c; } }
  if (cur || row.length) { row.push(cur); rows.push(row); }
  return rows.filter(r => r.some(c => c.trim()));
}
const mapHeader = (h: string): string => { const s = h.toLowerCase().trim();
  if (/nombre|name|contacto/.test(s)) return 'name'; if (/empresa|company|marca/.test(s)) return 'company';
  if (/mail|correo/.test(s)) return 'email'; if (/tel|m[oó]vil|phone|whats/.test(s)) return 'phone';
  if (/rol|cargo|puesto|role/.test(s)) return 'role'; if (/estado|status/.test(s)) return 'status';
  if (/nota|coment|observ/.test(s)) return 'notes'; return ''; };
function importRows(rows: string[][]) {
  if (!rows.length) return 0; const head = rows[0].map(mapHeader);
  const hasHeader = head.some(Boolean); const cols = hasHeader ? head : ['name', 'company', 'email', 'phone', 'role', 'status', 'notes'];
  const data = hasHeader ? rows.slice(1) : rows; let n = 0;
  data.forEach(r => { const c: any = {}; cols.forEach((f, i) => { if (f && r[i] != null) c[f] = String(r[i]).trim(); }); if (c.name || c.company || c.email) { addContact(c); n++; } });
  return n;
}

export default function Contacts() {
  const [q, setQ] = useState('');
  const [fClase, setFClase] = useState('');
  const [fInteres, setFInteres] = useState('');
  const [fEstado, setFEstado] = useState('');
  const [fEmpresa, setFEmpresa] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const all = allContacts();

  const claseOpts = useMemo(() => Array.from(new Set(all.map(c => c.clase).filter(Boolean))).sort(), [all.length]);
  const interesOpts = useMemo(() => Array.from(new Set(all.map(c => c.interes).filter(Boolean))).sort(), [all.length]);
  const empresaOpts = useMemo(() => Array.from(new Set(all.map(c => c.company).filter(Boolean))).sort((a, b) => a!.localeCompare(b!)), [all.length]);

  const list = all.filter(c => {
    if (fClase && c.clase !== fClase) return false;
    if (fInteres && c.interes !== fInteres) return false;
    if (fEstado && (c.estado || '') !== fEstado) return false;
    if (fEmpresa && c.company !== fEmpresa) return false;
    if (q) { const blob = (c.name + ' ' + c.company + ' ' + c.email + ' ' + c.role + ' ' + (c.clase || '') + ' ' + (c.industria || '') + ' ' + (c.interes || '')).toLowerCase(); if (!blob.includes(q.toLowerCase())) return false; }
    return true;
  });
  const clearF = () => { setQ(''); setFClase(''); setFInteres(''); setFEstado(''); setFEmpresa(''); };

  const exportCSV = () => { const head = FIELDS.map(f => f[1]).join(','); const body = list.map(c => FIELDS.map(f => `"${String((c as any)[f[0]] || '').replace(/"/g, '""')}"`).join(',')).join('\n'); download('contactos.csv', '﻿' + head + '\n' + body, 'text/csv;charset=utf-8'); };
  const exportXLSX = async () => { const XLSX: any = await import(/* @vite-ignore */ 'https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs'); const ws = XLSX.utils.json_to_sheet(list.map(c => ({ Nombre: c.name, Empresa: c.company, Email: c.email, Teléfono: c.phone, Rol: c.role, Clase: c.clase, Industria: c.industria, Interés: c.interes, Estado: c.estado, Notas: c.notes }))); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Contactos'); XLSX.writeFile(wb, 'contactos.xlsx'); };
  const onFile = async (f: File) => {
    if (/\.xlsx?$/i.test(f.name)) { const XLSX: any = await import(/* @vite-ignore */ 'https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs'); const wb = XLSX.read(await f.arrayBuffer()); const ws = wb.Sheets[wb.SheetNames[0]]; const rows = XLSX.utils.sheet_to_json(ws, { header: 1 }) as string[][]; const n = importRows(rows.map(r => r.map(c => c == null ? '' : String(c)))); alert(`Importados ${n} contactos.`); }
    else { const n = importRows(parseCSV(await f.text())); alert(`Importados ${n} contactos.`); }
  };
  const sel = "dbinp";
  const estadoColor = (e?: string) => e === 'Activo' ? '#3ec46d' : e === 'Ya no trabaja ahí' ? '#e63946' : e === 'No encontrado' ? '#f4a623' : 'var(--muted)';

  return (<div className="boardwrap"><div className="topbar"><span className="crumb">👥 Contactos</span><span className="crumb" style={{ color: 'var(--muted)' }}>· {list.length} / {all.length}</span></div>
    <div className="toolbar" style={{ flexWrap: 'wrap', gap: 8 }}>
      <input className="search2" placeholder="Buscar nombre, empresa, rol…" value={q} onChange={e => setQ(e.target.value)} />
      <select className={sel} style={{ maxWidth: 170 }} value={fClase} onChange={e => setFClase(e.target.value)}><option value="">Clase (todas)</option>{claseOpts.map(o => <option key={o} value={o}>{o}</option>)}</select>
      <select className={sel} style={{ maxWidth: 160 }} value={fInteres} onChange={e => setFInteres(e.target.value)}><option value="">Interés (todos)</option>{interesOpts.map(o => <option key={o} value={o}>{o}</option>)}</select>
      <select className={sel} style={{ maxWidth: 150 }} value={fEstado} onChange={e => setFEstado(e.target.value)}><option value="">Estado (todos)</option>{ESTADOS.map(o => <option key={o} value={o}>{o}</option>)}</select>
      <select className={sel} style={{ maxWidth: 180 }} value={fEmpresa} onChange={e => setFEmpresa(e.target.value)}><option value="">Empresa (todas)</option>{empresaOpts.map(o => <option key={o} value={o}>{o}</option>)}</select>
      {(q || fClase || fInteres || fEstado || fEmpresa) && <button className="fsel" onClick={clearF}>✕ Limpiar</button>}
      <span style={{ flex: 1 }} />
      <button className="fsel" onClick={() => fileRef.current?.click()}>📥 Importar</button>
      <button className="fsel" onClick={exportCSV}>⬇ CSV</button>
      <button className="fsel" onClick={exportXLSX}>⬇ Excel</button>
      <button className="addtask" onClick={() => addContact()}>+ Contacto</button>
      <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" hidden onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ''; }} />
    </div>
    <div className="finwrap"><div style={{ overflowX: 'auto' }}><table className="nt fintable"><thead><tr><th>Nombre</th><th>Empresa</th><th>Email</th><th>Teléfono</th><th>Rol</th><th>Clase</th><th>Industria</th><th>Interés</th><th>Estado</th><th>Notas</th><th></th></tr></thead><tbody>
      {list.map(c => c.ro ? <tr key={c.id} style={{ opacity: .96 }}>
        <td style={{ padding: '4px 8px' }}>{c.name}</td>
        <td style={{ padding: '4px 8px' }}>{c.company}</td>
        <td style={{ padding: '4px 8px' }}>{c.email}</td>
        <td style={{ padding: '4px 8px' }}>{c.phone}</td>
        <td style={{ padding: '4px 8px' }}>{c.role}</td>
        <td style={{ padding: '4px 8px' }}><span className="tag">{c.clase}</span></td>
        <td style={{ padding: '4px 8px', color: 'var(--muted)' }}>{c.industria}</td>
        <td style={{ padding: '4px 8px' }}>{c.interes}</td>
        <td style={{ padding: '4px 8px', color: estadoColor(c.estado), fontWeight: 500 }}>{c.estado}</td>
        <td style={{ padding: '4px 8px', color: 'var(--muted)', maxWidth: 220, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={c.notes}>{c.notes}</td>
        <td></td></tr> : <tr key={c.id}>
        <td><input className="dbinp" value={c.name} onChange={e => updateContact(c.id, { name: e.target.value })} placeholder="Nombre" /></td>
        <td><input className="dbinp" value={c.company} onChange={e => updateContact(c.id, { company: e.target.value })} /></td>
        <td><input className="dbinp" value={c.email} onChange={e => updateContact(c.id, { email: e.target.value })} /></td>
        <td><input className="dbinp" value={c.phone} onChange={e => updateContact(c.id, { phone: e.target.value })} /></td>
        <td><input className="dbinp" value={c.role} onChange={e => updateContact(c.id, { role: e.target.value })} /></td>
        <td><input className="dbinp" value={c.clase || ''} onChange={e => updateContact(c.id, { clase: e.target.value })} placeholder="—" /></td>
        <td><input className="dbinp" value={c.industria || ''} onChange={e => updateContact(c.id, { industria: e.target.value })} /></td>
        <td><input className="dbinp" value={c.interes || ''} onChange={e => updateContact(c.id, { interes: e.target.value })} /></td>
        <td><select className="dbinp" value={c.estado || 'Por verificar'} onChange={e => updateContact(c.id, { estado: e.target.value })}>{ESTADOS.map(s => <option key={s} value={s}>{s}</option>)}</select></td>
        <td><input className="dbinp" value={c.notes} onChange={e => updateContact(c.id, { notes: e.target.value })} /></td>
        <td><button className="xrow" onClick={() => deleteContact(c.id)}>×</button></td></tr>)}
      {!list.length && <tr><td colSpan={11} style={{ color: 'var(--muted)', textAlign: 'center', padding: 18 }}>Sin contactos para ese filtro.</td></tr>}
    </tbody></table></div></div></div>);
}
