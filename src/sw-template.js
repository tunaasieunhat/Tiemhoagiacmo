// Service worker: lưu sẵn game để mở được khi mất mạng. (Mẫu — vite.config.js điền danh sách file khi build)
const CACHE = __CACHE__;
const PRECACHE = __PRECACHE__;

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith('tiem-hoa-') && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (req.headers.has('range')) return; // nhạc nền / video intro tải từng đoạn => đi thẳng mạng
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // Supabase, font ngoài... đi thẳng mạng
  if (url.pathname.endsWith('/version.json')) return; // luôn hỏi mạng
  if (req.mode === 'navigate') {
    // trang chính: ưu tiên mạng (để có bản mới), mất mạng thì dùng bản đã lưu
    e.respondWith(fetch(req).then((r) => { const copy = r.clone(); caches.open(CACHE).then((c) => c.put('./index.html', copy)); return r; }).catch(() => caches.match('./index.html', { ignoreVary: true })));
    return;
  }
  // tài nguyên có mã băm trong tên: ưu tiên bản đã lưu
  e.respondWith(caches.match(req, { ignoreVary: true }).then((hit) => hit || fetch(req).then((r) => {
    if (r.ok) { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
    return r;
  })));
});
