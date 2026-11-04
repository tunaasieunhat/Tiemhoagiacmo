// 🍀 Bảng Vận May (GĐ15): mở gói, tỉ lệ công khai, đổi mảnh, lịch sử
import { PACKS, TIERS, TICKETS, TICKET_SOURCES, SHARD_SHOP, LUCK_RULES, DUP_SHARDS } from '../../data/luck.js';
import { FLOWERS, LUCK_FLOWER_IDS } from '../../data/flowers.js';
import { DECOR } from '../../data/decor.js';
import * as luck from '../systems/luck.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pct = (p) => { const v = p * 100; return v >= 10 ? `${v.toFixed(0)}%` : v >= 1 ? `${v.toFixed(1)}%` : `${v.toFixed(2)}%`; };

const TABS = [
  { id: 'open', label: '🎁 Mở gói' },
  { id: 'odds', label: '📊 Tỉ lệ' },
  { id: 'shards', label: '🧩 Đổi mảnh' },
  { id: 'log', label: '📜 Đã mở' },
];

export class LuckPanel {
  constructor(hud) {
    this.hud = hud;
    this.game = hud.game;
    this.tab = 'open';
    this.oddsPack = 'normal';
    this.busy = false;
    hud.game.emitter.on('luck', () => { this.hud.updateLuckBadge?.(); if (this.hud.modal === 'luck' && !this.busy) this.render(); });
  }

  get save() { return this.game.save; }

  open(tab = null) {
    if (tab) this.tab = tab;
    if (this.save.player.level < LUCK_RULES.unlockLevel) { this.game.toast(`🍀 Vận May mở ở cấp ${LUCK_RULES.unlockLevel}`, 'warn'); return; }
    this.render();
  }

  render() {
    const l = this.save.luck;
    const head = `<div class="lk-wallet">
      <span title="${esc(TICKETS.luck.name)}">${TICKETS.luck.icon} <b>${l.tickets.luck || 0}</b></span>
      <span title="${esc(TICKETS.gold.name)}">${TICKETS.gold.icon} <b>${l.tickets.gold || 0}</b></span>
      <span title="${esc(TICKETS.shard.name)}">${TICKETS.shard.icon} <b>${l.shards || 0}</b></span>
      <span>💰 <b>${this.save.player.coins.toLocaleString('vi-VN')}</b></span></div>`;
    const tabs = `<div class="mk-tabs" role="tablist">${TABS.map((t) => `<button class="${t.id === this.tab ? 'on' : ''}" data-lk="tab" data-id="${t.id}" role="tab">${t.label}</button>`).join('')}</div>`;
    const body = { open: () => this.packs(), odds: () => this.odds(), shards: () => this.shardShop(), log: () => this.log() }[this.tab]();
    this.hud.openModal('luck', `<h2>🍀 Vận May</h2>${head}${tabs}<div class="mk-body lk-body">${body}</div>`, 'wide');
  }

  packs() {
    const s = this.save, l = s.luck;
    const card = (id) => {
      const P = PACKS[id];
      const locked = s.player.level < P.level;
      const left = luck.pityLeft(s, id);
      const pityTier = TIERS[P.pity.tier];
      const tk = Object.entries(P.cost).map(([t, n]) => `${n} ${TICKETS[t].icon}`).join(' ');
      const hasTk = Object.entries(P.cost).every(([t, n]) => (l.tickets[t] || 0) >= n);
      const hasCoins = s.player.coins >= P.coins;
      return `<div class="lk-pack ${id} ${locked ? 'locked' : ''}">
        <div class="lk-box" aria-hidden="true">${P.icon}</div>
        <div class="lk-info">
          <b>${esc(P.name)}</b>
          <small>${esc(P.desc)}</small>
          ${locked ? `<small class="bad">🔒 Mở ở cấp ${P.level}</small>` : `<small class="lk-pity">🛡️ Bảo hiểm: còn <b>${left}</b> lần nữa chắc chắn ra <b style="color:${pityTier.color}">${esc(pityTier.name)}</b></small>
            <div class="track sm"><i style="width:${Math.round(((P.pity.every - left) / P.pity.every) * 100)}%;background:${pityTier.color}"></i></div>`}
        </div>
        ${locked ? '' : `<div class="lk-buy">
          <button class="btn primary ${hasTk ? '' : 'disabled'}" data-lk="open" data-id="${id}" data-pay="ticket">Mở bằng ${tk}</button>
          <button class="btn ${hasCoins ? '' : 'disabled'}" data-lk="open" data-id="${id}" data-pay="coins">Mở bằng ${P.coins.toLocaleString('vi-VN')} 💰</button>
        </div>`}
      </div>`;
    };
    const src = TICKET_SOURCES;
    return `${card('normal')}${card('gold')}
      <details class="lk-how"><summary>🎟️ Cách kiếm vé (đều trong game, không mua bằng tiền thật)</summary>
        <ul>
          <li>Mỗi ngày vào game: +${src.daily.luck} 🎟️</li>
          <li>Nhận thưởng đủ 3 nhiệm vụ ngày: +${src.dailyQuestsAll.luck} 🎟️</li>
          <li>Nhận thưởng đủ 3 nhiệm vụ tuần: +${src.weeklyQuestsAll.gold} 🎫</li>
          <li>Mỗi lần lên cấp: +${src.levelUp.luck} 🎟️, cứ ${src.levelUpGoldEvery} cấp thêm 1 🎫</li>
          <li>Giúp dân làng đạt 3⭐: +${src.favor3.luck} 🎟️</li>
          <li>Mỗi lần mở gói được ${Math.min(PACKS.normal.shards, PACKS.gold.shards)}–${Math.max(PACKS.normal.shards, PACKS.gold.shards)} 🧩, đồ trùng đổi thành 🧩 → đổi lấy vé hoặc món bạn muốn</li>
        </ul>
      </details>`;
  }

  odds() {
    const id = this.oddsPack;
    const P = PACKS[id];
    const rows = luck.oddsTable(id).map((t) => `<div class="lk-tier">
        <div class="lk-tier-h" style="border-color:${t.color}"><b style="color:${t.color}">${esc(t.name)}</b><b>${pct(t.p)}</b></div>
        ${t.items.map((it) => `<div class="lk-odd"><span>${esc(it.label)}</span><span>${pct(it.p)}</span></div>`).join('')}
      </div>`).join('');
    return `<div class="tabs lk-switch">${Object.entries(PACKS).map(([pid, pk]) => `<button class="${pid === id ? 'on' : ''}" data-lk="odds" data-id="${pid}">${pk.icon} ${esc(pk.name)}</button>`).join('')}</div>
      <p class="small">Tỉ lệ <b>mỗi lần mở</b> ${esc(P.name)} (công khai đầy đủ):</p>
      ${rows}
      <p class="small muted">🛡️ <b>Bảo hiểm:</b> mở ${P.pity.every} lần liền mà chưa ra bậc ${esc(TIERS[P.pity.tier].name)} thì lần thứ ${P.pity.every} chắc chắn ra.
        Mỗi lần mở tặng kèm ${P.shards} 🧩. Đồ trùng (hoặc khi không còn gì để tặng) đổi thành 🧩: Thường ${DUP_SHARDS.common} · Ít gặp ${DUP_SHARDS.uncommon} · Hiếm ${DUP_SHARDS.rare} · Huyền thoại ${DUP_SHARDS.legend}.</p>`;
  }

  shardShop() {
    const s = this.save, l = s.luck;
    const have = l.shards || 0;
    const btn = (what, id, cost, disabled = false, label = 'Đổi') => `<button class="btn ${have >= cost && !disabled ? 'primary' : 'disabled'}" data-lk="ex" data-what="${what}" data-id="${id || ''}">${label} ${cost} 🧩</button>`;
    const flowers = LUCK_FLOWER_IDS.map((id) => {
      const f = FLOWERS[id];
      return `<div class="mk-item"><div class="mk-icon">${f.icon}</div><div class="mk-info"><b>Hạt ${esc(f.name)}</b><small>${esc(f.meaning)} · lớn ${f.growHours} giờ · bán ~${f.basePrice} 💰</small><small>Đang có ${seedCount(s, id)} hạt</small></div><div class="mk-buy">${btn('luckFlower', id, SHARD_SHOP.luckFlower.cost)}</div></div>`;
    }).join('');
    const decor = luck.LUCK_DECOR_IDS.map((id) => {
      const d = DECOR[id];
      const own = luck.ownsLuckDecor(s, id);
      return `<div class="mk-item ${own ? 'claimed' : ''}"><div class="mk-icon">${d.icon}</div><div class="mk-info"><b>${esc(d.name)}</b><small>Đồ trang trí Vận May · ✨ ${d.beauty} điểm xinh</small></div><div class="mk-buy">${own ? '<span class="maxed">✔ Đã có</span>' : btn('luckDecor', id, SHARD_SHOP.luckDecor.cost)}</div></div>`;
    }).join('');
    const tk = ['gold', 'luck'].map((t) => `<div class="mk-item"><div class="mk-icon">${TICKETS[t].icon}</div><div class="mk-info"><b>${esc(TICKETS[t].name)}</b><small>${esc(TICKETS[t].desc)}</small></div><div class="mk-buy">${btn(t, '', SHARD_SHOP[t].cost)}</div></div>`).join('');
    return `<p class="small">Bạn đang có <b>${have} 🧩</b>. Gom mảnh để chọn đúng món mình thích.</p>
      <h3>🌈 Cây Vận May</h3>${flowers}<h3>🍀 Đồ trang trí Vận May</h3>${decor}<h3>🎫 Vé</h3>${tk}`;
  }

  log() {
    const l = this.save.luck;
    const list = (l.history || []).map((h) => `<div class="lk-log"><span>${PACKS[h.pack]?.icon || '🎁'}</span><span>${h.icon} ${esc(h.text)}</span><b style="color:${TIERS[h.tier]?.color}">${esc(TIERS[h.tier]?.name || '')}</b></div>`).join('');
    return `<p class="small muted">Đã mở: ${l.opened.normal || 0} Gói Thường · ${l.opened.gold || 0} Gói Vàng</p>${list || '<p class="muted">Chưa mở gói nào.</p>'}`;
  }

  onAction(act, el) {
    if (this.busy) return;
    if (act === 'tab') { this.tab = el.dataset.id; this.render(); return; }
    if (act === 'odds') { this.oddsPack = el.dataset.id; this.render(); return; }
    if (act === 'ex') { this.game.exchangeShards(el.dataset.what, el.dataset.id); this.render(); return; }
    if (act === 'again') { this.tab = 'open'; this.render(); return; }
    if (act === 'open') {
      if (el.classList.contains('disabled')) {
        const chk = luck.canOpen(this.save, el.dataset.id, el.dataset.pay);
        if (!chk.ok) this.game.toast(chk.msg, 'warn');
        return;
      }
      const res = this.game.openLuckPack(el.dataset.id, el.dataset.pay);
      if (res.ok) this.reveal(res);
    }
  }

  /** Hiệu ứng mở gói: hộp rung → bung ra thẻ quà theo màu bậc */
  reveal(res) {
    this.busy = true;
    const P = PACKS[res.pack];
    const T = TIERS[res.tier];
    const rw = res.reward;
    const box = this.hud.root.querySelector('.lk-body');
    box.innerHTML = `<div class="lk-reveal tier-${res.tier}" style="--tc:${T.color}">
      <div class="lk-shake">${P.icon}</div>
    </div>`;
    const sfx = this.game.audio?.sfx;
    sfx?.tap?.(1);
    setTimeout(() => {
      const extra = [];
      if (rw.early) extra.push(`🔓 Mở khóa sớm (bình thường cần cấp ${rw.early})`);
      if (rw.isNew) extra.push('✨ Lần đầu có cây này! Đã ghi vào Sổ tay');
      if (rw.exclusive) extra.push('🍀 Đồ độc quyền Vận May — vào 🎨 Trang trí để đặt');
      if (rw.type === 'dup') extra.push(`Trùng đồ → đổi thành <b>${res.dupShards} 🧩</b>`);
      if (res.forced) extra.push('🛡️ Bảo hiểm kích hoạt!');
      const l = this.save.luck;
      const again = Object.entries(P.cost).every(([t, n]) => (l.tickets[t] || 0) >= n);
      box.innerHTML = `<div class="lk-reveal open tier-${res.tier}" style="--tc:${T.color}">
        <div class="lk-burst" aria-hidden="true">${'<i></i>'.repeat(12)}</div>
        <div class="lk-card">
          <small style="color:${T.color}">${esc(T.name)}</small>
          <div class="lk-prize">${rw.icon}</div>
          <b>${esc(rw.text)}</b>
          ${extra.map((x) => `<small>${x}</small>`).join('')}
          <small class="muted">+${res.baseShards} 🧩 · Bảo hiểm: còn ${res.pityLeft} lần</small>
        </div>
        <div class="lk-again">
          ${again ? `<button class="btn primary" data-lk="open" data-id="${res.pack}" data-pay="ticket">Mở tiếp ${Object.entries(P.cost).map(([t, n]) => `${n} ${TICKETS[t].icon}`).join(' ')}</button>` : ''}
          <button class="btn" data-lk="again">Xong</button>
        </div>
      </div>`;
      sfx?.chime?.({ common: 2, uncommon: 3, rare: 4, legend: 6 }[res.tier] || 2);
      this.busy = false;
    }, 900);
  }
}

function seedCount(save, id) {
  return Object.entries(save.inventory.seeds).filter(([k]) => k.startsWith(`${id}:`)).reduce((a, [, n]) => a + n, 0);
}
