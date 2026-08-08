/* Минимальный офлайн-кэш для версии на GitHub Pages.
   Раньше index.html регистрировал ./sw.js, которого в репозитории не было,
   поэтому в консоли всегда висела ошибка 404.
   Версию кэша поднимаем при каждой правке index.html, иначе телефон
   продолжает показывать старый файл. */
const CACHE = 'dance-trainer-v4';
const ASSETS = ['./', './index.html'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Запросы к API Яндекса кэшировать нельзя
  if (url.hostname.endsWith('yandex.ru') || url.hostname.endsWith('yandex.net')) return;
  if (url.origin !== self.location.origin) return;

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
