// Khu Chợ: mua hạt giống, vật tư, nâng cấp, mở rộng đất, bán sỉ.
import { FLOWERS, FLOWER_IDS } from '../../data/flowers.js';
import { PAPERS, RIBBONS } from '../../data/wrapping.js';
import { SUPPLIES, UPGRADES, PLOT_UNLOCKS } from '../../data/market.js';
import { nextUpgrade, nextPlot } from '../systems/market.js';
import { wholesalePrice } from '../systems/shop.js';
import { formatDuration } from '../systems/time.js';

const TABS = [
  { id: 'seeds', label: '🌱 Hạt giống' },
  { id: 'supplies', label: '🧪 Vật tư' },
  { id: 'upgrades', label: '🛠️ Nâng cấp' },
  { id: 'land', label: '🗺️ Đất' },
  { id: 'sell', label: '📦 Bán sỉ' },
];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export class MarketPanel {
  constructor(hud) {
    this.hud = hud;
    this.game = hud.game;
    this.tab = 'seeds';
  }

  get save() { return this.game.save; }

  open(tab) {
    if (tab) this.tab = tab;
    this.render();
  }

  render(keepScroll = false) {
    const m = this.hud.root.querySelector('.modal');
    const top = keepScroll && this.hud.modal === 'market' ? m?.scrollTop || 0 : 0;
    const s = this.save;
    const body = { seeds: this.seeds, supplies: this.supplies, upgrades: this.upgrades, land: this.land, sell: this.sell }[this.tab].call(this);
    this.hud.openModal('market', `
      <h2>🧺 Khu Chợ</h2>
      <div class="mk-wallet"><span>💰 <b>${s.player.coins}</b></span><span>⭐ Cấp <b>${s.player.level}</b></span></div>
      <div class="mk-tabs" role="tablist">${TABS.map((t) => `<button class="${t.id === this.tab ? 'on' : ''}" data-mk="tab" data-id="${t.id}" role="tab">${t.label}</button>`).join('')}</div>
      <div class="mk-body">${body}</div>`, 'wide');
    if (top) this.hud.root.querySelector('.modal').scrollTop = top;
  }

  // ----- thẻ hàng dùng chung -----
  card({ icon, name, desc, price, lock, owned, buttons }) {
    return `<div class="mk-item ${lock ? 'locked' : ''}">
      <div class="mk-icon">${icon}</div>
      <div class="mk-info"><b>${esc(name)}</b>${desc ? `<small>${desc}</small>` : ''}${owned != null ? `<small class="owned">Đang có: ${owned}</small>` : ''}</div>
      <div class="mk-buy">${lock ? `<span class="lock">🔒 Cấp ${lock}</span>` : `${price != null ? `<span class="price">${price} 💰</span>` : ''}${buttons}`}</div>
    </div>`;
  }

  buyBtns(what, id, price) {
    const c = this.save.player.coins;
    return [1, 5].map((n) => `<button class="btn ${c < price * n ? 'disabled' : 'primary'}" data-mk="buy" data-what="${what}" data-id="${id}" data-n="${n}">Mua ${n}</button>`).join('');
  }

  seeds() {
    const lv = this.save.player.level;
    return `<p class="muted small">Giá hạt → giá bán 1 cành 1★ ở tiệm. Hoa chất lượng cao bán đắt hơn.</p>` + FLOWER_IDS.map((id) => {
      const f = FLOWERS[id];
      return this.card({
        icon: f.icon, name: `Hạt ${f.name}`,
        desc: `Lớn trong ${formatDuration(f.growHours * 60)} · tưới ${f.waterPerDay} lần/ngày · bán ~${f.basePrice} 💰`,
        price: f.seedPrice, lock: lv < f.unlockLevel ? f.unlockLevel : 0, owned: this.save.inventory.seeds[id] || 0,
        buttons: this.buyBtns('seed', id, f.seedPrice),
      });
    }).join('');
  }

  supplies() {
    const s = this.save;
    const lv = s.player.level;
    const sup = Object.entries(SUPPLIES).map(([id, it]) => this.card({
      icon: it.icon, name: it.name, desc: it.desc, price: it.price, owned: s.inventory.items[id] || 0, buttons: this.buyBtns('supply', id, it.price),
    })).join('');
    const wraps = (dict, kind, icon) => Object.entries(dict).filter(([, w]) => !w.free).map(([id, w]) => this.card({
      icon: `<span class="swatch-dot ${kind === 'ribbons' ? 'ribbon' : ''}" style="--c:${w.color}"></span>`, name: w.name,
      desc: `${icon} Hợp ${w.tones.map((t) => ({ warm: 'tông ấm', cool: 'tông mát', pastel: 'pastel', natural: 'mộc mạc' }[t])).join(', ')}`,
      price: w.price, lock: lv < (w.unlockLevel || 1) ? w.unlockLevel : 0, owned: s.inventory[kind][id] || 0, buttons: this.buyBtns(kind, id, w.price),
    })).join('');
    return `${sup}<h3>Giấy gói</h3>${wraps(PAPERS, 'papers', '📜')}<h3>Ruy băng</h3>${wraps(RIBBONS, 'ribbons', '🎀')}
      <p class="muted small">Giấy kraft và dây đay luôn miễn phí.</p>`;
  }

  upgrades() {
    const s = this.save;
    return Object.entries(UPGRADES).map(([key, u]) => {
      const cur = u.tiers[s.upgrades[key] || 0];
      const next = nextUpgrade(s, key);
      const dots = u.tiers.map((_, i) => `<i class="${i <= (s.upgrades[key] || 0) ? 'on' : ''}"></i>`).join('');
      if (!next) return this.card({ icon: u.icon, name: `${u.name}: ${cur.name}`, desc: `${u.effect}: ${cur.desc} <span class="tiers">${dots}</span>`, buttons: '<span class="maxed">✨ Tối đa</span>' });
      return this.card({
        icon: u.icon, name: `${u.name} → ${next.name}`,
        desc: `Hiện tại: ${cur.name} (${cur.desc.toLowerCase()})<br>Sau nâng cấp: <b>${next.desc}</b> <span class="tiers">${dots}</span>`,
        price: next.price, lock: s.player.level < next.level ? next.level : 0,
        buttons: `<button class="btn ${s.player.coins < next.price ? 'disabled' : 'primary'}" data-mk="buy" data-what="upgrade" data-id="${key}">Nâng cấp</button>`,
      });
    }).join('');
  }

  land() {
    const s = this.save;
    const next = nextPlot(s);
    const rows = PLOT_UNLOCKS.map((p) => {
      const owned = s.farm.plots.length > p.slot;
      const isNext = next && next.slot === p.slot;
      return this.card({
        icon: owned ? '🟫' : '🔒', name: `Lô đất số ${p.slot + 1}`,
        desc: owned ? 'Đã sở hữu' : isNext ? '9 ô đất mới để trồng thêm hoa' : 'Mở lô trước để mở lô này',
        price: owned ? null : p.price, lock: !owned && s.player.level < p.level ? p.level : 0,
        buttons: owned ? '<span class="maxed">✔ Của bạn</span>' : isNext ? `<button class="btn ${s.player.coins < p.price ? 'disabled' : 'primary'}" data-mk="buy" data-what="plot" data-id="${p.slot}">Mở rộng</button>` : '',
      });
    }).join('');
    return `<p class="muted small">Bạn đang có ${s.farm.plots.length} lô đất (${s.farm.plots.length * 9} ô).</p>${rows}`;
  }

  sell() {
    const stacks = Object.entries(this.save.inventory.flowers).filter(([, n]) => n > 0);
    if (!stacks.length) return '<p class="muted">Kho chưa có hoa để bán.</p>';
    return `<p class="muted small">Thương lái mua sỉ với giá thấp (khoảng một nửa). Bán cho khách ở Tiệm Hoa sẽ lời hơn và được uy tín.</p>` + stacks.map(([k, n]) => {
      const [id, q] = k.split('|');
      const each = wholesalePrice(id, +q);
      return this.card({
        icon: FLOWERS[id].icon, name: `${FLOWERS[id].name} ${'★'.repeat(+q)}`, desc: `${each} 💰 / cành`, owned: n,
        buttons: `<button class="btn" data-mk="sell1" data-k="${k}">Bán 1</button><button class="btn primary" data-act="sell" data-k="${k}" data-n="${n}" data-total="${each * n}">Bán hết</button>`,
      });
    }).join('');
  }

  onAction(act, el) {
    const g = this.game;
    if (act === 'tab') { this.tab = el.dataset.id; this.render(); return; }
    if (act === 'buy') {
      if (el.classList.contains('disabled')) { g.toast('Không đủ tiền 💰', 'warn'); return; }
      g.buy(el.dataset.what, el.dataset.id, +(el.dataset.n || 1));
      if (el.dataset.what === 'plot') { this.hud.closeModal(); return; }
      this.render(true);
      return;
    }
    if (act === 'sell1') {
      g.sellWholesale(el.dataset.k, 1);
      this.render(true);
    }
  }
}
