// Kiểm tra bản cập nhật.
//  - Trên web: hỏi file version.json của trang (mỗi lần đưa bản mới lên mạng là có mã build mới) → banner "Tải lại ngay"
//  - Trong app Android: hỏi GitHub Releases xem đã có APK số phiên bản cao hơn chưa → màn hình BẮT BUỘC tải bản mới
//    (chỉ báo khi file APK đã thật sự được đăng, tránh báo lúc APK còn đang build)
import { ONLINE } from '../../data/online.js';
import { GAME_VERSION, BUILD_ID } from '../version.js';
import { isNative } from './native.js';

const SITE = (import.meta.env?.VITE_SITE_URL || ONLINE.siteUrl || '').replace(/\/$/, '');

export function newerVersion(a, b) {
  const pa = String(a).split('.').map((n) => +n || 0), pb = String(b).split('.').map((n) => +n || 0);
  for (let i = 0; i < 3; i++) { if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) > (pb[i] || 0); }
  return false;
}

/** Đọc thông tin bản APK mới nhất từ dữ liệu GitHub Releases (tag dạng apk-0.9.2-6). */
export function parseRelease(rel, fileName = ONLINE.apkFileName) {
  const m = /(\d+\.\d+\.\d+)/.exec(rel?.tag_name || '');
  if (!m) return null;
  const asset = (rel.assets || []).find((a) => a.name === fileName && (a.state || 'uploaded') === 'uploaded');
  if (!asset) return null;
  const notes = String(rel.body || '').split('\n').map((l) => l.trim()).filter((l) => l.startsWith('- ')).map((l) => l.slice(2));
  return { version: m[1], apkUrl: asset.browser_download_url, notes };
}

async function getJson(url) {
  const r = await fetch(`${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}`, { cache: 'no-store' });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

/** Bản APK mới hơn bản đang chạy (null nếu không có / không hỏi được). */
async function checkNative() {
  if (ONLINE.apkReleaseApi) {
    try {
      const info = parseRelease(await getJson(ONLINE.apkReleaseApi));
      if (info) return newerVersion(info.version, GAME_VERSION) ? info : null;
    } catch { /* GitHub giới hạn số lần hỏi / mất mạng — thử cách dưới */ }
  }
  // dự phòng: trang web đã lên bản mới từ hơn 20 phút trước (APK chắc chắn đã build xong)
  if (!SITE) return null;
  const v = await getJson(`${SITE}/version.json`);
  const age = Date.now() - Date.parse(v.builtAt || 0);
  if (!newerVersion(v.version, GAME_VERSION) || !(age > 20 * 60000)) return null;
  return { version: v.version, notes: v.notes || [], apkUrl: import.meta.env?.VITE_APK_URL || ONLINE.apkDownloadUrl || '' };
}

export function startUpdateChecks(emitter) {
  if (import.meta.env?.DEV || BUILD_ID === 'dev') return;
  const native = isNative();
  if (!native && !/^https?:$/.test(location.protocol)) return;
  let notified = '';
  const check = async () => {
    if (navigator.onLine === false) return;
    try {
      if (native) {
        const info = await checkNative();
        if (info && notified !== info.version) {
          notified = info.version;
          emitter.emit(ONLINE.forceAppUpdate ? 'app-update-required' : 'update-available', { ...info, native: true });
        }
        return;
      }
      const v = await getJson(new URL('version.json', location.href).href);
      if (v.buildId && v.buildId !== BUILD_ID && notified !== v.buildId) {
        notified = v.buildId;
        emitter.emit('update-available', { ...v, native: false });
      }
    } catch { /* không có mạng hoặc trang chưa đưa lên — bỏ qua */ }
  };
  setTimeout(check, native ? 1500 : 8000);
  setInterval(check, Math.max(1, ONLINE.checkUpdateMinutes) * 60000);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') check(); });
}

/** Đăng ký service worker (chơi khi mất mạng). Không dùng trong app Android (đã có sẵn file trong máy). */
export function registerServiceWorker() {
  if (import.meta.env?.DEV || isNative() || !('serviceWorker' in navigator) || !/^https?:$/.test(location.protocol)) return;
  try { navigator.serviceWorker.register('./sw.js').catch(() => {}); } catch { /* trang nhúng chặn — bỏ qua */ }
}
