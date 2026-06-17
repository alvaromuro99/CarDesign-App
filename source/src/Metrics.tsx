import React, { useState } from 'react';
import { metrics, addMetric, updateMetric, deleteMetric, totalFollowers, totalVisits, isSocial, isFollowerMetric, isVisitMetric, inRange } from './store';
import RangePicker, { Range, defaultRange } from './RangePicker';
const num = (n: number) => (n || 0).toLocaleString('es-ES');
const CHANNELS = ['Instagram', 'TikTok', 'YouTube', 'Facebook', 'X / Twitter', 'LinkedIn', 'Web'];
const KINDS = ['Seguidores', 'Suscriptores', 'Visitas', 'Alcance', 'Interacciones', 'Páginas vistas', 'Lecturas'];
const ICON: Record<string, string> = { Instagram: '📷', TikTok: '🎵', YouTube: '▶️', Facebook: '📘', 'X / Twitter': '🐦', LinkedIn: '💼', Web: '🌐' };
const CCOLOR: Record<string, string> = { Instagram: '#e1306c', TikTok: '#000', YouTube: '#ff0000', Facebook: '#1877f2', 'X / Twitter': '#1da1f2', LinkedIn: '#0a66c2', Web: '#00b8d9' };

function Spark({ pts, color }: { pts: number[]; color: string }) {
  if (pts.length < 2) return <div className="sparkempty">Añade 2+ registros para ver la curva</div>;
  const W = 240, H = 54, max = Math.max(...pts), min = Math.min(...pts), rng = max - min || 1;
  const d = pts.map((v, i) => `${(i / (pts.length - 1)) * W},${H - ((v - min) / rng) * (H - 8) - 4}`).join(' ');
  return (<svg className="spark" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none"><polyline points={d} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" /></svg>);
}

export default function Metrics() {
  const [range, setRange] = useState<Range>(defaultRange());
  const [showTable, setShowTable] = useState(false);
  const [fCh, setFCh] = useState('');
  const [fKind, setFKind] = useState('');
  const all = metrics();
  const to = range.to || new Date().toISOString().slice(0, 10);
  const followers = totalFollowers(to);
  const vSocial = totalVisits(range.from, range.to, 'social');
  const vWeb = totalVisits(range.from, range.to, 'web');
  const interactions = all.filter(m => /interac/i.test(m.metric) && inRange(m.date, range.from, range.to)).reduce((s, m) => s + (+m.value || 0), 0);
  const channels = Array.from(new Set(all.map(m => m.channel))).filter(Boolean);
  const list = all.filter(m => (!fCh || m.channel === fCh) && (!fKind || m.metric === fKind)).slice().sort((a, b) => b.date.localeCompare(a.date));
  const usedKinds = Array.from(new Set(all.map(m => m.metric))).filter(Boolean);

  const card = (label: string, value: string, color: string) => <div className="fcard"><div className="fl">{label}</div><div className="fv" style={{ color }}>{value}</div></div>;

  return (<div className="boardwrap"><div className="topbar"><span className="crumb">📊 Métricas</span><span style={{ flex: 1 }} /><button className="btn no-print" onClick={() => window.print()}>🖨️ Exportar PDF</button></div>
    <div className="finwrap" id="metrics-print">
      <RangePicker value={range} onChange={setRange} />
      {!all.length && <div className="cars-note">Aún no hay datos. Pulsa <b>“Datos / registro manual”</b> abajo y añade tus números (seguidores, visitas, páginas vistas…). En cuanto conectemos las APIs de tus redes, esto se rellenará solo. De momento, todo a 0.</div>}
      <div className="csub" style={{ marginTop: 6 }}>Resumen global</div>
      <div className="fincards k4">
        {card('Seguidores totales', num(followers), '#9b5de5')}
        {card('Visitas en redes', num(vSocial), '#4f7cff')}
        {card('Páginas vistas / lecturas web', num(vWeb), '#00b8d9')}
        {card('Interacciones', num(interactions), '#f4a623')}
      </div>
      <div className="csub" style={{ marginTop: 18 }}>Por red social</div>
      <div className="cards-net">
        {channels.length ? channels.map(ch => {
          const col = CCOLOR[ch] || '#888';
          const folSeries = all.filter(m => m.channel === ch && isFollowerMetric(m.metric) && (!range.to || m.date <= range.to)).sort((a, b) => a.date.localeCompare(b.date));
          const curr = folSeries.length ? folSeries[folSeries.length - 1].value : 0;
          const inRangeFol = folSeries.filter(m => inRange(m.date, range.from, range.to));
          const delta = inRangeFol.length >= 2 ? inRangeFol[inRangeFol.length - 1].value - inRangeFol[0].value : 0;
          const visits = all.filter(m => m.channel === ch && isVisitMetric(m.metric) && inRange(m.date, range.from, range.to)).reduce((s, m) => s + (+m.value || 0), 0);
          return (<div className="netcard" key={ch} style={{ borderTop: '3px solid ' + col }}>
            <div className="neth"><span className="nicon">{ICON[ch] || '📈'}</span><b>{ch}</b></div>
            <div className="netbig">{num(curr)} <span className="netlbl">{isSocial(ch) ? 'seguidores' : 'visitas web'}</span></div>
            {delta !== 0 && <div className="netdelta" style={{ color: delta > 0 ? '#3ec46d' : '#e63946' }}>{delta > 0 ? '▲ +' : '▼ '}{num(delta)} en el periodo</div>}
            <Spark pts={folSeries.map(m => m.value)} color={col} />
            <div className="netfoot">{num(visits)} visitas/alcance en el periodo</div>
          </div>);
        }) : <div className="empty">Sin redes registradas todavía.</div>}
      </div>

      <div className="views no-print" style={{ marginTop: 20, flexWrap: 'wrap' }}><button className={showTable ? 'on' : ''} onClick={() => setShowTable(s => !s)}>{showTable ? '▾' : '▸'} Datos / registro manual</button>{showTable && <>
        <select className="fsel" value={fCh} onChange={e => setFCh(e.target.value)}><option value="">Todas las redes</option>{channels.map(c => <option key={c} value={c}>{c}</option>)}</select>
        <select className="fsel" value={fKind} onChange={e => setFKind(e.target.value)}><option value="">Todas las métricas</option>{usedKinds.map(k => <option key={k} value={k}>{k}</option>)}</select>
        {(fCh || fKind) && <button className="fclear" onClick={() => { setFCh(''); setFKind(''); }}>Limpiar</button>}
        <span style={{ flex: 1 }} />
        <button className="addtask" onClick={() => addMetric({ channel: fCh || 'Instagram', metric: fKind || 'Seguidores' })}>+ Registro</button></>}</div>
      {showTable && <div style={{ overflowX: 'auto' }} className="no-print"><table className="nt fintable"><thead><tr><th>Fecha</th><th>Canal</th><th>Métrica</th><th>Valor</th><th></th></tr></thead><tbody>
        {list.map(m => <tr key={m.id}>
          <td><input type="date" className="dbinp" value={m.date} onChange={e => updateMetric(m.id, { date: e.target.value })} /></td>
          <td><input className="dbinp" list="ch" value={m.channel} onChange={e => updateMetric(m.id, { channel: e.target.value })} /></td>
          <td><input className="dbinp" list="kn" value={m.metric} onChange={e => updateMetric(m.id, { metric: e.target.value })} /></td>
          <td><input type="number" className="dbinp" style={{ textAlign: 'right' }} value={m.value} onChange={e => updateMetric(m.id, { value: +e.target.value })} /></td>
          <td><button className="xrow" onClick={() => deleteMetric(m.id)}>×</button></td></tr>)}
        {!list.length && <tr><td colSpan={5} style={{ color: 'var(--muted)', textAlign: 'center', padding: 18 }}>Sin registros. Pulsa "+ Registro".</td></tr>}
      </tbody></table>
      <datalist id="ch">{CHANNELS.map(c => <option key={c} value={c} />)}</datalist><datalist id="kn">{KINDS.map(c => <option key={c} value={c} />)}</datalist></div>}
    </div></div>);
}
