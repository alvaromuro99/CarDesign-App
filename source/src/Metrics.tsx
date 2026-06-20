import React, { useState } from 'react';
import { allMetrics, metrics, addMetric, updateMetric, deleteMetric, totalFollowers, sumCat, metricSeries, webSeries, webSum, webAvg, isSocial, isFollowerMetric, inRange, prevRange } from './store';
import RangePicker, { Range, defaultRange } from './RangePicker';
const num = (n: number) => Math.round(n || 0).toLocaleString('es-ES');
const CHANNELS = ['Instagram', 'TikTok', 'YouTube', 'Facebook', 'X / Twitter', 'LinkedIn', 'Web'];
const KINDS = ['Seguidores', 'Suscriptores', 'Visualizaciones', 'Alcance', 'Espectadores', 'Interacciones', 'Clics en el enlace', 'Visitas'];
const ICON: Record<string, string> = { Instagram: '📷', TikTok: '🎵', YouTube: '▶️', Facebook: '📘', 'X / Twitter': '🐦', LinkedIn: '💼', Web: '🌐' };
const CCOLOR: Record<string, string> = { Instagram: '#e1306c', TikTok: '#111', YouTube: '#ff0000', Facebook: '#1877f2', 'X / Twitter': '#1da1f2', LinkedIn: '#0a66c2', Web: '#00b8d9' };
const fmtTime = (sec: number) => { sec = Math.round(sec); const mm = Math.floor(sec / 60), ss = sec % 60; return mm ? mm + 'm ' + ss + 's' : ss + 's'; };

type Pt = { date: string; value: number };
function Chart({ series, color, label, totalLabel, showSum = true }: { series: Pt[]; color: string; label: string; totalLabel?: string; showSum?: boolean }) {
  const [hi, setHi] = useState<number>(-1);
  const W = 300, H = 70, pad = 4;
  if (!series.length) return (<div className="mc"><div className="mc-h"><span>{label}</span></div><div className="mc-empty">sin datos en el periodo</div></div>);
  const vals = series.map(p => p.value), max = Math.max(...vals), min = Math.min(...vals), rng = max - min || 1;
  const x = (i: number) => series.length === 1 ? W / 2 : pad + i * (W - 2 * pad) / (series.length - 1);
  const y = (v: number) => H - pad - ((v - min) / rng) * (H - 2 * pad);
  let d = series.map((p, i) => `${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ');
  if (series.length === 1) d = `${pad},${(H / 2).toFixed(1)} ${(W - pad).toFixed(1)},${(H / 2).toFixed(1)}`;
  const sum = vals.reduce((a, b) => a + b, 0);
  const hp = hi >= 0 ? series[hi] : null;
  const head = totalLabel != null ? totalLabel : (showSum ? num(sum) : num(vals[vals.length - 1]));
  return (<div className="mc">
    <div className="mc-h"><span>{label}{head ? ' · ' : ''}<b>{head}</b></span>{hp && <span className="mc-tip">{hp.date} · {num(hp.value)}</span>}</div>
    <svg className="mc-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none"
      onMouseMove={e => { const r = (e.currentTarget as SVGSVGElement).getBoundingClientRect(); const rx = (e.clientX - r.left) / r.width * W; let bi = 0, bd = 1e9; series.forEach((_, i) => { const dd = Math.abs(x(i) - rx); if (dd < bd) { bd = dd; bi = i; } }); setHi(bi); }}
      onMouseLeave={() => setHi(-1)}>
      <polyline points={d} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {hp && <line x1={x(hi)} y1="0" x2={x(hi)} y2={H} stroke={color} strokeWidth="0.7" opacity="0.5" />}
      {hp && <circle cx={x(hi)} cy={y(hp.value)} r="3" fill={color} />}
    </svg>
  </div>);
}

export default function Metrics() {
  const [range, setRange] = useState<Range>(defaultRange());
  const [showTable, setShowTable] = useState(false);
  const [fCh, setFCh] = useState('');
  const [fKind, setFKind] = useState('');
  const all = allMetrics();
  const dbm = metrics();
  const to = range.to || new Date().toISOString().slice(0, 10);
  const prev = prevRange(range.from, range.to);

  const followers = totalFollowers(to);
  const followersPrev = prev.to ? totalFollowers(prev.to) : 0;
  const vSocial = sumCat('views', range.from, range.to, true);
  const vSocialPrev = prev.to ? sumCat('views', prev.from, prev.to, true) : 0;
  const reach = sumCat('reach', range.from, range.to, true);
  const engage = sumCat('engage', range.from, range.to, true);
  const engagePrev = prev.to ? sumCat('engage', prev.from, prev.to, true) : 0;
  const webViews = webSum('Vistas', range.from, range.to);

  const channels = Array.from(new Set(all.map(m => m.channel))).filter(Boolean);
  const socialChannels = channels.filter(c => isSocial(c)).sort();
  const hasWeb = all.some(m => m.channel === 'Web');

  const list = all.filter(m => (!fCh || m.channel === fCh) && (!fKind || m.metric === fKind)).slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 400);
  const usedKinds = Array.from(new Set(all.map(m => m.metric))).filter(Boolean);

  const delta = (cur: number, pr: number) => { if (!prev.to || (!cur && !pr)) return null; const d = cur - pr; const pct = pr ? Math.round(d / pr * 100) : 0; return { d, pct }; };
  const card = (label: string, value: string, color: string, dl?: { d: number; pct: number } | null) => (
    <div className="fcard"><div className="fl">{label}</div><div className="fv" style={{ color }}>{value}</div>
      {dl && <div className="ktrend" style={{ color: dl.d >= 0 ? '#3ec46d' : '#e63946' }}>{dl.d >= 0 ? '▲' : '▼'} {num(Math.abs(dl.d))}{prev.to ? ` (${dl.pct >= 0 ? '+' : ''}${dl.pct}%)` : ''} vs periodo anterior</div>}</div>);

  return (<div className="boardwrap"><div className="topbar"><span className="crumb">📊 Métricas</span><span style={{ flex: 1 }} /><button className="btn no-print" onClick={() => window.print()}>🖨️ Exportar PDF</button></div>
    <div className="finwrap" id="metrics-print">
      <RangePicker value={range} onChange={setRange} />
      {!all.length && <div className="cars-note">Aún no hay datos cargados. Las métricas de redes y web se leen de los CSV del repositorio; los seguidores se introducen a mano en “Datos / registro manual”.</div>}

      <div className="csub" style={{ marginTop: 6 }}>Totales · redes sociales</div>
      <div className="fincards k4">
        {card('Seguidores totales', num(followers), '#9b5de5', delta(followers, followersPrev))}
        {card('Visualizaciones (redes)', num(vSocial), '#4f7cff', delta(vSocial, vSocialPrev))}
        {card('Espectadores / alcance (redes)', num(reach), '#00b8d9')}
        {card('Interacciones (redes)', num(engage), '#f4a623', delta(engage, engagePrev))}
      </div>
      <div className="cars-note" style={{ margin: '8px 0 0' }}><b>Espectadores / Alcance:</b> es una suma diaria. Meta, LinkedIn y demás <b>deduplican</b> las cuentas únicas por periodo, así que su cifra oficial suele ser algo menor (una persona alcanzada varios días cuenta una vez allí, pero varias en la suma diaria).</div>

      {hasWeb && <>
        <div className="csub" style={{ marginTop: 16 }}>Totales · web <span style={{ color: 'var(--muted)', fontWeight: 400 }}>· cardesign.es</span></div>
        <div className="fincards k4">
          {card('Páginas vistas', num(webViews), '#4f7cff')}
          {card('Usuarios activos', num(webSum('Usuarios activos', range.from, range.to)), '#00b8d9')}
          {card('Nº de eventos', num(webSum('Eventos', range.from, range.to)), '#9b6cff')}
          {card('Tiempo medio / usuario', fmtTime(webAvg('Tiempo medio por usuario', range.from, range.to)), '#f4a623')}
        </div>
      </>}

      <div className="csub" style={{ marginTop: 18 }}>Por red social</div>
      <div className="cards-net">
        {socialChannels.length ? socialChannels.map(ch => {
          const col = CCOLOR[ch] || '#888';
          const folAll = all.filter(m => m.channel === ch && isFollowerMetric(m.metric) && (!range.to || m.date <= range.to)).sort((a, b) => a.date.localeCompare(b.date));
          const curr = folAll.length ? folAll[folAll.length - 1].value : 0;
          const folSeries = folAll.filter(m => inRange(m.date, range.from, range.to)).map(m => ({ date: m.date, value: +m.value || 0 }));
          const dlt = folSeries.length >= 2 ? folSeries[folSeries.length - 1].value - folSeries[0].value : 0;
          return (<div className="netcard" key={ch} style={{ borderTop: '3px solid ' + col }}>
            <div className="neth"><span className="nicon">{ICON[ch] || '📈'}</span><b>{ch}</b></div>
            <div className="netbig">{num(curr)} <span className="netlbl">seguidores</span></div>
            {dlt !== 0 && <div className="netdelta" style={{ color: dlt > 0 ? '#3ec46d' : '#e63946' }}>{dlt > 0 ? '▲ +' : '▼ '}{num(dlt)} en el periodo</div>}
            <Chart series={folSeries} color={col} label="Seguidores" showSum={false} />
            <Chart series={metricSeries(ch, 'views', range.from, range.to)} color="#4f7cff" label="Visualizaciones" />
            <Chart series={metricSeries(ch, 'reach', range.from, range.to)} color="#00b8d9" label="Espectadores" />
            <Chart series={metricSeries(ch, 'engage', range.from, range.to)} color="#f4a623" label="Interacciones" />
          </div>);
        }) : <div className="empty">Sin redes registradas todavía.</div>}
      </div>

      {hasWeb && <>
        <div className="csub" style={{ marginTop: 18 }}>Web · cardesign.es</div>
        <div className="cards-net">
          <div className="netcard webcard" style={{ borderTop: '3px solid #00b8d9' }}>
            <div className="neth"><span className="nicon">🌐</span><b>cardesign.es</b></div>
            <div className="netbig">{num(webViews)} <span className="netlbl">páginas vistas</span></div>
            <Chart series={webSeries('Vistas', range.from, range.to)} color="#4f7cff" label="Páginas vistas" />
            <Chart series={webSeries('Usuarios activos', range.from, range.to)} color="#00b8d9" label="Usuarios activos" />
            <Chart series={webSeries('Usuarios nuevos', range.from, range.to)} color="#3ec46d" label="Usuarios nuevos" />
            <Chart series={webSeries('Eventos', range.from, range.to)} color="#9b6cff" label="Nº de eventos" />
            <Chart series={webSeries('Tiempo medio por usuario', range.from, range.to)} color="#f4a623" label="Tiempo medio / usuario" totalLabel={fmtTime(webAvg('Tiempo medio por usuario', range.from, range.to))} />
            <Chart series={webSeries('Tiempo medio por sesión', range.from, range.to)} color="#e6794b" label="Tiempo medio / sesión" totalLabel={fmtTime(webAvg('Tiempo medio por sesión', range.from, range.to))} />
          </div>
        </div>
      </>}

      <div className="views no-print" style={{ marginTop: 20, flexWrap: 'wrap' }}><button className={showTable ? 'on' : ''} onClick={() => setShowTable(s => !s)}>{showTable ? '▾' : '▸'} Datos / registro manual (seguidores)</button>{showTable && <>
        <select className="fsel" value={fCh} onChange={e => setFCh(e.target.value)}><option value="">Todas las redes</option>{channels.map(c => <option key={c} value={c}>{c}</option>)}</select>
        <select className="fsel" value={fKind} onChange={e => setFKind(e.target.value)}><option value="">Todas las métricas</option>{usedKinds.map(k => <option key={k} value={k}>{k}</option>)}</select>
        {(fCh || fKind) && <button className="fclear" onClick={() => { setFCh(''); setFKind(''); }}>Limpiar</button>}
        <span style={{ flex: 1 }} />
        <button className="addtask" onClick={() => addMetric({ channel: fCh || 'Instagram', metric: fKind || 'Seguidores' })}>+ Registro</button></>}</div>
      {showTable && <><div className="cars-note">Aquí solo se editan los registros introducidos a mano (p. ej. <b>Seguidores</b>). Las métricas diarias de redes y web vienen de los CSV y no aparecen en esta tabla.</div>
      <div style={{ overflowX: 'auto' }} className="no-print"><table className="nt fintable"><thead><tr><th>Fecha</th><th>Canal</th><th>Métrica</th><th>Valor</th><th></th></tr></thead><tbody>
        {dbm.filter(m => (!fCh || m.channel === fCh) && (!fKind || m.metric === fKind)).slice().sort((a, b) => b.date.localeCompare(a.date)).map(m => <tr key={m.id}>
          <td><input type="date" className="dbinp" value={m.date} onChange={e => updateMetric(m.id, { date: e.target.value })} /></td>
          <td><input className="dbinp" list="ch" value={m.channel} onChange={e => updateMetric(m.id, { channel: e.target.value })} /></td>
          <td><input className="dbinp" list="kn" value={m.metric} onChange={e => updateMetric(m.id, { metric: e.target.value })} /></td>
          <td><input type="number" className="dbinp" style={{ textAlign: 'right' }} value={m.value} onChange={e => updateMetric(m.id, { value: +e.target.value })} /></td>
          <td><button className="xrow" onClick={() => deleteMetric(m.id)}>×</button></td></tr>)}
        {!dbm.length && <tr><td colSpan={5} style={{ color: 'var(--muted)', textAlign: 'center', padding: 18 }}>Sin registros manuales. Pulsa "+ Registro" para añadir seguidores.</td></tr>}
      </tbody></table>
      <datalist id="ch">{CHANNELS.map(c => <option key={c} value={c} />)}</datalist><datalist id="kn">{KINDS.map(c => <option key={c} value={c} />)}</datalist></div></>}
    </div></div>);
}
