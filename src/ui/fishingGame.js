// 🎣 Giao diện câu cá (GĐ22): chọn mồi → quăng cần (canh lực) → chờ phao chìm → kéo cá (giữ dây trong vùng xanh) → kết quả.
// Logic thuần ở src/systems/fishing.js; game.fishCast / game.fishLand lo trừ mồi, cộng cá, thưởng.
import { FISH_SPOTS, BAITS, RODS, FISH_RULES } from '../../data/fishing.js';
import * as fishSys from '../systems/fishing.js';
import { WEATHER } from '../../data/seasons.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const MOVE_NAME = { calm: 'kéo đều', jerk: 'giật từng cơn', dash: 'lao ra xa', dive: 'lặn sâu', fury: 'vùng rất dữ' };

export class FishingUI {
  constructor(hud) {
    this.hud = hud;
    this.game = hud.game;
    this.el = null;
    this.busy = false;
  }

  get active() { return !!this.el; }

  /** Mở màn câu ở 1 chỗ câu */
  open(spotId) {
    if (this.el || !FISH_SPOTS[spotId]) return;
    this.spot = spotId;
    this.hud.closeModal();
    const el = document.createElement('div');
    el.id = 'fishing';
    el.innerHTML = '<div class="fs-card"></div>';
    document.body.appendChild(el);
    this.el = el;
    this.card = el.querySelector('.fs-card');
    this.hold = false;
    el.addEventListener('click', (e) => this.onClick(e));
    const down = (e) => { if (e.target.closest('button')) return; this.hold = true; this.tap?.(); };
    const up = () => { this.hold = false; };
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up); el.addEventListener('pointerleave', up);
    this.keyDown = (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); if (!this.hold) { this.hold = true; this.tap?.(); } } };
    this.keyUp = (e) => { if (e.key === ' ' || e.key === 'Enter') this.hold = false; };
    addEventListener('keydown', this.keyDown); addEventListener('keyup', this.keyUp);
    this.prep();
  }

  close() {
    if (!this.el) return;
    this.stop = true;
    removeEventListener('keydown', this.keyDown); removeEventListener('keyup', this.keyUp);
    this.el.remove();
    this.el = null;
    this.tap = null;
    window.__fishing = null;
    this.game.emitter.emit('inventory');
  }

  ctx() { const g = this.game; return { hour: g.clock.hourFloat, day: g.today, weather: g.save.weather?.today?.type }; }

  // ---------------- màn chuẩn bị ----------------
  prep(note = '') {
    this.phase = 'prep'; this.tap = null;
    const g = this.game, s = g.save, st = fishSys.F(s), sp = FISH_SPOTS[this.spot];
    const e = fishSys.envOf(this.ctx());
    const open = fishSys.spotOpen(s, this.spot, this.ctx());
    const now = fishSys.fishNow(this.spot, this.ctx());
    const got = now.filter((id) => st.book[id]?.n).length;
    // còn mấy ngày nữa tới đêm rằm (rằm = ngày chia hết cho moonEvery)
    const moonIn = (FISH_RULES.moonEvery - (e.day % FISH_RULES.moonEvery)) % FISH_RULES.moonEvery;
    const chips = [`${WEATHER[e.weather]?.icon || '☀️'} ${esc(WEATHER[e.weather]?.name || 'Nắng đẹp')}`, e.night ? '🌙 Ban đêm' : '☀️ Ban ngày', e.lowTide ? '🌊 Triều xuống' : '🌊 Triều lên', e.moon ? '🌕 Đêm rằm' : moonIn ? `🌕 Rằm: còn ${moonIn} ngày` : '🌕 Rằm: đêm nay'].filter(Boolean);
    const baits = Object.entries(BAITS).map(([id, b]) => `<button class="fs-bait ${st.baitSel === id ? 'on' : ''} ${st.bait[id] > 0 ? '' : 'empty'}" data-fs="bait" data-id="${id}" title="${esc(b.desc)}"><span>${b.icon}</span><b>${esc(b.name)}</b><small>×${st.bait[id] || 0}</small></button>`).join('');
    const rod = RODS[st.rod] || RODS.bamboo;
    const canCast = open.ok && st.bait[st.baitSel] > 0;
    this.card.className = 'fs-card prep';
    this.card.innerHTML = `
      <button class="round sm fs-x" data-fs="close" aria-label="Đóng">✕</button>
      <h2>${sp.icon} ${esc(sp.name)}</h2>
      <p class="muted small">${esc(sp.desc)}</p>
      <div class="chips">${chips.map((c) => `<span class="chip-s">${c}</span>`).join('')}<span class="chip-s">🐟 Đang có ${now.length} loài (đã biết ${got})</span></div>
      ${note ? `<p class="fs-note">${esc(note)}</p>` : ''}
      ${open.ok ? '' : `<p class="fs-note warn">${esc(open.msg)}</p>`}
      <h3>Chọn mồi <small class="muted">· mỗi lần quăng tốn 1 mồi</small></h3>
      <div class="fs-baits">${baits}</div>
      <p class="small">${rod.icon} Đang dùng: <b>${esc(rod.name)}</b> · 🧺 Giỏ cá: ${fishSys.bagCount(s)} con</p>
      <div class="row-btns"><button class="btn primary ${canCast ? '' : 'disabled'}" data-fs="cast">🎣 Quăng cần</button><button class="btn" data-fs="stall">🐟 Quầy cá</button></div>`;
  }

  onClick(e) {
    const b = e.target.closest('[data-fs]');
    if (!b) return;
    const g = this.game, st = fishSys.F(g.save);
    switch (b.dataset.fs) {
      case 'close': this.close(); break;
      case 'bait': st.baitSel = b.dataset.id; g.saveMgr.markDirty(); this.prep(); break;
      case 'stall': this.close(); this.hud.openFishStall(); break;
      case 'again': this.prep(); break;
      case 'cast':
        if (b.classList.contains('disabled')) { const o = fishSys.spotOpen(g.save, this.spot, this.ctx()); this.prep(o.ok ? 'Hết mồi rồi! Vào 🐟 Quầy cá mua thêm nhé.' : ''); return; }
        this.round();
        break;
      default:
    }
  }

  // ---------------- 1 lượt câu ----------------
  async round() {
    if (this.busy) return;
    this.busy = true; this.stop = false;
    try {
      const far = await this.power();
      if (this.stop) return;
      const c = this.game.fishCast(this.spot, far);
      if (!c.ok) { this.prep(c.msg); return; }
      const cfg = fishSys.reelConfig(this.game.save, c);
      const hooked = await this.wait(cfg);
      if (this.stop) return;
      let landed = false;
      if (hooked) landed = c.kind === 'junk' || c.kind === 'chest' || c.kind === 'bottle' ? true : await this.reel(c, cfg);
      if (this.stop) return;
      const res = this.game.fishLand(c, landed, hooked ? '' : 'early');
      await this.result(c, res, hooked);
    } finally { this.busy = false; }
  }

  /** Thanh lực: chạm để dừng. Trúng vùng vàng = quăng xa. */
  power() {
    this.phase = 'power';
    this.card.className = 'fs-card play';
    this.card.innerHTML = `<p class="fs-hint">Chạm để quăng cần! Trúng vạch vàng là quăng xa, cá to hơn.</p>
      <div class="fs-power"><i class="fs-gold"></i><i class="fs-needle"></i></div>`;
    const needle = this.card.querySelector('.fs-needle');
    return new Promise((res) => {
      const t0 = performance.now(); let v = 0, done = false;
      const tick = () => {
        if (done || this.stop) { if (this.stop) res(false); return; }
        const t = (performance.now() - t0) / 1000;
        v = (Math.sin(t * 3.4 - Math.PI / 2) + 1) / 2; // 0..1
        needle.style.left = `${v * 100}%`;
        window.__fishing = { phase: 'power', v };
        requestAnimationFrame(tick);
      };
      this.tap = () => { done = true; this.tap = null; res(v >= 0.78 && v <= 0.95); };
      requestAnimationFrame(tick);
    });
  }

  /** Chờ cắn câu: phao nhấp nhô, có thể nhử giả; phao chìm + ❗ thì chạm. Chạm sớm = cá chạy. */
  wait(cfg) {
    this.phase = 'wait';
    window.__fishing = { phase: 'wait', bite: false };
    this.card.innerHTML = `<p class="fs-hint">Đợi phao chìm hẳn và hiện ❗ rồi chạm thật nhanh!</p>
      <div class="fs-water"><i class="fs-shadow"></i><i class="fs-bob">🔴</i><b class="fs-bang">❗</b></div>`;
    const water = this.card.querySelector('.fs-water');
    return new Promise((res) => {
      const wait = (cfg.waitMin + Math.random() * (cfg.waitMax - cfg.waitMin)) * 1000;
      const fakeAt = Math.random() < 0.5 ? wait * (0.35 + Math.random() * 0.3) : -1;
      const t0 = performance.now(); let bite = 0, done = false;
      const end = (ok) => { if (done) return; done = true; this.tap = null; res(ok); };
      const tick = () => {
        if (done) return;
        if (this.stop) { end(false); return; }
        const t = performance.now() - t0;
        if (!bite && fakeAt > 0 && t > fakeAt && t < fakeAt + 350) water.classList.add('nib'); else water.classList.remove('nib');
        if (!bite && t >= wait) { bite = performance.now(); water.classList.add('bite'); this.game.audio?.sfx?.chime?.(1); }
        if (bite && performance.now() - bite > cfg.biteWindow * 1000) { end(false); return; }
        window.__fishing = { phase: 'wait', bite: !!bite };
        requestAnimationFrame(tick);
      };
      // 0,4 giây đầu bỏ qua chạm (lỡ chạm đúp lúc quăng cần thì không bị tính là giật sớm)
      this.tap = () => { if (!bite && performance.now() - t0 < 400) return; end(!!bite); };
      requestAnimationFrame(tick);
    });
  }

  /** Kéo cá: giữ để căng dây, thả để chùng. Giữ kim trong vùng xanh cho đầy thanh tiến độ. */
  reel(c, cfg) {
    this.phase = 'reel';
    window.__fishing = { phase: 'reel', tension: 30, zc: 50, zw: cfg.zone, progress: cfg.start };
    const mystery = c.kind === 'mong' ? 'Một cái bóng trắng khổng lồ...' : `Cá ${FISH_RULES.tierNames[c.tier].toLowerCase()} · ${MOVE_NAME[cfg.move]}`;
    this.card.innerHTML = `<p class="fs-hint"><b>Giữ</b> để kéo căng dây, <b>thả</b> để chùng. Giữ kim trong vùng xanh!</p>
      <p class="fs-kind" style="--tc:${FISH_RULES.tierColors[c.tier]}">${esc(mystery)}</p>
      <div class="fs-tension"><i class="fs-zone"></i><i class="fs-needle"></i><span class="fs-snap">ĐỨT!</span></div>
      <div class="fs-prog"><i></i></div>
      <div class="fs-reelbtn">🎣 GIỮ ĐỂ KÉO</div>`;
    const zoneEl = this.card.querySelector('.fs-zone'), needle = this.card.querySelector('.fs-tension .fs-needle');
    const prog = this.card.querySelector('.fs-prog i'), bar = this.card.querySelector('.fs-tension');
    this.hold = false;
    return new Promise((res) => {
      let tension = 30, zc = 50, target = 50, nextMove = 0, progress = cfg.start, over = 0, last = performance.now(), t = 0, done = false;
      const end = (ok) => { if (done) return; done = true; res(ok); };
      const tick = (now) => {
        if (done) return;
        if (this.stop) { end(false); return; }
        const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt;
        // cá vùng vẫy: vùng xanh di chuyển theo kiểu của loài
        if (cfg.move === 'calm') target = 50 + Math.sin(t * 0.8) * 9;
        else if (cfg.move === 'dash') target = 64 + Math.sin(t * 1.7) * 17;
        else if (cfg.move === 'dive') target = 36 + Math.sin(t * 1.3) * 16;
        else if (t >= nextMove) { target = 22 + Math.random() * 56; nextMove = t + (cfg.move === 'fury' ? 0.55 + Math.random() * 0.5 : 1.2 + Math.random() * 0.9); }
        zc += (target - zc) * Math.min(1, dt * (cfg.move === 'fury' ? 5 : 3.2));
        tension = Math.max(0, Math.min(100, tension + (this.hold ? cfg.up : -cfg.down) * dt));
        const inZone = Math.abs(tension - zc) <= cfg.zone / 2;
        progress = Math.max(0, Math.min(100, progress + (inZone ? cfg.gain : -cfg.drain) * dt));
        over = tension >= 99.5 ? over + dt : 0;
        zoneEl.style.left = `${zc - cfg.zone / 2}%`; zoneEl.style.width = `${cfg.zone}%`;
        needle.style.left = `${tension}%`;
        prog.style.width = `${progress}%`;
        bar.classList.toggle('good', inZone); bar.classList.toggle('danger', tension > 90);
        window.__fishing = { phase: 'reel', tension, zc, zw: cfg.zone, progress };
        if (over > cfg.snapAfter) { bar.classList.add('snapped'); this.snapped = true; setTimeout(() => end(false), 500); return; }
        if (progress >= 100) { end(true); return; }
        if (progress <= 0 || t > cfg.timeLimit) { end(false); return; }
        requestAnimationFrame(tick);
      };
      this.snapped = false;
      requestAnimationFrame(tick);
    });
  }

  async result(c, res, hooked) {
    this.phase = 'result'; this.tap = null;
    window.__fishing = { phase: 'result', kind: res.kind };
    let html;
    if (res.kind === 'miss') {
      html = `<div class="fs-res miss"><span class="fs-big">💨</span><b>${!hooked ? 'Cá chạy mất rồi!' : this.snapped ? 'Đứt dây!' : 'Cá sổng mất!'}</b><small>${!hooked ? 'Chạm đúng lúc phao chìm và hiện ❗ nhé.' : this.snapped ? 'Đừng giữ căng kịch quá lâu. Thả tay cho dây chùng bớt.' : 'Giữ kim trong vùng xanh lâu hơn để thanh tiến độ đầy.'}</small></div>`;
    } else if (res.kind === 'junk') html = `<div class="fs-res"><span class="fs-big">${res.junk.icon}</span><b>${esc(res.junk.name)}</b><small>Không phải cá... bán ve chai được ${res.coins} 💰.</small></div>`;
    else if (res.kind === 'chest') html = `<div class="fs-res good"><span class="fs-big">🧰</span><b>Rương báu!</b><small>+${res.coins} 💰${res.luck ? ' · +1 🎟️ vé may mắn' : ''}${res.bait ? ` · +${res.bait.n} 🌸 mồi hoa` : ''}</small></div>`;
    else if (res.kind === 'bottle') html = '<div class="fs-res good"><span class="fs-big">🍾</span><b>Một chiếc chai đóng rêu</b><small>Bên trong có một mảnh giấy cuộn tròn...</small></div>';
    else if (res.kind === 'mong') html = '<div class="fs-res good"><span class="fs-big">🐋</span><b>Cá Mộng</b><small>Trắng như trăng. Nó không vùng vẫy nữa, chỉ nhìn bạn.</small></div>';
    else {
      const f = res.fish, tc = FISH_RULES.tierColors[f.t];
      html = `<div class="fs-res good" style="--tc:${tc}"><span class="fs-big ${res.shiny ? 'shiny' : ''}">${f.icon}</span>
        <b>${res.shiny ? '✨ ' : ''}${esc(f.name)}${res.shiny ? ' ánh kim' : ''} <i class="stars">${'★'.repeat(res.q)}</i></b>
        <small><span class="fs-tier">${FISH_RULES.tierNames[f.t]}</span> · dài ${res.cm} cm · bán ~${fishSys.priceOf(res.key)} 💰</small>
        ${res.isNew ? '<small class="fs-new">📖 Loài mới vào Sổ cá!</small>' : res.record ? '<small class="fs-new">🏆 Con to nhất từ trước tới giờ!</small>' : ''}
        ${res.pearl ? `<small class="fs-new">⚪ Tách sò ra một viên ngọc trai: +${res.pearl.coins} 💰</small>` : ''}
        ${res.spotComplete ? '<small class="fs-new">🎉 Đã sưu tầm đủ cá ở chỗ câu này! Nhận thưởng rồi nhé.</small>' : ''}</div>`;
    }
    this.card.className = 'fs-card result';
    this.card.innerHTML = `${html}<div class="row-btns"><button class="btn primary" data-fs="again">🎣 Câu tiếp</button><button class="btn" data-fs="close">Thôi</button></div>`;
    if (res.kind !== 'miss') this.game.audio?.sfx?.chime?.(res.kind === 'fish' ? 2 + res.fish.t : 3);
    // chai thư / Cá Mộng: đóng màn câu để cảnh truyện chiếu
    if (res.kind === 'bottle' || res.kind === 'mong') { await sleep(1400); this.close(); }
  }
}
