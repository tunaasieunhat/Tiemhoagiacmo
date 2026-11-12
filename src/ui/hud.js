// Giao diện HTML phủ lên trên 3D: thanh trên, thanh công cụ, bảng ô đất, kho đồ, cài đặt, thông báo.
import { FLOWERS, FLOWER_IDS } from '../../data/flowers.js';
import { SOIL as SOIL_RULES } from '../../data/care.js';
import { canDeliver as orderCanDeliver } from '../systems/orders.js';
import * as goalsSys from '../systems/goals.js';
import { CARE, DEV_TOOLS, GRAPHICS } from '../../data/config.js';
import * as auth from '../online/auth.js';
import * as farming from '../systems/farming.js';
import { formatClock, periodName, isNight, formatDuration } from '../systems/time.js';
import { avatarSVG } from './avatar.js';
import { savePrefs } from '../audio/audio.js';
import { villagerInfo, greeting, houseStatus } from '../systems/village.js';
import * as rel from '../systems/relations.js';
import { runMiniGame } from './minigames.js';
import { PARCELS, LAND_RULES } from '../../data/land.js';
import * as landSys from '../systems/land.js';
import { FAVOR_RULES, DIFFICULTY } from '../../data/minigames.js';
import * as favorsSys from '../systems/favors.js';
import { FRIEND, REACTION, BONDS } from '../../data/stories.js';
import { DECOR as DECOR_ALL } from '../../data/decor.js';
import { ACTIVITIES, HOUSES, LEAVES_AFTER_STORY, GONE_WHEN, SPOTS } from '../../data/village.js';
import { isNative, openExternal } from '../online/native.js';
import { ONLINE } from '../../data/online.js';
import { TUTORIAL } from '../game.js';
import { ShopPanel } from './shopPanel.js';
import { MarketPanel } from './marketPanel.js';
import { ManagePanel } from './managePanel.js';
import { StylePanel } from './stylePanel.js';
import { FunPanel } from './funPanel.js';
import { WARDROBE } from '../../data/wardrobe.js';
import * as passSys from '../systems/pass.js';
import { LabPanel } from './labPanel.js';
import { FriendsPanel, messagesHtml } from './friendsPanel.js';
import { QuestsPanel } from './questsPanel.js';
import { LuckPanel } from './luckPanel.js';
import { RankPanel } from './rankPanel.js';
import { claimableCount } from '../systems/quests.js';
import { DECOR, DECOR_RULES } from '../../data/decor.js';
import { social } from '../online/social.js';
import { viError } from '../online/errors.js';
import { isCleanText } from '../online/names.js';
import { NotebookPanel } from './notebookPanel.js';
import * as variants from '../systems/variants.js';
import { REGULARS } from '../../data/regulars.js';
import { levelProgress } from '../systems/progression.js';
import { waterCapacity } from '../systems/farming.js';
import * as calendar from '../systems/calendar.js';
import { protectUntil, isProtected, outbreakHourOf } from '../systems/weather.js';
import { WEATHER, DISEASES, PROTECTION, SEASONS } from '../../data/seasons.js';
import { PAPERS, RIBBONS } from '../../data/wrapping.js';
import { wholesalePrice, tierInfo } from '../systems/shop.js';
import { ZONES, PLOT_SLOTS } from '../render/world.js';
import { GAME_VERSION, GAME_STAGE } from '../version.js';
import { Cinema } from './cinema.js';
import { FishingUI } from './fishingGame.js';
import * as fishSys from '../systems/fishing.js';
import * as craft from '../systems/craft.js';
import * as homeSys from '../systems/home.js';
import { HOME_COLORS, HOME_ITEMS, HOME_PARTS } from '../../data/home.js';
import { GATHER, PRODUCTS, INGREDIENTS, CRAFT_RULES, HG_GAME_NAMES } from '../../data/huong.js';
import { CG_TEXT } from '../../data/story.js';
import { FISH, FISH_RULES, FISH_SPOTS, BAITS, RODS, GEAR } from '../../data/fishing.js';
import * as storySys from '../systems/story.js';
import { STORY_RULES, BUDS } from '../../data/story.js';

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
      this.updateToolbar(); this.updateProfile(); this.updateQuestBadge();
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
    // app Android: có APK mới => màn hình bắt buộc tải; save trên mạng thuộc bản mới hơn => cũng bắt cập nhật app
    em.on('app-update-required', (v) => this.showForceUpdate(v));
    em.on('update-required', (v) => (isNative() ? this.showForceUpdate({ ...v, apkUrl: ONLINE.apkDownloadUrl, cloud: true }) : this.showUpdate(v, true)));
    em.on('xp', () => this.updateLuckBadge());
    em.on('quests', () => { this.updateQuestBadge(); if (this.modal === 'quests') this.quests.render(); });
    em.on('decor-mode', (on) => { this.root.classList.toggle('decorating', on); $('.decor-bar', this.root).classList.toggle('hidden', !on); });
    em.on('decor-edit', () => this.renderDecorBar());
    em.on('villager', ({ id }) => this.openVillager(id));
    em.on('bond-reward', (e) => { this.pendingRewards = [...(this.pendingRewards || []), e]; });
    em.on('house', ({ id }) => this.openHouse(id));
    em.on('parcel', ({ id }) => this.openParcel(id));
    em.on('inventory', () => { if (this.game.decorMode) this.renderDecorBar(); });
    em.on('xp', () => this.updateProfile());
    em.on('levelup', (ups) => this.showLevelUp(ups));
    em.on('weather', () => { this.updateAlert(); this.updateClock(this.game.clock); if (this.modal === 'forecast') this.openForecast(); });
    em.on('saved', (s) => this.flashSaved(s));
    // GĐ20: cốt truyện chính
    this.cinema = new Cinema({ game, hud: this });
    game.cinema = this.cinema;
    this.bootAt = performance.now();
    em.on('cine', (on) => { this.root.classList.toggle('cine', on); if (on) game.select(null); });
    em.on('close-modal', () => this.closeModal());
    em.on('story', () => this.updateStoryBadge());
    // đang hiện bảng khác (vd vừa lên cấp nhờ XP của chương) thì đợi đóng bảng đó rồi mới hiện "Hết chương"
    em.on('story-chapter', (e) => { if (this.modal) this.afterClose = () => this.showChapterDone(e); else this.showChapterDone(e); });
    em.on('refresh', () => this.maybeAutoStory());
    em.on('buds', () => this.openBuds());
    // GĐ22: câu cá
    this.fishing = new FishingUI(this);
    em.on('fish', ({ id }) => this.openFish(id));
    em.on('fishstall', () => this.openFishStall());
    // GĐ23: Đảo Ngàn Hương
    em.on('gather', ({ id }) => this.openGather(id));
    em.on('hgshop', () => this.openHgShop());
    // GĐ24: nhà của bạn
    em.on('home', () => this.openHome());
    // GĐ26: chấm đỏ 🗓️ khi chưa điểm danh / có quà Sổ thưởng chờ nhận
    em.on('manage', () => this.updateManageBadge());
    em.on('xp', () => this.updateManageBadge());
    em.on('sync', (s) => this.updateSync(s));
    this.updateClock(game.clock);
    this.updateToolbar();
    this.updateProfile();
    this.updateTutorial();
    this.updateSync({ status: game.account?.cloud?.status });
    this.shopPanel = new ShopPanel(this);
    this.marketPanel = new MarketPanel(this);
    this.manage = new ManagePanel(this); // GĐ25: 🗓️ Sổ quản lý
    this.style = new StylePanel(this); // GĐ26: 🎀 Phong cách
    this.fun = new FunPanel(this); // GĐ26: 🎡 Khu Vui Chơi
    this.lab = new LabPanel(this);
    this.notebook = new NotebookPanel(this);
    this.friends = new FriendsPanel(this);
    this.quests = new QuestsPanel(this);
    this.luck = new LuckPanel(this);
    this.rank = new RankPanel(this);
    this.updateQuestBadge();
    this.updateLuckBadge();
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
          <button class="round" data-act="notebook" aria-label="Sổ tay thực vật">📖<span class="badge hidden nb-badge">📜</span></button>
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
        <button class="round nav-toggle" data-act="nav-toggle" aria-label="Thu gọn hoặc mở menu"><span class="nt-open">☰</span><span class="nt-close">✕</span></button>
        <div class="nav-grid">
        <button class="round" data-act="go-farm" aria-label="Về nông trại">🌱</button>
        <button class="round" data-act="go-shop" aria-label="Tiệm hoa">🏪<span class="badge hidden nav-badge"></span></button>
        <button class="round" data-act="go-market" aria-label="Khu chợ">🧺</button>
        <button class="round" data-act="go-lab" aria-label="Nhà lai tạo">🧬<span class="badge hidden lab-badge">✓</span></button>
        <button class="round" data-act="go-village" aria-label="Làng Hoa">🏘️</button>
        <button class="round hidden" data-act="go-en" aria-label="Ra khơi: Mũi Én / về Đảo Mây">⛵</button>
        <button class="round" data-act="friends" aria-label="Bạn bè">👥<span class="badge hidden fr-badge"></span></button>
        <button class="round" data-act="quests" aria-label="Nhiệm vụ">📋<span class="badge hidden q-badge"></span></button>
        <button class="round" data-act="manage" aria-label="Sổ quản lý: kế hoạch hôm nay, tiệc, chi nhánh, nhân viên, sổ thưởng mùa">🗓️<span class="badge hidden ql-badge"></span></button>
        <button class="round" data-act="style" aria-label="Phong cách: tủ đồ, thú cưng, trứng">🎀</button>
        <button class="round" data-act="go-fun" aria-label="Khu Vui Chơi">🎡</button>
        <button class="round" data-act="rank" aria-label="Xếp hạng và cuộc thi">🏆</button>
        <button class="round" data-act="decor-mode" aria-label="Trang trí">🎨</button>
        <button class="round" data-act="luck" aria-label="Vận May">🍀<span class="badge hidden lk-badge"></span></button>
        </div>
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
      <div class="decor-bar hidden"></div>
      <div class="visit-actions hidden"></div>
      <div class="sheet tile-panel hidden"></div>
      <div class="modal-wrap hidden"><div class="modal"></div></div>
    `;
    // nhớ trạng thái thu gọn cột nút bên trái (lưu trên máy, không nằm trong save)
    try { if (localStorage.getItem('thgm:nav') === 'closed') $('.nav-btns', this.root).classList.add('collapsed'); } catch { /* bỏ qua */ }
    this.root.addEventListener('click', (e) => this.onClick(e));
    this.root.addEventListener('change', (e) => this.onChange(e));
    this.root.addEventListener('input', (e) => { if (e.target.dataset?.audio) this.onAudioInput(e.target); });
    this.root.addEventListener('submit', (e) => {
      e.preventDefault();
      const f = e.target;
      if (f.dataset.frForm) this.friends.onSubmit(f);
      if (f.dataset.visitForm) this.postVisitMessage(f);
    });
  }

  onClick(e) {
    const lk = e.target.closest('[data-lk]');
    if (lk) { this.luck.onAction(lk.dataset.lk, lk); return; }
    const qq = e.target.closest('[data-q]');
    if (qq) { this.quests.onAction(qq.dataset.q, qq); return; }
    const rk = e.target.closest('[data-rk]');
    if (rk) { this.rank.onAction(rk.dataset.rk, rk); return; }
    const ld = e.target.closest('[data-ld]');
    if (ld) { this.onLandAct(ld); return; }
    const fh = e.target.closest('[data-fh]');
    if (fh) { this.onFishStall(fh); return; }
    const hm = e.target.closest('[data-hm]');
    if (hm) { this.onHome(hm); return; }
    const hg = e.target.closest('[data-hg]');
    if (hg) { this.onHgShop(hg); return; }
    const bd = e.target.closest('[data-bd]');
    if (bd) { this.onBudAct(bd); return; }
    const vg = e.target.closest('[data-vg]');
    if (vg) { this.onVillagerAct(vg); return; }
    const db = e.target.closest('[data-db]');
    if (db) { this.onDecorBar(db); return; }
    const fr = e.target.closest('[data-fr]');
    if (fr) { this.friends.onAction(fr.dataset.fr, fr); return; }
    const lb = e.target.closest('[data-lab]');
    if (lb) { this.lab.onAction(lb.dataset.lab, lb); return; }
    const nb = e.target.closest('[data-nb]');
    if (nb) { this.notebook.onAction(nb.dataset.nb, nb); return; }
    const sy = e.target.closest('[data-sy]');
    if (sy) { this.style.onAction(sy.dataset.sy, sy); return; }
    const fn = e.target.closest('[data-fn]');
    if (fn) { this.fun.onAction(fn.dataset.fn, fn); return; }
    const ql = e.target.closest('[data-ql]');
    if (ql && ql.tagName !== 'SELECT') { this.manage.onAction(ql.dataset.ql, ql); return; }
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
      case 'inv-tab': this.invTab = b.dataset.id; this.openInventory(); break;
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
      case 'tut-toggle': {
        const mini = !$('.tutorial', this.root).classList.contains('mini');
        try { localStorage.setItem('thgm:tut', mini ? 'mini' : 'open'); } catch { /* bỏ qua */ }
        this.updateTutorial();
        break;
      }
      case 'login': this.login(); break;
      case 'nav-toggle': {
        const nav = $('.nav-btns', this.root);
        const c = nav.classList.toggle('collapsed');
        try { localStorage.setItem('thgm:nav', c ? 'closed' : 'open'); } catch { /* bỏ qua */ }
        break;
      }
      case 'go-farm': g.controls.focusOn(PLOT_SLOTS[0].clone().add({ x: 1.2, y: 0, z: -0.6 })); this.closeModal(); break;
      case 'go-shop': this.openShop(); break;
      case 'go-market': this.openMarket(b.dataset.tab); break;
      case 'manage': this.manage.open(b.dataset.tab || null); break;
      case 'style': this.style.open(b.dataset.tab || null); break;
      case 'go-fun': this.closeModal(); g.goFun(); if (g.funOpen()) setTimeout(() => this.fun.open(), 500); else g.tapFun({ kind: 'fungate', nav: true }); break;
      case 'forecast': this.openForecast(); break;
      case 'quality': g.setQuality(b.dataset.level); this.openSettings(); break;
      case 'music-next': {
        g.audio?.music.next();
        const t = $('.np-title', this.root);
        if (t) t.textContent = g.audio?.music.title || '';
        break;
      }
      case 'do-update': this.doUpdate(b); break;
      case 'later-update': $('.update-banner', this.root).classList.add('hidden'); break;
      case 'notebook': this.notebook.open(b.dataset.tab || (this.game.storyTrig.length ? 'story' : undefined)); break;
      case 'go-lab': this.openLab(); break;
      case 'go-village': this.closeModal(); g.goVillage(); break;
      case 'go-en': this.closeModal(); g.sail(); break;
      case 'fish-stall': this.openFishStall(); break;
      case 'hg-shop': this.openHgShop(); break;
      case 'see-villager': this.closeModal(); g.focusVillager(b.dataset.id); break;
      case 'knock': this.openVillager(b.dataset.id); break;
      case 'friends': this.friends.open(); break;
      case 'quests': this.quests.open(); break;
      case 'luck': this.luck.open(); break;
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
    if (e.target.dataset?.audio) { if (e.target.type === 'checkbox') this.onAudioInput(e.target); return; }
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
    const tt = goalsSys.titleOf(this.game.save);
    $('.plevel', this.root).textContent = `Lv ${p.level}${tt ? ` · ${tt.icon} ${tt.text}` : ''}`;
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

  /** App Android: che toàn màn hình, không có nút "Để sau" — phải tải bản APK mới. */
  showForceUpdate(v) {
    let el = document.getElementById('force-update');
    if (!el) {
      el = document.createElement('div');
      el.id = 'force-update';
      document.body.appendChild(el);
      el.addEventListener('click', (e) => {
        const b = e.target.closest('[data-fu]');
        if (b) this.doForceUpdate(b);
      });
    }
    this.closeModal?.();
    const notes = (v.notes || []).slice(0, 4).map((n) => `<li>${esc(n)}</li>`).join('');
    el.innerHTML = `
      <div class="fu-card">
        <div class="fu-icon">🌷</div>
        <h2>Có phiên bản mới!</h2>
        <p class="fu-ver">${v.version ? `Bản ${esc(GAME_VERSION)} → <b>${esc(v.version)}</b>` : `Bản đang dùng: ${esc(GAME_VERSION)}`}</p>
        ${v.cloud ? '<p>Tiến độ trên mạng của bạn được lưu bởi bản game mới hơn.</p>' : ''}
        ${notes ? `<ul class="fu-notes">${notes}</ul>` : ''}
        <p class="fu-must">Bạn cần tải bản mới để tiếp tục chơi.</p>
        <button class="btn primary wide" data-fu="${esc(v.apkUrl || ONLINE.apkDownloadUrl || '')}">⬇️ Tải bản mới</button>
        <p class="muted small">Tải xong, mở file <b>${esc(ONLINE.apkFileName || 'TiemHoaGiacMo.apk')}</b> và bấm <b>Cập nhật</b>. Tiến độ chơi được giữ nguyên.</p>
      </div>`;
    el.classList.remove('hidden');
  }

  async doForceUpdate(btn) {
    const url = btn.dataset.fu;
    btn.disabled = true;
    btn.textContent = 'Đang lưu tiến độ...';
    try { await this.game.saveMgr.saveNow('manual'); } catch { /* bỏ qua */ }
    try { await this.game.account?.cloud?.flush(4000); } catch { /* bỏ qua */ }
    try { await openExternal(url); } catch { /* bỏ qua */ }
    btn.disabled = false;
    btn.textContent = '⬇️ Tải lại bản mới';
  }

  async doUpdate(btn) {
    const g = this.game;
    btn.disabled = true;
    btn.textContent = 'Đang lưu...';
    await g.saveMgr.saveNow('manual');
    try { await g.account?.cloud?.flush(4000); } catch { /* bỏ qua */ }
    if (btn.dataset.apk) { await openExternal(btn.dataset.apk); btn.disabled = false; btn.textContent = 'Tải bản mới'; return; }
    try { const regs = await navigator.serviceWorker?.getRegistrations?.(); await Promise.all((regs || []).map((r) => r.update())); } catch { /* bỏ qua */ }
    location.reload();
  }

  /** Chấm số trên nút 🍀: số gói mở được bằng vé đang có */
  updateLuckBadge() {
    const b = $('.lk-badge', this.root);
    if (!b) return;
    const s = this.game.save;
    const t = s.luck?.tickets || {};
    const n = s.player.level >= 2 ? (t.luck || 0) + (s.player.level >= 4 ? t.gold || 0 : 0) : 0;
    b.classList.toggle('hidden', !n);
    b.textContent = n > 9 ? '9+' : n;
  }

  // ---------- nhiệm vụ & trang trí ----------
  updateQuestBadge() {
    const s = this.game.save;
    const n = claimableCount(s) + (s.orders?.list || []).filter((o) => orderCanDeliver(s, o)).length + goalsSys.claimableAch(s) + goalsSys.claimableEvent(s);
    const b = $('.q-badge', this.root);
    b.classList.toggle('hidden', !n);
    b.textContent = n;
  }

  /** Thanh trang trí (GĐ10): kho đồ để chọn, hoặc nút Xoay / Cất / Hủy / Đặt khi đang dời 1 món */
  renderDecorBar() {
    const el = $('.decor-bar', this.root);
    const g = this.game;
    if (!el || !g.decorMode) return;
    const e = g.decorEdit;
    if (e) {
      const d = DECOR[e.id];
      el.innerHTML = `
        <div class="db-row">
          <div class="db-info"><b>${d.icon} ${esc(d.name)}</b>
            <small class="${e.ok ? 'ok' : 'bad'}">${e.ok ? '✅ Đặt được ở đây' : `⛔ ${esc(e.reason || 'Chỗ này không đặt được')}`} · kéo món đồ hoặc chạm chỗ trống để dời</small></div>
        </div>
        <div class="db-row db-btns">
          <button class="btn" data-db="rotate">🔄 Xoay</button>
          ${e.u != null ? '<button class="btn" data-db="store">📦 Cất vào kho</button>' : ''}
          <button class="btn" data-db="cancel">✖ Hủy</button>
          <button class="btn primary ${e.ok ? '' : 'disabled'}" data-db="place">✅ Đặt</button>
        </div>`;
      return;
    }
    const owned = Object.entries(g.save.decor.owned).filter(([id, n]) => n > 0 && DECOR[id]);
    const placed = g.save.decor.placed.length;
    el.innerHTML = `
      <div class="db-row"><div class="db-info"><b>🎨 Trang trí tự do</b>
        <small>Chọn đồ trong kho để đặt · chạm vào đồ đã đặt để dời, xoay hoặc cất · đã đặt ${placed}/${DECOR_RULES.maxPlaced} · 🎨 ${g.beauty()} điểm xinh xắn</small></div>
        <button class="btn primary" data-act="decor-done">Xong</button></div>
      <div class="db-items">${owned.length
        ? owned.map(([id, n]) => `<button class="db-item" data-db="new" data-id="${id}"><span>${DECOR[id].icon}</span><small>${esc(DECOR[id].name)}</small><b>×${n}</b></button>`).join('')
        : '<span class="muted small">Kho trống.</span>'}
        <button class="db-item more" data-act="go-market" data-tab="decor"><span>🧺</span><small>Mua thêm</small></button></div>`;
  }

  onDecorBar(el) {
    const g = this.game;
    switch (el.dataset.db) {
      case 'new': g.startNewDecor(el.dataset.id); break;
      case 'rotate': g.rotateDecorEdit(); break;
      case 'store': g.storeDecorEdit(); break;
      case 'cancel': g.cancelDecorEdit(); break;
      case 'place': g.confirmDecorEdit(); break;
    }
  }

  // ---------- 📜 cốt truyện chính (GĐ20) ----------
  /** Chiếu cảnh rồi hiện quà mốc tim (nếu lựa chọn trong cảnh làm tăng tim) */
  async playStory(scene, opts = {}) {
    this.closeModal();
    const res = await this.game.playScene(scene, opts);
    if (res && !res.chapterDone && !opts.replay) this.showBondRewards();
    if (opts.replay) this.notebook.open('story');
    return res;
  }

  /** Cảnh "tự chạy" (vd lá thư mở đầu): đợi vào game vài giây, không có bảng nào đang mở */
  maybeAutoStory() {
    const g = this.game;
    if (g.cine || this.modal || g.visit || g.decorMode || this.autoBusy) return;
    if (performance.now() - this.bootAt < STORY_RULES.autoDelay * 1000) return;
    if (document.getElementById('minigame') || document.getElementById('force-update') || document.getElementById('fishing')) return;
    const t = g.storyTrig.find((x) => x.via === 'auto');
    if (!t) return;
    this.autoBusy = true;
    this.playStory(t.scene).finally(() => { this.autoBusy = false; });
  }

  updateStoryBadge() {
    const b = $('.nb-badge', this.root);
    if (b) b.classList.toggle('hidden', !this.game.storyTrig.length);
    // nút ⛵ chỉ hiện khi đã có thuyền (GĐ21)
    $('[data-act="go-en"]', this.root)?.classList.toggle('hidden', !storySys.has(this.game.save, 'boat_ready'));
  }

  // ---------- 🎣 câu cá (GĐ22) ----------
  openFish(spotId) {
    const g = this.game;
    if (g.cine || g.visit) return;
    if (!storySys.has(g.save, 'co_fish')) { this.toast('Bạn chưa biết câu cá. Theo cốt truyện 🎣 Cồn Lặng trong 📖 Sổ tay nhé!', 'info'); return; }
    this.fishing.open(spotId);
  }

  /** Quầy cá của Nhum: mua mồi, cần, nâng cấp; đổi cá lấy tiền / hạt giống / phân bón */
  openFishStall(tab) {
    const g = this.game, s = g.save;
    if (!storySys.has(s, 'co_fish')) { this.toast('Quầy cá chưa mở. Nhum còn đang dọn hàng.', 'info'); return; }
    if (tab) this.fishTab = tab;
    const cur = this.fishTab || 'shop';
    const st = fishSys.F(s);
    const tabs = `<div class="mk-tabs"><button class="${cur === 'shop' ? 'on' : ''}" data-fh="tab" data-id="shop">🪱 Mồi & đồ câu</button><button class="${cur === 'bag' ? 'on' : ''}" data-fh="tab" data-id="bag">🐟 Đổi cá <span class="pill">${fishSys.bagCount(s)}</span></button></div>`;
    let body;
    if (cur === 'shop') {
      const baits = Object.entries(BAITS).map(([id, b]) => `<div class="mk-item"><div class="mk-icon">${b.icon}</div><div class="mk-info"><b>${esc(b.name)} <small class="muted">đang có ${st.bait[id] || 0}</small></b><small>${esc(b.desc)}</small></div>
        <div class="mk-buy"><span class="price">${b.price} 💰</span><div class="row-btns">${[5, 20].map((n) => `<button class="btn ${s.player.coins < b.price * n ? 'disabled' : 'primary'}" data-fh="bait" data-id="${id}" data-n="${n}">Mua ${n}</button>`).join('')}</div></div></div>`).join('');
      const rods = Object.entries(RODS).filter(([id, r]) => !r.need || st.rods.includes(id)).map(([id, r]) => {
        const own = st.rods.includes(id), using = st.rod === id;
        return `<div class="mk-item ${using ? 'done' : ''}"><div class="mk-icon">${r.icon}</div><div class="mk-info"><b>${esc(r.name)}</b><small>${esc(r.desc)}</small></div>
          <div class="mk-buy">${using ? '<span class="maxed">✔ Đang dùng</span>' : own ? `<button class="btn" data-fh="rod" data-id="${id}">Dùng</button>` : `<span class="price">${r.price.toLocaleString('vi-VN')} 💰</span><button class="btn ${s.player.coins < r.price ? 'disabled' : 'primary'}" data-fh="rod" data-id="${id}">Mua</button>`}</div></div>`;
      }).join('');
      const gear = Object.entries(GEAR).map(([id, gr]) => {
        const lv = st[id] || 0, max = lv >= gr.prices.length;
        return `<div class="mk-item"><div class="mk-icon">${gr.icon}</div><div class="mk-info"><b>${esc(gr.name)} <small class="muted">bậc ${lv}/${gr.prices.length}</small></b><small>${esc(gr.desc)}</small></div>
          <div class="mk-buy">${max ? '<span class="maxed">✔ Tối đa</span>' : `<span class="price">${gr.prices[lv].toLocaleString('vi-VN')} 💰</span><button class="btn ${s.player.coins < gr.prices[lv] ? 'disabled' : 'primary'}" data-fh="gear" data-id="${id}">Nâng</button>`}</div></div>`;
      }).join('');
      body = `<h3>Mồi câu <small class="muted">· mỗi lần quăng tốn 1 mồi</small></h3><div class="mk-body">${baits}</div><h3>Cần câu</h3><div class="mk-body">${rods}</div><h3>Nâng cấp</h3><div class="mk-body">${gear}</div>`;
    } else {
      const ids = fishSys.FISH_IDS.filter((id) => fishSys.countOf(s, id) > 0);
      const rows = ids.map((id) => {
        const f = FISH[id], n = fishSys.countOf(s, id), d = fishSys.seedDeal(id);
        const keys = Object.keys(st.bag).filter((k) => fishSys.parseFishKey(k).id === id);
        const value = keys.reduce((a, k) => a + fishSys.priceOf(k) * st.bag[k], 0);
        const detail = keys.map((k) => { const p = fishSys.parseFishKey(k); return `${p.shiny ? '✨' : ''}${'★'.repeat(p.q)}×${st.bag[k]}`; }).join(' · ');
        return `<div class="mk-item fh-fish" style="--tc:${FISH_RULES.tierColors[f.t]}"><div class="mk-icon">${f.icon}</div>
          <div class="mk-info"><b>${esc(f.name)} <small class="fh-tier">${FISH_RULES.tierNames[f.t]}</small></b><small>Có ${n} con · ${detail}</small></div>
          <div class="fh-acts"><button class="btn primary" data-fh="sell" data-id="${id}">💰 Bán hết · ${value.toLocaleString('vi-VN')}</button>
            <button class="btn ${n >= d.cost ? '' : 'disabled'}" data-fh="seed" data-id="${id}">🌱 ${d.cost} con → ${d.give} hạt ${esc(d.name)}</button>
            <button class="btn" data-fh="fert" data-id="${id}">🧪 Ủ hết → ${FISH_RULES.fertPer[f.t] * n} phân</button></div></div>`;
      }).join('');
      body = ids.length ? `<div class="row-btns"><button class="btn primary" data-fh="sellall">💰 Bán tất cả · ${fishSys.bagValue(s).toLocaleString('vi-VN')} 💰</button></div><div class="mk-body">${rows}</div>
        <p class="muted small">Mỗi loài cá đổi ra một loại hạt nhất định; cá Hiếm trở lên đổi được hạt màu hiếm không bán ở Chợ. Đổi hạt và ủ phân lấy con ít sao trước, giữ con đẹp lại.</p>`
        : '<div class="empty-shop">🧺<p>Giỏ cá đang trống. Ra mép nước, chạm 🎣 để câu nhé!</p></div>';
    }
    this.openModal('fishstall', `<h2>🐟 Quầy cá của Nhum</h2><div class="mk-wallet">💰 ${s.player.coins.toLocaleString('vi-VN')}</div>${tabs}${body}`, 'wide');
  }

  // ---------- 🏡 Nhà của bạn (GĐ24) ----------
  openHome(tab) {
    const g = this.game, s = g.save, h = homeSys.H(s);
    if (tab) this.homeTab = tab;
    const cur = this.homeTab || 'color';
    const tabs = `<div class="mk-tabs"><button class="${cur === 'color' ? 'on' : ''}" data-hm="tab" data-id="color">🎨 Màu sắc</button><button class="${cur === 'item' ? 'on' : ''}" data-hm="tab" data-id="item">🪴 Vật phẩm <span class="pill">${Object.keys(h.items).length}/${Object.keys(HOME_ITEMS).length}</span></button></div>`;
    let body;
    if (cur === 'color') {
      body = Object.entries(HOME_PARTS).map(([part, label]) => `<h3>${label}</h3><div class="hm-swatches">${Object.entries(HOME_COLORS[part]).map(([id, c]) => {
        const own = homeSys.ownsColor(s, part, id), on = h[part] === id, lock = !own && (c.level || 0) > s.player.level;
        return `<button class="hm-sw ${on ? 'on' : ''} ${lock ? 'disabled' : ''}" data-hm="color" data-part="${part}" data-id="${id}"><i style="background:${c.color}"></i><b>${esc(c.name)}</b><small>${on ? '✔ Đang dùng' : own ? 'Đã có' : lock ? `🔒 Cấp ${c.level}` : `${c.price} 💰`}</small></button>`;
      }).join('')}</div>`).join('');
    } else {
      body = `<div class="mk-body">${Object.entries(HOME_ITEMS).map(([id, it]) => {
        const own = !!h.items[id], on = own && !h.off[id], lock = !own && (it.level || 0) > s.player.level;
        return `<div class="mk-item ${on ? 'done' : ''}"><div class="mk-icon">${it.icon}</div><div class="mk-info"><b>${esc(it.name)}</b><small>${esc(it.desc)}</small></div>
          <div class="mk-buy">${own ? `<button class="btn ${on ? '' : 'primary'}" data-hm="item" data-id="${id}">${on ? 'Cất đi' : 'Bày ra'}</button>` : lock ? `<span class="maxed">🔒 Cấp ${it.level}</span>` : `<span class="price">${it.price.toLocaleString('vi-VN')} 💰</span><button class="btn ${s.player.coins < it.price ? 'disabled' : 'primary'}" data-hm="item" data-id="${id}">Mua</button>`}</div></div>`;
      }).join('')}</div>`;
    }
    this.openModal('home', `<h2>🏡 Nhà của bạn</h2><div class="mk-wallet">💰 ${s.player.coins.toLocaleString('vi-VN')}</div>${tabs}<p class="muted small">Đổi màu đã mua thì miễn phí. Đồ trang trí tự do (ghế, đèn, chậu…) vẫn đặt quanh nhà bằng nút 🎨.</p>${body}`, 'wide');
  }

  onHome(el) {
    const g = this.game, id = el.dataset.id;
    if (el.classList.contains('disabled')) { g.toast('Chưa đủ cấp hoặc không đủ tiền', 'warn'); return; }
    const top = this.scrollBox()?.scrollTop || 0;
    if (el.dataset.hm === 'tab') this.homeTab = id;
    else if (el.dataset.hm === 'color') g.homeAction({ part: el.dataset.part, id });
    else if (el.dataset.hm === 'item') g.homeAction({ item: id });
    this.openHome();
    const box = this.scrollBox();
    if (box && el.dataset.hm !== 'tab') box.scrollTop = top;
  }

  updateManageBadge() {
    const el = this.root.querySelector('.ql-badge');
    if (!el) return;
    const s = this.game.save;
    const n = (passSys.canCheckin(s) ? 1 : 0) + passSys.claimable(s);
    el.classList.toggle('hidden', !n);
    el.textContent = n ? String(n) : '';
  }

  // ---------- 🌸 Đảo Ngàn Hương (GĐ23) ----------
  /** Chạm chỗ hái ⇒ mini game ⇒ nhận nguyên liệu */
  async openGather(id) {
    const g = this.game, def = GATHER[id];
    if (!def || g.cine || g.visit || this.hgBusy) return;
    const ok = craft.gatherOpen(g.save, id, g.hgCtx());
    if (!ok.ok) { this.toast(ok.msg, 'info'); return; }
    const [title, icon] = HG_GAME_NAMES[def.game];
    const level = def.hard ? 2 : craft.levelOf(g.save, def.game);
    this.closeModal();
    this.hgBusy = true;
    try {
      const res = await runMiniGame(def.game, { title: `${def.name} · ${title}`, icon, ask: `Còn ${ok.left} lượt hái hôm nay. Thưởng: ${Object.keys(def.give).map((k) => (k === 'any' ? '🎁 nguyên liệu bất kỳ' : `${INGREDIENTS[k].icon} ${INGREDIENTS[k].name}`)).join(', ')}`, sfx: g.audio?.sfx, level, record: g.save.mg?.[def.game] });
      if (!res.quit) g.hgGather(id, res.stars, res.combo);
    } finally { this.hgBusy = false; }
  }

  /** Bảng Tiệm Hương Nhài: chế biến · kệ hàng · nguyên liệu · Sổ Hương */
  openHgShop(tab) {
    const g = this.game, s = g.save;
    if (!storySys.has(s, 'hg_shop')) { this.toast(storySys.has(s, 'hg_bridge') ? '📄 Tiệm đang dán giấy sang nhượng. Theo cốt truyện 🌸 Ngàn Hương nhé!' : 'Tiệm ở bên kia cầu mục.', 'info'); return; }
    if (tab) this.hgTab = tab;
    const cur = this.hgTab || 'make';
    const has = (k) => storySys.has(s, k);
    const c = craft.C(s);
    const tabs = `<div class="mk-tabs">${[['make', '🧪 Chế biến'], ['shelf', `🧺 Kệ hàng <span class="pill">${craft.goodsCount(s)}</span>`], ['ing', '🌿 Nguyên liệu'], ['book', `📖 Sổ Hương <span class="pill">${craft.pageCount(s)}/12</span>`]].map(([k, n]) => `<button class="${cur === k ? 'on' : ''}" data-hg="tab" data-id="${k}">${n}</button>`).join('')}</div>`;
    const need = (p) => [
      ...Object.entries(p.ing || {}).map(([k, n]) => { const h = craft.ingOf(s, k); return `<span class="${h >= n ? 'ok' : 'miss'}">${INGREDIENTS[k].icon} ${INGREDIENTS[k].name} ${h}/${n}</span>`; }),
      ...Object.entries(p.flowers || {}).map(([sp, n]) => { const h = craft.flowerCount(s, sp); return `<span class="${h >= n ? 'ok' : 'miss'}">${FLOWERS[sp].icon} ${FLOWERS[sp].name} ${h}/${n}</span>`; }),
    ].join('');
    let body = '';
    if (cur === 'make') {
      const list = craft.PRODUCT_IDS.filter((id) => craft.known(id, has) && !(PRODUCTS[id].once && craft.countOf(s, `made:${id}`)));
      body = list.map((id) => {
        const p = PRODUCTS[id], can = craft.canMake(s, id, has).ok, [gn, gi] = HG_GAME_NAMES[p.game];
        return `<div class="mk-item hg-recipe ${can ? '' : 'dim'}"><div class="mk-icon">${p.icon}</div>
          <div class="mk-info"><b>${esc(p.name)}${p.sell === false ? ' <small class="muted">· chỉ pha một lần</small>' : ` <small class="muted">· ${craft.priceOf(id, 1).toLocaleString('vi-VN')} 💰/món</small>`}</b><small class="hg-need">${need(p)}</small><small class="muted">${gi} ${gn} · ⭐ càng nhiều càng được nhiều món & giá cao</small></div>
          <div class="mk-buy"><button class="btn ${can ? 'primary' : 'disabled'}" data-hg="make" data-id="${id}">Làm</button></div></div>`;
      }).join('') || '<div class="empty-shop">📖<p>Chưa biết công thức nào. Theo cốt truyện để học nhé.</p></div>';
      body = `<p class="muted small">Hoa trong kho mấy sao cũng dùng được (tiệm lấy hoa ít sao trước). Nguyên liệu hái ở các vùng trên đảo.</p><div class="mk-body">${body}</div>`;
    } else if (cur === 'shelf') {
      const goods = craft.goodsList(s);
      const open = g.clock.hourFloat >= CRAFT_RULES.open[0] && g.clock.hourFloat < CRAFT_RULES.open[1];
      body = `<p class="muted small">🧳 Khách du lịch ghé mua dần trong giờ mở cửa (${CRAFT_RULES.open[0]}–${CRAFT_RULES.open[1]} giờ) — ${open ? '<b>đang mở cửa</b>' : 'đang đóng cửa'}. Đã bán được ${c.earned.toLocaleString('vi-VN')} 💰. Cần tiền gấp thì bán ngay cho Sen (${Math.round(CRAFT_RULES.quick * 100)}% giá).</p>`
        + (goods.length ? `<div class="mk-body">${goods.map((x) => { const p = PRODUCTS[x.id]; return `<div class="mk-item"><div class="mk-icon">${p.icon}</div><div class="mk-info"><b>${esc(p.name)} ${'⭐'.repeat(x.q) || '<small class="muted">(mẻ hơi hỏng)</small>'}</b><small>Còn ${x.n} món · ${x.price.toLocaleString('vi-VN')} 💰/món</small></div>
          <div class="mk-buy"><button class="btn" data-hg="quick" data-id="${x.key}">💸 Bán ngay · ${(Math.round(x.price * CRAFT_RULES.quick) * x.n).toLocaleString('vi-VN')}</button></div></div>`; }).join('')}</div>`
          : '<div class="empty-shop">🧺<p>Kệ đang trống. Vào thẻ 🧪 Chế biến để làm hàng nhé!</p></div>');
    } else if (cur === 'ing') {
      const ings = Object.entries(INGREDIENTS).filter(([k, d]) => !d.story || craft.ingOf(s, k) > 0).map(([k, d]) => `<div class="mk-item"><div class="mk-icon">${d.icon}</div><div class="mk-info"><b>${esc(d.name)}</b><small>Đang có ${craft.ingOf(s, k)}</small></div>
        <div class="mk-buy">${d.buy ? `<span class="price">${d.buy} 💰</span><div class="row-btns">${[1, 5].map((n) => `<button class="btn ${s.player.coins < d.buy * n ? 'disabled' : 'primary'}" data-hg="buy" data-id="${k}" data-n="${n}">Mua ${n}</button>`).join('')}</div>` : ''}</div></div>`).join('');
      const spots = Object.entries(GATHER).filter(([, gd]) => !gd.story && (!gd.need || has(gd.need))).map(([id, gd]) => {
        const st = craft.gatherOpen(s, id, g.hgCtx());
        return `<div class="mk-item"><div class="mk-icon">${gd.icon}</div><div class="mk-info"><b>${esc(gd.name)}</b><small>${HG_GAME_NAMES[gd.game][1]} ${HG_GAME_NAMES[gd.game][0]} → ${Object.keys(gd.give).map((k) => (k === 'any' ? '🎁' : INGREDIENTS[k].icon)).join(' ')}${gd.hours ? ` · ${gd.hours[0]}–${gd.hours[1]} giờ` : ''}</small><small class="${st.ok ? '' : 'muted'}">${st.ok ? `Còn ${st.left} lượt hôm nay` : esc(st.msg)}</small></div></div>`;
      }).join('');
      body = `<h3>Nguyên liệu</h3><div class="mk-body">${ings}</div><h3>Chỗ hái trên đảo <small class="muted">· chạm biểu tượng trên bản đồ</small></h3><div class="mk-body">${spots}</div>`;
    } else {
      body = `<div class="hg-book">${CG_TEXT.hpages.map((pg, i) => c.pages[i]
        ? `<div class="hg-page"><small>Trang ${i + 1} · ${esc(pg.year)}</small><b>${esc(pg.title)}</b>${pg.text.split('\n').map((l) => `<p>${esc(l)}</p>`).join('')}</div>`
        : `<div class="hg-page locked"><small>Trang ${i + 1}</small><b>???</b><p>${(() => { const id = craft.PRODUCT_IDS.find((k) => PRODUCTS[k].page === i); return craft.known(id, has) ? `Làm ${PRODUCTS[id].icon} ${esc(PRODUCTS[id].name)} lần đầu để mở trang này.` : 'Chưa biết công thức.'; })()}</p></div>`).join('')}</div>`;
    }
    this.openModal('hgshop', `<h2>🌸 ${storySys.has(s, 'hg_stay') && s.story.done.h17 ? 'Tiệm Nhài & Sen' : 'Tiệm Hương Nhài'}</h2><div class="mk-wallet">💰 ${s.player.coins.toLocaleString('vi-VN')}</div>${tabs}${body}`, 'wide');
  }

  async onHgShop(el) {
    const g = this.game, s = g.save, id = el.dataset.id;
    if (el.classList.contains('disabled')) { g.toast(el.dataset.hg === 'make' ? 'Chưa đủ nguyên liệu' : 'Không đủ tiền', 'warn'); return; }
    const top = this.scrollBox()?.scrollTop || 0;
    switch (el.dataset.hg) {
      case 'tab': this.hgTab = id; break;
      case 'buy': g.hgBuy(id, +el.dataset.n); break;
      case 'quick': g.hgQuickSell(id); break;
      case 'make': {
        const p = PRODUCTS[id], [gn, gi] = HG_GAME_NAMES[p.game];
        this.closeModal();
        const res = await runMiniGame(p.game, { title: `${p.name} · ${gn}`, icon: gi, sfx: g.audio?.sfx, level: craft.levelOf(s, p.game), record: s.mg?.[p.game] });
        if (res.quit) { this.toast('Đã dừng, nguyên liệu vẫn còn nguyên.', 'info'); return; }
        g.hgMake(id, res.stars, res.combo);
        if (!this.modal && !g.cine) this.openHgShop('make');
        return;
      }
      default:
    }
    this.openHgShop();
    const box = this.scrollBox();
    if (box && el.dataset.hg !== 'tab') box.scrollTop = top;
  }

  onFishStall(el) {
    const g = this.game, s = g.save, id = el.dataset.id;
    if (el.classList.contains('disabled')) { g.toast(el.dataset.fh === 'seed' ? 'Chưa đủ số cá để đổi hạt' : 'Không đủ tiền', 'warn'); return; }
    const top = this.scrollBox()?.scrollTop || 0;
    switch (el.dataset.fh) {
      case 'tab': this.fishTab = id; break;
      case 'bait': g.afterFishTrade(fishSys.buyBait(s, id, +el.dataset.n)); break;
      case 'rod': g.afterFishTrade(fishSys.buyRod(s, id)); break;
      case 'gear': g.afterFishTrade(fishSys.buyGear(s, id)); break;
      case 'sell': { let coins = 0, n = 0; for (const k of Object.keys(fishSys.F(s).bag).filter((q) => fishSys.parseFishKey(q).id === id)) { const r = fishSys.sellFish(s, k); coins += r.coins || 0; n += r.n || 0; } g.afterFishTrade({ ok: n > 0, coins, n }); break; }
      case 'sellall': g.afterFishTrade(fishSys.sellAll(s)); break;
      case 'seed': g.afterFishTrade(fishSys.tradeSeed(s, id)); break;
      case 'fert': g.afterFishTrade(fishSys.tradeFert(s, id, Infinity)); break;
      default:
    }
    this.openFishStall();
    const box = this.scrollBox();
    if (box && el.dataset.fh !== 'tab') box.scrollTop = top;
  }

  /** 🌱 Kệ Nụ Mộng (GĐ20B): mỗi nụ đang đợi gì; hoa đã nở thì Trao lại hoặc Giữ ở tiệm */
  openBuds() {
    const g = this.game;
    const list = storySys.budList(g.save, g.today);
    const cards = list.map(({ id, def, st, streak, need, canWater }) => {
      if (!st) return '<div class="bd-card none"><span class="bd-icon">❔</span><div class="bd-info"><b>Chỗ còn trống</b><small>Một giấc mơ nào đó vẫn đang nằm quên ở đâu đó trên đảo.</small></div></div>';
      let body, btns = '';
      if (st === 'bud') {
        body = `<small>${esc(def.hint)}</small>${need ? `<small class="bd-prog">💧 Đã tưới <b>${streak}/${need}</b> ngày liền</small>` : ''}`;
        if (need) btns = `<button class="btn ${canWater ? 'primary' : 'disabled'}" data-bd="water" data-id="${id}">💧 Tưới${canWater ? '' : ' ✓'}</button>`;
      } else if (st === 'bloom' || st === 'kept') {
        body = `<small>Giấc mơ của ${esc(def.who)}: <i>${esc(def.dream)}</i>.</small><small>${st === 'kept' ? `🏪 Đang giữ ở tiệm (+${STORY_RULES.budBeauty} điểm xinh xắn). Vẫn trao lại được.` : 'Hoa đã nở. Trao lại thì người ấy nhớ ra giấc mơ của mình; giữ thì tiệm đẹp hơn.'}</small>`;
        btns = `<button class="btn primary" data-bd="give" data-id="${id}">🎁 Trao lại ${esc(def.who)}</button>${st === 'bloom' ? `<button class="btn" data-bd="keep" data-id="${id}">🏪 Giữ ở tiệm</button>` : ''}`;
      } else body = `<small>✔ Đã trao lại cho ${esc(def.who)}. Bông hoa đang sáng trước nhà họ.</small>`;
      const title = st === 'bud' ? `Nụ Mộng của ${def.who}` : def.flower;
      return `<div class="bd-card ${st}" style="--bc:${def.glow}"><span class="bd-icon">${st === 'bud' ? '🌱' : def.icon}</span><div class="bd-info"><b>${esc(title)}</b>${body}</div><div class="bd-btns">${btns}</div></div>`;
    }).join('');
    this.openModal('buds', `<h2>🌱 Kệ Nụ Mộng</h2>
      <p class="muted small">Mỗi nụ là một giấc mơ người làng bỏ lại, chỉ nở đúng khoảnh khắc của giấc mơ ấy. Đã nở ${storySys.bloomCount(g.save)}/5 · đã trao lại ${storySys.givenCount(g.save)}/5.</p>
      <div class="bd-list">${cards}</div>`, 'wide');
  }

  onBudAct(el) {
    const g = this.game, id = el.dataset.id;
    switch (el.dataset.bd) {
      case 'water': g.budWater(id); this.openBuds(); break;
      case 'keep': g.budKeep(id); if (this.modal === 'buds') this.openBuds(); break;
      case 'give':
        // trao rồi không lấy lại được ⇒ bấm 2 lần
        if (!el.dataset.armed) {
          el.dataset.armed = '1'; el.textContent = 'Trao thật nhé? (không lấy lại được)';
          setTimeout(() => { if (el.isConnected) { delete el.dataset.armed; el.textContent = `🎁 Trao lại ${BUDS[id].who}`; } }, 3000);
          return;
        }
        this.playStory(BUDS[id].give);
        break;
      default:
    }
  }

  showChapterDone({ ch, reward, next, ending }) {
    const items = [reward.coins && `+${reward.coins.toLocaleString('vi-VN')} 💰`, reward.xp && `+${reward.xp} XP`, reward.luck && `+${reward.luck} 🎟️ vé may mắn`, reward.gold && `+${reward.gold} 🎫 vé vàng`, reward.outfit && `👗 ${WARDROBE[reward.outfit]?.name || ''}`].filter(Boolean);
    const END = {
      wake: ['Kết thúc: Thức giấc', 'Bà Diệp đã tỉnh dậy và ngồi uống trà bên hiên tiệm mỗi ngày. Mơ đã về với bà.'],
      dream: ['Kết thúc: Mơ tiếp', 'Bà Diệp vẫn mơ dưới gốc Cây Mộng. Mơ ở lại trông tiệm cùng bạn, và bạn nhớ bà giùm cả làng.'],
      all: ['Kết thúc ẩn: Cả làng cùng mơ', 'Cả làng đã nhớ lại. Bà Diệp tỉnh dậy, Mơ vẫn ở đây, và trước hiên tiệm có thêm một ngọn đèn nhỏ không bao giờ tắt.'],
    }[ch.id === 'c7' ? ending : null] || (ch.id === 'l6' ? (storySys.has(this.game.save, 'co_clear') ? ['Kết thúc: Sương tan', 'Chú Lưới đã gặp lại con trai, một đêm. Sương tan hết, và mỗi chiều có một bông hoa trắng trên rặng đá.'] : ['Kết thúc: Ở lại trong sương', 'Chú Lưới đã đi theo con. Sương vẫn phủ Cồn Lặng, nhưng đêm nào Nhum cũng thắp đèn.']) : null) || (ch.id === 'e5' ? ['Hết truyện: Cơn mưa đi lạc', storySys.has(this.game.save, 'en_off') ? 'Ngọn đèn Mũi Én đã tắt sau ba mươi năm, để người gác đèn được ngủ một giấc trọn.' : 'Ngọn đèn Mũi Én vẫn sáng, giờ là cho những con thuyền của người khác.'] : null);
    const arcName = ch.arc === 'en' ? 'Mũi Én · ' : ch.arc === 'lang' ? 'Cồn Lặng · ' : '';
    let nextHtml;
    if (!next || next.finished) nextHtml = `${END ? `<p class="fin">🌟 ${esc(END[0])}</p><p class="small">${esc(END[1])}</p>` : ''}<p class="muted small">Cảm ơn bạn đã đi hết câu chuyện cùng Mơ 💛 Vào 📖 Sổ tay › Cốt truyện, xem lại cảnh cuối để thử lựa chọn khác${ch.id !== 'c7' || ending === 'all' ? '' : ' (trao lại đủ 5 Hoa Mộng sẽ mở thêm một lựa chọn)'}.</p>`;
    else if (next.locked) nextHtml = `<p class="small">Chương ${next.ch.n} — <b>${esc(next.ch.title)}</b> mở khi: ${next.checks.map((c) => `${c.ok ? '✅' : '⬜'} ${esc(c.text)}`).join(' · ')}</p>`;
    else nextHtml = `<p class="small">Tiếp theo — Chương ${next.ch.n}: <b>${esc(next.ch.title)}</b><br>🎯 ${esc(next.step.goal)}</p>`;
    this.openModal('story', `<div class="story chapter-done">
      <div class="cd-icon">📜</div><small class="muted">${arcName}Hết chương ${ch.n}</small><h2>${esc(ch.title)}</h2>
      <p class="story-text">${esc(ch.outro || '')}</p>
      <h3>🎁 Quà tặng</h3><ul class="unlocks">${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>
      ${nextHtml}
      <p class="muted small">Xem lại các cảnh đã qua ở 📖 Sổ tay › Cốt truyện.</p>
      <button class="btn primary wide" data-act="close-modal">Tiếp tục</button></div>`);
  }

  // ---------- làng (GĐ11) ----------
  heartBar(id) {
    const s = this.game.save;
    const h = rel.heartsOf(s, id), f = rel.heartFrac(s, id);
    let out = '';
    for (let i = 0; i < FRIEND.maxHearts; i++) out += i < h ? '<i class="ht">❤️</i>' : i === h && f > 0 ? `<i class="ht" style="opacity:${(0.35 + f * 0.65).toFixed(2)}">💗</i>` : '<i class="ht">🤍</i>';
    return `<div class="heart-bar" title="${h}/${FRIEND.maxHearts}">${out}</div><small class="tier">${esc(rel.tierName(h))} · ${h}/${FRIEND.maxHearts} tim</small>`;
  }

  openVillager(id) {
    const g = this.game;
    const info = villagerInfo(id);
    if (!info) return;
    const ctx = g.villageCtx();
    const st = g.villagers.stateOf(id);
    const act = ACTIVITIES[st?.act] || null;
    const day = g.today;
    const meet = g.canMeet(id);
    const canTalk = rel.canTalk(g.save, id, day);
    const canGift = rel.canGift(g.save, id, day);
    const ev = rel.availableEvent(g.save, id);
    const bday = rel.isBirthday(id, day);
    const chapters = info.regular ? (g.save.regulars?.[id]?.hearts || 0) : null;
    const hasFlowers = Object.values(g.save.inventory.flowers).some((n) => n > 0);
    const favor = g.favorToday(id);
    const parcelId = Object.keys(PARCELS).find((k) => PARCELS[k].owner === id && !landSys.ownsParcel(g.save, k));
    const landBtn = parcelId ? `<button class="btn wide" data-ld="open" data-id="${parcelId}">🗺️ Hỏi mua ${esc(PARCELS[parcelId].name.toLowerCase())}</button>` : '';
    // 📜 cốt truyện chính: người này có chuyện để hỏi ⇒ nút nổi bật ở trên cùng; câu chào đổi theo tiến độ truyện
    // (0.23) nút cốt truyện hiện cả khi người đó đang ở trong nhà (cảnh truyện sẽ mời họ ra cửa); chỉ ẩn khi họ vắng hẳn
    const stTrig = !g.villagers.stateOf(id)?.state?.absent ? g.storyTrigger('villager', id) : null;
    const storyBtn = stTrig ? `<button class="btn primary glow wide story-btn" data-vg="story" data-id="${id}" data-scene="${stTrig.scene}">📜 ${esc(stTrig.label || 'Cốt truyện')}</button>` : '';
    const hello = storySys.storyLine(g.save, id) || greeting(id, ctx);
    this.openModal('villager', `
      <div class="vg-head">${avatarSVG(info.look, 64)}<div><h2>${esc(info.name)}${bday ? ' 🎂' : ''}</h2><small class="muted">${esc(info.role)}${info.home ? ` · ${esc(HOUSES[info.home].name)}` : ''}</small>${this.heartBar(id)}</div></div>
      <p class="vg-say">“${esc(hello)}”</p>
      ${storyBtn}
      ${id === 'nhum' && storySys.has(g.save, 'co_fish') ? '<button class="btn wide" data-act="fish-stall">🐟 Mở quầy cá</button>' : ''}
      ${['sen', 'ba_nhai'].includes(id) && storySys.has(g.save, 'hg_shop') ? '<button class="btn wide" data-act="hg-shop">🌸 Vào Tiệm Hương Nhài</button>' : ''}
      ${bday ? `<p class="bday">🎂 Hôm nay là <b>sinh nhật</b> của ${esc(info.name)}! Tặng quà được gấp đôi tình thân.</p>` : ''}
      <div class="vg-acts">
        <button class="btn ${ev ? 'primary glow' : 'primary'} ${!meet.ok || !canTalk ? 'disabled' : ''}" data-vg="talk" data-id="${id}">${ev ? `✨ ${esc(ev.title)}` : '💬 Trò chuyện'}${canTalk ? '' : ' ✓'}</button>
        <button class="btn ${!meet.ok || !canGift || !hasFlowers ? 'disabled' : ''}" data-vg="gift" data-id="${id}">🎁 Tặng hoa${canGift ? '' : ' ✓'}</button>
      </div>
      ${landBtn}
      ${favor && meet.ok ? `<button class="btn primary glow wide favor-btn" data-vg="favor" data-id="${id}">🙏 ${esc(info.name)} nhờ bạn: ${esc(favor.icon)} ${esc(favor.title)} <small>· ${DIFFICULTY.icons[favorsSys.difficultyOf(g.save, id)]} ${DIFFICULTY.names[favorsSys.difficultyOf(g.save, id)]}</small></button>` : ''}
      ${!meet.ok ? `<p class="muted small">${esc(meet.reason)}</p>` : !canTalk && !canGift && !favor ? '<p class="muted small">Hôm nay đã trò chuyện và tặng quà rồi — mai ghé tiếp nhé!</p>' : ''}
      <div class="kv"><span>📍 Bây giờ</span><b>${act ? `${act.icon} ${esc(act.name)}` : '—'}${st?.walking ? ' (đang đi tới)' : ''}</b></div>
      ${chapters != null ? `<div class="kv"><span>🌷 Chuyện ở tiệm hoa</span><b>${chapters}/5 chương</b></div>` : ''}
      ${this.likesLine(id)}
      <p class="muted small">${esc(info.bio)}</p>`);
  }

  /** Các loại hoa đã biết người này thích/ghét (từ những lần tặng trước) */
  likesLine(id) {
    const known = rel.relOf(this.game.save, id).known;
    const by = (lvl) => Object.entries(known).filter(([, l]) => l === lvl).map(([k]) => { const v = variants.parseVkey(k); return variants.variantName(v.species, v.variant); });
    const parts = [['love', by('love')], ['like', by('like')], ['dislike', [...by('dislike'), ...by('hate')]]].filter(([, l]) => l.length);
    if (!parts.length) return '<p class="muted small">💡 Tặng hoa để biết người này thích loài nào.</p>';
    return `<div class="likes">${parts.map(([lvl, l]) => `<span>${REACTION[lvl].icon} ${esc(l.join(', '))}</span>`).join('')}</div>`;
  }

  onVillagerAct(el) {
    const g = this.game;
    const id = el.dataset.id || this.talk?.id || this.giftFor;
    switch (el.dataset.vg) {
      case 'talk': {
        if (el.classList.contains('disabled')) { if (!g.canMeet(id).ok) g.toast(g.canMeet(id).reason, 'info'); else g.toast('Hôm nay đã trò chuyện rồi, mai ghé tiếp nhé!', 'info'); return; }
        const t = g.startTalk(id);
        if (!t) return;
        this.talk = { id, talk: t, scene: t.start || 0, result: null };
        this.renderTalk();
        break;
      }
      case 'choose': {
        const tk = this.talk;
        if (!tk || tk.result) return;
        const res = g.talkChoose(tk.id, tk.talk, tk.scene, +el.dataset.i);
        if (!res) return;
        tk.result = res;
        this.renderTalk();
        break;
      }
      case 'next': {
        const tk = this.talk;
        if (!tk?.result || tk.result.next == null) return;
        tk.scene = tk.result.next; tk.result = null;
        this.renderTalk();
        break;
      }
      case 'done': this.talk = null; this.giftFor = null; if (!this.showBondRewards()) this.openVillager(id); break;
      case 'favor': this.startFavor(id); break;
      case 'story': this.playStory(el.dataset.scene); break;
      case 'gift':
        if (el.classList.contains('disabled')) { const m = g.canMeet(id); g.toast(!m.ok ? m.reason : !rel.canGift(g.save, id, g.today) ? 'Hôm nay đã tặng quà rồi' : 'Kho chưa có hoa — thu hoạch hoa rồi quay lại nhé', 'info'); return; }
        this.giftFor = id; this.openGift(id); break;
      case 'give': {
        const res = g.giftTo(this.giftFor, el.dataset.key);
        if (res) this.showGiftResult(this.giftFor, res);
        break;
      }
    }
  }

  // ---------- mua đất của dân làng (GĐ13) ----------
  openParcel(id, note = '') {
    const g = this.game;
    const P = PARCELS[id];
    if (!P) return;
    const info = villagerInfo(P.owner);
    if (landSys.ownsParcel(g.save, id)) { this.openModal('parcel', `<h2>🗺️ ${esc(P.name)}</h2><p>✅ Mảnh đất này đã là của bạn.</p>`); return; }
    const q = g.landQuote(id);
    const meet = g.canMeet(P.owner);
    let body;
    if (!q.ok) {
      const req = q.reason === 'hearts' ? `<p class="land-req">❤️ Cần thân với ${esc(info.name)} ít nhất <b>${q.need} tim</b> (đang có ${q.hearts}). Trò chuyện, tặng hoa và giúp việc để thân hơn.</p>`
        : q.reason === 'level' ? `<p class="land-req">⭐ Cần đạt <b>cấp ${P.level}</b>.</p>`
          : q.reason === 'mood' ? `<p class="land-req">${q.mood.icon} Hôm nay ${esc(info.name)} <b>không muốn bán</b>. Mai thử lại nhé!</p>`
            : q.reason === 'angry' ? '<p class="land-req">😤 Trả giá hỏng rồi, hôm nay không bán nữa. Mai quay lại nhé.</p>' : '';
      body = `${q.reason !== 'level' && q.line ? `<p class="vg-say">“${esc(q.line)}”</p>` : ''}${req}`;
    } else {
      const base = P.price;
      body = `
        <p class="vg-say">“${esc(q.line)}”</p>
        <div class="kv"><span>${q.mood.icon} Tâm trạng hôm nay</span><b>${esc(q.mood.name)}</b></div>
        <div class="kv"><span>🏷️ Giá gốc</span><b>${base.toLocaleString('vi-VN')} 💰</b></div>
        <div class="kv"><span>💰 Giá hôm nay${q.bargained ? ' (đã trả giá)' : ''}</span><b class="land-price">${q.price.toLocaleString('vi-VN')} 💰</b></div>
        <p class="muted small">Càng thân càng rẻ (mỗi tim trên ${q.need} bớt ${Math.round(LAND_RULES.discountPerHeart * 100)}%), giá đổi theo tâm trạng mỗi ngày. Mua thêm 9 ô đất, đồ trang trí đặt trên mảnh đất sẽ được cất vào kho.</p>
        ${note ? `<p class="land-note">${esc(note)}</p>` : ''}
        <div class="vg-acts">
          <button class="btn primary ${!meet.ok || g.save.player.coins < q.price ? 'disabled' : ''}" data-ld="buy" data-id="${id}">💰 Mua ${q.price.toLocaleString('vi-VN')}</button>
          ${q.canBargain ? `<button class="btn ${!meet.ok ? 'disabled' : ''}" data-ld="bargain" data-id="${id}">💬 Trả giá (~${Math.round(q.bargainChance * 100)}%)</button>` : ''}
        </div>
        ${!meet.ok ? `<p class="muted small">${esc(meet.reason)} — gặp chủ đất mới mua được.</p>` : g.save.player.coins < q.price ? '<p class="muted small">Chưa đủ tiền.</p>' : ''}`;
    }
    this.openModal('parcel', `
      <h2>🗺️ ${esc(P.name)}</h2>
      <div class="vg-head">${avatarSVG(info.look, 52)}<div><b>${esc(info.name)}</b> <small class="muted">chủ đất</small>${this.heartBar(P.owner)}</div></div>
      <p class="muted small">📜 ${esc(P.story)}</p>
      ${body}`);
  }

  onLandAct(el) {
    const g = this.game;
    const id = el.dataset.id;
    if (el.dataset.ld === 'open') { this.openParcel(id); return; }
    if (el.classList.contains('disabled')) { const m = g.canMeet(PARCELS[id].owner); g.toast(!m.ok ? m.reason : 'Chưa đủ tiền', 'info'); return; }
    if (el.dataset.ld === 'bargain') {
      const r = g.landBargain(id);
      if (!r) return;
      g.toast(r.success ? `🤝 Trả giá thành công! Bớt thêm ${Math.round(LAND_RULES.bargainOff * 100)}%` : '😤 Trả giá hỏng rồi...', r.success ? 'good' : 'warn');
      this.openParcel(id, `${PARCELS[id].owner ? villagerInfo(PARCELS[id].owner).name : ''}: “${r.line}”`);
      return;
    }
    if (el.dataset.ld === 'buy') {
      const r = g.buyParcel(id);
      if (!r?.ok) return;
      const P = PARCELS[id];
      const info = villagerInfo(P.owner);
      this.openModal('parcel', `<div class="story">
        <div class="story-av">${avatarSVG(info.look, 72)}</div><h2>🗺️ ${esc(P.name)}</h2>${this.heartBar(P.owner)}
        <p class="story-text">“${esc(r.line)}”</p>
        <p class="fp-chip up">Đã trả ${r.price.toLocaleString('vi-VN')} 💰 · +${LAND_RULES.buyThanksFp} tình thân 💗 · thêm 9 ô đất</p>
        <button class="btn primary wide" data-vg="done" data-id="${P.owner}">Tuyệt vời!</button></div>`);
    }
  }

  /** Nhận lời giúp: chơi mini game rồi trao thưởng */
  async startFavor(id) {
    const g = this.game;
    const favor = g.favorToday(id);
    if (!favor || !g.canMeet(id).ok) return;
    const info = villagerInfo(id);
    this.closeModal();
    const level = favorsSys.difficultyOf(g.save, id);
    const { stars, quit, combo } = await runMiniGame(favor.game, { title: favor.title, icon: favor.icon, ask: favor.ask, who: info.name, sfx: g.audio?.sfx, level, record: g.save.mg?.[favor.game] });
    const res = g.finishFavorGame(id, favor, stars, level, combo);
    this.openModal('favor', `
      <div class="vg-head">${avatarSVG(info.look, 56)}<div><b>${esc(info.name)}</b>${this.heartBar(id)}</div></div>
      <p class="fav-stars">${'⭐'.repeat(res.stars)}${'☆'.repeat(3 - res.stars)}</p>
      <p class="vg-say">“${esc(quit ? 'Ơ, bạn bận à? Không sao, mai mình nhờ lại nhé!' : res.stars > 0 ? favor.thanks : favor.fail)}”</p>
      <p class="fp-chip up">+${res.fp} điểm tình thân 💗${res.coins ? ` · +${res.coins} 💰 tiền công` : ''}${res.after > res.before ? ` · lên ${res.after} ❤️!` : ''}${res.level ? ` · ${DIFFICULTY.icons[res.level]} mức ${DIFFICULTY.names[res.level]} ×${FAVOR_RULES.diffMult[res.level]}` : ''}</p>
      ${res.newBest ? '<p class="fp-chip up">🏆 Kỷ lục mới!</p>' : ''}
      <p class="muted small">Kỷ lục việc này: ${'⭐'.repeat(res.best) || 'chưa có sao'} · 3⭐ = +${FAVOR_RULES.fp[3]} tình thân, +${FAVOR_RULES.coins[3]} 💰</p>
      <button class="btn primary wide" data-vg="done" data-id="${id}">Xong</button>`);
  }

  renderTalk() {
    const g = this.game;
    const tk = this.talk;
    const info = villagerInfo(tk.id);
    const flags = g.save.village.flags;
    const sc = tk.talk.scenes[tk.scene];
    const title = tk.talk.title ? `<p class="ev-title">✨ Sự kiện tình thân: ${esc(tk.talk.title)} <small>(${tk.scene + 1}/${tk.talk.scenes.length})</small></p>` : '';
    let foot;
    if (tk.result) {
      const d = tk.result.delta;
      foot = `<p class="vg-say reply">“${esc(tk.result.reply)}”</p>
        <p class="fp-chip ${d > 0 ? 'up' : d < 0 ? 'down' : ''}">${d > 0 ? `+${d}` : d} điểm tình thân ${d > 0 ? '💗' : d < 0 ? '💔' : ''}${tk.result.after > tk.result.before ? ` · lên ${tk.result.after} ❤️!` : ''}</p>
        ${tk.result.next != null ? '<button class="btn primary wide" data-vg="next">Tiếp tục ›</button>' : `<button class="btn primary wide" data-vg="done" data-id="${tk.id}">Xong</button>`}`;
    } else {
      foot = `<div class="choices">${sc.ch.map((c, i) => `<button class="btn choice" data-vg="choose" data-i="${i}">${esc(rel.fmt(c.t, flags))}</button>`).join('')}</div>`;
    }
    this.openModal('talk', `
      ${title}
      <div class="vg-head">${avatarSVG(info.look, 56)}<div><b>${esc(info.name)}</b>${this.heartBar(tk.id)}</div></div>
      <p class="vg-say">“${esc(rel.fmt(sc.say, flags))}”</p>
      ${foot}`);
  }

  openGift(id) {
    const g = this.game;
    const info = villagerInfo(id);
    const stacks = Object.entries(g.save.inventory.flowers).filter(([, n]) => n > 0)
      .sort((a, b) => variants.parseFlowerKey(b[0]).q - variants.parseFlowerKey(a[0]).q);
    const bday = rel.isBirthday(id, g.today);
    this.openModal('gift', `
      <h2>🎁 Tặng hoa cho ${esc(info.name)}</h2>
      ${bday ? '<p class="bday">🎂 Sinh nhật hôm nay: tình thân nhận được × 2!</p>' : ''}
      <p class="muted small">Mỗi ngày tặng 1 bông. Hoa nhiều ⭐ được quý hơn. ${esc(REACTION.love.icon)} = đã biết người này rất thích.</p>
      <div class="lab-list">${stacks.map(([k, n]) => {
        const f = variants.parseFlowerKey(k);
        const known = rel.knownReaction(g.save, id, k);
        return `<button class="lab-item" data-vg="give" data-key="${esc(k)}"><span class="vdot big" style="--c:${variants.variantData(f.species, f.variant).petal}"></span>
          <small>${esc(variants.variantName(f.species, f.variant))}</small><b>${'★'.repeat(f.q)} ×${n}</b>${known ? `<em class="react">${REACTION[known].icon}</em>` : ''}</button>`;
      }).join('') || '<p class="muted">Kho chưa có hoa.</p>'}</div>
      <button class="btn wide" data-vg="done" data-id="${id}">Quay lại</button>`);
  }

  showGiftResult(id, res) {
    const info = villagerInfo(id);
    const r = REACTION[res.level];
    this.openModal('gift', `
      <div class="vg-head">${avatarSVG(info.look, 56)}<div><b>${esc(info.name)}</b> ${r.icon} <small>${esc(r.name)}</small>${this.heartBar(id)}</div></div>
      <p class="vg-say">“${esc(res.line)}”</p>
      <p class="fp-chip ${res.delta > 0 ? 'up' : 'down'}">${res.delta > 0 ? `+${res.delta}` : res.delta} điểm tình thân${res.birthday && res.delta > 0 ? ' (🎂 × 2)' : ''}${res.after > res.before ? ` · lên ${res.after} ❤️!` : ''}</p>
      <button class="btn primary wide" data-vg="done" data-id="${id}">Xong</button>`);
  }

  /** Quà khi đạt mốc tim (hiện sau khi nói chuyện / tặng quà xong) */
  showBondRewards() {
    const e = (this.pendingRewards || []).shift();
    if (!e) return false;
    const info = villagerInfo(e.id);
    const rw = e.reward;
    const items = [];
    if (rw.coins) items.push(`+${rw.coins} 💰`);
    if (rw.xp) items.push(`+${rw.xp} XP`);
    Object.entries(rw.seeds || {}).forEach(([k, n]) => { const v = variants.parseVkey(k); items.push(`${n} hạt ${variants.variantName(v.species, v.variant)}`); });
    Object.entries(rw.items || {}).forEach(([k, n]) => items.push(`${n} ${{ fertilizer: '🧪 phân bón', cover: '⛺ bạt che', medicine: '💊 thuốc' }[k] || k}`));
    Object.entries(rw.papers || {}).forEach(([k, n]) => items.push(`${n} ${PAPERS[k]?.name || k}`));
    Object.entries(rw.decor || {}).forEach(([k, n]) => items.push(`${n} ${DECOR_ALL[k]?.icon || ''} ${DECOR_ALL[k]?.name || k} (vào kho trang trí 🎨)`));
    this.openModal('bondreward', `<div class="story">
      <div class="story-av">${avatarSVG(info.look, 72)}</div><h2>${esc(info.name)}</h2>${this.heartBar(e.id)}
      <p class="story-text">🎉 Đạt ${e.hearts} ❤️ — ${esc(rw.msg || '')}</p>
      <h3>🎁 Quà tặng</h3><ul class="unlocks">${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>
      <button class="btn primary wide" data-vg="done" data-id="${e.id}">Cảm ơn!</button></div>`);
    return true;
  }

  openHouse(id) {
    const g = this.game;
    const ctx = g.villageCtx();
    const hs = houseStatus(id, ctx);
    if (!hs) return;
    let body;
    if (!hs.owner) {
      const names = hs.inside.map((v) => villagerInfo(v)?.name).filter(Boolean);
      body = names.length ? `<p>📚 Đang có lớp: <b>${esc(names.join(', '))}</b> đang ở trường.</p>` : '<p>🔕 Trường đang nghỉ, không có ai.</p>';
    } else {
      const o = hs.owner;
      const d = hs.state;
      let line;
      if (d.absent && d.reason === 'moved') line = `✈️ ${esc(GONE_WHEN[o.id]?.note || LEAVES_AFTER_STORY[o.id]?.note || 'Chủ nhà đã đi xa.')}`;
      else if (d.absent && d.reason === 'shop') line = `🌷 ${esc(o.name)} đang ghé tiệm hoa của bạn!`;
      else if (hs.atHome) line = d.act === 'sleep' ? `💤 ${esc(o.name)} đang ngủ, nhẹ nhàng thôi nhé.` : `🏠 ${esc(o.name)} đang ở nhà.`;
      else line = `🚶 Chủ nhà đi vắng — ${hs.act ? `${hs.act.icon} ${esc(hs.act.name.toLowerCase())}` : 'đang ở ngoài'}.`;
      const canSee = !d.absent && !hs.atHome && !ACTIVITIES[d.act]?.indoor; // đang ở trong trường / nhà khác thì không thấy
      const canKnock = !d.absent && hs.atHome && d.act !== 'sleep';
      // chủ nhà đang làm việc ngay trước nhà (vd Cô Ngân bán cà phê trước Quán Mây) ⇒ nói chuyện luôn
      const sp = SPOTS[d.spot];
      const nearby = canSee && sp?.x != null && Math.hypot(sp.x - hs.house.x, sp.z - hs.house.z) < 4.5;
      if (nearby) line = `${hs.act ? hs.act.icon : '👋'} ${esc(o.name)} đang ở ngay trước ${esc(hs.house.name)}${hs.act ? ` — ${esc(hs.act.name.toLowerCase())}` : ''}.`;
      body = `<div class="vg-head">${avatarSVG(o.look, 56)}<div><b>${esc(o.name)}</b><br><small class="muted">${esc(o.role)}</small></div></div>
        <p>${line}</p>${nearby ? `<button class="btn primary wide" data-act="knock" data-id="${esc(o.id)}">💬 Nói chuyện với ${esc(o.name)}</button>` : canSee ? `<button class="btn wide" data-act="see-villager" data-id="${esc(o.id)}">📍 Tìm ${esc(o.name)}</button>` : ''}
        ${canKnock ? `<button class="btn primary wide" data-act="knock" data-id="${esc(o.id)}">🚪 Gõ cửa hỏi thăm</button>` : ''}
        ${(() => { const st = !d.absent ? g.storyTrigger('villager', o.id) : null; return st ? `<button class="btn primary glow wide story-btn" data-vg="story" data-id="${esc(o.id)}" data-scene="${st.scene}">📜 ${esc(st.label || 'Cốt truyện')}</button>` : ''; })()}`;
    }
    this.openModal('house', `<h2>🏡 ${esc(hs.house.name)}</h2>${body}`);
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
      <small>⭐ Cấp ${num(sn.level) || 1}${sn.tier ? ` · ${esc(sn.tierIcon || '')} ${esc(sn.tier)}` : ''}${typeof sn.ti === 'string' && sn.ti ? ` · 🎖️ ${esc(sn.ti.slice(0, 40))}` : ''}${sn.md ? ` · 🏅 ${num(sn.md)}` : ''}</small>
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
        ${d.disease ? `<p class="bad">${DISEASES[d.disease].icon} <b>${DISEASES[d.disease].name}</b> lúc ${String(outbreakHourOf(d.disease)).padStart(2, '0')}:00 — ${DISEASES[d.disease].desc}</p>` : ''}
        ${fest ? `<p class="fest">${fest.icon} <b>${fest.name}</b>: khách mua nhiều ${fest.flowers.map((f) => FLOWERS[f].icon).join('')} và trả giá ×${fest.priceMult}</p>` : ''}
      </div>`;
    };
    // việc nên làm
    const tm = w.tomorrow;
    const needCover = WEATHER[tm.type].disaster || WEATHER[w.today.type].disaster || DISEASES[tm.disease]?.coverSafe || DISEASES[w.today.disease]?.coverSafe;
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
      <div class="two-cols"><div>
      <div class="fc-grid">${dayCard('Hôm nay', w.today)}${dayCard('Ngày mai', tm)}</div>
      ${todo.length ? `<h3>Việc nên làm</h3><div class="todos">${todo.join('')}</div>` : '<p class="muted">Không có gì đáng lo, trồng hoa thôi! 🌷</p>'}
      </div><div>
      <h3>Hoa theo mùa</h3>
      <p class="small"><b>Đúng mùa</b> (lớn nhanh, dễ đạt 3★): ${inS.map((f) => `${FLOWERS[f].icon} ${FLOWERS[f].name}`).join(', ') || '—'}</p>
      <p class="small muted"><b>Trái mùa</b> (lớn chậm, khó 3★ — trừ khi trồng trong nhà kính): ${outS.map((f) => `${FLOWERS[f].icon} ${FLOWERS[f].name}`).join(', ') || '—'}</p>
      <h3>Lễ hội sắp tới</h3><ul class="fests">${fests || '<li>—</li>'}</ul>
      </div></div>`);
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
    const calm = !w || ['sunny', 'heat', 'rainbow', 'fog'].includes(w.type);
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
        <span>${FLOWERS[species].icon}${vdot(species, variant)}</span><small>${FLOWERS[species].greenhouseOnly ? '🏠' : ''}${esc(variants.variantName(species, variant))}</small><b>${n}</b></button>`;
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
    // (0.20) khung hướng dẫn gọn: chạm vào số bước để thu nhỏ thành 1 nút 💡, chạm lần nữa để mở lại
    let mini = false;
    try { mini = localStorage.getItem('thgm:tut') === 'mini'; } catch { /* bỏ qua */ }
    el.classList.toggle('mini', mini);
    el.innerHTML = `<button class="tstep" data-act="tut-toggle" aria-label="Thu gọn hoặc mở hướng dẫn">💡 ${tu.step + 1}/${TUTORIAL.length}</button><span class="ttext">${TUTORIAL[tu.step].text}</span><button class="tclose" data-act="tut-skip" aria-label="Bỏ qua">✕</button>`;
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
      case 'ready': {
        icon = def.icon; title = variants.variantName(tile.flower, tile.variant);
        const f = farming.freshnessOf(tile);
        status = f.golden ? `✨ Giờ vàng — hái trong ${formatDuration(f.goldenLeft)} có thể +1⭐` : f.stale ? `🥀 Đang héo: mất ${f.lose}⭐ — hái ngay!` : `🌸 Đã nở · còn tươi ${formatDuration(f.staleIn)}`;
        break;
      }
      case 'dead': icon = '🥀'; title = `${variants.variantName(tile.flower, tile.variant)} (héo khô)`; status = 'Cây đã chết. Dùng xẻng để dọn.'; break;
      default: icon = '?'; title = '';
    }
    const bars = [];
    const plot = g.save.farm.plots[g.selected.plot];
    const now = g.now;
    const notes = [];
    if (tile.sick && ['growing', 'ready'].includes(tile.state)) notes.push(`<div class="note bad">${DISEASES[tile.sick].icon} ${DISEASES[tile.sick].name}: ${DISEASES[tile.sick].desc} — hãy phun 💊 thuốc${DISEASES[tile.sick].fertCures ? ' hoặc bón 🧪 phân' : ''}!</div>`);
    if ((tile.guardUntil || 0) >= now && !tile.sick && tile.state !== 'untilled') notes.push('<div class="note good">💊 Đã phun thuốc phòng bệnh đến hết ngày mai</div>');
    if (plot.greenhouse) notes.push('<div class="note good">🏠 Lô có nhà kính: an toàn trước thiên tai</div>');
    else if ((plot.coverUntil || 0) >= now) notes.push('<div class="note good">⛺ Lô đang được che bạt đến hết ngày mai</div>');
    if (tile.flower && ['growing', 'ready'].includes(tile.state)) {
      const inS = calendar.inSeason(tile.flower, calendar.dayOf(now));
      if (tile.offSeason) notes.push('<div class="note warn">🍂 Gieo trái mùa: khó đạt 3★</div>');
      else if (!inS && !plot.greenhouse) notes.push('<div class="note warn">🍂 Đang trái mùa: lớn chậm hơn</div>');
      else if (inS) notes.push('<div class="note good">🌸 Đúng mùa: lớn nhanh hơn</div>');
    }
    // GĐ16: độ tươi, đất & luân canh
    const fr = farming.freshnessOf(tile);
    if (tile.rotation && ['growing', 'ready'].includes(tile.state)) notes.push('<div class="note good">🔄 Luân canh (khác loài vụ trước): lớn nhanh hơn, hoa đẹp hơn</div>');
    else if ((tile.streak || 0) >= 2 && tile.state !== 'untilled') notes.push(`<div class="note warn">♻️ Ô này đã trồng ${FLOWERS[tile.last]?.name || 'cùng loài'} ${tile.streak} vụ liền: đất mau bạc màu — vụ sau đổi loài khác nhé</div>`);
    if (tile.state !== 'untilled') bars.push(bar('🟫 Độ màu đất', (tile.soil ?? 100) / 100, (tile.soil ?? 100) < SOIL_RULES.poorBelow ? '#d9a26b' : '#8b6a4e'));
    if ((tile.soil ?? 100) < SOIL_RULES.poorBelow && tile.state !== 'untilled') notes.push('<div class="note warn">🟫 Đất bạc màu: cây lớn chậm, khó 3★. Để đất nghỉ, bón phân, dọn cây héo ủ phân, hoặc trồng loài khác</div>');
    if (['growing', 'ready'].includes(tile.state)) {
      bars.push(bar('🌱 Lớn', farming.progressOf(tile), '#8fd18b'));
      bars.push(bar('💧 Nước', tile.water / waterCapacity(g.save), tile.water < CARE.thirstyBelow ? '#f29a8a' : '#6fbbe8'));
      bars.push(bar('❤️ Sức khỏe', tile.health / 100, tile.health < CARE.wiltBelow ? '#f29a8a' : '#f6a6b9'));
      bars.push(`<div class="kv"><span>🧪 Phân bón</span><b>${tile.fert}/${def.fertilizerNeeded}</b></div>`);
      const eq = farming.expectedQuality(tile);
      bars.push(`<div class="kv"><span>⭐ Chất lượng dự kiến</span><b class="stars">${'★'.repeat(eq)}${'☆'.repeat(3 - eq)}</b></div>`);
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
      if (a === 'fertilize') disabled = !(farming.canFertilize(tile) || DISEASES[tile.sick]?.fertCures) || !(g.save.inventory.items.fertilizer > 0);
      if (a === 'water') disabled = tile.water >= waterCapacity(g.save) - 0.1;
      if (a === 'treat') disabled = !(g.save.inventory.items.medicine > 0) || (!tile.sick && (tile.guardUntil || 0) >= protectUntil(now));
      const [ic, lb] = ACTION_LABEL[a];
      const label = a === 'till' && tile.state === 'dead' ? 'Dọn & xới' : lb;
      return `<button class="btn primary ${disabled ? 'disabled' : ''}" data-do="${a}">${ic} ${label}</button>`;
    }).join('');

    return `
      <div class="sheet-head"><span class="big">${icon}</span><div><b>${esc(title)}</b><small>${status}</small></div>
        <button class="round sm" data-act="close-tile" aria-label="Đóng">✕</button></div>
      ${notes.join('')}
      <div class="bars">${bars.join('')}</div>
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
    const wraps = [
      ...Object.entries(PAPERS).map(([id, w]) => `<div class="cell"><span class="swatch-dot" style="--c:${w.color}"></span><small>${w.name}</small><b>${w.free ? '∞' : '×' + (s.inventory.papers[id] || 0)}</b></div>`),
      ...Object.entries(RIBBONS).map(([id, w]) => `<div class="cell"><span class="swatch-dot ribbon" style="--c:${w.color}"></span><small>${w.name}</small><b>${w.free ? '∞' : '×' + (s.inventory.ribbons[id] || 0)}</b></div>`),
    ].join('');
    const items = `
        <div class="cell"><span>🧪</span><small>Phân bón</small><b>×${s.inventory.items.fertilizer || 0}</b></div>
        <div class="cell"><span>⛺</span><small>Bạt che</small><b>×${s.inventory.items.cover || 0}</b></div>
        <div class="cell"><span>💊</span><small>Thuốc</small><b>×${s.inventory.items.medicine || 0}</b></div>
        <div class="cell"><span>🪏</span><small>Xẻng</small><b>${s.tools.shovel ? '✔' : '—'}</b></div>
        <div class="cell"><span>🚿</span><small>Bình tưới</small><b>${s.tools.wateringCan ? '✔' : '—'}</b></div>`;
    // chia thẻ để bảng gọn, không phải kéo dài
    const INV_TABS = [['flowers', '🌸 Hoa'], ['seeds', '🌱 Hạt giống'], ['wraps', '🎀 Giấy gói'], ['items', '🧪 Vật phẩm']];
    const tab = this.invTab || 'flowers';
    const body = {
      flowers: `<div class="grid">${flowers}</div><p class="muted small">Bán sỉ nhanh nhưng chỉ được chưa tới một nửa giá. Bán cho khách ở 🏪 Tiệm Hoa lời hơn và có uy tín.</p>`,
      seeds: `<div class="grid">${seeds}</div>${DEV_TOOLS ? '<button class="btn primary wide" data-act="free-seeds">🎁 Nhận gói hạt giống miễn phí (1 lần/ngày game)</button>' : ''}`,
      wraps: `<div class="grid">${wraps}</div>`,
      items: `<div class="grid">${items}</div>`,
    }[tab];
    this.openModal('inventory', `
      <h2>🎒 Kho đồ</h2>
      <div class="mk-tabs">${INV_TABS.map(([id, label]) => `<button class="${id === tab ? 'on' : ''}" data-act="inv-tab" data-id="${id}">${label}</button>`).join('')}</div>
      ${body}
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
      <div class="two-cols"><div>
      ${account}
      <h3>🎨 Đồ họa</h3>
      <div class="seg">${[['auto', 'Tự động'], ['high', 'Cao'], ['medium', 'Vừa'], ['low', 'Tiết kiệm pin']].map(([v, l]) => `<button class="${(s.settings.quality || 'auto') === v ? 'on' : ''}" data-act="quality" data-level="${v}">${l}</button>`).join('')}</div>
      <p class="muted small">Đang dùng: ${GRAPHICS.levels[g.graphicsLevel].name}${(s.settings.quality || 'auto') === 'auto' ? ' (tự giảm khi máy chậm)' : ''}. "Tiết kiệm pin" tắt bóng đổ, giảm độ nét và chạy 30 khung hình/giây.</p>
      </div><div>
      ${this.audioSettingsHTML()}
      <p class="muted small">Đã lưu trên máy lúc ${last}.</p>
      ${DEV_TOOLS ? `<h3>🧪 Công cụ thử nghiệm</h3>
      <div class="row-btns">
        <button class="btn" data-act="ff1">⏩ Tua 1 giờ</button>
        <button class="btn" data-act="ff6">⏩ Tua 6 giờ</button>
        <button class="btn danger" data-act="reset">🗑️ Chơi lại từ đầu</button>
      </div>` : ''}
      <p class="muted small">Điều khiển: kéo để di chuyển bản đồ · cuộn chuột hoặc chụm 2 ngón để phóng to/thu nhỏ · máy tính có thể dùng phím W A S D.</p>
      <p class="muted small">Tiệm Hoa Giấc Mơ · phiên bản ${GAME_VERSION} (${GAME_STAGE})</p>
      </div></div>
    `);
  }

  // ---------- âm thanh ----------
  audioSettingsHTML() {
    const a = this.game.audio;
    if (!a) return '';
    const p = a.prefs;
    const pct = (v) => Math.round(v * 100);
    return `
      <h3>🎵 Âm thanh</h3>
      <label class="audio-row">🎵 Nhạc nền<input type="range" min="0" max="100" step="5" value="${pct(p.music)}" data-audio="music"><output>${pct(p.music)}%</output></label>
      <label class="audio-row">👆 Tiếng chạm<input type="range" min="0" max="100" step="5" value="${pct(p.sfx)}" data-audio="sfx"><output>${pct(p.sfx)}%</output></label>
      <div class="now-playing"><span class="muted small">Đang phát: <b class="np-title">${esc(a.music.title)}</b></span><button class="btn" data-act="music-next">⏭️ Bài tiếp</button></div>
      <label class="audio-check"><input type="checkbox" data-audio="tapFx" ${p.tapFx ? 'checked' : ''}> Hiệu ứng cánh hoa khi chạm</label>
      <label class="audio-check"><input type="checkbox" data-audio="intro" ${p.intro ? 'checked' : ''}> Xem intro khi mở game</label>`;
  }

  onAudioInput(el) {
    const a = this.game.audio;
    if (!a) return;
    const key = el.dataset.audio;
    if (el.type === 'range') {
      const v = Number(el.value) / 100;
      if (key === 'music') a.music.setVolume(v);
      else { a.prefs.sfx = v; a.sfx.tap(1); }
      const out = el.parentElement.querySelector('output');
      if (out) out.textContent = `${el.value}%`;
    } else {
      a.prefs[key] = el.checked;
    }
    savePrefs(a.prefs);
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
    g.applyLook(); // (GĐ26) giữ trang phục đang mặc
    g.saveMgr.markDirty?.();
    this.updateProfile();
    this.toast('✨ Đã cập nhật nhân vật', 'good');
  }

  openModal(name, html, size = '') {
    this.modal = name;
    const wrap = $('.modal-wrap', this.root);
    const m = $('.modal', wrap);
    m.className = `modal m-${name} ${size}`;
    // Bảng chia 2 phần: m-side (tiêu đề, ví, các thẻ) + m-main (nội dung).
    // Màn hình thường: 2 phần "display: contents" nên trông như cũ; điện thoại xoay ngang: thẻ chuyển sang cột trái.
    m.innerHTML = `<div class="m-side"><button class="round sm close" data-act="close-modal" aria-label="Đóng">✕</button></div><div class="m-main">${html}</div>`;
    const side = $('.m-side', m), main = $('.m-main', m);
    while (main.firstElementChild?.matches('h2, .mk-wallet, .lk-wallet, .book-prog, .mk-tabs')) side.appendChild(main.firstElementChild);
    m.classList.toggle('has-side', !!side.querySelector('.mk-tabs'));
    wrap.classList.remove('hidden');
  }

  /** Phần đang cuộn của bảng (để giữ vị trí cuộn khi vẽ lại) */
  scrollBox() {
    const m = $('.modal', this.root);
    const main = m?.querySelector('.m-main');
    return main && getComputedStyle(main).overflowY !== 'visible' && main.scrollHeight > main.clientHeight ? main : m;
  }

  closeModal() {
    this.modal = null;
    $('.modal-wrap', this.root).classList.add('hidden');
    const next = this.afterClose;
    this.afterClose = null;
    next?.();
  }

  // ---------- thông báo ----------
  toast(text, type = 'info') {
    const box = $('.toasts', this.root);
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    const sp = document.createElement('span'); // chữ nằm trong span để cắt gọn 2–3 dòng mà không lòi dòng thừa
    sp.textContent = text;
    t.appendChild(sp);
    box.appendChild(t);
    // (0.20) thông báo gọn: điện thoại ngang chỉ hiện 2 cái cùng lúc; câu dài thì nán lại lâu hơn một chút
    const max = innerHeight <= 480 ? 2 : 3;
    while (box.children.length > max) box.firstChild.remove();
    const stay = 2600 + Math.min(1800, Math.max(0, text.length - 40) * 25);
    setTimeout(() => t.classList.add('out'), stay);
    setTimeout(() => t.remove(), stay + 500);
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
