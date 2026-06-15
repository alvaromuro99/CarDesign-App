const CACHE='cardesign-v1';
const ASSETS=['.','index.html','css/styles.css','js/data.js','js/projects.js','js/ideas.js','js/render.js','js/cloud.js','js/app.js','assets/logo.png','manifest.webmanifest','data/index.json'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).catch(()=>{}));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim()});
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(u.hostname.indexOf('googleapis')>-1||u.hostname.indexOf('gstatic')>-1||u.hostname.indexOf('firebase')>-1)return;
  if(e.request.method!=='GET')return;
  e.respondWith(fetch(e.request).then(r=>{const cp=r.clone();caches.open(CACHE).then(c=>c.put(e.request,cp)).catch(()=>{});return r}).catch(()=>caches.match(e.request)));
});
