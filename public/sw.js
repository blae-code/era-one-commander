// ERA ONE companion — minimal shell cache so the installed window opens instantly
// and keeps working on a flaky link. Network-first for everything else.
// /api is NEVER cached (authenticated entity data must not land in Cache Storage).
// Bump the version on cache-policy changes; activate purges every older cache.
const CACHE = "era-one-shell-v2";
const SHELL = ["/", "/manifest.json"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== self.location.origin) return;
  // API traffic is network-only: never intercepted, never cache.put — keeps
  // authenticated entity data out of Cache Storage.
  if (url.pathname === "/api" || url.pathname.startsWith("/api/")) return;
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).catch(() => caches.match("/")));
    return;
  }
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok && res.type === "basic") caches.open(CACHE).then((c) => c.put(req, res.clone()));
        return res;
      })
      .catch(() => caches.match(req))
  );
});
