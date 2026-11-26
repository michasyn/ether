const CACHE_NAME = "ether-cache-v17";
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./audio.js",
  "./levels.js",
  "./engine.js",
  "./editor.js",
  "./manifest.json",
  "./icon.svg"
];
const OPTIONAL_ASSETS = [
  "./newlevel.mp3",
  "./winlevel.mp3",
  "./lostlevel.mp3"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await cache.addAll(CORE_ASSETS);
      await Promise.all(
        OPTIONAL_ASSETS.map((url) => cache.add(url).catch(() => {}))
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
