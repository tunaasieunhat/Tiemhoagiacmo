// Nhiệm vụ ngày / tuần
import * as quests from '../systems/quests.js';
import { calendarOf, dayOf } from '../systems/calendar.js';
import { formatDuration } from '../systems/time.js';
import * as orders from '../systems/orders.js';
import { ORDER_RULES } from '../../data/orders.js';
import { FLOWERS } from '../../data/flowers.js';
import * as goals from '../systems/goals.js';
import { ACH_TIERS } from '../../data/achievements.js';
import { EVENT_MILESTONES, EVENT_POINTS, EVENT_RULES } from '../../data/events.js';
import { DECOR } from '../../data/decor.js';

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
    const nEv = goals.claimableEvent(s), nAch = goals.claimableAch(s);
    const pill = (n) => (n ? ` <span class="pill">${n}</span>` : '');
    const tabs = `<div class="mk-tabs"><button class="${tab === 'quests' ? 'on' : ''}" data-q="tab" data-id="quests">📋 Nhiệm vụ</button><button class="${tab === 'orders' ? 'on' : ''}" data-q="tab" data-id="orders">📦 Đơn hàng${pill(nOrd)}</button><button class="${tab === 'event' ? 'on' : ''}" data-q="tab" data-id="event">📅 Sự kiện${pill(nEv)}</button><button class="${tab === 'ach' ? 'on' : ''}" data-q="tab" data-id="ach">🏅 Thành tựu${pill(nAch)}</button></div>`;
    const body = tab === 'orders' ? this.ordersHtml() : tab === 'event' ? this.eventHtml() : tab === 'ach' ? this.achHtml() : `
      <h3>Hôm nay <small class="muted">· làm mới sau ${formatDuration(toDayEnd)}</small></h3>
      <div class="mk-body">${block('daily') || '<p class="muted">Chưa có nhiệm vụ.</p>'}</div>
      <h3>Tuần này <small class="muted">· ${cal.season.name} · làm mới sau ${formatDuration(toWeekEnd)}</small></h3>
      <div class="mk-body">${block('weekly') || '<p class="muted">Chưa có nhiệm vụ.</p>'}</div>
      <p class="muted small">1 ngày game = 24 phút thật, 1 tuần game = 7 ngày game. Cấp càng cao, nhiệm vụ càng khó và thưởng càng lớn.</p>`;
    this.hud.openModal('quests', `<h2>📋 Nhiệm vụ</h2>${tabs}${body}`);
  }

  /** 📅 Sự kiện tuần (GĐ18) */
  eventHtml() {
    const s = this.game.save;
    if (s.player.level < EVENT_RULES.unlockLevel) return `<div class="empty-shop">📅<p>Sự kiện tuần mở ở cấp ${EVENT_RULES.unlockLevel}.</p></div>`;
    const { ev, theme, round } = goals.ensureEvent(s);
    const left = Math.max(0, round.endsAt - Date.now());
    const d = Math.floor(left / 86400000), h = Math.floor((left % 86400000) / 3600000);
    const max = EVENT_MILESTONES[EVENT_MILESTONES.length - 1].pts;
    const miles = EVENT_MILESTONES.map((m, i) => {
      const got = ev.claimed.includes(i), can = ev.pts >= m.pts && !got;
      const rw = m.reward.eventDecor ? `${DECOR[theme.decor]?.icon || '🎁'} ${DECOR[theme.decor]?.name || 'Đồ sự kiện'}${m.reward.coins ? ` + ${m.reward.coins} 💰` : ''}` : goals.rewardText(m.reward);
      return `<div class="ev-mile ${got ? 'got' : can ? 'can' : ''}"><b>${m.pts}</b><span>${rw}</span>${got ? '<i>✔</i>' : can ? `<button class="btn primary" data-q="evclaim" data-i="${i}">Nhận</button>` : '<i>🔒</i>'}</div>`;
    }).join('');
    const P = EVENT_POINTS;
    return `<div class="ev-head" style="--ec:${theme.color}"><span class="ev-icon">${theme.icon}</span><div><b>${esc(theme.name)}</b><small>${esc(theme.desc)}</small>
        <small>⏳ Còn ${d} ngày ${h} giờ (tuần thật, giờ Việt Nam) · Loài tính điểm: ${theme.flowers.map((f) => FLOWERS[f].icon + ' ' + esc(FLOWERS[f].name)).join(', ')}</small></div></div>
      <div class="ev-bar"><div class="track"><i style="width:${Math.min(100, (ev.pts / max) * 100)}%;background:${theme.color}"></i></div><b>${ev.pts} điểm</b></div>
      <div class="ev-miles">${miles}</div>
      <p class="muted small">Cách tích điểm: thu hoạch hoa chủ đề +${P.harvestTheme}/bông · bán cho khách +${P.sellTheme}/cành · bó hoa có hoa chủ đề +${P.bouquetTheme} · khách cực kỳ hài lòng +${P.perfect} · bắt sâu +${P.bug}${theme.bugMult ? ` (×${theme.bugMult} tuần này)` : ''} · giao đơn hàng +${P.order} · giúp dân làng +${P.favor}. Đã về đích ${ev.completed || 0} tuần.</p>`;
  }

  /** 🏅 Thành tựu & danh hiệu (GĐ18) */
  achHtml() {
    const s = this.game.save;
    const list = goals.achList(s);
    const cur = goals.titleOf(s);
    const titles = goals.titlesOf(s);
    const cards = list.map((x) => {
      const a = x.a;
      const medals = ACH_TIERS.map((t, i) => `<span class="md ${i < x.reached ? 'on' : ''}" title="${t.name}">${i < x.reached ? t.icon : '⚪'}</span>`).join('');
      const nextN = x.next;
      const pct = nextN ? Math.min(100, (x.value / nextN) * 100) : 100;
      const can = x.claimed < x.reached;
      return `<div class="mk-item ach ${can ? 'can' : ''}">
        <div class="mk-icon">${a.icon}</div>
        <div class="mk-info"><b>${esc(a.name)}</b><small>${esc(a.desc.replace('{n}', (nextN ?? a.n[2]).toLocaleString('vi-VN')))}</small>
          <div class="ach-row"><span class="mds">${medals}</span><small>${x.value.toLocaleString('vi-VN')}${nextN ? ` / ${nextN.toLocaleString('vi-VN')}` : ' · xong!'}</small></div>
          <div class="track sm"><i style="width:${pct}%;background:${ACH_TIERS[Math.min(2, x.reached)].color}"></i></div></div>
        <div class="mk-buy">${can ? `<button class="btn primary" data-q="achclaim" data-id="${a.id}">Nhận ${ACH_TIERS[x.claimed].icon}</button><small>${goals.rewardText(a.rewards[x.claimed])}</small>` : ''}</div>
      </div>`;
    }).join('');
    const titleSel = titles.length ? `<div class="title-row"><b>🎖️ Danh hiệu:</b>${titles.map((a) => `<button class="chip-btn ${cur?.id === a.id ? 'on' : ''}" data-q="title" data-id="${a.id}">${esc(a.title)}</button>`).join('')}<button class="chip-btn ${!cur ? 'on' : ''}" data-q="title" data-id="">Không đeo</button></div>`
      : '<p class="muted small">🎖️ Đạt huy chương 🥈 Bạc ở thành tựu bất kỳ để mở danh hiệu — bạn bè sẽ thấy khi ghé thăm nông trại của bạn.</p>';
    return `${titleSel}<p class="small">Huy chương: <b>${goals.medalCount(s)}</b> / ${list.length * 3}</p><div class="mk-body">${cards}</div>`;
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
    if (act === 'evclaim') { this.game.claimEventMilestone(+el.dataset.i); this.render(); }
    if (act === 'achclaim') { this.game.claimAchievement(el.dataset.id); this.render(); }
    if (act === 'title') { this.game.setTitle(el.dataset.id || null); this.render(); }
    if (act === 'deliver') { if (!el.classList.contains('disabled')) this.game.deliverOrder(+el.dataset.id); else this.game.toast('Kho chưa đủ hoa cho đơn này', 'warn'); this.render(); }
  }
}
