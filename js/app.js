/* ============ INIT / WIRING ============ */
document.getElementById('hamb').onclick=()=>{const sb=document.getElementById('sidebar'),ov=document.getElementById('overlay');sb.classList.toggle('open');ov.classList.toggle('show');};
document.getElementById('overlay').onclick=closeNav;
document.getElementById('themeBtn').onclick=toggleTheme;
document.getElementById('exportJson').onclick=exportJson;
document.getElementById('exportMd').onclick=exportMd;
document.getElementById('importJson').onclick=()=>document.getElementById('fileInput').click();
document.getElementById('fileInput').onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{state=JSON.parse(r.result);migrate();save();current='board';render();toast('Datos restaurados');}catch(x){alert('Archivo no válido');}};r.readAsText(f);};
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&typeof closeTask==='function')closeTask();});

applyTheme();
loadData().then(function(){current='board';render();initCloud();});
if('serviceWorker'in navigator){navigator.serviceWorker.register('service-worker.js').catch(function(){});}
