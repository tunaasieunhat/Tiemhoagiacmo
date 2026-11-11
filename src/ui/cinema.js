// 🎭 Hội thoại kiểu phim (GĐ20): dải đen, chân dung có nét mặt, chữ hiện dần kèm tiếng "bíp",
// lựa chọn giữa màn hình, tranh minh họa, hồi ức màu nâu, Bỏ qua / Tự chạy / Nhật ký thoại.
// Kịch bản nằm ở data/story.js; phần 3D (máy quay, diễn viên) gọi qua game.director.
import { CAST, SCENES, STORY_RULES, CG_TEXT } from '../../data/story.js';
import { villagerInfo } from '../systems/village.js';
import * as storySys from '../systems/story.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const MOODS = ['normal', 'happy', 'sad', 'surprised', 'think', 'cry', 'angry', 'shy'];

/** Chân dung chibi có nét mặt. a = { skin, hair, outfit, hat, bun }; opt.spirit: phát sáng (bé Mơ) */
export function portraitSVG(a, mood = 'normal', opt = {}) {
  const ink = '#3b2a22';
  let eyes, mouth, extra = '', brows = '';
  const eye = (x, ry = 5.5, rx = 4, dy = 0) => `<ellipse cx="${x}" cy="${58 + dy}" rx="${rx}" ry="${ry}" fill="${ink}"/><circle cx="${x + 1.5}" cy="${56 + dy}" r="1.4" fill="#fff"/>`;
  switch (mood) {
    case 'happy':
      eyes = `<path d="M34 59 Q39 52 44 59" stroke="${ink}" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M56 59 Q61 52 66 59" stroke="${ink}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
      mouth = '<path d="M43 68 Q50 77 57 68 Z" fill="#c96a5a"/>';
      break;
    case 'sad': case 'cry':
      eyes = eye(39, 5, 3.8, 1) + eye(61, 5, 3.8, 1);
      brows = `<path d="M33 50 L44 47" stroke="${ink}" stroke-width="2.4" stroke-linecap="round"/><path d="M67 50 L56 47" stroke="${ink}" stroke-width="2.4" stroke-linecap="round"/>`;
      mouth = '<path d="M45 72 Q50 68 55 72" stroke="#c96a5a" stroke-width="2.5" fill="none" stroke-linecap="round"/>';
      if (mood === 'cry') extra = '<path d="M36 64 Q33 72 36 76 Q39 72 36 64Z" fill="#8fd3ff"/><path d="M64 64 Q61 72 64 76 Q67 72 64 64Z" fill="#8fd3ff"/>';
      break;
    case 'surprised':
      eyes = `<circle cx="39" cy="57" r="6" fill="#fff" stroke="${ink}" stroke-width="2"/><circle cx="39" cy="57" r="2.6" fill="${ink}"/><circle cx="61" cy="57" r="6" fill="#fff" stroke="${ink}" stroke-width="2"/><circle cx="61" cy="57" r="2.6" fill="${ink}"/>`;
      brows = `<path d="M33 46 Q39 43 45 46" stroke="${ink}" stroke-width="2.2" fill="none" stroke-linecap="round"/><path d="M55 46 Q61 43 67 46" stroke="${ink}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
      mouth = '<ellipse cx="50" cy="71" rx="3.6" ry="4.6" fill="#c96a5a"/>';
      break;
    case 'think':
      eyes = `<ellipse cx="41" cy="57" rx="4" ry="5" fill="${ink}"/><ellipse cx="63" cy="57" rx="4" ry="5" fill="${ink}"/><circle cx="42.5" cy="55" r="1.3" fill="#fff"/><circle cx="64.5" cy="55" r="1.3" fill="#fff"/>`;
      brows = `<path d="M33 48 L44 49" stroke="${ink}" stroke-width="2.2" stroke-linecap="round"/><path d="M56 46 L67 48" stroke="${ink}" stroke-width="2.2" stroke-linecap="round"/>`;
      mouth = '<path d="M45 71 L54 70" stroke="#c96a5a" stroke-width="2.5" stroke-linecap="round"/>';
      extra = '<circle cx="80" cy="34" r="2.2" fill="#b9a8a0"/><circle cx="86" cy="27" r="3" fill="#b9a8a0"/><circle cx="93" cy="19" r="4" fill="#b9a8a0"/>';
      break;
    case 'angry':
      eyes = eye(39, 4.6) + eye(61, 4.6);
      brows = `<path d="M32 46 L45 51" stroke="${ink}" stroke-width="3" stroke-linecap="round"/><path d="M68 46 L55 51" stroke="${ink}" stroke-width="3" stroke-linecap="round"/>`;
      mouth = '<path d="M44 73 Q50 67 56 73" stroke="#c96a5a" stroke-width="2.8" fill="none" stroke-linecap="round"/>';
      extra = '<path d="M78 30 l6 -6 M84 30 l-6 -6 M81 33 v-12 M75 27 h12" stroke="#ec6b6b" stroke-width="2.4" stroke-linecap="round"/>';
      break;
    case 'shy':
      eyes = `<path d="M34 57 Q39 62 44 57" stroke="${ink}" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M56 57 Q61 62 66 57" stroke="${ink}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
      mouth = '<path d="M44 70 Q47 73 50 70 Q53 67 56 70" stroke="#c96a5a" stroke-width="2.4" fill="none" stroke-linecap="round"/>';
      extra = '<ellipse cx="31" cy="67" rx="7" ry="4" fill="#ff8f86" opacity=".75"/><ellipse cx="69" cy="67" rx="7" ry="4" fill="#ff8f86" opacity=".75"/>';
      break;
    default:
      eyes = eye(39) + eye(61);
      mouth = '<path d="M45 69 Q50 73 55 69" stroke="#c96a5a" stroke-width="2.5" fill="none" stroke-linecap="round"/>';
  }
  const glow = opt.spirit ? '<circle cx="50" cy="52" r="49" fill="url(#moGlow)"/>' : '';
  const defs = opt.spirit ? '<defs><radialGradient id="moGlow"><stop offset="0" stop-color="#eafff8"/><stop offset=".7" stop-color="#c8f5e8"/><stop offset="1" stop-color="#c8f5e8" stop-opacity="0"/></radialGradient></defs>' : '';
  return `<svg viewBox="0 0 100 104" aria-hidden="true">${defs}
    ${opt.spirit ? glow : '<circle cx="50" cy="52" r="48" fill="#fff6ee"/>'}
    <g ${opt.spirit ? 'opacity=".93"' : ''}>
    <path d="M24 104 Q26 82 50 80 Q74 82 76 104Z" fill="${a.outfit}"/>
    ${a.hat ? `<ellipse cx="50" cy="28" rx="44" ry="8" fill="${a.hat}"/>` : ''}
    ${a.bun ? `<circle cx="50" cy="${a.hat ? 14 : 22}" r="13" fill="${a.hair}"/>` : ''}
    <circle cx="50" cy="56" r="30" fill="${a.skin}"/>
    <path d="M20 54 Q22 26 50 26 Q78 26 80 54 Q70 40 50 40 Q30 40 20 54Z" fill="${a.hair}"/>
    ${a.hat ? `<path d="M30 28 Q32 8 50 8 Q68 8 70 28Z" fill="${a.hat}"/><rect x="30" y="24" width="40" height="5" rx="2" fill="#f28da0"/>` : `<path d="M22 50 Q24 30 50 30 Q76 30 78 50 Q66 38 50 40 Q34 38 22 50Z" fill="${a.hair}"/>`}
    ${opt.spirit ? '<g transform="translate(72 36)"><circle r="3" fill="#ffd34e"/><circle cx="0" cy="-5.5" r="3.6" fill="#fff"/><circle cx="5.2" cy="-1.7" r="3.6" fill="#fff"/><circle cx="3.2" cy="4.4" r="3.6" fill="#fff"/><circle cx="-3.2" cy="4.4" r="3.6" fill="#fff"/><circle cx="-5.2" cy="-1.7" r="3.6" fill="#fff"/><circle r="2.6" fill="#ffd34e"/></g>' : ''}
    ${brows}${eyes}
    ${mood === 'shy' ? '' : '<ellipse cx="31" cy="67" rx="5" ry="3" fill="#ffab9c"/><ellipse cx="69" cy="67" rx="5" ry="3" fill="#ffab9c"/>'}
    ${mouth}${extra}
    </g></svg>`;
}

/** Chữ nhật ký: ▒ thành vệt mực phai */
const smudge = (text) => esc(text).replace(/▒+/g, (m) => `<i class="smudge" style="width:${Math.min(11, m.length * 0.55).toFixed(1)}em"></i>`).replace(/\n/g, '<br>');

export class Cinema {
  constructor({ game, hud }) {
    this.game = game;
    this.hud = hud;
    this.active = false;
    this.el = document.createElement('div');
    this.el.id = 'cine';
    this.el.className = 'hidden';
    this.el.innerHTML = `
      <div class="cn-vig"></div><div class="cn-dark"></div>
      <div class="cn-bar top"></div><div class="cn-bar bot"></div>
      <div class="cn-title"><small></small><b></b></div>
      <div class="cn-cg"></div>
      <div class="cn-choices"></div>
      <div class="cn-note"></div>
      <div class="cn-box hidden"><div class="cn-port"></div><div class="cn-body"><b class="cn-name"></b><p class="cn-text"></p><i class="cn-next">▼</i></div></div>
      <div class="cn-tools">
        <button data-cn="auto" aria-label="Tự chạy">▶ Tự chạy</button>
        <button data-cn="log" aria-label="Nhật ký thoại">📜 Nhật ký</button>
        <button data-cn="skip" aria-label="Bỏ qua">⏭ Bỏ qua</button>
      </div>
      <div class="cn-log hidden"><div class="cn-log-in"><h3>📜 Nhật ký thoại</h3><div class="cn-log-list"></div><button class="btn primary wide" data-cn="log-close">Đóng</button></div></div>`;
    document.body.appendChild(this.el);
    this.$ = (s) => this.el.querySelector(s);
    this.el.addEventListener('click', (e) => this.onClick(e));
    addEventListener('keydown', (e) => {
      if (!this.active || this.choosing) return;
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); this.tap(); }
    });
  }

  // ---------------- điều khiển ----------------
  onClick(e) {
    const b = e.target.closest('[data-cn]');
    if (b) {
      e.stopPropagation();
      const act = b.dataset.cn;
      if (act === 'skip') this.askSkip(b);
      else if (act === 'auto') { this.auto = !this.auto; b.classList.toggle('on', this.auto); b.textContent = this.auto ? '⏸ Dừng' : '▶ Tự chạy'; if (this.auto && !this.typing) this.tap(); }
      else if (act === 'log') this.showLog(true);
      else if (act === 'log-close') this.showLog(false);
      else if (act === 'pick') this.pickResolve?.(+b.dataset.i);
      return;
    }
    if (!this.$('.cn-log').classList.contains('hidden')) return;
    if (!this.choosing) this.tap();
  }

  /** Bỏ qua: bấm 2 lần (lần đầu hỏi lại) — nhảy tới lựa chọn kế hoặc hết cảnh */
  askSkip(b) {
    if (!b.dataset.armed) {
      b.dataset.armed = '1'; b.textContent = '⏭ Bỏ qua thật?';
      setTimeout(() => { delete b.dataset.armed; b.textContent = '⏭ Bỏ qua'; }, 2500);
      return;
    }
    delete b.dataset.armed; b.textContent = '⏭ Bỏ qua';
    this.skipping = true;
    this.tap();
  }

  tap() {
    if (this.typing) { this.typing = false; return; } // hiện hết câu
    const r = this.waitResolve;
    this.waitResolve = null;
    r?.();
  }

  showLog(on) {
    const box = this.$('.cn-log');
    if (on) {
      this.$('.cn-log-list').innerHTML = this.log.map((l) => (l.pick ? `<p class="pick">➤ ${esc(l.text)}</p>` : `<p>${l.name ? `<b>${esc(l.name)}</b> ` : ''}<span class="${l.name ? '' : 'nar'}">${esc(l.text)}</span></p>`)).join('') || '<p class="muted">Chưa có gì.</p>';
      box.classList.remove('hidden');
      const list = this.$('.cn-log-list');
      list.scrollTop = list.scrollHeight;
    } else box.classList.add('hidden');
  }

  nameOf(who, as) {
    if (as) return as;
    const c = CAST[who];
    if (c?.name) return storySys.fmt(c.name, this.game.save);
    return villagerInfo(who)?.name || who;
  }

  lookOf(who) {
    if (who === 'you') return this.game.save.player.avatar;
    return CAST[who]?.look || villagerInfo(who)?.look || { skin: '#ffe0c7', hair: '#6b4433', outfit: '#ddd' };
  }

  // ---------------- chạy 1 cảnh ----------------
  /**
   * opts.replay: xem lại từ Sổ tay (không ghi gì vào save)
   * Trả về { done: true } khi xem hết.
   */
  async play(sceneId, { replay = false } = {}) {
    const scene = SCENES[sceneId];
    if (!scene || this.active) return { done: false };
    const g = this.game, save = g.save, dir = g.director;
    const lines = scene.lines;
    const labels = {};
    lines.forEach((l, i) => { if (l[0] === 'label') labels[l[1]] = i; });
    // kể tiếp chỗ đang dở (thoát game giữa cảnh)
    const cur = !replay && save.story?.cur?.id === sceneId ? save.story.cur : null;
    const resumeAt = cur ? Math.min(cur.i, lines.length - 1) : 0;
    const oldPicks = cur ? [...(cur.picks || [])] : [];
    const picks = [];
    Object.assign(this, { active: true, skipping: false, auto: false, typing: false, choosing: false, log: [], sceneId });
    this.$('[data-cn="auto"]').classList.remove('on');
    this.$('[data-cn="auto"]').textContent = '▶ Tự chạy';
    this.el.classList.remove('hidden');
    requestAnimationFrame(() => this.el.classList.add('on'));
    dir.begin();
    let i = 0;
    let ff = resumeAt > 0; // tua nhanh tới chỗ dở: chỉ dựng lại cảnh (máy quay, diễn viên, tranh), không hiện thoại
    try {
      while (i < lines.length) {
        if (ff && i >= resumeAt) ff = false;
        const ln = lines[i];
        const op = ln[0];
        let jump = null;
        if (!replay && !ff && (op === 'nar' || op === 'choice' || CAST[op] || villagerInfo(op))) { storySys.saveProgress(save, sceneId, i, picks); g.saveMgr.markDirty(); }
        if (op === 'end') break;
        else if (op === 'label') { /* mốc nhảy */ }
        else if (op === 'go') jump = ln[1];
        else if (op === 'if') { if (storySys.cond(save, ln[1])) jump = ln[2]; }
        else if (op === 'set') { if (!replay && !ff) { storySys.setFlag(save, ln[1]); g.syncStoryWorld(); } }
        else if (op === 'bud') { if (!replay && !ff) g.storyBud(ln[1]); }
        else if (op === 'give') { if (!replay && !ff) g.storyGive(ln[1]); }
        else if (op === 'bait') { if (!replay && !ff) g.storyBait(ln[1], ln[2] || 1); }
        else if (op === 'rod') { if (!replay && !ff) g.storyRod(ln[1]); }
        else if (op === 'plot') { if (!replay && !ff) g.storyPlot(ln[1]); }
        else if (op === 'seed') { if (!replay && !ff) g.storySeeds(ln[1], ln[2] || 1); }
        else if (op === 'title') { if (!ff) await this.title(ln[1], ln[2]); }
        else if (op === 'nar') { if (!ff) await this.say(null, 'normal', ln[1]); }
        else if (op === 'wait') { if (!ff && !this.skipping) await sleep(ln[1] * 1000); }
        else if (op === 'sfx') { if (!ff && !this.skipping) g.audio?.sfx?.chime?.(ln[2] || 3); }
        else if (op === 'cam') dir.cam(ln[1], ln[2]);
        else if (op === 'meet') dir.meet(ln[1]);
        else if (op === 'place') dir.place(ln[1], ln[2], ln[3], ln[4]);
        else if (op === 'walk') dir.walk(ln[1], ln[2], ln[3]);
        else if (op === 'hide') dir.hide(ln[1]);
        else if (op === 'emote') { if (!ff && !this.skipping) { dir.emote(ln[1], ln[2]); await sleep(350); } }
        else if (op === 'fx') await this.fx(ln[1], ln[2], ff);
        else if (op === 'cg') await this.cg(ln[1], ln[2] || {}, ff);
        else if (op === 'choice') {
          this.skipping = false;
          // lựa chọn có if: chỉ hiện khi đủ điều kiện (vd kết ẩn). Xem lại từ Sổ tay cũng theo điều kiện hiện tại.
          const opts = ln[1].filter((o) => storySys.cond(save, o.if));
          let k;
          if (ff) k = oldPicks[picks.length] ?? 0;
          else k = await this.choose(opts);
          const opt = opts[k] || opts[0];
          picks.push(k);
          if (!ff) {
            this.log.push({ pick: true, text: opt.t });
            if (!replay) { const r = g.storyChoice(opt); this.note(opt, r); }
            else g.syncStoryWorld({ [opt.set]: 1 });
          }
          jump = opt.go || null;
        } else {
          // lời thoại: [ai, (nét mặt), chữ, (tùy chọn)]
          const hasMood = MOODS.includes(ln[1]) && typeof ln[2] === 'string';
          const mood = hasMood ? ln[1] : 'normal';
          const text = hasMood ? ln[2] : ln[1];
          const o = (hasMood ? ln[3] : ln[2]) || {};
          if (!ff) await this.say(op, mood, text, o);
        }
        i = jump != null && labels[jump] != null ? labels[jump] : i + 1;
      }
    } catch (e) { console.error('Lỗi khi chạy cảnh', sceneId, e); }
    // kết thúc
    this.$('.cn-box').classList.add('hidden');
    this.$('.cn-choices').innerHTML = '';
    this.el.classList.remove('on');
    await this.fx('sepia', false, true);
    this.cg(null, {}, true);
    dir.end();
    g.syncStoryWorld();
    await sleep(380);
    this.$('.cn-dark').classList.remove('on');
    this.el.classList.add('hidden');
    this.active = false;
    return { done: true };
  }

  /** Đợi người chơi chạm (hoặc tự chạy / bỏ qua) */
  waitTap(text = '') {
    if (this.skipping) return Promise.resolve();
    return new Promise((res) => {
      let timer = null;
      const done = () => { clearTimeout(timer); if (this.waitResolve === done) this.waitResolve = null; res(); };
      this.waitResolve = done;
      const arm = () => {
        if (this.waitResolve !== done) return;
        if (this.auto) timer = setTimeout(done, (STORY_RULES.autoPlayPause + text.length * 0.045) * 1000);
        else timer = setTimeout(arm, 300);
      };
      arm();
    });
  }

  async say(who, mood, raw, o = {}) {
    const g = this.game;
    const text = storySys.fmt(raw, g.save);
    const box = this.$('.cn-box');
    const name = who ? this.nameOf(who, o.as) : '';
    this.log.push({ name, text });
    if (this.skipping) return;
    box.classList.remove('hidden');
    box.classList.toggle('nar', !who);
    box.classList.toggle('right', who === 'you');
    box.classList.toggle('spirit', !!CAST[who]?.spirit);
    box.style.setProperty('--nc', CAST[who]?.color || (who === 'you' ? '#6fb7e0' : '#f47a93'));
    this.$('.cn-port').innerHTML = who ? portraitSVG(this.lookOf(who), mood, { spirit: CAST[who]?.spirit }) : '';
    this.$('.cn-name').textContent = name;
    if (who && who !== 'you') g.director.speaking(who);
    // chữ hiện dần + tiếng bíp theo giọng từng người
    const p = this.$('.cn-text');
    const next = this.$('.cn-next');
    next.classList.add('hidden');
    const chars = [...text];
    const pitch = CAST[who]?.pitch || 0;
    this.typing = true;
    const t0 = performance.now();
    let shown = 0;
    while (this.typing && shown < chars.length) {
      const want = Math.min(chars.length, Math.floor(((performance.now() - t0) / 1000) * STORY_RULES.typeSpeed) + 1);
      if (want > shown) {
        if (pitch && want % 3 === 0 && /\S/.test(chars[want - 1])) g.audio?.sfx?.blip?.(pitch);
        shown = want;
        p.textContent = chars.slice(0, shown).join('');
      }
      await sleep(16);
    }
    this.typing = false;
    p.textContent = text;
    next.classList.remove('hidden');
    await this.waitTap(text);
  }

  async title(small, big) {
    if (this.skipping) return;
    const t = this.$('.cn-title');
    t.querySelector('small').textContent = small || '';
    t.querySelector('b').textContent = big || '';
    this.$('.cn-box').classList.add('hidden');
    t.classList.add('on');
    this.game.audio?.sfx?.chime?.(4);
    await Promise.race([sleep(2600), this.waitTap()]);
    this.waitResolve = null;
    t.classList.remove('on');
    await sleep(500);
  }

  choose(opts) {
    this.choosing = true;
    this.$('.cn-box .cn-next').classList.add('hidden');
    const box = this.$('.cn-choices');
    box.innerHTML = opts.map((o, i) => `<button class="cn-pick" data-cn="pick" data-i="${i}" style="animation-delay:${i * 90}ms">${esc(storySys.fmt(o.t, this.game.save))}</button>`).join('');
    box.classList.add('on');
    return new Promise((res) => {
      this.pickResolve = (i) => {
        this.pickResolve = null;
        this.choosing = false;
        box.classList.remove('on');
        box.innerHTML = '';
        this.game.audio?.sfx?.chime?.(2);
        res(i);
      };
    });
  }

  /** "… sẽ nhớ điều này." + điểm tình thân thay đổi */
  note(opt, r) {
    const parts = [];
    if (opt.remember) parts.push(`💭 ${this.nameOf(opt.remember)} sẽ nhớ điều này.`);
    for (const [id, d] of Object.entries(r?.fp || {})) parts.push(`${d > 0 ? '💗 +' : '💔 '}${d} tình thân với ${this.nameOf(id)}`);
    if (!parts.length) return;
    const n = this.$('.cn-note');
    n.innerHTML = parts.map((p) => `<span>${esc(p)}</span>`).join('');
    n.classList.remove('on');
    void n.offsetWidth;
    n.classList.add('on');
    clearTimeout(this.noteT);
    this.noteT = setTimeout(() => n.classList.remove('on'), 3200);
  }

  async fx(name, on, instant = false) {
    if (name === 'dark') {
      this.$('.cn-dark').classList.toggle('on', !!on);
      if (on) this.$('.cn-box').classList.add('hidden');
      if (!instant && !this.skipping) await sleep(650);
    } else if (name === 'sepia') {
      document.body.classList.toggle('cine-sepia', !!on);
      this.el.classList.toggle('sepia', !!on);
      this.game.director.flashback(!!on);
    }
  }

  /** Tranh minh họa */
  async cg(kind, o = {}, instant = false) {
    const box = this.$('.cn-cg');
    if (!kind) { box.classList.remove('on'); if (!instant) await sleep(250); box.innerHTML = ''; return; }
    let html = '';
    if (kind === 'letter') {
      html = `<div class="cg-paper letter"><i class="cg-key">🗝️</i>${CG_TEXT.letter.map((l) => (l ? `<p>${esc(l)}</p>` : '<p>&nbsp;</p>')).join('')}<i class="cg-stain"></i></div>`;
    } else if (kind === 'sign') {
      const s = CG_TEXT.sign;
      html = `<div class="cg-sign"><div class="cg-sign-hand"><b>${esc(s.name)}</b><span>${esc(s.sub)}</span><i>${esc(s.by)}</i></div><div class="cg-sign-paint"><b>${esc(s.name)}</b></div></div>`;
    } else if (kind === 'page') {
      html = `<div class="cg-paper page"><small>Trang ${(o.i || 0) + 1}/${CG_TEXT.pages.length}</small><p>${smudge(CG_TEXT.pages[o.i || 0])}</p></div>`;
    } else if (kind === 'bottle') {
      const b = CG_TEXT.bottles[o.i || 0];
      html = `<div class="cg-paper letter bottle"><small>🍾 ${esc(b.year)}</small>${b.text.split('\n').map((l) => `<p>${esc(l)}</p>`).join('')}</div>`;
    } else if (kind === 'fade') {
      html = `<div class="cg-paper page fading"><p>${smudge(CG_TEXT.pages[0])}</p><b class="cg-sig">Diệp</b></div>`;
    }
    box.innerHTML = html;
    box.classList.add('on');
    if (!instant && !this.skipping) { this.game.audio?.sfx?.chime?.(kind === 'fade' ? 1 : 3); await sleep(kind === 'sign' ? 1900 : 500); }
  }
}
