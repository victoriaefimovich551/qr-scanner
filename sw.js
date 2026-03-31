// ========== SERVICE WORKER ДЛЯ ОФЛАЙН-РЕЖИМА ==========
const CACHE_NAME = 'qr-scanner-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js'
];

// Установка Service Worker — кэшируем файлы
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 Кэширование файлов...');
        return cache.addAll(urlsToCache);
      })
  );
});

// Активация — удаляем старые кэши
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Удаляем старый кэш:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Перехват запросов — сначала пробуем сеть, потом кэш
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Если запрос успешен, кэшируем ответ
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(() => {
        // Если сеть недоступна, пытаемся взять из кэша
        return caches.match(event.request)
          .then(response => {
            if (response) {
              return response;
            }
            // Если в кэше нет, возвращаем офлайн-страницу
            if (event.request.destination === 'document') {
              return caches.match('/index.html');
            }
            return new Response('Нет соединения', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
      })
  );
});
