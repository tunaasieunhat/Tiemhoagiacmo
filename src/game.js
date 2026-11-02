// =============================================================
//  BỘ ĐIỀU KHIỂN GAME: nối dữ liệu (save) <-> logic <-> đồ họa <-> giao diện
// =============================================================
import * as THREE from 'three';
import { TIME, STARTER } from '../data/config.js';
import { FLOWERS, FLOWER_IDS } from '../data/flowers.js';
import { PAPERS, RIBBONS } from '../data/wrapping.js';
import * as shop from './systems/shop.js';
import { CustomersView } from './render/customers.js';
import * as farming from './systems/farming.js';
import { clockOf } from './systems/time.js';
import { FarmView } from './render/farmView.js';
import { Player } from './render/player.js';
import { Particles, Fireflies } from './render/particles.js';
import { DayNight } from './render/dayNight.js';
import { CameraControls } from './render/cameraControls.js';
import { PLOT_SLOTS, ZONES } from './render/world.js';

const ACTIONS = {
  till: (t, s) => farming.till(t, s),
  plant: (t, s, o, now) => farming.plant(t, o.seed, s, now),
  water: (t, s) => farming.water(t, s),
  fertilize: (t, s) => farming.fertilize(t, s),
  harvest: (t, s) => farming.harvest(t, s),
};
const FX = { till: 'dirt', plant: 'seed', water: 'water', fertilize: 'fert', harvest: 'sparkle' };

export const TUTORIAL = [
  { text: 'Chọn 🪏 Xẻng rồi chạm vào ô đất để xới đất (hoặc chạm ô đất bằng ✋ để xem).', done: (a) => a === 'till' },
  { text: 'Chọn 🌱 Gieo, chọn loại hạt rồi chạm vào ô vừa xới.', done: (a) => a === 'plant' },
  { text: 'Chọn 💧 Tưới để tưới nước cho cây. Cây khát sẽ hiện giọt nước 💧.', done: (a) => a === 'water' },
  { text: 'Chọn 🧪 Bón phân để hoa đẹp hơn (mỗi giai đoạn bón 1 lần).', done: (a) => a === 'fertilize' },
  { text: 'Chờ hoa nở ⭐ rồi dùng 🧺 Thu hoạch. Mẹo: ⚙️ Cài đặt có nút tua nhanh thời gian.', done: (a) => a === 'harvest' },
  { text: 'Khách sẽ ghé 🏪 Tiệm Hoa! Bấm nút 🏪 bên trái (hoặc chạm vào tiệm) để bán hoa cho khách.', done: (a) => a === 'sell' },
];

export class Game {
  constructor({ stage, world, saveMgr, emitter }) {
    this.stage = stage;
    this.world = world;
    this.saveMgr = saveMgr;
    this.emitter = emitter;
    this.save = saveMgr.save;
    this.tool = 'hand';
    this.seed = Object.keys(FLOWERS).find((id) => this.save.inventory.seeds[id] > 0) || 'tulip';
    this.selected = null;
    this.lastMinute = -1;
    this.clockT = 0;
    this.raycaster = new THREE.Raycaster();

    this.farmView = new FarmView(stage.scene);
    this.farmView.build(this.save);
    const start = PLOT_SLOTS[0].clone().add(new THREE.Vector3(2.6, 0, 1.2));
    this.player = new Player(stage.scene, this.save.player.avatar, start);
    this.particles = new Particles(stage.scene);
    this.customers = new CustomersView(stage.scene);
    this.customers.sync(this.save, true);
    this.fireflies = new Fireflies(stage.scene, world.fireflyAnchors);
    this.dayNight = new DayNight(stage, world.lampLights);
    this.controls = new CameraControls(stage.camera, stage.renderer.domElement, {
      onTap: (x, y) => this.onTap(x, y),
      onHover: (x, y) => this.onHover(x, y),
    });
    // camera bắt đầu nhìn vào lô đất đầu tiên; điện thoại dọc thì zoom gần hơn
    const portrait = innerWidth < innerHeight;
    this.controls.target.copy(PLOT_SLOTS[0]).add(portrait ? new THREE.Vector3(0.7, 0, 0.7) : new THREE.Vector3(1.5, 0, -1));
    if (portrait) this.controls.zoom = 1.75;
    this.controls.apply();
    this.pickRoots = [this.farmView.root, this.customers.root, world.shop, world.market, ...world.lockedSlots];
    this.setShadows(this.save.settings.shadows !== false);
  }

  // ---------------- thời gian ----------------
  get now() { return this.save.time.gameMinutes; }
  get clock() { return clockOf(this.save.time.gameMinutes); }

  /** Mô phỏng thời gian vắng mặt (khi mở lại game) */
  catchUpOffline() {
    const elapsedSec = Math.max(0, (Date.now() - (this.save.time.lastRealTs || Date.now())) / 1000);
    if (elapsedSec < 5) return null;
    const gameMin = Math.min(elapsedSec / TIME.realSecondsPerGameMinute, TIME.offlineMaxHours * 60);
    const ev = this.advance(gameMin, { offline: true });
    return { elapsedSec, gameMin, ...ev };
  }

  advance(dMin, opts = {}) {
    const ev = { ready: 0, dead: 0 };
    this.save.time.gameMinutes += dMin;
    this.save.farm.plots.forEach((plot, pi) => plot.tiles.forEach((tile, ti) => {
      const e = farming.simulateTile(tile, dMin, opts);
      if (!e) return;
      ev[e]++;
      if (!opts.offline) {
        const name = FLOWERS[tile.flower]?.name ?? 'Cây';
        if (e === 'ready') this.toast(`🌸 ${name} đã nở! Thu hoạch thôi`, 'good');
        if (e === 'dead') this.toast(`🥀 ${name} bị héo khô vì thiếu nước`, 'bad');
        if (e === 'ready') this.particles.spawn('sparkle', this.farmView.tileWorldPos(pi, ti));
      }
    }));
    // cửa hàng: khách đến / khách bỏ đi
    const shopEv = shop.shopTick(this.save, { offline: !!opts.offline, hourFloat: this.clock.hourFloat, flowerIds: this.unlockedFlowers() });
    for (const e of shopEv) {
      const npc = shop.npcOf(e.customer.npc);
      if (e.type === 'arrive') {
        this.toast(`🔔 ${npc.name} vừa đến tiệm hoa!`, 'info');
        this.customers.sync(this.save);
      } else if (e.type === 'timeout') {
        this.customers.leave(e.customer.id, 'angry');
        if (!e.silent) this.toast(`😤 ${npc.name} chờ lâu quá nên đã bỏ đi (${shop.reactionText('timeout', e.customer.npc)})`, 'bad');
        ev.left = (ev.left || 0) + 1;
      }
      this.emitter.emit('shop');
      this.saveMgr.markDirty();
    }
    if (ev.ready || ev.dead) this.saveMgr.markDirty();
    return ev;
  }

  update(dt) {
    // dt lớn (tab bị ẩn lâu) => coi như vắng mặt
    if (dt > 3) {
      const ev = this.advance(dt / TIME.realSecondsPerGameMinute, { offline: true });
      if (ev.ready) this.toast(`Trong lúc bạn đi vắng, ${ev.ready} cây đã nở 🌸`, 'good');
      if (ev.dead) this.toast(`${ev.dead} cây bị héo vì thiếu nước 🥀`, 'bad');
      dt = 0.016;
    }
    const dMin = dt / TIME.realSecondsPerGameMinute;
    this.advance(dMin);
    this.save.stats.playMinutes += dt / 60;
    this.save.time.lastRealTs = Date.now();

    this.clockT += dt;
    const c = this.clock;
    if (c.minute !== this.lastMinute) {
      this.lastMinute = c.minute;
      this.emitter.emit('clock', c);
    }
    if (this.clockT > 0.25) {
      this.clockT = 0;
      this.farmView.sync(this.save);
      this.customers.sync(this.save);
      this.emitter.emit('refresh');
    }

    this.controls.update(dt);
    this.player.update(dt);
    this.farmView.update(dt);
    this.particles.update(dt);
    this.customers.update(dt);
    this.dayNight.update(c.hourFloat, this.controls.target);
    this.fireflies.update(performance.now() / 1000, this.dayNight.night);
  }

  // ---------------- chọn & chạm ----------------
  pickAt(x, y) {
    this.raycaster.setFromCamera(this.controls.ndc(x, y), this.stage.camera);
    const hits = this.raycaster.intersectObjects(this.pickRoots, true);
    for (const h of hits) {
      let o = h.object;
      while (o) {
        if (o.userData?.pick) return o.userData.pick;
        o = o.parent;
      }
    }
    return null;
  }

  onHover(x, y) {
    const pick = x == null ? null : this.pickAt(x, y);
    this.farmView.setHover(pick);
    this.stage.renderer.domElement.style.cursor = pick ? 'pointer' : 'grab';
  }

  onTap(x, y) {
    const pick = this.pickAt(x, y);
    if (!pick) { this.select(null); return; }
    if (pick.kind === 'tile') {
      if (this.tool === 'hand') this.select(pick);
      else {
        this.selected = pick;
        this.farmView.setSelected(pick);
        this.requestAction(pick, this.tool, { seed: this.seed });
      }
    } else if (pick.kind === 'customer') {
      this.select(null);
      this.emitter.emit('open-shop', { customerId: pick.id });
    } else if (pick.kind === 'zone') {
      this.select(null);
      const z = ZONES[pick.zone];
      this.controls.focusOn(z.center);
      if (pick.zone === 'shop') this.emitter.emit('open-shop', {});
      else this.toast('🧺 Khu Chợ (dụng cụ, hạt giống, nâng cấp) sẽ mở ở Giai đoạn 4.', 'info');
    } else if (pick.kind === 'lockedPlot') {
      this.select(null);
      this.toast('🔒 Lô đất này sẽ mở rộng bằng tiền ở Giai đoạn 4.', 'info');
    }
  }

  select(pick) {
    this.selected = pick;
    this.farmView.setSelected(pick);
    this.emitter.emit('select', pick);
  }

  getTile(pick) { return this.save.farm.plots[pick.plot]?.tiles[pick.tile]; }

  setTool(tool) {
    this.tool = tool;
    if (tool !== 'hand') this.select(null);
    this.emitter.emit('tool', tool);
  }

  setSeed(id) { this.seed = id; this.emitter.emit('tool', this.tool); }

  // ---------------- thao tác ----------------
  /** Kiểm tra trước rồi cho nhân vật đi tới làm */
  requestAction(pick, action, opt = {}) {
    const tile = this.getTile(pick);
    const fn = ACTIONS[action];
    if (!tile || !fn) return false;
    if (action === 'plant' && !opt.seed) opt.seed = this.seed;
    const s = this.save;
    const test = fn(structuredClone(tile), structuredClone({ tools: s.tools, inventory: s.inventory, stats: s.stats }), opt, this.now);
    if (!test.ok) { this.toast(test.msg, 'warn'); return false; }
    const pos = this.farmView.tileWorldPos(pick.plot, pick.tile);
    const ok = this.player.enqueue({
      key: `${pick.plot}:${pick.tile}:${action}`,
      lookAt: pos,
      tool: action,
      run: () => this.applyAction(pick, action, opt, pos),
    });
    if (!ok && this.player.queue.length >= 9) this.toast('Nhân vật đang bận, chờ chút nhé!', 'warn');
    return ok;
  }

  applyAction(pick, action, opt, pos) {
    const tile = this.getTile(pick);
    const res = ACTIONS[action](tile, this.save, opt, this.now);
    if (!res.ok) { this.toast(res.msg, 'warn'); return; }
    this.particles.spawn(FX[action], pos);
    if (action === 'harvest') {
      this.emitter.emit('float', { pos: pos.clone().setY(1.2), text: `+1 ${FLOWERS[res.flower].icon} ${'★'.repeat(res.quality)}` });
      this.particles.spawn('leaf', pos);
    } else {
      this.emitter.emit('float', { pos: pos.clone().setY(1.0), text: res.msg, small: true });
    }
    this.farmView.sync(this.save);
    this.advanceTutorial(action);
    this.saveMgr.markDirty();
    this.emitter.emit('inventory');
    this.emitter.emit('refresh');
  }

  advanceTutorial(action) {
    const tu = this.save.tutorial;
    if (tu.done) return;
    const step = TUTORIAL[tu.step];
    if (step?.done(action)) {
      tu.step += 1;
      if (tu.step >= TUTORIAL.length) {
        tu.done = true;
        this.toast('🎉 Bạn đã hoàn thành hướng dẫn trồng hoa!', 'good');
      }
      this.emitter.emit('tutorial');
    }
  }

  // ---------------- cửa hàng ----------------
  unlockedFlowers() {
    return FLOWER_IDS.filter((id) => FLOWERS[id].unlockLevel <= this.save.player.level);
  }

  /** Giao hoa cho khách. sel = { items: {"rose|3": 2}, paper, ribbon } */
  deliverToCustomer(customerId, sel) {
    const s = this.save;
    const c = s.shop.customers.find((x) => x.id === customerId);
    if (!c) return { ok: false, msg: 'Khách đã rời đi' };
    const ev = shop.evaluateDelivery(c.request, sel);
    if (!ev.ok) return { ok: false, msg: 'Chưa đúng yêu cầu của khách' };
    // kiểm tra kho
    for (const [k, n] of Object.entries(sel.items)) if (n > 0 && !((s.inventory.flowers[k] || 0) >= n)) return { ok: false, msg: 'Không đủ hoa trong kho' };
    const bouquet = c.request.type === 'bouquet';
    if (bouquet) {
      if (!PAPERS[sel.paper].free && !(s.inventory.papers[sel.paper] > 0)) return { ok: false, msg: 'Hết giấy gói này' };
      if (!RIBBONS[sel.ribbon].free && !(s.inventory.ribbons[sel.ribbon] > 0)) return { ok: false, msg: 'Hết ruy băng này' };
    }
    // trừ kho
    let count = 0;
    for (const [k, n] of Object.entries(sel.items)) { if (n > 0) { s.inventory.flowers[k] -= n; count += n; if (!s.inventory.flowers[k]) delete s.inventory.flowers[k]; } }
    if (bouquet) {
      if (!PAPERS[sel.paper].free) s.inventory.papers[sel.paper] -= 1;
      if (!RIBBONS[sel.ribbon].free) s.inventory.ribbons[sel.ribbon] -= 1;
    }
    const tier = shop.tierOf(s.player.reputation);
    const tip = shop.tipAmount(Math.random, tier, ev);
    s.player.coins += ev.price + tip;
    const oldTier = tier;
    s.player.reputation = Math.max(0, s.player.reputation + ev.repDelta);
    s.shop.customers.splice(s.shop.customers.indexOf(c), 1);
    Object.assign(s.stats, {
      served: s.stats.served + 1, sold: s.stats.sold + count, coinsEarned: s.stats.coinsEarned + ev.price + tip,
      tips: s.stats.tips + tip, bouquets: s.stats.bouquets + (bouquet ? 1 : 0),
    });

    const npc = shop.npcOf(c.npc);
    const pos = this.customers.positionOf(c.id).setY(2.2);
    this.customers.leave(c.id, ev.mood === 'bad' ? 'sad' : 'happy');
    this.particles.spawn(ev.mood === 'bad' ? 'leaf' : 'sparkle', pos.clone().setY(0.5));
    this.emitter.emit('float', { pos, text: `+${ev.price + tip} 💰  ${ev.repDelta >= 0 ? '+' : ''}${ev.repDelta} 💗` });
    this.toast(`${npc.name}: “${shop.reactionText(ev.mood, c.npc)}”`, ev.mood === 'bad' ? 'warn' : 'good');
    if (tip) setTimeout(() => this.toast(`💝 ${npc.name} cho thêm ${tip} 💰 tiền bo!`, 'good'), 900);
    const newTier = shop.tierOf(s.player.reputation);
    if (newTier > oldTier) setTimeout(() => this.toast(`🎉 Tiệm lên bậc "${shop.tierInfo(s.player.reputation).name}"! Khách sẽ đến đông hơn.`, 'good'), 1800);
    this.advanceTutorial('sell');
    this.saveMgr.markDirty();
    this.emitter.emit('inventory');
    this.emitter.emit('shop');
    return { ok: true, ev, tip };
  }

  declineCustomer(customerId) {
    const s = this.save;
    const c = s.shop.customers.find((x) => x.id === customerId);
    if (!c) return;
    s.shop.customers.splice(s.shop.customers.indexOf(c), 1);
    s.player.reputation = Math.max(0, s.player.reputation + shop.SHOP_REP.decline);
    this.customers.leave(c.id, 'sad');
    this.toast(`${shop.npcOf(c.npc).name}: “${shop.reactionText('decline', c.npc)}”`, 'info');
    this.saveMgr.markDirty();
    this.emitter.emit('inventory');
    this.emitter.emit('shop');
  }

  /** Bán sỉ cả chồng hoa (không cần khách, giá thấp) */
  sellWholesale(key) {
    const s = this.save;
    const n = s.inventory.flowers[key] || 0;
    if (!n) return 0;
    const [flower, q] = key.split('|');
    const total = shop.wholesalePrice(flower, +q) * n;
    delete s.inventory.flowers[key];
    s.player.coins += total;
    s.stats.sold += n;
    s.stats.coinsEarned += total;
    this.toast(`📦 Đã bán sỉ ${n} cành ${FLOWERS[flower].name} được ${total} 💰`, 'good');
    this.saveMgr.markDirty();
    this.emitter.emit('inventory');
    return total;
  }

  // ---------------- tiện ích ----------------
  claimFreeSeeds() {
    const day = this.clock.day;
    if (this.save.stats.lastFreePackDay === day) {
      this.toast('Hôm nay bạn đã nhận rồi, mai quay lại nhé!', 'warn');
      return false;
    }
    this.save.stats.lastFreePackDay = day;
    for (const [id, n] of Object.entries(STARTER.freeSeedsPack)) this.save.inventory.seeds[id] = (this.save.inventory.seeds[id] || 0) + n;
    this.save.inventory.items.fertilizer = (this.save.inventory.items.fertilizer || 0) + 3;
    this.toast('🎁 Đã nhận gói hạt giống + 3 phân bón!', 'good');
    this.saveMgr.markDirty();
    this.emitter.emit('inventory');
    return true;
  }

  fastForward(hours) {
    const ev = this.advance(hours * 60);
    this.farmView.sync(this.save);
    this.toast(`⏩ Đã tua nhanh ${hours} giờ game`, 'info');
    this.emitter.emit('refresh');
    return ev;
  }

  setShadows(on) {
    this.save.settings.shadows = on;
    this.stage.sun.castShadow = on;
  }

  toast(text, type = 'info') { this.emitter.emit('toast', { text, type }); }

  /** Chuyển tọa độ 3D -> màn hình (cho chữ bay lên) */
  toScreen(pos) {
    const v = pos.clone().project(this.stage.camera);
    const r = this.stage.renderer.domElement.getBoundingClientRect();
    return { x: r.left + ((v.x + 1) / 2) * r.width, y: r.top + ((1 - v.y) / 2) * r.height };
  }
}
