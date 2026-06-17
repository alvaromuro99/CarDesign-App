import React, { useRef, useState } from 'react';
import { contacts, addContact, updateContact, deleteContact } from './store';
const STATUSES = ['Nuevo', 'Contactado', 'Interesado', 'Confirmado', 'Cliente', 'Patrocinador', 'Descartado'];
const FIELDS: [keyof any, string][] = [['name', 'Nombre'], ['company', 'Empresa'], ['email', 'Email'], ['phone', 'Móvil'], ['role', 'Rol'], ['status', 'Estado'], ['notes', 'Notas']];
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
  const fileRef = useRef<HTMLInputElement>(null);
  const list = contacts().filter(c => !q || (c.name + ' ' + c.company + ' ' + c.email + ' ' + c.status + ' ' + c.role).toLowerCase().includes(q.toLowerCase()));

  const exportCSV = () => { const head = FIELDS.map(f => f[1]).join(','); const body = contacts().map(c => FIELDS.map(f => `"${String((c as any)[f[0]] || '').replace(/"/g, '""')}"`).join(',')).join('\n'); download('contactos.csv', '﻿' + head + '\n' + body, 'text/csv;charset=utf-8'); };
  const exportXLSX = async () => { const XLSX: any = await import(/* @vite-ignore */ 'https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs'); const ws = XLSX.utils.json_to_sheet(contacts().map(c => ({ Nombre: c.name, Empresa: c.company, Email: c.email, Móvil: c.phone, Rol: c.role, Estado: c.status, Notas: c.notes }))); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Contactos'); XLSX.writeFile(wb, 'contactos.xlsx'); };
  const onFile = async (f: File) => {
    if (/\.xlsx?$/i.test(f.name)) { const XLSX: any = await import(/* @vite-ignore */ 'https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs'); const wb = XLSX.read(await f.arrayBuffer()); const ws = wb.Sheets[wb.SheetNames[0]]; const rows = XLSX.utils.sheet_to_json(ws, { header: 1 }) as string[][]; const n = importRows(rows.map(r => r.map(c => c == null ? '' : String(c)))); alert(`Importados ${n} contactos.`); }
    else { const n = importRows(parseCSV(await f.text())); alert(`Importados ${n} contactos.`); }
  };

  return (<div className="boardwrap"><div className="topbar"><span className="crumb">👥 Contactos</span><span className="crumb" style={{ color: 'var(--muted)' }}>· {contacts().length}</span></div>
    <div className="toolbar">
      <input className="search2" placeholder="Buscar contacto…" value={q} onChange={e => setQ(e.target.value)} />
      <button className="fsel" onClick={() => fileRef.current?.click()}>📥 Importar</button>
      <button className="fsel" onClick={exportCSV}>⬇ CSV</button>
      <button className="fsel" onClick={exportXLSX}>⬇ Excel</button>
      <span style={{ flex: 1 }} />
      <button className="addtask" onClick={() => addContact()}>+ Contacto</button>
      <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" hidden onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ''; }} />
    </div>
    <div className="finwrap"><div style={{ overflowX: 'auto' }}><table className="nt fintable"><thead><tr><th>Nombre</th><th>Empresa</th><th>Email</th><th>Móvil</th><th>Rol</th><th>Estado</th><th>Notas</th><th></th></tr></thead><tbody>
      {list.map(c => <tr key={c.id}>
        <td><input className="dbinp" value={c.name} onChange={e => updateContact(c.id, { name: e.target.value })} placeholder="Nombre" /></td>
        <td><input className="dbinp" value={c.company} onChange={e => updateContact(c.id, { company: e.target.value })} /></td>
        <td><input className="dbinp" value={c.email} onChange={e => updateContact(c.id, { email: e.target.value })} /></td>
        <td><input className="dbinp" value={c.phone} onChange={e => updateContact(c.id, { phone: e.target.value })} /></td>
        <td><input className="dbinp" value={c.role} onChange={e => updateContact(c.id, { role: e.target.value })} /></td>
        <td><select className="dbinp" value={c.status} onChange={e => updateContact(c.id, { status: e.target.value })}>{STATUSES.map(s => <option key={s} value={s}>{s}</option>)}</select></td>
        <td><input className="dbinp" value={c.notes} onChange={e => updateContact(c.id, { notes: e.target.value })} /></td>
        <td><button className="xrow" onClick={() => deleteContact(c.id)}>×</button></td></tr>)}
      {!list.length && <tr><td colSpan={8} style={{ color: 'var(--muted)', textAlign: 'center', padding: 18 }}>Sin contactos. Pulsa "+ Contacto" o importa un CSV/Excel.</td></tr>}
    </tbody></table></div></div></div>);
}
