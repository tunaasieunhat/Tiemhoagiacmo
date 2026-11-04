// Nhiệm vụ ngày / tuần
import * as quests from '../systems/quests.js';
import { calendarOf, dayOf } from '../systems/calendar.js';
import { formatDuration } from '../systems/time.js';
import * as orders from '../systems/orders.js';
import { ORDER_RULES } from '../../data/orders.js';
import { FLOWERS } from '../../data/flowers.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export class QuestsPanel {
  constructor(hud) {
    this.hud = hud;
    this.game = hud.game;
  }

  open(tab) { if (tab) this.tab = tab; this.render(); }

  render() {
    const s = this.game.save;
    const now = this.game.now;
    const day = dayOf(now);
    const toDayEnd = day * 1440 - now;
    const toWeekEnd = (Math.ceil(day / 7) * 7) * 1440 - now;
    const block = (kind) => (s.quests?.[kind] || []).map((q, i) => {
      const t = quests.templateOf(kind, q.id);
      if (!t) return '';
      const done = q.progress >= q.n;
      const rw = quests.questReward(s, kind);
      return `<div class="mk-item quest ${q.claimed ? 'claimed' : done ? 'done' : ''}">
        <div class="mk-icon">${t.icon}</div>
        <div class="mk-info"><b>${esc(t.text.replace('{n}', q.n))}</b>
          <div class="track sm"><i style="width:${Math.round((q.progress / q.n) * 100)}%;background:${done ? '#7cc27f' : '#f6a6b9'}"></i></div>
          <small>${q.progress}/${q.n} · Thưởng ${rw.coins} 💰 + ${rw.xp} XP${rw.fertilizer ? ` + ${rw.fertilizer} 🧪` : ''}</small></div>
        <div class="mk-buy">${q.claimed ? '<span class="maxed">✔ Đã nhận</span>' : done ? `<button class="btn primary" data-q="claim" data-kind="${kind}" data-i="${i}">Nhận</button>` : ''}</div>
      </div>`;
    }).join('');
    const cal = calendarOf(day);
    const tab = this.tab || 'quests';
    const nOrd = (s.orders?.list || []).filter((o) => orders.canDeliver(s, o)).length;
    const tabs = `<div class="mk-tabs"><button class="${tab === 'quests' ? 'on' : ''}" data-q="tab" data-id="quests">📋 Nhiệm vụ</button><button class="${tab === 'orders' ? 'on' : ''}" data-q="tab" data-id="orders">📦 Đơn hàng${nOrd ? ` <span class="pill">${nOrd}</span>` : ''}</button></div>`;
    const body = tab === 'orders' ? this.ordersHtml() : `
      <h3>Hôm nay <small class="muted">· làm mới sau ${formatDuration(toDayEnd)}</small></h3>
      <div class="mk-body">${block('daily') || '<p class="muted">Chưa có nhiệm vụ.</p>'}</div>
      <h3>Tuần này <small class="muted">· ${cal.season.name} · làm mới sau ${formatDuration(toWeekEnd)}</small></h3>
      <div class="mk-body">${block('weekly') || '<p class="muted">Chưa có nhiệm vụ.</p>'}</div>
      <p class="muted small">1 ngày game = 24 phút thật, 1 tuần game = 7 ngày game. Cấp càng cao, nhiệm vụ càng khó và thưởng càng lớn.</p>`;
    this.hud.openModal('quests', `<h2>📋 Nhiệm vụ</h2>${tabs}${body}`);
  }

  /** 📦 Đơn hàng lớn có hạn chót (GĐ16) */
  ordersHtml() {
    const s = this.game.save;
    if (s.player.level < ORDER_RULES.unlockLevel) return `<div class="empty-shop">📦<p>Đơn hàng lớn mở ở cấp ${ORDER_RULES.unlockLevel}. Khách sẽ đặt trước nhiều hoa cho tiệc cưới, khai trương... thưởng rất lớn!</p></div>`;
    const now = this.game.now;
    const list = (s.orders?.list || []).map((o) => {
      const k = orders.kindOf(o);
      const ok = orders.canDeliver(s, o);
      const left = o.due - now;
      const lines = o.items.map((it) => {
        const have = orders.haveFor(s, it);
        return `<div class="ord-line ${have >= it.n ? 'ok' : ''}"><span>${FLOWERS[it.sp].icon} ${esc(FLOWERS[it.sp].name)} <i class="stars">${'★'.repeat(it.minQ)}</i>+</span><b>${Math.min(have, it.n)}/${it.n}</b></div>`;
      }).join('');
      return `<div class="mk-item ord ${ok ? 'done' : ''}">
        <div class="mk-icon">${k.icon}</div>
        <div class="mk-info"><b>${esc(k.name)}</b><small>Người đặt: ${esc(k.who)} · <span class="${left < 600 ? 'bad' : ''}">⏳ còn ${formatDuration(left)}</span></small>
          ${lines}
          <small>Thưởng: <b>${o.coins} 💰</b> + ${o.xp} XP${o.ticket ? ' + 1 🎟️' : ''} · trễ hạn: ${ORDER_RULES.failRep} 💗</small></div>
        <div class="mk-buy"><button class="btn ${ok ? 'primary' : 'disabled'}" data-q="deliver" data-id="${o.id}">📦 Giao</button></div>
      </div>`;
    }).join('');
    const next = Math.max(0, (s.orders?.nextAt || 0) - now);
    return `<div class="mk-body">${list || '<p class="muted">Chưa có đơn nào. Đơn mới sẽ đến sớm thôi!</p>'}</div>
      <p class="muted small">Đơn hàng cần nhiều hoa đạt số sao tối thiểu (dùng hoa trong kho, game tự lấy cành ít sao nhất trước). ${(s.orders?.list || []).length < ORDER_RULES.max ? `Đơn tiếp theo sau ~${formatDuration(next)}.` : ''} Đã giao ${s.orders?.done || 0} đơn.</p>`;
  }

  onAction(act, el) {
    if (act === 'claim') { this.game.claimQuest(el.dataset.kind, +el.dataset.i); this.render(); }
    if (act === 'tab') { this.tab = el.dataset.id; this.render(); }
    if (act === 'deliver') { if (!el.classList.contains('disabled')) this.game.deliverOrder(+el.dataset.id); else this.game.toast('Kho chưa đủ hoa cho đơn này', 'warn'); this.render(); }
  }
}
