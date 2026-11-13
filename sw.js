/* Guarda la portada de la app para que abra rápido. Los datos de la iglesia no se guardan aquí:
   siempre vienen de Apps Script. Al cambiar algún archivo de esta carpeta, sube el número de VERSION. */
const VERSION = 'romeral-5';
const ARCHIVOS = ['./', 'index.html', 'manifest.json', 'iconos/logo-inicio.webp', 'iconos/icono-192.png', 'iconos/icono-512.png', 'iconos/icono-maskable-512.png', 'iconos/apple-touch-icon.png', 'iconos/favicon-48.png', 'iconos/insignia-imp.png'];

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

/* Notificaciones: las envía Apps Script (Push.gs) por Firebase. Llegan aunque la app esté cerrada. */
self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (x) { d = {texto: e.data ? e.data.text() : ''}; }
  const datos = d.data || d;          // Firebase pone lo enviado dentro de "data"
  const n = d.notification || {};
  const titulo = datos.titulo || n.title || 'IMP Romeral';
  e.waitUntil(self.registration.showNotification(titulo, {
    body: datos.texto || n.body || '',
    icon: 'iconos/icono-192.png',          // logo moderno de la IMP Romeral (el mismo ícono de la app)
    badge: 'iconos/insignia-imp.png',      // símbolo blanco que Android muestra en la barra de arriba
    tag: datos.etiqueta || 'romeral',
    renotify: true,
    data: {link: datos.link || './'}
  }));
});
/* Al tocar la notificación se abre la app (o se trae al frente si ya estaba abierta) */
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const destino = new URL((e.notification.data && e.notification.data.link) || './', self.location.href).href;
  e.waitUntil(self.clients.matchAll({type: 'window', includeUncontrolled: true}).then(ventanas => {
    for (const v of ventanas) {
      if (v.url.indexOf(self.registration.scope) === 0 && 'focus' in v) return v.focus();
    }
    return self.clients.openWindow(destino);
  }));
});
