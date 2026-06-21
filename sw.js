// 配車ボード Service Worker
// 方針: アプリ本体(HTML/アイコン)はネット優先・オフライン時はキャッシュ。
//       GAS(script.google.com)など外部通信は触らない＝常にネット。
const CACHE = 'haisha-v1';
const SHELL = ['haisha-board.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;              // POST(保存)は素通し
  if (url.origin !== self.location.origin) return;     // GAS等の外部は素通し(常にネット)
  // 同一オリジン(アプリ本体)はネット優先→失敗時キャッシュ
  e.respondWith(
    fetch(e.request).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy));
      return res;
    }).catch(() => caches.match(e.request).then(r => r || caches.match('haisha-board.html')))
  );
});
