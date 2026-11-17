// Kết nối Supabase (chỉ dùng khóa CÔNG KHAI anon/publishable).
import { createClient } from '@supabase/supabase-js';
import { ONLINE } from '../../data/online.js';

const url = (import.meta.env?.VITE_SUPABASE_URL || ONLINE.supabaseUrl || '').trim();
const key = (import.meta.env?.VITE_SUPABASE_ANON_KEY || ONLINE.supabaseAnonKey || '').trim();

// Ghi nhớ phần # của địa chỉ TRƯỚC khi Supabase đọc & xóa nó (dùng cho liên kết "quên mật khẩu", lỗi đăng nhập)
export const initialHash = typeof location !== 'undefined' ? location.hash : '';

let client = null;
let configError = '';

/** Chặn trường hợp dán nhầm khóa bí mật vào code trình duyệt */
function isSecretKey(k) {
  if (k.startsWith('sb_secret_')) return true;
  const parts = k.split('.');
  if (parts.length === 3) {
    try {
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
      return payload.role === 'service_role';
    } catch { /* không phải JWT */ }
  }
  return false;
}

if (url && key) {
  if (isSecretKey(key)) {
    configError = 'Bạn đã dán KHÓA BÍ MẬT (service_role / secret) vào game. Hãy xóa ngay và dùng khóa "anon public" hoặc "Publishable key".';
    console.error(configError);
  } else {
    client = createClient(url, key, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'implicit' },
    });
  }
}

export const supabase = client;
export const isOnlineConfigured = () => !!client;
export const onlineConfigError = () => configError;

/**
 * Giới hạn thời gian chờ máy chủ (mất mạng thì không bắt người chơi đợi lâu).
 * make(signal) trả về promise; signal dùng cho .abortSignal() của Supabase.
 */
export async function withTimeout(make, ms = 5000) {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) throw new Error('Failed to fetch (offline)');
  const ctrl = new AbortController();
  let timer;
  const timeout = new Promise((_, reject) => { timer = setTimeout(() => { ctrl.abort(); reject(new Error('Failed to fetch (timeout)')); }, ms); });
  try {
    return await Promise.race([make(ctrl.signal), timeout]);
  } finally {
    clearTimeout(timer);
  }
}
