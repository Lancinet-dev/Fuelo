const CACHE = 'fuelo-v1'

self.addEventListener('install' , () => {
  self.skipWaiting()
})

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return
  e.respondWith(
    caches.open(CACHE).then(cache =>
      fetch(e.request).catch(() => cache.match(e.request))
    )
  )
})