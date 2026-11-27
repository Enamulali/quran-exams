
var CACHE = 'quran-exams-v30';
var FILES = ['./', 'index.html', 'manifest.webmanifest', 'icon-180.png', 'icon-512.png'];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(FILES); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;   // marks always go straight to Google
  if (e.request.mode === 'navigate') {
    // The page itself: always the newest copy when there is signal (so a change shows on the next open);
    // the kept copy only if the network is down or takes over 3 seconds.
    e.respondWith(caches.open(CACHE).then(function (c) {
      var net = fetch(e.request, { cache: 'no-store' }).then(function (r) {
        if (r && r.ok) c.put('index.html', r.clone());
        return r;
      });
      var slow = new Promise(function (res) { setTimeout(res, 3000); }).then(function () { return c.match('index.html'); });
      return Promise.race([net.catch(function () { return c.match('index.html'); }), slow.then(function (h) { return h || net; })]);
    }));
    return;
  }
  e.respondWith(caches.open(CACHE).then(function (c) {
    return c.match(e.request, { ignoreSearch: true }).then(function (hit) {
      var fresh = fetch(e.request).then(function (r) { if (r && r.ok) c.put(e.request, r.clone()); return r; })
        .catch(function () { return hit; });
      return hit || fresh;            // the kept copy at once; the fresh one is stored for next time
    });
  }));
});
