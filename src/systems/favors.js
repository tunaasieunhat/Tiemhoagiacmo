// Dân làng nhờ việc (GĐ12) — LOGIC THUẦN: hôm nay ai nhờ việc gì, tính thưởng theo số sao.
import { FAVORS, FAVOR_RULES, DIFFICULTY, MINIGAMES, MG_LEVELS } from '../../data/minigames.js';
import { relOf, addFp, heartsOf } from './relations.js';

/** Mức khó (0 Dễ · 1 Vừa · 2 Khó) theo số tim với người nhờ (GĐ17) */
export function difficultyOf(save, id) {
  const h = heartsOf(save, id);
  let lv = 0;
  DIFFICULTY.heartsFor.forEach((need, i) => { if (h >= need) lv = i; });
  return lv;
}

/** Số liệu mini game đã áp mức khó */
export function scaledConfig(kind, lv = 0) {
  const base = MINIGAMES[kind];
  if (!base) return null;
  const cfg = { ...base, level: lv };
  for (const [k, arr] of Object.entries(MG_LEVELS[kind] || {})) cfg[k] = arr[Math.max(0, Math.min(arr.length - 1, lv))];
  return cfg;
}

/** Ghi kỷ lục mini game: save.mg[kind] = { plays, best, perfect, combo } — trả về { newBest, rec } */
export function recordMiniGame(save, kind, stars, combo = 0) {
  save.mg = save.mg || {};
  const rec = save.mg[kind] || (save.mg[kind] = { plays: 0, best: 0, perfect: 0, combo: 0 });
  const newBest = stars > rec.best || (combo > (rec.combo || 0) && stars >= rec.best && stars > 0);
  rec.plays += 1;
  rec.best = Math.max(rec.best, stars);
  if (stars >= 3) rec.perfect += 1;
  rec.combo = Math.max(rec.combo || 0, combo);
  return { newBest, rec };
}

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
export function finishFavor(save, id, favor, stars, day, lv = 0) {
  const r = relOf(save, id);
  const s = Math.max(0, Math.min(3, stars | 0));
  r.favorDay = day;
  r.favors = r.favors || {};
  const f = r.favors[favor.id] || (r.favors[favor.id] = { done: 0, best: 0 });
  f.done += 1;
  f.best = Math.max(f.best, s);
  const mult = FAVOR_RULES.diffMult?.[lv] ?? 1; // khó hơn thì thưởng nhiều hơn
  const coins = Math.round(FAVOR_RULES.coins[s] * mult);
  const fp = Math.round(FAVOR_RULES.fp[s] * mult);
  save.player.coins += coins;
  const res = addFp(save, id, fp);
  return { stars: s, fp, coins, xp: FAVOR_RULES.xp[s], best: f.best, level: lv, ...res };
}
