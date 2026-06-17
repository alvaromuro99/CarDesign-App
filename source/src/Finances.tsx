import React, { useState } from 'react';
import { finances, addMovement, updateMovement, deleteMovement, projects, members, member, sales, addSale, updateSale, deleteSale, financeSummary } from './store';
const eur = (n: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n || 0);
const eur0 = (n: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n || 0);
const whoLabel = (w: string) => w === 'empresa' ? 'Revista (empresa)' : (member(w)?.name || w);
const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

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

export default function Finances() {
  const [tab, setTab] = useState<'mov' | 'ventas'>('mov');
  const all = finances();
  const years = Array.from(new Set([...all.map(m => (m.date || '').slice(0, 4)), ...sales().map(s => (s.date || '').slice(0, 4))].filter(Boolean))).sort().reverse();
  const [year, setYear] = useState<string>(years[0] || String(new Date().getFullYear()));
  const whoOpts = ['empresa', ...members().map(m => m.id)];
  const from = year ? year + '-01-01' : '', to = year ? year + '-12-31' : '';
  const sum = financeSummary(from, to);

  const movList = all.filter(m => !year || (m.date || '').slice(0, 4) === year).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const ventasList = sales().filter(s => !year || (s.date || '').slice(0, 4) === year).sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  // Por área (movimientos + ventas integradas)
  const byCat: Record<string, { i: number; g: number }> = {};
  movList.forEach(m => { (byCat[m.category || 'General'] = byCat[m.category || 'General'] || { i: 0, g: 0 })[m.type === 'ingreso' ? 'i' : 'g'] += (+m.amount || 0); });
  ventasList.forEach(s => { const k = s.type === 'anuario' ? 'Venta anuarios' : 'Publicidad'; (byCat[k] = byCat[k] || { i: 0, g: 0 }).i += (+s.amount || 0); });

  // Evolución mensual del año
  const ing = Array(12).fill(0), gas = Array(12).fill(0);
  if (year) { movList.forEach(m => { const mo = +(m.date || '').slice(5, 7) - 1; if (mo >= 0) (m.type === 'ingreso' ? ing : gas)[mo] += (+m.amount || 0); });
    ventasList.forEach(s => { const mo = +(s.date || '').slice(5, 7) - 1; if (mo >= 0) ing[mo] += (+s.amount || 0); }); }

  const anuariosVendidos = ventasList.filter(s => s.type === 'anuario').reduce((s, x) => s + (+x.units || 0), 0);
  const ingAnuario = ventasList.filter(s => s.type === 'anuario').reduce((s, x) => s + (+x.amount || 0), 0);
  const ingPub = ventasList.filter(s => s.type === 'publicidad').reduce((s, x) => s + (+x.amount || 0), 0);

  return (<div className="boardwrap"><div className="topbar"><span className="crumb">💰 Finanzas</span></div>
    <div className="finwrap">
      <div className="toolbar">
        <div className="views"><button className={tab === 'mov' ? 'on' : ''} onClick={() => setTab('mov')}>Resumen y movimientos</button><button className={tab === 'ventas' ? 'on' : ''} onClick={() => setTab('ventas')}>Ventas anuario</button></div>
        <select className="fsel" value={year} onChange={e => setYear(e.target.value)}><option value="">Todos los años</option>{years.map(y => <option key={y} value={y}>{y}</option>)}{!years.includes(year) && year && <option value={year}>{year}</option>}</select>
        <span style={{ flex: 1 }} />
        {tab === 'mov' ? <button className="addtask" onClick={() => addMovement({ date: (year && year.length === 4 ? year : String(new Date().getFullYear())) + new Date().toISOString().slice(4, 10) })}>+ Movimiento</button>
          : <button className="addtask" onClick={() => addSale({ date: (year && year.length === 4 ? year : String(new Date().getFullYear())) + new Date().toISOString().slice(4, 10) })}>+ Venta</button>}
      </div>

      {tab === 'mov' ? <>
        <div className="fincards k5">
          <div className="fcard"><div className="fl">Ingresos</div><div className="fv" style={{ color: '#3ec46d' }}>{eur0(sum.ingresos)}</div><div className="ksub">incl. ventas anuario</div></div>
          <div className="fcard"><div className="fl">Gastos</div><div className="fv" style={{ color: '#e63946' }}>{eur0(sum.gastos)}</div></div>
          <div className="fcard"><div className="fl">Beneficio</div><div className="fv" style={{ color: sum.neto >= 0 ? '#3ec46d' : '#e63946' }}>{eur0(sum.neto)}</div></div>
          <div className="fcard"><div className="fl">Margen</div><div className="fv">{sum.margen.toFixed(0)}%</div></div>
          <div className="fcard"><div className="fl">IVA a liquidar</div><div className="fv" style={{ fontSize: 22 }}>{eur0(sum.ivaLiq)}</div><div className="ksub">{eur0(sum.ivaRep)} rep. − {eur0(sum.ivaSop)} sop.</div></div>
        </div>
        <div className="finrow">
          <div className="finbox"><div className="csub">Por área (incluye ventas)</div><table className="nt"><tbody><tr><th>Área</th><th>Ingresos</th><th>Gastos</th><th>Neto</th></tr>{Object.keys(byCat).sort().map(k => <tr key={k}><td>{k}</td><td style={{ color: '#3ec46d' }}>{eur0(byCat[k].i)}</td><td style={{ color: '#e63946' }}>{eur0(byCat[k].g)}</td><td><b>{eur0(byCat[k].i - byCat[k].g)}</b></td></tr>)}{!Object.keys(byCat).length && <tr><td colSpan={4} style={{ color: 'var(--muted)' }}>Sin datos.</td></tr>}</tbody></table></div>
          <div className="finbox"><div className="csub">Evolución mensual {year || ''} · <span style={{ color: '#3ec46d' }}>ingresos</span> / <span style={{ color: '#e63946' }}>gastos</span></div>{year ? <MonthChart ing={ing} gas={gas} /> : <div className="empty">Elige un año para ver la evolución.</div>}</div>
        </div>
        <div className="cars-note" style={{ margin: '14px 0 4px' }}><b>IVA:</b> en cada línea eliges el % (0/4/10/21). El <b>IVA repercutido</b> es el que cobras en tus ingresos; el <b>soportado</b>, el que pagas en gastos. <b>IVA a liquidar = repercutido − soportado</b> (lo que declararías a Hacienda). Si trabajas mucho con facturas exentas o sin IVA, deja 0%.</div>
        <div className="csub" style={{ marginTop: 10 }}>Movimientos {year && `· ${year}`}</div>
        <div style={{ overflowX: 'auto' }}><table className="nt fintable"><thead><tr><th>Fecha</th><th>Concepto</th><th>Área</th><th>Tipo</th><th>Importe</th><th>IVA %</th><th>Quién</th><th></th></tr></thead><tbody>
          {movList.map(m => <tr key={m.id}>
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
        <datalist id="fc">{Array.from(new Set([...projects().map(p => p.title), 'General', ...all.map(m => m.category)])).filter(Boolean).map(c => <option key={c} value={c} />)}</datalist>
      </> : <>
        <div className="fincards">
          <div className="fcard"><div className="fl">Anuarios vendidos</div><div className="fv" style={{ color: 'var(--accent)' }}>{anuariosVendidos}</div></div>
          <div className="fcard"><div className="fl">Ingresos anuario</div><div className="fv" style={{ color: '#3ec46d' }}>{eur0(ingAnuario)}</div></div>
          <div className="fcard"><div className="fl">Ingresos publicidad</div><div className="fv" style={{ color: '#3ec46d' }}>{eur0(ingPub)}</div></div>
          <div className="fcard"><div className="fl">Total ventas</div><div className="fv">{eur0(ingAnuario + ingPub)}</div></div>
        </div>
        <div className="cars-note" style={{ marginTop: 0 }}>Lo que apuntes aquí ya se <b>suma automáticamente</b> a los ingresos y al "Por área" de la pestaña Resumen.</div>
        <div className="csub" style={{ marginTop: 12 }}>Ventas {year && `· ${year}`}</div>
        <div style={{ overflowX: 'auto' }}><table className="nt fintable"><thead><tr><th>Fecha</th><th>Tipo</th><th>Concepto / cliente</th><th>Uds</th><th>Importe</th><th>IVA %</th><th>Quién</th><th></th></tr></thead><tbody>
          {ventasList.map(s => <tr key={s.id}>
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
      </>}
    </div></div>);
}
