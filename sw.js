// Offline-cache voor "Eten onderweg". Verhoog VERSIE bij elke nieuwe versie van de app.
const VERSIE = "eten-v5";
const BESTANDEN = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png"];

// Altijd verse bestanden ophalen bij installatie (niet uit de browsercache).
self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(VERSIE)
      .then(c => c.addAll(BESTANDEN.map(u => new Request(u, { cache: "reload" }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSIE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const pagina = e.request.mode === "navigate";
  e.respondWith(
    caches.open(VERSIE).then(cache => {
      if (pagina) {
        // Pagina: met netwerk altijd de nieuwste versie, zonder netwerk uit de cache.
        return fetch(e.request, { cache: "no-store" })
          .then(res => { if (res && res.ok) cache.put("./index.html", res.clone()); return res; })
          .catch(() => cache.match("./index.html").then(r => r || cache.match("./")));
      }
      // Overige bestanden: eerst cache, op de achtergrond bijwerken.
      return cache.match(e.request, { ignoreSearch: true }).then(hit => {
        const net = fetch(e.request).then(res => { if (res && res.ok) cache.put(e.request, res.clone()); return res; }).catch(() => hit);
        return hit || net;
      });
    })
  );
});
