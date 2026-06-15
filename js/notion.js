/* ============ VISTA PROYECTO = SU NOTION (+ coches + tareas) ============ */
let projTab={}; /* projectId -> 'page:<id>' | 'cars' */

function renderProject(p){
  if(!p){current='board';return renderBoard();}
  const pg=progress(p.id);
  document.getElementById('topbar').innerHTML=
    '<span class="emoji-lg" id="pEmoji" title="Cambiar emoji" style="cursor:pointer">'+(p.emoji||'📁')+'</span>'+
    '<div style="flex:1">'+
      '<h1 contenteditable spellcheck="false" id="pName">'+esc(p.name)+'</h1>'+
      '<p class="desc" contenteditable spellcheck="false" id="pDesc">'+esc(p.description||'')+'</p>'+
      '<div class="pbar"><i style="width:'+pg.pct+'%"></i></div>'+
      '<div class="pmeta">'+pg.d+' de '+pg.tot+' tareas hechas · '+pg.pct+'%</div>'+
    '</div>'+
    '<button class="addtask" id="pTasks">Ver tareas</button>'+
    '<button class="del" id="pDel" title="Eliminar proyecto" style="font-size:18px;color:var(--muted);background:transparent;border:0">🗑</button>';
  document.getElementById('pName').onblur=e=>{p.name=e.target.textContent.trim()||'Sin título';save();renderNav();};
  document.getElementById('pDesc').onblur=e=>{p.description=e.target.textContent.trim();save();};
  document.getElementById('pEmoji').onclick=()=>{const e=prompt('Emoji del proyecto:',p.emoji||'📁');if(e!==null){p.emoji=e.trim()||'📁';save();render();}};
  document.getElementById('pTasks').onclick=()=>{clearFilters();filters.project=p.id;current='board';render();};
  document.getElementById('pDel').onclick=()=>{if(confirm('¿Eliminar este proyecto, sus páginas y sus tareas?')){state.projects=state.projects.filter(x=>x.id!==p.id);state.tasks=state.tasks.filter(t=>t.projectId!==p.id);current='board';render();}};

  if(!p.notion)p.notion=[];
  let tab=projTab[p.id];
  const validPage=id=>p.notion.some(pg=>'page:'+pg.id===id);
  if(!tab || (tab!=='cars' && !validPage(tab))){ tab = p.cars?'cars': (p.notion[0]?'page:'+p.notion[0].id:'') ; }
  projTab[p.id]=tab;

  const c=document.getElementById('content');
  let tabs='<div class="ptabs">';
  if(p.cars)tabs+='<button class="ptab '+(tab==='cars'?'on':'')+'" data-tab="cars">🚗 Coches</button>';
  p.notion.forEach(pg=>{tabs+='<button class="ptab '+(tab==='page:'+pg.id?'on':'')+'" data-tab="page:'+pg.id+'">'+(pg.emoji||'📄')+' '+esc(pg.title)+'</button>';});
  tabs+='<button class="ptab add" data-tab="newpage">+ Página</button>';
  tabs+='</div>';
  c.innerHTML=tabs+'<div id="pbody"></div>';
  c.querySelectorAll('.ptab').forEach(b=>b.onclick=()=>{
    if(b.dataset.tab==='newpage'){const np={id:uid(),title:'Nueva página',emoji:'📄',blocks:[{id:uid(),type:'text',text:''}]};p.notion.push(np);projTab[p.id]='page:'+np.id;save();render();return;}
    projTab[p.id]=b.dataset.tab;renderProject(p);
  });
  if(tab==='cars'&&p.cars)renderCars(p);
  else if(tab&&tab.indexOf('page:')===0)renderPage(p,tab.slice(5));
  else document.getElementById('pbody').innerHTML='<div class="empty">Crea la primera página de este proyecto con “+ Página”.</div>';
}

/* ---- Página Notion (bloques) ---- */
function renderPage(p,pageId){
  const page=p.notion.find(x=>x.id===pageId);if(!page){document.getElementById('pbody').innerHTML='';return;}
  const body=document.getElementById('pbody');
  let h='<div class="pagehead"><span class="pe" id="pgEmoji" title="Emoji" style="cursor:pointer">'+(page.emoji||'📄')+'</span><h2 contenteditable spellcheck="false" id="pgTitle">'+esc(page.title)+'</h2><button class="mini" id="pgDel">🗑 Borrar página</button></div>';
  h+='<div id="blocks"></div>';
  body.innerHTML=h;
  body.querySelector('#pgTitle').onblur=e=>{page.title=e.target.textContent.trim()||'Sin título';save();renderProject(p);};
  body.querySelector('#pgEmoji').onclick=()=>{const e=prompt('Emoji de la página:',page.emoji||'📄');if(e!==null){page.emoji=e.trim()||'📄';save();renderProject(p);}};
  body.querySelector('#pgDel').onclick=()=>{if(confirm('¿Borrar esta página?')){p.notion=p.notion.filter(x=>x.id!==page.id);projTab[p.id]=p.notion[0]?'page:'+p.notion[0].id:'';save();renderProject(p);}};
  renderBlocks(page);
}
function renderBlocks(page){
  const c=document.getElementById('blocks');let h='';
  (page.blocks||[]).forEach(b=>{
    h+='<div class="idea-block" data-id="'+b.id+'"><div class="bh"><span class="bt">'+(b.type==='text'?'Texto':b.type==='list'?'Lista':'Tabla')+'</span><button class="bdel" data-act="bdel">🗑</button></div>';
    if(b.type==='text')h+='<div class="idea-text" contenteditable spellcheck="false" data-bf="text">'+esc(b.text||'')+'</div>';
    else if(b.type==='list')h+='<ul class="idea-list">'+(b.items||[]).map((it,ix)=>'<li contenteditable spellcheck="false" data-li="'+ix+'">'+esc(it)+'</li>').join('')+'</ul><button class="mini" data-act="addli" style="margin-top:6px">+ línea</button>';
    else if(b.type==='table')h+='<div style="overflow-x:auto"><table class="idea-tbl"><tbody>'+(b.rows||[]).map((row,ri)=>'<tr>'+row.map((cell,ci)=>'<td contenteditable spellcheck="false" data-r="'+ri+'" data-c="'+ci+'">'+esc(cell)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div><div style="margin-top:6px;display:flex;gap:8px"><button class="mini" data-act="addrow">+ fila</button><button class="mini" data-act="addcol">+ columna</button></div>';
    h+='</div>';
  });
  h+='<div class="idea-addopts"><button data-add="text">+ Texto</button><button data-add="list">+ Lista</button><button data-add="table">+ Tabla</button></div>';
  c.innerHTML=h;bindBlocks(page,c);
}
function bindBlocks(page,c){
  c.querySelectorAll('.idea-block').forEach(el=>{
    const b=page.blocks.find(x=>x.id===el.dataset.id);
    el.querySelector('[data-act="bdel"]').onclick=()=>{page.blocks=page.blocks.filter(x=>x.id!==b.id);save();renderBlocks(page);};
    const tx=el.querySelector('[data-bf="text"]');if(tx)tx.onblur=()=>{b.text=tx.innerText;save();};
    el.querySelectorAll('[data-li]').forEach(li=>li.onblur=()=>{b.items[+li.dataset.li]=li.innerText;save();});
    const addli=el.querySelector('[data-act="addli"]');if(addli)addli.onclick=()=>{b.items.push('');save();renderBlocks(page);};
    el.querySelectorAll('[data-r]').forEach(td=>td.onblur=()=>{b.rows[+td.dataset.r][+td.dataset.c]=td.innerText;save();});
    const ar=el.querySelector('[data-act="addrow"]');if(ar)ar.onclick=()=>{const cols=(b.rows[0]||['','']).length;b.rows.push(Array(cols).fill(''));save();renderBlocks(page);};
    const ac=el.querySelector('[data-act="addcol"]');if(ac)ac.onclick=()=>{b.rows.forEach(r=>r.push(''));save();renderBlocks(page);};
  });
  c.querySelectorAll('[data-add]').forEach(btn=>btn.onclick=()=>{const ty=btn.dataset.add;const nb={id:uid(),type:ty};if(ty==='text')nb.text='';else if(ty==='list')nb.items=[''];else nb.rows=[['Columna 1','Columna 2'],['',''],['','']];page.blocks.push(nb);save();renderBlocks(page);});
}

/* ---- Coches (igual que antes) ---- */
function carCounts(list){return {tot:list.length,confirmado:list.filter(c=>c.estado==='confirmado').length,interes:list.filter(c=>c.estado==='interes').length,pendiente:list.filter(c=>c.estado==='pendiente').length,ifema:list.filter(c=>c.ifema).length}}
function renderCars(p){
  const body=document.getElementById('pbody');
  const all=[].concat(p.cars.marcaEspana||[],p.cars.escuderias||[]);const cc=carCounts(all);
  let h='<div class="cars-summary">'+
    '<div class="chip2"><b>'+cc.tot+'</b>coches</div>'+
    '<div class="chip2" style="color:var(--conf)"><b>'+cc.confirmado+'</b>confirmados</div>'+
    '<div class="chip2" style="color:var(--interes)"><b>'+cc.interes+'</b>interés</div>'+
    '<div class="chip2" style="color:var(--pend)"><b>'+cc.pendiente+'</b>pendientes</div>'+
    '<div class="chip2"><b>'+cc.ifema+'</b>IFEMA</div></div>'+
    '<div class="cars-note">Objetivo: <b>48 coches</b>. Marca "IFEMA" cuando cada coche quede aprobado.</div>';
  h+=carTable(p,'marcaEspana','🇪🇸 Marca España');
  h+=carTable(p,'escuderias','🏁 Superdeportivos / Escuderías');
  body.innerHTML=h;bindCars(p,body);
}
function carTable(p,key,title){
  const list=p.cars[key]||[];const cc=carCounts(list);
  let h='<div class="section-head" style="margin-top:6px">'+title+' <span class="ln"></span> <span style="color:var(--muted);font-weight:400;text-transform:none">'+cc.tot+' · '+cc.confirmado+' conf.</span></div>'+
  '<div style="overflow-x:auto"><table class="cars"><thead><tr><th>#</th><th>Marca / Coleccionista</th><th>Modelo</th><th>Encargado</th><th>Estado</th><th>IFEMA</th><th></th></tr></thead><tbody>';
  list.forEach((car,i)=>{
    h+='<tr data-key="'+key+'" data-id="'+car.id+'">'+
      '<td class="idx">'+(i+1)+'</td>'+
      '<td contenteditable spellcheck="false" data-cf="marca">'+esc(car.marca)+'</td>'+
      '<td contenteditable spellcheck="false" data-cf="modelo">'+esc(car.modelo)+'</td>'+
      '<td class="enc" contenteditable spellcheck="false" data-cf="encargado">'+esc(car.encargado||'')+'</td>'+
      '<td class="est"><span class="selwrap" style="color:'+CESTADO[car.estado].color+';border-color:'+CESTADO[car.estado].color+'"><span class="dot" style="background:'+CESTADO[car.estado].color+'"></span><select data-cf="estado">'+Object.keys(CESTADO).map(k=>'<option value="'+k+'" '+(car.estado===k?'selected':'')+'>'+CESTADO[k].label+'</option>').join('')+'</select></span></td>'+
      '<td class="ife"><input type="checkbox" class="ife-box" data-cf="ifema" '+(car.ifema?'checked':'')+'></td>'+
      '<td class="actc"><button class="del" data-cact="del">×</button></td></tr>';
  });
  h+='</tbody></table></div><button class="addrow-btn" data-add="'+key+'">+ Añadir coche</button>';
  return h;
}
function bindCars(p,c){
  c.querySelectorAll('tr[data-id]').forEach(tr=>{
    const list=p.cars[tr.dataset.key];const car=list.find(x=>x.id===tr.dataset.id);
    tr.querySelectorAll('[data-cf]').forEach(f=>{const field=f.dataset.cf;
      if(f.type==='checkbox'){f.onchange=()=>{car.ifema=f.checked;save();renderCars(p);};}
      else if(f.tagName==='SELECT'){f.onchange=()=>{car.estado=f.value;save();renderCars(p);};}
      else{f.onblur=()=>{car[field]=f.textContent.trim();save();};}
    });
    tr.querySelector('[data-cact="del"]').onclick=()=>{p.cars[tr.dataset.key]=list.filter(x=>x.id!==car.id);save();renderCars(p);};
  });
  c.querySelectorAll('[data-add]').forEach(b=>b.onclick=()=>{p.cars[b.dataset.add].push({id:uid(),marca:'Nueva marca',modelo:'Modelo',estado:'pendiente',encargado:'',ifema:false});save();renderCars(p);});
}
