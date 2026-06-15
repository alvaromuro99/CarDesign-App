/* ============ NAV + ROUTER + RESUMEN ============ */
function closeNav(){const sb=document.getElementById('sidebar'),ov=document.getElementById('overlay');if(sb)sb.classList.remove('open');if(ov)ov.classList.remove('show');}

function navItem(icon,label,active,onclick){
  const it=document.createElement('div');it.className='navitem'+(active?' active':'');
  it.innerHTML='<span class="emoji">'+icon+'</span><span class="nm">'+label+'</span>';
  it.onclick=()=>{onclick();closeNav();};return it;
}
function renderNav(){
  const n=document.getElementById('navlist');n.innerHTML='';
  n.appendChild(navItem('🗂️','Tablero',current==='board',()=>{current='board';render();}));
  n.appendChild(navItem('☰','Lista',current==='list',()=>{current='list';render();}));
  n.appendChild(navItem('📅','Calendario',current==='calendar',()=>{current='calendar';render();}));
  n.appendChild(navItem('📊','Resumen',current==='dashboard',()=>{current='dashboard';render();}));
  const lbl=document.createElement('div');lbl.className='sec-label';lbl.textContent='Proyectos';n.appendChild(lbl);
  state.projects.forEach(p=>{
    const pg=progress(p.id);
    const it=document.createElement('div');it.className='navitem'+(current==='proj:'+p.id?' active':'');
    it.innerHTML='<span class="emoji">'+(p.emoji||'📁')+'</span><span class="nm">'+esc(p.name)+'</span><span class="count">'+pg.d+'/'+pg.tot+'</span>';
    it.onclick=()=>{current='proj:'+p.id;render();closeNav();};n.appendChild(it);
  });
  const add=document.createElement('button');add.className='side-btn';add.style.margin='6px 8px';add.textContent='+ Nuevo proyecto';
  add.onclick=newProject;n.appendChild(add);
}
function newProject(){const p={id:uid(),name:'Nuevo proyecto',emoji:'📁',description:'',notion:[{id:uid(),title:'Resumen',emoji:'📄',blocks:[{id:uid(),type:'text',text:''}]}]};state.projects.push(p);save();current='proj:'+p.id;render();closeNav();}

function render(){
  renderNav();
  if(current==='board')renderBoard();
  else if(current==='list')renderTaskListView();
  else if(current==='calendar')renderCalendar();
  else if(current==='dashboard')renderDashboard();
  else if(typeof current==='string'&&current.indexOf('proj:')===0)renderProject(proj(current.slice(5)));
  else {current='board';renderBoard();}
}

function renderDashboard(){
  document.getElementById('topbar').innerHTML='<span class="emoji-lg">📊</span><div><h1>Resumen</h1><p class="desc">Todo lo que tienes entre manos en CarDesign, de un vistazo.</p></div>';
  const all=state.tasks;
  const by=k=>all.filter(t=>t.status===k).length;
  const me=currentMemberId();
  const mine=me?all.filter(t=>t.assignee===me&&t.status!=='done').length:0;
  const c=document.getElementById('content');
  let h='<div class="grid">'+
    '<div class="stat"><div class="n">'+state.projects.length+'</div><div class="l">Proyectos</div></div>'+
    '<div class="stat"><div class="n">'+all.length+'</div><div class="l">Tareas</div></div>'+
    '<div class="stat"><div class="n" style="color:var(--doing)">'+by('doing')+'</div><div class="l">En progreso</div></div>'+
    '<div class="stat"><div class="n" style="color:var(--blocked)">'+by('blocked')+'</div><div class="l">Bloqueadas</div></div>'+
    '<div class="stat"><div class="n" style="color:var(--done)">'+by('done')+'</div><div class="l">Hechas</div></div>'+
    (me?'<div class="stat" id="myTasks" style="cursor:pointer"><div class="n" style="color:var(--accent2)">'+mine+'</div><div class="l">Mis tareas pendientes</div></div>':'')+
  '</div>';
  const up=all.filter(t=>t.due&&t.status!=='done').sort((a,b)=>a.due.localeCompare(b.due)).slice(0,8);
  h+='<h2 class="sub">Próximos vencimientos</h2><div class="upcoming">';
  if(!up.length)h+='<div class="empty">No hay fechas asignadas todavía.</div>';
  else up.forEach(t=>{const p=proj(t.projectId);h+='<div class="up-row" data-id="'+t.id+'"><span class="when '+(isOverdue(t.due)?'od':'')+'">'+(isOverdue(t.due)?'¡Vencida! ':'')+fmtDate(t.due)+'</span><span style="flex:1">'+esc(t.title)+'</span><span class="chip">'+(p?(p.emoji||'📁')+' '+esc(p.name):'')+'</span></div>';});
  h+='</div><h2 class="sub">Proyectos</h2><div class="cards-proj">';
  state.projects.forEach(p=>{const pg=progress(p.id);h+='<div class="pcard" data-id="'+p.id+'"><div class="h"><span class="e">'+(p.emoji||'📁')+'</span><b>'+esc(p.name)+'</b></div><div class="pbar"><i style="width:'+pg.pct+'%"></i></div><div class="pmeta">'+pg.d+' de '+pg.tot+' hechas · '+pg.pct+'%</div></div>';});
  h+='</div>';
  c.innerHTML=h;
  const mt=c.querySelector('#myTasks');if(mt)mt.onclick=()=>{clearFilters();filters.assignee=me;current='board';render();};
  c.querySelectorAll('.pcard').forEach(el=>el.onclick=()=>{current='proj:'+el.dataset.id;render();});
  c.querySelectorAll('.up-row').forEach(el=>el.onclick=()=>openTask(el.dataset.id));
}
