// =============================================================
//  📅 KẾ HOẠCH HÔM NAY & LỊCH TUẦN (GĐ25) — logic thuần
//  save.plan = { day, tasks: [{ kind, n, who, base, got }], bonus, trader: { week, bought: { vkey: n } } }
//  Tiến độ mỗi việc = bộ đếm hiện tại − bộ đếm lúc đầu ngày (base) ⇒ không cần chèn code đếm khắp nơi.
// =============================================================
import { PLAN_RULES, PLAN_TASKS, WEEKDAYS, TRADER } from '../../data/plan.js';
import { FLOWERS } from '../../data/flowers.js';
import { VARIANTS } from '../../data/variants.js';
import { calendarOf } from './calendar.js';

const hash = (str) => { let h = 2166136261; for (const c of String(str)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
const rngOf = (seed) => { let x = seed || 1; return () => { x = (x * 1103515245 + 12345) & 0x7fffffff; return x / 0x7fffffff; }; };

export const createPlanState = () => ({ day: 0, tasks: [], bonus: false, trader: { week: 0, bought: {} } });
export function P(save) {
  save.plan = save.plan || createPlanState();
  save.plan.trader = save.plan.trader || { week: 0, bought: {} };
  return save.plan;
}

/** Chủ đề hôm nay (ngày 1 của mùa = Thứ Hai) */
export const weekdayOf = (day) => WEEKDAYS[(calendarOf(day).dayOfSeason - 1) % WEEKDAYS.length];
/** Hệ số hiệu ứng hôm nay, vd effect(day, 'wholesale') → 1,3 vào Thứ Hai, còn lại 1 */
export const effect = (day, key) => weekdayOf(day).effect[key] ?? (key === 'trader' ? false : 1);

/** Bộ đếm tiến độ (đọc từ save) */
export function statOf(save, stat, who, day) {
  const st = save.stats || {};
  switch (stat) {
    case 'talk': return save.village?.rel?.[who]?.talkDay === day ? 1 : 0;
    case 'gift': return save.village?.rel?.[who]?.giftDay === day ? 1 : 0;
    case 'orders': return save.orders?.done || 0;
    case 'fish': return save.fish?.caught || 0;
    case 'gather': return Object.entries(save.craft?.count || {}).filter(([k]) => k.startsWith('gather:')).reduce((a, [, n]) => a + n, 0);
    case 'made': return Object.entries(save.craft?.count || {}).filter(([k]) => k.startsWith('made:')).reduce((a, [, n]) => a + n, 0);
    case 'parties': return save.party?.done || 0;
    case 'ships': return save.branch?.ships || 0;
    case 'scenes': return Object.keys(save.story?.seen || {}).length;
    default: return st[stat] || 0;
  }
}

/**
 * Lập kế hoạch cho ngày mới (cố định theo ngày). ctx: { level, has: { orders, fishing, huong, party, branch, story },
 *   villagers: [id đã quen], birthday: id | null, names: { id: tên } }
 */
export function makePlan(save, day, ctx = {}) {
  const p = P(save);
  if (p.day === day && p.tasks.length) return false;
  const r = rngOf(hash(`plan|${day}|${save.player?.name || ''}`));
  const has = ctx.has || {};
  const ok = (t) => !t.need || (t.need === 'level3' ? (ctx.level || 1) >= 3 : !!has[t.need]);
  const pool = Object.keys(PLAN_TASKS).filter((k) => ok(PLAN_TASKS[k]) && k !== 'talk' && k !== 'birthday');
  const picks = [];
  if (ctx.birthday) picks.push('birthday');
  if (ctx.villagers?.length) picks.push('talk');
  if (has.story && pool.includes('story') && r() < 0.6) picks.push('story');
  // ngày đặc biệt ưu tiên việc hợp chủ đề
  const wd = weekdayOf(day);
  if (wd.effect.party && pool.includes('party')) picks.push('party');
  if (wd.effect.shipTime && pool.includes('ship')) picks.push('ship');
  while (picks.length < PLAN_RULES.tasks) {
    const left = pool.filter((k) => !picks.includes(k));
    if (!left.length) break;
    picks.push(left[Math.floor(r() * left.length)]);
  }
  const lvl = Math.min(1, (ctx.level || 1) / 30);
  p.day = day;
  p.bonus = false;
  p.tasks = picks.slice(0, PLAN_RULES.tasks).map((kind) => {
    const T = PLAN_TASKS[kind];
    const n = Math.round(T.n[0] + (T.n[1] - T.n[0]) * lvl * (0.7 + r() * 0.3));
    let who = null;
    if (kind === 'talk') who = ctx.villagers[Math.floor(r() * ctx.villagers.length)];
    if (kind === 'birthday') who = ctx.birthday;
    return { kind, n: Math.max(1, n), who, base: statOf(save, T.stat, who, day), got: false };
  });
  return true;
}

/** Tiến độ từng việc: [{ ...task, T, have, done, text }] */
export function progress(save, day, names = {}) {
  return P(save).tasks.map((t) => {
    const T = PLAN_TASKS[t.kind];
    const raw = statOf(save, T.stat, t.who, day);
    const have = ['talk', 'gift'].includes(T.stat) ? raw : Math.max(0, raw - t.base);
    return { ...t, T, have: Math.min(t.n, have), done: have >= t.n, text: T.text.replace('{n}', t.n).replace('{who}', names[t.who] || '') };
  });
}

/** Xét việc vừa xong: trả về { tasks: [việc mới xong], bonus: bool } và đánh dấu đã nhận (game cộng thưởng) */
export function check(save, day, names = {}) {
  const p = P(save);
  if (p.day !== day) return { tasks: [], bonus: false };
  const out = { tasks: [], bonus: false };
  for (const t of progress(save, day, names)) {
    if (t.done && !t.got) { p.tasks.find((x) => x.kind === t.kind).got = true; out.tasks.push(t); }
  }
  if (!p.bonus && p.tasks.length && p.tasks.every((t) => t.got)) { p.bonus = true; out.bonus = true; }
  return out;
}

// ---------------- 🚢 Thuyền buôn Thứ Tư ----------------
/** 3 món hạt màu hiếm/ít gặp của tuần (cố định theo tuần) */
export function traderOffers(save, day, level = 1) {
  const week = Math.floor((day - 1) / 7);
  const r = rngOf(hash(`trader|${week}|${save.player?.name || ''}`));
  const all = [];
  for (const [sp, vs] of Object.entries(VARIANTS)) {
    const F = FLOWERS[sp];
    if (!F || F.luck || F.unlockLevel > level) continue;
    for (const [v, d] of Object.entries(vs)) if (['uncommon', 'rare'].includes(d.rarity) && !d.default) all.push({ vkey: `${sp}:${v}`, sp, v, rarity: d.rarity, price: Math.round(F.seedPrice * TRADER.priceMult * (d.rarity === 'rare' ? 1.6 : 1)) });
  }
  const out = [];
  while (out.length < TRADER.offers && all.length) out.push(all.splice(Math.floor(r() * all.length), 1)[0]);
  const p = P(save);
  if (p.trader.week !== week) p.trader = { week, bought: {} };
  return out.map((o) => ({ ...o, left: TRADER.stock - (p.trader.bought[o.vkey] || 0) }));
}

export function buyTrader(save, day, vkey, level = 1) {
  if (!effect(day, 'trader')) return { ok: false, msg: 'Thuyền buôn chỉ ghé vào Thứ Tư' };
  const o = traderOffers(save, day, level).find((x) => x.vkey === vkey);
  if (!o || o.left <= 0) return { ok: false, msg: 'Món này đã bán hết' };
  if (save.player.coins < o.price) return { ok: false, msg: `Không đủ tiền (cần ${o.price} 💰)` };
  save.player.coins -= o.price;
  save.stats.spent = (save.stats.spent || 0) + o.price;
  save.inventory.seeds[vkey] = (save.inventory.seeds[vkey] || 0) + 1;
  const p = P(save);
  p.trader.bought[vkey] = (p.trader.bought[vkey] || 0) + 1;
  return { ok: true, msg: `🚢 Đã mua 1 hạt ${FLOWERS[o.sp].name} màu hiếm!`, price: o.price };
}
