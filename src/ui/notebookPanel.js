// Sổ tay thực vật: bộ sưu tập màu hoa, ngôn ngữ loài hoa, khách quen.
import { FLOWERS, FLOWER_IDS } from '../../data/flowers.js';
import { VARIANTS, MEANINGS, RARITY, BOOK_MILESTONES } from '../../data/variants.js';
import { REGULARS } from '../../data/regulars.js';
import * as variants from '../systems/variants.js';
import { bookProgress } from '../systems/notebook.js';
import { avatarSVG } from './avatar.js';
import * as rel from '../systems/relations.js';
import { villagerInfo } from '../systems/village.js';
import { BONDS, REACTION, FRIEND } from '../../data/stories.js';
import { FAVORS, MINIGAMES, DIFFICULTY } from '../../data/minigames.js';
import { runMiniGame } from './minigames.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const SEASON_NAMES = { xuan: 'Xuân', ha: 'Hạ', thu: 'Thu', dong: 'Đông' };
const TABS = [['flowers', '🌸 Bộ sưu tập'], ['meanings', '💬 Ngôn ngữ hoa'], ['regulars', '💌 Khách quen'], ['village', '🏘️ Dân làng'], ['games', '🎮 Mini game']];

/** Mini game nào do ai nhờ (lấy tên & biểu tượng từ việc nhờ) */
const GAME_INFO = (() => {
  const out = {};
  for (const [who, list] of Object.entries(FAVORS)) for (const f of list) if (!out[f.game]) out[f.game] = { title: f.title, icon: f.icon, who };
  return out;
})();

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
    const body = { flowers: this.flowers, meanings: this.meanings, regulars: this.regulars, village: this.village, games: this.games }[this.tab].call(this);
    this.hud.openModal('notebook', `
      <h2>📖 Sổ tay thực vật</h2>
      <div class="book-prog"><div class="track"><i style="width:${p.pct}%;background:#f6a6b9"></i></div>
        <small>Đã sưu tầm ${p.found}/${p.total} màu hoa (${p.pct}%) · Biết ý nghĩa ${p.known}/${p.total}</small></div>
      <div class="mk-tabs">${TABS.map(([id, label]) => `<button class="${id === this.tab ? 'on' : ''}" data-nb="tab" data-id="${id}">${label}</button>`).join('')}</div>
      <div class="mk-body">${body}</div>`, 'wide');
  }

  village() {
    const s = this.save;
    const day = this.game.today;
    const rows = rel.BOND_IDS.map((id) => {
      const info = villagerInfo(id);
      const b = BONDS[id];
      const h = rel.heartsOf(s, id);
      const r = rel.relOf(s, id);
      const known = Object.entries(r.known);
      const likes = known.filter(([, l]) => l === 'love' || l === 'like').map(([k]) => `${REACTION[r.known[k]].icon} ${variants.variantName(variants.parseVkey(k).species, variants.parseVkey(k).variant)}`);
      const seen = (b.events || []).filter((e) => r.done[e.id]).length;
      const next = rel.availableEvent(s, id);
      return `<div class="rg-card"><div class="rg-av">${avatarSVG(info.look, 52)}</div><div class="rg-info">
        <b>${esc(info.name)}</b> <small class="muted">${esc(info.role)}</small>
        <div>${'❤️'.repeat(h)}${'🤍'.repeat(FRIEND.maxHearts - h)} <small class="muted">${esc(rel.tierName(h))}</small></div>
        <small>🎂 Sinh nhật: ngày ${b.birthday.day} ${SEASON_NAMES[b.birthday.season] ? `Mùa ${SEASON_NAMES[b.birthday.season]}` : ''}${rel.isBirthday(id, day) ? ' — <b>HÔM NAY!</b>' : ''} · ✨ Sự kiện ${seen}/${b.events.length}${next ? ' · <b>có chuyện mới!</b>' : ''}</small>
        <small>${likes.length ? `Đã biết thích: ${esc(likes.join(', '))}` : '💡 Tặng hoa để biết sở thích'}</small>
        <small class="muted">${r.talkDay === day ? '💬 đã trò chuyện hôm nay' : '💬 chưa trò chuyện hôm nay'} · ${r.giftDay === day ? '🎁 đã tặng quà' : '🎁 chưa tặng quà'}</small>
      </div></div>`;
    }).join('');
    return `<p class="muted small">Trò chuyện và tặng hoa mỗi ngày để kết thân. Đủ tim sẽ mở <b>sự kiện</b> (câu chuyện có lựa chọn) và nhận quà ở 3, 5, 7, 10 ❤️. Chạm vào dân làng ở 🏘️ Làng để gặp họ.</p>${rows}`;
  }

  flowers() {
    const s = this.save;
    const ms = BOOK_MILESTONES.map((m) => `<span class="mile ${s.book.milestones.includes(m.pct) ? 'on' : ''}" title="${esc(m.text)}">${m.pct}% · ${m.coins}💰</span>`).join('');
    // chọn 1 loài để xem (bảng gọn, không phải kéo qua cả 22 loài)
    const cur = FLOWERS[this.sp] ? this.sp : FLOWER_IDS[0];
    const chips = FLOWER_IDS.map((id) => {
      const all = Object.keys(VARIANTS[id]);
      const got = all.filter((v) => s.book.found[`${id}:${v}`]).length;
      return `<button class="sp-chip ${id === cur ? 'on' : ''} ${got === all.length ? 'full' : ''}" data-nb="sp" data-id="${id}" title="${esc(FLOWERS[id].name)}"><span>${FLOWERS[id].icon}</span><small>${got}/${all.length}</small></button>`;
    }).join('');
    const sections = [cur].map((sp) => {
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
            <small class="hint">${f.luck ? '🍀 Có trong Gói Vàng (Vận May)' : d.default ? 'Mua hạt ở Khu Chợ' : `Lai: ${esc(hint)}`}</small></div>`;
        }
        return `<div class="bk-card"><i class="vdot big" style="--c:${d.petal}"></i><b>${esc(d.name)}</b><small style="color:${r.color}">${r.name}</small>
          <div class="mrow">${known ? d.meanings.map((m) => `<span class="mchip sm ${MEANINGS[m].negative ? 'neg' : ''}">${MEANINGS[m].icon} ${MEANINGS[m].name}</span>`).join('') : '<span class="mchip sm unk">❔ chưa rõ ý nghĩa</span>'}</div>
          <small>Thu hoạch ${found.harvested} lần · tốt nhất <i class="stars">${'★'.repeat(found.bestQ)}</i></small></div>`;
      }).join('');
      const locked = s.player.level < f.unlockLevel;
      return `<div class="bk-sec"><h3>${f.icon} ${f.name} <small class="muted">${f.luck ? '🍀 Cây Vận May · trồng được mọi mùa' : f.seasons.map((x) => SEASON_NAMES[x]).join(', ')}${locked ? ` · 🔒 cấp ${f.unlockLevel}` : ''}</small></h3><div class="bk-grid">${cards}</div></div>`;
    }).join('');
    return `<div class="miles">${ms}</div><div class="sp-chips">${chips}</div>${sections}`;
  }

  /** 🎮 Góc mini game (GĐ17): chơi lại cho vui, chọn độ khó, xem kỷ lục */
  games() {
    const s = this.save;
    const cards = Object.keys(MINIGAMES).filter((k) => GAME_INFO[k]).map((k) => {
      const g = GAME_INFO[k];
      const r = s.mg?.[k];
      const who = villagerInfo(g.who)?.name || '';
      return `<div class="mk-item mg-rec">
        <div class="mk-icon">${g.icon}</div>
        <div class="mk-info"><b>${esc(g.title)}</b><small>Việc nhờ của ${esc(who)}</small>
          <small>🏆 ${r?.plays ? `${'⭐'.repeat(r.best) || '—'} · chơi ${r.plays} lần · ${r.perfect} lần 3⭐${r.combo > 1 ? ` · combo ×${r.combo}` : ''}` : 'chưa chơi'}</small></div>
        <div class="mk-buy mg-lv">${DIFFICULTY.names.map((n, i) => `<button class="btn ${i === 0 ? 'primary' : ''}" data-nb="play" data-k="${k}" data-lv="${i}">${DIFFICULTY.icons[i]} ${n}</button>`).join('')}</div>
      </div>`;
    }).join('');
    return `<p class="muted small">Chơi lại các mini game cho vui bất cứ lúc nào (không tính thưởng). Khi dân làng nhờ, độ khó tăng theo số ❤️ — khó hơn thì thưởng nhiều hơn.</p><div class="mk-body">${cards}</div>`;
  }

  async play(kind, lv) {
    const g = GAME_INFO[kind];
    this.hud.closeModal();
    const res = await runMiniGame(kind, { title: g.title, icon: g.icon, sfx: this.game.audio?.sfx, level: lv, record: this.save.mg?.[kind], practice: true });
    if (!res.quit) {
      const r = this.game.recordPractice(kind, res.stars, res.combo);
      if (r.newBest) this.game.toast(`🏆 Kỷ lục mới ở ${g.icon} ${g.title}: ${'⭐'.repeat(r.rec.best)}!`, 'good');
    }
    this.tab = 'games';
    this.render();
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
    if (act === 'sp') { this.sp = el.dataset.id; this.render(); }
    if (act === 'play') this.play(el.dataset.k, +el.dataset.lv);
  }
}
