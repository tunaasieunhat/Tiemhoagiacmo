// Bạn bè: danh sách, tìm bạn, lời mời, hộp quà, sổ lưu bút, tặng quà.
import { FLOWERS } from '../../data/flowers.js';
import { social, GIFT_LIMITS } from '../online/social.js';
import { viError } from '../online/errors.js';
import { isCleanText } from '../online/names.js';
import * as variants from '../systems/variants.js';
import { avatarSVG } from './avatar.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const vdot = (sp, v) => `<i class="vdot" style="--c:${variants.variantData(sp, v).petal}"></i>`;
const TABS = [['friends', '👥 Bạn bè'], ['find', '🔍 Tìm bạn'], ['requests', '📨 Lời mời'], ['gifts', '🎁 Hộp quà'], ['guestbook', '✉️ Lưu bút']];
const ITEM_NAMES = { fertilizer: '🧪 Phân bón', cover: '⛺ Bạt che', medicine: '💊 Thuốc' };
const timeAgo = (iso) => {
  const m = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (m < 1) return 'vừa xong';
  if (m < 60) return `${m} phút trước`;
  if (m < 1440) return `${Math.round(m / 60)} giờ trước`;
  return `${Math.round(m / 1440)} ngày trước`;
};

export class FriendsPanel {
  constructor(hud) {
    this.hud = hud;
    this.game = hud.game;
    this.tab = 'friends';
    this.results = null;
    this.query = '';
    this.received = null;
    this.guestbook = null;
    this.gift = null; // { friend, kind, key, qty, message }
  }

  get mgr() { return this.game.account?.social; }
  get ov() { return this.mgr?.overview; }

  open(tab) {
    if (tab) this.tab = tab;
    this.gift = null;
    this.render();
    if (this.mgr) this.mgr.poll().then(() => { if (this.hud.modal === 'friends') this.render(true); });
    if (this.tab === 'guestbook') this.loadGuestbook();
  }

  render(keepScroll = false) {
    const m = this.hud.root.querySelector('.modal');
    const top = keepScroll && this.hud.modal === 'friends' ? m?.scrollTop || 0 : 0;
    const acc = this.game.account || {};
    let body;
    if (!acc.configured) {
      body = `<div class="empty-shop">🌐<p>Tính năng bạn bè cần kết nối máy chủ (Supabase). Xem hướng dẫn trong <b>docs/HUONG_DAN_SUPABASE.md</b> rồi gửi địa chỉ & khóa công khai cho người làm game.</p></div>`;
    } else if (!acc.session) {
      body = `<div class="empty-shop">🔐<p>Hãy đăng nhập để kết bạn, thăm nông trại, tưới giúp và tặng quà.</p></div><button class="btn primary wide" data-act="login">Đăng nhập / Đăng ký</button>`;
    } else if (this.gift) body = this.giftHtml();
    else body = { friends: this.friendsHtml, find: this.findHtml, requests: this.requestsHtml, gifts: this.giftsHtml, guestbook: this.guestbookHtml }[this.tab].call(this);
    const tabs = acc.session && !this.gift ? `<div class="mk-tabs">${TABS.map(([id, label]) => {
      const n = id === 'requests' ? this.ov?.incoming?.length : id === 'gifts' ? this.ov?.gifts_waiting : id === 'guestbook' && (this.ov?.latest_message || 0) > (this.mgr?.seenMessage || 0) ? 1 : 0;
      return `<button class="${id === this.tab ? 'on' : ''}" data-fr="tab" data-id="${id}">${label}${n ? ` <span class="pill">${n}</span>` : ''}</button>`;
    }).join('')}</div>` : '';
    this.hud.openModal('friends', `<h2>👥 Bạn bè</h2>${tabs}<div class="mk-body">${body}</div>`, 'wide');
    if (top) this.hud.root.querySelector('.modal').scrollTop = top;
  }

  person(p, extra = '', buttons = '') {
    return `<div class="mk-item friend"><div class="mk-icon">${avatarSVG(p.avatar || {}, 44)}</div>
      <div class="mk-info"><b>${esc(p.name)}</b>${extra}</div><div class="mk-buy fr-btns">${buttons}</div></div>`;
  }

  friendsHtml() {
    const o = this.ov;
    if (!o) return '<p class="muted">Đang tải...</p>';
    const list = o.friends || [];
    if (!list.length) return `<div class="empty-shop">🌱<p>Chưa có bạn bè nào. Vào mục 🔍 Tìm bạn, hoặc gửi mã kết bạn của bạn cho người quen!</p></div>`;
    return `<p class="muted small">Hôm nay: đã tưới giúp ${o.helps_today}/15 · đã tặng ${o.gifts_today}/5 món quà</p>` + list.map((f) => this.person(f,
      `<small>⭐ Cấp ${f.level || 1}${f.tier ? ` · ${esc(f.tier)}` : ''}</small><small>${f.seen_at ? `Online ${timeAgo(f.seen_at)}` : 'Chưa từng online'}</small>`,
      `<button class="btn primary" data-fr="visit" data-id="${f.id}">🏡 Thăm</button>
       <button class="btn ${f.helped_today ? 'disabled' : ''}" data-fr="water" data-id="${f.id}" title="Tưới giúp">💧</button>
       <button class="btn ${f.gifted_today ? 'disabled' : ''}" data-fr="gift" data-id="${f.id}" title="Tặng quà">🎁</button>
       <button class="btn sm-x" data-fr="remove" data-id="${f.id}" title="Xóa bạn">✕</button>`)).join('');
  }

  findHtml() {
    const code = this.game.account.profile?.friend_code || '';
    const res = this.results == null ? '' : this.results.length ? this.results.map((p) => {
      const st = { friend: '<span class="maxed">✔ Bạn bè</span>', sent: '<span class="maxed">Đã gửi lời mời</span>', received: `<button class="btn primary" data-fr="add" data-id="${p.id}">Đồng ý kết bạn</button>` }[p.status]
        || `<button class="btn primary" data-fr="add" data-id="${p.id}">➕ Kết bạn</button>`;
      return this.person(p, `<small>Mã: ${esc(p.code)}</small>`, st);
    }).join('') : '<p class="muted">Không tìm thấy ai. Thử tên khác hoặc nhập đúng mã kết bạn 8 ký tự.</p>';
    return `<div class="my-code">Mã kết bạn của bạn: <b>${esc(code)}</b> <button class="link" data-act="copy-code">Chép</button></div>
      <form class="search-row" data-fr-form="search"><input id="fr-q" name="q" maxlength="20" placeholder="Nhập tên hoặc mã kết bạn" value="${esc(this.query)}"><button class="btn primary" type="submit">Tìm</button></form>
      <div class="mk-body">${res}</div>`;
  }

  requestsHtml() {
    const o = this.ov;
    if (!o) return '<p class="muted">Đang tải...</p>';
    const inc = (o.incoming || []).map((r) => this.person(r, `<small>Mã: ${esc(r.code)}</small>`,
      `<button class="btn primary" data-fr="accept" data-id="${r.id}">Đồng ý</button><button class="btn" data-fr="decline" data-id="${r.id}">Từ chối</button>`)).join('');
    const out = (o.outgoing || []).map((r) => this.person(r, '<small>Đang chờ đồng ý...</small>', '')).join('');
    return `<h3>Lời mời gửi đến bạn</h3>${inc || '<p class="muted small">Không có lời mời mới.</p>'}<h3>Bạn đã gửi</h3>${out || '<p class="muted small">Không có.</p>'}`;
  }

  giftsHtml() {
    const waiting = this.ov?.gifts_waiting || 0;
    const rec = this.received?.length ? `<h3>Vừa nhận</h3>${this.received.map((g) => `<div class="mk-item"><div class="mk-icon">🎁</div><div class="mk-info"><b>${esc(g.from || 'Một người bạn')}</b><small>${esc(g.text)}</small>${g.message ? `<small class="gift-msg">“${esc(g.message)}”</small>` : ''}</div></div>`).join('')}` : '';
    return `<div class="empty-shop">🎁<p>${waiting ? `Bạn có <b>${waiting}</b> món quà đang chờ mở!` : 'Chưa có quà mới.'}</p></div>
      ${waiting ? '<button class="btn primary wide" data-fr="claim">🎉 Mở hộp quà</button>' : ''}${rec}`;
  }

  guestbookHtml() {
    if (this.guestbook == null) return '<p class="muted">Đang tải...</p>';
    if (!this.guestbook.length) return '<div class="empty-shop">✉️<p>Chưa có lời nhắn nào. Bạn bè ghé thăm có thể để lại lời nhắn cho bạn.</p></div>';
    return `<p class="muted small">Lời nhắn bạn bè để lại trên nông trại của bạn.</p>${messagesHtml(this.guestbook, this.game.account.session.user.id, true)}`;
  }

  async loadGuestbook() {
    try { this.guestbook = await social.myGuestbook(); } catch (e) { this.guestbook = []; this.game.toast(viError(e), 'warn'); }
    this.mgr?.markMessagesSeen();
    if (this.hud.modal === 'friends' && this.tab === 'guestbook') this.render(true);
  }

  // ---------- tặng quà ----------
  giftHtml() {
    const g = this.gift;
    const s = this.game.save;
    const inv = s.inventory;
    let options = [];
    if (g.kind === 'flower') options = Object.entries(inv.flowers).filter(([, n]) => n > 0).map(([k, n]) => { const f = variants.parseFlowerKey(k); return { key: k, n, label: `${FLOWERS[f.species].icon}${vdot(f.species, f.variant)} ${esc(variants.variantName(f.species, f.variant))} <i class="stars">${'★'.repeat(f.q)}</i>` }; });
    if (g.kind === 'seed') options = Object.entries(inv.seeds).filter(([, n]) => n > 0).map(([k, n]) => { const v = variants.parseVkey(k); return { key: k, n, label: `${FLOWERS[v.species].icon}${vdot(v.species, v.variant)} Hạt ${esc(variants.variantName(v.species, v.variant))}` }; });
    if (g.kind === 'item') options = Object.keys(ITEM_NAMES).filter((k) => inv.items[k] > 0).map((k) => ({ key: k, n: inv.items[k], label: ITEM_NAMES[k] }));
    const max = g.kind === 'coins' ? Math.min(GIFT_LIMITS.coins, s.player.coins) : Math.min(GIFT_LIMITS[g.kind], options.find((o) => o.key === g.key)?.n || 0);
    if (g.qty > max) g.qty = Math.max(1, max);
    const kinds = [['flower', '🌸 Hoa'], ['seed', '🌱 Hạt'], ['item', '🧪 Vật phẩm'], ['coins', '💰 Tiền']];
    return `<div class="comp-head"><button class="round sm" data-fr="gift-back" aria-label="Quay lại">←</button><div class="cust-av">${avatarSVG(g.friend.avatar || {}, 44)}</div><div><b>Tặng quà cho ${esc(g.friend.name)}</b><p class="muted small">Mỗi ngày tặng mỗi bạn 1 món, tối đa 5 món.</p></div></div>
      <div class="mk-tabs">${kinds.map(([k, l]) => `<button class="${g.kind === k ? 'on' : ''}" data-fr="gift-kind" data-id="${k}">${l}</button>`).join('')}</div>
      ${g.kind === 'coins' ? `<p class="muted small">Bạn có ${s.player.coins} 💰. Tặng tối đa ${GIFT_LIMITS.coins} 💰 mỗi lần.</p>`
        : options.length ? `<div class="lab-list">${options.map((o) => `<button class="lab-item ${g.key === o.key ? 'on' : ''}" data-fr="gift-pick" data-id="${esc(o.key)}"><small>${o.label}</small><b>×${o.n}</b></button>`).join('')}</div>`
          : '<p class="muted">Bạn chưa có món nào loại này.</p>'}
      ${g.kind === 'coins' || g.key ? `<div class="qty-row"><span>Số lượng</span><button class="round sm" data-fr="gift-qty" data-d="${g.kind === 'coins' ? -50 : -1}">−</button><b>${g.qty}</b><button class="round sm" data-fr="gift-qty" data-d="${g.kind === 'coins' ? 50 : 1}">+</button><small class="muted">tối đa ${max}</small></div>` : ''}
      <label class="msg-label">Lời chúc (không bắt buộc)<input id="fr-gmsg" maxlength="100" value="${esc(g.message || '')}" placeholder="Chúc bạn vườn hoa luôn rực rỡ!"></label>
      <button class="btn primary wide ${(g.kind === 'coins' ? max >= 1 : g.key && max >= 1) ? '' : 'disabled'}" data-fr="gift-send">🎁 Gửi quà</button>`;
  }

  // ---------- xử lý ----------
  async onAction(act, el) {
    const g = this.game;
    const mgr = this.mgr;
    const id = el.dataset.id;
    const friend = () => (this.ov?.friends || []).find((f) => f.id === id) || g.visit?.profile;
    switch (act) {
      case 'tab':
        this.tab = id; this.render();
        if (id === 'guestbook') this.loadGuestbook();
        break;
      case 'visit':
        this.hud.closeModal();
        await g.enterVisit(id);
        break;
      case 'water':
        if (el.classList.contains('disabled')) { g.toast('Hôm nay đã tưới giúp người này rồi', 'info'); return; }
        el.classList.add('disabled');
        if (await g.helpWaterFriend(id)) this.render(true);
        break;
      case 'gift':
        if (el.classList.contains('disabled')) { g.toast('Hôm nay đã tặng quà người này rồi', 'info'); return; }
        this.openGift(friend());
        break;
      case 'remove':
        if (!el.dataset.armed) { el.dataset.armed = '1'; el.textContent = 'Xóa?'; setTimeout(() => { if (el.isConnected) { delete el.dataset.armed; el.textContent = '✕'; } }, 3000); return; }
        await mgr.act(() => social.remove(id), 'Đã xóa bạn');
        this.render(true);
        break;
      case 'add':
        el.classList.add('disabled');
        if (await mgr.act(() => social.request(id))) {
          const r = this.results?.find((p) => p.id === id);
          if (r) r.status = r.status === 'received' ? 'friend' : 'sent';
          g.toast(r?.status === 'friend' ? '🎉 Hai bạn đã là bạn bè!' : '📨 Đã gửi lời mời kết bạn', 'good');
          this.render(true);
        }
        break;
      case 'accept': case 'decline':
        await mgr.act(() => social.respond(+id, act === 'accept'), act === 'accept' ? '🎉 Đã kết bạn!' : 'Đã từ chối lời mời');
        await mgr.poll();
        this.render(true);
        break;
      case 'claim': {
        el.classList.add('disabled');
        try {
          const list = await social.claimGifts();
          const lines = g.receiveGifts(list);
          this.received = list.map((x, i) => ({ ...x, text: lines[i] || '' }));
          if (list.length) g.toast(`🎁 Đã nhận ${list.length} món quà!`, 'good');
          if (mgr.overview) mgr.overview.gifts_waiting = 0;
        } catch (e) { g.toast(viError(e), 'warn'); }
        this.render(true);
        break;
      }
      case 'del-msg':
        await mgr.act(() => social.deleteMessage(+id), 'Đã xóa lời nhắn');
        if (this.tab === 'guestbook' && this.hud.modal === 'friends') this.loadGuestbook();
        else g.refreshVisit();
        break;
      case 'gift-back': this.gift = null; this.render(); break;
      case 'gift-kind': this.gift.kind = id; this.gift.key = null; this.gift.qty = id === 'coins' ? 50 : 1; this.render(); break;
      case 'gift-pick': this.gift.key = id; this.gift.qty = 1; this.render(true); break;
      case 'gift-qty': this.gift.qty = Math.max(1, this.gift.qty + +el.dataset.d); this.saveMsg(); this.render(true); break;
      case 'gift-send': {
        this.saveMsg();
        const gf = this.gift;
        if (el.classList.contains('disabled')) { g.toast('Hãy chọn món quà', 'warn'); return; }
        if (gf.message && !isCleanText(gf.message)) { g.toast('Lời chúc có từ ngữ không phù hợp', 'warn'); return; }
        el.classList.add('disabled');
        el.textContent = 'Đang gửi...';
        const ok = await g.sendGiftTo(gf.friend.id, gf.kind, gf.kind === 'coins' ? null : gf.key, gf.qty, gf.message);
        if (ok) { this.gift = null; this.hud.closeModal(); } else this.render(true);
        break;
      }
      default:
    }
  }

  saveMsg() {
    const i = this.hud.root.querySelector('#fr-gmsg');
    if (i && this.gift) this.gift.message = i.value.replace(/\s+/g, ' ').trim().slice(0, 100);
  }

  openGift(friend) {
    if (!friend) return;
    this.gift = { friend, kind: 'flower', key: null, qty: 1, message: '' };
    this.render();
  }

  async onSubmit(form) {
    if (form.dataset.frForm === 'search') {
      this.query = String(new FormData(form).get('q') || '').trim();
      if (this.query.length < 2) { this.game.toast('Nhập ít nhất 2 ký tự', 'warn'); return; }
      try { this.results = await social.search(this.query); } catch (e) { this.game.toast(viError(e), 'warn'); this.results = []; }
      this.render(true);
    }
  }
}

/** Danh sách lời nhắn (dùng chung cho sổ lưu bút của mình & khi thăm nhà bạn) */
export function messagesHtml(list, myId, isOwner) {
  return `<div class="msgs">${list.map((m) => `<div class="msg">
    <div class="msg-av">${avatarSVG(m.avatar || {}, 34)}</div>
    <div class="msg-body"><b>${esc(m.author || 'Ẩn danh')}</b> <small class="muted">${timeAgo(m.at)}</small><p>${esc(m.text)}</p></div>
    ${isOwner || m.author_id === myId ? `<button class="round sm" data-fr="del-msg" data-id="${m.id}" aria-label="Xóa lời nhắn">🗑️</button>` : ''}
  </div>`).join('')}</div>`;
}
