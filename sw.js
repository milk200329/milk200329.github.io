// 仙台遊 9/19-9/26 — Service Worker
// 版本號：更新內容後請務必調整這個字串，才會清掉舊快取、換上新版
const CACHE_VERSION = "sendai-trip-v1";
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-512-maskable.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(CORE_ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // 只處理同源請求；Firebase、字型、匯率、天氣 API 一律直接放行，
  // 確保永遠拿到最新資料，不被 Service Worker 快取卡住。
  if (url.origin !== self.location.origin) return;
  if (req.method !== "GET") return;

  const isNavigation = req.mode === "navigate" || (req.headers.get("accept") || "").includes("text/html");

  if (isNavigation) {
    // 網路優先：確保更新後不會看到舊版頁面；離線時才退回快取。
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put("./index.html", copy));
          return res;
        })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  // 其他同源靜態資源：快取優先，背景更新快取。
  event.respondWith(
    caches.match(req).then((cached) => {
      const fetchPromise = fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(req, copy));
          return res;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
