// Giao diện HTML phủ lên trên 3D: thanh trên, thanh công cụ, bảng ô đất, kho đồ, cài đặt, thông báo.
import { FLOWERS, FLOWER_IDS } from '../../data/flowers.js';
import { CARE, DEV_TOOLS, GRAPHICS } from '../../data/config.js';
import * as auth from '../online/auth.js';
import * as farming from '../systems/farming.js';
import { formatClock, periodName, isNight, formatDuration } from '../systems/time.js';
import { avatarSVG } from './avatar.js';
import { TUTORIAL } from '../game.js';
import { ShopPanel } from './shopPanel.js';
import { MarketPanel } from './marketPanel.js';
import { LabPanel } from './labPanel.js';
import { FriendsPanel, messagesHtml } from './friendsPanel.js';
import { QuestsPanel } from './questsPanel.js';
import { RankPanel } from './rankPanel.js';
import { claimableCount } from '../systems/quests.js';
import { DECOR, DECOR_SLOTS } from '../../data/decor.js';
import { social } from '../online/social.js';
import { viError } from '../online/errors.js';
import { isCleanText } from '../online/names.js';
import { NotebookPanel } from './notebookPanel.js';
import * as variants from '../systems/variants.js';
import { REGULARS } from '../../data/regulars.js';
import { levelProgress } from '../systems/progression.js';
import { waterCapacity } from '../systems/farming.js';
import * as calendar from '../systems/calendar.js';
import { protectUntil, isProtected } from '../systems/weather.js';
import { WEATHER, DISEASES, PROTECTION, SEASONS } from '../../data/seasons.js';
import { PAPERS, RIBBONS } from '../../data/wrapping.js';
import { wholesalePrice, tierInfo } from '../systems/shop.js';
import { ZONES, PLOT_SLOTS } from '../render/world.js';
import { GAME_VERSION, GAME_STAGE } from '../version.js';

const TOOLS = [
  { id: 'hand', icon: '✋', label: 'Xem' },
  { id: 'till', icon: '🪏', label: 'Xới' },
  { id: 'plant', icon: '🌱', label: 'Gieo' },
  { id: 'water', icon: '💧', label: 'Tưới' },
  { id: 'fertilize', icon: '🧪', label: 'Bón' },
  { id: 'harvest', icon: '🧺', label: 'Thu' },
  { id: 'treat', icon: '💊', label: 'Thuốc' },
];
const ACTION_LABEL = {
  till: ['🪏', 'Xới đất'], plant: ['🌱', 'Gieo hạt'], water: ['💧', 'Tưới nước'], fertilize: ['🧪', 'Bón phân'], harvest: ['🧺', 'Thu hoạch'], treat: ['💊', 'Phun thuốc'],
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
    em.on('refresh', () => {
      this.updateTilePanel();
      if (this.modal === 'shop') this.shopPanel.refresh();
      if (this.modal === 'lab') this.lab.refresh();
      this.updateLabBadge();
    });
    em.on('inventory', () => {
      this.updateToolbar(); this.updateProfile();
      if (this.modal === 'inventory') this.openInventory();
      if (this.modal === 'market') this.marketPanel.render(true);
    });
    em.on('toast', (t) => this.toast(t.text, t.type));
    em.on('float', (f) => this.floatText(f));
    em.on('tutorial', () => this.updateTutorial());
    em.on('shop', () => { this.updateWallet(); if (this.modal === 'shop') this.shopPanel.refresh(); });
    em.on('open-shop', ({ customerId }) => this.openShop(customerId));
    em.on('open-market', ({ tab }) => this.openMarket(tab));
    em.on('open-lab', () => this.openLab());
    em.on('lab', () => { this.updateLabBadge(); if (this.modal === 'lab') this.lab.render(); });
    em.on('book', () => { if (this.modal === 'notebook') this.notebook.render(); });
    em.on('regular-story', (st) => this.showStory(st));
    em.on('social', () => this.updateFriendBadge());
    em.on('visit', (v) => this.updateVisit(v));
    em.on('update-available', (v) => this.showUpdate(v, false));
    em.on('update-required', (v) => this.showUpdate(v, true));
    em.on('quests', () => { this.updateQuestBadge(); if (this.modal === 'quests') this.quests.render(); });
    em.on('decor-mode', (on) => { this.root.classList.toggle('decorating', on); $('.decor-bar', this.root).classList.toggle('hidden', !on); });
    em.on('decor-slot', (slot) => this.openDecorSlot(slot));
    em.on('xp', () => this.updateWallet());
    em.on('levelup', (ups) => this.showLevelUp(ups));
    em.on('weather', () => { this.updateAlert(); this.updateClock(this.game.clock); if (this.modal === 'forecast') this.openForecast(); });
    em.on('saved', (s) => this.flashSaved(s));
    em.on('sync', (s) => this.updateSync(s));
    this.updateClock(game.clock);
    this.updateToolbar();
    this.updateProfile();
    this.updateTutorial();
    this.updateSync({ status: game.account?.cloud?.status });
    this.shopPanel = new ShopPanel(this);
    this.marketPanel = new MarketPanel(this);
    this.lab = new LabPanel(this);
    this.notebook = new NotebookPanel(this);
    this.friends = new FriendsPanel(this);
    this.quests = new QuestsPanel(this);
    this.rank = new RankPanel(this);
    this.updateQuestBadge();
    this.updateAlert();
    this.updateWallet();
  }

  render() {
    this.root.innerHTML = `
      <div class="topbar">
        <button class="chip profile" data-act="settings" aria-label="Hồ sơ">
          <span class="avatar"></span><span class="sync-dot hidden" title=""></span>
          <span class="pinfo"><b class="pname"></b><small class="plevel"></small></span>
        </button>
        <button class="chip clock" data-act="forecast" aria-label="Lịch và dự báo thời tiết">
          <span class="clock-icon">☀️</span>
          <span class="cinfo"><b class="ctime">06:00</b><small class="cday">Ngày 1</small></span>
        </button>
        <div class="top-actions">
          <button class="round" data-act="notebook" aria-label="Sổ tay thực vật">📖</button>
          <button class="round" data-act="inventory" aria-label="Kho đồ">🎒</button>
          <button class="round" data-act="settings" aria-label="Cài đặt">⚙️</button>
        </div>
      </div>
      <div class="wallet">
        <span class="wchip lvchip" title="Cấp độ">⭐ <b class="w-lv">1</b><span class="xpbar"><i></i></span></span>
        <span class="wchip" title="Tiền">💰 <b class="w-coins">0</b></span>
        <span class="wchip" title="Uy tín">💗 <b class="w-rep">0</b><small class="w-tier"></small></span>
      </div>
      <div class="nav-btns">
        <button class="round" data-act="go-farm" aria-label="Về nông trại">🌱</button>
        <button class="round" data-act="go-shop" aria-label="Tiệm hoa">🏪<span class="badge hidden nav-badge"></span></button>
        <button class="round" data-act="go-market" aria-label="Khu chợ">🧺</button>
        <button class="round" data-act="go-lab" aria-label="Nhà lai tạo">🧬<span class="badge hidden lab-badge">✓</span></button>
        <button class="round" data-act="friends" aria-label="Bạn bè">👥<span class="badge hidden fr-badge"></span></button>
        <button class="round" data-act="quests" aria-label="Nhiệm vụ">📋<span class="badge hidden q-badge"></span></button>
        <button class="round" data-act="rank" aria-label="Xếp hạng và cuộc thi">🏆</button>
        <button class="round" data-act="decor-mode" aria-label="Trang trí">🎨</button>
      </div>
      <button class="alert-chip hidden" data-act="forecast"></button>
      <div class="saved-badge">💾 Đã lưu</div>
      <div class="update-banner hidden"></div>
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
      <div class="visit-bar hidden"></div>
      <div class="decor-bar hidden"><span>🎨 <b>Chế độ trang trí</b> — chạm dấu ＋ để đặt hoặc đổi đồ</span><button class="btn primary" data-act="decor-done">Xong</button></div>
      <div class="visit-actions hidden"></div>
      <div class="sheet tile-panel hidden"></div>
      <div class="modal-wrap hidden"><div class="modal"></div></div>
    `;
    this.root.addEventListener('click', (e) => this.onClick(e));
    this.root.addEventListener('change', (e) => this.onChange(e));
    this.root.addEventListener('submit', (e) => {
      e.preventDefault();
      const f = e.target;
      if (f.dataset.frForm) this.friends.onSubmit(f);
      if (f.dataset.visitForm) this.postVisitMessage(f);
    });
  }

  onClick(e) {
    const qq = e.target.closest('[data-q]');
    if (qq) { this.quests.onAction(qq.dataset.q, qq); return; }
    const rk = e.target.closest('[data-rk]');
    if (rk) { this.rank.onAction(rk.dataset.rk, rk); return; }
    const dc = e.target.closest('[data-dc]');
    if (dc) { this.onDecorPick(dc); return; }
    const fr = e.target.closest('[data-fr]');
    if (fr) { this.friends.onAction(fr.dataset.fr, fr); return; }
    const lb = e.target.closest('[data-lab]');
    if (lb) { this.lab.onAction(lb.dataset.lab, lb); return; }
    const nb = e.target.closest('[data-nb]');
    if (nb) { this.notebook.onAction(nb.dataset.nb, nb); return; }
    const mk = e.target.closest('[data-mk]');
    if (mk) { this.marketPanel.onAction(mk.dataset.mk, mk); return; }
    const sp = e.target.closest('[data-sp]');
    if (sp) { if (!sp.classList.contains('disabled') || sp.dataset.sp === 'deliver') this.shopPanel.onAction(sp.dataset.sp, sp); return; }
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
      case 'go-farm': g.controls.focusOn(PLOT_SLOTS[0].clone().add({ x: 1.2, y: 0, z: -0.6 })); this.closeModal(); break;
      case 'go-shop': this.openShop(); break;
      case 'go-market': this.openMarket(b.dataset.tab); break;
      case 'forecast': this.openForecast(); break;
      case 'quality': g.setQuality(b.dataset.level); this.openSettings(); break;
      case 'do-update': this.doUpdate(b); break;
      case 'later-update': $('.update-banner', this.root).classList.add('hidden'); break;
      case 'notebook': this.notebook.open(b.dataset.tab); break;
      case 'go-lab': this.openLab(); break;
      case 'friends': this.friends.open(); break;
      case 'quests': this.quests.open(); break;
      case 'rank': this.rank.open(); break;
      case 'decor-mode': this.closeModal(); g.setDecorMode(true); break;
      case 'decor-done': this.closeModal(); g.setDecorMode(false); break;
      case 'visit-home': this.closeModal(); g.exitVisit(); break;
      case 'visit-water': if (!b.classList.contains('disabled')) { b.classList.add('disabled'); g.helpWaterFriend(g.visit.profile.id); } else g.toast('Hôm nay đã tưới giúp nhà này rồi', 'info'); break;
      case 'visit-gift': if (!b.classList.contains('disabled')) { this.friends.openGift(g.visit.profile); } else g.toast('Hôm nay đã tặng quà nhà này rồi', 'info'); break;
      case 'visit-book': this.openVisitGuestbook(); break;
      case 'cover-all': g.coverAll(); this.openForecast(); break;
      case 'treat-all': g.treatAll(); this.openForecast(); break;
      case 'cover-plot': g.coverPlot(g.selected.plot); this.lastPanelHtml = ''; this.updateTilePanel(); break;
      case 'sell': {
        if (!b.dataset.armed) {
          b.dataset.armed = '1';
          b.textContent = `Bán ${b.dataset.n} cành = ${b.dataset.total}💰?`;
          setTimeout(() => { if (b.isConnected) { delete b.dataset.armed; b.textContent = 'Bán sỉ'; } }, 3000);
          break;
        }
        g.sellWholesale(b.dataset.k);
        break;
      }
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
    $('.plevel', this.root).textContent = `Lv ${p.level}`;
    this.updateWallet();
  }

  updateWallet() {
    const p = this.game.save.player;
    $('.w-coins', this.root).textContent = p.coins;
    $('.w-rep', this.root).textContent = p.reputation;
    const t = tierInfo(p.reputation);
    $('.w-tier', this.root).textContent = t.icon;
    $('.w-tier', this.root).title = t.name;
    $('.w-lv', this.root).textContent = p.level;
    const lp = levelProgress(p);
    $('.xpbar i', this.root).style.width = `${Math.round(lp.frac * 100)}%`;
    $('.lvchip', this.root).title = `Cấp ${p.level} · ${lp.cur}/${lp.need} XP`;
    const n = this.game.save.shop.customers.length;
    const badge = $('.nav-badge', this.root);
    badge.classList.toggle('hidden', !n);
    badge.textContent = n;
  }

  // ---------- cập nhật phiên bản (GĐ9) ----------
  showUpdate(v, required) {
    const el = $('.update-banner', this.root);
    const apk = v.native && v.apkUrl;
    const title = required ? '⬆️ Cần cập nhật game' : `🎉 Có bản cập nhật mới${v.version ? ` (${esc(v.version)})` : ''}!`;
    const sub = required ? 'Tiến độ trên mạng được lưu bởi bản game mới hơn. Cập nhật để tiếp tục đồng bộ — tiến độ không bị mất.'
      : (v.notes || []).slice(0, 3).map((n) => `• ${esc(n)}`).join('<br>') || 'Tải lại để dùng bản mới. Tiến độ được lưu tự động.';
    el.innerHTML = `<div><b>${title}</b><small>${sub}</small></div>
      <div class="ub-btns"><button class="btn primary" data-act="do-update" data-apk="${apk ? esc(v.apkUrl) : ''}">${apk ? 'Tải bản mới' : 'Tải lại ngay'}</button>
      ${required ? '' : '<button class="btn" data-act="later-update">Để sau</button>'}</div>`;
    el.classList.remove('hidden');
  }

  async doUpdate(btn) {
    const g = this.game;
    btn.disabled = true;
    btn.textContent = 'Đang lưu...';
    await g.saveMgr.saveNow('manual');
    try { await g.account?.cloud?.flush(4000); } catch { /* bỏ qua */ }
    if (btn.dataset.apk) { const { openExternal } = await import('../online/native.js'); await openExternal(btn.dataset.apk); btn.disabled = false; btn.textContent = 'Tải bản mới'; return; }
    try { const regs = await navigator.serviceWorker?.getRegistrations?.(); await Promise.all((regs || []).map((r) => r.update())); } catch { /* bỏ qua */ }
    location.reload();
  }

  // ---------- nhiệm vụ & trang trí ----------
  updateQuestBadge() {
    const n = claimableCount(this.game.save);
    const b = $('.q-badge', this.root);
    b.classList.toggle('hidden', !n);
    b.textContent = n;
  }

  openDecorSlot(slot) {
    const s = this.game.save;
    const cur = s.decor.slots[slot];
    const owned = Object.entries(s.decor.owned).filter(([, n]) => n > 0);
    const zone = DECOR_SLOTS.find((x) => x.id === slot)?.zone === 'shop' ? 'trước tiệm hoa' : 'quanh nông trại';
    this.openModal('decorslot', `
      <h2>🎨 Đặt đồ ${zone}</h2>
      ${cur ? `<div class="mk-item"><div class="mk-icon">${DECOR[cur].icon}</div><div class="mk-info"><b>Đang đặt: ${DECOR[cur].name}</b></div><div class="mk-buy"><button class="btn" data-dc="remove" data-slot="${slot}">Cất đi</button></div></div>` : ''}
      <h3>Đồ đang có</h3>
      ${owned.length ? `<div class="lab-list">${owned.map(([id, n]) => `<button class="lab-item" data-dc="place" data-slot="${slot}" data-id="${id}"><span>${DECOR[id].icon}</span><small>${DECOR[id].name}</small><b>×${n}</b></button>`).join('')}</div>` : '<p class="muted">Bạn chưa có đồ trang trí nào.</p>'}
      <button class="btn wide" data-act="go-market" data-tab="decor">🧺 Mua thêm ở Khu Chợ</button>
      <p class="muted small">Điểm xinh xắn hiện tại: 🎨 ${this.game.beauty()}</p>`);
  }

  onDecorPick(el) {
    const g = this.game;
    if (el.dataset.dc === 'remove') g.placeDecor(el.dataset.slot, null);
    if (el.dataset.dc === 'place') g.placeDecor(el.dataset.slot, el.dataset.id);
    this.closeModal();
  }

  // ---------- bạn bè & thăm nhà ----------
  updateFriendBadge() {
    const n = this.game.account?.social?.badge || 0;
    const b = $('.fr-badge', this.root);
    b.classList.toggle('hidden', !n);
    b.textContent = n;
  }

  updateVisit(v) {
    this.root.classList.toggle('visiting', !!v);
    const bar = $('.visit-bar', this.root);
    const act = $('.visit-actions', this.root);
    bar.classList.toggle('hidden', !v);
    act.classList.toggle('hidden', !v);
    if (!v) { if (this.modal === 'visitbook') this.closeModal(); return; }
    const sn = v.snapshot || {};
    bar.innerHTML = `<div class="vb-av">${avatarSVG(v.profile.avatar || {}, 44)}</div>
      <div class="vb-info"><b>Nông trại của ${esc(v.profile.name)}</b>
      <small>⭐ Cấp ${num(sn.level) || 1}${sn.tier ? ` · ${esc(sn.tierIcon || '')} ${esc(sn.tier)}` : ''}</small>
      <small>🌸 ${num(sn.served)} khách · 💐 ${num(sn.bouquets)} bó hoa · 📖 Sổ tay ${num(sn.book)}%${sn.hearts ? ` · ❤️ ${num(sn.hearts)}` : ''}${sn.beauty ? ` · 🎨 ${num(sn.beauty)}` : ''}</small></div>`;
    act.innerHTML = `
      <button class="tool ${v.helped_today ? 'disabled' : ''}" data-act="visit-water"><span class="ti">💧</span><span class="tl">${v.helped_today ? 'Đã tưới' : 'Tưới giúp'}</span></button>
      <button class="tool ${v.gifted_today ? 'disabled' : ''}" data-act="visit-gift"><span class="ti">🎁</span><span class="tl">${v.gifted_today ? 'Đã tặng' : 'Tặng quà'}</span></button>
      <button class="tool" data-act="visit-book"><span class="ti">✉️</span><span class="tl">Lưu bút (${v.messages?.length || 0})</span></button>
      <button class="tool home" data-act="visit-home"><span class="ti">🏠</span><span class="tl">Về nhà</span></button>`;
    if (this.modal === 'visitbook') this.openVisitGuestbook();
  }

  openVisitGuestbook() {
    const v = this.game.visit;
    if (!v) return;
    const myId = this.game.account?.session?.user.id;
    const draft = $('#vb-text', this.root)?.value || '';
    this.openModal('visitbook', `
      <h2>✉️ Sổ lưu bút của ${esc(v.profile.name)}</h2>
      <form class="vb-form" data-visit-form="1">
        <textarea id="vb-text" name="text" maxlength="140" rows="3" placeholder="Để lại lời nhắn thật dễ thương...">${esc(draft)}</textarea>
        <button class="btn primary" type="submit">Gửi lời nhắn</button>
      </form>
      ${v.messages?.length ? messagesHtml(v.messages, myId, false) : '<p class="muted">Chưa có lời nhắn nào. Hãy là người đầu tiên!</p>'}`);
  }

  async postVisitMessage(form) {
    const g = this.game;
    const text = String(new FormData(form).get('text') || '').replace(/\s+/g, ' ').trim();
    if (!text) { g.toast('Hãy viết gì đó nhé', 'warn'); return; }
    if (!isCleanText(text)) { g.toast('Lời nhắn có từ ngữ không phù hợp', 'warn'); return; }
    const btn = form.querySelector('button');
    btn.disabled = true;
    try {
      await social.post(g.visit.profile.id, text);
      g.toast('✉️ Đã để lại lời nhắn!', 'good');
      form.querySelector('textarea').value = '';
      await g.refreshVisit();
    } catch (e) { g.toast(viError(e), 'warn'); btn.disabled = false; }
  }

  openLab() {
    this.game.controls.focusOn(this.game.world.lab.position.clone().add({ x: 1, y: 0, z: 2 }));
    this.game.select(null);
    this.lab.open();
  }

  updateLabBadge() {
    const slot = this.game.save.lab?.slot;
    $('.lab-badge', this.root).classList.toggle('hidden', !(slot && this.game.now >= slot.readyAt));
  }

  /** Truyện khách quen sau khi giao hoa */
  showStory(st) {
    const r = REGULARS[st.id];
    const npc = { ...r };
    const hearts = '❤️'.repeat(st.hearts) + '🤍'.repeat(r.chapters.length - st.hearts);
    if (!st.ok) {
      this.openModal('story', `<div class="story">
        <div class="story-av">${avatarSVG(npc.look, 72)}</div><h2>${esc(r.name)}</h2><p class="hearts">${hearts}</p>
        <p class="story-text">“Cảm ơn con nhé... nhưng hình như chưa đúng ý ${r.self} lắm. Lần sau ${r.self} lại ghé nhờ con làm lại nhé!”</p>
        <p class="muted small">Gợi ý: xem lại ý nghĩa và tông màu khách cần trong 📖 Sổ tay.</p>
        <button class="btn wide" data-act="close-modal">Đã hiểu</button></div>`);
      return;
    }
    const rw = st.reward || {};
    const items = [];
    if (rw.coins) items.push(`+${rw.coins} 💰`);
    if (rw.xp) items.push(`+${rw.xp} XP`);
    Object.entries(rw.seeds || {}).forEach(([k, n]) => { const v = variants.parseVkey(k); items.push(`${n} hạt ${variants.variantName(v.species, v.variant)}`); });
    Object.entries(rw.items || {}).forEach(([k, n]) => items.push(`${n} ${{ fertilizer: '🧪 phân bón', cover: '⛺ bạt che', medicine: '💊 thuốc' }[k] || k}`));
    Object.entries(rw.papers || {}).forEach(([k, n]) => items.push(`${n} ${PAPERS[k]?.name || k}`));
    Object.entries(rw.ribbons || {}).forEach(([k, n]) => items.push(`${n} ${RIBBONS[k]?.name || k}`));
    if (rw.reveal?.length) items.push(`📖 ${rw.reveal.length} ý nghĩa hoa mới`);
    const done = st.hearts >= r.chapters.length;
    this.openModal('story', `<div class="story">
      <div class="story-av">${avatarSVG(npc.look, 72)}</div><h2>${esc(r.name)}</h2><p class="hearts">${hearts}</p>
      <p class="story-text">“${esc(st.chapter.thanks)}”</p>
      <h3>🎁 Quà tặng</h3><ul class="unlocks">${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>
      ${done ? `<p class="fin">🌟 Bạn đã hoàn thành câu chuyện của ${esc(r.name)}!</p>` : `<p class="muted small">Thân thiết ${st.hearts}/${r.chapters.length} — ${esc(r.name)} sẽ sớm ghé lại.</p>`}
      <button class="btn primary wide" data-act="close-modal">Thật ấm lòng!</button></div>`);
    this.game.particles.spawn('sparkle', this.game.player.root.position.clone());
  }

  openMarket(tab) {
    this.game.controls.focusOn(ZONES.market.center.clone().add({ x: 1, y: 0, z: 3 }));
    this.game.select(null);
    this.marketPanel.open(tab);
  }

  showLevelUp(ups) {
    const last = ups[ups.length - 1];
    const coins = ups.reduce((a, u) => a + u.reward.coins, 0);
    const fert = ups.reduce((a, u) => a + u.reward.fertilizer, 0);
    const unlocks = ups.flatMap((u) => u.unlocks);
    this.openModal('levelup', `
      <div class="lvup">
        <div class="lvup-star">⭐<b>${last.level}</b></div>
        <h2>Lên cấp ${last.level}!</h2>
        <p class="muted">Phần thưởng: <b>+${coins} 💰</b> · <b>+${fert} 🧪 phân bón</b></p>
        ${unlocks.length ? `<h3>Vừa mở khóa</h3><ul class="unlocks">${unlocks.map((u) => `<li>${esc(u)}</li>`).join('')}</ul>
        <button class="btn primary wide" data-act="go-market">🧺 Đến Khu Chợ</button>` : ''}
        <button class="btn wide" data-act="close-modal">Tuyệt vời!</button>
      </div>`);
  }

  // ---------- lịch & dự báo ----------
  updateAlert() {
    const s = this.game.save;
    const el = $('.alert-chip', this.root);
    const w = s.weather;
    if (!w?.today) { el.classList.add('hidden'); return; }
    const day = w.today.day;
    const fest = calendar.festivalOn(day);
    const tm = w.tomorrow;
    let text = '', kind = 'info';
    if (WEATHER[tm.type].disaster || tm.disease) {
      text = `⚠️ Ngày mai: ${[WEATHER[tm.type].disaster ? WEATHER[tm.type].icon + ' ' + WEATHER[tm.type].name : '', tm.disease ? DISEASES[tm.disease].icon + ' ' + DISEASES[tm.disease].name : ''].filter(Boolean).join(' · ')}`;
      kind = 'warn';
    } else if (WEATHER[w.today.type].disaster || w.today.disease) {
      text = `⚠️ Hôm nay: ${WEATHER[w.today.type].disaster ? WEATHER[w.today.type].name : DISEASES[w.today.disease].name}`;
      kind = 'warn';
    } else if (fest) text = `${fest.icon} Hôm nay: ${fest.name}`;
    else if (calendar.festivalOn(day + 1)) text = `${calendar.festivalOn(day + 1).icon} Ngày mai: ${calendar.festivalOn(day + 1).name}`;
    el.classList.toggle('hidden', !text);
    el.className = `alert-chip ${kind}${text ? '' : ' hidden'}`;
    el.textContent = text;
  }

  openForecast() {
    const g = this.game;
    const s = g.save;
    const w = s.weather;
    const day = calendar.dayOf(g.now);
    const cal = calendar.calendarOf(day);
    const dayCard = (label, d) => {
      const W = WEATHER[d.type];
      const fest = calendar.festivalOn(d.day);
      const c = calendar.calendarOf(d.day);
      return `<div class="fc-card ${W.disaster || d.disease ? 'danger' : ''}">
        <small>${label} · ${c.season.name} ngày ${c.dayOfSeason}/7</small>
        <div class="fc-main"><span class="fc-icon">${W.icon}</span><b>${W.name}</b></div>
        ${W.desc ? `<p>${W.desc}</p>` : ''}
        ${d.disease ? `<p class="bad">${DISEASES[d.disease].icon} <b>${DISEASES[d.disease].name}</b> lúc 10:00 — ${DISEASES[d.disease].desc}</p>` : ''}
        ${fest ? `<p class="fest">${fest.icon} <b>${fest.name}</b>: khách mua nhiều ${fest.flowers.map((f) => FLOWERS[f].icon).join('')} và trả giá ×${fest.priceMult}</p>` : ''}
      </div>`;
    };
    // việc nên làm
    const tm = w.tomorrow;
    const needCover = WEATHER[tm.type].disaster || WEATHER[w.today.type].disaster;
    const needMed = !!(tm.disease || w.today.disease) || s.farm.plots.some((p) => p.tiles.some((t) => t.sick && (t.state === 'growing' || t.state === 'ready')));
    const unprotected = s.farm.plots.filter((p) => !isProtected(p, protectUntil(g.now))).length;
    const sick = s.farm.plots.reduce((a, p) => a + p.tiles.filter((t) => t.sick && (t.state === 'growing' || t.state === 'ready')).length, 0);
    const todo = [];
    if (needCover) todo.push(`<div class="todo"><span>⛺ ${unprotected ? `${unprotected} lô chưa được che` : 'Mọi lô đã được bảo vệ'}</span>${unprotected ? `<button class="btn primary" data-act="cover-all">Che bạt tất cả (có ${s.inventory.items.cover || 0})</button>` : ''}</div>`);
    if (needMed) todo.push(`<div class="todo"><span>💊 ${sick ? `${sick} cây đang bệnh` : 'Phun phòng trước khi dịch đến'}</span><button class="btn primary" data-act="treat-all">Phun thuốc tất cả (có ${s.inventory.items.medicine || 0})</button></div>`);
    if (needCover || needMed) todo.push('<button class="btn wide" data-act="go-market" data-tab="protect">🧺 Mua bạt, thuốc, nhà kính ở Khu Chợ</button>');

    const inS = calendar.seasonFlowers(day).filter((f) => FLOWERS[f].unlockLevel <= s.player.level);
    const outS = g.unlockedFlowers().filter((f) => !inS.includes(f));
    const fests = calendar.upcomingFestivals(day + 1, 4).map((x) => `<li>${x.festival.icon} <b>${x.festival.name}</b> <small>${x.inDays === 0 ? 'ngày mai' : `còn ${x.inDays + 1} ngày`}</small><br><small>Chuẩn bị: ${x.festival.flowers.map((f) => `${FLOWERS[f].icon} ${FLOWERS[f].name}`).join(', ')}</small></li>`).join('');
    const seasonsRow = SEASONS.map((se, i) => `<span class="${i === cal.seasonIndex ? 'on' : ''}">${se.icon} ${se.name.replace('Mùa ', '')}</span>`).join('');
    this.openModal('forecast', `
      <h2>📅 Lịch & Dự báo</h2>
      <div class="seasons-row">${seasonsRow}</div>
      <p class="muted small">Năm ${cal.year} · ${cal.season.name}, ngày ${cal.dayOfSeason}/7</p>
      <div class="fc-grid">${dayCard('Hôm nay', w.today)}${dayCard('Ngày mai', tm)}</div>
      ${todo.length ? `<h3>Việc nên làm</h3><div class="todos">${todo.join('')}</div>` : '<p class="muted">Không có gì đáng lo, trồng hoa thôi! 🌷</p>'}
      <h3>Hoa theo mùa</h3>
      <p class="small"><b>Đúng mùa</b> (lớn nhanh, dễ đạt 3★): ${inS.map((f) => `${FLOWERS[f].icon} ${FLOWERS[f].name}`).join(', ') || '—'}</p>
      <p class="small muted"><b>Trái mùa</b> (lớn chậm, khó 3★ — trừ khi trồng trong nhà kính): ${outS.map((f) => `${FLOWERS[f].icon} ${FLOWERS[f].name}`).join(', ') || '—'}</p>
      <h3>Lễ hội sắp tới</h3><ul class="fests">${fests || '<li>—</li>'}</ul>`);
  }

  openShop(customerId = null) {
    this.game.controls.focusOn(ZONES.shop.center.clone().add({ x: 0, y: 0, z: 3 }));
    this.game.select(null);
    this.shopPanel.open(customerId);
  }

  updateClock(c) {
    $('.ctime', this.root).textContent = formatClock(this.game.now);
    const cal = calendar.calendarOf(c.day);
    $('.cday', this.root).textContent = `${cal.season.icon} ${cal.season.name.replace('Mùa ', '')} ${cal.dayOfSeason}/7 · ${periodName(c.hourFloat)}`;
    const w = this.game.save.weather?.today;
    // ban đêm: trăng (trừ khi mưa/bão/tuyết); ban ngày: biểu tượng thời tiết
    const wxIcon = w ? WEATHER[w.type].icon : '☀️';
    const calm = !w || w.type === 'sunny' || w.type === 'heat';
    let icon = isNight(c.hourFloat) ? (calm ? '🌙' : wxIcon) : wxIcon;
    if (calm && !isNight(c.hourFloat) && (c.hourFloat < 7 || c.hourFloat > 17.5)) icon = '🌅';
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
    this.root.querySelectorAll('.toolbar .tool').forEach((b) => {
      b.classList.toggle('active', b.dataset.tool === g.tool);
      const badge = $('.badge', b);
      let n = null;
      if (b.dataset.tool === 'plant') n = g.save.inventory.seeds[g.seed] || 0;
      if (b.dataset.tool === 'fertilize') n = g.save.inventory.items.fertilizer || 0;
      if (b.dataset.tool === 'treat') n = g.save.inventory.items.medicine || 0;
      badge.classList.toggle('hidden', n === null);
      if (n !== null) badge.textContent = n;
      if (b.dataset.tool === 'plant') $('.ti', b).textContent = g.tool === 'plant' ? FLOWERS[variants.parseVkey(g.seed).species].icon : '🌱';
    });
    this.updateSeedbar();
  }

  updateSeedbar() {
    const g = this.game;
    const bar = $('.seedbar', this.root);
    bar.classList.toggle('hidden', g.tool !== 'plant');
    if (g.tool !== 'plant') return;
    bar.innerHTML = this.seedList().map((k) => {
      const { species, variant } = variants.parseVkey(k);
      const n = g.save.inventory.seeds[k] || 0;
      return `<button class="seed ${g.seed === k ? 'active' : ''} ${n ? '' : 'empty'}" data-seed="${k}" title="${esc(variants.variantName(species, variant))}">
        <span>${FLOWERS[species].icon}${vdot(species, variant)}</span><small>${esc(variants.variantName(species, variant))}</small><b>${n}</b></button>`;
    }).join('');
  }

  /** Các loại hạt hiển thị: màu mặc định của loài đã mở khóa + mọi hạt màu đang có */
  seedList() {
    const g = this.game;
    const set = new Set(g.unlockedFlowers().map((id) => variants.vkey(id)));
    Object.entries(g.save.inventory.seeds).forEach(([k, n]) => { if (n > 0) set.add(k); });
    return [...set];
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
      case 'growing': icon = def.icon; title = variants.variantName(tile.flower, tile.variant); status = `${farming.STAGE_NAMES[farming.stageOf(tile)]} · còn ${formatDuration(farming.remainingMinutes(tile))}${tile.water <= 0.001 ? ' (đang ngừng lớn vì khô!)' : ''}`; break;
      case 'ready': icon = def.icon; title = variants.variantName(tile.flower, tile.variant); status = '✨ Hoa đã nở, thu hoạch thôi!'; break;
      case 'dead': icon = '🥀'; title = `${variants.variantName(tile.flower, tile.variant)} (héo khô)`; status = 'Cây đã chết. Dùng xẻng để dọn.'; break;
      default: icon = '?'; title = '';
    }
    const bars = [];
    const plot = g.save.farm.plots[g.selected.plot];
    const now = g.now;
    const notes = [];
    if (tile.sick && ['growing', 'ready'].includes(tile.state)) notes.push(`<div class="note bad">${DISEASES[tile.sick].icon} ${DISEASES[tile.sick].name}: cây ngừng lớn và yếu dần — hãy phun 💊 thuốc!</div>`);
    if ((tile.guardUntil || 0) >= now && !tile.sick && tile.state !== 'untilled') notes.push('<div class="note good">💊 Đã phun thuốc phòng bệnh đến hết ngày mai</div>');
    if (plot.greenhouse) notes.push('<div class="note good">🏠 Lô có nhà kính: an toàn trước thiên tai</div>');
    else if ((plot.coverUntil || 0) >= now) notes.push('<div class="note good">⛺ Lô đang được che bạt đến hết ngày mai</div>');
    if (tile.flower && ['growing', 'ready'].includes(tile.state)) {
      const inS = calendar.inSeason(tile.flower, calendar.dayOf(now));
      if (tile.offSeason) notes.push('<div class="note warn">🍂 Gieo trái mùa: khó đạt 3★</div>');
      else if (!inS && !plot.greenhouse) notes.push('<div class="note warn">🍂 Đang trái mùa: lớn chậm hơn</div>');
      else if (inS) notes.push('<div class="note good">🌸 Đúng mùa: lớn nhanh hơn</div>');
    }
    if (['growing', 'ready'].includes(tile.state)) {
      bars.push(bar('🌱 Lớn', farming.progressOf(tile), '#8fd18b'));
      bars.push(bar('💧 Nước', tile.water / waterCapacity(g.save), tile.water < CARE.thirstyBelow ? '#f29a8a' : '#6fbbe8'));
      bars.push(bar('❤️ Sức khỏe', tile.health / 100, tile.health < CARE.wiltBelow ? '#f29a8a' : '#f6a6b9'));
      bars.push(`<div class="kv"><span>🧪 Phân bón</span><b>${tile.fert}/${def.fertilizerNeeded}</b></div>`);
      bars.push(`<div class="kv"><span>⭐ Chất lượng dự kiến</span><b class="stars">${'★'.repeat(farming.qualityOf(tile))}${'☆'.repeat(3 - farming.qualityOf(tile))}</b></div>`);
      const vk = variants.vkey(tile.flower, tile.variant);
      const mean = g.save.book?.meanings[vk] ? variants.meaningsOf(tile.flower, tile.variant).map(variants.meaningText).join(', ') : '??? (khám phá khi bán cho khách)';
      bars.push(`<div class="hint">Cần tưới ${def.waterPerDay} lần/ngày · ${def.growHours} giờ để nở · Ý nghĩa: ${esc(mean)}</div>`);
    } else if (tile.state === 'tilled') {
      bars.push(bar('💧 Độ ẩm', tile.water / waterCapacity(g.save), '#6fbbe8'));
    }

    const actions = farming.availableActions(tile).map((a) => {
      if (a === 'plant') {
        return `<div class="seed-row">${this.seedList().map((k) => {
          const { species, variant } = variants.parseVkey(k);
          const n = g.save.inventory.seeds[k] || 0;
          return `<button class="btn seedbtn ${n ? '' : 'disabled'}" data-seed="${k}" data-do="plant">${FLOWERS[species].icon}${vdot(species, variant)} ${esc(variants.variantName(species, variant))} <b>×${n}</b></button>`;
        }).join('')}</div>`;
      }
      let disabled = false;
      if (a === 'fertilize') disabled = !farming.canFertilize(tile) || !(g.save.inventory.items.fertilizer > 0);
      if (a === 'water') disabled = tile.water >= waterCapacity(g.save) - 0.1;
      if (a === 'treat') disabled = !(g.save.inventory.items.medicine > 0) || (!tile.sick && (tile.guardUntil || 0) >= protectUntil(now));
      const [ic, lb] = ACTION_LABEL[a];
      const label = a === 'till' && tile.state === 'dead' ? 'Dọn & xới' : lb;
      return `<button class="btn primary ${disabled ? 'disabled' : ''}" data-do="${a}">${ic} ${label}</button>`;
    }).join('');

    return `
      <div class="sheet-head"><span class="big">${icon}</span><div><b>${esc(title)}</b><small>${status}</small></div>
        <button class="round sm" data-act="close-tile" aria-label="Đóng">✕</button></div>
      <div class="bars">${bars.join('')}</div>
      ${notes.join('')}
      <div class="actions">${actions}${!plot.greenhouse && (plot.coverUntil || 0) < protectUntil(now) && tile.state !== 'untilled' ? `<button class="btn" data-act="cover-plot">⛺ Che bạt cả lô (${g.save.inventory.items.cover || 0})</button>` : ''}</div>`;
  }

  // ---------- kho đồ ----------
  openInventory() {
    const s = this.game.save;
    const seeds = this.seedList().map((k) => { const { species, variant } = variants.parseVkey(k); return `<div class="cell"><span>${FLOWERS[species].icon}${vdot(species, variant)}</span><small>Hạt ${esc(variants.variantName(species, variant))}</small><b>×${s.inventory.seeds[k] || 0}</b></div>`; }).join('');
    const flowers = Object.entries(s.inventory.flowers).filter(([, n]) => n > 0).map(([k, n]) => {
      const f = variants.parseFlowerKey(k);
      return `<div class="cell"><span>${FLOWERS[f.species].icon}${vdot(f.species, f.variant)}</span><small>${esc(variants.variantName(f.species, f.variant))} <i class="stars">${'★'.repeat(f.q)}</i></small><b>×${n}</b>
        <button class="mini" data-act="sell" data-k="${k}" data-n="${n}" data-total="${wholesalePrice(k) * n}">Bán sỉ</button></div>`;
    }).join('') || '<p class="muted">Chưa có hoa nào. Hãy trồng và thu hoạch nhé!</p>';
    this.openModal('inventory', `
      <h2>🎒 Kho đồ</h2>
      <h3>Hoa đã thu hoạch</h3><div class="grid">${flowers}</div>
      <p class="muted small">Bán sỉ nhanh nhưng chỉ được khoảng một nửa giá. Bán cho khách ở 🏪 Tiệm Hoa lời hơn và có uy tín.</p>
      <h3>Hạt giống</h3><div class="grid">${seeds}</div>
      <h3>Giấy gói & ruy băng</h3><div class="grid">${[
        ...Object.entries(PAPERS).map(([id, w]) => `<div class="cell"><span class="swatch-dot" style="--c:${w.color}"></span><small>${w.name}</small><b>${w.free ? '∞' : '×' + (s.inventory.papers[id] || 0)}</b></div>`),
        ...Object.entries(RIBBONS).map(([id, w]) => `<div class="cell"><span class="swatch-dot ribbon" style="--c:${w.color}"></span><small>${w.name}</small><b>${w.free ? '∞' : '×' + (s.inventory.ribbons[id] || 0)}</b></div>`),
      ].join('')}</div>
      <h3>Vật phẩm & dụng cụ</h3><div class="grid">
        <div class="cell"><span>🧪</span><small>Phân bón</small><b>×${s.inventory.items.fertilizer || 0}</b></div>
        <div class="cell"><span>⛺</span><small>Bạt che</small><b>×${s.inventory.items.cover || 0}</b></div>
        <div class="cell"><span>💊</span><small>Thuốc</small><b>×${s.inventory.items.medicine || 0}</b></div>
        <div class="cell"><span>🪏</span><small>Xẻng</small><b>${s.tools.shovel ? '✔' : '—'}</b></div>
        <div class="cell"><span>🚿</span><small>Bình tưới</small><b>${s.tools.wateringCan ? '✔' : '—'}</b></div>
      </div>
      ${DEV_TOOLS ? '<button class="btn primary wide" data-act="free-seeds">🎁 Nhận gói hạt giống miễn phí (1 lần/ngày game)</button>' : ''}
      <button class="btn wide" data-act="go-market">🧺 Mua thêm ở Khu Chợ</button>
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
      <h3>🎨 Đồ họa</h3>
      <div class="seg">${[['auto', 'Tự động'], ['high', 'Cao'], ['medium', 'Vừa'], ['low', 'Tiết kiệm pin']].map(([v, l]) => `<button class="${(s.settings.quality || 'auto') === v ? 'on' : ''}" data-act="quality" data-level="${v}">${l}</button>`).join('')}</div>
      <p class="muted small">Đang dùng: ${GRAPHICS.levels[g.graphicsLevel].name}${(s.settings.quality || 'auto') === 'auto' ? ' (tự giảm khi máy chậm)' : ''}. "Tiết kiệm pin" tắt bóng đổ, giảm độ nét và chạy 30 khung hình/giây.</p>
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
      outdated: '⬆️ Tiến độ trên mạng thuộc bản game mới hơn — hãy cập nhật game để đồng bộ',
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

  openModal(name, html, size = '') {
    this.modal = name;
    const wrap = $('.modal-wrap', this.root);
    $('.modal', wrap).className = `modal ${size}`;
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

/** Số an toàn để hiển thị (dữ liệu từ người chơi khác) */
const num = (v) => Math.max(0, Math.floor(Number(v) || 0));

/** Chấm màu nhỏ cho biến thể hoa */
function vdot(species, variant) {
  return `<i class="vdot" style="--c:${variants.variantData(species, variant).petal}"></i>`;
}

function bar(label, v, color) {
  const pct = Math.round(Math.max(0, Math.min(1, v)) * 100);
  return `<div class="bar"><span>${label}</span><div class="track"><i style="width:${pct}%;background:${color}"></i></div><b>${pct}%</b></div>`;
}
