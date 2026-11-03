// Video intro khi mở game (file ở public/, cấu hình ở data/audio.js → AUDIO.intro).
// Trình duyệt thường chặn tự phát video có tiếng ⇒ khi bị chặn thì hiện "Chạm để bắt đầu".
// Trả về Promise xong khi video hết / bị bỏ qua / không tải được.
import { AUDIO } from '../../data/audio.js';

export function playIntro({ enabled = true } = {}) {
  const cfg = AUDIO.intro;
  if (!enabled || !cfg.file) return Promise.resolve({ shown: false });

  return new Promise((resolve) => {
    const wrap = document.createElement('div');
    wrap.id = 'intro';
    wrap.style.background = cfg.background;
    wrap.innerHTML = `
      <video playsinline webkit-playsinline preload="auto"></video>
      <button class="intro-skip hidden" type="button">Bỏ qua ›</button>
      <div class="intro-tap hidden"><span>🌷</span><b>Chạm để bắt đầu</b></div>`;
    document.body.appendChild(wrap);
    const video = wrap.querySelector('video');
    const skip = wrap.querySelector('.intro-skip');
    const tapHint = wrap.querySelector('.intro-tap');
    let done = false;
    let playing = false;

    const finish = (reason) => {
      if (done) return;
      done = true;
      clearTimeout(waitTimer);
      try { video.pause(); } catch { /* bỏ qua */ }
      wrap.classList.add('out');
      setTimeout(() => { wrap.remove(); }, 450);
      resolve({ shown: true, reason });
    };

    const tryPlay = () => {
      video.muted = false;
      const p = video.play();
      if (!p?.then) return;
      p.then(() => { tapHint.classList.add('hidden'); })
        .catch((err) => {
          if (err?.name === 'NotAllowedError') {
            // chưa được phép phát tiếng: chờ người chơi chạm
            clearTimeout(waitTimer);
            tapHint.classList.remove('hidden');
          } else finish('error');
        });
    };

    video.addEventListener('playing', () => {
      if (playing) return;
      playing = true;
      clearTimeout(waitTimer);
      setTimeout(() => skip.classList.remove('hidden'), cfg.showSkipAfter * 1000);
    });
    video.addEventListener('ended', () => finish('ended'));
    video.addEventListener('error', () => finish('error'));
    skip.addEventListener('click', (e) => { e.stopPropagation(); finish('skip'); });
    wrap.addEventListener('pointerup', (e) => {
      if (e.target === skip) return;
      if (!tapHint.classList.contains('hidden')) tryPlay();
    });

    // không tải được video sau một lúc => vào game luôn
    let waitTimer = 0;
    video.src = cfg.file;
    // điện thoại đang dựng dọc: đợi xoay ngang rồi mới phát (lúc dọc có màn hình "Xoay ngang" che)
    whenLandscape(() => {
      waitTimer = setTimeout(() => finish('timeout'), cfg.maxWaitSeconds * 1000);
      tryPlay();
    });
  });
}

const PORTRAIT = '(orientation: portrait) and (pointer: coarse)';
function whenLandscape(fn) {
  const mq = window.matchMedia?.(PORTRAIT);
  if (!mq?.matches) { fn(); return; }
  const on = () => { if (!mq.matches) { mq.removeEventListener?.('change', on); fn(); } };
  mq.addEventListener?.('change', on);
}
