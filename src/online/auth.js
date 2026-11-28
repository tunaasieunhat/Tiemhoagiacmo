// Đăng nhập / đăng ký / quên mật khẩu / Google / hồ sơ người chơi.
import { supabase, withTimeout } from './supabase.js';
import { normalizeName } from './names.js';
import { isNative, NATIVE_AUTH_REDIRECT, openExternal } from './native.js';

// Nơi người chơi được đưa về sau khi bấm link trong email / đăng nhập Google.
// Trong app Android: mở lại app qua đường dẫn riêng vn.tiemhoagiacmo.game://auth
const redirectUrl = () => (isNative() ? NATIVE_AUTH_REDIRECT : location.origin + location.pathname);
const PROFILE_CACHE = (uid) => `thgm:profile:${uid}`;
const MODE_KEY = 'thgm:mode';

function ok(r) { if (r.error) throw r.error; return r.data; }

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export const signIn = (email, password) => supabase.auth.signInWithPassword({ email: email.trim(), password }).then(ok);

export async function signUp(email, password, displayName) {
  return ok(await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: { data: { display_name: normalizeName(displayName) }, emailRedirectTo: redirectUrl() },
  }));
}

export const resendConfirm = (email) => supabase.auth.resend({ type: 'signup', email: email.trim(), options: { emailRedirectTo: redirectUrl() } }).then(ok);
export const sendReset = (email) => supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: redirectUrl() }).then(ok);
export const updatePassword = (password) => supabase.auth.updateUser({ password }).then(ok);
export async function signInGoogle() {
  if (isNative()) {
    // Google không cho đăng nhập trong khung nhúng của app => mở trình duyệt hệ thống, đăng nhập xong quay về app
    const d = ok(await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: NATIVE_AUTH_REDIRECT, skipBrowserRedirect: true } }));
    await openExternal(d.url);
    return d;
  }
  return ok(await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: redirectUrl() } }));
}

/** App Android nhận token từ link trả về (đăng nhập Google, xác nhận email, quên mật khẩu) */
export async function setSessionFromTokens(accessToken, refreshToken) {
  return ok(await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken }));
}

export async function signOut() {
  await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
}

// ---------- hồ sơ ----------
export async function fetchProfile(uid) {
  try {
    const p = ok(await withTimeout((sig) => supabase.from('profiles').select('id, display_name, friend_code, avatar, level, reputation, profile_setup_done').eq('id', uid).abortSignal(sig).retry(false).maybeSingle()));
    if (p) cacheProfile(p);
    return p || cachedProfile(uid);
  } catch (e) {
    const c = cachedProfile(uid);
    if (c) return { ...c, offline: true };
    throw e;
  }
}

export async function updateProfile(uid, { displayName, avatar, setupDone }) {
  const patch = {};
  if (displayName !== undefined) patch.display_name = normalizeName(displayName);
  if (avatar !== undefined) patch.avatar = avatar;
  if (setupDone !== undefined) patch.profile_setup_done = setupDone;
  const p = ok(await supabase.from('profiles').update(patch).eq('id', uid).select('id, display_name, friend_code, avatar, level, reputation, profile_setup_done').single());
  cacheProfile(p);
  return p;
}

function cacheProfile(p) { try { localStorage.setItem(PROFILE_CACHE(p.id), JSON.stringify(p)); } catch { /* bỏ qua */ } }
function cachedProfile(uid) { try { return JSON.parse(localStorage.getItem(PROFILE_CACHE(uid)) || 'null'); } catch { return null; } }

// ---------- nhớ lựa chọn "chơi khách" ----------
export function getPreferredMode() { try { return localStorage.getItem(MODE_KEY); } catch { return null; } }
export function setPreferredMode(m) { try { m ? localStorage.setItem(MODE_KEY, m) : localStorage.removeItem(MODE_KEY); } catch { /* bỏ qua */ } }
