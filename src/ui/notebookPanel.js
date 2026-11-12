import * as THREE from 'three';
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
import * as storySys from '../systems/story.js';
import { COMING_CHAPTERS, ARCS } from '../../data/story.js';
import { EN_PEOPLE, EN_RULES, CO_PEOPLE } from '../../data/muien.js';
import * as craft from '../systems/craft.js';
import { HG_GAME_NAMES, GATHER } from '../../data/huong.js';
const HG_PEOPLE = ['ba_nhai', 'sen', 'ong_que', 'chi_tra', 'be_mat'];
import * as fishSys from '../systems/fishing.js';
import { FISH_RULES } from '../../data/fishing.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const SEASON_NAMES = { xuan: 'Xuân', ha: 'Hạ', thu: 'Thu', dong: 'Đông' };
const TABS = [['story', '📜 Cốt truyện'], ['flowers', '🌸 Bộ sưu tập'], ['meanings', '💬 Ngôn ngữ hoa'], ['regulars', '💌 Khách quen'], ['village', '🏘️ Dân làng'], ['games', '🎮 Mini game'], ['fish', '🎣 Sổ cá']];

/** Mini game nào do ai nhờ (lấy tên & biểu tượng từ việc nhờ) */
const GAME_INFO = (() => {
  const out = {};
  for (const [who, list] of Object.entries(FAVORS)) for (const f of list) if (!out[f.game]) out[f.game] = { title: f.title, icon: f.icon, who };
  // (GĐ23) mini game của Đảo Ngàn Hương
  for (const [k, [title, icon]] of Object.entries(HG_GAME_NAMES)) if (!out[k]) out[k] = { title, icon, who: null, place: 'Đảo Ngàn Hương' };
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
    const body = { fish: this.fishBook, story: this.story, flowers: this.flowers, meanings: this.meanings, regulars: this.regulars, village: this.village, games: this.games }[this.tab].call(this);
    this.hud.openModal('notebook', `
      <h2>📖 Sổ tay thực vật</h2>
      <div class="book-prog"><div class="track"><i style="width:${p.pct}%;background:#f6a6b9"></i></div>
        <small>Đã sưu tầm ${p.found}/${p.total} màu hoa (${p.pct}%) · Biết ý nghĩa ${p.known}/${p.total}</small></div>
      <div class="mk-tabs">${TABS.map(([id, label]) => `<button class="${id === this.tab ? 'on' : ''}" data-nb="tab" data-id="${id}">${label}</button>`).join('')}</div>
      <div class="mk-body">${body}</div>`, 'wide');
  }

  /** 📜 Cốt truyện chính (GĐ20): chương đang ở đâu, việc cần làm, xem lại cảnh đã qua */
  story() {
    const s = this.save;
    const arcHtml = (arc) => storySys.overview(s, arc).map((o) => {
      const { ch } = o;
      const sceneBtns = o.scenes.filter((x) => x.seen).map((x) => `<button class="chip-btn" data-nb="replay" data-id="${x.id}">▶ ${esc(x.title)}</button>`).join('');
      let body = '';
      if (o.state === 'done') body = `<p class="small">${esc(ch.outro || '')}</p><div class="st-scenes">${sceneBtns}</div>`;
      else if (o.state === 'active') body = `<p class="small">${esc(ch.intro)}</p>
        <div class="st-goal">🎯 <b>${esc(o.goal)}</b>${o.need > 1 ? ` <small>(${o.seen}/${o.need})</small>` : ''}</div>
        ${this.guideBtns(arc)}
        ${sceneBtns ? `<div class="st-scenes">${sceneBtns}</div>` : ''}`;
      else if (o.state === 'locked') body = `<p class="small muted">${esc(ch.intro)}</p><div class="st-need">Mở khi: ${o.checks.map((c) => `<span class="${c.ok ? 'ok' : ''}">${c.ok ? '✅' : '⬜'} ${esc(c.text)}${c.ok ? '' : ` (${c.value}/${c.n})`}</span>`).join('')}</div>`;
      else body = '<p class="small muted">Xong chương trước để mở.</p>';
      const tag = { done: '✔ Đã xong', active: '▶ Đang diễn ra', locked: '🔒 Chưa mở', later: '🔒' }[o.state];
      return `<div class="st-card ${o.state}"><div class="st-head"><span class="st-n">Chương ${ch.n}</span><b>${esc(o.state === 'later' ? '???' : ch.title)}</b><i>${tag}</i></div>${body}</div>`;
    }).join('');

    const coming = COMING_CHAPTERS.map((c) => `<span class="chip-s unk">Chương ${c.n} · ???</span>`).join('');
    // mạch Mũi Én chỉ hiện khi mạch chính đã đi đủ xa (xong chương 3) để không lộ truyện
    const showEn = !!s.story?.done?.c3;
    const cloud = storySys.S(s).cloud;
    const enHead = showEn ? `<div class="st-arc st-wide"><b>${ARCS.en.icon} ${esc(ARCS.en.name)}</b><small>${esc(ARCS.en.desc)}${storySys.has(s, 'e1_sao') ? ` · ☁️ Mây về: <b>${cloud}</b>/${EN_RULES.cloudFull}` : ''}</small></div>` : '';
    return `<div class="st-arc st-wide"><b>${ARCS.main.icon} ${esc(ARCS.main.name)}</b><small>${esc(ARCS.main.desc)} Người có chuyện để kể hiện 📜 trên đầu; ban đêm (sau 19:00) bé Mơ ở trước hiên tiệm.</small></div>
      ${arcHtml('main')}
      ${storySys.BUD_IDS.some((id) => storySys.budOf(s, id)) ? `<div class="st-card st-wide"><div class="st-head"><b>🌱 Nụ Mộng</b><i>đã nở ${storySys.bloomCount(s)}/5 · đã trao ${storySys.givenCount(s)}/5</i></div><p class="small">Kệ Nụ Mộng nằm cạnh hiên tiệm.</p><button class="btn" data-nb="buds">Xem kệ Nụ Mộng</button></div>` : ''}
      ${enHead}${showEn ? arcHtml('en') : ''}
      ${s.story?.done?.e3 ? `<div class="st-arc st-wide"><b>${ARCS.lang.icon} ${esc(ARCS.lang.name)}</b><small>${esc(ARCS.lang.desc)}${storySys.has(s, 'co_fish') ? ` · 🍾 Chai thư: <b>${fishSys.F(s).bottles}</b> · 🐟 Đã câu: <b>${fishSys.F(s).caught}</b> con` : ''}</small></div>${arcHtml('lang')}` : ''}
      ${s.story?.done?.c3 ? `<div class="st-arc st-wide"><b>${ARCS.huong.icon} ${esc(ARCS.huong.name)}</b><small>${esc(ARCS.huong.desc)}${storySys.has(s, 'hg_shop') ? ` · 📖 Sổ Hương: <b>${craft.pageCount(s)}</b>/12 trang` : ''}</small></div>${arcHtml('huong')}` : ''}
      ${coming ? `<div class="st-card later st-wide"><div class="st-head"><b>Sắp ra mắt</b></div><div class="chips">${coming}</div></div>` : ''}`;
  }

  /** 🎣 Sổ cá (GĐ22): từng chỗ câu có những loài nào, con to nhất đã câu */
  fishBook() {
    const s = this.save;
    if (!storySys.has(s, 'co_fish')) return '<div class="empty-shop">🎣<p>Bạn chưa biết câu cá. Sổ cá sẽ mở trong cốt truyện Cồn Lặng (sau khi xong truyện Mũi Én, cấp 20).</p></div>';
    const cond = (f) => [f.night && '🌙 đêm', f.day && '☀️ ngày', f.rain && '🌧️ mưa', f.fog && '🌫️ sương mù', f.moon && '🌕 đêm rằm'].filter(Boolean).join(' · ');
    const secs = fishSys.bookBySpot(s).map(({ def, fish, done }) => {
      const got = fish.filter((x) => x.got).length;
      const cards = fish.map(({ f, got: b }) => (b
        ? `<div class="fb-card" style="--tc:${FISH_RULES.tierColors[f.t]}"><span class="fb-icon">${f.icon}</span><b>${b.shiny ? '✨ ' : ''}${esc(f.name)}</b><small class="fb-tier">${FISH_RULES.tierNames[f.t]} <i class="stars">${'★'.repeat(b.q)}</i></small><small>Đã câu ${b.n} · to nhất ${b.max} cm</small><small class="muted">${esc(cond(f) || 'lúc nào cũng có')}</small></div>`
        : `<div class="fb-card unk" style="--tc:${FISH_RULES.tierColors[f.t]}"><span class="fb-icon">❔</span><b>???</b><small class="fb-tier">${FISH_RULES.tierNames[f.t]}</small><small class="muted">${esc(cond(f) || 'chưa gặp')}</small></div>`)).join('');
      return `<div class="fb-sec"><h3>${def.icon} ${esc(def.name)} <small class="muted">${got}/${fish.length}${done ? ' · ✔ đã nhận thưởng' : ''}</small></h3><div class="fb-grid">${cards}</div></div>`;
    }).join('');
    return `<p class="muted small st-wide">Đã sưu tầm ${fishSys.speciesCaught(s)}/${fishSys.FISH_IDS.length} loài · câu được tổng cộng ${fishSys.F(s).caught} con. Sưu tầm đủ cá của một chỗ câu sẽ có thưởng. Chạm 🎣 ở mép nước để câu.</p>${secs}`;
  }

  /** (0.23) Nút "📍 Chỉ đường" cho từng việc đang làm được của mạch truyện: lia máy quay tới đúng chỗ */
  guideBtns(arc) {
    const trig = this.game.storyTrig.filter((t) => t.arc === arc && !t.optional && !t.queued);
    if (!trig.length && arc === 'huong') {
      // (GĐ23) bước đếm của Đảo Ngàn Hương: chỉ tới chỗ hái / mở tiệm
      const key = storySys.current(this.save, 'huong').step?.count?.buds || '';
      const [kind, what] = key.split(':');
      const spot = kind === 'gather' ? Object.keys(GATHER).find((g) => GATHER[g].give[what]) : kind === 'play' ? Object.keys(GATHER).find((g) => GATHER[g].game === what) : null;
      if (spot) return `<div class="st-scenes"><button class="chip-btn on" data-nb="gfocus" data-id="${spot}">📍 Tới ${esc(GATHER[spot].name)} ${GATHER[spot].icon}</button></div>`;
      if (key) return '<div class="st-scenes"><button class="chip-btn on" data-nb="hgshop">🌸 Mở Tiệm Hương Nhài</button></div>';
    }
    if (!trig.length) return '<p class="muted small">Chưa tới lúc: đọc kỹ mục tiêu (ban đêm, triều xuống...) rồi quay lại nhé.</p>';
    const name = (t) => (t.via === 'villager' ? `Tìm ${villagerInfo(t.who)?.name || ''}` : t.via === 'mo' ? 'Tới chỗ bé Mơ' : `Tới chỗ ${t.icon || '✨'}`);
    return `<div class="st-scenes">${trig.slice(0, 6).map((t) => `<button class="chip-btn on" data-nb="goto" data-id="${t.scene}">📍 ${esc(name(t))}</button>`).join('')}</div>`;
  }

  village() {
    const s = this.save;
    const day = this.game.today;
    // người Mũi Én chỉ hiện sau khi bạn đã cập bến (GĐ21)
    const rows = rel.BOND_IDS.filter((id) => (!EN_PEOPLE.includes(id) || storySys.has(s, 'e1_boat')) && (!CO_PEOPLE.includes(id) || storySys.has(s, 'l1_path')) && (!HG_PEOPLE.includes(id) || storySys.has(s, 'h2_shop'))).map((id) => {
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
        <div class="mk-info"><b>${esc(g.title)}</b><small>${g.place ? `Ở ${esc(g.place)}` : `Việc nhờ của ${esc(who)}`}</small>
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
    if (act === 'buds') this.hud.openBuds();
    if (act === 'goto') { this.hud.closeModal(); this.game.focusStory(el.dataset.id); }
    if (act === 'gfocus') { this.hud.closeModal(); const g = GATHER[el.dataset.id]; this.game.controls.focusOn(new THREE.Vector3(g.at[0], 0, g.at[1]), Math.max(this.game.controls.zoom, 1.3)); }
    if (act === 'hgshop') { this.hud.openHgShop(); }
    if (act === 'replay') this.hud.playStory(el.dataset.id, { replay: true });
  }
}
