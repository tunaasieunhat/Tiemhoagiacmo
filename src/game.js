// =============================================================
//  BỘ ĐIỀU KHIỂN GAME: nối dữ liệu (save) <-> logic <-> đồ họa <-> giao diện
// =============================================================
import * as THREE from 'three';
import { TIME, STARTER } from '../data/config.js';
import { FLOWERS, FLOWER_IDS } from '../data/flowers.js';
import { PAPERS, RIBBONS } from '../data/wrapping.js';
import * as shop from './systems/shop.js';
import { CustomersView } from './render/customers.js';
import * as progression from './systems/progression.js';
import * as market from './systems/market.js';
import { XP } from '../data/levels.js';
import * as weather from './systems/weather.js';
import * as calendar from './systems/calendar.js';
import { dayOf } from './systems/calendar.js';
import { WEATHER, DISEASES } from '../data/seasons.js';
import { SeasonVisuals } from './render/seasonVisuals.js';
import { WeatherFx } from './render/weatherFx.js';
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
  treat: (t, s, o, now) => farming.treat(t, s, now),
};
const FX = { till: 'dirt', plant: 'seed', water: 'water', fertilize: 'fert', harvest: 'sparkle', treat: 'spray' };

export const TUTORIAL = [
  { text: 'Chọn 🪏 Xẻng rồi chạm vào ô đất để xới đất (hoặc chạm ô đất bằng ✋ để xem).', done: (a) => a === 'till' },
  { text: 'Chọn 🌱 Gieo, chọn loại hạt rồi chạm vào ô vừa xới.', done: (a) => a === 'plant' },
  { text: 'Chọn 💧 Tưới để tưới nước cho cây. Cây khát sẽ hiện giọt nước 💧.', done: (a) => a === 'water' },
  { text: 'Chọn 🧪 Bón phân để hoa đẹp hơn (mỗi giai đoạn bón 1 lần).', done: (a) => a === 'fertilize' },
  { text: 'Chờ hoa nở ⭐ rồi dùng 🧺 Thu hoạch. Mẹo: ⚙️ Cài đặt có nút tua nhanh thời gian.', done: (a) => a === 'harvest' },
  { text: 'Khách sẽ ghé 🏪 Tiệm Hoa! Bấm nút 🏪 bên trái (hoặc chạm vào tiệm) để bán hoa cho khách.', done: (a) => a === 'sell' },
  { text: 'Có tiền rồi! Bấm 🧺 bên trái để đến Khu Chợ mua hạt giống, nâng cấp và mở rộng đất.', done: (a) => a === 'buy' },
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
    this.seasonVisuals = new SeasonVisuals();
    this.weatherFx = new WeatherFx(stage.scene);
    weather.ensureWeather(this.save);
    this.applyWeatherVisuals(true);
    this.controls = new CameraControls(stage.camera, stage.renderer.domElement, {
      onTap: (x, y) => this.onTap(x, y),
      onHover: (x, y) => this.onHover(x, y),
    });
    // camera bắt đầu nhìn vào lô đất đầu tiên; điện thoại dọc thì zoom gần hơn
    const portrait = innerWidth < innerHeight;
    this.controls.target.copy(PLOT_SLOTS[0]).add(portrait ? new THREE.Vector3(0.7, 0, 0.7) : new THREE.Vector3(1.5, 0, -1));
    if (portrait) this.controls.zoom = 1.75;
    this.controls.apply();
    this.updateLockedSlots();
    this.applyUpgradeEffects();
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
    const ev = { ready: 0, dead: 0, disasters: [], outbreaks: [] };
    const offline = !!opts.offline;
    const s = this.save;
    // chia nhỏ để không bỏ sót các mốc giờ (bão 14:00, dịch 10:00, qua ngày mới...)
    let remaining = dMin;
    while (remaining > 0) {
      const step = Math.min(remaining, 30);
      remaining -= step;
      const from = s.time.gameMinutes;
      const to = from + step;
      s.time.gameMinutes = to;
      for (const e of weather.weatherTick(s, from, to, { offline })) this.onWeatherEvent(e, ev, offline);
      const day = dayOf(to);
      const cap = farming.waterCapacity(s);
      s.farm.plots.forEach((plot, pi) => {
        const env = weather.plotEnv(s, plot);
        plot.tiles.forEach((tile, ti) => {
          if (env.rain && ['tilled', 'growing', 'ready'].includes(tile.state)) tile.water = Math.max(tile.water, cap);
          const growMult = tile.flower ? calendar.seasonGrowMult(tile.flower, day, plot.greenhouse) : 1;
          const e = farming.simulateTile(tile, step, { offline, env: { growMult, waterMult: env.waterMult } });
          if (!e) return;
          ev[e]++;
          if (!offline) {
            const name = FLOWERS[tile.flower]?.name ?? 'Cây';
            if (e === 'ready') this.toast(`🌸 ${name} đã nở! Thu hoạch thôi`, 'good');
            if (e === 'dead') this.toast(`🥀 ${name} đã chết vì ${tile.sick ? 'bệnh' : 'thiếu nước'}`, 'bad');
            if (e === 'ready') this.particles.spawn('sparkle', this.farmView.tileWorldPos(pi, ti));
          }
        });
      });
      // cửa hàng: khách đến / khách bỏ đi
      const shopEv = shop.shopTick(s, {
        offline, hourFloat: this.clock.hourFloat, flowerIds: this.unlockedFlowers(),
        festival: calendar.festivalOn(day), seasonal: calendar.seasonFlowers(day),
      });
      for (const e of shopEv) {
        const npc = shop.npcOf(e.customer.npc);
        if (e.type === 'arrive') {
          this.toast(`🔔 ${npc.name} vừa đến tiệm hoa!`, 'info');
          this.customers.sync(s);
        } else if (e.type === 'timeout') {
          this.customers.leave(e.customer.id, 'angry');
          if (!e.silent) this.toast(`😤 ${npc.name} chờ lâu quá nên đã bỏ đi (${shop.reactionText('timeout', e.customer.npc)})`, 'bad');
          ev.left = (ev.left || 0) + 1;
        }
        this.emitter.emit('shop');
        this.saveMgr.markDirty();
      }
    }
    if (ev.ready || ev.dead) this.saveMgr.markDirty();
    return ev;
  }

  /** Xử lý sự kiện thời tiết: ngày mới, thiên tai, dịch bệnh, nhắc nhở */
  onWeatherEvent(e, ev, offline) {
    this.saveMgr.markDirty();
    if (e.type === 'newday') {
      this.applyWeatherVisuals();
      this.emitter.emit('weather');
      if (offline) return;
      const c = calendar.calendarOf(e.day);
      if (e.seasonChanged) this.toast(`${c.season.icon} ${c.season.name} đã đến! Hoa đúng mùa: ${calendar.seasonFlowers(e.day).map((f) => FLOWERS[f].icon).join(' ')}`, 'good');
      if (e.festival) this.toast(`${e.festival.icon} Hôm nay: ${e.festival.name}! Khách sẽ đến đông và trả giá cao`, 'good');
      const tm = e.tomorrow;
      const W = WEATHER[tm.type];
      const parts = [];
      if (W.disaster) parts.push(`${W.icon} ${W.name}`);
      if (tm.disease) parts.push(`${DISEASES[tm.disease].icon} ${DISEASES[tm.disease].name}`);
      if (e.tomorrowFestival) parts.push(`${e.tomorrowFestival.icon} ${e.tomorrowFestival.name}`);
      if (parts.length) setTimeout(() => this.toast(`📢 Dự báo ngày mai: ${parts.join(', ')}. Bấm vào đồng hồ để xem cách chuẩn bị`, W.disaster || tm.disease ? 'warn' : 'info'), 1200);
    } else if (e.type === 'disaster') {
      ev.disasters.push(e);
      this.emitter.emit('refresh');
      if (e.silent) return;
      const W = WEATHER[e.weather];
      if (e.hit) this.toast(`${W.icon} ${W.name}! ${e.hit} cây bị ảnh hưởng${e.destroyed ? `, ${e.destroyed} cây bị hỏng` : ''}${e.saved ? ` · ${e.saved} cây được che chắn an toàn` : ''}`, 'bad');
      else if (e.saved) this.toast(`${W.icon} ${W.name} đã qua. Nhờ che chắn, ${e.saved} cây đều an toàn! 👍`, 'good');
      this.farmView.sync(this.save);
    } else if (e.type === 'outbreak') {
      ev.outbreaks.push(e);
      if (e.silent) return;
      const D = DISEASES[e.disease];
      if (e.infected) this.toast(`${D.icon} ${D.name} bùng phát: ${e.infected} cây bị bệnh! Dùng 💊 Thuốc để chữa`, 'bad');
      else this.toast(`${D.icon} ${D.name} xuất hiện nhưng không cây nào bị lây${e.guarded ? ' nhờ phun thuốc phòng' : ''} 👍`, 'good');
    } else if (e.type === 'remind') {
      const W = WEATHER[e.tomorrow.type];
      const what = [W.disaster ? W.name : '', e.tomorrow.disease ? DISEASES[e.tomorrow.disease].name : ''].filter(Boolean).join(' và ');
      this.toast(`⏰ Ngày mai có ${what}! Nhớ ${W.disaster ? 'che bạt ⛺' : ''}${W.disaster && e.tomorrow.disease ? ' và ' : ''}${e.tomorrow.disease ? 'phun thuốc 💊' : ''} nhé`, 'warn');
    }
  }

  /** Cập nhật màu cỏ cây theo mùa + hiệu ứng thời tiết hôm nay */
  applyWeatherVisuals(instant = false) {
    const w = weather.ensureWeather(this.save);
    const c = calendar.calendarOf(dayOf(this.save.time.gameMinutes));
    this.seasonVisuals.set(c.seasonIndex, instant);
    this.weatherFx.set(w.today.type, c.seasonIndex);
    this.dayNight.setWeather(w.today.type);
    this.farmView.wind = w.today.type === 'storm' ? 1 : w.today.type === 'rain' ? 0.25 : 0;
  }

  update(dt) {
    // dt lớn (tab bị ẩn lâu) => coi như vắng mặt
    if (dt > 3) {
      const ev = this.advance(dt / TIME.realSecondsPerGameMinute, { offline: true });
      if (ev.ready) this.toast(`Trong lúc bạn đi vắng, ${ev.ready} cây đã nở 🌸`, 'good');
      if (ev.dead) this.toast(`${ev.dead} cây bị héo vì thiếu nước 🥀`, 'bad');
      const hit = ev.disasters.reduce((a, d) => a + d.hit, 0);
      const sick = ev.outbreaks.reduce((a, d) => a + d.infected, 0);
      if (hit || sick) this.toast(`Lúc bạn vắng: ${hit ? `thiên tai ảnh hưởng ${hit} cây` : ''}${hit && sick ? ', ' : ''}${sick ? `${sick} cây bị bệnh` : ''}`, 'warn');
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
    this.dayNight.update(c.hourFloat, this.controls.target, dt);
    this.seasonVisuals.update(dt);
    this.weatherFx.update(dt, this.controls.target);
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
      else this.emitter.emit('open-market', {});
    } else if (pick.kind === 'lockedPlot') {
      this.select(null);
      this.emitter.emit('open-market', { tab: 'land' });
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
    const test = fn(structuredClone(tile), structuredClone({ tools: s.tools, inventory: s.inventory, stats: s.stats, upgrades: s.upgrades }), opt, this.now);
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
    if (action === 'plant') {
      const plot = this.save.farm.plots[pick.plot];
      tile.offSeason = !calendar.inSeason(tile.flower, dayOf(this.now)) && !plot.greenhouse;
      if (tile.offSeason) setTimeout(() => this.toast(`🍂 ${FLOWERS[tile.flower].name} đang trái mùa: lớn chậm và khó đạt 3★ (trừ khi có nhà kính)`, 'warn'), 600);
    }
    if (action === 'harvest') {
      this.emitter.emit('float', { pos: pos.clone().setY(1.2), text: `+1 ${FLOWERS[res.flower].icon} ${'★'.repeat(res.quality)}` });
      this.particles.spawn('leaf', pos);
    } else {
      this.emitter.emit('float', { pos: pos.clone().setY(1.0), text: res.msg, small: true });
    }
    this.farmView.sync(this.save);
    this.gainXp(action === 'harvest' ? XP.harvestPerStar * res.quality : XP[action] ?? 1);
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
    this.gainXp(Math.floor((ev.price + tip) / 10) * XP.sellPer10Coins + (bouquet ? XP.bouquet : 0) + (ev.mood === 'perfect' ? XP.perfect : 0));
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
  sellWholesale(key, count = Infinity) {
    const s = this.save;
    const n = Math.min(count, s.inventory.flowers[key] || 0);
    if (!n) return 0;
    const [flower, q] = key.split('|');
    const total = shop.wholesalePrice(flower, +q) * n;
    s.inventory.flowers[key] -= n;
    if (!s.inventory.flowers[key]) delete s.inventory.flowers[key];
    s.player.coins += total;
    s.stats.sold += n;
    s.stats.coinsEarned += total;
    this.toast(`📦 Đã bán sỉ ${n} cành ${FLOWERS[flower].name} được ${total} 💰`, 'good');
    this.saveMgr.markDirty();
    this.emitter.emit('inventory');
    return total;
  }

  // ---------------- cấp độ & khu chợ ----------------
  gainXp(amount) {
    if (!amount) return;
    const ups = progression.addXp(this.save, amount);
    this.emitter.emit('xp');
    if (ups.length) {
      this.particles.spawn('sparkle', this.player.root.position.clone());
      this.emitter.emit('levelup', ups);
      this.emitter.emit('inventory');
      this.emitter.emit('tool', this.tool); // cập nhật danh sách hạt mới
    }
  }

  /** Mua hàng. what: 'seed' | 'supply' | 'papers' | 'ribbons' | 'upgrade' | 'plot' */
  buy(what, id, n = 1) {
    const s = this.save;
    let res;
    if (what === 'seed') res = market.buySeeds(s, id, n);
    else if (what === 'protect') res = market.buyProtection(s, id, n);
    else if (what === 'greenhouse') res = market.buyGreenhouse(s, +id);
    else if (what === 'supply') res = market.buySupply(s, id, n);
    else if (what === 'papers' || what === 'ribbons') res = market.buyWrap(s, what, id, n);
    else if (what === 'upgrade') res = market.buyUpgrade(s, id);
    else if (what === 'plot') res = market.buyPlot(s);
    else res = { ok: false, msg: 'Không rõ món hàng' };
    this.toast(res.msg, res.ok ? 'good' : 'warn');
    if (!res.ok) return res;
    if (what === 'plot') {
      this.farmView.build(s);
      this.updateLockedSlots();
      const slot = s.farm.plots.length - 1;
      this.controls.focusOn(PLOT_SLOTS[slot]);
      this.particles.spawn('sparkle', PLOT_SLOTS[slot].clone());
      this.particles.spawn('leaf', PLOT_SLOTS[slot].clone());
    }
    if (what === 'upgrade') this.applyUpgradeEffects();
    if (what === 'greenhouse') { this.farmView.sync(s, true); this.controls.focusOn(PLOT_SLOTS[+id]); this.particles.spawn('sparkle', PLOT_SLOTS[+id].clone()); }
    this.advanceTutorial('buy');
    this.saveMgr.markDirty();
    this.saveMgr.saveNow('manual');
    this.emitter.emit('inventory');
    this.emitter.emit('tool', this.tool);
    return res;
  }

  applyUpgradeEffects() {
    this.player.speedMult = progression.upgradeValue(this.save, 'shoes');
    this.player.actionMult = progression.upgradeValue(this.save, 'gloves');
  }

  /** Ẩn biển "lô bị khóa" ở những lô đã mở; cập nhật danh sách vật có thể chạm */
  updateLockedSlots() {
    const n = this.save.farm.plots.length;
    const locked = this.world.lockedSlots.filter((g) => {
      g.visible = g.userData.pick.slot >= n;
      return g.visible;
    });
    this.pickRoots = [this.farmView.root, this.customers.root, this.world.shop, this.world.market, ...locked];
  }

  // ---------------- phòng hộ ----------------
  /** Che bạt 1 lô (đến hết ngày mai) */
  coverPlot(pi, quiet = false) {
    const s = this.save;
    const plot = s.farm.plots[pi];
    const until = weather.protectUntil(this.now);
    if (plot.greenhouse) { if (!quiet) this.toast('Lô này có nhà kính rồi, không cần che bạt', 'info'); return false; }
    if ((plot.coverUntil || 0) >= until) { if (!quiet) this.toast('Lô này đã được che bạt rồi', 'info'); return false; }
    if (!(s.inventory.items.cover > 0)) { if (!quiet) this.toast('Hết bạt che! Mua ở Khu Chợ, mục Phòng hộ', 'warn'); return false; }
    s.inventory.items.cover -= 1;
    plot.coverUntil = until;
    this.particles.spawn('sparkle', PLOT_SLOTS[pi].clone());
    if (!quiet) this.toast(`⛺ Đã che bạt lô số ${pi + 1} đến hết ngày mai`, 'good');
    this.afterProtect();
    return true;
  }

  coverAll() {
    let n = 0;
    this.save.farm.plots.forEach((_, i) => { if (this.coverPlot(i, true)) n++; });
    this.toast(n ? `⛺ Đã che bạt ${n} lô đất đến hết ngày mai` : 'Không che thêm được lô nào (đã che, có nhà kính, hoặc hết bạt)', n ? 'good' : 'warn');
    return n;
  }

  /** Phun thuốc cho mọi cây đang sống (ưu tiên cây bệnh) */
  treatAll() {
    const s = this.save;
    const until = weather.protectUntil(this.now);
    const list = [];
    s.farm.plots.forEach((p, pi) => p.tiles.forEach((t, ti) => {
      if ((t.state === 'growing' || t.state === 'ready') && (t.sick || (t.guardUntil || 0) < until)) list.push({ t, pi, ti });
    }));
    list.sort((a, b) => !!b.t.sick - !!a.t.sick);
    let n = 0;
    for (const { t, pi, ti } of list) {
      if (!farming.treat(t, s, this.now).ok) break;
      n++;
      this.particles.spawn('spray', this.farmView.tileWorldPos(pi, ti));
    }
    if (!list.length) this.toast('Không có cây nào cần phun thuốc', 'info');
    else this.toast(n ? `💊 Đã phun thuốc cho ${n} cây${n < list.length ? ` (hết thuốc, còn ${list.length - n} cây)` : ''}` : 'Hết thuốc! Mua ở Khu Chợ, mục Phòng hộ', n ? 'good' : 'warn');
    this.afterProtect();
    return n;
  }

  afterProtect() {
    this.farmView.sync(this.save);
    this.saveMgr.markDirty();
    this.emitter.emit('inventory');
    this.emitter.emit('refresh');
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
