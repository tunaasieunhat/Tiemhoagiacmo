// Intro khi mở game — vẽ bằng hiệu ứng (không dùng video, không phải tải file, không cần "chạm để bắt đầu"):
//   1. Trời đêm đầy sao, chữ DREAMER hiện từng chữ, GAMES hiện bên dưới, một vệt sáng lướt qua
//   2. Trời sáng dần sang màu hồng–xanh của game, sao biến thành cánh hoa rơi
//   3. Hiện tên game "Tiệm Hoa Giấc Mơ" rồi cả màn hình tan dần vào nông trại
// Chạm màn hình hoặc bấm "Bỏ qua" để vào ngay. Số liệu: data/audio.js → AUDIO.intro.
import { AUDIO } from '../../data/audio.js';

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function playIntro({ enabled = true } = {}) {
  const cfg = AUDIO.intro;
  if (!enabled) return Promise.resolve({ shown: false });
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const T = Math.max(2, cfg.seconds || 5) * 1000 * (reduce ? 0.6 : 1);

  return new Promise((resolve) => {
    const letters = [...String(cfg.brand || '')];
    const n = Math.max(1, letters.length - 1);
    const wrap = document.createElement('div');
    wrap.id = 'intro';
    wrap.style.setProperty('--u', String(T / 5000)); // nhịp thời gian (1 = intro 5 giây)
    wrap.innerHTML = `
      <div class="intro-sky night"></div>
      <div class="intro-sky sunrise"></div>
      <div class="intro-sky dawn"></div>
      <canvas class="intro-fx"></canvas>
      <div class="intro-logo">
        <div class="brand">${letters.map((ch, i) => `<span style="--i:${i};background-position:${((i / n) * 100).toFixed(1)}% 0">${esc(ch)}</span>`).join('')}<div class="glint" aria-hidden="true">${esc(cfg.brand || '')}</div></div>
        <div class="sub"><i></i><span>${esc(cfg.sub || '')}</span><i></i></div>
      </div>
      <div class="intro-title"><div class="tulip">🌷</div><h1>${esc(cfg.title || '')}</h1></div>
      <button class="intro-skip" type="button">Bỏ qua ›</button>`;
    document.body.appendChild(wrap);
    const fx = startParticles(wrap.querySelector('canvas'), cfg.stars || 80, T);
    const timers = [];
    let done = false;
    let startedAt = 0;

    const finish = (reason) => {
      if (done) return;
      done = true;
      timers.forEach(clearTimeout);
      wrap.classList.add('out');
      setTimeout(() => { fx.stop(); wrap.remove(); resolve({ shown: true, reason }); }, reason === 'skip' ? 420 : 650);
    };

    const at = (frac, fn) => timers.push(setTimeout(fn, frac * T));
    const run = () => {
      startedAt = performance.now();
      fx.start();
      wrap.classList.add('p1');
      at(0.12, () => wrap.classList.add('skip-on'));
      at(0.26, () => wrap.classList.add('p1b'));
      at(0.38, () => wrap.classList.add('shine-on'));
      at(0.50, () => { wrap.classList.add('p2'); fx.toPetals(); });
      at(0.60, () => wrap.classList.add('p3'));
      at(0.88, () => finish('ended'));
    };

    wrap.querySelector('.intro-skip').addEventListener('click', (e) => { e.stopPropagation(); finish('skip'); });
    wrap.addEventListener('pointerup', () => { if (startedAt && performance.now() - startedAt > 400) finish('skip'); });

    // điện thoại đang dựng dọc: chờ xoay ngang rồi mới chạy (lúc dọc có màn hình "Xoay ngang" che)
    whenLandscape(() => requestAnimationFrame(run));
  });
}

/** Sao lấp lánh → cánh hoa rơi, vẽ trên canvas. */
function startParticles(canvas, count, T) {
  const ctx = canvas.getContext('2d');
  const colors = AUDIO.tap.colors;
  let W = 0, H = 0, dpr = 1, raf = 0, last = 0, morphAt = Infinity;
  const resize = () => {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = canvas.width = Math.round(innerWidth * dpr);
    H = canvas.height = Math.round(innerHeight * dpr);
  };
  resize();
  window.addEventListener('resize', resize);
  const rnd = (a, b) => a + Math.random() * (b - a);
  const ps = Array.from({ length: count }, () => ({
    x: Math.random(), y: Math.random(), r: rnd(0.5, 2.1), tw: rnd(0, 6.28), sp: rnd(0.6, 1.8),
    star: Math.random() < 0.18 ? '#bfe9ff' : Math.random() < 0.3 ? '#f3c6ff' : '#ffffff',
    petal: colors[(Math.random() * colors.length) | 0], vy: rnd(0.05, 0.16), vx: rnd(-0.02, 0.02), rot: rnd(0, 6.28), vr: rnd(-2, 2),
  }));

  const frame = (now) => {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - (last || now)) / 1000);
    last = now;
    const m = Math.min(1, Math.max(0, (now - morphAt) / (0.22 * T)));
    ctx.clearRect(0, 0, W, H);
    for (const p of ps) {
      const x = p.x * W, y = p.y * H;
      if (m < 1) {
        const a = (0.3 + 0.7 * Math.abs(Math.sin(p.tw + now * p.sp / 520))) * (1 - m);
        const r = p.r * dpr;
        ctx.globalAlpha = a;
        ctx.fillStyle = p.star;
        ctx.beginPath(); ctx.arc(x, y, r, 0, 6.283); ctx.fill();
        if (p.r > 1.7) { // sao lớn có 4 tia
          ctx.fillRect(x - r * 4, y - r * 0.25, r * 8, r * 0.5);
          ctx.fillRect(x - r * 0.25, y - r * 4, r * 0.5, r * 8);
        }
      }
      if (m > 0) {
        p.y += p.vy * dt * m; p.x += (p.vx + Math.sin(now / 700 + p.tw) * 0.012) * dt * m; p.rot += p.vr * dt;
        if (p.y > 1.05) { p.y = -0.05; p.x = Math.random(); }
        ctx.globalAlpha = m * 0.9;
        ctx.fillStyle = p.petal;
        ctx.save(); ctx.translate(x, y); ctx.rotate(p.rot);
        ctx.beginPath(); ctx.ellipse(0, 0, (2.2 + p.r * 1.6) * dpr, (1.3 + p.r) * dpr, 0, 0, 6.283); ctx.fill();
        ctx.restore();
      }
    }
    ctx.globalAlpha = 1;
  };
  return {
    start() { if (!raf) raf = requestAnimationFrame(frame); },
    toPetals() { morphAt = performance.now(); },
    stop() { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); },
  };
}

const PORTRAIT = '(orientation: portrait) and (pointer: coarse)';
function whenLandscape(fn) {
  const mq = window.matchMedia?.(PORTRAIT);
  if (!mq?.matches) { fn(); return; }
  const on = () => { if (!mq.matches) { mq.removeEventListener?.('change', on); fn(); } };
  mq.addEventListener?.('change', on);
}
