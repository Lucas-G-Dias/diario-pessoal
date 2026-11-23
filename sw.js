// Diário Pessoal: funciona offline e recebe os lembretes
const CACHE = 'dp-v1';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icons/favicon.svg', './vendor/supabase.js',
  './css/base.css', './css/telas.css', './js/00-config.js', './js/01-base.js', './js/02-dados.js', './js/03-jogo.js',
  './js/04-inicio.js', './js/05-leitura.js', './js/06-habitos.js', './js/07-treino.js', './js/08-ajustes.js', './js/09-boot.js'];

self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL))); self.skipWaiting(); });
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  e.respondWith(fetch(e.request).then((r) => { const c = r.clone(); caches.open(CACHE).then((x) => x.put(e.request, c)); return r; })
    .catch(() => caches.match(e.request, { ignoreSearch: true }).then((r) => r || caches.match('./index.html'))));
});
self.addEventListener('push', (e) => {
  let d = {}; try { d = e.data.json(); } catch { d = { body: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.title || 'Diário Pessoal', { body: d.body || '', icon: 'icons/favicon.svg', tag: d.tag, data: { url: d.url || './' } }));
});
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || './';
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then((ws) => {
    for (const w of ws) if ('focus' in w) { if ('navigate' in w) w.navigate(url).catch(() => {}); return w.focus(); }
    return clients.openWindow(url);
  }));
});
