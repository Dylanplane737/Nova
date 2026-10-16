/* Nova App Shell Cache — keeps the app and local game available offline */
"use strict";

const CACHE_NAME = "nova-shell-v2";
const SHELL_FILES = [
  "index.html",
  "Nova.css",
  "NovaCore.js",
  "NovaAudio.js",
  "NovaTimeline.js",
  "Settings.js",
  "NovaTranslate.js",
  "NovaTabs.js",
  "NovaResearch.js",
  "NovaHome.js",
  "NovaOffline.js",
  "NovaConnectionTest.js",
  "favicon.png",
  "Novalogo.png"
];

function shellUrl(path) {
  return new URL(path, self.registration.scope).href;
}

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    const urls = SHELL_FILES.map(shellUrl);
    await cache.addAll(urls);
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.map(name => {
      if (name.startsWith("nova-shell-") && name !== CACHE_NAME) {
        return caches.delete(name);
      }
      return Promise.resolve(false);
    }));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;

  const requestUrl = new URL(request.url);
  const scopeUrl = new URL(self.registration.scope);
  if (requestUrl.origin !== scopeUrl.origin || !requestUrl.pathname.startsWith(scopeUrl.pathname)) return;

  const indexUrl = shellUrl("index.html");

  if (request.mode === "navigate") {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      try {
        const response = await fetch(request);
        if (response && response.ok) {
          await cache.put(indexUrl, response.clone());
        }
        return response;
      } catch (error) {
        const cachedIndex = await cache.match(indexUrl);
        if (cachedIndex) return cachedIndex;
        return new Response("Nova has not been cached on this device yet. Connect once, open Nova, and try again.", {
          status: 503,
          headers: { "Content-Type": "text/plain; charset=utf-8" }
        });
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request, { ignoreSearch: true });

    const refresh = fetch(request).then(async response => {
      if (response && response.ok && response.type !== "opaque") {
        const cleanUrl = new URL(request.url);
        cleanUrl.search = "";
        await cache.put(cleanUrl.href, response.clone());
      }
      return response;
    }).catch(() => null);

    if (cached) {
      refresh.catch(() => {});
      return cached;
    }

    const fresh = await refresh;
    if (fresh) return fresh;
    return new Response("This Nova feature needs an internet connection.", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8" }
    });
  })());
});