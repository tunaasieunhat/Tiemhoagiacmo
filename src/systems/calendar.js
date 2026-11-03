// Lịch: mùa, ngày trong mùa, năm, lễ hội (thuần dữ liệu)
import { CALENDAR, SEASONS, SEASON_EFFECT, FESTIVALS } from '../../data/seasons.js';
import { FLOWERS } from '../../data/flowers.js';

export const MIN_PER_DAY = 1440;
export const dayOf = (minutes) => Math.floor(minutes / MIN_PER_DAY) + 1;
/** phút game lúc kết thúc ngày "day" */
export const endOfDay = (day) => day * MIN_PER_DAY;

export function calendarOf(day) {
  const D = CALENDAR.daysPerSeason;
  const yd = (day - 1) % (4 * D);
  const seasonIndex = Math.floor(yd / D);
  return { day, seasonIndex, season: SEASONS[seasonIndex], dayOfSeason: (yd % D) + 1, year: Math.floor((day - 1) / (4 * D)) + 1 };
}

export function festivalOn(day) {
  const c = calendarOf(day);
  // nếu trùng nhiều lễ (vd 20/10 nằm trong Mùa cưới) thì ưu tiên lễ ngắn ngày hơn
  const list = FESTIVALS.filter((f) => f.season === c.season.id && f.days.includes(c.dayOfSeason));
  return list.sort((a, b) => a.days.length - b.days.length)[0] || null;
}

export function inSeason(flowerId, day) {
  return (FLOWERS[flowerId]?.seasons || []).includes(calendarOf(day).season.id);
}

/** Hệ số tốc độ lớn theo mùa (nhà kính: trái mùa vẫn lớn bình thường) */
export function seasonGrowMult(flowerId, day, greenhouse = false) {
  if (inSeason(flowerId, day)) return SEASON_EFFECT.inSeasonSpeed;
  return greenhouse ? 1 : SEASON_EFFECT.outSeasonSpeed;
}

/** Các lễ hội sắp tới trong vòng 1 năm: [{festival, day, inDays}] */
export function upcomingFestivals(fromDay, count = 3) {
  const out = [];
  const seen = new Set();
  for (let d = fromDay; d < fromDay + 4 * CALENDAR.daysPerSeason && out.length < count; d++) {
    const f = festivalOn(d);
    if (f && !seen.has(f.id)) { seen.add(f.id); out.push({ festival: f, day: d, inDays: d - fromDay }); }
  }
  return out;
}

export function seasonFlowers(day) {
  const id = calendarOf(day).season.id;
  return Object.keys(FLOWERS).filter((f) => FLOWERS[f].seasons.includes(id));
}
