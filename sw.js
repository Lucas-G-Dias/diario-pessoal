// Ritmo: funciona offline e recebe os lembretes
const CACHE = 'ritmo-v15';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icons/favicon.svg', './icons/logo.svg', './icons/icon-192.png', './icons/apple-touch-icon.png', './vendor/supabase.js',
  './css/base.css', './css/telas.css', './css/areas.css', './css/motion.css', './css/extras.css', './css/mobile.css',
  './js/00-config.js', './js/01-base.js', './js/02-dados.js', './js/03-jogo.js', './js/04-efeitos.js', './js/04a-grafico.js', './js/05-inicio.js', './js/05a-proximos.js', './js/06-habitos.js', './js/07-treino.js', './js/07a-animacoes.js', './js/08-sessao.js', './js/08a-treino-mais.js', './js/09-leitura.js', './js/10-biblia.js', './js/10a-ano-dados.js', './js/11-devocional.js', './js/11a-ano.js', './js/11b-ano-acoes.js', './js/11c-devo-abas.js', './js/12-escrita.js', './js/12a-saude.js', './js/12b-dieta.js', './js/12c-dieta-editar.js', './js/12d-agua.js', './js/13-metas.js', './js/13a-semana.js', './js/14-conquistas.js', './js/15-menu.js', './js/15a-extras.js', './js/15b-tour.js', './js/15c-conta.js', './js/16-boot.js'];

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
  e.waitUntil(self.registration.showNotification(d.title || 'Ritmo', { body: d.body || '', icon: 'icons/icon-192.png', tag: d.tag, data: { url: d.url || './' } }));
});
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || './';
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then((ws) => {
    for (const w of ws) if ('focus' in w) { if ('navigate' in w) w.navigate(url).catch(() => {}); return w.focus(); }
    return clients.openWindow(url);
  }));
});
