// 🗓️ Sổ quản lý (GĐ25): Hôm nay (kế hoạch + lịch tuần + thuyền buôn) · Tiệc · Chi nhánh · Nhân viên
import { WEEKDAYS, PLAN_RULES, TRADER } from '../../data/plan.js';
import { PARTY_ITEMS, VENUES, OCCASIONS, PARTY_RULES } from '../../data/party.js';
import { BRANCHES, BRANCH_RULES } from '../../data/branch.js';
import { STAFF, STAFF_RULES, TRAITS } from '../../data/automation.js';
import { MEANINGS } from '../../data/variants.js';
import { TONES } from '../../data/shop.js';
import { FLOWERS } from '../../data/flowers.js';
import * as automation from '../systems/automation.js';
import * as partySys from '../systems/party.js';
import * as branchSys from '../systems/branch.js';
import * as relations from '../systems/relations.js';
import { villagerInfo } from '../systems/village.js';
import { variantName, parseVkey } from '../systems/variants.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = (n) => Math.round(n).toLocaleString('vi-VN');
const vname = (vk) => { if (!vk) return ''; const { species, variant } = parseVkey(vk); return `${FLOWERS[species]?.icon || '🌸'} ${variantName(species, variant)}`; };
const favName = (k) => (!k ? '' : k.includes(':') ? vname(k) : `${FLOWERS[k]?.icon || ''} ${FLOWERS[k]?.name || k}`);
const who = (id) => villagerInfo(id)?.name || id;
const bar = (v, max, color = '#7cc27f') => `<div class="track sm"><i style="width:${Math.max(0, Math.min(100, (v / Math.max(1, max)) * 100))}%;background:${color}"></i></div>`;

const TABS = [
  { id: 'today', label: '📅 Hôm nay' },
  { id: 'party', label: '🎉 Tiệc' },
  { id: 'branch', label: '🏪 Chi nhánh' },
  { id: 'staff', label: '👥 Nhân viên' },
];

export class ManagePanel {
  constructor(hud) {
    this.hud = hud;
    this.game = hud.game;
    this.tab = 'today';
    this.shipTo = null;   // chi nhánh đang chọn hàng gửi
    this.shipSel = {};    // { mã: số }
    hud.game.emitter.on('manage', (e) => {
      if (e?.tab) { this.open(e.tab, e); return; }
      if (this.hud.modal === 'manage') this.render(true);
    });
  }

  get save() { return this.game.save; }

  open(tab = null, opt = {}) {
    if (tab) this.tab = tab;
    if (opt.id && tab === 'branch') this.focusBranch = opt.id;
    this.render();
  }

  render(keepScroll = false) {
    const top = keepScroll ? this.hud.scrollBox()?.scrollTop || 0 : 0;
    const s = this.save;
    const head = `<div class="mk-wallet"><span>💰 <b>${money(s.player.coins)}</b></span><span>💗 <b>${s.player.reputation}</b></span></div>`;
    const tabs = `<div class="mk-tabs" role="tablist">${TABS.map((t) => `<button class="${t.id === this.tab ? 'on' : ''}" data-ql="tab" data-id="${t.id}" role="tab">${t.label}</button>`).join('')}</div>`;
    const body = { today: () => this.today(), party: () => this.party(), branch: () => this.branches(), staff: () => this.staff() }[this.tab]();
    this.hud.openModal('manage', `<h2>🗓️ Sổ quản lý</h2>${head}${tabs}<div class="mk-body ql-body">${body}</div>`, 'wide');
    // ô chọn (select) dùng sự kiện change
    for (const el of this.hud.root.querySelectorAll('.m-manage select[data-ql]')) el.addEventListener('change', () => this.onAction(el.dataset.ql, el));
    if (keepScroll) { const box = this.hud.scrollBox(); if (box) box.scrollTop = top; }
  }

  // ---------------- 📅 Hôm nay ----------------
  today() {
    const v = this.game.planView();
    const dow = (WEEKDAYS.indexOf(v.wd));
    const week = `<div class="ql-week">${WEEKDAYS.map((d, i) => `<div class="ql-day ${i === dow ? 'on' : ''}" title="${esc(d.desc)}"><small>${['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'][i]}</small><span>${d.icon}</span></div>`).join('')}</div>
      <p class="ql-theme"><b>${v.wd.icon} ${esc(v.wd.name)} · ${esc(v.wd.theme)}</b><br><small>${esc(v.wd.desc)}</small></p>`;
    const tasks = v.tasks.length ? v.tasks.map((t) => `<div class="mk-item ql-task ${t.got ? 'done' : ''}">
        <div class="mk-icon">${t.got ? '✅' : t.T.icon}</div>
        <div class="mk-info"><b>${esc(t.text)}</b>${t.T.stat === 'talk' || t.T.stat === 'gift' ? '' : `<small>${t.have}/${t.n}</small>${bar(t.have, t.n)}`}</div>
        <div class="mk-buy"><span class="price">+${t.T.reward.coins} 💰 · ${t.T.reward.xp} XP</span></div></div>`).join('')
      : '<p class="muted">Kế hoạch sẽ có sau vài giây…</p>';
    const all = v.tasks.filter((t) => t.got).length;
    const bonus = `<p class="ql-bonus ${v.bonus ? 'done' : ''}">🌟 Xong cả ${PLAN_RULES.tasks} việc: +${PLAN_RULES.allDone.coins} 💰 +${PLAN_RULES.allDone.luck} 🎟️ ${v.bonus ? '— <b>Đã nhận!</b>' : `(${all}/${v.tasks.length})`}</p>`;
    let trader = '';
    if (v.trader) {
      trader = `<h3>🚢 Thuyền buôn (chỉ hôm nay)</h3><p class="muted small">Đậu ở cầu tàu phía đông Khu Mua Bán. Hạt màu hiếm khó lai tạo — mỗi món chỉ có ${TRADER.stock} hạt mỗi tuần.</p>`
        + v.trader.map((o) => `<div class="mk-item"><div class="mk-icon">${FLOWERS[o.sp].icon}</div><div class="mk-info"><b>Hạt ${esc(variantName(o.sp, o.v))}</b><small>${o.rarity === 'rare' ? '💎 Hiếm' : '✨ Ít gặp'} · còn ${o.left}</small></div>
          <div class="mk-buy"><span class="price">${money(o.price)} 💰</span><button class="btn ${o.left <= 0 || this.save.player.coins < o.price ? 'disabled' : 'primary'}" data-ql="trader" data-id="${o.vkey}">Mua</button></div></div>`).join('');
    }
    return `${week}<h3>📝 Kế hoạch hôm nay</h3>${tasks}${bonus}${trader}`;
  }

  // ---------------- 🎉 Tiệc ----------------
  party() {
    const g = this.game, s = this.save;
    if (!g.partyOpen()) return '<p class="muted">🔒 Mở khi đi tới chương 2 của truyện “Người mua đảo” (cần xong chương 3 truyện chính, cấp 10).</p>';
    const p = partySys.PT(s);
    const brief = (o) => `<small>${OCCASIONS[o.occ].icon} ${esc(OCCASIONS[o.occ].name)} · 📍 ${esc(VENUES[o.venue].name)}</small>
      <small>🎨 ${o.tones.map((t) => esc(TONES[t]?.name || t)).join(', ')} · 💬 ${o.meanings.map((m) => `${MEANINGS[m].icon} ${esc(MEANINGS[m].name)}`).join(', ')}</small>
      <small>${o.fav ? `😍 Thích: ${esc(favName(o.fav))}` : ''}${o.hate ? ` · 😣 Ghét: ${esc(favName(o.hate))}` : ''}</small>`;
    if (p.active) {
      const a = p.active;
      const sc = partySys.score(s, a);
      const slots = VENUES[a.venue].slots.map(([kind], i) => {
        const it = PARTY_ITEMS[kind];
        const ch = partySys.choicesFor(s, i).filter((c) => c.free >= c.need || c.vkey === a.design[i]);
        const opts = `<option value="">— để trống —</option>` + ch.map((c) => `<option value="${esc(c.vkey)}" ${c.vkey === a.design[i] ? 'selected' : ''}>${esc(vname(c.vkey))} (còn ${c.free})</option>`).join('');
        return `<div class="mk-item ql-slot ${a.design[i] ? 'filled' : ''}"><div class="mk-icon">${it.icon}</div>
          <div class="mk-info"><b>${esc(it.name)} <small>· cần ${it.n} bông</small></b>
          <select data-ql="slot" data-i="${i}" aria-label="Chọn hoa cho ${esc(it.name)}">${opts}</select></div></div>`;
      }).join('');
      const parts = sc.parts.map((x) => `<li class="${x.got < 0 ? 'bad' : ''}"><span>${esc(x.name)}</span><b>${x.got}${x.max ? `/${x.max}` : ''}</b><small>${esc(x.note)}</small></li>`).join('');
      const daysLeft = a.story ? null : a.deadline - g.today;
      return `<div class="ql-brief"><b>${OCCASIONS[a.occ].icon} ${esc(who(a.client))}: “${esc(OCCASIONS[a.occ].lines[0].replace('{who}', who(a.client)))}”</b>${brief(a)}
          <small>${daysLeft == null ? '💍 Hợp đồng cốt truyện — không có hạn chót' : `⏳ Còn ${daysLeft + 1} ngày · thưởng tới ${money(a.reward * 1.2)} 💰`}</small></div>
        <div class="ql-score"><div class="ql-total"><b>${sc.total}</b><small>điểm dự kiến</small></div><ul>${parts}</ul></div>
        <div class="ql-actions"><button class="btn" data-ql="look">👀 Xem tại chỗ</button>
          <button class="btn primary ${sc.ok ? '' : 'disabled'}" data-ql="submit">🎉 Trình khách</button>
          <button class="btn" data-ql="cancel">${a.story ? 'Để sau' : 'Hủy (−3 💗)'}</button></div>
        <p class="muted small">Chọn hoa cho từng chỗ (cần ít nhất ${PARTY_RULES.minFill} chỗ). Hoa chỉ bị lấy khỏi kho khi trình khách, bông nhiều sao được dùng trước.</p>${slots}`;
    }
    const offers = p.offers.length ? p.offers.map((o) => `<div class="mk-item ql-offer ${o.story ? 'story' : ''}"><div class="mk-icon">${OCCASIONS[o.occ].icon}</div>
        <div class="mk-info"><b>${esc(who(o.client))} · ${esc(OCCASIONS[o.occ].name)}${o.story ? ' 💍' : ''}</b>${brief(o)}</div>
        <div class="mk-buy"><span class="price">~${money(o.reward)} 💰</span><button class="btn primary" data-ql="accept" data-id="${o.id}">Nhận</button></div></div>`).join('')
      : '<p class="muted">Chưa có ai đặt tiệc. Mai ghé lại nhé (Thứ Sáu có thêm hợp đồng).</p>';
    const log = p.log.length ? `<h3>📜 Tiệc đã làm (${p.done} · cao nhất ${p.best} điểm)</h3>` + p.log.map((l) => `<p class="small">${OCCASIONS[l.occ].icon} ${esc(who(l.client))} — <b>${l.score}</b> điểm · +${money(l.coins)} 💰</p>`).join('') : '';
    return `<p class="muted small">Nhận hợp đồng ⇒ chọn hoa cho cổng hoa, bàn tiệc, đèn… ⇒ hoa hiện ra tại chỗ ⇒ trình khách. Điểm càng cao thưởng càng nhiều, khách càng thân.</p>${offers}${log}`;
  }

  // ---------------- 🏪 Chi nhánh ----------------
  branches() {
    const g = this.game, s = this.save;
    if (!g.branchOpen()) return '<p class="muted">🔒 Mở khi đi tới chương 3 của truyện “Người mua đảo”.</p>';
    const ctx = g.branchCtx();
    const cards = branchSys.BRANCH_IDS.map((id) => {
      const D = BRANCHES[id], br = branchSys.branchOf(s, id);
      const hearts = relations.heartsOf(s, D.manager);
      if (!br?.open) {
        const c = branchSys.canOpen(s, id, ctx);
        return `<div class="mk-item ql-branch"><div class="mk-icon">${D.icon}</div><div class="mk-info"><b>${esc(D.name)}</b>
          <small>Quản lý: ${esc(who(D.manager))} (${hearts}/${D.hearts} ❤️) · ${esc(D.desc)}</small>${c.ok ? '' : `<small class="bad">${esc(c.why)}</small>`}</div>
          <div class="mk-buy"><span class="price">${money(D.cost)} 💰</span><button class="btn ${c.ok ? 'primary' : 'disabled'}" data-ql="bopen" data-id="${id}" data-why="${esc(c.why || '')}">Mở quầy</button></div></div>`;
      }
      const stock = branchSys.stockCount(br), cap = branchSys.capacityOf(br), boat = branchSys.onBoat(s, id);
      const boats = s.branch.boats.filter((b) => b.id === id).map((b) => Math.max(0, Math.ceil((b.at - g.now) / 60)));
      const up = br.lvl < 3 ? BRANCH_RULES.upgrade[br.lvl] : null;
      const picker = this.shipTo === id ? this.shipPicker(id) : '';
      return `<div class="mk-item ql-branch open"><div class="mk-icon">${D.icon}</div><div class="mk-info"><b>${esc(D.name)} · cấp ${br.lvl}</b>
          <small>👤 ${esc(who(D.manager))} ${'❤️'.repeat(Math.min(5, hearts))} · bán ~${(BRANCH_RULES.salesPerHour[br.lvl - 1] * (1 + BRANCH_RULES.heartBonus * hearts)).toFixed(1)} món/giờ (7h–21h)</small>
          <small>📦 Kho ${stock}/${cap}${boat ? ` · ⛵ ${boat} món đang tới (${boats.map((h) => `${h} giờ`).join(', ')})` : ''} · đã bán ${br.sold} món</small>
          <small>💰 Két: <b>${money(br.till)}</b> · tổng thu ${money(br.earned || 0)}</small>${stock ? '' : '<small class="bad">Hết hàng! Gửi thêm để quầy bán tiếp.</small>'}</div>
          <div class="mk-buy ql-bbtns"><button class="btn ${br.till ? 'primary' : 'disabled'}" data-ql="collect" data-id="${id}">Thu tiền</button>
          <button class="btn" data-ql="shipopen" data-id="${id}">${this.shipTo === id ? 'Đóng' : '⛵ Gửi hàng'}</button>
          ${up ? `<button class="btn ${s.player.coins >= up ? '' : 'disabled'}" data-ql="bup" data-id="${id}">⬆️ ${money(up)} 💰</button>` : ''}
          <button class="btn" data-ql="blook" data-id="${id}">👀</button></div></div>${picker}`;
    }).join('');
    const cw = automation.workerOf(s, 'courier');
    return `<p class="muted small">Gửi hoa (hoặc hàng Tiệm Hương Nhài) bằng thuyền, quầy tự bán theo giờ. Mỗi ❤️ với người quản lý giúp bán thêm 10%. ${cw ? `🚚 ${esc(cw.name)} đang tự gửi hàng khi quầy còn dưới ${BRANCH_RULES.autoBelow} món.` : 'Thuê 🚚 người giao hàng (thẻ Nhân viên) để tự gửi hàng.'}${this.game.shipMult() < 1 ? ` Thuyền đi nhanh ×${(1 / this.game.shipMult()).toFixed(1)} hôm nay.` : ''}</p>${cards}`;
  }

  shipPicker(id) {
    const list = branchSys.shippable(this.save, id).slice(0, 30);
    const total = Object.values(this.shipSel).reduce((a, n) => a + n, 0);
    const rows = list.length ? list.map((x) => {
      const n = this.shipSel[x.key] || 0;
      return `<div class="ql-ship-row"><span>${x.label.icon} ${esc(x.label.name)} ${'★'.repeat(x.label.q)} <small>×${x.have}</small>${x.demand > 1 ? ' <small class="good">🔥 bán chạy</small>' : ''}</span>
        <small>${money(x.price)} 💰</small>
        <span class="ql-qty"><button class="btn sm" data-ql="q" data-k="${esc(x.key)}" data-d="-5">−5</button><button class="btn sm" data-ql="q" data-k="${esc(x.key)}" data-d="-1">−</button><b>${n}</b><button class="btn sm" data-ql="q" data-k="${esc(x.key)}" data-d="1" data-max="${x.have}">+</button><button class="btn sm" data-ql="q" data-k="${esc(x.key)}" data-d="5" data-max="${x.have}">+5</button></span></div>`;
    }).join('') : '<p class="muted small">Kho trống. Thu hoạch hoa hoặc làm hàng ở Tiệm Hương Nhài trước.</p>';
    return `<div class="ql-ship">${rows}<div class="ql-actions"><button class="btn" data-ql="shipauto" data-id="${id}">✨ Tự chọn</button>
      <button class="btn primary ${total ? '' : 'disabled'}" data-ql="ship" data-id="${id}">⛵ Gửi ${total} món</button></div></div>`;
  }

  // ---------------- 👥 Nhân viên ----------------
  staff() {
    const g = this.game, s = this.save;
    const week = g.staffWeek();
    const roles = Object.entries(STAFF).map(([role, R]) => {
      if (s.player.level < R.level) return `<h3>${R.icon} ${esc(R.name)}</h3><p class="muted small">🔒 Mở ở cấp ${R.level}. ${esc(R.desc)}</p>`;
      const w = automation.workerOf(s, role);
      if (!w) {
        const cands = automation.candidates(s, role, week).map((c) => `<div class="mk-item ql-cand"><div class="mk-icon">${c.skill >= 7 ? '🌟' : '🙂'}</div>
          <div class="mk-info"><b>${esc(c.name)} · tay nghề ${c.skill}/10</b>${bar(c.skill, 10, c.skill >= 7 ? '#e0a21a' : '#7cc27f')}
          <small>${esc(TRAITS[c.trait].name)}: ${esc(TRAITS[c.trait].desc)}</small>
          <small>Lương cứng ${money(c.wage)} 💰/ngày · làm mỗi ~${automation.intervalOf(role, { skill: c.skill, trait: c.trait, mood: 70 })} phút</small></div>
          <div class="mk-buy"><span class="price">Phí tuyển ${money(c.wage * STAFF_RULES.hireFeeDays)} 💰</span><button class="btn ${s.player.coins >= c.wage * STAFF_RULES.hireFeeDays ? 'primary' : 'disabled'}" data-ql="hire" data-role="${role}" data-i="${c.idx}">Thuê</button></div></div>`).join('');
        return `<h3>${R.icon} ${esc(R.name)} — chưa có người</h3><p class="muted small">${esc(R.desc)} Ứng viên đổi mỗi tuần (7 ngày game).</p>${cands}`;
      }
      const fixed = automation.fixedWage(role, w.skill, w.trait);
      const now = automation.wageToday(role, w);
      const y = w.yesterday;
      const plan = role === 'gardener' ? this.plotPlans() : '';
      return `<h3>${R.icon} ${esc(R.name)}: ${esc(w.name)}${w.active ? '' : ' <span class="bad">(đang nghỉ — nợ lương)</span>'}</h3>
        <div class="mk-item ql-worker"><div class="mk-info">
          <b>Tay nghề ${w.skill}/10 · ${esc(TRAITS[w.trait]?.name || '')}</b>${bar(w.xp || 0, STAFF_RULES.xpPerSkill * w.skill, '#c79cf2')}
          <small>Kinh nghiệm ${Math.floor(w.xp || 0)}/${STAFF_RULES.xpPerSkill * w.skill} việc để lên tay nghề ${Math.min(10, w.skill + 1)} · làm mỗi ~${automation.intervalOf(role, w)} phút</small>
          <small>Tâm trạng ${w.mood ?? 70}/100 ${(w.mood ?? 70) >= 70 ? '😊' : (w.mood ?? 70) >= 40 ? '😐' : '😞'}</small>${bar(w.mood ?? 70, 100, '#f6a6b9')}
          <small>Hôm nay: ${w.today?.jobs || 0} việc${w.today?.earned ? ` · bán được ${money(w.today.earned)} 💰` : ''} · lương sẽ trả ${money(now)} 💰</small>
          ${y ? `<small>Hôm qua: ${y.jobs} việc · đã trả ${money(y.wage)} 💰</small>` : ''}
        </div></div>
        <div class="ql-pay"><span>Trả lương:</span>
          <button class="btn sm ${w.pay !== 'perf' ? 'primary' : ''}" data-ql="pay" data-role="${role}" data-id="fixed">Cứng ${money(fixed)}/ngày</button>
          <button class="btn sm ${w.pay === 'perf' ? 'primary' : ''}" data-ql="pay" data-role="${role}" data-id="perf">Theo hiệu suất: ${money(Math.round(fixed * 0.4))} + ${automation.commission(role, w.skill)}/việc</button></div>
        <div class="ql-actions">${w.active ? `<button class="btn" data-ql="bonus" data-role="${role}">🎁 Thưởng ${money(fixed)} 💰</button>` : `<button class="btn primary" data-ql="rehire" data-role="${role}">Trả nợ & gọi lại</button>`}
          <button class="btn" data-ql="fire" data-role="${role}">Cho nghỉ</button></div>${plan}`;
    }).join('');
    return `<p class="muted small">Tay nghề tăng khi làm việc ⇒ làm nhanh hơn, làm được nhiều việc hơn, và <b>lương cứng tăng theo năng lực</b>. Trả theo hiệu suất: lương thấp hơn khi ít việc, cao hơn khi làm nhiều. Lương trả đầu mỗi ngày game; không đủ tiền thì nhân viên tạm nghỉ, nợ ${STAFF_RULES.unpaidQuit} ngày thì nghỉ hẳn.</p>${roles}`;
  }

  /** Kế hoạch gieo từng lô cho người làm vườn */
  plotPlans() {
    const s = this.save;
    const plan = automation.A(s).plan;
    const seeds = Object.keys(s.inventory.seeds).filter((k) => s.inventory.seeds[k] > 0 && FLOWERS[k.split(':')[0]]);
    const rows = s.farm.plots.map((p, i) => {
      const cur = plan[i] || 'same';
      const opts = [['same', '🔁 Gieo lại loài cũ (ô mới: tự chọn)'], ['auto', '✨ Tự chọn hạt đúng mùa, giá cao'], ...seeds.map((k) => [k, `🌱 ${vname(k)} (${s.inventory.seeds[k]})`])];
      if (!opts.some(([k]) => k === cur)) opts.push([cur, `🌱 ${vname(cur)} (hết hạt)`]);
      return `<div class="ql-plan"><span>Lô ${i + 1}</span><select data-ql="plan" data-i="${i}" aria-label="Kế hoạch gieo lô ${i + 1}">${opts.map(([k, l]) => `<option value="${esc(k)}" ${k === cur ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></div>`;
    }).join('');
    return `<details class="ql-plans" open><summary>🌱 Kế hoạch gieo của từng lô</summary>${rows}<p class="muted small">Tay nghề 3+: tự bón phân · 5+: tự chữa bệnh (cần có phân/thuốc trong kho). Người làm vườn còn tưới ô khô và bắt sâu giúp.</p></details>`;
  }

  // ---------------- xử lý bấm ----------------
  onAction(act, el) {
    const g = this.game;
    const id = el.dataset.id, role = el.dataset.role;
    if (el.classList.contains('disabled') && el.tagName === 'BUTTON') {
      if (act === 'bopen' && el.dataset.why) g.toast(el.dataset.why, 'warn');
      else if (act === 'submit') g.toast(`Cần trang trí ít nhất ${PARTY_RULES.minFill} chỗ`, 'warn');
      else g.toast('Chưa được (không đủ tiền hoặc chưa đủ điều kiện)', 'warn');
      return;
    }
    switch (act) {
      case 'tab': this.tab = id; this.shipTo = null; this.render(); return;
      case 'trader': g.buyTrader(id); break;
      case 'accept': g.partyAccept(+id); break;
      case 'slot': g.partySet(+el.dataset.i, el.value || null); break;
      case 'look': this.hud.closeModal(); g.partyLook(); return;
      case 'submit':
        if (!el.dataset.armed) { el.dataset.armed = '1'; el.textContent = 'Bấm lần nữa để trình'; setTimeout(() => { delete el.dataset.armed; el.textContent = '🎉 Trình khách'; }, 3000); return; }
        g.partySubmit(); break;
      case 'cancel':
        if (!el.dataset.armed) { el.dataset.armed = '1'; el.textContent = 'Chắc chưa?'; setTimeout(() => { delete el.dataset.armed; }, 3000); return; }
        g.partyCancel(); break;
      case 'bopen': g.branchOpenAt(id); break;
      case 'bup': g.branchUpgrade(id); break;
      case 'collect': g.branchCollect(id); break;
      case 'blook': this.hud.closeModal(); g.branchLook(id); return;
      case 'shipopen': this.shipTo = this.shipTo === id ? null : id; this.shipSel = {}; break;
      case 'q': {
        const k = el.dataset.k, max = +(el.dataset.max || Infinity);
        const total = Object.values(this.shipSel).reduce((a, n) => a + n, 0);
        const d = +el.dataset.d;
        let n = Math.max(0, (this.shipSel[k] || 0) + d);
        if (d > 0) n = Math.min(n, max, (this.shipSel[k] || 0) + (BRANCH_RULES.shipMax - total));
        if (n) this.shipSel[k] = n; else delete this.shipSel[k];
        break;
      }
      case 'shipauto': {
        const w = automation.workerOf(this.save, 'courier');
        this.shipSel = branchSys.autoPack(this.save, id, w?.skill || 4) || {};
        if (!Object.keys(this.shipSel).length) g.toast('Không còn hàng hợp lý để gửi (hoặc kho chi nhánh đã đầy)', 'info');
        break;
      }
      case 'ship': { const r = g.branchShip(id, this.shipSel); if (r.ok) { this.shipSel = {}; this.shipTo = null; } break; }
      case 'hire': g.hireStaff(role, +el.dataset.i); break;
      case 'pay': g.staffAction(role, 'pay', id); break;
      case 'bonus': g.staffAction(role, 'bonus'); break;
      case 'rehire': g.staffAction(role, 'rehire'); break;
      case 'fire':
        if (!el.dataset.armed) { el.dataset.armed = '1'; el.textContent = 'Chắc chưa?'; setTimeout(() => { delete el.dataset.armed; el.textContent = 'Cho nghỉ'; }, 3000); return; }
        g.fireStaff(role); break;
      case 'plan': g.setPlotPlan(+el.dataset.i, el.value); g.toast(`🌱 Lô ${+el.dataset.i + 1}: đã đổi kế hoạch gieo`, 'info'); break;
      default: return;
    }
    if (this.hud.modal === 'manage') this.render(true);
  }
}
