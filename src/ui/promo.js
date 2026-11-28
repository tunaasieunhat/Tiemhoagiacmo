// 🎬 Khung quảng cáo bản mới: video giới thiệu, nút ✕ để thoát. Số liệu: data/promo.js
// Đã xem lưu trên máy (localStorage khóa thgm:promo), không nằm trong save.
import { PROMO } from '../../data/promo.js';

const KEY = 'thgm:promo';
const seen = () => { try { return localStorage.getItem(KEY) === PROMO.id; } catch { return true; } };
const markSeen = () => { try { localStorage.setItem(KEY, PROMO.id); } catch { /* bỏ qua */ } };
const base = () => (import.meta.env?.BASE_URL || './');

/** Mở khung video. music: MusicPlayer (tạm dừng nhạc nền trong lúc xem) */
export function openPromo({ music } = {}) {
  if (!PROMO.video || document.getElementById('promo')) return;
  markSeen();
  const el = document.createElement('div');
  el.id = 'promo';
  el.innerHTML = `
    <div class="pr-card" role="dialog" aria-label="Video giới thiệu bản mới">
      <button class="pr-x" data-pr="close" aria-label="Đóng">✕</button>
      <div class="pr-head"><b>${PROMO.title}</b><small>${PROMO.sub}</small></div>
      <video class="pr-video" src="${base()}${PROMO.video}" poster="${base()}${PROMO.poster}" controls playsinline preload="auto"></video>
    </div>`;
  document.body.appendChild(el);
  const v = el.querySelector('video');
  if (music) { music.hold = true; music.el.pause(); }
  const close = () => {
    v.pause(); el.remove();
    if (music) { music.hold = false; music.resume(); }
  };
  el.addEventListener('click', (e) => { if (e.target === el || e.target.closest('[data-pr="close"]')) close(); });
  v.addEventListener('error', close); // không tải được video (vd trang xem thử) ⇒ đóng lặng lẽ
  // thử phát có tiếng; trình duyệt chặn thì phát không tiếng, người chơi bật tiếng bằng thanh điều khiển
  v.play()?.catch(() => { v.muted = true; v.play()?.catch(() => {}); });
}

/** Gọi định kỳ: hiện 1 lần cho mỗi video mới khi game đang rảnh */
export function maybePromo(hud) {
  const g = hud.game;
  if (!PROMO.video || seen() || hud.promoChecked) return;
  if (performance.now() - hud.bootAt < PROMO.delaySeconds * 1000) return;
  if (g.cine || hud.modal || g.visit || g.decorMode || hud.autoBusy) return;
  if (!PROMO.newPlayers && !g.save.tutorial?.done) return;
  if (g.storyTrig?.some((x) => x.via === 'auto')) return; // để cảnh truyện tự chạy chiếu trước
  if (document.querySelector('#minigame, #force-update, #fishing, #cine:not(.hidden), #intro')) return;
  hud.promoChecked = true;
  openPromo({ music: g.audio?.music });
}
