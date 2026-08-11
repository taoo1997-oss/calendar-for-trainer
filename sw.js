/* Офлайн-кэш для версии на GitHub Pages.

   Почему телефон упорно показывал старую сборку.
   Service worker честно ходил в сеть, НО его запрос проходил через обычный
   HTTP-кэш браузера, а GitHub Pages разрешает держать файл в кэше около
   десяти минут. В итоге в «свежем» ответе приезжал старый index.html и
   аккуратно сохранялся в кэш как новый. Круг замыкался.

   Теперь главную страницу забираем с cache: 'no-store' — мимо HTTP-кэша,
   всегда прямо с сервера. Остальное кэшируется как раньше. */
const CACHE = 'dance-trainer-v18';
const ASSETS = ['./', './index.html'];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(ASSETS))
      .catch(() => {})
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* Позволяет странице скомандовать «переключайся немедленно» */
self.addEventListener('message', (e) => {
  if (e.data === 'skip-waiting') self.skipWaiting();
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  // Запросы к API Яндекса кэшировать нельзя
  if (url.hostname.endsWith('yandex.ru') || url.hostname.endsWith('yandex.net')) return;
  if (url.origin !== self.location.origin) return;

  // Открытие самой страницы: всегда мимо HTTP-кэша браузера.
  const isPage = req.mode === 'navigate' ||
    url.pathname.endsWith('/') ||
    url.pathname.endsWith('/index.html');

  if (isPage) {
    e.respondWith(
      fetch(new Request(url.pathname + '?_=' + Date.now(), { cache: 'no-store' }))
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put('./index.html', copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match('./index.html').then((hit) => hit || caches.match('./')))
    );
    return;
  }

  e.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit || caches.match('./index.html')))
  );
});
