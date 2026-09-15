// 仙台行程 PWA Service Worker
// 策略：同源檔案（HTML/CSS/JS/manifest/icon）一律「網路優先」，確保部署新版後不會看到舊快取；
// 離線時才退回快取。外部 CDN 函式庫則「快取優先」，減少重覆下載並支援離線開啟。
// Firebase 即時資料庫走 WebSocket / XHR long-polling，不攔截、直接放行給網路。

const SHELL_CACHE = 'sendai-shell-v1';
const CDN_CACHE = 'sendai-cdn-v1';

const SHELL_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_ASSETS))
      .catch(() => {}) // 首次安裝若離線失敗也不擋住 SW 啟用
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== SHELL_CACHE && k !== CDN_CACHE)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

function isFirebaseRequest(url) {
  return (
    url.hostname.includes('firebaseio.com') ||
    url.hostname.includes('firebasedatabase.app') ||
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('firebaseinstallations') ||
    url.hostname.includes('firebase.googleapis.com')
  );
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Firebase / Google API 呼叫：完全不攔截，讓瀏覽器直接處理即時連線
  if (isFirebaseRequest(url)) return;

  const sameOrigin = url.origin === self.location.origin;

  if (sameOrigin) {
    // 網路優先：拿到新版本就更新快取並回傳；離線時才用快取
    event.respondWith(
      fetch(req)
        .then((res) => {
          const resClone = res.clone();
          caches.open(SHELL_CACHE).then((cache) => cache.put(req, resClone));
          return res;
        })
        .catch(async () => {
          const cached = await caches.match(req);
          if (cached) return cached;
          if (req.mode === 'navigate') {
            const fallback = await caches.match('./index.html');
            if (fallback) return fallback;
          }
          return new Response('離線中，且尚無快取內容', { status: 503 });
        })
    );
    return;
  }

  // 外部 CDN 資源（字型、函式庫）：快取優先，背景更新
  event.respondWith(
    caches.match(req).then((cached) => {
      const fetchPromise = fetch(req)
        .then((res) => {
          if (res && res.status === 200) {
            const resClone = res.clone();
            caches.open(CDN_CACHE).then((cache) => cache.put(req, resClone));
          }
          return res;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
