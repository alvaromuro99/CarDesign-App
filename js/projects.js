/* ============ PROYECTOS ============ */
function renderProject(p){
  if(!p){current='dashboard';return renderDashboard()}
  const pg=progress(p);
  const carsTab=p.cars?'<button class="'+(view==='cars'?'on':'')+'" id="vCars">🚗 Coches</button>':'';
  document.getElementById('topbar').innerHTML='<span class="emoji-lg">'+p.emoji+'</span>'+
    '<div style="flex:1">'+
      '<h1 contenteditable spellcheck="false" id="pName">'+esc(p.name)+'</h1>'+
      '<p class="desc" contenteditable spellcheck="false" id="pDesc">'+esc(p.description||'')+'</p>'+
      '<div class="pbar"><i style="width:'+pg.pct+'%"></i></div>'+
      '<div class="pmeta">'+pg.d+' de '+pg.tot+' completadas · '+pg.pct+'%</div>'+
    '</div>'+
    '<div class="viewtoggle">'+
      '<button class="'+(view==='list'?'on':'')+'" id="vList">☰ Lista</button>'+
      '<button class="'+(view==='board'?'on':'')+'" id="vBoard">▦ Tablero</button>'+carsTab+
    '</div>'+
    '<button class="addtask" id="addTask">+ Tarea</button>'+
    '<button class="del" title="Eliminar proyecto" id="delProj" style="font-size:18px;color:var(--muted);background:transparent;border:0">🗑</button>';
  document.getElementById('pName').onblur=e=>{p.name=e.target.textContent.trim()||'Sin título';save();renderNav()};
  document.getElementById('pDesc').onblur=e=>{p.description=e.target.textContent.trim();save()};
  document.getElementById('vList').onclick=()=>{view='list';renderProject(p)};
  document.getElementById('vBoard').onclick=()=>{view='board';renderProject(p)};
  if(p.cars)document.getElementById('vCars').onclick=()=>{view='cars';renderProject(p)};
  document.getElementById('addTask').onclick=()=>{p.tasks.unshift({id:uid(),title:'Nueva tarea',section:'General',status:'todo',priority:'media',due:'',notes:''});view='list';render()};
  document.getElementById('delProj').onclick=()=>{if(confirm('¿Eliminar este proyecto y todas sus tareas?')){state.projects=state.projects.filter(x=>x.id!==p.id);current='dashboard';render()}};
  if(view==='cars'&&p.cars)renderCars(p);else if(view==='board')renderBoard(p);else renderList(p);
}
function selStatus(t){return '<span class="selwrap" style="color:'+STATUS[t.status].color+';border-color:'+STATUS[t.status].color+'"><span class="dot" style="background:'+STATUS[t.status].color+'"></span><select data-f="status">'+Object.entries(STATUS).map(([k,v])=>'<option value="'+k+'" '+(t.status===k?'selected':'')+'>'+v.label+'</option>').join('')+'</select></span>'}
function selPrio(t){return '<span class="selwrap" style="color:'+PRIO[t.priority].color+';border-color:'+PRIO[t.priority].color+'"><span class="dot" style="background:'+PRIO[t.priority].color+'"></span><select data-f="priority">'+Object.entries(PRIO).map(([k,v])=>'<option value="'+k+'" '+(t.priority===k?'selected':'')+'>'+v.label+'</option>').join('')+'</select></span>'}

function renderList(p){
  const c=document.getElementById('content');
  const sections=[...new Set(p.tasks.map(t=>t.section||'General'))];
  let h='';
  sections.forEach(sec=>{
    h+='<div class="section-block"><div class="section-head">'+esc(sec)+' <span class="ln"></span></div>';
    p.tasks.filter(t=>(t.section||'General')===sec).forEach(t=>{
      h+='<div class="task '+(t.status==='done'?'done':'')+'" data-id="'+t.id+'" style="border-left-color:'+STATUS[t.status].color+'">'+
        '<button class="chk '+(t.status==='done'?'on':'')+'" data-act="toggle">'+(t.status==='done'?'✓':'')+'</button>'+
        '<div class="body">'+
          '<div class="ttl" contenteditable spellcheck="false" data-f="title">'+esc(t.title)+'</div>'+
          '<div class="meta">'+selStatus(t)+selPrio(t)+
            '<input class="pill" type="date" data-f="due" value="'+(t.due||'')+'">'+
            '<input class="pill" data-f="section" value="'+esc(t.section||'')+'" placeholder="sección" style="width:110px">'+
          '</div>'+
          '<div class="notes" contenteditable spellcheck="false" data-f="notes">'+esc(t.notes||'')+'</div>'+
        '</div>'+
        '<button class="del" data-act="del">×</button>'+
      '</div>';
    });
    h+='</div>';
  });
  if(!p.tasks.length)h+='<div class="empty">Sin tareas. Pulsa “+ Tarea” para empezar.</div>';
  c.innerHTML=h;bindTasks(p,c);
}
function bindTasks(p,c){
  c.querySelectorAll('.task').forEach(el=>{
    const t=p.tasks.find(x=>x.id===el.dataset.id);
    el.querySelector('[data-act="toggle"]').onclick=()=>{t.status=t.status==='done'?'todo':'done';renderProject(p)};
    el.querySelector('[data-act="del"]').onclick=()=>{p.tasks=p.tasks.filter(x=>x.id!==t.id);renderProject(p)};
    el.querySelectorAll('[data-f]').forEach(f=>{const field=f.dataset.f;
      if(f.tagName==='SELECT'||f.tagName==='INPUT'){f.onchange=()=>{t[field]=f.value;(field==='status'||field==='priority'||field==='section')?renderProject(p):save()}}
      else{f.onblur=()=>{t[field]=f.textContent.trim();(field==='title')?(save(),renderNav()):save()}}
    });
  });
}
function renderBoard(p){
  const c=document.getElementById('content');let h='<div class="board">';
  Object.entries(STATUS).forEach(([k,v])=>{
    const tasks=p.tasks.filter(t=>t.status===k);
    h+='<div class="col" data-status="'+k+'"><h3><span class="dot" style="background:'+v.color+'"></span>'+v.label+'<span class="c">'+tasks.length+'</span></h3><div class="drop">';
    tasks.forEach(t=>{h+='<div class="card" draggable="true" data-id="'+t.id+'" style="border-left-color:'+PRIO[t.priority].color+'">'+
        '<div class="ct">'+esc(t.title)+'</div><div class="cm"><span class="pill"><span class="dot" style="background:'+PRIO[t.priority].color+'"></span>'+PRIO[t.priority].label+'</span>'+
        (t.section?'<span class="pill">'+esc(t.section)+'</span>':'')+
        (t.due?'<span class="pill" style="'+(isOverdue(t.due)&&t.status!=='done'?'color:var(--accent)':'')+'">📅 '+fmtDate(t.due)+'</span>':'')+
        '</div></div>'});
    h+='</div></div>';
  });
  h+='</div>';c.innerHTML=h;
  let dragId=null;
  c.querySelectorAll('.card').forEach(card=>{
    card.ondragstart=()=>{dragId=card.dataset.id;card.classList.add('dragging')};
    card.ondragend=()=>card.classList.remove('dragging');
    card.onclick=()=>{view='list';renderProject(p)};
  });
  c.querySelectorAll('.col').forEach(col=>{
    col.ondragover=e=>{e.preventDefault();col.classList.add('dragover')};
    col.ondragleave=()=>col.classList.remove('dragover');
    col.ondrop=e=>{e.preventDefault();col.classList.remove('dragover');const t=p.tasks.find(x=>x.id===dragId);if(t){t.status=col.dataset.status;renderProject(p)}};
  });
}
/* Coches */
function carCounts(list){return {tot:list.length,confirmado:list.filter(c=>c.estado==='confirmado').length,interes:list.filter(c=>c.estado==='interes').length,pendiente:list.filter(c=>c.estado==='pendiente').length,ifema:list.filter(c=>c.ifema).length}}
function renderCars(p){
  const c=document.getElementById('content');
  const all=[...(p.cars.marcaEspana||[]),...(p.cars.escuderias||[])];const cc=carCounts(all);
  let h='<div class="cars-summary">'+
    '<div class="chip"><b>'+cc.tot+'</b>coches en lista</div>'+
    '<div class="chip" style="color:var(--conf)"><b>'+cc.confirmado+'</b>confirmados</div>'+
    '<div class="chip" style="color:var(--interes)"><b>'+cc.interes+'</b>interés en venir</div>'+
    '<div class="chip" style="color:var(--pend)"><b>'+cc.pendiente+'</b>pendientes</div>'+
    '<div class="chip"><b>'+cc.ifema+'</b>aprobados IFEMA</div></div>'+
    '<div class="cars-note">Objetivo: <b>48 coches</b> (2 bloques). La lista es una estimación enviada a IFEMA; marca la casilla "IFEMA" cuando cada coche quede aprobado.</div>';
  h+=carTable(p,'marcaEspana','🇪🇸 Marca España');
  h+=carTable(p,'escuderias','🏁 Superdeportivos / Escuderías');
  c.innerHTML=h;bindCars(p,c);
}
function carTable(p,key,title){
  const list=p.cars[key]||[];const cc=carCounts(list);
  let h='<div class="section-head" style="margin-top:6px">'+title+' <span class="ln"></span> <span style="color:var(--muted);font-weight:400;text-transform:none;letter-spacing:0">'+cc.tot+' coches · '+cc.confirmado+' conf.</span></div>'+
  '<table class="cars"><thead><tr><th>#</th><th>Marca / Coleccionista</th><th>Modelo</th><th>Encargado</th><th>Estado</th><th>IFEMA</th><th></th></tr></thead><tbody>';
  list.forEach((car,i)=>{
    h+='<tr data-key="'+key+'" data-id="'+car.id+'">'+
      '<td class="idx">'+(i+1)+'</td>'+
      '<td contenteditable spellcheck="false" data-cf="marca">'+esc(car.marca)+'</td>'+
      '<td contenteditable spellcheck="false" data-cf="modelo">'+esc(car.modelo)+'</td>'+
      '<td class="enc" contenteditable spellcheck="false" data-cf="encargado">'+esc(car.encargado||'')+'</td>'+
      '<td class="est"><span class="selwrap" style="color:'+CESTADO[car.estado].color+';border-color:'+CESTADO[car.estado].color+'"><span class="dot" style="background:'+CESTADO[car.estado].color+'"></span><select data-cf="estado">'+Object.entries(CESTADO).map(([k,v])=>'<option value="'+k+'" '+(car.estado===k?'selected':'')+'>'+v.label+'</option>').join('')+'</select></span></td>'+
      '<td class="ife"><input type="checkbox" class="ife-box" data-cf="ifema" '+(car.ifema?'checked':'')+'></td>'+
      '<td class="actc"><button class="del" data-cact="del">×</button></td>'+
    '</tr>';
  });
  h+='</tbody></table><button class="addrow-btn" data-add="'+key+'">+ Añadir coche</button>';
  return h;
}
function bindCars(p,c){
  c.querySelectorAll('tr[data-id]').forEach(tr=>{
    const list=p.cars[tr.dataset.key];const car=list.find(x=>x.id===tr.dataset.id);
    tr.querySelectorAll('[data-cf]').forEach(f=>{const field=f.dataset.cf;
      if(f.type==='checkbox'){f.onchange=()=>{car.ifema=f.checked;renderProject(p)}}
      else if(f.tagName==='SELECT'){f.onchange=()=>{car.estado=f.value;renderProject(p)}}
      else{f.onblur=()=>{car[field]=f.textContent.trim();save()}}
    });
    tr.querySelector('[data-cact="del"]').onclick=()=>{p.cars[tr.dataset.key]=list.filter(x=>x.id!==car.id);renderProject(p)};
  });
  c.querySelectorAll('[data-add]').forEach(b=>b.onclick=()=>{p.cars[b.dataset.add].push({id:uid(),marca:'Nueva marca',modelo:'Modelo',estado:'pendiente',encargado:'',ifema:false});renderProject(p)});
}
