// Quầy bán hoa: danh sách khách, chọn hoa / gói bó, giao hoa.
import { FLOWERS } from '../../data/flowers.js';
import { SHOP } from '../../data/shop.js';
import { PAPERS, RIBBONS } from '../../data/wrapping.js';
import * as shop from '../systems/shop.js';
import { avatarSVG } from './avatar.js';
import { bouquetSVG } from './bouquetPreview.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const stars = (q) => '★'.repeat(q);
const MOOD = { perfect: ['😍', 'Cực kỳ hài lòng'], good: ['😊', 'Hài lòng'], ok: ['🙂', 'Tạm được'], bad: ['😕', 'Chưa ưng'] };

export class ShopPanel {
  constructor(hud) {
    this.hud = hud;
    this.game = hud.game;
    this.view = 'list';
    this.customerId = null;
    this.sel = null;
    this.listKey = '';
  }

  get save() { return this.game.save; }
  customer() { return this.save.shop.customers.find((c) => c.id === this.customerId); }

  open(customerId = null) {
    if (customerId != null && this.save.shop.customers.some((c) => c.id === customerId)) this.compose(customerId);
    else { this.view = 'list'; this.render(); }
  }

  compose(id) {
    this.view = 'compose';
    this.customerId = id;
    const c = this.customer();
    this.sel = { items: {}, paper: c.request.type === 'bouquet' ? 'kraft' : null, ribbon: c.request.type === 'bouquet' ? 'twine' : null };
    this.render();
  }

  render() {
    const html = this.view === 'compose' && this.customer() ? this.composeHtml() : this.listHtml();
    if (this.view === 'compose' && !this.customer()) this.view = 'list';
    this.hud.openModal('shop', html, 'wide');
    this.listKey = this.save.shop.customers.map((c) => c.id).join(',');
  }

  /** Gọi định kỳ khi đang mở: cập nhật thanh kiên nhẫn; vẽ lại nếu danh sách khách đổi */
  refresh() {
    const key = this.save.shop.customers.map((c) => c.id).join(',');
    if (key !== this.listKey) {
      if (this.view === 'compose' && !this.customer()) {
        this.view = 'list';
        this.hud.toast('Khách đã rời đi mất rồi...', 'warn');
      }
      if (this.view === 'list') this.render(); else this.listKey = key;
      return;
    }
    const now = this.save.time.gameMinutes;
    this.hud.root.querySelectorAll('[data-pbar]').forEach((el) => {
      const c = this.save.shop.customers.find((x) => x.id === +el.dataset.pbar);
      if (!c) return;
      const f = Math.max(0, 1 - (now - c.arrivedAt) / c.patience);
      el.style.width = `${f * 100}%`;
      el.style.background = f > 0.5 ? '#7cc27f' : f > 0.25 ? '#f6c84a' : '#ec6b6b';
    });
  }

  // ---------------- danh sách khách ----------------
  listHtml() {
    const s = this.save;
    const tier = shop.tierInfo(s.player.reputation);
    const hour = this.game.clock.hourFloat;
    const openNow = shop.isOpenHour(hour);
    const now = s.time.gameMinutes;
    let status;
    if (!s.shop.open) status = '🔒 Tiệm đang tạm đóng — không có khách mới';
    else if (!openNow) status = `🌙 Ngoài giờ mở cửa (${SHOP.openHour}:00 – ${SHOP.closeHour}:00)`;
    else if (!s.stats.harvested) status = '🌱 Thu hoạch bông hoa đầu tiên để đón khách nhé!';
    else status = `🟢 Đang mở cửa · ${SHOP.openHour}:00 – ${SHOP.closeHour}:00`;

    const cards = s.shop.customers.map((c) => {
      const npc = shop.npcOf(c.npc);
      const f = Math.max(0, 1 - (now - c.arrivedAt) / c.patience);
      const typeLabel = { single: '1 cành', multi: 'Nhiều cành', bouquet: 'Bó hoa' }[c.request.type];
      return `<div class="cust">
        <div class="cust-av">${avatarSVG(npc.look, 52)}</div>
        <div class="cust-body">
          <div class="cust-top"><b>${esc(npc.name)}</b><span class="tag">${typeLabel}</span><span class="reward">~${shop.estimateReward(c.request)} 💰</span></div>
          <p>“${esc(shop.requestText(c.request, c.npc))}”</p>
          <div class="track sm"><i data-pbar="${c.id}" style="width:${f * 100}%;background:${f > 0.5 ? '#7cc27f' : f > 0.25 ? '#f6c84a' : '#ec6b6b'}"></i></div>
          <div class="cust-btns">
            <button class="btn primary" data-sp="compose" data-id="${c.id}">${c.request.type === 'bouquet' ? '💐 Gói hoa' : '🌸 Chọn hoa'}</button>
            <button class="btn" data-sp="decline" data-id="${c.id}">Từ chối</button>
          </div>
        </div></div>`;
    }).join('') || `<div class="empty-shop">🪴<p>Chưa có khách nào. ${s.stats.harvested ? 'Khách sẽ ghé trong giờ mở cửa, hãy chuẩn bị sẵn hoa nhé!' : 'Hãy trồng và thu hoạch hoa trước đã.'}</p></div>`;

    const stock = Object.entries(s.inventory.flowers).filter(([, n]) => n > 0)
      .map(([k, n]) => { const [id, q] = k.split('|'); return `<span class="chip-s">${FLOWERS[id].icon} ${stars(+q)} ×${n}</span>`; }).join('') || '<span class="muted small">Kho trống</span>';

    return `
      <h2>🏪 Tiệm Hoa Giấc Mơ</h2>
      <div class="rep-card">
        <span class="rep-icon">${tier.icon}</span>
        <div class="rep-info"><b>${tier.name}</b>
          <div class="track sm"><i style="width:${Math.round(tier.progress * 100)}%;background:#f6a6b9"></i></div>
          <small>💗 ${s.player.reputation} uy tín${tier.next ? ` · cần ${tier.next.min} để lên "${tier.next.name}"` : ' · bậc cao nhất!'}</small></div>
        <div class="coins">💰 ${s.player.coins}</div>
      </div>
      <p class="shop-status">${status}</p>
      <div class="cust-list">${cards}</div>
      <h3>Hoa trong kho</h3><div class="chips">${stock}</div>
      <div class="row-btns" style="margin-top:12px">
        <button class="btn" data-sp="toggle-open">${s.shop.open ? '🔒 Tạm đóng cửa' : '🔓 Mở cửa đón khách'}</button>
      </div>
      <p class="muted small">Uy tín cao: khách đến đông hơn, kiên nhẫn hơn, hay cho tiền bo và đặt bó lớn hơn. Để khách chờ quá lâu hoặc từ chối sẽ mất uy tín.</p>`;
  }

  // ---------------- chọn hoa / gói bó ----------------
  composeHtml() {
    const c = this.customer();
    const req = c.request;
    const npc = shop.npcOf(c.npc);
    const s = this.save;
    const ev = shop.evaluateDelivery(req, this.sel);
    const items = Object.entries(this.sel.items).filter(([, n]) => n > 0).map(([k, n]) => ({ flower: k.split('|')[0], n }));
    const wanted = req.type === 'bouquet' ? req.mustInclude?.flower : req.flower;

    const stacks = Object.entries(s.inventory.flowers).filter(([, n]) => n > 0).map(([k, n]) => {
      const [id, q] = k.split('|');
      return { k, id, q: +q, n };
    }).sort((a, b) => (b.id === wanted) - (a.id === wanted) || a.id.localeCompare(b.id) || b.q - a.q);
    const rows = stacks.map((st) => {
      const chosen = this.sel.items[st.k] || 0;
      const low = st.q < req.minQuality;
      return `<div class="stack ${chosen ? 'on' : ''} ${low ? 'low' : ''}">
        <span class="si">${FLOWERS[st.id].icon}</span>
        <span class="sn">${FLOWERS[st.id].name} <i class="stars">${stars(st.q)}</i><small>có ${st.n}${low ? ' · thấp hơn yêu cầu' : ''}</small></span>
        <span class="step"><button class="round sm" data-sp="dec" data-k="${st.k}" aria-label="Bớt">−</button><b>${chosen}</b><button class="round sm" data-sp="inc" data-k="${st.k}" aria-label="Thêm">+</button></span>
      </div>`;
    }).join('') || '<p class="muted">Kho chưa có hoa. Hãy ra nông trại thu hoạch nhé!</p>';

    let wraps = '';
    if (req.type === 'bouquet') {
      const sw = (dict, inv, kind) => Object.entries(dict).map(([id, w]) => {
        const have = w.free ? '∞' : inv?.[id] || 0;
        const off = !w.free && !(inv?.[id] > 0);
        return `<button class="wrap ${this.sel[kind] === id ? 'on' : ''} ${off ? 'disabled' : ''}" data-sp="${kind}" data-id="${id}" ${off ? 'aria-disabled="true"' : ''}>
          <span class="dot" style="--c:${w.color}"></span><span>${w.name}</span><small>${have}</small></button>`;
      }).join('');
      wraps = `<h3>Giấy gói</h3><div class="wraps">${sw(PAPERS, s.inventory.papers, 'paper')}</div>
        <h3>Ruy băng</h3><div class="wraps">${sw(RIBBONS, s.inventory.ribbons, 'ribbon')}</div>`;
    }

    const checks = ev.checks.map((x) => `<li class="${x.ok ? 'ok' : 'no'}">${x.ok ? '✅' : '⬜'} ${esc(x.text)}</li>`).join('');
    const [mIcon, mText] = MOOD[ev.mood];
    const total = items.reduce((a, b) => a + b.n, 0);
    return `
      <div class="comp-head">
        <button class="round sm" data-sp="back" aria-label="Quay lại">←</button>
        <div class="cust-av">${avatarSVG(npc.look, 44)}</div>
        <div><b>${esc(npc.name)}</b><p>“${esc(shop.requestText(req, c.npc))}”</p>
          <div class="track sm"><i data-pbar="${c.id}" style="width:100%"></i></div></div>
      </div>
      <div class="comp-main">
        <div class="preview">${bouquetSVG({ items, paper: this.sel.paper, ribbon: this.sel.ribbon, type: req.type }, 140)}</div>
        <div class="comp-info">
          <ul class="checks">${checks}</ul>
          ${total ? `<div class="estimate"><span class="mood">${mIcon}</span><div><b>${mText}</b> <small>(${ev.score}/100)</small><br><small>Nhận ~${ev.price} 💰 · ${ev.repDelta >= 0 ? '+' : ''}${ev.repDelta} 💗</small></div></div>` : ''}
        </div>
      </div>
      <h3>Chọn hoa</h3><div class="stacks">${rows}</div>
      ${wraps}
      <div class="comp-foot">
        <button class="btn" data-sp="auto">✨ Tự chọn</button>
        <button class="btn primary ${ev.ok ? '' : 'disabled'}" data-sp="deliver">${req.type === 'bouquet' ? '💐 Gói & giao' : '🌸 Giao hoa'}</button>
      </div>
      ${req.type === 'bouquet' ? '<p class="muted small">Mẹo: giấy gói, ruy băng và hoa hợp tông khách thích, phối 2 loài hoa trở lên sẽ được điểm cao hơn.</p>' : ''}`;
  }

  // ---------------- xử lý nút ----------------
  onAction(act, el) {
    const g = this.game;
    const s = this.save;
    switch (act) {
      case 'compose': this.compose(+el.dataset.id); break;
      case 'back': this.view = 'list'; this.render(); break;
      case 'decline':
        if (!el.dataset.armed) {
          el.dataset.armed = '1';
          el.textContent = 'Chắc chưa? (−1 💗)';
          setTimeout(() => { if (el.isConnected) { delete el.dataset.armed; el.textContent = 'Từ chối'; } }, 3000);
          return;
        }
        g.declineCustomer(+el.dataset.id);
        this.render();
        break;
      case 'inc': case 'dec': {
        const k = el.dataset.k;
        const have = s.inventory.flowers[k] || 0;
        const cur = this.sel.items[k] || 0;
        const req = this.customer().request;
        const maxTotal = req.type === 'bouquet' ? req.max : req.count;
        const total = Object.values(this.sel.items).reduce((a, b) => a + b, 0);
        if (act === 'inc') {
          if (cur >= have) { this.hud.toast('Không còn hoa loại này trong kho', 'warn'); return; }
          if (total >= maxTotal) { this.hud.toast(`Khách chỉ cần tối đa ${maxTotal} cành`, 'warn'); return; }
          this.sel.items[k] = cur + 1;
        } else if (cur > 0) this.sel.items[k] = cur - 1;
        this.renderKeepScroll();
        break;
      }
      case 'paper': case 'ribbon': {
        const dict = act === 'paper' ? PAPERS : RIBBONS;
        const inv = act === 'paper' ? s.inventory.papers : s.inventory.ribbons;
        const id = el.dataset.id;
        if (!dict[id].free && !(inv[id] > 0)) { this.hud.toast(`Hết ${dict[id].name} — sẽ mua được ở Khu Chợ (GĐ4)`, 'warn'); return; }
        this.sel[act] = id;
        this.renderKeepScroll();
        break;
      }
      case 'auto': {
        const req = this.customer().request;
        const p = shop.autoPick(req, s.inventory);
        this.sel = { items: p.items, paper: p.paper ?? this.sel.paper, ribbon: p.ribbon ?? this.sel.ribbon };
        if (!Object.keys(p.items).length) this.hud.toast('Kho chưa có hoa phù hợp yêu cầu này', 'warn');
        this.renderKeepScroll();
        break;
      }
      case 'deliver': {
        const res = g.deliverToCustomer(this.customerId, this.sel);
        if (!res.ok) { this.hud.toast(res.msg, 'warn'); return; }
        this.view = 'list';
        this.render();
        break;
      }
      case 'toggle-open':
        s.shop.open = !s.shop.open;
        g.saveMgr.markDirty();
        this.hud.toast(s.shop.open ? '🔓 Tiệm đã mở cửa đón khách' : '🔒 Tiệm tạm đóng cửa', 'info');
        this.render();
        break;
      default:
    }
  }

  renderKeepScroll() {
    const m = this.hud.root.querySelector('.modal');
    const top = m?.scrollTop || 0;
    this.render();
    const m2 = this.hud.root.querySelector('.modal');
    if (m2) m2.scrollTop = top;
  }
}
