// Bảng xếp hạng & Cuộc thi hoa
import { FLOWERS } from '../../data/flowers.js';
import { PAPERS, RIBBONS } from '../../data/wrapping.js';
import { MEANINGS } from '../../data/variants.js';
import { TONES } from '../../data/shop.js';
import { CONTEST } from '../../data/contest.js';
import { roundOf, previousRound, contestScore } from '../systems/contest.js';
import { PART_NAMES } from '../systems/bouquet.js';
import * as variants from '../systems/variants.js';
import * as ranking from '../online/ranking.js';
import { viError } from '../online/errors.js';
import { avatarSVG } from './avatar.js';
import { bouquetSVG } from './bouquetPreview.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const vdot = (sp, v) => `<i class="vdot" style="--c:${variants.variantData(sp, v).petal}"></i>`;
const MEDAL = ['🥇', '🥈', '🥉'];
const fmtLeft = (ms) => { const h = Math.max(0, Math.floor(ms / 3600000)); return h >= 24 ? `${Math.floor(h / 24)} ngày ${h % 24} giờ` : `${h} giờ ${Math.floor((ms % 3600000) / 60000)} phút`; };

export class RankPanel {
  constructor(hud) {
    this.hud = hud;
    this.game = hud.game;
    this.tab = 'board';
    this.board = 'level';
    this.period = 'week';
    this.scope = 'all';
    this.data = null;
    this.status = null;
    this.sel = null;
    this.result = null;
  }

  get online() { return !!(this.game.account?.configured && this.game.account?.session); }

  open(tab) {
    if (tab) this.tab = tab;
    this.render();
    this.load();
  }

  async load() {
    if (!this.online) return;
    try {
      if (this.tab === 'board') {
        const contest = this.board === 'contest';
        this.data = await ranking.leaderboard(this.board, contest ? 'current' : this.period, this.scope, contest ? (this.period === 'week' ? roundOf().id : previousRound().id) : null);
      } else {
        this.status = await ranking.contestStatus();
      }
    } catch (e) { this.err = viError(e); }
    if (this.hud.modal === 'rank') this.render(true);
  }

  render(keep = false) {
    const m = this.hud.scrollBox();
    const top = keep && this.hud.modal === 'rank' ? m?.scrollTop || 0 : 0;
    let body;
    if (!this.online) {
      body = `<div class="empty-shop">🏆<p>${this.game.account?.configured ? 'Hãy đăng nhập để vào bảng xếp hạng và dự thi.' : 'Bảng xếp hạng & cuộc thi cần kết nối máy chủ (Supabase). Xem docs/HUONG_DAN_SUPABASE.md.'}</p></div>
        ${this.game.account?.configured ? '<button class="btn primary wide" data-act="login">Đăng nhập / Đăng ký</button>' : ''}
        ${this.contestThemeHtml()}`;
    } else body = this.tab === 'board' ? this.boardHtml() : this.contestHtml();
    const tabs = `<div class="mk-tabs"><button class="${this.tab === 'board' ? 'on' : ''}" data-rk="tab" data-id="board">🏆 Xếp hạng</button><button class="${this.tab === 'contest' ? 'on' : ''}" data-rk="tab" data-id="contest">🌸 Cuộc thi hoa</button></div>`;
    this.hud.openModal('rank', `<h2>🏆 Vinh danh</h2>${tabs}<div class="mk-body">${body}</div>`, 'wide');
    if (top) this.hud.scrollBox().scrollTop = top;
  }

  seg(name, opts) {
    return `<div class="seg">${opts.map(([v, l]) => `<button class="${this[name] === v ? 'on' : ''}" data-rk="${name}" data-id="${v}">${l}</button>`).join('')}</div>`;
  }

  boardHtml() {
    const contest = this.board === 'contest';
    const d = this.data;
    const val = (r) => this.board === 'level' ? (this.period === 'week' ? `+${r.value} XP` : `Cấp ${r.level} · ${r.value} XP`) : this.board === 'reputation' ? `${this.period === 'week' ? '+' : ''}${r.value} 💗` : `${r.value} điểm`;
    const rows = d?.rows?.length ? d.rows.map((r) => `<div class="rk-row ${r.me ? 'me' : ''}"><span class="rk-n">${MEDAL[r.rank - 1] || r.rank}</span>${avatarSVG(r.avatar || {}, 32)}<b>${esc(r.name)}</b><span class="rk-v">${val(r)}</span></div>`).join('')
      : `<p class="muted">${d ? 'Chưa có ai trên bảng này.' : this.err ? esc(this.err) : 'Đang tải...'}</p>`;
    const me = d?.me ? `<div class="rk-me">Hạng của bạn: <b>${d.me.rank}</b> / ${d.total} · ${val({ ...d.me, level: this.game.save.player.level })}</div>` : '';
    return `${this.seg('board', [['level', '⭐ Cấp độ'], ['reputation', '💗 Uy tín'], ['contest', '🌸 Cuộc thi']])}
      ${this.seg('period', contest ? [['week', 'Tuần này'], ['all', 'Tuần trước']] : [['week', 'Tuần này'], ['all', 'Mọi lúc']])}
      ${this.seg('scope', [['all', '🌏 Mọi người'], ['friends', '👥 Bạn bè']])}
      <div class="rk-list">${rows}</div>${me}
      <p class="muted small">Điểm do máy chủ tự tính từ tiến độ đã đồng bộ (cập nhật khoảng 2 phút/lần). Tuần tính theo giờ Việt Nam, bắt đầu thứ Hai.</p>`;
  }

  contestThemeHtml() {
    const r = roundOf();
    const t = r.theme;
    return `<div class="contest-card"><span class="ct-icon">${t.icon}</span><div><b>${esc(t.name)}</b>
      <small>${TONES[t.tone].name} · ý nghĩa <b>${MEANINGS[t.meaning].icon} ${MEANINGS[t.meaning].name}</b> · ${t.min}–${t.max} cành</small>
      <small>Mùa thi ${r.id} · còn ${fmtLeft(r.endsAt - Date.now())}</small></div></div>`;
  }

  contestHtml() {
    const st = this.status;
    const cur = st?.current;
    const prev = st?.previous;
    const prevBox = prev ? `<div class="mk-item"><div class="mk-icon">🏅</div><div class="mk-info"><b>Mùa thi trước (${previousRound().id})</b><small>Điểm cao nhất ${prev.best} · hạng ${prev.rank}/${prev.players}</small></div>
      <div class="mk-buy">${st.claimed ? '<span class="maxed">✔ Đã nhận</span>' : '<button class="btn primary" data-rk="claim">Nhận thưởng</button>'}</div></div>` : '';
    const mine = cur ? `<p class="rk-me">Bài tốt nhất: <b>${cur.best} điểm</b> · hạng ${cur.rank}/${cur.players} · đã nộp ${cur.entries}/${CONTEST.maxEntriesPerRound}</p>`
      : `<p class="muted small">${st ? `Bạn chưa nộp bài. Đã có ${st.players || 0} người dự thi tuần này.` : 'Đang tải...'}</p>`;
    const rewards = CONTEST.rewards.map((r) => `<li>${r.title}: ${r.coins} 💰</li>`).join('');
    const result = this.result ? `<div class="contest-result">🎉 Bài dự thi được máy chủ chấm <b>${this.result.score}</b> điểm${this.result.rareBonus ? ` (gồm +${this.result.rareBonus} hoa hiếm)` : ''} · hạng ${this.result.rank}/${this.result.players}</div>` : '';
    return `${this.contestThemeHtml()}${result}${mine}
      ${this.sel ? this.composerHtml() : `<button class="btn primary wide" data-rk="compose" ${cur && cur.entries >= CONTEST.maxEntriesPerRound ? 'disabled' : ''}>💐 Gói bó hoa dự thi</button>`}
      ${prevBox}
      <h3>Phần thưởng mỗi mùa thi</h3><ul class="rewards">${rewards}</ul>
      <p class="muted small">Mỗi tuần nộp tối đa ${CONTEST.maxEntriesPerRound} bó, tính bó cao điểm nhất. Hoa dự thi sẽ được gửi đi (trừ khỏi kho). Máy chủ chấm lại điểm và kiểm tra bạn có đủ hoa thật.</p>`;
  }

  composerHtml() {
    const s = this.game.save;
    const t = roundOf().theme;
    const known = s.book?.meanings || {};
    const ev = contestScore(t, this.sel);
    const items = Object.entries(this.sel.items).filter(([, n]) => n > 0).map(([k, n]) => { const f = variants.parseFlowerKey(k); return { flower: f.species, variant: f.variant, n }; });
    const stacks = Object.entries(s.inventory.flowers).filter(([, n]) => n > 0).map(([k, n]) => ({ k, n, ...variants.parseFlowerKey(k) }));
    const rows = stacks.map((st) => {
      const ms = known[st.vkey] ? variants.meaningsOf(st.species, st.variant) : null;
      return `<div class="stack ${this.sel.items[st.k] ? 'on' : ''}"><span class="si">${FLOWERS[st.species].icon}${vdot(st.species, st.variant)}</span>
        <span class="sn">${esc(variants.variantName(st.species, st.variant))} <i class="stars">${'★'.repeat(st.q)}</i><small>có ${st.n}</small>
        <span class="mrow">${ms ? ms.map((m) => `<span class="mchip sm ${m === t.meaning ? 'hit' : ''} ${MEANINGS[m].negative ? 'neg' : ''}">${MEANINGS[m].icon} ${MEANINGS[m].name}</span>`).join('') : '<span class="mchip sm unk">❔ chưa rõ ý nghĩa</span>'}</span></span>
        <span class="step"><button class="round sm" data-rk="dec" data-k="${st.k}">−</button><b>${this.sel.items[st.k] || 0}</b><button class="round sm" data-rk="inc" data-k="${st.k}">+</button></span></div>`;
    }).join('') || '<p class="muted">Kho chưa có hoa.</p>';
    const sw = (dict, inv, kind) => Object.entries(dict).map(([id, w]) => {
      const have = w.free ? '∞' : (kind === 'paper' ? s.inventory.papers : s.inventory.ribbons)[id] || 0;
      return `<button class="wrap ${this.sel[kind] === id ? 'on' : ''} ${have === 0 ? 'disabled' : ''}" data-rk="${kind}" data-id="${id}"><span class="dot" style="--c:${w.color}"></span><span>${w.name}</span><small>${have}</small></button>`;
    }).join('');
    const parts = ev.ok ? `<div class="parts">${Object.entries(PART_NAMES).map(([k, n]) => `<div class="part"><span>${n}</span><div class="track sm"><i style="width:${ev.parts[k]}%;background:${ev.parts[k] >= 70 ? '#7cc27f' : ev.parts[k] >= 45 ? '#f6c84a' : '#ec8b7b'}"></i></div><b>${ev.parts[k]}</b></div>`).join('')}</div>` : '';
    return `<div class="comp-main"><div class="preview">${bouquetSVG({ items, paper: this.sel.paper, ribbon: this.sel.ribbon, type: 'bouquet' }, 130)}</div>
      <div class="comp-info">${ev.ok ? `<div class="estimate"><span class="mood">🏆</span><div><b>Điểm dự kiến ${ev.score}</b><br><small>${ev.rareBonus ? `gồm +${ev.rareBonus} vì hoa hiếm` : 'Dùng hoa hiếm để được cộng thêm điểm'}</small></div></div>${parts}` : `<p class="muted small">${esc(ev.reason)}</p>`}</div></div>
      <h3>Chọn hoa</h3><div class="stacks">${rows}</div>
      <h3>Giấy gói</h3><div class="wraps">${sw(PAPERS, s.inventory, 'paper')}</div>
      <h3>Ruy băng</h3><div class="wraps">${sw(RIBBONS, s.inventory, 'ribbon')}</div>
      <div class="comp-foot"><button class="btn" data-rk="cancel">Hủy</button><button class="btn primary ${ev.ok ? '' : 'disabled'}" data-rk="submit">🏆 Nộp bài dự thi</button></div>`;
  }

  async onAction(act, el) {
    const g = this.game;
    const id = el.dataset.id;
    if (['board', 'period', 'scope'].includes(act)) { this[act] = id; this.data = null; this.render(true); this.load(); return; }
    switch (act) {
      case 'tab': this.tab = id; this.render(); this.load(); break;
      case 'compose': this.sel = { items: {}, paper: 'kraft', ribbon: 'twine' }; this.result = null; this.render(true); break;
      case 'cancel': this.sel = null; this.render(true); break;
      case 'inc': case 'dec': {
        const k = el.dataset.k;
        const cur = this.sel.items[k] || 0;
        if (act === 'inc' && cur < (g.save.inventory.flowers[k] || 0)) this.sel.items[k] = cur + 1;
        if (act === 'dec' && cur > 0) this.sel.items[k] = cur - 1;
        this.render(true);
        break;
      }
      case 'paper': case 'ribbon': if (!el.classList.contains('disabled')) { this.sel[act] = id; this.render(true); } break;
      case 'submit': {
        if (el.classList.contains('disabled')) return;
        el.classList.add('disabled'); el.textContent = 'Đang gửi bài...';
        const r = await g.submitContestEntry(this.sel);
        if (r) { this.result = r; this.sel = null; this.status = null; this.load(); }
        this.render(true);
        break;
      }
      case 'claim': {
        el.classList.add('disabled');
        try {
          const r = await ranking.claimContest(previousRound().id);
          g.save.player.coins += r.coins;
          g.saveMgr.markDirty();
          g.emitter.emit('inventory');
          g.toast(`${r.title} hạng ${r.rank}/${r.players}: +${r.coins} 💰`, 'good');
        } catch (e) { g.toast(viError(e), 'warn'); }
        this.load();
        break;
      }
      default:
    }
  }
}
