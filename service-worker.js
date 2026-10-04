const CACHE_NAME = 'mahrec-cache-v4';
const ASSETS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Réseau en priorité pour les pages/fichiers de l'app (toujours la version la plus récente si internet
// est disponible), avec le cache seulement en secours si hors-ligne.
// cache: 'no-store' force une vraie requête réseau à chaque fois, sans passer par le cache HTTP du
// navigateur (sinon on pouvait recevoir une copie périmée même en étant "en ligne").
self.addEventListener('fetch', (event) => {
  // Ne pas intercepter le modèle IA (très gros) ni les requêtes non-GET : le navigateur les met déjà en cache lui-même.
  const h = new URL(event.request.url).hostname;
  if(event.request.method !== 'GET' || h.endsWith('huggingface.co') || h.endsWith('hf.co') || h === 'cdn.jsdelivr.net') return;
  event.respondWith(
    fetch(event.request, { cache: 'no-store' }).then((response) => {
      const copy = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
      return response;
    }).catch(() => caches.match(event.request))
  );
});
