import React, { useState } from 'react';
import { contacts, addContact, updateContact, deleteContact } from './store';
export default function Contacts() {
  const [q, setQ] = useState('');
  const list = contacts().filter(c => !q || (c.name + ' ' + c.company + ' ' + c.email + ' ' + c.status).toLowerCase().includes(q.toLowerCase()));
  return (<div className="boardwrap"><div className="topbar"><span className="crumb">👥 Contactos</span></div>
    <div className="toolbar"><input className="search2" placeholder="Buscar contacto…" value={q} onChange={e => setQ(e.target.value)} /><span style={{ flex: 1 }} /><button className="addtask" onClick={() => addContact()}>+ Contacto</button></div>
    <div className="finwrap"><div style={{ overflowX: 'auto' }}><table className="nt fintable"><thead><tr><th>Nombre</th><th>Empresa</th><th>Email</th><th>Móvil</th><th>Rol</th><th>Estado</th><th>Notas</th><th></th></tr></thead><tbody>
      {list.map(c => <tr key={c.id}>
        <td><input className="dbinp" value={c.name} onChange={e => updateContact(c.id, { name: e.target.value })} placeholder="Nombre" /></td>
        <td><input className="dbinp" value={c.company} onChange={e => updateContact(c.id, { company: e.target.value })} /></td>
        <td><input className="dbinp" value={c.email} onChange={e => updateContact(c.id, { email: e.target.value })} /></td>
        <td><input className="dbinp" value={c.phone} onChange={e => updateContact(c.id, { phone: e.target.value })} /></td>
        <td><input className="dbinp" value={c.role} onChange={e => updateContact(c.id, { role: e.target.value })} /></td>
        <td><select className="dbinp" value={c.status} onChange={e => updateContact(c.id, { status: e.target.value })}>{['Nuevo','Contactado','Interesado','Confirmado','Cliente','Patrocinador','Descartado'].map(s => <option key={s} value={s}>{s}</option>)}</select></td>
        <td><input className="dbinp" value={c.notes} onChange={e => updateContact(c.id, { notes: e.target.value })} /></td>
        <td><button className="xrow" onClick={() => deleteContact(c.id)}>×</button></td></tr>)}
      {!list.length && <tr><td colSpan={8} style={{ color: 'var(--muted)', textAlign: 'center', padding: 18 }}>Sin contactos. Pulsa "+ Contacto".</td></tr>}
    </tbody></table></div></div></div>);
}
