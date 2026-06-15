/* ============ FIREBASE: sync en tiempo real + login + notificaciones ============ */
/* 1) Pega aquí la config de tu proyecto (ver CONFIGURAR-FIREBASE.md).
   Si lo dejas vacío, la app funciona SOLO en este dispositivo (sin sincronizar). */
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAmCwiGLTuyQ7jYEJTTThJvuD9Nx8SYcGU",
  authDomain: "cardesign-workspace.firebaseapp.com",
  projectId: "cardesign-workspace",
  storageBucket: "cardesign-workspace.firebasestorage.app",
  messagingSenderId: "217037893786",
  appId: "1:217037893786:web:289328833eb2884608af23"
};
/* 2) Solo estos correos podrán entrar. Añade el de tu compañero (Alfon). */
const ALLOWED_EMAILS=["revistacardesign@gmail.com","alvaro.murodunabeitia@gmail.com","alfondcc@telycom4.com"];

/* ID único de ESTE dispositivo (estable). Distingue equipos aunque usen el mismo correo. */
const CLIENT_ID=(function(){let c=null;try{c=localStorage.getItem('cardesign_client')}catch(e){}
  if(!c){c=Math.random().toString(36).slice(2)+Date.now().toString(36);try{localStorage.setItem('cardesign_client',c)}catch(e){}}return c;})();

let cloud={on:false,db:null,email:null,docRef:null,applyingRemote:false,timer:null};
function cloudEnabled(){return typeof firebase!=='undefined' && FIREBASE_CONFIG && FIREBASE_CONFIG.apiKey}
function setSyncBadge(txt,on){const b=document.getElementById('syncBadge');if(b){const t=b.querySelector('.t');if(t)t.textContent=txt;b.classList.toggle('on',!!on)}}
function showLogin(){const l=document.getElementById('login');if(l)l.style.display='flex'}
function hideLogin(){const l=document.getElementById('login');if(l)l.style.display='none'}

/* Botón de cerrar sesión (se inserta en la barra lateral cuando hay sesión) */
function showLogout(){
  if(document.getElementById('logoutBtn'))return;
  const sb=document.getElementById('sidebar');if(!sb)return;
  const foot=sb.querySelector('.side-foot');
  const b=document.createElement('button');b.id='logoutBtn';b.className='side-btn';b.style.margin='0 8px 8px';b.textContent='Cerrar sesión';
  b.onclick=()=>{if(typeof firebase!=='undefined'&&firebase.auth().currentUser){firebase.auth().signOut().then(()=>location.reload()).catch(()=>location.reload())}else{location.reload()}};
  if(foot)sb.insertBefore(b,foot);else sb.appendChild(b);
}

function initCloud(){
  if(!cloudEnabled()){setSyncBadge('Solo este dispositivo',false);return;}
  firebase.initializeApp(FIREBASE_CONFIG);
  cloud.db=firebase.firestore();
  const lo=document.getElementById('localOnly');if(lo)lo.onclick=()=>{hideLogin();setSyncBadge('Solo este dispositivo',false)};
  const gb=document.getElementById('googleBtn');if(gb)gb.onclick=()=>{firebase.auth().signInWithPopup(new firebase.auth.GoogleAuthProvider()).catch(e=>{const el=document.getElementById('loginErr');if(el)el.textContent=e.message})};
  const sb=document.getElementById('syncBadge');if(sb){sb.style.cursor='pointer';sb.title='Pulsa para actualizar ahora';sb.onclick=forcePull;}
  firebase.auth().onAuthStateChanged(u=>{
    if(u){
      if(ALLOWED_EMAILS.length && ALLOWED_EMAILS.indexOf(u.email)===-1){const el=document.getElementById('loginErr');if(el)el.textContent='Email no autorizado: '+u.email;firebase.auth().signOut();return;}
      cloud.on=true;cloud.email=u.email;hideLogin();setSyncBadge('Sincronizado · '+u.email,true);showLogout();askNotifyPermission();try{if(!localStorage.getItem('cardesign_seen_mentions'))localStorage.setItem('cardesign_seen_mentions',String(Date.now()));}catch(e){}subscribe();
    }else{cloud.on=false;showLogin();setSyncBadge('Sin sesión',false);}
  });
}
function subscribe(){
  cloud.docRef=cloud.db.collection('workspaces').doc('cardesign');
  cloud.docRef.onSnapshot(snap=>{
    if(!snap.exists){cloud.docRef.set({data:JSON.stringify(state),updatedBy:cloud.email,updatedByClient:CLIENT_ID,updatedAt:Date.now()}).catch(function(){});return;}
    const d=snap.data();
    /* Aplica el cambio siempre que NO lo haya hecho este mismo dispositivo (aunque sea el mismo correo) */
    if(d && d.data && d.updatedByClient!==CLIENT_ID){
      cloud.applyingRemote=true;
      try{state=(typeof d.data==='string'?JSON.parse(d.data):d.data);saveLocal();render();}finally{cloud.applyingRemote=false;}
      checkMentions();
      notify('Cambios de '+(d.updatedBy||'tu equipo'),'Se ha actualizado el workspace de CarDesign');
    }
  },function(){setSyncBadge('Error de sincronización',false)});
}
/* Trae manualmente la última versión desde la nube y refresca */
function forcePull(){
  if(!cloud.on||!cloud.docRef){location.reload();return;}
  setSyncBadge('Actualizando…',true);
  cloud.docRef.get().then(s=>{
    if(s.exists){const d=s.data();if(d&&d.data){cloud.applyingRemote=true;try{state=(typeof d.data==='string'?JSON.parse(d.data):d.data);saveLocal();render();}finally{cloud.applyingRemote=false;}}}
    setSyncBadge('Sincronizado · '+cloud.email,true);toast('Actualizado');
  }).catch(()=>{setSyncBadge('Sincronizado · '+cloud.email,true)});
}
function cloudPush(){
  if(!cloud.on||cloud.applyingRemote||!cloud.docRef)return;
  clearTimeout(cloud.timer);
  cloud.timer=setTimeout(function(){cloud.docRef.set({data:JSON.stringify(state),updatedBy:cloud.email,updatedByClient:CLIENT_ID,updatedAt:Date.now()}).catch(function(){})},700);
}
function checkMentions(){
  try{
    var me=(typeof currentMemberId==='function')?currentMemberId():null; if(!me)return;
    var lastSeen=+(localStorage.getItem('cardesign_seen_mentions')||0); var maxTs=lastSeen;
    (state.tasks||[]).forEach(function(t){(t.comments||[]).forEach(function(c){
      if(c.ts>lastSeen && c.author!==me && (c.mentions||[]).indexOf(me)>-1){
        var p=(typeof proj==='function')?proj(t.projectId):null;
        notify('Te han mencionado','"'+(c.text||'').slice(0,80)+'"'+(p?(' · '+p.name):''));
      }
      if(c.ts>maxTs)maxTs=c.ts;
    });});
    localStorage.setItem('cardesign_seen_mentions',String(maxTs));
  }catch(e){}
}
function askNotifyPermission(){if('Notification'in window && Notification.permission==='default'){Notification.requestPermission()}}
function notify(title,body){toast(body);if('Notification'in window && Notification.permission==='granted'){try{new Notification(title,{body:body,icon:'assets/logo.png'})}catch(e){}}}
