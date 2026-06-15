/* ============ DATA LAYER (v4: tareas globales + proyectos con Notion) ============ */
const STORE='cardesign_workspace_v4';
const THEMEKEY='cardesign_theme';
const STATUS={
  backlog:{label:'Backlog',color:'#8b8f9a'},
  todo:{label:'Por hacer',color:'#9aa6b8'},
  doing:{label:'En progreso',color:'#f4a623'},
  blocked:{label:'Bloqueada',color:'#e63946'},
  done:{label:'Hecha',color:'#3ec46d'}
};
const STATUS_ORDER=['backlog','todo','doing','blocked','done'];
const PRIO={alta:{label:'Alta',color:'#e63946'},media:{label:'Media',color:'#f4a623'},baja:{label:'Baja',color:'#4f7cff'}};
const CESTADO={confirmado:{label:'Confirmado',color:'#3ec46d'},interes:{label:'Interés en venir',color:'#4f7cff'},pendiente:{label:'Pendiente de confirmar',color:'#f4a623'}};
let state={members:[],projects:[],tasks:[]};
let current='board';          /* 'board' | 'list' | 'calendar' | 'proj:<id>' | 'dashboard' */
let filters={q:'',project:'',assignee:'',priority:''};
const uid=()=>Math.random().toString(36).slice(2,9);
function esc(s){return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}

function defaultMembers(){return [
  {id:'alvaro',name:'Álvaro',color:'#4f7cff',emails:['revistacardesign@gmail.com','alvaro.murodunabeitia@gmail.com']},
  {id:'alfon',name:'Alfon',color:'#e63946',emails:['alfondcc@telycom4.com']}
];}
function currentMemberId(){
  var email=(typeof cloud!=='undefined'&&cloud.email)?cloud.email:null;
  if(!email)return null;
  var m=state.members.find(function(x){return (x.emails||[]).indexOf(email)>-1});
  return m?m.id:null;
}

async function loadData(){
  const raw=localStorage.getItem(STORE);
  if(raw){try{state=JSON.parse(raw);migrate();return}catch(e){}}
  // primera carga: intentar migrar desde formato anterior (v3) en localStorage
  const old=localStorage.getItem('cardesign_workspace_v3');
  if(old){try{state=JSON.parse(old);migrate();return}catch(e){}}
  // si no, cargar desde /data
  try{
    const idx=await (await fetch('data/index.json',{cache:'no-store'})).json();
    const projects=[];
    for(const f of (idx.proyectos||[])){projects.push(await (await fetch('data/proyectos/'+f,{cache:'no-store'})).json())}
    const ideas=[];
    for(const f of (idx.ideas||[])){ideas.push(await (await fetch('data/ideas/'+f,{cache:'no-store'})).json())}
    state={projects,ideas};
  }catch(e){
    state={projects:[],ideas:[]};
  }
  migrate();save();
}

function migrate(){
  if(!state.projects)state.projects=[];
  if(!state.members||!state.members.length)state.members=defaultMembers();
  if(!state.tasks)state.tasks=[];
  // mover tareas por-proyecto a la lista global
  state.projects.forEach(p=>{
    if(Array.isArray(p.tasks)){
      p.tasks.forEach((t,i)=>{
        state.tasks.push(Object.assign({},t,{
          projectId:p.id,
          status:(STATUS[t.status]?t.status:'todo'),
          order:(t.order!=null?t.order:i),
          assignee:t.assignee||'',
          labels:t.labels||[],
          comments:t.comments||[]
        }));
      });
      delete p.tasks;
    }
    if(!p.notion)p.notion=[];
  });
  // asegurar campos en tareas existentes
  state.tasks.forEach((t,i)=>{
    if(t.order==null)t.order=i;
    if(!t.assignee)t.assignee='';
    if(!t.labels)t.labels=[];
    if(!t.comments)t.comments=[];
    if(!STATUS[t.status])t.status='todo';
  });
  // plegar ideas globales en un proyecto "Notas / Ideas"
  if(Array.isArray(state.ideas)&&state.ideas.length){
    let notas=state.projects.find(p=>p.id==='notas');
    if(!notas){notas={id:'notas',name:'Notas / Ideas',emoji:'📓',description:'Ideas y notas generales.',notion:[]};state.projects.push(notas);}
    state.ideas.forEach(idea=>{notas.notion.push({id:idea.id,title:idea.title,emoji:idea.emoji||'📄',blocks:idea.blocks||[]})});
  }
  delete state.ideas;
  state.schema=4;
}

function saveLocal(){localStorage.setItem(STORE,JSON.stringify(state))}
function save(){saveLocal();if(typeof cloudPush==='function')cloudPush()}
function toast(m){const t=document.getElementById('toast');if(!t)return;t.textContent=m;t.classList.add('show');clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove('show'),2200)}

/* Helpers */
const proj=id=>state.projects.find(p=>p.id===id);
const member=id=>state.members.find(m=>m.id===id);
function memberName(id){const m=member(id);return m?m.name:''}
function projectTasks(pid){return state.tasks.filter(t=>t.projectId===pid)}
function progress(pid){const ts=projectTasks(pid);const d=ts.filter(t=>t.status==='done').length;return{d,tot:ts.length,pct:ts.length?Math.round(d/ts.length*100):0}}
function fmtDate(d){if(!d)return '';return new Date(d+'T00:00:00').toLocaleDateString('es-ES',{day:'numeric',month:'short'})}
function isOverdue(d){if(!d)return false;return new Date(d+'T00:00:00')<new Date(new Date().toDateString())}
function nextOrder(status){const ts=state.tasks.filter(t=>t.status===status);return ts.length?Math.max.apply(null,ts.map(t=>t.order||0))+1:0}

/* Filtro aplicado a una lista de tareas */
function applyFilters(list){
  const q=(filters.q||'').toLowerCase();
  return list.filter(t=>{
    if(filters.project && t.projectId!==filters.project)return false;
    if(filters.assignee && t.assignee!==filters.assignee)return false;
    if(filters.priority && t.priority!==filters.priority)return false;
    if(q){
      const p=proj(t.projectId);
      const hay=(t.title||'')+' '+(t.notes||'')+' '+(p?p.name:'')+' '+memberName(t.assignee);
      if(hay.toLowerCase().indexOf(q)===-1)return false;
    }
    return true;
  });
}
function filtersActive(){return !!(filters.q||filters.project||filters.assignee||filters.priority)}
function clearFilters(){filters={q:'',project:'',assignee:'',priority:''}}

/* Tema */
function applyTheme(){const light=localStorage.getItem(THEMEKEY)==='light';document.body.classList.toggle('light',light);const b=document.getElementById('themeBtn');if(b)b.textContent=light?'☀️':'🌙'}
function toggleTheme(){localStorage.setItem(THEMEKEY,localStorage.getItem(THEMEKEY)==='light'?'dark':'light');applyTheme()}

/* Exportar / Importar */
function exportJson(){dl(new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),'cardesign-backup-'+new Date().toISOString().slice(0,10)+'.json');toast('Backup descargado')}
function exportMd(){
  let m='# CarDesign · Workspace\n\n_Exportado: '+new Date().toLocaleString('es-ES')+'_\n';
  state.projects.forEach(p=>{const pg=progress(p.id);
    m+='\n## '+(p.emoji||'')+' '+p.name+'\n\n'+(p.description||'')+'\n\n**Progreso:** '+pg.d+'/'+pg.tot+' ('+pg.pct+'%)\n\n';
    projectTasks(p.id).forEach(t=>{m+='- ['+(t.status==='done'?'x':' ')+'] **'+t.title+'** — _'+STATUS[t.status].label+' · '+PRIO[t.priority].label+(t.assignee?' · '+memberName(t.assignee):'')+(t.due?' · 📅 '+t.due:'')+'_\n';});
    if(p.cars){const b={marcaEspana:'Marca España',escuderias:'Superdeportivos / Escuderías'};
      Object.keys(b).forEach(k=>{m+='\n### 🚗 '+b[k]+'\n\n| # | Marca | Modelo | Encargado | Estado | IFEMA |\n|---|---|---|---|---|---|\n';
        (p.cars[k]||[]).forEach((c,i)=>{m+='| '+(i+1)+' | '+c.marca+' | '+c.modelo+' | '+(c.encargado||'—')+' | '+CESTADO[c.estado].label+' | '+(c.ifema?'✅':'—')+' |\n'});});}
  });
  dl(new Blob([m],{type:'text/markdown'}),'cardesign-workspace-'+new Date().toISOString().slice(0,10)+'.md');toast('Markdown descargado')}
function dl(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
