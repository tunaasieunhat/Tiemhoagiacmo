// 🎀 Bảng Phong cách (GĐ26): tủ đồ · cửa hàng trang phục · thú cưng · trứng & ổ ấp
import { WARDROBE, SLOTS, HAIR_COLORS } from '../../data/wardrobe.js';
import { PET_SPECIES, PET_RARITY, EGGS, PET_RULES } from '../../data/pets.js';
import * as wardrobe from '../systems/wardrobe.js';
import * as petsSys from '../systems/pets.js';
import { avatarSVG } from './avatar.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = (n) => Math.round(n).toLocaleString('vi-VN');
const bar = (v, max, color) => `<div class="track sm"><i style="width:${Math.max(0, Math.min(100, (v / Math.max(1, max)) * 100))}%;background:${color}"></i></div>`;
const SRC = { shop: '🛍️ Cửa hàng', fun: '🎡 Đổi Xu Vui ở Khu Vui Chơi', pass: '📖 Sổ thưởng mùa', checkin: '📅 Quà điểm danh', story: '📜 Cốt truyện' };
const TABS = [
  { id: 'wear', label: '👗 Tủ đồ' },
  { id: 'shop', label: '🛍️ Cửa hàng' },
  { id: 'pets', label: '🐾 Thú cưng' },
  { id: 'eggs', label: '🥚 Trứng' },
];

export class StylePanel {
  constructor(hud) {
    this.hud = hud;
    this.game = hud.game;
    this.tab = 'wear';
    this.slot = 'top';
    this.renaming = null;
    hud.game.emitter.on('style', (e) => {
      if (e?.tab) { this.open(e.tab); return; }
      if (this.hud.modal === 'style') this.render(true);
    });
  }
  get save() { return this.game.save; }

  open(tab = null) { if (tab) this.tab = tab; this.render(); }

  render(keep = false) {
    const top = keep ? this.hud.scrollBox()?.scrollTop || 0 : 0;
    const s = this.save;
    const head = `<div class="mk-wallet"><span>💰 <b>${money(s.player.coins)}</b></span><span>🐾 <b>${petsSys.PS(s).list.length}</b></span><span>👗 <b>${wardrobe.ownedCount(s)}/${wardrobe.ITEM_IDS.length}</b></span></div>`;
    const tabs = `<div class="mk-tabs" role="tablist">${TABS.map((t) => `<button class="${t.id === this.tab ? 'on' : ''}" data-sy="tab" data-id="${t.id}" role="tab">${t.label}</button>`).join('')}</div>`;
    const body = { wear: () => this.wear(), shop: () => this.shop(), pets: () => this.pets(), eggs: () => this.eggs() }[this.tab]();
    this.hud.openModal('style', `<h2>🎀 Phong cách</h2>${head}${tabs}<div class="mk-body sy-body">${body}</div>`, 'wide');
    if (keep) { const box = this.hud.scrollBox(); if (box) box.scrollTop = top; }
  }

  // ---------------- 👗 tủ đồ ----------------
  wear() {
    const s = this.save, look = wardrobe.lookOf(s);
    const slots = Object.entries(SLOTS).map(([id, S]) => `<button class="sy-slot ${id === this.slot ? 'on' : ''}" data-sy="slot" data-id="${id}">${S.icon} ${esc(S.name)}</button>`).join('');
    const items = Object.entries(WARDROBE).filter(([id, it]) => it.slot === this.slot && wardrobe.owns(s, id)).map(([id, it]) => {
      const on = wardrobe.wearing(s, it.slot) === id;
      return `<button class="sy-item ${on ? 'on' : ''}" data-sy="wear" data-id="${id}"><span class="sy-ic">${it.icon}</span><b>${esc(it.name)}</b>${on ? '<i>Đang mặc</i>' : ''}</button>`;
    }).join('');
    const hair = this.slot === 'hair' ? `<div class="sy-colors"><span>Màu tóc:</span>${HAIR_COLORS.map((c) => `<button class="sy-color ${look.hair === c ? 'on' : ''}" style="--c:${c}" data-sy="hair" data-id="${c}" aria-label="Màu tóc ${c}"></button>`).join('')}</div>` : '';
    const more = Object.values(WARDROBE).filter((it) => it.slot === this.slot).length - Object.entries(WARDROBE).filter(([id, it]) => it.slot === this.slot && wardrobe.owns(s, id)).length;
    return `<div class="sy-wear"><div class="sy-preview">${avatarSVG(look, 140)}<small>Nhân vật trong game mặc đúng như vậy</small></div>
      <div class="sy-right"><div class="sy-slots">${slots}</div>${hair}<div class="sy-grid">${items}</div>
      ${more ? `<p class="muted small">Còn ${more} món ${esc(SLOTS[this.slot].name.toLowerCase())} chưa có — xem thẻ 🛍️ Cửa hàng.</p>` : ''}</div></div>`;
  }

  shop() {
    const s = this.save;
    const rows = Object.entries(SLOTS).map(([slot, S]) => {
      const list = Object.entries(WARDROBE).filter(([id, it]) => it.slot === slot && !wardrobe.owns(s, id));
      if (!list.length) return '';
      return `<h3>${S.icon} ${esc(S.name)}</h3><div class="sy-grid">${list.map(([id, it]) => it.src === 'shop'
        ? `<button class="sy-item buy ${s.player.coins >= it.price ? '' : 'poor'}" data-sy="buy" data-id="${id}"><span class="sy-ic">${it.icon}</span><b>${esc(it.name)}</b><i>${money(it.price)} 💰</i></button>`
        : `<div class="sy-item locked"><span class="sy-ic">${it.icon}</span><b>${esc(it.name)}</b><i>${SRC[it.src]}${it.cost ? ` · ${it.cost} 🪙` : ''}</i></div>`).join('')}</div>`;
    }).join('');
    return rows || '<p class="muted">Bạn đã có đủ tất cả trang phục! 🎉</p>';
  }

  // ---------------- 🐾 thú cưng ----------------
  pets() {
    const g = this.game, s = this.save, P = petsSys.PS(s);
    if (s.player.level < PET_RULES.unlockLevel) return `<p class="muted">🔒 Thú cưng mở ở cấp ${PET_RULES.unlockLevel}.</p>`;
    let head = '';
    if (!P.starter) head = `<div class="sy-starter"><span>🥚</span><div><b>Bà Tư gửi bạn một quả trứng!</b><small>Ấp ở ổ trước nhà, 1 ngày game là nở.</small></div><button class="btn primary" data-sy="starter">Nhận trứng</button></div>`;
    if (!P.list.length) return `${head}<p class="muted">Chưa có thú cưng. Ấp trứng ở thẻ 🥚 Trứng nhé. Trứng còn rơi ra khi câu cá, hái nguyên liệu, mở gói Vận May, đổi ở Khu Vui Chơi, Sổ thưởng mùa và quà điểm danh.</p>`;
    const cards = P.list.map((p) => {
      const sp = PET_SPECIES[p.sp], rar = PET_RARITY[sp.rarity];
      const skills = Object.values(PET_RULES.skills).map((k) => `<span class="sy-skill ${p.lvl >= k.level ? 'on' : ''}" title="Cấp ${k.level}">${k.icon} ${esc(k.name)}${p.lvl >= k.level ? '' : ` (cấp ${k.level})`}</span>`).join('');
      const fed = p.feedDay === g.today, patted = p.petDay === g.today;
      const nameRow = this.renaming === p.id
        ? `<span class="sy-rename"><input maxlength="12" value="${esc(p.name)}" data-pet-name="${p.id}" aria-label="Tên mới"><button class="btn sm primary" data-sy="rename-ok" data-id="${p.id}">Lưu</button></span>`
        : `<b>${esc(p.name)} <button class="link" data-sy="rename" data-id="${p.id}">✏️</button></b>`;
      return `<div class="mk-item sy-pet ${P.active === p.id ? 'active' : ''}"><div class="mk-icon">${sp.icon}</div>
        <div class="mk-info">${nameRow}<small>${esc(sp.name)} · <span style="color:${rar.color}">${esc(rar.name)}</span> · cấp ${p.lvl}/${PET_RULES.maxLevel}${P.active === p.id ? ' · 🐾 đang đi cùng bạn' : ''}</small>
          ${bar(p.xp, petsSys.xpNeed(p), '#c79cf2')}<small>Thân thiết ${p.love}/100</small>${bar(p.love, 100, '#f6a6b9')}
          <div class="sy-skills">${skills}</div></div>
        <div class="mk-buy sy-pbtns">${P.active === p.id ? `<button class="btn sm" data-sy="active" data-id="">Để ở nhà</button>` : `<button class="btn sm primary" data-sy="active" data-id="${p.id}">Đi cùng</button>`}
          <button class="btn sm ${fed ? 'disabled' : ''}" data-sy="feed" data-id="${p.id}">${fed ? '✔ Đã ăn' : '🍖 Cho ăn'}</button>
          <button class="btn sm ${patted ? 'disabled' : ''}" data-sy="pat" data-id="${p.id}">${patted ? '✔ Đã vuốt' : '💕 Vuốt ve'}</button></div></div>`;
    }).join('');
    return `${head}<p class="muted small">Mỗi ngày game cho ăn 1 lần (món ăn vặt được XP ×2, không có thì 1 bông hoa) và vuốt ve 1 lần (hoặc chạm vào thú trên bản đồ). Thú đang đi cùng bạn lớn dần và giúp việc theo cấp.</p>${cards}`;
  }

  eggs() {
    const g = this.game, s = this.save, P = petsSys.PS(s);
    if (s.player.level < PET_RULES.unlockLevel) return `<p class="muted">🔒 Mở ở cấp ${PET_RULES.unlockLevel}.</p>`;
    const inc = petsSys.incubating(s).length;
    const rows = P.eggs.length ? P.eggs.map((e) => {
      const E = EGGS[e.kind], left = petsSys.hatchLeft(e, g.now);
      const odds = Object.entries(E.odds).map(([r, v]) => `<span style="color:${PET_RARITY[r].color}">${esc(PET_RARITY[r].name)} ${Math.round(v * 100)}%</span>`).join(' · ');
      return `<div class="mk-item"><div class="mk-icon">${E.icon}</div><div class="mk-info"><b>${esc(E.name)}</b><small>${odds}</small>
        ${left != null ? `<small>🪺 Đang ấp · còn ${Math.ceil(left / 60)} giờ game</small>${bar(E.hours * 60 - left, E.hours * 60, '#ffd36e')}` : `<small>Ấp ${E.hours / 24} ngày game thì nở</small>`}</div>
        <div class="mk-buy">${left == null ? `<button class="btn ${inc < P.incubators ? 'primary' : 'disabled'}" data-sy="incubate" data-id="${e.id}">Đặt vào ổ</button>` : ''}</div></div>`;
    }).join('') : '<p class="muted">Chưa có trứng nào.</p>';
    const next = P.incubators < PET_RULES.incubatorMax ? PET_RULES.incubatorPrice[P.incubators - 1] : null;
    return `<p class="muted small">🪺 Ổ ấp ở trước nhà bạn: ${inc}/${P.incubators} đang dùng. Trứng rơi ra khi câu cá, hái nguyên liệu ở Ngàn Hương, mở gói Vận May; đổi được ở 🎡 Khu Vui Chơi; có trong 📖 Sổ thưởng mùa và quà điểm danh.</p>
      ${rows}${next ? `<div class="row-btns"><button class="btn" data-sy="incubator">🪺 Mua thêm ổ ấp (${money(next)} 💰)</button></div>` : ''}`;
  }

  onAction(act, el) {
    const g = this.game, id = el.dataset.id;
    if (el.classList.contains('disabled')) { if (act === 'incubate') g.toast('Hết ổ ấp trống — đợi trứng nở hoặc mua thêm ổ', 'warn'); return; }
    switch (act) {
      case 'tab': this.tab = id; this.renaming = null; this.render(); return;
      case 'slot': this.slot = id; break;
      case 'wear': g.wearItem(id); break;
      case 'hair': g.setHairColor(id); break;
      case 'buy': g.buyOutfit(id); break;
      case 'starter': g.claimStarterEgg(); this.tab = 'eggs'; break;
      case 'incubate': g.incubateEgg(+id); break;
      case 'incubator':
        if (!el.dataset.armed) { el.dataset.armed = '1'; el.textContent = 'Bấm lần nữa để mua'; setTimeout(() => { delete el.dataset.armed; }, 3000); return; }
        g.buyIncubator(); break;
      case 'active': g.petSetActive(id ? +id : null); break;
      case 'feed': g.petFeed(+id); break;
      case 'pat': g.petPat(+id); break;
      case 'rename': this.renaming = +id; break;
      case 'rename-ok': { const inp = this.hud.root.querySelector(`[data-pet-name="${id}"]`); g.petRename(+id, inp?.value); this.renaming = null; break; }
      default: return;
    }
    if (this.hud.modal === 'style') this.render(true);
  }
}
