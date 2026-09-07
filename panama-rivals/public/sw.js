const VERSION = "v1";
const SHELL = [
  "/",
  "/manifest.webmanifest",
  "/logo.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(VERSION).then((cache) => cache.addAll(SHELL)))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== self.location.origin) return;

  // App shell — cache-first so the UI opens instantly offline.
  if (url.pathname === "/") {
    event.respondWith(
      caches.match(event.request).then((cached) =>
        cached || fetch(event.request).then((res) => {
          const clone = res.clone();
          caches.open(VERSION).then((cache) => cache.put("/", clone));
          return res;
        }).catch(() => cached)
      )
    );
    return;
  }

  // Navigations — network-first, fallback to cached root for offlineapp launch。
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).then((res) => {
        const clone = res.clone();
        caches.open(VERSION).then((cache) => cache.put(event.request, clone));
        return res;
      }).catch(() => caches.match("/").then((cached) => cached))
    );
    return;
  }

  // Static assets — stale-while-revalidate。
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request).then((res) => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(VERSION).then((cache) => cache.put(event.request, clone));
        }
        return res;
      }).catch(() => cached);
      return cached || network;
    })
  );
});