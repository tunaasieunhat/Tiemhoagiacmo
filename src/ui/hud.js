// Giao diện HTML phủ lên trên 3D: thanh trên, thanh công cụ, bảng ô đất, kho đồ, cài đặt, thông báo.
import { FLOWERS, FLOWER_IDS } from '../../data/flowers.js';
import { CARE, DEV_TOOLS } from '../../data/config.js';
import * as auth from '../online/auth.js';
import * as farming from '../systems/farming.js';
import { formatClock, periodName, isNight, formatDuration } from '../systems/time.js';
import { avatarSVG } from './avatar.js';
import { TUTORIAL } from '../game.js';
import { GAME_VERSION, GAME_STAGE } from '../version.js';

const TOOLS = [
  { id: 'hand', icon: '✋', label: 'Xem' },
  { id: 'till', icon: '🪏', label: 'Xới' },
  { id: 'plant', icon: '🌱', label: 'Gieo' },
  { id: 'water', icon: '💧', label: 'Tưới' },
  { id: 'fertilize', icon: '🧪', label: 'Bón' },
  { id: 'harvest', icon: '🧺', label: 'Thu' },
];
const ACTION_LABEL = {
  till: ['🪏', 'Xới đất'], plant: ['🌱', 'Gieo hạt'], water: ['💧', 'Tưới nước'], fertilize: ['🧪', 'Bón phân'], harvest: ['🧺', 'Thu hoạch'],
};

const $ = (sel, el = document) => el.querySelector(sel);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export class Hud {
  constructor(game, root) {
    this.game = game;
    this.root = root;
    this.render();
    const em = game.emitter;
    em.on('clock', (c) => this.updateClock(c));
    em.on('tool', () => this.updateToolbar());
    em.on('select', (p) => this.showTile(p));
    em.on('refresh', () => { this.updateTilePanel(); });
    em.on('inventory', () => { this.updateToolbar(); this.updateProfile(); if (this.modal === 'inventory') this.openInventory(); });
    em.on('toast', (t) => this.toast(t.text, t.type));
    em.on('float', (f) => this.floatText(f));
    em.on('tutorial', () => this.updateTutorial());
    em.on('saved', (s) => this.flashSaved(s));
    em.on('sync', (s) => this.updateSync(s));
    this.updateClock(game.clock);
    this.updateToolbar();
    this.updateProfile();
    this.updateTutorial();
    this.updateSync({ status: game.account?.cloud?.status });
  }

  render() {
    this.root.innerHTML = `
      <div class="topbar">
        <button class="chip profile" data-act="settings" aria-label="Hồ sơ">
          <span class="avatar"></span><span class="sync-dot hidden" title=""></span>
          <span class="pinfo"><b class="pname"></b><small class="plevel"></small></span>
        </button>
        <div class="chip clock">
          <span class="clock-icon">☀️</span>
          <span class="cinfo"><b class="ctime">06:00</b><small class="cday">Ngày 1</small></span>
        </div>
        <div class="top-actions">
          <button class="round" data-act="inventory" aria-label="Kho đồ">🎒</button>
          <button class="round" data-act="settings" aria-label="Cài đặt">⚙️</button>
        </div>
      </div>
      <div class="saved-badge">💾 Đã lưu</div>
      <div class="zoom-btns">
        <button class="round sm" data-act="zoom-in" aria-label="Phóng to">＋</button>
        <button class="round sm" data-act="zoom-out" aria-label="Thu nhỏ">－</button>
      </div>
      <div class="toasts"></div>
      <div class="floaters"></div>
      <div class="bottom">
        <div class="seedbar hidden"></div>
        <div class="toolbar">${TOOLS.map((t) => `
          <button class="tool" data-tool="${t.id}"><span class="ti">${t.icon}</span><span class="tl">${t.label}</span><span class="badge hidden"></span></button>`).join('')}
        </div>
      </div>
      <div class="tutorial hidden"></div>
      <div class="sheet tile-panel hidden"></div>
      <div class="modal-wrap hidden"><div class="modal"></div></div>
    `;
    this.root.addEventListener('click', (e) => this.onClick(e));
    this.root.addEventListener('change', (e) => this.onChange(e));
  }

  onClick(e) {
    const b = e.target.closest('[data-act],[data-tool],[data-seed],[data-do]');
    if (!b) {
      if (e.target.classList.contains('modal-wrap')) this.closeModal();
      return;
    }
    const g = this.game;
    if (b.dataset.tool) { g.setTool(b.dataset.tool); return; }
    if (b.dataset.seed) { g.setSeed(b.dataset.seed); if (b.dataset.do) this.doAction('plant', b.dataset.seed); this.updateSeedbar(); return; }
    if (b.dataset.do) { this.doAction(b.dataset.do); return; }
    switch (b.dataset.act) {
      case 'inventory': this.openInventory(); break;
      case 'settings': this.openSettings(); break;
      case 'close-modal': this.closeModal(); break;
      case 'close-tile': g.select(null); break;
      case 'zoom-in': g.controls.zoomBy(1.25); break;
      case 'zoom-out': g.controls.zoomBy(0.8); break;
      case 'free-seeds': g.claimFreeSeeds(); break;
      case 'ff1': g.fastForward(1); break;
      case 'ff6': g.fastForward(6); break;
      case 'save-now': g.saveMgr.saveNow('manual'); break;
      case 'reset':
        // bấm 2 lần để xác nhận (không dùng confirm() vì một số trình duyệt nhúng chặn hộp thoại)
        if (b.dataset.armed) { g.saveMgr.reset().then(() => location.reload()); }
        else { b.dataset.armed = '1'; b.textContent = '⚠️ Bấm lần nữa để xóa hết'; setTimeout(() => { delete b.dataset.armed; b.textContent = '🗑️ Chơi lại từ đầu'; }, 3000); }
        break;
      case 'tut-skip': g.save.tutorial.done = true; this.updateTutorial(); break;
      case 'login': this.login(); break;
      case 'logout': this.logout(b); break;
      case 'edit-profile': this.editProfile(); break;
      case 'sync-now': g.saveMgr.saveNow('manual'); break;
      case 'copy-code': {
        const code = g.account?.profile?.friend_code || '';
        navigator.clipboard?.writeText(code).then(() => this.toast('📋 Đã chép mã kết bạn', 'good'), () => this.toast(`Mã kết bạn: ${code}`, 'info'));
        break;
      }
      default:
    }
  }

  onChange(e) {
    const g = this.game;
    if (e.target.name === 'pname' && !g.account?.session) {
      const name = e.target.value.replace(/\s+/g, ' ').trim().slice(0, 20);
      if (name.length >= 2) { g.save.player.name = name; g.saveMgr.markDirty(); this.updateProfile(); }
    }
    if (e.target.name === 'shadows') g.setShadows(e.target.checked);
  }

  doAction(action, seed) {
    const g = this.game;
    if (!g.selected) return;
    g.requestAction(g.selected, action, { seed: seed || g.seed });
  }

  // ---------- thanh trên ----------
  updateProfile() {
    const p = this.game.save.player;
    $('.avatar', this.root).innerHTML = avatarSVG(p.avatar, 40);
    $('.pname', this.root).textContent = p.name;
    $('.plevel', this.root).textContent = `Lv ${p.level} · 💰 ${p.coins}`;
  }

  updateClock(c) {
    $('.ctime', this.root).textContent = formatClock(this.game.now);
    $('.cday', this.root).textContent = `Ngày ${c.day} · ${periodName(c.hourFloat)}`;
    const icon = isNight(c.hourFloat) ? '🌙' : c.hourFloat < 7 || c.hourFloat > 17.5 ? '🌅' : '☀️';
    $('.clock-icon', this.root).textContent = icon;
  }

  flashSaved(s) {
    if (s.reason === 'auto' || s.reason === 'boot') return;
    const b = $('.saved-badge', this.root);
    b.classList.add('show');
    clearTimeout(this.savedT);
    this.savedT = setTimeout(() => b.classList.remove('show'), 1400);
  }

  // ---------- thanh công cụ ----------
  updateToolbar() {
    const g = this.game;
    this.root.querySelectorAll('.tool').forEach((b) => {
      b.classList.toggle('active', b.dataset.tool === g.tool);
      const badge = $('.badge', b);
      let n = null;
      if (b.dataset.tool === 'plant') n = g.save.inventory.seeds[g.seed] || 0;
      if (b.dataset.tool === 'fertilize') n = g.save.inventory.items.fertilizer || 0;
      badge.classList.toggle('hidden', n === null);
      if (n !== null) badge.textContent = n;
      if (b.dataset.tool === 'plant') $('.ti', b).textContent = g.tool === 'plant' ? FLOWERS[g.seed].icon : '🌱';
    });
    this.updateSeedbar();
  }

  updateSeedbar() {
    const g = this.game;
    const bar = $('.seedbar', this.root);
    bar.classList.toggle('hidden', g.tool !== 'plant');
    if (g.tool !== 'plant') return;
    bar.innerHTML = FLOWER_IDS.map((id) => {
      const f = FLOWERS[id];
      const n = g.save.inventory.seeds[id] || 0;
      return `<button class="seed ${g.seed === id ? 'active' : ''} ${n ? '' : 'empty'}" data-seed="${id}">
        <span>${f.icon}</span><small>${f.name}</small><b>${n}</b></button>`;
    }).join('');
  }

  updateTutorial() {
    const tu = this.game.save.tutorial;
    const el = $('.tutorial', this.root);
    if (tu.done || !TUTORIAL[tu.step]) { el.classList.add('hidden'); return; }
    el.classList.remove('hidden');
    el.innerHTML = `<span class="tstep">${tu.step + 1}/${TUTORIAL.length}</span><span>${TUTORIAL[tu.step].text}</span><button data-act="tut-skip" aria-label="Bỏ qua">✕</button>`;
  }

  // ---------- bảng thông tin ô đất ----------
  showTile(pick) {
    const el = $('.tile-panel', this.root);
    el.classList.toggle('hidden', !pick);
    this.lastPanelHtml = '';
    if (pick) this.updateTilePanel();
  }

  updateTilePanel() {
    const g = this.game;
    const el = $('.tile-panel', this.root);
    if (!g.selected || g.tool !== 'hand' || el.classList.contains('hidden')) return;
    const tile = g.getTile(g.selected);
    if (!tile) return;
    const html = this.tileHtml(tile);
    if (html !== this.lastPanelHtml) { el.innerHTML = html; this.lastPanelHtml = html; }
  }

  tileHtml(tile) {
    const g = this.game;
    const def = tile.flower ? FLOWERS[tile.flower] : null;
    let title, status = '', icon;
    switch (tile.state) {
      case 'untilled': icon = '🟫'; title = 'Đất chưa xới'; status = 'Dùng xẻng để xới đất trước khi gieo hạt.'; break;
      case 'tilled': icon = '🟤'; title = 'Đất đã xới'; status = tile.water > 0.02 ? 'Đất ẩm, sẵn sàng gieo hạt.' : 'Sẵn sàng gieo hạt.'; break;
      case 'growing': icon = def.icon; title = def.name; status = `${farming.STAGE_NAMES[farming.stageOf(tile)]} · còn ${formatDuration(farming.remainingMinutes(tile))}${tile.water <= 0.001 ? ' (đang ngừng lớn vì khô!)' : ''}`; break;
      case 'ready': icon = def.icon; title = def.name; status = '✨ Hoa đã nở, thu hoạch thôi!'; break;
      case 'dead': icon = '🥀'; title = `${def.name} (héo khô)`; status = 'Cây chết vì thiếu nước. Dùng xẻng để dọn.'; break;
      default: icon = '?'; title = '';
    }
    const bars = [];
    if (['growing', 'ready'].includes(tile.state)) {
      bars.push(bar('🌱 Lớn', farming.progressOf(tile), '#8fd18b'));
      bars.push(bar('💧 Nước', tile.water, tile.water < CARE.thirstyBelow ? '#f29a8a' : '#6fbbe8'));
      bars.push(bar('❤️ Sức khỏe', tile.health / 100, tile.health < CARE.wiltBelow ? '#f29a8a' : '#f6a6b9'));
      bars.push(`<div class="kv"><span>🧪 Phân bón</span><b>${tile.fert}/${def.fertilizerNeeded}</b></div>`);
      bars.push(`<div class="kv"><span>⭐ Chất lượng dự kiến</span><b class="stars">${'★'.repeat(farming.qualityOf(tile))}${'☆'.repeat(3 - farming.qualityOf(tile))}</b></div>`);
      bars.push(`<div class="hint">Cần tưới ${def.waterPerDay} lần/ngày · ${def.growHours} giờ để nở · Ý nghĩa: ${esc(def.meaning)}</div>`);
    } else if (tile.state === 'tilled') {
      bars.push(bar('💧 Độ ẩm', tile.water, '#6fbbe8'));
    }

    const actions = farming.availableActions(tile).map((a) => {
      if (a === 'plant') {
        return `<div class="seed-row">${FLOWER_IDS.map((id) => {
          const n = g.save.inventory.seeds[id] || 0;
          return `<button class="btn seedbtn ${n ? '' : 'disabled'}" data-seed="${id}" data-do="plant">${FLOWERS[id].icon} ${FLOWERS[id].name} <b>×${n}</b></button>`;
        }).join('')}</div>`;
      }
      let disabled = false;
      if (a === 'fertilize') disabled = !farming.canFertilize(tile) || !(g.save.inventory.items.fertilizer > 0);
      if (a === 'water') disabled = tile.water >= 0.9;
      const [ic, lb] = ACTION_LABEL[a];
      const label = a === 'till' && tile.state === 'dead' ? 'Dọn & xới' : lb;
      return `<button class="btn primary ${disabled ? 'disabled' : ''}" data-do="${a}">${ic} ${label}</button>`;
    }).join('');

    return `
      <div class="sheet-head"><span class="big">${icon}</span><div><b>${esc(title)}</b><small>${status}</small></div>
        <button class="round sm" data-act="close-tile" aria-label="Đóng">✕</button></div>
      <div class="bars">${bars.join('')}</div>
      <div class="actions">${actions}</div>`;
  }

  // ---------- kho đồ ----------
  openInventory() {
    const s = this.game.save;
    const seeds = FLOWER_IDS.map((id) => `<div class="cell"><span>${FLOWERS[id].icon}</span><small>Hạt ${FLOWERS[id].name}</small><b>×${s.inventory.seeds[id] || 0}</b></div>`).join('');
    const flowers = Object.entries(s.inventory.flowers).filter(([, n]) => n > 0).map(([k, n]) => {
      const [id, q] = k.split('|');
      return `<div class="cell"><span>${FLOWERS[id]?.icon ?? '🌼'}</span><small>${FLOWERS[id]?.name ?? id} <i class="stars">${'★'.repeat(+q)}</i></small><b>×${n}</b></div>`;
    }).join('') || '<p class="muted">Chưa có hoa nào. Hãy trồng và thu hoạch nhé!</p>';
    this.openModal('inventory', `
      <h2>🎒 Kho đồ</h2>
      <h3>Hoa đã thu hoạch</h3><div class="grid">${flowers}</div>
      <h3>Hạt giống</h3><div class="grid">${seeds}</div>
      <h3>Vật phẩm & dụng cụ</h3><div class="grid">
        <div class="cell"><span>🧪</span><small>Phân bón</small><b>×${s.inventory.items.fertilizer || 0}</b></div>
        <div class="cell"><span>🪏</span><small>Xẻng</small><b>${s.tools.shovel ? '✔' : '—'}</b></div>
        <div class="cell"><span>🚿</span><small>Bình tưới</small><b>${s.tools.wateringCan ? '✔' : '—'}</b></div>
      </div>
      ${DEV_TOOLS ? '<button class="btn primary wide" data-act="free-seeds">🎁 Nhận gói hạt giống miễn phí (1 lần/ngày game)</button>' : ''}
      <p class="muted small">Cửa hàng hạt giống sẽ mở ở Giai đoạn 4. Bán hoa ở Tiệm Hoa từ Giai đoạn 3.</p>
    `);
  }

  openSettings() {
    const g = this.game;
    const s = g.save;
    const acc = g.account || {};
    const last = new Date(s.meta.updatedAt).toLocaleTimeString('vi-VN');
    let account;
    if (acc.session && acc.profile) {
      account = `
      <div class="profile-edit">${avatarSVG(s.player.avatar, 64)}
        <div class="acc-info"><b>${esc(acc.profile.display_name)}</b><small>${esc(acc.session.user.email || '')}</small>
          <small>Mã kết bạn: <b class="code">${esc(acc.profile.friend_code)}</b> <button class="link" data-act="copy-code">Chép</button></small></div></div>
      <p class="sync-line">${this.syncText()}</p>
      <div class="row-btns">
        <button class="btn" data-act="edit-profile">✏️ Đổi tên & avatar</button>
        <button class="btn" data-act="sync-now">☁️ Đồng bộ ngay</button>
        <button class="btn" data-act="logout">🚪 Đăng xuất</button>
      </div>`;
    } else {
      account = `
      <div class="profile-edit">${avatarSVG(s.player.avatar, 64)}
        <label>Tên hiển thị<input name="pname" maxlength="20" value="${esc(s.player.name)}"></label></div>
      ${acc.configured
        ? '<p class="muted small">Bạn đang chơi khách — tiến độ chỉ lưu trên máy này.</p><button class="btn primary wide" data-act="login">🔐 Đăng nhập / Đăng ký để lưu lên mạng</button>'
        : '<p class="muted small">Chế độ ngoại tuyến: game chưa được kết nối máy chủ (Supabase), tiến độ lưu trên máy này.</p>'}`;
    }
    this.openModal('settings', `
      <h2>⚙️ Cài đặt</h2>
      ${account}
      <label class="row"><input type="checkbox" name="shadows" ${s.settings.shadows !== false ? 'checked' : ''}> Đổ bóng (tắt nếu máy chậm)</label>
      <p class="muted small">Đã lưu trên máy lúc ${last}.</p>
      ${DEV_TOOLS ? `<h3>🧪 Công cụ thử nghiệm</h3>
      <div class="row-btns">
        <button class="btn" data-act="ff1">⏩ Tua 1 giờ</button>
        <button class="btn" data-act="ff6">⏩ Tua 6 giờ</button>
        <button class="btn danger" data-act="reset">🗑️ Chơi lại từ đầu</button>
      </div>` : ''}
      <p class="muted small">Điều khiển: kéo để di chuyển bản đồ · cuộn chuột hoặc chụm 2 ngón để phóng to/thu nhỏ · máy tính có thể dùng phím W A S D.</p>
      <p class="muted small">Tiệm Hoa Giấc Mơ · phiên bản ${GAME_VERSION} (${GAME_STAGE})</p>
    `);
  }

  // ---------- tài khoản ----------
  syncText() {
    const c = this.game.account?.cloud;
    if (!c) return '';
    const at = c.lastSyncAt ? ` lúc ${new Date(c.lastSyncAt).toLocaleTimeString('vi-VN')}` : '';
    return {
      synced: `☁️ Đã đồng bộ lên mạng${at}`,
      pending: '🕒 Có thay đổi chờ đồng bộ',
      syncing: '🔄 Đang đồng bộ...',
      offline: '📴 Đang ngoại tuyến — sẽ tự đồng bộ khi có mạng',
      error: '⚠️ Đồng bộ lỗi, sẽ thử lại',
      conflict: '🔀 Có xung đột giữa 2 máy, hãy chọn bản muốn giữ',
    }[c.status] || '';
  }

  updateSync(s) {
    const dot = $('.sync-dot', this.root);
    if (!this.game.account?.cloud) { dot.classList.add('hidden'); return; }
    dot.className = `sync-dot ${s?.status || ''}`;
    dot.title = this.syncText();
    const line = $('.sync-line', this.root);
    if (line) line.textContent = this.syncText();
  }

  async login() {
    const ui = this.game.account.authUI;
    this.closeModal();
    await this.game.saveMgr.saveNow('manual');
    const r = await ui.run();
    if (r.session) location.reload();
  }

  async logout(btn) {
    const g = this.game;
    if (!btn.dataset.armed) {
      btn.dataset.armed = '1';
      btn.textContent = g.account.cloud?.hasPending ? '⚠️ Chưa đồng bộ xong! Bấm lần nữa để vẫn đăng xuất' : 'Bấm lần nữa để đăng xuất';
      setTimeout(() => { delete btn.dataset.armed; btn.textContent = '🚪 Đăng xuất'; }, 3500);
      return;
    }
    btn.disabled = true;
    await g.saveMgr.saveNow('manual');
    await g.account.cloud?.push().catch(() => {});
    await auth.signOut();
    auth.setPreferredMode(null);
    location.reload();
  }

  async editProfile() {
    const g = this.game;
    const acc = g.account;
    this.closeModal();
    const p = await acc.authUI.profileEditor(acc.profile, acc.session.user.id, 'edit');
    if (!p) return;
    acc.profile = p;
    g.save.player.name = p.display_name;
    g.save.player.avatar = { ...g.save.player.avatar, ...p.avatar };
    g.player.setAvatar(g.save.player.avatar);
    g.saveMgr.markDirty?.();
    this.updateProfile();
    this.toast('✨ Đã cập nhật nhân vật', 'good');
  }

  openModal(name, html) {
    this.modal = name;
    const wrap = $('.modal-wrap', this.root);
    $('.modal', wrap).innerHTML = `<button class="round sm close" data-act="close-modal" aria-label="Đóng">✕</button>${html}`;
    wrap.classList.remove('hidden');
  }

  closeModal() {
    this.modal = null;
    $('.modal-wrap', this.root).classList.add('hidden');
  }

  // ---------- thông báo ----------
  toast(text, type = 'info') {
    const box = $('.toasts', this.root);
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.textContent = text;
    box.appendChild(t);
    while (box.children.length > 3) box.firstChild.remove();
    setTimeout(() => t.classList.add('out'), 2600);
    setTimeout(() => t.remove(), 3100);
  }

  floatText({ pos, text, small }) {
    const p = this.game.toScreen(pos);
    const el = document.createElement('div');
    el.className = `floater ${small ? 'small' : ''}`;
    el.textContent = text;
    el.style.left = `${p.x}px`;
    el.style.top = `${p.y}px`;
    $('.floaters', this.root).appendChild(el);
    setTimeout(() => el.remove(), 1400);
  }
}

function bar(label, v, color) {
  const pct = Math.round(Math.max(0, Math.min(1, v)) * 100);
  return `<div class="bar"><span>${label}</span><div class="track"><i style="width:${pct}%;background:${color}"></i></div><b>${pct}%</b></div>`;
}
