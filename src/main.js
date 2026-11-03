// Điểm khởi động game.
import './ui/fonts.js';
import './ui/style.css';
import { Emitter } from './core/events.js';
import { createStage } from './render/stage.js';
import { buildWorld } from './render/world.js';
import { SaveManager } from './save/saveManager.js';
import { Game } from './game.js';
import { Hud } from './ui/hud.js';
import { AuthScreen } from './ui/authScreen.js';
import { formatDuration } from './systems/time.js';
import { isOnlineConfigured, onlineConfigError, initialHash } from './online/supabase.js';
import * as auth from './online/auth.js';
import { CloudSync } from './online/cloudSync.js';
import { SocialManager } from './online/socialManager.js';
import { viError } from './online/errors.js';
import { startUpdateChecks, registerServiceWorker } from './online/updater.js';
import { initNative, isNative, parseAuthUrl, closeExternal } from './online/native.js';
import { GRAPHICS } from '../data/config.js';
import { loadPrefs, MusicPlayer, Sfx } from './audio/audio.js';
import { initTapEffects } from './ui/tapFx.js';
import { playIntro } from './ui/intro.js';

const RECOVERY_FLAG = 'thgm:recovery';

async function boot() {
  // âm thanh + hiệu ứng chạm + intro (chạy song song trong lúc dựng thế giới 3D)
  const audioPrefs = loadPrefs();
  const music = new MusicPlayer(audioPrefs);
  const sfx = new Sfx(audioPrefs);
  initTapEffects({ prefs: audioPrefs, sfx });
  lockLandscape();
  // mở từ link trong email (xác nhận / quên mật khẩu) thì bỏ intro cho nhanh
  const fromAuthLink = /access_token|error|type=/.test(initialHash);
  const introDone = playIntro({ enabled: audioPrefs.intro && !fromAuthLink });

  const emitter = new Emitter();
  const stage = createStage(document.getElementById('game'));
  const world = buildWorld(stage.scene);
  let game = null;

  // Vẽ thế giới ngay (làm nền cho màn hình đăng nhập).
  // Giới hạn khung hình theo mức đồ họa; khi đang mở bảng che màn hình thì vẽ chậm lại cho mát máy.
  let last = performance.now();
  let lastDraw = 0;
  const perf = { frames: 0, since: performance.now(), startAt: performance.now() + 6000 };
  const loop = (t) => {
    requestAnimationFrame(loop);
    const modalOpen = !!document.querySelector('#hud .modal-wrap:not(.hidden)');
    const fpsCap = Math.min(game?.graphics?.fps || 60, modalOpen ? GRAPHICS.modalFps : 60);
    if (fpsCap < 60 && t - lastDraw < 1000 / fpsCap - 2) return;
    lastDraw = t;
    const dt = Math.min((t - last) / 1000, 60 * 60 * 24);
    last = t;
    if (game) game.update(dt);
    stage.renderer.render(stage.scene, stage.camera);
    // đo tốc độ máy (chế độ đồ họa Tự động)
    if (game && t > perf.startAt && !modalOpen && document.visibilityState === 'visible') {
      perf.frames++;
      if (t - perf.since > 4000) {
        const fps = (perf.frames * 1000) / (t - perf.since);
        if (fps < fpsCap * 0.95) game.reportFps(fps);
        perf.frames = 0; perf.since = t;
      }
    } else { perf.frames = 0; perf.since = t; }
  };
  requestAnimationFrame(loop);
  stage.camera.position.set(30, 34, 30);
  stage.camera.lookAt(0, 0, 0);
  hideLoading();
  await introDone;
  music.start();

  // ---------------- tài khoản ----------------
  const authUI = new AuthScreen();
  let session = null;
  let profile = null;
  const hashParams = new URLSearchParams(initialHash.replace(/^#/, ''));
  const notices = [];

  if (onlineConfigError()) notices.push(['⚠️ ' + onlineConfigError(), 'bad']);

  if (isOnlineConfigured()) {
    session = await auth.getSession().catch(() => null);
    if (hashParams.get('error')) {
      await authUI.notice('Không thực hiện được', viError({ message: hashParams.get('error_description') || hashParams.get('error'), code: hashParams.get('error_code') }), 'Đã hiểu', '😥');
    }
    if (/access_token|error|type=/.test(initialHash)) history.replaceState(null, '', location.pathname + location.search);
    let recovery = hashParams.get('type') === 'recovery';
    try { if (sessionStorage.getItem(RECOVERY_FLAG)) { recovery = true; sessionStorage.removeItem(RECOVERY_FLAG); } } catch { /* bỏ qua */ }
    if (session && recovery) {
      await authUI.newPassword();
      notices.push(['🔒 Đã đổi mật khẩu thành công!', 'good']);
    }
    if (!session && auth.getPreferredMode() !== 'guest') {
      const r = await authUI.run();
      session = r.session || null;
    }
    if (session) {
      try {
        profile = await auth.fetchProfile(session.user.id);
      } catch (e) {
        console.warn(e);
      }
      if (!profile) {
        // không đọc được hồ sơ (chưa chạy file SQL hoặc lỗi máy chủ) => chơi khách để không mất gì
        await authUI.notice('Chưa kết nối được dữ liệu', 'Máy chủ chưa sẵn sàng (có thể chưa chạy file SQL cài đặt). Tạm thời bạn sẽ chơi ở chế độ khách, lưu trên máy.', 'Chơi tiếp', '🛠️');
        session = null;
      } else if (!profile.profile_setup_done && !profile.offline) {
        profile = (await authUI.profileEditor(profile, session.user.id, 'setup')) || profile;
      }
    }
  }

  // ---------------- chọn save ----------------
  const uid = session?.user.id;
  const saveMgr = new SaveManager(emitter, uid || 'guest');
  let cloud = null;
  let startSource = 'local';
  if (uid) {
    cloud = new CloudSync({ userId: uid, saveMgr, emitter });
    const r = await cloud.resolveStartup((l, c) => authUI.askConflict(l, c));
    saveMgr.use(r.save, r.isNew && !cloud.adoptedGuest);
    saveMgr.cloud = cloud;
    startSource = r.source;
    if (cloud.adoptedGuest) notices.push(['🌱 Đã chuyển tiến độ chơi thử vào tài khoản của bạn!', 'good']);
    if (r.source === 'cloud') notices.push(['☁️ Đã tải tiến độ từ tài khoản', 'info']);
    if (r.source.endsWith('offline')) notices.push(['📴 Đang ngoại tuyến — tiến độ lưu trên máy và sẽ đồng bộ khi có mạng', 'warn']);
  } else {
    await saveMgr.load();
  }
  const save = saveMgr.save;
  if (profile) {
    save.player.name = profile.display_name;
    save.player.avatar = { ...save.player.avatar, ...profile.avatar };
  }

  // ---------------- vào game ----------------
  game = new Game({ stage, world, saveMgr, emitter });
  game.account = { configured: isOnlineConfigured(), session, profile, cloud, authUI };
  game.audio = { music, sfx, prefs: audioPrefs };
  const hud = new Hud(game, document.getElementById('hud'));

  const off = game.catchUpOffline();
  game.farmView.sync(game.save, true);
  if (off && off.gameMin >= 1) {
    let msg = `Chào mừng trở lại! Đã trôi qua ${formatDuration(off.gameMin)} trong game.`;
    if (off.ready) msg += ` ${off.ready} cây đã nở 🌸`;
    if (off.dead) msg += ` ${off.dead} cây bị héo 🥀`;
    const hit = (off.disasters || []).reduce((a, d) => a + d.hit, 0);
    const sick = (off.outbreaks || []).reduce((a, d) => a + d.infected, 0);
    if (hit) msg += ` Thiên tai làm ${hit} cây bị ảnh hưởng.`;
    if (sick) msg += ` ${sick} cây bị bệnh, hãy phun thuốc 💊.`;
    notices.push([msg, off.dead ? 'warn' : 'info']);
  } else if (saveMgr.isNew) {
    notices.push([profile ? `🌷 Chào mừng ${save.player.name} đến Tiệm Hoa Giấc Mơ!` : "🌷 Chào mừng đến Tiệm Hoa Giấc Mơ!", "good"]);
  }
  notices.forEach(([t, k], i) => setTimeout(() => hud.toast(t, k), 500 + i * 900));

  // xung đột phát sinh khi đang chơi (vd vừa chơi trên máy khác)
  emitter.on('cloud-conflict', async ({ local, cloud: c }) => {
    const choice = await authUI.askConflict(local, c);
    await cloud.resolveConflict(choice);
  });

  saveMgr.startAutosave();
  await saveMgr.saveNow('boot');
  cloud?.start();
  if (session && profile) {
    game.account.social = new SocialManager({ game, emitter, userId: uid });
    game.account.social.start();
  }

  // GĐ9: báo bản cập nhật, chơi khi mất mạng, ứng dụng Android
  if (cloud?.outdated) emitter.emit('update-required', {});
  startUpdateChecks(emitter);
  registerServiceWorker();
  initNative({
    onBack: () => {
      if (document.getElementById('force-update')) return false; // đang bắt cập nhật: nút Back chỉ thu nhỏ app
      if (hud.modal) { hud.closeModal(); return true; }
      if (game.visit) { game.exitVisit(); return true; }
      if (game.decorMode) { game.setDecorMode(false); return true; }
      if (game.selected) { game.select(null); return true; }
      return false;
    },
    onPause: () => saveMgr.saveNow('exit'),
    onAuthUrl: async (url) => {
      const t = parseAuthUrl(url);
      await closeExternal();
      if (t.error) { hud.toast(viError({ message: t.error }), 'warn'); return; }
      if (!t.access_token) return;
      try {
        await auth.setSessionFromTokens(t.access_token, t.refresh_token);
        if (t.type === 'recovery') { try { sessionStorage.setItem(RECOVERY_FLAG, '1'); } catch { /* bỏ qua */ } }
        location.reload();
      } catch (e) { hud.toast(viError(e), 'warn'); }
    },
  });
  if (isNative()) document.body.classList.add('native');

  window.__game = game; // để thử nghiệm trong console trình duyệt
  console.info('Khởi động từ:', startSource);
}

/** Bản cài lên màn hình chính (PWA) / toàn màn hình: thử khóa xoay ngang. Trình duyệt thường không cho thì bỏ qua. */
function lockLandscape() {
  const tryLock = () => { try { screen.orientation?.lock?.('landscape').catch(() => {}); } catch { /* không hỗ trợ */ } };
  if (window.matchMedia?.('(display-mode: standalone), (display-mode: fullscreen)').matches) tryLock();
  window.addEventListener('pointerdown', tryLock, { once: true, passive: true });
}

function hideLoading() {
  const el = document.getElementById('loading');
  el?.classList.add('done');
  setTimeout(() => el?.remove(), 700);
}

boot().catch((e) => {
  console.error(e);
  const t = document.querySelector('.loading-text');
  if (t) t.textContent = 'Có lỗi khi tải game: ' + e.message + '. Hãy thử tải lại trang.';
  else alert('Có lỗi khi tải game: ' + e.message);
});
