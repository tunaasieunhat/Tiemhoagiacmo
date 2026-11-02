// Điểm khởi động game.
import './ui/style.css';
import { Emitter } from './core/events.js';
import { createStage } from './render/stage.js';
import { buildWorld } from './render/world.js';
import { SaveManager } from './save/saveManager.js';
import { Game } from './game.js';
import { Hud } from './ui/hud.js';
import { formatDuration } from './systems/time.js';

async function boot() {
  const emitter = new Emitter();
  const stage = createStage(document.getElementById('game'));
  const world = buildWorld(stage.scene);

  const saveMgr = new SaveManager(emitter, 'guest');
  await saveMgr.load();

  const game = new Game({ stage, world, saveMgr, emitter });
  const hud = new Hud(game, document.getElementById('hud'));

  // mô phỏng thời gian đã trôi qua khi không chơi
  const off = game.catchUpOffline();
  game.farmView.sync(game.save, true);
  if (off && off.gameMin >= 1) {
    let msg = `Chào mừng trở lại! Đã trôi qua ${formatDuration(off.gameMin)} trong game.`;
    if (off.ready) msg += ` ${off.ready} cây đã nở 🌸`;
    if (off.dead) msg += ` ${off.dead} cây bị héo 🥀`;
    setTimeout(() => hud.toast(msg, off.dead ? 'warn' : 'info'), 600);
  } else if (saveMgr.isNew) {
    setTimeout(() => hud.toast('🌷 Chào mừng đến Tiệm Hoa Giấc Mơ!', 'good'), 600);
  }

  saveMgr.startAutosave();
  await saveMgr.saveNow('boot');

  let last = performance.now();
  const loop = (t) => {
    const dt = Math.min((t - last) / 1000, 60 * 60 * 24);
    last = t;
    game.update(dt);
    stage.renderer.render(stage.scene, stage.camera);
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);

  document.getElementById('loading').classList.add('done');
  setTimeout(() => document.getElementById('loading')?.remove(), 700);

  // để thử nghiệm trong console trình duyệt
  window.__game = game;
}

boot().catch((e) => {
  console.error(e);
  const t = document.querySelector('.loading-text');
  if (t) t.textContent = 'Có lỗi khi tải game: ' + e.message + '. Hãy thử tải lại trang.';
});
