// Offline-cache voor "Eten onderweg". Verhoog VERSIE bij elke nieuwe versie van de app.
const VERSIE = "eten-v1";
const BESTANDEN = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSIE).then(c => c.addAll(BESTANDEN)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSIE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Eerst uit de cache (werkt zonder netwerk), op de achtergrond bijwerken als er wel netwerk is.
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.open(VERSIE).then(cache =>
      cache.match(e.request, { ignoreSearch: true }).then(hit => {
        const net = fetch(e.request)
          .then(res => { if (res && res.ok) cache.put(e.request, res.clone()); return res; })
          .catch(() => hit);
        return hit || net;
      })
    )
  );
});
