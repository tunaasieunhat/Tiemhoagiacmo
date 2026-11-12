// 🌸 14 mini game của Đảo Ngàn Hương (GĐ23): 8 game hái nguyên liệu + 6 game chế biến.
// Mỗi game là một "engine" (area, cfg, api) như trong src/ui/minigames.js: api.status(chữ), api.good(ev), api.bad(chữ), api.end(0..3 sao).
// Số liệu ở data/huong.js (HG_GAMES, HG_LEVELS).
import { SCENTS, BLEND_DROPS, INGREDIENTS } from '../../data/huong.js';

const rnd = (a, b) => a + Math.random() * (b - a);
const ri = (a, b) => Math.floor(rnd(a, b + 1));
const shuffle = (arr) => { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };
const starsBy = (n, need) => (n >= need[2] ? 3 : n >= need[1] ? 2 : n >= need[0] ? 1 : 0);

function loop(fn) {
  let raf = 0, last = performance.now(), on = true;
  const f = (t) => { if (!on) return; const dt = Math.min(0.25, (t - last) / 1000); /* đếm theo thời gian thật: máy chậm vẫn đúng giờ */ last = t; fn(dt, t); raf = requestAnimationFrame(f); };
  raf = requestAnimationFrame(f);
  return () => { on = false; cancelAnimationFrame(raf); };
}
const frame = (area, cls, inner) => { area.innerHTML = `<div class="hgm ${cls}">${inner}<div class="mg-pop"></div></div>`; return area.firstElementChild; };
const meterHtml = (zone) => `<div class="hg-meter"><i class="z" style="left:${zone[0]}%;width:${zone[1] - zone[0]}%"></i><b class="n"></b></div>`;
// ván game thời gian: thanh thời gian chạy dưới đáy
const timeBar = '<div class="hg-time"><i></i></div>';

export const HG_ENGINES = {
  /** 🍃 Hái búp trà: búp non 🌱 mọc lên giữa lá già 🍂, chỉ hái búp non */
  picktea(area, cfg, api) {
    const box = frame(area, 'hg-tea', `<div class="hg-grid">${Array.from({ length: 12 }, (_, i) => `<button class="cell" data-i="${i}"></button>`).join('')}</div>${timeBar}`);
    const cells = [...box.querySelectorAll('.cell')].map((el) => ({ el, kind: null, t: 0 }));
    let left = cfg.seconds, got = 0, over = false, spawn = 0;
    const status = () => api.status(`🌱 ${got} búp · cần ${cfg.need.join('/')} · ${Math.ceil(left)} giây`);
    status();
    const set = (c, kind) => { c.kind = kind; c.t = kind ? rnd(1.3, 1.9) : 0; c.el.className = `cell ${kind || ''}`; c.el.textContent = kind === 'bud' ? '🌱' : kind === 'old' ? '🍂' : ''; };
    const tap = (e) => {
      const el = e.target.closest('.cell'); if (!el || over) return;
      const c = cells[+el.dataset.i];
      if (c.kind === 'bud') { got++; api.good(e); set(c, null); }
      else if (c.kind === 'old') { got = Math.max(0, got - 1); api.bad('🍂 Lá già rồi! −1'); set(c, null); }
      status();
    };
    box.addEventListener('pointerdown', tap);
    const bar = box.querySelector('.hg-time i');
    const stop = loop((dt) => {
      if (over) return;
      left -= dt; spawn -= dt;
      bar.style.width = `${Math.max(0, left / cfg.seconds) * 100}%`;
      for (const c of cells) if (c.kind) { c.t -= dt; if (c.t <= 0) set(c, null); }
      if (spawn <= 0) { const free = cells.filter((c) => !c.kind); if (free.length) set(free[ri(0, free.length - 1)], Math.random() < 0.62 ? 'bud' : 'old'); spawn = rnd(0.22, 0.5); }
      if (left <= 0) { over = true; api.end(starsBy(got, cfg.need)); }
      else if (Math.floor(left * 4) !== Math.floor((left + dt) * 4)) status();
    });
    return () => { stop(); box.removeEventListener('pointerdown', tap); };
  },

  /** 🤍 Hái hoa sương sớm: hoa nhài đọng sương hiện rồi khô dần, ong 🐝 bay lẫn vào */
  dew(area, cfg, api) {
    const box = frame(area, 'hg-dew', '<div class="hg-sun">☀️</div><div class="hg-field"></div>');
    const field = box.querySelector('.hg-field'), sun = box.querySelector('.hg-sun');
    let left = cfg.seconds, got = 0, over = false, spawn = 0.1, seq = 0;
    const live = new Map();
    const status = () => api.status(`🤍 ${got} bông · cần ${cfg.need.join('/')} · ${Math.ceil(left)} giây`);
    status();
    const tap = (e) => {
      const el = e.target.closest('.fl'); if (!el || over) return;
      const f = live.get(el.dataset.id); if (!f) return;
      live.delete(el.dataset.id); el.classList.add(f.bee ? 'stung' : 'got'); setTimeout(() => el.remove(), 300);
      if (f.bee) { got = Math.max(0, got - 1); api.bad('🐝 Ong đốt! −1'); } else { got++; api.good(e); }
      status();
    };
    field.addEventListener('pointerdown', tap);
    const stop = loop((dt) => {
      if (over) return;
      left -= dt; spawn -= dt;
      sun.style.left = `${(1 - left / cfg.seconds) * 88}%`;
      box.style.setProperty('--sun', `${1 - left / cfg.seconds}`);
      if (spawn <= 0) {
        const bee = Math.random() < 0.16, el = document.createElement('button');
        el.className = `fl ${bee ? 'bee' : ''}`; el.dataset.id = ++seq; el.innerHTML = bee ? '🐝' : '🤍<i>💧</i>';
        el.style.left = `${rnd(6, 88)}%`; el.style.top = `${rnd(14, 78)}%`;
        field.appendChild(el); live.set(String(seq), { el, bee, t: cfg.life * rnd(0.85, 1.15) });
        spawn = rnd(0.25, 0.55);
      }
      for (const [id, f] of live) { f.t -= dt; f.el.style.opacity = Math.min(1, f.t / 0.5); if (f.t <= 0) { f.el.remove(); live.delete(id); } }
      if (left <= 0) { over = true; api.end(starsBy(got, cfg.need)); }
      else if (Math.floor(left * 4) !== Math.floor((left + dt) * 4)) status();
    });
    return () => { stop(); field.removeEventListener('pointerdown', tap); };
  },

  /** 🐝 Hun khói lấy mật: giữ để thổi khói, giữ khói trong vùng xanh */
  smoke(area, cfg, api) {
    const box = frame(area, 'hg-smoke', `<div class="hg-hive">🪺<span class="bees">🐝 🐝 🐝</span><span class="puff">💨</span></div>${meterHtml([40, 40 + cfg.zone])}<div class="hg-prog"><i></i></div><p class="hg-hint">Giữ ngón tay để thổi khói</p>`);
    const zEl = box.querySelector('.hg-meter .z'), nEl = box.querySelector('.hg-meter .n'), prog = box.querySelector('.hg-prog i'), bees = box.querySelector('.bees');
    let s = 20, zc = 50, target = 50, next = 0, p = 0, left = cfg.seconds, low = 0, strikes = 0, over = false, hold = false, t = 0;
    const down = () => { hold = true; box.classList.add('on'); }, up = () => { hold = false; box.classList.remove('on'); };
    box.addEventListener('pointerdown', down); addEventListener('pointerup', up); addEventListener('pointercancel', up);
    const finish = () => { if (over) return; over = true; api.end(p >= cfg.need ? Math.max(1, 3 - strikes) : p >= cfg.need * 0.6 ? 1 : 0); };
    const stop = loop((dt) => {
      if (over) return;
      t += dt; left -= dt;
      if (t >= next) { target = rnd(30, 70); next = t + rnd(1.6, 2.6); }
      zc += (target - zc) * Math.min(1, dt * 1.5);
      s = Math.max(0, Math.min(100, s + (hold ? 55 : -40) * dt));
      const inZ = Math.abs(s - zc) <= cfg.zone / 2;
      if (inZ) p += dt; else low += dt;
      if (!inZ && low > 1.3) { low = 0; strikes++; api.bad(s > zc ? '💨 Khói quá, ong bỏ tổ!' : '🐝 Ong tỉnh dậy đốt!'); }
      if (inZ) low = 0;
      zEl.style.left = `${zc - cfg.zone / 2}%`; zEl.style.width = `${cfg.zone}%`; nEl.style.left = `${s}%`;
      prog.style.width = `${Math.min(1, p / cfg.need) * 100}%`;
      bees.style.opacity = inZ ? 0.35 : 1;
      box.classList.toggle('good', inZ);
      api.status(`🍯 ${Math.floor(Math.min(1, p / cfg.need) * 100)}% · bị đốt ${strikes} · ${Math.ceil(left)} giây`);
      if (p >= cfg.need || left <= 0) finish();
    });
    return () => { stop(); box.removeEventListener('pointerdown', down); removeEventListener('pointerup', up); removeEventListener('pointercancel', up); };
  },

  /** 🟨 Quay mật: kim quay tròn, chạm khi tới vạch đỏ trên cùng */
  spin(area, cfg, api) {
    const box = frame(area, 'hg-spin', `<div class="hg-wheel"><i class="mark" style="--w:${cfg.window * 360}deg"></i><i class="hand"></i><b>🍯</b></div>`);
    const hand = box.querySelector('.hand');
    let a = 0.5, beats = 0, hits = 0, over = false, tapped = false;
    const status = () => api.status(`Trúng ${hits}/${beats} · cần ${cfg.need.join('/')} / ${cfg.beats} nhịp`);
    status();
    const dist = () => { const d = a % 1; return Math.min(d, 1 - d); };
    const beat = (hit, ev) => { beats++; if (hit) { hits++; api.good(ev); } else api.bad(ev ? 'Lệch nhịp!' : 'Lỡ nhịp!'); status(); if (beats >= cfg.beats) { over = true; api.end(starsBy(hits, cfg.need)); } };
    const tap = (e) => { if (over || tapped) return; tapped = true; beat(dist() <= cfg.window / 2, e); };
    box.addEventListener('pointerdown', tap);
    const stop = loop((dt) => {
      if (over) return;
      const before = a % 1;
      a += cfg.speed * dt;
      hand.style.transform = `rotate(${(a % 1) * 360}deg)`;
      const now = a % 1;
      // vừa đi qua hết vùng vạch mà chưa chạm ⇒ lỡ nhịp; sang vòng mới thì được chạm lại
      if (before < cfg.window / 2 && now >= cfg.window / 2) { if (!tapped) beat(false); }
      if (before > 0.5 && now <= 0.5) tapped = false;
    });
    return () => { stop(); box.removeEventListener('pointerdown', tap); };
  },

  /** 🛶 Chèo thuyền hái sen: chạm trái / phải để đổi làn */
  row(area, cfg, api) {
    const box = frame(area, 'hg-row', `<div class="lanes"><i></i><i></i></div><div class="boat">🛶</div>${timeBar}`);
    const boat = box.querySelector('.boat'), bar = box.querySelector('.hg-time i');
    let lane = 1, left = cfg.seconds, got = 0, over = false, spawn = 0.3;
    const items = [];
    const status = () => api.status(`🪷 ${got} · cần ${cfg.need.join('/')} · ${Math.ceil(left)} giây`);
    status();
    const place = () => { boat.style.left = `${(lane + 0.5) * 33.33}%`; };
    place();
    const tap = (e) => { if (over) return; const r = box.getBoundingClientRect(); lane = Math.max(0, Math.min(2, lane + (e.clientX - r.left < r.width / 2 ? -1 : 1))); place(); };
    box.addEventListener('pointerdown', tap);
    const stop = loop((dt) => {
      if (over) return;
      left -= dt; spawn -= dt;
      bar.style.width = `${Math.max(0, left / cfg.seconds) * 100}%`;
      if (spawn <= 0) {
        const kind = Math.random() < 0.58 ? 'lotus' : 'rock', el = document.createElement('i');
        el.className = `obj ${kind}`; el.textContent = kind === 'lotus' ? '🪷' : ['🪨', '🎋'][ri(0, 1)];
        const ln = ri(0, 2); el.style.left = `${(ln + 0.5) * 33.33}%`;
        box.appendChild(el); items.push({ el, kind, lane: ln, y: -30 });
        spawn = rnd(0.45, 0.85);
      }
      const H = box.clientHeight, by = H - 70;
      for (let i = items.length - 1; i >= 0; i--) {
        const o = items[i];
        o.y += cfg.speed * dt; o.el.style.top = `${o.y}px`;
        if (o.lane === lane && Math.abs(o.y - by) < 26) {
          if (o.kind === 'lotus') { got++; api.good(); } else { got = Math.max(0, got - 1); api.bad('💥 Đụng rồi! −1'); }
          o.el.remove(); items.splice(i, 1); status(); continue;
        }
        if (o.y > H) { o.el.remove(); items.splice(i, 1); }
      }
      if (left <= 0) { over = true; api.end(starsBy(got, cfg.need)); }
      else if (Math.floor(left * 4) !== Math.floor((left + dt) * 4)) status();
    });
    return () => { stop(); box.removeEventListener('pointerdown', tap); };
  },

  /** 🍊 Rung cây hứng cam: kéo rổ hứng cam, né quả hỏng */
  catch(area, cfg, api) {
    const box = frame(area, 'hg-catch', `<div class="tree">🌳🌳🌳</div><div class="basket">🧺</div>${timeBar}`);
    const basket = box.querySelector('.basket'), bar = box.querySelector('.hg-time i');
    let x = 0.5, left = cfg.seconds, got = 0, over = false, spawn = 0.2;
    const items = [];
    const status = () => api.status(`🍊 ${got} · cần ${cfg.need.join('/')} · ${Math.ceil(left)} giây`);
    status();
    const move = (e) => { const r = box.getBoundingClientRect(); x = Math.max(0.06, Math.min(0.94, (e.clientX - r.left) / r.width)); basket.style.left = `${x * 100}%`; };
    box.addEventListener('pointerdown', move); box.addEventListener('pointermove', move);
    basket.style.left = '50%';
    const stop = loop((dt) => {
      if (over) return;
      left -= dt; spawn -= dt;
      bar.style.width = `${Math.max(0, left / cfg.seconds) * 100}%`;
      if (spawn <= 0) {
        const bad = Math.random() < 0.22, el = document.createElement('i');
        el.className = `obj ${bad ? 'bad' : ''}`; el.textContent = bad ? '🟤' : '🍊';
        const ox = rnd(0.08, 0.92); el.style.left = `${ox * 100}%`;
        box.appendChild(el); items.push({ el, bad, x: ox, y: 40, v: cfg.speed * rnd(0.8, 1.2) });
        spawn = rnd(0.35, 0.7);
      }
      const H = box.clientHeight, W = box.clientWidth, by = H - 64;
      for (let i = items.length - 1; i >= 0; i--) {
        const o = items[i];
        o.y += o.v * dt; o.el.style.top = `${o.y}px`;
        if (o.y > by - 14 && o.y < by + 18 && Math.abs(o.x - x) * W < 40) {
          if (o.bad) { got = Math.max(0, got - 1); api.bad('🤢 Quả hỏng! −1'); } else { got++; api.good(); }
          o.el.remove(); items.splice(i, 1); status(); continue;
        }
        if (o.y > H) { o.el.remove(); items.splice(i, 1); }
      }
      if (left <= 0) { over = true; api.end(starsBy(got, cfg.need)); }
      else if (Math.floor(left * 4) !== Math.floor((left + dt) * 4)) status();
    });
    return () => { stop(); box.removeEventListener('pointerdown', move); box.removeEventListener('pointermove', move); };
  },

  /** 🪵 Bóc vỏ quế: chạm lần lượt 1 → 7 dọc thanh quế */
  peel(area, cfg, api) {
    const box = frame(area, 'hg-peel', `<div class="stick"></div><div class="dots"></div>${timeBar}`);
    const dots = box.querySelector('.dots'), bar = box.querySelector('.hg-time i');
    let left = cfg.seconds, round = 0, next = 1, over = false;
    const status = () => api.status(`Thanh quế ${Math.min(round + 1, cfg.rounds)}/${cfg.rounds} · chạm số ${next} · ${Math.ceil(left)} giây`);
    const deal = () => {
      next = 1;
      const xs = shuffle(Array.from({ length: cfg.dots }, (_, i) => i));
      dots.innerHTML = xs.map((k, i) => `<button class="dot" data-n="${i + 1}" style="left:${8 + k * (84 / (cfg.dots - 1))}%;top:${42 + Math.sin(k * 1.3) * 16}%">${i + 1}</button>`).join('');
      status();
    };
    deal();
    const tap = (e) => {
      const el = e.target.closest('.dot'); if (!el || over) return;
      if (+el.dataset.n === next) { el.classList.add('done'); next++; api.good(e); if (next > cfg.dots) { round++; if (round >= cfg.rounds) { over = true; api.end(left >= cfg.seconds * 0.45 ? 3 : left >= cfg.seconds * 0.2 ? 2 : 1); return; } setTimeout(deal, 250); } }
      else { left = Math.max(0, left - 1); api.bad('Sai thứ tự! −1 giây'); }
      status();
    };
    dots.addEventListener('pointerdown', tap);
    const stop = loop((dt) => {
      if (over) return;
      left -= dt;
      bar.style.width = `${Math.max(0, left / cfg.seconds) * 100}%`;
      if (left <= 0) { over = true; api.end(0); }
    });
    return () => { stop(); dots.removeEventListener('pointerdown', tap); };
  },

  /** 👃 Đoán hương: đọc mô tả rồi chọn đúng hương */
  guess(area, cfg, api) {
    const box = frame(area, 'hg-guess qz', '<div class="qz-q"></div><div class="qz-opts"></div><div class="qz-timer"><i></i></div>');
    const qs = shuffle([...SCENTS]).slice(0, cfg.count);
    const names = [...new Set(SCENTS.map((s) => s[1]))];
    let i = 0, right = 0, left = cfg.seconds, busy = false, over = false, opts = [];
    const render = () => {
      const [desc, ans] = qs[i];
      opts = shuffle([ans, ...shuffle(names.filter((n) => n !== ans)).slice(0, 2)]);
      box.querySelector('.qz-q').innerHTML = `<small>Câu ${i + 1}/${qs.length}</small><p>“${desc}”</p>`;
      box.querySelector('.qz-opts').innerHTML = opts.map((o, k) => `<button class="btn qz-o" data-k="${k}">${o}</button>`).join('');
      left = cfg.seconds; busy = false;
      api.status(`Đúng ${right}/${qs.length}`);
    };
    const answer = (k) => {
      if (busy || over) return; busy = true;
      const ok = opts[k] === qs[i][1];
      if (ok) { right++; api.good(); } else api.bad(`Là ${qs[i][1]}`);
      box.querySelectorAll('.qz-o').forEach((b) => { if (opts[+b.dataset.k] === qs[i][1]) b.classList.add('right'); else if (+b.dataset.k === k) b.classList.add('wrong'); });
      setTimeout(() => { i++; if (i >= qs.length) { over = true; api.end(right >= qs.length ? 3 : right >= qs.length - 1 ? 2 : right >= qs.length - 2 ? 1 : 0); } else render(); }, 800);
    };
    render();
    const click = (e) => { const b = e.target.closest('.qz-o'); if (b) answer(+b.dataset.k); };
    box.addEventListener('click', click);
    const stop = loop((dt) => {
      if (busy || over) return;
      left -= dt;
      box.querySelector('.qz-timer i').style.width = `${Math.max(0, left / cfg.seconds) * 100}%`;
      if (left <= 0) answer(-1);
    });
    return () => { stop(); box.removeEventListener('click', click); };
  },

  /** 🔥 Sao trà: lá chuyển vàng ✨ thì chạm để đảo, để lâu là cháy */
  roast(area, cfg, api) {
    const N = 8;
    const box = frame(area, 'hg-roast', `<div class="pan">${Array.from({ length: N }, (_, i) => `<button class="leaf" data-i="${i}" style="--a:${(i / N) * 360}deg"></button>`).join('')}</div>${timeBar}`);
    const leaves = [...box.querySelectorAll('.leaf')].map((el) => ({ el, st: 'green', t: rnd(0.5, 3) }));
    let left = cfg.seconds, flips = 0, burns = 0, over = false;
    const bar = box.querySelector('.hg-time i');
    const status = () => api.status(`Đảo ${flips} · cháy ${burns} · cần ${cfg.need.join('/')} · ${Math.ceil(left)} giây`);
    const set = (l, st, t) => { l.st = st; l.t = t; l.el.className = `leaf ${st}`; };
    leaves.forEach((l) => set(l, 'green', rnd(0.6, 3.2)));
    status();
    const tap = (e) => {
      const el = e.target.closest('.leaf'); if (!el || over) return;
      const l = leaves[+el.dataset.i];
      if (l.st === 'gold') { flips++; api.good(e); set(l, 'green', rnd(1.2, 3.4)); }
      else if (l.st === 'green') api.bad('Chưa vàng!');
      status();
    };
    box.addEventListener('pointerdown', tap);
    const stop = loop((dt) => {
      if (over) return;
      left -= dt;
      bar.style.width = `${Math.max(0, left / cfg.seconds) * 100}%`;
      for (const l of leaves) {
        l.t -= dt;
        if (l.t > 0) continue;
        if (l.st === 'green') set(l, 'gold', cfg.ripe);
        else if (l.st === 'gold') { burns++; api.bad('🔥 Cháy lá rồi!'); set(l, 'burnt', 1); status(); }
        else set(l, 'green', rnd(1.2, 3.4));
      }
      if (left <= 0) { over = true; api.end(starsBy(flips - burns, cfg.need)); }
      else if (Math.floor(left * 4) !== Math.floor((left + dt) * 4)) status();
    });
    return () => { stop(); box.removeEventListener('pointerdown', tap); };
  },

  /** 🥄 Nấu mứt: vuốt vòng quanh nồi, giữ tốc độ khuấy trong vùng xanh */
  jam(area, cfg, api) {
    const box = frame(area, 'hg-jam', `<div class="pot"><i class="spoon">🥄</i></div>${meterHtml(cfg.zone)}<div class="hg-prog"><i></i></div><p class="hg-hint">Vuốt vòng tròn quanh nồi</p>`);
    const pot = box.querySelector('.pot'), spoon = box.querySelector('.spoon'), nEl = box.querySelector('.hg-meter .n'), prog = box.querySelector('.hg-prog i');
    let lastA = null, w = 0, sp = 0, ang = 0, p = 0, left = cfg.seconds, bad = 0, strikes = 0, over = false;
    const move = (e) => {
      if (e.type === 'pointermove' && !e.buttons && e.pointerType === 'mouse') { lastA = null; return; }
      const r = pot.getBoundingClientRect();
      const a = Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2));
      if (lastA != null) { let d = a - lastA; if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI; w += Math.abs(d); ang += d; }
      lastA = a;
    };
    const up = () => { lastA = null; };
    box.addEventListener('pointerdown', move); box.addEventListener('pointermove', move); addEventListener('pointerup', up);
    const finish = () => { if (over) return; over = true; api.end(p >= cfg.need ? Math.max(1, 3 - strikes) : p >= cfg.need * 0.6 ? 1 : 0); };
    const stop = loop((dt) => {
      if (over) return;
      left -= dt;
      // tốc độ khuấy (vòng/giây) quy ra 0..100
      sp += ((Math.min(100, (w / dt) * 4.2)) - sp) * Math.min(1, dt * 3.5);
      w = 0;
      spoon.style.transform = `rotate(${ang}rad) translateX(38px)`;
      const inZ = sp >= cfg.zone[0] && sp <= cfg.zone[1];
      if (inZ) { p += dt; bad = 0; } else bad += dt;
      if (bad > 1.6) { bad = 0; strikes++; api.bad(sp < cfg.zone[0] ? '🔥 Mứt bắt đầu khét!' : '🫧 Khuấy mạnh quá, mứt trào!'); }
      nEl.style.left = `${sp}%`;
      prog.style.width = `${Math.min(1, p / cfg.need) * 100}%`;
      box.classList.toggle('good', inZ);
      api.status(`Mứt chín ${Math.floor(Math.min(1, p / cfg.need) * 100)}% · lỗi ${strikes} · ${Math.ceil(left)} giây`);
      if (p >= cfg.need || left <= 0) finish();
    });
    return () => { stop(); box.removeEventListener('pointerdown', move); box.removeEventListener('pointermove', move); removeEventListener('pointerup', up); };
  },

  /** ⚗️ Chưng cất: chạm thêm củi, giữ lửa trong vùng xanh để tinh dầu nhỏ giọt */
  distill(area, cfg, api) {
    const box = frame(area, 'hg-distill', `<div class="still"><span class="flask">⚗️</span><span class="fire">🔥</span><span class="vial">🧴<i class="drop">💧</i></span></div>${meterHtml(cfg.zone)}${timeBar}<p class="hg-hint">Chạm để thêm củi</p>`);
    const nEl = box.querySelector('.hg-meter .n'), fire = box.querySelector('.fire'), drop = box.querySelector('.drop'), bar = box.querySelector('.hg-time i');
    let f = 30, left = cfg.seconds, drops = 0, acc = 0, cracks = 0, over = false;
    const tap = () => { if (over) return; f = Math.min(100, f + 12); fire.classList.remove('pop'); void fire.offsetWidth; fire.classList.add('pop'); };
    box.addEventListener('pointerdown', tap);
    const stop = loop((dt) => {
      if (over) return;
      left -= dt;
      f = Math.max(0, f - 11 * dt);
      const inZ = f >= cfg.zone[0] && f <= cfg.zone[1];
      if (inZ) { acc += dt; if (acc >= 0.75) { acc = 0; drops++; api.good(); drop.classList.remove('fall'); void drop.offsetWidth; drop.classList.add('fall'); } }
      if (f > 94) { cracks++; f = 55; api.bad('💥 Lửa to quá, bình nứt! −2 giọt'); drops = Math.max(0, drops - 2); }
      nEl.style.left = `${f}%`;
      fire.style.fontSize = `${24 + f * 0.4}px`;
      bar.style.width = `${Math.max(0, left / cfg.seconds) * 100}%`;
      box.classList.toggle('good', inZ);
      api.status(`💧 ${drops} giọt · cần ${cfg.need.join('/')} · ${Math.ceil(left)} giây`);
      if (left <= 0) { over = true; api.end(starsBy(drops, cfg.need)); }
    });
    return () => { stop(); box.removeEventListener('pointerdown', tap); };
  },

  /** 🕯️ Đổ khuôn: giữ để rót sáp, thả đúng vạch của từng khuôn */
  mold(area, cfg, api) {
    const lines = Array.from({ length: cfg.molds }, () => ri(45, 88));
    const box = frame(area, 'hg-mold', `<div class="molds">${lines.map((l, i) => `<div class="mold" data-i="${i}"><i class="line" style="bottom:${l}%"></i><i class="wax"></i></div>`).join('')}</div><div class="pitcher">🫗</div>`);
    const molds = [...box.querySelectorAll('.mold')], pitcher = box.querySelector('.pitcher');
    let k = 0, lvl = 0, rate = cfg.rate, pouring = false, over = false;
    const scores = [];
    const status = () => api.status(k < cfg.molds ? `Khuôn ${k + 1}/${cfg.molds}: giữ để rót, thả ở vạch` : 'Xong!');
    const focus = () => { molds.forEach((m, i) => m.classList.toggle('on', i === k)); pitcher.style.left = `${(k + 0.5) * (100 / cfg.molds)}%`; };
    focus(); status();
    const lock = () => {
      if (!pouring || over) return;
      pouring = false; pitcher.classList.remove('on');
      const err = Math.abs(lvl - lines[k]);
      const sc = err < 4 ? 3 : err < 8 ? 2 : err < 13 ? 1 : 0;
      scores.push(sc);
      sc >= 2 ? api.good() : api.bad(sc ? 'Lệch chút' : 'Lệch nhiều quá');
      molds[k].classList.add('done');
      k++; lvl = 0; rate = cfg.rate;
      if (k >= cfg.molds) { over = true; const avg = scores.reduce((a, b) => a + b, 0) / scores.length; api.end(avg >= 2.5 ? 3 : avg >= 1.7 ? 2 : avg >= 0.8 ? 1 : 0); return; }
      focus(); status();
    };
    const down = () => { if (over) return; pouring = true; pitcher.classList.add('on'); };
    box.addEventListener('pointerdown', down); addEventListener('pointerup', lock); addEventListener('pointercancel', lock);
    const stop = loop((dt) => {
      if (over || !pouring) return;
      lvl += rate * dt; rate += 14 * dt;
      molds[k].querySelector('.wax').style.height = `${Math.min(100, lvl)}%`;
      if (lvl >= 100) { lvl = 100; lock(); }
    });
    return () => { stop(); box.removeEventListener('pointerdown', down); removeEventListener('pointerup', lock); removeEventListener('pointercancel', lock); };
  },

  /** 🪨 Giã cối: nốt rơi xuống, chạm khi tới vạch */
  mortar(area, cfg, api) {
    const box = frame(area, 'hg-mortar', '<div class="track"><i class="hit"></i></div><div class="bowl">🥣<i class="pestle">🪨</i></div>');
    const track = box.querySelector('.track'), pestle = box.querySelector('.pestle');
    let spawned = 0, hits = 0, done = 0, over = false, next = 0.6;
    const notes = [];
    const status = () => api.status(`Trúng ${hits}/${done} · cần ${cfg.need.join('/')} / ${cfg.beats} nhịp`);
    status();
    const lineY = () => track.clientHeight - 34;
    const resolve = (hit, ev) => { done++; if (hit) { hits++; api.good(ev); } else api.bad('Lỡ nhịp!'); status(); if (done >= cfg.beats) { over = true; api.end(starsBy(hits, cfg.need)); } };
    const tap = (e) => {
      if (over) return;
      pestle.classList.remove('hit'); void pestle.offsetWidth; pestle.classList.add('hit');
      const ly = lineY();
      let best = -1, bd = Infinity;
      notes.forEach((n, i) => { const d = Math.abs(n.y - ly); if (d < bd) { bd = d; best = i; } });
      if (best >= 0 && bd <= cfg.window) { notes[best].el.remove(); notes.splice(best, 1); resolve(true, e); }
      else api.bad('Sớm quá!');
    };
    box.addEventListener('pointerdown', tap);
    const stop = loop((dt) => {
      if (over) return;
      next -= dt;
      if (next <= 0 && spawned < cfg.beats) { const el = document.createElement('i'); el.className = 'note'; el.textContent = '🌿'; track.appendChild(el); notes.push({ el, y: -20 }); spawned++; next = rnd(0.55, 1.0) * (150 / cfg.speed); }
      const ly = lineY();
      for (let i = notes.length - 1; i >= 0; i--) {
        const n = notes[i]; n.y += cfg.speed * dt; n.el.style.top = `${n.y}px`;
        if (n.y > ly + cfg.window) { n.el.remove(); notes.splice(i, 1); resolve(false); if (over) return; }
      }
    });
    return () => { stop(); box.removeEventListener('pointerdown', tap); };
  },

  /** 🧪 Pha hương 3 tầng: nhỏ từng giọt để 3 thanh khớp vạch mục tiêu */
  blend(area, cfg, api) {
    const keys = Object.keys(BLEND_DROPS);
    const target = [0, 0, 0];
    for (let i = 0; i < cfg.drops - 1; i++) { const d = BLEND_DROPS[keys[ri(0, keys.length - 1)]]; target.forEach((_, j) => { target[j] += d[j]; }); }
    const max = Math.max(...target) * 1.5 + 10;
    const LAYER = ['Hương đầu', 'Hương giữa', 'Hương cuối'];
    const box = frame(area, 'hg-blend', `<div class="bars">${LAYER.map((n, j) => `<div class="bar"><span>${n}</span><div class="tube"><i class="fill"></i><i class="tgt" style="left:${(target[j] / max) * 100}%"></i></div></div>`).join('')}</div>
      <div class="drops">${keys.map((k) => `<button class="btn drop" data-k="${k}">${INGREDIENTS[k]?.icon || '💧'}<small>${INGREDIENTS[k]?.name || k}</small></button>`).join('')}</div>
      <div class="acts"><span class="left"></span><button class="btn" data-a="undo">↩️ Bỏ giọt cuối</button><button class="btn primary" data-a="done">✅ Xong</button></div>`);
    box.dataset.target = target.join(',');
    const used = [], cur = [0, 0, 0];
    const fills = [...box.querySelectorAll('.fill')];
    const err = () => cur.reduce((a, v, j) => a + Math.abs(v - target[j]), 0);
    const render = () => {
      fills.forEach((f, j) => { f.style.width = `${Math.min(100, (cur[j] / max) * 100)}%`; f.classList.toggle('ok', Math.abs(cur[j] - target[j]) <= 4); });
      box.querySelector('.left').textContent = `Còn ${cfg.drops - used.length} giọt`;
      api.status(`Độ lệch: ${err()} (≤ ${cfg.tol[0]} là 3⭐)`);
    };
    render();
    const click = (e) => {
      const d = e.target.closest('.drop'), a = e.target.closest('[data-a]');
      if (d) {
        if (used.length >= cfg.drops) { api.bad('Hết giọt rồi!'); return; }
        const v = BLEND_DROPS[d.dataset.k]; used.push(d.dataset.k); v.forEach((x, j) => { cur[j] += x; });
        Math.abs(err()) < 999 && api.tap(); render();
      } else if (a?.dataset.a === 'undo' && used.length) { const v = BLEND_DROPS[used.pop()]; v.forEach((x, j) => { cur[j] -= x; }); render(); }
      else if (a?.dataset.a === 'done') { const e2 = err(); api.end(e2 <= cfg.tol[0] ? 3 : e2 <= cfg.tol[1] ? 2 : e2 <= cfg.tol[2] ? 1 : 0); }
    };
    box.addEventListener('click', click);
    return () => box.removeEventListener('click', click);
  },
};
