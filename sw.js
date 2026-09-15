const CACHE='sendai-trip-shell-v2';
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(['./','./sendai.html','./manifest.webmanifest']))));
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;if(e.request.mode==='navigate'){e.respondWith(fetch(e.request).then(r=>{caches.open(CACHE).then(c=>c.put('./sendai.html',r.clone()));return r}).catch(()=>caches.match('./sendai.html')));return}e.respondWith(fetch(e.request).catch(()=>caches.match(e.request)))});
