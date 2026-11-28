// Phần dành riêng cho ỨNG DỤNG ANDROID (Capacitor). Trên trình duyệt các hàm này không làm gì.
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';

export const APP_SCHEME = 'vn.tiemhoagiacmo.game';
export const NATIVE_AUTH_REDIRECT = `${APP_SCHEME}://auth`;

export const isNative = () => {
  try { return Capacitor.isNativePlatform(); } catch { return false; }
};

/** Mở link bằng trình duyệt hệ thống (trong app) hoặc tab mới (web) */
export async function openExternal(url) {
  if (isNative()) await Browser.open({ url });
  else window.open(url, '_blank', 'noopener');
}

export async function closeExternal() {
  if (isNative()) { try { await Browser.close(); } catch { /* đã đóng */ } }
}

/**
 * Gắn các sự kiện của app:
 *  - onBack(): trả về true nếu đã xử lý (vd đóng bảng), false => thu nhỏ app
 *  - onAuthUrl(url): khi trình duyệt chuyển về app sau đăng nhập Google / link email
 *  - onPause(): app bị ẩn => lưu game
 */
export function initNative({ onBack, onAuthUrl, onPause }) {
  if (!isNative()) return;
  App.addListener('backButton', () => { if (!onBack?.()) App.minimizeApp(); });
  App.addListener('appUrlOpen', ({ url }) => { if (url?.startsWith(APP_SCHEME)) onAuthUrl?.(url); });
  App.addListener('pause', () => onPause?.());
}

/** Lấy token từ link trả về: vn.tiemhoagiacmo.game://auth#access_token=...&refresh_token=...&type=recovery */
export function parseAuthUrl(url) {
  const hash = url.split('#')[1] || url.split('?')[1] || '';
  const q = new URLSearchParams(hash);
  return { access_token: q.get('access_token'), refresh_token: q.get('refresh_token'), type: q.get('type'), error: q.get('error_description') || q.get('error') };
}
