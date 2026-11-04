// Mini game khi dân làng nhờ việc (GĐ12). Mỗi game chạy trong lớp phủ #minigame, chạm là chơi được.
// runMiniGame(kind, { title, icon, ask, who, sfx }) → Promise<{ stars: 0..3, quit }>
// Số liệu độ khó ở data/minigames.js (MINIGAMES, RHYMES).
import { MINIGAMES, RHYMES } from '../../data/minigames.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const rnd = (a, b) => a + Math.random() * (b - a);
const ri = (a, b) => Math.floor(rnd(a, b + 1));
const shuffle = (arr) => { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/** Vòng lặp khung hình, trả về hàm dừng */
function loop(fn) {
  let raf = 0, last = performance.now(), on = true;
  const f = (t) => { if (!on) return; const dt = Math.min(0.05, (t - last) / 1000); last = t; fn(dt, t); raf = requestAnimationFrame(f); };
  raf = requestAnimationFrame(f);
  return () => { on = false; cancelAnimationFrame(raf); };
}

// =============================================================== CÁC GAME
const ENGINES = {
  /** 🪡 Xỏ kim: kim đung đưa, chạm khi lỗ kim nằm dưới sợi chỉ */
  needle(area, cfg, api) {
    area.innerHTML = `<div class="ndl"><div class="ndl-thread"><i></i></div><div class="ndl-needle"><span class="eye" style="width:${cfg.eye}px"></span></div><div class="mg-pop"></div></div>`;
    const needle = area.querySelector('.ndl-needle'), thread = area.querySelector('.ndl-thread'), pop = area.querySelector('.mg-pop');
    let phase = Math.random() * 6, speed = cfg.speed, ok = 0, tries = 0, busy = false;
    const amp = () => Math.min(area.clientWidth * 0.3, 140); // (0.16) biên độ nhỏ hơn: kim chạy chậm hơn qua lỗ chỉ
    let x = 0;
    const status = () => api.status(`Đã xỏ ${ok}/${cfg.need} · Lượt ${tries}/${cfg.tries}`);
    status();
    const stop = loop((dt) => { phase += dt * speed; x = Math.sin(phase) * amp(); needle.style.transform = `translateX(${x}px)`; });
    const tap = () => {
      if (busy) return;
      busy = true; tries++;
      const hit = Math.abs(x) < cfg.eye / 2 - 2;
      thread.classList.add('down');
      setTimeout(() => {
        if (hit) { ok++; speed *= cfg.accel; api.good(); pop.textContent = '✨ Lọt rồi!'; thread.classList.add('in'); }
        else { api.bad(); pop.textContent = '❌ Trượt!'; needle.classList.add('shake'); }
        pop.classList.add('show');
        status();
        setTimeout(() => {
          thread.classList.remove('down', 'in'); needle.classList.remove('shake'); pop.classList.remove('show');
          busy = false;
          const miss = tries - ok;
          if (ok >= cfg.need) api.end(miss === 0 ? 3 : miss === 1 ? 2 : 1);
          else if (tries >= cfg.tries || cfg.tries - tries < cfg.need - ok) api.end(0);
        }, 520);
      }, 230);
    };
    area.addEventListener('pointerdown', tap);
    return () => { stop(); area.removeEventListener('pointerdown', tap); };
  },

  /** 🔨 Đóng đinh: chạm khi kim lực nằm trong vùng xanh */
  hammer(area, cfg, api) {
    const nails = 3, perNail = Math.ceil(cfg.need / nails);
    area.innerHTML = `<div class="hmr"><div class="hmr-board">${Array.from({ length: nails }, (_, i) => `<div class="nail" data-i="${i}"><i></i></div>`).join('')}</div>
      <div class="hmr-ham">🔨</div><div class="hmr-bar"><span class="zone" style="width:${cfg.zone * 100}%"></span><b class="mk"></b></div><div class="mg-pop"></div></div>`;
    const mk = area.querySelector('.mk'), ham = area.querySelector('.hmr-ham'), pop = area.querySelector('.mg-pop');
    const nailEls = [...area.querySelectorAll('.nail')];
    let p = 0, dir = 1, speed = cfg.speed * 0.5, hits = 0, taps = 0, busy = false;
    const status = () => api.status(`Đinh ${Math.min(nails, Math.floor(hits / perNail) + 1)}/${nails} · Lượt ${taps}/${cfg.tries}`);
    status();
    const stop = loop((dt) => { p += dir * speed * dt; if (p > 1) { p = 1; dir = -1; } if (p < 0) { p = 0; dir = 1; } mk.style.left = `${p * 100}%`; });
    const tap = () => {
      if (busy) return;
      busy = true; taps++;
      const good = Math.abs(p - 0.5) < cfg.zone / 2;
      ham.classList.add('hit');
      const ni = Math.min(nails - 1, Math.floor(hits / perNail));
      if (good) { hits++; speed *= cfg.accel; api.good(); nailEls[ni].style.setProperty('--h', `${Math.max(0, 1 - (hits - ni * perNail) / perNail) * 100}%`); if (hits % perNail === 0) nailEls[ni].classList.add('done'); pop.textContent = '💥 Chuẩn!'; }
      else { api.bad(); nailEls[ni].classList.add('bend'); pop.textContent = '😬 Lệch rồi!'; }
      pop.classList.add('show');
      status();
      setTimeout(() => {
        ham.classList.remove('hit'); nailEls[ni].classList.remove('bend'); pop.classList.remove('show'); busy = false;
        const miss = taps - hits;
        if (hits >= cfg.need) api.end(miss <= 1 ? 3 : miss === 2 ? 2 : 1);
        else if (taps >= cfg.tries || cfg.tries - taps < cfg.need - hits) api.end(0);
      }, 380);
    };
    area.addEventListener('pointerdown', tap);
    return () => { stop(); area.removeEventListener('pointerdown', tap); };
  },

  /** 🎣 Câu cá: đợi phao chìm (❗) rồi chạm thật nhanh */
  fishing(area, cfg, api) {
    area.innerHTML = `<div class="fsh"><div class="fsh-line"></div><div class="fsh-bob"><i></i></div><div class="fsh-alert">❗</div><div class="fsh-fish"></div><div class="mg-pop"></div></div>`;
    const root = area.firstElementChild, pop = area.querySelector('.mg-pop'), fish = area.querySelector('.fsh-fish');
    let round = 0, caught = 0, state = 'idle', timer = 0, alive = true;
    const FISH = ['🐟', '🐠', '🐡', '🦐', '🐟'];
    const status = () => api.status(`Bắt được ${caught} · Lượt ${Math.min(round + 1, cfg.rounds)}/${cfg.rounds}`);
    const nextRound = () => {
      if (!alive) return;
      if (round >= cfg.rounds) { api.end(caught); return; }
      status();
      state = 'wait'; root.className = 'fsh';
      timer = setTimeout(() => {
        if (!alive) return;
        state = 'bite'; root.classList.add('bite');
        timer = setTimeout(() => { if (state === 'bite') finish(false, '💨 Cá ăn mồi rồi chạy mất!'); }, (cfg.window[round] ?? 0.6) * 1000);
      }, rnd(cfg.waitMin, cfg.waitMax) * 1000);
    };
    const finish = (ok, msg) => {
      clearTimeout(timer);
      state = 'show';
      if (ok) { caught++; api.good(); fish.textContent = FISH[ri(0, FISH.length - 1)]; root.classList.add('caught'); } else { api.bad(); root.classList.add('miss'); }
      pop.textContent = msg; pop.classList.add('show');
      round++;
      status();
      setTimeout(() => { pop.classList.remove('show'); nextRound(); }, 1100);
    };
    const tap = () => {
      if (state === 'wait') finish(false, '🐟💨 Chạm sớm quá, cá sợ chạy mất!');
      else if (state === 'bite') finish(true, '🎉 Dính cá rồi!');
    };
    area.addEventListener('pointerdown', tap);
    nextRound();
    return () => { alive = false; clearTimeout(timer); area.removeEventListener('pointerdown', tap); };
  },

  /** ☕ Pha cà phê muối: giữ để rót, thả đúng vạch */
  pour(area, cfg, api) {
    area.innerHTML = `<div class="pr"><div class="pr-cup">${cfg.layers.map((l, i) => `<div class="pr-line" style="bottom:${l.to}%"><span>${esc(l.name)}</span></div><div class="pr-liq l${i}" style="background:${l.color}"></div>`).join('')}</div>
      <div class="pr-pot">🫖</div><div class="mg-pop"></div></div>`;
    const liqs = [...area.querySelectorAll('.pr-liq')], pop = area.querySelector('.mg-pop'), pot = area.querySelector('.pr-pot');
    let layer = 0, level = 0, base = 0, pouring = false, hold = 0, done = false;
    const scores = [];
    const status = () => api.status(layer < cfg.layers.length ? `Giữ để rót ${cfg.layers[layer].name} tới vạch ${cfg.layers[layer].to}%` : 'Xong!');
    status();
    const lock = () => {
      if (done || !pouring) return;
      pouring = false; pot.classList.remove('on');
      const err = Math.abs(level - cfg.layers[layer].to);
      const sc = err < 3 ? 3 : err < 7 ? 2 : err < 12 ? 1 : 0;
      scores.push(sc);
      sc >= 2 ? api.good() : api.bad();
      pop.textContent = sc === 3 ? '🌟 Hoàn hảo!' : sc === 2 ? '👍 Khá chuẩn' : sc === 1 ? '😅 Lệch chút' : '😵 Lệch nhiều quá';
      pop.classList.add('show'); setTimeout(() => pop.classList.remove('show'), 800);
      base = level; layer++; hold = 0;
      status();
      if (layer >= cfg.layers.length) { done = true; setTimeout(() => api.end(Math.floor((scores.reduce((a, b) => a + b, 0) / scores.length) + 0.01)), 700); }
    };
    const stop = loop((dt) => {
      if (!pouring || done) return;
      hold += dt;
      level += (cfg.rate + cfg.accel * hold) * dt;
      liqs[layer].style.bottom = `${base}%`;
      liqs[layer].style.height = `${Math.max(0, level - base)}%`;
      if (level >= 100) { done = true; pouring = false; pot.classList.remove('on'); api.bad(); pop.textContent = '💦 Tràn ly rồi!'; pop.classList.add('show'); setTimeout(() => api.end(0), 900); }
    });
    const down = (e) => { if (done || layer >= cfg.layers.length) return; e.preventDefault(); pouring = true; pot.classList.add('on'); };
    area.addEventListener('pointerdown', down);
    window.addEventListener('pointerup', lock);
    window.addEventListener('pointercancel', lock);
    return () => { stop(); area.removeEventListener('pointerdown', down); window.removeEventListener('pointerup', lock); window.removeEventListener('pointercancel', lock); };
  },

  /** 🧮 Chấm bài toán */
  math(area, cfg, api) { return quiz(area, cfg, api, Array.from({ length: cfg.count }, mathQuestion)); },

  /** 📝 Ghép vần thơ */
  rhyme(area, cfg, api) {
    const qs = shuffle([...RHYMES]).slice(0, cfg.count).map(([l6, l8, ok, wrong]) => {
      const opts = shuffle([ok, ...wrong]);
      return { html: `<p class="poem">${esc(l6)}<br>${esc(l8).replace('___', '<u>&nbsp;?&nbsp;</u>')}</p>`, opts, answer: opts.indexOf(ok) };
    });
    return quiz(area, cfg, api, qs);
  },

  /** 🃏 Lật thẻ hoa */
  memory(area, cfg, api) {
    const faces = shuffle(['🌷', '🌹', '🌻', '🌼', '💐', '🪻', '🌸', '🪷']).slice(0, cfg.pairs);
    const deck = shuffle([...faces, ...faces]);
    area.innerHTML = `<div class="mem" style="--cols:${Math.ceil(deck.length / 2)};--rows:2">${deck.map((f, i) => `<button class="card" data-i="${i}"><span class="b">🌱</span><span class="f">${f}</span></button>`).join('')}</div>`;
    const cards = [...area.querySelectorAll('.card')];
    let open = [], moves = 0, found = 0, lock = false, left = cfg.seconds, over = false;
    const status = () => api.status(`Cặp ${found}/${cfg.pairs} · ${moves} lượt · ⏱ ${Math.ceil(left)}s`);
    status();
    const stop = loop((dt) => { if (over) return; left -= dt; status(); if (left <= 0) { over = true; api.bad(); api.end(0); } });
    const click = (e) => {
      const c = e.target.closest('.card');
      if (!c || lock || over || c.classList.contains('open') || c.classList.contains('done')) return;
      c.classList.add('open'); open.push(c);
      if (open.length < 2) return;
      moves++;
      const [a, b] = open;
      if (deck[a.dataset.i] === deck[b.dataset.i]) {
        a.classList.add('done'); b.classList.add('done'); open = []; found++; api.good();
        if (found === cfg.pairs) { over = true; setTimeout(() => api.end(moves <= cfg.star3 ? 3 : moves <= cfg.star2 ? 2 : 1), 500); }
      } else {
        lock = true;
        setTimeout(() => { a.classList.remove('open'); b.classList.remove('open'); open = []; lock = false; }, 650);
      }
      status();
    };
    area.addEventListener('click', click);
    return () => { stop(); area.removeEventListener('click', click); };
  },
};

/** Câu hỏi trắc nghiệm có đếm giờ (dùng cho toán & thơ) */
function quiz(area, cfg, api, qs) {
  let i = 0, right = 0, left = cfg.seconds, busy = false, over = false;
  const render = () => {
    const q = qs[i];
    area.innerHTML = `<div class="qz"><div class="qz-timer"><i></i></div><div class="qz-q"><div>${q.html}</div></div>
      <div class="qz-opts">${q.opts.map((o, k) => `<button class="btn qz-o" data-k="${k}">${esc(o)}</button>`).join('')}</div></div>`;
    left = cfg.seconds; busy = false;
    api.status(`Câu ${i + 1}/${qs.length} · Đúng ${right}`);
  };
  const answer = (k) => {
    if (busy || over) return;
    busy = true;
    const q = qs[i];
    const btns = [...area.querySelectorAll('.qz-o')];
    if (k === q.answer) { right++; api.good(); btns[k]?.classList.add('ok'); } else { api.bad(); btns[k]?.classList.add('no'); btns[q.answer]?.classList.add('ok'); }
    setTimeout(() => {
      i++;
      if (i >= qs.length) { over = true; const n = qs.length; api.end(right >= n ? 3 : right >= n - 1 ? 2 : right >= n - 2 ? 1 : 0); }
      else render();
    }, 750);
  };
  render();
  const stop = loop((dt) => {
    if (busy || over) return;
    left -= dt;
    const bar = area.querySelector('.qz-timer i');
    if (bar) bar.style.width = `${Math.max(0, left / cfg.seconds) * 100}%`;
    if (left <= 0) answer(-1);
  });
  const click = (e) => { const b = e.target.closest('.qz-o'); if (b) answer(+b.dataset.k); };
  area.addEventListener('click', click);
  return () => { stop(); area.removeEventListener('click', click); };
}

function mathQuestion() {
  const E = ['🌷', '🌹', '🌻', '🌼'][ri(0, 3)];
  const t = ri(0, 3);
  let html, ans;
  if (t === 0) { const a = ri(2, 6), b = ri(1, 5); html = `<span class="emo">${E.repeat(a)}</span> + <span class="emo">${E.repeat(b)}</span> = ?`; ans = a + b; }
  else if (t === 1) { const a = ri(2, 5), b = ri(2, 6); html = `Có <b>${a}</b> luống, mỗi luống <b>${b}</b> bông ${E}. Tất cả có bao nhiêu bông?`; ans = a * b; }
  else if (t === 2) { const a = ri(8, 18), b = ri(2, 7); html = `Có <b>${a}</b> bông ${E}, bán đi <b>${b}</b> bông. Còn lại mấy bông?`; ans = a - b; }
  else { const b = ri(2, 4), k = ri(2, 5); html = `Bó hoa có <b>${b * k}</b> bông ${E}, chia đều cho <b>${b}</b> khách. Mỗi khách mấy bông?`; ans = k; }
  const set = new Set([ans]);
  while (set.size < 3) { const d = ans + ri(-3, 3); if (d > 0) set.add(d); }
  const opts = shuffle([...set]);
  return { html, opts: opts.map(String), answer: opts.indexOf(ans) };
}

// =============================================================== KHUNG CHẠY GAME
export function runMiniGame(kind, { title = '', icon = '🎮', ask = '', who = '', sfx = null } = {}) {
  const cfg = MINIGAMES[kind];
  const engine = ENGINES[kind];
  if (!cfg || !engine) return Promise.resolve({ stars: 0, quit: true });
  return new Promise((resolve) => {
    const el = document.createElement('div');
    el.id = 'minigame';
    el.innerHTML = `<div class="mg-card">
      <div class="mg-head"><b>${esc(icon)} ${esc(title)}</b><span class="mg-status"></span><button class="btn mg-quit" type="button">Bỏ cuộc</button></div>
      <div class="mg-area"><div class="mg-intro">
        ${ask ? `<p class="vg-say">“${esc(ask)}”${who ? ` <small>— ${esc(who)}</small>` : ''}</p>` : ''}
        <p class="mg-help">💡 ${esc(cfg.help)}</p>
        <button class="btn primary mg-start" type="button">Bắt đầu!</button></div></div>
    </div>`;
    document.body.appendChild(el);
    const area = el.querySelector('.mg-area');
    const statusEl = el.querySelector('.mg-status');
    let cleanup = null, finished = false;
    const close = (stars, quit = false) => {
      if (finished) return;
      finished = true;
      cleanup?.();
      el.classList.add('out');
      setTimeout(() => el.remove(), 250);
      resolve({ stars, quit });
    };
    const api = {
      status: (t) => { statusEl.textContent = t; },
      good: () => { try { sfx?.tap(1.2); } catch { /* bỏ qua */ } area.classList.remove('flash-bad'); area.classList.add('flash-good'); setTimeout(() => area.classList.remove('flash-good'), 250); },
      bad: () => { area.classList.remove('flash-good'); area.classList.add('flash-bad'); setTimeout(() => area.classList.remove('flash-bad'), 300); },
      end: (stars) => {
        if (finished) return;
        cleanup?.(); cleanup = null;
        area.innerHTML = `<div class="mg-end"><div class="mg-stars">${'⭐'.repeat(stars)}${'☆'.repeat(3 - stars)}</div><b>${stars >= 3 ? 'Xuất sắc!' : stars === 2 ? 'Tốt lắm!' : stars === 1 ? 'Tạm được!' : 'Chưa được rồi...'}</b></div>`;
        setTimeout(() => close(stars), 1300);
      },
    };
    el.querySelector('.mg-quit').addEventListener('click', () => close(0, true));
    el.querySelector('.mg-start').addEventListener('click', async () => {
      for (const n of ['3', '2', '1']) { area.innerHTML = `<div class="mg-count">${n}</div>`; await wait(550); if (finished) return; }
      area.innerHTML = '';
      cleanup = engine(area, cfg, api);
    });
  });
}
