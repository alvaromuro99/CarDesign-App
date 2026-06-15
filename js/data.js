/* ============ DATA LAYER ============ */
const STORE='cardesign_workspace_v3';
const THEMEKEY='cardesign_theme';
const STATUS={todo:{label:'Por hacer',color:'var(--todo)'},doing:{label:'En curso',color:'var(--doing)'},
  done:{label:'Hecho',color:'var(--done)'},blocked:{label:'Bloqueado',color:'var(--blocked)'}};
const PRIO={alta:{label:'Alta',color:'var(--alta)'},media:{label:'Media',color:'var(--media)'},baja:{label:'Baja',color:'var(--baja)'}};
const CESTADO={confirmado:{label:'Confirmado',color:'var(--conf)'},interes:{label:'Interés en venir',color:'var(--interes)'},pendiente:{label:'Pendiente de confirmar',color:'var(--pend)'}};
let state={projects:[],ideas:[]};
let current='dashboard', view='list';
const uid=()=>Math.random().toString(36).slice(2,9);
function esc(s){return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}

/* Carga: 1) localStorage (estado vivo)  2) archivos /data  3) aviso si falla */
async function loadData(){
  const raw=localStorage.getItem(STORE);
  if(raw){try{state=JSON.parse(raw);migrate();return}catch(e){}}
  try{
    const idx=await (await fetch('data/index.json',{cache:'no-store'})).json();
    const projects=[];
    for(const f of (idx.proyectos||[])){projects.push(await (await fetch('data/proyectos/'+f,{cache:'no-store'})).json())}
    const ideas=[];
    for(const f of (idx.ideas||[])){ideas.push(await (await fetch('data/ideas/'+f,{cache:'no-store'})).json())}
    state={projects,ideas};
  }catch(e){
    state={projects:[],ideas:[{id:'err',title:'Cómo abrir la app',emoji:'⚠️',folder:'General',
      blocks:[{id:'b1',type:'text',text:'No se pudieron cargar los datos desde la carpeta /data. Esta app modular necesita abrirse SERVIDA (GitHub Pages o un servidor local), no con doble clic directo.\n\nVer CONFIGURAR-FIREBASE.md para publicarla. Para una prueba rápida en local: abre una terminal en esta carpeta y ejecuta  python -m http.server  y entra en http://localhost:8000'}]}]};
  }
  migrate();save();
}
function migrate(){
  if(!state.projects)state.projects=[];
  if(!state.ideas)state.ideas=[];
  state.projects.forEach(p=>{ if(p.cars){['marcaEspana','escuderias'].forEach(k=>{(p.cars[k]||[]).forEach(c=>{if(c.encargado===undefined)c.encargado=''})})} });
}
function saveLocal(){localStorage.setItem(STORE,JSON.stringify(state))}
function save(){saveLocal();if(typeof cloudPush==='function')cloudPush()}
function toast(m){const t=document.getElementById('toast');if(!t)return;t.textContent=m;t.classList.add('show');clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove('show'),2200)}

/* Helpers */
const proj=id=>state.projects.find(p=>p.id===id);
function progress(p){const d=p.tasks.filter(t=>t.status==='done').length;return{d,tot:p.tasks.length,pct:p.tasks.length?Math.round(d/p.tasks.length*100):0}}
function fmtDate(d){if(!d)return '';return new Date(d+'T00:00:00').toLocaleDateString('es-ES',{day:'numeric',month:'short'})}
function isOverdue(d){if(!d)return false;return new Date(d+'T00:00:00')<new Date(new Date().toDateString())}

/* Tema */
function applyTheme(){const light=localStorage.getItem(THEMEKEY)==='light';document.body.classList.toggle('light',light);const b=document.getElementById('themeBtn');if(b)b.textContent=light?'☀️':'🌙'}
function toggleTheme(){localStorage.setItem(THEMEKEY,localStorage.getItem(THEMEKEY)==='light'?'dark':'light');applyTheme()}

/* Exportar / Importar */
function exportJson(){dl(new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),'cardesign-backup-'+new Date().toISOString().slice(0,10)+'.json');toast('Backup descargado')}
function exportMd(){
  let m='# CarDesign · Workspace\n\n_Exportado: '+new Date().toLocaleString('es-ES')+'_\n';
  state.projects.forEach(p=>{const pg=progress(p);
    m+='\n## '+p.emoji+' '+p.name+'\n\n'+(p.description||'')+'\n\n**Progreso:** '+pg.d+'/'+pg.tot+' ('+pg.pct+'%)\n';
    [...new Set(p.tasks.map(t=>t.section||'General'))].forEach(s=>{m+='\n### '+s+'\n\n';
      p.tasks.filter(t=>(t.section||'General')===s).forEach(t=>{
        m+='- ['+(t.status==='done'?'x':' ')+'] **'+t.title+'** — _'+STATUS[t.status].label+' · '+PRIO[t.priority].label+(t.due?' · 📅 '+t.due:'')+'_\n';
        if(t.notes)m+='  - '+t.notes.replace(/\n/g,' ')+'\n';});
    });
    if(p.cars){const blocks={marcaEspana:'Marca España',escuderias:'Superdeportivos / Escuderías'};
      Object.entries(blocks).forEach(([k,lbl])=>{m+='\n### 🚗 Coches · '+lbl+'\n\n| # | Marca/Coleccionista | Modelo | Encargado | Estado | IFEMA |\n|---|---|---|---|---|---|\n';
        (p.cars[k]||[]).forEach((c,i)=>{m+='| '+(i+1)+' | '+c.marca+' | '+c.modelo+' | '+(c.encargado||'—')+' | '+CESTADO[c.estado].label+' | '+(c.ifema?'✅':'—')+' |\n'});});
    }
  });
  dl(new Blob([m],{type:'text/markdown'}),'cardesign-workspace-'+new Date().toISOString().slice(0,10)+'.md');toast('Markdown descargado')}
function dl(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
