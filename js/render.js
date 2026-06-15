/* ============ NAV + ROUTER + DASHBOARD ============ */
function closeNav(){const sb=document.getElementById('sidebar'),ov=document.getElementById('overlay');if(sb)sb.classList.remove('open');if(ov)ov.classList.remove('show')}
function renderNav(){
  const n=document.getElementById('navlist');n.innerHTML='';
  const dash=document.createElement('div');dash.className='navitem'+(current==='dashboard'?' active':'');
  dash.innerHTML='<span class="emoji">🏠</span><span class="nm">Inicio</span>';
  dash.onclick=()=>{current='dashboard';render();closeNav()};n.appendChild(dash);
  const lbl=document.createElement('div');lbl.className='sec-label';lbl.textContent='Proyectos';n.appendChild(lbl);
  state.projects.forEach(p=>{const pg=progress(p);
    const it=document.createElement('div');it.className='navitem'+(current===p.id?' active':'');
    it.innerHTML='<span class="emoji">'+p.emoji+'</span><span class="nm">'+esc(p.name)+'</span><span class="count">'+pg.d+'/'+pg.tot+'</span>';
    it.onclick=()=>{current=p.id;view='list';render();closeNav()};n.appendChild(it);});
  const il=document.createElement('div');il.className='sec-label';il.textContent='💡 Ideas';n.appendChild(il);
  const ideas=state.ideas||[];
  const folders=[...new Set(ideas.map(i=>i.folder||'General'))];
  folders.forEach(folder=>{
    if(folders.length>1||folder!=='General'){const fl=document.createElement('div');fl.className='sec-label';fl.style.paddingLeft='20px';fl.style.opacity='.75';fl.textContent='📁 '+folder;n.appendChild(fl);}
    ideas.filter(i=>(i.folder||'General')===folder).forEach(idea=>{
      const it=document.createElement('div');it.className='navitem'+(current==='idea:'+idea.id?' active':'');
      it.innerHTML='<span class="emoji">'+(idea.emoji||'📄')+'</span><span class="nm">'+esc(idea.title)+'</span>';
      it.onclick=()=>{current='idea:'+idea.id;render();closeNav()};n.appendChild(it);
    });
  });
  const add=document.createElement('button');add.className='side-btn';add.style.margin='6px 8px';add.textContent='+ Nueva idea';
  add.onclick=newIdea;n.appendChild(add);
}
function render(){renderNav();
  if(current==='dashboard')renderDashboard();
  else if(typeof current==='string'&&current.indexOf('idea:')===0)renderIdea(current.slice(5));
  else renderProject(proj(current));
  save();
}
function renderDashboard(){
  document.getElementById('topbar').innerHTML='<span class="emoji-lg">🏠</span><div><h1>Panel general</h1><p class="desc">Todo lo que tienes entre manos en CarDesign, de un vistazo.</p></div>';
  const all=state.projects.flatMap(p=>p.tasks);
  const done=all.filter(t=>t.status==='done').length, doing=all.filter(t=>t.status==='doing').length;
  const c=document.getElementById('content');
  let h='<div class="grid">'+
    '<div class="stat"><div class="n">'+state.projects.length+'</div><div class="l">Proyectos activos</div></div>'+
    '<div class="stat"><div class="n">'+all.length+'</div><div class="l">Tareas totales</div></div>'+
    '<div class="stat"><div class="n" style="color:var(--doing)">'+doing+'</div><div class="l">En curso</div></div>'+
    '<div class="stat"><div class="n" style="color:var(--done)">'+done+'</div><div class="l">Completadas</div></div>'+
    '<div class="stat"><div class="n" style="color:var(--accent2)">'+(state.ideas||[]).length+'</div><div class="l">Ideas guardadas</div></div>'+
  '</div>';
  const up=all.filter(t=>t.due&&t.status!=='done').map(t=>({t,p:state.projects.find(x=>x.tasks.includes(t))})).sort((a,b)=>a.t.due.localeCompare(b.t.due)).slice(0,8);
  h+='<h2 class="sub">Próximos vencimientos</h2><div class="upcoming">';
  if(!up.length)h+='<div class="empty">No hay fechas asignadas todavía. Añade fechas a las tareas y aparecerán aquí.</div>';
  else up.forEach(o=>{h+='<div class="up-row"><span class="when '+(isOverdue(o.t.due)?'od':'')+'">'+(isOverdue(o.t.due)?'¡Vencida! ':'')+fmtDate(o.t.due)+'</span><span style="flex:1">'+esc(o.t.title)+'</span><span class="pill">'+o.p.emoji+' '+esc(o.p.name)+'</span></div>'});
  h+='</div><h2 class="sub">Proyectos</h2><div class="cards-proj">';
  state.projects.forEach(p=>{const pg=progress(p);
    h+='<div class="pcard" data-id="'+p.id+'"><div class="h"><span class="e">'+p.emoji+'</span><b>'+esc(p.name)+'</b></div><div class="pbar"><i style="width:'+pg.pct+'%"></i></div><div class="pmeta">'+pg.d+' de '+pg.tot+' completadas · '+pg.pct+'%</div></div>'});
  h+='</div>';c.innerHTML=h;
  c.querySelectorAll('.pcard').forEach(el=>el.onclick=()=>{current=el.dataset.id;view='list';render()});
}
