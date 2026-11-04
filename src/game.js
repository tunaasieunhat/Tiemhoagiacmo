// =============================================================
//  BỘ ĐIỀU KHIỂN GAME: nối dữ liệu (save) <-> logic <-> đồ họa <-> giao diện
// =============================================================
import * as THREE from 'three';
import { TIME, STARTER, GRAPHICS } from '../data/config.js';
import { FLOWERS, FLOWER_IDS, NORMAL_FLOWER_IDS } from '../data/flowers.js';
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
import * as variants from './systems/variants.js';
import * as notebook from './systems/notebook.js';
import * as breeding from './systems/breeding.js';
import * as regulars from './systems/regulars.js';
import { REGULAR_RULES } from '../data/regulars.js';
import { MEANINGS } from '../data/variants.js';
import * as quests from './systems/quests.js';
import * as automation from './systems/automation.js';
import { STAFF, MACHINES } from '../data/automation.js';
import { DECOR, DECOR_RULES, DECOR_EVENTS } from '../data/decor.js';
import * as decorSys from './systems/decor.js';
import { DecorView } from './render/decorView.js';
import { VillagerView } from './render/villagers.js';
import { VILLAGE } from '../data/village.js';
import * as relations from './systems/relations.js';
import * as favors from './systems/favors.js';
import { desiredState } from './systems/village.js';
import { submitContest } from './online/ranking.js';
import { PAPERS as WRAP_PAPERS, RIBBONS as WRAP_RIBBONS } from '../data/wrapping.js';
import * as farming from './systems/farming.js';
import { clockOf } from './systems/time.js';
import { FarmView, TILE_TOP } from './render/farmView.js';
import { Player } from './render/player.js';
import { iconMaterial } from './render/icons.js';
import { buildCharacter } from './models/character.js';
import { snapshotToFarm } from './online/showcase.js';
import { social } from './online/social.js';
import { viError } from './online/errors.js';
import { Particles, Fireflies } from './render/particles.js';
import { DayNight } from './render/dayNight.js';
import { CameraControls } from './render/cameraControls.js';
import { PLOT_SLOTS, ZONES, plotPosition } from './render/world.js';
import * as land from './systems/land.js';
import { PARCELS } from '../data/land.js';
import { createPlot } from './save/schema.js';
import * as luck from './systems/luck.js';
import { TICKET_SOURCES } from '../data/luck.js';

const ACTIONS = {
  till: (t, s) => farming.till(t, s),
  plant: (t, s, o, now) => farming.plant(t, o.seed, s, now, { plot: o.plot }),
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
    this.seed = Object.keys(this.save.inventory.seeds).find((k) => this.save.inventory.seeds[k] > 0) || variants.vkey('tulip');
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
    this.weatherFx = new WeatherFx(stage.scene, stage.camera);
    weather.ensureWeather(this.save);
    this.applyWeatherVisuals(true);
    // GĐ8: trang trí, nhân viên, nhiệm vụ
    this.decorView = new DecorView(stage.scene);
    this.decorEdit = null; // món đang chọn / đang dời trong chế độ trang trí (GĐ10)
    // GĐ11: dân làng
    this.villagers = new VillagerView(stage.scene, world.village?.houses || {});
    this.decorView.sync(this.save.decor.placed);
    this.staffModels = {};
    for (const [id, st] of Object.entries(STAFF)) {
      const m = buildCharacter(st.look).root;
      m.position.copy(id === 'gardener' ? new THREE.Vector3(-5.0, 0, 2.2) : new THREE.Vector3(9.3, 0, -3.8));
      m.rotation.y = id === 'gardener' ? 1.2 : 0.4;
      m.scale.setScalar(0.92);
      m.visible = false;
      stage.scene.add(m);
      this.staffModels[id] = m;
    }
    quests.refreshQuests(this.save, dayOf(this.save.time.gameMinutes), { online: false });
    this.updateStaffModels();
    this.controls = new CameraControls(stage.camera, stage.renderer.domElement, {
      onTap: (x, y) => this.onTap(x, y),
      onHover: (x, y) => this.onHover(x, y),
      // kéo món đồ đang dời (chế độ trang trí)
      onDragStart: (x, y) => this.decorMode && this.decorEdit && this.pickAt(x, y)?.kind === 'decorGhost',
      onDrag: (x, y) => this.moveDecorEdit(x, y),
      onDragEnd: () => {},
    });
    this.controls.regions.push({ x: VILLAGE.center.x, z: VILLAGE.center.z, r: VILLAGE.camRadius });
    // camera bắt đầu nhìn vào lô đất đầu tiên; điện thoại dọc thì zoom gần hơn
    const portrait = innerWidth < innerHeight;
    this.controls.target.copy(PLOT_SLOTS[0]).add(portrait ? new THREE.Vector3(0.7, 0, 0.7) : new THREE.Vector3(1.5, 0, -1));
    if (portrait) this.controls.zoom = 1.75;
    this.controls.apply();
    this.updateLockedSlots();
    this.applyUpgradeEffects();
    // biểu tượng "đã lai xong" trên Nhà lai tạo
    this.labIcon = new THREE.Sprite(iconMaterial('ready'));
    this.labIcon.scale.set(0.9, 0.9, 1);
    this.labIcon.position.copy(world.lab.position).setY(4.6);
    this.labIcon.renderOrder = 6;
    this.labIcon.visible = false;
    stage.scene.add(this.labIcon);
    this.labNotified = false;
    // đồ họa: 'auto' bắt đầu ở mức Cao (máy tính) / Vừa (điện thoại), tự giảm nếu chậm
    this.autoLevel = stage.isMobile ? 'medium' : 'high';
    this.applyGraphics();
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
          automation.runMachines(s, plot, tile, cap);
          const growMult = tile.flower ? calendar.seasonGrowMult(tile.flower, day, plot.greenhouse) : 1;
          const e = farming.simulateTile(tile, step, { offline, env: { growMult, waterMult: env.waterMult } });
          if (!e) return;
          ev[e]++;
          if (!offline) {
            const name = FLOWERS[tile.flower]?.name ?? 'Cây';
            if (e === 'ready') this.toast(`🌸 ${name} đã nở! Thu hoạch thôi`, 'good');
            if (e === 'dead') this.toast(`🥀 ${name} đã chết vì ${tile.sick ? 'bệnh' : 'thiếu nước'}`, 'bad');
            if (e === 'ready' && !this.visit) this.particles.spawn('sparkle', this.farmView.tileWorldPos(pi, ti));
          }
        });
      });
      // nhân viên
      this.runStaff(to, offline);
      // cửa hàng: khách đến / khách bỏ đi
      const shopEv = shop.shopTick(s, {
        offline, hourFloat: this.clock.hourFloat, flowerIds: this.unlockedFlowers(),
        festival: calendar.festivalOn(day), seasonal: calendar.seasonFlowers(day), day,
        spawnMult: WEATHER[s.weather?.today?.type]?.spawnMult ?? 1,
      });
      for (const e of shopEv) {
        const npc = shop.npcOf(e.customer.npc);
        if (e.type === 'arrive') {
          this.toast(e.customer.regular ? `💌 Khách quen ${npc.name} ghé tiệm, có chuyện muốn kể!` : `🔔 ${npc.name} vừa đến tiệm hoa!`, e.customer.regular ? 'good' : 'info');
          this.customers.sync(s);
        } else if (e.type === 'timeout') {
          this.customers.leave(e.customer.id, e.customer.regular ? 'sad' : 'angry');
          if (e.customer.regular) {
            regulars.finishRegularVisit(s, e.customer.regular, false, day);
            if (!e.silent) this.toast(`${npc.name} phải về rồi, hôm khác ${npc.self} sẽ ghé lại nhé.`, 'info');
          } else if (!e.silent) this.toast(`😤 ${npc.name} chờ lâu quá nên đã bỏ đi (${shop.reactionText('timeout', e.customer.npc)})`, 'bad');
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
      // trả lương nhân viên + nhiệm vụ mới
      for (const w of automation.payWages(this.save)) {
        if (!w.paid && !offline) this.toast(`😢 Không đủ tiền trả lương, ${STAFF[w.id].name} tạm nghỉ. Vào Khu Chợ › Tự động để thuê lại`, 'warn');
      }
      if (quests.refreshQuests(this.save, e.day, { online: !!this.account?.session })) this.emitter.emit('quests');
      if (offline) return;
      const c = calendar.calendarOf(e.day);
      if (e.seasonChanged) this.toast(`${c.season.icon} ${c.season.name} đã đến! Hoa đúng mùa: ${calendar.seasonFlowers(e.day).map((f) => FLOWERS[f].icon).join(' ')}`, 'good');
      if (e.festival) this.toast(`${e.festival.icon} Hôm nay: ${e.festival.name}! Khách sẽ đến đông và trả giá cao`, 'good');
      const tm = e.tomorrow;
      const W = WEATHER[tm.type];
      const parts = [];
      if (W.disaster) parts.push(`${W.icon} ${W.name}`);
      if (tm.disease) parts.push(`${DISEASES[tm.disease].icon} ${DISEASES[tm.disease].name}`);
      if (W.good) parts.push(`${W.icon} ${W.name}`);
      if (e.tomorrowFestival) parts.push(`${e.tomorrowFestival.icon} ${e.tomorrowFestival.name}`);
      if (parts.length) setTimeout(() => this.toast(`📢 Dự báo ngày mai: ${parts.join(', ')}. Bấm vào đồng hồ để xem cách chuẩn bị`, W.disaster || tm.disease ? 'warn' : 'info'), 1200);
    } else if (e.type === 'disaster') {
      ev.disasters.push(e);
      this.emitter.emit('refresh');
      if (e.silent) return;
      const W = WEATHER[e.weather];
      if (e.hit) this.toast(`${W.icon} ${W.name}! ${e.hit} cây bị ảnh hưởng${e.destroyed ? `, ${e.destroyed} cây bị hỏng` : ''}${e.saved ? ` · ${e.saved} cây được che chắn an toàn` : ''}`, 'bad');
      else if (e.saved) this.toast(`${W.icon} ${W.name} đã qua. Nhờ che chắn, ${e.saved} cây đều an toàn! 👍`, 'good');
      else if (!e.blown) this.toast(`${W.icon} ${W.name} đã qua, vườn không bị hại gì 👍`, 'info');
      if (e.blown) setTimeout(() => this.toast(`${W.icon} Gió thổi bay bạt che của ${e.blown} lô! Nhớ che lại nếu sắp có thiên tai`, 'warn'), 900);
      this.refreshFarm();
    } else if (e.type === 'gift') {
      this.emitter.emit('inventory');
      if (e.silent) return;
      const { species, variant } = variants.parseVkey(e.seed);
      this.toast(`🌠 Một ngôi sao băng rơi xuống vườn... bạn nhặt được hạt ${variants.variantName(species, variant)} hiếm!`, 'good');
      if (!this.visit) this.particles.spawn('sparkle', this.player.root.position.clone().setY(1.2));
    } else if (e.type === 'outbreak') {
      ev.outbreaks.push(e);
      if (e.silent) return;
      const D = DISEASES[e.disease];
      if (e.infected) this.toast(`${D.icon} ${D.name} bùng phát: ${e.infected} cây bị bệnh! Dùng 💊 Thuốc${D.fertCures ? ' hoặc 🧪 phân bón' : ''} để chữa`, 'bad');
      else this.toast(`${D.icon} ${D.name} xuất hiện nhưng không cây nào bị${e.guarded ? ' nhờ được phòng trước' : ''} 👍`, 'good');
    } else if (e.type === 'remind') {
      const W = WEATHER[e.tomorrow.type];
      const what = [W.disaster ? W.name : '', e.tomorrow.disease ? DISEASES[e.tomorrow.disease].name : ''].filter(Boolean).join(' và ');
      const D = DISEASES[e.tomorrow.disease];
      const coverTip = W.disaster ? (W.blowsCover ? 'che bạt ⛺ cho cây thân cao (bạt đỡ xong sẽ bị gió thổi bay)' : 'che bạt ⛺') : '';
      const medTip = D ? (D.coverSafe ? 'che bạt ⛺ hoặc phun thuốc 💊' : 'phun thuốc 💊') : '';
      this.toast(`⏰ Ngày mai có ${what}! Nhớ ${coverTip}${coverTip && medTip ? ' và ' : ''}${medTip} nhé`, 'warn');
    }
  }

  /** Cập nhật màu cỏ cây theo mùa + hiệu ứng thời tiết hôm nay */
  applyWeatherVisuals(instant = false) {
    const w = weather.ensureWeather(this.save);
    const c = calendar.calendarOf(dayOf(this.save.time.gameMinutes));
    this.seasonVisuals.set(c.seasonIndex, instant);
    this.weatherFx.set(w.today.type, c.seasonIndex);
    this.dayNight.setWeather(w.today.type);
    this.farmView.wind = { storm: 1, wind: 0.85, hail: 0.5, rain: 0.25 }[w.today.type] || 0;
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
      if (!this.visit) this.farmView.sync(this.save);
      this.customers.sync(this.save);
      const ready = breeding.labReady(this.save) && !this.visit;
      this.labIcon.visible = ready;
      if (ready && !this.labNotified) { this.labNotified = true; this.toast('🧬 Nhà lai tạo đã xong! Bấm 🧬 để nhận hạt giống', 'good'); }
      if (!this.save.lab.slot) this.labNotified = false;
      this.emitter.emit('refresh');
    }

    this.controls.update(dt);
    this.player.update(dt);
    this.farmView.night = this.dayNight.night || 0;
    this.farmView.update(dt);
    // bạt che / nhà kính mờ dần khi phóng to hoặc khi chọn ô trong lô đó
    this.farmView.updateSeeThrough(dt, this.controls.zoom, !this.visit && this.selected?.kind === 'tile' ? this.selected.plot : -1);
    this.particles.update(dt);
    this.customers.update(dt);
    this.dayNight.update(c.hourFloat, this.controls.target, dt);
    this.seasonVisuals.update(dt);
    this.weatherFx.update(dt, this.controls.target, this.clock.hourFloat);
    this.decorView.update(dt);
    this.villagers.update(dt, this.villageCtx());
    for (const m of Object.values(this.staffModels)) if (m.visible) m.position.y = Math.abs(Math.sin(performance.now() / 400)) * 0.03;
    if (this.labIcon.visible) this.labIcon.position.y = 4.6 + Math.sin(performance.now() / 300) * 0.12;
    this.fireflies.update(performance.now() / 1000, this.dayNight.night);
  }

  // ---------------- chọn & chạm ----------------
  pickAt(x, y) {
    this.raycaster.setFromCamera(this.controls.ndc(x, y), this.stage.camera);
    const hits = this.raycaster.intersectObjects(this.pickRoots, true);
    // ô đất nằm ngay dưới ngón tay (chiếu xuống mặt ruộng)
    const ground = new THREE.Vector3();
    const under = !this.decorMode && this.raycaster.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), -TILE_TOP), ground)
      ? this.farmView.tileNear(ground.x, ground.z) : null;
    let houseHit = null;
    for (const h of hits) {
      // three.js vẫn dò trúng vật đang ẨN (biểu tượng ⭐/💧 đã tắt, khách đã đi...) => bỏ qua, nếu không sẽ chọn nhầm
      if (!isShown(h.object)) continue;
      let o = h.object;
      while (o) {
        if (o.userData?.pick) {
          const pk = o.userData.pick;
          // vùng chạm của nhà to hơn ngôi nhà => người đứng trước cửa (vd Cô Ngân bán ở Quán Mây) vẫn phải chạm được:
          // gặp nhà thì dò tiếp xem phía sau có dân làng không
          if (pk.kind === 'house') { houseHit = houseHit || pk; break; }
          if (houseHit && pk.kind !== 'villager') return houseHit;
          // trúng vách bên / mép của ô đất (sát mặt đất) => lấy ô dưới ngón tay; trúng cây, biểu tượng => giữ ô của cây đó
          if (pk.kind === 'tile' && under && h.point.y < TILE_TOP + 0.05) return under;
          if (pk.kind === 'villager') return this.nearestVillagerHit(hits, pk);
          return pk;
        }
        o = o.parent;
      }
    }
    if (houseHit) return houseHit;
    // chạm trúng khe giữa các ô đất: lấy ô gần nhất
    return under;
  }

  /** 2 dân làng đứng sát nhau (vd cùng tán gẫu ở giếng) ⇒ chọn người có thân gần tia chạm nhất */
  nearestVillagerHit(hits, first) {
    const ids = new Set();
    for (const h of hits) {
      let o = h.object;
      while (o && !o.userData?.pick) o = o.parent;
      if (o?.userData.pick.kind === 'villager' && isShown(h.object)) ids.add(o.userData.pick.id);
    }
    if (ids.size < 2) return first;
    const ray = this.raycaster.ray;
    let best = first, bestD = Infinity;
    for (const id of ids) {
      const v = this.villagers.list.find((q) => q.id === id);
      if (!v) continue;
      const c = v.g.position.clone(); c.y += 0.9;
      const d = ray.distanceToPoint(c);
      if (d < bestD) { bestD = d; best = { kind: 'villager', id }; }
    }
    return best;
  }

  onHover(x, y) {
    const pick = x == null ? null : this.pickAt(x, y);
    this.farmView.setHover(pick);
    this.stage.renderer.domElement.style.cursor = pick ? 'pointer' : 'grab';
  }

  onTap(x, y) {
    const pick = this.pickAt(x, y);
    if (this.visit) { this.onVisitTap(pick); return; }
    if (this.decorMode) { this.onDecorTap(pick, x, y); return; }
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
    } else if (pick.kind === 'zone' && pick.zone === 'lab') {
      this.select(null);
      this.emitter.emit('open-lab');
    } else if (pick.kind === 'zone') {
      this.select(null);
      const z = ZONES[pick.zone];
      this.controls.focusOn(z.center);
      if (pick.zone === 'shop') this.emitter.emit('open-shop', {});
      else this.emitter.emit('open-market', {});
    } else if (pick.kind === 'villager') {
      this.select(null);
      this.emitter.emit('villager', { id: pick.id });
    } else if (pick.kind === 'house') {
      this.select(null);
      this.emitter.emit('house', { id: pick.id });
    } else if (pick.kind === 'parcel') {
      this.select(null);
      this.emitter.emit('parcel', { id: pick.id });
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
    if (this.visit) return false;
    const tile = this.getTile(pick);
    const fn = ACTIONS[action];
    if (!tile || !fn) return false;
    if (action === 'plant' && !opt.seed) opt.seed = this.seed;
    const s = this.save;
    if (action === 'plant') opt.plot = s.farm.plots[pick.plot];
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
      const fname = FLOWERS[tile.flower].name;
      if (tile.offSeason) setTimeout(() => this.toast(`🍂 ${fname} đang trái mùa: lớn chậm và khó đạt 3★ (trừ khi có nhà kính)`, 'warn'), 600);
    }
    if (action === 'harvest') {
      this.emitter.emit('float', { pos: pos.clone().setY(1.2), text: `+1 ${FLOWERS[res.flower].icon} ${'★'.repeat(res.quality)}${res.bonus ? ' 🌈' : ''}` });
      if (res.bonus) this.particles.spawn('sparkle', pos);
      this.particles.spawn('leaf', pos);
      if (notebook.recordHarvest(this.save, res.flower, res.variant, res.quality, dayOf(this.now))) {
        const r = variants.rarityOf(res.flower, res.variant);
        setTimeout(() => this.toast(`📖 Màu hoa mới vào Sổ tay: ${variants.variantName(res.flower, res.variant)} (${r.name})!`, 'good'), 700);
        this.checkBookMilestones();
        this.questEvent('newcolor');
        this.emitter.emit('book');
      }
    } else {
      this.emitter.emit('float', { pos: pos.clone().setY(1.0), text: res.msg, small: true });
    }
    this.refreshFarm();
    this.gainXp(action === 'harvest' ? XP.harvestPerStar * res.quality : XP[action] ?? 1);
    if (action === 'harvest') { this.questEvent('harvest'); if (res.quality === 3) this.questEvent('harvest3'); }
    if (action === 'plant' || action === 'water') this.questEvent(action);
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
    return NORMAL_FLOWER_IDS.filter((id) => FLOWERS[id].unlockLevel <= this.save.player.level);
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
    // khách giải thích ý nghĩa 1 loài hoa mới (khám phá ngôn ngữ loài hoa)
    const learned = [...new Set(ev.items.map((it) => variants.vkey(it.species, it.variant)))].filter((k) => notebook.learnMeaning(s, k));
    if (learned.length) {
      const k = learned[0];
      const { species, variant } = variants.parseVkey(k);
      const ms = variants.meaningsOf(species, variant).map((m) => MEANINGS[m].name.toLowerCase()).join(', ');
      setTimeout(() => this.toast(`💬 ${npc.name}: “${variants.variantName(species, variant)} mang ý nghĩa ${ms} đó!”${learned.length > 1 ? ` (+${learned.length - 1} ý nghĩa khác vào Sổ tay)` : ''}`, 'good'), 1600);
      this.emitter.emit('book');
    }
    let story = null;
    if (c.regular) {
      const ok = ev.score >= REGULAR_RULES.successScore;
      const ch = regulars.regularChapter(c.regular, s);
      story = { id: c.regular, ok, chapter: ch, ...regulars.finishRegularVisit(s, c.regular, ok, dayOf(this.now)) };
      if (story.reward?.xp) this.gainXp(story.reward.xp);
    }
    this.particles.spawn(ev.mood === 'bad' ? 'leaf' : 'sparkle', pos.clone().setY(0.5));
    this.emitter.emit('float', { pos, text: `+${ev.price + tip} 💰  ${ev.repDelta >= 0 ? '+' : ''}${ev.repDelta} 💗` });
    this.toast(`${npc.name}: “${shop.reactionText(ev.mood, c.npc)}”`, ev.mood === 'bad' ? 'warn' : 'good');
    if (tip) setTimeout(() => this.toast(`💝 ${npc.name} cho thêm ${tip} 💰 tiền bo!`, 'good'), 900);
    const newTier = shop.tierOf(s.player.reputation);
    if (newTier > oldTier) setTimeout(() => this.toast(`🎉 Tiệm lên bậc "${shop.tierInfo(s.player.reputation).name}"! Khách sẽ đến đông hơn.`, 'good'), 1800);
    this.gainXp(Math.floor((ev.price + tip) / 10) * XP.sellPer10Coins + (bouquet ? XP.bouquet : 0) + (ev.mood === 'perfect' ? XP.perfect : 0));
    this.questEvent('serve');
    this.questEvent('earn', ev.price + tip);
    if (bouquet) this.questEvent('bouquet');
    if (ev.mood === 'perfect') this.questEvent('perfect');
    if (story?.ok) this.questEvent('regular');
    this.advanceTutorial('sell');
    this.saveMgr.markDirty();
    this.emitter.emit('inventory');
    this.emitter.emit('shop');
    if (story) setTimeout(() => this.emitter.emit('regular-story', story), 400);
    return { ok: true, ev, tip, story };
  }

  declineCustomer(customerId) {
    const s = this.save;
    const c = s.shop.customers.find((x) => x.id === customerId);
    if (!c) return;
    s.shop.customers.splice(s.shop.customers.indexOf(c), 1);
    if (c.regular) regulars.finishRegularVisit(s, c.regular, false, dayOf(this.now));
    else s.player.reputation = Math.max(0, s.player.reputation + shop.SHOP_REP.decline);
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
    const flower = variants.parseFlowerKey(key).species;
    const total = shop.wholesalePrice(key) * n;
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
      // 🍀 vé Vận May khi lên cấp
      const tk = { luck: 0, gold: 0 };
      for (const u of ups) { const r = luck.levelUpTickets(this.save, u.level); tk.luck += r.luck || 0; tk.gold += r.gold || 0; u.tickets = r; }
      if (tk.luck || tk.gold) setTimeout(() => this.toast(`🍀 Quà lên cấp: ${tk.luck ? `+${tk.luck} 🎟️ vé may mắn` : ''}${tk.luck && tk.gold ? ', ' : ''}${tk.gold ? `+${tk.gold} 🎫 vé vàng` : ''}`, 'good'), 1500);
      this.emitter.emit('luck');
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
      if (!this.visit) this.farmView.build(s);
      this.updateLockedSlots();
      const pi = s.farm.plots.length - 1;
      this.controls.focusOn(this.plotPos(pi));
      this.particles.spawn('sparkle', this.plotPos(pi));
      this.particles.spawn('leaf', this.plotPos(pi));
    }
    if (what === 'upgrade') this.applyUpgradeEffects();
    if (what === 'greenhouse') { this.refreshFarm(true); this.controls.focusOn(this.plotPos(+id)); this.particles.spawn('sparkle', this.plotPos(+id)); }
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
    const plots = (this.visit ? this.visitFarm : this.save).farm.plots;
    const own = market.ownedSlots({ farm: { plots } });
    const locked = this.world.lockedSlots.filter((g) => {
      g.visible = !own.has(g.userData.pick.slot);
      return g.visible && !this.visit;
    });
    // mảnh đất của dân làng: mua rồi thì ẩn biển & hàng rào dây
    const parcels = Object.entries(this.world.parcels || {}).filter(([id, g]) => {
      g.visible = !plots.some((p) => p.parcel === id);
      return g.visible && !this.visit;
    }).map(([, g]) => g);
    this.pickRoots = this.decorMode ? [this.decorView.root] : [this.farmView.root, this.customers.root, this.world.shop, this.world.market, this.world.lab, ...locked, ...parcels, this.villagers.root, ...this.villagers.housePick()];
  }

  /** Vị trí lô thứ pi (lô của dân làng nằm ở mảnh đất riêng) */
  plotPos(pi) {
    const plots = (this.visit ? this.visitFarm : this.save).farm.plots;
    return plotPosition(plots[pi], pi);
  }

  /** Vẽ lại nông trại của mình (không làm gì khi đang thăm nhà bạn) */
  refreshFarm(instant = false) {
    if (!this.visit) this.farmView.sync(this.save, instant);
  }

  // ---------------- bạn bè (GĐ7) ----------------
  get socialMgr() { return this.account?.social || null; }

  /** Bạn bè đã tưới giúp nông trại của mình */
  receiveWaterHelp(helps) {
    const s = this.save;
    const cap = farming.waterCapacity(s);
    s.farm.plots.forEach((p) => p.tiles.forEach((t) => { if (['tilled', 'growing', 'ready'].includes(t.state)) t.water = Math.max(t.water, cap); }));
    const names = [...new Set(helps.map((h) => h.helper || 'Một người bạn'))];
    this.toast(`💧 ${names.slice(0, 3).join(', ')}${names.length > 3 ? ` và ${names.length - 3} người khác` : ''} đã tưới giúp nông trại của bạn!`, 'good');
    if (!this.visit) { s.farm.plots.forEach((_, pi) => this.particles.spawn('water', this.plotPos(pi))); this.farmView.sync(s); }
    this.saveMgr.markDirty();
  }

  /** Nhận quà từ hộp quà (đã được máy chủ đánh dấu là đã nhận) */
  receiveGifts(list) {
    const s = this.save;
    const inv = s.inventory;
    const lines = [];
    for (const g of list) {
      if (g.kind === 'flower' && /^[a-z]+:[a-z]+\|[1-3]$/.test(g.key)) { inv.flowers[g.key] = (inv.flowers[g.key] || 0) + g.qty; const f = variants.parseFlowerKey(g.key); lines.push(`${g.qty} ${variants.variantName(f.species, f.variant)} ${'★'.repeat(f.q)}`); }
      else if (g.kind === 'seed' && /^[a-z]+:[a-z]+$/.test(g.key)) { inv.seeds[g.key] = (inv.seeds[g.key] || 0) + g.qty; const v = variants.parseVkey(g.key); lines.push(`${g.qty} hạt ${variants.variantName(v.species, v.variant)}`); }
      else if (g.kind === 'item' && ['fertilizer', 'cover', 'medicine'].includes(g.key)) { inv.items[g.key] = (inv.items[g.key] || 0) + g.qty; lines.push(`${g.qty} ${{ fertilizer: 'phân bón', cover: 'bạt che', medicine: 'thuốc' }[g.key]}`); }
      else if (g.kind === 'coins') { s.player.coins += g.qty; lines.push(`${g.qty} xu`); }
    }
    this.saveMgr.markDirty();
    this.saveMgr.saveNow('manual');
    this.emitter.emit('inventory');
    this.emitter.emit('tool', this.tool);
    return lines;
  }

  /** Tưới giúp bạn (máy chủ kiểm tra 1 lần/ngày). Thưởng nhỏ cho người tốt bụng */
  async helpWaterFriend(friendId) {
    const r = await this.socialMgr?.act(() => social.helpWater(friendId));
    if (!r) return false;
    this.save.player.coins += 10;
    this.gainXp(5);
    this.toast('💧 Đã tưới giúp! +10 💰 +5 XP vì lòng tốt', 'good');
    this.questEvent('help');
    if (this.visit?.profile.id === friendId) {
      this.visit.helped_today = true;
      this.visitFarm.farm.plots.forEach((p, pi) => {
        p.tiles.forEach((t) => { if (t.state !== 'untilled') t.water = 1; });
        this.particles.spawn('water', this.plotPos(pi));
      });
      this.farmView.sync(this.visitFarm, true);
      this.emitter.emit('visit', this.visit);
    }
    this.saveMgr.markDirty();
    this.emitter.emit('inventory');
    return true;
  }

  /** Tặng quà: đồng bộ trước (máy chủ đối chiếu với save trên mạng), gửi, rồi trừ trong kho */
  async sendGiftTo(friendId, kind, key, qty, message) {
    const s = this.save;
    const inv = s.inventory;
    const have = kind === 'flower' ? inv.flowers[key] : kind === 'seed' ? inv.seeds[key] : kind === 'item' ? inv.items[key] : s.player.coins;
    if (!(have >= qty)) { this.toast('Bạn không có đủ món này', 'warn'); return false; }
    const cloud = this.account?.cloud;
    await this.saveMgr.saveNow('manual');
    if (cloud && !(await cloud.flush())) { this.toast('Chưa đồng bộ được tiến độ lên mạng, thử lại sau nhé', 'warn'); return false; }
    try {
      await social.sendGift(friendId, kind, key, qty, message);
    } catch (e) {
      this.toast(viError(e), 'warn');
      return false;
    }
    if (kind === 'flower') { inv.flowers[key] -= qty; if (!inv.flowers[key]) delete inv.flowers[key]; }
    else if (kind === 'seed') inv.seeds[key] -= qty;
    else if (kind === 'item') inv.items[key] -= qty;
    else s.player.coins -= qty;
    this.gainXp(3);
    this.toast('🎁 Đã gửi quà! Bạn ấy sẽ nhận trong Hộp quà', 'good');
    if (this.visit?.profile.id === friendId) { this.visit.gifted_today = true; this.emitter.emit('visit', this.visit); }
    this.saveMgr.markDirty();
    this.saveMgr.saveNow('manual');
    this.emitter.emit('inventory');
    this.socialMgr?.poll();
    return true;
  }

  /** Vào thăm nông trại bạn bè (chỉ xem) */
  async enterVisit(friendId) {
    let data;
    try { data = await social.visit(friendId); } catch (e) { this.toast(viError(e), 'warn'); return false; }
    if (!data) { this.toast('Không tìm thấy nông trại này', 'warn'); return false; }
    this.visit = data;
    this.visitFarm = snapshotToFarm(data.snapshot);
    this.select(null);
    this.setTool('hand');
    this.player.clearQueue();
    this.farmView.build(this.visitFarm);
    this.player.root.visible = false;
    this.customers.root.visible = false;
    this.labIcon.visible = false;
    if (this.decorMode) this.setDecorMode(false);
    this.decorView.sync(decorSys.placedFromSnapshot(data.snapshot));
    this.updateStaffModels();
    this.updateLockedSlots();
    if (this.visitor) this.stage.scene.remove(this.visitor);
    this.visitor = buildCharacter({ ...data.profile.avatar }).root;
    this.visitor.position.copy(PLOT_SLOTS[0]).add(new THREE.Vector3(2.6, 0, 1.2));
    this.visitor.rotation.y = -0.6;
    this.stage.scene.add(this.visitor);
    this.controls.focusOn(PLOT_SLOTS[0].clone().add(new THREE.Vector3(1.4, 0, 0)), 1.4);
    if (!data.snapshot) this.toast(`${data.profile.name} chưa mở nông trại cho bạn bè xem (cần chơi online một lúc)`, 'info');
    this.emitter.emit('visit', data);
    return true;
  }

  exitVisit() {
    if (!this.visit) return;
    this.visit = null;
    this.visitFarm = null;
    if (this.visitor) { this.stage.scene.remove(this.visitor); this.visitor = null; }
    this.farmView.build(this.save);
    this.player.root.visible = true;
    this.customers.root.visible = true;
    this.decorView.sync(this.save.decor.placed);
    this.updateStaffModels();
    this.updateLockedSlots();
    this.controls.focusOn(PLOT_SLOTS[0].clone().add(new THREE.Vector3(1.4, 0, -0.6)));
    this.emitter.emit('visit', null);
  }

  async refreshVisit() {
    if (!this.visit) return;
    try { const d = await social.visit(this.visit.profile.id); if (d) { Object.assign(this.visit, d); this.emitter.emit('visit', this.visit); } } catch { /* bỏ qua */ }
  }

  onVisitTap(pick) {
    if (!pick) return;
    if (pick.kind === 'tile') {
      const t = this.visitFarm.farm.plots[pick.plot]?.tiles[pick.tile];
      this.farmView.setSelected(pick);
      if (!t || !t.flower) { this.toast(t?.state === 'tilled' ? 'Đất đã xới, chưa gieo hạt' : 'Ô đất trống', 'info'); return; }
      const st = t.state === 'ready' ? 'đã nở' : t.state === 'dead' ? 'đã héo' : farming.STAGE_NAMES[farming.stageOf(t)].toLowerCase();
      this.toast(`${FLOWERS[t.flower].icon} ${variants.variantName(t.flower, t.variant)} · ${st}${t.water < 0.25 && t.state !== 'dead' ? ' · đang khát nước 💧' : ''}`, 'info');
    } else {
      this.toast(`Bạn đang thăm nhà ${this.visit.profile.name}. Bấm 🏠 Về nhà để quay lại.`, 'info');
    }
  }

  // ---------------- nhiệm vụ (GĐ8) ----------------
  questEvent(event, amount = 1) {
    const done = quests.questProgress(this.save, event, amount);
    for (const d of done) this.toast(`📋 Hoàn thành nhiệm vụ: ${d.template.text.replace('{n}', d.quest.n)}! Vào 📋 để nhận thưởng`, 'good');
    this.emitter.emit('quests');
  }

  claimQuest(kind, i) {
    const rw = quests.claimQuest(this.save, kind, i);
    if (!rw) return null;
    this.gainXp(rw.xp);
    // 🍀 vé Vận May: mỗi nhiệm vụ tuần 1 vé vàng, nhận đủ nhiệm vụ ngày được 1 vé may mắn
    let tk = null;
    if (kind === 'weekly') tk = luck.grantTickets(this.save, TICKET_SOURCES.weeklyQuest);
    else if ((this.save.quests.daily || []).length && this.save.quests.daily.every((q) => q.claimed)) tk = luck.grantTickets(this.save, TICKET_SOURCES.dailyQuestsAll);
    const tkText = tk ? `${tk.luck ? ` +${tk.luck} 🎟️` : ''}${tk.gold ? ` +${tk.gold} 🎫` : ''}` : '';
    if (tk) this.emitter.emit('luck');
    this.toast(`🎁 Nhận thưởng: +${rw.coins} 💰 +${rw.xp} XP${rw.fertilizer ? ` +${rw.fertilizer} 🧪` : ''}${tkText}`, 'good');
    this.saveMgr.markDirty();
    this.emitter.emit('inventory');
    this.emitter.emit('quests');
    return rw;
  }

  // ---------------- cuộc thi hoa (GĐ8) ----------------
  /** Nộp bài: đồng bộ trước (máy chủ đối chiếu kho hoa), gửi Edge Function, rồi trừ hoa đã dự thi */
  async submitContestEntry(sel) {
    const s = this.save;
    for (const [k, n] of Object.entries(sel.items)) if (n > 0 && !((s.inventory.flowers[k] || 0) >= n)) { this.toast('Không đủ hoa trong kho', 'warn'); return null; }
    const cloud = this.account?.cloud;
    await this.saveMgr.saveNow('manual');
    if (cloud && !(await cloud.flush())) { this.toast('Chưa đồng bộ được tiến độ lên mạng, thử lại sau nhé', 'warn'); return null; }
    let r;
    try { r = await submitContest(sel); } catch (e) { this.toast(viError(e), 'warn'); return null; }
    for (const [k, n] of Object.entries(sel.items)) { if (n > 0) { s.inventory.flowers[k] -= n; if (!s.inventory.flowers[k]) delete s.inventory.flowers[k]; } }
    if (!WRAP_PAPERS[sel.paper].free) s.inventory.papers[sel.paper] -= 1;
    if (!WRAP_RIBBONS[sel.ribbon].free) s.inventory.ribbons[sel.ribbon] -= 1;
    this.gainXp(20);
    this.toast(`🏆 Đã nộp bài dự thi: ${r.score} điểm! Hạng hiện tại ${r.rank}/${r.players}`, 'good');
    this.saveMgr.markDirty();
    this.saveMgr.saveNow('manual');
    this.emitter.emit('inventory');
    return r;
  }

  // ---------------- tự động hóa (GĐ8) ----------------
  runStaff(now, offline) {
    const s = this.save;
    const g = automation.runGardener(s, now);
    if (g && (g.harvested.length || g.planted || g.tilled)) {
      for (const h of g.harvested) {
        if (notebook.recordHarvest(s, h.flower, h.variant, h.quality, dayOf(now)) && !offline) this.toast(`📖 Màu hoa mới vào Sổ tay: ${variants.variantName(h.flower, h.variant)}!`, 'good');
        this.gainXp(XP.harvestPerStar * h.quality);
        this.questEvent('harvest');
        if (h.quality === 3) this.questEvent('harvest3');
      }
      if (!offline && (g.harvested.length || g.planted)) this.toast(`👨‍🌾 Bác Tâm: thu hoạch ${g.harvested.length} bông, gieo lại ${g.planted} hạt`, 'info');
      this.refreshFarm();
      this.emitter.emit('inventory');
      this.saveMgr.markDirty();
    }
    // chị bán hàng: phục vụ khách mua cành lẻ
    const ck = s.automation.staff.clerk;
    if (!offline && ck?.hired && ck.active && now >= (ck.nextAt || 0)) {
      ck.nextAt = now + STAFF.clerk.everyMinutes;
      const c = s.shop.customers.find((x) => !x.regular && x.request.type !== 'bouquet' && now - x.arrivedAt > 5);
      if (c) {
        const sel = shop.autoPick(c.request, s.inventory, s.book?.meanings);
        if (shop.evaluateDelivery(c.request, sel).ok) {
          const r = this.deliverToCustomer(c.id, sel);
          if (r.ok) this.toast(`👩‍💼 Chị Thu đã bán hoa cho ${shop.npcOf(c.npc).name}`, 'info');
        }
      }
    }
  }

  buyMachine(kind, pi) {
    const r = automation.buyMachine(this.save, kind, pi);
    this.toast(r.msg, r.ok ? 'good' : 'warn');
    if (r.ok) { this.refreshFarm(true); this.particles.spawn('sparkle', this.plotPos(pi)); this.afterAutomation(); }
    return r;
  }

  hireStaff(id) {
    const r = automation.hireStaff(this.save, id);
    this.toast(r.msg, r.ok ? 'good' : 'warn');
    if (r.ok) this.afterAutomation();
    return r;
  }

  fireStaff(id) {
    const r = automation.fireStaff(this.save, id);
    this.toast(r.msg, 'info');
    this.afterAutomation();
  }

  afterAutomation() {
    this.updateStaffModels();
    this.saveMgr.markDirty();
    this.saveMgr.saveNow('manual');
    this.emitter.emit('inventory');
  }

  updateStaffModels() {
    for (const [id, m] of Object.entries(this.staffModels)) m.visible = !this.visit && automation.staffActive(this.save, id);
  }

  // ---------------- làng (GĐ11) ----------------
  villageCtx() {
    const m = this.save.time.gameMinutes;
    return { hour: (m % 1440) / 60, day: dayOf(m), weather: this.save.weather?.today?.type || null, festivalId: calendar.festivalOn(dayOf(m))?.id || null, save: this.save };
  }

  focusVillager(id) {
    const v = this.villagers.list.find((q) => q.id === id);
    if (v) this.controls.focusOn(new THREE.Vector3(v.x, 0, v.z), Math.max(this.controls.zoom, 1.5));
  }

  // ---------------- mua đất của dân làng (GĐ13) ----------------
  landQuote(id) { return land.quote(this.save, id, this.today); }

  landBargain(id) {
    const P = PARCELS[id];
    const m = this.canMeet(P.owner);
    if (!m.ok) { this.toast(m.reason, 'info'); return null; }
    const r = land.bargain(this.save, id, this.today);
    if (!r.ok) return null;
    if (r.fp) this.afterBond(P.owner, r.fp);
    this.saveMgr.markDirty();
    return r;
  }

  buyParcel(id) {
    const P = PARCELS[id];
    const m = this.canMeet(P.owner);
    if (!m.ok) { this.toast(m.reason, 'info'); return null; }
    const r = land.buyParcel(this.save, id, this.today, createPlot);
    if (!r.ok) { this.toast(r.msg, 'warn'); return r; }
    // đồ trang trí lỡ đặt trên mảnh đất => trả về kho
    const rect = land.parcelRect(id, 2.6);
    const dec = this.save.decor;
    const moved = dec.placed.filter((p) => Math.abs(p.x - rect.x) < rect.hx && Math.abs(p.z - rect.z) < rect.hz);
    if (moved.length) {
      dec.placed = dec.placed.filter((p) => !moved.includes(p));
      for (const p of moved) dec.owned[p.id] = (dec.owned[p.id] || 0) + 1;
      this.decorView.sync(dec.placed);
      setTimeout(() => this.toast(`📦 ${moved.length} món trang trí trên mảnh đất đã được cất vào kho`, 'info'), 1200);
    }
    this.afterBond(P.owner, r.fp);
    if (!this.visit) this.farmView.build(this.save);
    this.updateLockedSlots();
    const pos = this.plotPos(r.plotIndex);
    this.controls.focusOn(pos, Math.max(this.controls.zoom, 1.1));
    this.particles.spawn('sparkle', pos.clone());
    this.particles.spawn('leaf', pos.clone());
    this.toast(`🗺️ Đã mua ${P.name}! Thêm 9 ô đất để trồng hoa`, 'good');
    this.gainXp(30);
    this.saveMgr.markDirty();
    this.saveMgr.saveNow('manual');
    this.emitter.emit('inventory');
    return r;
  }

  // ---------------- kết thân (GĐ12) ----------------
  get today() { return dayOf(this.save.time.gameMinutes); }

  /** Người đó có nói chuyện được lúc này không (đang ở làng và còn thức) */
  canMeet(id) {
    const d = desiredState(id, this.villageCtx());
    if (d.absent) return { ok: false, reason: d.reason === 'shop' ? 'Người này đang ở tiệm hoa của bạn' : 'Người này đang đi xa' };
    if (d.act === 'sleep') return { ok: false, reason: 'Đang ngủ rồi, mai hãy quay lại nhé 💤' };
    return { ok: true };
  }

  /** Bắt đầu trò chuyện: trả về câu chuyện hôm nay (sự kiện tim hoặc chuyện thường) */
  startTalk(id) {
    const m = this.canMeet(id);
    if (!m.ok) { this.toast(m.reason, 'info'); return null; }
    if (!relations.canTalk(this.save, id, this.today)) { this.toast('Hôm nay đã trò chuyện rồi, mai ghé tiếp nhé!', 'info'); return null; }
    return relations.todaysTalk(this.save, id, this.today);
  }

  talkChoose(id, talk, sceneIdx, optIdx) {
    const res = relations.chooseOption(this.save, id, talk, sceneIdx, optIdx, this.today);
    if (!res) return null;
    this.afterBond(id, res);
    if (talk.kind === 'event' && res.next == null) this.gainXp(15);
    return res;
  }

  giftTo(id, flowerKey) {
    const m = this.canMeet(id);
    if (!m.ok) { this.toast(m.reason, 'info'); return null; }
    const res = relations.giveGift(this.save, id, flowerKey, this.today);
    if (res.error) { this.toast(res.error, 'warn'); return null; }
    this.afterBond(id, res);
    this.emitter.emit('inventory');
    return res;
  }

  /** Việc dân làng nhờ hôm nay (mini game) */
  favorToday(id) { return favors.todaysFavor(this.save, id, this.today); }

  /** Xong mini game nhờ việc: stars 0–3 */
  finishFavorGame(id, favor, stars) {
    const res = favors.finishFavor(this.save, id, favor, stars, this.today);
    if (res.stars >= 3) { res.tickets = luck.grantTickets(this.save, TICKET_SOURCES.favor3); this.emitter.emit('luck'); }
    if (res.xp) this.gainXp(res.xp);
    this.afterBond(id, res);
    this.emitter.emit('inventory');
    return res;
  }

  /** Sau khi điểm tình thân thay đổi: trao quà mốc tim, lưu, báo giao diện */
  afterBond(id, res) {
    for (const { hearts, reward } of res.rewards || []) {
      relations.grantBondReward(this.save, reward);
      if (reward.xp) this.gainXp(reward.xp);
      this.emitter.emit('bond-reward', { id, hearts, reward });
    }
    if (res.after > res.before) this.particles.spawn('sparkle', this.villagerPos(id));
    this.saveMgr.markDirty();
    this.emitter.emit('bond', { id });
  }

  villagerPos(id) {
    const v = this.villagers.list.find((q) => q.id === id);
    return v ? new THREE.Vector3(v.x, 1.2, v.z) : this.player.root.position.clone();
  }

  goVillage() {
    this.select(null);
    this.controls.focusOn(new THREE.Vector3(VILLAGE.center.x, 0, VILLAGE.center.z - 1), 0.95);
  }

  // ---------------- trang trí (GĐ8, đặt tự do từ GĐ10) ----------------
  seasonId() { return calendar.calendarOf(dayOf(this.save.time.gameMinutes)).season.id; }

  buyDecor(id, n = 1) {
    const d = DECOR[id];
    const s = this.save;
    if (!d || d.luck) return false;
    if (d.event && !decorSys.eventOpen(d.event, this.seasonId())) { const ev = DECOR_EVENTS[d.event]; this.toast(`${ev.icon} Đồ ${ev.name} chỉ bán trong Mùa Thu`, 'warn'); return false; }
    if (s.player.level < d.level) { this.toast(`Cần đạt cấp ${d.level}`, 'warn'); return false; }
    if (s.player.coins < d.price * n) { this.toast(`Không đủ tiền (cần ${d.price * n} 💰)`, 'warn'); return false; }
    s.player.coins -= d.price * n;
    s.decor.owned[id] = (s.decor.owned[id] || 0) + n;
    this.toast(`${d.icon} Đã mua ${d.name}! Bấm 🎨 để đặt ở bất kỳ đâu`, 'good');
    this.saveMgr.markDirty();
    this.emitter.emit('inventory');
    return true;
  }

  beauty(placed = this.save.decor.placed) { return decorSys.beautyOf(placed); }

  setDecorMode(on) {
    if (this.visit) return;
    if (!on && this.decorEdit) this.cancelDecorEdit();
    this.decorMode = on;
    this.decorView.setEditing(on);
    this.select(null);
    this.updateLockedSlots();
    if (on) this.controls.focusOn(new THREE.Vector3(3, 0, 1), 0.85);
    this.emitter.emit('decor-mode', on);
    this.emitter.emit('decor-edit', this.decorEdit);
  }

  /** Kiểm tra món đang dời có đặt được ở chỗ hiện tại không */
  decorCheck(e = this.decorEdit) {
    if (!e) return { ok: false, reason: '' };
    return decorSys.checkPlace(this.save.decor.placed, e.id, e.x, e.z, this.world.decorMap, e.u);
  }

  refreshDecorEdit() {
    const e = this.decorEdit;
    this.decorView.sync(this.save.decor.placed, e?.u ?? null);
    if (e) {
      const c = this.decorCheck(e);
      e.ok = c.ok; e.reason = c.reason;
      this.decorView.showGhost(e.id, e.x, e.z, e.r, c.ok);
    } else this.decorView.clearGhost();
    this.emitter.emit('decor-edit', e);
  }

  /** Lấy 1 món trong kho ra để đặt — hiện ở chỗ trống gần giữa màn hình */
  startNewDecor(id) {
    const dec = this.save.decor;
    if (!(dec.owned[id] > 0)) { this.toast('Bạn chưa có món này, mua ở Khu Chợ › Trang trí', 'warn'); return; }
    if (dec.placed.length >= DECOR_RULES.maxPlaced) { this.toast(`Đã đặt tối đa ${DECOR_RULES.maxPlaced} món — cất bớt rồi đặt tiếp nhé`, 'warn'); return; }
    if (this.decorEdit) this.cancelDecorEdit(true);
    const c = this.controls.target;
    const spot = decorSys.findFreeSpot(dec.placed, id, c.x, c.z, this.world.decorMap) || { x: decorSys.snap(c.x), z: decorSys.snap(c.z) };
    this.decorEdit = { u: null, id, x: spot.x, z: spot.z, r: 45, orig: null }; // 45° = quay mặt về phía camera
    this.refreshDecorEdit();
  }

  /** Chọn món đã đặt để dời / xoay / cất */
  selectPlacedDecor(u) {
    const p = this.save.decor.placed.find((q) => q.u === u);
    if (!p) return;
    if (this.decorEdit) { if (this.decorEdit.u === u) return; this.confirmDecorEdit(true) || this.cancelDecorEdit(true); }
    this.decorEdit = { u, id: p.id, x: p.x, z: p.z, r: p.r || 0, orig: { x: p.x, z: p.z, r: p.r || 0 } };
    this.refreshDecorEdit();
  }

  moveDecorEdit(sx, sy) {
    const e = this.decorEdit;
    if (!e) return;
    const g = this.controls.groundPoint(sx, sy);
    if (!g) return;
    const x = decorSys.snap(g.x), z = decorSys.snap(g.z);
    if (x === e.x && z === e.z) return;
    e.x = x; e.z = z;
    this.refreshDecorEdit();
  }

  rotateDecorEdit() {
    const e = this.decorEdit;
    if (!e) return;
    e.r = ((e.r || 0) + DECOR_RULES.rotateStep) % 360;
    this.refreshDecorEdit();
  }

  /** Đặt món đang dời xuống. quiet: không báo lỗi (khi tự xác nhận lúc chọn món khác) */
  confirmDecorEdit(quiet = false) {
    const e = this.decorEdit;
    if (!e) return false;
    const c = this.decorCheck(e);
    if (!c.ok) { if (!quiet) this.toast(`⛔ ${c.reason || 'Chỗ này không đặt được'}`, 'warn'); return false; }
    const dec = this.save.decor;
    if (e.u == null) {
      if (!(dec.owned[e.id] > 0)) { this.cancelDecorEdit(true); return false; }
      dec.owned[e.id] -= 1;
      dec.nextUid = Math.max(dec.nextUid || 1, ...dec.placed.map((p) => p.u + 1));
      dec.placed.push({ u: dec.nextUid++, id: e.id, x: e.x, z: e.z, r: e.r });
    } else {
      const p = dec.placed.find((q) => q.u === e.u);
      if (p) Object.assign(p, { x: e.x, z: e.z, r: e.r });
    }
    this.particles.spawn('sparkle', new THREE.Vector3(e.x, 0.3, e.z));
    this.decorEdit = null;
    this.refreshDecorEdit();
    this.saveMgr.markDirty();
    this.emitter.emit('inventory');
    return true;
  }

  /** Bỏ thao tác: món mới thì trả lại kho (chưa trừ), món cũ thì về chỗ cũ */
  cancelDecorEdit(silent = false) {
    if (!this.decorEdit) return;
    this.decorEdit = null;
    this.refreshDecorEdit();
    if (!silent) this.emitter.emit('inventory');
  }

  /** Cất món đang chọn vào kho */
  storeDecorEdit() {
    const e = this.decorEdit;
    if (!e) return;
    const dec = this.save.decor;
    if (e.u != null) {
      const i = dec.placed.findIndex((q) => q.u === e.u);
      if (i >= 0) { dec.placed.splice(i, 1); dec.owned[e.id] = (dec.owned[e.id] || 0) + 1; }
      this.toast(`📦 Đã cất ${DECOR[e.id]?.name || 'đồ'} vào kho`, 'info');
      this.saveMgr.markDirty();
    }
    this.decorEdit = null;
    this.refreshDecorEdit();
    this.emitter.emit('inventory');
  }

  onDecorTap(pick, x, y) {
    if (pick?.kind === 'decor') { this.selectPlacedDecor(pick.u); return; }
    if (pick?.kind === 'decorGhost') return;
    // chạm chỗ trống: đang dời thì đưa món tới đó
    if (this.decorEdit) this.moveDecorEdit(x, y);
  }

  // ---------------- sổ tay & lai tạo ----------------
  checkBookMilestones() {
    for (const m of notebook.claimMilestones(this.save)) {
      setTimeout(() => this.toast(`🏅 Sổ tay đạt ${m.pct}%: danh hiệu "${m.text}" +${m.coins} 💰`, 'good'), 2200);
      this.emitter.emit('inventory');
    }
  }

  startBreeding(keyA, keyB) {
    const r = breeding.startBreeding(this.save, keyA, keyB);
    this.toast(r.ok ? '🧬 Đã bắt đầu lai tạo! Quay lại sau vài giờ để nhận hạt.' : r.msg, r.ok ? 'good' : 'warn');
    if (r.ok) { this.particles.spawn('sparkle', this.world.lab.position.clone()); this.saveMgr.markDirty(); this.emitter.emit('inventory'); this.emitter.emit('lab'); }
    return r;
  }

  collectBreeding() {
    const r = breeding.collectBreeding(this.save);
    if (!r.ok) { this.toast(r.msg, 'warn'); return r; }
    const name = variants.variantName(r.species, r.variant);
    const rar = variants.rarityOf(r.species, r.variant);
    this.toast(`🧬 Lai tạo thành công: ${r.seeds} hạt ${name}${r.isNew ? ` — màu mới (${rar.name})!` : ''}`, 'good');
    this.particles.spawn('sparkle', this.world.lab.position.clone());
    this.gainXp(r.isNew ? 15 : 5);
    this.questEvent('breed');
    this.saveMgr.markDirty();
    this.emitter.emit('inventory');
    this.emitter.emit('lab');
    this.emitter.emit('tool', this.tool);
    return r;
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
    this.particles.spawn('sparkle', this.plotPos(pi));
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
      if (!this.visit) this.particles.spawn('spray', this.farmView.tileWorldPos(pi, ti));
    }
    if (!list.length) this.toast('Không có cây nào cần phun thuốc', 'info');
    else this.toast(n ? `💊 Đã phun thuốc cho ${n} cây${n < list.length ? ` (hết thuốc, còn ${list.length - n} cây)` : ''}` : 'Hết thuốc! Mua ở Khu Chợ, mục Phòng hộ', n ? 'good' : 'warn');
    this.afterProtect();
    return n;
  }

  afterProtect() {
    this.refreshFarm();
    this.saveMgr.markDirty();
    this.emitter.emit('inventory');
    this.emitter.emit('refresh');
  }

  // ---------------- tiện ích ----------------
  // ---------------- 🍀 Vận May (GĐ15) ----------------
  /** Vé mỗi ngày (ngày thật, giờ VN) — gọi khi vào game và định kỳ */
  claimDailyLuck() {
    if (this.visit) return null;
    const rw = luck.claimDaily(this.save);
    if (!rw) return null;
    this.saveMgr.markDirty();
    this.emitter.emit('luck');
    this.toast(`🍀 Quà hằng ngày: +${rw.luck} 🎟️ vé may mắn! ${this.save.player.level >= 2 ? 'Bấm 🍀 để mở gói' : 'Vận May mở khi đạt cấp 2'}`, 'good');
    return rw;
  }

  /** Mở gói. pay: 'ticket' | 'coins' */
  openLuckPack(packId, pay = 'ticket') {
    const res = luck.openPack(this.save, packId, pay);
    if (!res.ok) { this.toast(res.msg, 'warn'); return res; }
    const rw = res.reward;
    if (rw.type === 'upgrade') this.applyUpgradeEffects();
    if (rw.luckFlower && rw.isNew) this.emitter.emit('book');
    this.saveMgr.markDirty();
    this.saveMgr.saveNow('manual');
    this.emitter.emit('inventory');
    this.emitter.emit('luck');
    this.emitter.emit('tool', this.tool);
    return res;
  }

  exchangeShards(what, id) {
    const res = luck.exchangeShards(this.save, what, id);
    this.toast(res.ok ? `🧩 Đã đổi: ${res.text}` : res.msg, res.ok ? 'good' : 'warn');
    if (!res.ok) return res;
    this.saveMgr.markDirty();
    this.emitter.emit('inventory');
    this.emitter.emit('luck');
    this.emitter.emit('tool', this.tool);
    return res;
  }

  claimFreeSeeds() {
    const day = this.clock.day;
    if (this.save.stats.lastFreePackDay === day) {
      this.toast('Hôm nay bạn đã nhận rồi, mai quay lại nhé!', 'warn');
      return false;
    }
    this.save.stats.lastFreePackDay = day;
    for (const [id, n] of Object.entries(STARTER.freeSeedsPack)) { const k = variants.vkey(id); this.save.inventory.seeds[k] = (this.save.inventory.seeds[k] || 0) + n; }
    this.save.inventory.items.fertilizer = (this.save.inventory.items.fertilizer || 0) + 3;
    this.toast('🎁 Đã nhận gói hạt giống + 3 phân bón!', 'good');
    this.saveMgr.markDirty();
    this.emitter.emit('inventory');
    return true;
  }

  fastForward(hours) {
    const ev = this.advance(hours * 60);
    this.refreshFarm();
    this.toast(`⏩ Đã tua nhanh ${hours} giờ game`, 'info');
    this.emitter.emit('refresh');
    return ev;
  }

  /** Mức đồ họa đang dùng thực tế */
  get graphicsLevel() {
    const q = this.save.settings.quality || 'auto';
    return q === 'auto' ? this.autoLevel : q;
  }

  applyGraphics() {
    this.graphics = this.stage.applyQuality(this.graphicsLevel);
    this.weatherFx.density = this.graphicsLevel === 'low' ? 0.4 : 1;
    this.emitter.emit('graphics', this.graphicsLevel);
  }

  setQuality(q) {
    this.save.settings.quality = q;
    this.saveMgr.markDirty();
    this.applyGraphics();
  }

  /** Chế độ Tự động: máy chậm thì giảm 1 bậc */
  reportFps(fps) {
    if ((this.save.settings.quality || 'auto') !== 'auto' || fps >= GRAPHICS.autoMinFps) return;
    const next = { high: 'medium', medium: 'low' }[this.autoLevel];
    if (!next) return;
    this.autoLevel = next;
    this.applyGraphics();
    this.toast(`🐢 Máy hơi chậm, đã giảm đồ họa xuống "${GRAPHICS.levels[next].name}" cho mượt hơn (đổi trong ⚙️ Cài đặt)`, 'info');
  }

  toast(text, type = 'info') { this.emitter.emit('toast', { text, type }); }

  /** Chuyển tọa độ 3D -> màn hình (cho chữ bay lên) */
  toScreen(pos) {
    const v = pos.clone().project(this.stage.camera);
    const r = this.stage.renderer.domElement.getBoundingClientRect();
    return { x: r.left + ((v.x + 1) / 2) * r.width, y: r.top + ((1 - v.y) / 2) * r.height };
  }
}

/** Vật và mọi lớp cha đều đang hiện (three.js không tự kiểm tra khi dò chạm) */
function isShown(o) {
  while (o) { if (!o.visible) return false; o = o.parent; }
  return true;
}
