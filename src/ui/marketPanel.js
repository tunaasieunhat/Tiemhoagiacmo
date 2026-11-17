// Khu Chợ: mua hạt giống, vật tư, nâng cấp, mở rộng đất, bán sỉ.
import { FLOWERS, FLOWER_IDS, NORMAL_FLOWER_IDS } from '../../data/flowers.js';
import { PAPERS, RIBBONS } from '../../data/wrapping.js';
import { SUPPLIES, UPGRADES, PLOT_UNLOCKS } from '../../data/market.js';
import { nextUpgrade, nextPlot, ownedSlots } from '../systems/market.js';
import { wholesalePrice } from '../systems/shop.js';
import * as goals from '../systems/goals.js';
import { SHOP_TIERS } from '../../data/shopTiers.js';
import { formatDuration } from '../systems/time.js';
import { PROTECTION } from '../../data/seasons.js';
import * as variants from '../systems/variants.js';
import { MACHINES, STAFF } from '../../data/automation.js';
import { DECOR, DECOR_EVENTS } from '../../data/decor.js';
import { PARCELS } from '../../data/land.js';
import { ownsParcel } from '../systems/land.js';
import { heartsOf } from '../systems/relations.js';
import { villagerInfo } from '../systems/village.js';
import { eventOpen } from '../systems/decor.js';

const TABS = [
  { id: 'seeds', label: '🌱 Hạt giống' },
  { id: 'supplies', label: '🧪 Vật tư' },
  { id: 'upgrades', label: '🛠️ Nâng cấp' },
  { id: 'protect', label: '🛡️ Phòng hộ' },
  { id: 'land', label: '🗺️ Đất' },
  { id: 'auto', label: '🤖 Tự động' },
  { id: 'decor', label: '🎨 Trang trí' },
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
    const m = this.hud.scrollBox();
    const top = keepScroll && this.hud.modal === 'market' ? m?.scrollTop || 0 : 0;
    const s = this.save;
    const body = { seeds: this.seeds, supplies: this.supplies, upgrades: this.upgrades, protect: this.protect, land: this.land, auto: this.auto, decor: this.decor, sell: this.sell }[this.tab].call(this);
    this.hud.openModal('market', `
      <h2>🧺 Khu Chợ</h2>
      <div class="mk-wallet"><span>💰 <b>${s.player.coins}</b></span><span>⭐ Cấp <b>${s.player.level}</b></span></div>
      <div class="mk-tabs" role="tablist">${TABS.map((t) => `<button class="${t.id === this.tab ? 'on' : ''}" data-mk="tab" data-id="${t.id}" role="tab">${t.label}</button>`).join('')}</div>
      <div class="mk-body">${body}</div>`, 'wide');
    if (top) this.hud.scrollBox().scrollTop = top;
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
    return `<p class="muted small">Chợ chỉ bán hạt màu cơ bản. Màu khác có được nhờ 🧬 lai tạo hoặc quà của khách quen.</p>` + NORMAL_FLOWER_IDS.filter((id) => !FLOWERS[id].salt || this.save.story?.seen?.e1_sao).map((id) => {
      const f = FLOWERS[id];
      return this.card({
        icon: f.icon, name: `Hạt ${variants.variantName(id, null)}`,
        desc: `Lớn trong ${formatDuration(f.growHours * 60)} · tưới ${f.waterPerDay} lần/ngày · bán ~${f.basePrice} 💰${f.greenhouseOnly ? ' · 🏠 chỉ trồng trong nhà kính' : ''}${f.tall ? ' · 🌬️ thân cao, sợ gió lớn' : ''}${f.salt ? ' · 🌫️ chỉ trồng ở Mũi Én' : ''}`,
        price: f.seedPrice, lock: lv < f.unlockLevel ? f.unlockLevel : 0, owned: this.save.inventory.seeds[variants.vkey(id)] || 0,
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

  /** 🏪 Quy mô tiệm (GĐ18) — thẻ to chiếm cả hàng */
  shopTierCard() {
    const s = this.save;
    const cur = goals.shopTier(s);
    const info = goals.shopUpgradeInfo(s);
    const steps = SHOP_TIERS.map((t, i) => `<span class="st-step ${i <= (s.shopLevel || 0) ? 'on' : ''}">${t.icon}</span>`).join('<i>›</i>');
    const body = info.next
      ? `<small>Lên <b>${info.next.icon} ${esc(info.next.name)}</b>: ${esc(info.next.desc)}</small>
         <div class="st-checks">${info.checks.map((c) => `<span class="${c.ok ? 'ok' : 'no'}">${c.ok ? '✅' : '⬜'} ${esc(c.text)}</span>`).join('')}</div>`
      : '<small>✨ Tiệm đã đạt quy mô lớn nhất!</small>';
    return `<div class="shop-tier">
      <div class="st-top"><span class="st-icon">${cur.icon}</span><div><b>Quy mô tiệm: ${esc(cur.name)}</b><small>${esc(cur.desc)}</small></div><div class="st-steps">${steps}</div></div>
      ${body}
      ${info.next ? `<button class="btn ${info.ok ? 'primary' : 'disabled'}" data-mk="shoptier">🏗️ Xây mở rộng (${info.next.cost.toLocaleString('vi-VN')} 💰)</button>` : ''}
    </div>`;
  }

  upgrades() {
    const s = this.save;
    return this.shopTierCard() + Object.entries(UPGRADES).map(([key, u]) => {
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

  protect() {
    const s = this.save;
    const lv = s.player.level;
    const items = ['cover', 'medicine'].map((k) => {
      const it = PROTECTION[k];
      return this.card({ icon: it.icon, name: it.name, desc: it.desc, price: it.price, lock: lv < it.level ? it.level : 0, owned: s.inventory.items[k] || 0, buttons: this.buyBtns('protect', k, it.price) });
    }).join('');
    const gh = PROTECTION.greenhouse;
    const houses = s.farm.plots.map((p, i) => this.card({
      icon: gh.icon, name: `Nhà kính cho lô số ${i + 1}`, desc: p.greenhouse ? 'Đã xây' : gh.desc,
      price: p.greenhouse ? null : gh.price, lock: !p.greenhouse && lv < gh.level ? gh.level : 0,
      buttons: p.greenhouse ? '<span class="maxed">✔ Đã có</span>' : `<button class="btn ${s.player.coins < gh.price ? 'disabled' : 'primary'}" data-mk="buy" data-what="greenhouse" data-id="${i}">Xây</button>`,
    })).join('');
    return `<p class="muted small">Xem dự báo thời tiết bằng cách bấm vào đồng hồ. Thiên tai và dịch bệnh luôn được báo trước 1 ngày.</p>${items}<h3>Nhà kính</h3>${houses}`;
  }

  auto() {
    const s = this.save;
    const lv = s.player.level;
    const machines = Object.entries(MACHINES).map(([k, m]) => `<h3>${m.icon} ${m.name}</h3><p class="muted small">${m.desc}</p>` + s.farm.plots.map((p, i) => this.card({
      icon: m.icon, name: `Lô số ${i + 1}`, desc: p.machines?.[k] ? 'Đã lắp đặt' : m.desc,
      price: p.machines?.[k] ? null : m.price, lock: !p.machines?.[k] && lv < m.level ? m.level : 0,
      buttons: p.machines?.[k] ? '<span class="maxed">✔ Đang chạy</span>' : `<button class="btn ${s.player.coins < m.price ? 'disabled' : 'primary'}" data-mk="machine" data-kind="${k}" data-id="${i}">Lắp đặt</button>`,
    })).join('')).join('');
    // (GĐ25) nhân viên chuyển sang 🗓️ Sổ quản lý › Nhân viên (chọn ứng viên, lương theo năng lực)
    const staff = `<div class="mk-item"><div class="mk-info"><b>👥 Nhân viên đã chuyển sang Sổ quản lý</b><small>Chọn trong 3 ứng viên mỗi tuần, tay nghề tăng dần, trả lương cứng hoặc theo hiệu suất.</small></div><button class="btn primary" data-act="manage" data-tab="staff">🗓️ Mở</button></div>`;
    return `<p class="muted small">Máy móc làm việc cả khi bạn không chơi. Nhân viên: xem 🗓️ Sổ quản lý.</p>${machines}<h3>👥 Nhân viên</h3>${staff}`;
  }

  decor() {
    const s = this.save;
    const lv = s.player.level;
    const season = this.game.seasonId();
    const card = ([id, d]) => {
      const open = !d.event || eventOpen(d.event, season);
      return this.card({
        icon: d.icon, name: d.name, desc: `🎨 +${d.beauty} điểm xinh xắn`, price: d.price, lock: lv < d.level ? d.level : 0, owned: s.decor.owned[id] || 0,
        buttons: open
          ? `<button class="btn ${s.player.coins < d.price ? 'disabled' : 'primary'}" data-mk="decor" data-id="${id}">Mua</button>`
          : '<span class="maxed">🍁 Mùa Thu</span>',
      });
    };
    const normal = Object.entries(DECOR).filter(([, d]) => !d.event && !d.luck && !d.weekly && !d.fun);
    const events = Object.entries(DECOR_EVENTS).map(([eid, ev]) => {
      const items = Object.entries(DECOR).filter(([, d]) => d.event === eid);
      const open = eventOpen(eid, season);
      return `<h3>${ev.icon} ${ev.name}${open ? ' <span class="tag-open">Đang mở bán!</span>' : ''}</h3>
        <p class="muted small">${ev.desc}${open ? '' : ' Hiện chưa tới Mùa Thu — xem lịch ở dự báo thời tiết.'}</p>${items.map(card).join('')}`;
    }).join('');
    return `<p class="muted small">Mua đồ rồi bấm 🎨 (bên trái) để <b>đặt ở bất kỳ đâu</b> quanh nông trại, tiệm và chợ. Bạn bè ghé thăm sẽ thấy, mỗi món có điểm xinh xắn 🎨.</p>`
      + events + '<h3>🪴 Đồ trang trí</h3>' + normal.map(card).join('');
  }

  land() {
    const s = this.save;
    const next = nextPlot(s);
    const rows = PLOT_UNLOCKS.map((p) => {
      const owned = ownedSlots(s).has(p.slot);
      const isNext = next && next.slot === p.slot;
      return this.card({
        icon: owned ? '🟫' : '🔒', name: `Lô đất số ${p.slot + 1}`,
        desc: owned ? 'Đã sở hữu' : isNext ? '9 ô đất mới để trồng thêm hoa' : 'Mở lô trước để mở lô này',
        price: owned ? null : p.price, lock: !owned && s.player.level < p.level ? p.level : 0,
        buttons: owned ? '<span class="maxed">✔ Của bạn</span>' : isNext ? `<button class="btn ${s.player.coins < p.price ? 'disabled' : 'primary'}" data-mk="buy" data-what="plot" data-id="${p.slot}">Mở rộng</button>` : '',
      });
    }).join('');
    const village = Object.entries(PARCELS).map(([id, P]) => {
      const owned = ownsParcel(s, id);
      const h = heartsOf(s, P.owner);
      const who = villagerInfo(P.owner)?.name || '';
      return this.card({
        icon: owned ? '🟫' : '🏘️', name: P.name,
        desc: owned ? 'Đã là của bạn' : `Chủ đất: ${who} · cần ${P.minHearts} ❤️ (đang có ${h})${s.player.level < P.level ? ` · cấp ${P.level}` : ''} · giá đổi theo ngày`,
        price: owned ? null : P.price, lock: 0,
        buttons: owned ? '<span class="maxed">✔ Của bạn</span>' : `<button class="btn" data-ld="open" data-id="${id}">Xem & hỏi mua</button>`,
      });
    }).join('');
    return `<p class="muted small">Bạn đang có ${s.farm.plots.length} lô đất (${s.farm.plots.length * 9} ô).</p>${rows}
      <h3>🏘️ Đất của dân làng</h3><p class="muted small">Kết thân với chủ đất để họ chịu bán. Chạm vào biển "Đất của…" quanh nông trại hoặc bấm nút dưới đây.</p>${village}`;
  }

  sell() {
    const stacks = Object.entries(this.save.inventory.flowers).filter(([, n]) => n > 0);
    if (!stacks.length) return '<p class="muted">Kho chưa có hoa để bán.</p>';
    return `<p class="muted small">Thương lái mua sỉ với giá thấp (khoảng một nửa). Bán cho khách ở Tiệm Hoa sẽ lời hơn và được uy tín.</p>` + stacks.map(([k, n]) => {
      const f = variants.parseFlowerKey(k);
      const each = wholesalePrice(k);
      return this.card({
        icon: FLOWERS[f.species].icon, name: `${variants.variantName(f.species, f.variant)} ${'★'.repeat(f.q)}`, desc: `${each} 💰 / cành`, owned: n,
        buttons: `<button class="btn" data-mk="sell1" data-k="${k}">Bán 1</button><button class="btn primary" data-act="sell" data-k="${k}" data-n="${n}" data-total="${each * n}">Bán hết</button>`,
      });
    }).join('');
  }

  onAction(act, el) {
    const g = this.game;
    if (act === 'tab') { this.tab = el.dataset.id; this.render(); return; }
    if (act === 'shoptier') {
      if (el.classList.contains('disabled')) { const i = goals.shopUpgradeInfo(this.save); g.toast(i.next ? `Chưa đủ điều kiện: ${i.checks.filter((c) => !c.ok).map((c) => c.text).join(', ')}` : 'Đã tối đa', 'warn'); return; }
      g.upgradeShop(); this.render(true); return;
    }
    if (act === 'buy') {
      if (el.classList.contains('disabled')) { g.toast('Không đủ tiền 💰', 'warn'); return; }
      g.buy(el.dataset.what, el.dataset.id, +(el.dataset.n || 1));
      if (el.dataset.what === 'plot') { this.hud.closeModal(); return; }
      this.render(true);
      return;
    }
    if (act === 'machine') { g.buyMachine(el.dataset.kind, +el.dataset.id); this.render(true); return; }
    if (act === 'decor') { g.buyDecor(el.dataset.id); this.render(true); return; }
    if (act === 'sell1') {
      g.sellWholesale(el.dataset.k, 1);
      this.render(true);
    }
  }
}
