// 🎯 4 mini game quầy trò chơi Khu Vui Chơi (GĐ26): ném vòng, bắn bóng nước, câu vịt, đập chuột chũi.
// Cùng kiểu "engine" với src/ui/minigames.js: (area, cfg, api) → hàm dọn dẹp. Số liệu ở data/fun.js (FUN_GAMES, FUN_LEVELS).
const rnd = (a, b) => a + Math.random() * (b - a);
const starsBy = (n, need) => (n >= need[2] ? 3 : n >= need[1] ? 2 : n >= need[0] ? 1 : 0);

function loop(fn) {
  let raf = 0, last = performance.now(), on = true;
  const f = (t) => { if (!on) return; const dt = Math.min(0.25, (t - last) / 1000); last = t; fn(dt, t); raf = requestAnimationFrame(f); };
  raf = requestAnimationFrame(f);
  return () => { on = false; cancelAnimationFrame(raf); };
}
const frame = (area, cls, inner) => { area.innerHTML = `<div class="fgm ${cls}">${inner}<div class="hg-time"><i></i></div><div class="mg-pop"></div></div>`; return area.firstElementChild; };

/** Khung đếm giờ chung: trả về { tick(dt) → còn chơi?, status() } */
function timer(box, cfg, api, label) {
  let left = cfg.seconds;
  const bar = box.querySelector('.hg-time i');
  return {
    get left() { return left; },
    tick(dt) { left -= dt; bar.style.width = `${Math.max(0, (left / cfg.seconds) * 100)}%`; return left > 0; },
    status(score) { api.status(`${label} ${score} · cần ${cfg.need.join('/')} · ${Math.max(0, Math.ceil(left))} giây`); },
  };
}

export const FUN_ENGINES = {
  /** ⭕ Ném vòng: chai chạy qua lại, chạm khi chai nằm dưới vạch */
  ringtoss(area, cfg, api) {
    const box = frame(area, 'fg-ring', '<div class="fg-lane"><span class="fg-mark"></span><span class="fg-bottle">🍾</span></div><div class="fg-ring-hand">⭕</div>');
    const lane = box.querySelector('.fg-lane'), bottle = box.querySelector('.fg-bottle'), hand = box.querySelector('.fg-ring-hand');
    const T = timer(box, cfg, api, '⭕');
    let score = 0, phase = rnd(0, 6), speed = cfg.speed, x = 0, gold = false, busy = false, over = false;
    const newBottle = () => { gold = Math.random() < 0.22; bottle.textContent = gold ? '🏆' : '🍾'; bottle.classList.toggle('gold', gold); };
    newBottle();
    T.status(score);
    const tap = (e) => {
      if (busy || over) return;
      busy = true;
      hand.classList.add('throw');
      const hit = Math.abs(x) < 26;
      setTimeout(() => {
        hand.classList.remove('throw');
        if (hit) { score += gold ? 2 : 1; api.good(e); bottle.classList.add('got'); speed *= 1.06; }
        else api.bad('Trượt rồi!');
        T.status(score);
        setTimeout(() => { bottle.classList.remove('got'); newBottle(); busy = false; }, 280);
      }, 260);
    };
    box.addEventListener('pointerdown', tap);
    const stop = loop((dt) => {
      if (over) return;
      phase += dt * speed;
      x = Math.sin(phase) * Math.min(lane.clientWidth * 0.42, 220);
      bottle.style.transform = `translateX(${x}px)`;
      if (!T.tick(dt)) { over = true; api.end(starsBy(score, cfg.need)); }
      else if (Math.random() < dt * 2) T.status(score);
    });
    return () => { stop(); box.removeEventListener('pointerdown', tap); };
  },

  /** 🎈 Bắn bóng nước: chạm bóng bay trước khi bay mất, tránh bom nước */
  watergun(area, cfg, api) {
    const box = frame(area, 'fg-balloon', '<div class="fg-sky"></div>');
    const sky = box.querySelector('.fg-sky');
    const T = timer(box, cfg, api, '🎈');
    let score = 0, spawn = 0, over = false;
    const items = new Set();
    const cols = ['#ff8fb1', '#8fd8ff', '#ffd36e', '#b9a2ff', '#9be29b'];
    T.status(score);
    const add = () => {
      const bomb = Math.random() < 0.18;
      const el = document.createElement('button');
      el.className = `fg-bl ${bomb ? 'bomb' : ''}`;
      el.textContent = bomb ? '💣' : '🎈';
      if (!bomb) el.style.filter = `drop-shadow(0 0 0 ${cols[Math.floor(Math.random() * 5)]})`;
      el.style.left = `${rnd(6, 86)}%`;
      const it = { el, bomb, t: 0, life: cfg.life * rnd(0.85, 1.2) };
      el.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        if (over || it.dead) return;
        it.dead = true; items.delete(it); el.classList.add('pop'); setTimeout(() => el.remove(), 200);
        if (bomb) { score = Math.max(0, score - 2); api.bad('💦 Trúng bom nước! −2'); } else { score++; api.good(e); }
        T.status(score);
      });
      sky.appendChild(el); items.add(it);
    };
    const stop = loop((dt) => {
      if (over) return;
      spawn -= dt;
      if (spawn <= 0) { add(); spawn = rnd(0.35, 0.65); }
      for (const it of [...items]) {
        it.t += dt;
        const k = it.t / it.life;
        it.el.style.bottom = `${-12 + k * 112}%`;
        if (k >= 1) { items.delete(it); it.el.remove(); }
      }
      if (!T.tick(dt)) { over = true; api.end(starsBy(score, cfg.need)); }
      else if (Math.random() < dt * 2) T.status(score);
    });
    return () => { stop(); items.clear(); };
  },

  /** 🦆 Câu vịt: vịt trôi qua 2 làn, chạm để câu (vịt vàng 3 điểm, vịt đen trừ) */
  ducks(area, cfg, api) {
    const box = frame(area, 'fg-pond', '<div class="fg-water"><div class="fg-row r0"></div><div class="fg-row r1"></div></div>');
    const rows = [...box.querySelectorAll('.fg-row')];
    const T = timer(box, cfg, api, '🦆');
    let score = 0, spawn = 0, over = false;
    const ducks = new Set();
    T.status(score);
    const add = () => {
      const lane = Math.random() < 0.5 ? 0 : 1, r = Math.random();
      const kind = r < 0.15 ? 'gold' : r < 0.32 ? 'black' : 'norm';
      const el = document.createElement('button');
      el.className = `fg-duck ${kind}`;
      el.textContent = kind === 'black' ? '🐦‍⬛' : '🦆';
      if (kind === 'gold') el.innerHTML = '🦆<i>✨</i>';
      const w = rows[lane].clientWidth || 300;
      const d = { el, kind, lane, x: lane ? w + 40 : -40, dir: lane ? -1 : 1, w };
      el.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        if (over || d.dead) return;
        d.dead = true; ducks.delete(d); el.classList.add('caught'); setTimeout(() => el.remove(), 260);
        if (kind === 'black') { score = Math.max(0, score - 1); api.bad('🐦‍⬛ Vịt đen! −1'); } else { score += kind === 'gold' ? 3 : 1; api.good(e); }
        T.status(score);
      });
      rows[lane].appendChild(el); ducks.add(d);
    };
    const stop = loop((dt) => {
      if (over) return;
      spawn -= dt;
      if (spawn <= 0) { add(); spawn = rnd(0.55, 1.0); }
      for (const d of [...ducks]) {
        d.x += d.dir * cfg.speed * dt * 1.6;
        d.el.style.transform = `translateX(${d.x}px) scaleX(${d.dir < 0 ? -1 : 1})`;
        if (d.x < -60 || d.x > d.w + 60) { ducks.delete(d); d.el.remove(); }
      }
      if (!T.tick(dt)) { over = true; api.end(starsBy(score, cfg.need)); }
      else if (Math.random() < dt * 2) T.status(score);
    });
    return () => { stop(); ducks.clear(); };
  },

  /** 🔨 Đập chuột chũi: 3×3 lỗ, chuột thò lên — đừng đập thỏ */
  whack(area, cfg, api) {
    const box = frame(area, 'fg-whack', `<div class="fg-holes">${Array.from({ length: 9 }, (_, i) => `<button class="fg-hole" data-i="${i}"><span></span></button>`).join('')}</div>`);
    const holes = [...box.querySelectorAll('.fg-hole')].map((el) => ({ el, sp: el.querySelector('span'), kind: null, t: 0 }));
    const T = timer(box, cfg, api, '🐹');
    let score = 0, spawn = 0, over = false;
    T.status(score);
    const set = (h, kind) => { h.kind = kind; h.t = kind ? cfg.life * rnd(0.8, 1.25) : 0; h.sp.textContent = kind === 'mole' ? '🐹' : kind === 'bunny' ? '🐰' : ''; h.el.classList.toggle('up', !!kind); };
    const tap = (e) => {
      const el = e.target.closest('.fg-hole'); if (!el || over) return;
      const h = holes[+el.dataset.i];
      if (!h.kind) return;
      el.classList.add('bonk'); setTimeout(() => el.classList.remove('bonk'), 160);
      if (h.kind === 'mole') { score++; api.good(e); } else { score = Math.max(0, score - 2); api.bad('🐰 Đập nhầm thỏ! −2'); }
      set(h, null);
      T.status(score);
    };
    box.addEventListener('pointerdown', tap);
    const stop = loop((dt) => {
      if (over) return;
      spawn -= dt;
      if (spawn <= 0) {
        const free = holes.filter((h) => !h.kind);
        if (free.length) set(free[Math.floor(Math.random() * free.length)], Math.random() < 0.2 ? 'bunny' : 'mole');
        spawn = rnd(0.3, 0.6);
      }
      for (const h of holes) if (h.kind) { h.t -= dt; if (h.t <= 0) set(h, null); }
      if (!T.tick(dt)) { over = true; api.end(starsBy(score, cfg.need)); }
      else if (Math.random() < dt * 2) T.status(score);
    });
    return () => { stop(); box.removeEventListener('pointerdown', tap); };
  },
};
