/* ============ INIT / WIRING ============ */
document.getElementById('hamb').onclick=()=>{const sb=document.getElementById('sidebar'),ov=document.getElementById('overlay');sb.classList.toggle('open');ov.classList.toggle('show')};
document.getElementById('overlay').onclick=closeNav;
document.getElementById('themeBtn').onclick=toggleTheme;
document.getElementById('addProj').onclick=()=>{const np={id:uid(),name:'Nuevo proyecto',emoji:'📌',description:'',tasks:[]};state.projects.push(np);current=np.id;view='list';render()};
document.getElementById('exportJson').onclick=exportJson;
document.getElementById('exportMd').onclick=exportMd;
document.getElementById('importJson').onclick=()=>document.getElementById('fileInput').click();
document.getElementById('fileInput').onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{state=JSON.parse(r.result);save();current='dashboard';render();toast('Datos restaurados')}catch(x){alert('Archivo no válido')}};r.readAsText(f)};

applyTheme();
loadData().then(function(){render();initCloud();});
if('serviceWorker'in navigator){navigator.serviceWorker.register('service-worker.js').catch(function(){})}
