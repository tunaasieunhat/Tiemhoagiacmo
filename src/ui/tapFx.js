// Hiệu ứng khi chạm: vòng sáng + cánh hoa bung ra ở chỗ chạm, kèm tiếng "tách" khi chạm nút
// hoặc chạm (không kéo) vào nông trại. Số liệu ở data/audio.js (AUDIO.tap).
import { AUDIO } from '../../data/audio.js';

const BUTTONISH = 'button, a, [data-act], .tool, label, select, input[type=checkbox], input[type=radio]';
const MAX_ALIVE = 14;

export function initTapEffects({ prefs, sfx }) {
  let alive = 0;
  let down = null;

  const burst = (x, y) => {
    if (!prefs.tapFx || alive >= MAX_ALIVE) return;
    alive++;
    const el = document.createElement('div');
    el.className = 'tapfx';
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    const { petals, spreadPx, colors } = AUDIO.tap;
    let html = '<i class="ring"></i>';
    const start = Math.random() * 360;
    for (let i = 0; i < petals; i++) {
      const a = ((start + (360 / petals) * i + (Math.random() - 0.5) * 24) * Math.PI) / 180;
      const d = spreadPx * (0.7 + Math.random() * 0.5);
      const c = colors[(Math.random() * colors.length) | 0];
      html += `<i class="petal" style="--dx:${(Math.cos(a) * d).toFixed(1)}px;--dy:${(Math.sin(a) * d).toFixed(1)}px;--r:${Math.round(Math.random() * 360)}deg;--c:${c}"></i>`;
    }
    el.innerHTML = html;
    document.body.appendChild(el);
    setTimeout(() => { el.remove(); alive--; }, 720);
  };

  window.addEventListener('pointerdown', (e) => {
    if (e.button > 0) return;
    burst(e.clientX, e.clientY);
    const t = e.target;
    if (t?.closest?.('#intro')) return;
    if (t?.closest?.(BUTTONISH)) sfx.tap(1);
    else if (t?.closest?.('#game')) down = { x: e.clientX, y: e.clientY, at: performance.now(), id: e.pointerId };
    else sfx.ensure(); // mở khóa âm thanh cho lần sau
  }, { capture: true, passive: true });

  // chạm vào nông trại: chỉ kêu khi là cú chạm ngắn (không phải kéo bản đồ)
  window.addEventListener('pointerup', (e) => {
    if (!down || e.pointerId !== down.id) return;
    const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
    if (moved < 10 && performance.now() - down.at < 350) sfx.tap(0.7);
    down = null;
  }, { capture: true, passive: true });
}
