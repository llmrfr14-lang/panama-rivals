const VERSION = "v2";

self.addEventListener("install", (event) => {
  // No eager shell caching: the network-first navigations below populate the
  // cache on first visit, which never pins a stale HTML shell over a deploy.
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

  // App shell & navigations — network-first so a deploy always serves the
  // fresh HTML/JS shell. The offline fallback (cached root) is only used when
  // the network is unavailable. Never let a stale cached shell shadow new
  // deploys; that breaks Next.js client-side navigation (old chunk URLs 404).
  if (url.pathname === "/" || event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).then((res) => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(VERSION).then((cache) => cache.put(event.request, clone));
        }
        return res;
      }).catch(() => caches.match("/").then((cached) => cached))
    );
    return;
  }

  // Static build assets — only content-hashed immutable files under
  // /_next/static/ (and images/fonts): cache-first with network fallback,
  // skipping 4xx so a stale entry can never shadow a live one.
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(VERSION).then((cache) => cache.put(event.request, clone));
          }
          return res;
        }).catch(() => cached);
      })
    );
    return;
  }

  // Everything else (RSC payloads, API, non-hashed routes) — network-first,
  // never cached, so the client always sees the latest server data.
  event.respondWith(fetch(event.request));