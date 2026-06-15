/* ============ TABLERO GLOBAL + LISTA + CALENDARIO ============ */

function avatar(memberId,small){
  const m=member(memberId);
  if(!m)return '<span class="chip muted">sin asignar</span>';
  const ini=(m.name||'?').trim().slice(0,2);
  return '<span class="ava'+(small?' sm':'')+'" title="'+esc(m.name)+'" style="background:'+(m.color||'#666')+'">'+esc(ini)+'</span>';
}
function projChip(pid){const p=proj(pid);if(!p)return '';return '<span class="chip proj" data-proj="'+pid+'">'+(p.emoji||'📁')+' '+esc(p.name)+'</span>';}

/* ---- Toolbar ---- */
function toolbarHTML(active){
  const projOpts=['<option value="">Todos los proyectos</option>'].concat(state.projects.map(p=>'<option value="'+p.id+'" '+(filters.project===p.id?'selected':'')+'>'+esc(p.name)+'</option>')).join('');
  const memOpts=['<option value="">Cualquier responsable</option>'].concat(state.members.map(m=>'<option value="'+m.id+'" '+(filters.assignee===m.id?'selected':'')+'>'+esc(m.name)+'</option>')).join('');
  const prioOpts=['<option value="">Cualquier prioridad</option>'].concat(Object.keys(PRIO).map(k=>'<option value="'+k+'" '+(filters.priority===k?'selected':'')+'>'+PRIO[k].label+'</option>')).join('');
  return ''+
  '<div class="toolbar">'+
    '<div class="views">'+
      '<button class="'+(active==='board'?'on':'')+'" data-view="board">▦ Tablero</button>'+
      '<button class="'+(active==='list'?'on':'')+'" data-view="list">☰ Lista</button>'+
      '<button class="'+(active==='calendar'?'on':'')+'" data-view="calendar">📅 Calendario</button>'+
    '</div>'+
    '<input id="fq" class="search" type="search" placeholder="Buscar tareas…" value="'+esc(filters.q)+'">'+
    '<select id="fproj" class="fsel">'+projOpts+'</select>'+
    '<select id="fass" class="fsel">'+memOpts+'</select>'+
    '<select id="fprio" class="fsel">'+prioOpts+'</select>'+
    (filtersActive()?'<button id="fclear" class="fclear">✕ Limpiar</button>':'')+
    '<span class="tspacer"></span>'+
    '<button class="addtask" id="addTask">+ Tarea</button>'+
  '</div>';
}
function bindToolbar(c){
  const view=v=>{current=v;render()};
  c.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>view(b.dataset.view));
  const q=c.querySelector('#fq');if(q)q.oninput=()=>{filters.q=q.value;rerenderBody();};
  const fp=c.querySelector('#fproj');if(fp)fp.onchange=()=>{filters.project=fp.value;render()};
  const fa=c.querySelector('#fass');if(fa)fa.onchange=()=>{filters.assignee=fa.value;render()};
  const fpr=c.querySelector('#fprio');if(fpr)fpr.onchange=()=>{filters.priority=fpr.value;render()};
  const fc=c.querySelector('#fclear');if(fc)fc.onclick=()=>{clearFilters();render()};
  const at=c.querySelector('#addTask');if(at)at.onclick=()=>newTask();
}
/* re-render solo el cuerpo (para búsqueda en vivo sin perder foco del input) */
function rerenderBody(){
  if(current==='board')paintBoard();
  else if(current==='list')paintList();
  else if(current==='calendar')paintCalendar();
}

function newTask(status){
  const pid=filters.project||(state.projects[0]&&state.projects[0].id)||'';
  const t={id:uid(),projectId:pid,title:'Nueva tarea',status:status||'todo',priority:'media',assignee:'',due:'',labels:[],notes:'',comments:[],order:nextOrder(status||'todo'),createdAt:Date.now()};
  state.tasks.unshift(t);save();render();openTask(t.id);
}

/* ---- Tarjeta ---- */
function taskCardHTML(t){
  const p=proj(t.projectId);
  return '<div class="tcard" data-id="'+t.id+'" style="border-left-color:'+PRIO[t.priority].color+'">'+
    '<div class="tc-grip" data-drag title="Arrastrar">⠿</div>'+
    '<div class="tc-main">'+
      '<div class="tc-title">'+esc(t.title)+'</div>'+
      '<div class="tc-meta">'+
        projChip(t.projectId)+
        '<span class="chip"><span class="dot" style="background:'+PRIO[t.priority].color+'"></span>'+PRIO[t.priority].label+'</span>'+
        (t.due?'<span class="chip'+(isOverdue(t.due)&&t.status!=='done'?' over':'')+'">📅 '+fmtDate(t.due)+'</span>':'')+
        avatar(t.assignee,true)+
      '</div>'+
    '</div>'+
  '</div>';
}
function bindCards(c){
  c.querySelectorAll('.tcard').forEach(card=>{
    card.addEventListener('click',e=>{
      if(e.target.closest('[data-drag]'))return;
      const pc=e.target.closest('[data-proj]');
      if(pc){current='proj:'+pc.dataset.proj;render();return;}
      openTask(card.dataset.id);
    });
  });
  enableCardDrag(c);
}

/* ---- Drag pointer (ratón + táctil) ---- */
function enableCardDrag(root){
  let dragEl=null,ptrId=null,handleEl=null;
  function cardAfter(drop,y){
    const cards=Array.prototype.slice.call(drop.querySelectorAll('.tcard:not(.dragging)'));
    for(let i=0;i<cards.length;i++){const r=cards[i].getBoundingClientRect();if(y<r.top+r.height/2)return cards[i];}
    return null;
  }
  root.querySelectorAll('[data-drag]').forEach(h=>{
    h.style.touchAction='none';
    h.addEventListener('pointerdown',e=>{
      e.preventDefault();
      const card=h.closest('.tcard');if(!card)return;
      dragEl=card;ptrId=e.pointerId;handleEl=h;
      card.classList.add('dragging');card.style.pointerEvents='none';
      try{h.setPointerCapture(ptrId);}catch(_){}
      h.addEventListener('pointermove',move);h.addEventListener('pointerup',up);h.addEventListener('pointercancel',up);
    });
  });
  function move(ev){
    if(!dragEl)return;
    const el=document.elementFromPoint(ev.clientX,ev.clientY);
    const drop=el&&el.closest?el.closest('.drop'):null;
    if(!drop)return;
    const after=cardAfter(drop,ev.clientY);
    if(after==null)drop.appendChild(dragEl);else drop.insertBefore(dragEl,after);
  }
  function up(){
    if(!dragEl)return;
    if(handleEl){handleEl.removeEventListener('pointermove',move);handleEl.removeEventListener('pointerup',up);handleEl.removeEventListener('pointercancel',up);try{handleEl.releasePointerCapture(ptrId);}catch(_){}}
    dragEl.classList.remove('dragging');dragEl.style.pointerEvents='';
    const drop=dragEl.closest('.drop');
    if(drop){
      const ns=drop.dataset.status;
      const ids=Array.prototype.slice.call(drop.querySelectorAll('.tcard')).map(c=>c.dataset.id);
      ids.forEach((id,i)=>{const t=state.tasks.find(x=>x.id===id);if(t){t.status=ns;t.order=i;}});
      save();
    }
    dragEl=null;handleEl=null;
    rerenderBody();
  }
}

/* ---- Vista Tablero ---- */
function renderBoard(){
  document.getElementById('topbar').innerHTML='<span class="emoji-lg">🗂️</span><div><h1>Tablero</h1><p class="desc">Todas las tareas del equipo. Arrastra por el asa ⠿ para reordenar o cambiar de estado.</p></div>';
  const c=document.getElementById('content');
  c.innerHTML=toolbarHTML('board')+'<div id="bbody"></div>';
  bindToolbar(c);paintBoard();
}
function paintBoard(){
  const body=document.getElementById('bbody');if(!body)return;
  const list=applyFilters(state.tasks);
  let h='<div class="board">';
  STATUS_ORDER.forEach(k=>{
    const col=list.filter(t=>t.status===k).sort((a,b)=>(a.order||0)-(b.order||0));
    h+='<div class="bcol"><div class="bcol-h"><span class="dot" style="background:'+STATUS[k].color+'"></span>'+STATUS[k].label+'<span class="c">'+col.length+'</span><button class="bcol-add" data-add="'+k+'" title="Añadir">+</button></div><div class="drop" data-status="'+k+'">';
    col.forEach(t=>h+=taskCardHTML(t));
    h+='</div></div>';
  });
  h+='</div>';
  body.innerHTML=h;
  body.querySelectorAll('[data-add]').forEach(b=>b.onclick=()=>newTask(b.dataset.add));
  bindCards(body);
}

/* ---- Vista Lista ---- */
function renderTaskListView(){
  document.getElementById('topbar').innerHTML='<span class="emoji-lg">☰</span><div><h1>Lista de tareas</h1><p class="desc">Arrastra por el asa ⠿ para reordenar o mover entre estados.</p></div>';
  const c=document.getElementById('content');
  c.innerHTML=toolbarHTML('list')+'<div id="bbody"></div>';
  bindToolbar(c);paintList();
}
function paintList(){
  const body=document.getElementById('bbody');if(!body)return;
  const list=applyFilters(state.tasks);
  let h='';
  STATUS_ORDER.forEach(k=>{
    const col=list.filter(t=>t.status===k).sort((a,b)=>(a.order||0)-(b.order||0));
    h+='<div class="lsec"><div class="section-head"><span class="dot" style="background:'+STATUS[k].color+'"></span> '+STATUS[k].label+' <span style="color:var(--muted);font-weight:400">'+col.length+'</span> <span class="ln"></span></div><div class="drop lstdrop" data-status="'+k+'">';
    col.forEach(t=>h+=taskCardHTML(t));
    h+='</div></div>';
  });
  if(!list.length)h='<div class="empty">No hay tareas con estos filtros.</div>';
  body.innerHTML=h;bindCards(body);
}

/* ---- Vista Calendario (por fecha de vencimiento) ---- */
let calMonth=(function(){const d=new Date();return {y:d.getFullYear(),m:d.getMonth()};})();
function renderCalendar(){
  document.getElementById('topbar').innerHTML='<span class="emoji-lg">📅</span><div><h1>Calendario</h1><p class="desc">Tareas con fecha de vencimiento.</p></div>';
  const c=document.getElementById('content');
  c.innerHTML=toolbarHTML('calendar')+'<div id="bbody"></div>';
  bindToolbar(c);paintCalendar();
}
function paintCalendar(){
  const body=document.getElementById('bbody');if(!body)return;
  const list=applyFilters(state.tasks).filter(t=>t.due);
  const y=calMonth.y,m=calMonth.m;
  const first=new Date(y,m,1);const startDow=(first.getDay()+6)%7;/*lunes=0*/
  const days=new Date(y,m+1,0).getDate();
  const monthName=first.toLocaleDateString('es-ES',{month:'long',year:'numeric'});
  let h='<div class="calbar"><button class="mini" id="calPrev">‹</button><b style="text-transform:capitalize">'+monthName+'</b><button class="mini" id="calNext">›</button></div>';
  h+='<div class="calgrid">';
  ['L','M','X','J','V','S','D'].forEach(d=>h+='<div class="calhd">'+d+'</div>');
  for(let i=0;i<startDow;i++)h+='<div class="calcell empty"></div>';
  for(let d=1;d<=days;d++){
    const ds=y+'-'+String(m+1).padStart(2,'0')+'-'+String(d).padStart(2,'0');
    const dt=list.filter(t=>t.due===ds);
    h+='<div class="calcell"><div class="caln">'+d+'</div>'+dt.map(t=>'<div class="calt" data-id="'+t.id+'" style="border-left-color:'+STATUS[t.status].color+'">'+esc(t.title)+'</div>').join('')+'</div>';
  }
  h+='</div>';
  body.innerHTML=h;
  const cpv=body.querySelector('#calPrev');if(cpv)cpv.onclick=()=>{calMonth.m--;if(calMonth.m<0){calMonth.m=11;calMonth.y--;}paintCalendar();};
  const cnx=body.querySelector('#calNext');if(cnx)cnx.onclick=()=>{calMonth.m++;if(calMonth.m>11){calMonth.m=0;calMonth.y++;}paintCalendar();};
  body.querySelectorAll('.calt').forEach(el=>el.onclick=()=>openTask(el.dataset.id));
}

/* ---- Detalle de tarea (modal) con comentarios + menciones ---- */
function openTask(id){
  const t=state.tasks.find(x=>x.id===id);if(!t)return;
  let root=document.getElementById('modalRoot');
  if(!root){root=document.createElement('div');root.id='modalRoot';document.body.appendChild(root);}
  const projOpts=state.projects.map(p=>'<option value="'+p.id+'" '+(t.projectId===p.id?'selected':'')+'>'+esc(p.name)+'</option>').join('');
  const statusOpts=STATUS_ORDER.map(k=>'<option value="'+k+'" '+(t.status===k?'selected':'')+'>'+STATUS[k].label+'</option>').join('');
  const prioOpts=Object.keys(PRIO).map(k=>'<option value="'+k+'" '+(t.priority===k?'selected':'')+'>'+PRIO[k].label+'</option>').join('');
  const memOpts=['<option value="">Sin asignar</option>'].concat(state.members.map(m=>'<option value="'+m.id+'" '+(t.assignee===m.id?'selected':'')+'>'+esc(m.name)+'</option>')).join('');
  root.innerHTML='<div class="modal-ov" id="mov"><div class="modal">'+
    '<div class="modal-h"><input id="mTitle" class="mtitle" value="'+esc(t.title)+'"><button class="mclose" id="mClose">✕</button></div>'+
    '<div class="modal-grid">'+
      '<label>Proyecto<select id="mProj">'+projOpts+'</select></label>'+
      '<label>Estado<select id="mStatus">'+statusOpts+'</select></label>'+
      '<label>Prioridad<select id="mPrio">'+prioOpts+'</select></label>'+
      '<label>Responsable<select id="mAss">'+memOpts+'</select></label>'+
      '<label>Vencimiento<input type="date" id="mDue" value="'+(t.due||'')+'"></label>'+
    '</div>'+
    '<label class="mfull">Notas<textarea id="mNotes" rows="3" placeholder="Detalles…">'+esc(t.notes||'')+'</textarea></label>'+
    '<div class="open-proj"><button class="mini" id="mOpenProj">Abrir Notion del proyecto →</button></div>'+
    '<div class="comments"><div class="csub">Comentarios</div><div id="mComments"></div>'+
      '<div class="caddrow"><input id="mC" class="cadd" placeholder="Comenta… usa @Álvaro o @Alfon"><button class="csend" id="mSend">Enviar</button></div>'+
      '<div class="chint">Menciones: '+state.members.map(m=>'@'+esc(m.name)).join(' · ')+'</div>'+
    '</div>'+
    '<div class="modal-foot"><button class="mdel" id="mDel">🗑 Eliminar tarea</button></div>'+
  '</div></div>';
  const $=s=>root.querySelector(s);
  function paintComments(){
    $('#mComments').innerHTML=(t.comments||[]).map(c=>'<div class="cmt"><span class="ava sm" style="background:'+((member(c.author)||{}).color||'#666')+'">'+esc((c.authorName||memberName(c.author)||'?').slice(0,2))+'</span><div><div class="cmt-h">'+esc(c.authorName||memberName(c.author)||'Alguien')+' <span class="cmt-t">'+new Date(c.ts).toLocaleString('es-ES',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})+'</span></div><div class="cmt-b">'+esc(c.text)+'</div></div></div>').join('')||'<div class="muted" style="font-size:12px">Sin comentarios todavía.</div>';
  }
  paintComments();
  $('#mClose').onclick=closeTask;$('#mov').onclick=e=>{if(e.target.id==='mov')closeTask();};
  $('#mTitle').onblur=()=>{t.title=$('#mTitle').value.trim()||'Sin título';save();rerenderBody();};
  $('#mProj').onchange=()=>{t.projectId=$('#mProj').value;save();rerenderBody();};
  $('#mStatus').onchange=()=>{t.status=$('#mStatus').value;t.order=nextOrder(t.status);save();rerenderBody();};
  $('#mPrio').onchange=()=>{t.priority=$('#mPrio').value;save();rerenderBody();};
  $('#mAss').onchange=()=>{t.assignee=$('#mAss').value;save();rerenderBody();};
  $('#mDue').onchange=()=>{t.due=$('#mDue').value;save();rerenderBody();};
  $('#mNotes').onblur=()=>{t.notes=$('#mNotes').value;save();};
  $('#mOpenProj').onclick=()=>{closeTask();current='proj:'+t.projectId;render();};
  $('#mDel').onclick=()=>{if(confirm('¿Eliminar esta tarea?')){state.tasks=state.tasks.filter(x=>x.id!==t.id);save();closeTask();render();}};
  function send(){
    const txt=$('#mC').value.trim();if(!txt)return;
    const mentions=[];state.members.forEach(m=>{if(new RegExp('@'+m.name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'i').test(txt))mentions.push(m.id);});
    const me=currentMemberId();
    t.comments=t.comments||[];
    t.comments.push({id:uid(),author:me||'',authorName:me?memberName(me):((typeof cloud!=='undefined'&&cloud.email)||'Alguien'),text:txt,ts:Date.now(),mentions:mentions});
    $('#mC').value='';save();paintComments();
  }
  $('#mSend').onclick=send;
  $('#mC').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();send();}});
}
function closeTask(){const r=document.getElementById('modalRoot');if(r)r.innerHTML='';}
