// Escapades — mode hors-ligne
// Page et scripts : réseau d'abord, copie en cache pour l'ouvrir sans connexion.
// Fonds de carte déjà vus : gardés en cache (600 tuiles max).
const V = "esc-v1", TILES = "esc-tiles";
self.addEventListener("install", e => { self.skipWaiting(); e.waitUntil(caches.open(V).then(c => c.addAll(["./"])).catch(() => {})); });
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.method !== "GET") return;
  const u = new URL(r.url);
  if (/openai|nominatim|open-meteo|frankfurter|overpass|deezer/.test(u.host)) return;          // données en direct : jamais en cache
  if (r.destination === "audio" || r.destination === "video" || r.headers.has("range") || /dzcdn|deezer/.test(u.host)) return; // sons et vidéos : directement au réseau
  if (u.origin === location.origin) {
    e.respondWith(fetch(r).then(res => {
      if (res.ok && !u.search.includes("check=")) { const c = res.clone(); caches.open(V).then(ca => ca.put(new Request(u.origin + u.pathname), c)); }
      return res;
    }).catch(() => caches.match(new Request(u.origin + u.pathname)).then(m => m || caches.match("./"))));
    return;
  }
  if (/tile\.openstreetmap/.test(u.host)) {
    e.respondWith(caches.open(TILES).then(async c => {
      const m = await c.match(r);
      if (m) return m;
      try { const res = await fetch(r); c.put(r, res.clone()).then(() => trim(c)); return res; } catch (er) { return Response.error(); }
    }));
    return;
  }
  e.respondWith(caches.match(r).then(m => m || fetch(r).then(res => { const c = res.clone(); caches.open(V).then(ca => ca.put(r, c)); return res; })));
});
async function trim(c) { const k = await c.keys(); if (k.length > 600) for (let i = 0; i < k.length - 600; i++) await c.delete(k[i]); }
