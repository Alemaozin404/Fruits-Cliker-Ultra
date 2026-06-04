const CACHE='maca-v12-4-mobile-hud-safe-area';
const VERSION='12.4.0-mobile-hud-safe-area';
const ASSETS=['./','./index.html?v='+VERSION,'./style.css?v='+VERSION,'./script.js?v='+VERSION,'./global-config.js?v='+VERSION,'./manifest.webmanifest?v='+VERSION,'./admin/','./admin/index.html?v='+VERSION,'./admin/admin.css?v='+VERSION,'./admin/admin.js?v='+VERSION];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).catch(()=>{}));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim();});
self.addEventListener('fetch',e=>{
  const req=e.request;
  const url=new URL(req.url);
  if(url.hostname.includes('firebase') || url.hostname.includes('googleapis')) return;
  const isRuntimeAsset=/\.(html|js|css|webmanifest)(\?|$)/.test(url.pathname) || req.mode==='navigate';
  if(isRuntimeAsset){
    e.respondWith(fetch(req).then(res=>{const copy=res.clone(); caches.open(CACHE).then(c=>c.put(req,copy)); return res;}).catch(()=>caches.match(req).then(r=>r||caches.match('./index.html?v='+VERSION))));
    return;
  }
  e.respondWith(caches.match(req).then(r=>r||fetch(req)));
});
