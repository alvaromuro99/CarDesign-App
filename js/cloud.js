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
const ALLOWED_EMAILS=["revistacardesign@gmail.com",
  "alvaro.murodunabeitia@gmail.com"
];

let cloud={on:false,db:null,email:null,docRef:null,applyingRemote:false,timer:null};
function cloudEnabled(){return typeof firebase!=='undefined' && FIREBASE_CONFIG && FIREBASE_CONFIG.apiKey}
function setSyncBadge(txt,on){const b=document.getElementById('syncBadge');if(b){const t=b.querySelector('.t');if(t)t.textContent=txt;b.classList.toggle('on',!!on)}}
function showLogin(){const l=document.getElementById('login');if(l)l.style.display='flex'}
function hideLogin(){const l=document.getElementById('login');if(l)l.style.display='none'}

function initCloud(){
  if(!cloudEnabled()){setSyncBadge('Solo este dispositivo',false);return;}
  firebase.initializeApp(FIREBASE_CONFIG);
  cloud.db=firebase.firestore();
  const lo=document.getElementById('localOnly');if(lo)lo.onclick=()=>{hideLogin();setSyncBadge('Solo este dispositivo',false)};
  const gb=document.getElementById('googleBtn');if(gb)gb.onclick=()=>{firebase.auth().signInWithPopup(new firebase.auth.GoogleAuthProvider()).catch(e=>{const el=document.getElementById('loginErr');if(el)el.textContent=e.message})};
  firebase.auth().onAuthStateChanged(u=>{
    if(u){
      if(ALLOWED_EMAILS.length && ALLOWED_EMAILS.indexOf(u.email)===-1){const el=document.getElementById('loginErr');if(el)el.textContent='Email no autorizado: '+u.email;firebase.auth().signOut();return;}
      cloud.on=true;cloud.email=u.email;hideLogin();setSyncBadge('Sincronizado · '+u.email,true);askNotifyPermission();subscribe();
    }else{showLogin();setSyncBadge('Sin sesión',false);}
  });
}
function subscribe(){
  cloud.docRef=cloud.db.collection('workspaces').doc('cardesign');
  cloud.docRef.onSnapshot(snap=>{
    if(!snap.exists){cloud.docRef.set({data:state,updatedBy:cloud.email,updatedAt:Date.now()});return;}
    const d=snap.data();
    if(d && d.data && d.updatedBy && d.updatedBy!==cloud.email){
      cloud.applyingRemote=true;
      try{state=d.data;saveLocal();render();}finally{cloud.applyingRemote=false;}
      notify('Cambios de '+d.updatedBy,'Se ha actualizado el workspace de CarDesign');
    }
  },function(){setSyncBadge('Error de sincronización',false)});
}
function cloudPush(){
  if(!cloud.on||cloud.applyingRemote||!cloud.docRef)return;
  clearTimeout(cloud.timer);
  cloud.timer=setTimeout(function(){cloud.docRef.set({data:state,updatedBy:cloud.email,updatedAt:Date.now()}).catch(function(){})},700);
}
function askNotifyPermission(){if('Notification'in window && Notification.permission==='default'){Notification.requestPermission()}}
function notify(title,body){toast(body);if('Notification'in window && Notification.permission==='granted'){try{new Notification(title,{body:body,icon:'assets/logo.png'})}catch(e){}}}
