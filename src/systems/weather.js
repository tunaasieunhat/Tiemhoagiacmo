// =============================================================
//  THỜI TIẾT, THIÊN TAI, DỊCH BỆNH (thuần dữ liệu)
//  Thời tiết được quyết định trước 1 ngày => người chơi luôn có dự báo cho ngày mai.
// =============================================================
import { WEATHER, DISEASES, DISEASE, SEASON_EFFECT, PROTECTION } from '../../data/seasons.js';
import { calendarOf, dayOf, endOfDay, festivalOn } from './calendar.js';
import { FLOWERS } from '../../data/flowers.js';
import { VARIANTS } from '../../data/variants.js';

export function createWeatherState() {
  return { today: null, tomorrow: null };
}

function pickWeighted(rng, entries) {
  const total = entries.reduce((a, [, w]) => a + w, 0);
  let r = rng() * total;
  for (const [k, w] of entries) { if ((r -= w) <= 0) return k; }
  return entries[0][0];
}

/** Quyết định thời tiết + dịch bệnh cho 1 ngày */
export function rollDay(rng, day) {
  const si = calendarOf(day).seasonIndex;
  const type = pickWeighted(rng, Object.entries(WEATHER).map(([k, w]) => [k, w.chance[si]]));
  let disease = null;
  for (const [k, d] of Object.entries(DISEASES)) {
    if (disease || (d.onlyWeather && !d.onlyWeather.includes(type))) continue;
    if (rng() < d.chance[si]) disease = k;
  }
  return { day, type, disease };
}

export function ensureWeather(save, rng = Math.random) {
  const day = dayOf(save.time.gameMinutes);
  const w = save.weather || (save.weather = createWeatherState());
  if (!w.today || w.today.day !== day) w.today = w.tomorrow?.day === day ? w.tomorrow : rollDay(rng, day);
  if (!w.tomorrow || w.tomorrow.day !== day + 1) w.tomorrow = rollDay(rng, day + 1);
  return w;
}

export const isProtected = (plot, now) => !!plot.greenhouse || (plot.coverUntil || 0) >= now;

/** Môi trường cho 1 lô đất ngay lúc này: { waterMult, rain } */
export function plotEnv(save, plot) {
  const now = save.time.gameMinutes;
  const t = save.weather?.today?.type;
  const prot = isProtected(plot, now);
  const W = WEATHER[t] || {};
  let waterMult = W.waterMult ?? 1;
  if (waterMult > 1 && prot) waterMult = 1; // được che thì không khô nhanh
  return { waterMult, rain: !!W.waters && !plot.greenhouse };
}

/** Giờ bùng phát của 1 loại bệnh */
export const outbreakHourOf = (id) => DISEASES[id]?.hour ?? DISEASE.outbreakHour;

/** Hạt màu hiếm ngẫu nhiên trong các loài đã mở khóa (quà mưa sao băng) */
export function randomRareSeed(save, rng = Math.random) {
  const lv = save.player?.level || 1;
  const list = [];
  for (const [sp, vs] of Object.entries(VARIANTS)) {
    if (!FLOWERS[sp] || FLOWERS[sp].unlockLevel > lv) continue;
    for (const [v, d] of Object.entries(vs)) if (d.rarity === 'rare') list.push(`${sp}:${v}`);
  }
  return list.length ? list[Math.floor(rng() * list.length)] : null;
}

const crossed = (from, to, mark) => from < mark && to >= mark;

/**
 * Cho thời gian trôi từ "from" đến "to" (phút game). Trả về danh sách sự kiện.
 * Gọi với khoảng ngắn (≤ 30 phút) để không bỏ sót mốc giờ.
 */
export function weatherTick(save, from, to, { rng = Math.random, offline = false } = {}) {
  const events = [];
  const w = ensureWeather(save, rng);
  const dayFrom = dayOf(from), dayTo = dayOf(to);
  if (dayTo !== dayFrom) {
    const before = calendarOf(dayFrom);
    ensureWeather(save, rng);
    const c = calendarOf(dayTo);
    events.push({ type: 'newday', day: dayTo, seasonChanged: c.seasonIndex !== before.seasonIndex, festival: festivalOn(dayTo), tomorrow: save.weather.tomorrow, tomorrowFestival: festivalOn(dayTo + 1) });
  }
  const today = save.weather.today;
  const dayStart = (dayTo - 1) * 1440;
  const factor = offline ? PROTECTION.offlineDamageFactor : 1;

  // thiên tai theo giờ (bão, sương giá, mưa đá, gió lớn)
  const wt = WEATHER[today.type];
  if (wt.hour != null && crossed(from, to, dayStart + wt.hour * 60)) {
    let hit = 0, destroyed = 0, saved = 0, blown = 0;
    for (const plot of save.farm.plots) {
      let prot = isProtected(plot, to);
      // gió lớn: bạt che đỡ được lần này nhưng bị thổi bay mất (nhà kính thì không sao)
      if (wt.blowsCover && !plot.greenhouse && (plot.coverUntil || 0) >= to) { plot.coverUntil = 0; blown++; }
      for (const tile of plot.tiles) {
        if (tile.state !== 'growing' && tile.state !== 'ready') continue;
        if (today.type === 'frost' && SEASON_EFFECT.coldHardy.includes(tile.flower)) continue;
        if (wt.tallOnly && !FLOWERS[tile.flower]?.tall) continue;
        if (prot) { saved++; continue; }
        hit++;
        tile.health = Math.max(0, tile.health - wt.damage * factor);
        if (wt.destroyChance && rng() < wt.destroyChance * factor) tile.health = 0;
        if (tile.health <= 0) { tile.state = 'dead'; destroyed++; }
      }
    }
    events.push({ type: 'disaster', weather: today.type, hit, destroyed, saved, blown, silent: offline });
  }

  // mưa sao băng: tặng 1 hạt màu hiếm
  if (wt.giftHour != null && crossed(from, to, dayStart + wt.giftHour * 60)) {
    const seed = randomRareSeed(save, rng);
    if (seed) {
      save.inventory.seeds[seed] = (save.inventory.seeds[seed] || 0) + 1;
      events.push({ type: 'gift', weather: today.type, seed, silent: offline });
    }
  }

  // dịch bệnh bùng phát
  if (today.disease && crossed(from, to, dayStart + outbreakHourOf(today.disease) * 60)) {
    const d = DISEASES[today.disease];
    let infected = 0, guarded = 0;
    for (const plot of save.farm.plots) {
      const covered = d.coverSafe && isProtected(plot, to);
      for (const tile of plot.tiles) {
        if ((tile.state !== 'growing' && tile.state !== 'ready') || tile.sick) continue;
        if ((tile.guardUntil || 0) >= to || covered) { guarded++; continue; }
        let p = d.spread * (plot.greenhouse ? DISEASE.greenhouseFactor : 1);
        if (today.disease === 'fungus' && (today.type === 'rain' || wt.fungusBoost)) p *= DISEASE.rainBoostFungus;
        if (d.lowFertBoost && !tile.fert) p *= d.lowFertBoost;
        if (rng() < Math.min(0.95, p)) { tile.sick = today.disease; infected++; }
      }
    }
    events.push({ type: 'outbreak', disease: today.disease, infected, guarded, silent: offline });
  }

  // nhắc nhở buổi tối nếu ngày mai có thiên tai / dịch bệnh
  if (!offline && crossed(from, to, dayStart + 20 * 60)) {
    const tm = save.weather.tomorrow;
    if (WEATHER[tm.type].disaster || tm.disease) events.push({ type: 'remind', tomorrow: tm });
  }
  return events;
}

/** Hạn bảo vệ (bạt che / thuốc phòng): đến hết ngày mai */
export const protectUntil = (now) => endOfDay(dayOf(now) + 1);
