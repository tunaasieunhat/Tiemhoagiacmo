// Màn hình tài khoản: đăng nhập, đăng ký, quên mật khẩu, đặt mật khẩu mới,
// tạo nhân vật (tên + avatar), chọn save khi có xung đột.
import * as auth from '../online/auth.js';
import { viError } from '../online/errors.js';
import { checkDisplayName, normalizeName } from '../online/names.js';
import { ONLINE } from '../../data/online.js';
import { avatarSVG } from './avatar.js';
import { clockOf } from '../systems/time.js';

export const AVATAR_PARTS = {
  skin: { label: 'Da', colors: ['#ffe0c7', '#f8cfae', '#e8b48f', '#c98e66', '#8d5a3b'] },
  hair: { label: 'Tóc', colors: ['#6b4433', '#2f2a2a', '#e8c37a', '#f29bb2', '#8fb8e8', '#b58ad6', '#e07a52'] },
  outfit: { label: 'Áo', colors: ['#8fc9e8', '#f6a6b9', '#a6dd94', '#ffd34e', '#c8b4f0', '#ffb38a'] },
  hat: { label: 'Mũ', colors: ['#f6d67a', '#f6a6b9', '#9fe0c4', '#ffffff', '#c8b4f0', '#8fc9e8'] },
};

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const GOOGLE_ICON = '<svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>';

export class AuthScreen {
  constructor() {
    this.el = document.createElement('div');
    this.el.id = 'auth';
    this.el.className = 'hidden';
    document.body.appendChild(this.el);
    this.el.addEventListener('submit', (e) => { e.preventDefault(); this.onSubmit?.(e.target); });
    this.el.addEventListener('click', (e) => { const b = e.target.closest('[data-a]'); if (b) this.onAction?.(b.dataset.a, b); });
  }

  show(html) {
    this.el.innerHTML = `<div class="auth-card">${html}</div>`;
    this.el.classList.remove('hidden');
    const first = this.el.querySelector('input:not([type=hidden])');
    if (first && matchMedia('(pointer: fine)').matches) first.focus();
  }

  hide() { this.el.classList.add('hidden'); this.el.innerHTML = ''; this.onSubmit = this.onAction = null; }

  setBusy(form, busy, msg = '') {
    form.querySelectorAll('button, input').forEach((b) => { b.disabled = busy; });
    const err = form.querySelector('.form-msg') || this.el.querySelector('.form-msg');
    if (err) { err.textContent = msg; err.className = 'form-msg' + (msg ? ' show' : ''); }
  }

  message(text, kind = 'error') {
    const m = this.el.querySelector('.form-msg');
    if (m) { m.textContent = text; m.className = `form-msg show ${kind}`; }
  }

  // ------------------------------------------------------------
  /** Đăng nhập / đăng ký. Trả về { session } hoặc { guest: true } */
  run({ tab = 'login', notice = '' } = {}) {
    return new Promise((resolve) => {
      let current = tab;
      let lastEmail = '';
      const render = () => {
        const login = current === 'login';
        this.show(`
          <div class="auth-logo">🌷</div>
          <h1>Tiệm Hoa Giấc Mơ</h1>
          <p class="auth-sub">Đăng nhập để lưu nông trại lên mạng và chơi trên mọi thiết bị</p>
          <div class="tabs" role="tablist">
            <button type="button" class="${login ? 'on' : ''}" data-a="tab-login">Đăng nhập</button>
            <button type="button" class="${login ? '' : 'on'}" data-a="tab-signup">Đăng ký</button>
          </div>
          <form class="auth-form" data-form="${current}" novalidate>
            ${login ? '' : `<label>Tên hiển thị<input id="f-name" name="name" maxlength="20" autocomplete="nickname" placeholder="Ví dụ: Bé Hoa Mơ" required></label>`}
            <label>Email<input id="f-email" name="email" type="email" autocomplete="email" inputmode="email" value="${esc(lastEmail)}" required></label>
            <label>Mật khẩu<span class="pw"><input id="f-pw" name="password" type="password" minlength="8" autocomplete="${login ? 'current-password' : 'new-password'}" placeholder="${login ? '' : 'Ít nhất 8 ký tự'}" required><button type="button" class="eye" data-a="toggle-pw" aria-label="Hiện mật khẩu">👁️</button></span></label>
            <p class="form-msg ${notice ? 'show info' : ''}">${esc(notice)}</p>
            <button class="btn primary wide" type="submit">${login ? 'Đăng nhập' : 'Tạo tài khoản'}</button>
            ${login ? '<button type="button" class="link" data-a="forgot">Quên mật khẩu?</button>' : ''}
          </form>
          ${ONLINE.enableGoogle ? `<div class="or"><span>hoặc</span></div>
          <button type="button" class="btn google wide" data-a="google">${GOOGLE_ICON} Đăng nhập bằng Google</button>` : ''}
          <button type="button" class="link guest" data-a="guest">Chơi thử không cần tài khoản →</button>
        `);
        notice = '';
      };
      render();

      this.onAction = async (a, b) => {
        if (a === 'tab-login' || a === 'tab-signup') { lastEmail = this.el.querySelector('#f-email')?.value || lastEmail; current = a === 'tab-login' ? 'login' : 'signup'; render(); }
        if (a === 'toggle-pw') { const i = this.el.querySelector('#f-pw'); i.type = i.type === 'password' ? 'text' : 'password'; }
        if (a === 'guest') { auth.setPreferredMode('guest'); this.hide(); resolve({ guest: true }); }
        if (a === 'forgot') { lastEmail = this.el.querySelector('#f-email')?.value || ''; await this.forgot(lastEmail); render(); }
        if (a === 'google') {
          b.disabled = true;
          try { await auth.signInGoogle(); /* trình duyệt sẽ chuyển sang trang Google */ } catch (e) { this.message(viError(e)); b.disabled = false; }
        }
        if (a === 'resend') {
          try { await auth.resendConfirm(lastEmail); this.message('Đã gửi lại email xác nhận.', 'info'); } catch (e) { this.message(viError(e)); }
        }
        if (a === 'back') render();
      };

      this.onSubmit = async (form) => {
        const f = new FormData(form);
        const email = String(f.get('email') || '').trim();
        const pw = String(f.get('password') || '');
        lastEmail = email;
        if (!/^\S+@\S+\.\S+$/.test(email)) return this.message('Hãy nhập email hợp lệ.');
        if (pw.length < (current === 'login' ? 1 : 8)) return this.message(current === 'login' ? 'Hãy nhập mật khẩu.' : 'Mật khẩu cần ít nhất 8 ký tự.');
        if (current === 'signup') {
          const nameErr = checkDisplayName(f.get('name'));
          if (nameErr) return this.message(nameErr);
        }
        this.setBusy(form, true, current === 'login' ? 'Đang đăng nhập...' : 'Đang tạo tài khoản...');
        try {
          if (current === 'login') {
            const d = await auth.signIn(email, pw);
            auth.setPreferredMode(null);
            this.hide();
            resolve({ session: d.session });
          } else {
            const d = await auth.signUp(email, pw, f.get('name'));
            if (d.session) { auth.setPreferredMode(null); this.hide(); resolve({ session: d.session }); return; }
            if (d.user && Array.isArray(d.user.identities) && d.user.identities.length === 0) {
              this.setBusy(form, false, '');
              return this.message('Email này đã có tài khoản. Hãy chuyển sang Đăng nhập.');
            }
            this.show(`
              <div class="auth-logo">📬</div>
              <h1>Kiểm tra hộp thư</h1>
              <p class="auth-sub">Mình đã gửi email xác nhận tới <b>${esc(email)}</b>. Mở email và bấm vào liên kết để kích hoạt tài khoản, rồi quay lại đây đăng nhập.</p>
              <p class="auth-sub small">Không thấy email? Xem thử mục Spam / Quảng cáo.</p>
              <p class="form-msg"></p>
              <button type="button" class="btn wide" data-a="resend">Gửi lại email</button>
              <button type="button" class="btn primary wide" data-a="tab-login">Tôi đã xác nhận → Đăng nhập</button>
            `);
          }
        } catch (e) {
          this.setBusy(form, false, '');
          this.message(viError(e));
          if (/chưa được xác nhận/.test(viError(e))) {
            const m = this.el.querySelector('.form-msg');
            m.insertAdjacentHTML('beforeend', ' <button type="button" class="link" data-a="resend">Gửi lại email</button>');
          }
        }
      };
    });
  }

  /** Quên mật khẩu: gửi email chứa liên kết đặt lại */
  forgot(email) {
    return new Promise((resolve) => {
      this.show(`
        <div class="auth-logo">🔑</div>
        <h1>Quên mật khẩu</h1>
        <p class="auth-sub">Nhập email đã đăng ký, mình sẽ gửi liên kết để đặt mật khẩu mới.</p>
        <form class="auth-form" novalidate>
          <label>Email<input id="f-email" name="email" type="email" autocomplete="email" value="${esc(email)}" required></label>
          <p class="form-msg"></p>
          <button class="btn primary wide" type="submit">Gửi liên kết</button>
          <button type="button" class="link" data-a="back">← Quay lại đăng nhập</button>
        </form>`);
      const prevAction = this.onAction;
      const prevSubmit = this.onSubmit;
      const done = () => { this.onAction = prevAction; this.onSubmit = prevSubmit; resolve(); };
      this.onAction = (a) => { if (a === 'back') done(); };
      this.onSubmit = async (form) => {
        const em = String(new FormData(form).get('email') || '').trim();
        if (!/^\S+@\S+\.\S+$/.test(em)) return this.message('Hãy nhập email hợp lệ.');
        this.setBusy(form, true, 'Đang gửi...');
        try {
          await auth.sendReset(em);
          this.setBusy(form, false, '');
          this.message('Đã gửi! Mở email và bấm vào liên kết để đặt mật khẩu mới.', 'info');
        } catch (e) { this.setBusy(form, false, ''); this.message(viError(e)); }
      };
    });
  }

  /** Sau khi bấm liên kết trong email "quên mật khẩu" */
  newPassword() {
    return new Promise((resolve) => {
      this.show(`
        <div class="auth-logo">🔒</div>
        <h1>Đặt mật khẩu mới</h1>
        <form class="auth-form" novalidate>
          <label>Mật khẩu mới<input id="f-pw" name="password" type="password" minlength="8" autocomplete="new-password" placeholder="Ít nhất 8 ký tự" required></label>
          <label>Nhập lại<input id="f-pw2" name="password2" type="password" minlength="8" autocomplete="new-password" required></label>
          <p class="form-msg"></p>
          <button class="btn primary wide" type="submit">Lưu mật khẩu</button>
        </form>`);
      this.onSubmit = async (form) => {
        const f = new FormData(form);
        const pw = String(f.get('password') || '');
        if (pw.length < 8) return this.message('Mật khẩu cần ít nhất 8 ký tự.');
        if (pw !== f.get('password2')) return this.message('Hai mật khẩu không giống nhau.');
        this.setBusy(form, true, 'Đang lưu...');
        try { await auth.updatePassword(pw); this.hide(); resolve(true); } catch (e) { this.setBusy(form, false, ''); this.message(viError(e)); }
      };
    });
  }

  /** Tạo / sửa nhân vật. mode: 'setup' | 'edit'. Trả về hồ sơ mới (hoặc null nếu bấm hủy) */
  profileEditor(profile, uid, mode = 'setup') {
    return new Promise((resolve) => {
      const avatar = { ...profile.avatar };
      const swatches = () => Object.entries(AVATAR_PARTS).map(([part, def]) => `
        <div class="swatch-row"><span>${def.label}</span><div>${def.colors.map((c) => `
          <button type="button" class="swatch ${avatar[part] === c ? 'on' : ''}" style="--c:${c}" data-a="pick" data-part="${part}" data-color="${c}" aria-label="${def.label} ${c}"></button>`).join('')}</div></div>`).join('');
      this.show(`
        <h1>${mode === 'setup' ? 'Tạo nhân vật' : 'Đổi tên & avatar'}</h1>
        <div class="avatar-preview">${avatarSVG(avatar, 96)}</div>
        <form class="auth-form" novalidate>
          <label>Tên hiển thị<input id="f-name" name="name" maxlength="20" value="${esc(profile.display_name)}" required></label>
          <div class="swatches">${swatches()}</div>
          <p class="friend">Mã kết bạn của bạn: <b>${esc(profile.friend_code)}</b></p>
          <p class="form-msg"></p>
          <button class="btn primary wide" type="submit">${mode === 'setup' ? 'Bắt đầu chơi' : 'Lưu'}</button>
          ${mode === 'edit' ? '<button type="button" class="link" data-a="cancel">Hủy</button>' : ''}
        </form>`);
      this.onAction = (a, b) => {
        if (a === 'pick') {
          avatar[b.dataset.part] = b.dataset.color;
          this.el.querySelector('.avatar-preview').innerHTML = avatarSVG(avatar, 96);
          this.el.querySelectorAll(`.swatch[data-part="${b.dataset.part}"]`).forEach((s) => s.classList.toggle('on', s === b));
        }
        if (a === 'cancel') { this.hide(); resolve(null); }
      };
      this.onSubmit = async (form) => {
        const name = normalizeName(new FormData(form).get('name'));
        const err = checkDisplayName(name);
        if (err) return this.message(err);
        this.setBusy(form, true, 'Đang lưu...');
        try {
          const p = await auth.updateProfile(uid, { displayName: name === profile.display_name ? undefined : name, avatar, setupDone: true });
          this.hide();
          resolve(p);
        } catch (e) { this.setBusy(form, false, ''); this.message(viError(e)); }
      };
    });
  }

  /** Hai bản save khác nhau (máy này vs cloud): hỏi người chơi giữ bản nào */
  askConflict(local, cloud) {
    return new Promise((resolve) => {
      const card = (s, title, a) => {
        const c = clockOf(s.time.gameMinutes);
        const flowers = Object.values(s.inventory.flowers || {}).reduce((x, y) => x + y, 0);
        return `<div class="save-card">
          <b>${title}</b>
          <ul>
            <li>📅 Ngày ${c.day} trong game</li>
            <li>⭐ Level ${s.player.level} · 💰 ${s.player.coins}</li>
            <li>🌸 Đã thu hoạch ${s.stats.harvested || 0} · trong kho ${flowers}</li>
            <li>🕒 Lưu lúc ${new Date(s.meta.updatedAt).toLocaleString('vi-VN')}</li>
            <li>📱 ${esc(s.meta.device || 'Không rõ thiết bị')}</li>
          </ul>
          <button type="button" class="btn primary wide" data-a="${a}">Dùng bản này</button>
        </div>`;
      };
      this.show(`
        <div class="auth-logo">🔀</div>
        <h1>Có 2 bản tiến độ khác nhau</h1>
        <p class="auth-sub">Bạn đã chơi trên máy khác trong lúc máy này chưa đồng bộ. Hãy chọn bản muốn giữ. Bản còn lại vẫn được sao lưu trên máy này.</p>
        <div class="save-cards">${card(local, 'Trên máy này', 'local')}${card(cloud, 'Trên mạng (cloud)', 'cloud')}</div>`);
      this.onAction = (a) => { if (a === 'local' || a === 'cloud') { this.hide(); resolve(a); } };
    });
  }

  /** Thông báo đơn giản có 1 nút */
  notice(title, text, button = 'Đã hiểu', icon = '🌷') {
    return new Promise((resolve) => {
      this.show(`<div class="auth-logo">${icon}</div><h1>${esc(title)}</h1><p class="auth-sub">${esc(text)}</p>
        <button type="button" class="btn primary wide" data-a="ok">${esc(button)}</button>`);
      this.onAction = (a) => { if (a === 'ok') { this.hide(); resolve(); } };
    });
  }
}
