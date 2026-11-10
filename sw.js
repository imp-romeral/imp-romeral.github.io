/* Guarda la portada de la app para que abra rápido. Los datos de la iglesia no se guardan aquí:
   siempre vienen de Apps Script. Al cambiar algún archivo de esta carpeta, sube el número de VERSION. */
const VERSION = 'romeral-3';
const ARCHIVOS = ['./', 'index.html', 'manifest.json', 'iconos/simbolo-blanco.png', 'iconos/icono-192.png', 'iconos/icono-512.png', 'iconos/icono-maskable-512.png', 'iconos/apple-touch-icon.png', 'iconos/favicon-48.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
/* Primero internet (así siempre llega lo último) y, sin conexión, lo guardado */
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(r).then(res => {
      if (res.ok) { const copia = res.clone(); caches.open(VERSION).then(c => c.put(r, copia)); }
      return res;
    }).catch(() => caches.match(r).then(x => x || caches.match('index.html')))
  );
});
