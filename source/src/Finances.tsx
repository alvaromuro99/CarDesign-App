import React, { useState } from 'react';
import { finances, addMovement, updateMovement, deleteMovement, projects, members, member, sales, addSale, updateSale, deleteSale } from './store';
const eur = (n: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n || 0);
const whoLabel = (w: string) => w === 'empresa' ? 'Revista (empresa)' : (member(w)?.name || w);

export default function Finances() {
  const [tab, setTab] = useState<'mov' | 'ventas'>('mov');
  const all = finances();
  const years = Array.from(new Set([...all.map(m => (m.date || '').slice(0, 4)), ...sales().map(s => (s.date || '').slice(0, 4))].filter(Boolean))).sort().reverse();
  const [year, setYear] = useState<string>(years[0] || String(new Date().getFullYear()));
  const whoOpts = ['empresa', ...members().map(m => m.id)];

  const movList = all.filter(m => !year || (m.date || '').slice(0, 4) === year).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const ingresos = movList.filter(m => m.type === 'ingreso').reduce((s, m) => s + (+m.amount || 0), 0);
  const gastos = movList.filter(m => m.type === 'gasto').reduce((s, m) => s + (+m.amount || 0), 0);
  const ivaRep = movList.filter(m => m.type === 'ingreso').reduce((s, m) => s + (+m.amount || 0) * (+m.iva || 0) / 100, 0);
  const ivaSop = movList.filter(m => m.type === 'gasto').reduce((s, m) => s + (+m.amount || 0) * (+m.iva || 0) / 100, 0);
  const neto = ingresos - gastos;
  const byCat: Record<string, { i: number; g: number }> = {};
  movList.forEach(m => { (byCat[m.category] = byCat[m.category] || { i: 0, g: 0 })[m.type === 'ingreso' ? 'i' : 'g'] += (+m.amount || 0); });

  const ventasList = sales().filter(s => !year || (s.date || '').slice(0, 4) === year).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const anuariosVendidos = ventasList.filter(s => s.type === 'anuario').reduce((s, x) => s + (+x.units || 0), 0);
  const ingAnuario = ventasList.filter(s => s.type === 'anuario').reduce((s, x) => s + (+x.amount || 0), 0);
  const ingPub = ventasList.filter(s => s.type === 'publicidad').reduce((s, x) => s + (+x.amount || 0), 0);

  return (<div className="boardwrap"><div className="topbar"><span className="crumb">💰 Finanzas</span></div>
    <div className="finwrap">
      <div className="toolbar">
        <div className="views"><button className={tab === 'mov' ? 'on' : ''} onClick={() => setTab('mov')}>Movimientos</button><button className={tab === 'ventas' ? 'on' : ''} onClick={() => setTab('ventas')}>Ventas anuario</button></div>
        <select className="fsel" value={year} onChange={e => setYear(e.target.value)}><option value="">Todos los años</option>{years.map(y => <option key={y} value={y}>{y}</option>)}{!years.includes(year) && year && <option value={year}>{year}</option>}</select>
        <span style={{ flex: 1 }} />
        {tab === 'mov' ? <button className="addtask" onClick={() => addMovement({ date: (year && year.length === 4 ? year : String(new Date().getFullYear())) + new Date().toISOString().slice(4, 10) })}>+ Movimiento</button>
          : <button className="addtask" onClick={() => addSale({ date: (year && year.length === 4 ? year : String(new Date().getFullYear())) + new Date().toISOString().slice(4, 10) })}>+ Venta</button>}
      </div>

      {tab === 'mov' ? <>
        <div className="fincards">
          <div className="fcard"><div className="fl">Ingresos</div><div className="fv" style={{ color: '#3ec46d' }}>{eur(ingresos)}</div></div>
          <div className="fcard"><div className="fl">Gastos</div><div className="fv" style={{ color: '#e63946' }}>{eur(gastos)}</div></div>
          <div className="fcard"><div className="fl">Resultado (beneficio)</div><div className="fv" style={{ color: neto >= 0 ? '#3ec46d' : '#e63946' }}>{eur(neto)}</div></div>
          <div className="fcard"><div className="fl">IVA repercutido − soportado</div><div className="fv" style={{ fontSize: 20 }}>{eur(ivaRep - ivaSop)}</div></div>
        </div>
        <div className="finbox"><div className="csub">Por área</div><table className="nt"><tbody><tr><th>Área</th><th>Ingresos</th><th>Gastos</th><th>Neto</th></tr>{Object.keys(byCat).sort().map(k => <tr key={k}><td>{k}</td><td style={{ color: '#3ec46d' }}>{eur(byCat[k].i)}</td><td style={{ color: '#e63946' }}>{eur(byCat[k].g)}</td><td><b>{eur(byCat[k].i - byCat[k].g)}</b></td></tr>)}</tbody></table></div>
        <div className="csub" style={{ marginTop: 16 }}>Movimientos {year && `· ${year}`}</div>
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
          <div className="fcard"><div className="fl">Ingresos anuario</div><div className="fv" style={{ color: '#3ec46d' }}>{eur(ingAnuario)}</div></div>
          <div className="fcard"><div className="fl">Ingresos publicidad</div><div className="fv" style={{ color: '#3ec46d' }}>{eur(ingPub)}</div></div>
          <div className="fcard"><div className="fl">Total ventas</div><div className="fv">{eur(ingAnuario + ingPub)}</div></div>
        </div>
        <div className="csub">Ventas {year && `· ${year}`}</div>
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
