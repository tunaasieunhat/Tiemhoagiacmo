// =============================================================
//  LOGIC TRỒNG HOA (thuần dữ liệu, không phụ thuộc đồ họa)
//  -> Sau này có thể dùng lại trong Edge Function để kiểm tra gian lận.
// =============================================================
import { FLOWERS } from '../../data/flowers.js';
import { CARE } from '../../data/config.js';
import { upgradeValue } from './progression.js';
import { SEASON_EFFECT, DISEASE, DISEASES, WEATHER } from '../../data/seasons.js';
import { protectUntil } from './weather.js';
import { parseVkey, flowerKey, variantName } from './variants.js';
import { formatDuration } from './time.js';

export const TILE_STATES = ['untilled', 'tilled', 'growing', 'ready', 'dead'];
export const STAGE_NAMES = ['Hạt giống', 'Nảy mầm', 'Ra nụ', 'Nở hoa'];
const TILLED_SOIL_DRY_PER_MIN = 1 / 720; // đất trống khô sau 12 giờ game

export function createTile() {
  return {
    state: 'untilled',
    flower: null,
    variant: null,    // màu hoa (GĐ6)
    growth: 0,      // số phút "lớn" đã tích lũy
    water: 0,       // 0..1
    health: 100,    // 0..100, chỉ giảm (ghi nhận việc chăm sóc)
    fert: 0,        // số lần đã bón
    lastFertStage: -1,
    plantedAt: 0,
    sick: null,       // mã bệnh trong DISEASES (data/seasons.js) khi bị bệnh (GĐ5, GĐ14)
    guardUntil: 0,    // đã phun thuốc phòng đến phút game này
    offSeason: false, // gieo trái mùa (không có nhà kính)
  };
}

export function growMinutes(flowerId) {
  return FLOWERS[flowerId].growHours * 60;
}

export function progressOf(tile) {
  if (tile.state === 'ready') return 1;
  if (tile.state !== 'growing') return 0;
  return Math.min(1, tile.growth / growMinutes(tile.flower));
}

/** 0 hạt, 1 mầm, 2 nụ, 3 nở */
export function stageOf(tile) {
  if (tile.state === 'ready') return 3;
  if (tile.state !== 'growing') return -1;
  const p = progressOf(tile);
  if (p < 0.15) return 0;
  if (p < 0.45) return 1;
  return 2;
}

export function growSpeed(tile) {
  return 1 + tile.fert * CARE.fertilizerSpeedBonus;
}

export function remainingMinutes(tile) {
  if (tile.state !== 'growing') return 0;
  return Math.max(0, (growMinutes(tile.flower) - tile.growth) / growSpeed(tile));
}

export function isThirsty(tile) {
  return (tile.state === 'growing' || tile.state === 'ready') && tile.water < CARE.thirstyBelow;
}

export const isSick = (tile) => !!tile.sick && (tile.state === 'growing' || tile.state === 'ready');

export function isWilted(tile) {
  return tile.state === 'dead' || ((tile.state === 'growing' || tile.state === 'ready') && tile.health < CARE.wiltBelow);
}

export function qualityOf(tile) {
  const def = FLOWERS[tile.flower];
  const fertRatio = def.fertilizerNeeded > 0 ? Math.min(1, tile.fert / def.fertilizerNeeded) : 1;
  const score = (tile.health / 100) * 0.6 + fertRatio * 0.4 - (tile.offSeason ? SEASON_EFFECT.outSeasonQualityPenalty : 0);
  if (score >= CARE.quality3Stars) return 3;
  if (score >= CARE.quality2Stars) return 2;
  return 1;
}

export function canFertilize(tile) {
  if (tile.state !== 'growing') return false;
  const def = FLOWERS[tile.flower];
  return tile.fert < def.fertilizerNeeded && stageOf(tile) !== tile.lastFertStage;
}

/**
 * Cho thời gian trôi qua trên 1 ô đất.
 * @param {number} dMin  số phút game
 * @param {{offline?: boolean, env?: {growMult?: number, waterMult?: number}}} opts
 * @returns {string|null} sự kiện xảy ra: 'ready' | 'dead' | null
 */
export function simulateTile(tile, dMin, opts = {}) {
  if (dMin <= 0) return null;
  let event = null;
  // chia nhỏ bước để chính xác khi trôi qua nhiều thời gian
  const STEP = 20;
  while (dMin > 0) {
    const d = Math.min(STEP, dMin);
    dMin -= d;
    const e = stepTile(tile, d, opts);
    if (e) event = e;
    if (tile.state === 'dead' || tile.state === 'untilled') break;
  }
  return event;
}

function stepTile(tile, d, { offline = false, env = {} }) {
  const growMult = env.growMult ?? 1;
  const waterMult = env.waterMult ?? 1;
  if (tile.state === 'tilled') {
    tile.water = Math.max(0, tile.water - d * TILLED_SOIL_DRY_PER_MIN);
    return null;
  }
  if (tile.state !== 'growing' && tile.state !== 'ready') return null;

  const def = FLOWERS[tile.flower];
  const decay = (def.waterPerDay / 1440) * waterMult;
  const wetMin = Math.min(d, tile.water / decay);
  const dryMin = d - wetMin;
  tile.water = Math.max(0, tile.water - decay * d);

  let event = null;
  const dis = tile.sick ? DISEASES[tile.sick] : null;
  const sickGrow = dis ? (dis.growMult ?? 0) : 1; // bệnh làm cây ngừng / chậm lớn
  if (tile.state === 'growing' && sickGrow > 0) {
    const growMin = CARE.growWhenDry ? d : wetMin;
    tile.growth += growMin * growSpeed(tile) * growMult * sickGrow;
    if (tile.growth >= growMinutes(tile.flower)) {
      tile.growth = growMinutes(tile.flower);
      tile.state = 'ready';
      event = 'ready';
    }
  }
  const factor = offline ? CARE.offlineDryFactor : 1;
  if (dis) tile.health = Math.max(0, tile.health - (d / 60) * (dis.healthLoss ?? DISEASE.healthLossPerHour) * factor);
  if (dryMin > 0) tile.health = Math.max(0, tile.health - (dryMin / 60) * CARE.dryHealthLossPerHour * factor);
  if (tile.sick || dryMin > 0) {
    if (tile.health <= 0) {
      tile.state = 'dead';
      event = 'dead';
    }
  }
  return event;
}

// ------------------- THAO TÁC -------------------
// Mỗi hàm trả về { ok, msg, ...extra }. Hàm chỉ sửa dữ liệu khi ok = true.

export function till(tile, save) {
  if (!save.tools.shovel) return fail('Bạn cần có xẻng để xới đất!');
  if (tile.state === 'untilled' || tile.state === 'dead') {
    const wasDead = tile.state === 'dead';
    Object.assign(tile, createTile(), { state: 'tilled' });
    return { ok: true, msg: wasDead ? 'Đã dọn cây héo và xới đất' : 'Đã xới đất' };
  }
  return fail('Ô này không cần xới');
}

/** seedKey: mã hạt có màu, vd "rose:red" (hoặc "rose" = màu mặc định). opts.plot: lô đất (kiểm tra hoa chỉ trồng nhà kính) */
export function plant(tile, seedKey, save, nowMin, opts = {}) {
  if (tile.state !== 'tilled') return fail(tile.state === 'untilled' ? 'Hãy xới đất trước khi gieo hạt' : 'Ô này đã có cây');
  const { species, variant, vkey } = parseVkey(seedKey);
  const def = FLOWERS[species];
  if (!def) return fail('Không rõ loại hạt');
  const name = variantName(species, variant);
  if (def.greenhouseOnly && opts.plot && !opts.plot.greenhouse) return fail(`${def.name} chỉ trồng được trong lô có 🏠 nhà kính`);
  if (!(save.inventory.seeds[vkey] > 0)) return fail(`Hết hạt ${name}!`);
  save.inventory.seeds[vkey] -= 1;
  Object.assign(tile, {
    state: 'growing', flower: species, variant, growth: 0, health: 100, fert: 0, lastFertStage: -1, plantedAt: nowMin,
  });
  return { ok: true, msg: `Đã gieo ${name}` };
}

/** Lượng nước sau 1 lần tưới (nâng cấp bình tưới thì nhiều hơn 1) */
export function waterCapacity(save) {
  return save?.upgrades ? upgradeValue(save, 'can') : 1;
}

export function water(tile, save) {
  if (!save.tools.wateringCan) return fail('Bạn cần bình tưới!');
  if (!['tilled', 'growing', 'ready'].includes(tile.state)) return fail(tile.state === 'dead' ? 'Cây đã héo khô, hãy dùng xẻng dọn' : 'Hãy xới đất trước');
  const cap = waterCapacity(save);
  if (tile.water >= cap - 0.1) return fail('Đất vẫn còn đủ ẩm');
  tile.water = cap;
  return { ok: true, msg: 'Đã tưới nước' };
}

export function fertilize(tile, save) {
  // bệnh vàng lá: bón phân là khỏi (kể cả khi cây đã đủ phân)
  if (tile.sick && DISEASES[tile.sick]?.fertCures && (tile.state === 'growing' || tile.state === 'ready')) {
    if (!(save.inventory.items.fertilizer > 0)) return fail('Hết phân bón!');
    save.inventory.items.fertilizer -= 1;
    const cured = DISEASES[tile.sick].name;
    tile.sick = null;
    let more = '';
    if (canFertilize(tile)) { tile.fert += 1; tile.lastFertStage = stageOf(tile); more = ` (${tile.fert}/${FLOWERS[tile.flower].fertilizerNeeded})`; }
    return { ok: true, msg: `Đã bón phân, khỏi ${cured}${more}` };
  }
  if (tile.state !== 'growing') return fail(tile.state === 'ready' ? 'Hoa đã nở, hãy thu hoạch' : 'Chỉ bón phân cho cây đang lớn');
  const def = FLOWERS[tile.flower];
  if (tile.fert >= def.fertilizerNeeded) return fail('Cây đã đủ phân rồi');
  if (stageOf(tile) === tile.lastFertStage) return fail('Đợi cây lớn sang giai đoạn sau rồi bón tiếp');
  if (!(save.inventory.items.fertilizer > 0)) return fail('Hết phân bón!');
  save.inventory.items.fertilizer -= 1;
  tile.fert += 1;
  tile.lastFertStage = stageOf(tile);
  return { ok: true, msg: `Đã bón phân (${tile.fert}/${def.fertilizerNeeded})` };
}

/** opts.rng: hàm ngẫu nhiên (cầu vồng có thể tặng thêm 1⭐) */
export function harvest(tile, save, opts = {}) {
  if (tile.state !== 'ready') return fail(tile.state === 'growing' ? `Hoa chưa nở — còn ${formatDuration(remainingMinutes(tile))} nữa (giờ trong game)` : 'Không có gì để thu hoạch');
  const flower = tile.flower;
  const variant = tile.variant;
  let quality = qualityOf(tile);
  let note = '';
  const dis = tile.sick ? DISEASES[tile.sick] : null;
  if (dis?.qPenalty && quality > 1) { quality = Math.max(1, quality - dis.qPenalty); note = ` (${dis.icon} −${dis.qPenalty}⭐)`; }
  const W = WEATHER[save.weather?.today?.type];
  let bonus = false;
  if (W?.bonusStarChance && quality < 3 && (opts.rng || Math.random)() < W.bonusStarChance) { quality += 1; bonus = true; note += ` ${W.icon} +1⭐`; }
  const key = flowerKey(flower, variant, quality);
  save.inventory.flowers[key] = (save.inventory.flowers[key] || 0) + 1;
  save.stats.harvested = (save.stats.harvested || 0) + 1;
  Object.assign(tile, createTile());
  return { ok: true, msg: `Thu hoạch ${variantName(flower, variant)} ${'★'.repeat(quality)}${note}`, flower, variant: parseVkey(key.split('|')[0]).variant, quality, bonus };
}

/** Phun thuốc: chữa bệnh, hoặc phòng bệnh đến hết ngày mai */
export function treat(tile, save, nowMin) {
  if (!['growing', 'ready', 'tilled'].includes(tile.state)) return fail('Chỉ phun thuốc cho đất đã xới hoặc cây đang sống');
  if (!(save.inventory.items.medicine > 0)) return fail('Hết thuốc! Mua thêm ở Khu Chợ (mục Phòng hộ)');
  const until = protectUntil(nowMin);
  if (!tile.sick && (tile.guardUntil || 0) >= until) return fail('Ô này đã được phun thuốc phòng rồi');
  save.inventory.items.medicine -= 1;
  const cured = tile.sick;
  tile.sick = null;
  tile.guardUntil = until;
  return { ok: true, msg: cured ? `Đã chữa khỏi ${DISEASES[cured].name}` : 'Đã phun thuốc phòng bệnh' };
}

/** Các thao tác hợp lệ với ô này (cho bảng thông tin) */
export function availableActions(tile) {
  switch (tile.state) {
    case 'untilled': return ['till'];
    case 'tilled': return ['plant', 'water'];
    case 'growing': return tile.sick ? (DISEASES[tile.sick]?.fertCures ? ['fertilize', 'treat', 'water'] : ['treat', 'water', 'fertilize']) : ['water', 'fertilize', 'treat'];
    case 'ready': return tile.sick ? ['harvest', 'treat', 'water', ...(DISEASES[tile.sick]?.fertCures ? ['fertilize'] : [])] : ['harvest', 'water'];
    case 'dead': return ['till'];
    default: return [];
  }
}

function fail(msg) { return { ok: false, msg }; }
