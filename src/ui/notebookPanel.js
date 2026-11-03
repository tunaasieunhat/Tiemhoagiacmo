// Sổ tay thực vật: bộ sưu tập màu hoa, ngôn ngữ loài hoa, khách quen.
import { FLOWERS, FLOWER_IDS } from '../../data/flowers.js';
import { VARIANTS, MEANINGS, RARITY, BOOK_MILESTONES } from '../../data/variants.js';
import { REGULARS } from '../../data/regulars.js';
import * as variants from '../systems/variants.js';
import { bookProgress } from '../systems/notebook.js';
import { avatarSVG } from './avatar.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const SEASON_NAMES = { xuan: 'Xuân', ha: 'Hạ', thu: 'Thu', dong: 'Đông' };
const TABS = [['flowers', '🌸 Bộ sưu tập'], ['meanings', '💬 Ngôn ngữ hoa'], ['regulars', '💌 Khách quen']];

export class NotebookPanel {
  constructor(hud) {
    this.hud = hud;
    this.game = hud.game;
    this.tab = 'flowers';
  }

  get save() { return this.game.save; }

  open(tab) { if (tab) this.tab = tab; this.render(); }

  render() {
    const p = bookProgress(this.save);
    const body = { flowers: this.flowers, meanings: this.meanings, regulars: this.regulars }[this.tab].call(this);
    this.hud.openModal('notebook', `
      <h2>📖 Sổ tay thực vật</h2>
      <div class="book-prog"><div class="track"><i style="width:${p.pct}%;background:#f6a6b9"></i></div>
        <small>Đã sưu tầm ${p.found}/${p.total} màu hoa (${p.pct}%) · Biết ý nghĩa ${p.known}/${p.total}</small></div>
      <div class="mk-tabs">${TABS.map(([id, label]) => `<button class="${id === this.tab ? 'on' : ''}" data-nb="tab" data-id="${id}">${label}</button>`).join('')}</div>
      <div class="mk-body">${body}</div>`, 'wide');
  }

  flowers() {
    const s = this.save;
    const ms = BOOK_MILESTONES.map((m) => `<span class="mile ${s.book.milestones.includes(m.pct) ? 'on' : ''}" title="${esc(m.text)}">${m.pct}% · ${m.coins}💰</span>`).join('');
    const sections = FLOWER_IDS.map((sp) => {
      const f = FLOWERS[sp];
      const cards = Object.entries(VARIANTS[sp]).map(([v, d]) => {
        const k = `${sp}:${v}`;
        const found = s.book.found[k];
        const known = s.book.meanings[k];
        const r = RARITY[d.rarity];
        if (!found) {
          const hint = (d.breed || []).map(([a, b]) => {
            const na = s.book.found[`${sp}:${a}`] ? VARIANTS[sp][a].name : '?';
            const nb = s.book.found[`${sp}:${b}`] ? VARIANTS[sp][b].name : '?';
            return `${na} × ${nb}`;
          }).join(' hoặc ');
          return `<div class="bk-card unknown"><i class="vdot big q">?</i><b>???</b><small style="color:${r.color}">${r.name}</small>
            <small class="hint">${d.default ? 'Mua hạt ở Khu Chợ' : `Lai: ${esc(hint)}`}</small></div>`;
        }
        return `<div class="bk-card"><i class="vdot big" style="--c:${d.petal}"></i><b>${esc(d.name)}</b><small style="color:${r.color}">${r.name}</small>
          <div class="mrow">${known ? d.meanings.map((m) => `<span class="mchip sm ${MEANINGS[m].negative ? 'neg' : ''}">${MEANINGS[m].icon} ${MEANINGS[m].name}</span>`).join('') : '<span class="mchip sm unk">❔ chưa rõ ý nghĩa</span>'}</div>
          <small>Thu hoạch ${found.harvested} lần · tốt nhất <i class="stars">${'★'.repeat(found.bestQ)}</i></small></div>`;
      }).join('');
      const locked = s.player.level < f.unlockLevel;
      return `<div class="bk-sec"><h3>${f.icon} ${f.name} <small class="muted">${f.seasons.map((x) => SEASON_NAMES[x]).join(', ')}${locked ? ` · 🔒 cấp ${f.unlockLevel}` : ''}</small></h3><div class="bk-grid">${cards}</div></div>`;
    }).join('');
    return `<div class="miles">${ms}</div>${sections}`;
  }

  meanings() {
    const s = this.save;
    return `<p class="muted small">Ý nghĩa được khám phá khi bạn bán hoa cho khách (họ sẽ kể cho bạn nghe) hoặc qua câu chuyện của khách quen.</p>` +
      Object.entries(MEANINGS).map(([id, m]) => {
        const all = variants.allVariants().filter((v) => variants.meaningsOf(v.species, v.variant).includes(id));
        const known = all.filter((v) => s.book.meanings[v.vkey]);
        const chips = known.map((v) => `<span class="chip-s">${FLOWERS[v.species].icon}<i class="vdot" style="--c:${variants.variantData(v.species, v.variant).petal}"></i> ${esc(variants.variantName(v.species, v.variant))}</span>`).join('');
        const rest = all.length - known.length;
        return `<div class="mk-item"><div class="mk-icon">${m.icon}</div><div class="mk-info"><b>${m.name}${m.negative ? ' <small class="neg-label">nên tránh</small>' : ''}</b>
          <div class="chips">${chips}${rest ? `<span class="chip-s unk">❔ còn ${rest} loài chưa biết</span>` : ''}</div></div></div>`;
      }).join('');
  }

  regulars() {
    const s = this.save;
    return Object.entries(REGULARS).map(([id, r]) => {
      const st = s.regulars[id] || { hearts: 0 };
      const hearts = '❤️'.repeat(st.hearts) + '🤍'.repeat(r.chapters.length - st.hearts);
      const locked = s.player.level < r.minLevel;
      const chapters = r.chapters.map((ch, i) => i < st.hearts
        ? `<li class="done"><b>Chương ${i + 1}.</b> ${esc(ch.intro)}<br><i>“${esc(ch.thanks)}”</i></li>`
        : i === st.hearts ? `<li class="next"><b>Chương ${i + 1}.</b> ${locked ? `Gặp từ cấp ${r.minLevel}` : 'Sắp tới... chờ khách ghé tiệm nhé!'}</li>` : `<li class="locked"><b>Chương ${i + 1}.</b> ???</li>`).join('');
      return `<div class="reg-card"><div class="reg-head">${avatarSVG(r.look, 56)}<div><b>${esc(r.name)}</b><p class="hearts">${hearts}</p><small>${esc(r.bio)}</small></div></div>
        <ol class="chapters">${chapters}</ol></div>`;
    }).join('');
  }

  onAction(act, el) {
    if (act === 'tab') { this.tab = el.dataset.id; this.render(); }
  }
}
