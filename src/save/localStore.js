// =============================================================
//  LƯU TRÊN MÁY bằng IndexedDB (dự phòng localStorage)
// =============================================================
const DB_NAME = 'tiem-hoa-giac-mo';
const STORE = 'kv';
let dbPromise = null;

function openDb() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (!('indexedDB' in globalThis)) return reject(new Error('no-idb'));
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

async function idb(mode, fn) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const req = fn(tx.objectStore(STORE));
    tx.oncomplete = () => resolve(req?.result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

export async function getItem(key) {
  try {
    return await idb('readonly', (s) => s.get(key));
  } catch {
    try { const raw = localStorage.getItem(DB_NAME + ':' + key); return raw ? JSON.parse(raw) : undefined; } catch { return undefined; }
  }
}

export async function setItem(key, value) {
  try {
    await idb('readwrite', (s) => s.put(value, key));
  } catch {
    try { localStorage.setItem(DB_NAME + ':' + key, JSON.stringify(value)); } catch (e) { console.warn('Không lưu được', e); throw e; }
  }
}

export async function removeItem(key) {
  try { await idb('readwrite', (s) => s.delete(key)); } catch { /* bỏ qua */ }
  try { localStorage.removeItem(DB_NAME + ':' + key); } catch { /* bỏ qua */ }
}
