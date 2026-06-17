import React, { useState } from 'react';
import { metrics, addMetric, updateMetric, deleteMetric } from './store';
const CHANNELS = ['Instagram', 'TikTok', 'YouTube', 'Web', 'Facebook', 'X / Twitter', 'LinkedIn'];
const KINDS = ['Seguidores', 'Visitas', 'Alcance', 'Interacciones', 'Suscriptores', 'Visitas web'];
export default function Metrics() {
  const list = metrics().slice().sort((a, b) => b.date.localeCompare(a.date));
  // último valor por canal+métrica
  const latest: Record<string, any> = {};
  metrics().forEach(m => { const k = m.channel + '|' + m.metric; if (!latest[k] || m.date > latest[k].date) latest[k] = m; });
  return (<div className="boardwrap"><div className="topbar"><span className="crumb">📊 Métricas</span></div>
    <div className="finwrap">
      <div className="cars-note">Apunta tus números de redes y web. <b>Conexión automática con Meta y Google Analytics:</b> requiere configurar sus APIs (te aviso cuando lo montemos). De momento, registro manual.</div>
      <div className="fincards">{Object.values(latest).slice(0, 6).map((m: any) => <div className="fcard" key={m.id}><div className="fl">{m.channel} · {m.metric}</div><div className="fv" style={{ color: 'var(--accent)' }}>{(m.value || 0).toLocaleString('es-ES')}</div></div>)}</div>
      <div className="toolbar"><span style={{ flex: 1 }} /><button className="addtask" onClick={() => addMetric()}>+ Registro</button></div>
      <div style={{ overflowX: 'auto' }}><table className="nt fintable"><thead><tr><th>Fecha</th><th>Canal</th><th>Métrica</th><th>Valor</th><th></th></tr></thead><tbody>
        {list.map(m => <tr key={m.id}>
          <td><input type="date" className="dbinp" value={m.date} onChange={e => updateMetric(m.id, { date: e.target.value })} /></td>
          <td><input className="dbinp" list="ch" value={m.channel} onChange={e => updateMetric(m.id, { channel: e.target.value })} /></td>
          <td><input className="dbinp" list="kn" value={m.metric} onChange={e => updateMetric(m.id, { metric: e.target.value })} /></td>
          <td><input type="number" className="dbinp" style={{ textAlign: 'right' }} value={m.value} onChange={e => updateMetric(m.id, { value: +e.target.value })} /></td>
          <td><button className="xrow" onClick={() => deleteMetric(m.id)}>×</button></td></tr>)}
        {!list.length && <tr><td colSpan={5} style={{ color: 'var(--muted)', textAlign: 'center', padding: 18 }}>Sin registros. Pulsa "+ Registro".</td></tr>}
      </tbody></table></div>
      <datalist id="ch">{CHANNELS.map(c => <option key={c} value={c} />)}</datalist><datalist id="kn">{KINDS.map(c => <option key={c} value={c} />)}</datalist>
    </div></div>);
}
