// =============================================================
//  CẤU TRÚC DỮ LIỆU SAVE + CHUYỂN ĐỔI PHIÊN BẢN
// =============================================================
//  Mỗi khi đổi cấu trúc save:
//   1. Tăng SAVE_VERSION lên 1.
//   2. Thêm hàm vào MIGRATIONS[phiên_bản_cũ] để biến save cũ thành mới.
//  => Người chơi cũ không bị mất tiến độ.
// =============================================================
import { legacyToPlaced } from '../systems/decor.js';
import { createVillageState, initVillageFromRegulars } from '../systems/relations.js';
import { STARTER, TIME, FARM } from '../../data/config.js';
import { createTile } from '../systems/farming.js';
import { createShopState } from '../systems/shop.js';
import { STARTER_WRAPS } from '../../data/wrapping.js';
import { levelFromXp } from '../systems/progression.js';
import { createWeatherState } from '../systems/weather.js';
import { vkey, DEFAULT_VARIANT } from '../systems/variants.js';
import { createBook } from '../systems/notebook.js';
import { createLabState } from '../systems/breeding.js';
import { createRegularsState } from '../systems/regulars.js';
import { createQuestState } from '../systems/quests.js';
import { createAutomationState } from '../systems/automation.js';
import { createLuckState } from '../systems/luck.js';
import { createOrdersState } from '../systems/orders.js';
import { createAchState, createEventState } from '../systems/goals.js';
import { createStoryState } from '../systems/story.js';
import { createFishState } from '../systems/fishing.js';

const toVkeys = (obj) => Object.fromEntries(Object.entries(obj).map(([k, n]) => [k.includes(':') ? k : vkey(k), n]));

export const SAVE_VERSION = 14;

export function newId() {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
  return 'id-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

export function createPlot(id) {
  return {
    id,
    cols: FARM.plotCols,
    rows: FARM.plotRows,
    tiles: Array.from({ length: FARM.plotCols * FARM.plotRows }, createTile),
    greenhouse: false, // nhà kính (GĐ5)
    coverUntil: 0,     // đang che bạt đến phút game này
    machines: {},      // { sprinkler: true, feeder: true } (GĐ8)
  };
}

export function createNewSave() {
  const now = Date.now();
  return {
    version: SAVE_VERSION,
    meta: {
      saveId: newId(),
      ownerId: null,       // id tài khoản Supabase (GĐ2)
      rev: 0,              // tăng mỗi lần lưu trên máy
      syncedRev: 0,        // rev (trên máy) đã đẩy lên cloud thành công
      cloudRev: 0,         // số phiên bản trên cloud lần đồng bộ gần nhất (phát hiện xung đột giữa 2 máy)
      device: '',          // thiết bị lưu gần nhất
      createdAt: now,
      updatedAt: now,
    },
    player: {
      name: 'Người làm vườn',
      avatar: { skin: '#ffe0c7', hair: '#6b4433', outfit: '#8fc9e8', hat: '#f6d67a' },
      level: 1,
      xp: 0,
      coins: STARTER.coins,
      reputation: 0,
    },
    time: {
      gameMinutes: TIME.startHour * 60,
      lastRealTs: now,
    },
    tools: { ...STARTER.tools },
    inventory: {
      seeds: toVkeys(STARTER.seeds),     // "rose:pink": số hạt (loài:màu)
      items: { ...STARTER.items },
      flowers: {},          // "rose:pink|3": số lượng  (loài:màu|số sao)
      papers: { ...STARTER_WRAPS.papers },
      ribbons: { ...STARTER_WRAPS.ribbons },
    },
    shop: createShopState(),
    upgrades: { can: 0, shoes: 0, gloves: 0, counter: 0, sign: 0 }, // bậc nâng cấp (GĐ4)
    weather: createWeatherState(), // thời tiết hôm nay + dự báo ngày mai (GĐ5)
    book: createBook(),            // sổ tay thực vật (GĐ6)
    lab: createLabState(),         // nhà lai tạo (GĐ6)
    regulars: createRegularsState(), // khách quen (GĐ6)
    quests: createQuestState(),      // nhiệm vụ ngày/tuần (GĐ8)
    automation: createAutomationState(), // nhân viên (GĐ8)
    decor: { owned: {}, placed: [], nextUid: 1 },  // đồ trang trí: số lượng trong kho, đồ đã đặt tự do [{u,id,x,z,r}] (GĐ10)
    village: createVillageState(),   // kết thân với dân làng: điểm tình thân, sự kiện đã xem, dấu cốt truyện (GĐ12)
    land: { deals: {} },             // mua đất của dân làng: trạng thái trả giá trong ngày (GĐ13)
    luck: createLuckState(),         // 🍀 Vận May: vé, mảnh, bảo hiểm, lịch sử mở gói (GĐ15)
    orders: createOrdersState(),     // 📦 đơn hàng lớn có hạn chót (GĐ16)
    ach: createAchState(),           // 🏅 thành tựu đã nhận + danh hiệu đang đeo (GĐ18)
    event: createEventState(),       // 📅 sự kiện tuần thật (GĐ18)
    shopLevel: 0,                    // 🏪 quy mô tiệm 0..3 (GĐ18)
    story: createStoryState(),       // 📜 cốt truyện chính: cảnh đã xem, dấu lựa chọn, chương đã xong (GĐ20)
    fish: createFishState(),         // 🎣 câu cá: mồi, cần, giỏ cá, Sổ cá (GĐ22, tự bổ sung bằng fillDefaults)
    mg: {},                          // 🎮 kỷ lục mini game { kind: { plays, best, perfect, combo } } (GĐ17, tự bổ sung bằng fillDefaults)
    farm: {
      plots: [{ ...createPlot('plot-1'), slot: 0 }], // slot = vị trí trong nông trại; lô mua của dân làng có parcel (GĐ13)
    },
    stats: { harvested: 0, playMinutes: 0, lastFreePackDay: 0, served: 0, sold: 0, coinsEarned: 0, tips: 0, bouquets: 0, spent: 0 },
    tutorial: { step: 0, done: false },
    settings: { sound: true, shadows: true, quality: 'auto' },
  };
}

// Hàm chuyển đổi: key = phiên bản CŨ.  Ví dụ khi lên phiên bản 2:
//   1: (s) => { s.player.reputation ??= 0; return s; },
export const MIGRATIONS = {
  // v1 -> v2 (Giai đoạn 2): thêm thông tin đồng bộ cloud
  1: (s) => {
    s.meta = s.meta || {};
    s.meta.cloudRev = s.meta.cloudRev ?? 0;
    s.meta.device = s.meta.device ?? '';
    s.meta.syncedRev = s.meta.syncedRev ?? 0;
    return s;
  },
  // v2 -> v3 (Giai đoạn 3): cửa hàng, giấy gói, ruy băng; mở thêm bước hướng dẫn "bán hoa"
  2: (s) => {
    s.shop = s.shop || createShopState();
    s.inventory.papers = s.inventory.papers || { ...STARTER_WRAPS.papers };
    s.inventory.ribbons = s.inventory.ribbons || { ...STARTER_WRAPS.ribbons };
    if (s.tutorial?.done && s.tutorial.step >= 5) { s.tutorial.done = false; s.tutorial.step = 5; }
    return s;
  },
  // v3 -> v4 (Giai đoạn 4): nâng cấp + tính lại XP từ những gì đã làm (không tặng thưởng lên cấp)
  3: (s) => {
    s.upgrades = s.upgrades || { can: 0, shoes: 0, gloves: 0, counter: 0, sign: 0 };
    const st = s.stats || {};
    const xp = (st.harvested || 0) * 8 + (st.served || 0) * 10 + Math.floor((st.coinsEarned || 0) / 10);
    s.player.xp = Math.max(s.player.xp || 0, xp);
    s.player.level = Math.max(s.player.level || 1, levelFromXp(s.player.xp));
    if (s.tutorial?.done && s.tutorial.step >= 6) { s.tutorial.done = false; s.tutorial.step = 6; }
    return s;
  },
  // v4 -> v5 (Giai đoạn 5): mùa, thời tiết, bệnh, nhà kính, bạt che, thuốc
  4: (s) => {
    s.weather = s.weather || createWeatherState();
    for (const p of s.farm.plots) {
      p.greenhouse = !!p.greenhouse;
      p.coverUntil = p.coverUntil || 0;
      for (const t of p.tiles) { t.sick = t.sick || null; t.guardUntil = t.guardUntil || 0; t.offSeason = !!t.offSeason; }
    }
    s.inventory.items.cover = s.inventory.items.cover ?? 2;
    s.inventory.items.medicine = s.inventory.items.medicine ?? 3;
    return s;
  },
  // v5 -> v6 (Giai đoạn 6): hoa có màu (biến thể), sổ tay, lai tạo, khách quen
  5: (s) => {
    s.inventory.seeds = toVkeys(s.inventory.seeds || {});
    const flowers = {};
    for (const [k, n] of Object.entries(s.inventory.flowers || {})) {
      const [f, q] = k.split('|');
      const nk = (f.includes(':') ? f : vkey(f)) + '|' + q;
      flowers[nk] = (flowers[nk] || 0) + n;
    }
    s.inventory.flowers = flowers;
    for (const p of s.farm.plots) for (const t of p.tiles) if (t.flower && !t.variant) t.variant = DEFAULT_VARIANT[t.flower];
    s.book = s.book || createBook();
    // những loài đã từng có trong kho coi như đã khám phá màu mặc định
    for (const k of Object.keys(flowers)) { const vk = k.split('|')[0]; s.book.found[vk] = s.book.found[vk] || { day: 1, harvested: 1, bestQ: +k.split('|')[1] }; }
    s.lab = s.lab || createLabState();
    s.regulars = s.regulars || createRegularsState();
    return s;
  },
  // v6 -> v7 (Giai đoạn 8): nhiệm vụ, tự động hóa, trang trí
  6: (s) => {
    s.quests = s.quests || createQuestState();
    s.automation = s.automation || createAutomationState();
    s.decor = s.decor || { owned: {}, slots: {} };
    for (const p of s.farm.plots) p.machines = p.machines || {};
    return s;
  },
  // v7 -> v8 (Giai đoạn 10): đặt đồ trang trí tự do thay cho 12 vị trí cố định — giữ nguyên chỗ đồ đang đặt
  7: (s) => {
    const d = s.decor || { owned: {}, slots: {} };
    const placed = legacyToPlaced(d.slots || {});
    const owned = { ...(d.owned || {}) };
    // món ở vị trí lạ không chuyển được => trả về kho, không bao giờ làm mất đồ
    const moved = placed.length;
    const all = Object.values(d.slots || {}).filter((id) => typeof id === 'string');
    if (all.length > moved) {
      const left = [...all];
      for (const p of placed) left.splice(left.indexOf(p.id), 1);
      for (const id of left) owned[id] = (owned[id] || 0) + 1;
    }
    s.decor = { owned, placed, nextUid: placed.length + 1 };
    return s;
  },
  // v8 -> v9 (Giai đoạn 12): kết thân với dân làng — khách quen đã xong chương nào ở tiệm thì được tặng sẵn ít điểm
  8: (s) => {
    s.village = s.village || initVillageFromRegulars(s);
    return s;
  },
  // v9 -> v10 (Giai đoạn 13): mỗi lô nhớ vị trí của mình (slot) vì có thêm lô mua của dân làng (parcel)
  9: (s) => {
    s.farm.plots.forEach((p, i) => { if (p.slot == null && !p.parcel) p.slot = i; });
    s.land = s.land || { deals: {} };
    return s;
  },
  // v10 -> v11 (Giai đoạn 15): Vận May — tặng vé chào mừng
  10: (s) => {
    s.luck = s.luck || createLuckState();
    return s;
  },
  // v11 -> v12 (Giai đoạn 16): độ tươi, độ màu đất, luân canh từng ô; đơn hàng lớn
  11: (s) => {
    for (const p of s.farm.plots) for (const t of p.tiles) {
      t.readyFor = t.readyFor || 0;
      t.soil = t.soil ?? 100;
      t.last = t.last ?? null;
      t.streak = t.streak || 0;
      t.rotation = !!t.rotation;
    }
    s.orders = s.orders || createOrdersState();
    return s;
  },
  // v12 -> v13 (Giai đoạn 18): thành tựu, sự kiện tuần, quy mô tiệm
  12: (s) => {
    s.ach = s.ach || createAchState();
    s.event = s.event || createEventState();
    s.shopLevel = s.shopLevel || 0;
    s.stats.bugs = s.stats.bugs || 0;
    return s;
  },
  // v13 -> v14 (GĐ20A): cốt truyện chính + treo hoa ở tiệm
  13: (s) => {
    s.story = s.story || createStoryState();
    s.shop = s.shop || createShopState();
    s.shop.display = Array.isArray(s.shop.display) ? s.shop.display : [];
    return s;
  },
};

/** Đưa save về phiên bản mới nhất + bổ sung các trường còn thiếu. */
export function migrateSave(save) {
  if (!save || typeof save !== 'object') return createNewSave();
  let s = save;
  let v = Number(s.version) || 1;
  while (v < SAVE_VERSION) {
    const fn = MIGRATIONS[v];
    if (fn) s = fn(s) || s;
    v += 1;
    s.version = v;
  }
  if (v > SAVE_VERSION) {
    // save đến từ bản game MỚI HƠN (vd máy khác đã cập nhật) — giữ nguyên, không xóa trường lạ
    console.warn('Save có phiên bản mới hơn game hiện tại:', v);
  }
  return fillDefaults(s, createNewSave());
}

// Thêm các trường mặc định nếu save cũ chưa có (không ghi đè dữ liệu có sẵn)
function fillDefaults(target, defaults) {
  for (const k of Object.keys(defaults)) {
    const dv = defaults[k];
    if (target[k] === undefined) target[k] = dv;
    else if (dv && typeof dv === 'object' && !Array.isArray(dv) && target[k] && typeof target[k] === 'object' && !Array.isArray(target[k])) {
      // các "bản đồ" tự do (seeds/items/flowers) cũng được bổ sung khóa mặc định — chấp nhận được
      fillDefaults(target[k], dv);
    }
  }
  return target;
}
