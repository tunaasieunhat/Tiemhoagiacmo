// 🎡 Bảng Khu Vui Chơi (GĐ26): trò chơi lớn · quầy trò chơi (mini game) · quầy ăn vặt · đổi quà
import { RIDES, BOOTHS, SNACKS, PANTRY, FUN_RULES, FUN } from '../../data/fun.js';
import { FLOWERS } from '../../data/flowers.js';
import { WARDROBE } from '../../data/wardrobe.js';
import { EGGS } from '../../data/pets.js';
import { DECOR } from '../../data/decor.js';
import { MINIGAMES } from '../../data/minigames.js';
import * as funSys from '../systems/fun.js';
import { runMiniGame } from './minigames.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = (n) => Math.round(n).toLocaleString('vi-VN');
const TABS = [
  { id: 'rides', label: '🎡 Trò chơi' },
  { id: 'booths', label: '🎯 Quầy game' },
  { id: 'snacks', label: '🍡 Ăn vặt' },
  { id: 'prizes', label: '🎁 Đổi quà' },
];
const prizeInfo = (P) => (P.kind === 'outfit' ? { icon: WARDROBE[P.ref].icon, name: WARDROBE[P.ref].name } : P.kind === 'egg' ? { icon: EGGS[P.ref].icon, name: EGGS[P.ref].name } : P.kind === 'decor' ? { icon: DECOR[P.ref].icon, name: DECOR[P.ref].name } : { icon: '🎟️', name: `${P.ref} vé may mắn` });

export class FunPanel {
  constructor(hud) {
    this.hud = hud;
    this.game = hud.game;
    this.tab = 'rides';
    this.busy = false;
    hud.game.emitter.on('fun', (e) => this.open(e?.tab, e?.id));
    hud.game.emitter.on('inventory', () => { if (this.hud.modal === 'fun' && !this.busy) this.render(true); });
  }
  get save() { return this.game.save; }

  open(tab = null, id = null) {
    if (!this.game.funOpen()) { this.game.tapFun({ kind: 'fungate' }); return; }
    if (tab) this.tab = tab;
    this.focus = id;
    this.render();
  }

  render(keep = false) {
    const top = keep ? this.hud.scrollBox()?.scrollTop || 0 : 0;
    const s = this.save, f = funSys.F(s);
    const fest = this.game.isFestivalAt(this.game.now);
    const head = `<div class="mk-wallet"><span>💰 <b>${money(s.player.coins)}</b></span><span>${FUN.coin.icon} <b>${f.xu}</b> Xu Vui</span>${fest ? '<span>🏮 Lễ hội tối Thứ Bảy!</span>' : ''}</div>`;
    const tabs = `<div class="mk-tabs" role="tablist">${TABS.map((t) => `<button class="${t.id === this.tab ? 'on' : ''}" data-fn="tab" data-id="${t.id}" role="tab">${t.label}</button>`).join('')}</div>`;
    const body = { rides: () => this.rides(), booths: () => this.booths(), snacks: () => this.snacks(), prizes: () => this.prizes() }[this.tab]();
    this.hud.openModal('fun', `<h2>🎡 Khu Vui Chơi</h2>${head}${tabs}<div class="mk-body fn-body">${body}</div>`, 'wide');
    if (keep) { const box = this.hud.scrollBox(); if (box) box.scrollTop = top; }
  }

  rides() {
    const s = this.save, f = funSys.F(s);
    return `<p class="muted small">Mở cửa ${FUN.open[0]}:00 – ${FUN.open[1]}:00. Đi cùng thú cưng thì thú vui hơn (+thân thiết).</p>` + Object.entries(RIDES).map(([id, R]) => `<div class="mk-item ${this.focus === id ? 'focus' : ''}"><div class="mk-icon">${R.icon}</div>
      <div class="mk-info"><b>${esc(R.name)}</b><small>${esc(R.desc)}</small><small>Đã chơi ${f.rides[id] || 0} lần</small></div>
      <div class="mk-buy"><span class="price">${R.price} 💰</span><button class="btn ${s.player.coins >= R.price ? 'primary' : 'disabled'}" data-fn="ride" data-id="${id}">Chơi</button></div></div>`).join('');
  }

  booths() {
    const s = this.save, f = funSys.F(s);
    return `<p class="muted small">Mỗi lượt ${BOOTHS.ringtoss.price} 💰. Được càng nhiều ⭐ càng nhiều ${FUN.coin.icon} Xu Vui (0⭐: ${BOOTHS.ringtoss.xu[0]} · 1⭐: ${BOOTHS.ringtoss.xu[1]} · 2⭐: ${BOOTHS.ringtoss.xu[2]} · 3⭐: ${BOOTHS.ringtoss.xu[3]}). Chơi nhiều thì trò khó dần.</p>` + Object.entries(BOOTHS).map(([id, B]) => {
      const lv = funSys.boothLevel(s, id);
      return `<div class="mk-item ${this.focus === id ? 'focus' : ''}"><div class="mk-icon">${B.icon}</div>
      <div class="mk-info"><b>${esc(B.name)}</b><small>${esc(MINIGAMES[B.game]?.help || '')}</small><small>Đã chơi ${f.plays[id] || 0} lượt · 🏆 ${'⭐'.repeat(f.best[id] || 0) || '—'} · độ khó ${['Dễ', 'Vừa', 'Khó'][lv]}</small></div>
      <div class="mk-buy"><span class="price">${B.price} 💰</span><button class="btn ${s.player.coins >= B.price ? 'primary' : 'disabled'}" data-fn="booth" data-id="${id}">Chơi</button></div></div>`;
    }).join('');
  }

  snacks() {
    const s = this.save, f = funSys.F(s);
    const shelf = funSys.shelf(s);
    const shelfHtml = shelf.length ? shelf.map((x) => `<span class="chip-s">${SNACKS[x.id].icon} ${'⭐'.repeat(x.q) || '·'} ×${x.n} <small>${money(x.price)} 💰</small></span>`).join('') : '<span class="muted small">Kệ trống — làm món để khách mua</span>';
    const pantry = Object.entries(PANTRY).map(([id, P]) => `<span class="fn-pan">${P.icon} ${esc(P.name)} <b>${f.pantry[id] || 0}</b><button class="btn sm" data-fn="pantry" data-id="${id}">+5 (${P.price * 5} 💰)</button></span>`).join('');
    const recipes = Object.entries(SNACKS).map(([id, S]) => {
      const miss = funSys.missing(s, id);
      const need = [...Object.entries(S.flowers).map(([sp, n]) => `${FLOWERS[sp].icon} ${esc(FLOWERS[sp].name)} ×${n} <small>(có ${funSys.flowerCount(s, sp)})</small>`), ...Object.entries(S.pantry).map(([p, n]) => `${PANTRY[p].icon} ×${n}`)].join(' · ');
      return `<div class="mk-item ${miss.length ? 'locked' : ''}"><div class="mk-icon">${S.icon}</div>
        <div class="mk-info"><b>${esc(S.name)}</b><small>${need}</small><small>Giá bán ${money(funSys.snackPrice(id, 0))}–${money(funSys.snackPrice(id, 3))} 💰 theo số ⭐</small></div>
        <div class="mk-buy fn-make"><button class="btn sm ${miss.length ? 'disabled' : ''}" data-fn="quick" data-id="${id}">Làm nhanh (${FUN_RULES.quickStars}⭐)</button><button class="btn sm ${miss.length ? 'disabled' : 'primary'}" data-fn="craft" data-id="${id}">🎮 Làm khéo</button></div></div>`;
    }).join('');
    return `<p class="muted small">Khách đi chơi mua ăn vặt trong giờ mở cửa (~${FUN_RULES.snackSales} món/giờ, tối Thứ Bảy gấp ${FUN_RULES.saturdayMult}). Món ăn vặt cũng cho thú cưng ăn được (XP ×2).</p>
      <h3>🧺 Trên kệ (${funSys.shelfCount(s)}/${FUN_RULES.shelfMax}) · đã bán ${f.sold || 0} món</h3><div class="chips">${shelfHtml}</div>
      <h3>🛒 Nguyên liệu</h3><div class="fn-pantry">${pantry}</div><h3>📖 Công thức</h3>${recipes}`;
  }

  prizes() {
    const g = this.game, list = funSys.prizeList(this.save, (k, r) => g.prizeHas(k, r));
    return `<p class="muted small">Đổi ${FUN.coin.icon} Xu Vui (kiếm ở các quầy trò chơi) lấy quà. Trang phục mặc ở 🎀 Phong cách, trứng ấp ở ổ trước nhà, đồ trang trí đặt bằng 🎨.</p><div class="fn-prizes">` + list.map((P) => {
      const it = prizeInfo(P);
      return `<button class="sy-item ${P.have ? 'locked' : P.can ? 'buy' : 'poor'}" data-fn="prize" data-id="${P.id}" ${P.have ? 'disabled' : ''}><span class="sy-ic">${it.icon}</span><b>${esc(it.name)}</b><i>${P.have ? '✔ Đã có' : `${P.cost} ${FUN.coin.icon}`}</i></button>`;
    }).join('') + '</div>';
  }

  async onAction(act, el) {
    const g = this.game, id = el.dataset.id;
    if (this.busy) return;
    if (el.classList.contains('disabled')) { g.toast(act === 'quick' || act === 'craft' ? 'Chưa đủ nguyên liệu' : 'Không đủ 💰', 'warn'); return; }
    switch (act) {
      case 'tab': this.tab = id; this.focus = null; this.render(); return;
      case 'ride': this.hud.closeModal(); g.rideGo(id); return;
      case 'booth': {
        const B = BOOTHS[id];
        if (!g.boothPay(id).ok) return;
        this.busy = true;
        this.hud.closeModal();
        try {
          const res = await runMiniGame(B.game, { title: B.name, icon: B.icon, sfx: g.audio?.sfx, level: funSys.boothLevel(this.save, id), record: this.save.mg?.[B.game] });
          g.boothResult(id, res.quit ? 0 : res.stars, res.combo || 0);
        } finally { this.busy = false; }
        this.tab = 'booths'; this.render();
        return;
      }
      case 'pantry': g.snackBuy(id, 5); break;
      case 'quick': g.snackMake(id, FUN_RULES.quickStars); break;
      case 'craft': {
        const S = SNACKS[id];
        this.busy = true;
        this.hud.closeModal();
        try {
          const res = await runMiniGame(S.game, { title: `Làm ${S.name}`, icon: S.icon, sfx: g.audio?.sfx, level: 0, record: this.save.mg?.[S.game] });
          if (!res.quit) g.snackMake(id, res.stars);
        } finally { this.busy = false; }
        this.tab = 'snacks'; this.render();
        return;
      }
      case 'prize': g.exchangePrize(id); break;
      default: return;
    }
    if (this.hud.modal === 'fun') this.render(true);
  }
}
