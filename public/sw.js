/**
 * Service Worker —— 讓 app 在離線時仍可開啟。
 *
 * 刻意不做 install 階段的預先快取：Next.js 的 chunk 檔名帶 hash，
 * 預先快取一份清單很容易在下次部署後留下對不上的舊資源。
 * 改為執行期快取，資源被實際請求到才存，永遠不會有孤兒檔案。
 */

const VERSION = "v1";
const STATIC_CACHE = `static-${VERSION}`;
const PAGE_CACHE = `pages-${VERSION}`;

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // 清掉舊版本的快取，避免部署後吃到過期資源
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => !k.endsWith(VERSION))
          .map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request);
  if (hit) return hit;

  const res = await fetch(request);
  if (res.ok) cache.put(request, res.clone());
  return res;
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const res = await fetch(request);
    if (res.ok) cache.put(request, res.clone());
    return res;
  } catch {
    // 離線：回退到上次成功載入的版本
    const hit = await cache.match(request);
    if (hit) return hit;
    const shell = await cache.match("/");
    if (shell) return shell;
    throw new Error("offline and no cached response");
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // 帶 hash 的靜態資源內容不可變，快取優先最省流量
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icon-") ||
    url.pathname === "/apple-touch-icon.png" ||
    url.pathname === "/manifest.webmanifest"
  ) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // 頁面導覽：網路優先，確保拿到最新版；離線才回退快取
  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, PAGE_CACHE));
  }
});
