// Nhiệm vụ ngày / tuần
import * as quests from '../systems/quests.js';
import { calendarOf, dayOf } from '../systems/calendar.js';
import { formatDuration } from '../systems/time.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export class QuestsPanel {
  constructor(hud) {
    this.hud = hud;
    this.game = hud.game;
  }

  open() { this.render(); }

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
    this.hud.openModal('quests', `
      <h2>📋 Nhiệm vụ</h2>
      <h3>Hôm nay <small class="muted">· làm mới sau ${formatDuration(toDayEnd)}</small></h3>
      <div class="mk-body">${block('daily') || '<p class="muted">Chưa có nhiệm vụ.</p>'}</div>
      <h3>Tuần này <small class="muted">· ${cal.season.name} · làm mới sau ${formatDuration(toWeekEnd)}</small></h3>
      <div class="mk-body">${block('weekly') || '<p class="muted">Chưa có nhiệm vụ.</p>'}</div>
      <p class="muted small">1 ngày game = 24 phút thật, 1 tuần game = 7 ngày game. Cấp càng cao, nhiệm vụ càng khó và thưởng càng lớn.</p>`);
  }

  onAction(act, el) {
    if (act === 'claim') { this.game.claimQuest(el.dataset.kind, +el.dataset.i); this.render(); }
  }
}
