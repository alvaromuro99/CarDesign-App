import React, { useState } from 'react';
import { finances, addMovement, updateMovement, deleteMovement, projects, members, member, sales, addSale, updateSale, deleteSale, financeSummary, getSetting, setSetting } from './store';
const eur = (n: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n || 0);
const eur0 = (n: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n || 0);
const whoLabel = (w: string) => w === 'empresa' ? 'Revista (empresa)' : (member(w)?.name || w);
const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const PS = 12;
function download(name: string, content: string) { const u = URL.createObjectURL(new Blob(['﻿' + content], { type: 'text/csv;charset=utf-8' })); const a = document.createElement('a'); a.href = u; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(u), 2000); }

function MonthChart({ ing, gas }: { ing: number[]; gas: number[] }) {
  const max = Math.max(1, ...ing, ...gas);
  const H = 120, W = 560, n = 12, gw = W / n;
  return (<svg className="mchart" viewBox={`0 0 ${W} ${H + 22}`} preserveAspectRatio="xMidYMid meet">
    {ing.map((_, i) => { const bw = gw * 0.32; const ih = ing[i] / max * H, gh = gas[i] / max * H; const x = i * gw + gw / 2;
      return <g key={i}>
        <rect x={x - bw - 1} y={H - ih} width={bw} height={ih} rx={2} fill="#3ec46d" />
        <rect x={x + 1} y={H - gh} width={bw} height={gh} rx={2} fill="#e63946" />
        <text x={x} y={H + 14} textAnchor="middle" fontSize="9" fill="var(--muted)">{MESES[i]}</text>
      </g>; })}
  </svg>);
}
function Pager({ page, pages, total, from, to, setPage, onExport }: { page: number; pages: number; total: number; from: number; to: number; setPage: (n: number) => void; onExport: () => void }) {
  if (!total) return null;
  const nums = Array.from({ length: pages }, (_, i) => i + 1).filter(n => n === 1 || n === pages || Math.abs(n - page) <= 1);
  let last = 0;
  return (<div className="pager">
    <span className="pager-info">Mostrando {from}–{to} de {total}</span>
    <div className="pager-nav">
      <button className="pgb" disabled={page <= 1} onClick={() => setPage(page - 1)}>‹</button>
      {nums.map(n => { const gap = n - last > 1; last = n; return <React.Fragment key={n}>{gap && <span className="pg-dots">…</span>}<button className={'pgb' + (n === page ? ' on' : '')} onClick={() => setPage(n)}>{n}</button></React.Fragment>; })}
      <button className="pgb" disabled={page >= pages} onClick={() => setPage(page + 1)}>›</button>
    </div>
    <button className="dbtn" style={{ width: 'auto', margin: 0, padding: '7px 14px' }} onClick={onExport}>⬇ Exportar</button>
  </div>);
}

export default function Finances() {
  const [tab, setTab] = useState<'mov' | 'ventas'>('mov');
  const all = finances();
  const years = Array.from(new Set([...all.map(m => (m.date || '').slice(0, 4)), ...sales().map(s => (s.date || '').slice(0, 4))].filter(Boolean))).sort().reverse();
  const [year, setYear] = useState<string>(years[0] || String(new Date().getFullYear()));
  const [page, setPage] = useState(1);
  const whoOpts = ['empresa', ...members().map(m => m.id)];
  const from = year ? year + '-01-01' : '', to = year ? year + '-12-31' : '';
  const sum = financeSummary(from, to);
  const py = year ? String(+year - 1) : '';
  const sumP = py ? financeSummary(py + '-01-01', py + '-12-31') : null;

  const movList = all.filter(m => !year || (m.date || '').slice(0, 4) === year).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const ventasList = sales().filter(s => !year || (s.date || '').slice(0, 4) === year).sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  const byCat: Record<string, { i: number; g: number }> = {};
  movList.forEach(m => { (byCat[m.category || 'General'] = byCat[m.category || 'General'] || { i: 0, g: 0 })[m.type === 'ingreso' ? 'i' : 'g'] += (+m.amount || 0); });
  ventasList.forEach(s => { const k = s.type === 'anuario' ? 'Venta anuarios' : 'Publicidad'; (byCat[k] = byCat[k] || { i: 0, g: 0 }).i += (+s.amount || 0); });

  const ing = Array(12).fill(0), gas = Array(12).fill(0);
  if (year) { movList.forEach(m => { const mo = +(m.date || '').slice(5, 7) - 1; if (mo >= 0) (m.type === 'ingreso' ? ing : gas)[mo] += (+m.amount || 0); });
    ventasList.forEach(s => { const mo = +(s.date || '').slice(5, 7) - 1; if (mo >= 0) ing[mo] += (+s.amount || 0); }); }

  const anuariosVendidos = ventasList.filter(s => s.type === 'anuario').reduce((s, x) => s + (+x.units || 0), 0);
  const ingAnuario = ventasList.filter(s => s.type === 'anuario').reduce((s, x) => s + (+x.amount || 0), 0);
  const ingPub = ventasList.filter(s => s.type === 'publicidad').reduce((s, x) => s + (+x.amount || 0), 0);
  const impresosKey = 'anuariosImpresos' + (year || 'all');
  const impresos = +getSetting(impresosKey, 0);

  const tr = (cur: number, prev: number | undefined, good = true) => { if (sumP == null || prev == null) return null; const d = cur - prev, pct = prev ? Math.round(d / Math.abs(prev) * 100) : 100; const ok = (d >= 0) === good; return <div className="ktrend" style={{ color: ok ? '#3ec46d' : '#e63946', fontSize: 12 }}>{d >= 0 ? '↑' : '↓'} {Math.abs(pct)}% <span className="kt-sub">vs año anterior</span></div>; };
  const trPP = (cur: number, prev: number | undefined) => { if (sumP == null || prev == null) return null; const d = cur - prev; return <div className="ktrend" style={{ color: d >= 0 ? '#3ec46d' : '#e63946', fontSize: 12 }}>{d >= 0 ? '↑' : '↓'} {Math.abs(d).toFixed(1)} pp <span className="kt-sub">vs año anterior</span></div>; };
  const kcard = (label: string, value: string, color: string, foot: React.ReactNode) => <div className="kcard"><div className="klabel">{label}</div><div className="kval" style={{ color }}>{value}</div><div className="kfoot">{foot}</div></div>;

  const pages = Math.max(1, Math.ceil(movList.length / PS));
  const pg = Math.min(page, pages);
  const movPage = movList.slice((pg - 1) * PS, pg * PS);
  const exportMov = () => download(`movimientos_${year || 'todos'}.csv`, 'Fecha,Concepto,Área,Tipo,Importe,IVA %,Quién\n' + movList.map(m => [m.date, '"' + (m.concept || '').replace(/"/g, '""') + '"', '"' + (m.category || '') + '"', m.type, m.amount, m.iva, whoLabel(m.who)].join(',')).join('\n'));
  const exportVentas = () => download(`ventas_${year || 'todos'}.csv`, 'Fecha,Tipo,Concepto,Uds,Importe,IVA %,Quién\n' + ventasList.map(s => [s.date, s.type, '"' + (s.concept || '').replace(/"/g, '""') + '"', s.units, s.amount, s.iva, whoLabel(s.who)].join(',')).join('\n'));

  return (<div className="boardwrap dash"><div className="topbar"><span className="crumb">💰 Finanzas</span></div>
    <div className="finwrap">
      <div className="toolbar">
        <div className="views"><button className={tab === 'mov' ? 'on' : ''} onClick={() => { setTab('mov'); setPage(1); }}>Resumen y movimientos</button><button className={tab === 'ventas' ? 'on' : ''} onClick={() => { setTab('ventas'); setPage(1); }}>Ventas anuario</button></div>
        <select className="fsel" value={year} onChange={e => { setYear(e.target.value); setPage(1); }}><option value="">Todos los años</option>{years.map(y => <option key={y} value={y}>{y}</option>)}{!years.includes(year) && year && <option value={year}>{year}</option>}</select>
        <span style={{ flex: 1 }} />
        {tab === 'mov' ? <button className="addtask" onClick={() => addMovement({ date: (year && year.length === 4 ? year : String(new Date().getFullYear())) + new Date().toISOString().slice(4, 10) })}>+ Movimiento</button>
          : <button className="addtask" onClick={() => addSale({ date: (year && year.length === 4 ? year : String(new Date().getFullYear())) + new Date().toISOString().slice(4, 10) })}>+ Venta</button>}
      </div>

      {tab === 'mov' ? <>
        <div className="kpi6" style={{ gridTemplateColumns: 'repeat(5,1fr)' }}>
          {kcard('Ingresos', eur0(sum.ingresos), '#3ec46d', tr(sum.ingresos, sumP?.ingresos, true) || <span className="kt-sub">incl. ventas anuario</span>)}
          {kcard('Gastos', eur0(sum.gastos), '#e63946', tr(sum.gastos, sumP?.gastos, false))}
          {kcard('Beneficio', eur0(sum.neto), sum.neto >= 0 ? '#3ec46d' : '#e63946', tr(sum.neto, sumP?.neto, true))}
          {kcard('Margen', sum.margen.toFixed(0) + '%', 'var(--txt)', trPP(sum.margen, sumP?.margen))}
          {kcard('IVA a liquidar', eur0(sum.ivaLiq), 'var(--txt)', <span className="kt-sub">{eur0(sum.ivaRep)} rep − {eur0(sum.ivaSop)} sop</span>)}
        </div>
        <div className="finrow3" style={{ gridTemplateColumns: '1fr 1.2fr' }}>
          <div className="dbox"><div className="dbox-h">Por área (incluye ventas)</div><table className="nt"><tbody><tr><th>Área</th><th>Ingresos</th><th>Gastos</th><th>Neto</th></tr>{Object.keys(byCat).sort().map(k => <tr key={k}><td>{k}</td><td style={{ color: '#3ec46d' }}>{eur0(byCat[k].i)}</td><td style={{ color: '#e63946' }}>{eur0(byCat[k].g)}</td><td><b>{eur0(byCat[k].i - byCat[k].g)}</b></td></tr>)}{!Object.keys(byCat).length && <tr><td colSpan={4} style={{ color: 'var(--muted)' }}>Sin datos.</td></tr>}</tbody></table></div>
          <div className="dbox"><div className="dbox-h">Evolución mensual {year || ''} · <span style={{ color: '#3ec46d' }}>ingresos</span> / <span style={{ color: '#e63946' }}>gastos</span></div>{year ? <MonthChart ing={ing} gas={gas} /> : <div className="empty">Elige un año para ver la evolución.</div>}</div>
        </div>
        <div className="cars-note" style={{ margin: '14px 0 4px' }}><b>IVA:</b> en cada línea eliges el % (0/4/10/21). El <b>IVA repercutido</b> es el que cobras en tus ingresos; el <b>soportado</b>, el que pagas en gastos. <b>IVA a liquidar = repercutido − soportado</b>.</div>
        <div className="csub" style={{ marginTop: 10 }}>Movimientos {year && `· ${year}`}</div>
        <div style={{ overflowX: 'auto' }}><table className="nt fintable"><thead><tr><th>Fecha</th><th>Concepto</th><th>Área</th><th>Tipo</th><th>Importe</th><th>IVA %</th><th>Quién</th><th></th></tr></thead><tbody>
          {movPage.map(m => <tr key={m.id}>
            <td><input type="date" className="dbinp" value={m.date} onChange={e => updateMovement(m.id, { date: e.target.value })} /></td>
            <td><input className="dbinp" value={m.concept} placeholder="Concepto…" onChange={e => updateMovement(m.id, { concept: e.target.value })} /></td>
            <td><input className="dbinp" list="fc" value={m.category} onChange={e => updateMovement(m.id, { category: e.target.value })} /></td>
            <td><select className="dbinp" value={m.type} onChange={e => updateMovement(m.id, { type: e.target.value as any })}><option value="ingreso">Ingreso</option><option value="gasto">Gasto</option></select></td>
            <td style={{ minWidth: 100 }}><input type="number" className="dbinp" style={{ textAlign: 'right', color: m.type === 'ingreso' ? '#3ec46d' : '#e63946' }} value={m.amount} onChange={e => updateMovement(m.id, { amount: +e.target.value })} /></td>
            <td style={{ width: 70 }}><select className="dbinp" value={m.iva} onChange={e => updateMovement(m.id, { iva: +e.target.value })}>{[0, 4, 10, 21].map(v => <option key={v} value={v}>{v}%</option>)}</select></td>
            <td><select className="dbinp" value={m.who} onChange={e => updateMovement(m.id, { who: e.target.value })}>{whoOpts.map(w => <option key={w} value={w}>{whoLabel(w)}</option>)}</select></td>
            <td><button className="xrow" onClick={() => deleteMovement(m.id)}>×</button></td></tr>)}
          {!movList.length && <tr><td colSpan={8} style={{ color: 'var(--muted)', textAlign: 'center', padding: 18 }}>Sin movimientos.</td></tr>}
        </tbody></table></div>
        <Pager page={pg} pages={pages} total={movList.length} from={movList.length ? (pg - 1) * PS + 1 : 0} to={Math.min(pg * PS, movList.length)} setPage={setPage} onExport={exportMov} />
        <datalist id="fc">{Array.from(new Set([...projects().map(p => p.title), 'General', ...all.map(m => m.category)])).filter(Boolean).map(c => <option key={c} value={c} />)}</datalist>
      </> : <>
        <div className="kpi6" style={{ gridTemplateColumns: 'repeat(5,1fr)' }}>
          <div className="kcard"><div className="klabel">📘 Anuarios impresos</div><input className="kval kedit" type="number" value={impresos || ''} placeholder="0" onChange={e => setSetting(impresosKey, +e.target.value)} /><div className="kfoot"><span className="kt-sub">tirada de este año</span></div></div>
          {kcard('Vendidos / entregados', String(anuariosVendidos), 'var(--accent)', <span className="kt-sub">de {impresos || '—'} impresos</span>)}
          {kcard('Stock restante', String(Math.max(0, impresos - anuariosVendidos)), impresos - anuariosVendidos <= 0 ? '#e63946' : '#3ec46d', <span className="kt-sub">{impresos ? Math.round(anuariosVendidos / impresos * 100) + '% colocado' : 'indica la tirada'}</span>)}
          {kcard('Ingresos anuario', eur0(ingAnuario), '#3ec46d', null)}
          {kcard('Ingresos publicidad', eur0(ingPub), '#3ec46d', <span className="kt-sub">Total ventas {eur0(ingAnuario + ingPub)}</span>)}
        </div>
        <div className="cars-note" style={{ marginTop: 0 }}>Apunta cada anuario vendido o publicidad abajo: se <b>suma automáticamente</b> a los ingresos y al “Por área”. Escribe arriba la <b>tirada impresa</b> para ver el stock restante.</div>
        <div className="csub" style={{ marginTop: 12 }}>Ventas {year && `· ${year}`}</div>
        <div style={{ overflowX: 'auto' }}><table className="nt fintable"><thead><tr><th>Fecha</th><th>Tipo</th><th>Concepto / cliente</th><th>Uds</th><th>Importe</th><th>IVA %</th><th>Quién</th><th></th></tr></thead><tbody>
          {ventasList.slice((pg - 1) * PS, pg * PS).map(s => <tr key={s.id}>
            <td><input type="date" className="dbinp" value={s.date} onChange={e => updateSale(s.id, { date: e.target.value })} /></td>
            <td><select className="dbinp" value={s.type} onChange={e => updateSale(s.id, { type: e.target.value as any })}><option value="anuario">Anuario</option><option value="publicidad">Publicidad</option></select></td>
            <td><input className="dbinp" value={s.concept} placeholder="Cliente / concepto" onChange={e => updateSale(s.id, { concept: e.target.value })} /></td>
            <td style={{ width: 60 }}><input type="number" className="dbinp" style={{ textAlign: 'right' }} value={s.units} onChange={e => updateSale(s.id, { units: +e.target.value })} /></td>
            <td style={{ minWidth: 100 }}><input type="number" className="dbinp" style={{ textAlign: 'right', color: '#3ec46d' }} value={s.amount} onChange={e => updateSale(s.id, { amount: +e.target.value })} /></td>
            <td style={{ width: 70 }}><select className="dbinp" value={s.iva} onChange={e => updateSale(s.id, { iva: +e.target.value })}>{[0, 4, 10, 21].map(v => <option key={v} value={v}>{v}%</option>)}</select></td>
            <td><select className="dbinp" value={s.who} onChange={e => updateSale(s.id, { who: e.target.value })}>{whoOpts.map(w => <option key={w} value={w}>{whoLabel(w)}</option>)}</select></td>
            <td><button className="xrow" onClick={() => deleteSale(s.id)}>×</button></td></tr>)}
          {!ventasList.length && <tr><td colSpan={8} style={{ color: 'var(--muted)', textAlign: 'center', padding: 18 }}>Sin ventas. Apunta aquí cada anuario vendido o publicidad.</td></tr>}
        </tbody></table></div>
        <Pager page={pg} pages={Math.max(1, Math.ceil(ventasList.length / PS))} total={ventasList.length} from={ventasList.length ? (pg - 1) * PS + 1 : 0} to={Math.min(pg * PS, ventasList.length)} setPage={setPage} onExport={exportVentas} />
      </>}
    </div></div>);
}
