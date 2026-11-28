// 👪 Đời sống làng (0.32 · gói D): chuyện làng & làm mai / hòa giải · quyết định làng · học trò. Nút điều khiển: data-lf
import { FLOWERS } from '../../data/flowers.js';
import { MEANINGS } from '../../data/variants.js';
import { LIFE_RULES, PAIRS, DILEMMAS, APPRENTICE } from '../../data/life.js';
import * as lifeSys from '../systems/life.js';
import * as story from '../systems/story.js';
import * as variants from '../systems/variants.js';
import { villagerInfo } from '../systems/village.js';
import { avatarSVG } from './avatar.js';
import { runMiniGame } from './minigames.js';
import { dayOf } from '../systems/calendar.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const TABS = [
  { id: 'news', label: '💬 Chuyện làng' },
  { id: 'dil', label: '⚖️ Quyết định' },
  { id: 'app', label: '🎓 Học trò' },
];
const av = (id, size = 34) => { const i = villagerInfo(id); return i ? avatarSVG(i.look, size) : ''; };

export class LifePanel {
  constructor(hud) {
    this.hud = hud;
    this.game = hud.game;
    this.tab = 'news';
    this.acting = null;     // { pair, kind } đang chọn hoa để làm mai / hòa giải
    this.subject = 'cam';
    this.style = 'hien';
  }
  get save() { return this.game.save; }
  has = (f) => story.has(this.save, f);
  get day() { return dayOf(this.game.now); }

  open(tab = null) { if (tab) this.tab = tab; this.acting = null; this.render(); }

  render(keep = false) {
    const top = keep ? this.hud.scrollBox()?.scrollTop || 0 : 0;
    const s = this.save;
    lifeSys.L(s);
    const pend = lifeSys.pendingDilemmas(s, this.day).length;
    const tabs = `<div class="mk-tabs" role="tablist">${TABS.map((t) => `<button class="${t.id === this.tab ? 'on' : ''}" data-lf="tab" data-id="${t.id}" role="tab">${t.label}${t.id === 'dil' && pend ? ' <span class="pill">!</span>' : ''}</button>`).join('')}</div>`;
    const lock = s.player.level < LIFE_RULES.minLevel ? `<p class="note warn">🔒 Đời sống làng mở ở cấp ${LIFE_RULES.minLevel}.</p>` : '';
    const body = lock || { news: () => this.news(), dil: () => this.dilemmas(), app: () => this.apprentice() }[this.tab]();
    this.hud.openModal('life', `<h2>👪 Đời sống làng</h2>${tabs}<div class="mk-body lf-body">${body}</div>`, 'wide');
    if (keep) { const box = this.hud.scrollBox(); if (box) box.scrollTop = top; }
  }

  // ---------------- 💬 chuyện làng ----------------
  news() {
    const s = this.save, l = lifeSys.L(s);
    if (this.acting) return this.picker();
    const pairs = Object.entries(PAIRS).filter(([id]) => lifeSys.pairOpen(id, this.has)).map(([id, P]) => {
      const st = l.pairs[id], step = lifeSys.stepOf(s, id), done = l.acted[id] === this.day;
      const pct = Math.round((st.aff + 100) / 2);
      const canMatch = !['gian', 'cuoi', 'con'].includes(step.id), canMend = step.id === 'gian';
      return `<div class="mk-item lf-pair"><div class="lf-avs">${av(P.a)}${av(P.b)}</div><div class="mk-info">
        <b>${esc(lifeSys.nameOf(P.a))} & ${esc(lifeSys.nameOf(P.b))} <small class="muted">${step.icon} ${esc(step.name)}</small></b>
        <div class="track sm"><i style="width:${pct}%;background:${st.aff < -20 ? '#ec8b7b' : P.romance ? '#f6a6b9' : '#f6c84a'}"></i></div>
        <small>${esc(P.story)}${st.married && P.romance ? ` · 💍 cưới ngày ${st.married}` : ''}${st.baby ? ` · 👶 ${esc(P.baby)}` : ''}</small></div>
        <div class="mk-buy">${done ? '<span class="maxed">✓ hôm nay</span>' : canMend ? `<button class="btn primary" data-lf="act" data-id="${id}" data-k="mend">🕊️ Hòa giải</button>` : canMatch ? `<button class="btn" data-lf="act" data-id="${id}" data-k="match">💐 ${P.romance ? 'Làm mai' : 'Kết nối'}</button>` : ''}</div></div>`;
    }).join('');
    const feed = l.news.slice(0, 12).map((n) => `<div class="lf-news"><span>${n.icon}</span><p>${esc(n.text)}<small> · ngày ${n.day}</small></p></div>`).join('') || '<p class="muted small">Làng còn yên ả. Vài hôm nữa sẽ có chuyện để kể…</p>';
    return `<p class="muted small">Dân làng có cuộc sống riêng: quen nhau, thân nhau, yêu nhau, cưới nhau… hoặc giận nhau. Bạn có thể tặng hoa “thay lời” để <b>làm mai / kết nối</b>, hoặc mang hoa tới <b>hòa giải</b> — chọn hoa đúng ý nghĩa thì dễ thành, sai thì hỏng chuyện. Mỗi cặp 1 lần/ngày.</p>
      <h3>👥 Các mối quan hệ</h3>${pairs}<h3>📰 Tin làng</h3><div class="lf-feed">${feed}</div>`;
  }

  picker() {
    const s = this.save, { pair, kind } = this.acting, P = PAIRS[pair];
    const known = s.book?.meanings || {};
    const want = kind === 'mend' ? ['apology', 'friendship', 'hope'] : P.romance ? ['love', 'longing', 'loyalty'] : ['friendship', 'joy', 'gratitude'];
    const rows = Object.entries(s.inventory.flowers).filter(([, n]) => n > 0).map(([k, n]) => {
      const f = variants.parseFlowerKey(k);
      if (FLOWERS[f.species]?.luck) return '';
      const vk = variants.vkey(f.species, f.variant);
      const ms = known[vk] ? variants.meaningsOf(f.species, f.variant) : null;
      const chips = ms ? ms.map((m) => `<span class="mchip sm ${MEANINGS[m].negative ? 'neg' : ''} ${want.includes(m) ? 'hit' : ''}">${MEANINGS[m].icon} ${esc(MEANINGS[m].name)}</span>`).join('') : '<span class="mchip sm unk">❔ chưa rõ ý nghĩa</span>';
      return `<button class="lf-flower" data-lf="give" data-k="${k}"><span>${FLOWERS[f.species].icon}</span><b>${esc(variants.variantName(f.species, f.variant))} <i class="stars">${'★'.repeat(f.q)}</i> ×${n}</b><div class="chips">${chips}</div></button>`;
    }).join('');
    return `<div class="row-btns"><button class="btn" data-lf="back">← Quay lại</button></div>
      <p><b>${kind === 'mend' ? '🕊️ Hòa giải' : P.romance ? '💐 Làm mai' : '💐 Kết nối'}: ${esc(lifeSys.nameOf(P.a))} & ${esc(lifeSys.nameOf(P.b))}</b></p>
      <p class="muted small">Chọn 1 bông hoa để mang tới. Gợi ý ý nghĩa hợp: ${want.map((m) => `${MEANINGS[m].icon} ${MEANINGS[m].name}`).join(', ')}. Hoa nhiều sao & bạn càng thân với hai người thì càng dễ thành. Hoa mang ý nghĩa xấu (ghen tuông, chia ly…) sẽ làm hỏng chuyện!</p>
      <div class="lf-flowers">${rows || '<p class="note">Kho chưa có hoa nào.</p>'}</div>`;
  }

  // ---------------- ⚖️ quyết định ----------------
  dilemmas() {
    const s = this.save, l = lifeSys.L(s), pend = lifeSys.pendingDilemmas(s, this.day);
    const opt = (id, k, O) => `<div class="lf-opt"><b>${k === 'a' ? '🅰️' : '🅱️'} ${esc(O.label)}</b><button class="btn ${this.armed === `${id}:${k}` ? 'danger' : 'primary'}" data-lf="decide" data-id="${id}" data-k="${k}">${this.armed === `${id}:${k}` ? 'Bấm lần nữa để chốt' : 'Chọn'}</button></div>`;
    const open = pend.map((id) => { const D = DILEMMAS[id]; return `<div class="lf-dil"><h3>${D.icon} ${esc(D.title)}</h3><p>${esc(D.text)}</p><p class="muted small">⚠️ Chọn rồi không đổi lại được. Dân làng sẽ nhớ.</p>${opt(id, 'a', D.a)}${opt(id, 'b', D.b)}</div>`; }).join('');
    const past = Object.entries(l.dil).map(([id, k]) => { const D = DILEMMAS[id], O = D[k]; return `<div class="mk-item"><div class="mk-icon">${D.icon}</div><div class="mk-info"><b>${esc(D.title)} <small class="muted">đã chọn: ${esc(O.label)}</small></b><small>${esc(O.result)}</small></div></div>`; }).join('');
    const later = Object.entries(DILEMMAS).filter(([id]) => !l.dil[id] && !pend.includes(id)).map(([, D]) => `<div class="mk-item locked"><div class="mk-icon">❔</div><div class="mk-info"><b>Chuyện chưa tới</b><small>Cấp ${D.level} · từ ngày ${D.day}</small></div></div>`).join('');
    return `<p class="muted small">Thỉnh thoảng làng cần bạn quyết một chuyện khó. Không có lựa chọn hoàn hảo: được cái này thì mất cái kia.</p>${open || '<p class="note">Hiện chưa có chuyện gì cần bạn quyết.</p>'}${past ? `<h3>📜 Đã quyết</h3>${past}` : ''}${later}`;
  }

  // ---------------- 🎓 học trò ----------------
  apprentice() {
    const s = this.save, a = lifeSys.L(s).app, day = this.day;
    if (!a) {
      const rows = lifeSys.candidates(s, this.has).map(({ id, C, open, hearts, ok }) => `<div class="mk-item ${ok ? '' : 'locked'}"><div class="mk-icon">${av(id, 40)}</div><div class="mk-info"><b>${esc(lifeSys.nameOf(id))} <small class="muted">sở trường: ${APPRENTICE.subjects[C.talent].icon} ${esc(APPRENTICE.subjects[C.talent].name)}</small></b><small>${esc(C.desc)}</small><small>${!open ? '🔒 chưa gặp' : `❤️ ${hearts}/${C.hearts}`}</small></div>
        <div class="mk-buy">${ok ? `<button class="btn primary" data-lf="take" data-id="${id}">🎓 Nhận làm học trò</button>` : ''}</div></div>`).join('');
      return `<p class="muted small">Nhận một đứa trẻ trong làng làm học trò (cần cấp ${APPRENTICE.minLevel} và đủ tim). Mỗi ngày dạy một buổi: chọn môn & cách dạy, rồi cùng làm bài (mini game). Dạy <b>dịu dàng</b> thì trò thân bạn, dạy <b>nghiêm</b> thì trò giỏi nhanh. Ra nghề, trò mở tiệm: thân với bạn ⇒ <b>đối tác</b> (gửi quà mỗi ngày, khách bo nhiều hơn); không thân ⇒ <b>đối thủ</b> (giành khách của bạn!).</p>${rows}`;
    }
    const name = lifeSys.nameOf(a.id);
    const head = `<div class="lf-app">${av(a.id, 60)}<div><h3>${esc(name)} ${a.done ? (a.outcome === 'partner' ? '<span class="tag reg">🤝 Đối tác</span>' : '<span class="tag vip">😤 Đối thủ</span>') : '<span class="tag">🎓 Học trò</span>'}</h3>
      <div class="kv"><span>📚 Tay nghề</span><b>${a.skill}/${APPRENTICE.graduate.skill}</b></div><div class="track sm"><i style="width:${Math.min(100, (a.skill / APPRENTICE.graduate.skill) * 100)}%;background:#7cc27f"></i></div>
      <div class="kv"><span>💗 Gắn bó</span><b>${a.bond}/100</b></div><div class="track sm"><i style="width:${a.bond}%;background:${a.bond >= APPRENTICE.partnerBond ? '#f6a6b9' : '#f6c84a'}"></i></div>
      <small class="muted">Buổi học: ${a.lessons}/${APPRENTICE.graduate.lessons} · ${Object.entries(APPRENTICE.subjects).map(([k, S]) => `${S.icon} ${a.subj?.[k] || 0}`).join(' · ')}</small></div></div>`;
    if (a.done) {
      if (a.outcome === 'partner') return `${head}<p class="note good">🤝 Tiệm của ${esc(name)} là đối tác: mỗi ngày gửi biếu tiền & hạt giống, khách tiệm bạn bo nhiều hơn ${Math.round((APPRENTICE.partner.tipsMult - 1) * 100)}%.</p>`;
      const can = lifeSys.canChallenge(s, day);
      return `${head}<p class="note warn">😤 Tiệm của ${esc(name)} giành bớt khách (khách tới tiệm bạn −${Math.round((1 - APPRENTICE.rival.spawnMult) * 100)}%). Thắng ${APPRENTICE.rival.winsToMakeUp} cuộc thi cắm hoa để làm lành (đã thắng ${a.wins}).</p>
        <div class="row-btns"><button class="btn ${can ? 'primary' : 'disabled'}" data-lf="challenge">💐 Thi cắm hoa${can ? '' : ` (mỗi ${APPRENTICE.rival.challengeEvery} ngày)`}</button></div>`;
    }
    const can = lifeSys.canTeach(s, day);
    const subj = Object.entries(APPRENTICE.subjects).map(([k, S]) => `<button class="lf-choice ${this.subject === k ? 'on' : ''}" data-lf="subj" data-id="${k}">${S.icon} ${esc(S.name)}${APPRENTICE.candidates[a.id]?.talent === k ? ' ⭐' : ''}</button>`).join('');
    const sty = Object.entries(APPRENTICE.styles).map(([k, S]) => `<button class="lf-choice ${this.style === k ? 'on' : ''}" data-lf="style" data-id="${k}">${S.icon} ${esc(S.name)} <small>(tiến bộ ×${S.skill}, gắn bó ${S.bond > 0 ? '+' : ''}${S.bond})</small></button>`).join('');
    return `${head}<h3>📖 Buổi học hôm nay</h3><div class="lf-choices">${subj}</div><div class="lf-choices">${sty}</div>
      <div class="row-btns"><button class="btn ${can ? 'primary' : 'disabled'}" data-lf="teach">${can ? '🎓 Bắt đầu buổi học' : '✓ Hôm nay đã dạy — mai tiếp nhé'}</button></div>`;
  }

  async onAction(act, el) {
    const g = this.game, id = el.dataset.id;
    if (el.classList.contains('disabled')) return;
    switch (act) {
      case 'tab': this.tab = id; this.acting = null; this.armed = null; break;
      case 'act': this.acting = { pair: id, kind: el.dataset.k }; break;
      case 'back': this.acting = null; break;
      case 'give': g.lifeAct(this.acting.pair, this.acting.kind, el.dataset.k); this.acting = null; break;
      case 'decide': {
        const key = `${id}:${el.dataset.k}`;
        if (this.armed !== key) { this.armed = key; break; }
        this.armed = null; g.lifeDecide(id, el.dataset.k); break;
      }
      case 'take': g.lifeTake(id); break;
      case 'subj': this.subject = id; break;
      case 'style': this.style = id; break;
      case 'teach': {
        const S = APPRENTICE.subjects[this.subject];
        this.hud.closeModal();
        const res = await runMiniGame(S.game, { title: `Dạy ${lifeSys.nameOf(lifeSys.L(this.save).app.id)}: ${S.name}`, icon: S.icon, sfx: g.audio?.sfx, level: 0, practice: true });
        if (!res.quit) g.lifeLesson(this.subject, this.style, res.stars);
        this.open('app');
        return;
      }
      case 'challenge': {
        this.hud.closeModal();
        const res = await runMiniGame('arrange', { title: `Thi cắm hoa với ${lifeSys.nameOf(lifeSys.L(this.save).app.id)}`, icon: '💐', sfx: g.audio?.sfx, level: 1, practice: true });
        if (!res.quit) g.lifeChallenge(res.stars);
        this.open('app');
        return;
      }
    }
    this.render(true);
  }
}
