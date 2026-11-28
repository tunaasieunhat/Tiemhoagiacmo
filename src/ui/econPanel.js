// 📈 Chợ & Quần đảo: giá chợ 7 ngày · tin đồn · chuỗi cung ứng các đảo. Nút điều khiển: data-ec
import { FLOWERS } from '../../data/flowers.js';
import { ISLANDS, SUPPLY_RULES, PRICE } from '../../data/economy.js';
import * as econ from '../systems/economy.js';
import * as story from '../systems/story.js';
import { dayOf, calendarOf } from '../systems/calendar.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = (n) => Math.round(n).toLocaleString('vi-VN');
const WD = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const dayLabel = (d) => { const c = calendarOf(d); return `${WD[c.dayOfSeason % 7]} ${c.dayOfSeason}/${c.season.icon}`; };
const TABS = [
  { id: 'price', label: '📈 Giá chợ' },
  { id: 'rumor', label: '📰 Tin đồn' },
  { id: 'isle', label: '🏝️ Quần đảo' },
];

/** Biểu đồ đường nhỏ: quá khứ + hôm nay (liền), dự báo (đứt nét) */
function spark(pts, todayIdx) {
  const W = 120, H = 34, lo = PRICE.min, hi = Math.max(1.6, ...pts.map((p) => p.k));
  const x = (i) => 4 + (i / Math.max(1, pts.length - 1)) * (W - 8), y = (k) => H - 4 - ((k - lo) / (hi - lo)) * (H - 8);
  const line = (a, b) => pts.slice(a, b + 1).map((p, j) => `${j ? 'L' : 'M'}${x(a + j).toFixed(1)} ${y(p.k).toFixed(1)}`).join(' ');
  const base = y(1);
  return `<svg class="ec-spark" viewBox="0 0 ${W} ${H}"><line x1="0" x2="${W}" y1="${base}" y2="${base}" stroke="#d9c9b8" stroke-dasharray="2 3"/>
    <path d="${line(0, todayIdx)}" stroke="#d9506f" stroke-width="2" fill="none"/><path d="${line(todayIdx, pts.length - 1)}" stroke="#d9506f" stroke-width="2" fill="none" stroke-dasharray="3 3" opacity=".7"/>
    <circle cx="${x(todayIdx)}" cy="${y(pts[todayIdx].k)}" r="3.2" fill="#d9506f"/></svg>`;
}

export class EconPanel {
  constructor(hud) {
    this.hud = hud;
    this.game = hud.game;
    this.tab = 'price';
  }
  get save() { return this.game.save; }
  has = (f) => story.has(this.save, f);

  open(tab = null) { if (tab) this.tab = tab; this.render(); }

  render(keep = false) {
    const top = keep ? this.hud.scrollBox()?.scrollTop || 0 : 0;
    const s = this.save;
    econ.ensureCycles(s, dayOf(this.game.now), this.has);
    const head = `<div class="mk-wallet"><span>💰 <b>${money(s.player.coins)}</b></span><span>📅 ${esc(dayLabel(dayOf(this.game.now)))}</span></div>`;
    const tabs = `<div class="mk-tabs" role="tablist">${TABS.map((t) => `<button class="${t.id === this.tab ? 'on' : ''}" data-ec="tab" data-id="${t.id}" role="tab">${t.label}</button>`).join('')}</div>`;
    const body = { price: () => this.price(), rumor: () => this.rumor(), isle: () => this.isles() }[this.tab]();
    this.hud.openModal('econ', `<h2>📈 Chợ & Quần đảo</h2>${head}${tabs}<div class="mk-body ec-body">${body}</div>`, 'wide');
    if (keep) { const box = this.hud.scrollBox(); if (box) box.scrollTop = top; }
  }

  price() {
    const s = this.save, today = dayOf(this.game.now);
    const ids = this.game.unlockedFlowers();
    const stock = {};
    for (const [k, n] of Object.entries(s.inventory.flowers)) if (n > 0) { const sp = k.split(':')[0]; stock[sp] = (stock[sp] || 0) + n; }
    const rows = ids.map((id) => {
      const pts = econ.priceChart(id, today), ti = pts.findIndex((p) => p.day === today);
      const k = pts[ti].k, prev = pts[ti - 1]?.k ?? k, fut = Math.max(...pts.slice(ti + 1).map((p) => p.k), 0);
      const trend = k > prev + 0.04 ? '<b class="up">▲</b>' : k < prev - 0.04 ? '<b class="down">▼</b>' : '<b>▬</b>';
      const tip = fut > k + 0.15 ? '⏳ dự báo sắp lên — có thể giữ hàng' : k >= 1.3 ? '💰 đang giá tốt — nên bán' : k <= 0.75 ? '📉 đang rẻ — đừng bán vội' : '';
      return { k, html: `<div class="mk-item ec-row"><div class="mk-icon">${FLOWERS[id].icon}</div><div class="mk-info"><b>${esc(FLOWERS[id].name)} ${trend} <small class="${k >= 1 ? 'up' : 'down'}">×${k.toFixed(2)}</small></b>
        <small>${stock[id] ? `Kho: ${stock[id]} cành · ` : ''}${tip}</small></div>${spark(pts, ti)}</div>` };
    }).sort((a, b) => b.k - a.k).map((r) => r.html).join('');
    return `<p class="muted small">Giá bán sỉ mỗi loài lên xuống theo ngày: sóng giá riêng, đúng mùa thì rẻ (nhiều người trồng), trái mùa thì đắt, lễ hội & tin đồn làm giá vọt. Đường liền = đã qua, đứt nét = dự báo (tin đồn chưa nghe thì chưa tính). Bán sỉ ở 🏪 Chợ › Bán sỉ hoặc 🎒 Kho.</p>${rows}`;
  }

  rumor() {
    const today = dayOf(this.game.now);
    const list = econ.recentRumors(today, 5);
    if (!list.length) return '<p class="note">Mấy hôm nay chợ yên ắng, chưa có tin đồn gì. Ngày mai ghé lại nghe ngóng nhé!</p>';
    return `<p class="muted small">Dân buôn rỉ tai nhau những tin này. Chuẩn bị hàng trước để bán đúng ngày giá vọt!</p>` + list.map((r) => {
      const when = r.target === today ? '<b class="up">HÔM NAY</b>' : r.target < today ? 'đã qua' : `${r.target - today} ngày nữa (${esc(dayLabel(r.target))})`;
      const isl = ISLANDS[r.island];
      return `<div class="mk-item"><div class="mk-icon">${r.kind === 'up' ? '📈' : '📉'}</div><div class="mk-info"><b>${isl.icon} ${esc(r.text.replace('{ngày}', r.target === today ? 'hôm nay' : dayLabel(r.target)))}</b>
        <small>${when} · giá ×${r.mult} · ${r.species.slice(0, 8).map((f) => FLOWERS[f].icon).join('')}</small></div></div>`;
    }).join('');
  }

  isles() {
    const s = this.save, today = dayOf(this.game.now);
    const rows = Object.entries(ISLANDS).map(([id, I]) => {
      if (!econ.islandOpen(s, id, this.has)) return `<div class="mk-item locked"><div class="mk-icon">${I.icon}</div><div class="mk-info"><b>${esc(I.name)}</b><small>🔒 Chưa tới được đảo này</small></div></div>`;
      const st = econ.E(s).supply[id] || { pts: 0, reqs: [] }, lv = econ.islandLevel(s, id);
      const next = SUPPLY_RULES.levels[lv + 1], base = SUPPLY_RULES.levels[lv];
      const reqs = st.reqs.map((r, i) => {
        const g = r.done ? null : econ.findGoods(s, r);
        return `<div class="ec-req ${r.done ? 'done' : ''}"><span>${r.done ? '✔' : '📦'} ${esc(econ.reqText(r))}</span>${r.done ? '' : `<button class="btn ${g.ok ? 'primary' : 'disabled'}" data-ec="give" data-id="${id}" data-i="${i}">Giao${g.ok ? ` (+${money(g.value * SUPPLY_RULES.coinsPer)} 💰)` : ''}</button>`}</div>`;
      }).join('');
      return `<div class="mk-item ec-isle"><div class="mk-icon">${I.icon}</div><div class="mk-info"><b>${esc(I.name)} <small class="muted">cấp ${lv} · ${esc(SUPPLY_RULES.levelNames[lv])}</small></b>
        <div class="track sm"><i style="width:${next ? Math.min(100, ((st.pts - base) / (next - base)) * 100) : 100}%;background:#7cc27f"></i></div>
        <small>${st.pts} điểm${next ? ` · cấp sau: ${next}` : ' · tối đa'} · Ưu đãi: ${esc(I.perk.text)}${lv ? ` (+${Math.round(I.perk.perLevel * lv * 100)}%)` : ''}</small>
        <div class="ec-reqs">${reqs}</div></div></div>`;
    }).join('');
    return `<p class="muted small">Mỗi đảo cần hàng theo chu kỳ ${SUPPLY_RULES.cycleDays} ngày (còn <b>${econ.cycleLeft(today)}</b> ngày). Giao đều đặn thì đảo phát triển và cho bạn ưu đãi; bỏ cả chu kỳ không giao gì thì đảo vắng dần (−${SUPPLY_RULES.decay}). Hàng giao được trả ${Math.round(SUPPLY_RULES.coinsPer * 100)}% giá trị.</p>${rows}`;
  }

  onAction(act, el) {
    const g = this.game, id = el.dataset.id;
    if (el.classList.contains('disabled')) { if (act === 'give') g.toast('Kho chưa đủ hàng cho yêu cầu này', 'warn'); return; }
    switch (act) {
      case 'tab': this.tab = id; break;
      case 'give': g.econDeliver(id, el.dataset.i); break;
    }
    this.render(act !== 'tab');
  }
}
