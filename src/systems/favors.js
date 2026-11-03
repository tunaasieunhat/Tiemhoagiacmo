// Dân làng nhờ việc (GĐ12) — LOGIC THUẦN: hôm nay ai nhờ việc gì, tính thưởng theo số sao.
import { FAVORS, FAVOR_RULES } from '../../data/minigames.js';
import { relOf, addFp } from './relations.js';

/** Số giả ngẫu nhiên cố định theo (ngày, người) — mở lại game trong ngày không đổi */
function hash01(day, id) {
  let h = 0;
  for (const c of id) h = (Math.imul(h, 31) + c.charCodeAt(0)) | 0;
  let t = (Math.imul(day, 2654435761) ^ h) >>> 0; // trộn kiểu mulberry32
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/** Việc nhờ hôm nay của người này (null nếu hôm nay không nhờ hoặc đã làm) */
export function todaysFavor(save, id, day) {
  const list = FAVORS[id];
  if (!list?.length) return null;
  const r = relOf(save, id);
  if (r.favorDay === day) return null;
  const firstTime = !r.favors;
  if (!firstTime && hash01(day, id) > FAVOR_RULES.dailyChance) return null;
  return list[Math.floor(hash01(day + 17, id) * list.length) % list.length];
}

/** Xong mini game: stars 0–3. Trả về { fp, coins, xp, ...kết quả addFp } */
export function finishFavor(save, id, favor, stars, day) {
  const r = relOf(save, id);
  const s = Math.max(0, Math.min(3, stars | 0));
  r.favorDay = day;
  r.favors = r.favors || {};
  const f = r.favors[favor.id] || (r.favors[favor.id] = { done: 0, best: 0 });
  f.done += 1;
  f.best = Math.max(f.best, s);
  const coins = FAVOR_RULES.coins[s];
  save.player.coins += coins;
  const res = addFp(save, id, FAVOR_RULES.fp[s]);
  return { stars: s, fp: FAVOR_RULES.fp[s], coins, xp: FAVOR_RULES.xp[s], best: f.best, ...res };
}
