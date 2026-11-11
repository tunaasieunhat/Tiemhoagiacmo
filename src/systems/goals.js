// =============================================================
//  🏅 THÀNH TỰU · 📅 SỰ KIỆN TUẦN · 🏪 QUY MÔ TIỆM (GĐ18) — LOGIC THUẦN
//  save.ach   = { claimed: { id: số bậc đã nhận (0–3) }, title: id thành tựu đang đeo danh hiệu | null }
//  save.event = { week: '2026-W45', theme: id, pts, claimed: [chỉ số mốc], completed: số tuần về đích }
//  save.shopLevel = 0..3
// =============================================================
import { ACHIEVEMENTS, ACH_TIERS } from '../../data/achievements.js';
import { EVENT_THEMES, EVENT_POINTS, EVENT_MILESTONES, EVENT_RULES } from '../../data/events.js';
import { SHOP_TIERS } from '../../data/shopTiers.js';
import { LUCK_FLOWER_IDS } from '../../data/flowers.js';
import { roundOf } from './contest.js';
import { beautyOf } from './decor.js';
import { heartsOf } from './relations.js';
import { VILLAGER_IDS } from './village.js';
import { extraBeauty } from './story.js';

export const createAchState = () => ({ claimed: {}, title: null });
export const createEventState = () => ({ week: null, theme: null, pts: 0, claimed: [], completed: 0 });

// ---------------- 🏅 thành tựu ----------------
/** Giá trị hiện tại của 1 chỉ số */
export function statValue(save, stat) {
  const st = save.stats || {};
  switch (stat) {
    case 'orders': return save.orders?.done || 0;
    case 'colors': return Object.keys(save.book?.found || {}).length;
    case 'hearts': return VILLAGER_IDS.reduce((a, id) => a + heartsOf(save, id), 0);
    case 'plots': return save.farm.plots.length;
    case 'beauty': return beautyOf(save.decor?.placed || []) + extraBeauty(save);
    case 'chapters': return Object.keys(save.story?.done || {}).length;
    case 'luckSpecies': return LUCK_FLOWER_IDS.filter((id) => (save.luck?.got?.[id] || 0) > 0).length;
    case 'level': return save.player.level;
    case 'events': return save.event?.completed || 0;
    default: return st[stat] || 0;
  }
}

/** Trạng thái từng thành tựu: { a, value, reached (số bậc đạt), claimed, next (mốc kế) } */
export function achList(save) {
  const cl = save.ach?.claimed || {};
  return ACHIEVEMENTS.map((a) => {
    const value = statValue(save, a.stat);
    const reached = a.n.filter((n) => value >= n).length;
    const claimed = Math.min(cl[a.id] || 0, reached);
    return { a, value, reached, claimed, next: a.n[reached] ?? null };
  });
}

/** Tổng số huy chương đã đạt (mỗi bậc = 1) */
export const medalCount = (save) => achList(save).reduce((s, x) => s + x.reached, 0);
export const claimableAch = (save) => achList(save).reduce((s, x) => s + (x.reached - x.claimed), 0);

/** Cộng phần thưởng chung { coins, luck, gold, shard, fertilizer } */
export function grantReward(save, rw = {}) {
  if (rw.coins) save.player.coins += rw.coins;
  if (rw.fertilizer) save.inventory.items.fertilizer = (save.inventory.items.fertilizer || 0) + rw.fertilizer;
  if (rw.luck || rw.gold || rw.shard) {
    save.luck = save.luck || { tickets: { luck: 0, gold: 0 }, shards: 0 };
    if (rw.luck) save.luck.tickets.luck = (save.luck.tickets.luck || 0) + rw.luck;
    if (rw.gold) save.luck.tickets.gold = (save.luck.tickets.gold || 0) + rw.gold;
    if (rw.shard) save.luck.shards = (save.luck.shards || 0) + rw.shard;
  }
}

export function rewardText(rw = {}) {
  return [rw.coins && `${rw.coins} 💰`, rw.luck && `${rw.luck} 🎟️`, rw.gold && `${rw.gold} 🎫`, rw.shard && `${rw.shard} 🧩`, rw.fertilizer && `${rw.fertilizer} 🧪`].filter(Boolean).join(' + ');
}

/** Nhận thưởng bậc kế tiếp của 1 thành tựu */
export function claimAch(save, id) {
  save.ach = save.ach || createAchState();
  const x = achList(save).find((q) => q.a.id === id);
  if (!x || x.claimed >= x.reached) return { ok: false, msg: 'Chưa đủ điều kiện nhận' };
  const tier = x.claimed;
  const rw = x.a.rewards[tier] || {};
  grantReward(save, rw);
  save.ach.claimed[id] = tier + 1;
  const unlockTitle = tier + 1 === 2;
  if (unlockTitle && !save.ach.title) save.ach.title = id;
  return { ok: true, a: x.a, tier, rw, unlockTitle };
}

/** Danh hiệu đã mở (đạt bậc Bạc trở lên & đã nhận) */
export const titlesOf = (save) => ACHIEVEMENTS.filter((a) => (save.ach?.claimed?.[a.id] || 0) >= 2);
export function titleOf(save) {
  const id = save.ach?.title;
  const a = ACHIEVEMENTS.find((q) => q.id === id);
  if (!a || (save.ach.claimed[id] || 0) < 2) return null;
  const gold = (save.ach.claimed[id] || 0) >= 3;
  return { id, text: a.title, icon: gold ? ACH_TIERS[2].icon : ACH_TIERS[1].icon };
}
export function setTitle(save, id) {
  save.ach = save.ach || createAchState();
  if (id && !titlesOf(save).some((a) => a.id === id)) return false;
  save.ach.title = id || null;
  return true;
}

// ---------------- 📅 sự kiện tuần ----------------
export function themeOfWeek(weekId) {
  const m = /(\d+)-W(\d+)/.exec(weekId || '');
  const n = m ? +m[1] * 53 + +m[2] : 0;
  return EVENT_THEMES[n % EVENT_THEMES.length];
}

/** Đảm bảo sự kiện là của tuần hiện tại (sang tuần mới thì làm mới điểm). Trả về { ev, theme, round, changed } */
export function ensureEvent(save, ms = Date.now()) {
  save.event = save.event || createEventState();
  const ev = save.event;
  const round = roundOf(ms);
  let changed = false;
  if (ev.week !== round.id) {
    ev.week = round.id;
    ev.theme = themeOfWeek(round.id).id;
    ev.pts = 0;
    ev.claimed = [];
    changed = true;
  }
  return { ev, theme: EVENT_THEMES.find((t) => t.id === ev.theme) || themeOfWeek(round.id), round, changed };
}

/** Cộng điểm sự kiện. kind: harvest | sell | bouquet | perfect | bug | order | favor; ctx.species để xét loài chủ đề */
export function addEventPoints(save, kind, ctx = {}, ms = Date.now()) {
  if (save.player.level < EVENT_RULES.unlockLevel) return 0;
  const { ev, theme } = ensureEvent(save, ms);
  const inTheme = (sp) => theme.flowers.includes(sp);
  let pts = 0;
  if (kind === 'harvest' && inTheme(ctx.species)) pts = EVENT_POINTS.harvestTheme;
  else if (kind === 'sell') pts = (ctx.items || []).reduce((a, it) => a + (inTheme(it.species) ? EVENT_POINTS.sellTheme * it.n : 0), 0)
    + (ctx.bouquet && (ctx.items || []).some((it) => inTheme(it.species)) ? EVENT_POINTS.bouquetTheme : 0)
    + (ctx.perfect ? EVENT_POINTS.perfect : 0);
  else if (kind === 'bug') pts = EVENT_POINTS.bug * (theme.bugMult || 1);
  else if (kind === 'order') pts = EVENT_POINTS.order;
  else if (kind === 'favor') pts = EVENT_POINTS.favor;
  if (!pts) return 0;
  const before = ev.pts;
  ev.pts += pts;
  const reachedNew = EVENT_MILESTONES.filter((m) => before < m.pts && ev.pts >= m.pts).length;
  return { pts, reachedNew };
}

export const claimableEvent = (save) => {
  const ev = save.event;
  if (!ev || save.player.level < EVENT_RULES.unlockLevel) return 0;
  return EVENT_MILESTONES.filter((m, i) => ev.pts >= m.pts && !ev.claimed.includes(i)).length;
};

/** Nhận quà 1 mốc. Mốc cuối: tặng đồ trang trí sự kiện (đã có thì đổi thành 🎫) */
export function claimEvent(save, idx, ms = Date.now()) {
  const { ev, theme } = ensureEvent(save, ms);
  const m = EVENT_MILESTONES[idx];
  if (!m || ev.pts < m.pts || ev.claimed.includes(idx)) return { ok: false, msg: 'Chưa đạt mốc này' };
  const rw = { ...m.reward };
  let decor = null;
  if (rw.eventDecor) {
    delete rw.eventDecor;
    decor = theme.decor;
    const has = (save.decor.owned[decor] || 0) + (save.decor.placed || []).filter((p) => p.id === decor).length;
    if (has) { rw.gold = (rw.gold || 0) + 1; decor = null; } else save.decor.owned[decor] = 1;
  }
  grantReward(save, rw);
  ev.claimed.push(idx);
  if (idx === EVENT_MILESTONES.length - 1) ev.completed = (ev.completed || 0) + 1;
  return { ok: true, rw, decor, theme };
}

// ---------------- 🏪 quy mô tiệm ----------------
export const shopTier = (save) => SHOP_TIERS[Math.min(save.shopLevel || 0, SHOP_TIERS.length - 1)];

/** Điều kiện nâng lên quy mô kế: { next, ok, checks: [{ text, ok }] } */
export function shopUpgradeInfo(save) {
  const lv = save.shopLevel || 0;
  const next = SHOP_TIERS[lv + 1];
  if (!next) return { next: null, ok: false, checks: [] };
  const medals = medalCount(save);
  const checks = [
    { text: `Cấp ${next.level}`, ok: save.player.level >= next.level },
    { text: `Uy tín ${next.rep} 💗`, ok: (save.player.reputation || 0) >= next.rep },
    { text: `${next.medals} huy chương thành tựu (đang có ${medals})`, ok: medals >= next.medals },
    { text: `${next.cost.toLocaleString('vi-VN')} 💰`, ok: save.player.coins >= next.cost },
  ];
  return { next, ok: checks.every((c) => c.ok), checks };
}

export function upgradeShop(save) {
  const info = shopUpgradeInfo(save);
  if (!info.next) return { ok: false, msg: 'Tiệm đã đạt quy mô lớn nhất' };
  if (!info.ok) return { ok: false, msg: `Chưa đủ điều kiện: ${info.checks.filter((c) => !c.ok).map((c) => c.text).join(', ')}` };
  save.player.coins -= info.next.cost;
  save.stats.spent = (save.stats.spent || 0) + info.next.cost;
  save.shopLevel = (save.shopLevel || 0) + 1;
  return { ok: true, tier: info.next };
}
