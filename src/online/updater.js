// Kiểm tra bản cập nhật: hỏi file version.json trên trang web của game.
//  - Trên web: so mã bản build (mỗi lần đưa bản mới lên mạng là có mã mới)
//  - Trong app Android: so số phiên bản với trang web (cần tải APK mới)
import { ONLINE } from '../../data/online.js';
import { GAME_VERSION, BUILD_ID } from '../version.js';
import { isNative } from './native.js';

const SITE = (import.meta.env?.VITE_SITE_URL || ONLINE.siteUrl || '').replace(/\/$/, '');

export function newerVersion(a, b) {
  const pa = String(a).split('.').map((n) => +n || 0), pb = String(b).split('.').map((n) => +n || 0);
  for (let i = 0; i < 3; i++) { if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) > (pb[i] || 0); }
  return false;
}

export function startUpdateChecks(emitter) {
  if (import.meta.env?.DEV || BUILD_ID === 'dev') return;
  const native = isNative();
  if (native && !SITE) return; // app chưa biết địa chỉ trang web
  if (!native && !/^https?:$/.test(location.protocol)) return;
  const url = native ? `${SITE}/version.json` : new URL('version.json', location.href).href;
  let notified = '';
  const check = async () => {
    if (navigator.onLine === false) return;
    try {
      const r = await fetch(`${url}?t=${Date.now()}`, { cache: 'no-store' });
      if (!r.ok) return;
      const v = await r.json();
      const isNew = native ? newerVersion(v.version, GAME_VERSION) : v.buildId && v.buildId !== BUILD_ID;
      if (isNew && notified !== (v.buildId || v.version)) {
        notified = v.buildId || v.version;
        emitter.emit('update-available', { ...v, native, apkUrl: import.meta.env?.VITE_APK_URL || ONLINE.apkDownloadUrl || '' });
      }
    } catch { /* không có mạng hoặc trang chưa đưa lên — bỏ qua */ }
  };
  setTimeout(check, 8000);
  setInterval(check, Math.max(1, ONLINE.checkUpdateMinutes) * 60000);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') check(); });
}

/** Đăng ký service worker (chơi khi mất mạng). Không dùng trong app Android (đã có sẵn file trong máy). */
export function registerServiceWorker() {
  if (import.meta.env?.DEV || isNative() || !('serviceWorker' in navigator) || !/^https?:$/.test(location.protocol)) return;
  try { navigator.serviceWorker.register('./sw.js').catch(() => {}); } catch { /* trang nhúng chặn — bỏ qua */ }
}
