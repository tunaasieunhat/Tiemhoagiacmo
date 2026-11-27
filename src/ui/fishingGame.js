// 🎣 Giao diện câu cá — làm lại (0.28): cảnh vẽ động bằng canvas thay cho các thanh ngang.
//   chọn mồi → quăng cần (chạm khi kim vào vạch vàng) → phao bay ra xa, cá bơi tới, nhử, cắn (chạm khi hiện ❗)
//   → kéo cá (GIỮ để kéo căng dây, THẢ cho chùng — giữ kim trong vùng xanh, cá lại gần bờ dần) → cá nhảy khỏi mặt nước.
// Luật & số liệu không đổi: src/systems/fishing.js + data/fishing.js; game.fishCast / game.fishLand lo trừ mồi, cộng cá, thưởng.
// window.__fishing = { phase, v, bite, tension, zc, zw, progress } để bài thử tự động đọc.
import { FISH_SPOTS, BAITS, RODS, FISH_RULES } from '../../data/fishing.js';
import * as fishSys from '../systems/fishing.js';
import { WEATHER } from '../../data/seasons.js';
import { lookOf } from '../systems/wardrobe.js';
import { fishArt, itemArt } from './art.js';

/** (0.30) SVG → ảnh để vẽ lên canvas (cá nhảy khỏi mặt nước) */
function artImage(svgStr) {
  if (!svgStr) return null;
  const img = new Image();
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgStr.replace('class="art', 'width="128" height="128" class="art'))}`;
  return img;
}

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const MOVE_NAME = { calm: 'kéo đều', jerk: 'giật từng cơn', dash: 'lao ra xa', dive: 'lặn sâu', fury: 'vùng rất dữ' };
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const buzz = (ms) => { try { navigator.vibrate?.(ms); } catch { /* bỏ qua */ } };

// Màu nước theo loại nước của chỗ câu
const WATER = {
  'ngọt': ['#8fd3c4', '#4f9e9a', '#2f6f74'],
  'biển': ['#7cc4ea', '#3f86b8', '#21507a'],
  'lợ': ['#a8c99a', '#6f9a76', '#40665a'],
};

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
    this.stopScene();
    removeEventListener('keydown', this.keyDown); removeEventListener('keyup', this.keyUp);
    this.el.remove();
    this.el = null;
    this.tap = null;
    window.__fishing = null;
    this.game.emitter.emit('inventory');
  }

  ctx() { const g = this.game; return { hour: g.clock.hourFloat, day: g.today, weather: g.save.weather?.today?.type }; }

  // ---------------- màn chuẩn bị (giữ như cũ) ----------------
  prep(note = '') {
    this.phase = 'prep'; this.tap = null;
    this.stopScene();
    const g = this.game, s = g.save, st = fishSys.F(s), sp = FISH_SPOTS[this.spot];
    const e = fishSys.envOf(this.ctx());
    const open = fishSys.spotOpen(s, this.spot, this.ctx());
    const now = fishSys.fishNow(this.spot, this.ctx());
    const got = now.filter((id) => st.book[id]?.n).length;
    const moonIn = (FISH_RULES.moonEvery - (e.day % FISH_RULES.moonEvery)) % FISH_RULES.moonEvery;
    const chips = [`${WEATHER[e.weather]?.icon || '☀️'} ${esc(WEATHER[e.weather]?.name || 'Nắng đẹp')}`, e.night ? '🌙 Ban đêm' : '☀️ Ban ngày', e.lowTide ? '🌊 Triều xuống' : '🌊 Triều lên', e.moon ? '🌕 Đêm rằm' : moonIn ? `🌕 Rằm: còn ${moonIn} ngày` : '🌕 Rằm: đêm nay'].filter(Boolean);
    const baits = Object.entries(BAITS).map(([id, b]) => `<button class="fs-bait ${st.baitSel === id ? 'on' : ''} ${st.bait[id] > 0 ? '' : 'empty'}" data-fs="bait" data-id="${id}" title="${esc(b.desc)}"><span>${itemArt('bait', id) || b.icon}</span><b>${esc(b.name)}</b><small>×${st.bait[id] || 0}</small></button>`).join('');
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
      case 'quick': this.round(); break; // câu tiếp ngay với mồi đang chọn
      case 'cast':
        if (b.classList.contains('disabled')) { const o = fishSys.spotOpen(g.save, this.spot, this.ctx()); this.prep(o.ok ? 'Hết mồi rồi! Vào 🐟 Quầy cá mua thêm nhé.' : ''); return; }
        this.round();
        break;
      default:
    }
  }

  // =============================================================== CẢNH VẼ
  /** Dựng khung cảnh (canvas) cho các pha chơi */
  startScene() {
    if (this.cv) return;
    const g = this.game, e = fishSys.envOf(this.ctx()), sp = FISH_SPOTS[this.spot];
    this.card.className = 'fs-card play';
    this.card.innerHTML = `<canvas class="fs-cv"></canvas>
      <div class="fs-top"><span class="fs-hint"></span><span class="fs-kind"></span></div>
      <div class="fs-bottom"></div>
      <button class="round sm fs-x" data-fs="close" aria-label="Đóng">✕</button>`;
    this.cv = this.card.querySelector('.fs-cv');
    this.hintEl = this.card.querySelector('.fs-hint');
    this.kindEl = this.card.querySelector('.fs-kind');
    this.bottomEl = this.card.querySelector('.fs-bottom');
    this.cx = this.cv.getContext('2d');
    const hour = g.clock.hourFloat;
    const look = lookOf(g.save);
    this.S = {
      t: 0, hour, night: e.night, weather: e.weather, fog: this.spot === 'fogsea' || e.weather === 'fog', moon: e.moon,
      water: WATER[sp.water] || WATER['biển'], pond: this.spot === 'pond', reef: this.spot === 'reef',
      look, bob: null, line: 0, bend: 0, fish: null, splash: [], ripples: [], drops: [], leap: null, gauge: null, snap: 0,
      amb: Array.from({ length: 5 }, (_, i) => ({ x: Math.random(), y: 0.55 + Math.random() * 0.35, s: 0.6 + Math.random() * 0.7, v: (Math.random() < 0.5 ? -1 : 1) * (0.02 + Math.random() * 0.03), ph: i })),
      bubbles: Array.from({ length: 14 }, () => ({ x: Math.random(), y: Math.random(), v: 0.03 + Math.random() * 0.05 })),
      stars: Array.from({ length: 40 }, () => ({ x: Math.random(), y: Math.random() * 0.32, a: Math.random() })),
      clouds: Array.from({ length: 4 }, (_, i) => ({ x: i * 0.3 + Math.random() * 0.1, y: 0.06 + Math.random() * 0.14, s: 0.7 + Math.random() * 0.6 })),
    };
    const fit = () => {
      if (!this.cv) return;
      const r = this.cv.getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1);
      this.cv.width = Math.max(10, r.width * d); this.cv.height = Math.max(10, r.height * d);
      this.W = r.width; this.H = r.height; this.cx.setTransform(d, 0, 0, d, 0, 0);
    };
    fit();
    this.onResize = fit;
    addEventListener('resize', fit);
    let last = performance.now();
    const loop = (now) => {
      if (!this.cv) return;
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      this.S.t += dt;
      this.draw(dt);
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  stopScene() {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
    if (this.onResize) removeEventListener('resize', this.onResize);
    this.cv = null;
  }

  // ---- toạ độ cảnh ----
  get horizon() { return this.H * 0.4; }
  rodTip() { const S = this.S; const bx = this.W * 0.14, by = this.horizon - 28; return { x: bx + 70 - S.bend * 26, y: by - 66 + S.bend * 30 }; }
  waterY(x) { const S = this.S; return this.horizon + Math.sin(x * 0.03 + S.t * 1.6) * 3 + Math.sin(x * 0.011 - S.t * 0.9) * 2; }

  draw(dt) {
    const c = this.cx, S = this.S, W = this.W, H = this.H, hz = this.horizon;
    if (!W) return;
    // ---- trời ----
    const sunset = S.hour >= 16.5 && S.hour < 19, dawn = S.hour >= 5 && S.hour < 7;
    const sky = c.createLinearGradient(0, 0, 0, hz);
    if (S.night) { sky.addColorStop(0, '#1d2350'); sky.addColorStop(1, '#4a4f8a'); }
    else if (sunset || dawn) { sky.addColorStop(0, '#7a8fd6'); sky.addColorStop(1, '#ffc2a0'); }
    else { sky.addColorStop(0, '#8fd0f5'); sky.addColorStop(1, '#e6f6ff'); }
    if (['rain', 'storm'].includes(S.weather)) { sky.addColorStop(0, S.night ? '#20243a' : '#8a98a8'); }
    c.fillStyle = sky; c.fillRect(0, 0, W, hz + 4);
    if (S.night) {
      for (const st of S.stars) { c.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(S.t * 1.5 + st.a * 9)); c.fillStyle = '#fff'; c.fillRect(st.x * W, st.y * H, 2, 2); }
      c.globalAlpha = 1;
      c.fillStyle = S.moon ? '#fff8d6' : '#fff3b0';
      c.beginPath(); c.arc(W * 0.8, H * 0.12, S.moon ? 22 : 16, 0, 7); c.fill();
      if (!S.moon) { c.fillStyle = '#2b3166'; c.beginPath(); c.arc(W * 0.8 + 8, H * 0.12 - 5, 15, 0, 7); c.fill(); }
    } else if (!['rain', 'storm', 'snow', 'fog'].includes(S.weather)) {
      c.fillStyle = sunset || dawn ? '#ffb36e' : '#fff3b0';
      c.beginPath(); c.arc(W * 0.82, sunset ? hz - 16 : H * 0.11, 20, 0, 7); c.fill();
    }
    for (const cl of S.clouds) {
      cl.x += dt * 0.006; if (cl.x > 1.15) cl.x = -0.15;
      c.fillStyle = S.night ? 'rgba(200,205,240,.25)' : 'rgba(255,255,255,.85)';
      const x = cl.x * W, y = cl.y * H, s = cl.s * 22;
      c.beginPath(); c.arc(x, y, s, 0, 7); c.arc(x + s, y + 4, s * 0.8, 0, 7); c.arc(x - s, y + 5, s * 0.7, 0, 7); c.fill();
    }
    // ---- nước ----
    const [w0, w1, w2] = S.water;
    const wg = c.createLinearGradient(0, hz, 0, H);
    wg.addColorStop(0, S.night ? shade(w0, -0.35) : w0); wg.addColorStop(0.45, S.night ? shade(w1, -0.35) : w1); wg.addColorStop(1, S.night ? shade(w2, -0.4) : w2);
    c.fillStyle = wg;
    c.beginPath(); c.moveTo(0, H); for (let x = 0; x <= W; x += 8) c.lineTo(x, this.waterY(x)); c.lineTo(W, H); c.fill();
    // tia sáng dưới nước
    c.save(); c.globalAlpha = S.night ? 0.05 : 0.1; c.fillStyle = '#fff';
    for (let i = 0; i < 4; i++) { const x = ((i * 0.27 + S.t * 0.01) % 1) * W; c.beginPath(); c.moveTo(x, hz); c.lineTo(x + 30, hz); c.lineTo(x - 40, H); c.lineTo(x - 80, H); c.fill(); }
    c.restore();
    // đáy: rong / đá / lá sen
    for (let i = 0; i < 9; i++) {
      const x = W * (0.25 + i * 0.09), sw = Math.sin(S.t * 1.4 + i) * 6;
      c.strokeStyle = S.reef ? '#8a6f9a' : '#3f7f5a'; c.lineWidth = 4; c.lineCap = 'round';
      c.beginPath(); c.moveTo(x, H); c.quadraticCurveTo(x + sw, H - 24, x + sw * 1.5, H - 40 - (i % 3) * 10); c.stroke();
    }
    if (S.reef) { c.fillStyle = '#6f6f7f'; for (let i = 0; i < 4; i++) { c.beginPath(); c.ellipse(W * (0.35 + i * 0.17), H - 4, 34, 18, 0, 0, 7); c.fill(); } }
    // bọt khí
    c.fillStyle = 'rgba(255,255,255,.35)';
    for (const b of S.bubbles) { b.y -= b.v * dt; if (b.y < 0) { b.y = 1; b.x = Math.random(); } const y = hz + 10 + b.y * (H - hz - 10); c.beginPath(); c.arc(b.x * W, y, 2, 0, 7); c.fill(); }
    // cá bơi xung quanh (bóng mờ)
    for (const f of S.amb) {
      f.x += f.v * dt; if (f.x < -0.1) f.x = 1.1; if (f.x > 1.1) f.x = -0.1;
      drawFish(c, f.x * W, hz + (f.y - 0.4) / 0.6 * (H - hz) * 0.9 + Math.sin(S.t + f.ph) * 4, 16 * f.s, f.v > 0 ? 1 : -1, 'rgba(20,40,60,.22)', S.t + f.ph);
    }
    // cá đang cắn câu / đang kéo
    if (S.fish) {
      const F = S.fish;
      drawFish(c, F.x, F.y, F.size, F.dir, F.color, S.t * (F.fight ? 3 : 1.2), F.glow);
    }
    // gợn sóng & bọt nước
    for (const r of S.ripples) { r.t += dt; c.strokeStyle = `rgba(255,255,255,${Math.max(0, 0.7 - r.t)})`; c.lineWidth = 2; c.beginPath(); c.ellipse(r.x, r.y, 6 + r.t * 40, 2 + r.t * 10, 0, 0, 7); c.stroke(); }
    S.ripples = S.ripples.filter((r) => r.t < 0.8);
    for (const p of S.splash) { p.t += dt; p.vy += 420 * dt; p.x += p.vx * dt; p.y += p.vy * dt; c.fillStyle = `rgba(255,255,255,${Math.max(0, 1 - p.t * 1.4)})`; c.beginPath(); c.arc(p.x, p.y, p.r, 0, 7); c.fill(); }
    S.splash = S.splash.filter((p) => p.t < 0.8);
    // ---- bờ / cầu tàu + nhân vật ----
    this.drawShore(c);
    // ---- dây câu + phao ----
    const tip = this.rodTip();
    if (S.bob) {
      const B = S.bob;
      const end = S.fish && S.fish.hooked ? { x: S.fish.x, y: S.fish.y } : { x: B.x, y: B.y };
      const sag = S.fish?.hooked ? 6 + (1 - S.line) * 40 : 30;
      c.strokeStyle = S.line > 0.88 ? '#ff5a5a' : 'rgba(255,255,255,.85)'; c.lineWidth = 1.5;
      c.beginPath(); c.moveTo(tip.x, tip.y); c.quadraticCurveTo((tip.x + end.x) / 2, Math.max(tip.y, end.y) + sag, end.x, end.y); c.stroke();
      if (!(S.fish?.hooked)) {
        c.fillStyle = '#ffffff'; c.beginPath(); c.arc(B.x, B.y - 3, 6, Math.PI, 0); c.fill();
        c.fillStyle = '#e8384f'; c.beginPath(); c.arc(B.x, B.y + 1, 6, 0, Math.PI); c.fill();
        c.fillStyle = '#3b2a22'; c.fillRect(B.x - 1, B.y - 14, 2, 8);
      }
    }
    // ---- sương / mưa / tuyết ----
    if (S.fog) { c.fillStyle = S.night ? 'rgba(200,210,230,.22)' : 'rgba(240,244,246,.35)'; c.fillRect(0, 0, W, H); }
    if (['rain', 'storm', 'snow'].includes(S.weather)) {
      if (S.drops.length < 90) S.drops.push({ x: Math.random() * W, y: -10, v: S.weather === 'snow' ? 40 + Math.random() * 30 : 500 + Math.random() * 200 });
      c.strokeStyle = 'rgba(255,255,255,.55)'; c.fillStyle = '#fff'; c.lineWidth = 1;
      for (const d of S.drops) {
        d.y += d.v * dt; if (d.weather === 'snow') d.x += Math.sin(S.t + d.y * 0.05) * 0.5;
        if (S.weather === 'snow') { c.beginPath(); c.arc(d.x, d.y, 2, 0, 7); c.fill(); } else { c.beginPath(); c.moveTo(d.x, d.y); c.lineTo(d.x - 2, d.y + 10); c.stroke(); }
        if (d.y > hz && S.weather !== 'snow' && Math.random() < 0.15) S.ripples.push({ x: d.x, y: this.waterY(d.x), t: 0.4 });
      }
      S.drops = S.drops.filter((d) => d.y < (S.weather === 'snow' ? H : hz + 6));
    }
    // ---- cá nhảy khỏi mặt nước (kết quả) ----
    if (S.leap) {
      const L = S.leap; L.t += dt;
      const k = Math.min(1, L.t / 1.1);
      const x = lerp(L.x0, L.x1, k), y = lerp(L.y0, L.y1, k) - Math.sin(k * Math.PI) * H * 0.32;
      c.save(); c.translate(x, y); c.rotate((k - 0.5) * 2.4 * L.dir);
      c.font = `${L.size}px serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
      if (L.shiny) { c.shadowColor = '#ffd34e'; c.shadowBlur = 20; }
      if (L.img?.complete && L.img.naturalWidth) { const z = L.size * 1.6; c.drawImage(L.img, -z / 2, -z / 2, z, z); } else c.fillText(L.icon, 0, 0);
      c.restore();
      if (!L.splashed && k > 0.05) { L.splashed = true; this.burst(L.x0, this.waterY(L.x0), 16); }
    }
    // ---- đồng hồ lực căng dây ----
    if (S.gauge) this.drawGauge(c, S.gauge);
  }

  drawShore(c) {
    const S = this.S, hz = this.horizon, W = this.W;
    // cầu tàu gỗ
    c.fillStyle = '#a8845f';
    c.fillRect(0, hz - 10, W * 0.24, 12);
    c.fillStyle = '#8a6a4a';
    for (let i = 0; i < 4; i++) c.fillRect(W * 0.03 + i * W * 0.06, hz, 6, 40);
    if (S.pond) { c.fillStyle = '#7cc27f'; for (let i = 0; i < 3; i++) { c.beginPath(); c.ellipse(W * (0.55 + i * 0.13), hz + 6 + i * 2, 18, 5, 0, 0.3, 6.1); c.fill(); } c.fillStyle = '#ff9fbe'; c.beginPath(); c.arc(W * 0.68, hz + 2, 5, 0, 7); c.fill(); }
    // nhân vật chibi (theo trang phục đang mặc)
    const L = S.look, x = W * 0.14, y = hz - 10;
    const lean = S.bend * 4;
    c.save(); c.translate(x, y);
    c.fillStyle = 'rgba(0,0,0,.12)'; c.beginPath(); c.ellipse(0, 2, 18, 4, 0, 0, 7); c.fill();
    c.fillStyle = L.outfit || '#8fc9e8'; roundRect(c, -13, -34, 26, 30, 10); c.fill();
    if (L.top === 'dress') { c.beginPath(); c.moveTo(-16, -6); c.lineTo(16, -6); c.lineTo(10, -22); c.lineTo(-10, -22); c.fill(); }
    c.fillStyle = L.skin || '#ffe0c7'; c.beginPath(); c.arc(lean, -52, 18, 0, 7); c.fill();
    c.fillStyle = L.hair || '#6b4433'; c.beginPath(); c.arc(lean, -56, 18, Math.PI * 1.05, Math.PI * 1.95); c.fill();
    if (L.hat) { c.fillStyle = L.hat; c.beginPath(); c.ellipse(lean, -64, 26, 5, 0, 0, 7); c.fill(); c.beginPath(); c.arc(lean, -66, 12, Math.PI, 0); c.fill(); }
    c.fillStyle = '#3b2a22'; c.beginPath(); c.arc(lean + 7, -51, 2.2, 0, 7); c.fill();
    c.fillStyle = '#ffab9c'; c.beginPath(); c.arc(lean + 10, -45, 3, 0, 7); c.fill();
    c.restore();
    // cần câu
    const tip = this.rodTip();
    c.strokeStyle = '#7a5238'; c.lineWidth = 3.5; c.lineCap = 'round';
    c.beginPath(); c.moveTo(x + 6, y - 28); c.quadraticCurveTo(x + 40, y - 60 + S.bend * 10, tip.x, tip.y); c.stroke();
  }

  drawGauge(c, G) {
    // vòng cung dưới góc phải: vùng xanh = cá chịu được, kim = lực căng dây
    const W = this.W, H = this.H, r = Math.min(70, H * 0.2), cx = W - r - 18, cy = H - 14;
    const ang = (p) => Math.PI + (p / 100) * Math.PI;
    c.lineCap = 'butt';
    c.lineWidth = 14; c.strokeStyle = 'rgba(255,255,255,.85)'; c.beginPath(); c.arc(cx, cy, r, Math.PI, 0); c.stroke();
    c.strokeStyle = '#ff9a8c'; c.beginPath(); c.arc(cx, cy, r, ang(88), 0); c.stroke();
    c.strokeStyle = G.inZone ? '#5fcf7a' : '#9be29b'; c.beginPath(); c.arc(cx, cy, r, ang(clamp(G.zc - G.zw / 2, 0, 100)), ang(clamp(G.zc + G.zw / 2, 0, 100))); c.stroke();
    const a = ang(G.tension);
    c.strokeStyle = G.tension > 90 ? '#e8384f' : '#3b2a22'; c.lineWidth = 4; c.lineCap = 'round';
    c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.cos(a) * (r + 4), cy + Math.sin(a) * (r + 4)); c.stroke();
    c.fillStyle = '#3b2a22'; c.beginPath(); c.arc(cx, cy, 6, 0, 7); c.fill();
    // thanh "cá đã lại gần bờ"
    const bw = Math.min(260, W * 0.42), bx = W / 2 - bw / 2, by = 46;
    c.fillStyle = 'rgba(255,255,255,.85)'; roundRect(c, bx, by, bw, 12, 6); c.fill();
    c.fillStyle = '#6fb7e0'; roundRect(c, bx, by, bw * G.progress / 100, 12, 6); c.fill();
    c.font = '700 12px system-ui, sans-serif'; c.textAlign = 'center'; c.fillStyle = '#21507a';
    c.fillText('🐟 cá vào bờ', W / 2, by + 26);
  }

  burst(x, y, n = 10) {
    for (let i = 0; i < n; i++) this.S.splash.push({ x, y, vx: (Math.random() - 0.5) * 160, vy: -120 - Math.random() * 160, r: 1.5 + Math.random() * 2.5, t: 0 });
    this.S.ripples.push({ x, y, t: 0 });
  }

  setHint(t, kind = '') { if (this.hintEl) this.hintEl.innerHTML = t; if (this.kindEl) this.kindEl.innerHTML = kind; }

  // =============================================================== 1 LƯỢT CÂU
  async round() {
    if (this.busy) return;
    this.busy = true; this.stop = false;
    try {
      this.stopScene();
      this.startScene();
      const far = await this.power();
      if (this.stop) return;
      const c = this.game.fishCast(this.spot, far);
      if (!c.ok) { this.prep(c.msg); return; }
      await this.throwBob(far);
      if (this.stop) return;
      const cfg = fishSys.reelConfig(this.game.save, c);
      const hooked = await this.wait(cfg, c);
      if (this.stop) return;
      let landed = false;
      if (hooked) landed = c.kind === 'junk' || c.kind === 'chest' || c.kind === 'bottle' ? true : await this.reel(c, cfg);
      if (this.stop) return;
      const res = this.game.fishLand(c, landed, hooked ? '' : 'early');
      await this.result(c, res, hooked);
    } finally { this.busy = false; }
  }

  /** Pha 1 — canh lực: kim chạy qua lại trên vòng cung, chạm khi vào vạch vàng = quăng xa */
  power() {
    this.phase = 'power';
    this.setHint('Chạm để quăng cần! Kim vào <b>vạch vàng</b> là quăng xa, dễ gặp cá to.');
    this.bottomEl.innerHTML = '<div class="fs-power"><i class="fs-gold"></i><i class="fs-needle"></i></div>';
    const needle = this.bottomEl.querySelector('.fs-needle');
    return new Promise((res) => {
      const t0 = performance.now(); let v = 0, done = false;
      const tick = () => {
        if (done || this.stop) { if (this.stop) res(false); return; }
        const t = (performance.now() - t0) / 1000;
        v = (Math.sin(t * 3.4 - Math.PI / 2) + 1) / 2;
        needle.style.left = `${v * 100}%`;
        this.S.bend = -0.6 * v; // ngả cần ra sau lấy đà
        window.__fishing = { phase: 'power', v };
        requestAnimationFrame(tick);
      };
      this.tap = () => { done = true; this.tap = null; this.v = v; res(v >= 0.78 && v <= 0.95); };
      requestAnimationFrame(tick);
    });
  }

  /** Phao bay theo đường vòng cung ra mặt nước */
  throwBob(far) {
    this.bottomEl.innerHTML = '';
    this.setHint(far ? '✨ Quăng xa tuyệt đẹp!' : 'Vút~');
    const S = this.S, tip = this.rodTip();
    const tx = this.W * (far ? 0.78 : lerp(0.45, 0.7, clamp(this.v || 0.5, 0, 1)));
    this.game.audio?.sfx?.tap?.(1.2);
    return new Promise((res) => {
      const t0 = performance.now();
      const tick = () => {
        if (this.stop || !this.cv) { res(); return; }
        const k = Math.min(1, (performance.now() - t0) / 650);
        S.bend = lerp(0.4, 0, k);
        S.bob = { x: lerp(tip.x, tx, k), y: lerp(tip.y, this.waterY(tx), k) - Math.sin(k * Math.PI) * this.H * 0.22 };
        if (k >= 1) { this.burst(tx, this.waterY(tx), 8); S.bob.baseX = tx; res(); return; }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }

  /** Pha 2 — chờ cắn câu: cá bơi tới, nhử phao, phao chìm hẳn + ❗ thì chạm. Chạm sớm = cá chạy. */
  wait(cfg, c) {
    this.phase = 'wait';
    window.__fishing = { phase: 'wait', bite: false };
    this.setHint('Kiên nhẫn… đợi phao <b>chìm hẳn</b> và hiện <b>❗</b> rồi chạm thật nhanh!');
    const S = this.S, B = S.bob, bx = B.baseX;
    const tier = c.tier ?? 0, H = this.H, hz = this.horizon;
    const size = c.kind === 'fish' ? 14 + tier * 5 : 14;
    const dir = Math.random() < 0.5 ? 1 : -1;
    S.fish = { x: bx - dir * this.W * 0.35, y: hz + (H - hz) * 0.6, size, dir, color: c.kind === 'mong' ? 'rgba(255,255,255,.75)' : 'rgba(20,40,60,.38)', glow: c.kind === 'mong' || this.spot === 'fogsea' };
    return new Promise((res) => {
      const wait = (cfg.waitMin + Math.random() * (cfg.waitMax - cfg.waitMin)) * 1000;
      const fakeAt = Math.random() < 0.5 ? wait * (0.35 + Math.random() * 0.3) : -1;
      const t0 = performance.now(); let bite = 0, done = false, nibbled = false;
      const end = (ok) => { if (done) return; done = true; this.tap = null; res(ok); };
      const tick = () => {
        if (done) return;
        if (this.stop || !this.cv) { end(false); return; }
        const t = performance.now() - t0, k = Math.min(1, t / wait);
        // cá bơi lại gần mồi
        const F = S.fish;
        F.x = lerp(F.x, bx - dir * 14, 0.02 + k * 0.03);
        F.y = lerp(F.y, hz + 26, 0.015 + k * 0.03);
        let dip = Math.sin(S.t * 3) * 2;
        if (!bite && fakeAt > 0 && t > fakeAt && t < fakeAt + 350) { dip = 6; if (!nibbled) { nibbled = true; S.ripples.push({ x: bx, y: this.waterY(bx), t: 0.2 }); } }
        if (!bite && t >= wait) { bite = performance.now(); this.burst(bx, this.waterY(bx), 12); this.game.audio?.sfx?.chime?.(1); buzz(60); this.setHint('<b class="fs-bang">❗ CẮN CÂU — CHẠM NGAY!</b>'); }
        if (bite) dip = 18;
        B.x = bx; B.y = this.waterY(bx) + dip;
        if (bite && performance.now() - bite > cfg.biteWindow * 1000) { end(false); return; }
        window.__fishing = { phase: 'wait', bite: !!bite };
        requestAnimationFrame(tick);
      };
      // 0,4 giây đầu bỏ qua chạm (lỡ chạm đúp lúc quăng cần thì không bị tính là giật sớm)
      this.tap = () => { if (!bite && performance.now() - t0 < 400) return; end(!!bite); };
      requestAnimationFrame(tick);
    });
  }

  /** Pha 3 — kéo cá: GIỮ để căng dây, THẢ cho chùng; kim trong vùng xanh thì cá lại gần bờ */
  reel(c, cfg) {
    this.phase = 'reel';
    window.__fishing = { phase: 'reel', tension: 30, zc: 50, zw: cfg.zone, progress: cfg.start };
    const mystery = c.kind === 'mong' ? 'Một cái bóng trắng khổng lồ…' : `Cá ${FISH_RULES.tierNames[c.tier].toLowerCase()} · ${MOVE_NAME[cfg.move]}`;
    this.setHint('<b>GIỮ</b> để kéo căng dây · <b>THẢ</b> cho chùng — giữ kim trong <b>vùng xanh</b>!', `<span style="color:${FISH_RULES.tierColors[c.tier ?? 0]}">${esc(mystery)}</span>`);
    this.bottomEl.innerHTML = '<div class="fs-reelbtn">🎣 GIỮ ĐỂ KÉO</div>';
    const btn = this.bottomEl.querySelector('.fs-reelbtn');
    const S = this.S, hz = this.horizon, H = this.H, W = this.W;
    const F = S.fish;
    F.hooked = true; F.fight = true;
    this.hold = false;
    return new Promise((res) => {
      let tension = 30, zc = 50, target = 50, nextMove = 0, progress = cfg.start, over = 0, last = performance.now(), t = 0, done = false;
      const end = (ok) => { if (done) return; done = true; S.gauge = null; res(ok); };
      const tick = (now) => {
        if (done) return;
        if (this.stop || !this.cv) { end(false); return; }
        const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt;
        if (cfg.move === 'calm') target = 50 + Math.sin(t * 0.8) * 9;
        else if (cfg.move === 'dash') target = 64 + Math.sin(t * 1.7) * 17;
        else if (cfg.move === 'dive') target = 36 + Math.sin(t * 1.3) * 16;
        else if (t >= nextMove) { target = 22 + Math.random() * 56; nextMove = t + (cfg.move === 'fury' ? 0.55 + Math.random() * 0.5 : 1.2 + Math.random() * 0.9); }
        zc += (target - zc) * Math.min(1, dt * (cfg.move === 'fury' ? 5 : 3.2));
        tension = Math.max(0, Math.min(100, tension + (this.hold ? cfg.up : -cfg.down) * dt));
        const inZone = Math.abs(tension - zc) <= cfg.zone / 2;
        progress = Math.max(0, Math.min(100, progress + (inZone ? cfg.gain : -cfg.drain) * dt));
        over = tension >= 99.5 ? over + dt : 0;
        // hình ảnh: cá lại gần bờ theo tiến độ, vùng vẫy ngang theo vùng xanh, cần cong theo lực căng
        const fx = lerp(W * 0.86, W * 0.3, progress / 100) + (zc - 50) * W * 0.004;
        const fy = lerp(H - 26, hz + 24, progress / 100) + Math.sin(t * (cfg.move === 'fury' ? 9 : 4)) * 6;
        F.dir = fx < F.x ? -1 : 1;
        F.x = lerp(F.x, fx, 0.15); F.y = lerp(F.y, fy, 0.15);
        S.line = tension / 100; S.bend = 0.2 + tension / 100 * 0.8;
        if (Math.random() < dt * 3) S.ripples.push({ x: F.x, y: this.waterY(F.x), t: 0.3 });
        S.gauge = { tension, zc, zw: cfg.zone, progress, inZone };
        btn.classList.toggle('on', !!this.hold);
        btn.classList.toggle('danger', tension > 90);
        if (tension > 92 && Math.random() < dt * 8) buzz(15);
        window.__fishing = { phase: 'reel', tension, zc, zw: cfg.zone, progress };
        if (over > cfg.snapAfter) { this.snapped = true; S.bob = null; S.fish.hooked = false; S.fish.fight = false; this.setHint('<b class="fs-bang">💥 ĐỨT DÂY!</b>'); buzz(200); setTimeout(() => end(false), 600); return; }
        if (progress >= 100) { end(true); return; }
        if (progress <= 0 || t > cfg.timeLimit) { end(false); return; }
        requestAnimationFrame(tick);
      };
      this.snapped = false;
      requestAnimationFrame(tick);
    });
  }

  /** Pha 4 — kết quả: cá nhảy khỏi mặt nước vào tay, rồi hiện thẻ */
  async result(c, res, hooked) {
    this.phase = 'result'; this.tap = null;
    window.__fishing = { phase: 'result', kind: res.kind };
    const S = this.S;
    if (S && this.cv) {
      this.bottomEl.innerHTML = '';
      if (res.kind !== 'miss') {
        const icon = res.kind === 'fish' ? res.fish.icon : res.kind === 'junk' ? res.junk.icon : res.kind === 'chest' ? '🧰' : res.kind === 'bottle' ? '🍾' : '🐋';
        const x0 = S.fish?.x ?? this.W * 0.5;
        S.fish = null; S.bob = null; S.line = 0; S.bend = 0.3;
        S.leap = { icon, img: artImage(res.kind === 'fish' ? fishArt(res.fish.id, { shiny: res.shiny }) : res.kind === 'junk' ? itemArt('junk', res.junk.name) : res.kind === 'chest' ? itemArt('chest') : res.kind === 'mong' ? fishArt('mong') : null), x0, y0: this.waterY(x0), x1: this.W * 0.2, y1: this.horizon - 70, t: 0, dir: x0 > this.W * 0.2 ? -1 : 1, size: res.kind === 'fish' ? 34 + res.fish.t * 6 : 36, shiny: !!res.shiny };
        this.setHint(res.kind === 'fish' ? '🎉 Lên rồi!' : '');
        buzz(40);
        if (res.kind !== 'miss') this.game.audio?.sfx?.chime?.(res.kind === 'fish' ? 2 + res.fish.t : 3);
        await sleep(1150);
      } else {
        if (S.fish) { S.fish.hooked = false; S.fish.fight = false; S.fish.dir = 1; }
        S.bob = null;
        this.setHint(this.snapped ? '💥 Đứt dây rồi…' : '💨 Cá chạy mất…');
        const F = S.fish; const t0 = performance.now();
        while (F && performance.now() - t0 < 700 && this.cv) { F.x += 6; F.y += 2; await sleep(16); }
      }
    }
    if (!this.el) return;
    let html;
    if (res.kind === 'miss') {
      html = `<div class="fs-res miss"><span class="fs-big">💨</span><b>${!hooked ? 'Cá chạy mất rồi!' : this.snapped ? 'Đứt dây!' : 'Cá sổng mất!'}</b><small>${!hooked ? 'Chạm đúng lúc phao chìm hẳn và hiện ❗ nhé.' : this.snapped ? 'Đừng giữ căng kịch quá lâu. Thả tay cho dây chùng bớt.' : 'Giữ kim trong vùng xanh lâu hơn để cá vào bờ.'}</small></div>`;
    } else if (res.kind === 'junk') html = `<div class="fs-res"><span class="fs-big">${itemArt('junk', res.junk.name) || res.junk.icon}</span><b>${esc(res.junk.name)}</b><small>Không phải cá… bán ve chai được ${res.coins} 💰.</small></div>`;
    else if (res.kind === 'chest') html = `<div class="fs-res good"><span class="fs-big">${itemArt('chest')}</span><b>Rương báu!</b><small>+${res.coins} 💰${res.luck ? ' · +1 🎟️ vé may mắn' : ''}${res.bait ? ` · +${res.bait.n} 🌸 mồi hoa` : ''}</small></div>`;
    else if (res.kind === 'bottle') html = '<div class="fs-res good"><span class="fs-big">🍾</span><b>Một chiếc chai đóng rêu</b><small>Bên trong có một mảnh giấy cuộn tròn…</small></div>';
    else if (res.kind === 'mong') html = '<div class="fs-res good"><span class="fs-big">' + fishArt('mong') + '</span><b>Cá Mộng</b><small>Trắng như trăng. Nó không vùng vẫy nữa, chỉ nhìn bạn.</small></div>';
    else {
      const f = res.fish, tc = FISH_RULES.tierColors[f.t];
      html = `<div class="fs-res good" style="--tc:${tc}"><span class="fs-big ${res.shiny ? 'shiny' : ''}">${fishArt(f.id, { shiny: res.shiny })}</span>
        <b>${res.shiny ? '✨ ' : ''}${esc(f.name)}${res.shiny ? ' ánh kim' : ''} <i class="stars">${'★'.repeat(res.q)}</i></b>
        <small><span class="fs-tier">${FISH_RULES.tierNames[f.t]}</span> · dài ${res.cm} cm · bán ~${fishSys.priceOf(res.key)} 💰</small>
        ${res.isNew ? '<small class="fs-new">📖 Loài mới vào Sổ cá!</small>' : res.record ? '<small class="fs-new">🏆 Con to nhất từ trước tới giờ!</small>' : ''}
        ${res.pearl ? `<small class="fs-new">⚪ ${itemArt('pearl')} Tách sò ra một viên ngọc trai: +${res.pearl.coins} 💰</small>` : ''}
        ${res.spotComplete ? '<small class="fs-new">🎉 Đã sưu tầm đủ cá ở chỗ câu này! Nhận thưởng rồi nhé.</small>' : ''}</div>`;
    }
    const st = fishSys.F(this.game.save);
    const more = st.bait[st.baitSel] > 0;
    // thẻ kết quả nổi trên cảnh (cảnh vẫn chạy phía sau)
    const box = document.createElement('div');
    box.className = 'fs-overlay';
    box.innerHTML = `${html}<div class="row-btns">${more ? `<button class="btn primary" data-fs="quick">🎣 Câu tiếp (${BAITS[st.baitSel].icon} ×${st.bait[st.baitSel]})</button>` : ''}<button class="btn ${more ? '' : 'primary'}" data-fs="again">🪱 Đổi mồi</button><button class="btn" data-fs="close">Thôi</button></div>`;
    (this.cv ? this.card : this.card).appendChild(box);
    if (this.S) this.S.leap = null;
    if (res.kind === 'bottle' || res.kind === 'mong') { await sleep(1400); this.close(); }
  }
}

// ---------------- vẽ phụ ----------------
function roundRect(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
function drawFish(c, x, y, s, dir, color, t, glow = false) {
  c.save(); c.translate(x, y); c.scale(dir, 1);
  if (glow) { c.shadowColor = '#bff4ff'; c.shadowBlur = 16; }
  c.fillStyle = color;
  c.beginPath(); c.ellipse(0, 0, s, s * 0.45, 0, 0, 7); c.fill();
  const w = Math.sin(t * 6) * s * 0.25;
  c.beginPath(); c.moveTo(-s * 0.85, 0); c.lineTo(-s * 1.45, -s * 0.4 + w); c.lineTo(-s * 1.45, s * 0.4 + w); c.closePath(); c.fill();
  c.restore();
}
function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16);
  const f = (v) => Math.round(clamp(v + v * k, 0, 255));
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
}
