const CACHE_NAME = "ether-cache-v37";
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
      await cache.addAll(CORE_ASSETS.map((url) => new Request(url, { cache: "reload" })));
      await Promise.all(
        OPTIONAL_ASSETS.map((url) => cache.add(new Request(url, { cache: "reload" })).catch(() => {}))
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
  if (event.request.method !== "GET") return;
  const reqUrl = new URL(event.request.url);
  if (reqUrl.origin !== self.location.origin) return;

  // Network-First: immer aktuelle Dateien laden, Offline-Fallback aus dem Cache
  event.respondWith(
    fetch(event.request, { cache: "no-cache" })
      .then((response) => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(() => {});
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
